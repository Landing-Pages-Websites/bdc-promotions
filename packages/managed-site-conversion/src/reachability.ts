import ts from "typescript";

import { findComponentDeclarations, type ComponentDeclaration } from "./extract.js";
import { isComponentName, isTransparentWrapper, unwrapTransparent } from "./jsx-facts.js";
import { walkRenderOutput, EVERY_TRIGGER, type UnreadableRender } from "./render-output.js";
import type { Finding } from "./report.js";
import { declarationOfName, scopeOfDeclaration } from "./scopes.js";
import {
  evidenceOf,
  importedBindingsOf,
  lineOf,
  reExportsOf,
  type ModuleCache,
  type ModuleReference,
  type ParsedModule,
} from "./scan.js";

/**
 * What a route actually renders.
 *
 * A declaration is only customer content when a visitor can reach it: the
 * route's default export, the default export of every layout wrapping it, and
 * whatever those transitively render. A capitalized export sitting beside a page
 * renders nothing, so proposing fields for it would hand the customer an editor
 * for markup the browser never shows.
 *
 * Where the chain cannot be followed — a component picked at runtime, a prop
 * holding a component, an import that does not resolve — the subtree is left out
 * AND a finding names the spot. Failing closed in silence would hide exactly the
 * same coverage gap it is meant to prevent.
 */

export interface RenderTree {
  readonly components: readonly ComponentDeclaration[];
  readonly findings: readonly Finding[];
}

const DEFAULT_EXPORT = "default";
const MEMBER_SEPARATOR = ".";

type Resolution =
  | { readonly kind: "declaration"; readonly declaration: ComponentDeclaration }
  /** Declared outside the repository, so there is nothing of ours to inspect. */
  | { readonly kind: "external" }
  | { readonly kind: "missing_module"; readonly reference: ModuleReference }
  | { readonly kind: "unresolved" };

const EXTERNAL: Resolution = { kind: "external" };
const UNRESOLVED: Resolution = { kind: "unresolved" };

/** Positions only mean anything within one source file. */
function encloses(outer: ts.Node, inner: ts.Node): boolean {
  return outer !== inner && outer.pos <= inner.pos && outer.end >= inner.end;
}

function isNestedIn(inner: ComponentDeclaration, outer: ComponentDeclaration): boolean {
  return inner.module.file === outer.module.file && encloses(outer.jsxRoot, inner.jsxRoot);
}

/**
 * Two declarations of one name in one file are told apart by where they are
 * written. Keying on the name alone would drop the second silently, where the
 * confidence gate exists to withhold both loudly.
 */
export function declarationKey(declaration: ComponentDeclaration): string {
  return `${declaration.module.file}#${declaration.name}@${declaration.jsxRoot.pos}`;
}

function isDefaultExported(statement: ts.Statement): boolean {
  return ts.canHaveModifiers(statement)
    ? (ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
      )
    : false;
}

function defaultExportStatement(module: ParsedModule): ts.Statement | null {
  for (const statement of module.source.statements) {
    if (ts.isExportAssignment(statement) && statement.isExportEquals !== true) return statement;
    if (isDefaultExported(statement)) return statement;
  }
  return null;
}

/** The local name a module's default export refers to, when it has one at all. */
function defaultExportName(module: ParsedModule): string | null {
  const statement = defaultExportStatement(module);
  if (statement === null) return null;
  if (ts.isExportAssignment(statement)) {
    return ts.isIdentifier(statement.expression) ? statement.expression.text : null;
  }
  if (ts.isFunctionDeclaration(statement)) return statement.name?.text ?? null;
  if (ts.isClassDeclaration(statement)) return statement.name?.text ?? null;
  return null;
}

interface RenderedTag {
  readonly name: string;
  readonly node: ts.Node;
}

interface RenderedOutput {
  readonly tags: readonly RenderedTag[];
  /** Hand-offs of a JSX-writing function whose rendering could not be read. */
  readonly unreadable: readonly UnreadableRender[];
}

const RENDERED_OUTPUT = new WeakMap<ts.Node, RenderedOutput>();

/**
 * What a human is asked to decide, by what the function was handed to. The two
 * are separate sentences because they are separate questions: a call renders
 * its result where the call is written, so the fix is local, while a component
 * renders a prop wherever its own declaration says, which is where the reader
 * has to look.
 */
const UNREADABLE_DECISION: Readonly<Record<UnreadableRender["kind"], string>> = {
  call:
    "This call is given a function that writes JSX, but whether the call's " +
    "result is rendered could not be read, so nothing inside it was " +
    "inspected. Render the result where it is written, or convert this " +
    "subtree by hand. Nothing was proposed for it.",
  attribute:
    "A component is given this function, which writes JSX, but only that " +
    "component decides whether it renders what the function returns, and an " +
    "attribute is written the same way whether it does or not. Nothing inside " +
    "was inspected. Write the JSX where it renders, or convert this subtree " +
    "by hand. Nothing was proposed for it.",
};

/**
 * Every component-shaped tag this declaration renders, each named once, and
 * every call it could not read. Which nested functions count is
 * `render-output.ts`'s decision; this reading follows a name wherever the
 * browser would, so it admits every trigger.
 *
 * Cached because a walker is built per route, so a layout's components and
 * everything they render would otherwise be re-walked once for every route on
 * the site. The answer depends only on the syntax below `jsxRoot`, which never
 * changes once parsed.
 */
function renderedOutputOf(declaration: ComponentDeclaration): RenderedOutput {
  const cached = RENDERED_OUTPUT.get(declaration.jsxRoot);
  if (cached !== undefined) return cached;
  // EVERY occurrence, not one per name. Which declaration a tag names depends
  // on where it is written, so two `<Item />` in different scopes are two
  // render targets — and keeping only the first let whichever was seen first
  // answer for both, leaving the other component unwalked. Resolution
  // deduplicates by declaration afterwards, which is the identity that matters.
  const tags: RenderedTag[] = [];
  const walk = walkRenderOutput(declaration.jsxRoot, EVERY_TRIGGER, (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(declaration.module.source);
      if (isComponentName(name)) tags.push({ name, node });
    }
    return false;
  });
  const found: RenderedOutput = { tags, unreadable: walk.unreadable };
  RENDERED_OUTPUT.set(declaration.jsxRoot, found);
  return found;
}

class RenderWalker {
  readonly #cache: ModuleCache;
  readonly #repositoryRoot: string;
  readonly #declarations = new Map<string, readonly ComponentDeclaration[]>();
  readonly #visited = new Set<string>();
  readonly #components: ComponentDeclaration[] = [];
  readonly #findings: Finding[] = [];

  constructor(cache: ModuleCache, repositoryRoot: string) {
    this.#cache = cache;
    this.#repositoryRoot = repositoryRoot;
  }

  walk(entryFiles: readonly string[]): RenderTree {
    for (const file of entryFiles) this.#enterModule(file);
    return { components: this.#components, findings: this.#findings };
  }

  #enterModule(file: string): void {
    const entry = this.#cache.read(file);
    const resolution = this.#resolveExport(entry, DEFAULT_EXPORT, new Set());
    if (resolution.kind === "declaration") {
      this.#visit(resolution.declaration);
      return;
    }
    const statement = defaultExportStatement(entry);
    this.#findings.push({
      code: "UNRESOLVED_RENDER_TARGET",
      anchor: null,
      location: { file, line: statement === null ? 1 : lineOf(entry.source, statement) },
      evidence:
        statement === null ? "no default export" : evidenceOf(entry.source, statement),
      decision:
        "This route or layout does not export a named component, so nothing it " +
        "renders was inspected. Give the default export a name, then re-run.",
    });
  }

  #visit(declaration: ComponentDeclaration): void {
    const key = declarationKey(declaration);
    if (this.#visited.has(key)) return;
    this.#visited.add(key);
    this.#components.push(declaration);
    const rendered = renderedOutputOf(declaration);
    for (const entry of rendered.unreadable) this.#reportUnreadable(entry, declaration);
    for (const tag of rendered.tags) this.#follow(tag, declaration);
  }

  /**
   * A function that writes JSX was handed to something whose rendering could
   * not be read. Following it would propose markup for something no visitor may
   * reach, and dropping it quietly would hide the same gap, so nothing inside
   * is read and the place it was handed over is named.
   */
  #reportUnreadable(entry: UnreadableRender, from: ComponentDeclaration): void {
    this.#findings.push({
      code: "UNRESOLVED_RENDER_TARGET",
      anchor: null,
      location: { file: from.module.file, line: lineOf(from.module.source, entry.node) },
      evidence: evidenceOf(from.module.source, entry.node),
      decision: UNREADABLE_DECISION[entry.kind],
    });
  }

  /**
   * The declaration a JSX tag names, or null when it is not ours to read. This
   * is the SAME resolution the render walk follows — exposed rather than
   * reimplemented, so a second reader cannot come to disagree with it about
   * what `<Hero />` refers to.
   */
  resolveTag(tagName: string, from: ComponentDeclaration): ComponentDeclaration | null {
    const resolution = this.#resolutionOf(tagName, from);
    return resolution.kind === "declaration" ? resolution.declaration : null;
  }

  /**
   * `at` is the JSX the tag is written in, when the caller has it.
   *
   * Component ancestry alone is not lexical scope: a declaration in one block
   * and a tag in a SIBLING block share an enclosing component, and answering
   * by ancestry made the walk extract markup the page cannot reach and
   * classify props from a receiver it never renders. With the use site in
   * hand the question is asked the way the language answers it — the nearest
   * binding, and only what the module itself binds when there is none.
   */
  #resolutionOf(
    tagName: string,
    from: ComponentDeclaration,
    at?: ts.Node,
  ): Resolution {
    const [root = tagName, ...members] = tagName.split(MEMBER_SEPARATOR);
    // The ROOT of a dotted tag is a name like any other, so it is checked for a
    // nearer binding BEFORE the namespace is resolved. Resolving the member
    // first skipped shadowing entirely: a parameter called `UI` renders, while
    // the analyzer read `UI.Card` from the import.
    if (at !== undefined && nearestBinding(at, root) !== null) {
      return members.length === 0
        ? declarationResolution(componentDeclaredBy(nearestBinding(at, root)!, from.module))
        : UNRESOLVED;
    }
    if (members.length > 0) return this.#resolveMember(from.module, root, members);
    if (at !== undefined) return this.#resolveName(from.module, root, new Set(), null);
    return this.#resolveName(from.module, root, new Set(), from);
  }

  #follow(tag: RenderedTag, from: ComponentDeclaration): void {
    const resolution = this.#resolutionOf(tag.name, from, tag.node);
    if (resolution.kind === "external") return;
    if (resolution.kind === "declaration") {
      this.#visit(resolution.declaration);
      return;
    }
    if (resolution.kind === "missing_module") {
      this.#findings.push(unresolvedImportFinding(resolution.reference, from.module.file));
      return;
    }
    this.#findings.push({
      code: "UNRESOLVED_RENDER_TARGET",
      anchor: null,
      location: { file: from.module.file, line: lineOf(from.module.source, tag.node) },
      evidence: evidenceOf(from.module.source, tag.node),
      decision:
        `'${tag.name}' does not name a component declared in this repository, so ` +
        "what it renders could not be read. Render a named component here, or " +
        "convert this subtree by hand. Nothing was proposed for it.",
    });
  }

  /** `<Icons.Check />` is only followable through a namespace import of our own code. */
  #resolveMember(
    module: ParsedModule,
    root: string,
    members: readonly string[],
  ): Resolution {
    const binding = importedBindingsOf(module, this.#repositoryRoot).get(root);
    if (binding === undefined) return UNRESOLVED;
    if (!binding.isRepositoryLocal) return EXTERNAL;
    if (binding.resolvedFile === null) return { kind: "missing_module", reference: binding };
    const [member] = members;
    if (binding.importedName !== null || member === undefined || members.length > 1) {
      return UNRESOLVED;
    }
    return this.#resolveExport(this.#cache.read(binding.resolvedFile), member, new Set());
  }

  /**
   * `scope` is the component the name is written inside, or null for a name a
   * second module imported, which only module-level declarations can satisfy.
   */
  #resolveName(
    module: ParsedModule,
    name: string,
    seen: Set<string>,
    scope: ComponentDeclaration | null,
  ): Resolution {
    const declared = this.#declarationInScope(module, name, scope);
    if (declared !== undefined) return { kind: "declaration", declaration: declared };
    const binding = importedBindingsOf(module, this.#repositoryRoot).get(name);
    if (binding === undefined) return UNRESOLVED;
    if (!binding.isRepositoryLocal) return EXTERNAL;
    if (binding.resolvedFile === null) return { kind: "missing_module", reference: binding };
    if (binding.importedName === null) return UNRESOLVED;
    return this.#resolveExport(
      this.#cache.read(binding.resolvedFile),
      binding.importedName,
      seen,
    );
  }

  #resolveExport(module: ParsedModule, exportName: string, seen: Set<string>): Resolution {
    const key = `${module.file}#${exportName}`;
    if (seen.has(key)) return UNRESOLVED;
    seen.add(key);
    const localName = exportName === DEFAULT_EXPORT ? defaultExportName(module) : exportName;
    if (localName !== null) {
      const local = this.#resolveName(module, localName, seen, null);
      if (local.kind !== "unresolved") return local;
    }
    return this.#throughReExports(module, exportName, seen);
  }

  #throughReExports(module: ParsedModule, exportName: string, seen: Set<string>): Resolution {
    for (const reExport of reExportsOf(module, this.#repositoryRoot)) {
      const named = reExport.exportedName !== null;
      if (named && reExport.exportedName !== exportName) continue;
      if (!reExport.isRepositoryLocal) {
        if (named) return EXTERNAL;
        continue;
      }
      if (reExport.resolvedFile === null) {
        if (named) return { kind: "missing_module", reference: reExport };
        continue;
      }
      const through = this.#resolveExport(
        this.#cache.read(reExport.resolvedFile),
        reExport.importedName ?? exportName,
        seen,
      );
      if (through.kind !== "unresolved") return through;
    }
    return UNRESOLVED;
  }

  #moduleDeclarations(module: ParsedModule): readonly ComponentDeclaration[] {
    const existing = this.#declarations.get(module.file);
    if (existing !== undefined) return existing;
    const declarations = findComponentDeclarations(module);
    this.#declarations.set(module.file, declarations);
    return declarations;
  }

  /** Every component this one is written inside, innermost first. */
  #enclosingDeclarations(declaration: ComponentDeclaration): readonly ComponentDeclaration[] {
    return this.#moduleDeclarations(declaration.module)
      .filter((other) => encloses(other.jsxRoot, declaration.jsxRoot))
      .sort((left, right) => right.jsxRoot.pos - left.jsxRoot.pos);
  }

  /**
   * Whether the name is bound at MODULE level.
   *
   * "No enclosing component declaration" is not the same fact: a component
   * declared inside an `if` block has none, and is still invisible to code
   * written outside that block. Asking the syntax directly is what a second
   * module importing this one, and a tag with no nearer binding, both need.
   */
  #isModuleLevel(declaration: ComponentDeclaration): boolean {
    return isModuleLevelDeclaration(declaration);
  }

  /**
   * A nested component is only a render target for code written inside the same
   * closure: the component it is declared in, or one nested deeper in that one.
   * Anywhere else the name is out of scope and resolves to nothing.
   */
  #isInScope(target: ComponentDeclaration, from: ComponentDeclaration): boolean {
    const [enclosing] = this.#enclosingDeclarations(target);
    if (enclosing === undefined) return true;
    return enclosing === from || isNestedIn(from, enclosing);
  }

  /**
   * The declaration a name resolves to from `scope`. A name declared nearer the
   * reference shadows the same name further out, exactly as the closure does.
   */
  #declarationInScope(
    module: ParsedModule,
    name: string,
    scope: ComponentDeclaration | null,
  ): ComponentDeclaration | undefined {
    return this.#moduleDeclarations(module)
      .filter((entry) => entry.name === name)
      .filter((entry) =>
        scope === null ? this.#isModuleLevel(entry) : this.#isInScope(entry, scope),
      )
      .sort(
        (left, right) =>
          this.#enclosingDeclarations(right).length - this.#enclosingDeclarations(left).length,
      )
      .at(0);
  }
}

function unresolvedImportFinding(reference: ModuleReference, file: string): Finding {
  return {
    code: "UNRESOLVED_COMPONENT",
    anchor: null,
    location: { file, line: reference.line },
    evidence: `import "${reference.specifier}"`,
    decision:
      "This local import could not be resolved, so the component it renders was " +
      "not inspected. Fix the path or convert that module by hand.",
  };
}

/**
 * Walks the render tree of each entry module — a route and the layouts that wrap
 * it — and returns every component declaration it reaches, each exactly once.
 */
export function resolveRenderTree(
  entryFiles: readonly string[],
  repositoryRoot: string,
  cache: ModuleCache,
): RenderTree {
  return new RenderWalker(cache, repositoryRoot).walk(entryFiles);
}

/** Resolves a JSX tag to the component it renders, by the render walk's rules. */
export interface TagResolver {
  resolve(tagName: string, from: ComponentDeclaration): ComponentDeclaration | null;
}

export function tagResolver(repositoryRoot: string, cache: ModuleCache): TagResolver {
  const walker = new RenderWalker(cache, repositoryRoot);
  return {
    resolve: (tagName, from) => walker.resolveTag(tagName, from),
  };
}


/** The nearest syntax binding this name between the node and the module. */
function nearestBinding(node: ts.Node, name: string): ts.Node | null {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && !ts.isSourceFile(current)) {
    const declaration = declarationOfName(current, name);
    if (declaration !== null) return declaration;
    current = current.parent;
  }
  return null;
}

/**
 * The component a binding declares, when it declares one this reader can read.
 *
 * A parameter, or a local bound to anything but a function with JSX in it,
 * yields null: the tag renders something whose props this reader cannot
 * describe.
 */
function componentDeclaredBy(
  binding: ts.Node,
  module: ParsedModule,
): ComponentDeclaration | null {
  // `namedFunctionsOf` finds the function behind `as`, `satisfies` and
  // parentheses, so the match has to look through them too — comparing against
  // the original initializer made the two disagree and reported a local
  // component unresolved.
  const initializer = ts.isVariableDeclaration(binding) ? binding.initializer : binding;
  if (initializer === undefined) return null;
  const owner = ts.isExpression(initializer) ? unwrapTransparent(initializer) : initializer;
  return (
    findComponentDeclarations(module).find(
      (candidate) => candidate.jsxRoot.parent === owner,
    ) ?? null
  );
}

/**
 * Whether a component's binding lives at the top level of its module.
 *
 * Not "is it outside every block": a `var` written inside a top-level `if` is
 * module scoped in JavaScript, and a `let` beside it is not. Which ancestor
 * the binding belongs to depends on how it was declared, so `scopeOfDeclaration`
 * decides and this only asks whether the answer is the file.
 */
function isModuleLevelDeclaration(declaration: ComponentDeclaration): boolean {
  const site = bindingSiteOf(declaration);
  if (site === null) return false;
  return scopeOfDeclaration(site) === declaration.module.source;
}

/**
 * The syntax that binds a component's name: its declaration or its variable.
 *
 * Transparent wrappers nest, so this climbs through however many there are.
 * Reading one level agreed with `componentDeclaredBy` — which unwraps
 * recursively — only for singly-wrapped components, and a module-level
 * `const Local = (((() => …))) as T` became unreachable.
 */
function bindingSiteOf(declaration: ComponentDeclaration): ts.Node | null {
  const owner = declaration.jsxRoot.parent;
  if (owner === undefined) return null;
  if (ts.isFunctionDeclaration(owner)) return owner;
  let current: ts.Node | undefined = owner.parent;
  while (current !== undefined && ts.isExpression(current) && isTransparentWrapper(current)) {
    current = current.parent;
  }
  return current !== undefined && ts.isVariableDeclaration(current) ? current : null;
}

function declarationResolution(declaration: ComponentDeclaration | null): Resolution {
  return declaration === null ? UNRESOLVED : { kind: "declaration", declaration };
}

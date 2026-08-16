import ts from "typescript";

import { findComponentDeclarations, type ComponentDeclaration } from "./extract.js";
import { isHostTag } from "./jsx-facts.js";
import type { Finding } from "./report.js";
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

/**
 * Every component-shaped tag this declaration renders, each named once.
 *
 * Tags written inside a nested function are that function's, not this one's.
 * Reading them here would make a component reachable through a helper nothing
 * ever renders, which is the same defect one level down.
 */
function renderedTags(declaration: ComponentDeclaration): readonly RenderedTag[] {
  const tags = new Map<string, RenderedTag>();
  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(declaration.module.source);
      if (!isHostTag(name) && !tags.has(name)) tags.set(name, { name, node });
    }
    ts.forEachChild(node, (child) => {
      if (ts.isFunctionLike(child)) return;
      visit(child);
    });
  };
  visit(declaration.jsxRoot);
  return [...tags.values()];
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
    for (const tag of renderedTags(declaration)) this.#follow(tag, declaration);
  }

  #follow(tag: RenderedTag, from: ComponentDeclaration): void {
    const [root = tag.name, ...members] = tag.name.split(MEMBER_SEPARATOR);
    const resolution =
      members.length === 0
        ? this.#resolveName(from.module, root, new Set(), from)
        : this.#resolveMember(from.module, root, members);
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

  /** A component declared inside another is not what a second module imported. */
  #isModuleLevel(declaration: ComponentDeclaration): boolean {
    return this.#enclosingDeclarations(declaration).length === 0;
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

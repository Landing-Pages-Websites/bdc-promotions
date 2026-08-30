import ts from "typescript";

import { type AnchorPath, type AnchorSegment } from "./anchors.js";
import { stringValueOf } from "./literals.js";
import {
  importedBindingsOf,
  reExportsOf,
  repositoryFileForSpecifier,
  repositoryModuleFiles,
  type ModuleCache,
  type ParsedModule,
} from "./scan.js";

/**
 * Reads the string a JSX expression renders, when — and only when — every step
 * from the expression to a string literal is a NAMED source fact decided by
 * syntax alone: a module-level `const`, an object-literal property name, an
 * export name, an import specifier.
 *
 * This is the same identity doctrine `anchors.ts` states, applied one layer
 * deeper. A value read here is anchored on the chain of names that produced it
 * (`each:ctas/prop:primary/prop:label`), never on where it happened to appear
 * in the markup — so moving the paragraph, restyling it or reordering its
 * siblings cannot move the field, and renaming the data can.
 *
 * Everything else resolves to `null` and is reported to a human instead. The
 * failure this guards against is not missing a value; it is writing a
 * customer's page from a string the site never actually rendered. Refusals are
 * therefore deliberate and listed one by one:
 *
 *   - array indexing        position is not identity (`anchors.ts`)
 *   - computed keys         the key is not a name until it is a literal
 *   - object spreads        a later spread silently overwrites an earlier key
 *   - calls, conditionals,
 *     concatenation, `??`   the result depends on evaluation, not on syntax
 *   - `let` / `var`         a reassignment elsewhere is invisible from here
 *   - shadowed names        the nearest binding wins, and it is not the module's
 *   - `?.` and `!`          the author is saying the value may be absent
 *   - default exports       the only name is the importer's alias, per import
 *   - non-string leaves     a number renders, but it is not customer text
 */

const MAX_PROPERTY_DEPTH = 8;
const MAX_RESOLUTION_DEPTH = 8;
const MAX_MODULE_HOPS = 8;

export interface ResolutionContext {
  readonly module: ParsedModule;
  readonly repositoryRoot: string;
  readonly cache: ModuleCache;
}

export interface ValueResolution {
  readonly value: string;
  /** The chain of names the value lives under, in `anchors.ts` segments. */
  readonly path: AnchorPath;
  /** The module the root binding is declared in. */
  readonly declaredIn: string;
  /**
   * Whether the root binding is exported. An exported name is a name other
   * modules can read, so every reader of it names the same value and the anchor
   * stands alone. A module-private name is scoped to its module — two modules
   * may each declare `LAST_UPDATED` and mean different dates — so the caller
   * must qualify it with the component that reads it.
   */
  readonly shared: boolean;
}

/** A resolved expression stays paired with the module whose scope reads it. */
interface Bound {
  readonly expression: ts.Expression;
  readonly module: ParsedModule;
}

/** Wrappers that change a type and never a value. `!` is deliberately absent. */
function unwrap(expression: ts.Expression): ts.Expression {
  let current = expression;
  for (;;) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isTypeAssertionExpression(current)) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

interface PathRead {
  readonly root: ts.Identifier;
  readonly properties: readonly string[];
}

/**
 * Decomposes `a.b["c"]` into its root and its property names. Any link that is
 * not a written name — an index, a computed key, an optional link — refuses the
 * whole read rather than the one link, because a partial path names nothing.
 */
export function readPath(expression: ts.Expression): PathRead | null {
  const properties: string[] = [];
  let current = unwrap(expression);
  while (properties.length <= MAX_PROPERTY_DEPTH) {
    if (ts.isIdentifier(current)) {
      return { root: current, properties: properties.reverse() };
    }
    if (ts.isPropertyAccessExpression(current)) {
      if (current.questionDotToken !== undefined) return null;
      if (!ts.isIdentifier(current.name)) return null;
      properties.push(current.name.text);
      current = unwrap(current.expression);
      continue;
    }
    if (ts.isElementAccessExpression(current)) {
      if (current.questionDotToken !== undefined) return null;
      const argument = unwrap(current.argumentExpression);
      if (!ts.isStringLiteral(argument)) return null;
      properties.push(argument.text);
      current = unwrap(current.expression);
      continue;
    }
    return null;
  }
  return null;
}

/** Every name a binding introduces, including destructured and renamed ones. */
function bindingNames(name: ts.BindingName, into: Set<string>): void {
  if (ts.isIdentifier(name)) {
    into.add(name.text);
    return;
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) bindingNames(element.name, into);
    }
  }
}

/** Every name a declaration list binds, destructuring included. */
function declarationNames(list: ts.VariableDeclarationList, into: Set<string>): void {
  for (const declaration of list.declarations) {
    bindingNames(declaration.name, into);
  }
}

/** Every `var` in a function body, which binds the FUNCTION however deeply nested. */
function hoistedVarNames(body: ts.Node, into: Set<string>): void {
  const visit = (node: ts.Node): void => {
    // A nested function has its own `var` scope; its declarations are not ours.
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      return;
    }
    if (ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Let) === 0) {
      const isVar =
        (node.declarationList.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const)) === 0;
      if (isVar) declarationNames(node.declarationList, into);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
}

function declaresName(node: ts.Node, name: string): boolean {
  const names = new Set<string>();
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    for (const parameter of node.parameters) bindingNames(parameter.name, names);
  }
  if (ts.isMethodDeclaration(node)) {
    for (const parameter of node.parameters) bindingNames(parameter.name, names);
  }
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)) &&
    node.body !== undefined
  ) {
    hoistedVarNames(node.body, names);
  }
  if (ts.isCatchClause(node) && node.variableDeclaration !== undefined) {
    bindingNames(node.variableDeclaration.name, names);
  }
  // A named function or class EXPRESSION binds its own name inside itself, so
  // `const P = function copy() { … copy … }` refers to the function.
  if (
    (ts.isFunctionExpression(node) ||
      ts.isClassExpression(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node)) &&
    node.name !== undefined
  ) {
    names.add(node.name.text);
  }
  // A `case` body holds statements directly, without being a Block, so a
  // `const` written there was invisible to a scan that looked only at blocks.
  if (ts.isBlock(node) || ts.isCaseClause(node) || ts.isDefaultClause(node)) {
    for (const statement of node.statements) {
      if (ts.isVariableStatement(statement)) {
        declarationNames(statement.declarationList, names);
        continue;
      }
      // A nested `function copy() {}` or `class copy {}` shadows the module's
      // `copy` just as firmly as a `const` does.
      if (
        (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
        statement.name !== undefined
      ) {
        names.add(statement.name.text);
      }
    }
  }
  // A loop declares its own binding OUTSIDE its body block, so reading only
  // block statements would miss `for (const copy of rows)` entirely.
  if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    const initializer = node.initializer;
    if (initializer !== undefined && ts.isVariableDeclarationList(initializer)) {
      declarationNames(initializer, names);
    }
  }
  return names.has(name);
}

/**
 * Whether a nearer binding than the module's owns this name at this position.
 * A component prop named `copy` makes the module's `copy` unreadable here, and
 * reading the module's anyway would publish a value the page never rendered.
 */
export function isShadowed(node: ts.Node, name: string): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (declaresName(current, name)) return true;
    current = current.parent;
  }
  return false;
}

/**
 * The module-level `const` a name refers to. A name declared twice at module
 * level refuses: two declarations cannot both be the answer, and picking one is
 * the kind of guess this tool exists not to make.
 */
function moduleConstOf(
  module: ParsedModule,
  name: string,
): { readonly expression: ts.Expression; readonly exported: boolean } | null {
  let found: { readonly expression: ts.Expression; readonly exported: boolean } | null = null;
  let seen = 0;
  for (const statement of module.source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== name) continue;
      seen += 1;
      if (!isConst || declaration.initializer === undefined) return null;
      found = {
        expression: declaration.initializer,
        exported: isExported(statement) || isExportedByList(module, name),
      };
    }
  }
  return seen === 1 ? found : null;
}

function isExported(statement: ts.VariableStatement): boolean {
  return (
    statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true
  );
}

function exportedConstOf(module: ParsedModule, name: string): ts.Expression | null {
  const declared = moduleConstOf(module, name);
  if (declared === null || !declared.exported) return null;
  return declared.expression;
}

/**
 * Whether an export list carries this local name out of the module.
 *
 * `export { copy }` makes `copy` exactly as shared as `export const copy` does,
 * so a reader in the declaring module must reach the same conclusion an
 * importing reader does — otherwise the two produce different anchors for one
 * value and it never merges.
 */
function isExportedByList(module: ParsedModule, localName: string): boolean {
  for (const statement of module.source.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    if (statement.moduleSpecifier !== undefined) continue;
    const clause = statement.exportClause;
    if (clause === undefined || !ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      // `export { copy as default }` exports it under a name this tool refuses
      // everywhere else, because a default has no durable declared name.
      if (element.name.text === "default") continue;
      if ((element.propertyName ?? element.name).text === localName) return true;
    }
  }
  return false;
}

/** A declaration reached through an export, under the name it was DECLARED with. */
interface ExportedDeclaration extends Bound {
  readonly declaredName: string;
}

function sameDeclaration(a: ExportedDeclaration, b: ExportedDeclaration): boolean {
  return a.module.file === b.module.file && a.declaredName === b.declaredName;
}

/** Names a module exports through an export list with no module specifier. */
function localExportAliases(module: ParsedModule, exportName: string): readonly string[] {
  const locals: string[] = [];
  for (const statement of module.source.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    if (statement.moduleSpecifier !== undefined) continue;
    const clause = statement.exportClause;
    if (clause === undefined || !ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      if (element.name.text !== exportName) continue;
      locals.push((element.propertyName ?? element.name).text);
    }
  }
  return locals;
}

/**
 * EVERY declaration an export name could resolve to.
 *
 * Returning the first match would let two `export *` barrels be settled by the
 * order the statements happen to appear in, which is the ambiguity this tool
 * exists to refuse. The caller rejects anything that resolves to more than one
 * declaration.
 *
 * The name each result carries is the one at the END of the chain, so an alias
 * introduced on the way through — `export { ctas as actions }` — does not
 * become a second identity for a value that already has one.
 */
function findExports(
  module: ParsedModule,
  name: string,
  context: ResolutionContext,
  visited: ReadonlySet<string>,
  hops: number,
): readonly ExportedDeclaration[] {
  if (hops > MAX_MODULE_HOPS) return [];
  const key = `${module.file}#${name}`;
  if (visited.has(key)) return [];
  const nextVisited = new Set(visited).add(key);
  const found: ExportedDeclaration[] = [];

  const inline = exportedConstOf(module, name);
  if (inline !== null) found.push({ expression: inline, module, declaredName: name });

  for (const local of localExportAliases(module, name)) {
    const declared = moduleConstOf(module, local);
    if (declared !== null) {
      found.push({ expression: declared.expression, module, declaredName: local });
      continue;
    }
    // `import { ctas } from "./content"; export { ctas };`
    const imported = importedBindingsOf(module, context.repositoryRoot).get(local);
    if (imported === undefined) continue;
    found.push(...followImport(imported, local, context, nextVisited, hops));
  }

  for (const reExport of reExportsOf(module, context.repositoryRoot)) {
    if (!reExport.isRepositoryLocal || reExport.resolvedFile === null) continue;
    const matchesName = reExport.exportedName === name;
    const isStar = reExport.exportedName === null && reExport.importedName === null;
    if (!matchesName && !isStar) continue;
    const wanted = matchesName ? (reExport.importedName ?? name) : name;
    const target = context.cache.read(reExport.resolvedFile);
    found.push(...findExports(target, wanted, context, nextVisited, hops + 1));
  }

  return dedupeDeclarations(found);
}

function followImport(
  reference: ReturnType<typeof importedBindingsOf> extends ReadonlyMap<string, infer R>
    ? R
    : never,
  _local: string,
  context: ResolutionContext,
  visited: ReadonlySet<string>,
  hops: number,
): readonly ExportedDeclaration[] {
  if (!reference.isRepositoryLocal || reference.resolvedFile === null) return [];
  // A default export has no declared name, so the only name available is the
  // importer's alias — which differs per import site and is not durable.
  if (reference.importedName === null || reference.importedName === "default") return [];
  const target = context.cache.read(reference.resolvedFile);
  return findExports(target, reference.importedName, context, visited, hops + 1);
}

function dedupeDeclarations(
  declarations: readonly ExportedDeclaration[],
): readonly ExportedDeclaration[] {
  const unique: ExportedDeclaration[] = [];
  for (const declaration of declarations) {
    if (!unique.some((entry) => sameDeclaration(entry, declaration))) unique.push(declaration);
  }
  return unique;
}

/** The declaration a root name resolves to, and the name it is DECLARED under. */
interface RootBinding extends Bound {
  readonly declaredName: string;
  readonly shared: boolean;
}

function resolveRoot(
  root: ts.Identifier,
  module: ParsedModule,
  context: ResolutionContext,
): RootBinding | null {
  const local = moduleConstOf(module, root.text);
  if (local !== null) {
    return {
      expression: local.expression,
      module,
      declaredName: root.text,
      shared: local.exported,
    };
  }

  const imported = importedBindingsOf(module, context.repositoryRoot).get(root.text);
  if (imported === undefined) return null;
  const found = followImport(imported, root.text, context, new Set(), 0);
  const only = found.length === 1 ? found[0] : undefined;
  return only === undefined ? null : { ...only, shared: true };
}

/**
 * Reads one property off an object literal. A spread anywhere refuses the whole
 * object: a spread before the key may be the only source of it, and a spread
 * after the key overwrites it. Neither is visible without evaluating.
 */
const PROTOTYPE_KEY = "__proto__";

function propertyOf(bound: Bound, name: string): Bound | null {
  const object = unwrap(bound.expression);
  if (!ts.isObjectLiteralExpression(object)) return null;
  // `{ __proto__: "x" }` sets the prototype; it does not create a property
  // named `__proto__`, so `copy["__proto__"]` does not read that string.
  if (name === PROTOTYPE_KEY) return null;
  let found: ts.Expression | null = null;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) return null;
    if (ts.isShorthandPropertyAssignment(property)) {
      if (property.name.text === name) found = property.name;
      continue;
    }
    if (!ts.isPropertyAssignment(property)) {
      // A getter, setter or method is computed, not a written value.
      const key = property.name;
      if (key !== undefined && (ts.isIdentifier(key) || ts.isStringLiteral(key))) {
        if (key.text === name) return null;
      }
      continue;
    }
    const key = property.name;
    const keyText = ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : null;
    if (keyText === null) {
      // A computed key could be this name; the object can no longer be read.
      return null;
    }
    if (keyText === name) found = property.initializer;
  }
  return found === null ? null : { expression: found, module: bound.module };
}

/**
 * The string an expression denotes, read in its own module's scope. Identifiers
 * resolve through module-level `const`s and repository-local imports; template
 * literals resolve when every substitution does.
 */
interface WalkedPath {
  readonly leaf: Bound;
  readonly root: RootBinding;
  readonly properties: readonly string[];
}

/**
 * Follows a path expression to the declaration it names and then down through
 * the object literals its property names select. This is the one walk; both the
 * anchor and the string are read off its result.
 */
function walkPath(
  expression: ts.Expression,
  module: ParsedModule,
  context: ResolutionContext,
  checkEscapes = true,
): WalkedPath | null {
  const path = readPath(expression);
  if (path === null) return null;
  if (isShadowed(expression, path.root.text)) return null;
  const root = resolveRoot(path.root, module, context);
  if (root === null) return null;

  if (checkEscapes && hasEscaped(root, path.properties, context)) return null;

  let leaf: Bound = { expression: root.expression, module: root.module };
  for (const property of path.properties) {
    const next = propertyOf(leaf, property);
    if (next === null) return null;
    leaf = next;
  }
  return { leaf, root, properties: path.properties };
}

function stringOf(bound: Bound, context: ResolutionContext, depth: number): string | null {
  if (depth > MAX_RESOLUTION_DEPTH) return null;
  const expression = unwrap(bound.expression);

  const literal = stringValueOf(expression);
  if (literal !== null) return literal;

  if (ts.isTemplateExpression(expression)) {
    let text = expression.head.text;
    for (const span of expression.templateSpans) {
      const part = stringOf({ expression: span.expression, module: bound.module }, context, depth + 1);
      if (part === null) return null;
      text += part + span.literal.text;
    }
    return text;
  }

  const walked = walkPath(expression, bound.module, context);
  return walked === null ? null : stringOf(walked.leaf, context, depth + 1);
}

/**
 * Where a declaration's object graph stops being provably readable.
 *
 * `const` freezes the BINDING, not the object, so the question is whether
 * anything can change what a path reads. Hunting for WRITES cannot answer it:
 * a write may be made through an alias, a namespace, a parameter, or a
 * function this reading cannot follow, and an unresolved write silently looked
 * like no write at all — which is the wrong direction to fail in.
 *
 * So the question is inverted. A reference is safe when the chain of property
 * names written on it resolves, right there, to a STRING — a string cannot be
 * mutated by whoever receives it. Anything else hands out an OBJECT, and
 * whoever holds an object can write through it, so the path handed out is
 * recorded as escaped. Reading a path refuses if an escaped path is a prefix
 * of it, which keeps `ctas.rfp.label` readable when only `ctas.primary` was
 * handed to a component.
 *
 * The whole declaration escapes when a bare reference is handed out, when it
 * is written to directly, or when the reference cannot be classified at all.
 */
const ESCAPE_INDEX = new WeakMap<ModuleCache, ReadonlyMap<string, readonly string[]>>();

const ESCAPE_SEPARATOR = "\u0000";

function escapeKey(properties: readonly string[]): string {
  return properties.join(ESCAPE_SEPARATOR);
}

function declarationKeyOf(
  module: ParsedModule,
  name: string,
  context: ResolutionContext,
  depth = 0,
): readonly string[] {
  if (depth > MAX_RESOLUTION_DEPTH) return [];
  const local = moduleConstOf(module, name);
  if (local !== null) {
    const keys = [`${module.file}#${name}`];
    const aliased = readPath(local.expression);
    if (aliased !== null && aliased.properties.length === 0) {
      keys.push(...declarationKeyOf(module, aliased.root.text, context, depth + 1));
    }
    return keys;
  }
  const imported = importedBindingsOf(module, context.repositoryRoot).get(name);
  if (imported === undefined) return [];
  return followImport(imported, name, context, new Set(), 0).map(
    (entry) => `${entry.module.file}#${entry.declaredName}`,
  );
}

/**
 * Whether a namespace chain lands on a string.
 *
 * The value resolver deliberately refuses a namespace root, because the local
 * alias is not a durable name for a FIELD. That says nothing about whether the
 * read hands an object out, which is what the escape index needs to know, so
 * the chain is followed here through the same export resolution every other
 * reader uses.
 */
function namespaceChainIsText(
  target: ParsedModule,
  head: string,
  rest: readonly string[],
  context: ResolutionContext,
): boolean {
  const exported = findExports(target, head, context, new Set(), 0);
  if (exported.length !== 1) return false;
  const root = exported[0];
  if (root === undefined) return false;
  let leaf: Bound = { expression: root.expression, module: root.module };
  for (const property of rest) {
    const next = propertyOf(leaf, property);
    if (next === null) return false;
    leaf = next;
  }
  return stringOf(leaf, context, 0) !== null;
}

/**
 * The module a name stands for, when that name is a MODULE rather than a value.
 *
 * A namespace can be forwarded any number of ways and they all mean the same
 * thing, so this follows the name rather than recognising shapes:
 *
 *   export * as content from "./m"          — bound here
 *   import * as content from "./m"; export { content }
 *   export { content } from "./barrel"      — and under a new name
 *
 * Ambiguity and cycles refuse, the same way `findExports` does, because a name
 * that stands for two modules stands for neither.
 */
function namespaceExportTarget(
  module: ParsedModule,
  name: string,
  context: ResolutionContext,
  visited: ReadonlySet<string> = new Set(),
  hops = 0,
): ParsedModule | null {
  if (hops > MAX_MODULE_HOPS) return null;
  const key = `${module.file}#${name}`;
  if (visited.has(key)) return null;
  const nextVisited = new Set(visited).add(key);
  const found: ParsedModule[] = [];

  for (const reExport of reExportsOf(module, context.repositoryRoot)) {
    if (!reExport.isRepositoryLocal || reExport.resolvedFile === null) continue;
    const target = context.cache.read(reExport.resolvedFile);
    // `export * from "./ns"` spells no name at all, yet forwards every name
    // `ns` exports — including a namespace `ns` bound with `export * as`.
    if (reExport.exportedName === null && reExport.importedName === null) {
      const through = namespaceExportTarget(target, name, context, nextVisited, hops + 1);
      if (through !== null) found.push(through);
      continue;
    }
    if (reExport.exportedName !== name) continue;
    // `export * as name from "./m"` binds the module here.
    if (reExport.importedName === null) {
      found.push(target);
      continue;
    }
    // `export { x as name } from "./barrel"` forwards whatever `x` is there.
    const onward = namespaceExportTarget(
      target,
      reExport.importedName,
      context,
      nextVisited,
      hops + 1,
    );
    if (onward !== null) found.push(onward);
  }

  // `import * as name from "./m"; export { name }` — an export list carrying a
  // namespace binding this module happens to hold.
  for (const local of localExportAliases(module, name)) {
    const imported = importedBindingsOf(module, context.repositoryRoot).get(local);
    if (imported === undefined) continue;
    if (!imported.isRepositoryLocal || imported.resolvedFile === null) continue;
    const target = context.cache.read(imported.resolvedFile);
    if (imported.importedName === null) {
      found.push(target);
      continue;
    }
    const onward = namespaceExportTarget(
      target,
      imported.importedName,
      context,
      nextVisited,
      hops + 1,
    );
    if (onward !== null) found.push(onward);
  }

  const unique = found.filter(
    (entry, index) => found.findIndex((other) => other.file === entry.file) === index,
  );
  return unique.length === 1 ? (unique[0] ?? null) : null;
}

/** The module a namespace import names, when it is one of ours. */
function namespaceModuleOf(
  module: ParsedModule,
  name: string,
  context: ResolutionContext,
): ParsedModule | null {
  const imported = importedBindingsOf(module, context.repositoryRoot).get(name);
  if (imported === undefined) return null;
  if (!imported.isRepositoryLocal || imported.resolvedFile === null) return null;
  const target = context.cache.read(imported.resolvedFile);
  // `import * as content from "./m"` names the module directly.
  if (imported.importedName === null) return target;
  // `import { content } from "./barrel"` names one too, when the barrel got it
  // from `export * as content from "./m"`. The local alias is irrelevant; the
  // EXPORTED name is what the barrel bound the module to.
  return namespaceExportTarget(target, imported.importedName, context);
}

/**
 * Whether the chain is being CALLED, which hands its receiver to the callee.
 *
 * `copy.inner.mutate()` runs a method with `this` bound to `copy.inner`, so it
 * is `inner` that escapes, not `inner/mutate`. Recording the method path would
 * leave `copy.inner.title` readable next to a method free to rewrite it.
 */
function isCalledMember(outer: ts.Expression): boolean {
  const parent = outer.parent;
  return parent !== undefined && ts.isCallExpression(parent) && parent.expression === outer;
}

/** The outermost property chain written on a reference, and where it ends. */
function chainFrom(reference: ts.Node): {
  readonly outer: ts.Expression;
  readonly properties: readonly string[];
} {
  const properties: string[] = [];
  let current: ts.Expression = reference as ts.Expression;
  for (let step = 0; step <= MAX_PROPERTY_DEPTH; step += 1) {
    const parent = current.parent;
    if (parent === undefined) break;
    // `(copy).title` is the same read as `copy.title`; a wrapper that changes
    // only a type must not end the chain and report the object as handed out.
    if (
      ts.isParenthesizedExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isTypeAssertionExpression(parent) ||
      ts.isNonNullExpression(parent)
    ) {
      current = parent;
      continue;
    }
    if (ts.isPropertyAccessExpression(parent) && parent.expression === current) {
      properties.push(parent.name.text);
      current = parent;
      continue;
    }
    if (
      ts.isElementAccessExpression(parent) &&
      parent.expression === current &&
      ts.isStringLiteral(parent.argumentExpression)
    ) {
      properties.push(parent.argumentExpression.text);
      current = parent;
      continue;
    }
    break;
  }
  return { outer: current, properties };
}

/**
 * Whether the chain is being written rather than read.
 *
 * An assignment target is not always the immediate left of an `=`. A
 * destructuring target is written as an array or object LITERAL, and a
 * `for...of` or `for...in` head is a target too, so the position is found by
 * climbing out of those wrappers rather than by listing assignment shapes.
 */
function isWriteTarget(outer: ts.Expression): boolean {
  let current: ts.Node = outer;
  for (let step = 0; step <= MAX_PROPERTY_DEPTH; step += 1) {
    const parent: ts.Node | undefined = current.parent;
    if (parent === undefined) return false;
    if (ts.isBinaryExpression(parent) && ASSIGNMENTS.has(parent.operatorToken.kind)) {
      return parent.left === current;
    }
    // `for (copy.title of […])` and `for (copy.title in …)` assign each round.
    if (ts.isForOfStatement(parent) || ts.isForInStatement(parent)) {
      return parent.initializer === current;
    }
    if (ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) {
      return INCREMENTS.has(parent.operator) && parent.operand === current;
    }
    if (ts.isDeleteExpression(parent)) return parent.expression === current;
    // A destructuring target is written as an array or object LITERAL, so the
    // literal is climbed rather than treated as the end of the chain.
    if (
      ts.isArrayLiteralExpression(parent) ||
      ts.isObjectLiteralExpression(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isSpreadElement(parent) ||
      ts.isSpreadAssignment(parent) ||
      ts.isParenthesizedExpression(parent)
    ) {
      current = parent;
      continue;
    }
    return false;
  }
  return false;
}

/**
 * Whether an identifier is a USE of a value, rather than a place a name is
 * written down. A declaration's own name, a property key, a binding element and
 * an import specifier all spell the name without reading the object, and
 * counting them as uses would report every declaration as escaped — including
 * the line that declares it.
 */
function isValueReference(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (parent === undefined) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (ts.isPropertySignature(parent)) return false;
  if (ts.isPropertyDeclaration(parent)) return parent.initializer === node;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return false;
  if (ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent)) return false;
  if (ts.isFunctionExpression(parent) || ts.isClassExpression(parent)) return false;
  // A parameter, a binding element and a class field each have a NAME and a
  // VALUE. Only the name is a mention; `function f(value = copy)` and
  // `class M { field = copy }` hand the object out exactly as any other
  // expression does.
  if (ts.isParameter(parent)) return parent.initializer === node;
  if (ts.isBindingElement(parent)) return parent.initializer === node;
  if (ts.isJsxAttribute(parent) && parent.name === node) return false;
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent)) return false;
  if (ts.isImportClause(parent) || ts.isNamespaceImport(parent)) return false;
  if (ts.isImportEqualsDeclaration(parent)) return false;
  if (ts.isMethodDeclaration(parent) || ts.isMethodSignature(parent)) return false;
  if (ts.isEnumMember(parent) || ts.isTypeReferenceNode(parent)) return false;
  if (ts.isQualifiedName(parent)) return false;
  // `typeof copy` names the value's TYPE. No type can write to it.
  if (ts.isTypeQueryNode(parent)) return false;
  if (ts.isLabeledStatement(parent) || ts.isBreakOrContinueStatement(parent)) return false;
  // `{ copy }` is deliberately NOT excluded. The identifier is both the key and
  // the value there, and as the value it hands the object out — so treating the
  // shorthand as a name-only mention would miss `const w = { copy };
  // w.copy.title = …` entirely.
  return true;
}

const INCREMENTS: ReadonlySet<ts.SyntaxKind> = new Set([
  ts.SyntaxKind.PlusPlusToken,
  ts.SyntaxKind.MinusMinusToken,
]);

const ASSIGNMENTS: ReadonlySet<ts.SyntaxKind> = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

function recordEscape(
  into: Map<string, string[]>,
  keys: readonly string[],
  properties: readonly string[],
): void {
  for (const key of keys) {
    const paths = into.get(key) ?? [];
    paths.push(escapeKey(properties));
    into.set(key, paths);
  }
}

/**
 * Every `const` a module exports, under the name it was declared with.
 *
 * Used when something obtains the whole module rather than one of its
 * exports — then no single declaration can be named, and all of them are
 * reachable by whoever holds it.
 */
function exportedConstNames(module: ParsedModule): readonly string[] {
  const names = new Set<string>();
  for (const statement of module.source.statements) {
    if (ts.isVariableStatement(statement)) {
      const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
      if (!isConst) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        if (isExported(statement) || isExportedByList(module, declaration.name.text)) {
          names.add(declaration.name.text);
        }
      }
      continue;
    }
    if (!ts.isExportDeclaration(statement) || statement.moduleSpecifier !== undefined) continue;
    const clause = statement.exportClause;
    if (clause === undefined || !ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      names.add((element.propertyName ?? element.name).text);
    }
  }
  return [...names];
}

/**
 * A declaration this module sends out as its DEFAULT export.
 *
 * A default has no durable declared name, so this tool refuses to follow it
 * everywhere — which means a write made through a default import cannot be
 * attributed back. Refusing to FOLLOW it and still trusting it would be the
 * wrong half of that decision, so the declaration escapes.
 */
function defaultExportedNames(module: ParsedModule): readonly string[] {
  const names: string[] = [];
  for (const statement of module.source.statements) {
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const value = unwrap(statement.expression);
      if (ts.isIdentifier(value)) names.push(value.text);
      continue;
    }
    if (!ts.isExportDeclaration(statement) || statement.moduleSpecifier !== undefined) continue;
    const clause = statement.exportClause;
    if (clause === undefined || !ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      if (element.name.text === "default") names.push((element.propertyName ?? element.name).text);
    }
  }
  return names;
}

/** The module a `import("./m")` or `require("./m")` call names, when it is ours. */
function dynamicallyLoadedModule(
  node: ts.Node,
  from: ParsedModule,
  context: ResolutionContext,
): ParsedModule | null {
  if (!ts.isCallExpression(node)) return null;
  const callee = node.expression;
  const isLoad =
    callee.kind === ts.SyntaxKind.ImportKeyword ||
    (ts.isIdentifier(callee) && callee.text === "require");
  if (!isLoad) return null;
  const [specifier] = node.arguments;
  if (specifier === undefined || !ts.isStringLiteral(specifier)) return null;
  const file = repositoryFileForSpecifier(specifier.text, from.file, context.repositoryRoot);
  return file === null ? null : context.cache.read(file);
}

/**
 * Every name a module exports, INCLUDING the ones it only re-exports.
 *
 * A barrel exports nothing of its own, so enumerating direct exports alone
 * reports it as empty and a module obtained whole through it escapes nothing.
 */
function visibleExportNames(
  module: ParsedModule,
  context: ResolutionContext,
  visited: ReadonlySet<string>,
): readonly string[] {
  if (visited.has(module.file) || visited.size > MAX_MODULE_HOPS) return [];
  const nextVisited = new Set(visited).add(module.file);
  const names = new Set<string>(exportedConstNames(module));
  for (const reExport of reExportsOf(module, context.repositoryRoot)) {
    if (!reExport.isRepositoryLocal || reExport.resolvedFile === null) continue;
    if (reExport.exportedName !== null) {
      names.add(reExport.exportedName);
      continue;
    }
    const target = context.cache.read(reExport.resolvedFile);
    for (const name of visibleExportNames(target, context, nextVisited)) names.add(name);
  }
  return [...names];
}

/**
 * Escapes every declaration a module obtained whole can reach.
 *
 * The escape is recorded against the TERMINAL declaration, not against the
 * barrel that forwarded it, because that is the identity a reader resolves to.
 */
function escapeWholeModule(
  target: ParsedModule,
  context: ResolutionContext,
  into: Map<string, string[]>,
  visited: ReadonlySet<string> = new Set(),
): void {
  if (visited.has(target.file) || visited.size > MAX_MODULE_HOPS) return;
  const nextVisited = new Set(visited).add(target.file);
  for (const name of visibleExportNames(target, context, new Set())) {
    const keys = findExports(target, name, context, new Set(), 0).map(
      (entry) => `${entry.module.file}#${entry.declaredName}`,
    );
    recordEscape(into, keys, []);
  }
  // `export * as content from "./m"` puts a whole MODULE behind a name, and
  // `findExports` cannot reduce that to one declaration — so obtaining this
  // module reaches everything that one exports too.
  for (const reExport of reExportsOf(target, context.repositoryRoot)) {
    if (!reExport.isRepositoryLocal || reExport.resolvedFile === null) continue;
    // `export * as content from "./m"` puts a whole module behind a name, and
    // `export * from "./ns"` forwards whatever names `ns` has — including one
    // of those. Both are followed, or a barrel of a barrel escapes nothing.
    const forwardsNamespace = reExport.exportedName !== null && reExport.importedName === null;
    const forwardsEverything = reExport.exportedName === null && reExport.importedName === null;
    if (!forwardsNamespace && !forwardsEverything) continue;
    escapeWholeModule(context.cache.read(reExport.resolvedFile), context, into, nextVisited);
  }

  // A module can also hold a namespace itself and export it by name:
  // `import * as content from "./m"; export { content };`. That has no module
  // specifier, so the loop above never sees it.
  for (const name of visibleExportNames(target, context, new Set())) {
    const behind = namespaceExportTarget(target, name, context);
    if (behind !== null) escapeWholeModule(behind, context, into, nextVisited);
  }
}

function indexModule(
  parsed: ParsedModule,
  context: ResolutionContext,
  into: Map<string, string[]>,
): void {
  // A declaration sent out as `default` leaves under a name nothing here can
  // follow back, so it can be written through and never attributed.
  for (const name of defaultExportedNames(parsed)) {
    recordEscape(into, declarationKeyOf(parsed, name, context), []);
  }

  const visit = (node: ts.Node): void => {
    // Obtaining a whole module — `import("./m")`, `require("./m")` — names no
    // single export, and whoever holds it can reach every one of them.
    const loaded = dynamicallyLoadedModule(node, parsed, context);
    if (loaded !== null) escapeWholeModule(loaded, context, into);

    if (ts.isIdentifier(node) && isValueReference(node) && !isShadowed(node, node.text)) {
      const { outer, properties } = chainFrom(node);
      // `import * as content` names a MODULE, so the first property is the
      // declaration and the rest is the path handed out. Without this the root
      // resolves to nothing and `content.copy.title = …` reads as no write —
      // an unresolved write must never look like an absent one.
      const namespaced = namespaceModuleOf(parsed, node.text, context);
      const [head, ...rest] = properties;
      // `barrel.copy.title` is a READ like any other. The value resolver
      // refuses a namespace root, so without evaluating the chain here every
      // namespace read would look like handing the object out.
      if (namespaced !== null && head !== undefined && !isWriteTarget(outer)) {
        if (namespaceChainIsText(namespaced, head, rest, context)) {
          ts.forEachChild(node, visit);
          return;
        }
      }
      // A namespace handed out with no property named — passed to a call,
      // destructured, returned — reaches every export it holds.
      if (namespaced !== null && head === undefined) escapeWholeModule(namespaced, context, into);
      // `barrel.content.copy` reaches a whole module behind a name, which no
      // single declaration can stand for — so everything it exports escapes.
      if (namespaced !== null && head !== undefined) {
        const behindName = namespaceExportTarget(namespaced, head, context);
        if (behindName !== null) escapeWholeModule(behindName, context, into);
      }
      const keys =
        namespaced === null
          ? declarationKeyOf(parsed, node.text, context)
          : head === undefined
            ? []
            : findExports(namespaced, head, context, new Set(), 0).map(
                (entry) => `${entry.module.file}#${entry.declaredName}`,
              );
      const handedOut = namespaced === null ? properties : rest;
      if (keys.length > 0) {
        // A called member hands its RECEIVER to the callee, so the escape is
        // one step short of the chain that was written.
        const called = isCalledMember(outer);
        const escaped = called ? handedOut.slice(0, -1) : handedOut;
        const walked =
          isWriteTarget(outer) || called ? null : walkPath(outer, parsed, context, false);
        const handsOutText =
          walked !== null && stringOf(walked.leaf, context, 0) !== null;
        if (!handsOutText) recordEscape(into, keys, escaped);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed.source);
}

function escapedPaths(context: ResolutionContext): ReadonlyMap<string, readonly string[]> {
  const cached = ESCAPE_INDEX.get(context.cache);
  if (cached !== undefined) return cached;
  const escaped = new Map<string, string[]>();
  // Seeded before the walk so a re-entrant resolution during indexing sees an
  // empty index rather than recursing into building one.
  ESCAPE_INDEX.set(context.cache, escaped);
  for (const file of repositoryModuleFiles(context.repositoryRoot)) {
    indexModule(context.cache.read(file), context, escaped);
  }
  return escaped;
}

function hasEscaped(
  root: RootBinding,
  properties: readonly string[],
  context: ResolutionContext,
): boolean {
  const paths = escapedPaths(context).get(`${root.module.file}#${root.declaredName}`);
  if (paths === undefined) return false;
  const read = escapeKey(properties);
  return paths.some(
    (path) => path === "" || read === path || read.startsWith(path + ESCAPE_SEPARATOR),
  );
}

/**
 * Resolves a JSX value expression to the string it renders and the anchor that
 * names it, or `null` when any step is not decided by syntax alone.
 */
export function resolveStaticValue(
  expression: ts.Expression,
  context: ResolutionContext,
): ValueResolution | null {
  const walked = walkPath(expression, context.module, context);
  if (walked === null) return null;

  const value = stringOf(walked.leaf, context, 0);
  if (value === null || value.length === 0) return null;

  const segments: AnchorSegment[] = [
    { kind: "binding", name: walked.root.declaredName },
    ...walked.properties.map((name) => ({ kind: "property", name }) as const),
  ];
  return {
    value,
    path: segments,
    declaredIn: walked.root.module.file,
    shared: walked.root.shared,
  };
}

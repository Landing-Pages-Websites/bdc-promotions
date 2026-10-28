import ts from "typescript";

import type { PageBinding } from "./bindings.js";
import type { ComponentDeclaration } from "./extract.js";
import {
  findAttribute,
  isProvablyHostTag,
  literalAttributeValue,
  overriddenByLaterSpread,
  tagNameOf,
  type JsxElementNode,
} from "./jsx-facts.js";
import { realPathOf } from "./scan.js";
import { isFunctionLike } from "./scopes.js";

/** Inert subtrees: what they hold is not in the document a fragment scrolls. */
const INERT_TAGS: ReadonlySet<string> = new Set(["template", "noscript"]);

/**
 * The ids a route provably renders exactly once, which is what a link's
 * `#fragment` may point at.
 *
 * Read from ONE place: the JSX the route's own page component returns, when it
 * has a single return. That component always renders on its route, so nothing
 * about whether a parent renders it is left to infer. Inside that JSX an id
 * counts only on a host element, as a literal no later spread can replace, and
 * never under an `{expression}` (a conditional may not render it, a repeated
 * item renders it several times), inside a component element (which may put
 * its children anywhere or nowhere), or inside an inert element. An id written
 * twice counts for neither. Layouts, early returns and every other component
 * are not read: an id the converter cannot prove is rendered once is one it
 * never offers as a destination.
 */
export function renderedIds(
  binding: PageBinding,
  declarations: readonly ComponentDeclaration[],
): ReadonlySet<string> {
  // The cache keys modules by real path, the route by the path it was found at.
  const file = realPathOf(binding.file);
  const root = declarations.find((declaration) => isDefaultExportOf(declaration, file));
  const returned = root === undefined ? null : singleReturnedJsx(root.jsxRoot);
  if (returned === null) return new Set();
  const counts = new Map<string, number>();
  collectIds(returned, counts);
  return new Set([...counts].filter(([, count]) => count === 1).map(([id]) => id));
}

function isDefaultExportOf(declaration: ComponentDeclaration, file: string): boolean {
  if (declaration.module.file !== file) return false;
  const fn = declaration.jsxRoot.parent;
  if (fn !== undefined && ts.isFunctionDeclaration(fn) && fn.parent === declaration.module.source) {
    const modifiers = ts.getModifiers(fn) ?? [];
    if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) return true;
  }
  if (!isTopLevelFunction(fn, declaration.module.source)) return false;
  return declaration.module.source.statements.some(
    (statement) =>
      ts.isExportAssignment(statement) &&
      statement.isExportEquals !== true &&
      ts.isIdentifier(statement.expression) &&
      statement.expression.text === declaration.name,
  );
}

/**
 * Whether a component's function is bound at the top of its module, so that an
 * `export default Name` naming it means THIS function and not a nested one
 * that happens to share the name.
 */
function isTopLevelFunction(fn: ts.Node | undefined, source: ts.SourceFile): boolean {
  if (fn === undefined) return false;
  if (ts.isFunctionDeclaration(fn)) return fn.parent === source;
  const declaration = fn.parent;
  return (
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer === fn &&
    declaration.parent?.parent?.parent === source
  );
}

/** The JSX a component body returns, when it has exactly one return and it is last. */
function singleReturnedJsx(body: ts.Node): ts.Node | null {
  if (!ts.isBlock(body)) return isJsx(body) ? body : null;
  const returns: ts.ReturnStatement[] = [];
  const visit = (node: ts.Node): void => {
    if (isFunctionLike(node)) return;
    if (ts.isReturnStatement(node)) returns.push(node);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
  const last = body.statements.at(-1);
  const [only] = returns;
  if (returns.length !== 1 || only !== last || only?.expression === undefined) return null;
  return isJsx(only.expression) ? only.expression : null;
}

function isJsx(node: ts.Node): boolean {
  let current = node;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current) || ts.isJsxFragment(current);
}

function collectIds(node: ts.Node, counts: Map<string, number>): void {
  if (ts.isJsxExpression(node)) return;
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const tag = tagNameOf(node);
    if (!isProvablyHostTag(tag) || INERT_TAGS.has(tag)) return;
    const id = idOf(node);
    if (id !== null) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  ts.forEachChild(node, (child) => collectIds(child, counts));
}

function idOf(element: JsxElementNode): string | null {
  const effective = findAttribute(element, "id");
  if (effective === null || overriddenByLaterSpread(effective)) return null;
  return literalAttributeValue(effective);
}

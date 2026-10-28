import ts from "typescript";

import { nameFromSourceIdentifier, type AnchorName } from "./anchor-name.js";
import {
  isNameWrittenIn,
  isShadowed,
  resolveStaticValue,
  unwrap,
  type ResolutionContext,
} from "./evaluate.js";
import {
  attributesOf,
  findAttribute,
  literalAttributeValue,
  type JsxElementNode,
} from "./jsx-facts.js";
import { stringValueOf } from "./literals.js";

/**
 * The string a link's `href` expression renders, read only when every step to
 * it is decided by syntax: a literal, a declared value (`ctas.primary.href`,
 * through `resolveStaticValue`, which already refuses `let`, shadowing,
 * spreads, optional and indexed reads), or either of those passed through a
 * function that provably returns its argument unchanged (`localize(href)`).
 *
 * `name` is the chain of source names the value was read through, which no
 * edit to the value can change, so it may name the link. A literal has none.
 */
export interface HrefReading {
  readonly href: string;
  readonly name: AnchorName | null;
}

/**
 * Attributes that decide nothing about where a link goes or how it gets there:
 * presentation, identity, accessibility and loading. A link value stores only
 * `{ label, destination, target }`, so any other attribute that decides the
 * navigation (`as` and `locale` rewrite the URL, `replace` and `scroll` change
 * history and scroll, a handler can navigate anywhere, `rel` changes the
 * request, `download` changes what happens) would be lost once stored.
 */
const BEHAVIOUR_NEUTRAL_ATTRIBUTES: ReadonlySet<string> = new Set([
  "href",
  "target",
  "rel",
  "className",
  "style",
  "id",
  "key",
  "title",
  "role",
  "tabIndex",
  "prefetch",
  "children",
]);

/** What the runtime renders beside a `new_window` link, and so the one `rel` it keeps. */
const NEW_WINDOW_REL = "noopener noreferrer";

/**
 * Why a link's behaviour is more than a link value can store, or null.
 *
 * A link value's target is `same_window` or `new_window`, rendered as no
 * `target` and as `_blank` with `rel="noopener noreferrer"`. So the element
 * may carry no `target` or exactly `_blank`, a `rel` only as that pair beside
 * `_blank`, no spread, and otherwise only attributes that decide nothing about
 * the navigation. Judged for every link kind: a value that drops part of the
 * behaviour opens somewhere else whatever its destination.
 */
export function unstorableLinkBehaviour(element: JsxElementNode): string | null {
  const target = findAttribute(element, "target");
  const targetValue = target === null ? null : literalAttributeValue(target);
  if (target !== null && targetValue !== "_blank") {
    return `its target is ${targetValue === null ? "computed" : `'${targetValue}'`}, and a link field stores only the current window or \`_blank\``;
  }
  const rel = findAttribute(element, "rel");
  if (rel !== null && (targetValue !== "_blank" || literalAttributeValue(rel) !== NEW_WINDOW_REL)) {
    return `its rel is not '${NEW_WINDOW_REL}' beside \`_blank\`, the only rel a link field renders`;
  }
  for (const attribute of attributesOf(element)) {
    if (ts.isJsxSpreadAttribute(attribute)) return "it carries a spread, which can carry anything";
    const name = attribute.name.getText();
    if (name.startsWith("aria-") || name.startsWith("data-")) continue;
    if (!BEHAVIOUR_NEUTRAL_ATTRIBUTES.has(name)) {
      return `it carries '${name}', which a link field cannot store`;
    }
  }
  return null;
}

export function readHref(expression: ts.Expression, context: ResolutionContext): HrefReading | null {
  const unwrapped = unwrap(expression);
  const call = identityCall(unwrapped, context.module.source);
  if (call !== null) {
    // A literal read through `keep("/")` was unreadable before wrappers were,
    // so it takes the wrapper's NAME rather than the `#` every literal sibling
    // already holds: a link that just became readable must not turn an
    // existing sibling's anchor ambiguous.
    const inner = readHref(call.argument, context);
    if (inner === null || inner.name !== null) return inner;
    return { href: inner.href, name: nameFromSourceIdentifier(`call:${call.callee}`) };
  }
  const literal = stringValueOf(unwrapped);
  if (literal !== null) return { href: literal, name: null };
  const resolved = resolveStaticValue(unwrapped, context);
  if (resolved === null) return null;
  const names = resolved.path.flatMap((segment) =>
    segment.kind === "binding" || segment.kind === "property" ? [segment.name] : [],
  );
  return { href: resolved.value, name: nameFromSourceIdentifier(`const:${names.join(".")}`) };
}

/**
 * The one argument, and the callee's name, of a call to a function declared in
 * this module that returns its single parameter unchanged, or null.
 *
 * Only the identity is trusted, and only when nothing else can be: one plain
 * parameter (no default, no rest, no destructuring), a body that is that
 * parameter or a block holding exactly `return parameter;`, one declaration of
 * the name at module level, never written to, and not shadowed where it is
 * called. A wrapper that prefixes a locale, appends a slash or logs on the
 * way is a different href, and an imported one is a body this module cannot
 * see, so all of those are refused rather than evaluated.
 */
function identityCall(
  expression: ts.Expression,
  source: ts.SourceFile,
): { readonly argument: ts.Expression; readonly callee: string } | null {
  if (!ts.isCallExpression(expression) || expression.questionDotToken !== undefined) return null;
  const callee = unwrap(expression.expression);
  if (!ts.isIdentifier(callee)) return null;
  const [argument, ...rest] = expression.arguments;
  if (argument === undefined || rest.length > 0 || ts.isSpreadElement(argument)) return null;
  if (isShadowed(expression, callee.text)) return null;
  const declared = moduleFunctionNamed(source, callee.text);
  if (declared === null || !returnsItsParameter(declared)) return null;
  if (isNameWrittenIn(source, callee.text)) return null;
  return { argument, callee: callee.text };
}

type FunctionNode = ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;

/**
 * The module-level function a name declares, when exactly one statement
 * declares it and that declaration is a `const` function or a function
 * declaration. `scan.ts::namedFunctionsOf` also walks nested scopes and ignores
 * `let`, so it cannot answer "the only binding of this name".
 */
function moduleFunctionNamed(source: ts.SourceFile, name: string): FunctionNode | null {
  const declared: (FunctionNode | null)[] = [];
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      declared.push(statement.body === undefined ? null : statement);
    }
    if (!ts.isVariableStatement(statement)) continue;
    const isConst = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== name) continue;
      const initializer = declaration.initializer === undefined ? null : unwrap(declaration.initializer);
      const isFunction =
        initializer !== null && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer));
      declared.push(isConst && isFunction ? initializer : null);
    }
  }
  return declared.length === 1 ? (declared[0] ?? null) : null;
}

function returnsItsParameter(fn: FunctionNode): boolean {
  const modifiers = ts.canHaveModifiers(fn) ? (ts.getModifiers(fn) ?? []) : [];
  if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword)) return false;
  if (fn.parameters.length !== 1 || fn.asteriskToken !== undefined) return false;
  const parameter = fn.parameters[0]!;
  if (
    !ts.isIdentifier(parameter.name) ||
    parameter.initializer !== undefined ||
    parameter.dotDotDotToken !== undefined
  ) {
    return false;
  }
  const name = parameter.name.text;
  const body = fn.body;
  if (body === undefined) return false;
  if (!ts.isBlock(body)) return isIdentifierNamed(body, name);
  const [only, ...others] = body.statements;
  return (
    only !== undefined &&
    others.length === 0 &&
    ts.isReturnStatement(only) &&
    only.expression !== undefined &&
    isIdentifierNamed(only.expression, name)
  );
}

function isIdentifierNamed(expression: ts.Expression, name: string): boolean {
  const unwrapped = unwrap(expression);
  return ts.isIdentifier(unwrapped) && unwrapped.text === name;
}


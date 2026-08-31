import ts from "typescript";

/**
 * Small, purely syntactic readings of JSX and the expressions around it. No
 * inference lives here.
 */

export type JsxElementNode = ts.JsxElement | ts.JsxSelfClosingElement;

/**
 * Props React consumes on the CALLER's side. They are never passed on to the
 * receiving component, so no value written into one can render — whatever a
 * same-named prop does inside that component describes something else.
 *
 * Only `key` is universal. `ref` reaches a function component as an ordinary
 * prop from React 19 onward, and is consumed before it from React 18 back, so
 * whether it is caller-consumed is a fact about the REPOSITORY BEING READ, not
 * about this one. `reactMajorOf` answers it from there.
 */
export const CALLER_CONSUMED_ATTRIBUTES: ReadonlySet<string> = new Set(["key"]);

/** The first React version that hands a function component its `ref` prop. */
const REF_IS_A_PROP_FROM = 19;

/**
 * Whether `ref` written on a component in this repository reaches the
 * component at all.
 *
 * Unknown fails CLOSED — treated as consumed — because the two mistakes are
 * not equal. Skipping it can only cost a field for a component that renders
 * its own `ref` as text, which nothing does; asking the receiver when React
 * consumes it offers a customer a field that edits nothing, which is the
 * silent failure this tool exists to avoid.
 */
export function refReachesComponents(reactMajor: number | null): boolean {
  return reactMajor !== null && reactMajor >= REF_IS_A_PROP_FROM;
}

/**
 * Attributes that carry no user-visible or assistive-technology content. This
 * list exists so that everything NOT on it is reported rather than silently
 * dropped: the tool fails towards over-reporting, never towards guessing.
 */
export const STRUCTURAL_ATTRIBUTES: ReadonlySet<string> = new Set([
  "className",
  "class",
  "id",
  "key",
  "ref",
  "style",
  "role",
  "type",
  "rel",
  "target",
  "lang",
  "dir",
  "width",
  "height",
  "sizes",
  "priority",
  "loading",
  "decoding",
  "fetchPriority",
  "viewBox",
  "xmlns",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "opacity",
  "cx",
  "cy",
  "r",
  "x1",
  "x2",
  "y1",
  "y2",
  "d",
  "aria-hidden",
  "data-testid",
  "suppressHydrationWarning",
]);

/** Inline formatting elements. Their presence turns a block into rich text. */
export const INLINE_MARK_TAGS: ReadonlySet<string> = new Set(["em", "i", "strong", "b"]);

/** Landmark elements. Unique within a component they act as durable regions. */
export const LANDMARK_TAGS: ReadonlySet<string> = new Set([
  "header",
  "footer",
  "nav",
  "main",
  "aside",
]);

/** Sectioning elements. Without a literal `id` they carry no durable name. */
export const SECTIONING_TAGS: ReadonlySet<string> = new Set(["section", "article"]);

/** Subtrees whose text is never rendered as prose. */
export const OPAQUE_TAGS: ReadonlySet<string> = new Set(["script", "style", "svg", "template"]);

const HEADING_PATTERN = /^h([1-6])$/u;

export function tagNameOf(node: JsxElementNode): string {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  return opening.tagName.getText();
}

export function attributesOf(node: JsxElementNode): readonly ts.JsxAttributeLike[] {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  return opening.attributes.properties;
}

/**
 * Whether an `id` written here would name a REGION rather than tell one leaf
 * from its siblings.
 *
 * A sectioning or landmark tag always does. Anything else does only when it
 * holds element children -- a `<div>` whose only child is `{rows.map(...)}`
 * holds a JSX EXPRESSION, so its id becomes a discriminator that the walk drops
 * before the collection inside is anchored.
 *
 * Stated once because two readers need the same answer: `extract.ts` decides
 * what an id means, and `name-anchors.ts` must not write one where it would
 * mean nothing.
 */
export function namesARegion(element: JsxElementNode, tag: string): boolean {
  if (SECTIONING_TAGS.has(tag) || LANDMARK_TAGS.has(tag)) return true;
  return childrenOf(element).some(
    (child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child),
  );
}

export function childrenOf(node: JsxElementNode): readonly ts.JsxChild[] {
  return ts.isJsxElement(node) ? node.children : [];
}

export function headingLevelOf(tag: string): number | null {
  const match = HEADING_PATTERN.exec(tag);
  return match === null ? null : Number.parseInt(match[1]!, 10);
}

/**
 * JSX reads a name that begins with a lowercase character as a host element and
 * every other name as a component. Nothing else about the name matters, and in
 * particular the alphabet does not: `<Élan />` is a component to the renderer.
 *
 * One predicate answers this for every reading. Written as a pair — a host test
 * and a component test — the two drifted over exactly that alphabet, and a name
 * one accepted while the other refused it produced a tag the render tree
 * followed that no declaration could ever answer for.
 */
/**
 * Is the DOM provably on the other side of a tag with this name?
 *
 * Deliberately stronger than "not a component name", and not a second answer to
 * the question that predicate settles. `isComponentName` reads which of two
 * things JSX treats a NAME as; this reads whether the browser is provably what
 * receives a value, and only a bare lowercase name settles that. A dotted tag
 * is a member expression, which JSX resolves as a component whatever its case
 * — `<motion.div />` is not a `div` — so it is not called settled.
 */
export function isProvablyHostTag(name: string): boolean {
  return !name.includes(".") && !isComponentName(name);
}

export function isComponentName(name: string): boolean {
  const first = name[0];
  return first !== undefined && first !== first.toLowerCase();
}

/** Wrappers that restate an expression without changing what it is or where it goes. */
export function isTransparentWrapper(
  node: ts.Node,
): node is
  | ts.ParenthesizedExpression
  | ts.AsExpression
  | ts.SatisfiesExpression
  | ts.NonNullExpression {
  return (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node)
  );
}

/** The expression a chain of transparent wrappers is written around. */
export function unwrapTransparent(expression: ts.Expression): ts.Expression {
  return isTransparentWrapper(expression) ? unwrapTransparent(expression.expression) : expression;
}

/** Whether anything below this node writes JSX, at any depth. */
export function containsJsx(node: ts.Node): boolean {
  let found = false;
  const visit = (child: ts.Node): void => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
      found = true;
    }
    if (!found) ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

export interface NamedAttribute {
  readonly name: string;
  readonly node: ts.JsxAttribute;
}

export function namedAttributes(node: JsxElementNode): readonly NamedAttribute[] {
  return attributesOf(node)
    .filter(ts.isJsxAttribute)
    .map((attribute) => ({ name: attribute.name.getText(), node: attribute }));
}

export function findAttribute(node: JsxElementNode, name: string): ts.JsxAttribute | null {
  return namedAttributes(node).find((attribute) => attribute.name === name)?.node ?? null;
}

/** The string a JSX attribute holds, when it is a plain literal and only then. */
export function literalAttributeValue(attribute: ts.JsxAttribute): string | null {
  const initializer = attribute.initializer;
  if (initializer === undefined) return null;
  if (ts.isStringLiteral(initializer)) return initializer.text;
  if (!ts.isJsxExpression(initializer) || initializer.expression === undefined) return null;
  const expression = initializer.expression;
  if (ts.isStringLiteral(expression)) return expression.text;
  if (ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
  return null;
}

export function attributeExpression(attribute: ts.JsxAttribute): ts.Expression | null {
  const initializer = attribute.initializer;
  if (initializer === undefined) return null;
  if (ts.isStringLiteral(initializer)) return initializer;
  if (ts.isJsxExpression(initializer)) return initializer.expression ?? null;
  return null;
}

export function isAriaAttribute(name: string): boolean {
  return name.startsWith("aria-") && name !== "aria-hidden";
}

export function hasAriaHidden(node: JsxElementNode): boolean {
  const attribute = findAttribute(node, "aria-hidden");
  if (attribute === null) return false;
  const expression = attributeExpression(attribute);
  if (expression === null) return true;
  return expression.kind !== ts.SyntaxKind.FalseKeyword;
}

const HTML_ENTITIES: ReadonlyMap<string, string> = new Map([
  ["&ldquo;", "“"],
  ["&rdquo;", "”"],
  ["&lsquo;", "‘"],
  ["&rsquo;", "’"],
  ["&nbsp;", " "],
  ["&amp;", "&"],
  ["&mdash;", "—"],
  ["&ndash;", "–"],
  ["&copy;", "©"],
]);

export function normaliseJsxText(raw: string): string {
  let text = raw.replace(/\s+/gu, " ");
  for (const [entity, character] of HTML_ENTITIES) {
    text = text.replaceAll(entity, character);
  }
  return text;
}

/** A `{" "}` style spacer contributes whitespace, not content. */
export function jsxExpressionStringValue(child: ts.JsxExpression): string | null {
  const expression = child.expression;
  if (expression === undefined) return null;
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  return null;
}

/**
 * Whether a spread after this attribute may replace it.
 *
 * JSX applies attributes left to right, so `<x a="1" {...rest} />` receives
 * whatever `rest` says `a` is. Both the caller side and the receiver side of
 * the prop reading need this, so it is stated once.
 */
export function overriddenByLaterSpread(attribute: ts.JsxAttribute): boolean {
  const parent = attribute.parent;
  if (!ts.isJsxAttributes(parent)) return false;
  const attributes = parent.properties;
  const index = attributes.indexOf(attribute);
  if (index < 0) return false;
  return attributes.slice(index + 1).some(ts.isJsxSpreadAttribute);
}

/**
 * The property a binding element names, when it is written down.
 *
 * `{ title }`, `{ title: heading }` and `{ "aria-label": label }` all name a
 * property in the source. Only a COMPUTED key does not, and a prop whose name
 * is not a valid identifier can be written no other way — which is why
 * `props["aria-label"]` was always read as a property and the destructured
 * spelling of the same prop was not.
 */
export function bindingPropertyName(element: ts.BindingElement): string | null {
  const declared = element.propertyName ?? element.name;
  if (ts.isIdentifier(declared) || ts.isStringLiteral(declared)) return declared.text;
  return null;
}

/**
 * Whether the content walk enters this element at all.
 *
 * `aria-hidden` marks a subtree assistive technology ignores, and this tool
 * follows that: it is decoration, not copy. An opaque tag's body is executable
 * or machine text rather than prose. Both the extractor and the prop-role
 * reader need the same answer, or the reader proposes a field for markup the
 * extractor never visits.
 */
export function isWalkedElement(element: JsxElementNode): boolean {
  return !hasAriaHidden(element) && !OPAQUE_TAGS.has(tagNameOf(element));
}

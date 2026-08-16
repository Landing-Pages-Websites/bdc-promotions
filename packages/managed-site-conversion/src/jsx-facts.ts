import ts from "typescript";

/** Small, purely syntactic readings of JSX. No inference lives here. */

export type JsxElementNode = ts.JsxElement | ts.JsxSelfClosingElement;

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

export function childrenOf(node: JsxElementNode): readonly ts.JsxChild[] {
  return ts.isJsxElement(node) ? node.children : [];
}

export function headingLevelOf(tag: string): number | null {
  const match = HEADING_PATTERN.exec(tag);
  return match === null ? null : Number.parseInt(match[1]!, 10);
}

export function isHostTag(tag: string): boolean {
  const first = tag[0];
  return first !== undefined && first === first.toLowerCase();
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

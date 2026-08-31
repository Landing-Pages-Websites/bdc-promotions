import ts from "typescript";

import type {
  ManagedRichTextBlock,
  ManagedRichTextDocument,
  ManagedRichTextInline,
  ManagedRichTextMarkKind,
} from "@landing-pages-websites/managed-site-contract";

import {
  childrenOf,
  INLINE_MARK_TAGS,
  jsxExpressionStringValue,
  normaliseJsxText,
  tagNameOf,
  type JsxElementNode,
} from "./jsx-facts.js";

/** The proposer only ever migrates plain text runs, never inline links. */
type TextInline = Extract<ManagedRichTextInline, { readonly type: "text" }>;

export interface ChildPartition {
  readonly children: readonly ts.JsxChild[];
  /** Direct text of this element only. */
  readonly textRun: string;
  /** Text of this element and its descendants, for link labels. */
  readonly allText: string;
  readonly elementChildren: readonly JsxElementNode[];
  readonly expressionChildren: readonly ts.JsxExpression[];
  readonly hasInlineMark: boolean;
}

function isElementChild(child: ts.JsxChild): child is JsxElementNode {
  return ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child);
}

function directTextOf(child: ts.JsxChild): string | null {
  if (ts.isJsxText(child)) return normaliseJsxText(child.text);
  if (ts.isJsxExpression(child)) return jsxExpressionStringValue(child);
  return null;
}

function descendantTextOf(child: ts.JsxChild): string {
  const direct = directTextOf(child);
  if (direct !== null) return direct;
  if (!isElementChild(child)) return "";
  return childrenOf(child).map(descendantTextOf).join("");
}

export function partitionChildren(children: readonly ts.JsxChild[]): ChildPartition {
  const elementChildren = children.filter(isElementChild);
  const expressionChildren = children.filter(
    (child): child is ts.JsxExpression =>
      ts.isJsxExpression(child) && jsxExpressionStringValue(child) === null,
  );
  const textRun = children.map((child) => directTextOf(child) ?? "").join("");
  const allText = children.map(descendantTextOf).join("");
  return {
    children,
    textRun: textRun.trim(),
    allText: allText.replace(/\s+/gu, " ").trim(),
    elementChildren,
    expressionChildren,
    hasInlineMark: elementChildren.some((child) => INLINE_MARK_TAGS.has(tagNameOf(child))),
  };
}

const MARK_BY_TAG: ReadonlyMap<string, ManagedRichTextMarkKind> = new Map([
  ["em", "italic"],
  ["i", "italic"],
  ["strong", "bold"],
  ["b", "bold"],
]);

function inlinesFor(
  child: ts.JsxChild,
  markKinds: readonly ManagedRichTextMarkKind[],
): readonly TextInline[] | null {
  const direct = directTextOf(child);
  if (direct !== null) {
    if (direct.length === 0) return [];
    // Kinds are accumulated while walking and become mark objects only here.
    // Unmarked text omits the key rather than carrying an empty array, so one
    // run of prose has exactly one spelling and one hash.
    const marks = markKinds.map((kind) => ({ type: kind }) as const);
    return [
      marks.length === 0
        ? { type: "text", text: direct }
        : { type: "text", text: direct, marks },
    ];
  }
  if (!isElementChild(child)) return null;
  const mark = MARK_BY_TAG.get(tagNameOf(child));
  if (mark === undefined) return null;
  // `<strong><strong>x</strong></strong>` nests the same kind twice, and the
  // schema rejects a text node carrying one kind twice. Nesting a mark inside
  // itself adds no formatting, so the kind is recorded once.
  const nested = markKinds.includes(mark) ? markKinds : [...markKinds, mark];
  const collected: TextInline[] = [];
  for (const grandchild of childrenOf(child)) {
    const inlines = inlinesFor(grandchild, nested);
    if (inlines === null) return null;
    collected.push(...inlines);
  }
  return collected;
}

/**
 * Builds one rich-text document from a `<ul>` or `<ol>` of static items.
 *
 * Items written out as siblings have nothing to tell them apart — no id, no
 * name, only their order, which `anchors.ts` refuses as identity. As separate
 * values they are unnameable; as ONE list they need no item identity at all,
 * and the contract already models `bullet_list` and `ordered_list`.
 *
 * Returns null whenever an item is not a plain `<li>` of inline text: a
 * computed child, a nested list, or a link, each of which this reading models
 * elsewhere and must not flatten into prose.
 */
export function buildRichTextListDocument(
  element: JsxElementNode,
  ordered: boolean,
): ManagedRichTextDocument | null {
  type ListItem = Extract<ManagedRichTextBlock, { type: "bullet_list" }>["content"][number];
  const items: ListItem[] = [];
  for (const child of childrenOf(element)) {
    if (ts.isJsxText(child)) {
      // The indentation between `<li>` siblings. `normaliseJsxText` collapses it
      // to a single space, which is not empty, so every conventionally
      // formatted list refused and fell back to per-item candidates -- the
      // exact shape this exists to handle. Real text between items still
      // refuses, because it would be dropped from the document.
      if (child.text.trim() !== "") return null;
      continue;
    }
    if (!ts.isJsxElement(child)) return null;
    if (child.openingElement.tagName.getText() !== "li") return null;
    const inlines = buildRichTextDocument(childrenOf(child));
    if (inlines === null) return null;
    const [paragraph] = inlines.content;
    if (paragraph === undefined || paragraph.type !== "paragraph") return null;
    items.push({ type: "list_item", content: [paragraph] });
  }
  if (items.length === 0) return null;
  return {
    type: "doc",
    content: [{ type: ordered ? "ordered_list" : "bullet_list", content: items }],
  };
}

/** Builds a single-paragraph rich-text document, or null if anything is computed. */
export function buildRichTextDocument(
  children: readonly ts.JsxChild[],
): ManagedRichTextDocument | null {
  const inlines: TextInline[] = [];
  for (const child of children) {
    const produced = inlinesFor(child, []);
    if (produced === null) return null;
    inlines.push(...produced);
  }
  const trimmed = trimInlineEdges(inlines);
  if (trimmed.length === 0) return null;
  return { type: "doc", content: [{ type: "paragraph", content: trimmed }] };
}

function trimInlineEdges(
  inlines: readonly TextInline[],
): readonly ManagedRichTextInline[] {
  const nonEmpty = inlines.filter((inline) => inline.text.length > 0);
  const first = nonEmpty.at(0);
  const last = nonEmpty.at(-1);
  if (first === undefined || last === undefined) return [];
  const head: TextInline = { ...first, text: first.text.replace(/^\s+/u, "") };
  const body = nonEmpty.slice(1, -1);
  if (nonEmpty.length === 1) {
    return [{ ...head, text: head.text.replace(/\s+$/u, "") }];
  }
  const tail: TextInline = { ...last, text: last.text.replace(/\s+$/u, "") };
  return [head, ...body, tail].filter((inline) => inline.text.length > 0);
}

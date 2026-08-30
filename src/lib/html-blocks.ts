/**
 * HTML body to the same block AST `markdown.ts` produces.
 *
 * Roughly 38% of the posts the content pipeline publishes are raw HTML
 * (`<p>`, `<h2>`, `<table>`, `<div>`, plus an inlined
 * `<script type="application/ld+json">`), not markdown. The markdown parser
 * matches none of it, falls through to its paragraph branch, and React escapes
 * the result, so the reader sees the tags. This module is the missing branch.
 *
 * The invariant it exists to hold:
 *
 *   Every construct the content pipeline can emit renders as a Block. Nothing
 *   reaches the page as literal markup.
 *
 * It is deliberately hand-rolled and deliberately bounded. `src/` here
 * propagates to roughly 276 customer sites, so a runtime dependency for a
 * build-time concern is 276 lockfile changes and a supply-chain surface; the
 * house style (`markdown.ts`, `imageHeader.ts`) is hand-rolled parsers for the
 * same reason. The input is not arbitrary web HTML, it is our own pipeline's
 * output over a small, observable tag set.
 *
 * Three rules decide every case this parser does not otherwise know:
 *
 *  1. `<script>`, `<style>`, `<template>`, `<noscript>` and HTML comments are
 *     dropped whole, content included.
 *  2. Any other unrecognised tag is unwrapped: the tag goes, its children stay.
 *  3. Entities are decoded.
 *
 * Rules 1 and 2 are the fail-closed direction for a renderer. Losing a wrapper
 * degrades presentation; leaking one degrades the page into visible source.
 * Nothing in this module ever puts markup into a text node.
 *
 * Three layers: `html-tags.ts` is the policy (which tag becomes what),
 * `html-tokens.ts` is the scanner (source to a tree), and this module turns
 * that tree into Blocks.
 *
 * It emits no Block kind that `markdown.ts` does not already declare in
 * `BLOCK_KINDS`. That set is a cross-repo contract (see `SUPPORTED_BLOCKS` in
 * the MEGA go-live blog migrator) and widening it here would desynchronise it.
 */

import type { Block, InlineNode, ListItem, ListNode } from "./markdown";

import {
  CELL_TAGS,
  HEAD_TAGS,
  ITEM_AND_LIST_TAGS,
  ITEM_TAGS,
  LIST_TAGS,
  ROW_TAGS,
  TABLE_SECTIONS,
  TABLE_TAGS,
  VOID_TAGS,
  isKnownTag,
  roleFor,
} from "./html-tags";

import {
  buildTree,
  decodeEntities,
  tokenize,
  type ElementNode,
  type HtmlNode,
} from "./html-tokens";

/* -------------------------------------------------------------------------- */
/* Inline                                                                      */
/* -------------------------------------------------------------------------- */

const WHITESPACE_RUN = /\s+/g;

/** HTML collapses runs of source whitespace. Done before decoding so a
 * decoded `&nbsp;` survives as a non-breaking space. */
function textFrom(value: string): InlineNode[] {
  const collapsed = value.replace(WHITESPACE_RUN, " ");
  if (collapsed === "") return [];
  return [{ kind: "text", value: decodeEntities(collapsed) }];
}

const NON_SPACE = /\S/;

function isWhitespaceOnly(node: InlineNode): boolean {
  return node.kind === "text" && !NON_SPACE.test(node.value);
}

/** Drop empty edges and trim the outermost text, so a paragraph does not open
 * or close with the whitespace that separated its tags in the source. */
function trimInline(nodes: InlineNode[]): InlineNode[] {
  let start = 0;
  let end = nodes.length;
  while (start < end && isWhitespaceOnly(nodes[start])) start += 1;
  while (end > start && isWhitespaceOnly(nodes[end - 1])) end -= 1;
  if (start === end) return [];
  const trimmed = nodes.slice(start, end);
  const first = trimmed[0];
  if (first.kind === "text") trimmed[0] = { kind: "text", value: first.value.trimStart() };
  const last = trimmed[trimmed.length - 1];
  if (last.kind === "text") {
    trimmed[trimmed.length - 1] = { kind: "text", value: last.value.trimEnd() };
  }
  return trimmed;
}

/**
 * The text of a subtree. `collapse` is false for `<pre>`, which is verbatim.
 * One accumulator rather than a join per level, so a deep subtree is not
 * re-copied once per level of depth.
 */
function textOf(node: HtmlNode, collapse: boolean, parts: string[] = []): string {
  if (node.type === "text") {
    parts.push(decodeEntities(collapse ? node.value.replace(WHITESPACE_RUN, " ") : node.value));
  } else {
    for (const child of node.children) textOf(child, collapse, parts);
  }
  return parts.join("");
}

function textContent(node: HtmlNode): string {
  return textOf(node, true);
}

/**
 * `strong` and `em` carry a plain string, so a mark wrapping a link or an image
 * cannot be expressed. Keep the children: losing bold is cosmetic, printing
 * `[text](href)` or an `<a>` at the reader is a leak. Both parsers call this,
 * because the pipeline emits the same bolded CTA in both body shapes.
 */
/**
 * A `src` `next/image` can render, or null.
 *
 * A relative path (`images/a.png`, routine in WordPress-migrated bodies) makes
 * `next/image` throw "Failed to parse src", which takes the whole post page
 * down, so it is rooted rather than passed through. Any other scheme is refused
 * outright: an unrenderable image is a gap, an unparseable one is an outage.
 */
export function imageSrc(raw: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^data:image\//i.test(value)) return value;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return null;
  return `/${value}`;
}

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\s]+/g;

/**
 * An `href` safe to put in the page, or null.
 *
 * Before this module existed, an `<a href="javascript:…">` in a body rendered
 * as escaped text and did nothing. Turning it into a real anchor is new reach,
 * so the scheme is allow-listed rather than blocked: relative paths, fragments
 * and protocol-relative URLs pass, `http`/`https`/`mailto`/`tel` pass, and
 * anything else is refused. Whitespace and control characters are stripped
 * first, because `" JaVaScript:x"` and `"java\tscript:x"` are the same URL to a
 * browser and a different string to a naive test.
 */
export function linkHref(raw: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  const scheme = value.replace(CONTROL_CHARACTERS, "").match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (scheme === null) return value;
  return ["http", "https", "mailto", "tel"].includes(scheme[1].toLowerCase()) ? value : null;
}

export function collapseMark(kind: "strong" | "em", children: InlineNode[]): InlineNode[] {
  if (children.length === 1 && children[0].kind === "text") {
    return [{ kind, value: children[0].value }];
  }
  return children;
}

function inlineFromNodes(nodes: HtmlNode[], excluded?: ReadonlySet<string>): InlineNode[] {
  return nodes.flatMap((node) => inlineFromNode(node, excluded));
}

function inlineFromNode(node: HtmlNode, excluded?: ReadonlySet<string>): InlineNode[] {
  if (node.type === "text") return textFrom(node.value);
  if (excluded?.has(node.tag)) return [];
  const role = roleFor(node.tag);
  if (role.flow !== "inline") {
    // A block or an unknown tag met in inline position contributes its
    // contents. `InlineNode` has no nesting, so this is the only lossless move.
    const children = inlineFromNodes(node.children, excluded);
    // Losing the wrapper is the accepted degradation; losing the word boundary
    // is not. Real bodies write `</strong><p>` with no whitespace between, and
    // "Drain cleaningWe clear clogs" is text no reader can parse.
    if (role.flow === "block" && children.length > 0) {
      return [{ kind: "text", value: " " }, ...children, { kind: "text", value: " " }];
    }
    return children;
  }
  switch (role.inline) {
    case "space":
      return [{ kind: "text", value: " " }];
    case "image": {
      const alt = node.attrs.alt ?? "";
      const src = imageSrc(node.attrs.src ?? "");
      // A refused src loses the image, never its words: the alt is the only
      // text the image carried, and dropping it silently loses content.
      if (src === null) {
        const children = inlineFromNodes(node.children, excluded);
        if (children.length > 0) return children;
        return alt === "" ? [] : [{ kind: "text", value: alt }];
      }
      return [{ kind: "image", src, alt }];
    }
    case "link": {
      const href = linkHref(node.attrs.href ?? "");
      const children = inlineFromNodes(node.children, excluded);
      // A refused scheme loses the anchor, never the words inside it.
      if (href === null) return children;
      const text = textContent(node).trim();
      if (text !== "") return [{ kind: "link", text, href }];
      // An anchor whose only content is an image. A link cannot hold an image
      // in this model, so the alt becomes the link text: the anchor exists to
      // be clicked, and the same trade `collapseMark` makes applies here.
      const image = children.find((child) => child.kind === "image");
      if (image !== undefined && image.kind === "image" && image.alt !== "") {
        return [{ kind: "link", text: image.alt, href }];
      }
      return children;
    }
    case "code": {
      const text = textContent(node);
      return text === "" ? [] : [{ kind: "code", value: text }];
    }
    default:
      return collapseMark(role.inline, inlineFromNodes(node.children, excluded));
  }
}

/* -------------------------------------------------------------------------- */
/* Blocks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Elements matching `tags`, not descending into a match and not crossing a
 * `stopAt` boundary. That boundary is what keeps a `<table>` nested inside a
 * `<td>` from donating its rows to the outer table.
 */
function collectDescendants(
  node: ElementNode,
  tags: ReadonlySet<string>,
  stopAt: ReadonlySet<string>,
): ElementNode[] {
  const found: ElementNode[] = [];
  const walk = (children: HtmlNode[]): void => {
    for (const child of children) {
      if (child.type !== "element") continue;
      if (tags.has(child.tag)) {
        found.push(child);
        continue;
      }
      if (stopAt.has(child.tag)) continue;
      walk(child.children);
    }
  };
  walk(node.children);
  return found;
}

function containsBlock(node: ElementNode): boolean {
  return node.children.some((child) => {
    if (child.type !== "element") return false;
    const role = roleFor(child.tag);
    if (role.flow === "block") return true;
    if (role.flow === "structure") return containsBlock(child);
    return false;
  });
}

function listFrom(node: ElementNode, ordered: boolean): ListNode {
  const items: ListItem[] = collectDescendants(node, ITEM_TAGS, LIST_TAGS).map((li) => ({
    inline: trimInline(inlineFromNodes(li.children, LIST_TAGS)),
    children: collectDescendants(li, LIST_TAGS, LIST_TAGS).map((nested) =>
      listFrom(nested, nested.tag === "ol"),
    ),
  }));
  // `<ul>bare text</ul>` would otherwise render an empty list and lose the text.
  const stray = trimInline(inlineFromNodes(node.children, ITEM_AND_LIST_TAGS));
  if (stray.length > 0) {
    const firstItem = node.children.findIndex(
      (child) => child.type === "element" && ITEM_TAGS.has(child.tag),
    );
    const firstStray = node.children.findIndex(
      (child) => child.type === "text" && child.value.trim() !== "",
    );
    // Keep its place: lead-in text before the first `<li>` reads wrong last.
    const item: ListItem = { inline: stray, children: [] };
    if (firstItem === -1 || (firstStray !== -1 && firstStray < firstItem)) items.unshift(item);
    else items.push(item);
  }
  return { ordered, items };
}

function cellsOf(row: ElementNode): InlineNode[][] {
  const cells = collectDescendants(row, CELL_TAGS, TABLE_TAGS);
  return cells.map((cell) => trimInline(inlineFromNodes(cell.children)));
}

/**
 * One rectangle rule for both body shapes: the widest row sets the width, and
 * every row is padded to it. Truncating to the header's width instead would
 * silently drop a cell a ragged source did carry.
 */
export function tableBlock(header: InlineNode[][], rows: InlineNode[][][]): Block | null {
  const width = rows.reduce((widest, row) => Math.max(widest, row.length), header.length);
  if (width === 0) return null;
  const pad = (row: InlineNode[][]): InlineNode[][] =>
    Array.from({ length: width }, (_, index) => row[index] ?? []);
  return {
    kind: "table",
    // A table with no header row keeps an empty one. Padding it to the table's
    // width instead would put a row of blank bordered cells above every
    // headerless table, which is the commonest shape the pipeline emits.
    header: header.length === 0 ? [] : pad(header),
    rows: rows.map(pad),
  };
}

function isHeaderRow(row: ElementNode): boolean {
  // Without a `thead`, a row made entirely of `th` is still the header. A row
  // of `td` is data: promoting it would invent a header the source did not have.
  const cells = collectDescendants(row, CELL_TAGS, TABLE_TAGS);
  return cells.length > 0 && cells.every((cell) => cell.tag === "th");
}

function tableBlocks(node: ElementNode): Block[] {
  const headRow = collectDescendants(node, HEAD_TAGS, TABLE_TAGS)
    .flatMap((head) => collectDescendants(head, ROW_TAGS, TABLE_TAGS))
    .at(0);
  const allRows = collectDescendants(node, ROW_TAGS, TABLE_TAGS);
  const header =
    headRow ?? (allRows.length > 0 && isHeaderRow(allRows[0]) ? allRows[0] : undefined);

  const headerCells = header === undefined ? [] : cellsOf(header);
  const rows = allRows.filter((row) => row !== header).map(cellsOf);

  const blocks: Block[] = [];
  // A `<caption>` (or any other stray content) is unwrapped by rule 2 and lands
  // here as loose inline. Emitting it before the table keeps the text.
  const lead = trimInline(inlineFromNodes(node.children, TABLE_SECTIONS));
  if (lead.length > 0) blocks.push({ kind: "paragraph", inline: lead });
  const table = tableBlock(headerCells, rows);
  if (table !== null) blocks.push(table);
  return blocks;
}

/** A nested block flattened into blockquote lines, so nothing inside a quote
 * is dropped for want of a place to put it. */
function blockToLines(block: Block): InlineNode[][] {
  switch (block.kind) {
    case "paragraph":
    case "heading":
      return [block.inline];
    case "list": {
      // Recursive: a nested group lives on `item.children`, and taking only
      // `item.inline` dropped every child item a quoted list carried.
      const lines = (items: ListItem[]): InlineNode[][] =>
        items.flatMap((item) => [
          item.inline,
          ...item.children.flatMap((group) => lines(group.items)),
        ]);
      return lines(block.items);
    }
    case "blockquote":
      return block.lines;
    case "table":
      return [block.header, ...block.rows].map((row) => row.flat());
    case "code":
      return [[{ kind: "text", value: block.text }]];
    default:
      return [[{ kind: "image", src: block.src, alt: block.alt }]];
  }
}

interface Context {
  /**
   * Whether the document is still at its first block, which is what makes an
   * `h1` the pipeline's duplicate title. Cleared by the drop itself, so exactly
   * one `h1` can ever be dropped.
   */
  leading: boolean;
  /** The dropped heading, kept so a body that was nothing else can show it. */
  droppedTitle?: Block;
}

function blocksFromNodes(nodes: HtmlNode[], context: Context): Block[] {
  const blocks: Block[] = [];
  let pending: InlineNode[] = [];

  const push = (block: Block): void => {
    blocks.push(block);
    context.leading = false;
  };

  /** A space between two runs that were separate cells or items. */
  const separate = (): void => {
    const last = pending[pending.length - 1];
    if (last !== undefined && !(last.kind === "text" && last.value.endsWith(" "))) {
      pending.push({ kind: "text", value: " " });
    }
  };

  const flush = (): void => {
    const inline = trimInline(pending);
    pending = [];
    if (inline.length === 0) return;
    // A lone image is its own block, matching the markdown parser: wrapping one
    // in a paragraph nests a figure inside a `<p>`.
    if (inline.length === 1 && inline[0].kind === "image") {
      push({ kind: "image", src: inline[0].src, alt: inline[0].alt });
      return;
    }
    push({ kind: "paragraph", inline });
  };

  const visit = (children: HtmlNode[]): void => {
    for (const child of children) {
      if (child.type === "text") {
        pending.push(...textFrom(child.value));
        continue;
      }
      const role = roleFor(child.tag);
      if (role.flow === "inline") {
        pending.push(...inlineFromNode(child));
        continue;
      }
      if (role.flow !== "block") {
        // Rule 2, and the same path a `<li>` outside a list takes. A dropped
        // element cannot reach here: `buildTree` never attaches one.
        // A named part is a cell or an item, so it needs a separator or
        // `<li>c<li>d` outside a list reads as the non-word "cd".
        if (role.flow === "structure" && role.part !== undefined) separate();
        visit(child.children);
        continue;
      }
      if (role.block === "paragraph" && containsBlock(child)) {
        // `<div class="answer-capsule"><p>…</p></div>` is a wrapper, not a
        // paragraph. Unwrapping it is what keeps nested divs from multiplying.
        visit(child.children);
        continue;
      }
      flush();
      switch (role.block) {
        case "paragraph": {
          pending = inlineFromNode(child);
          flush();
          break;
        }
        case "heading": {
          const inline = trimInline(inlineFromNodes(child.children));
          if (inline.length === 0) break;
          if (role.dropWhenLeading && context.leading) {
            context.leading = false;
            context.droppedTitle = { kind: "heading", level: role.level, inline };
            break;
          }
          push({ kind: "heading", level: role.level, inline });
          break;
        }
        case "list": {
          const list = listFrom(child, role.ordered);
          if (list.items.length === 0) break;
          push({ kind: "list", ordered: list.ordered, items: list.items });
          break;
        }
        case "blockquote": {
          const lines = blocksFromNodes(child.children, { leading: false }).flatMap(blockToLines);
          const kept = lines.filter((line) => line.length > 0);
          if (kept.length === 0) break;
          push({ kind: "blockquote", lines: kept });
          break;
        }
        case "table": {
          for (const block of tableBlocks(child)) push(block);
          break;
        }
        default: {
          const text = textOf(child, false).replace(/^\n+/, "").trimEnd();
          if (text === "") break;
          push({ kind: "code", text });
          break;
        }
      }
    }
  };

  visit(nodes);
  flush();
  return blocks;
}

/* -------------------------------------------------------------------------- */
/* Entry points                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Whether a real HTML block tag begins a line of the body.
 *
 * Asked of the tokenizer, not of a regex or a per-line scan. "Where is a tag"
 * is answered in exactly one place in this codebase; a second, approximate
 * answer counts `<a>` inside `title="<a>"` as a tag, and treats a line that
 * happens to sit inside a quoted value or a comment as the start of an element.
 *
 * Every tag counts except a known INLINE one, which is what a markdown
 * paragraph legitimately opens with. Drop tags count, because a body opening
 * with a JSON-LD script is machine-generated HTML and three live customers do
 * it. UNKNOWN names count too: `<article-body><p>…` is markup whatever the
 * wrapper is called, and refusing it left the whole body on the markdown path,
 * where it rendered as escaped source.
 */
export function htmlBlockOpensALine(source: string): boolean {
  for (const token of tokenize(source)) {
    if (token.type === "text") continue;
    if (isKnownTag(token.tag) && roleFor(token.tag).flow === "inline") continue;
    let index = token.start - 1;
    while (index >= 0 && (source[index] === " " || source[index] === "\t")) index -= 1;
    if (index < 0 || source[index] === "\n") return true;
  }
  return false;
}

/**
 * The body's text that sits outside every element.
 *
 * A markdown signal only means the body is markdown when it is there. A `*` or
 * a `>` on its own line INSIDE a `<p>` is that paragraph's own content, and
 * prettier-formatted and CMS-exported bodies are full of both.
 */
export function textOutsideElements(source: string): string {
  return buildTree(tokenize(source))
    .children.filter((child) => child.type === "text")
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("\n");
}

/** An HTML body as blocks. Never emits a Block kind outside `BLOCK_KINDS`. */
export function parseHtmlBlocks(source: string): Block[] {
  if (source.trim() === "") return [];
  const context: Context = { leading: true };
  const blocks = blocksFromNodes(buildTree(tokenize(source)).children, context);
  // A body that is nothing but its title is not a duplicate of anything, and a
  // blank article would be a silent failure with nothing to see.
  if (blocks.length === 0 && context.droppedTitle !== undefined) return [context.droppedTitle];
  return blocks;
}

/**
 * Inline HTML inside an otherwise-markdown body. Called from `parseInline` so
 * a stray `<a href>` in a markdown paragraph becomes a link rather than
 * escaped source.
 */
export function parseInlineHtml(source: string): InlineNode[] {
  return trimInline(inlineFromNodes(buildTree(tokenize(source)).children));
}

export function containsHtmlMarkup(text: string): boolean {
  if (!text.includes("<")) return false;

  // Counted from the tokenizer's own tag boundaries, not from a regex over the
  // raw text. A regex counts `<a>` inside `title="<a>"` as an unclosed anchor,
  // which made the balance test fail and shipped the whole paragraph to the
  // reader as escaped source.
  const open = new Map<string, number>();
  let seen = text.includes("<!--");
  for (const token of tokenize(text)) {
    if (token.type === "text") continue;
    seen = true;
    if (!isKnownTag(token.tag)) return false;
    if (token.type === "open") {
      if (token.selfClosing || VOID_TAGS.has(token.tag)) continue;
      open.set(token.tag, (open.get(token.tag) ?? 0) + 1);
    } else {
      open.set(token.tag, (open.get(token.tag) ?? 0) - 1);
    }
  }
  // Every element must close. `The <section> tag groups content` is prose about
  // a tag, and unwrapping it would delete the word; `<b>x</b>` is markup.
  for (const count of open.values()) if (count !== 0) return false;
  return seen;
}



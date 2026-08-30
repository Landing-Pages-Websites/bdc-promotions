/**
 * Markdown to a block AST.
 *
 * Kept separate from the renderer for two reasons: a pure module is testable
 * under `node --test --experimental-strip-types` where a TSX component is not,
 * and the block kinds below are the contract the MEGA go-live blog migrator
 * targets. The migrator must never emit a construct that is not in `BlockKind`,
 * or it renders as literal markdown on a live customer site.
 *
 * The pipeline publishes two body shapes at once, markdown and raw HTML, so
 * `parseBlocks` routes a whole body to `html-blocks.ts` when it is HTML and
 * `parseInline` hands any inline tags inside a markdown body to the same
 * module. Neither shape may reach the page as literal markup.
 */

import {
  collapseMark,
  containsHtmlMarkup,
  imageSrc,
  linkHref,
  htmlBlockOpensALine,
  parseHtmlBlocks,
  parseInlineHtml,
  tableBlock,
  textOutsideElements,
} from "./html-blocks";
import { stripInertMarkup } from "./html-tokens";
import { headingLevel } from "./html-tags";

export type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "em"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; text: string; href: string }
  | { kind: "image"; src: string; alt: string };

export interface ListNode {
  ordered: boolean;
  items: ListItem[];
}

export interface ListItem {
  inline: InlineNode[];
  /**
   * Nested lists, one group per run of the same marker type.
   * `- Parent` with a `- a` then a `1. b` child is two groups, because the
   * marker is a property of the item that carries it, not of the list.
   */
  children: ListNode[];
}

export type Block =
  | { kind: "heading"; level: 2 | 3; inline: InlineNode[] }
  | { kind: "paragraph"; inline: InlineNode[] }
  | { kind: "list"; ordered: boolean; items: ListItem[] }
  | { kind: "blockquote"; lines: InlineNode[][] }
  | { kind: "table"; header: InlineNode[][]; rows: InlineNode[][][] }
  | { kind: "code"; text: string }
  | { kind: "image"; src: string; alt: string };

export type BlockKind = Block["kind"];

/** Every kind the parser can emit. The migrator's output must stay inside it. */
export const BLOCK_KINDS: readonly BlockKind[] = [
  "heading",
  "paragraph",
  "list",
  "blockquote",
  "table",
  "code",
  "image",
] as const;

const FENCE = /^```/;
// Six levels, not three. `#### Foo` matching nothing made it a paragraph whose
// text began with a literal `####`.
const HEADING = /^(#{1,6})\s+(.*)$/;
// One pattern for every list item. Marker type is read per item rather than
// tested across the whole block: requiring homogeneity made `- Parent` with a
// `1. Child` match no branch at all and render as a paragraph of literal
// markers.
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const QUOTE_LINE = /^>\s?(.*)$/;
const TABLE_SEPARATOR = /^\|(\s*:?-{3,}:?\s*\|)+$/;
const STANDALONE_IMAGE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

const INLINE_TOKEN =
  /(!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/** The readable text of a run of inline nodes, with every mark resolved. */
export function plainText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === "link") return node.text;
      if (node.kind === "image") return node.alt;
      return node.value;
    })
    .join("");
}

/**
 * A URL check, deferred when the value still holds a placeholder.
 *
 * Checking `java\uFFFCscript:alert(1)` says nothing about the
 * `javascript:alert(1)` that expanding it produces: the placeholder hides the
 * scheme, so the check sees a relative path and even normalises it into one.
 * A value that is going to be rebuilt is passed through untouched and checked
 * once, at the end, on the string the page will actually carry.
 */
function checkUrl(check: (raw: string) => string | null, raw: string): string | null {
  return ANY_SLOT.test(raw) ? raw : check(raw);
}

/**
 * An alt or a link's text: a slot that can only hold a string, so every mark
 * inside it resolves to plain text.
 *
 * Markdown marks only. By the time this runs inside `parseInline`, any HTML has
 * already been replaced by placeholders, and re-entering `parseInline` here
 * would strip those placeholders as if the body had smuggled them in — which is
 * how `[a ``code`` b](/x)` lost its code span. The caller's `flatten` resolves
 * the placeholders afterwards.
 */
function altText(raw: string): string {
  return plainText(parseMarkdownInline(raw));
}

/**
 * Markdown inline marks only. HTML is handled by `parseInline`, which runs
 * first so an `<a href>` keeps its href instead of being cut apart by a
 * markdown token that happens to fall inside the tag.
 */
function parseMarkdownInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  // `matchAll` gives its own cursor, which matters because the branches below
  // recurse: a shared `lastIndex` would be reset out from under this loop.
  for (const match of text.matchAll(INLINE_TOKEN)) {
    if (match.index > last) {
      nodes.push({ kind: "text", value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith("![")) {
      const image = token.match(STANDALONE_IMAGE);
      const src = image === null ? null : checkUrl(imageSrc, image[2]);
      if (image !== null && src !== null) {
        nodes.push({ kind: "image", alt: altText(image[1]), src });
      } else if (image !== null && image[1] !== "") {
        // Refusing the src costs the image, never its words.
        nodes.push(...parseMarkdownInline(image[1]));
      }
    } else if (token.startsWith("**")) {
      nodes.push(...collapseMark("strong", parseMarkdownInline(token.slice(2, -2))));
    } else if (token.startsWith("*")) {
      nodes.push(...collapseMark("em", parseMarkdownInline(token.slice(1, -1))));
    } else if (token.startsWith("`")) {
      // Code is verbatim: a mark inside it is content, not markup.
      nodes.push({ kind: "code", value: token.slice(1, -1) });
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link === null ? null : checkUrl(linkHref, link[2]);
      if (link !== null && href !== null) {
        nodes.push({ kind: "link", text: altText(link[1]), href });
      } else if (link !== null) {
        // Same rule as the HTML path: the scheme goes, the words stay — and
        // they stay PARSED, so `[**Click**](javascript:x)` keeps its bold
        // rather than printing its own asterisks.
        nodes.push(...parseMarkdownInline(link[1]));
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    nodes.push({ kind: "text", value: text.slice(last) });
  }
  return nodes;
}

/**
 * Stand-ins for a node lifted out before the markdown tokenizer runs. Two of
 * them, with a list each: code spans are lifted before the HTML pass and HTML
 * nodes during it, so one shared list would hand back a code span where a tag
 * belongs whenever a tag came first. Neither character appears in real prose,
 * and the tokenizer treats both as ordinary text.
 */
const CODE_SLOT = "\uFFF9";
const HTML_SLOT = "\uFFFC";
const ANY_SLOT = /([\uFFF9\uFFFC])/;
const ANY_SLOT_GLOBAL = /[\uFFF9\uFFFC]/g;
const CODE_SPAN = /`[^`]+`/g;

/**
 * Inert markup removed, except inside a code span.
 *
 * Rule 1 applies to a markdown body too, but `` `<script>` `` written in prose
 * is content about a tag and not a tag. Lifting the spans out before the strip
 * and putting them back after is what keeps both true at once.
 */
function stripInertOutsideCode(text: string): string {
  if (!text.includes("<")) return text;
  const spans: string[] = [];
  const masked = text.replace(CODE_SPAN, (span) => {
    spans.push(span);
    return CODE_SLOT;
  });
  let taken = 0;
  return stripInertMarkup(masked)
    .split(CODE_SLOT)
    .map((part, index) => (index === 0 ? part : (spans[taken++] ?? "") + part))
    .join("");
}

/** Markdown marks resolved inside a node the HTML pass produced. */
function resolveMarks(node: InlineNode): InlineNode {
  switch (node.kind) {
    // Code is verbatim; a mark inside it is content.
    case "code":
      return node;
    case "link":
      return { ...node, text: plainText(parseMarkdownInline(node.text)) };
    case "image":
      return { ...node, alt: plainText(parseMarkdownInline(node.alt)) };
    case "text":
      return node;
    default:
      return { ...node, value: plainText(parseMarkdownInline(node.value)) };
  }
}

/**
 * Inline markdown, plus any inline HTML the fragment carries.
 *
 * HTML runs first, so a markdown token can never cut a tag apart or be misread
 * out of an attribute value. Each node it produces is then replaced by a single
 * placeholder character before the markdown tokenizer runs, so a mark that
 * BRACKETS a tag (`**<a href="x">Buy</a>**`) is still seen and still resolved,
 * rather than leaving its `**` on the page. Text carrying no tag at all is
 * never touched by the HTML pass, so a post that discusses `&amp;` still says
 * so.
 */
export function parseInline(source: string): InlineNode[] {
  // A body cannot smuggle in a placeholder of its own. Tested with `includes`,
  // not with the global regex: `RegExp.test` on a `/g` pattern advances
  // `lastIndex` and answers differently on the next call.
  const text =
    source.includes(CODE_SLOT) || source.includes(HTML_SLOT)
      ? source.replace(ANY_SLOT_GLOBAL, "")
      : source;

  // Code spans are verbatim, so they are lifted out BEFORE the HTML pass: a tag
  // named in prose lives inside one (`` `<p>` ``), and letting the HTML pass eat
  // it would delete the content and leave two bare backticks on the page.
  const codes: InlineNode[] = [];
  const withoutCode = text.replace(CODE_SPAN, (span) => {
    codes.push({ kind: "code", value: span.slice(1, -1) });
    return CODE_SLOT;
  });

  // Rule 1 is not conditional on which parser runs. A comment or a `<script>`
  // in a markdown paragraph is inert either way, and escaping it onto the page
  // as visible source is the one thing neither path may do. Stripped after the
  // code spans are lifted, so `` `<script>` `` in prose is still prose.
  const inert = stripInertMarkup(withoutCode);
  if (codes.length === 0 && !containsHtmlMarkup(inert)) return parseMarkdownInline(inert);

  const carried: InlineNode[] = [];
  const masked = containsHtmlMarkup(inert)
    ? parseInlineHtml(inert)
        .map((node) => {
          // A text node here can only carry a sentinel that this function put
          // there: the entry check strips a literal one, and `decodeEntities`
          // refuses to decode `&#xFFFC;` into one for exactly this reason.
          if (node.kind === "text") return node.value;
          carried.push(resolveMarks(node));
          return HTML_SLOT;
        })
        .join("")
    : inert;

  // Each list is in source order and each slot kind is met in its own order, so
  // one cursor per list is enough.
  let code = 0;
  let html = 0;
  const expand = (value: string): InlineNode[] => {
    const out: InlineNode[] = [];
    for (const part of value.split(ANY_SLOT)) {
      const node =
        part === CODE_SLOT ? codes[code++] : part === HTML_SLOT ? carried[html++] : undefined;
      if (node !== undefined) out.push(node);
      else if (part !== "" && part !== CODE_SLOT && part !== HTML_SLOT) {
        out.push({ kind: "text", value: part });
      }
    }
    return out;
  };
  /** For a slot that can only hold a string: an href's text, an alt, code. */
  const flatten = (value: string): string => plainText(expand(value));

  return parseMarkdownInline(masked).flatMap((node) => {
    switch (node.kind) {
      case "text":
        return expand(node.value);
      case "strong":
      case "em":
        // A mark bracketing a tag cannot be expressed. Expanding drops the mark
        // and keeps what it wrapped, the same trade `collapseMark` makes.
        return ANY_SLOT.test(node.value) ? expand(node.value) : [node];
      case "code":
        return [{ ...node, value: flatten(node.value) }];
      // Every slot that can hold a placeholder must be expanded, href and src
      // included: one left behind puts U+FFFC in a URL and slides the cursor,
      // so every later node takes the wrong one.
      //
      // And the URL is re-checked AFTER it is put back together, because that
      // is the string the page will carry. `[Click](java<b>script</b>:alert(1))`
      // reaches the tokenizer as `java\uFFFCscript:…`, which carries no scheme
      // at all and passes as a relative path; expanding it reassembles
      // `javascript:alert(1)`. Validating the input to a transformation says
      // nothing about its output.
      case "link": {
        const href = linkHref(flatten(node.href));
        if (href === null) return expand(node.text);
        return [{ ...node, text: flatten(node.text), href }];
      }
      default: {
        const src = imageSrc(flatten(node.src));
        if (src === null) return expand(node.alt);
        return [{ ...node, alt: flatten(node.alt), src }];
      }
    }
  });
}

/**
 * Group lines into blocks.
 *
 * Fence-aware on purpose: splitting on blank lines first would cut a code
 * block containing a blank line in half, and the migrator emits code verbatim.
 */
function splitBlocks(source: string): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  let fenced = false;

  const flush = (): void => {
    if (current.length > 0) blocks.push(current);
    current = [];
  };

  for (const line of source.split("\n")) {
    if (FENCE.test(line.trim())) {
      if (fenced) {
        current.push(line);
        fenced = false;
        flush();
      } else {
        flush();
        fenced = true;
        current.push(line);
      }
      continue;
    }
    if (!fenced && line.trim() === "") {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();
  return blocks;
}

interface RawItem {
  indented: boolean;
  ordered: boolean;
  text: string;
}

function readItem(line: string): RawItem | null {
  const match = line.match(LIST_ITEM);
  if (!match) return null;
  return {
    indented: match[1].length > 0,
    ordered: /\d/.test(match[2]),
    text: match[3],
  };
}

/**
 * One block of list lines becomes one list per run of root-level marker type.
 * `- One` followed by `1. Two` is two lists in Markdown, not one, and
 * certainly not a paragraph.
 */
function parseListBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let current: ListNode | null = null;

  for (const line of lines) {
    const raw = readItem(line);
    if (!raw) continue;
    const item: ListItem = { inline: parseInline(raw.text), children: [] };

    // One level of nesting. A nested item with no parent is promoted to root
    // rather than dropped, so no content can vanish.
    if (raw.indented && current !== null && current.items.length > 0) {
      const parent = current.items[current.items.length - 1];
      const lastGroup = parent.children[parent.children.length - 1];
      if (lastGroup !== undefined && lastGroup.ordered === raw.ordered) {
        lastGroup.items.push(item);
      } else {
        parent.children.push({ ordered: raw.ordered, items: [item] });
      }
      continue;
    }

    if (current === null || current.ordered !== raw.ordered) {
      if (current !== null) {
        blocks.push({ kind: "list", ordered: current.ordered, items: current.items });
      }
      current = { ordered: raw.ordered, items: [] };
    }
    current.items.push(item);
  }

  if (current !== null) {
    blocks.push({ kind: "list", ordered: current.ordered, items: current.items });
  }
  return blocks;
}

function parseTable(lines: string[]): Block | null {
  if (lines.length < 2 || !TABLE_SEPARATOR.test(lines[1].trim())) return null;
  const cells = (line: string): InlineNode[][] =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split(/(?<!\\)\|/)
      .map((cell) => parseInline(cell.replace(/\\\|/g, "|").trim()));

  // Padded by the shared rule, so a ragged table does not lose a cell on one
  // body shape and keep it on the other.
  return tableBlock(cells(lines[0]), lines.slice(2).map(cells));
}

function parseBlock(lines: string[], leading: boolean): Block[] {
  const first = lines[0] ?? "";

  if (FENCE.test(first.trim())) {
    const body = lines.slice(1);
    if (body.length > 0 && FENCE.test(body[body.length - 1].trim())) body.pop();
    return [{ kind: "code", text: body.join("\n") }];
  }

  const heading = lines.length === 1 ? first.match(HEADING) : null;
  if (heading) {
    // The pipeline repeats the post title as a leading H1 and the page template
    // already renders the title, so the duplicate is dropped rather than
    // demoted to a visible H2 saying the headline twice. An H1 further down is
    // a real section heading and is kept.
    if (heading[1].length === 1 && leading) return [];
    return [
      {
        kind: "heading",
        level: headingLevel(heading[1].length),
        inline: parseInline(heading[2]),
      },
    ];
  }

  if (lines.every((line) => QUOTE_LINE.test(line))) {
    return [
      {
        kind: "blockquote",
        lines: lines.map((line) => parseInline(line.match(QUOTE_LINE)![1])),
      },
    ];
  }

  if (lines.every((line) => LIST_ITEM.test(line))) {
    const lists = parseListBlocks(lines);
    if (lists.length > 0) return lists;
  }

  if (lines.every((line) => line.trim().startsWith("|"))) {
    const table = parseTable(lines);
    if (table) return [table];
  }

  if (lines.length === 1) {
    const image = first.trim().match(STANDALONE_IMAGE);
    // The alt is an attribute, so any mark inside it has to be resolved to text
    // rather than shipped as syntax a screen reader would read aloud.
    const src = image === null ? null : imageSrc(image[2]);
    if (image !== null && src !== null) return [{ kind: "image", alt: altText(image[1]), src }];
    // A standalone image with a refused src still carries its alt text.
    if (image !== null && image[1] !== "") {
      return [{ kind: "paragraph", inline: parseInline(image[1]) }];
    }
  }

  const text = lines.join(" ").trim();
  if (!text) return [];
  const inline = parseInline(text);
  // A group that was nothing but inert markup leaves no paragraph behind.
  if (inline.length === 0) return [];
  return [{ kind: "paragraph", inline }];
}

/** Whether a line opens a markdown block: the other half of the routing rule,
 * derived from the same patterns the parser matches with rather than restated. */
function opensMarkdownBlock(line: string): boolean {
  const trimmed = line.trim();
  return (
    HEADING.test(trimmed) ||
    LIST_ITEM.test(trimmed) ||
    // `>` followed by a space, not the bare `>` that closes a start tag whose
    // attributes were wrapped across lines. Vetoing on that would send a whole
    // HTML body to the markdown path, where, having no blank lines to split on,
    // it collapses into a single paragraph.
    /^>(\s|$)/.test(trimmed) ||
    FENCE.test(trimmed) ||
    trimmed.startsWith("|")
  );
}

/**
 * Whether a body should be parsed as HTML rather than as markdown.
 *
 * Decided once per body, not per line: line-by-line switching would cut a table
 * in half. The body is HTML when a block-level tag opens some line of it and no
 * markdown block opens a line of the text that sits OUTSIDE every element.
 *
 * That second half is where the two grammars compose rather than exclude each
 * other. A `*` or a `>` starting a line inside a `<p>` is that paragraph's own
 * content, and vetoing on it would send a whole HTML body to the markdown
 * path, where, having no blank lines to split on, it collapses into a single
 * paragraph. A `## Heading` between two top-level tags is a real markdown body
 * with a stray wrapper in it, and that one belongs on the markdown path.
 *
 * Inline marks need no veto at all: `parseBlocks` resolves them inside the HTML
 * path's text, so `**fast**` in a `<p>` renders bold either way.
 *
 * Checked against 24 published posts across three customer repos, 20 HTML and
 * 4 markdown, every one classified correctly. Four of the 20 open with prose
 * rather than a tag, which is why the rule reads every line and not just the
 * first.
 */
export function looksLikeHtmlBody(source: string): boolean {
  if (!source.includes("<")) return false;
  if (!htmlBlockOpensALine(source)) return false;
  return !textOutsideElements(source).split("\n").some(opensMarkdownBlock);
}

/** Every `InlineNode[]` in a block, rebuilt through `resolve`. */
function mapInline(block: Block, resolve: (nodes: InlineNode[]) => InlineNode[]): Block {
  const items = (list: ListItem[]): ListItem[] =>
    list.map((item) => ({
      inline: resolve(item.inline),
      children: item.children.map((group) => ({
        ordered: group.ordered,
        items: items(group.items),
      })),
    }));
  switch (block.kind) {
    case "paragraph":
    case "heading":
      return { ...block, inline: resolve(block.inline) };
    case "list":
      return { ...block, items: items(block.items) };
    case "blockquote":
      return { ...block, lines: block.lines.map(resolve) };
    case "table":
      return {
        ...block,
        header: block.header.map(resolve),
        rows: block.rows.map((row) => row.map(resolve)),
      };
    // `code` is verbatim and `image` carries no inline run.
    default:
      return block;
  }
}

/**
 * Markdown marks inside the text of an HTML body.
 *
 * The pipeline emits its bolded CTA as `**[text](href)**` and some bodies carry
 * both shapes, so without this a mixed body ships `**fast**` and
 * `[pricing](/pricing)` to the reader as source. It runs on text only: a
 * `code` block stays verbatim, and an href or an alt is already a plain string.
 */
function resolveMarkdownInText(nodes: InlineNode[]): InlineNode[] {
  return nodes.flatMap((node) =>
    node.kind === "text" ? parseMarkdownInline(node.value) : [resolveMarks(node)],
  );
}

export function parseBlocks(source: string): Block[] {
  const body = source ?? "";
  if (looksLikeHtmlBody(body)) {
    return parseHtmlBlocks(body).map((block) => mapInline(block, resolveMarkdownInText));
  }
  // "Leading" is the first block of the body, not "nothing emitted yet":
  // exactly one duplicate title can be dropped, so `# A` then `# B` keeps B.
  // A body that is nothing but its title is not a duplicate of anything, and
  // dropping it would render a blank article with nothing to see.
  // Inert markup is removed before the body is split, so a `<script>` sharing a
  // line with a heading cannot stop that heading from being one. A fenced group
  // is left alone: inside a fence the tag is displayed content, not markup.
  const groups = splitBlocks(body)
    .map((lines) =>
      FENCE.test((lines[0] ?? "").trim())
        ? lines
        : stripInertOutsideCode(lines.join("\n"))
            .split("\n")
            .filter((line) => line.trim() !== ""),
    )
    .filter((lines) => lines.length > 0);
  const leadingIndex = groups.length > 1 ? 0 : -1;
  return groups.flatMap((lines, index) => parseBlock(lines, index === leadingIndex));
}

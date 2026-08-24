/**
 * Markdown to a block AST.
 *
 * Kept separate from the renderer for two reasons: a pure module is testable
 * under `node --test --experimental-strip-types` where a TSX component is not,
 * and the block kinds below are the contract the MEGA go-live blog migrator
 * targets. The migrator must never emit a construct that is not in `BlockKind`,
 * or it renders as literal markdown on a live customer site.
 */

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
const HEADING = /^(#{1,3})\s+(.*)$/;
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

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  INLINE_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null = INLINE_TOKEN.exec(text);
  while (match) {
    if (match.index > last) {
      nodes.push({ kind: "text", value: text.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith("![")) {
      const image = token.match(STANDALONE_IMAGE);
      if (image) nodes.push({ kind: "image", alt: image[1], src: image[2] });
    } else if (token.startsWith("**")) {
      nodes.push({ kind: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("*")) {
      nodes.push({ kind: "em", value: token.slice(1, -1) });
    } else if (token.startsWith("`")) {
      nodes.push({ kind: "code", value: token.slice(1, -1) });
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) nodes.push({ kind: "link", text: link[1], href: link[2] });
    }
    last = match.index + token.length;
    match = INLINE_TOKEN.exec(text);
  }
  if (last < text.length) {
    nodes.push({ kind: "text", value: text.slice(last) });
  }
  return nodes;
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

  const header = cells(lines[0]);
  const rows = lines.slice(2).map((line) => {
    const row = cells(line);
    while (row.length < header.length) row.push([]);
    return row.slice(0, header.length);
  });
  return { kind: "table", header, rows };
}

function parseBlock(lines: string[]): Block[] {
  const first = lines[0] ?? "";

  if (FENCE.test(first.trim())) {
    const body = lines.slice(1);
    if (body.length > 0 && FENCE.test(body[body.length - 1].trim())) body.pop();
    return [{ kind: "code", text: body.join("\n") }];
  }

  const heading = lines.length === 1 ? first.match(HEADING) : null;
  if (heading) {
    return [
      {
        kind: "heading",
        level: heading[1].length >= 3 ? 3 : 2,
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
    if (image) return [{ kind: "image", alt: image[1], src: image[2] }];
  }

  const text = lines.join(" ").trim();
  if (!text) return [];
  return [{ kind: "paragraph", inline: parseInline(text) }];
}

export function parseBlocks(source: string): Block[] {
  return splitBlocks(source ?? "").flatMap(parseBlock);
}

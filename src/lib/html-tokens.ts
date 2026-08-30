/**
 * HTML source to a tree of elements and text. The byte-level layer, and nothing
 * above it: it knows tag syntax, entities and which tags nest, and it knows
 * nothing about Blocks.
 *
 * Bounded on purpose. The input is our own content pipeline's output over the
 * ~30 tags in `html-tags.ts`, not arbitrary web HTML, and `src/` here
 * propagates to roughly 276 customer sites, so a runtime dependency for a
 * build-time concern is 276 lockfile changes and a supply-chain surface.
 *
 * Two properties everything above it relies on:
 *
 *  - **No dropped element reaches the tree.** `<script>`, `<style>`,
 *    `<template>` and `<noscript>` are skipped whole, content included, and
 *    `buildTree` refuses to attach one even if the scanner ever emitted it.
 *    Raw-text content (JSON-LD, CSS, minified JS) is therefore never tokenized
 *    as markup at all.
 *  - **Malformed input is bounded, never unbounded.** An unterminated quote, an
 *    unclosed tag and a stray close tag each cost their own construct and
 *    nothing after it. The one deliberate exception is an unterminated dropped
 *    element, which drops the rest of the document: leaking raw JavaScript at
 *    the reader is worse than losing the tail.
 *
 * Its adversarial corpus is `html-tokens.test.ts`, which is where anything
 * about what a byte sequence MEANS belongs.
 */

import {
  CLOSED_BY,
  DROPPED_TAGS,
  RAW_TEXT_TAGS,
  VOID_TAGS,
  lookup,
  roleFor,
} from "./html-tags";

/* -------------------------------------------------------------------------- */
/* Entities                                                                    */
/* -------------------------------------------------------------------------- */

const NAMED_ENTITIES: Readonly<Record<string, string>> = lookup<string>({
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  deg: "°",
  copy: "©",
  reg: "®",
  trade: "™",
  times: "×",
  frac12: "½",
  laquo: "«",
  raquo: "»",
});

// Bounded on both sides, so it cannot backtrack across a long body.
const ENTITY = /&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z][a-zA-Z0-9]{1,31});/g;

/**
 * One pass, so `&amp;lt;` decodes to the text `&lt;` rather than to `<`.
 * An entity this table does not know is left verbatim: that is what a browser
 * would show, and inventing a character would be worse than leaving one.
 */
export function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(ENTITY, (match, body: string) => {
    if (body.startsWith("#")) {
      const code =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      // Refused, left as the literal entity text: lone surrogates are not
      // characters, and U+FFF9..U+FFFD are annotation and replacement marks
      // that no prose encodes on purpose. Decoding them would let a body forge
      // the sentinel characters `markdown.ts` uses to hold a node's place while
      // it re-tokenizes, which would silently reorder that paragraph.
      if (code >= 0xd800 && code <= 0xdfff) return match;
      if (code >= 0xfff9 && code <= 0xfffd) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

/* -------------------------------------------------------------------------- */
/* Tokenizer                                                                   */
/* -------------------------------------------------------------------------- */

export type Token =
  | { type: "text"; value: string }
  /** `start` is the offset of the `<`, so callers can ask WHERE a real tag is
   * instead of scanning for one themselves. */
  | { type: "open"; tag: string; attrs: Record<string, string>; selfClosing: boolean; start: number }
  | { type: "close"; tag: string; start: number };

const NAME_START = /[a-zA-Z]/;
const NAME_CHAR = /[a-zA-Z0-9:_.-]/;
export const SPACE = /\s/;
const SPACE_OR_GT = /[\s>]/;

export function readName(html: string, at: number): { name: string; end: number } | null {
  if (!NAME_START.test(html[at] ?? "")) return null;
  let end = at + 1;
  while (end < html.length && NAME_CHAR.test(html[end])) end += 1;
  return { name: html.slice(at, end).toLowerCase(), end };
}

/**
 * Read a start tag's attributes. Quoted values are read to their closing
 * quote, so an attribute containing `>` (`<p title="a > b">`) does not end the
 * tag early and spill the rest of it into the page as text.
 */
/**
 * Where an unterminated attribute value has to stop: the next `<`.
 *
 * Not the next `>`. A quoted value legitimately contains one
 * (`<p title="a > b">`), and stopping there is what would spill the rest of the
 * tag onto the page. A `<` inside a value is a typo either way, so it is the
 * boundary that costs nothing when the quote WAS terminated and saves the
 * document when it was not.
 */
function boundedValueEnd(html: string, from: number): number {
  const next = html.indexOf("<", from);
  return next === -1 ? html.length : next;
}

function readAttributes(
  html: string,
  from: number,
): { attrs: Record<string, string>; selfClosing: boolean; end: number } {
  const attrs: Record<string, string> = {};
  let index = from;
  let selfClosing = false;
  while (index < html.length) {
    while (index < html.length && SPACE.test(html[index])) index += 1;
    if (index >= html.length) break;
    if (html[index] === ">") {
      index += 1;
      break;
    }
    // A `<` inside a start tag means the tag was never closed. Ending it here
    // keeps the next tag readable instead of eating it as an attribute name.
    if (html[index] === "<") break;
    if (html[index] === "/") {
      selfClosing = true;
      index += 1;
      continue;
    }
    const name = readName(html, index);
    if (name === null) {
      index += 1;
      continue;
    }
    index = name.end;
    while (index < html.length && SPACE.test(html[index])) index += 1;
    if (html[index] !== "=") {
      attrs[name.name] = "";
      continue;
    }
    index += 1;
    while (index < html.length && SPACE.test(html[index])) index += 1;
    const quote = html[index];
    if (quote === '"' || quote === "'") {
      // A quoted value runs to its closing quote, `<` and `>` included: that is
      // what a browser does, and `title="</template>"` really is a string.
      // Only when there is NO closing quote at all is the value bounded, so an
      // unterminated one costs its own tag rather than the rest of the article.
      const close = html.indexOf(quote, index + 1);
      const end = close === -1 ? boundedValueEnd(html, index + 1) : close;
      attrs[name.name] = decodeEntities(html.slice(index + 1, end));
      index = close === -1 ? end : end + 1;
      continue;
    }
    let end = index;
    while (end < html.length && !SPACE_OR_GT.test(html[end])) end += 1;
    attrs[name.name] = decodeEntities(html.slice(index, end));
    index = end;
  }
  return { attrs, selfClosing, end: index };
}

/**
 * The one place that answers "what markup construct starts at this `<`, and
 * where does it end". Every walker in this module goes through it.
 *
 * Answering that question a second way is how tag-shaped text inside a quoted
 * attribute keeps being mistaken for a tag. A walker that steps forward one
 * character at a time past a start tag will meet `<script>` inside
 * `title="<script>"` and believe it; one that steps past the whole construct
 * cannot.
 */
type Construct =
  | { kind: "comment"; end: number }
  | { kind: "declaration"; end: number }
  | { kind: "close"; name: string; end: number }
  | {
      kind: "open";
      name: string;
      attrs: Record<string, string>;
      selfClosing: boolean;
      end: number;
    };

function readConstruct(html: string, at: number): Construct | null {
  if (html.startsWith("<!--", at)) {
    const close = html.indexOf("-->", at + 4);
    return { kind: "comment", end: close === -1 ? html.length : close + 3 };
  }
  if (html[at + 1] === "!" || html[at + 1] === "?") {
    const gt = html.indexOf(">", at);
    return { kind: "declaration", end: gt === -1 ? html.length : gt + 1 };
  }
  const closing = html[at + 1] === "/";
  const name = readName(html, closing ? at + 2 : at + 1);
  // A `<` that opens no tag is literal text ("5 < 6").
  if (name === null) return null;
  if (closing) {
    const gt = html.indexOf(">", name.end);
    return { kind: "close", name: name.name, end: gt === -1 ? html.length : gt + 1 };
  }
  const { attrs, selfClosing, end } = readAttributes(html, name.end);
  return { kind: "open", name: name.name, attrs, selfClosing, end };
}

/**
 * Index just past the matching close tag, or the end of the document.
 *
 * Two different jobs, because the two kinds of dropped element hold two
 * different kinds of content:
 *
 * `script` and `style` hold RAW TEXT. `</script` inside a JS string really does
 * end the element, exactly as it does in a browser, so a scan for the name with
 * a boundary after it (`</scriptfoo>` does not count) is both correct and
 * enough.
 *
 * `template` and `noscript` hold real markup, so they nest and their tags carry
 * real attributes. Depth is counted, and every start tag is read with the same
 * quote-aware attribute reader the tokenizer uses, so a `</template>` sitting
 * inside `title="…"` is a string and not a close tag. A nested dropped element
 * is skipped whole on the way through, so a `</template>` inside a `<script>`
 * inside a `<template>` cannot end the outer one either.
 *
 * An unterminated one drops the rest of the document, which is the fail-closed
 * direction for rule 1: leaking raw JavaScript at the reader is worse than
 * losing the tail.
 */
function skipRawText(html: string, from: number, tag: string): number {
  const scanner = new RegExp(`</${tag}(?![a-zA-Z0-9:_.-])`, "gi");
  scanner.lastIndex = from;
  const match = scanner.exec(html);
  if (match === null) return html.length;
  const gt = html.indexOf(">", match.index);
  return gt === -1 ? html.length : gt + 1;
}

function skipDroppedContent(html: string, from: number, tag: string): number {
  if (RAW_TEXT_TAGS.has(tag)) return skipRawText(html, from, tag);

  let index = from;
  let depth = 1;
  while (index < html.length) {
    const lt = html.indexOf("<", index);
    if (lt === -1) break;
    const construct = readConstruct(html, lt);
    if (construct === null) {
      index = lt + 1;
      continue;
    }
    if (construct.kind === "close" && construct.name === tag) {
      depth -= 1;
      if (depth === 0) return construct.end;
    } else if (construct.kind === "open") {
      if (construct.name === tag) {
        if (!construct.selfClosing) depth += 1;
      } else if (DROPPED_TAGS.has(construct.name)) {
        // Skipped whole, so its raw text cannot be mistaken for this one's
        // close tag.
        index = skipDroppedContent(html, construct.end, construct.name);
        continue;
      }
    }
    index = construct.end;
  }
  return html.length;
}

/**
 * The source with every comment and every dropped element removed, and nothing
 * else touched.
 *
 * The markdown path needs this: rule 1 is not conditional on a body being
 * routed to the HTML parser, so `## Head` followed by an unterminated
 * `<script>alert(1)` must still drop the script rather than escape it onto the
 * page as visible source.
 */
export function stripInertMarkup(html: string): string {
  if (!html.includes("<")) return html;
  const kept: string[] = [];
  let index = 0;
  let textStart = 0;
  while (index < html.length) {
    const lt = html.indexOf("<", index);
    if (lt === -1) break;
    const construct = readConstruct(html, lt);
    if (construct === null) {
      index = lt + 1;
      continue;
    }
    // An ordinary tag is stepped over WHOLE. Stepping one character at a time
    // would meet the `<script>` inside `title="<script>"` and, finding no close
    // tag for it, delete the rest of the document.
    if (construct.kind === "declaration") {
      index = construct.end;
      continue;
    }
    if (construct.kind !== "comment" && !DROPPED_TAGS.has(construct.name)) {
      index = construct.end;
      continue;
    }
    kept.push(html.slice(textStart, lt));
    if (construct.kind === "open" && !construct.selfClosing && !VOID_TAGS.has(construct.name)) {
      index = skipDroppedContent(html, construct.end, construct.name);
    } else {
      index = construct.end;
    }
    textStart = index;
  }
  kept.push(html.slice(textStart));
  return kept.join("");
}

export function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  // Named `textStart` rather than `textFrom`, which is the module function that
  // turns a text run into inline nodes.
  let textStart = 0;
  let index = 0;

  const flushText = (until: number): void => {
    if (until > textStart) tokens.push({ type: "text", value: html.slice(textStart, until) });
  };

  while (index < html.length) {
    const lt = html.indexOf("<", index);
    if (lt === -1) break;
    const construct = readConstruct(html, lt);
    if (construct === null) {
      // A bare `<` that opens no tag is literal text ("5 < 6").
      index = lt + 1;
      continue;
    }
    flushText(lt);
    switch (construct.kind) {
      // Comments and declarations carry no renderable content.
      case "comment":
      case "declaration":
        index = construct.end;
        break;
      case "close":
        tokens.push({ type: "close", tag: construct.name, start: lt });
        index = construct.end;
        break;
      default:
        if (DROPPED_TAGS.has(construct.name)) {
          // The token is emitted, its content is not. Callers that ask WHERE a
          // tag is (routing) need to see that a body opens with a JSON-LD
          // script; `buildTree` still refuses to attach it, so no walker can
          // reach it. `selfClosing` is ignored: `<script/>alert(1)</script>` is
          // not a self-closing script to any HTML parser, and honouring the
          // slash would spill its content into the page as text.
          tokens.push({
            type: "open",
            tag: construct.name,
            attrs: construct.attrs,
            selfClosing: true,
            start: lt,
          });
          index = VOID_TAGS.has(construct.name)
            ? construct.end
            : skipDroppedContent(html, construct.end, construct.name);
          break;
        }
        tokens.push({
          type: "open",
          tag: construct.name,
          attrs: construct.attrs,
          selfClosing: construct.selfClosing,
          start: lt,
        });
        index = construct.end;
        break;
    }
    textStart = index;
  }

  flushText(html.length);
  return tokens;
}

/* -------------------------------------------------------------------------- */
/* Tree                                                                        */
/* -------------------------------------------------------------------------- */

export interface ElementNode {
  type: "element";
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
}

export interface TextNode {
  type: "text";
  value: string;
}

export type HtmlNode = ElementNode | TextNode;

export function buildTree(tokens: Token[]): ElementNode {
  const root: ElementNode = { type: "element", tag: "#root", attrs: {}, children: [] };
  const stack: ElementNode[] = [root];

  for (const token of tokens) {
    const parent = stack[stack.length - 1];
    if (token.type === "text") {
      parent.children.push({ type: "text", value: token.value });
      continue;
    }
    if (token.type === "close") {
      for (let depth = stack.length - 1; depth > 0; depth -= 1) {
        if (stack[depth].tag === token.tag) {
          stack.length = depth;
          break;
        }
      }
      // A close tag matching nothing open is discarded, not rendered.
      continue;
    }
    while (stack.length > 1 && CLOSED_BY[stack[stack.length - 1].tag]?.has(token.tag)) {
      stack.pop();
    }
    const node: ElementNode = {
      type: "element",
      tag: token.tag,
      attrs: token.attrs,
      children: [],
    };
    // Rule 1 is enforced here, once, for every walker downstream: a dropped
    // element is never attached to its parent, so no tree the block and inline
    // walkers see can contain one or its content. The tokenizer skips these
    // too, which is what keeps raw-text content (JSON-LD, CSS) from being
    // tokenized as markup at all; this is the guarantee, that is the fast path.
    const dropped = roleFor(token.tag).flow === "drop";
    if (!dropped) stack[stack.length - 1].children.push(node);
    // A dropped element opens no scope either: its content was never tokenized,
    // so pushing it would adopt the siblings that follow it.
    if (!dropped && !token.selfClosing && !VOID_TAGS.has(token.tag)) stack.push(node);
  }

  return root;
}

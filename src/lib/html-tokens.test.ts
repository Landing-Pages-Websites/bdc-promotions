import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildTree,
  decodeEntities,
  stripInertMarkup,
  tokenize,
  type HtmlNode,
} from "./html-tokens.ts";

/**
 * The scanner's adversarial corpus.
 *
 * Everything above this layer is about what a tag MEANS; this file is about
 * what a byte sequence IS, which is where every high-severity defect in this
 * module has landed. The dimensions it walks, in order: name boundaries, inert
 * markup, attribute delimiters and effective value, structural position, and
 * malformed input staying bounded. The positive rows at the bottom are taken
 * from what the committed fixtures actually contain, not from invented shapes.
 */

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__/blog-bodies");

/** Flattened text of a tree, which is everything a reader could end up seeing. */
function textOf(node: HtmlNode): string {
  return node.type === "text" ? node.value : node.children.map(textOf).join("");
}

function treeText(html: string): string {
  return textOf(buildTree(tokenize(html)));
}

/** Every tag name the scanner decided was a tag, in document order. */
function tags(html: string): string[] {
  return tokenize(html).flatMap((token) =>
    token.type === "open" ? [token.tag] : token.type === "close" ? [`/${token.tag}`] : [],
  );
}

function attrs(html: string): Record<string, string> {
  const token = tokenize(html).find((candidate) => candidate.type === "open");
  assert.ok(token !== undefined && token.type === "open", `no start tag in ${html}`);
  return token.type === "open" ? token.attrs : {};
}

/* -------------------------------------------------------------------------- */
/* Name boundaries: `-` and letters continue a name, so `\b` is not a boundary  */
/* -------------------------------------------------------------------------- */

test("a tag name ends where a name character ends, not where a prefix matches", () => {
  const table: [string, string[]][] = [
    ["<script-x>a</script-x>", ["script-x", "/script-x"]],
    // `</scripture>` must not close a `<script>`, and `<script>` swallows to
    // its own real close tag.
    // The token marks WHERE the script was; its content is never tokenized.
    ["<script>var s = 1;</scripture>still script</script>after", ["script"]],
    ["<p>a</p>", ["p", "/p"]],
    ["<pre>a</pre>", ["pre", "/pre"]],
    // `<p>` is not the start of `<param>`.
    ["<param><p>x</p>", ["param", "p", "/p"]],
    ["<b>x</b><br>", ["b", "/b", "br"]],
    ["<H2>Head</H2>", ["h2", "/h2"]],
    ["<TaBlE><TR><TD>a", ["table", "tr", "td"]],
    // Not a tag at all: no name character follows the `<`.
    ["5 < 6 and 7 > 3", []],
    ["a <1st> b", []],
    ["a <-b> c", []],
    ["</>", []],
  ];
  for (const [html, expected] of table) {
    assert.deepEqual(tags(html), expected, html);
  }
  assert.equal(treeText("<script>var s = 1;</scripture>still script</script>after"), "after");
});

/* -------------------------------------------------------------------------- */
/* Inert markup: content that must never reach the reader                      */
/* -------------------------------------------------------------------------- */

test("inert markup is dropped whole, content included", () => {
  const table: [string, string][] = [
    ["<p>a</p><script>alert(1)</script><p>b</p>", "ab"],
    ['<script type="application/ld+json">{"@type":"Article"}</script>keep', "keep"],
    // Raw text: markup inside a script is not markup.
    ["<script>if (a < b) { document.write('<p>x</p>'); }</script>keep", "keep"],
    ["<style>p::after{content:'<b>'}</style>keep", "keep"],
    ["<template><p>hidden</p></template>keep", "keep"],
    // `template` and `noscript` really nest, so the first close cannot end them.
    ["<template><template></template>LEAK</template>keep", "keep"],
    ["<noscript><noscript></noscript>LEAK</noscript>keep", "keep"],
    ["<!-- <p>commented out</p> -->keep", "keep"],
    ["<!-- unterminated comment keep", ""],
    ["<!DOCTYPE html>keep", "keep"],
    ["<?xml version=\"1.0\"?>keep", "keep"],
    // Fail closed: an unterminated dropped element takes the rest with it
    // rather than printing raw JavaScript at the reader.
    ["<p>a</p><script>never closed<p>b</p>", "a"],
    ["<SCRIPT>alert(1)</SCRIPT>keep", "keep"],
    ["<script >alert(1)</script >keep", "keep"],
    // A dropped-tag SPELLING inside an ordinary tag's attribute is a string.
    // Believing it, and then finding no close tag, used to delete the article.
    ['<p title="<script>">visible</p>keep', "visiblekeep"],
    ['<p title="<template>">visible</p>keep', "visiblekeep"],
    ['<p title="<!-- x -->">visible</p>keep', "visiblekeep"],
    ["<p title='<style>'>visible</p>keep", "visiblekeep"],
    ['<a href="/x?a=<script>">visible</a>keep', "visiblekeep"],
    // `<script/>` is not self-closing to any HTML parser.
    ["<script/>alert(1)</script>keep", "keep"],
    ["<template/>hidden</template>keep", "keep"],
  ];
  for (const [html, expected] of table) {
    assert.equal(treeText(html).trim(), expected, html);
  }
});

/* -------------------------------------------------------------------------- */
/* Attributes: delimiters, effective value, and `>` inside a value             */
/* -------------------------------------------------------------------------- */

test("attribute values are read to their real end", () => {
  assert.deepEqual(attrs('<p title="a > b">x</p>'), { title: "a > b" });
  assert.deepEqual(attrs("<p title='a > b'>x</p>"), { title: "a > b" });
  assert.deepEqual(attrs("<p class=lead>x</p>"), { class: "lead" });
  assert.deepEqual(attrs("<p hidden>x</p>"), { hidden: "" });
  assert.deepEqual(attrs('<p data-x="1" data-y="2">x</p>'), { "data-x": "1", "data-y": "2" });
  assert.deepEqual(attrs('<p CLASS="Lead">x</p>'), { class: "Lead" });
  assert.deepEqual(attrs('<p title = "spaced" >x</p>'), { title: "spaced" });
  // Duplicate keys: the last one wins, as a browser does.
  assert.deepEqual(attrs('<p title="first" title="second">x</p>'), { title: "second" });
  assert.deepEqual(attrs('<a href="/a?b=1&amp;c=2">x</a>'), { href: "/a?b=1&c=2" });
  assert.deepEqual(attrs('<img src="/i.png" alt="" >'), { src: "/i.png", alt: "" });
  assert.deepEqual(attrs('<a\n  href="/x"\n  rel="nofollow"\n>x</a>'), {
    href: "/x",
    rel: "nofollow",
  });
  assert.deepEqual(attrs('<img src="/i.png"/>'), { src: "/i.png" });
  // A `>` inside a value does not end the tag, so nothing after it leaks.
  assert.equal(treeText('<p title="a > b" data-x="c>d">visible</p>'), "visible");
});

test("an unterminated attribute value costs its own tag and nothing after it", () => {
  // The whole article used to disappear here. The anchor's own text is inside
  // what reads as an unterminated value and is lost with it; everything after
  // the tag survives, which is the bound this is here to hold.
  assert.equal(
    treeText('<p>intro</p><a href="/x>Click</a><p>The rest.</p><h2>More</h2>'),
    "introThe rest.More",
  );
  assert.deepEqual(tags('<a href="/x>Click</a>after'), ["a", "/a"]);
  // Consistently: text between the unterminated quote and the next `<` is part
  // of the value and goes with it. Everything from that `<` on survives.
  assert.equal(treeText("<p title='unterminated>body</p>after"), "after");
  assert.equal(treeText("<p title=unterminated"), "");
  assert.equal(treeText("<p"), "");
  assert.equal(treeText("<p >x</p>"), "x");
});

/* -------------------------------------------------------------------------- */
/* Structural position: what closes what                                       */
/* -------------------------------------------------------------------------- */

test("implied and stray end tags land where a browser puts them", () => {
  const table: [string, string[]][] = [
    // `<p>a<p>b` is two siblings, not a nest.
    ["<p>a<p>b", ["p", "p"]],
    ["<ul><li>a<li>b</ul>", ["ul", "li", "li", "/ul"]],
    ["<table><tr><td>a<td>b<tr><td>c</table>", ["table", "tr", "td", "td", "tr", "td", "/table"]],
  ];
  for (const [html, expected] of table) assert.deepEqual(tags(html), expected, html);

  const root = buildTree(tokenize("<p>a<p>b"));
  assert.equal(root.children.length, 2);

  // A close tag matching nothing open is discarded, not rendered.
  assert.equal(treeText("</div><p>x</p></span>"), "x");
  // A close tag matching an ancestor closes up to it rather than being ignored.
  assert.equal(treeText("<div><p>x</div>y"), "xy");
  // An unclosed tag ends at the end of the document, taking nothing with it.
  assert.equal(treeText("<p>Unclosed"), "Unclosed");
  assert.equal(treeText("<div><p>a<div><p>b"), "ab");
  // Void elements never open a scope.
  assert.equal(buildTree(tokenize("<br>a<br>b")).children.length, 4);
  assert.equal(buildTree(tokenize('<img src="/i.png">a')).children.length, 2);
});

/* -------------------------------------------------------------------------- */
/* Entities                                                                    */
/* -------------------------------------------------------------------------- */

test("entities decode in one pass, and an unknown one is left alone", () => {
  const table: [string, string][] = [
    ["a &amp; b", "a & b"],
    ["&lt;p&gt;", "<p>"],
    ["&amp;lt;", "&lt;"],
    ["&#39;q&#39;", "'q'"],
    ["&#x27;q&#x27;", "'q'"],
    ["&#X2014;", "—"],
    ["&nbsp;", " "],
    ["&unknownentity;", "&unknownentity;"],
    // A prototype key is not an entity name.
    ["&constructor;", "&constructor;"],
    ["&toString;", "&toString;"],
    ["&amp", "&amp"],
    ["&#;", "&#;"],
    ["&#0;", "&#0;"],
    ["&#x110000;", "&#x110000;"],
    // Refused so a body cannot forge the sentinels markdown.ts holds places
    // with, which would silently reorder the paragraph they appear in.
    ["&#xFFFC;", "&#xFFFC;"],
    ["&#xFFF9;", "&#xFFF9;"],
    ["&#65532;", "&#65532;"],
    ["&#xD800;", "&#xD800;"],
    // The neighbours still decode, so the refusal is a window and not a wall.
    ["&#xFFF8;", "\ufff8"],
    ["&#xFFFE;", "\ufffe"],
    ["Q&A and R&D", "Q&A and R&D"],
    ["100% &lt; 200%", "100% < 200%"],
  ];
  for (const [raw, expected] of table) assert.equal(decodeEntities(raw), expected, raw);
});

/* -------------------------------------------------------------------------- */
/* Bounded: nothing malformed may cost more than its own construct             */
/* -------------------------------------------------------------------------- */

test("stripInertMarkup steps over an ordinary tag whole", () => {
  // Same class as the tokenizer's: a walker that advances one character past a
  // start tag meets the tag-shaped text inside its attributes and believes it.
  const table: [string, string][] = [
    ['Intro <p title="<script>">visible</p>', 'Intro <p title="<script>">visible</p>'],
    ['Intro <p title="<!-- c -->">visible</p>', 'Intro <p title="<!-- c -->">visible</p>'],
    ["Intro <p>visible</p>", "Intro <p>visible</p>"],
    ["a <script>x</script> b", "a  b"],
    ["a <!-- c --> b", "a  b"],
    ["a <script>never closed", "a "],
    ["a <template><p>x</p></template> b", "a  b"],
    ["no markup here", "no markup here"],
    ["5 < 6", "5 < 6"],
  ];
  for (const [raw, expected] of table) {
    assert.equal(stripInertMarkup(raw), expected, raw);
  }
});

test("a large and a pathological body both complete", () => {
  const chunk = '<p class="lead" data-x="y">Text <a href="https://e.com/a?b=1&amp;c=2">l</a></p>';
  const big = chunk.repeat(Math.ceil(200_000 / chunk.length));
  assert.ok(big.length >= 200_000);
  const started = Date.now();
  assert.ok(tokenize(big).length > 1000);
  // A long run of `<` that opens nothing, and a long unterminated value.
  assert.deepEqual(tags("<".repeat(50_000)), []);
  assert.deepEqual(tags(`<p title="${"a".repeat(50_000)}`), ["p"]);
  assert.ok(Date.now() - started < 5_000, "scanning took too long");
});

/* -------------------------------------------------------------------------- */
/* Positives, taken from what the fixtures actually contain                    */
/* -------------------------------------------------------------------------- */

test("the shapes the pipeline really emits scan correctly", () => {
  const table: [string, string[]][] = [
    ['<p><strong><a href="https://e.com/c/">Schedule Service.</a></strong></p>', [
      "p",
      "strong",
      "a",
      "/a",
      "/strong",
      "/p",
    ]],
    ['<div class="answer-capsule"><p>Answer.</p></div>', ["div", "p", "/p", "/div"]],
    ['<table><thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>', [
      "table",
      "thead",
      "tr",
      "th",
      "/th",
      "/tr",
      "/thead",
      "tbody",
      "tr",
      "td",
      "/td",
      "/tr",
      "/tbody",
      "/table",
    ]],
    ["<ol><li>One.</li><li>Two.</li></ol>", ["ol", "li", "/li", "li", "/li", "/ol"]],
    ['<figure><img alt="A" loading="lazy" src="/i.webp"><figcaption>C</figcaption></figure>', [
      "figure",
      "img",
      "figcaption",
      "/figcaption",
      "/figure",
    ]],
    ['<p>Call <a href="tel:8563171770">(856) 317-1770</a> today.</p>', [
      "p",
      "a",
      "/a",
      "/p",
    ]],
    ['<a href="https://e.com" rel="nofollow" target="_blank">ADA</a>', ["a", "/a"]],
  ];
  for (const [html, expected] of table) assert.deepEqual(tags(html), expected, html);
});

test("every committed fixture scans with no markup left in its text", () => {
  const names = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith(".md"));
  assert.ok(names.length >= 5, "expected the published-post fixtures");
  for (const name of names) {
    const raw = readFileSync(join(FIXTURE_DIR, name), "utf8");
    const text = treeText(raw);
    assert.ok(!/<\/?(p|div|h[1-6]|ul|ol|li|table|tr|td|th|a|strong|img)\b/i.test(text), name);
    assert.ok(!text.includes("application/ld+json"), name);
  }
});

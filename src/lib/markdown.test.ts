import assert from "node:assert/strict";
import test from "node:test";

import {
  looksLikeHtmlBody,
  parseBlocks,
  parseInline,
  type Block,
  type InlineNode,
} from "./markdown.ts";

function kinds(source: string): string[] {
  return parseBlocks(source).map((block) => block.kind);
}

function first(source: string): Block {
  const blocks = parseBlocks(source);
  assert.ok(blocks.length > 0, "expected at least one block");
  return blocks[0];
}

test("headings", () => {
  const block = first("## Why it matters");
  assert.equal(block.kind, "heading");
  if (block.kind !== "heading") return;
  assert.equal(block.level, 2);
  assert.deepEqual(block.inline, [{ kind: "text", value: "Why it matters" }]);

  const three = first("### How");
  assert.equal(three.kind === "heading" && three.level, 3);
});

test("heading depth and the leading H1", () => {
  // The pipeline repeats the post title as a leading H1 and the page template
  // already renders it, so the duplicate is dropped rather than demoted to a
  // visible H2 that says the headline twice.
  const table: [string, (string | number)[]][] = [
    ["# Title\n\nBody", ["paragraph"]],
    ["Body\n\n# Later", ["paragraph", "heading:2"]],
    ["#### Deep", ["heading:3"]],
    ["###### Deepest", ["heading:3"]],
    ["####### Seven", ["paragraph"]],
    ["#NoSpace", ["paragraph"]],
    ["# One\n\n# Two", ["heading:2"]],
    // A body that is nothing but its title is not a duplicate of anything;
    // dropping it would render a blank article with no signal anywhere.
    ["# Only heading", ["heading:2"]],
    ["![Cover](/a.jpg)\n\n# After an image", ["image", "heading:2"]],
  ];
  for (const [source, expected] of table) {
    const actual = parseBlocks(source).map((block) =>
      block.kind === "heading" ? `heading:${block.level}` : block.kind,
    );
    assert.deepEqual(actual, expected, source);
  }
});

test("a mark wrapping another mark never prints its own syntax", () => {
  // The pipeline's standard CTA is `**[text](href)**`, and `strong` carries a
  // plain string, so the old parser printed the link syntax at the reader.
  const table: [string, InlineNode[]][] = [
    [
      "**[Contact us](https://x.com/c)**",
      [{ kind: "link", text: "Contact us", href: "https://x.com/c" }],
    ],
    ["*[Read more](/blog)*", [{ kind: "link", text: "Read more", href: "/blog" }]],
    ["[**Bold link**](/x)", [{ kind: "link", text: "Bold link", href: "/x" }]],
    ["[a `code` b](/x)", [{ kind: "link", text: "a code b", href: "/x" }]],
    ["**plain bold**", [{ kind: "strong", value: "plain bold" }]],
    ["`**not bold**`", [{ kind: "code", value: "**not bold**" }]],
    ["![**Alt**](/i.jpg)", [{ kind: "image", alt: "Alt", src: "/i.jpg" }]],
  ];
  for (const [source, expected] of table) {
    const block = first(source);
    if (block.kind === "paragraph") {
      assert.deepEqual(block.inline, expected, source);
      continue;
    }
    if (block.kind === "image") {
      assert.deepEqual([{ kind: "image", alt: block.alt, src: block.src }], expected, source);
      continue;
    }
    assert.fail(`unexpected block kind ${block.kind} for ${source}`);
  }
});

test("inline HTML inside a markdown body becomes nodes, never source", () => {
  const table: [string, InlineNode[]][] = [
    [
      'Call <a href="/x">now</a> please.',
      [
        { kind: "text", value: "Call " },
        { kind: "link", text: "now", href: "/x" },
        { kind: "text", value: " please." },
      ],
    ],
    // A mark BRACKETING a tag: the mark cannot hold a link, so the link wins.
    [
      '**<a href="/x">Buy</a>** now',
      [{ kind: "link", text: "Buy", href: "/x" }, { kind: "text", value: " now" }],
    ],
    // A mark INSIDE a tag: the link survives and the mark resolves to text.
    ['<a href="/x">**Buy**</a>', [{ kind: "link", text: "Buy", href: "/x" }]],
    ["<b>**bold**</b>", [{ kind: "strong", value: "bold" }]],
    ["a &amp; b <b>c</b>", [{ kind: "text", value: "a & b " }, { kind: "strong", value: "c" }]],
    // No tag in the fragment: the HTML pass never runs, so prose about an
    // entity still reads as the prose it is.
    ["AT&amp;T sells them", [{ kind: "text", value: "AT&amp;T sells them" }]],
    ["A comment <!-- hidden --> gone", [{ kind: "text", value: "A comment  gone" }]],
    // Prose that merely looks like a tag. Unwrapping an unrecognised name here
    // would delete the words, so a fragment carrying one is left as written.
    [
      "Mail <sales@example.com> today.",
      [{ kind: "text", value: "Mail <sales@example.com> today." }],
    ],
    ["use List<string> here", [{ kind: "text", value: "use List<string> here" }]],
    // A code span is verbatim, so the HTML pass never sees inside one.
    [
      "Use `<div>` to wrap it.",
      [
        { kind: "text", value: "Use " },
        { kind: "code", value: "<div>" },
        { kind: "text", value: " to wrap it." },
      ],
    ],
    [
      "Link `<a href>` and <b>bold</b>",
      [
        { kind: "text", value: "Link " },
        { kind: "code", value: "<a href>" },
        { kind: "text", value: " and " },
        { kind: "strong", value: "bold" },
      ],
    ],
    // Every placeholder-bearing slot is expanded, href included, or the cursor
    // slides and every later node takes the wrong one.
    [
      "[click](https://x.com/<b>W</b>) then <i>later</i>",
      [
        { kind: "link", text: "click", href: "https://x.com/W" },
        { kind: "text", value: " then " },
        { kind: "em", value: "later" },
      ],
    ],
  ];
  for (const [source, expected] of table) {
    const block = first(source);
    assert.equal(block.kind, "paragraph", source);
    if (block.kind !== "paragraph") continue;
    assert.deepEqual(block.inline, expected, source);
  }
});

test("a level 1 heading below the top is kept, not dropped", () => {
  const blocks = parseBlocks("Intro.\n\n# Section");
  assert.equal(blocks[1].kind === "heading" && blocks[1].level, 2);
  assert.deepEqual(blocks[1].kind === "heading" && blocks[1].inline, [
    { kind: "text", value: "Section" },
  ]);
});

test("a markdown link with a refused scheme keeps its words", () => {
  // The same allow-list as the HTML path: a `javascript:` URL never reaches an
  // href, and the link text is never lost with it.
  const table: [string, InlineNode[]][] = [
    ["[Click](javascript:alert)", [{ kind: "text", value: "Click" }]],
    ["[Click](vbscript:x)", [{ kind: "text", value: "Click" }]],
    ["[Click](data:text/html,x)", [{ kind: "text", value: "Click" }]],
    // The words stay PARSED. Emitting the label raw printed its own asterisks,
    // which is the leak this PR exists to stop, arriving through the fallback.
    ["[**Click**](javascript:alert)", [{ kind: "strong", value: "Click" }]],
    [
      "[a `code` b](vbscript:x)",
      [
        { kind: "text", value: "a " },
        { kind: "code", value: "code" },
        { kind: "text", value: " b" },
      ],
    ],
    // The same rule for an image: a refused src costs the image, not its alt.
    [
      "![**Alt**](javascript:x) after",
      [{ kind: "strong", value: "Alt" }, { kind: "text", value: " after" }],
    ],
    ["[Click](/pricing)", [{ kind: "link", text: "Click", href: "/pricing" }]],
    [
      "[Mail](mailto:a@b.c)",
      [{ kind: "link", text: "Mail", href: "mailto:a@b.c" }],
    ],
  ];
  for (const [source, expected] of table) {
    const block = first(source);
    assert.equal(block.kind, "paragraph", source);
    if (block.kind !== "paragraph") continue;
    assert.deepEqual(block.inline, expected, source);
  }
});

test("inert markup is dropped on the markdown path too, and never escaped", () => {
  // Rule 1 is not conditional on which parser runs. A markdown signal outside
  // the element routes this to the markdown path, and an unterminated
  // `<script>` there used to render as visible escaped source.
  const table: [string, (string | number)[]][] = [
    ["## Head\n<script>alert(1)", ["heading:2"]],
    ["## Head\n\n<script>alert(1)</script>", ["heading:2"]],
    ["## Head\n\n<!-- hidden -->", ["heading:2"]],
    ["## Head\n\nText <script>alert(1)</script> after", ["heading:2", "paragraph"]],
    ["<script>alert(1)", []],
  ];
  for (const [source, expected] of table) {
    const blocks = parseBlocks(source);
    assert.deepEqual(
      blocks.map((block) => (block.kind === "heading" ? `heading:${block.level}` : block.kind)),
      expected,
      source,
    );
    for (const block of blocks) {
      const text = block.kind === "paragraph" || block.kind === "heading"
        ? block.inline.map((node) => (node.kind === "text" ? node.value : "")).join("")
        : "";
      assert.ok(!text.includes("alert"), source);
      assert.ok(!text.includes("<"), source);
    }
  }
});

test("a body cannot forge the placeholders that hold a node's place", () => {
  // `&#xFFFC;` decodes to the sentinel this module uses while it re-tokenizes.
  // If a body could produce one, it would consume a node's slot and slide every
  // later node onto the wrong one — reordering the paragraph, silently.
  const table: [string, InlineNode[]][] = [
    [
      "<b>x</b>&#xFFFC;<i>y</i>",
      [
        { kind: "strong", value: "x" },
        { kind: "text", value: "&#xFFFC;" },
        { kind: "em", value: "y" },
      ],
    ],
    [
      "&#xFFF9;<b>x</b> and `c`",
      [
        { kind: "text", value: "&#xFFF9;" },
        { kind: "strong", value: "x" },
        { kind: "text", value: " and " },
        { kind: "code", value: "c" },
      ],
    ],
    // A literal one typed into the body is stripped at entry rather than
    // decoded, so neither route can smuggle one in.
    // Stripped, then the HTML path collapses the whitespace it left behind.
    ["a \ufffc b <b>c</b>", [{ kind: "text", value: "a b " }, { kind: "strong", value: "c" }]],
  ];
  for (const [source, expected] of table) {
    assert.deepEqual(parseInline(source), expected, JSON.stringify(source));
  }
});

test("a tag-shaped string in an attribute does not defeat the detector", () => {
  // The balance test is counted from the tokenizer's tag boundaries, not from a
  // regex: `<a>` inside `title="<a>"` is a string, and counting it as an
  // unclosed anchor shipped the whole paragraph as escaped source.
  const table: [string, InlineNode[]][] = [
    ['Intro <p title="<a>">visible</p>', [{ kind: "text", value: "Intro  visible" }]],
    [
      'Read <a href="/x" title="<b>quoted</b>">now</a> please',
      [
        { kind: "text", value: "Read " },
        { kind: "link", text: "now", href: "/x" },
        { kind: "text", value: " please" },
      ],
    ],
    [
      "a <b title='</b>'>x</b> b",
      [
        { kind: "text", value: "a " },
        { kind: "strong", value: "x" },
        { kind: "text", value: " b" },
      ],
    ],
    // A single-quoted value, an unquoted value carrying `>`, a bare `<` that is
    // not tag-shaped, an apparent close tag, and a comment holding tag-shaped
    // text: every one of these used to skew the count.
    ["Intro <p title='<a>'>visible</p>", [{ kind: "text", value: "Intro  visible" }]],
    ["Intro <p data-x=a>b>visible</p>", [{ kind: "text", value: "Intro  b>visible" }]],
    ['Intro <p title="a < b">visible</p>', [{ kind: "text", value: "Intro  visible" }]],
    ['Intro <p title="</p>">visible</p>', [{ kind: "text", value: "Intro  visible" }]],
    ["<!-- <a> --><b>x</b>", [{ kind: "strong", value: "x" }]],
    // A dropped-tag spelling inside an attribute is a string, not an element.
    // Believing it deleted the rest of the document and then escaped what was
    // left onto the page.
    ['Intro <p title="<script>">visible</p>', [{ kind: "text", value: "Intro  visible" }]],
    ["Intro <p title='<style>'>visible</p>", [{ kind: "text", value: "Intro  visible" }]],
    // Still prose, because the name is unknown or the element never closes.
    ["The <section> tag groups content.", [{ kind: "text", value: "The <section> tag groups content." }]],
    ["use List<string> here", [{ kind: "text", value: "use List<string> here" }]],
  ];
  for (const [source, expected] of table) {
    assert.deepEqual(parseInline(source), expected, source);
  }
});

test("the routing decision uses real tag positions, not line shapes", () => {
  // The same class one level up: a line that only LOOKS like it opens a tag,
  // because it sits inside a quoted value, a comment or a code fence, must not
  // send a markdown body to the HTML parser and lose its structure.
  const table: [string, boolean][] = [
    ['Intro.\n\nSee <a href="/x"\ntitle="\n<p>not a tag">here</a>.\n\n## Head', false],
    ["Intro.\n\n<!--\n<p>commented</p>\n-->\n\n## Head", false],
    ["Intro.\n\n```\n<p>example</p>\n```\n\n## Head", false],
    // A real block tag opening a real line still routes to HTML.
    ["<p>Real.</p>\n<h2>Head</h2>", true],
    ['<script type="application/ld+json">{}</script>Lead prose.\n<p>x</p>', true],
  ];
  for (const [source, expected] of table) {
    assert.equal(looksLikeHtmlBody(source), expected, JSON.stringify(source));
  }
  // And the markdown bodies keep their structure rather than collapsing.
  const blocks = parseBlocks("Intro.\n\n<!--\n<p>commented</p>\n-->\n\n## Head\n\n- one");
  assert.deepEqual(
    blocks.map((block) => (block.kind === "heading" ? `heading:${block.level}` : block.kind)),
    ["paragraph", "heading:2", "list"],
  );
});

test("an unknown wrapper is markup, not text", () => {
  // `<article-body>` is not in the tag table, but a body opening with it is
  // still markup. Refusing to route it left the whole document on the markdown
  // path, where it rendered as escaped source.
  const table: [string, (string | number)[]][] = [
    ["<article-body><p>Hello</p><h2>Head</h2></article-body>", ["paragraph", "heading:2"]],
    ["<x-callout>Text here</x-callout>", ["paragraph"]],
    ["<Wrapper>\n<p>a</p>\n</Wrapper>", ["paragraph"]],
  ];
  for (const [source, expected] of table) {
    const blocks = parseBlocks(source);
    assert.deepEqual(
      blocks.map((block) => (block.kind === "heading" ? `heading:${block.level}` : block.kind)),
      expected,
      source,
    );
    for (const block of blocks) {
      const text =
        block.kind === "paragraph" || block.kind === "heading"
          ? block.inline.map((node) => (node.kind === "text" ? node.value : "")).join("")
          : "";
      assert.ok(!text.includes("<"), source);
    }
  }
});

test("a code span and a fence keep the tags they are about", () => {
  // The strip must not reach inside either: there the tag is displayed content.
  const block = first("Use `<script>` carefully");
  assert.equal(block.kind, "paragraph");
  if (block.kind !== "paragraph") return;
  assert.deepEqual(block.inline, [
    { kind: "text", value: "Use " },
    { kind: "code", value: "<script>" },
    { kind: "text", value: " carefully" },
  ]);
  const fence = first("```\n<script>alert(1)</script>\n```");
  assert.equal(fence.kind === "code" && fence.text, "<script>alert(1)</script>");
});

test("a URL is checked after it is reassembled, not before", () => {
  // Inline HTML inside a destination hides the scheme from the check:
  // `java<b>script</b>:alert(1)` reaches the tokenizer as `java\uFFFCscript:…`,
  // which reads as a relative path. Expanding it rebuilds `javascript:alert(1)`,
  // so the string the page would carry has to be the string that is judged.
  const table: [string, InlineNode[]][] = [
    [
      "[Click](java<b>script</b>:alert)",
      [{ kind: "text", value: "Click" }],
    ],
    ["[Click](java<b></b>script:alert)", [{ kind: "text", value: "Click" }]],
    ["![Alt](java<b>script</b>:alert)", [{ kind: "text", value: "Alt" }]],
    ["[Click](<b>vb</b>script:x)", [{ kind: "text", value: "Click" }]],
    // A safe destination carrying inline HTML still resolves to a link.
    [
      "[Click](/pric<b>ing</b>)",
      [{ kind: "link", text: "Click", href: "/pricing" }],
    ],
  ];
  for (const [source, expected] of table) {
    assert.deepEqual(parseInline(source), expected, source);
  }
});

test("a standalone image with a refused src keeps its alt as a paragraph", () => {
  const blocks = parseBlocks("![**Alt** text](javascript:x)");
  assert.deepEqual(blocks.map((block) => block.kind), ["paragraph"]);
  if (blocks[0].kind !== "paragraph") return;
  assert.deepEqual(blocks[0].inline, [
    { kind: "strong", value: "Alt" },
    { kind: "text", value: " text" },
  ]);
});

test("a fenced code block keeps HTML verbatim", () => {
  const block = first("```\n<div>x</div>\n```");
  assert.equal(block.kind === "code" && block.text, "<div>x</div>");
});

test("a row wider than the header keeps its extra cell", () => {
  // The markdown path used to truncate to the header width while the HTML path
  // kept the cell. One rule now, so the same source gives the same table.
  const block = first("| A |\n| --- |\n| 1 | 2 |");
  assert.equal(block.kind, "table");
  if (block.kind !== "table") return;
  assert.equal(block.header.length, 2);
  assert.deepEqual(block.rows[0][1], [{ kind: "text", value: "2" }]);
});

test("paragraphs join their wrapped lines", () => {
  const block = first("One line\nsecond line");
  assert.equal(block.kind, "paragraph");
  if (block.kind !== "paragraph") return;
  assert.deepEqual(block.inline, [
    { kind: "text", value: "One line second line" },
  ]);
});

test("blank lines separate blocks", () => {
  assert.deepEqual(kinds("One.\n\nTwo."), ["paragraph", "paragraph"]);
});

test("inline marks", () => {
  const block = first("Use **bold** and *em* and `code` and [link](https://x.com)");
  assert.equal(block.kind, "paragraph");
  if (block.kind !== "paragraph") return;
  assert.deepEqual(block.inline, [
    { kind: "text", value: "Use " },
    { kind: "strong", value: "bold" },
    { kind: "text", value: " and " },
    { kind: "em", value: "em" },
    { kind: "text", value: " and " },
    { kind: "code", value: "code" },
    { kind: "text", value: " and " },
    { kind: "link", text: "link", href: "https://x.com" },
  ]);
});

test("unordered list", () => {
  const block = first("- One\n- Two");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.ordered, false);
  assert.equal(block.items.length, 2);
  assert.deepEqual(block.items[0].inline, [{ kind: "text", value: "One" }]);
});

test("ordered list", () => {
  const block = first("1. One\n2. Two");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.ordered, true);
  assert.equal(block.items.length, 2);
});

test("one level of nesting becomes children, not separate items", () => {
  const block = first("- Top\n  - Sub\n  - Sub two\n- Next");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.items.length, 2);
  // One child group, holding both same-marker children.
  assert.equal(block.items[0].children.length, 1);
  assert.equal(block.items[0].children[0].ordered, false);
  assert.equal(block.items[0].children[0].items.length, 2);
  assert.deepEqual(block.items[0].children[0].items[0].inline, [
    { kind: "text", value: "Sub" },
  ]);
  assert.equal(block.items[1].children.length, 0);
});

test("a nested item with no parent is promoted rather than dropped", () => {
  const block = first("  - Orphan");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.items.length, 1);
  assert.deepEqual(block.items[0].inline, [{ kind: "text", value: "Orphan" }]);
});

test("nested ordered children keep their own marker type", () => {
  const block = first("1. Parent\n  1. Child");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.ordered, true);
  assert.equal(block.items[0].children.length, 1);
  assert.equal(block.items[0].children[0].ordered, true);
});

test("a mixed nested list parses instead of falling back to a paragraph", () => {
  // `- Parent` + `  1. Child` matched neither all-unordered nor all-ordered,
  // so the whole block became a paragraph of literal markers.
  const block = first("- Parent\n  1. Child");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.ordered, false);
  assert.equal(block.items[0].children[0].ordered, true);
  assert.deepEqual(block.items[0].children[0].items[0].inline, [
    { kind: "text", value: "Child" },
  ]);
});

test("an unordered child under an ordered parent keeps its type", () => {
  const block = first("1. Parent\n  - Child");
  assert.equal(block.kind === "list" && block.ordered, true);
  if (block.kind !== "list") return;
  assert.equal(block.items[0].children[0].ordered, false);
});

test("mixed markers at root level become separate lists, not a paragraph", () => {
  // The same defect one level up: neither every() branch matched.
  const blocks = parseBlocks("- One\n1. Two");
  assert.deepEqual(blocks.map((b) => b.kind), ["list", "list"]);
  assert.equal(blocks[0].kind === "list" && blocks[0].ordered, false);
  assert.equal(blocks[1].kind === "list" && blocks[1].ordered, true);
});

test("two child groups with different markers are kept separate", () => {
  const block = first("- Parent\n  - Bullet child\n  1. Numbered child");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.items[0].children.length, 2);
  assert.equal(block.items[0].children[0].ordered, false);
  assert.equal(block.items[0].children[1].ordered, true);
});

test("different bullet characters are still one unordered list", () => {
  const blocks = parseBlocks("* One\n- Two");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind === "list" && blocks[0].items.length, 2);
});

test("a second parent after nested children starts a sibling, not a child", () => {
  const block = first("- One\n  - Nested\n- Two");
  assert.equal(block.kind, "list");
  if (block.kind !== "list") return;
  assert.equal(block.items.length, 2);
  assert.equal(block.items[1].children.length, 0);
});

test("root ordered numbering is independent per list", () => {
  const blocks = parseBlocks("1. a\n- b\n3. c");
  assert.deepEqual(blocks.map((b) => b.kind), ["list", "list", "list"]);
});

test("blockquote", () => {
  const block = first("> Quoted line.");
  assert.equal(block.kind, "blockquote");
  if (block.kind !== "blockquote") return;
  assert.equal(block.lines.length, 1);
  assert.deepEqual(block.lines[0], [{ kind: "text", value: "Quoted line." }]);
});

test("a multi-line blockquote keeps each line", () => {
  const block = first("> One.\n> Two.");
  assert.equal(block.kind === "blockquote" && block.lines.length, 2);
});

test("a quote marker mid-paragraph is not a blockquote", () => {
  assert.equal(first("Costs 5 > 3 in practice").kind, "paragraph");
});

test("pipe table with a header rule", () => {
  const block = first("| A | B |\n| --- | --- |\n| 1 | 2 |");
  assert.equal(block.kind, "table");
  if (block.kind !== "table") return;
  assert.equal(block.header.length, 2);
  assert.deepEqual(block.header[0], [{ kind: "text", value: "A" }]);
  assert.equal(block.rows.length, 1);
  assert.deepEqual(block.rows[0][1], [{ kind: "text", value: "2" }]);
});

test("an escaped pipe inside a cell is unescaped, not a column break", () => {
  const block = first("| a\\|b |\n| --- |");
  assert.equal(block.kind, "table");
  if (block.kind !== "table") return;
  assert.equal(block.header.length, 1);
  assert.deepEqual(block.header[0], [{ kind: "text", value: "a|b" }]);
});

test("a ragged row is padded to the header width", () => {
  const block = first("| A | B |\n| --- | --- |\n| 1 |");
  assert.equal(block.kind, "table");
  if (block.kind !== "table") return;
  assert.equal(block.rows[0].length, 2);
});

test("pipes in a paragraph are not a table", () => {
  assert.equal(first("Cost | benefit").kind, "paragraph");
});

test("a table needs its separator row", () => {
  // Without one it is ambiguous, and treating it as a table would eat a line.
  assert.equal(first("| just | text |").kind, "paragraph");
});

test("fenced code", () => {
  const block = first("```\nnpm run build\n```");
  assert.equal(block.kind, "code");
  if (block.kind !== "code") return;
  assert.equal(block.text, "npm run build");
});

test("a blank line inside a fence does not split the block", () => {
  // splitting on blank lines first would cut this code block in half.
  const block = first("```\nfirst\n\nsecond\n```");
  assert.equal(block.kind, "code");
  if (block.kind !== "code") return;
  assert.equal(block.text, "first\n\nsecond");
});

test("code content is never inline-formatted", () => {
  const block = first("```\na **b** c\n```");
  assert.equal(block.kind === "code" && block.text, "a **b** c");
});

test("an unterminated fence still yields a code block rather than eating the rest", () => {
  const block = first("```\ndangling");
  assert.equal(block.kind, "code");
  if (block.kind !== "code") return;
  assert.equal(block.text, "dangling");
});

test("a language tag on the fence is accepted and ignored", () => {
  const block = first("```bash\nls\n```");
  assert.equal(block.kind === "code" && block.text, "ls");
});

test("a standalone image is its own block, not a paragraph", () => {
  // The converter emits images alone; wrapping one in <p> nests a figure
  // inside a paragraph.
  const block = first("![A gutter](/blog/a/1-x.jpg)");
  assert.equal(block.kind, "image");
  if (block.kind !== "image") return;
  assert.equal(block.src, "/blog/a/1-x.jpg");
  assert.equal(block.alt, "A gutter");
});

test("an image with text around it stays inline", () => {
  const block = first("Before ![A](/x.jpg) after");
  assert.equal(block.kind, "paragraph");
  if (block.kind !== "paragraph") return;
  assert.ok(block.inline.some((node) => node.kind === "image"));
});

test("an image with an empty alt is still an image block", () => {
  const block = first("![](/blog/a/1-x.jpg)");
  assert.equal(block.kind === "image" && block.alt, "");
});

test("the full converter output shape parses to the documented block set", () => {
  const source = [
    "## Heading",
    "",
    "A paragraph with **bold**.",
    "",
    "- One",
    "  - Nested",
    "",
    "1. First",
    "",
    "> Quoted.",
    "",
    "| A | B |",
    "| --- | --- |",
    "| 1 | 2 |",
    "",
    "```",
    "code",
    "```",
    "",
    "![Alt](/blog/a/1-x.jpg)",
    "",
    "*A caption*",
  ].join("\n");
  assert.deepEqual(kinds(source), [
    "heading",
    "paragraph",
    "list",
    "list",
    "blockquote",
    "table",
    "code",
    "image",
    "paragraph",
  ]);
});

test("empty and whitespace-only sources yield no blocks", () => {
  assert.deepEqual(parseBlocks(""), []);
  assert.deepEqual(parseBlocks("   \n\n  "), []);
});

test("every block kind the parser can emit is in the documented set", () => {
  const documented = new Set([
    "heading",
    "paragraph",
    "list",
    "blockquote",
    "table",
    "code",
    "image",
  ]);
  const source = [
    "## H",
    "",
    "p",
    "",
    "- l",
    "",
    "> q",
    "",
    "| A |",
    "| --- |",
    "",
    "```",
    "c",
    "```",
    "",
    "![a](/i.jpg)",
  ].join("\n");
  for (const kind of kinds(source)) {
    assert.ok(documented.has(kind), `undocumented block kind: ${kind}`);
  }
});

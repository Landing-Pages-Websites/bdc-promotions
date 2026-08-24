import assert from "node:assert/strict";
import test from "node:test";

import { parseBlocks, type Block } from "./markdown.ts";

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

test("a lone # is still a level 2 heading", () => {
  const block = first("# Legacy");
  assert.equal(block.kind === "heading" && block.level, 2);
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

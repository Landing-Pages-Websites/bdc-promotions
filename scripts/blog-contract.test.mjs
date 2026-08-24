import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("starter ships a blog index, post template, and markdown content dir", () => {
  for (const relativePath of [
    "src/app/blog/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/lib/blog.ts",
    "src/components/blog/MarkdownBody.tsx",
  ]) {
    assert.equal(existsSync(join(root, relativePath)), true, relativePath);
  }
  assert.match(read("src/lib/routes.ts"), /path:\s*"\/blog"/);
  assert.match(read("src/lib/blog.ts"), /content\/blog/);
  const posts = readdirSync(join(root, "content/blog")).filter(
    (name) => name.endsWith(".md") || name.endsWith(".mdx"),
  );
  assert.ok(posts.length >= 1, "content/blog needs at least one markdown post");
  const sample = read(`content/blog/${posts[0]}`);
  assert.match(sample, /^---[\s\S]*title:/);
  assert.match(
    read("src/lib/blog-images.ts"),
    /zleague-public-prod\.s3\.us-east-2\.amazonaws\.com/,
  );
  assert.match(read("next.config.ts"), /megaArticleImageRemotePatterns/);
});

test("the renderer supports the block set the MEGA migrator emits", () => {
  // The go-live blog migrator converts a customer's existing posts into this
  // markdown subset. A block the renderer cannot draw ships as literal
  // markdown on a live site, so the set is a contract, not an implementation
  // detail. Keep in sync with BLOCK_KINDS in src/lib/markdown.ts.
  const markdown = read("src/lib/markdown.ts");
  for (const kind of [
    "heading",
    "paragraph",
    "list",
    "blockquote",
    "table",
    "code",
    "image",
  ]) {
    assert.match(
      markdown,
      new RegExp(`kind:\\s*"${kind}"`),
      `src/lib/markdown.ts no longer emits the "${kind}" block`,
    );
  }
  // The renderer must handle every kind the parser can emit. Asserting on
  // branches rather than on literal tags: the list tag is chosen dynamically,
  // so matching "<ol" would fail on a correct renderer.
  const renderer = read("src/components/blog/MarkdownBody.tsx");
  for (const kind of ["heading", "list", "blockquote", "table", "code", "image"]) {
    assert.match(
      renderer,
      new RegExp(`case "${kind}"`),
      `MarkdownBody has no branch for the "${kind}" block`,
    );
  }
  // paragraph is the default branch, so it has no case label.
  assert.match(renderer, /default:/, "MarkdownBody lost its paragraph fallback");
});

test("check-config treats a missing blog contract as a hard failure", () => {
  const source = read("scripts/check-config.mjs");
  assert.match(source, /collectBlogContractProblems/);
  assert.match(source, /ALLOW_TODO/);
  assert.match(source, /blogProblems/);
});

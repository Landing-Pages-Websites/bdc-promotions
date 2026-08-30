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
  const documented = [
    "heading",
    "paragraph",
    "list",
    "blockquote",
    "table",
    "code",
    "image",
  ];
  const markdown = read("src/lib/markdown.ts");
  for (const kind of documented) {
    assert.match(
      markdown,
      new RegExp(`kind:\\s*"${kind}"`),
      `src/lib/markdown.ts no longer emits the "${kind}" block`,
    );
  }
  // The block set and the inline set are separate contracts that happen to
  // share two names ("code", "image"), so each is derived from its own type
  // declaration rather than from one union of string literals.
  const union = (name) => {
    const declaration = markdown.match(
      new RegExp(`export type ${name} =([\\s\\S]*?);\\n`),
    );
    assert.ok(declaration, `cannot read the ${name} declaration`);
    const kinds = [...declaration[1].matchAll(/kind:\s*"([a-z]+)"/g)].map((m) => m[1]);
    assert.ok(kinds.length > 0, `${name} declares no kinds`);
    return kinds;
  };
  assert.deepEqual(
    [...new Set(union("Block"))].sort(),
    [...documented].sort(),
    "the Block type and the documented set disagree",
  );

  // The HTML body parser emits the same two types, so it is a second place the
  // sets could be widened without markdown.ts changing. A kind it names that is
  // in neither declaration means the migrator in mega-clawhub
  // (SUPPORTED_BLOCKS) and the CMS rich-text grammar are now out of sync.
  const known = new Set([...union("Block"), ...union("InlineNode")]);
  const html = read("src/lib/html-blocks.ts");
  assert.match(
    html,
    /import type \{[^}]*\bBlock\b[^}]*\} from "\.\/markdown"/,
    "src/lib/html-blocks.ts no longer takes its Block type from markdown.ts",
  );
  for (const [, kind] of html.matchAll(/kind:\s*"([a-z]+)"/g)) {
    assert.ok(known.has(kind), `src/lib/html-blocks.ts emits the unknown kind "${kind}"`);
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

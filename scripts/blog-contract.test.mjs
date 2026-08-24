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

test("check-config treats a missing blog contract as a hard failure", () => {
  const source = read("scripts/check-config.mjs");
  assert.match(source, /collectBlogContractProblems/);
  assert.match(source, /ALLOW_TODO/);
  assert.match(source, /blogProblems/);
});

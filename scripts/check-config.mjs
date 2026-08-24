#!/usr/bin/env node
/**
 * Verifies operational config and authored managed content before a production build.
 *
 * - Fails (exit 1) if any `TODO_` sentinel or empty required value remains.
 * - `ALLOW_TODO=1 npm run build` downgrades failures to warnings — useful
 *   for CI builds of the template itself and early previews.
 *
 * Runs automatically via the `prebuild` npm script.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function jsonFiles(relativeDirectory) {
  const directory = join(repositoryRoot, relativeDirectory);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return jsonFiles(relativePath);
    return entry.isFile() && entry.name.endsWith(".json") ? [relativePath] : [];
  });
}

const configFiles = ["src/site.config.ts", ...jsonFiles("src/content").sort()];

function collectProblems(source, relativePath) {
  const problems = [];
  const lines = source.split("\n");

  lines.forEach((line, index) => {
    // Skip pure comment lines so docs may mention the sentinel convention.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) {
      return;
    }
    const todoMatch = line.match(/TODO_[A-Z0-9_]+/);
    if (todoMatch) {
      problems.push(
        `${relativePath}:${index + 1}: sentinel ${todoMatch[0]} still present -> ${line.trim()}`,
      );
    }
    const emptyMatch = line.match(/^\s*"?([A-Za-z0-9_]+)"?\s*:\s*(""|'')/);
    if (emptyMatch) {
      problems.push(
        `${relativePath}:${index + 1}: required field "${emptyMatch[1]}" is empty`,
      );
    }
  });

  return problems;
}

function readConfig(relativePath) {
  const path = join(repositoryRoot, relativePath);
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    console.error(`check-config: cannot read ${path}: ${error.message}`);
    process.exit(1);
  }
}

function collectBlogContractProblems() {
  const requiredFiles = [
    "src/app/blog/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/lib/blog.ts",
  ];
  const problems = requiredFiles
    .filter((relativePath) => !existsSync(join(repositoryRoot, relativePath)))
    .map(
      (relativePath) =>
        `${relativePath}: missing — every site needs a blog index and post template`,
    );
  const routes = readConfig("src/lib/routes.ts");
  if (!/path:\s*"\/blog"/.test(routes)) {
    problems.push(
      'src/lib/routes.ts: missing { path: "/blog" } — sitemap and 404 key pages will hide the blog',
    );
  }
  const postsDirectory = join(repositoryRoot, "content/blog");
  if (!existsSync(postsDirectory)) {
    problems.push(
      "content/blog: directory missing — MEGA git-as-CMS publishes markdown here",
    );
    return problems;
  }
  const posts = readdirSync(postsDirectory).filter(
    (name) => name.endsWith(".md") || name.endsWith(".mdx"),
  );
  if (posts.length === 0) {
    problems.push(
      "content/blog: no markdown posts — add at least one so /blog/<slug> proves the post template",
    );
  }
  if (!existsSync(join(repositoryRoot, "src/lib/blog-images.ts"))) {
    problems.push(
      "src/lib/blog-images.ts: missing — MEGA writes article images as S3 URLs that next/image must allow",
    );
  } else if (
    !/zleague-public-prod\.s3\.us-east-2\.amazonaws\.com/.test(
      readConfig("src/lib/blog-images.ts"),
    )
  ) {
    problems.push(
      "src/lib/blog-images.ts: missing MEGA article image host zleague-public-prod.s3.us-east-2.amazonaws.com",
    );
  }
  const nextConfig = readConfig("next.config.ts");
  if (!/megaArticleImageRemotePatterns/.test(nextConfig)) {
    problems.push(
      "next.config.ts: images.remotePatterns must use megaArticleImageRemotePatterns so MEGA S3 article images load",
    );
  }
  return problems;
}

const todoProblems = configFiles.flatMap((relativePath) =>
  collectProblems(readConfig(relativePath), relativePath),
);
const blogProblems = collectBlogContractProblems();
const problems = [...todoProblems, ...blogProblems];

if (problems.length === 0) {
  console.log(
    "check-config: operational config, managed content, and blog contract look complete.",
  );
  process.exit(0);
}

const allowTodo = process.env.ALLOW_TODO === "1";
const blocking = allowTodo ? blogProblems : problems;
const label =
  allowTodo && todoProblems.length > 0 && blogProblems.length === 0
    ? "WARNING"
    : "ERROR";

console[label === "WARNING" ? "warn" : "error"](
  `check-config ${label}: site configuration is not filled in:\n` +
    problems.map((p) => `  - ${p}`).join("\n"),
);

if (allowTodo && blocking.length === 0) {
  console.warn("check-config: continuing because ALLOW_TODO=1.");
  process.exit(0);
}

if (blogProblems.length > 0) {
  console.error(
    "\nRestore the blog index, post template, and at least one markdown file under content/blog.",
  );
}

if (todoProblems.length > 0 && blocking === problems) {
  console.error(
    "\nFill in the listed files (or set ALLOW_TODO=1 for a preview build).",
  );
}
process.exit(1);

// Dedicated finite-batch checks. Run separately from npm test, whose existing
// blog fixtures temporarily mutate the content directory:
// node --import tsx --test scripts/bdc-wiring-test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { siteRoutes } from "../src/lib/routes.ts";
import { listPublishedPosts } from "../src/lib/blog.ts";
import { createRequire } from "node:module";
const { default: sitemap } = createRequire(import.meta.url)("../src/app/sitemap.ts");
import { reviewRoutes } from "./bdc-review-routes.mjs";

const approved = "1f24ca2fbebd14dedbaf3cd6b56fdc660a22b02f";
const home = "d061433edbfd72e99c9896b05142e2238b4601e2";
const article = "src/app/blog/[slug]/page.tsx";
const legal = "src/components/legal/LegalPageLayout.tsx";
const read = (path) => readFileSync(path, "utf8");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const original = (path, ref = approved) => git("show", `${ref}:${path}`);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const routes = reviewRoutes();

// Compare all tracked app/content/assets/package bytes, not just handpicked UI.
test("approved source is untouched outside the exact wiring scope", () => {
  const allowed = new Set([article, legal, "src/lib/routes.ts", "src/app/sitemap.ts", "src/components/navigation/PrimarySiteNavigation.tsx"]);
  const changed = git("diff", "--name-only", approved, "--", "src", "content", "public", "packages", "package.json", "package-lock.json", "next.config.ts").trim().split("\n").filter(Boolean);
  assert.deepEqual(changed.filter((path) => !allowed.has(path)), []);
  const homePaths = ["src/app/page.tsx", "src/app/layout.tsx", "src/components/home", "src/content", "src/site.config.ts", "src/app/globals.css", "src/app/styles"];
  assert.equal(git("diff", home, "--", ...homePaths), "");
});

test("all 14 published Markdown records retain their exact SHA-256 bytes", () => {
  const files = git("ls-tree", "-r", "--name-only", approved, "content/blog").trim().split("\n");
  assert.equal(files.filter((path) => path.endsWith(".md")).length, 15);
  assert.equal(listPublishedPosts().length, 14);
  for (const path of files) assert.equal(digest(readFileSync(path)), digest(execFileSync("git", ["show", `${approved}:${path}`])), path);
});

test("selected article rendering, params, imports and legacy/legal prose are preserved", () => {
  const stripNavigationImport = (source) => source.replace(/^import \{ PrimarySiteNavigation \}.*\n/m, "");
  assert.equal(stripNavigationImport(read(article)).split("  const isContrastTarget =")[0], original(article).split("  const isContrastTarget =")[0]);
  const articleMarkup = (source) => source.match(/<article[\s\S]*<\/article>/)[0];
  for (const path of [article, legal]) assert.equal(articleMarkup(read(path)), articleMarkup(original(path)), path);
});

test("registry, review routes and sitemap agree on 31 unique canonical paths", () => {
  const priorPaths = [...original("src/lib/routes.ts").matchAll(/path: "([^"]+)"/g)].map((match) => match[1].replace(/\/$/, "") || "/");
  assert.deepEqual(siteRoutes.map(({ path }) => path), priorPaths);
  assert.equal(siteRoutes.length, 17);
  assert.equal(routes.length, 31);
  assert.equal(new Set(routes).size, 31);
  assert.equal(routes[0], "/");
  assert.ok(routes.includes("/about"));
  assert.ok(routes.every((path) => path.startsWith("/") && (path === "/" || !path.endsWith("/")) && !/^\/(lp|variant)/.test(path)));
  assert.deepEqual(sitemap().map(({ url }) => new URL(url).pathname), routes);
});

const base = process.env.BDC_TEST_BASE_URL;
test("production HTML: routes, bridge, sitemap, legal/article links and retired variants", { skip: !base }, async () => {
  const contract = JSON.parse(read(process.env.BDC_BRIDGE_CONTRACT)).promoted;
  const pages = new Map();
  for (const path of routes) {
    const response = await fetch(new URL(path, base), { redirect: "manual" });
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("x-frame-options"), null, path);
    assert.equal(response.headers.get("content-security-policy"), null, path);
    const html = await response.text();
    const scripts = html.match(/<script\b[^>]*\bsrc="https:\/\/app\.gomega\.ai\/review-bridge\/[^>]*><\/script>/g) ?? [];
    assert.equal(scripts.length, 1, path);
    for (const attribute of [`src="${contract.url}"`, `integrity="${contract.integrity}"`, `crossorigin="${contract.crossorigin}"`]) assert.ok(scripts[0].includes(attribute), `${path}: ${attribute}`);
    assert.match(scripts[0], /\bdefer(?:="")?(?:\s|>)/);
    pages.set(path, html);
  }
  const xml = await (await fetch(new URL("/sitemap.xml", base))).text();
  assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname), routes);
  const hrefs = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(hrefs(pages.get("/")).includes("/privacy-policy"));
  for (const path of siteRoutes.map(({ path }) => path).filter((path) => path !== "/thank-you")) assert.ok(hrefs(pages.get("/privacy-policy")).includes(path), path);
  for (const post of listPublishedPosts()) assert.ok(hrefs(pages.get("/blog")).includes(`/blog/${post.slug}`), post.slug);
  const selected = ["welcome", "car-dealership-marketing-agency", "automotive-dealership-crm-buyer-guide"];
  const wired = ["/privacy-policy", "/terms", "/cookie-policy", ...listPublishedPosts().filter(({ slug }) => !selected.includes(slug)).map(({ slug }) => `/blog/${slug}`)];
  for (const path of wired) {
    assert.equal((pages.get(path).match(/<main(?:\s|>)/g) ?? []).length, 1, path);
    assert.ok(pages.get(path).includes('aria-label="Primary site pages"'), path);
    assert.ok(hrefs(pages.get(path)).includes("/"), path);
  }
  for (const path of ["/", ...selected.map((slug) => `/blog/${slug}`)]) assert.ok(!pages.get(path).includes('aria-label="Primary site pages"'), path);
  const lp = await (await fetch(new URL("/lp", base))).text();
  assert.ok(!lp.includes('aria-label="Primary site pages"'));
  for (const path of ["/variant-a", "/variant-b", "/variant-c"]) {
    const response = await fetch(new URL(path, base), { redirect: "manual" });
    assert.ok(response.status === 404 || ([301, 308].includes(response.status) && response.headers.get("location") === "/"), path);
  }
});

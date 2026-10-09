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
const r2 = "6ebb3d21a9a4e0019330005e4032cfceecde61c5";
const privacyMain = "230445355f8b3cc056a558b549c21ecf6c1567d1";
const correctedPost = "content/blog/slow-lead-response-consequences-for-dealerships.md";
const thankYou = "src/app/thank-you/page.tsx";
const markdownBody = "src/components/blog/MarkdownBody.tsx";
const article = "src/app/blog/[slug]/page.tsx";
const legal = "src/components/legal/LegalPageLayout.tsx";
const navigation = "src/components/navigation/PrimarySiteNavigation.tsx";
const read = (path) => readFileSync(path, "utf8");
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const original = (path, ref = approved) => git("show", `${ref}:${path}`);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const routes = reviewRoutes();

// Compare all tracked app/content/assets/package bytes, not just handpicked UI.
test("approved source is untouched outside the exact wiring scope", () => {
  const allowed = new Set([article, legal, navigation, "src/lib/routes.ts", "scripts/bdc-review-routes.mjs", "scripts/bdc-wiring-test.mjs", thankYou, markdownBody, correctedPost]);
  const changed = git("diff", "--name-only", approved).trim().split("\n").filter(Boolean);
  assert.deepEqual(changed.filter((path) => !allowed.has(path)), []);
  const r3Paths = [thankYou, markdownBody, correctedPost, "scripts/bdc-wiring-test.mjs"];
  assert.deepEqual(git("diff", "--name-only", r2).trim().split("\n").filter(Boolean).sort(), r3Paths.sort());
  const homePaths = ["src/app/page.tsx", "src/app/layout.tsx", "src/components/home", "src/content", "src/site.config.ts", "src/app/globals.css", "src/app/styles"];
  assert.equal(git("diff", home, "--", ...homePaths), "");
});

test("14 published records preserve approved bytes except the exact merged PR57 href correction", () => {
  const files = git("ls-tree", "-r", "--name-only", approved, "content/blog").trim().split("\n");
  assert.equal(files.filter((path) => path.endsWith(".md")).length, 15);
  assert.equal(listPublishedPosts().length, 14);
  assert.deepEqual(git("ls-files", "content/blog").trim().split("\n"), files);
  const prior = original(correctedPost);
  assert.equal(prior.split("tel:+13528121491").length - 1, 2);
  const expected = prior.replaceAll("tel:+13528121491", "tel:+13522071074");
  assert.equal(expected, original(correctedPost, privacyMain), "independent merged PR57 blob");
  assert.equal(read(correctedPost), expected);
  for (const path of files) {
    const expectedBytes = path === correctedPost ? Buffer.from(expected) : execFileSync("git", ["show", `${approved}:${path}`]);
    assert.equal(digest(readFileSync(path)), digest(expectedBytes), path);
  }
});

test("selected article rendering, params, imports and legacy/legal prose are preserved", () => {
  const stripNavigationImport = (source) => source.replace(/^import \{ PrimarySiteNavigation \}.*\n/m, "");
  const stripNavigation = (source) => stripNavigationImport(source)
    .replace("    <PrimarySiteNavigation>\n", "")
    .replace("    </PrimarySiteNavigation>\n", "");
  // Construct the ONLY authorized contrast changes from the approved source.
  // Compare whole modules: prose, metadata, authorship, body/image expressions,
  // selected branches, and every non-color class remain strict byte comparisons.
  const replaceOnce = (source, before, after) => {
    assert.equal(source.split(before).length, 2, `expected one occurrence: ${before}`);
    return source.replace(before, after);
  };
  const expectedThankYou = replaceOnce(original(thankYou),
    'text-neutral-600 dark:text-neutral-400', 'text-[color:var(--muted)]');
  const expectedMarkdownBody = replaceOnce(original(markdownBody),
    '<div key={key} className="mt-6 overflow-x-auto">',
    '<div key={key} className="mt-6 overflow-x-auto" tabIndex={0} role="region" aria-label="Article table">');
  assert.equal(read(thankYou), expectedThankYou);
  assert.equal(read(markdownBody), expectedMarkdownBody);
  const originalMetadata = `  const isContrastTarget =
    post.slug === "automotive-dealership-customer-retention" ||
    post.slug === "facebook-advertising-for-car-dealerships";
  const metadataTextClassName = isContrastTarget
    ? "text-sm text-[color:var(--muted)]"
    : "text-sm text-neutral-500";`;
  const expectedArticle = replaceOnce(original(article), originalMetadata,
    '  const metadataTextClassName = "text-sm text-[color:var(--muted)]";');
  let expectedLegal = replaceOnce(original(legal),
    'className="mt-2 text-sm text-neutral-500"',
    'className="mt-2 text-sm text-[color:var(--muted)]"');
  expectedLegal = replaceOnce(expectedLegal,
    'className="mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300"',
    'className="mt-2 leading-relaxed text-[color:var(--muted)]"');
  assert.equal(stripNavigation(read(article)), expectedArticle);
  assert.equal(stripNavigation(read(legal)), expectedLegal);
  assert.equal(stripNavigationImport(read(article)).split("  const metadataTextClassName =")[0], original(article).split("  const isContrastTarget =")[0]);
  const shell = read(navigation);
  assert.match(shell, /<a href="#page-content" className="skip-link">Skip page navigation<\/a>/);
  assert.match(shell, /<main id="page-content" tabIndex=\{-1\}>\{children\}<\/main>/);
  assert.ok(shell.indexOf('href="#page-content"') < shell.indexOf("<header"));
  assert.ok(shell.indexOf("</header>") < shell.indexOf('<main id="page-content"'));
  assert.ok(!shell.includes('id="main-content"'));
  assert.doesNotMatch(shell, /use client|tabIndex=\{?["']?[1-9]/);
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
    const html = pages.get(path);
    assert.equal((html.match(/<main(?:\s|>)/g) ?? []).length, 1, path);
    assert.equal((html.match(/\bid="main-content"/g) ?? []).length, 1, path);
    assert.equal((html.match(/\bid="page-content"/g) ?? []).length, 1, path);
    assert.match(html, /<main id="page-content" tabindex="-1">/);
    assert.match(html, /<a href="#page-content" class="skip-link">Skip page navigation<\/a>/);
    assert.ok(html.indexOf('href="#page-content"') < html.indexOf('<nav aria-label="Home and articles"'), path);
    assert.ok(html.indexOf("</header>") < html.indexOf('<main id="page-content"'), path);
    assert.doesNotMatch(html, /\btabindex="[1-9]\d*"/);
    assert.ok(html.includes('aria-label="Primary site pages"'), path);
    assert.ok(hrefs(html).includes("/"), path);
  }
  for (const path of ["/", ...selected.map((slug) => `/blog/${slug}`)]) {
    assert.ok(!pages.get(path).includes('aria-label="Primary site pages"'), path);
    assert.ok(!pages.get(path).includes('id="page-content"'), path);
    assert.ok(!hrefs(pages.get(path)).includes("#page-content"), path);
  }
  assert.match(pages.get("/thank-you"), /<p class="text-\[color:var\(--muted\)\]">/);
  for (const slug of ["automotive-dealership-customer-retention", "automotive-dealership-bdc-lead-response-process", "dealership-messenger-lead-engagement"]) {
    const html = pages.get(`/blog/${slug}`);
    const wrappers = html.match(/<div class="mt-6 overflow-x-auto"[^>]*>/g) ?? [];
    assert.ok(wrappers.length > 0, slug);
    for (const wrapper of wrappers) assert.equal(wrapper, '<div class="mt-6 overflow-x-auto" tabindex="0" role="region" aria-label="Article table">');
  }
  const correctedHtml = pages.get("/blog/slow-lead-response-consequences-for-dealerships");
  assert.doesNotMatch(correctedHtml, /tel:\+13528121491/);
  assert.ok(hrefs(correctedHtml).filter((href) => href === "tel:+13522071074").length >= 2);
  const lp = await (await fetch(new URL("/lp", base))).text();
  assert.ok(!lp.includes('aria-label="Primary site pages"'));
  for (const path of ["/variant-a", "/variant-b", "/variant-c"]) {
    const response = await fetch(new URL(path, base), { redirect: "manual" });
    assert.ok(response.status === 404 || ([301, 308].includes(response.status) && response.headers.get("location") === "/"), path);
  }
});

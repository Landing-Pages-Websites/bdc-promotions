// Dedicated finite-batch checks. Run separately from npm test, whose existing
// blog fixtures temporarily mutate the content directory:
// node --import tsx --test scripts/bdc-wiring-test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { selectedArticleImageSrc } from "../src/components/signal-lane/selected-article-images.ts";
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
const start = "1e60ff4de1d1dfb7b9314f4a3b8543ddf4e59124";
const selectedArticle = "src/components/signal-lane/SelectedArticlePage.tsx";
const imageLookup = "src/components/signal-lane/selected-article-images.ts";
const servicesPage = "src/app/services/page.tsx";
const servicesCss = "src/app/services/services.module.css";
const owners = ["OpeningSection", "DirectorySection", "CompareSection", "ContactSection"];
const frames = ["01-opening", "02-section", "03-compare", "04-section"];
const originals = [
  ["automotive-dealership-crm-buyer-guide", "automotive-dealership-crm-buyer-guide-333230.webp", "ae020709c53e6504285754c66cff55adf0c60491c1811158a2013e92d37c2eba"],
  ["car-dealership-marketing-agency", "car-dealership-marketing-agency-how-to-choose-919633.webp", "90b2d1fefbd1fec838b6f80abae79df9556ad16b5d6e780d4122129d2700a9cc"],
].map(([slug, file, sha256]) => ({ slug, sourceUrl: `https://zleague-public-prod.s3.us-east-2.amazonaws.com/article_images/9951b3b9-96d6-4185-a938-f509cd50ae67/${file}`, localPath: `/images/design/blog__${slug}/02-article-original.webp`, sha256 }));
const r4Paths = ["scripts/bdc-wiring-test.mjs", servicesPage, servicesCss, selectedArticle, imageLookup,
  ...owners.map((owner) => `src/app/services/sections/${owner}.tsx`), "src/app/services/sections/types.ts",
  ...originals.map((entry) => `public${entry.localPath}`)];
const changedSince = (ref) => [...new Set([...git("diff", "--name-only", ref).trim().split("\n"), ...git("ls-files", "--others", "--exclude-standard").trim().split("\n")].filter(Boolean))].sort();



function assertHomeClosure() {
  const expectedFiles = [
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/styles/base.css",
  "src/app/styles/responsive.css",
  "src/app/styles/sections.css",
  "src/app/styles/testimonial.css",
  "src/components/HoneypotField.tsx",
  "src/components/LeadForm.tsx",
  "src/components/TurnstileWidget.tsx",
  "src/components/analytics/GomegaReviewBridge.tsx",
  "src/components/analytics/GoogleAnalytics.tsx",
  "src/components/analytics/LeadAttribution.tsx",
  "src/components/analytics/MegaSnippet.tsx",
  "src/components/analytics/PostHogProvider.tsx",
  "src/components/analytics/PrimaryRouteOnly.tsx",
  "src/components/consent/ConsentBanner.tsx",
  "src/components/consent/useConsent.ts",
  "src/components/home/ContactCard.tsx",
  "src/components/home/ContactSection.tsx",
  "src/components/home/FocusSection.tsx",
  "src/components/home/HeroActions.tsx",
  "src/components/home/HeroCopy.tsx",
  "src/components/home/HeroSection.tsx",
  "src/components/home/HeroVisual.tsx",
  "src/components/home/InsightsSection.tsx",
  "src/components/home/LandingPage.tsx",
  "src/components/home/ManagedCardCopy.tsx",
  "src/components/home/ProcessSection.tsx",
  "src/components/home/ServiceCard.tsx",
  "src/components/home/ServicesSection.tsx",
  "src/components/home/SiteFooter.tsx",
  "src/components/home/SiteHeader.tsx",
  "src/components/home/TestimonialSection.tsx",
  "src/components/home/ValueGrid.tsx",
  "src/components/lp/constants.ts",
  "src/components/schema/JsonLd.tsx",
  "src/components/schema/builders.ts",
  "src/content/managed-site.contract.json",
  "src/content/managed-site.ts",
  "src/content/pages/home.json",
  "src/content/site.json",
  "src/hooks/useMegaLeadForm.ts",
  "src/lib/consent.ts",
  "src/lib/formatSequenceNumber.ts",
  "src/lib/leadUploads.ts",
  "src/lib/leadValidation.ts",
  "src/lib/megaLeadContext.ts",
  "src/lib/phone.ts",
  "src/lib/posthog-client.ts",
  "src/lib/seo.ts",
  "src/site.config.ts"
];
  const seen = new Set();
  const queue = ["src/app/page.tsx", "src/app/layout.tsx"];
  while (queue.length) {
    const path = queue.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    assert.equal(read(path), original(path, home), path);
    assert.equal(read(path), original(path), path);
    const source = read(path);
    const specs = [...source.matchAll(/(?:from\s*|import\s*|import\s*\(\s*|require\s*\(\s*|@import\s*)["']([^"']+)["']/g)].map((m) => m[1]);
    for (const spec of specs) {
      if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
      const root = spec.startsWith("@/") ? resolve("src", spec.slice(2)) : resolve(dirname(path), spec);
      const candidate = [root, ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css"].map((ext) => root + ext), ...[".ts", ".tsx", ".js", ".jsx"].map((ext) => root + "/index" + ext)].find((p) => existsSync(p) && statSync(p).isFile());
      assert.ok(candidate, `Unresolved Home import ${path}: ${spec}`);
      queue.push(relative(process.cwd(), candidate));
    }
  }
  assert.equal(seen.size, 52);
  assert.deepEqual([...seen].sort(), expectedFiles.sort());
  assert.ok(!seen.has(imageLookup));
  assert.ok(!seen.has(selectedArticle));
}

function assertServicesPreserved() {
  const baseline = original(servicesPage, start);
  assert.equal(baseline, original(servicesPage));
  const sections = [...baseline.matchAll(/        <section\b[\s\S]*?        <\/section>/g)].map((m) => m[0]);
  assert.equal(sections.length, 4);
  let expectedPage = baseline;
  const props = ['{ services, overview }: { services: Services; overview: string }', '{ services }: { services: Services }', '{ services }: { services: Services }', '{ phone, phoneHref }: { phone: string; phoneHref: string }'];
  for (const [i, owner] of owners.entries()) {
    const imports = 'import type { ReactElement } from "react";\n' + (i === 3 ? 'import Link from "next/link";\n' : 'import type { Services } from "./types";\n') + 'import styles from "../services.module.css";\n';
    const body = sections[i].split("\n").map((line) => line.slice(4)).join("\n").replace('<section ', `<section data-section="${frames[i]}" `);
    assert.equal(read(`src/app/services/sections/${owner}.tsx`), imports + `\nexport default function ${owner}(${props[i]}): ReactElement {\n  return (\n` + body + '\n  );\n}\n');
    const attrs = ['services={services} overview={overview}', 'services={services}', 'services={services}', 'phone={phone} phoneHref={phoneHref}'][i];
    expectedPage = expectedPage.replace(sections[i], `        <${owner} ${attrs} />`).replace('import styles from "./services.module.css";', `import ${owner} from "./sections/${owner}";\nimport styles from "./services.module.css";`);
  }
  // Whole-page equality retains metadata, fonts, header, services data, props and order.
  assert.equal(read(servicesPage), expectedPage);
  assert.equal(read('src/app/services/sections/types.ts'), 'export type Services = readonly {\n  readonly id: string;\n  readonly name: string;\n  readonly description: string;\n  readonly role: string;\n}[];\n');
  assert.equal(read(servicesCss), original(servicesCss, start)
    .replace('.selector {\n  padding-top: 56px;', '.selector {\n  padding-top: 56px;\n  padding-bottom: 16px;')
    .replace('.directory {\n  padding-block: 56px;', '.directory {\n  padding-block: 56px 48px;')
    .replace('  .selector {\n    padding-top: 40px;', '  .selector {\n    padding-top: 40px;\n    padding-bottom: 12px;')
    .replace('  .entry,\n  .contactLayout {', '  .directory {\n    padding-bottom: 24px;\n  }\n\n  .entry,\n  .contactLayout {'));
}

// Compare all tracked app/content/assets/package bytes, not just handpicked UI.
test("approved source is untouched outside the exact wiring scope", () => {
  const allowed = new Set([...r4Paths, article, legal, navigation, "src/lib/routes.ts", "scripts/bdc-review-routes.mjs", "scripts/bdc-wiring-test.mjs", thankYou, markdownBody, correctedPost]);
  const changed = changedSince(approved);
  assert.deepEqual(changedSince(start), [...r4Paths].sort());
  assert.deepEqual(changed.filter((path) => !allowed.has(path)), []);
  const r3Paths = [thankYou, markdownBody, correctedPost, "scripts/bdc-wiring-test.mjs"];
  assert.deepEqual(git("diff", "--name-only", r2, start).trim().split("\n").filter(Boolean).sort(), r3Paths.sort());
  assertHomeClosure();
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
  const officeURI = "tel:+13522071074";
  const officeCount = (source) => source.split(officeURI).length - 1;
  const phoneDeltas = files.filter((path) => path.endsWith(".md")).map((path) => ({
    path,
    delta: officeCount(read(path)) - officeCount(original(path)),
  }));
  assert.deepEqual(phoneDeltas, files.filter((path) => path.endsWith(".md")).map((path) => ({
    path,
    delta: path === correctedPost ? 2 : 0,
  })));
  const crmPost = "content/blog/automotive-dealership-crm-buyer-guide.md";
  assert.deepEqual(readFileSync(crmPost), execFileSync("git", ["show", `${approved}:${crmPost}`]));
  assert.equal(officeCount(original(crmPost)), 1, "original authorized CRM office href");
  assert.equal(officeCount(read(crmPost)), 1, "retained authorized CRM office href");
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

  assert.equal(original(selectedArticle, start), original(selectedArticle), "R3 historical selected article baseline");
  assert.equal(read(selectedArticle), original(selectedArticle, start)
    .replace('import styles from "./selected-article.module.css";', 'import styles from "./selected-article.module.css";\nimport { selectedArticleImageSrc } from "./selected-article-images";')
    .replace('<BlogImage src={post.image}', '<BlogImage src={selectedArticleImageSrc(post.slug, post.image)}'));
  const expectedLookup = 'const articleOriginals = ' + JSON.stringify(originals.map(({ slug, sourceUrl, localPath }) => ({ slug, sourceUrl, localPath })), null, 2) + ' as const;\n\nexport function selectedArticleImageSrc(slug: string, image: string): string {\n  return articleOriginals.find((original) => original.slug === slug && original.sourceUrl === image)?.localPath ?? image;\n}\n';
  assert.equal(read(imageLookup), expectedLookup);
  for (const entry of originals) {
    assert.equal(digest(readFileSync(`public${entry.localPath}`)), entry.sha256);
    assert.equal(selectedArticleImageSrc(entry.slug, entry.sourceUrl), entry.localPath);
    assert.equal(selectedArticleImageSrc("changed-slug", entry.sourceUrl), entry.sourceUrl);
    assert.equal(selectedArticleImageSrc(entry.slug, entry.sourceUrl + "?changed"), entry.sourceUrl + "?changed");
    assert.equal(selectedArticleImageSrc(entry.slug, ""), "");
  }
  assertServicesPreserved();
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
  assert.deepEqual([...pages.get("/services").matchAll(/data-section="([^"]+)"/g)].map((m) => m[1]), frames);
  for (const entry of originals) {
    assert.ok(pages.get(`/blog/${entry.slug}`).includes(encodeURIComponent(entry.localPath)), entry.slug);
    const response = await fetch(new URL(entry.localPath, base), { redirect: "manual" });
    assert.equal(response.status, 200);
    assert.equal(digest(Buffer.from(await response.arrayBuffer())), entry.sha256);
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

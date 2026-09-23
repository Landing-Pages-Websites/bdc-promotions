import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const BRIDGE_SOURCE = "https://app.gomega.ai/review-bridge/v7/review-bridge.js";
const BRIDGE_INTEGRITY =
  "sha384-VTUzMpjogRuXFNsE1df8N2HoJyWhNcCkGaUa7aulmDjCmXVoQ4UpQB1xMTrOp3MJ";

function repositoryFile(path) {
  return new URL(`../${path}`, import.meta.url);
}

async function readSource(path) {
  return readFile(repositoryFile(path), "utf8");
}

async function readBinary(path) {
  return readFile(repositoryFile(path));
}

async function readJson(path) {
  return JSON.parse(await readSource(path));
}

function collectResolverPaths(value, paths = new Set()) {
  if (value === null || typeof value !== "object") return paths;
  if (!Array.isArray(value) && value.kind === "json_pointer") {
    paths.add(value.path);
  }
  for (const child of Object.values(value)) collectResolverPaths(child, paths);
  return paths;
}

test("defines the exact structured starter contract and source documents", async () => {
  const [contract, site, home, managedSource] = await Promise.all([
    readJson("src/content/managed-site.contract.json"),
    readJson("src/content/site.json"),
    readJson("src/content/pages/home.json"),
    readSource("src/content/managed-site.ts"),
  ]);

  assert.deepEqual(contract.adapter, { kind: "nextjs", adapterVersion: "1.0" });
  assert.deepEqual(contract.bridge, {
    reviewProtocol: 1,
    editProtocol: 2,
    annotationVersion: 1,
    delivery: {
      version: "v7",
      src: BRIDGE_SOURCE,
      integrity: BRIDGE_INTEGRITY,
      crossOrigin: "anonymous",
      load: "head_defer",
    },
    framing: "authenticated_preview_gateway",
  });
  assert.deepEqual([...collectResolverPaths(contract)].sort(), [
    "src/content/pages/home.json",
    "src/content/site.json",
  ]);
  assert.equal(
    contract.pages.some((page) => page.route?.path === "/"),
    true,
  );
  assert.equal(Array.isArray(home.faq?.items), true);
  assert.equal(typeof home.hero?.image?.sha256, "string");
  assert.equal(typeof site.identity?.displayName, "string");
  assert.match(managedSource, /createManagedSiteNextV1/u);
  assert.match(managedSource, /managed-site\.contract\.json/u);
  assert.match(managedSource, /pages\/home\.json/u);
  assert.match(managedSource, /site\.json/u);
});

test("renders the approved review chooser while preserving managed-site plumbing", async () => {
  const [page, routes, landingPage] = await Promise.all([
    readSource("src/app/page.tsx"),
    readJson("public/review-routes.json"),
    readSource("src/components/home/LandingPage.tsx"),
  ]);

  assert.deepEqual(routes, ["/", "/variant-a", "/variant-b", "/variant-c"]);
  assert.match(page, /href="\/variant-a"/u);
  assert.match(page, /href="\/variant-b"/u);
  assert.match(page, /href="\/variant-c"/u);
  assert.match(page, /Signal Lane/u);
  assert.match(page, /Dealer Field Journal/u);
  assert.match(landingPage, /export function LandingPage/u);
  assert.doesNotMatch(page, /PLACEHOLDER —|TODO_/u);
});

test("binds the image manifest facts to the checked-in hero asset", async () => {
  const home = await readJson("src/content/pages/home.json");
  assert.match(
    home.hero.image.path,
    /^public\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/u,
  );
  const heroAsset = await readBinary(home.hero.image.path);

  assert.equal(home.hero.image.bytes, heroAsset.byteLength);
  assert.equal(
    home.hero.image.sha256,
    createHash("sha256").update(heroAsset).digest("hex"),
  );
});

test("checks operational and structured configuration sentinels", async () => {
  const [checker, packageDocument, siteConfig] = await Promise.all([
    readSource("scripts/check-config.mjs"),
    readJson("package.json"),
    readSource("src/site.config.ts"),
  ]);

  for (const path of ["src/site.config.ts", "src/content"]) {
    assert.ok(checker.includes(path));
  }
  assert.match(checker, /readdirSync/u);
  assert.match(
    packageDocument.scripts.prebuild,
    /check-config.*@landing-pages-websites\/managed-site-contract run build/u,
  );
  assert.match(
    siteConfig,
    /import siteContent from "\.\/content\/site\.json"/u,
  );
  assert.doesNotMatch(siteConfig, /businessName:\s*"TODO_/u);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const sitemapPath = new URL("../src/app/sitemap.ts", import.meta.url);
const robotsPath = new URL("../src/app/robots.ts", import.meta.url);

async function loadMetadataRoute(path, replacements) {
  const source = await readFile(path, "utf8");
  const transformed = Object.entries(replacements).reduce(
    (result, [search, replacement]) => result.replace(search, replacement),
    source,
  );
  const output = ts.transpileModule(transformed, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  return import(`data:text/javascript,${encodeURIComponent(output)}`);
}

test("sitemap gives every registered prelaunch route a weekly crawl default", async () => {
  const siteRoutes = [{ path: "/", priority: 1 }, { path: "/services" }];
  const { default: sitemap } = await loadMetadataRoute(sitemapPath, {
    'import type { MetadataRoute } from "next";': "",
    'import { listPublishedPosts } from "@/lib/blog";': "const listPublishedPosts = () => [];",
    'import { siteRoutes } from "@/lib/routes";': `const siteRoutes = ${JSON.stringify(siteRoutes)};`,
    'import { absoluteUrl } from "@/lib/seo";': 'const absoluteUrl = (path) => `https://preview.example${path}`;',
  });

  const entries = sitemap();

  assert.deepEqual(
    entries.map(({ url, changeFrequency, priority }) => ({ url, changeFrequency, priority })),
    [
      {
        url: "https://preview.example/",
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: "https://preview.example/services",
        changeFrequency: "weekly",
        priority: 0.5,
      },
    ],
  );
  assert.ok(entries.every(({ lastModified }) => lastModified instanceof Date));
});

test("robots permits review crawlers and advertises the sitemap", async () => {
  const { default: robots } = await loadMetadataRoute(robotsPath, {
    'import type { MetadataRoute } from "next";': "",
    'import { absoluteUrl } from "@/lib/seo";': 'const absoluteUrl = (path) => `https://preview.example${path}`;',
  });

  assert.deepEqual(robots(), {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://preview.example/sitemap.xml",
  });
});

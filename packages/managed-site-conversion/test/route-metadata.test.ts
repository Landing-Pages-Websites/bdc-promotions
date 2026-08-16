import assert from "node:assert/strict";
import test from "node:test";

import { isJsonObject } from "../src/json-write.js";
import type { Proposal } from "../src/propose.js";
import { findingsOf, run, seoOf, workspace } from "./support/proposals.js";

/**
 * Internal SEO is per route. A route resolves its own module first and then the
 * layouts that wrap it — genuine Next.js inheritance — and nothing a sibling
 * route declares may ever reach it.
 */

const CONFIG = {
  contentRoot: "src/content",
  assetRoot: "public",
  businessIdentity: {
    legalName: "Fixture Ltd",
    displayName: "Fixture",
    telephone: "+15555550100",
    email: "hello@example.com",
    description: "A fixture business.",
    sameAs: [],
  },
};

function routes(): Proposal {
  return run(workspace("routes", CONFIG));
}

interface ResolutionCase {
  readonly slug: string;
  readonly why: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly index: boolean;
}

/**
 * The `routes` fixture declares a different metadata shape on every route. Each
 * case names the ONE resolution rule it pins down.
 */
const RESOLUTION_CASES: readonly ResolutionCase[] = [
  {
    slug: "home",
    why: "a route that declares both keeps both",
    title: "Home title",
    description: "Home description.",
    index: true,
  },
  {
    slug: "about",
    why: "a field the route omits comes from its layout, not from a sibling",
    title: "About title",
    description: "Layout description.",
    index: true,
  },
  {
    slug: "pricing",
    why: "robots declared on the route override the layout's for that route only",
    title: "Pricing title",
    description: "Pricing description.",
    index: false,
  },
  {
    slug: "blog",
    why: "the nearest layout supplies the title, the root layout the description",
    title: "Blog title",
    description: "Layout description.",
    index: true,
  },
  {
    slug: "contact",
    why: "a route declaring no metadata resolves only what a layout declares",
    title: null,
    description: "Layout description.",
    index: true,
  },
  {
    slug: "legal",
    why: "a declared title the tool cannot read does not inherit its layout's",
    title: null,
    description: "Legal description.",
    index: true,
  },
];

test("every route resolves the metadata of its own chain", () => {
  const proposal = routes();
  for (const expected of RESOLUTION_CASES) {
    const seo = seoOf(proposal, expected.slug);
    assert.deepEqual(seo["title"] ?? null, expected.title, `title: ${expected.why}`);
    assert.deepEqual(
      seo["description"] ?? null,
      expected.description,
      `description: ${expected.why}`,
    );
    const indexing = seo["indexing"];
    assert.ok(isJsonObject(indexing), `indexing missing for ${expected.slug}`);
    assert.equal(indexing["index"], expected.index, `indexing: ${expected.why}`);
  }
});

test("no route is given metadata that only a sibling route declares", () => {
  const proposal = routes();
  const declaredBySiblings = new Set(
    RESOLUTION_CASES.flatMap((entry) => [entry.title, entry.description]).filter(
      (value): value is string => value !== null,
    ),
  );
  for (const expected of RESOLUTION_CASES) {
    const seo = seoOf(proposal, expected.slug);
    const own = new Set([expected.title, expected.description]);
    for (const key of ["title", "description"]) {
      const value = seo[key];
      if (typeof value !== "string") continue;
      assert.ok(
        own.has(value) || !declaredBySiblings.has(value),
        `${expected.slug} resolved '${value}', which belongs to another route`,
      );
    }
  }
});

test("a route that resolves nothing is refused against that route, not another", () => {
  const anchors = findingsOf(routes(), "SEO_INPUT_REQUIRED").map((finding) => finding.anchor);
  assert.ok(anchors.includes("seo:/contact:seo.title"));
  assert.ok(anchors.includes("seo:/legal:seo.title"));
  // Inheritance from a layout is a resolution, never a refusal.
  assert.ok(!anchors.includes("seo:/about:seo.title"));
  assert.ok(!anchors.some((anchor) => anchor?.endsWith(":seo.description")));
});

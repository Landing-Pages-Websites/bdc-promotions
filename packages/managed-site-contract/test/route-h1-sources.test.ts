import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  managedPageH1Fields,
  managedRenderedH1Sources,
  ManagedSiteContractError,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1Compatibility,
} from "../src/index.js";
import {
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";

/**
 * 0.35.0: a route collection's level 1 heading item field that its generated
 * page's outline names at level 1 is that page's H1 only. A page listing the
 * collection renders its items as cards and does not gain or lose an H1 by it.
 * Every other level 1 heading item field still counts wherever its collection
 * renders, and a static outline still cannot name an item field.
 */
type JsonObject = Record<string, unknown>;
type Mutation = (fixture: ContentSemanticsFixture) => void;

const objects = (value: unknown): JsonObject[] => value as JsonObject[];
const object = (value: unknown): JsonObject => value as JsonObject;
const collection = (f: ContentSemanticsFixture): JsonObject =>
  objects(f.contract.collections)[0];
const itemFields = (f: ContentSemanticsFixture): JsonObject[] =>
  objects(collection(f).itemFields);
const values = (f: ContentSemanticsFixture): JsonObject[] =>
  objects(f.content.values);
const generatedSeo = (f: ContentSemanticsFixture): JsonObject =>
  objects(object(f.contract.internalSeo).generatedPages)[0];
const homeSeo = (f: ContentSemanticsFixture): JsonObject =>
  objects(object(f.contract.internalSeo).pages)[0];

let next = 0;
function newFieldId(): string {
  next += 1;
  return `field_zzzzzzzzzzzzzzzzzzzz${String(next).padStart(5, "0")}4`;
}

/** A new level `level` heading item field valued on every item; its id. */
function addItemHeading(f: ContentSemanticsFixture, level = 1): string {
  const original = itemFields(f).find((field) => field.id === f.ids.itemHeadingField)!;
  const id = newFieldId();
  itemFields(f).push({ ...structuredClone(original), id, itemPointer: `/h${next}`, semanticLevel: level });
  for (const value of values(f).filter((entry) => entry.fieldId === f.ids.itemHeadingField)) {
    values(f).push({ ...structuredClone(value), fieldId: id });
  }
  return id;
}

function routeH1(f: ContentSemanticsFixture, fieldId: string): void {
  generatedSeo(f).headingOutline = [{ fieldId, semanticLevel: 1 }];
}

function parsed(f: ContentSemanticsFixture) {
  return {
    contract: parseManagedSiteContractV1(f.contract),
    content: parseManagedSiteContentDocument(f.content),
  };
}

function codeOf(production: ContentSemanticsFixture, candidate: ContentSemanticsFixture): string | null {
  const before = parsed(production);
  const after = parsed(candidate);
  try {
    validateManagedSiteContractV1Compatibility(before.contract, before.content, after.contract, after.content);
    return null;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

/** Production as it was before the collection had a generated page. */
function withoutGeneratedPage(f: ContentSemanticsFixture): void {
  const { ids } = f;
  const routeFields = new Set([
    ids.routeKeyField,
    ids.generatedTitleField,
    ids.generatedDescriptionField,
    ids.generatedCanonicalField,
    ids.generatedIndexingField,
  ]);
  f.contract.pages = objects(f.contract.pages).filter((page) => page.id !== ids.generatedPage);
  object(f.contract.internalSeo).generatedPages = [];
  for (const descriptor of objects(object(f.contract.internalSeo).pages)) {
    const links = object(descriptor.internalLinks);
    links.requiredPageIds = (links.requiredPageIds as string[]).filter((pageId) => pageId !== ids.generatedPage);
  }
  for (const page of objects(f.contract.pages)) {
    for (const section of objects(page.sections)) {
      for (const field of objects(section.fields)) {
        if (Array.isArray(field.usages)) {
          field.usages = objects(field.usages).filter((usage) => usage.pageId !== ids.generatedPage);
        }
      }
    }
  }
  collection(f).itemFields = itemFields(f).filter((field) => !routeFields.has(field.id as string));
  collection(f).uniqueness = objects(collection(f).uniqueness).filter(
    (rule) => !(rule.fieldIds as string[]).some((fieldId) => routeFields.has(fieldId)),
  );
  f.content.values = values(f).filter((value) => !routeFields.has(value.fieldId as string));
}

/**
 * The collection gaining its generated page in the candidate, with whatever
 * else `alsoInCandidate` adds; production holds everything but that page.
 */
function becomingRoute(
  alsoInCandidate: (f: ContentSemanticsFixture) => string,
  inProductionToo: boolean,
): string | null {
  const candidate = contentSemanticsFixture();
  const id = alsoInCandidate(candidate);
  routeH1(candidate, id);
  const production = structuredClone(candidate);
  withoutGeneratedPage(production);
  if (!inProductionToo) {
    collection(production).itemFields = itemFields(production).filter((field) => field.id !== id);
    production.content.values = values(production).filter((value) => value.fieldId !== id);
  }
  return codeOf(production, candidate);
}

function judge(candidate: Mutation, production?: Mutation): string | null {
  const before = contentSemanticsFixture();
  production?.(before);
  const after = structuredClone(before);
  candidate(after);
  return codeOf(before, after);
}

function h1Fields(f: ContentSemanticsFixture, pageId: string): string[] {
  const { contract, content } = parsed(f);
  return [...managedPageH1Fields(contract, content, pageId)].sort();
}

describe("a generated page's own H1 field", () => {
  it("is admitted as a new field, changing no listing page's H1 (All Points Media /work)", () => {
    assert.equal(becomingRoute((f) => addItemHeading(f), false), null);
  });

  it("is the generated page's H1 and not the listing page's", () => {
    const f = contentSemanticsFixture();
    const id = addItemHeading(f);
    routeH1(f, id);
    assert.ok(h1Fields(f, f.ids.generatedPage).includes(id));
    assert.ok(!h1Fields(f, f.ids.homePage).includes(id));
  });

  it("is refused when it was already an H1 source on a listing page", () => {
    // Production counts the existing level 1 item heading on the home page;
    // making it the route H1 would drop an H1 source the contract declared.
    assert.equal(becomingRoute((f) => addItemHeading(f), true), "COMPATIBILITY_PAGE_SEO_CHANGED");
  });

  it("is refused in a static page's outline at level 1", () => {
    assert.equal(
      judge((f) => {
        const id = addItemHeading(f);
        routeH1(f, id);
        homeSeo(f).headingOutline = [{ fieldId: id, semanticLevel: 1 }];
      }),
      "CONTRACT_REFERENCE_SCOPE",
    );
  });

  it("is refused in a static page's outline at any level", () => {
    assert.equal(
      judge((f) => {
        const id = addItemHeading(f);
        routeH1(f, id);
        objects(homeSeo(f).headingOutline).push({ fieldId: id, semanticLevel: 2 });
      }),
      "CONTRACT_REFERENCE_SCOPE",
    );
  });
});

describe("every other level 1 heading item field", () => {
  it("still counts on a page listing a collection with no generated page", () => {
    const f = contentSemanticsFixture();
    object(f.contract.internalSeo).generatedPages = [];
    assert.ok(h1Fields(f, f.ids.homePage).includes(f.ids.itemHeadingField));
  });

  it("still counts on a listing page when the route outline names another", () => {
    const f = contentSemanticsFixture();
    const route = addItemHeading(f);
    routeH1(f, route);
    assert.ok(h1Fields(f, f.ids.homePage).includes(f.ids.itemHeadingField));
  });

  it("is refused when added to a route collection a listing page renders", () => {
    assert.equal(judge((f) => void addItemHeading(f)), "COMPATIBILITY_PAGE_SEO_CHANGED");
  });

  it("is refused when it is a level 2 heading named by the route outline at level 1", () => {
    assert.equal(
      judge((f) => routeH1(f, addItemHeading(f, 2))),
      "CONTRACT_SEO_FIELD_POLICY",
    );
  });
});

/** A second generated page over the same collection, outlining `fieldId` as its H1. */
function addSecondRoute(f: ContentSemanticsFixture, fieldId: string): string {
  const pages = objects(f.contract.pages);
  const original = pages.find((page) => page.id === f.ids.generatedPage)!;
  const pageId = "page_zzzzzzzzzzzzzzzzzzzz000020";
  pages.push({
    ...structuredClone(original),
    id: pageId,
    route: { ...object(original.route), pattern: "/offers/[slug]" },
  });
  const descriptors = objects(object(f.contract.internalSeo).generatedPages);
  descriptors.push({
    ...structuredClone(generatedSeo(f)),
    pageId,
    headingOutline: [{ fieldId, semanticLevel: 1 }],
  });
  for (const page of pages) {
    for (const section of objects(page.sections)) {
      for (const field of objects(section.fields)) {
        const usages = objects(field.usages);
        const onGenerated = usages.filter((usage) => usage.pageId === f.ids.generatedPage);
        usages.push(...onGenerated.map((usage) => ({ ...usage, pageId })));
      }
    }
  }
  return pageId;
}

describe("two generated pages over one collection", () => {
  it("each keeps the H1 field both outlines name", () => {
    const f = contentSemanticsFixture();
    const id = addItemHeading(f);
    routeH1(f, id);
    const second = addSecondRoute(f, id);
    const { contract, content } = parsed(f);
    // Read the rendered sources, not the union with the outline, which names
    // the field on both pages either way.
    const rendered = (pageId: string) => managedRenderedH1Sources(contract, content, pageId).headingFields;
    assert.ok(rendered(f.ids.generatedPage).includes(id), "the first route keeps it");
    assert.ok(rendered(second).includes(id), "the second route keeps it");
    assert.ok(!h1Fields(f, f.ids.homePage).includes(id), "the listing page does not gain it");
  });

  it("refuses one route changing its H1 field while the other keeps it", () => {
    const production = contentSemanticsFixture();
    const id = addItemHeading(production);
    routeH1(production, id);
    addSecondRoute(production, id);
    const candidate = structuredClone(production);
    routeH1(candidate, addItemHeading(candidate));
    // Refused before the H1 rule by the outline comparison; either way the
    // first route's H1 cannot move while the second keeps the old field.
    assert.notEqual(codeOf(production, candidate), null);
  });

  it("admits both routes naming it, unchanged", () => {
    const production = contentSemanticsFixture();
    const id = addItemHeading(production);
    routeH1(production, id);
    addSecondRoute(production, id);
    assert.equal(codeOf(production, structuredClone(production)), null);
  });
});

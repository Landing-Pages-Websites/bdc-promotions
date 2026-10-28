import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  managedCollectionPageIds,
  managedPageCollectionViews,
  managedPageRenderedCollections,
  managedSiteFieldMigrationFromV1,
  validateManagedSiteContractV1MigrationCompatibility,
  managedRenderedH1Sources,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1ContentSemantics,
  validateManagedSiteContractV1JsonSchema,
} from "../src/index.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";

/**
 * 0.39.0: a read-only view. A page shows a code-chosen subset of another
 * collection's items (an industry page's two most relevant case studies) and
 * its cells are those items' own fields, with none of a list's structure.
 * Invariant: every item a view can show is an active item of a page-ordered
 * collection, edited on the view's page only through its own fields.
 */

type JsonObject = Record<string, unknown>;
type Page = { id: string; sections: { id: string; presentation: JsonObject; fields: JsonObject[]; views?: JsonObject[] }[] };

function pagesOf(fixture: ContentSemanticsFixture): Page[] {
  return fixture.contract.pages as Page[];
}

function section(views: readonly string[]): Page["sections"][number] {
  return {
    id: fixtureId("section"),
    presentation: { name: "Related", description: null, group: "Related", order: 80, example: null },
    fields: [],
    views: views.map((collectionId) => ({ collectionId })),
  };
}

/** The fixture with `views` sections added to page `pageIndex` (0 home, which lists the collection; 1 the generated page). */
function withViews(pageIndex: number, ...views: (string | ((fixture: ContentSemanticsFixture) => string))[][]): ContentSemanticsFixture {
  const fixture = contentSemanticsFixture();
  for (const sectionViews of views) {
    const ids = sectionViews.map((view) => (typeof view === "function" ? view(fixture) : view));
    pagesOf(fixture)[pageIndex].sections.push(section(ids));
  }
  return fixture;
}

const ROUTE = (fixture: ContentSemanticsFixture) => fixture.ids.collection;

function judge(fixture: ContentSemanticsFixture): string {
  try {
    validateManagedSiteContractV1ContentSemantics(
      parseManagedSiteContractV1(fixture.contract),
      parseManagedSiteContentDocument(fixture.content),
    );
    return "accepted";
  } catch (error) {
    return error instanceof ManagedSiteContractError ? error.code : String(error);
  }
}

/** A second collection, declared and listed by nothing (no page order, so no active items). */
function withUnlistedCollection(fixture: ContentSemanticsFixture): string {
  const collections = fixture.contract.collections as JsonObject[];
  const copy = structuredClone(collections[0]);
  const id = fixtureId("collection");
  copy.id = id;
  copy.resolver = { kind: "json_pointer", path: "content/site.json", pointer: "/unlisted" };
  copy.uniqueness = [];
  copy.itemFields = (copy.itemFields as JsonObject[])
    .filter((field) => field.type === "plain_text" || field.type === "heading_text")
    .map((field) => ({ ...field, id: fixtureId("field") }));
  collections.push(copy);
  return id;
}

/**
 * A second collection Y with a level 1 heading item field ("Banner"), listed
 * on the home page by its own page field, with one item.
 */
function withListedSecondCollection(level = 1): { fixture: ContentSemanticsFixture; y: string; banner: string } {
  const fixture = contentSemanticsFixture();
  const y = withUnlistedCollection(fixture);
  const collection = (fixture.contract.collections as JsonObject[]).find((one) => one.id === y) as JsonObject;
  const banner = fixtureId("field");
  collection.itemFields = [{
    id: banner,
    type: "heading_text",
    semanticLevel: level,
    classification: "customer_editable",
    capabilities: ["text.edit"],
    itemPointer: "/banner",
    presentation: { name: "Banner", description: null, group: "Related", order: 91, example: null },
    constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
  }];
  const item = fixtureId("item");
  const home = pagesOf(fixture)[0];
  const list = fixtureId("field");
  home.sections[0].fields.push({
    id: list,
    scope: "page",
    type: "collection",
    classification: "customer_editable",
    capabilities: ["collection.reorder"],
    resolver: { kind: "json_pointer", path: "content/site.json", pointer: "/related/order" },
    usages: [{ pageId: home.id, itemId: null }],
    presentation: { name: "Related", description: null, group: "Related", order: 92, example: null },
    collectionId: y,
  });
  const values = fixture.content.values as JsonObject[];
  values.push({ fieldId: list, owner: { kind: "page", pageId: home.id }, type: "collection", value: { orderedItemIds: [item] } });
  values.push({ fieldId: banner, owner: { kind: "collection_item", collectionId: y, itemId: item }, type: "heading_text", value: "Banner" });
  return { fixture, y, banner };
}

describe("a view's declaration", () => {
  const cases: readonly [string, () => ContentSemanticsFixture, string][] = [
    ["the generated page viewing the collection the home page lists", () => withViews(1, [ROUTE]), "accepted"],
    [
      "the generated page viewing another collection the home page lists (APM's industry pages)",
      () => {
        const { fixture, y } = withListedSecondCollection();
        pagesOf(fixture)[1].sections.push(section([y]));
        return fixture;
      },
      "accepted",
    ],
    ["the home page viewing the collection it already lists", () => withViews(0, [ROUTE]), "CONTRACT_COLLECTION_VIEW"],
    ["one page viewing a collection twice, in two sections", () => withViews(1, [ROUTE], [ROUTE]), "CONTRACT_COLLECTION_VIEW"],
    ["one section viewing a collection twice", () => withViews(1, [ROUTE, ROUTE]), "CONTRACT_COLLECTION_VIEW"],
    ["a view of an undeclared collection", () => withViews(1, [() => fixtureId("collection")]), "CONTRACT_REFERENCE_UNRESOLVED"],
    ["a view of a collection no page lists", () => withViews(1, [withUnlistedCollection]), "CONTRACT_COLLECTION_VIEW"],
    ["a view naming a field id", () => withViews(1, [(fixture) => fixture.ids.titleField]), "rejected"],
  ];
  for (const [name, build, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : `refuses (${expected})`} ${name}`, () => {
      const verdict = judge(build());
      if (expected === "rejected") assert.notEqual(verdict, "accepted");
      else assert.equal(verdict, expected);
    });
  }

  it("refuses an empty views list (absent is no view: one meaning, one form)", () => {
    const fixture = contentSemanticsFixture();
    pagesOf(fixture)[1].sections.push({ ...section([]), views: [] });
    assert.notEqual(judge(fixture), "accepted");
  });

  it("refuses a view with an extra key", () => {
    const fixture = contentSemanticsFixture();
    pagesOf(fixture)[1].sections.push({ ...section([]), views: [{ collectionId: fixture.ids.collection, capabilities: ["collection.add"] }] });
    assert.notEqual(judge(fixture), "accepted");
  });

  it("refuses a view of a list inside an item", () => {
    const fixture = withViews(1);
    const nested = withUnlistedCollection(fixture);
    const collections = fixture.contract.collections as JsonObject[];
    (collections[0].itemFields as JsonObject[]).push({
      id: fixtureId("field"),
      type: "collection",
      classification: "customer_editable",
      capabilities: ["collection.reorder"],
      itemPointer: "/related",
      presentation: { name: "Related", description: null, group: "Related", order: 90, example: null },
      collectionId: nested,
    });
    pagesOf(fixture)[1].sections.push(section([nested]));
    assert.throws(
      () => parseManagedSiteContractV1(fixture.contract) && validateManagedSiteContractV1ContentSemantics(parseManagedSiteContractV1(fixture.contract), parseManagedSiteContentDocument(fixture.content)),
      (error: unknown) => error instanceof ManagedSiteContractError && error.code === "CONTRACT_COLLECTION_VIEW",
    );
  });

  it("the JSON Schema admits a view, as zod does, and refuses an empty list", () => {
    assert.equal(validateManagedSiteContractV1JsonSchema(withViews(1, [ROUTE]).contract).valid, true);
    const empty = contentSemanticsFixture();
    pagesOf(empty)[1].sections.push({ ...section([]), views: [] });
    assert.equal(validateManagedSiteContractV1JsonSchema(empty.contract).valid, false);
  });
});

describe("where a collection's items render", () => {
  it("adds the viewing page to the pages its items render on", () => {
    const fixture = withViews(1, [ROUTE]);
    const contract = parseManagedSiteContractV1(fixture.contract);
    const [home, generated] = pagesOf(fixture);
    assert.deepEqual(managedPageCollectionViews(contract, generated.id), [fixture.ids.collection]);
    assert.deepEqual(managedPageCollectionViews(contract, home.id), []);
    assert.deepEqual(managedCollectionPageIds(contract, fixture.ids.collection), [home.id, generated.id].sort());
  });

  it("counts a viewed collection's level 1 heading on the viewing page, and only while it views it", () => {
    const { fixture, y, banner } = withListedSecondCollection();
    const generated = pagesOf(fixture)[1].id;
    const sources = (built: ContentSemanticsFixture) =>
      managedRenderedH1Sources(parseManagedSiteContractV1(built.contract), parseManagedSiteContentDocument(built.content), generated).headingFields;
    assert.equal(sources(fixture).includes(banner), false, "control: not rendered there before the view");
    pagesOf(fixture)[1].sections.push(section([y]));
    assert.equal(judge(fixture), "accepted");
    assert.equal(sources(fixture).includes(banner), true);
  });

  it("does not count another route's H1 on a page that only views its collection", () => {
    const { fixture } = withListedSecondCollection();
    const home = pagesOf(fixture)[0].id;
    // The home page lists the route collection; its route H1 is no H1 source there (0.35.0), and a view changes nothing.
    const contract = parseManagedSiteContractV1(fixture.contract);
    const routeH1 = fixture.ids.itemHeadingField;
    assert.equal(managedRenderedH1Sources(contract, parseManagedSiteContentDocument(fixture.content), home).headingFields.includes(routeH1), false);
  });
});

describe("what renders where is one rule, read both ways", () => {
  it("managedCollectionPageIds is the inverse of managedPageRenderedCollections over lists, views, routes and nested lists", () => {
    const { fixture, y } = withListedSecondCollection();
    pagesOf(fixture)[1].sections.push(section([y]));
    const contract = parseManagedSiteContractV1(fixture.contract);
    for (const collection of contract.collections) {
      const pages = managedCollectionPageIds(contract, collection.id);
      for (const page of contract.pages) {
        assert.equal(pages.includes(page.id), managedPageRenderedCollections(contract, page.id).has(collection.id), `${collection.id} on ${page.id}`);
      }
    }
    assert.deepEqual(managedCollectionPageIds(contract, y), [pagesOf(fixture)[0].id, pagesOf(fixture)[1].id].sort());
  });
});

describe("a code change may add or drop a view", () => {
  function compatible(production: ContentSemanticsFixture, candidate: ContentSemanticsFixture): string {
    try {
      validateManagedSiteContractV1Compatibility(
        parseManagedSiteContractV1(production.contract),
        parseManagedSiteContentDocument(production.content),
        parseManagedSiteContractV1(candidate.contract),
        parseManagedSiteContentDocument(candidate.content),
      );
      return "compatible";
    } catch (error) {
      return error instanceof ManagedSiteContractError ? error.code : String(error);
    }
  }

  it("admits adding one and dropping one: a view holds no value", () => {
    const withView = withViews(1, [ROUTE]);
    const without = structuredClone(withView);
    delete (pagesOf(without)[1].sections.at(-1) as { views?: unknown }).views;
    assert.equal(compatible(without, withView), "compatible");
    assert.equal(compatible(withView, without), "compatible");
  });
});

describe("retiring a viewed collection", () => {
  /**
   * Production views Y from the generated page; the candidate retires Y and
   * handles the view as `view` says: drops it, keeps it naming Y, or repoints
   * it to the route collection X (another page-listed collection).
   */
  function retireY(view: boolean | "repoint"): string {
    const dropView = view === true;
    // A level 2 banner: whether a page keeps its H1 is another rule's.
    const { fixture, y, banner } = withListedSecondCollection(2);
    pagesOf(fixture)[1].sections.push(section([y]));
    const production = structuredClone(fixture);
    const candidate = structuredClone(fixture);
    const home = pagesOf(candidate)[0];
    const list = home.sections[0].fields.find((field) => field.collectionId === y) as JsonObject;
    home.sections[0].fields = home.sections[0].fields.filter((field) => field !== list);
    if (dropView) delete pagesOf(candidate)[1].sections.at(-1)?.views;
    if (view === "repoint") (pagesOf(candidate)[1].sections.at(-1) as Page["sections"][number]).views = [{ collectionId: fixture.ids.collection }];
    candidate.contract.collections = (candidate.contract.collections as JsonObject[]).filter((one) => one.id !== y);
    const item = ((production.content.values as JsonObject[]).find((one) => one.fieldId === banner)?.owner as JsonObject).itemId as string;
    (candidate.contract.tombstonedIds as string[]).push(y, list.id as string, banner, item);
    candidate.content.values = (candidate.content.values as JsonObject[]).filter((one) => one.fieldId !== list.id && one.fieldId !== banner);
    const productionContract = parseManagedSiteContractV1(production.contract);
    const productionContent = parseManagedSiteContentDocument(production.content);
    try {
      validateManagedSiteContractV1MigrationCompatibility(
        productionContract,
        productionContent,
        parseManagedSiteContractV1(candidate.contract),
        parseManagedSiteContentDocument(candidate.content),
        { schemaVersion: "1.0", from: managedSiteFieldMigrationFromV1(productionContract, productionContent), steps: [{ op: "retire", collections: [y] }] },
        { admitBridge: () => true },
      );
      return "migrated";
    } catch (error) {
      return error instanceof ManagedSiteContractError ? error.code : String(error);
    }
  }

  it("takes the view with the collection in one migration", () => assert.equal(retireY(true), "migrated"));
  it("refuses a candidate that keeps a view of the retired collection", () => assert.notEqual(retireY(false), "migrated"));
  it("refuses a candidate that repoints the retired collection's view to another collection", () =>
    assert.equal(retireY("repoint"), "MIGRATION_RETIRE_REFERENCED"));
});

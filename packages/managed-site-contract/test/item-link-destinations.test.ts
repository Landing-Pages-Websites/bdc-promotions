import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  managedGeneratedRoutePath,
  managedRichTextLinkAttributesV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContentValue,
  parseManagedSiteContractV1,
  validateManagedSiteContentDocumentJsonSchema,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import {
  addSecondFixtureCollectionUsingItem,
  addSecondFixtureItem,
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";
import { contentDocument, stableId } from "./schema-fixtures.js";

/**
 * 0.25.0: an internal destination may name one item of a generated page
 * ("Networks > Healthcare"). Invariant: an internal destination names exactly
 * one path. A static page takes no item; a generated page takes exactly one,
 * and it is an active item of the collection that page's route iterates.
 */

type JsonObject = Record<string, unknown>;
type Mutation = (fixture: ContentSemanticsFixture) => void;

function verdict(mutate: Mutation): string {
  const fixture = contentSemanticsFixture();
  mutate(fixture);
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

function valueOf(fixture: ContentSemanticsFixture, fieldId: string, itemId?: string): JsonObject {
  const value = (fixture.content.values as JsonObject[]).find(
    (one) =>
      one.fieldId === fieldId &&
      (itemId === undefined || (one.owner as JsonObject).itemId === itemId),
  );
  if (value === undefined) throw new Error(`fixture lost ${fieldId}`);
  return value;
}

function fieldDestination(fixture: ContentSemanticsFixture): JsonObject {
  return (valueOf(fixture, fixture.ids.linkField).value as JsonObject).destination as JsonObject;
}

function itemFieldDestination(fixture: ContentSemanticsFixture): JsonObject {
  const value = valueOf(fixture, fixture.ids.itemLinkField, fixture.ids.item);
  return (value.value as JsonObject).destination as JsonObject;
}

function markDestination(fixture: ContentSemanticsFixture): JsonObject {
  const value = valueOf(fixture, fixture.ids.richField);
  const paragraph = ((value.value as JsonObject).content as JsonObject[])[0] as JsonObject;
  const marks = ((paragraph.content as JsonObject[])[0] as JsonObject).marks as JsonObject[];
  const link = marks.find((mark) => mark.type === "link");
  if (link === undefined) throw new Error("fixture lost its link mark");
  return link.destination as JsonObject;
}

function toItem(destination: JsonObject, pageId: string, itemId: unknown): void {
  destination.pageId = pageId;
  destination.itemId = itemId;
}

const DESTINATIONS = [
  ["a link field", fieldDestination, "CONTENT_LINK"],
  ["an item's own link field", itemFieldDestination, "CONTENT_LINK"],
  ["a prose link mark", markDestination, "CONTENT_RICH_TEXT_LINK"],
] as const;

describe("an internal destination names exactly one path", () => {
  for (const [name, destinationOf, prefix] of DESTINATIONS) {
    const cases: readonly [string, Mutation, string][] = [
      ["a static page with no item", () => undefined, "accepted"],
      ["an active item of the generated page", (f) => toItem(destinationOf(f), f.ids.generatedPage, f.ids.item), "accepted"],
      [
        "a second active item of the generated page",
        (f) => toItem(destinationOf(f), f.ids.generatedPage, addSecondFixtureItem(f)),
        "accepted",
      ],
      ["the generated page with no item", (f) => void (destinationOf(f).pageId = f.ids.generatedPage), `${prefix}_PAGE_UNPATHED`],
      ["a static page with an item", (f) => toItem(destinationOf(f), f.ids.homePage, f.ids.item), `${prefix}_ITEM_SCOPE`],
      [
        "an item no collection holds",
        (f) => toItem(destinationOf(f), f.ids.generatedPage, fixtureId("item")),
        `${prefix}_ITEM_UNRESOLVED`,
      ],
      [
        "a tombstoned item",
        (f) => {
          const removed = fixtureId("item");
          (f.contract.tombstonedIds as string[]).push(removed);
          toItem(destinationOf(f), f.ids.generatedPage, removed);
        },
        `${prefix}_ITEM_UNRESOLVED`,
      ],
      [
        "an active item of another collection",
        (f) => {
          const other = fixtureId("item");
          addSecondFixtureCollectionUsingItem(f, other);
          toItem(destinationOf(f), f.ids.generatedPage, other);
        },
        `${prefix}_ITEM_SCOPE`,
      ],
      [
        "a static page with an item of another collection",
        (f) => {
          const other = fixtureId("item");
          addSecondFixtureCollectionUsingItem(f, other);
          toItem(destinationOf(f), f.ids.homePage, other);
        },
        `${prefix}_ITEM_SCOPE`,
      ],
      ["a page no contract declares, with an item", (f) => toItem(destinationOf(f), fixtureId("page"), f.ids.item), "CONTENT_LINK_PAGE_UNRESOLVED"],
    ];
    for (const [caseName, mutate, expected] of cases) {
      it(`${name} to ${caseName}: ${expected}`, () => {
        assert.equal(verdict(mutate), expected);
      });
    }
  }

  it("removing the item a link names refuses the content, not only the link", () => {
    const code = verdict((f) => {
      const second = addSecondFixtureItem(f);
      toItem(fieldDestination(f), f.ids.generatedPage, second);
      const collection = valueOf(f, f.ids.collectionField).value as { orderedItemIds: string[] };
      collection.orderedItemIds = collection.orderedItemIds.filter((id) => id !== second);
      f.content.values = (f.content.values as JsonObject[]).filter(
        (value) => (value.owner as JsonObject).itemId !== second,
      );
    });
    assert.equal(code, "CONTENT_LINK_ITEM_UNRESOLVED");
  });
});

function linkValue(destination: JsonObject): JsonObject {
  return {
    fieldId: stableId("field"),
    owner: { kind: "page", pageId: stableId("page") },
    type: "link",
    value: { label: "Healthcare", destination, target: "same_window" },
  };
}

describe("the itemId member has one spelling", () => {
  const page = stableId("page");
  const cases: readonly [string, JsonObject, "accepted" | "rejected"][] = [
    ["absent", { kind: "internal", pageId: page, fragment: null }, "accepted"],
    ["an item id", { kind: "internal", pageId: page, itemId: stableId("item"), fragment: null }, "accepted"],
    ["an item id with a fragment", { kind: "internal", pageId: page, itemId: stableId("item"), fragment: "team" }, "accepted"],
    ["null", { kind: "internal", pageId: page, itemId: null, fragment: null }, "rejected"],
    ["an empty string", { kind: "internal", pageId: page, itemId: "", fragment: null }, "rejected"],
    ["a page id", { kind: "internal", pageId: page, itemId: stableId("page"), fragment: null }, "rejected"],
    ["a collection id", { kind: "internal", pageId: page, itemId: stableId("collection"), fragment: null }, "rejected"],
    ["an uppercase item id", { kind: "internal", pageId: page, itemId: stableId("item").toUpperCase(), fragment: null }, "rejected"],
    ["a padded item id", { kind: "internal", pageId: page, itemId: ` ${stableId("item")}`, fragment: null }, "rejected"],
    ["a number", { kind: "internal", pageId: page, itemId: 7, fragment: null }, "rejected"],
    ["on an external destination", { kind: "external", url: "https://example.com/", itemId: stableId("item") }, "rejected"],
  ];
  for (const [name, destination, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}, in zod and the JSON Schema alike`, () => {
      const value = linkValue(destination);
      let zod: string;
      try {
        parseManagedSiteContentValue(value);
        zod = "accepted";
      } catch {
        zod = "rejected";
      }
      const schema = validateManagedSiteContentDocumentJsonSchema({ ...contentDocument(), values: [value] }).valid
        ? "accepted"
        : "rejected";
      assert.deepEqual([zod, schema], [expected, expected]);
    });
  }
});

describe("managedGeneratedRoutePath fills the one parameter", () => {
  const filled: readonly [string, string, string][] = [
    ["/networks/[slug]", "healthcare", "/networks/healthcare"],
    ["/[slug]", "about-us", "/about-us"],
    ["/work/[slug]/case-study", "acme-2024", "/work/acme-2024/case-study"],
    ["/a/[key]", "x".repeat(200), `/a/${"x".repeat(200)}`],
  ];
  for (const [pattern, key, path] of filled) {
    it(`${pattern} and ${key.slice(0, 20)} give ${path.slice(0, 30)}`, () => {
      assert.equal(managedGeneratedRoutePath(pattern, key), path);
    });
  }
  const refused: readonly [string, string, string][] = [
    ["/networks", "healthcare", "GENERATED_ROUTE_PATTERN"],
    ["/networks/[a]/[b]", "healthcare", "GENERATED_ROUTE_PATTERN"],
    ["networks/[slug]", "healthcare", "GENERATED_ROUTE_PATTERN"],
    ["/networks/[slug]", "", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "Health", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "health care", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "health/care", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "../admin", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "-health", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "health--care", "GENERATED_ROUTE_KEY"],
    ["/networks/[slug]", "x".repeat(201), "GENERATED_ROUTE_KEY"],
  ];
  for (const [pattern, key, code] of refused) {
    it(`refuses ${pattern} with ${JSON.stringify(key.slice(0, 20))}: ${code}`, () => {
      assert.throws(
        () => managedGeneratedRoutePath(pattern, key),
        (error: unknown) => error instanceof ManagedSiteContractError && error.code === code,
      );
    });
  }
});

describe("a prose link to an item renders through the item resolver only", () => {
  const page = stableId("page");
  const item = stableId("item");
  const toItemMark = {
    type: "link" as const,
    destination: { kind: "internal" as const, pageId: page, itemId: item, fragment: "team" },
    target: "same_window" as const,
  };
  const toPageMark = {
    type: "link" as const,
    destination: { kind: "internal" as const, pageId: page, fragment: null },
    target: "same_window" as const,
  };
  const pagePath = (): string => "/networks";
  const itemPath = (pageId: string, itemId: string): string =>
    pageId === page && itemId === item ? "/networks/healthcare" : "/wrong";

  it("an item link takes the item's path and keeps its fragment", () => {
    assert.equal(managedRichTextLinkAttributesV1(toItemMark, pagePath, itemPath).href, "/networks/healthcare#team");
  });

  it("an item link given only a page resolver fails rather than linking the pattern's page", () => {
    assert.throws(
      () => managedRichTextLinkAttributesV1(toItemMark, pagePath),
      (error: unknown) => error instanceof ManagedSiteContractError && error.code === "RICH_TEXT_LINK_UNRESOLVED",
    );
  });

  it("a page link never consults the item resolver", () => {
    assert.equal(managedRichTextLinkAttributesV1(toPageMark, pagePath, itemPath).href, "/networks");
    assert.throws(
      () => managedRichTextLinkAttributesV1(toPageMark, undefined, itemPath),
      (error: unknown) => error instanceof ManagedSiteContractError && error.code === "RICH_TEXT_LINK_UNRESOLVED",
    );
  });
});

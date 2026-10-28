import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  parseManagedCollectionDescriptor,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import {
  addSecondFixtureItem,
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";

/**
 * 0.27.0: a list inside an item. An item field of type `collection` lists
 * another collection's items, each parent item its own ordered list.
 *
 * Invariant: every item of a nested collection sits in exactly one list, of
 * exactly one parent item, of the one item field that lists the collection; a
 * nested collection lists nothing itself and is listed by nothing else.
 */

type JsonObject = Record<string, unknown>;
type Mutation = (fixture: NestedFixture) => void;

interface NestedFixture extends ContentSemanticsFixture {
  readonly nested: {
    readonly collection: string;
    readonly listField: string;
    readonly textField: string;
    readonly firstChild: string;
    readonly secondChild: string;
  };
}

function presentation(name: string, order: number): JsonObject {
  return { name, description: null, group: "Nested", order, example: null };
}

function collections(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.contract.collections as JsonObject[];
}

function collectionById(fixture: ContentSemanticsFixture, id: string): JsonObject {
  const found = collections(fixture).find((one) => one.id === id);
  if (found === undefined) throw new Error(`fixture lost collection ${id}`);
  return found;
}

function values(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.content.values as JsonObject[];
}

function childOwner(fixture: NestedFixture, itemId: string): JsonObject {
  return { kind: "collection_item", collectionId: fixture.nested.collection, itemId };
}

function parentOwner(fixture: ContentSemanticsFixture, itemId: string): JsonObject {
  return { kind: "collection_item", collectionId: fixture.ids.collection, itemId };
}

function listValue(fixture: NestedFixture, parentItemId: string): JsonObject {
  const value = values(fixture).find(
    (one) => one.fieldId === fixture.nested.listField && (one.owner as JsonObject).itemId === parentItemId,
  );
  if (value === undefined) throw new Error("fixture lost a list");
  return value.value as JsonObject;
}

function addChild(fixture: NestedFixture, text: string): string {
  const itemId = fixtureId("item");
  values(fixture).push({ fieldId: fixture.nested.textField, owner: childOwner(fixture, itemId), type: "plain_text", value: text });
  return itemId;
}

function listField(id: string, collectionId: string): JsonObject {
  return {
    id,
    type: "collection",
    classification: "customer_editable",
    capabilities: ["collection.reorder", "collection.add", "collection.remove"],
    itemPointer: "/highlights",
    presentation: presentation("Highlights", 40),
    collectionId,
  };
}

/**
 * The content-semantics fixture with a "highlights" list inside every item of
 * its routed collection: one parent item holding two highlights.
 */
function nestedFixture(): NestedFixture {
  const base = contentSemanticsFixture();
  const ids = {
    collection: fixtureId("collection"),
    listField: fixtureId("field"),
    textField: fixtureId("field"),
  };
  collections(base).push({
    id: ids.collection,
    presentation: presentation("Highlight", 41),
    resolver: { kind: "json_pointer", path: "content/site.json", pointer: "/highlights" },
    itemIdPointer: "/id",
    itemIdPolicy: "server_minted",
    minItems: 0,
    maxItems: 3,
    itemFields: [{
      id: ids.textField,
      type: "plain_text",
      classification: "customer_editable",
      capabilities: ["text.edit"],
      itemPointer: "/text",
      presentation: presentation("Highlight text", 42),
      semantic: "body",
      constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
    }],
    uniqueness: [{ fieldIds: [ids.textField], comparison: "case_folded" }],
    deletion: { whenReferenced: "cascade", restorable: false },
  });
  (collectionById(base, base.ids.collection).itemFields as JsonObject[]).push(listField(ids.listField, ids.collection));
  const fixture = { ...base, nested: { ...ids, firstChild: "", secondChild: "" } };
  const firstChild = addChild(fixture, "Hospital waiting rooms");
  const secondChild = addChild(fixture, "Pharmacy screens");
  values(fixture).push({
    fieldId: ids.listField,
    owner: parentOwner(fixture, fixture.ids.item),
    type: "collection",
    value: { orderedItemIds: [firstChild, secondChild] },
  });
  return { ...fixture, nested: { ...ids, firstChild, secondChild } };
}

/** A second parent item, holding its own list of the given highlights. */
function secondParent(fixture: NestedFixture, children: readonly string[]): string {
  const parent = addSecondFixtureItem(fixture);
  const copied = values(fixture).find(
    (one) => one.fieldId === fixture.nested.listField && (one.owner as JsonObject).itemId === parent,
  );
  if (copied === undefined) throw new Error("second item lost its list");
  copied.value = { orderedItemIds: [...children] };
  return parent;
}

function verdict(mutate: Mutation): string {
  const fixture = nestedFixture();
  mutate(fixture);
  try {
    validateManagedSiteContractV1ContentSemantics(
      parseManagedSiteContractV1(fixture.contract),
      parseManagedSiteContentDocument(fixture.content),
    );
    return "accepted";
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    return `unexpected ${String(error)}`;
  }
}

const NESTED = "CONTRACT_NESTED_COLLECTION";

describe("a list inside an item: contract", () => {
  const cases: readonly [string, Mutation, string][] = [
    ["one parent item's list", () => undefined, "accepted"],
    ["a list the editor may only reorder", (f) => {
      const field = (collectionById(f, f.ids.collection).itemFields as JsonObject[]).find((one) => one.id === f.nested.listField) as JsonObject;
      field.capabilities = ["collection.reorder"];
    }, "accepted"],
    ["the nested collection listed by a second item field", (f) => {
      (collectionById(f, f.ids.collection).itemFields as JsonObject[]).push({ ...listField(fixtureId("field"), f.nested.collection), itemPointer: "/more" });
    }, NESTED],
    ["the nested collection also listed by a page", (f) => {
      const page = (f.contract.pages as JsonObject[])[0] as JsonObject;
      const section = (page.sections as JsonObject[])[0] as JsonObject;
      const pageField = fixtureId("field");
      (section.fields as JsonObject[]).push({
        id: pageField,
        scope: "page",
        type: "collection",
        classification: "customer_editable",
        capabilities: ["collection.reorder"],
        resolver: { kind: "json_pointer", path: "content/site.json", pointer: "/highlightOrder" },
        usages: [{ pageId: f.ids.homePage, itemId: null }],
        presentation: presentation("All highlights", 43),
        collectionId: f.nested.collection,
      });
    }, NESTED],
    ["an item field listing its own collection", (f) => {
      const field = (collectionById(f, f.ids.collection).itemFields as JsonObject[]).find((one) => one.id === f.nested.listField) as JsonObject;
      field.collectionId = f.ids.collection;
    }, NESTED],
    ["a nested collection listing a collection itself", (f) => {
      const grandchild = fixtureId("collection");
      collections(f).push({ ...structuredClone(collectionById(f, f.nested.collection)), id: grandchild, itemFields: [{ ...(collectionById(f, f.nested.collection).itemFields as JsonObject[])[0], id: fixtureId("field") }], uniqueness: [], resolver: { kind: "json_pointer", path: "content/site.json", pointer: "/deeper" } });
      (collectionById(f, f.nested.collection).itemFields as JsonObject[]).push({ ...listField(fixtureId("field"), grandchild), itemPointer: "/deeper" });
    }, NESTED],
    ["the routed collection nested in another", (f) => {
      (collectionById(f, f.nested.collection).itemFields as JsonObject[]).push({ ...listField(fixtureId("field"), f.ids.collection), itemPointer: "/services" });
    }, NESTED],
  ];
  for (const [name, mutate, expected] of cases) {
    it(`${name}: ${expected}`, () => assert.equal(verdict(mutate), expected));
  }

  it("refuses an undeclared nested collection", () => {
    const code = verdict((f) => {
      const field = (collectionById(f, f.ids.collection).itemFields as JsonObject[]).find((one) => one.id === f.nested.listField) as JsonObject;
      field.collectionId = fixtureId("collection");
    });
    assert.notEqual(code, "accepted");
  });

  it("refuses a list field claiming text or link capabilities", () => {
    for (const capabilities of [["text.edit"], ["link.label.edit"], []]) {
      const descriptor = structuredClone(collectionById(nestedFixture(), contentSemanticsFixture().ids.collection));
      (descriptor.itemFields as JsonObject[]).push({ ...listField(fixtureId("field"), fixtureId("collection")), capabilities });
      assert.throws(() => parseManagedCollectionDescriptor(descriptor), `capabilities ${JSON.stringify(capabilities)}`);
    }
  });
});

describe("a list inside an item: content", () => {
  const cases: readonly [string, Mutation, string][] = [
    ["two parent items, each with its own list", (f) => void secondParent(f, [addChild(f, "Clinics")]), "accepted"],
    ["a second parent with an empty list", (f) => void secondParent(f, []), "accepted"],
    ["the same words in two parents' lists", (f) => void secondParent(f, [addChild(f, "Hospital waiting rooms")]), "accepted"],
    ["a list reordered", (f) => void listValue(f, f.ids.item).orderedItemIds.reverse(), "accepted"],

    ["one highlight in two parents' lists", (f) => void secondParent(f, [f.nested.firstChild]), "CONTENT_NESTED_ITEM_SHARED"],
    ["a highlight twice in one list", (f) => {
      listValue(f, f.ids.item).orderedItemIds = [f.nested.firstChild, f.nested.firstChild, f.nested.secondChild];
    }, "CONTENT_COLLECTION_POLICY"],
    ["a list over its collection's maximum", (f) => {
      const ids = listValue(f, f.ids.item).orderedItemIds as string[];
      ids.push(addChild(f, "Gyms"), addChild(f, "Malls"));
    }, "CONTENT_COLLECTION_POLICY"],
    ["a highlight in no list", (f) => {
      listValue(f, f.ids.item).orderedItemIds = [f.nested.firstChild];
    }, "CONTENT_ITEM_ORPHAN"],
    ["a listed highlight missing its text", (f) => {
      f.content.values = values(f).filter((one) => (one.owner as JsonObject).itemId !== f.nested.secondChild);
    }, "CONTENT_ITEM_VALUE_MISSING"],
    ["a parent item missing its list", (f) => {
      f.content.values = values(f).filter((one) => one.fieldId !== f.nested.listField);
    }, "CONTENT_ITEM_ORPHAN"],
    ["two highlights with the same words in one list", (f) => {
      const twin = addChild(f, "hospital WAITING rooms");
      (listValue(f, f.ids.item).orderedItemIds as string[]).push(twin);
    }, "CONTENT_COLLECTION_UNIQUENESS"],
    ["a list naming an item of the parent collection", (f) => {
      (listValue(f, f.ids.item).orderedItemIds as string[]).push(f.ids.item);
    }, "CONTENT_ITEM_COLLECTION_CONFLICT"],
    ["a list owned by a page", (f) => {
      const value = values(f).find((one) => one.fieldId === f.nested.listField) as JsonObject;
      value.owner = { kind: "page", pageId: f.ids.homePage };
    }, "CONTENT_OWNER_SCOPE"],
    ["a list owned by a highlight", (f) => {
      const value = values(f).find((one) => one.fieldId === f.nested.listField) as JsonObject;
      value.owner = childOwner(f, f.nested.firstChild);
    }, "CONTENT_OWNER_SCOPE"],
    ["a list holding a text value", (f) => {
      const value = values(f).find((one) => one.fieldId === f.nested.listField) as JsonObject;
      value.type = "plain_text";
      value.value = "x";
    }, "CONTENT_VALUE_POLICY"],
    ["a link to a highlight as if it were a page", (f) => {
      const link = values(f).find((one) => one.fieldId === f.ids.linkField) as JsonObject;
      const destination = (link.value as JsonObject).destination as JsonObject;
      destination.pageId = f.ids.generatedPage;
      destination.itemId = f.nested.firstChild;
    }, "CONTENT_LINK_ITEM_SCOPE"],
  ];
  for (const [name, mutate, expected] of cases) {
    it(`${name}: ${expected}`, () => assert.equal(verdict(mutate), expected));
  }
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1Compatibility,
} from "../src/index.js";
import {
  addSecondFixtureItem,
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";
import { isCompatibilityCollectionWidened } from "../src/contract-compatibility-constraints.js";

let nextField = 0;
/** A field id no fixture mints (the fixtures' own counter restarts per fixture). */
function newFieldId(): string {
  nextField += 1;
  return `field_zzzzzzzzzzzzzzzzzzzz${String(nextField).padStart(5, "0")}0`;
}

/**
 * 0.33.0: a collection may gain a uniqueness rule when it can narrow nothing
 * a customer holds or can write: every field the rule names is new in the
 * candidate and internal_protected, and no customer can create an item. This
 * is how an existing collection becomes a generated route's collection (its
 * route key is a new protected `route.slug` with an exact unique rule) without
 * a retire, which would lose its item ids.
 */
type JsonObject = Record<string, unknown>;
type Mutation = (fixture: ContentSemanticsFixture) => void;

const objects = (value: unknown): JsonObject[] => value as JsonObject[];
const object = (value: unknown): JsonObject => value as JsonObject;
const collection = (fixture: ContentSemanticsFixture): JsonObject =>
  objects(fixture.contract.collections)[0];
const itemFields = (fixture: ContentSemanticsFixture): JsonObject[] =>
  objects(collection(fixture).itemFields);
const values = (fixture: ContentSemanticsFixture): JsonObject[] =>
  objects(fixture.content.values);
const uniqueness = (fixture: ContentSemanticsFixture): JsonObject[] =>
  objects(collection(fixture).uniqueness);
const pageFields = (fixture: ContentSemanticsFixture): JsonObject[] =>
  objects(objects(objects(fixture.contract.pages)[0].sections)[0].fields);

function itemIds(fixture: ContentSemanticsFixture): string[] {
  const order = values(fixture).find(
    (value) => value.fieldId === fixture.ids.collectionField,
  );
  return (object(order?.value).orderedItemIds as string[]) ?? [];
}

/** A new protected string item field holding `valueOf(itemId)` on every item. */
function addProtectedItemField(
  fixture: ContentSemanticsFixture,
  fieldId: string,
  valueOf: (itemId: string, at: number) => string,
): void {
  itemFields(fixture).push({
    id: fieldId,
    type: "internal_protected",
    classification: "internal_protected",
    capabilities: [],
    valueType: "string",
    semantic: "item.code",
    itemPointer: "/code",
    presentation: {
      name: "Code",
      description: null,
      group: "SEO (internal)",
      order: 80,
      example: null,
    },
  });
  itemIds(fixture).forEach((itemId, at) => {
    values(fixture).push({
      fieldId,
      owner: {
        kind: "collection_item",
        collectionId: fixture.ids.collection,
        itemId,
      },
      type: "internal_protected",
      valueType: "string",
      value: valueOf(itemId, at),
    });
  });
}

function addRule(fixture: ContentSemanticsFixture, fieldIds: readonly string[]): void {
  uniqueness(fixture).push({ fieldIds: [...fieldIds], comparison: "exact" });
}

function grantAdd(fixture: ContentSemanticsFixture): void {
  const field = pageFields(fixture).find(
    (candidate) => candidate.id === fixture.ids.collectionField,
  );
  (field?.capabilities as string[]).push("collection.add");
}

function validate(production: ContentSemanticsFixture, candidate: ContentSemanticsFixture) {
  return validateManagedSiteContractV1Compatibility(
    parseManagedSiteContractV1(production.contract),
    parseManagedSiteContentDocument(production.content),
    parseManagedSiteContractV1(candidate.contract),
    parseManagedSiteContentDocument(candidate.content),
  );
}

function codeOf(production: ContentSemanticsFixture, candidate: ContentSemanticsFixture): string | null {
  try {
    validate(production, candidate);
    return null;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

/** Two items, so a uniqueness rule has something to compare. */
function twoItems(): ContentSemanticsFixture {
  const fixture = contentSemanticsFixture();
  addSecondFixtureItem(fixture);
  return fixture;
}

function judge(options: {
  readonly production?: Mutation;
  readonly candidate: Mutation;
}): string | null {
  const production = twoItems();
  options.production?.(production);
  const candidate = structuredClone(production);
  options.candidate(candidate);
  return codeOf(production, candidate);
}

const distinct = (_itemId: string, at: number) => `code-${at}`;

describe("a uniqueness rule a candidate adds to an existing collection", () => {
  it("is admitted over one new protected field with distinct values", () => {
    const fieldId = newFieldId();
    assert.equal(
      judge({
        candidate: (fixture) => {
          addProtectedItemField(fixture, fieldId, distinct);
          addRule(fixture, [fieldId]);
        },
      }),
      null,
    );
  });

  it("is admitted over two new protected fields together", () => {
    const [first, second] = [newFieldId(), newFieldId()];
    assert.equal(
      judge({
        candidate: (fixture) => {
          addProtectedItemField(fixture, first, distinct);
          addProtectedItemField(fixture, second, () => "same");
          // Distinct fields under one pointer would collide; give the second its own.
          itemFields(fixture).at(-1)!.itemPointer = "/code2";
          addRule(fixture, [first, second]);
        },
      }),
      null,
    );
  });

  const narrowed: readonly (readonly [string, { production?: Mutation; candidate: Mutation }])[] = [
    [
      "a new protected field together with an existing editable field",
      {
        candidate: (fixture) => {
          const fieldId = newFieldId();
          addProtectedItemField(fixture, fieldId, distinct);
          addRule(fixture, [fieldId, fixture.ids.itemRichField]);
        },
      },
    ],
    [
      "an existing protected field",
      {
        production: (fixture) => {
          addProtectedItemField(fixture, "field_zzzzzzzzzzzzzzzzzzzz900000", distinct);
        },
        candidate: (fixture) => addRule(fixture, ["field_zzzzzzzzzzzzzzzzzzzz900000"]),
      },
    ],
    [
      "a new customer-editable field",
      {
        candidate: (fixture) => {
          const fieldId = newFieldId();
          addProtectedItemField(fixture, fieldId, distinct);
          Object.assign(itemFields(fixture).at(-1)!, {
            type: "plain_text",
            classification: "customer_editable",
            capabilities: ["text.edit"],
            semantic: "label",
            constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
            valueType: undefined,
          });
          delete itemFields(fixture).at(-1)!.valueType;
          for (const value of values(fixture)) {
            if (value.fieldId === fieldId) {
              value.type = "plain_text";
              delete value.valueType;
            }
          }
          addRule(fixture, [fieldId]);
        },
      },
    ],
    [
      "an existing editable field (the rule before 0.33.0)",
      { candidate: (fixture) => addRule(fixture, [fixture.ids.itemRichField]) },
    ],
    [
      "a new protected field on a collection a customer can add items to",
      {
        candidate: (fixture) => {
          const fieldId = newFieldId();
          addProtectedItemField(fixture, fieldId, distinct);
          addRule(fixture, [fieldId]);
          grantAdd(fixture);
        },
      },
    ],
  ];

  for (const [name, mutations] of narrowed) {
    it(`is refused over ${name}`, () => {
      assert.equal(judge(mutations), "COMPATIBILITY_COLLECTION_POLICY_NARROWED");
    });
  }

  it("is refused over a new protected field reusing a tombstoned id", () => {
    const fieldId = "field_zzzzzzzzzzzzzzzzzzzz900040";
    assert.equal(
      judge({
        production: (fixture) => {
          (fixture.contract.tombstonedIds as string[]).push(fieldId);
        },
        candidate: (fixture) => {
          addProtectedItemField(fixture, fieldId, distinct);
          addRule(fixture, [fieldId]);
        },
      }),
      "CONTRACT_ID_TOMBSTONED",
    );
  });

  it("still refuses duplicate values through content semantics", () => {
    const fieldId = newFieldId();
    const code = judge({
      candidate: (fixture) => {
        addProtectedItemField(fixture, fieldId, () => "same");
        addRule(fixture, [fieldId]);
      },
    });
    assert.equal(code, "CONTENT_COLLECTION_UNIQUENESS");
  });

  it("still admits removing a rule, which narrows nothing", () => {
    assert.equal(
      judge({
        candidate: (fixture) => {
          const rules = uniqueness(fixture);
          const at = rules.findIndex((rule) =>
            (rule.fieldIds as string[]).includes(fixture.ids.itemHeadingField),
          );
          rules.splice(at, 1);
        },
      }),
      null,
    );
  });

  it("refuses granting add later on a collection whose rule names a protected field", () => {
    const fieldId = newFieldId();
    const production = twoItems();
    addProtectedItemField(production, fieldId, distinct);
    addRule(production, [fieldId]);
    const candidate = structuredClone(production);
    grantAdd(candidate);
    assert.equal(
      codeOf(production, candidate),
      "COMPATIBILITY_COLLECTION_POLICY_NARROWED",
    );
  });

  it("refuses granting add on the generated route's own collection", () => {
    const production = twoItems();
    const candidate = structuredClone(production);
    grantAdd(candidate);
    assert.equal(
      codeOf(production, candidate),
      "COMPATIBILITY_COLLECTION_POLICY_NARROWED",
    );
  });

  it("still admits granting add where no rule names a protected field", () => {
    const production = parseManagedSiteContractV1(twoItems().contract);
    const descriptor = production.collections[0];
    const editableOnly = {
      ...descriptor,
      uniqueness: descriptor.uniqueness.filter((rule) =>
        rule.fieldIds.every(
          (fieldId) =>
            descriptor.itemFields.find((field) => field.id === fieldId)?.type !==
            "internal_protected",
        ),
      ),
    };
    assert.ok(editableOnly.uniqueness.length > 0);
    assert.equal(
      isCompatibilityCollectionWidened(editableOnly, editableOnly, {
        existedInProduction: () => true,
        customerCanCreateItems: true,
        customerCouldCreateItems: false,
      }),
      true,
    );
  });
});

describe("an existing collection becoming a generated route's collection", () => {
  /** The fixture as it was before its collection had a generated page. */
  function withoutGeneratedPage(fixture: ContentSemanticsFixture): void {
    const { ids } = fixture;
    const routeFields = new Set([
      ids.routeKeyField,
      ids.generatedTitleField,
      ids.generatedDescriptionField,
      ids.generatedCanonicalField,
      ids.generatedIndexingField,
    ]);
    const contract = fixture.contract;
    contract.pages = objects(contract.pages).filter(
      (page) => page.id !== ids.generatedPage,
    );
    object(contract.internalSeo).generatedPages = [];
    for (const descriptor of objects(object(contract.internalSeo).pages)) {
      const links = object(descriptor.internalLinks);
      links.requiredPageIds = (links.requiredPageIds as string[]).filter(
        (pageId) => pageId !== ids.generatedPage,
      );
    }
    for (const field of pageFields(fixture)) {
      if (Array.isArray(field.usages)) {
        field.usages = objects(field.usages).filter(
          (usage) => usage.pageId !== ids.generatedPage,
        );
      }
    }
    collection(fixture).itemFields = itemFields(fixture).filter(
      (field) => !routeFields.has(field.id as string),
    );
    collection(fixture).uniqueness = uniqueness(fixture).filter(
      (rule) =>
        !(rule.fieldIds as string[]).some((fieldId) => routeFields.has(fieldId)),
    );
    fixture.content.values = values(fixture).filter(
      (value) => !routeFields.has(value.fieldId as string),
    );
  }

  /**
   * The route page's H1 a new item heading, as All Points Media's is: a field
   * production never had (0.35.0 counts it as an H1 only on its own page).
   */
  function withNewRouteH1(fixture: ContentSemanticsFixture): void {
    const original = itemFields(fixture).find(
      (field) => field.id === fixture.ids.itemHeadingField,
    )!;
    const fieldId = newFieldId();
    itemFields(fixture).push({
      ...structuredClone(original),
      id: fieldId,
      itemPointer: "/title",
    });
    for (const value of values(fixture).filter(
      (entry) => entry.fieldId === fixture.ids.itemHeadingField,
    )) {
      values(fixture).push({ ...structuredClone(value), fieldId });
    }
    const descriptor = objects(
      object(fixture.contract.internalSeo).generatedPages,
    )[0];
    descriptor.headingOutline = [{ fieldId, semanticLevel: 1 }];
  }

  it("is admitted, keeping every item id", () => {
    const candidate = twoItems();
    withNewRouteH1(candidate);
    const production = structuredClone(candidate);
    withoutGeneratedPage(production);
    itemFields(production).splice(-1, 1);
    production.content.values = values(production).filter(
      (value) => value.fieldId !== itemFields(candidate).at(-1)!.id,
    );
    assert.equal(codeOf(production, candidate), null);
  });

  it("is refused when two items would share a slug", () => {
    const candidate = contentSemanticsFixture();
    addSecondFixtureItem(candidate, { routeKey: "service-one" });
    const production = structuredClone(candidate);
    withoutGeneratedPage(production);
    assert.equal(codeOf(production, candidate), "CONTENT_COLLECTION_UNIQUENESS");
  });

  it("is refused while a customer can add items to it", () => {
    const candidate = twoItems();
    withNewRouteH1(candidate);
    const production = structuredClone(candidate);
    withoutGeneratedPage(production);
    grantAdd(production);
    grantAdd(candidate);
    assert.equal(
      codeOf(production, candidate),
      "COMPATIBILITY_COLLECTION_POLICY_NARROWED",
    );
  });
});

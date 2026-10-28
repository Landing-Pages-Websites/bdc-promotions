import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  managedItemPatternTextV1,
  managedSiteFieldMigrationFromV1,
  validateManagedSiteContractV1MigrationCompatibility,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContentDocumentJsonSchema,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1ContentSemantics,
  validateManagedSiteContractV1JsonSchema,
} from "../src/index.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";

/**
 * 0.38.0: page text on a generated page filled from the item it serves ("Build
 * Your {name} Network.", "{name} FAQ"). Invariant: every token of an item-text
 * pattern is filled, on every page it renders on, by one line of the
 * customer's text from the item that page serves, so the page always shows the
 * pattern with that item's own words in it.
 */

type JsonObject = Record<string, unknown>;

interface Ids {
  readonly name: string;
  readonly pattern: string;
  readonly section: string;
}

function presentation(name: string): JsonObject {
  return { name, description: null, group: "Network", order: 70, example: null };
}

function pagesOf(fixture: ContentSemanticsFixture): { id: string; sections: { id: string; fields: JsonObject[] }[] }[] {
  return fixture.contract.pages as { id: string; sections: { id: string; fields: JsonObject[] }[] }[];
}

function collectionOf(fixture: ContentSemanticsFixture): { itemFields: JsonObject[] } {
  return (fixture.contract.collections as { itemFields: JsonObject[] }[])[0];
}

function valuesOf(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.content.values as JsonObject[];
}

/**
 * The fixture with a customer-editable item name ("Healthcare") and, on the
 * generated page, a heading or text field whose pattern fills `{name}` from it.
 */
function withPattern(
  shape: "heading" | "text" = "heading",
  edit: (field: JsonObject, ids: Ids, fixture: ContentSemanticsFixture) => void = () => undefined,
): { fixture: ContentSemanticsFixture; ids: Ids } {
  const fixture = contentSemanticsFixture();
  const ids: Ids = { name: fixtureId("field"), pattern: fixtureId("field"), section: fixtureId("section") };
  collectionOf(fixture).itemFields.push({
    id: ids.name,
    type: "plain_text",
    semantic: "label",
    classification: "customer_editable",
    capabilities: ["text.edit"],
    itemPointer: "/name",
    presentation: presentation("Name"),
    constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
  });
  valuesOf(fixture).push({
    fieldId: ids.name,
    owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item },
    type: "plain_text",
    value: "Healthcare",
  });
  const generated = pagesOf(fixture)[1];
  const field: JsonObject = {
    id: ids.pattern,
    scope: "page",
    classification: "customer_editable",
    capabilities: ["text.edit"],
    resolver: { kind: "json_pointer", path: "content/site.json", pointer: "/network/build" },
    usages: [{ pageId: generated.id, itemId: null }],
    presentation: presentation("Build your network"),
    ...(shape === "heading"
      ? { type: "heading_text", semanticLevel: 2 }
      : { type: "plain_text", semantic: "body" }),
    constraints: {
      minLength: 1,
      maxLength: 120,
      newlines: "forbid",
      pattern: { placeholders: [{ name: "name", fieldId: ids.name }] },
    },
  };
  generated.sections.push({ id: ids.section, presentation: presentation("Build"), fields: [field] } as never);
  valuesOf(fixture).push({
    fieldId: ids.pattern,
    owner: { kind: "page", pageId: generated.id },
    type: shape === "heading" ? "heading_text" : "plain_text",
    value: "Build Your {name} Network.",
  });
  edit(field, ids, fixture);
  return { fixture, ids };
}

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

const patternOf = (field: JsonObject) => (field.constraints as { pattern: { placeholders: JsonObject[] } }).pattern;

describe("an item-text pattern's declaration", () => {
  const cases: readonly [string, () => ContentSemanticsFixture, string][] = [
    ["a heading on its generated page", () => withPattern("heading").fixture, "accepted"],
    ["body text on its generated page", () => withPattern("text").fixture, "accepted"],
    [
      "a source of another collection",
      () =>
        withPattern("heading", (field) => {
          patternOf(field).placeholders[0].fieldId = fixtureId("field");
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "the route key (protected, not the customer's words)",
      () => withPattern("heading", (field, _ids, fixture) => void (patternOf(field).placeholders[0].fieldId = fixture.ids.routeKeyField)).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "rich text as a source",
      () => withPattern("heading", (field, _ids, fixture) => void (patternOf(field).placeholders[0].fieldId = fixture.ids.itemRichField)).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "a source that may be empty",
      () =>
        withPattern("heading", (_field, ids, fixture) => {
          const name = collectionOf(fixture).itemFields.find((one) => one.id === ids.name) as { constraints: JsonObject };
          name.constraints.minLength = 0;
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "a source of several lines",
      () =>
        withPattern("heading", (_field, ids, fixture) => {
          const name = collectionOf(fixture).itemFields.find((one) => one.id === ids.name) as { constraints: JsonObject };
          name.constraints.newlines = "allow";
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "a code-owned source",
      () =>
        withPattern("heading", (_field, ids, fixture) => {
          const name = collectionOf(fixture).itemFields.find((one) => one.id === ids.name) as JsonObject;
          name.classification = "code_owned_interface";
          name.capabilities = [];
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "the pattern on a static page",
      () =>
        withPattern("heading", (field, ids, fixture) => {
          const [home, generated] = pagesOf(fixture);
          const section = generated.sections.pop() as { fields: JsonObject[] };
          home.sections.push(section as never);
          field.usages = [{ pageId: home.id, itemId: null }];
          (valuesOf(fixture).find((one) => one.fieldId === ids.pattern) as JsonObject).owner = { kind: "page", pageId: home.id };
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "a site-scoped pattern",
      () =>
        withPattern("heading", (field, ids, fixture) => {
          field.scope = "site";
          (valuesOf(fixture).find((one) => one.fieldId === ids.pattern) as JsonObject).owner = { kind: "site" };
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "a code-owned pattern",
      () =>
        withPattern("heading", (field) => {
          field.classification = "code_owned_interface";
          field.capabilities = [];
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "a pattern on an item's own field",
      () =>
        withPattern("heading", (_field, ids, fixture) => {
          const name = collectionOf(fixture).itemFields.find((one) => one.id === ids.name) as { constraints: JsonObject };
          name.constraints = { ...name.constraints, pattern: { placeholders: [{ name: "name", fieldId: ids.name }] } };
          (valuesOf(fixture).find((one) => one.fieldId === ids.name) as JsonObject).value = "{name}";
        }).fixture,
      "CONTRACT_ITEM_PATTERN",
    ],
    [
      "one placeholder naming its source and one not",
      () =>
        withPattern("text", (field, _ids, fixture) => {
          patternOf(field).placeholders.push({ name: "other" });
          (valuesOf(fixture).at(-1) as JsonObject).value = "Build Your {name} {other} Network.";
        }).fixture,
      "rejected",
    ],
    [
      "an item-text pattern on search text",
      () =>
        withPattern("text", (field) => {
          field.semantic = "seo_title";
        }).fixture,
      "rejected",
    ],
    [
      "an item-text pattern on structured text (an address)",
      () =>
        withPattern("text", (field) => {
          field.semantic = "address";
        }).fixture,
      "rejected",
    ],
    [
      "a search-style pattern (no sources) on a heading",
      () =>
        withPattern("heading", (field) => {
          delete patternOf(field).placeholders[0].fieldId;
        }).fixture,
      "rejected",
    ],
  ];
  for (const [name, build, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : `refuses (${expected})`} ${name}`, () => {
      const verdict = judge(build());
      if (expected === "rejected") assert.notEqual(verdict, "accepted");
      else assert.equal(verdict, expected);
    });
  }

  it("the JSON Schema admits the declaration and the value, as zod does", () => {
    const { fixture } = withPattern("heading");
    assert.equal(validateManagedSiteContractV1JsonSchema(fixture.contract).valid, true);
    assert.equal(validateManagedSiteContentDocumentJsonSchema(fixture.content).valid, true);
  });
});

describe("an item-text pattern's value", () => {
  const cases: readonly [string, string, string][] = [
    ["the token once", "Build Your {name} Network.", "accepted"],
    ["the token alone", "{name}", "accepted"],
    ["no token", "Build Your Network.", "CONTENT_VALUE_POLICY"],
    ["the token twice", "{name} and {name}", "CONTENT_VALUE_POLICY"],
    ["an undeclared token", "Build Your {name} {city} Network.", "CONTENT_VALUE_POLICY"],
    ["a stray brace", "Build Your {name} Network }", "CONTENT_VALUE_POLICY"],
    ["a token in other case", "Build Your {Name} Network.", "CONTENT_VALUE_POLICY"],
  ];
  for (const [name, value, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => {
      const { fixture, ids } = withPattern("heading");
      (valuesOf(fixture).find((one) => one.fieldId === ids.pattern) as JsonObject).value = value;
      assert.equal(judge(fixture), expected);
    });
  }
});

describe("what a generated page shows", () => {
  it("fills each token with the item's own text, verbatim", () => {
    const { fixture, ids } = withPattern("heading");
    const name = valuesOf(fixture).find((one) => one.fieldId === ids.name) as JsonObject;
    name.value = "Bars & $& {name}";
    const contract = parseManagedSiteContractV1(fixture.contract);
    const content = parseManagedSiteContentDocument(fixture.content);
    validateManagedSiteContractV1ContentSemantics(contract, content);
    assert.equal(
      managedItemPatternTextV1(contract, content, ids.pattern, fixture.ids.item),
      "Build Your Bars & $& {name} Network.",
    );
  });

  it("refuses a field that is not an item-text pattern, and an item it does not serve", () => {
    const { fixture, ids } = withPattern("heading");
    const contract = parseManagedSiteContractV1(fixture.contract);
    const content = parseManagedSiteContentDocument(fixture.content);
    const code = (run: () => unknown) => {
      try {
        run();
        return "rendered";
      } catch (error) {
        return error instanceof ManagedSiteContractError ? error.code : String(error);
      }
    };
    assert.equal(code(() => managedItemPatternTextV1(contract, content, fixture.ids.titleField, fixture.ids.item)), "ITEM_PATTERN_UNRESOLVED");
    assert.equal(code(() => managedItemPatternTextV1(contract, content, ids.pattern, fixtureId("item"))), "ITEM_PATTERN_UNRESOLVED");
  });
});

describe("a code change keeps a pattern's tokens", () => {
  function check(edit: (field: JsonObject, ids: Ids, fixture: ContentSemanticsFixture) => void): string {
    const production = withPattern("text");
    const candidate = structuredClone(production.fixture);
    const field = pagesOf(candidate)[1].sections.at(-1)?.fields[0] as JsonObject;
    edit(field, production.ids, candidate);
    try {
      validateManagedSiteContractV1Compatibility(
        parseManagedSiteContractV1(production.fixture.contract),
        parseManagedSiteContentDocument(production.fixture.content),
        parseManagedSiteContractV1(candidate.contract),
        parseManagedSiteContentDocument(candidate.content),
      );
      return "compatible";
    } catch (error) {
      return error instanceof ManagedSiteContractError ? error.code : String(error);
    }
  }

  it("admits the same pattern", () => assert.equal(check(() => undefined), "compatible"));
  it("refuses dropping it (stored tokens would show as braces)", () =>
    assert.equal(check((field) => void delete (field.constraints as JsonObject).pattern), "COMPATIBILITY_FIELD_POLICY_NARROWED"));
  it("refuses filling its token from another field", () =>
    assert.equal(
      check((field, _ids, fixture) => void (patternOf(field).placeholders[0].fieldId = fixture.ids.itemHeadingField)),
      "COMPATIBILITY_FIELD_POLICY_NARROWED",
    ));
});

describe("a field migration never moves a pattern's text", () => {
  /** Merges the pattern field into a new rich-text heading at its level, keeping every page where it was. */
  function mergeCode(shape: "heading" | "text"): string {
    const { fixture, ids } = withPattern(shape);
    const production = structuredClone(fixture);
    const candidate = structuredClone(fixture);
    const sectionFields = pagesOf(candidate)[1].sections.at(-1)?.fields as JsonObject[];
    const source = sectionFields[0];
    const target = {
      id: fixtureId("field"),
      scope: "page",
      type: "rich_text",
      classification: "customer_editable",
      capabilities: ["text.edit"],
      resolver: { kind: "json_pointer", path: "content/site.json", pointer: "/network/buildRich" },
      usages: source.usages,
      presentation: source.presentation,
      constraints: { maxCharacters: 200, maxNodes: 20, allowedBlocks: ["heading", "paragraph"], allowedMarks: [], allowLinks: false, allowedExternalHosts: [], allowedTargets: [] },
    };
    sectionFields.splice(0, 1, target);
    (candidate.contract.tombstonedIds as string[]).push(ids.pattern);
    const values = valuesOf(candidate);
    const at = values.findIndex((one) => one.fieldId === ids.pattern);
    const owner = values[at].owner;
    values.splice(at, 1, {
      fieldId: target.id,
      owner,
      type: "rich_text",
      value: { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Build Your {name} Network." }] }] },
    });
    const productionContract = parseManagedSiteContractV1(production.contract);
    const productionContent = parseManagedSiteContentDocument(production.content);
    const declaration = {
      schemaVersion: "1.0",
      from: managedSiteFieldMigrationFromV1(productionContract, productionContent),
      steps: [{
        op: "merge",
        target: target.id,
        into: shape === "heading" ? { type: "rich_text", block: { type: "heading", level: 2 } } : { type: "rich_text", block: { type: "paragraph" } },
        parts: [{ source: ids.pattern }],
      }],
    };
    try {
      validateManagedSiteContractV1MigrationCompatibility(
        productionContract,
        productionContent,
        parseManagedSiteContractV1(candidate.contract),
        parseManagedSiteContentDocument(candidate.content),
        declaration,
        { admitBridge: () => true },
      );
      return "migrated";
    } catch (error) {
      return error instanceof ManagedSiteContractError ? error.code : String(error);
    }
  }

  it("refuses merging a heading that holds a pattern", () => assert.equal(mergeCode("heading"), "MIGRATION_TRANSFORM_DEFERRED"));
  it("refuses merging body text that holds a pattern", () => assert.equal(mergeCode("text"), "MIGRATION_TRANSFORM_DEFERRED"));
});

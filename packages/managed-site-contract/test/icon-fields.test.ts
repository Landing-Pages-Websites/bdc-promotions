import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  parseManagedCollectionDescriptor,
  parseManagedFieldDescriptor,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedFieldValue,
  validateManagedSiteContentDocumentJsonSchema,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import { isCompatibilityFieldWidened } from "../src/contract-compatibility-constraints.js";
import { contentSemanticsFixture } from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";
import { contentDocument, plainTextField, stableId } from "./schema-fixtures.js";

/**
 * 0.28.0: an icon a customer chooses from the site's own set ("Healthcare"
 * shows heart-pulse). Invariant: an icon value is exactly one of its field's
 * declared choices, in a library the editor can draw, and a code change never
 * drops a choice production may hold.
 */

type JsonObject = Record<string, unknown>;

const CHOICES = [
  { name: "heart-pulse", label: "Healthcare" },
  { name: "landmark", label: "Government" },
  { name: "shopping-bag", label: "Retail" },
];

function iconField(constraints: JsonObject = {}, overrides: JsonObject = {}): JsonObject {
  const base = plainTextField();
  delete base.semantic;
  return {
    ...base,
    type: "icon",
    capabilities: ["icon.choose"],
    constraints: { library: "lucide", choices: CHOICES, ...constraints },
    ...overrides,
  };
}

function outcome(check: () => unknown): "accepted" | "rejected" {
  try {
    check();
    return "accepted";
  } catch {
    return "rejected";
  }
}

describe("an icon field's declaration", () => {
  const cases: readonly [string, JsonObject, "accepted" | "rejected"][] = [
    ["three lucide choices", iconField(), "accepted"],
    ["one choice", iconField({ choices: [CHOICES[0]] }), "accepted"],
    ["a code-owned icon", iconField({}, { classification: "code_owned_interface", capabilities: [] }), "accepted"],
    ["two hundred choices", iconField({ choices: Array.from({ length: 200 }, (_, index) => ({ name: `icon-${index}`, label: `Icon ${index}` })) }), "accepted"],
    ["another library", iconField({ library: "heroicons" }), "rejected"],
    ["no choices", iconField({ choices: [] }), "rejected"],
    ["two hundred and one choices", iconField({ choices: Array.from({ length: 201 }, (_, index) => ({ name: `icon-${index}`, label: `Icon ${index}` })) }), "rejected"],
    ["a repeated name", iconField({ choices: [CHOICES[0], { name: "heart-pulse", label: "Again" }] }), "rejected"],
    ["a PascalCase name", iconField({ choices: [{ name: "HeartPulse", label: "Healthcare" }] }), "rejected"],
    ["a doubled hyphen", iconField({ choices: [{ name: "heart--pulse", label: "Healthcare" }] }), "rejected"],
    ["a leading hyphen", iconField({ choices: [{ name: "-heart", label: "Healthcare" }] }), "rejected"],
    ["a path", iconField({ choices: [{ name: "../heart", label: "Healthcare" }] }), "rejected"],
    ["a 65-character name", iconField({ choices: [{ name: "a".repeat(65), label: "Long" }] }), "rejected"],
    ["an empty label", iconField({ choices: [{ name: "heart", label: "" }] }), "rejected"],
    ["a choice with an extra key", iconField({ choices: [{ name: "heart", label: "Heart", svg: "<svg/>" }] }), "rejected"],
    ["text capabilities", iconField({}, { capabilities: ["text.edit"] }), "rejected"],
    ["no capabilities while editable", iconField({}, { capabilities: [] }), "rejected"],
  ];
  for (const [name, field, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => {
      assert.equal(outcome(() => parseManagedFieldDescriptor(field)), expected);
    });
  }
});

function iconValue(value: unknown, fieldId = stableId("field")): JsonObject {
  return { fieldId, owner: { kind: "site" }, type: "icon", value };
}

describe("an icon value is one of its field's choices", () => {
  const field = iconField();
  const cases: readonly [string, unknown, "accepted" | "rejected"][] = [
    ["a declared choice", "landmark", "accepted"],
    ["another declared choice", "shopping-bag", "accepted"],
    ["a well-formed name not declared", "plane", "rejected"],
    ["a declared name in capitals", "Landmark", "rejected"],
    ["a declared name padded", " landmark", "rejected"],
    ["a label instead of a name", "Government", "rejected"],
    ["an empty name", "", "rejected"],
    ["null", null, "rejected"],
    ["a number", 7, "rejected"],
    ["an object", { name: "landmark" }, "rejected"],
  ];
  for (const [name, value, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => {
      assert.equal(outcome(() => validateManagedFieldValue(field, iconValue(value, field.id as string))), expected);
    });
  }

  it("refuses an undeclared choice with its own code", () => {
    assert.throws(
      () => validateManagedFieldValue(field, iconValue("plane", field.id as string)),
      (error: unknown) => error instanceof ManagedSiteContractError && error.code === "FIELD_VALUE_ICON",
    );
  });

  it("the JSON Schema holds a value to the name grammar, as zod does", () => {
    for (const [value, valid] of [["landmark", true], ["Landmark", false], ["", false], [7, false]] as const) {
      const result = validateManagedSiteContentDocumentJsonSchema({ ...contentDocument(), values: [iconValue(value)] });
      assert.equal(result.valid, valid, JSON.stringify(value));
    }
  });
});

describe("an icon field on every item of a collection", () => {
  function withItemIcon(mutate: (values: JsonObject[], ids: { field: string; item: string }) => void): string {
    const fixture = contentSemanticsFixture();
    const field = fixtureId("field");
    const collection = (fixture.contract.collections as JsonObject[])[0] as JsonObject;
    (collection.itemFields as JsonObject[]).push({
      id: field,
      type: "icon",
      classification: "customer_editable",
      capabilities: ["icon.choose"],
      itemPointer: "/icon",
      presentation: { name: "Icon", description: null, group: "Icons", order: 50, example: null },
      constraints: { library: "lucide", choices: CHOICES },
    });
    const values = fixture.content.values as JsonObject[];
    values.push({ fieldId: field, owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item }, type: "icon", value: "heart-pulse" });
    mutate(values, { field, item: fixture.ids.item });
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

  it("accepts a declared icon on the item", () => {
    assert.equal(withItemIcon(() => undefined), "accepted");
  });

  it("refuses an undeclared icon on the item", () => {
    assert.equal(
      withItemIcon((values, ids) => void ((values.find((one) => one.fieldId === ids.field) as JsonObject).value = "plane")),
      "CONTENT_VALUE_POLICY",
    );
  });

  it("refuses an item missing its icon", () => {
    assert.equal(
      withItemIcon((values, ids) => void values.splice(values.findIndex((one) => one.fieldId === ids.field), 1)),
      "CONTENT_ITEM_VALUE_MISSING",
    );
  });

  it("parses as an item field and refuses another library there too", () => {
    const fixture = contentSemanticsFixture();
    const collection = structuredClone((fixture.contract.collections as JsonObject[])[0] as JsonObject);
    const icon = { id: fixtureId("field"), type: "icon", classification: "customer_editable", capabilities: ["icon.choose"], itemPointer: "/icon", presentation: { name: "Icon", description: null, group: "Icons", order: 50, example: null }, constraints: { library: "lucide", choices: CHOICES } };
    assert.equal(outcome(() => parseManagedCollectionDescriptor({ ...collection, itemFields: [...(collection.itemFields as JsonObject[]), icon] })), "accepted");
    const other = { ...icon, constraints: { library: "material", choices: CHOICES } };
    assert.equal(outcome(() => parseManagedCollectionDescriptor({ ...collection, itemFields: [...(collection.itemFields as JsonObject[]), other] })), "rejected");
  });
});

describe("a code change keeps every icon production may hold", () => {
  function widened(candidateConstraints: JsonObject, candidateOverrides: JsonObject = {}): boolean {
    const production = parseManagedFieldDescriptor(iconField());
    const candidate = parseManagedFieldDescriptor({ ...iconField(candidateConstraints, candidateOverrides), id: production.id });
    return isCompatibilityFieldWidened({ kind: "rendered", descriptor: production }, { kind: "rendered", descriptor: candidate });
  }
  const cases: readonly [string, JsonObject, boolean][] = [
    ["the same choices", {}, true],
    ["a choice added", { choices: [...CHOICES, { name: "plane", label: "Travel" }] }, true],
    ["a label changed", { choices: [{ ...CHOICES[0], label: "Health" }, CHOICES[1], CHOICES[2]] }, true],
    ["the choices reordered", { choices: [CHOICES[2], CHOICES[0], CHOICES[1]] }, true],
    ["a choice dropped", { choices: [CHOICES[0], CHOICES[1]] }, false],
    ["a choice renamed", { choices: [CHOICES[0], CHOICES[1], { name: "shopping-cart", label: "Retail" }] }, false],
  ];
  for (const [name, constraints, expected] of cases) {
    it(`${expected ? "admits" : "refuses"} ${name}`, () => assert.equal(widened(constraints), expected));
  }

  it("refuses the field becoming text", () => {
    const production = parseManagedFieldDescriptor(iconField());
    const candidate = parseManagedFieldDescriptor({ ...plainTextField(), id: production.id, usages: production.usages, scope: production.scope });
    assert.equal(isCompatibilityFieldWidened({ kind: "rendered", descriptor: production }, { kind: "rendered", descriptor: candidate }), false);
  });
});

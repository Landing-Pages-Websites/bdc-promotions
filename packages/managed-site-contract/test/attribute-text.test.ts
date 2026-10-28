import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  isManagedTextAttribute,
  MANAGED_ATTRIBUTE_TEXT_BLANK_CODE_POINTS,
  MANAGED_TEXT_ATTRIBUTES,
  managedAttributeTextRefusal,
  managedSiteAttributeFieldAttributesV1,
  managedSiteFieldAttributesV1,
  parseManagedCollectionDescriptor,
  parseManagedFieldDescriptor,
  validateManagedFieldValue,
  type StableId,
} from "../src/index.js";
import * as subpath from "../src/attribute-text.js";
import { isCompatibilityFieldWidened } from "../src/contract-compatibility-constraints.js";
import { collectionDescriptor, headingTextField, plainTextField, stableId } from "./schema-fixtures.js";

/**
 * Attribute text held to the adversarial table megaseo-web's CMS writer and its
 * TypeScript twin are held to. A verdict reached differently here is a value
 * the CMS saves and Site Guard then refuses, or the reverse.
 */
interface Limits {
  readonly minLength: number;
  readonly maxLength: number;
  readonly newlines: "forbid" | "allow";
}

interface AttributeTable {
  readonly defaultLimits: Limits;
  readonly attributeNames: readonly { readonly name: string; readonly known: boolean }[];
  readonly valueCases: readonly {
    readonly name: string;
    readonly text: string;
    readonly limits?: Limits;
    readonly expected: { readonly reason: string | null };
  }[];
  readonly policyCases: readonly {
    readonly name: string;
    readonly semantic: string;
    readonly constraints: Record<string, unknown>;
    readonly valid: boolean;
  }[];
}

const TABLE = JSON.parse(
  readFileSync(new URL("./cms-attribute-text-rule-cases.json", import.meta.url), "utf8"),
) as AttributeTable;

const ATTRIBUTE_REASONS = new Set(["unsafe_character", "blank"]);

function attributeField(
  constraints: Record<string, unknown> = { ...TABLE.defaultLimits, attribute: "aria-label" },
  semantic = "label",
): Record<string, unknown> {
  return { ...plainTextField(), semantic, constraints };
}

function textValue(text: string): Record<string, unknown> {
  return { fieldId: stableId("field"), owner: { kind: "site" }, type: "plain_text", value: text };
}

function accepts(check: () => unknown): boolean {
  try {
    check();
    return true;
  } catch {
    return false;
  }
}

describe("attribute names (shared CMS table)", () => {
  for (const entry of TABLE.attributeNames) {
    it(`${entry.known ? "knows" : "refuses"} ${JSON.stringify(entry.name)}`, () => {
      assert.equal(isManagedTextAttribute(entry.name), entry.known);
      const field = attributeField({ ...TABLE.defaultLimits, attribute: entry.name });
      assert.equal(accepts(() => parseManagedFieldDescriptor(field)), entry.known);
    });
  }

  it("lists exactly the names the table knows", () => {
    const known = TABLE.attributeNames.filter((entry) => entry.known).map((entry) => entry.name);
    assert.deepEqual([...known].sort(), [...MANAGED_TEXT_ATTRIBUTES].sort());
  });
});

describe("attribute text values (shared CMS table)", () => {
  for (const entry of TABLE.valueCases) {
    it(entry.name, () => {
      const field = attributeField({ ...(entry.limits ?? TABLE.defaultLimits), attribute: "aria-label" });
      parseManagedFieldDescriptor(field);
      assert.equal(
        accepts(() => validateManagedFieldValue(field, textValue(entry.text))),
        entry.expected.reason === null,
      );
    });
  }

  it("names the CMS's reason for every attribute refusal in the table", () => {
    for (const entry of TABLE.valueCases) {
      const reason = managedAttributeTextRefusal(entry.text);
      const expected = entry.expected.reason;
      if (expected !== null && ATTRIBUTE_REASONS.has(expected)) assert.equal(reason, expected, entry.name);
      else if (expected === null) assert.equal(reason, null, entry.name);
    }
  });

  it("leaves a plain-text field with no attribute exactly as it was", () => {
    const field = { ...plainTextField(), constraints: { minLength: 0, maxLength: 120, newlines: "forbid" } };
    for (const text of ["", " ", "​", "a\tb"]) {
      assert.equal(accepts(() => validateManagedFieldValue(field, textValue(text))), true, JSON.stringify(text));
    }
  });

  it("counts every Unicode White_Space character as blank", () => {
    const blank = new Set<number>(MANAGED_ATTRIBUTE_TEXT_BLANK_CODE_POINTS);
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      if (/\p{White_Space}/u.test(String.fromCodePoint(codePoint))) {
        assert.ok(blank.has(codePoint), `U+${codePoint.toString(16)} is White_Space`);
      }
    }
  });
});

describe("attribute declarations (shared CMS table)", () => {
  for (const entry of TABLE.policyCases) {
    it(`${entry.valid ? "accepts" : "refuses"} ${entry.name}`, () => {
      const field = attributeField(entry.constraints, entry.semantic);
      assert.equal(accepts(() => parseManagedFieldDescriptor(field)), entry.valid);
    });
  }

  it("refuses an attribute on heading text", () => {
    const heading = headingTextField();
    assert.throws(() =>
      parseManagedFieldDescriptor({
        ...heading,
        constraints: { ...(heading.constraints as object), attribute: "aria-label" },
      }),
    );
  });

  it("accepts an attribute on a collection item field, and holds it to the same policy", () => {
    const collection = collectionDescriptor();
    const [itemField] = collection.itemFields as Record<string, unknown>[];
    const withAttribute = (constraints: Record<string, unknown>) => ({
      ...collection,
      itemFields: [{ ...itemField, semantic: "label", constraints }],
    });
    assert.doesNotThrow(() =>
      parseManagedCollectionDescriptor(withAttribute({ ...TABLE.defaultLimits, attribute: "aria-label" })),
    );
    assert.throws(() =>
      parseManagedCollectionDescriptor(withAttribute({ ...TABLE.defaultLimits, minLength: 0, attribute: "aria-label" })),
    );
    assert.throws(() =>
      parseManagedCollectionDescriptor(withAttribute({ ...TABLE.defaultLimits, attribute: "href" })),
    );
  });
});

describe("attribute compatibility", () => {
  const field = (constraints: Record<string, unknown>) => parseManagedFieldDescriptor(attributeField(constraints));
  const limits = TABLE.defaultLimits;
  const plain = parseManagedFieldDescriptor({ ...plainTextField(), semantic: "label", constraints: limits });
  const cases: readonly [string, ReturnType<typeof field>, ReturnType<typeof field>, boolean][] = [
    ["the same attribute", field({ ...limits, attribute: "title" }), field({ ...limits, attribute: "title" }), true],
    [
      "the same attribute with a longer maximum",
      field({ ...limits, maxLength: 80, attribute: "title" }),
      field({ ...limits, maxLength: 120, attribute: "title" }),
      true,
    ],
    [
      "the same attribute with a shorter maximum",
      field({ ...limits, attribute: "title" }),
      field({ ...limits, maxLength: 80, attribute: "title" }),
      false,
    ],
    ["an attribute added", plain, field({ ...limits, attribute: "title" }), false],
    ["an attribute dropped", field({ ...limits, attribute: "title" }), plain, false],
    ["the attribute changed", field({ ...limits, attribute: "title" }), field({ ...limits, attribute: "aria-label" }), false],
  ];
  for (const [name, production, candidate, widened] of cases) {
    it(`${widened ? "keeps" : "refuses"} ${name}`, () => {
      const fact = (descriptor: typeof production) => ({ kind: "rendered", descriptor }) as const;
      assert.equal(isCompatibilityFieldWidened(fact(production), fact(candidate)), widened);
    });
  }
});

describe("attribute bindings", () => {
  const fieldId = stableId("field") as StableId<"field">;
  const itemId = stableId("item") as StableId<"item">;

  it("names the field in a binding of the attribute's own", () => {
    assert.deepEqual(managedSiteAttributeFieldAttributesV1("aria-label", fieldId), {
      "data-gomega-attr-aria-label": fieldId,
    });
  });

  it("names an item's copy in that attribute's own item binding", () => {
    assert.deepEqual(managedSiteAttributeFieldAttributesV1("placeholder", fieldId, itemId), {
      "data-gomega-attr-placeholder": fieldId,
      "data-gomega-attr-placeholder-item": itemId,
    });
  });

  it("lets one element carry a text field and several attribute fields without a shared key", () => {
    const sets = [
      managedSiteFieldAttributesV1(fieldId, itemId),
      ...MANAGED_TEXT_ATTRIBUTES.map((attribute) => managedSiteAttributeFieldAttributesV1(attribute, fieldId, itemId)),
    ];
    const keys = sets.flatMap((set) => Object.keys(set));
    assert.equal(new Set(keys).size, keys.length);
  });

  for (const attribute of ["href", "src", "style", "class", "onclick", "Aria-Label", "ARIA-LABEL", "aria-label ", ""]) {
    it(`refuses a binding for ${JSON.stringify(attribute)}`, () => {
      assert.throws(
        () => managedSiteAttributeFieldAttributesV1(attribute as "aria-label", fieldId),
        /Not an attribute a field may write/u,
      );
    });
  }

  it("refuses ids of the wrong kind", () => {
    assert.throws(() => managedSiteAttributeFieldAttributesV1("title", itemId as unknown as StableId<"field">));
    assert.throws(() => managedSiteAttributeFieldAttributesV1("title", fieldId, fieldId as unknown as StableId<"item">));
  });

  it("is frozen", () => {
    assert.ok(Object.isFrozen(managedSiteAttributeFieldAttributesV1("alt", fieldId)));
  });

  it("is the same rule from the zod-free subpath", () => {
    assert.equal(subpath.managedAttributeTextRefusal, managedAttributeTextRefusal);
    assert.equal(subpath.MANAGED_TEXT_ATTRIBUTES, MANAGED_TEXT_ATTRIBUTES);
  });
});

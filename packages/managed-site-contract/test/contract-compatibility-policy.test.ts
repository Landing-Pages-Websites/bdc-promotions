import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1Compatibility,
} from "../src/index.js";
import type {
  ManagedSiteContentDocument,
  ManagedSiteContractV1,
} from "../src/index.js";
import {
  addSecondFixtureItem,
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";

type JsonObject = Record<string, unknown>;
type FixtureMutation = (fixture: ContentSemanticsFixture) => void;

interface CompatibilityCase {
  readonly production: ContentSemanticsFixture;
  readonly candidate: ContentSemanticsFixture;
}

function objects(value: unknown): JsonObject[] {
  return value as JsonObject[];
}

function strings(value: unknown): string[] {
  return value as string[];
}

function object(value: unknown): JsonObject {
  return value as JsonObject;
}

function makeCase(productionMutation?: FixtureMutation): CompatibilityCase {
  const production = contentSemanticsFixture();
  productionMutation?.(production);
  return {
    production,
    candidate: structuredClone(production),
  };
}

function pageFields(fixture: ContentSemanticsFixture): JsonObject[] {
  const page = objects(fixture.contract.pages)[0];
  return objects(objects(page.sections)[0].fields);
}

function collection(fixture: ContentSemanticsFixture): JsonObject {
  return objects(fixture.contract.collections)[0];
}

function itemFields(fixture: ContentSemanticsFixture): JsonObject[] {
  return objects(collection(fixture).itemFields);
}

function asset(fixture: ContentSemanticsFixture): JsonObject {
  return objects(fixture.contract.assets)[0];
}

function field(fixture: ContentSemanticsFixture, fieldId: string): JsonObject {
  const candidates = [
    ...pageFields(fixture),
    ...itemFields(fixture),
    ...objects(object(fixture.contract.internalSeo).protectedFields),
  ];
  const found = candidates.find((candidate) => candidate.id === fieldId);
  if (found === undefined) throw new Error(`Missing field ${fieldId}`);
  return found;
}

function values(fixture: ContentSemanticsFixture): JsonObject[] {
  return objects(fixture.content.values);
}

function contentValue(
  fixture: ContentSemanticsFixture,
  fieldId: string,
): JsonObject {
  const found = values(fixture).find(
    (candidate) => candidate.fieldId === fieldId,
  );
  if (found === undefined) throw new Error(`Missing value ${fieldId}`);
  return found;
}

function parseFixture(fixture: ContentSemanticsFixture): {
  readonly contract: ManagedSiteContractV1;
  readonly content: ManagedSiteContentDocument;
} {
  return {
    contract: parseManagedSiteContractV1(fixture.contract),
    content: parseManagedSiteContentDocument(fixture.content),
  };
}

function validate(testCase: CompatibilityCase) {
  const production = parseFixture(testCase.production);
  const candidate = parseFixture(testCase.candidate);
  return validateManagedSiteContractV1Compatibility(
    production.contract,
    production.content,
    candidate.contract,
    candidate.content,
  );
}

function assertCode(testCase: CompatibilityCase, code: string): void {
  assert.throws(
    () => validate(testCase),
    (error: unknown) =>
      error instanceof ManagedSiteContractError && error.code === code,
  );
}

function addCodeOwnedField(testCase: CompatibilityCase): readonly string[] {
  const sectionId = fixtureId("section");
  const fieldId = fixtureId("field");
  const homePageId = testCase.candidate.ids.homePage;
  objects(objects(testCase.candidate.contract.pages)[0].sections).push({
    id: sectionId,
    presentation: {
      name: "Code-owned section",
      description: null,
      group: "Compatibility",
      order: 999,
      example: null,
    },
    fields: [
      {
        id: fieldId,
        scope: "page",
        type: "plain_text",
        classification: "code_owned_interface",
        capabilities: [],
        resolver: {
          kind: "json_pointer",
          path: "content/site.json",
          pointer: "/compatibility/codeOwned",
        },
        usages: [{ pageId: homePageId, itemId: null }],
        presentation: {
          name: "Code-owned value",
          description: null,
          group: "Compatibility",
          order: 1_000,
          example: null,
        },
        semantic: "body",
        constraints: { minLength: 0, maxLength: 100, newlines: "forbid" },
      },
    ],
  });
  values(testCase.candidate).push({
    fieldId,
    owner: { kind: "page", pageId: homePageId },
    type: "plain_text",
    value: "Added interface copy",
  });
  return [sectionId, fieldId];
}

function assertDeepFrozen(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) assertDeepFrozen(child, seen);
}

describe("managed-site contract compatibility", () => {
  it("accepts an exact pair and returns frozen deterministic evidence", () => {
    const result = validate(makeCase());
    assert.deepEqual(result, {
      kind: "compatible",
      addedStableIds: [],
      addedContentValueCount: 0,
      addedAssetManifestCount: 0,
    });
    assertDeepFrozen(result);
  });

  it("accepts additive declarations, values and resolver movement", () => {
    const testCase = makeCase();
    const addedIds = addCodeOwnedField(testCase);
    object(
      field(testCase.candidate, testCase.candidate.ids.bodyField).resolver,
    ).pointer = "/hero/refactoredBody";
    values(testCase.candidate).reverse();

    const result = validate(testCase);
    assert.deepEqual(result.addedStableIds, [...addedIds].sort());
    assert.equal(result.addedContentValueCount, 1);
  });

  it("rejects removed declarations and revived tombstones", () => {
    const removed = makeCase();
    objects(removed.candidate.contract.atomicAliasGroups).splice(0, 1);
    assertCode(removed, "COMPATIBILITY_DECLARATION_REMOVED");

    const revived = makeCase((fixture) => {
      strings(fixture.contract.tombstonedIds).push(fixtureId("field"));
    });
    strings(revived.candidate.contract.tombstonedIds).splice(0, 1);
    assertCode(revived, "COMPATIBILITY_TOMBSTONE_REMOVED");
  });

  it("rejects managed runtime identity changes", () => {
    const cases: readonly FixtureMutation[] = [
      (fixture) => {
        fixture.contract.contractId = fixtureId("contract");
      },
      (fixture) => {
        object(fixture.contract.adapter).kind = "astro";
      },
      (fixture) => {
        const bridge = object(fixture.contract.bridge);
        object(bridge.delivery).integrity = `sha384-${"b".repeat(64)}`;
      },
    ];
    for (const mutate of cases) {
      const testCase = makeCase();
      mutate(testCase.candidate);
      assertCode(testCase, "COMPATIBILITY_RUNTIME_CHANGED");
    }
  });

  it("rejects changed production values independent of array ordering", () => {
    const changed = makeCase();
    contentValue(changed.candidate, changed.candidate.ids.bodyField).value =
      "Changed copy";
    assertCode(changed, "COMPATIBILITY_CONTENT_CHANGED");

    const reorderedItems = makeCase((fixture) => {
      addSecondFixtureItem(fixture);
    });
    const collectionValue = contentValue(
      reorderedItems.candidate,
      reorderedItems.candidate.ids.collectionField,
    );
    object(collectionValue.value).orderedItemIds = strings(
      object(collectionValue.value).orderedItemIds,
    ).reverse();
    assertCode(reorderedItems, "COMPATIBILITY_CONTENT_CHANGED");
  });

  it("rejects field identity, authority and usage regressions", () => {
    const cases: readonly FixtureMutation[] = [
      (fixture) => {
        const body = field(fixture, fixture.ids.bodyField);
        body.type = "heading_text";
        body.semanticLevel = 2;
        delete body.semantic;
      },
      (fixture) => {
        const body = field(fixture, fixture.ids.bodyField);
        body.classification = "code_owned_interface";
        body.capabilities = [];
      },
      (fixture) => {
        const link = field(fixture, fixture.ids.linkField);
        link.capabilities = ["link.label.edit"];
      },
      (fixture) => {
        const rich = field(fixture, fixture.ids.richField);
        rich.usages = objects(rich.usages).slice(0, 1);
      },
      (fixture) => {
        field(fixture, fixture.ids.titleField).semanticLevel = 2;
        const internalSeo = object(fixture.contract.internalSeo);
        const pageSeo = objects(internalSeo.pages)[0];
        objects(pageSeo.headingOutline)[0].semanticLevel = 2;
      },
    ];
    for (const mutate of cases) {
      const testCase = makeCase();
      mutate(testCase.candidate);
      assertCode(testCase, "COMPATIBILITY_FIELD_POLICY_NARROWED");
    }
  });

  it("rejects text, rich-text and link input-space narrowing", () => {
    const cases: readonly FixtureMutation[] = [
      (fixture) => {
        object(field(fixture, fixture.ids.bodyField).constraints).minLength = 2;
      },
      (fixture) => {
        object(field(fixture, fixture.ids.bodyField).constraints).maxLength =
          100;
      },
      (fixture) => {
        object(field(fixture, fixture.ids.richField).constraints).maxNodes = 49;
      },
      (fixture) => {
        object(
          field(fixture, fixture.ids.richField).constraints,
        ).maxCharacters = 499;
      },
      (fixture) => {
        object(
          field(fixture, fixture.ids.linkField).constraints,
        ).allowedTargets = [];
      },
      (fixture) => {
        object(
          object(field(fixture, fixture.ids.linkField).constraints)
            .labelConstraints,
        ).maxLength = 79;
      },
    ];
    for (const mutate of cases) {
      const testCase = makeCase();
      mutate(testCase.candidate);
      assertCode(testCase, "COMPATIBILITY_FIELD_POLICY_NARROWED");
    }
  });

  it("accepts field and asset input-space widening", () => {
    const testCase = makeCase();
    Object.assign(
      object(
        field(testCase.candidate, testCase.candidate.ids.bodyField).constraints,
      ),
      { minLength: 0, maxLength: 200, newlines: "allow" },
    );
    const rich = object(
      field(testCase.candidate, testCase.candidate.ids.richField).constraints,
    );
    rich.maxCharacters = 600;
    rich.maxNodes = 60;
    rich.allowedBlocks = ["paragraph", "ordered_list"];
    rich.allowedMarks = ["bold", "italic"];
    rich.allowedTargets = ["same_window", "new_window"];
    asset(testCase.candidate).maxWidth = 3;
    asset(testCase.candidate).maxBytes = 2;

    assert.doesNotThrow(() => validate(testCase));
  });

  it("rejects collection-policy narrowing while allowing widened bounds", () => {
    const cases: readonly FixtureMutation[] = [
      (fixture) => {
        collection(fixture).minItems = 1;
      },
      (fixture) => {
        collection(fixture).maxItems = 9;
      },
      (fixture) => {
        objects(collection(fixture).uniqueness).push({
          fieldIds: [fixture.ids.itemHeadingField],
          comparison: "exact",
        });
      },
      (fixture) => {
        object(collection(fixture).deletion).restorable = false;
      },
      (fixture) => {
        object(collection(fixture).deletion).whenReferenced = "cascade";
      },
    ];
    for (const mutate of cases) {
      const testCase = makeCase();
      mutate(testCase.candidate);
      assertCode(testCase, "COMPATIBILITY_COLLECTION_POLICY_NARROWED");
    }

    const widened = makeCase();
    collection(widened.candidate).maxItems = 20;
    assert.doesNotThrow(() => validate(widened));
  });

  it("rejects asset-policy narrowing across independent policy dimensions", () => {
    const cases: readonly FixtureMutation[] = [
      (fixture) => {
        asset(fixture).maxWidth = 1;
      },
      (fixture) => {
        asset(fixture).acceptedMimeTypes = ["image/png"];
      },
      (fixture) => {
        asset(fixture).aspectRatios = [{ width: 2, height: 1 }];
      },
      (fixture) => {
        asset(fixture).semantics = { kind: "fixed_alt", altText: "Fixed" };
      },
      (fixture) => {
        asset(fixture).cropPolicy = "forbidden";
      },
      (fixture) => {
        asset(fixture).focalPointPolicy = "required";
      },
    ];
    for (const mutate of cases) {
      const testCase = makeCase();
      mutate(testCase.candidate);
      assertCode(testCase, "COMPATIBILITY_ASSET_POLICY_NARROWED");
    }

    const byteLimit = makeCase((fixture) => {
      asset(fixture).maxBytes = 2;
    });
    asset(byteLimit.candidate).maxBytes = 1;
    assertCode(byteLimit, "COMPATIBILITY_ASSET_POLICY_NARROWED");
  });

  it("rejects atomic alias membership drift", () => {
    const testCase = makeCase();
    const alias = objects(testCase.candidate.contract.atomicAliasGroups)[0];
    alias.fieldIds = strings(alias.fieldIds).slice(0, 1);
    assertCode(testCase, "COMPATIBILITY_ALIAS_CHANGED");

    const captured = makeCase();
    objects(captured.candidate.contract.atomicAliasGroups).push({
      id: fixtureId("alias"),
      fieldIds: [captured.candidate.ids.linkField],
    });
    assertCode(captured, "COMPATIBILITY_ALIAS_CHANGED");
  });
});

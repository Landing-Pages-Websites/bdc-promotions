import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as publicApi from "../src/index.js";
import type {
  ManagedRichTextDocument,
  ManagedSiteContentDocument,
  ManagedSiteContractV1,
} from "../src/index.js";
import {
  assetSlot,
  collectionDescriptor,
  contentDocument,
  imageValue,
  internalProtectedField,
  managedSiteContract,
  plainTextField,
  richTextContentValue,
  richTextDocument,
  seoDescriptor,
  stableId,
} from "./schema-fixtures.js";
import { conformingContract } from "./contract-semantics-fixture.js";

type Surface = {
  readonly name: string;
  readonly args: readonly object[];
  readonly invoke: (args: readonly object[]) => unknown;
};

const plainContentValue = {
  fieldId: stableId("field"),
  owner: { kind: "site" },
  type: "plain_text",
  value: "Hello",
};
const collectionContentValue = {
  ...plainContentValue,
  type: "collection",
  value: { orderedItemIds: [stableId("item")] },
};
const richDocument = richTextDocument([
  { type: "paragraph", children: [{ type: "text", text: "Hello", marks: [] }] },
]);

const surfaces: readonly Surface[] = [
  surface("parseManagedRichTextDocument", [richDocument]),
  surface("parseManagedFieldDescriptor", [plainTextField()]),
  surface("parseManagedCollectionDescriptor", [collectionDescriptor()]),
  surface("parseManagedSiteContentValue", [plainContentValue]),
  surface("parseManagedSiteContentDocument", [contentDocument()]),
  surface("parseManagedInternalProtectedField", [internalProtectedField()]),
  surface("parseManagedSiteSeoDescriptor", [seoDescriptor()]),
  surface("parseManagedSiteContractV1", [managedSiteContract()]),
  surface("validateManagedFieldValue", [plainTextField(), plainContentValue]),
  surface("validateManagedCollectionValue", [collectionDescriptor(), collectionContentValue]),
  surface("validateManagedImageValue", [assetSlot(), imageValue()]),
];

function surface(name: keyof typeof publicApi, args: readonly object[]): Surface {
  const candidate = publicApi[name];
  assert.equal(typeof candidate, "function", `${name} must be a function`);
  const callable = candidate as (...values: readonly object[]) => unknown;
  return { name, args, invoke: (values) => callable(...values) };
}

function accessorInput(input: object, calls: { count: number }): object {
  const clone = structuredClone(input) as Record<string, unknown>;
  const [key] = Object.keys(clone);
  assert.notEqual(key, undefined);
  const value = clone[key];
  Object.defineProperty(clone, key, {
    enumerable: true,
    get() {
      calls.count += 1;
      return value;
    },
  });
  return clone;
}

function revokedProxy(input: object): object {
  const revocable = Proxy.revocable(structuredClone(input), {});
  revocable.revoke();
  return revocable.proxy;
}

function assertDeepFrozen(input: unknown, seen = new Set<object>()): void {
  if (input === null || typeof input !== "object" || seen.has(input)) return;
  seen.add(input);
  assert.equal(Object.isFrozen(input), true);
  for (const value of Object.values(input)) assertDeepFrozen(value, seen);
}

function assertDeepReadonlyTypes(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  richText: ManagedRichTextDocument,
): void {
  // @ts-expect-error public contract arrays are deeply readonly
  contract.pages.push(contract.pages[0]);
  // @ts-expect-error nested content owners are deeply readonly
  content.values[0].owner.kind = "site";
  // @ts-expect-error nested rich-text arrays are deeply readonly
  richText.children[0].children = [];
}
void assertDeepReadonlyTypes;

describe("public managed-site surface", () => {
  it("exports only safe C2 functions, types, and frozen constants", () => {
    const actual = Object.keys(publicApi)
      .filter((name) => /^(parseManaged|validateManaged)/u.test(name))
      .sort();
    assert.deepEqual(
      actual,
      [
        ...surfaces.map(({ name }) => name),
        "validateManagedSiteContentDocumentJsonSchema",
        "validateManagedSiteContractV1JsonSchema",
        "validateManagedSiteContractV1Semantics",
      ].sort(),
    );
    assert.deepEqual(
      Object.keys(publicApi).filter(
        (name) =>
          name.endsWith("Schema") &&
          typeof publicApi[name as keyof typeof publicApi] !== "function",
      ),
      [],
    );
    assert.equal(Object.isFrozen(publicApi.MANAGED_FIELD_CAPABILITIES), true);
    assert.equal(Object.isFrozen(publicApi.MANAGED_SITE_JSON_SCHEMA_BUNDLE_V1), true);
  });

  it("rejects accessors and revoked proxies at every argument boundary", () => {
    for (const target of surfaces) {
      for (const [index] of target.args.entries()) {
        const calls = { count: 0 };
        const accessorArgs = target.args.map((arg, argIndex) =>
          argIndex === index ? accessorInput(arg, calls) : arg,
        );
        assert.throws(() => target.invoke(accessorArgs), target.name);
        assert.equal(calls.count, 0, target.name);
        const proxyArgs = target.args.map((arg, argIndex) =>
          argIndex === index ? revokedProxy(arg) : arg,
        );
        assert.throws(() => target.invoke(proxyArgs), target.name);
      }
    }
  });

  it("returns a deeply frozen graph from every public parser and validator", () => {
    for (const target of surfaces) assertDeepFrozen(target.invoke(target.args));
  });

  it("exposes only frozen C3B-deferred item IDs from semantic validation", () => {
    const contract = publicApi.parseManagedSiteContractV1(conformingContract());
    const result = publicApi.validateManagedSiteContractV1Semantics(contract);
    assertDeepFrozen(result);
    assert.equal(result.deferred.itemIds.length, 1);
  });

  it("rejects oversized rich text through every accepting public surface", () => {
    const oversized = richTextContentValue("https://example.com");
    const value = oversized.value as Record<string, unknown>;
    const paragraph = (value.children as Record<string, unknown>[])[0];
    const link = (paragraph.children as Record<string, unknown>[])[0];
    (link.children as Record<string, unknown>[])[0].text = "x".repeat(131_073);
    const document = { schemaVersion: "1.0", values: [oversized], assetManifest: [] };
    const richField = structuredClone(plainTextField());
    Object.assign(richField, {
      type: "rich_text",
      capabilities: ["text.edit"],
      constraints: {
        maxCharacters: 131_072,
        maxNodes: 2_000,
        allowedBlocks: ["paragraph"],
        allowedMarks: [],
        allowLinks: true,
        allowedExternalHosts: ["example.com"],
        allowedTargets: ["same_window"],
      },
    });
    delete richField.semantic;
    assert.throws(() => publicApi.parseManagedRichTextDocument(value));
    assert.throws(() => publicApi.parseManagedSiteContentValue(oversized));
    assert.throws(() => publicApi.parseManagedSiteContentDocument(document));
    assert.throws(() => publicApi.validateManagedFieldValue(richField, oversized));
  });
});

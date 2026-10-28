import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  parseManagedCollectionDescriptor,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  projectManagedSiteContentDocumentV1,
  validateManagedFieldValue,
  validateManagedSiteContentDocumentJsonSchema,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import { isCompatibilityFieldWidened } from "../src/contract-compatibility-constraints.js";
import type { ManagedCollectionItemField } from "../src/fields.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";
import { sourceProjectionFixture } from "./source-projection-fixture.js";

/**
 * 0.36.0: an item's image may be declared optional ("a network with no honest
 * photo yet"). Invariant: an item's image value is `null` only where its field
 * is declared optional; a `null` is no picture (no manifest material, nothing
 * rendered), and nothing that needs a picture on every item (a share card, a
 * uniqueness rule) may name such a field. Required may become optional, never
 * back.
 */

type JsonObject = Record<string, unknown>;

const PHOTO_POINTER = "/photo";
const LINK_CONSTRAINTS = {
  labelConstraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
  authority: "internal_only",
  allowedSchemes: [],
  allowedExternalHosts: [],
  fragmentPolicy: "forbid",
  allowedFragments: [],
  allowedTargets: ["same_window"],
};

/** An item image field; an override of `undefined` leaves that key out, as JSON would. */
function photoField(overrides: JsonObject = {}): JsonObject {
  const field: JsonObject = {
    id: fixtureId("field"),
    type: "image",
    classification: "customer_editable",
    capabilities: ["image.upload", "image.alt.edit"],
    itemPointer: PHOTO_POINTER,
    presentation: { name: "Photo", description: null, group: "Photos", order: 60, example: null },
    optional: true,
    ...overrides,
  };
  for (const key of Object.keys(field)) if (field[key] === undefined) delete field[key];
  return field;
}

function imageValue(path = "public/images/managed.webp"): JsonObject {
  return {
    path,
    sha256: "a".repeat(64),
    mimeType: "image/webp",
    width: 1,
    height: 1,
    bytes: 1,
    altText: "Managed image",
    crop: null,
    focalPoint: null,
  };
}

function collectionOf(fixture: ContentSemanticsFixture): JsonObject & { itemFields: JsonObject[]; uniqueness: JsonObject[] } {
  return (fixture.contract.collections as JsonObject[])[0] as JsonObject & {
    itemFields: JsonObject[];
    uniqueness: JsonObject[];
  };
}

function valuesOf(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.content.values as JsonObject[];
}

/** The fixture with one more item image field on the slot the fixture's images use, holding `value`. */
function withPhoto(field: JsonObject, value: unknown): ContentSemanticsFixture {
  const fixture = contentSemanticsFixture();
  const declared = { ...field, assetSlotId: fixture.ids.asset };
  collectionOf(fixture).itemFields.push(declared);
  valuesOf(fixture).push({
    fieldId: declared.id,
    owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item },
    type: "image",
    value,
  });
  return fixture;
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

function outcome(check: () => unknown): "accepted" | "rejected" {
  try {
    check();
    return "accepted";
  } catch {
    return "rejected";
  }
}

describe("declaring an optional item image", () => {
  const base = contentSemanticsFixture();
  const collection = structuredClone(collectionOf(base));
  const withField = (field: JsonObject) => ({
    ...collection,
    itemFields: [...collection.itemFields, field.type === "image" ? { ...field, assetSlotId: base.ids.asset } : field],
  });
  const cases: readonly [string, JsonObject, "accepted" | "rejected"][] = [
    ["optional: true", photoField(), "accepted"],
    ["no optional key (required, as before)", photoField({ optional: undefined }), "accepted"],
    ["optional: false (one meaning, one spelling)", photoField({ optional: false }), "rejected"],
    ["optional: \"true\"", photoField({ optional: "true" }), "rejected"],
    ["optional: null", photoField({ optional: null }), "rejected"],
    ["optional on a text item field", { ...photoField(), type: "plain_text", semantic: "label", capabilities: ["text.edit"], constraints: { minLength: 0, maxLength: 40, newlines: "forbid" } }, "rejected"],
    ["optional on a link item field (since 0.37.0)", { ...photoField(), type: "link", capabilities: ["link.destination.edit"], constraints: LINK_CONSTRAINTS }, "accepted"],
    ["the same link item field without optional (control)", { ...photoField({ optional: undefined }), type: "link", capabilities: ["link.destination.edit"], constraints: LINK_CONSTRAINTS }, "accepted"],
    ["the same text item field without optional (control)", { ...photoField({ optional: undefined }), type: "plain_text", semantic: "label", capabilities: ["text.edit"], constraints: { minLength: 0, maxLength: 40, newlines: "forbid" } }, "accepted"],
  ];
  for (const [name, field, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => {
      const declared = JSON.parse(JSON.stringify(field)) as JsonObject;
      assert.equal(outcome(() => parseManagedCollectionDescriptor(withField(declared))), expected);
    });
  }

  it("refuses optional on a page's own image field", () => {
    const fixture = contentSemanticsFixture();
    const page = (fixture.contract.pages as JsonObject[])[0] as { sections: { fields: JsonObject[] }[] };
    const image = page.sections[0].fields.find((field) => field.type === "image") as JsonObject;
    image.optional = true;
    assert.equal(outcome(() => parseManagedSiteContractV1(fixture.contract)), "rejected");
  });

  it("refuses a uniqueness rule naming an optional image, and admits one naming a required image", () => {
    const optional = photoField();
    const required = photoField({ optional: undefined, id: fixtureId("field"), itemPointer: "/portrait" });
    const descriptor = (rule: string) => ({
      ...withField(optional),
      itemFields: [...collection.itemFields, { ...optional, assetSlotId: base.ids.asset }, { ...required, assetSlotId: base.ids.asset }],
      uniqueness: [...collection.uniqueness, { fieldIds: [rule], comparison: "exact" }],
    });
    assert.equal(outcome(() => parseManagedCollectionDescriptor(descriptor(optional.id as string))), "rejected");
    assert.equal(outcome(() => parseManagedCollectionDescriptor(descriptor(required.id as string))), "accepted");
  });
});

describe("a customer who may empty an optional image can fill it again", () => {
  function judgeWith(capabilities: readonly string[], semantics: JsonObject, classification = "customer_editable"): string {
    const fixture = contentSemanticsFixture();
    const slotId = fixtureId("asset");
    const assets = fixture.contract.assets as JsonObject[];
    assets.push({ ...structuredClone(assets[0]), id: slotId, semantics });
    const field = { ...photoField({ capabilities, classification }), assetSlotId: slotId };
    collectionOf(fixture).itemFields.push(field);
    valuesOf(fixture).push({
      fieldId: field.id,
      owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item },
      type: "image",
      value: null,
    });
    return judge(fixture);
  }
  const informative = { kind: "informative" };
  const decorative = { kind: "decorative" };
  const fixedAlt = { kind: "fixed_alt", altText: "Network photo" };
  const cases: readonly [string, readonly string[], JsonObject, string][] = [
    ["upload and alt on an informative slot", ["image.upload", "image.alt.edit"], informative, "accepted"],
    ["upload only on a decorative slot", ["image.upload"], decorative, "accepted"],
    ["upload only on a fixed-alt slot", ["image.upload"], fixedAlt, "accepted"],
    ["upload only on an informative slot (a first picture needs alt text)", ["image.upload"], informative, "CONTRACT_OPTIONAL_FIELD_POLICY"],
    ["alt only (no upload)", ["image.alt.edit"], decorative, "CONTRACT_OPTIONAL_FIELD_POLICY"],
    ["crop and focal point only", ["image.crop", "image.focal_point.edit"], decorative, "CONTRACT_OPTIONAL_FIELD_POLICY"],
  ];
  for (const [name, capabilities, semantics, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => assert.equal(judgeWith(capabilities, semantics), expected));
  }
  it("accepts a code-owned optional image, which no customer empties", () =>
    assert.equal(judgeWith([], informative, "code_owned_interface"), "accepted"));
});

describe("an item's image value", () => {
  const cases: readonly [string, () => ContentSemanticsFixture, string][] = [
    ["an optional image holding none", () => withPhoto(photoField(), null), "accepted"],
    ["an optional image holding a picture", () => withPhoto(photoField(), imageValue()), "accepted"],
    ["a required image holding none", () => withPhoto(photoField({ optional: undefined }), null), "CONTENT_VALUE_POLICY"],
    [
      "the fixture's own required item image holding none",
      () => {
        const fixture = contentSemanticsFixture();
        (valuesOf(fixture).find((value) => value.fieldId === fixture.ids.itemImageField) as JsonObject).value = null;
        return fixture;
      },
      "CONTENT_VALUE_POLICY",
    ],
    [
      "a page image holding none",
      () => {
        const fixture = contentSemanticsFixture();
        (valuesOf(fixture).find((value) => value.fieldId === fixture.ids.imageField) as JsonObject).value = null;
        return fixture;
      },
      "CONTENT_VALUE_POLICY",
    ],
    [
      "an optional image with no value row at all (absence is null, not omission)",
      () => {
        const fixture = withPhoto(photoField(), null);
        valuesOf(fixture).pop();
        return fixture;
      },
      "CONTENT_ITEM_VALUE_MISSING",
    ],
    [
      "an optional image holding none while the manifest keeps material only it named",
      () => {
        const fixture = withPhoto(photoField(), null);
        (fixture.content.assetManifest as JsonObject[]).push({
          assetSlotId: fixture.ids.asset,
          path: "public/images/removed.webp",
          sha256: "b".repeat(64),
          mimeType: "image/webp",
          width: 1,
          height: 1,
          bytes: 1,
        });
        return fixture;
      },
      "CONTENT_ASSET_MANIFEST_UNUSED",
    ],
    [
      "an optional image holding a picture the manifest does not carry",
      () => withPhoto(photoField(), imageValue("public/images/other.webp")),
      "CONTENT_ASSET_MANIFEST_MISMATCH",
    ],
    ["an optional image holding an empty object", () => withPhoto(photoField(), {}), "CONTRACT_SCHEMA_INVALID"],
  ];
  for (const [name, build, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : `refuses (${expected})`} ${name}`, () => {
      const verdict = judge(build());
      if (expected === "CONTRACT_SCHEMA_INVALID") assert.notEqual(verdict, "accepted");
      else assert.equal(verdict, expected);
    });
  }

  it("the JSON Schema admits a null image value, as zod does, and still refuses a malformed one", () => {
    const fixture = withPhoto(photoField(), null);
    assert.equal(validateManagedSiteContentDocumentJsonSchema(fixture.content).valid, true);
    const malformed = withPhoto(photoField(), { path: 7 });
    assert.equal(validateManagedSiteContentDocumentJsonSchema(malformed.content).valid, false);
  });
});

describe("nothing that needs a value on every item may name an optional image", () => {
  type Generated = { metadata: { social: JsonObject }; primaryImageFieldId: unknown; jsonLd: JsonObject[]; headingOutline: JsonObject[] };
  const generatedOf = (fixture: ContentSemanticsFixture) =>
    ((fixture.contract.internalSeo as JsonObject).generatedPages as Generated[])[0];
  /** The fixture with a new optional photo, named from `place`; the fixture's own share and primary images are left alone. */
  function namedFrom(place: (generated: Generated, photoId: string) => void): string {
    const fixture = withPhoto(photoField(), null);
    place(generatedOf(fixture), collectionOf(fixture).itemFields.at(-1)?.id as string);
    return judge(fixture);
  }
  const cases: readonly [string, (generated: Generated, photoId: string) => void][] = [
    ["a generated page's share image", (generated, photoId) => void (generated.metadata.social.imageFieldId = photoId)],
    ["a generated page's primary image", (generated, photoId) => void (generated.primaryImageFieldId = photoId)],
    ["a required JSON-LD declaration's item source", (generated, photoId) => void generated.jsonLd.push({ schemaType: "Product", required: true, itemSourceFieldIds: [photoId], siteSourceFieldIds: [], requiredOutputProperties: ["image"] })],
    ["an optional JSON-LD declaration's item source", (generated, photoId) => void generated.jsonLd.push({ schemaType: "ImageObject", required: false, itemSourceFieldIds: [photoId], siteSourceFieldIds: [], requiredOutputProperties: ["contentUrl"] })],
  ];
  for (const [name, place] of cases) {
    it(`refuses ${name}`, () => assert.equal(namedFrom(place), "CONTRACT_OPTIONAL_FIELD_REFERENCE"));
  }

  it("accepts the same photo named from nowhere (control)", () => assert.equal(namedFrom(() => undefined), "accepted"));

  it("refuses the fixture's own share and primary image becoming optional", () => {
    const fixture = contentSemanticsFixture();
    (collectionOf(fixture).itemFields.find((field) => field.id === fixture.ids.itemImageField) as JsonObject).optional = true;
    assert.equal(judge(fixture), "CONTRACT_OPTIONAL_FIELD_REFERENCE");
  });
});

describe("an optional image on a slot of its own", () => {
  /** An optional photo on its own slot, every item holding none, with `entries` in the manifest for that slot. */
  function ownSlot(entries: number): string {
    const fixture = contentSemanticsFixture();
    const slotId = fixtureId("asset");
    const assets = fixture.contract.assets as JsonObject[];
    assets.push({ ...structuredClone(assets[0]), id: slotId });
    const field = { ...photoField(), assetSlotId: slotId };
    collectionOf(fixture).itemFields.push(field);
    valuesOf(fixture).push({
      fieldId: field.id,
      owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item },
      type: "image",
      value: null,
    });
    for (let index = 0; index < entries; index += 1) {
      (fixture.content.assetManifest as JsonObject[]).push({
        assetSlotId: slotId,
        path: `public/images/removed-${index}.webp`,
        sha256: "b".repeat(64),
        mimeType: "image/webp",
        width: 1,
        height: 1,
        bytes: 1,
      });
    }
    return judge(fixture);
  }

  it("accepts every item holding none and no material", () => assert.equal(ownSlot(0), "accepted"));
  it("refuses one leftover picture nothing shows", () => assert.equal(ownSlot(1), "CONTENT_ASSET_MANIFEST_UNUSED"));
  it("refuses two leftover pictures nothing shows", () => assert.equal(ownSlot(2), "CONTENT_ASSET_MANIFEST_UNUSED"));
});

describe("validateManagedFieldValue refuses an empty image where one is required", () => {
  it("names a page image holding none FIELD_VALUE_IMAGE_REQUIRED", () => {
    const fixture = contentSemanticsFixture();
    const page = (fixture.contract.pages as JsonObject[])[0] as { sections: { fields: JsonObject[] }[] };
    const image = page.sections[0].fields.find((field) => field.id === fixture.ids.imageField) as JsonObject;
    assert.throws(
      () => validateManagedFieldValue(image, { fieldId: image.id, owner: { kind: "page", pageId: fixture.ids.homePage }, type: "image", value: null }),
      (error: unknown) => error instanceof ManagedSiteContractError && error.code === "FIELD_VALUE_IMAGE_REQUIRED",
    );
  });
});

describe("a code change keeps every image production may hold", () => {
  function widened(production: JsonObject, candidate: JsonObject): boolean {
    const collection = { ...collectionOf(contentSemanticsFixture()) };
    const asset = contentSemanticsFixture().ids.asset;
    const parse = (field: JsonObject) =>
      parseManagedCollectionDescriptor({ ...collection, itemFields: [...collection.itemFields, { ...field, assetSlotId: field.assetSlotId ?? asset }] }).itemFields.at(-1) as ManagedCollectionItemField;
    return isCompatibilityFieldWidened({ kind: "item", descriptor: parse(production) }, { kind: "item", descriptor: parse(candidate) });
  }
  const id = fixtureId("field");
  const required = photoField({ id, optional: undefined });
  const optional = photoField({ id });
  const cases: readonly [string, JsonObject, JsonObject, boolean][] = [
    ["required stays required", required, required, true],
    ["required becomes optional", required, optional, true],
    ["optional stays optional", optional, optional, true],
    ["optional becomes required", optional, required, false],
    ["optional moves to another slot", optional, { ...optional, assetSlotId: fixtureId("asset") }, false],
  ];
  for (const [name, production, candidate, expected] of cases) {
    it(`${expected ? "admits" : "refuses"} ${name}`, () => {
      const parsed = JSON.parse(JSON.stringify({ production, candidate })) as { production: JsonObject; candidate: JsonObject };
      assert.equal(widened(parsed.production, parsed.candidate), expected);
    });
  }

  it("a whole-site change making an image optional is compatible, and the reverse is refused", () => {
    const optionalSite = withPhoto(photoField({ id }), imageValue());
    const requiredSite = withPhoto(photoField({ id, optional: undefined }), imageValue());
    const check = (from: ContentSemanticsFixture, to: ContentSemanticsFixture) => {
      try {
        validateManagedSiteContractV1Compatibility(
          parseManagedSiteContractV1(from.contract),
          parseManagedSiteContentDocument(from.content),
          parseManagedSiteContractV1(to.contract),
          parseManagedSiteContentDocument(to.content),
        );
        return "compatible";
      } catch (error) {
        return error instanceof ManagedSiteContractError ? error.code : String(error);
      }
    };
    const sameIds = (fixture: ContentSemanticsFixture) => JSON.parse(JSON.stringify(fixture).replaceAll(optionalSite.ids.collection, requiredSite.ids.collection)) as ContentSemanticsFixture;
    assert.equal(requiredSite.ids.collection, optionalSite.ids.collection);
    assert.equal(check(requiredSite, sameIds(optionalSite)), "compatible");
    assert.equal(check(optionalSite, requiredSite), "COMPATIBILITY_FIELD_POLICY_NARROWED");
  });
});

describe("projecting an optional image from its source", () => {
  function project(photo: unknown): { readonly value: unknown; readonly manifestPaths: readonly string[] } {
    const fixture = sourceProjectionFixture();
    const field = { ...photoField(), assetSlotId: fixture.ids.asset };
    (fixture.contract.collections as { itemFields: JsonObject[] }[])[0].itemFields.push(field);
    const site = fixture.sourceDocuments[0].value as { services: JsonObject[] };
    site.services[0].photo = photo;
    const content = projectManagedSiteContentDocumentV1(
      parseManagedSiteContractV1(fixture.contract),
      fixture.sourceDocuments as never,
    );
    return {
      value: content.values.find((value) => value.fieldId === field.id)?.value,
      manifestPaths: content.assetManifest.map((entry) => entry.path),
    };
  }

  it("projects a null at the item's pointer to a null value, adding no material", () => {
    const projected = project(null);
    assert.equal(projected.value, null);
    assert.deepEqual(projected.manifestPaths, ["public/images/managed.webp"]);
  });

  it("projects a picture at the item's pointer as before", () => {
    assert.deepEqual(project(imageValue()).value, imageValue());
  });

  it("refuses an item whose source has no photo key at all", () => {
    assert.throws(() => project(undefined));
  });
});

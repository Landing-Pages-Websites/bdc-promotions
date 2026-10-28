import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { Ajv2020 } from "ajv/dist/2020.js";

import { generateManagedSiteFieldMigrationJsonSchemaV1 } from "../src/field-migration-json-schema.js";
import {
  managedImageFileMaterialV1,
  ManagedSiteContractError,
  managedSiteFieldMigrationFromV1,
  managedSiteFieldMigrationImagePathsV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1MigrationCompatibility,
  type ManagedSiteFieldMigrationImageMetadataStepProofV1,
  type ManagedSiteFieldMigrationProofV1,
  type ManagedSiteImageFileReader,
} from "../src/index.js";
import { contentSemanticsFixture } from "./content-semantics-fixture.js";

/**
 * 0.42.0: a declared `image-metadata` step corrects what production states
 * about an image file whose bytes do not change (All Points Media's seven
 * "Venue networks" photos are stored 1500x1125 with EXIF orientation 6 and
 * shown 1125x1500). Invariant: only `mimeType`, `width`, `height` and
 * `bytes` move, on every value and manifest entry naming the path, and only
 * to exactly what the committed file's own bytes derive (EXIF-aware), bound
 * to production's digest; alt text, crop, focal point, path and digest stay;
 * anything unreadable or underivable is refused.
 */

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/image-material");
const PHOTO = "public/images/photo.jpg";
const OTHER = "public/images/other.jpg";

type Json = Record<string, unknown>;

interface Case {
  productionContract: Json;
  productionContent: Json;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
  files: Map<string, Uint8Array>;
  reader: "files" | "none";
}

function file(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(FIXTURES, name)));
}

/** What production states for a file: its stored (unrotated) size. */
function storedMaterial(bytes: Uint8Array, stored: { width: number; height: number }): Json {
  const derived = managedImageFileMaterialV1(bytes);
  return { sha256: derived.sha256, mimeType: derived.mimeType, width: stored.width, height: stored.height, bytes: derived.bytes };
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

function manifest(content: Json): Json[] {
  return content.assetManifest as Json[];
}

function imageValuesAt(content: Json, path: string): Json[] {
  return values(content).filter((value) => value.type === "image" && (value.value as Json | null)?.path === path);
}

/**
 * The content-semantics fixture with its page image and its item image both
 * naming PHOTO (orientation 6, stored 40x30, shown 30x40) as production states
 * it, and a slot that admits either orientation.
 */
function baseline(): { contract: Json; content: Json; ids: ReturnType<typeof contentSemanticsFixture>["ids"] } {
  const fixture = contentSemanticsFixture();
  const contract = fixture.contract;
  const slot = (contract.assets as Json[])[0];
  Object.assign(slot, {
    acceptedMimeTypes: ["image/jpeg"],
    outputMimeTypes: ["image/jpeg"],
    minWidth: 1,
    maxWidth: 100,
    minHeight: 1,
    maxHeight: 100,
    aspectRatios: [{ width: 4, height: 3 }, { width: 3, height: 4 }],
    maxBytes: 100_000,
  });
  const material = storedMaterial(file("jpeg-orientation-6.jpg"), { width: 40, height: 30 });
  for (const value of values(fixture.content)) {
    if (value.type !== "image") continue;
    value.value = { ...(value.value as Json), path: PHOTO, ...material, altText: "A poster", crop: null, focalPoint: { x: 0.5, y: 0.4 } };
  }
  fixture.content.assetManifest = [{ assetSlotId: slot.id, path: PHOTO, ...material }];
  return { contract, content: fixture.content, ids: fixture.ids };
}

/** Writes the corrected metadata onto every value and manifest entry naming `path`. */
function correct(content: Json, path: string, metadata: Json): void {
  for (const value of imageValuesAt(content, path)) value.value = { ...(value.value as Json), ...metadata };
  for (const entry of manifest(content)) if (entry.path === path) Object.assign(entry, metadata);
}

const TRUE_PHOTO = { mimeType: "image/jpeg", width: 30, height: 40, bytes: file("jpeg-orientation-6.jpg").length };

function correctionCase(): Case {
  const { contract, content } = baseline();
  const candidateContent = structuredClone(content);
  correct(candidateContent, PHOTO, TRUE_PHOTO);
  return {
    productionContract: contract,
    productionContent: content,
    candidateContract: structuredClone(contract),
    candidateContent,
    declaration: { schemaVersion: "1.0", from: {}, steps: [{ op: "image-metadata", images: [{ path: PHOTO, ...TRUE_PHOTO }] }] },
    files: new Map([[PHOTO, file("jpeg-orientation-6.jpg")]]),
    reader: "files",
  };
}

function verify(migration: Case): ManagedSiteFieldMigrationProofV1 {
  const productionContract = parseManagedSiteContractV1(migration.productionContract);
  const productionContent = parseManagedSiteContentDocument(migration.productionContent);
  const declaration = { ...migration.declaration, from: managedSiteFieldMigrationFromV1(productionContract, productionContent) };
  const readImageFile: ManagedSiteImageFileReader = (path) => migration.files.get(path) ?? null;
  return validateManagedSiteContractV1MigrationCompatibility(
    productionContract,
    productionContent,
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    declaration,
    migration.reader === "files" ? { admitBridge: () => true, readImageFile } : { admitBridge: () => true },
  );
}

function code(migration: Case): string {
  try {
    verify(migration);
    return "migrated";
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

function images(migration: Case): Json[] {
  return ((migration.declaration.steps as Json[])[0] as Json).images as Json[];
}

function itemImage(content: Json): Json {
  return imageValuesAt(content, PHOTO).find((value) => (value.owner as Json).kind === "collection_item") as Json;
}

describe("an image-metadata step corrects the seven-photo case", () => {
  it("is refused without a declaration, exactly as All Points Media's check:compat refuses it today", () => {
    const migration = correctionCase();
    assert.throws(
      () =>
        validateManagedSiteContractV1Compatibility(
          parseManagedSiteContractV1(migration.productionContract),
          parseManagedSiteContentDocument(migration.productionContent),
          parseManagedSiteContractV1(migration.candidateContract),
          parseManagedSiteContentDocument(migration.candidateContent),
        ),
      (error: unknown) => error instanceof ManagedSiteContractError && error.code.startsWith("COMPATIBILITY_"),
    );
  });

  it("corrects every value and manifest entry naming the file, and proves which", () => {
    const migration = correctionCase();
    const proof = verify(migration);
    const step = proof.steps[0] as ManagedSiteFieldMigrationImageMetadataStepProofV1;
    assert.equal(step.op, "image-metadata");
    assert.equal(step.images.length, 1);
    const [image] = step.images;
    assert.equal(image?.path, PHOTO);
    assert.deepEqual(image?.from, { mimeType: "image/jpeg", width: 40, height: 30, bytes: TRUE_PHOTO.bytes });
    assert.deepEqual(image?.to, TRUE_PHOTO);
    assert.equal(image?.sha256, managedImageFileMaterialV1(file("jpeg-orientation-6.jpg")).sha256);
    assert.deepEqual(image?.values.map((value) => value.owner.kind).sort(), ["collection_item", "page"]);
    assert.equal(image?.assetSlotIds.length, 1);
    assert.equal(proof.accounting.consumed, 2);
    assert.equal(proof.accounting.targets, 2);
    assert.equal(proof.accounting.unchanged + 2, proof.accounting.productionValues);
    assert.deepEqual(proof.additions, { stableIds: [], contentValues: [], assetManifestEntries: 0 });
  });

  it("keeps a customer's own alt text, crop and focal point: only derived metadata moves", () => {
    const migration = correctionCase();
    for (const content of [migration.productionContent, migration.candidateContent]) {
      const value = itemImage(content);
      value.value = { ...(value.value as Json), altText: "Customer's words", crop: { x: 0, y: 0, width: 0.5, height: 0.5 } };
    }
    assert.equal(code(migration), "migrated");
  });

  it("lists the paths a caller must read", () => {
    const declaration = parseManagedSiteFieldMigrationV1({
      schemaVersion: "1.0",
      from: { contractSha256: "a".repeat(64), contentSha256: "b".repeat(64) },
      steps: [
        { op: "image-metadata", images: [{ path: PHOTO, ...TRUE_PHOTO }] },
        { op: "image-metadata", images: [{ path: OTHER, ...TRUE_PHOTO }] },
      ],
    });
    assert.deepEqual(managedSiteFieldMigrationImagePathsV1(declaration), [PHOTO, OTHER]);
  });
});

type Edit = (migration: Case) => void;

/** Every way a declaration or candidate can claim more than the file proves. */
const REFUSALS: ReadonlyArray<readonly [string, Edit, string]> = [
  ["no file reader was given", (m) => { m.reader = "none"; }, "MIGRATION_IMAGE_METADATA_UNOBSERVED"],
  ["the file cannot be read", (m) => { m.files.clear(); }, "MIGRATION_IMAGE_METADATA_UNREADABLE"],
  ["the reader hands back text, not bytes", (m) => { m.files.set(PHOTO, "not bytes" as unknown as Uint8Array); }, "MIGRATION_IMAGE_METADATA_UNREADABLE"],
  ["the bytes are another file of the same size", (m) => { m.files.set(PHOTO, file("jpeg-orientation-8.jpg")); }, "MIGRATION_IMAGE_METADATA_FILE_MISMATCH"],
  ["the bytes are the file and one trailing byte", (m) => { const bytes = file("jpeg-orientation-6.jpg"); m.files.set(PHOTO, new Uint8Array([...bytes, 0])); }, "MIGRATION_IMAGE_METADATA_UNDERIVABLE"],
  ["the bytes are the file cut short", (m) => { const bytes = file("jpeg-orientation-6.jpg"); m.files.set(PHOTO, bytes.slice(0, bytes.length - 1)); }, "MIGRATION_IMAGE_METADATA_UNDERIVABLE"],
  ["declared width and height are the stored ones", (m) => { Object.assign(images(m)[0] as Json, { width: 40, height: 30 }); }, "MIGRATION_IMAGE_METADATA_MISMATCH"],
  ["declared a square", (m) => { Object.assign(images(m)[0] as Json, { width: 30, height: 30 }); }, "MIGRATION_IMAGE_METADATA_MISMATCH"],
  ["declared bytes off by one", (m) => { (images(m)[0] as Json).bytes = TRUE_PHOTO.bytes + 1; }, "MIGRATION_IMAGE_METADATA_MISMATCH"],
  ["declared another format", (m) => { (images(m)[0] as Json).mimeType = "image/webp"; }, "MIGRATION_IMAGE_METADATA_MISMATCH"],
  ["a path production does not name", (m) => { (images(m)[0] as Json).path = OTHER; m.files.set(OTHER, file("jpeg-orientation-6.jpg")); }, "MIGRATION_IMAGE_METADATA_UNKNOWN_PATH"],
  [
    "production already states the truth",
    (m) => {
      correct(m.productionContent, PHOTO, TRUE_PHOTO);
    },
    "MIGRATION_IMAGE_METADATA_UNCHANGED",
  ],
  [
    "a WebP whose EXIF a browser may or may not apply",
    (m) => {
      const bytes = file("webp-exif-orientation-6.webp");
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const material = { sha256, mimeType: "image/webp", width: 40, height: 30, bytes: bytes.length };
      (m.productionContract.assets as Json[])[0]!.acceptedMimeTypes = ["image/jpeg", "image/webp"];
      (m.productionContract.assets as Json[])[0]!.outputMimeTypes = ["image/jpeg", "image/webp"];
      m.candidateContract = structuredClone(m.productionContract);
      correct(m.productionContent, PHOTO, material);
      m.candidateContent = structuredClone(m.productionContent);
      correct(m.candidateContent, PHOTO, { mimeType: "image/webp", width: 30, height: 40 });
      Object.assign(images(m)[0] as Json, { mimeType: "image/webp", width: 30, height: 40, bytes: bytes.length });
      m.files.set(PHOTO, bytes);
    },
    "MIGRATION_IMAGE_METADATA_UNDERIVABLE",
  ],
  ["the candidate leaves the item value uncorrected", (m) => { itemImage(m.candidateContent).value = itemImage(m.productionContent).value; }, "MIGRATION_IMAGE_METADATA_VALUE_MISMATCH"],
  ["the candidate also rewrites the alt text", (m) => { const value = itemImage(m.candidateContent); value.value = { ...(value.value as Json), altText: "Rewritten" }; }, "MIGRATION_IMAGE_METADATA_VALUE_MISMATCH"],
  ["the candidate also crops", (m) => { const value = itemImage(m.candidateContent); value.value = { ...(value.value as Json), crop: { x: 0, y: 0, width: 0.5, height: 0.5 } }; }, "MIGRATION_IMAGE_METADATA_VALUE_MISMATCH"],
  ["the candidate also moves the focal point", (m) => { const value = itemImage(m.candidateContent); value.value = { ...(value.value as Json), focalPoint: { x: 0.1, y: 0.1 } }; }, "MIGRATION_IMAGE_METADATA_VALUE_MISMATCH"],
  ["the candidate restates the digest", (m) => { const value = itemImage(m.candidateContent); value.value = { ...(value.value as Json), sha256: "c".repeat(64) }; }, "MIGRATION_IMAGE_METADATA_VALUE_MISMATCH"],
  ["the candidate leaves the manifest uncorrected", (m) => { m.candidateContent.assetManifest = structuredClone(m.productionContent.assetManifest); }, "COMPATIBILITY_ASSET_CHANGED"],
  ["a path declared twice in one step", (m) => { images(m).push({ ...(images(m)[0] as Json) }); }, "MIGRATION_DECLARATION_INVALID"],
  [
    "a path declared in two steps",
    (m) => { (m.declaration.steps as Json[]).push(structuredClone((m.declaration.steps as Json[])[0] as Json)); },
    "MIGRATION_IMAGE_PATH_CLAIMED_TWICE",
  ],
  ["a step with no image", (m) => { images(m).length = 0; }, "MIGRATION_DECLARATION_INVALID"],
  ["an image declared with its digest", (m) => { (images(m)[0] as Json).sha256 = "a".repeat(64); }, "MIGRATION_DECLARATION_INVALID"],
  ["an image declared with alt text", (m) => { (images(m)[0] as Json).altText = "Smuggled"; }, "MIGRATION_DECLARATION_INVALID"],
  ["a path outside public/", (m) => { (images(m)[0] as Json).path = "src/photo.jpg"; }, "MIGRATION_DECLARATION_INVALID"],
  [
    "the true shape is one the slot does not admit",
    (m) => {
      for (const contract of [m.productionContract, m.candidateContract]) (contract.assets as Json[])[0]!.aspectRatios = [{ width: 4, height: 3 }];
      // Production's stated 40x30 fits a 4:3-only slot; the truth does not.
    },
    "CONTENT_ASSET_POLICY",
  ],
];

describe("refuses everything the file does not prove", () => {
  it("control: the unedited case migrates", () => assert.equal(code(correctionCase()), "migrated"));
  for (const [name, edit, expected] of REFUSALS) {
    it(name, () => {
      const migration = correctionCase();
      edit(migration);
      assert.equal(code(migration), expected);
    });
  }
});

describe("an image-metadata step claims its fields against every other step", () => {
  it("refuses retiring a field whose image it corrects", () => {
    const migration = correctionCase();
    const { ids } = baseline();
    const contract = migration.candidateContract as { pages: { sections: { fields: Json[] }[] }[]; tombstonedIds: string[] };
    const section = contract.pages[0]!.sections[0]!;
    section.fields = section.fields.filter((field) => field.id !== ids.imageField);
    contract.tombstonedIds = [...contract.tombstonedIds, ids.imageField].sort();
    migration.candidateContent.values = values(migration.candidateContent).filter((value) => value.fieldId !== ids.imageField);
    (migration.declaration.steps as Json[]).push({ op: "retire", fields: [ids.imageField] });
    assert.equal(code(migration), "MIGRATION_SOURCE_CLAIMED_TWICE");
    (migration.declaration.steps as Json[]).shift();
    assert.notEqual(code(migration), "MIGRATION_SOURCE_CLAIMED_TWICE", "control: the retire alone is not a double claim");
  });

  it("refuses rescoping a field whose image it corrects", () => {
    const migration = correctionCase();
    const { ids } = baseline();
    const contract = migration.candidateContract as { pages: { sections: { fields: Json[] }[] }[] };
    (contract.pages[0]!.sections[0]!.fields.find((field) => field.id === ids.imageField) as Json).scope = "site";
    (values(migration.candidateContent).find((value) => value.fieldId === ids.imageField) as Json).owner = { kind: "site" };
    (migration.declaration.steps as Json[]).push({ op: "rescope", field: ids.imageField, scope: "site" });
    assert.equal(code(migration), "MIGRATION_SOURCE_CLAIMED_TWICE");
  });

  it("refuses an undeclared second file corrected alongside a declared one", () => {
    const migration = correctionCase();
    const other = file("jpeg-orientation-8.jpg");
    const stated = storedMaterial(other, { width: 40, height: 30 });
    const slot = (migration.productionContract.assets as Json[])[0] as Json;
    const extra = { assetSlotId: slot.id, path: OTHER, ...stated };
    // A slot holding two pictures cannot answer a page's share image.
    for (const contract of [migration.productionContract, migration.candidateContract]) {
      for (const page of (contract.internalSeo as { pages: Json[] }).pages) {
        page.primaryImageAssetSlotId = null;
        ((page.metadata as Json).social as Json).image = null;
      }
    }
    manifest(migration.productionContent).push(extra);
    manifest(migration.candidateContent).push({ ...extra, width: 30, height: 40 });
    // The item image shows OTHER instead of PHOTO, in production and candidate alike.
    for (const [content, metadata] of [[migration.productionContent, stated], [migration.candidateContent, { width: 30, height: 40 }]] as const) {
      const page = itemImage(content);
      page.value = { ...(page.value as Json), path: OTHER, ...stated, ...metadata };
    }
    migration.files.set(OTHER, other);
    assert.equal(code(migration), "MIGRATION_UNDECLARED_CHANGE");
    images(migration).push({ path: OTHER, mimeType: "image/jpeg", width: 30, height: 40, bytes: other.length });
    assert.equal(code(migration), "migrated", "declared, the same correction is proven");
  });
});

describe("the published JSON schema agrees with the parser", () => {
  const validate = new Ajv2020({ strict: false }).compile(generateManagedSiteFieldMigrationJsonSchemaV1() as object);
  const declaration = (image: Json) => ({
    schemaVersion: "1.0",
    from: { contractSha256: "a".repeat(64), contentSha256: "b".repeat(64) },
    steps: [{ op: "image-metadata", images: [image] }],
  });
  const good = { path: PHOTO, ...TRUE_PHOTO };
  it("accepts a well-formed step", () => assert.equal(validate(declaration(good)), true, JSON.stringify(validate.errors)));
  for (const [name, image] of [
    ["an alt text", { ...good, altText: "x" }],
    ["a zero width", { ...good, width: 0 }],
    ["a fractional height", { ...good, height: 1.5 }],
    ["an unknown format", { ...good, mimeType: "image/gif" }],
    ["no bytes", { path: PHOTO, mimeType: "image/jpeg", width: 30, height: 40 }],
  ] as const) {
    it(`refuses ${name}, as the parser does`, () => {
      assert.equal(validate(declaration(image)), false);
      assert.throws(() => parseManagedSiteFieldMigrationV1(declaration(image)), ManagedSiteContractError);
    });
  }
});

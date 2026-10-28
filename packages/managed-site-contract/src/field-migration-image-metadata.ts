import { canonicalizeJson } from "./canonical.js";
import type {
  ManagedContentOwner,
  ManagedSiteAssetManifestEntry,
  ManagedSiteContentDocument,
  ManagedSiteContentValue,
} from "./content.js";
import { contentValueKey } from "./content-semantics-facts.js";
import { ManagedSiteContractError } from "./errors.js";
import { claimOnce } from "./field-migration-claims.js";
import type {
  ManagedSiteFieldMigrationImageMaterialV1,
  ManagedSiteFieldMigrationImageMetadataStepV1,
  ManagedSiteFieldMigrationV1,
} from "./field-migration-schema.js";
import { managedImageFileMaterialV1, type ManagedImageFileMaterial } from "./image-file-material.js";

/**
 * Hands the verifier the bytes of one committed image file, by its repository
 * path, from the same tree as the candidate; `null` when the file cannot be
 * read. The verifier binds the bytes to the value by digest, so bytes of any
 * other file are refused, never trusted.
 */
export type ManagedSiteImageFileReader = (path: string) => Uint8Array | null;

/** The part of an image's material that is derived from its file and may be corrected. */
export const MANAGED_IMAGE_DERIVED_METADATA_KEYS = Object.freeze(["mimeType", "width", "height", "bytes"] as const);

export interface ManagedImageDerivedMetadataV1 {
  readonly mimeType: ManagedSiteAssetManifestEntry["mimeType"];
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
}

/**
 * One image file an image-metadata step corrects: what production states,
 * what its bytes derive, and every value and manifest entry that names it,
 * all derived from production.
 */
export interface ManagedSiteFieldMigrationResolvedImageV1 {
  readonly path: string;
  readonly sha256: string;
  readonly from: ManagedImageDerivedMetadataV1;
  readonly to: ManagedImageDerivedMetadataV1;
  readonly values: readonly { readonly fieldId: string; readonly owner: ManagedContentOwner }[];
  readonly assetSlotIds: readonly string[];
}

export interface ManagedSiteFieldMigrationResolvedImageMetadataV1 {
  readonly step: ManagedSiteFieldMigrationImageMetadataStepV1;
  readonly images: readonly ManagedSiteFieldMigrationResolvedImageV1[];
}

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function derivedMetadata(material: ManagedImageDerivedMetadataV1): ManagedImageDerivedMetadataV1 {
  return { mimeType: material.mimeType, width: material.width, height: material.height, bytes: material.bytes };
}

function sameMetadata(left: ManagedImageDerivedMetadataV1, right: ManagedImageDerivedMetadataV1): boolean {
  return MANAGED_IMAGE_DERIVED_METADATA_KEYS.every((key) => left[key] === right[key]);
}

function isImageMetadata(
  step: ManagedSiteFieldMigrationV1["steps"][number],
): step is ManagedSiteFieldMigrationImageMetadataStepV1 {
  return step.op === "image-metadata";
}

/** Every path a declaration's image-metadata steps name: the files a caller must read. */
export function managedSiteFieldMigrationImagePathsV1(declaration: ManagedSiteFieldMigrationV1): readonly string[] {
  return declaration.steps.filter(isImageMetadata).flatMap((step) => step.images.map(({ path }) => path));
}

/**
 * Production's one material for a path: every manifest entry naming it, which
 * must agree (the contract requires a path's material identical under every
 * slot; a production that broke that is refused, not guessed at).
 */
function productionEntries(
  content: ManagedSiteContentDocument,
  path: string,
): readonly [ManagedSiteAssetManifestEntry, ...ManagedSiteAssetManifestEntry[]] {
  const entries = content.assetManifest.filter((entry) => entry.path === path);
  const [first, ...rest] = entries;
  if (first === undefined) return fail("MIGRATION_IMAGE_METADATA_UNKNOWN_PATH", `Production names no image at ${path}`);
  if (rest.some((entry) => entry.sha256 !== first.sha256 || !sameMetadata(entry, first))) {
    fail("MIGRATION_IMAGE_METADATA_AMBIGUOUS", `Production states two materials for ${path}`);
  }
  return [first, ...rest];
}

function imageValuesAt(content: ManagedSiteContentDocument, path: string): readonly ManagedSiteContentValue[] {
  return content.values.filter((value) => value.type === "image" && value.value !== null && value.value.path === path);
}

/** The file's own material, bound to production's by digest. */
function observedMaterial(
  readImageFile: ManagedSiteImageFileReader | undefined,
  path: string,
  sha256: string,
): ManagedImageFileMaterial {
  if (readImageFile === undefined) {
    return fail("MIGRATION_IMAGE_METADATA_UNOBSERVED", `No image file reader was given to read ${path}`);
  }
  const bytes = readImageFile(path);
  if (!(bytes instanceof Uint8Array)) return fail("MIGRATION_IMAGE_METADATA_UNREADABLE", `Image file ${path} cannot be read`);
  let material: ManagedImageFileMaterial;
  try {
    material = managedImageFileMaterialV1(bytes);
  } catch (error) {
    if (!(error instanceof ManagedSiteContractError)) throw error;
    return fail("MIGRATION_IMAGE_METADATA_UNDERIVABLE", `${path}: ${error.message}`);
  }
  if (material.sha256 !== sha256) {
    fail("MIGRATION_IMAGE_METADATA_FILE_MISMATCH", `The file at ${path} is not the image production names there`);
  }
  return material;
}

function resolveImage(
  production: ManagedSiteContentDocument,
  declared: ManagedSiteFieldMigrationImageMaterialV1,
  readImageFile: ManagedSiteImageFileReader | undefined,
): ManagedSiteFieldMigrationResolvedImageV1 {
  const entries = productionEntries(production, declared.path);
  const [entry] = entries;
  const observed = observedMaterial(readImageFile, declared.path, entry.sha256);
  if (!sameMetadata(observed, declared)) {
    fail("MIGRATION_IMAGE_METADATA_MISMATCH", `The file at ${declared.path} is not what the declaration states`);
  }
  if (sameMetadata(entry, declared)) {
    fail("MIGRATION_IMAGE_METADATA_UNCHANGED", `Production already states the true metadata of ${declared.path}`);
  }
  return {
    path: declared.path,
    sha256: entry.sha256,
    from: derivedMetadata(entry),
    to: derivedMetadata(observed),
    values: imageValuesAt(production, declared.path).map(({ fieldId, owner }) => ({ fieldId, owner })),
    assetSlotIds: entries.map(({ assetSlotId }) => assetSlotId),
  };
}

/**
 * Resolves every image-metadata step against production and the files
 * themselves. A path is corrected once across the declaration, and every
 * field holding a corrected value is claimed from the sets every other step
 * claims from, so no step merges, retires, links or moves a value whose
 * material this step rewrites.
 */
export function resolveManagedSiteFieldMigrationImageMetadataV1(
  production: ManagedSiteContentDocument,
  declaration: ManagedSiteFieldMigrationV1,
  readImageFile: ManagedSiteImageFileReader | undefined,
  claimed: { readonly sources: Set<string>; readonly targets: Set<string> },
): readonly ManagedSiteFieldMigrationResolvedImageMetadataV1[] {
  const paths = new Set<string>();
  const fields = new Set<string>();
  return declaration.steps.filter(isImageMetadata).map((step) => {
    const images = step.images.map((declared) => {
      claimOnce(paths, declared.path, "MIGRATION_IMAGE_PATH_CLAIMED_TWICE");
      return resolveImage(production, declared, readImageFile);
    });
    for (const fieldId of images.flatMap(({ values }) => values.map((value) => value.fieldId))) {
      if (fields.has(fieldId)) continue;
      fields.add(fieldId);
      claimOnce(claimed.sources, fieldId, "MIGRATION_SOURCE_CLAIMED_TWICE");
      claimOnce(claimed.targets, fieldId, "MIGRATION_TARGET_CLAIMED_TWICE");
    }
    return { step, images };
  });
}

/** The key of every production value an image-metadata step corrects. */
export function managedSiteFieldMigrationCorrectedValueKeys(
  resolved: readonly ManagedSiteFieldMigrationResolvedImageMetadataV1[],
): ReadonlySet<string> {
  return new Set(
    resolved.flatMap(({ images }) => images.flatMap(({ values }) => values.map((value) => contentValueKey(value.fieldId, value.owner)))),
  );
}

function correctedByPath(
  resolved: readonly ManagedSiteFieldMigrationResolvedImageMetadataV1[],
): ReadonlyMap<string, ManagedSiteFieldMigrationResolvedImageV1> {
  return new Map(resolved.flatMap(({ images }) => images.map((image) => [image.path, image] as const)));
}

/**
 * Production with exactly the corrections applied: each value and manifest
 * entry naming a corrected path takes the file's derived metadata, and
 * nothing else about it moves.
 */
export function correctManagedSiteImageMetadataV1(
  production: ManagedSiteContentDocument,
  resolved: readonly ManagedSiteFieldMigrationResolvedImageMetadataV1[],
): ManagedSiteContentDocument {
  const corrections = correctedByPath(resolved);
  const values = production.values.map((value) => {
    if (value.type !== "image" || value.value === null) return value;
    const image = corrections.get(value.value.path);
    return image === undefined ? value : { ...value, value: { ...value.value, ...image.to } };
  });
  const assetManifest = production.assetManifest.map((entry) => {
    const image = corrections.get(entry.path);
    return image === undefined ? entry : { ...entry, ...image.to };
  });
  return { ...production, values, assetManifest } as ManagedSiteContentDocument;
}

/**
 * The candidate holds every corrected value exactly as production holds it
 * with the file's derived metadata in place of its stated metadata: same
 * owner, alt text, crop, focal point, path and digest.
 */
export function proveManagedSiteFieldMigrationImageMetadataV1(
  resolved: readonly ManagedSiteFieldMigrationResolvedImageMetadataV1[],
  corrected: ManagedSiteContentDocument,
  candidate: ManagedSiteContentDocument,
): void {
  const keys = managedSiteFieldMigrationCorrectedValueKeys(resolved);
  const candidateValues = new Map(candidate.values.map((value) => [contentValueKey(value.fieldId, value.owner), value]));
  for (const value of corrected.values) {
    const key = contentValueKey(value.fieldId, value.owner);
    if (!keys.has(key)) continue;
    const next = candidateValues.get(key);
    if (next === undefined || canonicalizeJson(next) !== canonicalizeJson(value)) {
      fail("MIGRATION_IMAGE_METADATA_VALUE_MISMATCH", `Candidate ${value.fieldId} is not production's image with its true metadata`);
    }
  }
}

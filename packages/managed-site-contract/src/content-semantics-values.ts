import {
  validateParsedManagedFieldValue,
  type ManagedSiteAssetManifestEntry,
  type ManagedSiteContentValue,
} from "./content.js";
import {
  contentSemanticFail,
  type ManagedContentSemanticFacts,
  type ManagedResolvedContentValue,
} from "./content-semantics-facts.js";
import { ManagedSiteContractError } from "./errors.js";
import { summarizeManagedRichText } from "./rich-text.js";
import {
  validateManagedImageValue,
  type ManagedAssetSlotDescriptor,
  type ManagedImageValue,
} from "./values.js";

const MATERIAL_IDENTITY_KEYS = Object.freeze([
  "path",
  "sha256",
  "mimeType",
  "width",
  "height",
  "bytes",
] as const);

function stableSuffix(id: string): string {
  return id.slice(id.indexOf("_") + 1);
}

function asContentPolicy(action: () => void): void {
  try {
    action();
  } catch (error) {
    if (error instanceof ManagedSiteContractError) {
      contentSemanticFail("CONTENT_VALUE_POLICY", error.message);
    }
    throw error;
  }
}

function validateResolvedValue(resolved: ManagedResolvedContentValue): void {
  if (resolved.kind === "protected") {
    const { descriptor, value } = resolved;
    if (
      value.type !== "internal_protected" ||
      value.valueType !== descriptor.valueType
    ) {
      contentSemanticFail(
        "CONTENT_VALUE_POLICY",
        `Protected value conflicts with field ${descriptor.id}`,
      );
    }
    return;
  }
  asContentPolicy(() =>
    validateParsedManagedFieldValue(resolved.descriptor, resolved.value),
  );
}

function assertLivePage(facts: ManagedContentSemanticFacts, pageId: string): void {
  if (facts.pages.has(pageId)) return;
  if (facts.tombstones.has(pageId)) {
    contentSemanticFail(
      "CONTENT_LINK_PAGE_TOMBSTONED",
      `Managed link resolves to tombstoned page ${pageId}`,
    );
  }
  const suffixKind = facts.contractIdKindsBySuffix.get(stableSuffix(pageId));
  if (suffixKind !== undefined && suffixKind !== "page") {
    contentSemanticFail(
      "CONTENT_ID_CROSS_KIND_COLLISION",
      `Managed link reuses ${suffixKind} identity entropy`,
    );
  }
  contentSemanticFail(
    "CONTENT_LINK_PAGE_UNRESOLVED",
    `Managed link does not resolve to a live page: ${pageId}`,
  );
}

function validateLinkDestination(
  facts: ManagedContentSemanticFacts,
  value: ManagedSiteContentValue,
): void {
  if (value.type === "link" && value.value.destination.kind === "internal") {
    assertLivePage(facts, value.value.destination.pageId);
  }
  if (value.type !== "rich_text") return;
  for (const inline of summarizeManagedRichText(value.value).inlines) {
    if (inline.type === "link" && inline.destination.kind === "internal") {
      assertLivePage(facts, inline.destination.pageId);
    }
  }
}

export function validateManagedContentValues(
  facts: ManagedContentSemanticFacts,
): void {
  for (const resolved of facts.resolvedValues) {
    validateResolvedValue(resolved);
    validateLinkDestination(facts, resolved.value);
  }
}

function materialMatchesSlot(
  slot: ManagedAssetSlotDescriptor,
  material: ManagedSiteAssetManifestEntry,
): boolean {
  const dimensionsValid =
    material.width >= slot.minWidth &&
    material.width <= slot.maxWidth &&
    material.height >= slot.minHeight &&
    material.height <= slot.maxHeight;
  const aspectValid = slot.aspectRatios.some(
    (ratio) => material.width * ratio.height === material.height * ratio.width,
  );
  return (
    dimensionsValid &&
    aspectValid &&
    slot.outputMimeTypes.includes(material.mimeType) &&
    material.bytes <= slot.maxBytes
  );
}

function manifestMatchesImage(
  manifest: ManagedSiteAssetManifestEntry,
  image: ManagedImageValue,
): boolean {
  return MATERIAL_IDENTITY_KEYS.every((key) => manifest[key] === image[key]);
}

function imageSlotId(resolved: ManagedResolvedContentValue): string | null {
  if (resolved.kind === "protected" || resolved.descriptor.type !== "image") {
    return null;
  }
  return resolved.descriptor.assetSlotId;
}

function validateManifestEntry(
  facts: ManagedContentSemanticFacts,
  entry: ManagedSiteAssetManifestEntry,
): void {
  const slot = facts.assets.get(entry.assetSlotId);
  if (slot === undefined) {
    contentSemanticFail(
      "CONTENT_ASSET_SLOT_UNRESOLVED",
      `Asset manifest does not resolve to a live slot: ${entry.assetSlotId}`,
    );
  }
  if (!facts.referencedAssetIds.has(entry.assetSlotId)) {
    contentSemanticFail(
      "CONTENT_ASSET_MANIFEST_UNUSED",
      `Asset manifest slot is not referenced: ${entry.assetSlotId}`,
    );
  }
  if (!materialMatchesSlot(slot, entry)) {
    contentSemanticFail(
      "CONTENT_ASSET_POLICY",
      `Asset manifest violates slot ${entry.assetSlotId}`,
    );
  }
}

function indexManifest(
  facts: ManagedContentSemanticFacts,
): ReadonlyMap<string, ManagedSiteAssetManifestEntry> {
  const manifestBySlot = new Map<string, ManagedSiteAssetManifestEntry>();
  for (const entry of facts.content.assetManifest) {
    if (manifestBySlot.has(entry.assetSlotId)) {
      contentSemanticFail(
        "CONTENT_ASSET_MANIFEST_DUPLICATE",
        `Asset manifest repeats slot ${entry.assetSlotId}`,
      );
    }
    validateManifestEntry(facts, entry);
    manifestBySlot.set(entry.assetSlotId, entry);
  }
  return manifestBySlot;
}

function validateImagePolicy(
  slot: ManagedAssetSlotDescriptor,
  image: ManagedImageValue,
): void {
  try {
    validateManagedImageValue(slot, image);
  } catch (error) {
    if (error instanceof ManagedSiteContractError) {
      contentSemanticFail("CONTENT_ASSET_POLICY", error.message);
    }
    throw error;
  }
}

function requiredManifest(
  manifestBySlot: ReadonlyMap<string, ManagedSiteAssetManifestEntry>,
  assetSlotId: string,
): ManagedSiteAssetManifestEntry {
  const manifest = manifestBySlot.get(assetSlotId);
  if (manifest === undefined) {
    contentSemanticFail(
      "CONTENT_ASSET_MANIFEST_MISSING",
      `Image value has no manifest for slot ${assetSlotId}`,
    );
  }
  return manifest;
}

function validateImageValue(
  facts: ManagedContentSemanticFacts,
  manifestBySlot: ReadonlyMap<string, ManagedSiteAssetManifestEntry>,
  resolved: ManagedResolvedContentValue,
): void {
  const assetSlotId = imageSlotId(resolved);
  if (assetSlotId === null) return;
  if (resolved.value.type !== "image") {
    contentSemanticFail(
      "CONTENT_VALUE_POLICY",
      `Image field ${resolved.descriptor.id} has a non-image value`,
    );
  }
  const slot = facts.assets.get(assetSlotId);
  if (slot === undefined) {
    contentSemanticFail(
      "CONTENT_ASSET_SLOT_UNRESOLVED",
      `Image field does not resolve to a live slot: ${assetSlotId}`,
    );
  }
  validateImagePolicy(slot, resolved.value.value);
  const manifest = requiredManifest(manifestBySlot, assetSlotId);
  if (!manifestMatchesImage(manifest, resolved.value.value)) {
    contentSemanticFail(
      "CONTENT_ASSET_MANIFEST_MISMATCH",
      `Image material conflicts with manifest slot ${assetSlotId}`,
    );
  }
}

export function validateManagedContentAssets(
  facts: ManagedContentSemanticFacts,
): void {
  const manifestBySlot = indexManifest(facts);
  for (const resolved of facts.resolvedValues) {
    validateImageValue(facts, manifestBySlot, resolved);
  }
}

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
import {
  addManifestEntry,
  emptyManifestIndex,
  manifestEntryAt,
  sameAssetMaterial,
  type AssetManifestIndex,
} from "./asset-manifest-index.js";
import { ManagedSiteContractError } from "./errors.js";
import { summarizeManagedRichText } from "./rich-text.js";
import { isManagedOptionalItemField, type ManagedCollectionDescriptor } from "./fields.js";
import {
  validateManagedImageValue,
  type ManagedLinkDestination,
  type ManagedAssetSlotDescriptor,
  type ManagedImageValue,
} from "./values.js";

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

type InternalDestination = Extract<ManagedLinkDestination, { kind: "internal" }>;
type LinkValueKind = "field" | "mark";

/** Every internal destination a value carries: a link field's, and each prose link mark's. */
function internalDestinations(
  value: ManagedSiteContentValue,
): readonly { readonly destination: InternalDestination; readonly kind: LinkValueKind }[] {
  if (value.type === "link") {
    // No link (an optional item link, 0.37.0) names no page.
    if (value.value === null) return [];
    const { destination } = value.value;
    return destination.kind === "internal" ? [{ destination, kind: "field" }] : [];
  }
  if (value.type !== "rich_text") return [];
  // Prose links live on the text they cover, so the page a link names is reached
  // through marks rather than through a node of its own.
  return summarizeManagedRichText(value.value).textNodes.flatMap((node) =>
    (node.marks ?? []).flatMap((mark) =>
      mark.type === "link" && mark.destination.kind === "internal"
        ? [{ destination: mark.destination, kind: "mark" as const }]
        : [],
    ),
  );
}

const LINK_REFUSAL = {
  unpathed: {
    field: "CONTENT_LINK_PAGE_UNPATHED",
    mark: "CONTENT_RICH_TEXT_LINK_PAGE_UNPATHED",
  },
  itemScope: {
    field: "CONTENT_LINK_ITEM_SCOPE",
    mark: "CONTENT_RICH_TEXT_LINK_ITEM_SCOPE",
  },
  itemUnresolved: {
    field: "CONTENT_LINK_ITEM_UNRESOLVED",
    mark: "CONTENT_RICH_TEXT_LINK_ITEM_UNRESOLVED",
  },
} as const;

const LINK_NOUN = { field: "A link field", mark: "A rich-text link" } as const;

/**
 * An internal destination names one path, whether it is a link field's or a
 * prose link mark's: ONE predicate, refused here, where the value is judged,
 * rather than at render. A static page is its own path, so it takes no item. A
 * generated page is a pattern that only an item fills, so it is reachable only
 * through an item; without one every renderer would have to fail or invent a
 * URL. Which item it may name is judged once the active items are known
 * ({@link validateManagedContentLinkItems}). The two kinds keep their own codes
 * so a refusal still says which kind of value it was.
 */
function assertPathedDestination(
  facts: ManagedContentSemanticFacts,
  destination: InternalDestination,
  kind: LinkValueKind,
): void {
  const isStatic = facts.pages.get(destination.pageId)?.route.kind === "static";
  const hasItem = destination.itemId !== undefined;
  if (isStatic !== hasItem) return;
  contentSemanticFail(
    isStatic ? LINK_REFUSAL.itemScope[kind] : LINK_REFUSAL.unpathed[kind],
    isStatic
      ? `${LINK_NOUN[kind]} names item ${destination.itemId} on page ${destination.pageId}, which is static`
      : `${LINK_NOUN[kind]} names page ${destination.pageId}, which has no single path`,
  );
}

function validateLinkDestination(
  facts: ManagedContentSemanticFacts,
  value: ManagedSiteContentValue,
): void {
  for (const { destination, kind } of internalDestinations(value)) {
    assertLivePage(facts, destination.pageId);
    assertPathedDestination(facts, destination, kind);
  }
}

/**
 * The item an internal destination names is an active item -- present in its
 * collection's ordered view, not tombstoned -- of exactly the collection its
 * generated page's route iterates. An item of another collection has a path on
 * another page, if any, and a removed item has none.
 */
export function validateManagedContentLinkItems(
  facts: ManagedContentSemanticFacts,
  active: ReadonlyMap<string, ManagedCollectionDescriptor>,
): void {
  for (const resolved of facts.resolvedValues) {
    for (const { destination, kind } of internalDestinations(resolved.value)) {
      const { itemId } = destination;
      if (itemId === undefined) continue;
      const route = facts.pages.get(destination.pageId)?.route;
      const collection = active.get(itemId);
      if (collection === undefined) {
        contentSemanticFail(
          LINK_REFUSAL.itemUnresolved[kind],
          `${LINK_NOUN[kind]} names item ${itemId}, which is not active`,
        );
      }
      if (route?.kind !== "generated" || route.collectionId !== collection.id) {
        contentSemanticFail(
          LINK_REFUSAL.itemScope[kind],
          `${LINK_NOUN[kind]} names item ${itemId}, which page ${destination.pageId} does not route`,
        );
      }
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

function indexManifest(facts: ManagedContentSemanticFacts): AssetManifestIndex {
  const index = emptyManifestIndex();
  // One piece of material per repository path, whichever slots name it.
  const byPath = new Map<string, ManagedSiteAssetManifestEntry>();
  for (const entry of facts.content.assetManifest) {
    if (addManifestEntry(index, entry) !== undefined) {
      contentSemanticFail(
        "CONTENT_ASSET_MANIFEST_DUPLICATE",
        `Asset manifest repeats slot ${entry.assetSlotId} at ${entry.path}`,
      );
    }
    validateManifestEntry(facts, entry);
    const samePath = byPath.get(entry.path);
    if (samePath !== undefined && !sameAssetMaterial(samePath, entry)) {
      contentSemanticFail(
        "CONTENT_ASSET_PATH_CONFLICT",
        `Asset manifest gives ${entry.path} conflicting material`,
      );
    }
    byPath.set(entry.path, samePath ?? entry);
  }
  return index;
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

function mismatch(assetSlotId: string): never {
  return contentSemanticFail(
    "CONTENT_ASSET_MANIFEST_MISMATCH",
    `Image material conflicts with manifest slot ${assetSlotId}`,
  );
}

function requiredManifest(
  manifest: AssetManifestIndex,
  assetSlotId: string,
  image: ManagedImageValue,
): ManagedSiteAssetManifestEntry {
  const entry = manifestEntryAt(manifest, assetSlotId, image.path);
  if (entry !== undefined) return entry;
  // A slot the manifest holds material for is a mismatch with it; a slot it has
  // no material for at all is missing, whichever other slot holds this path.
  if (manifest.has(assetSlotId)) return mismatch(assetSlotId);
  return contentSemanticFail(
    "CONTENT_ASSET_MANIFEST_MISSING",
    `Image value has no manifest for slot ${assetSlotId}`,
  );
}

function validateImageValue(
  facts: ManagedContentSemanticFacts,
  manifest: AssetManifestIndex,
  resolved: ManagedResolvedContentValue,
): ManagedSiteAssetManifestEntry | null {
  const assetSlotId = imageSlotId(resolved);
  if (assetSlotId === null) return null;
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
  const image = resolved.value.value;
  if (image === null) {
    if (resolved.kind === "collection_item" && isManagedOptionalItemField(resolved.descriptor)) {
      return null;
    }
    return contentSemanticFail(
      "CONTENT_VALUE_POLICY",
      `Image field ${resolved.descriptor.id} requires an image`,
    );
  }
  validateImagePolicy(slot, image);
  const entry = requiredManifest(manifest, assetSlotId, image);
  if (!sameAssetMaterial(entry, image)) mismatch(assetSlotId);
  return entry;
}

/**
 * Every entry of a slot an image field declares must be used by a value, so a
 * slot cannot carry material nothing renders: not when every item's optional
 * image is empty (0.36.0), and not when a list holds no items. A slot no image
 * field declares (an SEO-only slot) keeps its single entry, as before paths
 * keyed the manifest.
 */
function assertEntriesUsed(
  manifest: AssetManifestIndex,
  used: ReadonlySet<ManagedSiteAssetManifestEntry>,
  usedSlots: ReadonlySet<string>,
): void {
  for (const [assetSlotId, byPath] of manifest) {
    if (!usedSlots.has(assetSlotId)) {
      if (byPath.size > 1) {
        contentSemanticFail(
          "CONTENT_ASSET_MANIFEST_DUPLICATE",
          `Asset manifest repeats slot ${assetSlotId}`,
        );
      }
      continue;
    }
    for (const entry of byPath.values()) {
      if (!used.has(entry)) {
        contentSemanticFail(
          "CONTENT_ASSET_MANIFEST_UNUSED",
          `Asset manifest entry is not used: ${assetSlotId} ${entry.path}`,
        );
      }
    }
  }
}

/**
 * A page's social image and primary image each name a slot, and the page needs
 * exactly one picture from it. A slot holding several entries (one per item
 * image) has no single answer, so the contract must not point SEO at it.
 *
 * A share image with an `imageFieldId` is not read from the slot: it is that
 * page-scoped field's value, one picture by construction, so a per-site social
 * slot holding one entry per page answers it exactly.
 */
function slotResolvedSeoImages(
  page: ManagedContentSemanticFacts["contract"]["internalSeo"]["pages"][number],
): readonly (string | null)[] {
  const socialBySlot =
    page.metadata.social.imageFieldId === undefined ? page.metadata.social.image : null;
  return [socialBySlot, page.primaryImageAssetSlotId];
}

function assertSeoImagesUnambiguous(
  facts: ManagedContentSemanticFacts,
  manifest: AssetManifestIndex,
): void {
  for (const page of facts.contract.internalSeo.pages) {
    for (const assetSlotId of slotResolvedSeoImages(page)) {
      if (assetSlotId === null) continue;
      if ((manifest.get(assetSlotId)?.size ?? 0) > 1) {
        contentSemanticFail(
          "CONTENT_SEO_IMAGE_AMBIGUOUS",
          `Page ${page.pageId} SEO image slot ${assetSlotId} holds several images`,
        );
      }
    }
  }
}

/** Every slot an image field declares, page or item: whatever its values hold. */
function imageFieldSlots(facts: ManagedContentSemanticFacts): ReadonlySet<string> {
  const fields = [...facts.nonItemFields, ...[...facts.itemFields.values()].map((fact) => fact.descriptor)];
  return new Set(fields.flatMap((field) => (field.type === "image" ? [field.assetSlotId] : [])));
}

export function validateManagedContentAssets(
  facts: ManagedContentSemanticFacts,
): void {
  const manifest = indexManifest(facts);
  const used = new Set<ManagedSiteAssetManifestEntry>();
  for (const resolved of facts.resolvedValues) {
    const entry = validateImageValue(facts, manifest, resolved);
    if (entry !== null) used.add(entry);
  }
  assertEntriesUsed(manifest, used, imageFieldSlots(facts));
  assertSeoImagesUnambiguous(facts, manifest);
}

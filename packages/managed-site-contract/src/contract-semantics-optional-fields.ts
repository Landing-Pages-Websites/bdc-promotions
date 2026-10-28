import { collectManagedSiteContractOccurrences } from "./contract-occurrence-registry.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { isManagedOptionalItemField, type ManagedCollectionItemField } from "./fields.js";

/**
 * The capabilities a customer needs to write an optional field's value from
 * nothing: a customer who may empty it must be able to fill it again. An
 * image needs an upload, and alt text when its slot is informative (an
 * informative picture is refused without one); a link needs its label and
 * destination, and its window when it has a choice; anything a later version makes
 * optional is refused here until it states its own.
 */
function refillCapabilities(contract: ManagedSiteContractV1, field: ManagedCollectionItemField): readonly string[] | null {
  if (field.type === "image") {
    const slot = contract.assets.find((asset) => asset.id === field.assetSlotId);
    return slot?.semantics.kind === "informative" ? ["image.upload", "image.alt.edit"] : ["image.upload"];
  }
  if (field.type === "link") {
    // A link from nothing needs its words and where it goes, and which window
    // when the field admits more than one.
    const window = field.constraints.allowedTargets.length > 1 ? ["link.target.edit"] : [];
    return ["link.label.edit", "link.destination.edit", ...window];
  }
  return null;
}

/**
 * Invariant: a customer who can leave an optional field empty can fill it
 * again. A code-owned field holds what code writes, so it needs none.
 */
function validateRefillable(contract: ManagedSiteContractV1): void {
  for (const field of contract.collections.flatMap((collection) => collection.itemFields)) {
    if (!isManagedOptionalItemField(field) || field.type === "internal_protected") continue;
    if (field.classification !== "customer_editable") continue;
    const needed = refillCapabilities(contract, field);
    const granted: readonly string[] = field.capabilities;
    if (needed === null || !needed.every((capability) => granted.includes(capability))) {
      throw new ManagedSiteContractError(
        "CONTRACT_OPTIONAL_FIELD_POLICY",
        `A customer who may empty ${field.id} must be able to fill it again: ${(needed ?? ["(none defined)"]).join(", ")}`,
      );
    }
  }
}

/**
 * An optional item field (0.36.0) may hold nothing, so nothing that reads an
 * item field on every item may name one: a share or primary image, a JSON-LD
 * source, a search slot or its pattern source, a heading outline entry, an
 * intent, a uniqueness rule, or any item-field reference the occurrence
 * registry classifies later. Derived from every collection-scoped field
 * reference rather than listed, so a new reference place is refused until a
 * version decides it can live without a value.
 */
export function validateManagedOptionalFieldReferences(contract: ManagedSiteContractV1): void {
  validateRefillable(contract);
  const optional = new Set<string>(
    contract.collections.flatMap((collection) =>
      collection.itemFields.filter(isManagedOptionalItemField).map((field) => field.id),
    ),
  );
  if (optional.size === 0) return;
  for (const occurrence of collectManagedSiteContractOccurrences(contract)) {
    if (occurrence.role !== "reference" || occurrence.idKind !== "field") continue;
    if (!optional.has(occurrence.id)) continue;
    throw new ManagedSiteContractError(
      "CONTRACT_OPTIONAL_FIELD_REFERENCE",
      `An optional item field may hold nothing, so ${occurrence.location} cannot name it: ${occurrence.id}`,
    );
  }
}

import { canonicalizeJson } from "./canonical.js";
import type {
  ManagedSiteAssetManifestEntry,
  ManagedSiteContentDocument,
  ManagedSiteContentValue,
} from "./content.js";
import { validateManagedSiteContractV1ContentSemantics } from "./content-semantics.js";
import {
  collectManagedContractCompatibilityFacts,
  type ManagedContractCompatibilityFacts,
} from "./contract-compatibility-facts.js";
import {
  includesAllValues,
  isCompatibilityAssetWidened,
  isCompatibilityCollectionWidened,
  isCompatibilityFieldWidened,
} from "./contract-compatibility-constraints.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { validateManagedSiteContractV1Semantics } from "./contract-semantics.js";
import { ManagedSiteContractError } from "./errors.js";
import type { StableId } from "./ids.js";

export interface ManagedSiteContractCompatibilityV1 {
  readonly kind: "compatible";
  readonly addedStableIds: readonly StableId[];
  readonly addedContentValueCount: number;
  readonly addedAssetManifestCount: number;
}

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

function sameMembers(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return left.length === right.length && includesAllValues(left, right);
}

function scopeKey(scope: { readonly collectionId: string } | "global"): string {
  return scope === "global" ? scope : `collection:${scope.collectionId}`;
}

function assertDeclarations(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
): void {
  for (const [id, declaration] of production.declarations) {
    const next = candidate.declarations.get(id);
    if (
      next === undefined ||
      next.kind !== declaration.kind ||
      scopeKey(next.scope) !== scopeKey(declaration.scope)
    ) {
      fail(
        "COMPATIBILITY_DECLARATION_REMOVED",
        `Stable declaration changed: ${id}`,
      );
    }
  }
}

function assertTombstones(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
): void {
  for (const id of production.tombstones) {
    if (!candidate.tombstones.has(id)) {
      fail(
        "COMPATIBILITY_TOMBSTONE_REMOVED",
        `Stable tombstone changed: ${id}`,
      );
    }
  }
}

function assertFields(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
): void {
  for (const [id, field] of production.fields) {
    const next = candidate.fields.get(id);
    if (next === undefined || !isCompatibilityFieldWidened(field, next)) {
      fail(
        "COMPATIBILITY_FIELD_POLICY_NARROWED",
        `Field policy changed: ${id}`,
      );
    }
  }
}

function assertCollections(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
): void {
  for (const [id, descriptor] of production.collections) {
    const next = candidate.collections.get(id);
    if (
      next === undefined ||
      !isCompatibilityCollectionWidened(descriptor, next)
    ) {
      fail(
        "COMPATIBILITY_COLLECTION_POLICY_NARROWED",
        `Collection policy changed: ${id}`,
      );
    }
  }
}

function assertAssets(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
): void {
  for (const [id, descriptor] of production.assets) {
    const next = candidate.assets.get(id);
    if (next === undefined || !isCompatibilityAssetWidened(descriptor, next)) {
      fail(
        "COMPATIBILITY_ASSET_POLICY_NARROWED",
        `Asset policy changed: ${id}`,
      );
    }
  }
}

function assertAliases(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
): void {
  for (const [id, group] of production.aliases) {
    const next = candidate.aliases.get(id);
    if (next === undefined || !sameMembers(group.fieldIds, next.fieldIds)) {
      fail("COMPATIBILITY_ALIAS_CHANGED", `Atomic alias changed: ${id}`);
    }
  }
  for (const [id, group] of candidate.aliases) {
    if (production.aliases.has(id)) continue;
    if (group.fieldIds.some((fieldId) => production.fields.has(fieldId))) {
      fail(
        "COMPATIBILITY_ALIAS_CHANGED",
        `New atomic alias captures a production field: ${id}`,
      );
    }
  }
}

function contentValueKey(value: ManagedSiteContentValue): string {
  return canonicalizeJson({ fieldId: value.fieldId, owner: value.owner });
}

function assertContentPreserved(
  production: ManagedSiteContentDocument,
  candidate: ManagedSiteContentDocument,
): void {
  const candidateValues = new Map(
    candidate.values.map((value) => [contentValueKey(value), value]),
  );
  for (const value of production.values) {
    const next = candidateValues.get(contentValueKey(value));
    if (next === undefined || !canonicalEqual(value, next)) {
      fail(
        "COMPATIBILITY_CONTENT_CHANGED",
        `Production content changed: ${value.fieldId}`,
      );
    }
  }
}

function assertManifestPreserved(
  production: readonly ManagedSiteAssetManifestEntry[],
  candidate: readonly ManagedSiteAssetManifestEntry[],
): void {
  const candidateEntries = new Map(
    candidate.map((entry) => [entry.assetSlotId, entry]),
  );
  for (const entry of production) {
    const next = candidateEntries.get(entry.assetSlotId);
    if (next === undefined || !canonicalEqual(entry, next)) {
      fail(
        "COMPATIBILITY_ASSET_CHANGED",
        `Production asset material changed: ${entry.assetSlotId}`,
      );
    }
  }
}

function assertRuntimeIdentity(
  production: ManagedSiteContractV1,
  candidate: ManagedSiteContractV1,
): void {
  if (
    production.contractId !== candidate.contractId ||
    !canonicalEqual(production.adapter, candidate.adapter) ||
    !canonicalEqual(production.bridge, candidate.bridge)
  ) {
    fail(
      "COMPATIBILITY_RUNTIME_CHANGED",
      "Managed-site runtime identity changed",
    );
  }
}

function compatibilityResult(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
  productionContent: ManagedSiteContentDocument,
  candidateContent: ManagedSiteContentDocument,
): ManagedSiteContractCompatibilityV1 {
  const addedStableIds = [...candidate.declarations.values()]
    .filter(({ id }) => !production.declarations.has(id))
    .map(({ id }) => id)
    .sort();
  return Object.freeze({
    kind: "compatible",
    addedStableIds: Object.freeze(addedStableIds),
    addedContentValueCount:
      candidateContent.values.length - productionContent.values.length,
    addedAssetManifestCount:
      candidateContent.assetManifest.length -
      productionContent.assetManifest.length,
  });
}

function assertContractCompatibility(
  productionContract: ManagedSiteContractV1,
  candidateContract: ManagedSiteContractV1,
): readonly [
  ManagedContractCompatibilityFacts,
  ManagedContractCompatibilityFacts,
] {
  assertRuntimeIdentity(productionContract, candidateContract);
  const productionFacts =
    collectManagedContractCompatibilityFacts(productionContract);
  const candidateFacts =
    collectManagedContractCompatibilityFacts(candidateContract);
  assertDeclarations(productionFacts, candidateFacts);
  assertTombstones(productionFacts, candidateFacts);
  assertFields(productionFacts, candidateFacts);
  assertCollections(productionFacts, candidateFacts);
  assertAssets(productionFacts, candidateFacts);
  assertAliases(productionFacts, candidateFacts);
  return [productionFacts, candidateFacts];
}

function validateCompatibilityInputs(
  productionContract: ManagedSiteContractV1,
  productionContent: ManagedSiteContentDocument,
  candidateContract: ManagedSiteContractV1,
): void {
  validateManagedSiteContractV1ContentSemantics(
    productionContract,
    productionContent,
  );
  validateManagedSiteContractV1Semantics(candidateContract);
}

function assertCandidateContent(
  production: ManagedSiteContentDocument,
  candidateContract: ManagedSiteContractV1,
  candidate: ManagedSiteContentDocument,
): void {
  validateManagedSiteContractV1ContentSemantics(candidateContract, candidate);
  assertContentPreserved(production, candidate);
  assertManifestPreserved(production.assetManifest, candidate.assetManifest);
}

export function validateManagedSiteContractV1Compatibility(
  productionContract: ManagedSiteContractV1,
  productionContent: ManagedSiteContentDocument,
  candidateContract: ManagedSiteContractV1,
  candidateContent: ManagedSiteContentDocument,
): ManagedSiteContractCompatibilityV1 {
  validateCompatibilityInputs(
    productionContract,
    productionContent,
    candidateContract,
  );
  const [productionFacts, candidateFacts] = assertContractCompatibility(
    productionContract,
    candidateContract,
  );
  assertCandidateContent(
    productionContent,
    candidateContract,
    candidateContent,
  );
  return compatibilityResult(
    productionFacts,
    candidateFacts,
    productionContent,
    candidateContent,
  );
}

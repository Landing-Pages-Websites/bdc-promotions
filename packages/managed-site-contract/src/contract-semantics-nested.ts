import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";

function fail(message: string): never {
  throw new ManagedSiteContractError("CONTRACT_NESTED_COLLECTION", message);
}

/**
 * The collections an item field lists, each by the one field that lists it.
 * Exported so content semantics reads nesting from the contract exactly as it
 * was validated here.
 */
export function managedNestedCollectionParents(
  contract: ManagedSiteContractV1,
): ReadonlyMap<string, { readonly parentCollectionId: string; readonly fieldId: string }> {
  const parents = new Map<string, { readonly parentCollectionId: string; readonly fieldId: string }>();
  for (const collection of contract.collections) {
    for (const field of collection.itemFields) {
      if (field.type !== "collection") continue;
      if (parents.has(field.collectionId)) {
        fail(`Collection ${field.collectionId} is listed by more than one item field`);
      }
      parents.set(field.collectionId, { parentCollectionId: collection.id, fieldId: field.id });
    }
  }
  return parents;
}

/**
 * A list inside an item is one level deep and belongs to its parent alone: the
 * listed collection is declared, is not the parent itself, is listed by exactly
 * one item field and by no page field, is no generated page's route, and lists
 * nothing itself. So every nested item has exactly one parent list, and an
 * item's list is edited without touching any other item's or page's.
 */
export function validateManagedNestedCollections(contract: ManagedSiteContractV1): void {
  const parents = managedNestedCollectionParents(contract);
  const declared = new Map<string, (typeof contract.collections)[number]>(contract.collections.map((collection) => [collection.id, collection]));
  const pageListed = new Set<string>(
    contract.pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.fields.flatMap((field) => (field.type === "collection" ? [field.collectionId] : [])),
      ),
    ),
  );
  const routed = new Set<string>(
    contract.pages.flatMap((page) => (page.route.kind === "generated" ? [page.route.collectionId] : [])),
  );
  for (const [childId, { parentCollectionId, fieldId }] of parents) {
    const child = declared.get(childId);
    if (child === undefined) fail(`Item field ${fieldId} lists an undeclared collection: ${childId}`);
    if (childId === parentCollectionId) fail(`Item field ${fieldId} lists its own collection`);
    if (pageListed.has(childId)) fail(`Collection ${childId} is listed by an item field and a page field`);
    if (routed.has(childId)) fail(`Collection ${childId} is a generated route and cannot be nested`);
    if (child.itemFields.some((field) => field.type === "collection")) {
      fail(`Nested collection ${childId} lists a collection itself`);
    }
  }
}

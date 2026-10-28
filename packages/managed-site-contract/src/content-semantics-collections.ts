import { canonicalizeJson } from "./canonical.js";
import {
  validateParsedManagedCollectionValue,
  type ManagedSiteContentDocument,
  type ManagedSiteContentValue,
} from "./content.js";
import {
  collectManagedContentSemanticFacts,
  contentSemanticFail,
  contentValueKey,
  type ManagedContentSemanticFacts,
  type ManagedResolvedContentValue,
} from "./content-semantics-facts.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import type { ManagedCollectionDescriptor } from "./fields.js";
import type { StableId } from "./ids.js";
import { validateManagedContentLinkItems } from "./content-semantics-values.js";
import { isManagedGeneratedRouteKey } from "./values.js";

interface ManagedCollectionState {
  readonly descriptor: ManagedCollectionDescriptor;
  /** Every active item, in order: the shared view, or each parent's list in turn. */
  readonly itemIds: readonly StableId<"item">[];
  /**
   * The ordered lists the items sit in: one shared view for a collection pages
   * list, and one per parent item for a list inside an item.
   */
  readonly lists: readonly (readonly StableId<"item">[])[];
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateCollectionPolicy(
  descriptor: ManagedCollectionDescriptor,
  value: ManagedSiteContentValue,
): void {
  try {
    validateParsedManagedCollectionValue(descriptor, value);
  } catch (error) {
    if (error instanceof ManagedSiteContractError) {
      contentSemanticFail("CONTENT_COLLECTION_POLICY", error.message);
    }
    throw error;
  }
}

/** The collection a collection-typed value lists, whether a page's field or an item's. */
function collectionDescriptor(
  facts: ManagedContentSemanticFacts,
  resolved: ManagedResolvedContentValue,
): ManagedCollectionDescriptor | null {
  if (resolved.kind === "protected" || resolved.descriptor.type !== "collection") {
    return null;
  }
  const descriptor = facts.collections.get(resolved.descriptor.collectionId);
  if (descriptor === undefined) {
    contentSemanticFail(
      "CONTENT_COLLECTION_UNRESOLVED",
      `Collection field does not resolve: ${resolved.descriptor.collectionId}`,
    );
  }
  return descriptor;
}

interface ListedView {
  readonly descriptor: ManagedCollectionDescriptor;
  readonly itemIds: readonly StableId<"item">[];
  /** Whether an item field holds it: a list inside one item rather than a page's view. */
  readonly nested: boolean;
}

function listedView(
  facts: ManagedContentSemanticFacts,
  resolved: ManagedResolvedContentValue,
): ListedView | null {
  const descriptor = collectionDescriptor(facts, resolved);
  if (descriptor === null) return null;
  if (resolved.value.type !== "collection") {
    contentSemanticFail(
      "CONTENT_VALUE_POLICY",
      `Collection field ${resolved.descriptor.id} has a non-collection value`,
    );
  }
  validateCollectionPolicy(descriptor, resolved.value);
  return {
    descriptor,
    itemIds: resolved.value.value.orderedItemIds,
    nested: resolved.kind === "collection_item",
  };
}

/**
 * A collection pages list has one order, however many fields show it. A list
 * inside an item is that item's own: lists of one collection never share an
 * item, so moving or removing one item touches exactly one list.
 */
function addView(states: Map<string, ManagedCollectionState>, view: ListedView): void {
  const current = states.get(view.descriptor.id);
  if (current === undefined) {
    states.set(view.descriptor.id, { descriptor: view.descriptor, itemIds: view.itemIds, lists: [view.itemIds] });
    return;
  }
  if (!view.nested) {
    if (!arraysEqual(current.itemIds, view.itemIds)) {
      contentSemanticFail(
        "CONTENT_COLLECTION_ORDER_CONFLICT",
        `Collection ${view.descriptor.id} has conflicting ordered views`,
      );
    }
    return;
  }
  const held = new Set(current.itemIds);
  if (view.itemIds.some((itemId) => held.has(itemId))) {
    contentSemanticFail(
      "CONTENT_NESTED_ITEM_SHARED",
      `An item of nested collection ${view.descriptor.id} sits in more than one list`,
    );
  }
  states.set(view.descriptor.id, {
    descriptor: view.descriptor,
    itemIds: [...current.itemIds, ...view.itemIds],
    lists: [...current.lists, view.itemIds],
  });
}

function collectCollectionStates(
  facts: ManagedContentSemanticFacts,
): ReadonlyMap<string, ManagedCollectionState> {
  const states = new Map<string, ManagedCollectionState>();
  for (const resolved of facts.resolvedValues) {
    const view = listedView(facts, resolved);
    if (view !== null) addView(states, view);
  }
  return states;
}

function stableSuffix(id: string): string {
  return id.slice(id.indexOf("_") + 1);
}

function assertActiveItemIdentity(
  facts: ManagedContentSemanticFacts,
  itemId: StableId<"item">,
): void {
  if (facts.tombstones.has(itemId)) {
    contentSemanticFail(
      "CONTENT_ITEM_TOMBSTONED",
      `Active item is tombstoned: ${itemId}`,
    );
  }
  const kind = facts.contractIdKindsBySuffix.get(stableSuffix(itemId));
  if (kind !== undefined && kind !== "item") {
    contentSemanticFail(
      "CONTENT_ID_CROSS_KIND_COLLISION",
      `Active item reuses ${kind} identity entropy`,
    );
  }
}

function indexActiveItems(
  facts: ManagedContentSemanticFacts,
  states: ReadonlyMap<string, ManagedCollectionState>,
): ReadonlyMap<string, ManagedCollectionDescriptor> {
  const active = new Map<string, ManagedCollectionDescriptor>();
  for (const state of states.values()) {
    for (const itemId of state.itemIds) {
      assertActiveItemIdentity(facts, itemId);
      const existing = active.get(itemId);
      if (existing !== undefined && existing.id !== state.descriptor.id) {
        contentSemanticFail(
          "CONTENT_ITEM_COLLECTION_CONFLICT",
          `Item ${itemId} belongs to more than one collection`,
        );
      }
      active.set(itemId, state.descriptor);
    }
  }
  return active;
}

function validateItemValueOwners(
  facts: ManagedContentSemanticFacts,
  active: ReadonlyMap<string, ManagedCollectionDescriptor>,
): void {
  for (const resolved of facts.resolvedValues) {
    if (resolved.kind !== "collection_item") continue;
    const owner = resolved.value.owner;
    if (owner.kind !== "collection_item") continue;
    const activeCollection = active.get(owner.itemId);
    if (activeCollection === undefined) {
      contentSemanticFail(
        "CONTENT_ITEM_ORPHAN",
        `Item value is not present in an ordered collection: ${owner.itemId}`,
      );
    }
    if (activeCollection.id !== resolved.collection.id) {
      contentSemanticFail(
        "CONTENT_ITEM_COLLECTION_CONFLICT",
        `Item value belongs to the wrong collection: ${owner.itemId}`,
      );
    }
  }
}

function requiredItemValue(
  facts: ManagedContentSemanticFacts,
  collection: ManagedCollectionDescriptor,
  itemId: StableId<"item">,
  fieldId: StableId<"field">,
): ManagedResolvedContentValue {
  const key = contentValueKey(fieldId, {
    kind: "collection_item",
    collectionId: collection.id,
    itemId,
  });
  const resolved = facts.valuesByKey.get(key);
  if (resolved === undefined) {
    contentSemanticFail(
      "CONTENT_ITEM_VALUE_MISSING",
      `Item ${itemId} is missing field ${fieldId}`,
    );
  }
  return resolved;
}

function validateItemCompleteness(
  facts: ManagedContentSemanticFacts,
  states: ReadonlyMap<string, ManagedCollectionState>,
): void {
  for (const state of states.values()) {
    for (const itemId of state.itemIds) {
      for (const field of state.descriptor.itemFields) {
        requiredItemValue(facts, state.descriptor, itemId, field.id);
      }
    }
  }
}

function validateUsageItems(
  facts: ManagedContentSemanticFacts,
  active: ReadonlyMap<string, ManagedCollectionDescriptor>,
): void {
  for (const field of facts.nonItemFields) {
    for (const usage of field.usages) {
      if (usage.itemId !== null) {
        validateUsageItem(facts, active, usage.pageId, usage.itemId);
      }
    }
  }
}

function validateUsageItem(
  facts: ManagedContentSemanticFacts,
  active: ReadonlyMap<string, ManagedCollectionDescriptor>,
  pageId: StableId<"page">,
  itemId: StableId<"item">,
): void {
  const collection = active.get(itemId);
  if (collection === undefined) {
    contentSemanticFail(
      "CONTENT_USAGE_ITEM_UNRESOLVED",
      `Field usage item is not active: ${itemId}`,
    );
  }
  const page = facts.pages.get(pageId);
  if (page?.route.kind !== "generated") {
    contentSemanticFail(
      "CONTENT_USAGE_ITEM_SCOPE",
      `Field usage item is attached to a non-generated page: ${itemId}`,
    );
  }
  if (page.route.collectionId !== collection.id) {
    contentSemanticFail(
      "CONTENT_USAGE_ITEM_SCOPE",
      `Field usage item belongs to another generated route: ${itemId}`,
    );
  }
}

function uniquenessPart(
  comparison: "exact" | "case_folded",
  resolved: ManagedResolvedContentValue,
): string {
  if (comparison === "exact") return canonicalizeJson(resolved.value.value);
  const descriptor =
    resolved.kind === "protected" ? null : resolved.descriptor;
  if (
    descriptor === null ||
    (descriptor.type !== "plain_text" && descriptor.type !== "heading_text") ||
    (resolved.value.type !== "plain_text" && resolved.value.type !== "heading_text")
  ) {
    contentSemanticFail(
      "CONTENT_COLLECTION_UNIQUENESS_POLICY",
      "Case-folded uniqueness requires text item fields",
    );
  }
  return resolved.value.value.toLowerCase();
}

/** A uniqueness rule holds within each list: a page's view, or one item's own list. */
function validateUniquenessRule(
  facts: ManagedContentSemanticFacts,
  state: ManagedCollectionState,
  fieldIds: readonly StableId<"field">[],
  comparison: "exact" | "case_folded",
): void {
  for (const list of state.lists) {
    validateUniqueWithin(facts, state, list, fieldIds, comparison);
  }
}

function validateUniqueWithin(
  facts: ManagedContentSemanticFacts,
  state: ManagedCollectionState,
  list: readonly StableId<"item">[],
  fieldIds: readonly StableId<"field">[],
  comparison: "exact" | "case_folded",
): void {
  const seen = new Set<string>();
  for (const itemId of list) {
    const parts = fieldIds.map((fieldId) =>
      uniquenessPart(
        comparison,
        requiredItemValue(facts, state.descriptor, itemId, fieldId),
      ),
    );
    const key = canonicalizeJson(parts);
    if (seen.has(key)) {
      contentSemanticFail(
        "CONTENT_COLLECTION_UNIQUENESS",
        `Collection ${state.descriptor.id} violates a uniqueness rule`,
      );
    }
    seen.add(key);
  }
}

function validateCollectionUniqueness(
  facts: ManagedContentSemanticFacts,
  states: ReadonlyMap<string, ManagedCollectionState>,
): void {
  for (const state of states.values()) {
    for (const rule of state.descriptor.uniqueness) {
      validateUniquenessRule(facts, state, rule.fieldIds, rule.comparison);
    }
  }
}

function validateGeneratedRouteKeys(
  facts: ManagedContentSemanticFacts,
  states: ReadonlyMap<string, ManagedCollectionState>,
): void {
  for (const page of facts.pages.values()) {
    if (page.route.kind !== "generated") continue;
    const state = states.get(page.route.collectionId);
    if (state === undefined) {
      contentSemanticFail(
        "CONTENT_GENERATED_ROUTE_KEY",
        `Generated route collection has no active content: ${page.route.collectionId}`,
      );
    }
    for (const itemId of state.itemIds) {
      const resolved = requiredItemValue(
        facts,
        state.descriptor,
        itemId,
        page.route.routeKeyFieldId,
      );
      if (
        resolved.value.type !== "internal_protected" ||
        resolved.value.valueType !== "string" ||
        typeof resolved.value.value !== "string" ||
        !isManagedGeneratedRouteKey(resolved.value.value)
      ) {
        contentSemanticFail(
          "CONTENT_GENERATED_ROUTE_KEY",
          `Generated route key is not a canonical slug: ${itemId}`,
        );
      }
    }
  }
}

/**
 * Each active item of a content revision and the collection it belongs to:
 * listed in one of its collection's ordered views and not tombstoned. Read
 * through the same derivation the content rules judge items by, so a caller
 * asking whether an item exists (a declared link to it, say) sees exactly the
 * items those rules see.
 */
export function managedContentActiveItemCollections(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
): ReadonlyMap<string, string> {
  const facts = collectManagedContentSemanticFacts(contract, content);
  const active = indexActiveItems(facts, collectCollectionStates(facts));
  return new Map([...active].map(([itemId, collection]) => [itemId, collection.id] as const));
}

export function validateManagedContentCollections(
  facts: ManagedContentSemanticFacts,
): void {
  const states = collectCollectionStates(facts);
  const active = indexActiveItems(facts, states);
  validateItemValueOwners(facts, active);
  validateItemCompleteness(facts, states);
  validateUsageItems(facts, active);
  validateManagedContentLinkItems(facts, active);
  validateCollectionUniqueness(facts, states);
  validateGeneratedRouteKeys(facts, states);
}

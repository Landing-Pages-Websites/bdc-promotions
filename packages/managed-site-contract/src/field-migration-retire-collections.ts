import type { ManagedSiteContentDocument } from "./content.js";
import { collectManagedContractCompatibilityFacts } from "./contract-compatibility-facts.js";
import type { ManagedSiteContractOccurrence } from "./contract-occurrence-registry.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import {
  collectionPlacementFacts,
  managedSiteFieldMigrationRetiredFieldIds,
  type ManagedSiteFieldMigrationResolvedRetireV1,
} from "./field-migration-retire.js";
import { managedSiteFieldMigrationPageCarriedIds } from "./field-migration-retire-pages.js";
import type { ManagedSiteFieldMigrationV1 } from "./field-migration-schema.js";

interface HeldList {
  readonly collectionId: string;
  readonly placementIds: readonly string[];
}

/**
 * The items each list held in production. Item ids are content (server
 * minted), so they are read from production content: the lists its
 * placements hold and the owners of its item values. Sorted, one list per
 * collection, keyed by collection id.
 */
function itemsHeld(content: ManagedSiteContentDocument, lists: readonly HeldList[]): ReadonlyMap<string, readonly string[]> {
  const items = new Map<string, Set<string>>();
  const byPlacement = new Map<string, Set<string>>();
  for (const { collectionId, placementIds } of lists) {
    const held = new Set<string>();
    items.set(collectionId, held);
    for (const placementId of placementIds) byPlacement.set(placementId, held);
  }
  for (const value of content.values) {
    if (value.owner.kind === "collection_item") items.get(value.owner.collectionId)?.add(value.owner.itemId);
    const listed = byPlacement.get(value.fieldId);
    if (listed !== undefined && value.type === "collection") {
      for (const itemId of value.value.orderedItemIds) listed.add(itemId);
    }
  }
  return new Map([...items].map(([id, held]) => [id, [...held].sort()] as const));
}

/** What a retired collection takes with it beyond its declarations: its items. */
export function managedSiteFieldMigrationRetiredItemsByCollection(
  content: ManagedSiteContentDocument,
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
): ReadonlyMap<string, readonly string[]> {
  return itemsHeld(content, retires.flatMap(({ collections }) => collections.map(({ collection, placements }) => ({
    collectionId: collection.id,
    placementIds: placements.map(({ field }) => field.id),
  }))));
}

/**
 * Every production id a declaration's retires take with them without naming
 * it: each named collection's item fields, the fields placing its list and the
 * items it held, and each named page's sections, fields and search slots. Read from production alone, through the same derivations the
 * verifier claims them by, so a caller accounting for what it retired (the
 * converter's ledger) counts exactly what the verifier will. A collection
 * production does not declare carries nothing here; the verifier refuses it.
 */
export function managedSiteFieldMigrationRetireCarriedIdsV1(
  productionContract: ManagedSiteContractV1,
  productionContent: ManagedSiteContentDocument,
  declaration: ManagedSiteFieldMigrationV1,
): ReadonlySet<string> {
  const production = collectManagedContractCompatibilityFacts(productionContract);
  const lists = declaration.steps
    .flatMap((step) => (step.op === "retire" ? step.collections ?? [] : []))
    .flatMap((id) => {
      const collection = production.collections.get(id);
      if (collection === undefined) return [];
      return [{
        collectionId: id,
        itemFieldIds: collection.itemFields.map((field) => field.id),
        placementIds: collectionPlacementFacts(production, id).map((fact) => fact.descriptor.id),
      }];
    });
  return new Set([
    ...lists.flatMap(({ itemFieldIds, placementIds }) => [...itemFieldIds, ...placementIds]),
    ...[...itemsHeld(productionContent, lists).values()].flat(),
    ...managedSiteFieldMigrationPageCarriedIds(productionContract, declaration),
  ]);
}

/** Every item every retired collection held in production. */
export function managedSiteFieldMigrationRetiredItemIds(
  content: ManagedSiteContentDocument,
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
): ReadonlySet<string> {
  return new Set([...managedSiteFieldMigrationRetiredItemsByCollection(content, retires).values()].flat());
}

/**
 * A retired item's id is never reused: the candidate tombstones every one, so
 * content semantics refuse it as an active item anywhere (a new collection, a
 * kept one, a link), and nothing keyed on an item id (a draft, its history)
 * can re-attach to an item that means something else.
 */
export function assertManagedSiteFieldMigrationRetiredItemsTombstonedV1(
  candidate: ManagedSiteContractV1,
  items: ReadonlySet<string>,
): void {
  const tombstoned = new Set<string>(candidate.tombstonedIds);
  const kept = [...items].find((itemId) => !tombstoned.has(itemId));
  if (kept !== undefined) {
    throw new ManagedSiteContractError(
      "MIGRATION_TOMBSTONES_INCOMPLETE",
      `Candidate does not tombstone retired item ${kept}`,
    );
  }
}

/** A read-only view's reference to its collection (0.39.0), and the view it sits in. */
const VIEW_REFERENCE = /^(.*\.views\[\d+\])\.collectionId$/u;

/**
 * Where a retired collection's own declarations sit in the contract: the
 * collection, each page field placing it, and each read-only view of it
 * (0.39.0). An occurrence inside one of them (a placement's `collectionId`, the
 * collection's uniqueness rules, a view's `collectionId`) goes with it, so it
 * is not a reference from anything that stays. A view goes with its
 * collection exactly as a placement does: the candidate's own semantics refuse
 * one left naming a tombstoned collection.
 */
export function managedSiteFieldMigrationRetiredContainers(
  occurrences: readonly ManagedSiteContractOccurrence[],
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
): readonly string[] {
  const owners = new Set<string>(retires.flatMap(({ collections }) => collections.flatMap(({ collection, placements }) => [
    collection.id,
    ...placements.map(({ field }) => field.id),
  ])));
  const retiredCollections = new Set<string>(retires.flatMap(({ collections }) => collections.map(({ collection }) => collection.id)));
  const declarations = occurrences
    .filter((occurrence) => occurrence.role === "declaration" && owners.has(occurrence.id))
    .map((occurrence) => occurrence.location.replace(/\.id$/u, ""));
  const views = occurrences.flatMap((occurrence) => {
    const view = VIEW_REFERENCE.exec(occurrence.location);
    return occurrence.role === "reference" && view !== null && retiredCollections.has(occurrence.id) ? [view[1]] : [];
  });
  return [...declarations, ...views];
}

type ViewedSections = ReadonlyMap<string, readonly string[]>;

/** Each section's views, by `pageId|sectionId`, as collection ids in order. */
function viewsBySection(contract: ManagedSiteContractV1): ViewedSections {
  return new Map(
    contract.pages.flatMap((page) =>
      page.sections.map((section) => [
        `${page.id}|${section.id}`,
        (section.views ?? []).map((view) => view.collectionId as string),
      ] as const),
    ),
  );
}

/**
 * A collection retire takes every view of the collection with it (0.39.0):
 * each section that viewed a retired collection keeps, in the candidate,
 * exactly its other views, in order. A view repointed to another collection
 * in its place is a view the retire did not take, so it is refused, as is a
 * view left naming the tombstoned collection (the candidate's own semantics
 * refuse that too). A section the candidate no longer declares took its views
 * with it.
 */
export function assertManagedSiteFieldMigrationRetiredViewsTakenV1(
  production: ManagedSiteContractV1,
  candidate: ManagedSiteContractV1,
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
): void {
  const retired = new Set<string>(retires.flatMap(({ collections }) => collections.map(({ collection }) => collection.id)));
  const after = viewsBySection(candidate);
  for (const [section, views] of viewsBySection(production)) {
    if (!views.some((id) => retired.has(id))) continue;
    const kept = after.get(section);
    if (kept === undefined) continue;
    const expected = views.filter((id) => !retired.has(id));
    if (kept.length !== expected.length || kept.some((id, index) => id !== expected[index])) {
      throw new ManagedSiteContractError(
        "MIGRATION_RETIRE_REFERENCED",
        `Section ${section} must drop its view of a retired collection, keeping its other views as they were`,
      );
    }
  }
}

export function isInsideRetiredContainer(location: string, containers: readonly string[]): boolean {
  return containers.some((container) => location.startsWith(`${container}.`));
}

function namesAny(value: unknown, ids: ReadonlySet<string>): boolean {
  if (typeof value === "string") return ids.has(value);
  if (Array.isArray(value)) return value.some((entry) => namesAny(entry, ids));
  if (value !== null && typeof value === "object") return Object.values(value).some((entry) => namesAny(entry, ids));
  return false;
}

/**
 * No production value that stays names anything a retire removes: a link to
 * one of a retired collection's items (contract 0.25.0), a rich-text link mark
 * naming one, or any other string spelling a retired id. Read structurally
 * over every value, never per value type, so a shape added later is covered.
 */
export function assertManagedSiteFieldMigrationRetiredContentUnreferencedV1(
  content: ManagedSiteContentDocument,
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
  removedIds: ReadonlySet<string>,
): void {
  const retiredFields = new Set(retires.flatMap(managedSiteFieldMigrationRetiredFieldIds));
  const naming = content.values.find((value) => !retiredFields.has(value.fieldId) && namesAny(value.value, removedIds));
  if (naming !== undefined) {
    throw new ManagedSiteContractError(
      "MIGRATION_RETIRE_REFERENCED",
      `Retired content is referenced by the value of ${naming.fieldId}`,
    );
  }
}

import type { ManagedSiteContentDocument } from "./content.js";
import { collectManagedSiteContractOccurrences } from "./contract-occurrence-registry.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { isEditableSlot, servedText, type EditableSlot } from "./contract-compatibility-seo-repoint.js";
import { ManagedSiteContractError } from "./errors.js";
import {
  assertManagedSiteFieldMigrationRetiredContentUnreferencedV1,
  assertManagedSiteFieldMigrationRetiredItemsTombstonedV1,
  assertManagedSiteFieldMigrationRetiredViewsTakenV1,
  isInsideRetiredContainer,
  managedSiteFieldMigrationRetiredContainers,
  managedSiteFieldMigrationRetiredItemIds,
} from "./field-migration-retire-collections.js";
import type {
  ManagedSiteFieldMigrationResolvedRetireV1,
  ManagedSiteFieldMigrationRetiredFieldV1,
} from "./field-migration-retire.js";

/**
 * A static page's search title or description that named a retired editable
 * field and now names the protected field its share card already echoed,
 * which publishes the same text: the inverse of the editable re-point the
 * ordinary policy admits (0.10.0).
 */
export interface ManagedSiteFieldMigrationSeoRepointV1 {
  readonly kind: "seo_repointed";
  readonly pageId: string;
  readonly slot: EditableSlot;
  readonly from: string;
  readonly to: string;
}

interface RetireReferenceSides {
  readonly productionContract: ManagedSiteContractV1;
  readonly productionContent: ManagedSiteContentDocument;
  readonly candidateContract: ManagedSiteContractV1;
}

/** The protected fields an echo may name: kept by production and candidate both. */
function keptProtectedIds(sides: RetireReferenceSides): ReadonlySet<string> {
  const candidate = new Set(sides.candidateContract.internalSeo.protectedFields.map((field) => field.id));
  return new Set(sides.productionContract.internalSeo.protectedFields.map((field) => field.id).filter((id) => candidate.has(id)));
}

/**
 * The only place a retired field may be named: a static page's own primary
 * search title or description, the one slot shape whose policy names an
 * editable semantic (`MANAGED_METADATA_SLOT_POLICY`), at its registry location.
 */
const METADATA_SLOT = /^internalSeo\.pages\[(\d+)\]\.metadata\.([a-z]+)$/u;

/**
 * Occurrences that name an id without reading it. Everything else, a deferred
 * occurrence the registry does not check included, counts as a reference, so
 * an unclassified use of a retired id refuses rather than dangles.
 */
const NOT_A_REFERENCE: ReadonlySet<string> = new Set(["declaration", "tombstone"]);

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

/**
 * Where the reference sits must be a slot a customer may own, on the page
 * the retired field is declared on, and the slot's share-card echo must name
 * a protected field production and candidate both keep, holding for this
 * page exactly the text the retired field holds. Then the page serves the
 * same words before and after, and the slot falls back to the field code
 * already owns. Anything else (an outline, JSON-LD, intent, business
 * identity, another page's slot, a missing or different echo) still reads
 * the retired field, so it is refused.
 */
function repointFor(
  sides: RetireReferenceSides,
  keptProtected: ReadonlySet<string>,
  retired: ManagedSiteFieldMigrationRetiredFieldV1,
  location: string,
): ManagedSiteFieldMigrationSeoRepointV1 {
  const id = retired.field.id;
  const match = METADATA_SLOT.exec(location);
  const entry = match === null ? undefined : sides.productionContract.internalSeo.pages[Number(match[1])];
  const slot = match?.[2] ?? "";
  if (entry === undefined || !isEditableSlot(slot) || entry.pageId !== retired.pageId) {
    return fail("MIGRATION_RETIRE_REFERENCED", `Retired ${id} is referenced at ${location}`);
  }
  const echo = entry.metadata.social[slot];
  const text = servedText(sides.productionContent, id, entry.pageId);
  if (echo === null || !keptProtected.has(echo) || text === null || servedText(sides.productionContent, echo, entry.pageId) !== text) {
    return fail("MIGRATION_RETIRE_REFERENCED", `Retired ${id} at ${location} has no protected echo serving its text`);
  }
  return { kind: "seo_repointed", pageId: entry.pageId, slot, from: id, to: echo };
}

/**
 * Every id a retire removes that no search slot may fall back from: each
 * retired section, and each collection with its placements, item fields and
 * items. Only a field the step names can be re-pointed.
 */
function unrepointableIds(
  sides: RetireReferenceSides,
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
): ReadonlySet<string> {
  return new Set<string>([
    ...retires.flatMap(({ sections }) => sections.map(({ id }) => id)),
    ...retires.flatMap(({ collections }) => collections.flatMap(({ collection, placements, itemFields }) => [
      collection.id,
      ...placements.map(({ field }) => field.id),
      ...itemFields.map((field) => field.id),
    ])),
    ...managedSiteFieldMigrationRetiredItemIds(sides.productionContent, retires),
  ]);
}

/**
 * Every production reference to anything a retire removes, read through the
 * occurrence registry (the authority on where a contract names an id) and
 * through production content. A section, a collection, its placements, item
 * fields and items are never referenced, except from inside the retired
 * collection or placement itself, which goes with it; a named field only from
 * its page's editable search slot, which falls back to the protected echo, and
 * no value that stays may name any of them. Returns those re-points, for the
 * ordinary URL and SEO rule to read production through (each retired field
 * renamed to its echo) and for the proof to list. The candidate cannot name a
 * retired id at all: it is tombstoned, and contract semantics refuse a
 * reference to a tombstone.
 */
export function assertManagedSiteFieldMigrationRetireReferencesV1(
  sides: RetireReferenceSides,
  retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[],
): readonly ManagedSiteFieldMigrationSeoRepointV1[] {
  const fields = new Map<string, ManagedSiteFieldMigrationRetiredFieldV1>(retires.flatMap(({ fields: retired }) => retired.map((field) => [field.field.id, field] as const)));
  const others = unrepointableIds(sides, retires);
  const keptProtected = keptProtectedIds(sides);
  const occurrences = collectManagedSiteContractOccurrences(sides.productionContract);
  const containers = managedSiteFieldMigrationRetiredContainers(occurrences, retires);
  const repoints = occurrences
    .filter((occurrence) => !NOT_A_REFERENCE.has(occurrence.role) && (fields.has(occurrence.id) || others.has(occurrence.id)))
    .filter((occurrence) => !isInsideRetiredContainer(occurrence.location, containers))
    .map((occurrence) => {
      const retired = fields.get(occurrence.id);
      if (retired === undefined) {
        return fail("MIGRATION_RETIRE_REFERENCED", `Retired ${occurrence.id} is referenced at ${occurrence.location}`);
      }
      return repointFor(sides, keptProtected, retired, occurrence.location);
    });
  assertOneEchoPerField(repoints);
  assertManagedSiteFieldMigrationRetiredViewsTakenV1(sides.productionContract, sides.candidateContract, retires);
  assertManagedSiteFieldMigrationRetiredItemsTombstonedV1(
    sides.candidateContract,
    managedSiteFieldMigrationRetiredItemIds(sides.productionContent, retires),
  );
  assertManagedSiteFieldMigrationRetiredContentUnreferencedV1(
    sides.productionContent,
    retires,
    new Set<string>([...fields.keys(), ...others]),
  );
  return repoints;
}

/** A retired field falls back to one protected field, wherever it was named. */
function assertOneEchoPerField(repoints: readonly ManagedSiteFieldMigrationSeoRepointV1[]): void {
  const echoes = new Map<string, string>();
  for (const { from, to } of repoints) {
    if ((echoes.get(from) ?? to) !== to) {
      fail("MIGRATION_RETIRE_REFERENCED", `Retired ${from} falls back to more than one protected field`);
    }
    echoes.set(from, to);
  }
}

/** Each retired field a search slot named, to the protected echo it falls back to. */
export function managedSiteFieldMigrationRetireRenames(
  repoints: readonly ManagedSiteFieldMigrationSeoRepointV1[],
): ReadonlyMap<string, string> {
  return new Map(repoints.map((repoint) => [repoint.from, repoint.to] as const));
}

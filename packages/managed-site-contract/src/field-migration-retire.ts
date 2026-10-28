import type { ManagedContentOwner } from "./content.js";
import { requiredOwner } from "./content-semantics-facts.js";
import type {
  ManagedCompatibilityFieldFact,
  ManagedContractCompatibilityFacts,
} from "./contract-compatibility-facts.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { claimOnce, managedSiteFieldMigrationAliasedIds } from "./field-migration-claims.js";
import type {
  ManagedSiteFieldMigrationRetireStepV1,
  ManagedSiteFieldMigrationV1,
} from "./field-migration-schema.js";
import type {
  ManagedCollectionDescriptor,
  ManagedCollectionItemField,
  ManagedFieldDescriptor,
} from "./fields.js";

/** A retired field, where production declared it, and the owner its value had. */
export interface ManagedSiteFieldMigrationRetiredFieldV1 {
  readonly field: ManagedFieldDescriptor;
  readonly owner: ManagedContentOwner;
  readonly pageId: string;
  readonly sectionId: string;
}

export interface ManagedSiteFieldMigrationRetiredSectionV1 {
  readonly id: string;
  readonly pageId: string;
}

/**
 * A retired collection and everything under it, derived from production: the
 * page fields that place the list (whatever their classification, since the
 * list goes with them) and the collection's item fields. Its items and their
 * values are content, read from production content where they are judged.
 */
export interface ManagedSiteFieldMigrationRetiredCollectionV1 {
  readonly collection: ManagedCollectionDescriptor;
  readonly placements: readonly ManagedSiteFieldMigrationRetiredFieldV1[];
  readonly itemFields: readonly ManagedCollectionItemField[];
}

/** A retire step whose ids have passed every identity rule. */
export interface ManagedSiteFieldMigrationResolvedRetireV1 {
  readonly step: ManagedSiteFieldMigrationRetireStepV1;
  readonly fields: readonly ManagedSiteFieldMigrationRetiredFieldV1[];
  readonly collections: readonly ManagedSiteFieldMigrationRetiredCollectionV1[];
  readonly sections: readonly ManagedSiteFieldMigrationRetiredSectionV1[];
}

interface RetireFacts {
  readonly production: ManagedContractCompatibilityFacts;
  readonly candidate: ManagedContractCompatibilityFacts;
}

interface SectionPlace {
  readonly pageId: string;
  readonly sectionId: string;
  readonly fieldIds: readonly string[];
}

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function sectionPlaces(contract: ManagedSiteContractV1): ReadonlyMap<string, SectionPlace> {
  return new Map(
    contract.pages.flatMap((page) =>
      page.sections.map((section) => [
        section.id,
        { pageId: page.id, sectionId: section.id, fieldIds: section.fields.map((field) => field.id) },
      ] as const),
    ),
  );
}

function fieldPlaces(sections: ReadonlyMap<string, SectionPlace>): ReadonlyMap<string, SectionPlace> {
  return new Map([...sections.values()].flatMap((place) => place.fieldIds.map((id) => [id, place] as const)));
}

/**
 * The removal is real: the candidate no longer declares the id and
 * tombstones it, so it can never be declared again with another meaning.
 */
function assertRemoved(facts: RetireFacts, id: string): void {
  if (facts.candidate.declarations.has(id)) {
    fail("MIGRATION_RETIRE_STILL_DECLARED", `Candidate still declares retired ${id}`);
  }
  if (!facts.candidate.tombstones.has(id)) {
    fail("MIGRATION_TOMBSTONES_INCOMPLETE", `Candidate does not tombstone retired ${id}`);
  }
}

/**
 * Only a customer-editable field a page renders may be retired. A protected
 * SEO field and a code-owned interface field are code's own: removing one is
 * not a content decision, so it is refused rather than deferred. A collection
 * item field (one value per item) and an aliased field (one value shared by a
 * group) are real shapes this version does not prove yet.
 */
function retiredField(facts: RetireFacts, aliased: ReadonlySet<string>, id: string): ManagedFieldDescriptor {
  const fact = facts.production.fields.get(id);
  if (fact === undefined) return fail("MIGRATION_RETIRE_UNKNOWN", `Production does not declare field ${id}`);
  if (fact.kind === "protected") return fail("MIGRATION_RETIRE_PROTECTED", `A protected field cannot be retired: ${id}`);
  if (fact.kind !== "rendered" || aliased.has(id)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `A collection item or aliased field cannot be retired yet: ${id}`);
  }
  if (fact.descriptor.classification !== "customer_editable") {
    return fail("MIGRATION_RETIRE_NOT_EDITABLE", `A code-owned field cannot be retired: ${id}`);
  }
  return fact.descriptor;
}

function placed(
  places: ReadonlyMap<string, SectionPlace>,
  field: ManagedFieldDescriptor,
): ManagedSiteFieldMigrationRetiredFieldV1 {
  const place = places.get(field.id);
  if (place === undefined) return fail("MIGRATION_RETIRE_UNKNOWN", `Production does not place field ${field.id}`);
  return { field, owner: requiredOwner(field), pageId: place.pageId, sectionId: place.sectionId };
}

function resolveField(
  facts: RetireFacts,
  places: ReadonlyMap<string, SectionPlace>,
  aliased: ReadonlySet<string>,
  id: string,
): ManagedSiteFieldMigrationRetiredFieldV1 {
  const field = retiredField(facts, aliased, id);
  assertRemoved(facts, id);
  return placed(places, field);
}

/** Every field production declares of type `collection` naming the collection: what places its list. */
export function collectionPlacementFacts(
  production: ManagedContractCompatibilityFacts,
  id: string,
): readonly ManagedCompatibilityFieldFact[] {
  return [...production.fields.values()].filter(
    (fact) => fact.descriptor.type === "collection" && fact.descriptor.collectionId === id,
  );
}

/**
 * The page fields that place a collection: every rendered field of type
 * `collection` naming it. A list placed inside another collection's item
 * (a nested list, 0.27.0) is a shape this version does not prove, so it is
 * deferred, as is a placement shared through an alias group.
 */
function placementsOf(
  facts: RetireFacts,
  places: ReadonlyMap<string, SectionPlace>,
  aliased: ReadonlySet<string>,
  id: string,
): readonly ManagedSiteFieldMigrationRetiredFieldV1[] {
  return collectionPlacementFacts(facts.production, id).map((fact) => {
    if (fact.kind !== "rendered") {
      return fail("MIGRATION_TRANSFORM_DEFERRED", `A list inside an item cannot be retired yet: ${id} in ${fact.descriptor.id}`);
    }
    if (aliased.has(fact.descriptor.id)) {
      fail("MIGRATION_TRANSFORM_DEFERRED", `An aliased field cannot be retired yet: ${fact.descriptor.id}`);
    }
    return placed(places, fact.descriptor);
  });
}

/**
 * An item field goes with its collection whatever its classification: the
 * values a customer holds in it are what the platform's content checks
 * protect, and code-owned values are code's to drop. A protected item field
 * (a generated page's search fact) is never retired. An item field that is
 * itself a list, an image (whose asset slot and manifest entries would have to
 * go too, which this version does not prove) or shared through an alias group
 * is deferred.
 */
function assertItemFieldRetirable(aliased: ReadonlySet<string>, field: ManagedCollectionItemField): void {
  if (field.type === "internal_protected") {
    fail("MIGRATION_RETIRE_PROTECTED", `A protected field cannot be retired: ${field.id}`);
  }
  if (field.type === "collection" || field.type === "image" || aliased.has(field.id)) {
    fail(
      "MIGRATION_TRANSFORM_DEFERRED",
      `A nested list, image (asset material) or aliased item field cannot be retired yet: ${field.id}`,
    );
  }
}

/**
 * A whole collection: the declaration, every item field and every page field
 * placing it are claimed (so none is also merged, linked or retired by name)
 * and must be gone from the candidate and tombstoned.
 */
function resolveCollection(
  facts: RetireFacts,
  places: ReadonlyMap<string, SectionPlace>,
  aliased: ReadonlySet<string>,
  claimed: Set<string>,
  id: string,
): ManagedSiteFieldMigrationRetiredCollectionV1 {
  const collection = facts.production.collections.get(id);
  if (collection === undefined) return fail("MIGRATION_RETIRE_UNKNOWN", `Production does not declare collection ${id}`);
  for (const field of collection.itemFields) assertItemFieldRetirable(aliased, field);
  const placements = placementsOf(facts, places, aliased, id);
  const removed = [id, ...collection.itemFields.map((field) => field.id), ...placements.map(({ field }) => field.id)];
  for (const removedId of removed) {
    claimOnce(claimed, removedId, "MIGRATION_RETIRE_CLAIMED_TWICE");
    assertRemoved(facts, removedId);
  }
  return { collection, placements, itemFields: collection.itemFields };
}

/**
 * A section may be retired only once the migration has emptied it: every
 * field production declared in it is claimed by this migration, as a merge
 * source or a retired field. A section a migration empties without naming it
 * stays declared, empty, as before.
 */
function resolveSection(
  facts: RetireFacts,
  sections: ReadonlyMap<string, SectionPlace>,
  claimed: ReadonlySet<string>,
  id: string,
): ManagedSiteFieldMigrationRetiredSectionV1 {
  const place = sections.get(id);
  if (place === undefined) return fail("MIGRATION_RETIRE_UNKNOWN", `Production does not declare section ${id}`);
  const kept = place.fieldIds.find((fieldId) => !claimed.has(fieldId));
  if (kept !== undefined) {
    fail("MIGRATION_RETIRE_SECTION_NOT_EMPTY", `Section ${id} keeps field ${kept}`);
  }
  assertRemoved(facts, id);
  return { id, pageId: place.pageId };
}

function isRetire(step: ManagedSiteFieldMigrationV1["steps"][number]): step is ManagedSiteFieldMigrationRetireStepV1 {
  return step.op === "retire";
}

/**
 * The identity rules of every retire step. Fields and collections (with what
 * they carry) are claimed from `claimed`, the set the merge sources were
 * claimed from, so an id merged and retired, or retired twice, by name or as
 * part of a collection, is refused. Sections are judged after every field of
 * every step is claimed, because a section is empty only once all of them are.
 */
export function resolveManagedSiteFieldMigrationRetiresV1(
  facts: RetireFacts,
  productionContract: ManagedSiteContractV1,
  declaration: ManagedSiteFieldMigrationV1,
  claimed: Set<string>,
): readonly ManagedSiteFieldMigrationResolvedRetireV1[] {
  const sections = sectionPlaces(productionContract);
  const places = fieldPlaces(sections);
  const aliased = managedSiteFieldMigrationAliasedIds(facts.production);
  const withFields = declaration.steps.filter(isRetire).map((step) => ({
    step,
    fields: (step.fields ?? []).map((id) => {
      claimOnce(claimed, id, "MIGRATION_RETIRE_CLAIMED_TWICE");
      return resolveField(facts, places, aliased, id);
    }),
    collections: (step.collections ?? []).map((id) => resolveCollection(facts, places, aliased, claimed, id)),
  }));
  const claimedSections = new Set<string>();
  return withFields.map((retire) => ({
    ...retire,
    sections: (retire.step.sections ?? []).map((id) => {
      claimOnce(claimedSections, id, "MIGRATION_RETIRE_CLAIMED_TWICE");
      return resolveSection(facts, sections, claimed, id);
    }),
  }));
}

/** Every field a retire step removes: named, placing a collection, or an item field of one. */
export function managedSiteFieldMigrationRetiredFieldIds(
  retire: ManagedSiteFieldMigrationResolvedRetireV1,
): readonly string[] {
  return [
    ...retire.fields.map(({ field }) => field.id),
    ...retire.collections.flatMap(({ placements, itemFields }) => [
      ...placements.map(({ field }) => field.id),
      ...itemFields.map((field) => field.id),
    ]),
  ];
}

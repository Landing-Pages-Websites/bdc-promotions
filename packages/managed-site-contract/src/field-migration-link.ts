import type { ManagedContentOwner, ManagedSiteContentDocument } from "./content.js";
import { managedContentActiveItemCollections } from "./content-semantics-collections.js";
import { requiredOwner } from "./content-semantics-facts.js";
import type {
  ManagedCompatibilityFieldFact,
  ManagedContractCompatibilityFacts,
} from "./contract-compatibility-facts.js";
import { collectManagedSiteContractOccurrences } from "./contract-occurrence-registry.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { claimOnce, managedSiteFieldMigrationAliasedIds } from "./field-migration-claims.js";
import type {
  ManagedSiteFieldMigrationLinkStepV1,
  ManagedSiteFieldMigrationLinkV1,
  ManagedSiteFieldMigrationV1,
} from "./field-migration-schema.js";
import {
  MANAGED_SITE_FIELD_MIGRATION_STRUCTURED_ROLES,
  managedSiteFieldMigrationScopeKey,
} from "./field-migration-steps.js";
import {
  isManagedAttributeTextField,
  isManagedTokenTextField,
  type ManagedCollectionItemField,
  type ManagedFieldDescriptor,
} from "./fields.js";
import type { StableId } from "./ids.js";

/** Where a link step's two fields live: one page section, or one collection. */
export type ManagedSiteFieldMigrationLinkPlaceV1 =
  | { readonly kind: "section"; readonly pageId: string; readonly sectionId: string }
  | { readonly kind: "collection"; readonly collectionId: StableId<"collection"> };

type LinkField = ManagedFieldDescriptor | ManagedCollectionItemField;

/** A link step whose ids, place and destinations have passed every rule. */
export interface ManagedSiteFieldMigrationResolvedLinkV1 {
  readonly step: ManagedSiteFieldMigrationLinkStepV1;
  readonly source: LinkField;
  readonly target: Extract<LinkField, { readonly type: "link" }>;
  readonly place: ManagedSiteFieldMigrationLinkPlaceV1;
  /** The owner each declared link is for, in the declaration's order. */
  readonly owners: readonly ManagedContentOwner[];
}

interface LinkFacts {
  readonly production: ManagedContractCompatibilityFacts;
  readonly candidate: ManagedContractCompatibilityFacts;
  readonly productionContract: ManagedSiteContractV1;
  readonly productionContent: ManagedSiteContentDocument;
  readonly candidateContract: ManagedSiteContractV1;
}

/**
 * Occurrences that name an id without reading it. Anything else (an outline,
 * SEO metadata, intent, JSON-LD, a uniqueness rule, a route key, an alias,
 * and any role the registry gains later) reads the source's value as text,
 * which a link field does not hold, so it refuses.
 */
const NOT_A_REFERENCE: ReadonlySet<string> = new Set(["declaration", "tombstone"]);

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function sectionPlaces(contract: ManagedSiteContractV1): ReadonlyMap<string, ManagedSiteFieldMigrationLinkPlaceV1> {
  return new Map(
    contract.pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.fields.map((field) => [field.id, { kind: "section", pageId: page.id, sectionId: section.id }] as const),
      ),
    ),
  );
}

function collectionPlaces(contract: ManagedSiteContractV1): ReadonlyMap<string, ManagedSiteFieldMigrationLinkPlaceV1> {
  return new Map(
    contract.collections.flatMap((collection) =>
      collection.itemFields.map((field) => [field.id, { kind: "collection", collectionId: collection.id }] as const),
    ),
  );
}

function placeOf(contract: ManagedSiteContractV1, id: string): ManagedSiteFieldMigrationLinkPlaceV1 | undefined {
  return sectionPlaces(contract).get(id) ?? collectionPlaces(contract).get(id);
}

function samePlace(left: ManagedSiteFieldMigrationLinkPlaceV1, right: ManagedSiteFieldMigrationLinkPlaceV1): boolean {
  if (left.kind === "section" && right.kind === "section") {
    return left.pageId === right.pageId && left.sectionId === right.sectionId;
  }
  return left.kind === "collection" && right.kind === "collection" && left.collectionId === right.collectionId;
}

function fieldOf(fact: ManagedCompatibilityFieldFact): LinkField | undefined {
  return fact.kind === "protected" ? undefined : fact.descriptor;
}

/**
 * The source is customer-editable running text a page renders: a label,
 * caption or body line, never a role with structured meaning (a phone number
 * or address a crawler or another field reads), never a heading or rich text,
 * which carry structure a link label has no place for.
 */
function resolveSource(facts: LinkFacts, id: string): LinkField {
  const fact = facts.production.fields.get(id);
  if (fact === undefined) return fail("MIGRATION_SOURCE_UNKNOWN", `Production does not declare source ${id}`);
  const source = fieldOf(fact);
  if (source === undefined || source.type !== "plain_text") {
    return fail("MIGRATION_LINK_SOURCE_NOT_TEXT", `A link source is a plain-text field: ${id}`);
  }
  if (source.classification !== "customer_editable") {
    return fail("MIGRATION_LINK_SOURCE_NOT_EDITABLE", `A link source is customer-editable: ${id}`);
  }
  if (MANAGED_SITE_FIELD_MIGRATION_STRUCTURED_ROLES.includes(source.semantic)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `A source with structured meaning (${source.semantic}) cannot become a link yet: ${id}`);
  }
  if (isManagedTokenTextField(source)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `A template source cannot become a link yet: ${id}`);
  }
  if (isManagedAttributeTextField(source)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `An attribute source cannot become a link yet: ${id}`);
  }
  if (managedSiteFieldMigrationAliasedIds(facts.production).has(id)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `An aliased source cannot become a link yet: ${id}`);
  }
  if (facts.candidate.declarations.has(id)) fail("MIGRATION_SOURCE_STILL_DECLARED", `Candidate still declares source ${id}`);
  if (!facts.candidate.tombstones.has(id)) fail("MIGRATION_TOMBSTONES_INCOMPLETE", `Candidate does not tombstone source ${id}`);
  return source;
}

function resolveTarget(facts: LinkFacts, id: string): Extract<LinkField, { readonly type: "link" }> {
  if (facts.production.tombstones.has(id)) fail("MIGRATION_TARGET_TOMBSTONED", `Target was retired in production: ${id}`);
  if (facts.production.declarations.has(id)) fail("MIGRATION_TARGET_EXISTS", `Target already exists in production: ${id}`);
  const fact = facts.candidate.fields.get(id);
  const target = fact === undefined ? undefined : fieldOf(fact);
  if (target === undefined) return fail("MIGRATION_TARGET_UNDECLARED", `Candidate does not declare target ${id}`);
  if (target.type !== "link") return fail("MIGRATION_TARGET_TYPE_MISMATCH", `Target ${id} is not link`);
  if (target.classification !== "customer_editable") {
    return fail("MIGRATION_TARGET_NOT_EDITABLE", `Target is not customer-editable: ${id}`);
  }
  if (managedSiteFieldMigrationAliasedIds(facts.candidate).has(id)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `An aliased target cannot be a link step's: ${id}`);
  }
  return target;
}

/**
 * The target renders where the source did: in the same page section, shown
 * on exactly the same pages under the same owner, or as an item field of the
 * same collection. A link that moved would change what a page shows.
 */
function resolvePlace(facts: LinkFacts, source: LinkField, target: LinkField): ManagedSiteFieldMigrationLinkPlaceV1 {
  const from = placeOf(facts.productionContract, source.id);
  const to = placeOf(facts.candidateContract, target.id);
  if (from === undefined || to === undefined || !samePlace(from, to)) {
    return fail("MIGRATION_LINK_PLACE_CHANGED", `Target ${target.id} does not render where source ${source.id} did`);
  }
  const scoped = (field: LinkField): field is ManagedFieldDescriptor => "scope" in field;
  if (scoped(source) && scoped(target) &&
      managedSiteFieldMigrationScopeKey(source) !== managedSiteFieldMigrationScopeKey(target)) {
    fail("MIGRATION_SCOPE_MISMATCH", `Source ${source.id} and target ${target.id} differ in scope`);
  }
  return from;
}

/**
 * The owner each declared link writes: the field's own for a page or site
 * field, which declares one link with no item, and the item for an item
 * field, which names one. Which items production holds is judged against
 * its content.
 */
function ownersOf(
  step: ManagedSiteFieldMigrationLinkStepV1,
  source: LinkField,
  place: ManagedSiteFieldMigrationLinkPlaceV1,
): readonly ManagedContentOwner[] {
  if (place.kind === "section") {
    if (step.links.length !== 1 || step.links[0].item !== undefined || !("scope" in source)) {
      return fail("MIGRATION_LINK_ITEMS_MISMATCH", `A page or site source declares one link with no item: ${source.id}`);
    }
    return [requiredOwner(source)];
  }
  return step.links.map((link) => {
    if (link.item === undefined) {
      return fail("MIGRATION_LINK_ITEMS_MISMATCH", `An item source names the item of every link: ${source.id}`);
    }
    return { kind: "collection_item", collectionId: place.collectionId, itemId: link.item };
  });
}

/** The collection a page's generated route serves one item of per URL, or undefined. */
function routedCollection(contract: ManagedSiteContractV1, pageId: string): string | undefined {
  const route = contract.pages.find((page) => page.id === pageId)?.route;
  return route?.kind === "generated" ? route.collectionId : undefined;
}

function isStaticPage(contract: ManagedSiteContractV1, pageId: string): boolean {
  return contract.pages.some((page) => page.id === pageId && page.route.kind === "static");
}

/**
 * A destination the contract can state exactly, in production and the
 * candidate alike. An internal link names a static page both declare, or
 * (since 0.31.0) one item of a generated page both declare over the same
 * collection, where the item is active in production and of that collection:
 * an item production does not serve there has no path the declaration could
 * have been checked against. Whether the candidate still serves it is the
 * candidate's content rules' to judge (a removed or moved item refuses
 * there). External, email and phone destinations are carried verbatim, and
 * the target's own constraints judge them.
 */
function assertExpressible(
  facts: LinkFacts,
  activeItems: () => ReadonlyMap<string, string>,
  link: Pick<ManagedSiteFieldMigrationLinkV1, "destination">,
  target: string,
): void {
  const { destination } = link;
  if (destination.kind !== "internal") return;
  const { pageId, itemId } = destination;
  if (itemId === undefined) {
    if (!isStaticPage(facts.productionContract, pageId) || !isStaticPage(facts.candidateContract, pageId)) {
      fail("MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE", `Target ${target} names ${pageId}, not a static page both sides declare`);
    }
    return;
  }
  const collectionId = routedCollection(facts.productionContract, pageId);
  if (collectionId === undefined || routedCollection(facts.candidateContract, pageId) !== collectionId) {
    fail("MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE", `Target ${target} names item ${itemId} of ${pageId}, not a generated page both sides declare over one collection`);
  }
  if (activeItems().get(itemId) !== collectionId) {
    fail("MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE", `Target ${target} names item ${itemId}, which production does not serve at ${pageId}`);
  }
}

function assertSourceUnreferenced(facts: LinkFacts, id: string): void {
  const reference = collectManagedSiteContractOccurrences(facts.productionContract)
    .find((occurrence) => occurrence.id === id && !NOT_A_REFERENCE.has(occurrence.role));
  if (reference !== undefined) {
    fail("MIGRATION_LINK_SOURCE_REFERENCED", `Source ${id} is referenced at ${reference.location}`);
  }
}

function isLink(step: ManagedSiteFieldMigrationV1["steps"][number]): step is ManagedSiteFieldMigrationLinkStepV1 {
  return step.op === "link";
}

function resolveLink(facts: LinkFacts, step: ManagedSiteFieldMigrationLinkStepV1): ManagedSiteFieldMigrationResolvedLinkV1 {
  const source = resolveSource(facts, step.source);
  const target = resolveTarget(facts, step.target);
  const place = resolvePlace(facts, source, target);
  assertSourceUnreferenced(facts, source.id);
  const activeItems = activeItemsOf(facts);
  for (const link of step.links) assertExpressible(facts, activeItems, link, target.id);
  return { step, source, target, place, owners: ownersOf(step, source, place) };
}

/**
 * The identity rules of every link step. Sources are claimed from the set the
 * merge sources and retired fields were claimed from, and targets from the
 * merge targets', so no production field is both linked and merged or
 * retired, and no field is the target of two steps.
 */
export function resolveManagedSiteFieldMigrationLinksV1(
  facts: LinkFacts,
  declaration: ManagedSiteFieldMigrationV1,
  claimed: { readonly sources: Set<string>; readonly targets: Set<string> },
): readonly ManagedSiteFieldMigrationResolvedLinkV1[] {
  const resolved = declaration.steps.filter(isLink).map((step) => {
    claimOnce(claimed.sources, step.source, "MIGRATION_SOURCE_CLAIMED_TWICE");
    claimOnce(claimed.targets, step.target, "MIGRATION_TARGET_CLAIMED_TWICE");
    return resolveLink(facts, step);
  });
  assertMergeMarksExpressible(facts, declaration);
  return resolved;
}

/**
 * Every internal destination a declaration states is held to one rule,
 * whoever states it: a link step's links (above) and a merge step's declared
 * link marks alike, so a mark cannot name a page or item production does not
 * serve where a link step could not.
 */
function assertMergeMarksExpressible(facts: LinkFacts, declaration: ManagedSiteFieldMigrationV1): void {
  const activeItems = activeItemsOf(facts);
  for (const step of declaration.steps) {
    if (step.op !== "merge") continue;
    for (const part of step.parts) {
      for (const mark of part.marks ?? []) {
        if (mark.type === "link") assertExpressible(facts, activeItems, mark, step.target);
      }
    }
  }
}

/** Production's active items by collection, read once and only when an item is named. */
function activeItemsOf(facts: LinkFacts): () => ReadonlyMap<string, string> {
  let active: ReadonlyMap<string, string> | undefined;
  return () => (active ??= managedContentActiveItemCollections(facts.productionContract, facts.productionContent));
}

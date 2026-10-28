import { canonicalizeJson } from "./canonical.js";
import type { ManagedContentOwner, ManagedSiteContentDocument, ManagedSiteContentValue } from "./content.js";
import { requiredOwner } from "./content-semantics-facts.js";
import type { ManagedContractCompatibilityFacts } from "./contract-compatibility-facts.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { claimOnce, managedSiteFieldMigrationAliasedIds } from "./field-migration-claims.js";
import type {
  ManagedSiteFieldMigrationRescopeStepV1,
  ManagedSiteFieldMigrationV1,
} from "./field-migration-schema.js";
import type { ManagedFieldDescriptor } from "./fields.js";
import type { ManagedFieldUsage } from "./values.js";

/**
 * A rescope step resolved: the field as production and the candidate declare
 * it, the owner its value leaves and the one it takes, and every page it
 * newly renders on.
 */
export interface ManagedSiteFieldMigrationResolvedRescopeV1 {
  readonly step: ManagedSiteFieldMigrationRescopeStepV1;
  readonly production: ManagedFieldDescriptor;
  readonly candidate: ManagedFieldDescriptor;
  readonly from: ManagedContentOwner;
  readonly to: ManagedContentOwner;
  readonly addedUsages: readonly ManagedFieldUsage[];
}

/**
 * The types whose one value may move to the site owner unchanged. A list's
 * value is a page's order of its collection, and a toggle switches one page's
 * search visibility, so neither has a meaning shared by every page; any type a
 * later version adds is refused until it is decided.
 */
const RESCOPABLE_TYPES: ReadonlySet<string> = new Set([
  "plain_text",
  "heading_text",
  "rich_text",
  "link",
  "image",
  "icon",
]);

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

function usageKeys(field: ManagedFieldDescriptor): ReadonlySet<string> {
  return new Set(field.usages.map((usage) => `${usage.pageId}|${usage.itemId ?? ""}`));
}

/** Where a field is declared: its page and section. */
function placeOf(contract: ManagedSiteContractV1, id: string): string | undefined {
  for (const page of contract.pages) {
    for (const section of page.sections) {
      if (section.fields.some((field) => field.id === id)) return `${page.id}|${section.id}`;
    }
  }
  return undefined;
}

function renderedField(facts: ManagedContractCompatibilityFacts, id: string): ManagedFieldDescriptor | undefined {
  const fact = facts.fields.get(id);
  return fact?.kind === "rendered" ? fact.descriptor : undefined;
}

interface RescopeFacts {
  readonly production: ManagedContractCompatibilityFacts;
  readonly candidate: ManagedContractCompatibilityFacts;
  readonly productionContract: ManagedSiteContractV1;
  readonly candidateContract: ManagedSiteContractV1;
}

function resolveProduction(facts: RescopeFacts, id: string): ManagedFieldDescriptor {
  const field = renderedField(facts.production, id);
  if (field === undefined) return fail("MIGRATION_SOURCE_UNKNOWN", `Production does not declare page field ${id}`);
  if (field.scope !== "page") return fail("MIGRATION_RESCOPE_NOT_PAGE", `Field ${id} is not page-scoped`);
  if (!RESCOPABLE_TYPES.has(field.type)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `A ${field.type} field cannot move to site scope yet: ${id}`);
  }
  if (managedSiteFieldMigrationAliasedIds(facts.production).has(id)) {
    return fail("MIGRATION_TRANSFORM_DEFERRED", `An aliased field cannot move to site scope yet: ${id}`);
  }
  return field;
}

/**
 * The candidate declares the same field in the same section, identical but
 * for its scope and its usages, which keep every production usage.
 */
function resolveCandidate(facts: RescopeFacts, production: ManagedFieldDescriptor): ManagedFieldDescriptor {
  const { id } = production;
  const candidate = renderedField(facts.candidate, id);
  if (candidate === undefined) return fail("MIGRATION_TARGET_UNDECLARED", `Candidate does not declare ${id}`);
  if (candidate.scope !== "site") return fail("MIGRATION_RESCOPE_NOT_SITE", `Candidate ${id} is not site-scoped`);
  if (placeOf(facts.productionContract, id) !== placeOf(facts.candidateContract, id)) {
    fail("MIGRATION_RESCOPE_MOVED", `Candidate declares ${id} in another section`);
  }
  if (!canonicalEqual({ ...production, scope: "site", usages: candidate.usages }, candidate)) {
    fail("MIGRATION_RESCOPE_POLICY_CHANGED", `Candidate changes ${id} beyond its scope and usages`);
  }
  const kept = usageKeys(candidate);
  for (const key of usageKeys(production)) {
    if (!kept.has(key)) fail("MIGRATION_RESCOPE_USAGE_DROPPED", `Candidate drops usage ${key} of ${id}`);
  }
  return candidate;
}

/** Every usage the candidate adds, an item of a page it already rendered on included. */
function addedUsagesOf(production: ManagedFieldDescriptor, candidate: ManagedFieldDescriptor): readonly ManagedFieldUsage[] {
  const before = usageKeys(production);
  return candidate.usages.filter((usage) => !before.has(`${usage.pageId}|${usage.itemId ?? ""}`));
}

function isRescope(step: ManagedSiteFieldMigrationV1["steps"][number]): step is ManagedSiteFieldMigrationRescopeStepV1 {
  return step.op === "rescope";
}

/**
 * The identity rules of every rescope step. The field is claimed as a source
 * and as a target from the sets every other step claims from, so no field is
 * both rescoped and merged, retired or linked, or rescoped twice.
 */
export function resolveManagedSiteFieldMigrationRescopesV1(
  facts: RescopeFacts,
  declaration: ManagedSiteFieldMigrationV1,
  claimed: { readonly sources: Set<string>; readonly targets: Set<string> },
): readonly ManagedSiteFieldMigrationResolvedRescopeV1[] {
  return declaration.steps.filter(isRescope).map((step) => {
    claimOnce(claimed.sources, step.field, "MIGRATION_SOURCE_CLAIMED_TWICE");
    claimOnce(claimed.targets, step.field, "MIGRATION_TARGET_CLAIMED_TWICE");
    const production = resolveProduction(facts, step.field);
    const candidate = resolveCandidate(facts, production);
    return {
      step,
      production,
      candidate,
      from: requiredOwner(production),
      to: requiredOwner(candidate),
      addedUsages: addedUsagesOf(production, candidate),
    };
  });
}

function valuesOn(content: ManagedSiteContentDocument, fieldId: string): readonly ManagedSiteContentValue[] {
  return content.values.filter((value) => value.fieldId === fieldId);
}

/**
 * Production holds the field's one value under the page; the candidate holds
 * exactly one value for it, under the site, identical in everything but its
 * owner. Nothing about the value changes, only whose it is.
 */
export function proveManagedSiteFieldMigrationRescopeV1(
  resolved: ManagedSiteFieldMigrationResolvedRescopeV1,
  production: ManagedSiteContentDocument,
  candidate: ManagedSiteContentDocument,
): void {
  const id = resolved.production.id;
  const before = valuesOn(production, id);
  const after = valuesOn(candidate, id);
  if (before.length !== 1 || !canonicalEqual(before[0]?.owner, resolved.from)) {
    fail("MIGRATION_SOURCE_VALUE_MISSING", `Production holds no single page value for ${id}`);
  }
  if (after.length !== 1) {
    fail("MIGRATION_TARGET_VALUE_MISSING", `Candidate holds ${after.length} values for ${id}, not one site value`);
  }
  if (!canonicalEqual(after[0], { ...before[0], owner: resolved.to })) {
    fail("MIGRATION_TARGET_MISMATCH", `Candidate ${id} is not production's value under the site`);
  }
}

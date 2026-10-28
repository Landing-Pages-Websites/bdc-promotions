import {
  managedSiteFieldMigrationFromV1,
  managedSiteFieldMigrationRetireCarriedIdsV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  type ManagedSiteFieldMigrationV1,
} from "@landing-pages-websites/managed-site-contract";

import type { LedgerRecord } from "./id-ledger.js";

/**
 * Which retired fields a new field replaced, read from the one structural fact
 * the converter owns: anchors. A field anchored at an element replaces the
 * retired fields anchored BENEATH it (`…/role:h2` replaces `…/role:h2/text` and
 * `…/role:h2/role:span/text`), which is exactly what happens when a formatted
 * block that used to be one field per run becomes one rich-text field.
 *
 * That says WHICH fields merged, never HOW: the order of the parts, the
 * separators between them and the mark each one takes are not in any anchor,
 * so the converter does not guess them. A person writes them in a migration
 * plan, and this module only checks the plan against the grouping and binds it
 * to the production artifacts it was written for.
 */
export interface ReplacedFieldGroup {
  readonly target: string;
  readonly targetAnchor: string;
  readonly sources: readonly { readonly id: string; readonly anchor: string }[];
}

export interface ReplacedFieldEvidence {
  /**
   * Every id this run retired, of any kind, whatever became of it. Only a
   * field (merged or retired), a collection, a section or a page (retired)
   * can be named by a step, so a retired item or asset is always unresolved
   * unless a retired collection or page carries it.
   */
  readonly retired: readonly LedgerRecord[];
  readonly groups: readonly ReplacedFieldGroup[];
  /** Retired fields no new field's anchor contains: retirements, not merges. */
  readonly unclaimed: readonly LedgerRecord[];
}

export interface ProposedField {
  readonly fieldId: string;
  readonly anchor: string;
  readonly minted: boolean;
}

function containingField(
  record: LedgerRecord,
  fields: readonly ProposedField[],
): ProposedField | undefined {
  return fields
    .filter((field) => record.anchor.startsWith(`${field.anchor}/`))
    .sort((left, right) => right.anchor.length - left.anchor.length)[0];
}

/**
 * Groups this run's retired field records under the new field whose anchor is
 * their nearest ancestor. A field the ledger already knew is never a target:
 * a migration target must be new, so its retired descendants stay unclaimed.
 */
export function replacedFieldEvidence(
  retired: readonly LedgerRecord[],
  fields: readonly ProposedField[],
): ReplacedFieldEvidence {
  const groups = new Map<string, ReplacedFieldGroup>();
  const unclaimed: LedgerRecord[] = [];
  for (const record of retired.filter((entry) => entry.kind === "field")) {
    const owner = containingField(record, fields);
    if (owner === undefined || !owner.minted) {
      unclaimed.push(record);
      continue;
    }
    const group = groups.get(owner.fieldId) ?? { target: owner.fieldId, targetAnchor: owner.anchor, sources: [] };
    groups.set(owner.fieldId, { ...group, sources: [...group.sources, { id: record.id, anchor: record.anchor }] });
  }
  return { retired, groups: [...groups.values()], unclaimed };
}

/**
 * Retired ids no declared step consumes. Read from every id the run retired,
 * not from the evidence's buckets, so an id is unresolved unless the plan
 * consumes it, whichever bucket it fell into or any bucket added later.
 * `consumed` comes from {@link buildFieldMigrationDeclaration}; a run with no
 * plan consumes nothing.
 */
export function unresolvedRetirements(
  evidence: ReplacedFieldEvidence,
  consumed: ReadonlySet<string>,
): readonly LedgerRecord[] {
  return evidence.retired.filter((record) => !consumed.has(record.id));
}

export interface FieldMigrationPlan {
  readonly bridge?: { readonly from: string; readonly to: string };
  readonly steps: readonly unknown[];
}

export interface ProductionArtifacts {
  readonly contract: unknown;
  readonly content: unknown;
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && [...left].sort().join() === [...right].sort().join();
}

/**
 * The production ids a step consumes: a merge's sources, a retire's fields,
 * collections, sections and pages, a link step's one source. A rescope
 * (contract 0.40.0) and an image-metadata correction (0.42.0) consume no
 * id: their fields stay. What a retired
 * collection or page carries without naming (placements, item fields, items;
 * sections, fields, search slots) is not here: the contract package derives
 * it from production.
 */
function stepSources(step: ManagedSiteFieldMigrationV1["steps"][number]): readonly string[] {
  switch (step.op) {
    case "retire":
      return [...(step.fields ?? []), ...(step.collections ?? []), ...(step.sections ?? []), ...(step.pages ?? [])];
    case "link":
      return [step.source];
    case "rescope":
    case "image-metadata":
      return [];
    case "merge":
      return step.parts.flatMap((part) => ("source" in part ? [part.source] : []));
    default:
      return assertNeverStep(step);
  }
}

function assertNeverStep(step: never): never {
  throw new Error(`Migration plan names a step this converter does not know: ${JSON.stringify(step)}`);
}

/** A retire may name only fields, collections, sections and pages this conversion retired. */
function assertRetireMatchesEvidence(
  step: Extract<ManagedSiteFieldMigrationV1["steps"][number], { readonly op: "retire" }>,
  evidence: ReplacedFieldEvidence,
): void {
  const retired = new Set(evidence.retired.map((record) => record.id));
  const unknown = stepSources(step).find((id) => !retired.has(id));
  if (unknown !== undefined) {
    throw new Error(`Migration plan retires ${unknown}, which this conversion did not retire`);
  }
}

function assertPlanMatchesEvidence(
  declaration: ManagedSiteFieldMigrationV1,
  evidence: ReplacedFieldEvidence,
): void {
  const groups = new Map(evidence.groups.map((group) => [group.target, group]));
  for (const step of declaration.steps) {
    if (step.op === "retire") {
      assertRetireMatchesEvidence(step, evidence);
      continue;
    }
    // A conversion never moves a field's scope, so it holds no evidence for one.
    if (step.op === "rescope") {
      throw new Error(`Migration plan rescopes ${step.field}, which no conversion does: declare it by hand`);
    }
    // Nor does it correct an image's metadata: that is read from a committed file.
    if (step.op === "image-metadata") {
      throw new Error("Migration plan corrects image metadata, which no conversion does: declare it by hand");
    }
    const group = groups.get(step.target);
    if (group === undefined) {
      throw new Error(`Migration plan names ${step.target}, which this conversion did not mint over retired fields`);
    }
    if (!sameMembers(stepSources(step), group.sources.map((source) => source.id))) {
      throw new Error(`Migration plan for ${step.target} does not consume exactly the fields its anchor replaced`);
    }
  }
}

export interface FieldMigrationDeclaration {
  readonly declaration: ManagedSiteFieldMigrationV1;
  /** Groups the plan leaves out, for the report. */
  readonly unplanned: readonly ReplacedFieldGroup[];
  /**
   * Every production id the declaration consumes: each id a step names, and
   * what each retired collection or page carries with it, derived by the contract
   * package from production exactly as its verifier claims it.
   */
  readonly consumed: ReadonlySet<string>;
}

/**
 * The sidecar for a plan a person wrote: bound by digest to the production
 * contract and content it migrates, parsed by the contract package's own
 * schema, and refused unless each step consumes exactly the fields its target's
 * anchor replaced.
 */
export function buildFieldMigrationDeclaration(
  plan: FieldMigrationPlan,
  evidence: ReplacedFieldEvidence,
  production: ProductionArtifacts,
): FieldMigrationDeclaration {
  const productionContract = parseManagedSiteContractV1(production.contract);
  const productionContent = parseManagedSiteContentDocument(production.content);
  const from = managedSiteFieldMigrationFromV1(productionContract, productionContent);
  const declaration = parseManagedSiteFieldMigrationV1({
    schemaVersion: "1.0",
    from,
    ...(plan.bridge === undefined ? {} : { bridge: plan.bridge }),
    steps: plan.steps,
  });
  assertPlanMatchesEvidence(declaration, evidence);
  const planned = new Set<string>(
    declaration.steps.flatMap((step) => (step.op === "merge" || step.op === "link" ? [step.target] : [])),
  );
  return {
    declaration,
    unplanned: evidence.groups.filter((group) => !planned.has(group.target)),
    consumed: new Set([
      ...declaration.steps.flatMap(stepSources),
      ...managedSiteFieldMigrationRetireCarriedIdsV1(productionContract, productionContent, declaration),
    ]),
  };
}

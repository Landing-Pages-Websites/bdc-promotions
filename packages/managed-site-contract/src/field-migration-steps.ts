import type { ManagedContentOwner } from "./content.js";
import { ownerKey, requiredOwner } from "./content-semantics-facts.js";
import type { ManagedContractCompatibilityFacts } from "./contract-compatibility-facts.js";
import { claimOnce, managedSiteFieldMigrationAliasedIds } from "./field-migration-claims.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import {
  resolveManagedSiteFieldMigrationRetiresV1,
  type ManagedSiteFieldMigrationResolvedRetireV1,
} from "./field-migration-retire.js";
import type {
  ManagedSiteFieldMigrationStepV1,
  ManagedSiteFieldMigrationV1,
} from "./field-migration-schema.js";
import {
  isManagedAttributeTextField,
  isManagedTokenTextField,
  MANAGED_PLAIN_TEXT_SEMANTICS,
  MANAGED_RUNNING_TEXT_SEMANTICS,
  type ManagedFieldDescriptor,
  type ManagedPlainTextSemantic,
} from "./fields.js";

/** A step whose ids have passed every identity rule. */
export interface ManagedSiteFieldMigrationResolvedStepV1 {
  readonly step: ManagedSiteFieldMigrationStepV1;
  readonly target: ManagedFieldDescriptor;
  readonly sources: readonly ManagedFieldDescriptor[];
  readonly owner: ManagedContentOwner;
  /**
   * The sources in production's order: the contract's declaration order (pages,
   * sections, fields), which the converter writes in rendering order.
   */
  readonly productionOrder: readonly string[];
  /** Production fields declared between the first and last source, in order. */
  readonly interleaved: readonly string[];
}

export interface ManagedSiteFieldMigrationResolutionV1 {
  /** The merge steps, in declaration order. */
  readonly steps: readonly ManagedSiteFieldMigrationResolvedStepV1[];
  /** The retire steps, in declaration order. */
  readonly retires: readonly ManagedSiteFieldMigrationResolvedRetireV1[];
  /**
   * Every production declaration the migration removes: each merge source,
   * each retired field and each retired section. The candidate drops exactly
   * these, and every other declaration is the ordinary policy's.
   */
  readonly retired: ReadonlySet<string>;
}

interface StepFacts {
  readonly production: ManagedContractCompatibilityFacts;
  readonly candidate: ManagedContractCompatibilityFacts;
}

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

/**
 * A field a migration may touch: a rendered page or site field outside any
 * alias group. Collection items and alias groups are deferred, not refused as
 * malformed, because they are real shapes this version does not prove yet.
 */
function renderedField(
  facts: ManagedContractCompatibilityFacts,
  id: string,
  role: "source" | "target",
): ManagedFieldDescriptor | undefined {
  const fact = facts.fields.get(id);
  if (fact === undefined) return undefined;
  if (fact.kind !== "rendered" || managedSiteFieldMigrationAliasedIds(facts).has(id)) {
    return fail(
      "MIGRATION_TRANSFORM_DEFERRED",
      `A ${role} that is a collection item, protected or aliased is not supported yet: ${id}`,
    );
  }
  return fact.descriptor;
}

function assertNewTarget(facts: StepFacts, id: string): void {
  if (facts.production.tombstones.has(id)) {
    fail("MIGRATION_TARGET_TOMBSTONED", `Target was retired in production: ${id}`);
  }
  if (facts.production.declarations.has(id)) {
    fail("MIGRATION_TARGET_EXISTS", `Target already exists in production: ${id}`);
  }
}

function resolveTarget(
  facts: StepFacts,
  step: ManagedSiteFieldMigrationStepV1,
): ManagedFieldDescriptor {
  assertNewTarget(facts, step.target);
  const target = renderedField(facts.candidate, step.target, "target");
  if (target === undefined) {
    return fail("MIGRATION_TARGET_UNDECLARED", `Candidate does not declare target ${step.target}`);
  }
  if (target.classification !== "customer_editable") {
    fail("MIGRATION_TARGET_NOT_EDITABLE", `Target is not customer-editable: ${step.target}`);
  }
  if (target.type !== step.into.type) {
    fail("MIGRATION_TARGET_TYPE_MISMATCH", `Target ${step.target} is not ${step.into.type}`);
  }
  assertStructureKept(target, step, "target");
  assertHardBreaksAdmitted(target, step);
  return target;
}

/**
 * Declared hard breaks are admitted by the target's own constraints and by
 * nothing else: it opts in with `allowHardBreaks`, and the breaks the step
 * declares fit its `maxHardBreaks`. Read from the declaration, so a step that
 * could never fit is refused before any value is read; the target value is
 * validated against the same constraints afterwards.
 */
function assertHardBreaksAdmitted(
  target: ManagedFieldDescriptor,
  step: ManagedSiteFieldMigrationStepV1,
): void {
  const breaks = step.parts.filter((part) => part.joinedBy === "hard_break").length;
  if (breaks === 0) return;
  const constraints = target.type === "rich_text" ? target.constraints : undefined;
  if (constraints?.allowHardBreaks !== true) {
    fail("MIGRATION_TARGET_CONSTRAINTS", `Target ${target.id} does not allow hard breaks`);
  }
  if (constraints.maxHardBreaks !== undefined && breaks > constraints.maxHardBreaks) {
    fail("MIGRATION_TARGET_CONSTRAINTS", `Target ${target.id} allows at most ${constraints.maxHardBreaks} hard breaks`);
  }
}

function resolveSource(facts: StepFacts, id: string): ManagedFieldDescriptor {
  const source = renderedField(facts.production, id, "source");
  if (source === undefined) {
    return fail("MIGRATION_SOURCE_UNKNOWN", `Production does not declare source ${id}`);
  }
  if (facts.candidate.declarations.has(id)) {
    fail("MIGRATION_SOURCE_STILL_DECLARED", `Candidate still declares source ${id}`);
  }
  if (!facts.candidate.tombstones.has(id)) {
    fail("MIGRATION_TOMBSTONES_INCOMPLETE", `Candidate does not tombstone source ${id}`);
  }
  return source;
}

/**
 * The plain-text roles a reader sees only as running text. Every other role
 * in the schema's enum (address, phone, email, legal, search text, and any
 * role added later) carries structured meaning a merge would drop, so it is
 * structured by default rather than by listing it.
 */
const RUNNING_TEXT_ROLES = MANAGED_RUNNING_TEXT_SEMANTICS;
/** Running text that may become a heading: a label or caption, never body copy. */
const HEADING_ROLES: ReadonlySet<ManagedPlainTextSemantic> = new Set(["label", "caption"]);
export const MANAGED_SITE_FIELD_MIGRATION_STRUCTURED_ROLES: readonly ManagedPlainTextSemantic[] = Object.freeze(
  MANAGED_PLAIN_TEXT_SEMANTICS.filter((role) => !RUNNING_TEXT_ROLES.has(role)),
);

/** What a field means to a reader, as the proof names it. */
export function managedSiteFieldMigrationRole(field: ManagedFieldDescriptor): string {
  if (field.type === "heading_text") return `heading:${field.semanticLevel}`;
  if (field.type === "plain_text") return field.semantic;
  return field.type;
}

function isHeadingInto(step: ManagedSiteFieldMigrationStepV1): boolean {
  return step.into.type === "rich_text" && step.into.block.type === "heading";
}

function assertPlainTextRole(field: ManagedFieldDescriptor, step: ManagedSiteFieldMigrationStepV1, role: "source" | "target"): void {
  if (field.type !== "plain_text") return;
  if (isManagedAttributeTextField(field)) {
    fail("MIGRATION_TRANSFORM_DEFERRED", `An attribute ${role} cannot be merged yet: ${field.id}`);
  }
  if (!RUNNING_TEXT_ROLES.has(field.semantic)) {
    fail("MIGRATION_TRANSFORM_DEFERRED", `A ${role} with structured meaning (${field.semantic}) cannot be merged yet: ${field.id}`);
  }
  if (role === "source" && isHeadingInto(step) && !HEADING_ROLES.has(field.semantic)) {
    fail("MIGRATION_SEMANTIC_CHANGED", `${field.semantic} text cannot become a heading: ${field.id}`);
  }
}

/**
 * A field whose type carries structure a reader or crawler sees keeps it. A
 * heading is a heading at its own level, so a heading source goes only into a
 * rich-text heading at exactly that level. Plain text keeps its role: running
 * text only, and only a label or caption may become a heading. A rich-text
 * source's block is in its value, so F checks it there. The block plain text
 * lands in is code's, and the proof names it with every source's role.
 */
function assertStructureKept(
  field: ManagedFieldDescriptor,
  step: ManagedSiteFieldMigrationStepV1,
  role: "source" | "target",
): void {
  // Text holding tokens a renderer fills (a template's numbers, a pattern's
  // item text) would be carried as literal braces, whatever its field type.
  if (isManagedTokenTextField(field)) {
    fail("MIGRATION_TRANSFORM_DEFERRED", `A ${role} whose text holds tokens cannot be merged yet: ${field.id}`);
  }
  assertPlainTextRole(field, step, role);
  if (field.type !== "heading_text" || role === "target") return;
  const { into } = step;
  const kept = into.type === "rich_text" && into.block.type === "heading" && into.block.level === field.semanticLevel;
  if (!kept) {
    fail("MIGRATION_SOURCE_STRUCTURE_LOST", `Heading ${field.id} at level ${field.semanticLevel} is not kept`);
  }
}

/**
 * Where a value lives is also which pages show it: the scope, the owner, and
 * every usage. A target must be shown exactly where each source was, so no
 * text leaves a page and none arrives on one.
 */
export function managedSiteFieldMigrationScopeKey(field: ManagedFieldDescriptor): string {
  const usages = field.usages.map((usage) => `${usage.pageId}:${usage.itemId ?? "-"}`).sort();
  return `${field.scope}|${ownerKey(requiredOwner(field))}|${usages.join(",")}`;
}

function assertSharedScope(
  target: ManagedFieldDescriptor,
  sources: readonly ManagedFieldDescriptor[],
): void {
  const expected = managedSiteFieldMigrationScopeKey(target);
  for (const source of sources) {
    if (managedSiteFieldMigrationScopeKey(source) !== expected) {
      fail("MIGRATION_SCOPE_MISMATCH", `Source ${source.id} and target ${target.id} differ in scope`);
    }
  }
}

function interleavedFields(
  production: ManagedContractCompatibilityFacts,
  sources: readonly ManagedFieldDescriptor[],
): readonly string[] {
  const order = [...production.fields.keys()];
  const ids = new Set<string>(sources.map((source) => source.id));
  const positions = sources.map((source) => order.indexOf(source.id));
  return order
    .slice(Math.min(...positions), Math.max(...positions) + 1)
    .filter((id) => !ids.has(id));
}

function inProductionOrder(
  production: ManagedContractCompatibilityFacts,
  sources: readonly ManagedFieldDescriptor[],
): readonly string[] {
  const order = [...production.fields.keys()];
  return sources.map((source) => source.id).sort((left, right) => order.indexOf(left) - order.indexOf(right));
}

function sourceIds(step: ManagedSiteFieldMigrationStepV1): readonly string[] {
  return step.parts.flatMap((part) => ("source" in part ? [part.source] : []));
}

function isMerge(step: ManagedSiteFieldMigrationV1["steps"][number]): step is ManagedSiteFieldMigrationStepV1 {
  return step.op === "merge";
}

/**
 * The identity rules: every source is a live production field claimed once and
 * retired in the candidate; every target is new, never tombstoned, editable,
 * of the declared type, claimed once, and shares one scope and owner with its
 * sources. A retired field is claimed from the same set as the sources, so no
 * production field is both merged and retired, or retired twice.
 */
export function resolveManagedSiteFieldMigrationStepsV1(
  production: ManagedContractCompatibilityFacts,
  candidate: ManagedContractCompatibilityFacts,
  declaration: ManagedSiteFieldMigrationV1,
  productionContract: ManagedSiteContractV1,
): ManagedSiteFieldMigrationResolutionV1 {
  const facts = { production, candidate };
  const claimedSources = new Set<string>();
  const claimedTargets = new Set<string>();
  const steps = declaration.steps.filter(isMerge).map((step) => {
    claimOnce(claimedTargets, step.target, "MIGRATION_TARGET_CLAIMED_TWICE");
    const target = resolveTarget(facts, step);
    const sources = sourceIds(step).map((id) => {
      claimOnce(claimedSources, id, "MIGRATION_SOURCE_CLAIMED_TWICE");
      const source = resolveSource(facts, id);
      assertStructureKept(source, step, "source");
      return source;
    });
    assertSharedScope(target, sources);
    return {
      step,
      target,
      sources,
      owner: requiredOwner(target),
      productionOrder: inProductionOrder(production, sources),
      interleaved: interleavedFields(production, sources),
    };
  });
  // A target that is also a source is refused above: every source is a
  // production declaration, and a target may not be one.
  const retires = resolveManagedSiteFieldMigrationRetiresV1(facts, productionContract, declaration, claimedSources);
  const retired = new Set<string>(claimedSources);
  for (const retire of retires) {
    for (const section of retire.sections) retired.add(section.id);
  }
  return { steps, retires, retired };
}

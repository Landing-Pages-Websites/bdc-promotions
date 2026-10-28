import { createHash } from "node:crypto";

import { canonicalizeJson } from "./canonical.js";
import {
  validateParsedManagedFieldValue,
  type ManagedSiteContentDocument,
  type ManagedSiteContentValue,
} from "./content.js";
import { validateManagedSiteContractV1ContentSemantics } from "./content-semantics.js";
import { contentValueKey } from "./content-semantics-facts.js";
import {
  collectManagedContractCompatibilityFacts,
  type ManagedContractCompatibilityFacts,
} from "./contract-compatibility-facts.js";
import {
  assertManagedContractFactsCompatible,
  assertManifestPreserved,
  validateCompatibilityInputs,
} from "./contract-compatibility-policy.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { parseJsonValue } from "./json.js";
import {
  assertManagedSiteFieldMigrationBridgeV1,
  type ManagedSiteBridgeAdmission,
  type ManagedSiteFieldMigrationBridgeStepV1,
} from "./field-migration-bridge.js";
import {
  resolveManagedSiteFieldMigrationLinksV1,
  type ManagedSiteFieldMigrationResolvedLinkV1,
} from "./field-migration-link.js";
import { proveManagedSiteFieldMigrationLinkV1 } from "./field-migration-link-values.js";
import {
  correctManagedSiteImageMetadataV1,
  managedSiteFieldMigrationCorrectedValueKeys,
  proveManagedSiteFieldMigrationImageMetadataV1,
  resolveManagedSiteFieldMigrationImageMetadataV1,
  type ManagedSiteFieldMigrationResolvedImageMetadataV1,
  type ManagedSiteImageFileReader,
} from "./field-migration-image-metadata.js";
import {
  proveManagedSiteFieldMigrationRescopeV1,
  resolveManagedSiteFieldMigrationRescopesV1,
  type ManagedSiteFieldMigrationResolvedRescopeV1,
} from "./field-migration-rescope.js";
import {
  managedSiteFieldMigrationAddedItems,
  managedSiteFieldMigrationImageMetadataStepProof,
  managedSiteFieldMigrationLinkAddedItems,
  managedSiteFieldMigrationLinkStepProof,
  managedSiteFieldMigrationRescopeAddedItems,
  managedSiteFieldMigrationRescopeStepProof,
  managedSiteFieldMigrationRetirePageStepProof,
  managedSiteFieldMigrationRetireStepProof,
  managedSiteFieldMigrationStepProof,
  type ManagedSiteFieldMigrationAccountingV1,
  type ManagedSiteFieldMigrationAdditionsV1,
  type ManagedSiteFieldMigrationProofV1,
  type ManagedSiteFieldMigrationMergeStepProofV1,
  type ManagedSiteFieldMigrationStepProofV1,
} from "./field-migration-proof.js";
import { managedSiteFieldMigrationMoves } from "./field-migration-position.js";
import {
  assertManagedSiteFieldMigrationReferencesV1,
  managedSiteFieldMigrationRenames,
} from "./field-migration-references.js";
import {
  assertManagedSiteFieldMigrationRetireReferencesV1,
  managedSiteFieldMigrationRetireRenames,
} from "./field-migration-retire-references.js";
import { managedSiteFieldMigrationRetiredItemsByCollection } from "./field-migration-retire-collections.js";
import {
  assertManagedSiteFieldMigrationPagesRemovedV1,
  isManagedSiteFieldMigrationPageRetire,
  type ManagedSiteFieldMigrationRetiredPageV1,
  projectManagedSiteFieldMigrationPageRetiresV1,
  resolveManagedSiteFieldMigrationPageRetiresV1,
} from "./field-migration-retire-pages.js";
import { assertManagedSiteFieldMigrationUrlsV1 } from "./field-migration-urls.js";
import {
  parseManagedSiteFieldMigrationV1,
  type ManagedSiteFieldMigrationV1,
} from "./field-migration-schema.js";
import {
  resolveManagedSiteFieldMigrationStepsV1,
  type ManagedSiteFieldMigrationResolutionV1,
  type ManagedSiteFieldMigrationResolvedStepV1,
} from "./field-migration-steps.js";
import {
  applyManagedSiteFieldMigrationStepV1,
  joinManagedSiteFieldMigrationRuns,
  managedSiteFieldMigrationSourceRuns,
  readBackManagedSiteFieldMigrationStepV1,
  type ManagedSiteFieldMigrationResultV1,
} from "./field-migration-transform.js";

export interface ManagedSiteFieldMigrationOptionsV1 {
  readonly admitBridge: ManagedSiteBridgeAdmission;
  /**
   * Reads a committed image file's bytes (0.42.0). Only an image-metadata
   * step reads files; a declaration with one and no reader is refused
   * (`MIGRATION_IMAGE_METADATA_UNOBSERVED`), never trusted.
   */
  readonly readImageFile?: ManagedSiteImageFileReader;
}

type ValuesByKey = ReadonlyMap<string, ManagedSiteContentValue>;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonicalizeJson(value), "utf8").digest("hex");
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

/**
 * The `from` a declaration names: the sha256 of the canonical JSON of the
 * production contract and content, as the normalized artifacts digest them.
 */
export function managedSiteFieldMigrationFromV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
): ManagedSiteFieldMigrationV1["from"] {
  return { contractSha256: sha256Canonical(contract), contentSha256: sha256Canonical(content) };
}

function assertFrom(
  declaration: ManagedSiteFieldMigrationV1,
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
): void {
  if (!canonicalEqual(declaration.from, managedSiteFieldMigrationFromV1(contract, content))) {
    fail("MIGRATION_FROM_STALE", "The declaration was written against other production artifacts");
  }
}

function assertRuntimeIdentity(
  production: ManagedSiteContractV1,
  candidate: ManagedSiteContractV1,
): void {
  if (
    production.contractId !== candidate.contractId ||
    !canonicalEqual(production.adapter, candidate.adapter)
  ) {
    fail("MIGRATION_RUNTIME_CHANGED", "Contract id or adapter changed");
  }
}

function valuesByKey(content: ManagedSiteContentDocument): ValuesByKey {
  return new Map(content.values.map((value) => [contentValueKey(value.fieldId, value.owner), value]));
}

/**
 * The invariant: every production value is either unchanged in the candidate or
 * consumed by exactly one step (a merge source, a field a retire removes, or a
 * value an image-metadata step corrects), and no candidate value sits on a
 * field the migration removed.
 */
function accountForProduction(
  production: ManagedSiteContentDocument,
  candidate: ManagedSiteContentDocument,
  plan: Pick<MigrationPlan, "retired" | "rescoped" | "corrected">,
): { readonly unchanged: number; readonly consumed: number } {
  const { retired, rescoped, corrected } = plan;
  const remaining = candidate.values.find((value) => retired.has(value.fieldId));
  if (remaining !== undefined) {
    fail("MIGRATION_SOURCE_VALUE_REMAINS", `Candidate keeps a value on source ${remaining.fieldId}`);
  }
  const candidateValues = valuesByKey(candidate);
  let unchanged = 0;
  let consumed = 0;
  for (const value of production.values) {
    // A rescoped field's page value is consumed; its site value is the step's target.
    // A corrected value is consumed; its candidate value is the step's target.
    if (retired.has(value.fieldId) || rescoped.has(value.fieldId) || corrected.has(contentValueKey(value.fieldId, value.owner))) {
      consumed += 1;
      continue;
    }
    const next = candidateValues.get(contentValueKey(value.fieldId, value.owner));
    if (next === undefined || !canonicalEqual(value, next)) {
      fail("MIGRATION_UNDECLARED_CHANGE", `Production value changed outside a step: ${value.fieldId}`);
    }
    unchanged += 1;
  }
  return { unchanged, consumed };
}

/**
 * Everything the candidate holds that production did not, besides the step
 * targets: new declarations, new values and new asset material. The ordinary
 * policy admits them, so a migration does too, but they are derived from the
 * production-to-candidate diff and listed, never inferred from the declaration.
 */
function candidateAdditions(
  facts: { readonly production: ManagedContractCompatibilityFacts; readonly candidate: ManagedContractCompatibilityFacts },
  production: ManagedSiteContentDocument,
  candidate: ManagedSiteContentDocument,
  targets: ReadonlySet<string>,
): ManagedSiteFieldMigrationAdditionsV1 {
  const productionKeys = new Set(valuesByKey(production).keys());
  return {
    stableIds: [...facts.candidate.declarations.keys()]
      .filter((id) => !facts.production.declarations.has(id) && !targets.has(id))
      .sort(),
    contentValues: candidate.values
      .filter((value) => !targets.has(value.fieldId))
      .filter((value) => !productionKeys.has(contentValueKey(value.fieldId, value.owner)))
      .map((value) => ({ fieldId: value.fieldId, owner: value.owner })),
    assetManifestEntries: candidate.assetManifest.length - production.assetManifest.length,
  };
}

function accountForContent(
  production: ManagedSiteContentDocument,
  candidate: ManagedSiteContentDocument,
  plan: MigrationPlan,
  additions: ManagedSiteFieldMigrationAdditionsV1,
): ManagedSiteFieldMigrationAccountingV1 {
  const { unchanged, consumed } = accountForProduction(production, candidate, plan);
  const targets = candidate.values.filter(
    (value) => plan.targets.has(value.fieldId) || plan.corrected.has(contentValueKey(value.fieldId, value.owner)),
  ).length;
  const added = additions.contentValues.length;
  if (unchanged + targets + added !== candidate.values.length) {
    fail("MIGRATION_UNDECLARED_CHANGE", "Candidate values are not production, targets and listed additions");
  }
  return {
    productionValues: production.values.length,
    unchanged,
    consumed,
    candidateValues: candidate.values.length,
    targets,
    added,
  };
}

function sourceValues(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
  production: ValuesByKey,
): ValuesByKey {
  return new Map(
    resolved.sources.map((source) => {
      const value = production.get(contentValueKey(source.id, resolved.owner));
      if (value === undefined) {
        return fail("MIGRATION_SOURCE_VALUE_MISSING", `Source ${source.id} has no production value`);
      }
      return [source.id, value];
    }),
  );
}

function asTargetValue(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
  result: ManagedSiteFieldMigrationResultV1,
): ManagedSiteContentValue {
  const value = {
    fieldId: resolved.target.id,
    owner: resolved.owner,
    type: resolved.target.type,
    value: result.value,
  } as ManagedSiteContentValue;
  try {
    validateParsedManagedFieldValue(resolved.target, value);
  } catch (error) {
    if (!(error instanceof ManagedSiteContractError)) throw error;
    fail("MIGRATION_TARGET_CONSTRAINTS", `Target ${resolved.target.id} does not admit F's value: ${error.code}`);
  }
  return value;
}

function candidateTarget(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
  candidate: ValuesByKey,
): ManagedSiteContentValue {
  const value = candidate.get(contentValueKey(resolved.target.id, resolved.owner));
  if (value === undefined) {
    return fail("MIGRATION_TARGET_VALUE_MISSING", `Candidate has no value for ${resolved.target.id}`);
  }
  return value;
}

function assertReadBack(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
  target: ManagedSiteContentValue,
  result: ManagedSiteFieldMigrationResultV1,
  sources: ValuesByKey,
): void {
  const read = readBackManagedSiteFieldMigrationStepV1(target, resolved.step, result.offsets);
  for (const recovered of read) {
    const source = sources.get(recovered.fieldId);
    const expected = source === undefined
      ? undefined
      : joinManagedSiteFieldMigrationRuns(managedSiteFieldMigrationSourceRuns(source));
    if (!canonicalEqual(recovered.runs, expected ?? null)) {
      fail("MIGRATION_READBACK_MISMATCH", `Source ${recovered.fieldId} does not read back with its marks`);
    }
  }
}

function proveStep(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
  production: ValuesByKey,
  candidate: ValuesByKey,
): ManagedSiteFieldMigrationMergeStepProofV1 {
  const sources = sourceValues(resolved, production);
  const result = applyManagedSiteFieldMigrationStepV1(resolved.step, sources);
  const expected = asTargetValue(resolved, result);
  const actual = candidateTarget(resolved, candidate);
  if (!canonicalEqual(actual, expected)) {
    fail("MIGRATION_TARGET_MISMATCH", `Candidate ${resolved.target.id} is not F of its sources`);
  }
  assertReadBack(resolved, actual, result, sources);
  return managedSiteFieldMigrationStepProof(resolved, result.offsets);
}

function assertSomethingMigrates(
  declaration: ManagedSiteFieldMigrationV1,
  bridge: unknown,
): void {
  if (declaration.steps.length === 0 && bridge === null) {
    fail("MIGRATION_DECLARATION_EMPTY", "A declaration with no step and no bridge change migrates nothing");
  }
}

interface MigrationInputs {
  readonly productionContract: ManagedSiteContractV1;
  readonly productionContent: ManagedSiteContentDocument;
  readonly candidateContract: ManagedSiteContractV1;
  readonly candidateContent: ManagedSiteContentDocument;
}

/** The declaration names these artifacts, and the runtime moves only as declared. */
function assertRuntime(
  inputs: MigrationInputs,
  declaration: ManagedSiteFieldMigrationV1,
  options: ManagedSiteFieldMigrationOptionsV1,
): ManagedSiteFieldMigrationBridgeStepV1 | null {
  assertFrom(declaration, inputs.productionContract, inputs.productionContent);
  validateCompatibilityInputs(inputs.productionContract, inputs.productionContent, inputs.candidateContract);
  assertRuntimeIdentity(inputs.productionContract, inputs.candidateContract);
  const bridge = assertManagedSiteFieldMigrationBridgeV1(
    inputs.productionContract, inputs.candidateContract, declaration, options.admitBridge,
  );
  assertSomethingMigrates(declaration, bridge);
  return bridge;
}

/**
 * Each step's proof at the step's own position in the declaration, so the
 * ledger can pair them one to one: merges by their (distinct) target, retires
 * in the order they were declared.
 */
function proofsInDeclarationOrder(
  declaration: ManagedSiteFieldMigrationV1,
  merges: readonly ManagedSiteFieldMigrationMergeStepProofV1[],
  plan: MigrationPlan,
  productionContent: ManagedSiteContentDocument,
): readonly ManagedSiteFieldMigrationStepProofV1[] {
  const byTarget = new Map(merges.map((proof) => [proof.target, proof]));
  const items = managedSiteFieldMigrationRetiredItemsByCollection(productionContent, plan.resolution.retires);
  const queues = {
    retire: plan.resolution.retires.map((retire) => managedSiteFieldMigrationRetireStepProof(retire, items)),
    link: plan.links.map(managedSiteFieldMigrationLinkStepProof),
    rescope: plan.rescopes.map(managedSiteFieldMigrationRescopeStepProof),
    "image-metadata": plan.images.map(managedSiteFieldMigrationImageMetadataStepProof),
  };
  const next = { retire: 0, link: 0, rescope: 0, "image-metadata": 0 };
  return declaration.steps.map((step) => {
    const proof = step.op === "merge" ? byTarget.get(step.target) : queues[step.op][next[step.op]++];
    if (proof === undefined) return fail("MIGRATION_DECLARATION_INVALID", "A declared step has no proof");
    return proof;
  });
}

/**
 * Every step resolved: the merges and retires, then the link steps claiming
 * from the same sets, and what the whole migration removes and creates.
 */
interface MigrationPlan {
  readonly resolution: ManagedSiteFieldMigrationResolutionV1;
  readonly links: readonly ManagedSiteFieldMigrationResolvedLinkV1[];
  readonly rescopes: readonly ManagedSiteFieldMigrationResolvedRescopeV1[];
  readonly images: readonly ManagedSiteFieldMigrationResolvedImageMetadataV1[];
  /** Every production declaration removed: merge sources, retired ids, link sources. */
  readonly retired: ReadonlySet<string>;
  /** Every field a rescope step moves to site scope: kept, with its value under a new owner. */
  readonly rescoped: ReadonlySet<string>;
  /** Every field a step writes: merge and link targets, and rescoped fields. */
  readonly targets: ReadonlySet<string>;
  /** The key of every value an image-metadata step corrects: kept, with its file's true metadata. */
  readonly corrected: ReadonlySet<string>;
}

function planMigration(
  inputs: MigrationInputs,
  facts: { readonly production: ManagedContractCompatibilityFacts; readonly candidate: ManagedContractCompatibilityFacts },
  declaration: ManagedSiteFieldMigrationV1,
  readImageFile: ManagedSiteImageFileReader | undefined,
): MigrationPlan {
  const resolution = resolveManagedSiteFieldMigrationStepsV1(
    facts.production, facts.candidate, declaration, inputs.productionContract,
  );
  const mergeTargets = resolution.steps.map(({ step }) => step.target as string);
  const claimed = { sources: new Set<string>(resolution.retired), targets: new Set<string>(mergeTargets) };
  const links = resolveManagedSiteFieldMigrationLinksV1(
    {
      ...facts,
      productionContract: inputs.productionContract,
      productionContent: inputs.productionContent,
      candidateContract: inputs.candidateContract,
    },
    declaration,
    claimed,
  );
  const rescopes = resolveManagedSiteFieldMigrationRescopesV1(
    { ...facts, productionContract: inputs.productionContract, candidateContract: inputs.candidateContract },
    declaration,
    claimed,
  );
  const rescoped = new Set<string>(rescopes.map(({ production }) => production.id));
  const images = resolveManagedSiteFieldMigrationImageMetadataV1(
    inputs.productionContent, declaration, readImageFile, claimed,
  );
  return {
    resolution,
    links,
    rescopes,
    images,
    corrected: managedSiteFieldMigrationCorrectedValueKeys(images),
    retired: new Set<string>([...resolution.retired, ...links.map(({ source }) => source.id)]),
    rescoped,
    targets: new Set<string>([...mergeTargets, ...links.map(({ target }) => target.id), ...rescoped]),
  };
}

function proveLinks(inputs: MigrationInputs, links: readonly ManagedSiteFieldMigrationResolvedLinkV1[]): void {
  const production = { values: inputs.productionContent.values, byKey: valuesByKey(inputs.productionContent) };
  const candidate = { values: inputs.candidateContent.values, byKey: valuesByKey(inputs.candidateContent) };
  for (const link of links) proveManagedSiteFieldMigrationLinkV1(link, production, candidate);
}

function proveMigration(
  inputs: MigrationInputs,
  declaration: ManagedSiteFieldMigrationV1,
  readImageFile: ManagedSiteImageFileReader | undefined,
): Pick<ManagedSiteFieldMigrationProofV1, "accounting" | "steps" | "additions" | "added"> {
  const productionFacts = collectManagedContractCompatibilityFacts(inputs.productionContract);
  const candidateFacts = collectManagedContractCompatibilityFacts(inputs.candidateContract);
  const facts = { production: productionFacts, candidate: candidateFacts };
  const plan = planMigration(inputs, facts, declaration, readImageFile);
  const { resolution } = plan;
  const additions = candidateAdditions(facts, inputs.productionContent, inputs.candidateContent, plan.targets);
  const accounting = accountForContent(inputs.productionContent, inputs.candidateContent, plan, additions);
  // A rescoped field is held to its own rule (identical but for scope and
  // usages, every usage kept), so the ordinary policy, which keeps a scope
  // exactly, skips it as it skips what a migration retires.
  assertManagedContractFactsCompatible(productionFacts, candidateFacts, new Set([...plan.retired, ...plan.rescoped]));
  const outlineEntries = assertManagedSiteFieldMigrationReferencesV1(inputs.productionContract, inputs.candidateContract, resolution.steps);
  const repoints = assertManagedSiteFieldMigrationRetireReferencesV1(inputs, resolution.retires);
  const renames = new Map([
    ...managedSiteFieldMigrationRenames(resolution.steps),
    ...managedSiteFieldMigrationRetireRenames(repoints),
  ]);
  const outlines = assertManagedSiteFieldMigrationUrlsV1(inputs, renames);
  const production = valuesByKey(inputs.productionContent);
  const candidate = valuesByKey(inputs.candidateContent);
  const merges = resolution.steps.map((resolved) => proveStep(resolved, production, candidate));
  proveLinks(inputs, plan.links);
  for (const rescope of plan.rescopes) {
    proveManagedSiteFieldMigrationRescopeV1(rescope, inputs.productionContent, inputs.candidateContent);
  }
  // Production as the image-metadata steps correct it: every other value and
  // manifest entry is held to it exactly, and so is every corrected one.
  const corrected = correctManagedSiteImageMetadataV1(inputs.productionContent, plan.images);
  proveManagedSiteFieldMigrationImageMetadataV1(plan.images, corrected, inputs.candidateContent);
  assertManifestPreserved(corrected.assetManifest, inputs.candidateContent.assetManifest);
  validateManagedSiteContractV1ContentSemantics(inputs.candidateContract, inputs.candidateContent);
  const added = [
    ...resolution.steps.flatMap(managedSiteFieldMigrationAddedItems),
    ...plan.links.flatMap(managedSiteFieldMigrationLinkAddedItems),
    ...plan.rescopes.flatMap(managedSiteFieldMigrationRescopeAddedItems),
    ...managedSiteFieldMigrationMoves(inputs.productionContract, inputs.candidateContract, resolution.steps),
    ...outlineEntries,
    ...repoints,
    ...outlines,
  ];
  return { accounting, steps: proofsInDeclarationOrder(declaration, merges, plan, inputs.productionContent), additions, added };
}

/**
 * Page retires first (0.30.0): each is judged against production itself
 * (before the candidate is read, so a refusal names what in production still
 * points at the page), its removal from the candidate is proven, then
 * every other step and rule runs against production with those pages removed
 * (the projection), so whatever the pages did not carry is held to exactly
 * the rules it would be without them. The proof's accounting and steps are
 * production's: the pages' values count as consumed, and each page step's
 * proof sits at its own position in the declaration.
 */
function proveWithPagesRetired(
  inputs: MigrationInputs,
  declaration: ManagedSiteFieldMigrationV1,
  pageSteps: readonly (readonly ManagedSiteFieldMigrationRetiredPageV1[])[],
  readImageFile: ManagedSiteImageFileReader | undefined,
): Pick<ManagedSiteFieldMigrationProofV1, "accounting" | "steps" | "additions" | "added"> {
  assertManagedSiteFieldMigrationPagesRemovedV1(inputs.candidateContract, pageSteps.flat());
  const projection = projectManagedSiteFieldMigrationPageRetiresV1(
    inputs.productionContract, inputs.productionContent, pageSteps.flat(),
  );
  const proven = proveMigration(
    { ...inputs, productionContract: projection.contract, productionContent: projection.content },
    { ...declaration, steps: declaration.steps.filter((step) => !isManagedSiteFieldMigrationPageRetire(step)) },
    readImageFile,
  );
  const pageProofs = pageSteps.map(managedSiteFieldMigrationRetirePageStepProof);
  const next = { page: 0, other: 0 };
  const steps = declaration.steps.map((step) =>
    isManagedSiteFieldMigrationPageRetire(step) ? pageProofs[next.page++] : proven.steps[next.other++]);
  if (steps.some((proof) => proof === undefined)) fail("MIGRATION_DECLARATION_INVALID", "A declared step has no proof");
  const accounting = {
    ...proven.accounting,
    productionValues: proven.accounting.productionValues + projection.consumed,
    consumed: proven.accounting.consumed + projection.consumed,
  };
  return { ...proven, accounting, steps: steps as ManagedSiteFieldMigrationStepProofV1[] };
}

/**
 * Whether a candidate is production plus exactly the declared migration: the
 * runtime moves at most one admitted bridge version forward, every production
 * value is unchanged, consumed by one merge step whose target equals F of its
 * sources and reads back to them, or removed with a field, collection or page
 * a retire step names,
 * and every other compatibility rule holds for everything the migration does
 * not retire. Returns the proof, including every piece of material the
 * migration adds and every field and section it removes.
 */
export function validateManagedSiteContractV1MigrationCompatibility(
  productionContract: ManagedSiteContractV1,
  productionContent: ManagedSiteContentDocument,
  candidateContract: ManagedSiteContractV1,
  candidateContent: ManagedSiteContentDocument,
  declarationInput: unknown,
  options: ManagedSiteFieldMigrationOptionsV1,
): ManagedSiteFieldMigrationProofV1 {
  const inputs = { productionContract, productionContent, candidateContract, candidateContent };
  const declaration = parseManagedSiteFieldMigrationV1(declarationInput);
  assertFrom(declaration, productionContract, productionContent);
  const pageSteps = resolveManagedSiteFieldMigrationPageRetiresV1(productionContract, productionContent, declaration);
  const bridge = assertRuntime(inputs, declaration, options);
  const { accounting, steps, additions, added } = proveWithPagesRetired(inputs, declaration, pageSteps, options.readImageFile);
  return parseJsonValue({
    kind: "migrated",
    declarationSha256: sha256Canonical(declaration),
    bridge,
    accounting,
    steps,
    added,
    additions,
  }) as unknown as ManagedSiteFieldMigrationProofV1;
}

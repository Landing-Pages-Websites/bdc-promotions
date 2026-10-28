import { canonicalizeJson } from "./canonical.js";
import type { ManagedCompatibilityFieldFact } from "./contract-compatibility-facts.js";
import {
  isManagedOptionalItemField,
  type ManagedCollectionDescriptor,
  type ManagedCollectionItemField,
  type ManagedFieldDescriptor,
  type ManagedLinkConstraints,
} from "./fields.js";
import type { ManagedInternalProtectedField } from "./seo.js";
import { isAnyHttpsHost, type ManagedAssetSlotDescriptor } from "./values.js";

type RenderedOrItemField = ManagedFieldDescriptor | ManagedCollectionItemField;

export function includesAllValues<T>(
  candidate: readonly T[],
  production: readonly T[],
): boolean {
  const available = new Set(candidate);
  return production.every((value) => available.has(value));
}

function usageKey(usage: {
  readonly pageId: string;
  readonly itemId: string | null;
}): string {
  return `${usage.pageId}:${usage.itemId ?? "site"}`;
}

function usagesPreserved(
  production: readonly {
    readonly pageId: string;
    readonly itemId: string | null;
  }[],
  candidate: readonly {
    readonly pageId: string;
    readonly itemId: string | null;
  }[],
): boolean {
  return includesAllValues(candidate.map(usageKey), production.map(usageKey));
}

function textConstraintsWiden(
  production: {
    readonly minLength: number;
    readonly maxLength: number;
    readonly newlines: "forbid" | "allow";
  },
  candidate: {
    readonly minLength: number;
    readonly maxLength: number;
    readonly newlines: "forbid" | "allow";
  },
): boolean {
  return (
    candidate.minLength <= production.minLength &&
    candidate.maxLength >= production.maxLength &&
    (production.newlines === "forbid" || candidate.newlines === "allow")
  );
}

interface ExternalHostPolicy {
  readonly externalHostPolicy?: "declared" | "any_https";
  readonly allowedExternalHosts: readonly string[];
}

/**
 * Whether the candidate admits every external host production did. `any_https`
 * admits every DNS name, so it widens a declared list of DNS names; a list host it
 * would refuse (an IP literal, `localhost`) keeps it from widening. Production
 * `any_https` is narrowed by any declared list, however long.
 */
function externalHostsWiden(
  production: ExternalHostPolicy,
  candidate: ExternalHostPolicy,
): boolean {
  if (candidate.externalHostPolicy === "any_https") {
    return production.allowedExternalHosts.every(isAnyHttpsHost);
  }
  if (production.externalHostPolicy === "any_https") return false;
  return includesAllValues(
    candidate.allowedExternalHosts,
    production.allowedExternalHosts,
  );
}

/** An optional upper bound, where absent is unbounded and so the widest. */
function boundWidens(production: number | undefined, candidate: number | undefined): boolean {
  if (candidate === undefined) return true;
  return production !== undefined && candidate >= production;
}

interface HardBreakPolicy {
  readonly allowHardBreaks?: boolean;
  readonly maxHardBreaks?: number;
}

/**
 * Whether the candidate admits every break count production did. A field that
 * did not opt in admitted none, so any opt-in widens it, whatever its cap;
 * one that did must still opt in, with a cap no lower (absent is unbounded).
 */
function hardBreaksWiden(production: HardBreakPolicy, candidate: HardBreakPolicy): boolean {
  if (production.allowHardBreaks !== true) return true;
  return (
    candidate.allowHardBreaks === true &&
    boundWidens(production.maxHardBreaks, candidate.maxHardBreaks)
  );
}

function richTextConstraintsWiden(
  production: Extract<
    RenderedOrItemField,
    { readonly type: "rich_text" }
  >["constraints"],
  candidate: Extract<
    RenderedOrItemField,
    { readonly type: "rich_text" }
  >["constraints"],
): boolean {
  return (
    candidate.maxCharacters >= production.maxCharacters &&
    candidate.maxNodes >= production.maxNodes &&
    boundWidens(production.maxBlocks, candidate.maxBlocks) &&
    hardBreaksWiden(production, candidate) &&
    includesAllValues(candidate.allowedBlocks, production.allowedBlocks) &&
    includesAllValues(candidate.allowedMarks, production.allowedMarks) &&
    (!production.allowLinks || candidate.allowLinks) &&
    externalHostsWiden(production, candidate) &&
    includesAllValues(candidate.allowedTargets, production.allowedTargets)
  );
}

function authorityKinds(
  authority: "internal_only" | "external_only" | "internal_or_external",
): readonly string[] {
  if (authority === "internal_only") return ["internal"];
  if (authority === "external_only") return ["external"];
  return ["internal", "external"];
}

function fragmentsWiden(
  production: Extract<
    RenderedOrItemField,
    { readonly type: "link" }
  >["constraints"],
  candidate: Extract<
    RenderedOrItemField,
    { readonly type: "link" }
  >["constraints"],
): boolean {
  if (production.fragmentPolicy === "forbid") return true;
  return (
    candidate.fragmentPolicy === "declared" &&
    includesAllValues(candidate.allowedFragments, production.allowedFragments)
  );
}

/**
 * Every query production admits, the candidate admits: for each page
 * production declares, the candidate declares each of its parameters with
 * every one of its values. Absent is no query, as `[]` is.
 */
function queriesWiden(production: ManagedLinkConstraints, candidate: ManagedLinkConstraints): boolean {
  const candidatePages = candidate.allowedQueries ?? [];
  return (production.allowedQueries ?? []).every((page) => {
    const widened = candidatePages.find((entry) => entry.pageId === page.pageId);
    return (
      widened !== undefined &&
      page.parameters.every((parameter) => {
        const kept = widened.parameters.find((entry) => entry.name === parameter.name);
        return kept !== undefined && includesAllValues(kept.values, parameter.values);
      })
    );
  });
}

function linkConstraintsWiden(
  production: Extract<
    RenderedOrItemField,
    { readonly type: "link" }
  >["constraints"],
  candidate: Extract<
    RenderedOrItemField,
    { readonly type: "link" }
  >["constraints"],
): boolean {
  return (
    textConstraintsWiden(
      production.labelConstraints,
      candidate.labelConstraints,
    ) &&
    includesAllValues(
      authorityKinds(candidate.authority),
      authorityKinds(production.authority),
    ) &&
    includesAllValues(candidate.allowedSchemes, production.allowedSchemes) &&
    externalHostsWiden(production, candidate) &&
    fragmentsWiden(production, candidate) &&
    queriesWiden(production, candidate) &&
    includesAllValues(candidate.allowedTargets, production.allowedTargets)
  );
}

function plainTextPolicyWiden(
  production: Extract<RenderedOrItemField, { readonly type: "plain_text" }>,
  candidate: RenderedOrItemField,
): boolean {
  return (
    candidate.type === "plain_text" &&
    candidate.semantic === production.semantic &&
    textConstraintsWiden(production.constraints, candidate.constraints) &&
    templatesKept(production.constraints.template, candidate.constraints.template) &&
    // A pattern's tokens are in every stored value: kept exactly, as a template.
    templatesKept(production.constraints.pattern, candidate.constraints.pattern) &&
    // Kept exactly: adding, dropping or changing it moves where a stored value
    // renders (an element's text, or another attribute), a different field to
    // the customer rather than a wider one.
    production.constraints.attribute === candidate.constraints.attribute
  );
}

/**
 * A template is kept exactly or not at all. Adding one refuses every value
 * production holds (none has its tokens), dropping one shows a customer's
 * tokens as literal braces, and any other change moves what a stored value
 * renders as or which number selects it, so none of them is a widening.
 */
function templatesKept(production: unknown, candidate: unknown): boolean {
  if (production === undefined || candidate === undefined) return production === candidate;
  return canonicalizeJson(production) === canonicalizeJson(candidate);
}

function headingTextPolicyWiden(
  production: Extract<RenderedOrItemField, { readonly type: "heading_text" }>,
  candidate: RenderedOrItemField,
): boolean {
  return (
    candidate.type === "heading_text" &&
    candidate.semanticLevel === production.semanticLevel &&
    textConstraintsWiden(production.constraints, candidate.constraints) &&
    templatesKept(production.constraints.pattern, candidate.constraints.pattern)
  );
}

function richTextPolicyWiden(
  production: Extract<RenderedOrItemField, { readonly type: "rich_text" }>,
  candidate: RenderedOrItemField,
): boolean {
  return (
    candidate.type === "rich_text" &&
    richTextConstraintsWiden(production.constraints, candidate.constraints)
  );
}

function linkPolicyWiden(
  production: Extract<RenderedOrItemField, { readonly type: "link" }>,
  candidate: RenderedOrItemField,
): boolean {
  // Required may become optional (more values admitted), never back:
  // production may hold an item with no link.
  return (
    candidate.type === "link" &&
    linkConstraintsWiden(production.constraints, candidate.constraints) &&
    (!isManagedOptionalItemField(production) || isManagedOptionalItemField(candidate))
  );
}

/**
 * Every icon production may hold stays choosable, from the same library: a
 * choice dropped would leave a stored name no site renders. A label may change
 * and a choice may be added.
 */
function iconPolicyWiden(
  production: Extract<RenderedOrItemField, { readonly type: "icon" }>,
  candidate: RenderedOrItemField,
): boolean {
  if (candidate.type !== "icon" || candidate.constraints.library !== production.constraints.library) return false;
  const kept = new Set(candidate.constraints.choices.map((choice) => choice.name));
  return production.constraints.choices.every((choice) => kept.has(choice.name));
}

function valuePolicyWiden(
  production: RenderedOrItemField,
  candidate: RenderedOrItemField,
): boolean {
  switch (production.type) {
    case "plain_text":
      return plainTextPolicyWiden(production, candidate);
    case "heading_text":
      return headingTextPolicyWiden(production, candidate);
    case "rich_text":
      return richTextPolicyWiden(production, candidate);
    case "link":
      return linkPolicyWiden(production, candidate);
    case "image":
      // Required may become optional (more values admitted), never back:
      // production may hold an item with no image.
      return (
        candidate.type === "image" &&
        candidate.assetSlotId === production.assetSlotId &&
        (!isManagedOptionalItemField(production) || isManagedOptionalItemField(candidate))
      );
    case "collection":
      return (
        candidate.type === "collection" &&
        candidate.collectionId === production.collectionId
      );
    case "icon":
      return iconPolicyWiden(production, candidate);
    case "toggle":
      // A toggle keeps what it switches: the site reads it by its semantic.
      return candidate.type === "toggle" && candidate.semantic === production.semantic;
    case "internal_protected":
      return (
        candidate.type === "internal_protected" &&
        candidate.valueType === production.valueType &&
        candidate.semantic === production.semantic
      );
  }
}

function authorityPreserved(
  production: RenderedOrItemField,
  candidate: RenderedOrItemField,
): boolean {
  const classificationPreserved =
    production.classification !== "customer_editable" ||
    candidate.classification === "customer_editable";
  return (
    classificationPreserved &&
    includesAllValues(candidate.capabilities, production.capabilities)
  );
}

function renderedFieldCompatible(
  production: ManagedFieldDescriptor,
  candidate: ManagedFieldDescriptor,
): boolean {
  return (
    production.scope === candidate.scope &&
    usagesPreserved(production.usages, candidate.usages) &&
    authorityPreserved(production, candidate) &&
    valuePolicyWiden(production, candidate)
  );
}

function itemFieldCompatible(
  production: ManagedCollectionItemField,
  candidate: ManagedCollectionItemField,
): boolean {
  return (
    authorityPreserved(production, candidate) &&
    valuePolicyWiden(production, candidate)
  );
}

function protectedFieldCompatible(
  production: ManagedInternalProtectedField,
  candidate: ManagedInternalProtectedField,
): boolean {
  return (
    production.scope === candidate.scope &&
    production.valueType === candidate.valueType &&
    production.semantic === candidate.semantic &&
    usagesPreserved(production.usages, candidate.usages)
  );
}

export function isCompatibilityFieldWidened(
  production: ManagedCompatibilityFieldFact,
  candidate: ManagedCompatibilityFieldFact,
): boolean {
  if (production.kind !== candidate.kind) return false;
  if (production.kind === "rendered" && candidate.kind === "rendered") {
    return renderedFieldCompatible(production.descriptor, candidate.descriptor);
  }
  if (production.kind === "item" && candidate.kind === "item") {
    return itemFieldCompatible(production.descriptor, candidate.descriptor);
  }
  if (production.kind === "protected" && candidate.kind === "protected") {
    return protectedFieldCompatible(
      production.descriptor,
      candidate.descriptor,
    );
  }
  return false;
}

function uniquenessKey(
  rule: ManagedCollectionDescriptor["uniqueness"][number],
): string {
  return `${rule.comparison}:${[...rule.fieldIds].sort().join(",")}`;
}

/**
 * What a collection's new uniqueness rule is judged against, beyond the two
 * descriptors: whether a field id existed anywhere in production, and whether
 * a customer can create an item of the collection in the candidate.
 */
export interface ManagedCollectionRuleContext {
  readonly existedInProduction: (fieldId: string) => boolean;
  readonly customerCanCreateItems: boolean;
  readonly customerCouldCreateItems: boolean;
}

/**
 * A rule the candidate adds may narrow nothing a customer holds or can write:
 * every field it names is new in the candidate (no production value can break
 * it) and internal_protected (no customer write can break it later), and no
 * customer can create an item (a new item's value would be one the customer
 * cannot set, so a collision would be one they cannot resolve). The candidate's
 * own content is still held to the rule by content semantics. This is what
 * lets an existing collection gain a generated route's unique slug (0.33.0).
 */
function isAdmissibleNewRule(
  rule: ManagedCollectionDescriptor["uniqueness"][number],
  candidate: ManagedCollectionDescriptor,
  context: ManagedCollectionRuleContext,
): boolean {
  if (context.customerCanCreateItems) return false;
  return rule.fieldIds.every((fieldId) => {
    const field = candidate.itemFields.find((item) => item.id === fieldId);
    return (
      field?.type === "internal_protected" &&
      !context.existedInProduction(fieldId)
    );
  });
}

const NO_NEW_RULES: ManagedCollectionRuleContext = Object.freeze({
  existedInProduction: () => true,
  customerCanCreateItems: true,
  customerCouldCreateItems: true,
});

/**
 * A customer may not gain item creation on a collection whose uniqueness
 * names a protected field: an item a customer adds holds a protected value
 * they cannot set, so the rule could refuse it with no way to resolve it.
 */
function opensCreationUnderProtectedRule(
  candidate: ManagedCollectionDescriptor,
  context: ManagedCollectionRuleContext,
): boolean {
  if (!context.customerCanCreateItems || context.customerCouldCreateItems) {
    return false;
  }
  return candidate.uniqueness.some((rule) =>
    rule.fieldIds.some(
      (fieldId) =>
        candidate.itemFields.find((item) => item.id === fieldId)?.type ===
        "internal_protected",
    ),
  );
}

export function isCompatibilityCollectionWidened(
  production: ManagedCollectionDescriptor,
  candidate: ManagedCollectionDescriptor,
  context: ManagedCollectionRuleContext = NO_NEW_RULES,
): boolean {
  const productionRules = new Set(production.uniqueness.map(uniquenessKey));
  const rulesWidened = candidate.uniqueness.every(
    (rule) =>
      productionRules.has(uniquenessKey(rule)) ||
      isAdmissibleNewRule(rule, candidate, context),
  );
  return (
    production.itemIdPolicy === candidate.itemIdPolicy &&
    candidate.minItems <= production.minItems &&
    candidate.maxItems >= production.maxItems &&
    rulesWidened &&
    !opensCreationUnderProtectedRule(candidate, context) &&
    production.deletion.whenReferenced === candidate.deletion.whenReferenced &&
    (!production.deletion.restorable || candidate.deletion.restorable)
  );
}

function ratioIncluded(
  candidate: ManagedAssetSlotDescriptor["aspectRatios"],
  production: ManagedAssetSlotDescriptor["aspectRatios"][number],
): boolean {
  return candidate.some(
    (ratio) =>
      ratio.width / ratio.height === production.width / production.height,
  );
}

function policyValues(
  policy: "forbidden" | "optional" | "required",
): readonly string[] {
  if (policy === "forbidden") return ["null"];
  if (policy === "required") return ["value"];
  return ["null", "value"];
}

function sameAssetSemantics(
  production: ManagedAssetSlotDescriptor["semantics"],
  candidate: ManagedAssetSlotDescriptor["semantics"],
): boolean {
  if (production.kind !== candidate.kind) return false;
  if (production.kind !== "fixed_alt") return true;
  return (
    candidate.kind === "fixed_alt" && candidate.altText === production.altText
  );
}

export function isCompatibilityAssetWidened(
  production: ManagedAssetSlotDescriptor,
  candidate: ManagedAssetSlotDescriptor,
): boolean {
  return (
    sameAssetSemantics(production.semantics, candidate.semantics) &&
    includesAllValues(
      candidate.acceptedMimeTypes,
      production.acceptedMimeTypes,
    ) &&
    includesAllValues(candidate.outputMimeTypes, production.outputMimeTypes) &&
    candidate.minWidth <= production.minWidth &&
    candidate.maxWidth >= production.maxWidth &&
    candidate.minHeight <= production.minHeight &&
    candidate.maxHeight >= production.maxHeight &&
    production.aspectRatios.every((ratio) =>
      ratioIncluded(candidate.aspectRatios, ratio),
    ) &&
    includesAllValues(
      policyValues(candidate.cropPolicy),
      policyValues(production.cropPolicy),
    ) &&
    includesAllValues(
      policyValues(candidate.focalPointPolicy),
      policyValues(production.focalPointPolicy),
    ) &&
    candidate.maxBytes >= production.maxBytes
  );
}

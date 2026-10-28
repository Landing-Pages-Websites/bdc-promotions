import type {
  ManagedPageDescriptor,
  ManagedSiteContractV1,
} from "./contract.js";
import { validateSearchVisibilityToggles } from "./contract-semantics-search-visibility.js";
import { ManagedSiteContractError } from "./errors.js";
import {
  isManagedOptionalItemField,
  MANAGED_RUNNING_TEXT_SEMANTICS,
  MAX_MANAGED_SEO_TEXT_CHARACTERS,
  type ManagedCollectionDescriptor,
  type ManagedCollectionItemField,
  type ManagedFieldDescriptor,
} from "./fields.js";
import type { ManagedInternalValueType } from "./internal-value-types.js";
import type { ManagedGeneratedPageSeoDescriptor } from "./seo.js";
import {
  GENERATED_PATTERN_SLOTS,
  indexRenderedFields,
  MANAGED_METADATA_SLOT_POLICY,
  metadataFieldReferences,
  ownedByPage,
  validateStaticPageMetadata,
  type RenderedFieldEntry,
} from "./contract-semantics-seo-metadata.js";
import { MANAGED_RICH_TEXT_HEADING_LEVELS } from "./rich-text.js";
import { isManagedGeneratedRouteSegment } from "./values.js";

type GeneratedRoute = Extract<ManagedPageDescriptor["route"], { kind: "generated" }>;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function indexByPageId<T extends { readonly pageId: string }>(
  descriptors: readonly T[],
): ReadonlyMap<string, T> {
  const indexed = new Map<string, T>();
  for (const descriptor of descriptors) {
    if (indexed.has(descriptor.pageId)) {
      fail(
        "CONTRACT_SEO_PAGE_DUPLICATE",
        `SEO page descriptor repeats ${descriptor.pageId}`,
      );
    }
    indexed.set(descriptor.pageId, descriptor);
  }
  return indexed;
}

function collectionById(
  contract: ManagedSiteContractV1,
  collectionId: string,
): ManagedCollectionDescriptor {
  const collection = contract.collections.find(
    (candidate) => candidate.id === collectionId,
  );
  if (collection === undefined) {
    fail(
      "CONTRACT_SEO_GENERATED_COLLECTION",
      `Generated SEO collection is unresolved: ${collectionId}`,
    );
  }
  return collection;
}

function fieldById(
  collection: ManagedCollectionDescriptor,
  fieldId: string,
): ManagedCollectionItemField {
  const field = collection.itemFields.find((candidate) => candidate.id === fieldId);
  if (field === undefined) {
    fail(
      "CONTRACT_SEO_FIELD_POLICY",
      `Generated SEO field is outside collection ${collection.id}: ${fieldId}`,
    );
  }
  return field;
}

function requireProtectedField(
  collection: ManagedCollectionDescriptor,
  fieldId: string,
  valueType: ManagedInternalValueType,
  semantic: string,
): void {
  const field = fieldById(collection, fieldId);
  if (
    field.type !== "internal_protected" ||
    field.valueType !== valueType ||
    field.semantic !== semantic
  ) {
    fail(
      "CONTRACT_SEO_FIELD_POLICY",
      `Generated SEO field has unsafe authority or type: ${fieldId}`,
    );
  }
}

type GeneratedSlot = (typeof GENERATED_PATTERN_SLOTS)[number];
type GeneratedPattern = NonNullable<ManagedGeneratedPageSeoDescriptor["metadata"]["titlePattern"]>;

function isProtectedFor(
  field: ManagedCollectionItemField,
  slot: keyof typeof MANAGED_METADATA_SLOT_POLICY,
): boolean {
  const policy = MANAGED_METADATA_SLOT_POLICY[slot];
  return (
    field.type === "internal_protected" &&
    field.valueType === policy.valueType &&
    field.semantic === policy.semantic
  );
}

/** An item's own search text: one safe line a customer edits per page. */
function isEditableItemSeoText(field: ManagedCollectionItemField, slot: GeneratedSlot): boolean {
  return (
    field.type === "plain_text" &&
    field.classification === "customer_editable" &&
    field.semantic === MANAGED_METADATA_SLOT_POLICY[slot].editableSemantic &&
    field.constraints.newlines === "forbid" &&
    field.constraints.maxLength <= MAX_MANAGED_SEO_TEXT_CHARACTERS &&
    field.constraints.template === undefined &&
    field.constraints.pattern === undefined &&
    field.constraints.attribute === undefined
  );
}

/**
 * Item text a pattern may read, a search pattern or page text (0.38.0): one
 * non-empty line of the customer's words, never tokens of its own.
 */
export function isManagedPatternSourceField(field: ManagedCollectionItemField): boolean {
  if (field.classification !== "customer_editable") return false;
  if (field.type === "heading_text") {
    return (
      field.constraints.newlines === "forbid" &&
      field.constraints.minLength >= 1 &&
      field.constraints.pattern === undefined
    );
  }
  return (
    field.type === "plain_text" &&
    MANAGED_RUNNING_TEXT_SEMANTICS.has(field.semantic) &&
    field.constraints.newlines === "forbid" &&
    field.constraints.minLength >= 1 &&
    field.constraints.template === undefined &&
    field.constraints.pattern === undefined &&
    field.constraints.attribute === undefined
  );
}

function sameNames(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && new Set(left).size === left.length &&
    left.every((name) => right.includes(name));
}

/**
 * A pattern is this generated page's own search-pattern field of the slot's
 * semantic, and its sources fill exactly its placeholders, each from item text
 * of the route collection.
 */
function validatePattern(
  context: GeneratedSeoContext,
  slot: GeneratedSlot,
  pattern: GeneratedPattern,
): void {
  const entry = context.renderedFields.get(pattern.fieldId);
  const field = entry?.field;
  const ownField =
    entry !== undefined &&
    field?.type === "plain_text" &&
    field.semantic === MANAGED_METADATA_SLOT_POLICY[slot].editableSemantic &&
    field.constraints.pattern !== undefined &&
    ownedByPage(entry, context.descriptor.pageId);
  if (!ownField) {
    fail("CONTRACT_SEO_FIELD_POLICY", `Generated ${slot} pattern is not the page's own search pattern: ${pattern.fieldId}`);
  }
  const declared = field.constraints.pattern?.placeholders.map((placeholder) => placeholder.name) ?? [];
  if (!sameNames(pattern.sources.map((source) => source.placeholder), declared)) {
    fail("CONTRACT_SEO_FIELD_POLICY", `Generated ${slot} pattern sources do not fill exactly its placeholders: ${pattern.fieldId}`);
  }
  for (const source of pattern.sources) {
    if (!isManagedPatternSourceField(fieldById(context.collection, source.fieldId))) {
      fail("CONTRACT_SEO_FIELD_POLICY", `Generated ${slot} pattern source is not one line of item text: ${source.fieldId}`);
    }
  }
}

/**
 * A title or description slot names a protected item field, as every generated
 * page did before 0.26.0, or the item's own editable search text. With a
 * pattern beside it, that text is an optional override (`minLength` 0) and the
 * pattern is served when it is empty; without one it is the text itself and
 * must hold some. A protected slot takes no pattern. A social echo is null, a
 * protected field, or the slot's own field.
 */
function validateGeneratedSlot(context: GeneratedSeoContext, slot: GeneratedSlot): void {
  const { metadata } = context.descriptor;
  const fieldId = metadata[slot];
  const pattern = metadata[`${slot}Pattern`];
  const field = fieldById(context.collection, fieldId);
  const echo = metadata.social[slot];
  if (echo !== null && echo !== fieldId && !isProtectedFor(fieldById(context.collection, echo), slot)) {
    fail("CONTRACT_SEO_FIELD_POLICY", `Generated social ${slot} has unsafe authority or type: ${echo}`);
  }
  if (isProtectedFor(field, slot)) {
    if (pattern !== undefined) {
      fail("CONTRACT_SEO_FIELD_POLICY", `Generated ${slot} pattern needs an editable override, not protected ${fieldId}`);
    }
    return;
  }
  if (!isEditableItemSeoText(field, slot)) {
    fail("CONTRACT_SEO_FIELD_POLICY", `Generated SEO field has unsafe authority or type: ${fieldId}`);
  }
  const minLength = field.type === "plain_text" ? field.constraints.minLength : 0;
  if (pattern === undefined ? minLength < 1 : minLength !== 0) {
    fail(
      "CONTRACT_SEO_FIELD_POLICY",
      pattern === undefined
        ? `Generated ${slot} without a pattern must hold text: ${fieldId}`
        : `Generated ${slot} override must be optional: ${fieldId}`,
    );
  }
  if (pattern !== undefined) validatePattern(context, slot, pattern);
}

interface GeneratedSeoContext {
  readonly collection: ManagedCollectionDescriptor;
  readonly descriptor: ManagedGeneratedPageSeoDescriptor;
  readonly renderedFields: ReadonlyMap<string, RenderedFieldEntry>;
}

function validateMetadata(context: GeneratedSeoContext): void {
  const { collection, descriptor } = context;
  const { metadata } = descriptor;
  for (const slot of GENERATED_PATTERN_SLOTS) validateGeneratedSlot(context, slot);
  // Canonical and indexing stay protected: a URL is derived from the route, and
  // whether a page is indexed is the site's decision.
  for (const reference of metadataFieldReferences(metadata)) {
    if (reference.slot !== "canonical" && reference.slot !== "indexing") continue;
    const policy = MANAGED_METADATA_SLOT_POLICY[reference.slot];
    requireProtectedField(collection, reference.fieldId, policy.valueType, policy.semantic);
  }
  if (metadata.social.imageFieldId !== null) {
    requireImageField(collection, metadata.social.imageFieldId);
  }
}

function requireImageField(
  collection: ManagedCollectionDescriptor,
  fieldId: string,
): void {
  const field = fieldById(collection, fieldId);
  // A share card needs a picture on every item: an optional image may be none.
  if (field.type !== "image" || isManagedOptionalItemField(field)) {
    fail(
      "CONTRACT_SEO_FIELD_POLICY",
      `Generated SEO image does not resolve to a required image field: ${fieldId}`,
    );
  }
}

function isSiteScopedField(
  contract: ManagedSiteContractV1,
  fieldId: string,
): boolean {
  const protectedField = contract.internalSeo.protectedFields.find(
    (field) => field.id === fieldId,
  );
  if (protectedField !== undefined) return protectedField.scope === "site";
  return contract.pages.some((page) =>
    page.sections.some((section) =>
      section.fields.some(
        (field) => field.id === fieldId && field.scope === "site",
      ),
    ),
  );
}

function validateSiteJsonLdSources(
  contract: ManagedSiteContractV1,
  descriptor: ManagedGeneratedPageSeoDescriptor,
): void {
  for (const declaration of descriptor.jsonLd) {
    for (const fieldId of declaration.siteSourceFieldIds) {
      if (!isSiteScopedField(contract, fieldId)) {
        fail(
          "CONTRACT_SEO_FIELD_POLICY",
          `Generated JSON-LD site source is not site-scoped: ${fieldId}`,
        );
      }
    }
  }
}

function validateHeadingOutline(
  collection: ManagedCollectionDescriptor,
  descriptor: ManagedGeneratedPageSeoDescriptor,
): void {
  const h1Count = descriptor.headingOutline.filter(
    (heading) => heading.semanticLevel === 1,
  ).length;
  if (h1Count !== 1) {
    fail(
      "CONTRACT_SEO_FIELD_POLICY",
      `Generated page must declare exactly one H1: ${descriptor.pageId}`,
    );
  }
  for (const heading of descriptor.headingOutline) {
    const field = fieldById(collection, heading.fieldId);
    if (field.type !== "heading_text" || field.semanticLevel !== heading.semanticLevel) {
      fail(
        "CONTRACT_SEO_FIELD_POLICY",
        `Generated heading outline conflicts with field ${heading.fieldId}`,
      );
    }
  }
}

function validateRouteKey(
  collection: ManagedCollectionDescriptor,
  route: GeneratedRoute,
): void {
  const field = fieldById(collection, route.routeKeyFieldId);
  const protectedSlug =
    field.type === "internal_protected" &&
    field.valueType === "string" &&
    field.semantic === "route.slug";
  const uniquelyIndexed = collection.uniqueness.some(
    (rule) =>
      rule.comparison === "exact" &&
      rule.fieldIds.length === 1 &&
      rule.fieldIds[0] === route.routeKeyFieldId,
  );
  if (!protectedSlug || !uniquelyIndexed) {
    fail(
      "CONTRACT_SEO_FIELD_POLICY",
      `Generated route key is not a protected unique slug: ${route.routeKeyFieldId}`,
    );
  }
}

function validateRoutePattern(route: GeneratedRoute): void {
  const parameterCount = route.pattern
    .slice(1)
    .split("/")
    .filter(isManagedGeneratedRouteSegment).length;
  if (parameterCount !== 1) {
    fail(
      "CONTRACT_SEO_ROUTE_PATTERN",
      `Generated route must contain exactly one parameter: ${route.pattern}`,
    );
  }
}

function validateGeneratedDescriptor(
  contract: ManagedSiteContractV1,
  page: ManagedPageDescriptor,
  descriptor: ManagedGeneratedPageSeoDescriptor,
): void {
  if (page.route.kind !== "generated") {
    fail("CONTRACT_SEO_PAGE_ROUTE", `Generated SEO targets a static page: ${page.id}`);
  }
  if (descriptor.collectionId !== page.route.collectionId) {
    fail(
      "CONTRACT_SEO_GENERATED_COLLECTION",
      `Generated SEO collection conflicts with route ${page.id}`,
    );
  }
  const collection = collectionById(contract, descriptor.collectionId);
  validateRoutePattern(page.route);
  validateRouteKey(collection, page.route);
  validateMetadata({ collection, descriptor, renderedFields: indexRenderedFields(contract) });
  validateHeadingOutline(collection, descriptor);
  validateSiteJsonLdSources(contract, descriptor);
  if (descriptor.primaryImageFieldId !== null) {
    requireImageField(collection, descriptor.primaryImageFieldId);
  }
}

function validateDescriptorRoutes(contract: ManagedSiteContractV1): void {
  const pages = new Map(contract.pages.map((page) => [page.id, page]));
  for (const descriptor of contract.internalSeo.pages) {
    const page = pages.get(descriptor.pageId);
    if (page?.route.kind !== "static") {
      fail("CONTRACT_SEO_PAGE_ROUTE", `Static SEO targets a generated page: ${descriptor.pageId}`);
    }
  }
  for (const descriptor of contract.internalSeo.generatedPages) {
    const page = pages.get(descriptor.pageId);
    if (page === undefined) continue;
    validateGeneratedDescriptor(contract, page, descriptor);
  }
}

function validateCoverage(contract: ManagedSiteContractV1): void {
  const staticSeo = indexByPageId(contract.internalSeo.pages);
  const generatedSeo = indexByPageId(contract.internalSeo.generatedPages);
  for (const page of contract.pages) {
    const covered =
      page.route.kind === "static"
        ? staticSeo.has(page.id) && !generatedSeo.has(page.id)
        : generatedSeo.has(page.id) && !staticSeo.has(page.id);
    if (!covered) {
      fail("CONTRACT_SEO_PAGE_COVERAGE", `Page has no exact SEO coverage: ${page.id}`);
    }
  }
}

function renderedFieldsById(contract: ManagedSiteContractV1): ReadonlyMap<string, ManagedFieldDescriptor> {
  return new Map(contract.pages.flatMap((page) =>
    page.sections.flatMap((section) => section.fields.map((field) => [field.id, field] as const))));
}

/**
 * A field whose rendered output can carry a heading at `level`, on this page:
 * a heading field at exactly that level, or a rich-text field that admits a
 * heading block, whose levels the grammar bounds. A rich-text field that
 * admits only paragraphs renders no heading the contract can see, even when
 * code wraps it in one, so it is refused at any level.
 */
function namesHeading(field: ManagedFieldDescriptor | undefined, level: number, pageId: string): boolean {
  if (field === undefined || !field.usages.some((usage) => usage.pageId === pageId)) return false;
  if (field.type === "heading_text") return field.semanticLevel === level;
  if (field.type !== "rich_text") return false;
  return field.constraints.allowedBlocks.includes("heading") &&
    (MANAGED_RICH_TEXT_HEADING_LEVELS as readonly number[]).includes(level);
}

/**
 * A static page's outline, as a generated page's is: at most one H1 (a static
 * page may declare none, since a converted page states only the headings its
 * source marks), and every entry a heading.
 */
function validateStaticHeadingOutlines(contract: ManagedSiteContractV1): void {
  const fields = renderedFieldsById(contract);
  for (const descriptor of contract.internalSeo.pages) {
    const h1Count = descriptor.headingOutline.filter((heading) => heading.semanticLevel === 1).length;
    if (h1Count > 1) {
      fail("CONTRACT_SEO_FIELD_POLICY", `Static page declares more than one H1: ${descriptor.pageId}`);
    }
    for (const heading of descriptor.headingOutline) {
      if (!namesHeading(fields.get(heading.fieldId), heading.semanticLevel, descriptor.pageId)) {
        fail("CONTRACT_SEO_FIELD_POLICY", `Static heading outline names a field that is not a heading: ${heading.fieldId}`);
      }
    }
  }
}

export function validateManagedSiteSeoSemantics(
  contract: ManagedSiteContractV1,
): void {
  validateDescriptorRoutes(contract);
  validateStaticPageMetadata(contract);
  validateSearchVisibilityToggles(contract);
  validateStaticHeadingOutlines(contract);
  validateCoverage(contract);
}

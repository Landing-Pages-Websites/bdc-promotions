import type { ManagedSiteContractV1 } from "./contract.js";
import { collectManagedSiteContractOccurrences } from "./contract-occurrence-registry.js";
import { indexRenderedFields, ownedByPage } from "./contract-semantics-seo-metadata.js";
import { ManagedSiteContractError } from "./errors.js";

/** The one semantic a search-visibility toggle carries. */
const SEO_HIDDEN = "seo_hidden";

/** Where a search entry names its toggle, as occurrence locations spell it. */
const HIDDEN_SLOT = /^internalSeo\.(pages|generatedPages)\[(\d+)\]\.metadata\.hiddenFieldId$/u;

function fail(message: string): never {
  throw new ManagedSiteContractError("CONTRACT_SEO_FIELD_POLICY", message);
}

/**
 * A static page's toggle is its own: a customer-editable `toggle` field with
 * semantic `seo_hidden`, page-scoped, declared on the page and used once on
 * it, so hiding one page never hides another.
 */
function validateStaticToggles(contract: ManagedSiteContractV1): void {
  const rendered = indexRenderedFields(contract);
  for (const descriptor of contract.internalSeo.pages) {
    const { hiddenFieldId } = descriptor.metadata;
    if (hiddenFieldId === undefined) continue;
    const entry = rendered.get(hiddenFieldId);
    const valid =
      entry !== undefined &&
      entry.field.type === "toggle" &&
      entry.field.semantic === SEO_HIDDEN &&
      ownedByPage(entry, descriptor.pageId);
    if (!valid) fail(`Page ${descriptor.pageId} hides from search through a field that is not its own toggle: ${hiddenFieldId}`);
  }
}

/**
 * A generated page's toggle is each item's own: a customer-editable item
 * field of the collection the page's route iterates, type `toggle`, semantic
 * `seo_hidden`.
 */
function validateGeneratedToggles(contract: ManagedSiteContractV1): void {
  for (const descriptor of contract.internalSeo.generatedPages) {
    const { hiddenFieldId } = descriptor.metadata;
    if (hiddenFieldId === undefined) continue;
    const field = contract.collections
      .find((collection) => collection.id === descriptor.collectionId)
      ?.itemFields.find((candidate) => candidate.id === hiddenFieldId);
    const valid =
      field !== undefined &&
      field.type === "toggle" &&
      field.semantic === SEO_HIDDEN &&
      field.classification === "customer_editable";
    if (!valid) fail(`Generated page ${descriptor.pageId} hides from search through a field that is not its items' toggle: ${hiddenFieldId}`);
  }
}

/** Every toggle declared with semantic `seo_hidden`, page and item fields alike. */
function hiddenToggleIds(contract: ManagedSiteContractV1): readonly string[] {
  return [
    ...contract.pages.flatMap((page) => page.sections.flatMap((section) => section.fields)),
    ...contract.collections.flatMap((collection) => collection.itemFields),
  ]
    .filter((field) => field.type === "toggle" && field.semantic === SEO_HIDDEN)
    .map((field) => field.id);
}

/**
 * A search-visibility toggle is named from exactly one place, one search
 * entry's `hiddenFieldId`, and by nothing else: a toggle no entry names would
 * switch nothing the customer could see, and a second reference (another
 * page, an outline, JSON-LD, an alias group, a path added later) would read a
 * boolean as something else. Read off every classified reference.
 */
function validateTogglePlacement(contract: ManagedSiteContractV1): void {
  const references = new Map<string, string[]>();
  for (const occurrence of collectManagedSiteContractOccurrences(contract)) {
    if (occurrence.role !== "reference" || occurrence.idKind !== "field") continue;
    references.set(occurrence.id, [...(references.get(occurrence.id) ?? []), occurrence.location]);
  }
  for (const id of hiddenToggleIds(contract)) {
    const places = references.get(id) ?? [];
    if (places.length !== 1 || !HIDDEN_SLOT.test(places[0] ?? "")) {
      fail(`Search-visibility toggle ${id} must be named by exactly one page's hiddenFieldId and nothing else`);
    }
  }
}

/**
 * Each page's "Hide this page from search engines" toggle (0.34.0) is its
 * own, typed and named exactly once.
 */
export function validateSearchVisibilityToggles(contract: ManagedSiteContractV1): void {
  validateStaticToggles(contract);
  validateGeneratedToggles(contract);
  validateTogglePlacement(contract);
}

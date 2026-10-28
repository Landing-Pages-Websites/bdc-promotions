import type { ManagedSiteContentDocument, ManagedSiteContentValue } from "./content.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { managedPageRenderedCollections } from "./contract-semantics-collection-views.js";
import type { ManagedCollectionItemField, ManagedFieldDescriptor } from "./fields.js";

type AnyField = ManagedFieldDescriptor | ManagedCollectionItemField;

/**
 * Where a page's H1 comes from, read from every field the page renders: its
 * own sections' fields, site-wide fields it uses, and the item fields of
 * every collection it renders (`managedPageRenderedCollections`: a list on the
 * page, a read-only view, a generated page's own collection, and the lists
 * inside their items). Shared by the compatibility policy and content
 * semantics, and exported so a CMS can apply the same reading.
 */
export interface ManagedRenderedH1Sources {
  /** Level 1 heading fields the page renders. */
  readonly headingFields: readonly string[];
  /** Rich-text fields whose content, as rendered on the page, holds a level 1 heading block. */
  readonly richTextFields: readonly string[];
  /** Rich-text fields with a value, as rendered on the page, holding more than one level 1 block. */
  readonly repeatedRichTextFields: readonly string[];
  /** Fields the page's outline names at level 1. */
  readonly outlined: readonly string[];
}

function outlineOf(contract: ManagedSiteContractV1, pageId: string): readonly { readonly fieldId: string; readonly semanticLevel: number }[] {
  const { pages, generatedPages } = contract.internalSeo;
  return [...pages, ...generatedPages].find((entry) => entry.pageId === pageId)?.headingOutline ?? [];
}

/** Every field a page renders, with the collections whose items it renders. */
function renderedFields(contract: ManagedSiteContractV1, pageId: string): { readonly fields: readonly AnyField[]; readonly collections: ReadonlySet<string> } {
  const sectionFields = contract.pages
    .flatMap((page) => page.sections.flatMap((section) => section.fields))
    .filter((field) => field.usages.some((usage) => usage.pageId === pageId));
  const collections = managedPageRenderedCollections(contract, pageId);
  const itemFields = contract.collections
    .filter((collection) => collections.has(collection.id))
    .flatMap((collection) => collection.itemFields);
  return { fields: [...sectionFields, ...itemFields], collections };
}

/** Whether a value renders on the page: its own, site-wide, or an item of a collection the page renders. */
function rendersHere(value: ManagedSiteContentValue, pageId: string, collections: ReadonlySet<string>): boolean {
  if (value.owner.kind === "page") return value.owner.pageId === pageId;
  if (value.owner.kind === "site") return true;
  return collections.has(value.owner.collectionId);
}

/**
 * How many level 1 heading blocks a rich-text value holds. Headings are
 * top-level blocks only (a list item or quotation holds paragraphs), so the
 * top level is every place one can be.
 */
export function managedRichTextLevelOneHeadingCount(value: ManagedSiteContentValue): number {
  if (value.type !== "rich_text") return 0;
  return value.value.content.filter((block) => block.type === "heading" && block.attrs.level === 1).length;
}

/** Whether a rich-text value holds a level 1 heading block. */
export function managedRichTextHoldsLevelOneHeading(value: ManagedSiteContentValue): boolean {
  return managedRichTextLevelOneHeadingCount(value) > 0;
}

/**
 * Each route H1 field (0.35.0): a level 1 heading item field of a generated
 * page's route collection that the page's own outline names at level 1, with
 * every generated page it is the H1 of. Such a field renders as an H1 on its
 * item's own page; a page that lists the collection shows its items as cards
 * and does not render that field as its H1, so it is no H1 source there.
 * Anything a page could only render as an H1 itself (its own outline naming
 * the field) stays observable: a static outline may name only fields the page
 * renders in its own sections, so it cannot name an item field at all.
 */
function routeH1Pages(contract: ManagedSiteContractV1): ReadonlyMap<string, ReadonlySet<string>> {
  // Every owning page, not the last: two generated routes over one collection
  // may each name the field as their H1, and each keeps it.
  const owners = new Map<string, Set<string>>();
  for (const descriptor of contract.internalSeo.generatedPages) {
    const route = contract.pages.find((page) => page.id === descriptor.pageId)?.route;
    if (route?.kind !== "generated") continue;
    const collection = contract.collections.find((entry) => entry.id === route.collectionId);
    for (const heading of descriptor.headingOutline) {
      if (heading.semanticLevel !== 1) continue;
      const field = collection?.itemFields.find((entry) => entry.id === heading.fieldId);
      if (field?.type === "heading_text" && field.semanticLevel === 1) {
        owners.set(field.id, (owners.get(field.id) ?? new Set()).add(descriptor.pageId));
      }
    }
  }
  return owners;
}

/** Every source of a page's H1, static or generated. */
export function managedRenderedH1Sources(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  pageId: string,
): ManagedRenderedH1Sources {
  const { fields, collections } = renderedFields(contract, pageId);
  const ids = new Set(fields.map((field) => field.id));
  const rendered = content.values.filter((value) => ids.has(value.fieldId) && rendersHere(value, pageId, collections));
  const withH1 = rendered.filter(managedRichTextHoldsLevelOneHeading).map((value) => value.fieldId);
  const repeated = rendered.filter((value) => managedRichTextLevelOneHeadingCount(value) > 1).map((value) => value.fieldId);
  const routeH1s = routeH1Pages(contract);
  return {
    headingFields: fields
      .filter((field) => field.type === "heading_text" && field.semanticLevel === 1)
      .filter((field) => routeH1s.get(field.id)?.has(pageId) ?? true)
      .map((field) => field.id),
    richTextFields: [...new Set(withH1)],
    repeatedRichTextFields: [...new Set(repeated)],
    outlined: outlineOf(contract, pageId).filter((heading) => heading.semanticLevel === 1).map((heading) => heading.fieldId),
  };
}

/** The set of fields that render a page's H1: every source, once. */
export function managedPageH1Fields(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  pageId: string,
): ReadonlySet<string> {
  const sources = managedRenderedH1Sources(contract, content, pageId);
  return new Set([...sources.headingFields, ...sources.richTextFields, ...sources.outlined]);
}

/** Every page with an SEO entry, static and generated. */
export function managedSeoPageIds(contract: ManagedSiteContractV1): readonly string[] {
  return [...contract.internalSeo.pages, ...contract.internalSeo.generatedPages].map((entry) => entry.pageId);
}

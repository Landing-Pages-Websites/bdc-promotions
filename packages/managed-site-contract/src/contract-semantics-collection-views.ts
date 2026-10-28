import type { ManagedSiteContractV1 } from "./contract.js";
import { managedNestedCollectionParents } from "./contract-semantics-nested.js";
import { ManagedSiteContractError } from "./errors.js";

function fail(message: string): never {
  throw new ManagedSiteContractError("CONTRACT_COLLECTION_VIEW", message);
}

/** The collections a page's sections view (0.39.0), each once per view. */
export function managedPageCollectionViews(contract: ManagedSiteContractV1, pageId: string): readonly string[] {
  const page = contract.pages.find((candidate) => candidate.id === pageId);
  return (page?.sections ?? []).flatMap((section) => (section.views ?? []).map((view) => view.collectionId));
}

/** The collections a page's own fields list. */
function pageListedCollections(contract: ManagedSiteContractV1, pageId: string): ReadonlySet<string> {
  return new Set(
    contract.pages
      .flatMap((page) => page.sections.flatMap((section) => section.fields))
      .filter((field) => field.usages.some((usage) => usage.pageId === pageId))
      .flatMap((field) => (field.type === "collection" ? [field.collectionId] : [])),
  );
}

/**
 * The collections whose items render on a page: each collection a field it
 * uses lists, each collection its sections view (0.39.0), a generated page's
 * own collection, and the list inside each of their items (one level, which is
 * all the contract admits). The one statement of "what renders here": H1
 * sources read it page by page and {@link managedCollectionPageIds} collection
 * by collection, so the two directions cannot disagree.
 */
export function managedPageRenderedCollections(contract: ManagedSiteContractV1, pageId: string): ReadonlySet<string> {
  const route = contract.pages.find((page) => page.id === pageId)?.route;
  const direct = new Set<string>([
    ...pageListedCollections(contract, pageId),
    ...managedPageCollectionViews(contract, pageId),
    ...(route?.kind === "generated" ? [route.collectionId] : []),
  ]);
  const nested = contract.collections
    .filter((collection) => direct.has(collection.id))
    .flatMap((collection) => collection.itemFields.flatMap((field) => (field.type === "collection" ? [field.collectionId] : [])));
  return new Set([...direct, ...nested]);
}

/**
 * Every page a collection's items render on: lists, views, its generated
 * page, and a nested list's parent pages. What a coverage gate or an editor
 * reads as "this item's fields are declared on this page".
 */
export function managedCollectionPageIds(contract: ManagedSiteContractV1, collectionId: string): readonly string[] {
  return contract.pages
    .filter((page) => managedPageRenderedCollections(contract, page.id).has(collectionId))
    .map((page) => page.id)
    .sort();
}

/**
 * A view shows items a list already orders, without a list's structure.
 * Invariant: every item a view can show is an active item of a page-ordered
 * collection, edited on the view's page only through its own fields. So the
 * viewed collection is listed by a page field (it has a page order, so its
 * items are active), is not a list inside an item (whose items belong to one
 * parent), and a page views it at most once and does not also list it (the
 * list already places its items there, with structure).
 */
export function validateManagedCollectionViews(contract: ManagedSiteContractV1): void {
  const nested = new Set<string>(managedNestedCollectionParents(contract).keys());
  const pageListed = new Set<string>(
    contract.pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.fields.flatMap((field) => (field.type === "collection" ? [field.collectionId] : [])),
      ),
    ),
  );
  for (const page of contract.pages) {
    const viewed = managedPageCollectionViews(contract, page.id);
    const listedHere = pageListedCollections(contract, page.id);
    for (const [index, collectionId] of viewed.entries()) {
      if (nested.has(collectionId)) fail(`Page ${page.id} views a list inside an item: ${collectionId}`);
      if (!pageListed.has(collectionId)) fail(`Page ${page.id} views a collection no page lists: ${collectionId}`);
      if (listedHere.has(collectionId)) fail(`Page ${page.id} both lists and views ${collectionId}`);
      if (viewed.indexOf(collectionId) !== index) fail(`Page ${page.id} views ${collectionId} more than once`);
    }
  }
}

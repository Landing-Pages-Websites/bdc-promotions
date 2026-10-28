import type { ManagedSiteContentDocument } from "./content.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import {
  managedServedIndexingV1,
  managedServedItemIndexingV1,
  type ManagedSearchRobotsV1,
} from "./search-visibility.js";

interface Side {
  readonly contract: ManagedSiteContractV1;
  readonly content: ManagedSiteContentDocument;
}

function fail(message: string): never {
  throw new ManagedSiteContractError("COMPATIBILITY_SEARCH_VISIBILITY_CHANGED", message);
}

function same(left: ManagedSearchRobotsV1 | null, right: ManagedSearchRobotsV1 | null): boolean {
  return left !== null && right !== null && left.index === right.index && left.follow === right.follow;
}

/**
 * A toggle the candidate adopts must serve exactly what production serves,
 * so adopting one hands the switch to the customer without hiding or showing
 * anything. A page whose directives a toggle cannot state (indexed but
 * nofollow, or noindex but followed) cannot adopt one.
 */
function assertStaticAdoptions(production: Side, candidate: Side): void {
  const adopted = new Set(
    production.contract.internalSeo.pages.filter((entry) => entry.metadata.hiddenFieldId === undefined).map((entry) => entry.pageId),
  );
  for (const entry of candidate.contract.internalSeo.pages) {
    if (entry.metadata.hiddenFieldId === undefined || !adopted.has(entry.pageId)) continue;
    const before = managedServedIndexingV1(production.contract, production.content, entry.pageId);
    const after = managedServedIndexingV1(candidate.contract, candidate.content, entry.pageId);
    if (!same(before, after)) {
      fail(`Page ${entry.pageId} adopts a search-visibility toggle that changes what it serves to search engines`);
    }
  }
}

/** The items a production route collection serves, read off production's values. */
function itemsOf(content: ManagedSiteContentDocument, collectionId: string): ReadonlySet<string> {
  return new Set(
    content.values.flatMap((value) =>
      value.owner.kind === "collection_item" && value.owner.collectionId === collectionId ? [value.owner.itemId] : []),
  );
}

function assertGeneratedAdoptions(production: Side, candidate: Side): void {
  const adopted = new Map(
    production.contract.internalSeo.generatedPages
      .filter((entry) => entry.metadata.hiddenFieldId === undefined)
      .map((entry) => [entry.pageId, entry.collectionId] as const),
  );
  for (const entry of candidate.contract.internalSeo.generatedPages) {
    const collectionId = adopted.get(entry.pageId);
    if (entry.metadata.hiddenFieldId === undefined || collectionId === undefined) continue;
    for (const itemId of itemsOf(production.content, collectionId)) {
      const before = managedServedItemIndexingV1(production.contract, production.content, entry.pageId, itemId);
      const after = managedServedItemIndexingV1(candidate.contract, candidate.content, entry.pageId, itemId);
      if (!same(before, after)) {
        fail(`Item ${itemId} of ${entry.pageId} adopts a search-visibility toggle that changes what it serves`);
      }
    }
  }
}

/**
 * Adopting a "Hide this page from search engines" toggle (0.34.0) changes no
 * page or item's robots: each one serves the same `index` and `follow` before
 * and after, read through the one served-indexing reader. Once production
 * has a toggle, its value is content, held by the ordinary content rule.
 */
export function assertSearchVisibilityAdoptionsServeTheSame(production: Side, candidate: Side): void {
  assertStaticAdoptions(production, candidate);
  assertGeneratedAdoptions(production, candidate);
}

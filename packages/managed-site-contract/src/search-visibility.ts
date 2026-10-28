import type { ManagedSiteContentDocument } from "./content.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";

/**
 * What a page serves to search engines when its "Hide this page from search
 * engines" toggle (0.34.0) decides: hidden is `noindex, nofollow` (what a site
 * hides an unfinished or retired page with), shown is `index, follow`. Every
 * other directive (snippet and preview limits) stays whatever the site's code
 * states.
 */
export interface ManagedSearchRobotsV1 {
  readonly index: boolean;
  readonly follow: boolean;
}

function fail(message: string): never {
  throw new ManagedSiteContractError("SEARCH_VISIBILITY_UNRESOLVED", message);
}

function toggleValue(content: ManagedSiteContentDocument, fieldId: string, owner: (value: ManagedSiteContentDocument["values"][number]) => boolean, what: string): boolean {
  const value = content.values.find((candidate) => candidate.fieldId === fieldId && owner(candidate));
  if (value === undefined || value.type !== "toggle") return fail(`${what} has no toggle value`);
  return value.value;
}

/**
 * Whether a page (or, for a generated page, one of its items) is hidden from
 * search engines, read from the toggle its search entry names; `null` when it
 * names none, so the page's robots stay the code's. A page or item the
 * contract does not declare is the caller's mistake and throws
 * `SEARCH_VISIBILITY_UNRESOLVED` rather than guessing.
 */
export function managedSearchHiddenV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  pageId: string,
  itemId?: string,
): boolean | null {
  if (itemId === undefined) {
    const entry = contract.internalSeo.pages.find((page) => page.pageId === pageId);
    if (entry === undefined) return fail(`Page ${pageId} has no static search entry`);
    const { hiddenFieldId } = entry.metadata;
    if (hiddenFieldId === undefined) return null;
    return toggleValue(content, hiddenFieldId, (value) => value.owner.kind === "page" && value.owner.pageId === pageId, `Page ${pageId}`);
  }
  const entry = contract.internalSeo.generatedPages.find((page) => page.pageId === pageId);
  if (entry === undefined) return fail(`Page ${pageId} is not a generated page`);
  const { hiddenFieldId } = entry.metadata;
  if (hiddenFieldId === undefined) return null;
  return toggleValue(
    content,
    hiddenFieldId,
    (value) =>
      value.owner.kind === "collection_item" &&
      value.owner.collectionId === entry.collectionId &&
      value.owner.itemId === itemId,
    `Item ${itemId} of ${pageId}`,
  );
}

/** The robots directives a toggle's value serves: `noindex, nofollow` when hidden. */
export function managedSearchRobotsV1(hidden: boolean): ManagedSearchRobotsV1 {
  return { index: !hidden, follow: !hidden };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function directivesOf(value: unknown): ManagedSearchRobotsV1 | null {
  if (!isRecord(value) || typeof value.index !== "boolean" || typeof value.follow !== "boolean") return null;
  return { index: value.index, follow: value.follow };
}

/**
 * What a static page serves to search engines, read the one way every reader
 * reads it: its toggle when its search entry names one, else its protected
 * indexing directives. `null` when the page has no search entry or its value
 * cannot be read, which callers treat as "not indexed" (fail closed).
 */
export function managedServedIndexingV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  pageId: string,
): ManagedSearchRobotsV1 | null {
  const entry = contract.internalSeo.pages.find((page) => page.pageId === pageId);
  if (entry === undefined) return null;
  const pageValue = (fieldId: string) =>
    content.values.find(
      // Owned by this page alone: a site-owned value is not evidence of what one page serves.
      (value) => value.fieldId === fieldId && value.owner.kind === "page" && value.owner.pageId === pageId,
    );
  const { hiddenFieldId } = entry.metadata;
  if (hiddenFieldId !== undefined) {
    const toggle = pageValue(hiddenFieldId);
    return toggle?.type === "toggle" ? managedSearchRobotsV1(toggle.value) : null;
  }
  return directivesOf(pageValue(entry.metadata.indexing)?.value);
}

/**
 * What one item of a generated page serves to search engines: its toggle
 * when the page names one, else its protected indexing directives. `null`
 * when unreadable.
 */
export function managedServedItemIndexingV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  pageId: string,
  itemId: string,
): ManagedSearchRobotsV1 | null {
  const entry = contract.internalSeo.generatedPages.find((page) => page.pageId === pageId);
  if (entry === undefined) return null;
  const itemValue = (fieldId: string) =>
    content.values.find(
      (value) =>
        value.fieldId === fieldId &&
        value.owner.kind === "collection_item" &&
        value.owner.collectionId === entry.collectionId &&
        value.owner.itemId === itemId,
    );
  const { hiddenFieldId } = entry.metadata;
  if (hiddenFieldId !== undefined) {
    const toggle = itemValue(hiddenFieldId);
    return toggle?.type === "toggle" ? managedSearchRobotsV1(toggle.value) : null;
  }
  return directivesOf(itemValue(entry.metadata.indexing)?.value);
}

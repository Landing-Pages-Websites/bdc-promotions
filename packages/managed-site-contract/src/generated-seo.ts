import type { ManagedSiteContentDocument, ManagedSiteContentValue } from "./content.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { renderManagedGeneratedSeoTextV1 } from "./text-template.js";

/** A generated page's search slots a customer may own through a pattern. */
export type ManagedGeneratedSeoSlot = "title" | "description";

function fail(message: string): never {
  throw new ManagedSiteContractError("GENERATED_SEO_UNRESOLVED", message);
}

function textOf(value: ManagedSiteContentValue | undefined, what: string): string {
  if (value === undefined || typeof value.value !== "string") fail(`${what} has no text value`);
  return value.value;
}

/**
 * What one item of a generated page serves as its search title or description:
 * the slot's own value when it has no pattern; with one, the item's override
 * when it holds text, else the page's pattern filled with the item's text.
 *
 * Reads a contract and content that semantics already accepted, so a missing
 * page, item or value is a caller's mistake and throws
 * `GENERATED_SEO_UNRESOLVED` rather than guessing a title.
 */
export function managedGeneratedSeoTextV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  pageId: string,
  itemId: string,
  slot: ManagedGeneratedSeoSlot,
): string {
  const descriptor = contract.internalSeo.generatedPages.find((page) => page.pageId === pageId);
  if (descriptor === undefined) fail(`Page ${pageId} is not a generated page`);
  const itemValue = (fieldId: string): ManagedSiteContentValue | undefined =>
    content.values.find(
      (value) =>
        value.fieldId === fieldId &&
        value.owner.kind === "collection_item" &&
        value.owner.collectionId === descriptor.collectionId &&
        value.owner.itemId === itemId,
    );
  const own = textOf(itemValue(descriptor.metadata[slot]), `Item ${itemId} ${slot}`);
  const pattern = descriptor.metadata[`${slot}Pattern`];
  if (pattern === undefined) return own;
  const patternValue = content.values.find(
    (value) =>
      value.fieldId === pattern.fieldId && value.owner.kind === "page" && value.owner.pageId === pageId,
  );
  const patternField = contract.pages
    .find((page) => page.id === pageId)
    ?.sections.flatMap((section) => section.fields)
    .find((field) => field.id === pattern.fieldId);
  if (patternField?.type !== "plain_text" || patternField.constraints.pattern === undefined) {
    fail(`Page ${pageId} ${slot} pattern is not a pattern field`);
  }
  const inputs = Object.fromEntries(
    pattern.sources.map((source) => [
      source.placeholder,
      textOf(itemValue(source.fieldId), `Item ${itemId} ${source.placeholder}`),
    ]),
  );
  return renderManagedGeneratedSeoTextV1(
    own,
    patternField.constraints.pattern,
    textOf(patternValue, `Page ${pageId} ${slot} pattern`),
    inputs,
  );
}

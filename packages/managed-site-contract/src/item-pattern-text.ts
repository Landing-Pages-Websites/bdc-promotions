import type { ManagedSiteContentDocument, ManagedSiteContentValue } from "./content.js";
import type { ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { isManagedItemPatternField } from "./fields.js";
import { renderManagedSeoPatternV1 } from "./text-template.js";

function fail(message: string): never {
  throw new ManagedSiteContractError("ITEM_PATTERN_UNRESOLVED", message);
}

function textOf(value: ManagedSiteContentValue | undefined, what: string): string {
  if (value === undefined || typeof value.value !== "string") fail(`${what} has no text value`);
  return value.value;
}

/**
 * What one item's page shows for page text filled from its item (0.38.0): the
 * pattern's stored words with each token replaced, verbatim, by the item's
 * own text for that placeholder's field ("Build Your Healthcare Network.").
 *
 * Reads a contract and content that semantics already accepted, so an unknown
 * field, a page that does not serve the item's collection or a missing value
 * is a caller's mistake and throws `ITEM_PATTERN_UNRESOLVED` rather than
 * showing a token.
 */
export function managedItemPatternTextV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  fieldId: string,
  itemId: string,
): string {
  const page = contract.pages.find((candidate) =>
    candidate.sections.some((section) => section.fields.some((field) => field.id === fieldId)),
  );
  const field = page?.sections.flatMap((section) => section.fields).find((candidate) => candidate.id === fieldId);
  if (page === undefined || field === undefined || !isManagedItemPatternField(field)) {
    fail(`Field ${fieldId} is not page text filled from an item`);
  }
  if (page.route.kind !== "generated" || (field.type !== "plain_text" && field.type !== "heading_text")) {
    fail(`Field ${fieldId} is not on a generated page`);
  }
  const { collectionId } = page.route;
  const pattern = field.constraints.pattern;
  if (pattern === undefined) fail(`Field ${fieldId} has no pattern`);
  const stored = content.values.find(
    (value) => value.fieldId === fieldId && value.owner.kind === "page" && value.owner.pageId === page.id,
  );
  const itemValue = (sourceId: string): ManagedSiteContentValue | undefined =>
    content.values.find(
      (value) =>
        value.fieldId === sourceId &&
        value.owner.kind === "collection_item" &&
        value.owner.collectionId === collectionId &&
        value.owner.itemId === itemId,
    );
  const inputs = Object.fromEntries(
    pattern.placeholders.map((placeholder) => [
      placeholder.name,
      textOf(itemValue(placeholder.fieldId ?? ""), `Item ${itemId} {${placeholder.name}}`),
    ]),
  );
  return renderManagedSeoPatternV1(pattern, textOf(stored, `Field ${fieldId}`), inputs);
}

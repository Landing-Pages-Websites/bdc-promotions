import type { ManagedSiteContractV1 } from "./contract.js";
import { isManagedPatternSourceField } from "./contract-semantics-seo.js";
import { ManagedSiteContractError } from "./errors.js";
import { isManagedItemPatternField, type ManagedFieldDescriptor } from "./fields.js";

function fail(message: string): never {
  throw new ManagedSiteContractError("CONTRACT_ITEM_PATTERN", message);
}

function placeholdersOf(field: ManagedFieldDescriptor): readonly { readonly name: string; readonly fieldId?: string }[] {
  if (field.type !== "plain_text" && field.type !== "heading_text") return [];
  return field.constraints.pattern?.placeholders ?? [];
}

/**
 * Page text filled from its generated page's item (0.38.0): "Build Your {name}
 * Network." written once for every network page. Invariant: every token of an
 * item-text pattern is filled, on every page it renders on, by one line of the
 * customer's text from the item that page serves, so the text a page shows is
 * always the pattern with that item's own words in it.
 *
 * So the field is the page's own (page-scoped, customer-editable, used once on
 * its page, no item usage), its page is generated, and each placeholder names
 * an item field of that page's route collection that holds one non-empty line
 * of words (`isManagedPatternSourceField`, the search pattern's rule). An item
 * field never holds one: it already belongs to one item.
 */
export function validateManagedItemPatterns(contract: ManagedSiteContractV1): void {
  for (const collection of contract.collections) {
    for (const field of collection.itemFields) {
      if (isManagedItemPatternField(field)) fail(`An item field cannot fill its own tokens from an item: ${field.id}`);
    }
  }
  for (const page of contract.pages) {
    for (const field of page.sections.flatMap((section) => section.fields)) {
      if (!isManagedItemPatternField(field)) continue;
      const [usage] = field.usages;
      const ownField =
        field.scope === "page" &&
        field.classification === "customer_editable" &&
        field.usages.length === 1 &&
        usage?.pageId === page.id &&
        usage.itemId === null;
      if (!ownField) fail(`An item-text pattern is its generated page's own text, used once there: ${field.id}`);
      if (page.route.kind !== "generated") fail(`An item-text pattern needs a generated page to fill it: ${field.id}`);
      const { collectionId } = page.route;
      const collection = contract.collections.find((candidate) => candidate.id === collectionId);
      for (const placeholder of placeholdersOf(field)) {
        const source = collection?.itemFields.find((candidate) => candidate.id === placeholder.fieldId);
        if (source === undefined || !isManagedPatternSourceField(source)) {
          fail(`Pattern ${field.id} token {${placeholder.name}} is not one line of ${collectionId}'s item text: ${placeholder.fieldId}`);
        }
      }
    }
  }
}

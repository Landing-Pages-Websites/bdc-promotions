import {
  isManagedTextAttribute,
  managedAttributeBindingName,
  managedAttributeItemBindingName,
  type ManagedAttributeBindingName,
  type ManagedAttributeItemBindingName,
  type ManagedTextAttribute,
} from "./attribute-text.js";
import { ManagedSiteContractError } from "./errors.js";
import { parseStableId, type StableId } from "./ids.js";

export interface ManagedSitePageAttributesV1 {
  readonly "data-gomega-page-id": StableId<"page">;
}

/**
 * `data-gomega-item-id` is absent for a value the page owns and present for a
 * collection item's copy of one, which is the only thing that tells two of them
 * apart in the rendered page.
 *
 * A collection declares its fields once and renders them once per item, so a
 * field id names a column and an item id names a row. Without the row the markup
 * cannot name the cell, and an editor reading the page can say what was clicked
 * but not which one -- so before this, item values carried no annotation at all
 * rather than an ambiguous one.
 */
export interface ManagedSiteFieldAttributesV1 {
  readonly "data-gomega-field-id": StableId<"field">;
  readonly "data-gomega-item-id"?: StableId<"item">;
}

export function managedSitePageAttributesV1(
  pageId: StableId<"page">,
): ManagedSitePageAttributesV1 {
  return Object.freeze({
    "data-gomega-page-id": parseStableId(pageId, "page"),
  });
}

export function managedSiteFieldAttributesV1(
  fieldId: StableId<"field">,
  itemId?: StableId<"item">,
): ManagedSiteFieldAttributesV1 {
  const fieldAttributes = {
    "data-gomega-field-id": parseStableId(fieldId, "field"),
  };
  return Object.freeze(
    itemId === undefined
      ? fieldAttributes
      : {
          ...fieldAttributes,
          "data-gomega-item-id": parseStableId(itemId, "item"),
        },
  );
}

/**
 * The bindings that name the field an element's `attribute` holds: the field,
 * and the collection item for an item's copy. Spread onto the element beside
 * the attribute itself (`aria-label={value}`). Every name is derived from the
 * attribute, so an element may carry a text field and several attribute fields
 * at once, each read only from its own bindings; an attribute outside
 * `MANAGED_TEXT_ATTRIBUTES` is refused.
 */
export type ManagedSiteAttributeFieldAttributesV1<Attribute extends ManagedTextAttribute> = {
  readonly [Name in ManagedAttributeBindingName<Attribute>]: StableId<"field">;
} & {
  readonly [Name in ManagedAttributeItemBindingName<Attribute>]?: StableId<"item">;
};

export function managedSiteAttributeFieldAttributesV1<Attribute extends ManagedTextAttribute>(
  attribute: Attribute,
  fieldId: StableId<"field">,
  itemId?: StableId<"item">,
): ManagedSiteAttributeFieldAttributesV1<Attribute> {
  if (!isManagedTextAttribute(attribute)) {
    throw new ManagedSiteContractError("FIELD_ATTRIBUTE", `Not an attribute a field may write: ${String(attribute)}`);
  }
  const bindings: Record<string, string> = {
    [managedAttributeBindingName(attribute)]: parseStableId(fieldId, "field"),
  };
  if (itemId !== undefined) {
    bindings[managedAttributeItemBindingName(attribute)] = parseStableId(itemId, "item");
  }
  return Object.freeze(bindings) as ManagedSiteAttributeFieldAttributesV1<Attribute>;
}

import { parseStableId, type StableId } from "./ids.js";

export interface ManagedSitePageAttributesV1 {
  readonly "data-gomega-page-id": StableId<"page">;
}

export interface ManagedSiteFieldAttributesV1 {
  readonly "data-gomega-field-id": StableId<"field">;
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
): ManagedSiteFieldAttributesV1 {
  return Object.freeze({
    "data-gomega-field-id": parseStableId(fieldId, "field"),
  });
}

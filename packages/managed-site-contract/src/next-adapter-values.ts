import type {
  ManagedContentOwner,
  ManagedSiteContentDocument,
  ManagedSiteContentValue,
} from "./content.js";
import { ManagedSiteContractError } from "./errors.js";
import { parseStableId, type StableId } from "./ids.js";
import { parseJsonValue, type JsonValue } from "./json.js";
import { hasExactJsonKeys, isJsonRecord } from "./json-record.js";

type ManagedSiteContentValueType = ManagedSiteContentValue["type"];

export interface ManagedSiteNextValueSelector<
  Type extends ManagedSiteContentValueType = ManagedSiteContentValueType,
> {
  readonly fieldId: StableId<"field">;
  readonly owner: ManagedContentOwner;
  readonly type: Type;
}

export type ManagedSiteNextValueReader = <
  Type extends ManagedSiteContentValueType,
>(
  selector: ManagedSiteNextValueSelector<Type>,
) => Extract<ManagedSiteContentValue, { readonly type: Type }>;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function parseOwner(value: JsonValue): ManagedContentOwner {
  if (!isJsonRecord(value) || typeof value.kind !== "string") {
    return fail("NEXT_ADAPTER_SELECTOR_INVALID", "Next adapter selector is invalid");
  }
  if (value.kind === "site" && hasExactJsonKeys(value, ["kind"])) {
    return { kind: "site" };
  }
  if (
    value.kind === "page" &&
    hasExactJsonKeys(value, ["kind", "pageId"]) &&
    typeof value.pageId === "string"
  ) {
    return { kind: "page", pageId: parseStableId(value.pageId, "page") };
  }
  if (
    value.kind === "collection_item" &&
    hasExactJsonKeys(value, ["kind", "collectionId", "itemId"]) &&
    typeof value.collectionId === "string" &&
    typeof value.itemId === "string"
  ) {
    return {
      kind: "collection_item",
      collectionId: parseStableId(value.collectionId, "collection"),
      itemId: parseStableId(value.itemId, "item"),
    };
  }
  return fail("NEXT_ADAPTER_SELECTOR_INVALID", "Next adapter selector is invalid");
}

function parseSelector(
  input: unknown,
): ManagedSiteNextValueSelector<ManagedSiteContentValueType> {
  const value = parseJsonValue(input);
  if (
    !isJsonRecord(value) ||
    !hasExactJsonKeys(value, ["fieldId", "owner", "type"]) ||
    typeof value.fieldId !== "string" ||
    typeof value.type !== "string"
  ) {
    return fail("NEXT_ADAPTER_SELECTOR_INVALID", "Next adapter selector is invalid");
  }
  return {
    fieldId: parseStableId(value.fieldId, "field"),
    owner: parseOwner(value.owner),
    type: value.type as ManagedSiteContentValueType,
  };
}

function ownerKey(owner: ManagedContentOwner): string {
  switch (owner.kind) {
    case "site":
      return "site";
    case "page":
      return `page:${owner.pageId}`;
    case "collection_item":
      return `item:${owner.collectionId}:${owner.itemId}`;
  }
}

function valueKey(fieldId: StableId<"field">, owner: ManagedContentOwner): string {
  return `${fieldId}|${ownerKey(owner)}`;
}

function indexValues(
  content: ManagedSiteContentDocument,
): ReadonlyMap<string, ManagedSiteContentValue> {
  return new Map(
    content.values.map((value) => [valueKey(value.fieldId, value.owner), value]),
  );
}

export function createManagedSiteNextValueReader(
  content: ManagedSiteContentDocument,
): ManagedSiteNextValueReader {
  const values = indexValues(content);
  return <Type extends ManagedSiteContentValueType>(
    input: ManagedSiteNextValueSelector<Type>,
  ): Extract<ManagedSiteContentValue, { readonly type: Type }> => {
    const selector = parseSelector(input);
    const value = values.get(valueKey(selector.fieldId, selector.owner));
    if (value === undefined) {
      return fail("NEXT_ADAPTER_VALUE_MISSING", "Managed-site value is missing");
    }
    if (value.type !== selector.type) {
      return fail("NEXT_ADAPTER_VALUE_TYPE", "Managed-site value type conflicts");
    }
    return value as Extract<ManagedSiteContentValue, { readonly type: Type }>;
  };
}

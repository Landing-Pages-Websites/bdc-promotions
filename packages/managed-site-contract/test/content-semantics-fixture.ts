import { conformingContract, fixtureId } from "./contract-semantics-fixture.js";

type JsonObject = Record<string, unknown>;

export interface ContentSemanticsFixtureIds {
  readonly homePage: string;
  readonly generatedPage: string;
  readonly collection: string;
  readonly item: string;
  readonly asset: string;
  readonly titleField: string;
  readonly bodyField: string;
  readonly imageField: string;
  readonly collectionField: string;
  readonly richField: string;
  readonly linkField: string;
  readonly protectedField: string;
  readonly routeKeyField: string;
  readonly itemHeadingField: string;
  readonly itemRichField: string;
  readonly itemLinkField: string;
  readonly itemImageField: string;
}

export interface ContentSemanticsFixture {
  readonly contract: JsonObject;
  readonly content: JsonObject;
  readonly ids: ContentSemanticsFixtureIds;
}

interface MutableField extends JsonObject {
  id: string;
  type: string;
  usages?: Array<{ pageId: string; itemId: string | null }>;
}

interface MutableCollection extends JsonObject {
  id: string;
  itemFields: MutableField[];
  uniqueness: Array<{ fieldIds: string[]; comparison: "exact" | "case_folded" }>;
}

interface MutableContract extends JsonObject {
  pages: Array<{
    id: string;
    sections: Array<{ fields: MutableField[] }>;
  }>;
  collections: MutableCollection[];
  assets: Array<JsonObject & { id: string }>;
  internalSeo: {
    protectedFields: MutableField[];
  };
}

function presentation(name: string, order: number): JsonObject {
  return { name, description: null, group: "C3B", order, example: null };
}

function resolver(pointer: string): JsonObject {
  return { kind: "json_pointer", path: "content/site.json", pointer };
}

function linkConstraints(): JsonObject {
  return {
    labelConstraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
    authority: "internal_only",
    allowedSchemes: [],
    allowedExternalHosts: [],
    fragmentPolicy: "forbid",
    allowedFragments: [],
    allowedTargets: ["same_window"],
  };
}

function richConstraints(): JsonObject {
  return {
    maxCharacters: 500,
    maxNodes: 50,
    allowedBlocks: ["paragraph"],
    allowedMarks: ["bold"],
    allowLinks: true,
    allowedExternalHosts: [],
    allowedTargets: ["same_window"],
  };
}

function richValue(pageId: string): JsonObject {
  return {
    type: "document",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            destination: { kind: "internal", pageId, fragment: null },
            target: "same_window",
            children: [{ type: "text", text: "Details", marks: ["bold"] }],
          },
        ],
      },
    ],
  };
}

function owner(kind: "site" | "page", pageId: string): JsonObject {
  return kind === "site" ? { kind } : { kind, pageId };
}

function itemOwner(collectionId: string, itemId: string): JsonObject {
  return { kind: "collection_item", collectionId, itemId };
}

function imageValue(): JsonObject {
  return {
    path: "public/images/managed.webp",
    sha256: "a".repeat(64),
    mimeType: "image/webp",
    width: 1,
    height: 1,
    bytes: 1,
    altText: "Managed image",
    crop: null,
    focalPoint: null,
  };
}

function manifestEntry(assetSlotId: string): JsonObject {
  const image = imageValue();
  return {
    assetSlotId,
    path: image.path,
    sha256: image.sha256,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
  };
}

function renderedValue(
  fieldId: string,
  contentOwner: JsonObject,
  type: string,
  value: unknown,
): JsonObject {
  return { fieldId, owner: contentOwner, type, value };
}

function addRenderedFields(
  contract: MutableContract,
  ids: ContentSemanticsFixtureIds,
): void {
  const fields = contract.pages[0].sections[0].fields;
  const imageUsage = fields[2].usages?.[0];
  if (imageUsage === undefined) throw new Error("C3A fixture must expose image usage");
  imageUsage.itemId = null;
  fields.push(
    {
      id: ids.richField,
      scope: "site",
      type: "rich_text",
      classification: "customer_editable",
      capabilities: ["text.edit", "rich_text.mark.bold", "rich_text.link.edit"],
      resolver: resolver("/hero/rich"),
      usages: [
        { pageId: ids.homePage, itemId: null },
        { pageId: ids.generatedPage, itemId: ids.item },
      ],
      presentation: presentation("Rich copy", 20),
      constraints: richConstraints(),
    },
    {
      id: ids.linkField,
      scope: "page",
      type: "link",
      classification: "customer_editable",
      capabilities: ["link.label.edit", "link.destination.edit", "link.target.edit"],
      resolver: resolver("/hero/link"),
      usages: [{ pageId: ids.homePage, itemId: null }],
      presentation: presentation("Link", 21),
      constraints: linkConstraints(),
    },
  );
}

function addItemFields(
  collection: MutableCollection,
  ids: ContentSemanticsFixtureIds,
): void {
  collection.itemFields.push(
    {
      id: ids.itemHeadingField,
      type: "heading_text",
      classification: "customer_editable",
      capabilities: ["text.edit"],
      itemPointer: "/heading",
      presentation: presentation("Item heading", 30),
      semanticLevel: 2,
      constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
    },
    {
      id: ids.itemRichField,
      type: "rich_text",
      classification: "customer_editable",
      capabilities: ["text.edit", "rich_text.mark.bold", "rich_text.link.edit"],
      itemPointer: "/description",
      presentation: presentation("Item description", 31),
      constraints: richConstraints(),
    },
    {
      id: ids.itemLinkField,
      type: "link",
      classification: "customer_editable",
      capabilities: ["link.label.edit", "link.destination.edit", "link.target.edit"],
      itemPointer: "/link",
      presentation: presentation("Item link", 32),
      constraints: linkConstraints(),
    },
    {
      id: ids.itemImageField,
      type: "image",
      classification: "customer_editable",
      capabilities: ["image.upload"],
      itemPointer: "/image",
      presentation: presentation("Item image", 33),
      assetSlotId: ids.asset,
    },
  );
  collection.uniqueness.push({
    fieldIds: [ids.itemHeadingField],
    comparison: "case_folded",
  });
}

function fixtureIds(contract: MutableContract): ContentSemanticsFixtureIds {
  const fields = contract.pages[0].sections[0].fields;
  const collection = contract.collections[0];
  const item = fields[2].usages?.[0]?.itemId;
  if (item === null || item === undefined) {
    throw new Error("C3A fixture must expose its deferred item ID");
  }
  return {
    homePage: contract.pages[0].id,
    generatedPage: contract.pages[1].id,
    collection: collection.id,
    item,
    asset: contract.assets[0].id,
    titleField: fields[0].id,
    bodyField: fields[1].id,
    imageField: fields[2].id,
    collectionField: fields[3].id,
    richField: fixtureId("field"),
    linkField: fixtureId("field"),
    protectedField: contract.internalSeo.protectedFields[0].id,
    routeKeyField: collection.itemFields[0].id,
    itemHeadingField: fixtureId("field"),
    itemRichField: fixtureId("field"),
    itemLinkField: fixtureId("field"),
    itemImageField: fixtureId("field"),
  };
}

function contentValues(ids: ContentSemanticsFixtureIds): JsonObject[] {
  return [
    renderedValue(ids.titleField, owner("page", ids.homePage), "heading_text", "Managed heading"),
    renderedValue(ids.bodyField, owner("page", ids.homePage), "plain_text", "Managed body"),
    renderedValue(ids.imageField, owner("page", ids.homePage), "image", imageValue()),
    renderedValue(ids.collectionField, owner("page", ids.homePage), "collection", {
      orderedItemIds: [ids.item],
    }),
    renderedValue(ids.richField, owner("site", ids.homePage), "rich_text", richValue(ids.homePage)),
    renderedValue(ids.linkField, owner("page", ids.homePage), "link", {
      label: "Learn more",
      destination: { kind: "internal", pageId: ids.generatedPage, fragment: null },
      target: "same_window",
    }),
    {
      fieldId: ids.protectedField,
      owner: owner("site", ids.homePage),
      type: "internal_protected",
      valueType: "string",
      value: "Gomega",
    },
    renderedValue(ids.routeKeyField, itemOwner(ids.collection, ids.item), "plain_text", "service-one"),
    renderedValue(ids.itemHeadingField, itemOwner(ids.collection, ids.item), "heading_text", "Service One"),
    renderedValue(ids.itemRichField, itemOwner(ids.collection, ids.item), "rich_text", richValue(ids.homePage)),
    renderedValue(ids.itemLinkField, itemOwner(ids.collection, ids.item), "link", {
      label: "Home",
      destination: { kind: "internal", pageId: ids.homePage, fragment: null },
      target: "same_window",
    }),
    renderedValue(ids.itemImageField, itemOwner(ids.collection, ids.item), "image", imageValue()),
  ];
}

export function contentSemanticsFixture(): ContentSemanticsFixture {
  const contract = conformingContract() as MutableContract;
  const ids = fixtureIds(contract);
  addRenderedFields(contract, ids);
  addItemFields(contract.collections[0], ids);
  return {
    contract,
    content: {
      schemaVersion: "1.0",
      values: contentValues(ids),
      assetManifest: [manifestEntry(ids.asset)],
    },
    ids,
  };
}

function fixtureValues(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.content.values as JsonObject[];
}

function fixturePageFields(fixture: ContentSemanticsFixture): MutableField[] {
  return (fixture.contract as MutableContract).pages[0].sections[0].fields;
}

function fixtureCollectionValue(fixture: ContentSemanticsFixture): JsonObject {
  const value = fixtureValues(fixture).find(
    (candidate) => candidate.fieldId === fixture.ids.collectionField,
  );
  if (value === undefined) throw new Error("Missing collection fixture value");
  return value;
}

function fixtureItemValues(
  fixture: ContentSemanticsFixture,
  itemId: string,
): JsonObject[] {
  return fixtureValues(fixture).filter((value) => {
    const contentOwner = value.owner as JsonObject;
    return contentOwner.kind === "collection_item" && contentOwner.itemId === itemId;
  });
}

export function addSecondFixtureItem(
  fixture: ContentSemanticsFixture,
  options: { readonly heading?: string; readonly routeKey?: string } = {},
): string {
  const secondItem = fixtureId("item");
  const collection = fixtureCollectionValue(fixture).value as {
    orderedItemIds: string[];
  };
  collection.orderedItemIds.push(secondItem);
  const copies = fixtureItemValues(fixture, fixture.ids.item).map((value) => {
    const copy = structuredClone(value);
    (copy.owner as JsonObject).itemId = secondItem;
    if (copy.fieldId === fixture.ids.itemHeadingField) {
      copy.value = options.heading ?? "Service Two";
    }
    if (copy.fieldId === fixture.ids.routeKeyField) {
      copy.value = options.routeKey ?? "service-two";
    }
    return copy;
  });
  fixtureValues(fixture).push(...copies);
  return secondItem;
}

function secondCollectionDescriptor(
  collectionId: string,
  itemFieldId: string,
): MutableCollection {
  return {
    id: collectionId,
    presentation: presentation("Other collection", 90),
    resolver: resolver("/other/items"),
    itemIdPointer: "/id",
    itemIdPolicy: "server_minted",
    minItems: 0,
    maxItems: 10,
    itemFields: [{
      id: itemFieldId,
      type: "plain_text",
      classification: "customer_editable",
      capabilities: ["text.edit"],
      itemPointer: "/name",
      presentation: presentation("Other item", 91),
      semantic: "body",
      constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
    }],
    uniqueness: [],
    deletion: { whenReferenced: "restrict", restorable: true },
  };
}

function secondCollectionField(
  fixture: ContentSemanticsFixture,
  collectionId: string,
  fieldId: string,
): MutableField {
  return {
    id: fieldId,
    scope: "page",
    type: "collection",
    classification: "customer_editable",
    capabilities: ["collection.reorder"],
    resolver: resolver("/other/list"),
    usages: [{ pageId: fixture.ids.homePage, itemId: null }],
    presentation: presentation("Other collection", 92),
    collectionId,
  };
}

export function addSecondFixtureCollectionUsingItem(
  fixture: ContentSemanticsFixture,
  itemId: string,
): void {
  const collectionId = fixtureId("collection");
  const collectionFieldId = fixtureId("field");
  const itemFieldId = fixtureId("field");
  const contract = fixture.contract as MutableContract;
  contract.collections.push(secondCollectionDescriptor(collectionId, itemFieldId));
  fixturePageFields(fixture).push(
    secondCollectionField(fixture, collectionId, collectionFieldId),
  );
  fixtureValues(fixture).push(
    renderedValue(collectionFieldId, owner("page", fixture.ids.homePage), "collection", {
      orderedItemIds: [itemId],
    }),
    renderedValue(itemFieldId, itemOwner(collectionId, itemId), "plain_text", "Other item"),
  );
}

import { contentSemanticsFixture } from "./content-semantics-fixture.js";

type JsonObject = Record<string, unknown>;

interface ProjectionIds {
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
  readonly item: string;
  readonly asset: string;
}

export interface SourceProjectionFixture {
  readonly contract: JsonObject;
  readonly expectedContent: JsonObject;
  readonly ids: ProjectionIds;
  readonly sourceDocuments: Array<{ path: string; value: JsonObject }>;
}

function valuesByField(content: JsonObject): Map<string, JsonObject> {
  const values = content.values as JsonObject[];
  return new Map(values.map((value) => [value.fieldId as string, value]));
}

function requiredValue(values: ReadonlyMap<string, JsonObject>, fieldId: string): unknown {
  const entry = values.get(fieldId);
  if (entry === undefined) throw new Error(`Missing fixture field ${fieldId}`);
  return entry.value;
}

function sourceValue(
  expectedContent: JsonObject,
  ids: ProjectionIds,
): JsonObject {
  const values = valuesByField(expectedContent);
  return {
    hero: {
      title: requiredValue(values, ids.titleField),
      body: requiredValue(values, ids.bodyField),
      image: requiredValue(values, ids.imageField),
      services: requiredValue(values, ids.collectionField),
      rich: requiredValue(values, ids.richField),
      link: requiredValue(values, ids.linkField),
    },
    seo: { title: requiredValue(values, ids.protectedField) },
    services: [
      {
        id: ids.item,
        slug: requiredValue(values, ids.routeKeyField),
        heading: requiredValue(values, ids.itemHeadingField),
        description: requiredValue(values, ids.itemRichField),
        link: requiredValue(values, ids.itemLinkField),
        image: requiredValue(values, ids.itemImageField),
      },
    ],
  };
}

export function sourceProjectionFixture(): SourceProjectionFixture {
  const fixture = contentSemanticsFixture();
  const expectedContent = fixture.content;
  return {
    contract: fixture.contract,
    expectedContent,
    ids: fixture.ids,
    sourceDocuments: [
      {
        path: "content/site.json",
        value: sourceValue(expectedContent, fixture.ids),
      },
    ],
  };
}

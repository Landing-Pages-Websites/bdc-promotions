import * as z from "zod";

import type { DeepReadonly } from "./deep-readonly.js";
import { ManagedSiteContractError } from "./errors.js";
import {
  parseManagedCollectionDescriptor,
  parseManagedFieldDescriptor,
  type ManagedCollectionDescriptor,
  type ManagedCollectionItemField,
  type ManagedFieldDescriptor,
} from "./fields.js";
import { managedInternalValueTypeSchema } from "./internal-value-types.js";
import {
  managedRichTextDocumentSchema,
  parseManagedRichTextDocument,
  summarizeManagedRichText,
  type ManagedRichTextDocument,
  type ManagedRichTextInline,
} from "./rich-text.js";
import {
  MANAGED_SITE_ROOT_SEMANTICS,
  withManagedSiteJsonSchemaSemantic,
} from "./schema-semantics.js";
import { parseSchemaInput } from "./schema-input.js";
import {
  absoluteHttpsUrlSchema,
  MAX_LINK_LABEL_CHARACTERS,
  managedImageMimeTypeSchema,
  managedImageValueSchema,
  managedLinkDestinationSchema,
  managedLinkTargetSchema,
  opaqueJsonValueSchema,
  repositoryPathSchema,
  stableIdSchema,
  type ManagedLinkDestination,
} from "./values.js";

export const managedContentOwnerSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("site") }),
  z.strictObject({ kind: z.literal("page"), pageId: stableIdSchema("page") }),
  z.strictObject({
    kind: z.literal("collection_item"),
    collectionId: stableIdSchema("collection"),
    itemId: stableIdSchema("item"),
  }),
]);

const contentBase = {
  fieldId: stableIdSchema("field"),
  owner: managedContentOwnerSchema,
};

const plainTextContentValueSchema = z.strictObject({
  ...contentBase,
  type: z.literal("plain_text"),
  value: z.string(),
});

const headingTextContentValueSchema = z.strictObject({
  ...contentBase,
  type: z.literal("heading_text"),
  value: z.string(),
});

const richTextContentValueSchema = z
  .strictObject({
    ...contentBase,
    type: z.literal("rich_text"),
    value: managedRichTextDocumentSchema,
  })
  .superRefine((content, context) => {
    try {
      parseManagedRichTextDocument(content.value);
    } catch {
      context.addIssue({ code: "custom", message: "Rich text exceeds its envelope" });
    }
  });

const linkContentValueSchema = z.strictObject({
  ...contentBase,
  type: z.literal("link"),
  value: z.strictObject({
    label: z.string().max(MAX_LINK_LABEL_CHARACTERS),
    destination: managedLinkDestinationSchema,
    target: managedLinkTargetSchema,
  }),
});

const imageContentValueSchema = z.strictObject({
  ...contentBase,
  type: z.literal("image"),
  value: managedImageValueSchema,
});

const collectionContentValueSchema = z.strictObject({
  ...contentBase,
  type: z.literal("collection"),
  value: z.strictObject({ orderedItemIds: z.array(stableIdSchema("item")) }),
});

const internalContentBase = {
  ...contentBase,
  type: z.literal("internal_protected"),
};

const boundedInternalStringSchema = z.string().max(10_000);
const boundedStringListSchema = z.array(z.string().min(1).max(2_048)).max(100);
const nonemptyNfcString = (maxLength: number): z.ZodString =>
  z.string().min(1).max(maxLength).refine((value) => value.normalize("NFC") === value);

const postalAddressSchema = z.strictObject({
  streetAddress: nonemptyNfcString(300),
  addressLocality: nonemptyNfcString(160),
  addressRegion: nonemptyNfcString(160),
  postalCode: nonemptyNfcString(32),
  addressCountry: z.string().regex(/^[A-Z]{2}$/),
});

const geoCoordinatesSchema = z.strictObject({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

const weekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const uniqueDaysSchema = z.array(weekdaySchema).min(1).max(7).refine(hasUniqueValues);
const canonicalTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const allDayPeriodSchema = z.strictObject({
  days: uniqueDaysSchema,
  allDay: z.literal(true),
  opens: z.null(),
  closes: z.null(),
});
const timedPeriodSchema = z.strictObject({
  days: uniqueDaysSchema,
  allDay: z.literal(false),
  opens: canonicalTimeSchema,
  closes: canonicalTimeSchema,
});
const openingPeriodSchema = z.discriminatedUnion("allDay", [
  allDayPeriodSchema,
  timedPeriodSchema,
]);

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length;
}

const openingHoursSchema = z
  .strictObject({
    timeZone: z.string().min(1).max(100).refine(isIanaTimeZone),
    periods: z.array(openingPeriodSchema).max(21),
  })
  .refine((hours) =>
    hasUniqueValues(hours.periods.flatMap((period) => period.days)),
  );

const indexingDirectivesSchema = z.strictObject({
  index: z.boolean(),
  follow: z.boolean(),
  archive: z.boolean(),
  imageIndex: z.boolean(),
  maxSnippet: z.number().int().min(-1).max(10_000),
  maxImagePreview: z.enum(["none", "standard", "large"]),
  maxVideoPreview: z.number().int().min(-1).max(86_400),
});

const internalProtectedContentValueSchema = z.discriminatedUnion("valueType", [
  z.strictObject({ ...internalContentBase, valueType: z.literal("string"), value: boundedInternalStringSchema }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("url"), value: absoluteHttpsUrlSchema.max(2_048) }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("boolean"), value: z.boolean() }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("number"), value: z.number().finite() }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("string_list"), value: boundedStringListSchema }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("postal_address"), value: postalAddressSchema }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("geo_coordinates"), value: geoCoordinatesSchema }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("opening_hours"), value: openingHoursSchema }),
  z.strictObject({ ...internalContentBase, valueType: z.literal("indexing_directives"), value: indexingDirectivesSchema }),
  z.strictObject({
    ...internalContentBase,
    valueType: z.literal("json"),
    value: opaqueJsonValueSchema,
  }),
]);

const renderedContentValueSchema = z.discriminatedUnion("type", [
  plainTextContentValueSchema,
  headingTextContentValueSchema,
  richTextContentValueSchema,
  linkContentValueSchema,
  imageContentValueSchema,
  collectionContentValueSchema,
]);

export const managedSiteContentValueSchema = withManagedSiteJsonSchemaSemantic(
  "content-value",
  z.union([renderedContentValueSchema, internalProtectedContentValueSchema]),
);

export const managedSiteAssetManifestEntrySchema = z.strictObject({
  assetSlotId: stableIdSchema("asset"),
  path: repositoryPathSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mimeType: managedImageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
});

export const managedSiteContentDocumentSchema = withManagedSiteJsonSchemaSemantic(
  MANAGED_SITE_ROOT_SEMANTICS.ManagedSiteContentDocument,
  z.strictObject({
    schemaVersion: z.literal("1.0"),
    values: z.array(managedSiteContentValueSchema),
    assetManifest: z.array(managedSiteAssetManifestEntrySchema),
  }),
);

export type ManagedContentOwner = DeepReadonly<z.infer<typeof managedContentOwnerSchema>>;
export type ManagedSiteContentValue = DeepReadonly<z.infer<typeof managedSiteContentValueSchema>>;
export type ManagedSiteAssetManifestEntry = DeepReadonly<z.infer<
  typeof managedSiteAssetManifestEntrySchema
>>;
export type ManagedSiteContentDocument = DeepReadonly<z.infer<
  typeof managedSiteContentDocumentSchema
>>;
export type { ManagedInternalValueType } from "./internal-value-types.js";

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

export function parseManagedSiteContentValue(input: unknown): ManagedSiteContentValue {
  return parseSchemaInput(managedSiteContentValueSchema, input);
}

export function parseManagedSiteContentDocument(
  input: unknown,
): ManagedSiteContentDocument {
  return parseSchemaInput(managedSiteContentDocumentSchema, input);
}

function destinationScheme(destination: ManagedLinkDestination): "internal" | "https" | "mailto" | "tel" {
  if (destination.kind === "internal") return "internal";
  if (destination.kind === "external") return "https";
  return destination.kind === "email" ? "mailto" : "tel";
}

function externalHost(destination: ManagedLinkDestination): string | null {
  return destination.kind === "external" ? new URL(destination.url).hostname : null;
}

type ManagedValueField = ManagedFieldDescriptor | ManagedCollectionItemField;
type ManagedTextField = Extract<
  ManagedValueField,
  { type: "plain_text" | "heading_text" }
>;

function isAllowedDestination(
  destination: ManagedLinkDestination,
  constraints: Extract<ManagedValueField, { type: "link" }>['constraints'],
): boolean {
  const internal = destination.kind === "internal";
  if (constraints.authority === "internal_only" && !internal) return false;
  if (constraints.authority === "external_only" && internal) return false;
  const scheme = destinationScheme(destination);
  if (scheme !== "internal" && !constraints.allowedSchemes.includes(scheme)) return false;
  const host = externalHost(destination);
  if (host !== null && !constraints.allowedExternalHosts.includes(host)) return false;
  if (destination.kind !== "internal") return true;
  if (constraints.fragmentPolicy === "forbid") return destination.fragment === null;
  return destination.fragment === null || constraints.allowedFragments.includes(destination.fragment);
}

function validateRichText(
  field: Extract<ManagedValueField, { type: "rich_text" }>,
  document: ManagedRichTextDocument,
): boolean {
  const stats = summarizeManagedRichText(document);
  const withinEnvelope =
    stats.characters <= field.constraints.maxCharacters &&
    stats.nodes <= field.constraints.maxNodes;
  const blocksAllowed = stats.blocks.every((block) =>
    field.constraints.allowedBlocks.includes(block.type),
  );
  const marksAllowed = stats.textNodes.every((node) =>
    node.marks.every((mark) => field.constraints.allowedMarks.includes(mark)),
  );
  const linksAllowed = stats.inlines.every((inline) =>
    inline.type === "text" || richTextLinkAllowed(field, inline),
  );
  return withinEnvelope && blocksAllowed && marksAllowed && linksAllowed;
}

function richTextLinkAllowed(
  field: Extract<ManagedValueField, { type: "rich_text" }>,
  inline: Extract<ManagedRichTextInline, { type: "link" }>,
): boolean {
  if (!field.constraints.allowLinks) return false;
  if (!field.constraints.allowedTargets.includes(inline.target)) return false;
  const host = externalHost(inline.destination);
  return host === null || field.constraints.allowedExternalHosts.includes(host);
}

interface TextConstraints {
  readonly minLength: number;
  readonly maxLength: number;
  readonly newlines: "forbid" | "allow";
}

function validatesText(value: string, constraints: TextConstraints): boolean {
  const { minLength, maxLength, newlines } = constraints;
  return (
    value.length >= minLength &&
    value.length <= maxLength &&
    (newlines === "allow" || !/[\r\n]/u.test(value))
  );
}

function validateTextFieldContent(
  field: ManagedTextField,
  content: ManagedSiteContentValue,
): void {
  if (
    (content.type !== "plain_text" && content.type !== "heading_text") ||
    !validatesText(content.value, field.constraints)
  ) {
    fail("FIELD_VALUE_TEXT", "Text violates its field constraints");
  }
}

function validateRichTextFieldContent(
  field: Extract<ManagedValueField, { type: "rich_text" }>,
  content: ManagedSiteContentValue,
): void {
  if (content.type !== "rich_text") {
    fail("FIELD_VALUE_IDENTITY", "Content value does not match its field descriptor");
  }
  const document = parseManagedRichTextDocument(content.value);
  if (!validateRichText(field, document)) {
    fail("FIELD_VALUE_RICH_TEXT", "Rich text violates its field constraints");
  }
}

function validateLinkFieldContent(
  field: Extract<ManagedValueField, { type: "link" }>,
  content: ManagedSiteContentValue,
): void {
  if (content.type !== "link") {
    fail("FIELD_VALUE_IDENTITY", "Content value does not match its field descriptor");
  }
  const labelValid = validatesText(content.value.label, field.constraints.labelConstraints);
  const targetValid = field.constraints.allowedTargets.includes(content.value.target);
  if (!labelValid || !targetValid || !isAllowedDestination(content.value.destination, field.constraints)) {
    fail("FIELD_VALUE_LINK", "Link violates its field constraints");
  }
}

export function validateParsedManagedFieldValue(
  field: ManagedValueField,
  content: ManagedSiteContentValue,
): void {
  if (field.id !== content.fieldId || field.type !== content.type) {
    fail("FIELD_VALUE_IDENTITY", "Content value does not match its field descriptor");
  }
  switch (field.type) {
    case "internal_protected":
      if (
        content.type !== "internal_protected" ||
        content.valueType !== field.valueType
      ) {
        fail(
          "FIELD_VALUE_IDENTITY",
          "Protected content does not match its item descriptor",
        );
      }
      return;
    case "plain_text":
    case "heading_text":
      return validateTextFieldContent(field, content);
    case "rich_text":
      return validateRichTextFieldContent(field, content);
    case "link":
      return validateLinkFieldContent(field, content);
    case "image":
    case "collection":
      return;
  }
}

export function validateParsedManagedCollectionValue(
  descriptor: ManagedCollectionDescriptor,
  content: ManagedSiteContentValue,
): void {
  if (content.type !== "collection") {
    fail("COLLECTION_VALUE_TYPE", "Expected a collection content value");
  }
  const ids = content.value.orderedItemIds;
  const withinBounds = ids.length >= descriptor.minItems && ids.length <= descriptor.maxItems;
  if (!withinBounds || new Set(ids).size !== ids.length) {
    fail("COLLECTION_VALUE_POLICY", "Collection item IDs violate collection policy");
  }
}

export function validateManagedFieldValue(
  fieldInput: unknown,
  valueInput: unknown,
): ManagedSiteContentValue {
  const field = parseManagedFieldDescriptor(fieldInput);
  const content = parseManagedSiteContentValue(valueInput);
  validateParsedManagedFieldValue(field, content);
  return content;
}

export function validateManagedCollectionValue(
  descriptorInput: unknown,
  valueInput: unknown,
): ManagedSiteContentValue {
  const descriptor: ManagedCollectionDescriptor = parseManagedCollectionDescriptor(descriptorInput);
  const content = parseManagedSiteContentValue(valueInput);
  validateParsedManagedCollectionValue(descriptor, content);
  return content;
}

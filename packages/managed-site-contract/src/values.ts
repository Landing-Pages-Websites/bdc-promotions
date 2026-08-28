import * as z from "zod";

import { ManagedSiteContractError } from "./errors.js";
import type { DeepReadonly } from "./deep-readonly.js";
import { parseStableId, type StableId, type StableIdKind } from "./ids.js";
import { HARD_MAX_JSON_DEPTH, type JsonValue } from "./json.js";
import { withManagedSiteJsonSchemaSemantic } from "./schema-semantics.js";
import { parseSchemaInput } from "./schema-input.js";
import {
  parseJsonPointer,
  parseRepositoryPath,
  type JsonPointer,
  type RepositoryPath,
} from "./source.js";

const STABLE_ID_SUFFIX = "[0-9a-hjkmnp-tv-z]{25}[048cgmrw]";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;
const SHA256 = /^[a-f0-9]{64}$/;
const MAX_JSON_SCHEMA_DEPTH = 8;
export const MAX_LINK_LABEL_CHARACTERS = 2_000;
export const MAX_URL_VALUE_CHARACTERS = 2_048;

function accepts(check: () => unknown): boolean {
  try {
    check();
    return true;
  } catch {
    return false;
  }
}

export function stableIdSchema<Kind extends StableIdKind>(
  kind: Kind,
): z.ZodType<StableId<Kind>> {
  const pattern = new RegExp(`^${kind}_${STABLE_ID_SUFFIX}$`);
  return z
    .string()
    .regex(pattern)
    .refine((value) =>
      accepts(() => parseStableId(value, kind)),
    ) as unknown as z.ZodType<StableId<Kind>>;
}

export const repositoryPathSchema = z.stringFormat(
  "gomega-repository-path-v1",
  (value) => accepts(() => parseRepositoryPath(value)),
) as unknown as z.ZodType<RepositoryPath>;

export const jsonPointerSchema = z.stringFormat(
  "gomega-json-pointer-v1",
  (value) => accepts(() => parseJsonPointer(value)),
) as unknown as z.ZodType<JsonPointer>;

function isJsonPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isJsonValueWithinDepth(value: unknown, remainingDepth: number): boolean {
  if (isJsonPrimitive(value)) return true;
  if (value === null || remainingDepth === 0 || typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.every((child) =>
      isJsonValueWithinDepth(child, remainingDepth - 1),
    );
  }
  return Object.keys(value).every((key) => {
    const child = Object.getOwnPropertyDescriptor(value, key)?.value;
    return isJsonValueWithinDepth(child, remainingDepth - 1);
  });
}

function jsonValueSchemaAtDepth(maxDepth: number): z.ZodType<JsonValue> {
  return z.custom<JsonValue>((value) => isJsonValueWithinDepth(value, maxDepth));
}

export const opaqueJsonValueSchema = withManagedSiteJsonSchemaSemantic(
  "opaque-json",
  jsonValueSchemaAtDepth(HARD_MAX_JSON_DEPTH),
);
export const boundedJsonValueSchema = withManagedSiteJsonSchemaSemantic(
  "bounded-json-depth-8",
  jsonValueSchemaAtDepth(MAX_JSON_SCHEMA_DEPTH),
);

export const managedPresentationSchema = withManagedSiteJsonSchemaSemantic(
  "presentation",
  z.strictObject({
    name: z.string().min(1).max(160),
    description: z.string().min(1).max(1_000).nullable(),
    group: z.string().min(1).max(160),
    order: z.number().int(),
    example: boundedJsonValueSchema.nullable(),
  }),
);

export const jsonPointerSourceResolverSchema = z.strictObject({
  kind: z.literal("json_pointer"),
  path: repositoryPathSchema,
  pointer: jsonPointerSchema,
});

export const managedFieldUsageSchema = z.strictObject({
  pageId: stableIdSchema("page"),
  itemId: stableIdSchema("item").nullable(),
});

export const managedLinkTargetSchema = z.enum(["same_window", "new_window"]);

function validateExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      !CONTROL_CHARACTERS.test(value) &&
      !value.includes("#") &&
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}

export const absoluteHttpsUrlSchema = withManagedSiteJsonSchemaSemantic(
  "absolute-https-url",
  z
    .url()
    .refine(validateExternalUrl, "URL must be absolute HTTPS without credentials or hash"),
);

/**
 * The bound an internal-SEO `url` value is held to, parseable on its own, so a
 * tool that collects a canonical URL from an operator can refuse "not-a-url"
 * where the operator wrote it rather than three stages later.
 */
const managedAbsoluteHttpsUrlValueSchema = absoluteHttpsUrlSchema.max(MAX_URL_VALUE_CHARACTERS);

export function parseManagedAbsoluteHttpsUrl(input: unknown): string {
  return parseSchemaInput(managedAbsoluteHttpsUrlValueSchema, input) as string;
}

const STATIC_ROUTE_PATTERN = /^\/(?:[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*)?$/;
const GENERATED_SEGMENT_PATTERN = /^\[[A-Za-z][A-Za-z0-9_]*\]$/;
const STATIC_SEGMENT_PATTERN = /^[A-Za-z0-9._~-]+$/;

export function isManagedGeneratedRouteSegment(value: string): boolean {
  return GENERATED_SEGMENT_PATTERN.test(value);
}

function hasCanonicalRouteSegments(value: string, allowGenerated: boolean): boolean {
  if (value === "/") return !allowGenerated;
  const segments = value.slice(1).split("/");
  const validSegments = segments.every((segment) =>
    segment !== "." &&
    segment !== ".." &&
    (STATIC_SEGMENT_PATTERN.test(segment) ||
      (allowGenerated && isManagedGeneratedRouteSegment(segment))),
  );
  return (
    validSegments &&
    (!allowGenerated || segments.some(isManagedGeneratedRouteSegment))
  );
}

export const managedStaticRoutePathSchema = withManagedSiteJsonSchemaSemantic(
  "static-route",
  z
    .string()
    .max(2_048)
    .regex(STATIC_ROUTE_PATTERN)
    .refine((value) => hasCanonicalRouteSegments(value, false)),
);

export const managedGeneratedRoutePatternSchema = withManagedSiteJsonSchemaSemantic(
  "generated-route",
  z
    .string()
    .min(1)
    .max(2_048)
    .regex(/^\/(?!\/)[^/]+(?:\/[^/]+)*$/)
    .refine((value) => hasCanonicalRouteSegments(value, true)),
);

export const managedFragmentSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

export const managedLinkDestinationSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("internal"),
    pageId: stableIdSchema("page"),
    fragment: managedFragmentSchema.nullable(),
  }),
  z.strictObject({ kind: z.literal("external"), url: absoluteHttpsUrlSchema }),
  z.strictObject({ kind: z.literal("email"), address: z.email() }),
  z.strictObject({ kind: z.literal("phone"), number: z.string().regex(/^\+[1-9]\d{7,14}$/) }),
]);

export const managedImageMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const normalizedRectSchema = z
  .strictObject({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .refine((rect) => rect.x + rect.width <= 1 && rect.y + rect.height <= 1);

export const managedImageValueSchema = z.strictObject({
  path: repositoryPathSchema,
  sha256: z.string().regex(SHA256),
  mimeType: managedImageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
  altText: z.string().max(2_000).nullable(),
  crop: normalizedRectSchema.nullable(),
  focalPoint: z
    .strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
    .nullable(),
});

const managedAssetSemanticsSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("decorative") }),
  z.strictObject({ kind: z.literal("informative") }),
  z.strictObject({ kind: z.literal("fixed_alt"), altText: z.string().min(1).max(2_000) }),
]);

const assetPolicySchema = z.enum(["forbidden", "optional", "required"]);
const aspectRatioSchema = z.strictObject({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

function hasUniqueStrings(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export const managedAssetSlotDescriptorSchema = withManagedSiteJsonSchemaSemantic(
  "asset-slot",
  z.strictObject({
    id: stableIdSchema("asset"),
    presentation: managedPresentationSchema,
    semantics: managedAssetSemanticsSchema,
    acceptedMimeTypes: z.array(managedImageMimeTypeSchema).min(1),
    outputMimeTypes: z.array(managedImageMimeTypeSchema).min(1),
    minWidth: z.number().int().positive(),
    maxWidth: z.number().int().positive(),
    minHeight: z.number().int().positive(),
    maxHeight: z.number().int().positive(),
    aspectRatios: z.array(aspectRatioSchema).min(1),
    cropPolicy: assetPolicySchema,
    focalPointPolicy: assetPolicySchema,
    maxBytes: z.number().int().positive(),
  }).superRefine((slot, context) => {
    const dimensionsValid =
      slot.minWidth <= slot.maxWidth && slot.minHeight <= slot.maxHeight;
    const mimeTypesUnique =
      hasUniqueStrings(slot.acceptedMimeTypes) && hasUniqueStrings(slot.outputMimeTypes);
    const ratiosUnique =
      new Set(slot.aspectRatios.map(({ width, height }) => width / height)).size ===
      slot.aspectRatios.length;
    if (!dimensionsValid || !mimeTypesUnique || !ratiosUnique) {
      context.addIssue({ code: "custom", message: "Asset slot constraints conflict" });
    }
  }),
);

export type ManagedPresentation = DeepReadonly<z.infer<typeof managedPresentationSchema>>;
export type JsonPointerSourceResolver = DeepReadonly<z.infer<
  typeof jsonPointerSourceResolverSchema
>>;
export type ManagedFieldUsage = DeepReadonly<z.infer<typeof managedFieldUsageSchema>>;
export type ManagedLinkDestination = DeepReadonly<z.infer<typeof managedLinkDestinationSchema>>;
export type ManagedLinkTarget = z.infer<typeof managedLinkTargetSchema>;
export type ManagedImageValue = DeepReadonly<z.infer<typeof managedImageValueSchema>>;
export type ManagedAssetSlotDescriptor = DeepReadonly<z.infer<
  typeof managedAssetSlotDescriptorSchema
>>;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function parseAssetSlot(input: unknown): ManagedAssetSlotDescriptor {
  return parseSchemaInput(managedAssetSlotDescriptorSchema, input);
}

export function parseManagedImageValueInput(input: unknown): ManagedImageValue {
  return parseSchemaInput(managedImageValueSchema, input);
}

function policyAllows(
  policy: "forbidden" | "optional" | "required",
  value: unknown,
): boolean {
  if (policy === "required") return value !== null;
  if (policy === "forbidden") return value === null;
  return true;
}

function matchesAspectRatio(slot: ManagedAssetSlotDescriptor, image: ManagedImageValue): boolean {
  return slot.aspectRatios.some(
    (ratio) => image.width * ratio.height === image.height * ratio.width,
  );
}

function hasValidAlt(slot: ManagedAssetSlotDescriptor, image: ManagedImageValue): boolean {
  if (slot.semantics.kind === "decorative") return image.altText === "";
  if (slot.semantics.kind === "fixed_alt") return image.altText === null;
  return image.altText !== null && image.altText.trim().length > 0;
}

export function validateManagedImageValue(
  slotInput: unknown,
  imageInput: unknown,
): ManagedImageValue {
  const slot = parseAssetSlot(slotInput);
  const image = parseManagedImageValueInput(imageInput);
  const dimensionsValid =
    image.width >= slot.minWidth &&
    image.width <= slot.maxWidth &&
    image.height >= slot.minHeight &&
    image.height <= slot.maxHeight;
  const mimeValid = slot.outputMimeTypes.includes(image.mimeType);
  const policiesValid =
    policyAllows(slot.cropPolicy, image.crop) &&
    policyAllows(slot.focalPointPolicy, image.focalPoint);
  if (
    !dimensionsValid ||
    !mimeValid ||
    !matchesAspectRatio(slot, image) ||
    !policiesValid ||
    image.bytes > slot.maxBytes ||
    !hasValidAlt(slot, image)
  ) {
    return fail("IMAGE_VALUE_POLICY", "Image value violates its asset-slot policy");
  }
  return image;
}

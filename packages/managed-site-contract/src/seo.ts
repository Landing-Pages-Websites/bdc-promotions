import * as z from "zod";

import type { DeepReadonly } from "./deep-readonly.js";
import {
  managedFieldCapabilitySchema,
  managedFieldScopeSchema,
  validateManagedFieldScope,
} from "./fields.js";
import { managedInternalValueTypeSchema } from "./internal-value-types.js";
import { parseSchemaInput } from "./schema-input.js";
import {
  absoluteHttpsUrlSchema,
  jsonPointerSourceResolverSchema,
  managedFieldUsageSchema,
  managedPresentationSchema,
  managedStaticRoutePathSchema,
  stableIdSchema,
} from "./values.js";

export const managedInternalProtectedFieldSchema = z.strictObject({
  id: stableIdSchema("field"),
  scope: managedFieldScopeSchema,
  type: z.literal("internal_protected"),
  classification: z.literal("internal_protected"),
  capabilities: z.array(managedFieldCapabilitySchema).length(0),
  valueType: managedInternalValueTypeSchema,
  semantic: z.string().min(1).max(256),
  resolver: jsonPointerSourceResolverSchema,
  usages: z.array(managedFieldUsageSchema).min(1),
  presentation: managedPresentationSchema,
}).superRefine(validateManagedFieldScope);

const fieldId = stableIdSchema("field");
const nullableFieldId = fieldId.nullable();

const managedBusinessIdentitySchema = z.strictObject({
  legalName: fieldId,
  displayName: fieldId,
  telephone: fieldId,
  postalAddress: fieldId,
  email: nullableFieldId,
  geo: nullableFieldId,
  openingHours: nullableFieldId,
  sameAs: nullableFieldId,
});

const managedPageIntentSchema = z.strictObject({
  purpose: z.enum([
    "home",
    "service",
    "location",
    "service_location",
    "about",
    "contact",
    "article",
    "landing",
    "legal",
    "other",
  ]),
  primaryEntity: fieldId,
  services: z.array(fieldId),
  locations: z.array(fieldId),
});

const managedMetadataSchema = z.strictObject({
  title: fieldId,
  description: fieldId,
  canonical: fieldId,
  indexing: fieldId,
  social: z.strictObject({
    title: nullableFieldId,
    description: nullableFieldId,
    image: stableIdSchema("asset").nullable(),
  }),
});

const managedJsonLdDeclarationSchema = z.strictObject({
  schemaType: z.string().min(1).max(160),
  required: z.boolean(),
  sourceFieldIds: z.array(fieldId).min(1),
  requiredOutputProperties: z.array(z.string().min(1).max(160)).min(1),
});

const managedGeneratedMetadataSchema = z.strictObject({
  title: fieldId,
  description: fieldId,
  canonical: fieldId,
  indexing: fieldId,
  social: z.strictObject({
    title: nullableFieldId,
    description: nullableFieldId,
    imageFieldId: nullableFieldId,
  }),
});

const managedGeneratedJsonLdDeclarationSchema = z
  .strictObject({
    schemaType: z.string().min(1).max(160),
    required: z.boolean(),
    itemSourceFieldIds: z.array(fieldId),
    siteSourceFieldIds: z.array(fieldId),
    requiredOutputProperties: z.array(z.string().min(1).max(160)).min(1),
  })
  .refine(
    (declaration) =>
      declaration.itemSourceFieldIds.length +
        declaration.siteSourceFieldIds.length >
      0,
  );

const managedSitemapSchema = z.strictObject({
  included: z.boolean(),
  changeFrequency: z.enum([
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
  ]),
  priority: z.number().min(0).max(1),
});

const managedPerformanceBudgetSchema = z.strictObject({
  maxLcpMilliseconds: z.number().int().positive(),
  maxCls: z.number().min(0).max(1),
  maxInpMilliseconds: z.number().int().positive(),
  maxPageBytes: z.number().int().positive(),
});

const managedSharedPageSeoShape = {
  intent: managedPageIntentSchema,
  headingOutline: z.array(
    z.strictObject({ fieldId, semanticLevel: z.number().int().min(1).max(6) }),
  ),
  breadcrumbParentPageId: stableIdSchema("page").nullable(),
  internalLinks: z.strictObject({
    requiredPageIds: z.array(stableIdSchema("page")),
    minimumInboundLinks: z.number().int().nonnegative(),
  }),
  sitemap: managedSitemapSchema,
  performanceBudget: managedPerformanceBudgetSchema,
};

const managedPageSeoSchema = z.strictObject({
  pageId: stableIdSchema("page"),
  ...managedSharedPageSeoShape,
  metadata: managedMetadataSchema,
  jsonLd: z.array(managedJsonLdDeclarationSchema),
  primaryImageAssetSlotId: stableIdSchema("asset").nullable(),
});

export const managedGeneratedPageSeoSchema = z.strictObject({
  pageId: stableIdSchema("page"),
  collectionId: stableIdSchema("collection"),
  ...managedSharedPageSeoShape,
  metadata: managedGeneratedMetadataSchema,
  jsonLd: z.array(managedGeneratedJsonLdDeclarationSchema),
  primaryImageFieldId: nullableFieldId,
});

const managedRedirectDestinationSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("page"), pageId: stableIdSchema("page") }),
  z.strictObject({ kind: z.literal("external"), url: absoluteHttpsUrlSchema }),
]);

const managedRedirectSchema = z.strictObject({
  fromPath: managedStaticRoutePathSchema,
  destination: managedRedirectDestinationSchema,
  status: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]),
  preserveQuery: z.boolean(),
});

export const managedSiteSeoDescriptorSchema = z.strictObject({
  protectedFields: z.array(managedInternalProtectedFieldSchema),
  businessIdentity: managedBusinessIdentitySchema,
  pages: z.array(managedPageSeoSchema),
  generatedPages: z.array(managedGeneratedPageSeoSchema),
  redirects: z.array(managedRedirectSchema),
});

export type ManagedInternalProtectedField = DeepReadonly<z.infer<
  typeof managedInternalProtectedFieldSchema
>>;
export type ManagedGeneratedPageSeoDescriptor = DeepReadonly<z.infer<
  typeof managedGeneratedPageSeoSchema
>>;
export type ManagedSiteSeoDescriptor = DeepReadonly<z.infer<
  typeof managedSiteSeoDescriptorSchema
>>;

export function parseManagedInternalProtectedField(
  input: unknown,
): ManagedInternalProtectedField {
  return parseSchemaInput(managedInternalProtectedFieldSchema, input);
}

export function parseManagedSiteSeoDescriptor(
  input: unknown,
): ManagedSiteSeoDescriptor {
  return parseSchemaInput(managedSiteSeoDescriptorSchema, input);
}

import * as z from "zod";

import type { DeepReadonly } from "./deep-readonly.js";
import {
  managedCollectionDescriptorSchema,
  managedFieldDescriptorSchema,
} from "./fields.js";
import { parseSchemaInput } from "./schema-input.js";
import {
  MANAGED_SITE_ROOT_SEMANTICS,
  withManagedSiteJsonSchemaSemantic,
} from "./schema-semantics.js";
import { managedSiteSeoDescriptorSchema } from "./seo.js";
import {
  managedGeneratedRoutePatternSchema,
  managedAssetSlotDescriptorSchema,
  managedPresentationSchema,
  managedStaticRoutePathSchema,
  stableIdSchema,
} from "./values.js";

export const managedSiteAdapterDescriptorSchema = z.strictObject({
  kind: z.enum(["nextjs", "astro"]),
  adapterVersion: z.literal("1.0"),
});

const managedSiteBridgeDeliverySchema = z.strictObject({
  version: z.literal("v6"),
  src: z.literal("https://app.gomega.ai/review-bridge/v6/review-bridge.js"),
  integrity: z.string().regex(/^sha384-[A-Za-z0-9+/]{64}$/),
  crossOrigin: z.literal("anonymous"),
  load: z.literal("head_defer"),
});

export const managedSiteBridgeDescriptorSchema = z.strictObject({
  reviewProtocol: z.literal(1),
  editProtocol: z.literal(2),
  annotationVersion: z.literal(1),
  delivery: managedSiteBridgeDeliverySchema,
  framing: z.literal("authenticated_preview_gateway"),
});

export const managedPageRouteSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("static"), path: managedStaticRoutePathSchema }),
  z.strictObject({
    kind: z.literal("generated"),
    pattern: managedGeneratedRoutePatternSchema,
    collectionId: stableIdSchema("collection"),
    routeKeyFieldId: stableIdSchema("field"),
  }),
]);

export const managedSectionDescriptorSchema = z.strictObject({
  id: stableIdSchema("section"),
  presentation: managedPresentationSchema,
  fields: z.array(managedFieldDescriptorSchema),
});

export const managedPageDescriptorSchema = z.strictObject({
  id: stableIdSchema("page"),
  presentation: managedPresentationSchema,
  route: managedPageRouteSchema,
  sections: z.array(managedSectionDescriptorSchema),
});

export const managedAtomicAliasGroupSchema = z.strictObject({
  id: stableIdSchema("alias"),
  fieldIds: z.array(stableIdSchema("field")).min(1),
});

const anyStableIdSchema = z.union([
  stableIdSchema("contract"),
  stableIdSchema("page"),
  stableIdSchema("section"),
  stableIdSchema("field"),
  stableIdSchema("collection"),
  stableIdSchema("item"),
  stableIdSchema("asset"),
  stableIdSchema("alias"),
]);

export const managedSiteContractV1Schema = withManagedSiteJsonSchemaSemantic(
  MANAGED_SITE_ROOT_SEMANTICS.ManagedSiteContractV1,
  z.strictObject({
    schemaVersion: z.literal("1.0"),
    contractId: stableIdSchema("contract"),
    adapter: managedSiteAdapterDescriptorSchema,
    bridge: managedSiteBridgeDescriptorSchema,
    pages: z.array(managedPageDescriptorSchema),
    collections: z.array(managedCollectionDescriptorSchema),
    assets: z.array(managedAssetSlotDescriptorSchema),
    internalSeo: managedSiteSeoDescriptorSchema,
    atomicAliasGroups: z.array(managedAtomicAliasGroupSchema),
    tombstonedIds: z.array(anyStableIdSchema),
  }),
);

export type ManagedSiteAdapterDescriptor = DeepReadonly<z.infer<
  typeof managedSiteAdapterDescriptorSchema
>>;
export type ManagedSiteBridgeDescriptor = DeepReadonly<z.infer<
  typeof managedSiteBridgeDescriptorSchema
>>;
export type ManagedPageRoute = DeepReadonly<z.infer<typeof managedPageRouteSchema>>;
export type ManagedSectionDescriptor = DeepReadonly<z.infer<
  typeof managedSectionDescriptorSchema
>>;
export type ManagedPageDescriptor = DeepReadonly<z.infer<typeof managedPageDescriptorSchema>>;
export type ManagedAtomicAliasGroup = DeepReadonly<z.infer<
  typeof managedAtomicAliasGroupSchema
>>;
export type ManagedSiteContractV1 = DeepReadonly<z.infer<typeof managedSiteContractV1Schema>>;

export function parseManagedSiteContractV1(input: unknown): ManagedSiteContractV1 {
  return parseSchemaInput(managedSiteContractV1Schema, input);
}

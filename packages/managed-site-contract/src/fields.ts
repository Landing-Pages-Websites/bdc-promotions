import * as z from "zod";

import type { DeepReadonly } from "./deep-readonly.js";
import { managedRichTextMarkSchema } from "./rich-text.js";
import { withManagedSiteJsonSchemaSemantic } from "./schema-semantics.js";
import { parseSchemaInput } from "./schema-input.js";
import {
  jsonPointerSchema,
  jsonPointerSourceResolverSchema,
  MAX_LINK_LABEL_CHARACTERS,
  managedFieldUsageSchema,
  managedFragmentSchema,
  managedLinkTargetSchema,
  managedPresentationSchema,
  stableIdSchema,
} from "./values.js";

export const MANAGED_FIELD_CAPABILITIES = Object.freeze([
  "text.edit",
  "rich_text.mark.bold",
  "rich_text.mark.italic",
  "rich_text.link.edit",
  "link.label.edit",
  "link.destination.edit",
  "link.target.edit",
  "image.upload",
  "image.crop",
  "image.focal_point.edit",
  "image.alt.edit",
  "collection.reorder",
  "collection.add",
  "collection.remove",
] as const);

export const managedFieldCapabilitySchema = z.enum(MANAGED_FIELD_CAPABILITIES);
export const managedContentClassificationSchema = z.enum([
  "customer_editable",
  "internal_protected",
  "code_owned_interface",
]);
export const managedRenderedClassificationSchema =
  managedContentClassificationSchema.exclude(["internal_protected"]);

const capabilitySchema = z.array(managedFieldCapabilitySchema);
const textConstraintsSchema = z
  .strictObject({
    minLength: z.number().int().nonnegative(),
    maxLength: z.number().int().positive().max(131_072),
    newlines: z.enum(["forbid", "allow"]),
  })
  .refine((constraints) => constraints.minLength <= constraints.maxLength);
const linkLabelConstraintsSchema = textConstraintsSchema.refine(
  (constraints) => constraints.maxLength <= MAX_LINK_LABEL_CHARACTERS,
);

const commonFieldShape = {
  id: stableIdSchema("field"),
  classification: managedRenderedClassificationSchema,
  capabilities: capabilitySchema,
  resolver: jsonPointerSourceResolverSchema,
  usages: z.array(managedFieldUsageSchema).min(1),
  presentation: managedPresentationSchema,
};

const commonItemFieldShape = {
  id: stableIdSchema("field"),
  classification: managedRenderedClassificationSchema,
  capabilities: capabilitySchema,
  itemPointer: jsonPointerSchema,
  presentation: managedPresentationSchema,
};

const plainTextShape = {
  type: z.literal("plain_text"),
  semantic: z.enum(["body", "label", "caption", "address", "phone", "email", "legal"]),
  constraints: textConstraintsSchema,
};

const headingTextShape = {
  type: z.literal("heading_text"),
  semanticLevel: z.number().int().min(1).max(6),
  constraints: textConstraintsSchema,
};

const uniqueHostsSchema = z
  .array(z.hostname().refine((host) => host === host.toLowerCase()))
  .refine(hasUniqueValues);

const richTextConstraintsSchema = z
  .strictObject({
    maxCharacters: z.number().int().positive().max(131_072),
    maxNodes: z.number().int().positive().max(2_000),
    allowedBlocks: z.array(z.enum(["paragraph", "bullet_list", "ordered_list"])).min(1),
    allowedMarks: z.array(managedRichTextMarkSchema),
    allowLinks: z.boolean(),
    allowedExternalHosts: uniqueHostsSchema,
    allowedTargets: z.array(managedLinkTargetSchema),
  })
  .superRefine((constraints, context) => {
    const unique =
      hasUniqueValues(constraints.allowedBlocks) &&
      hasUniqueValues(constraints.allowedMarks) &&
      hasUniqueValues(constraints.allowedTargets);
    if (!unique) {
      context.addIssue({ code: "custom", message: "Rich-text policies must be unique" });
    }
    const disabledLinksDeclarePolicy =
      !constraints.allowLinks &&
      constraints.allowedTargets.length + constraints.allowedExternalHosts.length > 0;
    const enabledLinksHaveNoTarget =
      constraints.allowLinks && constraints.allowedTargets.length === 0;
    if (disabledLinksDeclarePolicy || enabledLinksHaveNoTarget) {
      context.addIssue({ code: "custom", message: "Rich-text link policy conflicts" });
    }
  });

const richTextShape = {
  type: z.literal("rich_text"),
  constraints: richTextConstraintsSchema,
};

const linkConstraintsSchema = z
  .strictObject({
    labelConstraints: linkLabelConstraintsSchema,
    authority: z.enum(["internal_only", "external_only", "internal_or_external"]),
    allowedSchemes: z.array(z.enum(["https", "mailto", "tel"])),
    allowedExternalHosts: uniqueHostsSchema,
    fragmentPolicy: z.enum(["forbid", "declared"]),
    allowedFragments: z.array(managedFragmentSchema),
    allowedTargets: z.array(managedLinkTargetSchema),
  })
  .superRefine((constraints, context) => {
    const unique =
      hasUniqueValues(constraints.allowedSchemes) &&
      hasUniqueValues(constraints.allowedFragments) &&
      hasUniqueValues(constraints.allowedTargets);
    if (!unique) {
      context.addIssue({ code: "custom", message: "Link policies must be unique" });
    }
    if (constraints.fragmentPolicy === "forbid" && constraints.allowedFragments.length > 0) {
      context.addIssue({ code: "custom", message: "Forbidden fragments cannot be declared" });
    }
  });

const linkShape = { type: z.literal("link"), constraints: linkConstraintsSchema };
const imageShape = { type: z.literal("image"), assetSlotId: stableIdSchema("asset") };
const collectionShape = {
  type: z.literal("collection"),
  collectionId: stableIdSchema("collection"),
};

const CAPABILITIES_BY_TYPE = {
  plain_text: ["text.edit"],
  heading_text: ["text.edit"],
  rich_text: [
    "text.edit",
    "rich_text.mark.bold",
    "rich_text.mark.italic",
    "rich_text.link.edit",
  ],
  link: ["link.label.edit", "link.destination.edit", "link.target.edit"],
  image: ["image.upload", "image.crop", "image.focal_point.edit", "image.alt.edit"],
  collection: ["collection.reorder", "collection.add", "collection.remove"],
} as const satisfies Record<string, readonly (typeof MANAGED_FIELD_CAPABILITIES)[number][]>;

type RenderedFieldInput = {
  readonly type: keyof typeof CAPABILITIES_BY_TYPE;
  readonly classification: "customer_editable" | "code_owned_interface";
  readonly capabilities: readonly (typeof MANAGED_FIELD_CAPABILITIES)[number][];
};

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length;
}

function validateCapabilities(field: RenderedFieldInput, context: z.RefinementCtx): void {
  const allowed = new Set<string>(CAPABILITIES_BY_TYPE[field.type]);
  const compatible = field.capabilities.every((capability) => allowed.has(capability));
  const emptyAsRequired =
    field.classification === "customer_editable"
      ? field.capabilities.length > 0
      : field.capabilities.length === 0;
  if (!compatible || !emptyAsRequired || !hasUniqueValues(field.capabilities)) {
    context.addIssue({ code: "custom", message: "Field capabilities conflict with its type" });
  }
}

type RichTextCapabilityField = RenderedFieldInput & {
  readonly type: "rich_text";
  readonly constraints: {
    readonly allowedMarks: readonly ("bold" | "italic")[];
    readonly allowLinks: boolean;
  };
};

function validateRichTextCapabilities(
  field: RenderedFieldInput,
  context: z.RefinementCtx,
): void {
  if (field.type !== "rich_text") return;
  const richField = field as RichTextCapabilityField;
  const requiredMarks = ["bold", "italic"] as const;
  const missingMark = requiredMarks.some(
    (mark) =>
      richField.capabilities.includes(`rich_text.mark.${mark}`) &&
      !richField.constraints.allowedMarks.includes(mark),
  );
  const editableLinksDisabled =
    richField.capabilities.includes("rich_text.link.edit") &&
    !richField.constraints.allowLinks;
  if (missingMark || editableLinksDisabled) {
    context.addIssue({
      code: "custom",
      message: "Rich-text capabilities conflict with its local policy",
    });
  }
}

const plainTextFieldSchema = z.strictObject({ ...commonFieldShape, ...plainTextShape });
const headingTextFieldSchema = z.strictObject({ ...commonFieldShape, ...headingTextShape });
const richTextFieldSchema = z.strictObject({ ...commonFieldShape, ...richTextShape });
const linkFieldSchema = z.strictObject({ ...commonFieldShape, ...linkShape });
const imageFieldSchema = z.strictObject({ ...commonFieldShape, ...imageShape });
const collectionFieldSchema = z.strictObject({ ...commonFieldShape, ...collectionShape });

export const managedFieldDescriptorSchema = withManagedSiteJsonSchemaSemantic(
  "field-descriptor",
  z.discriminatedUnion("type", [
    plainTextFieldSchema,
    headingTextFieldSchema,
    richTextFieldSchema,
    linkFieldSchema,
    imageFieldSchema,
    collectionFieldSchema,
  ]).superRefine((field, context) => {
    validateCapabilities(field, context);
    validateRichTextCapabilities(field, context);
  }),
);

const plainTextItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...plainTextShape });
const headingTextItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...headingTextShape });
const richTextItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...richTextShape });
const linkItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...linkShape });
const imageItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...imageShape });

export const managedCollectionItemFieldSchema = z
  .discriminatedUnion("type", [
    plainTextItemFieldSchema,
    headingTextItemFieldSchema,
    richTextItemFieldSchema,
    linkItemFieldSchema,
    imageItemFieldSchema,
  ])
  .superRefine((field, context) => {
    validateCapabilities(field, context);
    validateRichTextCapabilities(field, context);
  });

const uniquenessRuleSchema = z.strictObject({
  fieldIds: z.array(stableIdSchema("field")).min(1).refine(hasUniqueValues),
  comparison: z.enum(["exact", "case_folded"]),
});

export const managedCollectionDescriptorSchema = withManagedSiteJsonSchemaSemantic(
  "collection-descriptor",
  z.strictObject({
    id: stableIdSchema("collection"),
    presentation: managedPresentationSchema,
    resolver: jsonPointerSourceResolverSchema,
    itemIdPointer: jsonPointerSchema,
    itemIdPolicy: z.literal("server_minted"),
    minItems: z.number().int().nonnegative().max(500),
    maxItems: z.number().int().positive().max(500),
    itemFields: z.array(managedCollectionItemFieldSchema).min(1),
    uniqueness: z.array(uniquenessRuleSchema),
    deletion: z.strictObject({
      whenReferenced: z.enum(["restrict", "cascade"]),
      restorable: z.boolean(),
    }),
  }).refine((collection) => collection.minItems <= collection.maxItems),
);

export type ManagedFieldCapability = z.infer<typeof managedFieldCapabilitySchema>;
export type ManagedContentClassification = z.infer<typeof managedContentClassificationSchema>;
export type ManagedFieldDescriptor = DeepReadonly<z.infer<typeof managedFieldDescriptorSchema>>;
export type ManagedCollectionItemField = DeepReadonly<z.infer<
  typeof managedCollectionItemFieldSchema
>>;
export type ManagedCollectionDescriptor = DeepReadonly<z.infer<
  typeof managedCollectionDescriptorSchema
>>;

export function parseManagedFieldDescriptor(input: unknown): ManagedFieldDescriptor {
  return parseSchemaInput(managedFieldDescriptorSchema, input);
}

export function parseManagedCollectionDescriptor(
  input: unknown,
): ManagedCollectionDescriptor {
  return parseSchemaInput(managedCollectionDescriptorSchema, input);
}

import * as z from "zod";

import type { DeepReadonly } from "./deep-readonly.js";
import { managedInternalValueTypeSchema } from "./internal-value-types.js";
import {
  MANAGED_RICH_TEXT_BLOCK_KINDS,
  MANAGED_RICH_TEXT_MAX_HARD_BREAKS,
  managedRichTextMarkKindSchema,
} from "./rich-text.js";
import { withManagedSiteJsonSchemaSemantic } from "./schema-semantics.js";
import {
  isSupportedManagedTextTemplateLocale,
  MANAGED_TEXT_TEMPLATE_MAX_INTEGER_DIGITS,
  MANAGED_TEXT_TEMPLATE_MAX_PLACEHOLDERS,
  MANAGED_TEXT_TEMPLATE_PLACEHOLDER_NAME,
  MANAGED_TEXT_TEMPLATE_PLURAL_CATEGORIES,
  managedTextTemplatePluralCategories,
  managedTextTemplateToken,
  type ManagedTextTemplateV1,
} from "./text-template.js";
import {
  MANAGED_ATTRIBUTE_TEXT_SEMANTICS,
  MANAGED_TEXT_ATTRIBUTES,
  MAX_MANAGED_ATTRIBUTE_TEXT_CHARACTERS,
} from "./attribute-text.js";
import { parseSchemaInput } from "./schema-input.js";
import {
  jsonPointerSchema,
  jsonPointerSourceResolverSchema,
  MAX_LINK_LABEL_CHARACTERS,
  managedFieldUsageSchema,
  managedFragmentSchema,
  managedLinkQueryNameSchema,
  managedLinkQueryValueSchema,
  managedLinkTargetSchema,
  managedPresentationSchema,
  MAX_MANAGED_LINK_QUERY_PARAMETERS,
  stableIdSchema,
  type ManagedFieldUsage,
} from "./values.js";

export const MANAGED_FIELD_SCOPES = Object.freeze(["site", "page"] as const);
export const managedFieldScopeSchema = z.enum(MANAGED_FIELD_SCOPES);

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
  "icon.choose",
  "toggle.set",
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
const textConstraintsShape = {
  minLength: z.number().int().nonnegative(),
  maxLength: z.number().int().positive().max(131_072),
  newlines: z.enum(["forbid", "allow"]),
};

function lengthsOrdered(constraints: { readonly minLength: number; readonly maxLength: number }): boolean {
  return constraints.minLength <= constraints.maxLength;
}

const textConstraintsSchema = z.strictObject(textConstraintsShape).refine(lengthsOrdered);
const linkLabelConstraintsSchema = textConstraintsSchema.refine(
  (constraints) => constraints.maxLength <= MAX_LINK_LABEL_CHARACTERS,
);

/**
 * The constraint bounds, parseable on their own.
 *
 * A migration tool takes these limits from an operator long before any field
 * descriptor exists, and would otherwise have to restate the maxima and the
 * minimum-below-maximum rule to check them at its own boundary. A restatement
 * drifts; this parses the same schema the descriptor is held to, so a limit that
 * loads there cannot fail here.
 */
export type ManagedTextConstraints = DeepReadonly<z.infer<typeof textConstraintsSchema>>;
export type ManagedRichTextConstraints = DeepReadonly<
  z.infer<typeof richTextConstraintsSchema>
>;

export function parseManagedTextConstraints(input: unknown): ManagedTextConstraints {
  return parseSchemaInput(textConstraintsSchema, input);
}

export function parseManagedLinkLabelConstraints(input: unknown): ManagedTextConstraints {
  return parseSchemaInput(linkLabelConstraintsSchema, input);
}

export function parseManagedRichTextConstraints(input: unknown): ManagedRichTextConstraints {
  return parseSchemaInput(richTextConstraintsSchema, input);
}

const commonFieldShape = {
  id: stableIdSchema("field"),
  scope: managedFieldScopeSchema,
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

const internalProtectedItemFieldSchema = z.strictObject({
  id: stableIdSchema("field"),
  type: z.literal("internal_protected"),
  classification: z.literal("internal_protected"),
  capabilities: z.array(managedFieldCapabilitySchema).length(0),
  valueType: managedInternalValueTypeSchema,
  semantic: z.string().min(1).max(256),
  itemPointer: jsonPointerSchema,
  presentation: managedPresentationSchema,
});

/**
 * A page's search title and description as ordinary customer-editable text.
 * Where such a field may sit, and which metadata may name it, is decided in
 * `contract-semantics-seo-metadata.ts`; what its value may hold, in `content.ts`.
 */
export const MANAGED_SEO_TEXT_SEMANTICS = Object.freeze(["seo_title", "seo_description"] as const);
export type ManagedSeoTextSemantic = (typeof MANAGED_SEO_TEXT_SEMANTICS)[number];

/**
 * The most characters a contract may let a customer put in a search title or
 * description. Generous on purpose: a faithful conversion keeps a shipped value
 * as long as it already is (All Points Media's /privacy description is 216),
 * and a shorter length is the editor's recommendation, not this contract's rule.
 */
export const MAX_MANAGED_SEO_TEXT_CHARACTERS = 320;

export function isManagedSeoTextSemantic(semantic: string): semantic is ManagedSeoTextSemantic {
  return (MANAGED_SEO_TEXT_SEMANTICS as readonly string[]).includes(semantic);
}

const plainTextSemanticSchema = z.enum([
  "body",
  "label",
  "caption",
  "address",
  "phone",
  "email",
  "legal",
  ...MANAGED_SEO_TEXT_SEMANTICS,
]);

/** What a plain-text field means to a reader, read from the schema. */
export const MANAGED_PLAIN_TEXT_SEMANTICS = Object.freeze([...plainTextSemanticSchema.options]);
export type ManagedPlainTextSemantic = (typeof MANAGED_PLAIN_TEXT_SEMANTICS)[number];

const textTemplatePlaceholderSchema = z.strictObject({
  name: z.string().regex(MANAGED_TEXT_TEMPLATE_PLACEHOLDER_NAME),
  minimumIntegerDigits: z.number().int().min(1).max(MANAGED_TEXT_TEMPLATE_MAX_INTEGER_DIGITS),
  grouping: z.boolean(),
});

/**
 * Text whose words are the customer's and whose numbers are the site's (see
 * `text-template.ts`). The locale must be canonical and one this runtime
 * formats and pluralizes in, the placeholders distinct, and a plural form's
 * category one the locale can select, so a declaration cannot name a form no
 * number would ever show.
 */
const textTemplateSchema = z
  .strictObject({
    locale: z.string().min(2).max(35),
    placeholders: z
      .array(textTemplatePlaceholderSchema)
      .min(1)
      .max(MANAGED_TEXT_TEMPLATE_MAX_PLACEHOLDERS),
    plural: z
      .strictObject({
        placeholder: z.string().regex(MANAGED_TEXT_TEMPLATE_PLACEHOLDER_NAME),
        category: z.enum(MANAGED_TEXT_TEMPLATE_PLURAL_CATEGORIES),
      })
      .nullable(),
  })
  .superRefine((template, context) => {
    const names = template.placeholders.map((placeholder) => placeholder.name);
    if (!hasUniqueValues(names)) {
      context.addIssue({ code: "custom", message: "Template placeholders must be unique" });
    }
    if (!isSupportedManagedTextTemplateLocale(template.locale)) {
      context.addIssue({ code: "custom", message: "Template locale is not supported" });
      return;
    }
    const { plural } = template;
    if (plural === null) return;
    const selectable = managedTextTemplatePluralCategories(template.locale).includes(plural.category);
    if (!names.includes(plural.placeholder) || !selectable) {
      context.addIssue({ code: "custom", message: "Template plural conflicts with its placeholders or locale" });
    }
  });

// The renderer's types are written by hand so a client bundle needs no zod;
// these fail to compile if the schema and those types ever say different things.
type ParsedTextTemplate = DeepReadonly<z.infer<typeof textTemplateSchema>>;
const templateTypesAgree: [
  ParsedTextTemplate extends ManagedTextTemplateV1 ? true : false,
  ManagedTextTemplateV1 extends ParsedTextTemplate ? true : false,
] = [true, true];
void templateTypesAgree;

/**
 * Text written once for every page a generated route serves, with a `{name}`
 * token per item text it reads. Its value is held to the template value rule
 * (each token exactly once, no other brace), but its placeholders are filled
 * with item text rather than numbers. Two uses, told apart by whether the
 * placeholders name their source:
 *
 * - a search pattern ("{name} advertising | All Points Media", since 0.26.0)
 *   declares only names; which item field fills each is stated by the
 *   generated page's SEO descriptor that names it;
 * - page text on a generated page ("Build Your {name} Network.", since
 *   0.38.0, an item-text pattern) names, per placeholder, the `fieldId` of the
 *   route collection's item text that fills it, so the field alone says what
 *   it renders. Contract semantics hold where it may sit
 *   (`contract-semantics-item-patterns.ts`).
 *
 * Every placeholder names a source or none does: one pattern is one use.
 */
const textPatternSchema = z
  .strictObject({
    placeholders: z
      .array(
        z.strictObject({
          name: z.string().regex(MANAGED_TEXT_TEMPLATE_PLACEHOLDER_NAME),
          fieldId: stableIdSchema("field").optional(),
        }),
      )
      .min(1)
      .max(MANAGED_TEXT_TEMPLATE_MAX_PLACEHOLDERS),
  })
  .refine(
    (pattern) => hasUniqueValues(pattern.placeholders.map((placeholder) => placeholder.name)),
    "Pattern placeholders must be unique",
  )
  .refine(
    (pattern) => {
      const named = pattern.placeholders.filter((placeholder) => placeholder.fieldId !== undefined).length;
      return named === 0 || named === pattern.placeholders.length;
    },
    "Every pattern placeholder names its item field, or none does",
  );

export type ManagedSeoPattern = DeepReadonly<z.infer<typeof textPatternSchema>>;

/** Whether a pattern is page text filled from item fields (0.38.0) rather than a search pattern. */
export function isManagedItemTextPattern(pattern: ManagedSeoPattern): boolean {
  return pattern.placeholders.every((placeholder) => placeholder.fieldId !== undefined);
}

function tokensFit(constraints: {
  readonly maxLength: number;
  readonly template?: { readonly placeholders: readonly { readonly name: string }[] };
  readonly pattern?: { readonly placeholders: readonly { readonly name: string }[] };
}): boolean {
  const tokens = [
    ...(constraints.template?.placeholders ?? []),
    ...(constraints.pattern?.placeholders ?? []),
  ];
  const tokenLength = tokens.reduce(
    (total, placeholder) => total + managedTextTemplateToken(placeholder.name).length,
    0,
  );
  return constraints.maxLength >= tokenLength;
}

/**
 * Plain text's limits, and optionally a template or a search pattern. Their
 * tokens are part of the stored text, so a maximum shorter than the tokens alone
 * admits no value and is refused.
 */
const plainTextConstraintsSchema = z
  .strictObject({
    ...textConstraintsShape,
    template: textTemplateSchema.optional(),
    pattern: textPatternSchema.optional(),
    attribute: z.enum(MANAGED_TEXT_ATTRIBUTES).optional(),
  })
  .refine(lengthsOrdered)
  .refine(tokensFit);

/**
 * A heading's limits, and optionally an item-text pattern (since 0.38.0): a
 * generated page's heading written once with its item's name in it ("{name}
 * FAQ"). A search pattern is never a heading.
 */
const headingTextConstraintsSchema = z
  .strictObject({ ...textConstraintsShape, pattern: textPatternSchema.optional() })
  .refine(lengthsOrdered)
  .refine(tokensFit)
  .refine(
    (constraints) => constraints.pattern === undefined || isManagedItemTextPattern(constraints.pattern),
    "A heading's pattern names the item field of each placeholder",
  );

/**
 * Running text: the plain-text roles a reader sees only as words. Every other
 * role (address, phone, email, legal, search text, and any added later) is
 * structured by default. A template must be running text, and so must a
 * migration's text source.
 */
export const MANAGED_RUNNING_TEXT_SEMANTICS: ReadonlySet<ManagedPlainTextSemantic> = new Set([
  "body",
  "label",
  "caption",
]);

interface PlainTextTemplateInput {
  readonly type: "plain_text";
  readonly semantic: string;
  readonly constraints: { readonly template?: unknown };
}

/**
 * Whether a field's text is a template. A migration that moves text into
 * another field (merge, link) would carry its tokens as literal braces, so
 * such fields stay deferred there.
 */
export function isManagedTemplateTextField(field: { readonly type: string }): boolean {
  return (
    field.type === "plain_text" &&
    (field as PlainTextTemplateInput).constraints.template !== undefined
  );
}

interface PatternInput {
  readonly constraints: { readonly pattern?: ManagedSeoPattern };
}

function patternOf(field: { readonly type: string }): ManagedSeoPattern | undefined {
  if (field.type !== "plain_text" && field.type !== "heading_text") return undefined;
  return (field as unknown as PatternInput).constraints.pattern;
}

/**
 * Whether a field's text is a search pattern: the words of every generated
 * page's title or description, around item text the site fills in.
 */
export function isManagedSeoPatternField(field: { readonly type: string }): boolean {
  const pattern = patternOf(field);
  return field.type === "plain_text" && pattern !== undefined && !isManagedItemTextPattern(pattern);
}

/**
 * Whether a field is page text filled from its generated page's item (0.38.0):
 * a plain-text or heading field whose pattern names an item field per token.
 */
export function isManagedItemPatternField(field: { readonly type: string }): boolean {
  const pattern = patternOf(field);
  return pattern !== undefined && isManagedItemTextPattern(pattern);
}

/**
 * Whether a field's stored text holds tokens a renderer fills (a template's
 * numbers, a pattern's item text). A migration that moves text into another
 * field (merge, link) would carry those tokens as literal braces, so every such
 * field stays deferred there.
 */
export function isManagedTokenTextField(field: { readonly type: string }): boolean {
  return isManagedTemplateTextField(field) || patternOf(field) !== undefined;
}

/**
 * An item-text pattern is running text (or a heading) and nothing else: never
 * a template, an attribute or search text. Where it may sit is contract
 * semantics' to judge.
 */
function validateItemPattern(field: { readonly type: string }, context: z.RefinementCtx): void {
  if (!isManagedItemPatternField(field) || field.type !== "plain_text") return;
  const { semantic, constraints } = field as PlainTextAttributeInput;
  const valid =
    MANAGED_RUNNING_TEXT_SEMANTICS.has(semantic as ManagedPlainTextSemantic) &&
    constraints.template === undefined &&
    constraints.attribute === undefined;
  if (!valid) {
    context.addIssue({ code: "custom", message: "An item-text pattern conflicts with its field policy" });
  }
}

/**
 * A search pattern is one line of search title or description text and nothing
 * else: never a template (whose tokens are numbers) or an attribute.
 */
function validateSeoPattern(field: { readonly type: string }, context: z.RefinementCtx): void {
  if (!isManagedSeoPatternField(field)) return;
  const { semantic, constraints } = field as PlainTextAttributeInput;
  const valid =
    isManagedSeoTextSemantic(semantic) &&
    constraints.template === undefined &&
    constraints.attribute === undefined &&
    constraints.newlines === "forbid" &&
    constraints.maxLength <= MAX_MANAGED_SEO_TEXT_CHARACTERS;
  if (!valid) {
    context.addIssue({ code: "custom", message: "A search pattern conflicts with its field policy" });
  }
}

function validateTemplateSemantic(field: { readonly type: string }, context: z.RefinementCtx): void {
  if (!isManagedTemplateTextField(field)) return;
  const { semantic } = field as PlainTextTemplateInput;
  if (!MANAGED_RUNNING_TEXT_SEMANTICS.has(semantic as ManagedPlainTextSemantic)) {
    context.addIssue({ code: "custom", message: "Only running text may be a template" });
  }
}

interface PlainTextAttributeInput {
  readonly type: "plain_text";
  readonly semantic: string;
  readonly constraints: {
    readonly attribute?: unknown;
    readonly template?: unknown;
    readonly pattern?: unknown;
    readonly minLength: number;
    readonly maxLength: number;
    readonly newlines: string;
  };
}

/**
 * Whether a field's text renders into an attribute of an element rather than
 * as its text (see `attribute-text.ts`). A migration that moves text between
 * fields would move it between an attribute and an element's text, so such
 * fields stay deferred there.
 */
export function isManagedAttributeTextField(field: { readonly type: string }): boolean {
  return (
    field.type === "plain_text" &&
    (field as PlainTextAttributeInput).constraints.attribute !== undefined
  );
}

/**
 * Attribute text is one line of label or caption words, never empty, at most
 * {@link MAX_MANAGED_ATTRIBUTE_TEXT_CHARACTERS}, and never a template: an
 * attribute has no line to break, an empty one erases a screen-reader label,
 * and a template's live numbers would need a renderer on every element.
 */
function validateAttributeText(field: { readonly type: string }, context: z.RefinementCtx): void {
  if (!isManagedAttributeTextField(field)) return;
  const { semantic, constraints } = field as PlainTextAttributeInput;
  const valid =
    (MANAGED_ATTRIBUTE_TEXT_SEMANTICS as readonly string[]).includes(semantic) &&
    constraints.template === undefined &&
    constraints.newlines === "forbid" &&
    constraints.minLength >= 1 &&
    constraints.maxLength <= MAX_MANAGED_ATTRIBUTE_TEXT_CHARACTERS;
  if (!valid) {
    context.addIssue({ code: "custom", message: "Attribute text conflicts with its field policy" });
  }
}

const plainTextShape = {
  type: z.literal("plain_text"),
  semantic: plainTextSemanticSchema,
  constraints: plainTextConstraintsSchema,
};

const headingTextShape = {
  type: z.literal("heading_text"),
  semanticLevel: z.number().int().min(1).max(6),
  constraints: headingTextConstraintsSchema,
};

const uniqueHostsSchema = z
  .array(z.hostname().refine((host) => host === host.toLowerCase()))
  .refine(hasUniqueValues);

/**
 * Which external hosts a link may name. Absent is `declared`, exactly as before
 * the policy existed: only `allowedExternalHosts`. `any_https` is any DNS name
 * (see `isAdmittedExternalHost`) and states no host list of its own, so a list
 * beside it is a contract saying two things and is refused, as megaseo-web's CMS
 * refuses it.
 */
const externalHostPolicySchema = z.enum(["declared", "any_https"]);

interface ExternalHostPolicyInput {
  readonly externalHostPolicy?: "declared" | "any_https";
  readonly allowedExternalHosts: readonly string[];
}

function hostPolicyConflicts(constraints: ExternalHostPolicyInput): boolean {
  return (
    constraints.externalHostPolicy === "any_https" &&
    constraints.allowedExternalHosts.length > 0
  );
}

const richTextConstraintsSchema = z
  .strictObject({
    maxCharacters: z.number().int().positive().max(131_072),
    maxNodes: z.number().int().positive().max(2_000),
    // Top-level blocks only, derived from the document schema. A field lists the
    // blocks it opts into, so one that does not name `heading` or `blockquote`
    // refuses them: nothing reaches a renderer by omission.
    allowedBlocks: z.array(z.enum(MANAGED_RICH_TEXT_BLOCK_KINDS)).min(1),
    // How many top-level blocks a value may hold. Absent is unbounded, exactly
    // as every field was before this existed. A field rendered inside one site
    // element -- a heading, a paragraph, a button -- is `1`: a second block has
    // nowhere to render there.
    maxBlocks: z.number().int().positive().max(2_000).optional(),
    // Whether a value may hold `hard_break` nodes. Absent means false, exactly
    // as every field was before breaks existed, so a site whose renderer
    // predates them is never handed one because its contract said nothing.
    allowHardBreaks: z.boolean().optional(),
    // How many breaks the whole value may hold. Absent is unbounded (the node
    // limit still holds), as an absent `maxBlocks` is; a cap is meaningful only
    // beside the opt-in.
    maxHardBreaks: z.number().int().min(1).max(MANAGED_RICH_TEXT_MAX_HARD_BREAKS).optional(),
    allowedMarks: z.array(managedRichTextMarkKindSchema),
    allowLinks: z.boolean(),
    allowedExternalHosts: uniqueHostsSchema,
    externalHostPolicy: externalHostPolicySchema.optional(),
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
      (constraints.allowedTargets.length + constraints.allowedExternalHosts.length > 0 ||
        constraints.externalHostPolicy !== undefined);
    const enabledLinksHaveNoTarget =
      constraints.allowLinks && constraints.allowedTargets.length === 0;
    if (
      disabledLinksDeclarePolicy ||
      enabledLinksHaveNoTarget ||
      hostPolicyConflicts(constraints)
    ) {
      context.addIssue({ code: "custom", message: "Rich-text link policy conflicts" });
    }
    // A cap without the opt-in caps nothing, and reads as though breaks were
    // admitted. Refused, so a policy says one thing.
    if (constraints.maxHardBreaks !== undefined && constraints.allowHardBreaks !== true) {
      context.addIssue({ code: "custom", message: "A hard-break cap needs allowHardBreaks" });
    }
  });

const richTextShape = {
  type: z.literal("rich_text"),
  constraints: richTextConstraintsSchema,
};

/** How many values one declared query parameter may list. */
export const MAX_MANAGED_LINK_QUERY_VALUES = 64;
/** How many pages one link field may declare a query for. */
export const MAX_MANAGED_LINK_QUERY_PAGES = 64;

/**
 * The query a link field admits on one page (since 0.41.0): each parameter
 * by name, with every value it may take. A destination on that page may carry
 * any subset of the parameters, each holding one listed value; anything else
 * (an undeclared name or value, a page with no entry, a different case) is
 * refused. Values are an enumeration and never a pattern: a pattern is read
 * by a different regular-expression engine in each place the rule is held
 * (this package, the CMS's database and its editor), and an enumeration is
 * compared byte for byte by all three.
 */
const linkQueryPageSchema = z.strictObject({
  pageId: stableIdSchema("page"),
  parameters: z
    .array(
      z.strictObject({
        name: managedLinkQueryNameSchema,
        values: z.array(managedLinkQueryValueSchema).min(1).max(MAX_MANAGED_LINK_QUERY_VALUES),
      }),
    )
    .min(1)
    .max(MAX_MANAGED_LINK_QUERY_PARAMETERS),
});

type LinkQueryPage = z.infer<typeof linkQueryPageSchema>;

/** One page per entry, one name per parameter, one listing per value. */
function linkQueriesUnique(pages: readonly LinkQueryPage[]): boolean {
  return (
    hasUniqueValues(pages.map((page) => page.pageId)) &&
    pages.every(
      (page) =>
        hasUniqueValues(page.parameters.map((parameter) => parameter.name)) &&
        page.parameters.every((parameter) => hasUniqueValues(parameter.values)),
    )
  );
}

const linkConstraintsSchema = z
  .strictObject({
    labelConstraints: linkLabelConstraintsSchema,
    authority: z.enum(["internal_only", "external_only", "internal_or_external"]),
    allowedSchemes: z.array(z.enum(["https", "mailto", "tel"])),
    allowedExternalHosts: uniqueHostsSchema,
    externalHostPolicy: externalHostPolicySchema.optional(),
    fragmentPolicy: z.enum(["forbid", "declared"]),
    allowedFragments: z.array(managedFragmentSchema),
    // Absent admits no query, exactly as every link was before 0.41.0; `[]`
    // says the same.
    allowedQueries: z.array(linkQueryPageSchema).max(MAX_MANAGED_LINK_QUERY_PAGES).optional(),
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
    if (!linkQueriesUnique(constraints.allowedQueries ?? [])) {
      context.addIssue({ code: "custom", message: "Link query pages, parameters and values must be unique" });
    }
    if (constraints.fragmentPolicy === "forbid" && constraints.allowedFragments.length > 0) {
      context.addIssue({ code: "custom", message: "Forbidden fragments cannot be declared" });
    }
    if (hostPolicyConflicts(constraints)) {
      context.addIssue({ code: "custom", message: "Any-host links cannot declare hosts" });
    }
  });

const linkShape = { type: z.literal("link"), constraints: linkConstraintsSchema };

/** A link field's constraints, page, site or item. */
export type ManagedLinkConstraints = DeepReadonly<z.infer<typeof linkConstraintsSchema>>;

/** The icon libraries a site may draw from. The editor shows the same icons by name. */
export const MANAGED_ICON_LIBRARIES = Object.freeze(["lucide"] as const);
/** An icon's name in its library: lucide's own kebab-case names ("heart-pulse"). */
export const MANAGED_ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_MANAGED_ICON_NAME_CHARACTERS = 64;
export const MAX_MANAGED_ICON_CHOICES = 200;

export function isManagedIconName(value: string): boolean {
  return value.length <= MAX_MANAGED_ICON_NAME_CHARACTERS && MANAGED_ICON_NAME.test(value);
}

/**
 * The icons a customer may choose for one field: the site's own icon set for
 * that place, each with the label the picker shows. The site renders the
 * chosen name with its own icon component, so a name outside the set is one no
 * site renders and is refused.
 */
const iconConstraintsSchema = z
  .strictObject({
    library: z.enum(MANAGED_ICON_LIBRARIES),
    choices: z
      .array(
        z.strictObject({
          name: z.string().refine(isManagedIconName),
          label: z.string().min(1).max(160),
        }),
      )
      .min(1)
      .max(MAX_MANAGED_ICON_CHOICES),
  })
  .refine(
    (constraints) => hasUniqueValues(constraints.choices.map((choice) => choice.name)),
    "Icon choices must be unique",
  );

const iconShape = { type: z.literal("icon"), constraints: iconConstraintsSchema };
/**
 * What a toggle means to the site that reads it. An allowlist: a toggle is
 * declared only for a switch the platform knows how to show and explain.
 * `seo_hidden` (since 0.34.0): "Hide this page from search engines", a page's
 * own (or a generated page item's own) indexing switch, named by its search
 * entry's `hiddenFieldId`.
 */
export const MANAGED_TOGGLE_SEMANTICS = Object.freeze(["seo_hidden"] as const);
export type ManagedToggleSemantic = (typeof MANAGED_TOGGLE_SEMANTICS)[number];

/** An on/off value a customer sets. The value is a boolean; what it switches is its semantic's. */
const toggleShape = { type: z.literal("toggle"), semantic: z.enum(MANAGED_TOGGLE_SEMANTICS) };
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
  icon: ["icon.choose"],
  toggle: ["toggle.set"],
} as const satisfies Record<string, readonly (typeof MANAGED_FIELD_CAPABILITIES)[number][]>;

type RenderedFieldInput = {
  readonly type: keyof typeof CAPABILITIES_BY_TYPE;
  readonly classification: "customer_editable" | "code_owned_interface";
  readonly capabilities: readonly (typeof MANAGED_FIELD_CAPABILITIES)[number][];
};

interface ScopedFieldInput {
  readonly scope: "site" | "page";
  readonly usages: readonly ManagedFieldUsage[];
}

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length;
}

export function validateManagedFieldScope(
  field: ScopedFieldInput,
  context: z.RefinementCtx,
): void {
  const pageCount = new Set(field.usages.map((usage) => usage.pageId)).size;
  if (field.scope === "page" && pageCount !== 1) {
    context.addIssue({
      code: "custom",
      message: "Page-scoped field usages must belong to one page",
    });
  }
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
const iconFieldSchema = z.strictObject({ ...commonFieldShape, ...iconShape });
const toggleFieldSchema = z.strictObject({ ...commonFieldShape, ...toggleShape });

export const managedFieldDescriptorSchema = withManagedSiteJsonSchemaSemantic(
  "field-descriptor",
  z.discriminatedUnion("type", [
    plainTextFieldSchema,
    headingTextFieldSchema,
    richTextFieldSchema,
    linkFieldSchema,
    imageFieldSchema,
    collectionFieldSchema,
    iconFieldSchema,
    toggleFieldSchema,
  ]).superRefine((field, context) => {
    validateCapabilities(field, context);
    validateRichTextCapabilities(field, context);
    validateTemplateSemantic(field, context);
    validateAttributeText(field, context);
    validateSeoPattern(field, context);
    validateItemPattern(field, context);
    validateManagedFieldScope(field, context);
  }),
);

const plainTextItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...plainTextShape });
const headingTextItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...headingTextShape });
const richTextItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...richTextShape });
/**
 * An item's link may be declared `optional` (since 0.37.0): an item may have no
 * link ("a case study with no PDF"), its value is then `null`, the editor
 * offers "Add link" and "Remove link", and the site renders nothing in its
 * place. Absent means required, as every link was before.
 */
const linkItemFieldSchema = z.strictObject({
  ...commonItemFieldShape,
  ...linkShape,
  optional: z.literal(true).optional(),
});
/**
 * An item's image may be declared `optional` (since 0.36.0): an item may go
 * without one ("a network with no honest photo yet"), its value is then
 * `null`, the editor offers "Add image" and "Remove image", and the site
 * renders nothing in its place. Absent means required, exactly as every image
 * was before; there is no `false` spelling, so one meaning has one form.
 */
const imageItemFieldSchema = z.strictObject({
  ...commonItemFieldShape,
  ...imageShape,
  optional: z.literal(true).optional(),
});
/**
 * A list inside an item ("Networks > Healthcare > its venues"): each item holds
 * its own ordered list of another collection's items. Which collections may be
 * nested, and that each list's items are its own, is contract and content
 * semantics (`contract-semantics-nested.ts`, `content-semantics-collections.ts`).
 */
const collectionItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...collectionShape });
const iconItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...iconShape });
const toggleItemFieldSchema = z.strictObject({ ...commonItemFieldShape, ...toggleShape });

/**
 * Whether an item may hold no value for this field: a value of `null`, which
 * the site renders as nothing. Read from the declaration, so any field type
 * that gains `optional` later is covered by every reader of this.
 */
export function isManagedOptionalItemField(field: { readonly type: string }): boolean {
  return (field as { readonly optional?: unknown }).optional === true;
}

export const managedCollectionItemFieldSchema = z
  .discriminatedUnion("type", [
    plainTextItemFieldSchema,
    headingTextItemFieldSchema,
    richTextItemFieldSchema,
    linkItemFieldSchema,
    imageItemFieldSchema,
    collectionItemFieldSchema,
    iconItemFieldSchema,
    toggleItemFieldSchema,
    internalProtectedItemFieldSchema,
  ])
  .superRefine((field, context) => {
    if (field.type === "internal_protected") return;
    validateCapabilities(field, context);
    validateRichTextCapabilities(field, context);
    validateTemplateSemantic(field, context);
    validateAttributeText(field, context);
    validateSeoPattern(field, context);
    validateItemPattern(field, context);
  });

const uniquenessRuleSchema = z.strictObject({
  fieldIds: z.array(stableIdSchema("field")).min(1).refine(hasUniqueValues),
  comparison: z.enum(["exact", "case_folded"]),
});

/**
 * How many items a collection may hold. Stated here once, and spread into the
 * descriptor below, so a tool collecting the numbers from an operator checks
 * them against the same bounds the descriptor enforces.
 */
const collectionBoundsShape = {
  minItems: z.number().int().nonnegative().max(500),
  maxItems: z.number().int().positive().max(500),
};

function boundsAreOrdered(bounds: { readonly minItems: number; readonly maxItems: number }): boolean {
  return bounds.minItems <= bounds.maxItems;
}

const managedCollectionBoundsSchema = z
  .strictObject(collectionBoundsShape)
  .refine(boundsAreOrdered);

export type ManagedCollectionBounds = DeepReadonly<
  z.infer<typeof managedCollectionBoundsSchema>
>;

export function parseManagedCollectionBounds(input: unknown): ManagedCollectionBounds {
  return parseSchemaInput(managedCollectionBoundsSchema, input);
}

export const managedCollectionDescriptorSchema = withManagedSiteJsonSchemaSemantic(
  "collection-descriptor",
  z.strictObject({
    id: stableIdSchema("collection"),
    presentation: managedPresentationSchema,
    resolver: jsonPointerSourceResolverSchema,
    itemIdPointer: jsonPointerSchema,
    itemIdPolicy: z.literal("server_minted"),
    ...collectionBoundsShape,
    itemFields: z.array(managedCollectionItemFieldSchema).min(1),
    uniqueness: z.array(uniquenessRuleSchema),
    deletion: z.strictObject({
      whenReferenced: z.enum(["restrict", "cascade"]),
      restorable: z.boolean(),
    }),
  })
    .refine(boundsAreOrdered)
    // An absent value is no value: two items without one are not the same
    // thing, so no uniqueness rule may name a field an item may leave empty.
    .refine(
      (collection) =>
        collection.uniqueness.every((rule) =>
          rule.fieldIds.every((fieldId) => {
            const field = collection.itemFields.find((candidate) => candidate.id === fieldId);
            return field === undefined || !isManagedOptionalItemField(field);
          }),
        ),
      "A uniqueness rule cannot name an optional field",
    ),
);

export type ManagedFieldCapability = z.infer<typeof managedFieldCapabilitySchema>;
export type ManagedFieldScope = z.infer<typeof managedFieldScopeSchema>;
export type ManagedContentClassification = z.infer<typeof managedContentClassificationSchema>;
export type ManagedFieldDescriptor = DeepReadonly<z.infer<typeof managedFieldDescriptorSchema>>;
export type ManagedCollectionItemField = DeepReadonly<z.infer<
  typeof managedCollectionItemFieldSchema
>>;
export type ManagedInternalProtectedCollectionItemField = Extract<
  ManagedCollectionItemField,
  { readonly type: "internal_protected" }
>;
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

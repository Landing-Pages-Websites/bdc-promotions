import * as z from "zod";

import type { DeepReadonly } from "./deep-readonly.js";
import { ManagedSiteContractError } from "./errors.js";
import { parseJsonValue, type JsonValue } from "./json.js";
import { isJsonRecord } from "./json-record.js";
import { managedRichTextHeadingLevelSchema } from "./rich-text.js";
import { parseParsedSchemaInput } from "./schema-input.js";
import {
  managedImageMimeTypeSchema,
  managedLinkDestinationSchema,
  managedLinkTargetSchema,
  managedRichTextLinkDestinationSchema,
  servedAssetPathSchema,
  stableIdSchema,
} from "./values.js";

/** The sidecar file a site commits beside its contract when fields migrate. */
export const MANAGED_SITE_FIELD_MIGRATION_FILE = "managed-site.migration.json";

/**
 * The transforms this version proves: `merge` (since 0.15.0), `retire`
 * (since 0.21.0; whole collections since 0.29.0; whole pages since 0.30.0),
 * `link` (since 0.22.0), `rescope` (since 0.40.0) and `image-metadata`
 * (since 0.42.0).
 * Anything else a declaration names (split, rename, type_widen, alias groups)
 * is refused as deferred rather than read as something it is not.
 */
export const MANAGED_SITE_FIELD_MIGRATION_OPS = Object.freeze(["merge", "retire", "link", "rescope", "image-metadata"] as const);

const sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/);

/**
 * A declared link mark reaches a page of this site or an https URL. Email and
 * phone links stay content: code may not add one through a migration. A mark
 * carries no query, as no prose link does.
 */
const migrationLinkDestinationSchema = managedRichTextLinkDestinationSchema.refine(
  (destination) =>
    destination.kind === "internal" || destination.kind === "external",
  "A migration link names an internal page or an external URL",
);

const migrationMarkSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("italic") }),
  z.strictObject({ type: z.literal("bold") }),
  z.strictObject({
    type: z.literal("link"),
    destination: migrationLinkDestinationSchema,
    target: managedLinkTargetSchema,
  }),
]);

/** At most one mark of each kind, exactly as a rich-text text node allows. */
const migrationMarksSchema = z
  .array(migrationMarkSchema)
  .min(1)
  .max(3)
  .refine(
    (marks) => new Set(marks.map((mark) => mark.type)).size === marks.length,
    "A part carries each mark kind at most once",
  );

/**
 * How a part meets the one before it. Absent means directly, text against
 * text. `hard_break` puts one `hard_break` node between them, and it is only
 * ever declared: no part's text, newline included, becomes a break. It is a
 * property of the part, not of the step, because a line of a block may be
 * several parts (a plain "Activate", a literal space, an italic "Real-World").
 */
const MANAGED_SITE_FIELD_MIGRATION_JOINS = Object.freeze(["hard_break"] as const);
const migrationJoinSchema = z.enum(MANAGED_SITE_FIELD_MIGRATION_JOINS);

const sourcePartSchema = z.strictObject({
  source: stableIdSchema("field"),
  marks: migrationMarksSchema.optional(),
  joinedBy: migrationJoinSchema.optional(),
});

const literalPartSchema = z.strictObject({
  literal: z.string().min(1).max(1_000),
  marks: migrationMarksSchema.optional(),
  joinedBy: migrationJoinSchema.optional(),
});

const migrationPartSchema = z.union([sourcePartSchema, literalPartSchema]);

const migrationBlockSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("paragraph") }),
  z.strictObject({
    type: z.literal("heading"),
    // The levels a rich-text heading block admits, from its own schema, so a
    // level the contract adds is one a migration can declare.
    level: managedRichTextHeadingLevelSchema,
  }),
  z.strictObject({ type: z.literal("bullet_list") }),
]);

const migrationIntoSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("plain_text") }),
  z.strictObject({ type: z.literal("rich_text"), block: migrationBlockSchema }),
]);

const mergeStepSchema = z
  .strictObject({
    op: z.literal("merge"),
    target: stableIdSchema("field"),
    into: migrationIntoSchema,
    parts: z.array(migrationPartSchema).min(1).max(64),
  })
  .refine(
    (step) => step.parts.some((part) => "source" in part),
    "A merge consumes at least one source",
  )
  .refine(
    (step) =>
      step.into.type !== "plain_text" ||
      step.parts.every((part) => part.marks === undefined),
    "Plain text carries no marks",
  )
  .refine(
    (step) => step.parts.every((part, index) => part.joinedBy === undefined || index > 0),
    "The first part has no part before it to be joined to",
  )
  .refine(
    (step) =>
      step.parts.every((part) => part.joinedBy === undefined) ||
      (step.into.type === "rich_text" && step.into.block.type !== "bullet_list"),
    "A hard break joins parts inside one paragraph or heading, not plain text or list items",
  );

function distinct(ids: readonly string[]): boolean {
  return new Set(ids).size === ids.length;
}

/**
 * Removes customer-editable fields, whole collections (since 0.29.0), whole
 * static pages (since 0.30.0), and the sections they leave empty, from the
 * contract. A page carries its sections, every field it declares and every
 * protected field only it renders (its own search slots), all derived from
 * production; a step naming pages names nothing else. It is a declaration of
 * removal, never of anything new: the candidate must no longer declare each id
 * and must tombstone it, and the verifier refuses anything it cannot prove
 * safe to drop. A collection carries what lives under it: its item fields,
 * every value its items hold, and the page fields that place the list, all
 * derived from production rather than listed. Whether a customer still has
 * content in any of it is the platform's to judge (Site Guard), from the
 * production chain the package cannot see.
 */
/**
 * What a retire must name at least one of. The parser's refinement and the
 * published JSON schema's `anyOf` are both read from this list, so a shape one
 * accepts the other cannot refuse.
 */
export const MANAGED_SITE_FIELD_MIGRATION_RETIRE_TARGETS = Object.freeze(["fields", "collections", "pages"] as const);

/** The retire key that names whole pages; a step naming it names nothing else. */
export const MANAGED_SITE_FIELD_MIGRATION_RETIRE_PAGE_KEY = "pages" satisfies (typeof MANAGED_SITE_FIELD_MIGRATION_RETIRE_TARGETS)[number];

export const managedSiteFieldMigrationRetireStepSchema = z
  .strictObject({
    op: z.literal("retire"),
    fields: z.array(stableIdSchema("field")).min(1).max(1_000).optional(),
    collections: z.array(stableIdSchema("collection")).min(1).max(1_000).optional(),
    sections: z.array(stableIdSchema("section")).min(1).max(1_000).optional(),
    pages: z.array(stableIdSchema("page")).min(1).max(1_000).optional(),
  })
  .refine(
    (step) => MANAGED_SITE_FIELD_MIGRATION_RETIRE_TARGETS.some((key) => step[key] !== undefined),
    "A retire names at least one field, collection or page",
  )
  .refine(
    (step) =>
      step.pages === undefined ||
      Object.keys(step).every((key) => key === "op" || key === MANAGED_SITE_FIELD_MIGRATION_RETIRE_PAGE_KEY),
    "A retire that names pages names nothing else: a page takes its sections and fields with it",
  )
  .refine((step) => distinct(step.fields ?? []), "A retire names each field once")
  .refine((step) => distinct(step.collections ?? []), "A retire names each collection once")
  .refine((step) => distinct(step.sections ?? []), "A retire names each section once")
  .refine((step) => distinct(step.pages ?? []), "A retire names each page once");

/**
 * The most links one step declares: one per item of the largest collection a
 * contract admits (`maxItems` is at most 500).
 */
const MAX_LINKS_PER_STEP = 500;

/**
 * One link a `link` step writes: where it goes and in which window. `item`
 * names the collection item it is for, and is absent for a page or site field,
 * which has exactly one value.
 */
const migrationLinkSchema = z.strictObject({
  item: stableIdSchema("item").optional(),
  destination: managedLinkDestinationSchema,
  target: managedLinkTargetSchema,
});

/**
 * Turns one plain-text field into one link field: each value's label is the
 * source's text exactly, and its destination and window are the declared ones.
 * A page or site field declares one link with no `item`; a collection item
 * field declares one link per item, each naming its item once. Which items
 * production holds, and whether each value fits the target's constraints, is
 * the verifier's to judge.
 */
const linkStepSchema = z
  .strictObject({
    op: z.literal("link"),
    source: stableIdSchema("field"),
    target: stableIdSchema("field"),
    links: z.array(migrationLinkSchema).min(1).max(MAX_LINKS_PER_STEP),
  })
  .refine((step) => step.source !== step.target, "A link step's target is a new field, not its source")
  .refine(
    (step) =>
      step.links.every((link) => link.item !== undefined) ||
      (step.links.length === 1 && step.links[0].item === undefined),
    "A link step declares one link with no item, or one link per item",
  )
  .refine(
    (step) => distinct(step.links.flatMap((link) => (link.item === undefined ? [] : [link.item]))),
    "A link step names each item once",
  );

/**
 * Moves one page-scoped field to site scope (since 0.40.0): a field that
 * renders on one page grows usages on more ("the home page's network builder
 * also shows on two solution pages"). Its id, policy and value stay; its value
 * moves from the page's owner to the site's, and the verifier proves the
 * value is byte-identical and every production usage is kept.
 */
const rescopeStepSchema = z.strictObject({
  op: z.literal("rescope"),
  field: stableIdSchema("field"),
  scope: z.literal("site"),
});

/**
 * The most image files one step corrects: one per asset manifest entry a
 * declaration could name.
 */
const MAX_IMAGES_PER_STEP = 1_000;

/**
 * What one image file truly is, as its own bytes say: its format, its
 * displayed size and its length. Its path names the file; its digest is not
 * restated, because it cannot change (the file is the same file).
 */
const migrationImageMaterialSchema = z.strictObject({
  path: servedAssetPathSchema,
  mimeType: managedImageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
});

/**
 * Corrects the metadata production states for image files whose bytes do
 * not change (since 0.42.0): a photo stored 1500x1125 with EXIF orientation 6
 * is shown 1125x1500, and every value and manifest entry naming it must say
 * so. Only what is derived from the file moves (`mimeType`, `width`,
 * `height`, `bytes`), and only to what the file's own bytes derive; which
 * values and manifest entries name each path is derived from production,
 * never listed. Alt text, crop and focal point stay exactly as they are.
 */
const imageMetadataStepSchema = z
  .strictObject({
    op: z.literal("image-metadata"),
    images: z.array(migrationImageMaterialSchema).min(1).max(MAX_IMAGES_PER_STEP),
  })
  .refine((step) => distinct(step.images.map(({ path }) => path)), "An image-metadata step names each path once");

const migrationStepSchema = z.union([
  mergeStepSchema,
  managedSiteFieldMigrationRetireStepSchema,
  linkStepSchema,
  rescopeStepSchema,
  imageMetadataStepSchema,
]);

const bridgeVersionSchema = z.string().regex(/^v[1-9]\d{0,3}$/);
// A step may end on the unpinned `latest` delivery but never start there:
// nothing is newer than `latest`, so the sole step off it would be a downgrade.
const bridgeStepTargetSchema = z.union([bridgeVersionSchema, z.literal("latest")]);

export const managedSiteFieldMigrationV1Schema = z.strictObject({
  schemaVersion: z.literal("1.0"),
  from: z.strictObject({
    contractSha256: sha256HexSchema,
    contentSha256: sha256HexSchema,
  }),
  bridge: z
    .strictObject({ from: bridgeVersionSchema, to: bridgeStepTargetSchema })
    .optional(),
  steps: z.array(migrationStepSchema).max(1_000),
});

export type ManagedSiteFieldMigrationV1 = DeepReadonly<
  z.infer<typeof managedSiteFieldMigrationV1Schema>
>;
/** Any declared step. */
export type ManagedSiteFieldMigrationAnyStepV1 =
  ManagedSiteFieldMigrationV1["steps"][number];
export type ManagedSiteFieldMigrationStepV1 = Extract<
  ManagedSiteFieldMigrationAnyStepV1,
  { readonly op: "merge" }
>;
export type ManagedSiteFieldMigrationRetireStepV1 = Extract<
  ManagedSiteFieldMigrationAnyStepV1,
  { readonly op: "retire" }
>;
export type ManagedSiteFieldMigrationLinkStepV1 = Extract<
  ManagedSiteFieldMigrationAnyStepV1,
  { readonly op: "link" }
>;
export type ManagedSiteFieldMigrationRescopeStepV1 = Extract<
  ManagedSiteFieldMigrationAnyStepV1,
  { readonly op: "rescope" }
>;
export type ManagedSiteFieldMigrationImageMetadataStepV1 = Extract<
  ManagedSiteFieldMigrationAnyStepV1,
  { readonly op: "image-metadata" }
>;
export type ManagedSiteFieldMigrationImageMaterialV1 = ManagedSiteFieldMigrationImageMetadataStepV1["images"][number];
export type ManagedSiteFieldMigrationLinkV1 = ManagedSiteFieldMigrationLinkStepV1["links"][number];
export type ManagedSiteFieldMigrationPartV1 =
  ManagedSiteFieldMigrationStepV1["parts"][number];
export type ManagedSiteFieldMigrationMarkV1 = NonNullable<
  ManagedSiteFieldMigrationPartV1["marks"]
>[number];
export type ManagedSiteFieldMigrationBlockV1 = Extract<
  ManagedSiteFieldMigrationStepV1["into"],
  { type: "rich_text" }
>["block"];

function deferredOp(step: JsonValue): string | null {
  if (!isJsonRecord(step)) return null;
  const op = step.op;
  if (typeof op !== "string") return null;
  return (MANAGED_SITE_FIELD_MIGRATION_OPS as readonly string[]).includes(op)
    ? null
    : op;
}

/**
 * An op this version cannot prove is refused by name before the schema runs,
 * so a declaration of a split reads as "deferred", not as a malformed merge.
 */
function assertNoDeferredOps(input: JsonValue): void {
  if (!isJsonRecord(input) || !Array.isArray(input.steps)) return;
  for (const step of input.steps as readonly JsonValue[]) {
    const op = deferredOp(step);
    if (op === null) continue;
    throw new ManagedSiteContractError(
      "MIGRATION_TRANSFORM_DEFERRED",
      `Migration op is not supported yet: ${op}`,
    );
  }
}

export function parseManagedSiteFieldMigrationV1(
  input: unknown,
): ManagedSiteFieldMigrationV1 {
  const parsed = parseJsonValue(input);
  assertNoDeferredOps(parsed);
  try {
    return parseParsedSchemaInput(managedSiteFieldMigrationV1Schema, parsed);
  } catch (error) {
    if (error instanceof ManagedSiteContractError) throw error;
    throw new ManagedSiteContractError(
      "MIGRATION_DECLARATION_INVALID",
      "Migration declaration does not match its schema",
    );
  }
}

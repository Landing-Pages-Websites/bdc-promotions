import * as z from "zod";

import { canonicalizeJson } from "./canonical.js";
import type { DeepReadonly } from "./deep-readonly.js";
import { ManagedSiteContractError } from "./errors.js";
import { parseJsonValue } from "./json.js";
import { parseParsedSchemaInput } from "./schema-input.js";
import {
  managedLinkDestinationSchema,
  managedLinkTargetSchema,
} from "./values.js";

export const MAX_RICH_TEXT_DEPTH = 8;
export const MAX_RICH_TEXT_NODES = 2_000;
export const MAX_RICH_TEXT_BYTES = 131_072;
const MAX_RICH_TEXT_JSON_DEPTH = MAX_RICH_TEXT_DEPTH * 2;
const MAX_RICH_TEXT_JSON_NODES = MAX_RICH_TEXT_NODES * 10;

/**
 * A document names its children `content` and its root `doc`, and carries marks
 * as objects rather than strings, because this is the one shape an editor can
 * round-trip without translating. The editors in this family serialise to
 * `type`/`content`/`marks` and cannot be told to call the child array anything
 * else, so any other spelling puts a conversion step between every keystroke and
 * the stored value, which is where a read and a write start to disagree.
 */
const managedRichTextBoldMarkSchema = z.strictObject({
  type: z.literal("bold"),
});

const managedRichTextItalicMarkSchema = z.strictObject({
  type: z.literal("italic"),
});

/**
 * A link is a mark, not a node wrapping text, so it composes with bold and
 * italic instead of nesting against them.
 *
 * It carries the same destination union a `link` field carries, so prose links
 * and link fields cannot drift apart on what a destination is, and an internal
 * link names a `pageId` rather than a path: a path breaks the moment a route is
 * renamed, and a stable id does not.
 */
const managedRichTextLinkMarkSchema = z.strictObject({
  type: z.literal("link"),
  destination: managedLinkDestinationSchema,
  target: managedLinkTargetSchema,
});

export const managedRichTextMarkSchema = z.discriminatedUnion("type", [
  managedRichTextBoldMarkSchema,
  managedRichTextItalicMarkSchema,
  managedRichTextLinkMarkSchema,
]);

/**
 * The mark kinds a field's constraints may name. Constraints narrow by kind
 * while a document carries whole mark objects, so these are two schemas rather
 * than one doing both jobs, and a constraint list stays the plain strings it has
 * always been.
 *
 * `link` is absent deliberately. Prose links are governed by `allowLinks` and
 * its companions, exactly as they were when a link was a node rather than a
 * mark, so becoming a mark does not quietly introduce a second switch that also
 * has to be set.
 */
export const managedRichTextMarkKindSchema = z.enum(["bold", "italic"]);

/**
 * Unmarked text omits `marks` entirely rather than carrying an empty array, so
 * one run of prose has exactly one spelling. The stored blob is hashed, and two
 * spellings of the same text would hash differently while meaning the same
 * thing. It is also what the writer accepts and what this family of editors
 * serialises.
 *
 * One of each mark at most: two of the same kind is not a distinguishable state.
 */
const managedRichTextTextSchema = z
  .strictObject({
    type: z.literal("text"),
    text: z.string(),
    marks: z.array(managedRichTextMarkSchema).min(1).max(3).optional(),
  })
  .refine((node) => {
    const kinds = (node.marks ?? []).map((mark) => mark.type);
    return new Set(kinds).size === kinds.length;
  });

/**
 * Inline content is text and nothing else now that links are marks. The name is
 * kept because callers reason about "the inline level" of a document.
 */
export const managedRichTextInlineSchema = managedRichTextTextSchema;

const managedRichTextParagraphSchema = z.strictObject({
  type: z.literal("paragraph"),
  content: z.array(managedRichTextTextSchema).min(1),
});

const managedRichTextListItemSchema = z.strictObject({
  type: z.literal("list_item"),
  content: z.array(managedRichTextParagraphSchema).min(1),
});

const managedRichTextBulletListSchema = z.strictObject({
  type: z.literal("bullet_list"),
  content: z.array(managedRichTextListItemSchema).min(1),
});

const managedRichTextOrderedListSchema = z.strictObject({
  type: z.literal("ordered_list"),
  content: z.array(managedRichTextListItemSchema).min(1),
});

export const managedRichTextBlockSchema = z.discriminatedUnion("type", [
  managedRichTextParagraphSchema,
  managedRichTextBulletListSchema,
  managedRichTextOrderedListSchema,
]);

export const managedRichTextDocumentSchema = z.strictObject({
  type: z.literal("doc"),
  content: z.array(managedRichTextBlockSchema).min(1),
});

export type ManagedRichTextMark = DeepReadonly<
  z.infer<typeof managedRichTextMarkSchema>
>;
export type ManagedRichTextMarkKind = z.infer<
  typeof managedRichTextMarkKindSchema
>;
export type ManagedRichTextInline = DeepReadonly<
  z.infer<typeof managedRichTextInlineSchema>
>;
export type ManagedRichTextBlock = DeepReadonly<
  z.infer<typeof managedRichTextBlockSchema>
>;
export type ManagedRichTextDocument = DeepReadonly<
  z.infer<typeof managedRichTextDocumentSchema>
>;

type RichTextParagraph = Extract<ManagedRichTextBlock, { type: "paragraph" }>;
type RichTextText = ManagedRichTextInline;

export interface ManagedRichTextSummary {
  readonly characters: number;
  readonly nodes: number;
  readonly inlines: readonly ManagedRichTextInline[];
  readonly blocks: readonly ManagedRichTextBlock[];
  readonly textNodes: readonly RichTextText[];
}

function countParagraphNodes(paragraph: RichTextParagraph): number {
  return 1 + paragraph.content.length;
}

function countListItemNodes(
  item: Extract<ManagedRichTextBlock, { type: "bullet_list" }>["content"][number],
): number {
  return (
    1 +
    item.content.reduce(
      (sum, paragraph) => sum + countParagraphNodes(paragraph),
      0,
    )
  );
}

function countBlockNodes(block: ManagedRichTextBlock): number {
  if (block.type === "paragraph") return countParagraphNodes(block);
  return 1 + block.content.reduce((sum, item) => sum + countListItemNodes(item), 0);
}

function countDocumentNodes(document: ManagedRichTextDocument): number {
  return 1 + document.content.reduce((sum, block) => sum + countBlockNodes(block), 0);
}

function collectParagraphs(
  blocks: readonly ManagedRichTextBlock[],
): readonly RichTextParagraph[] {
  return blocks.flatMap((block) =>
    block.type === "paragraph"
      ? [block]
      : block.content.flatMap((item) => item.content),
  );
}

export function summarizeManagedRichText(
  document: ManagedRichTextDocument,
): ManagedRichTextSummary {
  const blocks = document.content;
  // Text is the whole inline level, so the inline and text collections are the
  // same values rather than one being unwrapped from the other.
  const textNodes = collectParagraphs(blocks).flatMap(
    (paragraph) => paragraph.content,
  );
  return {
    characters: textNodes.reduce((sum, node) => sum + node.text.length, 0),
    nodes: countDocumentNodes(document),
    inlines: textNodes,
    blocks,
    textNodes,
  };
}

export function parseManagedRichTextDocument(
  input: unknown,
): ManagedRichTextDocument {
  const parsed = parseJsonValue(input, {
    maxDepth: MAX_RICH_TEXT_JSON_DEPTH,
    maxNodes: MAX_RICH_TEXT_JSON_NODES,
  });
  if (Buffer.byteLength(canonicalizeJson(parsed), "utf8") > MAX_RICH_TEXT_BYTES) {
    throw new ManagedSiteContractError(
      "RICH_TEXT_MAX_BYTES",
      "Rich text exceeds the UTF-8 byte limit",
    );
  }
  const document = parseParsedSchemaInput(managedRichTextDocumentSchema, parsed);
  if (summarizeManagedRichText(document).nodes > MAX_RICH_TEXT_NODES) {
    throw new ManagedSiteContractError(
      "RICH_TEXT_MAX_NODES",
      "Rich text exceeds the semantic node limit",
    );
  }
  return document;
}

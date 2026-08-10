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

export const managedRichTextMarkSchema = z.enum(["bold", "italic"]);

const managedRichTextTextSchema = z
  .strictObject({
    type: z.literal("text"),
    text: z.string(),
    marks: z.array(managedRichTextMarkSchema).max(2),
  })
  .refine((node) => new Set(node.marks).size === node.marks.length);

const managedRichTextLinkSchema = z.strictObject({
  type: z.literal("link"),
  destination: managedLinkDestinationSchema,
  target: managedLinkTargetSchema,
  children: z.array(managedRichTextTextSchema).min(1),
});

export const managedRichTextInlineSchema = z.discriminatedUnion("type", [
  managedRichTextTextSchema,
  managedRichTextLinkSchema,
]);

const managedRichTextParagraphSchema = z.strictObject({
  type: z.literal("paragraph"),
  children: z.array(managedRichTextInlineSchema).min(1),
});

const managedRichTextListItemSchema = z.strictObject({
  type: z.literal("list_item"),
  children: z.array(managedRichTextParagraphSchema).min(1),
});

const managedRichTextBulletListSchema = z.strictObject({
  type: z.literal("bullet_list"),
  children: z.array(managedRichTextListItemSchema).min(1),
});

const managedRichTextOrderedListSchema = z.strictObject({
  type: z.literal("ordered_list"),
  children: z.array(managedRichTextListItemSchema).min(1),
});

export const managedRichTextBlockSchema = z.discriminatedUnion("type", [
  managedRichTextParagraphSchema,
  managedRichTextBulletListSchema,
  managedRichTextOrderedListSchema,
]);

export const managedRichTextDocumentSchema = z.strictObject({
  type: z.literal("document"),
  children: z.array(managedRichTextBlockSchema).min(1),
});

export type ManagedRichTextMark = z.infer<typeof managedRichTextMarkSchema>;
export type ManagedRichTextInline = DeepReadonly<z.infer<typeof managedRichTextInlineSchema>>;
export type ManagedRichTextBlock = DeepReadonly<z.infer<typeof managedRichTextBlockSchema>>;
export type ManagedRichTextDocument = DeepReadonly<z.infer<
  typeof managedRichTextDocumentSchema
>>;

type RichTextParagraph = Extract<ManagedRichTextBlock, { type: "paragraph" }>;
type RichTextText = Extract<ManagedRichTextInline, { type: "text" }>;

export interface ManagedRichTextSummary {
  readonly characters: number;
  readonly nodes: number;
  readonly inlines: readonly ManagedRichTextInline[];
  readonly blocks: readonly ManagedRichTextBlock[];
  readonly textNodes: readonly RichTextText[];
}

function countInlineNodes(inline: ManagedRichTextInline): number {
  return inline.type === "text" ? 1 : 1 + inline.children.length;
}

function countParagraphNodes(
  paragraph: Extract<ManagedRichTextBlock, { type: "paragraph" }>,
): number {
  return (
    1 + paragraph.children.reduce((sum, inline) => sum + countInlineNodes(inline), 0)
  );
}

function countListItemNodes(
  item: Extract<ManagedRichTextBlock, { type: "bullet_list" }>['children'][number],
): number {
  return (
    1 +
    item.children.reduce(
      (sum, paragraph) => sum + countParagraphNodes(paragraph),
      0,
    )
  );
}

function countBlockNodes(block: ManagedRichTextBlock): number {
  if (block.type === "paragraph") return countParagraphNodes(block);
  return (
    1 +
    block.children.reduce(
      (sum, item) => sum + countListItemNodes(item),
      0,
    )
  );
}

function countDocumentNodes(document: ManagedRichTextDocument): number {
  return (
    1 + document.children.reduce((sum, block) => sum + countBlockNodes(block), 0)
  );
}

function collectParagraphs(
  blocks: readonly ManagedRichTextBlock[],
): readonly RichTextParagraph[] {
  return blocks.flatMap((block) =>
    block.type === "paragraph" ? [block] : block.children.flatMap((item) => item.children),
  );
}

export function summarizeManagedRichText(
  document: ManagedRichTextDocument,
): ManagedRichTextSummary {
  const blocks = document.children;
  const inlines = collectParagraphs(blocks).flatMap((paragraph) => paragraph.children);
  const textNodes = inlines.flatMap((inline) =>
    inline.type === "text" ? [inline] : inline.children,
  );
  return {
    characters: textNodes.reduce((sum, node) => sum + node.text.length, 0),
    nodes: countDocumentNodes(document),
    inlines,
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

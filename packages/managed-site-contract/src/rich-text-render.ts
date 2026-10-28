import { canonicalizeJson } from "./canonical.js";
import { ManagedSiteContractError } from "./errors.js";
import type {
  ManagedRichTextDocument,
  ManagedRichTextInline,
  ManagedRichTextMark,
} from "./rich-text.js";
import {
  managedLinkQueryString,
  type ManagedLinkDestination,
  type ManagedLinkTarget,
} from "./values.js";

/**
 * What a site renders a rich-text value with, stated framework-free so a Next
 * runtime, an Astro component and a converter proving its own output all build
 * the same tree.
 *
 * Content stays semantic: a value says "italic", never how italic looks. The
 * site decides that, by rendering each mark with its own element and marking
 * that element with {@link MANAGED_RICH_TEXT_MARK_ATTRIBUTE}, so an editor
 * previewing a change can find the element the site uses for a mark and reuse
 * it rather than guessing at the site's styling.
 */
export const MANAGED_RICH_TEXT_MARK_ATTRIBUTE = "data-gomega-mark";

export interface ManagedRichTextMarkAttributesV1 {
  readonly "data-gomega-mark": ManagedRichTextMark["type"];
}

export function managedRichTextMarkAttributesV1(
  kind: ManagedRichTextMark["type"],
): ManagedRichTextMarkAttributesV1 {
  return Object.freeze({ [MANAGED_RICH_TEXT_MARK_ATTRIBUTE]: kind });
}

/**
 * A hard break renders as `<br data-gomega-break="">` unless the site renders
 * its own line element for it (a TextReveal line wrapper, a `<br>` with a
 * class). Whatever element it uses carries this attribute, so an editor
 * previewing a change can find the site's element for a break and clone it
 * rather than guessing.
 */
export const MANAGED_RICH_TEXT_BREAK_ATTRIBUTE = "data-gomega-break";

export interface ManagedRichTextBreakAttributesV1 {
  readonly "data-gomega-break": "";
}

export function managedRichTextBreakAttributesV1(): ManagedRichTextBreakAttributesV1 {
  return Object.freeze({ [MANAGED_RICH_TEXT_BREAK_ATTRIBUTE]: "" as const });
}

/**
 * One node of a grouped inline tree: bare text, a hard break, or a mark around
 * its children.
 */
export type ManagedRichTextSpan =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "hard_break" }
  | {
      readonly kind: "mark";
      readonly mark: ManagedRichTextMark;
      readonly children: readonly ManagedRichTextSpan[];
    };

type MarkedInline =
  | {
      readonly kind: "text";
      readonly text: string;
      readonly marks: readonly ManagedRichTextMark[];
    }
  | { readonly kind: "hard_break" };

type MarkedText = Extract<MarkedInline, { kind: "text" }>;

function sharesOuterMark(
  inline: MarkedInline | undefined,
  outer: ManagedRichTextMark,
): inline is MarkedText {
  const mark = inline?.kind === "text" ? inline.marks[0] : undefined;
  return mark !== undefined && sameMark(mark, outer);
}

function sameMark(left: ManagedRichTextMark, right: ManagedRichTextMark): boolean {
  if (left.type !== right.type) return false;
  if (left.type !== "link") return true;
  // A link's destination and target are part of its identity, so two links to
  // different places are two elements even when they sit side by side.
  return canonicalizeJson(left) === canonicalizeJson(right);
}

/**
 * A break joins a mark's run only when the text after it carries that mark
 * too, so it renders inside every mark its two neighbours share from the
 * outside in, and outside the first one they do not.
 */
function group(inlines: readonly MarkedInline[]): readonly ManagedRichTextSpan[] {
  const spans: ManagedRichTextSpan[] = [];
  let index = 0;
  while (index < inlines.length) {
    const inline = inlines[index]!;
    index += 1;
    if (inline.kind === "hard_break") {
      spans.push({ kind: "hard_break" });
      continue;
    }
    const [outer, ...inner] = inline.marks;
    if (outer === undefined) {
      spans.push({ kind: "text", text: inline.text });
      continue;
    }
    const run: MarkedInline[] = [{ kind: "text", text: inline.text, marks: inner }];
    while (index < inlines.length) {
      const next = inlines[index]!;
      if (next.kind === "hard_break" && sharesOuterMark(inlines[index + 1], outer)) {
        run.push(next);
      } else if (sharesOuterMark(next, outer)) {
        run.push({ kind: "text", text: next.text, marks: next.marks.slice(1) });
      } else {
        break;
      }
      index += 1;
    }
    spans.push({ kind: "mark", mark: outer, children: group(run) });
  }
  return spans;
}

/**
 * Inline text as the tree a renderer walks.
 *
 * Adjacent runs that share their OUTERMOST mark render inside one element, so
 * `<strong>bold <em>and italic</em></strong>` round-trips as one `<strong>`
 * rather than two. A text node lists its marks outermost first, and that order
 * is the nesting order. A hard break sits inside every mark both its
 * neighbours share, so `<strong>Grow<br>more</strong>` round-trips too.
 */
export function groupManagedRichTextInlines(
  inlines: readonly ManagedRichTextInline[],
): readonly ManagedRichTextSpan[] {
  return group(
    inlines.map((inline): MarkedInline =>
      inline.type === "hard_break"
        ? { kind: "hard_break" }
        : { kind: "text", text: inline.text, marks: inline.marks ?? [] },
    ),
  );
}

/**
 * The inline text of a field rendered inside ONE site element: a heading, a
 * paragraph, a button label.
 *
 * Anything else is refused rather than partly rendered. A second paragraph has
 * nowhere to go inside an `<h2>`, and silently dropping it would show the
 * customer a page that does not match what they saved. `maxBlocks: 1` is what
 * keeps a saved value inside this shape; this is the renderer holding to it.
 */
export function managedRichTextBlockInlines(
  document: ManagedRichTextDocument,
): readonly ManagedRichTextInline[] {
  const [block, ...rest] = document.content;
  if (
    block === undefined ||
    rest.length > 0 ||
    (block.type !== "paragraph" && block.type !== "heading")
  ) {
    throw new ManagedSiteContractError(
      "RICH_TEXT_NOT_ONE_BLOCK",
      "Rich text rendered in one element must hold exactly one paragraph or heading",
    );
  }
  return block.content;
}

export interface ManagedRichTextLinkAttributesV1 {
  readonly href: string;
  /** Absent for the same window, so an element that never had one gains none. */
  readonly target: "_blank" | undefined;
}

/** A site's path for one of its pages, which only the site's contract knows. */
export type ManagedRichTextPagePathResolver = (pageId: string) => string;

/**
 * A site's path for one item of a generated page: the page's pattern filled
 * with the item's route key, which only the site's content knows
 * (`managedGeneratedRoutePath` does the filling). A separate resolver, not a
 * second argument to the page resolver, so a resolver written before items
 * could be linked is never handed an item it would ignore and answer with the
 * pattern.
 */
export type ManagedRichTextItemPathResolver = (pageId: string, itemId: string) => string;

/** How a renderer turns an internal destination into a path. */
interface ManagedRichTextPathResolvers {
  readonly resolvePagePath?: ManagedRichTextPagePathResolver;
  readonly resolveItemPath?: ManagedRichTextItemPathResolver;
}

function internalPath(
  destination: Extract<ManagedLinkDestination, { kind: "internal" }>,
  resolvers: ManagedRichTextPathResolvers,
): string {
  const { itemId } = destination;
  if (itemId !== undefined && resolvers.resolveItemPath !== undefined) {
    return resolvers.resolveItemPath(destination.pageId, itemId);
  }
  if (itemId === undefined && resolvers.resolvePagePath !== undefined) {
    return resolvers.resolvePagePath(destination.pageId);
  }
  // A page id names a page, and its path lives in the contract's routes; an
  // item's lives in its route key. Without a resolver guessing one would link
  // somewhere.
  throw new ManagedSiteContractError(
    "RICH_TEXT_LINK_UNRESOLVED",
    itemId === undefined
      ? "An internal rich-text link needs its page path, which this renderer is not given"
      : "An internal rich-text link to an item needs its item path, which this renderer is not given",
  );
}

/**
 * What an href is built from: a prose link mark, or a link field's value,
 * whose internal destination may also carry a query (0.41.0).
 */
export interface ManagedLinkHrefSourceV1 {
  /** A prose mark's own discriminant, so a mark passes as written. */
  readonly type?: "link";
  readonly destination: ManagedLinkDestination;
  readonly target: ManagedLinkTarget;
}

function hrefOf(
  link: ManagedLinkHrefSourceV1,
  resolvers: ManagedRichTextPathResolvers,
): string {
  const destination = link.destination;
  switch (destination.kind) {
    case "external":
      return destination.url;
    case "email":
      return `mailto:${destination.address}`;
    case "phone":
      return `tel:${destination.number}`;
    case "internal": {
      // Path, then query, then fragment: the order a URL is read in. The query
      // has one spelling (`managedLinkQueryString`), so every renderer writes
      // the same href for the same value.
      const fragment = destination.fragment === null ? "" : `#${destination.fragment}`;
      return `${internalPath(destination, resolvers)}${managedLinkQueryString(destination.query)}${fragment}`;
    }
  }
}

/**
 * The attributes a link mark's element takes from the value. An internal link
 * needs `resolvePagePath`, the site's own path for a page id, and a link to an
 * item of a generated page needs `resolveItemPath`.
 */
export function managedRichTextLinkAttributesV1(
  mark: ManagedLinkHrefSourceV1,
  resolvePagePath?: ManagedRichTextPagePathResolver,
  resolveItemPath?: ManagedRichTextItemPathResolver,
): ManagedRichTextLinkAttributesV1 {
  return Object.freeze({
    href: hrefOf(mark, { resolvePagePath, resolveItemPath }),
    target: mark.target === "new_window" ? "_blank" : undefined,
  });
}

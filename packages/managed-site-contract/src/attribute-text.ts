/**
 * Attribute text: a plain-text field a site renders into one attribute of an
 * element instead of as the element's text. A screen-reader label
 * (`aria-label="Open menu"`), an input's placeholder, a tooltip, an image's
 * description: words a customer owns that no click on the page can land on.
 *
 * The element is named by a binding of its own, one per attribute
 * (`data-gomega-attr-aria-label="<field id>"`), never by `data-gomega-field-id`.
 * An editor writes a text field by replacing the element's children, so a
 * `<nav>` annotated as a text field to edit its label would lose its links on
 * the first keystroke. Its own binding also lets one element carry a text field
 * and any number of attribute fields at once, each its own cell.
 *
 * This module imports nothing, so a client component (an editor, a site's own
 * runtime) can read the rules without zod.
 */

/**
 * Every attribute a field may write, and nothing else. Each is inert text a
 * browser shows or reads aloud; none is a URL, a handler, a style, a class or
 * an identity (`href`, `src`, `on*`, `style`, `class`, `id`), and a name not
 * listed here is refused wherever one is read. Lowercase as HTML serializes
 * them; `Aria-Label` is not a name this contract knows.
 */
export const MANAGED_TEXT_ATTRIBUTES = Object.freeze([
  "aria-label",
  "aria-roledescription",
  "placeholder",
  "title",
  "alt",
] as const);
export type ManagedTextAttribute = (typeof MANAGED_TEXT_ATTRIBUTES)[number];

/** The most characters attribute text may hold (code points, as `maxLength`). */
export const MAX_MANAGED_ATTRIBUTE_TEXT_CHARACTERS = 512;

/** The plain-text roles an attribute may carry: words that name or describe. */
export const MANAGED_ATTRIBUTE_TEXT_SEMANTICS = Object.freeze(["label", "caption"] as const);

/** The prefix of every attribute binding (`data-gomega-attr-<attribute>`). */
export const MANAGED_ATTRIBUTE_BINDING_PREFIX = "data-gomega-attr-";
/** The suffix that names the collection item a binding's value belongs to. */
export const MANAGED_ATTRIBUTE_ITEM_BINDING_SUFFIX = "-item";

/**
 * What blank means for attribute text: the Unicode White_Space characters and
 * the zero-width ones that render as nothing. An `aria-label` of only these is
 * an empty accessible name, which is worse than the label it replaced, so such
 * a value is refused. Stated as a code point list, not a regex class, because
 * megaseo-web's writer states the same rule in SQL, where `\s` means whatever
 * the database's locale says it means.
 */
export const MANAGED_ATTRIBUTE_TEXT_BLANK_CODE_POINTS = Object.freeze([
  0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x0085, 0x00a0, 0x1680,
  0x180e, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007,
  0x2008, 0x2009, 0x200a, 0x200b, 0x200c, 0x200d, 0x2028, 0x2029, 0x202f,
  0x205f, 0x2060, 0x3000, 0xfeff,
] as const);

const BLANK = new Set<number>(MANAGED_ATTRIBUTE_TEXT_BLANK_CODE_POINTS);

/**
 * Characters attribute text never holds: every Cc, the bidi embeddings,
 * overrides and isolates, and the line and paragraph separators. The class a
 * search title is held to (`hasUnsafeTextCharacter`), by code point, so a
 * screen reader is never handed text that reads differently from how it shows.
 */
const UNSAFE_CHARACTER = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/u;

export type ManagedAttributeTextRefusal = "unsafe_character" | "blank";

/**
 * Why `text` cannot be attribute text, or `null`. Checked in this order, and
 * megaseo-web's writer answers in the same order: an unsafe character first,
 * then blank. Length and newlines are the field's own constraints and are
 * judged with every other plain-text field's.
 */
export function managedAttributeTextRefusal(text: string): ManagedAttributeTextRefusal | null {
  if (UNSAFE_CHARACTER.test(text)) return "unsafe_character";
  for (const character of text) {
    if (!BLANK.has(character.codePointAt(0) as number)) return null;
  }
  return "blank";
}

/** Whether `name` is an attribute a field may write, exactly as listed. */
export function isManagedTextAttribute(name: unknown): name is ManagedTextAttribute {
  return (MANAGED_TEXT_ATTRIBUTES as readonly unknown[]).includes(name);
}

export type ManagedAttributeBindingName<Attribute extends ManagedTextAttribute> =
  `data-gomega-attr-${Attribute}`;
export type ManagedAttributeItemBindingName<Attribute extends ManagedTextAttribute> =
  `data-gomega-attr-${Attribute}-item`;

/** The binding that names the field an element's `attribute` holds. */
export function managedAttributeBindingName<Attribute extends ManagedTextAttribute>(
  attribute: Attribute,
): ManagedAttributeBindingName<Attribute> {
  return `${MANAGED_ATTRIBUTE_BINDING_PREFIX}${attribute}` as ManagedAttributeBindingName<Attribute>;
}

/** The binding that names the collection item that field's value belongs to. */
export function managedAttributeItemBindingName<Attribute extends ManagedTextAttribute>(
  attribute: Attribute,
): ManagedAttributeItemBindingName<Attribute> {
  return `${managedAttributeBindingName(attribute)}${MANAGED_ATTRIBUTE_ITEM_BINDING_SUFFIX}` as ManagedAttributeItemBindingName<Attribute>;
}

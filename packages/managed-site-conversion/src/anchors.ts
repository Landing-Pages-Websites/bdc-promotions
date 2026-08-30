/**
 * Anchor paths are the ONLY source of identity in this tool.
 *
 * An anchor path is a chain of *named source facts*. Every segment is a name
 * that a developer wrote deliberately: a component identifier, an `id`
 * attribute (which is also a URL fragment target), an element tag, an attribute
 * name, a module-level binding, or an object-literal property name.
 *
 * Deliberately NOT anchor material, because none of it is durable:
 *   - visible text          (changes on every copy edit)
 *   - DOM / sibling order   (changes when a section moves)
 *   - array index           (changes when an item is reordered)
 *   - file name or path     (changes when a component is extracted)
 *   - external URL literals (a customer edit changes the destination)
 */

export type AnchorSegment =
  /** A uniquely-named component declaration. Survives file moves. */
  | { readonly kind: "component"; readonly name: string }
  /** A JSX element carrying a literal `id`, or a unique landmark tag. */
  | { readonly kind: "region"; readonly name: string }
  /** An element role: its tag, optionally the attribute the value flows into. */
  | { readonly kind: "role"; readonly tag: string; readonly attribute: string | null }
  /** A durable discriminator when several siblings share a role. */
  | { readonly kind: "discriminator"; readonly value: string }
  /** A module-level binding iterated to produce a repeated region. */
  | { readonly kind: "binding"; readonly name: string }
  /** An object-literal property name inside an iterated binding. */
  | { readonly kind: "property"; readonly name: string }
  /** The direct text run of an element that also has element children. */
  | { readonly kind: "text" };

export type AnchorPath = readonly AnchorSegment[];

const SEGMENT_SEPARATOR = "/";

/**
 * A rendered anchor is compared as a STRING, so a name containing the
 * separator would let two different paths render identically:
 * `copy["a/b"]` and `copy.a.b` are different properties and would both come
 * out as `each:copy/prop:a/b`. The gate would then merge readings of two
 * values and keep one of them.
 *
 * Escaping is done once, here, for every segment kind — a property name is
 * only the first place a separator can appear, and an `id` attribute or a
 * component name can carry one too.
 */
function escapeSegmentName(name: string): string {
  return name.replaceAll("~", "~0").replaceAll(SEGMENT_SEPARATOR, "~1");
}

function renderSegment(segment: AnchorSegment): string {
  switch (segment.kind) {
    case "component":
      return `component:${escapeSegmentName(segment.name)}`;
    case "region":
      return `region:${escapeSegmentName(segment.name)}`;
    case "role":
      return segment.attribute === null
        ? `role:${escapeSegmentName(segment.tag)}`
        : `role:${escapeSegmentName(segment.tag)}#${escapeSegmentName(segment.attribute)}`;
    case "discriminator":
      return `at:${escapeSegmentName(segment.value)}`;
    case "binding":
      return `each:${escapeSegmentName(segment.name)}`;
    case "property":
      return `prop:${escapeSegmentName(segment.name)}`;
    case "text":
      return "text";
  }
}

/** Stable, human-readable rendering. This string is the ledger key. */
export function renderAnchor(path: AnchorPath): string {
  return path.map(renderSegment).join(SEGMENT_SEPARATOR);
}

export function extendAnchor(path: AnchorPath, ...segments: AnchorSegment[]): AnchorPath {
  return [...path, ...segments];
}

/** Friendly words for element roles. Presentation only, never identity. */
const ROLE_WORDS: ReadonlyMap<string, string> = new Map([
  ["a", "link"],
  ["p", "text"],
  ["span", "text"],
  ["li", "item"],
  ["blockquote", "quote"],
  ["img", "image"],
  ["Image", "image"],
  ["h1", "heading"],
  ["h2", "heading"],
  ["h3", "heading"],
  ["h4", "heading"],
  ["h5", "heading"],
  ["h6", "heading"],
  ["aria-label", "accessibility label"],
  ["aria-describedby", "accessibility description"],
]);

function segmentWords(segment: AnchorSegment): readonly string[] {
  if (segment.kind === "role" && segment.attribute !== null) {
    return words(ROLE_WORDS.get(segment.attribute) ?? segment.attribute);
  }
  if (segment.kind === "role") return words(ROLE_WORDS.get(segment.tag) ?? segment.tag);
  if (segment.kind === "discriminator") return discriminatorWords(segment.value);
  if (segment.kind === "text") return ["text"];
  if (segment.kind === "component") return words(segment.name);
  if (segment.kind === "region") return words(segment.name);
  if (segment.kind === "binding") return words(segment.name);
  return words(segment.name);
}

function discriminatorWords(value: string): readonly string[] {
  if (value === "#") return ["self"];
  if (value.startsWith("#")) return words(value.slice(1));
  if (value.startsWith("const:")) return words(value.slice("const:".length));
  const basename = value.split("/").at(-1) ?? value;
  return words(basename.replace(/\.[A-Za-z0-9]+$/u, ""));
}

function words(raw: string): readonly string[] {
  return raw
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .split(/[^A-Za-z0-9]+/u)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
}

/**
 * Pointer tokens use the raw structural name, never the friendly synonym.
 *
 * A role names an element AND the attribute a value flows into, and dropping
 * the element made those two facts one: `<PageHero imageAlt=…>` and
 * `<FeatureRow imageAlt=…>` on one page are different values that both
 * addressed `/…/imageAlt/text`, so emission wrote one over the other. The
 * anchors were always distinct; only the address collapsed them.
 */
function structuralWords(segment: AnchorSegment): readonly string[] {
  switch (segment.kind) {
    case "role":
      return segment.attribute === null
        ? words(segment.tag)
        : [...words(segment.tag), ...words(segment.attribute)];
    case "discriminator":
      return discriminatorWords(segment.value);
    case "text":
      return ["text"];
    default:
      return words(segment.name);
  }
}

function camelCase(parts: readonly string[]): string {
  if (parts.length === 0) return "value";
  const [head, ...rest] = parts;
  return [head!, ...rest.map((word) => word[0]!.toUpperCase() + word.slice(1))].join("");
}

function slugSegment(segment: AnchorSegment): string {
  return camelCase(structuralWords(segment));
}

function escapePointerToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

/**
 * The content address a proposed field resolves through. It is *derived* from
 * the anchor, never the other way round: the stable ID is keyed on the anchor,
 * so a pointer rename is a resolver change, not an identity change.
 */
export function anchorToJsonPointer(path: AnchorPath): string {
  const tokens = path.map((segment) => escapePointerToken(slugSegment(segment)));
  if (tokens.length === 0) return "/value";
  return `/${tokens.join("/")}`;
}

/**
 * A readable label built from the trailing role, discriminator and text
 * segments. Presentation only — never used for identity or grouping.
 */
export function humaniseAnchorTail(path: AnchorPath): string {
  const tail = path.filter(
    (segment) => segment.kind !== "component" && segment.kind !== "region",
  );
  const parts = tail.slice(-3).flatMap(segmentWords);
  const unique = parts.filter((word, index) => parts.indexOf(word) === index);
  if (unique.length === 0) return "Value";
  const phrase = unique.join(" ");
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

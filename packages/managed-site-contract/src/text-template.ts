/**
 * Text whose words a customer edits while the numbers in it stay the site's:
 * "{count} networks". One module states the rule a value is held to, renders a
 * value with the site's numbers, and reads the numbers back out of rendered
 * text, so the three cannot drift.
 *
 * It imports nothing but the error class, so a client component can render a
 * template without pulling in the rest of the package (which reads
 * `node:crypto`): it is also exported on its own, as
 * `@landing-pages-websites/managed-site-contract/text-template`.
 *
 * THE VALUE RULE, which megaseo-web's CMS states again in SQL and in
 * TypeScript and which `cms-text-template-rule-cases.json` holds all three to:
 *
 * 1. Each declared placeholder's token, `{name}` exactly as declared, appears
 *    exactly once.
 * 2. With every declared token removed, no `{` or `}` is left.
 *
 * Together they mean a value is literal words around exactly the declared
 * tokens: a removed, duplicated or renamed placeholder, `{ count }`, `{Count}`,
 * a stray or literal brace, and an undeclared `{other}` are all refused, and a
 * customer cannot type a brace at all. Both steps are plain substring
 * operations, so the SQL twin is `replace()` and a length difference, never a
 * regular expression. Length is the field's ordinary `minLength`/`maxLength`
 * in code points, measured on the stored text with each token as written.
 */
import { ManagedSiteContractError } from "./errors.js";

/** A placeholder name: what goes between the braces. */
export const MANAGED_TEXT_TEMPLATE_PLACEHOLDER_NAME = /^[a-z][a-z0-9_]{0,31}$/;
export const MANAGED_TEXT_TEMPLATE_MAX_PLACEHOLDERS = 4;
export const MANAGED_TEXT_TEMPLATE_MAX_INTEGER_DIGITS = 8;
/** Intl's cardinal plural categories, in CLDR's order. */
export const MANAGED_TEXT_TEMPLATE_PLURAL_CATEGORIES = Object.freeze([
  "zero",
  "one",
  "two",
  "few",
  "many",
  "other",
] as const);

export type ManagedTextTemplatePluralCategory =
  (typeof MANAGED_TEXT_TEMPLATE_PLURAL_CATEGORIES)[number];

export interface ManagedTextTemplatePlaceholderV1 {
  readonly name: string;
  /** Zero-padding, as `String(n).padStart(minimumIntegerDigits, "0")` would. */
  readonly minimumIntegerDigits: number;
  /** Whether a large number is written with the locale's group separator. */
  readonly grouping: boolean;
}

/**
 * Which plural form a field is. A word that changes with a number ("1 network",
 * "2 networks") is one field per form, each declaring the category it is the
 * text for; the site renders whichever the number selects.
 */
export interface ManagedTextTemplatePluralV1 {
  readonly placeholder: string;
  readonly category: ManagedTextTemplatePluralCategory;
}

export interface ManagedTextTemplateV1 {
  /** A canonical BCP 47 tag: the locale numbers are formatted and plurals selected in. */
  readonly locale: string;
  readonly placeholders: readonly ManagedTextTemplatePlaceholderV1[];
  readonly plural: ManagedTextTemplatePluralV1 | null;
}

/** One plural form of a template: its declaration and the customer's text. */
export interface ManagedTextTemplateFormV1 {
  readonly template: ManagedTextTemplateV1;
  readonly text: string;
}

export type ManagedTextTemplateInputs = Readonly<Record<string, number>>;

/**
 * What the value rule reads of a declaration: its placeholders' names. A
 * template and a search pattern both satisfy it.
 */
export interface ManagedTokenDeclarationV1 {
  readonly placeholders: readonly { readonly name: string }[];
}

/** The item text a search pattern's placeholders are filled with, by name. */
export type ManagedSeoPatternInputs = Readonly<Record<string, string>>;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

export function managedTextTemplateToken(name: string): string {
  return `{${name}}`;
}

function occurrences(text: string, token: string): number {
  return text.split(token).length - 1;
}

/**
 * Why a value breaks the rule, or `null` when it keeps it. The reasons name the
 * CMS's: `placeholder_missing`, `placeholder_repeated`, `stray_brace`.
 */
export function managedTextTemplateRefusal(
  template: ManagedTokenDeclarationV1,
  text: string,
): "placeholder_missing" | "placeholder_repeated" | "stray_brace" | null {
  let remainder = text;
  for (const { name } of template.placeholders) {
    const token = managedTextTemplateToken(name);
    const count = occurrences(text, token);
    if (count === 0) return "placeholder_missing";
    if (count > 1) return "placeholder_repeated";
    remainder = remainder.replaceAll(token, "");
  }
  return /[{}]/u.test(remainder) ? "stray_brace" : null;
}

/** Whether a locale tag is canonical and one this runtime formats and pluralizes in. */
export function isSupportedManagedTextTemplateLocale(locale: string): boolean {
  try {
    const [canonical] = Intl.getCanonicalLocales(locale);
    return (
      canonical === locale &&
      Intl.PluralRules.supportedLocalesOf([locale]).length === 1 &&
      Intl.NumberFormat.supportedLocalesOf([locale]).length === 1
    );
  } catch {
    return false;
  }
}

/** The categories a locale's cardinal plural rules can select. */
export function managedTextTemplatePluralCategories(
  locale: string,
): readonly ManagedTextTemplatePluralCategory[] {
  const categories = pluralRulesFor(locale).resolvedOptions().pluralCategories;
  return MANAGED_TEXT_TEMPLATE_PLURAL_CATEGORIES.filter((category) =>
    (categories as readonly string[]).includes(category),
  );
}

// Building an Intl object is the expensive part of a render, and a page renders
// one template many times, so each is built once per locale and format.
const formatters = new Map<string, Intl.NumberFormat>();
const pluralRules = new Map<string, Intl.PluralRules>();

function formatterFor(
  locale: string,
  placeholder: ManagedTextTemplatePlaceholderV1,
): Intl.NumberFormat {
  const key = `${locale}|${String(placeholder.minimumIntegerDigits)}|${String(placeholder.grouping)}`;
  let formatter = formatters.get(key);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      minimumIntegerDigits: placeholder.minimumIntegerDigits,
      numberingSystem: "latn",
      useGrouping: placeholder.grouping,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

function pluralRulesFor(locale: string): Intl.PluralRules {
  let rules = pluralRules.get(locale);
  if (rules === undefined) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  return rules;
}

function assertInputs(
  template: ManagedTextTemplateV1,
  inputs: ManagedTextTemplateInputs,
): void {
  const names = template.placeholders.map((placeholder) => placeholder.name);
  const given = Object.keys(inputs);
  const exact =
    given.length === names.length && names.every((name) => Object.hasOwn(inputs, name));
  if (!exact) {
    fail("TEXT_TEMPLATE_INPUTS", `A template needs exactly ${names.join(", ")}`);
  }
  for (const name of names) {
    if (!Number.isSafeInteger(inputs[name])) {
      fail("TEXT_TEMPLATE_INPUTS", `${name} must be a safe integer`);
    }
  }
}

function assertText(template: ManagedTextTemplateV1, text: string): void {
  if (managedTextTemplateRefusal(template, text) !== null) {
    fail("TEXT_TEMPLATE_VALUE", "Text does not hold exactly its declared placeholders");
  }
}

/**
 * The text a page shows: each token replaced by its number, formatted in the
 * template's locale with Latin digits. Throws on a text that breaks the rule
 * (the contract refuses it, so a site never meets one) and on inputs that are
 * not exactly the placeholders as safe integers, which is the calling code's
 * mistake and meets its developer at build time.
 */
export function renderManagedTextTemplateV1(
  template: ManagedTextTemplateV1,
  text: string,
  inputs: ManagedTextTemplateInputs,
): string {
  assertText(template, text);
  assertInputs(template, inputs);
  return template.placeholders.reduce((rendered, placeholder) => {
    // `+ 0` turns -0 into 0, which Intl would otherwise write as "-0".
    const value = (inputs[placeholder.name] as number) + 0;
    const formatted = formatterFor(template.locale, placeholder).format(value);
    return rendered.replaceAll(managedTextTemplateToken(placeholder.name), formatted);
  }, text);
}

/** The plural category a number selects in a locale. */
export function managedTextTemplatePluralCategoryV1(
  locale: string,
  value: number,
): ManagedTextTemplatePluralCategory {
  return pluralRulesFor(locale).select(value) as ManagedTextTemplatePluralCategory;
}

function samePlaceholders(left: ManagedTextTemplateV1, right: ManagedTextTemplateV1): boolean {
  return (
    left.locale === right.locale &&
    left.placeholders.length === right.placeholders.length &&
    left.placeholders.every((placeholder, index) => {
      const other = right.placeholders[index];
      return (
        other !== undefined &&
        other.name === placeholder.name &&
        other.minimumIntegerDigits === placeholder.minimumIntegerDigits &&
        other.grouping === placeholder.grouping
      );
    })
  );
}

/**
 * Renders the form the number selects from a word's plural forms, falling back
 * to `other` when the locale selects a category no form declares. Every form
 * must be the same template (locale, placeholders, plural placeholder) with a
 * distinct category, and one must be `other`; anything else is the calling
 * code's mistake.
 */
export function renderManagedPluralTextV1(
  forms: readonly ManagedTextTemplateFormV1[],
  inputs: ManagedTextTemplateInputs,
): string {
  const [first] = forms;
  const plural = first?.template.plural;
  if (first === undefined || plural == null) {
    fail("TEXT_TEMPLATE_FORMS", "Plural forms must declare a plural");
  }
  const byCategory = new Map<string, ManagedTextTemplateFormV1>();
  for (const form of forms) {
    const formPlural = form.template.plural;
    if (
      formPlural?.placeholder !== plural.placeholder ||
      byCategory.has(formPlural.category) ||
      !samePlaceholders(form.template, first.template)
    ) {
      fail("TEXT_TEMPLATE_FORMS", "Plural forms must be one template");
    }
    byCategory.set(formPlural.category, form);
  }
  const fallback = byCategory.get("other");
  if (fallback === undefined) fail("TEXT_TEMPLATE_FORMS", "Plural forms need an other form");
  assertInputs(first.template, inputs);
  const category = managedTextTemplatePluralCategoryV1(
    first.template.locale,
    inputs[plural.placeholder] as number,
  );
  const form = byCategory.get(category) ?? fallback;
  return renderManagedTextTemplateV1(form.template, form.text, inputs);
}

/** The integer a formatted number states, or `null` when it states none. */
function integerOf(formatted: string): number | null {
  // A locale may put a direction mark before the sign (Arabic writes U+200E -5).
  const negative = /^[^0-9]*[-\u2212]/u.test(formatted);
  const digits = formatted.replace(/[^0-9]/gu, "");
  if (digits.length === 0) return null;
  const value = Number(digits) * (negative ? -1 : 1);
  return Number.isSafeInteger(value) ? value : null;
}

/** Longer than any safe integer this module formats, signs and separators included. */
const MAX_FORMATTED_LENGTH = 48;

/** A placeholder at a position in the text, and the literal that follows it. */
interface TemplatePart {
  readonly placeholder: ManagedTextTemplatePlaceholderV1;
  readonly literal: string;
}

/** The text as its leading literal and each placeholder in the order it appears. */
function partsOf(
  template: ManagedTextTemplateV1,
  text: string,
): { readonly lead: string; readonly parts: readonly TemplatePart[] } {
  const positioned = template.placeholders
    .map((placeholder) => ({
      placeholder,
      at: text.indexOf(managedTextTemplateToken(placeholder.name)),
    }))
    .sort((left, right) => left.at - right.at);
  const parts = positioned.map(({ placeholder, at }, index) => {
    const end = at + managedTextTemplateToken(placeholder.name).length;
    const next = positioned[index + 1]?.at ?? text.length;
    return { placeholder, literal: text.slice(end, next) };
  });
  return { lead: text.slice(0, positioned[0]?.at ?? text.length), parts };
}

/**
 * Every assignment of numbers that renders `rendered` from `parts[index..]`
 * starting at `from`: each placeholder takes a candidate span that is exactly
 * a number formatted in its own format, followed by its literal.
 */
function assignments(
  locale: string,
  parts: readonly TemplatePart[],
  rendered: string,
  from: number,
  index: number,
): readonly (readonly number[])[] {
  const part = parts[index];
  if (part === undefined) return from === rendered.length ? [[]] : [];
  const found: (readonly number[])[] = [];
  const last = Math.min(rendered.length, from + MAX_FORMATTED_LENGTH);
  for (let end = from + 1; end <= last; end += 1) {
    if (!rendered.startsWith(part.literal, end)) continue;
    const span = rendered.slice(from, end);
    const value = integerOf(span);
    if (value === null || formatterFor(locale, part.placeholder).format(value) !== span) continue;
    for (const rest of assignments(locale, parts, rendered, end + part.literal.length, index + 1)) {
      found.push([value, ...rest]);
      if (found.length > 1) return found;
    }
  }
  return found;
}

/**
 * The numbers a page's text was rendered with, or `null` when the text is not
 * this template rendered with any, or is this template rendered with more than
 * one set of numbers ("{a}{b}" rendered "123"). Each span is held to its
 * placeholder's own format, so a match is exactly
 * `renderManagedTextTemplateV1(template, text, inputs)`: a coverage gate reads
 * it as "this text is this field, rendered".
 */
export function matchManagedTextTemplateV1(
  template: ManagedTextTemplateV1,
  text: string,
  rendered: string,
): ManagedTextTemplateInputs | null {
  if (managedTextTemplateRefusal(template, text) !== null) return null;
  const { lead, parts } = partsOf(template, text);
  if (!rendered.startsWith(lead)) return null;
  const found = assignments(template.locale, parts, rendered, lead.length, 0);
  const [only] = found;
  if (found.length !== 1 || only === undefined) return null;
  return Object.fromEntries(parts.map((part, index) => [part.placeholder.name, only[index] as number]));
}

/**
 * A generated page's search title or description from its pattern: each token
 * replaced by the item text it reads, verbatim (no `$` substitution, no
 * escaping; a renderer escapes for the element it writes into). Throws on a
 * text that breaks the value rule and on inputs that are not exactly the
 * placeholders as strings, which is the calling code's mistake.
 */
export function renderManagedSeoPatternV1(
  pattern: ManagedTokenDeclarationV1,
  text: string,
  inputs: ManagedSeoPatternInputs,
): string {
  if (managedTextTemplateRefusal(pattern, text) !== null) {
    fail("TEXT_TEMPLATE_VALUE", "Text does not hold exactly its declared placeholders");
  }
  const names = pattern.placeholders.map((placeholder) => placeholder.name);
  const given = Object.keys(inputs);
  const exact =
    given.length === names.length &&
    names.every((name) => Object.hasOwn(inputs, name) && typeof inputs[name] === "string");
  if (!exact) {
    fail("TEXT_TEMPLATE_INPUTS", `A pattern needs exactly ${names.join(", ")} as text`);
  }
  // One pass with a function replacer, so item text holding another token's
  // spelling or a `$&` is written as it is and never re-read. The value rule
  // left no brace in the text but the declared tokens.
  return text.replace(/\{([a-z][a-z0-9_]*)\}/gu, (_token, name: string) => inputs[name] as string);
}

/**
 * What a generated page serves in a search slot that has a pattern: the item's
 * own override when it holds any non-space text, else the pattern filled with
 * the item's text. "Non-space" is JavaScript's `trim()`, the one place this is
 * decided, so the site and the editor's preview agree.
 */
export function renderManagedGeneratedSeoTextV1(
  override: string,
  pattern: ManagedTokenDeclarationV1,
  text: string,
  inputs: ManagedSeoPatternInputs,
): string {
  return override.trim() !== "" ? override : renderManagedSeoPatternV1(pattern, text, inputs);
}

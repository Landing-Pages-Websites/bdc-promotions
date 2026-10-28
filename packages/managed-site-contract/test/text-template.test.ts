import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  managedTextTemplatePluralCategories,
  managedTextTemplateRefusal,
  matchManagedTextTemplateV1,
  parseManagedFieldDescriptor,
  renderManagedPluralTextV1,
  renderManagedTextTemplateV1,
  validateManagedFieldValue,
  type ManagedTextTemplateV1,
} from "../src/index.js";
import * as subpath from "../src/text-template.js";
import { isCompatibilityFieldWidened } from "../src/contract-compatibility-constraints.js";
import { headingTextField, plainTextField, stableId } from "./schema-fixtures.js";

/**
 * Template text held to the adversarial table megaseo-web's CMS writer and its
 * TypeScript twin are held to. A verdict reached differently here is a value
 * the CMS saves and Site Guard then refuses, or the reverse.
 */
type Outcome = "accepted" | "rejected";

interface Limits {
  readonly minLength: number;
  readonly maxLength: number;
  readonly newlines: "forbid" | "allow";
}

interface ValueCase {
  readonly name: string;
  readonly template: string;
  readonly text: string;
  readonly limits?: Partial<Limits>;
  readonly expected: { readonly outcome: Outcome; readonly reason?: string };
}

interface RenderCase {
  readonly name: string;
  readonly template: string;
  readonly text: string;
  readonly inputs: Readonly<Record<string, number>>;
  readonly expected: { readonly rendered?: string; readonly match?: boolean; readonly error?: true };
}

interface TemplateTable {
  readonly defaultLimits: Limits;
  readonly templates: Readonly<Record<string, ManagedTextTemplateV1>>;
  readonly valueCases: readonly ValueCase[];
  readonly renderCases: readonly RenderCase[];
}

const TABLE = JSON.parse(
  readFileSync(new URL("./cms-text-template-rule-cases.json", import.meta.url), "utf8"),
) as TemplateTable;

function templateOf(name: string): ManagedTextTemplateV1 {
  const template = TABLE.templates[name];
  assert.ok(template, `unknown template ${name}`);
  return template;
}

function templateField(
  template: unknown,
  limits: Partial<Limits> = {},
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...plainTextField(),
    ...overrides,
    constraints: { ...TABLE.defaultLimits, ...limits, template },
  };
}

function textValue(text: string): Record<string, unknown> {
  return { fieldId: stableId("field"), owner: { kind: "site" }, type: "plain_text", value: text };
}

function outcome(check: () => unknown): Outcome {
  try {
    check();
    return "accepted";
  } catch {
    return "rejected";
  }
}

describe("template text values (shared CMS table)", () => {
  for (const entry of TABLE.valueCases) {
    it(entry.name, () => {
      const field = templateField(templateOf(entry.template), entry.limits);
      parseManagedFieldDescriptor(field);
      assert.equal(
        outcome(() => validateManagedFieldValue(field, textValue(entry.text))),
        entry.expected.outcome,
      );
    });
  }

  it("names the CMS's reason for every token refusal in the table", () => {
    const tokenReasons = new Set(["placeholder_missing", "placeholder_repeated", "stray_brace"]);
    for (const entry of TABLE.valueCases) {
      const reason = managedTextTemplateRefusal(templateOf(entry.template), entry.text);
      const expected = entry.expected.reason;
      if (expected !== undefined && tokenReasons.has(expected)) {
        assert.equal(reason, expected, entry.name);
      } else if (entry.expected.outcome === "accepted") {
        assert.equal(reason, null, entry.name);
      }
    }
  });

  it("leaves a plain-text field with no template exactly as it was", () => {
    const field = plainTextField();
    for (const text of ["{count} networks", "{", "}", "{{x}}"]) {
      assert.equal(outcome(() => validateManagedFieldValue(field, textValue(text))), "accepted");
    }
  });
});

/** What a match reads back: -0 renders as 0, so it reads as 0. */
function normalizedZero(inputs: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(inputs).map(([name, value]) => [name, value + 0]));
}

describe("rendering template text (shared CMS table)", () => {
  for (const entry of TABLE.renderCases) {
    it(entry.name, () => {
      const template = templateOf(entry.template);
      const render = () => renderManagedTextTemplateV1(template, entry.text, entry.inputs);
      if (entry.expected.error) {
        assert.throws(render, { name: "ManagedSiteContractError" });
        return;
      }
      const rendered = render();
      assert.equal(rendered, entry.expected.rendered);
      const read = matchManagedTextTemplateV1(template, entry.text, rendered);
      assert.deepEqual(read, entry.expected.match === false ? null : normalizedZero(entry.inputs));
    });
  }

  it("writes negative zero as 0", () => {
    assert.equal(renderManagedTextTemplateV1(templateOf("count"), "{count}", { count: -0 }), "0");
  });

  it("round-trips other locales' signs and group separators", () => {
    const cases: readonly [string, boolean, number][] = [
      ["ar", false, -5],
      ["de", true, 1_234_567],
      ["fr", true, -1_234_567],
      ["hi", true, 12_345_678],
    ];
    for (const [locale, grouping, count] of cases) {
      const template = { ...templateOf("count"), locale, placeholders: [{ name: "count", minimumIntegerDigits: 1, grouping }] };
      const rendered = renderManagedTextTemplateV1(template, "{count} x", { count });
      assert.match(rendered, /[0-9]/u, locale);
      assert.deepEqual(matchManagedTextTemplateV1(template, "{count} x", rendered), { count }, locale);
    }
  });

  it("refuses non-finite numbers", () => {
    for (const count of [Number.NaN, Number.POSITIVE_INFINITY, -0.5]) {
      assert.throws(() => renderManagedTextTemplateV1(templateOf("count"), "{count}", { count }));
    }
  });

  it("matches only text that is exactly the template rendered", () => {
    const template = templateOf("count");
    const cases: readonly [string, Record<string, number> | null][] = [
      ["3 networks", { count: 3 }],
      ["-3 networks", { count: -3 }],
      ["03 networks", null],
      ["3  networks", null],
      ["3 network", null],
      ["three networks", null],
      ["3.5 networks", null],
      ["1,234 networks", null],
      [" networks", null],
      ["99999999999999999999 networks", null],
    ];
    for (const [rendered, expected] of cases) {
      assert.deepEqual(matchManagedTextTemplateV1(template, "{count} networks", rendered), expected, rendered);
    }
    assert.deepEqual(
      matchManagedTextTemplateV1(templateOf("grouped"), "{count} venues", "1,234 venues"),
      { count: 1234 },
    );
    assert.deepEqual(matchManagedTextTemplateV1(templateOf("step"), "Step {step}", "Step 07"), { step: 7 });
    assert.equal(matchManagedTextTemplateV1(templateOf("step"), "Step {step}", "Step 7"), null);
    assert.equal(matchManagedTextTemplateV1(template, "networks", "networks"), null);
  });

  it("is importable on its own, for a client component", () => {
    assert.equal(subpath.renderManagedTextTemplateV1, renderManagedTextTemplateV1);
    const imports = readFileSync(new URL("../src/text-template.ts", import.meta.url), "utf8")
      .split("\n")
      .filter((line) => line.startsWith("import"));
    assert.deepEqual(imports, ['import { ManagedSiteContractError } from "./errors.js";']);
  });
});

describe("plural forms", () => {
  const one = { template: templateOf("count_one"), text: "{count} network" };
  const other = { template: templateOf("count_other"), text: "{count} networks" };

  it("selects the form English plural rules choose for each number", () => {
    const rendered = [0, 1, 2, -1, 1_000_000].map((count) => renderManagedPluralTextV1([one, other], { count }));
    assert.deepEqual(rendered, ["0 networks", "1 network", "2 networks", "-1 network", "1000000 networks"]);
  });

  it("falls back to other when a selected category has no form", () => {
    assert.equal(renderManagedPluralTextV1([other], { count: 1 }), "1 networks");
  });

  it("selects among every Arabic category", () => {
    const categories = managedTextTemplatePluralCategories("ar");
    assert.deepEqual(categories, ["zero", "one", "two", "few", "many", "other"]);
    const forms = categories.map((category) => ({
      template: { ...templateOf("count"), locale: "ar", plural: { placeholder: "count", category } },
      text: `${category} {count}`,
    }));
    assert.equal(renderManagedPluralTextV1(forms, { count: 0 }), "zero 0");
    assert.equal(renderManagedPluralTextV1(forms, { count: 2 }), "two 2");
    assert.equal(renderManagedPluralTextV1(forms, { count: 5 }), "few 5");
    assert.equal(renderManagedPluralTextV1(forms, { count: 11 }), "many 11");
  });

  it("refuses forms that are not one template", () => {
    const refusals: readonly (readonly { template: ManagedTextTemplateV1; text: string }[])[] = [
      [],
      [{ template: templateOf("count"), text: "{count}" }],
      [one],
      [one, one, other],
      [one, { ...other, template: { ...other.template, locale: "en-GB" } }],
      [one, { template: { ...templateOf("step"), plural: { placeholder: "step", category: "other" } }, text: "{step}" }],
    ];
    for (const forms of refusals) {
      assert.throws(() => renderManagedPluralTextV1(forms, { count: 1 }), { name: "ManagedSiteContractError" });
    }
  });
});

describe("template declarations", () => {
  const base = templateOf("count");
  const accepted: readonly [string, unknown, Record<string, unknown>?][] = [
    ["English", base],
    ["British English", { ...base, locale: "en-GB" }],
    ["Arabic", { ...base, locale: "ar" }],
    ["plural one", templateOf("count_one")],
    ["four placeholders", { ...base, placeholders: ["a", "b", "c", "d"].map((name) => ({ ...base.placeholders[0], name })) }],
    ["label semantic", base, { semantic: "label" }],
    ["caption semantic", base, { semantic: "caption" }],
  ];
  const rejected: readonly [string, unknown, Record<string, unknown>?, Partial<Limits>?][] = [
    ["non-canonical locale case", { ...base, locale: "EN" }],
    ["non-canonical region case", { ...base, locale: "en-us" }],
    ["unsupported locale", { ...base, locale: "zz" }],
    ["malformed locale", { ...base, locale: "en_US" }],
    ["no placeholders", { ...base, placeholders: [] }],
    ["five placeholders", { ...base, placeholders: ["a", "b", "c", "d", "e"].map((name) => ({ ...base.placeholders[0], name })) }],
    ["duplicate placeholder", { ...base, placeholders: [base.placeholders[0], base.placeholders[0]] }],
    ["upper-case name", { ...base, placeholders: [{ ...base.placeholders[0], name: "Count" }] }],
    ["hyphenated name", { ...base, placeholders: [{ ...base.placeholders[0], name: "venue-count" }] }],
    ["name with a brace", { ...base, placeholders: [{ ...base.placeholders[0], name: "count}" }] }],
    ["no padding digits", { ...base, placeholders: [{ ...base.placeholders[0], minimumIntegerDigits: 0 }] }],
    ["too many padding digits", { ...base, placeholders: [{ ...base.placeholders[0], minimumIntegerDigits: 9 }] }],
    ["missing grouping", { ...base, placeholders: [{ name: "count", minimumIntegerDigits: 1 }] }],
    ["plural on an undeclared placeholder", { ...base, plural: { placeholder: "total", category: "one" } }],
    ["plural category English never selects", { ...base, plural: { placeholder: "count", category: "few" } }],
    ["plural absent rather than null", { locale: "en", placeholders: base.placeholders }],
    ["unknown key", { ...base, fallback: "x" }],
    ["structured semantic", base, { semantic: "phone" }],
    ["search title semantic", base, { semantic: "seo_title" }],
    ["maxLength shorter than the tokens", base, {}, { minLength: 0, maxLength: 6 }],
  ];

  for (const [name, template, overrides] of accepted) {
    it(`accepts ${name}`, () => {
      assert.doesNotThrow(() => parseManagedFieldDescriptor(templateField(template, {}, overrides)));
    });
  }
  for (const [name, template, overrides, limits] of rejected) {
    it(`refuses ${name}`, () => {
      assert.throws(() => parseManagedFieldDescriptor(templateField(template, limits, overrides)));
    });
  }

  it("refuses a template on heading text", () => {
    const heading = headingTextField();
    assert.throws(() =>
      parseManagedFieldDescriptor({
        ...heading,
        constraints: { ...(heading.constraints as object), template: base },
      }),
    );
  });

  it("lists the plural categories a locale can select", () => {
    assert.deepEqual(managedTextTemplatePluralCategories("en"), ["one", "other"]);
    assert.deepEqual(managedTextTemplatePluralCategories("ja"), ["other"]);
  });
});

describe("template compatibility", () => {
  const base = templateOf("count");
  const field = (template: unknown, limits: Partial<Limits> = {}) =>
    parseManagedFieldDescriptor(templateField(template, limits));
  const plain = parseManagedFieldDescriptor(plainTextField());

  const cases: readonly [string, ReturnType<typeof field>, ReturnType<typeof field>, boolean][] = [
    ["the same template", field(base), field(base), true],
    ["the same template with a longer maximum", field(base), field(base, { maxLength: 80 }), true],
    ["the same template with a shorter maximum", field(base), field(base, { maxLength: 40 }), false],
    ["a template added", plain, field(base), false],
    ["a template dropped", field(base), parseManagedFieldDescriptor({ ...plainTextField(), constraints: TABLE.defaultLimits }), false],
    ["a placeholder renamed", field(base), field({ ...base, placeholders: [{ ...base.placeholders[0], name: "total" }] }), false],
    ["a placeholder added", field(base), field(templateOf("two")), false],
    ["a plural category changed", field(templateOf("count_one")), field(templateOf("count_other")), false],
    ["a plural added", field(base), field(templateOf("count_other")), false],
    ["the locale changed", field(base), field({ ...base, locale: "en-GB" }), false],
    ["the padding changed", field(base), field({ ...base, placeholders: [{ ...base.placeholders[0], minimumIntegerDigits: 2 }] }), false],
  ];
  for (const [name, production, candidate, widened] of cases) {
    it(`${widened ? "keeps" : "refuses"} ${name}`, () => {
      const fact = (descriptor: typeof production) => ({ kind: "rendered", descriptor }) as const;
      assert.equal(isCompatibilityFieldWidened(fact(production), fact(candidate)), widened);
    });
  }
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  managedLinkQueryString,
  managedRichTextLinkAttributesV1,
  parseManagedFieldDescriptor,
  parseManagedSiteContentDocument,
  parseManagedSiteContentValue,
  parseManagedSiteContractV1,
  validateManagedFieldValue,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import { isCompatibilityFieldWidened } from "../src/contract-compatibility-constraints.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";
import { linkField, stableId } from "./schema-fixtures.js";

/**
 * 0.41.0: an internal link destination may carry a query its field declares.
 *
 * Invariant: a destination's query is admitted only parameter by parameter
 * and value by value from its field's `allowedQueries` entry for the page it
 * names, compared exactly; it has one canonical spelling, which the one href
 * builder writes; and a prose link mark carries none.
 *
 * The shared table (`cms-link-query-cases.json`) is byte-identical in
 * megaseo-web, where the CMS's SQL rule and its TypeScript twin are held to
 * the same rows.
 */

type Json = Record<string, unknown>;
type Outcome = "accepted" | "rejected";

interface QueryTable {
  readonly pageId: string;
  readonly otherPageId: string;
  readonly base: Json;
  readonly policyCases: readonly {
    readonly name: string;
    readonly constraints?: Json;
    readonly expected: { readonly contract: Outcome; readonly cms: Outcome };
  }[];
  readonly destinationCases: readonly {
    readonly name: string;
    readonly constraints?: Json;
    readonly destination: unknown;
    readonly expected: { readonly outcome: Outcome; readonly reason: string | null };
  }[];
  readonly spellingCases: readonly { readonly query: Record<string, string>; readonly spelling: string }[];
}

const TABLE = JSON.parse(
  readFileSync(new URL("./cms-link-query-cases.json", import.meta.url), "utf8"),
) as QueryTable;

const ABSENT = "ABSENT";

function constraintsOf(overrides: Json | undefined): Json {
  const merged: Json = { ...TABLE.base, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === ABSENT) delete merged[key];
  }
  return merged;
}

function fieldWith(constraints: Json): Json {
  return { ...linkField(), constraints };
}

function outcome(check: () => unknown): Outcome {
  try {
    check();
    return "accepted";
  } catch {
    return "rejected";
  }
}

function linkValue(destination: unknown): Json {
  return {
    fieldId: stableId("field"),
    owner: { kind: "site" },
    type: "link",
    value: { label: "Get Started", destination, target: "same_window" },
  };
}

describe("a link destination's query, judged by the table shared with the CMS", () => {
  it("names the page the base declares its query on", () => {
    assert.equal(TABLE.pageId, stableId("page"));
    assert.notEqual(TABLE.otherPageId, TABLE.pageId);
  });

  it("runs both outcomes in every table", () => {
    assert.deepEqual(
      [...new Set(TABLE.destinationCases.map((entry) => entry.expected.outcome))].sort(),
      ["accepted", "rejected"],
    );
    assert.deepEqual(
      [...new Set(TABLE.policyCases.map((entry) => entry.expected.contract))].sort(),
      ["accepted", "rejected"],
    );
  });

  for (const entry of TABLE.policyCases) {
    it(`policy: ${entry.name}`, () => {
      const field = fieldWith(constraintsOf(entry.constraints));
      assert.equal(outcome(() => parseManagedFieldDescriptor(field)), entry.expected.contract);
    });
  }

  for (const entry of TABLE.destinationCases) {
    it(`destination: ${entry.name}`, () => {
      const field = fieldWith(constraintsOf(entry.constraints));
      // The table states only policies this package accepts for destinations.
      parseManagedFieldDescriptor(field);
      const verdict = outcome(() => validateManagedFieldValue(field, linkValue(entry.destination)));
      assert.equal(verdict, entry.expected.outcome);
    });
  }

  for (const entry of TABLE.spellingCases) {
    it(`spells ${JSON.stringify(entry.query)} as ${entry.spelling}`, () => {
      assert.equal(managedLinkQueryString(entry.query), entry.spelling);
      assert.equal(managedLinkQueryString(Object.fromEntries(Object.entries(entry.query).reverse())), entry.spelling);
    });
  }

  it("spells no query as nothing", () => {
    assert.equal(managedLinkQueryString(undefined), "");
  });
});

describe("a query name is matched as an own name, never through an object's prototype", () => {
  const field = fieldWith(
    constraintsOf({
      allowedQueries: [{ pageId: TABLE.pageId, parameters: [{ name: "constructor", values: ["x"] }] }],
    }),
  );
  const destination = (query: string): unknown =>
    JSON.parse(`{"kind":"internal","pageId":"${TABLE.pageId}","fragment":null,"query":${query}}`) as unknown;
  const cases: readonly [string, Outcome][] = [
    ['{"constructor":"x"}', "accepted"],
    ['{"constructor":"y"}', "rejected"],
    ['{"toString":"x"}', "rejected"],
    ['{"hasOwnProperty":"x"}', "rejected"],
    ['{"valueOf":"x"}', "rejected"],
    ['{"__proto__":"x"}', "rejected"],
  ];
  for (const [query, expected] of cases) {
    it(`${query} is ${expected}`, () => {
      assert.equal(outcome(() => validateManagedFieldValue(field, linkValue(destination(query)))), expected);
    });
  }

  it("reads a name written twice as JSON does, the last value, as the CMS's jsonb does", () => {
    const base = fieldWith(constraintsOf(undefined));
    const twice = (query: string) => outcome(() => validateManagedFieldValue(base, linkValue(destination(query))));
    assert.equal(twice('{"type":"admin","type":"strategy"}'), "accepted");
    assert.equal(twice('{"type":"strategy","type":"admin"}'), "rejected");
  });
});

describe("the href a query renders", () => {
  const pagePath = (pageId: string): string => (pageId === TABLE.pageId ? "/contact" : "/other");
  const href = (destination: Json): string =>
    managedRichTextLinkAttributesV1(
      { destination: destination as never, target: "same_window" },
      pagePath,
      (pageId, itemId) => `/services/${itemId}`,
    ).href;

  it("is path, then query, then fragment", () => {
    assert.equal(href({ kind: "internal", pageId: TABLE.pageId, fragment: null, query: { type: "strategy" } }), "/contact?type=strategy");
    assert.equal(
      href({ kind: "internal", pageId: TABLE.pageId, fragment: "form", query: { type: "rfp", source: "footer" } }),
      "/contact?source=footer&type=rfp#form",
    );
  });

  it("follows an item's path when the destination names one", () => {
    const itemId = stableId("item");
    assert.equal(
      href({ kind: "internal", pageId: TABLE.pageId, itemId, fragment: null, query: { type: "expert" } }),
      `/services/${itemId}?type=expert`,
    );
  });

  it("is unchanged for a destination with no query", () => {
    assert.equal(href({ kind: "internal", pageId: TABLE.pageId, fragment: "form" }), "/contact#form");
  });
});

describe("a prose link mark carries no query", () => {
  it("refuses a mark whose destination has one", () => {
    const value = {
      fieldId: stableId("field"),
      owner: { kind: "site" },
      type: "rich_text",
      value: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Get Started",
                marks: [
                  {
                    type: "link",
                    destination: { kind: "internal", pageId: TABLE.pageId, fragment: null, query: { type: "strategy" } },
                    target: "same_window",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    assert.throws(() => parseManagedSiteContentValue(value), /unrecognized_keys[\s\S]*query/u);
  });
});

function semantics(mutate: (fixture: ContentSemanticsFixture) => void): string {
  const fixture = contentSemanticsFixture();
  mutate(fixture);
  try {
    validateManagedSiteContractV1ContentSemantics(
      parseManagedSiteContractV1(fixture.contract),
      parseManagedSiteContentDocument(fixture.content),
    );
    return "accepted";
  } catch (error) {
    return error instanceof ManagedSiteContractError ? error.code : String(error);
  }
}

function fieldDescriptors(fixture: ContentSemanticsFixture): Json[] {
  const pages = fixture.contract.pages as Json[];
  const sectionFields = pages.flatMap((page) => (page.sections as Json[]).flatMap((section) => section.fields as Json[]));
  const itemFields = (fixture.contract.collections as Json[]).flatMap((collection) => collection.itemFields as Json[]);
  return [...sectionFields, ...itemFields];
}

function declareQuery(fixture: ContentSemanticsFixture, fieldId: string, pageId: string): void {
  const field = fieldDescriptors(fixture).find((descriptor) => descriptor.id === fieldId);
  if (field === undefined) throw new Error(`fixture lost ${fieldId}`);
  field.constraints = {
    ...(field.constraints as Json),
    allowedQueries: [{ pageId, parameters: [{ name: "type", values: ["strategy"] }] }],
  };
}

function setLinkQuery(fixture: ContentSemanticsFixture, fieldId: string, query: Json): void {
  const value = (fixture.content.values as Json[]).find((one) => one.fieldId === fieldId);
  if (value === undefined) throw new Error(`fixture lost ${fieldId}`);
  ((value.value as Json).destination as Json).query = query;
}

describe("a query in a whole site", () => {
  it("is accepted on a link field whose page the field declares it for", () => {
    assert.equal(
      semantics((f) => {
        declareQuery(f, f.ids.linkField, f.ids.homePage);
        setLinkQuery(f, f.ids.linkField, { type: "strategy" });
      }),
      "accepted",
    );
  });

  it("refuses a value the field does not declare", () => {
    assert.equal(
      semantics((f) => {
        declareQuery(f, f.ids.linkField, f.ids.homePage);
        setLinkQuery(f, f.ids.linkField, { type: "rfp" });
      }),
      "CONTENT_VALUE_POLICY",
    );
  });

  it("refuses an allowlist naming a page the contract does not declare", () => {
    assert.equal(semantics((f) => declareQuery(f, f.ids.linkField, fixtureId("page"))), "CONTRACT_REFERENCE_UNRESOLVED");
  });

  it("accepts an allowlist naming a generated page, for the item links it serves", () => {
    assert.equal(semantics((f) => declareQuery(f, f.ids.itemLinkField, f.ids.generatedPage)), "accepted");
  });
});

describe("compatibility of a field's declared queries", () => {
  const P = TABLE.pageId;
  const Q = TABLE.otherPageId;
  const page = (pageId: string, values: readonly string[], name = "type"): Json => ({
    pageId,
    parameters: [{ name, values }],
  });
  const cases: readonly { readonly name: string; readonly production: unknown; readonly candidate: unknown; readonly widened: boolean }[] = [
    { name: "none to one page", production: ABSENT, candidate: [page(P, ["a"])], widened: true },
    { name: "[] to absent", production: [], candidate: ABSENT, widened: true },
    { name: "a value is added", production: [page(P, ["a"])], candidate: [page(P, ["a", "b"])], widened: true },
    { name: "a page is added", production: [page(P, ["a"])], candidate: [page(P, ["a"]), page(Q, ["a"])], widened: true },
    {
      name: "a parameter is added",
      production: [page(P, ["a"])],
      candidate: [{ pageId: P, parameters: [{ name: "type", values: ["a"] }, { name: "source", values: ["x"] }] }],
      widened: true,
    },
    { name: "the same values in another order", production: [page(P, ["a", "b"])], candidate: [page(P, ["b", "a"])], widened: true },
    { name: "a value is removed", production: [page(P, ["a", "b"])], candidate: [page(P, ["a"])], widened: false },
    { name: "a page is removed", production: [page(P, ["a"]), page(Q, ["a"])], candidate: [page(P, ["a"])], widened: false },
    { name: "every page is removed", production: [page(P, ["a"])], candidate: ABSENT, widened: false },
    { name: "the page changes", production: [page(P, ["a"])], candidate: [page(Q, ["a"])], widened: false },
    { name: "the parameter is renamed", production: [page(P, ["a"])], candidate: [page(P, ["a"], "kind")], widened: false },
    { name: "a value changes case", production: [page(P, ["a"])], candidate: [page(P, ["A"])], widened: false },
  ];
  const field = (allowedQueries: unknown) =>
    ({
      kind: "rendered" as const,
      descriptor: parseManagedFieldDescriptor(fieldWith(constraintsOf({ allowedQueries }))),
    });
  for (const entry of cases) {
    it(`${entry.widened ? "widens" : "narrows"}: ${entry.name}`, () => {
      assert.equal(isCompatibilityFieldWidened(field(entry.production), field(entry.candidate)), entry.widened);
    });
  }
});

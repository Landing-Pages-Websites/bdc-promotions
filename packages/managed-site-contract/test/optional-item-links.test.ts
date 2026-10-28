import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  parseManagedCollectionDescriptor,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  projectManagedSiteContentDocumentV1,
  validateManagedSiteContentDocumentJsonSchema,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import { isCompatibilityFieldWidened } from "../src/contract-compatibility-constraints.js";
import type { ManagedCollectionItemField } from "../src/fields.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";
import { sourceProjectionFixture } from "./source-projection-fixture.js";

/**
 * 0.37.0: an item's link may be declared optional ("a case study with no
 * PDF"). Invariant: an item's link value is `null` only where its field is
 * declared optional; a `null` is no link (nothing rendered, no page named), and
 * no uniqueness rule may name such a field. Required may become optional,
 * never back.
 */

type JsonObject = Record<string, unknown>;

const PDF_POINTER = "/pdf";
const LINK_CONSTRAINTS = {
  labelConstraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
  authority: "internal_or_external",
  allowedSchemes: ["https"],
  allowedExternalHosts: [],
  externalHostPolicy: "any_https",
  fragmentPolicy: "forbid",
  allowedFragments: [],
  allowedTargets: ["same_window", "new_window"],
};

/** An item link field; an override of `undefined` leaves that key out, as JSON would. */
function pdfField(overrides: JsonObject = {}): JsonObject {
  const field: JsonObject = {
    id: fixtureId("field"),
    type: "link",
    classification: "customer_editable",
    capabilities: ["link.label.edit", "link.destination.edit", "link.target.edit"],
    itemPointer: PDF_POINTER,
    presentation: { name: "Case study PDF", description: null, group: "Proof", order: 60, example: null },
    constraints: LINK_CONSTRAINTS,
    optional: true,
    ...overrides,
  };
  for (const key of Object.keys(field)) if (field[key] === undefined) delete field[key];
  return field;
}

function pdfLink(url = "https://example.com/case-study.pdf"): JsonObject {
  return { label: "Read the case study", destination: { kind: "external", url }, target: "new_window" };
}

function collectionOf(fixture: ContentSemanticsFixture): JsonObject & { itemFields: JsonObject[]; uniqueness: JsonObject[] } {
  return (fixture.contract.collections as JsonObject[])[0] as JsonObject & {
    itemFields: JsonObject[];
    uniqueness: JsonObject[];
  };
}

function valuesOf(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.content.values as JsonObject[];
}

function withPdf(field: JsonObject, value: unknown): ContentSemanticsFixture {
  const fixture = contentSemanticsFixture();
  collectionOf(fixture).itemFields.push(field);
  valuesOf(fixture).push({
    fieldId: field.id,
    owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item },
    type: "link",
    value,
  });
  return fixture;
}

function judge(fixture: ContentSemanticsFixture): string {
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

function outcome(check: () => unknown): "accepted" | "rejected" {
  try {
    check();
    return "accepted";
  } catch {
    return "rejected";
  }
}

describe("declaring an optional item link", () => {
  const base = contentSemanticsFixture();
  const collection = structuredClone(collectionOf(base));
  const withField = (field: JsonObject) => ({ ...collection, itemFields: [...collection.itemFields, field] });
  const cases: readonly [string, JsonObject, "accepted" | "rejected"][] = [
    ["optional: true", pdfField(), "accepted"],
    ["no optional key (required, as before)", pdfField({ optional: undefined }), "accepted"],
    ["optional: false (one meaning, one spelling)", pdfField({ optional: false }), "rejected"],
    ["optional: 1", pdfField({ optional: 1 }), "rejected"],
    ["optional: null", pdfField({ optional: null }), "rejected"],
    [
      "optional on a rich-text item field",
      { ...pdfField(), type: "rich_text", capabilities: ["text.edit"], constraints: { maxCharacters: 100, maxNodes: 10, allowedBlocks: ["paragraph"], allowedMarks: [], allowLinks: false, allowedExternalHosts: [], allowedTargets: [] } },
      "rejected",
    ],
  ];
  for (const [name, field, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => {
      assert.equal(outcome(() => parseManagedCollectionDescriptor(withField(JSON.parse(JSON.stringify(field)) as JsonObject))), expected);
    });
  }

  it("refuses optional on a page's own link field", () => {
    const fixture = contentSemanticsFixture();
    const page = (fixture.contract.pages as JsonObject[])[0] as { sections: { fields: JsonObject[] }[] };
    const link = page.sections[0].fields.find((field) => field.id === fixture.ids.linkField) as JsonObject;
    assert.equal(outcome(() => parseManagedSiteContractV1(fixture.contract)), "accepted", "control");
    link.optional = true;
    assert.equal(outcome(() => parseManagedSiteContractV1(fixture.contract)), "rejected");
  });

  it("refuses a uniqueness rule naming an optional link, and admits one naming a required link", () => {
    const optional = pdfField();
    const required = pdfField({ optional: undefined, id: fixtureId("field"), itemPointer: "/brochure" });
    const descriptor = (rule: string) => ({
      ...collection,
      itemFields: [...collection.itemFields, optional, required],
      uniqueness: [...collection.uniqueness, { fieldIds: [rule], comparison: "exact" }],
    });
    assert.equal(outcome(() => parseManagedCollectionDescriptor(descriptor(optional.id as string))), "rejected");
    assert.equal(outcome(() => parseManagedCollectionDescriptor(descriptor(required.id as string))), "accepted");
  });
});

describe("a customer who may empty an optional link can fill it again", () => {
  function judgeWith(capabilities: readonly string[], allowedTargets: readonly string[], classification = "customer_editable"): string {
    return judge(withPdf(pdfField({ capabilities, classification, constraints: { ...LINK_CONSTRAINTS, allowedTargets } }), null));
  }
  const all = ["link.label.edit", "link.destination.edit", "link.target.edit"];
  const cases: readonly [string, readonly string[], readonly string[], string][] = [
    ["every capability, two windows", all, ["same_window", "new_window"], "accepted"],
    ["label and destination, one window", ["link.label.edit", "link.destination.edit"], ["new_window"], "accepted"],
    ["label and destination, two windows (no way to pick one)", ["link.label.edit", "link.destination.edit"], ["same_window", "new_window"], "CONTRACT_OPTIONAL_FIELD_POLICY"],
    ["destination only (a removed label could never return)", ["link.destination.edit"], ["new_window"], "CONTRACT_OPTIONAL_FIELD_POLICY"],
    ["label only", ["link.label.edit"], ["new_window"], "CONTRACT_OPTIONAL_FIELD_POLICY"],
    ["target only", ["link.target.edit"], ["same_window", "new_window"], "CONTRACT_OPTIONAL_FIELD_POLICY"],
  ];
  for (const [name, capabilities, targets, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : "refuses"} ${name}`, () => assert.equal(judgeWith(capabilities, targets), expected));
  }
  it("accepts a code-owned optional link, which no customer empties", () =>
    assert.equal(judgeWith([], ["same_window", "new_window"], "code_owned_interface"), "accepted"));
});

describe("an item's link value", () => {
  const cases: readonly [string, () => ContentSemanticsFixture, string][] = [
    ["an optional link holding none", () => withPdf(pdfField(), null), "accepted"],
    ["an optional link holding a link", () => withPdf(pdfField(), pdfLink()), "accepted"],
    ["a required link holding none", () => withPdf(pdfField({ optional: undefined }), null), "CONTENT_VALUE_POLICY"],
    [
      "the fixture's own required item link holding none",
      () => {
        const fixture = contentSemanticsFixture();
        (valuesOf(fixture).find((value) => value.fieldId === fixture.ids.itemLinkField) as JsonObject).value = null;
        return fixture;
      },
      "CONTENT_VALUE_POLICY",
    ],
    [
      "a page link holding none",
      () => {
        const fixture = contentSemanticsFixture();
        (valuesOf(fixture).find((value) => value.fieldId === fixture.ids.linkField) as JsonObject).value = null;
        return fixture;
      },
      "CONTENT_VALUE_POLICY",
    ],
    [
      "an optional link with no value row at all (absence is null, not omission)",
      () => {
        const fixture = withPdf(pdfField(), null);
        valuesOf(fixture).pop();
        return fixture;
      },
      "CONTENT_ITEM_VALUE_MISSING",
    ],
    ["an optional link holding a link its policy refuses (http)", () => withPdf(pdfField(), pdfLink("http://example.com/a.pdf")), "rejected"],
    ["an optional link holding an empty label", () => withPdf(pdfField(), { ...pdfLink(), label: "" }), "CONTENT_VALUE_POLICY"],
    [
      "an optional link naming a page that does not exist",
      () => withPdf(pdfField(), { label: "Gone", destination: { kind: "internal", pageId: fixtureId("page"), fragment: null }, target: "same_window" }),
      "CONTENT_LINK_PAGE_UNRESOLVED",
    ],
    ["an optional link holding an empty object", () => withPdf(pdfField(), {}), "rejected"],
  ];
  for (const [name, build, expected] of cases) {
    it(`${expected === "accepted" ? "accepts" : `refuses (${expected})`} ${name}`, () => {
      const verdict = judge(build());
      if (expected === "rejected") assert.notEqual(verdict, "accepted");
      else assert.equal(verdict, expected);
    });
  }

  it("the JSON Schema admits a null link value, as zod does, and still refuses a malformed one", () => {
    assert.equal(validateManagedSiteContentDocumentJsonSchema(withPdf(pdfField(), null).content).valid, true);
    assert.equal(validateManagedSiteContentDocumentJsonSchema(withPdf(pdfField(), { label: "x" }).content).valid, false);
  });
});

describe("nothing that needs a value on every item may name an optional link", () => {
  type Generated = { intent: { services: string[] }; jsonLd: JsonObject[] };
  function namedFrom(place: (generated: Generated, pdfId: string) => void): string {
    const fixture = withPdf(pdfField(), null);
    const generated = ((fixture.contract.internalSeo as JsonObject).generatedPages as Generated[])[0];
    place(generated, collectionOf(fixture).itemFields.at(-1)?.id as string);
    return judge(fixture);
  }
  it("accepts it named from nowhere (control)", () => assert.equal(namedFrom(() => undefined), "accepted"));
  it("refuses a JSON-LD item source", () =>
    assert.equal(
      namedFrom((generated, pdfId) => void generated.jsonLd.push({ schemaType: "Report", required: false, itemSourceFieldIds: [pdfId], siteSourceFieldIds: [], requiredOutputProperties: ["url"] })),
      "CONTRACT_OPTIONAL_FIELD_REFERENCE",
    ));
  it("refuses an intent's service", () =>
    assert.equal(namedFrom((generated, pdfId) => void generated.intent.services.push(pdfId)), "CONTRACT_OPTIONAL_FIELD_REFERENCE"));
});

describe("a code change keeps every link production may hold", () => {
  function widened(production: JsonObject, candidate: JsonObject): boolean {
    const collection = { ...collectionOf(contentSemanticsFixture()) };
    const parse = (field: JsonObject) =>
      parseManagedCollectionDescriptor({ ...collection, itemFields: [...collection.itemFields, field] }).itemFields.at(-1) as ManagedCollectionItemField;
    return isCompatibilityFieldWidened({ kind: "item", descriptor: parse(production) }, { kind: "item", descriptor: parse(candidate) });
  }
  const id = fixtureId("field");
  const required = pdfField({ id, optional: undefined });
  const optional = pdfField({ id });
  const cases: readonly [string, JsonObject, JsonObject, boolean][] = [
    ["required stays required", required, required, true],
    ["required becomes optional", required, optional, true],
    ["optional stays optional", optional, optional, true],
    ["optional becomes required", optional, required, false],
    ["optional narrows its targets", optional, { ...optional, constraints: { ...LINK_CONSTRAINTS, allowedTargets: ["same_window"] } }, false],
  ];
  for (const [name, production, candidate, expected] of cases) {
    it(`${expected ? "admits" : "refuses"} ${name}`, () => assert.equal(widened(production, candidate), expected));
  }

  it("a whole-site change making a link optional is compatible, and the reverse is refused", () => {
    const fieldId = fixtureId("field");
    const optionalSite = withPdf(pdfField({ id: fieldId }), pdfLink());
    const requiredSite = withPdf(pdfField({ id: fieldId, optional: undefined }), pdfLink());
    const check = (from: ContentSemanticsFixture, to: ContentSemanticsFixture) => {
      try {
        validateManagedSiteContractV1Compatibility(
          parseManagedSiteContractV1(from.contract),
          parseManagedSiteContentDocument(from.content),
          parseManagedSiteContractV1(to.contract),
          parseManagedSiteContentDocument(to.content),
        );
        return "compatible";
      } catch (error) {
        return error instanceof ManagedSiteContractError ? error.code : String(error);
      }
    };
    assert.equal(check(requiredSite, optionalSite), "compatible");
    assert.equal(check(optionalSite, requiredSite), "COMPATIBILITY_FIELD_POLICY_NARROWED");
  });
});

describe("projecting an optional link from its source", () => {
  function project(pdf: unknown): unknown {
    const fixture = sourceProjectionFixture();
    const field = pdfField();
    (fixture.contract.collections as { itemFields: JsonObject[] }[])[0].itemFields.push(field);
    (fixture.sourceDocuments[0].value as { services: JsonObject[] }).services[0].pdf = pdf;
    const content = projectManagedSiteContentDocumentV1(parseManagedSiteContractV1(fixture.contract), fixture.sourceDocuments as never);
    return content.values.find((value) => value.fieldId === field.id)?.value;
  }

  it("projects a null at the item's pointer to a null value", () => assert.equal(project(null), null));
  it("projects a link at the item's pointer as before", () => assert.deepEqual(project(pdfLink()), pdfLink()));
  it("refuses an item whose source has no pdf key at all", () => assert.throws(() => project(undefined)));
});

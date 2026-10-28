import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  managedGeneratedSeoTextV1,
  parseManagedFieldDescriptor,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  renderManagedGeneratedSeoTextV1,
  renderManagedSeoPatternV1,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import {
  addSecondFixtureItem,
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";

/**
 * 0.26.0: a generated page's search title and description are a pattern the
 * customer writes once per page type ("{name} advertising | Gomega"), filled
 * with each item's text, plus an optional per-page override.
 *
 * Invariant: whatever a generated page serves in a search slot is derived from
 * customer-editable values the contract names exactly: the item's own override
 * when it holds text, else the page's own pattern filled, placeholder for
 * placeholder, from one line of the route collection's item text.
 */

type JsonObject = Record<string, unknown>;
type Mutation = (fixture: EditableFixture) => void;

interface EditableFixture extends ContentSemanticsFixture {
  readonly seo: {
    readonly titleOverride: string;
    readonly titlePattern: string;
    readonly descriptionOverride: string;
    readonly descriptionPattern: string;
    readonly section: JsonObject;
  };
}

function presentation(name: string, order: number): JsonObject {
  return { name, description: null, group: "SEO", order, example: null };
}

function overrideField(id: string, semantic: string, pointer: string): JsonObject {
  return {
    id,
    type: "plain_text",
    classification: "customer_editable",
    capabilities: ["text.edit"],
    itemPointer: pointer,
    presentation: presentation(semantic, 60),
    semantic,
    constraints: { minLength: 0, maxLength: 160, newlines: "forbid" },
  };
}

function patternField(id: string, pageId: string, semantic: string, pointer: string): JsonObject {
  return {
    id,
    scope: "page",
    type: "plain_text",
    classification: "customer_editable",
    capabilities: ["text.edit"],
    resolver: { kind: "json_pointer", path: "content/site.json", pointer },
    usages: [{ pageId, itemId: null }],
    presentation: presentation(semantic, 61),
    semantic,
    constraints: {
      minLength: 1,
      maxLength: 160,
      newlines: "forbid",
      pattern: { placeholders: [{ name: "name" }] },
    },
  };
}

function contract(fixture: ContentSemanticsFixture): JsonObject {
  return fixture.contract;
}

function collection(fixture: ContentSemanticsFixture): JsonObject {
  return (contract(fixture).collections as JsonObject[])[0] as JsonObject;
}

function itemFields(fixture: ContentSemanticsFixture): JsonObject[] {
  return collection(fixture).itemFields as JsonObject[];
}

function itemField(fixture: ContentSemanticsFixture, id: string): JsonObject {
  const field = itemFields(fixture).find((one) => one.id === id);
  if (field === undefined) throw new Error(`fixture lost item field ${id}`);
  return field;
}

function pages(fixture: ContentSemanticsFixture): JsonObject[] {
  return contract(fixture).pages as JsonObject[];
}

function generatedSeo(fixture: ContentSemanticsFixture): JsonObject {
  const seo = contract(fixture).internalSeo as JsonObject;
  return (seo.generatedPages as JsonObject[])[0] as JsonObject;
}

function metadata(fixture: ContentSemanticsFixture): JsonObject {
  return generatedSeo(fixture).metadata as JsonObject;
}

function social(fixture: ContentSemanticsFixture): JsonObject {
  return metadata(fixture).social as JsonObject;
}

function values(fixture: ContentSemanticsFixture): JsonObject[] {
  return fixture.content.values as JsonObject[];
}

function itemIds(fixture: ContentSemanticsFixture): string[] {
  const value = values(fixture).find((one) => one.fieldId === fixture.ids.collectionField);
  return ((value?.value as JsonObject).orderedItemIds as string[]);
}

function addItemValues(fixture: ContentSemanticsFixture, fieldId: string, text: string): void {
  for (const itemId of itemIds(fixture)) {
    values(fixture).push({
      fieldId,
      owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId },
      type: "plain_text",
      value: text,
    });
  }
}

function patternValue(fixture: ContentSemanticsFixture, fieldId: string): JsonObject {
  const value = values(fixture).find((one) => one.fieldId === fieldId);
  if (value === undefined) throw new Error(`fixture lost value ${fieldId}`);
  return value;
}

function itemValue(fixture: ContentSemanticsFixture, fieldId: string, itemId: string): JsonObject {
  const value = values(fixture).find(
    (one) => one.fieldId === fieldId && (one.owner as JsonObject).itemId === itemId,
  );
  if (value === undefined) throw new Error(`fixture lost item value ${fieldId}`);
  return value;
}

/**
 * The content-semantics fixture with both search slots of its generated page
 * made editable: a pattern on the page reading the item heading, and an empty
 * override on every item.
 */
function editableFixture(): EditableFixture {
  const base = contentSemanticsFixture();
  const generatedPage = base.ids.generatedPage;
  const ids = {
    titleOverride: fixtureId("field"),
    titlePattern: fixtureId("field"),
    descriptionOverride: fixtureId("field"),
    descriptionPattern: fixtureId("field"),
  };
  itemFields(base).push(
    overrideField(ids.titleOverride, "seo_title", "/seoTitle"),
    overrideField(ids.descriptionOverride, "seo_description", "/seoDescription"),
  );
  const section: JsonObject = {
    id: fixtureId("section"),
    presentation: presentation("Search", 1),
    fields: [
      patternField(ids.titlePattern, generatedPage, "seo_title", "/service/seoTitle"),
      patternField(ids.descriptionPattern, generatedPage, "seo_description", "/service/seoDescription"),
    ],
  };
  const page = pages(base).find((one) => one.id === generatedPage) as JsonObject;
  (page.sections as JsonObject[]).push(section);
  const meta = metadata(base);
  meta.title = ids.titleOverride;
  meta.description = ids.descriptionOverride;
  meta.titlePattern = { fieldId: ids.titlePattern, sources: [{ placeholder: "name", fieldId: base.ids.itemHeadingField }] };
  meta.descriptionPattern = { fieldId: ids.descriptionPattern, sources: [{ placeholder: "name", fieldId: base.ids.itemHeadingField }] };
  addItemValues(base, ids.titleOverride, "");
  addItemValues(base, ids.descriptionOverride, "");
  values(base).push(
    { fieldId: ids.titlePattern, owner: { kind: "page", pageId: generatedPage }, type: "plain_text", value: "{name} services | Gomega" },
    { fieldId: ids.descriptionPattern, owner: { kind: "page", pageId: generatedPage }, type: "plain_text", value: "Book {name} today." },
  );
  return { ...base, seo: { ...ids, section } };
}

function verdict(mutate: Mutation): string {
  const fixture = editableFixture();
  mutate(fixture);
  try {
    validateManagedSiteContractV1ContentSemantics(
      parseManagedSiteContractV1(fixture.contract),
      parseManagedSiteContentDocument(fixture.content),
    );
    return "accepted";
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

const POLICY = "CONTRACT_SEO_FIELD_POLICY";

function sources(fixture: EditableFixture): JsonObject[] {
  return (metadata(fixture).titlePattern as JsonObject).sources as JsonObject[];
}

function titlePatternConstraints(fixture: EditableFixture): JsonObject {
  const field = (fixture.seo.section.fields as JsonObject[])[0] as JsonObject;
  return field.constraints as JsonObject;
}

function addItemBodyField(fixture: EditableFixture, overrides: JsonObject = {}): string {
  const id = fixtureId("field");
  itemFields(fixture).push({
    id,
    type: "plain_text",
    classification: "customer_editable",
    capabilities: ["text.edit"],
    itemPointer: "/shortName",
    presentation: presentation("Short name", 62),
    semantic: "body",
    constraints: { minLength: 1, maxLength: 60, newlines: "forbid" },
    ...overrides,
  });
  addItemValues(fixture, id, "Short");
  return id;
}

describe("a generated page's search slots: contract", () => {
  const cases: readonly [string, Mutation, string][] = [
    ["both slots as pattern and optional override", () => undefined, "accepted"],
    ["an override with text", (f) => void (itemValue(f, f.seo.titleOverride, f.ids.item).value = "Custom title"), "accepted"],
    ["only the title editable, the description still protected", (f) => {
      metadata(f).description = f.ids.generatedDescriptionField;
      delete metadata(f).descriptionPattern;
      f.seo.section.fields = (f.seo.section.fields as JsonObject[]).slice(0, 1);
      collection(f).itemFields = itemFields(f).filter((one) => one.id !== f.seo.descriptionOverride);
      f.content.values = values(f).filter((one) => one.fieldId !== f.seo.descriptionOverride && one.fieldId !== f.seo.descriptionPattern);
    }, "accepted"],
    ["an editable slot without a pattern that must hold text", (f) => {
      delete metadata(f).titlePattern;
      f.seo.section.fields = (f.seo.section.fields as JsonObject[]).slice(1);
      f.content.values = values(f).filter((one) => one.fieldId !== f.seo.titlePattern);
      (itemField(f, f.seo.titleOverride).constraints as JsonObject).minLength = 1;
      for (const one of values(f)) if (one.fieldId === f.seo.titleOverride) one.value = "Per page";
    }, "accepted"],
    ["a social echo of the editable slot", (f) => void (social(f).title = f.seo.titleOverride), "accepted"],
    ["a body item field as the source", (f) => void ((sources(f)[0] as JsonObject).fieldId = addItemBodyField(f)), "accepted"],
    ["a second item, each filling its own pattern", (f) => void addSecondFixtureItem(f), "accepted"],

    ["a pattern beside a protected slot", (f) => void (metadata(f).title = f.ids.generatedTitleField), POLICY],
    ["an override that must hold text beside a pattern", (f) => void ((itemField(f, f.seo.titleOverride).constraints as JsonObject).minLength = 1), POLICY],
    ["an editable slot without a pattern that may be empty", (f) => {
      delete metadata(f).titlePattern;
      f.seo.section.fields = (f.seo.section.fields as JsonObject[]).slice(1);
      f.content.values = values(f).filter((one) => one.fieldId !== f.seo.titlePattern);
    }, POLICY],
    ["the description override in the title slot", (f) => {
      metadata(f).title = f.seo.descriptionOverride;
      metadata(f).description = f.seo.titleOverride;
    }, POLICY],
    ["an override that may break lines", (f) => void ((itemField(f, f.seo.titleOverride).constraints as JsonObject).newlines = "allow"), POLICY],
    ["an override longer than a search slot holds", (f) => void ((itemField(f, f.seo.titleOverride).constraints as JsonObject).maxLength = 321), POLICY],
    ["a code-owned override", (f) => {
      const field = itemField(f, f.seo.titleOverride);
      field.classification = "code_owned_interface";
      field.capabilities = [];
    }, POLICY],
    ["the description pattern in the title slot", (f) => {
      (metadata(f).titlePattern as JsonObject).fieldId = f.seo.descriptionPattern;
      (metadata(f).descriptionPattern as JsonObject).fieldId = f.seo.titlePattern;
    }, POLICY],
    ["one pattern in both slots", (f) => void ((metadata(f).descriptionPattern as JsonObject).fieldId = f.seo.titlePattern), POLICY],
    ["a title pattern field without a pattern", (f) => {
      delete titlePatternConstraints(f).pattern;
      patternValue(f, f.seo.titlePattern).value = "Services | Gomega";
    }, POLICY],
    ["a pattern declared on another page", (f) => {
      const field = (f.seo.section.fields as JsonObject[])[0] as JsonObject;
      field.usages = [{ pageId: f.ids.homePage, itemId: null }];
      patternValue(f, f.seo.titlePattern).owner = { kind: "page", pageId: f.ids.homePage };
    }, POLICY],
    ["a site-scoped pattern", (f) => void (((f.seo.section.fields as JsonObject[])[0] as JsonObject).scope = "site"), POLICY],
    ["sources missing the placeholder", (f) => void ((sources(f)[0] as JsonObject).placeholder = "title"), POLICY],
    ["a second source the pattern does not declare", (f) => void sources(f).push({ placeholder: "city", fieldId: f.ids.itemHeadingField }), POLICY],
    ["the placeholder sourced twice", (f) => void sources(f).push({ placeholder: "name", fieldId: f.ids.itemHeadingField }), POLICY],
    ["a protected source", (f) => void ((sources(f)[0] as JsonObject).fieldId = f.ids.generatedTitleField), POLICY],
    ["the override as its own source", (f) => void ((sources(f)[0] as JsonObject).fieldId = f.seo.titleOverride), POLICY],
    ["a rich-text source", (f) => void ((sources(f)[0] as JsonObject).fieldId = f.ids.itemRichField), POLICY],
    ["an image source", (f) => void ((sources(f)[0] as JsonObject).fieldId = f.ids.itemImageField), POLICY],
    ["a link source", (f) => void ((sources(f)[0] as JsonObject).fieldId = f.ids.itemLinkField), POLICY],
    ["a source that may be empty", (f) => void ((sources(f)[0] as JsonObject).fieldId = addItemBodyField(f, { constraints: { minLength: 0, maxLength: 60, newlines: "forbid" } })), POLICY],
    ["a source that may break lines", (f) => void ((sources(f)[0] as JsonObject).fieldId = addItemBodyField(f, { constraints: { minLength: 1, maxLength: 60, newlines: "allow" } })), POLICY],
    ["a structured source", (f) => void ((sources(f)[0] as JsonObject).fieldId = addItemBodyField(f, { semantic: "address" })), POLICY],
    ["a social echo of another editable field", (f) => void (social(f).title = f.seo.descriptionOverride), POLICY],
    ["an item search field no slot names", (f) => {
      itemFields(f).push(overrideField(fixtureId("field"), "seo_title", "/spare"));
    }, POLICY],
    ["an override named only as a social echo", (f) => {
      metadata(f).title = f.ids.generatedTitleField;
      delete metadata(f).titlePattern;
      social(f).title = f.seo.titleOverride;
    }, POLICY],
    ["a page field in the item slot", (f) => void (metadata(f).title = f.seo.titlePattern), "CONTRACT_REFERENCE_SCOPE"],
    ["an item field as the pattern", (f) => void ((metadata(f).titlePattern as JsonObject).fieldId = f.seo.titleOverride), "CONTRACT_REFERENCE_SCOPE"],
    ["a source outside the route collection", (f) => void ((sources(f)[0] as JsonObject).fieldId = f.ids.titleField), "CONTRACT_REFERENCE_SCOPE"],
    ["a pattern named from a static page too", (f) => {
      const seo = contract(f).internalSeo as JsonObject;
      const home = (seo.pages as JsonObject[])[0] as JsonObject;
      ((home.metadata as JsonObject).social as JsonObject).title = f.seo.titlePattern;
    }, POLICY],
  ];
  for (const [name, mutate, expected] of cases) {
    it(`${name}: ${expected}`, () => {
      assert.equal(verdict(mutate), expected);
    });
  }
});

describe("a generated page's search slots: content", () => {
  const cases: readonly [string, Mutation, string][] = [
    ["a pattern without its token", (f) => void (patternValue(f, f.seo.titlePattern).value = "Services | Gomega"), "CONTENT_VALUE_POLICY"],
    ["a pattern with its token twice", (f) => void (patternValue(f, f.seo.titlePattern).value = "{name} | {name}"), "CONTENT_VALUE_POLICY"],
    ["a pattern with a stray brace", (f) => void (patternValue(f, f.seo.titlePattern).value = "{name} {"), "CONTENT_VALUE_POLICY"],
    ["a pattern with an undeclared token", (f) => void (patternValue(f, f.seo.titlePattern).value = "{name} in {city}"), "CONTENT_VALUE_POLICY"],
    ["a pattern with a line break", (f) => void (patternValue(f, f.seo.titlePattern).value = "{name}\nGomega"), "CONTENT_VALUE_POLICY"],
    ["a pattern with a bidi override", (f) => void (patternValue(f, f.seo.titlePattern).value = "{name}‮"), "CONTENT_VALUE_POLICY"],
    ["an override with a bidi override", (f) => void (itemValue(f, f.seo.titleOverride, f.ids.item).value = "Title‮"), "CONTENT_VALUE_POLICY"],
    ["an item missing its override", (f) => {
      f.content.values = values(f).filter((one) => one.fieldId !== f.seo.titleOverride);
    }, "CONTENT_ITEM_VALUE_MISSING"],
  ];
  for (const [name, mutate, expected] of cases) {
    it(`${name}: ${expected}`, () => {
      assert.equal(verdict(mutate), expected);
    });
  }
});

describe("a search pattern's declaration", () => {
  function patternDeclaration(overrides: JsonObject): JsonObject {
    const field = patternField(fixtureId("field"), fixtureId("page"), "seo_title", "/x");
    return { ...field, constraints: { ...(field.constraints as JsonObject), ...overrides } };
  }
  const refused: readonly [string, JsonObject][] = [
    ["on running text", { ...patternField(fixtureId("field"), fixtureId("page"), "body", "/x") }],
    ["beside a template", patternDeclaration({ template: { locale: "en", placeholders: [{ name: "count", minimumIntegerDigits: 1, grouping: false }], plural: null } })],
    ["beside an attribute", patternDeclaration({ attribute: "title" })],
    ["with a repeated placeholder", patternDeclaration({ pattern: { placeholders: [{ name: "name" }, { name: "name" }] } })],
    ["with an uppercase placeholder", patternDeclaration({ pattern: { placeholders: [{ name: "Name" }] } })],
    ["with no placeholder", patternDeclaration({ pattern: { placeholders: [] } })],
    ["with five placeholders", patternDeclaration({ pattern: { placeholders: ["a", "b", "c", "d", "e"].map((name) => ({ name })) } })],
    ["with a number format", patternDeclaration({ pattern: { placeholders: [{ name: "name", grouping: false }] } })],
    ["shorter than its tokens", patternDeclaration({ minLength: 0, maxLength: 5 })],
    ["breaking lines", patternDeclaration({ newlines: "allow" })],
    ["longer than a search slot holds", patternDeclaration({ maxLength: 321 })],
  ];
  for (const [name, field] of refused) {
    it(`refuses a pattern ${name}`, () => {
      assert.throws(() => parseManagedFieldDescriptor(field));
    });
  }
  it("accepts a description pattern of four placeholders", () => {
    const field = patternDeclaration({ pattern: { placeholders: ["a", "b", "c", "d"].map((name) => ({ name })) } });
    field.semantic = "seo_description";
    assert.doesNotThrow(() => parseManagedFieldDescriptor(field));
  });
});

describe("what a generated page serves", () => {
  const pattern = { placeholders: [{ name: "name" }, { name: "city" }] };
  const filled: readonly [string, string, Record<string, string>, string][] = [
    ["both tokens", "{name} in {city}", { name: "Healthcare", city: "Boston" }, "Healthcare in Boston"],
    ["item text spelling another token", "{name} in {city}", { name: "{city}", city: "Boston" }, "{city} in Boston"],
    ["item text with replacement syntax", "{name} | {city}", { name: "$& $1 $$", city: "x" }, "$& $1 $$ | x"],
    ["tokens in either order", "{city}: {name}", { name: "A", city: "B" }, "B: A"],
  ];
  for (const [name, text, inputs, expected] of filled) {
    it(`fills ${name}`, () => {
      assert.equal(renderManagedSeoPatternV1(pattern, text, inputs), expected);
    });
  }
  const refused: readonly [string, string, Record<string, unknown>][] = [
    ["a missing input", "{name} in {city}", { name: "A" }],
    ["an extra input", "{name} in {city}", { name: "A", city: "B", other: "C" }],
    ["a number input", "{name} in {city}", { name: "A", city: 7 }],
    ["text breaking the rule", "{name} in", { name: "A", city: "B" }],
  ];
  for (const [name, text, inputs] of refused) {
    it(`refuses ${name}`, () => {
      assert.throws(() => renderManagedSeoPatternV1(pattern, text, inputs as Record<string, string>));
    });
  }
  const one = { placeholders: [{ name: "name" }] };
  const overrides: readonly [string, string, string][] = [
    ["an empty override", "", "Healthcare | Gomega"],
    ["a spaces-only override", "   ", "Healthcare | Gomega"],
    ["a tab and newline override", "\t\n", "Healthcare | Gomega"],
    ["a no-break space override", " ", "Healthcare | Gomega"],
    ["an override with text", "Our healthcare network", "Our healthcare network"],
    ["an override padded with spaces, served as written", " Custom ", " Custom "],
  ];
  for (const [name, override, expected] of overrides) {
    it(`serves ${expected.trim() === "Healthcare | Gomega" ? "the pattern" : "the override"} for ${name}`, () => {
      assert.equal(renderManagedGeneratedSeoTextV1(override, one, "{name} | Gomega", { name: "Healthcare" }), expected);
    });
  }

  it("resolves each item of a validated site, override first", () => {
    const fixture = editableFixture();
    const second = addSecondFixtureItem(fixture, { heading: "Plumbing" });
    itemValue(fixture, fixture.seo.titleOverride, second).value = "Emergency plumbing";
    const parsedContract = parseManagedSiteContractV1(fixture.contract);
    const parsedContent = parseManagedSiteContentDocument(fixture.content);
    validateManagedSiteContractV1ContentSemantics(parsedContract, parsedContent);
    const heading = itemValue(fixture, fixture.ids.itemHeadingField, fixture.ids.item).value as string;
    const serve = (itemId: string, slot: "title" | "description") =>
      managedGeneratedSeoTextV1(parsedContract, parsedContent, fixture.ids.generatedPage, itemId, slot);
    assert.equal(serve(fixture.ids.item, "title"), `${heading} services | Gomega`);
    assert.equal(serve(fixture.ids.item, "description"), `Book ${heading} today.`);
    assert.equal(serve(second, "title"), "Emergency plumbing");
    assert.equal(serve(second, "description"), "Book Plumbing today.");
  });

  it("serves a slot without a pattern as its own value", () => {
    const fixture = contentSemanticsFixture();
    const parsedContract = parseManagedSiteContractV1(fixture.contract);
    const parsedContent = parseManagedSiteContentDocument(fixture.content);
    const own = itemValue(fixture, fixture.ids.generatedTitleField, fixture.ids.item).value;
    assert.equal(
      managedGeneratedSeoTextV1(parsedContract, parsedContent, fixture.ids.generatedPage, fixture.ids.item, "title"),
      own,
    );
  });

  it("refuses a page that is not generated and an item with no value", () => {
    const fixture = editableFixture();
    const parsedContract = parseManagedSiteContractV1(fixture.contract);
    const parsedContent = parseManagedSiteContentDocument(fixture.content);
    for (const [pageId, itemId] of [
      [fixture.ids.homePage, fixture.ids.item],
      [fixture.ids.generatedPage, fixtureId("item")],
    ] as const) {
      assert.throws(
        () => managedGeneratedSeoTextV1(parsedContract, parsedContent, pageId, itemId, "title"),
        (error: unknown) => error instanceof ManagedSiteContractError && error.code === "GENERATED_SEO_UNRESOLVED",
      );
    }
  });
});

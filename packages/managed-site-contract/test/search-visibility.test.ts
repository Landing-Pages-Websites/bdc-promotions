import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ManagedSiteContractError,
  managedSearchHiddenV1,
  managedSearchRobotsV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1ContentSemantics,
} from "../src/index.js";
import { isPreservedBy } from "../src/contract-compatibility-seo-facts.js";
import { resolveManagedSiteFieldMigrationPageRetiresV1 } from "../src/field-migration-retire-pages.js";
import { seoFactRules } from "../src/contract-compatibility-seo.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";

/**
 * 0.34.0: "Hide this page from search engines" is a customer-editable toggle
 * on a page's search entry (`metadata.hiddenFieldId`), for static and
 * generated pages. Invariant: a page's search visibility is decided by its own
 * toggle and nothing else's, the toggle switches exactly that and is named
 * from exactly that one place, and a code change never takes the switch away
 * from a customer once it is theirs.
 *
 * Static pages: All Points Media production revision 19, trimmed (`/`,
 * `/admin`, `/industries`, `/innovation/network-portal`); the toggle joins
 * /industries' "Search and sharing" section beside its search title and
 * description. Generated pages: the package's content-semantics fixture.
 */
const FIXTURE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/search-visibility");

type Json = Record<string, unknown>;

const INDUSTRIES = "page_9xbw114xjkzzb8dy8gyr7zwxhc";
const ADMIN = "page_4d55wdpg80nwt0x1sv8h30beeg";
const HOME = "page_fwtww4abmmbqasq46zssffva24";
const SEARCH_SECTION = "section_98jxdwh05zq28qsfy4nfnzr200";
const SEO_TITLE = "field_k71hx3dvw6vbwfvjbk5wg4m7ac";
const TOGGLE = "field_" + "5".repeat(25) + "0";
const ITEM_TOGGLE = "field_" + "6".repeat(25) + "0";
const ACCEPTED = "ACCEPTED";

function read(name: string): Json {
  return JSON.parse(readFileSync(resolve(FIXTURE_DIRECTORY, `${name}.json`), "utf8")) as Json;
}

const PRODUCTION = Object.freeze({ contract: read("production.contract"), content: read("production.content") });

interface Site {
  contract: Json;
  content: Json;
}

function pages(contract: Json): Json[] {
  return contract.pages as Json[];
}

function sectionOf(contract: Json, sectionId: string): Json {
  return pages(contract).flatMap((page) => page.sections as Json[]).find((section) => section.id === sectionId)!;
}

function fieldOf(contract: Json, fieldId: string): Json {
  return pages(contract)
    .flatMap((page) => (page.sections as Json[]).flatMap((section) => section.fields as Json[]))
    .find((field) => field.id === fieldId)!;
}

function seoEntry(contract: Json, pageId: string): Json {
  return ((contract.internalSeo as Json).pages as Json[]).find((entry) => entry.pageId === pageId)!;
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

/** /industries' toggle, declared beside its search title exactly as a site would. */
function toggleDescriptor(id = TOGGLE, pageId = INDUSTRIES): Json {
  const title = fieldOf(PRODUCTION.contract, SEO_TITLE);
  return {
    id,
    scope: "page",
    classification: "customer_editable",
    capabilities: ["toggle.set"],
    resolver: { ...(title.resolver as Json), pointer: "/seo/hidden" },
    usages: [{ pageId, itemId: null }],
    presentation: { name: "Hide this page from search engines", description: null, group: "Search and sharing", order: 3, example: null },
    type: "toggle",
    semantic: "seo_hidden",
  };
}

/** Production plus /industries' toggle, holding `hidden`. */
function withStaticToggle(hidden = false): Site {
  const contract = structuredClone(PRODUCTION.contract);
  const content = structuredClone(PRODUCTION.content);
  (sectionOf(contract, SEARCH_SECTION).fields as Json[]).push(toggleDescriptor());
  (seoEntry(contract, INDUSTRIES).metadata as Json).hiddenFieldId = TOGGLE;
  values(content).push({ fieldId: TOGGLE, owner: { kind: "page", pageId: INDUSTRIES }, type: "toggle", value: hidden });
  return { contract, content };
}

/** A page's protected indexing value, to edit as code would. */
function indexingValue(site: Site, pageId: string): Json {
  const fieldId = (seoEntry(site.contract, pageId).metadata as Json).indexing as string;
  return values(site.content).find((value) => value.fieldId === fieldId)!.value as Json;
}

/** Production plus a toggle on any static page, holding `hidden`. */
function withToggleOn(pageId: string, hidden: boolean): Site {
  const contract = structuredClone(PRODUCTION.contract);
  const content = structuredClone(PRODUCTION.content);
  const id = "field_" + "8".repeat(25) + "0";
  const page = pages(contract).find((entry) => entry.id === pageId)!;
  const sections = page.sections as Json[];
  if (sections.length === 0) {
    sections.push({ id: "section_" + "9".repeat(25) + "0", presentation: { name: "Search and sharing", description: null, group: "Search", order: 1, example: null }, fields: [] });
  }
  (sections[0]!.fields as Json[]).push({ ...toggleDescriptor(id, pageId), resolver: { kind: "json_pointer", path: "src/content/pages/admin.json", pointer: "/seo/hidden" } });
  (seoEntry(contract, pageId).metadata as Json).hiddenFieldId = id;
  values(content).push({ fieldId: id, owner: { kind: "page", pageId }, type: "toggle", value: hidden });
  return { contract, content };
}

/** The content-semantics fixture plus a toggle on its generated page's items. */
function withItemToggle(hidden = false): ContentSemanticsFixture {
  const fixture = contentSemanticsFixture();
  const collection = (fixture.contract.collections as Json[]).find((entry) => entry.id === fixture.ids.collection)!;
  (collection.itemFields as Json[]).push({
    id: ITEM_TOGGLE,
    classification: "customer_editable",
    capabilities: ["toggle.set"],
    itemPointer: "/hidden",
    presentation: { name: "Hide this page from search engines", description: null, group: "Search and sharing", order: 9, example: null },
    type: "toggle",
    semantic: "seo_hidden",
  });
  const entry = ((fixture.contract.internalSeo as Json).generatedPages as Json[])[0]!;
  (entry.metadata as Json).hiddenFieldId = ITEM_TOGGLE;
  values(fixture.content).push({
    fieldId: ITEM_TOGGLE,
    owner: { kind: "collection_item", collectionId: fixture.ids.collection, itemId: fixture.ids.item },
    type: "toggle",
    value: hidden,
  });
  return fixture;
}

function verdict(site: Site): string {
  try {
    validateManagedSiteContractV1ContentSemantics(
      parseManagedSiteContractV1(site.contract),
      parseManagedSiteContentDocument(site.content),
    );
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    if (error instanceof Error && error.name === "ZodError") return "SCHEMA";
    throw error;
  }
}

function compatibility(production: Site, candidate: Site): string {
  try {
    validateManagedSiteContractV1Compatibility(
      parseManagedSiteContractV1(production.contract),
      parseManagedSiteContentDocument(production.content),
      parseManagedSiteContractV1(candidate.contract),
      parseManagedSiteContentDocument(candidate.content),
    );
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

describe("a page's search-visibility toggle (0.34.0)", () => {
  it("is a valid contract on a static page and an item of a generated page", () => {
    assert.equal(verdict(withStaticToggle()), ACCEPTED);
    const fixture = withItemToggle();
    assert.equal(verdict(fixture), ACCEPTED);
  });

  it("reads the toggle, and null where a page names none", () => {
    for (const hidden of [true, false]) {
      const site = withStaticToggle(hidden);
      const contract = parseManagedSiteContractV1(site.contract);
      const content = parseManagedSiteContentDocument(site.content);
      assert.equal(managedSearchHiddenV1(contract, content, INDUSTRIES), hidden);
      assert.equal(managedSearchHiddenV1(contract, content, ADMIN), null);
    }
    const fixture = withItemToggle(true);
    assert.equal(
      managedSearchHiddenV1(
        parseManagedSiteContractV1(fixture.contract),
        parseManagedSiteContentDocument(fixture.content),
        fixture.ids.generatedPage,
        fixture.ids.item,
      ),
      true,
    );
  });

  it("serves noindex, nofollow when hidden and index, follow when shown", () => {
    assert.deepEqual(managedSearchRobotsV1(true), { index: false, follow: false });
    assert.deepEqual(managedSearchRobotsV1(false), { index: true, follow: true });
  });

  it("refuses to guess for a page or item the contract does not declare", () => {
    const site = withStaticToggle();
    const contract = parseManagedSiteContractV1(site.contract);
    const content = parseManagedSiteContentDocument(site.content);
    for (const call of [
      () => managedSearchHiddenV1(contract, content, "page_" + "1".repeat(25) + "0"),
      () => managedSearchHiddenV1(contract, content, INDUSTRIES, "item_" + "1".repeat(25) + "0"),
    ]) {
      assert.throws(call, (error: unknown) => error instanceof ManagedSiteContractError && error.code === "SEARCH_VISIBILITY_UNRESOLVED");
    }
  });

  const refusals: readonly { name: string; code: string; build: () => Site }[] = [
    {
      name: "the entry names its search title, not a toggle",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        (seoEntry(site.contract, INDUSTRIES).metadata as Json).hiddenFieldId = SEO_TITLE;
        return site;
      },
    },
    {
      name: "a code-owned toggle",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        Object.assign(fieldOf(site.contract, TOGGLE), { classification: "code_owned_interface", capabilities: [] });
        return site;
      },
    },
    {
      name: "a site-scoped toggle",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        fieldOf(site.contract, TOGGLE).scope = "site";
        values(site.content).find((value) => value.fieldId === TOGGLE)!.owner = { kind: "site" };
        return site;
      },
    },
    {
      name: "another page's toggle",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        delete (seoEntry(site.contract, INDUSTRIES).metadata as Json).hiddenFieldId;
        (seoEntry(site.contract, ADMIN).metadata as Json).hiddenFieldId = TOGGLE;
        return site;
      },
    },
    {
      name: "a toggle no entry names (it would switch nothing)",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        delete (seoEntry(site.contract, INDUSTRIES).metadata as Json).hiddenFieldId;
        return site;
      },
    },
    {
      name: "a toggle two entries name",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        (seoEntry(site.contract, ADMIN).metadata as Json).hiddenFieldId = TOGGLE;
        return site;
      },
    },
    {
      name: "a toggle the heading outline also names",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const site = withStaticToggle();
        (seoEntry(site.contract, INDUSTRIES).headingOutline as Json[]).push({ fieldId: TOGGLE, semanticLevel: 3 });
        return site;
      },
    },
    {
      name: "a semantic the platform does not know",
      code: "SCHEMA",
      build: () => {
        const site = withStaticToggle();
        fieldOf(site.contract, TOGGLE).semantic = "sitemap_excluded";
        return site;
      },
    },
    {
      name: "a capability a toggle does not have",
      code: "SCHEMA",
      build: () => {
        const site = withStaticToggle();
        fieldOf(site.contract, TOGGLE).capabilities = ["text.edit"];
        return site;
      },
    },
    {
      name: "a value that is not a boolean",
      code: "SCHEMA",
      build: () => {
        const site = withStaticToggle();
        values(site.content).find((value) => value.fieldId === TOGGLE)!.value = "true";
        return site;
      },
    },
    {
      name: "no value at all",
      code: "CONTENT_REQUIRED_VALUE_MISSING",
      build: () => {
        const site = withStaticToggle();
        site.content.values = values(site.content).filter((value) => value.fieldId !== TOGGLE);
        return site;
      },
    },
    {
      name: "a generated page naming an item field that is not a toggle",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const fixture = withItemToggle();
        const entry = ((fixture.contract.internalSeo as Json).generatedPages as Json[])[0]!;
        (entry.metadata as Json).hiddenFieldId = fixture.ids.itemHeadingField;
        return fixture;
      },
    },
    {
      name: "a generated page's item toggle that is code-owned",
      code: "CONTRACT_SEO_FIELD_POLICY",
      build: () => {
        const fixture = withItemToggle();
        const collection = (fixture.contract.collections as Json[])[0]!;
        Object.assign((collection.itemFields as Json[]).find((field) => field.id === ITEM_TOGGLE)!, {
          classification: "code_owned_interface",
          capabilities: [],
        });
        return fixture;
      },
    },
    {
      name: "a static page naming a generated page's item toggle",
      code: "CONTRACT_REFERENCE_UNRESOLVED",
      build: () => {
        const fixture = withItemToggle();
        const entry = ((fixture.contract.internalSeo as Json).pages as Json[])[0]!;
        (entry.metadata as Json).hiddenFieldId = ITEM_TOGGLE;
        return fixture;
      },
    },
  ];

  for (const refusal of refusals) {
    it(`refuses ${refusal.name}`, () => {
      const result = verdict(refusal.build());
      assert.notEqual(result, ACCEPTED);
      if (refusal.code !== "CONTRACT_REFERENCE_UNRESOLVED" && refusal.code !== "CONTENT_REQUIRED_VALUE_MISSING") {
        assert.equal(result, refusal.code);
      }
    });
  }
});

describe("a code change and a page's search-visibility toggle", () => {
  it("admits adding the toggle, holding what the page serves today", () => {
    assert.equal(compatibility({ contract: PRODUCTION.contract, content: PRODUCTION.content }, withStaticToggle(false)), ACCEPTED);
  });

  const adoptions: readonly { name: string; build: () => [Site, Site] }[] = [
    {
      name: "hides an indexed page (/industries)",
      build: () => [{ contract: PRODUCTION.contract, content: PRODUCTION.content }, withStaticToggle(true)],
    },
    {
      name: "shows a noindex page (/admin)",
      build: () => [{ contract: PRODUCTION.contract, content: PRODUCTION.content }, withToggleOn(ADMIN, false)],
    },
    {
      name: "states a page whose code says index but nofollow",
      build: () => {
        const production = { contract: structuredClone(PRODUCTION.contract), content: structuredClone(PRODUCTION.content) };
        indexingValue(production, INDUSTRIES).follow = false;
        const candidate = withStaticToggle(false);
        indexingValue(candidate, INDUSTRIES).follow = false;
        return [production, candidate];
      },
    },
    {
      name: "hides an indexed item of a generated page",
      build: () => [contentSemanticsFixture(), withItemToggle(true)],
    },
  ];

  for (const { name, build } of adoptions) {
    it(`refuses an adoption that ${name}: it would change what is served`, () => {
      const [production, candidate] = build();
      assert.equal(compatibility(production, candidate), "COMPATIBILITY_SEARCH_VISIBILITY_CHANGED");
    });
  }

  it("admits adopting on a noindex page with the toggle on (what /admin serves today)", () => {
    assert.equal(compatibility({ contract: PRODUCTION.contract, content: PRODUCTION.content }, withToggleOn(ADMIN, true)), ACCEPTED);
  });

  it("reads a hidden page as not indexed wherever indexing is judged (a redirect to it)", () => {
    const pointing = (site: Site, pageId: string): Site => {
      (site.contract.internalSeo as Json).redirects = [{
        fromPath: "/old-sectors",
        destination: { kind: "page", pageId },
        status: 308,
        preserveQuery: true,
      }];
      return site;
    };
    for (const hidden of [true, false]) {
      const production = pointing(withStaticToggle(hidden), HOME);
      const candidate = pointing(withStaticToggle(hidden), INDUSTRIES);
      assert.equal(compatibility(production, candidate), hidden ? "COMPATIBILITY_REDIRECT_CHANGED" : ACCEPTED, `hidden ${hidden}`);
    }
  });

  it("admits adding a generated page's item toggle", () => {
    const production = contentSemanticsFixture();
    assert.equal(compatibility(production, withItemToggle(false)), ACCEPTED);
  });

  it("adopts only the toggle: any other absent fact stays closed, and a toggle once named stays", () => {
    for (const section of ["pages", "generatedPages"]) {
      const rules = seoFactRules(section);
      const entry = { pageId: INDUSTRIES, metadata: { title: SEO_TITLE } };
      const adopt = (key: string) => ({ ...entry, metadata: { ...entry.metadata, [key]: TOGGLE } });
      assert.equal(isPreservedBy(entry, adopt("hiddenFieldId"), rules), true, section);
      for (const key of ["hiddenFieldID", "hidden", "noindexFieldId", "imageFieldId"]) {
        assert.equal(isPreservedBy(entry, adopt(key), rules), false, `${section} ${key}`);
      }
      assert.equal(isPreservedBy(entry, { ...entry, hiddenFieldId: TOGGLE }, rules), false, `${section} top-level`);
      assert.equal(isPreservedBy(adopt("hiddenFieldId"), entry, rules), false, `${section} drop`);
      assert.equal(isPreservedBy(adopt("hiddenFieldId"), { ...entry, metadata: { ...entry.metadata, hiddenFieldId: ITEM_TOGGLE } }, rules), false, `${section} swap`);
    }
  });

  const refusals: readonly { name: string; code: string; mutate: (candidate: Site) => void }[] = [
    {
      name: "taking the toggle away once a page has one",
      code: "COMPATIBILITY_DECLARATION_REMOVED",
      mutate: (candidate) => {
        delete (seoEntry(candidate.contract, INDUSTRIES).metadata as Json).hiddenFieldId;
        (sectionOf(candidate.contract, SEARCH_SECTION).fields as Json[]).pop();
        candidate.content.values = values(candidate.content).filter((value) => value.fieldId !== TOGGLE);
        (candidate.contract.tombstonedIds as string[]).push(TOGGLE);
      },
    },
    {
      name: "unnaming the toggle while keeping it declared",
      code: "CONTRACT_SEO_FIELD_POLICY",
      mutate: (candidate) => {
        delete (seoEntry(candidate.contract, INDUSTRIES).metadata as Json).hiddenFieldId;
      },
    },
    {
      name: "flipping the customer's value in code",
      code: "COMPATIBILITY_CONTENT_CHANGED",
      mutate: (candidate) => {
        values(candidate.content).find((value) => value.fieldId === TOGGLE)!.value = true;
      },
    },
  ];

  for (const refusal of refusals) {
    it(`refuses ${refusal.name}`, () => {
      const candidate = withStaticToggle(false);
      refusal.mutate(candidate);
      assert.equal(compatibility(withStaticToggle(false), candidate), refusal.code);
    });
  }

  it("keeps the home and admin pages' robots the code's (no toggle, null)", () => {
    const site = withStaticToggle();
    const contract = parseManagedSiteContractV1(site.contract);
    const content = parseManagedSiteContentDocument(site.content);
    assert.equal(managedSearchHiddenV1(contract, content, HOME), null);
  });
});

describe("retiring a page that has a search-visibility toggle", () => {
  it("takes the toggle with the page (its search entry names it, and goes too)", () => {
    const site = withStaticToggle(false);
    const declaration = parseManagedSiteFieldMigrationV1({
      schemaVersion: "1.0",
      from: { contractSha256: "0".repeat(64), contentSha256: "0".repeat(64) },
      steps: [{ op: "retire", pages: [INDUSTRIES] }],
    });
    const [[retired]] = resolveManagedSiteFieldMigrationPageRetiresV1(
      parseManagedSiteContractV1(site.contract),
      parseManagedSiteContentDocument(site.content),
      declaration,
    );
    assert.ok(retired?.fields.some(({ field }) => field.id === TOGGLE));
  });
});

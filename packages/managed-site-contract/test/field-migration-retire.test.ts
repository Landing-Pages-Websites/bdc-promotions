import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ManagedSiteContractError,
  managedSiteFieldMigrationFromV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  validateManagedSiteContractV1MigrationCompatibility,
  type ManagedSiteFieldMigrationProofV1,
} from "../src/index.js";

/**
 * All Points Media production revision 6 (commit d7d5025), trimmed to its
 * `/about` and `/admin` pages: the real contract and content the first retire
 * removes from. PR #79 gave the internal `/admin` page a "Search and sharing"
 * section with a customer-editable `seo_title` and `seo_description`, and
 * pointed the page's search title and description at them; the share card
 * still echoes the protected fields holding the same text.
 */
const FIXTURE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/field-migration-retire",
);

type Json = Record<string, unknown>;

interface RetireCase {
  productionContract: Json;
  productionContent: Json;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
}

const ADMIN_PAGE = "page_4d55wdpg80nwt0x1sv8h30beeg";
const ADMIN_SECTION = "section_6rs3m3v8256n8y3hfskgwv7w5c";
const ADMIN_TITLE = "field_yzkbw6kfpwtx06w1q0ekd7v2yw";
const ADMIN_DESCRIPTION = "field_9773p6wekrkgdjt6xdhqw4awpg";
const ADMIN_PROTECTED_TITLE = "field_08m80eyw6tnxc1b1x6k1ktaxjm";
const ADMIN_PROTECTED_DESCRIPTION = "field_pc9ygx26dy2ejfpv206m4c6z9r";
const ABOUT_PAGE = "page_teyen9zyv63gwppbsgsqkkb5mc";
/** Three unreferenced body fields, the whole of their section. */
const ABOUT_BODY_SECTION = "section_7wte23g4zygskgvz8wa7wp6ay0";
const ABOUT_BODY = [
  "field_swv2v6gtjnat0mc0m8jddq5pe4",
  "field_9982gs793d57f3d652r9057804",
  "field_4gr72kte96vc9ffe82ybgm0348",
];
const ABOUT_SEO_TITLE = "field_phmbcpgtsme0nsq6hf4scsrsw4";
const ABOUT_OUTLINED_HEADING = "field_94pg5q6n15epdekjmybkkby458";
const ABOUT_OUTLINED_H1 = "field_pcrpv6x38wr2bxebtewm6tswhc";
const ABOUT_CODE_OWNED_LABEL = "field_k30rmedadmw8bvxf8k38naafgg";
const ABOUT_COLLECTION_FIELD = "field_6q7ns4jxvhj2cvj7yey07msesw";
const COLLECTION_ITEM_FIELD = "field_qenc8s33avt8y0qmdtc55ahxsc";
/** A well-formed field id no contract declares. */
const UNKNOWN_FIELD = "field_" + "1".repeat(25) + "0";
const UNKNOWN_SECTION = "section_" + "1".repeat(25) + "0";
const ACCEPTED = "ACCEPTED";

function read(name: string): Json {
  return JSON.parse(readFileSync(resolve(FIXTURE_DIRECTORY, `${name}.json`), "utf8")) as Json;
}

const PRODUCTION = Object.freeze({ contract: read("production.contract"), content: read("production.content") });

function pages(contract: Json): Json[] {
  return contract.pages as Json[];
}

function sections(contract: Json): Json[] {
  return pages(contract).flatMap((page) => page.sections as Json[]);
}

function sectionOf(contract: Json, sectionId: string): Json {
  const found = sections(contract).find((section) => section.id === sectionId);
  if (found === undefined) throw new Error(`No section ${sectionId}`);
  return found;
}

function seoPage(contract: Json, pageId: string): Json {
  const found = ((contract.internalSeo as Json).pages as Json[]).find((page) => page.pageId === pageId);
  if (found === undefined) throw new Error(`No SEO page ${pageId}`);
  return found;
}

function metadata(contract: Json, pageId: string): Json {
  return seoPage(contract, pageId).metadata as Json;
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

function valueOf(content: Json, fieldId: string): Json {
  const found = values(content).find((value) => value.fieldId === fieldId);
  if (found === undefined) throw new Error(`No value ${fieldId}`);
  return found;
}

function tombstones(contract: Json): string[] {
  return contract.tombstonedIds as string[];
}

/**
 * The candidate code would write for a retire: each field undeclared and
 * valueless, each named section undeclared, every id tombstoned, and each
 * search slot that named a field pointed at its share-card echo.
 */
function applyRetire(migration: RetireCase, fields: readonly string[], sectionIds: readonly string[]): void {
  const removed = new Set(fields);
  const contract = migration.candidateContract;
  for (const page of pages(contract)) {
    for (const section of page.sections as Json[]) {
      section.fields = (section.fields as Json[]).filter((field) => !removed.has(field.id as string));
    }
    page.sections = (page.sections as Json[]).filter((section) => !sectionIds.includes(section.id as string));
  }
  for (const page of (contract.internalSeo as Json).pages as Json[]) {
    const slots = page.metadata as Json;
    const social = slots.social as Json;
    for (const slot of ["title", "description"]) {
      if (removed.has(slots[slot] as string)) slots[slot] = social[slot];
    }
  }
  contract.tombstonedIds = [...tombstones(contract), ...fields, ...sectionIds].sort();
  migration.candidateContent.values = values(migration.candidateContent).filter(
    (value) => !removed.has(value.fieldId as string),
  );
}

/** Signs the declaration against production as it now stands. */
function refreshFrom(migration: RetireCase): void {
  migration.declaration.from = managedSiteFieldMigrationFromV1(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
  );
}

function retireCase(
  fields: readonly string[] = [ADMIN_TITLE, ADMIN_DESCRIPTION],
  sectionIds: readonly string[] = [ADMIN_SECTION],
): RetireCase {
  const migration: RetireCase = {
    productionContract: structuredClone(PRODUCTION.contract),
    productionContent: structuredClone(PRODUCTION.content),
    candidateContract: structuredClone(PRODUCTION.contract),
    candidateContent: structuredClone(PRODUCTION.content),
    declaration: {
      schemaVersion: "1.0",
      steps: [{ op: "retire", fields: [...fields], ...(sectionIds.length > 0 ? { sections: [...sectionIds] } : {}) }],
    },
  };
  applyRetire(migration, fields, sectionIds);
  refreshFrom(migration);
  return migration;
}

function steps(migration: RetireCase): Json[] {
  return migration.declaration.steps as Json[];
}

function verify(migration: RetireCase): ManagedSiteFieldMigrationProofV1 {
  return validateManagedSiteContractV1MigrationCompatibility(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    migration.declaration,
    { admitBridge: () => false },
  );
}

function outcome(migration: RetireCase): string {
  try {
    verify(migration);
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

/** Drops the outline entries naming `fieldId` from the candidate, as code would. */
function withoutOutlineEntry(migration: RetireCase, fieldId: string): RetireCase {
  for (const page of (migration.candidateContract.internalSeo as Json).pages as Json[]) {
    page.headingOutline = (page.headingOutline as Json[]).filter((entry) => entry.fieldId !== fieldId);
  }
  return migration;
}

/** The APM retire, over a production where `fieldId` holds `text`. */
function editedInProduction(fieldId: string, text: string): RetireCase {
  const migration = retireCase();
  valueOf(migration.productionContent, fieldId).value = text;
  refreshFrom(migration);
  return migration;
}

/** Both sides of production, so the change is to production itself. */
function onProduction(migration: RetireCase, change: (contract: Json, content: Json) => void): void {
  change(migration.productionContract, migration.productionContent);
  change(migration.candidateContract, migration.candidateContent);
  refreshFrom(migration);
}

interface Row {
  readonly name: string;
  readonly expected: string;
  readonly build: () => RetireCase;
}

const ROWS: readonly Row[] = [
  {
    name: "All Points Media: the two /admin search fields and their section",
    expected: ACCEPTED,
    build: () => retireCase(),
  },
  {
    name: "the fields alone, leaving the section declared and empty",
    expected: ACCEPTED,
    build: () => retireCase([ADMIN_TITLE, ADMIN_DESCRIPTION], []),
  },
  {
    name: "one search field, its sibling and section kept",
    expected: ACCEPTED,
    build: () => retireCase([ADMIN_DESCRIPTION], []),
  },
  {
    name: "unreferenced body copy and the section it fills, on another page",
    expected: ACCEPTED,
    build: () => retireCase(ABOUT_BODY, [ABOUT_BODY_SECTION]),
  },
  {
    name: "a heading line no outline names, and nothing else reads",
    expected: ACCEPTED,
    build: () => retireCase(["field_8tv6ec1bp3b0b6z3a4bb2g8g58"], []),
  },
  {
    name: "two retire steps, one per page",
    expected: ACCEPTED,
    build: () => {
      const migration = retireCase([...ABOUT_BODY, ADMIN_TITLE, ADMIN_DESCRIPTION], [ABOUT_BODY_SECTION, ADMIN_SECTION]);
      migration.declaration.steps = [
        { op: "retire", fields: ABOUT_BODY, sections: [ABOUT_BODY_SECTION] },
        { op: "retire", fields: [ADMIN_TITLE, ADMIN_DESCRIPTION], sections: [ADMIN_SECTION] },
      ];
      return migration;
    },
  },
  {
    name: "the declaration is stale against production",
    expected: "MIGRATION_FROM_STALE",
    build: () => {
      const migration = retireCase();
      valueOf(migration.productionContent, ABOUT_BODY[0]).value = "Edited since the declaration was written.";
      return migration;
    },
  },
  {
    name: "a field still declared in the candidate",
    expected: "MIGRATION_RETIRE_STILL_DECLARED",
    build: () => {
      const migration = retireCase([ADMIN_TITLE, ADMIN_DESCRIPTION], []);
      migration.candidateContract = structuredClone(migration.productionContract);
      migration.candidateContent = structuredClone(migration.productionContent);
      return migration;
    },
  },
  {
    name: "a section still declared after it is named",
    expected: "MIGRATION_RETIRE_STILL_DECLARED",
    build: () => {
      const migration = retireCase([ADMIN_TITLE, ADMIN_DESCRIPTION], []);
      steps(migration)[0].sections = [ADMIN_SECTION];
      return migration;
    },
  },
  {
    name: "a field removed but not tombstoned",
    expected: "MIGRATION_TOMBSTONES_INCOMPLETE",
    build: () => {
      const migration = retireCase();
      migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== ADMIN_TITLE);
      return migration;
    },
  },
  {
    name: "a section removed but not tombstoned",
    expected: "MIGRATION_TOMBSTONES_INCOMPLETE",
    build: () => {
      const migration = retireCase();
      migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== ADMIN_SECTION);
      return migration;
    },
  },
  {
    name: "a field production never declared",
    expected: "MIGRATION_RETIRE_UNKNOWN",
    build: () => {
      const migration = retireCase();
      (steps(migration)[0].fields as string[]).push(UNKNOWN_FIELD);
      return migration;
    },
  },
  {
    name: "a section production never declared",
    expected: "MIGRATION_RETIRE_UNKNOWN",
    build: () => {
      const migration = retireCase();
      (steps(migration)[0].sections as string[]).push(UNKNOWN_SECTION);
      return migration;
    },
  },
  {
    name: "a protected SEO field",
    expected: "MIGRATION_RETIRE_PROTECTED",
    build: () => {
      const migration = retireCase();
      (steps(migration)[0].fields as string[]).push(ADMIN_PROTECTED_TITLE);
      return migration;
    },
  },
  {
    name: "a code-owned interface label",
    expected: "MIGRATION_RETIRE_NOT_EDITABLE",
    build: () => retireCase([ABOUT_CODE_OWNED_LABEL], []),
  },
  {
    name: "a code-owned collection field",
    expected: "MIGRATION_RETIRE_NOT_EDITABLE",
    build: () => retireCase([ABOUT_COLLECTION_FIELD], []),
  },
  {
    name: "a collection item field",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () => {
      const migration = retireCase();
      (steps(migration)[0].fields as string[]).push(COLLECTION_ITEM_FIELD);
      return migration;
    },
  },
  {
    name: "an aliased field",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () => {
      const migration = retireCase([ABOUT_BODY[0]], []);
      onProduction(migration, (contract) => {
        contract.atomicAliasGroups = [{ id: `alias_${"1".repeat(25)}0`, fieldIds: [ABOUT_BODY[0], ABOUT_BODY[1]] }];
      });
      migration.candidateContract.atomicAliasGroups = [];
      return migration;
    },
  },
  {
    name: "the same field in two retire steps",
    expected: "MIGRATION_RETIRE_CLAIMED_TWICE",
    build: () => {
      const migration = retireCase();
      steps(migration).push({ op: "retire", fields: [ADMIN_TITLE] });
      return migration;
    },
  },
  {
    name: "the same section in two retire steps",
    expected: "MIGRATION_RETIRE_CLAIMED_TWICE",
    build: () => {
      const migration = retireCase([ADMIN_TITLE, ADMIN_DESCRIPTION, ABOUT_BODY[0]]);
      migration.declaration.steps = [
        { op: "retire", fields: [ADMIN_TITLE, ADMIN_DESCRIPTION], sections: [ADMIN_SECTION] },
        { op: "retire", fields: [ABOUT_BODY[0]], sections: [ADMIN_SECTION] },
      ];
      return migration;
    },
  },
  {
    name: "the same field twice in one step",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => {
      const migration = retireCase();
      steps(migration)[0].fields = [ADMIN_TITLE, ADMIN_TITLE, ADMIN_DESCRIPTION];
      return migration;
    },
  },
  {
    name: "a retire naming no field",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => {
      const migration = retireCase();
      steps(migration)[0].fields = [];
      return migration;
    },
  },
  {
    name: "a section id in the field list",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => {
      const migration = retireCase();
      steps(migration)[0].fields = [ADMIN_TITLE, ADMIN_DESCRIPTION, ADMIN_SECTION];
      return migration;
    },
  },
  {
    name: "a retire carrying a key it does not declare",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => {
      const migration = retireCase();
      steps(migration)[0].target = ADMIN_TITLE;
      return migration;
    },
  },
  {
    name: "a section the migration has not emptied",
    expected: "MIGRATION_RETIRE_SECTION_NOT_EMPTY",
    build: () => {
      const migration = retireCase([ADMIN_TITLE], []);
      steps(migration)[0].sections = [ADMIN_SECTION];
      return migration;
    },
  },
  {
    name: "a section emptied of the fields named, keeping one more",
    expected: "MIGRATION_RETIRE_SECTION_NOT_EMPTY",
    build: () => {
      const migration = retireCase(ABOUT_BODY.slice(0, 2), []);
      steps(migration)[0].sections = [ABOUT_BODY_SECTION];
      return migration;
    },
  },
  {
    name: "a customer-edited search title: the page serves other words than the echo",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => {
      const migration = retireCase();
      onProduction(migration, (_contract, content) => {
        const value = values(content).find((entry) => entry.fieldId === ADMIN_TITLE);
        if (value !== undefined) value.value = "Customer's own search title";
      });
      return migration;
    },
  },
  {
    name: "a search title with no share-card echo to fall back to",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => {
      const migration = retireCase();
      onProduction(migration, (contract) => {
        (metadata(contract, ADMIN_PAGE).social as Json).title = null;
      });
      metadata(migration.candidateContract, ADMIN_PAGE).title = ADMIN_PROTECTED_TITLE;
      return migration;
    },
  },
  {
    name: "a heading an outline names, the outline entry dropped too",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => withoutOutlineEntry(retireCase([ABOUT_OUTLINED_HEADING], []), ABOUT_OUTLINED_HEADING),
  },
  {
    name: "the page H1 an outline names, the outline entry dropped too",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => withoutOutlineEntry(retireCase([ABOUT_OUTLINED_H1], []), ABOUT_OUTLINED_H1),
  },
  {
    name: "another page's search title whose echo serves the same text",
    expected: ACCEPTED,
    build: () => retireCase([ABOUT_SEO_TITLE], []),
  },
  {
    name: "a customer-edited search description, the title untouched",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => editedInProduction(ADMIN_DESCRIPTION, "All Points Media, as the customer wrote it."),
  },
  {
    name: "a search title the customer cleared, which the page falls back from",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => editedInProduction(ADMIN_TITLE, ""),
  },
  {
    name: "a search title differing from its echo by trailing space alone",
    expected: "MIGRATION_RETIRE_REFERENCED",
    build: () => editedInProduction(ADMIN_TITLE, "Newsletter PDFs — All Points Media "),
  },
  {
    name: "a candidate that still serves a value for a retired field",
    expected: "MIGRATION_SOURCE_VALUE_REMAINS",
    build: () => {
      const migration = retireCase();
      values(migration.candidateContent).push(structuredClone(valueOf(migration.productionContent, ADMIN_TITLE)));
      return migration;
    },
  },
  {
    name: "a candidate that also changes a value it does not retire",
    expected: "MIGRATION_UNDECLARED_CHANGE",
    build: () => {
      const migration = retireCase();
      valueOf(migration.candidateContent, ADMIN_PROTECTED_TITLE).value = "New protected title";
      return migration;
    },
  },
  {
    name: "a candidate that drops a field (and its value) the declaration does not name",
    expected: "MIGRATION_UNDECLARED_CHANGE",
    build: () => {
      const migration = retireCase();
      steps(migration)[0].fields = [ADMIN_TITLE];
      delete steps(migration)[0].sections;
      return migration;
    },
  },
  {
    name: "a candidate that drops a section the declaration does not name",
    expected: "COMPATIBILITY_DECLARATION_REMOVED",
    build: () => {
      const migration = retireCase();
      delete steps(migration)[0].sections;
      return migration;
    },
  },
  {
    name: "a candidate that also clears the share-card echo",
    expected: "COMPATIBILITY_PAGE_SEO_CHANGED",
    build: () => {
      const migration = retireCase();
      (metadata(migration.candidateContract, ADMIN_PAGE).social as Json).description = null;
      return migration;
    },
  },
];

describe("a declared retire", () => {
  for (const row of ROWS) {
    it(`${row.expected}: ${row.name}`, () => assert.equal(outcome(row.build()), row.expected));
  }
});

describe("a retire's proof", () => {
  it("names every field and section it removed, at the step's position", () => {
    const proof = verify(retireCase());
    assert.deepEqual(proof.steps, [{
      op: "retire",
      fields: [ADMIN_TITLE, ADMIN_DESCRIPTION].map((fieldId) => ({
        fieldId,
        owner: { kind: "page", pageId: ADMIN_PAGE },
        pageId: ADMIN_PAGE,
        sectionId: ADMIN_SECTION,
      })),
      sections: [{ sectionId: ADMIN_SECTION, pageId: ADMIN_PAGE }],
    }]);
  });

  it("lists each search slot that falls back to its protected echo", () => {
    const proof = verify(retireCase());
    assert.deepEqual(proof.added.filter((item) => item.kind === "seo_repointed"), [
      { kind: "seo_repointed", pageId: ADMIN_PAGE, slot: "title", from: ADMIN_TITLE, to: ADMIN_PROTECTED_TITLE },
      { kind: "seo_repointed", pageId: ADMIN_PAGE, slot: "description", from: ADMIN_DESCRIPTION, to: ADMIN_PROTECTED_DESCRIPTION },
    ]);
  });

  it("accounts for the removed values as consumed and keeps every other value", () => {
    const migration = retireCase();
    const proof = verify(migration);
    const production = values(migration.productionContent).length;
    assert.deepEqual(proof.accounting, {
      productionValues: production,
      unchanged: production - 2,
      consumed: 2,
      candidateValues: production - 2,
      targets: 0,
      added: 0,
    });
    assert.deepEqual(proof.additions, { stableIds: [], contentValues: [], assetManifestEntries: 0 });
  });

  it("is the same whichever order code lists the retired fields", () => {
    const forward = verify(retireCase());
    const migration = retireCase();
    steps(migration)[0].fields = [ADMIN_DESCRIPTION, ADMIN_TITLE];
    const reversed = verify(migration);
    assert.deepEqual(new Set(reversed.steps.flatMap((step) => ("fields" in step ? step.fields : []))), new Set(forward.steps.flatMap((step) => ("fields" in step ? step.fields : []))));
  });

  it("parses a retire step exactly as declared, with no section key added", () => {
    const parsed = parseManagedSiteFieldMigrationV1({
      schemaVersion: "1.0",
      from: { contractSha256: "a".repeat(64), contentSha256: "b".repeat(64) },
      steps: [{ op: "retire", fields: [ADMIN_TITLE] }],
    });
    assert.deepEqual(parsed.steps, [{ op: "retire", fields: [ADMIN_TITLE] }]);
  });
});

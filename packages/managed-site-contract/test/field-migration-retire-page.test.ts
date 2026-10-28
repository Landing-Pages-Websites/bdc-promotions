import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { generateManagedSiteFieldMigrationJsonSchemaV1 } from "../src/field-migration-json-schema.js";
import { resolveManagedSiteFieldMigrationPageRetiresV1 } from "../src/field-migration-retire-pages.js";
import {
  ManagedSiteContractError,
  managedSiteFieldMigrationFromV1,
  managedSiteFieldMigrationRetireCarriedIdsV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  validateManagedSiteContractV1MigrationCompatibility,
  type ManagedSiteContractV1,
  type ManagedSiteFieldMigrationProofV1,
  type ManagedSiteFieldMigrationRetireStepProofV1,
} from "../src/index.js";

/**
 * 0.30.0: a retire step may name whole static pages. Invariant: a retired
 * page takes exactly itself, its sections, every field it declares and every
 * protected field only it renders (its own search slots), with every value on
 * them, and drops its usage from every field that stays; nothing that stays
 * names any of it, and everything else is held to the ordinary rules
 * unchanged.
 *
 * All Points Media production revision 19 (commit 90a38f3, contract 966d581d,
 * content 9bc4fcd6, read from the production database), trimmed to `/`
 * (header, footer and the site-wide text and links that render on every
 * page, plus home's search slots), `/admin`, `/industries` and
 * `/innovation/network-portal`, which 404s live and Peter decided to remove
 * (2026-10-05). It declares no section: only its four search slots and the
 * usages of every site-wide field.
 */
const FIXTURE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/field-migration-retire-page",
);

type Json = Record<string, unknown>;

interface PageCase {
  productionContract: Json;
  productionContent: Json;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
}

const HOME = "page_fwtww4abmmbqasq46zssffva24";
const ADMIN = "page_4d55wdpg80nwt0x1sv8h30beeg";
const INDUSTRIES = "page_9xbw114xjkzzb8dy8gyr7zwxhc";
const PORTAL = "page_p0633t3v71w42r82xxcqv8nvxw";
const PORTAL_SEARCH_SLOTS = [
  "field_w186svm0hesgj9dekdmc0x7kr4",
  "field_aaf2r8z1n9w8r9vq6f9bxkwgew",
  "field_q8wet8gcvqe4wdc63zy85ajqj4",
  "field_400v14hwwvydexxjeab25xhtfw",
];
const SITE_NAV_LINK = "field_rbvpx7nh8jckv41xt7n1539k40";
const SITE_LEGAL_NAME = "field_hbdw04cj6f53ny3f94qhmvx114";
const SITE_DESCRIPTION = "field_z2pfyzj339kfqbcj9qhjwxpmkg";
const ADMIN_CANONICAL = "field_1pcvtx5mkzg3rp68338f5g3d8w";
const INDUSTRIES_FIRST_FIELD = "field_3gtqgwgazvq7x4srj9cnrhattg";
const INDUSTRIES_H1 = "field_qthae1x3bj1tv1yjrbj8k6wwgg";
const UNKNOWN_PAGE = "page_" + "1".repeat(25) + "0";
const ACCEPTED = "ACCEPTED";

function read(name: string): Json {
  return JSON.parse(readFileSync(resolve(FIXTURE_DIRECTORY, `${name}.json`), "utf8")) as Json;
}

const PRODUCTION = Object.freeze({ contract: read("production.contract"), content: read("production.content") });

function pages(contract: Json): Json[] {
  return contract.pages as Json[];
}

function pageOf(contract: Json, id: string): Json {
  const found = pages(contract).find((page) => page.id === id);
  if (found === undefined) throw new Error(`No page ${id}`);
  return found;
}

function sections(page: Json): Json[] {
  return page.sections as Json[];
}

function renderedFields(contract: Json): Json[] {
  return pages(contract).flatMap((page) => sections(page).flatMap((section) => section.fields as Json[]));
}

function seo(contract: Json): Json {
  return contract.internalSeo as Json;
}

function protectedFields(contract: Json): Json[] {
  return seo(contract).protectedFields as Json[];
}

function seoPages(contract: Json): Json[] {
  return seo(contract).pages as Json[];
}

function seoEntry(contract: Json, pageId: string): Json {
  const found = seoPages(contract).find((entry) => entry.pageId === pageId);
  if (found === undefined) throw new Error(`No search entry for ${pageId}`);
  return found;
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

function usages(field: Json): Json[] {
  return field.usages as Json[];
}

function fieldById(contract: Json, id: string): Json {
  const found = [...renderedFields(contract), ...protectedFields(contract)].find((field) => field.id === id);
  if (found === undefined) throw new Error(`No field ${id}`);
  return found;
}

/** A search slot the page owns: page-scoped and rendered only on it. */
function ownSlot(field: Json, pageId: string): boolean {
  return field.scope === "page" && usages(field).every((usage) => usage.pageId === pageId);
}

/** What a page carries, read from the contract exactly as code would write it. */
function carriedBy(contract: Json, pageId: string): string[] {
  const page = pageOf(contract, pageId);
  return [
    pageId,
    ...sections(page).map((section) => section.id as string),
    ...sections(page).flatMap((section) => (section.fields as Json[]).map((field) => field.id as string)),
    ...protectedFields(contract).filter((field) => ownSlot(field, pageId)).map((field) => field.id as string),
  ];
}

/**
 * The candidate code writes to retire pages: each page, its search entry and
 * protected fields undeclared, every usage on it dropped, every id it carried
 * tombstoned, every value on a removed field dropped.
 */
function applyPageRetire(migration: PageCase, pageIds: readonly string[]): void {
  const contract = migration.candidateContract;
  const removed = new Set(pageIds.flatMap((id) => carriedBy(contract, id)));
  const retired = new Set(pageIds);
  const keepUsages = (field: Json): Json => ({ ...field, usages: usages(field).filter((usage) => !retired.has(usage.pageId as string)) });
  contract.pages = pages(contract)
    .filter((page) => !retired.has(page.id as string))
    .map((page) => ({
      ...page,
      sections: sections(page).map((section) => ({ ...section, fields: (section.fields as Json[]).map(keepUsages) })),
    }));
  seo(contract).protectedFields = protectedFields(contract)
    .filter((field) => !removed.has(field.id as string))
    .map(keepUsages);
  seo(contract).pages = seoPages(contract).filter((entry) => !retired.has(entry.pageId as string));
  contract.tombstonedIds = [...new Set([...(contract.tombstonedIds as string[]), ...removed])].sort();
  migration.candidateContent.values = values(migration.candidateContent).filter(
    (value) => !removed.has(value.fieldId as string),
  );
}

function refreshFrom(migration: PageCase): void {
  migration.declaration.from = managedSiteFieldMigrationFromV1(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
  );
}

function freshCase(steps: Json[]): PageCase {
  return {
    productionContract: structuredClone(PRODUCTION.contract),
    productionContent: structuredClone(PRODUCTION.content),
    candidateContract: structuredClone(PRODUCTION.contract),
    candidateContent: structuredClone(PRODUCTION.content),
    declaration: { schemaVersion: "1.0", steps },
  };
}

/**
 * A page-retire case. `before` edits production (and the candidate with it,
 * as code that already held the edit would) before the retire is applied.
 */
function pageCase(pageIds: readonly string[], before: (migration: PageCase) => void = () => {}): PageCase {
  const migration = freshCase([{ op: "retire", pages: [...pageIds] }]);
  before(migration);
  migration.candidateContract = structuredClone(migration.productionContract);
  migration.candidateContent = structuredClone(migration.productionContent);
  applyPageRetire(migration, pageIds);
  refreshFrom(migration);
  return migration;
}

function verify(migration: PageCase): ManagedSiteFieldMigrationProofV1 {
  return validateManagedSiteContractV1MigrationCompatibility(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    migration.declaration,
    { admitBridge: () => true },
  );
}

function verdict(migration: PageCase): string {
  try {
    verify(migration);
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

function retireProof(proof: ManagedSiteFieldMigrationProofV1, index = 0): ManagedSiteFieldMigrationRetireStepProofV1 {
  const step = proof.steps[index];
  assert.equal(step?.op, "retire");
  return step as ManagedSiteFieldMigrationRetireStepProofV1;
}

/** A new customer-editable link field on /industries, holding `destination`. */
function addIndustriesLink(migration: PageCase, destination: Json): void {
  const field = {
    ...structuredClone(fieldById(migration.productionContract, SITE_NAV_LINK)),
    id: "field_" + "2".repeat(25) + "0",
    scope: "page",
    resolver: { kind: "json_pointer", path: "src/content/pages/industries.json", pointer: "/retireFixture/link" },
    usages: [{ pageId: INDUSTRIES, itemId: null }],
  };
  sections(pageOf(migration.productionContract, INDUSTRIES))[0]!.fields = [
    ...(sections(pageOf(migration.productionContract, INDUSTRIES))[0]!.fields as Json[]),
    field,
  ];
  values(migration.productionContent).push({
    type: "link",
    owner: { kind: "page", pageId: INDUSTRIES },
    fieldId: field.id,
    value: { label: "Network portal", target: "same_window", destination },
  });
}

describe("field migration retire: whole pages (0.30.0)", () => {
  it("retires All Points Media's /innovation/network-portal, its search slots and every usage on it", () => {
    const proof = verify(pageCase([PORTAL]));
    const step = retireProof(proof);
    assert.deepEqual(step.fields, []);
    assert.deepEqual(step.sections, []);
    const [page] = step.pages ?? [];
    assert.equal(page?.pageId, PORTAL);
    assert.equal(page?.path, "/innovation/network-portal");
    assert.deepEqual(page?.sections, []);
    assert.deepEqual(page?.fields, []);
    assert.deepEqual(page?.protectedFields.map((field) => field.fieldId), PORTAL_SEARCH_SLOTS);
    assert.ok(page?.protectedFields.every((field) => field.owner.kind === "page" && field.owner.pageId === PORTAL));
    const unrendered = renderedFields(PRODUCTION.contract)
      .concat(protectedFields(PRODUCTION.contract))
      .filter((field) => !PORTAL_SEARCH_SLOTS.includes(field.id as string))
      .filter((field) => usages(field).some((usage) => usage.pageId === PORTAL))
      .map((field) => field.id);
    assert.deepEqual(page?.unrendered, unrendered);
    assert.ok(unrendered.includes(SITE_NAV_LINK) && unrendered.includes(SITE_LEGAL_NAME));
    assert.deepEqual(proof.accounting, {
      productionValues: values(PRODUCTION.content).length,
      unchanged: values(PRODUCTION.content).length - 4,
      consumed: 4,
      candidateValues: values(PRODUCTION.content).length - 4,
      targets: 0,
      added: 0,
    });
    assert.deepEqual(proof.added, []);
    assert.deepEqual(proof.additions, { stableIds: [], contentValues: [], assetManifestEntries: 0 });
  });

  it("retires a page with sections, taking its customer-editable fields and their values", () => {
    const proof = verify(pageCase([INDUSTRIES]));
    const [page] = retireProof(proof).pages ?? [];
    const declared = sections(pageOf(PRODUCTION.contract, INDUSTRIES));
    assert.deepEqual(page?.sections, declared.map((section) => section.id));
    assert.deepEqual(
      page?.fields.map((field) => [field.fieldId, field.sectionId]),
      declared.flatMap((section) => (section.fields as Json[]).map((field) => [field.id, section.id])),
    );
    assert.ok(page?.fields.every((field) => field.pageId === INDUSTRIES && field.owner.kind === "page"));
    assert.equal(proof.accounting.consumed, values(PRODUCTION.content).filter(
      (value) => (value.owner as Json).pageId === INDUSTRIES,
    ).length);
  });

  it("retires two pages in one step and in two steps, each proof at its own position", () => {
    assert.equal(verdict(pageCase([PORTAL, INDUSTRIES])), ACCEPTED);
    const migration = pageCase([PORTAL, INDUSTRIES]);
    migration.declaration.steps = [{ op: "retire", pages: [INDUSTRIES] }, { op: "retire", pages: [PORTAL] }];
    const proof = verify(migration);
    assert.deepEqual(proof.steps.map((step) => (step as ManagedSiteFieldMigrationRetireStepProofV1).pages?.[0]?.pageId), [INDUSTRIES, PORTAL]);
  });

  it("keeps a page step at its position beside a field retire, which proves exactly as before", () => {
    const migration = pageCase([PORTAL]);
    const field = "field_xdq960d4767ek5yn8ath2jzyvg";
    applyFieldRetire(migration, field);
    migration.declaration.steps = [{ op: "retire", fields: [field] }, { op: "retire", pages: [PORTAL] }];
    const proof = verify(migration);
    assert.deepEqual(retireProof(proof, 0).fields.map((entry) => entry.fieldId), [field]);
    assert.equal(retireProof(proof, 0).pages, undefined);
    assert.equal(retireProof(proof, 1).pages?.[0]?.pageId, PORTAL);
    assert.equal(proof.accounting.consumed, 5);
  });

  it("admits a link to a page that stays whose path merely starts with the retired one", () => {
    const migration = pageCase([PORTAL], (production) => {
      values(production.productionContent).find((value) => value.fieldId === ADMIN_CANONICAL)!.value =
        "https://www.allpointsco.com/innovation/network-portal-archive";
    });
    // Code moving /admin's canonical is not this test's subject: production and candidate agree.
    assert.notEqual(verdict(migration), "MIGRATION_RETIRE_REFERENCED");
  });

  it("admits a new page at the retired path as an ordinary, listed addition", () => {
    const migration = pageCase([PORTAL]);
    const fresh = "page_" + "3".repeat(25) + "0";
    const admin = structuredClone(pageOf(migration.candidateContract, ADMIN));
    pages(migration.candidateContract).push({ ...admin, id: fresh, route: { kind: "static", path: "/innovation/network-portal" } });
    const adminSeo = structuredClone(seoEntry(migration.candidateContract, ADMIN));
    seoPages(migration.candidateContract).push({ ...adminSeo, pageId: fresh });
    for (const field of protectedFields(migration.candidateContract)) {
      if (usages(field).some((usage) => usage.pageId === ADMIN) && field.scope === "site") {
        usages(field).push({ pageId: fresh, itemId: null });
      }
    }
    const proof = verify(migration);
    assert.ok(proof.additions.stableIds.includes(fresh));
  });

  const refusals: readonly { name: string; code: string; build: () => PageCase }[] = [
    {
      name: "the candidate still declares the page",
      code: "MIGRATION_RETIRE_STILL_DECLARED",
      build: () => {
        const migration = pageCase([PORTAL]);
        pages(migration.candidateContract).push(structuredClone(pageOf(PRODUCTION.contract, PORTAL)));
        seoPages(migration.candidateContract).push(structuredClone(seoEntry(PRODUCTION.contract, PORTAL)));
        protectedFields(migration.candidateContract).push(
          ...PORTAL_SEARCH_SLOTS.map((id) => structuredClone(fieldById(PRODUCTION.contract, id))),
        );
        for (const id of [PORTAL, ...PORTAL_SEARCH_SLOTS]) untombstone(migration, id);
        return migration;
      },
    },
    {
      name: "the candidate still declares one of its search slots",
      code: "MIGRATION_RETIRE_STILL_DECLARED",
      build: () => {
        const migration = pageCase([PORTAL]);
        const slot = structuredClone(fieldById(PRODUCTION.contract, PORTAL_SEARCH_SLOTS[0]!));
        slot.usages = [{ pageId: ADMIN, itemId: null }];
        protectedFields(migration.candidateContract).push(slot);
        untombstone(migration, PORTAL_SEARCH_SLOTS[0]!);
        return migration;
      },
    },
    ...[PORTAL, ...PORTAL_SEARCH_SLOTS].map((id) => ({
      name: `the candidate does not tombstone ${id}`,
      code: "MIGRATION_TOMBSTONES_INCOMPLETE",
      build: () => {
        const migration = pageCase([PORTAL]);
        untombstone(migration, id);
        return migration;
      },
    })),
    {
      name: "the candidate does not tombstone a retired section",
      code: "MIGRATION_TOMBSTONES_INCOMPLETE",
      build: () => {
        const migration = pageCase([INDUSTRIES]);
        const [section] = sections(pageOf(PRODUCTION.contract, INDUSTRIES));
        untombstone(migration, section!.id as string);
        return migration;
      },
    },
    {
      name: "the candidate keeps a retired page's value",
      code: "CONTENT_FIELD_TOMBSTONED",
      build: () => {
        const migration = pageCase([PORTAL]);
        values(migration.candidateContent).push(structuredClone(values(PRODUCTION.content).find((value) => value.fieldId === PORTAL_SEARCH_SLOTS[0])!));
        return migration;
      },
    },
    {
      name: "the candidate keeps a field's usage on the retired page",
      code: "CONTRACT_REFERENCE_TOMBSTONED",
      build: () => {
        const migration = pageCase([PORTAL]);
        usages(fieldById(migration.candidateContract, SITE_NAV_LINK)).push({ pageId: PORTAL, itemId: null });
        return migration;
      },
    },
    {
      name: "the candidate also drops a usage on a page that stays",
      code: "COMPATIBILITY_FIELD_POLICY_NARROWED",
      build: () => {
        const migration = pageCase([PORTAL]);
        const field = fieldById(migration.candidateContract, SITE_NAV_LINK);
        field.usages = usages(field).filter((usage) => usage.pageId !== HOME);
        return migration;
      },
    },
    {
      name: "the candidate changes a value that stays",
      code: "MIGRATION_UNDECLARED_CHANGE",
      build: () => {
        const migration = pageCase([PORTAL]);
        const value = values(migration.candidateContent).find((entry) => entry.fieldId === SITE_LEGAL_NAME)!;
        value.value = "All Points Company";
        return migration;
      },
    },
    {
      name: "the candidate drops a value that stays",
      code: "MIGRATION_UNDECLARED_CHANGE",
      build: () => {
        const migration = pageCase([PORTAL]);
        migration.candidateContent.values = values(migration.candidateContent).filter((value) => value.fieldId !== INDUSTRIES_FIRST_FIELD);
        return migration;
      },
    },
    {
      name: "the candidate drops another page as well",
      code: "MIGRATION_UNDECLARED_CHANGE",
      build: () => {
        const migration = pageCase([PORTAL]);
        applyPageRetire(migration, [ADMIN]);
        return migration;
      },
    },
    {
      name: "the candidate adds a redirect from the retired path",
      code: "COMPATIBILITY_REDIRECT_CHANGED",
      build: () => {
        const migration = pageCase([PORTAL]);
        seo(migration.candidateContract).redirects = [{
          fromPath: "/innovation/network-portal",
          destination: { kind: "page", pageId: HOME },
          status: 301,
          preserveQuery: false,
        }];
        return migration;
      },
    },
    {
      name: "production does not declare the page",
      code: "MIGRATION_RETIRE_UNKNOWN",
      build: () => {
        const migration = pageCase([PORTAL]);
        migration.declaration.steps = [{ op: "retire", pages: [UNKNOWN_PAGE] }];
        return migration;
      },
    },
    {
      name: "two steps name the same page",
      code: "MIGRATION_RETIRE_CLAIMED_TWICE",
      build: () => {
        const migration = pageCase([PORTAL]);
        migration.declaration.steps = [{ op: "retire", pages: [PORTAL] }, { op: "retire", pages: [PORTAL] }];
        return migration;
      },
    },
    {
      name: "a field retire names a field the page took",
      code: "MIGRATION_RETIRE_UNKNOWN",
      build: () => {
        const migration = pageCase([INDUSTRIES]);
        migration.declaration.steps = [{ op: "retire", pages: [INDUSTRIES] }, { op: "retire", fields: [INDUSTRIES_FIRST_FIELD] }];
        return migration;
      },
    },
    {
      name: "the declaration is stale",
      code: "MIGRATION_FROM_STALE",
      build: () => {
        const migration = pageCase([PORTAL]);
        (migration.declaration.from as Json).contentSha256 = "0".repeat(64);
        return migration;
      },
    },
    {
      name: "another page names it as its breadcrumb parent",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        seoEntry(migration.productionContract, INDUSTRIES).breadcrumbParentPageId = PORTAL;
      }),
    },
    {
      name: "another page requires a link to it",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        (seoEntry(migration.productionContract, INDUSTRIES).internalLinks as Json).requiredPageIds = [PORTAL];
      }),
    },
    {
      name: "a redirect sends visitors to it",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        seo(migration.productionContract).redirects = [{
          fromPath: "/network-portal",
          destination: { kind: "page", pageId: PORTAL },
          status: 301,
          preserveQuery: false,
        }];
      }),
    },
    {
      name: "a link value on a page that stays opens it",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        addIndustriesLink(migration, { kind: "internal", pageId: PORTAL, fragment: null });
      }),
    },
    {
      name: "a site-wide menu link opens it",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        const value = values(migration.productionContent).find((entry) => entry.fieldId === SITE_NAV_LINK)!;
        ((value.value as Json).destination as Json).pageId = PORTAL;
      }),
    },
    {
      name: "a link value on a page that stays opens a page retired alongside another",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL, ADMIN], (migration) => {
        addIndustriesLink(migration, { kind: "internal", pageId: ADMIN, fragment: null });
      }),
    },
    {
      name: "the business identity names one of its search slots",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        (seo(migration.productionContract).businessIdentity as Json).geo = PORTAL_SEARCH_SLOTS[0];
      }),
    },
    {
      name: "another page's outline names one of its fields",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([INDUSTRIES], (migration) => {
        (seoEntry(migration.productionContract, ADMIN).headingOutline as Json[]).push({ fieldId: INDUSTRIES_H1, semanticLevel: 2 });
      }),
    },
    {
      name: "one of its fields also renders on a page that stays",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([INDUSTRIES], (migration) => {
        const field = fieldById(migration.productionContract, INDUSTRIES_FIRST_FIELD);
        field.scope = "site";
        usages(field).push({ pageId: ADMIN, itemId: null });
        const value = values(migration.productionContent).find((entry) => entry.fieldId === INDUSTRIES_FIRST_FIELD)!;
        value.owner = { kind: "site" };
      }),
    },
    {
      name: "a field declared elsewhere renders only on it",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => {
        const migration = pageCase([PORTAL], (production) => {
          fieldById(production.productionContract, SITE_NAV_LINK).usages = [{ pageId: PORTAL, itemId: null }];
        });
        // Code that kept the field would have to render it somewhere: home, say.
        fieldById(migration.candidateContract, SITE_NAV_LINK).usages = [{ pageId: HOME, itemId: null }];
        return migration;
      },
    },
    {
      name: "it is a generated page",
      code: "MIGRATION_TRANSFORM_DEFERRED",
      build: () => pageCase([PORTAL], (migration) => {
        pageOf(migration.productionContract, PORTAL).route = {
          kind: "generated",
          pattern: "/innovation/[slug]",
          collectionId: "collection_" + "4".repeat(25) + "0",
          routeKeyFieldId: "field_" + "4".repeat(25) + "0",
        };
      }),
    },
    {
      name: "it holds an aliased field",
      code: "MIGRATION_TRANSFORM_DEFERRED",
      build: () => pageCase([INDUSTRIES], (migration) => {
        (migration.productionContract.atomicAliasGroups as Json[]).push({
          id: "alias_" + "5".repeat(25) + "0",
          fieldIds: [INDUSTRIES_FIRST_FIELD],
        });
      }),
    },
    {
      name: "a site-wide protected field renders only on it (the site's, not the page's)",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => {
        const migration = pageCase([PORTAL], (production) => {
          fieldById(production.productionContract, SITE_DESCRIPTION).usages = [{ pageId: PORTAL, itemId: null }];
        });
        fieldById(migration.candidateContract, SITE_DESCRIPTION).usages = [{ pageId: HOME, itemId: null }];
        return migration;
      },
    },
    ...[
      ["another page's canonical", "https://www.allpointsco.com/innovation/network-portal"],
      ["another page's canonical, with a trailing slash and a query", "https://www.allpointsco.com/innovation/network-portal/?ref=nav"],
    ].map(([name, url]) => ({
      name: `${name} spells its URL`,
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        values(migration.productionContent).find((value) => value.fieldId === ADMIN_CANONICAL)!.value = url;
      }),
    })),
    {
      name: "a link typed as external to the site itself opens it",
      code: "MIGRATION_RETIRE_REFERENCED",
      build: () => pageCase([PORTAL], (migration) => {
        addIndustriesLink(migration, { kind: "external", url: "https://www.allpointsco.com/innovation/network-portal" });
      }),
    },
    {
      name: "one of its search slots is aliased",
      code: "MIGRATION_TRANSFORM_DEFERRED",
      build: () => pageCase([PORTAL], (migration) => {
        (migration.productionContract.atomicAliasGroups as Json[]).push({
          id: "alias_" + "7".repeat(25) + "0",
          fieldIds: [PORTAL_SEARCH_SLOTS[0]],
        });
      }),
    },
  ];

  for (const refusal of refusals) {
    it(`refuses when ${refusal.name}`, () => {
      assert.equal(verdict(refusal.build()), refusal.code);
    });
  }

  it("defers a page holding a field of a type not proven retirable: a list, an image, or one added later", () => {
    for (const type of ["collection", "image", "video"]) {
      const contract = structuredClone(PRODUCTION.contract);
      fieldById(contract, INDUSTRIES_FIRST_FIELD).type = type;
      const declaration = parseManagedSiteFieldMigrationV1({ schemaVersion: "1.0", from: freshFrom(), steps: [{ op: "retire", pages: [INDUSTRIES] }] });
      assert.throws(
        () => resolveManagedSiteFieldMigrationPageRetiresV1(
          contract as unknown as ManagedSiteContractV1,
          parseManagedSiteContentDocument(PRODUCTION.content),
          declaration,
        ),
        (error: unknown) => error instanceof ManagedSiteContractError && error.code === "MIGRATION_TRANSFORM_DEFERRED",
      );
    }
  });
});

function untombstone(migration: PageCase, id: string): void {
  migration.candidateContract.tombstonedIds = (migration.candidateContract.tombstonedIds as string[]).filter((entry) => entry !== id);
}

/** A named field retired on /industries, as the field retire (0.21.0) writes it. */
function applyFieldRetire(migration: PageCase, fieldId: string): void {
  for (const page of pages(migration.candidateContract)) {
    for (const section of sections(page)) {
      section.fields = (section.fields as Json[]).filter((field) => field.id !== fieldId);
    }
  }
  migration.candidateContract.tombstonedIds = [...(migration.candidateContract.tombstonedIds as string[]), fieldId].sort();
  migration.candidateContent.values = values(migration.candidateContent).filter((value) => value.fieldId !== fieldId);
}

describe("field migration retire: the page step's shape", () => {
  const invalid: readonly { name: string; step: Json }[] = [
    { name: "pages beside fields", step: { op: "retire", pages: [PORTAL], fields: [INDUSTRIES_FIRST_FIELD] } },
    { name: "pages beside sections", step: { op: "retire", pages: [PORTAL], sections: ["section_" + "6".repeat(25) + "0"] } },
    { name: "pages beside collections", step: { op: "retire", pages: [PORTAL], collections: ["collection_" + "6".repeat(25) + "0"] } },
    { name: "a page twice", step: { op: "retire", pages: [PORTAL, PORTAL] } },
    { name: "no page", step: { op: "retire", pages: [] } },
    { name: "a field id as a page", step: { op: "retire", pages: [INDUSTRIES_FIRST_FIELD] } },
  ];

  for (const { name, step } of invalid) {
    it(`refuses ${name}`, () => {
      assert.throws(
        () => parseManagedSiteFieldMigrationV1({ schemaVersion: "1.0", from: freshFrom(), steps: [step] }),
        (error: unknown) => error instanceof ManagedSiteContractError,
      );
    });
  }

  it("publishes the same rule: a retire naming pages names nothing else", () => {
    const schema = JSON.stringify(generateManagedSiteFieldMigrationJsonSchemaV1());
    assert.ok(schema.includes('"if":{"required":["pages"]}'));
    assert.ok(schema.includes('"then":{"propertyNames":{"enum":["op","pages"]}}'));
    assert.ok(schema.includes('{"required":["pages"]}'));
  });
});

function freshFrom(): Json {
  return managedSiteFieldMigrationFromV1(
    parseManagedSiteContractV1(PRODUCTION.contract),
    parseManagedSiteContentDocument(PRODUCTION.content),
  ) as unknown as Json;
}

describe("field migration retire: what a page carries, from production alone", () => {
  it("carries a retired page's sections, fields and search slots, and never the page id itself", () => {
    const migration = pageCase([INDUSTRIES, PORTAL]);
    const carried = managedSiteFieldMigrationRetireCarriedIdsV1(
      parseManagedSiteContractV1(migration.productionContract),
      parseManagedSiteContentDocument(migration.productionContent),
      parseManagedSiteFieldMigrationV1(migration.declaration),
    );
    const expected = [INDUSTRIES, PORTAL].flatMap((id) => carriedBy(PRODUCTION.contract, id)).filter((id) => !id.startsWith("page_"));
    assert.deepEqual([...carried].sort(), expected.sort());
  });
});

/**
 * 0.41.0: a link field's query allowlist names pages. Invariant: an entry for
 * a retired page goes with the page (the candidate drops it, and the verifier
 * reads production without it); an entry for a page that stays is held to the
 * ordinary rules, so dropping it narrows; a value still linking to the page,
 * query or not, keeps the page in place.
 */
describe("field migration retire: a page a link field declares a query for (0.41.0)", () => {
  const entry = (pageId: string): Json => ({ pageId, parameters: [{ name: "type", values: ["strategy"] }] });

  function declareQueries(contract: Json, pageIds: readonly string[]): void {
    const field = fieldById(contract, SITE_NAV_LINK);
    field.constraints = { ...(field.constraints as Json), allowedQueries: pageIds.map(entry) };
  }

  /** Production declares `declared`; code keeps `kept` in the candidate. */
  function queryCase(declared: readonly string[], kept: readonly string[]): PageCase {
    const migration = pageCase([PORTAL], (production) => declareQueries(production.productionContract, declared));
    declareQueries(migration.candidateContract, kept);
    return migration;
  }

  const rows: readonly { readonly name: string; readonly build: () => PageCase; readonly expected: string }[] = [
    { name: "the retired page's entry goes with it", build: () => queryCase([PORTAL, INDUSTRIES], [INDUSTRIES]), expected: ACCEPTED },
    { name: "the only entry, the retired page's, goes with it", build: () => queryCase([PORTAL], []), expected: ACCEPTED },
    { name: "the candidate keeps the retired page's entry", build: () => queryCase([PORTAL], [PORTAL]), expected: "CONTRACT_REFERENCE_TOMBSTONED" },
    {
      name: "the candidate keeps the retired page's entry and drops one that stays",
      build: () => queryCase([PORTAL, INDUSTRIES], [PORTAL]),
      expected: "CONTRACT_REFERENCE_TOMBSTONED",
    },
    { name: "the candidate drops both entries", build: () => queryCase([PORTAL, INDUSTRIES], []), expected: "COMPATIBILITY_FIELD_POLICY_NARROWED" },
    { name: "an entry for a page that stays, kept", build: () => queryCase([INDUSTRIES], [INDUSTRIES]), expected: ACCEPTED },
    { name: "an entry for a page that stays, dropped", build: () => queryCase([INDUSTRIES], []), expected: "COMPATIBILITY_FIELD_POLICY_NARROWED" },
    {
      name: "a value still links to the retired page with a query",
      build: () =>
        pageCase([PORTAL], (production) => {
          declareQueries(production.productionContract, [PORTAL]);
          addIndustriesLink(production, { kind: "internal", pageId: PORTAL, fragment: null, query: { type: "strategy" } });
        }),
      expected: "MIGRATION_RETIRE_REFERENCED",
    },
  ];

  for (const row of rows) {
    it(`${row.expected}: ${row.name}`, () => {
      assert.equal(verdict(row.build()), row.expected);
    });
  }
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Ajv2020 } from "ajv/dist/2020.js";

import { generateManagedSiteFieldMigrationJsonSchemaV1 } from "../src/field-migration-json-schema.js";
import {
  ManagedSiteContractError,
  managedSiteFieldMigrationFromV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1Compatibility,
  validateManagedSiteContractV1MigrationCompatibility,
} from "../src/index.js";
import { contentSemanticsFixture } from "./content-semantics-fixture.js";
import { allFields, migrationCase, type Json } from "./field-migration-fixture.js";

/**
 * 0.40.0: a declared `rescope` moves one page-scoped field to site scope when
 * its usages grow to another page (All Points Media's home "Consumer journey"
 * and "Network builder" copy also renders on two solution pages). Invariant:
 * the field keeps its id, its policy and every production usage; its one value
 * moves, byte-identical, from its page's owner to the site's; and nothing
 * else changes. Real All Points Media pages (#73's production), trimmed.
 */

const HOME = "page_fwtww4abmmbqasq46zssffva24";
const NETWORKS = "page_66nqm34wx767mhjvz71vx0v2y4";
const FIELD = "field_8czg1x5gjxn1059qzy3vfzegy0";

interface Case {
  productionContract: Json;
  productionContent: Json;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
}

function fieldIn(contract: Json, id = FIELD): Json {
  const field = allFields(contract).find((candidate) => candidate.id === id);
  if (field === undefined) throw new Error(`No field ${id}`);
  return field;
}

function valuesOf(content: Json): Json[] {
  return content.values as Json[];
}

/** Production #73, and a candidate that moves FIELD to site scope and shows it on /networks too. */
function rescopeCase(): Case {
  const base = migrationCase();
  const productionContract = base.productionContract;
  const productionContent = base.productionContent;
  const candidateContract = structuredClone(productionContract);
  const candidateContent = structuredClone(productionContent);
  const field = fieldIn(candidateContract);
  field.scope = "site";
  field.usages = [...(field.usages as Json[]), { pageId: NETWORKS, itemId: null }];
  const value = valuesOf(candidateContent).find((one) => one.fieldId === FIELD) as Json;
  value.owner = { kind: "site" };
  return {
    productionContract,
    productionContent,
    candidateContract,
    candidateContent,
    declaration: { schemaVersion: "1.0", from: {}, steps: [{ op: "rescope", field: FIELD, scope: "site" }] },
  };
}

function sign(migration: Case): void {
  migration.declaration.from = managedSiteFieldMigrationFromV1(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
  );
}

function verify(migration: Case): ReturnType<typeof validateManagedSiteContractV1MigrationCompatibility> {
  sign(migration);
  return validateManagedSiteContractV1MigrationCompatibility(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    migration.declaration,
    { admitBridge: () => true },
  );
}

function code(migration: Case): string {
  try {
    verify(migration);
    return "migrated";
  } catch (error) {
    return error instanceof ManagedSiteContractError ? error.code : String(error);
  }
}

function candidateValue(migration: Case, id = FIELD): Json {
  return valuesOf(migration.candidateContent).find((one) => one.fieldId === id) as Json;
}

describe("moving a page field to site scope", () => {
  it("proves the value moved unchanged, and lists every page it now renders on", () => {
    const proof = verify(rescopeCase());
    assert.deepEqual(proof.steps, [{ op: "rescope", field: FIELD, from: { kind: "page", pageId: HOME }, to: { kind: "site" } }]);
    assert.deepEqual(proof.added, [{ kind: "rescope", field: FIELD, addedUsages: [{ pageId: NETWORKS, itemId: null }] }]);
    assert.equal(proof.accounting.consumed, 1);
    assert.equal(proof.accounting.targets, 1);
    assert.equal(proof.accounting.unchanged, proof.accounting.productionValues - 1);
  });

  it("admits a rescope that adds no page (scope only)", () => {
    const migration = rescopeCase();
    fieldIn(migration.candidateContract).usages = [{ pageId: HOME, itemId: null }];
    assert.equal(code(migration), "migrated");
  });

  const refusals: readonly [string, (migration: Case) => void, string][] = [
    ["the value's text changed", (m) => void (candidateValue(m).value = `${String(candidateValue(m).value)}!`), "MIGRATION_TARGET_MISMATCH"],
    ["the value kept its page owner", (m) => void (candidateValue(m).owner = { kind: "page", pageId: HOME }), "MIGRATION_TARGET_MISMATCH"],
    [
      "the value under both owners",
      (m) => void valuesOf(m.candidateContent).push({ ...candidateValue(m), owner: { kind: "page", pageId: HOME } }),
      "MIGRATION_TARGET_VALUE_MISSING",
    ],
    ["the value gone", (m) => void (m.candidateContent.values = valuesOf(m.candidateContent).filter((one) => one.fieldId !== FIELD)), "MIGRATION_TARGET_VALUE_MISSING"],
    ["a production usage dropped", (m) => void (fieldIn(m.candidateContract).usages = [{ pageId: NETWORKS, itemId: null }]), "MIGRATION_RESCOPE_USAGE_DROPPED"],
    [
      "its policy widened beside the move",
      (m) => {
        const constraints = fieldIn(m.candidateContract).constraints as Json;
        constraints.maxLength = (constraints.maxLength as number) + 1;
      },
      "MIGRATION_RESCOPE_POLICY_CHANGED",
    ],
    ["its name changed beside the move", (m) => void ((fieldIn(m.candidateContract).presentation as Json).name = "Renamed"), "MIGRATION_RESCOPE_POLICY_CHANGED"],
    ["the candidate still page-scoped", (m) => {
      fieldIn(m.candidateContract).scope = "page";
      fieldIn(m.candidateContract).usages = [{ pageId: HOME, itemId: null }];
      candidateValue(m).owner = { kind: "page", pageId: HOME };
    }, "MIGRATION_RESCOPE_NOT_SITE"],
    [
      "the field declared in another section",
      (m) => {
        const pages = m.candidateContract.pages as Json[];
        const from = (pages.find((page) => page.id === HOME)?.sections as Json[]).find((section) => (section.fields as Json[]).some((one) => one.id === FIELD)) as Json;
        const to = (pages.find((page) => page.id === NETWORKS)?.sections as Json[])[0] as Json;
        const field = fieldIn(m.candidateContract);
        from.fields = (from.fields as Json[]).filter((one) => one.id !== FIELD);
        to.fields = [...(to.fields as Json[]), field];
      },
      "MIGRATION_RESCOPE_MOVED",
    ],
    ["a field production does not declare", (m) => void ((m.declaration.steps as Json[])[0].field = "field_00000000000000000000000000"), "MIGRATION_SOURCE_UNKNOWN"],
    ["the same field rescoped twice", (m) => void (m.declaration.steps as Json[]).push({ op: "rescope", field: FIELD, scope: "site" }), "MIGRATION_SOURCE_CLAIMED_TWICE"],
    ["the field also retired", (m) => void (m.declaration.steps as Json[]).push({ op: "retire", fields: [FIELD] }), "MIGRATION_RETIRE_STILL_DECLARED"],
    ["a scope other than site", (m) => void ((m.declaration.steps as Json[])[0].scope = "page"), "MIGRATION_DECLARATION_INVALID"],
  ];
  for (const [name, edit, expected] of refusals) {
    it(`refuses ${name}${expected === "rejected" ? "" : ` (${expected})`}`, () => {
      const migration = rescopeCase();
      edit(migration);
      const verdict = code(migration);
      if (expected === "rejected") assert.notEqual(verdict, "migrated");
      else assert.equal(verdict, expected);
    });
  }

  it("refuses moving a field that is already site-scoped", () => {
    const migration = rescopeCase();
    const field = fieldIn(migration.productionContract);
    field.scope = "site";
    (valuesOf(migration.productionContent).find((one) => one.fieldId === FIELD) as Json).owner = { kind: "site" };
    assert.equal(code(migration), "MIGRATION_RESCOPE_NOT_PAGE");
  });

  it("refuses moving a page's list (a page order has no site meaning)", () => {
    const fixture = contentSemanticsFixture();
    const candidateContract = structuredClone(fixture.contract);
    const candidateContent = structuredClone(fixture.content);
    fieldIn(candidateContract, fixture.ids.collectionField).scope = "site";
    (valuesOf(candidateContent).find((one) => one.fieldId === fixture.ids.collectionField) as Json).owner = { kind: "site" };
    const migration: Case = {
      productionContract: fixture.contract,
      productionContent: fixture.content,
      candidateContract,
      candidateContent,
      declaration: { schemaVersion: "1.0", from: {}, steps: [{ op: "rescope", field: fixture.ids.collectionField, scope: "site" }] },
    };
    assert.equal(code(migration), "MIGRATION_TRANSFORM_DEFERRED");
  });

  it("an ordinary code change still refuses the same move", () => {
    const migration = rescopeCase();
    assert.throws(
      () =>
        validateManagedSiteContractV1Compatibility(
          parseManagedSiteContractV1(migration.productionContract),
          parseManagedSiteContentDocument(migration.productionContent),
          parseManagedSiteContractV1(migration.candidateContract),
          parseManagedSiteContentDocument(migration.candidateContent),
        ),
      (error: unknown) => error instanceof ManagedSiteContractError,
    );
  });

  it("the published migration schema admits a rescope step and refuses another scope", () => {
    const validate = new Ajv2020({ strict: false }).compile(generateManagedSiteFieldMigrationJsonSchemaV1() as object);
    const declaration = (scope: string) => ({
      schemaVersion: "1.0",
      from: { contractSha256: "a".repeat(64), contentSha256: "b".repeat(64) },
      steps: [{ op: "rescope", field: FIELD, scope }],
    });
    assert.equal(validate(declaration("site")), true, JSON.stringify(validate.errors));
    assert.equal(validate(declaration("page")), false);
  });
});

/**
 * The same move over the content-semantics fixture, which has every field type,
 * an alias group (its title and body) and a generated page: `field` moves to
 * site scope and gains `added` usages; `edit` may change the case further.
 */
function fixtureRescope(field: (ids: ReturnType<typeof contentSemanticsFixture>["ids"]) => string, added: readonly Json[], edit: (migration: Case, id: string) => void = () => undefined): string {
  const fixture = contentSemanticsFixture();
  const id = field(fixture.ids);
  const candidateContract = structuredClone(fixture.contract);
  const candidateContent = structuredClone(fixture.content);
  const declared = fieldIn(candidateContract, id);
  declared.scope = "site";
  declared.usages = [...(declared.usages as Json[]), ...added];
  (valuesOf(candidateContent).find((one) => one.fieldId === id) as Json).owner = { kind: "site" };
  const migration: Case = {
    productionContract: fixture.contract,
    productionContent: fixture.content,
    candidateContract,
    candidateContent,
    declaration: { schemaVersion: "1.0", from: {}, steps: [{ op: "rescope", field: id, scope: "site" }] },
  };
  edit(migration, id);
  return code(migration);
}

/** The fixture's alias group, dropped, so a field it holds can be judged on its own. */
function unaliased(migration: Case): void {
  migration.productionContract.atomicAliasGroups = [];
  migration.candidateContract.atomicAliasGroups = [];
  migration.productionContent = structuredClone(migration.productionContent);
}

describe("what a rescope may move, over every field type", () => {
  it("moves an image onto the generated page, picture and all", () =>
    assert.equal(fixtureRescope((ids) => ids.imageField, []), "migrated"));
  it("moves a link", () => assert.equal(fixtureRescope((ids) => ids.linkField, []), "migrated"));
  it("refuses an aliased field (its alias group shares one value)", () =>
    assert.equal(fixtureRescope((ids) => ids.bodyField, []), "MIGRATION_TRANSFORM_DEFERRED"));
  it("refuses a usage dropped by item, not page", () =>
    assert.equal(
      fixtureRescope((ids) => ids.linkField, [], (migration, id) => {
        const field = fieldIn(migration.candidateContract, id);
        field.usages = (field.usages as Json[]).map((usage) => ({ ...usage, itemId: "item_00000000000000000000000000" }));
      }),
      "MIGRATION_RESCOPE_USAGE_DROPPED",
    ));
  it("moves a link onto the generated page as well", () => {
    const fixture = contentSemanticsFixture();
    assert.equal(fixtureRescope((ids) => ids.linkField, [{ pageId: (fixture.contract.pages as Json[])[1].id, itemId: null }]), "migrated");
  });
  it("still holds a page that gains the field to its H1 rule", () => {
    const verdict = fixtureRescope((ids) => ids.titleField, [], (migration) => unaliased(migration));
    assert.equal(verdict, "migrated", "control: the home H1 heading moves while it renders where it did");
    const generated = (contentSemanticsFixture().contract.pages as Json[])[1].id as string;
    assert.equal(
      fixtureRescope((ids) => ids.titleField, [{ pageId: generated, itemId: null }], (migration) => unaliased(migration)),
      "COMPATIBILITY_PAGE_SEO_CHANGED",
    );
  });
});

describe("a rescope claims its field against every other step", () => {
  it("refuses rescoping a merge source of #73's own declaration", () => {
    const base = migrationCase();
    const merge = (base.declaration.steps as Json[]).find((step) => step.op === "merge") as Json;
    const source = ((merge.parts as Json[]).find((part) => "source" in part) as Json).source as string;
    const migration: Case = { ...base, declaration: { ...base.declaration, steps: [...(base.declaration.steps as Json[]), { op: "rescope", field: source, scope: "site" }] } };
    assert.notEqual(code(migration), "migrated");
  });

  it("refuses rescoping a merge target of #73's own declaration", () => {
    const base = migrationCase();
    const merge = (base.declaration.steps as Json[]).find((step) => step.op === "merge") as Json;
    const migration: Case = { ...base, declaration: { ...base.declaration, steps: [...(base.declaration.steps as Json[]), { op: "rescope", field: merge.target, scope: "site" }] } };
    assert.notEqual(code(migration), "migrated");
  });
});

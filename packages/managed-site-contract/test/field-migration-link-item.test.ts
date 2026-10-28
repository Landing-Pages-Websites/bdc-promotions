import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ManagedSiteContractError,
  managedSiteFieldMigrationFromV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1MigrationCompatibility,
  type ManagedSiteFieldMigrationProofV1,
} from "../src/index.js";
import {
  addSecondFixtureCollectionUsingItem,
  addSecondFixtureItem,
  contentSemanticsFixture,
  type ContentSemanticsFixture,
} from "./content-semantics-fixture.js";
import { fixtureId } from "./contract-semantics-fixture.js";

/**
 * 0.31.0: a declared link may name one item of a generated page (contract
 * 0.25.0's item destination), so a code-owned label whose href is a detail
 * page (`/work/<slug>`, `/networks/<slug>`) can become a customer-editable
 * item link. Invariant: a declared internal destination names one path that
 * production serves and the candidate keeps: a static page both sides
 * declare, or an item that is active in production and of exactly the
 * collection the generated page it names iterates, on both sides.
 */

type Json = Record<string, unknown>;

const TARGET = "field_" + "2".repeat(25) + "0";
/** A customer-editable label on home whose href code owns: what a link step turns into a link. */
const LABEL = "field_" + "3".repeat(25) + "0";
const ACCEPTED = "ACCEPTED";

const INTERNAL_ONLY: Json = {
  allowedExternalHosts: [],
  allowedFragments: [],
  allowedSchemes: [],
  allowedTargets: ["same_window"],
  authority: "internal_only",
  fragmentPolicy: "forbid",
  labelConstraints: { maxLength: 160, minLength: 1, newlines: "forbid" },
};

interface LinkCase {
  production: ContentSemanticsFixture;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

function pageOf(contract: Json, pageId: string): Json {
  return (contract.pages as Json[]).find((page) => page.id === pageId)!;
}

/** Declares the label beside the home body text, with its own source and value. */
function addLabel(fixture: ContentSemanticsFixture): void {
  const home = pageOf(fixture.contract, fixture.ids.homePage);
  const section = (home.sections as Json[])[0]!;
  const body = (section.fields as Json[]).find((field) => field.id === fixture.ids.bodyField)!;
  const resolver = body.resolver as Json;
  (section.fields as Json[]).push({
    ...structuredClone(body),
    id: LABEL,
    semantic: "label",
    resolver: { ...resolver, pointer: "/home/featuredLabel" },
  });
  values(fixture.content).push({ fieldId: LABEL, owner: { kind: "page", pageId: fixture.ids.homePage }, type: "plain_text", value: "Service One" });
}

/**
 * The candidate code writes to turn the home label into a link to
 * `destination`: the body undeclared, tombstoned and valueless, a link field
 * in its place whose label is the body's text.
 */
function linkCase(destination: (production: ContentSemanticsFixture) => Json, prepare?: (fixture: ContentSemanticsFixture) => void): LinkCase {
  const production = contentSemanticsFixture();
  addLabel(production);
  prepare?.(production);
  const source = LABEL;
  const candidateContract = structuredClone(production.contract);
  const candidateContent = structuredClone(production.content);
  const section = (pageOf(candidateContract, production.ids.homePage).sections as Json[]).find((entry) =>
    (entry.fields as Json[]).some((field) => field.id === source),
  )!;
  const list = section.fields as Json[];
  const index = list.findIndex((field) => field.id === source);
  const body = list[index]!;
  const resolver = body.resolver as Json;
  list.splice(index, 1, {
    id: TARGET,
    type: "link",
    classification: "customer_editable",
    capabilities: ["link.label.edit", "link.destination.edit", "link.target.edit"],
    presentation: body.presentation,
    constraints: INTERNAL_ONLY,
    scope: body.scope,
    usages: body.usages,
    resolver: { ...resolver, pointer: `${resolver.pointer as string}/link` },
  });
  candidateContract.tombstonedIds = [...(candidateContract.tombstonedIds as string[]), source].sort();
  const sourceValue = values(candidateContent).find((value) => value.fieldId === source)!;
  const target = destination(production);
  candidateContent.values = [
    ...values(candidateContent).filter((value) => value.fieldId !== source),
    { fieldId: TARGET, owner: sourceValue.owner, type: "link", value: { label: sourceValue.value, destination: structuredClone(target), target: "same_window" } },
  ];
  return {
    production,
    candidateContract,
    candidateContent,
    declaration: {
      schemaVersion: "1.0",
      from: managedSiteFieldMigrationFromV1(
        parseManagedSiteContractV1(production.contract),
        parseManagedSiteContentDocument(production.content),
      ),
      steps: [{ op: "link", source, target: TARGET, links: [{ destination: target, target: "same_window" }] }],
    },
  };
}

function verify(migration: LinkCase): ManagedSiteFieldMigrationProofV1 {
  return validateManagedSiteContractV1MigrationCompatibility(
    parseManagedSiteContractV1(migration.production.contract),
    parseManagedSiteContentDocument(migration.production.content),
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    migration.declaration,
    { admitBridge: () => true },
  );
}

function verdict(migration: LinkCase): string {
  try {
    verify(migration);
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

function item(pageId: string, itemId: string): Json {
  return { kind: "internal", pageId, itemId, fragment: null };
}

describe("a declared link to one item of a generated page (0.31.0)", () => {
  it("writes a link to an active item the generated page serves, and lists it", () => {
    const migration = linkCase((f) => item(f.ids.generatedPage, f.ids.item));
    const proof = verify(migration);
    const written = proof.added.find((entry) => entry.kind === "link_field");
    assert.deepEqual(written?.kind === "link_field" ? written.destination : null, item(migration.production.ids.generatedPage, migration.production.ids.item));
  });

  it("writes a link to a second item of the same page", () => {
    let second = "";
    const migration = linkCase(
      (f) => item(f.ids.generatedPage, second),
      (f) => {
        second = addSecondFixtureItem(f);
      },
    );
    assert.equal(verdict(migration), ACCEPTED);
  });

  const refusals: readonly { name: string; code: string; build: () => LinkCase }[] = [
    {
      name: "the generated page with no item (it has no single path)",
      code: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
      build: () => linkCase((f) => ({ kind: "internal", pageId: f.ids.generatedPage, fragment: null })),
    },
    {
      name: "a static page with an item",
      code: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
      build: () => linkCase((f) => item(f.ids.homePage, f.ids.item)),
    },
    {
      name: "an item no collection holds",
      code: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
      build: () => {
        let stray = "";
        return linkCase(
          (f) => item(f.ids.generatedPage, stray),
          () => {
            stray = fixtureId("item");
          },
        );
      },
    },
    {
      name: "an active item of another collection, which the page does not route",
      code: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
      build: () => {
        let other = "";
        return linkCase(
          (f) => item(f.ids.generatedPage, other),
          (f) => {
            other = fixtureId("item");
            addSecondFixtureCollectionUsingItem(f, other);
          },
        );
      },
    },
    {
      name: "a page production never declared",
      code: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
      build: () => {
        let unknown = "";
        return linkCase(
          (f) => item(unknown, f.ids.item),
          () => {
            unknown = fixtureId("page");
          },
        );
      },
    },
    {
      name: "an item the candidate stops serving (its values dropped)",
      code: "MIGRATION_UNDECLARED_CHANGE",
      build: () => {
        let second = "";
        const migration = linkCase(
          (f) => item(f.ids.generatedPage, second),
          (f) => {
            second = addSecondFixtureItem(f);
          },
        );
        migration.candidateContent.values = values(migration.candidateContent).filter(
          (value) => (value.owner as Json).itemId !== second,
        );
        const order = values(migration.candidateContent).find((value) => value.fieldId === migration.production.ids.collectionField)!;
        order.value = { orderedItemIds: [migration.production.ids.item] };
        return migration;
      },
    },
    {
      name: "an item the candidate tombstones while still listing it",
      code: "CONTENT_ITEM_TOMBSTONED",
      build: () => {
        const migration = linkCase((f) => item(f.ids.generatedPage, f.ids.item));
        (migration.candidateContract.tombstonedIds as string[]).push(migration.production.ids.item);
        return migration;
      },
    },
    {
      name: "an item link with a fragment the target forbids",
      code: "MIGRATION_TARGET_CONSTRAINTS",
      build: () => linkCase((f) => ({ ...item(f.ids.generatedPage, f.ids.item), fragment: "pricing" })),
    },
    {
      name: "a candidate value naming another item than the declaration",
      code: "MIGRATION_TARGET_MISMATCH",
      build: () => {
        let second = "";
        const migration = linkCase(
          (f) => item(f.ids.generatedPage, f.ids.item),
          (f) => {
            second = addSecondFixtureItem(f);
          },
        );
        const written = values(migration.candidateContent).find((value) => value.fieldId === TARGET)!;
        ((written.value as Json).destination as Json).itemId = second;
        return migration;
      },
    },
  ];

  for (const refusal of refusals) {
    it(`refuses ${refusal.name}`, () => {
      assert.equal(verdict(refusal.build()), refusal.code);
    });
  }
});

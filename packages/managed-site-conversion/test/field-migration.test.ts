import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1MigrationCompatibility,
} from "@landing-pages-websites/managed-site-contract";

import { fieldMigrationOutcome } from "../src/cli-migration.js";
import {
  buildFieldMigrationDeclaration,
  replacedFieldEvidence,
  type ReplacedFieldEvidence,
  type ReplacedFieldGroup,
  unresolvedRetirements,
} from "../src/field-migration.js";
import type { LedgerRecord } from "../src/id-ledger.js";
import type { Proposal } from "../src/propose.js";

const H2 = "component:AboutPage/region:story/region:story-heading/role:h2";

describe("replaced-field evidence", () => {
  const evidence = replacedFieldEvidence(
    [
      { kind: "field", id: "field_a", anchor: `${H2}/text` },
      { kind: "field", id: "field_b", anchor: `${H2}/role:span/text` },
      { kind: "field", id: "field_c", anchor: `${H2}x/text` },
      { kind: "field", id: "field_d", anchor: "component:Old/region:gone/text" },
      { kind: "field", id: "field_e", anchor: "component:Kept/role:p/text" },
      { kind: "field", id: "field_f", anchor: "component:Nested/role:p/text" },
      { kind: "section", id: "section_a", anchor: `${H2}/section` },
    ],
    [
      { fieldId: "field_new", anchor: H2, minted: true },
      { fieldId: "field_outer", anchor: "component:Nested", minted: true },
      { fieldId: "field_inner", anchor: "component:Nested/role:p", minted: true },
      { fieldId: "field_kept", anchor: "component:Kept/role:p", minted: false },
    ],
  );

  it("groups retired fields under the nearest new field whose anchor contains them", () => {
    assert.deepEqual(
      evidence.groups.map((group) => [group.target, group.sources.map((source) => source.id)]),
      [["field_new", ["field_a", "field_b"]], ["field_inner", ["field_f"]]],
    );
  });

  it("leaves near-miss prefixes, orphans and fields under a reused id unclaimed", () => {
    assert.deepEqual(evidence.unclaimed.map((record) => record.id), ["field_c", "field_d", "field_e"]);
  });
});

const fixtureDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../managed-site-contract/test/fixtures/field-migration-73",
);

function fixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(fixtureDirectory, `${name}.json`), "utf8")) as Record<string, unknown>;
}

interface PlanStep {
  readonly target: string;
  readonly parts: readonly { readonly source?: string }[];
}

const recorded = fixture("migration");
const planSteps = recorded.steps as readonly PlanStep[];
const production = { contract: fixture("production.contract"), content: fixture("production.content") };

function evidenceOf(steps: readonly PlanStep[]): ReplacedFieldEvidence {
  const groups = steps.map((step) => ({
    target: step.target,
    sources: step.parts.flatMap((part) => (part.source === undefined ? [] : [part.source])),
  }));
  return {
    retired: groups.flatMap((group) =>
      group.sources.map((id) => ({ kind: "field" as const, id, anchor: `anchor:${group.target}/${id}` }))),
    groups: steps.map((step) => ({
      target: step.target,
      targetAnchor: `anchor:${step.target}`,
      sources: step.parts.flatMap((part) =>
        part.source === undefined ? [] : [{ id: part.source, anchor: `anchor:${step.target}/${part.source}` }],
      ),
    })),
    unclaimed: [],
  };
}

describe("unresolved retirements", () => {
  const plan = { bridge: recorded.bridge as { from: string; to: string }, steps: planSteps };
  const unclaimed = { kind: "field" as const, id: "field_dropped", anchor: "component:Gone/role:p/text" };

  function withUnclaimed(evidence: ReplacedFieldEvidence): ReplacedFieldEvidence {
    return { ...evidence, retired: [...evidence.retired, unclaimed], unclaimed: [unclaimed] };
  }

  it("names a retired field that nothing replaces, with no plan", () => {
    const evidence = withUnclaimed({ retired: [], groups: [], unclaimed: [] });
    assert.deepEqual(unresolvedRetirements(evidence, new Set()).map((record) => record.id), ["field_dropped"]);
  });

  it("names it beside groups a plan resolves", () => {
    const evidence = withUnclaimed(evidenceOf(planSteps));
    const { consumed } = buildFieldMigrationDeclaration(plan, evidence, production);
    assert.deepEqual(unresolvedRetirements(evidence, consumed).map((record) => record.id), ["field_dropped"]);
  });

  it("names every source of a group the plan leaves out", () => {
    const evidence = evidenceOf(planSteps);
    const { consumed } = buildFieldMigrationDeclaration({ ...plan, steps: planSteps.slice(1) }, evidence, production);
    const expected = (planSteps[0]?.parts ?? []).flatMap((part) => (part.source === undefined ? [] : [part.source]));
    assert.deepEqual(unresolvedRetirements(evidence, consumed).map((record) => record.id), expected);
  });

  it("resolves nothing it was not asked to: a fully planned run has none", () => {
    const evidence = evidenceOf(planSteps);
    const { consumed } = buildFieldMigrationDeclaration(plan, evidence, production);
    assert.deepEqual(unresolvedRetirements(evidence, consumed), []);
  });

  it("resolves a retired field a retire step names (contract 0.21.0)", () => {
    const dropped = { kind: "field" as const, id: `field_${"1".repeat(25)}0`, anchor: "component:Gone/role:p/text" };
    const evidence = { ...evidenceOf(planSteps), retired: [...evidenceOf(planSteps).retired, dropped], unclaimed: [dropped] };
    const { consumed, unplanned } = buildFieldMigrationDeclaration(
      { ...plan, steps: [...planSteps, { op: "retire", fields: [dropped.id] }] },
      evidence,
      production,
    );
    assert.deepEqual(unplanned, []);
    assert.deepEqual(unresolvedRetirements(evidence, consumed), []);
  });

  it("refuses a retire step naming a field this conversion did not retire", () => {
    const evidence = evidenceOf(planSteps);
    const notRetired = `field_${"1".repeat(25)}0`;
    assert.throws(
      () => buildFieldMigrationDeclaration({ ...plan, steps: [...planSteps, { op: "retire", fields: [notRetired] }] }, evidence, production),
      /retires field_1{25}0, which this conversion did not retire/u,
    );
  });

  /**
   * All Points Media's /about (contract 0.29.0): the converter retires the
   * openings list, its placement, its item fields and items when their source
   * disappears. Invariant: a retire naming the collection consumes exactly
   * what the contract package's verifier claims for it, and nothing else.
   */
  describe("a retired collection (contract 0.29.0)", () => {
    const apmDirectory = resolve(fixtureDirectory, "../field-migration-retire-collection");
    const apm = {
      contract: JSON.parse(readFileSync(resolve(apmDirectory, "production.contract.json"), "utf8")) as Record<string, unknown>,
      content: JSON.parse(readFileSync(resolve(apmDirectory, "production.content.json"), "utf8")) as Record<string, unknown>,
    };
    const OPENINGS = "collection_72wqexc7jwncwxsw6d9t73fq48";
    const STATS = "collection_cza922f4mm5xthyv1g0rbqrmwm";

    function collectionOf(id: string): { readonly itemFields: readonly { readonly id: string }[] } {
      const found = (apm.contract.collections as { id: string; itemFields: { id: string }[] }[]).find((entry) => entry.id === id);
      if (found === undefined) throw new Error(`No collection ${id}`);
      return found;
    }

    function placementsOf(id: string): string[] {
      return (apm.contract.pages as { sections: { fields: { id: string; type: string; collectionId?: string }[] }[] }[])
        .flatMap((page) => page.sections.flatMap((section) => section.fields))
        .filter((field) => field.type === "collection" && field.collectionId === id)
        .map((field) => field.id);
    }

    function itemsOf(id: string): string[] {
      const values = apm.content.values as { owner: { kind: string; collectionId?: string; itemId?: string } }[];
      return [...new Set(values.flatMap((value) =>
        value.owner.kind === "collection_item" && value.owner.collectionId === id && value.owner.itemId !== undefined ? [value.owner.itemId] : []))];
    }

    /** What the converter's ledger retires when a list's source vanishes: the list and everything under it. */
    function ledgerRecordsFor(id: string): LedgerRecord[] {
      return [
        { kind: "collection", id, anchor: `component:Gone/${id}` },
        ...placementsOf(id).map((fieldId) => ({ kind: "field" as const, id: fieldId, anchor: `component:Gone/${fieldId}` })),
        ...collectionOf(id).itemFields.map((field) => ({ kind: "field" as const, id: field.id, anchor: `component:Gone/item/${field.id}` })),
        ...itemsOf(id).map((itemId) => ({ kind: "item" as const, id: itemId, anchor: `component:Gone/item/${itemId}` })),
      ];
    }

    function unresolvedFor(retired: readonly LedgerRecord[], collections: readonly string[]): string[] {
      const evidence = { retired, groups: [], unclaimed: retired.filter((record) => record.kind === "field") };
      const { consumed } = buildFieldMigrationDeclaration({ steps: [{ op: "retire", collections }] }, evidence, apm);
      return unresolvedRetirements(evidence, consumed).map((record) => record.id);
    }

    it("resolves the list, its placement, item fields and items when a step names the list", () => {
      const retired = ledgerRecordsFor(OPENINGS);
      assert.ok(retired.some((record) => record.kind === "item"));
      assert.deepEqual(unresolvedFor(retired, [OPENINGS]), []);
    });

    const leftovers: readonly [string, () => LedgerRecord[]][] = [
      ["a field retired beside it that no step names", () => [{ kind: "field", id: `field_${"1".repeat(25)}0`, anchor: "component:Other/role:p/text" }]],
      ["another list's placement, item field and items", () => ledgerRecordsFor(STATS).filter((record) => record.kind !== "collection")],
      ["an item no production list holds", () => [{ kind: "item", id: `item_${"1".repeat(25)}0`, anchor: "component:Gone/item/stray" }]],
      ["a page", () => [{ kind: "page", id: `page_${"1".repeat(25)}0`, anchor: "component:GonePage" }]],
    ];
    for (const [name, extra] of leftovers) {
      it(`still names ${name} unresolved`, () => {
        const stray = extra();
        assert.deepEqual(unresolvedFor([...ledgerRecordsFor(OPENINGS), ...stray], [OPENINGS]), stray.map((record) => record.id));
      });
    }

    it("leaves everything under the list unresolved when no step names it", () => {
      const evidence = { retired: ledgerRecordsFor(OPENINGS), groups: [], unclaimed: [] };
      assert.equal(unresolvedRetirements(evidence, new Set()).length, evidence.retired.length);
    });
  });

  /**
   * All Points Media's /innovation/network-portal (contract 0.30.0): the
   * converter retires the page and its search slots when its source
   * disappears. Invariant: a retire naming the page consumes exactly what the
   * contract package's verifier claims for it, and nothing else.
   */
  describe("a retired page (contract 0.30.0)", () => {
    const apmDirectory = resolve(fixtureDirectory, "../field-migration-retire-page");
    const apm = {
      contract: JSON.parse(readFileSync(resolve(apmDirectory, "production.contract.json"), "utf8")) as Record<string, unknown>,
      content: JSON.parse(readFileSync(resolve(apmDirectory, "production.content.json"), "utf8")) as Record<string, unknown>,
    };
    const PORTAL = "page_p0633t3v71w42r82xxcqv8nvxw";
    const INDUSTRIES = "page_9xbw114xjkzzb8dy8gyr7zwxhc";
    type Field = { id: string; usages: { pageId: string }[] };
    type Page = { id: string; sections: { id: string; fields: Field[] }[] };

    function ledgerRecordsFor(pageId: string): LedgerRecord[] {
      const page = (apm.contract.pages as Page[]).find((entry) => entry.id === pageId);
      if (page === undefined) throw new Error(`No page ${pageId}`);
      const slots = ((apm.contract.internalSeo as { protectedFields: Field[] }).protectedFields)
        .filter((field) => field.usages.every((usage) => usage.pageId === pageId));
      return [
        { kind: "page", id: pageId, anchor: `page:${pageId}` },
        ...page.sections.map((section) => ({ kind: "section" as const, id: section.id, anchor: `page:${pageId}/${section.id}` })),
        ...[...page.sections.flatMap((section) => section.fields), ...slots]
          .map((field) => ({ kind: "field" as const, id: field.id, anchor: `page:${pageId}/${field.id}` })),
      ];
    }

    function unresolvedFor(retired: readonly LedgerRecord[], pages: readonly string[]): string[] {
      const evidence = { retired, groups: [], unclaimed: retired.filter((record) => record.kind === "field") };
      const { consumed } = buildFieldMigrationDeclaration({ steps: [{ op: "retire", pages }] }, evidence, apm);
      return unresolvedRetirements(evidence, consumed).map((record) => record.id);
    }

    for (const pageId of [PORTAL, INDUSTRIES]) {
      it(`resolves ${pageId}, its sections, fields and search slots when a step names it`, () => {
        assert.deepEqual(unresolvedFor(ledgerRecordsFor(pageId), [pageId]), []);
      });
    }

    it("still names a field retired beside it, and another page's records, unresolved", () => {
      const stray = [
        { kind: "field" as const, id: `field_${"1".repeat(25)}0`, anchor: "component:Other/role:p/text" },
        ...ledgerRecordsFor(INDUSTRIES).filter((record) => record.kind !== "page"),
      ];
      assert.deepEqual(unresolvedFor([...ledgerRecordsFor(PORTAL), ...stray], [PORTAL]), stray.map((record) => record.id));
    });

    it("refuses a retire step naming a page this conversion did not retire", () => {
      const evidence = { retired: ledgerRecordsFor(PORTAL), groups: [], unclaimed: [] };
      assert.throws(
        () => buildFieldMigrationDeclaration({ steps: [{ op: "retire", pages: [INDUSTRIES] }] }, evidence, apm),
        new RegExp(`retires ${INDUSTRIES}, which this conversion did not retire`, "u"),
      );
    });
  });

  it("refuses a retire step naming a collection this conversion did not retire", () => {
    const notRetired = `collection_${"1".repeat(25)}0`;
    assert.throws(
      () => buildFieldMigrationDeclaration({ ...plan, steps: [...planSteps, { op: "retire", collections: [notRetired] }] }, evidenceOf(planSteps), production),
      /retires collection_1{25}0, which this conversion did not retire/u,
    );
  });

  /** A label retired beneath a minted link field, as an anchor makes it (contract 0.22.0). */
  const label = { kind: "field" as const, id: `field_${"2".repeat(25)}0`, anchor: "component:Nav/role:a/text" };
  const linkTarget = `field_${"3".repeat(25)}0`;
  const linkGroup = { target: linkTarget, targetAnchor: "component:Nav/role:a", sources: [{ id: label.id, anchor: label.anchor }] };
  const linkStep = {
    op: "link",
    source: label.id,
    target: linkTarget,
    links: [{ destination: { kind: "internal", pageId: `page_${"4".repeat(25)}0`, fragment: null }, target: "same_window" }],
  };

  it("resolves a label a link step turns into a link field (contract 0.22.0)", () => {
    const base = evidenceOf(planSteps);
    const evidence = { ...base, retired: [...base.retired, label], groups: [...base.groups, linkGroup] };
    const { consumed, unplanned } = buildFieldMigrationDeclaration({ ...plan, steps: [...planSteps, linkStep] }, evidence, production);
    assert.deepEqual(unplanned, []);
    assert.deepEqual(unresolvedRetirements(evidence, consumed), []);
  });

  it("refuses a link step whose source is not the one its target's anchor replaced", () => {
    const base = evidenceOf(planSteps);
    const evidence = { ...base, retired: [...base.retired, label], groups: [...base.groups, linkGroup] };
    const other = `field_${"5".repeat(25)}0`;
    assert.throws(
      () => buildFieldMigrationDeclaration({ ...plan, steps: [...planSteps, { ...linkStep, source: other }] }, evidence, production),
      /does not consume exactly the fields its anchor replaced/u,
    );
  });

  it("counts an unclaimed field as unresolved when no plan is given, alongside groups", () => {
    assert.equal(unresolvedRetirements(withUnclaimed(evidenceOf(planSteps)), new Set()).length, 70);
  });
});

describe("field migration declaration", () => {
  it("binds a person's plan to production and verifies against #73", () => {
    const { declaration, unplanned } = buildFieldMigrationDeclaration(
      { bridge: recorded.bridge as { from: string; to: string }, steps: planSteps },
      evidenceOf(planSteps),
      production,
    );
    assert.deepEqual(unplanned, []);
    assert.deepEqual(declaration.from, recorded.from);
    const proof = validateManagedSiteContractV1MigrationCompatibility(
      parseManagedSiteContractV1(production.contract),
      parseManagedSiteContentDocument(production.content),
      parseManagedSiteContractV1(fixture("candidate.contract")),
      parseManagedSiteContentDocument(fixture("candidate.content")),
      declaration,
      { admitBridge: () => true },
    );
    assert.equal(proof.steps.length, 34);
  });

  it("returns the groups the plan leaves out", () => {
    const { unplanned } = buildFieldMigrationDeclaration(
      { bridge: recorded.bridge as { from: string; to: string }, steps: planSteps.slice(1) },
      evidenceOf(planSteps),
      production,
    );
    assert.deepEqual(unplanned.map((group) => group.target), [planSteps[0]?.target]);
  });

  function withFirst(
    steps: readonly PlanStep[],
    change: (group: ReplacedFieldGroup) => ReplacedFieldGroup,
  ): ReplacedFieldEvidence {
    const evidence = evidenceOf(steps);
    const [first, ...rest] = evidence.groups;
    if (first === undefined) throw new Error("The fixture has steps");
    return { ...evidence, groups: [change(first), ...rest] };
  }

  const refused: readonly [string, (steps: PlanStep[]) => ReplacedFieldEvidence][] = [
    ["a step whose target replaced nothing", (steps) => evidenceOf(steps.slice(1))],
    ["a step consuming a field its anchor did not replace", (steps) =>
      withFirst(steps, (group) => ({ ...group, sources: group.sources.slice(1) }))],
    ["a step missing a field its anchor replaced", (steps) =>
      withFirst(steps, (group) => ({ ...group, sources: [...group.sources, { id: "field_extra", anchor: "x" }] }))],
  ];
  for (const [name, evidenceFor] of refused) {
    it(`refuses ${name}`, () => {
      assert.throws(() =>
        buildFieldMigrationDeclaration(
          { bridge: recorded.bridge as { from: string; to: string }, steps: planSteps },
          evidenceFor([...planSteps]),
          production,
        ),
      );
    });
  }
});

describe("the conversion's migration outcome", () => {
  function proposalRetiring(records: readonly { kind: "field"; id: string; anchor: string }[]): Proposal {
    return {
      fields: [],
      ledger: { retiredRecords: () => records, mintedThisRun: () => false },
    } as unknown as Proposal;
  }
  const noPlan = { planPath: null, productionContractPath: null, productionContentPath: null };

  it("fails the run and names a retired field nothing replaces", () => {
    const outcome = fieldMigrationOutcome(
      proposalRetiring([{ kind: "field", id: "field_dropped", anchor: "component:Gone/role:p/text" }]),
      noPlan,
    );
    assert.equal(outcome.unresolved, 1);
    assert.ok(outcome.lines.some((line) => line.includes("UNRESOLVED field field_dropped")));
    assert.equal(outcome.sidecar, null);
  });

  it("fails the run for a retired id of any kind, which no step can consume", () => {
    for (const kind of ["page", "section", "item", "asset", "collection"] as const) {
      const outcome = fieldMigrationOutcome(
        proposalRetiring([{ kind, id: `${kind}_gone`, anchor: `component:Gone/${kind}` } as never]),
        noPlan,
      );
      assert.equal(outcome.unresolved, 1, kind);
      assert.ok(outcome.lines.some((line) => line.includes(`UNRESOLVED ${kind} ${kind}_gone`)), kind);
    }
  });

  it("passes a run that retired nothing", () => {
    assert.equal(fieldMigrationOutcome(proposalRetiring([]), noPlan).unresolved, 0);
  });
});

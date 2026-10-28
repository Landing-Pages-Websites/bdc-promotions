import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ManagedSiteContractError,
  managedSiteFieldMigrationFromV1,
  managedSiteFieldMigrationRetireCarriedIdsV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  validateManagedSiteContractV1MigrationCompatibility,
  type ManagedSiteFieldMigrationProofV1,
  type ManagedSiteFieldMigrationRetireStepProofV1,
} from "../src/index.js";
import { isInsideRetiredContainer } from "../src/field-migration-retire-collections.js";
import { fixtureId } from "./contract-semantics-fixture.js";
import { protectedItemFixture } from "./protected-item-field-fixture.js";

/**
 * 0.29.0: a retire step may name whole collections. Invariant: a retire
 * removes exactly the declarations it names and every value under them (a
 * collection's item fields, its items' values and the page fields placing
 * it), and nothing anything that stays still names.
 *
 * All Points Media production revision 15 (commit 55fe28d, contract
 * 991cb088, content f910b896), trimmed to `/about`: the careers openings list
 * (six placeholder roles, three item fields each) is the first collection
 * retired. Whether a customer holds any of it is Site Guard's to judge.
 */
const FIXTURE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/field-migration-retire-collection",
);

type Json = Record<string, unknown>;

interface RetireCase {
  productionContract: Json;
  productionContent: Json;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
}

const ABOUT_PAGE = "page_teyen9zyv63gwppbsgsqkkb5mc";
const ABOUT_SECTION = "section_pcnb5y0vj2spw7sm0269wvb6tr";
const OPENINGS = "collection_72wqexc7jwncwxsw6d9t73fq48";
const OPENINGS_FIELD = "field_vjp0k6cyaxs7ntgt2pn1w3d0pg";
const OPENINGS_ITEM_FIELDS = [
  "field_xjnyvbh45c624rnjxxpbvsmqwr",
  "field_435hepp8ssv89qjfnbyy5thbkc",
  "field_mcjtt0bb21qy13w5mx6tm1rn2m",
];
const OPENING_ITEM = "item_p3cy4ypc8e1e2py8v0qdvs7bcr";
const STATS = "collection_cza922f4mm5xthyv1g0rbqrmwm";
const VALUES = "collection_7bzv1b6xsrts6cvvawv1empkxm";
const CTA_TITLE = "field_90brc0scf6ax5vx411ptm04ax8";
const CTA_BODY = "field_18ydhdzzhz15vezrbg1t60ym80";
const UNKNOWN_COLLECTION = "collection_" + "1".repeat(25) + "0";
const ACCEPTED = "ACCEPTED";

function read(name: string): Json {
  return JSON.parse(readFileSync(resolve(FIXTURE_DIRECTORY, `${name}.json`), "utf8")) as Json;
}

const PRODUCTION = Object.freeze({ contract: read("production.contract"), content: read("production.content") });

function sections(contract: Json): Json[] {
  return (contract.pages as Json[]).flatMap((page) => page.sections as Json[]);
}

function collections(contract: Json): Json[] {
  return contract.collections as Json[];
}

function collectionOf(contract: Json, id: string): Json {
  const found = collections(contract).find((collection) => collection.id === id);
  if (found === undefined) throw new Error(`No collection ${id}`);
  return found;
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

function tombstones(contract: Json): string[] {
  return contract.tombstonedIds as string[];
}

/** The page fields placing a collection, and its item fields, read from the contract. */
function underCollection(contract: Json, id: string): string[] {
  const placements = sections(contract).flatMap((section) =>
    (section.fields as Json[]).filter((field) => field.type === "collection" && field.collectionId === id),
  );
  const itemFields = collectionOf(contract, id).itemFields as Json[];
  return [...placements, ...itemFields].map((field) => field.id as string);
}

/**
 * The candidate code writes for a retire: each collection, its placements and
 * item fields, each named field and section undeclared, every id tombstoned,
 * and every value on a removed field dropped.
 */
function applyRetire(
  migration: RetireCase,
  retired: { readonly collections?: readonly string[]; readonly fields?: readonly string[]; readonly sections?: readonly string[] },
): void {
  const contract = migration.candidateContract;
  const collectionIds = retired.collections ?? [];
  const fieldIds = [...collectionIds.flatMap((id) => underCollection(contract, id)), ...(retired.fields ?? [])];
  const sectionIds = retired.sections ?? [];
  const removed = new Set<string>(fieldIds);
  for (const page of contract.pages as Json[]) {
    for (const section of page.sections as Json[]) {
      section.fields = (section.fields as Json[]).filter((field) => !removed.has(field.id as string));
    }
    page.sections = (page.sections as Json[]).filter((section) => !sectionIds.includes(section.id as string));
  }
  const items = values(migration.candidateContent)
    .map((value) => value.owner as Json)
    .filter((owner) => owner.kind === "collection_item" && collectionIds.includes(owner.collectionId as string))
    .map((owner) => owner.itemId as string);
  contract.collections = collections(contract).filter((collection) => !collectionIds.includes(collection.id as string));
  contract.tombstonedIds = [...new Set([...tombstones(contract), ...collectionIds, ...fieldIds, ...sectionIds, ...items])].sort();
  migration.candidateContent.values = values(migration.candidateContent).filter(
    (value) => !removed.has(value.fieldId as string),
  );
}

function refreshFrom(migration: RetireCase): void {
  migration.declaration.from = managedSiteFieldMigrationFromV1(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
  );
}

function retireCase(step: Json, retired: Parameters<typeof applyRetire>[1]): RetireCase {
  const migration: RetireCase = {
    productionContract: structuredClone(PRODUCTION.contract),
    productionContent: structuredClone(PRODUCTION.content),
    candidateContract: structuredClone(PRODUCTION.contract),
    candidateContent: structuredClone(PRODUCTION.content),
    declaration: { schemaVersion: "1.0", steps: [{ op: "retire", ...step }] },
  };
  applyRetire(migration, retired);
  refreshFrom(migration);
  return migration;
}

/** The openings list retired exactly as All Points Media's PR does. */
function openingsCase(): RetireCase {
  return retireCase({ collections: [OPENINGS] }, { collections: [OPENINGS] });
}

function verify(migration: RetireCase): ManagedSiteFieldMigrationProofV1 {
  return validateManagedSiteContractV1MigrationCompatibility(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    migration.declaration,
    { admitBridge: () => true },
  );
}

function verdict(migration: RetireCase): string {
  try {
    verify(migration);
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

function retireProof(proof: ManagedSiteFieldMigrationProofV1): ManagedSiteFieldMigrationRetireStepProofV1 {
  const [step] = proof.steps;
  assert.equal(step?.op, "retire");
  return step as ManagedSiteFieldMigrationRetireStepProofV1;
}

/** Runs a mutation on a fresh openings case and returns the verdict. */
function openingsVerdict(mutate: (migration: RetireCase) => void): string {
  const migration = openingsCase();
  mutate(migration);
  return verdict(migration);
}

function itemValues(content: Json, itemId: string): Json[] {
  return values(content).filter((value) => (value.owner as Json).itemId === itemId);
}

function placementValue(content: Json, fieldId: string): Json {
  const found = values(content).find((value) => value.fieldId === fieldId);
  if (found === undefined) throw new Error(`No value ${fieldId}`);
  return found;
}

/** The six openings production holds, in its order. */
function openingItems(): string[] {
  return (placementValue(PRODUCTION.content, OPENINGS_FIELD).value as Json).orderedItemIds as string[];
}

/**
 * Lists the retired openings again in the candidate: in a new collection
 * declared with fresh ids, or as an extra item of the stats list it keeps.
 */
function reuseOpenings(migration: RetireCase, where: "new" | "kept"): void {
  const contract = migration.candidateContract;
  const content = migration.candidateContent;
  if (where === "kept") {
    const statsField = underCollection(migration.productionContract, STATS)[0] as string;
    const list = placementValue(content, statsField).value as Json;
    list.orderedItemIds = [...(list.orderedItemIds as string[]), OPENING_ITEM];
    for (const field of collectionOf(contract, STATS).itemFields as Json[]) {
      values(content).push({ fieldId: field.id, owner: { kind: "collection_item", collectionId: STATS, itemId: OPENING_ITEM }, type: "plain_text", value: "Reused" });
    }
    return;
  }
  const fresh = structuredClone(collectionOf(migration.productionContract, OPENINGS));
  fresh.id = fixtureId("collection");
  const ids = new Map<string, string>();
  for (const field of fresh.itemFields as Json[]) {
    ids.set(field.id as string, fixtureId("field"));
    field.id = ids.get(field.id as string);
  }
  collections(contract).push(fresh);
  const placement = structuredClone(
    (sectionsOf(migration.productionContract, ABOUT_SECTION).fields as Json[]).find((field) => field.id === OPENINGS_FIELD) as Json,
  );
  placement.id = fixtureId("field");
  placement.collectionId = fresh.id;
  (sectionsOf(contract, ABOUT_SECTION).fields as Json[]).push(placement);
  values(content).push({ fieldId: placement.id, owner: { kind: "page", pageId: ABOUT_PAGE }, type: "collection", value: { orderedItemIds: openingItems() } });
  for (const value of values(migration.productionContent)) {
    const owner = value.owner as Json;
    if (owner.collectionId !== OPENINGS) continue;
    values(content).push({ ...structuredClone(value), fieldId: ids.get(value.fieldId as string), owner: { ...owner, collectionId: fresh.id } });
  }
}

function sectionsOf(contract: Json, sectionId: string): Json {
  const found = sections(contract).find((section) => section.id === sectionId);
  if (found === undefined) throw new Error(`No section ${sectionId}`);
  return found;
}

/** Synthetic production whose candidate is production itself, for refusals resolution decides. */
function unchangedCase(contract: Json, content: Json, step: Json): RetireCase {
  const migration: RetireCase = {
    productionContract: structuredClone(contract),
    productionContent: structuredClone(content),
    candidateContract: structuredClone(contract),
    candidateContent: structuredClone(content),
    declaration: { schemaVersion: "1.0", steps: [{ op: "retire", ...step }] },
  };
  refreshFrom(migration);
  return migration;
}

describe("field migration retire: whole collections (0.29.0)", () => {
  it("retires All Points Media's careers openings list, its items, values and placement", () => {
    const migration = openingsCase();
    const proof = verify(migration);
    assert.deepEqual(retireProof(proof), {
      op: "retire",
      fields: [],
      sections: [],
      collections: [{
        collectionId: OPENINGS,
        fields: [{ fieldId: OPENINGS_FIELD, owner: { kind: "page", pageId: ABOUT_PAGE }, pageId: ABOUT_PAGE, sectionId: ABOUT_SECTION }],
        itemFields: OPENINGS_ITEM_FIELDS,
        items: [...openingItems()].sort(),
      }],
    });
    const production = values(migration.productionContent).length;
    assert.deepEqual(proof.accounting, {
      productionValues: production,
      unchanged: production - 19,
      consumed: 19,
      candidateValues: production - 19,
      targets: 0,
      added: 0,
    });
    assert.deepEqual(proof.added, []);
  });

  it("leaves a retire step that names no collection proving exactly what it did before", () => {
    const migration = retireCase({ fields: [CTA_BODY] }, { fields: [CTA_BODY] });
    assert.equal(Object.hasOwn(retireProof(verify(migration)), "collections"), false);
  });

  it("retires a section the collections and named fields together empty", () => {
    const all = [STATS, VALUES, OPENINGS];
    const migration = retireCase(
      { fields: [CTA_TITLE, CTA_BODY], collections: all, sections: [ABOUT_SECTION] },
      { collections: all, fields: [CTA_TITLE, CTA_BODY], sections: [ABOUT_SECTION] },
    );
    const proof = retireProof(verify(migration));
    assert.deepEqual(proof.collections?.map((retired) => retired.collectionId), all);
    assert.deepEqual(proof.sections, [{ sectionId: ABOUT_SECTION, pageId: ABOUT_PAGE }]);
  });

  const refusals: readonly { readonly name: string; readonly code: string; readonly mutate: (migration: RetireCase) => void }[] = [
    {
      name: "the candidate still declares the collection",
      code: "MIGRATION_RETIRE_STILL_DECLARED",
      mutate: (migration) => {
        collections(migration.candidateContract).push(collectionOf(migration.productionContract, OPENINGS));
        const kept = new Set([OPENINGS, ...OPENINGS_ITEM_FIELDS]);
        migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => !kept.has(id));
      },
    },
    {
      name: "the candidate does not tombstone one item field",
      code: "MIGRATION_TOMBSTONES_INCOMPLETE",
      mutate: (migration) => {
        migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== OPENINGS_ITEM_FIELDS[1]);
      },
    },
    {
      name: "the candidate does not tombstone the placement",
      code: "MIGRATION_TOMBSTONES_INCOMPLETE",
      mutate: (migration) => {
        migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== OPENINGS_FIELD);
      },
    },
    {
      name: "the candidate keeps one item's title",
      code: "MIGRATION_SOURCE_VALUE_REMAINS",
      mutate: (migration) => {
        const title = itemValues(migration.productionContent, OPENING_ITEM).find((value) => value.fieldId === OPENINGS_ITEM_FIELDS[1]);
        values(migration.candidateContent).push(structuredClone(title as Json));
      },
    },
    {
      name: "the candidate keeps the list's order value",
      code: "MIGRATION_SOURCE_VALUE_REMAINS",
      mutate: (migration) => {
        values(migration.candidateContent).push(structuredClone(placementValue(migration.productionContent, OPENINGS_FIELD)));
      },
    },
    {
      name: "the declaration names an unknown collection",
      code: "MIGRATION_RETIRE_UNKNOWN",
      mutate: (migration) => {
        migration.declaration.steps = [{ op: "retire", collections: [UNKNOWN_COLLECTION] }];
      },
    },
    {
      name: "a second step retires the same collection",
      code: "MIGRATION_RETIRE_CLAIMED_TWICE",
      mutate: (migration) => {
        (migration.declaration.steps as Json[]).push({ op: "retire", collections: [OPENINGS] });
      },
    },
    {
      name: "the placement is also named as a field",
      code: "MIGRATION_RETIRE_NOT_EDITABLE",
      mutate: (migration) => {
        migration.declaration.steps = [{ op: "retire", fields: [OPENINGS_FIELD], collections: [OPENINGS] }];
      },
    },
    {
      name: "only an item field is named (some fields of every item, not the list)",
      code: "MIGRATION_TRANSFORM_DEFERRED",
      mutate: (migration) => {
        migration.declaration.steps = [{ op: "retire", fields: [OPENINGS_ITEM_FIELDS[0]] }];
      },
    },
    {
      name: "the step names neither a field nor a collection",
      code: "MIGRATION_DECLARATION_INVALID",
      mutate: (migration) => {
        migration.declaration.steps = [{ op: "retire", sections: [ABOUT_SECTION] }];
      },
    },
    {
      name: "the step names one collection twice",
      code: "MIGRATION_DECLARATION_INVALID",
      mutate: (migration) => {
        migration.declaration.steps = [{ op: "retire", collections: [OPENINGS, OPENINGS] }];
      },
    },
    {
      name: "a section the list leaves non-empty is named",
      code: "MIGRATION_RETIRE_SECTION_NOT_EMPTY",
      mutate: (migration) => {
        migration.declaration.steps = [{ op: "retire", collections: [OPENINGS], sections: [ABOUT_SECTION] }];
      },
    },
    {
      name: "a value that stays spells one of the list's item ids",
      code: "MIGRATION_RETIRE_REFERENCED",
      mutate: (migration) => {
        for (const content of [migration.productionContent, migration.candidateContent]) {
          placementValue(content, CTA_BODY).value = OPENING_ITEM;
        }
        refreshFrom(migration);
      },
    },
    {
      name: "a value that stays spells the retired collection's id",
      code: "MIGRATION_RETIRE_REFERENCED",
      mutate: (migration) => {
        for (const content of [migration.productionContent, migration.candidateContent]) {
          placementValue(content, CTA_TITLE).value = OPENINGS;
        }
        refreshFrom(migration);
      },
    },
    {
      name: "an item is dropped but the list stays (a partial retire nothing declared)",
      code: "MIGRATION_UNDECLARED_CHANGE",
      mutate: (migration) => {
        migration.candidateContract = structuredClone(migration.productionContract);
        migration.candidateContent = structuredClone(migration.productionContent);
        applyRetire(migration, { fields: [CTA_BODY] });
        migration.declaration.steps = [{ op: "retire", fields: [CTA_BODY] }];
        const list = placementValue(migration.candidateContent, OPENINGS_FIELD).value as Json;
        list.orderedItemIds = (list.orderedItemIds as string[]).filter((id) => id !== OPENING_ITEM);
        migration.candidateContent.values = values(migration.candidateContent).filter(
          (value) => (value.owner as Json).itemId !== OPENING_ITEM,
        );
      },
    },
    {
      name: "the candidate drops another collection's item the declaration does not name",
      code: "MIGRATION_UNDECLARED_CHANGE",
      mutate: (migration) => {
        const stats = collectionOf(migration.productionContract, STATS);
        const statsItem = (placementValue(migration.productionContent, underCollection(migration.productionContract, STATS)[0] as string).value as Json).orderedItemIds as string[];
        const dropped = statsItem.at(-1) as string;
        const list = placementValue(migration.candidateContent, underCollection(migration.productionContract, STATS)[0] as string).value as Json;
        list.orderedItemIds = statsItem.slice(0, -1);
        migration.candidateContent.values = values(migration.candidateContent).filter(
          (value) => !((value.owner as Json).collectionId === stats.id && (value.owner as Json).itemId === dropped),
        );
      },
    },
    {
      name: "the candidate does not tombstone one retired item",
      code: "MIGRATION_TOMBSTONES_INCOMPLETE",
      mutate: (migration) => {
        migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== OPENING_ITEM);
      },
    },
    {
      name: "the candidate reuses the retired items in a new list (a move dressed as a retire)",
      code: "CONTENT_ITEM_TOMBSTONED",
      mutate: (migration) => reuseOpenings(migration, "new"),
    },
    {
      name: "the candidate reuses a retired item in a list it keeps (a production value changes)",
      code: "MIGRATION_UNDECLARED_CHANGE",
      mutate: (migration) => reuseOpenings(migration, "kept"),
    },
    {
      name: "the declaration was written against other production content",
      code: "MIGRATION_FROM_STALE",
      mutate: (migration) => {
        placementValue(migration.productionContent, CTA_BODY).value = "A customer's later edit";
        placementValue(migration.candidateContent, CTA_BODY).value = "A customer's later edit";
      },
    },
  ];

  for (const refusal of refusals) {
    it(`refuses when ${refusal.name}`, () => {
      assert.equal(openingsVerdict(refusal.mutate), refusal.code);
    });
  }

  it("refuses a collection a generated page iterates, from a route its items do not name", () => {
    const fixture = protectedItemFixture();
    const migration = unchangedCase(fixture.contract, fixture.content, { collections: [fixture.collectionId] });
    // The routed fixture collection also holds a protected search field, which
    // is judged first: a generated page's collection is never retired either way.
    assert.equal(verdict(migration), "MIGRATION_RETIRE_PROTECTED");
  });

  it("treats a reference inside the retired collection (its uniqueness rule) as going with it", () => {
    const migration = openingsCase();
    collectionOf(migration.productionContract, OPENINGS).uniqueness = [
      { fieldIds: [OPENINGS_ITEM_FIELDS[1]], comparison: "case_folded" },
    ];
    refreshFrom(migration);
    assert.equal(verdict(migration), ACCEPTED);
  });

  it("defers a collection with an image item field: its asset slot would have to go too", () => {
    const contract = structuredClone(PRODUCTION.contract);
    const content = structuredClone(PRODUCTION.content);
    const assetSlot = fixtureId("asset");
    const imageField = fixtureId("field");
    const presentation = { name: "Photo", description: null, group: "About", order: 4, example: null };
    (contract.assets as Json[]).push({
      id: assetSlot, presentation, semantics: { kind: "informative" },
      acceptedMimeTypes: ["image/webp"], outputMimeTypes: ["image/webp"],
      minWidth: 1, maxWidth: 2, minHeight: 1, maxHeight: 2, aspectRatios: [{ width: 1, height: 1 }],
      cropPolicy: "optional", focalPointPolicy: "optional", maxBytes: 1,
    });
    (collectionOf(contract, OPENINGS).itemFields as Json[]).push({
      id: imageField, type: "image", classification: "customer_editable", capabilities: ["image.upload"],
      itemPointer: "/photo", presentation, assetSlotId: assetSlot,
    });
    const image = { path: "public/images/opening.webp", sha256: "a".repeat(64), mimeType: "image/webp", width: 1, height: 1, bytes: 1, altText: "x", crop: null, focalPoint: null };
    for (const itemId of openingItems()) {
      values(content).push({ fieldId: imageField, owner: { kind: "collection_item", collectionId: OPENINGS, itemId }, type: "image", value: image });
    }
    (content.assetManifest as Json[]).push({ assetSlotId: assetSlot, path: image.path, sha256: image.sha256, mimeType: "image/webp", width: 1, height: 1, bytes: 1 });
    const migration = unchangedCase(contract, content, { collections: [OPENINGS] });
    assert.equal(verdict(migration), "MIGRATION_TRANSFORM_DEFERRED");
  });

  const references: readonly { readonly name: string; readonly name_: (contract: Json) => void }[] = [
    {
      name: "the page's search intent names the list's placement",
      name_: (contract) => {
        const about = ((contract.internalSeo as Json).pages as Json[]).find((page) => page.pageId === ABOUT_PAGE) as Json;
        ((about.intent as Json).services as string[]).push(OPENINGS_FIELD);
      },
    },
    {
      name: "the page's search intent names the list's placement as a location",
      name_: (contract) => {
        const about = ((contract.internalSeo as Json).pages as Json[]).find((page) => page.pageId === ABOUT_PAGE) as Json;
        ((about.intent as Json).locations as string[]).push(OPENINGS_FIELD);
      },
    },
  ];

  for (const reference of references) {
    it(`refuses when ${reference.name}`, () => {
      const migration = openingsCase();
      reference.name_(migration.productionContract);
      refreshFrom(migration);
      assert.equal(verdict(migration), "MIGRATION_RETIRE_REFERENCED");
    });
  }

  it("retires a list placed twice, listing both placements", () => {
    const contract = structuredClone(PRODUCTION.contract);
    const content = structuredClone(PRODUCTION.content);
    const second = structuredClone(
      (sectionsOf(contract, ABOUT_SECTION).fields as Json[]).find((field) => field.id === OPENINGS_FIELD) as Json,
    );
    second.id = fixtureId("field");
    (second.resolver as Json).pointer = "/aboutPage/aboutContent/careers/openingsAgain/collection/order";
    (sectionsOf(contract, ABOUT_SECTION).fields as Json[]).push(second);
    values(content).push({ ...structuredClone(placementValue(content, OPENINGS_FIELD)), fieldId: second.id });
    const migration: RetireCase = {
      productionContract: contract,
      productionContent: content,
      candidateContract: structuredClone(contract),
      candidateContent: structuredClone(content),
      declaration: { schemaVersion: "1.0", steps: [{ op: "retire", collections: [OPENINGS] }] },
    };
    applyRetire(migration, { collections: [OPENINGS] });
    refreshFrom(migration);
    const proof = retireProof(verify(migration));
    assert.deepEqual(proof.collections?.[0]?.fields.map((field) => field.fieldId), [OPENINGS_FIELD, second.id]);
  });

  it("exempts only what sits inside a retired container, never a sibling whose index shares its digits", () => {
    assert.equal(isInsideRetiredContainer("collections[1].uniqueness[0].fieldIds[0]", ["collections[1]"]), true);
    assert.equal(isInsideRetiredContainer("collections[10].uniqueness[0].fieldIds[0]", ["collections[1]"]), false);
    assert.equal(isInsideRetiredContainer("collections[1]", ["collections[1]"]), false);
    assert.equal(isInsideRetiredContainer("pages[0].sections[2].fields[11].collectionId", ["pages[0].sections[2].fields[1]"]), false);
  });

  it("defers a collection whose items hold a list, and a list placed inside an item", () => {
    const fixture = nestedListFixture();
    for (const collectionId of [OPENINGS, fixture.child]) {
      const migration = unchangedCase(fixture.contract, fixture.content, { collections: [collectionId] });
      assert.equal(verdict(migration), "MIGRATION_TRANSFORM_DEFERRED", collectionId);
    }
  });

});

/**
 * All Points Media's /about with a list inside each opening (0.27.0): every
 * opening holds an empty list of a child collection.
 */
function nestedListFixture(): { contract: Json; content: Json; child: string } {
  const contract = structuredClone(PRODUCTION.contract);
  const content = structuredClone(PRODUCTION.content);
  const child = fixtureId("collection");
  const listField = fixtureId("field");
  const textField = fixtureId("field");
  const presentation = { name: "Highlight", description: null, group: "Nested", order: 41, example: null };
  collections(contract).push({
    id: child,
    presentation,
    resolver: { kind: "json_pointer", path: "src/content/pages/about.json", pointer: "/highlights" },
    itemIdPointer: "/id",
    itemIdPolicy: "server_minted",
    minItems: 0,
    maxItems: 3,
    itemFields: [{
      id: textField,
      type: "plain_text",
      classification: "customer_editable",
      capabilities: ["text.edit"],
      itemPointer: "/text",
      presentation,
      semantic: "body",
      constraints: { minLength: 1, maxLength: 80, newlines: "forbid" },
    }],
    uniqueness: [],
    deletion: { whenReferenced: "cascade", restorable: false },
  });
  (collectionOf(contract, OPENINGS).itemFields as Json[]).push({
    id: listField,
    type: "collection",
    classification: "customer_editable",
    capabilities: ["collection.reorder", "collection.add", "collection.remove"],
    itemPointer: "/highlights",
    presentation,
    collectionId: child,
  });
  const openings = (placementValue(content, OPENINGS_FIELD).value as Json).orderedItemIds as string[];
  for (const itemId of openings) {
    values(content).push({ fieldId: listField, owner: { kind: "collection_item", collectionId: OPENINGS, itemId }, type: "collection", value: { orderedItemIds: [] } });
  }
  return { contract, content, child };
}

/**
 * What a collection retire carries without naming is what a converter's
 * ledger must count as consumed. Invariant: the ids derived from production
 * alone are exactly the ids the verifier claims for the same declaration, over
 * every shape the proof can take.
 */
describe("field migration retire: what a collection carries, from production alone", () => {
  function carried(migration: RetireCase): string[] {
    return [...managedSiteFieldMigrationRetireCarriedIdsV1(
      parseManagedSiteContractV1(migration.productionContract),
      parseManagedSiteContentDocument(migration.productionContent),
      parseManagedSiteFieldMigrationV1(migration.declaration),
    )].sort();
  }

  function claimed(migration: RetireCase): string[] {
    return (retireProof(verify(migration)).collections ?? [])
      .flatMap((retired) => [...retired.fields.map((field) => field.fieldId), ...retired.itemFields, ...retired.items])
      .sort();
  }

  function placedTwice(): RetireCase {
    const contract = structuredClone(PRODUCTION.contract);
    const content = structuredClone(PRODUCTION.content);
    const second = structuredClone(
      (sectionsOf(contract, ABOUT_SECTION).fields as Json[]).find((field) => field.id === OPENINGS_FIELD) as Json,
    );
    second.id = fixtureId("field");
    (second.resolver as Json).pointer = "/aboutPage/aboutContent/careers/openingsAgain/collection/order";
    (sectionsOf(contract, ABOUT_SECTION).fields as Json[]).push(second);
    values(content).push({ ...structuredClone(placementValue(content, OPENINGS_FIELD)), fieldId: second.id });
    const migration: RetireCase = {
      productionContract: contract,
      productionContent: content,
      candidateContract: structuredClone(contract),
      candidateContent: structuredClone(content),
      declaration: { schemaVersion: "1.0", steps: [{ op: "retire", collections: [OPENINGS] }] },
    };
    applyRetire(migration, { collections: [OPENINGS] });
    refreshFrom(migration);
    return migration;
  }

  const all = [STATS, VALUES, OPENINGS];
  const shapes: readonly [string, () => RetireCase][] = [
    ["the openings list", openingsCase],
    ["three lists, two named fields and the section they empty", () => retireCase(
      { fields: [CTA_TITLE, CTA_BODY], collections: all, sections: [ABOUT_SECTION] },
      { collections: all, fields: [CTA_TITLE, CTA_BODY], sections: [ABOUT_SECTION] },
    )],
    ["a list placed twice", placedTwice],
  ];
  for (const [name, build] of shapes) {
    it(`derives exactly what the verifier claims for ${name}`, () => {
      const migration = build();
      const derived = carried(migration);
      assert.ok(derived.length > 0);
      assert.deepEqual(derived, claimed(migration));
    });
  }

  it("carries every placement, item field and item of the openings list, and never the collection it names", () => {
    const derived = carried(openingsCase());
    assert.deepEqual(derived, [OPENINGS_FIELD, ...OPENINGS_ITEM_FIELDS, ...openingItems()].sort());
    assert.equal(derived.includes(OPENINGS), false);
  });

  it("carries nothing for a retire that names only fields, or a collection production does not declare", () => {
    assert.deepEqual(carried(retireCase({ fields: [CTA_BODY] }, { fields: [CTA_BODY] })), []);
    const unknown = openingsCase();
    unknown.declaration.steps = [{ op: "retire", collections: [UNKNOWN_COLLECTION] }];
    assert.deepEqual(carried(unknown), []);
  });
});

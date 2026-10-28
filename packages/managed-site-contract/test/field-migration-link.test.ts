import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ManagedSiteContractError,
  managedRichTextLinkAttributesV1,
  managedSiteFieldMigrationFromV1,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  validateManagedSiteContractV1MigrationCompatibility,
  type ManagedSiteFieldMigrationProofV1,
} from "../src/index.js";

/**
 * All Points Media production revision 8 (commit 85cb45b), trimmed to the
 * sections the link steps touch and the sections its SEO metadata names, with
 * every heading outline cut to its H1. The header nav, footer nav and legal
 * nav are collections whose `label` is an editable item field while the href
 * sits in code, and the site's call-to-action labels are editable text fields
 * whose hrefs are in code: the first link steps turn exactly those into link
 * fields.
 */
const FIXTURE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/field-migration-link");

type Json = Record<string, unknown>;

function read(name: string): Json {
  return JSON.parse(readFileSync(resolve(FIXTURE_DIRECTORY, `${name}.json`), "utf8")) as Json;
}

const PRODUCTION = Object.freeze({ contract: read("production.contract"), content: read("production.content") });

const PAGE = {
  home: "page_fwtww4abmmbqasq46zssffva24",
  about: "page_teyen9zyv63gwppbsgsqkkb5mc",
  contact: "page_sxg87509pdtqf6zdj1d4nw79dg",
  industries: "page_9xbw114xjkzzb8dy8gyr7zwxhc",
  insights: "page_xhegh2ybnsqbvjh9ja83z5t8nr",
  networks: "page_66nqm34wx767mhjvz71vx0v2y4",
  privacy: "page_k81xhbd2nmm13hmza7rdnnphsg",
  solutions: "page_ggrvn5686cawby8mwa56h8f65g",
  terms: "page_qdtxt2nzfc0pv8pyghtpb2wmpw",
  work: "page_95xvhcrhz1q3rw0s49f4a94xtw",
} as const;

const HEADER_NAV = {
  collection: "collection_gssa1mexn3yw7y4y2c56cewdq0",
  label: "field_0j5mr1jz80r29vnax4b2xakrxr",
  items: [
    ["item_nc434yegt4bx4nqy9eza47z40w", PAGE.networks],
    ["item_0qets9j1pw47jzqr3rvbebqcjg", PAGE.solutions],
    ["item_amq3835e8dba644qxbcta73vjm", PAGE.industries],
    ["item_w2n0v5acemt7r5pf90ytvkjfh4", PAGE.work],
    ["item_rsn4cwjqqhnetqhrdmfzbjvh00", PAGE.insights],
    ["item_jxz8r6cqesjf65k5tnas33ymfg", PAGE.about],
  ],
} as const;
const FOOTER_NAV = {
  collection: "collection_vrspy73asb2hx1tjp9pdecr5kg",
  label: "field_ewt8dxc90x1rt50e4ak71z93x8",
  items: [
    ["item_029edbqw3symfgkgsd4fdmyfcw", PAGE.networks],
    ["item_yqdj9wyjcw4e0j7tyt9g28abgc", PAGE.solutions],
    ["item_8kxrkhcem74j9nm7rf9km6hm4w", PAGE.industries],
    ["item_k5gwzppqyjg5px91tg1p15a10c", PAGE.work],
    ["item_6wj2d5wq6vj5n673znsga18n94", PAGE.insights],
    ["item_xdks09wprv6cdqnsmmdaf8e6d8", PAGE.about],
  ],
} as const;
const LEGAL_NAV = {
  collection: "collection_4btbxhf2yh7s4w2z56xrww0fcg",
  label: "field_ekexxpqx00p8mv83qrv64smjw4",
  items: [
    ["item_xaa9w119r9yt686cht6xg8gewm", PAGE.privacy],
    ["item_7xqnkvrp5m8rz41h7tsqjhhp7w", PAGE.terms],
  ],
} as const;
const VENUES_MENU = {
  collection: "collection_x0sfxbzpx3takq0zj129sycw3c",
  label: "field_g6gsjsptbz0t5dxkjfa435d0ng",
} as const;

/** Site-scoped call-to-action labels, declared on the home page. */
const BROWSE_NETWORKS = "field_tgdewcn434m0n123h3npak5rjg";
const PRIMARY_CTA = "field_xqtv18xeznya5x9bccsam7nx3m";
/** Page-scoped body-role labels on the home page, side by side in one section. */
const CASE_STUDIES = "field_byy76m1szc159gttq8zht2j6c4";
const SECONDARY_CTA = "field_ff6kzs4ykp0h3c9je2kzjan3s0";
/** On /work: the "Explore the Boardwalk" link's label. */
const WORK_BOARDWALK = "field_4bqqd71b0rg48p6drnxw2hp4m0";
const CODE_OWNED_LABEL = "field_69zv69152semqbb5shhb860d10";
const HOME_HEADING = "field_9easkxe1tcrw9fgtta33zk7se8";
const HOME_SEO_TITLE = "field_z3e3c9dxn3gvydra9pyfakqdwc";
const PROTECTED_FIELD = "field_hbdw04cj6f53ny3f94qhmvx114";
const PRODUCTION_TOMBSTONE = "field_02bb25rkwm1c7q4k65r71c72nr";
const UNKNOWN_FIELD = "field_" + "1".repeat(25) + "0";
const UNKNOWN_PAGE = "page_" + "1".repeat(25) + "4";
const UNKNOWN_ITEM = "item_" + "1".repeat(25) + "8";

/** Fresh ids for link targets, one per step a case may declare. */
const TARGETS = ["2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => `field_${digit.repeat(25)}0`);

const ACCEPTED = "ACCEPTED";

type Destination = Json;

function internal(pageId: string, fragment: string | null = null): Destination {
  return { kind: "internal", pageId, fragment };
}

interface LinkSpec {
  readonly source: string;
  readonly target: string;
  readonly links: readonly Json[];
  /** The target descriptor's link constraints, over the internal-only default. */
  readonly constraints?: Json;
}

interface LinkCase {
  productionContract: Json;
  productionContent: Json;
  candidateContract: Json;
  candidateContent: Json;
  declaration: Json;
}

const INTERNAL_ONLY: Json = {
  allowedExternalHosts: [],
  allowedFragments: [],
  allowedSchemes: [],
  allowedTargets: ["same_window"],
  authority: "internal_only",
  fragmentPolicy: "forbid",
  labelConstraints: { maxLength: 160, minLength: 1, newlines: "forbid" },
};

const LINK_CAPABILITIES = ["link.label.edit", "link.destination.edit", "link.target.edit"];

function pages(contract: Json): Json[] {
  return contract.pages as Json[];
}

function sections(contract: Json): Json[] {
  return pages(contract).flatMap((page) => page.sections as Json[]);
}

function collections(contract: Json): Json[] {
  return contract.collections as Json[];
}

function values(content: Json): Json[] {
  return content.values as Json[];
}

function tombstones(contract: Json): string[] {
  return contract.tombstonedIds as string[];
}

/** The list a field is declared in: a section's fields or a collection's item fields. */
function declaringList(contract: Json, fieldId: string): Json[] {
  const lists = [
    ...sections(contract).map((section) => section.fields as Json[]),
    ...collections(contract).map((collection) => collection.itemFields as Json[]),
  ];
  const found = lists.find((list) => list.some((field) => field.id === fieldId));
  if (found === undefined) throw new Error(`No declaration of ${fieldId}`);
  return found;
}

function fieldOf(contract: Json, fieldId: string): Json {
  return declaringList(contract, fieldId).find((field) => field.id === fieldId) as Json;
}

/** The link descriptor code would declare in the source's place. */
function linkDescriptor(source: Json, spec: LinkSpec): Json {
  const shared = {
    id: spec.target,
    type: "link",
    classification: "customer_editable",
    capabilities: LINK_CAPABILITIES,
    presentation: source.presentation,
    constraints: { ...INTERNAL_ONLY, ...spec.constraints },
  };
  if ("itemPointer" in source) return { ...shared, itemPointer: "/link" };
  const resolver = source.resolver as Json;
  return { ...shared, scope: source.scope, usages: source.usages, resolver: { ...resolver, pointer: `${resolver.pointer as string}/link` } };
}

/**
 * The candidate code writes for one link step: the source undeclared,
 * tombstoned and valueless, the link field declared where it was, and one
 * link per value whose label is the source's text.
 */
function applyLink(migration: LinkCase, spec: LinkSpec): void {
  const list = declaringList(migration.candidateContract, spec.source);
  const index = list.findIndex((field) => field.id === spec.source);
  list.splice(index, 1, linkDescriptor(list[index], spec));
  migration.candidateContract.tombstonedIds = [...tombstones(migration.candidateContract), spec.source].sort();
  const sourceValues = values(migration.candidateContent).filter((value) => value.fieldId === spec.source);
  const written = sourceValues.map((value) => {
    const owner = value.owner as Json;
    const link = spec.links.find((candidate) => (candidate.item ?? null) === (owner.itemId ?? null)) ?? spec.links[0];
    return {
      fieldId: spec.target,
      owner,
      type: "link",
      value: { label: value.value, destination: link.destination, target: link.target },
    };
  });
  migration.candidateContent.values = [
    ...values(migration.candidateContent).filter((value) => value.fieldId !== spec.source),
    ...written,
  ];
}

function refreshFrom(migration: LinkCase): void {
  migration.declaration.from = managedSiteFieldMigrationFromV1(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
  );
}

function linkCase(...specs: LinkSpec[]): LinkCase {
  const migration: LinkCase = {
    productionContract: structuredClone(PRODUCTION.contract),
    productionContent: structuredClone(PRODUCTION.content),
    candidateContract: structuredClone(PRODUCTION.contract),
    candidateContent: structuredClone(PRODUCTION.content),
    declaration: {
      schemaVersion: "1.0",
      steps: specs.map((spec) => ({ op: "link", source: spec.source, target: spec.target, links: spec.links })),
    },
  };
  for (const spec of specs) applyLink(migration, spec);
  refreshFrom(migration);
  return migration;
}

function navSpec(
  nav: { readonly label: string; readonly items: readonly (readonly [string, string])[] },
  target: string,
): LinkSpec {
  return {
    source: nav.label,
    target,
    links: nav.items.map(([item, pageId]) => ({ item, destination: internal(pageId), target: "same_window" })),
  };
}

function oneLink(source: string, target: string, destination: Destination, constraints?: Json, window = "same_window"): LinkSpec {
  return { source, target, links: [{ destination, target: window }], constraints };
}

function step(migration: LinkCase, index = 0): Json {
  return (migration.declaration.steps as Json[])[index];
}

function links(migration: LinkCase, index = 0): Json[] {
  return step(migration, index).links as Json[];
}

function targetValues(migration: LinkCase, target: string): Json[] {
  return values(migration.candidateContent).filter((value) => value.fieldId === target);
}

/** Both sides of production, so the change is to production itself. */
function onProduction(migration: LinkCase, change: (contract: Json, content: Json) => void): LinkCase {
  change(migration.productionContract, migration.productionContent);
  change(migration.candidateContract, migration.candidateContent);
  refreshFrom(migration);
  return migration;
}

function verify(migration: LinkCase): ManagedSiteFieldMigrationProofV1 {
  return validateManagedSiteContractV1MigrationCompatibility(
    parseManagedSiteContractV1(migration.productionContract),
    parseManagedSiteContentDocument(migration.productionContent),
    parseManagedSiteContractV1(migration.candidateContract),
    parseManagedSiteContentDocument(migration.candidateContent),
    migration.declaration,
    { admitBridge: () => false },
  );
}

function outcome(migration: LinkCase): string {
  try {
    verify(migration);
    return ACCEPTED;
  } catch (error) {
    if (error instanceof ManagedSiteContractError) return error.code;
    throw error;
  }
}

function itemValue(content: Json, fieldId: string, itemId: string): Json {
  const found = values(content).find(
    (value) => value.fieldId === fieldId && (value.owner as Json).itemId === itemId,
  );
  if (found === undefined) throw new Error(`No value ${fieldId} ${itemId}`);
  return found;
}

interface Row {
  readonly name: string;
  readonly expected: string;
  readonly build: () => LinkCase;
}

const ACCEPTED_ROWS: readonly Row[] = [
  {
    name: "All Points Media: the header nav's six labels become links to their pages",
    expected: ACCEPTED,
    build: () => linkCase(navSpec(HEADER_NAV, TARGETS[0])),
  },
  {
    name: "the footer nav, the same six pages through its own collection",
    expected: ACCEPTED,
    build: () => linkCase(navSpec(FOOTER_NAV, TARGETS[0])),
  },
  {
    name: "the legal nav, to /privacy and /terms",
    expected: ACCEPTED,
    build: () => linkCase(navSpec(LEGAL_NAV, TARGETS[0])),
  },
  {
    name: "all three navs and the call-to-action labels to main pages, in one declaration",
    expected: ACCEPTED,
    build: () =>
      linkCase(
        navSpec(HEADER_NAV, TARGETS[0]),
        navSpec(FOOTER_NAV, TARGETS[1]),
        navSpec(LEGAL_NAV, TARGETS[2]),
        oneLink(BROWSE_NETWORKS, TARGETS[3], internal(PAGE.networks)),
        oneLink(CASE_STUDIES, TARGETS[4], internal(PAGE.work)),
        oneLink(SECONDARY_CTA, TARGETS[5], internal(PAGE.solutions)),
        oneLink(WORK_BOARDWALK, TARGETS[6], internal("page_k4netg1sj2rbd7kc6jqcs9wy2w")),
      ),
  },
  {
    name: "a site-scoped call to action",
    expected: ACCEPTED,
    build: () => linkCase(oneLink(BROWSE_NETWORKS, TARGETS[0], internal(PAGE.networks))),
  },
  {
    name: "a page-scoped body-role label",
    expected: ACCEPTED,
    build: () => linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work))),
  },
  {
    name: "a label the customer edited is carried over exactly",
    expected: ACCEPTED,
    build: () =>
      onProduction(linkCase(navSpec(HEADER_NAV, TARGETS[0])), (_contract, content) => {
        for (const value of values(content)) {
          if (value.fieldId === HEADER_NAV.label && value.value === "Venues") value.value = "Our Venues";
          const link = value.value as Json;
          if (value.fieldId === TARGETS[0] && link.label === "Venues") link.label = "Our Venues";
        }
      }),
  },
  {
    name: "an internal page with a fragment the target declares",
    expected: ACCEPTED,
    build: () =>
      linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work, "featured"), {
        fragmentPolicy: "declared",
        allowedFragments: ["featured"],
      })),
  },
  {
    name: "an https URL on a host the target admits",
    expected: ACCEPTED,
    build: () =>
      linkCase(oneLink(CASE_STUDIES, TARGETS[0], { kind: "external", url: "https://allpointsco.aflip.in/kit.html?page=2#p" }, {
        authority: "internal_or_external",
        allowedSchemes: ["https"],
        allowedExternalHosts: ["allpointsco.aflip.in"],
      })),
  },
  {
    name: "an email address on a target that admits mailto",
    expected: ACCEPTED,
    build: () =>
      linkCase(oneLink(BROWSE_NETWORKS, TARGETS[0], { kind: "email", address: "hello@allpointsmedia.com" }, {
        authority: "external_only",
        allowedSchemes: ["mailto"],
      })),
  },
  {
    name: "a phone number on a target that admits tel",
    expected: ACCEPTED,
    build: () =>
      linkCase(oneLink(BROWSE_NETWORKS, TARGETS[0], { kind: "phone", number: "+15035550100" }, {
        authority: "external_only",
        allowedSchemes: ["tel"],
      })),
  },
  {
    name: "a link that opens a new window, on a target that admits one",
    expected: ACCEPTED,
    build: () =>
      linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work), { allowedTargets: ["same_window", "new_window"] }, "new_window")),
  },
];

/**
 * The query the site's "Get Started" and RFP links carry (contract 0.41.0):
 * `/contact?type=strategy`, `/contact?type=rfp` and the rest, declared on
 * the target as exactly the values `/contact` reads.
 */
const CONTACT_QUERIES: Json = {
  allowedQueries: [
    {
      pageId: PAGE.contact,
      parameters: [{ name: "type", values: ["strategy", "rfp", "network", "resource", "expert", "consultation"] }],
    },
  ],
};

function contactWith(query: Json): Destination {
  return { ...internal(PAGE.contact), query };
}

const QUERY_ACCEPTED_ROWS: readonly Row[] = [
  {
    name: "All Points Media: the site's Get Started label becomes a link to /contact?type=strategy",
    expected: ACCEPTED,
    build: () => linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "strategy" }), CONTACT_QUERIES)),
  },
  {
    name: "a page-scoped label to /contact?type=rfp beside a site-scoped one to ?type=expert",
    expected: ACCEPTED,
    build: () =>
      linkCase(
        oneLink(CASE_STUDIES, TARGETS[0], contactWith({ type: "rfp" }), CONTACT_QUERIES),
        oneLink(BROWSE_NETWORKS, TARGETS[1], contactWith({ type: "expert" }), CONTACT_QUERIES),
      ),
  },
  {
    name: "a query and a fragment the target both declare",
    expected: ACCEPTED,
    build: () =>
      linkCase(oneLink(PRIMARY_CTA, TARGETS[0], { ...contactWith({ type: "rfp" }), fragment: "form" }, {
        ...CONTACT_QUERIES,
        fragmentPolicy: "declared",
        allowedFragments: ["form"],
      })),
  },
];

const QUERY_REFUSED_ROWS: readonly Row[] = [
  {
    name: "a query on a target that declares none",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "strategy" }))),
  },
  {
    name: "a value the target does not declare",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "admin" }), CONTACT_QUERIES)),
  },
  {
    name: "a parameter the target does not declare beside one it does",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "strategy", admin: "1" }), CONTACT_QUERIES)),
  },
  {
    name: "a declared query on a page the target declares none for",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(PRIMARY_CTA, TARGETS[0], { ...internal(PAGE.about), query: { type: "strategy" } }, CONTACT_QUERIES)),
  },
  {
    name: "a value written as the browser would encode it",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => declaredAs(CASE_STUDIES, contactWith({ type: "strat%65gy" })),
  },
  {
    name: "a value carrying a second parameter",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => declaredAs(CASE_STUDIES, contactWith({ type: "strategy&admin=1" })),
  },
  {
    name: "an empty query, which no query is spelled without",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => declaredAs(CASE_STUDIES, contactWith({})),
  },
  {
    name: "the candidate holds another value than the one declared",
    expected: "MIGRATION_TARGET_MISMATCH",
    build: () => {
      const migration = linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "strategy" }), CONTACT_QUERIES));
      const link = targetValues(migration, TARGETS[0])[0].value as Json;
      link.destination = contactWith({ type: "rfp" });
      return migration;
    },
  },
  {
    name: "a merge step's link mark carrying a query",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => {
      const migration = linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "strategy" }), CONTACT_QUERIES));
      (migration.declaration.steps as Json[]).push({
        op: "merge",
        source: CASE_STUDIES,
        target: TARGETS[1],
        parts: [{ source: CASE_STUDIES, marks: [{ type: "link", destination: contactWith({ type: "rfp" }), target: "same_window" }] }],
      });
      return migration;
    },
  },
];

/** A valid one-link case whose declaration then names `destination` instead. */
function declaredAs(source: string, destination: Destination): LinkCase {
  const migration = linkCase(oneLink(source, TARGETS[0], internal(PAGE.work)));
  links(migration)[0].destination = destination;
  return migration;
}

/** A case whose candidate is the APM header nav, changed by `change`. */
function headerNav(change: (migration: LinkCase) => void): LinkCase {
  const migration = linkCase(navSpec(HEADER_NAV, TARGETS[0]));
  change(migration);
  return migration;
}

const REFUSED_ROWS: readonly Row[] = [
  {
    name: "an item production holds is left out",
    expected: "MIGRATION_LINK_ITEMS_MISMATCH",
    build: () => headerNav((migration) => links(migration).pop()),
  },
  {
    name: "a link for an item production does not hold",
    expected: "MIGRATION_LINK_ITEMS_MISMATCH",
    build: () => headerNav((migration) => links(migration).push({ item: UNKNOWN_ITEM, destination: internal(PAGE.home), target: "same_window" })),
  },
  {
    name: "an item of another collection in place of one of this one's",
    expected: "MIGRATION_LINK_ITEMS_MISMATCH",
    build: () => headerNav((migration) => { links(migration)[0].item = FOOTER_NAV.items[0][0]; }),
  },
  {
    name: "an item field link with no item",
    expected: "MIGRATION_LINK_ITEMS_MISMATCH",
    build: () => {
      const migration = linkCase(navSpec(LEGAL_NAV, TARGETS[0]));
      step(migration).links = [{ destination: internal(PAGE.privacy), target: "same_window" }];
      return migration;
    },
  },
  {
    name: "a page field link naming an item",
    expected: "MIGRATION_LINK_ITEMS_MISMATCH",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      links(migration)[0].item = HEADER_NAV.items[0][0];
      return migration;
    },
  },
  {
    name: "items and a link with no item mixed",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => headerNav((migration) => { delete links(migration)[0].item; }),
  },
  {
    name: "the same item twice",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => headerNav((migration) => { links(migration)[1].item = links(migration)[0].item; }),
  },
  {
    name: "a page field with two links",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      links(migration).push(links(migration)[0]);
      return migration;
    },
  },
  {
    name: "a step with no link",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => headerNav((migration) => { step(migration).links = []; }),
  },
  {
    name: "a step whose target is its source",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => headerNav((migration) => { step(migration).target = HEADER_NAV.label; }),
  },
  {
    name: "a label the candidate rewrote",
    expected: "MIGRATION_TARGET_MISMATCH",
    build: () => headerNav((migration) => {
      ((targetValues(migration, TARGETS[0])[0]).value as Json).label = "VENUES";
    }),
  },
  {
    name: "a label with a trailing space added",
    expected: "MIGRATION_TARGET_MISMATCH",
    build: () => headerNav((migration) => {
      const value = targetValues(migration, TARGETS[0])[0].value as Json;
      value.label = `${value.label as string} `;
    }),
  },
  {
    name: "a candidate destination other than the declared one",
    expected: "MIGRATION_TARGET_MISMATCH",
    build: () => headerNav((migration) => {
      (targetValues(migration, TARGETS[0])[0].value as Json).destination = internal(PAGE.home);
    }),
  },
  {
    name: "two items' destinations swapped in the candidate",
    expected: "MIGRATION_TARGET_MISMATCH",
    build: () => headerNav((migration) => {
      const [first, second] = targetValues(migration, TARGETS[0]).map((value) => value.value as Json);
      [first.destination, second.destination] = [second.destination, first.destination];
    }),
  },
  {
    name: "a candidate window other than the declared one",
    expected: "MIGRATION_TARGET_MISMATCH",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work), { allowedTargets: ["same_window", "new_window"] }));
      (targetValues(migration, TARGETS[0])[0].value as Json).target = "new_window";
      return migration;
    },
  },
  {
    name: "a target value for an owner no link declares",
    expected: "MIGRATION_UNDECLARED_CHANGE",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      values(migration.candidateContent).push({ ...targetValues(migration, TARGETS[0])[0], owner: { kind: "page", pageId: PAGE.about } });
      return migration;
    },
  },
  {
    name: "a production value no step names, changed",
    expected: "MIGRATION_UNDECLARED_CHANGE",
    build: () => headerNav((migration) => {
      itemValue(migration.candidateContent, FOOTER_NAV.label, FOOTER_NAV.items[0][0]).value = "Venues (edited)";
    }),
  },
  {
    name: "the declaration is stale against production",
    expected: "MIGRATION_FROM_STALE",
    build: () => headerNav((migration) => {
      itemValue(migration.productionContent, FOOTER_NAV.label, FOOTER_NAV.items[0][0]).value = "Venues (edited)";
    }),
  },
  {
    name: "an internal page production never declared",
    expected: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
    build: () => headerNav((migration) => {
      const destination = internal(UNKNOWN_PAGE);
      links(migration)[0].destination = destination;
      (targetValues(migration, TARGETS[0])[0].value as Json).destination = destination;
    }),
  },
  {
    name: "the Venues menu's detail routes (/networks/healthcare and the rest), which are no CMS page",
    expected: "MIGRATION_LINK_DESTINATION_UNEXPRESSIBLE",
    build: () => {
      const items = values(PRODUCTION.content)
        .filter((value) => value.fieldId === VENUES_MENU.label)
        .map((value, index) => [(value.owner as Json).itemId as string, index === 0 ? PAGE.networks : UNKNOWN_PAGE] as const);
      return linkCase(navSpec({ label: VENUES_MENU.label, items }, TARGETS[0]));
    },
  },
  {
    name: "a fragment the target forbids",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work, "featured"))),
  },
  {
    name: "a fragment the target does not declare",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () =>
      linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work, "gallery"), {
        fragmentPolicy: "declared",
        allowedFragments: ["featured"],
      })),
  },
  {
    name: "an https host the target does not admit",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () =>
      linkCase(oneLink(CASE_STUDIES, TARGETS[0], { kind: "external", url: "https://allpointsco.example/kit" }, {
        authority: "internal_or_external",
        allowedSchemes: ["https"],
        allowedExternalHosts: ["allpointsco.aflip.in"],
      })),
  },
  {
    name: "an https URL on an internal-only target",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(CASE_STUDIES, TARGETS[0], { kind: "external", url: "https://allpointsco.aflip.in/kit" })),
  },
  {
    name: "an internal page on an external-only target",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work), { authority: "external_only", allowedSchemes: ["https"] })),
  },
  {
    name: "an email address on a target without mailto",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () =>
      linkCase(oneLink(BROWSE_NETWORKS, TARGETS[0], { kind: "email", address: "hello@allpointsmedia.com" }, {
        authority: "external_only",
        allowedSchemes: ["tel"],
      })),
  },
  {
    name: "a phone number on a target without tel",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () =>
      linkCase(oneLink(BROWSE_NETWORKS, TARGETS[0], { kind: "phone", number: "+15035550100" }, {
        authority: "external_only",
        allowedSchemes: ["mailto"],
      })),
  },
  {
    name: "a new window on a target that admits only the same window",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () => linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work), undefined, "new_window")),
  },
  {
    name: "a label longer than the target's label constraints",
    expected: "MIGRATION_TARGET_CONSTRAINTS",
    build: () =>
      linkCase({ ...navSpec(HEADER_NAV, TARGETS[0]), constraints: { labelConstraints: { maxLength: 5, minLength: 1, newlines: "forbid" } } }),
  },
  {
    name: "a query written as a string rather than a map of names to values",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => declaredAs(CASE_STUDIES, { kind: "internal", pageId: PAGE.work, fragment: null, query: "type=rfp" }),
  },
  {
    name: "an http URL",
    expected: "MIGRATION_DECLARATION_INVALID",
    build: () => declaredAs(CASE_STUDIES, { kind: "external", url: "http://allpointsco.aflip.in/kit" }),
  },
  {
    name: "the source still declared in the candidate",
    expected: "MIGRATION_SOURCE_STILL_DECLARED",
    build: () => headerNav((migration) => {
      declaringList(migration.candidateContract, TARGETS[0]).push(structuredClone(fieldOf(migration.productionContract, HEADER_NAV.label)));
      migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== HEADER_NAV.label);
    }),
  },
  {
    name: "the source removed but not tombstoned",
    expected: "MIGRATION_TOMBSTONES_INCOMPLETE",
    build: () => headerNav((migration) => {
      migration.candidateContract.tombstonedIds = tombstones(migration.candidateContract).filter((id) => id !== HEADER_NAV.label);
    }),
  },
  {
    name: "a source production never declared",
    expected: "MIGRATION_SOURCE_UNKNOWN",
    build: () => headerNav((migration) => { step(migration).source = UNKNOWN_FIELD; }),
  },
  {
    name: "a heading as the source",
    expected: "MIGRATION_LINK_SOURCE_NOT_TEXT",
    build: () => headerNav((migration) => { step(migration).source = HOME_HEADING; }),
  },
  {
    name: "a protected SEO field as the source",
    expected: "MIGRATION_LINK_SOURCE_NOT_TEXT",
    build: () => headerNav((migration) => { step(migration).source = PROTECTED_FIELD; }),
  },
  {
    name: "a code-owned interface label as the source",
    expected: "MIGRATION_LINK_SOURCE_NOT_EDITABLE",
    build: () => linkCase(oneLink(CODE_OWNED_LABEL, TARGETS[0], internal(PAGE.home))),
  },
  {
    name: "a search title as the source",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () => {
      const migration = linkCase(oneLink(HOME_SEO_TITLE, TARGETS[0], internal(PAGE.home)));
      const seo = ((migration.candidateContract.internalSeo as Json).pages as Json[]).find((page) => page.pageId === PAGE.home) as Json;
      const metadata = seo.metadata as Json;
      metadata.title = (metadata.social as Json).title;
      return migration;
    },
  },
  {
    name: "a source whose role is a phone number",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () =>
      onProduction(linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work))), (contract) => {
        const source = sections(contract).flatMap((section) => section.fields as Json[]).find((field) => field.id === CASE_STUDIES);
        if (source !== undefined) source.semantic = "phone";
      }),
  },
  {
    name: "a template source (its tokens would become literal braces in a label)",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () =>
      onProduction(linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work))), (contract, content) => {
        const source = sections(contract).flatMap((section) => section.fields as Json[]).find((field) => field.id === CASE_STUDIES);
        if (source === undefined) return;
        const template = { locale: "en", placeholders: [{ name: "count", minimumIntegerDigits: 1, grouping: false }], plural: null };
        source.constraints = { ...(source.constraints as Json), template };
        const value = values(content).find((entry) => entry.fieldId === CASE_STUDIES);
        if (value !== undefined) value.value = "{count} case studies";
      }),
  },
  {
    name: "an attribute source (a screen-reader label is not a link's visible label)",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () =>
      onProduction(linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work))), (contract) => {
        const source = sections(contract).flatMap((section) => section.fields as Json[]).find((field) => field.id === CASE_STUDIES);
        if (source === undefined) return;
        source.semantic = "label";
        source.constraints = { minLength: 1, maxLength: 512, newlines: "forbid", attribute: "aria-label" };
      }),
  },
  {
    name: "an aliased source",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      migration.productionContract.atomicAliasGroups = [{ id: `alias_${"1".repeat(25)}0`, fieldIds: [CASE_STUDIES, SECONDARY_CTA] }];
      refreshFrom(migration);
      return migration;
    },
  },
  {
    name: "a source a uniqueness rule reads",
    expected: "MIGRATION_LINK_SOURCE_REFERENCED",
    build: () => {
      const migration = linkCase(navSpec(HEADER_NAV, TARGETS[0]));
      const collection = collections(migration.productionContract).find((entry) => entry.id === HEADER_NAV.collection) as Json;
      collection.uniqueness = [{ fieldIds: [HEADER_NAV.label], comparison: "case_folded" }];
      refreshFrom(migration);
      return migration;
    },
  },
  {
    name: "a target production already declares",
    expected: "MIGRATION_TARGET_EXISTS",
    build: () => headerNav((migration) => { step(migration).target = FOOTER_NAV.label; }),
  },
  {
    name: "a target production tombstoned",
    expected: "MIGRATION_TARGET_TOMBSTONED",
    build: () => headerNav((migration) => { step(migration).target = PRODUCTION_TOMBSTONE; }),
  },
  {
    name: "a target the candidate does not declare",
    expected: "MIGRATION_TARGET_UNDECLARED",
    build: () => headerNav((migration) => { step(migration).target = TARGETS[7]; }),
  },
  {
    name: "a target that is plain text",
    expected: "MIGRATION_TARGET_TYPE_MISMATCH",
    build: () => headerNav((migration) => {
      const target = fieldOf(migration.candidateContract, TARGETS[0]);
      Object.assign(target, { type: "plain_text", semantic: "label", capabilities: ["text.edit"], constraints: { maxLength: 160, minLength: 1, newlines: "forbid" } });
      for (const value of targetValues(migration, TARGETS[0])) Object.assign(value, { type: "plain_text", value: (value.value as Json).label });
    }),
  },
  {
    name: "a code-owned link target",
    expected: "MIGRATION_TARGET_NOT_EDITABLE",
    build: () => headerNav((migration) => {
      Object.assign(fieldOf(migration.candidateContract, TARGETS[0]), { classification: "code_owned_interface", capabilities: [] });
    }),
  },
  {
    name: "a page field's target in another section",
    expected: "MIGRATION_LINK_PLACE_CHANGED",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      const list = declaringList(migration.candidateContract, TARGETS[0]);
      const target = list.splice(list.findIndex((field) => field.id === TARGETS[0]), 1)[0];
      declaringList(migration.candidateContract, BROWSE_NETWORKS).push(target);
      return migration;
    },
  },
  {
    name: "an item field's target in another collection",
    expected: "MIGRATION_LINK_PLACE_CHANGED",
    build: () => {
      const migration = linkCase(navSpec(LEGAL_NAV, TARGETS[0]));
      const legal = declaringList(migration.candidateContract, TARGETS[0]);
      const [target] = legal.splice(0, 1, { ...structuredClone(fieldOf(migration.productionContract, LEGAL_NAV.label)), id: TARGETS[7] });
      declaringList(migration.candidateContract, FOOTER_NAV.label).push(target);
      for (const [itemId] of LEGAL_NAV.items) {
        values(migration.candidateContent).push({ ...itemValue(migration.productionContent, LEGAL_NAV.label, itemId), fieldId: TARGETS[7] });
      }
      return migration;
    },
  },
  {
    name: "a page field's target scoped to the site",
    expected: "MIGRATION_SCOPE_MISMATCH",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      fieldOf(migration.candidateContract, TARGETS[0]).scope = "site";
      targetValues(migration, TARGETS[0])[0].owner = { kind: "site" };
      return migration;
    },
  },
  {
    name: "the same source in two link steps",
    expected: "MIGRATION_SOURCE_CLAIMED_TWICE",
    build: () => headerNav((migration) => {
      (migration.declaration.steps as Json[]).push({ ...step(migration), target: TARGETS[1] });
    }),
  },
  {
    name: "the same target in two link steps",
    expected: "MIGRATION_TARGET_CLAIMED_TWICE",
    build: () => {
      const migration = linkCase(navSpec(HEADER_NAV, TARGETS[0]), navSpec(FOOTER_NAV, TARGETS[1]));
      step(migration, 1).target = TARGETS[0];
      return migration;
    },
  },
  {
    name: "a source both linked and retired",
    expected: "MIGRATION_SOURCE_CLAIMED_TWICE",
    build: () => {
      const migration = linkCase(oneLink(CASE_STUDIES, TARGETS[0], internal(PAGE.work)));
      (migration.declaration.steps as Json[]).unshift({ op: "retire", fields: [CASE_STUDIES] });
      return migration;
    },
  },
  {
    name: "an op this version does not prove",
    expected: "MIGRATION_TRANSFORM_DEFERRED",
    build: () => headerNav((migration) => { (migration.declaration.steps as Json[]).push({ op: "split", source: HEADER_NAV.label }); }),
  },
];

describe("field migration: link", () => {
  for (const row of [...ACCEPTED_ROWS, ...REFUSED_ROWS, ...QUERY_ACCEPTED_ROWS, ...QUERY_REFUSED_ROWS]) {
    it(`${row.expected}: ${row.name}`, () => {
      assert.equal(outcome(row.build()), row.expected);
    });
  }

  it("parses a link step and refuses an unknown key on a link", () => {
    const migration = linkCase(navSpec(LEGAL_NAV, TARGETS[0]));
    assert.equal(parseManagedSiteFieldMigrationV1(migration.declaration).steps[0].op, "link");
    links(migration)[0].rel = "nofollow";
    assert.equal(outcome(migration), "MIGRATION_DECLARATION_INVALID");
  });

  it("proves the header nav: one owner per item in declared order, every destination listed, every source value consumed", () => {
    const proof = verify(linkCase(navSpec(HEADER_NAV, TARGETS[0])));
    assert.deepEqual(proof.steps, [
      {
        op: "link",
        source: HEADER_NAV.label,
        target: TARGETS[0],
        owners: HEADER_NAV.items.map(([itemId]) => ({ kind: "collection_item", collectionId: HEADER_NAV.collection, itemId })),
      },
    ]);
    assert.deepEqual(
      proof.added.filter((item) => item.kind === "link_field").map((item) => item.kind === "link_field" && item.destination),
      HEADER_NAV.items.map(([, pageId]) => internal(pageId)),
    );
    assert.equal(proof.accounting.consumed, HEADER_NAV.items.length);
    assert.equal(proof.accounting.targets, HEADER_NAV.items.length);
    assert.equal(proof.accounting.productionValues - proof.accounting.consumed, proof.accounting.unchanged);
    assert.deepEqual(proof.additions, { stableIds: [], contentValues: [], assetManifestEntries: 0 });
  });

  it("writes the declared query on the link, and its href is the one the code wrote", () => {
    const migration = linkCase(oneLink(PRIMARY_CTA, TARGETS[0], contactWith({ type: "strategy" }), CONTACT_QUERIES));
    const proof = verify(migration);
    const added = proof.added.filter((item) => item.kind === "link_field").map((item) => item.kind === "link_field" && item.destination);
    assert.deepEqual(added, [contactWith({ type: "strategy" })]);
    const value = targetValues(migration, TARGETS[0])[0].value as Json;
    const href = managedRichTextLinkAttributesV1(
      value as unknown as Parameters<typeof managedRichTextLinkAttributesV1>[0],
      (pageId) => (pageId === PAGE.contact ? "/contact" : "/elsewhere"),
    ).href;
    assert.equal(href, "/contact?type=strategy");
  });

  it("keeps a customer's edited label byte for byte, and a page field's owner is its own", () => {
    const proof = verify(linkCase(oneLink(BROWSE_NETWORKS, TARGETS[0], internal(PAGE.networks))));
    assert.deepEqual(proof.steps[0], { op: "link", source: BROWSE_NETWORKS, target: TARGETS[0], owners: [{ kind: "site" }] });
    const primary = linkCase(oneLink(PRIMARY_CTA, TARGETS[0], internal(PAGE.home)));
    assert.equal((targetValues(primary, TARGETS[0])[0].value as Json).label, "Get Started");
    assert.equal(outcome(primary), ACCEPTED);
  });
});

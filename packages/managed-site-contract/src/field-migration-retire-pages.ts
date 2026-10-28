import type { ManagedContentOwner, ManagedSiteContentDocument } from "./content.js";
import { requiredOwner } from "./content-semantics-facts.js";
import { collectManagedContractCompatibilityFacts } from "./contract-compatibility-facts.js";
import { collectManagedSiteContractOccurrences } from "./contract-occurrence-registry.js";
import type { ManagedPageDescriptor, ManagedSiteContractV1 } from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { claimOnce, managedSiteFieldMigrationAliasedIds } from "./field-migration-claims.js";
import type { ManagedSiteFieldMigrationV1 } from "./field-migration-schema.js";
import type { ManagedCollectionItemField, ManagedFieldDescriptor } from "./fields.js";
import type { ManagedInternalProtectedField } from "./seo.js";

/**
 * A page a retire removes (0.30.0), derived from production: the page, its
 * sections, every field it declares and every protected field only it renders
 * (its own search title, description, canonical and indexing slots, which are
 * code's and go with it), and every field that stays but rendered on it too,
 * whose usage on the page is dropped.
 */
export interface ManagedSiteFieldMigrationRetiredPageV1 {
  readonly page: ManagedPageDescriptor;
  readonly sections: readonly string[];
  readonly fields: readonly {
    readonly field: ManagedFieldDescriptor;
    readonly owner: ManagedContentOwner;
    readonly sectionId: string;
  }[];
  readonly protectedFields: readonly {
    readonly field: ManagedInternalProtectedField;
    readonly owner: ManagedContentOwner;
  }[];
  /** Fields that stay, each of which rendered on the page as well as elsewhere. */
  readonly unrendered: readonly string[];
}

/** Production with every retired page removed: what the rest of the migration is judged against. */
export interface ManagedSiteFieldMigrationPageProjectionV1 {
  readonly contract: ManagedSiteContractV1;
  readonly content: ManagedSiteContentDocument;
  /** How many production values went with the retired pages. */
  readonly consumed: number;
}

type RetireStep = Extract<ManagedSiteFieldMigrationV1["steps"][number], { readonly op: "retire" }>;
type UsedField = ManagedFieldDescriptor | ManagedInternalProtectedField;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

/** A retire step that names pages: it names nothing else (the schema refuses a mix). */
export function isManagedSiteFieldMigrationPageRetire(
  step: ManagedSiteFieldMigrationV1["steps"][number],
): step is RetireStep & { readonly pages: readonly string[] } {
  return step.op === "retire" && step.pages !== undefined;
}

function renderedOnlyOn(field: UsedField, pageId: string): boolean {
  return field.usages.every((usage) => usage.pageId === pageId);
}

/**
 * A protected field the page takes with it: page-scoped and rendered only on
 * it (its own search title, description, canonical and indexing). A
 * site-scoped protected field that happens to render only on the page is the
 * site's, not the page's: it is left stranded, and refused like any field
 * declared elsewhere that only the page renders.
 */
function isOwnSearchSlot(field: ManagedInternalProtectedField, pageId: string): boolean {
  return field.scope === "page" && renderedOnlyOn(field, pageId);
}

function renderedOn(field: UsedField, pageId: string): boolean {
  return field.usages.some((usage) => usage.pageId === pageId);
}

function everyRenderedField(contract: ManagedSiteContractV1): readonly ManagedFieldDescriptor[] {
  return contract.pages.flatMap((page) => page.sections.flatMap((section) => section.fields));
}

function everyUsedField(contract: ManagedSiteContractV1): readonly UsedField[] {
  return [...everyRenderedField(contract), ...contract.internalSeo.protectedFields];
}

/**
 * A field the page declares goes with it, whatever its classification: a
 * customer's content in it is Site Guard's to judge. It must render on this
 * page alone, or retiring the page would remove text another page shows. A
 * list placement, an image (asset material) and an aliased field are shapes
 * this version does not prove: retire the list first, or defer.
 */
/**
 * The field types this version proves a page can take with it. An allowlist,
 * so a type added later is deferred until it is proven here (and in the
 * platform's ledger, which holds the same list).
 */
const RETIRABLE_PAGE_FIELD_TYPES: ReadonlySet<string> = new Set(["plain_text", "heading_text", "rich_text", "link", "icon", "toggle"]);

function pageField(
  aliased: ReadonlySet<string>,
  pageId: string,
  field: ManagedFieldDescriptor,
): ManagedFieldDescriptor {
  if (!RETIRABLE_PAGE_FIELD_TYPES.has(field.type) || aliased.has(field.id)) {
    fail(
      "MIGRATION_TRANSFORM_DEFERRED",
      `A page holding a list, an image, a field of a type not proven retirable or an aliased field cannot be retired yet: ${field.id}`,
    );
  }
  if (!renderedOnlyOn(field, pageId)) {
    fail("MIGRATION_RETIRE_REFERENCED", `Retired page ${pageId} declares ${field.id}, which another page renders`);
  }
  return field;
}

/**
 * A field that stays must still render somewhere: one declared elsewhere that
 * only this page rendered would be left with no usage, so it is refused
 * (retire it first, by name).
 */
function assertKeptFieldsStillRender(contract: ManagedSiteContractV1, pageId: string, removed: ReadonlySet<string>): void {
  const stranded = everyUsedField(contract).find(
    (field) => !removed.has(field.id) && field.usages.length > 0 && renderedOnlyOn(field, pageId),
  );
  if (stranded !== undefined) {
    fail("MIGRATION_RETIRE_REFERENCED", `${stranded.id} renders only on retired page ${pageId} but is declared elsewhere`);
  }
}

function resolvePage(
  contract: ManagedSiteContractV1,
  aliased: ReadonlySet<string>,
  pageId: string,
): ManagedSiteFieldMigrationRetiredPageV1 {
  const page = contract.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) return fail("MIGRATION_RETIRE_UNKNOWN", `Production does not declare page ${pageId}`);
  if (page.route.kind !== "static") {
    fail("MIGRATION_TRANSFORM_DEFERRED", `A generated page cannot be retired yet: ${pageId}`);
  }
  const fields = page.sections.flatMap((section) =>
    section.fields.map((field) => ({
      field: pageField(aliased, pageId, field),
      owner: requiredOwner(field),
      sectionId: section.id,
    })),
  );
  const protectedFields = contract.internalSeo.protectedFields
    .filter((field) => isOwnSearchSlot(field, pageId))
    .map((field) => {
      if (aliased.has(field.id)) {
        fail("MIGRATION_TRANSFORM_DEFERRED", `A page whose search slot is aliased cannot be retired yet: ${field.id}`);
      }
      return { field, owner: requiredOwner(field) };
    });
  const removed = new Set<string>([
    ...fields.map(({ field }) => field.id),
    ...protectedFields.map(({ field }) => field.id),
  ]);
  assertKeptFieldsStillRender(contract, pageId, removed);
  const unrendered = everyUsedField(contract)
    .filter((field) => !removed.has(field.id) && renderedOn(field, pageId))
    .map((field) => field.id);
  return { page, sections: page.sections.map((section) => section.id), fields, protectedFields, unrendered };
}

/** Every id a retired page takes with it: the page, its sections and its fields. */
export function managedSiteFieldMigrationRetiredPageIds(
  retired: ManagedSiteFieldMigrationRetiredPageV1,
): readonly string[] {
  return [
    retired.page.id,
    ...retired.sections,
    ...retired.fields.map(({ field }) => field.id),
    ...retired.protectedFields.map(({ field }) => field.id),
  ];
}

/**
 * Where a retired page's own declarations sit in production: the page, its
 * search entry and each protected field only it renders. An occurrence inside
 * one goes with the page.
 */
function ownContainers(contract: ManagedSiteContractV1, retired: readonly ManagedSiteFieldMigrationRetiredPageV1[]): readonly string[] {
  const pages = new Set(retired.map(({ page }) => page.id));
  const protectedIds = new Set(retired.flatMap(({ protectedFields }) => protectedFields.map(({ field }) => field.id)));
  return [
    ...contract.pages.flatMap((page, index) => (pages.has(page.id) ? [`pages[${index}]`] : [])),
    ...contract.internalSeo.pages.flatMap((entry, index) => (pages.has(entry.pageId) ? [`internalSeo.pages[${index}]`] : [])),
    ...contract.internalSeo.protectedFields.flatMap((field, index) =>
      protectedIds.has(field.id) ? [`internalSeo.protectedFields[${index}]`] : []),
  ];
}

/** A field's record that it renders on a page: dropped with the page, not a reference to it. */
const USAGE_PAGE = /\.usages\[\d+\]\.pageId$/u;
/** A link field's query allowlist entry for a page (0.41.0): dropped with the page too. */
const QUERY_PAGE = /\.constraints\.allowedQueries\[\d+\]\.pageId$/u;

const NOT_A_REFERENCE: ReadonlySet<string> = new Set(["declaration", "tombstone"]);

/**
 * Nothing that stays names a retired page or anything it took: no link,
 * breadcrumb, required internal link, redirect, search slot, outline, JSON-LD
 * source or business identity in the contract, read through the occurrence
 * registry (a deferred occurrence counts as a reference, so an unclassified
 * use refuses rather than dangles); and no production value that stays, read
 * structurally over every value (an internal link, a rich-text link mark, an
 * item link since 0.25.0, a menu entry), nor spells its URL (its path, or an
 * absolute URL on the site's own origin: another page's canonical, a link
 * typed as external to the site itself).
 */
function assertUnreferenced(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  retired: readonly ManagedSiteFieldMigrationRetiredPageV1[],
): void {
  const removed = new Set(retired.flatMap(managedSiteFieldMigrationRetiredPageIds));
  const pages = new Set<string>(retired.map(({ page }) => page.id));
  const containers = ownContainers(contract, retired);
  const reference = collectManagedSiteContractOccurrences(contract).find(
    (occurrence) =>
      removed.has(occurrence.id) &&
      !NOT_A_REFERENCE.has(occurrence.role) &&
      !containers.some((container) => occurrence.location.startsWith(`${container}.`)) &&
      !(pages.has(occurrence.id) && (USAGE_PAGE.test(occurrence.location) || QUERY_PAGE.test(occurrence.location))),
  );
  if (reference !== undefined) {
    fail("MIGRATION_RETIRE_REFERENCED", `Retired ${reference.id} is referenced at ${reference.location}`);
  }
  const naming = content.values.find(
    (value) => !removed.has(value.fieldId) && (namesAny(value.value, removed) || namesAny(value.owner, removed)),
  );
  if (naming !== undefined) {
    fail("MIGRATION_RETIRE_REFERENCED", `A retired page is referenced by the value of ${naming.fieldId}`);
  }
  const paths = new Set(retired.flatMap(({ page }) => (page.route.kind === "static" ? [withoutTrailingSlash(page.route.path)] : [])));
  const origins = siteOrigins(contract, content);
  const linking = content.values.find((value) => !removed.has(value.fieldId) && spellsAnyPath(value.value, paths, origins));
  if (linking !== undefined) {
    fail("MIGRATION_RETIRE_REFERENCED", `A retired page's URL is spelled by the value of ${linking.fieldId}`);
  }
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** The origins the site's own canonicals name: where a URL to one of its pages points. */
function siteOrigins(contract: ManagedSiteContractV1, content: ManagedSiteContentDocument): ReadonlySet<string> {
  const canonicals = new Set<string>(
    [...contract.internalSeo.pages, ...contract.internalSeo.generatedPages].map((entry) => entry.metadata.canonical),
  );
  return new Set(content.values.flatMap((value) => {
    if (!canonicals.has(value.fieldId) || typeof value.value !== "string" || !URL.canParse(value.value)) return [];
    return [new URL(value.value).origin];
  }));
}

/**
 * Whether a string spells a retired page's URL: its path exactly, or an
 * absolute URL on one of the site's own origins whose path is it (a
 * canonical, a share URL, an external link to the site itself).
 */
function spellsPath(text: string, paths: ReadonlySet<string>, origins: ReadonlySet<string>): boolean {
  if (paths.has(withoutTrailingSlash(text))) return true;
  if (!URL.canParse(text)) return false;
  const url = new URL(text);
  return origins.has(url.origin) && paths.has(withoutTrailingSlash(url.pathname));
}

function spellsAnyPath(value: unknown, paths: ReadonlySet<string>, origins: ReadonlySet<string>): boolean {
  if (typeof value === "string") return spellsPath(value, paths, origins);
  if (Array.isArray(value)) return value.some((entry) => spellsAnyPath(entry, paths, origins));
  if (value !== null && typeof value === "object") {
    return Object.values(value).some((entry) => spellsAnyPath(entry, paths, origins));
  }
  return false;
}

function namesAny(value: unknown, ids: ReadonlySet<string>): boolean {
  if (typeof value === "string") return ids.has(value);
  if (Array.isArray(value)) return value.some((entry) => namesAny(entry, ids));
  if (value !== null && typeof value === "object") return Object.values(value).some((entry) => namesAny(entry, ids));
  return false;
}

/**
 * The identity rules of every page a declaration retires, judged against
 * production alone, before the candidate is read: each page is named once
 * across all steps, and nothing that stays names any of it. Whether a
 * customer holds content on it is Site Guard's to judge.
 */
export function resolveManagedSiteFieldMigrationPageRetiresV1(
  productionContract: ManagedSiteContractV1,
  productionContent: ManagedSiteContentDocument,
  declaration: ManagedSiteFieldMigrationV1,
): readonly (readonly ManagedSiteFieldMigrationRetiredPageV1[])[] {
  const aliased = managedSiteFieldMigrationAliasedIds(collectManagedContractCompatibilityFacts(productionContract));
  const claimed = new Set<string>();
  const steps = declaration.steps.filter(isManagedSiteFieldMigrationPageRetire).map((step) =>
    step.pages.map((pageId) => {
      claimOnce(claimed, pageId, "MIGRATION_RETIRE_CLAIMED_TWICE");
      return resolvePage(productionContract, aliased, pageId);
    }),
  );
  const retired = steps.flat();
  assertUnreferenced(productionContract, productionContent, retired);
  return steps;
}

/**
 * Every id the retired pages carried is gone from the candidate and
 * tombstoned, so none can be declared again with another meaning.
 */
export function assertManagedSiteFieldMigrationPagesRemovedV1(
  candidateContract: ManagedSiteContractV1,
  retired: readonly ManagedSiteFieldMigrationRetiredPageV1[],
): void {
  const candidate = collectManagedContractCompatibilityFacts(candidateContract);
  for (const id of retired.flatMap(managedSiteFieldMigrationRetiredPageIds)) {
    if (candidate.declarations.has(id)) fail("MIGRATION_RETIRE_STILL_DECLARED", `Candidate still declares retired ${id}`);
    if (!candidate.tombstones.has(id)) fail("MIGRATION_TOMBSTONES_INCOMPLETE", `Candidate does not tombstone retired ${id}`);
  }
}

function withoutUsagesOn<T extends UsedField>(field: T, pages: ReadonlySet<string>): T {
  if (!field.usages.some((usage) => pages.has(usage.pageId))) return field;
  return { ...field, usages: field.usages.filter((usage) => !pages.has(usage.pageId)) };
}

/**
 * A link field's query allowlist (0.41.0) less its entries for the retired
 * pages: an entry admits a query on a page, and a page that is gone has no
 * destination to admit one on, so the entry goes with it rather than holding
 * the page in place. A value still linking there is refused on its own.
 */
function withoutQueriesOn<T extends ManagedFieldDescriptor | ManagedCollectionItemField>(
  field: T,
  pages: ReadonlySet<string>,
): T {
  if (field.type !== "link") return field;
  const queries = field.constraints.allowedQueries;
  if (queries === undefined || !queries.some((entry) => pages.has(entry.pageId))) return field;
  const allowedQueries = queries.filter((entry) => !pages.has(entry.pageId));
  return { ...field, constraints: { ...field.constraints, allowedQueries } } as T;
}

/**
 * Production as it reads once the pages are gone: each page, its search entry
 * and its protected fields undeclared and tombstoned, every usage on it
 * dropped, every value on a field it took removed. Everything else is
 * production byte for byte, so the ordinary rules then hold the candidate to
 * all of it exactly as they would without the retire.
 */
export function projectManagedSiteFieldMigrationPageRetiresV1(
  contract: ManagedSiteContractV1,
  content: ManagedSiteContentDocument,
  retired: readonly ManagedSiteFieldMigrationRetiredPageV1[],
): ManagedSiteFieldMigrationPageProjectionV1 {
  if (retired.length === 0) return { contract, content, consumed: 0 };
  const pages = new Set(retired.map(({ page }) => page.id));
  const removed = new Set(retired.flatMap(managedSiteFieldMigrationRetiredPageIds));
  const projected: ManagedSiteContractV1 = {
    ...contract,
    pages: contract.pages
      .filter((page) => !pages.has(page.id))
      .map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) => withoutQueriesOn(withoutUsagesOn(field, pages), pages)),
        })),
      })),
    collections: contract.collections.map((collection) => ({
      ...collection,
      itemFields: collection.itemFields.map((field) => withoutQueriesOn(field, pages)),
    })),
    internalSeo: {
      ...contract.internalSeo,
      protectedFields: contract.internalSeo.protectedFields
        .filter((field) => !removed.has(field.id))
        .map((field) => withoutUsagesOn(field, pages)),
      pages: contract.internalSeo.pages.filter((entry) => !pages.has(entry.pageId)),
    },
    tombstonedIds: [...contract.tombstonedIds, ...([...removed] as typeof contract.tombstonedIds[number][])],
  };
  const values = content.values.filter((value) => !removed.has(value.fieldId));
  return { contract: projected, content: { ...content, values }, consumed: content.values.length - values.length };
}

/**
 * What the named pages take without being named, read from production alone
 * through the same derivation the verifier claims them by: each page's
 * sections, fields and the protected fields only it renders. A page
 * production does not declare carries nothing here; the verifier refuses it.
 */
export function managedSiteFieldMigrationPageCarriedIds(
  contract: ManagedSiteContractV1,
  declaration: ManagedSiteFieldMigrationV1,
): readonly string[] {
  const named = new Set<string>(declaration.steps.flatMap((step) => (isManagedSiteFieldMigrationPageRetire(step) ? step.pages : [])));
  return contract.pages
    .filter((page) => named.has(page.id))
    .flatMap((page) => [
      ...page.sections.map((section) => section.id),
      ...page.sections.flatMap((section) => section.fields.map((field) => field.id)),
      ...contract.internalSeo.protectedFields.filter((field) => isOwnSearchSlot(field, page.id)).map((field) => field.id),
    ]);
}

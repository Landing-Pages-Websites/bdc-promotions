import type { ManagedContentOwner } from "./content.js";
import type { ManagedSiteFieldMigrationBridgeStepV1 } from "./field-migration-bridge.js";
import type { ManagedSiteFieldMigrationResolvedLinkV1 } from "./field-migration-link.js";
import type {
  ManagedSiteFieldMigrationResolvedImageMetadataV1,
  ManagedSiteFieldMigrationResolvedImageV1,
} from "./field-migration-image-metadata.js";
import type { ManagedSiteFieldMigrationResolvedRescopeV1 } from "./field-migration-rescope.js";
import type {
  ManagedSiteFieldMigrationResolvedRetireV1,
  ManagedSiteFieldMigrationRetiredFieldV1,
} from "./field-migration-retire.js";
import type { ManagedSiteFieldMigrationRetiredPageV1 } from "./field-migration-retire-pages.js";
import type { ManagedSiteFieldMigrationSeoRepointV1 } from "./field-migration-retire-references.js";
import type {
  ManagedSiteFieldMigrationBlockV1,
  ManagedSiteFieldMigrationLinkStepV1,
  ManagedSiteFieldMigrationMarkV1,
  ManagedSiteFieldMigrationRetireStepV1,
  ManagedSiteFieldMigrationStepV1,
} from "./field-migration-schema.js";
import type { ManagedSiteFieldMigrationMoveV1 } from "./field-migration-position.js";
import type { ManagedSiteFieldMigrationOutlineEntryV1 } from "./field-migration-references.js";
import type {
  ManagedSiteFieldMigrationH1AdoptionV1,
  ManagedSiteFieldMigrationSeoReorderV1,
} from "./field-migration-urls.js";
import {
  managedSiteFieldMigrationRole,
  type ManagedSiteFieldMigrationResolvedStepV1,
} from "./field-migration-steps.js";
import type { ManagedSiteFieldMigrationOffsetV1 } from "./field-migration-transform.js";
import type { ManagedLinkDestination, ManagedLinkTarget } from "./values.js";

/**
 * Material a migration adds that no production value held: it comes from the
 * declaration, which is to say from code. It is allowed, and every item is
 * listed so a reviewer sees each one.
 */
export type ManagedSiteFieldMigrationAddedItemV1 =
  | {
      readonly kind: "literal";
      readonly target: string;
      readonly part: number;
      readonly text: string;
    }
  | {
      readonly kind: "mark";
      readonly target: string;
      readonly part: number;
      readonly mark: "italic" | "bold";
    }
  | {
      /**
       * A `hard_break` the declaration put before this part: structure code
       * chose, between two lines of the target's block.
       */
      readonly kind: "hard_break";
      readonly target: string;
      readonly part: number;
    }
  | {
      /**
       * One value a `link` step writes: the source's text, unchanged, now the
       * label of a link to `destination` opening in `linkTarget`. The
       * destination is code's, so each one is listed for a reviewer.
       */
      readonly kind: "link_field";
      readonly target: string;
      readonly source: string;
      readonly owner: ManagedContentOwner;
      readonly destination: ManagedLinkDestination;
      readonly linkTarget: ManagedLinkTarget;
    }
  | {
      readonly kind: "link";
      readonly target: string;
      readonly part: number;
      readonly destination: ManagedLinkDestination;
      readonly linkTarget: ManagedLinkTarget;
    }
  | {
      /**
       * The block the target renders, which code chose, and what each source
       * meant to a reader (`heading:2`, `label`, `body`, `rich_text`), so a
       * reviewer can tell a label made a heading from body text.
       */
      readonly kind: "block";
      readonly target: string;
      readonly block: ManagedSiteFieldMigrationBlockV1 | { readonly type: "plain_text" };
      readonly targetRole: string;
      readonly sources: readonly { readonly fieldId: string; readonly role: string }[];
    }
  | {
      /**
       * A plain-text target whose role differs from a source's: running text
       * relabelled (`body` made `label`, say). Allowed, and named here, since
       * a later change may treat the new role differently.
       */
      readonly kind: "role";
      readonly target: string;
      readonly from: readonly string[];
      readonly to: string;
    }
  | {
      /**
       * A field a rescope step moved to site scope (0.40.0), with every usage
       * the candidate adds (a page, or an item of a generated page): code's
       * choice, listed for a reviewer.
       */
      readonly kind: "rescope";
      readonly field: string;
      readonly addedUsages: readonly { readonly pageId: string; readonly itemId: string | null }[];
    }
  | ManagedSiteFieldMigrationMoveV1
  | ManagedSiteFieldMigrationOutlineEntryV1
  | ManagedSiteFieldMigrationSeoRepointV1
  | ManagedSiteFieldMigrationSeoReorderV1
  | ManagedSiteFieldMigrationH1AdoptionV1
  | {
      /**
       * The step's sources were not side by side in production's order: it
       * joins them in another order, or production declared other fields
       * between them, which now read before or after the whole target.
       */
      readonly kind: "reordered";
      readonly target: string;
      readonly declared: readonly string[];
      readonly production: readonly string[];
      readonly interleaved: readonly string[];
    };

export type ManagedSiteFieldMigrationPartProofV1 =
  | ({ readonly kind: "source"; readonly fieldId: string } & ManagedSiteFieldMigrationOffsetV1)
  | ({ readonly kind: "literal"; readonly text: string } & ManagedSiteFieldMigrationOffsetV1);

export interface ManagedSiteFieldMigrationMergeStepProofV1 {
  readonly op: ManagedSiteFieldMigrationStepV1["op"];
  readonly target: string;
  readonly owner: ManagedContentOwner;
  readonly sources: readonly { readonly fieldId: string; readonly owner: ManagedContentOwner }[];
  readonly parts: readonly ManagedSiteFieldMigrationPartProofV1[];
}

/** A page field a retire removed, with the owner its value had and where production declared it. */
export interface ManagedSiteFieldMigrationRetiredFieldProofV1 {
  readonly fieldId: string;
  readonly owner: ManagedContentOwner;
  readonly pageId: string;
  readonly sectionId: string;
}

/**
 * A collection a retire removed (0.29.0), in declaration order: the page
 * fields that placed it and its item fields, each in production's order, and
 * its items. Every value its items held went with it.
 */
export interface ManagedSiteFieldMigrationRetiredCollectionProofV1 {
  readonly collectionId: string;
  readonly fields: readonly ManagedSiteFieldMigrationRetiredFieldProofV1[];
  readonly itemFields: readonly string[];
  /** Every item it held in production, sorted; the candidate tombstones each. */
  readonly items: readonly string[];
}

/**
 * A static page a retire removed (0.30.0), in declaration order, derived from
 * production: its sections and every field it declared (each in production's
 * order, with the owner its value had), every protected field only it
 * rendered (its own search slots), and every field that stays whose usage on
 * the page was dropped. Every value on a removed field went with it.
 */
export interface ManagedSiteFieldMigrationRetiredPageProofV1 {
  readonly pageId: string;
  readonly path: string;
  readonly sections: readonly string[];
  readonly fields: readonly ManagedSiteFieldMigrationRetiredFieldProofV1[];
  readonly protectedFields: readonly { readonly fieldId: string; readonly owner: ManagedContentOwner }[];
  readonly unrendered: readonly string[];
}

/**
 * What a retire step removed: each field it names, each section it emptied
 * and removed, and, only when the step names any, each collection or page. A
 * step naming pages names nothing else, so its `fields` and `sections` are
 * empty and everything it removed is under `pages`.
 */
export interface ManagedSiteFieldMigrationRetireStepProofV1 {
  readonly op: ManagedSiteFieldMigrationRetireStepV1["op"];
  readonly fields: readonly ManagedSiteFieldMigrationRetiredFieldProofV1[];
  readonly sections: readonly { readonly sectionId: string; readonly pageId: string }[];
  readonly collections?: readonly ManagedSiteFieldMigrationRetiredCollectionProofV1[];
  readonly pages?: readonly ManagedSiteFieldMigrationRetiredPageProofV1[];
}

/**
 * What a link step consumed and wrote: its source and target, and the owner
 * of each value, in the order the declaration's links name them.
 */
export interface ManagedSiteFieldMigrationLinkStepProofV1 {
  readonly op: ManagedSiteFieldMigrationLinkStepV1["op"];
  readonly source: string;
  readonly target: string;
  readonly owners: readonly ManagedContentOwner[];
}

/**
 * What a rescope step moved (0.40.0): one field's value, unchanged, from its
 * page's owner to the site's.
 */
export interface ManagedSiteFieldMigrationRescopeStepProofV1 {
  readonly op: "rescope";
  readonly field: string;
  readonly from: ManagedContentOwner;
  readonly to: ManagedContentOwner;
}

/**
 * What an image-metadata step corrected (0.42.0): for each file, its digest,
 * the metadata production stated and the metadata its bytes derive, and every
 * value (field and owner) and manifest slot that named it. The values are
 * what the platform asks about work in flight before admitting the change.
 */
export interface ManagedSiteFieldMigrationImageMetadataStepProofV1 {
  readonly op: "image-metadata";
  readonly images: readonly ManagedSiteFieldMigrationResolvedImageV1[];
}

/** A step's proof, at the step's own position in the declaration. */
export type ManagedSiteFieldMigrationStepProofV1 =
  | ManagedSiteFieldMigrationMergeStepProofV1
  | ManagedSiteFieldMigrationRetireStepProofV1
  | ManagedSiteFieldMigrationLinkStepProofV1
  | ManagedSiteFieldMigrationRescopeStepProofV1
  | ManagedSiteFieldMigrationImageMetadataStepProofV1;

/**
 * Production values are unchanged or consumed (by a merge, or removed with a
 * retired field); candidate values are unchanged,
 * a step's target, or an addition listed in `additions`. Both sums hold.
 */
export interface ManagedSiteFieldMigrationAccountingV1 {
  readonly productionValues: number;
  readonly unchanged: number;
  readonly consumed: number;
  readonly candidateValues: number;
  readonly targets: number;
  readonly added: number;
}

/** What the candidate adds beyond the migration, from the diff itself. */
export interface ManagedSiteFieldMigrationAdditionsV1 {
  readonly stableIds: readonly string[];
  readonly contentValues: readonly { readonly fieldId: string; readonly owner: ManagedContentOwner }[];
  readonly assetManifestEntries: number;
}

export interface ManagedSiteFieldMigrationProofV1 {
  readonly kind: "migrated";
  readonly declarationSha256: string;
  readonly bridge: ManagedSiteFieldMigrationBridgeStepV1 | null;
  readonly accounting: ManagedSiteFieldMigrationAccountingV1;
  readonly steps: readonly ManagedSiteFieldMigrationStepProofV1[];
  /**
   * Material the declaration adds to its targets (literals, marks, links,
   * blocks), and every search slot a retire falls back to its protected echo.
   */
  readonly added: readonly ManagedSiteFieldMigrationAddedItemV1[];
  /** Declarations, values and asset material the candidate adds outside any step. */
  readonly additions: ManagedSiteFieldMigrationAdditionsV1;
}

function markItem(
  target: string,
  part: number,
  mark: ManagedSiteFieldMigrationMarkV1,
): ManagedSiteFieldMigrationAddedItemV1 {
  if (mark.type === "link") {
    return { kind: "link", target, part, destination: mark.destination, linkTarget: mark.target };
  }
  return { kind: "mark", target, part, mark: mark.type };
}

function roleItem(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
): readonly ManagedSiteFieldMigrationAddedItemV1[] {
  if (resolved.target.type !== "plain_text") return [];
  const to = managedSiteFieldMigrationRole(resolved.target);
  const from = [...new Set(resolved.sources.map(managedSiteFieldMigrationRole))].sort();
  if (from.every((role) => role === to)) return [];
  return [{ kind: "role", target: resolved.step.target, from, to }];
}

function reorderedItem(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
): readonly ManagedSiteFieldMigrationAddedItemV1[] {
  const declared = resolved.sources.map((source) => source.id);
  const { productionOrder: production, interleaved } = resolved;
  const sameOrder = declared.every((id, index) => id === production[index]);
  if (sameOrder && interleaved.length === 0) return [];
  return [{ kind: "reordered", target: resolved.step.target, declared, production, interleaved }];
}

/**
 * Every hard break, literal, declared mark, link and block a step adds, in part order,
 * and its source order when that is not production's.
 */
export function managedSiteFieldMigrationAddedItems(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
): readonly ManagedSiteFieldMigrationAddedItemV1[] {
  const { step } = resolved;
  const { target } = step;
  const parts = step.parts.flatMap((part, index) => [
    ...(part.joinedBy === "hard_break"
      ? [{ kind: "hard_break" as const, target, part: index }]
      : []),
    ...("literal" in part
      ? [{ kind: "literal" as const, target, part: index, text: part.literal }]
      : []),
    ...(part.marks ?? []).map((mark) => markItem(target, index, mark)),
  ]);
  const block = {
    kind: "block" as const,
    target,
    block: step.into.type === "plain_text" ? { type: "plain_text" as const } : step.into.block,
    targetRole: managedSiteFieldMigrationRole(resolved.target),
    sources: resolved.sources.map((source) => ({ fieldId: source.id, role: managedSiteFieldMigrationRole(source) })),
  };
  return [block, ...roleItem(resolved), ...reorderedItem(resolved), ...parts];
}

export function managedSiteFieldMigrationLinkStepProof(
  resolved: ManagedSiteFieldMigrationResolvedLinkV1,
): ManagedSiteFieldMigrationLinkStepProofV1 {
  return { op: resolved.step.op, source: resolved.source.id, target: resolved.target.id, owners: resolved.owners };
}

/** Every link a link step writes, with its owner, destination and window. */
export function managedSiteFieldMigrationLinkAddedItems(
  resolved: ManagedSiteFieldMigrationResolvedLinkV1,
): readonly ManagedSiteFieldMigrationAddedItemV1[] {
  return resolved.step.links.map((link, index) => ({
    kind: "link_field",
    target: resolved.target.id,
    source: resolved.source.id,
    owner: resolved.owners[index],
    destination: link.destination,
    linkTarget: link.target,
  }));
}

function retiredFieldProof(retired: ManagedSiteFieldMigrationRetiredFieldV1): ManagedSiteFieldMigrationRetiredFieldProofV1 {
  return { fieldId: retired.field.id, owner: retired.owner, pageId: retired.pageId, sectionId: retired.sectionId };
}

/**
 * A step that names no collection proves exactly what it did before 0.29.0,
 * so a ledger reading earlier proofs reads this one the same way.
 */
export function managedSiteFieldMigrationRetireStepProof(
  resolved: ManagedSiteFieldMigrationResolvedRetireV1,
  items: ReadonlyMap<string, readonly string[]>,
): ManagedSiteFieldMigrationRetireStepProofV1 {
  const proof = {
    op: resolved.step.op,
    fields: resolved.fields.map(retiredFieldProof),
    sections: resolved.sections.map(({ id, pageId }) => ({ sectionId: id, pageId })),
  };
  if (resolved.step.collections === undefined) return proof;
  return {
    ...proof,
    collections: resolved.collections.map(({ collection, placements, itemFields }) => ({
      collectionId: collection.id,
      fields: placements.map(retiredFieldProof),
      itemFields: itemFields.map((field) => field.id),
      items: items.get(collection.id) ?? [],
    })),
  };
}

/** A retire step naming pages: everything it removed is listed under `pages`. */
export function managedSiteFieldMigrationRetirePageStepProof(
  retired: readonly ManagedSiteFieldMigrationRetiredPageV1[],
): ManagedSiteFieldMigrationRetireStepProofV1 {
  return {
    op: "retire",
    fields: [],
    sections: [],
    pages: retired.map(({ page, sections, fields, protectedFields, unrendered }) => ({
      pageId: page.id,
      path: page.route.kind === "static" ? page.route.path : page.route.pattern,
      sections,
      fields: fields.map(({ field, owner, sectionId }) => ({ fieldId: field.id, owner, pageId: page.id, sectionId })),
      protectedFields: protectedFields.map(({ field, owner }) => ({ fieldId: field.id, owner })),
      unrendered,
    })),
  };
}

export function managedSiteFieldMigrationStepProof(
  resolved: ManagedSiteFieldMigrationResolvedStepV1,
  offsets: readonly ManagedSiteFieldMigrationOffsetV1[],
): ManagedSiteFieldMigrationMergeStepProofV1 {
  const { step, owner } = resolved;
  return {
    op: step.op,
    target: step.target,
    owner,
    sources: resolved.sources.map((source) => ({ fieldId: source.id, owner })),
    parts: step.parts.map((part, index) =>
      "literal" in part
        ? { kind: "literal", text: part.literal, ...offsets[index] }
        : { kind: "source", fieldId: part.source, ...offsets[index] },
    ),
  };
}

export function managedSiteFieldMigrationRescopeStepProof(
  resolved: ManagedSiteFieldMigrationResolvedRescopeV1,
): ManagedSiteFieldMigrationRescopeStepProofV1 {
  return { op: "rescope", field: resolved.production.id, from: resolved.from, to: resolved.to };
}

export function managedSiteFieldMigrationRescopeAddedItems(
  resolved: ManagedSiteFieldMigrationResolvedRescopeV1,
): readonly ManagedSiteFieldMigrationAddedItemV1[] {
  return [{ kind: "rescope", field: resolved.production.id, addedUsages: resolved.addedUsages }];
}

export function managedSiteFieldMigrationImageMetadataStepProof(
  resolved: ManagedSiteFieldMigrationResolvedImageMetadataV1,
): ManagedSiteFieldMigrationImageMetadataStepProofV1 {
  return { op: "image-metadata", images: resolved.images };
}

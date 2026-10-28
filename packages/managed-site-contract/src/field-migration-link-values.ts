import { canonicalizeJson } from "./canonical.js";
import {
  validateParsedManagedFieldValue,
  type ManagedContentOwner,
  type ManagedSiteContentValue,
} from "./content.js";
import { contentValueKey } from "./content-semantics-facts.js";
import { ManagedSiteContractError } from "./errors.js";
import type { ManagedSiteFieldMigrationResolvedLinkV1 } from "./field-migration-link.js";
import type { ManagedSiteFieldMigrationLinkV1 } from "./field-migration-schema.js";

type ValuesByKey = ReadonlyMap<string, ManagedSiteContentValue>;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

/**
 * Production's items are exactly the declared ones: every value production
 * holds on the source is consumed by one declared link, and no link names an
 * owner production has no value for. Read from production's values, so an
 * item added or removed since the declaration was written refuses.
 */
function assertOwnersExact(
  resolved: ManagedSiteFieldMigrationResolvedLinkV1,
  production: readonly ManagedSiteContentValue[],
): void {
  const held = production
    .filter((value) => value.fieldId === resolved.source.id)
    .map((value) => contentValueKey(value.fieldId, value.owner))
    .sort();
  const declared = resolved.owners.map((owner) => contentValueKey(resolved.source.id, owner)).sort();
  if (canonicalizeJson(held) !== canonicalizeJson(declared)) {
    fail("MIGRATION_LINK_ITEMS_MISMATCH", `Source ${resolved.source.id} holds other values than the links declared`);
  }
}

function sourceText(resolved: ManagedSiteFieldMigrationResolvedLinkV1, owner: ManagedContentOwner, production: ValuesByKey): string {
  const value = production.get(contentValueKey(resolved.source.id, owner));
  if (value === undefined) return fail("MIGRATION_SOURCE_VALUE_MISSING", `Source ${resolved.source.id} has no production value`);
  if (value.type !== "plain_text") return fail("MIGRATION_LINK_SOURCE_NOT_TEXT", `Source ${resolved.source.id} holds no plain text`);
  return value.value;
}

/**
 * The value a link writes: the source's text as the label, byte for byte, and
 * the declared destination and window, held to the target's own constraints
 * (label length and newlines, authority, scheme, host, fragment, window).
 */
function expectedValue(
  resolved: ManagedSiteFieldMigrationResolvedLinkV1,
  link: ManagedSiteFieldMigrationLinkV1,
  owner: ManagedContentOwner,
  production: ValuesByKey,
): ManagedSiteContentValue {
  const value = {
    fieldId: resolved.target.id,
    owner,
    type: "link",
    value: { label: sourceText(resolved, owner, production), destination: link.destination, target: link.target },
  } as ManagedSiteContentValue;
  try {
    validateParsedManagedFieldValue(resolved.target, value);
  } catch (error) {
    if (!(error instanceof ManagedSiteContractError)) throw error;
    fail("MIGRATION_TARGET_CONSTRAINTS", `Target ${resolved.target.id} does not admit the declared link: ${error.code}`);
  }
  return value;
}

/** The candidate holds one value on the target per declared link, and no other. */
function assertTargetCount(resolved: ManagedSiteFieldMigrationResolvedLinkV1, candidate: readonly ManagedSiteContentValue[]): void {
  const count = candidate.filter((value) => value.fieldId === resolved.target.id).length;
  if (count !== resolved.owners.length) {
    fail("MIGRATION_UNDECLARED_CHANGE", `Target ${resolved.target.id} holds ${count} values for ${resolved.owners.length} links`);
  }
}

/**
 * Every candidate value on a link step's target is exactly the link its
 * declaration writes from production's text, and every production value on
 * the source is consumed by one of them.
 */
export function proveManagedSiteFieldMigrationLinkV1(
  resolved: ManagedSiteFieldMigrationResolvedLinkV1,
  production: { readonly values: readonly ManagedSiteContentValue[]; readonly byKey: ValuesByKey },
  candidate: { readonly values: readonly ManagedSiteContentValue[]; readonly byKey: ValuesByKey },
): void {
  assertOwnersExact(resolved, production.values);
  assertTargetCount(resolved, candidate.values);
  resolved.step.links.forEach((link, index) => {
    const owner = resolved.owners[index];
    const expected = expectedValue(resolved, link, owner, production.byKey);
    const actual = candidate.byKey.get(contentValueKey(resolved.target.id, owner));
    if (actual === undefined) fail("MIGRATION_TARGET_VALUE_MISSING", `Candidate has no value for ${resolved.target.id}`);
    if (canonicalizeJson(actual) !== canonicalizeJson(expected)) {
      fail("MIGRATION_TARGET_MISMATCH", `Candidate ${resolved.target.id} is not the declared link over its source's text`);
    }
  });
}

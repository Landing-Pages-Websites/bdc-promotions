import type { ManagedContractCompatibilityFacts } from "./contract-compatibility-facts.js";
import { ManagedSiteContractError } from "./errors.js";

/** Every field an atomic alias group holds: one value shared by a group. */
export function managedSiteFieldMigrationAliasedIds(facts: ManagedContractCompatibilityFacts): ReadonlySet<string> {
  return new Set([...facts.aliases.values()].flatMap((group) => group.fieldIds));
}

/** Claims `id` for one step, refusing it with `code` when a step already has. */
export function claimOnce(claimed: Set<string>, id: string, code: string): void {
  if (claimed.has(id)) throw new ManagedSiteContractError(code, `Claimed more than once: ${id}`);
  claimed.add(id);
}

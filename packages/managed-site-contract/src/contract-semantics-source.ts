import { ManagedSiteContractError } from "./errors.js";
import type { ManagedSiteContractFacts } from "./contract-semantics-facts.js";

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function pathAlias(path: string): string {
  return path.normalize("NFKC").toLowerCase();
}

function pointersOverlap(left: readonly string[], right: readonly string[]): boolean {
  const shorter = left.length <= right.length ? left : right;
  const longer = shorter === left ? right : left;
  return shorter.every((token, index) => token === longer[index]);
}

export function validateManagedSiteContractSourceFacts(facts: ManagedSiteContractFacts): void {
  const paths = new Map<string, string>();
  for (const source of facts.sources) {
    const alias = pathAlias(source.address.path);
    const priorPath = paths.get(alias);
    if (priorPath !== undefined && priorPath !== source.address.path) fail("CONTRACT_SOURCE_PATH_ALIAS", `Source paths alias: ${source.address.path}`);
    paths.set(alias, source.address.path);
  }
  for (const [index, source] of facts.sources.entries()) {
    for (const other of facts.sources.slice(index + 1)) {
      if (source.address.path === other.address.path && pointersOverlap(source.address.tokens, other.address.tokens)) fail("CONTRACT_SOURCE_POINTER_OVERLAP", `Source pointers overlap at ${source.location}`);
    }
  }
}

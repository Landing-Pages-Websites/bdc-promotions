import type { ManagedSiteContractV1 } from "./contract.js";
import { collectManagedSiteContractV1Facts, type ManagedSiteContractFacts } from "./contract-semantics-facts.js";
import { validateManagedSiteContractIdentityFacts } from "./contract-semantics-identity.js";
import { validateManagedSiteContractRouteFacts } from "./contract-semantics-routes.js";
import { validateManagedSiteContractSourceFacts } from "./contract-semantics-source.js";

export interface ManagedSiteContractSemanticResult {
  readonly deferred: ManagedSiteContractFacts["deferred"];
}

export function validateManagedSiteContractV1Semantics(input: ManagedSiteContractV1): ManagedSiteContractSemanticResult {
  const facts = collectManagedSiteContractV1Facts(input);
  validateManagedSiteContractIdentityFacts(facts);
  validateManagedSiteContractSourceFacts(facts);
  validateManagedSiteContractRouteFacts(facts);
  return Object.freeze({ deferred: facts.deferred });
}

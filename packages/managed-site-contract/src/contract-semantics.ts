import type { ManagedSiteContractV1 } from "./contract.js";
import { collectManagedSiteContractV1Facts, type ManagedSiteContractFacts } from "./contract-semantics-facts.js";
import { validateManagedSiteContractIdentityFacts } from "./contract-semantics-identity.js";
import { validateManagedCollectionViews } from "./contract-semantics-collection-views.js";
import { validateManagedItemPatterns } from "./contract-semantics-item-patterns.js";
import { validateManagedNestedCollections } from "./contract-semantics-nested.js";
import { validateManagedOptionalFieldReferences } from "./contract-semantics-optional-fields.js";
import { validateManagedSiteContractRouteFacts } from "./contract-semantics-routes.js";
import { validateManagedSiteSeoSemantics } from "./contract-semantics-seo.js";
import { validateManagedSiteContractSourceFacts } from "./contract-semantics-source.js";

export interface ManagedSiteContractSemanticResult {
  readonly deferred: ManagedSiteContractFacts["deferred"];
}

export function validateManagedSiteContractV1Semantics(input: ManagedSiteContractV1): ManagedSiteContractSemanticResult {
  // Before the occurrence facts: an item-text pattern off a generated page has
  // no route collection to scope its sources by, and is refused for what it is.
  validateManagedItemPatterns(input);
  const facts = collectManagedSiteContractV1Facts(input);
  validateManagedSiteContractIdentityFacts(facts);
  validateManagedNestedCollections(input);
  validateManagedCollectionViews(input);
  validateManagedOptionalFieldReferences(input);
  validateManagedSiteSeoSemantics(input);
  validateManagedSiteContractSourceFacts(facts);
  validateManagedSiteContractRouteFacts(facts);
  return Object.freeze({ deferred: facts.deferred });
}

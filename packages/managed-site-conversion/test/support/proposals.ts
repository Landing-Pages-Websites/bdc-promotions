import assert from "node:assert/strict";
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Candidate } from "../../src/candidates.js";
import {
  extractComponent,
  findComponentDeclarations,
  resolveTagRoles,
} from "../../src/extract.js";
import { isJsonObject, type JsonObject } from "../../src/json-write.js";
import { propose, type Proposal } from "../../src/propose.js";
import type { Finding, FindingCode } from "../../src/report.js";
import { parseModule } from "../../src/scan.js";

/** Shared plumbing for the fixture-driven proposal tests. */

const FIXTURE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

export interface Workspace {
  readonly repositoryRoot: string;
  readonly ledgerPath: string;
  readonly configPath: string | null;
}

/** Copies a fixture site into a scratch directory so a run may rewrite it. */
export function workspace(fixture: string, config: unknown | null): Workspace {
  const directory = mkdtempSync(join(tmpdir(), "managed-site-proposal-"));
  const repositoryRoot = join(directory, "repo");
  cpSync(join(FIXTURE_ROOT, fixture), repositoryRoot, { recursive: true });
  if (config === null) {
    return { repositoryRoot, ledgerPath: join(directory, "idmap.json"), configPath: null };
  }
  const configPath = join(directory, "conversion.json");
  writeFileSync(configPath, JSON.stringify(config), "utf8");
  return { repositoryRoot, ledgerPath: join(directory, "idmap.json"), configPath };
}

export function run(space: Workspace): Proposal {
  return propose({
    repositoryRoot: space.repositoryRoot,
    configPath: space.configPath,
    ledgerPath: space.ledgerPath,
  });
}

export interface ComponentExtraction {
  readonly candidates: readonly Candidate[];
  readonly findings: readonly Finding[];
}

/** Extracts every component one module declares, exactly as the proposer does. */
export function extractModule(source: string): ComponentExtraction {
  const directory = mkdtempSync(join(tmpdir(), "managed-site-extract-"));
  const file = join(directory, "Component.tsx");
  writeFileSync(file, source, "utf8");
  const sourceModule = parseModule(file);
  const roles = resolveTagRoles(sourceModule);
  const extracted = findComponentDeclarations(sourceModule).map((declaration) =>
    extractComponent(declaration, roles),
  );
  return {
    candidates: extracted.flatMap((entry) => entry.candidates),
    findings: extracted.flatMap((entry) => entry.findings),
  };
}

export function findingsOf(proposal: Proposal, code: FindingCode): readonly Finding[] {
  return proposal.report.findings.filter((finding) => finding.code === code);
}

export function sourceDocumentOf(proposal: Proposal, path: string): JsonObject {
  const document = proposal.sourceDocuments.get(path);
  assert.ok(isJsonObject(document), `no source document at ${path}`);
  return document;
}

/** The internal-SEO values a route resolved, as they are written to its source. */
export function seoOf(proposal: Proposal, slug: string): JsonObject {
  const document = sourceDocumentOf(proposal, `src/content/pages/${slug}.json`);
  const seo = document["seo"];
  return isJsonObject(seo) ? seo : {};
}

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
import { ModuleCache } from "../../src/scan.js";

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

/**
 * Extracts every component the named entry modules declare, exactly as the
 * proposer does, with the whole file set on disk beside them so imports
 * resolve.
 *
 * This is the ONLY statement of that prelude. Seven copies of it were spread
 * over six files, which pinned `extractComponent`'s signature in as many places
 * as there were copies and let the copies drift apart.
 *
 * Every entry shares one scratch root and one `ModuleCache`, and that sharing
 * is load-bearing rather than a saving: a candidate's identity carries the
 * absolute path of the module it was DECLARED in, so writing the fixture out
 * once per entry would give one declaration two identities and the gate would
 * refuse the pair it is supposed to merge.
 */
export function extractEntries(
  files: Readonly<Record<string, string>>,
  entries: readonly string[],
): ComponentExtraction {
  const directory = mkdtempSync(join(tmpdir(), "managed-site-extract-"));
  for (const [relative, text] of Object.entries(files)) {
    const file = join(directory, relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text, "utf8");
  }
  const cache = new ModuleCache();
  const extractions = entries.flatMap((entry) => {
    const sourceModule = cache.read(join(directory, entry));
    const roles = resolveTagRoles(sourceModule);
    return findComponentDeclarations(sourceModule).map((declaration) =>
      extractComponent(declaration, roles, directory, cache),
    );
  });
  return {
    candidates: extractions.flatMap((one) => one.candidates),
    findings: extractions.flatMap((one) => one.findings),
  };
}

/** Extracts every component one entry module declares, the file set beside it. */
export function extractFiles(
  files: Readonly<Record<string, string>>,
  entry: string,
): ComponentExtraction {
  return extractEntries(files, [entry]);
}

/** Extracts every component one module declares, exactly as the proposer does. */
export function extractModule(source: string): ComponentExtraction {
  return extractFiles({ "Component.tsx": source }, "Component.tsx");
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

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import { propose } from "./propose.js";
import { renderReportText } from "./report.js";

interface CliOptions {
  readonly repositoryRoot: string;
  readonly outputDirectory: string;
  readonly configPath: string | null;
  readonly ledgerPath: string;
  readonly writeSources: boolean;
}

const USAGE = `Usage: propose --repo <path> [--out <path>] [--config <path>] [--ledger <path>] [--write-sources]

Proposes a managed-site contract for a Next.js repository. Values it cannot
classify with confidence are reported, never guessed.

  --repo           repository to inspect (required)
  --out            directory for the proposal (default: <repo>/.managed-site-proposal)
  --config         conversion config supplying platform and governance facts
  --ledger         anchor-to-ID ledger (default: <out>/managed-site.idmap.json)
  --write-sources  also write the proposed src/content JSON documents
`;

function readOptions(argv: readonly string[]): CliOptions | null {
  const values = new Map<string, string>();
  const flags = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined || !argument.startsWith("--")) continue;
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      flags.add(argument.slice(2));
      continue;
    }
    values.set(argument.slice(2), next);
    index += 1;
  }
  const repository = values.get("repo");
  if (repository === undefined) return null;
  const repositoryRoot = resolve(repository);
  const outputDirectory = resolve(
    values.get("out") ?? join(repositoryRoot, ".managed-site-proposal"),
  );
  return {
    repositoryRoot,
    outputDirectory,
    configPath: values.get("config") === undefined ? null : resolve(values.get("config")!),
    ledgerPath: resolve(
      values.get("ledger") ?? join(outputDirectory, "managed-site.idmap.json"),
    ),
    writeSources: flags.has("write-sources"),
  };
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function run(argv: readonly string[]): number {
  const options = readOptions(argv);
  if (options === null) {
    process.stdout.write(USAGE);
    return 64;
  }
  const proposal = propose({
    repositoryRoot: options.repositoryRoot,
    configPath: options.configPath,
    ledgerPath: options.ledgerPath,
  });

  mkdirSync(options.outputDirectory, { recursive: true });
  writeJson(join(options.outputDirectory, "managed-site.contract.json"), proposal.contractDraft);
  writeJson(join(options.outputDirectory, "managed-site.content.json"), proposal.content);
  writeJson(join(options.outputDirectory, "needs-human.json"), proposal.report);
  writeFileSync(
    join(options.outputDirectory, "needs-human.txt"),
    renderReportText(proposal.report),
    "utf8",
  );
  if (options.writeSources) {
    for (const [path, document] of proposal.sourceDocuments) {
      writeJson(join(options.outputDirectory, "sources", path), document);
    }
  }
  proposal.ledger.save(options.ledgerPath);

  const report = proposal.report;
  process.stdout.write(
    `proposed ${report.proposedFieldCount} fields, ${report.proposedCollectionCount} collections, ` +
      `${report.proposedAssetCount} asset slots\n` +
      `needs human decision: ${report.findings.length}\n` +
      `contract validates: ${proposal.contract === null ? "no" : "yes"}\n` +
      `written to ${options.outputDirectory}\n`,
  );
  if (proposal.validationError !== null) {
    process.stdout.write(`validation: ${proposal.validationError}\n`);
  }
  return proposal.contract === null || report.findings.length > 0 ? 1 : 0;
}

const invokedDirectly = process.argv[1]?.endsWith("cli.ts") === true;
if (invokedDirectly) process.exitCode = run(process.argv.slice(2));

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import {
  applyAnchorNames,
  describeName,
  nameAmbiguousAnchors,
  revertAnchorNames,
  verifyAnchorNames,
} from "./name-anchors.js";
import { propose, sourceDocumentsFor } from "./propose.js";
import { renderReportText } from "./report.js";

interface CliOptions {
  readonly repositoryRoot: string;
  readonly outputDirectory: string;
  readonly configPath: string | null;
  readonly ledgerPath: string;
  readonly writeSources: boolean;
  readonly nameAnchors: boolean;
  readonly applyAnchorNames: boolean;
}

const USAGE = `Usage: propose --repo <path> [--out <path>] [--config <path>] [--ledger <path>] [--write-sources]

Proposes a managed-site contract for a Next.js repository. Values it cannot
classify with confidence are reported, never guessed.

  --repo           repository to inspect (required)
  --out            directory for the proposal (default: <repo>/.managed-site-proposal)
  --config         conversion config supplying platform and governance facts
  --ledger         anchor-to-ID ledger (default: <out>/managed-site.idmap.json)
  --write-sources  also write the proposed src/content JSON documents
  --name-anchors   also propose an \`id\` for every ambiguity it can name safely
  --apply-anchors  write those ids into the repository (implies --name-anchors)
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
    nameAnchors: flags.has("name-anchors") || flags.has("apply-anchors"),
    applyAnchorNames: flags.has("apply-anchors"),
  };
}

/** The two names for the content document; exactly one exists after a run. */
const CONTENT_ARTIFACTS = {
  accepted: "managed-site.content.json",
  rejected: "managed-site.content.rejected.json",
} as const;

/**
 * Writes the content document under the name this outcome calls for, and
 * removes the other.
 *
 * Only these two names are ever removed, and this tool already overwrites both
 * without asking, so the removal claims nothing new. Anything else in the
 * output directory is left alone.
 */
function writeExclusive(
  directory: string,
  outcome: keyof typeof CONTENT_ARTIFACTS,
  document: unknown,
): void {
  const other = outcome === "accepted" ? "rejected" : "accepted";
  rmSync(join(directory, CONTENT_ARTIFACTS[other]), { force: true });
  writeJson(join(directory, CONTENT_ARTIFACTS[outcome]), document);
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
  // Writing the sources is what makes this directory checkable on its own.
  writeJson(
    join(options.outputDirectory, "managed-site.sources.json"),
    sourceDocumentsFor(proposal.sourceDocuments),
  );
  // `managed-site.content.json` only ever holds a projection, and the two names
  // are mutually exclusive: the README says the rejection is written INSTEAD of
  // the content. The output directory is reused across runs, so writing one
  // without removing the other left a refused run standing beside the previous
  // run's content, and a consumer following the documented path would package
  // content this conversion refused. Removing the alternate is bounded to these
  // two names, both of which this tool already overwrites unconditionally, so
  // it reaches nothing a normal run does not already claim.
  writeExclusive(
    options.outputDirectory,
    proposal.content === null ? "rejected" : "accepted",
    proposal.content ?? proposal.contentDraft,
  );
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
  if (options.nameAnchors) {
    const naming = nameAmbiguousAnchors(
      proposal.ambiguous,
      options.repositoryRoot,
      options.outputDirectory,
    );
    writeJson(join(options.outputDirectory, "anchor-names.json"), naming);
    writeFileSync(
      join(options.outputDirectory, "anchor-names.txt"),
      `${naming.names.map(describeName).join("\n")}\n`,
      "utf8",
    );
    const applied = options.applyAnchorNames ? applyAnchorNames(naming.names) : null;
    process.stdout.write(
      `anchor names: ${naming.names.length} proposed, ${naming.findings.length} left to a person` +
        (applied === null ? "\n" : `, written into ${applied.files.length} files\n`),
    );
    for (const file of applied?.rejected ?? []) {
      process.stdout.write(`anchor names: NOT written, the edited file would not parse: ${file}\n`);
    }
    // The edit is checked against what it promised, by re-reading the
    // repository rather than by trusting the analysis that produced it. A
    // duplicate id or a surviving ambiguity withdraws the whole edit.
    if (applied !== null && applied.files.length > 0) {
      const after = propose({
        repositoryRoot: options.repositoryRoot,
        configPath: options.configPath,
        ledgerPath: options.ledgerPath,
      });
      const broken = verifyAnchorNames(naming.names, after.ambiguous, options.repositoryRoot);
      if (broken.length > 0) {
        revertAnchorNames(applied);
        for (const reason of broken) {
          process.stdout.write(`anchor names: WITHDRAWN, ${reason}\n`);
        }
        process.stdout.write(
          `anchor names: ${String(applied.files.length)} files put back as they were\n`,
        );
      }
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
    process.stdout.write(
      `validation: ${proposal.validationError}\n` +
        "content: withheld, nothing can project it. The values read are in " +
        "managed-site.content.rejected.json\n",
    );
  }
  return proposal.contract === null || report.findings.length > 0 ? 1 : 0;
}

const invokedDirectly = process.argv[1]?.endsWith("cli.ts") === true;
if (invokedDirectly) process.exitCode = run(process.argv.slice(2));

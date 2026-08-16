/**
 * The needs-human report. Everything the proposer refuses to decide lands here.
 *
 * The confidence rule this file enforces is stated once, in CONFIDENCE_RULE,
 * and is echoed into every emitted report so the reader never has to guess what
 * "confident" meant for a given run.
 */

export const CONFIDENCE_RULE =
  "A value enters the proposed contract only when its identity, its field type " +
  "and its classification are each decided by a rule reading exclusively from " +
  "structural source facts (declared identifiers, JSX tags, attribute names, " +
  "literal syntactic kind), and no other candidate in the repository resolves " +
  "to the same anchor path. If any one of the three is undetermined, the value " +
  "is reported here and NOTHING is written into the contract for it.";

export const FINDING_CODES = Object.freeze([
  /** Two or more candidates resolve to the same anchor path. */
  "AMBIGUOUS_ANCHOR",
  /** A rendered region carries no durable name to anchor on. */
  "NO_DURABLE_ANCHOR",
  /** The rendered value is computed, not a literal the tool can migrate. */
  "NON_LITERAL_VALUE",
  /** The value flows into an attribute whose ownership is not decidable. */
  "UNKNOWN_ATTRIBUTE_ROLE",
  /** Two component declarations share a name, so neither can be anchored. */
  "DUPLICATE_COMPONENT_NAME",
  /** An imported component could not be resolved on disk. */
  "UNRESOLVED_COMPONENT",
  /** A rendered element names no traceable declaration, so its subtree is unread. */
  "UNRESOLVED_RENDER_TARGET",
  /** Collection cardinality is a policy decision, never derivable from source. */
  "COLLECTION_BOUNDS_NOT_DERIVABLE",
  /** The standard binds one asset slot to one file, so items cannot vary an image. */
  "COLLECTION_ITEM_IMAGE_UNSUPPORTED",
  /** An image referenced by the source could not be read or probed. */
  "ASSET_UNREADABLE",
  /** An internal-SEO value has no source to migrate from. */
  "SEO_INPUT_REQUIRED",
  /** A field-scope decision needs more than one route to be observable. */
  "SCOPE_NOT_OBSERVABLE",
  /** Text/link length policy is a governance default, not a migration fact. */
  "CONSTRAINTS_DEFAULTED",
] as const);

export type FindingCode = (typeof FINDING_CODES)[number];

export interface SourceLocation {
  readonly file: string;
  readonly line: number;
}

export interface Finding {
  readonly code: FindingCode;
  readonly anchor: string | null;
  readonly location: SourceLocation | null;
  /** The literal source evidence, so a human can act without re-deriving it. */
  readonly evidence: string;
  /** The single decision a human must make to unblock this value. */
  readonly decision: string;
}

export interface ProposalReport {
  readonly confidenceRule: string;
  readonly repository: string;
  readonly proposedFieldCount: number;
  readonly proposedCollectionCount: number;
  readonly proposedAssetCount: number;
  readonly findings: readonly Finding[];
}

export class FindingCollector {
  readonly #findings: Finding[] = [];
  readonly #seen = new Set<string>();

  /**
   * A finding is one decision for a human. The same source, reported again
   * because a shared module is reached from a second route, is not a second
   * decision, so it is recorded once.
   */
  add(finding: Finding): void {
    const key = JSON.stringify([
      finding.code,
      finding.anchor,
      finding.location?.file ?? null,
      finding.location?.line ?? null,
      finding.evidence,
      finding.decision,
    ]);
    if (this.#seen.has(key)) return;
    this.#seen.add(key);
    this.#findings.push(finding);
  }

  addMany(findings: readonly Finding[]): void {
    for (const finding of findings) this.add(finding);
  }

  get findings(): readonly Finding[] {
    return this.#findings;
  }

  countByCode(): ReadonlyMap<FindingCode, number> {
    const counts = new Map<FindingCode, number>();
    for (const finding of this.#findings) {
      counts.set(finding.code, (counts.get(finding.code) ?? 0) + 1);
    }
    return counts;
  }
}

export function renderReportText(report: ProposalReport): string {
  const lines = [
    `managed-site conversion proposal — ${report.repository}`,
    "",
    "CONFIDENCE RULE",
    report.confidenceRule,
    "",
    `proposed: ${report.proposedFieldCount} fields, ` +
      `${report.proposedCollectionCount} collections, ` +
      `${report.proposedAssetCount} asset slots`,
    `needs human decision: ${report.findings.length}`,
    "",
  ];
  for (const finding of report.findings) {
    const where =
      finding.location === null
        ? ""
        : ` (${finding.location.file}:${finding.location.line})`;
    lines.push(`[${finding.code}]${where}`);
    if (finding.anchor !== null) lines.push(`  anchor:   ${finding.anchor}`);
    lines.push(`  evidence: ${finding.evidence}`);
    lines.push(`  decide:   ${finding.decision}`);
    lines.push("");
  }
  return lines.join("\n");
}

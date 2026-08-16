import { renderAnchor } from "./anchors.js";
import type { Candidate } from "./candidates.js";
import type { Finding } from "./report.js";

/**
 * The confidence gate. Identity must be unique before anything is proposed:
 * two candidates that resolve to the same anchor path are BOTH rejected, never
 * silently disambiguated by order, text or position.
 */

export interface GateResult {
  readonly accepted: readonly Candidate[];
  readonly findings: readonly Finding[];
}

function groupByAnchor(candidates: readonly Candidate[]): ReadonlyMap<string, Candidate[]> {
  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const key = renderAnchor(candidate.anchor);
    const existing = groups.get(key);
    if (existing === undefined) groups.set(key, [candidate]);
    else existing.push(candidate);
  }
  return groups;
}

function duplicateComponentNames(candidates: readonly Candidate[]): ReadonlySet<string> {
  const filesByComponent = new Map<string, Set<string>>();
  for (const candidate of candidates) {
    const files = filesByComponent.get(candidate.componentName) ?? new Set<string>();
    files.add(candidate.location.file);
    filesByComponent.set(candidate.componentName, files);
  }
  return new Set(
    [...filesByComponent.entries()]
      .filter(([, files]) => files.size > 1)
      .map(([name]) => name),
  );
}

function ambiguityFinding(anchor: string, candidate: Candidate, siblings: number): Finding {
  return {
    code: "AMBIGUOUS_ANCHOR",
    anchor,
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `${siblings} values share this anchor. Give each one a durable name — an ` +
      "`id` attribute on its section, its own named component, or a declared " +
      "collection — then re-run. Nothing was proposed for any of them.",
  };
}

function duplicateComponentFinding(candidate: Candidate): Finding {
  return {
    code: "DUPLICATE_COMPONENT_NAME",
    anchor: renderAnchor(candidate.anchor),
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `Component '${candidate.componentName}' is declared in more than one file, ` +
      "so its anchors are not unique. Rename one of them before converting.",
  };
}

const TEXT_SUFFIX = "/text";

/**
 * An ambiguous text run means its *element* is ambiguous: two `<p>` with the
 * same anchor are two indistinguishable paragraphs, so anything nested inside
 * either of them is indistinguishable too.
 */
function containerPrefixOf(anchor: string): string {
  return anchor.endsWith(TEXT_SUFFIX) ? anchor.slice(0, -TEXT_SUFFIX.length) : anchor;
}

function inheritedAmbiguityFinding(anchor: string, candidate: Candidate, parent: string): Finding {
  return {
    code: "AMBIGUOUS_ANCHOR",
    anchor,
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `Its container '${parent}' is ambiguous, so this value cannot be attributed to ` +
      "one of the identical containers either. Name the container first.",
  };
}

/**
 * Ambiguity is inherited. If a container cannot be told apart from its twin,
 * nothing inside it can be either, so the whole subtree is withheld rather than
 * attributed to whichever twin happened to be walked first.
 */
export function applyConfidenceGate(candidates: readonly Candidate[]): GateResult {
  const shadowed = duplicateComponentNames(candidates);
  const groups = groupByAnchor(candidates);
  const ambiguous = [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([anchor]) => containerPrefixOf(anchor));
  const findings: Finding[] = [];
  const accepted: Candidate[] = [];

  for (const [anchor, group] of groups) {
    const inherited = ambiguous.find((prefix) => anchor.startsWith(`${prefix}/`));
    for (const candidate of group) {
      if (shadowed.has(candidate.componentName)) {
        findings.push(duplicateComponentFinding(candidate));
        continue;
      }
      if (group.length > 1) {
        findings.push(ambiguityFinding(anchor, candidate, group.length));
        continue;
      }
      if (inherited !== undefined) {
        findings.push(inheritedAmbiguityFinding(anchor, candidate, inherited));
        continue;
      }
      accepted.push(candidate);
    }
  }
  return { accepted, findings };
}

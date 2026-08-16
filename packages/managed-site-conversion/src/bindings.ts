import type { StableId } from "@landing-pages-websites/managed-site-contract";

import { anchorToJsonPointer, humaniseAnchorTail, renderAnchor, type AnchorPath } from "./anchors.js";
import type { Candidate } from "./candidates.js";
import type { IdLedger } from "./id-ledger.js";
import type { Finding } from "./report.js";

/**
 * Turns accepted candidates into addressed proposals: a stable ID (from the
 * ledger, keyed on the anchor), a content address, a section, and a scope.
 * Presentation names are derived here too — they are labels, never identity.
 */

export interface PageBinding {
  readonly routePath: string;
  readonly pageId: StableId<"page">;
  readonly slug: string;
  readonly componentNames: ReadonlySet<string>;
}

export interface FieldBinding {
  readonly candidate: Candidate;
  readonly fieldId: StableId<"field">;
  readonly scope: "site" | "page";
  readonly sourcePath: string;
  readonly pointer: string;
  readonly pageIds: readonly StableId<"page">[];
  readonly sectionKey: string;
  readonly order: number;
  readonly name: string;
  readonly group: string;
}

export interface SectionBinding {
  readonly key: string;
  readonly sectionId: StableId<"section">;
  readonly name: string;
  readonly pageId: StableId<"page">;
  readonly order: number;
  readonly fields: readonly FieldBinding[];
}

export function routeSlug(routePath: string): string {
  if (routePath === "/") return "home";
  return routePath.slice(1).replaceAll("/", "-");
}

function sectionAnchorOf(anchor: AnchorPath): AnchorPath {
  const regions = anchor.filter((segment) => segment.kind === "region");
  const component = anchor.find((segment) => segment.kind === "component");
  return component === undefined ? regions : [component, ...regions];
}

function sectionNameOf(anchor: AnchorPath, componentName: string): string {
  const lastRegion = [...anchor].reverse().find((segment) => segment.kind === "region");
  if (lastRegion === undefined) return humanise(componentName);
  return humanise(lastRegion.name);
}

function humanise(raw: string): string {
  const words = raw.split(/[^A-Za-z0-9]+/u).filter((word) => word.length > 0);
  const spaced = words
    .flatMap((word) => word.replace(/([a-z0-9])([A-Z])/gu, "$1 $2").split(" "))
    .join(" ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function pagesUsing(componentName: string, pages: readonly PageBinding[]): readonly PageBinding[] {
  return pages.filter((page) => page.componentNames.has(componentName));
}

/**
 * Every field's content address ends in a leaf naming what it holds, so no
 * emitted pointer can ever be a prefix of another. Without it a link's own
 * value and the text nested inside that link would fight for one address.
 */
const LEAF_TOKENS: Readonly<Record<Candidate["kind"], string>> = {
  plain_text: "text",
  heading_text: "text",
  rich_text: "text",
  link: "link",
  image: "image",
  collection: "collection",
};

function pointerFor(candidate: Candidate): string {
  const base = anchorToJsonPointer(candidate.anchor);
  const leaf = LEAF_TOKENS[candidate.kind];
  return base.endsWith(`/${leaf}`) ? base : `${base}/${leaf}`;
}

function assertNoPrefixCollisions(fields: readonly FieldBinding[]): void {
  const byPath = new Map<string, string[]>();
  for (const field of fields) {
    const pointers = byPath.get(field.sourcePath) ?? [];
    pointers.push(field.pointer);
    byPath.set(field.sourcePath, pointers);
  }
  for (const [path, pointers] of byPath) {
    const sorted = [...pointers].sort();
    for (const [index, pointer] of sorted.entries()) {
      const next = sorted[index + 1];
      if (next !== undefined && next.startsWith(`${pointer}/`)) {
        throw new Error(`Proposed pointers ${pointer} and ${next} overlap in ${path}`);
      }
    }
  }
}

function contentPathFor(
  scope: "site" | "page",
  contentRoot: string,
  page: PageBinding | undefined,
): string {
  if (scope === "site" || page === undefined) return `${contentRoot}/site.json`;
  return `${contentRoot}/pages/${page.slug}.json`;
}

function scopeFinding(candidate: Candidate, pageCount: number): Finding {
  return {
    code: "SCOPE_NOT_OBSERVABLE",
    anchor: renderAnchor(candidate.anchor),
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `Component '${candidate.componentName}' renders on ${pageCount} routes, so this ` +
      "value was proposed as site-scoped. Confirm that every route should share one value.",
  };
}

export interface BindingResult {
  readonly sections: readonly SectionBinding[];
  readonly fields: readonly FieldBinding[];
  readonly findings: readonly Finding[];
}

export function bindCandidates(
  candidates: readonly Candidate[],
  pages: readonly PageBinding[],
  ledger: IdLedger,
  contentRoot: string,
): BindingResult {
  const findings: Finding[] = [];
  const bySection = new Map<string, FieldBinding[]>();
  const sectionMeta = new Map<string, { readonly name: string; readonly page: PageBinding }>();

  for (const candidate of candidates) {
    const owners = pagesUsing(candidate.componentName, pages);
    const owner = owners[0];
    if (owner === undefined) continue;
    const scope: "site" | "page" = owners.length > 1 ? "site" : "page";
    if (scope === "site") findings.push(scopeFinding(candidate, owners.length));

    const sectionKey = renderAnchor(sectionAnchorOf(candidate.anchor));
    const name = sectionNameOf(candidate.anchor, candidate.componentName);
    sectionMeta.set(sectionKey, { name, page: owner });

    const bucket = bySection.get(sectionKey) ?? [];
    bucket.push({
      candidate,
      fieldId: ledger.resolve("field", renderAnchor(candidate.anchor)),
      scope,
      sourcePath: contentPathFor(scope, contentRoot, owner),
      pointer: pointerFor(candidate),
      pageIds: owners.map((page) => page.pageId),
      sectionKey,
      order: bucket.length + 1,
      name: humaniseAnchorTail(candidate.anchor),
      group: name,
    });
    bySection.set(sectionKey, bucket);
  }

  const sections = [...bySection.entries()].map(([key, fields], index) => {
    const meta = sectionMeta.get(key);
    if (meta === undefined) throw new Error(`Section ${key} lost its metadata`);
    return {
      key,
      sectionId: ledger.resolve("section", key),
      name: meta.name,
      pageId: meta.page.pageId,
      order: index + 1,
      fields,
    } satisfies SectionBinding;
  });

  const fields = sections.flatMap((section) => section.fields);
  assertNoPrefixCollisions(fields);
  return { sections, fields, findings };
}

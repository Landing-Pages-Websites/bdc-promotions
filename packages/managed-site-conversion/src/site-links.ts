import {
  parseManagedSiteContentValue,
  type StableId,
} from "@landing-pages-websites/managed-site-contract";

import { renderAnchor } from "./anchors.js";
import type { PageBinding } from "./bindings.js";
import { renderedIds } from "./rendered-ids.js";
import type { Candidate, LinkCandidate, RawDestination } from "./candidates.js";
import type { ComponentDeclaration } from "./extract.js";
import type { Finding } from "./report.js";

/**
 * Resolves every same-site link against the declared pages, before anything is
 * gated, bound or emitted.
 *
 * The invariant: a same-site link becomes a customer-editable link field only
 * when the contract's internal destination `{ pageId, fragment }` renders the
 * href the source wrote, byte for byte, on every page the link renders on.
 * The runtime renders such a value as the page's declared path, then
 * `#fragment`, so that means: the href IS a declared page's path (no trailing
 * slash, case, dot segment, query or encoding the path does not have), and any
 * fragment is one the contract can spell and the target page provably renders
 * once (`rendered-ids.ts`). A bare `#fragment` renders without a path, so it
 * never qualifies.
 *
 * Everything else is refused here, whole: no link field at all, and a finding
 * saying why. A code-owned field would still store a destination, and there is
 * no true one to store; storing the page the link sits on is the defect this
 * replaced.
 */

/** A declared page, with the fragment targets it provably renders. */
export interface SitePage {
  readonly binding: PageBinding;
  readonly ids: ReadonlySet<string>;
}

export interface SiteLinkResolution {
  readonly candidates: readonly Candidate[];
  readonly findings: readonly Finding[];
}

/**
 * Stands in for the field a probe value has none of, so a fragment is judged
 * by the contract's OWN content-value parser rather than a restated pattern.
 */
const PROBE_FIELD_ID = "field_00000000000000000000000000";

/** Whether the contract can store `fragment` on an internal destination. */
function isStorableFragment(pageId: StableId<"page">, fragment: string): boolean {
  try {
    parseManagedSiteContentValue({
      fieldId: PROBE_FIELD_ID,
      owner: { kind: "site" },
      type: "link",
      value: {
        label: "probe",
        destination: { kind: "internal", pageId, fragment },
        target: "same_window",
      },
    });
    return true;
  } catch {
    return false;
  }
}

type Judgement =
  | { readonly kind: "page"; readonly destination: Extract<RawDestination, { kind: "page" }> }
  | { readonly kind: "refused"; readonly reason: string };

function refused(reason: string): Judgement {
  return { kind: "refused", reason };
}

function judgeFragment(page: SitePage, fragment: string): Judgement {
  if (fragment.length === 0) return refused("its fragment is empty");
  if (!page.ids.has(fragment)) {
    return refused(
      `${page.binding.routePath} renders no element with id '${fragment}' unconditionally, ` +
        "so the link would point at a place the converter never saw",
    );
  }
  if (!isStorableFragment(page.binding.pageId, fragment)) {
    return refused(`'#${fragment}' is not a fragment the contract can store`);
  }
  return { kind: "page", destination: { kind: "page", pageId: page.binding.pageId, fragment } };
}

/**
 * `#fragment` on its own renders as exactly that on whatever page shows it,
 * while the contract stores a page and renders `/path#fragment`. Those differ
 * in markup on every page and in behaviour wherever the current URL carries a
 * query or the link renders on more than one page, so the source's href cannot
 * be stored and it stays in code.
 */
const BARE_FRAGMENT: Judgement = refused(
  "it renders as a bare fragment on whatever page shows it, and the contract stores a " +
    "page, which renders as that page's path plus the fragment",
);

function judgeSiteHref(href: string, pagesByRoute: ReadonlyMap<string, SitePage | null>): Judgement {
  if (href === "" || href === "#") {
    return refused("it names no page: it links to wherever it happens to be rendered");
  }
  if (!href.startsWith("/") || href.startsWith("//")) {
    return refused("it is not a path on this site; only a path written from the root is resolved");
  }
  const hash = href.indexOf("#");
  const beforeHash = hash === -1 ? href : href.slice(0, hash);
  if (beforeHash.includes("?")) {
    return refused("it carries a query string, which a field stores only from an allowlist the converter does not infer");
  }
  const page = pagesByRoute.get(beforeHash);
  if (page === null) {
    return refused(`'${beforeHash}' is the path of more than one route, so it names no one page`);
  }
  if (page === undefined) {
    return refused(
      `'${beforeHash}' is not the path of a declared page, written exactly ` +
        "(a trailing slash, case, encoding or a template's detail page is a different string)",
    );
  }
  if (hash === -1) {
    return { kind: "page", destination: { kind: "page", pageId: page.binding.pageId, fragment: null } };
  }
  return judgeFragment(page, href.slice(hash + 1));
}

function codeOwnedFinding(candidate: LinkCandidate, href: string, reason: string): Finding {
  return {
    code: "LINK_DESTINATION_CODE_OWNED",
    anchor: renderAnchor(candidate.anchor),
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `The link to '${href}' stays in code and is not proposed: ${reason}. ` +
      "To make it editable, link to a declared page's exact path (plus a fragment that " +
      "page renders), or leave it as code.",
  };
}

/** The href a same-site destination was written as, judged; null for an off-site one. */
function judgeLink(
  candidate: LinkCandidate,
  pagesByRoute: ReadonlyMap<string, SitePage | null>,
): { readonly href: string; readonly judgement: Judgement } | null {
  const destination = candidate.destination;
  if (destination.kind === "fragment") {
    return { href: `#${destination.fragment}`, judgement: BARE_FRAGMENT };
  }
  if (destination.kind === "site_href") {
    return { href: destination.href, judgement: judgeSiteHref(destination.href, pagesByRoute) };
  }
  return null;
}

export function resolveSiteLinks(
  candidates: readonly Candidate[],
  pages: readonly SitePage[],
): SiteLinkResolution {
  // Two pages claiming one path cannot both be its destination, so the path
  // names neither.
  const pagesByRoute = new Map<string, SitePage | null>();
  for (const page of pages) {
    const path = page.binding.routePath;
    pagesByRoute.set(path, pagesByRoute.has(path) ? null : page);
  }
  const resolved: Candidate[] = [];
  const findings: Finding[] = [];
  for (const candidate of candidates) {
    const judged = candidate.kind === "link" ? judgeLink(candidate, pagesByRoute) : null;
    if (candidate.kind !== "link" || judged === null) {
      resolved.push(candidate);
    } else if (judged.judgement.kind === "refused") {
      findings.push(codeOwnedFinding(candidate, judged.href, judged.judgement.reason));
    } else {
      resolved.push({ ...candidate, destination: judged.judgement.destination, ownership: "customer_editable" });
    }
  }
  return { candidates: resolved, findings };
}

/** The declared pages with the ids each renders, from the declarations each route renders. */
export function sitePagesOf(
  routes: readonly { readonly binding: PageBinding; readonly components: readonly ComponentDeclaration[] }[],
): readonly SitePage[] {
  return routes.map((route) => ({
    binding: route.binding,
    ids: renderedIds(route.binding, route.components),
  }));
}

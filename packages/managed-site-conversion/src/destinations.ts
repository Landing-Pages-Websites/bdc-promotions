import ts from "typescript";

import { nameIfDurable, type AnchorName } from "./anchor-name.js";
import type { Ownership, RawDestination } from "./candidates.js";
import { resolvedStringValueOf, type ModuleConstants } from "./literals.js";

const FRAGMENT_PATTERN = /^#([A-Za-z0-9][A-Za-z0-9._:-]*)$/u;

/**
 * The contract's destination for one that names no page of this site: an
 * https URL, an email address or a phone number. Null for every destination
 * that names a place on this site, which only the site's pages can judge.
 */
export function offSiteDestination(
  raw: RawDestination,
):
  | { readonly kind: "external"; readonly url: string }
  | { readonly kind: "email"; readonly address: string }
  | { readonly kind: "phone"; readonly number: string }
  | null {
  switch (raw.kind) {
    case "external":
      return { kind: "external", url: raw.url };
    case "email":
      return { kind: "email", address: raw.address };
    case "phone":
      return { kind: "phone", number: raw.number };
    case "fragment":
    case "site_href":
    case "page":
      return null;
  }
}

/**
 * What an href string says on its own. Off-site schemes are read here; every
 * other string, `#`, `""`, a route, a relative path, `http:` and `//host`
 * included, is a `site_href` for `site-links.ts` to resolve against the
 * declared pages or refuse. Nothing is normalised: the contract stores a page
 * and renders its path, so only an href that IS that path survives.
 */
export function classifyHref(href: string): RawDestination {
  const fragment = FRAGMENT_PATTERN.exec(href);
  if (fragment !== null) return { kind: "fragment", fragment: fragment[1]! };
  if (href.startsWith("mailto:")) return { kind: "email", address: href.slice("mailto:".length) };
  if (href.startsWith("tel:")) return { kind: "phone", number: href.slice("tel:".length) };
  if (href.startsWith("https://")) return { kind: "external", url: href };
  return { kind: "site_href", href };
}

export function readDestination(
  expression: ts.Expression,
  constants: ModuleConstants,
): RawDestination | null {
  const href = resolvedStringValueOf(expression, constants);
  return href === null ? null : classifyHref(href);
}

/**
 * Whether a link's destination is the customer's to change, as the walker can
 * say it before the site's pages are known.
 *
 * Off-site destinations and a declared fragment are. A `site_href` is not YET:
 * `site-links.ts` grants it only once it resolves to exactly one declared page,
 * and refuses the link otherwise. This is the single reading for the walker:
 * `emit-contract.ts` grants `link.destination.edit` from `candidate.ownership`,
 * and `destinationDiscriminator` names a link from the same kinds.
 */
export function ownershipOfDestination(destination: RawDestination): Ownership {
  return destination.kind === "site_href" ? "code_owned_interface" : "customer_editable";
}

/**
 * The durable half of a destination, used to tell sibling links apart.
 *
 * A name a developer wrote (a module constant, a declared path such as
 * `ctas.primary.href`) is not part of the value the customer edits, so it names
 * the link whatever destination now sits behind it. Otherwise only a
 * `site_href` is named, and by `#` rather than by its value: it becomes a field
 * only as an internal destination whose authority is `internal_only`, so no
 * edit can make it anything but a link on this site, while the route itself is
 * the customer's to change and so names nothing. A fragment keeps no name, as
 * it always has, so fields minted for one keep their ids.
 */
export function destinationDiscriminator(
  destination: RawDestination,
  sourceName: AnchorName | null,
): AnchorName | null {
  if (sourceName !== null) return sourceName;
  return nameIfDurable("#", destination.kind === "site_href");
}

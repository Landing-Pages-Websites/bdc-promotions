import ts from "typescript";

import type { RawDestination } from "./candidates.js";
import { resolvedStringValueOf, type ModuleConstants } from "./literals.js";

const FRAGMENT_PATTERN = /^#([A-Za-z0-9][A-Za-z0-9._:-]*)$/u;
const ROUTE_PATTERN = /^\/[A-Za-z0-9._~\-/]*$/u;

export function readDestination(
  expression: ts.Expression,
  constants: ModuleConstants,
): RawDestination | null {
  const href = resolvedStringValueOf(expression, constants);
  if (href === null) return null;
  if (href === "#" || href === "") return { kind: "self" };
  const fragment = FRAGMENT_PATTERN.exec(href);
  if (fragment !== null) return { kind: "fragment", fragment: fragment[1]! };
  if (href.startsWith("mailto:")) return { kind: "email", address: href.slice("mailto:".length) };
  if (href.startsWith("tel:")) return { kind: "phone", number: href.slice("tel:".length) };
  if (href.startsWith("https://")) return { kind: "external", url: href };
  if (ROUTE_PATTERN.test(href)) return { kind: "self" };
  return null;
}

/**
 * The durable half of a destination, used to tell sibling links apart.
 *
 * A fragment, a route and a module constant name are all things a developer
 * named. A full external URL is NOT: a customer editing the destination would
 * silently re-identify the field, so it contributes no discriminator and the
 * link falls back to plain role uniqueness.
 */
export function destinationDiscriminator(
  destination: RawDestination,
  expression: ts.Expression,
): string | null {
  if (ts.isIdentifier(expression)) return `const:${expression.text}`;
  switch (destination.kind) {
    case "fragment":
      return `#${destination.fragment}`;
    case "self":
      return "#";
    case "email":
    case "phone":
    case "external":
      return null;
  }
}

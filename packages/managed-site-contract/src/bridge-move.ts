import { canonicalizeJson } from "./canonical.js";
import {
  isLatestBridgeVersion,
  isSupportedBridgeVersion,
  LATEST_BRIDGE_SRC,
  type ManagedSiteBridgeDescriptor,
} from "./contract.js";

type Bridge = NonNullable<ManagedSiteBridgeDescriptor>;

/** The descriptor without what a delivery change may alter: version, src, integrity. */
export function bridgeFixedPart(bridge: Bridge): unknown {
  const { delivery, ...rest } = bridge;
  return { ...rest, crossOrigin: delivery.crossOrigin, load: delivery.load };
}

/**
 * Whether `candidate` is production's bridge moved onto the unpinned `latest`
 * delivery and nothing else: production names a pinned version, the candidate
 * names exactly the `latest` URL with no `integrity`, and every other field of
 * the descriptor is identical. This is the one bridge change a contract may
 * make besides a declared one-version step; it never holds in the other
 * direction, and `latest` to `latest` is no change at all.
 *
 * The check reads the raw descriptor, not the parser's output, so a candidate
 * that skipped the parser (a wrong URL, a stray integrity) is refused here too.
 */
export function isBridgeMoveToLatest(
  production: ManagedSiteBridgeDescriptor | null,
  candidate: ManagedSiteBridgeDescriptor | null,
): boolean {
  if (production === null || candidate === null) return false;
  const from = production.delivery;
  const to: Record<string, unknown> = { ...candidate.delivery };
  if (!isSupportedBridgeVersion(from.version) || !isLatestBridgeVersion(to.version)) return false;
  if (to.src !== LATEST_BRIDGE_SRC || "integrity" in to) return false;
  return canonicalizeJson(bridgeFixedPart(production)) === canonicalizeJson(bridgeFixedPart(candidate));
}

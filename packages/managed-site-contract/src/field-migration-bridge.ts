import { canonicalizeJson } from "./canonical.js";
import { bridgeFixedPart, isBridgeMoveToLatest } from "./bridge-move.js";
import {
  isLatestBridgeVersion,
  isSupportedBridgeVersion,
  type LatestBridgeVersion,
  SUPPORTED_BRIDGE_VERSIONS,
  type ManagedSiteContractV1,
  type SupportedBridgeVersion,
} from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import type { ManagedSiteFieldMigrationV1 } from "./field-migration-schema.js";

/**
 * Whether the platform can serve this bridge delivery. Site Guard answers it
 * from the asset it actually serves; nothing here can, so it is injected and
 * has no default. A pinned version is asked with its integrity; the unpinned
 * `latest` delivery has none, so it is asked with `null`, and an admission that
 * does not know `latest` refuses it.
 */
export type ManagedSiteBridgeAdmission = (
  version: SupportedBridgeVersion | LatestBridgeVersion,
  integrity: string | null,
) => boolean;

export interface ManagedSiteFieldMigrationBridgeStepV1 {
  readonly from: SupportedBridgeVersion;
  readonly to: SupportedBridgeVersion | LatestBridgeVersion;
}

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

function assertDeclaredVersions(
  declared: NonNullable<ManagedSiteFieldMigrationV1["bridge"]>,
  production: SupportedBridgeVersion | LatestBridgeVersion,
  candidate: SupportedBridgeVersion | LatestBridgeVersion,
): void {
  const targetKnown = isSupportedBridgeVersion(declared.to) || isLatestBridgeVersion(declared.to);
  if (!isSupportedBridgeVersion(declared.from) || !targetKnown) {
    fail("MIGRATION_BRIDGE_UNSUPPORTED", "Declared bridge version is not supported");
  }
  if (declared.from !== production || declared.to !== candidate) {
    fail("MIGRATION_BRIDGE_MISMATCH", "Declared bridge step is not the contracts' step");
  }
}

function assertForwardStep(
  from: SupportedBridgeVersion,
  to: SupportedBridgeVersion | LatestBridgeVersion,
): void {
  // Any pinned version may move straight onto `latest`; nothing is skipped
  // because `latest` is not a point in the pinned sequence.
  if (isLatestBridgeVersion(to)) return;
  const distance = SUPPORTED_BRIDGE_VERSIONS.indexOf(to) - SUPPORTED_BRIDGE_VERSIONS.indexOf(from);
  if (distance <= 0) {
    fail("MIGRATION_BRIDGE_DOWNGRADE", `Bridge moves backwards: ${from} to ${to}`);
  }
  if (distance > 1) {
    fail("MIGRATION_BRIDGE_GAP", `Bridge skips a version: ${from} to ${to}`);
  }
}

function unchangedBridge(
  declaration: ManagedSiteFieldMigrationV1,
): null {
  if (declaration.bridge !== undefined) {
    fail("MIGRATION_BRIDGE_MISMATCH", "A bridge step is declared but the bridge is unchanged");
  }
  return null;
}

/**
 * The runtime may change only along a declared forward step of one supported
 * version that the platform admits; the rest of the descriptor is fixed.
 */
export function assertManagedSiteFieldMigrationBridgeV1(
  production: ManagedSiteContractV1,
  candidate: ManagedSiteContractV1,
  declaration: ManagedSiteFieldMigrationV1,
  admitBridge: ManagedSiteBridgeAdmission,
): ManagedSiteFieldMigrationBridgeStepV1 | null {
  if (sameJson(production.bridge, candidate.bridge)) return unchangedBridge(declaration);
  if (declaration.bridge === undefined) {
    return fail("MIGRATION_BRIDGE_UNDECLARED", "The bridge changed without a declared step");
  }
  if (production.bridge === null || candidate.bridge === null) {
    return fail("MIGRATION_BRIDGE_UNSUPPORTED", "A bridge cannot be added or removed by migration");
  }
  const from = production.bridge.delivery.version;
  const to = candidate.bridge.delivery.version;
  assertDeclaredVersions(declaration.bridge, from, to);
  if (isLatestBridgeVersion(from)) {
    fail("MIGRATION_BRIDGE_DOWNGRADE", `Bridge moves backwards: ${from} to ${to}`);
  }
  assertForwardStep(from, to);
  if (!sameJson(bridgeFixedPart(production.bridge), bridgeFixedPart(candidate.bridge))) {
    fail("MIGRATION_BRIDGE_DESCRIPTOR_CHANGED", "Only the bridge version may change");
  }
  if (isLatestBridgeVersion(to) && !isBridgeMoveToLatest(production.bridge, candidate.bridge)) {
    fail("MIGRATION_BRIDGE_DESCRIPTOR_CHANGED", "The latest delivery is exactly its URL with no integrity");
  }
  const integrity = "integrity" in candidate.bridge.delivery ? candidate.bridge.delivery.integrity : null;
  if (admitBridge(to, integrity) !== true) {
    fail("MIGRATION_BRIDGE_UNSUPPORTED", `The platform does not serve bridge ${to} at that integrity`);
  }
  return { from, to };
}

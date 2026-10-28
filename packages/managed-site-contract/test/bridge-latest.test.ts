import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bridgeSrcFor,
  LATEST_BRIDGE_SRC,
  ManagedSiteContractError,
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  parseManagedSiteFieldMigrationV1,
  SUPPORTED_BRIDGE_VERSIONS,
  validateManagedSiteContractV1Compatibility,
} from "../src/index.js";
import type { ManagedSiteContractV1 } from "../src/index.js";
import { assertManagedSiteFieldMigrationBridgeV1 } from "../src/field-migration-bridge.js";
import { contentSemanticsFixture, type ContentSemanticsFixture } from "./content-semantics-fixture.js";

type Json = Record<string, unknown>;

const HASH = `sha384-${"A".repeat(64)}`;
const OTHER_HASH = `sha384-${"B".repeat(64)}`;
const LATEST_DELIVERY: Json = { version: "latest", src: LATEST_BRIDGE_SRC, crossOrigin: "anonymous", load: "head_defer" };

function pinned(version: string, integrity = HASH): Json {
  return { version, src: bridgeSrcFor(version as "v7"), integrity, crossOrigin: "anonymous", load: "head_defer" };
}

function withDelivery(delivery: Json): ContentSemanticsFixture {
  const fixture = contentSemanticsFixture();
  (fixture.contract.bridge as Json).delivery = delivery;
  return fixture;
}

function parsed(fixture: ContentSemanticsFixture) {
  return {
    contract: parseManagedSiteContractV1(fixture.contract),
    content: parseManagedSiteContentDocument(fixture.content),
  };
}

function compatibility(production: Json, candidate: Json) {
  const before = parsed(withDelivery(production));
  const after = parsed(withDelivery(candidate));
  return validateManagedSiteContractV1Compatibility(before.contract, before.content, after.contract, after.content);
}

function refusedWith(run: () => unknown, code: string): void {
  assert.throws(run, (error: unknown) => error instanceof ManagedSiteContractError && error.code === code);
}

describe("the latest delivery in a contract", () => {
  it("is exactly its URL with no integrity", () => {
    parsed(withDelivery(LATEST_DELIVERY));
    assert.equal(LATEST_BRIDGE_SRC, "https://app.gomega.ai/review-bridge/latest/review-bridge.js");
  });

  const refused: readonly [string, Json][] = [
    ["another path on the host", { ...LATEST_DELIVERY, src: "https://app.gomega.ai/review-bridge/latest/other.js" }],
    ["another host", { ...LATEST_DELIVERY, src: "https://evil.example/review-bridge/latest/review-bridge.js" }],
    ["a pinned URL", { ...LATEST_DELIVERY, src: bridgeSrcFor("v13") }],
    ["an integrity", { ...LATEST_DELIVERY, integrity: HASH }],
    ["another crossOrigin", { ...LATEST_DELIVERY, crossOrigin: "use-credentials" }],
    ["another load", { ...LATEST_DELIVERY, load: "body_end" }],
    ["a stray key", { ...LATEST_DELIVERY, extra: true }],
    ["a pinned version on the latest URL", { ...pinned("v13"), src: LATEST_BRIDGE_SRC }],
    ["a pinned version with no integrity", { version: "v13", src: bridgeSrcFor("v13"), crossOrigin: "anonymous", load: "head_defer" }],
  ];
  for (const [name, delivery] of refused) {
    it(`refuses ${name}`, () => {
      assert.throws(() => parsed(withDelivery(delivery)));
    });
  }
});

describe("ordinary compatibility of a bridge change", () => {
  for (const version of SUPPORTED_BRIDGE_VERSIONS) {
    it(`admits ${version} to latest`, () => {
      assert.equal(compatibility(pinned(version), LATEST_DELIVERY).kind, "compatible");
    });
    it(`refuses latest back to ${version}`, () => {
      refusedWith(() => compatibility(LATEST_DELIVERY, pinned(version)), "COMPATIBILITY_RUNTIME_CHANGED");
    });
  }

  it("keeps latest to latest unchanged", () => {
    assert.equal(compatibility(LATEST_DELIVERY, LATEST_DELIVERY).kind, "compatible");
  });

  it("still refuses a pinned version change and a wrong hash", () => {
    refusedWith(() => compatibility(pinned("v8"), pinned("v9")), "COMPATIBILITY_RUNTIME_CHANGED");
    refusedWith(() => compatibility(pinned("v13"), pinned("v13", OTHER_HASH)), "COMPATIBILITY_RUNTIME_CHANGED");
  });

  it("refuses the move to latest when anything else about the runtime changes", () => {
    const production = parsed(withDelivery(pinned("v13")));
    const candidate = withDelivery(LATEST_DELIVERY);
    (candidate.contract.adapter as Json).kind = "astro";
    const after = parsed(candidate);
    refusedWith(
      () => validateManagedSiteContractV1Compatibility(production.contract, production.content, after.contract, after.content),
      "COMPATIBILITY_RUNTIME_CHANGED",
    );
  });
});

function contractWith(delivery: Json, change: Json = {}): ManagedSiteContractV1 {
  return {
    contractId: "contract_x",
    bridge: {
      reviewProtocol: 1,
      editProtocol: 2,
      annotationVersion: 1,
      framing: "authenticated_preview_gateway",
      delivery,
      ...change,
    },
  } as unknown as ManagedSiteContractV1;
}

function declarationFor(from: string, to: string) {
  return parseManagedSiteFieldMigrationV1({
    schemaVersion: "1.0",
    from: { contractSha256: "a".repeat(64), contentSha256: "b".repeat(64) },
    bridge: { from, to },
    steps: [],
  });
}

const admitEverything = () => true;

describe("a declared bridge step to latest", () => {
  for (const version of SUPPORTED_BRIDGE_VERSIONS) {
    it(`admits ${version} to latest, however many versions apart`, () => {
      const step = assertManagedSiteFieldMigrationBridgeV1(
        contractWith(pinned(version)),
        contractWith(LATEST_DELIVERY),
        declarationFor(version, "latest"),
        admitEverything,
      );
      assert.deepEqual(step, { from: version, to: "latest" });
    });
  }

  it("asks the platform about latest with no integrity, and refuses when it declines", () => {
    const asked: unknown[] = [];
    const run = (admit: (version: string, integrity: string | null) => boolean) =>
      assertManagedSiteFieldMigrationBridgeV1(contractWith(pinned("v8")), contractWith(LATEST_DELIVERY), declarationFor("v8", "latest"), admit);
    run((version, integrity) => (asked.push([version, integrity]), true));
    assert.deepEqual(asked, [["latest", null]]);
    refusedWith(() => run(() => false), "MIGRATION_BRIDGE_UNSUPPORTED");
  });

  const refused: readonly [string, Json, Json, string, string, string][] = [
    ["latest on another URL", pinned("v8"), { ...LATEST_DELIVERY, src: "https://app.gomega.ai/review-bridge/latest/x.js" }, "v8", "latest", "MIGRATION_BRIDGE_DESCRIPTOR_CHANGED"],
    ["latest on another host", pinned("v8"), { ...LATEST_DELIVERY, src: "https://evil.example/review-bridge/latest/review-bridge.js" }, "v8", "latest", "MIGRATION_BRIDGE_DESCRIPTOR_CHANGED"],
    ["latest carrying an integrity", pinned("v8"), { ...LATEST_DELIVERY, integrity: HASH }, "v8", "latest", "MIGRATION_BRIDGE_DESCRIPTOR_CHANGED"],
    ["latest declared as another step", pinned("v8"), LATEST_DELIVERY, "v8", "v9", "MIGRATION_BRIDGE_MISMATCH"],
    ["latest from a mismatched declared version", pinned("v8"), LATEST_DELIVERY, "v9", "latest", "MIGRATION_BRIDGE_MISMATCH"],
    ["moving back from latest to a pinned version", LATEST_DELIVERY, pinned("v13"), "v13", "v13", "MIGRATION_BRIDGE_MISMATCH"],
    ["moving back declared from latest", LATEST_DELIVERY, pinned("v13"), "latest", "v13", "MIGRATION_BRIDGE_UNSUPPORTED"],
  ];
  for (const [name, from, to, declaredFrom, declaredTo, code] of refused) {
    it(`refuses ${name}`, () => {
      refusedWith(
        () => assertManagedSiteFieldMigrationBridgeV1(contractWith(from), contractWith(to), {
          schemaVersion: "1.0",
          from: { contractSha256: "a".repeat(64), contentSha256: "b".repeat(64) },
          bridge: { from: declaredFrom, to: declaredTo },
          steps: [],
        } as never, admitEverything),
        code,
      );
    });
  }

  it("refuses a descriptor change beside the move to latest", () => {
    refusedWith(
      () => assertManagedSiteFieldMigrationBridgeV1(contractWith(pinned("v8")), contractWith(LATEST_DELIVERY, { editProtocol: 3 }), declarationFor("v8", "latest"), admitEverything),
      "MIGRATION_BRIDGE_DESCRIPTOR_CHANGED",
    );
  });

  it("keeps the pinned rules: one version forward, no gap, no downgrade, a platform-served hash", () => {
    const step = (from: string, to: string, admit = admitEverything) =>
      assertManagedSiteFieldMigrationBridgeV1(contractWith(pinned(from)), contractWith(pinned(to)), declarationFor(from, to), admit);
    assert.deepEqual(step("v8", "v9"), { from: "v8", to: "v9" });
    refusedWith(() => step("v8", "v10"), "MIGRATION_BRIDGE_GAP");
    refusedWith(() => step("v9", "v8"), "MIGRATION_BRIDGE_DOWNGRADE");
    refusedWith(() => step("v8", "v9", () => false), "MIGRATION_BRIDGE_UNSUPPORTED");
  });

  it("refuses a declared latest as a step's origin at the schema", () => {
    assert.throws(() => declarationFor("latest", "v13"));
  });
});

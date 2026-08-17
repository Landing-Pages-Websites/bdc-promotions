import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseManagedFieldDescriptor,
  parseManagedSiteContractV1,
  validateManagedFieldValue,
} from "../src/index.js";
import {
  linkContentValue,
  linkField,
  managedSiteContract,
  stableId,
} from "./schema-fixtures.js";

const BRIDGE_SRC = "https://app.gomega.ai/review-bridge/v6/review-bridge.js";

function withBridgeDelivery(patch: Record<string, unknown>): Record<string, unknown> {
  const contract = managedSiteContract();
  const bridge = contract.bridge as Record<string, unknown>;
  bridge.delivery = { ...(bridge.delivery as object), ...patch };
  return contract;
}

function withRoute(route: Record<string, unknown>): Record<string, unknown> {
  const contract = managedSiteContract();
  (contract.pages as Record<string, unknown>[])[0].route = route;
  return contract;
}

function generatedRoute(pattern: string): Record<string, unknown> {
  return {
    kind: "generated",
    pattern,
    collectionId: stableId("collection"),
    routeKeyFieldId: stableId("field"),
  };
}

describe("contract-local identity boundaries", () => {
  it("pins edit protocol 2 to the one promoted bridge source", () => {
    assert.doesNotThrow(() =>
      parseManagedSiteContractV1(withBridgeDelivery({ version: "v6", src: BRIDGE_SRC })),
    );
    for (const version of ["v1", "v3", "v4", "v5", "v999"]) {
      assert.throws(() => parseManagedSiteContractV1(withBridgeDelivery({ version })));
    }
    for (const src of [
      "https://evil.example/review-bridge/v6/review-bridge.js",
      "https://app.gomega.ai/review-bridge/v3/review-bridge.js",
      "https://app.gomega.ai/review-bridge/v4/review-bridge.js",
      "https://app.gomega.ai/review-bridge/v6/alternate.js",
      `${BRIDGE_SRC}?candidate=1`,
      `${BRIDGE_SRC}#alternate`,
      "https://user@app.gomega.ai/review-bridge/v6/review-bridge.js",
      "http://app.gomega.ai/review-bridge/v6/review-bridge.js",
    ]) {
      assert.throws(() => parseManagedSiteContractV1(withBridgeDelivery({ src })));
    }
  });

  it("accepts only canonical static routes and generated patterns", () => {
    for (const path of ["/", "/about", "/services/gutters-2"]) {
      assert.doesNotThrow(() =>
        parseManagedSiteContractV1(withRoute({ kind: "static", path })),
      );
    }
    for (const pattern of ["/services/[slug]", "/[location]/gutters/[service]"]) {
      assert.doesNotThrow(() =>
        parseManagedSiteContractV1(withRoute(generatedRoute(pattern))),
      );
    }
    const ambiguous = [
      "/../",
      "/./about",
      "/%2e/about",
      "/%252e/about",
      "//about",
      "/white space",
      "/about#team",
      "/%00/about",
      "/bad%escape",
      "/back\\slash",
    ];
    for (const path of ambiguous) {
      assert.throws(() =>
        parseManagedSiteContractV1(withRoute({ kind: "static", path })),
      );
      assert.throws(() =>
        parseManagedSiteContractV1(withRoute(generatedRoute(path))),
      );
    }
    for (const pattern of ["/services", "/services/[slug", "/services/slug]", "/[...slug]", "/{slug}"]) {
      assert.throws(() => parseManagedSiteContractV1(withRoute(generatedRoute(pattern))));
    }
  });

  it("uses one canonical fragment grammar for declarations and destinations", () => {
    for (const fragment of ["contact", "service-area", "faq:item.2"]) {
      const field = linkField();
      (field.constraints as Record<string, unknown>).allowedFragments = [fragment];
      assert.doesNotThrow(() => parseManagedFieldDescriptor(field));
      assert.doesNotThrow(() =>
        validateManagedFieldValue(
          field,
          linkContentValue({
            label: "Jump",
            destination: {
              kind: "internal",
              pageId: stableId("page"),
              fragment,
            },
            target: "same_window",
          }),
        ),
      );
    }
    for (const fragment of ["../", "%2e", "%252e", "two words", "#top", "%00", "%", "bad/part"]) {
      const field = linkField();
      (field.constraints as Record<string, unknown>).allowedFragments = [fragment];
      assert.throws(() => parseManagedFieldDescriptor(field));
    }
  });
});

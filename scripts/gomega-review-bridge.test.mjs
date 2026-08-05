import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../src/components/analytics/GomegaReviewBridge.tsx",
  import.meta.url
);
const layoutPath = new URL("../src/app/layout.tsx", import.meta.url);
const bridgeSource = "https://app.gomega.ai/review-bridge/v1/review-bridge.js";
const bridgeIntegrity =
  "sha384-e+tDMiCLKMzL5fTMLVKEg2xAWTNzUZt+V+mo5WoMLZeijU/HS4Mt6qQj/SvE6/zi";

test("pins the credential-free Gomega review bridge with exact script attributes", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.ok(component.includes(bridgeSource));
  assert.ok(component.includes(bridgeIntegrity));
  assert.match(component, /src=\{GOMEGA_REVIEW_BRIDGE_SOURCE\}/u);
  assert.match(component, /integrity=\{GOMEGA_REVIEW_BRIDGE_INTEGRITY\}/u);
  assert.match(component, /crossOrigin="anonymous"/u);
  assert.match(component, /\bdefer\b/u);
  assert.match(component, /strategy="afterInteractive"/u);
});

test("mounts the bridge once from the root layout", async () => {
  const layout = await readFile(layoutPath, "utf8");

  assert.match(
    layout,
    /import \{ GomegaReviewBridge \} from "@\/components\/analytics\/GomegaReviewBridge";/u
  );
  assert.equal((layout.match(/<GomegaReviewBridge \/>/gu) ?? []).length, 1);
});

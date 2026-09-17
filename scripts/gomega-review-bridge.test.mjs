import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutPath = new URL("../src/app/layout.tsx", import.meta.url);
const exactBridge = '<script src="https://app.gomega.ai/review-bridge/v7/review-bridge.js" integrity="sha384-VTUzMpjogRuXFNsE1df8N2HoJyWhNcCkGaUa7aulmDjCmXVoQ4UpQB1xMTrOp3MJ" crossorigin="anonymous" defer></script>';

test("renders the promoted bridge exactly once in the root head", async () => {
  const layout = await readFile(layoutPath, "utf8");
  assert.equal((layout.match(/review-bridge\/v7\/review-bridge\.js/gu) ?? []).length, 1);
  assert.ok(layout.includes(exactBridge));
  assert.match(layout, /<head[\s\S]*dangerouslySetInnerHTML/gu);
  assert.doesNotMatch(layout, /GomegaReviewBridge/u);
});

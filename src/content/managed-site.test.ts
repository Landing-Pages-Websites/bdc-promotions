import assert from "node:assert/strict";
import test from "node:test";

import home from "./pages/home.json";
import site from "./site.json";

test("exposes every BDC Promotions home section in reference order", () => {
  assert.equal(site.identity.telephone, "352-207-1074");
  assert.equal(home.values.items.length, 4);
  assert.equal(home.services.items.length, 3);
  assert.equal(home.focus.items.length, 4);
  assert.equal(home.process.items.length, 4);
  assert.equal(home.faq.items.length, 3);
  // Owner-approved copy (PR #43/#44) replaced the older "appointments" heading.
  assert.match(home.contact.heading, /right approach for your dealership/i);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  EMAIL_PATTERN,
  isValidEmail,
  isValidPhone,
  parseLeadFields,
} from "./leadValidation.ts";

test("isValidEmail rejects no-TLD garbage the HTML5 type=email accepts", () => {
  assert.equal(isValidEmail("you@company.com"), true);
  assert.equal(isValidEmail("me@x"), false);
  assert.equal(isValidEmail("foo@bar"), false);
  assert.equal(EMAIL_PATTERN.includes("^"), false);
});

test("phone must be exactly 10 digits, not optional", () => {
  assert.equal(isValidPhone("(555) 123-4567"), true);
  assert.equal(isValidPhone("555123"), false);
  const missingPhone = parseLeadFields({
    firstName: "Weston",
    lastName: "Hayes",
    email: "weston@example.com",
    phone: "",
  });
  assert.equal(missingPhone.ok, false);
  const missingEmail = parseLeadFields({
    firstName: "Weston",
    lastName: "Hayes",
    email: "",
    phone: "(555) 123-4567",
  });
  assert.equal(missingEmail.ok, false);
});

test("parseLeadFields requires firstName lastName email and phone", () => {
  const ok = parseLeadFields({
    firstName: "Charlotte",
    lastName: "Davis",
    email: "charlotte@example.com",
    phone: "4055551212",
    budget: "yes",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.fields.phone, "4055551212");
    assert.equal(ok.fields.extra.budget, "yes");
  }
});

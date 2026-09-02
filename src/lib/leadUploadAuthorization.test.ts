import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * Guards the ordering rule that makes attachments safe.
 *
 * Uploads must be signed before the form is submitted, because the submission
 * names the keys it uploaded. A Turnstile token is single-use, so if signing
 * spent the submission's token then any signing failure would leave a valid
 * enquiry with nothing to present and it would be refused — the visitor sees a
 * security-check error on a form they filled in correctly.
 *
 * The rule: signing uses a SECOND token obtained for it, and the submission's
 * own token is never spent on an upload.
 *
 * That is an ordering property across three files, not something a unit test of
 * any one of them can observe, so it is asserted against the source. A future
 * change that shares one token between both calls fails here.
 */
const HOOK = readFileSync("src/hooks/useMegaLeadForm.ts", "utf8");
const FORM = readFileSync("src/components/LeadForm.tsx", "utf8");
const SUBMIT_ROUTE = readFileSync("src/app/api/lead/route.ts", "utf8");
const SIGN_ROUTE = readFileSync("src/app/api/lead/upload-url/route.ts", "utf8");

test("signing takes a token of its own, not the submission's", () => {
  // `formData.turnstileToken` is what the submission depends on. If it were
  // handed to the signing helper, a signing failure would cost the enquiry.
  assert.ok(
    !/uploadAttachments\([^)]*formData\.turnstileToken/s.test(HOOK),
    "signing must not be handed the submission's own token",
  );
  assert.match(
    HOOK,
    /uploadAttachments\(files, signingToken, binding\)/,
    "signing should use the separately obtained token",
  );
});

test("attachments are skipped when no signing token could be obtained", () => {
  // Without a second token the files are dropped, never the submission.
  assert.match(HOOK, /signingToken !== null/);
});

test("the form obtains the signing token by resetting the widget", () => {
  assert.match(FORM, /requestSigningToken/);
  assert.match(FORM, /turnstileRef\.current\?\.reset\(\)/);
  // Bounded, so a challenge that never completes cannot hang the submission.
  assert.match(FORM, /SIGNING_TOKEN_TIMEOUT_MS/);
});

test("the widget callback does not overwrite the submission's token", () => {
  // A reset fires the same callback. Without routing that to the waiting
  // resolver, the fresh token would replace the one the submission holds and
  // the two calls would again share a single challenge.
  assert.match(FORM, /signingTokenResolve/);
});

test("both routes verify a challenge and act on the result", () => {
  // Presence of the call proves nothing: a route could verify and ignore the
  // answer. Each must also refuse on failure, so the assertion is on the
  // refusal, not on the call.
  for (const [name, source] of [
    ["submit route", SUBMIT_ROUTE],
    ["signing route", SIGN_ROUTE],
  ] as const) {
    assert.match(source, /verifyTurnstileToken/, name);
    assert.match(
      source,
      /const challenge = await verifyTurnstileToken\(/,
      `${name} must keep the challenge result`,
    );
    assert.match(
      source,
      /if \(!challenge\.ok\) \{\s*return jsonError\(challenge\.error, 403\);/,
      `${name} must refuse when the challenge fails`,
    );
  }

  // The capability is bound to the submission's own challenge, which Cloudflare
  // makes single-use, so there is no free-standing authorization to replay.
  for (const [name, source] of [
    ["submit route", SUBMIT_ROUTE],
    ["signing route", SIGN_ROUTE],
    ["hook", HOOK],
  ] as const) {
    assert.ok(
      !/ticket/i.test(source),
      `${name} must not reintroduce an unbound authorization token`,
    );
  }
});

test("declared upload keys are honoured only with a bound capability", () => {
  // Forwarding `parsed.fields.uploadKeys` directly would accept any
  // syntactically valid key the caller supplied, which is the whole defect.
  assert.match(SUBMIT_ROUTE, /uploadCapabilityAuthorizes\(/);
  assert.match(
    SUBMIT_ROUTE,
    /\{ \.\.\.parsed\.fields, uploadKeys \}/,
    "the forwarded keys must be the capability-checked set",
  );
  assert.ok(
    !/forwardLeadToKeystone\(parsed\.fields,/.test(SUBMIT_ROUTE),
    "unchecked fields must not be forwarded",
  );
});

test("the capability is bound by hash, never by the submission's token", () => {
  // The signing route must never receive the token the submission depends on.
  assert.match(SIGN_ROUTE, /submissionBinding/);
  assert.match(SIGN_ROUTE, /\[0-9a-f\]\{64\}/);
  assert.match(HOOK, /submissionBinding\(submitToken\)/);
});

test("the signing route verifies before it signs", () => {
  // Verification after the signing call would hand out upload permission to an
  // unverified caller and only then check.
  const verifyAt = SIGN_ROUTE.indexOf("verifyTurnstileToken");
  const signAt = SIGN_ROUTE.indexOf("UPLOAD_URL_ENDPOINT, {");
  assert.ok(verifyAt > -1 && signAt > -1);
  assert.ok(verifyAt < signAt, "challenge must be verified before signing");
});

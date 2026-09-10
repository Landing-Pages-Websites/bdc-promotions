import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// The paid landing Vercel project (info.bdcpromotions.com) and the primary
// site (bdcpromotions.com) share one repo/config. A host-scoped root redirect
// must send only the landing host's "/" to the validated LP at /lp, while the
// primary host's "/" keeps serving the homepage. See next.config.ts.
const LP_HOST = "info.bdcpromotions.com";
const LP_DESTINATION = "/lp";
const TEMPORARY_307 = false; // Next: permanent:false => 307 (temporary).

/**
 * Evaluates the real next.config.ts via tsx and returns its redirects() output.
 * Running the actual config (not a regex over source text) proves the rule the
 * app ships. tsx double-wraps a TS default export, so unwrap defensively.
 */
function loadRedirects() {
  const evalSource = [
    'import * as ns from "./next.config.ts";',
    "void (async () => {",
    "  const mod = ns.default ?? ns;",
    "  const cfg = typeof mod.redirects === 'function' ? mod : mod.default;",
    "  const redirects = await cfg.redirects();",
    "  process.stdout.write(JSON.stringify(redirects));",
    "})();",
  ].join("\n");
  const result = spawnSync(
    "npx",
    ["tsx", "--eval", evalSource],
    { cwd: root, encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`tsx failed to load next.config.ts: ${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

test("root redirect is scoped to the landing host only", () => {
  const redirects = loadRedirects();
  const rootRules = redirects.filter((rule) => rule.source === "/");

  assert.equal(rootRules.length, 1, "exactly one root-path redirect expected");
  const [rule] = rootRules;

  assert.equal(rule.destination, LP_DESTINATION);
  assert.equal(rule.permanent, TEMPORARY_307, "corrective rule must be a 307");
  assert.deepEqual(
    rule.has,
    [{ type: "host", value: LP_HOST }],
    "root redirect must be gated on the landing host",
  );
});

test("no rule redirects the primary domain root", () => {
  const redirects = loadRedirects();
  // A root redirect without a host condition would also fire on
  // bdcpromotions.com and hide the primary homepage — the exact regression
  // this rule guards against.
  const unconditionalRoot = redirects.filter(
    (rule) => rule.source === "/" && !rule.has,
  );
  assert.equal(unconditionalRoot.length, 0);
});

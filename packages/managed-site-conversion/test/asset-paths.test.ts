/**
 * An asset path is the configured `assetRoot` joined to whatever the source
 * already calls the file, and the contract bounds the result. The root alone was
 * checked, so the join was never checked at all: a root that loaded cleanly
 * could produce a path the standard cannot carry, and the proposal then failed
 * validation naming the emitted path rather than the setting that caused it.
 *
 * Both emitters build that path, so both are held to this. The load-time budget
 * in `config.ts` covers the floor -- a single file name -- and everything longer
 * is decided here, where the actual path is known.
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  MAX_REPOSITORY_PATH_BYTES,
  MAX_REPOSITORY_PATH_SEGMENT_BYTES,
} from "@landing-pages-websites/managed-site-contract";

import { assetRepositoryPath, assetRootIsAtFault } from "../src/paths.js";
import { run, workspace } from "./support/proposals.js";

const CONFIG = JSON.parse(
  JSON.stringify({
    contentRoot: "src/content",
    assetRoot: "public",
  }),
) as Record<string, unknown>;

/**
 * The longest asset root the loader accepts: everything left once one file name
 * at the segment cap is reserved. Split across two segments so the root is
 * refusable only for what is appended to it.
 */
const LONGEST_ASSET_ROOT_BYTES =
  MAX_REPOSITORY_PATH_BYTES - 1 - MAX_REPOSITORY_PATH_SEGMENT_BYTES;
const LONGEST_ASSET_ROOT = `${"a".repeat(
  Math.floor((LONGEST_ASSET_ROOT_BYTES - 1) / 2),
)}/${"b".repeat(Math.ceil((LONGEST_ASSET_ROOT_BYTES - 1) / 2))}`;

function proposalWith(assetRoot: string, imageSource: string): ReturnType<typeof run> {
  const space = workspace("site", { ...CONFIG, assetRoot });
  const page = join(space.repositoryRoot, "app", "page.tsx");
  const source = readFileSync(page, "utf8");
  assert.ok(source.includes('src="/hero.png"'), "the fixture still carries the hero image");
  writeFileSync(page, source.replace('src="/hero.png"', `src="${imageSource}"`), "utf8");
  return run(space);
}

describe("an asset path the standard cannot carry", () => {
  // Long enough that the join overflows even though each half is fine on its own:
  // the root is at its maximum, and the file path is a valid one in the repo.
  const nested = `/${Array.from({ length: 7 }, (_unused, index) => `d${index}`.repeat(20)).join("/")}/hero.png`;

  it("is reported against the source, not thrown out of the emitter", () => {
    const proposal = proposalWith(LONGEST_ASSET_ROOT, nested);
    const finding = proposal.report.findings.find(
      (entry) => entry.code === "ASSET_PATH_UNREPRESENTABLE",
    );

    assert.notEqual(finding, undefined, "the overlong asset path is reported");
    assert.match(finding?.decision ?? "", /assetRoot/u);
    assert.match(finding?.decision ?? "", /hero\.png/u);
  });

  /**
   * The difference the report has to state: one of these is fixed by editing the
   * config, the other by moving a file. Naming the root for a file that is too
   * long on its own would send a person to change a setting that was never the
   * problem.
   */
  it("blames the file when the file is at fault, whatever the root", () => {
    const overlongName = `/${"a".repeat(MAX_REPOSITORY_PATH_SEGMENT_BYTES + 1)}.png`;
    const proposal = proposalWith("public", overlongName);
    const finding = proposal.report.findings.find(
      (entry) => entry.code === "ASSET_PATH_UNREPRESENTABLE",
    );

    assert.notEqual(finding, undefined, "the unrepresentable file name is reported");
    assert.doesNotMatch(finding?.decision ?? "", /assetRoot/u);
  });

  /**
   * One asset nobody can address is one decision, not a dead run. The proposer's
   * whole contract with a reader is that it reports what it refuses and proposes
   * the rest.
   */
  it("still proposes the rest of the site", () => {
    const proposal = proposalWith(LONGEST_ASSET_ROOT, nested);

    assert.ok(proposal.report.findings.length > 1, "other decisions are still reported");
    assert.ok(proposal.content.values.length > 0, "content is still proposed");
  });

  it("reads an ordinary asset path unchanged", () => {
    assert.equal(assetRepositoryPath("public", "/hero.png"), "public/hero.png");
    assert.equal(assetRepositoryPath("public", "hero.png"), "public/hero.png");
    assert.equal(assetRootIsAtFault("public", "/hero.png"), false);
  });

  it("distinguishes a root that is at fault from a file that is", () => {
    const overlongName = `/${"a".repeat(MAX_REPOSITORY_PATH_SEGMENT_BYTES + 1)}.png`;

    assert.equal(assetRepositoryPath(LONGEST_ASSET_ROOT, nested), null);
    assert.equal(assetRootIsAtFault(LONGEST_ASSET_ROOT, nested), true);
    assert.equal(assetRepositoryPath("public", overlongName), null);
    assert.equal(assetRootIsAtFault("public", overlongName), false);
  });
});

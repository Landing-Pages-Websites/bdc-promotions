import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { Ajv2020 } from "ajv/dist/2020.js";

import { generateManagedSiteFieldMigrationJsonSchemaV1 } from "../src/field-migration-json-schema.js";
import { canonicalizeJson, mintStableId, parseManagedSiteFieldMigrationV1 } from "../src/index.js";
import { migrationCase, steps } from "./field-migration-fixture.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = JSON.parse(
  readFileSync(resolve(packageRoot, "schema/managed-site.migration.v1.schema.json"), "utf8"),
) as Record<string, unknown>;

describe("managed-site.migration.json schema artifact", () => {
  const validate = new Ajv2020({ strict: false }).compile(artifact);

  it("is the projection of the parser's schema", () => {
    assert.equal(canonicalizeJson(artifact), canonicalizeJson(generateManagedSiteFieldMigrationJsonSchemaV1()));
  });

  it("accepts the #73 declaration", () => {
    assert.equal(validate(migrationCase().declaration), true, JSON.stringify(validate.errors));
  });

  const refused: readonly [string, (declaration: Record<string, unknown>) => void][] = [
    ["an unknown key", (declaration) => { declaration.note = "x"; }],
    ["a deferred op", (declaration) => { (steps({ declaration } as never)[0]).op = "split"; }],
    ["a missing from", (declaration) => { delete declaration.from; }],
    ["an empty literal", (declaration) => {
      const step = steps({ declaration } as never)[0];
      (step.parts as Record<string, unknown>[])[1] = { literal: "" };
    }],
  ];
  for (const [name, mutate] of refused) {
    it(`refuses ${name}`, () => {
      const declaration = migrationCase().declaration;
      mutate(declaration);
      assert.equal(validate(declaration), false);
    });
  }
});

/**
 * Every shape a retire step can take, judged by the published schema and by
 * the parser: they must agree on each, so a schema-only consumer never accepts
 * a declaration the contract package refuses (or the reverse).
 */
describe("a retire step, published schema against parser", () => {
  const validate = new Ajv2020({ strict: false }).compile(artifact);
  const field = mintStableId("field");
  const collection = mintStableId("collection");
  const section = mintStableId("section");
  const shapes: readonly [string, Record<string, unknown>, boolean][] = [
    ["only op", { op: "retire" }, false],
    ["only sections", { op: "retire", sections: [section] }, false],
    ["an empty fields list", { op: "retire", fields: [] }, false],
    ["an empty collections list with sections", { op: "retire", collections: [], sections: [section] }, false],
    ["fields explicitly undefined in JSON terms (null)", { op: "retire", fields: null }, false],
    ["a collection named where a field goes", { op: "retire", fields: [collection] }, false],
    ["fields", { op: "retire", fields: [field] }, true],
    ["collections", { op: "retire", collections: [collection] }, true],
    ["collections and sections", { op: "retire", collections: [collection], sections: [section] }, true],
    ["fields, collections and sections", { op: "retire", fields: [field], collections: [collection], sections: [section] }, true],
  ];
  for (const [name, step, valid] of shapes) {
    it(`${valid ? "accepts" : "refuses"} ${name} in both`, () => {
      const declaration = migrationCase().declaration;
      declaration.steps = [step];
      assert.equal(validate(declaration), valid, JSON.stringify(validate.errors));
      const parsed = (() => {
        try {
          parseManagedSiteFieldMigrationV1(declaration);
          return true;
        } catch {
          return false;
        }
      })();
      assert.equal(parsed, valid);
    });
  }
});

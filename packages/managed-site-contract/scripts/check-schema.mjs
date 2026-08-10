import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatManagedSiteJsonSchemaBundleV1,
  generateManagedSiteJsonSchemaBundleV1,
} from "../dist/json-schema-bundle.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = resolve(
  packageRoot,
  "schema/managed-site.v1.schema.json",
);
const expected = formatManagedSiteJsonSchemaBundleV1(
  generateManagedSiteJsonSchemaBundleV1(),
);

if (readFileSync(artifactPath, "utf8") !== expected) {
  throw new Error(
    "Managed-site JSON Schema snapshot is stale; run npm run schema:generate",
  );
}

import { mkdirSync, writeFileSync } from "node:fs";
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

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(
  artifactPath,
  formatManagedSiteJsonSchemaBundleV1(generateManagedSiteJsonSchemaBundleV1()),
  "utf8",
);

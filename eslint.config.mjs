import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Workspace package build output is verified by its source type-check.
    "packages/**/dist/**",
    // Astro emits framework-owned declarations during check/build.
    "**/.astro/**",
    // Conversion-proposer fixtures are deliberately unconverted sample sites.
    "packages/managed-site-conversion/test/fixtures/**",
  ]),
]);

export default eslintConfig;

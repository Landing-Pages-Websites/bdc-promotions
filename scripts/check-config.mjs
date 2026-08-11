#!/usr/bin/env node
/**
 * Verifies operational config and authored managed content before a production build.
 *
 * - Fails (exit 1) if any `TODO_` sentinel or empty required value remains.
 * - `ALLOW_TODO=1 npm run build` downgrades failures to warnings — useful
 *   for CI builds of the template itself and early previews.
 *
 * Runs automatically via the `prebuild` npm script.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function jsonFiles(relativeDirectory) {
  const directory = join(repositoryRoot, relativeDirectory);
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return jsonFiles(relativePath);
    return entry.isFile() && entry.name.endsWith(".json") ? [relativePath] : [];
  });
}

const configFiles = [
  "src/site.config.ts",
  ...jsonFiles("src/content").sort(),
];

function collectProblems(source, relativePath) {
  const problems = [];
  const lines = source.split("\n");

  lines.forEach((line, index) => {
    // Skip pure comment lines so docs may mention the sentinel convention.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) {
      return;
    }
    const todoMatch = line.match(/TODO_[A-Z0-9_]+/);
    if (todoMatch) {
      problems.push(
        `${relativePath}:${index + 1}: sentinel ${todoMatch[0]} still present -> ${line.trim()}`,
      );
    }
    const emptyMatch = line.match(/^\s*"?([A-Za-z0-9_]+)"?\s*:\s*(""|'')/);
    if (emptyMatch) {
      problems.push(
        `${relativePath}:${index + 1}: required field "${emptyMatch[1]}" is empty`,
      );
    }
  });

  return problems;
}

function readConfig(relativePath) {
  const path = join(repositoryRoot, relativePath);
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    console.error(`check-config: cannot read ${path}: ${error.message}`);
    process.exit(1);
  }
}

const problems = configFiles.flatMap((relativePath) =>
  collectProblems(readConfig(relativePath), relativePath),
);

if (problems.length === 0) {
  console.log("check-config: operational config and managed content look complete.");
  process.exit(0);
}

const allowTodo = process.env.ALLOW_TODO === "1";
const label = allowTodo ? "WARNING" : "ERROR";

console[allowTodo ? "warn" : "error"](
  `check-config ${label}: site configuration is not filled in:\n` +
    problems.map((p) => `  - ${p}`).join("\n"),
);

if (allowTodo) {
  console.warn("check-config: continuing because ALLOW_TODO=1.");
  process.exit(0);
}

console.error(
  "\nFill in the listed files (or set ALLOW_TODO=1 for a preview build).",
);
process.exit(1);

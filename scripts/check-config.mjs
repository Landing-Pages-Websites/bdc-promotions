#!/usr/bin/env node
/**
 * Verifies src/site.config.ts is filled in before a production build.
 *
 * - Fails (exit 1) if any `TODO_` sentinel or empty required value remains.
 * - `ALLOW_TODO=1 npm run build` downgrades failures to warnings — useful
 *   for CI builds of the template itself and early previews.
 *
 * Runs automatically via the `prebuild` npm script.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const configPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "site.config.ts",
);

function collectProblems(source) {
  const problems = [];
  const lines = source.split("\n");

  lines.forEach((line, index) => {
    // Skip pure comment lines so docs may mention the sentinel convention.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) {
      return;
    }
    const todoMatch = line.match(/TODO_[A-Z_]+/);
    if (todoMatch) {
      problems.push(
        `line ${index + 1}: sentinel ${todoMatch[0]} still present -> ${line.trim()}`,
      );
    }
    const emptyMatch = line.match(/^\s*(\w+):\s*(""|''),?\s*$/);
    if (emptyMatch) {
      problems.push(`line ${index + 1}: required field "${emptyMatch[1]}" is empty`);
    }
  });

  return problems;
}

let source;
try {
  source = readFileSync(configPath, "utf8");
} catch (error) {
  console.error(`check-config: cannot read ${configPath}: ${error.message}`);
  process.exit(1);
}

const problems = collectProblems(source);

if (problems.length === 0) {
  console.log("check-config: site.config.ts looks complete.");
  process.exit(0);
}

const allowTodo = process.env.ALLOW_TODO === "1";
const label = allowTodo ? "WARNING" : "ERROR";

console[allowTodo ? "warn" : "error"](
  `check-config ${label}: src/site.config.ts is not filled in:\n` +
    problems.map((p) => `  - ${p}`).join("\n"),
);

if (allowTodo) {
  console.warn("check-config: continuing because ALLOW_TODO=1.");
  process.exit(0);
}

console.error(
  "\nFill in src/site.config.ts (or set ALLOW_TODO=1 for a preview build).",
);
process.exit(1);

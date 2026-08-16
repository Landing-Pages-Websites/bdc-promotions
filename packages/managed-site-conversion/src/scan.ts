import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import ts from "typescript";

/**
 * Route discovery reads the Next.js App Router convention, which is a framework
 * contract rather than a file-name guess: `app/<segments>/page.tsx` *defines*
 * the route. Route groups and parallel slots are transparent to the URL.
 */

export interface RouteModule {
  readonly routePath: string;
  readonly file: string;
}

export interface ParsedModule {
  readonly file: string;
  readonly source: ts.SourceFile;
}

const PAGE_BASENAMES = Object.freeze(["page.tsx", "page.jsx", "page.ts", "page.js"]);
const LAYOUT_BASENAMES = Object.freeze(["layout.tsx", "layout.jsx", "layout.ts", "layout.js"]);
const MODULE_EXTENSIONS = Object.freeze([".tsx", ".ts", ".jsx", ".js"]);
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

function isTransparentSegment(segment: string): boolean {
  return segment.startsWith("(") || segment.startsWith("@") || segment.startsWith("_");
}

function findAppDirectory(repositoryRoot: string): string | null {
  for (const candidate of ["app", join("src", "app")]) {
    const absolute = join(repositoryRoot, candidate);
    if (existsSync(absolute) && statSync(absolute).isDirectory()) return absolute;
  }
  return null;
}

function firstExisting(directory: string, basenames: readonly string[]): string | null {
  for (const basename of basenames) {
    const candidate = join(directory, basename);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function routePathFor(appDirectory: string, directory: string): string {
  const segments = relative(appDirectory, directory)
    .split(/[\\/]/u)
    .filter((segment) => segment.length > 0 && !isTransparentSegment(segment));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function walkDirectories(root: string): readonly string[] {
  const found: string[] = [root];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) continue;
    found.push(...walkDirectories(join(root, entry.name)));
  }
  return found;
}

export function discoverRoutes(repositoryRoot: string): readonly RouteModule[] {
  const appDirectory = findAppDirectory(repositoryRoot);
  if (appDirectory === null) {
    throw new Error(`No Next.js app directory found under ${repositoryRoot}`);
  }
  return walkDirectories(appDirectory)
    .map((directory) => {
      const file = firstExisting(directory, PAGE_BASENAMES);
      return file === null ? null : { routePath: routePathFor(appDirectory, directory), file };
    })
    .filter((route): route is RouteModule => route !== null)
    .sort((left, right) => left.routePath.localeCompare(right.routePath));
}

/**
 * Every layout between a route and the app root wraps that route, and only that
 * branch of the tree. Nearest first, because Next.js resolves the nearest
 * declaration and lets it fall back outwards.
 */
export function discoverLayoutChain(
  repositoryRoot: string,
  routeFile: string,
): readonly string[] {
  const appDirectory = findAppDirectory(repositoryRoot);
  if (appDirectory === null) return [];
  const chain: string[] = [];
  let directory = dirname(routeFile);
  while (directory.startsWith(appDirectory)) {
    const layout = firstExisting(directory, LAYOUT_BASENAMES);
    if (layout !== null) chain.push(layout);
    if (directory === appDirectory) break;
    directory = dirname(directory);
  }
  return chain;
}

export function parseModule(file: string): ParsedModule {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  return { file, source };
}

/** Parses each module once. Routes overlap heavily, and layouts wrap every one. */
export class ModuleCache {
  readonly #modules = new Map<string, ParsedModule>();

  read(file: string): ParsedModule {
    const existing = this.#modules.get(file);
    if (existing !== undefined) return existing;
    const parsed = parseModule(file);
    this.#modules.set(file, parsed);
    return parsed;
  }
}

function resolveSpecifierToFile(specifier: string, fromFile: string, repositoryRoot: string): string | null {
  const base = specifier.startsWith("@/")
    ? resolve(repositoryRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(fromFile), specifier)
      : null;
  if (base === null) return null;
  for (const extension of MODULE_EXTENSIONS) {
    if (existsSync(`${base}${extension}`)) return `${base}${extension}`;
    const indexFile = join(base, `index${extension}`);
    if (existsSync(indexFile)) return indexFile;
  }
  return existsSync(base) && statSync(base).isFile() ? base : null;
}

/** Where one name in a module comes from. `null` names cover the whole module. */
export interface ModuleReference {
  readonly specifier: string;
  /** The name inside the target module: an export name, `default`, or null for all of it. */
  readonly importedName: string | null;
  /** Only repository-local specifiers are followed; packages are not ours to read. */
  readonly isRepositoryLocal: boolean;
  readonly resolvedFile: string | null;
  readonly line: number;
}

/** A name a module re-exports. `exportedName` is null for `export * from`. */
export interface ReExport extends ModuleReference {
  readonly exportedName: string | null;
}

function isRepositoryLocalSpecifier(specifier: string): boolean {
  return specifier.startsWith(".") || specifier.startsWith("@/");
}

function referenceTo(
  module: ParsedModule,
  repositoryRoot: string,
  specifier: string,
  importedName: string | null,
  node: ts.Node,
): ModuleReference {
  const isRepositoryLocal = isRepositoryLocalSpecifier(specifier);
  return {
    specifier,
    importedName,
    isRepositoryLocal,
    resolvedFile: isRepositoryLocal
      ? resolveSpecifierToFile(specifier, module.file, repositoryRoot)
      : null,
    line: lineOf(module.source, node),
  };
}

/** Every imported binding by the local name it is known under in this module. */
export function importedBindingsOf(
  module: ParsedModule,
  repositoryRoot: string,
): ReadonlyMap<string, ModuleReference> {
  const bindings = new Map<string, ModuleReference>();
  for (const statement of module.source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (clause === undefined) continue;
    const record = (localName: string, importedName: string | null): void => {
      bindings.set(
        localName,
        referenceTo(module, repositoryRoot, specifier, importedName, statement),
      );
    };
    if (clause.name !== undefined) record(clause.name.text, "default");
    const named = clause.namedBindings;
    if (named === undefined) continue;
    if (ts.isNamespaceImport(named)) {
      record(named.name.text, null);
      continue;
    }
    for (const element of named.elements) {
      record(element.name.text, (element.propertyName ?? element.name).text);
    }
  }
  return bindings;
}

/** Barrel files are ordinary in this codebase, so re-exports are followed too. */
export function reExportsOf(module: ParsedModule, repositoryRoot: string): readonly ReExport[] {
  const exports: ReExport[] = [];
  for (const statement of module.source.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (specifier === undefined || !ts.isStringLiteral(specifier)) continue;
    const clause = statement.exportClause;
    if (clause === undefined) {
      exports.push({
        exportedName: null,
        ...referenceTo(module, repositoryRoot, specifier.text, null, statement),
      });
      continue;
    }
    if (!ts.isNamedExports(clause)) continue;
    for (const element of clause.elements) {
      exports.push({
        exportedName: element.name.text,
        ...referenceTo(
          module,
          repositoryRoot,
          specifier.text,
          (element.propertyName ?? element.name).text,
          statement,
        ),
      });
    }
  }
  return exports;
}

export function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

const MAX_EVIDENCE_LENGTH = 160;

/** The literal source a finding points at, on one line, so a human can act on it. */
export function evidenceOf(source: ts.SourceFile, node: ts.Node): string {
  const text = node.getText(source).replace(/\s+/gu, " ");
  return text.length > MAX_EVIDENCE_LENGTH
    ? `${text.slice(0, MAX_EVIDENCE_LENGTH - 3)}...`
    : text;
}

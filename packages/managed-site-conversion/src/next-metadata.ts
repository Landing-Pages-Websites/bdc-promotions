import ts from "typescript";

import { stringValueOf } from "./literals.js";
import type { ParsedModule } from "./scan.js";

/**
 * Next.js declares page metadata through an exported `metadata` object. That
 * export IS the SEO contract for the route, so reading it is a framework fact
 * rather than an inference — and everything it holds is internal-protected.
 *
 * A route resolves its metadata along its OWN segment chain: its page module
 * first, then each layout that wraps it, nearest outwards. A field the route
 * does not declare falls back to a layout, which is genuine framework
 * inheritance. Nothing from a sibling route can ever reach it.
 */

export interface IndexingDirectives {
  readonly index: boolean;
  readonly follow: boolean;
  readonly archive: boolean;
  readonly imageIndex: boolean;
  readonly maxSnippet: number;
  readonly maxImagePreview: "none" | "standard" | "large";
  readonly maxVideoPreview: number;
}

export interface NextMetadata {
  readonly title: string | null;
  readonly description: string | null;
  readonly indexing: IndexingDirectives;
}

export const DEFAULT_INDEXING: IndexingDirectives = {
  index: true,
  follow: true,
  archive: true,
  imageIndex: true,
  maxSnippet: -1,
  maxImagePreview: "large",
  maxVideoPreview: -1,
};

function findMetadataObject(module: ParsedModule): ts.ObjectLiteralExpression | null {
  for (const statement of module.source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (exported !== true) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "metadata") continue;
      const initializer = declaration.initializer;
      if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
        return initializer;
      }
    }
  }
  return null;
}

function propertyOf(
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | null {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = property.name;
    const text = ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : null;
    if (text === name) return property.initializer;
  }
  return null;
}

function booleanOf(expression: ts.Expression | null, fallback: boolean): boolean {
  if (expression === null) return fallback;
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return false;
  return fallback;
}

/**
 * A field is either absent — in which case an outer layout still supplies it —
 * or declared here. A declaration the tool cannot read is NOT absent: inheriting
 * over it would attribute an ancestor's value to a route that overrode it, so it
 * resolves to nothing and is reported as missing.
 */
type Declared<Value> =
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable" }
  | { readonly kind: "value"; readonly value: Value };

const ABSENT = { kind: "absent" } as const;

interface DeclaredMetadata {
  readonly title: Declared<string>;
  readonly description: Declared<string>;
  readonly indexing: Declared<IndexingDirectives>;
}

const NOTHING_DECLARED: DeclaredMetadata = {
  title: ABSENT,
  description: ABSENT,
  indexing: ABSENT,
};

/** What a route resolves to when nothing on its chain declares metadata. */
export const UNDECLARED_METADATA: NextMetadata = {
  title: null,
  description: null,
  indexing: DEFAULT_INDEXING,
};

function declaredString(
  object: ts.ObjectLiteralExpression,
  name: string,
): Declared<string> {
  const expression = propertyOf(object, name);
  if (expression === null) return ABSENT;
  const value = stringValueOf(expression);
  return value === null ? { kind: "unreadable" } : { kind: "value", value };
}

/** `robots` is a nested object, which Next.js overwrites whole rather than merges. */
function declaredRobots(object: ts.ObjectLiteralExpression): Declared<IndexingDirectives> {
  const robots = propertyOf(object, "robots");
  if (robots === null) return ABSENT;
  if (!ts.isObjectLiteralExpression(robots)) return { kind: "unreadable" };
  return {
    kind: "value",
    value: {
      ...DEFAULT_INDEXING,
      index: booleanOf(propertyOf(robots, "index"), DEFAULT_INDEXING.index),
      follow: booleanOf(propertyOf(robots, "follow"), DEFAULT_INDEXING.follow),
    },
  };
}

/** What one module declares, with no inheritance applied. */
function readDeclaredMetadata(module: ParsedModule): DeclaredMetadata {
  const object = findMetadataObject(module);
  if (object === null) return NOTHING_DECLARED;
  return {
    title: declaredString(object, "title"),
    description: declaredString(object, "description"),
    indexing: declaredRobots(object),
  };
}

function resolveField<Value>(
  chain: readonly DeclaredMetadata[],
  select: (declared: DeclaredMetadata) => Declared<Value>,
): Value | null {
  for (const declared of chain) {
    const field = select(declared);
    if (field.kind === "absent") continue;
    return field.kind === "value" ? field.value : null;
  }
  return null;
}

/**
 * Resolves one route's metadata from its own fallback chain, nearest first.
 * The caller decides what the chain is; this never reaches for a module the
 * caller did not name.
 */
export function readNextMetadata(chain: readonly ParsedModule[]): NextMetadata {
  const declared = chain.map(readDeclaredMetadata);
  return {
    title: resolveField(declared, (entry) => entry.title),
    description: resolveField(declared, (entry) => entry.description),
    indexing: resolveField(declared, (entry) => entry.indexing) ?? DEFAULT_INDEXING,
  };
}

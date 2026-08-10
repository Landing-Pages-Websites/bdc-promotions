import { ManagedSiteContractError } from "./errors.js";

export type RepositoryPath = string & { readonly __repositoryPath: true };
export type JsonPointer = string & { readonly __jsonPointer: true };

export interface ParsedJsonPointer {
  readonly value: JsonPointer;
  readonly tokens: readonly string[];
}

export interface SourceAddress {
  readonly path: RepositoryPath;
  readonly pointer: JsonPointer;
  readonly tokens: readonly string[];
}

const MAX_REPOSITORY_PATH_BYTES = 512;
const MAX_REPOSITORY_PATH_SEGMENT_BYTES = 255;
const MAX_JSON_POINTER_BYTES = 2_048;
const PORTABLE_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const INVALID_POINTER_ESCAPE_PATTERN = /~(?![01])/u;

function fail(code: string, message: string): never {
  throw new ManagedSiteContractError(code, message);
}

function utf8Length(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function isHighSurrogate(unit: number): boolean {
  return unit >= 0xd800 && unit <= 0xdbff;
}

function isLowSurrogate(unit: number): boolean {
  return unit >= 0xdc00 && unit <= 0xdfff;
}

function nextUnicodeIndex(value: string, index: number): number | null {
  const unit = value.charCodeAt(index);
  if (isLowSurrogate(unit)) {
    return null;
  }
  if (!isHighSurrogate(unit)) {
    return index + 1;
  }
  const next = value.charCodeAt(index + 1);
  return index + 1 < value.length && isLowSurrogate(next) ? index + 2 : null;
}

function containsLoneSurrogate(value: string): boolean {
  let index = 0;
  while (index < value.length) {
    const next = nextUnicodeIndex(value, index);
    if (next === null) {
      return true;
    }
    index = next;
  }
  return false;
}

function isPortableSegment(segment: string): boolean {
  return (
    utf8Length(segment) <= MAX_REPOSITORY_PATH_SEGMENT_BYTES &&
    PORTABLE_SEGMENT_PATTERN.test(segment) &&
    segment !== "." &&
    segment !== ".." &&
    !segment.endsWith(".") &&
    !WINDOWS_RESERVED_NAME.test(segment)
  );
}

function isValidRepositoryPath(value: string): boolean {
  if (
    value.length === 0 ||
    utf8Length(value) > MAX_REPOSITORY_PATH_BYTES ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("\\") ||
    value.includes("%") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes(":") ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    containsLoneSurrogate(value) ||
    value.normalize("NFKC") !== value
  ) {
    return false;
  }
  return value.split("/").every(isPortableSegment);
}

export function parseRepositoryPath(value: string): RepositoryPath {
  if (!isValidRepositoryPath(value)) {
    return fail(
      "SOURCE_PATH_INVALID",
      "Repository paths must be unambiguous, portable, relative POSIX paths",
    );
  }
  return value as RepositoryPath;
}

function registerPathAlias(path: RepositoryPath, aliases: Set<string>): void {
  const alias = path.normalize("NFKC").toLowerCase();
  if (aliases.has(alias)) {
    return fail(
      "SOURCE_PATH_ALIAS",
      "Repository paths must not alias on case-insensitive filesystems",
    );
  }
  aliases.add(alias);
}

export function assertDistinctRepositoryPaths(
  values: readonly string[],
): readonly RepositoryPath[] {
  const paths = values.map(parseRepositoryPath);
  const aliases = new Set<string>();
  for (const path of paths) {
    registerPathAlias(path, aliases);
  }
  return Object.freeze(paths);
}

function decodePointerToken(token: string): string {
  if (INVALID_POINTER_ESCAPE_PATTERN.test(token)) {
    return fail("JSON_POINTER_INVALID_ESCAPE", "JSON Pointer escape is invalid");
  }
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function validatePointerToken(token: string): string {
  if (token.length === 0) {
    return fail("JSON_POINTER_EMPTY_TOKEN", "JSON Pointer tokens cannot be empty");
  }
  const decoded = decodePointerToken(token);
  if (CONTROL_CHARACTER_PATTERN.test(decoded) || containsLoneSurrogate(decoded)) {
    return fail("JSON_POINTER_INVALID", "JSON Pointer contains invalid text");
  }
  if (decoded.normalize("NFC") !== decoded) {
    return fail("JSON_POINTER_NOT_NFC", "JSON Pointer tokens must use NFC");
  }
  return decoded;
}

function assertPointerEnvelope(value: string): void {
  if (
    !value.startsWith("/") ||
    value.startsWith("#") ||
    utf8Length(value) > MAX_JSON_POINTER_BYTES ||
    CONTROL_CHARACTER_PATTERN.test(value) ||
    containsLoneSurrogate(value)
  ) {
    return fail("JSON_POINTER_INVALID", "JSON Pointer is invalid");
  }
}

export function parseJsonPointer(value: string): ParsedJsonPointer {
  if (value === "") {
    return Object.freeze({
      tokens: Object.freeze([]) as readonly string[],
      value: "" as JsonPointer,
    });
  }
  assertPointerEnvelope(value);
  const tokens = value.slice(1).split("/").map(validatePointerToken);
  return Object.freeze({
    tokens: Object.freeze(tokens),
    value: value as JsonPointer,
  });
}

export function parseSourceAddress(input: {
  readonly path: string;
  readonly pointer: string;
}): SourceAddress {
  const parsedPointer = parseJsonPointer(input.pointer);
  return Object.freeze({
    path: parseRepositoryPath(input.path),
    pointer: parsedPointer.value,
    tokens: parsedPointer.tokens,
  });
}

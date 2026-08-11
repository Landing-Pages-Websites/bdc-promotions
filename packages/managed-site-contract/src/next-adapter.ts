import type { ManagedSiteContentDocument } from "./content.js";
import {
  parseManagedSiteContractV1,
  type ManagedSiteContractV1,
} from "./contract.js";
import { ManagedSiteContractError } from "./errors.js";
import { parseJsonValue, type JsonValue } from "./json.js";
import { hasExactJsonKeys, isJsonRecord } from "./json-record.js";
import {
  normalizeManagedSiteArtifactsV1,
  type ManagedSiteNormalizedArtifactsV1,
} from "./normalized-artifacts.js";
import {
  createManagedSiteNextValueReader,
  type ManagedSiteNextValueReader,
} from "./next-adapter-values.js";
import type { ManagedSiteSourceDocumentV1 } from "./source-documents.js";
import { projectManagedSiteContentDocumentV1 } from "./source-projection.js";

export interface ManagedSiteNextV1 {
  readonly contract: ManagedSiteContractV1;
  readonly content: ManagedSiteContentDocument;
  readonly artifacts: ManagedSiteNormalizedArtifactsV1;
  readonly readValue: ManagedSiteNextValueReader;
}

export interface CreateManagedSiteNextV1Input {
  readonly contract: unknown;
  readonly sourceDocuments: readonly ManagedSiteSourceDocumentV1[];
}

function inputFailure(): never {
  throw new ManagedSiteContractError(
    "NEXT_ADAPTER_INPUT_INVALID",
    "Next adapter input is invalid",
  );
}

function isJsonArray(value: JsonValue): value is readonly JsonValue[] {
  return Array.isArray(value);
}

function sourceDocument(value: JsonValue): ManagedSiteSourceDocumentV1 {
  if (
    !isJsonRecord(value) ||
    !hasExactJsonKeys(value, ["path", "value"]) ||
    typeof value.path !== "string"
  ) {
    return inputFailure();
  }
  return { path: value.path, value: value.value };
}

function parseCreateInput(input: unknown): CreateManagedSiteNextV1Input {
  const value = parseJsonValue(input);
  if (
    !isJsonRecord(value) ||
    !hasExactJsonKeys(value, ["contract", "sourceDocuments"]) ||
    !isJsonArray(value.sourceDocuments)
  ) {
    return inputFailure();
  }
  return {
    contract: value.contract,
    sourceDocuments: value.sourceDocuments.map(sourceDocument),
  };
}

function assertNextAdapter(contract: ManagedSiteContractV1): void {
  if (contract.adapter.kind !== "nextjs") {
    throw new ManagedSiteContractError(
      "NEXT_ADAPTER_KIND",
      "Managed-site contract does not declare the Next.js adapter",
    );
  }
}

export function createManagedSiteNextV1(
  input: CreateManagedSiteNextV1Input,
): ManagedSiteNextV1 {
  const parsedInput = parseCreateInput(input);
  const contract = parseManagedSiteContractV1(parsedInput.contract);
  assertNextAdapter(contract);
  const content = projectManagedSiteContentDocumentV1(
    contract,
    parsedInput.sourceDocuments,
  );
  return Object.freeze({
    contract,
    content,
    artifacts: normalizeManagedSiteArtifactsV1(contract, content),
    readValue: createManagedSiteNextValueReader(content),
  });
}

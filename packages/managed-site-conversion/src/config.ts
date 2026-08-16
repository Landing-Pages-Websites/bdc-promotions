import { readFileSync } from "node:fs";

/**
 * Facts the proposer refuses to invent.
 *
 * Everything in here is either a platform constant (the review bridge) or a
 * governance decision (length limits, collection bounds, SEO intent, business
 * identity). None of it is discoverable by reading a website's source, so the
 * tool takes it as input and reports every piece that is missing instead of
 * defaulting silently into the contract.
 */

export interface BridgeDelivery {
  readonly version: "v4";
  readonly src: string;
  readonly integrity: string;
  readonly crossOrigin: "anonymous";
  readonly load: "head_defer";
}

export interface TextPolicy {
  readonly labelMaxLength: number;
  readonly bodyMaxLength: number;
  readonly headingMaxLength: number;
  readonly linkLabelMaxLength: number;
  readonly richTextMaxCharacters: number;
  readonly richTextMaxNodes: number;
}

export interface CollectionPolicy {
  readonly minItems: number;
  readonly maxItems: number;
}

export interface AssetPolicy {
  readonly maxBytes: number;
}

export interface BusinessIdentityInput {
  readonly legalName: string | null;
  readonly displayName: string | null;
  readonly telephone: string | null;
  readonly email: string | null;
  readonly description: string | null;
  readonly sameAs: readonly string[] | null;
}

export type PagePurpose =
  | "home"
  | "service"
  | "location"
  | "service_location"
  | "about"
  | "contact"
  | "article"
  | "landing"
  | "legal"
  | "other";

export interface SitemapPolicy {
  readonly included: boolean;
  readonly changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  readonly priority: number;
}

export interface PerformanceBudget {
  readonly maxLcpMilliseconds: number;
  readonly maxCls: number;
  readonly maxInpMilliseconds: number;
  readonly maxPageBytes: number;
}

export interface PageSeoInput {
  readonly purpose: PagePurpose | null;
  readonly canonical: string | null;
  readonly sitemap: SitemapPolicy | null;
  readonly performanceBudget: PerformanceBudget | null;
}

export interface ConversionConfig {
  readonly contentRoot: string;
  readonly assetRoot: string;
  readonly bridge: BridgeDelivery | null;
  readonly text: TextPolicy;
  readonly collections: CollectionPolicy;
  readonly assets: AssetPolicy;
  readonly businessIdentity: BusinessIdentityInput;
  readonly pages: ReadonlyMap<string, PageSeoInput>;
}

export const DEFAULT_TEXT_POLICY: TextPolicy = {
  labelMaxLength: 160,
  bodyMaxLength: 1_000,
  headingMaxLength: 300,
  linkLabelMaxLength: 160,
  richTextMaxCharacters: 2_000,
  richTextMaxNodes: 200,
};

export const DEFAULT_COLLECTION_POLICY: CollectionPolicy = { minItems: 1, maxItems: 24 };
export const DEFAULT_ASSET_POLICY: AssetPolicy = { maxBytes: 5_242_880 };

const EMPTY_BUSINESS_IDENTITY: BusinessIdentityInput = {
  legalName: null,
  displayName: null,
  telephone: null,
  email: null,
  description: null,
  sameAs: null,
};

export function defaultConfig(): ConversionConfig {
  return {
    contentRoot: "src/content",
    assetRoot: "public",
    bridge: null,
    text: DEFAULT_TEXT_POLICY,
    collections: DEFAULT_COLLECTION_POLICY,
    assets: DEFAULT_ASSET_POLICY,
    businessIdentity: EMPTY_BUSINESS_IDENTITY,
    pages: new Map(),
  };
}

type UnknownRecord = Readonly<Record<string, unknown>>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? (value as readonly string[])
    : null;
}

function readBusinessIdentity(value: unknown): BusinessIdentityInput {
  const record = asRecord(value);
  if (record === null) return EMPTY_BUSINESS_IDENTITY;
  return {
    legalName: asString(record["legalName"]),
    displayName: asString(record["displayName"]),
    telephone: asString(record["telephone"]),
    email: asString(record["email"]),
    description: asString(record["description"]),
    sameAs: asStringArray(record["sameAs"]),
  };
}

function readPageSeo(value: unknown): PageSeoInput {
  const record = asRecord(value);
  if (record === null) {
    return { purpose: null, canonical: null, sitemap: null, performanceBudget: null };
  }
  const purpose = asString(record["purpose"]);
  return {
    purpose: purpose === null ? null : (purpose as PagePurpose),
    canonical: asString(record["canonical"]),
    sitemap: asRecord(record["sitemap"]) === null ? null : (record["sitemap"] as SitemapPolicy),
    performanceBudget:
      asRecord(record["performanceBudget"]) === null
        ? null
        : (record["performanceBudget"] as PerformanceBudget),
  };
}

function readPages(value: unknown): ReadonlyMap<string, PageSeoInput> {
  const record = asRecord(value);
  if (record === null) return new Map();
  return new Map(Object.entries(record).map(([route, entry]) => [route, readPageSeo(entry)]));
}

function mergePolicy<Policy extends object>(base: Policy, value: unknown): Policy {
  const record = asRecord(value);
  return record === null ? base : { ...base, ...record };
}

export function loadConfig(path: string | null): ConversionConfig {
  const base = defaultConfig();
  if (path === null) return base;
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  const record = asRecord(parsed);
  if (record === null) throw new Error(`Conversion config at ${path} is not a JSON object`);
  return {
    contentRoot: asString(record["contentRoot"]) ?? base.contentRoot,
    assetRoot: asString(record["assetRoot"]) ?? base.assetRoot,
    bridge: asRecord(record["bridge"]) === null ? null : (record["bridge"] as BridgeDelivery),
    text: mergePolicy(base.text, record["text"]),
    collections: mergePolicy(base.collections, record["collections"]),
    assets: mergePolicy(base.assets, record["assets"]),
    businessIdentity: readBusinessIdentity(record["businessIdentity"]),
    pages: readPages(record["pages"]),
  };
}

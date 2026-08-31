import type {
  JsonValue,
  ManagedSiteContentDocument,
  ManagedSiteContractV1,
  StableId,
} from "@landing-pages-websites/managed-site-contract";
import {
  parseManagedSiteContentDocument,
  parseManagedSiteContractV1,
  validateManagedSiteContractV1ContentSemantics,
} from "@landing-pages-websites/managed-site-contract";

import { bindCandidates, routeSlug, type FieldBinding, type PageBinding } from "./bindings.js";
import type { Candidate } from "./candidates.js";
import type { TagRoles } from "./collections.js";
import { loadConfig, type ConversionConfig } from "./config.js";
import { ContractEmitter, type ContractParts } from "./emit-contract.js";
import { emitContent, type ContentEmission } from "./emit-content.js";
import { emitSeo, type HeadingOutlineEntry, type SeoEmission } from "./emit-seo.js";
import { extractComponent, resolveTagRoles, type ComponentDeclaration } from "./extract.js";
import { applyConfidenceGate } from "./gate.js";
import { IdLedger } from "./id-ledger.js";
import { isJsonObject, writeAtPointer, type JsonObject } from "./json-write.js";
import { readNextMetadata, type NextMetadata } from "./next-metadata.js";
import { isRepositoryPath } from "./paths.js";
import { declarationKey, resolveRenderTree, tagResolver } from "./reachability.js";
import {
  CONFIDENCE_RULE,
  FindingCollector,
  type Finding,
  type ProposalReport,
} from "./report.js";
import { discoverLayoutChain, discoverRoutes, ModuleCache, type RouteModule } from "./scan.js";

export interface ProposeOptions {
  readonly repositoryRoot: string;
  readonly configPath: string | null;
  readonly ledgerPath: string;
}

export interface Proposal {
  readonly contract: ManagedSiteContractV1 | null;
  readonly contractDraft: JsonValue;
  readonly content: ManagedSiteContentDocument;
  readonly sourceDocuments: ReadonlyMap<string, JsonValue>;
  readonly report: ProposalReport;
  readonly ledger: IdLedger;
  readonly validationError: string | null;
  /**
   * The rival groups the confidence gate refused, kept as groups. A report only
   * says a value was refused; a tool that WRITES the missing names needs to
   * know which values are rivals of which.
   */
  readonly ambiguous: readonly (readonly Candidate[])[];
}

interface RouteScan {
  readonly binding: PageBinding;
  /** Only what this route renders: its own tree plus the layouts wrapping it. */
  readonly components: readonly ComponentDeclaration[];
  readonly metadata: NextMetadata;
  readonly findings: readonly Finding[];
}

interface ComponentScan {
  readonly candidates: readonly Candidate[];
  readonly findings: readonly Finding[];
}

/**
 * A route is read through the chain that actually renders it: its page module
 * and every layout above it, nearest first. Both the markup a customer may edit
 * and the metadata this route resolves come from that one chain, so no sibling
 * route can contribute either.
 */
function scanRoute(
  route: RouteModule,
  repositoryRoot: string,
  cache: ModuleCache,
  ledger: IdLedger,
): RouteScan {
  const chain = [route.file, ...discoverLayoutChain(repositoryRoot, route.file)];
  const tree = resolveRenderTree(chain, repositoryRoot, cache);
  return {
    binding: {
      routePath: route.routePath,
      pageId: ledger.resolve("page", `route:${route.routePath}`),
      slug: routeSlug(route.routePath),
      componentNames: new Set(tree.components.map((declaration) => declaration.name)),
    },
    components: tree.components,
    metadata: readNextMetadata(chain.map((file) => cache.read(file))),
    findings: tree.findings,
  };
}

/**
 * Each rendered declaration is extracted exactly once, even when several routes
 * reach it. Deduplicating *candidates* instead would hide the very anchor
 * collisions the confidence gate exists to catch.
 */
function extractRendered(
  routes: readonly RouteScan[],
  repositoryRoot: string,
  cache: ModuleCache,
): ComponentScan {
  const candidates: Candidate[] = [];
  const findings: Finding[] = [];
  const walked = new Set<string>();
  const rolesByFile = new Map<string, TagRoles>();
  const tags = tagResolver(repositoryRoot, cache);
  for (const route of routes) {
    for (const declaration of route.components) {
      const file = declaration.module.file;
      const key = declarationKey(declaration);
      if (walked.has(key)) continue;
      walked.add(key);
      const roles = rolesByFile.get(file) ?? resolveTagRoles(declaration.module);
      rolesByFile.set(file, roles);
      const extracted = extractComponent(declaration, roles, repositoryRoot, cache, tags);
      candidates.push(...extracted.candidates);
      findings.push(...extracted.findings);
    }
  }
  return { candidates, findings };
}

/**
 * A heading rendered on several routes — a layout's, or a shared component's —
 * is part of the outline of every one of them, so it is recorded against each.
 */
function headingOutlineFor(
  bindings: readonly FieldBinding[],
  pages: readonly PageBinding[],
): ReadonlyMap<string, readonly HeadingOutlineEntry[]> {
  const outline = new Map<string, HeadingOutlineEntry[]>();
  for (const binding of bindings) {
    const candidate = binding.candidate;
    const level =
      candidate.kind === "heading_text"
        ? candidate.level
        : candidate.kind === "rich_text"
          ? candidate.headingLevel
          : null;
    if (level === null) continue;
    for (const page of pages.filter((entry) => binding.pageIds.includes(entry.pageId))) {
      const entries = outline.get(page.routePath) ?? [];
      entries.push({ fieldId: binding.fieldId, semanticLevel: level });
      outline.set(page.routePath, entries);
    }
  }
  return outline;
}

function bridgeFindings(config: ConversionConfig): readonly Finding[] {
  if (config.bridge !== null) return [];
  return [
    {
      code: "SEO_INPUT_REQUIRED",
      anchor: "bridge",
      location: null,
      evidence: "No review-bridge delivery block was supplied.",
      decision:
        "Copy the current bridge version, src and subresource integrity from the " +
        "platform into the conversion config. The proposer will not invent it.",
    },
  ];
}

function assembleContract(
  contractId: StableId<"contract">,
  config: ConversionConfig,
  pages: readonly PageBinding[],
  sections: ReturnType<typeof bindCandidates>["sections"],
  parts: ContractParts,
  seo: SeoEmission,
  tombstonedIds: readonly string[],
): JsonValue {
  const fieldsById = new Map(parts.fields.map((field) => [field.id, field]));
  return {
    schemaVersion: "1.0",
    contractId,
    adapter: { kind: "nextjs", adapterVersion: "1.0" },
    bridge:
      config.bridge === null
        ? null
        : {
            reviewProtocol: 1,
            editProtocol: 2,
            annotationVersion: 1,
            delivery: { ...config.bridge },
            framing: "authenticated_preview_gateway",
          },
    pages: pages.map((page) => ({
      id: page.pageId,
      presentation: {
        name: page.slug === "home" ? "Home" : page.slug,
        description: null,
        group: "Pages",
        order: pages.indexOf(page) + 1,
        example: null,
      },
      route: { kind: "static", path: page.routePath },
      sections: sections
        .filter((section) => section.pageId === page.pageId)
        .map((section) => ({
          id: section.sectionId,
          presentation: {
            name: section.name,
            description: null,
            group: page.slug === "home" ? "Home" : page.slug,
            order: section.order,
            example: null,
          },
          fields: section.fields
            .map((field) => fieldsById.get(field.fieldId))
            .filter((field) => field !== undefined),
        })),
    })),
    collections: [...parts.collections],
    assets: [...parts.assets],
    internalSeo: seo.descriptor,
    atomicAliasGroups: [],
    tombstonedIds: [...tombstonedIds],
  } as JsonValue;
}

/**
 * `app/blog/[slug]/page.tsx` is one file serving many URLs, and the contract
 * addresses pages by concrete route. Emitting `/blog/[slug]` would put a string
 * that is not a URL where a URL belongs, which the contract's route rule rejects
 * outright -- so the whole proposal failed rather than the one route.
 *
 * Reported instead, because which URLs a template serves is not readable from
 * the source: the data behind it decides, and on a real site most of it belongs
 * in a collection rather than as pages at all. That is a person's decision, and
 * naming it is what this tool is for.
 */
function isDynamicRoute(routePath: string): boolean {
  return routePath.includes("[");
}

/** `<contentRoot>/pages/<slug>.json`, the one file a page's content lives in. */
function contentPathOf(contentRoot: string, slug: string): string {
  return `${contentRoot}/pages/${slug}.json`;
}

function unrepresentableRouteFinding(page: PageBinding, contentRoot: string): Finding {
  return {
    code: "ROUTE_PATH_UNREPRESENTABLE",
    anchor: null,
    location: null,
    evidence: `route ${page.routePath} folds into the file name '${page.slug}.json'`,
    decision:
      `That name is longer than the standard allows for one path segment, so no ` +
      `content file can be written for this route under '${contentRoot}'. Shorten ` +
      "the route, or convert this page by hand. It is excluded from the proposal.",
  };
}

function dynamicRouteFinding(route: RouteModule): Finding {
  return {
    code: "DYNAMIC_ROUTE_NOT_A_PAGE",
    anchor: null,
    location: { file: route.file, line: 1, offset: 0 },
    evidence: `route ${route.routePath} is a template, not a URL`,
    decision:
      "Decide what this template serves: model its data as a collection, " +
      "or declare the concrete routes it renders as pages. It is excluded " +
      "from the proposal either way.",
  };
}

export function propose(options: ProposeOptions): Proposal {
  const config = loadConfig(options.configPath);
  const ledger = IdLedger.load(options.ledgerPath);
  const collector = new FindingCollector();
  collector.addMany(bridgeFindings(config));

  const cache = new ModuleCache();
  const discovered = discoverRoutes(options.repositoryRoot);
  const templates = discovered.filter((route) => isDynamicRoute(route.routePath));
  collector.addMany(templates.map(dynamicRouteFinding));
  const scanned = discovered
    .filter((route) => !isDynamicRoute(route.routePath))
    .map((route) => scanRoute(route, options.repositoryRoot, cache, ledger));
  for (const entry of scanned) collector.addMany(entry.findings);

  const components = extractRendered(scanned, options.repositoryRoot, cache);
  collector.addMany(components.findings);

  const gate = applyConfidenceGate(components.candidates);
  collector.addMany(gate.findings);

  // The load-time budget on `contentRoot` guarantees room for the longest slug a
  // single route segment can produce. A route is up to 2,048 characters and folds
  // into ONE segment, so a long enough route is unrepresentable under any root.
  // That is a fact about the route, and it is reported here, where the routes are
  // known, rather than reaching the contract as an invalid path.
  const routable = scanned.filter((entry) =>
    isRepositoryPath(contentPathOf(config.contentRoot, entry.binding.slug)),
  );
  collector.addMany(
    scanned
      .filter((entry) => !routable.includes(entry))
      .map((entry) => unrepresentableRouteFinding(entry.binding, config.contentRoot)),
  );

  const pages = routable.map((entry) => entry.binding);
  const bound = bindCandidates(gate.accepted, pages, ledger, config.contentRoot);
  collector.addMany(bound.findings);

  const emitter = new ContractEmitter({
    config,
    ledger,
    repositoryRoot: options.repositoryRoot,
  });
  const parts = emitter.emit(bound.fields);
  collector.addMany(parts.findings);

  const content = emitContent(bound.fields, {
    config,
    repositoryRoot: options.repositoryRoot,
    parts,
    pagesById: new Map(pages.map((page) => [page.pageId, page])),
  });

  const seo = emitSeo({
    config,
    ledger,
    pages,
    metadataByRoute: new Map(scanned.map((entry) => [entry.binding.routePath, entry.metadata])),
    headingOutline: headingOutlineFor(bound.fields, pages),
    primaryImageByRoute: new Map(),
  });
  collector.addMany(seo.findings);

  const contractId = ledger.resolve("contract", "contract:root");
  const draft = assembleContract(
    contractId,
    config,
    pages,
    bound.sections,
    parts,
    seo,
    ledger.retiredIds(),
  );

  const contentDocument = buildContentDocument(content, seo);
  const validation = validateProposal(draft, contentDocument);
  return {
    contract: validation.contract,
    contractDraft: draft,
    content: contentDocument,
    sourceDocuments: mergeSourceDocuments(content, seo, config),
    report: {
      confidenceRule: CONFIDENCE_RULE,
      repository: options.repositoryRoot,
      proposedFieldCount: parts.fields.length,
      proposedCollectionCount: parts.collections.length,
      proposedAssetCount: parts.assets.length,
      findings: collector.findings,
    },
    ledger,
    validationError: validation.error,
    ambiguous: gate.ambiguous,
  };
}

/**
 * The proposal is only claimed valid when the platform's own parsers and
 * semantic checks accept it — schema, identity, resolvers, routes, SEO and the
 * content that fills it. A proposal that does not survive them is emitted for
 * inspection but never reported as ready.
 */
function validateProposal(
  draft: JsonValue,
  content: ManagedSiteContentDocument,
): { readonly contract: ManagedSiteContractV1 | null; readonly error: string | null } {
  try {
    const contract = parseManagedSiteContractV1(draft);
    validateManagedSiteContractV1ContentSemantics(
      contract,
      parseManagedSiteContentDocument(content),
    );
    return { contract, error: null };
  } catch (error) {
    return { contract: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function buildContentDocument(
  content: ContentEmission,
  seo: SeoEmission,
): ManagedSiteContentDocument {
  return {
    schemaVersion: "1.0",
    values: [...content.values, ...seo.contentValues],
    assetManifest: [...content.assetManifest],
  } as ManagedSiteContentDocument;
}

function mergeSourceDocuments(
  content: ContentEmission,
  seo: SeoEmission,
  config: ConversionConfig,
): ReadonlyMap<string, JsonValue> {
  const merged = new Map<string, JsonValue>(content.sourceDocuments);
  for (const field of seo.fields) {
    const existing = merged.get(field.sourcePath);
    const document: JsonObject = isJsonObject(existing) ? { ...existing } : {};
    writeAtPointer(document, field.pointer, field.value);
    merged.set(field.sourcePath, document);
  }
  if (!merged.has(`${config.contentRoot}/site.json`)) {
    merged.set(`${config.contentRoot}/site.json`, {});
  }
  return merged;
}

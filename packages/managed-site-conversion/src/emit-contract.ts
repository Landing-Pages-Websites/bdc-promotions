import type {
  ManagedAssetSlotDescriptor,
  ManagedCollectionDescriptor,
  ManagedCollectionItemField,
  ManagedFieldCapability,
  ManagedFieldDescriptor,
  ManagedRichTextMarkKind,
  StableId,
} from "@landing-pages-websites/managed-site-contract";

import { renderAnchor } from "./anchors.js";
import type { Candidate, CollectionCandidate, ItemFieldSpec, RawDestination } from "./candidates.js";
import type { FieldBinding } from "./bindings.js";
import type { ConversionConfig } from "./config.js";
import type { IdLedger } from "./id-ledger.js";
import { aspectRatioOf, probeImage, type ProbedImage } from "./image-probe.js";
import type { Finding } from "./report.js";
import { assetRepositoryPath, assetRootIsAtFault } from "./paths.js";
import { pointerFor, resolverFor } from "./source-address.js";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export interface ContractParts {
  readonly fields: readonly ManagedFieldDescriptor[];
  readonly collections: readonly ManagedCollectionDescriptor[];
  readonly assets: readonly ManagedAssetSlotDescriptor[];
  readonly assetSlotByAnchor: ReadonlyMap<string, StableId<"asset">>;
  readonly collectionIdByAnchor: ReadonlyMap<string, StableId<"collection">>;
  readonly itemIdsByAnchor: ReadonlyMap<string, readonly StableId<"item">[]>;
  readonly itemFieldIdsByAnchor: ReadonlyMap<string, ReadonlyMap<string, StableId<"field">>>;
  readonly findings: readonly Finding[];
}

interface EmitContext {
  readonly config: ConversionConfig;
  readonly ledger: IdLedger;
  readonly repositoryRoot: string;
}

function presentationOf(binding: FieldBinding): ManagedFieldDescriptor["presentation"] {
  return {
    name: binding.name,
    description: null,
    group: binding.group,
    order: binding.order,
    example: null,
  };
}

type CommonFieldShape = Pick<
  ManagedFieldDescriptor,
  "id" | "scope" | "classification" | "resolver" | "usages" | "presentation"
>;

function commonOf(binding: FieldBinding): CommonFieldShape {
  return {
    id: binding.fieldId,
    scope: binding.scope,
    classification: binding.candidate.ownership,
    resolver: resolverFor(binding.sourcePath, binding.pointer),
    usages: binding.pageIds.map((pageId) => ({ pageId, itemId: null })),
    presentation: presentationOf(binding),
  };
}

function capabilitiesFor(
  binding: FieldBinding,
  granted: readonly ManagedFieldCapability[],
): readonly ManagedFieldCapability[] {
  return binding.candidate.ownership === "customer_editable" ? granted : [];
}

function textConstraints(maxLength: number): {
  readonly minLength: number;
  readonly maxLength: number;
  readonly newlines: "forbid";
} {
  return { minLength: 1, maxLength, newlines: "forbid" };
}

/**
 * The mark kinds a document actually uses, which is what a constraint names.
 * Collecting the mark objects instead would dedupe by identity rather than by
 * kind and report the same mark repeatedly.
 *
 * Link marks are excluded because a converted document never carries one, and
 * `allowedMarks` covers formatting only; prose links stay governed by
 * `allowLinks` and its companions.
 */
function markKindsOf(candidate: Candidate): readonly ManagedRichTextMarkKind[] {
  if (candidate.kind !== "rich_text") return [];
  const kinds = new Set<ManagedRichTextMarkKind>();
  for (const block of candidate.document.content) {
    if (block.type !== "paragraph") continue;
    for (const node of block.content) {
      for (const mark of node.marks ?? []) {
        if (mark.type !== "link") kinds.add(mark.type);
      }
    }
  }
  return [...kinds];
}

function linkConstraints(
  destination: RawDestination,
  newWindow: boolean,
  maxLength: number,
): Extract<ManagedFieldDescriptor, { readonly type: "link" }>["constraints"] {
  const targets = [newWindow ? "new_window" : "same_window"] as const;
  const base = {
    labelConstraints: textConstraints(maxLength),
    allowedTargets: targets,
  };
  if (destination.kind === "self") {
    return {
      ...base,
      authority: "internal_only",
      allowedSchemes: [],
      allowedExternalHosts: [],
      fragmentPolicy: "forbid",
      allowedFragments: [],
    };
  }
  if (destination.kind === "fragment") {
    return {
      ...base,
      authority: "internal_only",
      allowedSchemes: [],
      allowedExternalHosts: [],
      fragmentPolicy: "declared",
      allowedFragments: [destination.fragment],
    };
  }
  if (destination.kind === "external") {
    return {
      ...base,
      authority: "external_only",
      allowedSchemes: ["https"],
      allowedExternalHosts: [new URL(destination.url).hostname.toLowerCase()],
      fragmentPolicy: "forbid",
      allowedFragments: [],
    };
  }
  return {
    ...base,
    authority: "external_only",
    allowedSchemes: [destination.kind === "email" ? "mailto" : "tel"],
    allowedExternalHosts: [],
    fragmentPolicy: "forbid",
    allowedFragments: [],
  };
}

function distinctRatios(
  images: readonly ProbedImage[],
): readonly { readonly width: number; readonly height: number }[] {
  const byValue = new Map<number, { readonly width: number; readonly height: number }>();
  for (const image of images) {
    const ratio = aspectRatioOf(image);
    byValue.set(ratio.width / ratio.height, ratio);
  }
  return [...byValue.values()];
}

/**
 * A slot must accept every image the source already ships, so its bounds are
 * the envelope of the observed files, not any single one of them.
 */
function assetSlotFor(
  name: string,
  order: number,
  images: readonly ProbedImage[],
  context: EmitContext,
  assetId: StableId<"asset">,
): ManagedAssetSlotDescriptor {
  const widths = images.map((image) => image.width);
  const heights = images.map((image) => image.height);
  const outputs = [...new Set(images.map((image) => image.mimeType))];
  return {
    id: assetId,
    presentation: { name, description: null, group: "Images", order, example: null },
    semantics: { kind: "informative" },
    acceptedMimeTypes: ACCEPTED_MIME_TYPES,
    outputMimeTypes: outputs,
    minWidth: Math.min(...widths),
    maxWidth: Math.max(...widths, 4_096),
    minHeight: Math.min(...heights),
    maxHeight: Math.max(...heights, 4_096),
    aspectRatios: distinctRatios(images),
    cropPolicy: "optional",
    focalPointPolicy: "optional",
    maxBytes: Math.max(...images.map((image) => image.bytes), context.config.assets.maxBytes),
  };
}

function unreadableAsset(candidate: Candidate, source: string): Finding {
  return {
    code: "ASSET_UNREADABLE",
    anchor: renderAnchor(candidate.anchor),
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `Could not read image dimensions for '${source}'. Declare the asset slot by hand, ` +
      "or convert the file to PNG, JPEG or WebP first.",
  };
}

function unrepresentableAssetPath(
  candidate: Candidate,
  source: string,
  config: ConversionConfig,
): Finding {
  const cause = assetRootIsAtFault(config.assetRoot, source)
    ? `the configured assetRoot '${config.assetRoot}' leaves no room for it`
    : "the file path itself is not one the standard can carry";
  return {
    code: "ASSET_PATH_UNREPRESENTABLE",
    anchor: renderAnchor(candidate.anchor),
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `'${source}' cannot be addressed as a repository path because ${cause}. ` +
      "Shorten the asset root or move the file, then re-run.",
  };
}

function collectionBoundsFinding(candidate: CollectionCandidate, itemCount: number): Finding {
  return {
    code: "COLLECTION_BOUNDS_NOT_DERIVABLE",
    anchor: renderAnchor(candidate.anchor),
    location: candidate.location,
    evidence: candidate.evidence,
    decision:
      `Confirm the minimum and maximum item count for '${candidate.bindingName}' — the ` +
      "source only proves it currently has " +
      `${itemCount}. Item IDs were bootstrapped from present array order and are frozen ` +
      "into the emitted content; reordering after this run is safe, re-running before " +
      "committing the content is not.",
  };
}

function itemCapabilitiesFor(kind: ItemFieldSpec["kind"]): readonly ManagedFieldCapability[] {
  switch (kind) {
    case "plain_text":
    case "heading_text":
      return ["text.edit"];
    case "link":
      return ["link.label.edit", "link.destination.edit", "link.target.edit"];
    case "image":
      return ["image.upload", "image.crop", "image.focal_point.edit", "image.alt.edit"];
  }
}

export class ContractEmitter {
  readonly #context: EmitContext;
  readonly #fields: ManagedFieldDescriptor[] = [];
  readonly #collections: ManagedCollectionDescriptor[] = [];
  readonly #assets: ManagedAssetSlotDescriptor[] = [];
  readonly #assetSlotByAnchor = new Map<string, StableId<"asset">>();
  readonly #collectionIdByAnchor = new Map<string, StableId<"collection">>();
  readonly #itemIdsByAnchor = new Map<string, readonly StableId<"item">[]>();
  readonly #itemFieldIdsByAnchor = new Map<string, ReadonlyMap<string, StableId<"field">>>();
  readonly #findings: Finding[] = [];

  constructor(context: EmitContext) {
    this.#context = context;
  }

  emit(bindings: readonly FieldBinding[]): ContractParts {
    for (const binding of bindings) this.#emitField(binding);
    return {
      fields: this.#fields,
      collections: this.#collections,
      assets: this.#assets,
      assetSlotByAnchor: this.#assetSlotByAnchor,
      collectionIdByAnchor: this.#collectionIdByAnchor,
      itemIdsByAnchor: this.#itemIdsByAnchor,
      itemFieldIdsByAnchor: this.#itemFieldIdsByAnchor,
      findings: this.#findings,
    };
  }

  #emitField(binding: FieldBinding): void {
    const candidate = binding.candidate;
    switch (candidate.kind) {
      case "plain_text":
        this.#fields.push({
          ...commonOf(binding),
          capabilities: capabilitiesFor(binding, ["text.edit"]),
          type: "plain_text",
          semantic: candidate.semantic,
          constraints: textConstraints(
            candidate.semantic === "body"
              ? this.#context.config.text.bodyMaxLength
              : this.#context.config.text.labelMaxLength,
          ),
        } as ManagedFieldDescriptor);
        return;
      case "heading_text":
        this.#fields.push({
          ...commonOf(binding),
          capabilities: capabilitiesFor(binding, ["text.edit"]),
          type: "heading_text",
          semanticLevel: candidate.level,
          constraints: textConstraints(this.#context.config.text.headingMaxLength),
        } as ManagedFieldDescriptor);
        return;
      case "rich_text":
        this.#emitRichText(binding);
        return;
      case "link":
        this.#fields.push({
          ...commonOf(binding),
          capabilities: capabilitiesFor(binding, [
            "link.label.edit",
            "link.destination.edit",
            "link.target.edit",
          ]),
          type: "link",
          constraints: linkConstraints(
            candidate.destination,
            candidate.newWindow,
            this.#context.config.text.linkLabelMaxLength,
          ),
        } as ManagedFieldDescriptor);
        return;
      case "image":
        this.#emitImage(binding);
        return;
      case "collection":
        this.#emitCollection(binding, candidate);
    }
  }

  #emitRichText(binding: FieldBinding): void {
    const markKinds = markKindsOf(binding.candidate);
    const markCapabilities = markKinds.map(
      (kind): ManagedFieldCapability =>
        kind === "bold" ? "rich_text.mark.bold" : "rich_text.mark.italic",
    );
    this.#fields.push({
      ...commonOf(binding),
      capabilities: capabilitiesFor(binding, ["text.edit", ...markCapabilities]),
      type: "rich_text",
      constraints: {
        maxCharacters: this.#context.config.text.richTextMaxCharacters,
        maxNodes: this.#context.config.text.richTextMaxNodes,
        allowedBlocks: ["paragraph"],
        allowedMarks: markKinds,
        allowLinks: false,
        allowedExternalHosts: [],
        allowedTargets: [],
      },
    } as ManagedFieldDescriptor);
  }

  #probe(source: string): ProbedImage | null {
    const repositoryPath = assetRepositoryPath(this.#context.config.assetRoot, source);
    if (repositoryPath === null) return null;
    return probeImage(`${this.#context.repositoryRoot}/${repositoryPath}`);
  }

  #emitImage(binding: FieldBinding): void {
    const candidate = binding.candidate;
    if (candidate.kind !== "image") return;
    // An asset the contract could not name is a different decision from one that
    // could not be read, and only one of the two is fixed in the config.
    if (assetRepositoryPath(this.#context.config.assetRoot, candidate.source) === null) {
      this.#findings.push(
        unrepresentableAssetPath(candidate, candidate.source, this.#context.config),
      );
      return;
    }
    const image = this.#probe(candidate.source);
    if (image === null) {
      this.#findings.push(unreadableAsset(candidate, candidate.source));
      return;
    }
    const anchorKey = renderAnchor(candidate.anchor);
    const assetId = this.#context.ledger.resolve("asset", `asset:${anchorKey}`);
    this.#assets.push(
      assetSlotFor(binding.name, this.#assets.length + 1, [image], this.#context, assetId),
    );
    this.#assetSlotByAnchor.set(anchorKey, assetId);
    this.#fields.push({
      ...commonOf(binding),
      capabilities: capabilitiesFor(binding, [
        "image.upload",
        "image.crop",
        "image.focal_point.edit",
        "image.alt.edit",
      ]),
      type: "image",
      assetSlotId: assetId,
    } as ManagedFieldDescriptor);
  }

  #emitCollection(binding: FieldBinding, candidate: CollectionCandidate): void {
    const anchorKey = renderAnchor(candidate.anchor);
    const collectionId = this.#context.ledger.resolve("collection", `collection:${anchorKey}`);
    const { minItems, maxItems } = this.#context.config.collections;
    const itemFields = this.#itemFieldsFor(candidate, anchorKey, binding);
    if (itemFields.length === 0) return;
    this.#collectionIdByAnchor.set(anchorKey, collectionId);
    this.#itemIdsByAnchor.set(
      anchorKey,
      candidate.items.map((_item, index) =>
        this.#context.ledger.resolve("item", `${anchorKey}/index:${index}`),
      ),
    );
    this.#collections.push({
      id: collectionId,
      presentation: {
        name: binding.name,
        description: null,
        group: binding.group,
        order: this.#collections.length + 1,
        example: null,
      },
      resolver: resolverFor(binding.sourcePath, `${binding.pointer}/items`),
      itemIdPointer: pointerFor("/id"),
      itemIdPolicy: "server_minted",
      minItems: Math.min(minItems, candidate.items.length),
      maxItems: Math.max(maxItems, candidate.items.length),
      itemFields,
      uniqueness: [],
      deletion: { whenReferenced: "restrict", restorable: true },
    } as ManagedCollectionDescriptor);
    this.#fields.push({
      ...commonOf(binding),
      resolver: resolverFor(binding.sourcePath, `${binding.pointer}/order`),
      capabilities: capabilitiesFor(binding, [
        "collection.reorder",
        "collection.add",
        "collection.remove",
      ]),
      type: "collection",
      collectionId,
    } as ManagedFieldDescriptor);
    this.#findings.push(collectionBoundsFinding(candidate, candidate.items.length));
  }

  #itemFieldsFor(
    candidate: CollectionCandidate,
    anchorKey: string,
    binding: FieldBinding,
  ): readonly ManagedCollectionItemField[] {
    const idsByProperty = new Map<string, StableId<"field">>();
    const fields: ManagedCollectionItemField[] = [];
    for (const [index, spec] of candidate.itemFields.entries()) {
      const itemAnchor = `${anchorKey}/prop:${spec.property}`;
      const fieldId = this.#context.ledger.resolve("field", itemAnchor);
      idsByProperty.set(spec.property, fieldId);
      const built = this.#buildItemField(spec, fieldId, index, binding, candidate);
      if (built !== null) fields.push(built);
    }
    this.#itemFieldIdsByAnchor.set(anchorKey, idsByProperty);
    return fields;
  }

  #buildItemField(
    spec: ItemFieldSpec,
    fieldId: StableId<"field">,
    index: number,
    binding: FieldBinding,
    candidate: CollectionCandidate,
  ): ManagedCollectionItemField | null {
    const presentation = {
      name: spec.property,
      description: null,
      group: `${binding.name} item`,
      order: index + 1,
      example: null,
    } as const;
    const shared = {
      id: fieldId,
      classification: spec.ownership,
      capabilities: itemCapabilitiesFor(spec.kind),
      itemPointer: pointerFor(`/${spec.property}`),
      presentation,
    };
    if (spec.kind === "image") {
      // The walker rejects such collections outright; reaching here is a defect.
      throw new Error(
        `Collection '${candidate.bindingName}' reached the emitter with a per-item image`,
      );
    }
    if (spec.kind === "heading_text") {
      return {
        ...shared,
        type: "heading_text",
        semanticLevel: spec.headingLevel ?? 3,
        constraints: textConstraints(this.#context.config.text.headingMaxLength),
      } as ManagedCollectionItemField;
    }
    if (spec.kind === "link") {
      return {
        ...shared,
        type: "link",
        constraints: linkConstraints(
          { kind: "external", url: "https://example.invalid" },
          false,
          this.#context.config.text.linkLabelMaxLength,
        ),
      } as ManagedCollectionItemField;
    }
    return {
      ...shared,
      type: "plain_text",
      semantic: spec.semantic,
      constraints: textConstraints(
        spec.semantic === "body"
          ? this.#context.config.text.bodyMaxLength
          : this.#context.config.text.labelMaxLength,
      ),
    } as ManagedCollectionItemField;
  }

}

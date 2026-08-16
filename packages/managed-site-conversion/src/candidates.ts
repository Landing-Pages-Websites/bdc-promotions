import type { ManagedRichTextDocument } from "@landing-pages-websites/managed-site-contract";

import type { AnchorPath } from "./anchors.js";
import type { SourceLocation } from "./report.js";

/** What the walker observed, before any contract shape is built. */

export type Ownership = "customer_editable" | "code_owned_interface";

export interface CandidateBase {
  readonly anchor: AnchorPath;
  readonly componentName: string;
  readonly location: SourceLocation;
  readonly evidence: string;
  readonly ownership: Ownership;
}

export interface PlainTextCandidate extends CandidateBase {
  readonly kind: "plain_text";
  readonly semantic: "body" | "label";
  readonly value: string;
}

export interface HeadingCandidate extends CandidateBase {
  readonly kind: "heading_text";
  readonly level: number;
  readonly value: string;
}

export interface RichTextCandidate extends CandidateBase {
  readonly kind: "rich_text";
  readonly document: ManagedRichTextDocument;
  /** Set when the formatted text is itself a heading element. */
  readonly headingLevel: number | null;
}

export type RawDestination =
  | { readonly kind: "fragment"; readonly fragment: string }
  | { readonly kind: "self" }
  | { readonly kind: "external"; readonly url: string }
  | { readonly kind: "email"; readonly address: string }
  | { readonly kind: "phone"; readonly number: string };

export interface LinkCandidate extends CandidateBase {
  readonly kind: "link";
  readonly label: string;
  readonly destination: RawDestination;
  readonly newWindow: boolean;
}

export interface ImageCandidate extends CandidateBase {
  readonly kind: "image";
  readonly source: string;
  readonly altText: string | null;
}

export type ItemFieldKind = "plain_text" | "heading_text" | "link" | "image";

export interface ItemFieldSpec {
  readonly property: string;
  readonly kind: ItemFieldKind;
  readonly semantic: "body" | "label";
  readonly headingLevel: number | null;
  readonly ownership: Ownership;
}

export interface CollectionItemValue {
  readonly property: string;
  readonly value: string;
  /** Only populated for image item fields. */
  readonly altText: string | null;
}

export interface CollectionCandidate extends CandidateBase {
  readonly kind: "collection";
  readonly bindingName: string;
  readonly itemFields: readonly ItemFieldSpec[];
  readonly items: readonly (readonly CollectionItemValue[])[];
}

export type Candidate =
  | PlainTextCandidate
  | HeadingCandidate
  | RichTextCandidate
  | LinkCandidate
  | ImageCandidate
  | CollectionCandidate;

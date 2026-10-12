import type { Metadata } from "next";
import type { ReactElement } from "react";
import { managedSitePageAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import { faqs } from "@/components/signal-home/Close";
import { SignalLane } from "@/components/signal-home/SignalLane";
import { JsonLd } from "@/components/schema/JsonLd";
import {
  buildBusinessSchema,
  buildFaqSchema,
} from "@/components/schema/builders";
import { managedHome } from "@/content/managed-site";
import { buildMetadata } from "@/lib/seo";

const { identity, metadata: seo } = managedHome.seo;

export const metadata: Metadata = buildMetadata({
  title: seo.title,
  description: seo.description,
  siteName: identity.displayName,
  path: seo.canonical,
  robots: {
    index: seo.indexing.index,
    follow: seo.indexing.follow,
    noarchive: !seo.indexing.archive,
    noimageindex: !seo.indexing.imageIndex,
    "max-snippet": seo.indexing.maxSnippet,
    "max-image-preview": seo.indexing.maxImagePreview,
    "max-video-preview": seo.indexing.maxVideoPreview,
  },
});

const businessSchema = buildBusinessSchema(identity);
const faqSchema = buildFaqSchema(
  faqs.map(([question, answer]) => ({
    question,
    // the visible answer is set as lines with non-breaking hyphens; the schema wants plain text
    answer: answer.join(" ").replaceAll("\u2011", "-"),
  })),
);

// The customer-approved Signal Lane homepage. Title, description, indexing and
// identity stay CMS-managed (managedHome.seo); the page copy is the approved design's.
export default function HomePage(): ReactElement {
  return (
    <div
      className="contents"
      {...managedSitePageAttributesV1(managedHome.pageId)}
    >
      <JsonLd data={businessSchema} />
      <JsonLd data={faqSchema} />
      <SignalLane />
    </div>
  );
}

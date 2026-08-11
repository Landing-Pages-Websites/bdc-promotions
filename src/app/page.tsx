import type { Metadata } from "next";
import type { ReactElement } from "react";
import { managedSitePageAttributesV1 } from "@gomega/managed-site-contract";

import { ManagedContact } from "@/components/home/ManagedContact";
import { ManagedFaq } from "@/components/home/ManagedFaq";
import { ManagedHero } from "@/components/home/ManagedHero";
import { JsonLd } from "@/components/schema/JsonLd";
import { buildBusinessSchema, buildFaqSchema } from "@/components/schema/builders";
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
const faqSchema = buildFaqSchema(managedHome.faq.items);

export default function HomePage(): ReactElement {
  return (
    <div className="contents" {...managedSitePageAttributesV1(managedHome.pageId)}>
      <JsonLd data={businessSchema} />
      <JsonLd data={faqSchema} />
      <ManagedHero />
      <ManagedFaq />
      <ManagedContact />
    </div>
  );
}

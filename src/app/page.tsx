import type { Metadata } from "next";
import type { ReactElement } from "react";
import { managedSitePageAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import {
  LandingPage,
  type LandingPageContent,
} from "@/components/home/LandingPage";
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
// The schema wants the words; the content module carries the words and the
// identity of the cell they came from. Narrowed here rather than teaching the
// schema builders what a field id is.
const faqSchema = buildFaqSchema(
  managedHome.faq.items.map((item) => ({
    answer: item.answer.value,
    question: item.question.value,
  })),
);

const landingContent: LandingPageContent = {
  hero: managedHome.hero,
  values: managedHome.values,
  services: managedHome.services,
  focus: managedHome.focus,
  process: managedHome.process,
  insights: {
    eyebrow: managedHome.insights.eyebrow,
    heading: managedHome.insights.heading,
    fieldId: managedHome.insights.fieldId,
    items: managedHome.insights.items.map((item) => ({
      itemId: item.itemId,
      title: item.question,
      description: item.answer,
    })),
  },
  contact: managedHome.contact,
};

const brandIdentity = {
  displayName: managedHome.seo.identity.displayName,
  description: managedHome.seo.identity.description,
  telephone: managedHome.seo.identity.telephone,
};

export default function HomePage(): ReactElement {
  return (
    <div
      className="contents"
      {...managedSitePageAttributesV1(managedHome.pageId)}
    >
      <JsonLd data={businessSchema} />
      <JsonLd data={faqSchema} />
      <LandingPage content={landingContent} identity={brandIdentity} />
    </div>
  );
}

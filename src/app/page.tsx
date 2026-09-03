import type { Metadata } from "next";
import type { ReactElement } from "react";
import { managedSitePageAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import {
  LandingPage,
  type ContentCard,
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

function cards(
  items: readonly {
    readonly title: { readonly value: string };
    readonly description: { readonly value: string };
  }[],
): readonly ContentCard[] {
  return items.map((item) => ({
    title: item.title.value,
    description: item.description.value,
  }));
}

const landingContent: LandingPageContent = {
  hero: {
    eyebrow: managedHome.hero.eyebrow.value,
    title: managedHome.hero.title.value,
    description: managedHome.hero.description.value,
    image: {
      src: managedHome.hero.image.src,
      alt: managedHome.hero.image.alt,
    },
  },
  values: {
    heading: managedHome.values.heading.value,
    description: managedHome.values.description.value,
    items: cards(managedHome.values.items),
  },
  services: {
    heading: managedHome.services.heading.value,
    description: managedHome.services.description.value,
    items: cards(managedHome.services.items),
  },
  focus: {
    eyebrow: managedHome.focus.eyebrow.value,
    heading: managedHome.focus.heading.value,
    description: managedHome.focus.description.value,
    items: cards(managedHome.focus.items),
  },
  process: {
    heading: managedHome.process.heading.value,
    description: managedHome.process.description.value,
    items: cards(managedHome.process.items),
  },
  insights: {
    heading: managedHome.insights.heading.value,
    items: managedHome.insights.items.map((item) => ({
      title: item.question.value,
      description: item.answer.value,
    })),
  },
  contact: {
    eyebrow: managedHome.contact.eyebrow.value,
    heading: managedHome.contact.heading.value,
    description: managedHome.contact.description.value,
  },
};

export default function HomePage(): ReactElement {
  return (
    <div
      className="contents"
      {...managedSitePageAttributesV1(managedHome.pageId)}
    >
      <JsonLd data={businessSchema} />
      <JsonLd data={faqSchema} />
      <LandingPage
        content={landingContent}
        phone={managedHome.seo.identity.telephone}
      />
    </div>
  );
}

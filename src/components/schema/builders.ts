import { siteConfig } from "@/site.config";
import { absoluteUrl, siteOrigin } from "@/lib/seo";

export type SchemaObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/services/roof-repair". */
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ArticleInput {
  headline: string;
  description: string;
  /** Site-relative path of the article page. */
  path: string;
  /** ISO 8601 date, e.g. "2026-07-03". */
  datePublished: string;
  dateModified?: string;
  /** Image path under /public. Defaults to siteConfig.ogImagePath. */
  imagePath?: string;
}

/**
 * Organization or LocalBusiness schema (switches on siteConfig.schemaType),
 * with NAP (name/address/phone) pulled from the config. Render once per
 * site, on the home page.
 */
export function buildBusinessSchema(): SchemaObject {
  const { contact } = siteConfig;
  const base: SchemaObject = {
    "@context": "https://schema.org",
    "@type": siteConfig.schemaType,
    name: siteConfig.businessName,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    url: siteOrigin(),
    logo: absoluteUrl(siteConfig.logoPath),
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.street,
      addressLocality: contact.address.city,
      addressRegion: contact.address.region,
      postalCode: contact.address.postalCode,
      addressCountry: contact.address.country,
    },
    sameAs: siteConfig.socialLinks.map((link) => link.url),
  };

  if (siteConfig.schemaType === "LocalBusiness") {
    base.areaServed = siteConfig.serviceAreas.map((area) => ({
      "@type": "Place",
      name: area,
    }));
  }

  return base;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqSchema(items: FaqItem[]): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildArticleSchema(input: ArticleInput): SchemaObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    image: absoluteUrl(input.imagePath ?? siteConfig.ogImagePath),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      "@type": "Organization",
      name: siteConfig.businessName,
      url: siteOrigin(),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.businessName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.logoPath),
      },
    },
  };
}

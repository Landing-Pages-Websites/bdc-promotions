import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export interface MetadataOverrides {
  /** Page title. Rendered through the "%s | Business Name" template. */
  title?: string;
  description?: string;
  /** Path for the canonical URL, e.g. "/services". Defaults to "/". */
  path?: string;
  /** Override OG image path (under /public). Defaults to siteConfig.ogImagePath. */
  ogImagePath?: string;
}

/** Absolute production origin, e.g. "https://example.com". */
export function siteOrigin(): string {
  return `https://${siteConfig.domain}`;
}

/** Absolute URL for a site path, e.g. absoluteUrl("/services"). */
export function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin()).toString();
}

/**
 * Builds Next.js Metadata from siteConfig plus per-page overrides.
 * Use in every page's `export const metadata = buildMetadata({...})`.
 */
export function buildMetadata(overrides: MetadataOverrides = {}): Metadata {
  const description = overrides.description ?? siteConfig.description;
  const path = overrides.path ?? "/";
  const ogImagePath = overrides.ogImagePath ?? siteConfig.ogImagePath;
  const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

  return {
    metadataBase: new URL(siteOrigin()),
    title: overrides.title
      ? overrides.title
      : {
          default: siteConfig.businessName,
          template: `%s | ${siteConfig.businessName}`,
        },
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.businessName,
      title: overrides.title ?? siteConfig.businessName,
      description,
      url: path,
      locale: siteConfig.locale.replace("-", "_"),
      images: [{ url: ogImagePath, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: overrides.title ?? siteConfig.businessName,
      description,
      images: [ogImagePath],
    },
    ...(gscVerification ? { verification: { google: gscVerification } } : {}),
  };
}

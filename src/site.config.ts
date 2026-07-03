/**
 * Layer 2 — site configuration.
 *
 * This is the ONLY file a site builder must edit to wire up a new customer
 * site. Every `TODO_`-prefixed value is a sentinel: `npm run check-config`
 * (and `npm run build` via `prebuild`) fails while any sentinel remains.
 *
 * Tracking IDs (GA4, GTM, PostHog, etc.) do NOT live here — they are env
 * vars minted later by the provisioning bot. See .env.example.
 */

export interface SiteAddress {
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface SiteContact {
  phone: string;
  email: string;
  address: SiteAddress;
}

export interface SocialLink {
  label: string;
  url: string;
}

export type SchemaType = "LocalBusiness" | "Organization";

export interface SiteConfig {
  /** Public-facing brand name, e.g. "Acme Plumbing". */
  businessName: string;
  /** Registered legal entity name, e.g. "Acme Plumbing LLC". */
  legalName: string;
  /** Bare production domain, no protocol or trailing slash, e.g. "example.com". */
  domain: string;
  /** One-to-two sentence description used for SEO meta + llms.txt. */
  description: string;
  contact: SiteContact;
  /** LocalBusiness for physical/service-area businesses; Organization otherwise. */
  schemaType: SchemaType;
  /** Cities/regions served, e.g. ["Austin, TX", "Round Rock, TX"]. */
  serviceAreas: string[];
  socialLinks: SocialLink[];
  /** Path under /public, e.g. "/logo.png". */
  logoPath: string;
  /** Path under /public, 1200x630, e.g. "/og-image.png". */
  ogImagePath: string;
  /** URL that lead form submissions POST to (JSON body). */
  formEndpoint: string;
  /** Where the lead form redirects after a successful submit. */
  thankYouPath: string;
  /** BCP 47 locale, drives <html lang> and OG locale. */
  locale: string;
}

export const siteConfig: SiteConfig = {
  businessName: "TODO_BUSINESS_NAME",
  legalName: "TODO_LEGAL_NAME",
  domain: "TODO_DOMAIN.example.com",
  description: "TODO_DESCRIPTION — one or two sentences about the business.",
  contact: {
    phone: "TODO_PHONE",
    email: "TODO_EMAIL",
    address: {
      street: "TODO_STREET",
      city: "TODO_CITY",
      region: "TODO_REGION",
      postalCode: "TODO_POSTAL_CODE",
      country: "TODO_COUNTRY",
    },
  },
  schemaType: "LocalBusiness",
  serviceAreas: ["TODO_SERVICE_AREA"],
  socialLinks: [{ label: "TODO_SOCIAL_LABEL", url: "https://TODO_SOCIAL_URL" }],
  logoPath: "/logo.png",
  ogImagePath: "/og-image.png",
  formEndpoint: "https://TODO_FORM_ENDPOINT.example.com/leads",
  thankYouPath: "/thank-you",
  locale: "en-US",
};

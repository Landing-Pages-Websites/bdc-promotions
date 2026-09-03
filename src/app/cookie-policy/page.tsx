import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description: `Cookie policy for ${siteConfig.businessName}.`,
  path: "/cookie-policy",
});

const sections: LegalSection[] = [
  {
    heading: "What Cookies Are",
    body: "Cookies and similar technologies are small pieces of data used to remember preferences, measure website activity, and support reliable site operation.",
  },
  {
    heading: "Cookies We Use",
    body: `${siteConfig.businessName} may use essential storage for site preferences and analytics services such as Google Analytics and PostHog to understand traffic and improve the experience.`,
  },
  {
    heading: "Managing Your Preferences",
    body: "Use the cookie notice to accept or decline analytics. Clearing this site's storage in your browser will remove the saved choice and show the notice again.",
  },
  {
    heading: "Contact",
    body: `Questions about cookies? Call ${siteConfig.businessName} at ${siteConfig.contact.phone} or email ${siteConfig.contact.email}.`,
  },
];

export default function CookiePolicyPage(): ReactElement {
  return <LegalPageLayout title="Cookie Policy" sections={sections} />;
}

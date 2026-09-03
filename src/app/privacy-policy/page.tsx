import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.businessName}.`,
  path: "/privacy-policy",
});

const sections: LegalSection[] = [
  {
    heading: "Information We Collect",
    body: `${siteConfig.businessName} may collect information you choose to provide when contacting us, along with basic website usage and device information collected through analytics tools.`,
  },
  {
    heading: "How We Use Your Information",
    body: "We use this information to respond to inquiries, understand how visitors use the site, improve our services, and communicate about relevant automotive marketing solutions.",
  },
  {
    heading: "Cookies and Analytics",
    body: "The site may use Google Analytics, PostHog, and similar technologies to measure performance. You can manage analytics preferences through the cookie notice. See our Cookie Policy for details.",
  },
  {
    heading: "Data Sharing and Third Parties",
    body: "We may share limited information with service providers that support website hosting, analytics, and business communications. We do not sell personal information.",
  },
  {
    heading: "Your Rights",
    body: "You may ask to access, correct, or delete personal information you have provided to us, subject to applicable law. Contact us using the details below to make a request.",
  },
  {
    heading: "Contact",
    body: `Questions about this policy? Call ${siteConfig.businessName} at ${siteConfig.contact.phone} or email ${siteConfig.contact.email}.`,
  },
];

export default function PrivacyPolicyPage(): ReactElement {
  return <LegalPageLayout title="Privacy Policy" sections={sections} />;
}

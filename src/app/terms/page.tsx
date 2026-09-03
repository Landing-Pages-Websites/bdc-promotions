import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.businessName}.`,
  path: "/terms",
});

const sections: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: `By using this website, you agree to these terms and to use the site only for lawful purposes. If you do not agree, please stop using the site.`,
  },
  {
    heading: "Services",
    body: "BDC Promotions provides automotive marketing and customer engagement services. Website information is general and does not create a service agreement; specific scope, timing, and pricing are governed by a separate written agreement.",
  },
  {
    heading: "Intellectual Property",
    body: "Unless otherwise stated, the website design, copy, graphics, and brand materials are owned by or licensed to BDC Promotions and may not be reproduced without permission.",
  },
  {
    heading: "Limitation of Liability",
    body: "To the fullest extent permitted by law, BDC Promotions is not liable for indirect or consequential losses arising from use of this website. The site is provided as available without guarantees of uninterrupted access.",
  },
  {
    heading: "Governing Law",
    body: "These terms are governed by the laws of the State of Florida, without regard to conflict-of-law principles.",
  },
  {
    heading: "Contact",
    body: `Questions about these terms? Call ${siteConfig.businessName} at ${siteConfig.contact.phone} or email ${siteConfig.contact.email}.`,
  },
];

export default function TermsPage(): ReactElement {
  return <LegalPageLayout title="Terms of Service" sections={sections} />;
}

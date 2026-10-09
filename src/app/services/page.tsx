import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import { buildMetadata } from "@/lib/seo";
import OpeningSection from "./sections/OpeningSection";
import DirectorySection from "./sections/DirectorySection";
import CompareSection from "./sections/CompareSection";
import ContactSection from "./sections/ContactSection";
import styles from "./services.module.css";

const barlow = localFont({
  src: "../../../public/fonts/services/Barlow-Regular.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--services-body",
});

const barlowCondensed = localFont({
  src: "../../../public/fonts/services/BarlowCondensed-Bold.ttf",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--services-heading",
});

const logo = "/images/services/bdc-logo-2026.png";
const phone = "(352) 207-1074";
const phoneHref = "tel:+13522071074";
const overview =
  "BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and AI-supported nurturing to create more qualified sales opportunities.";
const pageMetadata = buildMetadata({
  title: "Automotive Marketing Services",
  description: overview,
  path: "/services",
  ogImagePath: logo,
});

export const metadata: Metadata = {
  ...pageMetadata,
  openGraph: {
    ...pageMetadata.openGraph,
    images: [{ url: logo, width: 1254, height: 749, alt: "BDC Promotions" }],
  },
};

// Copy follows the approved Signal Lane source; no prices or production notes.
const services = [
  {
    id: "automotive-ad-creative",
    name: "Automotive ad creative",
    description:
      "Static, event, inventory and video advertising designed for automotive shoppers.",
    role: "Build the creative for automotive shoppers.",
  },
  {
    id: "lead-generation",
    name: "Lead generation",
    description: "Static ad creation, video ad editing and ad optimization.",
    role: "Connect ad creative with campaign optimization.",
  },
  {
    id: "inventory-advertising",
    name: "Inventory advertising",
    description: "Meta inventory ads and Google Vehicle Listing Ads.",
    role: "Advertise vehicle inventory on Meta and Google.",
  },
  {
    id: "lead-nurturing",
    name: "Lead nurturing & appointment setting",
    description:
      "BDC staff and AI-supported tools nurture the conversation and move interested shoppers toward an appointment with a scheduled day and time.",
    role: "Connect shopper conversations with appointment scheduling.",
  },
] as const;

export default function ServicesPage(): ReactElement {
  return (
    <div className={`${styles.page} ${barlow.variable} ${barlowCondensed.variable}`}>
      <header className={`${styles.container} ${styles.header}`}>
        <Link className={styles.brand} href="/" aria-label="BDC Promotions home">
          <Image
            src={logo}
            alt="BDC Promotions"
            width={1254}
            height={749}
            sizes="180px"
            loading="eager"
          />
        </Link>
        <nav className={styles.navigation} aria-label="Primary navigation">
          <Link href="/services" aria-current="page">Services</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <a className={styles.headerCall} href={phoneHref}>Call {phone}</a>
      </header>

      <main>
        <OpeningSection services={services} overview={overview} />

        <DirectorySection services={services} />

        <CompareSection services={services} />

        <ContactSection phone={phone} phoneHref={phoneHref} />
      </main>
    </div>
  );
}

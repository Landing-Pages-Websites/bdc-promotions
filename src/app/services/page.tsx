import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import { buildMetadata } from "@/lib/seo";
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
        <section className={`${styles.container} ${styles.selector}`} aria-labelledby="services-title">
          <p className={styles.eyebrow}>Automotive marketing</p>
          <h1 id="services-title">Services for the path from scroll to showroom</h1>
          <p className={styles.support}>Choose the pieces your dealership needs or connect the full operating lane.</p>
          <p className={styles.overview}>{overview}</p>
          <a className={styles.compareLink} href="#compare">Compare the services <span aria-hidden="true">↓</span></a>
          <nav className={styles.selectorLinks} aria-label="Explore services">
            {services.map((service) => (
              <a key={service.id} href={`#${service.id}`}>
                <span>{service.name}</span><span aria-hidden="true">↓</span>
              </a>
            ))}
          </nav>
        </section>

        <section className={styles.directory} aria-labelledby="directory-title">
          <div className={styles.container}>
            <h2 id="directory-title">Choose your support</h2>
            <div className={styles.entries}>
              {services.map((service) => (
                <article className={styles.entry} key={service.id} id={service.id} aria-labelledby={`${service.id}-title`}>
                  <h3 id={`${service.id}-title`}>{service.name}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.comparison} id="compare" aria-labelledby="compare-title">
          <div className={`${styles.container} ${styles.compareLayout}`}>
            <div>
              <h2 id="compare-title">Compare the services</h2>
              <p>See where each service fits.</p>
            </div>
            <dl className={styles.compareRows}>
              {services.map((service) => (
                <div key={service.id}>
                  <dt>{service.name}</dt>
                  <dd>{service.role}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.contact} aria-labelledby="contact-title">
          <div className={`${styles.container} ${styles.contactLayout}`}>
            <div>
              <h2 id="contact-title">Find the right mix for your dealership</h2>
              <p>Talk through the creative, media, follow-up and appointment support your store needs.</p>
            </div>
            <div className={styles.contactActions}>
              <Link className={styles.primary} href="/contact">Contact us about your dealership <span aria-hidden="true">→</span></Link>
              <a className={styles.secondary} href="https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call">Book a Strategy Call <span aria-hidden="true">↗</span></a>
              <div className={styles.contactDetails}>
                <a href={phoneHref}>{phone}</a>
                <a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

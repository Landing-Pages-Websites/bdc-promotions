import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { JsonLd } from "@/components/schema/JsonLd";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/phone";
import { siteConfig } from "@/site.config";

const pageTitle = "About BDC Promotions | Automotive Marketing";
const pageDescription =
  "Learn how BDC Promotions helps dealerships create more conversations, appointments, and sales opportunities through focused automotive marketing.";
const organizationId = "https://bdcpromotions.com/#organization";
const aboutPageUrl = "https://bdcpromotions.com/about/";
const aboutPageId = "https://bdcpromotions.com/about/#about";
const publicPhone = "352-207-1074";
const publicPhoneHref = phoneHref(publicPhone);

export const metadata: Metadata = {
  ...buildMetadata({
    title: pageTitle,
    description: pageDescription,
    siteName: siteConfig.businessName,
    path: "/about/",
    robots: {
      index: true,
      follow: true,
    },
  }),
  title: { absolute: pageTitle },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": aboutPageId,
      url: aboutPageUrl,
      name: "About BDC Promotions",
      description: pageDescription,
      mainEntity: { "@id": organizationId },
    },
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "BDC Promotions",
      legalName: "BDC Promotions, Inc.",
      description:
        "Automotive marketing services designed to help dealerships generate more conversations, more appointments, and more sales opportunities.",
      url: absoluteUrl("/"),
      telephone: publicPhone,
      sameAs: ["https://www.linkedin.com/company/bdcpromotions"],
    },
  ],
};

const processSteps = [
  {
    title: "Learn Your Store",
    body: "We start by understanding your dealership, goals, and the type of customers you want to reach.",
  },
  {
    title: "Build The Campaign",
    body: "We develop the social messaging, creative direction, and lead engagement approach around your needs.",
  },
  {
    title: "Engage Shoppers",
    body: "We help create real conversations with shoppers and guide them toward the next step.",
  },
  {
    title: "Drive Appointments",
    body: "We help turn online interest into qualified appointments and showroom visits for your sales team.",
  },
] as const;

export default function AboutPage(): ReactElement {
  return (
    <div id="top" className="site-page">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="BDC Promotions home">
          <span className="brand__mark">BDC</span>
          <span className="brand__copy">
            <strong>BDC Promotions</strong>
            <small>Automotive Marketing</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#services">Services</Link>
          <Link href="/#process">Process</Link>
        </nav>
        <a
          className="button button--compact"
          href={publicPhoneHref}
          aria-label={`Call BDC Promotions at ${publicPhone}`}
        >
          <span className="button__signal" aria-hidden="true" />
          {publicPhone}
        </a>
      </header>

      <main>
        <section
          className="section-shell py-20 md:py-28"
          aria-labelledby="about-title"
        >
          <JsonLd data={aboutSchema} />
          <p className="eyebrow">Our company</p>
          <h1 id="about-title" className="display-title">
            About BDC Promotions
          </h1>
          <p className="hero__description">
            BDC Promotions is an automotive marketing company focused on helping
            dealerships create more conversations, more appointments, and more
            sales opportunities.
          </p>
        </section>

        <section
          className="section-shell value-section"
          aria-labelledby="dealerships-title"
        >
          <div className="section-intro">
            <p className="eyebrow">Who we serve</p>
            <h2 id="dealerships-title">Built for automotive dealerships</h2>
            <p>
              BDC Promotions works with automotive dealership owners, sales
              teams, marketing managers, and dealership BDC teams. Our work is
              built around the day-to-day goal of turning online shopper interest
              into meaningful dealership conversations.
            </p>
          </div>
        </section>

        <section
          id="process"
          className="section-shell process-section"
          aria-labelledby="process-title"
        >
          <div className="section-intro">
            <p className="eyebrow">Our approach</p>
            <h2 id="process-title">How it works</h2>
          </div>
          <ol className="process-grid">
            {processSteps.map((step, index) => (
              <li className="process-card" key={step.title}>
                <span className="process-card__step">Step 0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="contact"
          className="section-shell contact-section"
          aria-labelledby="contact-title"
        >
          <div className="contact-section__copy">
            <p className="eyebrow">Start a conversation</p>
            <h2 id="contact-title">Ready to talk about your dealership?</h2>
            <p>
              Call BDC Promotions at {publicPhone} or request information
              through our contact form.
            </p>
          </div>
          <div className="contact-card">
            <div className="hero__actions">
              <a className="button" href={publicPhoneHref}>
                Call {publicPhone}
              </a>
              <a className="button button--ghost" href="https://bdcpromotions.com/#contact">
                Contact BDC Promotions
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <div>
          <strong>{siteConfig.businessName}</strong>
          <p>{siteConfig.description}</p>
        </div>
        <div className="site-footer__links">
          <a href={publicPhoneHref}>{publicPhone}</a>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookie-policy">Cookies</Link>
        </div>
      </footer>
    </div>
  );
}

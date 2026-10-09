import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import styles from "./service-page.module.css";

const barlow = localFont({
  src: "../../../public/fonts/services/Barlow-Regular.ttf",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--signal-body",
});

const barlowCondensed = localFont({
  src: "../../../public/fonts/services/BarlowCondensed-Bold.ttf",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--signal-heading",
});

type PageLink = { href: string; label: string };

type ServicePageProps = {
  title: string;
  intro: string;
  chapters: PageLink[];
  contactTitle: string;
  contactCopy: string;
  contactLabel: string;
  children: ReactNode;
};

export function ServicePage({
  title, intro, chapters, contactTitle, contactCopy, contactLabel, children,
}: ServicePageProps): ReactElement {
  return (
    <div className={`${styles.page} ${barlow.variable} ${barlowCondensed.variable}`}>
      <header className={`${styles.container} ${styles.header}`}>
        <Link className={styles.brand} href="/" aria-label="BDC Promotions home">
          <Image src="/images/services/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} sizes="180px" loading="eager" />
        </Link>
        <nav className={styles.navigation} aria-label="Primary navigation">
          <Link href="/services" aria-current="location">Services</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <a className={styles.headerCall} href="tel:+13522071074">Call (352) 207-1074</a>
      </header>

      <main id="service-content">
        <section className={`${styles.container} ${styles.hero}`} id="overview" aria-labelledby="service-title">
          <Link className={styles.backLink} href="/services">All services <span aria-hidden="true">↗</span></Link>
          <h1 id="service-title">{title}</h1>
          <p className={styles.intro}>{intro}</p>
          <nav className={styles.chapterLinks} aria-label="On this page">
            {chapters.map(({ href, label }) => (
              <a key={href} href={href}>{label}<span aria-hidden="true">↓</span></a>
            ))}
          </nav>
        </section>

        {children}

        <section className={styles.contact} id="discuss-your-dealership" aria-labelledby="contact-title">
          <div className={`${styles.container} ${styles.contactLayout}`}>
            <div>
              <h2 id="contact-title">{contactTitle}</h2>
              <p>{contactCopy}</p>
            </div>
            <div className={styles.contactActions}>
              <Link className={styles.primary} href="/contact">{contactLabel}<span aria-hidden="true">→</span></Link>
              <a className={styles.secondary} href="https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call">Book a Strategy Call <span aria-hidden="true">↗</span></a>
              <div className={styles.contactDetails}>
                <a href="tel:+13522071074">(352) 207-1074</a>
                <a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`${styles.container} ${styles.footer}`}>
        <p>BDC Promotions · Automotive marketing</p>
        <nav aria-label="Footer navigation">
          <Link href="/services">Services</Link>
          <Link href="/process">Process</Link>
          <Link href="/work">Work</Link>
          <Link href="/about">About</Link>
          <Link href="/blog">Insights</Link>
          <Link href="/pricing">Service Options</Link>
          <Link href="/testimonials">Testimonials</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </div>
  );
}

export function Chapter({ id, title, children }: {
  id: string;
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className={styles.chapter} id={id} aria-labelledby={`${id}-title`}>
      <div className={styles.container}>
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function RelatedLinks({ title, links }: { title: string; links: PageLink[] }): ReactElement {
  return (
    <section className={styles.related} id="related-services" aria-labelledby="related-title">
      <div className={`${styles.container} ${styles.relatedLayout}`}>
        <h2 id="related-title">{title}</h2>
        <ul>
          {links.map(({ href, label }) => (
            <li key={href}><Link href={href}>{label}<span aria-hidden="true">→</span></Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

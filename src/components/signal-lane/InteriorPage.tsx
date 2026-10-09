import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./interior-page.module.css";

const barlow = localFont({
  src: "../../../public/fonts/services/Barlow-Regular.ttf",
  weight: "400", style: "normal", display: "swap", variable: "--interior-body",
});
const barlowCondensed = localFont({
  src: "../../../public/fonts/services/BarlowCondensed-Bold.ttf",
  weight: "700", style: "normal", display: "swap", variable: "--interior-heading",
});

const navigation = [
  ["/services", "Services"], ["/process", "Process"], ["/work", "Work"],
  ["/about", "About"], ["/blog", "Insights"], ["/contact", "Contact"],
] as const;
const footerNavigation = [...navigation, ["/pricing", "Service Options"], ["/testimonials", "Testimonials"]] as const;
export const strategyCall = "https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call";

type PageLink = { href: string; label: string };

export function InteriorPage({ path, title, intro, chapters, children, contactTitle, contactCopy, contactLabel }: {
  path: string;
  title: string;
  intro: string;
  chapters: PageLink[];
  children: ReactNode;
  contactTitle: string;
  contactCopy: string;
  contactLabel: string;
}) {
  return (
    <div className={`${styles.page} ${barlow.variable} ${barlowCondensed.variable}`}>
      <header className={`${styles.container} ${styles.header}`}>
        <Link className={styles.brand} href="/" aria-label="BDC Promotions home">
          <Image src="/images/services/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} sizes="180px" loading="eager" />
        </Link>
        <nav className={styles.navigation} aria-label="Primary navigation">
          {navigation.map(([href, label]) => <Link key={href} href={href} aria-current={href === path ? "page" : undefined}>{label}</Link>)}
        </nav>
        <a className={styles.headerCall} href="tel:+13522071074">Call (352) 207-1074</a>
      </header>
      <main id="interior-content">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="interior-title">
          <h1 id="interior-title">{title}</h1>
          <p className={styles.intro}>{intro}</p>
          <nav className={styles.chapterLinks} aria-label="On this page">
            {chapters.map(({ href, label }) => <a key={href} href={href}>{label}<span aria-hidden="true">↓</span></a>)}
          </nav>
        </section>
        {children}
        <section className={styles.contact} id="discuss-your-dealership" aria-labelledby="contact-title">
          <div className={`${styles.container} ${styles.contactLayout}`}>
            <div><h2 id="contact-title">{contactTitle}</h2><p>{contactCopy}</p></div>
            <div className={styles.contactActions}>
              <Link className={styles.primary} href="/contact">{contactLabel}<span aria-hidden="true">→</span></Link>
              <a className={styles.secondary} href={strategyCall}>Book a Strategy Call <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>
      </main>
      <footer className={`${styles.container} ${styles.footer}`}>
        <p>BDC Promotions · Automotive marketing</p>
        <nav aria-label="Footer navigation">
          {footerNavigation.map(([href, label]) => <Link key={href} href={href} aria-current={href === path ? "page" : undefined}>{label}</Link>)}
        </nav>
        <div className={styles.contactDetails}>
          <a href="tel:+13522071074">(352) 207-1074</a>
          <a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a>
          <a href={strategyCall}>Book a Strategy Call</a>
        </div>
      </footer>
    </div>
  );
}

export function InteriorChapter({ id, title, dark = false, children }: {
  id: string; title: string; dark?: boolean; children: ReactNode;
}) {
  return <section id={id} aria-labelledby={`${id}-title`} className={`${styles.chapter} ${dark ? styles.dark : ""}`}>
    <div className={styles.container}><h2 id={`${id}-title`}>{title}</h2>{children}</div>
  </section>;
}

export function InteriorLinks({ title, links }: { title: string; links: PageLink[] }) {
  return <section className={styles.related} aria-labelledby="related-title">
    <div className={`${styles.container} ${styles.relatedLayout}`}>
      <h2 id="related-title">{title}</h2>
      <ul>{links.map(({ href, label }) => <li key={href}><Link href={href}>{label}<span aria-hidden="true">→</span></Link></li>)}</ul>
    </div>
  </section>;
}

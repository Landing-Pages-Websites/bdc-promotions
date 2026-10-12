import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { SiteFooter, SiteHeader } from "./SiteChrome";

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
  /** A client creative shown beside the heading (pass a <Plate>). */
  visual?: ReactNode;
  children: ReactNode;
};

export function ServicePage({
  title, intro, chapters, contactTitle, contactCopy, contactLabel, visual, children,
}: ServicePageProps): ReactElement {
  return (
    <div data-surface="signal-lane" className={`${styles.page} ${barlow.variable} ${barlowCondensed.variable}`}>
      <SiteHeader path="/services/" />

      <main id="main-content" tabIndex={-1}>
        <section className={`${styles.container} ${styles.hero} ${visual ? styles.heroSplit : ""}`} id="overview" aria-labelledby="service-title">
          <div className={styles.heroCopy}>
          <Link className={styles.backLink} href="/services" data-back><span aria-hidden="true">←</span> All services</Link>
          <h1 id="service-title">{title}</h1>
          <p className={styles.intro}>{intro}</p>
          {/* Skip the fold button when a jump link already offers the same action. */}
          {chapters.some(({ label }) => label === contactLabel) ? null : (
            <Link className={`${styles.primary} ${styles.heroAction}`} href="/contact">{contactLabel}<span aria-hidden="true">→</span></Link>
          )}
          </div>
          {visual ? <div className={styles.heroVisual}>{visual}</div> : null}
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

      <SiteFooter path="/services/" />
    </div>
  );
}

export function Chapter({ id, title, dark = false, children }: {
  id: string;
  title: string;
  dark?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <section className={`${styles.chapter} ${dark ? styles.chapterDark : ""}`} id={id} aria-labelledby={`${id}-title`}>
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

/** A published /work creative in a navy plate, never wider than half its pixels (V207). */
export function Plate({ file, width, height, alt, max = Math.round(width / 2), eager = false }: {
  file: string; width: number; height: number; alt: string; max?: number; eager?: boolean;
}): ReactElement {
  return (
    <div className={styles.plate}>
      <Image src={`/images/signal-work/${file}.png`} width={width} height={height} alt={alt} unoptimized loading={eager ? "eager" : "lazy"} style={{ maxWidth: max }} />
    </div>
  );
}

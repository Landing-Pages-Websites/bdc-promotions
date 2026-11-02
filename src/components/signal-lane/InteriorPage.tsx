import localFont from "next/font/local";
import Link from "next/link";
import type { ReactNode } from "react";

import { strategyCall } from "@/lib/site-navigation";

import { SiteFooter, SiteHeader } from "./SiteChrome";

import styles from "./interior-page.module.css";

const barlow = localFont({
  src: "../../../public/fonts/services/Barlow-Regular.ttf",
  weight: "400", style: "normal", display: "swap", variable: "--interior-body",
});
const barlowCondensed = localFont({
  src: "../../../public/fonts/services/BarlowCondensed-Bold.ttf",
  weight: "700", style: "normal", display: "swap", variable: "--interior-heading",
});

export { strategyCall };

type PageLink = { href: string; label: string };

export function InteriorPage({ path, title, intro, chapters, children, contactTitle, contactCopy, contactLabel, visual }: {
  path: string;
  title: string;
  intro: string;
  chapters: PageLink[];
  children: ReactNode;
  // Legal, thank-you and 404 pages carry no contact band of their own.
  contactTitle?: string;
  contactCopy?: string;
  contactLabel?: string;
  /** A client creative shown beside the heading (pass a <Plate>). */
  visual?: ReactNode;
}) {
  return (
    <div data-surface="signal-lane" className={`${styles.page} ${barlow.variable} ${barlowCondensed.variable}`}>
      <SiteHeader path={path} />
      <main id="main-content" tabIndex={-1}>
        <section className={`${styles.container} ${styles.hero} ${visual ? styles.heroSplit : ""}`} aria-labelledby="interior-title">
          <div className={styles.heroCopy}>
            <h1 id="interior-title">{title}</h1>
            <p className={styles.intro}>{intro}</p>
          </div>
          {visual ? <div className={styles.heroVisual}>{visual}</div> : null}
          {chapters.length ? (
            <nav className={styles.chapterLinks} aria-label="On this page">
              {chapters.map(({ href, label }) => <a key={href} href={href}>{label}<span aria-hidden="true">↓</span></a>)}
            </nav>
          ) : null}
        </section>
        {children}
        {contactTitle ? <section className={styles.contact} id="discuss-your-dealership" aria-labelledby="contact-title">
          <div className={`${styles.container} ${styles.contactLayout}`}>
            <div><h2 id="contact-title">{contactTitle}</h2><p>{contactCopy}</p></div>
            <div className={styles.contactActions}>
              <Link className={styles.primary} href="/contact">{contactLabel}<span aria-hidden="true">→</span></Link>
              <a className={styles.secondary} href={strategyCall}>Book a Strategy Call <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section> : null}
      </main>
      <SiteFooter path={path} />
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

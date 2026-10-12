import localFont from "next/font/local";
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


export function ContactInterior({ children, className }: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div data-surface="signal-lane" className={`${styles.page} ${className} ${barlow.variable} ${barlowCondensed.variable}`}>
      <SiteHeader path="/contact" />
      <main id="main-content" tabIndex={-1}>
        {children}
        <section className={styles.contact} id="discuss-your-dealership" aria-labelledby="contact-title">
          <div className={`${styles.container} ${styles.contactLayout}`}>
            <div><h2 id="contact-title">Prefer to talk directly?</h2><p>Call the office, send an email or choose a time for a strategy call with Justin.</p></div>
            <div className={styles.contactActions}>
              <a className={styles.primary} href={strategyCall}>Book a Strategy Call <span aria-hidden="true">↗</span></a>
              <a className={styles.secondary} href="tel:+13522071074">Call (352) 207-1074 <span aria-hidden="true">→</span></a>
              <a className={styles.secondary} href="mailto:justins@bdc-promotions.com">Email Justin <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter path="/contact" />
    </div>
  );
}

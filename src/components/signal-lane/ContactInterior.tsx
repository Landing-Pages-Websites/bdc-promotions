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
const strategyCall = "https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call";

export function ContactInterior({ children, className }: {
  children: ReactNode;
  className: string;
}) {
  return (
    <div className={`${styles.page} ${className} ${barlow.variable} ${barlowCondensed.variable}`}>
      <header className={`${styles.container} ${styles.header}`}>
        <Link className={styles.brand} href="/" aria-label="BDC Promotions home">
          <Image src="/images/services/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} sizes="180px" loading="eager" />
        </Link>
        <nav className={styles.navigation} aria-label="Primary navigation">
          {navigation.map(([href, label]) => <Link key={href} href={href} aria-current={href === "/contact" ? "page" : undefined}>{label}</Link>)}
        </nav>
        <a className={styles.headerCall} href="tel:+13522071074">Call (352) 207-1074</a>
      </header>
      <main id="interior-content">
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
      <footer className={`${styles.container} ${styles.footer}`}>
        <p>BDC Promotions · Automotive marketing</p>
        <nav aria-label="Footer navigation">
          {footerNavigation.map(([href, label]) => <Link key={href} href={href} aria-current={href === "/contact" ? "page" : undefined}>{label}</Link>)}
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

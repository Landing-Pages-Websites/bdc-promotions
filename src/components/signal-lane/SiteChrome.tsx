import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

import { footerNavigation, primaryNavigation, strategyCall } from "@/lib/site-navigation";

import styles from "./chrome.module.css";

// "page" on the exact route, "location" on its children (/services/x, /blog/x).
function current(href: string, path: string): "page" | "location" | undefined {
  if (href === path) return "page";
  return path.startsWith(`${href}/`) ? "location" : undefined;
}

/** The one header every Signal Lane page renders. */
export function SiteHeader({ path }: { path: string }): ReactElement {
  const links = primaryNavigation.map(([href, label]) => (
    <Link key={href} href={href} aria-current={current(href, path)}>{label}</Link>
  ));
  return (
    <header className={`${styles.container} ${styles.header}`}>
      <Link className={styles.brand} href="/" aria-label="BDC Promotions home">
        <Image src="/images/services/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} sizes="180px" loading="eager" />
      </Link>
      <nav className={styles.navigation} aria-label="Primary navigation">{links}</nav>
      {/* Native disclosure: works without JS; keyed on the route so it closes after navigating. */}
      <details key={path} className={styles.menu}>
        <summary>
          <span className={styles.menuLabel}>Menu</span>
          <span className={styles.menuIcon} aria-hidden="true" />
        </summary>
        <nav aria-label="Primary navigation">{links}</nav>
      </details>
      <a className={styles.headerCall} href="tel:+13522071074">Call (352) 207-1074</a>
    </header>
  );
}

/** The one footer every Signal Lane page renders. */
export function SiteFooter({ path }: { path: string }): ReactElement {
  return (
    <footer className={`${styles.container} ${styles.footer}`}>
      <p>BDC Promotions · Automotive marketing</p>
      <nav aria-label="Footer navigation">
        {footerNavigation.map(([href, label]) => (
          <Link key={href} href={href} aria-current={current(href, path)}>{label}</Link>
        ))}
      </nav>
      <div className={styles.contactDetails}>
        <a href="tel:+13522071074">(352) 207-1074</a>
        <a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a>
        <a href={strategyCall}>Book a Strategy Call</a>
      </div>
    </footer>
  );
}

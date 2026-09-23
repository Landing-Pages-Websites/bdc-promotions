import type { Metadata } from "next";
import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./review-chooser.module.css";

export const metadata: Metadata = {
  title: "BDC Promotions Homepage Review",
  description: "Choose between five BDC Promotions homepage directions.",
  robots: { index: false, follow: false },
};

export default function HomePage(): ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Image src="/images/design/shared/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} preload sizes="150px" />
        <p>Homepage directions · review branch</p>
      </header>
      <div className={styles.intro}>
        <p className={styles.kicker}>Choose a direction</p>
        <h1>Five distinct paths to the showroom.</h1>
        <p>Review each complete responsive homepage. All five directions use the same verified content and customer-supplied work.</p>
      </div>
      <section className={styles.grid} aria-label="Homepage directions">
        <Link className={`${styles.card} ${styles.signal}`} href="/variant-a">
          <span>Direction A</span><strong>Signal Lane</strong>
          <p>Kinetic, technical, proof-forward. A continuous electric route moves from creative to appointment.</p>
          <b>View Signal Lane <i aria-hidden="true">→</i></b>
        </Link>
        <Link className={`${styles.card} ${styles.journal}`} href="/variant-b">
          <span>Direction B</span><strong>Dealer Field Journal</strong>
          <p>Editorial, documentary, assured. A warm folio organizes decisions, method, evidence, and commitment.</p>
          <b>View Dealer Field Journal <i aria-hidden="true">→</i></b>
        </Link>
        <Link className={`${styles.card} ${styles.daylight}`} href="/variant-c">
          <span>Direction C</span><strong>Daylight</strong>
          <p>White and logo blue, polished and modern. Fifteen sections take a dealership from the work to the published prices to a free audit.</p>
          <b>View Daylight <i aria-hidden="true">→</i></b>
        </Link>
        <Link className={`${styles.card} ${styles.nightfall}`} href="/variant-d">
          <span>Direction D</span><strong>Nightfall</strong>
          <p>Cinematic and dark, lit like the showroom at night. The work, the path and the prices sit on quiet panels under one blue accent.</p>
          <b>View Nightfall <i aria-hidden="true">→</i></b>
        </Link>
        <Link className={`${styles.card} ${styles.contrast}`} href="/variant-e">
          <span>Direction E</span><strong>Contrast</strong>
          <p>Bold dealer-retail energy on a strict grid. Dark work bands alternate with bright white ones, set in oversized type.</p>
          <b>View Contrast <i aria-hidden="true">→</i></b>
        </Link>
      </section>
    </main>
  );
}

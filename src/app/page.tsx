import type { Metadata } from "next";
import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./review-chooser.module.css";

export const metadata: Metadata = {
  title: "BDC Promotions Homepage Review",
  description: "Choose between the two approved BDC Promotions homepage directions.",
  robots: { index: false, follow: false },
};

export default function HomePage(): ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Image src="/images/design/shared/bdc-logo-2026.png" alt="BDC Promotions" width={1254} height={749} preload sizes="150px" />
        <p>Approved homepage directions · review branch</p>
      </header>
      <div className={styles.intro}>
        <p className={styles.kicker}>Choose a direction</p>
        <h1>Two distinct paths to the showroom.</h1>
        <p>Review each complete responsive homepage. Both directions use the same approved content and customer-supplied work.</p>
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
      </section>
    </main>
  );
}

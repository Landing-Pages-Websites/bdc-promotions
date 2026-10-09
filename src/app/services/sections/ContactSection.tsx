import type { ReactElement } from "react";
import Link from "next/link";
import styles from "../services.module.css";

export default function ContactSection({ phone, phoneHref }: { phone: string; phoneHref: string }): ReactElement {
  return (
    <section data-section="04-section" className={styles.contact} aria-labelledby="contact-title">
      <div className={`${styles.container} ${styles.contactLayout}`}>
        <div>
          <h2 id="contact-title">Find the right mix for your dealership</h2>
          <p>Talk through the creative, media, follow-up and appointment support your store needs.</p>
        </div>
        <div className={styles.contactActions}>
          <Link className={styles.primary} href="/contact">Contact us about your dealership <span aria-hidden="true">→</span></Link>
          <a className={styles.secondary} href="https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call">Book a Strategy Call <span aria-hidden="true">↗</span></a>
          <div className={styles.contactDetails}>
            <a href={phoneHref}>{phone}</a>
            <a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a>
          </div>
        </div>
      </div>
    </section>
  );
}

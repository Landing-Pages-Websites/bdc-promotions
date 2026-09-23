import Link from "next/link";
import type { ReactElement } from "react";
import { phoneDisplay, phoneHref } from "../content";
import { Close } from "./Close";
import { fontVariables } from "./fonts";
import { Growth } from "./Growth";
import { Hero } from "./Hero";
import { MailIcon, PhoneSolidIcon } from "./icons";
import { Options } from "./Options";
import { Proof } from "./Proof";
import { Signal } from "./Signal";
import { Work } from "./Work";
import styles from "./signal-lane.module.css";

function SignalFooter(): ReactElement {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.frame} ${styles.footerFrame}`}>
        <span className={styles.footerBrand}>BDC Promotions — Automotive Marketing</span>
        <span className={styles.footerDivider} aria-hidden="true" />
        <a className={`${styles.footerLink} ${styles.footerPhone}`} href={phoneHref}>
          <PhoneSolidIcon />
          {phoneDisplay}
        </a>
        <span className={styles.footerDivider} aria-hidden="true" />
        <a className={`${styles.footerLink} ${styles.footerMail}`} href="mailto:justins@bdc-promotions.com">
          <MailIcon />
          justins@bdc-promotions.com
        </a>
      </div>
    </footer>
  );
}

export function SignalLane(): ReactElement {
  return (
    <div className={`${fontVariables} ${styles.page}`}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="BDC Promotions — back to the homepage direction chooser">
          BDC Promotions
        </Link>
      </header>
      <main>
        <Hero />
        <Signal />
        <Growth />
        <Work />
        <Proof />
        <Options />
        <Close />
      </main>
      <SignalFooter />
    </div>
  );
}

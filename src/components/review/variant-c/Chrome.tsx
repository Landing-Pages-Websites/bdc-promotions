import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import s from "./proof-wall.module.css";

const anchors = [
  ["The work", "#work"],
  ["Pricing", "#pricing"],
  ["Process", "#path"],
  ["FAQ", "#faq"],
] as const;

const email = "justins@bdc-promotions.com";

/* The header carries the phone only (every width); the fold owns the single audit CTA. */
export function Header(): ReactElement {
  return (
    <header className={s.header}>
      <Link className={s.logo} href="/" aria-label="BDC Promotions — back to the homepage direction chooser">
        <Image
          src="/images/design/variant-c/bdc-logo.png"
          width={1254}
          height={749}
          alt="BDC Promotions — Automotive Marketing"
          sizes="94px"
          loading="eager"
          className={s.logoImg}
        />
      </Link>
      <nav className={s.anchors} aria-label="Page sections">
        {anchors.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
      <a className={s.headerPhone} href={phoneHref}>
        {phoneDisplay}
      </a>
    </header>
  );
}

/* V74/V88: a fixed call + audit bar on phones. It sits under the consent banner (z-index 50),
   so the banner's buttons are never covered while it is open. Each cell's label is one inline run
   inside the flex anchor: as separate flex items, the space after "Call" and "Free audit" collapsed. */
export function MobileBar(): ReactElement {
  return (
    <nav className={s.mobileBar} aria-label="Call or request an audit">
      <a href={phoneHref} aria-label={`Call ${phoneDisplay}`}>
        <span>
          <span className={s.callWord}>Call </span>
          {phoneDisplay}
        </span>
      </a>
      <a href={auditHref}>
        <span>
          Free audit <span aria-hidden="true">→</span>
        </span>
      </a>
    </nav>
  );
}

export function Footer(): ReactElement {
  return (
    <footer className={s.footer}>
      <p>BDC Promotions — Automotive Marketing</p>
      <a href={phoneHref}>{phoneDisplay}</a>
      <a href={`mailto:${email}`}>{email}</a>
    </footer>
  );
}

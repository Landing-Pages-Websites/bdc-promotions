import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./chrome.module.css";
import { Menu } from "./Menu";
import { navLinks } from "./ui";

const callLabel = `Call BDC Promotions at ${phoneDisplay}`;

function Logo(): ReactElement {
  return (
    <span className={s.logo}>
      <Image src="/images/design/shared/bdc-logo-2026.png" alt="BDC Promotions — Automotive Marketing" width={1254} height={749} sizes="141px" />
    </span>
  );
}

export function Header(): ReactElement {
  return (
    <header className={`${s.siteHead} ${b.dark}`}>
      <div className={`${b.wrap} ${s.headRow}`}>
        <a className={s.brand} href="#top"><Logo /></a>
        <nav className={s.nav} aria-label="Primary">
          {navLinks.map(([href, text]) => <a key={href} href={href}>{text}</a>)}
        </nav>
        <div className={s.headCta}>
          <a className={s.tel} href={phoneHref} aria-label={callLabel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
            {phoneDisplay}
          </a>
          <a className={`${b.btn} ${b.btnBlue} ${s.headBtn}`} href={auditHref}>Free audit</a>
        </div>
        <Menu />
      </div>
    </header>
  );
}

export function Footer(): ReactElement {
  return (
    <footer className={`${s.foot} ${b.dark}`}>
      <div className={b.wrap}>
        <div className={`${b.grid12} ${s.footTop}`}>
          <div className={s.footBrand}>
            <Logo />
            <p className={`${b.small} ${s.footSmall}`}>BDC Promotions — Automotive Marketing</p>
          </div>
          <nav className={s.footCol} aria-label="Footer">
            <p className={`${b.label} ${s.colLabel}`}>Site</p>
            {navLinks.map(([href, text]) => <a key={href} href={href}>{text}</a>)}
          </nav>
          <div className={`${s.footCol} ${s.wide}`}>
            <p className={`${b.label} ${s.colLabel}`}>Contact</p>
            <a href={phoneHref} aria-label={callLabel}>{phoneDisplay}</a>
            <a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com</a>
          </div>
          <div className={`${s.footCol} ${s.wide} ${s.footCta}`}>
            <p className={`${b.label} ${s.colLabel}`}>Free audit</p>
            <a className={`${b.btn} ${b.btnBlue} ${s.footBtn}`} href={auditHref}>Get my free dealership audit</a>
          </div>
        </div>
        <div className={s.footLegal}>
          <div>
            <p className={`${b.small} ${s.footSmall}`}>© 2026 BDC Promotions Inc. All rights reserved.</p>
            <p className={`${b.small} ${s.footDisc}`}>Photographs are illustrative and do not show a BDC Promotions client or location.</p>
          </div>
          <nav aria-label="Legal"><a href="/privacy-policy">Privacy policy</a><a href="/terms">Terms</a><a href="/cookie-policy">Cookie policy</a></nav>
        </div>
      </div>
    </footer>
  );
}

export function MobileBar(): ReactElement {
  return (
    <div className={s.mbar}>
      <a className={`${b.btn} ${b.btnBlue} ${s.mbarBtn}`} href={auditHref}>Free audit</a>
      <a className={`${b.btn} ${b.btnLine} ${s.mbarBtn} ${s.mbarLine}`} href={phoneHref} aria-label={callLabel}>Call</a>
    </div>
  );
}

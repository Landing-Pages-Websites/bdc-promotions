import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./chrome.module.css";
import { PhoneIcon } from "./icons";
import { MenuSheet } from "./Menu";

const LOGO = "/images/design/shared/bdc-logo-2026.png";
const LOGO_ALT = "BDC Promotions — Automotive Marketing";
const EMAIL = "justins@bdc-promotions.com";
// page order: services → process → work → pricing → FAQ
const NAV = [
  ["#services", "Services"],
  ["#process", "Process"],
  ["#work", "Work"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
] as const;
const SERVICES = ["New-car lead generation", "Inventory ads", "Event ads", "Reels & value-proposition videos", "Testimonial videos"];

export function Header(): ReactElement {
  return (
    <header className={s.hdr}>
      <div className={`${b.wrap} ${s.hdrIn}`}>
        <a className={s.logo} href="#top">
          {/* the lettering is white + blue, so the logo only ever sits on ink */}
          <Image src={LOGO} width={120} height={72} sizes="(max-width: 720px) 104px, 120px" alt={LOGO_ALT} />
        </a>
        <nav className={s.nav} aria-label="Primary">
          <ul>
            {NAV.map(([href, label]) => (
              <li key={href}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.hdrCta}>
          <a className={s.hdrPhone} href={phoneHref} aria-label={`Call BDC Promotions at ${phoneDisplay}`}>
            <PhoneIcon />
            <span>{phoneDisplay}</span>
          </a>
          <a className={`${b.btn} ${b.btnAccent} ${b.btnSm} ${s.hdrBtn}`} href={auditHref}>
            Get my free dealership audit
          </a>
          <MenuSheet className={s.menu}>
            <summary>
              <span className={s.mOpen}>Menu</span>
              <span className={s.mClose}>Close</span>
            </summary>
            {/* a full-width sheet under the header (V212), with the audit button at its foot */}
            <div className={s.sheet}>
              <ul>
                {NAV.map(([href, label]) => (
                  <li key={href}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
                <li>
                  <a href={phoneHref}>Call {phoneDisplay}</a>
                </li>
              </ul>
              <a className={`${b.btn} ${b.btnAccent} ${s.sheetBtn}`} href={auditHref}>
                Get my free dealership audit
              </a>
            </div>
          </MenuSheet>
        </div>
      </div>
    </header>
  );
}

// The bottom of the ink close: it continues the final CTA's ground under one hairline.
export function Footer(): ReactElement {
  return (
    <footer className={s.ftr}>
      <div className={b.wrap}>
        <div className={`${b.g12} ${s.ftrTop}`}>
          <div className={s.ftrBrand}>
            <Image src={LOGO} width={120} height={72} sizes="120px" alt={LOGO_ALT} />
            <p>BDC Promotions — automotive marketing</p>
          </div>
          <div className={s.ftrCol}>
            <p className={`${b.label} ${s.ftrLabel}`}>Services</p>
            {SERVICES.map((name) => (
              <a key={name} href="#services">
                {name}
              </a>
            ))}
          </div>
          <div className={s.ftrCol}>
            <p className={`${b.label} ${s.ftrLabel}`}>Contact</p>
            <a href={phoneHref}>{phoneDisplay}</a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
        </div>
        <div className={s.ftrBot}>
          <p className={s.disclose}>Photographs are illustrative and do not show a BDC Promotions client or location.</p>
          <div className={s.legal}>
            <span>© {new Date().getFullYear()} BDC Promotions Inc. All rights reserved.</span>
            <a href="/privacy-policy">Privacy policy</a>
            <a href="/terms">Terms</a>
            <a href="/cookie-policy">Cookie policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MobileBar(): ReactElement {
  return (
    <nav className={s.mbar} aria-label="Quick actions">
      <a className={`${b.btn} ${b.btnAccent} ${s.mbarBtn}`} href={auditHref}>
        Free audit
      </a>
      <a className={`${b.btn} ${s.mbarBtn} ${s.btnCall}`} href={phoneHref}>
        Call
      </a>
    </nav>
  );
}

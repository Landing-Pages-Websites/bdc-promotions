import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./chrome.module.css";
import { Menu } from "./Menu";
import { ArrowBadge } from "./ui";

const anchors = [
  ["Services", "#services"],
  ["Work", "#work"],
  ["Process", "#path"],
  ["Follow-up", "#follow-up"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
] as const;

export function Header(): ReactElement {
  return (
    <header className={s.navWrap}>
      <nav className={`${s.nav} ${b.wrap}`} aria-label="Primary">
        <a className={s.brand} href="#top">
          <Image
            src="/images/design/shared/bdc-logo-2026.png"
            alt="BDC Promotions — Automotive Marketing"
            width={1254}
            height={749}
            sizes="(max-width: 720px) 104px, 120px"
            loading="eager"
          />
        </a>
        <ul className={s.navLinks}>
          {anchors.map(([label, href]) => (
            <li key={href}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
        <div className={s.navCta}>
          <a className={s.navCall} href={phoneHref} aria-label={`Call BDC Promotions at ${phoneDisplay}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />
            </svg>
            {phoneDisplay}
          </a>
          <a className={`${b.btn} ${b.btnPrimary} ${s.navBtn}`} href={auditHref}>
            Free audit
            <ArrowBadge />
          </a>
          <Menu anchors={anchors} />
        </div>
      </nav>
    </header>
  );
}

export function MobileBar(): ReactElement {
  return (
    <nav className={s.mbar} aria-label="Quick actions">
      <a className={`${b.btn} ${b.btnPrimary} ${s.mBtn}`} href={auditHref}>
        Free audit
        <ArrowBadge />
      </a>
      <a className={`${b.btn} ${b.btnGhostDark} ${s.mBtn} ${s.mCall}`} href={phoneHref} aria-label={`Call BDC Promotions at ${phoneDisplay}`}>
        Call
      </a>
    </nav>
  );
}

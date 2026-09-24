import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./close.module.css";
import { ArrowBadge, email } from "./ui";

/* A closing band (fix r2): the headline across ten columns, then one ruled row of lead | actions.
   The audit recap card moved into the audit panel as its deliverable. */
export function Final(): ReactElement {
  return (
    <div className={s.final}>
      <section className={`${b.wrap} ${s.finalIn} ${b.onDark}`} aria-labelledby="fin-h">
        <p className={s.finalLabel}>Free dealership marketing audit</p>
        <h2 id="fin-h">Ready to create more opportunities for your dealership?</h2>
        <div className={s.finalRow}>
          <p className={s.finalLead}>
            Tell us what your store needs, or call now to talk through the right mix of creative, media, follow-up, and
            appointment support.
          </p>
          <div className={`${b.ctaRow} ${s.finalCtas}`}>
            <a className={`${b.btn} ${b.btnPrimary}`} href={auditHref}>
              Get my free dealership audit
              <ArrowBadge />
            </a>
            <a className={`${b.btn} ${b.btnGhostDark} ${s.finalCall}`} href={phoneHref}>
              Call {phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Footer(): ReactElement {
  return (
    <footer className={`${s.footer} ${b.onDark}`}>
      <div className={b.wrap}>
        <div className={s.fGrid}>
          <div className={s.fBrand}>
            <Image src="/images/design/shared/bdc-logo-2026.png" alt="BDC Promotions — Automotive Marketing" width={1254} height={749} sizes="120px" />
            <p className={s.brandline}>BDC Promotions — Automotive Marketing</p>
            <a href={phoneHref}>{phoneDisplay}</a>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
          <nav className={`${s.fCol} ${s.svcCol}`} aria-label="Services">
            <p className={`${b.label} ${s.fLabel}`}>Services</p>
            <a href="#services">New-car lead generation</a>
            <a href="#services">Inventory ads</a>
            <a href="#services">Event ads</a>
            <a href="#services">Reels &amp; value-proposition videos</a>
            <a href="#services">Testimonial videos</a>
          </nav>
          <nav className={s.fCol} aria-label="Page">
            <p className={`${b.label} ${s.fLabel}`}>Page</p>
            <a href="#work">Work</a>
            <a href="#path">Process</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <nav className={s.fCol} aria-label="Contact">
            <p className={`${b.label} ${s.fLabel}`}>Contact</p>
            <a href={auditHref}>Free audit</a>
            <a href={phoneHref}>Call</a>
            <a href={`mailto:${email}`}>Email</a>
          </nav>
        </div>
        <div className={s.fLegal}>
          <p>
            © {new Date().getFullYear()} BDC Promotions Inc. All rights reserved.
            <br />
            Photographs are illustrative and do not show a BDC Promotions client or location.
          </p>
          <nav aria-label="Legal">
            <a href="/privacy-policy">Privacy policy</a>
            <a href="/terms">Terms</a>
            <a href="/cookie-policy">Cookie policy</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

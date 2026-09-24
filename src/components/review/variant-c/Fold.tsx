import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./fold.module.css";
import { ArrowBadge } from "./ui";

const pillars = [
  ["Fast", "Creative and campaigns that move at dealership speed."],
  ["Focused", "Automotive only — never a generic agency playbook."],
  ["Social", "Built for how today’s shoppers actually scroll."],
  ["Results", "Measured on appointments and sales opportunities."],
] as const;

/* ≤720 the photo is a 240px-tall card on the gutter: below 520px (card < 240 × 1.946 = 467px) the cover-fit is
   height-bound at 467px, above that width-bound at 100vw − 2 × gutter. ≥721 it is full-bleed at
   100vw × clamp(600px, min(100svh − 64px, 64vw), 1600px), so the cover-fit is height-bound whenever the viewport
   is narrower than ~2:1: up to 125vw at ≤16:10 (1440×900 renders 1627px), 113vw up to 2:1, and up to ~180vw on
   portrait tablets, where the 600px floor wins. */
const heroSizes =
  "(max-width: 519px) 467px, (max-width: 640px) 90vw, (max-width: 720px) calc(100vw - 64px), (max-width: 1100px) 180vw, (max-aspect-ratio: 8/5) 125vw, (max-aspect-ratio: 2/1) 113vw, 100vw";

export function Hero(): ReactElement {
  return (
    <section className={s.hero} id="top" aria-labelledby="h1">
      <div className={`${b.wrap} ${s.heroGrid}`}>
        <div className={s.heroMain}>
          <p className={s.pillEyebrow}>
            <span className={s.full}>Automotive marketing / creative to appointment</span>
            <span className={s.short}>Automotive marketing</span>
          </p>
          <h1 id="h1">
            Move more shoppers <br className={b.brD} />
            toward{" "}
            <em className={`${b.acc} ${s.hl}`}>your showroom</em>
          </h1>
        </div>
        <div className={s.heroSide}>
          <p className={`${b.lead} ${s.heroLead}`}>
            BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and AI-supported
            nurturing to create more qualified sales opportunities.
          </p>
          <div className={`${b.ctaRow} ${s.heroCtas}`}>
            <a className={`${b.btn} ${b.btnPrimary}`} href={auditHref}>
              Get my free dealership audit
              <ArrowBadge />
            </a>
            <a className={`${b.btn} ${b.btnGhost} ${s.heroCall}`} href={phoneHref}>
              Call {phoneDisplay}
            </a>
          </div>
        </div>
      </div>
      <figure className={s.heroPhoto}>
        <Image
          src="/images/design/shared/photo-night-showroom-retouched.jpg"
          alt="Illustrative night view of a glass-fronted dealership showroom"
          width={3840}
          height={1973}
          sizes={heroSizes}
          preload
        />
      </figure>
    </section>
  );
}

export function Pillars(): ReactElement {
  return (
    <section className={`${s.pillars} ${b.wrap}`} aria-labelledby="pillars-h">
      <h2 id="pillars-h" className={b.sr}>
        Fast / Focused / Social / Results
      </h2>
      <ul className={`${s.pillarsCard} ${b.card}`}>
        {pillars.map(([name, line]) => (
          <li key={name} className={s.pillar}>
            <h3>{name}</h3>
            <p>{line}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Gap(): ReactElement {
  return (
    <section className={`${b.section} ${b.sheetEnd} ${s.gap}`} id="gap" aria-labelledby="gap-h">
      <div className={b.wrap}>
        <div className={b.head}>
          <div className={b.hMain}>
            <p className={b.label}>The appointment gap</p>
            <h2 id="gap-h">
              Impressions don’t sell cars. <br className={b.brD} />
              <em className={b.acc}>Conversations do.</em>
            </h2>
          </div>
          <div className={b.hSide}>
            <p className={b.lead}>
              Most dealership social spend buys reach and raw leads that never reach the sales floor. The number that
              grows on the dashboard has nothing to do with the number of people sitting across from your closers.
            </p>
          </div>
        </div>
        <div className={`${b.card} ${s.gapCard}`}>
          <div className={s.gapGrid}>
            <div className={s.gapCol}>
              <p className={`${b.label} ${s.colLabel}`}>What most campaigns deliver</p>
              <ul className={s.funnel}>
                <li>Impressions</li>
                <li>Clicks</li>
                <li>Raw form fills</li>
              </ul>
            </div>
            <div className={s.gapArrow} aria-hidden="true">
              <svg viewBox="0 0 72 32">
                <path d="M4 16h62M54 6l12 10-12 10" />
              </svg>
            </div>
            <div className={`${s.gapCol} ${s.good}`}>
              <p className={`${b.label} ${s.colLabel}`}>What we build toward</p>
              <ul className={`${b.lane} ${s.convo}`}>
                {["Real shopper conversations", "Booked showroom appointments", "Sales opportunities your team can work"].map((line) => (
                  <li key={line}>
                    <span className={b.node} aria-hidden="true" />
                    <span className={s.say}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={s.gapFoot}>
            <p className={b.body}>
              BDC Promotions is built to close that gap — converting paid attention into real conversations, booked
              appointments, and showroom opportunities, then measuring the work on what your CRM actually records.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

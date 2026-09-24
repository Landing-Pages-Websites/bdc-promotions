import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./hero.module.css";

const pillars = [
  ["Fast", "Creative and campaigns that move at dealership speed."],
  ["Focused", "Automotive only — never a generic agency playbook."],
  ["Social", "Built for how today’s shoppers actually scroll."],
  ["Results", "Measured on appointments and sales opportunities."],
] as const;

const proofLines = ["Real automotive creative.", "Real follow-up.", "A clearer path to appointments."] as const;

export function Hero(): ReactElement {
  return (
    <section className={`${s.hero} ${b.dark}`} id="top" aria-labelledby="h1">
      {/* Cover-scaled: ≥721 the photo is max(100vw, 1.946 × hero height); ≤720 it fills a 4:3.2 band, so 1.946 × 80vw. */}
      <Image
        className={s.heroImg}
        src="/images/design/shared/photo-night-showroom-retouched.jpg"
        alt="Night view of a glass-fronted dealership showroom with vehicles lit inside"
        width={3840}
        height={1973}
        sizes="(max-width: 720px) 156vw, max(100vw, 195vh)"
        preload
      />
      <div className={s.scrim} aria-hidden="true" />
      <div className={`${b.wrap} ${s.inner}`}>
        <p className={`${b.label} ${s.kicker}`}>Automotive marketing / creative to appointment</p>
        <h1 className={`${b.h1} ${s.title}`} id="h1">Turn paid social into more <span className={s.accent}>qualified</span> showroom appointments</h1>
        <p className={`${b.lede} ${s.heroLede}`}>BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and AI-supported nurturing to create more qualified sales opportunities.</p>
        <div className={`${b.actions} ${s.heroActions}`}>
          <a className={`${b.btn} ${b.btnBlue}`} href={auditHref}>Get my free dealership audit <span className={b.arr} aria-hidden="true">→</span></a>
          <a className={`${b.btn} ${b.btnLine} ${s.heroCall}`} href={phoneHref}>Call {phoneDisplay}</a>
        </div>
        <p className={s.offer}>Free dealership marketing audit and consultation — no cost, no obligation.</p>
      </div>
      <div className={b.wrap}>
        <div className={s.rail}>
          <h2 className={b.srOnly}>Fast / Focused / Social / Results</h2>
          <ul className={s.pillars}>
            {pillars.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Positioning(): ReactElement {
  return (
    <section className={s.pos} id="about" aria-labelledby="pos-h">
      {/* 8/4: the statement holds eight columns; the three proof lines are plain ruled rows in the last four */}
      <div className={`${b.wrap} ${b.grid12}`}>
        <div className={s.posMain}>
          <p className={b.label}>Automotive-specialist positioning</p>
          <h2 className={s.posH} id="pos-h">BDC Promotions is built around dealership creative, customer engagement, and the operating path from campaign response to showroom opportunity.</h2>
        </div>
        <div className={s.posSide}>
          <ul className={s.proof3}>
            {proofLines.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <a className={`${b.link} ${s.posLink}`} href="#path">See how the process works <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}

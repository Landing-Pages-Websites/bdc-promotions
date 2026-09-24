import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./hero.module.css";
import { PhoneIcon } from "./icons";

const PILLARS = [
  ["Fast", "Creative and campaigns that move at dealership speed."],
  ["Focused", "Automotive only — never a generic agency playbook."],
  ["Social", "Built for how today’s shoppers actually scroll."],
  ["Results", "Measured on appointments and sales opportunities."],
] as const;

// Rendered width of the cover-scaled photo (3840×1973, ratio 1.946), measured in the route
// (workflow/homepage/c3/notes/e-port.md): ≤720 the box is clamp(260px,64vw,420px) tall, so 506px → 125vw → 817px;
// 721–1080 the stacked proof list makes the hero ~745–778 tall, so the photo is ~1450–1515 wide;
// 1081–1183 the 600px minimum height gives ~1170; above that it is width-bound, or at most ~111vw on a
// 16:10 screen now that the hero fills the viewport height (1596 at 1440×900; 100vw at DPR 2 already serves 3840).
const HERO_SIZES =
  "(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw";

export function Hero(): ReactElement {
  return (
    <section className={s.hero} id="top" aria-labelledby="h1">
      <div className={s.media}>
        <Image
          src="/images/design/shared/photo-night-showroom-retouched.jpg"
          alt="Night view of a glass-fronted car showroom with vehicles lit inside"
          fill
          preload
          sizes={HERO_SIZES}
        />
      </div>
      <div className={`${b.wrap} ${b.g12} ${s.in}`}>
        <div className={s.top}>
          <p className={s.eyebrow}>
            Automotive marketing / creative to appointment
          </p>
          <h1 id="h1" className={b.d1}>
            Move more shoppers toward your showroom
          </h1>
        </div>
        <div className={s.copy}>
          <p className={`${b.lead} ${s.heroLead}`}>
            BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and AI-supported nurturing to create more qualified sales opportunities.
          </p>
          <div className={`${b.actions} ${s.heroActions}`}>
            <a className={`${b.btn} ${b.btnAccent} ${s.heroBtn}`} href={auditHref}>
              Get my free dealership audit
            </a>
            <a className={`${b.btn} ${b.btnGhost} ${s.heroBtn}`} href={phoneHref}>
              <PhoneIcon />
              Call {phoneDisplay}
            </a>
          </div>
          <p className={s.offer}>Free dealership marketing audit and consultation — no cost, no obligation.</p>
          {/* one line under the offer, so the right half of the photograph (the car) stays clear */}
          <ul className={s.proof}>
            <li>Real automotive creative.</li>
            <li>Real follow-up.</li>
            <li>A clearer path to appointments.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Pillars(): ReactElement {
  return (
    <section className={b.sec} aria-labelledby="pillars-h">
      <div className={b.wrap}>
        <div className={s.strip}>
          <h2 id="pillars-h" className={s.stripH}>
            Built for booked appointments, not vanity impressions
          </h2>
          <ul className={s.stripList}>
            {PILLARS.map(([name, line]) => (
              <li key={name}>
                <h3>{name}</h3>
                <p>{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

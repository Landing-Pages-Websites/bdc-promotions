import type { ReactElement } from "react";
import { faqItems, growthSteps } from "../content";
import b from "./base.module.css";
import s from "./path.module.css";

const wire = { viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-hidden": true } as const;
const grey = { fill: "none", stroke: "#8A93A3", strokeWidth: 1.5, vectorEffect: "non-scaling-stroke" } as const;
const blue = { fill: "none", stroke: "#0059FC", strokeWidth: 2, vectorEffect: "non-scaling-stroke" } as const;

/* Centred head; the timeline sits straight on the tint band. */
export function Path(): ReactElement {
  return (
    <section className={b.ruledA} id="path" aria-labelledby="path-h">
      <div className={b.wrap}>
        <div className={`${b.head} ${b.headCenter}`}>
          <p className={b.label}>Process</p>
          <h2 className={b.h2} id="path-h">One connected path from scroll to showroom</h2>
          <p className={b.lede}>Choose the pieces your dealership needs or connect the full operating lane.</p>
        </div>
        <ol className={s.steps}>
          {growthSteps.map(([n, t, d]) => (
            <li key={n} className={s.step}><span className={s.node} aria-hidden="true" /><span className={`${b.num} ${s.stepNum}`}>{n}</span><h3 className={`${b.h4} ${s.stepH4}`}>{t}</h3><p className={b.small}>{d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* A 5/7 split: the head holds the left, the diagram stands on the band to its right. */
export function FollowUp(): ReactElement {
  return (
    <section className={b.pairMid} id="follow-up" aria-labelledby="fu-h">
      <div className={`${b.wrap} ${b.grid12} ${s.fu}`}>
        <div className={s.fuHead}>
          <p className={b.label}>Follow-up</p>
          <h2 className={`${b.h2} ${s.fuH2}`} id="fu-h">Human + <span className={s.nowrap}>AI-supported</span> follow-up</h2>
          <p className={`${b.lede} ${s.fuLede}`}>{faqItems[2][1]}</p>
        </div>
        <div className={s.fd}>
          <div className={s.fdHd}><b>Nurture</b><span>Keep conversations moving.</span></div>
          <div className={s.fdA}><div className={s.nd}><b>Lead</b></div></div>
          <svg className={`${s.c} ${s.c1}`} {...wire}><path d="M0 50 C45 50 55 25 100 25 M0 50 C45 50 55 75 100 75" {...grey} /></svg>
          <svg className={`${s.v} ${s.v1}`} {...wire}><path d="M50 0 C50 50 25 50 25 100 M50 0 C50 50 75 50 75 100" {...grey} /></svg>
          <div className={s.fdB1}><div className={s.nd}><b>BDC staff</b><span>Live BDC Agent Team</span></div></div>
          <div className={s.fdB2}><div className={s.nd}><b>AI-supported tools</b></div></div>
          <svg className={`${s.c} ${s.c2}`} {...wire}><path d="M0 25 C45 25 55 50 100 50 M0 75 C45 75 55 50 100 50" {...blue} /></svg>
          <svg className={`${s.v} ${s.v2}`} {...wire}><path d="M25 0 C25 50 50 50 50 100 M75 0 C75 50 50 50 50 100" {...blue} /></svg>
          <div className={s.fdZ}><div className={s.nd}><b>Appointment</b><span>Scheduled dealership visit with a day and time.</span></div></div>
        </div>
      </div>
    </section>
  );
}

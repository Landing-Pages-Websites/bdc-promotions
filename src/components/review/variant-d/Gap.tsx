import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./gap.module.css";

const delivered = ["Impressions", "Clicks", "Raw form fills"] as const;
const buildToward = ["Real shopper conversations", "Booked showroom appointments", "Sales opportunities your team can work"] as const;
const rowClass = [s.r1, s.r2, s.r3] as const;

export function Gap(): ReactElement {
  return (
    <section className={`${b.ruledB} ${s.gap}`} id="gap" aria-labelledby="gap-h">
      <div className={b.wrap}>
        <div className={`${b.head} ${b.headCenter} ${s.gapHead}`}>
          <p className={b.label}>The Appointment Gap</p>
          <h2 className={b.h2} id="gap-h">Impressions don’t sell cars. <span className={b.br}>Conversations do.</span></h2>
        </div>
        <div className={b.srOnly}>
          <p>What most campaigns deliver</p>
          <ul>{delivered.map((t) => <li key={t}><s>{t}</s></li>)}</ul>
          <p>What we build toward</p>
          <ul>{buildToward.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div className={s.funnel} aria-hidden="true">
          <div className={s.caps}><p className={s.cl}>What most campaigns deliver</p><p className={s.cr}>What we build toward</p></div>
          <div className={s.rows}>
            {delivered.map((t, i) => (
              <div key={t} className={`${s.row} ${rowClass[i]}`}>
                <span className={s.fl}><s>{t}</s></span>
                <span className={`${s.band} ${s.bl}`}><i /></span>
                <span className={`${s.band} ${s.br}`}><i /></span>
                <span className={s.fr}>{buildToward[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={s.notes}>
          <p className={b.body}>Most dealership social spend buys reach and raw leads that never reach the sales floor. The number that grows on the dashboard has nothing to do with the number of people sitting across from your closers.</p>
          <p className={`${b.body} ${s.strong}`}>BDC Promotions is built to close that gap — converting paid attention into real conversations, booked appointments, and showroom opportunities, then measuring the work on what your CRM actually records.</p>
        </div>
      </div>
    </section>
  );
}

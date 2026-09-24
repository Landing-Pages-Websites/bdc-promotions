import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./gap.module.css";

const ROWS = [
  ["r1", "Impressions", "Real shopper conversations"],
  ["r2", "Clicks", "Booked showroom appointments"],
  ["r3", "Raw form fills", "Sales opportunities your team can work"],
] as const;

export function Gap(): ReactElement {
  return (
    <section className={b.sec} id="gap" aria-labelledby="gap-h">
      <div className={b.wrap}>
        <div className={`${b.g12} ${b.head}`}>
          <div className={b.headMain}>
            <p className={b.label}>The appointment gap</p>
            <h2 id="gap-h" className={b.d2}>
              Impressions don’t sell cars. <em className={`${b.acc} ${b.ln}`}>Conversations do.</em>
            </h2>
          </div>
          <p className={b.headAside}>
            Most dealership social spend buys reach and raw leads that never reach the sales floor. The number that grows on the dashboard has nothing to do with the number of people sitting across from your closers.
          </p>
        </div>
        <div className={s.gapd}>
          <div className={`${s.colH} ${s.fromH}`}>
            <p className={`${b.label} ${s.fromLabel}`}>What most campaigns deliver</p>
          </div>
          <div className={`${s.arr} ${s.arrH}`} aria-hidden="true" />
          <div className={`${s.colH} ${s.to} ${s.toH}`}>
            <p className={b.label}>What we build toward</p>
          </div>
          {ROWS.map(([r, from, to]) => (
            <RowTriplet key={r} r={s[r]} from={from} to={to} />
          ))}
        </div>
        <p className={`${b.lead} ${s.gapBody}`}>
          BDC Promotions is built to close that gap — converting paid attention into real conversations, booked appointments, and showroom opportunities, then measuring the work on what your CRM actually records.
        </p>
      </div>
    </section>
  );
}

function RowTriplet({ r, from, to }: { r: string; from: string; to: string }): ReactElement {
  return (
    <>
      <div className={`${s.row} ${s.from} ${r}`}>
        <s>{from}</s>
      </div>
      <div className={s.arr} aria-hidden="true" />
      <div className={`${s.row} ${s.to} ${r}`}>{to}</div>
    </>
  );
}

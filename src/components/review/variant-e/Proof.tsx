import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./proof.module.css";

const EVIDENCE = [
  ["Verified campaign screenshots", "Pulled straight from the ad platforms — real spend, real delivery, never a mockup."],
  ["Dealership CRM outcomes", "Measured against your own system of record — the source of truth your team already trusts."],
] as const;

const STEPS = [
  ["01", "Review your current marketing", "We audit your paid social, creative, and follow-up exactly as they run today — no guesswork, no assumptions."],
  ["02", "Identify the biggest conversion gaps", "We pinpoint where attention is leaking before it ever becomes a conversation or a booked appointment."],
  ["03", "Deliver focused next-step recommendations", "You get a clear, prioritized plan you can act on — free, with no obligation to work with us."],
] as const;

// 10 proof standard, on white straight after the work band, so "receipts" lands on the work:
// the heading and the positioning line as one statement, then the two kinds of proof side by side.
export function Proof(): ReactElement {
  return (
    <section className={b.sec} id="proof" aria-labelledby="proof-h">
      <div className={b.wrap}>
        <div className={`${b.g12} ${s.stmt}`}>
          <div className={s.stmtH}>
            <p className={`${b.label} ${s.stmtLabel}`}>Our proof standard</p>
            <h2 id="proof-h" className={b.d2}>
              We believe in showing the <em className={b.acc}>receipts</em>
            </h2>
          </div>
          <p className={s.posLine}>
            BDC Promotions is built around dealership creative, customer engagement, and the operating path from campaign response to showroom opportunity.
          </p>
        </div>
        <ul className={`${b.g12} ${s.evid}`}>
          {EVIDENCE.map(([title, line]) => (
            <li key={title}>
              <h3 className={b.h3}>{title}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// 11 free audit: a stacked head over three numbered steps in a row, no photograph.
export function Audit(): ReactElement {
  return (
    <section className={b.sec} id="audit" aria-labelledby="audit-h">
      <div className={b.wrap}>
        <div className={s.auditHead}>
          <p className={`${b.label} ${s.auditLabel}`}>How the free audit works</p>
          <h2 id="audit-h" className={b.d2}>
            Three steps. Zero cost. <em className={`${b.acc} ${b.ln}`}>No obligation.</em>
          </h2>
          <p className={s.auditSub}>The audit is genuinely free. Here’s exactly what happens once you request one.</p>
        </div>
        <ol className={`${b.g12} ${s.steps}`}>
          {STEPS.map(([n, title, line]) => (
            <li key={n}>
              <span className={s.stepN}>{n}</span>
              <h3 className={b.h3}>{title}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

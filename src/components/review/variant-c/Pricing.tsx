import type { ReactElement } from "react";
import { auditHref, faqItems, serviceOptions } from "../content";
import b from "./base.module.css";
import s from "./pricing.module.css";
import { ArrowBadge } from "./ui";

const combo = serviceOptions[3];
const [mixQ, , , guaranteeQ] = faqItems;

/* "$2,500 / month" → "$2,500" + a small "/ month" */
function Amount({ price }: { price: string }): ReactElement {
  const [amount, per] = price.split(" / ");
  return (
    <>
      {amount} <small>/ {per}</small>
    </>
  );
}

const proofStandard = [
  ["Verified campaign screenshots", "Pulled straight from the ad platforms — real spend, real delivery, never a mockup."],
  ["Dealership CRM outcomes", "Measured against your own system of record — the source of truth your team already trusts."],
] as const;

export function Pricing(): ReactElement {
  return (
    <section className={`${b.section} ${b.ruled} ${b.chapter}`} id="pricing" aria-labelledby="pr-h">
      <div className={b.wrap}>
        <div className={b.head}>
          <div className={b.hMain}>
            <p className={b.label}>Select the support your store needs</p>
            <h2 id="pr-h">Start with one service. Connect the full lane.</h2>
          </div>
          {/* the two buyer questions beside the head (fix r2: the non-guarantee left the plan list, which is now 3 rows) */}
          <dl className={`${b.hSide} ${s.qa}`}>
            {[mixQ, guaranteeQ].map(([q, a]) => (
              <div key={q}>
                <dt>{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={s.pricing}>
          <article className={`${s.planFeature} ${b.onDark}`} aria-labelledby="plan-combo">
            <div className={s.top}>
              <h3 id="plan-combo">{combo[0]}</h3>
              <span className={s.term}>{combo[2]}</span>
            </div>
            <p className={s.price}>
              <Amount price={combo[1]} />
            </p>
            <div className={s.inc}>
              <p className={b.label}>Includes</p>
              <p>{combo[3]}</p>
            </div>
            <div className={`${b.ctaRow} ${s.pfCtas}`}>
              <a className={`${b.btn} ${b.btnPrimary}`} href={auditHref}>
                Get my free dealership audit
                <ArrowBadge />
              </a>
            </div>
          </article>
          <div className={s.planList}>
            {serviceOptions.slice(0, 3).map(([name, price, term, includes]) => (
              <article key={name} className={s.planRow}>
                <div className={s.nm}>
                  <h3>{name}</h3>
                  <p>{includes}</p>
                </div>
                <div className={s.pr}>
                  <span className={s.amt}>
                    <Amount price={price} />
                  </span>
                  <span className={s.term}>{term}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* A ruled strip, not another 7/5 head (fix r2): a 32px head, the two standards across the full width, then the
   positioning line and the audit link as the strip's last row. */
export function Proof(): ReactElement {
  return (
    <section className={`${b.section} ${b.ruled} ${b.chapter}`} id="proof" aria-labelledby="pf-h">
      <div className={b.wrap}>
        <div className={s.pHead}>
          <p className={b.label}>Proof with standards</p>
          <h2 id="pf-h" className={b.t3}>
            Proof you can inspect. Promises you can trust.
          </h2>
          <p className={b.body}>
            We don’t ask you to take our word for it. When we work with a dealership, proof comes from evidence you can
            verify — not a vanity dashboard or a borrowed case study.
          </p>
        </div>
        <ul className={s.strip}>
          {proofStandard.map(([title, line]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ul>
        <div className={s.pFoot}>
          <p className={s.position}>
            BDC Promotions is built around dealership creative, customer engagement, and the operating path from campaign
            response to showroom opportunity.
          </p>
          <div className={s.pAudit}>
            <p className={b.body}>
              During your free audit we’ll walk you through exactly what that proof looks like and how we’d measure
              success for a store like yours.
            </p>
            <a className={b.tlink} href="#audit">
              See how the process works{" "}
              <span className={b.arr} aria-hidden="true">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

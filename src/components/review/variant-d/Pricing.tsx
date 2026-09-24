import type { ReactElement } from "react";
import { auditHref, faqItems, phoneDisplay, phoneHref, serviceOptions } from "../content";
import b from "./base.module.css";
import s from "./pricing.module.css";

const [bigName, bigPrice, bigTerm, bigIncludes] = serviceOptions[3];
const [bigAmount, bigPer] = bigPrice.split(" / ");
const assurances = [faqItems[3], faqItems[0]] as const;

const evidence = [
  ["01", "Verified campaign screenshots", "Pulled straight from the ad platforms — real spend, real delivery, never a mockup."],
  ["02", "Dealership CRM outcomes", "Measured against your own system of record — the source of truth your team already trusts."],
] as const;

export function Pricing(): ReactElement {
  return (
    <section className={b.ruledA} id="pricing" aria-labelledby="price-h">
      <div className={b.wrap}>
        <div className={`${b.head} ${b.headWide}`}>
          <p className={b.label}>Select the support your store needs</p>
          <h2 className={b.h2} id="price-h">Start with one service. Connect the full lane.</h2>
        </div>
        <div className={`${b.grid12} ${s.priceGrid}`}>
          {/* the connected plan is emphasised by composition only (the night card), with no "popular" label */}
          <article className={`${s.big} ${b.night}`}>
            <h3 className={b.h3}>{bigName}</h3>
            <div className={s.sum} aria-hidden="true"><span className={s.chip}>{serviceOptions[0][0]}</span><span className={s.sumPair}><span className={s.plus}>+</span><span className={s.chip}>{serviceOptions[1][0]}</span></span></div>
            <p className={s.price}><b>{bigAmount}</b><span>/ {bigPer}</span></p>
            <p className={s.term}>{bigTerm}</p>
            <dl className={s.inc}><dt>Includes</dt><dd>{bigIncludes}</dd></dl>
            <div className={`${b.actions} ${s.bigActions}`}>
              <a className={`${b.btn} ${b.btnBlue}`} href={auditHref}>Find the right mix <span className={b.arr} aria-hidden="true">→</span></a>
              <a className={`${b.btn} ${b.btnLine}`} href={phoneHref}>Call {phoneDisplay}</a>
            </div>
          </article>
          <div className={`${s.list} ${b.card}`}>
            {serviceOptions.slice(0, 3).map(([name, price, term, desc]) => (
              <article key={name} className={s.row}><h3 className={b.h4}>{name}</h3><p className={s.rowPrice}>{price}</p><p className={s.t}>{term}</p><p className={`${b.small} ${s.rowSmall}`}>{desc}</p></article>
            ))}
          </div>
        </div>
        <div className={s.assure}>
          {assurances.map(([q, a]) => <div key={q}><h3 className={b.h4}>{q}</h3><p className={`${b.body} ${s.assureBody}`}>{a}</p></div>)}
        </div>
      </div>
    </section>
  );
}

export function Proof(): ReactElement {
  return (
    <section className={b.ruledA} id="proof" aria-labelledby="proof-h">
      <div className={b.wrap}>
        <div className={`${b.grid12} ${s.proof}`}>
          <div className={s.proofHead}>
            <p className={b.label}>Our Proof Standard</p>
            <h2 className={`${b.h2} ${s.pH2}`} id="proof-h">We believe in showing the receipts</h2>
            <p className={`${b.lede} ${s.pLede}`}>We don’t ask you to take our word for it. When we work with a dealership, proof comes from evidence you can verify — not a vanity dashboard or a borrowed case study.</p>
            <p className={`${b.body} ${s.pBody}`}>During your free audit we’ll walk you through exactly what that proof looks like and how we’d measure success for a store like yours.</p>
          </div>
          <ol className={s.ev}>
            {evidence.map(([n, t, d]) => <li key={n}><span className={b.num}>{n}</span><div><h3 className={b.h4}>{t}</h3><p className={`${b.body} ${s.evBody}`}>{d}</p></div></li>)}
          </ol>
        </div>
      </div>
    </section>
  );
}

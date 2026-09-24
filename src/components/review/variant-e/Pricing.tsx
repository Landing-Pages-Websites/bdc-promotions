import type { ReactElement } from "react";
import { auditHref, faqItems, serviceOptions } from "../content";
import b from "./base.module.css";
import s from "./pricing.module.css";

type Option = (typeof serviceOptions)[number];

// content.ts keeps the plan names in Title Case; the page is sentence case, acronyms kept ("BDC").
function sentence(name: string): string {
  return name
    .split(" ")
    .map((w, i) => (i === 0 || w === w.toUpperCase() ? w : w.toLowerCase()))
    .join(" ");
}

// "$2,500 / month" → "$2,500" + "/ month"
function Price({ price }: { price: string }): ReactElement {
  const [amt, per] = price.split(" / ");
  return (
    <p className={s.price}>
      <span className={s.amt}>{amt}</span>
      <span className={s.per}>/ {per}</span>
    </p>
  );
}

// what the plan includes, under a hairline; the rule does the labelling
function Includes({ text }: { text: string }): ReactElement {
  return <p className={s.inc}>{text}</p>;
}

function Plan({ option, cls }: { option: Option; cls: string }): ReactElement {
  const [name, price, term, includes] = option;
  return (
    <article className={`${s.plan} ${cls}`}>
      <h3 className={s.planN}>{sentence(name)}</h3>
      <Price price={price} />
      <p className={s.term}>{term}</p>
      <Includes text={includes} />
    </article>
  );
}

// 09 pricing, on white after the proof standard. Source order is reading order: the two $2,500
// plans, the bracket, the bundle that joins them, then the $750 plan and the terms. The grid puts
// the $750 plan beside the first two on wide screens.
export function Pricing(): ReactElement {
  const [leadGen, bdcTeam, luxury, lane] = serviceOptions;
  const [guaranteeQ, guaranteeA] = faqItems[3];
  const [mixQ, mixA] = faqItems[0];
  return (
    <section className={`${b.sec} ${b.ruled}`} id="pricing" aria-labelledby="price-h">
      <div className={b.wrap}>
        <div className={`${b.g12} ${b.head}`}>
          <div className={b.headMain}>
            <p className={b.label}>Select the support your store needs</p>
            <h2 id="price-h" className={b.d2}>
              Start with one service.
              <br className={b.brk} /> Connect the full lane.
            </h2>
          </div>
          <p className={b.headAside}>Choose the pieces your dealership needs or connect the full operating lane.</p>
        </div>
        <div className={s.plans}>
          <Plan option={leadGen} cls={s.p1} />
          <Plan option={bdcTeam} cls={s.p2} />
          <div className={s.merge} aria-hidden="true" />
          <article className={`${s.plan} ${s.lane}`}>
            <div className={s.laneL}>
              <h3 className={s.planN}>{sentence(lane[0])}</h3>
              <Price price={lane[1]} />
              <p className={s.term}>{lane[2]}</p>
            </div>
            <div className={s.laneR}>
              <Includes text={lane[3]} />
              <a className={`${b.btn} ${b.btnAccent} ${s.laneBtn}`} href={auditHref}>
                Get my free dealership audit
              </a>
            </div>
          </article>
          <Plan option={luxury} cls={s.p3} />
          <aside className={s.guar} aria-labelledby="guar-h">
            <p className={`${b.label} ${s.guarLabel}`}>Terms</p>
            <h3 id="guar-h" className={b.h3}>
              {guaranteeQ}
            </h3>
            <p>{guaranteeA}</p>
            <hr />
            <h3 className={b.h3}>{mixQ}</h3>
            <p>{mixA}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

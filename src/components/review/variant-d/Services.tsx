import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./services.module.css";

const rows = [
  ["01", "New-car lead generation", "Paid social campaigns built to put your new-car inventory in front of in-market shoppers and start real conversations your BDC team can follow up on."],
  ["02", "Inventory ads", "Turn the vehicles on your lot into scroll-stopping ads that move specific units — not just rack up impressions."],
  ["03", "Event ads", "Fill your sales events and seasonal pushes with campaigns designed to drive foot traffic and appointments."],
  ["04", "Reels & value-proposition videos", "Short-form video that tells shoppers why your store — the reasons to buy from you, delivered in their feed."],
  ["05", "Testimonial videos", "Real customer stories, produced to build trust before a shopper ever walks onto your lot."],
] as const;

/* Five services as one ruled table in a card: number, name, outcome. No photograph (the work band above is the proof). */
export function Services(): ReactElement {
  return (
    <section className={b.pairA} id="services" aria-labelledby="svc-h">
      <div className={b.wrap}>
        <div className={b.headSplit}>
          <div><p className={b.label}>Automotive Marketing Services</p><h2 className={b.h2} id="svc-h">Everything paid social should do for a dealership</h2></div>
          <p className={b.lede}>Five services, built for how cars actually get sold today. Each one is scoped to a real dealership outcome — not a generic marketing deliverable.</p>
        </div>
        <ul className={`${b.card} ${s.rows}`}>
          {rows.map(([n, t, d]) => (
            <li key={n}><span className={b.num}>{n}</span><h3 className={`${b.h4} ${s.rowH4}`}>{t}</h3><p className={`${b.body} ${s.rowBody}`}>{d}</p></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

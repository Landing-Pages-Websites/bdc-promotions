import type { ReactElement } from "react";
import { serviceOptions } from "../content";
import { serviceIndexes } from "./ads";
import { Actions, Eyebrow, Price } from "./Bits";
import ui from "./proof-wall.module.css";
import s from "./ledger.module.css";

const columnLabels = ["No.", "Service", "Price", "Terms", "Includes"] as const;

/* Under a "Terms" heading the Luxury Video cell reads "1 new video each month", not "Includes 1 new
   video…" (content.ts keeps the /lp wording; the "Includes" column is the next cell). */
const termsText = (term: string): string => term.replace(/^Includes /, "");

/* Window-sticker ledger on graphite: the same band + ruled rows as the fold sticker, at full size. */
export function Pricing(): ReactElement {
  return (
    <section className={`${s.pricing} ${ui.onDark}`} id="pricing" aria-labelledby="c-pricing-title">
      <div className={ui.container}>
        <Eyebrow tone="fog">Select the support your store needs</Eyebrow>
        <h2 id="c-pricing-title" className={ui.h2}>
          Start with one service. Connect the full lane.
        </h2>
        <div className={s.panel}>
          <p className={s.panelStrip}>Services &amp; pricing</p>
          <div className={`${s.ledgerRow} ${s.ledgerLabels}`} aria-hidden="true">
            {columnLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <ol className={s.ledger}>
            {serviceIndexes.map((i) => {
              const [name, , term, includes] = serviceOptions[i];
              return (
                <li key={name} className={s.ledgerRow}>
                  <span className={s.ledgerNo}>{`0${i + 1}`}</span>
                  <h3 className={s.serviceName}>{name}</h3>
                  <p className={s.ledgerPrice}>
                    <span className={s.cellLabel}>Price</span>
                    <Price index={i} />
                  </p>
                  {/* One line under name + price on phones; two cells everywhere else. */}
                  <div className={s.ledgerMeta}>
                    <p className={s.ledgerTerm}>
                      <span className={s.cellLabel}>Terms</span>
                      {termsText(term)}
                    </p>
                    <p className={s.ledgerIncludes}>
                      <span className={s.cellLabel}>Includes</span>
                      {includes}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className={s.panelFoot}>
            <div>
              <p className={s.qa}>Are results guaranteed?</p>
              <p>No specific lead, appointment, show, or sales result is guaranteed.</p>
            </div>
            <div>
              <p className={s.qa}>Do we have to buy every service?</p>
              <p>No. Dealerships may select individual services or connect them into a broader program.</p>
            </div>
          </div>
        </div>
        <Actions className={ui.gapTopLg} />
      </div>
    </section>
  );
}

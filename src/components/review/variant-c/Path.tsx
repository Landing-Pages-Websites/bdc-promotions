import type { ReactElement } from "react";
import { growthSteps } from "../content";
import { Eyebrow } from "./Bits";
import ui from "./proof-wall.module.css";
import s from "./path.module.css";

/* The path lane on concrete (between the graphite pricing and graphite close). The AI showroom band
   was removed in round 1: a "real work only" page carries no illustrative art. */
export function Path(): ReactElement {
  return (
    <section className={s.path} id="path" aria-labelledby="c-path-title">
      <div className={ui.container}>
        <div className={ui.headRow}>
          <div className={ui.headMain}>
            <Eyebrow>Strategy → Creative → Optimization → Nurture → Appointment</Eyebrow>
            <h2 id="c-path-title" className={ui.h2}>
              One connected path from scroll to showroom.
            </h2>
          </div>
          <div className={ui.headSide}>
            <p className={ui.lead}>Choose the pieces your dealership needs or connect the full operating lane.</p>
          </div>
        </div>
        <ol className={s.lane}>
          {growthSteps.map(([number, title, copy]) => (
            <li key={number}>
              <span className={s.laneNumber}>{number}</span>
              <span className={s.laneRule} aria-hidden="true" />
              <h3 className={ui.h3}>{title}</h3>
              <p className={s.laneCopy}>{copy}</p>
            </li>
          ))}
        </ol>
        <p className={s.pathEnd}>Set the visit. Win the appointment.</p>
      </div>
    </section>
  );
}

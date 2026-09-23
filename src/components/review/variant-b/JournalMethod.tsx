import Image from "next/image";
import type { ReactElement } from "react";
import { growthSteps } from "../content";
import { CameraIcon, CheckBadgeIcon } from "./JournalIcons";
import g from "./journal-growth.module.css";
import m from "./journal-mat.module.css";
import s from "./journal-signal.module.css";

/* "‑" in compound words below is U+2011 (non-breaking hyphen): "follow‑up" never splits as "follow- / up" on phones. */
const signals = [
  ["01", "Fast", "Automotive‑specific strategy"],
  ["02", "Focused", "Static + video creative"],
  ["03", "Social", "Human + AI‑supported follow‑up"],
  ["04", "Results", "Scheduled appointment focus"],
] as const;

/* Handwritten margin notes, broken exactly as image 2 sets them. */
const notes = [
  ["Start with", "strategy."],
  ["Build what", "moves the", "right shoppers."],
  ["Optimize for", "qualified", "opportunities."],
  ["Keep", "conversations", "moving."],
  ["Set the visit.", "Win the", "appointment."],
] as const;

/* Step copy wraps as the image does. */
const stepLines: Record<string, readonly string[]> = {
  "01": ["Shape the campaign around your", "store, inventory, market, and", "sales priorities."],
  "02": ["Build static, event, inventory,", "and video advertising designed", "for automotive shoppers."],
  "03": ["Launch and refine paid campaigns", "around qualified dealership", "opportunities."],
  "04": ["Use BDC staff and AI tools to", "keep conversations moving", "quickly and professionally."],
  "05": ["Move interested shoppers", "toward a scheduled dealership", "visit with a day and time."],
};

export function OperatingSignal(): ReactElement {
  return (
    <section className={s.signal} aria-labelledby="b-signal-title">
      <div className={s.signalWrap}>
        <span className={s.stub} aria-hidden="true" />
        <h2 id="b-signal-title" className={s.signalTitle}>
          Fast / Focused / Social / Results
        </h2>
        <ol className={s.signalCols}>
          {signals.map(([n, word, copy]) => (
            <li key={n}>
              <span className={s.signalNum} aria-hidden="true">
                {n}
              </span>
              <span className={s.signalRule} aria-hidden="true" />
              <h3>{word}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
        <p className={s.disclaimer}>No unverified dealership count, ad-spend total, client logos, or outcome statistics.</p>
        <span className={s.arrowRule} aria-hidden="true" />
      </div>
    </section>
  );
}

export function GrowthLane(): ReactElement {
  return (
    <section className={g.growth} id="b-growth" aria-labelledby="b-growth-title">
      <div className={g.growthWrap}>
        <span className={g.timeline} aria-hidden="true" />
        <ol className={g.steps}>
          {growthSteps.map(([n, title], i) => (
            <li key={n} className={g.step}>
              <span className={g.node} aria-hidden="true" />
              <p className={g.note}>
                {notes[i].map((line) => (
                  <span key={line}>{line}</span>
                ))}
                <svg className={g.noteArrow} viewBox="0 0 52 14" aria-hidden="true" focusable="false">
                  <path d="M1 5.5c12 3.5 30 4 47 1.2M41.5 1.5l7 5.2-7.4 4.6" />
                </svg>
              </p>
              <span className={g.stepNum}>{n}</span>
              <CheckBadgeIcon className={g.stepCheck} />
              <h3 className={g.stepTitle}>{title}</h3>
              <p className={g.stepCopy}>
                {stepLines[n].map((line) => (
                  <span key={line}>{line} </span>
                ))}
              </p>
            </li>
          ))}
        </ol>
        <div className={g.growthIntro}>
          <h2 id="b-growth-title" className={g.growthTitle}>
            <span>One Connected Path</span> <span>From Scroll to Showroom</span>
          </h2>
          <span className={g.growthRule} aria-hidden="true" />
          <p>
            <span>Choose the pieces your dealership needs</span> <span>or connect the full operating lane.</span>
          </p>
        </div>
        <figure className={m.mat}>
          <div className={m.matBox}>
            <div className={m.matImage}>
              <Image
                src="/images/design/variant-b/growth-repo-sale.png"
                alt="Customer-supplied Massive Repo Sale creative: bank repos, one-owner trade-ins, lease returns and auction vehicles, $0 down, payments as low as $99 a month, $2,000 voucher"
                fill
                sizes="(max-width: 1179px) 86vw, 36vw"
              />
            </div>
            <span className={`${m.reg} ${m.regTop}`} aria-hidden="true" />
            <span className={`${m.reg} ${m.regBottom}`} aria-hidden="true" />
            <span className={`${m.tick} ${m.tickTL}`} aria-hidden="true" />
            <span className={`${m.tick} ${m.tickTR}`} aria-hidden="true" />
            <span className={`${m.tick} ${m.tickBL}`} aria-hidden="true" />
            <span className={`${m.tick} ${m.tickBR}`} aria-hidden="true" />
          </div>
          <figcaption>
            <CameraIcon className={m.camera} /> Source note / campaign creative example
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

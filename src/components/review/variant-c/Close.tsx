import type { ReactElement } from "react";
import { faqItems } from "../content";
import { Actions, Eyebrow } from "./Bits";
import ui from "./proof-wall.module.css";
import s from "./close.module.css";

const auditSteps = [
  "Review your current marketing",
  "Identify the biggest conversion gaps",
  "Deliver focused next-step recommendations",
] as const;

/* The two questions already answered in the pricing ledger footer ("Do we have to buy every service?",
   "Are results guaranteed?") are not repeated here. The states answer is content-sources record
   target-states-faq; the question is its pairing in src/components/lp/LpFaq.tsx. */
const printedInLedger = new Set(["Do we have to buy every service?", "Are results guaranteed?"]);
/* "The supplied work covers…" is the asset manifest's word, not a buyer's (V167): C prints "The work covers…". */
const faq: readonly (readonly [string, string])[] = [
  ...faqItems
    .filter(([question]) => !printedInLedger.has(question))
    .map(([question, answer]) => [question, answer.replace(/^The supplied work/, "The work")] as const),
  [
    "Which states do you work with?",
    "We partner with dealerships across multiple U.S. states. Share your details on the form or give us a call and we’ll confirm fit for your market.",
  ],
];

export function Close(): ReactElement {
  return (
    <section className={`${s.close} ${ui.onDark}`} id="faq" aria-labelledby="c-close-title">
      <div className={`${ui.container} ${s.split75}`}>
        <div>
          <Eyebrow tone="fog">Your next move</Eyebrow>
          {/* The verified /lp offer: "Free dealership marketing audit and consultation — no cost, no obligation." */}
          <h2 id="c-close-title" className={ui.h2}>
            <span className={s.line}>Start with a free audit.</span> <span className={s.line}>No obligation.</span>
          </h2>
          <p className={`${ui.lead} ${ui.fogText} ${s.closeLead}`}>
            Tell us what your store needs, or call now to talk through the right mix of creative, media, follow-up, and
            appointment support.
          </p>
          <ol className={s.auditSteps}>
            {auditSteps.map((step, i) => (
              <li key={step}>
                <span className={`${ui.label} ${ui.fogText}`}>{`0${i + 1}`}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Actions />
        </div>
        <div>
          <h3 className={ui.h3}>Frequently asked questions</h3>
          <div className={s.faqList}>
            {faq.map(([question, answer]) => (
              <div key={question}>
                <h4 className={s.faqQ}>{question}</h4>
                <p>{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

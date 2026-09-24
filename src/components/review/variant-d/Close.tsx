import type { ReactElement, ReactNode } from "react";
import { auditHref, faqItems, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./close.module.css";

const auditSteps = [
  ["01", "Review your current marketing", "We audit your paid social, creative, and follow-up exactly as they run today — no guesswork, no assumptions."],
  ["02", "Identify the biggest conversion gaps", "We pinpoint where attention is leaking before it ever becomes a conversation or a booked appointment."],
  ["03", "Deliver focused next-step recommendations", "You get a clear, prioritized plan you can act on — free, with no obligation to work with us."],
] as const;

// FAQ items 1–3 of the /lp set answer "is this for my store?", so they open as their own section.
const fit = [
  ["Who is the free dealership audit for?", "Franchise dealerships and established independent dealers running — or planning to run — paid social. If you sell cars and want more real showroom appointments, the audit is built for you."],
  ["Do I need a certain inventory size to qualify?", "The audit is open to any dealership. We ask your inventory size (fewer than 50, or 50 or more) so we can tailor the recommendations to your store — it doesn’t affect whether you can request the audit."],
  ["Which states do you work with?", "We partner with dealerships across multiple U.S. states. Share your details on the form or give us a call and we’ll confirm fit for your market."],
] as const;

// FAQ 1 uses A's verified answer, which drops the build-language "The supplied work covers…" (VERIFIED-COPY:383).
const faqs: ReadonlyArray<readonly [string, ReactNode]> = [
  [faqItems[1][0], "Static, event, new-car, employee, luxury, viral, testimonial, inventory, and Google vehicle-listing advertising."],
  ["What’s included in the free audit?", "A review of your current paid social and creative, the biggest conversion gaps we find, and a prioritized set of next steps. There’s no cost and no obligation to work with us afterward."],
  ["How do I get started?", <>Complete <a href={auditHref}>the short form</a> or call <a href={phoneHref}>{phoneDisplay}</a>. Either way you reach the BDC Promotions team directly — no call center in between.</>],
];

const recap = [
  "A full review of your current paid social and creative",
  "The biggest conversion gaps between spend and appointments",
  "Prioritized next steps — free, with no obligation",
] as const;

/* 5/7: the head and the one audit action hold columns 1–5; the three steps, led by 48px blue numerals, hold 7–12. */
export function Audit(): ReactElement {
  return (
    <section className={b.ruledA} id="audit" aria-labelledby="audit-h">
      <div className={`${b.wrap} ${b.grid12} ${s.audit}`}>
        <div className={s.aHead}>
          <p className={b.label}>How The Free Audit Works</p>
          <h2 className={`${b.h2} ${s.aH2}`} id="audit-h">Three steps. Zero cost. <span className={b.br}>No obligation.</span></h2>
          <p className={`${b.lede} ${s.aLede}`}>The audit is genuinely free. Here’s exactly what happens once you request one.</p>
          <div className={`${b.actions} ${s.aActions}`}><a className={`${b.btn} ${b.btnBlue}`} href={auditHref}>Start my free audit <span className={b.arr} aria-hidden="true">→</span></a></div>
        </div>
        <ol className={s.aSteps}>
          {auditSteps.map(([n, t, d]) => <li key={n}><span className={s.aNum}>{n}</span><div><h3 className={b.h4}>{t}</h3><p className={`${b.body} ${s.stepBody}`}>{d}</p></div></li>)}
        </ol>
      </div>
    </section>
  );
}

/* Who it's for: three open answers in a 4/4/4 ruled grid on the same tint as the audit. */
export function Fit(): ReactElement {
  return (
    <section className={b.ruledA} id="fit" aria-labelledby="fit-h">
      <div className={b.wrap}>
        <div className={b.head}>
          <p className={b.label}>Who it’s for</p>
          <h2 className={b.h2} id="fit-h">Before you request your audit</h2>
        </div>
        <ul className={`${b.grid12} ${s.fit}`}>
          {fit.map(([q, a]) => <li key={q}><h3 className={b.h4}>{q}</h3><p className={`${b.body} ${s.fitBody}`}>{a}</p></li>)}
        </ul>
      </div>
    </section>
  );
}

export function Faq(): ReactElement {
  return (
    <section className={b.ruledB} id="faq" aria-labelledby="faq-h">
      <div className={`${b.wrap} ${b.grid12} ${s.faq}`}>
        <div className={s.faqHead}>
          <p className={b.label}>Questions &amp; Answers</p>
          <h2 className={`${b.h2} ${s.fH2}`} id="faq-h">Frequently asked questions</h2>
          <p className={`${b.body} ${s.fBody}`}>The details dealership operators ask us most often. Still unsure? Call and we’ll answer directly.</p>
        </div>
        <div className={s.list}>
          {faqs.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<span className={s.pm} aria-hidden="true" /></summary>
              <p className={`${b.body} ${s.ans}`}>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Close(): ReactElement {
  return (
    <section className={b.flushTop} id="contact" aria-labelledby="close-h">
      <div className={b.wrap}>
        <div className={`${s.close} ${b.night}`}>
          <div className={s.copy}>
            <p className={b.label}>Free audit</p>
            <h2 className={`${b.h2} ${s.cH2}`} id="close-h">Ready to create more opportunities for your dealership?</h2>
            <p className={`${b.lede} ${s.cLede}`}>Tell us what your store needs, or call now to talk through the right mix of creative, media, follow-up, and appointment support.</p>
            <div className={`${b.actions} ${s.cActions}`}>
              <a className={`${b.btn} ${b.btnBlue}`} href={auditHref}>Get my free dealership audit <span className={b.arr} aria-hidden="true">→</span></a>
              <a className={`${b.btn} ${b.btnLine} ${s.cCall}`} href={phoneHref}>Call {phoneDisplay}</a>
            </div>
          </div>
          <div className={s.recap}>
            <p className={b.body}>Request your free dealership audit and consultation. Here’s what you’ll get back:</p>
            <ul>{recap.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

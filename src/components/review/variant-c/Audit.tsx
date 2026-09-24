import type { ReactElement, ReactNode } from "react";
import { auditHref, faqItems, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./audit.module.css";
import { ArrowBadge, email } from "./ui";

const auditSteps = [
  ["01", "Review your current marketing", "We audit your paid social, creative, and follow-up exactly as they run today — no guesswork, no assumptions."],
  ["02", "Identify the biggest conversion gaps", "We pinpoint where attention is leaking before it ever becomes a conversation or a booked appointment."],
  ["03", "Deliver focused next-step recommendations", "You get a clear, prioritized plan you can act on — free, with no obligation to work with us."],
] as const;

const [, creativeQ] = faqItems;

/* what the audit hands back (fix r2: moved here from the final band, where it replaced the consultation photo) */
const recap = [
  "A full review of your current paid social and creative",
  "The biggest conversion gaps between spend and appointments",
  "Prioritized next steps — free, with no obligation",
] as const;

/* The two /lp "who" Q&As (moved here from Who in fix r1), the creative Q&A, then the two /lp FAQ items. The creative
   answer is A:72's short form, as the prototype prints it (content.ts carries the "The supplied work covers…" wording).
   "What happens after a lead comes in?" answers the Follow-up section now (fix r2), so it is not repeated here. */
const faq: ReadonlyArray<readonly [string, ReactNode]> = [
  [
    "Do I need a certain inventory size to qualify?",
    "The audit is open to any dealership. We ask your inventory size (fewer than 50, or 50 or more) so we can tailor the recommendations to your store — it doesn’t affect whether you can request the audit.",
  ],
  [
    "Which states do you work with?",
    "We partner with dealerships across multiple U.S. states. Share your details on the form or give us a call and we’ll confirm fit for your market.",
  ],
  [creativeQ[0], "Static, event, new-car, employee, luxury, viral, testimonial, inventory, and Google vehicle-listing advertising."],
  [
    "What’s included in the free audit?",
    "A review of your current paid social and creative, the biggest conversion gaps we find, and a prioritized set of next steps. There’s no cost and no obligation to work with us afterward.",
  ],
  [
    "How do I get started?",
    <>
      Complete the <a href={auditHref}>short form</a> or call <a href={phoneHref}>{phoneDisplay}</a>. Either way you reach
      the BDC Promotions team directly — no call center in between.
    </>,
  ],
];

export function Audit(): ReactElement {
  return (
    <section className={`${b.section} ${s.auditSec}`} id="audit" aria-labelledby="au-h">
      <div className={`${b.wrap} ${s.auditPanel} ${b.onDark}`}>
        <div className={b.head}>
          <div className={b.hMain}>
            <p className={b.label}>How the free audit works</p>
            <h2 id="au-h">
              Three steps. Zero cost. <br className={b.brD} />
              <em className={b.acc}>No obligation.</em>
            </h2>
          </div>
          <div className={b.hSide}>
            <p className={b.lead}>The audit is genuinely free. Here’s exactly what happens once you request one.</p>
          </div>
        </div>
        {/* fix r2: no stock-style consultation photo. The steps take cols 1–7; the deliverable card takes the right line */}
        <div className={s.audit}>
          <ol className={s.aSteps}>
            {auditSteps.map(([num, title, copy]) => (
              <li key={num} className={s.aStep}>
                <span className={s.c}>{num}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={s.deliver}>
            <p>Request your free dealership audit and consultation. Here’s what you’ll get back:</p>
            <ul className={s.recapList}>
              {recap.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <a className={`${b.btn} ${b.btnPrimary} ${s.deliverBtn}`} href={auditHref}>
              Get my free dealership audit
              <ArrowBadge />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 5/7 split (fix r2): the head, the contact line and the audience statement ride a sticky column beside the list.
   "Who it's for" lives here now (it was a one-paragraph band), so the FAQ closes on who the audit is for. */
export function Faq(): ReactElement {
  return (
    <section className={`${b.section} ${b.sheetEnd}`} id="faq" aria-labelledby="faq-h">
      <div className={`${b.wrap} ${s.faqGrid}`}>
        <div className={s.faqSide}>
          <div className={s.faqHead}>
            <p className={b.label}>FAQ</p>
            <h2 id="faq-h" className={b.t3}>
              Frequently asked questions
            </h2>
            <p className={s.faqNote}>
              The details dealership operators ask us most often. Still unsure? Call and we’ll answer directly.
            </p>
            <div className={s.contacts}>
              <a className={b.tlink} href={phoneHref}>
                Call {phoneDisplay}{" "}
                <span className={b.arr} aria-hidden="true">
                  →
                </span>
              </a>
              <a className={`${b.tlink} ${s.mail}`} href={`mailto:${email}`}>
                {email}
              </a>
            </div>
          </div>
          <div className={s.who} id="who">
            <h3 className={s.whoLabel}>Who it’s for</h3>
            <p className={s.statement}>
              Franchise dealerships and established independent dealers running{"\u00a0"}— or planning to run{"\u00a0"}— paid social. If you
              sell cars and want more real showroom appointments, the audit is built for you.
            </p>
            <a className={`${b.btn} ${b.btnPrimary}`} href={auditHref}>
              Free audit
              <ArrowBadge />
            </a>
          </div>
        </div>
        <div className={s.faq}>
          {faq.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>
                {q}
                <span className={s.pm} aria-hidden="true">
                  <svg viewBox="0 0 14 14">
                    <path d="M2 7h10" />
                    <path className={s.v} d="M7 2v10" />
                  </svg>
                </span>
              </summary>
              <div className={s.ans}>{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

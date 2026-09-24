import type { ReactElement } from "react";
import { auditHref, faqItems, phoneDisplay, phoneHref } from "../content";
import b from "./base.module.css";
import s from "./close.module.css";
import { PhoneIcon } from "./icons";

// All four start closed: four ruled questions end level with the left column (two open answers
// left the list ~210px longer). The creative answer is A's verified short form, not
// content.ts's "The supplied work covers…".
const FAQ = [
  ["Do I need a certain inventory size to qualify?", "The audit is open to any dealership. We ask your inventory size (fewer than 50, or 50 or more) so we can tailor the recommendations to your store — it doesn’t affect whether you can request the audit."],
  ["Which states do you work with?", "We partner with dealerships across multiple U.S. states. Share your details on the form or give us a call and we’ll confirm fit for your market."],
  [faqItems[1][0], "Static, event, new-car, employee, luxury, viral, testimonial, inventory, and Google vehicle-listing advertising."],
  ["What’s included in the free audit?", "A review of your current paid social and creative, the biggest conversion gaps we find, and a prioritized set of next steps. There’s no cost and no obligation to work with us afterward."],
] as const;

const RECAP = [
  "A full review of your current paid social and creative",
  "The biggest conversion gaps between spend and appointments",
  "Prioritized next steps — free, with no obligation",
];

// 12 FAQ + who it's for: the question in the left column, the answers as one ruled list.
export function Faq(): ReactElement {
  return (
    <section className={b.sec} id="faq" aria-labelledby="faq-h">
      <div className={`${b.wrap} ${b.g12} ${s.faqWrap}`}>
        <div className={s.faqSide}>
          <p className={`${b.label} ${s.faqLabel}`}>FAQ</p>
          <h2 id="faq-h" className={b.d2}>
            Who is the free dealership audit for?
          </h2>
          <p className={`${b.lead} ${s.faqLead}`}>
            Franchise dealerships and established independent dealers running — or planning to run — paid social. If you sell cars and want more real showroom appointments, the audit is built for you.
          </p>
        </div>
        <div className={s.faq}>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span className={s.pm} aria-hidden="true" />
              </summary>
              <p className={s.ans}>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// 13 final CTA: the top of the ink close. It takes the FAQ call card's direct-line note; the
// email is one hairline below, in the footer that continues the same ground.
export function Final(): ReactElement {
  return (
    <section className={`${b.ink} ${s.final}`} id="contact" aria-labelledby="final-h">
      <div className={`${b.wrap} ${b.g12} ${s.finalIn}`}>
        <div className={s.finalL}>
          <p className={`${b.label} ${s.finalLabel}`}>Free dealership marketing audit</p>
          <h2 id="final-h" className={b.d2}>
            Ready to create more opportunities for your dealership?
          </h2>
          <p className={s.body}>
            Tell us what your store needs, or call now to talk through the right mix of creative, media, follow-up, and appointment support.
          </p>
          <div className={`${b.actions} ${s.finalActions}`}>
            <a className={`${b.btn} ${b.btnAccent} ${s.finalBtn}`} href={auditHref}>
              Get my free dealership audit
            </a>
            <a className={`${b.tlink} ${s.finalTlink}`} href={phoneHref}>
              <PhoneIcon />
              Call {phoneDisplay}
            </a>
          </div>
          <p className={s.note}>Either way you reach the BDC Promotions team directly — no call center in between.</p>
        </div>
        <div className={s.recap}>
          <p>Request your free dealership audit and consultation. Here’s what you’ll get back:</p>
          <ul>
            {RECAP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

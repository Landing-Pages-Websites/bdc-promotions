import type { ReactElement } from "react";
import { auditHref, faqItems, phoneDisplay, phoneHref } from "../content";
import { ArrowIcon, ClipboardSearchIcon, MailIcon, PhoneIcon } from "./JournalIcons";
import c from "./journal-card.module.css";
import f from "./journal-footer.module.css";
import s from "./journal-close.module.css";

/*
 * Answer copy broken where image 2 breaks it; joined, each equals the verified faqItems answer
 * (compound hyphens here are U+2011, non-breaking, so "new‑car" / "follow‑up" never split on phones).
 */
const answerLines: readonly (readonly string[])[] = [
  ["No. Dealerships may select individual services", "or connect them into a broader program."],
  [
    "The supplied work covers static, event, new‑car,",
    "employee, luxury, viral, testimonial, inventory,",
    "and Google vehicle-listing advertising.",
  ],
  [
    "Depending on your service mix, BDC staff and",
    "AI‑supported tools can nurture the conversation",
    "and move the shopper toward an appointment",
    "with a scheduled day and time.",
  ],
  [
    "No specific lead, appointment, show, or sales",
    "result is guaranteed. The work is designed to",
    "create stronger opportunities and a clearer",
    "follow‑up process.",
  ],
];

const email = "justins@bdc-promotions.com";

export function ClearTheLane(): ReactElement {
  return (
    <section className={s.close} id="b-close" aria-labelledby="b-close-title">
      <div className={s.wrap}>
        <span className={s.folio} aria-hidden="true">
          06
        </span>
        <span className={s.spine} aria-hidden="true" />
        <p className={s.kicker}>CLOSE &amp; NEXT STEP</p>
        <a className={s.nextMove} href="#b-audit">
          YOUR NEXT MOVE
          <span className={s.nextCircle} aria-hidden="true">
            <ArrowIcon className={s.nextArrow} />
          </span>
        </a>
        <span className={`${s.margin} ${s.marginJournal}`} aria-hidden="true">
          FIELD JOURNAL
        </span>
        <span className={`${s.margin} ${s.marginFolio}`} aria-hidden="true">
          BDC—06
        </span>
        <h2 id="b-close-title" className={s.title}>
          <span>Ready to</span> <span>Create More</span> <span>Opportunities</span> <span>for Your</span>{" "}
          <span>
            Dealership<span className={s.q}>?</span>
          </span>
        </h2>
        <span className={s.titleRule} aria-hidden="true" />
        <p className={s.body}>
          <span>Tell us what your store needs, or call now</span> <span>to talk through the right mix of creative,</span>{" "}
          <span>media, follow‑up, and appointment support.</span>
        </p>
        <div className={s.faq} id="b-faq">
          <h3 className={s.faqTitle}>Frequently Asked Questions</h3>
          <ol>
            {faqItems.map(([question], i) => (
              <li key={question}>
                <span className={s.faqNum} aria-hidden="true">
                  0{i + 1}
                </span>
                <h4>{question}</h4>
                <p>
                  {answerLines[i].map((line) => (
                    <span key={line}>{line} </span>
                  ))}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <aside className={c.card} id="b-audit" aria-labelledby="b-audit-title">
          <ClipboardSearchIcon className={c.cardIcon} />
          <h3 id="b-audit-title" className={c.cardTitle}>
            <span>Get a Guided Audit</span> <span>for Your Dealership</span>
          </h3>
          <span className={c.cardRule} aria-hidden="true" />
          <p className={c.cardBody}>
            <span>Our team will review your current mix,</span> <span>identify gaps and opportunities, and</span>{" "}
            <span>recommend a plan that fits your goals.</span>
          </p>
          <a className={c.cardPrimary} href={auditHref}>
            <span>
              Get a Free Dealership <br />
              Marketing Audit
            </span>
            <ArrowIcon className={c.cardArrow} />
          </a>
          <a className={c.cardPhone} href={phoneHref}>
            <PhoneIcon className={c.cardPhoneIcon} /> Call {phoneDisplay}
          </a>
        </aside>
      </div>
    </section>
  );
}

export function JournalFooter(): ReactElement {
  return (
    <footer className={f.footer}>
      <div className={f.footerWrap}>
        <p className={f.footerBrand}>BDC Promotions — Automotive Marketing</p>
        <span className={`${f.footerRule} ${f.footerRule1}`} aria-hidden="true" />
        <a className={f.footerPhone} href={phoneHref}>
          <PhoneIcon className={f.footerIcon} /> {phoneDisplay}
        </a>
        <span className={`${f.footerRule} ${f.footerRule2}`} aria-hidden="true" />
        <a className={f.footerMail} href={`mailto:${email}`}>
          <MailIcon className={f.footerMailIcon} /> {email}
        </a>
      </div>
    </footer>
  );
}

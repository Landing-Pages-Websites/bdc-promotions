import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import { ArrowIcon, PhoneSolidIcon } from "./icons";
import { Lines } from "./Lines";
import styles from "./close.module.css";

// Image 1 prints shortened FAQ answers; wording follows the image (DESIGN.md "A copy deck").
const faqs = [
  ["Do we have to buy every service?", ["No. Dealerships may select individual services or", "connect them into a broader program."]],
  ["What kinds of creative can BDC Promotions produce?", ["Static, event, new-car, employee, luxury, viral,", "testimonial, inventory, and Google vehicle\u2011listing advertising."]],
  ["What happens after a lead comes in?", ["BDC staff and AI\u2011supported tools can nurture the", "conversation and move the shopper toward a", "scheduled appointment."]],
  ["Are results guaranteed?", ["No specific lead, appointment, show, or sales", "result is guaranteed."]],
] as const;

function CloseRoutes(): ReactElement {
  return (
    <svg className={styles.routes} viewBox="0 0 1536 759" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M675 568H762.5V45.5H1497" fill="none" stroke="#035ee4" strokeWidth="2.4" />
      <rect x="1498.5" y="33.5" width="18" height="18" fill="none" stroke="#035ee4" strokeWidth="3" />
      <circle cx="666" cy="568" r="8.5" fill="#0acdbd" stroke="#d6fbf8" strokeWidth="2" />
    </svg>
  );
}

export function Close(): ReactElement {
  return (
    <section className={styles.close} id="contact" aria-labelledby="a-close-title">
      <div className={styles.frame}>
        <CloseRoutes />
        <h2 id="a-close-title" className={styles.title}>
          <Lines lines={["Ready to create", "more opportunities", "for your dealership?"]} />
        </h2>
        <p className={styles.body}>
          <Lines
            lines={[
              "Tell us what your store needs, or call now",
              "to talk through the right mix of creative,",
              "media, follow\u2011up, and appointment support.",
            ]}
          />
        </p>
        <a className={styles.audit} href={auditHref}>
          <span className={styles.iconBox}>
            <ArrowIcon />
          </span>
          <span className={styles.auditText}>
            <span>Get a free dealership</span> <span>marketing audit</span>
          </span>
        </a>
        <a className={styles.call} href={phoneHref}>
          <PhoneSolidIcon className={styles.phone} />
          <span>Call {phoneDisplay}</span>
        </a>
        <div className={styles.faq}>
          <h3 className={styles.srOnly}>Frequently asked questions</h3>
          <dl>
            {faqs.map(([question, answer]) => (
              <div key={question} className={styles.item}>
                <dt>
                  <span className={styles.q} aria-hidden="true">
                    Q
                  </span>
                  {question}
                </dt>
                <dd>
                  <Lines lines={answer} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

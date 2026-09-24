import type { ReactElement } from "react";
import { faqItems, growthSteps } from "../content";
import b from "./base.module.css";
import s from "./process.module.css";

const SERVICES = [
  ["New-car lead generation", "Paid social campaigns built to put your new-car inventory in front of in-market shoppers and start real conversations your BDC team can follow up on."],
  ["Inventory ads", "Turn the vehicles on your lot into scroll-stopping ads that move specific units — not just rack up impressions."],
  ["Event ads", "Fill your sales events and seasonal pushes with campaigns designed to drive foot traffic and appointments."],
  ["Reels & value-proposition videos", "Short-form video that tells shoppers why your store — the reasons to buy from you, delivered in their feed."],
  ["Testimonial videos", "Real customer stories, produced to build trust before a shopper ever walks onto your lot."],
] as const;

const [followUpQ, followUpA] = faqItems[2];

// A stacked head over a full-width index: one ruled row per service, the name in cols 1–4 and
// the line in 5–11. No photograph (round 3: the production still read as AI).
export function Services(): ReactElement {
  return (
    <section className={b.sec} id="services" aria-labelledby="svc-h">
      <div className={b.wrap}>
        <div className={s.svcHead}>
          <p className={`${b.label} ${s.svcLabel}`}>Automotive marketing services</p>
          <h2 id="svc-h" className={b.d2}>
            Everything paid social should do for a <em className={b.acc}>dealership</em>
          </h2>
          <p className={s.svcIntro}>
            Five services, built for how cars actually get sold today. Each one is scoped to a real dealership outcome — not a generic marketing deliverable.
          </p>
        </div>
        <ul className={s.svcList}>
          {SERVICES.map(([name, line]) => (
            <li key={name} className={b.g12}>
              <h3 className={b.h3}>{name}</h3>
              <p>{line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// Five columns, each under a 2px rule: grey for the first four steps, blue for the appointment.
// Open above (no hairline): the services index already closes on its own rule.
export function Path(): ReactElement {
  return (
    <section className={b.sec} id="process" aria-labelledby="path-h">
      <div className={b.wrap}>
        <div className={`${b.g12} ${b.head}`}>
          <div className={b.headMain}>
            <p className={b.label}>Process</p>
            <h2 id="path-h" className={b.d2}>
              One connected path from scroll to showroom
            </h2>
          </div>
        </div>
        <div className={s.pathEnds} aria-hidden="true">
          <span>Scroll</span>
          <span>Showroom</span>
        </div>
        <ol className={s.path}>
          {growthSteps.map(([n, title, line]) => (
            <li key={n}>
              <span className={s.num}>{n}</span>
              <div>
                <h3 className={b.h3}>{title}</h3>
                <p>{line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// The one centred section: the question and answer over the diagram, the diagram's name under it.
export function FollowUp(): ReactElement {
  return (
    <section className={`${b.sec} ${b.ruled}`} id="follow-up" aria-labelledby="fu-h">
      <div className={b.wrap}>
        <div className={s.fuHead}>
          <p className={`${b.label} ${s.fuLabel}`}>Follow-up</p>
          <h2 id="fu-h" className={b.d2}>
            {followUpQ}
          </h2>
          <p className={`${b.lead} ${s.fuLead}`}>{followUpA}</p>
        </div>
        <figure className={s.fdp}>
          <ol className={s.fd} aria-label="Lead, then BDC staff and AI-supported tools nurture the conversation, then an appointment">
            <li className={`${s.fdN} ${s.fdStart}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16v11H9l-5 4z" />
                <path d="M8 9.5h8M8 12.5h5" />
              </svg>
              <b>Lead</b>
            </li>
            <li className={s.fdMid}>
              <span className={s.fdCap}>Nurture</span>
              <span className={s.fdLane}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
                </svg>
                BDC staff
              </span>
              <span className={s.fdLane}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z" />
                  <path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
                </svg>
                AI-supported tools
              </span>
              <span className={s.fdRbar} aria-hidden="true" />
            </li>
            <li className={`${s.fdN} ${s.fdEnd}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
                <path d="M9 14.5l2 2 4-4" />
              </svg>
              <b>Appointment</b>
              <small>Scheduled dealership visit with a day and time.</small>
            </li>
          </ol>
          <figcaption className={s.fdCaption}>Human + AI-supported follow-up</figcaption>
        </figure>
      </div>
    </section>
  );
}

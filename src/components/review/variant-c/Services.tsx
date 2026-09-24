import Image from "next/image";
import type { ReactElement } from "react";
import { faqItems, growthSteps, serviceOptions } from "../content";
import b from "./base.module.css";
import s from "./services.module.css";

/* fix r2: the videographer photo leads with the video service it shows; new-car lead generation joins the 2×2 */
const services = [
  ["New-car lead generation", "Paid social campaigns built to put your new-car inventory in front of in-market shoppers and start real conversations your BDC team can follow up on."],
  ["Inventory ads", "Turn the vehicles on your lot into scroll-stopping ads that move specific units — not just rack up impressions."],
  ["Event ads", "Fill your sales events and seasonal pushes with campaigns designed to drive foot traffic and appointments."],
  ["Testimonial videos", "Real customer stories, produced to build trust before a shopper ever walks onto your lot."],
] as const;

/* Live BDC Agent Team → Nurture → Appointment, each a verified string (content.ts / B:97). Set as a message
   thread, not a node lane: the lane is kept for the two real sequences (the gap and the path). */
const thread = [
  ["Includes", serviceOptions[1][3]],
  ["Nurture", "Keep conversations moving."],
  ["Appointment", "Set the visit. Win the appointment."],
] as const;

const phoneIcon = (
  <svg viewBox="0 0 24 24">
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
    <path d="M9.5 6.5h5M9 9.5h6v5H9zM9.5 17.5h3" />
  </svg>
);
const showroomIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M3 20.5h18M4.5 20.5V9.5L12 4l7.5 5.5v11" />
    <path d="M8 20.5v-6h8v6M8 11.5h8" />
  </svg>
);

export function Services(): ReactElement {
  return (
    <section className={b.section} id="services" aria-labelledby="svc-h">
      <div className={b.wrap}>
        <div className={b.head}>
          <div className={b.hMain}>
            <p className={b.label}>Automotive marketing services</p>
            <h2 id="svc-h">
              Everything paid social should do for a <em className={b.acc}>dealership</em>
            </h2>
          </div>
          <div className={b.hSide}>
            <p className={b.lead}>
              Five services, built for how cars actually get sold today. Each one is scoped to a real dealership outcome
              — not a generic marketing deliverable.
            </p>
          </div>
        </div>
        <article className={`${b.card} ${s.svcLead}`}>
          <figure>
            <Image
              src="/lp/bdc-inventory-production.webp"
              alt="A videographer filming a dealership's vehicle lineup through a showroom window at night"
              width={1248}
              height={832}
              sizes="(max-width: 720px) calc(100vw - 56px), 620px"
            />
          </figure>
          <div className={s.txt}>
            <h3 className={b.t3}>Reels &amp; value-proposition videos</h3>
            <p className={b.lead}>
              Short-form video that tells shoppers why your store — the reasons to buy from you, delivered in their feed.
            </p>
          </div>
        </article>
        <div className={s.svcGrid}>
          {services.map(([name, line]) => (
            <article key={name} className={s.svcItem}>
              <h3>{name}</h3>
              <p>{line}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Path(): ReactElement {
  return (
    <section className={`${b.section} ${b.join}`} id="path" aria-labelledby="path-h">
      <div className={b.wrap}>
        <div className={`${b.head} ${b.center}`}>
          <div className={b.hMain}>
            <p className={b.label}>Process</p>
            <h2 id="path-h">One connected path from scroll to showroom</h2>
            <p className={b.lead}>Choose the pieces your dealership needs or connect the full operating lane.</p>
          </div>
        </div>
        <div className={`${b.card} ${s.path}`}>
          {/* the track runs phone → showroom through one marker per step, each on its step's own left edge */}
          <ol className={s.steps}>
            {growthSteps.map(([num, title, copy], i) => (
              <li key={num} className={s.step}>
                <span className={i === 0 ? s.railEnd : i === growthSteps.length - 1 ? `${s.railEnd} ${s.end}` : s.dot} aria-hidden="true">
                  {i === 0 ? phoneIcon : i === growthSteps.length - 1 ? showroomIcon : null}
                </span>
                <span className={s.num}>{num}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function FollowUp(): ReactElement {
  return (
    <section className={`${b.section} ${b.ruled}`} id="follow-up" aria-labelledby="fu-h">
      <div className={`${b.wrap} ${s.split}`}>
        <div className={s.sText}>
          <p className={b.label}>Follow-up</p>
          <h2 id="fu-h">
            <span className={s.nw}>
              Human + <span className={s.nb}>AI-supported</span>
            </span>{" "}
            <span className={s.nb}>follow-up</span>
          </h2>
          {/* the full "What happens after a lead comes in?" answer (content.ts faqItems[2]); step 04 keeps its own line */}
          <p className={b.lead}>{faqItems[2][1]}</p>
          <a className={b.tlink} href="#pricing">
            See BDC agent pricing{" "}
            <span className={b.arr} aria-hidden="true">
              →
            </span>
          </a>
        </div>
        <div className={s.sViz}>
          <div className={`${b.card} ${s.thread}`}>
            <h3 className={s.threadTop}>Live BDC Agent Team</h3>
            <ol className={s.msgs}>
              {thread.map(([label, line]) => (
                <li key={label} className={s.say}>
                  <span className={`${b.label} ${s.sayLabel}`}>{label}</span>
                  <p>{line}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

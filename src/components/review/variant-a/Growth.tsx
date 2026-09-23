import Image from "next/image";
import type { ReactElement } from "react";
import { Lines } from "./Lines";
import styles from "./growth.module.css";

// Step copy is image 1's shortened wording (DESIGN.md "A copy deck").
const steps = [
  ["01", "Strategy", ["Store, inventory,", "market, sales", "priorities."]],
  ["02", "Creative", ["Static, event,", "inventory, video", "advertising."]],
  ["03", "Optimization", ["Refine paid campaigns", "around qualified", "opportunities."]],
  ["04", "Nurture", ["BDC staff and AI", "tools keep", "conversations", "moving."]],
  ["05", "Appointment", ["Scheduled", "dealership visit", "with a day and time."]],
] as const;

function GrowthRoute(): ReactElement {
  const nodes = [
    [1224, 201],
    [947, 326],
    [664, 425],
    [393, 489],
  ] as const;
  return (
    <svg className={styles.route} viewBox="0 0 1536 864" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M1540 51H1350V155Q1350 167 1338 167H1236Q1224 167 1224 179V200H1163Q1151 200 1151 212V282Q1151 294 1139 294H959Q947 294 947 306V326H874Q862 326 862 338V381Q862 393 850 393H676Q664 393 664 405V425H597Q585 425 585 437V449Q585 461 573 461H405Q393 461 393 473V489H324Q312 489 312 501V526Q312 538 300 538H102Q90 538 90 550V573Q90 585 102 585H120"
        fill="none"
        stroke="#045cfd"
        strokeWidth="5"
      />
      <rect x="1340" y="41" width="20" height="20" rx="2" fill="#045cfd" />
      {nodes.map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="10" fill="#01f5e0" opacity="0.28" />
          <circle cx={x} cy={y} r="6.5" fill="#1fe6d6" />
          <circle cx={x} cy={y} r="3" fill="#0aa8b8" />
        </g>
      ))}
      <path d="M-4 825H150" fill="none" stroke="#045cfd" strokeWidth="5" />
      <rect x="140" y="810" width="30" height="30" rx="4" fill="#01f5e0" opacity="0.3" />
      <rect x="145" y="815" width="20" height="20" rx="2" fill="#1fe6d6" />
      <rect x="149" y="819" width="12" height="12" fill="#045cfd" />
    </svg>
  );
}

export function Growth(): ReactElement {
  return (
    <section className={styles.growth} id="growth" aria-labelledby="a-growth-title">
      <div className={styles.frame}>
        <GrowthRoute />
        <h2 id="a-growth-title" className={styles.title}>
          <Lines lines={["One connected path", "from scroll to showroom"]} />
        </h2>
        <p className={styles.intro}>
          <Lines lines={["Choose the pieces your dealership needs", "or connect the full operating lane."]} />
        </p>
        <ol className={styles.steps}>
          {steps.map(([number, title, copy]) => (
            <li key={number} className={styles.step}>
              <span className={styles.tile} aria-hidden="true">
                {number}
              </span>
              <h3>
                <span className={styles.srOnly}>{number} </span>
                {title}
              </h3>
              <p>
                <Lines lines={copy} />
              </p>
            </li>
          ))}
        </ol>
        <figure className={styles.source}>
          <figcaption className={styles.sourceLabel}>Source work example</figcaption>
          <div className={styles.sourceImage}>
            <Image
              src="/images/design/variant-a/growth-source-work.png"
              alt="Customer-supplied luxury campaign with a $1,000 savings voucher and Message or Comment Now button"
              width={1254}
              height={675}
              sizes="(max-width: 1179px) min(90vw, 720px), 28vw"
            />
          </div>
          <p className={styles.sourceCaption}>
            <Lines lines={["Campaign style, offer messaging, and luxury positioning", "used to drive attention and start conversations."]} />
          </p>
        </figure>
      </div>
    </section>
  );
}

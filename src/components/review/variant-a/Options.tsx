import type { ReactElement } from "react";
import { auditHref } from "../content";
import { LongArrowIcon } from "./icons";
import { Lines } from "./Lines";
import styles from "./options.module.css";

type Card = {
  number: string;
  name: readonly string[];
  price: string; // amount without the "$", which is set smaller and raised as in image 1
  terms: readonly string[];
  includes: readonly string[];
};

// Image 1 order: the combined program leads as the wide first card.
const cards: readonly Card[] = [
  { number: "01", name: ["Lead Gen + BDC Team"], price: "5,000", terms: ["3-month commitment"], includes: ["Connected campaign", "and follow\u2011up support"] },
  { number: "02", name: ["Lead", "Generation"], price: "2,500", terms: ["3-month commitment"], includes: ["Static ad creation,", "video ad editing, and", "ad optimization"] },
  { number: "03", name: ["Live BDC", "Agent Team"], price: "2,500", terms: ["3-month commitment"], includes: ["Lead nurturing,", "pre-qualifications, and", "appointment scheduling"] },
  { number: "04", name: ["Luxury", "Video"], price: "750", terms: ["Includes 1 new", "video each month"], includes: ["Premium automotive", "video creative"] },
];

function OptionRoutes(): ReactElement {
  const mint = "#7af4eb";
  return (
    <svg className={styles.routes} viewBox="0 0 1536 844" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M767 0V34M777 44H877V54" fill="none" stroke={mint} strokeWidth="3" />
      <rect x="757" y="34" width="20" height="20" fill={mint} />
      <path d="M325 330V315H768V330M777 330V321H1070V330M1079 330V321H1352V331" fill="none" stroke={mint} strokeWidth="3" />
      <rect x="315" y="328" width="20" height="20" fill={mint} />
      <rect x="759" y="329" width="18" height="18" fill={mint} />
      <rect x="1061" y="329" width="18" height="18" fill={mint} />
      <rect x="1344" y="331" width="16" height="16" fill={mint} />
      <path d="M767 729V785H958" fill="none" stroke={mint} strokeWidth="3" />
      <path d="M957 776 972 785 957 794Z" fill={mint} />
    </svg>
  );
}

export function Options(): ReactElement {
  return (
    <section className={styles.options} id="options" aria-labelledby="a-options-title">
      <div className={styles.frame}>
        <OptionRoutes />
        <p className={styles.eyebrow}>Select the support your store needs</p>
        <h2 id="a-options-title" className={styles.title}>
          <Lines lines={["Start with one service.", "Connect the full lane."]} />
        </h2>
        <ul className={styles.cards}>
          {cards.map((card) => (
            <li key={card.number} className={styles.card}>
              <span className={styles.number} aria-hidden="true">
                {card.number}
              </span>
              <h3 className={styles.name}>
                <Lines lines={card.name} />
              </h3>
              <p className={styles.price}>
                <strong>
                  <span className={styles.currency}>$</span>
                  {card.price}
                </strong>{" "}
                <span>/ month</span>
              </p>
              <p className={styles.terms}>
                <Lines lines={card.terms} />
              </p>
              <div className={styles.includes}>
                <p className={styles.includesLabel}>Includes</p>
                <p className={styles.includesText}>
                  <Lines lines={card.includes} />
                </p>
              </div>
            </li>
          ))}
        </ul>
        <a className={styles.mix} href={auditHref}>
          <span>Find the right mix</span>
          <LongArrowIcon />
        </a>
      </div>
    </section>
  );
}

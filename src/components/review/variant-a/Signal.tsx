import type { ReactElement } from "react";
import styles from "./signal.module.css";

const signalItems = [
  "Automotive-specific strategy",
  "Static + video creative",
  "Human + AI\u2011supported follow\u2011up",
  "Scheduled appointment focus",
] as const;

function SignalRoutes(): ReactElement {
  return (
    <svg className={styles.routes} viewBox="0 0 1536 514" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M1434 2V28Q1434 40 1422 40H1250Q1238 40 1238 52V76" fill="none" stroke="#0144f4" strokeWidth="3" />
      <rect x="1231" y="75" width="14" height="14" fill="#01f5e0" />
      <path d="M130 276.5H1420Q1434 276.5 1434 290.5V470" fill="none" stroke="#0144f4" strokeWidth="4" />
      <rect x="121" y="268" width="17" height="17" fill="#0144f4" />
      <rect x="324" y="266" width="20" height="20" fill="#01f5e0" />
      <rect x="597" y="266" width="20" height="20" fill="#01f5e0" />
      <rect x="925" y="266" width="20" height="20" fill="#01f5e0" />
      <rect x="1225" y="266" width="20" height="20" fill="#01f5e0" />
      <rect x="1427" y="468" width="13" height="13" fill="#01f5e0" />
    </svg>
  );
}

// A drawn-weight slash (thinner and shallower than the display glyph), kept as real text.
function Slash(): ReactElement {
  return <span className={styles.slash}>/</span>;
}

export function Signal(): ReactElement {
  return (
    <section className={styles.signal} aria-labelledby="a-signal-title">
      <div className={styles.signalFrame}>
        <SignalRoutes />
        {/* two pairs so the stacked layout breaks as "FAST / FOCUSED /" + "SOCIAL / RESULTS" */}
        <h2 id="a-signal-title" className={styles.signalTitle}>
          <span className={styles.pair}>
            Fast <Slash /> Focused <Slash />
          </span>{" "}
          <span className={styles.pair}>
            Social <Slash /> Results
          </span>
        </h2>
        <ul className={styles.signalList}>
          {signalItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

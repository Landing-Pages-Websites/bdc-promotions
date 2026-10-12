import type { ReactElement } from "react";
import type { Services } from "./types";
import Link from "next/link";
import styles from "../services.module.css";

export default function CompareSection({ services }: { services: Services }): ReactElement {
  return (
    <section className={styles.comparison} id="compare" aria-labelledby="compare-title">
      <div className={`${styles.container} ${styles.compareLayout}`}>
        <div>
          <h2 id="compare-title">Compare the services</h2>
          <p>See where each service fits.</p>
        </div>
        <dl className={styles.compareRows}>
          {services.map((service) => (
            <div key={service.id}>
              <dt><Link href={service.href}>{service.name}<span aria-hidden="true">→</span></Link></dt>
              <dd>{service.role}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

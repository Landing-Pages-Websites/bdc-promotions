import type { ReactElement } from "react";
import type { Services } from "./types";
import styles from "../services.module.css";

export default function CompareSection({ services }: { services: Services }): ReactElement {
  return (
    <section data-section="03-compare" className={styles.comparison} id="compare" aria-labelledby="compare-title">
      <div className={`${styles.container} ${styles.compareLayout}`}>
        <div>
          <h2 id="compare-title">Compare the services</h2>
          <p>See where each service fits.</p>
        </div>
        <dl className={styles.compareRows}>
          {services.map((service) => (
            <div key={service.id}>
              <dt>{service.name}</dt>
              <dd>{service.role}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

import type { ReactElement } from "react";
import type { Services } from "./types";
import styles from "../services.module.css";

export default function OpeningSection({ services, overview }: { services: Services; overview: string }): ReactElement {
  return (
    <section data-section="01-opening" className={`${styles.container} ${styles.selector}`} aria-labelledby="services-title">
      <p className={styles.eyebrow}>Automotive marketing</p>
      <h1 id="services-title">Services for the path from scroll to showroom</h1>
      <p className={styles.support}>Choose the pieces your dealership needs or connect the full operating lane.</p>
      <p className={styles.overview}>{overview}</p>
      <a className={styles.compareLink} href="#compare">Compare the services <span aria-hidden="true">↓</span></a>
      <nav className={styles.selectorLinks} aria-label="Explore services">
        {services.map((service) => (
          <a key={service.id} href={`#${service.id}`}>
            <span>{service.name}</span><span aria-hidden="true">↓</span>
          </a>
        ))}
      </nav>
    </section>
  );
}

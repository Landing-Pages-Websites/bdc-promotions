import type { ReactElement } from "react";
import type { Services } from "./types";
import styles from "../services.module.css";

export default function DirectorySection({ services }: { services: Services }): ReactElement {
  return (
    <section data-section="02-section" className={styles.directory} aria-labelledby="directory-title">
      <div className={styles.container}>
        <h2 id="directory-title">Choose your support</h2>
        <div className={styles.entries}>
          {services.map((service) => (
            <article className={styles.entry} key={service.id} id={service.id} aria-labelledby={`${service.id}-title`}>
              <h3 id={`${service.id}-title`}>{service.name}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import type { ReactElement } from "react";
import type { ContentSection } from "./LandingPage";

interface ProcessSectionProps {
  content: ContentSection;
}

export function ProcessSection({ content }: ProcessSectionProps): ReactElement {
  return (
    <section
      id="process"
      className="section-shell process-section"
      aria-labelledby="process-heading"
    >
      <div className="section-intro section-intro--split">
        <div>
          <p className="eyebrow">From Message To Showroom</p>
          <h2 id="process-heading">{content.heading}</h2>
        </div>
        <p>{content.description}</p>
      </div>
      <ol className="process-grid">
        {content.items.map((item, index) => (
          <li className="process-card" key={item.title}>
            <span className="process-card__step">Step {index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

import type { ReactElement } from "react";

import { formatSequenceNumber } from "@/lib/formatSequenceNumber";

import type { ContentSection } from "./LandingPage";

interface ValueGridProps {
  content: ContentSection;
}

export function ValueGrid({ content }: ValueGridProps): ReactElement {
  return (
    <section
      className="section-shell value-section"
      aria-labelledby="value-heading"
    >
      <div className="section-intro section-intro--split">
        <div>
          <p className="eyebrow">Why Dealers Choose Us</p>
          <h2 id="value-heading">{content.heading}</h2>
        </div>
        <p>{content.description}</p>
      </div>
      <div className="value-grid">
        {content.items.map((item, index) => (
          <article className="value-card" key={item.title}>
            <span className="value-card__number">
              {formatSequenceNumber(index)}
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

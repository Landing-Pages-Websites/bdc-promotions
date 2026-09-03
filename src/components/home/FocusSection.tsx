import type { ReactElement } from "react";
import type { ContentSection } from "./LandingPage";

interface FocusSectionProps {
  content: ContentSection & { eyebrow: string };
}

export function FocusSection({ content }: FocusSectionProps): ReactElement {
  return (
    <section
      className="section-shell focus-section"
      aria-labelledby="focus-heading"
    >
      <div className="focus-panel focus-panel--lead">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2 id="focus-heading">{content.heading}</h2>
        <p>{content.description}</p>
      </div>
      <div className="focus-panel focus-panel--list">
        {content.items.map((item) => (
          <article className="focus-item" key={item.title}>
            <span className="focus-item__dot" aria-hidden="true" />
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

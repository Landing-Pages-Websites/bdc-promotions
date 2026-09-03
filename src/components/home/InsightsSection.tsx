import type { ReactElement } from "react";

import { formatSequenceNumber } from "@/lib/formatSequenceNumber";

import type { ContentSection } from "./LandingPage";

interface InsightsSectionProps {
  content: Omit<ContentSection, "description">;
}

export function InsightsSection({
  content,
}: InsightsSectionProps): ReactElement {
  return (
    <section className="insights-section" aria-labelledby="insights-heading">
      <div className="section-shell">
        <p className="eyebrow">Speed Changes The Outcome</p>
        <h2 id="insights-heading">{content.heading}</h2>
        <div className="insights-grid">
          {content.items.map((item, index) => (
            <article className="insight-card" key={item.title}>
              <span>{formatSequenceNumber(index)}</span>
              <p>{item.description}</p>
              <h3>{item.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

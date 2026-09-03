import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

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
        <p
          className="eyebrow"
          {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
        >
          {content.eyebrow.value}
        </p>
        <h2
          id="insights-heading"
          {...managedSiteFieldAttributesV1(content.heading.fieldId)}
        >
          {content.heading.value}
        </h2>
        <div
          className="insights-grid"
          {...managedSiteFieldAttributesV1(content.fieldId)}
        >
          {content.items.map((item, index) => (
            <article className="insight-card" key={item.itemId}>
              <span>{formatSequenceNumber(index)}</span>
              <p
                {...managedSiteFieldAttributesV1(
                  item.description.fieldId,
                  item.itemId,
                )}
              >
                {item.description.value}
              </p>
              <h3
                {...managedSiteFieldAttributesV1(
                  item.title.fieldId,
                  item.itemId,
                )}
              >
                {item.title.value}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

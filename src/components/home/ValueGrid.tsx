import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import { formatSequenceNumber } from "@/lib/formatSequenceNumber";

import type { ContentSection } from "./LandingPage";
import { ManagedCardCopy } from "./ManagedCardCopy";

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
          <p
            className="eyebrow"
            {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
          >
            {content.eyebrow.value}
          </p>
          <h2
            id="value-heading"
            {...managedSiteFieldAttributesV1(content.heading.fieldId)}
          >
            {content.heading.value}
          </h2>
        </div>
        <p {...managedSiteFieldAttributesV1(content.description.fieldId)}>
          {content.description.value}
        </p>
      </div>
      <div
        className="value-grid"
        {...managedSiteFieldAttributesV1(content.fieldId)}
      >
        {content.items.map((item, index) => (
          <article className="value-card" key={item.itemId}>
            <span className="value-card__number">
              {formatSequenceNumber(index)}
            </span>
            <div>
              <ManagedCardCopy item={item} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

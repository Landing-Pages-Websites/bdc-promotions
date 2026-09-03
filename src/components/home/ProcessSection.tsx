import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";
import type { ContentSection } from "./LandingPage";
import { ManagedCardCopy } from "./ManagedCardCopy";

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
          <p
            className="eyebrow"
            {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
          >
            {content.eyebrow.value}
          </p>
          <h2
            id="process-heading"
            {...managedSiteFieldAttributesV1(content.heading.fieldId)}
          >
            {content.heading.value}
          </h2>
        </div>
        <p {...managedSiteFieldAttributesV1(content.description.fieldId)}>
          {content.description.value}
        </p>
      </div>
      <ol
        className="process-grid"
        {...managedSiteFieldAttributesV1(content.fieldId)}
      >
        {content.items.map((item, index) => (
          <li className="process-card" key={item.itemId}>
            <span className="process-card__step">Step {index + 1}</span>
            <ManagedCardCopy item={item} />
          </li>
        ))}
      </ol>
    </section>
  );
}

import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";
import type { ContentSection } from "./LandingPage";
import { ManagedCardCopy } from "./ManagedCardCopy";

interface FocusSectionProps {
  content: ContentSection;
}

export function FocusSection({ content }: FocusSectionProps): ReactElement {
  return (
    <section
      className="section-shell focus-section"
      aria-labelledby="focus-heading"
    >
      <div className="focus-panel focus-panel--lead">
        <p
          className="eyebrow"
          {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
        >
          {content.eyebrow.value}
        </p>
        <h2
          id="focus-heading"
          {...managedSiteFieldAttributesV1(content.heading.fieldId)}
        >
          {content.heading.value}
        </h2>
        <p {...managedSiteFieldAttributesV1(content.description.fieldId)}>
          {content.description.value}
        </p>
      </div>
      <div
        className="focus-panel focus-panel--list"
        {...managedSiteFieldAttributesV1(content.fieldId)}
      >
        {content.items.map((item) => (
          <article className="focus-item" key={item.itemId}>
            <span className="focus-item__dot" aria-hidden="true" />
            <div>
              <ManagedCardCopy item={item} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

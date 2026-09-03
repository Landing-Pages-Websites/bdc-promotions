import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";
import type { ContentSection } from "./LandingPage";
import { ServiceCard } from "./ServiceCard";

interface ServicesSectionProps {
  content: ContentSection;
}

export function ServicesSection({
  content,
}: ServicesSectionProps): ReactElement {
  return (
    <section
      id="services"
      className="services-section"
      aria-labelledby="services-heading"
    >
      <div className="section-shell">
        <div className="section-intro">
          <p
            className="eyebrow"
            {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
          >
            {content.eyebrow.value}
          </p>
          <h2
            id="services-heading"
            {...managedSiteFieldAttributesV1(content.heading.fieldId)}
          >
            {content.heading.value}
          </h2>
          <p {...managedSiteFieldAttributesV1(content.description.fieldId)}>
            {content.description.value}
          </p>
        </div>
        <div
          className="services-grid"
          {...managedSiteFieldAttributesV1(content.fieldId)}
        >
          {content.items.map((item, index) => (
            <ServiceCard index={index} item={item} key={item.itemId} />
          ))}
        </div>
      </div>
    </section>
  );
}

import type { ReactElement } from "react";
import type { ContentSection } from "./LandingPage";
import { ServiceCard } from "./ServiceCard";

interface ServicesSectionProps {
  content: ContentSection;
}

const serviceLabels = ["RESPOND", "AMPLIFY", "CONVERT"] as const;

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
          <p className="eyebrow">Built To Move Shoppers</p>
          <h2 id="services-heading">{content.heading}</h2>
          <p>{content.description}</p>
        </div>
        <div className="services-grid">
          {content.items.map((item, index) => (
            <ServiceCard
              index={index}
              item={item}
              key={item.title}
              label={serviceLabels[index] ?? "DRIVE"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

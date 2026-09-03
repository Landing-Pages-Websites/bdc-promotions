import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import { ContactCard } from "./ContactCard";
import type { BrandIdentity, LandingPageContent } from "./LandingPage";

interface ContactSectionProps {
  content: LandingPageContent["contact"];
  identity: BrandIdentity;
}

export function ContactSection({
  content,
  identity,
}: ContactSectionProps): ReactElement {
  return (
    <section
      id="contact"
      className="section-shell contact-section"
      aria-labelledby="contact-heading"
    >
      <div className="contact-section__copy">
        <p
          className="eyebrow"
          {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
        >
          {content.eyebrow.value}
        </p>
        <h2
          id="contact-heading"
          {...managedSiteFieldAttributesV1(content.heading.fieldId)}
        >
          {content.heading.value}
        </h2>
        <p {...managedSiteFieldAttributesV1(content.description.fieldId)}>
          {content.description.value}
        </p>
      </div>
      <ContactCard identity={identity} />
    </section>
  );
}

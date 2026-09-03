import type { ReactElement } from "react";

import { ContactCard } from "./ContactCard";

interface ContactSectionProps {
  content: {
    eyebrow: string;
    heading: string;
    description: string;
  };
  phone: string;
}

export function ContactSection({
  content,
  phone,
}: ContactSectionProps): ReactElement {
  return (
    <section
      id="contact"
      className="section-shell contact-section"
      aria-labelledby="contact-heading"
    >
      <div className="contact-section__copy">
        <p className="eyebrow">{content.eyebrow}</p>
        <h2 id="contact-heading">{content.heading}</h2>
        <p>{content.description}</p>
      </div>
      <ContactCard phone={phone} />
    </section>
  );
}

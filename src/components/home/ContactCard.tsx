import type { ReactElement } from "react";

import { LeadForm } from "@/components/LeadForm";
import { phoneHref } from "@/lib/phone";

import type { BrandIdentity } from "./LandingPage";

interface ContactCardProps {
  identity: BrandIdentity;
}

const DEMO_BOOKING_URL =
  "https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call";

export function ContactCard({ identity }: ContactCardProps): ReactElement {
  const href = phoneHref(identity.telephone);
  return (
    <div className="contact-card">
      <div className="contact-card__heading">
        <p>Tell us how to reach you</p>
        <span>
          Complete the form and our team will follow up about your dealership.
        </span>
      </div>
      <LeadForm
        variant="homepage"
        submitLabel="Request Information"
        className="contact-card__form"
      />
      <div className="contact-card__divider">
        <span>or choose a time now</span>
      </div>
      <div className="contact-card__actions">
        <a
          className="button"
          href={DEMO_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book a Demo
        </a>
        <a
          className="button button--ghost"
          href={href}
          aria-label={`Call ${identity.displayName} at ${identity.telephone}`}
        >
          Call {identity.telephone}
        </a>
      </div>
    </div>
  );
}

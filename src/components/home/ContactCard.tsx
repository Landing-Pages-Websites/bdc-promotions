import type { ReactElement } from "react";

import { LeadForm } from "@/components/LeadForm";
import { phoneHref } from "@/lib/phone";

import type { BrandIdentity } from "./LandingPage";

interface ContactCardProps {
  identity: BrandIdentity;
}

const STRATEGY_CALL_BOOKING_URL =
  "https://calendly.com/justins-bdc-promotions/bdc-promotions-strategy-call";

export function ContactCard({ identity }: ContactCardProps): ReactElement {
  const href = phoneHref(identity.telephone);
  return (
    <div className="contact-card">
      <div className="contact-card__heading">
        <p>Tell us how to reach you</p>
        <span>
          Share your details so we can discuss your dealership’s goals, or book
          a strategy call with Justin below.
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
          href={STRATEGY_CALL_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book a Strategy Call with Justin
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

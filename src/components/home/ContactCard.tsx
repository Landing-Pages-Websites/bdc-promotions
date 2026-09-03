import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

import type { BrandIdentity } from "./LandingPage";

interface ContactCardProps {
  identity: BrandIdentity;
}

export function ContactCard({ identity }: ContactCardProps): ReactElement {
  const href = phoneHref(identity.telephone);
  return (
    <div className="contact-card">
      <p>Call Today</p>
      <a
        href={href}
        aria-label={`Call ${identity.displayName} at ${identity.telephone}`}
      >
        {identity.telephone}
      </a>
      <span>{identity.displayName}</span>
      <div className="contact-card__actions">
        <a className="button" href={href}>
          Call Now
        </a>
        <a className="button button--ghost" href="#top">
          Back to Top ↑
        </a>
      </div>
    </div>
  );
}

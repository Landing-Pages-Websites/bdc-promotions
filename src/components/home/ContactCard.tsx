import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

interface ContactCardProps {
  phone: string;
}

export function ContactCard({ phone }: ContactCardProps): ReactElement {
  const href = phoneHref(phone);
  return (
    <div className="contact-card">
      <p>Call Today</p>
      <a href={href} aria-label={`Call BDC Promotions at ${phone}`}>
        {phone}
      </a>
      <span>
        BDC Promotions
        <br />
        Automotive Marketing Solutions
      </span>
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

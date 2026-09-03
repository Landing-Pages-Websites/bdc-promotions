import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

interface SiteFooterProps {
  phone: string;
}

export function SiteFooter({ phone }: SiteFooterProps): ReactElement {
  return (
    <footer className="site-footer section-shell">
      <div>
        <strong>BDC Promotions</strong>
        <p>
          Automotive marketing services designed to help dealerships generate
          more conversations and more appointments.
        </p>
      </div>
      <div className="site-footer__links">
        <a href={phoneHref(phone)}>{phone}</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/cookie-policy">Cookies</a>
      </div>
    </footer>
  );
}

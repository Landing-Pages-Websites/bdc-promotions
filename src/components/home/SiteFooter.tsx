import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

import type { BrandIdentity } from "./LandingPage";

interface SiteFooterProps {
  identity: BrandIdentity;
}

export function SiteFooter({ identity }: SiteFooterProps): ReactElement {
  return (
    <footer className="site-footer section-shell">
      <div>
        <strong>{identity.displayName}</strong>
        <p>{identity.description}</p>
      </div>
      <div className="site-footer__links">
        <a href={phoneHref(identity.telephone)}>{identity.telephone}</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/cookie-policy">Cookies</a>
      </div>
    </footer>
  );
}

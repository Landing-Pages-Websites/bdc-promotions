import Link from "next/link";
import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";
import { footerNavigation } from "@/lib/site-navigation";

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
        {footerNavigation.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </div>
    </footer>
  );
}

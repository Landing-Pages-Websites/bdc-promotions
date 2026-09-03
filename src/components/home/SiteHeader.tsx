import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

interface SiteHeaderProps {
  phone: string;
}

export function SiteHeader({ phone }: SiteHeaderProps): ReactElement {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="BDC Promotions home">
        <span className="brand__mark">BDC</span>
        <span className="brand__copy">
          <strong>BDC Promotions</strong>
          <small>Automotive Marketing</small>
        </span>
      </a>
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#services">Services</a>
        <a href="#process">Process</a>
      </nav>
      <a
        className="button button--compact"
        href={phoneHref(phone)}
        aria-label={`Call BDC Promotions at ${phone}`}
      >
        <span className="button__signal" aria-hidden="true" />
        {phone}
      </a>
    </header>
  );
}

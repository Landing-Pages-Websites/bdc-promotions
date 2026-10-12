import Link from "next/link";
import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import { phoneHref } from "@/lib/phone";
import { primaryNavigation } from "@/lib/site-navigation";

import type { BrandIdentity, ManagedTextContent } from "./LandingPage";

interface SiteHeaderProps {
  identity: BrandIdentity;
  tagline: ManagedTextContent;
}

export function SiteHeader({
  identity,
  tagline,
}: SiteHeaderProps): ReactElement {
  const { displayName, telephone } = identity;
  const links = primaryNavigation.map(([href, label]) => <Link key={href} href={href}>{label}</Link>);
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={`${displayName} home`}>
        <span className="brand__mark">BDC</span>
        <span className="brand__copy">
          <strong>{displayName}</strong>
          <small {...managedSiteFieldAttributesV1(tagline.fieldId)}>
            {tagline.value}
          </small>
        </span>
      </a>
      <nav className="site-nav" aria-label="Primary navigation">
        {links}
      </nav>
      {/* Native disclosure for small screens: no JS, closes when the page changes. */}
      <details className="site-menu">
        <summary>
          <span className="sr-only">Menu</span>
          <span className="site-menu__icon" aria-hidden="true" />
        </summary>
        <nav aria-label="Primary navigation">{links}</nav>
      </details>
      <a
        className="button button--compact"
        href={phoneHref(telephone)}
        aria-label={`Call ${displayName} at ${telephone}`}
      >
        <span className="button__signal" aria-hidden="true" />
        {telephone}
      </a>
    </header>
  );
}

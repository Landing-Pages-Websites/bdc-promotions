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
        {primaryNavigation.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
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

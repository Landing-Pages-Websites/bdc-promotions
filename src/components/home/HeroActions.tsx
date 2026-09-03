import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

import type { BrandIdentity } from "./LandingPage";

interface HeroActionsProps {
  identity: BrandIdentity;
}

export function HeroActions({ identity }: HeroActionsProps): ReactElement {
  const { displayName, telephone } = identity;
  return (
    <div className="hero__actions reveal reveal--four">
      <a
        className="button"
        href={phoneHref(telephone)}
        aria-label={`Call ${displayName} at ${telephone}`}
      >
        Call {telephone}
      </a>
      <a className="button button--ghost" href="#contact">
        Request Information <span aria-hidden="true">↘</span>
      </a>
    </div>
  );
}

import type { ReactElement } from "react";

import { phoneHref } from "@/lib/phone";

interface HeroActionsProps {
  phone: string;
}

export function HeroActions({ phone }: HeroActionsProps): ReactElement {
  return (
    <div className="hero__actions reveal reveal--four">
      <a
        className="button"
        href={phoneHref(phone)}
        aria-label={`Call BDC Promotions at ${phone}`}
      >
        Call {phone}
      </a>
      <a className="button button--ghost" href="#contact">
        Request Information <span aria-hidden="true">↘</span>
      </a>
    </div>
  );
}

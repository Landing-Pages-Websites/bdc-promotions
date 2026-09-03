import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import { HeroActions } from "./HeroActions";
import type {
  BrandIdentity,
  ContentCard,
  LandingPageContent,
} from "./LandingPage";

interface HeroCopyProps {
  content: LandingPageContent["hero"];
  identity: BrandIdentity;
  signals: readonly ContentCard[];
}

export function HeroCopy({
  content,
  identity,
  signals,
}: HeroCopyProps): ReactElement {
  return (
    <div className="hero__copy">
      <p
        className="eyebrow reveal reveal--one"
        {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
      >
        {content.eyebrow.value}
      </p>
      <h1
        id="hero-title"
        className="display-title reveal reveal--two"
        {...managedSiteFieldAttributesV1(content.title.fieldId)}
      >
        {content.title.value}
      </h1>
      <p
        className="hero__description reveal reveal--three"
        {...managedSiteFieldAttributesV1(content.description.fieldId)}
      >
        {content.description.value}
      </p>
      <HeroActions identity={identity} />
      <ul
        className="hero__signals reveal reveal--four"
        aria-label={`${identity.displayName} advantages`}
      >
        {signals.map((signal) => (
          <li
            key={signal.itemId}
            {...managedSiteFieldAttributesV1(
              signal.title.fieldId,
              signal.itemId,
            )}
          >
            {signal.title.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

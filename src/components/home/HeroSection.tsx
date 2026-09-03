import type { ReactElement } from "react";

import { HeroCopy } from "./HeroCopy";
import { HeroVisual } from "./HeroVisual";
import type {
  BrandIdentity,
  ContentCard,
  LandingPageContent,
} from "./LandingPage";

interface HeroSectionProps {
  content: LandingPageContent["hero"];
  identity: BrandIdentity;
  signals: readonly ContentCard[];
}

export function HeroSection({
  content,
  identity,
  signals,
}: HeroSectionProps): ReactElement {
  return (
    <section className="hero section-shell" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <HeroCopy content={content} identity={identity} signals={signals} />
      <HeroVisual image={content.image} label={identity.displayName} />
    </section>
  );
}

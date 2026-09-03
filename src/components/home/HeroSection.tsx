import type { ReactElement } from "react";

import { HeroCopy } from "./HeroCopy";
import { HeroVisual } from "./HeroVisual";

interface HeroSectionProps {
  content: {
    eyebrow: string;
    title: string;
    description: string;
    image: {
      src: string;
      alt: string;
    };
  };
  phone: string;
}

export function HeroSection({
  content,
  phone,
}: HeroSectionProps): ReactElement {
  return (
    <section className="hero section-shell" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <HeroCopy content={content} phone={phone} />
      <HeroVisual image={content.image} />
    </section>
  );
}

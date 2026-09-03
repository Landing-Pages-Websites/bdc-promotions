import type { ReactElement } from "react";

import { HeroActions } from "./HeroActions";

interface HeroCopyProps {
  content: {
    eyebrow: string;
    title: string;
    description: string;
  };
  phone: string;
}

export function HeroCopy({ content, phone }: HeroCopyProps): ReactElement {
  return (
    <div className="hero__copy">
      <p className="eyebrow reveal reveal--one">{content.eyebrow}</p>
      <h1 id="hero-title" className="display-title reveal reveal--two">
        {content.title}
      </h1>
      <p className="hero__description reveal reveal--three">
        {content.description}
      </p>
      <HeroActions phone={phone} />
      <ul
        className="hero__signals reveal reveal--four"
        aria-label="BDC Promotions advantages"
      >
        <li>Automotive Industry Focused</li>
        <li>Live Lead Engagement</li>
        <li>Appointment-Driven Strategy</li>
      </ul>
    </div>
  );
}

import Image from "next/image";
import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import type { LandingPageContent } from "./LandingPage";

interface HeroVisualProps {
  image: LandingPageContent["hero"]["image"];
  label: string;
}

export function HeroVisual({ image, label }: HeroVisualProps): ReactElement {
  return (
    <div className="hero__visual reveal reveal--three">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(min-width: 900px) 50vw, 100vw"
        className="hero__image"
        {...managedSiteFieldAttributesV1(image.fieldId)}
      />
      <div className="hero__visual-label" aria-hidden="true">
        <span>01</span>
        <p>{label}</p>
      </div>
    </div>
  );
}

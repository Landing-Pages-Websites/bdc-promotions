import Image from "next/image";
import type { ReactElement } from "react";

interface HeroVisualProps {
  image: {
    src: string;
    alt: string;
  };
}

export function HeroVisual({ image }: HeroVisualProps): ReactElement {
  return (
    <div className="hero__visual reveal reveal--three">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(min-width: 900px) 50vw, 100vw"
        className="hero__image"
      />
      <div className="hero__visual-label" aria-hidden="true">
        <span>01</span>
        <p>Attention becomes conversation. Conversation becomes opportunity.</p>
      </div>
    </div>
  );
}

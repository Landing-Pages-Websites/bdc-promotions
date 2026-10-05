import type { ReactElement } from "react";
import { managedSiteFieldAttributesV1 } from "@landing-pages-websites/managed-site-contract";

import { siteConfig } from "@/site.config";
import type { LandingPageContent } from "./LandingPage";

interface TestimonialSectionProps {
  content: LandingPageContent["testimonial"];
}

export function TestimonialSection({
  content,
}: TestimonialSectionProps): ReactElement | null {
  const videos = content.videoLabels.flatMap((label, index) => {
    const media = siteConfig.testimonialVideos[index];
    return media ? [{ ...media, label }] : [];
  });
  if (videos.length === 0) return null;

  return (
    <section
      id="testimonial"
      className="section-shell testimonial-section"
      aria-labelledby="testimonial-heading"
    >
      <div className="testimonial-section__copy">
        <p
          className="eyebrow"
          {...managedSiteFieldAttributesV1(content.eyebrow.fieldId)}
        >
          {content.eyebrow.value}
        </p>
        <h2
          id="testimonial-heading"
          {...managedSiteFieldAttributesV1(content.heading.fieldId)}
        >
          {content.heading.value}
        </h2>
        <p {...managedSiteFieldAttributesV1(content.description.fieldId)}>
          {content.description.value}
        </p>
      </div>
      <div className="testimonial-section__videos">
        {videos.map(({ src, poster, label }) => (
          <figure className="testimonial-section__clip" key={src}>
            <figcaption {...managedSiteFieldAttributesV1(label.fieldId)}>
              {label.value}
            </figcaption>
            <video
              className="testimonial-section__video"
              controls
              playsInline
              preload="metadata"
              width={640}
              height={360}
              aria-label={label.value}
              src={src}
              poster={poster}
            >
              <a href={src}>{label.value}</a>
            </video>
          </figure>
        ))}
      </div>
    </section>
  );
}

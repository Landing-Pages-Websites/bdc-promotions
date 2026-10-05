import type { ReactElement } from "react";
import type { StableId } from "@landing-pages-websites/managed-site-contract";
import { ContactSection } from "./ContactSection";
import { FocusSection } from "./FocusSection";
import { HeroSection } from "./HeroSection";
import { InsightsSection } from "./InsightsSection";
import { ProcessSection } from "./ProcessSection";
import { ServicesSection } from "./ServicesSection";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { TestimonialSection } from "./TestimonialSection";
import { ValueGrid } from "./ValueGrid";

export interface ManagedTextContent {
  fieldId: StableId<"field">;
  value: string;
}

export interface ContentCard {
  itemId: StableId<"item">;
  title: ManagedTextContent;
  description: ManagedTextContent;
}

export interface ContentSection {
  eyebrow: ManagedTextContent;
  heading: ManagedTextContent;
  description: ManagedTextContent;
  fieldId: StableId<"field">;
  items: readonly ContentCard[];
}

export interface LandingPageContent {
  hero: {
    eyebrow: ManagedTextContent;
    title: ManagedTextContent;
    description: ManagedTextContent;
    image: {
      fieldId: StableId<"field">;
      src: string;
      alt: string;
    };
  };
  values: ContentSection;
  services: ContentSection;
  focus: ContentSection;
  process: ContentSection;
  insights: Omit<ContentSection, "description">;
  testimonial: {
    eyebrow: ManagedTextContent;
    heading: ManagedTextContent;
    description: ManagedTextContent;
    videoLabels: readonly ManagedTextContent[];
  };
  contact: {
    eyebrow: ManagedTextContent;
    heading: ManagedTextContent;
    description: ManagedTextContent;
  };
}

export interface BrandIdentity {
  displayName: string;
  description: string;
  telephone: string;
}

interface LandingPageProps {
  content: LandingPageContent;
  identity: BrandIdentity;
}

export function LandingPage({
  content,
  identity,
}: LandingPageProps): ReactElement {
  return (
    <div id="top" className="site-page">
      <SiteHeader identity={identity} tagline={content.hero.eyebrow} />
      <main>
        <HeroSection
          content={content.hero}
          identity={identity}
          signals={content.values.items.slice(0, 3)}
        />
        <ValueGrid content={content.values} />
        <ServicesSection content={content.services} />
        <ContactSection content={content.contact} identity={identity} />
        <FocusSection content={content.focus} />
        <ProcessSection content={content.process} />
        <InsightsSection content={content.insights} />
        <TestimonialSection content={content.testimonial} />
      </main>
      <SiteFooter identity={identity} />
    </div>
  );
}

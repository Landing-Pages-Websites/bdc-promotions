import type { ReactElement } from "react";
import { ContactSection } from "./ContactSection";
import { FocusSection } from "./FocusSection";
import { HeroSection } from "./HeroSection";
import { InsightsSection } from "./InsightsSection";
import { ProcessSection } from "./ProcessSection";
import { ServicesSection } from "./ServicesSection";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { ValueGrid } from "./ValueGrid";

export interface ContentCard {
  title: string;
  description: string;
}

export interface ContentSection {
  heading: string;
  description: string;
  items: readonly ContentCard[];
}

export interface LandingPageContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    image: {
      src: string;
      alt: string;
    };
  };
  values: ContentSection;
  services: ContentSection;
  focus: ContentSection & { eyebrow: string };
  process: ContentSection;
  insights: Omit<ContentSection, "description">;
  contact: {
    eyebrow: string;
    heading: string;
    description: string;
  };
}

interface LandingPageProps {
  content: LandingPageContent;
  phone: string;
}

export function LandingPage({
  content,
  phone,
}: LandingPageProps): ReactElement {
  return (
    <div id="top" className="site-page">
      <SiteHeader phone={phone} />
      <main>
        <HeroSection content={content.hero} phone={phone} />
        <ValueGrid content={content.values} />
        <ServicesSection content={content.services} />
        <FocusSection content={content.focus} />
        <ProcessSection content={content.process} />
        <InsightsSection content={content.insights} />
        <ContactSection content={content.contact} phone={phone} />
      </main>
      <SiteFooter phone={phone} />
    </div>
  );
}

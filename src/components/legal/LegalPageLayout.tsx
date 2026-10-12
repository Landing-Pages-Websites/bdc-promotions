import type { ReactElement } from "react";
import { InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { siteConfig } from "@/site.config";

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalPageLayoutProps {
  title: string;
  path: string;
  sections: LegalSection[];
}

/** Shared shell for the scaffolded legal pages (privacy/terms/cookies). */
export function LegalPageLayout({ title, path, sections }: LegalPageLayoutProps): ReactElement {
  return (
    <InteriorPage path={path} title={title} intro={`${siteConfig.legalName} (${siteConfig.businessName})`} chapters={[]}>
      <section className={shared.chapter} aria-label={title}>
        <div className={`${shared.container} ${shared.legalDoc}`}>
          {sections.map((section, index) => (
            <div key={section.heading} id={`section-${index + 1}`} className={shared.clause}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </InteriorPage>
  );
}

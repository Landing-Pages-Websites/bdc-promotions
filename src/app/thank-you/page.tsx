import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { InteriorPage } from "@/components/signal-lane/InteriorPage";
import { strategyCall } from "@/lib/site-navigation";
import shared from "@/components/signal-lane/interior-page.module.css";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = buildMetadata({
  title: "Thank You",
  description: `Thanks for contacting ${siteConfig.businessName}.`,
  path: "/thank-you",
});

export default function ThankYouPage(): ReactElement {
  return (
    <InteriorPage
      path="/thank-you"
      title="Thank you!"
      intro={`Your message is on its way to ${siteConfig.businessName}. We will get back to you shortly.`}
      chapters={[]}
    >
      {/* Same direct-contact band and copy as /contact, so the page offers a next step. */}
      <section className={shared.contact} aria-labelledby="contact-title">
        <div className={`${shared.container} ${shared.contactLayout}`}>
          <div><h2 id="contact-title">Prefer to talk directly?</h2><p>Call the office, send an email or choose a time for a strategy call with Justin.</p></div>
          <div className={shared.contactActions}>
            <a className={shared.primary} href={strategyCall}>Book a Strategy Call <span aria-hidden="true">↗</span></a>
            <a className={shared.secondary} href="tel:+13522071074">Call (352) 207-1074 <span aria-hidden="true">→</span></a>
            <a className={shared.secondary} href="mailto:justins@bdc-promotions.com">Email Justin <span aria-hidden="true">→</span></a>
            <Link className={shared.textLink} href="/" data-back><span aria-hidden="true">←</span> Back to home</Link>
          </div>
        </div>
      </section>
    </InteriorPage>
  );
}

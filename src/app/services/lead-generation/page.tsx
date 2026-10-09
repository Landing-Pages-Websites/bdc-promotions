import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Dealership Lead Generation",
  description: "Connect dealership inventory and offers with paid social campaigns, static and video creative, ad optimization and a clear handoff to shopper follow-up.",
  path: "/services/lead-generation",
});

export default function LeadGenerationPage(): ReactElement {
  return (
    <ServicePage
      title="Lead generation focused on dealership opportunities"
      intro="Connect automotive creative with campaign optimization. BDC Promotions builds social campaigns and promotions designed to increase visibility, generate traffic and encourage shoppers to respond."
      chapters={[
        { href: "#campaign-inputs", label: "Build around your store" },
        { href: "#response-handoff", label: "Plan the handoff" },
        { href: "#campaign-fit", label: "Assess campaign fit" },
      ]}
      contactTitle="Start with your dealership’s priorities"
      contactCopy="Tell us about your inventory, current offers and how shopper responses are handled today. Define the campaign and follow-up support your store needs."
      contactLabel="Discuss lead generation"
    >
      <Chapter id="campaign-inputs" title="Your inventory and offers shape the campaign">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>A campaign starts with the dealership: the vehicles you want to promote, the offer you can make and the shoppers you want to engage. Consultation brings those priorities into the creative and campaign plan.</p>
            <p>Creative production gives the campaign its message and format. Lead generation adds the campaign job: connecting that advertising with shopper engagement and response.</p>
            <Link className={styles.textLink} href="/services/automotive-ad-creative">Compare creative formats <span aria-hidden="true">→</span></Link>
          </div>
          <dl className={styles.definitions}>
            <div><dt>Consultation</dt><dd>Shape the campaign around your store, inventory, market and sales priorities.</dd></div>
            <div><dt>Static & video creative</dt><dd>Static ad creation and video creation or editing give your campaign automotive-specific content.</dd></div>
            <div><dt>Ad optimization</dt><dd>Launch and refine paid campaigns around dealership opportunities.</dd></div>
          </dl>
        </div>
      </Chapter>

      <Chapter id="response-handoff" title="Plan for what happens after the ad">
        <ol className={styles.steps}>
          <li><h3>Ads & engagement</h3><p>Use your inventory and offers to give shoppers a relevant reason to engage with the dealership.</p></li>
          <li><h3>Shopper response</h3><p>A response starts a conversation. It still needs follow-up to understand the shopper’s interest and next step.</p></li>
          <li><h3>Nurturing handoff</h3><p>Depending on your service mix, BDC staff and AI-supported tools can continue the conversation toward a scheduled appointment.</p></li>
        </ol>
        <p className={styles.chapterIntro}>Campaign support and BDC follow-up have different roles. Agree who owns the response before the campaign runs; a lead alone is not a scheduled visit or a sale.</p>
      </Chapter>

      <Chapter id="campaign-fit" title="Is your dealership a fit?">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>This service is aimed at franchise and established independent dealerships with a physical storefront and meaningful inventory, typically 50 or more vehicles.</p>
            <p>It is a conversation for stores looking to improve lead opportunities, creative quality or the connection between advertising and follow-up.</p>
          </div>
          <div className={styles.stack}>
            <h3>Questions to bring</h3>
            <ul className={styles.list}>
              <li>Which inventory and offers need campaign support?</li>
              <li>Who handles shopper responses today?</li>
              <li>What campaign scope and reporting do you need to evaluate the work?</li>
            </ul>
            <Link className={styles.textLink} href="/blog/car-dealership-marketing-agency">Read the agency selection guide <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </Chapter>

      <RelatedLinks title="Connect the next step" links={[
        { href: "/services/lead-nurturing-appointment-setting", label: "Lead nurturing & appointment setting" },
        { href: "/services/inventory-advertising", label: "Inventory advertising" },
      ]} />
    </ServicePage>
  );
}

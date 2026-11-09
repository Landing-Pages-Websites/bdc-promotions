import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Dealership Marketing | BDC Promotions",
  description: "Automotive dealership marketing services for lead generation, ad creative, inventory advertising, and dealership lead follow-up.",
  path: "/services/car-dealer-lead-source-comparison-3",
});

export default function AutomotiveDealershipMarketingPage(): ReactElement {
  return (
    <ServicePage
      title="Automotive dealership marketing for lead generation and follow-up"
      intro="Dealership marketing should connect the campaign, the inventory and the response that follows. BDC Promotions helps dealerships choose focused support across lead generation, automotive ad creative, inventory advertising and lead nurturing and appointment setting, so the next conversation has a clear job."
      chapters={[
        { href: "#compare-the-outcome", label: "Compare the outcome" },
        { href: "#choose-the-support", label: "Choose the support" },
        { href: "#make-the-handoff", label: "Make the handoff" },
        { href: "#questions-to-bring", label: "Questions to bring" },
      ]}
      contactTitle="Discuss the right next step for your dealership"
      contactCopy="Tell us which lead sources, campaigns, inventory and follow-up process you want to review. We can discuss whether lead nurturing and appointment setting is the right next step for your dealership."
      contactLabel="Discuss dealership marketing"
    >
      <Chapter id="compare-the-outcome" title="Compare the outcome, not just the lead count.">
        <div className={styles.stack}>
          <p>A dealership lead-source comparison is more useful when it connects marketing spend to the opportunities a sales team can act on. Look at how a source fits the store&apos;s inventory, audience, offer and response process, not only the number of records it produces.</p>
          <p>If you are building the measurement framework, <Link className={styles.inlineLink} href="/blog/car-dealer-lead-source-comparison">compare dealership lead sources</Link> using consistent definitions for qualified leads, appointments and downstream outcomes. The next question is which marketing support fits the gaps that comparison reveals.</p>
        </div>
      </Chapter>

      <Chapter id="choose-the-support" title="Choose the support that fits your dealership." dark>
        <div className={styles.rows}>
          <article>
            <h3>Lead generation</h3>
            <p>Connect dealership inventory and offers with campaigns that give shoppers a reason to respond. Start with the inventory, market, offer and campaign goal, then agree how responses are handed off.</p>
          </article>
          <article>
            <h3>Automotive ad creative</h3>
            <p>Build static or video creative that makes the dealership, vehicle and next step easy to understand. Creative should match the campaign job and the offer the store can support.</p>
          </article>
          <article>
            <h3>Inventory advertising</h3>
            <p>Promote vehicles on the lot with a clear path from inventory attention to the dealership conversation. Review the vehicles and offers that need support and how shoppers move from ad to response.</p>
          </article>
          <article>
            <h3>Lead nurturing and appointment setting</h3>
            <p>Plan what happens after a shopper responds. Define who follows up, how interest is understood, and how an appointment or other next step reaches the dealership team.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="make-the-handoff" title="Make the handoff part of the marketing plan.">
        <div className={styles.stack}>
          <p>A lead is a starting point, not a scheduled visit or a sale. Before a campaign runs, agree who owns the response, what counts as a useful opportunity, how quickly the team follows up, and how appointment details reach the dealership.</p>
          <p>That handoff should also shape the campaign conversation. If the store needs a clearer path from shopper response to a scheduled next step, <Link className={styles.inlineLink} href="/services/lead-nurturing-appointment-setting">explore lead nurturing and appointment setting</Link> as the relevant service conversation.</p>
        </div>
      </Chapter>

      <Chapter id="questions-to-bring" title="Questions to bring to the conversation." dark>
        <ul className={styles.list}>
          <li>Which lead sources and campaigns do you want to compare?</li>
          <li>Which inventory, offers or markets need marketing support?</li>
          <li>Who follows up when a shopper responds, and what happens next?</li>
          <li>Which measures can your dealership review consistently?</li>
        </ul>
      </Chapter>

      <RelatedLinks title="Explore dealership marketing support" links={[
        { href: "/services/lead-generation", label: "Lead generation" },
        { href: "/services/automotive-ad-creative", label: "Automotive ad creative" },
        { href: "/services/inventory-advertising", label: "Inventory advertising" },
        { href: "/services/lead-nurturing-appointment-setting", label: "Lead nurturing and appointment setting" },
      ]} />
    </ServicePage>
  );
}

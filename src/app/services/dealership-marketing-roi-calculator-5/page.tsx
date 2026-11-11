import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

const pageTitle = "Digital Marketing for Dealerships: ROI Calculator Guide | BDC Promotions";

export const metadata: Metadata = {
  ...buildMetadata({
    title: pageTitle,
    description: "Learn how dealerships can evaluate digital marketing ROI across leads, appointments, inventory and sales conversations, then choose a practical next step.",
    path: "/services/dealership-marketing-roi-calculator-5",
  }),
  title: { absolute: pageTitle },
};

export default function DealershipMarketingRoiCalculatorPage(): ReactElement {
  return (
    <ServicePage
      title="Digital marketing for dealerships with a clearer ROI conversation"
      intro="Digital marketing can create activity without making the business result easy to discuss. BDC Promotions helps dealerships connect campaign inputs, shopper responses, follow-up and the outcomes their team can actually review."
      chapters={[
        { href: "#dealership-outcome", label: "Measure the outcome" },
        { href: "#simple-roi-view", label: "Use a simple ROI view" },
        { href: "#marketing-support", label: "Choose the support" },
        { href: "#strategy-conversation", label: "Bring your numbers" },
      ]}
      contactTitle="Review your dealership marketing next step"
      contactCopy="Bring your campaign spend, lead or appointment definitions and the outcome you want to improve. We can discuss which support fits your dealership without treating every response as a sale."
      contactLabel="Discuss dealership marketing"
    >
      <Chapter id="dealership-outcome" title="Start with the dealership outcome you want to measure">
        <div className={styles.stack}>
          <p>Before comparing a digital marketing channel, define the dealership outcome you want the review to explain. That may be more qualified conversations, more appointments, better support for a specific inventory focus or a clearer view of what happens after a shopper responds.</p>
          <p>Keep the stages separate. Record the marketing investment, the responses received, the responses the team could contact, the appointments that were set and the later outcomes the dealership can reliably track. A form fill is not automatically a qualified opportunity, an appointment or a sale.</p>
          <p>Use these questions to establish the review:</p>
          <ul className={styles.list}>
            <li>What business result was the campaign intended to support?</li>
            <li>Which response stages does the dealership define consistently?</li>
            <li>Which inventory, offer or market was the campaign built around?</li>
            <li>Where does the team lose visibility between response and outcome?</li>
          </ul>
        </div>
      </Chapter>

      <Chapter id="simple-roi-view" title="Use a simple ROI view for dealership marketing" dark>
        <div className={styles.stack}>
          <p>A dealership marketing ROI review does not need to hide the assumptions. Start with the investment the dealership wants to evaluate, then compare it with the outcomes that matter to the store.</p>
          <ol className={styles.list}>
            <li><strong>Record the investment.</strong> Note the campaign, creative, media and other costs included in the review.</li>
            <li><strong>Separate the response stages.</strong> Distinguish total responses from contactable opportunities, appointments and later outcomes.</li>
            <li><strong>Connect the result to the campaign context.</strong> Keep the offer, inventory focus, audience and follow-up process visible.</li>
            <li><strong>Compare like with like.</strong> Review the same definitions across time periods, sources or campaigns before deciding what to change.</li>
          </ol>
          <p>If the dealership tracks revenue or gross profit, use the store&apos;s own definitions and attribution rules. The calculation should help the team ask a better next question; it should not turn incomplete data into a guaranteed return.</p>
        </div>
      </Chapter>

      <Chapter id="marketing-support" title="Choose the marketing support that fits the gap">
        <div className={styles.stack}>
          <p>Once the review shows where visibility or follow-through is weakest, choose the support that matches that gap:</p>
          <div className={styles.rows}>
            <article>
              <h3><Link className={styles.inlineLink} href="/services/lead-generation">Lead generation</Link></h3>
              <p>Connect dealership inventory and offers with campaigns designed to encourage shoppers to respond.</p>
            </article>
            <article>
              <h3><Link className={styles.inlineLink} href="/services/automotive-ad-creative">Automotive ad creative</Link></h3>
              <p>Make the dealership, vehicle or offer and the next step easier to understand in static or video creative.</p>
            </article>
            <article>
              <h3><Link className={styles.inlineLink} href="/services/inventory-advertising">Inventory advertising</Link></h3>
              <p>Give shoppers a clearer path from promoted vehicles to a dealership conversation.</p>
            </article>
            <article>
              <h3><Link className={styles.inlineLink} href="/services/lead-nurturing-appointment-setting">Lead nurturing and appointment setting</Link></h3>
              <p>Define what happens after a shopper responds and how the next step reaches the dealership team.</p>
            </article>
          </div>
        </div>
      </Chapter>

      <Chapter id="strategy-conversation" title="Bring your numbers to a strategy conversation" dark>
        <div className={styles.stack}>
          <p>Bring your recent campaign spend, lead or appointment definitions, inventory focus and the outcome you want to improve. A useful conversation starts with what the dealership can measure today and identifies the next question worth answering.</p>
          <ul className={styles.list}>
            <li>Which campaign, source or inventory focus should we review?</li>
            <li>What does the dealership count as a qualified opportunity?</li>
            <li>Who follows up after a shopper responds, and what is recorded?</li>
            <li>Which outcome would make the next marketing decision easier?</li>
          </ul>
        </div>
      </Chapter>

      <RelatedLinks title="Continue the dealership marketing conversation" links={[
        { href: "/services/car-dealer-lead-source-comparison-3", label: "Compare dealership lead sources" },
        { href: "/services/lead-generation", label: "Explore dealership lead generation" },
        { href: "/services/inventory-advertising", label: "Review inventory advertising" },
        { href: "/services/lead-nurturing-appointment-setting", label: "Review lead nurturing and appointment setting" },
        { href: "/contact", label: "Contact BDC Promotions" },
      ]} />
    </ServicePage>
  );
}

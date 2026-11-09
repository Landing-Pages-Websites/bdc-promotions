import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

const pageTitle = "Dealership Marketing Agency | BDC Promotions";

export const metadata: Metadata = {
  ...buildMetadata({
    title: pageTitle,
    description: "Looking for a dealership marketing agency? BDC Promotions connects dealership advertising, creative, lead generation and shopper follow-up.",
    path: "/services/car-dealership-advertising-budget-calculator-4",
  }),
  title: { absolute: pageTitle },
};

export default function DealershipMarketingAgencyPage(): ReactElement {
  return (
    <ServicePage
      title="A dealership marketing agency built around the next customer conversation"
      intro="BDC Promotions helps dealerships connect advertising, creative, lead generation and shopper follow-up around the vehicles and offers they need to move. Start with the job your store needs done, then discuss the mix that fits."
      chapters={[
        { href: "#marketing-jobs", label: "Separate the marketing jobs" },
        { href: "#support-by-job", label: "Choose support by the job" },
        { href: "#planning-inputs", label: "Start with planning inputs" },
      ]}
      contactTitle="Discuss your dealership's marketing mix"
      contactCopy="Bring your sales or appointment goals, inventory priorities, current campaigns and shopper-response process. We can discuss where advertising, creative, lead generation or follow-up support fits."
      contactLabel="Discuss dealership marketing"
    >
      <Chapter id="marketing-jobs" title="What can a dealership marketing agency help your store plan?">
        <p className={styles.chapterIntro}>A dealership marketing agency should make the relationship between campaign activity and the next shopper conversation easier to discuss. Start by separating the jobs your store needs marketing to do.</p>
        <div className={styles.rows}>
          <article>
            <h3>Attract attention</h3>
            <p>Use dealership-relevant advertising and creative to give shoppers a clear reason to notice a vehicle, offer or event. The message, audience and campaign objective should match the job you want the campaign to do.</p>
          </article>
          <article>
            <h3>Promote inventory</h3>
            <p><Link className={styles.inlineLink} href="/services/inventory-advertising">Inventory advertising</Link> can put real vehicles in front of shoppers through the channels that fit your plan. Review the inventory, feed requirements, market and shopper moment before choosing how to promote the vehicles on your lot.</p>
          </article>
          <article>
            <h3>Plan the response</h3>
            <p>A lead is the beginning of a conversation, not a guaranteed appointment or sale. Decide who responds, how quickly the store can follow up, and what information the team needs to move a useful opportunity toward its next step.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="support-by-job" title="Choose marketing support by the job you need done." dark>
        <p className={styles.chapterIntro}>Different dealership priorities call for different kinds of support. Use the service role that matches the immediate job, or connect several roles around one campaign plan.</p>
        <div className={styles.rows}>
          <article>
            <h3><Link href="/services/automotive-ad-creative">Campaign and ad creative</Link></h3>
            <p>When the store needs a clearer message for an offer, event or vehicle group, start with creative that makes the dealership and the next action easy to understand.</p>
          </article>
          <article>
            <h3><Link href="/services/inventory-advertising">Inventory advertising</Link></h3>
            <p>When the priority is vehicle-focused exposure, compare Meta Automotive Inventory Ads with Google Vehicle Listing Ads and decide which shopper moments matter most.</p>
          </article>
          <article>
            <h3><Link href="/services/lead-generation">Lead generation and follow-up</Link></h3>
            <p>When the priority is creating and handling more dealership conversations, connect campaign goals with lead generation and the process that follows a response.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="planning-inputs" title="Start with goals, budget and response capacity.">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>A practical dealership marketing conversation starts with the outcome you want to support. Bring an additional sales or appointment goal, the period you are planning for, the inventory or offer that needs attention, and the response capacity available at the store.</p>
          </div>
          <div className={styles.stack}>
            <p>Use the numbers you trust, keep media spend separate from service and production costs, and treat planning ranges as assumptions rather than promises. Your budget also needs to fit what the dealership can respond to and measure.</p>
          </div>
        </div>
      </Chapter>

      <RelatedLinks title="Continue planning for your dealership" links={[
        { href: "/blog/car-dealership-advertising-budget-calculator", label: "Use the dealership advertising budget guide" },
        { href: "/services/inventory-advertising", label: "Compare inventory advertising channels" },
        { href: "/contact", label: "Talk through your dealership's priorities" },
      ]} />
    </ServicePage>
  );
}

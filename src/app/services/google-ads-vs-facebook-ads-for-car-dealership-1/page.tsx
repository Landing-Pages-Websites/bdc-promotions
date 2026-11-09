import type { Metadata } from "next";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

const pageTitle = "Google Ads vs. Facebook Ads for Car Dealerships | BDC Promotions";

export const metadata: Metadata = {
  ...buildMetadata({
    title: pageTitle,
    description: "Compare Google Ads and Facebook Ads for dealership marketing, then choose a channel mix around shopper intent, creative, inventory and follow-up.",
    path: "/services/google-ads-vs-facebook-ads-for-car-dealership-1",
  }),
  title: { absolute: pageTitle },
};

export default function GoogleAdsVsFacebookAdsForCarDealershipPage(): ReactElement {
  return (
    <ServicePage
      title="Google Ads vs. Facebook Ads for car dealerships"
      intro="Auto dealership marketing works best when each channel has a clear job. Compare Google’s demand capture with Facebook’s feed-based discovery, then shape a practical campaign around your inventory, offers and follow-up."
      chapters={[
        { href: "#shopper-moments", label: "Compare shopper moments" },
        { href: "#choose-the-channel", label: "Choose the channel" },
        { href: "#campaign-planning", label: "Plan your campaign" },
      ]}
      contactTitle="Build a dealership marketing plan around your goals"
      contactCopy="Tell us whether you need to capture active demand, create new interest, or connect advertising with a stronger shopper-response process. We can discuss the inventory, offer, audience and campaign support your dealership needs."
      contactLabel="Discuss dealership marketing"
    >
      <Chapter id="shopper-moments" title="One question, two different shopper moments." dark>
        <p className={styles.chapterIntro}>Google Ads and Facebook Ads can both support a dealership, but they start from different shopper moments. Google can respond to an active search. Facebook can introduce a dealership, vehicle or offer while a shopper is browsing. The better choice depends on the job the campaign needs to do, the creative available, and what happens after a shopper responds.</p>
        <div className={styles.split}>
          <article className={styles.channel}>
            <h3>Google Ads</h3>
            <p>Meet shoppers who are actively searching for a vehicle, model, dealership or related answer. Search can be a candidate for capturing existing demand, but a query is not a guarantee that a shopper is ready to visit or buy. The page, offer, location and response process still need to fit the search.</p>
          </article>
          <article className={styles.channel}>
            <h3>Facebook Ads</h3>
            <p>Introduce your dealership, inventory or offer to a defined audience while people browse a social feed. Facebook can help create or renew interest through relevant creative, but an impression is not the same as purchase intent. The message needs to give the right shopper a clear reason to engage.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="choose-the-channel" title="Choose the channel by the job you need done.">
        <div className={styles.rows}>
          <article>
            <h3>Capture active demand</h3>
            <p>Consider Google when the goal is to meet shoppers expressing a specific need through search. Review the queries, location, landing experience and follow-up capacity before deciding how much of the campaign should serve that job.</p>
          </article>
          <article>
            <h3>Create local attention</h3>
            <p>Consider Facebook when the goal is to put a dealership message, vehicle selection or offer in front of people who may not be searching yet. Use creative that makes the store, inventory and next step easy to understand.</p>
          </article>
          <article>
            <h3>Connect advertising to response</h3>
            <p>Whichever channel you use, define who responds to shoppers, what counts as a useful opportunity, and how the dealership will evaluate the campaign. More clicks or leads do not automatically mean more appointments or sales.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="campaign-planning" title="What to settle before the campaign runs." dark>
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>A useful dealership marketing conversation starts with the store, not a platform preference. Bring the vehicles, offers or events that need support, the audience and market you want to reach, and the way your team handles shopper responses.</p>
            <p>Google and Facebook do not have to be treated as an either-or decision. The practical choice is the mix that matches the dealership’s goal, budget, creative, inventory and follow-up process.</p>
          </div>
          <div className={styles.stack}>
            <h3>Discuss these questions before choosing a channel mix:</h3>
            <ul className={styles.list}>
              <li>Are you trying to capture an active search, create new interest, or do both?</li>
              <li>Which inventory, offer or dealership message should the creative support?</li>
              <li>Who owns the response after a shopper submits a form or starts a conversation?</li>
              <li>What campaign scope and reporting will help you judge whether the work is useful?</li>
            </ul>
          </div>
        </div>
      </Chapter>

      <RelatedLinks title="Continue the dealership marketing conversation" links={[
        { href: "/blog/google-ads-vs-facebook-ads-for-car-dealerships", label: "Read the detailed Google Ads vs. Facebook Ads for Car Dealerships: Which Fits Your Goals?" },
        { href: "/services/lead-generation", label: "Discuss dealership lead generation" },
      ]} />
    </ServicePage>
  );
}

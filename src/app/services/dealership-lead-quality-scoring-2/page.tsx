import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

const pageTitle = "Dealership Digital Marketing & Lead Quality Scoring | BDC Promotions";

export const metadata: Metadata = buildMetadata({
  title: pageTitle,
  description: "Explore dealership digital marketing through a practical lead-quality lens: connect creative, inventory, shopper response and follow-up to clearer next steps.",
  path: "/services/dealership-lead-quality-scoring-2/",
});

export default function DealershipLeadQualityScoringPage(): ReactElement {
  return (
    <ServicePage
      title="Dealership digital marketing that makes lead quality easier to evaluate"
      intro="A dealership can generate responses without knowing which opportunities deserve the fastest follow-up. BDC Promotions helps connect advertising, inventory, offers and shopper response so your team can review lead quality in the context of the campaign."
      chapters={[
        { href: "#define-lead-quality", label: "Define lead quality" },
        { href: "#review-campaign-context", label: "Review campaign context" },
        { href: "#choose-the-next-action", label: "Choose the next action" },
      ]}
      contactTitle="Want to review your dealership's lead opportunities?"
      contactCopy="Bring a recent campaign, inventory focus or lead follow-up question. Talk through the context you want to evaluate and the next step that fits your store."
      contactLabel="Discuss dealership marketing"
    >
      <Chapter id="define-lead-quality" title="What lead quality scoring should help your dealership see" dark>
        <div className={styles.stack}>
          <p>Lead quality scoring is a way to organize signals from a dealership&apos;s marketing and shopper conversations. It helps a team compare opportunities using consistent questions instead of relying only on lead volume or a single early interaction. The score should support follow-up and campaign decisions, not replace judgment or promise a sale.</p>
          <p>A useful review keeps these signals distinct:</p>
          <ul className={styles.list}>
            <li><strong>Contactability:</strong> Are the contact details usable, and has a response been recorded?</li>
            <li><strong>Buyer intent:</strong> Is there a specific vehicle, question, offer or next step in the request?</li>
            <li><strong>Inventory fit:</strong> Does the request connect with the vehicles or categories the store can offer?</li>
            <li><strong>Appointment readiness:</strong> Has the shopper indicated a practical next step, without treating an inquiry as an appointment?</li>
            <li><strong>Sales outcome:</strong> What happened later, where the dealership tracks visits, appointments or sales?</li>
          </ul>
          <p>Separating these dimensions helps a dealership see whether a weak result comes from missing information, a campaign message, inventory availability, response handling or a later-stage outcome.</p>
        </div>
      </Chapter>

      <Chapter id="review-campaign-context" title="Start with the campaign context, not just the lead count">
        <div className={styles.stack}>
          <p>Lead quality has meaning only in context. Record the campaign or source, the offer and creative, the inventory or vehicle category promoted, and the action the shopper was invited to take. Then compare those details with the information available in the lead and with the follow-up that occurred.</p>
          <ul className={styles.list}>
            <li>Did the creative make the dealership, vehicle or offer clear?</li>
            <li>Did the promoted inventory match what shoppers were asking about?</li>
            <li>Did the requested action make sense for the campaign and the store&apos;s process?</li>
            <li>Who owned the response, and what happened after the lead arrived?</li>
          </ul>
          <p>A consistent review makes it easier to discuss campaign quality without treating every form fill as equal or every low score as a reason to dismiss a shopper.</p>
        </div>
      </Chapter>

      <Chapter id="choose-the-next-action" title="Turn the review into a clearer dealership next step" dark>
        <div className={styles.stack}>
          <p>Use the findings to decide what deserves attention next. The answer may be a clearer campaign message, a better match between the offer and available inventory, a defined follow-up handoff, or a closer look at the source creating the response. A lead-quality review is most useful when it changes a conversation into a specific question the dealership can investigate.</p>
          <p>BDC Promotions can discuss the advertising and creative context around that review. Explore <Link className={styles.inlineLink} href="/services/automotive-ad-creative/">automotive ad creative for car dealerships</Link> when the message, format or offer needs attention. Read the <Link className={styles.inlineLink} href="/blog/dealership-lead-quality-scoring">dealership lead quality scoring framework</Link> for the supporting educational discussion.</p>
          <p>A lead is not an appointment or a sale. Keep scoring aligned with the dealership&apos;s definitions, communication policies and the outcomes it can actually track.</p>
        </div>
      </Chapter>

      <RelatedLinks title="Continue the dealership marketing conversation" links={[
        { href: "/services/automotive-ad-creative/", label: "Explore automotive ad creative" },
        { href: "/services/lead-generation/", label: "Explore dealership lead generation" },
        { href: "/services/lead-nurturing-appointment-setting/", label: "Review lead nurturing & appointment setting" },
        { href: "/blog/dealership-lead-quality-scoring", label: "Read the lead quality scoring framework" },
      ]} />
    </ServicePage>
  );
}

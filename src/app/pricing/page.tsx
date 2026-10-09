import type { Metadata } from "next";
import Link from "next/link";
import { InteriorChapter, InteriorLinks, InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { buildMetadata } from "@/lib/seo";
import styles from "./pricing.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Dealership Marketing Consultation & Service Options",
  description: "Compare automotive creative, campaign, inventory and follow-up support. Define your dealership’s service scope and request a quote from BDC Promotions.",
  path: "/pricing",
});

const options = [
  { title: "Creative", role: "Static ad creation and video creation or editing around dealership vehicles, offers and events.", question: "Which message, formats and existing footage should shape the creative?", href: "/services/automotive-ad-creative", label: "Automotive ad creative" },
  { title: "Campaigns", role: "Paid social campaigns connect automotive creative with ad optimization and shopper engagement.", question: "Which shoppers and inventory are you trying to reach, and what advertising is already running?", href: "/services/lead-generation", label: "Lead generation" },
  { title: "Inventory", role: "Meta Automotive Inventory Ads and Google Vehicle Listing Ads put vehicle inventory into advertising.", question: "Which channel fits your inventory, and what feed, account and setup requirements need review?", href: "/services/inventory-advertising", label: "Inventory advertising" },
  { title: "Follow-up", role: "BDC staff and AI-supported tools nurture shopper conversations toward appointments with a scheduled day and time.", question: "Where do leads arrive, who responds today, and what appointment handoff does your store need?", href: "/services/lead-nurturing-appointment-setting", label: "Lead nurturing & appointment setting" },
] as const;

export default function PricingPage() {
  return <InteriorPage path="/pricing" title="Find the support your store needs"
    intro="Start with your dealership’s priorities, then define the scope. Choose an individual service or connect creative, campaigns and follow-up around your team."
    chapters={[{ href: "#service-options", label: "Compare service roles" }, { href: "#connected-support", label: "Connect the support" }, { href: "#quote-scope", label: "Prepare a quote request" }]}
    contactTitle="Define the scope for your dealership"
    contactCopy="Tell us which services you’re considering and what your store needs. Request a quote or book a strategy call to talk through the scope."
    contactLabel="Request a scoped quote">
    <InteriorChapter id="service-options" title="Choose by the work you need">
      <div className={styles.options}>
        {options.map(option => <article key={option.title} className={styles.option}>
          <h3>{option.title}</h3>
          <div><p>{option.role}</p><Link className={shared.textLink} href={option.href}>{option.label} →</Link></div>
          <div className={styles.question}><p>{option.question}</p></div>
        </article>)}
      </div>
    </InteriorChapter>
    <InteriorChapter id="connected-support" title="Individual services. Connected responsibilities." dark>
      <div className={shared.split}>
        <div className={shared.stack}><p>Your dealership may need creative for an existing campaign, help connecting ads with shopper response, or support continuing the conversation after a lead arrives.</p><p>Discuss the parts your team already handles and where BDC Promotions can contribute.</p></div>
        <div className={shared.stack}><h3>When the work connects</h3><p>Creative gives the campaign its message. Campaign optimization supports shopper engagement. BDC staff and AI-supported nurturing help move the conversation toward an appointment.</p><Link className={shared.textLink} href="/process">Follow the operating process →</Link></div>
      </div>
    </InteriorChapter>
    <InteriorChapter id="quote-scope" title="Make the consultation specific">
      <div className={shared.split}>
        <div className={shared.stack}><h3>Tell us about the store</h3><p>Share your dealership’s inventory priorities, market, current advertising and follow-up process. Include the creative or campaign work you want to discuss.</p><p>A useful request describes the support you need and the responsibilities your team plans to keep.</p></div>
        <div className={shared.stack}><h3>Questions for your quote</h3><ul className={shared.list}>
          <li>Which creative formats and campaign channels belong in the scope?</li>
          <li>What media budget and setup needs should the plan account for?</li>
          <li>Who will handle approvals, shopper responses and appointment handoffs?</li>
          <li>What timing and reporting needs should be discussed?</li>
        </ul><Link className={shared.textLink} href="/contact">Share your requirements →</Link></div>
      </div>
    </InteriorChapter>
    <InteriorLinks title="Keep evaluating your fit" links={[{ href: "/services", label: "All automotive marketing services" }, { href: "/work", label: "See advertising examples" }]} />
  </InteriorPage>;
}

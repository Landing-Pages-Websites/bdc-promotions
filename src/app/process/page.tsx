import type { Metadata } from "next";
import Link from "next/link";
import { InteriorChapter, InteriorLinks, InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { buildMetadata } from "@/lib/seo";
import styles from "./process.module.css";

export const metadata: Metadata = buildMetadata({
  title: "How BDC Promotions Moves Leads Toward the Showroom",
  description: "Follow BDC Promotions’ four-step process from learning your store to campaign creative, shopper conversations and scheduled appointments. Prepare for roles and handoffs.",
  path: "/process",
});

export default function ProcessPage() {
  return <InteriorPage path="/process" title="From your store’s goals to a showroom conversation"
    intro="We keep the process focused on your dealership, your shoppers, and the steps that move online interest toward a real appointment."
    chapters={[{ href: "#operating-sequence", label: "How it works" }, { href: "#dealership-handoff", label: "Prepare your team" }, { href: "#discuss-your-dealership", label: "Talk through your process" }]}
    contactTitle="Where does your process need support?"
    contactCopy="Bring your campaign priorities and current follow-up approach. Discuss the work BDC Promotions can support and the handoffs to agree with your dealership."
    contactLabel="Talk through your process">
    <InteriorChapter id="operating-sequence" title="How it works">
      <ol className={styles.sequence} role="list">
        <li id="learn-your-store">
          <div><h3>Learn Your Store</h3><p>We get familiar with your dealership, your goals, and the type of customers you want to reach.</p></div>
          <div><p>Consultation connects your inventory, market and sales priorities to the campaign. Start with the vehicles and offers you want shoppers to notice.</p><Link className={shared.textLink} href="/services/inventory-advertising">Explore inventory advertising →</Link></div>
        </li>
        <li id="build-the-campaign">
          <div><h3>Build The Campaign</h3><p>We put together the social message, creative direction, and lead engagement strategy.</p></div>
          <div><p>Static and video creative give the campaign its message. Paid social and ad optimization connect that creative with shopper response.</p><div className={styles.links}><Link className={shared.textLink} href="/services/automotive-ad-creative">Explore ad creative →</Link><Link className={shared.textLink} href="/services/lead-generation">Explore lead generation →</Link></div></div>
        </li>
        <li id="engage-shoppers">
          <div><h3>Engage Shoppers</h3><p>We help create real conversations with shoppers and guide them toward the next step.</p></div>
          <div><p>Messenger lead response, BDC staff and AI-supported nurturing help continue the conversation. The service mix determines where follow-up support fits.</p><Link className={shared.textLink} href="/services/lead-nurturing-appointment-setting">Explore lead nurturing →</Link></div>
        </li>
        <li id="drive-appointments">
          <div><h3>Drive Appointments</h3><p>The goal is simple: more qualified opportunities and more showroom visits for your team.</p></div>
          <div><p>Move interested shoppers toward a visit with a scheduled day and time. Agree how appointment details reach your team and who takes the next step at the dealership.</p><Link className={shared.textLink} href="/services/lead-nurturing-appointment-setting#appointment-handoff">See the appointment handoff →</Link></div>
        </li>
      </ol>
    </InteriorChapter>
    <InteriorChapter id="dealership-handoff" title="Prepare the inputs. Agree the handoffs." dark>
      <div className={shared.split}>
        <div className={shared.stack}><h3>Bring your dealership context</h3><ul className={shared.list}>
          <li>Inventory, offers and campaign priorities you want to discuss.</li>
          <li>Existing creative or footage available for the campaign.</li>
          <li>Your current process for responding to shoppers and receiving appointments.</li>
        </ul></div>
        <div className={shared.stack}><h3>Questions to settle together</h3><ul className={shared.list}>
          <li>Who at the store will confirm vehicle information and approve the campaign message?</li>
          <li>Who owns each response, and when should a conversation pass to a dealership team member?</li>
          <li>What coverage, response expectations and appointment information does your team need?</li>
          <li>How will you review campaign activity and communicate changes?</li>
        </ul></div>
      </div>
    </InteriorChapter>
    <InteriorLinks title="Choose the support around your team" links={[{ href: "/pricing", label: "Compare service options" }, { href: "/work", label: "Inspect the creative" }, { href: "/testimonials", label: "Watch Curt’s testimonial" }]} />
  </InteriorPage>;
}

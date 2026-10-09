import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Dealership Lead Nurturing & Appointment Setting",
  description: "Explore BDC staff and AI-supported lead nurturing, shopper prequalification, appointment scheduling and a coordinated handoff to your dealership.",
  path: "/services/lead-nurturing-appointment-setting",
});

export default function LeadNurturingPage(): ReactElement {
  return (
    <ServicePage
      title="Lead nurturing & appointment setting for dealerships"
      intro="Keep the conversation moving after a shopper responds. BDC staff and AI-supported tools support follow-up, prequalification and the path toward a dealership appointment with a scheduled day and time."
      chapters={[
        { href: "#follow-up-roles", label: "Human & AI roles" },
        { href: "#appointment-handoff", label: "Conversation to appointment" },
        { href: "#follow-up-scope", label: "Define your support" },
      ]}
      contactTitle="Where does your follow-up need support?"
      contactCopy="Talk through your lead sources, current response process and appointment handoff. Define the BDC and AI-supported nurturing your dealership needs."
      contactLabel="Discuss your follow-up process"
    >
      <Chapter id="follow-up-roles" title="Human conversations. AI-supported nurturing.">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>A missed message or inconsistent follow-up can leave a shopper’s interest unanswered. Nurturing connects that first response with a conversation about the next step.</p>
            <p>Facebook Messenger response, BDC staff and AI-supported nurturing help continue shopper conversations.</p>
            <p>BDC Promotions combines BDC staff with AI-supported tools. The service centers on shopper conversations and appointment scheduling, with the human and tool responsibilities defined around your dealership’s needs.</p>
            <Link className={styles.textLink} href="/blog/welcome">Read why speed to lead matters <span aria-hidden="true">→</span></Link>
          </div>
          <dl className={styles.definitions}>
            <div><dt>BDC staff</dt><dd>Lead nurturing, shopper prequalification and appointment scheduling.</dd></div>
            <div><dt>AI-supported tools</dt><dd>Support the nurturing process alongside the BDC team. Discuss the specific tasks and when a person should take over.</dd></div>
            <div><dt>Your dealership</dt><dd>Coordinate the handoff so your team can take the next step with the shopper at the store.</dd></div>
          </dl>
        </div>
      </Chapter>

      <Chapter id="appointment-handoff" title="Make the next step a specific one">
        <div className={styles.rows}>
          <article><h3>Continue the conversation</h3><p>Follow up on the shopper’s interest and keep the conversation moving. The focus is the shopper’s next step, beyond the initial marketing response.</p></article>
          <article><h3>Prequalify the opportunity</h3><p>Use the conversation to understand the shopper’s interest and readiness for a dealership visit. Agree the qualification questions with your store.</p></article>
          <article><h3>Schedule a day and time</h3><p>Move interested shoppers toward a specific appointment, then coordinate the handoff to the dealership. A scheduled appointment is an opportunity for your team; attendance and a sale are not guaranteed.</p></article>
        </div>
      </Chapter>

      <Chapter id="follow-up-scope" title="Define the support around your operation">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>Start with where your leads arrive and how your team handles them today. Coverage hours, communication channels and response expectations belong in the service discussion.</p>
            <p>Confirm the scripts, human escalation points and information your dealership needs at handoff. Agree how appointments will be coordinated with your team.</p>
          </div>
          <div className={styles.stack}>
            <h3>Connect follow-up with your CRM decisions</h3>
            <p>Your lead-management process matters when you evaluate nurturing support. Use the CRM buyer guide to prepare questions about how your store manages conversations and appointments.</p>
            <Link className={styles.textLink} href="/blog/automotive-dealership-crm-buyer-guide">Read the dealership CRM buyer guide <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </Chapter>

      <RelatedLinks title="Connect campaigns and follow-up" links={[
        { href: "/services/lead-generation", label: "Lead generation" },
        { href: "/services/automotive-ad-creative", label: "Automotive ad creative" },
        { href: "/process", label: "Process" },
        { href: "/pricing", label: "Service Options" },
      ]} />
    </ServicePage>
  );
}

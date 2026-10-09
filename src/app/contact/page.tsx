import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { ContactInterior } from "@/components/signal-lane/ContactInterior";
import { InteriorChapter, strategyCall } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { buildMetadata } from "@/lib/seo";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Contact BDC Promotions",
    description: "Talk with BDC Promotions about your dealership’s creative, campaigns and follow-up. Call, email, book a strategy call or send your contact information.",
    path: "/contact",
  }),
  title: { absolute: "Contact BDC Promotions" },
};

export default function ContactPage() {
  return <ContactInterior className={styles.surface}>
    <section className={`${shared.container} ${shared.hero}`} aria-labelledby="contact-page-title">
      <h1 id="contact-page-title">Let’s talk about your dealership</h1>
      <p className={shared.intro}>Discuss the creative, campaigns and follow-up your store needs. Choose a direct contact option or leave your contact information below.</p>
      <div className={styles.directChoices}>
        <div><p>Call the office</p><a href="tel:+13522071074">(352) 207-1074 <span aria-hidden="true">↗</span></a></div>
        <div><p>Email Justin</p><a href="mailto:justins@bdc-promotions.com">justins@bdc-promotions.com <span aria-hidden="true">↗</span></a></div>
        <div><p>Choose a meeting time</p><a href={strategyCall}>Book a Strategy Call <span aria-hidden="true">↗</span></a></div>
      </div>
      <nav className={shared.chapterLinks} aria-label="On this page">
        <a href="#request-information">Send a request <span aria-hidden="true">↓</span></a>
        <a href="#prepare-your-conversation">Prepare for the conversation <span aria-hidden="true">↓</span></a>
      </nav>
    </section>
    <InteriorChapter id="request-information" title="Request information">
      <div className={styles.requestLayout}>
        <div className={shared.stack}>
          <p>Leave your first and last name, email and phone number to request contact from BDC Promotions.</p>
          <p>This form collects your contact details. To share dealership information or questions now, use the email option above. To choose a meeting time, use the booking link.</p>
          <Link className={shared.textLink} href="/privacy-policy">Read our privacy policy →</Link>
        </div>
        <LeadForm className={styles.form} submitLabel="Send a request" />
      </div>
    </InteriorChapter>
    <InteriorChapter id="prepare-your-conversation" title="Make the conversation useful">
      <p className={shared.chapterIntro}>Think through these questions before a call or include the details in your email.</p>
      <div className={styles.preparation}>
        <div><h3>What needs attention?</h3><p>Which vehicles, offers or events matter to your store? Where do creative, campaign activity or shopper response need support?</p><Link className={shared.textLink} href="/services">Explore the service roles →</Link></div>
        <div><h3>What does your team handle?</h3><p>Who responds to leads today, who approves campaign messaging and how do appointment details reach your sales team?</p><Link className={shared.textLink} href="/process">Review the process →</Link></div>
        <div><h3>What belongs in the scope?</h3><p>Consider the support you need, the work your team will keep, and any timing or budget questions you want to discuss.</p><Link className={shared.textLink} href="/pricing">Compare service options →</Link></div>
      </div>
    </InteriorChapter>
  </ContactInterior>;
}

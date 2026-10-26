import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, Plate, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Ad Creative for Car Dealerships",
  description: "Explore static, event, inventory and video ad creative for dealerships, with automotive consultation, creation, editing and ad optimization.",
  path: "/services/automotive-ad-creative",
});

export default function AutomotiveAdCreativePage(): ReactElement {
  return (
    <ServicePage
      visual={<Plate file="work-luxury-campaign" width={1122} height={1402} alt="Historical luxury automotive campaign artwork with a dealership and three vehicles" max={400} eager />}
      title="Automotive ad creative that starts the conversation"
      intro="Give shoppers a reason to respond. BDC Promotions creates static, event, inventory and video advertising around your dealership’s vehicles, offers and campaign priorities."
      chapters={[
        { href: "#creative-formats", label: "Choose a format" },
        { href: "#creative-support", label: "Shape the creative" },
        { href: "#discuss-your-dealership", label: "Discuss your creative" },
      ]}
      contactTitle="What does your next campaign need to say?"
      contactCopy="Bring your current inventory, offer or event idea. Talk through the formats and production support that fit your dealership."
      contactLabel="Discuss your creative"
    >
      <Chapter id="creative-formats" title="Start with the message. Choose the format." dark>
        <div className={styles.rows}>
          <article>
            <div><h3>Static & new-car lead-gen ads</h3><Plate file="growth-repo-sale" width={1080} height={1080} alt="Historical repossession-sale static ad with three vehicles and original offer copy" max={280} /></div>
            <p>Offer-focused creative gives a new-car campaign a clear message and invites shoppers to connect with the dealership. Static ad creation supports the campaign’s vehicle and offer priorities.</p>
          </article>
          <article>
            <div><h3>Event ads & event videos</h3><Plate file="hero-used-car-event" width={1086} height={1448} alt="Historical used-car sales event creative with a vehicle lineup and voucher message" max={240} /></div>
            <p>Build the creative around the event your store is promoting. Static and video formats give that event a place in your automotive advertising.</p>
          </article>
          <article>
            <div><h3>Inventory creative</h3><Plate file="work-inventory-ad" width={1090} height={596} alt="Supplied Meta inventory ad example showing truck listings in a social feed" max={400} /></div>
            <p>Put the vehicles at the center of the message. Inventory-focused creative connects what your dealership has available with what you are promoting.</p>
          </article>
          <article>
            <div><h3>Video creation & editing</h3><Plate file="work-luxury-storyboard" width={426} height={640} alt="Supplied luxury automotive storyboard with five scenes and original production attribution" /></div>
            <p>Explore new-car, employee, luxury, viral-concept and customer-testimonial video formats. Choose the subject that fits your campaign and the footage or stories available to your store.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="creative-support" title="From consultation to campaign creative">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>Consultation connects the creative brief to your store, inventory, market and sales priorities. That context helps define the message before static creation or video production and editing begins.</p>
            <p>Ad optimization connects the creative to its use in a campaign. If you also need campaign execution or shopper follow-up, consider <Link href="/services/lead-nurturing-appointment-setting">lead nurturing and appointment setting</Link> as part of the conversation.</p>
            <Link className={styles.textLink} href="/work">Explore automotive advertising work <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.stack}>
            <h3>Bring a useful brief</h3>
            <ul className={styles.list}>
              <li>The vehicles, offers or event you want to promote.</li>
              <li>The static or video formats you are considering.</li>
              <li>The existing footage, creative and approved stories you can share.</li>
            </ul>
            <p>Confirm the production scope, timing and revision needs during consultation so the work matches your campaign.</p>
          </div>
        </div>
      </Chapter>

      <RelatedLinks title="Put the creative to work" links={[
        { href: "/services/lead-generation", label: "Lead generation" },
        { href: "/services/inventory-advertising", label: "Inventory advertising" },
        { href: "/blog/car-dealership-marketing-agency", label: "Choosing a dealership marketing agency" },
        { href: "/process", label: "Process" },
      ]} />
    </ServicePage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { Chapter, RelatedLinks, ServicePage } from "@/components/signal-lane/ServicePage";
import styles from "@/components/signal-lane/service-page.module.css";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Inventory Ads & Google Vehicle Listing Ads",
  description: "Compare Meta Automotive Inventory Ads and Google Vehicle Listing Ads, understand their roles and discuss inventory advertising for your dealership.",
  path: "/services/inventory-advertising",
});

export default function InventoryAdvertisingPage(): ReactElement {
  return (
    <ServicePage
      title="Inventory advertising for the vehicles on your lot"
      intro="Bring dealership inventory into your advertising. Compare Meta Automotive Inventory Ads with Google Vehicle Listing Ads to understand where each channel fits your store’s priorities."
      chapters={[
        { href: "#inventory-channels", label: "Compare Meta & Google" },
        { href: "#inventory-creative", label: "Connect inventory & creative" },
        { href: "#inventory-planning", label: "Plan your setup" },
      ]}
      contactTitle="Find the right channel for your inventory"
      contactCopy="Discuss the vehicles you want to promote, your current advertising and the requirements for Meta, Google or a combined approach."
      contactLabel="Discuss inventory advertising"
    >
      <Chapter id="inventory-channels" title="Two channels. Different shopper moments.">
        <p className={styles.chapterIntro}>Meta supports vehicle discovery in a social environment. Google connects inventory advertising with shoppers actively searching for vehicles.</p>
        <div className={styles.split}>
          <article className={styles.channel}>
            <h3>Meta Automotive Inventory Ads</h3>
            <p>Dynamic new and used vehicle advertising showcases real dealership inventory to shoppers on Meta.</p>
            <p>The service includes third-party data to target owners of similar makes and models. Discuss how this audience approach fits the inventory you want to promote.</p>
          </article>
          <article className={styles.channel}>
            <h3>Google Vehicle Listing Ads</h3>
            <p>Put dealership inventory in front of high-intent shoppers while they are actively searching for vehicles on Google.</p>
            <p>The channel’s role is search visibility: connecting the vehicles you advertise with shoppers already looking for a vehicle.</p>
          </article>
        </div>
      </Chapter>

      <Chapter id="inventory-creative" title="Keep the vehicles and the message connected">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>Inventory advertising centers on the vehicles your dealership has to offer. Static, event and video creative can give the broader campaign its offer or event message.</p>
            <p>Choose inventory advertising for vehicle-focused exposure, then consider how creative production and lead generation fit around it.</p>
            <Link className={styles.textLink} href="/work">Explore related automotive work <span aria-hidden="true">→</span></Link>
          </div>
          <dl className={styles.definitions}>
            <div><dt>Inventory advertising</dt><dd>Promote real vehicles through Meta inventory ads or Google Vehicle Listing Ads.</dd></div>
            <div><dt>Automotive creative</dt><dd>Build static and video content around vehicles, offers and dealership events.</dd></div>
            <div><dt>Lead generation</dt><dd>Connect campaign creative with optimization and shopper response.</dd></div>
          </dl>
        </div>
      </Chapter>

      <Chapter id="inventory-planning" title="Plan the requirements before choosing a channel">
        <div className={styles.split}>
          <div className={styles.stack}>
            <p>Bring your inventory priorities and current advertising setup to the consultation. Compare Meta, Google or a combined approach around the shopper moments you want to reach.</p>
            <Link className={styles.textLink} href="/contact">Talk through inventory advertising <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.stack}>
            <h3>Confirm the practical details</h3>
            <ul className={styles.list}>
              <li>The inventory data and feed requirements for your store.</li>
              <li>The accounts, access and setup work involved.</li>
              <li>The campaign geography, media spend and service scope.</li>
            </ul>
            <p>Review compatibility and setup needs for your dealership before committing to a plan.</p>
          </div>
        </div>
      </Chapter>

      <RelatedLinks title="Build around your inventory" links={[
        { href: "/services/automotive-ad-creative", label: "Automotive ad creative" },
        { href: "/services/lead-generation", label: "Lead generation" },
        { href: "/pricing", label: "Service Options" },
      ]} />
    </ServicePage>
  );
}

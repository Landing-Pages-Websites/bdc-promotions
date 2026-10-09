import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

import { JsonLd } from "@/components/schema/JsonLd";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { InteriorChapter, InteriorLinks, InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import homeContent from "@/content/pages/home.json";
import styles from "./about.module.css";
import { siteConfig } from "@/site.config";

const pageTitle = "About BDC Promotions | Automotive Marketing Specialists";
const pageDescription =
  "Learn how BDC Promotions helps dealerships create more conversations, appointments, and sales opportunities through focused automotive marketing.";
const organizationId = "https://bdcpromotions.com/#organization";
const aboutPageUrl = "https://bdcpromotions.com/about/";
const aboutPageId = "https://bdcpromotions.com/about/#about";
const publicPhone = "352-207-1074";

export const metadata: Metadata = {
  ...buildMetadata({
    title: pageTitle,
    description: pageDescription,
    siteName: siteConfig.businessName,
    path: "/about/",
    robots: {
      index: true,
      follow: true,
    },
  }),
  title: { absolute: pageTitle },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": aboutPageId,
      url: aboutPageUrl,
      name: "About BDC Promotions",
      description: pageDescription,
      mainEntity: { "@id": organizationId },
    },
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "BDC Promotions",
      legalName: "BDC Promotions, Inc.",
      description:
        "Automotive marketing services designed to help dealerships generate more conversations, more appointments, and more sales opportunities.",
      url: absoluteUrl("/"),
      telephone: publicPhone,
      sameAs: ["https://www.linkedin.com/company/bdcpromotions"],
    },
  ],
};

export default function AboutPage(): ReactElement {
  return <div className={styles.surface}><InteriorPage path="/about" title="About BDC Promotions"
    intro="Automotive marketing focused on the path to the showroom. We help dealerships connect advertising, shopper conversations and appointment opportunities."
    chapters={[{ href: "#dealership-focus", label: "Who we serve" }, { href: "#working-principles", label: "Our principles" }, { href: "#connected-support", label: "How the work connects" }]}
    contactTitle="Let’s talk about your dealership"
    contactCopy="Bring your store’s priorities and the parts of your marketing or follow-up process that need support. Start a conversation about the right service mix."
    contactLabel="Contact BDC Promotions">
    <JsonLd data={aboutSchema} />
    <InteriorChapter id="dealership-focus" title="Built around dealership conversations">
      <div className={styles.identity}>
        <div><p>BDC Promotions, Inc. provides automotive marketing and customer engagement services for franchise and established independent dealerships.</p><a className={shared.textLink} href="https://www.linkedin.com/company/bdcpromotions">BDC Promotions on LinkedIn ↗</a></div>
        <div><p>We work with dealership owners, sales teams, marketing managers and BDC teams. Their responsibilities meet at the same point: a shopper who has shown interest and needs a useful next conversation.</p><p>Advertising gives that shopper a reason to respond. Lead engagement helps keep the conversation moving. Appointment support connects that interest with an opportunity for the dealership’s sales team.</p></div>
      </div>
    </InteriorChapter>
    <InteriorChapter id="working-principles" title="Fast. Focused. Social. Results.">
      <p className={shared.chapterIntro}>Four principles keep the work tied to the dealership and the shopper.</p>
      <dl className={styles.principles}>
        {homeContent.values.items.map(item => <div key={item.id}><dt>{item.title}</dt><dd>{item.description}.</dd></div>)}
      </dl>
    </InteriorChapter>
    <InteriorChapter id="connected-support" title="From creative to the next conversation" dark>
      <div className={shared.split}>
        <div className={shared.stack}><h3>A message built for automotive</h3><p>Static and video creative give your vehicles, offers and events a clear message. Paid social campaigns and ad optimization connect that message with shoppers and their response.</p><p>The work starts with your store: what you want to promote, who you want to reach and what your team needs from the campaign.</p><Link className={shared.textLink} href="/work">Inspect automotive advertising examples →</Link></div>
        <div className={shared.stack}><h3>Support after the response</h3><p>Facebook Messenger response, BDC staff and AI-supported nurturing help continue shopper conversations. Appointment setting gives an interested shopper a next step with a scheduled day and time.</p><p>Choose individual services or connect the support around your team. Use the process discussion to agree responsibilities and how appointment details reach the dealership.</p><Link className={shared.textLink} href="/process">See how the process works →</Link></div>
      </div>
    </InteriorChapter>
    <InteriorLinks title="Get to know the work" links={[{ href: "/services", label: "Explore the services" }, { href: "/blog", label: "Read automotive insights" }]} />
  </InteriorPage></div>;
}

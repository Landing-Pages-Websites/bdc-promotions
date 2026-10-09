import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InteriorChapter, InteriorLinks, InteriorPage } from "@/components/signal-lane/InteriorPage";
import shared from "@/components/signal-lane/interior-page.module.css";
import { buildMetadata } from "@/lib/seo";
import styles from "./work.module.css";

export const metadata: Metadata = buildMetadata({
  title: "Automotive Advertising Work",
  description: "Inspect supplied automotive advertising examples: static event creative, luxury campaign artwork, a video storyboard, Meta inventory ads and Google Vehicle Listing Ads.",
  path: "/work",
});

function WorkExample({ file, width, height, alt, caption, eager = false }: {
  file: string; width: number; height: number; alt: string; caption: string; eager?: boolean;
}) {
  const src = `/images/signal-work/${file}.png`;
  return <figure className={styles.example}>
    <Image src={src} width={width} height={height} alt={alt} unoptimized loading={eager ? "eager" : "lazy"} />
    <figcaption><p>{caption}</p><a href={src}>Open full-size example <span aria-hidden="true">↗</span></a></figcaption>
  </figure>;
}

export default function WorkPage() {
  return <InteriorPage path="/work" title="Automotive advertising work"
    intro="Explore supplied static creative, a luxury video storyboard and inventory advertising examples. These historical examples retain their original offers and attribution; offers and vehicle prices shown are not current offers or BDC Promotions service prices."
    chapters={[{ href: "#event-creative", label: "Static & event creative" }, { href: "#luxury-creative", label: "Luxury & storyboard" }, { href: "#inventory-examples", label: "Meta & Google inventory" }]}
    contactTitle="What should your next campaign say?"
    contactCopy="Bring your vehicles, offers and creative priorities. Talk through the formats and advertising support that fit your store."
    contactLabel="Discuss your campaign">
    <InteriorChapter id="event-creative" title="A clear event message">
      <p className={shared.chapterIntro}>Vehicle lineups, event headlines and a direct invitation to message the store.</p>
      <div className={styles.eventPair}>
        <WorkExample file="hero-used-car-event" width={1086} height={1448} alt="Historical used-car sales event creative with a vehicle lineup and voucher message" caption="Used-car sales event — a static promotion built around the event headline and vehicle lineup." eager />
        <WorkExample file="hero-wholesale-public" width={1122} height={1402} alt="Historical wholesale-to-the-public creative showing vehicles outside a dealership" caption="Wholesale-to-the-public promotion — storefront, vehicles and offer messaging in one composition." eager />
      </div>
      <div className={styles.repoExample}>
        <WorkExample file="growth-repo-sale" width={1080} height={1080} alt="Historical repossession-sale static ad with three vehicles and original offer copy" caption="Repossession-sale event — square static creative with the original vehicle offer and response prompt." />
        <div className={shared.stack}><h3>Build around the campaign’s message</h3><p>This square event example brings the vehicle selection and promotional message together in a single static ad.</p><Link className={shared.textLink} href="/services/automotive-ad-creative">Explore automotive ad creative →</Link></div>
      </div>
    </InteriorChapter>
    <InteriorChapter id="luxury-creative" title="Luxury campaign & video planning" dark>
      <p className={shared.chapterIntro}>A static luxury promotion alongside a supplied storyboard showing planned scenes and voiceover notes.</p>
      <div className={styles.luxuryPair}>
        <WorkExample file="work-luxury-campaign" width={1122} height={1402} alt="Historical luxury automotive campaign artwork with a dealership and three vehicles" caption="Luxury campaign artwork — vehicle and storefront imagery with the original promotional message." />
        <WorkExample file="work-luxury-storyboard" width={426} height={640} alt="Supplied luxury automotive storyboard with five scenes and original production attribution" caption="Luxury video storyboard — a still planning document with scene direction and original attribution. Open the full-size example to inspect the notes." />
      </div>
    </InteriorChapter>
    <InteriorChapter id="inventory-examples" title="Inventory in the feed & in search">
      <p className={shared.chapterIntro}>Two supplied examples show how vehicles appear in Meta inventory advertising and Google Vehicle Listing Ads.</p>
      <div className={styles.inventoryExamples}>
        <div><h3>Meta inventory advertising</h3><WorkExample file="work-inventory-ad" width={1090} height={596} alt="Supplied Meta inventory ad example showing truck listings in a social feed" caption="Meta inventory example — vehicle cards displayed with their original listing details." /></div>
        <div><h3>Google Vehicle Listing Ads</h3><WorkExample file="work-google-vla" width={963} height={509} alt="Supplied Google search example with sponsored vehicle listings and original vehicle prices" caption="Google Vehicle Listing Ads example — sponsored vehicles shown within a vehicle search." /></div>
      </div>
      <Link className={shared.textLink} href="/services/inventory-advertising">Compare inventory advertising channels →</Link>
    </InteriorChapter>
    <InteriorLinks title="Continue your review" links={[{ href: "/testimonials", label: "Watch Curt’s testimonial" }, { href: "/pricing", label: "Discuss service options" }]} />
  </InteriorPage>;
}

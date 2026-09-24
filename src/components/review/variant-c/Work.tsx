import Image from "next/image";
import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./work.module.css";

const dir = "/images/design/shared";

/* Client creatives: unoptimized (served as supplied), each capped in CSS at or below native ÷ 2.
   Captions: the ad's own headline (or its verified format name) + the verified category · a format fact. */
const gallery = [
  {
    kind: `${s.p} ${s.uc}`,
    src: `${dir}/work-used-car-event.webp`,
    w: 1086,
    h: 1448,
    alt: "Event ad creative headlined “Massive Used Car Sales Event”, showing a line of SUVs and a sedan on a red background",
    title: "Massive Used Car Sales Event",
    meta: "Event campaigns · 3:4",
  },
  {
    kind: s.p,
    src: `${dir}/work-wholesale-public.webp`,
    w: 1122,
    h: 1402,
    alt: "Event ad creative headlined “Wholesale to the Public”, showing four vehicles in front of a dealership at sunset",
    title: "Wholesale to the Public",
    meta: "Event campaigns · 4:5",
  },
  {
    kind: `${s.l} ${s.meta}`,
    src: `${dir}/work-meta-inventory.webp`,
    w: 1090,
    h: 596,
    alt: "Meta inventory carousel ad showing pre-owned pickup trucks in a phone feed",
    title: "Meta inventory ad",
    meta: "Inventory advertising · Carousel",
  },
  {
    kind: `${s.l} ${s.vla}`,
    src: `${dir}/work-google-vla.webp`,
    w: 963,
    h: 509,
    alt: "Google Vehicle Listing Ads showing new pickup trucks in a sponsored search carousel",
    title: "Google Vehicle Listing Ads",
    meta: "New-car lead generation · Search listing",
  },
] as const;

/* the ad's own printed headline (VERIFIED-COPY §4), its verified category and type, and a format fact */
const specRows = [
  ["Headline", "We Make Luxury Affordable"],
  ["Category", "Event campaigns"],
  ["Type", "Promotional ad creative"],
  ["Format", "4:5"],
] as const;

type Shot = (typeof gallery)[number];

function Plate({ g }: { g: Shot }): ReactElement {
  return (
    <figure className={`${s.shot} ${g.kind}`}>
      <div className={s.well}>
        <Image src={g.src} alt={g.alt} width={g.w} height={g.h} unoptimized />
      </div>
      <figcaption>
        <span className={s.capT}>{g.title}</span>
        <span className={s.capM}>{g.meta}</span>
      </figcaption>
    </figure>
  );
}

export function FeaturedWork(): ReactElement {
  return (
    <section className={b.section} id="work" aria-labelledby="work-h">
      <div className={b.wrap}>
        <div className={b.head}>
          <div className={b.hMain}>
            <p className={b.label}>The work is the proof</p>
            <h2 id="work-h">Automotive creative built for the real feed</h2>
          </div>
          <div className={b.hSide}>
            <p className={b.lead}>
              Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories,
              luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads.
            </p>
          </div>
        </div>
        <div className={s.feature}>
          <figure className={s.plate}>
            <Image
              src={`${dir}/work-luxury-campaign.webp`}
              alt="Luxury campaign ad creative headlined “We Make Luxury Affordable”, showing three luxury vehicles in front of a dealership at sunset"
              width={1122}
              height={1402}
              unoptimized
            />
          </figure>
          {/* spec sheet (fix r2): the title on the plate's top edge, the facts on its bottom edge */}
          <div className={s.spec}>
            <div className={s.specTop}>
              <h3 className={b.t3}>Luxury campaign</h3>
              <p className={b.lead}>
                Campaign style, offer messaging, and luxury positioning used to drive attention and start conversations.
              </p>
            </div>
            <dl>
              {specRows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Gallery(): ReactElement {
  return (
    <section className={`${b.section} ${b.ruled} ${b.sheetEnd}`} id="gallery" aria-labelledby="gal-h">
      {/* one visible head for the whole Work area (fix r1): the grid follows the featured case under the rule */}
      <h3 id="gal-h" className={b.sr}>
        More automotive ad creative
      </h3>
      <div className={b.wrap}>
        <div className={s.gallery}>
          {gallery.slice(0, 2).map((g) => (
            <Plate key={g.src} g={g} />
          ))}
          {/* the two landscape placements share one full-width card, each at a crisp small size (fix r2) */}
          <div className={s.pair}>
            {gallery.slice(2).map((g) => (
              <Plate key={g.src} g={g} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

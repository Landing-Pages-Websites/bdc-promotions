import Image from "next/image";
import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./work.module.css";

const DIR = "/images/design/shared";

// Client creatives: never recoloured, never re-encoded (unoptimized), never wider than native ÷ 2.
const GALLERY = [
  {
    cls: s.fEvent,
    src: `${DIR}/work-used-car-event.webp`,
    w: 1086,
    h: 1448,
    alt: "Event ad headlined “Massive Used Car Sales Event”, showing a row of used vehicles on a red background.",
    kind: "Event campaigns",
    title: "Massive Used Car Sales Event",
  },
  {
    cls: s.fWhole,
    src: `${DIR}/work-wholesale-public.webp`,
    w: 1122,
    h: 1402,
    alt: "Event ad headlined “Wholesale to the Public”, showing vehicles lined up outside a dealership under a sunset sky.",
    kind: "Event campaigns",
    title: "Wholesale to the Public",
  },
  {
    cls: s.fMeta,
    src: `${DIR}/work-meta-inventory.webp`,
    w: 1090,
    h: 596,
    alt: "Meta inventory ad shown on a phone: a swipeable carousel of pre-owned pickup trucks.",
    kind: "Inventory advertising",
    title: "Meta inventory ad",
  },
  {
    cls: s.fVla,
    src: `${DIR}/work-google-vla.webp`,
    w: 963,
    h: 509,
    alt: "Google Vehicle Listing Ads: a sponsored row of new pickup trucks in search results.",
    kind: "New car lead gen",
    title: "Google Vehicle Listing Ads",
  },
];

// 04 featured work · 05 gallery, the page's one ink band. Every piece sits centred on one plate
// (ink-2, the same padding on every side), at or below its crisp width. A gallery caption sits
// directly under its ad, on the ad's left edge: the figure is exactly as wide as the ad.
export function Work(): ReactElement {
  return (
    <>
      <section className={b.sec} id="work" aria-labelledby="work-h">
        <div className={b.wrap}>
          <div className={`${b.g12} ${b.head}`}>
            <div className={b.headMain}>
              <p className={b.label}>The work is the proof</p>
              <h2 id="work-h" className={b.d2}>
                Automotive creative built for the real feed
              </h2>
            </div>
            <p className={b.headAside}>
              Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories, luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads.
            </p>
          </div>
          <article className={`${b.g12} ${s.feat}`} aria-labelledby="feat-h">
            <div className={s.well}>
              <Image
                src={`${DIR}/work-luxury-campaign.webp`}
                width={1122}
                height={1402}
                unoptimized
                alt="Luxury campaign ad headlined “We Make Luxury Affordable”, showing three luxury vehicles parked in front of a dealership at sunset."
              />
            </div>
            <div className={s.featCopy}>
              <p className={s.kicker}>Luxury campaign</p>
              <h3 id="feat-h" className={b.d3}>
                “We Make Luxury Affordable”
              </h3>
              <p className={`${b.lead} ${s.featLead}`}>
                Campaign style, offer messaging, and luxury positioning used to drive attention and start conversations.
              </p>
              <dl className={s.spec}>
                <div>
                  <dt>Category</dt>
                  <dd>Event campaigns</dd>
                </div>
                <div>
                  <dt>Piece</dt>
                  <dd>Promotional ad creative</dd>
                </div>
              </dl>
            </div>
          </article>
        </div>
      </section>

      <section className={`${b.sec} ${s.galSec}`} id="gallery" aria-label="More automotive ad creative">
        <div className={`${b.wrap} ${s.tray}`}>
          {GALLERY.map((g) => (
            <div key={g.title} className={s.plate}>
              <figure className={`${s.piece} ${g.cls}`}>
                <Image src={g.src} width={g.w} height={g.h} unoptimized alt={g.alt} />
                <figcaption>
                  <span className={s.capK}>{g.kind}</span>
                  <span className={s.capT}>{g.title}</span>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

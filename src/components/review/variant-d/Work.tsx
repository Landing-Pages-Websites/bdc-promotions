import Image from "next/image";
import type { ReactElement } from "react";
import b from "./base.module.css";
import s from "./work.module.css";

const dir = "/images/design/shared/";

type Creative = { file: string; w: number; h: number; fmt: string; alt: string };

/* The feed frame: avatar disc and "Sponsored" on top, the format fact below. No invented page name or
   CTA text. Creatives are served as-is (unoptimized) and never rendered wider than half their native width;
   each ad sits centred in a plate that fills its column (work.module.css). */
function Post({ c }: { c: Creative }): ReactElement {
  return (
    <>
      <div className={s.postTop} aria-hidden="true">
        <span className={s.av}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10v9h16v-9M3 10l1.6-5h14.8L21 10zM10 19v-5h4v5" /></svg>
        </span>
        <span className={s.who}>Sponsored</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
      </div>
      <Image src={dir + c.file} alt={c.alt} width={c.w} height={c.h} unoptimized />
      <div className={s.postCta} aria-hidden="true">
        <span className={s.fmt}>{c.fmt} · Feed post</span>
      </div>
    </>
  );
}

const lux: Creative = { file: "work-luxury-campaign.webp", w: 1122, h: 1402, fmt: "4:5", alt: "Campaign creative headlined We Make Luxury Affordable, showing three luxury vehicles parked in front of a dealership at sunset" };

const tiles = [
  { cls: s.wEvent, title: "Massive used car sales event", c: { file: "work-used-car-event.webp", w: 1086, h: 1448, fmt: "3:4", alt: "Event ad creative headlined Massive Used Car Sales Event, showing four SUVs and a sedan on a red background" } },
  { cls: s.wWhole, title: "Wholesale to the public", c: { file: "work-wholesale-public.webp", w: 1122, h: 1402, fmt: "4:5", alt: "Event ad creative headlined Wholesale to the Public, showing four luxury vehicles in front of a dealership at sunset" } },
] as const;

const landscape = [
  { cls: s.wMeta, title: "Meta inventory ad", kind: "Inventory advertising", c: { file: "work-meta-inventory.webp", w: 1090, h: 596, alt: "Meta inventory ad shown as a carousel of pre-owned pickup trucks in a social feed on a phone" } },
  { cls: s.wVla, title: "Google Vehicle Listing Ads", kind: "New car lead gen", c: { file: "work-google-vla.webp", w: 963, h: 509, alt: "Google Vehicle Listing Ads shown as a row of new pickup truck listings in search results" } },
] as const;

/* One section, one head: the featured case, then the gallery 64px below it. */
export function Work(): ReactElement {
  return (
    <section className={`${b.loud} ${b.night}`} id="work" aria-labelledby="work-h">
      <div className={`${b.wrap} ${s.cq}`}>
        <div className={`${b.grid12} ${s.feat}`}>
          <div className={s.featHead}>
            <p className={b.label}>The work is the proof</p>
            <h2 className={`${b.h2} ${s.featH2}`} id="work-h">Automotive creative built for the real feed</h2>
            <p className={`${b.lede} ${s.featLede}`}>Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories, luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads.</p>
          </div>
          <div className={`${s.plate} ${s.featPlate}`}>
            <figure className={`${s.post} ${s.wLux}`}>
              <Post c={lux} />
            </figure>
          </div>
          <div className={s.case}>
            <h3 className={`${b.h3} ${s.caseH3}`}>“We make luxury affordable”</h3>
            <p className={s.kind}>Event campaigns / Promotional ad creative</p>
            <p className={`${b.body} ${s.caseBody}`}>Campaign style, offer messaging, and luxury positioning used to drive attention and start conversations.</p>
          </div>
        </div>
        <div className={s.gallery} id="gallery">
          <div className={s.tray} role="list" aria-label="More automotive ad creative">
            {tiles.map((t) => (
              <figure key={t.title} className={s.tile} role="listitem">
                <div className={s.plate}>
                  <div className={`${s.post} ${t.cls}`}><Post c={t.c} /></div>
                </div>
                <figcaption className={s.cap}><b>{t.title}</b><span>Promotional ad creative</span></figcaption>
              </figure>
            ))}
          </div>
          {/* the two landscape formats: the same two-panel grid as the event posts, captions under the panels */}
          <div className={s.duo} role="list" aria-label="Inventory and vehicle-listing formats">
            {landscape.map((t) => (
              <figure key={t.title} className={s.tile} role="listitem">
                <div className={s.plate}>
                  <div className={`${s.shot} ${t.cls}`}><Image src={dir + t.c.file} alt={t.c.alt} width={t.c.w} height={t.c.h} unoptimized /></div>
                </div>
                <figcaption className={s.cap}><b>{t.title}</b><span>{t.kind}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

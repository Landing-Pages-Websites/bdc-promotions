import Image from "next/image";
import type { CSSProperties, ReactElement } from "react";
import { ads, type AdKey } from "./ads";
import { Eyebrow } from "./Bits";
import ui from "./proof-wall.module.css";
import s from "./work.module.css";

/* Justified contact sheet, grouped by category: the category is printed once per group, and each ad is
   captioned with its own printed headline over a format fact. flex-grow = aspect ratio, so every image in
   a row shares one height and every piece is shown whole (no crop, no mat). The sheet opens on the pieces
   the fold does not show and closes on the event posters at 2–3× their fold size, so the repeat reads as
   a close look rather than a rerun. The lead luxury ad is not repeated: the fold shows it whole at 530px+. */
type Group = { label: string; items: readonly AdKey[] };

const rows: readonly (readonly Group[])[] = [
  [
    { label: "Video creative", items: ["storyboard"] },
    { label: "Inventory advertising", items: ["inventory"] },
  ],
  [{ label: "New car lead gen", items: ["vla"] }],
  [{ label: "Event campaigns · Promotional ad creative", items: ["usedCar", "wholesale", "repo"] }],
];

const ratio = (id: AdKey): number => ads[id].width / ads[id].height;

/* Widest render in px (1440 container, never above the file's own width) and the phone width, for `sizes` (V190). */
function sizesFor(group: Group, row: readonly Group[]): string {
  const total = row.reduce((sum, g) => sum + g.items.reduce((a, id) => a + ratio(id), 0), 0);
  const gaps = 24 * (row.reduce((n, g) => n + g.items.length, 0) - 1);
  const height = (1440 - gaps) / total;
  const widest = Math.ceil(Math.max(...group.items.map((id) => Math.min(ads[id].width, ratio(id) * height))));
  // ponytail: one phone width for every piece; a justified two-up piece is ~170px but a wrapped one runs 350px.
  return `(max-width: 760px) 350px, ${widest}px`;
}

/* A lone piece must grow by 1: a flex-grow below 1 would leave it short of its group's width.
   `--r` sets the phone flex-basis, so two-up rows justify to one height there too. */
function Piece({ id, sizes, solo }: { id: AdKey; sizes: string; solo: boolean }): ReactElement {
  const ad = ads[id];
  const style = { flexGrow: solo ? 1 : ratio(id), "--r": ratio(id), "--native": `${ad.width}px` } as CSSProperties;
  return (
    <figure className={s.piece} style={style}>
      <Image src={ad.src} width={ad.width} height={ad.height} alt={ad.alt} sizes={sizes} />
      <figcaption>
        {ad.headline}
        <span className={`${ui.label} ${s.spec}`}>{ad.spec}</span>
      </figcaption>
    </figure>
  );
}

export function Work(): ReactElement {
  return (
    <section className={s.work} id="work" aria-labelledby="c-work-title">
      <div className={ui.container}>
        <div className={ui.headRow}>
          <div className={ui.headMain}>
            <Eyebrow>The work is the proof</Eyebrow>
            <h2 id="c-work-title" className={ui.h2}>
              Automotive creative built for the real feed.
            </h2>
          </div>
          <div className={ui.headSide}>
            <p className={ui.lead}>
              Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories,
              luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads.
            </p>
          </div>
        </div>
        <div className={s.sheet}>
          {rows.map((row) => (
            <div key={row[0].label} className={s.sheetRow}>
              {row.map((group) => (
                <div
                  key={group.label}
                  className={`${s.group} ${row.length === 1 && group.items.length === 1 ? s.beside : ""}`}
                  style={{ flexGrow: group.items.reduce((a, id) => a + ratio(id), 0) }}
                >
                  <p className={`${ui.label} ${s.groupLabel}`}>{group.label}</p>
                  <div className={s.groupItems}>
                    {group.items.map((id) => (
                      <Piece key={id} id={id} sizes={sizesFor(group, row)} solo={group.items.length === 1} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

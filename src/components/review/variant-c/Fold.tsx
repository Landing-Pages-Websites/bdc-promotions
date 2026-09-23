import Image from "next/image";
import type { ReactElement } from "react";
import { ads, type AdKey } from "./ads";
import { Actions, Eyebrow, PriceSticker } from "./Bits";
import ui from "./proof-wall.module.css";
import s from "./fold.module.css";

/* The wall is one object on one top edge: the lead piece, shown whole and sized to the frame, and a
   narrow side column (the portrait window sticker over a stack of ads that runs off the fold's bottom
   edge). Only the stack is masked, and it carries no text, so no caption can ever sit in the fade.
   Every wall image is eager: a lazy image clipped by the stack's overflow never loads. The stack is
   hidden on phones, so its `sizes` there is the smallest candidate (a ~1KB request, not a full ad). */
const stack: readonly AdKey[] = ["usedCar", "wholesale", "repo"];

export function Fold(): ReactElement {
  const lead = ads.luxury;
  return (
    <section className={s.fold} aria-labelledby="c-title">
      <div className={s.foldCopy}>
        <Eyebrow>
          Automotive marketing /{" "}<span className={s.eyebrowTail}>creative to appointment</span>
        </Eyebrow>
        <h1 id="c-title" className={`${ui.h1} ${s.foldTitle}`}>
          Move more shoppers toward your showroom.
        </h1>
        <p className={s.foldLead}>
          BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and{" "}
          <span className={ui.nowrap}>AI-supported</span> nurturing to create more qualified sales opportunities.
        </p>
        <Actions className={s.foldActions} />
      </div>
      <div className={s.wall}>
        <figure className={s.lead}>
          <Image
            src={lead.src}
            width={lead.width}
            height={lead.height}
            alt={lead.alt}
            sizes="(max-width: 374px) 110px, (max-width: 760px) 170px, (max-width: 1199px) 560px, (max-width: 1600px) 620px, 780px"
            loading="eager"
            fetchPriority="high"
          />
          <figcaption className={ui.label}>Luxury campaign</figcaption>
        </figure>
        <div className={s.side}>
          <PriceSticker />
          <ul className={s.stack} aria-label="More automotive ad creative">
            {stack.map((id) => (
              <li key={id}>
                <Image
                  src={ads[id].src}
                  width={ads[id].width}
                  height={ads[id].height}
                  alt={ads[id].alt}
                  sizes="(max-width: 760px) 16px, (max-width: 1199px) 320px, 240px"
                  loading="eager"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

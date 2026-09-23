"use client";

import Image from "next/image";
import { useState, type ReactElement } from "react";
import { ArrowIcon } from "./JournalIcons";
import w from "./journal-work.module.css";
import s from "./journal-work-more.module.css";

const B = "/images/design/variant-b";

/* Supplied event creative not in image 2's composition, shown whole on request. */
const moreWork = [
  {
    src: `${B}/work-event-campaign.png`,
    width: 1122,
    height: 1402,
    label: "Wholesale to the Public",
    alt: "Customer-supplied Gen-X Motors event ad reading “Wholesale to the Public” with a $1,000 savings voucher and a message-or-comment call to action",
  },
  {
    src: `${B}/work-used-car-event.png`,
    width: 1086,
    height: 1448,
    label: "Massive Used Car Sales Event",
    alt: "Customer-supplied event ad reading “Massive Used Car Sales Event, Everything Must Go” with a $2,000 savings voucher",
  },
] as const;

/* "Explore the Work" discloses more supplied creative in the band; collapsed, the 1536 composition is unchanged. */
export function JournalWorkMore(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={s.explore}
        aria-expanded={open}
        aria-controls="b-work-more"
        onClick={() => setOpen((value) => !value)}
      >
        <span>Explore the Work</span>
        <ArrowIcon className={s.exploreArrow} />
      </button>
      {/* Images mount only when opened, so a collapsed panel requests nothing. */}
      <div id="b-work-more" className={s.more} hidden={!open}>
        {open &&
          moreWork.map((item) => (
            <figure key={item.src} className={s.moreItem}>
              <div className={s.moreFrame}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 1179px) 86vw, 24vw"
                />
                <span className={w.crop} aria-hidden="true" />
              </div>
              <figcaption>
                <strong>{item.label}</strong> customer-supplied source plate
              </figcaption>
            </figure>
          ))}
      </div>
    </>
  );
}

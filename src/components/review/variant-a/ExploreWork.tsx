"use client";

import Image from "next/image";
import { useState, type ReactElement } from "react";
import { ArrowIcon } from "./icons";
import styles from "./work.module.css";

const A = "/images/design/variant-a";

// The other supplied creatives, shown whole (uncropped) when the visitor asks for more work.
const moreWork = [
  {
    src: `${A}/hero-used-car-event.png`,
    width: 1086,
    height: 1448,
    label: "Massive Used Car Sales Event",
    alt: "Customer-supplied event ad reading “Massive Used Car Sales Event”",
  },
  {
    src: `${A}/hero-wholesale-public.png`,
    width: 1122,
    height: 1402,
    label: "Wholesale to the Public",
    alt: "Customer-supplied event ad reading “Wholesale to the Public”",
  },
  {
    src: `${A}/growth-repo-sale.png`,
    width: 1080,
    height: 1080,
    label: "Massive Repo Sale",
    alt: "Customer-supplied event ad reading “Massive Repo Sale”",
  },
] as const;

// "Explore the work" discloses the panel below the collage. Collapsed, the panel is empty and
// hidden, so the 1536 composition and the page height are unchanged and no image is requested.
export function ExploreWork(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.explore}
        aria-expanded={open}
        aria-controls="a-work-more"
        onClick={() => setOpen((value) => !value)}
      >
        <span>Explore the work</span>
        <ArrowIcon />
      </button>
      <div id="a-work-more" className={styles.more} hidden={!open}>
        {open &&
          moreWork.map((item) => (
            <figure key={item.src} className={styles.moreItem}>
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(max-width: 1179px) min(90vw, 720px), 28vw"
              />
              <figcaption className={styles.moreLabel}>{item.label}</figcaption>
            </figure>
          ))}
      </div>
    </>
  );
}

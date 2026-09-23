import Image from "next/image";
import type { ReactElement } from "react";
import { JournalWorkMore } from "./JournalWorkMore";
import s from "./journal-work.module.css";

const B = "/images/design/variant-b";
/* Category labels link to the plate that shows that kind of work. */
const tabs = [
  ["New Car", "Lead Gen", "b-work-google"],
  ["Event", "Campaigns", "b-work-event"],
  ["Video", "Creative", "b-work-video"],
  ["Inventory", "Advertising", "b-work-inventory"],
] as const;

/* "‑" in compound words below is U+2011 (non-breaking hyphen): "follow‑up" never splits as "follow- / up" on phones. */
export function WorkInMotion(): ReactElement {
  return (
    <section className={s.work} id="b-work" aria-labelledby="b-work-title">
      <div className={s.wrap}>
        <p className={s.strip} aria-hidden="true">
          <span>01</span>
        </p>
        <p className={s.label}>The Work Is the Proof</p>
        <h2 id="b-work-title" className={s.title}>
          <span>Automotive Creative</span> <span>Built for the Real Feed</span>
        </h2>
        <p className={s.body}>
          <span>Inspect the range: new‑car lead generation, event advertising,</span>{" "}
          <span>testimonial videos, employee stories, luxury films, viral concepts,</span>{" "}
          <span>Meta inventory ads, and Google Vehicle Listing Ads.</span>
        </p>
        <ul className={s.tabs} aria-label="Creative categories">
          {tabs.map(([a, b, id]) => (
            <li key={a}>
              <a href={`#${id}`}>
                <span>{a}</span> <span>{b}</span>
              </a>
            </li>
          ))}
        </ul>
        <figure className={`${s.plate} ${s.story}`} id="b-work-video">
          <div className={s.frame}>
            <Image
              src={`${B}/work-luxury-storyboard.png`}
              alt="Customer-supplied Gen X Motors 30-second luxury TV storyboard: five scenes with visual and voice-over notes"
              fill
              sizes="(max-width: 1179px) 86vw, 24vw"
            />
            <span className={s.crop} aria-hidden="true" />
          </div>
          <figcaption>customer-supplied source plate</figcaption>
        </figure>
        <figure className={`${s.plate} ${s.event}`} id="b-work-event">
          <div className={s.frame}>
            <Image
              src={`${B}/hero-luxury-campaign.png`}
              alt="Customer-supplied Gen-X Motors “We Make Luxury Affordable” event creative with a $1,000 savings voucher and a message-or-comment call to action"
              fill
              sizes="(max-width: 1179px) 86vw, 22vw"
            />
            <span className={s.crop} aria-hidden="true" />
          </div>
          <figcaption>customer-supplied source plate</figcaption>
        </figure>
        <figure className={`${s.plate} ${s.inventory}`} id="b-work-inventory">
          <div className={s.frame}>
            <Image
              src={`${B}/work-inventory-ad.png`}
              alt="Customer-supplied Meta inventory ad for Hub City Ford: a phone showing a carousel of pre-owned trucks on a blue field"
              fill
              sizes="(max-width: 1179px) 92vw, 29vw"
            />
            <span className={s.crop} aria-hidden="true" />
          </div>
          <figcaption>inventory advertising source</figcaption>
        </figure>
        <figure className={`${s.plate} ${s.google}`} id="b-work-google">
          <div className={s.frame}>
            <div className={s.googleShot}>
              <Image
                src={`${B}/work-google-vla.png`}
                alt="Customer-supplied Google Vehicle Listing Ads results for new 2025 Chevrolet Silverado trucks for sale in the Murphy, NC area"
                fill
                sizes="(max-width: 1179px) 92vw, 29vw"
              />
            </div>
            <span className={s.crop} aria-hidden="true" />
          </div>
          <figcaption>Google Vehicle Listing Ads source</figcaption>
        </figure>
        <JournalWorkMore />
      </div>
    </section>
  );
}

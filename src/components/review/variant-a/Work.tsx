import Image from "next/image";
import type { ReactElement } from "react";
import { ExploreWork } from "./ExploreWork";
import { Lines } from "./Lines";
import styles from "./work.module.css";

const A = "/images/design/variant-a";

function WorkRoutes(): ReactElement {
  const cyan = "#38f4e7";
  return (
    <svg className={styles.routes} viewBox="0 0 1536 862" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M51.5 0V275Q51.5 287.5 64 287.5H152" fill="none" stroke={cyan} strokeWidth="3" />
      <rect x="47" y="45" width="10" height="10" fill="#01f5e0" />
      <path d="M665 118.5H654.5V152" fill="none" stroke={cyan} strokeWidth="1.6" />
      <path d="M1107 120H1047.5V788.5H538" fill="none" stroke={cyan} strokeWidth="1.6" />
      <path d="M1047.5 466H1060" fill="none" stroke={cyan} strokeWidth="1.6" />
      <path d="M1047.5 788.5H1100" fill="none" stroke={cyan} strokeWidth="2.4" />
      <rect x="152" y="281" width="13" height="13" fill="#01f5e0" />
      <rect x="665" y="113" width="11" height="11" fill="#01f5e0" />
      <rect x="1107" y="114" width="12" height="12" fill="#01f5e0" />
      <rect x="1060" y="460" width="11" height="11" fill="#01f5e0" />
      <rect x="1100" y="783" width="11" height="11" fill="#01f5e0" />
    </svg>
  );
}

type PlateProps = {
  className: string;
  title: string;
  kind: string;
  children: ReactElement;
};

function Plate({ className, title, kind, children }: PlateProps): ReactElement {
  return (
    <figure className={className}>
      <figcaption className={styles.label}>
        <span className={styles.labelTitle}>{title}</span>
        <span className={styles.labelKind}>{kind}</span>
      </figcaption>
      <div className={styles.media}>{children}</div>
    </figure>
  );
}

export function Work(): ReactElement {
  return (
    <section className={styles.work} id="work" aria-labelledby="a-work-title">
      <div className={styles.frame}>
        <WorkRoutes />
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowNum}>04</span>
          <span>The work is the proof</span>
        </p>
        <h2 id="a-work-title" className={styles.title}>
          <Lines lines={["Automotive creative", "built for the real feed"]} />
        </h2>
        <p className={styles.body}>
          <Lines
            lines={[
              "Inspect the range: new-car lead generation, event advertising,",
              "testimonial videos, employee stories, luxury films, viral concepts,",
              "Meta inventory ads, and Google Vehicle Listing Ads.",
            ]}
          />
        </p>
        <Plate className={styles.story} title="Video creative" kind="Luxury storyboard">
          <Image
            src={`${A}/work-luxury-storyboard-crop.png`}
            alt="Customer-supplied five-scene luxury video storyboard for a dealership commercial"
            width={426}
            height={592}
            sizes="(max-width: 1179px) min(90vw, 720px), 26vw"
          />
        </Plate>
        <Plate className={styles.event} title="Event campaigns" kind="Promotional ad creative">
          <Image
            src={`${A}/work-luxury-campaign.png`}
            alt="Customer-supplied We Make Luxury Affordable event campaign with a $1,000 savings voucher"
            width={1122}
            height={1402}
            sizes="(max-width: 1179px) min(90vw, 720px), 27vw"
          />
        </Plate>
        <Plate className={styles.inventory} title="Inventory advertising" kind="Meta inventory ad">
          <Image
            src={`${A}/work-inventory-ad-navy.png`}
            alt="Customer-supplied Meta inventory ad showing a pre-owned truck carousel on a phone"
            width={1090}
            height={596}
            sizes="(max-width: 1179px) min(90vw, 720px), 27vw"
          />
        </Plate>
        <Plate className={styles.google} title="New car lead gen" kind="Google vehicle listing ads">
          <Image
            src={`${A}/work-google-vla-crop.png`}
            alt="Customer-supplied Google Vehicle Listing Ads results for new Chevrolet Silverado trucks"
            width={940}
            height={396}
            sizes="(max-width: 1179px) min(90vw, 720px), 28vw"
          />
        </Plate>
      </div>
      <ExploreWork />
    </section>
  );
}

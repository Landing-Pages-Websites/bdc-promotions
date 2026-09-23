import Image from "next/image";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import { ArrowIcon, PhoneOutlineIcon, TargetIcon } from "./icons";
import { Lines } from "./Lines";
import styles from "./hero.module.css";

const A = "/images/design/variant-a";

function HeroRoutes(): ReactElement {
  return (
    <svg className={styles.routes} viewBox="0 0 1536 862" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect x="496" y="479" width="14" height="14" fill="#01f5e0" />
      <path d="M510 486H576Q588 486 588 498V593Q588 605 600 605H690" fill="none" stroke="#01f5e0" strokeWidth="2" />
      <path d="M708 780H752Q764 780 764 792V813Q764 825 776 825H1502" fill="none" stroke="#01f5e0" strokeWidth="2" />
      <path d="M1499 818 1512 825 1499 832Z" fill="#01f5e0" />
    </svg>
  );
}

export function Hero(): ReactElement {
  return (
    <section className={styles.hero} aria-labelledby="a-hero-title">
      <div className={styles.frame}>
        <HeroRoutes />
        <div className={styles.slab} aria-hidden="true" />
        <figure className={styles.repoPlate}>
          <Image
            src={`${A}/growth-repo-sale.png`}
            alt="Customer-supplied Massive Repo Sale campaign creative with $0 down offer"
            width={1080}
            height={1080}
            sizes="(max-width: 1179px) min(60vw, 720px), 26vw"
          />
        </figure>
        <figure className={styles.frontPlate}>
          <Image
            src={`${A}/work-luxury-campaign.png`}
            alt="Customer-supplied We Make Luxury Affordable dealership campaign with a $1,000 savings voucher"
            width={1122}
            height={1402}
            preload
            sizes="(max-width: 1179px) min(80vw, 720px), 40vw"
          />
        </figure>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowNode} aria-hidden="true" />
            <span className={styles.eyebrowLine}>Automotive marketing /</span>{" "}
            <span className={styles.eyebrowLine}>Creative to appointment</span>
          </p>
          <h1 id="a-hero-title" className={styles.title}>
            <Lines lines={["Move more", "shoppers", "toward your", "showroom"]} />
          </h1>
          <p className={styles.body}>
            <Lines
              lines={[
                "BDC Promotions combines automotive ad creative,",
                "campaign optimization, BDC follow\u2011up, and",
                "AI\u2011supported nurturing to create more qualified",
                "sales opportunities.",
              ]}
            />
          </p>
          <div className={styles.proofBox}>
            <span className={styles.proofIcon}>
              <TargetIcon />
            </span>
            <p>
              <span className={styles.proofCyan}>Real automotive creative.</span>
              <span className={styles.proofCyan}>{"Real follow\u2011up."}</span>
              <span>A clearer path to appointments.</span>
            </p>
          </div>
          <a className={styles.audit} href={auditHref}>
            <span>
              <Lines lines={["Get a free dealership", "marketing audit"]} />
            </span>
            <span className={styles.iconBox}>
              <ArrowIcon />
            </span>
          </a>
          <a className={styles.call} href={phoneHref}>
            <span>Call {phoneDisplay}</span>
            <span className={styles.iconBox}>
              <PhoneOutlineIcon />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

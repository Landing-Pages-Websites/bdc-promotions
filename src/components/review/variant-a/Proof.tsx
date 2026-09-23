import Image from "next/image";
import type { ReactElement } from "react";
import { DocumentCheckIcon, LongArrowIcon, ProhibitionIcon, ShieldCheckIcon } from "./icons";
import { Lines } from "./Lines";
import styles from "./proof.module.css";

const rules = [
  { Icon: ShieldCheckIcon, lines: ["Show only customer-", "approved work and", "attribution"] },
  { Icon: DocumentCheckIcon, lines: ["Use testimonial video", "only after transcript", "and publication approval"] },
  { Icon: ProhibitionIcon, lines: ["Never imply guaranteed", "lead volume, CPL, sales,", "ROAS, or show rate"] },
] as const;

function ProofRoutes(): ReactElement {
  return (
    <svg className={styles.routes} viewBox="0 0 1536 862" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <circle cx="66" cy="60" r="5" fill="#01f5e0" />
      <path d="M71 60H155" stroke="#98afcd" strokeWidth="1" />
      <path d="M66 75V708Q66 718 76 718H761" fill="none" stroke="#7f95bd" strokeWidth="1.3" />
      <circle cx="766" cy="718" r="5" fill="#01f5e0" />
      <path d="M766 723V746M766 800V832" stroke="#0563fc" strokeWidth="1.5" />
      <path d="M759.5 825.5 766 832.5 772.5 825.5" fill="none" stroke="#0563fc" strokeWidth="1.5" />
    </svg>
  );
}

export function Proof(): ReactElement {
  return (
    <section className={styles.proof} aria-labelledby="a-proof-title">
      <div className={styles.frame}>
        <ProofRoutes />
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowNum}>05</span>
          <span>Proof with standards</span>
        </p>
        <h2 id="a-proof-title" className={styles.title}>
          <Lines lines={["Proof you can inspect.", "Promises you can trust."]} />
        </h2>
        <ul className={styles.rules}>
          {rules.map(({ Icon, lines }) => (
            <li key={lines[0]}>
              <Icon className={styles.ruleIcon} />
              <p>
                <Lines lines={lines} />
              </p>
            </li>
          ))}
        </ul>
        <p className={styles.positionLabel}>Automotive-specialist positioning</p>
        <p className={styles.positionBody}>
          <Lines
            lines={[
              "BDC Promotions is built around dealership creative, customer",
              "engagement, and the operating path from campaign response",
              "to showroom opportunity.",
            ]}
          />
        </p>
        <figure className={styles.photo}>
          <Image
            src="/images/design/variant-a/proof-headlight.jpg"
            alt=""
            width={1122}
            height={982}
            sizes="(max-width: 1179px) min(100vw, 860px), 50vw"
          />
        </figure>
        <a className={styles.process} href="#growth">
          <span>See how the process works</span>
          <LongArrowIcon />
        </a>
      </div>
    </section>
  );
}

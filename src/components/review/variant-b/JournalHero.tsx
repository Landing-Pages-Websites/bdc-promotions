import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { auditHref, phoneDisplay, phoneHref } from "../content";
import { ArrowIcon, CheckCircleIcon, PhoneIcon } from "./JournalIcons";
import { JournalNavMenu } from "./JournalNavMenu";
import n from "./journal-nav.module.css";
import s from "./journal-hero.module.css";

export function JournalHeader(): ReactElement {
  return (
    <header className={n.nav}>
      <div className={n.navWrap}>
        <Link href="/" className={n.logo} aria-label="BDC Promotions home">
          <Image src="/images/design/shared/bdc-logo-2026.png" alt="" width={1254} height={749} preload sizes="110px" />
        </Link>
        <JournalNavMenu />
        <span className={n.navRule} aria-hidden="true" />
        <p className={n.editors}>Dealership Growth Editors</p>
      </div>
    </header>
  );
}

/* "‑" in compound words below is U+2011 (non-breaking hyphen): "follow‑up" never splits as "follow- / up" on phones. */
export function ShowroomMomentum(): ReactElement {
  return (
    <section className={s.hero} aria-labelledby="b-hero-title">
      <div className={s.wrap}>
        <h1 id="b-hero-title" className={s.title}>
          <span>Move More</span> <span>Shoppers Toward</span> <span>Your Showroom</span>
        </h1>
        <span className={s.titleRule} aria-hidden="true" />
        <p className={s.lede}>
          <span>BDC Promotions combines automotive</span> <span>ad creative, campaign optimization, BDC</span>{" "}
          <span>follow‑up, and AI‑supported nurturing</span> <span>to create more qualified sales opportunities.</span>
        </p>
        <div className={s.proof}>
          <CheckCircleIcon className={s.proofIcon} />
          <p>
            <span>Real automotive creative.</span> <span>Real follow‑up.</span> <span>A clearer path to appointments.</span>
          </p>
        </div>
        <div className={s.actions}>
          <span className={s.folio} aria-hidden="true">
            01
          </span>
          <a className={s.primary} href={auditHref}>
            Get a Free Dealership Marketing Audit <ArrowIcon className={s.arrow} />
          </a>
          <a className={s.phone} href={phoneHref}>
            <PhoneIcon className={s.phoneIcon} /> Call {phoneDisplay}
          </a>
        </div>
        <figure className={s.plate}>
          <div className={s.plateImage}>
            <Image
              src="/images/design/variant-b/hero-luxury-campaign.png"
              alt="Customer-supplied Gen-X Motors campaign: gold LUXURY AFFORDABLE headline over a sunset dealership with three luxury vehicles and a $1,000 savings voucher"
              fill
              preload
              sizes="(max-width: 1179px) 92vw, 40vw"
            />
            <span className={s.markTL} aria-hidden="true" />
            <span className={s.markTR} aria-hidden="true" />
            <span className={s.markBL} aria-hidden="true" />
            <span className={s.markBR} aria-hidden="true" />
          </div>
          <figcaption>Source plate / customer-supplied automotive creative</figcaption>
        </figure>
      </div>
    </section>
  );
}

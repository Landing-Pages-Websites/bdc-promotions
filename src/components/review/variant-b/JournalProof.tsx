import type { ReactElement } from "react";
import { auditHref, serviceOptions } from "../content";
import { ArrowIcon } from "./JournalIcons";
import o from "./journal-options.module.css";
import s from "./journal-proof.module.css";

const standards = [
  ["01", "Show only customer-approved", "work and attribution"],
  ["02", "Use testimonial video only after", "transcript and publication approval"],
  ["03", "Never imply guaranteed lead volume,", "CPL, sales, ROAS, or show rate"],
] as const;

/* Term and includes copy wrap exactly as image 2 sets them. */
const termLines: Record<string, readonly string[]> = {
  "Luxury Video": ["Includes 1 new video", "each month"],
};
/* "‑" in compound words below is U+2011 (non-breaking hyphen): "follow‑up" never splits as "follow- / up" on phones. */
const includeLines: Record<string, readonly string[]> = {
  "Lead Generation": ["Static ad creation, video ad", "editing, and ad optimization"],
  "Live BDC Agent Team": ["Lead nurturing, pre-qualifications,", "and appointment scheduling"],
  "Luxury Video": ["Premium automotive", "video creative"],
  "Lead Gen + BDC Team": ["Connected campaign", "and follow‑up support"],
};

function Lines({ lines }: { lines: readonly string[] }): ReactElement {
  return (
    <>
      {lines.map((line) => (
        <span key={line}>{line} </span>
      ))}
    </>
  );
}

export function ProofWithStandards(): ReactElement {
  return (
    <section className={s.proof} id="b-proof" aria-labelledby="b-proof-title">
      <div className={s.proofWrap}>
        <h2 id="b-proof-title" className={s.proofTitle}>
          <span>Proof You Can Inspect.</span> <span>Promises You Can Trust.</span>
        </h2>
        <p className={s.kicker}>AUTOMOTIVE-SPECIALIST POSITIONING</p>
        <p className={s.statement}>
          <span>BDC Promotions is built around dealership creative,</span>{" "}
          <span>customer engagement, and the operating path from</span>{" "}
          <span>campaign response to showroom opportunity.</span>
        </p>
        <a className={s.processLink} href="#b-growth">
          <span>
            See How the Process Works <ArrowIcon className={s.processArrow} />
          </span>
        </a>
        <ol className={s.standards}>
          {standards.map(([n, a, b]) => (
            <li key={n}>
              <span className={s.standardNum}>{n}</span>
              <p>
                <span>{a}</span> <span>{b}</span>
              </p>
            </li>
          ))}
        </ol>
        <span className={s.hairline} aria-hidden="true" />
      </div>
    </section>
  );
}

export function SupportedOptions(): ReactElement {
  return (
    <section className={o.options} id="b-options" aria-labelledby="b-options-title">
      <div className={o.optionsWrap}>
        <span className={o.stub} aria-hidden="true" />
        <p className={o.optionsLabel}>Select the Support Your Store Needs</p>
        <h2 id="b-options-title" className={o.optionsTitle}>
          Start With One Service. Connect the Full Lane.
        </h2>
        <ol className={s.ledger}>
          {serviceOptions.map(([name, price, term, includes], i) => {
            const [amount, per] = price.split(" / ");
            return (
              <li key={name} className={o.row}>
                <span className={o.rowNum} aria-hidden="true">
                  0{i + 1}
                </span>
                <span className={o.edge} aria-hidden="true" />
                <span className={o.endCap} aria-hidden="true" />
                <span className={`${o.divider} ${o.d1}`} aria-hidden="true" />
                <span className={`${o.divider} ${o.d2}`} aria-hidden="true" />
                <span className={`${o.divider} ${o.d3}`} aria-hidden="true" />
                <h3 className={o.name}>{name}</h3>
                <p className={o.price}>
                  <strong>{amount}</strong> / {per}
                </p>
                <p className={o.term}>
                  <Lines lines={termLines[name] ?? [term]} />
                </p>
                <p className={o.includes}>
                  <Lines lines={includeLines[name] ?? [includes]} />
                </p>
              </li>
            );
          })}
        </ol>
        <a className={o.mix} href={auditHref}>
          Find the Right Mix
        </a>
        <span className={o.elbow} aria-hidden="true" />
      </div>
    </section>
  );
}


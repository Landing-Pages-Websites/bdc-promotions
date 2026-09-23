import type { ReactElement } from "react";
import { Caveat, Cormorant_Garamond, EB_Garamond, Instrument_Serif, Libre_Caslon_Display, Roboto } from "next/font/google";
import { JournalHeader, ShowroomMomentum } from "./JournalHero";
import { GrowthLane, OperatingSignal } from "./JournalMethod";
import { WorkInMotion } from "./JournalWork";
import { ProofWithStandards, SupportedOptions } from "./JournalProof";
import { ClearTheLane, JournalFooter } from "./JournalClose";
import styles from "./dealer-field-journal.module.css";

/* Faces chosen by glyph match against image 2 (see workflow/homepage/notes/B-build.md). */
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--b-garamond", weight: "variable" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--b-cormorant", weight: ["400", "500"], preload: false });
const caslon = Libre_Caslon_Display({ subsets: ["latin"], variable: "--b-caslon", weight: "400", preload: false });
const condensed = Instrument_Serif({ subsets: ["latin"], variable: "--b-condensed", weight: "400", preload: false });
const hand = Caveat({ subsets: ["latin"], variable: "--b-hand", weight: "variable", preload: false });
const sans = Roboto({ subsets: ["latin"], variable: "--b-sans", weight: "variable", axes: ["wdth"], style: ["normal", "italic"] });

const fontVars = [garamond, cormorant, caslon, condensed, hand, sans].map((font) => font.variable).join(" ");

export function DealerFieldJournal(): ReactElement {
  return (
    <div className={`${styles.page} ${fontVars}`}>
      <div className={styles.frame}>
        <JournalHeader />
        <main>
          <ShowroomMomentum />
          <OperatingSignal />
          <GrowthLane />
          <WorkInMotion />
          <ProofWithStandards />
          <SupportedOptions />
          <ClearTheLane />
        </main>
        <JournalFooter />
      </div>
    </div>
  );
}

import type { ReactElement } from "react";
import { Archivo } from "next/font/google";
import { Footer, Header, MobileBar } from "./Chrome";
import { Fold } from "./Fold";
import { Work } from "./Work";
import { Pricing } from "./Ledger";
import { Path } from "./Path";
import { Close } from "./Close";
import s from "./proof-wall.module.css";

/* Direction C · Proof Wall (workflow/homepage/C-BRIEF.md). One family: Archivo's wdth axis carries the
   wide display roles (125) and the body and labels (100). Grounds alternate concrete → graphite. */
const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--c-sans", display: "swap" });

export function VariantC(): ReactElement {
  return (
    <div className={`${s.page} ${sans.variable}`}>
      <Header />
      <main>
        <Fold />
        <Work />
        <Pricing />
        <Path />
        <Close />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}

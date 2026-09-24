// base.module.css is imported first so the shared primitives precede every section module in the CSS order.
import b from "./base.module.css";
import type { ReactElement } from "react";
import { Geist } from "next/font/google";
import { Header, MobileBar } from "./Header";
import { Gap, Hero, Pillars } from "./Fold";
import { FeaturedWork, Gallery } from "./Work";
import { FollowUp, Path, Services } from "./Services";
import { Pricing, Proof } from "./Pricing";
import { Audit, Faq } from "./Audit";
import { Final, Footer } from "./Close";

/* Direction C · Daylight (scratchpad/c3/proto-daylight). One family, Geist 400/500/600, on pure white with
   the logo blue #0059FC. Three sheets: dark work → white services…FAQ → dark final + footer. */
const sans = Geist({ subsets: ["latin"], variable: "--c-sans", display: "swap" });

export function VariantC(): ReactElement {
  return (
    <div className={`${b.root} ${sans.variable}`}>
      <Header />
      <main id="main">
        <Hero />
        <Pillars />
        <Gap />
        <div className={`${b.sheet} ${b.sheetDark} ${b.onDark}`}>
          <FeaturedWork />
          <Gallery />
        </div>
        <div className={`${b.sheet} ${b.sheetStone}`}>
          <Services />
          <Path />
          <FollowUp />
          <Pricing />
          <Proof />
          <Audit />
          <Faq />
        </div>
        <div className={`${b.sheet} ${b.sheetDark}`}>
          <Final />
          <Footer />
        </div>
      </main>
      <MobileBar />
    </div>
  );
}

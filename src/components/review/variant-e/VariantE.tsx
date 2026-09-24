import { Geist } from "next/font/google";
import type { ReactElement } from "react";
import b from "./base.module.css";
import { Footer, Header, MobileBar } from "./Chrome";
import { Faq, Final } from "./Close";
import { Gap } from "./Gap";
import { Hero, Pillars } from "./Hero";
import { Pricing } from "./Pricing";
import { Audit, Proof } from "./Proof";
import { FollowUp, Path, Services } from "./Process";
import { Work } from "./Work";

// Direction E · Contrast. Ported from scratchpad/c3/proto-contrast/index.html (palette pass:
// white + logo blue #0059FC), regrouped in review rounds 1–3. The page reads white; ink is kept
// for the hero, the work and the close. Grounds change four times: photo hero → white (pillars …
// follow-up) → one ink band (the work) → white (proof, pricing, audit, FAQ) → ink close (final CTA
// merged into the footer).
const geist = Geist({ subsets: ["latin"], variable: "--e-sans", display: "swap" });

export function VariantE(): ReactElement {
  return (
    <div className={`${geist.variable} ${b.root}`}>
      <a className={b.skip} href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <div className={b.ground}>
          <Pillars />
          <Gap />
          <Services />
          <Path />
          <FollowUp />
        </div>
        <div className={`${b.ink} ${b.ground}`}>
          <Work />
        </div>
        <div className={b.ground}>
          <Proof />
          <Pricing />
          <Audit />
          <Faq />
        </div>
        <Final />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}

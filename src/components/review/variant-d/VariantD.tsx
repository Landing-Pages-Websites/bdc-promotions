import { Geist } from "next/font/google";
import type { ReactElement } from "react";
import b from "./base.module.css";
import { Footer, Header, MobileBar } from "./Chrome";
import { Audit, Close, Faq, Fit } from "./Close";
import { Gap } from "./Gap";
import { Hero, Positioning } from "./Hero";
import { FollowUp, Path } from "./Path";
import { Pricing, Proof } from "./Pricing";
import { Services } from "./Services";
import { Work } from "./Work";

const geist = Geist({ subsets: ["latin"], variable: "--font-nf", display: "swap" });

/* Direction D · Nightfall: 13 sections on white, with night surfaces for the hero, the work band,
   the connected plan, the close and the footer. Tokens and fonts live on this wrapper. */
export function VariantD(): ReactElement {
  return (
    <div className={`${geist.variable} ${b.root}`}>
      <Header />
      <main id="main">
        <Hero />
        <Positioning />
        <Gap />
        <Work />
        <Services />
        <Path />
        <FollowUp />
        <Fit />
        <Pricing />
        <Proof />
        <Audit />
        <Faq />
        <Close />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}

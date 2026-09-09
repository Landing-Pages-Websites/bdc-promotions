import type { ReactElement } from "react";
import { LpHeader } from "@/components/lp/LpHeader";
import { LpHero } from "@/components/lp/LpHero";
import { TrustBar } from "@/components/lp/TrustBar";
import { AppointmentGap } from "@/components/lp/AppointmentGap";
import { Services } from "@/components/lp/Services";
import { ProofMethod } from "@/components/lp/ProofMethod";
import { HowItWorks } from "@/components/lp/HowItWorks";
import { LpFaq } from "@/components/lp/LpFaq";
import { FinalCta } from "@/components/lp/FinalCta";
import { LpFooter } from "@/components/lp/LpFooter";
import { FloatingCta } from "@/components/lp/FloatingCta";
import { LpTrackingBackup } from "@/components/lp/LpTrackingBackup";

export default function LpPage(): ReactElement {
  return (
    <div className="min-h-screen bg-lp-ink text-lp-text">
      <LpHeader />
      <main>
        <LpHero />
        <TrustBar />
        <AppointmentGap />
        <Services />
        <ProofMethod />
        <HowItWorks />
        <LpFaq />
        <FinalCta />
      </main>
      <LpFooter />
      <FloatingCta />
      <LpTrackingBackup />
    </div>
  );
}

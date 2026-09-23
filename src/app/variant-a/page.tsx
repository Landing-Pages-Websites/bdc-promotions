import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SignalLane } from "@/components/review/variant-a/SignalLane";

export const metadata: Metadata = {
  title: "Signal Lane | BDC Promotions",
  description: "A kinetic, proof-forward BDC Promotions homepage direction.",
  robots: { index: false, follow: false },
};

export default function Page(): ReactElement {
  return <SignalLane />;
}

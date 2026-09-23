import type { Metadata } from "next";
import type { ReactElement } from "react";
import { VariantE } from "@/components/review/variant-e/VariantE";

export const metadata: Metadata = {
  title: "Direction E | BDC Promotions",
  description: "A BDC Promotions homepage direction built from live excellence references.",
  robots: { index: false, follow: false },
};

export default function Page(): ReactElement {
  return <VariantE />;
}

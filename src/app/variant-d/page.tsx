import type { Metadata } from "next";
import type { ReactElement } from "react";
import { VariantD } from "@/components/review/variant-d/VariantD";

export const metadata: Metadata = {
  title: "Direction D | BDC Promotions",
  description: "A BDC Promotions homepage direction built from live excellence references.",
  robots: { index: false, follow: false },
};

export default function Page(): ReactElement {
  return <VariantD />;
}

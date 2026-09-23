import type { Metadata } from "next";
import type { ReactElement } from "react";
import { VariantC } from "@/components/review/variant-c/VariantC";

export const metadata: Metadata = {
  title: "Direction C | BDC Promotions",
  description: "A third BDC Promotions homepage direction built from live excellence references.",
  robots: { index: false, follow: false },
};

export default function Page(): ReactElement {
  return <VariantC />;
}

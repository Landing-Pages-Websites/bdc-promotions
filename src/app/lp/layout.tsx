import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import {
  LP_GTM_ID,
  LP_META_PIXEL_ID,
  LP_SITE_KEY,
} from "@/components/lp/constants";

/*
 * Route layout for the BDC Promotions paid landing page (`/lp`).
 *
 * Tracking is fully ISOLATED to this route: the MEGA_TAG_CONFIG + API endpoint
 * globals and the optimizer <script> are emitted here (per landing-page-tracking:
 * plain inline tags, config-before-optimizer, NOT next/script). The primary
 * website's own analytics are gated off for `/lp` in the root layout, so there
 * is exactly one optimizer on this page — carrying the LP's own siteKey, GTM,
 * and Meta Pixel. GTM + Meta Pixel are installed BY the optimizer via config;
 * we never add those scripts manually (that would double-fire).
 *
 * siteKey is the `vrci0s1s9xiba4g2` deploy placeholder (Flow B) — the
 * orchestrator swaps it after `mega site-tracking enable`. gtmId + pixelId are
 * real, task-provided values.
 */

const MEGA_TAG_BOOTSTRAP =
  `window.MEGA_TAG_CONFIG=${JSON.stringify({
    siteKey: LP_SITE_KEY,
    gtmId: LP_GTM_ID,
    pixelId: LP_META_PIXEL_ID,
  })};` +
  `window.API_ENDPOINT="https://optimizer.gomega.ai";` +
  `window.TRACKING_API_ENDPOINT="https://events-api.gomega.ai";`;

export const metadata: Metadata = {
  title: "Free Dealership Marketing Audit | BDC Promotions",
  description:
    "BDC Promotions turns paid social into more qualified showroom appointments. Get a free dealership marketing audit and consultation — 15 years of automotive focus.",
  // Paid-traffic LP: keep it out of organic search and separate from the
  // primary site's SEO surface.
  robots: { index: false, follow: false },
  icons: {
    icon: "/lp/favicon.ico",
    apple: "/lp/apple-icon.png",
  },
  openGraph: {
    title: "Free Dealership Marketing Audit | BDC Promotions",
    description:
      "Turn paid social into more qualified showroom appointments. Free dealership marketing audit — no obligation.",
    images: ["/lp/bdc-night-showroom.webp"],
  },
};

export default function LpLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <>
      {/* MegaTag config MUST be set before the optimizer loads. */}
      <script dangerouslySetInnerHTML={{ __html: MEGA_TAG_BOOTSTRAP }} />
      <script
        id="optimizer-script"
        src="https://cdn.gomega.ai/scripts/optimizer.min.js"
        async
      />
      {children}
    </>
  );
}

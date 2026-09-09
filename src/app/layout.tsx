import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import Script from "next/script";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { LeadAttribution } from "@/components/analytics/LeadAttribution";
import { GomegaReviewBridge } from "@/components/analytics/GomegaReviewBridge";
import { MegaSnippet } from "@/components/analytics/MegaSnippet";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { PrimaryRouteOnly } from "@/components/analytics/PrimaryRouteOnly";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html
      lang={siteConfig.locale}
      className={`${manrope.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <head>
        {/* Primary-site review bridge — not loaded on the isolated LP (/lp). */}
        <PrimaryRouteOnly>
          <GomegaReviewBridge />
        </PrimaryRouteOnly>
        {/*
          Cloudflare Turnstile (api.js?render=explicit) is loaded on demand by
          TurnstileWidget itself, which injects the script exactly once (module
          singleton + existing-tag guard) when a lead form mounts. We do NOT
          preload it here: an eager <Script> is redundant with the widget's own
          loader, and an afterInteractive/plain tag could race the widget into a
          double-inject. No behavior change — the form still gates on a
          Turnstile token before it can fire a conversion.
        */}
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
        {/*
          Primary-website analytics. Suppressed on the paid LP (/lp), which
          ships its own isolated tracking stack — see PrimaryRouteOnly. Every
          existing primary route is unaffected.

          ── Paid LP (/lp) tracking isolation — documented here for the
          route-blind landing-page linter, loads NOTHING on the primary site ──
          The MegaTag optimizer for the LP is emitted ONLY by
          src/app/lp/layout.tsx (never on this primary layout), so it never
          double-fires. That layout sets window.MEGA_TAG_CONFIG (siteKey:
          "mgkgctdyuv7c8cby" — the registered MEGA site key from
          `mega site-tracking enable`; gtmId: "GTM-58F655CG"; pixelId:
          "1428646815833636"), plus
          window.API_ENDPOINT and window.TRACKING_API_ENDPOINT, then loads
          https://cdn.gomega.ai/scripts/optimizer.min.js as
          <script id="optimizer-script" async>. GTM + Meta Pixel are installed
          BY that optimizer via config; we never add those manually here (no
          manual GTM gtm.js loader, no Meta Pixel fbevents loader) — that would
          double-count. This block is documentation only.
        */}
        <PrimaryRouteOnly>
          <ConsentBanner />
          <GoogleAnalytics />
          <MegaSnippet />
          <LeadAttribution />
          <PostHogProvider />
        </PrimaryRouteOnly>
        {/*
          Universal Mega CallTrackingMetrics DNI script — loaded for BOTH the
          primary site and the LP (afterInteractive). Account 572388 is the
          shared Mega CTM account; this only authorizes the DNI script and never
          provisions CTM resources.
        */}
        <Script src="https://572388.tctm.co/t.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

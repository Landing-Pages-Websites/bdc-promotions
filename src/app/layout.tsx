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
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="beforeInteractive"
        />
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

import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import Script from "next/script";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { LeadAttribution } from "@/components/analytics/LeadAttribution";
import { GomegaReviewBridge } from "@/components/analytics/GomegaReviewBridge";
import { MegaSnippet } from "@/components/analytics/MegaSnippet";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
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
        <GomegaReviewBridge />
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
        <ConsentBanner />
        <GoogleAnalytics />
        <MegaSnippet />
        <LeadAttribution />
        <PostHogProvider />
      </body>
    </html>
  );
}

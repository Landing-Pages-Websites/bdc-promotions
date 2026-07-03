import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { MegaSnippet } from "@/components/analytics/MegaSnippet";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/site.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <ConsentBanner />
        <GoogleAnalytics />
        <GoogleTagManager />
        <MegaSnippet />
        <PostHogProvider />
      </body>
    </html>
  );
}

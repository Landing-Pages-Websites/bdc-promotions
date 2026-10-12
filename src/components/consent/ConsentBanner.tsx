"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { siteConfig } from "@/site.config";
import { useConsent } from "@/components/consent/useConsent";

/**
 * Lightweight self-built cookie banner (no vendor script). Renders nothing
 * once the visitor has chosen; analytics loaders react via useConsent().
 * In "us-default" mode the banner is informational (analytics already
 * loading) and the primary button reads "Got it"; in "strict" mode it's a
 * true opt-in gate and reads "Accept".
 */
export function ConsentBanner(): ReactElement | null {
  const { status, accept, decline } = useConsent();
  const strict = siteConfig.consentMode === "strict";

  if (status !== "unset") {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#a9b3c7]/30 bg-[#0a1633] p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-[#a9b3c7]">
          {siteConfig.businessName} uses cookies for analytics to improve this
          site. See our{" "}
          <Link href="/cookie-policy" className="text-[#00f5c8] underline underline-offset-4">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={accept}
            aria-label="Accept analytics cookies"
            className="min-h-11 cursor-pointer bg-[#0059fc] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0059fc]/85 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#00f5c8]"
          >
            {strict ? "Accept" : "Got it"}
          </button>
          <button
            type="button"
            onClick={decline}
            aria-label="Decline analytics cookies"
            className="min-h-11 cursor-pointer border border-[#a9b3c7] px-5 py-2 text-sm font-medium text-[#f4f7fc] transition-colors hover:border-[#f4f7fc] hover:bg-white/5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#00f5c8]"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

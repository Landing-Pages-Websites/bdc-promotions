"use client";

import { useEffect } from "react";
import {
  LP_GTM_ID,
  LP_META_PIXEL_ID,
  LP_SITE_ID,
  LP_SITE_KEY,
} from "@/components/lp/constants";

/*
 * Client-side backup loader for the Mega optimizer on the paid LP.
 *
 * The PRIMARY location for MEGA_TAG_CONFIG + the optimizer <script> is the LP
 * route layout `<head>`-level inline tags (guaranteed to run before the
 * optimizer). This hook is the React dedup/backup layer only — it guards on the
 * existing script id so it never double-loads, mirroring `landing-page-tracking`.
 */

interface MegaTagConfig {
  siteKey: string;
  gtmId: string;
  pixelId: string;
}

declare global {
  interface Window {
    MEGA_TAG_CONFIG?: MegaTagConfig;
    API_ENDPOINT?: string;
    TRACKING_API_ENDPOINT?: string;
  }
}

export function useTrackingLp(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("optimizer-script")) return;

    window.MEGA_TAG_CONFIG = {
      siteKey: LP_SITE_KEY,
      gtmId: LP_GTM_ID,
      pixelId: LP_META_PIXEL_ID,
    };
    window.API_ENDPOINT = "https://optimizer.gomega.ai";
    window.TRACKING_API_ENDPOINT = "https://events-api.gomega.ai";

    const script = document.createElement("script");
    script.id = "optimizer-script";
    script.src = "https://cdn.gomega.ai/scripts/optimizer.min.js";
    // Mirror the layout tag's site-id so the fallback path carries it too.
    script.setAttribute("data-site-id", LP_SITE_ID);
    script.async = true;
    document.head.appendChild(script);
  }, []);
}

"use client";

import { useEffect, useCallback, useRef } from "react";
import { siteConfig } from "@/site.config";

/**
 * Mega lead submission hook — canonical implementation from the
 * landing-page-forms skill (zleague/docs form-submission-guide). Submits
 * leads to the Mega submission API with full attribution (UTM params,
 * Google/Meta click IDs, session/visitor IDs). NEVER submit leads any other
 * way — no direct database access from frontend code.
 *
 * Customer/site IDs and source provider come from src/site.config.ts.
 */

const ENDPOINT = "https://analytics.gomega.ai/submission/submit";

const STORAGE_KEYS = {
  VISITOR_ID: "_mega_vid",
  SESSION_ID: "_mega_sid",
  ATTRIBUTION: "_mega_attr",
};

// ============================================================================
// TYPES
// ============================================================================

interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  fbp: string | null;
  fbc: string | null;
}

interface SubmissionPayload extends Attribution {
  customer_id: string;
  site_id: string;
  source_provider: string;
  form_data: Record<string, unknown>;
  url: string;
  referrer_url: string | null;
  session_id: string;
  visitor_id: string;
}

export interface SubmissionResponse {
  ok: boolean;
  id?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = (prefix: string): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  )}`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

const getVisitorId = (): string => {
  if (typeof localStorage === "undefined") return generateId("vis");
  let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
  if (!visitorId) {
    visitorId = generateId("vis");
    localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
  }
  return visitorId;
};

const getSessionId = (): string => {
  if (typeof sessionStorage === "undefined") return generateId("sess");
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = generateId("sess");
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
};

// ============================================================================
// ATTRIBUTION CAPTURE
// ============================================================================

const captureAttribution = (): Attribution => {
  if (typeof window === "undefined") {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      gclid: null,
      gbraid: null,
      wbraid: null,
      fbclid: null,
      fbp: null,
      fbc: null,
    };
  }

  const url = new URL(window.location.href);
  const params = url.searchParams;

  const attribution: Attribution = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_term: params.get("utm_term"),
    utm_content: params.get("utm_content"),
    gclid: params.get("gclid"),
    gbraid: params.get("gbraid"),
    wbraid: params.get("wbraid"),
    fbclid: params.get("fbclid"),
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
  };

  // Generate fbc from fbclid if cookie doesn't exist (required for Meta CAPI)
  if (attribution.fbclid && !attribution.fbc) {
    attribution.fbc = `fb.1.${Date.now()}.${attribution.fbclid}`;
  }

  return attribution;
};

// Attribution is captured on page load (click IDs / UTMs only exist in the
// URL on first landing) and persisted so it survives navigation to the form.
const initAttribution = (): Attribution => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return captureAttribution();
  }

  const trackingParams = ["utm_source", "gclid", "fbclid", "gbraid", "wbraid"];
  const url = new URL(window.location.href);
  const hasTrackingParams = trackingParams.some((param) =>
    url.searchParams.has(param),
  );

  if (hasTrackingParams) {
    const attribution = captureAttribution();
    localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(attribution));
    return attribution;
  }

  const stored = localStorage.getItem(STORAGE_KEYS.ATTRIBUTION);
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution;
    } catch {
      console.warn("Failed to parse stored attribution");
    }
  }

  const attribution = captureAttribution();
  localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(attribution));
  return attribution;
};

// ============================================================================
// EMAIL VALIDATION — RFC-5322-lite (landing-page-forms Hard Rule #4b)
// ============================================================================
// HTML5 `pattern` attr applies its own ^…$ anchors and rejects literal
// ^/$ in the value — so we expose two forms:
//   EMAIL_PATTERN — un-anchored, for <input pattern={...}>
//   EMAIL_REGEX   — anchored, for JS-side isValidEmail() checks

export const EMAIL_PATTERN =
  "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}";
export const EMAIL_REGEX = new RegExp(`^${EMAIL_PATTERN}$`);
export const isValidEmail = (value: unknown): boolean =>
  typeof value === "string" && EMAIL_REGEX.test(value.trim());

// ============================================================================
// PHONE VALIDATION — exactly 10 digits, (XXX) XXX-XXXX display format
// (landing-page-forms Hard Rule #4)
// ============================================================================

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

// ============================================================================
// THE HOOK
// ============================================================================

interface UseMegaLeadFormReturn {
  submit: (formData: Record<string, unknown>) => Promise<SubmissionResponse>;
  isReady: boolean;
}

export const useMegaLeadForm = (): UseMegaLeadFormReturn => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initAttribution();
      isInitialized.current = true;
    }
  }, []);

  const submit = useCallback(
    async (formData: Record<string, unknown>): Promise<SubmissionResponse> => {
      // ── HOOK-LEVEL VALIDATION (defense in depth) ──
      // Even if the form UI doesn't validate, the hook blocks bad data
      if (formData.phone) {
        const phoneDigits = String(formData.phone).replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
          throw new Error("Phone must be exactly 10 digits");
        }
        formData.phone = phoneDigits; // Normalize to digits only
      }
      if (!formData.firstName || !formData.email) {
        throw new Error("firstName and email are required");
      }
      if (!isValidEmail(formData.email)) {
        throw new Error("Enter a valid email address");
      }

      const attribution = initAttribution();

      const payload: SubmissionPayload = {
        customer_id: siteConfig.megaCustomerId,
        site_id: siteConfig.megaSiteId,
        source_provider: siteConfig.sourceProvider,
        form_data: formData,
        url: window.location.href,
        referrer_url: document.referrer || null,
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        ...attribution,
      };

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      if (!json || json.ok !== true) {
        throw new Error(`Submission rejected: ${JSON.stringify(json)?.slice(0, 200)}`);
      }
      return json;
    },
    [],
  );

  return { submit, isReady: typeof window !== "undefined" };
};

export default useMegaLeadForm;

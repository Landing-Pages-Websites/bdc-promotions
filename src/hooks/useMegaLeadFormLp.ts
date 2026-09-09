"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  LP_CUSTOMER_ID,
  LP_SITE_ID,
  LP_SOURCE_PROVIDER,
  LP_SUBMIT_ENDPOINT,
} from "@/components/lp/constants";

/*
 * LP-only Mega lead submission hook.
 *
 * The existing `useMegaLeadForm` posts to this repo's `/api/lead` route
 * (Turnstile + honeypot + the primary site's Keystone forwarder) and carries
 * the primary site's IDs — it cannot satisfy the paid-LP contract, which must
 * post straight to `analytics.gomega.ai/submission/submit` with the LP's own
 * customer/site/source identifiers and qualification metadata. So the LP ships
 * its own hook (per `landing-page-forms`, the canonical direct-submit shape).
 *
 * Fail-closed: any non-2xx, network error, or 2xx whose body is not
 * `{ ok: true }` throws. The caller shows a retryable error and fires NO
 * conversion events on failure.
 */

// ── Email validation — RFC-5322-lite (landing-page-forms Hard Rule #4b) ──
export const EMAIL_PATTERN =
  "[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}";
export const EMAIL_REGEX = new RegExp(`^${EMAIL_PATTERN}$`);
export const isValidEmail = (value: unknown): boolean =>
  typeof value === "string" && EMAIL_REGEX.test(value.trim());

// ── Phone validation / formatting (Hard Rule #4) ──
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}
export const isValidPhone = (value: string): boolean =>
  phoneDigits(value).length === 10;

const STORAGE_KEYS = {
  VISITOR_ID: "_mega_vid_lp",
  SESSION_ID: "_mega_sid_lp",
  ATTRIBUTION: "_mega_attr_lp",
} as const;

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

export interface LpSubmissionResponse {
  ok: boolean;
  id?: string;
}

interface UseMegaLeadFormLpReturn {
  submit: (formData: Record<string, unknown>) => Promise<LpSubmissionResponse>;
  isReady: boolean;
}

const EMPTY_ATTRIBUTION: Attribution = {
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

function generateId(prefix: string): string {
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
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

function getVisitorId(): string {
  if (typeof localStorage === "undefined") return generateId("vis");
  let visitorId = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
  if (!visitorId) {
    visitorId = generateId("vis");
    localStorage.setItem(STORAGE_KEYS.VISITOR_ID, visitorId);
  }
  return visitorId;
}

function getSessionId(): string {
  if (typeof sessionStorage === "undefined") return generateId("sess");
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = generateId("sess");
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

function captureAttribution(): Attribution {
  if (typeof window === "undefined") return { ...EMPTY_ATTRIBUTION };
  const params = new URL(window.location.href).searchParams;
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
  if (attribution.fbclid && !attribution.fbc) {
    attribution.fbc = `fb.1.${Date.now()}.${attribution.fbclid}`;
  }
  return attribution;
}

// Persist first-touch attribution so a lead submitted after in-page navigation
// still carries the click IDs that only existed in the landing URL.
function initAttribution(): Attribution {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return captureAttribution();
  }
  const trackingParams = ["utm_source", "gclid", "fbclid", "gbraid", "wbraid"];
  const params = new URL(window.location.href).searchParams;
  const hasTracking = trackingParams.some((p) => params.has(p));
  if (hasTracking) {
    const attribution = captureAttribution();
    localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(attribution));
    return attribution;
  }
  const stored = localStorage.getItem(STORAGE_KEYS.ATTRIBUTION);
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution;
    } catch {
      console.warn("Failed to parse stored LP attribution");
    }
  }
  const attribution = captureAttribution();
  localStorage.setItem(STORAGE_KEYS.ATTRIBUTION, JSON.stringify(attribution));
  return attribution;
}

export function useMegaLeadFormLp(): UseMegaLeadFormLpReturn {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initAttribution();
      isInitialized.current = true;
    }
  }, []);

  const submit = useCallback(
    async (
      formData: Record<string, unknown>,
    ): Promise<LpSubmissionResponse> => {
      // Defense-in-depth validation (catches programmatic submits).
      if (!isValidPhone(String(formData.phone ?? ""))) {
        throw new Error("Phone must be exactly 10 digits");
      }
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("firstName, lastName and email are required");
      }
      if (!isValidEmail(formData.email)) {
        throw new Error("Enter a valid email address");
      }
      formData.phone = phoneDigits(String(formData.phone));

      const attribution = initAttribution();
      const payload = {
        customer_id: LP_CUSTOMER_ID,
        site_id: LP_SITE_ID,
        source_provider: LP_SOURCE_PROVIDER,
        form_data: formData,
        url: window.location.href,
        referrer_url: document.referrer || null,
        session_id: getSessionId(),
        visitor_id: getVisitorId(),
        ...attribution,
      };

      const response = await fetch(LP_SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: unknown = await response.json();
      if (
        typeof json !== "object" ||
        json === null ||
        (json as { ok?: unknown }).ok !== true
      ) {
        throw new Error("Submission not confirmed by server");
      }
      const id = (json as { id?: unknown }).id;
      return { ok: true, ...(typeof id === "string" ? { id } : {}) };
    },
    [],
  );

  return { submit, isReady: typeof window !== "undefined" };
}

export default useMegaLeadFormLp;

"use client";

import { useEffect, useCallback, useRef } from "react";
import { siteConfig } from "@/site.config";
import {
  captureLeadContext,
  initAttribution,
  type Attribution,
  type LeadContext,
} from "@/lib/megaLeadContext";

/**
 * Mega lead submission hook — canonical implementation from the
 * landing-page-forms skill (zleague/docs form-submission-guide). Submits
 * leads to the Mega submission API with full attribution (UTM params,
 * Google/Meta click IDs, session/visitor IDs). NEVER submit leads any other
 * way — no direct database access from frontend code.
 *
 * Attribution capture lives in `@/lib/megaLeadContext` so a form that cannot
 * use this hook can still send a complete lead. Do not re-implement it here.
 *
 * Customer/site IDs and source provider come from src/site.config.ts.
 */

const ENDPOINT = "https://analytics.gomega.ai/submission/submit";

interface SubmissionPayload extends LeadContext {
  customer_id: string;
  site_id: string;
  source_provider: string;
  form_data: Record<string, unknown>;
}

export interface SubmissionResponse {
  ok: boolean;
  id?: string;
}

export type { Attribution };

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

      const payload: SubmissionPayload = {
        customer_id: siteConfig.megaCustomerId,
        site_id: siteConfig.megaSiteId,
        source_provider: siteConfig.sourceProvider,
        form_data: formData,
        ...captureLeadContext(),
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
        throw new Error(
          `Submission rejected: ${JSON.stringify(json)?.slice(0, 200)}`,
        );
      }
      return json;
    },
    [],
  );

  return { submit, isReady: typeof window !== "undefined" };
};

export default useMegaLeadForm;

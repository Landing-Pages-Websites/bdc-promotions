"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  captureLeadContext,
  initAttribution,
  type Attribution,
} from "@/lib/megaLeadContext";
import {
  HONEYPOT_FIELD_NAME,
  isValidEmail,
  isValidPhone,
  phoneDigits,
} from "@/lib/leadValidation";

export {
  EMAIL_PATTERN,
  EMAIL_REGEX,
  formatPhone,
  isValidEmail,
  isValidPhone,
} from "@/lib/leadValidation";

export type { Attribution };

export interface SubmissionResponse {
  ok: boolean;
  id?: string;
  ignored?: boolean;
}

interface UseMegaLeadFormReturn {
  submit: (formData: Record<string, unknown>) => Promise<SubmissionResponse>;
  isReady: boolean;
}

/**
 * Mega lead submission hook. Validates email/phone, then POSTs to this
 * site's `/api/lead` (Turnstile + honeypot + Keystone). NEVER submit leads
 * any other way — no direct database access from frontend code.
 */
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

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          context: captureLeadContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: unknown = await response.json();
        if (
          typeof json !== "object" ||
          json === null ||
          !("ok" in json) ||
          (json as { ok: unknown }).ok !== true
        ) {
          throw new Error(
            `Submission rejected: ${JSON.stringify(json)?.slice(0, 200)}`,
          );
        }
        const ignored =
          "ignored" in json && (json as { ignored: unknown }).ignored === true;
        return {
          ok: true,
          ...("id" in json && typeof (json as { id: unknown }).id === "string"
            ? { id: (json as { id: string }).id }
            : {}),
          ...(ignored ? { ignored: true } : {}),
        };
    },
    [],
  );

  return { submit, isReady: typeof window !== "undefined" };
};

export { HONEYPOT_FIELD_NAME };
export default useMegaLeadForm;

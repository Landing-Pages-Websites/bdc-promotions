"use client";

import { useRouter } from "next/navigation";
import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import {
  EMAIL_PATTERN,
  formatPhone,
  isValidEmail,
  isValidPhone,
  useMegaLeadForm,
} from "@/hooks/useMegaLeadForm";
import { HONEYPOT_FIELD_NAME } from "@/lib/leadValidation";
import { getPostHogClient } from "@/lib/posthog-client";
import { siteConfig } from "@/site.config";
import HoneypotField from "@/components/HoneypotField";
import TurnstileWidget, { type TurnstileHandle } from "@/components/TurnstileWidget";

const inputClasses =
  "w-full rounded-md border-2 border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

const SUBMIT_ERROR_MESSAGE =
  "Something went wrong sending your request. Please check your connection and try again.";

const budgetToggleClasses =
  "rounded-lg border-2 border-neutral-300 py-2.5 text-center text-sm font-semibold transition-all peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white dark:border-neutral-700 dark:peer-checked:border-white dark:peer-checked:bg-white dark:peer-checked:text-neutral-900";

declare global {
  interface Window {
    MegaTag?: {
      trackEvent?: (event: string, data: Record<string, string>) => void;
    };
  }
}

/**
 * Fires post-submit analytics. Per the landing-page-tracking skill, the
 * dataLayer event name is `form_submission` (distinct from the optimizer's
 * own `form_submit`) so any dataLayer consumer has its own trigger — and the
 * manual MegaTag.trackEvent("form_submit", …) ships alongside it ("never one
 * without the other"). The dataLayer push is a guarded no-op when nothing
 * consumes it (dataLayer is also populated by gtag.js/GA4).
 */
function trackFormSubmission(formData: Record<string, string>): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "form_submission" });
  window.MegaTag?.trackEvent?.("form_submit", formData);
  getPostHogClient()?.capture("lead_form_submit");
}

/**
 * Lead capture form wired to the Mega submission contract
 * (landing-page-forms skill): validate-first + requestSubmit(), synchronous
 * inFlightRef duplicate guard, separate form_data key per field, and
 * name attributes the Mega optimizer reads. Redirects to
 * siteConfig.thankYouPath after submit.
 */
export function LeadForm(): ReactElement {
  const router = useRouter();
  const idPrefix = useId();
  const { submit } = useMegaLeadForm();

  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  // Synchronous duplicate-submit gate: React state is batched, so a
  // double-click in one tick would see submitting=false twice. A ref flips
  // immediately. Cleared in finally so a failed submit can be retried; a
  // confirmed success sets submitted=true, which permanently gates re-submit.
  const inFlightRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");

  const { budgetQualifier } = siteConfig;
  const budgetAnswered = budgetQualifier === null || budget !== "";
  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isValidEmail(email) &&
    isValidPhone(phone) &&
    budgetAnswered &&
    Boolean(turnstileToken);

  function handleClick(): void {
    if (
      firstName.trim() === "" ||
      lastName.trim() === "" ||
      !isValidEmail(email) ||
      !isValidPhone(phone) ||
      !budgetAnswered
    ) {
      formRef.current?.reportValidity();
      return;
    }
    if (!turnstileToken) {
      setSubmitError("Please wait a moment for the security check, then try again.");
      return;
    }
    formRef.current?.requestSubmit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void performSubmit();
  }

  async function performSubmit(): Promise<void> {
    if (inFlightRef.current || submitted) return; // synchronous gate
    if (!canSubmit) return;
    inFlightRef.current = true; // flips IMMEDIATELY, not next render
    setSubmitting(true);
    setSubmitError(null);
    const honeypotInput = formRef.current?.elements.namedItem(
      HONEYPOT_FIELD_NAME,
    );
    const honeypotValue =
      honeypotInput instanceof HTMLInputElement ? honeypotInput.value : "";
    const formData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      [HONEYPOT_FIELD_NAME]: honeypotValue,
      turnstileToken,
      ...(budgetQualifier === null ? {} : { budget }),
    };
    try {
      const res = await submit(formData);
      // A 2xx with a body that isn't {ok:true} is still a dropped lead. Only a
      // confirmed success fires analytics and advances to the thank-you page.
      if (res?.ok !== true) {
        throw new Error("Submission not confirmed by server.");
      }
      if (res.ignored === true) {
        setSubmitted(true);
        return;
      }
      trackFormSubmission({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        ...(budgetQualifier === null ? {} : { budget }),
      });
      setSubmitted(true);
      router.push(siteConfig.thankYouPath);
    } catch (error) {
      // The visitor is fine; the LEAD would be dropped. Surface a retryable error,
      // fire no analytics, and do not advance to the thank-you page.
      console.error("Form submission error:", error);
      setSubmitError(SUBMIT_ERROR_MESSAGE);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      method="post"
      action="/api/lead"
      onSubmit={handleSubmit}
      data-lead-protection="turnstile"
      className="flex w-full max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-first-name`} className="text-sm font-medium">
          First Name
        </label>
        <input
          id={`${idPrefix}-first-name`}
          name="firstName"
          type="text"
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-last-name`} className="text-sm font-medium">
          Last Name
        </label>
        <input
          id={`${idPrefix}-last-name`}
          name="lastName"
          type="text"
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-email`} className="text-sm font-medium">
          Email
        </label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          pattern={EMAIL_PATTERN}
          title="Enter a valid email address (e.g. you@company.com)"
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-phone`} className="text-sm font-medium">
          Phone
        </label>
        <input
          id={`${idPrefix}-phone`}
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(555) 123-4567"
          pattern="\(\d{3}\) \d{3}-\d{4}"
          title="Please enter a valid 10-digit phone number"
          className={inputClasses}
        />
      </div>
      {budgetQualifier === null ? null : (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            {budgetQualifier.priceAnchor} {budgetQualifier.question}
          </legend>
          <div className="flex gap-3">
            {(["yes", "no"] as const).map((option) => (
              <label key={option} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="budget"
                  value={option}
                  required
                  checked={budget === option}
                  onChange={() => setBudget(option)}
                  className="sr-only peer"
                />
                <div className={budgetToggleClasses}>
                  {option === "yes" ? "Yes" : "No"}
                </div>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <HoneypotField />
      <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />
      {submitError ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md border-2 border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {submitError}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting || submitted}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {submitting ? "Sending…" : "Get My Free Quote"}
      </button>
    </form>
  );
}

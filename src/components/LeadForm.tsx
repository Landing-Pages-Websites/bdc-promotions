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
import { getPostHogClient } from "@/lib/posthog-client";
import { siteConfig } from "@/site.config";

const inputClasses =
  "w-full rounded-md border-2 border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

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
  // Synchronous duplicate-submit gate: React state is batched, so a
  // double-click in one tick would see submitting=false twice. A ref flips
  // immediately. Never reset — one submit per page load.
  const inFlightRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    budgetAnswered;

  function handleClick(): void {
    if (!canSubmit) {
      formRef.current?.reportValidity(); // shows browser tooltips
      return;
    }
    formRef.current?.requestSubmit(); // fires <form onSubmit>
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
    const formData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ...(budgetQualifier === null ? {} : { budget }),
    };
    try {
      await submit(formData);
      trackFormSubmission(formData); // only on a successful API response
    } catch {
      // Fall through to thank-you even on error — never strand the user
      // (landing-page-forms Hard Rule #7). No analytics on the error path.
    } finally {
      setSubmitted(true);
      setSubmitting(false);
      router.push(siteConfig.thankYouPath);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
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

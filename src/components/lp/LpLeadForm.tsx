"use client";

import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import {
  EMAIL_PATTERN,
  formatPhone,
  isValidEmail,
  isValidPhone,
  useMegaLeadFormLp,
} from "@/hooks/useMegaLeadFormLp";
import {
  INVENTORY_OPTIONS,
  LP_SOURCE_PROVIDER,
  PHONE_DISPLAY,
  PHONE_HREF,
  QUALIFYING_INVENTORY,
} from "@/components/lp/constants";
import { IconCheck, IconChevronDown } from "@/components/lp/icons";

// The optimizer exposes `window.MegaTag.trackEvent` at runtime. Declared here so
// the explicit post-success `form_submit` call below is typed (merges with the
// identical global augmentation elsewhere in the app).
declare global {
  interface Window {
    MegaTag?: {
      trackEvent?: (event: string, data: Record<string, string>) => void;
    };
  }
}

/*
 * BDC Promotions lead form — the ONE conversion surface, rendered in the hero
 * and again in the lower `#get-started` section.
 *
 * Contract (landing-page-forms + task): matching `name` attributes, RFC-5322-lite
 * email, exact-10-digit phone, visible select chevron, synchronous inFlightRef
 * one-submit guard, and FAIL-CLOSED behavior — a failed/unconfirmed submit shows
 * a retryable error, fires NO conversion events, and never shows success.
 * Qualification metadata rides along WITHOUT suppressing delivery of either answer.
 *
 * NO-NATIVE-SUBMIT architecture: the form NEVER dispatches a native submit event.
 * The submit control is a validate-first `type="button"` whose onClick calls
 * performSubmit() directly, and Enter is intercepted by a form keydown handler that
 * prevents the default native submit and takes the same direct path. We do NOT use
 * requestSubmit() or dispatch a synthetic submit. This matters because the
 * optimizer registers `document.addEventListener("submit", …, true)` in the CAPTURE
 * phase — a native submit would reach that listener BEFORE React could suppress
 * propagation, producing a second Mega `form_submit`. By never firing a native
 * submit, the SOLE Mega conversion is the one explicit trackEvent in performSubmit.
 */

const inputClasses =
  "w-full rounded-[10px] border-2 border-lp-border bg-lp-ink/60 px-3.5 py-3 text-[0.95rem] text-lp-text placeholder:text-lp-muted/50 outline-none transition-colors duration-200 focus:border-lp-cyan focus:ring-2 focus:ring-lp-cyan/35";
const labelClasses =
  "font-display text-[0.78rem] font-bold uppercase tracking-[0.14em] text-lp-muted";

const SUBMIT_ERROR = `Something went wrong sending your request. Please check your connection and try again, or call us at ${PHONE_DISPLAY}.`;

// Concrete reason attached to disqualified inventory leads. Qualified leads
// carry no reason (see performSubmit) — we never fabricate one.
const DISQUALIFICATION_REASON = "Inventory is fewer than 50 vehicles";

// GTM dataLayer signal — a distinct `form_submission` event name so GTM has its
// own trigger and does not double-count the Mega `form_submit` conversion. The
// single Mega `form_submit` is emitted explicitly in performSubmit; because the
// form never dispatches a native submit event, the optimizer's capture-phase
// document listener has nothing to observe. Runs only after confirmed persistence.
function pushFormSubmission(): void {
  if (typeof window === "undefined") return;
  const w = window as typeof window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "form_submission",
    form_id: "lp-lead-form",
    form_provider: LP_SOURCE_PROVIDER,
  });
}

export function LpLeadForm({
  idSuffixHint = "lp",
}: {
  idSuffixHint?: string;
}): ReactElement {
  const reactId = useId();
  const uid = `${idSuffixHint}-${reactId.replace(/[:]/g, "")}`;
  const { submit } = useMegaLeadFormLp();

  const formRef = useRef<HTMLFormElement>(null);
  // Refs update synchronously; React state is batched, so a double-click in one
  // tick would both read submitting=false. The ref flips immediately.
  const inFlightRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inventorySize, setInventorySize] = useState("");

  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isValidEmail(email) &&
    isValidPhone(phone) &&
    inventorySize !== "";

  // Single validate-first entry point shared by the submit button and the Enter
  // key. Validates via checkValidity()/reportValidity(), then calls
  // performSubmit() DIRECTLY — no requestSubmit(), no dispatched native submit —
  // so the optimizer's capture-phase document "submit" listener never fires.
  function validateAndSubmit(): void {
    const form = formRef.current;
    if (!form) return;
    if (!canSubmit || !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    void performSubmit();
  }

  function handleClick(): void {
    validateAndSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>): void {
    // Enter inside a field would trigger a native form submit; prevent that and
    // route through the same validate-first direct-submit path so keyboard users
    // get identical behavior without any native submit event ever firing.
    if (event.key !== "Enter") return;
    if (event.target instanceof HTMLTextAreaElement) return; // allow multiline
    event.preventDefault();
    validateAndSubmit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    // Defensive only. No native submit should ever reach here — the control is
    // type="button" and Enter is intercepted in handleKeyDown — but if one is
    // somehow dispatched we cancel it and DO NOT call performSubmit(). The sole
    // Mega `form_submit` is the explicit trackEvent in performSubmit; a native
    // submit here must never become a second conversion.
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }

  async function performSubmit(): Promise<void> {
    if (inFlightRef.current || submitted) return; // synchronous gate
    if (!canSubmit) return;
    inFlightRef.current = true; // flips IMMEDIATELY, not next render
    setSubmitting(true);
    setSubmitError(null);

    const qualified = inventorySize === QUALIFYING_INVENTORY;
    const formData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      inventorySize,
      // Qualification metadata: distinguishes 50+ dealerships. Both answers
      // persist and route — this never suppresses delivery.
      qualified,
      // QA-required snake_case key. Concrete reason only when disqualified;
      // qualified leads carry null so the key is present exactly once, without a
      // fabricated reason and without a duplicate camelCase copy.
      disqualification_reason: qualified ? null : DISQUALIFICATION_REASON,
    };

    try {
      const res = await submit(formData);
      // A 2xx whose body isn't {ok:true} is still a dropped lead.
      if (res?.ok !== true) {
        throw new Error("Submission not confirmed by server.");
      }
      // Explicit, post-success Mega conversion — the SOLE `form_submit` surface
      // (the native submit event was suppressed in handleSubmit). Each field is
      // its own key per landing-page-tracking; only a confirmed lead fires it.
      if (typeof window !== "undefined" && window.MegaTag?.trackEvent) {
        try {
          window.MegaTag.trackEvent("form_submit", {
            element: `lp-lead-form-${idSuffixHint}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            inventorySize: formData.inventorySize,
            qualified: String(qualified),
            ...(qualified
              ? {}
              : { disqualification_reason: DISQUALIFICATION_REASON }),
          });
        } catch (trackErr) {
          console.warn("MegaTag.trackEvent failed:", trackErr);
        }
      }
      // Distinct GTM signal alongside the Mega conversion.
      pushFormSubmission();
      setSubmitted(true);
    } catch (error) {
      // The visitor is fine; the LEAD would be dropped. Surface a retryable
      // error, fire no analytics, keep fields editable, show no success.
      console.error("LP form submission error:", error);
      setSubmitError(SUBMIT_ERROR);
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-[14px] border border-lp-success/40 bg-lp-success/[0.07] px-6 py-10 text-center"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full border border-lp-success/50 bg-lp-success/15 text-lp-success">
          <IconCheck className="h-7 w-7" />
        </span>
        <h3 className="font-display text-[1.6rem] font-bold text-lp-text">
          Request received
        </h3>
        <p className="max-w-sm text-[0.95rem] leading-relaxed text-lp-muted">
          Thanks — your free dealership audit request is in. A BDC Promotions
          specialist will reach out shortly. Prefer to talk now? Call{" "}
          <a href={PHONE_HREF} className="font-semibold text-lp-cyan underline">
            {PHONE_DISPLAY}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate={false}
      className="flex w-full flex-col gap-4"
      aria-label="Free dealership audit request"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-firstName`} className={labelClasses}>
            First name
          </label>
          <input
            id={`${uid}-firstName`}
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-lastName`} className={labelClasses}>
            Last name
          </label>
          <input
            id={`${uid}-lastName`}
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-email`} className={labelClasses}>
          Work email
        </label>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          pattern={EMAIL_PATTERN}
          title="Enter a valid email address (e.g. you@dealership.com)"
          placeholder="you@dealership.com"
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-phone`} className={labelClasses}>
          Phone
        </label>
        <input
          id={`${uid}-phone`}
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          pattern="\(\d{3}\) \d{3}-\d{4}"
          title="Please enter a valid 10-digit phone number"
          autoComplete="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-inventorySize`} className={labelClasses}>
          How many vehicles do you currently have in your inventory?
        </label>
        <div className="relative">
          <select
            id={`${uid}-inventorySize`}
            name="inventorySize"
            required
            value={inventorySize}
            onChange={(e) => setInventorySize(e.target.value)}
            className={`${inputClasses} appearance-none pr-11 ${inventorySize === "" ? "text-lp-muted/60" : ""}`}
          >
            <option value="" disabled>
              Select inventory size
            </option>
            {INVENTORY_OPTIONS.map((option) => (
              <option key={option} value={option} className="text-lp-ink">
                {option}
              </option>
            ))}
          </select>
          <IconChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-cyan"
          />
        </div>
      </div>

      {submitError ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-[10px] border-2 border-lp-error/60 bg-lp-error/10 px-3.5 py-3 text-[0.9rem] font-medium text-[#ffd7db]"
        >
          {submitError}
        </p>
      ) : null}

      {/*
        Canonical LP submit control: a validate-first `type="button"` whose
        onClick runs client validation, then calls performSubmit() DIRECTLY — no
        requestSubmit(), no dispatched native submit — so the sole Mega
        `form_submit` fires only for a complete, valid lead and the optimizer's
        capture-phase document listener never observes a second submit. We
        intentionally do NOT use a native type="submit" button here — that would
        let empty/invalid submissions fire conversion events. (Keep
        type="button"; do not "fix" to submit.)
      */}
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting || submitted}
        className="mt-1 inline-flex min-h-[54px] w-full items-center justify-center rounded-[10px] bg-gradient-to-br from-lp-cyan to-lp-blue px-6 py-3.5 font-display text-[1.05rem] font-extrabold uppercase tracking-[0.02em] text-[#03101b] shadow-[0_12px_34px_rgba(14,112,255,0.28)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(25,200,255,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lp-text focus-visible:ring-offset-2 focus-visible:ring-offset-lp-panel active:translate-y-0 active:from-lp-active active:to-lp-active disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Get My Free Dealership Audit"}
      </button>

      <p className="text-center text-[0.78rem] leading-relaxed text-lp-muted/80">
        No obligation. Your details go straight to our team and are never sold.
        Prefer to talk?{" "}
        <a href={PHONE_HREF} className="font-semibold text-lp-cyan">
          {PHONE_DISPLAY}
        </a>
      </p>
    </form>
  );
}

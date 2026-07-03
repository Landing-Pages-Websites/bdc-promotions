"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { trackEvent } from "@/lib/track";
import { siteConfig } from "@/site.config";

type SubmitState = "idle" | "submitting" | "error";

interface LeadPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

async function submitLead(payload: LeadPayload): Promise<void> {
  const response = await fetch(siteConfig.formEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Lead submit failed with status ${response.status}`);
  }
}

const inputClasses =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

/**
 * Lead capture form. POSTs JSON to siteConfig.formEndpoint, fires
 * lead_form_submit to all loaded analytics destinations, then redirects to
 * siteConfig.thankYouPath.
 */
export function LeadForm(): ReactElement {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: LeadPayload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    setState("submitting");
    try {
      await submitLead(payload);
      trackEvent("lead_form_submit");
      router.push(siteConfig.thankYouPath);
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="lead-name" className="text-sm font-medium">
          Name
        </label>
        <input id="lead-name" name="name" type="text" required autoComplete="name" className={inputClasses} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="lead-email" className="text-sm font-medium">
          Email
        </label>
        <input id="lead-email" name="email" type="email" required autoComplete="email" className={inputClasses} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="lead-phone" className="text-sm font-medium">
          Phone
        </label>
        <input id="lead-phone" name="phone" type="tel" autoComplete="tel" className={inputClasses} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="lead-message" className="text-sm font-medium">
          Message
        </label>
        <textarea id="lead-message" name="message" rows={4} required className={inputClasses} />
      </div>
      {state === "error" ? (
        <p role="alert" className="rounded-md border border-red-600 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
          Something went wrong sending your message. Please try again, or
          contact us directly at {siteConfig.contact.phone}.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={state === "submitting"}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {state === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

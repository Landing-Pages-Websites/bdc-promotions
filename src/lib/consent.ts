/**
 * Consent state shared by the banner and the analytics loaders.
 * Persisted in localStorage; changes broadcast via a window event so every
 * subscriber (banner, GA, GTM, PostHog) reacts without a page reload.
 */

export type ConsentStatus = "unset" | "accepted" | "declined";

export const CONSENT_STORAGE_KEY = "site-consent";
const CONSENT_CHANGE_EVENT = "site-consent-change";

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") {
    return "unset";
  }
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "accepted" || stored === "declined" ? stored : "unset";
  } catch {
    // localStorage can throw in private browsing modes; treat as no consent.
    return "unset";
  }
}

export function setConsentStatus(status: Exclude<ConsentStatus, "unset">): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch {
    // Persisting failed; still broadcast so loaders behave for this session.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function subscribeToConsent(callback: () => void): () => void {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
}

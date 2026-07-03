"use client";

import { useSyncExternalStore } from "react";
import {
  getConsentStatus,
  setConsentStatus,
  subscribeToConsent,
  type ConsentStatus,
} from "@/lib/consent";

export interface UseConsentResult {
  /** "unset" until the visitor chooses (and always "unset" during SSR). */
  status: ConsentStatus;
  accept: () => void;
  decline: () => void;
}

function getServerSnapshot(): ConsentStatus {
  return "unset";
}

/** Reactive consent state — analytics loaders gate on status === "accepted". */
export function useConsent(): UseConsentResult {
  const status = useSyncExternalStore(
    subscribeToConsent,
    getConsentStatus,
    getServerSnapshot,
  );

  return {
    status,
    accept: () => setConsentStatus("accepted"),
    decline: () => setConsentStatus("declined"),
  };
}

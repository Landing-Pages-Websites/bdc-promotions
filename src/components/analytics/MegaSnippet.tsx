"use client";

import type { ReactElement } from "react";
import { useConsent } from "@/components/consent/useConsent";

const MEGA_SNIPPET_ID = process.env.NEXT_PUBLIC_MEGA_SNIPPET_ID;

/**
 * Mega tracking snippet loader. Wiring (env var + consent gate) is in place;
 * the actual snippet is pending.
 */
export function MegaSnippet(): ReactElement | null {
  const { status } = useConsent();

  if (!MEGA_SNIPPET_ID || status !== "accepted") {
    return null;
  }

  // TODO(mega): replace with actual Mega Snippet line — awaiting from Peter
  return null;
}

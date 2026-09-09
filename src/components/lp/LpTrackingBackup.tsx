"use client";

import type { ReactElement } from "react";
import { useTrackingLp } from "@/hooks/useTrackingLp";

/**
 * React dedup/backup layer for the optimizer (guards on the script id so it
 * never double-loads). The primary load is the inline tags in the LP layout.
 */
export function LpTrackingBackup(): ReactElement | null {
  useTrackingLp();
  return null;
}

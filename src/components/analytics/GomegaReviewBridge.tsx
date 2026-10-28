import type { ReactElement } from "react";

const GOMEGA_REVIEW_BRIDGE_SOURCE =
  "https://app.gomega.ai/review-bridge/latest/review-bridge.js";

export function GomegaReviewBridge(): ReactElement {
  return (
    <script
      src={GOMEGA_REVIEW_BRIDGE_SOURCE}
      crossOrigin="anonymous"
      defer
    />
  );
}

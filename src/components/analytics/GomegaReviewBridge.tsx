import type { ReactElement } from "react";

const GOMEGA_REVIEW_BRIDGE_SOURCE =
  "https://app.gomega.ai/review-bridge/v4/review-bridge.js";
const GOMEGA_REVIEW_BRIDGE_INTEGRITY =
  "sha384-TWiiCKVSJzu92YjNDVu/A8HtnwVY8JTMkRUOCZRgi59PfAXr6Ya06VSizDsbEP9L";

export function GomegaReviewBridge(): ReactElement {
  return (
    <script
      src={GOMEGA_REVIEW_BRIDGE_SOURCE}
      integrity={GOMEGA_REVIEW_BRIDGE_INTEGRITY}
      crossOrigin="anonymous"
      defer
    />
  );
}

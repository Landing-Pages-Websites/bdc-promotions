import type { ReactElement } from "react";

const GOMEGA_REVIEW_BRIDGE_SOURCE =
  "https://app.gomega.ai/review-bridge/v1/review-bridge.js";
const GOMEGA_REVIEW_BRIDGE_INTEGRITY =
  "sha384-e+tDMiCLKMzL5fTMLVKEg2xAWTNzUZt+V+mo5WoMLZeijU/HS4Mt6qQj/SvE6/zi";

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

import type { ReactElement } from "react";

const GOMEGA_REVIEW_BRIDGE_SOURCE =
  "https://app.gomega.ai/review-bridge/v3/review-bridge.js";
const GOMEGA_REVIEW_BRIDGE_INTEGRITY =
  "sha384-jpRb6pw0QCmjXc3ZKH3g3/XxhoVmpPO4TaQkZE04gfzvKc2bQD2hbSD8DavN6oSb";

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

import type { ReactElement } from "react";

const GOMEGA_REVIEW_BRIDGE_SOURCE =
  "https://app.gomega.ai/review-bridge/v6/review-bridge.js";
const GOMEGA_REVIEW_BRIDGE_INTEGRITY =
  "sha384-nc3lydHgACX1I4grJK8tx+cbhMQEJhzmiAEbB9GdkXPVDtFYEJvegLSKbbT3pJAn";

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

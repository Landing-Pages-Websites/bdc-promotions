import type { ReactElement } from "react";
import Script from "next/script";

/**
 * Mega optimizer script (lead capture, conversion tracking, form-field
 * capture via input `name` attributes).
 *
 * INTENTIONALLY NOT CONSENT-GATED: this is the business-critical
 * lead-capture/optimizer script — gating it behind the cookie banner would
 * drop leads. Decision made by Peter's assistant; flagged for review.
 * GA4/GTM/PostHog remain consent-gated.
 */
export function MegaSnippet(): ReactElement {
  return (
    <Script
      src="https://cdn.gomega.ai/scripts/optimizer.min.js"
      strategy="afterInteractive"
    />
  );
}

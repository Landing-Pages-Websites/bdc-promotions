/**
 * Central config for the BDC Promotions paid landing page (`/lp`).
 *
 * The two deploy placeholders live ONLY here (and are re-exported to the hook /
 * layout) so the orchestrator can swap them in one place after
 * `mega site-tracking enable`. Do NOT inline these strings elsewhere.
 *
 *   LP_SITE_ID  → "SITE_ID_PLACEHOLDER"      (form submission `site_id`)
 *   LP_SITE_KEY → "sk_site_key_placeholder"  (MegaTag `siteKey`)
 *
 * Everything else here is a real, task-provided value and must NOT be treated
 * as a placeholder.
 */

/** Deploy placeholder — replaced post-registration. Isolated on purpose. */
export const LP_SITE_ID = "SITE_ID_PLACEHOLDER";
/** Deploy placeholder — replaced post-registration. Isolated on purpose. */
export const LP_SITE_KEY = "sk_site_key_placeholder";

/** Real, task-provided identifiers. */
export const LP_CUSTOMER_ID = "9951b3b9-96d6-4185-a938-f509cd50ae67";
export const LP_SOURCE_PROVIDER = "bdc-promotions-landing-free-audit";
export const LP_GTM_ID = "GTM-58F655CG";
export const LP_META_PIXEL_ID = "1428646815833636";

export const LP_SUBMIT_ENDPOINT = "https://analytics.gomega.ai/submission/submit";

/** Authored phone source / forwarding number — every visible string + tel: href. */
export const PHONE_DISPLAY = "352-207-1074";
export const PHONE_HREF = "tel:+13522071074";

/** CTA copy — the button label stays identical everywhere it appears. */
export const PRIMARY_CTA = "Get My Free Dealership Audit";
export const PHONE_CTA = `Call ${PHONE_DISPLAY}`;

/** Anchor of the lower conversion form; every form CTA scrolls here. */
export const FORM_ANCHOR = "#get-started";

/** Inventory qualifier — the one select on the form. */
export const INVENTORY_OPTIONS = ["Fewer than 50", "50 or more"] as const;
export type InventorySize = (typeof INVENTORY_OPTIONS)[number];
export const QUALIFYING_INVENTORY: InventorySize = "50 or more";

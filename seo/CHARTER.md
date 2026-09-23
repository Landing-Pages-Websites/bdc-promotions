# SEO Charter — BDC Promotions (bdcpromotions.com)

**Created:** 2026-09-23  ·  **Last refreshed:** 2026-09-23  ·  **Owner:** [OWNER]
**Confidence:** provisional — built from repository evidence only; no Phase 1–3 diagnosis has run.
**Data access:** GSC no · GA4 no · CRM/leads no · crawl no
> Missing access ⇒ §2–§4 are provisional. Nothing below is a measured metric.

---

## 1. Identity & business model

- **What the site sells / does:** automotive marketing for car dealerships — ad creative (static, event, inventory, video), paid-social campaign optimization, BDC follow-up and AI-supported nurturing toward scheduled appointments. (source: `src/components/review/content.ts`, `content-sources.json`, as of 2026-09-23)
- **Who it serves:** dealership owners / GMs / marketing managers (B2B).
- **Highest-value conversions (ranked):** 1) free dealership marketing audit request (`/lp#get-started`), 2) phone call (352) 207-1074.
- **Relative value by service:** stated monthly prices — Lead Gen + BDC Team $5,000; Lead Generation $2,500; Live BDC Agent Team $2,500; Luxury Video $750 (source: `src/components/review/content.ts`).
- **Target markets:** U.S. dealerships across multiple states; no specific state list is claimed (source: `content-sources.json` record `target-states-faq`).
- **Archetype:** national B2B service / lead-gen.
- **Life-cycle stage:** pre-approval homepage redesign (review branch `awb-home-build`).
- **Right-to-win / wedge:** real, customer-supplied dealership creative plus BDC follow-up, sold as separable services.

## 2. Current SEO standing — *as of 2026-09-23*

- **Health state:** unknown — not diagnosed (no GSC/crawl access this session).
- **Primary failing constraint:** unknown.
- **Note:** the homepage review routes (`/`, `/variant-a`, `/variant-b`, `/variant-c`) are `noindex, nofollow` design-review pages, not the ranking surface.

## 3. Targeting — current vs. intended

- **Intended:** commercial / transactional (audit request + call). Informational articles exist under `content/blog/`.
- **VERDICT (provisional):** keep homepage copy commercial and claim-safe; do not add informational content to the homepage. Confirm with a real Phase 1–3 diagnosis before any content-at-scale work.

## 4. Topical-authority state

- Not assessed.

## 5. Money pages & conversion paths

- `/lp` (paid landing page with the Mega lead form) — the audit CTA target for every homepage direction.
- Phone `tel:+13522071074` on every direction.

## 6. The directive

- **Fix NOW:** nothing SEO-specific in the homepage-review scope.
- **DO-NOT-DO:** no invented statistics, testimonials, client logos or outcome claims; no guarantee language (the FAQ states results are not guaranteed); no new homepage sections added for SEO while the design is in client review.

## 7. Uncertainties / missing data

- GSC/GA4 standing, indexed pages, ranking queries and competitors — resolve with `seo-orchestrator` Phases 1–3 once a homepage direction is approved.

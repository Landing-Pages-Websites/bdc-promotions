# SEO Journal — BDC Promotions (bdcpromotions.com)

> Newest entry on top. Every entry: what ran · findings (tagged) · what changed · what's pending · next review.

---

## 2026-09-23 (evening) — Review routes finalized; audit CTA anchor fixed

- **Trigger / request:** finish the three-direction homepage review; PR + merge into `awb-home-build`.
- **Skills / tools used:** homepage-workflow, design-psyche, seo-content-protocol (claim rules).
- **Phase(s) (§23):** 7 Implementation & QA (review routes only).
- **Findings:**
  - `[fact]` The shared audit CTA pointed at `/lp#lead-form`, an id that does not exist on `/lp` (fragment silently ignored). Now `/lp#get-started`, the /lp audit-form section; a smoke test asserts the id exists.
  - `[fact]` Direction C drops build vocabulary ("customer-supplied") from visible copy and alts, restates no dealer financing terms (Truth-in-Lending trigger terms), and excludes the unverified "15 years" claim.
  - `[fact]` Review routes remain `noindex, nofollow`; sitemap lists `/`, `/variant-a`, `/variant-b`, `/variant-c` on this review branch only.
- **Changed / produced:** `src/components/review/**`, `src/app/variant-c/`, chooser, `content.ts` auditHref.
- **Decision & rationale:** no SEO content added; `main` (live site) untouched.
- **Charter updated?** §1 conversion anchor.
- **Pending / next action:** after a direction is approved and productionized, run the real Phase 1–3 diagnosis.
- **Next review date + KPI to watch:** post-approval — audit-form submissions from homepage CTAs.

---

## 2026-09-23 — Homepage review directions A/B refined, C added (no SEO content change)

- **Trigger / request:** make homepage directions A and B match the two supplied design images word-for-word; add a stronger third direction C.
- **Skills / tools used:** seo-orchestrator (recall gate), seo-content-protocol (claim rules), homepage-workflow.
- **Phase(s) (§23):** 0 Intake only.
- **Findings:**
  - `[fact]` No `seo/CHARTER.md` existed; a provisional Charter was created from repository evidence.
  - `[fact]` Review routes are `robots: noindex, nofollow`; they are not a ranking surface.
  - `[fact]` All homepage copy comes from the supplied design images and the verified copy in `src/components/review/content.ts` / `content-sources.json`.
- **Changed / produced:** `seo/CHARTER.md` (provisional), this entry. Homepage review components under `src/components/review/`.
- **Decision & rationale:** no new claims, statistics, testimonials or informational sections were added. Copy parity with the client's images takes precedence during the pre-approval stage.
- **Charter updated?** created (§1, §3, §5, §6 provisional).
- **Pending / next action:** run the real Phase 1–3 diagnosis once a direction is approved and productionized.
- **Next review date + KPI to watch:** after homepage approval — indexed pages and commercial-query impressions in GSC.

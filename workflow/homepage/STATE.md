# Homepage workflow state — BDC Promotions

**Status:** READY_TO_PUSH — all review rounds complete; commit/PR/merge in progress
**Updated:** 2026-09-23

## Source
- Remote: https://github.com/Landing-Pages-Websites/bdc-promotions.git
- Base commit: `31e2b47d9ef14f1b54e76bd5e52c9d96d4719f95` (tip of `origin/awb-home-build`, 2026-09-17)
- Working branch: `review/homepage-abc-2026-09-23` (created from the base commit; clean start, no user edits)
- Push authorization (user, 2026-09-23 18:02 PKT): asked "push every thing to main"; after being shown that main is the live site (its `/` would become the noindex review chooser, sitemap trimmed, 10 newer main commits unmerged), the user chose: **push to `origin/awb-home-build` (fast-forward) after the full review workflow completes**. Do NOT push or merge to `main`.
- User, 18:45 PKT: "create a PR and merge" → PR from `review/homepage-abc-2026-09-23` into **`awb-home-build`** (base set explicitly; repo default is `main`), merged after the full review completes, consistent with the 18:02 choice. gh: authenticated as hydershah, WRITE, `awb-home-build` unprotected. Commit author per global rule: Hyder Shah <hyder12257@gmail.com>.

## Route mapping
| Variant | Route | Component | Reference |
|---|---|---|---|
| A · Signal Lane | `/variant-a` | `src/components/review/variant-a/SignalLane.tsx` | `workflow/homepage/refs/variant-a-ref.png` (image 1, dark) |
| B · Dealer Field Journal | `/variant-b` | `src/components/review/variant-b/DealerFieldJournal.tsx` | `workflow/homepage/refs/variant-b-ref.png` (image 2, light) |
| C · (new) | `/variant-c` | `src/components/review/variant-c/` | none (design-psyche reference set) |
| Chooser | `/` | `src/app/page.tsx` | — |

## Reference images
| File | Size | SHA-256 | Scope |
|---|---|---|---|
| refs/variant-a-ref.png | 1536×5696 | 2f7e715b68d066b208f7ecab30efc4171eb2106e72ad6da7addd7db89fde4d53 | full page |
| refs/variant-b-ref.png | 1536×5696 | 14e00ed23ed6b01475d31d37385ccd9d9f0d7b7570c5eaa314afcfd9b1e0d9dd | full page |

Mapping evidence: image 1 matches the existing dark condensed "Signal Lane" build (A); image 2 matches the light serif "Dealer Field Journal" build (B). Both are full-page desktop mockups. Assumed CSS width 1536 at DPR 1 (no metadata; body text measures ~20px, H1 ~100px, plausible at 1×). Native comparison captures use `screenshot1536.mjs` (1536×864, DPR 1).

## Facts source
Verified copy: `src/components/review/content.ts`, `content-sources.json`, `task-spec.json`. Wording per variant follows its image exactly (user instruction, 2026-09-23).

## Assets added
- `public/images/design/variant-a/growth-source-work.png` — composite of the customer's own luxury campaign pixels restacked (script `workflow/homepage/scripts/compose-source-work.py`), sha256 dd21ed43…
- `public/images/design/variant-a/proof-headlight.jpg` — AI-generated (Codex image_gen `gpt-5.6-terra` via design-psyche `generate-image.sh`), mirrored + desaturated to match image 1's proof photo. Raw: `workflow/homepage/generated/proof-headlight-raw.png` (sha256 49443606…). Illustrative, not proof; no brand, person or text.

## Environment
- Dev server: `ALLOW_TODO=1 npx next dev -p 3417` (pid 84828), http://localhost:3417
- Baseline screenshots: design-psyche `screens/bdc-a-baseline`, `screens/bdc-b-baseline` (1440/1280/390)
- Baseline tests: `node --test scripts/*.test.mjs` 71 tests, 64 pass, **7 pre-existing failures** all in `scripts/src-propagation.test.mjs`; `tsx --test src/**/*.test.ts` 170/170 pass.

## Decisions
- A/B rebuilt section-by-section against the images (baseline composition differed materially in every section).
- Seo: provisional `seo/CHARTER.md` + `seo/JOURNAL.md` created; no SEO content change.

## Known pre-existing issues (not in scope)
- Dev-only React hydration warning on `<head dangerouslySetInnerHTML>` (review bridge v7). Bridge is pinned plumbing (tests assert exact string) — untouched.

## Coordinator-owned changes so far
- `src/app/variant-c/page.tsx` (new route), placeholder `src/components/review/variant-c/VariantC.tsx`
- `public/review-routes.json`, `src/app/sitemap.ts` REVIEW_ROUTES + comment, `scripts/seo-defaults.test.mjs` (route string), `scripts/managed-site-starter.test.mjs` (routes + href variant-c)
- `DESIGN.md`, `seo/CHARTER.md`, `seo/JOURNAL.md`, workflow docs

## Runs
- Build workflow `wf_e9ee6df1-e76` (A builder, B builder, C research → C builder) — started 2026-09-23 ~16:25 PKT.

- Build workflow finished (~17:27 PKT): A final `bdc-a-build-final` (diff 16.88% diag.), B final `bdc-b-build-final2` (9.82% diag.), C "Proof Wall" `bdc-c-build-r5`. Builder notes: `workflow/homepage/notes/{A,B,C}-build.md`.
- Chooser updated with C card; `npm run build` (no ALLOW_TODO) passes; prod server `next start -p 3418`.
- Tests after routes/chooser: scripts 64/71 (same 7 pre-existing failures), src 170/170; `npm run lint` 0 errors, 2 pre-existing warnings in packages/.
- Round-1 captures (prod): `bdc-r1-{a,b,c}` (1440) and `bdc-r1-{a,b,c}-1536`; section pairs in `workflow/homepage/reviews/r1/pairs/`.
- Review round 1 workflow `wf_aeffb5d4-f76` (fidelity A/B, critic A/B/C, blind rank 13 folds; mapping private in scratchpad).

- Round-1 results (reports in `workflow/homepage/reviews/r1/`):
  - fidelity A CHANGES_REQUIRED (typo 7, mobile 6); critic A FAIL (typo 6, mobile 6, brief 7) — legibility floor, close H2, "$", work plate artifacts, dead "Explore the work", mobile hero.
  - fidelity B CHANGES_REQUIRED (mobile 6: arrow rule strikes growth intro); critic B FAIL (nowrap overruns at 1280/1440, mobile 5).
  - critic C FAIL (typo 6, spacing 6, restraint 5, mobile 5; V165; mono layer; filler sections).
  - Blind rank (13 folds): A 4th, C 7th, B 9th → C gate FAILED (must beat A and B, outside bottom third).
- Firefox finding (coordinator): B hero H1 ~17px lower (no text-box trim) → added to B fixes.
- `workflow/homepage/scripts/capture.mjs` added (dismiss banner, load all images, full-page, chromium/firefox/webkit).
- Fix round 1 workflow `wf_d79f35af-4a0` (fix:A, fix:B, fix:C).

- Fix round 1 done (~18:24 PKT): reports `workflow/homepage/notes/{A,B,C}-fix-r1.md`; ledger merged (A 30 rows, B 22 rows); capture.mjs now skips hidden lazy images.
- Prod rebuilt + restarted on 3418. Round-2 captures `workflow/homepage/reviews/r2/shots/` — all 18 clean (0 broken, 0 overflow, 0 errors); flags `bdc-r2-{a,b,c}` (A 24 sizes, B 33, C 9 incl. banner/skip-link).
- Review round 2 workflow `wf_fff19c74-cee` (fresh fidelity A/B, critic ×3, blind rank reshuffled; mapping private).

- Round-2 results (`workflow/homepage/reviews/r2/`): fidelity A CHANGES_REQUIRED (mobile storyboard slice; desktop at PASS level); fidelity B PASS; critic A FAIL (mobile 7: no creative in 390 fold, 320 arrow collisions); critic B FAIL only on shared banner Decline 1.05:1; critic C FAIL narrow (mask fades captions below AA; "Customer-supplied" build label V167; image floor 36% vs 37% at 1536).
- Blind rank r2: **C #1, A #2, B #4 of 13 → rank gate PASSED** (judge: C wins on content, on craft alone ≈10th).
- Coordinator fixed shared banner (ConsentBanner.tsx: Decline text colour, 44px buttons) — logged in DEVIATIONS "Shared plumbing".
- Fix round 2 workflow `wf_c20b007b-3a5` — all three fixers hit the session limit mid-way (most edits applied, no reports). State verified intact (routes 200, eslint clean, tsc 0).
- Local checkpoint commit `d99b5b5` (not pushed) + `workflow/homepage/.gitignore` (bulk evidence PNGs in comparisons/ and reviews/ stay local; ~700MB).
- Fix round 2 resumed: workflow `wf_80ebde01-bd5` (fix2r:A/B/C, told what was already applied).

- Fix round 2 resumed and completed (`wf_80ebde01-bd5`): reports `notes/{A,B,C}-fix-r2.md`; ledger +16 rows (A/B).
- Prod rebuilt; round-3 captures `workflow/homepage/reviews/r3/shots/` all clean (21 captures: 0 broken, 0 overflow, 0 errors); flags `bdc-r3-{a,b,c}`.
- Final review round 3 workflow `wf_85bd291d-09c` (fresh reviewers; rank reshuffled, mapping private).
- Verification on final code: lint 0 errors / 2 pre-existing warnings; scripts tests 64/71 (same 7 pre-existing failures); src tests 170/170; tsc 0; `workflow/homepage/scripts/smoke.mjs` 60/60 at 1440 + 390 (prod).
- Found + fixed pre-existing bug: shared `auditHref` was `/lp#lead-form` but /lp has no such id (fragment ignored). Now `/lp#get-started` (the /lp audit form section). Smoke test now asserts the target exists. Visual-neutral change → needs prod rebuild + smoke re-run.

- Final review round 3 (`wf_85bd291d-09c`): fidelity A PASS; critic A/B/C PASS (all ≥8, 0 AI tells); blind rank C 2 · A 5 · B 7 → C gate PASS; fidelity B CHANGES_REQUIRED (761–1179px scaled comp) → fixed post-round (B breakpoint 760→1179, kicker 12px, tab links 44px) and verified by measurement (tablet probe; 1536 + 390 pixel-identical). Also fixed: skip link 44px (shared), C alt "four vehicles".
- Final verification: build ✓, tsc 0, lint 0 errors, src 170/170, scripts 64/71 locally (7 fail only because of spaces in the local path — 71/71 from a space-free copy), smoke 62/62 (prod).
- `workflow/homepage/REPORT.md` written; curated evidence `workflow/homepage/screens/final/` (8.3MB).

## Next action
Squash local WIP into one commit (author Hyder Shah) → push `review/homepage-abc-2026-09-23` → `gh pr create --base awb-home-build` → wait for CI → merge → record result here.

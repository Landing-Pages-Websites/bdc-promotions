# Homepage workflow state — BDC Promotions

**Status:** READY_TO_MERGE — C3: C Daylight, D Nightfall and E Contrast ported and verified (3 review rounds + coordinator fixes); PR #29 → `awb-home-build`
**Updated:** 2026-09-24

> **Resume here (C3, 2026-09-24):** see the section "C3 — five directions" at the bottom. Everything above it is the history of the A/B/C round merged in PR #28.

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

## C3 — five directions (2026-09-23 → 24)

**Owner reactions (verdicts V210/V211 in design-psyche):**
- C2 "Lot Lines" rejected: "proportionality, placing, spacing, overall design still off"; they asked for **12–15 nicely designed sections**. They view on a **2560×1440 DPR-1** monitor.
- "Change the colour from off-white and yellow to **pure white and the logo blue**" (sampled `#0059FC`, 5.48:1 with white text).
- "Add all of these mockups to the homepage", which makes five: A, B + **C Daylight, D Nightfall, E Contrast**.
- "Create a PR and merge": PR #29 is opened into `awb-home-build`. Merge once C/D/E are ported and verified. Never merge into `main`.

**Isolation:**
- Session bdc-promotions-56 owned C2 in the original folder (uncommitted, idle since 23:58). Two pause requests expired unapproved.
- C3 therefore lives in its own worktree: `../BDC promotions c3`, branch `review/homepage-c3-2026-09-24`, based on `origin/awb-home-build` 2b6fe9a.
- The original folder is untouched.

**Environment:**
- Worktree dev: `ALLOW_TODO=1 npx next dev -p 3419`.
- The workspace package must be built once per worktree: `npm --workspace @landing-pages-websites/managed-site-contract run build`. Otherwise tsc shows 60 false errors.
- Prototypes are served at `http://127.0.0.1:4455/proto-<key>/` (static server, session scratchpad `c3/`).

**Exploration workflow `wf_2d4897bd-f38`** (scratchpad `c3/`):
- `VERIFIED-COPY.md` (the copy deck, with exclusions).
- Research: `REFERENCES-{niche,service,work}.md`, covering 6 niche competitors and about 29 excellence sites.
- Three full-page prototypes (13–14 sections each), each built → critic → revise.
- The weekly limit interrupted it at the revise step; it was resumed at 01:46.

**Port workflow `wf_25060125-90b`:**
- The contract is `workflow/homepage/c3/PORT.md`.
- Per route: palette pass → port → band diff vs prototype → density/tsc/eslint/overflow → critic → fix → critic → fix.
- Then a blind fold rank (15 = 5 routes + the frozen v2 set; mapping in scratchpad `rank-private/`) and a full-page owner-lens judge (5 routes + hvacfound, Collective, Designjoy).
- Notes go in `workflow/homepage/c3/notes/`, shots in `workflow/homepage/c3/shots/<x>/`.

**Committed:**
- `8296b5b`: `/variant-d` and `/variant-e` routes (placeholders), a five-card chooser, review-routes.json, sitemap and contract tests.
- The shared HD assets in `public/images/design/shared/`: retouched night photo 3840w, native WebP creatives including the wholesale ad.
- PORT.md and provenance.
- Checks: tsc 0, lint 0 errors, src 170/170, scripts 64/71 (the known path-with-spaces 7), build ✓.

**Pushed so far (PR #29):**
- `8296b5b` plumbing.
- `becc35b`, `8a4b999` and `43a8624` put the static prototypes live at `/prototypes/<name>/index.html`: first as-is, then white and blue, then with the broken image paths fixed. These are temporary and are removed before the merge.
- Preview: https://bdc-promotions-automated-build-git-review-0db8ff-mega-websites.vercel.app. The `bdc-promotions-git-…` alias is behind Vercel SSO.

**Exploration judges (prototypes, blind; P1 Contrast, P2 Nightfall, P3 Daylight):**
- Owner lens: Daylight 1st of 7, above hvacfound.
- GM lens: Daylight, then Nightfall, then Contrast.
- Craft lens: Nightfall 3rd, Contrast 4th, Daylight 5th.
- Every judge flagged the per-photo "Illustrative photograph" chips and the guardrail copy. Both are now banned in PORT.md §4.

**Port workflow `wf_25060125-90b`** (port → critic → fix → critic → fix):
- Critic round 2 returned FAIL for all three (scores 5–8); fix round 2 applied.
- Blind full-page owner judge, routes against hvacfound, Collective and Designjoy: **D 1st of 8 and the only page "approved on sight"**, E 3rd, C 5th, A 7th, B 8th.
- C's "empty images" came from the capture tool (screenshot.mjs scrolls too fast). Production loads every image.
- Blind fold rank against the frozen v2 set (car-brand photo heroes): C, D and E finished 11th–13th of 15, all in the bottom third. That set was frozen for C2's photo-led thesis; this is reported, not re-picked.

**Production probe** (`next start -p 3420`, scratchpad `c3/probe.mjs`):
- All five routes hydrate.
- 0 console errors and 0 broken images at 1440 and 390.
- 0 overflow, and one h1 on each route.
- E's mobile bar at z-60 covered the consent banner's "Got it", so the banner could not be dismissed. The coordinator set it to z-40.
- Headless Chromium does not hydrate on the **dev** server. That is an environment quirk only.

**Checks after round 2:** tsc 0, lint 0 errors (density.mjs unused import removed), build passing.

**Round 3 (final) `wf_ae6ff1bc-dc8`:**
- Required fixes for the owner judge's findings: no testimonial promise, pure-white grounds, C hero photo scale and blue primary CTAs, D pillar descriptors, fold, work tiles and mobile length, E dark share, no AI services photo, work captions and fold card.
- Then fresh final critics and a re-run of the page judge.

**Round 3 + coordinator (2026-09-24 05:3x):**
- Final critics: C PASS, E PASS. D failed on its Work plates hugging their ads (V210); the coordinator fixed it and measured aligned edges at 1280/1440/1920/2560, with Meta/VLA capped at 460/420.
- Blind page judge re-run: E 1st and D 2nd (both approved on sight), C 3rd, then hvacfound, Collective, Designjoy, A, B.
- The coordinator also added Escape handling to D's menu and removed `public/prototypes/`.
- Production: all 5 routes hydrate, 0 broken images, 0 overflow, 1 h1, density 0 soft (c/d/e), and the menus close on a link tap and on Escape.
- Checks: tsc 0, lint 0 errors, src 170/170, scripts 64/71 (the known 7), build passes.
- The review-bridge script (app.gomega.ai) can hit CORS on localhost origins. It sits in the shared root layout, is untouched, and must be verified on the Vercel preview.
- REPORT.md now has a C3 section, and seo/JOURNAL.md has an entry.

## Next action
1. Commit and push to PR #29.
2. Wait for CI and the 3 Vercel checks.
3. Verify the preview routes (200, review bridge loads).
4. Merge PR #29 into `awb-home-build`; the owner said "create a PR and merge".
5. Post the links.

Open owner questions:
- a real hero vehicle photo instead of the AI render;
- the email domain `bdc-promotions.com` vs `bdcpromotions.com`;
- whether the dealer names inside the ads are approved.

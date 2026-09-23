# Homepage review — BDC Promotions (A · B · C)

Date: 2026-09-23 · Base: `origin/awb-home-build` @ `31e2b47` · Branch: `review/homepage-abc-2026-09-23`

## Routes

| Route | Direction | Source of truth |
|---|---|---|
| `/` | Chooser (A, B, C cards) | — |
| `/variant-a` | **A · Signal Lane** (dark, condensed, electric route) | image 1 → `refs/variant-a-ref.png` |
| `/variant-b` | **B · Dealer Field Journal** (paper, editorial serif) | image 2 → `refs/variant-b-ref.png` |
| `/variant-c` | **C · Proof Wall** (new: concrete + tail-light red; all real ads and all four prices on one wall) | `C-BRIEF.md` (design-psyche references) |

All review routes are `noindex, nofollow`; the review bridge renders exactly once in the root head.

## Screenshots (production build)

Curated in `screens/final/`:

| | Desktop fold 1440 | Desktop full 1536 | Mobile full 390 |
|---|---|---|---|
| A | `a-desktop-fold-1440.png` | `a-desktop-full-1536.jpg` | `a-mobile-full-390.jpg` |
| B | `b-desktop-fold-1440.png` | `b-desktop-full-1536.jpg` | `b-mobile-full-390.jpg` (+ `b-tablet-full-1024.jpg`) |
| C | `c-desktop-fold-1440.png` | `c-desktop-full-1536.jpg` | `c-mobile-full-390.jpg` |

Full-resolution round-3 captures, 1536/1440/1280/390/320 (local, not committed): `reviews/r3/shots/`. Baselines before this work: `screens/baseline/`.

## Design system

`design-psyche`. A and B are locked to the supplied images; every departure is logged in
`DEVIATIONS.md`. C was built through the full loop: ten axes → a live niche SERP (9 dealer-agency
homepages) → 10 axis-matched excellence references → Superside fold reproduced
(`design-psyche/psyche/compositions/work-wall-split/`) → transplant → blind rank.

## Review results

Fresh, independent reviewers each round. The builders never judged their own work.

| Round | Fidelity A | Fidelity B | Critic A | Critic B | Critic C | Blind rank (of 13) |
|---|---|---|---|---|---|---|
| 1 | CHANGES_REQUIRED | CHANGES_REQUIRED | FAIL | FAIL | FAIL | A 4 · C 7 · B 9 → **C gate fail** |
| 2 | CHANGES_REQUIRED | PASS | FAIL | FAIL (shared banner only) | FAIL (narrow) | **C 1** · A 2 · B 4 |
| 3 (final) | **PASS** (9/9/8/8/9) | CHANGES_REQUIRED¹ | **PASS** (all ≥8) | **PASS** (all ≥8) | **PASS** (all ≥8, 0 AI tells) | **C 2** · A 5 · B 7 → **gate pass** |

¹ Fidelity-B's only blocker in round 3: between 761 and 1179px, B showed the scaled-down desktop layout, with text at 7.8–9px and targets at 32–43px. I fixed this after round 3 by switching to B's single-column layout below 1180px, matching A. This fix was checked by measurement, not by a fourth review round:
- **Probe at 768, 820, 1024 and 1179:** no target is under 44px. The only text under 12px is the two decorative, screen-reader-hidden margin labels.
- **1536 and 390:** B's renders are **pixel-identical** before and after the change (0 changed pixels).

Blind-rank note (round 3): the judge put C 2nd, behind Superside. It called C "the most complete answer for a dealer comparing vendors". In round 2 the judge was explicit that C wins on **content** (real ads, prices, CTA), not craft; on craft alone it would rank about 10th. The reference folds and our three folds were reshuffled every round, and the judge never saw the key.

Reports: `reviews/r1/`, `reviews/r2/`, `reviews/r3/` (`fidelity-*.md`, `critic-*.md`, `rank-blind.md`).
Diagnostic full-page pixel difference at 1536, not a pass metric:

| Variant | Baseline | Final |
|---|---|---|
| A | 39.7% | 15.0% |
| B | 33.9% | 9.6% |

## Technical checks (final code)

| Command | Result |
|---|---|
| `npm run build` (prebuild `check-config`, no `ALLOW_TODO`) | ✓ compiled; all routes static |
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run lint` | 0 errors, 2 warnings (pre-existing, `packages/managed-site-contract`) |
| `npx tsx --test "src/**/*.test.ts"` | 170/170 pass |
| `node --test scripts/*.test.mjs` | 64/71 locally² |
| `node workflow/homepage/scripts/smoke.mjs` (prod) | **62/62** at 1440 and 390 |
| `workflow/homepage/scripts/capture.mjs` (21 round-3 captures) | 0 broken images, 0 horizontal overflow, 0 page errors |

² All 7 local failures are in `src-propagation.test.mjs` and were there at baseline. They come from the spaces in this machine's folder path. Run from a copy at a path with no spaces, all 71 pass with these changes. CI uses Node 22 and has passed on every recent `main` PR.

What the smoke test covers:
- The chooser links to A, B and C.
- Each route has exactly one h1.
- Every audit CTA points to `/lp#get-started`, and that id exists.
- Every call link is `tel:+13522071074`.
- Pages are noindex, and the review bridge appears once.
- No horizontal overflow.
- Every in-page anchor resolves.
- Main targets are at least 44px.
- "Explore the work" is a keyboard-operable disclosure with a visible focus ring.
- The console is clean. The only errors are the review bridge's CORS refusal on `localhost`, which is expected.

## Important deviations (full ledger: `DEVIATIONS.md`)

**Images**
- **A, proof section photo:** the headlight photo is AI-generated. No client photo of that subject exists. It was mirrored and desaturated to match image 1, and it is not presented as proof.
- **A, growth source card:** restacked from the client's real luxury-ad pixels.
- **A and B, customer creative:** shown as the real supplied files. The mockups had redrawn them. Crops only, nothing stretched.
- **A, work plates:**
  - The storyboard is cropped so no text line is sliced.
  - The Meta ad's flat blue backdrop is recoloured to navy; the ad's own pixels are untouched.
  - The Google listing ad is cropped above its red markup arrows.

**Type**
- Two condensed headlines use horizontal scaling, because no Google face is narrow enough:
  - A's proof H2
  - B's growth H2

  Reviewers accepted both under design-psyche verdict V200.
- Reading-text floors apply below 1536: 16px for body text and 12px for labels.

**Behaviour**
- **Audit CTAs:** go to `/lp#get-started`. The old target `/lp#lead-form` never existed.
- **"Explore the work":** now a disclosure that shows more real ads; before, it jumped to pricing.
- **B navigation:** menu items are real anchors, and the "Logo reserved" placeholder now shows the real logo.

**Colour**
- Contrast lifts to AA. The hue changes are small.

**Shared code, touched deliberately**
- **Consent banner** (`src/components/consent/ConsentBanner.tsx`, listed as plumbing in the README): "Decline" was white on white (1.05:1). It now has an explicit text colour, and both buttons are 44px. Consent behaviour is unchanged. `main` has the same bug; recommend fixing it upstream in site-starter as well.
- **Skip link:** 44px minimum height.

## Unresolved / optional (not blocking)

**Needs an owner decision**
- **MYNDSET MEDIA mark:** it appears on the supplied storyboard, which A, B and C all use. Confirm whether the credit is BDC's own or a partner's.

**Optional polish from the final critics**

*A*
- Balance the growth H2 on mobile.
- The source-card pill is two stitched strips.
- Wordmark and signal width nudges of about 7px and 15px.

*B*
- Balance mobile widows (hero caption, footer title).
- Take a production capture in Firefox at 1440 and 390.

*C*
- Rewrite the Work intro so it names the pieces actually shown.
- Drop the three aspect-ratio spec lines and the Path eyebrow.
- Shorten the mobile pill label.
- Set sticker names to 14px on phones.
- Capture tablet widths 834 and 1024.
- Sync DESIGN.md's C section with C-BRIEF §12–13.

**Coverage and environment gaps**
- No mobile reference image was supplied; mobile is an adaptation.
- 320px was checked through captures and probes, not as native section tiles.
- The dev-only React hydration warning comes from the pinned review-bridge script in the root layout. It is untouched.

## Push / merge status

See `STATE.md` → "Runs" for the final commit, the PR URL and the merge result. `main` is not touched.

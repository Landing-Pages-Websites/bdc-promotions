# Round 3 (final) — fidelity:B

**Verdict: CHANGES_REQUIRED.** At 1536 the page matches the reference in every section, and all round-2 fidelity items are fixed. It does not pass because of one unlogged problem between 761 and about 1179px wide. In that range the page shows the 1536 layout scaled down (`--u: clamp(0.5px, 100cqw/1536, 1px)`), so text shrinks to 7–12px and the hero and audit-card buttons drop below 44px. That covers iPad portrait and a 1536 laptop at 150–200% browser zoom. It breaks DESIGN.md "Shared behaviour" (targets ≥44px). It is also a WCAG 1.4.4 risk (failure technique F94, text sized in viewport units), which I inferred from the CSS and have not measured with a zoom capture.

## 1. Artifacts opened
- **Reference:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/refs/variant-b-ref.png` (1536×5696).
- **Round-3 captures:** `.../reviews/r3/shots/` b-1536-full, b-1440-fold, b-1440-full, b-1280-full, b-390-fold, b-390-full, b-320-full.
- **Section pairs:** all of `.../reviews/r3/pairs/b/` (01-nav-hero through 07-close-footer, mobile-01 through mobile-07).
- **design-psyche capture:** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r3-b/` auto-flags.txt, desktop-fold.png, mobile-fold.png.
- **Engine and state evidence:**
  - `.../reviews/r2/fix-b/`: ev-engines-hero-ref-chr-ff-wk.png, ev-engines-close-ref-chr-ff-wk.png, ev-1280-work-gaps-before-after.png, ev-800-work-band.png, final-800-full.png
  - `.../reviews/r1/fix-b/explore-open-1536.png`
- **Contract and history:**
  - DESIGN.md: Measurement basis, Variant B, B copy deck, Shared behaviour
  - DEVIATIONS.md
  - reviews/r2/fidelity-B.md, reviews/r2/critic-B.md
  - notes/B-fix-r2.md
- **Code (read only to confirm how text and buttons scale; not used to judge fidelity):** in `src/components/review/variant-b/`: dealer-field-journal.module.css:29, journal-hero.module.css:143–176, journal-work.module.css:18, journal-close.module.css:43–76.

**Wording:** I checked every section word for word against the B copy deck and found no differences. Desktop line breaks match the reference: H1 3 lines, lede 4, growth H2 2, work H2 2, proof H2 2, options H2 1, close H2 5.

## 2. Section by section at 1536
Positions were read from the native pairs, ±3px.

| Section | Target | Actual | Material difference | Fix | Severity |
|---|---|---|---|---|---|
| Nav | 79px navy bar, "Logo reserved" box, 5 links, tagline | 80px, real logo, links within 2px | Logo swap only (row 7) | none | none |
| Hero | H1 top ≈140; plate x868–1469, y111–728; CTAs y768–833 | H1 ≈142; plate within 1px; CTAs y769; crop matches | Lede line 4 ends x604 against x588 | none | low |
| Signal | H2 x80–1050; columns at x80/414/750/1127; arrow y453 | H2 x80–1040; columns within 2px; arrow y453 | Descriptors 03 and 04 are 10–12px wide. Numerals are lining where the reference uses old-style (row 74). | optional | low |
| Growth | Dots y18/838; H2 x473–852; repo plate x898–1450, y103–675 | Dots y20/834; H2 x473–850; plate within 2px | H2 strokes thinner (row 21). Handwritten notes lighter. Repo crop shows less of the bottom base band (customer file). | none | low |
| Work | Storyboard frame top and left lines, x86–546, y220; event plate x658–995, y168–588; Explore y730 | Frame top and left only, y222, no overshoot (fixed); event plate x654–993; Explore y731 | The Google plate frame is a single line where the reference has a double line (top y≈449 against y437/443) | optional | low |
| Proof | H2 y185–310; three rule columns; bottom rule y791 | Within 2px | Body lines about 5px wider on each side | none | none |
| Options | Eyebrow x162–595; rows from y278; button x982–1435 | Rows y278; button within 2px | Row numerals x83–131 against x81–126 | optional | low |
| Close | "06" y64; card x1064–1469, y152–725; circle right edge x1501 | "06" y64; card within 1px; circle x≈1503 (fixed from 1510); "?" glyph close to the reference | Body line 3 ends x532 against x506 | none | low |
| Footer | y757–865 | y756–866 | none | none | none |
| Page height | 5696 | 5696 | none | — | — |

**Other widths (no reference; judged as adaptation):**

| Area | What I saw | Fix | Severity |
|---|---|---|---|
| 1440×900 fold, 1440 and 1280 full | Proportional to 1536. The hero fills the 16:10 fold (row 67). Work band gaps at 1280 are 12/11px (r2 evidence). | none | — |
| **761 to about 1179px** | The 1536 layout scales down. Computed from the CSS tokens at 820px wide: work body 8.1px, FAQ answers 8.9px, step copy 9.4px, handwritten notes 9.7px, card body 11px. Hero audit/call buttons are 35/34px tall (66u/64u; below 44px under 1056px wide). Audit-card call button is 35px. At 800px, ev-800-work-band.png shows the work body at about 8px. On a 1536 laptop at 150–200% browser zoom the viewport shrinks to 1024–768 CSS px, so the text stays the same physical size (inferred, not captured). | Move B's flow breakpoint from 760/761 to 1179/1180 in every B module, matching A's single-column breakpoint (row 15). 1056 is the hard minimum for 44px buttons. The 1536 layout does not change. Verify at 768, 820, 1024 and at 200% zoom on 1536. | **high (correctness, unlogged)** |
| About 761–805px close | Computed: the "YOUR NEXT MOVE" label hits its 12px floor, so the row ends at about 805px on an 800 viewport and the circle is clipped by 5–10px. It also looks clipped in the downscaled r2 final-800-full.png. | Fixed by the breakpoint change above | low–med |
| 390 | Nav fade works; non-breaking hyphens hold ("follow‑up", "new‑car"); card H3 on 2 lines; footer padding fixed; single rules between option rows; no orphans; plate top at about 690 of the 844 fold | none | — |
| 320 | Structure only: the full capture displays at 76px wide and no 320 section tiles were supplied | Supply 320 section tiles | unverified |

## 3. Deviations and coverage
**Accepted:**
- Rows 7–9 and 17–23.
- Rows 43–47 and 49–56.
- Rows 66–74. Row 67 leaves 1536×864 unchanged, and row 70 changes one glyph only.
- The consent banner plumbing fix: "Decline" is now dark and both buttons are about 44px (bdc-r3-b desktop-fold and mobile-fold).

None of these changes the composition, which images are used, or factual copy.

**Rejected or challenged:**
- **Row 48.** The 13px floor from 1280 up is accepted. The unlogged corollary is not: fixer note "known limit, previously accepted" lets everything below 1280 scale down to 0.5×. That breaks the Shared behaviour 44px rule and legibility at 761–1055. It was never logged as an accessibility trade-off.

**Bookkeeping still open from round 2:**
- The row 46 sha1 conflict (`60aede31…` against `0b16d89e…`) is still unreconciled.
- Rows 55–56 still say "still unlogged".
- Row 48's "block lifted" wording has been superseded by row 68.

**Round-2 items:**
- **Resolved:** consent banner contrast and targets; 1280 crop-line tangency; storyboard frame; next-move circle; U+2011 hyphens at 390; card H3; footer padding; nav fade; 16:10 fold; Explore 19px floor.
- **Not resolved:** the 320 section tiles, and production (not dev-server) Firefox/WebKit captures.

**Coverage limits:**
- 320 was checked at structure level only.
- Engine parity was checked only on the dev-server captures, at half scale. They look consistent.
- The open "Explore the Work" state was not recaptured in round 3; the only open-state capture is round 1, which predates the frame change.
- There is no capture between 800 and 1279 in round 3. The tablet findings are computed from CSS tokens, plus the r2 800px capture.
- There is no 1920 capture and no mobile reference.

## 4. Scores
| Area | Score | Note |
|---|---|---|
| Geometry | 9/10 | |
| Typography | 8/10 | Lining numerals, 3–5% width overruns, thinner growth H2, all logged |
| Imagery | 9/10 | |
| Spacing and craft | 8/10 | |
| Mobile readability | 6/10 | 390 alone is 9. The 761–1055 band is about 4. 320 not verified at text level. |

## 5. Highest-impact fixes
1. **Breakpoint (high).** Change `@media (max-width: 760px)` / `(min-width: 761px)` to 1179/1180 across `src/components/review/variant-b/*.module.css` (and the `(761px <= width …)` hero query). The hard minimum is 1055/1056.
   - Computed now at 820px: body copy 8–11px, CTAs 34–35px tall.
   - Computed target at the 1180 floor of the composition: step copy 13.6px, FAQ answers 12.7px, CTAs ≥49px.
   - Then capture 768, 820, 1024 and 1536 at 200% zoom.
2. **Next-move circle (low–med).** Confirm it is no longer clipped at about 761–805px; fix 1 should remove the case.
3. **Evidence.** Supply native 320 section tiles, production Firefox/WebKit captures at 1536, and an open "Explore the Work" state captured in round 3.
4. **Bookkeeping.** Reconcile the row 46 sha1, remove "still unlogged" from rows 55–56, and update row 48 to point to row 68.
5. **Optional 1536 polish.**
   - Old-style numerals in the signal row (`font-variant-numeric: oldstyle-nums`, if the face has them).
   - Double-line frame on the Google plate.
   - Close body line 3: +26px wide, measured.
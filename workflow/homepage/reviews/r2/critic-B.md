# Round 2 — critic:B

## Verdict: FAIL
## AI-tell flags: 0

Direction B's own code clears every Round 1 defect. The page still fails on one correctness issue, and it comes from shared chrome, not from B:

- **The consent banner's "Decline" button is invisible.** Its text renders at 1.05:1 on white. This matches V188 (REJECTED, CORRECTNESS): a button whose text colour comes from an inherited rule nobody set for it.
- **Cause.** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/app/styles/base.css:32` sets `body { color: var(--text) }` to `#f7f9fc`, the dark LP theme. The Decline button at `src/components/consent/ConsentBanner.tsx:51` sets no text colour, so it inherits that near-white on the banner's `bg-white`.
- **Where it shows.** It is the first thing a client sees on `/variant-b`, at every width (`/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r2-b/laptop-fold.png`, `mobile-fold.png`). Both banner buttons are also about 36px tall (`py-2 text-sm`), under the 44px target floor.
- **Fix.** Add `text-neutral-900 dark:text-white` to the Decline button and `min-h-11` to both buttons. Once that lands, B passes as captured. The remaining items below are polish.

No tells.md tells were found in how B is built. The composition is locked to `refs/variant-b-ref.png` and was not judged as a taste question.

### Round 1 findings: status
| R1 finding | Status | Evidence |
|---|---|---|
| Rule striking through the growth copy at 390 | **Fixed** | `.arrowRule { inset: auto }` (journal-signal.module.css:218). `mobile-02` is clean, and the signal arrow is back. |
| Hero call button looked clipped | **Fixed** | Padding around "1074": 16px left / 19px right at 1440, 16 / 17 at 1280. |
| Step 03 copy running into "Choose the pieces…" | **Fixed** | Gap is 16px at 1280 and 19px at 1440, against about 20px in the comp. |
| FAQ Q2 overrunning toward the audit card | **Fixed, matches the comp** | Runs 9–10px past its rule and stays 33–37px clear of the card at 1280/1440. The comp itself overruns by about 10px at 1536. |
| Work band body at 11.2px | **Fixed** | 13px floor with 1.3 leading (journal-work.module.css:82, 94–99). |
| Three display orphans on mobile | **Fixed** | Work H2 sets in 3 even lines, proof H2 breaks by sentence, close H2 reads "Opportunities for / Your Dealership?". |
| Doubled rules between option rows on mobile | **Fixed** | One rule per row (`mobile-05/06`). |
| 116px nav, no creative in the 390 fold | **Fixed** | One 64px nav row with 13px links. The plate's top edge is about 145px into the 844 fold. |
| Blank plates on mobile | **Not a defect** | All plates render in r2 (a V190 capture artefact). |
| Tabs looked like tabs but did nothing; "Explore" led to prices | **Fixed** | Tabs are now `<a>` links to their plates. "Explore the Work" is an `aria-expanded` disclosure that opens two more supplied creatives. |
| 52 font sizes | **Reduced to 33** | Roles are now shared tokens (dealer-field-journal.module.css:36–47). |

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 8/10 | The nowrap runs now fit inside their gutters at 1280 and 1440. The problems left are mobile wraps and one glyph:<br>• Compound words break at the hyphen in 6 places. At 390: hero "BDC follow- / up", close body "follow- / up", FAQ 02 "new- / car". At 320: hero "AI- / supported", signal "Automotive- / specific", and signal "Human + AI- / supported follow- / up", which leaves "up" alone on a line.<br>• At 320 the audit card H3 sets as "Get a Guided / Audit / for Your / Dealership", with a one-word line.<br>• Libre Caslon Display's hooked "?" in the close H2 differs from the comp's rounder "?" at 81px. | Use U+2011 (non-breaking hyphen) in "follow‑up", "AI‑supported" and "new‑car" in the B strings. At ≤760px, make `.cardTitle span { display: inline }` and add `text-wrap: balance`. Optionally set the "?" alone in `var(--b-garamond)`. |
| Spacing & rhythm | 8/10 | • Work band at 1280/1440: H2 baseline to body is about 7px, and body descender to the storyboard crop rule is about 5px. That is three elements stacked at about 6px gaps, cramped but not touching.<br>• Mobile footer padding is `24px 16px 96px` (journal-footer.module.css:89), leaving about 100px of empty navy under the email.<br>• At the 16:10 viewports (1440×900, 1280×800), the top of the signal H2's tall letters is cut off at the bottom edge of the screen. | Let the work body run 2 lines up to the storyboard plate's right edge at <1536, to win back about 16px. Change the mobile footer to `padding: 32px 16px`. At ≥761px, give `.hero` `min-height: calc(100svh - 79 * var(--u))` with content pinned to the top. This is unchanged at 1536×864 and keeps the next H2 fully below the fold. |
| Color & contrast | 4/10 | • B's own colour pairs all pass: teal on navy 6.40, blue on paper 5.32, white on blue 5.94, teal on paper 8.70, body on band 15.9, icons on navy 3.37.<br>• The blocker is the consent banner's Decline button at 1.05:1 (see the top of this audit).<br>• "Explore the Work" is 4.05:1. That passes only where it counts as large bold text, i.e. at widths ≥1170px. | Banner fix as above. Add `.explore { font-size: max(19px, var(--fs-strong)) }` so it stays large bold text at every width. |
| Layout & hierarchy | 9/10 | Pairs 01–07 match the comp's layout at 1536. Hero headline right edge vs plate left edge: 625/723 at 1280, 703/814 at 1440. Headlines do not collide with plates at any captured width. | None. |
| Specificity | 9/10 | Real customer creative: Gen‑X, Hub City Ford, Silverado VLA, the storyboard, Repo Sale. Real prices, real phone number, and the line disclaiming invented statistics. Captions name each image's source. | None. |
| Copy | 9/10 | Matches the B copy deck word for word. "Explore the Work" now shows more work instead of jumping to prices. "See How the Process Works" leads to `#b-growth`, which is correct. | None. |
| Restraint | 8/10 | No animated elements. Hover transitions are 160ms, one per element, and there is a reduced-motion kill switch. Six type families are prescribed by the comp's roles. | None within B (see Route to C). |
| Mobile | 7/10 | • The consent banner's buttons are about 37px tall and sit over the plate on first load.<br>• The nav is a scroll strip with no edge fade (`.menu { overflow-x: auto; scrollbar-width: none }`, journal-nav.module.css:119). "RES" at 390 and "FOLLOW" at 320 are cut off at the viewport edge, and ABOUT has no visible cue that it exists.<br>• The wraps at 320 listed under Typography.<br>• Positives: CTAs are 56px, work plates 86–92vw, no horizontal overflow at 320 or 390, and the growth H2 fits at 320 (right edge about 293 of 304px). | Banner fix. Add `mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent)` on `.menu` at ≤760px so the cut-off reads as scrollable. Typography fixes above. |
| 4s/40s test | 9/10 | 4 seconds: the serif claim, a real luxury ad plate, then audit + call. What, why and what to do all land. 40 seconds: path → work → standards → prices → close, with prices stated in full. | None. |
| Brief adherence | 8/10 | Palette, type roles, section order and copy match DESIGN.md §B, and the deviations are logged. DESIGN.md's "Shared behaviour" section requires AA contrast and ≥44px targets on every route, and the banner breaks both on `/variant-b`. | Banner fix. |

### Auto-flag triage
- **Roboto**: dismissed. The comp prescribes a neutral grotesk, and this is logged in DEVIATIONS.
- **33 font sizes**: comp-driven and now tokenized. Accepted.
- **7 gradients**: dismissed. They are crop lines and the dashed timeline, not visible gradients.
- **Section gap of 0**: dismissed. These are adjacent colour bands, as the comp prescribes.
- **3 shadow recipes**: the mat and an inset crop line belong to B. The third is the banner's Tailwind `shadow-lg`.

### Not yet verified
- **The expanded "Explore the Work" state was not captured.** `.more` uses `margin-top: 806u` inside a `flow-root` band with `min-height: 874u`. Capture it open at 1280 and 390, and confirm the band grows with the two plates underneath the event/inventory columns.
- **Firefox is still not captured.** The `@supports not (text-box…)` fallbacks now exist in every module, but no Firefox screenshot confirms them.

## Top 3 changes, in order of impact
1. `src/components/consent/ConsentBanner.tsx:51`: add `text-neutral-900 dark:text-white` to Decline, and `min-h-11` to both banner buttons. This clears V188 and the target floor on every route.
2. Mobile type: U+2011 non-breaking hyphens in follow‑up / AI‑supported / new‑car; `.cardTitle span { display: inline }` plus `text-wrap: balance` at ≤760px; and the right-edge fade on the nav so the cut-off reads as a scroller.
3. Spacing at the in-between desktop widths: re-break the work body into 2 lines at <1536; hero `min-height: calc(100svh - 79u)` at ≥761px so the 16:10 fold stops cutting off the next H2; mobile footer `padding: 32px 16px`.

## What is already good (keep)
- Close match to the comp at 1536 in all 7 sections, with no text overrunning its column at 1280 or 1440 (the phone button, step copy and FAQ Q2 were re-fitted to the comp's widths).
- The mobile layout rethinks the desktop one rather than just stacking it. The growth timeline becomes numbered steps with the handwritten note under each step. The options table becomes ruled rows with single rules. The close keeps its vertical spine and rotated margin labels. The hero plate reaches the 390 fold.
- Customer creative is shown unaltered with source captions. Nothing is invented: no counts, logos or ratings.
- Every interactive element actually does something: the audit links go to `/lp#lead-form`, phone links use `tel:`, the tabs are anchors, Explore is an `aria-expanded` disclosure, and "YOUR NEXT MOVE" jumps to the audit card. Targets are 44px or more. The focus ring switches to white on navy. Hover changes one property at 160ms, and reduced motion turns everything off.
- Contrast was corrected and logged where the comp itself failed AA (teal captions 6.40, Explore 4.05 as large text).

## Route to C
- Cut six type families down to one display serif plus one grotesk. The comp's three display serifs all do the same job.
- Make "Explore the Work" and the category links a real filter over the full creative library, rather than two extra plates.
- Give the fold a proportion that works at 16:10 and at 1536×864, instead of a fixed 1536×864 band.

Files: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/consent/ConsentBanner.tsx`, `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/app/styles/base.css`, `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r2-b/laptop-fold.png`, `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r2-b/mobile-fold.png`, `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/shots/b-320-full.png`, `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-b/`
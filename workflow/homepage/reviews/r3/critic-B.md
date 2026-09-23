# Round 3 (final) — critic:B

## Verdict: PASS
## AI-tell flags: 0

The round-2 blocker is fixed. The consent banner's Decline label now renders as dark text on white, and both banner buttons are about 44px tall (`bdc-r3-b/laptop-fold.png`, `mobile-fold.png`). V188 no longer applies.

With the composition locked to `refs/variant-b-ref.png`, I found no correctness failures at 1536, 1440, 1280, 390 or 320. What remains is polish, and it is listed below.

**The most damaging item left** is a verdict conflict, not a rendering fault. V189 is a REJECTED `WHEN:sells=expertise AND audience=b2b AND buyer=comparing` verdict, and its predicate matches this project's axes. It rejects an editorial, documentary register on warm paper for a niche agency selling to comparing B2B buyers. That is exactly B's register.
- **Why it is not a FAIL.** The client supplied this register in image 2. The standing homepage-workflow rule puts A/B reference fidelity ahead of design-psyche changes to typography, palette or layout. V189's remedy is one of those changes.
- **Where it applies instead.** It is a forecast for the selection stage: expect B to underperform A and C for this buyer. It is not a build defect, and C already answers it.

### Live-DOM checks run this round (prod build, `localhost:3418`)
- **Target probe.** `node /Users/syedali/.claude/design-psyche/scripts/a11y-probe.mjs http://localhost:3418 /variant-b` reported 0 overflow and 2 targets under 44px.
  - "cookie policy" is an inline link in a sentence, which WCAG 2.5.8 exempts.
  - "Skip to main content" measures 43.2px. It lives in the shared root layout, not in B, and only appears on keyboard focus.
- **Explore the Work, open state.** Round 2 flagged this as not yet verified. It is now captured with `/tmp/claude-501/crit/explore.mjs` and the images are `explore-{1280,1536,390}-band.png`.
  - The work band grows: 728 → 1210px at 1280, 874 → 1450px at 1536, and 1917 → 2947px at 390.
  - Both extra plates load at every width (`complete && naturalWidth > 0`).
  - `scrollWidth` equals the viewport width at all three widths, so nothing overflows.
  - The arrow rotates to point down and `aria-expanded` flips to `true`.
- **Firefox.** Still not captured.

### Round-2 findings: status
| R2 finding | Status | Evidence |
|---|---|---|
| Decline button invisible; banner buttons about 36px | **Fixed** | Dark label, 44px buttons in both design-psyche folds |
| Compound words breaking at the hyphen on mobile (follow‑up, AI‑supported, new‑car) | **Fixed** | U+2011 non-breaking hyphens in the Hero, Method, Work, Proof and Close components. No breaks at the hyphen at 390 or 320. |
| Audit card title "Audit" alone on a line at 320 | **Fixed** | Now "Get a Guided / Audit for / Your Dealership" |
| Close H2 "?" did not match the comp | **Fixed** | Set in Instrument Serif (`journal-close.module.css:121`) and matches the comp |
| "Explore the Work" at 4.05:1 only passing as large text | **Fixed** | `font-size: max(19px, …)` bold. Renders at 20.4px at 1280 and 21px on mobile. |
| Nav cut off on mobile with no cue that it scrolls | **Fixed** | `mask-image` fade (`journal-nav.module.css:124`). "RES" fades at 390. |
| About 100px of empty navy in the mobile footer | **Fixed** | `padding: 32px 16px` |
| Next section's H2 cut off in the 16:10 fold | **Fixed** | `min-height: calc(100svh - 79u)`. The 1280×800 and 1440×900 folds end on paper. |
| Work band body re-broken to 2 lines below 1536 | **Not done** | Still 3 lines at 13px. The gaps measure about 15px, so it no longer reads as cramped. |

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 8/10 | • **Type roles:** match the comp. Roboto is loaded as a variable font with a real `wdth` axis, so every `font-stretch` value is genuine rather than faked.<br>• **Growth H2 is squeezed, not a condensed cut:** Instrument Serif under `transform: scaleX(0.72)`, and `scaleX(0.82)` on mobile (`journal-growth.module.css:214, 308`). This thins the vertical strokes, but it matches the comp. V200 accepts `scaleX` when reproducing a comp.<br>• **Negative tracking on body-size text:** step copy is set at `wdth 75` with `-0.042em` / `-0.05em` tracking (`:184–185, :197`). It is still legible at 1280.<br>• **Tight leading on the work body:** 13px on 1.173 (`journal-work.module.css:89`).<br>• **Widows:** the 390 hero caption leaves "creative" alone, and the 320 footer leaves "Marketing" alone. | Add `text-wrap: balance` to the hero plate caption and the footer title at ≤760px. The squeeze and tracking stay while the comp is locked. |
| Spacing & rhythm | 8/10 | • Section rhythm matches the comp band for band.<br>• Growth gaps at 1440: step 03 copy to the H2 intro is 19px; H2 to plate is 22px.<br>• FAQ Q2 runs 8–10px past its rule and stays 34–37px clear of the audit card. The comp does the same.<br>• The V181 fold fix leaves 106px (1280×800) and 119px (1440×900) of empty paper under the CTAs.<br>• With Explore open, the column under the storyboard is about 480px of empty navy at 1280. | None required. |
| Color & contrast | 9/10 | • Banner fixed.<br>• B's colour pairs pass: teal on navy 6.40, blue on paper 5.32, white on blue 5.94.<br>• Explore passes as large bold text at every width.<br>• Focus ring switches to white on navy sections: `--focus: #fff` in the card, footer, nav and work modules.<br>• Hover on the primary CTA is `#0044c4`. It shows in the 320 capture because the pointer was parked there, which is a capture artefact. | None. |
| Layout & hierarchy | 9/10 | • Pairs 01–07 match the comp at 1536.<br>• The hero headline stays clear of the plate: headline right edge 625 vs plate crop mark 709 at 1280, and 703 vs 798 at 1440. V202 is satisfied.<br>• No text collides or clips at 1280, 1440 or 1536. | None. |
| Specificity | 9/10 | • Real customer creative: Gen‑X, Hub City Ford, the storyboard, Repo Sale, and two more plates behind Explore.<br>• Every plate has a source caption.<br>• Real prices and a real `tel:` number.<br>• Nothing invented. | None. |
| Copy | 9/10 | • Matches the B copy deck word for word.<br>• Every action does something: `/lp#lead-form`, `tel:`, anchor tabs, and a disclosure that reveals more work. | None. |
| Restraint | 8/10 | • No load animation.<br>• 160ms hover transitions, and reduced motion turns everything off (`dealer-field-journal.module.css:87`).<br>• Six type families, all prescribed by the comp's roles. | Handled in Route to C. |
| Mobile | 8/10 | • No overflow at 320 or 390.<br>• CTAs 56px; the audit and call buttons sit in the 390 fold.<br>• Growth becomes numbered steps with the handwritten notes inline.<br>• Options become ruled rows.<br>• The expanded Explore state stacks cleanly.<br>• Remaining: the shared skip link at 43.2px, and the two widows above. | `src/app/styles/responsive.css:6`: add `min-height: 44px; display: inline-flex; align-items: center` to `.skip-link`. |
| 4s/40s test | 9/10 | • 4 seconds: the serif claim, the luxury ad plate, then audit + call. What, why and what to do all land.<br>• 40 seconds: path → work → standards → four stated prices → close, with the non-guarantee printed twice. | None. |
| Brief adherence | 9/10 | • Palette, type roles, section order and copy match DESIGN.md §B.<br>• The shared-behaviour floor holds, apart from the 1px skip-link shortfall in the root layout.<br>• V189 triage as stated at the top. | Skip-link fix as above. |

### Auto-flag triage (`bdc-r3-b/auto-flags.txt`)
- **Roboto:** dismissed. The comp prescribes a neutral grotesk, and it is used deliberately as a variable face with the width axis.
- **33 font sizes:** comp-driven and tokenised (`dealer-field-journal.module.css:34–46`).
- **7 gradients:** these are crop lines and the dashed timeline, not visible gradients.
- **Section gap of 0:** these are adjacent colour bands, as the comp prescribes.
- **3 shadow recipes:** the mat and an inset crop line belong to B. The third is the banner's shadow, which is shared chrome.

### Corpus comparison
- **Work & Co** (`corpus/agencies-design-led/work.co__home`) keeps its fold to one statement, one attributed proof sentence, one text link and a 1px rule. B's fold stacks the statement, a 3-line proof, a filled primary button and an outlined call button. The comp locks this, so it goes to C, not here.
- **Stripe Press** (`corpus/editorial-type-led/stripe.press__home`) gives the product more than 45% of the fold. B's plate takes 25% of the 1440×900 fold (563×576px), which is under V180's single-element threshold. The comp locks this too.

## Top 3 changes, in order of impact
1. **Shared skip link.** `src/app/styles/responsive.css:6`: add `min-height: 44px; display: inline-flex; align-items: center`. This clears the only measured target under the floor, on every route.
2. **Mobile widows.** Add `text-wrap: balance` to the hero plate caption and `.footer` title at ≤760px ("creative" at 390, "Marketing" at 320).
3. **Firefox capture.** Take one Firefox capture at 1440 and 390 to confirm the `@supports not (text-box: trim-both cap alphabetic)` fallbacks. Optionally, re-break the work body into 2 lines below 1536.

## What is already good (keep)
- A close match to the comp at 1536 in all 7 section pairs, with no text overrunning its column at 1280 or 1440.
- The mobile layout rethinks the page rather than just stacking it:
  - The timeline becomes numbered steps with the handwritten notes inline.
  - The options table becomes ruled rows with one rule each.
  - The close keeps its vertical spine and rotated margin labels.
  - The work tabs become a 2×2 grid of 44px+ links.
- Every control does something real: audit links, `tel:` links, anchor tabs, and an Explore disclosure that reveals two more supplied creatives. The open state is now verified at three widths.
- Accessibility basics hold: focus ring swaps to white on navy, hover changes at 160ms, reduced motion turns everything off, and contrast was corrected where the comp itself failed AA.
- Nothing is invented: no counts, logos, ratings or testimonials. The signal disclaimer and the non-guarantee both stay on the page.

## Route to C
- Choose the register with V189 in mind: this project's axes favour a warm product-marketing register over an editorial journal.
- Cut six families to one display face plus one grotesk, and set the growth H2 in a real condensed cut instead of a 72% squeeze.
- Give the work to a single fold element covering more than 45% of the frame (V180). B's plate covers 25%.
- One primary action in the fold, with the call as a text link, following the Work & Co pattern.

Files:
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/app/styles/responsive.css`
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-b/journal-growth.module.css`
- `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-b/journal-work.module.css`
- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r3-b/laptop-fold.png`
- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r3-b/mobile-fold.png`
- `/tmp/claude-501/crit/explore-1280-band.png`
- `/tmp/claude-501/crit/explore-390-band.png`
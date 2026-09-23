# Round 1 — critic:B

## Verdict: FAIL
## AI-tell flags: 0
No execution-level tells from tells.md. The composition is locked to `refs/variant-b-ref.png` and is not judged here. The FAIL comes from the CORRECTNESS defects below: elements that are broken or overlapping at 390, 1280 and 1440.

### Correctness defects (why this fails)
1. **At 390px, a rule strikes through live copy.** In the growth section, a 1px black rule runs through "Choose the pieces your dealership needs or" and off the right edge (`pairs/b/mobile-02.png`, y≈1135). It reads as deleted text. Cause: at ≤760px, `.arrowRule` becomes `position: relative` (`journal-signal.module.css:207`) but keeps its desktop `left: calc(65*u)` and `top: calc(454*u)`. At 390, u=0.5px, so the rule moves 227px down into the next section and 32px right. The same bug also removes the signal section's own arrow rule. Fix: add `inset: auto;` to `.arrowRule` inside the mobile block. It is the only relative-in-mobile rule in B (grep confirmed).
2. **At 1280 and 1440, fixed-width text runs eat their gutters (V202 class).** Every grotesk run is `white-space: nowrap` inside an absolutely positioned box sized to the comp. Roboto at the chosen `font-stretch` sets 3–9% wider than the comp's grotesk. I measured this against the 1536 pairs: step copy +8%, FAQ Q2 +9%, call label about +10%, signal copy +5%, lede +3%. The extra width lands in the gutters:
   - **Hero call button** (`desktop-fold.png` 617–851 / `laptop-fold.png` 548–757): "1074" ends 4–6px from the right border, against about 18px on the left, so the button looks clipped. Fix in `.phone` (`journal-hero.module.css:147`): `width: auto; min-width: calc(250*var(--u)); padding-right: calc(22*var(--u))`, or `font-stretch: 82%`.
   - **Growth step 03**: "Launch and refine paid campaigns" ends 6–7px before "Choose the pieces your dealership needs" at 1280/1440 (the comp has 24px), and the two read as one sentence. `.stepCopy` (`journal-growth.module.css:180`) is already at Roboto's 75% width floor. So size it to the comp's width instead: `font-size: calc(16.4*var(--u))`. Or move `.growthIntro` to `left: calc(488*var(--u))`.
   - **FAQ Q2** "What kinds of creative can BDC Promotions produce?" runs 33–37px past its column rule and stops 9–10px from the navy audit card at 1280/1440 (`d-close`, `lap-04`). Fix `.faq h4` (`journal-close.module.css:189`): `font-stretch: 77%`, or `white-space: normal; max-width: calc(335*var(--u))`.
   - Rule for all of these: solve each nowrap run's width against the comp, as V200 says (cap height sets the size, width sets stretch and tracking), and check at 1280 and 1400, not only 1536.
3. **Work band body copy is 11.2px at 1280** (`.body` `calc(13.4*u)`, 1.16 leading, `journal-work.module.css:74`). "Inspect the range…" is barely readable on navy. Fix: `font-size: max(13px, calc(13.4*var(--u))); line-height: 1.3`. Re-break it into 2 lines under the 600u title so it still clears the storyboard plate at 221u.

### Verify before acting
- **Blank inventory and Google VLA plates on mobile** (`mobile-04/05`: the frames and crop lines render, the images do not). The CSS is correct: aspect-ratio boxes plus `fill`. Both plates are `next/image` lazy and sit deepest on the page, and the capture scrolls in 700px steps with a 60ms pause. This is the V147/V190 capture pattern. Check `img.complete && naturalWidth` in the live DOM before filing it.
- **Firefox**: every absolutely positioned text box relies on `text-box: trim-both cap alphabetic`. If the engine ignores it, the hero H1 drops about 30px toward `.titleRule` at 361u. Take one Firefox capture of the hero and close sections.
- **320px**: by arithmetic, the growth H2 (`scaleX(0.82)`, nowrap, 44px floor) needs about 309px from x=16, so the "m" of "Showroom" gets clipped. Capture at 320.

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 6/10 | The EB Garamond H1 matches the comp closely. The Roboto `wdth` axis is a real condensed cut, not a squeeze. The growth H2 `scaleX(0.72)` matches the comp at 1536 and is endorsed by V200: keep it, which resolves the "pending reviewer verdict" in DEVIATIONS.md. But the nowrap grotesk runs are 3–9% over the comp's width (defect 2). There are 52 distinct sizes, several of them measurement noise: 16.3/16.8/17.6/17.7u body sizes that no one can tell apart. At 390 there are three display orphans: "Feed" (work H2), "Trust." (proof H2) and "More" (close H2). | Re-solve the nowrap runs by width. Merge body sizes within 0.5px of each other into one token per role (about 16.8u and 22u). Add `text-wrap: balance` to the ≤760 rules for `.title` (`journal-work.module.css:310`), `.proofTitle` (`journal-proof.module.css:177`) and `.title` (`journal-close.module.css:380`). |
| Spacing & rhythm | 6/10 | Gutters collapse to 4–10px at 1280/1440 (defect 2). On mobile, options rows show doubled parallel 2px rules between every row (`mobile-06` y≈18/50, 320/355, 589/623), because each row has both `border-top` and `border-bottom` (`journal-options.module.css:352`). | Defect-2 fixes. On mobile, keep only `border-bottom` on each row plus `border-top` on the first. |
| Color & contrast | 8/10 | Measured pairs pass: teal-on-navy captions 6.40:1, teal on paper 8.70, blue on paper 5.27, white on blue 5.94, "Explore the Work" 4.05 (large bold text, passes). The focus ring switches to white on navy sections. The blue step titles are not links but use the link blue; this is mitigated because the real links are underlined. | None required. Keep the underline as the only link signifier. |
| Layout & hierarchy | 8/10 | Pairs 01–07 match the comp's geometry within a few px at 1536. V202 headline check passes: H1 ink-right 625/703 against plate-left 709/814 at 1280/1440. The call CTA sits under the plate caption column but does not overlap. | Covered by defect 2. |
| Specificity | 9/10 | Real customer creative (Gen-X, Hub City Ford, Silverado VLA, storyboard), real prices, real phone, and a no-invented-stats line. The repo plate is cropped, not stretched. | None. |
| Copy | 7/10 | Matches the B copy deck word for word. "Explore the Work →" links to `#b-options` (pricing): the label promises more creative and lands on prices. The category labels (`.tabs li`, `journal-work.module.css:85`) still look like tabs (blue underline bars, a 2×2 button grid on mobile) but do nothing. | Point "Explore the Work" at a real gallery, or log it in DEVIATIONS.md as a dead end until one exists. Make each category label an `<a href="#b-work-…">` to its plate so the look has real behavior. |
| Restraint | 8/10 | Density comes from the comp. No load animation. Hover is one property at 160ms. There is a reduced-motion kill switch. | None. |
| Mobile | 5/10 | Strike-through rule (defect 1). Three display orphans. Doubled option rules. Nav links at 11px. The two-row nav takes 116px, so no creative appears in the 390 fold (the plate starts about 840px down), on a page whose proof is the creative. CTAs are 56px and good. | Defect-1 fix, orphan fix, rule fix. Nav links at `font-size: 13px`. Collapse the nav to one 64px row (logo + "Dealership Growth Editors", with the section links in a second row only when there is space), so the plate's top edge reaches the fold. |
| 4s/40s test | 8/10 | 4s: serif claim, real ad plate, audit CTA plus phone. What, why and do all land. 40s: path → work → standards → prices → close reads in order, and prices are stated in full. | None beyond the fixes above. |
| Brief adherence | 8/10 | Palette, type roles, section order and copy match DESIGN.md §B. Deviations are logged (logo slot, AA teal, repo crop, Roboto). The contract says "no horizontal overflow at 320/390", but the mobile rule overruns and is only hidden by `overflow-x: clip`. | Defect 1 plus the 320 capture. |

### Auto-flag triage
- **Roboto flag**: dismissed. The comp prescribes a neutral grotesk; the dismissal is logged (DEVIATIONS row 24, Inter measured 6–7% too wide).
- **7 gradient elements**: dismissed. They are crop-line and dashed-timeline backgrounds, not visible gradients.
- **Section gap of 0**: dismissed. Adjacent bands with surface shifts are what the comp prescribes.
- **3 shadow recipes**: dismissed. Only one (the mat) belongs to B; the others are the cookie banner (Tailwind) and an inset crop line.
- **52 font sizes**: partly valid; see Typography.

## Top 3 changes, in order of impact
1. `journal-signal.module.css:207`: add `inset: auto` to the mobile `.arrowRule`. This removes the strike-through across the growth intro and restores the signal arrow.
2. Re-solve every nowrap grotesk run to the comp's width at 1280/1440: `.phone` gets auto width with right padding, `.stepCopy` 16.4u, `.faq h4` stretch 77%. Re-capture at 1280, 1400 and 1440, comparing ink-right against the neighbor's left edge.
3. Legibility and mobile polish: work `.body` floor of 13px/1.3; `text-wrap: balance` on the three mobile display H2s; a single rule between option rows on mobile; nav links at 13px.

## What is already good (keep)
- Fidelity at 1536 is close in all 7 bands: hero geometry, the signal ledger, the dashed handwritten timeline with notes, the navy work band with the cream "01" strip, the staggered option rows with tilted rules, and the close with rotated margin labels.
- Customer creative is shown unaltered as proof, with source captions. Nothing is invented: no counts, logos or ratings.
- AA contrast was corrected and logged where the comp failed (teal captions 3.15 → 6.40, Explore link 3.3 → 4.05 large).
- Real behavior behind the static comp: audit → `/lp#lead-form`, call → `tel:`, "YOUR NEXT MOVE" → the audit card. 44px minimum targets on desktop, 56px CTAs on mobile.
- The growth H2 `scaleX(0.72)` matches the comp's condensed serif at 1536. Keep it (V200).

## Route to C
- Collapse six families (EB Garamond, Cormorant, Libre Caslon Display, Instrument Serif, Caveat, Roboto) to one display serif plus one grotesk. The comp's three display serifs serve a single role.
- Put a crop of the customer creative into the 390 fold rather than after the CTAs.
- Make the work categories real filters over a larger creative set.

Files: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r1-b/` (desktop-fold, laptop-fold, desktop-full), `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/pairs/b/mobile-02.png` (strike-through), `mobile-04.png`/`mobile-05.png` (blank plates, to verify), `mobile-06.png` (doubled rules), and source in `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-b/`.
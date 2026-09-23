# Round 2 — critic:A

## Verdict: FAIL
## AI-tell flags: 0
- None. A's composition is locked to image 1, so the AESTHETIC vetoes are dismissed for A (5 patterns: the 3-icon standards row, the open FAQ, the close band, condensed caps, the blue option cards). No REJECTED verdict recurs, and there are no invented stats, stars, logo strips, price toggles or load animations (`animatedElements 0`, `gradientElements 0`). I re-checked V181, V187, V188, V190 and V202 at 1440×900 and 1280. The next H2 stays out of the fold, the CTAs have a 10px gap, all images render, and at 1280 the H1 ends at x≈450 while the repo plate starts at x≈525.

**4-second read (1440 fold):** a car-dealer marketing agency. The promise is more showroom traffic. The proof is the client's own "We Make Luxury Affordable" and repo-sale ads. The actions are a free audit or a call. It lands in about 2 seconds, and the desktop matches image 1 in every section at 1536, 1440 and 1280.

**The most damaging problem: the round-1 mobile-fold finding is still open.** Round 1's mechanical fix went in (the slab now hugs the plates and the plate sits 20px in from the edge). But the creative still starts at the fold line:

| Viewport | Slab top (CSS px) | Creative starts | Creative in fold |
|---|---|---|---|
| 390×844 | 813.5 | 841 | 3px |
| 320×700 | 801.5 | 829 | 0px |

At 320×700 the call CTA (y 705–765) is also below the fold. The fold's own proof box says "REAL AUTOMOTIVE CREATIVE." and shows none, on an axis set with `photogenic=visual`. Instrument's 390 fold (corpus `agencies-design-led/instrument.com__home/mobile-fold.jpg`) puts the work above the statement, and its first "Recent work" plate starts at y≈615.

**Second:** at 320, two CTA arrows collide with their labels (`/tmp/claude-501/cr/m320-seehow.png`, `m320-findmix.png`).
- "SEE HOW THE PROCESS WORKS→": `.process svg` is declared at 27px but flex-shrinks to about 8px and sits about 2px from the "S".
- "FIND THE RIGHT MIX→": the arrow touches the "X".
- Cause: nowrap labels with 0.16em / 0.113em tracking, no `flex-shrink:0` on the icon, and no rule below the single 1179px breakpoint.

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 8/10 | **Resolved from round 1:** reading floors are in (`max(16px,…)` on work `.body`, proof `.rules`/`.positionBody`, growth `.step p`, options `includesText`, close FAQ; `max(12px,…)` on labels). Distinct sizes dropped from 46 to 24 (auto-flags). The close H2 at 390 keeps image 1's three lines with no touching letters. The eyebrow, signal H2 and CTA breaks follow the contract. **Still open:** (1) Hard-hyphen breaks at 320/390: "follow-/up support" (option 01), "AI-/supported" (FAQ 3), "vehicle-/listing" (FAQ 2 at 390). (2) The source-card caption is a two-line sentence at `max(12px, 14u)`, which is 12px at 1280 and 13.1px at 1440 (`growth.module.css:190`). (3) Proof H2 line 1 is `scaleX(0.76×1.05)` and line 2 is `scaleX(0.76)`, so the two lines have different stem widths. Accepted under V200 as in round 1; no change. | Render U+2011 non-breaking hyphens in "follow‑up", "AI‑supported" and "vehicle‑listing" (same glyphs, no copy change). Set `.sourceCaption` to `max(14px, var(--fs-14))` and let its box grow. |
| Spacing & rhythm | 8/10 | Desktop bands sit on image 1's y-coordinates, and sections separate by surface change (navy, light, navy, blue, navy). On mobile, the options band uses 16px gutters (card and button at x=16–374) while every other band uses 20px, and the options H2 runs to about 17px. The open "Explore the work" panel (r1 `fix-a/explore-open-1536.png`) sets its three labels at three heights (y 930, 966, 1073) because of `.more{align-items:end}` with the figcaption above the image. | Put the options band on the page's 20px gutter at ≤1179px. In `ExploreWork.tsx`, move `figcaption` after the `Image` so the labels share one baseline under the common floor line (V132 bottom-alignment kept). |
| Color & contrast | 9/10 | Measured: INCLUDES `#1e73fc` on panel = 4.58:1; source caption `#1669de` on paper = 4.94:1; option numerals `#0563fc` = 3.91:1 and FAQ "Q" `#025afb` = 3.59:1, both display-size, so they pass the large-text threshold. **Hover is resolved:** `--hover-ring: inset 0 0 0 3px cyan` on every CTA, visible (it appears on the hovered audit CTA in the 320 capture). The focus ring is a 3px cyan outline. The Meta plate now sits on navy. | None. |
| Layout & hierarchy | 9/10 | Matches the comp section by section at 1536. It scales to 1440 and 1280 with no collisions. The spine is loud hero, loud type signal, light growth band, loud collage, quiet proof, loud blue options, quiet close. | None on desktop. |
| Specificity | 9/10 | Real client creative (Gen-X luxury voucher, repo sale, Silverado VLAs, Hub City Ford carousel), real prices with commitment terms, real phone and email. It could only be this business. | None. |
| Copy | 9/10 | Word for word with the A deck. No banned words. The non-guarantee is stated. **Resolved:** "EXPLORE THE WORK" is now an `aria-expanded` disclosure that reveals three supplied ads whole, not a jump to pricing (V178 class closed). | None to the wording. |
| Restraint | 8/10 | Zero animation and zero gradients. Plate shadow recipes merged to one (`0 7.5px 22.5px 3.75px`), plus one inset hairline; the third recipe is the cookie banner's. The only extra is the 160ms rotate on the disclosure arrow, which is interaction motion and fine. | None. |
| Mobile | 7/10 | **3px of creative in the 390 fold, 0px at 320×700, and the call CTA below the 320×700 fold** (measured on the captures). The arrow/label collisions at 320 are described above. Mobile footer: the phone text starts at x≈56.5 and the email at x≈60 because the two icons are different widths. **Resolved:** the slab dead zone, the plate's 20px inset with all four frame edges visible, the full FAQ border, the close-H2 lines, the orphans, 18px body, no overflow. | (1) At ≤1179px, put the proof box after the art: `.copy{display:contents}`, and give the hero grid areas `eyebrow / title / body / audit / call / art / proof`. Then `.slab{margin-top:24px}` and `.frontPlate{margin-top:40px}`. The luxury plate then starts at about y≈685, which puts about 160px of creative (the whole "WE MAKE LUXURY AFFORDABLE" lockup) in the 390 fold, and the call CTA ends at about y≈646 at 320×700. (2) `.process svg, .mix svg, .explore svg {flex-shrink:0}`, plus `gap:12px` on those three buttons. Add `@media (max-width:359px){ .process{letter-spacing:.1em} .mix{font-size:24px; letter-spacing:.08em} }`. (3) Give `.footerPhone svg, .footerMail svg` a fixed 26px-wide box. |
| 4s/40s test | 9/10 | 4s: agency for dealers, more showroom traffic, audit or call. 40s: the signal, the 5-step lane, the work, the standards, the prices, the close and the open FAQ. It is an argument with a conclusion. | None. |
| Brief adherence | 8/10 | **Resolved:** the storyboard now starts at the JOB NO row with no sliced title; the VLA is cropped above the annotated location rows (no arrows); the Meta backdrop is navy; all logged in DEVIATIONS rows 6 and 27. **Open:** in the source-work composite, the voucher's "MESSAGE OR COMMENT NOW!" pill renders about 7px tall at 1536, and image 1 shows it about twice that size. The open-state panel has only a dev-server capture (Next "1 Issue" badge in `r1/fix-a/explore-open-1536.png`) and none in the r2 production set. | Re-run the restack with the voucher panel cropped to the plaque, dropping the black margin above "EXCLUSIVE SAVINGS", so the pill scales about 1.6×. Add production captures of the open disclosure at 1536 and 390 to `reviews/r2/shots/`, with 0 console issues. |

## Top 3 changes, in order of impact
1. **Put creative in the mobile fold.** Move the proof box below the art at ≤1179px and tighten the slab and plate top margins. That brings about 160px of the luxury plate into the 390×844 fold and brings the call CTA back into the 320×700 fold.
2. **Fix the 320 button collisions.** Add `flex-shrink:0` on the button SVGs, `gap:12px`, and a ≤359px tracking/size step for `.process` and `.mix`.
3. **Finish the small craft items.** Non-breaking hyphens in the three compounds; the source caption to a 14px floor; explore-panel labels on one baseline; the options band on the 20px gutter; a fixed icon box in the footer; production captures of the open disclosure.

## What is already good (keep)
- Desktop fidelity at 1536, 1440 and 1280 in every section, including the route geometry, the staircase, the tilted repo plate, the wide first options card and the open FAQ. Proportional scaling holds with no headline/plate collision (V202).
- The legibility floor on every reading paragraph, and 24 sizes on the page, down from 46.
- A visible single-property hover (inset cyan ring), a 3px cyan focus ring, and a `prefers-reduced-motion` kill switch.
- The work collage is clean: storyboard pre-cropped, VLA arrows gone, Meta plate on navy. "Explore the work" is a real, accessible disclosure of whole supplied ads.
- Prices and commitment terms are in full (SR9), the non-guarantee is inline, and there are no invented metrics.
- Mobile display lines keep image 1's breaks (hero H1 ×4, the close H2 ×3, the signal as "FAST / FOCUSED /" + "SOCIAL / RESULTS", the options H2 one sentence per line). No overflow at 320 or 390.

## Round-1 findings: status
- Legibility floor: **resolved**.
- 46 sizes: **resolved** (now 24).
- Close H2 at 390: **resolved**.
- Mobile orphans: **resolved** (only the new hyphen breaks remain).
- Hover visibility: **resolved**.
- Meta plate backdrop: **resolved**.
- Storyboard slice: **resolved**.
- VLA arrows: **resolved**.
- "Explore the work" false affordance: **resolved** (open-state polish still pending).
- Mobile slab dead zone: **resolved**.
- Front-plate clip: **resolved**.
- FAQ half-border: **resolved**.
- Shadow merge: **resolved**.
- Mobile-fold creative (the purpose of round 1's hero fix): **not resolved**. 3px at 390.

## Route to C (not failures of A)
- The standards section pairs an AI-generated B&W headlight (DEVIATIONS row 6) with "PROOF YOU CAN INSPECT". In C, that slot should hold inspectable client work or nothing.
- The storyboard plate is unreadable document texture at 390. C could show one scene frame large, with the script line as real text.
- The work intro names testimonial, employee and viral pieces that no plate shows. C's contact sheet should label each creative type it claims.

Evidence crops: `/tmp/claude-501/cr/` (`m390-00.png` 390 fold, `m320-00.png`/`m320-01.png` 320 fold, `m320-seehow.png`, `m320-findmix.png`, `w1280-*.png`, `w1440-source.png`).
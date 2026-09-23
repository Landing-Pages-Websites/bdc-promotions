# Round 1 — critic:A

## Verdict: FAIL
## AI-tell flags: 0
- None in the execution. The 3-icon standards row, the open FAQ, the close band, condensed caps and the blue options cards all come from the supplied image. Under the tiered verdicts, AESTHETIC vetoes don't override a supplied reference, so I dismissed them for A (count: 5 patterns). No REJECTED verdict recurs: no invented stats, stars, logo strips, price toggles or load animation. I checked V181, V187, V188 and V202 against the page: the next headline is not in the fold, the CTAs don't touch, and at 1280 the H1 clears the plates.

**4-second read (1440 fold):** a marketing agency for car dealerships. The promise is more showroom traffic. The proof is the client's own dealer ads, set large on the right. The actions are a free audit or a call to (352) 207-1074. It passes in about 2 seconds.

**Spine:** hero is loud (navy, blue slab, creative). Signal is loud type on a quiet field. Growth is a light-band surface change. Work is a loud image collage. Proof is quiet. Options is a loud blue band. Close/FAQ is quiet. This matches image 1.

**Measured on the live DOM** (prod :3418, after scrolling the whole page):
- All 8 images have `complete` set and `naturalWidth > 0` at 390, 1280 and 1440. The blank Meta, Google and headlight boxes in `mobile-full.png` are capture artifacts (V190). Don't fix those.
- `scrollWidth == clientWidth` at all three widths.
- Zero text/background pairs below AA at 1440 and 390.
- Every variant-A CTA is at least 44px tall. The sub-44 targets are cookie-banner and skip-link plumbing, which I ignored.

**The most damaging problem is a legibility floor that fails at laptop widths, across the whole page.** The desktop is built as a poster: every value is `calc(N * var(--u))` with `--u = 100cqw/1536`. So all type shrinks with the viewport, down to 1180px.

| Text | At 1280 | At 1180 |
|---|---|---|
| Work intro ("Inspect the range…") | 14.3px | 13.2px |
| Proof standards list | 14.6px | 13.4px |
| Positioning paragraph | 14.4px | 13.3px |
| Growth step text | — | 14.2px |
| Plate sub-labels (LUXURY STORYBOARD, PROMOTIONAL AD CREATIVE, META INVENTORY AD, GOOGLE VEHICLE LISTING ADS) | 10.5px | 10.5px (10.69px at 1440) |
| SOURCE WORK EXAMPLE | 11.3px | 11px |
| Source-card caption | 12px | 12px |

DEVIATIONS.md row 14 sets "min 10.5–12px" as the floor. That floor is too low to read.

## Scores
| Dimension | Score | Evidence (what I see in the screenshot) | Fix |
|---|---|---|---|
| Typography | 6/10 | **Legibility:** see the table above. **Too many sizes:** `styles.json` records 46 distinct font sizes, mostly near-duplicates from measuring each element separately: 16.0/16.1/16.2/16.4, 17.3/17.4/17.7, 19.1/19.2/19.7, 22.0/22.1/22.8, 23.4/23.9/24.1, 46.9/47.8/49.0, 109/110.6/116.3/126.8. **Close H2 at 390** (`close.module.css:29–32`, wdth 50 plus `letter-spacing:-0.021em`): the image's line breaks are lost. It reflows to "READY TO CREATE MORE / OPPORTUNITIES FOR / YOUR DEALERSHIP?", letters touch ("RE", "AD", "SHIP"), and "READY TO" reads as one word. **Mobile orphans:** "FAST / FOCUSED / SOCIAL /" leaves a trailing slash with "RESULTS" alone on the next line. The eyebrow leaves "APPOINTMENT" on its own line. Both audit CTAs end on a lone "AUDIT". The options H2 splits sentences ("START WITH ONE / SERVICE. CONNECT THE / FULL LANE."). **Proof H2 `scaleX(0.76)`, still awaiting a reviewer ruling:** I accept it. V200 is precedent for scaling below the narrowest `wdth` the family offers, it matches image 1's glyph width, and it is `transform:none` at ≤1179px. | (1) Put reading copy on a floor: `font-size:max(16px, calc(N*var(--u)))` for work `.body`, proof `.rules li` and `.positionBody`, growth step text, and options "includes" copy. Put plate sub-labels and the source label on `max(12px, …)`. Remove fixed `height` from those text boxes so the floor can't overflow. (2) Snap the 46 sizes to one token ladder in reference px, merging anything within ±4%: 12 / 14 / 16 / 18.5 / 20.5 / 24 / 32 / 44 / 50 / 77 / 118 / 135. (3) At ≤1179px, close H2 gets `letter-spacing:0`, and the three image lines become `display:block` spans at `clamp(40px,12.5vw,64px)`. (4) At ≤1179px: signal H2 as "FAST / FOCUSED /" + "SOCIAL / RESULTS", eyebrow breaks after the slash, both CTAs use DESIGN.md's own "GET A FREE DEALERSHIP / MARKETING AUDIT" break, and the options H2 gets one sentence per line. (5) Log the proof `scaleX` as accepted in DEVIATIONS row 16. |
| Spacing & rhythm | 8/10 | At 1536 the desktop bands match image 1's y-coordinates. Sections separate by surface change (navy, light, navy, blue, navy) and routed rules, not padding. The ~230px of empty field under the signal labels is in the image. | None on desktop. The mobile dead zone is under Mobile. |
| Color & contrast | 8/10 | AA passes everywhere I measured. The positioning label and INCLUDES labels were already raised to 4.5:1+. **Hover is barely visible:** `.audit:hover` goes `#0054fb`→`#1a63ff` (`hero.module.css:208`, `close.module.css:76`), and work/proof go `→#1a5af0`/`#1a63f5`, all within a few % lightness. **The Meta inventory plate** (work collage, upper right) is filled edge to edge with the supplied file's flat saturated-blue backdrop. Image 1 shows the phone and carousel on navy, and the block now competes with the options band. | Give hover one clearly visible change: invert the icon box (white fill, blue arrow) or use `#2f74ff` plus a 1px cyan border. Replace the Meta file's flat backdrop with `#010b23`: it's presentation background, not ad content. Or crop tight to the phone plus carousel. Log it in DEVIATIONS. |
| Layout & hierarchy | 9/10 | Composition matches the comp in every section. The fold has statement, proof (real creative), primary action plus phone, and the route starting. At 1280 there's no headline/plate collision (V202 checked). | None. |
| Specificity | 9/10 | Real client creative (Gen-X "We Make Luxury Affordable", repo sale, Silverado VLAs), real prices ($5,000 / $2,500 / $2,500 / $750 with commitment terms), the real phone number and email. If you swap the logo, it is still clearly this business. | None. |
| Copy | 9/10 | Matches the A copy deck word for word. No banned words. The non-guarantee is stated. **One false affordance:** "EXPLORE THE WORK →" is `href="#options"` (`Work.tsx:104`). It promises more work and lands on pricing. The label is falsified by where it goes, which is the V178 class. No work or portfolio destination exists in the app. | Wording is locked, so fix the destination. Either add an in-page disclosure (`#work-more`) showing the other supplied creative types the intro already lists (testimonial, employee, viral), or raise it with the owner as a missing destination. Don't leave it pointing at pricing. |
| Restraint | 8/10 | Zero animation, zero gradients, three shadow recipes of its own (plate drop, plate glow, inset hairline) plus the cookie banner's. Every element is prescribed. The only extra things are artifacts in the supplied files: VLA markup arrows and the Meta blue slab. | Remove the artifacts (see Brief adherence). Merge the plate drop and glow into one recipe. |
| Mobile | 6/10 | **Hero art:** `.slab` is `height:min(126vw,560px)` (491px at 390) while `.frontPlate` is 64% wide and sits `bottom` 23px. That leaves about 174px of empty blue above the plates. The creative starts around y≈880, so the 390×844 fold has no creative, on an axis set with `photogenic=visual`. **Clipped frame:** `.frontPlate{right:0}` on a slab that bleeds to the edge (`margin-right:-20px`) cuts the plate's right frame line at the viewport edge. The FAQ panel does the same (left border, no right). Also the orphans and close-H2 collisions under Typography. The good parts: the 4-line H1 is kept, both CTAs sit above the 844 fold, there's no overflow, and body text is 18px. | Size `.slab` to the plates: `height:auto; padding:32px 0 24px`, or `height:calc((100vw - 20px)*0.64*1.18 + 56px)`, so the luxury plate starts about 32px below the slab edge. Set `.frontPlate{right:20px}` so all four frame edges are visible. Give the FAQ panel `margin-right:20px` plus a right border at ≤1179px, or remove its left border so it reads as a deliberate bleed. |
| 4s/40s test | 9/10 | 4s: agency for dealers, more showroom traffic, audit or call. 40s: signal, the 5-step path, the work, standards (what they won't claim), prices, close plus FAQ. It's an argument with a conclusion. | None. |
| Brief adherence | 7/10 | **Work collage, storyboard plate top edge** (just below "VIDEO CREATIVE / LUXURY STORYBOARD", 1536 x≈160–530): `.story .media img{object-position:50% 100%}` with cover crops the source title "30-SECOND LUXURY TV STORYBOARD" through the middle, so a half line of text is visible. The comp shows no sliced line. **Google VLA plate** (lower right): five red annotation arrows point at the "Valley River / Murphy" rows. Image 1's plate has none. They are someone's markup on a screenshot, not ad content, and they read as unedited. **Meta plate:** blue backdrop, as above. DEVIATIONS row 13 ("supplied files, crop only") carried these defects in with the files. | Storyboard: pre-crop `work-luxury-storyboard.png` to start at the JOB NO row. The plate label already names it, and the aspect then fits the box, so nothing is cut through. VLA: erase the five arrows to `#fff` in the build script (they sit on flat white left of the text) or crop above the location rows. Log "annotation removed, ad content untouched". |

## Top 3 changes, in order of impact
1. **Set a legibility floor on the scaled layout.** Use `max(16px, …)` for every reading paragraph and `max(12px, …)` for labels, and remove fixed heights on those text boxes. Then collapse the 46 sizes into the 13-step token ladder. This fixes the work, proof, growth and options sections at 1180–1440.
2. **Clean the work collage.** Pre-crop the storyboard so no text line is cut. Remove the VLA markup arrows. Replace the Meta plate's flat blue backdrop with navy. Point "EXPLORE THE WORK" at real work, not pricing. Record each in DEVIATIONS.md.
3. **Tighten the mobile hero and display lines.** Size the slab to the plates, which removes the 174px dead zone and brings the creative up to the fold. Pull the front plate 20px in from the edge. Restore the image's close-H2 line breaks with `letter-spacing:0`. Fix the four orphan/trailing-slash breaks.

## What is already good (keep)
- Composition matches image 1 section by section at 1536, including the route geometry, the staircase, the tilted repo plate under the luxury plate, the wide first options card and the open FAQ. It scales proportionally to 1280 without collisions.
- The client's creative is used as supplied pixels, never redrawn or stretched (DEVIATIONS rows 5 and 12). The source-work composite is a restack of real pixels, logged with its script.
- AA holds with zero measured failures at 1440 and 390, and two label colours were already corrected to at least 4.5:1. There's a 3px cyan `:focus-visible` ring on all links, and it is ≥4.8:1 against the blue band. The growth light band has no focusable elements, so the cyan ring never lands on light.
- No load animation, no gradients, a `prefers-reduced-motion` kill switch, and no horizontal overflow at any width.
- Prices and commitment terms are stated in full on the page (SR9). The non-guarantee is in the FAQ. There are no invented metrics.
- On mobile the 4-line H1 is kept at `clamp(54px,17vw,88px)` with 18px body, and both the audit and call CTAs are above the 390×844 fold.
- Proof H2 `scaleX(0.76)`: accepted on desktop under V200, and correctly `transform:none` on mobile.

## Route to C (not failures of A)
- Build C on a flow grid with type tokens, not absolute positions in reference px × `--u`. The poster-scaling approach is what makes legibility collapse between 1180 and 1440.
- The work intro names 8 creative types but the collage shows 4. C could make the work the backbone, with testimonial, employee and viral pieces shown and labelled.
- The standards row with icons is prescribed for A. In C, make it a ruled list (V17/SR3 register).

Evidence crops (scratchpad): `/private/tmp/claude-501/-Users-syedali-dev-projects-Gomega-Websites-automated-builds-BDC-promotions/0e2c338a-761d-4760-a3ff-83e06a922e36/scratchpad/{story-top,vla,source-card,close-h2,proof-h2,m-hero-art,m-close,l-growth,l-work}.png`
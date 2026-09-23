# Round 1 — fidelity:A

**Verdict: CHANGES_REQUIRED.** The desktop build closely matches the reference, but typography scores 7/10 and mobile readability 6/10, below the 8/10 floor. Three mobile images also didn't load in the capture, so mobile imagery is UNVERIFIED.

**Artifacts opened**
- Reference: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/refs/variant-a-ref.png` (1536×5696)
- Renders: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r1-a-1536/desktop-full.png` (1536×5696), `laptop-full.png` (1280×4747), `mobile-full.png` (780×19250 at DPR 2), `mobile-fold.png`, `auto-flags.txt`
- Pairs at native size: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/pairs/a/01-hero` through `07-close-footer`, and `mobile-01` through `mobile-09`
- Contract and deviation notes: `DESIGN.md` (Measurement basis, Variant A, A copy deck, Shared behaviour), `workflow/homepage/DEVIATIONS.md`, `workflow/homepage/notes/A-build.md`
- To check causes: supplied files `public/images/design/variant-a/work-inventory-ad.png`, `work-luxury-storyboard.png`, `proof-headlight.jpg`; source `src/components/review/variant-a/{Work,Proof,Options}.tsx`, `hero.module.css`, `close.module.css`, `work.module.css`

**Copy:** every string in all 7 sections matches the reference word for word, including prices, FAQ answers and footer. The footer uses the correct em dash in the source.

**Page height:** 5696 in both. Section starts line up in every pair: signal 864, growth 1376, work 2240, proof 3103, options 3967, close 4832, footer 5591.

## 1. Per-section table
All px values are **estimated** by eye from the native-resolution pairs (about ±5px), unless marked otherwise.

| Section | Target (reference) | Actual (render) | Material difference | Concrete fix | Severity |
|---|---|---|---|---|---|
| Hero | Wordmark box 0–305×0–93. H1 in 4 lines. Luxury plate 907–1507 × 60–770. Repo plate tilted. Blue slanted slab. Two CTAs at y667 and y750. Route line to the arrow at y825 | Boxes, tilt, CTAs, route and copy all match within about 2px. "MOVE MORE" is about 10px narrower; "TOWARD YOUR" is about 16px wider | Glyph proportions only. The cookie banner hides y794–864, so the hero route arrow and the bottom of the call button can't be checked | None required. Recapture with the banner dismissed | Low |
| Signal | "FAST / FOCUSED / SOCIAL / RESULTS", thin slanted slashes about 10px wide. 5 nodes on the rail, labels, drop route | Geometry and labels match. The slashes are heavier (about 15px) and sit about 8px below the baseline. "FOCUSED" is about 15px narrower | Slash weight and depth | Thin the slash to the reference stroke (lighter weight, or a narrower glyph with less vertical extent) | Low |
| Growth | Staircase route, 5 blue number tiles, source card 1100–1536 × 488–802 | Route, tiles, copy and card box all match. "ONE CONNECTED PATH" is about 22px narrower. The "01–05" numerals look lighter. The card's voucher panel shows a tiny one-line button (about 190×12) where the reference has a two-line pill (about 145×45) | Numeral weight. The card panel differs, but that is logged (DEVIATIONS row 5) | Set the tile numerals to weight 800 | Low |
| Work | 4-plate collage. The storyboard header shows the MYNDSET logo. The phone sits on dark navy | Plate boxes, labels, connectors and "EXPLORE THE WORK" match. (a) The storyboard crop leaves a half-clipped line, "30-SECOND LUXURY TV STORYBOARD", just under the label (about y315 in the section). The MYNDSET logo is cropped away. (b) The inventory plate is a saturated blue block about 410×288, from the supplied file's backdrop. (c) The Google plate shows red arrows from the supplied file | (a) Visible crop defect. (b) Palette block that DEVIATIONS.md doesn't mention; only A-build.md notes it | (a) Trim about 12–14px more from the top of the storyboard image, e.g. `.story .media{top:calc(50*var(--u))}` with the bottom anchor kept, or mask it with the label background. (b) Add an explicit DEVIATIONS row for the blue backdrop | Medium (a), Low (b) |
| Proof | Outlined panel. H2 in 2 lines. 3 rules. Positioning block. Black-and-white photo 835–1466 × 127–679 with a large L-shaped headlight in the centre of the frame; the car fills about 66% of the width | Panel, rules, copy and button match. H2 line 1 spans about 632px against about 662px (−30px); line 2 matches. Glyphs look horizontally squashed (scaleX .76). The photo's headlamp is a thin horizontal strip about 45px tall, where the reference lamp is about 140px tall; the car fills about 56% of the width | Photo subject is correct and logged, but lamp scale and prominence drift. H2 line 1 is short | Crop the photo tighter: about 1.2× scale with object-position around 20% 30%, so the lamp is the focal point at about 40% down. Widen the proof H2 slightly (scaleX about 0.79) or add +0.01em tracking so line 1 reaches about 662px | Medium |
| Options | Blue band, 4 cards, wide first card. Prices have a smaller raised "$". Line 2 of the H2 spans 333–1237 | Cards, routes, button and copy match. **"$" is full height** on all four prices. H2 line 2 spans 359–1208, about 55px (about 6%) narrower | "$" glyph treatment is unlogged. Headline width drift | Wrap the "$" in a span, e.g. `font-size:.7em; vertical-align:.3em` (starting values; match the reference). Solve H2 line 2 width separately, per-line tracking or wdth | Medium |
| Close + FAQ | H2 in 3 lines with open, even letter spacing. CTAs. FAQ panel bleeding right. Footer | Geometry, FAQ and footer match. The H2 uses weight 800, wdth 50 and **−0.021em tracking** (`close.module.css:32`). Letters touch ("OPPORTUNITIES", "DEALERSHIP?"). Word gaps are about 12px against about 20px in the reference. Line 1 is about 26px narrower | Visibly denser and blacker than the reference; unlogged | Set `letter-spacing:0` and weight 700, then re-solve line widths with wdth (about 52) | Medium |
| Mobile hero (390) | No reference; adaptation only | The slab is `height:min(126vw,560px)`, about 491px, with plates anchored to the bottom. That leaves about 170px of empty blue above the plates. The audit CTA wraps with "AUDIT" alone on line 2 | Dead space in the slab; orphaned word | Size the slab to its content, e.g. `height:min(96vw,430px)` (estimate), or move the plates up. Use the contract's line break: "GET A FREE DEALERSHIP / MARKETING AUDIT" | Medium |
| Mobile work/proof | — | The inventory plate is an empty dark area, the Google plate a blank white box, the proof photo an empty frame. `next/image` lazy-loads by default and the full-page capture didn't wait | UNVERIFIED. The builder says the images load after scrolling, but no screenshot shows that | Recapture after scrolling through the page and waiting until every `img.complete` is true | Blocks mobile imagery sign-off |
| Mobile close | — | H2 at 58.5px with −0.021em tracking and wdth 50 collapses the word gaps: "READYTO CREATE MORE", "OPPORTUNITIESFOR" | Readability defect | In the ≤1179px block: `letter-spacing:0; word-spacing:.12em` (starting values) | Medium |

**Missing or extra content:** none in any section. Nothing below the footer is left unreviewed; the reference ends at 5696 and so does the render.

## 2. Deviations
**Accepted**
- DEVIATIONS row 5: growth source card built from the customer's real pixels, rearranged. It doesn't fabricate creative, and the card box matches.
- Row 6: the proof photo is generated. The subject and direction are right. Scale and crop still need the fix in the table.
- Rows 10 and 11: contrast lifts for AA (`#2b76e1`, `#1e73fc`). The hue shift is small.
- Row 12: hero plates show the real supplied pixels. Boxes and tilt match within about 2px, confirmed visually.
- Row 13: work plates show the supplied files. Accepted, but the inventory plate's blue backdrop must be logged in DEVIATIONS.md itself.
- Rows 14 and 15: small-text minimums, 44px targets, fluid scaling from 1180 to 1920, stacked layout at 1179px and below. The laptop capture at 1280 keeps the composition.
- Row 16: proof H2 using the narrowest Saira with horizontal scaling. Accepted as a method; line 1 is still about 30px short.
- A-build.md header link: the wordmark links to `/` with an aria-label that starts with the visible text. That's functional and meets label-in-name.

**Rejected or challenged (unlogged drift)**
- Close H2 negative tracking.
- Full-height "$" on prices.
- The clipped storyboard sliver and missing MYNDSET logo.
- Heavier signal slashes.

None of these are in the ledger, and none are accessibility or functional corrections.

**Coverage limits**
- Desktop y794–864 is hidden by the cookie banner in both the 1536 and 1280 captures.
- Three mobile images didn't load.
- There is no mobile reference.
- My px values are estimates from native-resolution pairs. They are not a bbox script.
- The builder's claim of "dw within ±10px" doesn't hold per line: options H2 line 2 is about −55px, proof H2 line 1 about −30px, close H2 line 1 about −26px. Their script likely measured only the widest line.

## 3. Scores
| Area | Score | Why |
|---|---|---|
| Geometry | 9/10 | |
| Typography | 7/10 | Close H2 collisions, "$" treatment, line-width drift, proof H2 squash |
| Imagery | 8/10 | Proof lamp scale, storyboard crop sliver |
| Spacing/craft | 8/10 | |
| Mobile readability | 6/10 | Collapsed word gaps in close H2, about 170px dead slab, orphaned "AUDIT", images unverified |

## 4. Highest-impact fixes
1. **Close H2** (`close.module.css:29-32`): tracking from −0.021em to 0 and weight from 800 to 700, then re-fit the three lines to the reference widths (about 485, 608 and 640px, estimated). On mobile, add word spacing of about .12em. This fixes a desktop typography drift and the mobile readability defect.
2. **Recapture mobile** after a scroll-through and a wait for images to load. This is needed to verify the inventory, Google and proof images.
3. **Mobile hero slab**: cut the height from about 491px (calculated from the CSS) so the empty blue area is under 40px (estimated).
4. **Prices**: make the "$" smaller and raised on all four cards, as in the reference.
5. **Storyboard crop**: trim about 12–14px more from the top so the half-line of "30-SECOND…" is gone (estimated).
6. **Proof photo**: crop tighter (about 1.2×) so the headlamp is the focal point, about 140px tall in a 552px frame as in the reference (estimated).
7. **Headline line widths**: widen options H2 line 2 by about 55px and proof H2 line 1 by about 30px (estimated).
8. **Ledger**: add a DEVIATIONS row for the inventory file's blue backdrop.
# Variant A · fix round 1 (2026-09-23)

Scope: `src/components/review/variant-a/**`, `public/images/design/variant-a/**` (derived files only),
`workflow/homepage/scripts/derive-variant-a-work.py`. Dev server :3417. Evidence: `workflow/homepage/reviews/r1/fix-a/`.

## Checks
- `npx eslint src/components/review/variant-a src/app/variant-a` → exit 0, no warnings. `npx tsc --noEmit -p .` → 0 errors.
- Every file stays under 500 lines. The largest are `work.module.css` at 468 and `options.module.css` at 466.
- Geometry probe (`fix-a/probe.mjs` + `cmp.py`) compares the text boxes from before and after, at 1536, 1440, 1280 and 1180.
  Result: 0 new text/text or text/image collisions at 1440, 1280 and 1180, and 0 horizontal overflow. The only 1536 moves over 3px are the intended reference fixes, listed in
  `fix-a/geometry-drift-1536-and-collisions.txt`.
- Supplied originals are unchanged: sha256 before and after match for `work-*.png`. Only new files were added.
- compare-pngs vs image 1 at 1536: **15.09 %** differing pixels, down from 16.88 % at build-final. This is a diagnostic only
  (`workflow/homepage/comparisons/a-fix-r1/`).
- Console: the only error is the existing review-bridge `<head>` hydration mismatch, which comes from the root layout and not from A.

## Review items
| # | Item (source) | Status | Evidence |
|---|---|---|---|
| 1 | Reading floor below 1536 (critic): work intro, proof rules, positioning body, growth step copy, options includes, FAQ answers | FIXED: `max(16px, …)` with `line-height: max(N·u, R em)`. At 1536 the size is the token value and the line-height is unchanged. At 1180/1280 the text renders at 16px | `final-1180x820-full.png`, `final-1280x800-full.png`, `geometry-final.json` |
| 1b | Labels, plate sub-labels, source label ≥12px (critic) | FIXED: `max(12px, …)`. Plate sub-labels go from 11.4 to 12px at 1536 as well, which makes them 5–7px wider (logged below) | pair-04-* |
| 1c | Fixed heights that would overflow (critic) | FIXED: `.includes` now uses `min-height`. With the floor, two things would have collided, so each was given a floor-aware position that equals the reference value at 1536: (a) the work intro vs the event plate at 1180, where the plate's left edge = `max(621u, 120u+412px)`; (b) proof rule column 3, `max(582u, 387u+166px)` | `final-1180x820-full.png`; probe: 0 collisions |
| 2 | 46 near-duplicate sizes → token ladder (critic) | FIXED: 20 steps (`--fs-12 … --fs-135` in `signal-lane.module.css`). Measured sizes at 1536: 20 ladder values plus the two relative "$" sizes. Widths were re-solved with tracking/wdth, so the 1536 drift is ≤5px outside the intended fixes | `geometry-drift-1536-and-collisions.txt` |
| 3 | Close H2: tracking 0, weight 700, per-line widths (both) | FIXED: 483 / 606 / 639px vs image 483 / 606 / 638. Mobile uses the image's three lines as blocks at `clamp(40px,12.5vw,64px)`, tracking 0 and word-spacing .04em | pair-07-close-h2, final-390/320 |
| 4a | Smaller raised "$" (fidelity) | FIXED. The "$" is its own span with a relative offset, so the baseline doesn't move. Digits now match the image's height as well: 61/62px (was 53), and 83px on card 1 | pair-06-options-prices |
| 4b | Options H2 line 2 −55px; proof H2 line 1 −30px (fidelity) | FIXED: options 904/900 (image 904/900); proof 653/677 (image 655/678) | pair-06-options-h2, pair-05-proof-h2 |
| 4c | Signal slashes thinner and at the reference depth (fidelity) | FIXED: 8px stroke (image 8), y 996–1095 (image 997–1095). Per-slash spacing was solved against the image; words are within 3–9px | pair-02-signal-h2 |
| 4d | Growth tile numerals weight 800 (fidelity) | FIXED | pair-03-growth |
| 4e | "ONE CONNECTED PATH" −22px; hero "SHOPPERS"/"TOWARD YOUR" drift (fidelity) | FIXED with per-line wdth: growth 723 (image 725); hero lines 431/390/495/429 (image 433/389/495/429). Mobile resets these to a single width | pair-01-hero, pair-03-growth |
| 5a | Storyboard sliced text line (both) | FIXED: derived crop starts at the JOB NO row. NOT restored: the MYNDSET logo, which sits in the same rows as the title | pair-04-work-storyboard |
| 5b | Meta plate flat blue backdrop → navy (both) | FIXED: derived file. The backdrop (42.8 % of pixels, connected to the border) is recoloured to #00061a and the fringe re-blended. Ad, phone and carousel pixels are untouched | pair-04-work-inventory-google |
| 5c | Google VLA red markup arrows (critic) | FIXED by CROP. The arrows cross card borders and card interiors, so they don't sit on flat background. The derived crop (14,12)–(954,408) drops the matte, the location rows and the arrows | same |
| 5d | Provenance (both) | FIXED: `workflow/homepage/scripts/derive-variant-a-work.py` (rerunnable, documented) | — |
| 6 | Proof photo: headlamp as the focal point (fidelity) | FIXED: 1.2× crop (origin 0 24.5 %). The car fills about 66 % of the width and the lamp sits at about 40 % height. The lamp is a thin strip in the generated source, so its shape still differs from image 1's L-shaped lamp | pair-05-proof-photo |
| 7 | "EXPLORE THE WORK" false affordance (critic) | FIXED: `ExploreWork.tsx` is a `<button aria-expanded aria-controls="a-work-more">`, keyboard tested with Enter and Space. Focus stays on the toggle and the arrow rotates. The panel shows the three supplied creatives whole, with labels. Collapsed, the panel is `hidden`, has no children and requests no images, and the page stays at 5696px | `explore-open-1536.png`; page height 5696 → 6438 → 5696 |
| 8 | Visible CTA hover; merge shadows (critic) | FIXED: one hover recipe on all 7 CTAs (`--hover-ring`, a 3px inset cyan ring). The plate drop and plate glow are now one `--plate-shadow` | `hover-states-1536.png` |
| 9a | Mobile hero slab dead blue; front plate cut at the edge (both) | FIXED: the art row is a grid cell shared by the slab and the plates, so the slab is exactly plate + 28px. The front plate sits 20px inside and all 4 frame edges are visible | final-390 (hero art) |
| 9b | FAQ panel border (critic) | FIXED: contained panel with 4 borders on mobile | final-390 |
| 9c | Orphans (critic) | FIXED: signal "FAST / FOCUSED /" + "SOCIAL / RESULTS"; eyebrow breaks after the slash; both audit CTAs break "GET A FREE DEALERSHIP / MARKETING AUDIT"; options and proof H2s are one sentence per line; `text-wrap: pretty` applies wherever copy reflows | final-390, final-320 |
| 10 | Mobile imagery verified at 390 dpr2 and 320 | FIXED: capture.mjs reports `broken: []` and `overflowX: 0` at 390 and 320 | final-390x844-dpr2-full.png, final-320x700-dpr2-full.png |
| — | Ledger rows for the Meta backdrop, proof scaleX accepted (V200), etc. | NOT FIXED here: I don't own `DEVIATIONS.md`. The rows are listed below for the coordinator | — |
| — | "FOCUSED" about 15px narrower (fidelity) | PARTIAL: word positions are within 9px; the glyph proportions are Saira's | pair-02 |
| — | Growth source card voucher panel (fidelity) | NO CHANGE: already logged (DEVIATIONS row 5) | — |
| — | Mobile captures still show the cookie banner | NOT FIXABLE in scope: on the dev server, Next's "1 Issue" dev badge (the existing root hydration warning) covers the Accept button, so capture.mjs's click times out. This doesn't happen on desktop or in production | final-390/320 |

## Deviations to log (variant | section | target | change | reason | evidence)
| Variant | Section | Target (image) | Change | Reason | Evidence |
|---|---|---|---|---|---|
| A | Work · storyboard plate | Storyboard from its top, MYNDSET logo visible | `work-luxury-storyboard-crop.png` = rows 48–639 of the supplied file, top-anchored. Title rows and logo cropped out | No sliced text line; crop only | `scripts/derive-variant-a-work.py`, pair-04-work-storyboard |
| A | Work · Meta inventory plate | Phone and carousel on navy | `work-inventory-ad-navy.png`: flat blue presentation backdrop → #00061a, fringe re-blended; ad, phone and carousel untouched | Match image 1; presentation background only | same script, pair-04-work-inventory-google |
| A | Work · Google VLA plate | Full SERP incl. location rows, no markup | `work-google-vla-crop.png` (14,12)–(954,408): matte, location rows and 5 red markup arrows cropped. Cover, anchored top-left, so card 5 is cut at the right | Arrows cross card borders and interiors, so they are cropped rather than painted out | same |
| A | Work · "Explore the work" | Static button | Disclosure button revealing *Massive Used Car Sales Event*, *Wholesale to the Public* and *Massive Repo Sale*, whole | Real behaviour instead of a jump to pricing | explore-open-1536.png |
| A | Work · event plate, 1180–1256px only | Left edge 621 | `max(621u, 120u+412px)`; the creative is cropped a little more at the sides | 16px intro floor needs the room | final-1180 |
| A | Proof · rule column 3, below about 1280px | 582 | `max(582u, 387u+166px)` | 16px floor | final-1180 |
| A | Type · floors (replaces row "min 10.5–12px") | Scaled poster type | Paragraphs `max(16px,…)`; labels `max(12px,…)`. Plate sub-labels are 12px at 1536 (image 11.4) | Legibility | geometry-final.json |
| A | Type · ladder | 46 measured sizes | 20 steps; line widths re-solved with wdth/tracking | Consistency | geometry-drift…txt |
| A | Close H2 | Open, even tracking | Weight 700, tracking 0, per-line `scaleX(.982/.935/.934)` because Saira wdth 50 is still wider than the image's glyphs | Fidelity; V200 precedent | pair-07 |
| A | Proof H2 | Line 1 wider than line 2 | Line 1 gets an extra `scaleX(1.05)` (total .798). Mark row 16 (`scaleX .76`) as **accepted** by critic-A under V200 | Per-line width | pair-05-proof-h2 |
| A | Headlines | Per-line measured widths | Per-line wdth: options 57.65/61.75, growth line 1 59.1, hero 61.25/65.5/57.75/60.25 (all reset to one width when stacked) | Per-line width | pair-01/03/06 |
| A | Options · prices | Digits 62px tall, smaller raised "$" | Digits 88px (card 1 118px), wdth 52/50, weight 700. "$" 0.87em raised .065em (card 1 .82em/.114em). Rows moved 4px and 3px down to the image baseline | Fidelity | pair-06-options-prices |
| A | Signal · slashes | Thin, steeper, sitting on the baseline | Weight 500, `skewX(-7.5deg) scaleY(.925)`, per-slash spacing | Fidelity | pair-02 |
| A | Proof · photo | Headlamp as focal point | 1.2× crop of the generated image (transform, origin 0 24.5 %) | Crop only | pair-05-proof-photo |
| A | All CTAs | Static | Hover: 3px inset cyan ring (one recipe) | Visible hover state | hover-states-1536.png |
| A | Hero · plates | Two shadow recipes | One `--plate-shadow` | Restraint | pair-01 |
| A | Mobile · hero art | Not shown | Slab sized by the plates; front plate 20px inside the bleed edge | Responsive adaptation | final-390 |
| A | Mobile · FAQ | Not shown | Contained panel, 4 borders | Responsive adaptation | final-390 |
| A | Mobile · headings/CTAs | Not shown | Image line breaks as blocks (close); one sentence per line (options, proof); signal pairs; eyebrow and audit CTA breaks | No orphans | final-390, final-320 |

## Final captures
`workflow/homepage/reviews/r1/fix-a/`: `final-1536x864-full.png` (5696 tall), `final-1440x900-fold.png`, `final-1280x800-full.png`,
`final-1180x820-full.png`, `final-390x844-dpr2-full.png`, `final-320x700-dpr2-full.png`. Every capture reports `broken: []` and `overflowX: 0`.
Comparison: `workflow/homepage/comparisons/a-fix-r1/`.

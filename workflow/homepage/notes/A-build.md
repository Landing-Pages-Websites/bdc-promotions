# Variant A · Signal Lane — build report (2026-09-23)

Final capture: design-psyche `screens/bdc-a-build-final/` (1536 desktop-full 1536×5696, laptop 1280×4747, mobile 390@2x).
Comparisons: `workflow/homepage/comparisons/a-build-iter1 … a-build-iter6`, `a-build-iter7-final`.

## What changed
Rebuilt from scratch in `src/components/review/variant-a/`:
`SignalLane.tsx` (shell, header, footer) · `Hero.tsx` · `Signal.tsx` · `Growth.tsx` · `Work.tsx` · `Proof.tsx` · `Options.tsx` · `Close.tsx` ·
`Lines.tsx` (keeps the image's line breaks on desktop, reflows below 1180px) · `icons.tsx` (inline stroke SVGs) · `fonts.ts` ·
one CSS module per section + `signal-lane.module.css` (tokens/header/footer). Every file is under 500 lines; the largest is `options.module.css` at 432.
`src/app/variant-a/page.tsx` has been reformatted, with an explicit return type added.

Geometry method: every desktop value is the measured reference pixel × `--u` (`min(100cqw,1920px)/1536`), so at 1536 the page matches
the image's coordinates, it scales fluidly between 1180 and 1920, and above 1920 the frame is centred with the slab, source card and FAQ panel still bleeding to the
right edge (`--bleed`). At 1179px and below, each section switches to a single stacked column (max 760px, same order, all images kept, stacked CTAs).

## Per-iteration diff (compare-pngs, diagnostic only)
| Iter | Capture | differingPixelsPct | Main fix that round |
|---|---|---|---|
| baseline | bdc-a-baseline-1536 | 39.69 (height 5736) | — |
| 1 | bdc-a-build-iter1 | 17.81 | full rebuild to measured geometry; all section starts land on the reference y |
| 2 | bdc-a-build-iter2 | 17.09 | per-role font fits (buttons/labels/FAQ → Saira wdth 56–62; letter-spacing solved from measured widths) |
| 3 | bdc-a-build-iter3 | 17.11 | mobile fixes (hyphen line joins, signal list), stack breakpoint 1179px, 44px floors, small-text floors |
| 4 | bdc-a-build-iter4 | 16.88 | bbox-driven nudges: prices −9px, options/growth H2 width, proof scaleX, step-01 copy |
| 5 | bdc-a-build-iter5 | 16.90 | >1920 bleed, reduced-motion, close H2 weight test (700 was worse; reverted) |
| 6 | bdc-a-build-iter6 | 16.90 | signal split into its own file (hero CSS was over 500 lines) |
| 7 | bdc-a-build-final | 16.88 | close H2 back to 800 |

Section starts (final, edge-colour transitions) vs reference: signal 864/863 · growth 1376/1376 · work 2240/2240 · proof 3103/3103 ·
options 3967/3967 · close 4832/4832 · footer 5591/5591. Page height is 5696 in both.

Element bbox deltas at 1536 (script `bbox.py`, ref vs actual): most text blocks are within ±3px in x and y, and widths are within ±10px. Examples: H1 dx0 dy−1 dw0;
signal H2 dx+1 dw−2; growth H2 dw+1; proof H2 dw+1; options H2 dx−5 dw+6; close H2 dw+2; FAQ q/a ±1; footer cells ±3.

## Remaining differences (honest)
- **Hero plates, inner content.** The plate boxes, tilt (−8.5°) and edges match within 2px. The *content inside them* doesn't. The mockup redrew
  both creatives: it squashes the luxury ad about 6% vertically and places the repo ad's artwork about 20px lower and 4% larger. We show the customer's real
  pixels with `object-fit: cover` and no stretching, so text inside the ads (e.g. "$1,000", "MESSAGE OR COMMENT NOW!") sits up to 25px lower than in the image.
  This region accounts for most of the hero's remaining diff. The other main contributor is the cookie banner covering y 794–864 in the capture.
- **Work plates.** Same cause, at a smaller scale: the mockup's Meta inventory and Google VLA plates are re-rendered versions. Ours show the supplied files
  (the inventory file has a blue backdrop; the Google file has a thin matte, trimmed with a 1.03 scale inside overflow:hidden).
- **Type texture.** The mockup's display type has a grainy, printed texture, and its glyphs differ slightly from any webfont (the M, R and S shapes).
  Glyph-edge diff is the rest of the close/proof/signal residual.
- **Source-work label** is about 1px larger than the image's tiny caption. It is kept at an 11px minimum at smaller viewports so it stays readable.
- **Mobile** isn't shown in the image. It's an adaptation: same section order, slab and plates stacked under the copy, growth steps on a vertical
  route, work plates in order event → storyboard → inventory → Google, options cards stacked, FAQ open.

## Fonts (chosen by measured cap-height/width fits and side-by-side glyph crops, not taste)
| Role | Face | Why |
|---|---|---|
| H1, growth/options/close H2, step titles, card names, prices, tiles | **Saira** variable, `wdth` 50–62, wght 500–800 | The width axis solves each headline's measured width at its measured cap height (H1 wdth 61 → "MOVE MORE" 436px @ 80px cap). Saira Extra Condensed/Barlow Condensed 800 were 8–18% too wide on "TOWARD YOUR". |
| Signal "FAST / FOCUSED…", proof H2 | Saira wdth 50 (proof +scaleX .76, weight 600) | The image's proof H2 is narrower than any Google condensed face at that cap height (Big Shoulders 500 was 17–22% wide; League Gothic, Antonio and Six Caps missed it too), so we used the narrowest Saira plus a measured horizontal scale. |
| Buttons, FAQ questions | Saira wdth 56–62, weight 700 | These matched the measured widths better than Barlow Condensed. Barlow needed −0.06 to −0.08em tracking, which crushed the counters. |
| Letter-spaced labels, eyebrows, signal labels, work plate labels, footer brand | **Barlow Condensed** 500–700 | Glyph shapes match the image's small caps labels. Tracking was solved per label from measured widths. |
| Work body, card terms/includes, proof rules, options eyebrow | **Barlow Semi Condensed** 400–600 | Measured width fits the narrower secondary body copy. |
| Body copy (hero, growth intro, proof body, FAQ answers, footer links) | **Instrument Sans** variable, `wdth` 88–100 | Hero body line 1 fitted to 474px at 17px cap. Inter was 18% too wide; Barlow Semi Condensed matched the width but its letterforms looked visibly condensed; Instrument Sans wdth 88 matched glyph shapes best. |
All loaded through `next/font/google` in `variant-a/fonts.ts`; the CSS variables (`--a-display/label/semi/body`) are scoped to the variant root.

## Deviations to log (variant | section | target | change | reason)
| Variant | Section | Target (image) | Change | Reason |
|---|---|---|---|---|
| A | Proof · positioning label | `#1669de` on `#010a1b` (3.87:1) | `#2b76e1` (4.51:1) | AA for 18px text; smallest lift that passes |
| A | Options · "INCLUDES" labels | `#0563fc` on `#010b23` (3.91:1) | `#1e73fc` (4.58:1) | AA for small caps text |
| A | Hero · luxury + repo plates | Mockup's redrawn creatives (luxury squashed ~6% vertically) | Real supplied pixels, `object-fit: cover`, no stretch | Customer creative is shown as supplied |
| A | Work · inventory / Google plates | Re-rendered mockup plates | Supplied files; Google matte trimmed by a 1.03 scale in its box | Same, with a crop only |
| A | Proof · photo | B&W headlight | Existing generated `proof-headlight.jpg`, `alt=""` (decorative) | Already logged; image is atmosphere, not proof |
| A | Header | Wordmark only | Wordmark kept as a link to `/` with aria-label "BDC Promotions — back to the homepage direction chooser" | Review chooser navigation |
| A | All ≥1180px | Static 1536 comp | Fluid `--u` scaling 1180–1920; bleed kept above 1920; stacked layout ≤1179px | Real responsive page |
| A | Small labels at <1536 | 11–13px caps at 1536 | Minimum 10.5–12px | Legibility floor when scaled down |
| A | Call / process buttons at <1536 | 61px / 54px tall | `max(44px, …)` | 44px target floor |
Large decorative elements below 4.5:1 (FAQ "Q" at 51px, card numerals at 50px, signal slashes at 135px) are aria-hidden or large text and pass 3:1.

## Checks
- **Accessibility:** one `h1`. Heading order is h1 → h2 (signal, growth, work, proof, options, close) → h3 (steps, cards, sr-only FAQ heading).
  Every `img` has an alt naming the creative (the proof photo is decorative with `alt=""`). `:focus-visible` shows a 3px cyan outline. All links are ≥44px at 320,
  390, 768, 1180, 1280, 1536, 1920 and 2560 (playwright probe). There is no horizontal scroll at any of those widths: scrollWidth equals the viewport. The only elements
  past the edge are route SVG paths, clipped by `overflow-x: clip`. `prefers-reduced-motion` disables all transitions. All eight images decode on mobile after scrolling.
- **Console:** the only error is the pre-existing dev hydration mismatch on `<head dangerouslySetInnerHTML>` (the review-bridge script). It's outside variant A.
- **`npx eslint src/components/review/variant-a src/app/variant-a`:** exit 0, no warnings.
- **`npx tsc --noEmit -p .`:** 60 errors, none in variant-a files. All come from the unbuilt workspace package `@landing-pages-websites/managed-site-contract`
  (`src/content/managed-site.ts`, `src/components/home/*`, `fixtures/astro-reference`, `packages/managed-site-conversion`). `npm run prebuild` normally builds that package.

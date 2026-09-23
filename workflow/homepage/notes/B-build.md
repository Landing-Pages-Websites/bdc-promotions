# Variant B · Dealer Field Journal — build report (2026-09-23)

Reference: `workflow/homepage/refs/variant-b-ref.png` (1536×5696). Route: `/variant-b`.
Final capture: design-psyche `screens/bdc-b-build-final2/` (`screenshot1536.mjs`: desktop 1536, laptop 1280, mobile 390@2x).
Final comparison: `workflow/homepage/comparisons/b-build-final2/`. Rendered page height at 1536 = 5696, the same as the image.

## What changed

The old component was a loose interpretation in one minified file. I rebuilt it section by section against image 2:

- `src/components/review/variant-b/DealerFieldJournal.tsx` sets up the root and loads the fonts, with the font variables scoped to the variant root.
- `JournalHero.tsx`: nav and hero.
- `JournalMethod.tsx`: signal ledger and growth lane.
- `JournalWork.tsx`: work band.
- `JournalProof.tsx`: proof section and options ledger.
- `JournalClose.tsx`: close section and footer.
- `JournalIcons.tsx`: inline line icons for check-circle, check badge, arrow, phone, mail, camera and clipboard with magnifier.
- CSS modules, one per section, each under 500 lines: `dealer-field-journal` (tokens), `journal-nav`, `journal-hero`, `journal-signal`, `journal-growth`, `journal-mat`, `journal-work`, `journal-proof`, `journal-options`, `journal-close`, `journal-footer`.
- `src/app/variant-b/page.tsx` is reformatted and has an explicit return type.

**How it scales.** Every length is `N * --u`, where `--u = clamp(0.5px, 100cqw/1536, 1px)`:

- At 1536 wide, 1 unit is 1px, so each value is the measured image pixel.
- At 1280 the whole composition scales down proportionally.
- At 1920 it is capped and the 1536 layout sits centred. Full-bleed bands and the cream work strip still reach the viewport edges.

Most text uses `text-box: trim-both cap alphabetic`, so each `top` value is the cap-top y measured in the image. At 760px and below each section switches to single-column normal flow in the same order. It keeps every image and stacks the CTAs.

**Copy.** Wording comes from the B copy deck and is confirmed against the image at native resolution; I found no differences. Where lines break exactly as in the image, the split pieces rejoin to the verified strings in `content.ts`. I checked this with a script for the FAQ answers, the step copy and the options "includes" text.

## Diff per iteration (`compare-pngs.mjs`, diagnostic only)

| Iteration | Capture | differingPixelsPct | Main change |
|---|---|---|---|
| 0 | bdc-b-build-iter0 | 33.86 | baseline (old component, height 5537) |
| 1 | bdc-b-build-iter1 | 10.14 | full rebuild on image coordinates; height 5696 |
| 2 | bdc-b-build-iter2 | 9.96 | fixed global `h2,h3` (Barlow Condensed) and `a` colour leaks; lining signal numerals; label widths |
| 3 | bdc-b-build-iter3 | 9.88 | Roboto `wdth`-axis tuning of copy widths; step copy tracking; FAQ spacing |
| 4 | bdc-b-build-iter4 | 9.88 | hero CTA text widths, proof-note weight, mobile nav targets |
| 5 | bdc-b-build-iter5 | 9.85 | proof statement, FAQ, card and work caption widths |
| 6 | bdc-b-build-iter6 | 9.85 | handwriting face swapped to Caveat; heavier timeline and nodes; card phone icon |
| 7 | bdc-b-build-iter7 | 9.84 | handwriting size; work strip width at wide viewports |
| 8 | bdc-b-build-iter8 | 9.84 | CSS split into section modules (desktop pixel-identical to iter 7) |
| final | bdc-b-build-final2 | 9.82 | mobile arrowhead anchoring; FAQ item spacing |

**Why the diff stops falling near 9.8%.**

- The two photo plates account for about 33% of the differing pixels: hero plate 12.6%, repo plate 20.1%. The image shows AI re-renders of the creative, while the page shows the customer's real files.
- Most of the rest is text anti-aliasing and the paper grain painted into the image.
- Geometry now matches (see the next table), so this remainder is not layout error.

## Section alignment at 1536 (ink extents, image vs actual)

| Element | Image y | Actual y | Δ top / Δ bottom |
|---|---|---|---|
| nav labels | 23–56 | 23–56 | 0 / 0 |
| hero H1 (3 lines, same wraps) | 144–397 | 144–398 | 0 / +1 |
| hero plate crop marks | 94–129 | 94–129 | 0 / 0 |
| signal H2 | 955–1025 | 953–1025 | −2 / 0 |
| signal columns | 1051–1230 | 1051–1230 | 0 / 0 |
| growth step 01 | 1466–1563 | 1466–1562 | 0 / −1 |
| growth H2 (2 lines, same wraps) | 1603–1714 | 1607–1714 | +4 / 0 |
| growth mat | 1437 | 1438 | +1 |
| work band top | 2240 | 2240 | 0 |
| work H2 + body | 2295–2399 | 2295–2399 | 0 / 0 |
| Explore the Work + underline | 2960–2996 | 2960–2996 | 0 / 0 |
| proof H2 | 3296–3417 | 3295–3417 | −1 / 0 |
| proof rules | 3773–3857 | 3773–3857 | 0 / 0 |
| options H2 (1 line) | 4089–4143 | 4088–4141 | −1 / −2 |
| ledger row 1 / row 4 | 4182–4269 / 4560–4650 | 4182–4269 / 4559–4649 | 0 / ±1 |
| Find the Right Mix | 4669–4760 | 4670–4758 | +1 / −2 |
| close H2 (5 lines, same wraps) | 4974–5378 | 4979–5374 | +5 / −4 |
| FAQ rules | 5011/5127/5258/5403/5552 | 5011/5124/5252/5403/5553 | ≤6 |
| audit card | 4981–5555 | 4981–5554 | 0 / −1 |
| footer | 5587–5695 | 5586–5695 | −1 / 0 |

Image boxes are matched by template-matching the supplied files against the image:

- **Hero plate:** 601×614 at x 868, y 111, `object-fit: cover`. The image's crop offset is 68/751, which is centred, so the top begins at "LUXURY" and the bottom ends just below "SAVINGS VOUCHER".
- **Storyboard:** 365×548 inside a 459×549 frame.
- **Event plate:** 338×422 full creative.
- **Inventory:** 415×227 contained on its own dark side bars.
- **Google VLA:** 435×230.
- **Repo plate:** 554×572 inside a 608×660 mat.

## Fonts (all via `next/font/google`, scoped to the variant root)

In the table, "ratio" is rendered width ÷ image width, measured with the font sized so its cap height matches the image.

| Role | Face | Evidence |
|---|---|---|
| Hero H1; work H2 | **EB Garamond** (variable; 450 hero, 500 work) | Hero cap 66 gives width ratio 1.002 ("Shoppers Toward") and 1.003 ("Move More"); x-height/cap 0.62 against 0.636 in the image. Cormorant was 1.06, Newsreader 1.07, Libre Caslon Text 1.05 and Source Serif 1.02 but with the wrong x-height. |
| Signal H2 and numerals; proof H2; audit-card title | **Cormorant Garamond** (400/500) | Proof H2 ratio 0.995. The signal H2 matches the image's thin, high-contrast glyphs; width is corrected with −0.014em tracking. The signal numerals use lining figures at cap 25. |
| Close H2; options H2; ledger numerals; close "06" | **Libre Caslon Display** | Close H2 ratio 1.016, where EB Garamond was 1.15 and Cormorant 1.23. Options H2 ratio 1.03. The ledger "01" matches lining figures. |
| Growth H2 (condensed) | **Instrument Serif** plus `scaleX(0.72)` | No Google Fonts face is condensed enough: the image is 378px wide at cap 44. Instrument Serif needs ×1.39, Roboto Serif at wdth 50 ×1.34, and Noto Serif Display at wdth 62.5 is wider still. Cormorant with tracking cannot get there, and Playfair SC is the wrong design. Instrument Serif has the closest Garamond-like glyphs, so I condensed it with a transform. Cap height and wraps match; mobile uses 0.82. |
| Sans (body, labels, ledger, buttons) | **Roboto** (variable, `wdth` 75–100, italic) | Body line ratio 1.03 (Inter 1.06, IBM Plex 1.05). Bold "Lead Generation" 1.007 (Inter 1.07). The `wdth` axis sets the image's narrower runs per role: step copy 75%, descriptors 91%, statement and FAQ 80–84%. |
| Handwritten timeline notes | **Caveat** 600 | I tested Caveat, Nanum Pen Script, Kalam 300/400, Shadows Into Light (and Two), Gochi Hand, Reenie Beanie, Covered By Your Grace, Delicious Handrawn and others. Caveat 600 matched the slant, stroke weight and compact set best; Kalam's letter shapes were close but its set was 18–20% too wide. |

The design-psyche automatic flag "banned font family: roboto" is dismissed. B is locked to image 2, and Roboto is the metric match for its grotesk; the A/B fidelity rule takes precedence.

## Remaining differences (honest)

1. **Plate colours.** The image re-renders the customer creative with different lighting and colour. The page shows the supplied files, and the geometry matches to about 1px.
2. **Repo plate.** The image stretches the square creative to 554×572. I kept that box with `cover`, so about 9px is trimmed from each side and nothing is distorted.
3. **Handwriting.** Caveat's x-height is smaller than the image's hand, and note widths are within about 10%. The notes are real selectable text, rotated −5°.
4. **Step copy.** The image's grotesk is narrower than Roboto at 75% width. I used −0.028em tracking; lines are within about 2–3% and wrap the same way.
5. **Signal numerals.** The image draws hybrid old-style digits where "03" dips slightly. I used Cormorant lining digits at the matched height.
6. **Crop marks and frames.**
   - The work-band frames use one crop-line treatment: 1px lines overshooting every corner by 10px.
   - The image's storyboard frame shows mainly top and left lines.
   - The Google frame in the image has a double line.
7. **Growth H2 line 1.** The image sets "One Connected Path" looser than line 2. I reproduced this with +0.06em tracking on that line.
8. **Mobile (390/320).** The image does not show mobile, so this is an adaptation:
   - Nav links wrap under the logo.
   - Signal becomes 2×2.
   - The timeline becomes a dashed left rule with the notes under each step.
   - The ledger rows stack.
   - The FAQ stays fully open and the audit card follows it.
   - In the screenshot script's mobile capture, the inventory and Google images are still lazy and not yet decoded (the settle flag). They decode on scroll; an eager-loading clean capture confirmed all 7 images load.

## Deviations to log

| Variant | Section | Target (image) | Change | Reason |
|---|---|---|---|---|
| B | Nav · logo slot | outlined "Logo reserved" box | real BDC Promotions logo, 61px tall, in the slot, linked to `/` with `aria-label` | placeholder text, not copy (already in DEVIATIONS) |
| B | Work band · label + 4 captions | teal `#266878` on navy `#000a1b` (3.15:1) | `#3a8599` (4.72:1) | AA contrast for 13–16px text; smallest change that passes |
| B | Work band · Explore the Work | blue ≈`#0a56f0` on navy (3.3:1) | `#1f63ff` (4.05:1) | clearer on navy; 24.5px bold is large text, so it passes 3:1 either way |
| B | Work band · event slot | gold "We Make Luxury Affordable" creative | uses `hero-luxury-campaign.png` (full creative) | `work-event-campaign.png` is the "Wholesale to the Public" creative, which image 2 does not show |
| B | Growth · repo plate | creative stretched to 554×572 | same box, `object-fit: cover` (≈9px trimmed each side) | customer creative is never stretched |
| B | Growth · H2 | condensed Garamond | Instrument Serif at `scaleX(0.72)` (0.82 on mobile) | no Google Fonts condensed Garamond exists |
| B | Work band · category tabs | tab-like labels | plain list (not interactive) | they filter nothing; fake tabs would mislead |
| B | Close · YOUR NEXT MOVE | label + arrow circle | link to the audit card (`#b-audit`), 44px tall | real interactive behaviour |
| B | Work band at >1536px | cream strip at the page's left edge | strip pinned to the viewport's left edge, 46 units wide | keeps the composition at 1920 |
| B | Focus states | not shown | 3px outline, blue on paper and white on navy | visible `:focus-visible` |
| B | Mobile ≤760px | not shown | single-column adaptation (see above) | responsive adaptation (already in DEVIATIONS) |

## Accessibility and technical checks (scratch probe at 1536/1280/1920/390/320)

- **Structure:** one `h1`. Heading order is h1 → h2 (signal, growth, work, proof, options, close) → h3 (signal words, steps, service names, FAQ title, audit card) → h4 (FAQ questions).
- **Overflow:** horizontal overflow is 0 at every width, including 320.
- **Targets:** interactive elements are ≥44px everywhere. The only probe hit is the global skip link at 183×43; it is not in my files.
- **Alt text:** every customer image has alt text that names the creative. The logo image uses `alt=""` because its link carries the label.
- **Motion:** `prefers-reduced-motion` disables the (hover-only) transitions.
- **Contrast:** all text passes AA, including the two work-band colours changed in the deviations above.

## Lint and typecheck

- `npx eslint src/components/review/variant-b src/app/variant-b` passed with exit 0 and no findings.
- `npx tsc --noEmit -p .` reports 60 errors, all in files I don't own: `fixtures/astro-reference`, `packages/managed-site-conversion`, `src/components/home/*` and `src/content/managed-site.ts`. There are **0 in variant-b files**.

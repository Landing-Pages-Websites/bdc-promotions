# Round 1 — fidelity:B

**Variant B review, round 1: CHANGES_REQUIRED**

At 1536px the desktop build matches the image closely: both pages are 5696px tall, and every section lines up with the image within about 5px. The verdict is CHANGES_REQUIRED because of one mobile defect. At 390px the signal section's arrow rule sits 227px too low and runs through the growth intro text "Choose the pieces your dealership needs or". The text looks crossed out, and the rule is missing from its own spot under the disclaimer. The desktop build would pass on its own.

**What I opened** (every file listed was viewed as an image)
- Target: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/refs/variant-b-ref.png` (1536×5696)
- Renders: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r1-b-1536/desktop-full.png`, `desktop-fold.png`, `laptop-full.png` (1280×4747), `mobile-full.png` (780×17004 at 2x), `auto-flags.txt`
- Section pairs: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/pairs/b/01-nav-hero.png` through `07-close-footer.png`, and `mobile-01.png` through `mobile-08.png`
- Contract and ledger: `DESIGN.md` (measurement basis, Variant B, B copy deck, shared behaviour), `workflow/homepage/DEVIATIONS.md`, `workflow/homepage/notes/B-build.md`
- To find the cause of the mobile defect: `src/components/review/variant-b/journal-signal.module.css`, `journal-growth.module.css`, `journal-mat.module.css`, plus searches over the variant-b folder

**Wording:** I checked every section against the image word for word and found no differences. Line breaks also match: hero H1 (3 lines), growth H2 (2), work H2 (2), proof H2 (2), options H2 (1), close H2 (5), and all step, FAQ and body wraps.

## 1. Section by section

Pixel values are my estimates from the native-resolution pairs (1 image px = 1 CSS px at 1536, about ±3px).

| Section | Target | Actual | Material difference | Fix | Severity |
|---|---|---|---|---|---|
| Nav | 79px navy bar. Outlined "Logo reserved" box at x35–211. Links and "DEALERSHIP GROWTH EDITORS" in place. | 80px bar. Real logo about 100px wide. Links in the same place. | Only the logo swap, which is logged. | None | none |
| Hero | H1 top y≈140. Plate 601×614 at x868, y111. Crop marks in place. CTAs at y768–833. "01" rule on the left. | H1 y≈142. Plate at x868, y112, 614 tall. CTAs start at y769. | Checklist line 3 "A clearer path to appointments." is 308px wide against 288px in the image (+7%); the image draws that line smaller. Body line 4 is 533px against 517px (+3%). The CTA row is behind the cookie banner at 1536, so I checked it in the fold and at 1280. | Optional: set checklist line 3 to about 93% size, or `font-stretch` about 93%. | low |
| Signal ledger | H2 y≈90–160. Columns start at x80/414/750/1127. Arrow rule at y453. | Same within 2px. Arrow rule at y453. | Descriptors run 5–6% wide ("Human + AI-supported follow-up" 308px against 293px; "Scheduled appointment focus" 284px against 267px). Numerals are lining; the image uses hybrid old-style figures (noted by the builder). | Optional: `font-stretch` about 86% on `.signalCols p`. | low |
| Growth lane | Timeline dots at y18 and y838. Five steps. H2 at x473–852. Repo mat at x872–1480, y62–722. | Dots at y19 and y835. Mat at y62–722. H2 at x473–850. | Step 03 "Launch and refine paid campaigns" ends at x469 against x452, leaving only 8px before the intro text at x477 (the image leaves about 24px). The H2 strokes are visibly thinner than the image's condensed serif. | Tighten `.stepCopy` for step 03 by about −0.01em, or cap its width at 215 units. | low–med |
| Work band | Cream strip x0–46. "01" at y32. Storyboard frame x86–546. Event plate x658–995, y168–588. Inventory plate x1040–1470, y166–398. Google plate x1040–1476, y476–708. Explore link y730. Band ends y865. | All within about 4px. Band ends y865. | Frame style: the image's storyboard frame mainly shows top and left lines; the build draws overshooting crop lines on every corner. The image's Google frame has a double line. The event plate is the correct "WE MAKE LUXURY AFFORDABLE" creative. | Optional: drop the overshoot on the storyboard frame's right and bottom edges. | low |
| Proof | H2 y185–310. Statement, link and 3 rules. Bottom rule y791. | H2 y184–309. Bottom rule y791. | None material. | None | none |
| Options ledger | Eyebrow x162–595, semibold and widely tracked. H2 y185–245. Rows start y278. Button y764–855. Elbow arrow down to y905. | Eyebrow x162–566. Rows start y277. Button y765–854. Arrow y906. | Eyebrow is 7% narrower and lighter than the image. Row numerals are about 10% wider. Row 02 descriptor ends at x1451, 4px from the row edge. | Eyebrow weight 600 and letter-spacing about +0.02em. | low |
| Close, FAQ and audit card | "06" at y64. FAQ header y162. Card y152–725. Q2 heading ends x1022, about 8px past the column rule at x1014. | "06" at y65. Card y151–725. Q2 heading ends x1053. | Q2 "What kinds of creative can BDC Promotions produce?" runs 39px past the FAQ rule and ends 11px from the card. "CLOSE & NEXT STEP" is 10% wider (128–290 against 128–275). | Reduce the width of `.faq h4` by about 4% (`font-stretch` 76–80%) so Q2 ends at x≤1022. | low–med |
| Footer | y757–865, three items. | y756–866. | None. | None | none |
| Mobile (390, adaptation only) | No reference. | Single column in the original section order. | **Correctness defect:** the signal arrow rule is at CSS y≈681 of the tile instead of about 454, striking through "Choose the pieces your dealership needs or", and it is missing under the disclaimer. The close section's "FIELD JOURNAL" and "BDC—06" labels are hidden (`journal-close.module.css:353`) and this is not logged. Orphan words: work H2 ends on "Feed", proof H2 ends on "Trust." | See fix 1 below. Log the hidden labels. Add `text-wrap: balance` to the mobile work and proof H2s. | **high** (overlap), low (the rest) |

**Cause of the mobile defect** (`journal-signal.module.css:206`): the mobile block sets `.arrowRule { position: relative; }` but keeps the desktop `top: calc(454 * var(--u))`. At 390px, `--u` is 0.5px, so the rule shifts 227px down into the growth section. I searched the variant-b styles and this is the only `position: relative` inside a mobile block.

## 2. Logged deviations

**Accepted:**
- **Logo swap:** "Logo reserved" is placeholder text in the mockup.
- **Real links on CTAs and nav:** real behaviour.
- **Work band teal `#3a8599`:** needed for AA contrast; the change is barely visible.
- **Explore the Work `#1f63ff`:** looks the same as the image in the pair.
- **Event slot uses `hero-luxury-campaign.png`:** it is the same creative the image shows, including "WE MAKE" and "MESSAGE OR COMMENT NOW!".
- **Repo plate cropped by about 9px per side instead of stretched:** the box is the same size and nothing is distorted.
- **Growth H2 in Instrument Serif at `scaleX(0.72)`:** width, cap height and wraps match. The only visible cost is thinner strokes.
- **Work category labels as a plain list:** they look the same.
- **"YOUR NEXT MOVE" as a link:** real behaviour.
- **Roboto:** it is the closest width match, and A/B fidelity takes precedence.
- **Proposed in B-build.md:**
  - Cream strip pinned at widths above 1536: accepted, but not verifiable because no 1920 capture was supplied.
  - Focus states: accepted, but none appear in the captures.
  - Both still need adding to `DEVIATIONS.md` (bookkeeping only).
- **Mobile adaptation:** accepted in principle, with two exceptions: the arrow rule defect, and the unlogged removal of the margin labels.

**Rejected:** none. No logged deviation silently changes composition, which images are used, or factual copy.

**Unlogged low-level drift** (listed under "remaining differences" in B-build.md but not in the ledger): lining numerals, frame style, and the text widths listed above. None of it breaks the composition.

## 3. What the screenshots could not show

- **Hero CTA row at 1536:** the cookie banner covers it in both the full page and the fold. I checked it from the top of the buttons in pair 01 (y match within 1px) and from the 1280 capture.
- **Mobile inventory and Google plates:** both frames are empty in the supplied mobile capture because the images load lazily. B-build.md says an eager-loading capture shows them, but that capture was not supplied, so these two mobile images are unverified.
- **No mobile reference:** mobile was judged only as an adaptation.
- **Not captured:** 320 and 1920 widths, and hover and focus states.
- **Scope:** the desktop comparison is valid at the same width and pixel density (1536 at 1x on both sides).
- **Outside scope, noted only:** the cookie banner's "Decline" label looks very low contrast.

## 4. Scores

| Area | Score |
|---|---|
| Geometry | 9/10 |
| Typography | 8/10 |
| Imagery | 9/10 (mobile work plates unverified) |
| Spacing and craft | 8/10 |
| Mobile readability | 6/10 (the text overlap; would be 8 once fixed) |

## 5. Fixes, highest impact first

1. **Mobile arrow rule (required).** In the mobile block of `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-b/journal-signal.module.css`, add `top: auto;` (or `top: 0`) to `.arrowRule`. Keep `position: relative` so the arrowhead still anchors. Measured shift: 227 CSS px at 390, which is 454 × 0.5px. Recapture mobile afterwards and confirm the rule sits about 24px under the disclaimer.
2. **Recapture mobile with the images loaded.** Load them eagerly or scroll through before capturing, and supply the capture so the mobile inventory and Google plates can be checked.
3. **FAQ Q2 heading.** Narrow it so it ends at x≤1022; it currently ends at x1053, about 31px too far (estimated).
4. **Growth step 03 copy.** Bring its right edge back to about x452; it currently ends at x469, 8px from the intro column (estimated).
5. **Mobile bookkeeping and wraps.** Add the hidden "FIELD JOURNAL" and "BDC—06" labels to `DEVIATIONS.md`, or show them. Add `text-wrap: balance` to the mobile work and proof H2s to remove the "Feed" and "Trust." orphans.
6. **Optional typography tuning** (all low severity):
   - Options eyebrow: weight 600 and wider tracking (404px now against 433px, estimated).
   - Signal descriptors: `font-stretch` about 86% (5–6% wide now).
   - Hero checklist line 3: about 93% size.
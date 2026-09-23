# Direction C · Proof Wall: round-2 fix report

**Inputs:**
- `reviews/r2/critic-C.md` (FAIL, narrow)
- `reviews/r2/rank-blind.md` (C was fold "I", ranked 1/13, "wins on content, not craft")

**Resume.** Most of this round's work landed in checkpoint `d99b5b5`, before a session cut-off. This session checked every item against the current code and new captures. It then changed three files (`git diff d99b5b5`: `Chrome.tsx`, `Close.tsx`, `fold.module.css`) and appended C-BRIEF §13.

**Scope.**
- The frozen reference set was not touched.
- Every customer ad in `public/images/design/variant-c/` still matches the sha256 recorded in C-BRIEF §7. Presentation changed only through layout, crop and fade.
- No claim was added.

## Checks
- `npx eslint src/components/review/variant-c`: clean, 0 problems.
- `npx tsc --noEmit -p .`: 0 errors.
- Every file is under 500 lines; the largest is `proof-wall.module.css` at 456.
- `capture.mjs` at 1440, 1536, 1280, 390 and 320 (plus 1024): `broken: []`, `overflowX: 0` and `pageErrors: []` at every size.

## Round-2 items

The evidence paths below are relative to `workflow/homepage/reviews/r2/fix-c/` unless stated otherwise.

| # | Item | Status | Evidence |
|---|---|---|---|
| 1a | AA: no text in the fold's fade at any width | **FIXED**.<br>• The mask is on the image-only side stack (`.stack`), never on a column holding captions.<br>• The only wall caption, "Luxury campaign", always sits whole above the fold edge.<br>• The probe counts 0 text nodes inside masked elements at 320, 390, 1280, 1440 and 1536.<br>• Caption y-positions: 674–690 of 800 (1280), 777–793 of 900 (1440), 824–840 of 864 (1536).<br>• Steel on concrete is 6.06:1. | `final-crop-1280-bottom.png`, `final-crop-1440-bottom.png`, `final-crop-1536-bottom.png` |
| 1b | Wall Meta tile cropped to its carousel strip | **FIXED by removal, not crop**. Meta is out of the wall at every width. At the 204px side column a carousel crop leaves trucks about 60px wide, which is still a fragment. The whole ad is in Work row 1. | `final-1440x900-fold.png` |
| 1c | Drop Meta from the ≤760 strip | **FIXED**. The strip is the luxury ad plus caption beside the sticker. | `final-390x844-fold-nobanner.png`, `final-320x700-fold-nobanner.png` |
| 2 | Fold impact: lead piece carries the frame | **FIXED**.<br>• Luxury lead measures 545×681 at 1440 (**28.7%** of the viewport; A's plate is ≈29%), 582×728 at 1536 (**32.0%**) and 462×578 at 1280 (26.1%).<br>• Image floor by `screenshot.mjs` geometry: **36% at 1440** (≥34) and **39% at 1536** (≥37).<br>• H1 clears the wall by 35px at 1280 (V202).<br>• Type ratio is **6.1** at 1440 and **6.3** at 1536. | `~/.claude/design-psyche/psyche/screens/bdc-c-fix-r2-3/styles.json`, `…/bdc-c-fix-r2-3-1536/styles.json`, `final-compare-sheet.png` (C beside A, Superside and Billion Dollar Boy) |
| 3 | Remove build vocabulary (V167) | **FIXED**.<br>• The "Customer-supplied automotive creative" label is deleted.<br>• All 7 alts describe the ad: printed headline plus what it shows. None names a dealer or restates an offer.<br>• The wall aria-label is "More automotive ad creative".<br>• Also fixed: C's FAQ answer "The supplied work covers…" now reads "The work covers…".<br>• The served page HTML contains no "supplied". | `src/components/review/variant-c/ads.ts`, `Fold.tsx:47`, `Close.tsx:17-21` |
| 4 | Close: statement H2, duplicate caps line, ruled FAQ | **FIXED**.<br>• The H2 is "Start with a free audit. No obligation.", from the verified /lp offer at `content-sources.json:68` and `LpHero.tsx:85`.<br>• The caps line is deleted.<br>• The FAQ is 1px `#3A3B40` ruled rows on graphite, with no card. | `final-1536x864-full.png` (y≈4,700–5,500), `r3-390-faq.png` |
| 5 | Ledger: Terms, the Luxury Video cell, compact mobile | **FIXED**.<br>• The column is "Terms", and the Luxury Video cell is "1 new video each month". This is a C-local transform; `content.ts` is untouched.<br>• At ≤760: name and price on one line, then "TERMS … · INCLUDES …" as one run under it (V176 labels kept). Four rows run ≈600px, down from ≈1,150. | `final-1536x864-full.png`, `r2-390-05.png`, `r2-390-06.png` |
| 6a | Work repeat earns its place with no TILA trigger terms | **FIXED**.<br>• Captions are the ad's printed headline plus a format fact ("4:5 portrait", "Meta carousel · three vehicle cards", "Sponsored search row · one card per vehicle"). No "$0 down", payments or vouchers appear as page text or in alts.<br>• Order: the pieces the fold doesn't show (storyboard \| Meta), then the VLA, then the event posters at 2–3× their fold size. The luxury lead is not repeated. | `r2-1536-01.png`, `r2-1536-02.png` |
| 6b | VLA capped at native 963px, caption beside it | **FIXED**. It is 963px at 1536 and 1440, and 856px at 1280, where it shrinks and never upscales. The caption sits in the freed right column. | `r2-1536-01.png`, `r2-1536-02.png`, `r3-1280-01.png` |
| 7a | Proof list wrapping 2+1 | **FIXED**: removed. | `final-1440x900-fold.png` |
| 7b | Eyebrow break after the slash at ≤480 | **FIXED**. It reads "AUTOMOTIVE MARKETING /" then "CREATIVE TO APPOINTMENT". | `final-390x844-fold-nobanner.png` |
| 7c | Curly apostrophe in "we’ll" | **FIXED** | `Close.tsx:24` |
| 7d | "or call" link placed deliberately | **FIXED**. It sits on its own line under the pill at every width. | `final-1280x800-fold.png`, `final-1440x900-fold.png`, `r2-1536-00.png` |
| 7e | Pull Close closer to Path | **FIXED**. Path's bottom padding is 48, giving a 144px gap. `sectionGaps` are 144/192/192/144. | `bdc-c-fix-r2-3/styles.json` |
| 7f | Justify mobile two-up rows by aspect | **FIXED**. `flex-basis: calc(var(--r) * 150px)` plus `flex-grow = aspect`, so the used-car and wholesale images share one height. | `r2-390-03.png` |
| 7g | Storyboard full width on mobile | **FIXED** | `r2-390-01.png`, `r2-390-02.png` |
| 7h | 320 bar: nowrap the phone; keep the bar off the fold CTA at 320×700 | **FIXED**.<br>• The number stays whole as "(352) 207-1074"; "Call" is hidden below 360px.<br>• At 320×700 the pill sits at 304–360 and the bar at 636–700.<br>• Also found and fixed this session: the bar's flex anchors collapsed the spaces, rendering "Call(352) 207-1074" and "Free audit→" at 390. Each label is now one inline span. | `final-320x700-fold-nobanner.png`, `r2-390x844-fold-nobanner.png` (before), `r3-crop-390-bar.png` (after) |
| 8 | Storyboard "MYNDSET MEDIA" mark | **LEFT UNALTERED**, as instructed. It is in the client's own references; the coordinator flags attribution. | `r2-1536-01.png` |

## New deviation rows

| variant | section | target | change | reason | evidence |
|---|---|---|---|---|---|
| C | fold wall | §12: lead half (3/5, max 560) with Meta under it, plus a side half holding the sticker and two staggered, labelled columns | The lead is sized to the frame (545×681 at 1440). One 204px side column holds the sticker over an unlabelled, image-only stack (used car, wholesale, repo) that runs off the fold. | Critic Top-3 #1: no text in the fade. Rank: lead was 16% of the frame, and the 156px tiles read as texture. | `final-1440x900-fold.png` |
| C | fold wall | Critic: crop Meta to its carousel strip | Meta is removed from the wall at every width; it is whole in Work. | A 204px crop leaves about 60px per truck, still a fragment | `final-1440x900-fold.png` |
| C | fold | Proof list (3 items) | Deleted | Restates the lead, the wall proves it, and it wrapped 2+1 | `final-1440x900-fold.png` |
| C | fold | 96px mask on whole columns | 64px mask on the image-only stack | AA: captions are never masked. The last tile's printed headline reads at 1440 and 1536. | `final-crop-1536-bottom.png` |
| C | fold, phones | Strip, then CTA | At ≤760 and ≤800px tall, the pill comes before the strip | The fixed bar sat on the pill at 320×700 | `final-320x700-fold-nobanner.png` |
| C | mobile bar | "Call (352) 207-1074" wrapping at 320 | `nowrap`; the number only below 360px; the label is one inline span | Critic Mobile (1); collapsed flex whitespace | `r3-crop-390-bar.png` |
| C | work | "Customer-supplied automotive creative" label; headline-only captions | Label deleted. Caption = printed headline plus a format fact, never offer or financing terms. | V167; TILA trigger terms need disclosures (regulated = disclosure) | `final-1536x864-full.png` |
| C | work | VLA at full container width (1.26–1.35× upscale) | Capped at its native 963px, with the caption beside it | Soft when upscaled (V203) | `r2-1536-02.png` |
| C | work | Event row first (repeated the fold's posters) | Opens on the pieces the fold lacks, then the VLA, then the posters at 2–3× fold size | "Seven pieces shown twice in the first 2,000px" | `final-1536x864-full.png` |
| C | close | Question H2 and a caps offer line | "Start with a free audit. No obligation."; caps line deleted | V85 template close; the verified /lp offer | `final-1536x864-full.png` |
| C | close | FAQ in a white card | 1px-ruled rows on graphite | SR2: cards are for objects | `r3-390-faq.png` |
| C | close | FAQ answer "The supplied work covers…" (`content.ts`) | "The work covers…" (C only) | V167 build vocabulary; no claim changed | `Close.tsx:17-21` |
| C | ledger | "Term" column; "Includes 1 new video each month" | "Terms"; "1 new video each month" | Critic Copy row | `final-1536x864-full.png` |
| C | ledger, phones | Transposed label/value rows (≈1,150px) | Name + price on one line, then terms · includes as one run | Critic Mobile (5) | `r2-390-05.png` |
| C | path → close | 192px gap | 144px (Path's bottom padding is 48) | Process and offer read as one move | `bdc-c-fix-r2-3/styles.json` |
| C | fold, 1280 | Type ratio ≥6 | Kept at 5.3 (63.68/12) | §3 measures ratio at 1440 and 1536 (6.1 and 6.3). A 72px H1 at 1280 would cut the lead from 26% to about 20% of the frame. | `final-1280x800-fold.png` |

## Measured (final)

| Metric | 1280×800 | 1440×900 | 1536×864 |
|---|---|---|---|
| Fold IMG area (`screenshot.mjs` / `screenshot1536.mjs`) | — | **36%** | **39%** |
| Lead piece share of the fold (probe) | 26.1% | **28.7%** | **32.0%** |
| Type ratio | 5.3 | **6.1** (72.64/12) | **6.3** (76/12) |
| Type sizes in the fold | 5 | 5: 72.64 · 24 · 20 · 17 · 12 | 5 |
| Type sizes site-wide | 7 | 7 of C's own: 72.64 · 52.56 · 34 · 24 · 20 · 17 · 12. The script counts 9 because it includes the consent banner's 14 and the root skip link's 16. | 7 |
| H1 → wall clearance | 35px | 37px | 38px |
| Text inside a mask | 0 | 0 | 0 |

## Iteration log
The labels are `~/.claude/design-psyche/psyche/screens/…`.

1. **`bdc-c-fix-r2-1`** (and `-1-1536`), captures `r2-*`. This was the state resumed from `d99b5b5`.
   - IMG 36/39 and ratio 6.1/6.3, and every earlier item verified.
   - Found: the 390 bar rendered "Call(352) 207-1074" and "Free audit→" (collapsed flex whitespace, `r2-390x844-fold-nobanner.png`).
   - Found: C's FAQ said "The supplied work covers…".
2. **`bdc-c-fix-r2-2`**, captures `r3-*`.
   - Fixed: each bar label is one inline span (`r3-crop-390-bar.png`), and the FAQ wording.
   - Checked 1280 full, 1024 tablet and 1920 folds (`r3-1280-0*.png`, `r2-1024-top.png`, `r3-1920x1080-fold-nobanner.png`).
   - Found: at 1536 the last stack tile sat entirely inside the 96px fade.
3. **`bdc-c-fix-r2-3`** (and `-3-1536`), captures `final-*`.
   - Fixed: the fade is now 64px, so "WHOLESALE TO THE" reads before it fades.
   - Metrics were unchanged, and the compare sheet against A and Set B was rebuilt.

## Final capture paths
Folder: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/fix-c/`

**Page captures:**
- `final-1440x900-fold.png`
- `final-1536x864-full.png`
- `final-1280x800-fold.png`
- `final-390x844-full.png`
- `final-320x700-full.png`

**Fold probes** (banner declined and the dev badge hidden, so the fixed bar is visible):
- `final-390x844-fold-nobanner.png`
- `final-320x700-fold-nobanner.png`

**Crops and comparisons:**
- `final-crop-1280-bottom.png`, `final-crop-1440-bottom.png`, `final-crop-1536-bottom.png`
- `final-compare-sheet.png`
- `final-screenshotmjs-1440-fold.png`

**screenshot.mjs output:** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c-fix-r2-3/` and `…/bdc-c-fix-r2-3-1536/`.

## Caveats
- The dev-only "1 Issue" badge covers the consent banner's buttons at phone widths, so the phone `capture.mjs` shots show the banner. The `*-nobanner.png` fold probes pre-set `site-consent=declined` and hide `nextjs-portal` to show the fixed bar. That probe is `scratchpad/c-r2-fold.mjs`.
- At 1280×800 the last stack tile shows a 51px strip, all of it inside the fade. That is the reproduced wall-runs-off-the-frame device, and the tile carries no text.
- The type ratio at 1280 is 5.3 (see the deviation row).

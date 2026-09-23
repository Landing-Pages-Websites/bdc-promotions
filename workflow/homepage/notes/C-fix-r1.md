# Direction C · Proof Wall: round-1 fix report

The r1 inputs were `reviews/r1/critic-C.md` (FAIL) and `reviews/r1/rank-blind.md` (C was fold "J", ranked 7/13).
Files changed:
- `src/components/review/variant-c/**`: all files.
- `public/images/design/variant-c/`: `showroom-night.webp` removed.
- `workflow/homepage/C-BRIEF.md`: §12 "Round-1 revisions" added.

The frozen reference set was not touched. Copy comes only from `content.ts`, the DESIGN.md A/B decks and `content-sources.json`, plus the ads' own printed text, checked at native resolution. No claim was added.

## Checks
- `npx eslint src/components/review/variant-c`: clean, 0 problems.
- `npx tsc --noEmit -p .`: 0 errors in variant-c.
- Every file is under 500 lines; the largest is `proof-wall.module.css` at 441.
- `capture.mjs` at every final size reported 0 broken images, 0 page errors and `overflowX` 0.

## Review items

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Fold wall is one photographic object: ads only, each labelled, with hierarchy and no strip under the header. The four prices are one window sticker. | **FIXED**. The lead half holds the luxury campaign at 413×516 at 1440, level with the H1, with the Meta ad under it. The side half holds the one sticker (graphite band "Services & pricing · Per month", four ruled name→price rows, then "No specific lead, appointment, show, or sales result is guaranteed.") over two staggered ad columns. Every tile carries its type label. The wall starts 16px below the header on one top edge, and tiles are cropped only by the bottom fade. | `reviews/r1/fix-c/final-1440x900-fold.png`, `screens/bdc-c-fix-r1-4/desktop-fold.png` |
| 2 | One primary action | **FIXED**. The header audit pill is removed and the header keeps its phone link. The fold has one pill plus the inline "or call (352) 207-1074" link. At ≤760 that link is hidden, because the header and the fixed bar already carry the phone (the link sat under the bar at 375). | `final-1440x900-fold.png`, `final-390x844-fold.png` |
| 3 | Type | **FIXED**.<br>• IBM Plex Mono is removed; styles.json lists Archivo only.<br>• Labels are Archivo 12/600 caps +.06em.<br>• H1 is 72.64px at 1440 (ratio 6.1) and 76px at 1536 (ratio 6.3).<br>• Buttons are sentence case.<br>• `.price` is `nowrap`.<br>• `text-wrap: pretty` is on the leads, and "AI-supported" is kept whole. | `screens/bdc-c-fix-r1-4/styles.json` |
| 4 | Delete filler | **FIXED**.<br>• The pillar strip is deleted, not reduced to a line.<br>• Standards (V165) is deleted, which also removes the duplicate "Proof you can inspect.".<br>• The AI showroom band is deleted.<br>• The FAQ items "Do we have to buy every service?" and "Are results guaranteed?" are removed, because both are in the ledger footer. | `final-1536x864-full.png` |
| 5 | Rhythm | **FIXED**.<br>• Grounds run fold concrete → Work concrete → Pricing graphite → Path concrete → Close graphite → footer.<br>• Concrete is `#EFEBE3`.<br>• Section padding is 96. sectionGaps are 144/192/192/192, and the 192s span a ground change. No 224. | `bdc-c-fix-r1-4/styles.json` |
| 6 | Work | **FIXED**.<br>• The category is printed once per group: "Event campaigns · Promotional ad creative" (4-up), "Video creative" \| "Inventory advertising", "New car lead gen".<br>• Each ad's caption is its own printed headline.<br>• The VLA runs at full width, and the row-3 text cell is deleted.<br>• Every ad is whole.<br>• Round 2 had a bug: a flex-grow below 1 left the storyboard at 2/3 width. It is fixed. | `final-1536x864-full.png`; headline crops `fix-c/sb-top.png`, `fix-c/inv-top.png` |
| 7 | Ledger CTA | **FIXED**. It is now "Get a free dealership marketing audit →" plus the inline call link. | `final-1536x864-full.png` |
| 8 | Mobile | **FIXED**, with one caveat: the strip is 302px, not ≈280, because the sticker sets its height.<br>• The 390 fold runs eyebrow → H1 → a two-column strip (lead ad plus sticker, with "/ month" beside each price) → CTA. The CTA is a single centred wrap and the arrow is inside the label. Lead and proof list follow.<br>• Below 375px the strip is 2fr/3fr.<br>• Work portraits are two-up.<br>• The fixed bar is kept at z-40, under the banner's z-50.<br>• The CTA's bottom sits above the bar's top: 717/780 at 390, 710/748 at 375, 703/716 at 360. | `final-390x844-fold.png`, `final-390x844-02.png`, `r3-320-375-folds.png` |
| 9 | Keep what reviewers praised | **KEPT**:<br>• prices above the fold<br>• uncropped contact sheet<br>• the ledger footer's non-guarantee<br>• 0 animation, 0 gradients, 0 shadows<br>• wide Archivo H1<br>• the path lane<br>• tel in the header at every width | — |
| Critic flags (5) | V165 · mono · adjective row · vertical padding · placeholder art | **FIXED** (see 3–5) | — |
| Critic table detail | Four smaller items:<br>• sticker `flex-grow` stretch<br>• "/ month" wrapping at 1280<br>• caption line 1 repeated ×4<br>• the close section's left/right height | **FIXED**. The stretch no longer exists. "/ month" is `nowrap`. The category now appears once per group. The FAQ is down to 3 items. | `final-1280x800-fold.png` |
| Rank "J" criticisms | Three items:<br>• price cards inside the portfolio<br>• tiles cut under the nav<br>• 4 actions in the fold | **FIXED**. The prices are one sticker. No tile is cut at the top. The fold has 1 pill and 1 link; the header has the phone only. | `fix-c/r3-compare-sheet.png` (C beside A, E, L and K) |
| Extra | Header anchor "FAQ" was a 35px-wide target | **FIXED**: `min-width: 44px` | probe `smallTargets: []` |

## Measured (final, round 4)

| Metric | 1440×900 | 1536×864 | 1280×800 |
|---|---|---|---|
| Fold IMG area (`screenshot.mjs` / `screenshot1536.mjs` geometry) | **34%** | **36%** (brief §3 floor 37) | 30.6% (probe) |
| Wall share of fold (probe) | 47.4% | 48.0% | 46.9% |
| Type ratio in fold | 6.1 (72.64/12) | 6.3 (76/12) | 5.3 |
| H1 ink → wall clearance | 45px | 46px | 43px |
| C's own text sizes | 7: 72.64 · 52.56 · 34 · 24 · 20 · 17 · 12 | 7 | 7 |

`screenshot.mjs` reports 9 sizes. The extra 14px and 16px are the consent banner and the root skip link, which are plumbing outside C.

## New deviations to log

| variant | section | target | change | reason | evidence |
|---|---|---|---|---|---|
| C | fold | C-BRIEF §8.1: 3 staggered columns with 4 price stickers | Lead half (3/5, max 560) plus side half (min 328) on one top edge. There is one sticker, and the VLA is out of the fold wall. | Rank: "14 objects of equal weight". The critic's Top-3 #1. A VLA screenshot is unreadable at wall size. | `final-1440x900-fold.png` |
| C | fold sticker | "/ month" on each sticker price, plus the term line | Desktop shows the unit once in the band ("Per month"); phones show "/ month" beside each price. Terms are in the ledger only. | Keeps each row to one line at 328px and frees wall area. The terms are shown in full 1 scroll below. | `final-1440x900-fold.png`, `final-390x844-fold.png` |
| C | fold, header | Call pill in the fold; audit pill in the header | The call becomes an inline text link, hidden at ≤760. The header audit pill is removed. | One primary action. At 375 the link sat under the fixed bar, which already has the call. | `final-390x844-fold.png` |
| C | tokens | IBM Plex Mono labels · concrete `#ECECE8` · steel `#5B5E64` · H1 `5.6vw−14 ≤72` · section 112 | Archivo 12/600 caps · `#EFEBE3` · `#5A5750` (6.06:1) · `5.6vw−8 ≤76` · 96 | Critic flags: mono, cool ground, ratio 5.6, 224px gaps | `bdc-c-fix-r1-4/styles.json` |
| C | colour | Red eyebrow squares, red lane numerals, red labels | Ink or steel. Red is used only for action: the pill, the call underline, the bar's audit cell and focus. | Critic: "keep red for the primary only"; red-square eyebrows were called template chrome | `final-1536x864-full.png` |
| C | sections | Pillar strip, §8.4 Standards, showroom band, Work row-3 cell, FAQ ×2 | Deleted | V165, filler, placeholder art, duplicates | `final-1536x864-full.png` |
| C | grounds | Pricing on concrete, Path on graphite | Pricing on graphite with a white-framed ledger, Path on concrete, Close on graphite | Ground alternation (critic's rhythm flag) | `final-1536x864-full.png` |
| C | work | Justified rows mixing categories; the same caption line 1 ×4 | Groups by category with the label once. Captions are each ad's own printed headline. The VLA is full width. | Critic's copy and layout rows | `final-1536x864-full.png` |
| C | work | VLA shown at its native 963px | Full container width: 1216px at 1440 (1.26× upscale) and 1296px at 1536 (1.35×). | The task and critic ask for it full width. It is slightly soft; verify at native resolution (V203). | `r3-1440-01.png` |
| C | captions | Wall tiles unlabelled | Ad-type labels: "Luxury campaign", "Event campaign", "Promotional ad", "Luxury video storyboard", "Meta inventory ad". These are UI labels derived from the DESIGN.md work labels and A's "luxury campaign" alt text, with no dealer names. | V169: each tile says what it is | `final-1440x900-fold.png` |
| C | crops | — | Fold tiles are cropped only by the wall's 96px bottom fade. The phone strip's ad column is clipped at the sticker's height with a 48px fade. No ad is altered or overlaid. | Customer-creative rule | `final-390x844-fold.png` |
| C | assets | `variant-c/showroom-night.webp` | Removed because it is unused. The byte-identical source stays at `public/lp/bdc-night-showroom.webp` (sha256 cd4503b4…5530). | The showroom band was deleted | — |

## Not fixed and caveats
- **Fold image area at 1536 is 36%, against the brief §3 floor of 37%.** At 1440 it is 34%, which meets that floor. The one sticker costs about 7% of the fold. I chose a clear lead piece over squeezing the floor.
- **The phone strip is 302px**, not ≈280. The sticker's four rows plus the three-line non-guarantee set it. The CTA still clears the fixed bar from 360 to 414.
- **The "1 Issue" dev badge appears in every capture.** It is a root-layout `<head>` hydration mismatch from the analytics script, and it also shows on `/variant-a`. It is not in C's files and is dev-only.
- **Phone captures show the consent banner.** At phone widths Next's dev portal sits over its "Got it" and "Decline" buttons (`elementFromPoint` → `NEXTJS-PORTAL`, also on A), so `capture.mjs` cannot click them.
- **`capture.mjs` hung once at 390 (fixed).** It waits on every `<img>`, and the lazy wall images hidden on phones never settled. All wall images are now `loading="eager"`, which is correct anyway because they are above the fold.
- **The "or call" link wraps under the pill at 1280 and 1440.** It fits on the same line at 1536+ and in the tablet band.

## Iteration log
The labels below are `design-psyche/psyche/screens/…`; the captures are in `workflow/homepage/reviews/r1/fix-c/`.

1. **`bdc-c-fix-r1-1`** (`r1-1440-fold.png`): new wall and sticker.
   - Found: IMG 26%, "or call(…)" with no space (an inline-flex whitespace bug), and wrapped sticker names.
2. **`bdc-c-fix-r1-2`** (`r2-*`): copy width sized off the H1, a 3/5 lead half, "Per month" in the band, the VLA out of the fold.
   - Result: IMG 34%.
   - Found: the 390 hang (lazy images) and the Work storyboard sizing bug.
3. **`bdc-c-fix-r1-3`** (`r3-*`, `r3-compare-sheet.png`): red reserved for action, one wall top edge, the 44px FAQ target, `text-wrap: pretty`.
   - Checked the tablet band, 320, 375, WebKit 1440 and Firefox 1280.
4. **`bdc-c-fix-r1-4`** and **`bdc-c-fix-r1-4-1536`** (`final-*`): the phone call link is hidden (it overlapped the bar), and the <375 strip goes 2fr/3fr instead of stacking.

## Final capture paths
Captures (in `workflow/homepage/reviews/r1/fix-c/`):
- `final-1440x900-fold.png`
- `final-1536x864-full.png`
- `final-1280x800-full.png` and its crop `final-1280x800-fold.png`
- `final-390x844-full.png` and its crops `final-390x844-fold.png`, `final-390x844-02.png`
- `final-320x700-full.png`

Design-psyche:
- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c-fix-r1-4/` (`desktop-fold.png` is the blind-rank candidate)
- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c-fix-r1-4-1536/`

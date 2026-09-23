# Variant B · round-1 fixes (2026-09-23)

Sources: `reviews/r1/fidelity-B.md`, `reviews/r1/critic-B.md`. Contract: DESIGN.md "Variant B" + "B copy deck" (no wording changed).
Evidence folder: `workflow/homepage/reviews/r1/fix-b/` (paths below are relative to it). Every capture is from `capture.mjs`
(consent dismissed, lazy images decoded); every final capture reports `broken: []`, `overflowX: 0`, `pageErrors: []`.

## Review items

| # | Item (source) | Status | Evidence |
|---|---|---|---|
| 1 | Mobile `.arrowRule` strikes through the growth intro (fidelity fix 1, critic defect 1) | **FIXED**. Added `inset: auto` in the mobile block of `journal-signal.module.css` (it keeps `position: relative` so the arrowhead anchors). DOM probe: the rule sits 24px under the disclaimer and 44px above the growth section at both 390 and 320 (16→374 / 16→304, inside the gutter). | `ev-390-signal-arrow.png`, `final-390.png`, `final-320.png` |
| 2a | Hero call button: "1074" 4–6px from the border (critic 2) | **FIXED**. Text `var(--fs-lead)` (20.6u) at 86% stretch, icon 35u, padding 12.5u, gap 9u. Ink: text 717→883 against the image's 717→883, icon 676→703 against 676→703. Text-box to border: 20.1px at 1536, 18.8 at 1440, 16.6 at 1280. | `ev-ref-vs-final-cta.png`, `ev-1280-hero-cta.png`, `final-1440-fold.png` |
| 2b | Growth step 03 against the intro column (fidelity 4, critic 2) | **FIXED**. Step copy tracking −0.042em (one setting for all steps), −0.05em on step 03 (image 2 sets 03 tighter). Step 03 line 1 ink ends at 456 (image 451, was 469). Text gap to "Choose…": 20.8px at 1536, 19.5 at 1440, 17.3 at 1280 (was 6–7 at 1280). | `ev-ref-vs-final-step03.png`, `ev-1280-growth.png` |
| 2c | FAQ Q2 past its column rule (fidelity 3, critic 2) | **FIXED**. Per item: Q2 `font-stretch: 75%`, `letter-spacing: −0.01em`. Ink ends at 1023, the image at 1021; the image also runs Q2 ~7px past the rule. Gap to the audit card: 39px at 1536, 33 at 1280 (image 42). The other questions moved to 86% stretch (image widths +2–6%). | `ev-ref-vs-final-faq.png`, `ev-1280-close.png` |
| 2d | Re-check at 1280, 1400 and 1440 (critic 2) | **DONE**. Gutter probe at 1024/1280/1400/1440/1536 (DOM text rects): call 13.1→20.1px, step03→intro 13.8→20.8px, Q2→card 26.4→39.4px, signal col 3→col 4 rule 22→34px. Every gutter scales with the composition, none collapses. | `final-1280.png`, `final-1440-fold.png` |
| 3 | Work band body 11.2px at 1280 (critic 3) | **FIXED**. `font-size: max(13.3u, min(13px, 15.6u))`, so it is 13px from 1280 to 1535 and scales below 1280, where the composition has no room. From 761 to 1535px the line-height is 1.3 and `top = 221u − 10.8u − 3.311em`, so the three lines clear the storyboard plate. At 1280: 13px/16.9px, 6px above the plate, 6.4px under the title. 1536 is unchanged (13.3/15.6). | `ev-1280-work-body.png` |
| 3b | Other small reading text ("check similarly") | **FIXED where it reads as text.** Nav links and the signal disclaimer have a 13px floor (from 1280 up, and on mobile). The close kicker floor is 12px. The mobile proof kicker and disclaimer are 13px. Still below 13 at 1280: the work captions (12px floor, 4-word labels), the proof kicker (12.7px, uppercase label) and the aria-hidden margin labels (9.5px). | probe output in the report run |
| 4 | Firefox: hero H1 about 17px low, no `text-box` (critic, verify) | **FIXED**. `dealer-field-journal.module.css` defines tokens `--trim-{sans,garamond,cormorant,caslon,condensed}` = `1lh/2 + (ascent−descent)/2·em − 1cap`, with per-face constants measured from font metrics in Firefox, plus `--trim-sans-end`. Each module has `@supports not (text-box: trim-both cap alphabetic)` inside `@media (min-width: 761px)`: absolute boxes `translate` by −trim, box-anchored rules are counter-translated, the in-flow FAQ uses margins, the process-link underline uses padding, and the price amount gets `line-height: 0`. Result: all 206 text lines in Firefox and WebKit sit within 2px of Chromium (ink-row diff). The only flags are two FAQ question windows where the next answer line comes into range; the answers themselves are within 2px. | `ev-engines-hero-chr-ff-wk.png`, `ev-engines-close-chr-ff-wk.png`, `final-1536-firefox.png`, `final-1536-webkit.png` |
| 5a | Mobile orphans "Feed", "Trust.", "More" (fidelity 5, critic) | **FIXED**. `text-wrap: balance` on the mobile work, proof and close H2s. They now read "Automotive / Creative Built / for the Real Feed", "Promises You / Can Trust.", "Ready to / Create More / Opportunities for / Your Dealership?". | `final-390.png` |
| 5b | Doubled rules between option rows on mobile (critic) | **FIXED**. Each row draws only `border-bottom`; the first row adds `border-top`. The ledger gap is 0 and rows have 18px padding, so each rule sits centred between rows. | `final-390.png` |
| 5c | Nav links 11px on mobile (critic) | **FIXED**. 13px, with targets of 44px or more. | `ev-390-fold.png` |
| 5d | Collapse the nav so the plate reaches the 390 fold (critic) | **FIXED**. One 64px row: the logo plus a horizontally scrollable row of section links (the clipped "RES…" signals the scroll; the focus ring is inset so the scroller does not clip it). The tagline and its rule are hidden at 760px and below (logged below). The hero plate now starts at about 700px, inside the 844px fold (it was 845px). | `ev-390-fold.png` |
| 5e | "FIELD JOURNAL" / "BDC—06" hidden on mobile (fidelity, unlogged) | **FIXED (shown)**. Rotated 10px labels on the spine's outer side (left 11px): FIELD JOURNAL beside the H2, BDC—06 near the audit card. | `final-390.png` |
| 6 | "Explore the Work →" jumps to pricing (critic) | **FIXED**. `JournalWorkMore.tsx` (client) renders `<button type="button" aria-expanded aria-controls="b-work-more">` with the same label and position. It opens an in-band panel, collapsed by default, so the 1536 composition is unchanged. The panel shows two supplied creatives whole (`width:100%; height:auto`, no crop) with labels: `work-event-campaign.png` "Wholesale to the Public" and `work-used-car-event.png` "Massive Used Car Sales Event". The second is a byte-identical copy of `variant-a/hero-used-car-event.png`, sha1 60aede31…2311. Each is captioned "customer-supplied source plate". The arrow turns down when the panel is open. The images mount only when opened, so a collapsed panel requests nothing. The `.wrap` is `display: flow-root` with `min-height: 874u`, so the navy band and cream strip grow with the panel. Checked by keyboard: Enter toggles `aria-expanded` to true, the band grows 874→1450px at 1536 (1917→2947 at 390), both images load and there is no overflow. | `explore-open-1536.png`, `explore-open-390.png` |
| 6b | Category labels look like tabs but do nothing (critic) | **FIXED**. Each is an `<a href>` to its plate, whose `id` was added: New Car Lead Gen → `#b-work-google` (new 2025 Silverado listing ads), Event Campaigns → `#b-work-event`, Video Creative → `#b-work-video` (storyboard), Inventory Advertising → `#b-work-inventory`. The text stays at the image position and 9px padding gives a target of 44px or more (45px at 1280). Hover whitens the bar. `scroll-margin-top: 24px`. Checked: clicking "Video Creative" sets the hash, and the storyboard lands 24px from the top. | `explore-open-1536.png` (focus ring visible) |
| 7 | 52 near-duplicate font sizes (critic) | **FIXED**. Tokens `--fs-caption/label/small/copy/meta/note/lead/body/text/strong/num/display` merge values within 0.6px or less. There are now 30 distinct computed sizes at 1536 (display sizes that are one per role were kept). Each run's width was then re-matched to the image with stretch or tracking. 1536 geometry holds: every one of the 206 text lines is within 1px vertically of the pre-fix build. | probe output; `workflow/homepage/comparisons/b-fix-r1/` |
| 8 | Optional tuning (fidelity 6) | **DONE**. Options eyebrow: weight 600, tracking 0.118em, ink 163→593 against 162→593 in the image. Signal descriptors: stretch 88%, columns 1–2 within 1% and columns 3–4 +3–4% (the image draws those narrower still). Hero checklist line 3: stretch 86%, ink 145→435 against 144→431. Also re-matched to the image: primary CTA (87%), close kicker tracking 0.14em (now 128→272, same as the image), the disclaimer, the statement, the options "includes" text (row 2 now ends 13px from the rule end, was 4), "/ month" (88%) and the card CTAs. | per-line width table (report run) |
| 9 | 320: growth H2 clips (critic) | **FIXED**. The mobile size is `min(58px, (100cqw − 32px) / 7.3)`: the line is 8.54em unscaled and drawn at 0.82. At 320 it fits the 288px column. | `final-320.png` |
| — | Mobile plates blank in the round-1 capture (fidelity 2, critic verify) | **VERIFIED**. With `capture.mjs`, all images decode at 390 and 320 (`broken: []`). This was a capture artefact. | `final-390.png` |
| — | Hero lede line 4 +3% (fidelity table) | **NOT FIXED** by design. Lines 1–3 are already 0.4–1.3% narrower than the image. Shrinking the lede would make them worse, and line 4 has no neighbour. | — |
| — | Frame style: storyboard top/left lines, Google double line (fidelity table, optional) | **NOT FIXED**. The work band keeps one crop-line treatment. Low priority and optional. | — |
| — | Hybrid old-style numerals (signal, ledger) | **NOT FIXED**. No Google face matches them. Unchanged and already noted in B-build.md. | — |
| — | Ledger row numerals about 10% wide | **NOT FIXED**. They are Libre Caslon Display lining digits, and tightening them would pinch the pair. Low priority. | — |
| — | DEVIATIONS.md bookkeeping: cream strip above 1536, focus states, growth H2 verdict (fidelity §2, critic) | **NOT FIXED**. DEVIATIONS.md is not a file I own. The rows are listed below for the ledger owner. The critic's V200 endorsement resolves "pending reviewer verdict" for the growth H2 `scaleX(0.72)`. | — |
| — | Cookie banner "Decline" contrast; dev overlay "1 Issue" | **NOT FIXED**. Out of scope. The overlay is a hydration mismatch in the root layout's review-bridge `<head>` script, which is not in B's files. | console probe |

## New deviations to log (variant | section | target | change | reason | evidence)

| Variant | Section | Target (image) | Change | Reason | Evidence |
|---|---|---|---|---|---|
| B | Nav (≤760px) | not shown | One 64px row: logo plus scrollable section links (13px). "Dealership Growth Editors" and its rule are hidden. | Hero plate reaches the 390 fold; 13px links | `ev-390-fold.png` |
| B | Close margin labels (≤760px) | rotated margin labels | Shown at 10px on the spine's outer side | Keep the journal labels instead of hiding them | `final-390.png` |
| B | Work · Explore the Work | static label with arrow | Disclosure button; in-band panel, collapsed by default, with two whole supplied creatives (no crop, no distortion) and labels | Real affordance; 1536 composition unchanged when collapsed | `explore-open-1536.png`, `explore-open-390.png` |
| B | Work · asset | — | `public/images/design/variant-b/work-used-car-event.png` = copy of `variant-a/hero-used-car-event.png` (sha1 60aede31a608c892ea8bfb2ff71ce8206dea2311) | Explore panel creative; no original was overwritten | — |
| B | Work · category labels | tab-like labels | Real in-page links to their plates (supersedes the "plain list" row) | Real behaviour behind the look | — |
| B | Work · body (761–1535px) | 13.4px / 15.6 | 13px floor from 1280 up, 1.3 leading, block lifted to clear the storyboard | Legibility floor | `ev-1280-work-body.png` |
| B | Growth · step copy | per-step widths vary in the image | One tracking value (−0.042em), −0.05em on step 03. Steps 1–2 run 2–7% narrower than the image, steps 3–5 within 3%. | Consistent role; step 03 clears the intro | `ev-ref-vs-final-step03.png` |
| B | Close · FAQ Q2 | condensed in the image | Q2 only: stretch 75%, −0.01em (other questions 86%) | Image match; stays off the audit card | `ev-ref-vs-final-faq.png` |
| B | Hero · checklist line 3 | narrower in the image | Stretch 86% on line 3 (desktop only) | Image match | — |
| B | Type scale | 52 sizes | 30 sizes at 1536 via `--fs-*` tokens (merges ≤0.6px), widths re-matched | Consistency; 1536 geometry unchanged (≤1px) | `comparisons/b-fix-r1/` |
| B | Firefox (no `text-box`) | — | `@supports not (text-box: …)` trim emulation per module | Cross-engine parity (≤2px against Chromium) | `ev-engines-*.png` |
| B | Legibility floors | — | Nav links and disclaimer 13px, close kicker 12px (from 1280 up and on mobile) | Legibility at 1280 and 390 | — |
| B | Work band above 1536 (from B-build, still unlogged) | strip at the page edge | Strip pinned to the viewport's left edge | Composition at 1920 | notes/B-build.md |
| B | Focus states (from B-build, still unlogged) | not shown | 3px ring, blue on paper and white on navy (also on the new button and links) | Visible `:focus-visible` | `explore-open-1536.png` |

## Files changed (all owned)

- `src/components/review/variant-b/`:
  - `dealer-field-journal.module.css`: type tokens and trim tokens.
  - `journal-{nav,hero,signal,growth,work,proof,options,close,footer,mat}.module.css`.
  - New: `journal-work-more.module.css` and `journal-card.module.css`, split out to keep each file under 500 lines. Largest file is now 442 lines.
  - `JournalWork.tsx`: links, ids, `JournalWorkMore`.
  - New: `JournalWorkMore.tsx`.
  - `JournalClose.tsx`: card module.
- `public/images/design/variant-b/work-used-car-event.png` (new copy).
- `src/app/variant-b/page.tsx` unchanged.

## Checks

- `npx eslint src/components/review/variant-b src/app/variant-b`: exit 0, no findings.
- `npx tsc --noEmit -p .`: 0 errors.
- Targets: every `a` and `button` is at least 44×44 at 1536, 1280, 390 and 320. Horizontal overflow is 0 at every width.
- `compare-pngs` against the reference at 1536: 9.63% differing pixels. It was 9.82% before the fix. Diagnostic only.

## Final captures

- `workflow/homepage/reviews/r1/fix-b/final-1536-chromium.png` (1536×864, dpr 1, full, height 5696 = image)
- `workflow/homepage/reviews/r1/fix-b/final-1536-firefox.png`, `final-1536-webkit.png`
- `workflow/homepage/reviews/r1/fix-b/final-1440-fold.png` (1440×900)
- `workflow/homepage/reviews/r1/fix-b/final-1280.png` (1280×800, full)
- `workflow/homepage/reviews/r1/fix-b/final-390.png` (390×844, dpr 2, full)
- `workflow/homepage/reviews/r1/fix-b/final-320.png` (320×700, dpr 2, full)
- `workflow/homepage/reviews/r1/fix-b/explore-open-1536.png`, `explore-open-390.png` (panel open)
- `workflow/homepage/comparisons/b-fix-r1/` (compare-pngs against `refs/variant-b-ref.png`)

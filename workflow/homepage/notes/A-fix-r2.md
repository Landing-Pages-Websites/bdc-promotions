# A — fix round 2

Scope: `src/components/review/variant-a/**`, `public/images/design/variant-a/growth-source-work.png` (derived),
`workflow/homepage/scripts/compose-source-work.py`. This round resumed from checkpoint `d99b5b5`, which already held most edits.
Every item was re-checked against the current code and fresh captures. One new edit was made (work.module.css, below).
Evidence folder: `workflow/homepage/reviews/r2/fix-a/`. All captures come from the dev server at :3417.

## Round-2 items

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Mobile storyboard slice | FIXED. The `.story .media` aspect ratio is now `426 / 592`, the derived file's real size (checked with PIL). The probe measures the media at 348×483.6 at 390, a ratio of 0.7196. The "DIRECTED READ…" line is whole at 390 and at 320 | `m390-story-bottom.png`, `m320-story-bottom.png`, `probe-390.json` |
| 2 | Mobile fold | FIXED. At ≤1179 the grid areas run eyebrow/title/body/audit/call/art/proof. At 390×844 the luxury plate's top is at y713, so the whole "WE MAKE LUXURY AFFORDABLE" lockup is inside the fold. At 320×700 the call CTA ends at y≈644 | `final-390x844-dpr2-fold.png`, `final-320x700-dpr2-fold.png`, `m390-hero-art-proof.png` |
| 3 | CTA arrow collisions at 320 | FIXED. `flex-shrink:0` on every CTA svg, plus `gap:12px`. The ≤359px step sets `.process` tracking to 0.08em and `.mix` to 24px/0.08em. Measured gaps between text and arrow at 320: process 14.4px, mix 36.4px, explore 42.3px | `m320-process-btn.png`, `m320-mix-btn.png`, `m320-explore-btn.png`, `probe-320.json` |
| 4 | Non-breaking hyphens | FIXED. U+2011 is used in follow‑up (hero, signal, option 01, close), AI‑supported (hero, signal, FAQ 3) and vehicle‑listing (FAQ 2). The glyphs and wording are unchanged. None of these words break at 320 or 390 | `m320-faq.png`, `m390-faq.png`, `m320-options-top.png` |
| 5 | Source caption floor and voucher pill | FIXED. The caption uses `max(14px, var(--fs-14))`. The composite was regenerated: I re-ran the script to a scratch file and diffed it against the shipped PNG, and they are identical. The pill is now two lines, "MESSAGE OR / COMMENT NOW!", built from two real crops of the supplied pill at 1.95× the round-1 scale (see the deviation row) | `pair-source-card.png` (image 1 left, build right), `w1280-source-card.png`, `m320-source-card.png` |
| 6 | Explore labels, options gutter, footer icons | FIXED. Each figcaption sits after its image, so all three labels share one baseline in the open panel. The options band sits on the 20px gutter (H2, cards and button at x 20–300 at 320 and 20–370 at 390). Footer icons sit in a fixed 26px box, and the phone and email text both start at x=60 | `explore-open-1536.png`, `explore-open-390.png`, `m320-options-top.png`, `m320-footer.png`, `m390-footer.png` |
| 7a | Meta creative ×1.07 | FIXED. The carousel spans about 1072–1480 at 1536, against about 1070–1481 in image 1. **New this session:** at 1280 the navy media box covered the "META INVENTORY AD" label, because the label is 26.5px tall at its 12px type floor while the media started at 28u = 23.3px. The media top is now `max(calc(28 * var(--u)), 27px)`, which leaves 1536 unchanged | `pair-inventory.png`, `w1280-inventory.png` |
| 7b | Proof H2 rule | FIXED. Pixel scan of the blue rule at 1536: image 1 runs x 113/114–792 and the build runs 113–792 (y 3472–3473 in both) | `pair-proof-h2.png`, measured with a PIL row scan |
| 7c | Wordmark and signal width nudges | NOT DONE. They are optional: fidelity-A rates them Low and they are about 7px and 15px. I left them alone rather than re-solve the locked per-line widths for sub-1% gains | — |
| 8 | Open "Explore the work" captures | FIXED. They use `capture-click.mjs --click "Explore the work"`, a copy of capture.mjs. After the click, `aria-expanded` is `true`, no images are broken and overflowX is 0 at both widths | `explore-open-1536-full.png`, `explore-open-390-dpr2-full.png` and their crops |

Other checks:
- `pageErrors` is empty in every capture. There are no broken images, and overflowX is 0 at 1536, 1440, 1280, 390 and 320.
- The dev-only "1 Issue" badge comes from shared code, not A. It is a hydration mismatch on the root layout's `<head dangerouslySetInnerHTML>` (the review-bridge script), plus a CORS failure loading `app.gomega.ai/review-bridge/v7/review-bridge.js` from localhost. This is for the coordinator.

## New deviation rows

| variant | section | target | change | reason | evidence |
|---|---|---|---|---|---|
| A | Proof photo | L-shaped headlamp, about 275×145 inside the 631×552 frame | Kept the generated B&W image, whose lamp is a thin horizontal strip at about 40% down, similar width | The image is generated (ledger row 6). It was not regenerated in round 2 because box, scale and position already match | `reviews/r1/fix-a/pair-05-proof-photo.png` |
| A | Growth / source card | Image 1's two-line "MESSAGE OR / COMMENT NOW!" pill, about 14px text lines at 1536 | The supplied one-line pill is split into two real crops, each keeping its own gold ground and pill edge, stacked, and scaled uniformly to 1.95× the round-1 size. The review suggested about 1.6×; 1.95× reaches image 1's line height. The gold panel outline is drawn (presentation only) | Real pixels only: crops, uniform scaling and a feathered alpha edge. No glyph is painted | `pair-source-card.png`, `workflow/homepage/scripts/compose-source-work.py` |
| A | Work / Meta inventory | Carousel spans about 1070–1482 | Creative at 1.07×, media box 1056–1495 (overflow clipped). Media top floored at 27px below 1480px wide | Fidelity to image 1. The floor keeps the 12px label visible | `pair-inventory.png`, `w1280-inventory.png` |
| A | Mobile hero (≤1179) | No reference | Proof box moved after the art. Order: copy, CTAs, art, proof | Puts creative in the 390 fold and the call CTA in the 320×700 fold | `final-390x844-dpr2-fold.png`, `final-320x700-dpr2-fold.png` |
| A | Mobile CTAs (≤359) | No reference | `.process` tracking 0.16→0.08em; `.mix` 28→24px and 0.113→0.08em | The arrow needs clear space at 320 | `m320-process-btn.png`, `m320-mix-btn.png` |
| A | Copy compounds | Same text | U+2011 non-breaking hyphen in follow‑up, AI‑supported and vehicle‑listing | Stops bad hyphen breaks. The glyph looks the same | `m320-faq.png`, `m390-faq.png` |
| A | Source caption | 14px in image 1 | `max(14px, 14u)` | Reading floor at 1180–1535 | `w1280-source-card.png` |

## Checks run
- `npx eslint src/components/review/variant-a src/app/variant-a`: clean.
- `npx tsc --noEmit -p .`: no errors in variant-a.
- The largest variant-a files are options.module.css and work.module.css, at 476 lines each (under 500).
- `compare-pngs.mjs refs/variant-a-ref.png reviews/r2/fix-a/final-1536x864-full.png comparisons/a-fix-r2`: 1536×5696 on both sides, no height mismatch, 14.95% differing pixels (r1: 15.09%). This number is diagnostic only.

## Final captures (`workflow/homepage/reviews/r2/fix-a/`)
- `final-1536x864-full.png` (5696 tall, matching the reference)
- `final-1440x900-fold.png`
- `final-1280x800-full.png`
- `final-390x844-dpr2-full.png` and `final-390x844-dpr2-fold.png`
- `final-320x700-dpr2-full.png` and `final-320x700-dpr2-fold.png`
- `explore-open-1536-full.png` and `explore-open-390-dpr2-full.png`
- Comparison output: `workflow/homepage/comparisons/a-fix-r2/` (`side-by-side.png`, `diff.png`, `overlay.png`, `comparison.json`)

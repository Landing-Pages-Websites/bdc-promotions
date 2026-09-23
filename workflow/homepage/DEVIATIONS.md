# Deviations ledger — A/B vs. supplied images

| Variant | Section | Target (image) | Change | Reason | Evidence |
|---|---|---|---|---|---|
| A | Growth · source card | Landscape luxury plate with the voucher restacked into a right panel; button text wraps "MESSAGE OR / COMMENT NOW!" | Plate is a composite of the customer's real luxury-campaign pixels (scene left, voucher elements restacked right); the button keeps its original one-line lettering | No such landscape file exists; redrawing the ad as HTML would fabricate customer creative. Real pixels, rearranged only | `workflow/homepage/scripts/compose-source-work.py`, `public/images/design/variant-a/growth-source-work.png` |
| A | Proof · photo | B&W close-up of a dark car headlight in a showroom | AI-generated photograph (design-psyche `generate-image.sh`), mirrored/cropped/desaturated to match subject, direction and crop | No supplied photo of this subject; image prescribes one. Illustrative only, no brand/person/text, not presented as proof | `workflow/homepage/generated/proof-headlight-raw.png`, `public/images/design/variant-a/proof-headlight.jpg` |
| B | Nav · logo slot | Outlined box reading "Logo reserved" | Real BDC Promotions logo in the same slot | "Logo reserved" is mockup placeholder text, not copy | `public/images/design/shared/bdc-logo-2026.png` |
| A/B | All CTAs | Static buttons | Audit → `/lp#get-started`, call → `tel:+13522071074`, nav items → on-page anchors | Real interactive behaviour | DESIGN.md "Shared behaviour" |
| A/B | Mobile (390px) | Not shown in images | Single-column adaptation preserving section order, imagery and copy | Responsive adaptation | mobile screenshots per round |
| A | Proof · positioning label | `#1669de` (3.87:1 on navy) | `#2b76e1` (4.51:1) | AA contrast for small text | notes/A-build.md |
| A | Options · "INCLUDES" labels | `#0563fc` (3.91:1) | `#1e73fc` (4.58:1) | AA contrast for small text | notes/A-build.md |
| A | Hero · luxury + repo plates | mockup re-rendered the ads (luxury squashed ~6% vertically, repo art shifted ~20px) | real supplied pixels, cropped only; plate boxes and −8.5° tilt match within 2px | never distort customer creative | notes/A-build.md |
| A | Work · Meta inventory + Google VLA plates | mockup re-rendered versions | supplied files (Google trimmed by 1.03 scale inside its box) | real creative, crop only | notes/A-build.md |
| A | Buttons below 1536 | scaled with the comp | call/process buttons ≥44px tall | target size | notes/A-build.md |
| A | 1180–1920 layout | fixed 1536 comp | fluid scaling; single column ≤1179px | responsive | notes/A-build.md |
| A | Proof H2 face | very narrow condensed display | Saira at narrowest width, horizontally scaled to 76% | no Google face matches the width — **accepted** by critic-A and fidelity-A (V200) | notes/A-build.md |
| B | Work band label + captions | teal `#266878` (3.15:1 on navy) | `#3a8599` (4.72:1) | AA for small text | notes/B-build.md |
| B | "Explore the Work" link | blue at 3.3:1 on navy | `#1f63ff` (4.05:1, large text) | legibility on navy | notes/B-build.md |
| B | Work band event slot | gold "We Make Luxury Affordable" creative | `hero-luxury-campaign.png` | `work-event-campaign.png` is the "Wholesale to the Public" creative, not the one in image 2 | notes/B-build.md |
| B | Growth repo plate | creative stretched to 554×572 in image | same box, cropped (≈9px per side) not stretched | never distort customer creative | notes/B-build.md |
| B | Growth H2 face | condensed serif | Instrument Serif horizontally scaled to 72% (82% mobile) | no Google face narrow enough — **accepted** by critic-B and fidelity-B (V200) | notes/B-build.md |
| B | "YOUR NEXT MOVE" | label + arrow | link to the audit card | real behaviour | notes/B-build.md |
| B | Sans face | neutral grotesk | Roboto (width axis) — design-psyche flags Roboto; dismissed because B is locked to image 2 and Inter measured 6–7% too wide | reference fidelity | notes/B-build.md |
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

Round-1 fix evidence: `workflow/homepage/reviews/r1/fix-a/`, `workflow/homepage/reviews/r1/fix-b/`; reports `workflow/homepage/notes/{A,B}-fix-r1.md`.
| A | Proof photo | L-shaped headlamp, about 275×145 inside the 631×552 frame | Kept the generated B&W image, whose lamp is a thin horizontal strip at about 40% down, similar width | The image is generated (ledger row 6). It was not regenerated in round 2 because box, scale and position already match | `reviews/r1/fix-a/pair-05-proof-photo.png` |
| A | Growth / source card | Image 1's two-line "MESSAGE OR / COMMENT NOW!" pill, about 14px text lines at 1536 | The supplied one-line pill is split into two real crops, each keeping its own gold ground and pill edge, stacked, and scaled uniformly to 1.95× the round-1 size. The review suggested about 1.6×; 1.95× reaches image 1's line height. The gold panel outline is drawn (presentation only) | Real pixels only: crops, uniform scaling and a feathered alpha edge. No glyph is painted | `pair-source-card.png`, `workflow/homepage/scripts/compose-source-work.py` |
| A | Work / Meta inventory | Carousel spans about 1070–1482 | Creative at 1.07×, media box 1056–1495 (overflow clipped). Media top floored at 27px below 1480px wide | Fidelity to image 1. The floor keeps the 12px label visible | `pair-inventory.png`, `w1280-inventory.png` |
| A | Mobile hero (≤1179) | No reference | Proof box moved after the art. Order: copy, CTAs, art, proof | Puts creative in the 390 fold and the call CTA in the 320×700 fold | `final-390x844-dpr2-fold.png`, `final-320x700-dpr2-fold.png` |
| A | Mobile CTAs (≤359) | No reference | `.process` tracking 0.16→0.08em; `.mix` 28→24px and 0.113→0.08em | The arrow needs clear space at 320 | `m320-process-btn.png`, `m320-mix-btn.png` |
| A | Copy compounds | Same text | U+2011 non-breaking hyphen in follow‑up, AI‑supported and vehicle‑listing | Stops bad hyphen breaks. The glyph looks the same | `m320-faq.png`, `m390-faq.png` |
| A | Source caption | 14px in image 1 | `max(14px, 14u)` | Reading floor at 1180–1535 | `w1280-source-card.png` |
| B | Copy · compound hyphens | ASCII "-" in follow-up, AI-supported, new-car, Automotive-specific | U+2011 in the visible B strings. Words are otherwise identical to the copy deck. | Stop "follow- / up" style breaks on phones | `final-320.png`, `final-390.png` |
| B | Hero · fold at 16:10 | Fixed 785-unit band (image is 1536×864) | Hero min-height = fold − nav when the fold would show <180 units of the next section; content pinned top | The signal H2 was cut by the fold at 1440×900 and 1280×800. 1536×864 is unchanged. | `final-1440x900-fold.png`, `final-1280x800-fold.png` |
| B | Work band below 1536 | Storyboard top at 221 units | The storyboard drops by the 13px floor's excess, `3.267 × (body size − 13.3u)`: 0 at ≥1536, +6.3px at 1280. Body leading is fixed at the image's 1.173 ratio. The earlier "centred body" rule is removed. | Holds the image's H2→body→frame gaps once the legibility floor applies | `ev-1280-work-gaps-before-after.png` |
| B | Mobile nav (≤760) | Not shown | Right-edge 28px mask fade and scroll padding. A client `onFocus` handler scrolls the focused link fully into view. | The cut-off link now reads as scrollable. Chromium does not reveal a partly visible focused link on its own. | `ev-390-nav-*-focused.png`, `ev-320-nav-resources-focused.png` |
| B | Close H2 "?" | Round-bowled "?" | That one glyph is set in Instrument Serif (`--b-condensed`) instead of Libre Caslon Display | Glyph form match | `ev-ref-vs-final-q.png` |
| B | Work · "Explore the Work" | 24.5 units (about 20px at 1280, 15px at 960) | 19px floor at weight 700 | #1f63ff on the band is 4.05:1, which is AA only as large text | `ev-800-work-band.png` |
| B | Close · audit card H3 (≤760) | Two fixed lines | Inline spans with `text-wrap: balance` | Removes the one-word line at 320 | `final-320.png` |
| B | Footer (≤760) | Not shown | Padding `32px 16px` (was `24px 16px 96px`) | Removes about 100px of empty navy | `final-390.png` |
| B | Unlogged low drift (fidelity r2) | — | Lining numerals, 3–7% width overruns on a few runs, "YOUR NEXT MOVE" 3px wide | Below the tolerance for changing the composition. Recorded for completeness. | `comparisons/b-fix-r2/` |

Round-2 fix evidence: `workflow/homepage/reviews/r2/fix-a/`, `workflow/homepage/reviews/r2/fix-b/`; reports `workflow/homepage/notes/{A,B}-fix-r2.md`.
| B | Layout 761–1179px (post round 3) | desktop comp scaled down (text 7.8–9px, targets 32–43px at 768–1024) | single-column layout now applies below 1180px (was ≤760), matching A; 1536 and 390 renders pixel-identical before/after | legibility + ≥44px targets on tablets and zoomed laptops (round-3 fidelity-B) | `reviews/r3/shots/b-820-full-postfix.png`, `b-1024-full-postfix.png` |
| B | Proof kicker + work category links (1180–1279px) | 11.7px label; 43px links | 12px floor; 44px min-height | legibility, target size | tablet probe (STATE.md) |
| B | Close margin labels "FIELD JOURNAL" / "BDC—06" | tiny rotated labels | kept at reference scale (9–10px), `aria-hidden` decorative ornaments | reference fidelity; not reading text | `reviews/r3/fidelity-B.md` |

## Shared plumbing touched by the coordinator
| Scope | File | Before | Change | Reason | Evidence |
|---|---|---|---|---|---|
| All routes | `src/components/consent/ConsentBanner.tsx` | "Decline" inherited the site's light body text (`#f7f9fc`) on the banner's white ground: 1.05:1; both buttons ~37px tall | `text-neutral-900 dark:text-white` on Decline; `min-h-11` (44px) on both buttons. Consent behaviour untouched | CORRECTNESS (AA + target size) flagged by round-2 critic-B and fidelity-A. The README lists this folder as plumbing; the same defect exists on `main` (live site) and in the site-starter template — upstream fix recommended | `workflow/homepage/reviews/r2/critic-B.md` |
| All routes | `src/app/styles/responsive.css` | skip link ~38px tall | `display:inline-flex; align-items:center; min-height:44px` | ≥44px target (round-3 critic-B) | skip-link focus check: 44px on /, A, B, C |
| All review routes | `src/components/review/content.ts` `auditHref` | `/lp#lead-form` — no such id on /lp, fragment silently ignored (pre-existing) | `/lp#get-started` (the /lp audit form section); smoke test asserts the id exists | CTA lands on the form it promises | `workflow/homepage/scripts/smoke.mjs` |

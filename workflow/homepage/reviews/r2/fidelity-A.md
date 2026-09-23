# Round 2 — fidelity:A

**Verdict: CHANGES_REQUIRED.** Variant A's desktop now matches image 1 at PASS level: every section is in place and all scores are at least 8/10. Two defects remain. One is a sliced text line in the storyboard plate on mobile, which belongs to A. The other is a cookie-banner button with invisible text; it comes from shared site code, not A. Both are small fixes. If the coordinator rules the banner out of A's scope, fixing the storyboard slice is enough for PASS.

## 1. Artifacts opened
- **Reference:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/refs/variant-a-ref.png` (1536×5696)
- **Round-2 captures:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/shots/`
  - `a-1536-full.png` (1536×5696, same height as the reference)
  - `a-1440-fold.png`, `a-1440-full.png`, `a-1280-full.png`
  - `a-390-full.png` (780×18572 at DPR 2), `a-320-full.png`
- **Section pairs:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/pairs/a/01-hero` through `07-close-footer`, and `mobile-01` through `mobile-08`
- **"Explore the work" open state (round-1 dev capture):** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/fix-a/explore-open-1536.png`
- **Fixer's round-1 crops:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/fix-a/pair-04-work-inventory-google.png` and `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/fix-a/pair-05-proof-photo.png`
- **design-psyche capture:** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r2-a/` (`auto-flags.txt`, `styles.json`, `desktop-fold.png`, `mobile-fold.png`)
- **Derived image:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/public/images/design/variant-a/work-luxury-storyboard-crop.png`
- **Contract and round-1 documents:** `DESIGN.md`, `DEVIATIONS.md`, `r1/fidelity-A.md`, `r1/critic-A.md`, `notes/A-fix-r1.md`
- **Source, read only to find causes:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/review/variant-a/work.module.css` and `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/src/components/consent/ConsentBanner.tsx`

**Copy:** I checked all seven sections and the mobile tiles word for word against the A copy deck. Everything matches, including every line break the deck specifies, prices, FAQ answers and the footer.

**Section starts:** they match the reference in every pair (864, 1376, 2240, 3103, 3967, 4832, footer about 5591).

## 2. Per-section table
All pixel values are estimated by eye from the native 1536 pairs (about ±4px), unless marked "computed".

| Section | Target | Actual | Material difference | Concrete fix | Severity |
|---|---|---|---|---|---|
| Hero | Wordmark box, H1 in 4 lines, repo plate tilted under the luxury plate, CTAs at y667 and y750, route to the arrow at y825 | All boxes, the tilt, route, CTAs and line breaks match within about 2px. The wordmark text is about 7px wider (40–281 against 40–274) | None material. The plates show real pixels (logged, row 12) | Optional: narrow the wordmark by about 2.5% | Low |
| Signal | H2 spans 246–1338; thin slashes; 5 nodes; drop route | 237–1345, about 15px wider in total. Slashes are thin and sit on the baseline. The rail, labels and route match | Slight width only | Optional: tighten H2 tracking about −0.005em | Low |
| Growth | H2 in 2 lines; staircase route; tiles 01–05; source card 1099–1536 × 488–802 | Card, route, tiles and copy match within 2px. "OPTIMIZATION" is about 10px wider and "CREATIVE" about 8px narrower. The voucher button in the source card is a thin one-line strip, where the reference has a two-line pill | The voucher panel is logged (row 5). Title widths are minor | None required | Low |
| Work | Four plates, labels, connectors; the Meta phone and carousel span about 1070–1482; the Google results page shown whole | Plate boxes, labels, connectors and the button match. The top sliver is gone and the phone sits on navy. The Meta creative is about 7% smaller (carousel 1085–1467). The Google plate is zoomed about 1.3× and cut at the "New" row (logged, row 26). MYNDSET logo is missing (logged, row 24) | The Meta scale difference is not in the ledger | Scale the Meta image about 1.07× so the carousel spans about 1070–1482 | Low |
| Proof | Outlined panel; H2 line widths about 662/682; black-and-white photo 835–1466 × 127–679 with an L-shaped headlamp | H2 widths match within about 2px. The photo box matches. The lamp is now about 40% down and a similar width, but it is a thin horizontal light strip, not an L. The rule under the H2 ends at 779 instead of 793 | Lamp shape. It is noted in `A-fix-r1.md` but not in the ledger | Either add "lamp design differs (strip, not L)" to ledger row 37, or regenerate with an angular L-shaped lamp. Extend the H2 rule by about 14px | Low |
| Options | Blue band; wide first card; smaller raised "$"; H2 about 905/905 wide | Everything matches within about 3px, including the "$" treatment and the connectors | None | — | — |
| Close + footer | H2 in 3 lines with open tracking; CTAs; FAQ panel 792–1536; footer | Line widths are within about 3px and tracking is open. The FAQ panel and footer match. The call button's text is slightly tighter and taller | None material | Optional: add about +0.02em tracking to the call label | Low |
| Mobile hero (390) | No reference | Slab padding is now about 29px, the front plate sits inside the edge and all four frame edges show. The luxury plate starts at about CSS y842, so the 844-tall fold shows no creative | Adaptation choice, not drift | Optional: move the proof box below the art so the plate's top edge enters the fold | Low |
| Mobile work (≤1179px) | No reference | The storyboard's last line, "DIRECTED READ: SLOW, CONTROLLED, PREMIUM…", is sliced at the bottom of the plate (`mobile-04`). The media box ratio is 386/532 (0.7256). The derived file reads as about 426×591 (0.721), and the image is cropped from the top, so about 3px of the bottom is cut at 390 (computed) | A sliced text line: the same defect round 1 rated Medium at the top of this plate | `work.module.css:405`: set the mobile `.story .media` aspect ratio to the file's own ratio (`426 / 591`), so nothing is cropped | **Medium** |
| Mobile other | No reference | Orphans are fixed. The close H2 keeps the image's three lines. The FAQ panel has four borders. All images load. There is no overflow. The options H2 and cards use a 16–18px side gutter against 20px elsewhere | Minor gutter inconsistency | Optional: use a 20px gutter | Low |
| Shared: cookie banner | — | The "Decline" button text is white on white and practically invisible (visible in `bdc-r2-a/desktop-fold.png` and `mobile-fold.png`). `ConsentBanner.tsx:51` sets no text colour | Contrast fails AA on every first visit. This is outside A's code | Add `text-neutral-900 dark:text-white` to the Decline button's classes | **Correctness (shared)** |

Nothing is missing, nothing is extra, and there are no unreviewed sections below the footer: both pages end at 5696.

## 3. Deviations and coverage
**Round-1 findings, checked against the pixels:**
- **Resolved:**
  - Close H2 tracking and line widths.
  - Smaller raised "$".
  - Options and proof H2 line widths.
  - Signal slashes.
  - Tile numeral weight.
  - The storyboard sliver at the top of the plate (desktop).
  - The Meta plate's blue backdrop.
  - The red arrows on the Google plate (removed by cropping).
  - Proof photo scale and position.
  - "Explore the work" now opens a panel instead of jumping to pricing.
  - Mobile hero dead space and plate inset.
  - Orphaned words and trailing slashes.
  - Close H2 on mobile.
  - FAQ panel borders.
  - Mobile images now load.
  - Legibility floors: `styles.json` at 1440 shows the smallest paragraph at 16.4px and labels at 12px or more.
- **Not fully resolved:** the headlamp shape. The fixer's note says so honestly.
- **New:** the mobile storyboard slice at the bottom of the plate.

**Deviations accepted:**
- Rows 5, 6, 10–16 and 24–42. Each is real creative cropped only, an accessibility or legibility correction, a functional behaviour, or a per-line fidelity scaling following the V200 precedent. In each case I confirmed that the 1536 composition is unchanged.
- Row 26 (Google plate crop) is accepted with a note: it changes the plate's scale and hides the location rows and disclosure footer. The reason given (markup arrows run across ad content) is valid.
- design-psyche flags (24 sizes, 0px section gaps, 3 shadow recipes): dismissed. A is locked to image 1, and two of the three shadows are the inset hairline and the cookie banner.

**Deviations rejected:** none. Two items are unlogged: the Meta creative's roughly 7% smaller scale, and the headlamp shape.

**Coverage limits:**
- The open state of "Explore the work" is only shown in a round-1 dev-server capture, which includes the dev "1 Issue" badge. There is no round-2 production capture of it.
- The 320 capture was only viewable scaled down, and there are no 320 tiles.
- There is no 1180 capture from round 2.
- I didn't re-verify the hover states in round 2.
- There is no mobile reference.
- All pixel measurements are eyeballed estimates, not a bounding-box script.

## 4. Scores
| Area | Score |
|---|---|
| Geometry | 9/10 |
| Typography | 9/10 |
| Imagery | 8/10 (headlamp shape, Google zoom, Meta scale) |
| Spacing/craft | 8/10 (mobile storyboard slice) |
| Mobile readability | 8/10 |

## 5. Highest-impact remaining fixes
1. **Mobile storyboard slice:** at `work.module.css:405`, change `aspect-ratio: 386 / 532` to the derived file's ratio (about `426 / 591`; confirm the file's real size). The roughly 3px cut is computed from the CSS and the file size as it read.
2. **Shared cookie banner:** give the Decline button a text colour at `ConsentBanner.tsx:51`, for example `text-neutral-900`. This affects every direction.
3. **Meta inventory creative:** scale it up about 1.07× so the carousel spans about 1070–1482, as in the reference (estimated).
4. **Proof photo:** log the lamp-shape difference in ledger row 37, or regenerate with an angular L-shaped lamp about 275×145px inside the 631×552 frame (estimated).
5. **Optional polish (estimated):**
   - Extend the proof H2 rule to about 793px.
   - Tighten the signal H2 by about 15px in total.
   - Narrow the wordmark by about 7px.
   - Use a 20px gutter for the options section on mobile.
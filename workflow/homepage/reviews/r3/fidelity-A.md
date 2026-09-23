# Round 3 (final) — fidelity:A

**Verdict: PASS.** Two small craft items and two coverage gaps remain. None of them is a correctness defect or unlogged drift that changes the composition.

## 1. Artifacts opened
- **Reference:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/refs/variant-a-ref.png` (1536×5696)
- **Round-3 production captures** in `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r3/shots/`:
  - `a-1536-full.png` is 1536×5696, the same height as the reference.
  - Also opened: `a-1440-fold.png`, `a-1440-full.png` (1440×5340), `a-1280-full.png` (1280×4747), `a-390-fold.png` and `a-320-full.png` (640×18536; it could only be viewed about 69px wide, so it can't be read).
- **Section pairs:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r3/pairs/a/01-hero.png` through `07-close-footer.png`, and `mobile-01.png` through `mobile-08.png`. Together the mobile tiles cover the whole 390 page.
- **Open-state evidence (dev-server captures):**
  - `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/fix-a/explore-open-1536-full.png`
  - `.../r2/fix-a/explore-open-1536.png`
- **Other round-2 crops:** `.../r2/fix-a/pair-source-card.png`, `m390-source-card.png`, `m320-process-btn.png`, `m320-mix-btn.png`, `final-320x700-dpr2-fold.png`
- **Derived image:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/public/images/design/variant-a/growth-source-work.png`
- **design-psyche capture:** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r3-a/` (`auto-flags.txt`, `styles.json`, `desktop-fold.png`, `mobile-fold.png`)
- **Documents:** `DESIGN.md` (Measurement basis, Variant A, A copy deck, Shared behaviour), `DEVIATIONS.md`, `reviews/r2/fidelity-A.md`, `reviews/r2/critic-A.md`, `notes/A-fix-r2.md`

**Copy:** I checked every section and mobile tile word for word against the A copy deck. Everything matches, including the H1, the close H2, the options H2 line breaks, prices, commitments, FAQ answers and the footer. Nothing is missing, nothing is extra, and there are no sections below the footer (both pages end at 5696).

## 2. Per-section table
Pixel values are estimated by eye from the native 1536 pairs, about ±3px.

| Section | Target | Actual | Material difference | Fix | Severity |
|---|---|---|---|---|---|
| Hero | Wordmark 40–274. H1 in 4 lines. Luxury plate 907–1507 × 60–771. Tilted repo plate. CTAs; route arrow at y825 | Plate boxes, slab, tilt, route, CTAs and proof box are within about 2px. Wordmark is 40–281 | None. The plates are real supplied pixels (row 12) | Optional: narrow the wordmark by about 2.5% | Low |
| Signal | H2 246–1338; thin slashes; 5 nodes; route drops | H2 237–1345 (about 15px wider); rail, labels and route match | None | Optional: about −0.005em tracking | Low |
| Growth | 2-line H2; staircase; tiles 01–05; source card 1099–1536 × 488–802 | Card box, route, tiles and step copy match. "OPTIMIZATION" is about 10px wider, "CREATIVE" about 8px narrower | The source-card pill is two stacked crops of different widths (stepped outline, glyphs within about 3px of the strip edges). The reference has one padded, rounded pill. Logged (rows 5, 60) but crude, most visibly at 390 | Make both strips the same width, padding the narrower "MESSAGE OR" strip with the pill's own edge pixels (presentation only), and give both about 4% side padding | Low |
| Work | Four plates, labels, connectors; carousel about 1070–1482; full Google results page; MYNDSET logo | Plate boxes match: event 621–1033 × 152–675, Google 1069–1490 × 495–715, storyboard bottom 847. Carousel is about 1072–1480. Body line 2 is about 14px wider | Google plate zoomed and card 5 cut (row 26); MYNDSET logo cropped (row 24). Both logged | None required | Low |
| Proof | H2 lines about 659 and 682 wide; rule 113–793; B&W headlight photo 835–1466 × 127–679 with an L-shaped lamp | H2 widths within 2px; rule 113–792; photo box matches. The lamp is a thin horizontal strip across the middle, about 345×80 against about 295×150 | Lamp shape and lot lights instead of showroom panes. The photo is generated and logged (rows 6, 37, 59) | None required | Low |
| Options | Blue band; wide first card; raised "$"; connectors; FIND THE RIGHT MIX button | Within about 3px everywhere | None | — | — |
| Close + footer | 3-line H2; CTAs; FAQ panel 792–1536; footer | Line widths within about 3px. The call label is slightly tighter and taller | None | Optional: about +0.02em tracking on the call label | Low |
| Mobile 390 (no reference) | — | Luxury plate top is at about CSS y713, so the lockup is in the fold. Storyboard's last "DIRECTED READ…" line is whole. 20px gutters. FAQ panel has four borders. Footer icons are aligned. No orphans or hyphen breaks | Source pill is crude at this size (see Growth) | As in Growth | Low |
| Mobile 320 (no reference) | — | The round-3 production capture can't be read at the available scale. The round-2 dev crops show clear arrow gaps and the call CTA in the 320×700 fold | Not verified on the production build | Produce 320 tiles | Coverage |

## 3. Deviations and coverage
**Round-2 findings, checked against the pixels:**
- **Resolved:**
  - Mobile storyboard slice (`mobile-04`).
  - Cookie banner "Decline" is now dark text in a bordered 44px button (`bdc-r3-a` fold captures).
  - Meta inventory scale.
  - Proof H2 rule length.
  - Creative now appears in the 390 fold, and the call CTA is in the 320×700 fold.
  - Options mobile gutter is 20px.
  - Footer icon alignment.
  - Explore-panel labels share one baseline.
  - Source caption is 14px.
  - Non-breaking hyphens work: no bad breaks seen at 390.
- **Not done, optional:** the wordmark (+7px) and signal (+15px) width nudges. They are not in the ledger but are below 1% and immaterial.

**Accepted:**
- Rows 5, 6, 10–16 and 24–42, plus the round-2 rows 59–65 and the consent-banner plumbing row.
- In each case it is real creative cropped only, an accessibility or legibility floor, real behaviour, a responsive adaptation, or per-line scaling under the V200 precedent. The 1536 composition is unchanged.
- Rows 6/59 (generated headlight photo) are accepted because no client photo was supplied and the subject class, box, scale and position match.
- Row 60 (two-line pill) is accepted with the craft note above.
- design-psyche flags (23 sizes, 0px section gaps, 3 shadows) are dismissed: A is locked to image 1, and the third shadow is the cookie banner.

**Rejected:** none.

**Coverage limits:**
- The open state of "Explore the work" has only a round-2 dev capture (with the "1 Issue" dev badge). There is no production capture of it.
- The 320 page is only confirmed through the round-2 dev crops.
- There is no mobile reference.
- All measurements are estimated by eye, not taken with a bounding-box script.

## 4. Scores
| Area | Score |
|---|---|
| Geometry | 9/10 |
| Typography | 9/10 |
| Imagery | 8/10 (generated lamp shape, zoomed Google plate, stitched pill) |
| Spacing/craft | 8/10 |
| Mobile readability | 9/10 |

## 5. Remaining fixes (all optional for PASS)
1. **Source-card pill** (`growth-source-work.png`, made by `workflow/homepage/scripts/compose-source-work.py`): make both line strips the same width, about the width of the "COMMENT NOW!" strip (about 385 source px, estimated), using the pill's own edge pixels, and add about 4% side padding.
2. **Coverage:** add production captures of the open disclosure at 1536 and 390, and 320 section tiles.
3. **Width nudges (estimated):** narrow the wordmark by about 7px and the signal H2 by about 15px, and tighten work body line 2 by about 14px. Or log them as immaterial drift, as B's row 74 does.
4. **Call label** in the close section: about +0.02em tracking (estimated).
# Round 2 — fidelity:B

**PASS** (variant B scope). No material drift from the reference at 1536, and no correctness defects introduced by B. Every score is 8/10 or higher. There are two caveats. First, a shared-chrome contrast defect is out of B's scope but visible on the route. Second, the 320 capture and the cross-engine captures could only be checked for structure, not at text level.

## 1. What I opened

- **Reference:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/refs/variant-b-ref.png` (1536×5696).
- **Round-2 captures** in `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/shots/`:
  - `b-1536-full.png` (5696 tall, same as the reference)
  - `b-1440-fold.png`
  - `b-1440-full.png`
  - `b-1280-full.png`
  - `b-390-full.png`
  - `b-320-full.png`
- **Section pairs** in `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r2/pairs/b/`: `01-nav-hero`, `02-signal`, `03-growth`, `04-work`, `05-proof`, `06-options`, `07-close-footer`, and `mobile-01` to `mobile-08`.
- **design-psyche capture** in `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-r2-b/`: `auto-flags.txt`, `desktop-fold.png`.
- **Fixer evidence** in `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/reviews/r1/fix-b/`:
  - `final-1536-firefox.png`, `final-1536-webkit.png`
  - `explore-open-1536.png`, `explore-open-390.png`
  - `ev-1280-work-body.png`, `ev-1280-growth.png`, `ev-1280-close.png`, `ev-1280-hero-cta.png`
  - `ev-390-fold.png`
- **Supplied logo:** `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/public/images/design/shared/bdc-logo-2026.png`. The gap in "Promot/ons" is the brand's speedometer needle, not a rendering fault.
- **Contract and history:**
  - `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/DESIGN.md`: Measurement basis, Variant B, B copy deck, Shared behaviour.
  - In `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions/workflow/homepage/`: `DEVIATIONS.md`, `reviews/r1/fidelity-B.md`, `reviews/r1/critic-B.md`, `notes/B-fix-r1.md`.

**Wording:** I checked every section word for word against the B copy deck and found no differences. Desktop line breaks match the reference:

| Heading | Lines |
|---|---|
| Hero H1 | 3 |
| Lede | 4 |
| Growth H2 | 2 |
| Work H2 | 2 |
| Proof H2 | 2 |
| Options H2 | 1 |
| Close H2 | 5 |

Step, FAQ and card text also wrap as in the reference.

## 2. Section by section at 1536

"Estimated" means read from the native pairs, about ±3px.

| Section | Target | Actual | Material difference | Fix | Severity |
|---|---|---|---|---|---|
| Nav | 79px navy bar; "Logo reserved" box; 5 links; tagline | 80px; real logo; links within 2px | Logo swap only (logged) | none | none |
| Hero | H1 top y≈140; plate x868–1469, y111–725; CTAs y768–833; call text ends x883, border at x907 | H1 y≈142; plate within 1px; CTAs y769; call text ends x887 (about 20px inside the border) | Lede line 4 is x604 against x588 (+3%, not fixed by design); checklist line 3 is x436 against x433 | none | low |
| Signal ledger | H2 x80–1050; columns start at x80/414/750/1127; arrow at y453 | H2 x80–1040; columns within 2px; arrow at y453 | Descriptors in columns 3–4 are 3–4% wide; numerals are lining where the reference uses old-style | optional | low |
| Growth lane | Dots y18 and y838; step 03 ends at x451; intro starts at x477; H2 x473–852; repo plate x898–1450, y103–675 | Dots y20 and y835; step 03 ends at x456 (gap 21px, round-1 fix confirmed); H2 x473–850; plate within 2px | H2 strokes thinner (scaleX, logged and accepted). Handwritten notes are slightly lighter. Repo crop shows less of the yellow and blue base band at the bottom (customer file, crop only). | none | low |
| Work band | Frame x86–546 (top and left lines); event plate x658–995, y168–588; inventory plate x1040–1470, y166–398; Google plate x1040–1476, y476–708; Explore link y730 | All plates within about 5px; Explore y730; band height matches | Storyboard frame is drawn as a full rectangle with overshooting corners at x76–554 (10px outside the reference on each side). The reference's double line on the Google frame is single. Not in the ledger. | Optional: pull the frame back to x86–546 and drop the right and bottom overshoot | low |
| Proof | H2 y185–310; three rule columns; bottom rule y791 | Within 2px | Column 3 text ends x1420 against x1407 | none | none |
| Options ledger | Eyebrow x162–595; rows start y278; button x982–1435, y764–855; elbow arrow to y905 | Eyebrow x162–595; rows y278; button within 2px | Row numerals about 10% wide (x83–131 against x81–126). Row 03 "$750 / month" is 6px wide. | optional | low |
| Close, FAQ, card | "06" y64; Q2 ends x1022; card x1064–1469, y152–725; YOUR NEXT MOVE circle right edge x1501 | "06" y64; Q2 ends x1025; card within 1px; circle right edge x1510 | "YOUR NEXT MOVE" group is 8–9px wider than the reference. Body line 3 runs to x532 against x506 (+5%). FAQ answers are 2–4% wide. | Optional: tighten the next-move label tracking so the circle ends at x≤1501 | low |
| Footer | y757–865, three items | y755–866 | none | none | none |
| Page | 5696px | 5696px | none | — | — |

**Other widths and states (adaptation, no reference):**

| Area | What I saw | Fix | Severity |
|---|---|---|---|
| 1280 work band | The body now uses the 13px floor. Line 3 ("Meta inventory ads, and Google…") sits about 1–4px (estimated) above the storyboard frame's top crop line, and the left overshoot tick ends beside the "M" of "Meta". It reads as an underline or box around the text. The fixer's "6px above the plate" is measured to the image, not to the crop lines. | Below 1536, cap the frame overshoot at 0 above the top edge, or lift `.body` by about 5px. Check again at 1280 and 1440. | low–med |
| 1280 other gutters | Call "1074" to border 16px; step 03 to intro 17px; Q2 to card 33px | none (round-1 fix confirmed) | — |
| 390 mobile | Arrow rule now sits under the disclaimer with no strike-through. No orphans. Single rules between option rows. Inventory and Google plates load. Plate top is about 690 CSS px, inside the 844 fold. Margin labels shown. Nav is 13px. | none | — |
| 390 nav | Link row is clipped at "RES…" (horizontal scroll, logged) | none required | low |
| Explore disclosure, open | Two whole creatives, labelled and uncropped. At 1536 the left column under the storyboard is an empty navy area of about 460×630px. | Optional: let the panel span x86–1476 | low (the reference does not show an open state) |

## 3. Deviations

**Accepted:**
- All B rows 7, 8, 9 and 17–23.
- Rows 43–56:
  - Mobile nav collapse and hidden tagline: justified by the fold.
  - Margin labels shown on mobile.
  - Explore disclosure: collapsed, the 1536 composition does not change.
  - Category labels as links: the visuals do not change.
  - Work body legibility floor: accepted, but with the 1280 crop-line tangency above.
  - Step and FAQ tracking, checklist stretch.
  - Type tokens: geometry at 1536 holds within the stated tolerance.
  - Firefox trim emulation, focus rings, cream strip at widths above 1536.
- The panel labels "Wholesale to the Public" and "Massive Used Car Sales Event" are new copy. I accept them because they are the names printed in the customer ads themselves and appear only when the panel is open.

**Rejected:** none. No logged deviation changes the composition, which images are used, or factual copy.

**Unlogged low-level drift:** frame style, lining numerals, and the 3–7% width overruns in the table. None of it breaks the composition. Log it in one row for completeness.

**Bookkeeping:**
- Row 46 gives the source `variant-a/hero-used-car-event.png` as sha1 `60aede31…`. `notes/C-build.md:70` and `C-BRIEF.md:188` give `0b16d89e…3ded` for what they call the same file. I could not hash it (read-only), so provenance is **unverified** until someone reconciles the two.
- Rows 55–56 still say "still unlogged". That text is stale.

**Coverage limits:**
- **320:** at 75px display width I could only check structure. There is no visible overflow and the section order is intact. Text-level clipping, including the growth H2 fit, is unverified. Supply 320 section tiles to close this.
- **Firefox and WebKit:** these are dev-server captures (Next.js "1 Issue" overlay visible). Parity was checked at thumbnail scale only. The claimed ≤2px parity is not verified.
- **Behaviour:** the category link behaviour and the keyboard toggle are claims, not pixel-verified.
- **No mobile reference:** mobile was judged as an adaptation only.
- **No 1920 capture.**
- **Out of B scope but on the route:** the consent banner's "Decline" label is near-invisible on white, below AA (`bdc-r2-b/desktop-fold.png`). This is shared root chrome and must be fixed at site level before any variant ships. Separately, the dev "1 Issue" hydration mismatch lives in the root layout's review-bridge script.

## 4. Scores

| Area | Score |
|---|---|
| Geometry | 9/10 |
| Typography | 8/10 (3–7% width overruns, lining numerals, thinner growth H2) |
| Imagery | 9/10 (correct supplied creative, box-accurate crops, mobile plates now load) |
| Spacing and craft | 8/10 (1280 crop-line tangency, wider next-move group, empty area in the open panel) |
| Mobile readability | 8/10 (all round-1 defects resolved; 320 verified for structure only) |

## 5. Remaining fixes, highest impact first

1. **Shared, outside B:** raise the consent banner's "Decline" text to at least 4.5:1 contrast.
2. **1280 work band:** create 6px or more (target) between line 3 of the body and the storyboard crop lines. Either remove the top overshoot on the frame for widths from 761 to 1535px, or lift `.body` by about 5px. The current gap is about 1–4px (estimated).
3. **Storyboard frame:** match the reference box at x86–546 with top and left lines. It is currently x76–554, all four sides, with overshoot (measured from the pair).
4. **"YOUR NEXT MOVE" group:** bring the circle's right edge to x≤1501 (currently x1510), for example with about −0.01em tracking on the label.
5. **Bookkeeping:** reconcile the `hero-used-car-event.png` sha1 (`60aede31…` against `0b16d89e…`) and remove the stale "still unlogged" text in rows 55–56.
6. **Evidence:** supply native-resolution 320 section tiles and production Firefox/WebKit captures so the H2 fit and the ≤2px parity claims can be verified.
# B · round-2 fixes

**Scope:** `src/components/review/variant-b/**` and `src/app/variant-b/page.tsx`. I did not change or add any images.

**How this round ran:** the previous session was cut off after it had applied items 1–5, 7 and 8. Its work is in checkpoint `d99b5b5`. In this session I:
- checked each of those items again against the code and fresh captures;
- redid item 6;
- confirmed the nav menu component is justified (see item 3);
- ran new captures in all three browser engines.

`git diff d99b5b5` for B now shows only `journal-work.module.css`.

Evidence is in `workflow/homepage/reviews/r2/fix-b/`. All captures are from the dev server, so the Next "1 Issue" badge and the undismissed consent banner at phone widths are dev-only overlays.

## Round-2 items

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Non-breaking hyphens (U+2011) | **FIXED.** Visible copy now uses U+2011 in "follow‑up" (hero lede, hero checklist, signal 03, proof, close body, FAQ 04), "AI‑supported" (hero, signal 03, FAQ 03), "new‑car" (work body, FAQ 02) and "Automotive‑specific" (signal 01). At 320 and 390 no compound splits at its hyphen, and "up" never sits alone on a line. Roboto and EB Garamond draw the glyph, so there is no fallback-font hyphen. | `final-320.png`, `final-390.png` |
| 2 | Audit card H3 at 320 | **FIXED.** At ≤760px the spans are inline and the heading has `text-wrap: balance`. It sets as "Get a Guided / Audit for / Your Dealership" at 320 and as 2 lines at 390. | `final-320.png` (card), `final-390.png` |
| 3 | Mobile nav scroll strip | **FIXED.** Details below the table. | `ev-390-nav-resources-focused.png`, `ev-390-nav-about-focused.png`, `ev-320-nav-resources-focused.png` |
| 4 | Mobile footer padding | **FIXED.** Padding changed from `24px 16px 96px` to `32px 16px`. About 47px now sits below the email text, against about 36px above the brand line. | `final-390.png`, `final-320.png` (footer) |
| 5 | 16:10 fold shows the next H2 | **FIXED.** Details below the table. | `final-1440x900-fold.png`, `final-1280x800-fold.png` |
| 6 | Work band gaps below 1536 | **FIXED.** Details below the table. | `ev-1280-work-gaps-before-after.png`, `ev-1280-work-band-r2.png`, `before-1280-full.png` vs `final-1280-full.png` |
| 7 | "Explore the Work" contrast | **FIXED.** Font size is `max(19px, var(--fs-strong))` at weight 700 on desktop, and 21px/700 on mobile. At every width it counts as large bold text (≥18.66px), so its 4.05:1 contrast passes AA. At 800 wide it clears the Google plate with no overlap. | `final-800-full.png`, `ev-800-work-band.png` |
| 8 | Close H2 "?" (optional) | **FIXED.** The "?" is set alone in Instrument Serif, whose round bowl is the closest match to the image of the fonts tried. It renders the same in all three engines. | `ev-ref-vs-final-q.png`, `ev-engines-close-h2-native.png` |
| — | Firefox and WebKit at 1536 | **CHECKED.** All three engines produce a 5696px page with no broken images, no horizontal overflow and no page errors. Native crops of the hero H1 and close H2 match line for line, and Firefox's text-box trim emulation holds. One WebKit run rendered unstyled: the dev server's CSS did not load (height 29717). A re-run was clean, so this was a transient dev-server fault, not a page defect. | `final-1536-{chromium,firefox,webkit}.png`, `ev-engines-hero-ref-chr-ff-wk.png`, `ev-engines-close-ref-chr-ff-wk.png`, `ev-engines-hero-h1-native.png`, `ev-engines-close-h2-native.png` |
| — | Fidelity r2 #3: storyboard frame (optional) | **FIXED.** The frame now has only top and left lines on the plate edge, with no overshoot. This also removes the crop-line tangency at 1280. | `ev-ref-vs-final-story-frame.png` |
| — | Fidelity r2 #4: "YOUR NEXT MOVE" (optional) | **FIXED.** The circle's right edge is at x1503, against x1500 in the image (was x1510). | `ev-ref-vs-final-nextmove.png` |

**Item 3 in detail.**
- At ≤760px, `.menu` fades out over its last 28px (`mask-image`). The list ends in 28px of padding, and `scroll-padding-inline-end: 28px` keeps a focused link out from under the fade.
- Every link is a plain `<a href="#…">` rendered on the server, so navigation works without JavaScript.
- `JournalNavMenu.tsx` is a client component. It is justified because it adds only one `onFocus → scrollIntoView({inline:"nearest"})`, and the browsers do not do this reliably on their own. I measured with Tab and JavaScript off, looking at how far the focused link sits from the strip's right edge:
  - **Chromium at 390:** RESOURCES sits 63px past the edge and the strip stays unscrolled, so the link is half hidden.
  - **Chromium and Firefox at 320:** FOLLOW‑UP sits 37px past the edge.
  - **WebKit:** scrolls the link into view on its own.
- With the handler, every measured link sits ≥28px clear of the fade in Chromium, Firefox and WebKit, at both 320 and 390.
- Without JavaScript, all five links are still reachable by Tab and activatable. Some sit partly under the fade when focused.
- The focus ring is 3px white, set inside the link so the scroll container cannot clip it.
- Firefox also gives the scrolling `<nav>` itself one extra Tab stop. This is standard behaviour for scroll containers, and I left it as is.

**Item 5 in detail.**
- At `761–1536px` with aspect ratio ≥ 1536/1044, and above 1536 with height < 1044, `.hero` gets `min-height: calc(100svh - 79u)`. Its content stays pinned to the top.
- At 1536×864 this resolves to the hero's own 785 units, so the page is still exactly 5696px tall and 1536 is unchanged.
- At 1440×900 and 1280×800 the fold now ends on paper, below the CTAs. Nothing of the signal H2 shows.
- 1920×1080 is unaffected: 216px of the next section still shows, and its H2 fits whole.

**Item 6 in detail.**
- Two lines cannot fit left of the event plate: the copy is about 1000px long at the 13px floor.
- The body keeps the image's 164-unit top and 15.6/13.3 leading at every width.
- Below 1536 the storyboard drops by exactly the height the 13px floor adds to the three lines: `3.267 × (--body-fs − 13.3u)`. That is +6.3px at 1280, +1.7px at 1440, and 0 at 1536 and above.
- Ink gaps from the H2 baseline to the body, and from the body to the storyboard line:
  - **1280:** 8px / 8px → **12px / 11px**. The image scaled to 1280 would give 13px / 10px.
  - **1440:** 13px / 12px → **14px / 13px**.
  - **1536:** pixel-identical before and after (diff bbox `None`). The image gives 16px / 12px, the build 15px / 13px.
- The mobile captures and both 16:10 fold captures are also pixel-identical before and after this change.

## New deviation rows

| Variant | Section | Target | Change | Reason | Evidence |
|---|---|---|---|---|---|
| B | Copy · compound hyphens | ASCII "-" in follow-up, AI-supported, new-car, Automotive-specific | U+2011 in the visible B strings. Words are otherwise identical to the copy deck. | Stop "follow- / up" style breaks on phones | `final-320.png`, `final-390.png` |
| B | Hero · fold at 16:10 | Fixed 785-unit band (image is 1536×864) | Hero min-height = fold − nav when the fold would show <180 units of the next section; content pinned top | The signal H2 was cut by the fold at 1440×900 and 1280×800. 1536×864 is unchanged. | `final-1440x900-fold.png`, `final-1280x800-fold.png` |
| B | Work band below 1536 | Storyboard top at 221 units | The storyboard drops by the 13px floor's excess, `3.267 × (body size − 13.3u)`: 0 at ≥1536, +6.3px at 1280. Body leading is fixed at the image's 1.173 ratio. The earlier "centred body" rule is removed. | Holds the image's H2→body→frame gaps once the legibility floor applies | `ev-1280-work-gaps-before-after.png` |
| B | Mobile nav (≤760) | Not shown | Right-edge 28px mask fade and scroll padding. A client `onFocus` handler scrolls the focused link fully into view. | The cut-off link now reads as scrollable. Chromium does not reveal a partly visible focused link on its own. | `ev-390-nav-*-focused.png`, `ev-320-nav-resources-focused.png` |
| B | Close H2 "?" | Round-bowled "?" | That one glyph is set in Instrument Serif (`--b-condensed`) instead of Libre Caslon Display | Glyph form match | `ev-ref-vs-final-q.png` |
| B | Work · "Explore the Work" | 24.5 units (about 20px at 1280, 15px at 960) | 19px floor at weight 700 | #1f63ff on the band is 4.05:1, which is AA only as large text | `ev-800-work-band.png` |
| B | Close · audit card H3 (≤760) | Two fixed lines | Inline spans with `text-wrap: balance` | Removes the one-word line at 320 | `final-320.png` |
| B | Footer (≤760) | Not shown | Padding `32px 16px` (was `24px 16px 96px`) | Removes about 100px of empty navy | `final-390.png` |
| B | Unlogged low drift (fidelity r2) | — | Lining numerals, 3–7% width overruns on a few runs, "YOUR NEXT MOVE" 3px wide | Below the tolerance for changing the composition. Recorded for completeness. | `comparisons/b-fix-r2/` |

## Checks

- `npx eslint src/components/review/variant-b src/app/variant-b/page.tsx`: clean.
- `npx tsc --noEmit`: no errors in B files.
- Largest file: `journal-options.module.css`, 442 lines, under the 500-line limit.
- `compare-pngs.mjs refs/variant-b-ref.png reviews/r2/fix-b/final-1536-chromium.png comparisons/b-fix-r2`:
  - Both images are 1536×5696, with no height mismatch.
  - 9.61% of pixels differ (r1: 9.63%). This number is diagnostic only.
- Capture reports: every final capture has `broken: []`, `overflowX: 0` and `pageErrors: []`.

## Not fixed, and outside B's scope

- **Out of scope:** consent banner Decline contrast and button targets (the coordinator fixed these), and the dev "1 Issue" hydration badge from the root layout.
- **Known limit, previously accepted:** below 1280 the work body scales with the composition, down to about 8px at 800 wide. The accepted legibility-floor row covers this.
- **Bookkeeping in DEVIATIONS.md (coordinator's file):** two items are left for whoever owns that file.
  - The `hero-used-car-event.png` sha1 conflict (`60aede31…` vs `0b16d89e…`).
  - Rows 55–56 still say "still unlogged".

## Final captures (`workflow/homepage/reviews/r2/fix-b/`)

- `final-1536-chromium.png`, `final-1536-firefox.png`, `final-1536-webkit.png`: 1536×864, full page
- `final-1440x900-fold.png`
- `final-1280x800-fold.png`
- `final-1280-full.png`: 1280×800, full page
- `final-390.png`: 390×844 at dpr 2, full page
- `final-320.png`: 320×700 at dpr 2, full page
- Also: `final-1440-full.png`, `final-800-full.png`
- Comparison output: `workflow/homepage/comparisons/b-fix-r2/`

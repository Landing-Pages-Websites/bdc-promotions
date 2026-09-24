# /variant-c "Daylight": port notes (2026-09-24)

The source is `scratchpad/c3/proto-daylight/index.html`, palette-passed per PORT.md §1. The port is `src/components/review/variant-c/`, which exports `VariantC`. Everything from the old C was deleted: `Bits.tsx`, `Chrome.tsx`, `Ledger.tsx`, `Path.tsx`, `ads.ts`, `proof-wall/ledger/path.module.css` and the old `Close/Fold/Work` files.

## 1. Palette pass (prototype first)

- The backup is `proto-daylight/index.pre-palette.html`. Only `:root` tokens and nine literal colours changed; no geometry changed.
- **Prototype assets aligned to the repo:** `proto-daylight/shared/` holds copies of `photo-night-showroom-retouched.jpg`, `work-wholesale-public.webp` and `bdc-logo-2026.png`, so the reference and the route use the same pixels. The prototype previously used the pre-retouch photo and `ad-wholesale-public.png`.
- **Recaptured:**
  - `design-psyche/psyche/screens/bdc-c3-daylight-blue/`
  - `proto-daylight/shots/blue-2560-full.png`, `blue-1440-full.png` and `blue-390-full.png` (DPR 2)

### Tokens after the pass

| Token | Before | After |
|---|---|---|
| ground / paper / tint | #F5F4F0 / #FFF / #EFEDE8 | **#FFFFFF / #FFFFFF / #F5F7FA** |
| ink / ink-2 / muted | #0D0D0F / #3D3C40 / #5F5E5A | **#0B1220 / #4A5263 / #6B7280** |
| line / line-2 | 9% / 16% warm ink | **#E6E8EE / #D5D9E1** |
| accent (fills, display text) | #E8510F | **#0059FC** |
| accent-ink (small text on white) | #B93D0B | **#0059FC** (5.48:1) |
| accent-hover | none | **#0047CC** (button badge hover) |
| accent-soft (node halo) | #FCE9DC | **#EEF3FF** |
| accent-dark (small blue on dark) | #FF7A3D | **#6F9BFF** (7.13:1 on #0E0F12) |
| strike (funnel line-through) | #D92D20 | **#0059FC** |
| on-dark-2 / on-dark-1 | #A1A1AA / #D4D4D8 | **#B4BCCB** (10.0:1) / **#D5DAE3** |
| final lede on photo | #C9C9CF | **#CDD3DE** |
| work plate glow | #2A2320 (warm) | **#1E2533** |
| dark / dark-2 / dark-3 | #0E0F12 / #17181C / #24252B | unchanged (neutral) |

- **Badge and step-03 numerals:** these were ink on orange and are now **white on blue** (5.48:1).
- **Halos on dark:** `rgba(0,89,252,.22)`.
- **Funnel text:** now ink-2, because #6B7280 on #F5F7FA measures only 4.50:1.

## 2. Sections: 14, plus header, footer and the mobile bar

| # | Section | File |
|---|---|---|
| 1 | Hero | `Fold.tsx` |
| 2 | Value pillars (docked card) | `Fold.tsx` |
| 3 | The appointment gap (funnel → lane) | `Fold.tsx` |
| 4 | Featured work (luxury plate + spec) | `Work.tsx` |
| 5 | Gallery (2×2 plates, scroll-snap on mobile) | `Work.tsx` |
| 6 | Services (photo lead card + 2×2) | `Services.tsx` |
| 7 | Path (phone → showroom rail, 5 steps) | `Services.tsx` |
| 8 | Follow-up (Live BDC Agent Team lane) | `Services.tsx` |
| 9 | Pricing (dark combined card + 3 rows + non-guarantee) | `Pricing.tsx` |
| 10 | Proof (two ruled lists on one subgrid) | `Pricing.tsx` |
| 11 | Free audit (dark panel) | `Audit.tsx` |
| 12 | Who it's for | `Audit.tsx` |
| 13 | FAQ (`<details>`) | `Audit.tsx` |
| 14 | Final CTA (photo sheet + recap lane) | `Close.tsx` |

The header and mobile bar are in `Header.tsx`, and the footer is in `Close.tsx`.

## 3. Files

All files are under `src/components/review/variant-c/`. Every file is under 400 lines; the largest is `Services.tsx` at 185.

| File | Holds |
|---|---|
| `VariantC.tsx` | The root. Geist from `next/font/google` as `--c-sans`, the `.root` wrapper and the three sheets. It imports `base.module.css` first. |
| `base.module.css` | Tokens on `.root` (with the ≥1800 and ≤720 overrides), the heading type, buttons, `.head`, sheets, `.card`, `.photoChip` and the lane |
| `ui.tsx` | `ArrowBadge` and the email constant |
| `Header.tsx` + `chrome.module.css` | Sticky pill nav, the ≤1100 menu, and the ≤720 fixed bar (inside the wrapper) |
| `Fold.tsx` + `fold.module.css` | Hero, pillars, gap |
| `Work.tsx` + `work.module.css` | Featured work, gallery |
| `Services.tsx` + `services.module.css` | Services, path, follow-up |
| `Pricing.tsx` + `pricing.module.css` | Pricing, proof |
| `Audit.tsx` + `audit.module.css` | Audit, who, FAQ |
| `Close.tsx` + `close.module.css` | Final CTA, footer |

### Content wiring

- `auditHref`, `phoneHref` and `phoneDisplay` are used everywhere.
- `serviceOptions` feeds all four plans, the combo lane names and the follow-up "Includes" line.
- `growthSteps` feeds the path steps and the follow-up lede.
- `faqItems` supplies:
  - [0], the pricing side Q&A;
  - [3], the pricing non-guarantee row;
  - [1] (question only) and [2], in the FAQ.

### Port decisions (the reasons behind the code)

- **Specificity.** Every rule keeps the prototype's specificity. Element rules use `:where(.root) h2` so they stay at (0,0,1).
  - Cross-file overrides are written one class higher than the base rule they beat, e.g. `.heroSide .heroCtas`.
  - This works because `base.module.css` loads before every section module. That was verified in the served CSS order, where base comes first.
- **Global leaks fixed:**
  - `app/styles/sections.css` sets `h2, h3 { font-family: Barlow Condensed; font-weight: 700 }`. `.root h1/h2/h3 { font-family: inherit; font-weight: 600 }` overrides it.
  - Preflight and `a { text-decoration: none }` remove the prototype's default underlines. They were restated on the FAQ answer links and the footer legal links.
- **The → arrow glyph.** Geist's latin subset has no `→` (U+2192), and next/font would draw it from its size-adjusted Arial fallback. `.tlink .arr` names the system stack instead, the same glyph as the prototype.
- **`html` behaviour.** Smooth scroll and `scroll-padding-top` (112px, or 16px at ≤720) are set through `:global(html):has(.root)`, with `auto` under reduced motion. This scopes them to this route.
- **Dark-sheet classes.** The final sheet no longer carries `.onDark`. It is set on the final copy and on the footer instead, so the white recap card keeps the light lane without the prototype's four override rules.
- **Pillar headings.** The pillar titles are `h2`, where the prototype had `h3`, styled at the h3 step. The outline now never skips from h1 to h3. Visual output is identical.
- **Mobile bar.** Its z-index is 40, where the prototype had 60, so it sits under the site consent banner (z-50) and never covers the banner's buttons.
- **Skip link.** The prototype's own "Skip to content" link was dropped, because the root layout already renders "Skip to main content" (`#main-content`).
- **Logos.** Header and footer logo images pin `aspect-ratio: 1254 / 749`. The optimizer's 128w rendition rounds the height, which moved the nav by 0.4px.
- **Images.**
  - The hero is optimized with `preload`. Its `sizes` follows the cover-fit: 467px at ≤483, `100vw-16px` at ≤720, 817px at 721–849, and `100vw-32px` above that.
  - The final background uses 779px at ≤720, 1950px at 721–1100 (height-bound, measured ≈1750px of photo at 1024), and 100vw above that.
  - The /lp photos use `calc(100vw - 56/64px)` or 620/580px.
  - The five creatives are `unoptimized` and capped at 440, 400/480, 400/480, 460 and 420 CSS px.
- **FAQ copy.** The creative answer is the prototype's text, which is A:72's short form. `faqItems[1][1]` carries "The supplied work covers…", so only its question is reused.

## 4. Fidelity proof (V199)

### Geometry and computed style

- **Method.** `proto-daylight/tools/geom.mjs` dumps every element under header, main and the mobile bar (rect, font, colour, background, shadow, radius, border, padding, margin, decoration). `geomdiff.py` then aligns proto and route by tag and text and prints every difference over 0.3px.
- **Page heights match** at every viewport:

  | Viewport | Proto | Route |
  |---|---|---|
  | 2560 | 13080 | 13080 |
  | 1440 | 12189 | 12189 |
  | 1280 | 12126 | 12126 |
  | 1024 | 15162 | 15162 |
  | 390 | 15849 | 15849 |
  | 320 | 17399 | 17399 |

- **Remaining rows at every width:** only three.
  - The pillar h3→h2 change (intended).
  - `img` computed colour: next/image's `color: transparent` inline style, which is invisible.
  - The logo `<a>`'s `text-decoration` computed value, which is invisible on an image link.
- **Text.** Rendered `innerText` is identical at 390. At 1440 it differs only inside the hidden mobile bar, as source whitespace. All 66 alt, href and aria-label attributes are identical.

### Pixels, band by band

`proto-daylight/tools/banddiff.py` compares the proto and route captures at a per-channel tolerance of 24. The side-by-side band images are in `proto-daylight/look/diff/`.

- **1440:** 0.773% of pixels differ, in 21 bands.
  - Most of it is the hero photo: optimizer re-encode noise on highlight edges, plus the consent banner.
  - Also the logo resample, the /lp photos and the final background photo.
  - The remaining 7 small bands are single glyphs ("h" of "showroom", "/ mo", "©"). That is font rasterisation: next/font's self-hosted Geist file vs the Google css2 file.
- **2560:** 0.047% differ. The differences are the consent banner, glyph pixels and photo re-encode.
- **390 at DPR 2:** 0.512% differ. Mostly the consent banner, plus photo re-encode, the logo and glyph pixels.
- **Geometry, spacing, type and colour:** no differences remain at any width.

## 5. Gates (run from the repo root; output verbatim)

- **`node workflow/homepage/scripts/density.mjs c http://127.0.0.1:3419`** printed `0 soft image render(s)`.
  - Every row reported ` ok ` at 1536, 1440, 1280 and 390, all @2x.
  - The thinnest was `bdc-inventory-production.webp`: box 620, need 1240, served 1248, ratio 1.01.
- **`npx tsc --noEmit`** produced no output: 0 errors overall, 0 of them in `variant-c`.
- **`npx eslint src/components/review/variant-c`** produced no output (exit 0).
- **Overflow, live DOM** (`document.documentElement.scrollWidth` / `clientWidth`):

  | Viewport | scrollWidth / clientWidth |
  |---|---|
  | 320 | 320 / 320 |
  | 390 | 390 / 390 |
  | 1024 | 1024 / 1024 |
  | 1440 | 1440 / 1440 |
  | 2560 | 2560 / 2560 |

- **Structure** (`proto-daylight/tools/routecheck.mjs`), at every width:
  - `h1` = 1;
  - 0 skipped heading levels;
  - 0 links or summaries under 44px, excluding inline links inside sentences.
- **Focus and motion.**
  - The `:focus-visible` ring is 2px `#0059FC`; it is `#6F9BFF` inside `.onDark`.
  - The mobile bar is `display: grid` and z-index 40 at ≤720.
  - `html` scroll-behavior is `auto` under reduced motion.

## 6. Screenshots

- **Route, kit** (desktop 1440, laptop 1280, mobile 390; full and fold):
  - `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-c/`
- **Route, capture.mjs**, which waits for every lazy image:
  - `workflow/homepage/c3/shots/c/2560-full.png`
  - `workflow/homepage/c3/shots/c/1440-fold-dpr2.png`
  - `workflow/homepage/c3/shots/c/1440-full.png`
  - `workflow/homepage/c3/shots/c/390-full.png` (DPR 2)
- **Palette-passed prototype:**
  - `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-daylight-blue/`
  - `scratchpad/c3/proto-daylight/shots/blue-2560-full.png`, `blue-1440-full.png` and `blue-390-full.png`

## 7. Differences left, with reasons

1. **Font rasterisation.** A handful of glyphs differ by a few pixels. next/font self-hosts its own download of Geist; the prototype used the Google css2 file. Metrics are identical: every text box matches to within 0.3px.
2. **Photo and logo encoding.** PORT.md requires optimized photos, so the route serves `/_next/image` q75 renditions where the prototype used raw files. Only compression noise differs; crops and positions are identical.
3. **Consent banner.** The site banner appears in the route captures (the capture's "Got it" click sometimes lands before hydration). This is an allowed difference.
4. **Pillar titles are `h2`.** The change fixes heading order and is visually identical.
5. **Kit capture artifact.** The kit's full-page shots (`bdc-c3-route-c/*-full.png`) show the two /lp photos (services, audit) as empty dark boxes, and on mobile also the final photo.
   - The cause is the kit's scroll-through (700px every 60ms), which is too fast to trigger next/image's native `loading="lazy"` for those images.
   - With a real scroll they load: this was verified by scrolling into view, where they load within 1.5s. The capture.mjs shots show them.
   - Use `shots/c/*` for judging those bands.
6. **Out of scope, observed.** Under emulated `prefers-reduced-motion: reduce` only, Chromium reports a 3px `currentColor` focus outline on the route. No author stylesheet contains that rule. /lp shows the same; A shows its own 3px ring. It is not from variant-c CSS and was not changed.
7. **Inherited from the prototype, needing owner sign-off** (from NOTES.md):
   - The combined plan is emphasised, while VERIFIED-COPY says "do not highlight any tier".
   - The `bdc-promotions.com` email domain differs from the live `bdcpromotions.com`.

## Fix round 1 (2026-09-24, critic round-1 FAIL → fixes)

The route now diverges from the palette-passed prototype on purpose, wherever PORT.md §4 or the critique required it. The prototype HTML was not updated; the route is the reference from here on.

### Changes, keyed to the critique

- **Flags.**
  - **Chips and footer (PORT §4.1).** All four "Illustrative photograph" chips are gone, along with the `.photoChip` primitive. The footer legal row reads exactly `Photographs are illustrative and do not show a BDC Promotions client or location.`
  - **Swash.** The hand-drawn swash under "your showroom" is deleted (the `<svg>` and the `.hl .u` rule).
  - **Decorative icons.** The follow-up card's fake icon buttons (person and sparkle) are deleted, and so is the sparkle before "Nurture". The card is now a plain message thread with no icons.
  - **Uniform padding.** The rhythm now varies by relationship, using `--join` 48, `--half` 64 and `--chap` 96 (56/80/112 at ≥1800):
    - Services → Path joins at 48, with no rule.
    - Follow-up gets a rule at 64.
    - Pricing opens a new chapter: 96, a rule, then 96.
    - Proof sits 48 under the guarantee row, with no rule.
    - FAQ follows Who at 48, with no rule.
- **1. Container at 2560.** The `--wide`/`.wrapWide` tier is deleted. Everything sits on the single `--container` (1200, or 1320 at ≥1800), and at 2560 every section runs from x=620 to 1940.
- **2. Hero.**
  - The photo sits on the container (`width: min(var(--container), 100% - 2*gutter)`), on the same edge as every line of content.
  - `.proofRow` is removed from the hero. At 1440×900 the photo starts at y=387 and fills 57% of the fold (it was 466 and 47%).
  - **Beyond the list: 1101–1279.** The H1 is `min(var(--t1), 5.1vw)`, so it stays on two lines. The duplicate hero Call button is hidden there, because the header shows the phone link at those widths. The photo now starts at y=405 (55%); it was 465 (48%).
  - **Beyond the list: 721–1100.** The lead and the CTAs share one row, and the H1 is `min(64px, 8.6vw)`. At 1024 the photo moves from y=562 to 533.
- **3. Standards.** The three standards rules and their column are deleted. The proof list takes columns 1–7. The positioning card, the audit line and the link sit in columns 8–12 at x=834.
- **4. Right-column line.**
  - The featured spec is `8 / span 5` with no padding-top, so its label sits on the plate's top edge.
  - The FAQ is a real 7/5 grid. The aside is in columns 8–12, spans both rows, and is top-aligned to the H2 cap line. The list now starts 65px under the H2; before, it sat 177px under the H2, below the aside.
  - The call and email links share one row.
  - At 1440, every side column's x is 834. The one exception, 823, is the side column inside the dark audit panel, which runs on the panel's own inner grid.
- **5. Alt text.** The services photo's alt is `A videographer filming a dealership's vehicle lineup through a showroom window at night`. The audit photo's alt is `A consultant and a dealer meeting across a table with a laptop`.
- **6. Work head.** The gallery label and H2 are deleted. A visually hidden `h3#gal-h` "More automotive ad creative" names the grid, and the rule plus the grid follow the featured case directly.
- **7. Gallery geometry.**
  - The used-car ad is `min(93.75%, 375px)` (450 at ≥1800), so both portraits are 500px tall (600 at ≥1800).
  - Meta and VLA are both 420px, top-aligned, with 56px well padding.
  - Each caption is the ad title plus the verified category and a format fact: `Event campaigns · 3:4`, `Event campaigns · 4:5`, `Inventory advertising · Carousel` and `New car lead gen · Search listing`. The categories come from VERIFIED-COPY rows 153–158. The used-car creative is 1086×1448, which is 3:4, so it says 3:4, not the critic's 4:5.
- **8. Lane.**
  - It is kept only in the gap diagram; the Path has its own rail.
  - The hero proof dots are removed.
  - The pricing combo is now one line of text, `Lead Generation + Live BDC Agent Team`, with the + in #0059FC at 1.25em (27.5px, so ≥24px on dark). There are no pills.
  - The close recap is a plain ruled list.
- **9. Sameness.** Who's two Q&As moved into the FAQ as its first two items. Who is now a statement band: a label, the audience line at 32px in `--ink`, and a "Free audit" button. The section count stays at 14.
- **10. Images.**
  - The final band has no photo. It is a flat `#0E0F12` sheet with the white recap card, so the showroom appears twice: in the hero, and in the inventory-production scene.
  - The audit photo is cropped at `aspect-ratio: 2/1`, `object-position: 50% 78%`.
- **11. Grey text.** `.lead`, `.pillar p`, `.svcItem p` and every body line are `--ink-2` #4A5263. #6B7280 is used only for labels and meta.
- **12. Accent on dark.** `.onDark h2 .acc` is `#0059FC`. #6F9BFF remains only for small text on dark.
- **13. Follow-up.** `.split` is `align-items: start`, so the label is top-aligned with the thread card.
- **14. Path.**
  - The card padding is 24px and the step gap 16px, so each step is 218px at 1200 (it was 211); the track's right end was recomputed.
  - Step copy is 15px/1.5, and every step is ≤3 lines at ≥1279.
- **15. Minor.**
  - The hero "Explore the work" link is gone, together with the proof row.
  - "See how the process works →" now points forward, to `#audit`.
  - The footer Services column includes "Reels & value-proposition videos".
  - The pillar titles are `h3` under a visually hidden `h2`.
  - The header is `position: relative` at ≤720, so only the fixed bar stays pinned.
  - The no-op `backdrop-filter: blur(12px)` is deleted from the nav and the mobile bar.
  - Pricing rows use `align-items: start`.
- **Beyond the list.** In the Who statement, "running — or planning to run —" put an em dash at the start of a line at 1440 and 2560. A no-break space before each dash binds it to the word before it.

### Findings not applied, with reasons

- **Audit photo crop "to the table, laptop and hands".** 2:1 at 50% 78% is the tightest crop that stays crisp. The box is 580 CSS px, which needs 1160 device px at DPR 2, and the file is 1248px wide. A tighter crop would need about a 1.6× zoom and would render soft (V210, density gate), so the two faces stay in frame. The figcaption is verified copy (VERIFIED-COPY lines 305–306) and is kept.
- **BRIEF.md lines 61–62** ask for a per-photo "Illustrative photograph" caption and the "AI-generated" footer string. PORT.md §4.1 overrides both ("the findings the judges agreed on override anything above that conflicts"), so neither is used.
- **Path at 1101–1278.** The steps are 185–217px wide, and some step copy runs to 4 lines. That range is narrower than the 1200 container; ≤1100 switches to the vertical rail, and ≥1279 is ≤3 lines.
- **Kit auto-flags** (10 font sizes, 6 shadow recipes, 1 gradient):
  - The 10 sizes are the 8-step ramp plus 15px (Path steps, which the critic asked for) and 27.5px (the pricing "+", which must be ≥24px for blue on dark).
  - The shadows are the ring, the inset rings and one lift.
  - The gradient is the work plate's radial glow.
  - All are deliberate and unchanged from round 0.
- **The prototype HTML** was not changed. The fixes are route-only, as round-1 review fixes.

### Gates (run from the repo root; output verbatim)

`npx tsc --noEmit; echo "tsc exit=$?"; npx eslint src/components/review/variant-c; echo "eslint exit=$?"`
```
tsc exit=0
eslint exit=0
```

`node workflow/homepage/scripts/density.mjs c http://127.0.0.1:3419`: every row ` ok ` at 1536, 1440, 1280 and 390 @2x. The last line:
```
0 soft image render(s)
```
The thinnest rows at 1440:
```
 ok  box  620 need 1240 served 1248 (req w=1920, file 1248) 1.01 bdc-inventory-production.webp
 ok  box  580 need 1160 served 1200 (req w=1200, file 1248) 1.03 bdc-audit-consultation.webp
 ok  box  375 need  750 served 1086 (req w=0, file 1086) 1.45 work-used-car-event.webp
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp
```

**Live-DOM probe** (`scratchpad/c3/fix1c/probe.cjs`, `scrollWidth − clientWidth`, `h1` count, skipped heading levels, non-inline targets <44px):

| Width | Overflow | h1 | Skips | Small targets | Photo y (fold %) | Page height |
|---|---|---|---|---|---|---|
| 320 | 0 | 1 | 0 | none | 88 (90%) | 15984 |
| 390 | 0 | 1 | 0 | none | 88 (90%) | 14559 |
| 1024 | 0 | 1 | 0 | none | 533 (41%) | 14477 |
| 1150 | 0 | 1 | 0 | none | 405 (55%) | 11722 |
| 1280 | 0 | 1 | 0 | none | 387 (57%) | 11531 |
| 1440 | 0 | 1 | 0 | none | 387 (57%) | 11531 |
| 2560 | 0 | 1 | 0 | none | 419 (53%) | 12326 |

capture.mjs reported `"broken":[],"overflowX":0,"pageErrors":[]` for every capture. The 390 page is 1,290px shorter than round 0's 15,849.

### Screenshots (fix1)

- Kit: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-c-fix1/`. Its full-page shots show the two /lp photos undecoded, which is the known scroll-speed artifact; use `shots/c/*` for those bands.
- `workflow/homepage/c3/shots/c/2560-full-fix1.png`
- `workflow/homepage/c3/shots/c/1440-fold-dpr2-fix1.png`
- `workflow/homepage/c3/shots/c/1440-full-fix1.png`
- `workflow/homepage/c3/shots/c/390-full-fix1.png` (DPR 2)
- Band crops and the 1024 fold: `scratchpad/c3/fix1c/`

## Fix round 2 (2026-09-24, critic round-2 FAIL → fixes)

The route now has **13 sections**: Hero, Pillars, Gap, Featured work, Gallery, Services, Path, Follow-up, Pricing, Proof, Audit, FAQ (with "Who it's for"), Final.

### Changes, keyed to the critique

- **1. V212 menu** (`Menu.tsx` new, `Header.tsx`, `chrome.module.css`).
  - The 280px floating card is gone. At ≤1100 the menu is a full-width sheet with `position: absolute; top: 0; left: 0; right: 0` inside the sticky/relative header, and `z-index: -1` in the header's stacking context. That puts it above the page but below the bar's logo and its summary.
  - The sheet travels with the bar and its Close button. At ≤720 the header is not sticky, so a `position: fixed` sheet would have scrolled away from its own close control.
  - Rows are 56px with hairline rules at 18px/500. Padding is 88px / var(--gutter) / 24px at ≤720, and 112px at 721–1100. A 100vmax spread shadow is the scrim.
  - The summary reads "Menu", or "Close" when open, and turns white when open.
  - `Menu.tsx` is a small client component. It closes the menu on an anchor tap, on Escape (returning focus to the summary), and on a tap outside the sheet. Without JS, `<details>` still opens and closes.
- **2. Chapter rhythm.**
  - `#proof` is `section ruled chapter`, giving 96 + rule + 96.
  - The Who band is merged into the FAQ side column, so the Who→FAQ `.join` no longer exists.
  - The dark pricing card no longer has `--lift`, so there is no shadow bleed onto white.
  - Content-to-content gaps, measured by `fix2c/gaps.cjs`:

    | Width | Pricing→Proof | Audit→FAQ | Smallest gap on the page |
    |---|---|---|---|
    | 1440 | 193 | 128 | 48, the deliberate Services→Path join (see Not changed #8) |
    | 390 | 113 | 80 | 28 by the probe; about 67 visually, same join |
    | 2560 | 225 | 160 | — |

- **3. Dead zones.**
  - **Featured work:** plate padding is 48/40 and `.feature` is `align-items: stretch`. `.spec` is `align-content: space-between`: the title sits on the plate's top edge and the dl bottom equals the plate bottom (2923 = 2923 at 1440). The dl gained two rows: **Headline** "We Make Luxury Affordable" (the ad's printed headline, VERIFIED-COPY §4) and **Format** "4:5" (a permitted format fact).
  - **Pricing:**
    - Rows are packed from the top (`justify-content: flex-start`, gap 28, padding 40).
    - The duplicate "Lead Generation + Live BDC Agent Team" line is deleted.
    - "Are results guaranteed?" moved into the head's side column as a `<dl>` under "Do we have to buy every service?". The plan list is now 3 rows.
    - The card still stretches so it shares the rows' bottom edge. The button is `margin-top: auto`, so the only slack is above it: 70px at 1440 and 28px at 2560. It was 115 + 106 of voids. See Not changed #2.
  - **FAQ:** a 5/7 split with a sticky side (`top: 120px`) holding the label, a 32px H2, the note, call/email, and then "Who it's for" (an h3 label, the statement at 22px, and a "Free audit" button). The side is 524px and the list 491px at 1440, where before there was 587px of void. At ≤1100 the side dissolves (`display: contents`), and the order becomes head → list → who.
  - **Audit:** the consultation photo is deleted. The steps take cols 1–7. The white deliverable card takes cols 8–12; it moved here from the final band and holds the recap list plus a dark "Get my free dealership audit" button. Steps end at y8834 and the card at y8887.
- **4. Imagery.**
  - `bdc-audit-consultation.webp` is no longer rendered, and there is no substitute photo.
  - Meta is at 340 and VLA at 320, side by side in one full-width "pair" card (row 2 of the gallery). On mobile the pair dissolves into two carousel slides.
  - The videographer photo now leads the Services card as "Reels & value-proposition videos". New-car lead generation is first in the 2×2.
- **5. Sameness.**
  - Proof is a 32px H2 plus the intro, then a full-width 3-column ruled strip of the three standards, then a ruled footer row: the positioning line (18px/500 ink) and the audit sentence with "See how the process works →" as the last line.
  - FAQ H2 is 32px.
  - The pillars are a spec strip: h3 14px/600 uppercase `--muted` and the line at 16px/500 `--ink`, still docked on the photo.
  - The final band is new: the label, the H2 across all 12 columns (2 lines at 1440 and at 2560), then one ruled row of lead | actions.
- **6. Labels cut:** "Source work example", "Our proof standard" and "Automotive-specialist positioning".
- **7. Nav centring.**
  - `.nav` is `grid 1fr auto 1fr` at ≥1101, with symmetric 12px bar padding (the logo keeps its 20px inset through an 8px margin) and link padding 12px.
  - `.navCall svg { flex: none }`: it had been shrinking to 5px (visible as a stray tick before the phone number).
  - Links are within 0.2px of the bar centre at every width ≥1253. Below that, the CTA's min-content takes precedence, so the links sit off-centre, never overlapping.
- **8. 2560 type:** at ≥1800, `--t6: 17px; --t7: 15px; --tl: 13px`. Path step copy is `calc(var(--t6) - 1px)`.
- **9. Mobile audit edge:** the `width: calc(100% - 24px)` override is deleted, so the panel sits on the 20px gutter.
- **10. Copy.**
  - The Follow-up lead is now `faqItems[2][1]` (the full "What happens after a lead comes in?" answer), and that question left the FAQ so it is not repeated. The FAQ has 5 items.
  - Step 04 keeps its own line, so no sentence repeats.
  - The link reads "See BDC agent pricing →".
  - Footer: "Privacy policy" and "Cookie policy".
  - VLA caption: "New-car lead generation · Search listing".
- **11. Funnel strike:** `text-decoration-color: var(--ink-2)` at 1.5px. The `--strike` token is deleted.
- **12. FAQ inline links:** `display: inline-block; padding-block: 11px; margin-block: -11px`. The probe, with every answer opened, finds 0 targets under 44px.
- **Beyond the list.**
  - "Includes 1 new video each month" wrapped at 2560, so the price column is `auto` with a nowrap term.
  - At 2560 the final H2 broke into 3 short lines, so it now spans 12 columns.
  - The V212 1px sweep also covered the ≤720 action bar.

### Not changed, or changed differently, with reasons

1. **FAQ split is 5/7, not 4/8.** In 4 columns (384px) the side (head, contacts, 22px Who statement, button) measured about 610px against a 490px list, which would have moved the void to the list side. At 5/7 they balance: 524 vs 491.
2. **Pricing is `align-items: stretch`, not `start`.** Packed from the top, the card is 42px shorter than the three rows at 1440. Stretching keeps the two bottom edges aligned and puts that slack above the bottom-anchored button (70px), instead of leaving a 54px step under a heavy dark card. There are no voids between the price and the includes.
3. **Consultation photo vs BRIEF.md §"Section requirement" #11** ("three steps, plus the consultation photo"). BRIEF says the list "may be reordered or merged", and PORT §4.1 and V207 outrank it. The photo is deleted with no substitute, as the critic specified.
4. **"See BDC agent pricing →"** is not in VERIFIED-COPY's permitted-label list verbatim. It is a navigation label built from verified names, and it makes no claim. Flagged for owner sign-off.
5. **Pillars were not merged into the hero.** With Who already merged into the FAQ, that would leave 12 sections, below the ≥13 floor. The critic's alternative (the spec-strip styling) was applied.
6. **Audit keeps its 7/5 head.** It sits inside the one dark rounded panel on the white sheet, and its body is now a steps | deliverable pair.
7. **Kit auto-flags:**
   - 9 font sizes (was 10).
   - 6 shadow recipes: four are 1px hairline rings (borders drawn as shadows), plus `--lift`, which is now only under creatives on the dark sheet, and the 5px halo on the blue end nodes.
   - 1 gradient: the work plate glow.
8. **Services → Path `.join` kept.** It is not a collision: about 100px visually at 1440 and about 67px at 390, from the service text to the centred "Process" label.
9. **Environment finding (not a variant-c defect).** On the dev server at `127.0.0.1:3419`, no route hydrates in headless Chromium. This affects `/variant-a` as well. `document` has `_reactListening…`, but no element carries a React fiber, `__next_f` is drained, and there is no pageerror. The consent banner's "Got it" is inert, which is why it appears in every capture (the critic's r2 menu shots show the same).
   - `Menu.tsx`'s close paths were therefore verified in an isolated esbuild harness (`scratchpad/c3/fix2c/harness/`, which bundles the real `Menu.tsx` and `chrome.module.css`): `menu harness: 8 assertions passed` (open → Close label, anchor tap closes and navigates, Escape closes and refocuses the summary, outside tap closes, summary toggles).
   - On the dev server itself, the sheet opens and closes through the summary (native `<details>`).

### Gates (run from the repo root; output verbatim)

`npx tsc --noEmit; echo "tsc exit=$?"; npx eslint src/components/review/variant-c; echo "eslint exit=$?"`
```
tsc exit=0
eslint exit=0
```

`node workflow/homepage/scripts/density.mjs c http://127.0.0.1:3419` (every row at 1536, 1440, 1280 and 390 @2x is ` ok `). The 1440 and 390 blocks and the last line:
```
--- c 1440px @2x
 ok  box 1200 need 2400 served 3840 (req w=3840, file 3840) 1.60 photo-night-showroom-retouched.jpg
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  375 need  750 served 1086 (req w=0, file 1086) 1.45 work-used-car-event.webp sizes=""
 ok  box  400 need  800 served 1122 (req w=0, file 1122) 1.40 work-wholesale-public.webp sizes=""
 ok  box  340 need  680 served 1090 (req w=0, file 1090) 1.60 work-meta-inventory.webp sizes=""
 ok  box  320 need  640 served  963 (req w=0, file 963) 1.50 work-google-vla.webp sizes=""
 ok  box  620 need 1240 served 1248 (req w=1920, file 1248) 1.01 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 56px), 620px"
 ok  box  120 need  240 served  256 (req w=256, file 1254) 1.07 bdc-logo-2026.png sizes="120px"
--- c 390px @2x
 ok  box  350 need  700 served 1080 (req w=1080, file 3840) 1.54 photo-night-showroom-retouched.jpg
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-luxury-campaign.webp sizes=""
 ok  box  238 need  476 served 1086 (req w=0, file 1086) 2.28 work-used-car-event.webp sizes=""
 ok  box  254 need  508 served 1122 (req w=0, file 1122) 2.21 work-wholesale-public.webp sizes=""
 ok  box  254 need  508 served 1090 (req w=0, file 1090) 2.15 work-meta-inventory.webp sizes=""
 ok  box  254 need  508 served  963 (req w=0, file 963) 1.90 work-google-vla.webp sizes=""
 ok  box  334 need  668 served  750 (req w=750, file 1248) 1.12 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 56px), 620px"
 ok  box  120 need  240 served  256 (req w=256, file 1254) 1.07 bdc-logo-2026.png sizes="120px"

0 soft image render(s)
```
(The two hero rows are shown here without their long `sizes=` string; it is unchanged from round 1.)

**Live-DOM probe** (`scratchpad/c3/fix2c/probe2.cjs`, with every FAQ answer opened):
```
{"w":320,"overflow":0,"docH":16013,"h1":1,"skips":0,"sections":13,"photoY":88,"foldPct":90,"small":[]}
{"w":390,"overflow":0,"docH":14731,"h1":1,"skips":0,"sections":13,"photoY":88,"foldPct":90,"small":[]}
{"w":1024,"overflow":0,"docH":14128,"h1":1,"skips":0,"sections":13,"photoY":533,"foldPct":41,"small":[]}
{"w":1280,"overflow":0,"docH":11085,"h1":1,"skips":0,"sections":13,"photoY":387,"foldPct":57,"small":[]}
{"w":1440,"overflow":0,"docH":11085,"h1":1,"skips":0,"sections":13,"photoY":387,"foldPct":57,"small":[]}
{"w":2560,"overflow":0,"docH":11908,"h1":1,"skips":0,"sections":13,"photoY":419,"foldPct":53,"small":[]}
```

**V212 1px sweep** (`fix2c/sweep.cjs`: page overflow, header items single-line and inside the bar, and link centring):
```
widths checked: 1601 (320..1920)
failures: 0 []
max link-centre offset at >=1253px: 0.20 px at 1253
```
The action-bar sweep (`fix2c/sweep-mbar.cjs`, 320..720) printed `failures: 0 []`. Its "1601" label is a copy of the header sweep's string; that run checked 401 widths.

**Menu** (`fix2c/menu.cjs`, live route, native open): the sheet is `[0,0,320,448]`, `[0,0,390,448]` and `[0,0,1024,472]` (x, y, w, h). Rows are `[56,56,56,56,56,56]` and the summary reads `Close`. The harness assertions are above.

The capture.mjs runs all reported `"broken":[],"overflowX":0,"pageErrors":[]`.

### Screenshots (fix2)

- Kit: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-c-fix2/`. Its full-page desktop and laptop shots can show `bdc-inventory-production` undecoded, the known scroll-speed artifact; use `shots/c/*` for that band.
- `workflow/homepage/c3/shots/c/2560-full-fix2.png`
- `workflow/homepage/c3/shots/c/1440-fold-dpr2-fix2.png`
- `workflow/homepage/c3/shots/c/1440-full-fix2.png`
- `workflow/homepage/c3/shots/c/390-full-fix2.png` (DPR 2)
- Menu, section crops and 1024/390 slices: `scratchpad/c3/fix2c/`. These include `menu-open-{320,390,1024}.png`, `pricing-1440.png`, `work-1440.png`, `faq-1440.png`, `proof-1440.png`, `sheet390-*.png` and `sheet1024-*.png`.

## Fix round 3 (2026-09-24, owner-lens blind judge → fixes)

The route still has **13 sections** (Hero, Pillars, Gap, Featured work, Gallery, Services, Path, Follow-up, Pricing, Proof, Audit, FAQ with Who, Final), exactly one `h1`, and no new copy.

### Changes

- **Proof.** The "Real customer testimonials" item and its line are deleted (`Pricing.tsx`). The strip is now 2 columns (`pricing.module.css`), keeping "Verified campaign screenshots" and "Dealership CRM outcomes".
- **Grounds.** No change was needed. Every light section ground is already `--ground` #FFFFFF. `--tint` #F5F7FA appears only on the funnel pills, the chat bubbles and hover fills. The probe's grounds check (every element ≥90% of the viewport wide with a light, opaque, non-white background) returns `[]` at every width. The dark sheets (work, audit panel, final) and the hero photograph are not light grounds.
- **Blue primary CTAs** (`base.module.css`).
  - `.btnPrimary` is a #0059FC fill with #fff text (5.48:1) and a #0047CC hover. Its badge flips to white with a blue arrow.
  - `.btnLight` is deleted. Every button that used it now uses `.btnPrimary`: header "Free audit", mobile-bar "Free audit", pricing, and final.
  - The hero, audit deliverable and FAQ "Free audit" buttons were already `.btnPrimary`. All seven audit buttons compute to `rgb(0, 89, 252) / rgb(255, 255, 255)`.
  - Secondary actions are still outline or ghost: the hero call, the final call and the mobile-bar call.
- **Hero photograph owns the fold** (`Fold.tsx`, `fold.module.css`).
  - **≥721px.**
    - The photo is full-bleed behind the header and the headline. The hero takes `margin-top: -96px`, the header's height, so the pill nav floats on the photo.
    - Its height is `clamp(600px, min(100svh - 64px, 64vw), 1600px)`, and its bottom corners use `--r-xl`. The pillars still dock 88px over its bottom edge.
    - The text is one left column: eyebrow, H1, lead (max 560px), then CTAs. The H1 is white, and "your showroom" is `--accent-dark` #6F9BFF; #0059FC on the night photo measures only about 3.6:1. The lead is `--on-dark-1`. The call button is a white ghost, and the focus ring is #6F9BFF.
    - **Scrim.** A horizontal night field, rgba(8,12,22) at .88 → .86, anchored to the container's left edge and solid to +760px, then fading to 0 at +1140px. A 200px top shade sits under the nav.
    - The old 12-column hero grid and the 1101–1279 and 721–1100 hero overrides are deleted.
  - **721–1100 portrait (tablets).** The text column spans the viewport, which would put the whole photo under the scrim. Instead, the text sits on a #080C16 night ground and the full photo runs as a 460px band beneath it, fading up into the ground.
  - **≤720.** Unchanged: the 240px rounded photo card sits above the text on white.
  - **`sizes`** now describes the cover-fit: `(max-width: 519px) 467px, (max-width: 640px) 90vw, (max-width: 720px) calc(100vw - 64px), (max-width: 1100px) 180vw, (max-aspect-ratio: 8/5) 125vw, (max-aspect-ratio: 2/1) 113vw, 100vw`. At 1440×900 the photo renders 1627px wide.

### Fold measurements (`scratchpad/c3/fix3c/probe3.cjs`)

The probe removes the consent banner and waits for the hero image and fonts.

- **Photo share of the fold** is the photo's visible area minus the nav pill and the docked pillar card:

  | Viewport | Photo share | Photo bottom (fold) | Pillar card bottom |
  |---|---|---|---|
  | 1440×900 | 78.6% | 836 (900) | 893 |
  | 2560×1440 | 90% | 1376 (1440) | 1437 |
  | 1280×800 | 73.9% | 736 | 793 |
  | 1024×768 | 69.7% | 681 | 844 |

  - The photo's bottom edge sits inside the fold at every desktop width. At 1440 and 2560 the whole pillar card does too.
  - At 2560 the box is 2560×1376 (1.86:1 against the photo's 1.946:1), so it is proportionate and not a sliver.
- **Text contrast, measured.** The script hides the hero text, screenshots the photo and scrim, and then compares the text colour against the luminance of every pixel inside each text line box. The worst pixel is shown here; the probe also prints p99 and median.

  | Viewport | H1 white | H1 accent #6F9BFF | Lead #D5DAE3 | Call button |
  |---|---|---|---|---|
  | 1024×768 | 13.94 | 5.19 | 9.91 | 16.46 |
  | 1280×800 | 13.94 | 5.13 | 9.95 | 17.20 |
  | 1440×900 | 14.00 | 5.13 | 9.84 | 16.08 |
  | 1920×1080 | 13.61 | 5.05 | 9.80 | 17.03 |
  | 2560×1440 | 13.56 | 5.04 | 10.24 | 13.79 |
  | 768×1024 | 19.54 | 7.27 | 13.93 | 15.59 |

  - The first scrim (.80, solid only to +700px) measured the accent at 4.30:1 at 1440 and 3.38:1 at 2560, so the solid stop was moved to +760px at .86.
  - The eyebrow is a white pill with `--ink-2` text on its own ground.

### Gates (run from the repo root; output verbatim)

`npx tsc --noEmit; echo "tsc exit=$?"; npx eslint src/components/review/variant-c; echo "eslint exit=$?"`
```
tsc exit=0
eslint exit=0
```

`node workflow/homepage/scripts/density.mjs c http://127.0.0.1:3419` (every row at 1536, 1440, 1280 and 390 @2x is ` ok `). The 1440 and 390 blocks and the last line:
```
--- c 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg sizes="(max-width: 519px) 467px, (max-width: 640px) 90vw, (max-width: 720px) calc(100vw - 64px), (max-width: 1100px) 180vw, (max-aspect-ratio: 8/5) 125vw, (max-aspect-ratio: 2/1) 113vw, 100vw"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  375 need  750 served 1086 (req w=0, file 1086) 1.45 work-used-car-event.webp sizes=""
 ok  box  400 need  800 served 1122 (req w=0, file 1122) 1.40 work-wholesale-public.webp sizes=""
 ok  box  340 need  680 served 1090 (req w=0, file 1090) 1.60 work-meta-inventory.webp sizes=""
 ok  box  320 need  640 served  963 (req w=0, file 963) 1.50 work-google-vla.webp sizes=""
 ok  box  620 need 1240 served 1248 (req w=1920, file 1248) 1.01 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 56px), 620px"
 ok  box  120 need  240 served  256 (req w=256, file 1254) 1.07 bdc-logo-2026.png sizes="120px"
--- c 390px @2x
 ok  box  350 need  700 served 1080 (req w=1080, file 3840) 1.54 photo-night-showroom-retouched.jpg sizes="(max-width: 519px) 467px, (max-width: 640px) 90vw, (max-width: 720px) calc(100vw - 64px), (max-width: 1100px) 180vw, (max-aspect-ratio: 8/5) 125vw, (max-aspect-ratio: 2/1) 113vw, 100vw"
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-luxury-campaign.webp sizes=""
 ok  box  238 need  476 served 1086 (req w=0, file 1086) 2.28 work-used-car-event.webp sizes=""
 ok  box  254 need  508 served 1122 (req w=0, file 1122) 2.21 work-wholesale-public.webp sizes=""
 ok  box  254 need  508 served 1090 (req w=0, file 1090) 2.15 work-meta-inventory.webp sizes=""
 ok  box  254 need  508 served  963 (req w=0, file 963) 1.90 work-google-vla.webp sizes=""
 ok  box  334 need  668 served  750 (req w=750, file 1248) 1.12 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 56px), 620px"
 ok  box  120 need  240 served  256 (req w=256, file 1254) 1.07 bdc-logo-2026.png sizes="120px"

0 soft image render(s)
```
The density gate measures the element box (1440). The cover-fit render is 1627px, which needs 3254 at @2x, and 3840 is served.

**Live-DOM probe** (`probe3.cjs`, with every FAQ answer opened; the hero columns are x, y, w, h):
```
{"vp":"320x844","overflow":0,"docH":15880,"h1":1,"skips":0,"sections":13,"small":[],"hero":[20,88,280,240],"photoBottom":328,"cardBottom":1303,"photoPct":null,"grounds":[]}
{"vp":"390x844","overflow":0,"docH":14598,"h1":1,"skips":0,"sections":13,"small":[],"hero":[20,88,350,240],"photoBottom":328,"cardBottom":1101,"photoPct":null,"grounds":[]}
{"vp":"768x1024","overflow":0,"docH":14323,"h1":1,"skips":0,"sections":13,"small":[],"hero":[0,505,768,460],"photoBottom":965,"cardBottom":1152,"photoPct":37.6,"grounds":[]}
{"vp":"1024x768","overflow":0,"docH":13766,"h1":1,"skips":0,"sections":13,"small":[],"hero":[0,0,1024,681],"photoBottom":681,"cardBottom":844,"photoPct":69.7,"grounds":[]}
{"vp":"1280x800","overflow":0,"docH":10863,"h1":1,"skips":0,"sections":13,"small":[],"hero":[0,0,1280,736],"photoBottom":736,"cardBottom":793,"photoPct":73.9,"grounds":[]}
{"vp":"1440x900","overflow":0,"docH":10963,"h1":1,"skips":0,"sections":13,"small":[],"hero":[0,0,1440,836],"photoBottom":836,"cardBottom":893,"photoPct":78.6,"grounds":[]}
{"vp":"2560x1440","overflow":0,"docH":12236,"h1":1,"skips":0,"sections":13,"small":[],"hero":[0,0,2560,1376],"photoBottom":1376,"cardBottom":1437,"photoPct":90,"grounds":[]}
```

- **Page heights** from capture.mjs, with the FAQ closed as it ships:

  | Viewport | Height |
  |---|---|
  | 390 | 14,102 (was 14,731 in r2 with the FAQ open; 14,598 open now) |
  | 1440 | 10,654 |
  | 2560 | 11,885 |

- Every capture.mjs run reported `"broken":[],"overflowX":0,"pageErrors":[]`.

### Screenshots (r3)

- `workflow/homepage/c3/shots/c/r3-1440-full.png`
- `workflow/homepage/c3/shots/c/r3-1440-fold-dpr2.png`
- `workflow/homepage/c3/shots/c/r3-2560-full.png`
- `workflow/homepage/c3/shots/c/r3-390-full.png` (DPR 2)
- Section crops and tablet folds are in `scratchpad/c3/fix3c/`:
  - `proof-1440.png`, `pricing-1440.png` and `audit-1440.png`
  - `w2560-fold.png`, `t1024-fold.png` and `t768-fold.png`
  - `m390-00.png` and `m390-final.png`

### Not changed, with reasons

1. **The hero accent is #6F9BFF, not #0059FC.** On the night photo the logo blue measures about 3.6:1. That passes the large-text AA floor, but it misses the ≥4.5:1 this round asks for. #0059FC stays on every fill: the CTAs, the step-03 node and the gap node.
2. **≤720 hero layout is unchanged.** The owner-lens finding named 1440 and 2560. On phones, the 240px photo card above the text keeps the H1 and lead on white and avoids adding height. The 390 page is 14,102px.
3. **The consent banner** still appears in every capture. This is the known dev-server hydration quirk.

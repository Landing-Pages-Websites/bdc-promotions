# Direction D · Nightfall: port notes

- **Route:** `/variant-d`
- **Component:** `VariantD` in `src/components/review/variant-d/`
- **Reference:** the palette-passed prototype `scratchpad/c3/proto-nightfall/index.html`. The pre-pass file is backed up as `index.pre-palette.html`.
- **Worktree:** `BDC promotions c3`, on branch `review/homepage-c3-2026-09-24`. No git writes were made and the dev server was not touched.

## Result

The route reproduces the palette-passed prototype at every width I measured: 320, 390, 1024, 1280, 1440 and 2560.

- **DOM check.** `compare.mjs` matches every text-bearing element and every image by its own text or alt: 245 at desktop and 230 at mobile. Page heights are identical (1440: 11,583; 390: 14,981; 2560: 12,535; 1024: 12,087; 1280: 11,467; 320: 15,886), and no text box moves by more than 0.25px.
- **Links, labels, ids and headings.** All 162 links, ARIA labels, alts, ids and headings match one for one (`attrs.mjs`).
- **Pixel check.** Band diffs are exactly 0 outside the photographs, the logo edges and two arrow rows. See "Differences left" below.

## Sections: 13, plus the header and footer

| # | Section | id | Ground | File |
|---|---|---|---|---|
| 1 | Hero: H1, lede, audit CTA and call, offer line, and the Fast/Focused/Social/Results pillar rail on the night-showroom photo | `top` | night photo | `Hero.tsx` |
| 2 | Positioning statement and three proof lines | `about` | white | `Hero.tsx` |
| 3 | The Appointment Gap funnel, drawn in HTML/CSS, with two notes and CTAs | `gap` | tint | `Gap.tsx` |
| 4 | Featured work: the luxury ad in feed chrome, with the case and its spec | `work` | night | `Work.tsx` |
| 5 | Work gallery: event and wholesale posts, plus the Meta and VLA duo plate | `gallery` | night | `Work.tsx` |
| 6 | Services: 01 with the illustrative photo, then 02–05 as ruled rows | `services` | white | `Services.tsx` |
| 7 | Process: five steps on a track, with the follow-up bracket | `path` | tint | `Path.tsx` |
| 8 | Follow-up diagram: Lead, then BDC staff or AI-supported tools, then Appointment | `follow-up` | tint | `Path.tsx` |
| 9 | Pricing: the connected-plan night card, three ruled plans and two assurances | `pricing` | white | `Pricing.tsx` |
| 10 | Proof standard: three evidence rows and the standards inset | `proof` | white | `Pricing.tsx` |
| 11 | Free audit: the consultation photo and three step cards | `audit` | tint | `Close.tsx` |
| 12 | FAQ: sticky head and six `<details>` cards | `faq` | white | `Close.tsx` |
| 13 | Close: night CTA card with the recap | `contact` | white | `Close.tsx` |

`Chrome.tsx` holds the fixed night header, the footer (which carries the illustrative-photo disclosure) and the fixed mobile bar, which sits inside the wrapper.

## Palette pass (§1), on the prototype first

The pass was scripted in `scratchpad/c3/proto-nightfall/palette.py`, which reads `index.pre-palette.html` and writes `index.html`. It exits if any mapping is missing. Afterwards no warm hex values remain.

| Token | Before | After |
|---|---|---|
| `--paper` | #FAF9F7 | **#FFFFFF** |
| `--sand` (section tint) | #F2EFE9 | #F5F7FA |
| `--card` | #FFFFFF | #FFFFFF |
| `--line` / `--line-2` | #E7E3DC / #D6D0C6 | #E6E8EE / #D3D8E1 |
| `--ink` / `--ink-2` / `--ink-3` | #171614 / #5E5A53 / #6B665E | #0B1220 / #4A5263 / #6B7280 |
| `--night` / `--n1` / `--n2` | #0E0F12 / #16181C / #1D2025 | #0C0F15 / #151920 / #1C2029 |
| `--nline` / `--nline-2` | rgba(242,238,230,.1/.2) | rgba(255,255,255,.1/.2) |
| `--ntx` / `--ntx-2` / `--ntx-3` | #F3F0EA / #B7B2A9 / #9A958D | **#FFFFFF** / **#B4BCCB** / #8F98A8 |
| `--amber` (fills) | #F4A83A | `--blue` **#0059FC** |
| hover | #FFB852 | `--blue-hover` #0047CC |
| `--amber-ink` (text on accent) | #17100A | `--on-blue` #FFFFFF |
| `--amber-tx` (accent text on light) | #955509 | `--blue-tx` #0059FC |
| blue text on night (new) | — | `--blue-nt` #6F9BFF: H1 accent, night numerals and link arrows, plan "+", recap checks, night focus ring |
| tint (new) | — | `--blue-tint` #EEF3FF, used on the open FAQ toggle |
| `--red` (funnel strike-through) | #C8373E | #0059FC, per PORT ("red accent → blue") |

The remaining literal colours were moved to cool neutrals:

- **Funnel grey bands:** #E1E5EC, #CFD5DF and #BDC4D1.
- **Funnel blue bands:** #C4D6FE, #7EA6FE and #0059FC.
- **Positioning dim span:** #848B98.
- **Hero label and lede:** #D0D6E0 and #CDD3DD.
- **Tag text:** #E3E8F0.
- **Feed chrome:** #191C23, #232730 and #1D2129.
- **FAQ open border:** #BFD2FF.
- **Dashed assurance border:** #C6CCD7.
- **Diagram strokes:** #8A93A3 grey and #0059FC blue.
- **Appointment-node sub text on blue:** #E8EEFF, 4.7:1.

The creatives, the photographs and the logo are untouched.

**Contrast.** `check.mjs` ran on the palette-passed prototype at 320, 390, 768, 1024, 1100, 1280, 1440 and 2560.

- `lowText: []` at every width. The lowest pairing is the positioning dim span at 3.43:1, which is text of 26px or more and needs 3:1.
- Text on the photo, worst case:

  | Text | Worst ratio | Needs |
  |---|---|---|
  | H1 accent #6F9BFF | 3.25 at 2560 | 3 |
  | Label | ≥11.2 | 4.5 |
  | Lede | ≥9.7 | 4.5 |
  | Offer | ≥6.1 | 4.5 |
  | Pillars | ≥9.4 | 4.5 |

- #0059FC would have failed as the H1 accent on the photo, at about 1.6:1. That is why the accent uses the same-hue tint.

**Recapture:**

- `psyche/screens/bdc-c3-nightfall-blue/`
- `proto-nightfall/shots/blue-2560-full.png`
- `blue-1440-full.png`, `blue-390-full.png` and `blue-1440-fold-dpr2.png`, captured with `capture.mjs` so they match the route captures.

## Port (§2): files

`src/components/review/variant-d/`, 1,338 lines in all, with the largest file at 139 lines:

- `VariantD.tsx`: the root. It loads Geist through `next/font/google` as `--font-nf` on the wrapper and composes the 13 sections plus the chrome.
- `base.module.css`: the tokens on `.root`, zero-specificity resets, type, controls, section grounds and per-section padding classes.
- `Chrome.tsx` + `chrome.module.css`: header, footer, mobile bar and the logo crop.
- `Hero.tsx` + `hero.module.css`: sections 1–2.
- `Gap.tsx` + `gap.module.css`: section 3.
- `Work.tsx` + `work.module.css`: sections 4–5.
- `Services.tsx` + `services.module.css`: section 6.
- `Path.tsx` + `path.module.css`: sections 7–8.
- `Pricing.tsx` + `pricing.module.css`: sections 9–10.
- `Close.tsx` + `close.module.css`: sections 11–13.
- `ui.tsx`: the `Check` icon and the nav list.

The placeholder `VariantD.tsx` was replaced, and there are no other files in the folder.

**Content wiring:**

- `auditHref`, `phoneHref` and `phoneDisplay` come from `../content`.
- `growthSteps` drives the process steps.
- `serviceOptions` drives the three plan rows, the connected-plan card (price split into "$5,000" and "/ month") and its chips.
- `faqItems` supplies:
  - the follow-up lede, from `[2]`;
  - the two assurance cards, from `[3]` and `[0]`;
  - FAQ card 4, from `[1]`.
- Every other string is the prototype's verified copy, verbatim. All 245 text runs match the prototype exactly.

### Port decisions a reviewer should know

1. **Specificity.** The root layout loads Tailwind preflight and `globals.css`, which includes `h2,h3 { font-family: display; font-weight: 700 }` and `a { text-decoration: none }`.
   - My resets use `:where(.root) :where(…)`, with zero specificity, like the prototype's element selectors, so every class wins.
   - Headings get `font-family: inherit`.
   - FAQ answer links set `text-decoration: underline` explicitly.
   - Each section gets exactly one padding class (`sec`, `pairA`, `pairB`, `workA`, `workB` or `flushTop`).
   - Any rule that overrides a base class is written as a two-class selector (for example `.hero .kicker`), so nothing depends on the order CSS chunks load in.
2. **Logo.** The prototype used a trimmed copy. The port renders `/images/design/shared/bdc-logo-2026.png` inside a 1213:574 crop box. The image sits at 103.38% width with offsets of −1.731% and −8.739%, which is the prototype's crop of (21,106) to (1234,680). The visible logo matches, and the `<img>` box is intentionally larger than the crop.
3. **The → glyph.** Geist's latin subset has no U+2192. The prototype drew → from the system face. next/font's metric-adjusted "Geist Fallback" (Arial at 104.76%) made every arrow 2.6px wider, so `.arr` and `.link span` name the system stack. `adjustFontFallback: false` was tried and had no effect under Turbopack.
4. **Optimised image ratio.** The optimiser rounds the height of resized images (640w gives 427px), which moved later content by 0.3px. The two /lp photos therefore pin `aspect-ratio: 3/2`, and the logo pins 1254/749.
5. **Smooth scrolling.** `globals.css` sets `html { scroll-behavior: smooth }`. The prototype had removed it (its defect 9). With it, scripted scrolls never reach the lazy images, and the kit capture showed blank /lp photos and a blank wholesale post. `html:has(.root) { scroll-behavior: auto }` scopes the opt-out to this page. The root cause was confirmed with `lazyprobe.mjs`: before the fix both /lp photos stayed `complete:false` after the scroll, and after it every image loads.
6. **Mobile bar z-index is 40, not 60.** The layout's consent banner is fixed at z-50. At 60 the bar covered the banner's "Got it" and "Decline" buttons on mobile. At 40 the bar still sits above all page content.
7. **Skip link.** The prototype's own "Skip to content" link was dropped, because the root layout already renders "Skip to main content" to `#main-content`.
8. **Hero `sizes`.** The value is `(max-width: 720px) 156vw, max(100vw, 195vh)`, which gives the cover-scaled width. Chromium parses the `max()`: at 1100×900 DPR1 it picks w=1920, where 100vw would have picked 1200. Density at 390@2x picks 1920 for a 1,214px need.

## Gates (§3), verbatim

Density, run as `node workflow/homepage/scripts/density.mjs d http://127.0.0.1:3419` (all rows "ok"; 32 image renders over 1536, 1440, 1280 and 390 @2x):
```
0 soft image render(s)
```

TypeScript, run as `npx tsc --noEmit --incremental false`:
```
tsc exit 0; total errors 0; variant-d errors 0
```
Plain `npx tsc --noEmit` inside the sandbox prints only `TS5033: Could not write file '…/tsconfig.tsbuildinfo': EPERM`. That is a sandbox write refusal, not a type error.

ESLint, run as `npx eslint src/components/review/variant-d`: no output.
```
eslint exit 0
```

Overflow on the live DOM (`route-check.mjs`; `scrollWidth`/`clientWidth`):
```
{"w":320,"scrollWidth":320,"clientWidth":320,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","padBottom":"76px"}
{"w":390,"scrollWidth":390,"clientWidth":390,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","padBottom":"76px"}
{"w":1024,"scrollWidth":1024,"clientWidth":1024,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","padBottom":"0px"}
```
The fields are:

- **`headings`:** the number of skipped heading levels, which is 0.
- **`small`:** interactive targets under 44px, of which there are none.
- **`mbar` / `padBottom`:** the fixed bar at 720px and below, with matching bottom padding on the wrapper.

At 1100, 1440 and 2560 overflow is also 0.

DOM fidelity, run as `compare.mjs proto route`:
```
== 1440x900  height proto 11583 route 11583  overflow proto 0 route 0
summary: 245 proto items, unmatched 0, geometry diffs 4, style diffs 9, route-only 4
== 390x844  height proto 14981 route 14981  overflow proto 0 route 0
summary: 230 proto items, unmatched 0, geometry diffs 4, style diffs 8, route-only 4
== 2560x1440  height proto 12535 route 12535  overflow proto 0 route 0
summary: 245 proto items, unmatched 0, geometry diffs 4, style diffs 9, route-only 4
```
- **Geometry diffs:** the two logo `<img>` boxes, which are larger than their crop box (decision 2), and the next element after each.
- **Style diffs:** the → spans' declared font family (decision 3).
- **Route-only items:** the layout's consent banner.

## Screenshots

**Kit (route):** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-d/`, containing:

- `desktop-full.png`, `desktop-fold.png`
- `laptop-full.png`, `laptop-fold.png`
- `mobile-full.png`, `mobile-fold.png`

All images are loaded in the final run.

**Route shots:** `workflow/homepage/c3/shots/d/`

- `2560-full.png`
- `1440-fold-dpr2.png` (the fold at DPR 2, 2880×1800)
- `1440-full.png`
- `390-full.png`

**Prototype (palette-passed):**

- `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-nightfall-blue/`
- `scratchpad/c3/proto-nightfall/shots/blue-2560-full.png`, `blue-1440-full.png`, `blue-390-full.png` and `blue-1440-fold-dpr2.png`

**Band diffs:** `scratchpad/c3/proto-nightfall/shots/diff-{1440,390,2560,fold,kit-*}/` holds the side-by-side band images. The figures are in `banddiff-final.txt`.

## Differences left, with reasons

| Where | Size | Reason |
|---|---|---|
| Hero photo, all widths | band 0, mean 19–22 (1440/390); 1.4 at 2560 | PORT mandates `photo-night-showroom-retouched.jpg`. The prototype still points at the pre-retouch `assets/photo-night-showroom.jpg`, so the badge, display wall and fused-sedan retouches show as differences. The optimiser also re-encodes the photo at q75. |
| Consent banner | fold and full captures | It belongs to the root layout, not the port. PORT accepts it. |
| Wholesale creative | mean 0.25 | The port serves `work-wholesale-public.webp`, as PORT specifies; the prototype used `ad-wholesale-public.png`. The pixels are the same apart from encoding. |
| Services and audit photos | mean <0.5 | These are `next/image` optimised renditions (webp at q75) of the same files. Their geometry is identical. |
| Logo edges | 0.07–0.16 | The optimiser's 256/384w rendition versus the browser downscaling the prototype's trimmed PNG. The crop and position are identical. |
| → rows in two CTAs | <0.01% of pixels | Rasterisation of the system-font arrow. |
| Mobile bar vs consent banner | mobile fold | Deliberate (decision 6): the banner now sits above the bar until it is dismissed. |

**Carried from the prototype for the owner to decide.** None of these were changed in the port.

- The funnel strike-through is now blue, per PORT's "red → blue" rule. It reads as a strike in the full-size captures. A neutral grey would separate "negative" from the accent more clearly.
- The connected plan is emphasised by composition only.
- The Meta and VLA sources are soft at their crisp widths.

## Scripts

All are in `scratchpad/c3/proto-nightfall/`:

- `palette.py`: the palette pass.
- `compare.mjs`: the DOM fidelity diff.
- `banddiff.py`: the band pixel diff.
- `route-check.mjs`: the live-DOM gates.
- `attrs.mjs`: the link, label and id diff.
- `lazyprobe.mjs`: the lazy-image probe.
- `check.mjs`: the prototype contrast check.

## Fix round 1 (critic round 1, 2026-09-24)

The route now deliberately diverges from the prototype wherever the critique or PORT §4 required it. The prototype file was not changed.

### Sections: still 13, plus header and footer

Work and Gallery were merged into one section (D-1). A new "Who it's for" section was added to keep the count at 13.

| # | Section | id | Ground | Opener |
|---|---|---|---|---|
| 1 | Hero | `top` | night photo | — |
| 2 | Positioning | `about` | white | label + one-colour statement |
| 3 | Appointment Gap | `gap` | tint | centred head |
| 4 | Work: featured case + gallery (`#gallery` anchor kept) | `work` | night | plate left, head + lede + case right |
| 5 | Services | `services` | white | split head + card |
| 6 | Process | `path` | tint | **centred head; timeline straight on the band, no card** |
| 7 | Follow-up | `follow-up` | tint | **5/7 split: sticky head left, diagram right, no card** (≥1241) |
| 8 | Pricing | `pricing` | white | wide head |
| 9 | Proof standard | `proof` | white | **64 → hairline → 64 below Pricing** |
| 10 | Free audit | `audit` | tint | **620px photo in cols 1–6; head + ruled steps in 7–12, no cards** |
| 11 | Who it's for (FAQ items 1–3, "Before you request your audit") | `fit` | tint | hairline, head, 4/4/4 ruled grid |
| 12 | FAQ (3 remaining items) | `faq` | white | sticky head |
| 13 | Close | `contact` | white / night card | — |

### What changed, by finding

- **Photo chips and disclosure (§4.1).**
  - All three "Illustrative photograph" chips are gone (hero, services, audit), and the `.tag` class was deleted.
  - The footer legal row now carries exactly `Photographs are illustrative and do not show a BDC Promotions client or location.`
  - New alts: services is `A videographer filming vehicles through a showroom window at night`; audit is `Two people reviewing a marketing dashboard on a laptop at a conference table`; the hero is `Night view of a glass-fronted dealership showroom with vehicles lit inside` (the word "Illustrative" was dropped).
- **Guardrail lines (§4.2).** The three "Proof with standards" rules and their inset were deleted. Proof keeps its head, lede and the three evidence rows.
- **Sentence case (§4.3).**
  - 8 CTAs now read `Get my free dealership audit` (×4), `Request my free consultation`, `See what your marketing is missing` and `Start my free audit`.
  - The footer reads `Privacy policy` and `Cookie policy`.
  - The gallery titles read `Massive used car sales event` and `Wholesale to the public`, and the case H3 reads `“We make luxury affordable”`.
  - Product names from `content.ts` (for example "Lead Generation") are proper names, so they were left unchanged.
- **Accent (§4.5).** Only `qualified` is blue now, not "qualified showroom appointments".
- **D-1: one Work head.** The "Our work" head was deleted. The range line is now the lede under the H2 (max 560px), and the gallery starts 64px below the plate. The Piece/Category spec list was dropped; the category is now a 15px caption under the H3.
- **D-2: gap graphic.**
  - The drip dots (`.bl::after`) and the plumb line with its knob (`.axis`) were deleted.
  - Struck items are now 17px `--ink-2` with a 1px #9AA2B1 strike.
  - Both notes are left-aligned and mirrored about the funnel's centre line (two 440px columns, centred).
- **D-3.** The `.dim` span was deleted, so the whole statement is `--ink`.
- **Feed-post chrome (the "Sponsored" device is kept).**
  - The skeleton bars are replaced by a 13px/500 white label (`Luxury campaign` or `Event campaigns`) with `Sponsored` under it.
  - The footer now shows the format fact (`4:5 · Feed post` or `3:4 · Feed post`, from the real source ratios) in #8F98A8.
  - `Send message` is now flat #B4BCCB text with no border.
  - The empty avatar ring became a filled disc with one neutral storefront glyph (the same placeholder class).
  - At ≤360 the format fact and the "···" glyph are hidden, so nothing wraps or clips.
- **Follow-up diagram.** All four node icons are removed, including the ✨, and so are the 12 hollow port dots and the "Nurture" bracket. Node borders use `--line-2` so the white nodes hold on the tint.
- **Path.** The "Follow-up ↓" bracket box is gone and the label sits under step 04. The rail runs the full container and is blue from node 04 onward. At ≤1100 the vertical rail is also blue from 04 onward.
- **Pricing.**
  - The dashed Q&A boxes became notes with a 2px blue left rule and no box.
  - At ≤720 the chips are left-aligned flex.
  - At ≤900 the plan rows no longer stretch to equal heights, which removes the empty band above "Luxury Video".
- **Close.** The recap is no longer a card in a card. It has a left rule on ≥1025 and a top rule below.
- **2560.**
  - The hero is `clamp(760px, 100svh, 1440px)` at ≥1800, so the photo owns the whole 1440 fold.
  - The services photo track is `min(620px, 50% − 12px)` with `justify-self: end`, which removes the 88px strip. The row descriptions are `min(580px, 50% − 12px)`, so they still start under the photo's left edge.
  - The audit photo is 620px at every desktop width, with `sizes` updated.
- **Imagery.** Meta is capped at 400px and VLA at 380px.
- **Mobile (V212).**
  - The menu is now a full-width sheet hung off the header, with 52px rows, a `Close` state (the icon becomes an X) and a 52px blue `Free audit` button last.
  - A small client component (`Menu.tsx`) closes the sheet when one of its links is followed.
  - Meta and VLA stack at ≤720, and the event tiles are 78% wide.

### Deliberately not changed, and why

1. **Services crop to 4:3 with `object-position: 18% 50%`.** Measured on the 1248×832 source, the grey SUV spans x ≈ 63–100%. A 4:3 crop of a 3:2 frame removes only 11% of the width (2% left, 9% right), so the SUV stays in frame. At a 619px box the cover-scaled source would also render at about 696 CSS px, over the 620 crisp limit (BRIEF V207; the density gate measures the box, not the cover scale, so it would not catch this). The only crop that removes the SUV (x 0–61%) is about 380×413 at crisp scale. That would put a ~300px empty strip inside the card, which is the same defect as the 88px strip. The photo is unchanged, and the SUV repeat is recorded as an owner-level imagery risk, like the camera-facing laptop in the audit photo.
2. **Accent colour #6F9BFF, not #0059FC.** On the photo, #0059FC measures about 1.6:1 (see the palette section above), which is a CORRECTNESS failure. With the accent on `qualified` only, the tint now passes with margin (the numbers are below).
3. **Node labels "Lead", "BDC staff" and "AI-supported tools"** are unchanged. They need owner sign-off, as the critic noted.
4. **Section labels in source Title Case** ("How The Free Audit Works", "Our Proof Standard"). These strings are verbatim from VERIFIED-COPY, and they always render uppercase through `.label`, so no Title Case is visible.
5. **The kit's "9 distinct font sizes" flag** is unchanged from r1. The route uses the 7-step ramp; the extra sizes come from the layout's consent banner and the per-breakpoint ramp.
6. **Close-on-link in the menu could not be verified live.** In this headless dev setup, no route hydrates its client components: variant-a's `ExploreWork` is also unhydrated, and only hoisted `<link>` nodes carry React fibers, even after 20s. The HMR websocket fails and review-bridge.js is blocked by CORS; both come from shared layout/infra, not this folder. Without hydration the sheet still opens and closes natively through `<details>`/`<summary>`. The only thing missing is the auto-close after an in-page jump.

### Gates, verbatim

Density: `node workflow/homepage/scripts/density.mjs d http://127.0.0.1:3419` (exit 0). The per-row `sizes=` column is trimmed here.
```
--- d 1536px @2x
 ok  box 1536 need 3072 served 3840 (req w=3840, file 3840) 1.25 photo-night-showroom-retouched.jpg
 ok  box  378 need  756 served 1122 (req w=0, file 1122) 1.48 work-luxury-campaign.webp
 ok  box  322 need  644 served 1086 (req w=0, file 1086) 1.69 work-used-car-event.webp
 ok  box  344 need  688 served 1122 (req w=0, file 1122) 1.63 work-wholesale-public.webp
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp
 ok  box  619 need 1238 served 1248 (req w=1920, file 1248) 1.01 bdc-inventory-production.webp
 ok  box  620 need 1240 served 1248 (req w=1920, file 1248) 1.01 bdc-audit-consultation.webp
--- d 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg
 ok  box  378 need  756 served 1122 (req w=0, file 1122) 1.48 work-luxury-campaign.webp
 ok  box  322 need  644 served 1086 (req w=0, file 1086) 1.69 work-used-car-event.webp
 ok  box  344 need  688 served 1122 (req w=0, file 1122) 1.63 work-wholesale-public.webp
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp
 ok  box  619 need 1238 served 1248 (req w=1920, file 1248) 1.01 bdc-inventory-production.webp
 ok  box  620 need 1240 served 1248 (req w=1920, file 1248) 1.01 bdc-audit-consultation.webp
--- d 1280px @2x
 ok  box 1280 need 2560 served 3840 (req w=3840, file 3840) 1.50 photo-night-showroom-retouched.jpg
 ok  box  378 need  756 served 1122 (req w=0, file 1122) 1.48 work-luxury-campaign.webp
 ok  box  322 need  644 served 1086 (req w=0, file 1086) 1.69 work-used-car-event.webp
 ok  box  344 need  688 served 1122 (req w=0, file 1122) 1.63 work-wholesale-public.webp
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp
 ok  box  579 need 1158 served 1248 (req w=1920, file 1248) 1.08 bdc-inventory-production.webp
 ok  box  588 need 1176 served 1200 (req w=1200, file 1248) 1.02 bdc-audit-consultation.webp
--- d 390px @2x
 ok  box  390 need  780 served 1920 (req w=1920, file 3840) 2.46 photo-night-showroom-retouched.jpg
 ok  box  278 need  556 served 1122 (req w=0, file 1122) 2.02 work-luxury-campaign.webp
 ok  box  245 need  490 served 1086 (req w=0, file 1086) 2.22 work-used-car-event.webp
 ok  box  245 need  490 served 1122 (req w=0, file 1122) 2.29 work-wholesale-public.webp
 ok  box  316 need  632 served 1090 (req w=0, file 1090) 1.72 work-meta-inventory.webp
 ok  box  316 need  632 served  963 (req w=0, file 963) 1.52 work-google-vla.webp
 ok  box  336 need  672 served  750 (req w=750, file 1248) 1.12 bdc-inventory-production.webp
 ok  box  350 need  700 served  750 (req w=750, file 1248) 1.07 bdc-audit-consultation.webp

0 soft image render(s)
```

TypeScript: `npx tsc --noEmit --incremental false`
```
tsc exit 0; total errors 0; variant-d errors 0
```

ESLint: `npx eslint src/components/review/variant-d`
```
eslint exit 0
```

Live DOM: `node scratchpad/c3/proto-nightfall/route-check.mjs http://127.0.0.1:3419/variant-d`
```
{"w":320,"scrollWidth":320,"clientWidth":320,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","padBottom":"76px"}
{"w":390,"scrollWidth":390,"clientWidth":390,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","padBottom":"76px"}
{"w":1024,"scrollWidth":1024,"clientWidth":1024,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","padBottom":"0px"}
{"w":1100,"scrollWidth":1100,"clientWidth":1100,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","padBottom":"0px"}
{"w":1440,"scrollWidth":1440,"clientWidth":1440,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","padBottom":"0px"}
{"w":2560,"scrollWidth":2560,"clientWidth":2560,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"3840","small":[],"mbar":"static","padBottom":"0px"}
```

H1 contrast, glyph-pixel method (text on vs text hidden, DPR 1, consent banner hidden): `node scratchpad/c3/fix-d/probe.cjs`
```
1280 {"accent":{"n":6220,"p1":5.13,"p5":6.61,"worst":2.84},"h1":{"n":37995,"p1":5.63,"p5":10.98,"worst":2.8}}
1440 {"accent":{"n":6218,"p1":5.93,"p5":6.56,"worst":3.52},"h1":{"n":37951,"p1":5.83,"p5":9.82,"worst":2.7}}
2560 {"accent":{"n":8405,"p1":3.79,"p5":5.4,"worst":2.47},"h1":{"n":51377,"p1":13.59,"p5":16.47,"worst":6.65}}
390 {"accent":{"n":2127,"p1":7.45,"p5":7.45,"worst":7.45},"h1":{"n":12815,"p1":20.04,"p5":20.04,"worst":19.92}}
320 {"menu":[0,320,417],"summary":"Close","closesOnLink":false}
320 post footers ["Send message in","Send message in"]
390 {"menu":[0,390,417],"summary":"Close","closesOnLink":false}
390 post footers ["3:4 · Feed post in","Send message in","4:5 · Feed post in","Send message in"]
```
- **Accent p5.** It was 2.96 at 1440 and 2.99 at 1280 in r1. It is now 6.56 and 6.61, and 5.4 at 2560. The accent is large text, so it needs 3:1.
- **Worst-pixel values** are antialiased glyph edges.
- **Menu.** The sheet spans the full viewport width and its summary reads "Close". `closesOnLink:false` is the hydration limit in "Deliberately not changed" item 6.
- **Post footers.** No post footer is clipped at 320 or 390.

### Screenshots (fix round 1)

- **Kit:** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-d-fix1/`, containing `desktop-*`, `laptop-*` and `mobile-*` full and fold captures.
- **2560:** `workflow/homepage/c3/shots/d/fix1-2560-full.png` (2560×12512, overflowX 0, no broken images).
- **1440 fold @2x:** `workflow/homepage/c3/shots/d/fix1-1440-fold-dpr2.png`.
- **Review bands and probe shots:** `scratchpad/c3/fix-d/`, containing:
  - `d1440/`, `d2560/` and `m390/` bands;
  - `l1280-*.jpg`;
  - `m320-menu.png`, `m390-menu.png`, `m320-gallery.png` and `m390-gallery.png`.

## Fix round 2 (critic round 2, 2026-09-24)

### Sections: still 13, plus header and footer (new order)

Hero (night photo) · Positioning (white) · Gap (tint) · Work (night) · Services (white) · Process (tint) · Follow-up (tint) · **Who it's for (tint, moved up from after Audit)** · Pricing (white) · Proof (white, ruled) · Audit (tint) · FAQ (white) · Close (night card).

The end of the page no longer runs Fit → FAQ as back-to-back Q&A. Process, Follow-up and Fit now share one tint run: Follow-up uses the new `pairMid` padding (64 above, 0 below), and Fit's hairline separates the two. Audit now takes the standard `sec` padding.

### What changed, by finding

- **AI photo 1: audit consultation.** The `<figure>`, the photo and the "Inside a free audit consultation" caption are deleted. Audit is now a 5/7 split. Columns 1–5 hold the label, the H2, the lede and the single "Start my free audit" button. Columns 7–12 hold the three steps as ruled rows, led by 48px Geist 500 numerals in #0059FC (56px at ≥1800, 24px at ≤720). The 24px inset and the 234px empty strip are gone with it.
- **AI photo 2: services.** The photo is dropped, which was the critic's alternative. I tried the prescribed 1:1 crop at `object-position: 0 50%` (`fix-d/crop-sq0.png`). It still contains the half-cut person, the blue sedan, the glass wall and the garbled AI camera rig (`crop-operator-100.png` at 100%), so it would still read as the hero showroom again.
  - 01 is now a ruled row like 02–05, and its button pair went with it.
  - Services is a five-row table in one card. The description column is `calc(50% − 12px)` of the row, so it starts exactly under the head's lede on column 7 at every desktop width.
  - The page now carries no /lp photograph. The only photograph is the hero, plus the client's ads.
- **Icon on every line.** The Positioning ticks and the Close recap checks are removed; both lists are plain ruled rows. The `Check` component is deleted from `ui.tsx`.
- **Hero at ≥1800.**
  - `.inner { margin-block: auto }` centres the copy block in the space above the pillar rail, which stays on the bottom edge. At 2560 the kicker is at y≈418 (it was ≈640).
  - The left veil stops are lowered from .94/.86 to .82/.70, with the 50% and 70% stops eased to .45 and .06.
- **Work at 2560.** The ≥1800 `.featPlate { max-width: 640px }` rule is deleted, so the featured panel spans 708px, flush with the panels below.
- **Work, landscape formats.** The single Meta + VLA plate is now two panels in the same 2-column grid as the event posts: padding 48/40, images at 400/380, captions under the panels. The duo row sits `var(--s-tight)` (64 at 1440) below the event captions, where the gap was 24.
- **Feed frames.** The invented page names ("Luxury campaign", "Event campaigns") and the "Send message" text are removed. The frame is now the avatar disc, "Sponsored" and "···" on top, with the format fact ("4:5 · Feed post") below. The fact now also stays visible at ≤360, because nothing competes with it.
- **Close.** The recap moves to `grid-column: 8 / -1`. The lede is `max-width: 600px` (700px at ≥1800, where the copy column is wider). The strip between the lede and the recap rule is now ≈76px at 1440 and ≈82px at 2560; it was 233px.
- **Positioning.** Rebuilt as an 8/4 split. The statement is 36px/1.2 (40px at ≥1800) in columns 1–8. The three proof lines are ruled rows in columns 9–12, with "See how the process works →" under them. Section padding is `calc(var(--s-tight) + 8px)`, which gives 72 at 1440 and 80 at 2560.
- **Mobile: 721–744px sideways scroll.** The stacked funnel layout now starts at ≤900 instead of ≤720 (`gap.module.css`). The funnel labels use `text-wrap: balance`, so "work" no longer sits alone at 724. A 4px sweep from 320 to 1920, plus 2560 (`auditD/sweep.mjs`), prints `overflow none`.
- **Mobile: four buttons on the first screen.** The hero Call button is hidden at ≤720, where the fixed bar carries Call.
- **Mobile: 3px white strip.** The `.root` `padding-bottom: 76px` is removed. At ≤720 the footer has `padding-bottom: calc(28px + 73px + env(safe-area-inset-bottom))`, which matches the measured bar height of 73px.
- **Pricing "+".** The "+" and the second chip are wrapped in one `inline-flex` group, so a wrap moves them together. Verified at 320 and 390.
- **Restraint and CTAs.**
  - Removed the button pairs from Gap, Services 01 and the FAQ head.
  - Removed the "Follow-up ↓" `.bracket` link.
  - Beyond the list, and for the same classes of defect:
    - removed Proof's "See what your marketing is missing" button, which repeated the audit CTA one section above Audit's own;
    - removed the case "Explore the work →" link, a jump to `#gallery` 64px below it (the same defect as the bracket).
  - Main content now has 5 audit links at 1440 (hero, pricing, audit, close and the FAQ answer's "the short form"), where the critic counted 11 page-wide. There are 3 phone links in main content (hero, pricing, close), plus the FAQ answer link when it is expanded. The header and footer each keep one of each. Measured on the live DOM at 1440: 6 audit links and 5 phone links are visible page-wide (the critic counted 11 and 9), and `main li svg` finds 0 list icons.
- **Copy.** FAQ "What kinds of creative…" now uses A's verified answer, "Static, event, new-car, employee, luxury, viral, testimonial, inventory, and Google vehicle-listing advertising." (VERIFIED-COPY:383), in place of the build-language "The supplied work covers…".
- **Accent colour.** Changed from #6F9BFF to **#3D7BFF**. See "Deliberately not changed" 1 for why it is not exactly #0059FC.

### Deliberately not changed, and why

1. **The H1 accent is #3D7BFF, not #0059FC.** The critic's premise ("#0059FC measures ~3.5:1") holds on flat #0C0F15, but BRIEF §5 says to measure text on the photo. The glyph-pixel probe (`fix-d/r2/contrast.cjs`: text on vs text hidden, DPR 1, banner hidden) measured #0059FC at p5 **2.97 at 1920 and 2.88 at 2560**, under the 3:1 large-text floor, with p1 1.68. The lighter ≥1800 veil the same critique asked for makes this worse.
   - #3D7BFF is the same hue (≈221° against 219°) and the most saturated step I measured that holds p5 ≥ 4.12 at every width.
   - It reads as the logo blue far more than #6F9BFF did.
   - Numbers are below. The first probe run was invalid: a specificity bug kept the candidate colour visible in the "hidden" frame. It was fixed before these runs.
2. **Diagram labels "Lead", "BDC staff" and "AI-supported tools".** The critic listed these as fragments but gave no fix. They are neutral diagram labels cut from verified sentences (VERIFIED-COPY:220–225), and they stay for the owner to decide.
3. **The Google VLA source's red arrows and blue border** are the owner's call, as the critic said. The deck says every ad is shown whole.
4. **Follow-up is still a short band (≈355px), and there is still no section-change "squiggle" or sample-report mock.** Neither had a prescribed fix. A sample-report mock would be an invented artefact; BRIEF allows no new claims or images.
5. **Font sizes.** The kit reports 10 distinct sizes. They are the 7-step ramp (72/48/28/20/17/15/13), plus the critic-specified 36px statement, plus 14px and 16px from the root layout's Manrope consent banner.
6. **The consent banner still shows in the kit and `capture.mjs` captures.** Both tools belong to the shared kit and repo scripts, which I may not edit. The banner's buttons also do nothing in headless dev, because nothing hydrates (see round 1, item 6). My review shots in `fix-d/r2/` hide it instead.
7. **"Proof then Audit" are both "head left, numbered list right".** The critic prescribed the Audit layout. Audit's 48px blue numerals and its tint ground are what separate the two sections.

### Gates, verbatim

Density: `node workflow/homepage/scripts/density.mjs d http://127.0.0.1:3419`. The per-row `sizes=` column is trimmed here. The two /lp photos are gone, so there are 6 rows per width.
```
--- d 1536px @2x
 ok  box 1536 need 3072 served 3840 (req w=3840, file 3840) 1.25 photo-night-showroom-retouched.jpg
 ok  box  378 need  756 served 1122 (req w=0, file 1122) 1.48 work-luxury-campaign.webp
 ok  box  322 need  644 served 1086 (req w=0, file 1086) 1.69 work-used-car-event.webp
 ok  box  344 need  688 served 1122 (req w=0, file 1122) 1.63 work-wholesale-public.webp
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp
--- d 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg
 ok  box  378 need  756 served 1122 (req w=0, file 1122) 1.48 work-luxury-campaign.webp
 ok  box  322 need  644 served 1086 (req w=0, file 1086) 1.69 work-used-car-event.webp
 ok  box  344 need  688 served 1122 (req w=0, file 1122) 1.63 work-wholesale-public.webp
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp
--- d 1280px @2x
 ok  box 1280 need 2560 served 3840 (req w=3840, file 3840) 1.50 photo-night-showroom-retouched.jpg
 ok  box  378 need  756 served 1122 (req w=0, file 1122) 1.48 work-luxury-campaign.webp
 ok  box  322 need  644 served 1086 (req w=0, file 1086) 1.69 work-used-car-event.webp
 ok  box  344 need  688 served 1122 (req w=0, file 1122) 1.63 work-wholesale-public.webp
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp
--- d 390px @2x
 ok  box  390 need  780 served 1920 (req w=1920, file 3840) 2.46 photo-night-showroom-retouched.jpg
 ok  box  278 need  556 served 1122 (req w=0, file 1122) 2.02 work-luxury-campaign.webp
 ok  box  245 need  490 served 1086 (req w=0, file 1086) 2.22 work-used-car-event.webp
 ok  box  245 need  490 served 1122 (req w=0, file 1122) 2.29 work-wholesale-public.webp
 ok  box  316 need  632 served 1090 (req w=0, file 1090) 1.72 work-meta-inventory.webp
 ok  box  316 need  632 served  963 (req w=0, file 963) 1.52 work-google-vla.webp

0 soft image render(s)
```

TypeScript: `npx tsc --noEmit --incremental false`
```
tsc exit 0; total errors 0; variant-d errors 0
```
(One mid-round run showed `total errors 1; variant-d errors 0`: `src/components/review/variant-c/VariantC.tsx(10,22): error TS2305: Module '"./Audit"' has no exported member 'Who'.` That error was the C builder's work in progress, and it also turned every route into HTTP 500 for a few minutes. The final run above is clean.)

ESLint: `npx eslint src/components/review/variant-d`
```
eslint exit 0
```

Live DOM: `node scratchpad/c3/proto-nightfall/route-check.mjs http://127.0.0.1:3419/variant-d`. It now reports the footer clearance in place of the wrapper padding.
```
{"w":320,"scrollWidth":320,"clientWidth":320,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","mbarH":73,"footPadBottom":"101px"}
{"w":390,"scrollWidth":390,"clientWidth":390,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","mbarH":73,"footPadBottom":"101px"}
{"w":1024,"scrollWidth":1024,"clientWidth":1024,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
{"w":1100,"scrollWidth":1100,"clientWidth":1100,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
{"w":1440,"scrollWidth":1440,"clientWidth":1440,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
{"w":2560,"scrollWidth":2560,"clientWidth":2560,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"3840","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
```

Overflow sweep, every 4px from 320 to 1920 plus 2560: `node scratchpad/auditD/sweep.mjs`
```
overflow none
headerwrap none []
btnwrap none []
```

Hero text contrast on the photo, as shipped (#3D7BFF accent): `node scratchpad/c3/fix-d/r2/contrast.cjs`
```
shipped 1280 {"accent":{"p1":3.59,"p5":4.64,"med":5.16},"h1":{"p1":5.63,"p5":10.98,"med":19.68},"lede":{"p1":9.4,"p5":11.57,"med":13.17},"kicker":{"p1":13.39,"p5":13.41,"med":13.58},"offer":{"p1":12.55,"p5":12.63,"med":13.16},"pillar":{"p1":10.3,"p5":10.31,"med":10.42}}
shipped 1440 {"accent":{"p1":4.16,"p5":4.6,"med":5.16},"h1":{"p1":5.83,"p5":9.82,"med":19.79},"lede":{"p1":9.55,"p5":11.63,"med":13.22},"kicker":{"p1":12.73,"p5":12.85,"med":13.56},"offer":{"p1":12.56,"p5":12.65,"med":13.1},"pillar":{"p1":10.3,"p5":10.31,"med":10.38}}
shipped 1920 {"accent":{"p1":2.44,"p5":4.25,"med":5.14},"h1":{"p1":4.58,"p5":10.58,"med":19.53},"lede":{"p1":10.64,"p5":11.27,"med":13.17},"kicker":{"p1":10.85,"p5":11.1,"med":13.57},"offer":{"p1":10.82,"p5":11.33,"med":13.07},"pillar":{"p1":10.11,"p5":10.12,"med":10.32}}
shipped 2560 {"accent":{"p1":4.08,"p5":4.12,"med":4.78},"h1":{"p1":3.92,"p5":6.92,"med":19},"lede":{"p1":7.04,"p5":10.63,"med":12.82},"kicker":{"p1":5.52,"p5":7,"med":13.43},"offer":{"p1":7.38,"p5":7.96,"med":11.55},"pillar":{"p1":10.24,"p5":10.25,"med":10.31}}
shipped 390 {"accent":{"p1":5.22,"p5":5.22,"med":5.22},"h1":{"p1":20.04,"p5":20.04,"med":20.04},"lede":{"p1":13.32,"p5":13.32,"med":13.32},"kicker":{"p1":12.48,"p5":12.61,"med":13.21},"offer":{"p1":13.32,"p5":13.32,"med":13.32},"pillar":{"n":0,"rects":1}}
```
The candidate logo blue, `node …/contrast.cjs "#0059fc"` (accent only):
```
#0059fc 1280 {"accent":{"p1":2.51,"p5":3.25,"med":3.61}
#0059fc 1440 {"accent":{"p1":2.91,"p5":3.22,"med":3.61}
#0059fc 1920 {"accent":{"p1":1.68,"p5":2.97,"med":3.6}
#0059fc 2560 {"accent":{"p1":2.86,"p5":2.88,"med":3.34}
#0059fc 390 {"accent":{"p1":3.66,"p5":3.66,"med":3.66}
```
- **Pillar at 390, `n:0`:** the pillar rail sits below the 844px viewport on mobile, so the probe finds no glyph pixels to measure. There it sits on the flat hero ground.
- **Accent p1 values:** p1 is the 1% of glyph pixels over the photo's ceiling-light highlights.

### Screenshots (fix round 2)

- **Kit:** `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-d-fix2/`, with `desktop-*`, `laptop-*` and `mobile-*` full and fold captures. Every viewport reports `ok`.
- **2560:** `workflow/homepage/c3/shots/d/fix2-2560-full.png`: 2560×11471, overflowX 0, `broken: []`, `pageErrors: []`.
- **1440 fold @2x:** `workflow/homepage/c3/shots/d/fix2-1440-fold-dpr2.png`, with `pageErrors: []`.
- **Review shots with the banner hidden:** `scratchpad/c3/fix-d/r2/`, containing:
  - full pages at `{1440,2560,390,724,1024,320}-full.png`;
  - bands `b1440/`, `b2560/` and `b390/`;
  - crops `c2560-hero.png`, `c2560-close.png`, `c724-gap.png`, `c1024-gap.png`, `c320-top.png`, `c320-price.png` and `c390-audit-faq.png`.

## Fix round 3 (owner-lens blind judge, 2026-09-24)

### Sections: still 13, plus header and footer (order unchanged)

| # | Section | id | Ground | Separation from the section above |
|---|---|---|---|---|
| 1 | Hero | `top` | night photo | — |
| 2 | Positioning | `about` | white | ground change |
| 3 | Appointment Gap | `gap` | **white** (was tint) | 64 → hairline → 64 (`ruledB`) |
| 4 | Work | `work` | night | ground change |
| 5 | Services | `services` | white | ground change (`pairA`) |
| 6 | Process | `path` | **white** (was tint) | hairline (`ruledA`) |
| 7 | Follow-up | `follow-up` | **white** (was tint) | 64, no rule (pairs with Process) |
| 8 | Who it's for | `fit` | **white** (was tint) | hairline (`ruledA`) |
| 9 | Pricing | `pricing` | white | hairline (`ruledA`) |
| 10 | Proof | `proof` | white | hairline (`ruledA`) |
| 11 | Audit | `audit` | **white** (was tint) | hairline (`ruledA`) |
| 12 | FAQ | `faq` | white | hairline (`ruledB`) |
| 13 | Close | `contact` | white / night card | — |

### What changed

- **Proof item removed (all routes).** "Real customer testimonials" / "Named dealership voices…" is gone. Proof keeps "Verified campaign screenshots" and "Dealership CRM outcomes", renumbered 01–02. No copy was added.
- **Pure white grounds (all routes).** The `.sand` ground class and the unused `.sec` class are deleted; Gap, Process, Follow-up, Fit and Audit now sit on #FFFFFF. Two white neighbours are split by one container-width hairline, 64 above and 64 below it (`ruledA`, which hands its bottom to the next rule, and `ruledB`, which closes onto a night surface). Positioning now ends at 0 so the Gap's rule sits 64/64. `--sand` #F5F7FA survives only on the FAQ toggle disc (a 32px chip). Two lists lost their own bottom rule because the next section's hairline now closes them: the Audit steps (all widths) and the mobile Services list. Otherwise they would have drawn doubled lines.
- **Pillar strip (D).** Each pillar already carried its verified descriptor, from VERIFIED-COPY §2 set 2 (LP/TrustBar). The judge saw "four bare words" because the layout's consent bar (77px, fixed to the viewport bottom, shown on every first visit and in every capture) covered the descriptor lines at 823–866. The rail now ends 96px above the hero's bottom edge (84px at heights ≤880). The hero copy is 28px tighter: inner padding 48/40, lede margin 22 and actions margin 32. At heights ≤880 the H1 is capped at 64px, and at ≤780 it is capped at 56px. Measured rail box against the consent-bar top, CSS px:
  - 1280×800: rail 638–716, bar 723
  - 1366×768: rail 606–684, bar 691
  - 1440×900: rail 726–804, bar 823
  - 1536×864: rail 702–780, bar 787
  - 1920×1080: rail 901–984, bar 1003
  - 2560×1440: rail 1261–1344, bar 1363
  - 390×844: rail 854–1085, which starts below the 844 fold, so it is entirely below it

  Every hero still fills exactly its viewport. The H1, lede and pillar contrast on the photo was re-probed (`fix-d/r2/contrast.cjs`), and the accent p5 is ≥4.15 at every width.
- **Work tiles hug their ads (D).** The wrap is an inline-size container. Each ad renders at min(crisp width, its half-column less a 40px frame): luxury and wholesale at 561 crisp, and event at 15/16 of that, so the two event posts share one height. Meta and VLA are both at 481, VLA's crisp width. Each plate is its ad plus a 40px frame (32 at ≤1024), and the figure is left-aligned in its column with the caption hanging from the plate's edge. At 1440 the ads are 544/510/544/481/481px, up from 378/322/344/400/380. The frame (padding plus 1px border) measures ≤41px horizontally and ≤45px vertically at every width from 724 to 2560 (`fix-d/r3/plates.mjs`), and no plate passes the wrap. The featured plate no longer stretches to the text column (`align-self: center`).
- **Mobile rhythm (D).** At 390, page height went from 13,778 to **11,722** CSS px (27,556 → 23,444 px at DPR 2, −14.9%). All 13 sections are kept. The changes:
  - Tokens at ≤720: `--s-tight` 32 → 24, `--s` 48 → 40, `--s-loud` 56 → 44 and `--head-gap` 28 → 20. Body line-height is 1.55 and lede 1.5.
  - Work: the plate chrome is removed on mobile, so the feed frame is the frame. The Meta/VLA pair is now a swipe row like the event posts, where it used to stack. Tiles are 74% wide.
  - Duplicates the fixed bar already carries are hidden at ≤720: the Audit button, the Close call button, the whole Pricing action row, and the footer's site nav (the header menu has the same links).
  - Hero pillars are a 2×2 grid. The process step number sits on the title's line. The Services rows sit on the page at full measure instead of in a card. Pricing chips fit on one line, and the follow-up connectors, funnel bands and several stacked gaps are 4–16px tighter.
  - Per-section heights at 390: top 1117, about 456, gap 866, work 1817, services 985, path 747, follow-up 615, fit 626, pricing 1228, proof 616, audit 679, faq 628, contact 776.

### Deliberately not changed

1. **The consent bar itself.** It belongs to the root layout. The rail clears it rather than hiding it.
2. **Meta at 481px, not its 545 crisp width.** It is held to VLA's width so the two landscape plates share one width and one frame. VLA cannot go past 481 without upscaling.
3. **Right edges of the gallery are ragged** (at 1440, plates end at x = 708, 674 and 643 in column 1, and at 1360 and 1295 in column 2). Each plate hugs its ad, and the left edges align to the grid.

### Gates, verbatim

Density: `node workflow/homepage/scripts/density.mjs d http://127.0.0.1:3419` (exit 0; the `sizes=` column is trimmed)
```
--- d 1536px @2x
 ok  box 1536 need 3072 served 3840 (req w=3840, file 3840) 1.25 photo-night-showroom-retouched.jpg
 ok  box  544 need 1088 served 1122 (req w=0, file 1122) 1.03 work-luxury-campaign.webp
 ok  box  510 need 1020 served 1086 (req w=0, file 1086) 1.06 work-used-car-event.webp
 ok  box  544 need 1088 served 1122 (req w=0, file 1122) 1.03 work-wholesale-public.webp
 ok  box  481 need  962 served 1090 (req w=0, file 1090) 1.13 work-meta-inventory.webp
 ok  box  481 need  962 served  963 (req w=0, file 963) 1.00 work-google-vla.webp
--- d 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg
 ok  box  544 need 1088 served 1122 (req w=0, file 1122) 1.03 work-luxury-campaign.webp
 ok  box  510 need 1020 served 1086 (req w=0, file 1086) 1.06 work-used-car-event.webp
 ok  box  544 need 1088 served 1122 (req w=0, file 1122) 1.03 work-wholesale-public.webp
 ok  box  481 need  962 served 1090 (req w=0, file 1090) 1.13 work-meta-inventory.webp
 ok  box  481 need  962 served  963 (req w=0, file 963) 1.00 work-google-vla.webp
--- d 1280px @2x
 ok  box 1280 need 2560 served 3840 (req w=3840, file 3840) 1.50 photo-night-showroom-retouched.jpg
 ok  box  504 need 1008 served 1122 (req w=0, file 1122) 1.11 work-luxury-campaign.webp
 ok  box  472 need  944 served 1086 (req w=0, file 1086) 1.15 work-used-car-event.webp
 ok  box  504 need 1008 served 1122 (req w=0, file 1122) 1.11 work-wholesale-public.webp
 ok  box  481 need  962 served 1090 (req w=0, file 1090) 1.13 work-meta-inventory.webp
 ok  box  481 need  962 served  963 (req w=0, file 963) 1.00 work-google-vla.webp
--- d 390px @2x
 ok  box  390 need  780 served 1920 (req w=1920, file 3840) 2.46 photo-night-showroom-retouched.jpg
 ok  box  348 need  696 served 1122 (req w=0, file 1122) 1.61 work-luxury-campaign.webp
 ok  box  241 need  482 served 1086 (req w=0, file 1086) 2.25 work-used-car-event.webp
 ok  box  257 need  514 served 1122 (req w=0, file 1122) 2.18 work-wholesale-public.webp
 ok  box  259 need  518 served 1090 (req w=0, file 1090) 2.10 work-meta-inventory.webp
 ok  box  259 need  518 served  963 (req w=0, file 963) 1.86 work-google-vla.webp

0 soft image render(s)
```

TypeScript: `npx tsc --noEmit --incremental false`
```
tsc exit 0; total errors 0; variant-d errors 0
```

ESLint: `npx eslint src/components/review/variant-d`
```
eslint exit 0
```

Live DOM: `node scratchpad/c3/proto-nightfall/route-check.mjs http://127.0.0.1:3419/variant-d`
```
{"w":320,"scrollWidth":320,"clientWidth":320,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","mbarH":73,"footPadBottom":"101px"}
{"w":390,"scrollWidth":390,"clientWidth":390,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1080","small":[],"mbar":"fixed","mbarH":73,"footPadBottom":"101px"}
{"w":1024,"scrollWidth":1024,"clientWidth":1024,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
{"w":1100,"scrollWidth":1100,"clientWidth":1100,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
{"w":1440,"scrollWidth":1440,"clientWidth":1440,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"1920","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
{"w":2560,"scrollWidth":2560,"clientWidth":2560,"h1":1,"sections":13,"headings":0,"figcaptionNonBlock":0,"heroPick":"3840","small":[],"mbar":"static","mbarH":0,"footPadBottom":"36px"}
```

Overflow sweep, every 4px from 320 to 1920 plus 2560: `node scratchpad/auditD/sweep.mjs`
```
overflow none
headerwrap none []
btnwrap none []
```

### Screenshots (fix round 3), all captured with `capture.mjs`, `broken: []`, `overflowX: 0`, `pageErrors: []`

- `workflow/homepage/c3/shots/d/r3-1440-full.png`: 1440×10439.
- `workflow/homepage/c3/shots/d/r3-1440-fold-dpr2.png`: the whole pillar strip, with descriptors, sits above the consent bar.
- `workflow/homepage/c3/shots/d/r3-2560-full.png`: 2560×11637.
- `workflow/homepage/c3/shots/d/r3-390-full.png`: 780×23444 at DPR 2, which is 11,722 CSS px.
- Review tiles and probes are in `scratchpad/c3/fix-d/r3/`: `probe.mjs`, `banner.mjs`, `plates.mjs`, the `r3m-*` and `r3d-*` sheets, and `pre-1440-full.png` as the before shot.

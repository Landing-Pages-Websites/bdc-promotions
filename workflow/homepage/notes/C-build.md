# Direction C · Proof Wall — build notes

Route `/variant-c` · built 2026-09-23 from `workflow/homepage/C-BRIEF.md` on the reproduced
`work-wall-split` composition (`~/.claude/design-psyche/psyche/compositions/work-wall-split/transplant-bdc.html`).

## Final screenshot labels (design-psyche `psyche/screens/`)

| Label | Script | Use |
|---|---|---|
| `bdc-c-build-r5` | `screenshot.mjs` (1440×900 / 1280 / 390) | final; `desktop-fold.png` is the blind-rank candidate |
| `bdc-c-build-1536-r5` | `screenshot1536.mjs` (1536×864 / 1280 / 390) | final at design width |
| `bdc-c-build-1536-r1`, `bdc-c-build-r2`, `bdc-c-build-1536-r3`, `bdc-c-build-r4`, `bdc-c-build-1536-r4` | both | iteration rounds |

Measured (script `styles.json → geometry`):

| | 1536×864 | 1440×900 | Target |
|---|---|---|---|
| Fold IMG area | 37% | 34% (34.27) | ≥37 / ≥34 |
| Wall share of fold | 52.9% | 52.9% | ≥45% |
| Type ratio in fold | 6.0 | 5.6 | ≥6 |
| Page text sizes (C's own) | 7: 72·56·34·24·20·17·12 | 7: 66.6·52.6·34·24·20·17·12 | ≤7 |
| Animations / gradients / C shadows | 0 / 0 / 0 | 0 / 0 / 0 | 0 |

The script reports 9 sizes: the extra 14px and 16px are the consent banner and the root layout's skip link (plumbing, not C). Its one shadow is the consent banner's.

Wall checks (Playwright): H1 ink to wall clearance is 70px at 1400 and 1440, 67px at 1280, 66px at 1200 and 232px at 1920. No sticker is clipped at 1200–1920. The only ads clipped at the top are W7 VLA (12%) and W5 storyboard (11%), the two exempt pieces. Columns now end at or below the fold bottom at every size (see "Adapted" 3). `scrollWidth` equals the viewport at 320, 390, 1024, 1200, 1280, 1400, 1440 and 1920.

## Inherited from the reproduction (unchanged numbers)

- Left argument block at `left: gutter` (7.8vw), vertically centred; width `100% − gutter − wall − 24 − 56`.
- Right wall: 3 columns × `clamp(200px, 16.9vw, 330px)`, 16px gutters, 10px radius, `right: 24px`, stagger `−0.063·col / 0 / −0.159·col`. It passes under the header line and fades out at the bottom.
- H1 Archivo wdth 125 / 800, `clamp(38px, 5.6vw − 14px, 72px)`, line-height .98, 4 lines. Lead 20px at 30em. Pill CTA, 16px gap, then the outlined call pill.
- Graphite 72px header: logo 56px, 4 anchors, phone, 48px red pill.
- Column order: W7, $2,500 LG, W6, $2,500 BDC, W1 / $750, W2, W3 / W5, $5,000, W4. Caption chip at the bottom right.

## Adapted (and why)

1. **Mask fade 96px** (the transplant used 48px), as the brief asks for 1440×900.
2. **Fold is `min-height: max(640px, 100svh − 72px)`** with 48px vertical padding, not a fixed height, so short laptop viewports never clip the copy block. It still fills the viewport, and nothing from the next section shows.
3. **Stickers absorb spare column height.** Columns stretch to the fold, and each sticker is `flex-grow: 1` with its name at the top and price and term at the bottom, like a window sticker. Before this change, 1400×900 left bands of 60–73px of bare concrete under the columns. Now every column reaches the fade. This replaces the brief's `min-height` idea.
4. **Sticker price row is a wrapping flex.** When the column is narrow (1280), "/ month" drops onto its own 12px line instead of a 34px one.
5. **The phone wall reuses the desktop DOM.** At ≤760px the columns become `display: contents` inside a 2-column grid with explicit slots (W2 / $750 / W1 and W3 / $2,500 / W4, column B moved 40px down). Every piece renders once, with no duplicate markup.
6. **Tablet band 761–1199 (not in the brief).** The fold stacks: copy, then a 640px 3-column wall in flow. The split layout needs ≥1200px for "toward your" to clear the wall. Below 1200 the header anchors hide, pillars go 2×2, the lane becomes rows, and the ledger becomes a 3-column grid-area layout with inline labels.
7. **Phone bar at ≤760** (the brief says ≤720) so it covers the whole band where the header pill is hidden. It sits at z-index 40, under the consent banner (z-50), so it never hides the banner's buttons.
8. **Smooth scroll is off on this route.** `html:has(.page) { scroll-behavior: auto }` overrides the global `scroll-behavior: smooth`, because C has no motion (brief §1), and it also satisfies reduced motion. It also stopped lazy images from being skipped during full-page captures.
9. **Headings set `font-family: inherit`.** The global `h2, h3` rule in `src/app/styles/sections.css` forces Barlow Condensed. Round 1 shipped H2/H3 in Barlow; this was fixed in round 3.
10. **Pillar words drop to 26px on phones and 22px at ≤360px** (both sizes are already in the scale). Archivo wdth 125 at 34px overflowed a half-width cell ("Focused" hit 328px at 320).
11. **Lane numerals are 26px on phones** so "05" fits the 48px column.
12. **CSS is split into 6 modules**, not one. With one module per section, `proof-wall.module.css` (tokens, shared roles, header, footer, bar) holds 443 lines and the rest 87–289, so each stays under the repo's 500-line limit.

## Sections (in order)

Header → Fold (Proof Wall) → Pillar strip (graphite) → The work (#work, justified contact sheet, 3 rows) → Standards (#standards) → Pricing ledger (#pricing, window-sticker panel + negation footer) → Path (#path, graphite, 5-step lane + full-bleed showroom band with opaque plate) → Close + FAQ (#faq, 5 open answers) → Footer → phone call/audit bar.
Headings: 1 h1, h2 ×5, h3 (work note, standards rows, service names, step titles, FAQ heading), h4 FAQ questions.

## Files

- `src/components/review/variant-c/VariantC.tsx`: root, `next/font` (Archivo with the `wdth` axis as `--c-sans`, IBM Plex Mono 500/600 as `--c-mono`)
- `Chrome.tsx` (header, footer, phone bar) · `Fold.tsx` · `Work.tsx` (pillars + work) · `Ledger.tsx` (standards + pricing) · `Path.tsx` · `Close.tsx` · `Bits.tsx` (eyebrow, actions, sticker) · `ads.ts` (creative data, `splitPrice`)
- CSS modules: `proof-wall` · `fold` · `work` · `ledger` · `path` · `close`
- Copy comes only from `content.ts` (`auditHref`, `phoneHref`, `phoneDisplay`, `serviceOptions`, `growthSteps`, `faqItems`), the brief's verified deck, content-sources `target-states-faq` and `audit-offer-and-process`, and the A/B decks in DESIGN.md.

## Assets (`public/images/design/variant-c/`, byte-identical copies, sha256 verified against brief §7)

| File | Source | sha256 |
|---|---|---|
| `bdc-logo.png` | `images/design/shared/bdc-logo-2026.png` | 8b9ee13b…cfc9 |
| `ad-repo-sale.png` | `variant-a/growth-repo-sale.png` | 53c86d46…baf3 |
| `ad-luxury-campaign.png` | `variant-a/work-luxury-campaign.png` | 14074090…516e |
| `ad-used-car-event.png` | `variant-a/hero-used-car-event.png` | 0b16d89e…3ded |
| `ad-wholesale-public.png` | `variant-a/hero-wholesale-public.png` | 422915ed…2805 |
| `ad-luxury-storyboard.png` | `variant-a/work-luxury-storyboard.png` | 92343023…0c9c |
| `ad-meta-inventory.png` | `variant-a/work-inventory-ad.png` | 5d99f1a0…fd7 |
| `ad-google-vla.png` | `variant-a/work-google-vla.png` | 9835fb03…fb29 |
| `showroom-night.webp` | `lp/bdc-night-showroom.webp` (AI, approved for /lp; captioned "Illustrative image") | cd4503b4…5530 |

No image was generated. No people photography. Creative is never stretched and never overlaid.

## Remaining weaknesses (honest)

- **Type ratio at 1440 is 5.6, not ≥6.** The brief's own H1 formula gives 66.6px there, and the copy column (486px) caps it at about 68px, because "toward your" is 7.1× the font size. Reaching 6 would mean 11px labels. I kept 12px for legibility. At 1536 the ratio is 6.0.
- **IMG area at 1440 is 34.27%,** which only just clears the floor, as the brief predicted.
- **The fold CTAs stack.** At 1536 and 1440 the call pill wraps under the audit pill (the transplant does too), because the 486–525px copy column cannot hold both.
- **On phones the fold shows copy only.** At 390 the wall starts at about y=720, so the first 844px screen is text plus CTAs. The mobile primary pill also wraps to 2 lines.
- **Phones download 3 hidden desktop-only fold images** (VLA, inventory, storyboard). They are `loading="eager"` per V190 and `display: none` at ≤760, because one DOM serves both walls.
- **On tall viewports (e.g. 1400×900) the stickers grow up to about 70px of empty space** between the name and the price. This is deliberate (see "Adapted" 3), but it is a visible change from the transplant.
- **Repeated copy (per brief).** The Work row-3 H3 "Proof you can inspect." directly precedes the Standards H2 that repeats it, and the ledger footer repeats two FAQ answers.
- **The consent banner covers the wall caption chip and the phone bar** in every first-visit capture. This is plumbing and was left untouched.
- **The dev console shows the known review-bridge `<head>` hydration mismatch.** It is pre-existing, from the root layout, and not caused by C.
- **Not yet run:** design-critic and design-rank (the coordinator's review round), and the tablet band (761–1199), which was checked only by one Playwright capture at 1024.

## Checks

- `npx eslint src/components/review/variant-c`: exit 0, no warnings.
- `npx tsc --noEmit -p .`: exit 2, 60 errors, **0 in `variant-c`**. All are pre-existing: `fixtures/astro-reference`, `packages/managed-site-conversion`, `src/components/home/*` and `src/content/managed-site.ts`, which cannot resolve `@landing-pages-websites/managed-site-contract` until its package is built.
- Playwright: no horizontal overflow at 320/390/1024/1200–1920, H1 = 4 lines at 390 (43.68px), header tel link 44px tall at y=10 on 390, all C targets ≥44px (the only smaller ones are the consent banner's), phone bar `display: grid` at ≤760.

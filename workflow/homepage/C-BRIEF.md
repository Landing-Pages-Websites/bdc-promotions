# Direction C — "Proof Wall"

**Chooser line:** Bright concrete and tail-light red. Every real ad and all four published prices sit on one wall above the fold, and below it the work is shown whole and priced like a window sticker.

Route `/variant-c` · components `src/components/review/variant-c/` · images `public/images/design/variant-c/`.
design-psyche Steps 0–3 were written 2026-09-23 by the C research agent. Nothing in `src/` has been touched.

---

## 1. Audience and thesis

**Audience.** Dealership GMs, general sales managers and marketing managers who are comparing automotive agencies. They have seen the niche's pages (§4). Every one of those says "automotive digital marketing agency", and nearly all of them show a phone mockup or a stock handshake at the fold. None shows its actual ads there, and none prints a price.

**Visual thesis.** *The work is the proof and the price is on the wall.* The fold puts the whole range in front of the buyer in one look: seven finished, customer-supplied ads and the four published service prices, arranged as a staggered three-column wall beside a single heavy headline. Everything below the fold then slows down. Each ad is shown whole and labelled. The prices are set as a window-sticker ledger that states what is not guaranteed. The path to the appointment runs as a straight five-step lane and ends on a showroom. The register is warm, loud and retail, like a dealership lot rather than a journal or a signal diagram. It is bright where A is dark, wide where A is condensed, sans where B is serif, and it has no motion anywhere, where A is kinetic.

**What makes it a third direction and not a reskin**

| | A · Signal Lane | B · Field Journal | **C · Proof Wall** |
|---|---|---|---|
| Fold object | 1 slanted blue slab + 2 plates | 1 crop-marked plate | **3-column wall: 7 ads + 4 price stickers** |
| Ground | near-black navy | warm paper `#f3f1ec` | **light concrete `#ECECE8` + graphite bands** |
| Display face | Saira / Barlow **condensed** caps | Cormorant **serif** | **Archivo at width 125, weight 800 (wide grotesk), sentence case** |
| Accent | electric blue + cyan route | action blue + teal | **one tail-light red `#C8231B`** |
| Prices first seen | options band, about y≈3970 | ledger, about y≈3900 | **y < 864, in the fold** |
| Motion | kinetic route lines | none | **none (static wall)** |

## 2. Axes (Step 0, refined from DESIGN.md)

| Axis | Value | Justification |
|---|---|---|
| sells | **expertise** | Refined from "expertise + media". `media` in the psyche means a publication. BDC sells a production and follow-up service whose output happens to be visual. |
| conversion | **form** (free audit) + call | `/lp#lead-form` is the primary action and `tel:+13522071074` the second path. |
| buyer | comparing | GMs and marketing managers weighing agencies and price tiers |
| weight | considered | $750–$5,000 a month, mostly on 3-month commitments, with prices public |
| photogenic | **visual** | The customer creative is the proof. **The image gate is armed.** |
| trust | portfolio | The work itself. No metrics, testimonials, logos or results may be claimed. |
| register | playful (bold automotive retail) | Dealer creative is loud and retail, so confident rather than institutional |
| geo | national | Dealerships across multiple U.S. states, no state list |
| regulated | disclosure | No guaranteed lead volume, CPL, ROAS or show rate, and an explicit non-guarantee |
| audience | b2b | Dealership decision makers |

**Verdicts that bind C** (CORRECTNESS always; WHEN only where the predicate matches):
- V44 and V186 (`audience=b2b AND buyer=comparing`). Say what the buyer does not get, because a negation can be compared against other agencies. End the fold on a live control. → The pricing ledger closes on the non-guarantee line, and the standards section carries the "Never imply…" rule.
- V189 (`sells=expertise AND audience=b2b AND buyer=comparing`). A warm product-marketing register beats a documentary or editorial one. → C is retail-warm (rounded tiles, pill buttons, red), not B's journal. The discipline of ✓/✗ rows and public prices carries over unchanged.
- V108 (`weight=considered AND regulated=disclosure`). A caveat is one plain sentence, never a banner.
- V169 (`photogenic=visual AND buyer=comparing`). Each work tile says what it is: a category plus the ad's own headline, never a bare dump.
- V187 (`photogenic=visual`). The fold owns the viewport: `100svh` minus the header, with no next section peeking in.
- V188 (`conversion=form`). The two CTAs never share an edge. Keep a 16px gap, or wrap them.
- CORRECTNESS items that apply directly:
  - V192: the headline arithmetic, done in §5.
  - V202: check the fold at 1280 and 1400.
  - V187 (overflow): any grid or flex column that holds media gets `min-width:0`.
  - V190: `sizes` in px.
  - V186-figcaption: stacked caption lines get `display:block`.
  - V176: ledger rows keep their labels as text on mobile.
  - V42/V143: no horizontal scroll.
  - V137: border tokens are never used as text.
  - V74/V88/V99: a tel: link above the fold at 390px, plus a fixed call bar at ≤720px.
  - V8/SR9: no badge, no toggle, no "most popular".
  - SR3: no logo strips or star ratings.
  - V151/V191: who is in the frame. C uses **no photographs of people**.
  - V203: verify at full resolution any asset defect a downscaled judge reports.

## 3. Set B — excellence, selected by axes (frozen: `workflow/homepage/c-rank/REFERENCE-SET.md`)

| Ref | Why chosen | Fold image % (script / by eye) | Type ratio | Sizes | Bleed / overlap | Palette sampled (share) |
|---|---|---|---|---|---|---|
| **superside.com** (reproduced) | Creative production sold to comparing B2B teams, with a public pricing page and a wall of work as proof | 38 / 33 | 5.4 | 16 | 9 / 1581 | `#0b211f` 48%, `#e8ede2` 26%, `#606055` 17% |
| wk.com | Campaign agency, one full-bleed work still | 100 / 100 | 4.5 | 11 | 27 / 1808 | `#041319` 35%, `#2e1814` 23% |
| themill.com | Production house (automotive spots), full-bleed still | 100 / 100 | 2.5 | 10 | 12 / 129 | `#211f25` 26%, `#0f1013` 26% |
| mvsm.com | Studio whose fold is a titled grid of work | 76 / 72 | 7.2 | 7 | 102 / 519 | `#f4f4f4` 38%, `#141110` 27% |
| billiondollarboy.com | Paid-social agency: colour field, heavy caps, a column of vertical creative | 28 / 28 | 10.7 | 16 | 13 / 174 | `#4b70d8` 41%, `#181817` 29% |
| moversshakers.co | Social-first creative, full-bleed frames with giant caps | 100 / 100 | 1.0* | 5 | 24 / 204 | `#bcc3d9` 32%, `#fff107` 18% |
| thesocialshepherd.com | Paid-social agency, type-led on black | 100* / ~10 | 13.7 | 12 | 6 / 106 | `#000000` 76%, `#d5d5cf` 12% |
| askphill.com (Awwwards) | Growth agency, stacked work cards through the headline | 14 / 14 | 5.0 | 13 | 9 / 141 | `#131313` 84% |
| buck.co | Production studio, statement over work tiles | 12* / ~40 | 1.4 | 4 | 8 / 30 | `#ffffff` 42%, `#1e1f1b` 22% |
| outpost (Awwwards) | Studio, giant type over a work image | 100* / ~22 | 12.5 | 11 | 9 / 88 | `#f9f9f9` 68% |

\* The script miscounts canvas, video or background-image layers. The "by eye" figures come from reading the fold PNGs.

**Measured floor for C** (by-eye median ≈37%; closest reference 33–38%):
- **Wall object ≥45% of the fold** (V180: one element owns the frame).
- **Fold IMG area ≥34% at 1440 and ≥37% at 1536** by `screenshot.mjs` geometry.
- **Type ratio ≥6** from largest to smallest in the fold. The Set B median is about 5.2.
- **≤7 type sizes site-wide.** Set B runs 4–16, median 11.
- Bleed on at least one edge, with overlaps present (the wall passes under the header line and the bottom fade).
- Section rhythm: every full-page Set B capture changes ground every 1–2 sections, and none uses a uniform gap. C alternates concrete, graphite, concrete, paper panel, graphite, concrete.

## 4. Set A — the niche (live SERP, "car dealership marketing agency", United States, DataForSEO 2026-09-23)

The organic agency homepages were screenshotted as `screens/bdc-c-niche-*`: dealersmart.com #1, dealer.com #2, dealerauthority.com #4, autosweet.com #5 (403 to headless, fold via Firecrawl), clickheredigital.com/auto #7, gldauto.com #10, jivesmedia.com (#3 via its listicle), dealersunited.com (#8 via its blog), payperlead.com (local pack). n = 9.

| Finding | Frequency | Consequence for C |
|---|---|---|
| Fold answers "automotive digital marketing agency for dealers" (a category statement) | 7/9 | Table stakes. The eyebrow plus H1 do it. |
| Fold image is a device or dashboard mockup | 4/9 | Excluded. C shows the real ads. |
| Fold image is stock people (handshake, man, laptop) | 4/9 | Excluded. No people photography in C. |
| **Fold shows the agency's real ad creative** | **0/9** (2/9 show ad mockups further down) | **C's differentiator. All 7 pieces go in the fold.** |
| Dark fold ground | 7/9 | C goes light: concrete. |
| Fold CTA is "book / schedule a (strategy) call" | 5/9, plus demo 1, start here 1, contact 1, partner 1 | The primary is the free audit, with the phone as a real second path |
| Phone number in the header | 4/9 | C shows it at every width |
| Services grid or list | 9/9 | C prices the services instead of carding them |
| Logo walls, partner, OEM or award badges | 6/9 | Forbidden (SR3). Excluded. |
| Metric claims (%, $, "30+ years", "5x agency of the year") | 6/9 | Forbidden. Excluded. |
| Testimonials or star ratings | 4/9 | Forbidden. Excluded. |
| Blog or resources band | 6/9 | Out of scope for the homepage review |
| FAQ | 3/9 | C prints all answers open |
| Contact form on the homepage | 2/9 | C routes to `/lp#lead-form` |
| **Published prices** | **0/9** | **C's second differentiator: prices in the fold and in a ledger** |
| Pricing-policy negation ("no contracts", "no hidden fees", "never raised prices", "we don't take a cut") | 4/9 | The comparing buyer responds to negation (V186). C prints the verified non-guarantee. |

## 5. Reproduced composition (Step 2)

**Path:** `/Users/syedali/.claude/design-psyche/psyche/compositions/work-wall-split/`
- `fold.html` + `fold.png`: Superside fold rebuilt from measured px (live `getComputedStyle` probe plus a pixel scan). The diff against the reference (`screens/bdc-c-repro-superside-r2/`) is 18.6% overall but **0.54% outside the tile and cookie regions**, so the difference is content only.
- `transplant-bdc.html` + `transplant-bdc.png`: the BDC fold on that geometry, rendered at 1536, 1440, 1280 and 390 (`screens/bdc-c-transplant-r3/`, `…-r4-1440/`). **Build the fold from this file's numbers.** It is desktop-only; mobile is specified in §8.
- `axes.json`: both geometries and `theTrick`.

**Inherited from the reference:**
- A left argument block, vertically centred, starting at 7.8% of the width.
- A right-hand wall of real work in 3 equal columns with 16px gutters and 10px tile radius. The columns are staggered, bleed past the frame, and fade out at the bottom edge.
- A body roughly 4× smaller than the H1.
- One pill primary control ending the block.

**Adapted, each for a reason written in `fold.html`:**
1. Tiles keep their native aspect, because they are finished ads with type to the edges. Clipping happens only at the wall's top and bottom, and every piece reappears whole below.
2. The wall is static, with no marquee. Seven pieces cannot fill a loop without visible repeats.
3. The wall includes **4 price stickers** instead of repeated ads.
4. The wall grows to 48.5% of the fold (Superside's is 33%).
5. The H1 runs to 4 lines. By V192 arithmetic, "toward your" renders at 7.1× font-size px, so a 532px column holds at most 72px.
6. A phone button joins the pill, 16px away.
7. The fold is `100svh` minus the header, and nothing intrudes.
8. Light concrete ground, ink type, one red, and a graphite header, because the supplied logo has white lettering.

**Discarded (identifying):** Superside's green/lime, wordmark, roman/italic serif headline mix, "Sign in", logo band and all of its client work.

## 6. Tokens

**Fonts** (not used by A — Saira, Barlow, Barlow Semi Condensed, Instrument Sans — or B — Cormorant, Inter — and not on the banned list):
- **Archivo**, variable, with the `wdth` axis: `Archivo({ subsets:["latin"], axes:["wdth"], variable:"--c-sans", display:"swap" })`. Check `node_modules/next/dist/docs` and next/font's font data for axis support before relying on it. Display roles use `font-stretch:125%` (or `font-variation-settings:"wdth" 125`) at weight 800. Body text stays at `wdth` 100.
- **IBM Plex Mono** 500/600 (`--c-mono`) for labels, sticker text, captions and eyebrows only. No tabular-nums on prose (V135). Prices use Archivo `tabular-nums`, and the comma width must be checked in the screenshot (V64).

**Type scale** (7 sizes site-wide):

| Role | Desktop | 390 | Face |
|---|---|---|---|
| H1 | `clamp(38px, calc(5.6vw - 14px), 72px)`; at ≤480: `min(11.2vw, 44px)`; lh .98, ls −.025em | 43.7px | Archivo 125/800 |
| H2 | `clamp(34px, 3.65vw, 56px)`, lh 1.0, ls −.02em | 34px | Archivo 125/800 |
| Price / pillar word / plate note | 34px, lh 1 | 26px in wall stickers | Archivo 125/800 |
| H3 (step titles, standards rows, service names, FAQ heading) | 24px, lh 1.15 | 22px | Archivo 125/700 (service names and FAQ questions: Archivo 100/700) |
| Lead body | 20px/1.5 | 18px | Archivo 100/400 |
| Body, buttons, nav, FAQ | 17px/1.55 (buttons and nav 600) | 17px | Archivo 100 |
| Label | 12px/1.3, uppercase, ls .06em | 12px | Plex Mono 500/600 |

**Spacing** (px): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112.
- Section padding: 112 on desktop, 72 at ≤720.
- Heading to content: 48.
- Grid gap: 24. Wall gap: 16.
- Gutter: `clamp(20px, 7.8vw, 150px)`.
- Container: `min(100% - 2*gutter, 1440px)`, which is 1296 at 1536.
- Radius: 10 for tiles, stickers and panels. Buttons are pills.

**Colour** (contrast measured):

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--c-concrete` | `#ECECE8` | page ground | ink 15.8 |
| `--c-paper` | `#FFFFFF` | stickers, pricing panel, FAQ panel | ink 18.7 |
| `--c-ink` | `#111214` | text, 2px sticker and panel borders, outlined buttons | — |
| `--c-graphite` | `#1B1C1F` | header, pillar strip, path band, footer, mobile bar | white 17.0 |
| `--c-steel` | `#5B5E64` | muted text on concrete or paper | 5.49 / 6.50 |
| `--c-fog` | `#C9CAC4` | muted text on graphite; hairlines on concrete (**non-text only there**, 1.39) | 10.3 on graphite |
| `--c-red` | `#C8231B` | primary fill (white text 5.66); red text or marks on concrete (4.78) or paper (5.66) | — |
| `--c-red-dark` | `#FF6A5E` | red numerals and marks on graphite | 6.07 |
| `--c-line-dark` | `#3A3B40` | dividers on graphite (non-text) | — |

Focus is `outline: 3px solid var(--c-red); outline-offset: 3px`, using `--c-red-dark` on graphite. The only gradient is the wall's functional fade mask. No shadows. No load or scroll animation.

## 7. Image-slot plan (Step 3)

**No new images were generated.** The legitimate supply covers every slot. The builder **copies these byte-identical into `public/images/design/variant-c/`**, because C owns that folder and other agents are editing A and B, and then checks the sha256 below after copying.

| Slot | Source → `variant-c/` name | px | sha256 (source) | Role · crop · alt |
|---|---|---|---|---|
| Logo | `images/design/shared/bdc-logo-2026.png` → `bdc-logo.png` | 1254×749 | 8b9ee13b…cfc9 | Header on graphite, 56px tall (44px at ≤720). `contain`. Links to `/` with aria-label "BDC Promotions — back to the homepage direction chooser". Alt "BDC Promotions — Automotive Marketing". |
| W1 repo | `images/design/variant-a/growth-repo-sale.png` → `ad-repo-sale.png` | 1080×1080 | 53c86d46…baf3 | Wall col 1 (last) and Work row 2. Alt: "Customer-supplied event ad reading “Massive Repo Sale”". |
| W2 luxury | `…/variant-a/work-luxury-campaign.png` → `ad-luxury-campaign.png` | 1122×1402 | 14074090…516e | Wall col 2 and Work row 1. Alt: "Customer-supplied luxury campaign ad reading “We Make Luxury Affordable” with a $1,000 savings voucher". |
| W3 used-car | `…/variant-a/hero-used-car-event.png` → `ad-used-car-event.png` | 1086×1448 | 0b16d89e…3ded | Wall col 2 and Work row 1. Alt: "Customer-supplied event ad reading “Massive Used Car Sales Event”". |
| W4 wholesale | `…/variant-a/hero-wholesale-public.png` → `ad-wholesale-public.png` | 1122×1402 | 422915ed…2805 | Wall col 3 and Work row 1. Alt: "Customer-supplied event ad reading “Wholesale to the Public”". |
| W5 storyboard | `…/variant-a/work-luxury-storyboard.png` → `ad-luxury-storyboard.png` | 426×640 | 92343023…0c9c | Wall col 3 (first) and Work row 2. Alt: "Customer-supplied 30-second luxury TV storyboard with five scenes". |
| W6 inventory | `…/variant-a/work-inventory-ad.png` → `ad-meta-inventory.png` | 1090×596 | 5d99f1a0…fd7 | Wall col 1 and Work row 2. Alt: "Customer-supplied Meta inventory carousel ad shown on a phone". |
| W7 VLA | `…/variant-a/work-google-vla.png` → `ad-google-vla.png` | 963×509 | 9835fb03…fb29 | Wall col 1 (first) and Work row 3. Alt: "Customer-supplied Google Vehicle Listing Ads search result". |
| Path photo | `lp/bdc-night-showroom.webp` → `showroom-night.webp` | 1750×899 | cd4503b4…5530 | See the notes below this table. |

**Path photo notes.** This is the destination image at the end of the path band. It is AI-generated and was approved for /lp. At full resolution it has **no text, logos or people**.
- Desktop: a full-bleed band 1536×560 with `object-fit:cover; object-position:62% 58%`. That keeps the glass wall and the grey SUV and drops sky and pavement.
- 390: 390×300 with `object-position:70% 55%`.
- Alt: "Illustrative night view of a glass-fronted dealership showroom". A visible mono caption reads "Illustrative image".

**Rules for every image:**
- Customer creative is shown exactly as supplied: no stretch, no filter, no redraw, no overlay text on the ad. Clipping is only by the wall's container edge, and the Work index shows every piece whole.
- `next/image` with intrinsic width and height, and `sizes` in px: wall `260px`, work items at their row widths (§8.3). Nothing in the fold is lazy-loaded (`priority` on the 7 wall ads plus the logo). Every frame has a `#d8d8d3` ground so a loading box is never invisible (V190).
- **Not used in C:**
  - `bdc-team-follow-up.webp` and `bdc-audit-consultation.webp`. They show AI people who could read as BDC staff.
  - `bdc-inventory-production.webp` (an AI person).
  - `proof-headlight.jpg` (A's image).
  - `growth-source-work.png`. It is A's rearranged composite, not a supplied piece.
  - Any device mockup.

## 8. Sections: layout and exact copy

The copy comes only from `content.ts`, the A/B decks in DESIGN.md and `content-sources.json`. Case and terminal punctuation are styling. Items marked *UI* are navigation or column labels, not claims.

### 8.0 Header (graphite, 72px; 64px at ≤720)
- **Desktop.** Left to right, padded `0 32px 0 gutter`:
  - Logo, 56px tall.
  - Anchors (*UI*): `The work` → #work, `Pricing` → #pricing, `Process` → #path, `FAQ` → #faq. Archivo 17/600, white, 28px gaps, each at least 44px tall.
  - `margin-left:auto`, then the tel link `(352) 207-1074` (17/600, tabular).
  - Red pill, 48px tall: `Get a Free Dealership Marketing Audit` → `/lp#lead-form`.
- **390.** Logo 44px, then the tel link text `(352) 207-1074` on the right (≥44px target). Anchors and the header pill are hidden, because the fold CTA sits right below.
- **≤720 fixed bar** (V74/V88): a graphite bar fixed to the bottom, 64px tall, split 50/50. Left: `Call (352) 207-1074` (tel). Right: a red cell `Free audit →` → `/lp#lead-form`. Add `padding-bottom:64px` on the page. The cookie banner is plumbing; confirm the bar does not hide its buttons, and if it does, raise the bar's `bottom` by the banner height while the banner is open. Never edit the banner.

### 8.1 Fold: Proof Wall (concrete; `height: calc(100svh - 72px); min-height: 640px; overflow:hidden`)

**Desktop (1536×864): copy block**
- Absolute, `left: gutter`, centred vertically.
- Width = `100% − gutter − wallWidth − 24 − 56` (532px at 1536). `min-width:0`.

Copy (exact):
- Eyebrow (mono 12, steel, preceded by a 10×10 red square): `Automotive marketing / creative to appointment`
- H1: `Move more shoppers toward your showroom.`. It renders on 4 lines: Move more / shoppers / toward your / showroom.
- Lead (20px, max 30em): `BDC Promotions combines automotive ad creative, campaign optimization, BDC follow-up, and AI-supported nurturing to create more qualified sales opportunities.`
- Proof list. Mono 12, ink, `<ul>` with `flex-wrap`, gap 6px 18px, each item preceded by an 8px red square: `Real automotive creative.` · `Real follow-up.` · `A clearer path to appointments.`
- Actions (margin-top 30, gap 16, wrap):
  - Red pill, 56px: `Get a Free Dealership Marketing Audit →` → `/lp#lead-form`
  - Outlined 2px ink pill, 56px: `Call (352) 207-1074` → tel

**Desktop: wall**
- `<ul aria-label="Customer-supplied automotive creative and published prices">`, positioned absolute at `top:0; bottom:0; right:24px`.
- 3 columns, each `--col: clamp(200px, 16.9vw, 330px)` (260 at 1536), 16px gap.
- `mask-image: linear-gradient(#000 calc(100% − 96px), transparent)`.
- Column order, top to bottom. `margin-top` is a fraction of `--col`.
  - **Col 1** (`−0.063·col`): W7 VLA · sticker **Lead Generation** · W6 Meta inventory · sticker **Live BDC Agent Team** · W1 repo
  - **Col 2** (`0`): sticker **Luxury Video** · W2 luxury campaign · W3 used-car event
  - **Col 3** (`−0.159·col`): W5 storyboard · sticker **Lead Gen + BDC Team** · W4 wholesale
- Sticker: paper, 2px ink border, radius 10, padding `12px 14px 10px`, gap 6. It holds three lines:
  - name (mono 12/600 uppercase)
  - price (Archivo 125/800 34px, `nowrap`) + `/ month` in mono 12px, which keeps the page within 7 sizes
  - term (mono 12, steel, 1px fog top rule)
- Sticker copy (content.ts):
  - `Lead Generation` / `$2,500` / `/ month` / `3-month commitment`
  - `Live BDC Agent Team` / `$2,500` / `/ month` / `3-month commitment`
  - `Luxury Video` / `$750` / `/ month` / `Includes 1 new video each month`
  - `Lead Gen + BDC Team` / `$5,000` / `/ month` / `3-month commitment`
- All stickers are white. **None is highlighted** (V8).
- Caption chip, absolute bottom-right of the fold (right 24, bottom 14): graphite, white mono 12 uppercase: `Customer-supplied automotive creative`.

**Wall constraints**
- Stickers are never clipped.
- An ad is never clipped more than 25% of its height at the top, except W7 and W5, whose tops carry no headline.
- At 1440×900 and 1920×1080, no column may end more than 60px above the fold bottom; the 96px fade hides the ends.
- The copy block never collides with the wall. Compare the H1's ink right edge with the wall's left edge at 1280, 1400, 1440 and 1536.
- **Targets:** wall ≥45% of the fold, IMG ≥34% at 1440 and ≥37% at 1536, type ratio ≥6.

**390**
- The fold is not full-height: header, then padding 32/20.
- Eyebrow, then H1 (4 lines, 43.7px), lead 18px, proof list, then both CTAs full-width and stacked (56px each).
- Then the wall: 2 columns of `(100% − 12px)/2`, container `max-height:620px; overflow:hidden`, bottom fade 64px.
  - Col 1: W2 luxury · sticker Luxury Video · W1 repo
  - Col 2 (`margin-top:40px`): W3 used-car · sticker Lead Generation · W4 wholesale
  - Mobile sticker price is 26px and `/ month` wraps under it.
  - Caption chip below the wall, static.
- No horizontal overflow at 390 or 320. The wall is clipped inside its own container.

### 8.2 Pillar strip (graphite, about 140px; `id` not needed)
- **Desktop.** Container with 4 equal cells divided by 1px `--c-line-dark`, padding 32/24. Each cell has a 10px red-dark square, then the word (Archivo 125/800 34px white), then the descriptor (mono 12 uppercase fog).
- **390.** 2×2 grid.
- Copy: `Fast` / `Automotive-specific strategy` · `Focused` / `Static + video creative` · `Social` / `Human + AI-supported follow-up` · `Results` / `Scheduled appointment focus`

### 8.3 The work (#work, concrete, padding 112)

**Head row**
- Desktop grid 7/5.
- Left: eyebrow (mono 12, red text, square) `The work is the proof`, then H2 `Automotive creative built for the real feed.` (2 lines).
- Right, bottom-aligned: `Inspect the range: new-car lead generation, event advertising, testimonial videos, employee stories, luxury films, viral concepts, Meta inventory ads, and Google Vehicle Listing Ads.` (lead 20), then mono 12 steel `Customer-supplied automotive creative`.

**Contact sheet.** Justified rows with equal height inside a row:
- `.row{display:flex;gap:24px}`, `.item{flex:<w/h> 1 0%; min-width:0}`, image `width:100%;height:auto`, radius 10.
- No mat, no crop.
- Row gap 48, caption included.

| Row | Items and widths at the 1296 container |
|---|---|
| 1 | W2 luxury 425 · W3 used-car 398 · W4 wholesale 425. Height 531. |
| 2 | W5 storyboard 238 · W1 repo 357 · W6 Meta inventory 653. Height 357. |
| 3 | W7 VLA 856 wide (452 tall) + a text cell 416 wide |

The row 3 text cell is bottom-aligned. It holds H3 `Proof you can inspect.` (Archivo 125/700 24) and the link `See How the Process Works →` → #path. Both strings are from the A deck.

**Captions** (`<figcaption>`, two lines, both `display:block`):
- Line 1: mono 12 steel uppercase.
- Line 2: Archivo 17/600 ink.

| Piece | Line 1 | Line 2 |
|---|---|---|
| W2 | `Event campaigns · Promotional ad creative` | “We Make Luxury Affordable” |
| W3 | same as W2 | “Massive Used Car Sales Event” |
| W4 | same as W2 | “Wholesale to the Public” |
| W1 | same as W2 | “Massive Repo Sale” |
| W5 | `Video creative` | `Luxury storyboard` |
| W6 | `Inventory advertising` | `Meta inventory ad` |
| W7 | `New car lead gen` | `Google Vehicle Listing Ads` |

The quoted titles are the ads' own printed headlines. Do **not** name the dealership shown inside the creative, because attribution needs approval.

**390.** Single column in the same order (W2, W3, W4, W5, W1, W6, W7, then the text cell), each at full container width.

### 8.4 Standards (#standards, concrete, 1px ink top rule, padding 112)

**Desktop grid 5/7**
- Left:
  - Eyebrow `Proof with standards`
  - H2 `Proof you can inspect. Promises you can trust.` (3–4 lines)
  - Label (mono 12 red) `Automotive-specialist positioning`
  - Body 17: `BDC Promotions is built around dealership creative, customer engagement, and the operating path from campaign response to showroom opportunity.`
- Right: 3 rows. Each has a mono 12 steel number, then Archivo 125/700 24px text, with 1px ink rules between rows and 28px padding.
  - `01` `Show only customer-approved work and attribution`
  - `02` `Use testimonial video only after transcript and publication approval`
  - `03` `Never imply guaranteed lead volume, CPL, sales, ROAS, or show rate`. Its number is set in red, the negation row.
  - Under the rows: a mono 12 steel line, `No unverified dealership count, ad-spend total, client logos, or outcome statistics.`

**390.** Stacked, in the same order.

### 8.5 Pricing — window-sticker ledger (#pricing, concrete, padding 112)

**Head**
- Eyebrow `Select the support your store needs`
- H2 `Start with one service. Connect the full lane.`

**Panel** (paper, 2px ink border, radius 10, full container width)
- Header strip: graphite, 56px tall, mono 12 white uppercase `Services & pricing` (*UI*).
- Column-label row, mono 12 steel: `No.` `Service` `Price` `Term` `Includes` (*UI*).
- Rows: `grid-template-columns: 72px 1.2fr 1fr .9fr 1.6fr`, min-height 104, padding 24, 1px ink top rule.
  - No.: mono 12.
  - Service: H3 Archivo 100/700 24.
  - Price: Archivo 125/800 34, tabular, + `/ month` in mono 12.
  - Term: mono 12 steel.
  - Includes: body 17.

Rows, in content.ts order:
1. `01` `Lead Generation` `$2,500` `3-month commitment` `Static ad creation, video ad editing, and ad optimization`
2. `02` `Live BDC Agent Team` `$2,500` `3-month commitment` `Lead nurturing, pre-qualifications, and appointment scheduling`
3. `03` `Luxury Video` `$750` `Includes 1 new video each month` `Premium automotive video creative`
4. `04` `Lead Gen + BDC Team` `$5,000` `3-month commitment` `Connected campaign and follow-up support`

**Panel footer** (padding 24, 2px ink top rule), 2 columns:
- Left, the negation: Archivo 700 17 `Are results guaranteed?`, then 17 `No specific lead, appointment, show, or sales result is guaranteed.`
- Right: Archivo 700 17 `Do we have to buy every service?`, then 17 `No. Dealerships may select individual services or connect them into a broader program.`

Under the panel: red pill `Find the Right Mix →` → `/lp#lead-form`, 16px gap, then an outlined `Call (352) 207-1074`.

**390.** Each row becomes a block separated by 2px ink rules. The column labels go, and each value carries its label inline, e.g. mono `Term` / `Includes` (V176). Price at 34px. No horizontal scroll.

### 8.6 Path (#path, graphite band, padding 112 top)

**Head**, desktop grid 7/5:
- Left: eyebrow (mono 12 fog) `Strategy → Creative → Optimization → Nurture → Appointment`, then H2 (white) `One connected path from scroll to showroom.`
- Right, bottom-aligned: `Choose the pieces your dealership needs or connect the full operating lane.` (lead 20, fog).

**Lane**, 5 equal columns, gap 24. Each column has:
- Numeral: Archivo 125/800 34, `--c-red-dark`.
- A 2px fog rule with a 10px red-dark square at its left end. The rules join into one line across the lane.
- Title: H3 white 24.
- Copy: 17 fog.

Steps (content.ts `growthSteps`, exact):
- `01 Strategy`: Shape the campaign around your store, inventory, market, and sales priorities.
- `02 Creative`: Build static, event, inventory, and video advertising designed for automotive shoppers.
- `03 Optimization`: Launch and refine paid campaigns around qualified dealership opportunities.
- `04 Nurture`: Use BDC staff and AI tools to keep conversations moving quickly and professionally.
- `05 Appointment`: Move interested shoppers toward a scheduled dealership visit with a day and time.

**Destination photo**
- 72px below the lane: a full-bleed band 100vw × 560 (the path photo, §7).
- An opaque graphite plate sits bottom-left at `left: gutter; bottom: 32px`, padding 20/24. It holds Archivo 125/800 34 white `Set the visit. Win the appointment.` (B deck growth note), then mono 12 fog `Illustrative image`.
- The plate is opaque, so no scrim is needed (V193).

**390**
- Steps become rows: numeral in a 48px left column, text on the right.
- Photo 390×300.
- The plate sits **below** the photo, not over it.

### 8.7 Close, audit and FAQ (#faq, concrete, padding 112)

Desktop grid 7/5.

**Left**
- Eyebrow `Your next move`
- H2 `Ready to create more opportunities for your dealership?` It breaks as: Ready to create / more opportunities / for your dealership?, and needs 7 columns at 56px.
- Lead 20: `Tell us what your store needs, or call now to talk through the right mix of creative, media, follow-up, and appointment support.`
- Label (mono 12 red): `Free dealership marketing audit and consultation, no obligation`
- `<ol>`, 3 rows with 1px ink rules, each a mono 12 number plus Archivo 700 20:
  - `01 Review your current marketing`
  - `02 Identify the biggest conversion gaps`
  - `03 Deliver focused next-step recommendations`
  - (content-sources `audit-offer-and-process`)
- Actions: red pill `Get a Free Dealership Marketing Audit →` → `/lp#lead-form`, then outlined `Call (352) 207-1074`.

**Right**
- Panel: paper, 2px ink border, radius 10, padding 32.
- H3 `Frequently asked questions`.
- 5 open items: question Archivo 700 17, answer 17 steel, separated by 1px fog rules. No `<details>`; every answer stays visible.
  1. `Do we have to buy every service?` No. Dealerships may select individual services or connect them into a broader program.
  2. `What kinds of creative can BDC Promotions produce?` The supplied work covers static, event, new-car, employee, luxury, viral, testimonial, inventory, and Google vehicle-listing advertising.
  3. `What happens after a lead comes in?` Depending on your service mix, BDC staff and AI-supported tools can nurture the conversation and move the shopper toward an appointment with a scheduled day and time.
  4. `Are results guaranteed?` No specific lead, appointment, show, or sales result is guaranteed. The work is designed to create stronger opportunities and a clearer follow-up process.
  5. `Which states do you work with?` We partner with dealerships across multiple U.S. states. Share your details on the form or give us a call and we'll confirm fit for your market.
     - The answer is content-sources record `target-states-faq`; the question is its pairing in `src/components/lp/LpFaq.tsx`.

**390.** Stacked; the FAQ panel is full width.

### 8.8 Footer (graphite, about 96px)
- 3 cells divided by 1px `--c-line-dark`, each target at least 44px:
  - `BDC Promotions — Automotive Marketing`
  - `(352) 207-1074` → tel
  - `justins@bdc-promotions.com` → mailto
- 390: stacked.

**Headings outline:** one h1 (fold) → h2 in each of 8.3, 8.4, 8.5, 8.6 and 8.7 → h3 for service names, step titles, standards rows, the FAQ heading and FAQ questions (questions may be h4). Stickers and pillars are not headings.

## 9. Excluded elements (and why)
- **Forbidden claims** (the honesty floor, SR3):
  - Logo strips, OEM or partner badges, award badges.
  - Star ratings, review counts, testimonials.
  - Any metric, stat, case-study number or "trusted by N".
- The **"15 years exclusively automotive"** customer claim. It is in content-sources but not independently re-verified, and C's trust axis is the work only.
- Dealer or client names in captions, because attribution needs approval.
- A "most popular" or "recommended" highlight on any price, and toggles (V8, SR9).
- Photographs of people: the AI team and audit scenes (V151/V191, and nothing may present AI people as staff).
- Device mockups and dashboards, which are 4/9 of the niche.
- The marquee or any load or scroll animation, gradients (except the wall's functional fade), shadows and glassmorphism.
- A's composite `growth-source-work.png`, A's `proof-headlight.jpg`, crop marks, B's handwritten notes, A's node route. Those belong to A and B.
- Condensed display faces, serif display faces, navy or electric-blue fields.
- An "Explore the Work" button. C's Work section *is* the full work, so the link would have no destination.

## 10. How C beats A and B (checkable)
1. **The whole range above the fold.** At 1536×864, C's fold shows all **7** customer pieces. A's fold shows 2 (luxury + repo) and B's shows 1 (luxury). *Check:* count the `<img>` elements in `desktop-fold.png`.
2. **Price above the fold.** All **4** published prices are visible at y < 864. A and B first show a price at about y 3,900–3,970. No Set A competitor publishes one (0/9). *Check:* screenshot.
3. **One element owns the frame.** The wall is ≥45% of the fold (48.5% measured in the transplant), IMG area ≥37% at 1536 and ≥34% at 1440, and the type ratio is ≥6. *Check:* `styles.json → geometry`, and pass these numbers to the design-rank note.
4. **Every piece inspectable whole.** Each of the 7 ads appears uncropped at ≥238px wide in the Work index, and 5 of them at ≥398px. *Check:* DOM `naturalWidth` and rendered box sizes.
5. **Negation a comparing buyer can diff** (V186):
   - The pricing ledger ends on "No specific lead, appointment, show, or sales result is guaranteed."
   - The standards section prints the "Never imply…" rule and the "No unverified dealership count…" line.
   - *Check:* grep the rendered text.
6. **Distinct system, not a reskin.**
   - Wide display face (Archivo at width 125) against A's condensed and B's serif.
   - Concrete and red against navy/electric blue and paper/navy.
   - Zero CSS animations against A's kinetic route.
   - *Check:* the `styles.json` fontFamilies and `animatedElements = 0`.
7. **Type discipline.** ≤7 distinct font sizes site-wide. *Check:* `auto-flags.txt` has no font-size flag above 7.
8. **Mobile honesty and access.**
   - The tel link is visible in the 390 fold, and the fixed call/audit bar shows at ≤720.
   - No horizontal overflow at 390 or 320.
   - All targets ≥44px, AA on every text token (table in §6).
   - *Check:* `a11y-probe.mjs` or `scrollWidth`.

## 11. Builder checklist (before handing to review)
- The route is noindex (already set). Nothing to add to the root head; the review bridge is untouched.
- The design width is 1536. Screenshot with `screenshot1536.mjs` and `screenshot.mjs` (labels `bdc-c-r<n>`). Open the fold, the section crops and mobile at native resolution.
- Measure the wall at 1280, 1400, 1440, 1536 and 1920:
  - No sticker is clipped.
  - H1 ink ends before the wall's left edge.
  - Column ends sit inside the fade.
- Files stay under 500 lines. Use one CSS module per section inside `variant-c/`. TypeScript strict, no `any`, explicit return types. Import `auditHref`, `phoneHref`, `phoneDisplay`, `serviceOptions`, `growthSteps` and `faqItems` from `content.ts`; do not edit it.
- The blind rank uses `workflow/homepage/c-rank/REFERENCE-SET.md` (frozen). Screenshot C's fold at 1440×900 with `screenshot.mjs` for the sheet.

## 12. Round-1 revisions (2026-09-23, after critic FAIL and blind rank 7/13)

**Why.** The blind rank called C's fold "about 14 objects of equal weight; the eye has nowhere to land". The #1 fold (Superside) was a service statement, a grid of separately labelled work pieces, and one CTA. The critic found four things. The window sticker existed only as a name. Mono labels made C read like a template. Filler (pillars, Standards/V165, an AI showroom) diluted the page. And the 390 fold showed no work. Where they conflict with §1–§11, the revisions below win.

**Fold (desktop ≥1200).**
- The copy column is sized off the H1: `--copy: calc(var(--t-h1) * 7.25)`, the V192 width of "toward your".
- The H1 is `clamp(38px, 5.6vw − 8px, 76px)`: 72.6px at 1440 (ratio 6.1) and 76px at 1536.
- The wall runs from `copy + 32px` to `right: 12px` and starts 16px below the header. No tile is cut under the header; tiles are cropped only by the 96px bottom fade.
- The wall is ads only, each with a short type label under it (Archivo 12/600 caps): Luxury campaign, Event campaign, Promotional ad, Luxury video storyboard, Meta inventory ad. It has two halves on one top edge:
  - The lead half (3/5, max 560px) holds the luxury campaign, the lead piece, at about 413×516 at 1440, level with the H1. The Meta inventory ad sits under it.
  - The side half (min 328px) holds the one window sticker, then two staggered columns: used car + storyboard, and wholesale + repo.
- The VLA screenshot is not in the wall, because it is unreadable at wall size. It is in Work at full width.
- The sticker is one object:
  - A graphite band reading "Services & pricing · Per month".
  - Four ruled name → price rows, with price in Archivo wdth125/800 at 24px, tabular.
  - The closing line, verbatim: "No specific lead, appointment, show, or sales result is guaranteed."
  - Terms (3-month commitment, 1 video/month) are in the ledger, not the sticker.
- The fold has one primary pill, "Get a free dealership marketing audit →", plus the inline text link "or call (352) 207-1074". The header audit pill is removed, and the header keeps the phone at every width.

**Phone (≤760).**
- The fold order is: eyebrow → H1 → a 302px two-column strip → CTA → lead → proof.
  - The strip has the lead ad on the left (clipped by its bottom fade) and the sticker on the right, with "/ month" returning beside each price.
  - The CTA is a single centred wrap; the arrow is part of the label, not a flex item.
- The fold's inline call link is hidden at this width, because the header and the fixed call/audit bar already carry the phone. At 375 it would sit under the bar.
- Below 375px the strip goes 2fr/3fr, so "$5,000 / month" fits.
- Work portraits run two-up.

**Type.**
- IBM Plex Mono is removed; the page uses one family, Archivo.
- Labels are Archivo 12/600 caps +.06em. Captions are sentence case.
- Buttons are sentence case.
- `.price` is `nowrap`, so an amount and its "/ month" never split.
- `text-wrap: pretty` is on the leads, and "AI-supported" is kept whole.
- Seven sizes: 72.6 · 52.6 · 34 · 24 · 20 · 17 · 12.

**Colour and rhythm.**
- Concrete is warmed to `#EFEBE3` and steel to `#5A5750` (6.06:1).
- Red now means act: the audit pill, the call link's underline, the phone bar's audit cell and focus. Eyebrow squares and red eyebrows are gone; proof bullets and lane marks are ink.
- Grounds run: header graphite → fold concrete → Work concrete → Pricing **graphite** (white-framed ledger) → Path **concrete** → Close **graphite** → footer.
- Section padding is 96, so gaps between grounds are 192 and no same-ground gap exceeds 144.

**Deleted.**
- The pillar strip.
- §8.4 Standards (V165), which also removes the duplicate "Proof you can inspect.".
- The AI showroom band, plus its asset copy; the source is still at `public/lp/`.
- The Work row-3 text cell.
- The FAQ items "Do we have to buy every service?" and "Are results guaranteed?", which are printed in the ledger footer.

**Work.**
- Rows are grouped by category, with the label printed once per group:
  - Event campaigns · Promotional ad creative (four-up)
  - Video creative | Inventory advertising
  - New car lead gen: the VLA at full container width
- Each ad's caption is its own printed headline. The storyboard is "30-second luxury TV storyboard" and the Meta ad is "Still in the market for a pre-owned truck?". The VLA has no headline, so its ad type is its caption.
- Every piece is whole.

**Ledger.** The CTA is "Get a free dealership marketing audit →", which names its destination, plus the inline call link.

**Measured (round 4):**

| Metric | Value |
|---|---|
| `screenshot.mjs` fold IMG area at 1440 | 34% |
| `screenshot1536.mjs` fold IMG area at 1536 | 36% (§3 floor was 37) |
| Wall share at 1440 | 47.4% |
| Type ratio | 6.1 at 1440, 6.3 at 1536 |
| C's own text sizes | 7 (the script's 9 include the consent banner's 14 and the skip link's 16) |
| Animations / gradients / shadows | 0 |
| Fonts | Archivo only |
| `scrollWidth` overflow | none, 320–1920 |

## 13. Round-2 revisions (2026-09-23, after critic FAIL (narrow) and blind rank 1/13, "wins on content, not craft")

**Why.** The round-2 critic failed C on one CORRECTNESS item: the wall's 96px mask sat on whole columns, so captions faded below AA at 1440, 1536 and 320. It also flagged build vocabulary ("Customer-supplied automotive creative", V167) and the question-headline close (V85). The rank judge put C first on content but about 10th on craft. The luxury lead was only 16% of the frame against A's 29%, and the four event ads at 156px read as texture. Where they conflict with §1–§12, the revisions below win.

**Fold (desktop ≥1200).**
- The wall is two things on one top edge (16px under the header):
  - **The lead piece.** The luxury campaign ad is shown whole and sized to the frame: `width: min(100cqw − side − gap, (100cqh − 48px) × 1122/1402)` in the wall's own container units. It measures 462×578 at 1280, 545×681 at 1440, 582×728 at 1536 and 755×944 at 1920. Its caption is "Luxury campaign", the only label in the wall, and it always sits whole above the fold edge.
  - **One side column, 204px.** It holds the portrait window sticker, then an image-only stack (used-car event, wholesale, repo) that runs off the fold's bottom edge.
- **The mask is on the stack only, and the stack holds no text.** No caption can enter the fade at any width. The fade is 64px, not 96, so the last tile's printed headline reads before it fades at 1440 and 1536.
- **The Meta inventory ad is out of the wall at every width.** Cropped to its carousel at 204px, each truck would be about 60px wide: still a fragment. It is shown whole in Work. This also covers "drop Meta from the ≤760 strip".
- The proof list is deleted. It restated the lead, the wall proves it, and it wrapped 2+1.
- Actions: one red pill, then "or call (352) 207-1074" on its own line at every width (`.actions` is a column).
- The H1 stays `clamp(38px, 5.6vw − 8px, 76px)` and the copy column stays `7.25em`. H1 ink → wall clearance is 35px at 1280, 37px at 1440 and 38px at 1536 (V202).

**Phone (≤760).**
- The strip is the lead ad plus its caption on the left and the sticker on the right. No stack and no Meta.
- Below 375px the strip goes 2fr/3fr.
- On phones ≤800px tall the pill comes before the strip, so the fixed bar never sits on it (320×700: pill 304–360, bar 636–700).
- The eyebrow breaks after the slash at ≤480.
- The fixed bar's call number is `nowrap`; below 360px only the number shows. Each bar cell's label is one inline span. As separate flex items, the spaces in "Call (352)…" and "Free audit →" collapsed.

**Work.**
- The "Customer-supplied automotive creative" label is deleted.
- Each piece's caption is its own printed headline over one format fact (aspect ratio or ad format).
- **Page text never restates an ad's offer or financing terms** ("$0 down", "$99/mo", "payments as low as", vouchers). Those are Truth-in-Lending trigger terms that need disclosures (regulated = disclosure). They stay inside the unaltered creative only. The same rule applies to alts.
- Order: the pieces the fold does not show (storyboard | Meta), then the VLA, then the event posters at 2–3× their fold size. The luxury lead is not repeated.
- The VLA is capped at its native 963px, never upscaled, with its caption beside it in the freed column.
- Phones: pieces wrap two-up with `flex-basis ∝ aspect`, so each row justifies to one height. The storyboard and the repo run full width.
- The storyboard's MYNDSET MEDIA mark is left unaltered. It is in the client's own supplied references, and attribution is flagged to the owner by the coordinator.

**Ledger.**
- The column is renamed "Terms", and the Luxury Video cell reads "1 new video each month". This is a C-local transform; `content.ts` is untouched.
- At ≤760, name and price share one line, with "TERMS 3-month commitment · INCLUDES …" as one run under it. The inline labels keep the mapping (V176).

**Close.**
- The H2 is "Start with a free audit. No obligation.", from the verified /lp offer "Free dealership marketing audit and consultation — no cost, no obligation." (content-sources.json line 68, `LpHero.tsx:85`).
- The caps line that repeated the offer is deleted.
- The FAQ is 1px-ruled rows on graphite, not a white card; cards are for objects (SR2).
- C prints the FAQ answer "The supplied work covers…" as "The work covers…" (V167). No claim changed.
- The curly apostrophe is used in "we’ll".
- Path's bottom padding is 48, so the Path → Close gap is 144 and process and offer read as one move.

**Alts and aria.**
- Every alt describes the ad itself: its printed headline and what it shows. None names a dealer, uses "customer-supplied", or restates an offer or financing term.
- The stack is `aria-label="More automotive ad creative"`.

**Measured (final, `bdc-c-fix-r2-3` and `bdc-c-fix-r2-3-1536`; probe = `scratchpad/c-r2-fold.mjs`):**

| Metric | 1280×800 | 1440×900 | 1536×864 |
|---|---|---|---|
| Fold IMG area (`screenshot.mjs` geometry) | — | **36%** (floor 34) | **39%** (floor 37) |
| Lead piece share of the viewport (probe) | 26.1% | **28.7%** (A's plate ≈29%) | 32.0% |
| Type ratio in fold | 5.3 (63.68/12) | **6.1** | **6.3** |
| H1 ink → wall clearance | 35px | 37px | 38px |
| Text inside a masked element | 0 | 0 | 0 |
| C's own text sizes | 7 | 7: 72.64 · 52.56 · 34 · 24 · 20 · 17 · 12 | 7 |
| Animations / gradients / shadows (C's own) | 0 | 0 | 0 |
| Section gaps | — | 144 / 192 / 192 / 144 | same |

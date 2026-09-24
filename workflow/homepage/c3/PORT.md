# C3 port contract: three prototypes become three review routes

Owner decisions, 2026-09-24:
- All three prototype directions go on the review chooser, which makes **five** homepage mockups: A, B, C, D, E.
- All three switch from off-white and yellow to **pure white `#FFFFFF`** and the **logo blue `#0059FC`**.

| Route | Component (named export) | Folder (yours alone) | Prototype source |
|---|---|---|---|
| `/variant-c` | `VariantC` | `src/components/review/variant-c/` | `scratchpad/c3/proto-daylight/index.html` |
| `/variant-d` | `VariantD` | `src/components/review/variant-d/` | `scratchpad/c3/proto-nightfall/index.html` |
| `/variant-e` | `VariantE` | `src/components/review/variant-e/` | `scratchpad/c3/proto-contrast/index.html` |

**Paths.**
- Repo, worktree: `/Users/syedali/dev projects/Gomega Websites/automated builds/BDC promotions c3`. Its branch is `review/homepage-c3-2026-09-24`.
- Scratchpad: `/private/tmp/claude-501/-Users-syedali-dev-projects-Gomega-Websites-automated-builds-BDC-promotions/d54e5a91-e01d-428a-9098-9b8fe28e0cf4/scratchpad/c3`.
- The dev server for the worktree is `http://127.0.0.1:3419`. It is already running, so do not start another. The prototypes are served at `http://127.0.0.1:4455/proto-<key>/index.html`.

**Ownership.** You edit only your own folder in the table. The coordinator owns everything else:
- `src/app/**`, including the route pages, the chooser, `sitemap.ts` and `layout.tsx`
- `content.ts`
- `public/**`
- `scripts/**`
- `next.config.ts`
- A and B, which are locked.

Three builders share this worktree. Never touch another variant's files, never run `git` write commands, and never stop the dev server.

## 1. Palette pass, on the prototype first

Edit the prototype HTML in the scratchpad, after backing it up as `index.pre-palette.html`. It stays the visual reference that the port is diffed against.

- **Light grounds.** Every warm off-white or cream (`#f4f2ee`, `#f7f5f0`, `#faf8f4` …) becomes `#FFFFFF`. Keep structure on white with hairlines (`#E6E8EE`) or a neutral tint surface (`#F5F7FA` at most). Do not bring back a warm tint.
- **The accent.** Every yellow, amber, gold, orange or red accent becomes the logo blue, `--blue: #0059FC`. That covers buttons, highlights, underlines, numerals, focus rings, diagram strokes and chips.
  - Hover and active: `#0047CC`.
  - A tint surface: `#EEF3FF` (or `rgba(0,89,252,.08)` on dark).
  - White text on blue measures 5.48:1, so it passes.
- **Blue on dark.** On a near-black ground the logo blue is only 3.5:1.
  - Use `#0059FC` for fills and for text ≥ 24px.
  - Small blue text on dark uses the same-hue tint `#6F9BFF`, about 7:1.
- **Neutrals.** Warm greys become neutral cool greys. On white, text is `#0B1220`, secondary `#4A5263` and tertiary `#6B7280`. Recheck every pairing at ≥ 4.5:1.
- **Dark grounds** (Nightfall; the dark bands in Contrast) may stay dark. Their text becomes white `#FFFFFF`, with secondary `#B4BCCB`.
- **Exempt.** The client's creatives and photographs are never recoloured. The logo PNG is unchanged.

When the pass is done, recapture the prototype:
```
node /Users/syedali/.claude/design-psyche/scripts/screenshot.mjs <proto index.html> --name bdc-c3-<key>-blue
node "<repo>/workflow/homepage/scripts/capture.mjs" http://127.0.0.1:4455/proto-<key>/index.html <scratch>/proto-<key>/shots/blue-2560-full.png --w 2560 --h 1440 --dpr 1
```
Run each as a bare command with the sandbox disabled.

## 2. Port to Next.js 16.2.10

This Next is newer than your training data. Before writing code, read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` and `font.md`.

- **Structure.**
  - Split the page into section components, 1–3 sections per file, each file under 400 lines.
  - Use CSS modules, one per file group, with `VariantX.tsx` as the root.
  - TS strict: no `any`, and explicit `ReactElement` return types on exports.
  - Delete everything else in your folder. The old C's `Bits.tsx`, `Ledger.tsx`, `ads.ts`, `proof-wall.module.css`, `*.module.css` and so on are obsolete.
- **Tokens.** Put the tokens and fonts on the root wrapper class. The root layout sets body `#080b12`, Manrope and a Tailwind preflight reset. Your wrapper must therefore set:
  - `background`, `color` and `font-family`;
  - `min-height: 100%`;
  - explicit margins, list styles and heading sizes for everything you use.
  An element rendered outside the wrapper gets no tokens (V200), so keep the fixed mobile bar inside it.
- **Fonts** come from `next/font/google`, loaded in `VariantX.tsx` only, as CSS variables on the wrapper. Use the same families as the prototype, unless it uses one this project forbids; the prototype brief already banned them.
- **Images** use `next/image`.
  - **Photo:** `/images/design/shared/photo-night-showroom-retouched.jpg`, 3840×1973. It is optimised (default quality), and the hero uses `preload`; `priority` is deprecated in Next 16. `sizes` must describe the real rendered width, including cover-scaling.
  - **Creatives** in `/images/design/shared/`, always `unoptimized`, never rendered wider than their crisp CSS width:

    | File | Native size | Max CSS width |
    |---|---|---|
    | `work-luxury-campaign.webp` | 1122×1402 | ≤ 560 |
    | `work-used-car-event.webp` | 1086×1448 | ≤ 540 |
    | `work-wholesale-public.webp` | 1122×1402 | ≤ 560 |
    | `work-meta-inventory.webp` | 1090×596 | ≤ 460 |
    | `work-google-vla.webp` | 963×509 | ≤ 420 |

  - **/lp photos:** `/lp/bdc-audit-consultation.webp` and `/lp/bdc-inventory-production.webp`, 1248×832, ≤ 620 CSS. They get no per-photo caption (see §4).
  - **Logo:** `/images/design/shared/bdc-logo-2026.png`, 1254×749, dark ground only.
- **Copy** is exactly the prototype's, since it was drawn from `scratchpad/c3/VERIFIED-COPY.md`.
  - Import `auditHref`, `phoneHref` and `phoneDisplay` from `../content`, and use `serviceOptions`, `growthSteps` and `faqItems` wherever the prototype prints those lists.
  - No new claims.
  - The footer carries the one-line photo disclosure given in §4.
- **Accessibility.**
  - Exactly one `h1`, with headings in order.
  - Targets ≥ 44px and a visible `:focus-visible`.
  - `prefers-reduced-motion`.
  - No horizontal overflow at 320, 390 and 1024.
  - A fixed mobile bar at ≤ 720px, with matching bottom padding on the page.
  - The FAQ uses `<details>`/`<summary>` or stays open.
  - Every `figcaption` line is `display:block`.
  - Put `min-width:0` on grid and flex media columns.

## 3. Prove the port is faithful

- Capture the route, where `x` is c, d or e:
  ```
  node /Users/syedali/.claude/design-psyche/scripts/screenshot.mjs http://127.0.0.1:3419/variant-x --name bdc-c3-route-x
  node "<repo>/workflow/homepage/scripts/capture.mjs" http://127.0.0.1:3419/variant-x "<repo>/workflow/homepage/c3/shots/x/2560-full.png" --w 2560 --h 1440 --dpr 1
  node "<repo>/workflow/homepage/scripts/capture.mjs" http://127.0.0.1:3419/variant-x "<repo>/workflow/homepage/c3/shots/x/1440-fold-dpr2.png" --w 1440 --h 900 --dpr 2 --fold
  ```
- Compare against the palette-passed prototype captures at 1440, 390 and 2560. Open both images and diff them band by band (V199). The only acceptable differences are font rasterisation and the consent banner. Fix every geometry, spacing, type or colour difference.
- Gates, all run from the repo root:
  - `node workflow/homepage/scripts/density.mjs x http://127.0.0.1:3419` must print `0 soft`;
  - `npx tsc --noEmit` must report 0 errors in your files;
  - `npx eslint src/components/review/variant-x` must be clean;
  - measure overflow at 320 and 390 on the live DOM (`scrollWidth`).
- Write `workflow/homepage/c3/notes/<x>-port.md` with:
  - the sections, with their count;
  - the tokens after the palette pass;
  - the files;
  - the gate outputs, verbatim;
  - the screenshot paths;
  - the differences left, with reasons.

## 4. Blind-judge findings: fix these in every review round

Three independent blind judges ranked the three prototypes against hvacfound, Collective, Stripe Atlas and Designjoy, 2026-09-24.
- **Owner lens:** Daylight 1st of 7 (above hvacfound), Nightfall 3rd, Contrast 4th.
- **Dealership-GM lens:** Daylight, then Nightfall, then Contrast. Only Stripe Atlas and Collective ranked above them, on real third-party proof.
- **Craft lens:** Nightfall 3rd, Contrast 4th, Daylight 5th.

The findings the judges agreed on override anything above that conflicts with them.

**All three routes:**
1. **Remove every per-photo "Illustrative photograph" chip or caption.** All three judges said the chips and the "AI-generated" footer make the page read as having nothing real to show, which is the owner's V207 reflex.
   - Honesty stays in one quiet line in the footer legal row: `Photographs are illustrative and do not show a BDC Promotions client or location.`
   - Alt text must describe the scene, never call it BDC's own.
2. **Remove internal guardrail lines printed as public copy.**
   - Delete B's design note `No unverified dealership count, ad-spend total, client logos, or outcome statistics.` everywhere.
   - Delete the three "standards rules": `Show only customer-approved work and attribution`, `Use testimonial video only after transcript and publication approval` and `Never imply guaranteed lead volume, CPL, sales, ROAS, or show rate`.
   - The proof section keeps its heading, the positioning line and the /lp proof-standard items.
   - The non-guarantee Q&A beside Pricing stays, because it is the customer-facing version.
   - The route must still have **at least 13 sections**. If one section is emptied, merge it into a neighbour and do not pad.
3. **Buttons and links use sentence case** (`Get my free dealership audit`). There is no Title Case anywhere.
4. **At 2560 nothing breaks the content column** unless it is a deliberate full-bleed ground or photo. Work grids and CTA bands stay on the container.
5. **The accent marks one idea per headline**, at most one phrase, never most of a headline.

**C · Daylight:**
- Remove the hand-drawn swash under the headline accent.
- At 1440×900 the fold is 466px of text on the ground and the photo is cut by the fold. Tighten the hero so the photograph starts higher and owns more of the fold. The photo card must sit on the container or the page gutter consistently, not 16px from the edge while all content sits at 1200.
- Section labels alone do not separate sections. Keep the rounded dark/light containers and make each section's structure visibly different.

**D · Nightfall:**
- The Work area has two stacked section titles ("Automotive creative built for the real feed", then "Our work" about 500px lower). Merge them into one head.
- Simplify the gap graphic: no drip dots or pendulum line, and make the struck items legible (≥ 15px).
- The two-tone grey/black statement paragraph becomes one colour.
- **Keep** the ads framed as "Sponsored" feed posts; it was judged the best work framing of the three.

**E · Contrast:**
- **Mobile bug.** The "Source work example" eyebrow overlaps the luxury ad, and the 4:5 ad overruns its inner panel by about 110px. Fix both at 390 and 320.
- Remove the card nested inside a card in Work, which doubles every border.
- The ground flips dark/light 7 times. Group the sections so the page alternates at most 4–5 times.
- The full-accent $5,000 slab is harsh. Keep the bracket connector from the two $2,500 plans into the bundle; it was judged the most distinctive module. Make the bundle card calmer: a blue outline or tint, or dark with a blue accent.

# E · Contrast: port notes (`/variant-e`)

- **Source:** `scratchpad/c3/proto-contrast/index.html`, after the palette pass. The backup is `index.pre-palette.html` and the scripted pass is `palette.py`.
- **Target:** `src/components/review/variant-e/`, which exports `VariantE`.
- **Result:** the route matches the prototype in geometry at 320, 390, 800, 1024, 1280, 1440 and 2560. Every matched element box agrees within 0.3px, and page heights are identical. The pixels left over come from image resampling, the retouched hero file and the consent banner.

## Sections: 13 (`main section` = 13 in the live DOM; header and footer not counted)

| # | Section | Ground | File |
|---|---|---|---|
| 01 | Hero: night-showroom photo, H1, lead, CTA + call, offer line, 3-line proof list | photo | `Hero.tsx` |
| 02 | Pillar strip, docked 64px over the hero (Fast / Focused / Social / Results) | white | `Hero.tsx` |
| 03 | The Appointment Gap: struck items → arrows → "build toward" column | white | `Gap.tsx` |
| 04 | Featured work: luxury campaign in a frame + well, spec list | ink band | `Work.tsx` |
| 05 | Gallery: event + wholesale portraits, Meta + VLA landscapes, "See how the process works" | ink band | `Work.tsx` |
| 06 | Services: 5/7 split, production photo + 5 ruled rows | white | `Process.tsx` |
| 07 | Path: 5-node timeline, Scroll → Showroom (`growthSteps`) | white | `Process.tsx` |
| 08 | Follow-up: `faqItems[2]` as H2 + answer, and the Lead → BDC staff / AI tools → Appointment diagram | white | `Process.tsx` |
| 09 | Pricing: 3 plans, merge bracket into the blue lane card, Terms card (`serviceOptions`, `faqItems[3]`, `faqItems[0]`) | ink | `Pricing.tsx` |
| 10 | Proof standard: evidence card + standards rules + positioning | white | `Proof.tsx` |
| 11 | Free audit: consultation photo + 3-node step rail | white | `Proof.tsx` |
| 12 | FAQ + who it's for: call card + 4 `<details>` (2 open) | white | `Close.tsx` |
| 13 | Final CTA: contained ink card + recap list | white | `Close.tsx` |

Chrome (`Chrome.tsx`): a sticky ink header, the ink footer with the illustrative-photo disclosure, and the fixed mobile bar at ≤720 ("Free audit" / "Call"). The mobile bar sits inside the token wrapper, and the footer carries a matching 108px bottom padding.

## Tokens after the palette pass

White + logo blue. Warm stone becomes cool neutral. The dark bands stay dark.

| Token | Before | After | Notes |
|---|---|---|---|
| `--paper` | `#FAFAF9` | `#FFFFFF` | pure white ground |
| `--card` | `#FFFFFF` | `#FFFFFF` | |
| `--mist` | `#F3F2F0` | `#F5F7FA` | neutral tint surface |
| `--accent` | `#FF5A1F` | `#0059FC` | fills; white text on it is 5.48:1 |
| `--accent-hi` | `#FF7440` | `#0047CC` | hover/active |
| `--accent-ink` | `#C2410C` | `#0059FC` | blue text on light: 5.48 white, 5.09 mist, 4.93 tint |
| `--accent-d` | none | `#6F9BFF` | new; small blue text and icons on ink, 6.96:1 |
| `--tint` | `#FFF3EC` | `#EEF3FF` | the "build toward" column, FAQ ± |
| `--ink` / `--ink-2` / `--ink-3` | `#0C0A09` / `#1C1917` / `#292524` | `#0B1220` / `#151C2B` / `#1F2737` | ink = text colour on white |
| `--tx` / `--mu` / `--dim` | `#0C0A09` / `#57534E` / `#78716C` | `#0B1220` / `#4A5263` / `#6B7280` | 18.6 / 7.85 / 4.83 on white |
| `--tx-l` / `--mu-l` | `#FFF` / `#A8A29E` | `#FFFFFF` / `#B4BCCB` | 9.8:1 on ink |
| `--hi-l` / `--mid-l` | `#E7E5E4` / `#D6D3D1` (hard-coded) | `#E8ECF2` / `#CDD3DD` | cool equivalents; keep the hierarchy |
| `--line` / `--line-2` / shadow | `rgba(12,10,9,…)` | `rgba(11,18,32,…)` | ≈ `#E7E7E9` hairline on white |
| hero scrim | `rgba(8,7,6,…)` | `rgba(7,11,20,…)` | same alphas |

Rules that changed with the colour swap:
- Text on the blue fills (buttons, the lane card, the last ring node, the skip link) is white; the prototype used ink text, which would be 3.4:1 on blue.
- The lane card's secondary text uses `--tint` (4.93:1).
- Small blue on ink uses `--accent-d`. This covers:
  - `.ink .label`
  - the final-card label and recap ticks
  - the footer, call-card and final-card link hovers
- The lane card gets a white `:focus-visible` ring, because the blue ring vanished on the blue card. The prototype had the same invisibility with orange on orange.

Unchanged: Geist + Geist Mono, spacing, radius, the 7-step type ramp, and the 1200 container.

## Files

`src/components/review/variant-e/`. Every file is under 160 lines. Every other file in the folder was deleted: the only prior file was the placeholder `VariantE.tsx`, which was replaced.

**Components:**
- `VariantE.tsx`: the root. It loads `next/font/google` Geist and Geist_Mono as `--e-sans` and `--e-mono` on the wrapper, and sets the section order.
- `Chrome.tsx`: Header, Footer, MobileBar.
- `Hero.tsx`: Hero, Pillars.
- `Gap.tsx`
- `Work.tsx`: featured work and the gallery.
- `Process.tsx`: Services, Path, FollowUp.
- `Pricing.tsx`
- `Proof.tsx`: Proof, Audit.
- `Close.tsx`: Faq, Final.
- `icons.tsx`: phone, arrow, check and shield line icons.

**CSS modules:**
- `base.module.css`: tokens on `.root`, type, buttons, grounds, heads and ring nodes.
- `chrome`, `hero`, `gap`, `work`, `process`, `pricing`, `proof` and `close` `.module.css`.

Port mechanics worth knowing:
- **Cross-module overrides.** A section element carries the shared class plus a local class, and the override is written with two classes, for example `.hero .heroLead`. No rule depends on the order the modules load in. Where a prototype pair tied on specificity, the prototype's rule order is kept inside the module; `.feat .well` then `.frame .well` is one example.
- **Global styles.** `globals.css` sets `h2, h3 { font-family: Barlow Condensed; font-weight: 700 }`. `.root h2, .root h3 { font-family: inherit }` neutralises it, because this page is Geist only.
- **Smooth scrolling.** `globals.css` sets `html { scroll-behavior: smooth }`. `html:has(.root) { scroll-behavior: auto }` restores the prototype's behaviour. With smooth scrolling, screenshot.mjs's scroll loop never reached the bottom, so the lazy images stayed blank in its captures.
- **Anchors.** `.root [id] { scroll-margin-top: calc(var(--hdr) + 16px) }` replaces the prototype's `html { scroll-padding-top }`.
- **Images:**
  - The creatives are `unoptimized` at their native size, rendered at ≤ their crisp caps: luxury 440, event 330, wholesale 352, Meta 460, VLA 420.
  - The hero is `fill` + `preload`, with `sizes` measured in the route (the table below).
  - The /lp photos and the logo are optimised. Each pins its true `aspect-ratio` (3/2 and 1254/749), because a resized file rounds its height and shifted everything below by 0.3–0.4px.
- **Copy.** It comes from `../content`:
  - `auditHref`, `phoneHref` and `phoneDisplay` everywhere;
  - `growthSteps` in the path;
  - `serviceOptions` in pricing; each price string is split into amount + "/ month";
  - `faqItems[2]` in follow-up;
  - `faqItems[3]` and `faqItems[0]` in the Terms card;
  - `faqItems[1][0]` as the creative question.
  The creative answer stays the prototype's verified short form (A:72), not content.ts's "The supplied work covers…".

Hero `sizes`. This is the rendered width of the cover-scaled photo, measured in the live route:

| Viewport | Box (w × h) | Rendered image width |
|---|---|---|
| 320–406 | w × 260 | 506 |
| 500 | 500 × 320 | 623 (~125vw) |
| 656–720 | w × 420 | 817 |
| 721–1080 | w × 745–778 | 1449–1515 |
| 1180 | 1180 × 608 | 1183 |
| ≥1280 | width-bound | 100vw |

The resulting attribute is `(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw`.

## Fidelity proof (§3)

**Method.**
- `scratchpad/c3/proto-contrast/portdiff.mjs` loads the palette-passed prototype (`:4455`) and the route (`:3419`) at the same viewport and DPR.
- It diffs every element's box, font size, weight, colour, background and family, keyed by tag + text.
- It also pixel-diffs 400px bands of the two full-page captures.
- Only in this tool, the consent banner is hidden.

The reports are in `workflow/homepage/c3/shots/e/fidelity/diff-<w>.txt`.

| Viewport | Page height proto → route | Elements matched / differing | Pixel bands, worst |
|---|---|---|---|
| 1440×900 @1 | 10970 → 10970 | 365 / 11* | 0.08% (hero photo) |
| 390×844 @2 | 14924 → 14924 | 337 / 11* | 0.60% (hero photo) |
| 2560×1440 @1 | 11568 → 11568 | 365 / 11* | 0.07% |
| 1280×800 @1 | 10543 → 10543 | 365 / 11* | 0.07% |
| 1024×768 @1 | 13819 → 13819 | 360 / 11* | 0.28% |
| 800×900 @1 | 13871 → 13871 | 360 / 11* | 0.15% |
| 320×700 @2 | 16175 → 16175 | 337 / 11* | 0.62% |

\* The 11 "differing" elements differ only in the CSS `color` of `img` and `hr`, which has no visual effect. For images, next/image sets `color: transparent`. For the `hr`, the border colour is set explicitly. No box differs by more than 0.3px, and no font, weight, text colour or background differs.

The contact sheets were also opened and checked by eye:
- `portdiff/b0.jpg`, `b800.jpg`, `b10800.jpg`, `b390-4000.jpg`
- `route-390-cols.jpg`, `route-2560-cols.jpg`
- `feat-390-route-fixed.jpg`

The screenshot.mjs outputs were pixel-diffed against `bdc-c3-contrast-blue`:
- desktop-full: worst 0.58%, in the hero band;
- laptop-full: 0.60%;
- mobile-full: 7.82% in the first 800px (hero photo + consent banner), every other band ≤ 0.22%.

Found by looking and by an "escapes its parent" sweep (`escape.mjs`). Each was **fixed in the prototype and the port identically**, so the two stay diff-equal:
1. **≤720, featured card.** The tray's `.frame .well { height: 300px }` also hit the featured well, so the 347px-tall luxury ad overflowed onto "SOURCE WORK EXAMPLE". The fix is `.frame.feat .well { height: auto; padding: 32px 24px }`, which also restores the featured well's own mobile padding that the tray rule was overriding. The mobile page grows by 111px.
2. **Lane card, 721–800 and 1180–1280.** The nowrap "Get my free dealership audit" button overran its column; at 721 it spilled past the blue card's edge. The fix is `grid-template-columns: minmax(min-content, 1fr) minmax(min-content, 1fr)`. It changes nothing at 1440 or 2560, where both columns are 324.

After both fixes, `escape.mjs` is clean at 320, 390, 600, 720, 721, 800, 960, 1024, 1080, 1180, 1280, 1440 and 2560.

## Gates (verbatim)

`node workflow/homepage/scripts/density.mjs e http://127.0.0.1:3419`:
```
0 soft image render(s)
```
Every image is `ok` at 1536, 1440, 1280 and 390 @2x. The lowest served/needed ratio is 1.02: the audit photo, served at w=1200 for a 588px box at @2x, after `sizes` was tightened to 588px. The gate's floor is 0.95.

`npx tsc --noEmit -p . --incremental false`:
- Exit 0.
- 0 `error TS` lines in total, and 0 in `variant-e`.
- `--incremental false` stops tsc writing `tsconfig.tsbuildinfo` into the shared worktree. The sandbox also refused that write, with EPERM.
- Earlier in the session, the only error was the C builder's transient missing `VariantC`.

`npx eslint src/components/review/variant-e`:
```
(no output) exit 0
```

**Overflow on the live DOM** (`documentElement.scrollWidth` / `clientWidth`):
```
320  scrollWidth 320  clientWidth 320  body 320
390  scrollWidth 390  clientWidth 390  body 390
1024 scrollWidth 1024 clientWidth 1024 body 1024
1440 1440/1440 · 2560 2560/2560
```

**Accessibility probe** (320, 390, 1024, 1440, 2560):
- 1 `h1`, 40 headings, 0 skipped levels;
- 0 visible links, summaries or buttons under 44px;
- the mobile bar is `grid/fixed`, 69px tall, at ≤720, and the footer's bottom padding is 108px there;
- figcaption lines compute to block, grid or flex children.

**Hero text contrast** on the real photo + scrim pixels (`contrast-route.mjs`, text hidden):

| Width | Lead | Offer | Proof list | H1 |
|---|---|---|---|---|
| 1440 | 14.37 | 12.10 | ≥ 10.02 | 7.81 |
| 1280 | 10.22 | 11.93 | ≥ 7.57 | 6.62 |
| 2560 | ≥ 12.7 | ≥ 12.7 | ≥ 12.7 | ≥ 12.7 |
| 390 | 15.79 | 12.44 | hidden | 18.72 |

The table gives p99 values. The eyebrow sits on its own chip; its worst pixel is 4.62, at the chip's corner.

## Screenshots

- Route, design-psyche: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-e/`. Files: `desktop-full.png`, `desktop-fold.png`, `laptop-full.png`, `laptop-fold.png`, `mobile-full.png`, `mobile-fold.png`, `styles.json`, `auto-flags.txt`. Flags: none. Inertness: none.
- Route, captures: `workflow/homepage/c3/shots/e/`. Files: `2560-full.png`, `1440-fold-dpr2.png`, `1440-full.png`, `390-full-dpr2.png`, plus `fidelity/diff-*.txt`.
- Prototype after the palette pass:
  - `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-contrast-blue/`;
  - `scratchpad/c3/proto-contrast/shots/blue-2560-full.png` and `blue-1440-fold-dpr2.png`.

## Differences left, with reasons

1. **Hero photo pixels.** The route uses the mandated `/images/design/shared/photo-night-showroom-retouched.jpg`, served through the optimiser. The prototype uses `assets/photo-night-showroom.jpg` at full size. Geometry is identical; the pixel difference is ≤ 0.62% of a band.
2. **Resampled rasters.** The /lp photos and the logo come from the optimiser (`w=640/750/1080/1200`), not the original files, which leaves sub-0.1% pixel noise. The wholesale creative is `work-wholesale-public.webp` instead of the prototype's `ad-wholesale-public.png`; both are 1122×1402 at the same box, and the creative content is unchanged.
3. **Consent banner.** The layout's banner shows in the route captures. `capture.mjs` clicks "Got it" before React hydrates in dev, so the click is lost. This is allowed by §3.
4. **Font rasterisation.** Geist is self-hosted by next/font in the route and loaded from the Google Fonts CSS API in the prototype. No measured box differs by more than 0.3px.
5. **screenshot.mjs "pure #FFFFFF" flag.** It fires on the prototype and not on the route, because the route's `body` stays the layout's `#080b12` under the white wrapper. Pure white is the owner's 2026-09-24 decision (PORT §1), so the flag is dismissed for both.
6. **Lane card at 1081–1110.** The two min-content columns total up to 25px more than the card's content box, so the lane button reaches 22px from the card edge, inside the padding. It no longer leaves the card. Keeping it on one line at that width would mean shrinking the lane padding just for this band; that was not done.
7. **Skip links.** The route keeps the prototype's own "Skip to content" link, which targets `#main`. The layout's "Skip to main content" link still comes first.
8. **Carried from the prototype NOTES, unchanged:**
   - combined-plan emphasis by composition only;
   - "Illustrative photograph" wording rather than "Illustrative image";
   - the email-domain mismatch;
   - full-page mobile captures that draw the fixed bar mid-page.

---

## Fix round 1 (critic round 1: FAIL → fixes, 2026-09-24)

This section supersedes the section table, the chrome description and the "differences left" above wherever they conflict. After this round the route **deliberately diverges from the prototype** (PORT §4 review findings override §3 fidelity), so the round-0 diff-equal proof no longer applies. The prototype was left as the palette-pass reference and was not edited. Backup of the round-0 folder: `scratchpad/c3/e-backup-r1/`.

### Page order and grounds: 13 sections, 4 ground changes

| # | Section | Ground | File |
|---|---|---|---|
| 01 | Hero | photo / ink | `Hero.tsx` |
| 02 | Pillar strip (docked 64px over the hero, the page's only shadow) | white | `Hero.tsx` |
| 03 | The appointment gap | white | `Gap.tsx` |
| 04 | Services (5/7 split) | white | `Process.tsx` |
| 05 | Process: 5 numbered columns under 2px rules | white, ruled | `Process.tsx` |
| 06 | Follow-up diagram | white, ruled | `Process.tsx` |
| 07 | Featured work | **one ink band** | `Work.tsx` |
| 08 | Gallery | ink band | `Work.tsx` |
| 09 | Pricing | ink band, ruled | `Pricing.tsx` |
| 10 | Proof standard | white | `Proof.tsx` |
| 11 | Free audit | white, ruled | `Proof.tsx` |
| 12 | FAQ + who it's for | white | `Close.tsx` |
| 13 | Final CTA, the top of the ink close; the footer continues it under one `--line-d` hairline | ink | `Close.tsx` + `Chrome.tsx` |

Grounds, measured by the probe at x=8 down the page at 1440: `0:ink → 740:white → 3500:ink → 6720:white → 9040:ink` (then the layout's consent banner). That is 4 transitions at every width tested (320, 390, 800, 1024, 1280, 1440, 2560).

Rhythm, as tokens in `base.module.css`:
- `--sp-1` = clamp(40, 4.5vw, 64): a related pair (`.ruled`) gets a hairline with 64 on each side. Pairs: services→process, process→follow-up, gallery→pricing, proof→audit.
- `--sp-2` = clamp(56, 6.7vw, 96): unrelated white neighbours, open. Pairs: pillars→gap, gap→services, audit→FAQ.
- `--sp-3` = clamp(72, 9vw, 128): only at a ground edge (`.ground` padding, final CTA top).
- Featured → gallery stays at 24 (one gallery).

Measured content-to-content at 1440: pillars→gap 96, gap→services 96, services→process 64|rule|64, process→follow-up 64|rule|64, follow-up→work 128+128 (band edge), work→gallery 24, gallery→pricing 64|rule|64, pricing→proof 128+128, proof→audit 64|rule|64, audit→FAQ 96, FAQ→final 128+128.

### What changed, by finding

1. **Chips and the AI footer (§4.1, V207).** Deleted the three "Illustrative photograph" chips and the `.chip`, `.illus`, `.svcChip` and `.auditChip` rules. The footer legal row now reads exactly `Photographs are illustrative and do not show a BDC Promotions client or location.` at 12px `--mu-l`. The chip at 2560 went with the chip.
   - **Beyond the list:** the alt text no longer calls the photos BDC's own.
     - Services: `A videographer with a camera rig filming vehicles inside a lit showroom at night`.
     - Audit: `Two people in business suits talking across a meeting table, a laptop with charts between them`.
     - Hero: `Night view of a glass-fronted car showroom with vehicles lit inside`.
   - **Beyond the list:** deleted the audit photo's figcaption ("Inside a free audit consultation…"). PORT §2 says the /lp photos get no per-photo caption, and without the chip that caption presented an AI photo as a real BDC consultation.
2. **Guardrail lines (§4.2).** Deleted the three rules, `No unverified dealership count…`, the "Proof with standards / Proof you can inspect. Promises you can trust." block that headed them, and `ShieldIcon`.
3. **Card inside a card in Work (§E).** `.frame` is gone. Each piece is one `.well` (ink-2, radius 24, padding 48), with its caption 16px below on the band itself.
4. **$5,000 slab (§E, V36).** `.lane` is ink-2 with a 2px `--accent` edge. The button is the standard blue `btnAccent`, so the page's only black pill button is gone. "/ month" and the term are `--mu-l`, and the $5,000 stays white at `--t-d1`. The bracket is unchanged at >1080.
5. **Proof: four container styles.** The three proof items are now a borderless list with 1px rules in cols 1–7 (h3 22/600, body 16 `--mu`, no icons). The positioning statement sits in cols 9–12 under a 2px blue top rule, the hero's proof device, with "During your free audit…" 16px below it. The section still counts.
6. **Steppers (V47/V71).**
   - Process: the head is left-aligned in cols 1–7. The card is removed. The five steps are columns under 2px top rules (grey `--line-2` for 01–04, blue for 05), with `--t-d2`/600 numerals in `--dim`. "Scroll" and "Showroom" are kept as end labels.
   - Audit: "01", "02" and "03" are 14/600 blue labels above each title, on 1px rules. `.node` and `.nodeEnd` are deleted.
7. **Uniform rhythm.** See the rhythm above.
8. **Flips.** Six flips became 4 transitions. Work and Pricing share one ink band, and the final CTA is full-bleed ink merged into the footer. The FAQ call card is `--tint` with dark text (mail `--mu`, 7.1:1).
9. **Right-column starts.** Section-level right columns now start only at col 7 (732 at 1440) and col 9 (936).
   - Hero proof: col 10 → 9.
   - Follow-up diagram: col 6 → 7 (588 wide), and its grey panel is removed.
   - Audit steps: col 8 → 7.
   - Final recap: → 7, the same x as the footer's Services column below it.
   - Probe result, section blocks at 1440: 732 ×13 and 936 ×9. The remaining x positions are inside diagrams: 784 is the gap diagram's tinted column, and 909 and 1159 are follow-up diagram nodes.
10. **2560.**
    - Hero: `min-height: min(max(600px, 100svh − hdr − dock-v), 1000px)`, so it is 1000px tall at 2560×1440.
    - At ≥1920, `--max: 1320px` and `--t-d1: 72px`.
    - The H1 now sits in its own full-width row (`.top`, cols 1–12, max 13em), so at 72px it stays on 2 lines. The lead and CTAs sit in cols 1–8 and the proof in cols 9–12.
11. **Type.**
    - `Geist_Mono`, `--f-mono` and `.mono` are removed. The commitment lines are Geist 14/500 `--mu-l`, and the four format chips and the Format row are deleted.
    - Accent on "receipts" only.
    - Sentence case in the source for every label, link and plan name:
      - labels: "The appointment gap", "Automotive marketing services", "Our proof standard", "How the free audit works", "Free dealership marketing audit";
      - links: "Privacy policy", "Cookie policy";
      - footer brand line.
    - Plan names are sentence-cased in `Pricing.tsx` with `sentence()`, which keeps all-caps words, because `content.ts` is coordinator-owned. The result: "Lead generation", "Live BDC agent team", "Luxury video", "Lead gen + BDC team".
    - Pillars: `2.1fr 4fr`, not the critic's 1.6fr. At 1.6fr the heading cell was 279px of text, and the heading's natural width is 620px at 22px, with its shortest two-line split "Built for booked appointments," at ~351px. 2.1fr gives 357px, and it now runs 2 lines at 1280, 1440 and 2560.
12. **Mobile.**
    - (a) The hero proof shows at ≤720 as a 16/600 list with rules, 24px under the offer line.
    - (b) Pricing keeps reading order in the DOM: plan 1, plan 2, bracket, bundle, $750 plan, terms. The grid places the $750 plan beside plans 1–2 above 1080. At 721–1080 the horizontal bracket now shows, joining two half-width cards into the full-width bundle; it was hidden before. At ≤720 the bracket is a 2px blue rail in a 16px left gutter, from the centre of plan 1 through plan 2 into the bundle, with a tick into each card. `order:-1` is gone.
    - (c) Gallery: no scroller. The two portrait ads sit side by side and the two landscape ads run full width, so all four are visible, with captions wrapping.
    - (d) Spec `dt` is 72px at ≤720, so "Event campaigns" is one line at 320.
    - **Beyond the list:** the bundle button's wrapped label is centred at 320.
13. **Imagery.**
    - Consultation photo at cols 1–5, 486px at 1440.
    - Meta 460 → 400 and VLA 420 → 380.
    - Header logo 104 → 120 (104 at ≤720, where the header is 68px).
    - /lp photo `sizes` gains `(min-width: 1920px) 536px`, which is their real width at 2560.

**AI-tell flags:**
- The shadow is now only on the Pillars strip; the Gap card has a 1px `--line` border.
- Mono is removed.
- Icons: the proof, shield and recap check icons are removed. `CheckIcon` and `ArrowIcon` are deleted, and `icons.tsx` keeps only `PhoneIcon`. The follow-up diagram keeps its node icons, because they are the diagram.
- Rhythm and padding are covered above.

**Beyond the list, other:**
- Nav order follows the page: Services, Process, Work, Pricing, FAQ.
- The gallery's "See how the process works" link is removed, because Process now comes before Work and it would point back up.
- The footer's Pages column is removed. It duplicated the header nav and was already hidden at ≤720. The footer is brand in cols 1–6, Services in 7–9 and Contact in 10–12.
- The follow-up Appointment node is tinted `--tint`, so the diagram's outcome carries the colour.
- `.btnInk`, `.u`, `.headC`, `.chip` and `--pad-w`/`--pad-in` are deleted. No dead classes remain: a script cross-checked every module class against the TSX, and the only hits are `r1`–`r3`, which are used through `s[r]`.

### Deliberately not changed, or changed differently, and why

1. **Positioning statement at 22/600, not 28/600.** At 28, screenshot.mjs flagged `8 distinct font sizes (target ≤7 site-wide, ≤4 per viewport)`: 28 would have been a one-off 8th step. It uses the ramp's h3 step, still set apart by its 2px blue rule. After the change the flags are none.
2. **Process numerals at `--t-d2` (43.2 at 1440), not 40.** This keeps the 7-step ramp.
3. **Proof item titles at `--t-h3`** (clamp 19–22, so 22 at 1440, 19 on mobile), not a fixed 19. This is the ramp.
4. **Featured well in cols 1–6 with its copy from col 7, not 1–7 / 8–12.** Copy at col 8 would add a third right-column start (834), which defect 9 forbids. Cols 1–6 / 7–12 also put every edge in the band on the gallery's 2-up grid below: the well is exactly the left gallery well, and the copy starts on the right gallery well's edge.
5. **No intro in the Process head's cols 9–12.** The only verified path intro, `Choose the pieces your dealership needs or connect the full operating lane.`, is already Pricing's aside, and repeating it would be filler. No new copy was written.
6. **Mobile eyebrow tail "/ creative to appointment" is still hidden at ≤720.** The 46-character line cannot sit in the one-line pill below ~400px. The fold's proof now comes from the 3-line list, which was finding 12a's actual point.
7. **Mobile gallery is not a 2×2 grid of 160px wells.** In a 2×2 grid the Meta and VLA screenshots would be 137px wide and illegible. Portraits are side by side (137×183 at 390), and landscapes are full width (318px).
8. **Skip link.** The variant's own "Skip to content" (→ `#main`) is kept. The layout's link targets `#main-content`, which wraps this page's header, so without ours there is no way to skip the nav. The duplicate, its Manrope styling (V200) and the cookie banner's 19px "cookie policy" link belong to the coordinator (`layout.tsx`).
9. **The consultation photo is kept** at 486px, as the critic allowed ("if the owner reacts to it, drop it").
10. **The luxury plan and the terms card share a row at 721–1080**, and the plan card stretches to the terms card's height. This keeps the row's bottom edges aligned.
11. **BRIEF.md hard constraint 4** (an "Illustrative photograph" chip on each AI photo, plus the long AI-generated footer line) contradicts PORT §4.1. PORT §4 says its judge findings "override anything above that conflicts", and it is the later owner decision, so PORT was followed.
12. **Hero `sizes` is unchanged.** The hero's geometry below 1184px did not change, because the cap only binds when the viewport is taller than ~1190px. At 2560×1440 the photo box is 2560×1000, which is width-bound, so `100vw` is still exact. The density gate confirms it below.

### Gates (verbatim)

`npx tsc --noEmit -p . --incremental false`: exit 0, empty output. That is 0 `error TS` lines in total and 0 in `variant-e`.

`npx eslint src/components/review/variant-e`:
```
(no output) eslint exit 0
```

`node workflow/homepage/scripts/density.mjs e http://127.0.0.1:3419`:
```
--- e 1536px @2x
 ok  box 1536 need 3072 served 3840 (req w=3840, file 3840) 1.25 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  486 need  972 served 1080 (req w=1080, file 1248) 1.11 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp sizes=""
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp sizes=""
 ok  box  486 need  972 served 1080 (req w=1080, file 1248) 1.11 bdc-audit-consultation.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
--- e 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  486 need  972 served 1080 (req w=1080, file 1248) 1.11 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp sizes=""
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp sizes=""
 ok  box  486 need  972 served 1080 (req w=1080, file 1248) 1.11 bdc-audit-consultation.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
--- e 1280px @2x
 ok  box 1280 need 2560 served 3840 (req w=3840, file 3840) 1.50 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  466 need  932 served 1080 (req w=1080, file 1248) 1.16 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  400 need  800 served 1090 (req w=0, file 1090) 1.36 work-meta-inventory.webp sizes=""
 ok  box  380 need  760 served  963 (req w=0, file 963) 1.27 work-google-vla.webp sizes=""
 ok  box  466 need  932 served 1080 (req w=1080, file 1248) 1.16 bdc-audit-consultation.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
--- e 390px @2x
 ok  box  390 need  780 served 1080 (req w=1080, file 3840) 1.38 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  350 need  700 served  750 (req w=750, file 1248) 1.07 bdc-inventory-production.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-luxury-campaign.webp sizes=""
 ok  box  137 need  274 served 1086 (req w=0, file 1086) 3.96 work-used-car-event.webp sizes=""
 ok  box  137 need  274 served 1122 (req w=0, file 1122) 4.09 work-wholesale-public.webp sizes=""
 ok  box  318 need  636 served 1090 (req w=0, file 1090) 1.71 work-meta-inventory.webp sizes=""
 ok  box  318 need  636 served  963 (req w=0, file 963) 1.51 work-google-vla.webp sizes=""
 ok  box  350 need  700 served  750 (req w=750, file 1248) 1.07 bdc-audit-consultation.webp sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1080px) 620px, (min-width: 1920px) 536px, 486px"

0 soft image render(s)
```

**Overflow and accessibility on the live DOM** (`scratchpad/c3/proto-contrast/fix1probe.cjs`):
```
320  scrollWidth 320  clientWidth 320  | h1 1 | overflowers 0 | targets<44 0 | fams ['Geist']
390  scrollWidth 390  clientWidth 390  | h1 1 | overflowers 0 | targets<44 0 | fams ['Geist']
800  scrollWidth 800  clientWidth 800  | h1 1 | overflowers 0 | targets<44 0
1024 scrollWidth 1024 clientWidth 1024 | h1 1 | overflowers 0 | targets<44 0
1280 scrollWidth 1280 clientWidth 1280 | h1 1 | overflowers 0 | targets<44 0
1440 scrollWidth 1440 clientWidth 1440 | h1 1 | overflowers 0 | targets<44 0 | sizes [12, 14, 16, 18, 22, 43.2, 60.48]
2560 scrollWidth 2560 clientWidth 2560 | h1 1 | overflowers 0 | targets<44 0 | sizes [12, 14, 16, 19, 22, 44, 72]
```
The target count excludes the layout's cookie banner. Its 19px "cookie policy" link belongs to the coordinator.

**screenshot.mjs (`bdc-c3-route-e-fix1`):**
```
[desktop] ok
[laptop] ok
[mobile] ok

Automatic flags:
 none

Inertness flags:
 none
```

**Text contrast on the photo** (the critic's `auditE/contrast.cjs`, rerun):

| Width | H1 line 1, worst | H1 line 1, p5 | Lead, worst | Proof lines, worst | Everything |
|---|---|---|---|---|---|
| 1440 | 3.30 (60px, 3:1 floor) | 13.38 | 11.32 | 9.30 | |
| 2560 | | | | | worst ≥ 7.97 (H1 72px); everything else ≥ 12.84 |

At 390 and 320 every glyph over the photo is ≥ 14.5. The sub-1.5 readings there are from the layout's consent banner, which overlaps the fold. The mobile proof list sits on solid `--ink`, at 18.7:1.

### Screenshots

- design-psyche: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-e-fix1/` (desktop, laptop and mobile full + fold; flags: none).
- `workflow/homepage/c3/shots/e/fix1-2560-full.png` (2560 × 10249).
- `workflow/homepage/c3/shots/e/fix1-1440-fold-dpr2.png`.
- Band crops used for the look passes, in `scratchpad/c3/proto-contrast/`:
  - `fix1-final/b{320,390,1024,1440,2560}-NN.png`;
  - `look-fix1/desktop-overview.png` and `look-fix1/2560-overview.png`.

---

## Fix round 2 (critic round 2: FAIL → fixes, 2026-09-24)

This section supersedes the earlier ones wherever they conflict. Backup of the round-1 folder: `scratchpad/c3/e-backup-r2/`. Probe scripts and band captures for this round are in `scratchpad/c3/proto-contrast/r2/`.

### Page order and grounds: 13 sections, 4 ground changes

| # | Section | Ground | Composition | File |
|---|---|---|---|---|
| 01 | Hero | photo | H1 row, copy cols 1–8, proof as one line under the offer | `Hero.tsx` |
| 02 | Pillar strip | white | docked strip, 1px border, no shadow, no dots | `Hero.tsx` |
| 03 | The appointment gap | white | head + mirrored struck → arrow → tint table | `Gap.tsx` |
| 04 | Services | white | 5/7: label, H2, intro, 420px photo · ruled list | `Process.tsx` |
| 05 | Process | white, ruled | head + 5 ruled columns | `Process.tsx` |
| 06 | Follow-up | white, ruled | **centred**: head, diagram (max 800), caption | `Process.tsx` |
| 07 | Featured work | ink | well 1–6 · copy 7–12 | `Work.tsx` |
| 08 | Gallery | ink | 2×2 plates, captions inside the plate | `Work.tsx` |
| 09 | Proof standard | ink, ruled | **statement**: H2 1–6 + 22px positioning line 7–12, then 4/4/4 evidence row | `Proof.tsx` |
| 10 | Pricing | ink, ruled | bracket grid (unchanged idea) | `Pricing.tsx` |
| 11 | Free audit | white | **stacked head + 4/4/4 numbered steps**, no photo | `Proof.tsx` |
| 12 | FAQ + who it's for | white | 5/7: head · one ruled list | `Close.tsx` |
| 13 | Final CTA | ink close | 6/6: CTA + direct-line note · recap | `Close.tsx` |

Grounds down x=8 at 1440 (`r2/meas.mjs`): `0:ink(header) → 100:photo → 740:white → 3580:ink → 6920:white → 7960:ink`, the same 4 changes as round 1 (the trailing white in the probe is the layout's consent banner). The label + H2 left / grey aside right head now opens 3 sections (Gap, Work, Pricing), down from 5; the 5/7 split is used by 2 (Services, FAQ), down from 6; Follow-up (centred), Proof (statement + 4/4/4) and Audit (stacked head + 4/4/4) are three new compositions.

### What changed, by finding

**Verdict / V212 (defect 1): mobile menu.** `Menu.tsx` (new, `"use client"`, 25 lines) wraps the `<details>`. At ≤960 the menu is a full-width sheet (`position: fixed; inset: calc(var(--hdr) + 1px) 0 0 0`, ink, `--gut` side padding), 56px rows at 20px, hairlines between rows, and the audit button (56px, full width) at the foot. The summary shows "Menu"/"Close" (two spans toggled by `[open]`); `html:has(.menu[open])` stops the page scrolling; at ≤720 the header pins while open and the fixed mobile bar hides. The wrapper closes the sheet when any link in it is followed (otherwise it stays over the section it scrolled to) and on Escape (focus back to the summary). Measured live (`r2/menu.mjs`): 390 → sheet 0,69 390×775, 320 → 0,69 320×571, 800 → 0,81 800×919; all rows 56px/20px; label "Close"; html overflow hidden; mobile bar `none`.

**Defect 2: bracket stem.** `.plans { grid-template-rows: auto 40px auto }`. The stem now meets the bundle at every width: `gapPx` 0 at 1024, 1440, 1920 and 2560 (was 0/56/23/23). The bundle bottom-aligns with Terms (6779/6779 at 1440).

**Defect 3: hero proof off the car.** The three lines moved out of cols 9–12 into the copy column as one 16/600 line under the offer, middots in `--accent-d`, over a 1px hairline (≤720: the round-1 ruled list). Scrims split: `::before` = the radial + a new left-to-right layer (0.7 → 0.5 at 50% → 0 at 70%, ≤0.1 from col 9); `::after` = the floor scrim, masked to the left 60% (`mask-image: linear-gradient(90deg, #000 60%, transparent 80%)`), so cols 8–12 show the car at full strength (see `fix2-1440-fold-dpr2.png`).

**Defect 4 / V210: Work wells.** The figure is the plate (ink-2, 16px radius, 24px padding); the inner `.well` div is gone from the gallery. Meta and VLA now render at their crisp caps, 460 and 420. Captions sit inside the plate: beside the portrait ads at >1080 (bottom-aligned in the ~190px the image leaves), under the landscape ones. Image share of plate at 1440: 51% / 54% / 55% / 44% (was 47% Meta, 41% VLA by the critic's measure). At ≥1920 the portrait ads grow to 480px tall (360/384 wide, under the 540/560 caps) so the 648px plates do not open up.

**Defect 5: bundle holes.** `.laneL`/`.laneR` are packed top-down (`gap: 16px`, button `margin-top: 24px`), the pair is centred in the card (`align-content: center`). The Terms card became fine print (questions at `--t-lead`, answers at `--t-small`, 24px vertical padding), so the stretched bundle gains little: 1440 bundle 258px tall for ~160px of content inside 48px padding, no gap between lines larger than 24px.

**Defect 6 / flag 2: stock photos.** Audit photo deleted (and its `sizes`, figure CSS, alt). Services photo capped at 420px (`sizes="(max-width: 460px) calc(100vw - 40px), 420px"`), and the "Five services…" intro now sits above it.

**Defect 7: stacked labels in Work.** `.featLabel` ("Our work") deleted; the featured h3 uses a new `--t-d3` step, `clamp(26px, 2.25vw, 32px)` = 32 at 1440. Plan prices moved to the same step, so 44px is now only section H2s and step numerals.

**Defect 8: follow-up orphans.** `.fdNote` deleted. The kicker is now the diagram's centred 14/600 `figcaption` ("Human + AI-supported follow-up"). Every node is 1px `--line-2` with centred content; the appointment node is 1px blue on tint. Beyond the list: the whole section is now the page's one centred composition (hvacfound's "centred loop"), which is one of the pattern breaks for flag 1; left-aligned on phones.

**Defect 9: gap table.** Struck column flush right (`justify-content: flex-end`, header too), so each word ends 32px before its arrow (was a 366px run). Both `.foot` divs and the `.last` padding deleted; every row is 84px. Phones keep left alignment.

**Defect 10: mobile pricing.** All five cards (plans, bundle, Terms) carry the 16px rail gutter, so the column has one left edge (36 at 390). "/ month" and the term are 14px.

**Defect 11: mobile gallery.** One column; each ad full width in its own plate; portraits at `min(100%, 300px)` like the featured ad (300×400 and 300×375 at 390, 248px at 320).

**Defect 12:** resolved by deleting the audit photo.

**Defect 13: contrast at 1024/1280.** At ≤1180 the floor scrim is unmasked and gets the critic's 90° layer (0.85 → 0.6 at 55% → 0 at 80%). The new always-on left-to-right layer (defect 3) also covers 1280–1440, where moving the proof line into the copy column raised the H1 ~67px into the lit ceiling strip. Measured on the real pixels (`r2/contrast-hero.cjs`, text hidden), table below.

**Defect 14: FAQ columns.** One ruled list (no card borders, `border-top: 1px var(--line-2)` per item plus a bottom rule, no open-state border), plain 16px +/− in `--accent`. The call card moved out (see Final). All four questions start closed: with two open the list ran ~210px past the left column. Column ends at 1440: 7797 / 7829 (32px apart; was 117); 2560: 22px apart.

**Defect 15: 2560 fold.** Not changed; see "Deliberately not changed" 1.

**Defect 16: logo.** Both logos get `sizes` (header `(max-width: 720px) 104px, 120px`, footer `120px`), so the srcset is full and 3× phones get 384w (measured: 390@3x serves w=384 for a 312px need; 320@2x serves 256 for 208). Not `unoptimized`; see "Deliberately not changed" 5.

**Flag 1 (structural sameness).** Audit: photo deleted; stacked head (label, 2-line H2, the aside as a 16px sub under it), then a 4/4/4 row of 44px blue numerals, each running into a hairline to the next step. Proof: moved into the ink band straight after the gallery (so "receipts" lands on the work) as a statement: label + H2 in cols 1–6, the positioning line at 22/600 white in cols 7–12, then the three evidence items as a 4/4/4 row under 1px rules. Beyond: Follow-up centred (defect 8). Ground changes stay at 4.

**Flag 3 (feature strip).** Dots deleted; titles at `--t-lead` (18 at 1440), lines at `--t-small` in `--tx`; the 40px shadow replaced by a 1px `--line` border. The route now has 0 box-shadows.

**Flag 4 (template chrome).** Card radius is one 16px token (`--r-l` deleted, `--r-m` everywhere); controls stay pills (999). FAQ is a ruled list (defect 14). Radii in use at 1440: 999, 16, 3 (creative corners).

**Copy (mobile eyebrow).** Dropped at ≤720 instead of truncated (the `.ebX` span is gone; the full verified line shows above 720).

**Typography at ≥1920.** `--t-small: 15px`, `--t-label: 13px` (the owner's 2560 DPR-1 screen).

**Restraint.** Uppercase labels at 1440: 21 → 14 (deleted "Our work", "Automotive-specialist positioning", "Call", and the four "Includes"; the includes line now sits under the card's hairline). Audit CTAs in `main`: 4 → 3 (hero, bundle, final) plus the header.

**Final CTA.** Takes the FAQ call card's one unique line, "Either way you reach the BDC Promotions team directly — no call center in between.", as a 14px note under the actions. The phone is already in the actions; the email is one hairline below in the footer.

### Deliberately not changed, or changed differently, and why

1. **Hero cap stays 1000px at ≥1920 (defect 15 asked 1060).** The "cut" in the critic's 2560 capture is the consent banner (77px, bottom of the viewport, not dismissed in headless) lying over H2 line 2. Measured without it (`r2/fold.mjs`, 2560×1440): at 1000 the gap H2 ends at 1396 and the table starts at 1452, so the fold (1440) falls in the whitespace under the head; at 1060 the H2 spans 1361–1456 and the real fold cuts "Conversations do." at 60%. The only cap that is clean both with and without the banner is ~1180, which reverses round 1's "empty ceiling" fix. The banner and its hydration belong to the coordinator (`layout.tsx`).
2. **Pill CTAs kept.** Flag 4's listed fixes are the ruled FAQ and the 16px well radius "so cards and controls differ"; with cards at 16 and controls at 999 they now differ. hvacfound (V189, the owner's chosen register) uses 999px pills (4 elements in its `styles.json`). The bordered FAQ half of V207's "template chrome" is gone.
3. **Pillar titles at `--t-lead` (18 at 1440, 17 below 1360) and lines at `--t-small` (14, 15 at ≥1920), not 17/15 fixed.** 17 and 15 at 1440 would be the ramp's 9th and 10th sizes. The substance of the fix (no dots, ink not grey, title close to line size, no shadow) is applied.
4. **8 font sizes at 1440 (12/14/16/18/22/32/43.2/60.48), and the screenshot.mjs flag fires.** The 32px step is the critic's own requested split of the 44px roles (featured title, prices). Triaged per V126: every step is distinguishable and has a role; there are no fractional near-duplicates. Nothing was added below 1920 besides it.
5. **Logo via `sizes`, not `unoptimized`.** The source PNG is 328 KB; `unoptimized` would ship it twice on every page. `sizes` gives the same sharpness (384w on 3× phones).
6. **Gallery captions: beside portrait ads, under landscape ones, not "to the right" of Meta/VLA.** In a 588px plate with 24px padding, a caption to the right of a 460px image would get 56px. The VLA plate stays at 44% image because the VLA source caps at 420 CSS px and the row keeps equal plate heights.
7. **Audit photo deleted although BRIEF's section list says "three steps, plus the consultation photo".** BRIEF presents that list as what the deck supports ("you may reorder or merge"), not a hard constraint; the photo is the V207 stock look both critics flagged. The section still counts (13 `main section`).
8. **Proof drops its grey aside ("We don't ask you to take our word for it…") and the "During your free audit…" note.** PORT §4.2 requires the heading, the positioning line and the proof-standard items; all three stay. A third and fourth text block would have rebuilt the split head this round removes.
9. **Follow-up head left-aligned on phones.** A centred five-line paragraph at 350px is hard to read.
10. **The menu's close-on-link and Escape are verified in a harness, not on the live route.** On this dev server no route hydrates in any headless engine (Chromium, Firefox, WebKit: only the dev-overlay portal carries React fibers on `/variant-c`, `/variant-d`, `/lp` and `/variant-e`; Chromium reports `WebSocket … webpack-hmr … ERR_INVALID_HTTP_RESPONSE`, while curl gets a clean 101). That is also why "Got it" never dismisses the consent banner in captures. `r2/harness/` bundles the real `Menu.tsx` with React (esbuild from the repo's `node_modules`) and drives it; output below.
11. **Sweep "hdrWrap" lines are false positives.** `sweep.mjs` counts distinct rect tops inside each header item. The phone link (svg 16px, span box 22px, text 18px) and the summary (span box + text) give 2–3 tops inside one 44px line. `r2/hdr.mjs` confirms every header item is 44px tall on one line at 390, 1440 and 2560.

### Gates (verbatim)

`npx tsc --noEmit -p . --incremental false`: exit 0, empty output (`grep -c "error TS"` → `0`; nothing in `variant-e`).

`npx eslint src/components/review/variant-e`:
```
(no output) eslint exit 0
```

`node workflow/homepage/scripts/density.mjs e http://127.0.0.1:3419`:
```
--- e 1536px @2x
 ok  box 1536 need 3072 served 3840 (req w=3840, file 3840) 1.25 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  420 need  840 served 1080 (req w=1080, file 1248) 1.29 bdc-inventory-production.webp sizes="(max-width: 460px) calc(100vw - 40px), 420px"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  460 need  920 served 1090 (req w=0, file 1090) 1.18 work-meta-inventory.webp sizes=""
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp sizes=""
--- e 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  420 need  840 served 1080 (req w=1080, file 1248) 1.29 bdc-inventory-production.webp sizes="(max-width: 460px) calc(100vw - 40px), 420px"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  460 need  920 served 1090 (req w=0, file 1090) 1.18 work-meta-inventory.webp sizes=""
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp sizes=""
--- e 1280px @2x
 ok  box 1280 need 2560 served 3840 (req w=3840, file 3840) 1.50 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  420 need  840 served 1080 (req w=1080, file 1248) 1.29 bdc-inventory-production.webp sizes="(max-width: 460px) calc(100vw - 40px), 420px"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  460 need  920 served 1090 (req w=0, file 1090) 1.18 work-meta-inventory.webp sizes=""
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp sizes=""
--- e 390px @2x
 ok  box  390 need  780 served 1080 (req w=1080, file 3840) 1.38 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  350 need  700 served  750 (req w=750, file 1248) 1.07 bdc-inventory-production.webp sizes="(max-width: 460px) calc(100vw - 40px), 420px"
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-luxury-campaign.webp sizes=""
 ok  box  300 need  600 served 1086 (req w=0, file 1086) 1.81 work-used-car-event.webp sizes=""
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-wholesale-public.webp sizes=""
 ok  box  318 need  636 served 1090 (req w=0, file 1090) 1.71 work-meta-inventory.webp sizes=""
 ok  box  318 need  636 served  963 (req w=0, file 963) 1.51 work-google-vla.webp sizes=""

0 soft image render(s)
```

**Overflow and accessibility on the live DOM** (the critic's `check.mjs`, rerun from `r2/`):
```
== 320 (dpr 2) pageH=14217 sections=13 h1=1 overflowX=0
== 390 (dpr 3) pageH=13429 sections=13 h1=1 overflowX=0
== 1024 (dpr 1) pageH=10269 sections=13 h1=1 overflowX=0
== 1440 (dpr 2) pageH=9045 sections=13 h1=1 overflowX=0
== 1920 (dpr 1) pageH=9311 sections=13 h1=1 overflowX=0
== 2560 (dpr 1) pageH=9423 sections=13 h1=1 overflowX=0
 small targets (every width): [{"t":"cookie policy","w":82,"h":19,"inline":true}]   ← the layout's consent banner
 heading skips: none · fonts: Geist · no image over its crisp cap, none soft
 bracket 1024 {"mergeH":40,"stemEnds":7209,"laneTop":7209,"gapPx":0}
 bracket 1440 {"mergeH":40,"stemEnds":6521,"laneTop":6521,"gapPx":0}
 bracket 1920 {"mergeH":40,"stemEnds":6761,"laneTop":6761,"gapPx":0}
 bracket 2560 {"mergeH":40,"stemEnds":6873,"laneTop":6873,"gapPx":0}
 sizes 1440: 12px 14px 16px 18px 22px 32px 43.2px 60.48px
 sizes 2560: 13px 15px 16px 19px 22px 32px 44px 72px
```

**1px sweep 320–2560** (`sweep.mjs`): no document overflow, no button overflow, no heading overflow at any width. Its only lines are the false positives in "not changed" 11:
```
320-960: hdrWrap:MenuClose
1181-2560: hdrWrap:(352) 207-1074
```

**Menu harness** (`node scratchpad/c3/proto-contrast/r2/harness/run.mjs`, the real `Menu.tsx` under React):
```
PASS opens: {"open":true,"label":"Close","overflow":"hidden","scrollY":0,"focus":"SUMMARY"}
PASS Escape closes, focus on summary: {"open":false,"label":"Menu","overflow":"visible","scrollY":0,"focus":"SUMMARY"}
PASS link closes the sheet and scrolls to #pricing: {"open":false,"label":"Menu","overflow":"visible","scrollY":1269,"focus":"BODY"} top=0
PASS audit button closes the sheet: {"open":false,"label":"Menu","overflow":"visible","scrollY":2470,"focus":"BODY"}
```

**Hero text contrast on the photo** (`r2/contrast-hero.cjs`, text hidden, worst pixel / 1st percentile per line box):

| Width | H1 line 1 worst / p1 | H1 line 2 worst | Lead, worst of 3 lines | Proof line worst |
|---|---|---|---|---|
| 1024 | 9.03 / 17.10 | 17.28 | 12.34 | 18.8 |
| 1180 | 9.29 / 17.10 | 17.43 | 14.53 | 19.2 |
| 1280 | 3.40 / 10.48 | 10.48 | 10.65 | 18.2 |
| 1440 | 3.22 / 11.01 | 10.56 | 10.21 | 18.4 |
| 1920 | 4.07 / 14.00 | 17.12 | 14.50 | 19.2 |
| 2560 | 8.22 / 12.10 | 16.85 | 14.87 | 19.1 |
| 390 | 10.62 / 12.49 | 17.19 | 15.79 | (solid ink) |

The H1 is ≥ 43px, so its floor is 3:1; every other line clears 4.5:1 by at least 2×. Round 2 was 1.71 worst at 1024 and 2.21 at 1280.

**screenshot.mjs (`bdc-c3-route-e-fix2`):**
```
[desktop] ok
[laptop] ok
[mobile] ok

Automatic flags:
 - 8 distinct font sizes (target ≤7 site-wide, ≤4 per viewport)

Inertness flags:
 none
```
(Flag triaged in "not changed" 4.)

**capture.mjs:**
```
{"url":"http://127.0.0.1:3419/variant-e","out":".../shots/e/fix2-2560-full.png","width":2560,"height":9423,"dpr":1,"browser":"chromium","broken":[],"overflowX":0,"pageErrors":[]}
{"url":"http://127.0.0.1:3419/variant-e","out":".../shots/e/fix2-1440-fold-dpr2.png","width":1440,"height":9045,"dpr":2,"browser":"chromium","broken":[],"overflowX":0,"pageErrors":[]}
```

### Files

`src/components/review/variant-e/`: as round 1, plus `Menu.tsx` (the client `<details>` wrapper). `Proof.tsx` no longer imports `next/image`. Every file is under 160 lines.

### Screenshots

- design-psyche: `/Users/syedali/.claude/design-psyche/psyche/screens/bdc-c3-route-e-fix2/` (desktop, laptop and mobile full + fold).
- `workflow/homepage/c3/shots/e/fix2-2560-full.png` (2560 × 9423) and `workflow/homepage/c3/shots/e/fix2-1440-fold-dpr2.png`.
- Look passes, in `scratchpad/c3/proto-contrast/r2/`: `d1440-00…07.png`, `d2560-00…06.png`, `d1280-*.png`, `s390-{a,b,c}.png`, `s1024-{a,b}.png` (contact sheets), `menu-390.png`, `menu-320.png`, `menu-800.png`.

---

## Fix round 3 (owner-lens blind judge, 2026-09-24)

This section supersedes the earlier ones wherever they conflict. Probe scripts and extra captures are in `scratchpad/c3/proto-contrast/r3/` (`meas.mjs`, `check.mjs`, `contrast-hero.cjs`, `r3-1024-full.png`). No new copy was written; the only copy change is a deletion.

### Page order and grounds: 13 sections, 4 ground changes

| # | Section | Ground | Composition | File |
|---|---|---|---|---|
| 01 | Hero | photo | fills the fold under the header (100svh − hdr, capped 1000) | `Hero.tsx` |
| 02 | Pillar strip | white | **undocked**: a bordered strip wholly below the hero | `Hero.tsx` |
| 03 | The appointment gap | white | unchanged | `Gap.tsx` |
| 04 | Services | white | **stacked head + full-width ruled index**, no photo | `Process.tsx` |
| 05 | Process | white, open | unchanged columns; no hairline above (the index closes on its own rule) | `Process.tsx` |
| 06 | Follow-up | white, ruled | unchanged | `Process.tsx` |
| 07 | Featured work | ink | plate 1–6 · copy 7–12 | `Work.tsx` |
| 08 | Gallery | ink | 2×2 plates, ad centred, caption under the ad | `Work.tsx` |
| 09 | Proof standard | **white** | H2 1–6 + positioning line 7–12, then **two** evidence items 6/6 under 2px blue rules | `Proof.tsx` |
| 10 | Pricing | **white**, ruled | mist plan cards, tint + 2px blue bundle, outlined terms; bracket unchanged | `Pricing.tsx` |
| 11 | Free audit | white | unchanged | `Proof.tsx` |
| 12 | FAQ | white | unchanged | `Close.tsx` |
| 13 | Final CTA | ink close | unchanged | `Close.tsx` |

Grounds down x=4 (`r3/meas.mjs`), dark share of the whole page including the hero:

```
1440x900  H 9506  dark% 42  bands 0:dark 910:light 3930:dark 6040:light 8420:dark 9430:light
2560x1440 H 9802  dark% 43  bands 0:dark 1090:light 4150:dark 6300:light 8710:dark 9730:light
390x844   H 13101 dark% 41  bands 0:dark 960:light 5080:dark 7850:light 11350:dark 12980:light
320x640   H 13894 dark% 38  bands 0:dark 1030:light 5560:dark 8050:light 12010:dark 13770:light
1024x768  H 10078 dark% 42  bands 0:dark 770:light 3830:dark 6060:light 8780:dark 10010:light
```
(The last "light" band is the layout's fixed consent banner.) Round 2 at 1440 was 56% dark (hero, then one ink band from 3570 to 6910 holding work + proof + pricing, then the close); the non-hero ink is now the work band (2110px) and the close (1086px), 34% of the page, down from 46%. White is 58% of the page, up from 44%.

### What changed

1. **Testimonials proof item deleted** (all routes). `Proof.tsx` EVIDENCE loses `Real customer testimonials` / `Named dealership voices…`; the other two items are kept verbatim and now sit 6/6. No copy added.
2. **Pure white grounds.** Every section ground is `--paper` #FFFFFF or ink. Tints stay only on small surfaces: the gap table's "build toward" column (`--tint`), the plan cards (`--mist`), the bundle card (`--tint`) and the appointment node (`--tint`). No full-width tint band exists (grep: `--mist`/`--tint` appear only in `.gapd .to`, `.plan`, `.lane`, `.fdEnd`).
3. **Dark only for hero, work, close.** `VariantE.tsx`: the ink ground now wraps only `<Work />`; `<Proof />` and `<Pricing />` moved into the white ground with Audit and FAQ. Still 4 ground changes.
   - Proof: `.ruled` dropped (it now opens its ground); positioning line in `--tx`; evidence rules 2px `--accent`, bodies `--mu`.
   - Pricing: plans `--mist` + 1px `--line`; "/ month" and terms `--mu`; bundle `--tint` with the 2px `--accent` edge and a `--line-2` divider; Terms is a 1px `--line-2` outline with `--mu` text. Contrast: `--mu` on mist ≈ 7.3:1, on tint ≈ 7.0:1; `--accent-ink` on tint 4.93:1.
   - Dead rules removed from `base.module.css`: `.ink .acc`, `.ink .ruled::before` (no accent or ruled section is on ink any more).
4. **Services photo removed** (`/lp/bdc-inventory-production.webp`, its `sizes`, `.ph`, and the `next/image` import in `Process.tsx`). Recomposed as a stacked head (label, H2, intro; max 44em) over a full-width index: one ruled row per service, the name in cols 1–4 and the line in 5–11 (≤1080: 1–5 / 6–12; ≤720 stacked). No placeholder, no new image. Neither column is left empty (the section is ~90px taller at 1440 than the 5/7 split with the photo). Because the index closes on its own rule, Process no longer carries `.ruled` (it would have drawn a second hairline 64px under the first); Services → Process is the open `--sp-2` step.
5. **Work grid.** Each gallery piece is now `<div class=plate><figure class=piece>`: the plate (ink-2, 16px radius) has the same padding on every side as the featured plate (48 above 1080, 32 at 721–1080, 24 at ≤720), and centres the figure. The figure is exactly as wide as its ad (`--w`), so the caption sits 16px directly under the ad on its left edge. Row heights match: portraits 330×440 + 352×440 (360/384×480 at ≥1920), landscapes 406×222 + 420×222; when a plate is narrower than the wider ad, the narrower one keeps its share (`min(93.7%, 330px)`, `min(96.6%, 406px)`) so heights still match. Measured at 1440: every image 48px from the plate top, every caption 16px under its image and at the image's x, every plate 48px below its caption (`padB` 48 on all four). At 1024: 32 on all four.
6. **Pillar strip vs the 1440×900 fold.** Moved fully below. The hero is `min(max(600px, 100svh − hdr), 1000px)` and its bottom padding `clamp(64px, 8vw, 112px)`; `--dock`, `--dock-v`, `.ground.docked` and `.pillars` are deleted. At 1440×900 the hero spans 81–901, so the fold is header + hero with nothing cut; the strip starts at 1029. At 2560×1440 the hero is 1000 (81–1081) and the strip 1209–1363 sits wholly inside the fold, which then ends in the white above the gap label (1459). The hero proof line now ends ~115px above the fold at 1440, clear of the consent banner's 77px.
7. **Mobile bar** untouched: `chrome.module.css:72` still `z-index: 40`, under the consent banner (z-50).

### Deliberately not changed, and why

1. **The close stays ink.** The brief allows hero, work and footer/close to stay dark; moving the final CTA to white would drop the page's only closing contrast for ~6% more white.
2. **Hero `sizes` unchanged.** Filling the viewport height makes the cover-scaled photo up to ~111vw on 16:10 screens (1596px at 1440×900). `100vw` at DPR 2 already requests the 3840 file there (need 3192), and at 1920×1080 DPR 1 the request (1920) is 0.99 of the need (1946). The density gate is clean. The comment in `Hero.tsx` records this.
3. **Pillar strip keeps its 1px card border.** It is a small surface on white, not a band.

### Gates (verbatim)

`npx tsc --noEmit -p . --incremental false` (`--incremental false` keeps `tsconfig.tsbuildinfo` out of the shared worktree): exit 0, empty output; `grep -c "error TS"` → `0`.

`npx eslint src/components/review/variant-e`:
```
(no output) eslint exit 0
```

`node workflow/homepage/scripts/density.mjs e http://127.0.0.1:3419`:
```
--- e 1536px @2x
 ok  box 1536 need 3072 served 3840 (req w=3840, file 3840) 1.25 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  406 need  812 served 1090 (req w=0, file 1090) 1.34 work-meta-inventory.webp sizes=""
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp sizes=""
--- e 1440px @2x
 ok  box 1440 need 2880 served 3840 (req w=3840, file 3840) 1.33 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  406 need  812 served 1090 (req w=0, file 1090) 1.34 work-meta-inventory.webp sizes=""
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp sizes=""
--- e 1280px @2x
 ok  box 1280 need 2560 served 3840 (req w=3840, file 3840) 1.50 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  440 need  880 served 1122 (req w=0, file 1122) 1.27 work-luxury-campaign.webp sizes=""
 ok  box  330 need  660 served 1086 (req w=0, file 1086) 1.65 work-used-car-event.webp sizes=""
 ok  box  352 need  704 served 1122 (req w=0, file 1122) 1.59 work-wholesale-public.webp sizes=""
 ok  box  406 need  812 served 1090 (req w=0, file 1090) 1.34 work-meta-inventory.webp sizes=""
 ok  box  420 need  840 served  963 (req w=0, file 963) 1.15 work-google-vla.webp sizes=""
--- e 390px @2x
 ok  box  390 need  780 served 1080 (req w=1080, file 3840) 1.38 photo-night-showroom-retouched.jpg sizes="(max-width: 406px) 506px, (max-width: 656px) 125vw, (max-width: 720px) 817px, (max-width: 1080px) 1520px, (max-width: 1183px) 1183px, 100vw"
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-luxury-campaign.webp sizes=""
 ok  box  300 need  600 served 1086 (req w=0, file 1086) 1.81 work-used-car-event.webp sizes=""
 ok  box  300 need  600 served 1122 (req w=0, file 1122) 1.87 work-wholesale-public.webp sizes=""
 ok  box  302 need  604 served 1090 (req w=0, file 1090) 1.80 work-meta-inventory.webp sizes=""
 ok  box  302 need  604 served  963 (req w=0, file 963) 1.59 work-google-vla.webp sizes=""

0 soft image render(s)
```

**Overflow and accessibility** (`r3/check.mjs`, the critic's probe):
```
== 320 (dpr 2) pageH=13894 sections=13 h1=1 overflowX=0
== 390 (dpr 3) pageH=13101 sections=13 h1=1 overflowX=0
== 1024 (dpr 1) pageH=10078 sections=13 h1=1 overflowX=0
== 1440 (dpr 2) pageH=9506 sections=13 h1=1 overflowX=0
== 1920 (dpr 1) pageH=9802 sections=13 h1=1 overflowX=0
== 2560 (dpr 1) pageH=9802 sections=13 h1=1 overflowX=0
 small targets (every width): [{"t":"cookie policy","w":82,"h":19,"inline":true}]   ← the layout's consent banner
 heading skips: none · fonts: Geist
 sizes 1440: 12px 14px 16px 18px 22px 32px 43.2px 60.48px
 sizes 2560: 13px 15px 16px 19px 22px 32px 44px 72px
```

**Hero text contrast on the real pixels** (`r3/contrast-hero.cjs`, text hidden; worst / p1):

| Width | H1 line 1 | H1 line 2 | Lead, worst line | Offer | Proof line |
|---|---|---|---|---|---|
| 1024 | 14.43 / 17.30 | 18.73 | 14.08 | 12.84 | 19.43 |
| 1280 | 6.79 / 12.83 | 14.19 | 12.07 | 12.83 | 19.14 |
| 1440 | 6.90 / 13.37 | 18.01 | 13.43 | 12.91 | 19.29 |
| 1920 | 7.00 / 12.52 | 17.05 | 15.65 | 12.91 | 19.54 |
| 2560 | 7.55 / 11.96 | 15.92 | 14.82 | 12.75 | 19.39 |
| 390 | 10.62 / 12.49 | 17.19 | 15.79 | 12.44 | (solid ink) |

Round 2's worst H1 reading was 3.22 at 1440; the taller hero moves the copy lower on the photo, off the lit ceiling strip. (At 390 the sub-1.5 readings on the offer's second line and the proof are the consent banner over the fold, as before.)

**capture.mjs:**
```
{"url":"http://127.0.0.1:3419/variant-e","out":".../shots/e/r3-1440-full.png","width":1440,"height":9506,"dpr":1,"browser":"chromium","broken":[],"overflowX":0,"pageErrors":[]}
{"url":"http://127.0.0.1:3419/variant-e","out":".../shots/e/r3-1440-fold-dpr2.png","width":1440,"height":9506,"dpr":2,"browser":"chromium","broken":[],"overflowX":0,"pageErrors":[]}
{"url":"http://127.0.0.1:3419/variant-e","out":".../shots/e/r3-2560-full.png","width":2560,"height":9802,"dpr":1,"browser":"chromium","broken":[],"overflowX":0,"pageErrors":[]}
{"url":"http://127.0.0.1:3419/variant-e","out":".../shots/e/r3-390-full.png","width":390,"height":13101,"dpr":2,"browser":"chromium","broken":[],"overflowX":0,"pageErrors":[]}
```

### Screenshots

- `workflow/homepage/c3/shots/e/r3-1440-full.png` (1440 × 9506), `r3-1440-fold-dpr2.png`, `r3-2560-full.png` (2560 × 9802), `r3-390-full.png` (390 × 13101 @2).
- Before this round: `workflow/homepage/c3/shots/e/pre-r3-1440-full.png` (1440 × 9045).

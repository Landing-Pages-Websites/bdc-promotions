# C2 creative derivatives: provenance

These are presentation derivatives of the client's own ad creatives, made on 2026-09-23 for direction C2 (see `../C2-BRIEF.md` §9).
- No redraw, retouch, crop, resample or colour change.
- No super-resolution. Every source already has at least 2× its slot's maximum CSS width in native pixels, so Real-ESRGAN was not needed, and brief §11 excludes upscaled creatives.

## Method, the same for all four

1. Converted RGBA to RGB. The alpha channel was 255 on every pixel, so no pixel value changed.
2. Encoded at **native** pixel size with cwebp (`/opt/homebrew/bin/cwebp`) and `-metadata none`:
   - **Posters:** `-q 92 -m 6 -sharp_yuv`. Sharp YUV keeps the chroma edges of red, yellow and gold lettering.
   - **Screenshots:** `-lossless -z 9`, which decodes bit-exact to the source.
3. Serve them with next/image `unoptimized`, and never render them above the max crisp CSS width below. The derivatives are made to bypass the q75 optimizer.

## Legibility check

- The native crops were compared 1:1 (shown at 2× nearest-neighbour), source above and derivative below.
- There was no scaling, so the "Lanczos baseline" is the identity: the derivative was compared with the source pixels directly.
- The comparison sheets are in the session scratchpad (`cmp-*.png`, `cmpll-*.png`).

| id | source (native) | source sha256 | output | method | output sha256 | px | max crisp CSS (px ÷ 2) | slot CSS | fidelity | legibility |
|---|---|---|---|---|---|---|---|---|---|---|
| work-luxury-campaign | `ad-luxury-campaign.png` 1122×1402 | `14074090984dd567419665c582ef021b835cf57bed0bfa6357753020ba06516e` | `public/images/design/variant-c/work-luxury-campaign.webp` (470,390 B) | WebP q92 sharp_yuv, native | `c732ca88089b81bc46957d7fb4bc08bcf5973e341810ba7e77a0c5204481ccd7` | 1122×1402 | 561 | 560 | 36.3 dB full frame; text crops 31.5–42.1 dB | PASS |
| work-used-car-event | `ad-used-car-event.png` 1086×1448 | `0b16d89e97b47a260e7867dd8f9b26df3ae647bf3dabe09f48a1445fd5123ded` | `public/images/design/variant-c/work-used-car-event.webp` (149,694 B) | WebP q92 sharp_yuv, native | `1038d1e53f0b095a2619b4c3352ef86c042fa45496ed1bcc545b3173083c569a` | 1086×1448 | 543 | 348 | 39.6 dB full frame; text crops 32.8–45.6 dB | PASS |
| work-meta-inventory | `ad-meta-inventory.png` 1090×596 | `5d99f1a01a8aa71bc6b268dc69efdeaaabc72c5cd9202c73dc28914f96d09fd7` | `public/images/design/variant-c/work-meta-inventory.webp` (345,442 B) | WebP lossless, native | `8dfa274292e79cad0c93a9cc70ac579e12ee0ad5c7fdeb828e0bd2c011752587` | 1090×596 | 545 | 520 | bit-exact | PASS, but the source is soft (see below) |
| work-google-vla | `ad-google-vla.png` 963×509 | `9835fb032db8472d2193fbbb7262fb177eae66d141df2093c9c924f04ceefb29` | `public/images/design/variant-c/work-google-vla.webp` (193,064 B) | WebP lossless, native | `20c4611542a40d4151491d38e451ed9c1cd2b50bebed61fabed3c7f69afeff26` | 963×509 | 481 | 472 | bit-exact | PASS, mildly soft source (see below) |

## Crops checked

- **work-luxury-campaign:**
  - "EXCLUSIVE SAVINGS" and "LIMITED TIME OFFER" (the smallest lettering)
  - "$1,000"
  - "MESSAGE OR COMMENT NOW!"
  - the "GEN-X Motors" sign
  - "2075" on the building
- **work-used-car-event:**
  - "MESSAGE OR COMMENT" (the smallest lettering)
  - "$2,000"
  - "SAVINGS VOUCHER!" (yellow on black, the worst crop)
  - "EVERYTHING MUST GO!"
- **work-meta-inventory:**
  - "Hub City Ford / Sponsored"
  - the reaction and comment counts
  - card titles and prices "$44,995.00", "$41,995.00"
- **work-google-vla:**
  - the query line
  - all five card prices and MSRP lines
  - the disclosure line

In every crop, every glyph, number, logo and price is unchanged.

## Source-softness note (effective resolution, not pixel count)

This was probed by downscaling each source by a factor f and restoring it with Lanczos. A high PSNR means the source carries almost no detail above 1/f of its width.

| id | f=1.25 | f=1.5 | f=2 | effective detail | crisp at DPR 2 up to |
|---|---|---|---|---|---|
| luxury-campaign | 31.9 | 27.8 | 23.7 | full native | 561 CSS |
| used-car-event | 36.8 | 33.3 | 29.4 | full native | 543 CSS |
| meta-inventory | 45.8 | 41.7 | 36.1 | about 730 px, so the file is an upscaled screenshot | about 365 CSS |
| google-vla | 42.3 | 36.9 | 30.9 | about 770 px | about 385 CSS |

- The Meta and VLA files pass the pixel-density gate at their planned slots of 520 and 472.
- They will still look exactly as soft as their source files do, because the blur is baked into the client's files, as the native crop of "$44,995.00" shows.
- **Recommendation:** render Meta at ≤ 365 CSS and VLA at ≤ 385 CSS if they must look retina-sharp.
- Super-resolution cannot recover that detail without inventing glyphs, so it was not used.

## Source files after the C2 build (2026-09-23)

The `public/images/design/variant-c/ad-*.png` sources were removed from `variant-c/` because nothing renders them. Byte-identical copies, with the same sha256 as in the table above, remain elsewhere:

| Source | Copy in variant-a | Copy in variant-b |
|---|---|---|
| ad-luxury-campaign | `public/images/design/variant-a/work-luxury-campaign.png` | `public/images/design/variant-b/hero-luxury-campaign.png` |
| ad-used-car-event | `public/images/design/variant-a/hero-used-car-event.png` | `public/images/design/variant-b/work-used-car-event.png` |
| ad-meta-inventory | `public/images/design/variant-a/work-inventory-ad.png` | `public/images/design/variant-b/work-inventory-ad.png` |
| ad-google-vla | `public/images/design/variant-a/work-google-vla.png` | `public/images/design/variant-b/work-google-vla.png` |

The curated-out files also have copies in the same folders: `growth-repo-sale.png`, `work-luxury-storyboard.png`, and `hero-wholesale-public.png` / `work-event-campaign.png`.

## Placement after fix-r1 (2026-09-23)

- `work-used-car-event` now leads the Work spread at ≤ 543 CSS (native 1086 ÷ 2). It has full native detail (softness probe above), so 543 is crisp.
- `work-luxury-campaign` moves to the small slot at ≤ 348 CSS.
- Meta and VLA stay at their softness caps (≤ 365 / ≤ 385), not at the pixel-count maxima (545 / 481), because above those widths they show exactly the source's blur at DPR 2.

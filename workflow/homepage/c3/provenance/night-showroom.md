# photo-night-showroom.jpg — provenance

- Source: `public/lp/bdc-night-showroom.webp` (1750×899), AI-generated and client-approved for /lp; sha256 cd4503b4e2b4bff501e530fee7bb14d9566111e6b8e43ca768e2385720845530.
- Chosen by the owner (2026-09-23) after the Codex image quota ran out (resets Sep 29): "Upscale existing AI image".
- Method: Real-ESRGAN x4plus (`~/.claude/design-psyche/tools/upscale/upscale.py --scale 4`) → 7000×3596 (`c2/raw/night-showroom-x4.png`), Lanczos to 3840×1973, JPEG q86 progressive.
- QA (coordinator, 100% crops): SR sharpens headlight, grille mesh, wheel spokes and reflections without new artefacts. Residual AI tells from the source: invented grille badge on the grey SUV, soft showroom interior. Shown as an illustrative environment only, never as a client or BDC location.
- sha256 workflow/homepage/c2/raw/night-showroom-x4.png: 3f78c0a4e3ae267c754e207b26ca6a326eb2e1b3641c6238c7d189481b83c086
- sha256 public/images/design/variant-c/photo-night-showroom.jpg: 8a257c9285e6de41a0b4b909bbc16d733fd9b428fa161ffc3e5c1370383ea341

## Retouch, fix-r1 (2026-09-23)

design-critic r1 flagged the invented grille badge, the dark sedan fused into the car behind the second mullion, and the smeared display wall inside. The master was retouched locally; nothing global was changed.

- Script: `workflow/homepage/c2/retouch.py` (reproducible; reads the untouched master, writes the served file).
- Untouched master kept at `workflow/homepage/c2/raw/night-showroom-3840-pre-retouch.jpg`, sha256 `8a257c9285e6de41a0b4b909bbc16d733fd9b428fa161ffc3e5c1370383ea341` (the file previously served as `photo-night-showroom.jpg`).
- Edits (master px):
  1. Badge, x 2786–2822, y 1155–1171: row-by-row linear fill between the plain hood lip on either side, plus σ 1.6 noise, 1.2 px feather. The broken chrome trim under it (x 2774–2842, y 1173–1182) was smoothed along its own length.
  2. Display wall, x 2130–2370, y 986–1086: 6 px blur then × 0.34, 10 px feather (sunk to the interior's shadow value).
  3. Fused sedans, x 2034–2132, y 1100–1166: 6 px blur then × 0.40, 8 px feather.
- Output: `public/images/design/variant-c/photo-night-showroom-retouched.jpg`, 3840×1973, JPEG q86 progressive, sha256 `1369d100366830ccb430ab4f0a11ac1ecf1eb223cbcd5f73cd0746c6501e915e`.
- Renamed rather than overwritten: the Next image optimizer had cached the old file under the old URL and kept serving the badge.
- On the page, CSS adds `filter: saturate(.88) brightness(.94)` and a 0.14 overlay film grain inside the plate (imagery QA r1 treatment). Neither is baked into the file.
- Still AI imagery: the showroom interior stays soft and the upscaler's micro-texture remains under the grain. The footer disclosure stands.

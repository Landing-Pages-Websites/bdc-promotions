#!/usr/bin/env python3
"""Derived copies of three supplied work creatives for variant A (fix round 1).

Provenance: every output is a crop of a supplied file, or a recolour of its flat
presentation backdrop only. Ad, phone, carousel and SERP pixels are never edited, and the
supplied originals are never overwritten.

  work-luxury-storyboard-crop.png  rows 48-639 of work-luxury-storyboard.png. The plate crop
                                   no longer slices the "30-SECOND LUXURY TV STORYBOARD" line;
                                   the plate label names the piece.
  work-inventory-ad-navy.png       the flat blue presentation backdrop (connected to the image
                                   border) is recoloured to image 1's navy #00061a. Its
                                   anti-aliased fringe is re-blended by blue excess.
  work-google-vla-crop.png         (14,12)-(954,408) of work-google-vla.png: inside the blue
                                   matte and above the location rows. The five red markup
                                   arrows cross card borders and interiors (not flat
                                   background), so they are cropped out, not painted out.

Run from the repo root:  python3 workflow/homepage/scripts/derive-variant-a-work.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

DIR = Path("public/images/design/variant-a")
NAVY = np.array([0, 6, 26], dtype=float)


def crop(src: str, out: str, box: tuple[int, int, int, int]) -> None:
    Image.open(DIR / src).crop(box).save(DIR / out, optimize=True)
    print(out, box)


def navy_backdrop(src: str, out: str) -> None:
    im = Image.open(DIR / src).convert("RGBA")
    rgba = np.asarray(im).astype(float)
    rgb = rgba[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excess = b - np.maximum(r, g)  # the backdrop is ~150; neutral phone/card pixels are ~0

    # backdrop = strongly blue pixels connected to the image border
    candidate = (excess > 100) & (r < 70)
    labels, _ = ndimage.label(candidate)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    backdrop = np.isin(labels, edge[edge > 0])

    # local backdrop colour (it is a soft gradient), used to re-blend the fringe
    weight = ndimage.gaussian_filter(backdrop.astype(float), 12)
    local = np.stack([ndimage.gaussian_filter(rgb[..., i] * backdrop, 12) for i in range(3)], -1)
    local /= np.maximum(weight, 1e-6)[..., None]
    local_excess = np.maximum(local[..., 2] - np.maximum(local[..., 0], local[..., 1]), 1)

    fringe = ndimage.binary_dilation(backdrop, iterations=2) & ~backdrop
    share = np.clip(excess / local_excess, 0, 1) * fringe  # how much backdrop a fringe pixel holds

    out_rgb = rgb.copy()
    out_rgb[backdrop] = NAVY
    out_rgb += share[..., None] * (NAVY - local)
    rgba[..., :3] = np.clip(out_rgb, 0, 255)
    Image.fromarray(rgba.round().astype(np.uint8), "RGBA").save(DIR / out, optimize=True)
    print(out, f"backdrop {backdrop.mean():.1%} of pixels, fringe {int(fringe.sum())} px re-blended")


if __name__ == "__main__":
    crop("work-luxury-storyboard.png", "work-luxury-storyboard-crop.png", (0, 48, 426, 640))
    crop("work-google-vla.png", "work-google-vla-crop.png", (14, 12, 954, 408))
    navy_backdrop("work-inventory-ad.png", "work-inventory-ad-navy.png")

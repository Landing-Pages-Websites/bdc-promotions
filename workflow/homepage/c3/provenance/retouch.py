"""Retouch the fold master (fix-r1, design-critic r1 AI-tell flag 1).

Reads the untouched 3840 master (c2/raw/night-showroom-3840-pre-retouch.jpg) and writes
public/images/design/variant-c/photo-night-showroom-retouched.jpg. Three local edits, nothing global:
  1. badge  - the invented grille badge on the grey SUV's hood lip is replaced row by row with a
              linear fill between the plain hood lip on either side (plus matching fine noise).
  2. shelf  - the smeared display wall inside is sunk to the interior's shadow value (blur + darken).
  3. sedans - the dark sedan fused into the car behind the second mullion is sunk the same way.
Run: python3 workflow/homepage/c2/retouch.py   (from the project root)
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter

SRC = "workflow/homepage/c2/raw/night-showroom-3840-pre-retouch.jpg"
OUT = "public/images/design/variant-c/photo-night-showroom-retouched.jpg"

img = Image.open(SRC).convert("RGB")
a = np.asarray(img).astype(np.float32)
rng = np.random.default_rng(7)


def feather(h: int, w: int, box: tuple[int, int, int, int], soft: float) -> np.ndarray:
    m = np.zeros((h, w), np.float32)
    x0, y0, x1, y1 = box
    m[y0:y1, x0:x1] = 1
    return gaussian_filter(m, soft)[..., None]


H, W, _ = a.shape

# 1. badge: per-row linear fill across x 2786-2822 on the hood lip (y 1155-1171).
x0, x1, y0, y1 = 2786, 2822, 1155, 1172
fill = a.copy()
for y in range(y0, y1):
    left = a[y, x0 - 6 : x0].mean(0)
    right = a[y, x1 : x1 + 6].mean(0)
    t = np.linspace(0, 1, x1 - x0)[:, None]
    fill[y, x0:x1] = left * (1 - t) + right * t + rng.normal(0, 1.6, (x1 - x0, 1))
m = feather(H, W, (x0, y0, x1, y1), 1.2)
a = a * (1 - m) + fill * m

# 1b. the chrome trim under the badge is broken into blobs: smooth it along its own length (x only).
trim = gaussian_filter(a, (0, 7, 0))
m = feather(H, W, (2774, 1173, 2842, 1182), 1.0)
a = a * (1 - m) + trim * m

# 2 + 3. sink to the interior's shadow value: heavy blur, then darken toward it.
blurred = np.asarray(img.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
for box, keep, soft in (((2130, 986, 2370, 1086), 0.34, 10), ((2034, 1100, 2132, 1166), 0.40, 8)):
    m = feather(H, W, box, soft)
    sunk = blurred * keep
    a = a * (1 - m) + sunk * m

Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT, quality=86, progressive=True, optimize=True)
print("wrote", OUT)

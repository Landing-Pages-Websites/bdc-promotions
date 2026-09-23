"""Compose variant A's "Source work example" plate from the customer's own luxury
campaign creative. Every glyph and photo pixel comes from the supplied file; only the
arrangement changes (scene left, voucher elements restacked right), matching image 1.

Round 2: image 1 sets the call to action as a two-line pill ("MESSAGE OR" / "COMMENT NOW!").
The supplied pill is one line, 9:1, so at the panel's width its text rendered ~7px tall at
1536. It is now restacked from two real crops of that pill (each word pair with its own gold
ground, the top crop keeping the pill's top edge and the bottom crop its bottom edge) and
scaled 1.95x the round-1 size (to image 1's line height). Crops and uniform scaling only; no pixel is painted.

Run from the repo root:  python3 workflow/homepage/scripts/compose-source-work.py
"""
from PIL import Image, ImageDraw

SRC = "public/images/design/variant-a/work-luxury-campaign.png"
OUT = "public/images/design/variant-a/growth-source-work.png"

s = Image.open(SRC).convert("RGB")
W, H = 1254, 675
LEFT_W = 765
canvas = Image.new("RGB", (W, H), (8, 8, 9))

scene = s.crop((0, 0, 1122, 990)).resize((LEFT_W, H), Image.LANCZOS)
canvas.paste(scene, (0, 0))

panel_x, panel_w = LEFT_W, W - LEFT_W
# round 1 fitted the whole 915px pill to 450px; 1.95x that sets each text line ~14px tall at
# 1536, image 1's measured line height (the review's ~1.6x estimate left it at ~11.5px)
PILL_SCALE = 1.95 * 450 / 915
SEAM = 6
pieces = [  # (source box, target width, feathered sides "tblr")
    ((80, 1062, 250, 1152), 250, "tblr"),  # EXCLUSIVE SAVINGS
    ((295, 1046, 830, 1190), 400, "tblr"),  # $1,000
    ((250, 1190, 890, 1250), 400, "tblr"),  # SAVINGS VOUCHER
    # pill text rows: y 1297-1341 is the text, 1269/1369 the pill's top/bottom edges
    ((196, 1264, 532, 1345), None, "tlr"),  # MESSAGE OR (with the pill's top edge)
    ((531, 1293, 939, 1374), None, "blrs"),  # COMMENT NOW! (with the pill's bottom edge)
]


def feather(img: Image.Image, sides: str, edge: int = 14) -> Image.Image:
    # Soft alpha edges so each crop melts into the black panel instead of reading as a box.
    # A side left out stays hard, so the two pill rows join as one gold ground; "s" gives the
    # lower row a short top cross-fade over the row above it (SEAM px of overlap).
    mask = Image.new("L", img.size, 255)
    md = ImageDraw.Draw(mask)
    w, h = img.size
    if "s" in sides:
        for i in range(SEAM):
            md.line((0, i, w - 1, i), fill=round(255 * (i + 1) / (SEAM + 1)))
    for i in range(edge):
        v = round(255 * i / edge)
        if "t" in sides: md.line((0, i, w - 1, i), fill=v)
        if "b" in sides: md.line((0, h - 1 - i, w - 1, h - 1 - i), fill=v)
    for i in range(edge):
        v = round(255 * i / edge)
        for x in ([i] if "l" in sides else []) + ([w - 1 - i] if "r" in sides else []):
            col = mask.crop((x, 0, x + 1, h)).point(lambda p, v=v: min(p, v))
            mask.paste(col, (x, 0))
    return mask


scaled = []
for box, tw, sides in pieces:
    crop = s.crop(box)
    k = tw / crop.width if tw else PILL_SCALE
    size = (round(crop.width * k), round(crop.height * k))
    scaled.append((crop.resize(size, Image.LANCZOS), sides))

gap = 26
total = sum(p.height for p, _ in scaled) + gap * (len(scaled) - 2) - SEAM
y = (H - total) // 2
for i, (p, sides) in enumerate(scaled):
    canvas.paste(p, (panel_x + (panel_w - p.width) // 2, y), feather(p, sides))
    y += p.height + (-SEAM if i == len(scaled) - 2 else gap)  # the pill rows overlap

gold = (196, 158, 82)
d = ImageDraw.Draw(canvas)
d.rectangle((panel_x + 14, 16, W - 16, H - 17), outline=gold, width=2)
canvas.save(OUT, optimize=True)
print(OUT, canvas.size, f"pill scale {PILL_SCALE:.3f} (round 1: {450 / 915:.3f})")

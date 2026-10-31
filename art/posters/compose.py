"""Lay out the two RACCOON triptychs (three A4 panels each) from the website's mascot cut-outs.

  python art/posters/compose.py [--src public/art/video-concept] [--only spec|drop|signature]

Uses raccoon-hero-crossed-arms.png (spec sheet), raccoon-picks-box.png (streetwear drop) and
raccoon-story-card-presenter.png (signature) from the site, and writes,
per set, panel-1..3.png and .pdf (A4 at 300 DPI plus 3 mm bleed), full.png and a framed wall preview.
The artwork is one continuous 7440x3508 image; each panel is a slice of it, so the raccoon crosses the seams.
"""
import argparse, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
FONTS = os.path.join(ROOT, 'node_modules', '@fontsource')

PW, PH = 2480, 3508            # A4 at 300 DPI
BLEED = 36                     # 3 mm
W, H = PW * 3, PH              # trimmed artwork
CRIMSON = (200, 32, 47)        # site accent #C8202F
INK = (11, 10, 10)


def font(name, size):
    paths = {
        'bebas': os.path.join(FONTS, 'bebas-neue', 'files', 'bebas-neue-latin-400-normal.woff'),
        'archivo': os.path.join(FONTS, 'archivo', 'files', 'archivo-latin-500-normal.woff'),
        'archivo-bold': os.path.join(FONTS, 'archivo', 'files', 'archivo-latin-800-normal.woff'),
        'mono': 'C:/Windows/Fonts/consola.ttf',
        'jp': 'C:/Windows/Fonts/YuGothB.ttc',
    }
    return ImageFont.truetype(paths[name], size)


class Art:
    """The continuous artwork with bleed; all coordinates are in trimmed space (0..W, 0..H)."""

    def __init__(self, bg):
        self.im = Image.new('RGB', (W + 2 * BLEED, H + 2 * BLEED), bg)
        self.d = ImageDraw.Draw(self.im)

    def p(self, x, y):
        return (round(x + BLEED), round(y + BLEED))

    def paste(self, layer, x, y):
        self.im.paste(layer, self.p(x, y), layer)

    def text(self, x, y, s, f, fill, anchor='la', track=0):
        """Text with letter spacing (track, in px); anchor is applied to the whole run."""
        if not track:
            self.d.text(self.p(x, y), s, font=f, fill=fill, anchor=anchor)
            return
        widths = [f.getlength(c) + track for c in s]
        total = sum(widths) - track
        x0 = x - {'l': 0, 'm': total / 2, 'r': total}[anchor[0]]
        for c, w in zip(s, widths):
            self.d.text(self.p(x0, y), c, font=f, fill=fill, anchor='l' + anchor[1])
            x0 += w

    def glow(self, cx, cy, rx, ry, color, strength):
        """Soft elliptical light, added on top of the background."""
        yy, xx = np.mgrid[0:self.im.height, 0:self.im.width].astype(np.float32)
        cx, cy = self.p(cx, cy)
        r = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        a = np.clip(1 - r, 0, 1) ** 2.2 * strength
        base = np.asarray(self.im).astype(np.float32)
        base += a[..., None] * np.array(color, np.float32)[None, None]
        self.im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
        self.d = ImageDraw.Draw(self.im)

    def light(self, mask, color, strength):
        """Add `color` through an L mask (full canvas size, bleed included)."""
        base = np.asarray(self.im).astype(np.float32)
        a = np.asarray(mask).astype(np.float32)[..., None] / 255 * strength
        base += a * np.array(color, np.float32)[None, None]
        self.im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
        self.d = ImageDraw.Draw(self.im)

    def beam(self, x_top, w_top, w_bottom, color, strength, blur=160):
        """A soft spotlight cone falling from the top edge."""
        m = Image.new('L', self.im.size)
        ImageDraw.Draw(m).polygon([self.p(x_top - w_top / 2, -BLEED), self.p(x_top + w_top / 2, -BLEED),
                                   self.p(x_top + w_bottom / 2, H), self.p(x_top - w_bottom / 2, H)], fill=255)
        self.light(m.filter(ImageFilter.GaussianBlur(blur)), color, strength)

    def halftone(self, cx, cy, radius, color, strength, step=36):
        """Dots that shrink away from (cx, cy): a printed-poster texture in the corners."""
        m = Image.new('L', self.im.size)
        d = ImageDraw.Draw(m)
        for y in range(int(cy - radius), int(cy + radius), step):
            for x in range(int(cx - radius), int(cx + radius), step):
                k = 1 - math.hypot(x - cx, y - cy) / radius
                if k > 0.04:
                    r = step * 0.48 * k ** 0.8
                    px, py = self.p(x, y)
                    d.ellipse([px - r, py - r, px + r, py + r], fill=255)
        self.light(m, color, strength)

    def grid(self, step, color):
        for x in range(0, W + 1, step):
            self.d.line([self.p(x, 0), self.p(x, H)], fill=color, width=2)
        for y in range(0, H + 1, step):
            self.d.line([self.p(0, y), self.p(W, y)], fill=color, width=2)

    def finish(self, grain=7, vignette=0.55):
        a = np.asarray(self.im).astype(np.float32)
        h, w = a.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
        a *= (1 - vignette * np.clip(r - 0.55, 0, 1) ** 1.5)[..., None]
        a += np.random.default_rng(7).normal(0, grain, (h, w, 1))
        self.im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def giant(art, s, top, fill_top, fill_bottom, width=W - 340, outline=0):
    """The big background word, fitted to `width`, filled with a vertical gradient (or only its outline)."""
    f = font('bebas', 1000)
    l, t, r, b = f.getbbox(s)
    f = font('bebas', int(1000 * width / (r - l)))
    l, t, r, b = f.getbbox(s)
    mask = Image.new('L', (r - l, b - t))
    ImageDraw.Draw(mask).text((-l, -t), s, font=f, fill=255)
    if outline:
        ring = Image.new('L', mask.size)
        ImageDraw.Draw(ring).text((-l, -t), s, font=f, fill=255, stroke_width=outline, stroke_fill=255)
        mask = ImageChops.subtract(ring, mask)
    g = np.linspace(0, 1, mask.height)[:, None, None]
    fill = (np.array(fill_top) * (1 - g) + np.array(fill_bottom) * g).repeat(mask.width, 1)
    layer = Image.fromarray(fill.astype(np.uint8)).convert('RGBA')
    layer.putalpha(mask)
    art.paste(layer, (W - mask.width) / 2, top)
    return (W - mask.width) / 2, top, mask.width, mask.height


def cutout(path, height, fade=0.0):
    """Trim the transparent cut-out, scale it to `height`, optionally fade the flat bottom cut.
    The site art is ~1300 px tall, so it is upscaled about 2.5x; a light unsharp mask keeps the fur crisp."""
    im = Image.open(path).convert('RGBA')
    l, t, r, b = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    im = im.crop((l, t, r, im.height))
    im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    a = im.getchannel('A')
    im = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2)).convert('RGBA')
    im.putalpha(a)
    if fade:
        a = np.asarray(im.getchannel('A')).astype(np.float32)
        ramp = np.clip((im.height - np.arange(im.height)) / (im.height * fade), 0, 1) ** 1.4
        im.putalpha(Image.fromarray((a * ramp[:, None]).astype(np.uint8)))
    return im


def shadowed(layer, blur=40, opacity=0.6):
    """A copy of `layer` with a soft dark halo behind it so it separates from the background word."""
    pad = blur * 3
    out = Image.new('RGBA', (layer.width + 2 * pad, layer.height + 2 * pad))
    sh = Image.new('L', out.size)
    sh.paste(layer.getchannel('A'), (pad, pad))
    sh = sh.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * opacity))
    out.paste(Image.new('RGBA', out.size, (0, 0, 0, 255)), (0, 0), sh)
    out.alpha_composite(layer, (pad, pad))
    return out, pad


# ---------------------------------------------------------------- set 1: spec sheet

def spec_sheet(src):
    art = Art(INK)
    art.glow(W / 2, 1500, 3000, 1700, CRIMSON, 0.30)
    giant(art, 'RACCOON', 300, (52, 48, 48), (16, 14, 14))

    # rule and panel ticks, behind the raccoon
    y = 2960
    art.d.rectangle([art.p(170, y), art.p(W - 170, y + 3)], fill=(60, 54, 54))
    for i in (0, 2):
        cx = PW * i + PW / 2
        art.d.rectangle([art.p(cx - 90, y - 2), art.p(cx + 90, y + 5)], fill=CRIMSON)

    # crossed arms, hoodie hem running off the bottom edge
    rc = cutout(os.path.join(src, 'raccoon-hero-crossed-arms.png'), 3180)
    rc, pad = shadowed(rc, opacity=0.5)
    left = (W - rc.width) / 2
    art.paste(rc, left, H - rc.height + pad + BLEED)
    left, right = left + pad, left + rc.width - pad

    # specs in the clear space either side of the raccoon
    lab, val = font('archivo', 40), font('archivo-bold', 64)
    specs = [[('SPECIES', 'PROCYON LOTOR'), ('HABITAT', 'THE HUB, AFTER DARK')],
             [('AUDIO', 'ALWAYS ON'), ('FIT', 'OVERSIZED HOODIE')]]
    for (x0, x1), items in zip([(170, left - 80), (right + 80, W - 170)], specs):
        for j, (k, v) in enumerate(items):
            cx = x0 + (x1 - x0) * (0.25 + 0.5 * j)
            art.text(cx, 3060, k, lab, (140, 132, 132), 'ma', track=10)
            art.text(cx, 3130, v, val, (240, 236, 232), 'ma', track=2)
    art.text(PW * 0.5, 3290, 'STREETWEAR SERIES  —  001', font('archivo', 38), CRIMSON, 'ma', track=12)
    art.text(PW * 2.5, 3290, 'NO. 01  ·  HAND-PICKED', font('archivo', 38), CRIMSON, 'ma', track=12)

    # corners
    art.d.rectangle([art.p(170, 190), art.p(206, 226)], fill=CRIMSON)
    art.text(236, 208, 'RACCOON HUB', font('archivo-bold', 44), (240, 236, 232), 'lm', track=8)
    art.text(W - 170, 208, '[2026]', font('mono', 46), (140, 132, 132), 'rm')
    for i in (0, 2):
        art.text(PW * i + PW - 170, H - 120, f'0{i + 1} / 03', font('mono', 34), (100, 94, 94), 'rm')
    art.text(170, H - 120, 'SMALL FINDS. HAND-PICKED.', font('mono', 34), (100, 94, 94), 'lm')
    art.finish()
    return art


# ---------------------------------------------------------------- set 2: streetwear drop

def barcode(art, x, y, w, h, seed=2026):
    rng = np.random.default_rng(seed)
    cx = x
    while cx < x + w:
        bw = int(rng.choice([6, 6, 10, 14, 20]))
        if rng.random() > 0.35:
            art.d.rectangle([art.p(cx, y), art.p(min(cx + bw, x + w), y + h)], fill=(240, 236, 232))
        cx += bw + int(rng.choice([6, 8, 12]))


def stamp(art, cx, cy, s, angle, color):
    f = font('bebas', 210)
    l, t, r, b = f.getbbox(s)
    pad = 60
    layer = Image.new('RGBA', (r - l + 2 * pad, b - t + 2 * pad))
    d = ImageDraw.Draw(layer)
    d.rectangle([12, 12, layer.width - 13, layer.height - 13], outline=color, width=14)
    d.text((pad - l, pad - t), s, font=f, fill=color)
    layer = layer.rotate(angle, expand=True, resample=Image.BICUBIC)
    art.paste(layer, cx - layer.width / 2, cy - layer.height / 2)


def streetwear_drop(src):
    art = Art((8, 7, 7))
    art.glow(W / 2, 900, 2600, 1500, CRIMSON, 0.22)
    giant(art, 'RACCOON', 1060, (214, 36, 52), (150, 18, 30))

    # carrying the drop box, cargo pants running off the bottom edge
    rc = cutout(os.path.join(src, 'raccoon-picks-box.png'), 3300)
    rc, pad = shadowed(rc, blur=50, opacity=0.6)
    rx = (W - rc.width) / 2
    art.paste(rc, rx, H - rc.height + pad + BLEED)

    white, grey = (244, 240, 236), (150, 142, 142)
    # panel 1: vertical katakana and the LIMITED stamp
    jp = font('jp', 430)
    for i, c in enumerate('アライグマ'):
        art.text(400, 420 + i * 470, c, jp, white, 'mt')
    mono = font('mono', 38)
    rail = Image.new('RGBA', (2300, 60))
    ImageDraw.Draw(rail).text((0, 30), 'RACCOON  //  STREETWEAR SERIES  //  DROP 001  //  AFTER DARK',
                              font=mono, fill=grey, anchor='lm')
    rail = rail.rotate(90, expand=True)
    art.paste(rail, 760, 440)
    stamp(art, 1250, 3120, 'LIMITED', 8, CRIMSON)

    # panel 3: drop number, size tag, barcode
    art.text(W - 200, 330, 'DROP 001', font('bebas', 330), white, 'ra', track=6)
    art.text(W - 200, 700, '/ 2026', font('bebas', 200), CRIMSON, 'ra', track=6)
    tx, ty = W - 200 - 1150, 2780
    art.d.rectangle([art.p(tx, ty), art.p(W - 200, ty + 140)], outline=white, width=5)
    art.d.line([art.p(tx + 575, ty), art.p(tx + 575, ty + 140)], fill=white, width=5)
    tag = font('archivo-bold', 52)
    art.text(tx + 287, ty + 70, 'SIZE  OS', tag, white, 'mm', track=6)
    art.text(tx + 862, ty + 70, 'QTY  1 / 1', tag, white, 'mm', track=6)
    barcode(art, tx, ty + 200, 1150, 190)
    art.text(tx, ty + 450, 'RCN-001-2026', font('mono', 40), grey, 'lm')
    art.text(W - 200, ty + 450, 'RACCOON HUB', font('archivo-bold', 40), white, 'rm', track=8)

    # panel 2: top rail
    art.text(W / 2, 200, 'HAND-PICKED  ·  STREETWEAR SERIES  ·  NOT FOR SALE', font('mono', 40), grey, 'mm', track=4)
    art.finish(grain=9)
    return art


# ---------------------------------------------------------------- set 3: signature (presenting raccoon across all three panels)

def signature(src):
    art = Art((7, 6, 6))
    art.grid(310, (17, 14, 14))
    art.glow(W / 2, 1300, 3400, 1900, (120, 10, 22), 0.55)          # deep red room light
    art.beam(W / 2, 700, 3600, (255, 70, 80), 0.16)                # spotlight onto the raccoon
    art.halftone(0, H, 1500, CRIMSON, 0.30)                        # printed dots, bottom-left / top-right
    art.halftone(W, 0, 1500, CRIMSON, 0.30)
    giant(art, 'RACCOON', 1000, (226, 40, 56), (128, 14, 26))
    art.glow(W / 2, H + 120, 2600, 420, (255, 40, 60), 0.45)       # floor glow where the hoodie meets the edge

    # presenting pose: the open hand reaches into panel 1, the head sits in panel 2,
    # the far arm crosses into panel 3; the hoodie runs SINK px past the bottom edge
    SINK, HAND_X = 520, 980
    rc = cutout(os.path.join(src, 'raccoon-story-card-presenter.png'), H + SINK - 120)
    rc, pad = shadowed(rc, blur=60, opacity=0.8)
    art.paste(rc, HAND_X - pad, H + SINK - rc.height + pad)

    white, grey = (244, 240, 236), (150, 142, 142)
    # panel 1: brand, vertical katakana and rail, specs
    art.d.rectangle([art.p(170, 190), art.p(206, 226)], fill=CRIMSON)
    art.text(236, 208, 'RACCOON HUB', font('archivo-bold', 44), white, 'lm', track=8)
    jp = font('jp', 430)
    for i, c in enumerate('アライグマ'):
        art.text(400, 420 + i * 470, c, jp, white, 'mt')
    rail = Image.new('RGBA', (2300, 60))
    ImageDraw.Draw(rail).text((0, 30), 'RACCOON  //  STREETWEAR SERIES  //  NO. 001  //  AFTER DARK',
                              font=font('mono', 38), fill=grey, anchor='lm')
    art.paste(rail.rotate(90, expand=True), 760, 440)
    lab, val = font('archivo', 40), font('archivo-bold', 60)
    for x, (k, v) in zip((170, 1080), [('SPECIES', 'PROCYON LOTOR'), ('HABITAT', 'THE HUB, AFTER DARK')]):
        art.text(x, 3060, k, lab, grey, 'la', track=10)
        art.text(x, 3125, v, val, white, 'la', track=2)

    # panel 3: number, tag, barcode
    art.text(W - 200, 330, 'NO. 001', font('bebas', 330), white, 'ra', track=6)
    art.text(W - 200, 700, '/ 2026', font('bebas', 200), CRIMSON, 'ra', track=6)
    tx, ty = W - 200 - 1150, 2780
    art.d.rectangle([art.p(tx, ty), art.p(W - 200, ty + 140)], outline=white, width=5)
    art.d.line([art.p(tx + 575, ty), art.p(tx + 575, ty + 140)], fill=white, width=5)
    tag = font('archivo-bold', 50)
    art.text(tx + 287, ty + 70, 'AUDIO  ON', tag, white, 'mm', track=6)
    art.text(tx + 862, ty + 70, 'FIT  OS', tag, white, 'mm', track=6)
    barcode(art, tx, ty + 200, 1150, 190)
    art.text(tx, ty + 450, 'RCN-001-2026', font('mono', 40), grey, 'lm')
    art.text(W - 200, ty + 450, 'SMALL FINDS. HAND-PICKED.', font('archivo-bold', 34), white, 'rm', track=6)
    art.finish(grain=9, vignette=0.7)
    return art


# ---------------------------------------------------------------- set 4: trio (past / present / future)

GOLD, MAGENTA = (222, 160, 52), (218, 44, 200)


def era_colour(x):
    """Gold over panel 1, crimson over panel 2, magenta over panel 3, blending across each seam."""
    stops = [0, PW * 0.72, PW * 1.28, PW * 1.72, PW * 2.28, W]
    cols = np.array([GOLD, GOLD, CRIMSON, CRIMSON, MAGENTA, MAGENTA], np.float32)
    t = np.clip(x, 0, W)
    return np.stack([np.interp(t, stops, cols[:, c]) for c in range(3)], -1)


def scaled(path, s):
    im = Image.open(path).convert('RGBA')
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    a = im.getchannel('A')
    im = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2)).convert('RGBA')
    im.putalpha(a)
    return im


def trio(src):
    gen = os.path.join(HERE, 'source')
    art = Art(INK)
    ch, cw = art.im.height, art.im.width
    xs = np.arange(cw, dtype=np.float32) - BLEED
    ys = np.arange(ch, dtype=np.float32)[:, None] - BLEED
    col = era_colour(xs)[None]                                       # 1 x width x 3

    # one continuous room: dark tint of the era colour plus a glow behind each raccoon
    glow = sum(np.exp(-(((xs - (PW * i + PW / 2)) / 1500) ** 2 + ((ys - 1300) / 1700) ** 2)) for i in range(3))
    floor = np.exp(-((ys - H) / 420) ** 2)
    base = col * (0.07 + 0.42 * glow[..., None] + 0.35 * floor[..., None])
    art.im = Image.fromarray(np.clip(base + 6, 0, 255).astype(np.uint8))
    art.d = ImageDraw.Draw(art.im)
    art.grid(310, (22, 17, 17))
    art.halftone(0, H, 1500, GOLD, 0.22)
    art.halftone(W, 0, 1500, MAGENTA, 0.26)

    # the giant word, filled with the same left-to-right blend
    f = font('bebas', 1000)
    l, t, r, b = f.getbbox('RACCOON')
    f = font('bebas', int(1000 * (W - 340) / (r - l)))
    l, t, r, b = f.getbbox('RACCOON')
    mask = Image.new('L', (r - l, b - t))
    ImageDraw.Draw(mask).text((-l, -t), 'RACCOON', font=f, fill=255)
    gx, gy = (W - mask.width) / 2, 640
    shade = np.linspace(1.0, 0.55, mask.height)[:, None, None]
    fill = era_colour(np.arange(mask.width) + gx)[None] * shade
    layer = Image.fromarray(np.clip(fill, 0, 255).astype(np.uint8)).convert('RGBA')
    layer.putalpha(mask)
    art.paste(layer, gx, gy)

    # raccoons: ears on one line, side ones a touch smaller, the leader in front.
    # (path, scale, ear-top y in source px, face centre x in source px, face x on the poster)
    cast = [
        (os.path.join(gen, 'left-samurai-cut.png'), 2.75, 70, 525, PW * 0.5 - 60),
        (os.path.join(gen, 'right-cyberpunk-cut.png'), 2.3, 20, 570, PW * 2.5 + 60),
        (os.path.join(src, 'raccoon-hero-crossed-arms.png'), 2.48, 15, 610, PW * 1.5),
    ]
    for path, s, ear, face, x in cast:
        rc, pad = shadowed(scaled(path, s), blur=60, opacity=0.85)
        art.paste(rc, x - face * s - pad, 330 - ear * s - pad)

    # dark band at the bottom for the era captions
    a = np.asarray(art.im).astype(np.float32)
    band = np.clip((ys - 2700) / 700, 0, 1) ** 1.3
    a *= 1 - 0.88 * band[..., None]
    art.im = Image.fromarray(a.astype(np.uint8))
    art.d = ImageDraw.Draw(art.im)

    white, grey = (244, 240, 236), (150, 142, 142)
    eras = [('01  —  PAST  ·  1600', 'SAMURAI', '侍', GOLD),
            ('02  —  PRESENT  ·  2026', 'STREETWEAR', '今', CRIMSON),
            ('03  —  FUTURE  ·  2099', 'CYBERPUNK', '未来', MAGENTA)]
    for i, (small, big, jp, c) in enumerate(eras):
        cx = PW * i + PW / 2
        art.text(cx, 3020, small, font('mono', 40), grey, 'ma', track=4)
        art.text(cx, 3085, big, font('bebas', 250), c, 'ma', track=14)
        art.text(cx, 3330, jp, font('jp', 70), white, 'ma')

    art.d.rectangle([art.p(170, 190), art.p(206, 226)], fill=GOLD)
    art.text(236, 208, 'RACCOON HUB', font('archivo-bold', 44), white, 'lm', track=8)
    art.text(W - 170, 208, 'PAST  ·  PRESENT  ·  FUTURE', font('mono', 40), grey, 'rm', track=4)
    art.finish(grain=9, vignette=0.6)
    return art


# ---------------------------------------------------------------- set 5: ink sketch on red

INK_RED, PEN = (222, 34, 40), (18, 12, 12)


def blur(a, r):
    """Gaussian blur of a float array in 0..1 (via 8-bit PIL, plenty for tone work)."""
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def noise(shape, scale, rng):
    """Smooth value noise in 0..1 at roughly `scale` px."""
    h, w = shape
    small = rng.random((max(2, h // scale), max(2, w // scale)))
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(im).astype(np.float32) / 255


def ink_sketch(rgba, seed=3):
    """Turn a colour cut-out into a pen drawing: XDoG outlines, tone-driven cross-hatching that wobbles
    like a hand-drawn line, fur strokes from fine detail, and the red piping kept in red."""
    rng = np.random.default_rng(seed)
    rgb = np.asarray(rgba.convert('RGB')).astype(np.float32) / 255
    lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
    lum = np.clip((lum - 0.05) / 0.8, 0, 1) ** 0.8                     # open up the darks a little
    h, w = lum.shape

    d = blur(lum, 2.5) - 0.985 * blur(lum, 7)                          # XDoG outlines
    lines = np.where(d > -0.004, 1.0, 1 + np.tanh(160 * (d + 0.004)))

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    wob = (noise((h, w), 90, rng) - 0.5) * 16                          # hand wobble
    def hatch(angle, spacing, width):
        a = math.radians(angle)
        t = (xx * math.cos(a) + yy * math.sin(a) + wob) % spacing
        return np.where(t < width, 0.0, 1.0)
    tone = blur(lum, 4) + (noise((h, w), 30, rng) - 0.5) * 0.08
    hatches = np.ones_like(lum)
    for thr, ang, sp, wd in [(0.62, 45, 15, 2.4), (0.44, -45, 15, 2.6), (0.28, 0, 13, 2.8), (0.14, 80, 11, 3.2)]:
        hatches = np.minimum(hatches, np.where(tone < thr, hatch(ang, sp, wd), 1.0))

    fine = lum - blur(lum, 3)                                          # fur strands and creases
    strokes = np.clip(1 + fine * 9, 0.15, 1)

    ink = np.minimum(np.minimum(lines, hatches), strokes)
    paper = 0.97 - 0.30 * (1 - blur(lum, 10))                          # soft grey wash under the pen
    grey = np.clip(paper * ink, 0, 1)

    out = np.repeat(grey[..., None], 3, -1) * 255
    # red stays red: piping, drawstrings, headphone rings
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    red = np.clip((r - np.maximum(g, b) * 1.7 - 0.08) * 5, 0, 1)[..., None]
    out = out * (1 - red) + np.array(INK_RED, np.float32) * (0.35 + 0.65 * grey[..., None]) * red
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert('RGBA')
    im.putalpha(rgba.getchannel('A'))
    return im


def splatter(art, cx, cy, spread, count, seed, color=PEN, max_r=60):
    """Ink splats: a few big blots, many specks, and thin flicked streaks radiating out."""
    rng = np.random.default_rng(seed)
    for _ in range(count):
        ang = rng.uniform(0, 2 * math.pi)
        dist = abs(rng.normal(0, spread))
        x, y = cx + math.cos(ang) * dist, cy + math.sin(ang) * dist
        r = min(max_r, max(2.0, 30 * rng.pareto(2.2) * math.exp(-dist / spread)))
        px, py = art.p(x, y)
        art.d.ellipse([px - r, py - r, px + r, py + r], fill=color)
        if rng.random() < 0.25:                                        # flick streak
            l = rng.uniform(80, 420)
            art.d.line([(px, py), (px + math.cos(ang) * l, py + math.sin(ang) * l)], fill=color,
                       width=max(2, int(r / 3)))


def distressed_title(art, s, top, height, x0=170, x1=W - 170):
    """Giant condensed white word between x0 and x1, worn like a screen print, with a thin white outline."""
    f = font('bebas', 1000)
    l, t, r, b = f.getbbox(s)
    f = font('bebas', int(1000 * (x1 - x0) / (r - l)))
    l, t, r, b = f.getbbox(s)
    mask = Image.new('L', (r - l + 160, b - t + 160))
    ImageDraw.Draw(mask).text((80 - l, 80 - t), s, font=f, fill=255)
    mask = mask.resize((mask.width, round(mask.height * height / (b - t))), Image.LANCZOS)
    m = np.asarray(mask).astype(np.float32) / 255
    rng = np.random.default_rng(11)
    wear = noise(m.shape, 90, rng) * 0.5 + noise(m.shape, 9, rng) * 0.5
    scratch = noise((m.shape[0], 1), 3, rng).repeat(m.shape[1], 1) * noise(m.shape, 400, rng)
    fill = m * (wear < 0.72) * (scratch < 0.55)
    # outline: a thin ring ~18 px outside the letters
    small = mask.resize((mask.width // 4, mask.height // 4), Image.BILINEAR)
    outer = small.filter(ImageFilter.MaxFilter(11)).resize(mask.size, Image.BILINEAR)
    inner = small.filter(ImageFilter.MaxFilter(7)).resize(mask.size, Image.BILINEAR)
    ring = np.clip((np.asarray(outer).astype(np.float32) - np.asarray(inner)) / 255 * 3, 0, 1)
    a = np.clip(np.maximum(fill * 0.96, ring * 0.9 * (noise(m.shape, 40, rng) < 0.8)), 0, 1)
    layer = Image.new('RGBA', mask.size, (246, 242, 236, 0))
    layer.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    art.paste(layer, (x0 + x1) / 2 - mask.width / 2, top - 80)


def ink(src):
    art = Art(INK_RED)
    art.glow(W / 2, H / 2, 5200, 2600, (40, 10, 10), 0.6)             # slightly lighter centre
    distressed_title(art, 'RACCOON', 470, 2560)

    rc = cutout(os.path.join(src, 'raccoon-hero-crossed-arms.png'), 3520)
    rc = ink_sketch(rc)
    left = 1500 - rc.width * 0.5                 # face inside panel 1, the crossed arm reaching over the seam
    splatter(art, left + rc.width * 0.5, 1700, 1300, 420, seed=5)
    art.paste(rc, left, H - rc.height + BLEED + 40)
    splatter(art, left + rc.width * 0.5, 2400, 1500, 120, seed=9, max_r=14)   # specks over the drawing

    small = font('mono', 34)
    art.text(170, 170, 'RACCOON HUB  ·  NO. 001', small, PEN, 'la', track=4)
    art.text(W - 170, H - 170, 'SMALL FINDS. HAND-PICKED.  ·  2026', small, PEN, 'rd', track=4)
    art.finish(grain=8, vignette=0.35)
    return art


# ---------------------------------------------------------------- set 6: ink splash (generated art, title behind the ink)

def ink_splash(src):
    """source/ink.png: the raccoon and its splatter on flat red. The red is keyed out so the worn title can sit
    behind the ink, and the canvas is rebuilt in the same red, which also adds headroom above the ears."""
    from matte import silhouette
    im = Image.open(os.path.join(HERE, 'source', 'ink.png')).convert('RGB')
    rgb = np.asarray(im).astype(np.float32) / 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bg_like = (r - np.maximum(g, b)) / np.maximum(r, 1e-4) * np.clip(r / 0.6, 0, 1)
    soft = np.clip((0.8 - bg_like) / 0.25, 0, 1)
    # the raccoon itself (left ~37%) is solid: fill its red piping and drawstrings back in
    body = np.zeros_like(soft, bool)
    cut = int(im.width * 0.37)
    body[:, :cut] = silhouette(soft[:, :cut] > 0.5, 3, row_fill=False)
    alpha = np.maximum(soft, body)
    # the source's top edge cuts the splatter flat: fade black ink out toward it (the grey-white ears stay)
    lum = rgb.max(2)
    edge = np.clip(np.arange(im.height, dtype=np.float32) / 60, 0, 1)[:, None]
    alpha = np.where(lum < 0.12, alpha * edge ** 1.5, alpha)
    red = tuple(int(v) for v in np.median(np.asarray(im)[soft < 0.02], 0))

    s = (W + 2 * BLEED) / im.width
    rc = im.convert('RGBA')
    rc.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    rc = rc.resize((W + 2 * BLEED, round(im.height * s)), Image.LANCZOS)
    a = rc.getchannel('A')
    rc = rc.convert('RGB').filter(ImageFilter.UnsharpMask(radius=4, percent=70, threshold=2)).convert('RGBA')
    rc.putalpha(a)

    art = Art(red)
    art.glow(W * 0.62, H * 0.45, 4200, 2400, (255, 255, 255), 0.05)    # a faint lift behind the title
    distressed_title(art, 'RACCOON', 640, 2300, x0=2760, x1=W - 200)
    art.paste(rc, -BLEED, H + BLEED - rc.height)                          # bottom-aligned: new red headroom on top

    small = font('mono', 34)
    art.text(W - 200, 330, 'RACCOON HUB  ·  NO. 001', small, PEN, 'ra', track=4)
    art.text(W - 200, H - 200, 'SMALL FINDS. HAND-PICKED.  ·  2026', small, PEN, 'rd', track=4)
    art.finish(grain=6, vignette=0.3)
    return art


# ---------------------------------------------------------------- set 7: arms wide (generated cinematic poster)

def arms_wide(src):
    """source/arms-wide.png: a 16:9 poster stored sideways. Turn it upright, widen it to the triptych's shape by
    stretching the blurred city bokeh at both edges (cropping would cut the hands or the title), lift the
    shadows a little for print, and upscale."""
    im = Image.open(os.path.join(HERE, 'source', 'arms-wide.png')).convert('RGB').rotate(90, expand=True)
    im = im.crop((0, 20, im.width, im.height))                    # trim a sliver of empty sky
    h = im.height
    tw = round(h * W / H)
    ext_l = (tw - im.width) // 2
    ext_r = tw - im.width - ext_l
    wide = Image.new('RGB', (tw, h))
    sides = os.path.join(HERE, 'source', 'arms-sides.png')
    if os.path.exists(sides):
        # a zoomed-out redraw of the same scene supplies real city for the sides: scale it so its title
        # (x 235-1310, y 228-555) lands on the original's (x 56-1624, y 90-584, before the 20 px trim)
        s = 1.48
        new = Image.open(sides).convert('RGB')
        new = new.resize((round(new.width * s), round(new.height * s)), Image.LANCZOS)
        new = new.filter(ImageFilter.GaussianBlur(3))             # match the original's softer focus
        ox = ext_l + (56 + 1624) / 2 - (235 + 1310) / 2 * s
        oy = (90 + 584) / 2 - 20 - (228 + 555) / 2 * s
        wide.paste(new, (round(ox), round(oy)))
        # match the side colour to the original's edges
        o = np.asarray(im).astype(np.float32)
        wa = np.asarray(wide).astype(np.float32)
        ref = np.concatenate([o[:, :40], o[:, -40:]], 1).reshape(-1, 3).mean(0)
        got = np.concatenate([wa[:, ext_l:ext_l + 40], wa[:, ext_l + im.width - 40:ext_l + im.width]], 1) \
            .reshape(-1, 3).mean(0)
        wide = Image.fromarray(np.clip(wa * (ref / np.maximum(got, 1)), 0, 255).astype(np.uint8))
        # the original on top, feathered over 90 px at both sides
        m = np.ones((h, im.width), np.float32)
        ramp = np.linspace(0, 1, 90)
        m[:, :90], m[:, -90:] = ramp, ramp[::-1]
        wide.paste(im, (ext_l, 0), Image.fromarray((m * 255).astype(np.uint8)))
    else:
        wide.paste(im, (ext_l, 0))
    # without a sides image: smear the outermost columns outward (no letters there), blur, and fade
    for side, ext in (('l', ext_l), ('r', ext_r)) if not os.path.exists(sides) else ():
        col = im.crop((0, 0, 6, h) if side == 'l' else (im.width - 6, 0, im.width, h))
        fill = col.resize((ext + 60, h), Image.BILINEAR).filter(ImageFilter.GaussianBlur(38))   # streaks -> haze
        a = np.asarray(fill).astype(np.float32)
        ramp = np.linspace(0.35, 1.0, fill.width)[None, :, None] ** 1.3
        if side == 'r':
            ramp = ramp[:, ::-1]
        fill = Image.fromarray((a * ramp).astype(np.uint8))
        # crossfade 60 px into the picture so the join disappears
        m = np.ones((h, fill.width), np.float32)
        fade = np.linspace(1, 0, 60)
        if side == 'l':
            m[:, ext:] = fade[None]
            wide.paste(fill, (0, 0), Image.fromarray((m * 255).astype(np.uint8)))
        else:
            m[:, :60] = fade[::-1][None]
            wide.paste(fill, (tw - fill.width, 0), Image.fromarray((m * 255).astype(np.uint8)))

    # lift the shadows slightly: prints come out darker than screens
    a = np.asarray(wide).astype(np.float32) / 255
    a = a ** 0.86 * 1.03
    wide = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))

    cw, ch = W + 2 * BLEED, H + 2 * BLEED
    s = max(cw / wide.width, ch / wide.height)
    wide = wide.resize((round(wide.width * s), round(wide.height * s)), Image.LANCZOS)
    wide = wide.filter(ImageFilter.UnsharpMask(radius=4, percent=70, threshold=2))
    x0, y0 = (wide.width - cw) // 2, (wide.height - ch) // 2
    art = Art(INK)
    art.im = wide.crop((x0, y0, x0 + cw, y0 + ch))
    art.d = ImageDraw.Draw(art.im)
    art.finish(grain=5, vignette=0.0)
    return art


# ---------------------------------------------------------------- set 8: noir (generated, letterboxed)

def noir(src):
    """source/noir.png: ChatGPT can only make 3:2, so the picture was generated between black letterbox bars.
    Find the bars, trim the strip to exactly the triptych's shape (biased to keep the fingertips), upscale."""
    im = Image.open(os.path.join(HERE, 'source', 'noir.png')).convert('RGB')
    lit = np.asarray(im).max(2) > 18
    rows = np.flatnonzero(lit.mean(1) > 0.02)
    top, bottom = rows.min(), rows.max() + 1
    need = round(im.width * H / W)
    extra = (bottom - top) - need
    top += round(extra * 0.43)                     # less off the top: the fingertips are near it
    strip = im.crop((0, top, im.width, top + need))
    cw, ch = W + 2 * BLEED, H + 2 * BLEED
    s = max(cw / strip.width, ch / strip.height)
    big = strip.resize((round(strip.width * s), round(strip.height * s)), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=4, percent=60, threshold=2))
    x0, y0 = (big.width - cw) // 2, (big.height - ch) // 2
    art = Art(INK)
    art.im = big.crop((x0, y0, x0 + cw, y0 + ch))
    art.d = ImageDraw.Draw(art.im)
    art.finish(grain=4, vignette=0.0)
    return art


def noir_mono(src):
    """The noir poster graded like the Spider-Noir reference: violet-grey near-monochrome, harder contrast,
    Ben-Day halftone dots in the mid-tones, darker edges. Only the amber eyes and a hint of crimson keep colour."""
    art = noir(src)
    a = np.asarray(art.im).astype(np.float32) / 255
    h, w = a.shape[:2]
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    lum = a @ np.array([0.3, 0.59, 0.11], np.float32)
    lum = np.clip((lum - 0.02) / 0.8, 0, 1)
    lum = 0.5 * lum + 0.5 * lum * lum * (3 - 2 * lum)                  # half S-curve: firmer, not crushed

    # duotone: near-black violet shadows -> cool violet-white highlights
    dark, light = np.array([12, 10, 22], np.float32), np.array([226, 222, 248], np.float32)
    mono = dark + (light - dark) * lum[..., None]
    # the sky and city were violet: keep them as a violet haze (the hoodie and gloves are neutral black)
    sky = np.clip((a[..., 2] - a[..., 0] * 1.08) * 9, 0, 1) * np.clip((mx - 0.08) * 6, 0, 1)
    haze = np.array([118, 104, 168], np.float32) * (0.35 + 0.65 * lum[..., None])
    mono = mono * (1 - sky[..., None] * 0.55) + haze * sky[..., None] * 0.55

    # Ben-Day dots at 45 degrees, strongest in the mid-tones
    step = 15.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    u, v = (xx + yy) * 0.7071, (xx - yy) * 0.7071
    du, dv = (u % step) - step / 2, (v % step) - step / 2
    d = np.sqrt(du * du + dv * dv) / (step / 2)
    del yy, xx, u, v, du, dv
    radius = np.sqrt(np.clip(1 - lum, 0, 1)) * 0.95
    mid = np.clip(1 - np.abs(lum - 0.45) / 0.4, 0, 1)
    dots = np.clip((radius - d) * 6, 0, 1) * mid
    mono *= (1 - 0.42 * dots)[..., None]

    # keep colour only where it was strongly warm: amber eyes, crimson lining, drawstrings and rings
    hue_warm = (a[..., 0] > a[..., 2] * 1.4) & (a[..., 0] > a[..., 1] * 1.15)
    keep = np.clip((sat - 0.45) * 3, 0, 1) * hue_warm * np.clip(mx * 2.5, 0, 1)
    out = mono * (1 - keep[..., None] * 0.75) + a * 255 * keep[..., None] * 0.75

    # darker edges, like the reference
    ey = np.abs(np.linspace(-1, 1, h))[:, None]
    ex = np.abs(np.linspace(-1, 1, w))[None]
    out *= (1 - 0.45 * np.clip(np.maximum(ex - 0.55, 0) / 0.45, 0, 1) ** 1.6
            - 0.35 * np.clip(np.maximum(ey - 0.6, 0) / 0.4, 0, 1) ** 1.6)[..., None]
    art.im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    art.d = ImageDraw.Draw(art.im)
    return art


# ---------------------------------------------------------------- output

def export(art, name):
    out = os.path.join(HERE, name)
    os.makedirs(out, exist_ok=True)
    panels = []
    for i in range(3):
        # each panel keeps its own 3 mm bleed; inner bleed is taken from the neighbouring panel's art
        box = (PW * i, 0, PW * i + PW + 2 * BLEED, PH + 2 * BLEED)
        p = art.im.crop(box)
        p.save(os.path.join(out, f'panel-{i + 1}.png'), dpi=(300, 300))
        p.save(os.path.join(out, f'panel-{i + 1}.pdf'), resolution=300)
        panels.append(p.crop((BLEED, BLEED, BLEED + PW, BLEED + PH)))
    preview(panels).save(os.path.join(out, 'preview.png'))
    whole = art.im.crop((BLEED, BLEED, BLEED + W, BLEED + H)).resize((4240, 2000), Image.LANCZOS)
    whole.save(os.path.join(out, 'poster-4240x2000.jpg'), quality=95, dpi=(300, 300), subsampling=0)
    art.im.crop((BLEED, BLEED, BLEED + W, BLEED + H)).resize((W // 4, H // 4), Image.LANCZOS) \
        .save(os.path.join(out, 'full.png'))
    print(name, 'written to', out)


def preview(panels, pw=620, gap=46, margin=150):
    """The three frames hung on a light wall, like the reference photo."""
    ph = round(pw * PH / PW)
    wall = Image.new('RGB', (3 * pw + 2 * gap + 2 * margin, ph + 2 * margin), (214, 214, 212))
    g = np.linspace(1.04, 0.86, wall.width)[None, :, None]
    wall = Image.fromarray(np.clip(np.asarray(wall) * g, 0, 255).astype(np.uint8))
    sh = Image.new('L', wall.size)
    for i in range(3):
        x = margin + i * (pw + gap)
        ImageDraw.Draw(sh).rectangle([x + 14, margin + 22, x + pw + 14, margin + ph + 22], fill=120)
    wall.paste((40, 40, 40), (0, 0), sh.filter(ImageFilter.GaussianBlur(18)))
    for i, p in enumerate(panels):
        x = margin + i * (pw + gap)
        wall.paste(p.resize((pw, ph), Image.LANCZOS), (x, margin))
        ImageDraw.Draw(wall).rectangle([x - 1, margin - 1, x + pw, margin + ph], outline=(30, 30, 30), width=2)
    return wall


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=os.path.join(ROOT, 'public', 'art', 'video-concept'))
    ap.add_argument('--only', choices=['spec', 'drop', 'signature', 'trio', 'ink', 'splash', 'arms', 'noir',
                                       'noir-mono'])
    a = ap.parse_args()
    sets = {'spec': (spec_sheet, 'spec-sheet'), 'drop': (streetwear_drop, 'streetwear-drop'),
            'signature': (signature, 'signature'), 'trio': (trio, 'trio'), 'ink': (ink, 'ink-sketch'),
            'splash': (ink_splash, 'ink-splash'), 'arms': (arms_wide, 'arms-wide'), 'noir': (noir, 'noir'),
            'noir-mono': (noir_mono, 'noir-mono')}
    for key, (make, name) in sets.items():
        if a.only in (None, key):
            export(make(a.src), name)

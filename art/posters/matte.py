"""Cut the generated raccoons out of their plain backgrounds (numpy + Pillow only).

  python art/posters/matte.py

source/left-samurai.png   sits on pure black   -> keyed on brightness
source/right-cyberpunk.png sits on saturated purple -> keyed on saturation (the subject is far less saturated)
Each writes source/<name>-cut.png (RGBA). The key gives soft fur edges; a hole-filled silhouette keeps dark
armour and jacket (which look like background to the key) fully opaque.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'source')


def close(m, size):
    """Morphological closing at quarter resolution (PIL rank filters are slow at large sizes)."""
    small = m.resize((m.width // 4, m.height // 4), Image.BILINEAR)
    small = small.filter(ImageFilter.MaxFilter(size)).filter(ImageFilter.MinFilter(size))
    return Image.fromarray(np.maximum(np.asarray(m), np.asarray(small.resize(m.size, Image.BILINEAR))))


def silhouette(hard, gap, row_fill):
    """Clean a hard mask, seal gaps up to ~4*gap px, and fill everything not connected to the
    top/left/right border (the body runs off the bottom edge, so that edge is not background)."""
    m = Image.fromarray((hard * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))   # drop specks
    m = close(m, gap).point(lambda v: 255 if v > 127 else 0)
    w, h = m.size
    ImageDraw.Draw(m).rectangle([0, h - 3, w - 1, h - 1], fill=255)
    border = [(x, 0) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for xy in border:
        if m.getpixel(xy) == 0:
            ImageDraw.floodfill(m, xy, 128, thresh=0)
    inside = np.asarray(m) != 128        # holes (0) and subject (255)
    # when the lower body is solid side to side, fill each row between its outermost subject pixels,
    # which closes dark robe areas that reach the background through gaps beside the arms
    for y in range(int(h * 0.55), h) if row_fill else ():
        xs = np.flatnonzero(inside[y])
        if xs.size:
            inside[y, xs[0]:xs[-1] + 1] = True
    return inside


def matte(name, key, gap, row_fill=False):
    im = Image.open(os.path.join(SRC, name + '.png')).convert('RGB')
    rgb = np.asarray(im).astype(np.float32) / 255
    soft = key(rgb)                                       # 0 = background, 1 = subject
    inside = silhouette(soft > 0.5, gap, row_fill)
    core = Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)) \
        .filter(ImageFilter.GaussianBlur(2))
    band = np.asarray(Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15))) > 0
    alpha = np.maximum(np.asarray(core) / 255, soft * band)
    out = im.convert('RGBA')
    out.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    out.save(os.path.join(SRC, name + '-cut.png'))
    print(name, 'opaque %.0f%%' % (100 * (alpha > 0.5).mean()))


def black_key(rgb):
    return np.clip((rgb.max(2) - 0.02) / 0.12, 0, 1)


def purple_key(rgb):
    mx, mn = rgb.max(2), rgb.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    return np.clip((0.90 - sat) / 0.12, 0, 1)


if __name__ == '__main__':
    matte('left-samurai', black_key, 5, row_fill=True)   # robe and armour skirt span the whole lower body
    matte('right-cyberpunk', purple_key, 9)    # neon seams and the visor key out, so seal wider gaps

"""Samurai variant of the site mascot, painted with code over the hero cut-out (no AI generator, no 3D).

  python art/samurai/make_samurai.py

Reads public/art/video-concept/raccoon-hero-crossed-arms.png and writes art/samurai/raccoon-samurai.png:
black lacquered lamellar armour with crimson lacing over the hoodie (a lacquered collar hides the headphones),
a white hachimaki, a crimson oni mask pushed up on the crown, a katana gripped in the paw and resting on the
shoulder, crimson petals and a crimson rim light on pure black.
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT, 'public', 'art', 'video-concept', 'raccoon-hero-crossed-arms.png')
OUT = os.path.join(HERE, 'raccoon-samurai.png')

PL, PR, PT = 150, 150, 230           # canvas padding (left, right, top); the body is cut by the bottom edge
CRIMSON = np.array([0.784, 0.125, 0.184])   # site accent #C8202F
SILK = np.array([0.60, 0.035, 0.07])        # deep crimson lacing
IVORY = np.array([0.93, 0.91, 0.87])
WHITE = np.array([1.0, 1.0, 1.0])


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def to_img(a):
    return Image.fromarray(np.uint8(np.clip(a, 0, 1) * 255 + 0.5))


def blur(a, r):
    return np.asarray(to_img(a).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def morph(a, size, grow):
    f = ImageFilter.MaxFilter(size) if grow else ImageFilter.MinFilter(size)
    return np.asarray(to_img(a).filter(f), np.float32) / 255


def shift(a, dx, dy):
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = a[max(-dy, 0):h - max(dy, 0), max(-dx, 0):w - max(dx, 0)]
    return out


def poly_mask(shape, pts, k=3):
    """Antialiased polygon coverage (pts in canvas pixels)."""
    h, w = shape
    im = Image.new('L', (w * k, h * k), 0)
    ImageDraw.Draw(im).polygon([(x * k, y * k) for x, y in pts], fill=255)
    return np.asarray(im.resize((w, h), Image.BOX), np.float32) / 255


def over(base, rgb, a):
    a = a[..., None]
    return base * (1 - a) + rgb * a


def bezier(p0, p1, p2, n):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2 = map(np.array, (p0, p1, p2))
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2, t[:, 0]


def ribbon(center, hw):
    """Polygon around a polyline with per-point half-width."""
    d = np.gradient(center, axis=0)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    n = np.stack([-d[:, 1], d[:, 0]], 1)
    left = center + n * hw[:, None]
    right = center - n * hw[:, None]
    return [tuple(p) for p in left] + [tuple(p) for p in right[::-1]]


# ------------------------------------------------------------------ source
src = np.asarray(Image.open(SRC).convert('RGBA'), np.float32) / 255
SH, SW = src.shape[:2]
CH, CW = SH + PT, SW + PL + PR
img = np.zeros((CH, CW, 4), np.float32)
img[PT:, PL:PL + SW] = src
rgb, alpha = img[..., :3].copy(), img[..., 3].copy()
orig = rgb.copy()
Y, X = np.mgrid[0:CH, 0:CW].astype(np.float32)
xs, ys = X - PL, Y - PT                                  # source-image coordinates


def P(x, y):
    """source -> canvas coordinates"""
    return (x + PL, y + PT)


# ------------------------------------------------------------------ hoodie -> armour
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mx = rgb.max(-1)
sat = (mx - rgb.min(-1)) / (mx + 1e-6)
lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
red = (r > g * 1.6) & (r > 0.25)
cloth = ((alpha > 0.5) & (((mx < 0.30) & (sat < 0.28)) | red) & (ys > 480)).astype(np.float32)
cloth = morph(morph(cloth, 9, True), 9, False)          # close seams and stitching
cloth = morph(morph(cloth, 5, False), 5, True)          # drop specks inside the fur
# the drawstrings and their metal tips hang inside the hoodie front
for x0, x1 in ((548, 592), (718, 762)):
    cloth[(xs > x0) & (xs < x1) & (ys > 720) & (ys < 980)] = 1
# grey highlights on the hoodie just above the crossed arms (fur is warmer: r clearly above b)
seam = (xs > 360) & (xs < 920) & (ys > 930) & (ys < 1000) & (np.abs(r - b) < 0.035) & (sat < 0.14)
cloth[seam] = 1
cloth = blur(cloth, 1.2) * alpha

# fold shading from the hoodie, with the stitching, drawstrings and tips filled in from their surroundings
odd = (red | ((mx > 0.30) & (cloth > 0.5))).astype(np.float32)
for x0, x1 in ((548, 592), (718, 762)):
    odd[(xs > x0) & (xs < x1) & (ys > 720) & (ys < 980)] = 1
odd = morph(odd, 7, True)
keep = (1 - odd) * (cloth > 0.5)
L = np.where(odd > 0.5, blur(lum * keep, 14) / np.maximum(blur(keep, 14), 1e-3), lum)
L = blur(L, 1.0)
shade = np.clip((L - 0.03) / 0.16, 0.22, 1.9)


def lamellar(u, cx, shade, gloss, rh=64.0, cord=13.0, pfrac=0.62):
    """Rows of lacquered plates (kozane) laced with crimson silk (kebiki odoshi). u = row coordinate."""
    f = (u / rh) % 1.0
    plate = f < pfrac
    pf = f / pfrac
    pv = 0.03 + 0.05 * (1 - pf) + 0.28 * ss(0.09, 0.0, pf) - 0.025 * ss(0.85, 1.0, pf)
    plate_rgb = pv[..., None] * np.array([1.0, 0.96, 0.96])
    lf = np.clip((f - pfrac) / (1 - pfrac), 0, 1)
    c = (cx / cord) % 1.0
    prof = np.sin(np.pi * c) ** 0.7
    cv = (0.15 + 0.6 * prof) * (0.35 + 0.65 * ss(0.0, 0.22, lf)) * (1 - 0.35 * ss(0.85, 1.0, lf))
    lace_rgb = SILK * cv[..., None] + WHITE * (0.07 * prof ** 10)[..., None]
    out = np.where(plate[..., None], plate_rgb, lace_rgb) * shade[..., None]
    spec = np.where(plate, 0.5, 0.12) * gloss
    return out + WHITE * spec[..., None]


gloss = ss(0.20, 0.40, L)
row_u = ys - 0.0003 * (xs - 615) ** 2                    # rows droop over the shoulders
cord_x = xs + 0.08 * ys
armour = lamellar(row_u, cord_x, shade, gloss)

rgb = over(rgb, armour, cloth)

# ------------------------------------------------------------------ lacquered collar over the headphones
NX, NY = 600, 470                                        # neck centre (source coords)
# a rounded throat guard: an ellipse around the neck with a soft U opening for the throat
outer = ((xs - 612) / 305.0) ** 2 + ((ys - 700) / 172.0) ** 2
collar = np.clip((1 - outer) * 160, 0, 1)
notch = ((xs - NX) / 66.0) ** 2 + ((ys - 520) / 215.0) ** 2
collar *= np.clip((notch - 1) * 9, 0, 1)
collar = blur(collar, 1.0)
rad = np.sqrt(((xs - NX) * 0.82) ** 2 + (ys - NY) ** 2)
c_shade = (0.85 + 0.3 * ss(860, 360, xs)) * (1 - 0.45 * ss(250, 400, rad))
c_gloss = 0.5 * np.exp(-((xs - 470) / 70.0) ** 2 - ((ys - 600) / 60.0) ** 2) + 0.35 * np.exp(-((xs - 760) / 50.0) ** 2 - ((ys - 600) / 45.0) ** 2)
collar_rgb = lamellar(rad, np.arctan2(ys - NY, (xs - NX) * 0.82) * 160, c_shade, c_gloss, rh=50.0, cord=10.0)
# crimson silk piping around the collar edge
edge = np.clip(collar - morph(collar, 9, False), 0, 1)
collar_rgb = np.where((edge > 0.3)[..., None], SILK * (0.5 + 0.5 * c_shade[..., None]), collar_rgb)
cshadow = blur(shift(collar, 0, 12), 9) * (1 - collar) * alpha
rgb *= (1 - 0.65 * cshadow)[..., None]
rgb = over(rgb, collar_rgb, collar)

# ------------------------------------------------------------------ hachimaki (white headband)
band_c, band_t = bezier(P(232, 282), P(560, 128), P(912, 205), 160)
band_hw = 15 + 9 * np.sin(np.pi * band_t)
band = poly_mask((CH, CW), ribbon(band_c, band_hw)) * (morph(alpha, 5, False))
# per-pixel position along / across the band
tx = np.clip((X - band_c[0, 0]) / (band_c[-1, 0] - band_c[0, 0]), 0, 1)
cy = np.interp(X, band_c[:, 0], band_c[:, 1])
hw_at = np.interp(X, band_c[:, 0], band_hw)
q = np.clip((Y - cy) / hw_at, -1, 1)
fold = 0.09 * np.sin(X * 0.11 + 1.3 * np.sin(X * 0.031)) * (1 - np.abs(q))
b_shade = (0.72 + 0.34 * np.sqrt(1 - q ** 2) - 0.12 * q + fold) * (0.5 + 0.5 * np.sin(np.pi * tx) ** 0.4)
band_rgb = IVORY * b_shade[..., None]
# crimson sun disc on the front of the band
sun_c = band_c[78]
sun = np.clip(17.5 - np.sqrt(((X - sun_c[0]) / 1.0) ** 2 + ((Y - sun_c[1]) / 0.92) ** 2), 0, 1)
band_rgb = over(band_rgb, CRIMSON * (b_shade * 0.95)[..., None], sun)
bshadow = blur(shift(band, 3, 9), 6) * (1 - band) * alpha
rgb *= (1 - 0.55 * bshadow)[..., None]
rgb = over(rgb, band_rgb, band)

# knot tails fluttering behind the head, on the viewer's right
tails = []
for p1, p2, w0 in (((1000, 196), (1065, 300), 21), ((975, 238), (985, 345), 18)):
    c, t = bezier(P(896, 196), P(*p1), P(*p2), 60)
    hw = w0 * (1 - 0.55 * t) * (0.85 + 0.15 * np.sin(t * 9))
    tails.append(poly_mask((CH, CW), ribbon(c, hw)))
tail = np.clip(tails[0] + tails[1], 0, 1)
t_shade = 0.45 + 0.5 * blur(tail, 5) - 0.12 * tails[1] * (1 - tails[0])
knot_m = np.clip(13 - np.sqrt((X - P(898, 0)[0]) ** 2 + (Y - P(0, 198)[1]) ** 2), 0, 1)
tail_rgb = IVORY * t_shade[..., None]
behind = tail * (1 - alpha)                              # tails sit behind the head, knot in front
rgb = over(rgb, tail_rgb, behind)
alpha = np.maximum(alpha, behind)
rgb = over(rgb, IVORY * 0.78, knot_m * alpha)

# ------------------------------------------------------------------ oni mask pushed up on the crown
K = 3
MC = np.array(P(562, 58), np.float32)
th = math.radians(-12)
bx0, by0, bx1, by1 = int(MC[0] - 260), 0, int(MC[0] + 260), int(MC[1] + 200)
gy, gx = np.mgrid[by0 * K:by1 * K, bx0 * K:bx1 * K].astype(np.float32) / K
dx, dy = (gx - MC[0]) / 1.22, (gy - MC[1]) / 1.22
lx = dx * math.cos(th) + dy * math.sin(th)
ly = -dx * math.sin(th) + dy * math.cos(th)
narrow = 1 - 0.2 * ss(15, 85, ly)
face = (((lx / (128 * narrow)) ** 2 + ((ly + 4) / 88.0) ** 2) < 1) & (ly < 78)
h = np.sqrt(np.clip(1 - (lx / 135) ** 2 - ((ly + 4) / 95) ** 2, 0, 1)) * 0.9


def gbump(cx, cy, sx, sy, amp):
    return amp * np.exp(-((lx - cx) / sx) ** 2 - ((ly - cy) / sy) ** 2)


for s in (-1, 1):
    h += gbump(s * 55, -36, 40, 14, 0.32) + gbump(s * 72, 34, 30, 26, 0.16)
h += gbump(0, 22, 20, 24, 0.42) + gbump(0, -10, 10, 30, 0.12)
hy, hx = np.gradient(h * 70)
n = np.stack([-hx, -hy, np.ones_like(h) * 1.6], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
Lk = np.array([-0.35, -0.55, 0.76]); Lk /= np.linalg.norm(Lk)
Hk = Lk + np.array([0, 0, 1.0]); Hk /= np.linalg.norm(Hk)
diff = np.clip(n @ Lk, 0, 1)
spec = np.clip(n @ Hk, 0, 1) ** 45
rim = (1 - n[..., 2]) ** 2
m_rgb = np.array([0.50, 0.025, 0.05]) * (0.12 + 0.95 * diff ** 1.6)[..., None] + WHITE * (0.6 * spec)[..., None] + CRIMSON * (0.45 * rim)[..., None]
m_a = face.astype(np.float32)

for s in (-1, 1):
    # angry eye holes, outer corners up
    a = math.radians(-20 * s)
    ex = (lx - s * 50) * math.cos(a) + (ly + 6) * math.sin(a)
    ey = -(lx - s * 50) * math.sin(a) + (ly + 6) * math.cos(a)
    hole = ((np.abs(ex) / 34) ** 1.6 + (np.abs(ey) / 13) ** 2) < 1
    m_rgb[hole] = np.array([0.02, 0.0, 0.005])
    # black brows over the ridges
    t = np.clip((lx * s - 18) / 95, 0, 1)
    bcy = -24 - 44 * t - 6 * np.sin(t * np.pi)
    brow = (lx * s > 16) & (lx * s < 118) & (np.abs(ly - bcy) < (11 - 6 * t) + 1.5 * np.sin(lx * 0.6))
    m_rgb[brow & face] = np.array([0.03, 0.025, 0.03]) + 0.5 * spec[brow & face][:, None]
    # nostrils
    m_rgb[(((lx - s * 13) / 7) ** 2 + ((ly - 35) / 4.5) ** 2) < 1] = np.array([0.08, 0.0, 0.01])
    # fangs hanging from the upper lip
    fc = s * 36 - s * 4 * ss(70, 112, ly)
    fang = (ly > 66) & (ly < 112) & (np.abs(lx - fc) < 9 * (112 - ly) / 46)
    fq = np.clip((lx - fc) / 9, -1, 1)
    m_rgb[fang] = (IVORY * (0.7 + 0.3 * np.sqrt(1 - fq[fang] ** 2))[:, None])
    m_a[fang] = 1
    # horns: ivory, ringed, curving up and out
    hc, ht = bezier((s * 72, -60), (s * 92, -130), (s * 140, -168), 48)
    best = np.full(lx.shape, 1e9, np.float32)
    bt = np.zeros(lx.shape, np.float32)
    for (px, py), tv in zip(hc, ht):
        d2 = (lx - px) ** 2 + (ly - py) ** 2
        m = d2 < best
        best[m] = d2[m]
        bt[m] = tv
    dist = np.sqrt(best)
    hr = 17 * (1 - bt) + 2 * bt
    horn = (dist < hr) & ~(face & (ly > -55))
    hq = np.clip(dist / hr, 0, 1)
    hv = (0.55 + 0.45 * np.sqrt(1 - hq ** 2)) * (0.86 + 0.14 * np.cos(bt * 34)) * (0.75 + 0.25 * bt)
    side = np.sign((lx - np.interp(bt, ht, hc[:, 0])) * s)
    hv = hv * (1 - 0.25 * (side > 0) * hq)
    m_rgb[horn] = IVORY[None, :] * hv[horn][:, None]
    m_a[horn] = 1

# teeth row along the upper lip
teeth = face & (ly > 64) & (ly < 78) & (np.abs(lx) < 44) & ((np.abs(lx) % 11) > 1.3)
m_rgb[teeth] = IVORY * 0.88
m_rgb[face & (ly > 60) & (ly < 64) & (np.abs(lx) < 46)] = np.array([0.1, 0.0, 0.01])

# downsample to canvas
def down(a):
    hh, ww = a.shape[0] // K, a.shape[1] // K
    return a.reshape(hh, K, ww, K, *a.shape[2:]).mean((1, 3))


m_a1 = down(m_a)
m_rgb1 = down(m_rgb * m_a[..., None]) / np.maximum(m_a1[..., None], 1e-4)
mask_a = np.zeros((CH, CW), np.float32)
mask_rgb = np.zeros((CH, CW, 3), np.float32)
mask_a[by0:by1, bx0:bx1] = m_a1
mask_rgb[by0:by1, bx0:bx1] = m_rgb1
mshadow = blur(shift(mask_a, 4, 14), 10) * (1 - mask_a) * alpha
rgb *= (1 - 0.6 * mshadow)[..., None]
rgb = over(rgb, mask_rgb, mask_a)
alpha = np.maximum(alpha, mask_a)

# ------------------------------------------------------------------ katana in the paw, resting on the shoulder
d = np.array([-85.0, -265.0]); d /= np.linalg.norm(d)
nrm = np.array([-d[1], d[0]])
k0 = np.array(P(235, 905)) - d * 134                     # kashira (pommel) below the paw
rel_x, rel_y = X - k0[0], Y - k0[1]
s_ = rel_x * d[0] + rel_y * d[1]
t_ = rel_x * nrm[0] + rel_y * nrm[1]
segs = [  # (start, end, half-width start, half-width end, kind)
    (0, 18, 14.5, 14.5, 'metal'), (18, 250, 15.5, 14.5, 'tsuka'), (250, 266, 34, 34, 'tsuba'),
    (266, 280, 15, 15, 'habaki'), (280, 1165, 19.5, 16.5, 'saya'), (1165, 1192, 16.5, 13.0, 'metal')]
hw = np.zeros_like(s_)
kind = np.full(s_.shape, -1, np.int8)
for i, (s0, s1, w0, w1, _) in enumerate(segs):
    m = (s_ >= s0) & (s_ < s1)
    hw[m] = w0 + (w1 - w0) * (s_[m] - s0) / (s1 - s0)
    kind[m] = i
kn = (s_ > 345) & (s_ < 365)                              # kurikata knob for the cord
hw[kn] += 5 * np.sin(np.pi * (s_[kn] - 345) / 20)
cov = np.clip(hw - np.abs(t_) + 0.5, 0, 1) * np.clip(s_ + 0.5, 0, 1) * np.clip(1192.5 - s_, 0, 1)
qq = np.clip(t_ / np.maximum(hw, 1), -1, 1)
nz = np.sqrt(1 - qq ** 2)
l2 = np.array([-0.55, -0.83]) @ nrm
kd = np.clip(nz * 0.7 + qq * l2 * 0.6, 0, 1)
kspec = np.exp(-((qq - l2 * 0.55) / 0.13) ** 2)
lac = 0.025 + 0.07 * kd
k_rgb = np.repeat(lac[..., None], 3, -1) + WHITE * (0.42 * kspec)[..., None] + CRIMSON * (0.45 * ss(0.78, 1.0, -qq * np.sign(l2)))[..., None]
# tsuka: black silk cord crossing over white ray-skin diamonds
P_ = 30.0
sc = (((s_ - 18) / P_) % 1.0) - 0.5
dia = (np.abs(sc) / 0.40 + np.abs(qq) / 0.62) < 1
tsuka = kind == 1
cordv = 0.05 + 0.1 * kd + 0.06 * np.sin((s_ + np.abs(t_) * 1.4) * 0.9)
tsuka_rgb = np.where(dia[..., None], IVORY * (0.45 + 0.55 * kd)[..., None], cordv[..., None] * np.ones(3) + WHITE * (0.25 * kspec)[..., None])
k_rgb = np.where(tsuka[..., None], tsuka_rgb, k_rgb)
# tsuba: black iron disc edge-on with a bright rim; habaki: polished silver
k_rgb = np.where((kind == 2)[..., None], (0.05 + 0.18 * kd)[..., None] + WHITE * (0.5 * kspec * (np.abs(qq) > 0.8))[..., None], k_rgb)
k_rgb = np.where((kind == 3)[..., None], (0.35 + 0.55 * kd)[..., None] * np.ones(3) + WHITE * (0.6 * kspec)[..., None], k_rgb)
# crimson sageo cord wrapped around the saya below the knob
wrap = (s_ > 300) & (s_ < 420) & ((((s_ + t_ * 0.9) / 13.0) % 1.0) < 0.62)
k_rgb = np.where(wrap[..., None], SILK * (0.5 + 0.9 * kd)[..., None] + WHITE * (0.15 * kspec)[..., None], k_rgb)
body_a = alpha.copy()
kshadow = blur(shift(cov, 10, 12), 7) * (1 - cov) * alpha
rgb *= (1 - 0.55 * kshadow)[..., None]
rgb = over(rgb, k_rgb, cov)
alpha = np.maximum(alpha, cov)
# the paw's fingers wrap over the grip
fur = ((img[..., 3] > 0.5) & (cloth < 0.5)).astype(np.float32)
pawbox = ((xs > 150) & (xs < 335) & (ys > 840) & (ys < 985)).astype(np.float32)
paw = blur(morph(fur * pawbox, 3, False), 1.0) * pawbox
rgb = over(rgb, orig, paw)

# ------------------------------------------------------------------ compose on black with a crimson rim
edge_in = ss(0.0, 0.45, 1 - blur(alpha, 16)) * alpha
rgb = rgb + CRIMSON * (0.35 * edge_in * (1 - lum.clip(0, 1)))[..., None]
glow = blur(body_a, 20) * 0.5 + blur(body_a, 70) * 0.28
canvas = CRIMSON * (glow * (1 - alpha))[..., None] * 0.9
canvas = over(canvas, rgb, alpha)

# ------------------------------------------------------------------ cherry-blossom petals near the shoulders
rng = np.random.default_rng(11)
petals = Image.new('RGBA', (CW * 2, CH * 2), (0, 0, 0, 0))
pd = ImageDraw.Draw(petals)
spots = [(80, 700), (130, 560), (300, 520), (60, 900), (250, 640), (1130, 640), (1250, 560), (1330, 760),
         (1200, 860), (1060, 560), (1290, 420), (40, 420), (1380, 980), (110, 1080)]
blurred = Image.new('RGBA', petals.size, (0, 0, 0, 0))
bd = ImageDraw.Draw(blurred)
for i, (px, py) in enumerate(spots):
    sz = rng.uniform(22, 38) * 2
    ang = rng.uniform(0, 2 * math.pi)
    sq = rng.uniform(0.45, 1.0)                           # tumbling foreshortening
    pts = []
    for k in range(40):
        u = k / 40 * 2 * math.pi
        rr = 1 - 0.28 * max(0.0, math.cos(u)) ** 12       # notch at the wide end
        ex, ey = math.cos(u) * sz * rr, math.sin(u) * sz * 0.62 * (0.75 + 0.25 * math.cos(u)) * sq
        pts.append((px * 2 + ex * math.cos(ang) - ey * math.sin(ang), py * 2 + ex * math.sin(ang) + ey * math.cos(ang)))
    col = (int(200 + rng.uniform(-20, 30)), int(rng.uniform(18, 45)), int(rng.uniform(30, 55)), 235)
    (bd if i % 3 == 0 else pd).polygon(pts, fill=col)
    inner = [(px * 2 + (x - px * 2) * 0.5, py * 2 + (y - py * 2) * 0.5) for x, y in pts]
    (bd if i % 3 == 0 else pd).polygon(inner, fill=(255, 120, 130, 120))
blurred = blurred.filter(ImageFilter.GaussianBlur(7))
petals = petals.filter(ImageFilter.GaussianBlur(0.8))
out = to_img(canvas[..., 0]).convert('RGB')
out = Image.fromarray(np.uint8(np.clip(canvas, 0, 1) * 255 + 0.5))
for layer in (blurred, petals):
    out.paste(layer.resize((CW, CH), Image.LANCZOS), (0, 0), layer.resize((CW, CH), Image.LANCZOS))

# gentle vignette keeps the frame edges pure black
vig = 1 - 0.35 * ss(0.55, 1.05, np.sqrt(((X - CW / 2) / (CW / 2)) ** 2 + (np.minimum(Y - CH * 0.55, 0) / (CH * 0.62)) ** 2))
out = Image.fromarray(np.uint8(np.clip(np.asarray(out, np.float32) / 255 * vig[..., None], 0, 1) * 255 + 0.5))
out.save(OUT)
print(OUT, out.size)

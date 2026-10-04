# ================================================================= TAIL
TP = TAIL_PTS
path = catmull(TP, 12)
L = [0.0]
for i in range(1, len(path)):
    L.append(L[-1] + (path[i] - path[i - 1]).length)
TL = L[-1]


def tail_r(t):
    return 0.04 + 0.12 * math.sin(math.pi * min(1, t * 1.08) ** 0.75) * (1 - 0.3 * t)


T = []
acc = 0
for i, p in enumerate(path):
    if i == 0 or L[i] - acc >= 0.02:
        acc = L[i]
        T.append(dict(co=tuple(p), r=max(0.03, tail_r(L[i] / TL))))
tail = metaball_mesh("AR_Tail", T, C_BODY, res=0.008)
remesh(tail, 0.0055, smooth_iters=2)


def tail_t(p):
    best, bi = 9, 0
    for i in range(len(path)):
        d = (path[i] - p).length_squared
        if d < best:
            best, bi = d, i
    return L[bi] / TL, bi


def tail_color(p, n):
    t, _ = tail_t(p)
    band = 0.5 + 0.5 * math.sin(t * 2 * math.pi * 4.6 + 0.9 + noise.noise(p * 12) * 0.5)
    c = lerp3(lerp3(FUR, FUR_L, 0.55 + 0.3 * noise.noise(p * 30)), FUR_D, smoothstep(0.45, 0.62, band))
    c = lerp3(c, FUR_D, smoothstep(0.88, 0.95, t))  # dark tip
    return c


paint(tail, tail_color)
tail_web = web_variant(tail)


def tail_dir(co, n):
    t, i = tail_t(co)
    a = path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]
    return a.normalized() * 0.9


moved = set()
moved |= tufts(tail_web, lambda co, n: 1.0, 420, 0.085, 0.065, tail_dir, seed=31, sharp=1.25, normal_mix=0.2, jitter=0.2)
moved |= tufts(tail_web, lambda co, n: 1.0, 380, 0.04, 0.04, tail_dir, seed=33, sharp=1.35, normal_mix=0.3, jitter=0.3)
smooth_verts(tail_web, moved, 0.6, 5)
for o in (tail, tail_web):
    set_mats(o, [m_fur])
    o.data.shade_smooth()

result = {"tail_tris": tri_count(tail)}

"""Presentation fur: Blender hair-curve strands grown from the smooth base meshes (render only; not exported)."""
import bpy, math
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

C_FUR = coll("AR_FurStrands", coll("AR_Character"))
clear_coll(C_FUR)
RNG = np.random.default_rng(7)
K = 6  # points per strand


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def nrmz(v):
    return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-9)


def scatter(obj, n):
    me = obj.data
    me.calc_loop_triangles()
    tri = np.empty(len(me.loop_triangles) * 3, np.int32)
    me.loop_triangles.foreach_get('vertices', tri)
    tri = tri.reshape(-1, 3)
    co = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    vn = np.empty(len(me.vertices) * 3, np.float32)
    me.vertex_normals.foreach_get('vector', vn)
    vn = vn.reshape(-1, 3)
    col = np.empty(len(me.vertices) * 4, np.float32)
    me.color_attributes['Col'].data.foreach_get('color', col)
    col = col.reshape(-1, 4)[:, :3]
    a, b, c = co[tri[:, 0]], co[tri[:, 1]], co[tri[:, 2]]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    idx = RNG.choice(len(tri), n, p=area / area.sum())
    r1, r2 = RNG.random(n), RNG.random(n)
    s = np.sqrt(r1)
    u, v, w = (1 - s)[:, None], (s * (1 - r2))[:, None], (s * r2)[:, None]
    t = tri[idx]
    P = u * co[t[:, 0]] + v * co[t[:, 1]] + w * co[t[:, 2]]
    N = nrmz(u * vn[t[:, 0]] + v * vn[t[:, 1]] + w * vn[t[:, 2]])
    C = u * col[t[:, 0]] + v * col[t[:, 1]] + w * col[t[:, 2]]
    M = np.array(obj.matrix_world)
    P = P @ M[:3, :3].T + M[:3, 3]
    N = nrmz(N @ M[:3, :3].T)
    return P, N, C


def grow(name, P, N, C, L, d_root, d_tip, clump=0.3, n_clumps=4000, frizz=0.15, radius=0.00028, keep=None):
    if keep is not None:
        P, N, C, L, d_root, d_tip = P[keep], N[keep], C[keep], L[keep], d_root[keep], d_tip[keep]
    n = len(P)
    pts = np.zeros((n, K, 3), np.float32)
    pts[:, 0] = P - N * 0.0006
    seg = (L / (K - 1))[:, None]
    jit = nrmz(RNG.normal(size=(n, 3))) * frizz
    for k in range(1, K):
        t = k / (K - 1)
        d = nrmz(d_root * (1 - t) + d_tip * t + jit * t * t)
        pts[:, k] = pts[:, k - 1] + d * seg
    # clumping: pull tips toward the tip of a nearby "leader" strand
    if clump > 0 and n > n_clumps:
        lead = RNG.choice(n, n_clumps, replace=False)
        kd = KDTree(n_clumps)
        for i, li in enumerate(lead):
            kd.insert(Vector(P[li]), i)
        kd.balance()
        near = np.array([lead[kd.find(Vector(p))[1]] for p in P])
        for k in range(1, K):
            t = (k / (K - 1)) ** 1.6 * clump
            pts[:, k] = pts[:, k] * (1 - t) + (pts[near, k] - pts[near, 0] + pts[:, 0]) * t
    # per-strand colour variation + guard hairs (dark tip, pale band) on the grey body fur
    lum = C @ np.array([0.3, 0.6, 0.1], np.float32)
    var = RNG.uniform(0.85, 1.15, n).astype(np.float32)[:, None]
    C = np.clip(C * var, 0, 1)
    tip = ((RNG.random(n) < 0.28) & (lum > 0.012) & (lum < 0.25)).astype(np.float32)

    cv = bpy.data.hair_curves.new(name)
    cv.add_curves([K] * n)
    cv.position_data.foreach_set('vector', pts.ravel())
    if 'radius' not in cv.attributes:
        cv.attributes.new('radius', 'FLOAT', 'POINT')
    rad = np.tile(np.linspace(radius, radius * 0.15, K, dtype=np.float32), n)
    cv.attributes['radius'].data.foreach_set('value', rad)
    ca = cv.attributes.new('Col', 'FLOAT_COLOR', 'CURVE')
    ca.data.foreach_set('color', np.hstack([C, np.ones((n, 1), np.float32)]).ravel())
    ta = cv.attributes.new('Tip', 'FLOAT', 'CURVE')
    ta.data.foreach_set('value', tip)
    o = new_obj(name, cv, C_FUR)
    cv.materials.append(strand_mat())
    return o


def strand_mat():
    m = bpy.data.materials.get("AR_FurStrands")
    if m:
        return m
    m = bpy.data.materials.new("AR_FurStrands")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Roughness'].default_value = 0.5
    p.inputs['Specular IOR Level'].default_value = 0.35
    col = nt.nodes.new('ShaderNodeAttribute')
    col.attribute_type = 'GEOMETRY'
    col.attribute_name = 'Col'
    tipa = nt.nodes.new('ShaderNodeAttribute')
    tipa.attribute_type = 'GEOMETRY'
    tipa.attribute_name = 'Tip'
    hi = nt.nodes.new('ShaderNodeHairInfo')

    def mr(src, a, b, c, d, smooth=True):
        n = nt.nodes.new('ShaderNodeMapRange')
        n.interpolation_type = 'SMOOTHSTEP' if smooth else 'LINEAR'
        n.inputs['From Min'].default_value = a
        n.inputs['From Max'].default_value = b
        n.inputs['To Min'].default_value = c
        n.inputs['To Max'].default_value = d
        L.new(src, n.inputs['Value'])
        return n.outputs['Result']

    def mix(fac, A, B, blend='MIX', fac_val=None):
        n = nt.nodes.new('ShaderNodeMix')
        n.data_type = 'RGBA'
        n.blend_type = blend
        if fac is None:
            n.inputs[0].default_value = fac_val
        else:
            L.new(fac, n.inputs[0])
        for i, s in ((6, A), (7, B)):
            if isinstance(s, tuple):
                n.inputs[i].default_value = (*s, 1)
            else:
                L.new(s, n.inputs[i])
        return n.outputs[2]

    def mul(a, b):
        n = nt.nodes.new('ShaderNodeMath')
        n.operation = 'MULTIPLY'
        L.new(a, n.inputs[0])
        L.new(b, n.inputs[1])
        return n.outputs[0]

    root_shade = mr(hi.outputs['Intercept'], 0.0, 1.0, 0.5, 1.12)
    c1 = mix(None, col.outputs['Color'], root_shade, 'MULTIPLY', 1.0)
    band = mul(mr(hi.outputs['Intercept'], 0.35, 0.55, 0, 1), mr(hi.outputs['Intercept'], 0.68, 0.8, 1, 0))
    c2 = mix(mul(band, tipa.outputs['Fac']), c1, (0.42, 0.38, 0.33))
    dark = mul(mr(hi.outputs['Intercept'], 0.72, 0.9, 0, 1), tipa.outputs['Fac'])
    c3 = mix(dark, c2, (0.008, 0.006, 0.005))
    rnd = mr(hi.outputs['Random'], 0, 1, 0.88, 1.12, smooth=False)
    c4 = mix(None, c3, rnd, 'MULTIPLY', 1.0)
    L.new(c4, p.inputs['Base Color'])
    L.new(p.outputs[0], out.inputs[0])
    return m


# ============================================================ HEAD
head = bpy.data.objects["AR_Head"]
P, N, C = scatter(head, 150000)
x, y, z = P[:, 0], P[:, 1], P[:, 2]
ax = np.abs(x)
# local head frame (head_pose.py scales/tilts the head and stores the matrix on the scene)
hm = scene().get("ar_head_matrix")
HM = np.array(hm, np.float64).reshape(4, 4) if hm else np.eye(4)
hinv = np.linalg.inv(HM)


def posed(name):
    p = np.array(tuple(bpy.data.objects[name].matrix_world.translation) + (1.0,))
    return (HM @ p)[:3].astype(np.float32)


nose = posed("AR_Nose")
Pl = P @ hinv[:3, :3].T + hinv[:3, 3]
lx, ly, lz = Pl[:, 0], Pl[:, 1], Pl[:, 2]
lax = np.abs(lx)

L = np.full(len(P), 0.011, np.float32)
L *= 1 - 0.62 * ss(-0.13, -0.18, ly) * ss(1.27, 1.24, lz)                  # short muzzle fur
L *= 1 - 0.3 * ss(0.03, 0.0, np.hypot(lax - 0.085, lz - 1.272))            # short around eyes
L *= 1 + 0.5 * ss(1.35, 1.43, lz)                                          # crown
cheek = ss(0.11, 0.17, lax) * ss(1.27, 1.2, lz) * ss(1.08, 1.13, lz)
L *= 1 + 2.4 * cheek                                                       # cheek ruff
L *= 1 + 0.8 * ss(1.15, 1.08, lz)                                          # neck/chin
L *= RNG.uniform(0.75, 1.25, len(P)).astype(np.float32)

# ears (from the ear frames defined in head.py)
ear_inner = np.zeros(len(P), np.float32)
ear_any = np.zeros(len(P), np.float32)
for s in (-1, 1):
    base, rot = ear_frame(s)
    base = np.array(base)
    R = np.array(rot)
    q = (Pl - base) @ R          # ear local coords
    d_axis = np.hypot(q[:, 0], q[:, 1])
    inside = (q[:, 2] > -0.01) & (q[:, 2] < 0.14) & (d_axis < 0.075)
    fwd = (N @ hinv[:3, :3].T) @ (R @ np.array([0, -1, 0]))
    ear_any = np.maximum(ear_any, inside.astype(np.float32))
    ear_inner = np.maximum(ear_inner, (inside & (fwd > 0.2)).astype(np.float32))
L = np.where(ear_any > 0, np.where(ear_inner > 0, 0.016, 0.006), L)

# flow field: away from the nose over the surface, then backward / down
fl = P - nose
fl = fl - N * np.sum(fl * N, axis=1, keepdims=True)
fl = nrmz(fl)
side = np.stack([np.sign(x), np.zeros_like(x), np.zeros_like(x)], 1)
down = np.array([0, 0, -1], np.float32)
back = np.array([0, 1, 0], np.float32)
fl = nrmz(fl + side * cheek[:, None] * 0.9 + down * (cheek[:, None] * 0.8 + ss(1.15, 1.08, lz)[:, None])
          + back * ss(1.36, 1.44, lz)[:, None] * 0.6)
upv = np.array([0, 0, 1], np.float32)
fl = np.where(ear_inner[:, None] > 0, nrmz(upv + N * 0.5), fl)
d_root = nrmz(N * 0.65 + fl * 0.75)
d_tip = nrmz(fl * 1.0 + N * 0.12 + down * 0.12)

# keep strands off the eyes, nose and mouth
keep = np.ones(len(P), bool)
for nm in ("AR_Eye_L", "AR_Eye_R"):
    e = posed(nm)
    keep &= np.linalg.norm(P - e, axis=1) > 0.046
keep &= np.linalg.norm(P - nose, axis=1) > 0.04
grow("AR_Fur_Head", P, N, C, L, d_root, d_tip, clump=0.25, n_clumps=6000, frizz=0.12, radius=0.00026, keep=keep)

# ============================================================ TAIL
tail = bpy.data.objects["AR_Tail"]
P, N, C = scatter(tail, 170000)
path = np.array([tuple(p) for p in catmull(TAIL_PTS, 12)], np.float32)
d2 = ((P[:, None, :] - path[None, :, :]) ** 2).sum(-1)
nearest = d2.argmin(1)
tang = nrmz(path[np.minimum(nearest + 2, len(path) - 1)] - path[np.maximum(nearest - 2, 0)])
tpos = nearest / (len(path) - 1)
L = (0.045 + 0.035 * ss(0.0, 0.25, tpos)) * RNG.uniform(0.7, 1.3, len(P))
L = L.astype(np.float32)
d_root = nrmz(N * 0.9 + tang * 0.5)
d_tip = nrmz(tang * 0.9 + N * 0.45)
grow("AR_Fur_Tail", P, N, C, L, d_root, d_tip, clump=0.42, n_clumps=5000, frizz=0.18, radius=0.00034)

# ============================================================ FOREARMS
for sd in ("L", "R"):
    arm = bpy.data.objects["AR_Forearm_" + sd]
    P, N, C = scatter(arm, 9000)
    pk = np.array(POCKET[1 if sd == "L" else -1])
    fl = nrmz(pk - P)
    fl = nrmz(fl - N * np.sum(fl * N, axis=1, keepdims=True))
    L = (0.014 * RNG.uniform(0.7, 1.3, len(P))).astype(np.float32)
    grow("AR_Fur_Forearm_" + sd, P, N, C, L, nrmz(N * 0.6 + fl), nrmz(fl + N * 0.15), clump=0.25, n_clumps=600, radius=0.00026)

S = scene()
S.render.hair_type = 'STRIP'
S.render.hair_subdiv = 1
result = {"strands": {o.name: len(o.data.curves) for o in C_FUR.objects}}

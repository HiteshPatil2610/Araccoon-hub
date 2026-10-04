"""Head: metaball blockout -> voxel remesh -> vertex-color markings -> fur tufts; eyes, lids, nose, mouth, whiskers."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Euler, noise

C_CHAR = coll("AR_Character")
C_HEAD = coll("AR_Head", C_CHAR)
clear_coll(C_HEAD)

FUR = srgb('#4a3d34')
FUR_D = srgb('#2a211c')
FUR_L = srgb('#7a6d63')
CREAM = srgb('#d9ccb4')
MASK = srgb('#120e0d')
INNER_EAR = srgb('#b8a493')

# ---------------------------------------------------------------- ear frame
def ear_frame(s):
    """s = +1 (character left, +X) / -1 (right). Returns base point and rotation matrix (local z = ear axis, local y = thickness)."""
    rot = Euler((math.radians(-12), math.radians(s * 38), 0), 'XYZ').to_matrix()
    base = Vector((s * 0.125, 0.035, 1.395))
    return base, rot


def ear_elems(s):
    base, rot = ear_frame(s)
    q = rot.to_quaternion()
    eul = q.to_euler()
    deg = tuple(math.degrees(a) for a in eul)
    out = []
    for t, r in ((0.0, 0.06), (0.04, 0.056), (0.075, 0.045), (0.1, 0.03)):
        co = base + rot @ Vector((0, 0, t))
        out.append(dict(type='ELLIPSOID', co=tuple(co), r=r, size=(1.0, 0.45, 0.85), rot=deg, s=3.0))
    return out


elems = [
    dict(type='ELLIPSOID', co=(0, 0.02, 1.3), r=0.158, size=(1.28, 1.0, 0.95)),       # cranium (wide, round)
    dict(type='ELLIPSOID', co=(0, -0.07, 1.335), r=0.085, size=(1.3, 1.0, 0.9)),      # broad forehead
    dict(type='ELLIPSOID', co=(0, -0.05, 1.17), r=0.085, size=(1.2, 1.0, 0.72)),       # jaw
    dict(type='ELLIPSOID', co=(0, -0.145, 1.207), r=0.06, size=(0.95, 1.3, 0.8)),   # muzzle
    dict(co=(0, -0.195, 1.219), r=0.031),                                              # muzzle tip
    dict(type='CAPSULE', co=(0, 0.03, 1.06), r=0.072, size=(0.07, 1, 1), rot=(0, 90, 0)),  # neck
]
for s in (-1, 1):
    elems += [
        dict(type='ELLIPSOID', co=(s * 0.13, -0.04, 1.195), r=0.095, size=(1.05, 0.95, 0.88)),  # cheeks
        dict(co=(s * 0.074, -0.118, 1.322), r=0.04),                                           # brow
        dict(co=(s * 0.084, -0.165, 1.27), r=0.03, neg=True),                                 # eye socket
    ]
    elems += ear_elems(s)

head = metaball_mesh("AR_Head", elems, C_HEAD, res=0.006)
remesh(head, 0.0042, smooth_iters=4, smooth_factor=0.5)

# ---------------------------------------------------------------- markings
def ear_w(p):
    w = 0.0
    for s in (-1, 1):
        base, rot = ear_frame(s)
        tip = base + rot @ Vector((0, 0, 0.13))
        d = seg_dist(p, base + rot @ Vector((0, 0, 0.02)), tip)
        w = max(w, 1 - smoothstep(0.03, 0.05, d))
    return w


def ear_front(p, n):
    for s in (-1, 1):
        base, rot = ear_frame(s)
        fwd = rot @ Vector((0, -1, 0))
        if (p - base).length < 0.17 and n.dot(fwd) > 0.2:
            return 1.0
    return 0.0


def head_color(p, n):
    ax = abs(p.x)
    nz = noise.noise(p * 38.0)
    c = lerp3(FUR, FUR_D, 0.35 + 0.35 * nz)
    # lighter grizzle on cheeks / sides
    c = lerp3(c, FUR_L, smoothstep(0.08, 0.2, ax) * smoothstep(1.3, 1.16, p.z) * 0.7)
    # muzzle + chin cream
    muz = smoothstep(-0.1, -0.15, p.y) * smoothstep(1.24, 1.22, p.z)
    chin = smoothstep(1.17, 1.14, p.z) * smoothstep(0.0, -0.08, p.y)
    lowcheek = smoothstep(0.08, 0.15, ax) * smoothstep(1.215, 1.17, p.z) * smoothstep(0.08, -0.03, p.y)
    c = lerp3(c, CREAM, max(muz, chin, lowcheek * 0.95))
    # brows
    if p.y < -0.04:
        d = seg_dist(Vector((ax, p.z, 0)), Vector((0.04, 1.322, 0)), Vector((0.15, 1.3, 0)))
        rad = 0.016 - 0.006 * smoothstep(0.05, 0.14, ax)
        c = lerp3(c, CREAM, 0.95 * (1 - smoothstep(rad, rad + 0.008, d)))
    # mask band
    if p.y < 0.03:
        d = seg_dist(Vector((ax, p.z, 0)), Vector((0.035, 1.272, 0)), Vector((0.2, 1.215, 0)))
        rad = 0.048 - 0.014 * smoothstep(0.12, 0.2, ax)
        c = lerp3(c, MASK, 1 - smoothstep(rad - 0.006, rad + 0.004, d))
    # nose bridge stripe
    if ax < 0.045 and p.y < -0.05:
        c = lerp3(c, MASK, (1 - smoothstep(0.012, 0.026, ax)) * smoothstep(1.235, 1.26, p.z) * smoothstep(1.39, 1.35, p.z) * 0.85)
    # ears
    ew = ear_w(p)
    if ew > 0:
        inner = ear_front(p, n)
        ec = lerp3(FUR_D, INNER_EAR, inner)
        base, rot = ear_frame(1 if p.x > 0 else -1)
        lp = rot.transposed() @ (p - base)
        rim = smoothstep(0.03, 0.045, (Vector((lp.x, 0, lp.z * 0.55))).length) if inner else smoothstep(0.08, 0.11, lp.z)
        ec = lerp3(ec, CREAM, rim * 0.95)
        c = lerp3(c, ec, ew)
    return c


paint(head, head_color)

# ---------------------------------------------------------------- fur tufts
def r_hair(co, n):
    if ear_w(co) > 0.05:
        return 0
    return smoothstep(1.39, 1.45, co.z) * (1 - smoothstep(0.08, 0.13, abs(co.x))) * smoothstep(-0.13, -0.05, co.y)


def d_hair(co, n):
    return Vector((0.55 + co.x * 2.0, 0.75, 0.6))


def r_cheek(co, n):
    return smoothstep(0.15, 0.19, abs(co.x)) * smoothstep(1.11, 1.15, co.z) * smoothstep(1.27, 1.22, co.z)


def d_cheek(co, n):
    return Vector((math.copysign(1, co.x) * 0.8, 0.3, -0.7))


def r_body(co, n):
    if ear_w(co) > 0.05 or co.z < 1.1:
        return 0
    return 0.6 * smoothstep(-0.06, 0.02, co.y)


def d_body(co, n):
    return Vector((0, 0.7, -0.25))


def r_chin(co, n):
    return smoothstep(1.16, 1.13, co.z) * smoothstep(1.08, 1.11, co.z) * smoothstep(0.0, -0.08, co.y)


def r_ear_in(co, n):
    return ear_w(co) * ear_front(co, n)


head.data.update()
head_web = web_variant(head)
for tgt, k in ((head_web, 1.0), (head, 0.3)):
    moved = set()
    moved |= tufts(tgt, r_cheek, 170, 0.05 * k, 0.045, d_cheek, seed=3, sharp=1.4)
    moved |= tufts(tgt, r_hair, 9, 0.05 * k, 0.05, d_hair, seed=5, sharp=1.3, jitter=0.15, normal_mix=0.3)
    moved |= tufts(tgt, r_body, 220, 0.013 * k, 0.03, d_body, seed=7, sharp=1.5)
    moved |= tufts(tgt, r_chin, 40, 0.022 * k, 0.03, lambda c, n: Vector((0, 0, -1)), seed=9, sharp=1.5)
    moved |= tufts(tgt, r_ear_in, 30, 0.018 * k, 0.016, lambda c, n: Vector((0, 0, 1)), seed=11, sharp=1.5)
    smooth_verts(tgt, moved, 0.5, 3)
    tgt.data.shade_smooth()

m_fur = mat("AR_Fur", '#5d5047', rough=0.8, vcol=True, sheen=0.05, spec=0.08)
set_mats(head, [m_fur])
set_mats(head_web, [m_fur])
head.data.shade_smooth()

# ---------------------------------------------------------------- surface helpers
bpy.context.view_layer.update()


def hit(origin, direction):
    ok, loc, nrm, idx = head.ray_cast(Vector(origin), Vector(direction).normalized())
    return (loc, nrm) if ok else (None, None)


# ---------------------------------------------------------------- eyes
m_eye_sclera = mat("AR_EyeSclera", '#1a0f08', rough=0.1, coat=0.0)
m_eye_iris = mat("AR_EyeIris", '#c87818', rough=0.08, emit='#d07a10', emit_strength=1.2)
m_eye_pupil = mat("AR_EyePupil", '#050303', rough=0.08)
m_mask = mat("AR_MaskFur", '#140f0e', rough=0.75, sheen=0.05, spec=0.08)
m_nose = mat("AR_Nose", '#0d0a0a', rough=0.28, spec=0.6)
m_mouth = mat("AR_Mouth", '#1a100e', rough=0.6)
m_whisk = mat("AR_Whisker", '#a59c90', rough=0.6)

ER = 0.033
for s, side in ((-1, "R"), (1, "L")):
    loc, nrm = hit((s * 0.084, -0.5, 1.272), (0, 1, 0))
    center = loc + Vector((0, ER * 0.45, 0))
    look = Vector((s * 0.16, -1, 0.02)).normalized()
    rot = look.to_track_quat('Z', 'Y').to_matrix().to_4x4()

    def build_eye(bm):
        bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=28, radius=ER)
        for f in bm.faces:
            a = math.acos(max(-1, min(1, f.calc_center_median().normalized().z)))
            f.material_index = 2 if a < 0.24 else (1 if a < 0.85 else 0)
            f.smooth = True
    eye = bm_obj("AR_Eye_" + side, C_HEAD, build_eye, [m_eye_sclera, m_eye_iris, m_eye_pupil])
    eye.matrix_world = Matrix.Translation(center) @ rot

    # lids: shells of a slightly bigger sphere, cut by tilted planes (heavy, smug upper lid)
    def build_lid(bm, upper):
        bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=28, radius=ER * 1.1)
        roll = math.radians(-14 * s)  # outer corner lower
        up = Vector((math.sin(roll), math.cos(roll), 0.25 if upper else -0.1)).normalized()
        dead = []
        for v in bm.verts:
            y = v.co.normalized().dot(up)
            if upper and y < 0.2:
                dead.append(v)
            if not upper and y > -0.6:
                dead.append(v)
        bmesh.ops.delete(bm, geom=dead, context='VERTS')
        for f in bm.faces:
            f.smooth = True
    for upper, nm in ((True, "Upper"), (False, "Lower")):
        lid = bm_obj("AR_Lid%s_%s" % (nm, side), C_HEAD, lambda bm: build_lid(bm, upper), [m_mask])
        lid.matrix_world = Matrix.Translation(center) @ rot
        sm = mod(lid, 'SOLIDIFY', thickness=0.006, offset=1.0)
        apply_mods(lid)

# ---------------------------------------------------------------- nose
tip, tn = hit((0, -0.6, 1.232), (0, 1, 0))


def build_nose(bm):
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        z2 = z - 0.25 * (1 - min(1, abs(x) * 1.5)) * max(0, -z)  # slight heart dip at the bottom
        v.co = Vector((x * 0.037, y * 0.026, z2 * 0.025))
    for f in bm.faces:
        f.smooth = True
nose = bm_obj("AR_Nose", C_HEAD, build_nose, [m_nose])
nose.location = tip + Vector((0, 0.008, 0.002))

# ---------------------------------------------------------------- mouth (smirk) + philtrum
def surface_curve(name, pts2d, bevel, mats, taper=False):
    pts = []
    for x, z in pts2d:
        loc, nrm = hit((x, -0.6, z), (0, 1, 0))
        if loc is not None:
            pts.append(loc + nrm * 0.0006)
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = bevel
    cu.bevel_resolution = 2
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
        if taper:
            t = i / (len(pts) - 1)
            sp.points[i].radius = 1.0 - 0.85 * t
    co = new_obj(name + "_crv", cu, C_HEAD)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(co.evaluated_get(dg))
    bpy.data.objects.remove(co, do_unlink=True)
    bpy.data.curves.remove(cu)
    o = new_obj(name, me, C_HEAD)
    set_mats(o, mats)
    o.data.shade_smooth()
    return o


mouth_pts = []
for i in range(25):
    x = -0.052 + 0.104 * i / 24
    z = 1.172 + 4.0 * x * x + 0.12 * x  # smirk: character's left corner higher
    mouth_pts.append((x, z))
surface_curve("AR_Mouth", mouth_pts, 0.0024, [m_mouth])
surface_curve("AR_Philtrum", [(0, 1.207 - 0.034 * i / 6) for i in range(7)], 0.002, [m_mouth])

# ---------------------------------------------------------------- whiskers
wh = []
rnd = random.Random(4)
for s in (-1, 1):
    for k in range(3):
        root = (s * (0.03 + 0.005 * k), 1.205 - 0.008 * k)
        loc, nrm = hit((root[0], -0.6, root[1]), (0, 1, 0))
        d = Vector((s * 1.0, 0.15 + 0.1 * k, 0.12 - 0.12 * k)).normalized()
        pts = []
        for i in range(6):
            t = i / 5 * 0.095
            pts.append(loc + d * t + Vector((0, 0, -0.6 * t * t)))
        cu = bpy.data.curves.new("wh", 'CURVE')
        cu.dimensions = '3D'
        cu.bevel_depth = 0.0007
        cu.bevel_resolution = 0
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (*p, 1)
            sp.points[i].radius = 1 - 0.8 * i / 5
        co = new_obj("wh_tmp_%d_%d" % (s, k), cu, C_HEAD)
        wh.append(co)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
bm = bmesh.new()
for co in wh:
    me = bpy.data.meshes.new_from_object(co.evaluated_get(dg))
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    cu = co.data
    bpy.data.objects.remove(co, do_unlink=True)
    bpy.data.curves.remove(cu)
whisk = new_obj("AR_Whiskers", mesh_from_bm("AR_Whiskers", bm), C_HEAD)
set_mats(whisk, [m_whisk])

result = {"head_tris": tri_count(head), "head_dims": tuple(round(d, 3) for d in head.dimensions),
          "nose_tip": tuple(round(v, 3) for v in tip)}

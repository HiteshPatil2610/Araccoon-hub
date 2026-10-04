for c in (C_BODY, C_CLOTH, C_ACC):
    clear_coll(c)

# ================================================================= PANTS
P = [
    dict(type='ELLIPSOID', co=(0, 0.015, 0.6), r=0.16, size=(1.3, 0.95, 0.72)),
    dict(type='ELLIPSOID', co=(0, 0.045, 0.5), r=0.15, size=(1.22, 1.0, 0.8)),
]
POCKET = {}
for s in (-1, 1):
    P += chain((s * 0.115, 0.0, 0.52), (s * 0.148, -0.005, 0.32), 0.122, 0.118, s=2.4)
    P += chain((s * 0.148, -0.005, 0.32), (s * 0.162, -0.02, 0.215), 0.118, 0.108, s=2.4)
    P += chain((s * 0.162, -0.02, 0.215), (s * 0.164, -0.025, 0.19), 0.1, 0.082, s=2.6)
    P.append(dict(co=(s * 0.205, -0.085, 0.47), r=0.055))  # paw bulge in pocket
    POCKET[s] = Vector((s * 0.2, -0.13, 0.5))
pants = metaball_mesh("AR_Pants", P, C_CLOTH, res=0.008)
remesh(pants, 0.006, smooth_iters=3)
# open hem at ankles is hidden by shoes; folds
def pants_disp(co, n):
    d = fabric_noise(co, 6.0, 0.007)
    # ankle stacking
    w = smoothstep(0.34, 0.22, co.z) * smoothstep(0.17, 0.2, co.z)
    d += math.sin(co.z * 80 + noise.noise(co * 9) * 3.0) * 0.0045 * w
    # knee / thigh diagonal pulls
    leg = abs(co.x) > 0.04
    if leg:
        kw = smoothstep(0.42, 0.33, co.z) * smoothstep(0.2, 0.28, co.z)
        d += math.sin((co.z + co.x * 0.6 * math.copysign(1, co.x)) * 70 + noise.noise(co * 5) * 2) * 0.006 * kw
    # crotch/hip pull folds
    hw = smoothstep(0.58, 0.5, co.z) * smoothstep(0.4, 0.48, co.z) * (1 - smoothstep(0.06, 0.14, abs(co.x)))
    d += math.sin(abs(co.x) * 80 - co.z * 40) * 0.004 * hw
    return d


displace(pants, pants_disp)
paint(pants, lambda p, n: lerp3(srgb('#19171c'), srgb('#24212a'), 0.5 + 0.5 * noise.noise(p * 14)))
set_mats(pants, [m_pants])
pants.data.shade_smooth()

# ================================================================= HOODIE
H = [
    dict(type='ELLIPSOID', co=(0, 0.01, 0.88), r=0.17, size=(1.32, 0.9, 1.05)),   # chest
    dict(type='ELLIPSOID', co=(0, 0.0, 0.72), r=0.175, size=(1.28, 0.95, 0.95)),  # belly
    dict(type='ELLIPSOID', co=(0, 0.01, 0.6), r=0.18, size=(1.3, 1.0, 0.6)),      # hem area
    dict(co=(0, -0.025, 1.035), r=0.07, neg=True, s=2.5),                         # neck hole
]
for s in (-1, 1):
    H.append(dict(co=(s * 0.19, 0.015, 0.94), r=0.095))                            # shoulder
hood = []
for i in range(13):
    a = math.radians(-120 + 240 * i / 12)
    hood.append(dict(co=(math.sin(a) * 0.12, 0.035 + math.cos(a) * 0.11, 1.005 + 0.02 * math.cos(a)), r=0.06))
hood.append(dict(type='ELLIPSOID', co=(0, 0.165, 0.94), r=0.1, size=(1.35, 0.7, 1.1)))
hood.append(dict(type='ELLIPSOID', co=(0, 0.17, 1.03), r=0.075, size=(1.4, 0.8, 0.8)))
H += hood
hoodie = metaball_mesh("AR_Hoodie", H, C_CLOTH, res=0.008)

SLEEVE = {}
for s in (-1, 1):
    sh = Vector((s * 0.215, 0.015, 0.93))
    el = Vector((s * 0.305, 0.06, 0.72))
    wr = Vector((s * 0.29, -0.055, 0.585))
    SLEEVE[s] = (sh, el, wr)
    E = chain(sh, el, 0.09, 0.083, 0.02) + chain(el, wr, 0.083, 0.072, 0.02)
    sl = metaball_mesh("AR_Sleeve_%d" % s, E, C_CLOTH, res=0.008)
    join_into(hoodie, [sl])
remesh(hoodie, 0.0055, smooth_iters=2)


# open front + open hem
delete_faces(hoodie, lambda c: (c.y < -0.03 and abs(c.x) < zip_halfwidth(c.z) and c.z > 0.5) or c.z < 0.555)
smooth_boundary(hoodie, 8, 0.5)


def hoodie_disp(co, n):
    d = fabric_noise(co, 6.5, 0.0065)
    for s in (-1, 1):
        sh, el, wr = SLEEVE[s]
        # elbow bunching rings
        de = (co - el).length
        if de < 0.13:
            ax = (wr - sh).normalized()
            d += math.sin((co - el).dot(ax) * 120 + noise.noise(co * 8) * 2.5) * 0.008 * (1 - de / 0.13)
        # cuff bunching
        dw = (co - wr).length
        if dw < 0.1:
            ax = (wr - el).normalized()
            d += math.sin((co - wr).dot(ax) * 150) * 0.006 * (1 - dw / 0.1)
    # horizontal belly/hem folds
    d += math.sin(co.z * 55 + noise.noise(co * 4) * 3) * 0.004 * smoothstep(0.8, 0.62, co.z) * (1 if abs(co.x) > 0.06 else 0.4)
    return d


displace(hoodie, hoodie_disp)

EMB = [(-0.11, 0.86), (-0.055, 0.73), (0.0, 0.81), (0.055, 0.73), (0.11, 0.86)]  # back emblem (x,z), seen from behind


def emblem_d(x, z):
    d = 9.0
    for i in range(len(EMB) - 1):
        d = min(d, seg_dist(Vector((x, z, 0)), Vector((*EMB[i], 0)), Vector((*EMB[i + 1], 0))))
    # outer chevron frame
    frame = [(-0.15, 0.9), (0.0, 0.68), (0.15, 0.9)]
    for i in range(len(frame) - 1):
        d = min(d, seg_dist(Vector((x, z, 0)), Vector((*frame[i], 0)), Vector((*frame[i + 1], 0))) + 0.004)
    return d


def hoodie_color(p, n):
    c = lerp3(FABRIC, FABRIC_L, 0.35 + 0.35 * noise.noise(p * 12))
    # hem rib band + darker hood interior hint
    c = lerp3(c, BLACK, smoothstep(0.6, 0.57, p.z))
    # back emblem
    if p.y > 0.08:
        c = lerp3(c, PURPLE, 1 - smoothstep(0.0085, 0.0125, emblem_d(-p.x, p.z)))
    # sleeve patches (outer upper arm): geometric badge outline
    for s in (-1, 1):
        sh, el, wr = SLEEVE[s]
        ctr = sh.lerp(el, 0.45) + Vector((s * 0.085, -0.01, 0))
        q = p - ctr
        if q.length < 0.06 and p.x * s > 0:
            u, v = abs(q.y), abs(q.z)
            box = max(u - 0.032, v - 0.022)
            ring = abs(box)
            c = lerp3(c, PURPLE, (1 - smoothstep(0.004, 0.007, ring)) * 0.9)
            c = lerp3(c, srgb('#d8d2e6'), (1 - smoothstep(0.003, 0.0055, abs(u - 0.012 - v * 0.6))) * (1 if box < -0.006 else 0) * 0.8)
    return c


paint(hoodie, hoodie_color)
mod(hoodie, 'SOLIDIFY', thickness=0.011, offset=-1.0, use_even_offset=False, use_rim=True)
apply_mods(hoodie)
set_mats(hoodie, [m_fabric])
hoodie.data.shade_smooth()

# ---- shirt (visible in the open front)
SH = [
    dict(type='ELLIPSOID', co=(0, 0.01, 0.86), r=0.155, size=(1.25, 0.86, 1.15)),
    dict(type='ELLIPSOID', co=(0, 0.0, 0.7), r=0.16, size=(1.22, 0.9, 0.95)),
    dict(co=(0, 0.02, 1.05), r=0.075, s=2.0),
]
shirt = metaball_mesh("AR_Shirt", SH, C_CLOTH, res=0.008)
remesh(shirt, 0.007, smooth_iters=2)
delete_faces(shirt, lambda c: c.z < 0.56)
displace(shirt, lambda co, n: fabric_noise(co, 8, 0.004) + math.sin(co.z * 70 + co.x * 30) * 0.003 * smoothstep(0.8, 0.64, co.z))
set_mats(shirt, [m_shirt])
shirt.data.shade_smooth()

# ================================================================= FOREARMS (fur, going into pockets)
for s in (-1, 1):
    sh, el, wr = SLEEVE[s]
    pk = POCKET[s] + Vector((0, 0.035, -0.02))
    A = chain(wr + (wr - el).normalized() * -0.03, pk, 0.05, 0.043, 0.012)
    arm = metaball_mesh("AR_Forearm_%s" % ("L" if s > 0 else "R"), A, C_BODY, res=0.005)
    remesh(arm, 0.004, smooth_iters=2)
    paint(arm, lambda p, n: lerp3(FUR, FUR_L, 0.4 + 0.4 * noise.noise(p * 40)))
    arm_web = web_variant(arm)
    moved = tufts(arm_web, lambda co, n: 1.0, 70, 0.016, 0.018, lambda co, n, a=(pk - wr).normalized(): a * 0.6, seed=21 + s, sharp=1.5)
    smooth_verts(arm_web, moved, 0.5, 2)
    for o in (arm, arm_web):
        set_mats(o, [m_fur])
        o.data.shade_smooth()
    # ribbed black cuff band around the sleeve end
    ax = (wr - el).normalized()
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=28, radius1=0.06, radius2=0.057, depth=0.035)
    for v in bm.verts:
        ang = math.atan2(v.co.y, v.co.x)
        v.co.xy *= 1 + 0.035 * math.sin(ang * 14)
    cuff = new_obj("AR_Cuff_%s" % ("L" if s > 0 else "R"), mesh_from_bm("cuff", bm), C_CLOTH)
    cuff.matrix_world = Matrix.Translation(wr + ax * 0.005) @ ax.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    mod(cuff, 'SOLIDIFY', thickness=0.008, offset=1.0)
    mod(cuff, 'SUBSURF', levels=1, render_levels=1)
    apply_mods(cuff)
    set_mats(cuff, [m_black_trim])
    cuff.data.shade_smooth()
    # pocket opening: dark slanted slit on the pants
    pc = POCKET[s]
    ribbon("AR_PocketEdge_%s" % ("L" if s > 0 else "R"), pants,
           [pc + Vector((-s * 0.02, -0.1, 0.075)), pc + Vector((s * 0.04, -0.1, -0.06))], (0, 1, 0),
           0.012, C_CLOTH, [m_black_trim], offset=0.001, thick=0.006)

# ================================================================= PANTS DETAILS: cargo pockets, straps, buckles, belt
for s in (-1, 1):
    tag = "L" if s > 0 else "R"
    # side cargo pocket
    zc = 0.33
    gp = [Vector((s * 0.5, -0.005, zc + 0.065)), Vector((s * 0.5, -0.005, zc)), Vector((s * 0.5, -0.005, zc - 0.07))]
    ribbon("AR_CargoPocket_" + tag, pants, gp, (-s, 0, 0), 0.11, C_CLOTH, [m_pants], offset=0.0, thick=0.016,
           width_fn=lambda t: 1.0 - 0.05 * t)
    apply_vcol = bpy.data.objects["AR_CargoPocket_" + tag]
    paint(apply_vcol, lambda p, n: srgb('#1d1a21'))
    flap_g = [Vector((s * 0.5, -0.005, zc + 0.082)), Vector((s * 0.5, -0.005, zc + 0.045))]
    flap = ribbon("AR_CargoFlap_" + tag, pants, flap_g, (-s, 0, 0), 0.122, C_CLOTH, [m_pants], offset=0.016, thick=0.012)
    paint(flap, lambda p, n: srgb('#131116'))
    # purple strap hanging along the thigh front + buckle
    sg = [Vector((s * 0.15, -0.5, 0.56)), Vector((s * 0.16, -0.5, 0.45)), Vector((s * 0.175, -0.5, 0.33))]
    strap = ribbon("AR_ThighStrap_" + tag, pants, sg, (0, 1, 0), 0.022, C_ACC, [m_strap], offset=0.004, thick=0.004)
    # buckle at strap end
    bpy.context.view_layer.update()
    ok, loc, nrm, _ = pants.ray_cast(Vector((s * 0.175, -0.6, 0.335)), Vector((0, 1, 0)))
    if ok:
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * 0.032, v.co.y * 0.008, v.co.z * 0.022))
        bk = new_obj("AR_Buckle_" + tag, mesh_from_bm("bk", bm), C_ACC)
        bk.matrix_world = Matrix.Translation(loc + nrm * 0.008) @ nrm.to_track_quat('-Y', 'Z').to_matrix().to_4x4()
        mod(bk, 'BEVEL', width=0.003, segments=2)
        apply_mods(bk)
        set_mats(bk, [m_metal])
        bk.data.shade_smooth()
    # side strap loop hanging off the hip (back-side)
    lg = [Vector((s * 0.5, 0.06, 0.55)), Vector((s * 0.5, 0.07, 0.47)), Vector((s * 0.5, 0.05, 0.41))]
    ribbon("AR_HipStrap_" + tag, pants, lg, (-s, 0, 0), 0.02, C_ACC, [m_strap], offset=0.004, thick=0.004)


# ================================================================= SHOES
def shoe(s):
    tag = "L" if s > 0 else "R"
    xc, yc = s * 0.165, -0.035
    # sole: rounded footprint, extruded
    bm = bmesh.new()
    N = 48
    ring_b, ring_t = [], []
    for i in range(N):
        a = 2 * math.pi * i / N
        ca, sa = math.cos(a), math.sin(a)
        rx = 0.072 * (1.0 if sa < 0 else 0.92)
        ry = 0.165 if sa < 0 else 0.135
        e = 2.6
        x = math.copysign(abs(ca) ** (2 / e), ca) * rx
        y = math.copysign(abs(sa) ** (2 / e), sa) * ry
        lift = max(0, -y - 0.09) * 0.35  # toe spring
        ring_b.append(bm.verts.new((xc + x, yc + y, 0.0 + lift)))
        ring_t.append(bm.verts.new((xc + x * 1.0, yc + y * 1.0, 0.042 + lift * 0.6)))
    bm.faces.new(list(reversed(ring_b)))
    bm.faces.new(ring_t)
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((ring_b[i], ring_b[j], ring_t[j], ring_t[i]))
    sole = new_obj("AR_Sole_" + tag, mesh_from_bm("sole", bm), C_ACC)
    mod(sole, 'BEVEL', width=0.008, segments=3, limit_method='ANGLE')
    apply_mods(sole)
    set_mats(sole, [m_rubber])
    sole.data.shade_smooth()

    U = [
        dict(type='ELLIPSOID', co=(xc, yc - 0.105, 0.06), r=0.052, size=(1.15, 1.4, 0.75)),  # toe box
        dict(type='ELLIPSOID', co=(xc, yc - 0.02, 0.075), r=0.064, size=(1.0, 1.25, 0.95)),  # vamp
        dict(type='ELLIPSOID', co=(xc, yc + 0.075, 0.085), r=0.06, size=(0.95, 1.0, 1.15)),  # heel
        dict(type='ELLIPSOID', co=(xc, yc + 0.03, 0.15), r=0.064, size=(1.0, 1.05, 1.1)),    # ankle collar
        dict(type='ELLIPSOID', co=(xc, yc - 0.035, 0.135), r=0.045, size=(0.9, 1.0, 1.2)),  # tongue
    ]
    up = metaball_mesh("AR_ShoeUpper_" + tag, U, C_ACC, res=0.006)
    remesh(up, 0.0035, smooth_iters=2)
    delete_faces(up, lambda c: c.z < 0.025)

    def scol(p, n):
        u = (p.y - yc) / 0.15
        side = abs(p.x - xc)
        c = BLACK
        # cream toe box + mid quarter
        if p.z < 0.1:
            c = lerp3(c, CREAM, smoothstep(-0.4, -0.55, u) * smoothstep(0.1, 0.085, p.z))
            c = lerp3(c, CREAM, smoothstep(-0.32, -0.22, u) * smoothstep(0.38, 0.28, u) * smoothstep(0.04, 0.05, p.z) * smoothstep(0.112, 0.1, p.z))
        # purple sweeping side stripe
        if side > 0.035:
            zc_ = 0.062 + 0.045 * (u + 0.25)
            band = 0.011 * smoothstep(-0.55, -0.1, u) * smoothstep(0.75, 0.35, u)
            c = lerp3(c, PURPLE, 1 - smoothstep(band * 0.8, band * 1.1 + 0.001, abs(p.z - zc_)))
        # heel tab + collar trim
        c = lerp3(c, PURPLE, smoothstep(0.75, 0.88, u) * smoothstep(0.1, 0.12, p.z) * (1 - smoothstep(0.03, 0.045, side)))
        c = lerp3(c, PURPLE_D, smoothstep(0.185, 0.2, p.z))
        return c
    paint(up, scol)
    set_mats(up, [m_leather])
    up.data.shade_smooth()

    # laces: bars across the front slope
    bpy.context.view_layer.update()
    lace_objs = []
    for k in range(5):
        z = 0.1 + 0.02 * k
        ok, loc, nrm, _ = up.ray_cast(Vector((xc, yc - 0.4, z + 0.14)), Vector((0, 1, -0.35)).normalized())
        if not ok:
            continue
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1)
        for v in bm.verts:
            v.co = Vector((v.co.x * 0.03, v.co.y * 0.006, v.co.z * 0.0055))
        lo = new_obj("lace_tmp_%s_%d" % (tag, k), mesh_from_bm("lace", bm), C_ACC)
        tilt = 0.35 if k % 2 else -0.35
        lo.matrix_world = Matrix.Translation(loc + nrm * 0.003) @ nrm.to_track_quat('-Y', 'Z').to_matrix().to_4x4() @ Matrix.Rotation(tilt, 4, 'Y')
        lace_objs.append(lo)
    lace = lace_objs[0]
    lace.name = "AR_Laces_" + tag
    join_into(lace, lace_objs[1:])
    set_mats(lace, [m_lace])
    lace.data.shade_smooth()
    SC = 1.2
    Tm = Matrix.Translation((xc, yc, 0)) @ Matrix.Scale(SC, 4) @ Matrix.Translation((-xc, -yc, 0))
    for o in (sole, up, lace):
        o.data.transform(o.matrix_world.inverted() @ Tm @ o.matrix_world)
        o.data.update()


for s in (-1, 1):
    shoe(s)

result = {"pants_dims": tuple(round(d, 3) for d in pants.dimensions), "hoodie_dims": tuple(round(d, 3) for d in hoodie.dimensions)}

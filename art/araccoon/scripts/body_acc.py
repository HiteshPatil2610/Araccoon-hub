hoodie = bpy.data.objects["AR_Hoodie"]
pants = bpy.data.objects["AR_Pants"]
# ================================================================= HEADPHONES
HP_C = coll("AR_Headphones", C_ACC)
clear_coll(HP_C)
for s in (-1, 1):
    tag = "L" if s > 0 else "R"
    ctr = Vector((s * 0.14, -0.04, 1.04))
    facing = Vector((s * 0.8, -0.6, 0.12)).normalized()  # cups rest at the collar, facing out-forward
    M = Matrix.Translation(ctr) @ facing.to_track_quat('Z', 'Y').to_matrix().to_4x4()

    def cyl(name, r1, depth, z0, mats, segs=40, bev=0.004):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r1, radius2=r1 * 0.94, depth=depth)
        bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, z0))
        o = new_obj(name, mesh_from_bm(name, bm), HP_C)
        o.matrix_world = M
        mod(o, 'BEVEL', width=bev, segments=3, limit_method='ANGLE')
        apply_mods(o)
        set_mats(o, mats)
        o.data.shade_smooth()
        return o
    cyl("AR_HP_Cup_" + tag, 0.066, 0.036, 0.014, [m_plastic])
    cyl("AR_HP_Cushion_" + tag, 0.06, 0.022, -0.012, [m_cushion], bev=0.008)
    cyl("AR_HP_Face_" + tag, 0.042, 0.004, 0.0335, [m_cushion], bev=0.001)
    # glowing torus ring on the outer face
    bm = bmesh.new()
    R, r = 0.051, 0.0048
    segs, rs = 48, 8
    grid = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        row = []
        for j in range(rs):
            b = 2 * math.pi * j / rs
            row.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
        grid.append(row)
    for i in range(segs):
        for j in range(rs):
            bm.faces.new((grid[i][j], grid[(i + 1) % segs][j], grid[(i + 1) % segs][(j + 1) % rs], grid[i][(j + 1) % rs]))
    ring = new_obj("AR_HP_GlowRing_" + tag, mesh_from_bm("AR_HP_GlowRing_" + tag, bm), HP_C)
    ring.matrix_world = M @ Matrix.Translation((0, 0, 0.0335))
    set_mats(ring, [m_glow])
    ring.data.shade_smooth()
    # small play-triangle icon
    bm = bmesh.new()
    t = [bm.verts.new((0.0, 0.013, 0.037)), bm.verts.new((-0.0115, -0.008, 0.037)), bm.verts.new((0.0115, -0.008, 0.037))]
    bm.faces.new(t)
    ico = new_obj("AR_HP_Icon_" + tag, mesh_from_bm("ico", bm), HP_C)
    ico.matrix_world = M
    mod(ico, 'SOLIDIFY', thickness=0.0015)
    apply_mods(ico)
    set_mats(ico, [m_glow])
# band behind the neck, resting on the hood
band = []
for i in range(25):
    a = math.radians(-118 + 236 * i / 24)
    band.append(Vector((math.sin(a) * 0.165, 0.0 + math.cos(a) * 0.15, 1.07 + 0.035 * math.cos(a))))
curve_mesh("AR_HP_Band", band, HP_C, [m_plastic], bevel=0.009, res=3)

# ================================================================= NECKLACE + PENDANT
neck_pts = []
for i in range(33):
    a = math.radians(-150 + 300 * i / 32)
    drop = max(0, math.cos(a)) ** 3 * 0.12
    neck_pts.append(Vector((math.sin(a) * 0.082, -math.cos(a) * 0.095 + 0.03, 1.02 - drop)))
curve_mesh("AR_Necklace", neck_pts, C_ACC, [m_metal], bevel=0.0018, res=1)
bm = bmesh.new()
pts = [(0, 0.022), (0.016, -0.004), (0, -0.026), (-0.016, -0.004)]
vs = [bm.verts.new((x, 0, z)) for x, z in pts]
bm.faces.new(vs)
pend = new_obj("AR_Pendant", mesh_from_bm("pend", bm), C_ACC)
pend.location = neck_pts[16] + Vector((0, -0.006, -0.03))
mod(pend, 'SOLIDIFY', thickness=0.005, offset=0)
mod(pend, 'BEVEL', width=0.0015, segments=2)
apply_mods(pend)
set_mats(pend, [m_metal])

# ================================================================= HOODIE TRIMS: zipper tapes, drawstrings, chest straps
bpy.context.view_layer.update()
for s in (-1, 1):
    tag = "L" if s > 0 else "R"
    zp = [Vector((s * (zip_halfwidth(z) + 0.012), -0.5, z)) for z in (0.58, 0.68, 0.8, 0.92, 0.99)]
    ribbon("AR_ZipTape_" + tag, hoodie, zp, (0, 1, 0), 0.014, C_CLOTH, [m_black_trim], offset=0.001, thick=0.004, facing=(0, -1, 0))
    # drawstring hanging from the collar
    top = Vector((s * 0.075, -0.13, 0.99))
    ds = [top, top + Vector((s * 0.008, -0.03, -0.06)), top + Vector((s * 0.012, -0.035, -0.15))]
    ds = catmull(ds, 6)
    curve_mesh("AR_Drawstring_" + tag, ds, C_CLOTH, [m_strap], bevel=0.0035, res=2)
    tip = ds[-1]
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.006, radius2=0.006, depth=0.022)
    ag = new_obj("AR_Aglet_" + tag, mesh_from_bm("ag", bm), C_ACC)
    ag.location = tip + Vector((0, 0, -0.008))
    set_mats(ag, [m_metal])
    # chest strap (purple) hanging from shoulder seam
    cs = [Vector((s * 0.15, -0.5, 0.97)), Vector((s * 0.15, -0.5, 0.86)), Vector((s * 0.14, -0.5, 0.75))]
    ribbon("AR_ChestStrap_" + tag, hoodie, cs, (0, 1, 0), 0.02, C_ACC, [m_strap], offset=0.012, thick=0.004)
    ok, loc, nrm, _ = hoodie.ray_cast(Vector((s * 0.14, -0.6, 0.755)), Vector((0, 1, 0)))
    if ok:
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * 0.03, v.co.y * 0.007, v.co.z * 0.02))
        bk = new_obj("AR_ChestBuckle_" + tag, mesh_from_bm("bk", bm), C_ACC)
        bk.matrix_world = Matrix.Translation(loc + nrm * 0.02) @ nrm.to_track_quat('-Y', 'Z').to_matrix().to_4x4()
        mod(bk, 'BEVEL', width=0.003, segments=2)
        apply_mods(bk)
        set_mats(bk, [m_metal])
# zipper pull
ok, loc, nrm, _ = hoodie.ray_cast(Vector((0.024, -0.6, 0.62)), Vector((0, 1, 0)))
if ok:
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * 0.012, v.co.y * 0.004, v.co.z * 0.03))
    zpull = new_obj("AR_ZipPull", mesh_from_bm("zp", bm), C_ACC)
    zpull.matrix_world = Matrix.Translation(loc + nrm * 0.006 + Vector((0, 0, -0.012)))
    mod(zpull, 'BEVEL', width=0.002, segments=2)
    apply_mods(zpull)
    set_mats(zpull, [m_metal])

objs = [o for c in (C_BODY, C_CLOTH, C_ACC, HP_C) for o in c.objects if o.type == 'MESH']
result = {"objects": len(objs), "tris": sum(tri_count(o) for o in objs),
          "pants_dims": tuple(round(d, 3) for d in pants.dimensions), "hoodie_dims": tuple(round(d, 3) for d in hoodie.dimensions)}

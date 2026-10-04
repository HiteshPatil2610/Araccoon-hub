"""Shared helpers for the Araccoon character build (run inside Blender via MCP)."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Euler, Quaternion, noise
from mathutils.kdtree import KDTree

ROOT = "E:/Personal-Projects/Araccoon-hub/art/araccoon"
SCENE_NAME = "Araccoon"
MB_K = 1 / 0.575  # metaball radius -> surface radius (stiffness 2, threshold 0.6)


# ---------------------------------------------------------------- scene / collections
def scene():
    s = bpy.data.scenes.get(SCENE_NAME)
    if s is None:
        s = bpy.data.scenes.new(SCENE_NAME)
    if bpy.context.window and bpy.context.window.scene != s:
        bpy.context.window.scene = s
    return s


def coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
    par = parent if parent is not None else scene().collection
    if c.name not in [x.name for x in par.children]:
        par.children.link(c)
    return c


def clear_coll(c):
    for o in list(c.objects):
        data = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if data is not None and data.users == 0:
            try:
                if isinstance(data, bpy.types.Mesh):
                    bpy.data.meshes.remove(data)
                elif isinstance(data, bpy.types.Curve):
                    bpy.data.curves.remove(data)
            except Exception:
                pass


def remove_obj(name):
    o = bpy.data.objects.get(name)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)


def new_obj(name, data, c):
    remove_obj(name)
    o = bpy.data.objects.new(name, data)
    c.objects.link(o)
    return o


def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


# ---------------------------------------------------------------- color helpers
def srgb(h):
    """hex or (r,g,b) sRGB 0-1 -> linear tuple"""
    if isinstance(h, str):
        h = h.lstrip('#')
        h = tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

    def f(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(c) for c in h)


def lerp3(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def smoothstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


# ---------------------------------------------------------------- materials (glTF-safe Principled)
def mat(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=0.0, vcol=False, sheen=0.0, coat=0.0, spec=0.5):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (400, 0)
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.location = (0, 0)
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    p.inputs['Base Color'].default_value = (*srgb(color), 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    try:
        p.inputs['Specular IOR Level'].default_value = spec
    except Exception:
        pass
    if sheen:
        p.inputs['Sheen Weight'].default_value = sheen
    if coat:
        p.inputs['Coat Weight'].default_value = coat
    if emit:
        p.inputs['Emission Color'].default_value = (*srgb(emit), 1)
        p.inputs['Emission Strength'].default_value = emit_strength
    if vcol:
        a = nt.nodes.new('ShaderNodeVertexColor')
        a.layer_name = 'Col'
        a.location = (-300, 0)
        nt.links.new(a.outputs['Color'], p.inputs['Base Color'])
    return m


def set_mats(o, mats):
    o.data.materials.clear()
    for m in mats:
        o.data.materials.append(m)


# ---------------------------------------------------------------- geometry ops
def apply_mods(o):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    old = o.data
    o.modifiers.clear()
    o.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return o


def remesh(o, voxel, smooth_iters=0, smooth_factor=0.5):
    m = o.modifiers.new("Remesh", 'REMESH')
    m.mode = 'VOXEL'
    m.voxel_size = voxel
    m.adaptivity = 0
    if smooth_iters:
        s = o.modifiers.new("Smooth", 'SMOOTH')
        s.factor = smooth_factor
        s.iterations = smooth_iters
    apply_mods(o)
    return o


def mod(o, kind, **kw):
    m = o.modifiers.new(kind.title(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def metaball_mesh(name, elems, c, res=0.008, threshold=0.6):
    """elems: dicts with type, co, r (surface radius), size, rot(deg xyz), neg, s(stiffness)"""
    mb = bpy.data.metaballs.new(name + "_MB")
    mb.resolution = res
    mb.render_resolution = res
    mb.threshold = threshold
    tmp = bpy.data.objects.new("MBTMP_" + name, mb)
    scene().collection.objects.link(tmp)
    for d in elems:
        e = mb.elements.new(type=d.get('type', 'BALL'))
        e.co = Vector(d['co'])
        e.radius = d['r'] * MB_K
        e.stiffness = d.get('s', 2.0)
        sx, sy, sz = d.get('size', (1, 1, 1))
        e.size_x, e.size_y, e.size_z = sx, sy, sz
        if 'rot' in d:
            e.rotation = Euler([math.radians(a) for a in d['rot']]).to_quaternion()
        e.use_negative = d.get('neg', False)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    me.name = name
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.metaballs.remove(mb)
    return new_obj(name, me, c)


def join_into(target, others):
    """Join mesh objects (world space) into target via bmesh."""
    bm = bmesh.new()
    bm.from_mesh(target.data)
    inv = target.matrix_world.inverted()
    for o in others:
        me = o.data.copy()
        me.transform(inv @ o.matrix_world)
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
        bpy.data.objects.remove(o, do_unlink=True)
    bm.to_mesh(target.data)
    bm.free()
    return target


def bm_obj(name, c, build, mats=None):
    bm = bmesh.new()
    build(bm)
    me = mesh_from_bm(name, bm)
    o = new_obj(name, me, c)
    if mats:
        set_mats(o, mats)
    return o


def shade_smooth(o, auto=None):
    o.data.shade_smooth()


def paint(o, fn, name='Col'):
    me = o.data
    if name in me.color_attributes:
        me.color_attributes.remove(me.color_attributes[name])
    ca = me.color_attributes.new(name, 'FLOAT_COLOR', 'POINT')
    me.update()
    mw = o.matrix_world
    nm = mw.to_3x3()
    for v in me.vertices:
        c = fn(mw @ v.co, (nm @ v.normal).normalized())
        ca.data[v.index].color = (*c, 1.0)
    me.color_attributes.active_color = ca
    return ca


def tufts(o, region, count, length, radius, direction, seed=1, sharp=2.2, jitter=0.35, normal_mix=0.55):
    """Pull pointed fur clumps out of a dense mesh.
    region(co, n) -> weight 0..1 ; direction(co, n) -> Vector (world)."""
    me = o.data
    me.update()
    rnd = random.Random(seed)
    verts = me.vertices
    kd = KDTree(len(verts))
    for v in verts:
        kd.insert(v.co, v.index)
    kd.balance()
    cands = [v for v in verts if region(v.co, v.normal) > 0.05]
    if not cands:
        return 0
    disp = {}
    for _ in range(count):
        c = rnd.choice(cands)
        w = region(c.co, c.normal)
        if rnd.random() > w:
            continue
        L = length * rnd.uniform(0.55, 1.25) * (0.4 + 0.6 * w)
        rr = radius * rnd.uniform(0.7, 1.3)
        d = (Vector(c.normal) * normal_mix + direction(c.co, c.normal) +
             Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1))) * jitter).normalized()
        for co, idx, dist in kd.find_range(c.co, rr):
            f = (1 - dist / rr) ** sharp
            dv = d * (L * f)
            if idx not in disp or dv.length > disp[idx].length:
                disp[idx] = dv
    for idx, dv in disp.items():
        verts[idx].co += dv
    me.update()
    return set(disp.keys())


def smooth_verts(o, idxs, factor=0.5, iters=3):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bm.verts.ensure_lookup_table()
    vs = [bm.verts[i] for i in idxs]
    for _ in range(iters):
        bmesh.ops.smooth_vert(bm, verts=vs, factor=factor, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(o.data)
    bm.free()
    o.data.update()


def tri_count(o):
    o.data.calc_loop_triangles()
    return len(o.data.loop_triangles)


# ---------------------------------------------------------------- body-building helpers
def chain(a, b, ra, rb, step=0.03, **kw):
    a, b = Vector(a), Vector(b)
    n = max(2, int((b - a).length / step) + 1)
    out = []
    for i in range(n):
        t = i / (n - 1)
        d = dict(co=tuple(a.lerp(b, t)), r=ra + (rb - ra) * t)
        d.update(kw)
        out.append(d)
    return out


def catmull(pts, samples_per=10):
    P = [Vector(p) for p in pts]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for j in range(samples_per):
            t = j / samples_per
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-2].copy())
    return out


def delete_faces(o, pred):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    dead = [f for f in bm.faces if pred(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    # remove tiny islands / loose
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    o.data.update()


def smooth_boundary(o, iters=6, factor=0.6):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bv = [v for v in bm.verts if v.is_boundary]
    for _ in range(iters):
        bmesh.ops.smooth_vert(bm, verts=bv, factor=factor, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(o.data)
    bm.free()
    o.data.update()


def displace(o, fn):
    """fn(co, n) -> scalar displacement along normal"""
    me = o.data
    me.update()
    for v in me.vertices:
        d = fn(v.co, v.normal)
        if d:
            v.co += v.normal * d
    me.update()


def ribbon(name, target, guide_pts, proj_dir, width, c, mats, offset=0.002, thick=0.006, samples=6, width_fn=None, bevel=True, facing=None):
    """Strip that hugs target's surface. guide_pts: rough 3D path (outside the surface); rays cast along proj_dir."""
    bpy.context.view_layer.update()
    pts = catmull(guide_pts, samples) if len(guide_pts) > 2 else [Vector(guide_pts[0]).lerp(Vector(guide_pts[1]), i / (samples * 2)) for i in range(samples * 2 + 1)]
    pd = Vector(proj_dir).normalized()
    inv = target.matrix_world.inverted()
    hits = []
    for p in pts:
        o_ = inv @ (p - pd * 0.6)
        ok, loc, nrm, _ = target.ray_cast(o_, inv.to_3x3() @ pd)
        if ok:
            wn = (target.matrix_world.to_3x3() @ nrm).normalized()
            if facing is not None and wn.dot(Vector(facing)) < 0.3:
                continue
            hits.append((target.matrix_world @ loc, wn))
    if len(hits) < 2:
        return None
    bm = bmesh.new()
    rows = []
    for i, (p, n) in enumerate(hits):
        t = (hits[min(i + 1, len(hits) - 1)][0] - hits[max(i - 1, 0)][0]).normalized()
        side = n.cross(t).normalized()
        w = width * (width_fn(i / (len(hits) - 1)) if width_fn else 1.0)
        base = p + n * offset
        rows.append((bm.verts.new(base - side * w / 2), bm.verts.new(base + side * w / 2)))
    for i in range(len(rows) - 1):
        bm.faces.new((rows[i][0], rows[i + 1][0], rows[i + 1][1], rows[i][1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, mesh_from_bm(name, bm), c)
    set_mats(o, mats)
    mod(o, 'SOLIDIFY', thickness=thick, offset=1.0, use_even_offset=True)
    if bevel:
        mod(o, 'BEVEL', width=min(thick * 0.45, 0.003), segments=2, limit_method='ANGLE')
    apply_mods(o)
    o.data.shade_smooth()
    # orient normals outward of the strip: fine for display
    return o


def curve_mesh(name, pts, c, mats, bevel=0.003, res=2, radius_fn=None, closed=False, cyclic_profile=None):
    cu = bpy.data.curves.new(name + "_c", 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = bevel
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
        if radius_fn:
            sp.points[i].radius = radius_fn(i / max(1, len(pts) - 1))
    sp.use_cyclic_u = closed
    tmp = bpy.data.objects.new(name + "_tmp", cu)
    c.objects.link(tmp)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp, do_unlink=True)
    bpy.data.curves.remove(cu)
    o = new_obj(name, me, c)
    set_mats(o, mats)
    o.data.shade_smooth()
    return o


def web_variant(o):
    """Copy of a mesh for the web build (heavier mesh-fur clumps); hidden from renders."""
    c = coll("AR_WebFur", coll("AR_Character"))
    c.hide_render = True
    c.hide_viewport = True
    cp = new_obj(o.name + "_WebFur", o.data.copy(), c)
    cp.matrix_world = o.matrix_world.copy()
    return cp

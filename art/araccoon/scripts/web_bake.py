"""Texture bake for the web asset.
Fur: strand curves -> temporary ribbon meshes -> Cycles selected-to-active bake (colour + normal) onto
lightweight fur meshes that carry the fur's volume.  Hoodie / pants: high-res vertex colours + folds baked
onto decimated copies.  Results go to AR_WebBaked; textures to art/araccoon/textures/."""
import bpy, bmesh, math, os
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree

S = scene()
TEX = ROOT + "/textures"
os.makedirs(TEX, exist_ok=True)
C_SRC = coll("AR_BakeSrc")
clear_coll(C_SRC)
bpy.data.collections["AR_Character"].hide_render = False
C_OUT = coll("AR_WebBaked", coll("AR_Character"))
clear_coll(C_OUT)
C_OUT.hide_render = False  # must be renderable while baking; hidden again at the end
RNG = np.random.default_rng(11)


def nrmz(v):
    return v / np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-9)


def select_only(objs, active):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active


# ------------------------------------------------------------------ fur shader for ribbons (mirrors AR_FurStrands)
def ribbon_mat():
    m = bpy.data.materials.get("AR_FurRibbonBake") or bpy.data.materials.new("AR_FurRibbonBake")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    L = nt.links
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')

    def attr(name):
        a = nt.nodes.new('ShaderNodeAttribute')
        a.attribute_type = 'GEOMETRY'
        a.attribute_name = name
        return a

    col, icp, tip, rnd = attr('Col'), attr('icp'), attr('Tip'), attr('rnd')

    def mr(src, a, b, c, d, smooth=True):
        n = nt.nodes.new('ShaderNodeMapRange')
        n.interpolation_type = 'SMOOTHSTEP' if smooth else 'LINEAR'
        for k, v in (('From Min', a), ('From Max', b), ('To Min', c), ('To Max', d)):
            n.inputs[k].default_value = v
        L.new(src, n.inputs['Value'])
        return n.outputs['Result']

    def mix(fac, A, B, blend='MIX', fac_val=1.0):
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

    I = icp.outputs['Fac']
    c1 = mix(None, col.outputs['Color'], mr(I, 0, 1, 0.5, 1.12), 'MULTIPLY')
    c2 = mix(mul(mul(mul(mr(I, 0.35, 0.55, 0, 1), mr(I, 0.68, 0.8, 1, 0)), tip.outputs['Fac']), rnd.outputs['Fac']), c1, (0.3, 0.27, 0.23))
    c3 = mix(mul(mr(I, 0.72, 0.9, 0, 1), tip.outputs['Fac']), c2, (0.008, 0.006, 0.005))
    c4 = mix(None, c3, mr(rnd.outputs['Fac'], 0, 1, 0.93, 1.07, smooth=False), 'MULTIPLY')
    L.new(c4, p.inputs['Base Color'])
    L.new(p.outputs[0], out.inputs[0])
    return m


M_RIB = ribbon_mat()


def ribbons(curves_obj, base_obj, width_mul=2.6):
    """Flat camera-independent ribbons facing outward from the base surface. Returns (ribbon obj, roots, heights)."""
    cv = curves_obj.data
    n = len(cv.curves)
    pts = np.empty(len(cv.points) * 3, np.float32)
    cv.position_data.foreach_get('vector', pts)
    K = len(cv.points) // n
    pts = pts.reshape(n, K, 3)
    col = np.empty(n * 4, np.float32)
    cv.attributes['Col'].data.foreach_get('color', col)
    col = col.reshape(n, 4)
    tip = np.empty(n, np.float32)
    cv.attributes['Tip'].data.foreach_get('value', tip)
    rad = np.empty(n * K, np.float32)
    cv.attributes['radius'].data.foreach_get('value', rad)
    rad = rad.reshape(n, K)
    roots = pts[:, 0]
    nr = np.empty((n, 3), np.float32)
    for i in range(n):
        ok, loc, nn, _ = base_obj.closest_point_on_mesh(Vector(roots[i]))
        nr[i] = nn if ok else (0, 0, 1)
    tang = np.zeros_like(pts)
    tang[:, :-1] = pts[:, 1:] - pts[:, :-1]
    tang[:, -1] = tang[:, -2]
    tang = nrmz(tang.reshape(-1, 3)).reshape(n, K, 3)
    side = np.cross(np.repeat(nr[:, None, :], K, 1), tang)
    side = nrmz(side.reshape(-1, 3)).reshape(n, K, 3)
    w = (rad * width_mul)[:, :, None]
    va = pts - side * w
    vb = pts + side * w
    verts = np.stack([va, vb], 2).reshape(-1, 3)            # per strand: a0 b0 a1 b1 ...
    base = (np.arange(n) * K * 2)[:, None]
    k = np.arange(K - 1)[None, :]
    a0, b0 = base + 2 * k, base + 2 * k + 1
    a1, b1 = a0 + 2, b0 + 2
    quads = np.stack([a0, a1, b1, b0], 2).reshape(-1, 4)    # winding -> normal along +surface normal
    me = bpy.data.meshes.new(curves_obj.name + "_rib")
    me.vertices.add(len(verts))
    me.vertices.foreach_set('co', verts.ravel())
    me.loops.add(quads.size)
    me.loops.foreach_set('vertex_index', quads.ravel().astype(np.int32))
    me.polygons.add(len(quads))
    me.polygons.foreach_set('loop_start', (np.arange(len(quads)) * 4).astype(np.int32))
    me.update(calc_edges=True)
    per_pt = lambda a: np.repeat(np.repeat(a, K, 0), 2, 0) if a.ndim == 1 else np.repeat(np.repeat(a, K, 0), 2, 0)
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set('color', per_pt(col).ravel())
    icp = np.repeat(np.tile(np.linspace(0, 1, K, dtype=np.float32), n), 2)
    for name, arr in (('icp', icp), ('Tip', per_pt(tip)), ('rnd', per_pt(RNG.random(n).astype(np.float32)))):
        at = me.attributes.new(name, 'FLOAT', 'POINT')
        at.data.foreach_set('value', arr)
    o = new_obj(curves_obj.name + "_RIB", me, C_SRC)
    o.data.materials.append(M_RIB)
    heights = np.einsum('ij,ij->i', pts[:, -1] - roots, nr)
    return o, roots, heights


# ------------------------------------------------------------------ build the web fur mesh (volume of the fur)
def puffed_copy(base, roots, heights, keep=0.55, floor=0.008, budget=8000, tuft_fn=None):
    me = base.data.copy()
    o = new_obj("WEBTMP_" + base.name, me, C_OUT)
    o.matrix_world = base.matrix_world.copy()
    kd = KDTree(len(roots))
    for i, r in enumerate(roots):
        kd.insert(Vector(r), i)
    kd.balance()
    nv = len(me.vertices)
    disp = np.zeros(nv, np.float32)
    for v in me.vertices:
        hs = [heights[i] for _, i, _ in kd.find_n(v.co, 6)]
        disp[v.index] = keep * max(0.0, float(np.mean(hs)) - floor)
    # smooth the displacement field over the mesh
    ed = np.empty(len(me.edges) * 2, np.int32)
    me.edges.foreach_get('vertices', ed)
    ed = ed.reshape(-1, 2)
    deg = np.bincount(ed.ravel(), minlength=nv).astype(np.float32)
    for _ in range(6):
        acc = np.zeros(nv, np.float32)
        np.add.at(acc, ed[:, 0], disp[ed[:, 1]])
        np.add.at(acc, ed[:, 1], disp[ed[:, 0]])
        disp = 0.5 * disp + 0.5 * acc / np.maximum(deg, 1)
    for v in me.vertices:
        v.co += v.normal * float(disp[v.index])
    me.update()
    if tuft_fn:
        tuft_fn(o)
    tris = tri_count(o)
    if tris > budget:
        d = o.modifiers.new("Dec", 'DECIMATE')
        d.ratio = budget / tris
        d.use_collapse_triangulate = True
        apply_mods(o)
    o.data.shade_smooth()
    return o


def tail_tufts(o):
    path = catmull(TAIL_PTS, 12)

    def tdir(co, n):
        best = min(range(len(path)), key=lambda i: (path[i] - co).length_squared)
        return (path[min(best + 2, len(path) - 1)] - path[max(best - 2, 0)]).normalized() * 0.9
    moved = tufts(o, lambda co, n: 1.0, 260, 0.045, 0.07, tdir, seed=41, sharp=1.2, normal_mix=0.25, jitter=0.2)
    smooth_verts(o, moved, 0.6, 6)


def head_tufts(o):
    def cheek(co, n):
        return smoothstep(0.17, 0.21, abs(co.x)) * smoothstep(1.1, 1.15, co.z) * smoothstep(1.3, 1.24, co.z)
    moved = tufts(o, cheek, 90, 0.022, 0.04, lambda co, n: Vector((math.copysign(0.8, co.x), 0.3, -0.7)), seed=43, sharp=1.3)
    smooth_verts(o, moved, 0.5, 4)


fur_parts = [("AR_Head", "AR_Fur_Head", 9500, head_tufts), ("AR_Tail", "AR_Fur_Tail", 8500, tail_tufts),
             ("AR_Forearm_L", "AR_Fur_Forearm_L", 900, None), ("AR_Forearm_R", "AR_Fur_Forearm_R", 900, None)]
bake_sources = []
web_parts = []
for base_name, fur_name, budget, tf in fur_parts:
    base = bpy.data.objects[base_name]
    rib, roots, heights = ribbons(bpy.data.objects[fur_name], base)
    bake_sources += [rib, base]
    web_parts.append(puffed_copy(base, roots, heights, budget=budget, tuft_fn=tf))

fur_web = web_parts[0]
join_into(fur_web, web_parts[1:])
fur_web.name = "BAKED_Fur"
fur_web.data.name = "BAKED_Fur"


def unwrap(o, margin=0.004, relax=25):
    """Unwrap a heavily smoothed twin (same topology) so bumpy fur gives large islands, then copy the UVs back."""
    for ca in list(o.data.color_attributes):
        o.data.color_attributes.remove(ca)
    for uv in list(o.data.uv_layers):
        o.data.uv_layers.remove(uv)
    o.data.uv_layers.new(name="UVMap")
    twin = new_obj(o.name + "_uvtwin", o.data.copy(), C_OUT)
    twin.matrix_world = o.matrix_world.copy()
    if relax:
        sm = twin.modifiers.new("S", 'SMOOTH')
        sm.factor = 1.0
        sm.iterations = relax
        apply_mods(twin)
    select_only([twin], twin)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(72), island_margin=margin, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    uv = np.empty(len(twin.data.loops) * 2, np.float32)
    twin.data.uv_layers[0].data.foreach_get('uv', uv)
    o.data.uv_layers[0].data.foreach_set('uv', uv)
    me = twin.data
    bpy.data.objects.remove(twin, do_unlink=True)
    bpy.data.meshes.remove(me)


def web_material(name, size, rough, spec=0.2):
    cimg = bpy.data.images.get(name + "_color") or bpy.data.images.new(name + "_color", size, size, alpha=False)
    nimg = bpy.data.images.get(name + "_normal") or bpy.data.images.new(name + "_normal", size, size, alpha=False)
    nimg.colorspace_settings.name = 'Non-Color'
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Roughness'].default_value = rough
    p.inputs['Specular IOR Level'].default_value = spec
    ct = nt.nodes.new('ShaderNodeTexImage')
    ct.image = cimg
    ct.name = "COLOR"
    nm = nt.nodes.new('ShaderNodeTexImage')
    nm.image = nimg
    nm.name = "NORMAL"
    nmap = nt.nodes.new('ShaderNodeNormalMap')
    nmap.inputs['Strength'].default_value = 0.7
    nt.links.new(ct.outputs['Color'], p.inputs['Base Color'])
    nt.links.new(nm.outputs['Color'], nmap.inputs['Color'])
    nt.links.new(nmap.outputs['Normal'], p.inputs['Normal'])
    nt.links.new(p.outputs[0], out.inputs[0])
    return m, cimg, nimg


def bake(target, sources, mat, cimg, nimg, cage, maxd, samples=8):
    target.data.materials.clear()
    target.data.materials.append(mat)
    S.render.engine = 'CYCLES'
    S.cycles.device = 'CPU'
    S.cycles.samples = samples
    bk = S.render.bake
    bk.use_selected_to_active = True
    bk.cage_extrusion = cage
    bk.max_ray_distance = maxd
    bk.margin = 12
    bk.margin_type = 'EXTEND'
    bk.target = 'IMAGE_TEXTURES'
    nt = mat.node_tree
    select_only(sources + [target], target)
    nt.nodes.active = nt.nodes["COLOR"]
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True,
                        cage_extrusion=cage, max_ray_distance=maxd, margin=12)
    nt.nodes.active = nt.nodes["NORMAL"]
    bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', use_selected_to_active=True,
                        cage_extrusion=cage, max_ray_distance=maxd, margin=12)
    for img, suffix in ((cimg, "color"), (nimg, "normal")):
        img.filepath_raw = "%s/%s.png" % (TEX, img.name)
        img.file_format = 'PNG'
        img.save()
    S.render.engine = 'BLENDER_EEVEE'


unwrap(fur_web, 0.003)
m_wfur, ci, ni = web_material("AR_WebFur", 2048, 0.82, 0.15)
bake(fur_web, bake_sources, m_wfur, ci, ni, cage=0.07, maxd=0.16)

# ------------------------------------------------------------------ hoodie + pants
baked = {"AR_Head": "BAKED_Fur", "AR_Tail": "BAKED_Fur", "AR_Forearm_L": "BAKED_Fur", "AR_Forearm_R": "BAKED_Fur"}
for src_name, budget, rough in (("AR_Hoodie", 9000, 0.9), ("AR_Pants", 6000, 0.9)):
    src = bpy.data.objects[src_name]
    o = new_obj("BAKED_" + src_name.replace("AR_", ""), src.data.copy(), C_OUT)
    o.matrix_world = src.matrix_world.copy()
    d = o.modifiers.new("Dec", 'DECIMATE')
    d.ratio = budget / tri_count(o)
    d.use_collapse_triangulate = True
    apply_mods(o)
    o.data.shade_smooth()
    unwrap(o, 0.006)
    m, ci, ni = web_material("AR_Web" + src_name.replace("AR_", ""), 1024, rough, 0.15)
    bake(o, [src], m, ci, ni, cage=0.012, maxd=0.03, samples=4)
    baked[src_name] = o.name

S["ar_baked_map"] = baked
C_OUT.hide_render = True

# drop the heavy ribbon sources (only needed for baking)
for o in list(C_SRC.objects):
    me = o.data
    bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.meshes.remove(me)
result = {"fur_web_tris": tri_count(fur_web), "baked": baked,
          "textures": sorted(f for f in os.listdir(TEX))}

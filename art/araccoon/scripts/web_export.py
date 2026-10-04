"""Build an optimized web copy of the character, export GLB, reimport and verify.
The detailed source collections are left untouched."""
import bpy, bmesh, os, math
from mathutils import Vector

S = scene()
SRC = bpy.data.collections["AR_Character"]
C_WEB = coll("AR_Web_Build")
clear_coll(C_WEB)

# target triangle budgets for heavy organic parts (others are kept or lightly reduced)
BUDGET = {"AR_Head": 14000, "AR_Tail": 12000, "AR_Hoodie": 9000, "AR_Pants": 6000, "AR_Shirt": 1500,
          "AR_ShoeUpper": 2500, "AR_Forearm": 1500}
DEFAULT_MAX = 1200


def budget_for(name):
    for k, v in BUDGET.items():
        if name.startswith(k):
            return v
    return DEFAULT_MAX


def all_meshes(c):
    out = list(o for o in c.objects if o.type == 'MESH')
    for ch in c.children:
        out += all_meshes(ch)
    return out


skip = {"AR_WebFur", "AR_FurStrands", "AR_WebBaked"}
baked_map = dict(S.get("ar_baked_map", {}))
src_objs = []
for c in [SRC] + list(SRC.children_recursive):
    if c.name in skip:
        continue
    for o in c.objects:
        if o.type != 'MESH':
            continue
        if o.name in baked_map:
            b = bpy.data.objects[baked_map[o.name]]
            if b not in src_objs:
                src_objs.append(b)
            continue
        w = bpy.data.objects.get(o.name + "_WebFur")
        src_objs.append(w if w else o)
copies = []
for o in src_objs:
    me = o.data.copy()
    me.transform(o.matrix_world)
    cp = bpy.data.objects.new("WEB_" + o.name.replace("_WebFur", "").replace("BAKED_", ""), me)
    C_WEB.objects.link(cp)
    # strip any particle systems / modifiers (fur strands are presentation-only)
    cp.modifiers.clear()
    tris = tri_count(cp)
    tgt = budget_for(o.name.replace("_WebFur", ""))
    if tris > tgt and not o.name.startswith("BAKED_"):
        d = cp.modifiers.new("Decimate", 'DECIMATE')
        d.decimate_type = 'COLLAPSE'
        d.ratio = tgt / tris
        d.use_collapse_triangulate = True
        apply_mods(cp)
    copies.append(cp)

# merge by material (one draw call per material)
groups = {}
for cp in copies:
    key = tuple(m.name for m in cp.data.materials)
    groups.setdefault(key, []).append(cp)
merged = []
for key, objs in groups.items():
    base = objs[0]
    nm = "AR_" + "_".join(k.replace("AR_", "") for k in key)[:48]
    if len(objs) > 1:
        join_into(base, objs[1:])
    base.name = nm
    base.data.name = nm
    # make sure every mesh has the colour attribute only if its material uses it
    uses_vc = any(n.type == 'VERTEX_COLOR' for m in base.data.materials for n in m.node_tree.nodes)
    if not uses_vc:
        for ca in list(base.data.color_attributes):
            base.data.color_attributes.remove(ca)
    base.data.shade_smooth()
    merged.append(base)

root = bpy.data.objects.new("Araccoon", None)
C_WEB.objects.link(root)
for m in merged:
    m.parent = root

# ---- export
for o in bpy.context.view_layer.objects:
    o.select_set(False)
for o in [root] + merged:
    o.select_set(True)
bpy.context.view_layer.objects.active = root
path = ROOT + "/araccoon_web.glb"
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                          export_yup=True, export_normals=True, export_texcoords=True,
                          export_materials='EXPORT', export_cameras=False, export_lights=False,
                          export_image_format='JPEG', export_jpeg_quality=90,
                          export_extras=False, export_animations=False)
size_kb = os.path.getsize(path) / 1024

# ---- reimport into a separate collection and verify
C_CHECK = coll("AR_Web_Reimport")
clear_coll(C_CHECK)
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=path)
new = [o for o in bpy.data.objects if o not in before]
for o in new:
    for c in list(o.users_collection):
        c.objects.unlink(o)
    C_CHECK.objects.link(o)
imp_meshes = [o for o in new if o.type == 'MESH']
imp_tris = sum(tri_count(o) for o in imp_meshes)
mats = sorted({m.name for o in imp_meshes for m in o.data.materials if m})
vcols = {o.name: [ca.name for ca in o.data.color_attributes] for o in imp_meshes}
bbox_min = [min((o.matrix_world @ Vector(c))[i] for o in imp_meshes for c in o.bound_box) for i in range(3)]
bbox_max = [max((o.matrix_world @ Vector(c))[i] for o in imp_meshes for c in o.bound_box) for i in range(3)]
textures = sorted({(i.name, tuple(i.size)) for o in imp_meshes for m in o.data.materials if m and m.node_tree
                    for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image for i in [n.image]})

# keep the build + reimport collections out of the presentation renders
for c in (C_WEB, C_CHECK):
    c.hide_render = True
    lc = bpy.context.view_layer.layer_collection.children.get(c.name)
    if lc:
        lc.hide_viewport = True

result = {"glb": path, "size_kb": round(size_kb, 1), "web_meshes": len(merged),
          "web_tris": sum(tri_count(o) for o in merged), "reimport_meshes": len(imp_meshes),
          "reimport_tris": imp_tris, "materials": mats, "vcols": vcols, "textures": textures,
          "bbox_min": [round(v, 3) for v in bbox_min], "bbox_max": [round(v, 3) for v in bbox_max]}

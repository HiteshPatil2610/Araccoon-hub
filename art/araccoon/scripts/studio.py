"""Presentation studio: world, floor, light rig, cameras, render settings."""
import bpy, math
from mathutils import Vector

S = scene()
C_STUDIO = coll("AR_Studio")
clear_coll(C_STUDIO)

# ---- world
w = bpy.data.worlds.get("AR_World") or bpy.data.worlds.new("AR_World")
w.use_nodes = True
nt = w.node_tree
nt.nodes.clear()
bg = nt.nodes.new('ShaderNodeBackground')
bg.inputs['Color'].default_value = (*srgb('#0a0f26'), 1)
bg.inputs['Strength'].default_value = 1.0
out = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(bg.outputs[0], out.inputs[0])
S.world = w

# ---- floor (radial fade into the background)
fm = bpy.data.materials.get("AR_Floor") or bpy.data.materials.new("AR_Floor")
fm.use_nodes = True
n = fm.node_tree
n.nodes.clear()
o = n.nodes.new('ShaderNodeOutputMaterial')
p = n.nodes.new('ShaderNodeBsdfPrincipled')
p.inputs['Roughness'].default_value = 0.32
p.inputs['Specular IOR Level'].default_value = 0.35
tc = n.nodes.new('ShaderNodeTexCoord')
mp = n.nodes.new('ShaderNodeMapping')
mp.inputs['Scale'].default_value = (0.3, 0.3, 0.3)
gr = n.nodes.new('ShaderNodeTexGradient')
gr.gradient_type = 'SPHERICAL'
ramp = n.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = (*srgb('#080c20'), 1)
ramp.color_ramp.elements[1].color = (*srgb('#1a2150'), 1)
ramp.color_ramp.elements[1].position = 0.92
n.links.new(tc.outputs['Object'], mp.inputs['Vector'])
n.links.new(mp.outputs['Vector'], gr.inputs['Vector'])
n.links.new(gr.outputs['Fac'], ramp.inputs['Fac'])
n.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
n.links.new(p.outputs[0], o.inputs[0])

# ---- light rig (rotated per view so each render gets the same lighting + backdrop)
rig = bpy.data.objects.new("AR_LightRig", None)
C_STUDIO.objects.link(rig)

# cyclorama: floor sweeping up into a wall behind the character (seen from -Y)
prof = [(-6.0, 0.0), (2.2, 0.0)]
for i in range(1, 13):
    a = math.radians(90 * i / 12)
    prof.append((2.2 + math.sin(a) * 1.5, 1.5 - math.cos(a) * 1.5))
prof.append((3.7, 7.0))
bm = bmesh.new()
cols = []
for x in (-7.0, -3.5, 0.0, 3.5, 7.0):
    cols.append([bm.verts.new((x, y, z)) for y, z in prof])
for i in range(len(cols) - 1):
    for j in range(len(prof) - 1):
        bm.faces.new((cols[i][j], cols[i + 1][j], cols[i + 1][j + 1], cols[i][j + 1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
floor = new_obj("AR_Backdrop", mesh_from_bm("AR_Backdrop", bm), C_STUDIO)
for f in floor.data.polygons:
    f.use_smooth = True
if floor.data.polygons[0].normal.z < 0:
    floor.data.flip_normals()
floor.data.materials.append(fm)
# wall: unlit navy gradient (brighter near the floor) so lights never wash it out
wm = bpy.data.materials.get("AR_Wall") or bpy.data.materials.new("AR_Wall")
wm.use_nodes = True
n = wm.node_tree
n.nodes.clear()
wo = n.nodes.new('ShaderNodeOutputMaterial')
em = n.nodes.new('ShaderNodeEmission')
tc2 = n.nodes.new('ShaderNodeTexCoord')
sep = n.nodes.new('ShaderNodeSeparateXYZ')
rmp = n.nodes.new('ShaderNodeMapRange')
rmp.inputs['From Min'].default_value = 0.0
rmp.inputs['From Max'].default_value = 4.0
rmp.inputs['To Min'].default_value = 0.0
rmp.inputs['To Max'].default_value = 1.0
cr = n.nodes.new('ShaderNodeValToRGB')
cr.color_ramp.elements[0].color = (*srgb('#141c4a'), 1)
cr.color_ramp.elements[1].color = (*srgb('#05071a'), 1)
n.links.new(tc2.outputs['Object'], sep.inputs[0])
n.links.new(sep.outputs['Z'], rmp.inputs['Value'])
n.links.new(rmp.outputs['Result'], cr.inputs['Fac'])
n.links.new(cr.outputs['Color'], em.inputs['Color'])
em.inputs['Strength'].default_value = 1.0
n.links.new(em.outputs[0], wo.inputs[0])
floor.data.materials.append(wm)
for f in floor.data.polygons:
    c = sum((floor.data.vertices[i].co for i in f.vertices), Vector()) / len(f.vertices)
    f.material_index = 1 if c.z > 0.25 else 0
floor.parent = rig


def area(name, loc, color, power, size, target=(0, 0, 0.9), shape='DISK', spread=180):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.spread = math.radians(spread)
    ld.shape = shape
    ld.size = size
    ld.energy = power
    ld.color = color
    lo = bpy.data.objects.new(name, ld)
    C_STUDIO.objects.link(lo)
    lo.location = loc
    d = Vector(target) - Vector(loc)
    lo.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    lo.parent = rig
    return lo


area("AR_Key_Warm", (1.5, -2.6, 2.6), (1.0, 0.82, 0.66), 300, 1.0, (0, 0, 1.15), spread=38)
area("AR_Fill_Cool", (-2.4, -2.2, 1.3), (0.62, 0.7, 1.0), 80, 1.5, (0, 0, 0.9), spread=50)
area("AR_Rim_Purple", (-2.0, 2.1, 2.0), (0.62, 0.28, 1.0), 900, 1.2, (0, 0, 1.0))
area("AR_Rim_Cyan", (2.3, 1.8, 1.5), (0.2, 0.72, 1.0), 450, 1.2, (0, 0, 0.8))
area("AR_Top", (0, 0.4, 3.6), (0.75, 0.75, 1.0), 50, 2.5, (0, 0, 0), spread=45)

# ---- cameras
VIEWS = {"front34": -22.0, "side": -76.0, "rear": 165.0}  # azimuth in degrees (0 = front)
DIST = 4.0
AIM = Vector((0, 0.05, 0.82))


def cam(name, az):
    cd = bpy.data.cameras.new(name)
    cd.lens = 70
    cd.sensor_fit = 'AUTO'
    co = bpy.data.objects.new(name, cd)
    C_STUDIO.objects.link(co)
    a = math.radians(az)
    co.location = AIM + Vector((math.sin(a) * DIST, -math.cos(a) * DIST, 0.12))
    co.rotation_euler = (AIM - co.location).to_track_quat('-Z', 'Y').to_euler()
    return co


for k, az in VIEWS.items():
    cam("AR_Cam_" + k, az)
S.camera = bpy.data.objects["AR_Cam_front34"]

# ---- render settings
r = S.render
r.engine = 'BLENDER_EEVEE'
r.resolution_x = 1200
r.resolution_y = 1500
r.resolution_percentage = 100
r.film_transparent = False
S.view_settings.view_transform = 'AgX'
S.view_settings.exposure = -0.9
try:
    S.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass
ee = S.eevee
ee.taa_render_samples = 64
for attr, val in (("use_raytracing", True), ("use_shadows", True), ("shadow_ray_count", 2),
                  ("use_gtao", True), ("fast_gi_method", 'GLOBAL_ILLUMINATION')):
    try:
        setattr(ee, attr, val)
    except Exception:
        pass


def render_view(view, path, samples=None):
    S = scene()
    S.camera = bpy.data.objects["AR_Cam_" + view]
    bpy.data.objects["AR_LightRig"].rotation_euler = (0, 0, math.radians(VIEWS[view]))
    if samples:
        S.eevee.taa_render_samples = samples
    S.render.filepath = path
    bpy.ops.render.render(write_still=True, scene=S.name)
    return path

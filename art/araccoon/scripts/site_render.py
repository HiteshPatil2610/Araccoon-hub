"""Site key-art renders: crimson recolour + transparent cut-outs of the streetwear raccoon.

Run (does not save the .blend):
  blender -b araccoon_character.blend --python scripts/run.py -- steps=body_common,fur_deps,fur,site_render [VIEWLIST=hero,side] [PCT=100] [SAMPLES=64]
Writes RGBA PNGs to art/araccoon/renders/site_<view>.png; scripts/site_export.py trims them into public/art/*.webp.
"""
import bpy, math, colorsys
from mathutils import Vector

S = bpy.data.scenes["Araccoon"]
OUT = "E:/Personal-Projects/Araccoon-hub/art/araccoon/renders/site_%s.png"
CRIMSON_H = 355 / 360  # site accent #C8202F


def to_crimson(rgb, min_s=0.35, min_v=0.06):
    """Purple-family colours (hue 225-300°) become crimson; neutrals and blacks are untouched."""
    h, s, v = colorsys.rgb_to_hsv(*rgb)
    if 225 / 360 <= h <= 300 / 360 and s >= min_s and v >= min_v:
        return colorsys.hsv_to_rgb(CRIMSON_H, min(1.0, s * 1.05), v)
    return None


# ---- recolour materials
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    for nd in m.node_tree.nodes:
        if nd.type != 'BSDF_PRINCIPLED':
            continue
        for sock in ('Base Color', 'Emission Color'):
            inp = nd.inputs[sock]
            if not inp.is_linked:
                c = to_crimson(inp.default_value[:3])
                if c:
                    inp.default_value = (*c, 1)
# the glow is emissive purple at strength 9: keep it hot, push it fully into red
g = bpy.data.materials["AR_PurpleGlow"].node_tree.nodes["Principled BSDF"]
g.inputs['Base Color'].default_value = (1.0, 0.04, 0.07, 1)
g.inputs['Emission Color'].default_value = (1.0, 0.05, 0.08, 1)

# ---- recolour vertex-painted stripes / emblems (hoodie, pants, sneakers)
changed = 0
for o in S.objects:
    if o.type != 'MESH':
        continue
    for attr in o.data.color_attributes:
        for d in attr.data:
            c = to_crimson(d.color[:3])
            if c:
                d.color = (*c, d.color[3])
                changed += 1

# ---- lights: crimson rim replaces purple, neutral rim replaces cyan, fill goes neutral
L = bpy.data.lights
L["AR_Rim_Purple"].color = (1.0, 0.1, 0.13)
L["AR_Rim_Purple"].energy = 1100
L["AR_Rim_Cyan"].color = (1.0, 0.9, 0.86)
L["AR_Rim_Cyan"].energy = 260
L["AR_Fill_Cool"].color = (0.86, 0.86, 0.92)

# ---- transparent background, no backdrop
bpy.data.objects["AR_Backdrop"].hide_render = True
S.render.film_transparent = True
S.render.image_settings.file_format = 'PNG'
S.render.image_settings.color_mode = 'RGBA'

# ---- framing: bounds of the character
lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
for o in S.objects:
    if o.type == 'MESH' and not o.hide_render and o.name.startswith('AR_') and o.name != 'AR_Backdrop':
        for corner in o.bound_box:
            w = o.matrix_world @ Vector(corner)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
TOP = hi.z
HEIGHT = hi.z - lo.z

# view: (azimuth deg, bottom cut as a fraction of height, resolution)
VIEWS = {
    "hero": (-12, 0.36, (1100, 1300)),   # front, thigh-up: stands in front of the hero title
    "side": (-76, 0.0, (1000, 1300)),    # profile, full body: walks along the picks section seam
    "turn": (28, 0.48, (1100, 1100)),    # three-quarter from the other side, waist-up: beside the find card
    "rear": (165, 0.0, (1000, 1300)),    # back view, full body: walks off at the end of the page
}
pick = [v for v in str(globals().get("VIEWLIST", ",".join(VIEWS))).split(",") if v]
PCT = int(globals().get("PCT", 100))
SAMPLES = int(globals().get("SAMPLES", 64))

cd = bpy.data.cameras.new("AR_SiteCam")
cd.type = 'ORTHO'          # exact framing: ortho_scale is the visible height (sensor_fit VERTICAL)
cd.sensor_fit = 'VERTICAL'
cd.lens = 85
cd.sensor_height = 24
cd.clip_end = 100
cam = bpy.data.objects.new("AR_SiteCam", cd)
S.collection.objects.link(cam)
S.camera = cam
fov_v = 2 * math.atan(cd.sensor_height / 2 / cd.lens)

out = []
for name in pick:
    az, cut, (rx, ry) = VIEWS[name]
    zcut = lo.z + HEIGHT * cut
    span = (TOP - zcut) * 1.06              # small headroom; the bottom edge lands exactly on the cut
    aim_z = zcut + span / 2
    dist = 6.0
    cd.ortho_scale = span
    a = math.radians(az)
    cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
    cam.location = Vector((cx + math.sin(a) * dist, cy - math.cos(a) * dist, aim_z))
    cam.rotation_euler = (Vector((cx, cy, aim_z)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.data.objects["AR_LightRig"].rotation_euler = (0, 0, a)
    # width from the character's bounds as seen from this camera, so the tail and shoulders never clip
    right = cam.rotation_euler.to_matrix() @ Vector((1, 0, 0))
    ctr = Vector((cx, cy, aim_z))
    corners = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (zcut, hi.z)]
    half_w = max(abs((c - ctr).dot(right)) for c in corners) * 1.04
    rx = int(round(ry * (2 * half_w) / span / 2)) * 2
    S.render.resolution_x, S.render.resolution_y = rx, ry
    S.render.resolution_percentage = PCT
    S.eevee.taa_render_samples = SAMPLES
    S.render.filepath = OUT % name
    bpy.ops.render.render(write_still=True, scene=S.name)
    out.append([S.render.filepath, round(zcut, 3), round(aim_z, 3), round(dist, 3), [round(v, 3) for v in cam.location]])

result = {"recoloured_vertex_colours": changed, "lo": [round(v, 3) for v in lo], "hi": [round(v, 3) for v in hi], "fov_deg": round(math.degrees(fov_v), 2), "imgs": out}

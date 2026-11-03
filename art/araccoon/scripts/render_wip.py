import bpy, math
import os as _os
try:
    # Folder art/araccoon, wherever the repo lives (ARACCOON_ART_DIR overrides).
    ART = _os.environ.get("ARACCOON_ART_DIR") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
except NameError:  # pasted into Blender's console: run from the repo root
    ART = _os.environ.get("ARACCOON_ART_DIR") or _os.path.abspath(_os.path.join("art", "araccoon"))
ART = ART.replace(_os.sep, "/")
from mathutils import Vector
S = bpy.data.scenes["Araccoon"]


def closeup(name, az, dist, aim, lens=70):
    cd = bpy.data.cameras.get(name) or bpy.data.cameras.new(name)
    cd.lens = lens
    co = bpy.data.objects.get(name) or bpy.data.objects.new(name, cd)
    if co.name not in S.collection.objects:
        S.collection.objects.link(co)
    a = math.radians(az)
    A = Vector(aim)
    co.location = A + Vector((math.sin(a) * dist, -math.cos(a) * dist, 0.05))
    co.rotation_euler = (A - co.location).to_track_quat('-Z', 'Y').to_euler()
    return co


def wip(shots, pct=40, samples=16):
    out = []
    for nm, az, dist, aim in shots:
        S.camera = closeup("AR_TMP_" + nm, az, dist, aim)
        bpy.data.objects["AR_LightRig"].rotation_euler = (0, 0, math.radians(az))
        S.eevee.taa_render_samples = samples
        S.render.resolution_percentage = pct
        p = ART + "/renders/wip_%s.png" % nm
        S.render.filepath = p
        bpy.ops.render.render(write_still=True, scene=S.name)
        out.append(p)
    return out

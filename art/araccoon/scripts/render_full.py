import bpy, math
import os as _os
try:
    # Folder art/araccoon, wherever the repo lives (ARACCOON_ART_DIR overrides).
    ART = _os.environ.get("ARACCOON_ART_DIR") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
except NameError:  # pasted into Blender's console: run from the repo root
    ART = _os.environ.get("ARACCOON_ART_DIR") or _os.path.abspath(_os.path.join("art", "araccoon"))
ART = ART.replace(_os.sep, "/")
S = bpy.data.scenes["Araccoon"]
VIEWS = {"front34": -22.0, "side": -76.0, "rear": 165.0}
PCT = globals().get("PCT", 40)
SAMPLES = globals().get("SAMPLES", 16)
PREFIX = globals().get("PREFIX", "wip_full_")
out = []
for v, az in VIEWS.items():
    S.camera = bpy.data.objects["AR_Cam_" + v]
    bpy.data.objects["AR_LightRig"].rotation_euler = (0, 0, math.radians(az))
    S.eevee.taa_render_samples = SAMPLES
    S.render.resolution_percentage = PCT
    S.render.filepath = ART + "/renders/%s%s.png" % (PREFIX, v)
    bpy.ops.render.render(write_still=True, scene=S.name)
    out.append(S.render.filepath)
result = {"imgs": out}

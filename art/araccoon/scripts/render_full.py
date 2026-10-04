import bpy, math
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
    S.render.filepath = "E:/Personal-Projects/Araccoon-hub/art/araccoon/renders/%s%s.png" % (PREFIX, v)
    bpy.ops.render.render(write_still=True, scene=S.name)
    out.append(S.render.filepath)
result = {"imgs": out}

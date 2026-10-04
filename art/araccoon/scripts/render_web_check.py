import bpy, math
S = bpy.data.scenes["Araccoon"]
vl = S.view_layers[0]
def lc(name, node=None):
    node = node or vl.layer_collection
    for c in node.children:
        if c.name == name: return c
        r = lc(name, c)
        if r: return r
bpy.data.collections["AR_Character"].hide_render = True
rc = bpy.data.collections["AR_Web_Reimport"]
rc.hide_render = False
l = lc("AR_Web_Reimport"); l.hide_viewport = False; l.exclude = False
out = []
for v, az in (("front34", -22.0), ("rear", 165.0)):
    S.camera = bpy.data.objects["AR_Cam_" + v]
    bpy.data.objects["AR_LightRig"].rotation_euler = (0, 0, math.radians(az))
    S.eevee.taa_render_samples = 32
    S.render.resolution_percentage = 50
    S.render.filepath = "E:/Personal-Projects/Araccoon-hub/art/araccoon/renders/web_glb_check_%s.png" % v
    bpy.ops.render.render(write_still=True, scene=S.name)
    out.append(S.render.filepath)
# restore presentation visibility
bpy.data.collections["AR_Character"].hide_render = False
rc.hide_render = True
l.hide_viewport = True
result = {"imgs": out}

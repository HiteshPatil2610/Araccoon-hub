"""Read-only survey for the site cut-out renders: renderable objects, material colours, colour attributes, lights."""
import bpy, colorsys

S = bpy.data.scenes["Araccoon"]
rep = {"objects": [], "materials": [], "lights": [], "cams": []}
for o in S.objects:
    if o.type == 'LIGHT':
        rep["lights"].append([o.name, tuple(round(c, 2) for c in o.data.color), o.data.energy])
    elif o.type == 'CAMERA':
        rep["cams"].append([o.name, tuple(round(c, 2) for c in o.location), o.data.lens])
    elif not o.hide_render and o.type in ('MESH', 'CURVES', 'CURVE'):
        attrs = [a.name for a in getattr(o.data, 'color_attributes', [])]
        rep["objects"].append([o.name, o.type, [m.name for m in o.data.materials if m], attrs])
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    info = [m.name, m.users]
    for nd in m.node_tree.nodes:
        if nd.type == 'BSDF_PRINCIPLED':
            c = nd.inputs['Base Color'].default_value
            e = nd.inputs['Emission Color'].default_value
            info += ["base", round(colorsys.rgb_to_hsv(*c[:3])[0] * 360), "emit", round(colorsys.rgb_to_hsv(*e[:3])[0] * 360), round(nd.inputs['Emission Strength'].default_value, 1),
                     "linked", nd.inputs['Base Color'].is_linked]
        if nd.type in ('VERTEX_COLOR', 'ATTRIBUTE', 'TEX_IMAGE'):
            info.append(nd.type)
    rep["materials"].append(info)
result = rep

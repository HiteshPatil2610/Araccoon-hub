"""Presentation-only fur: particle hair layered over the mesh fur clumps (not exported to GLB)."""
import bpy
from mathutils import Vector

S = scene()


def strand_mat():
    m = bpy.data.materials.get("AR_FurStrands") or bpy.data.materials.new("AR_FurStrands")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    a = nt.nodes.new('ShaderNodeVertexColor')
    a.layer_name = 'Col'
    hi = nt.nodes.new('ShaderNodeHairInfo')
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    # slightly lighter tips, darker roots
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.55, 0.55, 0.55, 1)
    ramp.color_ramp.elements[1].color = (1.25, 1.22, 1.18, 1)
    nt.links.new(hi.outputs['Intercept'], ramp.inputs['Fac'])
    nt.links.new(a.outputs['Color'], mix.inputs[6])
    nt.links.new(ramp.outputs['Color'], mix.inputs[7])
    mix.inputs['Factor'].default_value = 1.0
    nt.links.new(mix.outputs[2], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.55
    p.inputs['Specular IOR Level'].default_value = 0.25
    nt.links.new(p.outputs[0], out.inputs[0])
    return m


M_STRAND = strand_mat()


def add_fur(obj, count, length, children, align=(0, 0, 0), clump=0.35, rough=0.006, root=0.0009, seed=0, name=None):
    for m in list(obj.modifiers):
        if m.type == 'PARTICLE_SYSTEM':
            obj.modifiers.remove(m)
    if M_STRAND.name not in [m.name for m in obj.data.materials]:
        obj.data.materials.append(M_STRAND)
    slot = [m.name for m in obj.data.materials].index(M_STRAND.name) + 1
    mod_ = obj.modifiers.new(name or "Fur", 'PARTICLE_SYSTEM')
    ps = mod_.particle_system
    st = ps.settings
    st.name = (name or "Fur") + "_" + obj.name
    st.type = 'HAIR'
    st.use_advanced_hair = True
    st.count = count
    st.hair_length = length
    st.emit_from = 'FACE'
    st.use_emit_random = True
    st.normal_factor = 1.0
    st.object_align_factor = Vector(align)
    st.material = slot
    st.child_type = 'INTERPOLATED'
    st.child_nbr = max(1, children // 2)
    st.rendered_child_count = children
    st.child_length = 0.85
    st.clump_factor = clump
    st.clump_shape = -0.2
    st.roughness_1 = rough
    st.roughness_1_size = 1.2
    st.roughness_endpoint = rough * 0.6
    st.root_radius = root
    st.tip_radius = 0.0
    st.radius_scale = 1.0
    st.use_close_tip = True
    st.display_step = 3
    st.render_step = 4
    ps.seed = seed
    return ps


add_fur(bpy.data.objects["AR_Head"], 7000, 0.022, 8, align=(0, 0.012, -0.004), seed=1)
add_fur(bpy.data.objects["AR_Tail"], 9000, 0.05, 10, align=(-0.01, 0.006, 0.018), clump=0.5, rough=0.01, root=0.0011, seed=2)
for side in ("L", "R"):
    add_fur(bpy.data.objects["AR_Forearm_" + side], 900, 0.015, 6, align=(0, 0, -0.01), seed=3)

S.render.hair_type = 'STRIP'
S.render.hair_subdiv = 1
result = {"fur": "ok"}

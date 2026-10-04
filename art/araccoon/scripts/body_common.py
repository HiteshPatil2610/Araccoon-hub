"""Body: pants, hoodie, shirt, forearms, shoes, tail, headphones, necklace, straps."""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Euler, noise

C_CHAR = coll("AR_Character")
C_BODY = coll("AR_Body", C_CHAR)
C_CLOTH = coll("AR_Clothing", C_CHAR)
C_ACC = coll("AR_Accessories", C_CHAR)

PURPLE = srgb('#6a2cd0')
PURPLE_D = srgb('#3d1a78')
BLACK = srgb('#141317')
FABRIC = srgb('#1b1820')
FABRIC_L = srgb('#2a2630')
CREAM = srgb('#e6dfd2')
FUR = srgb('#4a3d34')
FUR_D = srgb('#221b17')
FUR_L = srgb('#8a7d72')

m_fur = bpy.data.materials["AR_Fur"]
m_fabric = mat("AR_Fabric", '#1b1820', rough=0.92, vcol=True, sheen=0.2, spec=0.15)
m_pants = mat("AR_PantsFabric", '#1a181c', rough=0.9, vcol=True, sheen=0.2, spec=0.15)
m_strap = mat("AR_PurpleStrap", '#6a2cd0', rough=0.55, spec=0.4)
m_black_trim = mat("AR_BlackTrim", '#0f0e12', rough=0.7)
m_metal = mat("AR_Metal", '#b9b6c4', rough=0.25, metal=1.0)
m_leather = mat("AR_ShoeLeather", '#ffffff', rough=0.42, vcol=True, spec=0.5, coat=0.15)
m_rubber = mat("AR_Rubber", '#e4ddcf', rough=0.7, spec=0.4)
m_lace = mat("AR_Lace", '#e8e2d6', rough=0.8)
m_plastic = mat("AR_HeadphonePlastic", '#141218', rough=0.35, spec=0.5, coat=0.3)
m_cushion = mat("AR_Cushion", '#0b0a0d', rough=0.55)
m_glow = mat("AR_PurpleGlow", '#8a4dff', rough=0.3, emit='#8f55ff', emit_strength=9.0)
m_shirt = mat("AR_Shirt", '#121115', rough=0.95, sheen=0.2, spec=0.15)


def fabric_noise(p, scale=7.0, amp=0.006):
    return noise.noise(p * scale) * amp + noise.noise(p * scale * 2.7) * amp * 0.35




def zip_halfwidth(z):
    return 0.018 + 0.06 * smoothstep(0.62, 1.0, z)


SLEEVE = {}
POCKET = {}
for s in (-1, 1):
    SLEEVE[s] = (Vector((s * 0.215, 0.015, 0.93)), Vector((s * 0.305, 0.06, 0.72)), Vector((s * 0.29, -0.055, 0.585)))
    POCKET[s] = Vector((s * 0.2, -0.13, 0.5))
TAIL_PTS = [(-0.05, 0.13, 0.5), (-0.14, 0.27, 0.4), (-0.27, 0.36, 0.41), (-0.37, 0.38, 0.56), (-0.4, 0.34, 0.76), (-0.36, 0.27, 0.93), (-0.3, 0.24, 1.0)]

"""Definitions fur.py needs from head.py, without rebuilding the head (used by the site renders)."""
import math
from mathutils import Vector, Euler


def ear_frame(s):
    """Same as head.py: s = +1 (character left, +X) / -1 (right) -> ear base point and rotation matrix."""
    rot = Euler((math.radians(-12), math.radians(s * 38), 0), 'XYZ').to_matrix()
    base = Vector((s * 0.125, 0.035, 1.395))
    return base, rot

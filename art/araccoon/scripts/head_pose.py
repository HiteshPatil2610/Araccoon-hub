"""Scale the head up and give it a relaxed tilt (applied to mesh data so the export stays clean)."""
import bpy, math
from mathutils import Matrix, Vector

PIV = Vector((0, 0.03, 1.06))
M = (Matrix.Translation(PIV) @ Matrix.Rotation(math.radians(-6), 4, 'Y') @ Matrix.Rotation(math.radians(-3), 4, 'X')
     @ Matrix.Scale(1.13, 4) @ Matrix.Translation(-PIV))
objs = list(bpy.data.collections["AR_Head"].objects)
w = bpy.data.objects.get("AR_Head_WebFur")
if w:
    objs.append(w)
for o in objs:
    o.data.transform(o.matrix_world.inverted() @ M @ o.matrix_world)
    o.data.update()
scene()["ar_head_matrix"] = [M[i][j] for i in range(4) for j in range(4)]
result = {"posed": len(objs)}

import bpy
out = []
for cn in ("AR_Clothing", "AR_Accessories", "AR_Body", "AR_Head", "AR_Headphones"):
    for o in bpy.data.collections[cn].objects:
        if o.type != 'MESH':
            continue
        me = o.data
        best = (0, None)
        for e in me.edges:
            a, b = me.vertices[e.vertices[0]].co, me.vertices[e.vertices[1]].co
            l = (a - b).length
            if l > best[0]:
                best = (l, tuple(round(c, 3) for c in (o.matrix_world @ ((a + b) / 2))))
        out.append((o.name, round(best[0], 4), best[1]))
result = {"long_edges": sorted(out, key=lambda t: -t[1])[:15]}

import bpy
result = {o.name: [o.type, o.hide_render, o.hide_viewport, [c.name for c in o.users_collection], (len(o.data.curves) if o.type == 'CURVES' else None)]
          for o in bpy.data.objects if 'Fur' in o.name or o.type == 'CURVES' or o.name.endswith('_Web')}
result['_collections'] = {c.name: [c.hide_render, len(c.objects)] for c in bpy.data.collections}

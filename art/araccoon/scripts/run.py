"""Background driver:  blender -b [file.blend] --python run.py -- steps=a,b,c [save=path] [KEY=VAL ...]
Runs build scripts in one shared namespace and writes build_log.json next to the scripts."""
import bpy, sys, json, time, traceback, os

HERE = "E:/Personal-Projects/Araccoon-hub/art/araccoon/scripts/"
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
opts = dict(a.split('=', 1) for a in args)
steps = [s for s in opts.pop('steps', '').split(',') if s]
save = opts.pop('save', None)
fresh = opts.pop('fresh', '0') == '1'

if fresh:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = "Araccoon"

ns = {}
for k, v in opts.items():
    try:
        ns[k] = json.loads(v)
    except Exception:
        ns[k] = v

log = {"steps": []}
ok = True
for st in ['lib'] + steps:
    t = time.time()
    try:
        ns.pop('result', None)
        exec(compile(open(HERE + st + '.py').read(), st + '.py', 'exec'), ns)
        log["steps"].append({"step": st, "sec": round(time.time() - t, 1), "result": ns.get('result')})
    except Exception:
        log["steps"].append({"step": st, "sec": round(time.time() - t, 1), "err": traceback.format_exc()[-3000:]})
        ok = False
        break
if ok and save:
    bpy.ops.wm.save_as_mainfile(filepath=save, compress=True)
    log["saved"] = save
log["ok"] = ok
with open(HERE + "build_log.json", "w") as f:
    json.dump(log, f, indent=1, default=str)
print("AR_DONE", json.dumps(log, default=str)[:3000])

# Pictures of each friend's model from four sides, for the owner to choose from.
#   blender -b -P tools/blender/render-sheet.py -- <dir with name.glb> [names...]
# Writes <name>-front/side/back/three-quarter.png next to the models; sheet.py puts them on one page.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from svkit import reset, studio, shoot

argv = sys.argv[sys.argv.index('--') + 1:]
src = argv[0]; names = argv[1:] or [f[:-4] for f in sorted(os.listdir(src)) if f.endswith('.glb')]
for name in names:
    scene = reset()
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, name + '.glb'))
    objs = [o for o in scene.objects if o.type == 'MESH']
    # stand it on the ground, about 1.3 tall, centred
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    k = 1.3 / max(1e-6, hi.z - lo.z); c = (lo + hi) / 2
    for o in scene.objects:
        if o.parent is None: o.location = (o.location - Vector((c.x, c.y, lo.z))) * k; o.scale = o.scale * k
    cam = studio(scene)
    for view, az in (('front', 0), ('side', math.pi / 2), ('back', math.pi), ('three-quarter', -.6)):
        shoot(scene, cam, src, f'{name}-{view}', az, .9, 4.4, .66, (480, 680))

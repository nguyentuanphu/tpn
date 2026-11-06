# (v1.08g props) A quick look at the props' models: each models/world/<name>.glb drawn from the front three-quarters by
# Cycles on the processor (low samples) with its corner colours, for checking a design before it goes in the game.
# Run: blender -b -P tools/blender/props-look.py -- models/world <out folder> name [name ...]
import sys, os, math
import bpy
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, NAMES = argv[0], argv[1], argv[2:]
os.makedirs(OUT, exist_ok=True)
for n in NAMES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, n + '.glb'))
    obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in obs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    mid = (lo + hi) / 2; size = (hi - lo).length
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 12
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.5; sun.rotation_euler = (.8, .2, .6); sc.collection.objects.link(sun)
    sc.render.resolution_x = sc.render.resolution_y = 520; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (.93, .9, .84, 1); sc.world.node_tree.nodes['Background'].inputs[1].default_value = 1.2
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    d = size * 1.25; cam.location = mid + Vector((d * .55, -d * .75, d * .45))
    cam.rotation_euler = (mid - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 50
    sc.render.filepath = os.path.join(OUT, n + '.png'); bpy.ops.render.render(write_still=True)

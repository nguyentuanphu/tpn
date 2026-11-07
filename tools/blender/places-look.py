# (v1.08e places) A quick look at made models: each .glb in a folder rendered with Workbench (colours from the corners),
# three-quarter view from the front (+z in the game), for the status file and the before/after pages.
# (the .raw.glb that world-places.py writes before gltfpack packs it)
# (Cycles on the processor, few samples: no GPU in the container)
# Run: blender -b -P tools/blender/places-look.py -- <glb dir> <png dir> [name ...]
import sys, os, math
import bpy
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]; ONLY = set(argv[2:]); os.makedirs(OUT, exist_ok=True)
# (no GPU here: Cycles on the processor, few samples)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 12; sc.cycles.use_denoising = True
sc.render.resolution_x = 640; sc.render.resolution_y = 480; sc.render.film_transparent = False
sc.world = sc.world or bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.75, .85, .95, 1); sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .8
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.5; sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(30))
def colours(o):
    mt = bpy.data.materials.new('look'); mt.use_nodes = True; nt = mt.node_tree; bs = nt.nodes['Principled BSDF']
    at = nt.nodes.new('ShaderNodeVertexColor'); at.layer_name = o.data.color_attributes[0].name if o.data.color_attributes else ''
    nt.links.new(at.outputs['Color'], bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = .9
    o.data.materials.clear(); o.data.materials.append(mt)
for f in sorted(os.listdir(SRC)):
    if not f.endswith('.raw.glb'): continue   # (Blender cannot open the meshopt-packed copy: look at the raw one)
    name = f[:-8]
    if ONLY and name not in ONLY: continue
    for o in list(bpy.data.objects):
        if o is not sun: bpy.data.objects.remove(o, do_unlink=True)
    if sun.name not in sc.collection.objects: sc.collection.objects.link(sun)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, f))
    obs = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in obs: colours(o)
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in obs:
        for c in o.bound_box: w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    mid = (lo + hi) / 2; r = (hi - lo).length / 2
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    d = Vector((.55, -1, .45)).normalized() * r * 2.6   # Blender -y is the game's front (+z)
    cam.location = mid + d; cam.rotation_euler = (mid - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 40
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    print('LOOK', name, flush=True)

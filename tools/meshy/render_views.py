# (Meshy production, 7 Nov 2026) Measure and render a raw Meshy GLB for review and joint marking.
#   blender -b -P tools/meshy/render_views.py -- <raw.glb> <out dir>
# Prints STAT lines (objects, triangles, pictures, size) and renders front / three-quarter / side / back at 600x900 in
# the framing tools/meshy/fit_people.py uses for its joint points (orthographic, centred on the model's box, 900 px =
# 1.08 x the larger of its height and 1.5 x its width). Mark the joints on front.png.
import bpy, sys, os, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = a[0], a[1]
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
sc = bpy.context.scene
meshes = [o for o in sc.objects if o.type == 'MESH']
tris = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
print('STAT objects', len(meshes), 'armatures', sum(1 for o in sc.objects if o.type == 'ARMATURE'))
for o in meshes:
    print('STAT mesh', o.name, 'tris', tris(o), 'verts', len(o.data.vertices), 'uv', len(o.data.uv_layers), 'mats', [m.name for m in o.data.materials if m])
for im in bpy.data.images:
    print('STAT image', im.name, im.size[0], 'x', im.size[1])
bpy.context.view_layer.update()
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
size, center = hi - lo, (lo + hi) / 2
print('STAT bbox', tuple(round(v, 3) for v in size), 'total_tris', sum(tris(o) for o in meshes))
sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x, sc.render.resolution_y = 600, 900
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.91, 0.88, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .6
for rot, en in (((math.radians(50), 0, math.radians(30)), 3.0), ((math.radians(60), 0, math.radians(200)), 1.5)):
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = en; lo_ = bpy.data.objects.new('sun', l); lo_.rotation_euler = rot; sc.collection.objects.link(lo_)
cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; cam.ortho_scale = max(size.z, size.x * 900 / 600) * 1.08
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
for name, ang in (('front', 0), ('three-quarter', 35), ('side', 90), ('back', 180)):   # glTF front faces -Y in Blender
    co.location = (center.x + 10 * math.sin(math.radians(ang)), center.y - 10 * math.cos(math.radians(ang)), center.z)
    co.rotation_euler = (math.radians(90), 0, math.radians(ang))
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
print('STAT done')

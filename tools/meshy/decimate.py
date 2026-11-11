# (Meshy companions, 12 Nov 2026) A lighter copy of a Meshy model made here, without Meshy credits: the surface simplified
# to about N triangles, its picture kept. For an animal that has no Meshy "9000" remesh (Sparkle the firefly), so
# fit_animal.py can build its light model (creature-<kind>.glb) from it.
#   blender -b -P tools/meshy/decimate.py -- in.glb out.glb 9000
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
src, dst, want = a[0], a[1], int(a[2])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for m in ms: m.select_set(True)
bpy.context.view_layer.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
o = bpy.context.view_layer.objects.active
# (the import splits the surface at every picture seam: weld by place first, so simplifying does not open the seams;
# the picture coordinates stay per corner, so the seams keep their own picture)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.object.mode_set(mode='OBJECT')
o.data.calc_loop_triangles(); have = len(o.data.loop_triangles)
md = o.modifiers.new('dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = min(1.0, want / max(1, have)); md.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier='dec')
o.data.calc_loop_triangles(); print('DECIMATE', have, '->', len(o.data.loop_triangles), flush=True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', use_selection=False, export_animations=False)

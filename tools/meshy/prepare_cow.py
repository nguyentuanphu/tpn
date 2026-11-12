"""Local cow source repair, no API: blender -b -t 4 -P tools/meshy/prepare_cow.py -- RAW_30K_GLB OUT_DIR.
Keeps raw inputs intact. Welds UV-split positions, smooths normals, bakes surface AO into
base colour (so nostrils remain visible under the game's baked material), and makes a
14k local far source. Follow with fit_animal.py using animal_joints/cow.json.
"""
import sys
from pathlib import Path
import bpy
import numpy as np

src, out = sys.argv[sys.argv.index('--') + 1:]
out = Path(out).resolve(); out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(src).resolve()))
o = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=1e-5); bpy.ops.mesh.dissolve_degenerate(threshold=1e-7)
bpy.ops.object.mode_set(mode='OBJECT')
for face in o.data.polygons: face.use_smooth = True
if o.data.has_custom_normals: bpy.ops.mesh.customdata_custom_splitnormals_clear()
mat = o.data.materials[0]; nt = mat.node_tree
bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
base = bsdf.inputs['Base Color'].links[0].from_node
base.image.scale(1024, 1024)
pixels = np.array(base.image.pixels[:]).reshape(1024, 1024, 4)
ao = bpy.data.images.new('cow-surface-occlusion', 1024, 1024, alpha=False)
ao.colorspace_settings.name = 'Non-Color'
target = nt.nodes.new('ShaderNodeTexImage'); target.image = ao; nt.nodes.active = target
scene = bpy.context.scene; scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'; scene.cycles.samples = 16; scene.cycles.use_denoising = False
scene.render.bake.margin = 8
bpy.ops.object.bake(type='AO')
aopx = np.array(ao.pixels[:]).reshape(1024, 1024, 4)
ao.filepath_raw = str(out/'cow-ao.png'); ao.file_format = 'PNG'; ao.save()
pixels[:, :, :3] *= .25 + .75*np.clip(aopx[:, :, :3], 0, 1)
base.image.pixels[:] = pixels.astype(np.float32).ravel(); base.image.pack(); nt.nodes.remove(target)
bpy.ops.export_scene.gltf(filepath=str(out/'cow-quality.glb'), export_format='GLB', export_animations=False)
o.data.calc_loop_triangles()
mod = o.modifiers.new('local_far', 'DECIMATE'); mod.ratio = min(1., 14000/len(o.data.loop_triangles))
mod.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier=mod.name)
for face in o.data.polygons: face.use_smooth = True
if o.data.has_custom_normals: bpy.ops.mesh.customdata_custom_splitnormals_clear()
bpy.ops.export_scene.gltf(filepath=str(out/'cow-quality-light.glb'), export_format='GLB', export_animations=False)

# (Meshy production, 9 Nov 2026) The skin mark (corner colour 'skinw') of a fitted body, drawn flat from the front: red skin,
# yellow (red+green) a bare arm, leg or neck triangle the game tints fully, black not skin. Use it when a skin tone shows patches.
#   blender -b -P tools/meshy/render_mark.py -- <fitted .blend> <out.png> <ortho scale> <camera height>
#   (whole child: 1.0 0.95; head: 0.45 1.38 for a 1.3 m child)
import bpy, sys, math
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=a[0])
sc = bpy.context.scene
for o in bpy.data.objects:
    if o.type == 'MESH' and not o.name.endswith('-body'): o.hide_render = True
b = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith('-body'))
m = bpy.data.materials.new('mk'); m.use_nodes = True; nt = m.node_tree
for n in list(nt.nodes):
    if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'skinw'
e = nt.nodes.new('ShaderNodeEmission'); nt.links.new(vc.outputs['Color'], e.inputs['Color']); nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs[0])
for i in range(len(b.material_slots)): b.material_slots[i].material = m
sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.view_settings.view_transform = 'Standard'; sc.render.resolution_x = 600; sc.render.resolution_y = 900
for ob in [o for o in bpy.data.objects if o.type == 'CAMERA']: bpy.data.objects.remove(ob)
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = float(a[2])
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
co.location = (0, -5, float(a[3])); co.rotation_euler = (math.radians(90), 0, 0)
sc.render.filepath = a[1]; bpy.ops.render.render(write_still=True)

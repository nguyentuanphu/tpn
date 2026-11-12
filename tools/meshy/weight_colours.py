# (Meshy pets, 12 Nov 2026) Each point coloured by its bone weights, rendered side, back and front (orthographic, emission):
# see which bone moves which part (the kitty's tail tip was the head's).
#   blender -b -P tools/meshy/weight_colours.py -- <fit dir>/<kind>-hd.blend <out prefix>   (fit_animal.py ... debug saves the .blend)
import bpy, sys, colorsys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; bpy.ops.wm.open_mainfile(filepath=a[0])
ms = [o for o in bpy.data.objects if o.type == 'MESH' and len(o.data.vertices) > 2000]
o = max(ms, key=lambda m: len(m.data.vertices)); me = o.data
names = [g.name for g in o.vertex_groups]; print('GROUPS', names)
cols = {}
for i, n in enumerate(names): cols[i] = colorsys.hsv_to_rgb((i * 0.618) % 1, .85, 1)
ca = me.color_attributes.new('W', 'FLOAT_COLOR', 'POINT')
for v in me.vertices:
    c = [0, 0, 0]
    for g in v.groups:
        cc = cols[g.group]; c = [c[k] + cc[k] * g.weight for k in range(3)]
    ca.data[v.index].color = (*c, 1)
mat = bpy.data.materials.new('W'); mat.use_nodes = True; nt = mat.node_tree; ac = nt.nodes.new('ShaderNodeVertexColor'); ac.layer_name = 'W'
em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(ac.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
for ob in bpy.data.objects:
    if ob.type == 'MESH': ob.hide_render = ob is not o
o.data.materials.clear(); o.data.materials.append(mat)
for md in o.modifiers: md.show_render = False
sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x = sc.render.resolution_y = 600
cam = bpy.data.objects.new('C', bpy.data.cameras.new('C')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.2
for nm, pos, rot in (('side', (2, 0, .45), (math.pi / 2, 0, math.pi / 2)), ('back', (0, 2, .45), (math.pi / 2, 0, math.pi)), ('front', (0, -2, .45), (math.pi / 2, 0, 0))):
    cam.location = pos; cam.rotation_euler = rot; sc.render.filepath = a[1] + '-' + nm + '.png'; bpy.ops.render.render(write_still=True)
print('legend', {n: [round(x, 2) for x in cols[i]] for i, n in enumerate(names)})

# (Meshy production, 9 Nov 2026) A dressed model's parts each in one flat colour (body red, head blue, worn top yellow, kit items
# green, face pieces purple), from the front, three-quarter, side and back: find out which part a stray piece belongs to BEFORE
# fixing it (guessing cost a dozen rounds on the chins and collars, 8 Nov).
#   blender -b -P tools/meshy/render_parts.py -- <dressed .glb> <out prefix> <camera height>
import bpy, sys, math
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
sc = bpy.context.scene
w = bpy.data.worlds.new('w'); sc.world = w
def flat(rgb):
    m = bpy.data.materials.new('f'); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*rgb, 1)
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs[0]); return m
C = {'body': (1, .1, .1), 'head': (.1, .3, 1), 'top': (1, .9, .1), 'item': (.1, .8, .1), 'other': (.8, .2, .9)}
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    names = ' '.join(s.material.name for s in o.material_slots if s.material)
    print('OBJ', o.name, '|', names[:120])
    if o.name.startswith('face-') and 'happy' not in o.name: o.hide_render = True; continue
    if 'lit-g-' in names:
        if 'top-short' not in names: o.hide_render = True; continue
        k = 'top'
    elif o.name.startswith('face-'): k = 'other'
    elif 'body' in o.name: k = 'body'
    elif 'head' in o.name: k = 'head'
    elif 'item' in o.name or 'shoe' in o.name: k = 'item'
    else: k = 'other'
    m = flat(C[k])
    for s in o.material_slots: s.material = m
sc.view_settings.view_transform = 'Standard'; sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x = sc.render.resolution_y = 600
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = .4
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
for nm, ang in (('front', 0), ('tq', 35), ('side', 80), ('back', 180)):
    r = math.radians(ang)
    co.location = (math.sin(r) * 3, -math.cos(r) * 3, float(a[2])); co.rotation_euler = (math.radians(90), 0, r)
    sc.render.filepath = a[1] + '-' + nm + '.png'; bpy.ops.render.render(write_still=True)

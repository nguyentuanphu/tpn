# blender -b -P pose_check.py -- <model.blend> <out.png>
import bpy, sys, math
from mathutils import Matrix, Vector
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=a[0])
sc = bpy.context.scene; rig = bpy.data.objects['rig']
for o in sc.objects:
    if o.type == 'MESH' and o.name.startswith('face-'): o.hide_render = o.name != 'face-happy'
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='POSE')
for sd, sx in (('L', 1), ('R', -1)):           # both arms up and out, like the cheer
    pb = rig.pose.bones['arm' + sd]; h = pb.bone.head_local
    cur = (pb.bone.tail_local - h).normalized(); tgt = Vector((sx * .55, -.15, .82)).normalized()
    pb.matrix = Matrix.Translation(h) @ cur.rotation_difference(tgt).to_matrix().to_4x4() @ Matrix.Translation(-h) @ pb.bone.matrix_local
bpy.ops.object.mode_set(mode='OBJECT')
sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.91, 0.88, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .6
for rot, en in (((math.radians(50), 0, math.radians(30)), 3.0), ((math.radians(60), 0, math.radians(200)), 1.5)):
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = en; lo = bpy.data.objects.new('sun', l); lo.rotation_euler = rot; sc.collection.objects.link(lo)
cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
cam.data.ortho_scale = 2.1; cam.location = (0, -10, .95); cam.rotation_euler = (math.radians(90), 0, 0)
sc.render.resolution_x, sc.render.resolution_y = 600, 700; sc.render.filepath = a[1]; bpy.ops.render.render(write_still=True)
print('POSE done')

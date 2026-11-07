# (Meshy production, 7 Nov 2026) The joints file for fit_people.py from Meshy's own rig, instead of marking by hand.
#   blender -b -P tools/meshy/auto_joints.py -- <remesh.glb> <rigged.glb> <id> <out joints.json> <check.png>
# Pixel points are in fit_people.py's front-render framing of <remesh.glb>; the face box is placed on the head like
# Clara's hand-marked one (brows to chin, 0.37-0.91 of the head; 0.66 of its height wide). check.png shows them.
import bpy, sys, json, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
REM, RIG, ID, OUT, PNG = a[:5]
def load(p):
    before = set(bpy.context.scene.objects); bpy.ops.import_scene.gltf(filepath=p); return [o for o in bpy.context.scene.objects if o not in before]
def bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
bpy.ops.wm.read_factory_settings(use_empty=True)
rem = [o for o in load(REM) if o.type == 'MESH']; lo, hi = bbox(rem); c = (lo + hi) / 2
K = max(hi.z - lo.z, (hi.x - lo.x) * 900 / 600) * 1.08 / 900
rig_objs = load(RIG); arm = next(o for o in rig_objs if o.type == 'ARMATURE')
if arm.animation_data: arm.animation_data_clear()
bpy.context.view_layer.update()
rmesh = max((o for o in rig_objs if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
rlo, rhi = bbox([rmesh]); s = (hi.z - lo.z) / (rhi.z - rlo.z); rc = (rlo + rhi) / 2
def W(p): return Vector((c.x + (p.x - rc.x) * s, 0, lo.z + (p.z - rlo.z) * s))   # rig space -> remesh space
mw = arm.matrix_world; B = {b.name: W(mw @ b.head_local) for b in arm.data.bones}
def px(v): return [round(300 + (v.x - c.x) / K, 1), round(450 - (v.z - c.z) / K, 1)]
L_ = 'Left' if (mw @ arm.data.bones['LeftArm'].head_local).x > 0 else 'Right'
top = Vector((0, 0, hi.z)); top.x = B['Head'].x
J = {'id': ID, 'reference_prefix': (a[5] if len(a) > 5 else ID + '-'), 'source': 'auto_joints.py from Meshy rig ' + RIG.replace('\\', '/').split('/')[-1],
     'top': px(top), 'neck': px(B['neck']), 'hip': px(B['Hips']),
     'shoulderL': px(B[L_ + 'Arm']), 'elbowL': px(B[L_ + 'ForeArm']), 'wristL': px(B[L_ + 'Hand']),
     'hipL': px(B[L_ + 'UpLeg']), 'kneeL': px(B[L_ + 'Leg']), 'ankleL': px(B[L_ + 'Foot'])}
J['hip'][0] = 300.0; J['neck'][0] = 300.0; J['top'][0] = 300.0
ht, nk = J['top'][1], J['neck'][1]; hh = nk - ht
J['facebox'] = [[round(300 - .33 * hh, 1), round(ht + .37 * hh, 1)], [round(300 + .33 * hh, 1), round(ht + .91 * hh, 1)]]
J.update({'trim_back_hair': False, 'original_skin': True, 'keep_meshy_uvs': True, 'skin_shift': True, 'skin_ref': '#f6c7a5'})
json.dump(J, open(OUT, 'w', encoding='utf-8'), indent=1)
print('AJ', json.dumps(J))
# check picture: the front render with the points
for o in rig_objs: bpy.data.objects.remove(o, do_unlink=True)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x, sc.render.resolution_y = 600, 900; sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.91, 0.88, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .7
l = bpy.data.lights.new('s', 'SUN'); l.energy = 3; lo_ = bpy.data.objects.new('s', l); lo_.rotation_euler = (math.radians(50), 0, math.radians(30)); sc.collection.objects.link(lo_)
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = max(hi.z - lo.z, (hi.x - lo.x) * 900 / 600) * 1.08
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co; co.location = (c.x, c.y - 10, c.z); co.rotation_euler = (math.radians(90), 0, 0)
sc.render.filepath = PNG; bpy.ops.render.render(write_still=True)
print('AJ done')

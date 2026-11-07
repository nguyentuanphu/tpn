# (Meshy production, 7 Nov 2026) Meshy Auto-Rigging -> the game's 11 joints, on a model made by fit_people.py.
#   blender -b -P tools/meshy/transfer_rig.py -- <fitted.blend> <meshy rigged.glb> <out.glb> [<game reference raw.glb> for its item]
# fit_people.py's region weights tear the sleeves when an arm lifts; Meshy's rig does not. This moves the fitted rig's
# bones to Meshy's joint positions and copies Meshy's skin weights (merged onto the game's joints) to the fitted body by
# nearest surface, then exports with fit_people.py's settings. The face layers stay on the head.
import bpy, sys, os
from mathutils import Vector, Matrix
a = sys.argv[sys.argv.index('--') + 1:]
FIT, RIGGED, OUT = a[0], a[1], a[2]
bpy.ops.wm.open_mainfile(filepath=FIT)
sc = bpy.context.scene; VL = bpy.context.view_layer
rig = bpy.data.objects['rig']; body = next(o for o in sc.objects if o.type == 'MESH' and o.name.endswith('-body'))
moods = [o for o in sc.objects if o.type == 'MESH' and o.name.startswith('face-')]
def bbox(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))), Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
before = set(sc.objects)
bpy.ops.import_scene.gltf(filepath=RIGGED)
new = [o for o in sc.objects if o not in before]
marm = next(o for o in new if o.type == 'ARMATURE'); mmesh = max((o for o in new if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
if marm.animation_data: marm.animation_data_clear()
for o in new:
    if o.type == 'MESH' and o != mmesh: bpy.data.objects.remove(o, do_unlink=True)
# Meshy's model onto the fitted one: same picture, uniform scale by height, feet and centre matched
VL.update(); lo, hi = bbox(mmesh); flo, fhi = bbox(body)
s = (fhi.z - flo.z) / (hi.z - lo.z); c = (lo + hi) / 2; fc = (flo + fhi) / 2
T = Matrix.Translation(Vector((fc.x, fc.y, flo.z))) @ Matrix.Scale(s, 4) @ Matrix.Translation(-Vector((c.x, c.y, lo.z)))
root = marm
while root.parent: root = root.parent
root.matrix_world = T @ root.matrix_world; VL.update()
mw = marm.matrix_world
P = {b.name: (mw @ b.head_local, mw @ b.tail_local) for b in marm.data.bones}
print('RIGT meshy bones', len(P), 'scale', round(s, 4))
# merge Meshy's groups onto the game's joints
MAP = {'Hips': 'root', 'Spine02': 'torso', 'Spine01': 'torso', 'Spine': 'torso', 'LeftShoulder': 'torso', 'RightShoulder': 'torso',
       'neck': 'head', 'Head': 'head', 'head_end': 'head', 'headfront': 'head',
       'LeftArm': 'armL', 'LeftForeArm': 'elbowL', 'LeftHand': 'elbowL', 'RightArm': 'armR', 'RightForeArm': 'elbowR', 'RightHand': 'elbowR',
       'LeftUpLeg': 'legL', 'LeftLeg': 'kneeL', 'LeftFoot': 'kneeL', 'LeftToeBase': 'kneeL',
       'RightUpLeg': 'legR', 'RightLeg': 'kneeR', 'RightFoot': 'kneeR', 'RightToeBase': 'kneeR'}
# which side is the character's left: the game's armL bone (fit_people) sits at +x; make Meshy's 'Left' match
side_ok = (P['LeftArm'][0].x > 0) == (rig.data.bones['armL'].head_local.x > 0)
if not side_ok:
    MAP = {k: (v.replace('L', '#').replace('R', 'L').replace('#', 'R') if v.endswith(('L', 'R')) else v) for k, v in MAP.items()}
print('RIGT left side matches', side_ok)
gname = {g.index: g.name for g in mmesh.vertex_groups}
targets = sorted(set(MAP.values()))
newg = {n: mmesh.vertex_groups.new(name='g_' + n) for n in targets}
acc = {}
for v in mmesh.data.vertices:
    w = {}
    for g in v.groups:
        n = MAP.get(gname.get(g.group))
        if n: w[n] = w.get(n, 0) + g.weight
    tot = sum(w.values()) or 1
    for n, x in w.items(): newg[n].add([v.index], x / tot, 'REPLACE')
for g in list(mmesh.vertex_groups):
    if not g.name.startswith('g_'): mmesh.vertex_groups.remove(g)
for g in mmesh.vertex_groups: g.name = g.name[2:]
mmesh.parent = None; mmesh.matrix_world = mw @ Matrix() if False else mmesh.matrix_world
# the fitted rig's bones to Meshy's joints (rest pose)
def H(n): return P[n][0]
L_ = 'Left' if side_ok else 'Right'; R_ = 'Right' if side_ok else 'Left'
want = {'root': (H('Hips') + Vector((0, 0, -.001)), H('Spine02')), 'torso': (H('Spine02'), H('neck')), 'head': (H('neck'), H('head_end') if 'head_end' in P else P['Head'][1])}
for sd, nm in (('L', L_), ('R', R_)):
    want['arm' + sd] = (H(nm + 'Arm'), H(nm + 'ForeArm')); want['elbow' + sd] = (H(nm + 'ForeArm'), H(nm + 'Hand') + (H(nm + 'Hand') - H(nm + 'ForeArm')) * .4)   # (glTF leaf-bone tails are arbitrary)
    want['leg' + sd] = (H(nm + 'UpLeg'), H(nm + 'Leg')); want['knee' + sd] = (H(nm + 'Leg'), H(nm + 'Foot'))
inv = rig.matrix_world.inverted()
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); VL.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t) in want.items():
    eb = rig.data.edit_bones.get(n)
    if eb is None: continue
    eb.use_connect = False; eb.head = inv @ h; eb.tail = inv @ t
bpy.ops.object.mode_set(mode='OBJECT')
# Meshy's weights onto the fitted body (nearest surface, interpolated)
for g in list(body.vertex_groups): body.vertex_groups.remove(g)
for n in targets: body.vertex_groups.new(name=n)
dt = body.modifiers.new('wt', 'DATA_TRANSFER'); dt.object = mmesh; dt.use_object_transform = True
dt.use_vert_data = True; dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); VL.objects.active = body
for m in list(body.modifiers):
    if m.type == 'ARMATURE': body.modifiers.remove(m)
bpy.ops.object.modifier_move_to_index(modifier='wt', index=0); bpy.ops.object.modifier_apply(modifier='wt')
am = body.modifiers.new('Armature', 'ARMATURE'); am.object = rig
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
unw = sum(1 for v in body.data.vertices if sum(g.weight for g in v.groups) < .01)
print('RIGT weights copied, unweighted', unw, 'of', len(body.data.vertices))
for o in moods:   # the face layers follow the head
    for g in list(o.vertex_groups): o.vertex_groups.remove(g)
    o.vertex_groups.new(name='head').add(list(range(len(o.data.vertices))), 1, 'REPLACE')
    for m in list(o.modifiers):
        if m.type == 'ARMATURE': m.object = rig
# ---- the game's dressing parts (js/friend-model.ts): "cloth-shoes" (the model's own boots, hidden when the child wears
# shop shoes) and "cloth-item" (the quest item in the hand, shown once the quest is done)
import bmesh
REF = a[3] if len(a) > 3 else None
ank = max(want['kneeL'][1].z, want['kneeR'][1].z)
me = body.data; bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
mw_b = body.matrix_world
feet = [f.index for f in bm.faces if (mw_b @ f.calc_center_median()).z < ank + .045]
bm.free()
if feet:
    bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); VL.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
    ids = set(feet)
    for p in me.polygons: p.select = p.index in ids
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
    shoes = next(o for o in sc.objects if o.type == 'MESH' and o.name.startswith(body.name) and o != body)
    shoes.name = body.name.replace('-body', '-shoes')
    base_m = next((m for m in shoes.data.materials if m and not m.name.startswith('skin')), shoes.data.materials[0])
    c = base_m.copy(); c.name = 'cloth-shoes'   # (one material: the boots are one part the game can hide)
    for i in range(len(shoes.data.materials)): shoes.data.materials[i] = c
    for m in list(shoes.modifiers):
        if m.type == 'ARMATURE': m.object = rig
    print('RIGT shoes split', len(feet), 'faces')
else: shoes = None
item = None
if REF:
    before2 = set(sc.objects); bpy.ops.import_scene.gltf(filepath=REF); new2 = [o for o in sc.objects if o not in before2]
    rarm = next(o for o in new2 if o.type == 'ARMATURE')
    src = next((o for o in new2 if o.type == 'MESH' and any(m and m.name.startswith('cloth-item') for m in o.data.materials)), None)
    if src:
        groups = {g.index: g.name for g in src.vertex_groups}; w = {}
        for v in src.data.vertices:
            for g in v.groups: w[groups[g.group]] = w.get(groups[g.group], 0) + g.weight
        hand = max(w, key=w.get) if w else 'elbowR'
        old = rarm.matrix_world @ rarm.data.bones[hand].tail_local; newp = rig.matrix_world @ rig.data.bones[hand].tail_local
        item = src.copy(); item.data = src.data.copy(); sc.collection.objects.link(item); item.name = body.name.replace('-body', '-item')
        item.parent = None; item.matrix_world = Matrix.Translation(newp - old) @ src.matrix_world
        for m in list(item.modifiers): item.modifiers.remove(m)
        am2 = item.modifiers.new('Armature', 'ARMATURE'); am2.object = rig
        for i, m in enumerate(item.data.materials):
            if m and not m.name.startswith('cloth-item'): pass
        print('RIGT dbg rarm', rarm.name, tuple(round(x,3) for x in rarm.matrix_world.to_scale()), 'old', tuple(round(x,3) for x in old), 'new', tuple(round(x,3) for x in newp), 'rig', rig.name, tuple(round(x,3) for x in rig.matrix_world.to_scale()), 'itemc', tuple(round(x,3) for x in (src.matrix_world @ Vector(src.bound_box[0]))))
        print('RIGT item', src.name, 'on', hand, 'moved', tuple(round(x, 3) for x in (newp - old)))
    for o in new2:
        try: bpy.data.objects.remove(o, do_unlink=True)
        except Exception: pass
extra = [o for o in (shoes, item) if o]
# the game reads exact material names: imported copies ("cloth-item.001") take their base name back
import re as _re
for o in [body] + moods + extra:
    for m in o.data.materials:
        if m and _re.search(r'\.\d{3}$', m.name):
            base = _re.sub(r'\.\d{3}$', '', m.name)
            if base in bpy.data.materials and bpy.data.materials[base] is not m: bpy.data.materials[base].name = base + '-unused'
            m.name = base
for o in [marm, mmesh] + [o for o in sc.objects if o.type == 'EMPTY']:
    try: bpy.data.objects.remove(o, do_unlink=True)
    except Exception: pass
bpy.ops.object.select_all(action='DESELECT')
for o in [rig, body] + moods + extra: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_morph=False,
                          export_yup=True, export_image_format='AUTO', export_vertex_color='ACTIVE', export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + '.blend')
print('RIGT exported', OUT, os.path.getsize(OUT))

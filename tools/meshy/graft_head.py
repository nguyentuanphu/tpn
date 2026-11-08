# (Meshy production, 8 Nov 2026; owner: "reuse the faces already made, only the body differs") The head of a friend's
# earlier, approved model (face, hair, the reviewed mood pieces) on that friend's new swim body.
#   blender -b -P tools/meshy/graft_head.py -- <new body fitted .blend> <old fitted .blend> <out .blend> [<check dir>]
# Both are fitted rigged .blend files from fit_person.ps1 (transfer_rig.py), on the same game joints.
#  - the old head is moved so its head joint sits on the new head joint;
#  - the new body loses everything above the neck cut (its own head, hair and face pieces);
#  - the old head keeps everything above the cut and a 2.5 cm band below it; that band is laid onto the new neck's surface
#    (0.8 mm out) and takes the new body's joint weights, blending into the head's own weights over 5 cm: the join bends
#    exactly as the body under it, so it can never open into a gap or come apart when the friend runs or turns;
#  - the head is its own part ("<id>-head", its own picture); the game draws it like the body.
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
a = sys.argv[sys.argv.index('--') + 1:]
NEW, OLD, OUT = a[0], a[1], a[2]; RDIR = a[3] if len(a) > 3 else None
bpy.ops.wm.open_mainfile(filepath=NEW)
sc = bpy.context.scene
rig = bpy.data.objects['rig']
body = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith('-body'))
ID = body.name[:-5].split('-')[0]
Jn = {b.name: rig.matrix_world @ b.head_local for b in rig.data.bones}
# the new body's own face pieces go (the old head brings the reviewed ones)
for o in [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('face-')]:
    mats = list(o.data.materials); bpy.data.objects.remove(o, do_unlink=True)
    for m in mats:
        if m and m.users == 0: bpy.data.materials.remove(m)
# ---- the old model's head parts
with bpy.data.libraries.load(OLD, link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n.endswith('-body') or n.startswith('face-') or n == 'rig']
old_rig = next(o for o in dst.objects if o and o.type == 'ARMATURE')
Jo = {b.name: old_rig.matrix_world @ b.head_local for b in old_rig.data.bones}
off = Jn['head'] - Jo['head']
oldbody = next(o for o in dst.objects if o and o.name.endswith('-body'))
faces_old = [o for o in dst.objects if o and o.type == 'MESH' and o.name.startswith('face-')]
from mathutils import Matrix
for o in [oldbody] + faces_old:
    sc.collection.objects.link(o)
    mw = o.matrix_world.copy(); o.parent = None
    o.data.transform(Matrix.Translation(off) @ mw); o.matrix_world = Matrix.Identity(4)   # (geometry in place, rest pose)
    o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
    for md in o.modifiers:
        if md.type == 'ARMATURE': md.object = rig
bpy.data.objects.remove(old_rig, do_unlink=True)
for o in faces_old:   # (the new body's face materials are gone: the old ones take their plain names back, face-<mood>)
    for m in o.data.materials:
        if m and '.' in m.name and m.name.startswith('face-'):
            base = m.name.split('.')[0]; old = bpy.data.materials.get(base)
            if old and old is not m: old.name = base + '-unused'
            m.name = base
for m in oldbody.data.materials:   # (its own names: the new body keeps cloth-body / skin-tex)
    if m and m.name.startswith('cloth-body'): m.name = 'cloth-head'
    elif m and m.name.startswith('skin-tex'): m.name = 'skin-tex-head'
oldbody.name = ID + '-head'
CUT = Jn['head'].z - .01   # (the neck cut: just under the head joint, as make_clothes.py's NECK)
print('GH offset', tuple(round(x, 3) for x in off), 'cut', round(CUT, 3))

def picture(o):
    img = next((n.image for m in o.data.materials if m and m.use_nodes for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None)
    W_, H_ = img.size; return np.array(img.pixels[:], np.float32).reshape(H_, W_, 4)[..., :3], W_, H_
def face_values(o):   # brightness of each triangle's painted colour (hair is dark)
    PX, W_, H_ = picture(o); uv = o.data.uv_layers.active.data; out = []
    for p in o.data.polygons:
        c = np.mean([PX[min(H_ - 1, int((uv[l].uv[1] % 1) * H_)), min(W_ - 1, int((uv[l].uv[0] % 1) * W_))] for l in p.loop_indices], axis=0); out.append(c)
    return np.array(out)
# ---- the new body: away with everything above the cut, and its hair hanging below it at the nape
cn = face_values(body); Vn = cn.max(1); Sn = (Vn - cn.min(1)) / np.maximum(Vn, 1e-4)
bm = bmesh.new(); bm.from_mesh(body.data); bm.faces.ensure_lookup_table()
# (the old head may have little neck of its own, Finn's was under a collar) the new body keeps its neck column up into
# the head, hidden inside it: the neck is always solid; only what lies outside that column above the cut goes
_ring = [f.calc_center_median() for f in bm.faces if CUT - .03 < f.calc_center_median().z < CUT]
NCX = sum((c.x for c in _ring), 0.) / max(1, len(_ring)); NCY = sum((c.y for c in _ring), 0.) / max(1, len(_ring))
NR = float(np.median([math.hypot(c.x - NCX, c.y - NCY) for c in _ring])) if _ring else .05
incol = lambda c: (math.hypot(c.x - NCX, c.y - NCY) < NR * 1.15 and c.z < CUT + .09) or \
    (c.y > NCY - NR * .3 and math.hypot(c.x - NCX, c.y - NCY) < NR * 2.2 and c.z < CUT + .16)   # (the back and the sides, under the ears)   # (and the back of its own head's skin: the old head's nape may be open, under a hood; owner 8 Nov: "gáy chưa kết nối")
_cz = np.array([p.center.z for p in body.data.polygons]); HCn = np.median(cn[_cz > _cz.max() - .05], axis=0)   # (the new body's own hair colour)
hairn = np.linalg.norm(cn - HCn, axis=1) < .12
kitn = Sn < .12   # (the grey swim kit, wherever it reaches: the tops of its straps rise above the cut)
gone = [f for f in bm.faces if (f.calc_center_median().z > CUT and not kitn[f.index] and not (incol(f.calc_center_median()) and Vn[f.index] > .45 and Sn[f.index] > .1)) or
        (f.calc_center_median().z > CUT - .12 and abs(f.calc_center_median().x) < .16 and f.calc_center_median().y > NCY and hairn[f.index])]   # (its hair at the nape only)
bmesh.ops.delete(bm, geom=gone, context='FACES'); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
bm.normal_update()
for v in bm.verts:   # (what it keeps above the cut sits a little inside, so it fills openings but never shows through the old head)
    if v.co.z > CUT + .015: v.co -= v.normal * min(.009, (v.co.z - CUT - .015) * .3)
bm.to_mesh(bm_ := body.data) if False else bm.to_mesh(body.data); bm.free(); body.data.update()
print('GH new body triangles removed', len(gone))
# ---- the old head: above the cut, the 2.5 cm band below it, and its own hair hanging lower
co = face_values(oldbody); Vo = co.max(1); So = (Vo - co.min(1)) / np.maximum(Vo, 1e-4)
# what is hair: the colour of the top of the head; what is skin: warm, moderately coloured (not the old outfit's collar,
# hood or jacket, which reach up round the neck)
cz = np.array([p.center.z for p in oldbody.data.polygons]); ztop = cz.max()
HC = np.median(co[cz > ztop - .05], axis=0)
hairo = np.linalg.norm(co - HC, axis=1) < .14
warm = (co[:, 0] > co[:, 1]) & (co[:, 1] > co[:, 2] * .95) & (So > .12) & (So < .62) & (Vo > .45)
SKC = np.median(co[warm & (cz > CUT + .05) & (cz < ztop - .08)], axis=0)   # (the face's own skin)
skino = warm & (np.linalg.norm(co - SKC, axis=1) < .1)   # (a cream collar is warm too, but paler than skin)
cx_ = np.array([p.center.x for p in oldbody.data.polygons])
cy_ = np.array([p.center.y for p in oldbody.data.polygons]); _hy = float(np.median(cy_[cz > CUT]))
hairo &= (cz > CUT) | ((np.abs(cx_) < .11) & (cy_ > _hy) & (cz > CUT - .08))   # (below the cut, hair only at the back of the neck)
print('GH hair colour', np.round(HC, 3), 'skin colour', np.round(SKC, 3))
bm = bmesh.new(); bm.from_mesh(oldbody.data); bm.faces.ensure_lookup_table()
def keep(f):
    z = f.calc_center_median().z
    if z > CUT + .07: return True   # (the head itself: face, ears, hair)
    if hairo[f.index]: return z > CUT - .14   # (hair, hanging a little lower at the nape)
    return skino[f.index] and z > CUT - .025   # (the neck's skin and its band; never clothes)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f)], context='FACES')
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
# tiny loose pieces (a few triangles of the old outfit left alone) go; the hair's own locks are much bigger
bm.faces.ensure_lookup_table(); seen = set(); drop = []
for f in bm.faces:
    if f in seen: continue
    comp = [f]; seen.add(f); st = [f]
    while st:
        g = st.pop()
        for e in g.edges:
            for k in e.link_faces:
                if k not in seen: seen.add(k); comp.append(k); st.append(k)
    if len(comp) < 12 and sum(x.calc_center_median().z for x in comp) / len(comp) < CUT + .1: drop += comp
bmesh.ops.delete(bm, geom=drop, context='FACES'); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
print('GH loose pieces dropped', len(drop))
bm.to_mesh(oldbody.data); bm.free(); oldbody.data.update()
# ---- the band: laid onto the new neck, and moved by the new body's joints
btree = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
kd = KDTree(len(body.data.vertices))
for v in body.data.vertices: kd.insert(v.co, v.index)
kd.balance()
gname = {g.index: g.name for g in body.vertex_groups}
hair_v = set()   # (hair points stay as they are: only the skin of the neck is laid on the new neck)
co2 = face_values(oldbody); h2 = np.linalg.norm(co2 - HC, axis=1) < .14
for p in oldbody.data.polygons:
    if h2[p.index]: hair_v.update(p.vertices)
for g in body.vertex_groups:
    if g.name not in oldbody.vertex_groups: oldbody.vertex_groups.new(name=g.name)
moved = 0
for v in oldbody.data.vertices:
    if v.co.z > CUT + .03 or v.index in hair_v: continue
    t = max(0., min(1., (v.co.z - (CUT - .02)) / .05))   # 0 at the band's foot: all body; 1 above: all head
    if v.co.z < CUT + .01:
        h = btree.find_nearest(v.co)
        if h[0] is not None: v.co = h[0] + h[1].normalized() * .0008; moved += 1
    _, ni, _ = kd.find(v.co); nv = body.data.vertices[ni]
    neww = {gname[g.group]: g.weight for g in nv.groups if g.group in gname}
    oldw = {oldbody.vertex_groups[g.group].name: g.weight for g in v.groups}
    for name in set(neww) | set(oldw):
        w = (1 - t) * neww.get(name, 0.) + t * oldw.get(name, 0.)
        vg = oldbody.vertex_groups[name]
        if w > 1e-4: vg.add([v.index], w, 'REPLACE')
        else: vg.remove([v.index])
print('GH neck band points laid on the new neck', moved)
if RDIR:
    os.makedirs(RDIR, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x, sc.render.resolution_y = 500, 500
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 2.5
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = .45
    cob = bpy.data.objects.new('c', cam); sc.collection.objects.link(cob); sc.camera = cob
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.startswith('face-') and o.name != 'face-smile': o.hide_render = True
    if os.environ.get('GH_HEAD_ONLY'): body.hide_render = True
    for nm, ang in (('front', 0), ('side', 90), ('back', 180), ('tq', 40)):
        r_ = math.radians(ang); cob.location = (math.sin(r_) * 3, -math.cos(r_) * 3, CUT + .02); cob.rotation_euler = (math.radians(90), 0, r_)
        sc.render.filepath = os.path.join(RDIR, 'graft-' + nm + '.png'); bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('GH done', OUT)

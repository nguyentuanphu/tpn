# (Meshy production, 7 Nov 2026) A raw Meshy person -> a game friend/villager model on the v1.08 contract
# (js/friend-model.ts): the 11 joints the runtime copies (root, torso, head, armL/R, elbowL/R, legL/R, kneeL/R), the
# skin as its own recolourable part ("skin-shade", painted shading in the corner colours), a face layer per mood
# ("face-<mood>", one shared picture with see-through skin) made from the model's own painted eyes and mouth, a light
# version (corner colours, no picture) and a high-detail version (one picture). Recreated from the owner's local Clara
# test workflow (D:\WorkSpace\meshy\clara\scripts\fit2.py), with the joint points read from a per-character file.
#   blender -b -P tools/meshy/fit_people.py -- <raw meshy.glb> <game reference raw.glb> <out.glb> <render dir>
#           <tris> <tex px, 0 = light: no picture> <head scale> <arm rest deg> <joints.json>
# joints.json: pixel points on the 600x900 front render made by tools/meshy/render_views.py (same framing):
#   {"neck":[x,y],"top":[x,y],"hip":[x,y],"shoulderL":[x,y],"elbowL":[x,y],"wristL":[x,y],"hipL":[x,y],
#    "kneeL":[x,y],"ankleL":[x,y],"facebox":[[x0,y0],[x1,y1]], "id":"clara", "reference_prefix":"clara-"}
# (L is the character's own left, on the right of the front picture; the right side is mirrored.)
# Writes nothing into the game: the output goes where <out.glb> says; the caller packs and reviews it.
import bpy, bmesh, sys, os, math, colorsys, json
import numpy as np
from mathutils import Vector, Matrix
a = sys.argv[sys.argv.index('--') + 1:]
MESHY, GAME, OUT, RDIR = a[0], a[1], a[2], a[3]
TRIS, TEX, HEAD_S, ARM_DEG = int(a[4]), int(a[5]), float(a[6]), float(a[7])
J = json.load(open(a[8], encoding='utf-8'))
ID, REFP = J.get('id', 'person'), J.get('reference_prefix', 'clara-')
# (owner, 7 Nov 2026: "skin toned phai giu nhu original") original_skin: the skin keeps Meshy's own painted colour exactly
# (no skin-tone part); the face layers and moods stay ("mat va mat phai co emotion")
ORIGINAL = bool(J.get('original_skin'))
TILE = 512 if TEX else 160   # the face picture: sharp lashes and eye rims up close (the light model's is smaller)
os.makedirs(RDIR, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; VL = bpy.context.view_layer

def bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return (Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
            Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))))
def activate(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); VL.objects.active = o

# ---- the game rig's height
bpy.ops.import_scene.gltf(filepath=GAME)
gm = [o for o in sc.objects if o.type == 'MESH' and o.name.startswith(REFP) and o.name != REFP + 'item']
glo, ghi = bbox(gm); GAME_H, GAME_FEET = ghi.z - glo.z, glo.z
G = {b.name: (b.head_local.copy(), b.tail_local.copy()) for o in sc.objects if o.type == 'ARMATURE' for b in o.data.bones}
for o in list(sc.objects): bpy.data.objects.remove(o, do_unlink=True)

# ---- the Meshy model (full detail), scaled and placed like the game reference model
bpy.ops.import_scene.gltf(filepath=MESHY)
ms = [o for o in sc.objects if o.type == 'MESH']
for o in ms: o.select_set(True)
VL.objects.active = ms[0]
if len(ms) > 1: bpy.ops.object.join()
high = VL.objects.active; high.name = 'high'
for o in list(sc.objects):
    if o != high: bpy.data.objects.remove(o, do_unlink=True)
high.parent = None; activate(high); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
lo, hi = bbox([high]); c = (lo + hi) / 2
K = max(hi.z - lo.z, (hi.x - lo.x) * 900 / 600) * 1.08 / 900
def P(px, py): return Vector((c.x + (px - 300) * K, c.y, c.z + (450 - py) * K))
L = {k: P(*J[k]) for k in ('neck', 'top', 'hip', 'shoulderL', 'elbowL', 'wristL', 'hipL', 'kneeL', 'ankleL')}
FACEBOX = (P(*J['facebox'][0]), P(*J['facebox'][1]))   # brows to chin, cheek to cheek (front render pixels)
for k in list(L):
    if k.endswith('L'): v = L[k].copy(); v.x = c.x - (v.x - c.x); L[k[:-1] + 'R'] = v
s = GAME_H / (hi.z - lo.z); off = Vector((-c.x, -c.y, -lo.z))
T = lambda v: (v + off) * s + Vector((0, 0, GAME_FEET))
high.matrix_world = Matrix.Translation(Vector((0, 0, GAME_FEET))) @ Matrix.Scale(s, 4) @ Matrix.Translation(off)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
L = {k: T(v) for k, v in L.items()}; FB = (T(FACEBOX[0]), T(FACEBOX[1]))
fx0, fx1, fz0, fz1 = FB[0].x, FB[1].x, FB[1].z, FB[0].z
print('FIT facebox x', round(fx0, 3), round(fx1, 3), 'z', round(fz0, 3), round(fz1, 3))
def px(img):
    w, h = img.size; arr = np.empty(w * h * 4, np.float32); img.pixels.foreach_get(arr); return arr.reshape(h, w, 4)
def hsv_np(rgb):
    v = rgb.max(-1); mn = rgb.min(-1); d = np.maximum(v - mn, 1e-4); s_ = (v - mn) / np.maximum(v, 1e-4)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h_ = np.where(v == r, ((g - b) / d) % 6, np.where(v == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    return h_, s_, v
def back_hair(cz, cy, cx, rgb):   # hair-coloured surface behind the body between the neck and the waist
    h_, s_, v = hsv_np(rgb)
    return ((cz > L['hip'].z) & (cz < L['neck'].z - .02) & (cy > .02) & (np.abs(cx) < abs(L['shoulderL'].x) + .22)
            & ((h_ < .09) | (h_ > .97)) & (s_ > .35) & (v > .3))
def fill_missing(img, extra=None):   # texels the bake missed (left black), or marked, take their neighbours' colour
    A = px(img); miss = A[..., :3].max(-1) < .02
    if extra is not None: miss |= extra
    n0 = int(miss.sum())
    for _ in range(48):
        if not miss.any(): break
        ok = ~miss; acc = np.zeros_like(A[..., :3]); cnt = np.zeros(miss.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            acc += np.roll(np.roll(A[..., :3] * ok[..., None], dy, 0), dx, 1); cnt += np.roll(np.roll(ok, dy, 0), dx, 1)
        fix = miss & (cnt > 0); A[fix, :3] = acc[fix] / cnt[fix, None]; A[fix, 3] = 1; miss &= ~fix
    img.pixels.foreach_set(A.ravel()); img.update(); print('FIT filled missed texels', n0)

# ---- (joints.json "trim_back_hair") the duplicate back braids come off the full-detail model first, so the colour
# baked onto the dress behind them is the dress, not hair
base_img = None
for m in high.data.materials:
    if m and m.node_tree:
        for l in m.node_tree.links:
            if l.to_socket.name == 'Base Color' and l.from_node.type == 'TEX_IMAGE': base_img = l.from_node.image
HI = px(base_img)
def face_colours(me):   # each face's Meshy colour (its first corner), for a mesh still on Meshy's own UVs
    n = len(me.polygons); cen = np.empty(n * 3, np.float32); me.polygons.foreach_get('center', cen); cen = cen.reshape(n, 3)
    ls = np.empty(n, np.int32); me.polygons.foreach_get('loop_start', ls)
    uv = np.empty(len(me.loops) * 2, np.float32); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)[ls]
    hh, ww = HI.shape[:2]
    return cen, HI[np.clip((uv[:, 1] % 1 * hh).astype(int), 0, hh - 1), np.clip((uv[:, 0] % 1 * ww).astype(int), 0, ww - 1), :3]
if J.get('trim_back_hair'):
    me = high.data; n = len(me.polygons); cen, rgb = face_colours(me)
    sel = back_hair(cen[:, 2], cen[:, 1], cen[:, 0], rgb)
    activate(high); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
    me.polygons.foreach_set('select', sel); me.update()
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_mode(type='FACE'); bpy.ops.mesh.delete(type='FACE'); bpy.ops.object.mode_set(mode='OBJECT')
    print('FIT trimmed back hair on the full model', int(sel.sum()), 'of', n)

# ---- 1. the reduced mesh with its own UVs, the colour baked from the full model (no bleeding edges)
body = high.copy(); body.data = high.data.copy(); body.name = ID + '-body'; sc.collection.objects.link(body)
# (joints.json "keep_meshy_uvs", high detail) a Meshy-remeshed model is already clean and the right size: its own UVs and
# picture are kept as they are (no reduction, no new layout, no bake), which keeps the artwork exactly
KEEP = bool(J.get('keep_meshy_uvs')) and TEX > 0
if not KEEP:
    activate(body); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=0.0002); bpy.ops.object.mode_set(mode='OBJECT')
    print('FIT welded verts', len(body.data.vertices))
    # the hair keeps a bigger share of the triangles than its area (braids are thin and detailed, the dress and legs are
    # smooth): hair and the rest are reduced separately to their own budgets, then joined and welded again
    HAIR_SHARE = float(J.get('hair_share', .5))
    cen_, rgb = face_colours(body.data); h_, s_, v_ = hsv_np(rgb)
    hairm = ((h_ < .09) | (h_ > .97)) & (s_ > .42) & (v_ > .45)   # the hair is more saturated than skin and blush
    # never the front of the face (blush and lips can reach hair's saturation)
    hairm &= ~((cen_[:, 0] > fx0 - .01) & (cen_[:, 0] < fx1 + .01) & (cen_[:, 2] > fz0 - .03) & (cen_[:, 2] < (fz0 + fz1) / 2) & (cen_[:, 1] < 0))   # cheeks, mouth, chin; the fringe stays hair
    # smooth the choice over neighbouring triangles, so specks go with what surrounds them (no scattered patches)
    _me = body.data; _n = len(_me.polygons); _ls = np.empty(_n, np.int32); _me.polygons.foreach_get('loop_start', _ls)
    _tot = np.empty(_n, np.int32); _me.polygons.foreach_get('loop_total', _tot); _vi = np.empty(len(_me.loops), np.int32); _me.loops.foreach_get('vertex_index', _vi)
    for _ in range(3):
        vh = np.zeros(len(_me.vertices)); vc = np.zeros(len(_me.vertices))
        np.add.at(vh, _vi, np.repeat(hairm.astype(np.float64), _tot)); np.add.at(vc, _vi, 1); vh /= np.maximum(vc, 1)
        hairm = np.add.reduceat(vh[_vi], _ls) / _tot > .5
    # the front of the face joins the detail group too: it is what the close-up camera sees
    hairm |= (cen_[:, 0] > fx0 - .02) & (cen_[:, 0] < fx1 + .02) & (cen_[:, 2] > fz0 - .04) & (cen_[:, 2] < fz1 + .02) & (cen_[:, 1] < 0)
    def tri_count(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
    def reduce_to(o, n_):
        activate(o); d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = min(1, n_ / max(1, tri_count(o))); bpy.ops.object.modifier_apply(modifier='dec')
    if TEX and hairm.any() and not hairm.all():   # (the high-detail model; the light one is too small to split and is seen far away)
        activate(body); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
        body.data.polygons.foreach_set('select', hairm); body.data.update()
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_mode(type='FACE'); bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
        hairo = next(o for o in sc.objects if o.type == 'MESH' and o not in (high, body))
        print('FIT hair split', tri_count(hairo), 'rest', tri_count(body))
        reduce_to(hairo, TRIS * HAIR_SHARE); reduce_to(body, TRIS * (1 - HAIR_SHARE))
        bpy.ops.object.select_all(action='DESELECT'); hairo.select_set(True); body.select_set(True); VL.objects.active = body; bpy.ops.object.join()
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.remove_doubles(threshold=0.0015); bpy.ops.object.mode_set(mode='OBJECT')
    else:
        reduce_to(body, TRIS)
    bpy.ops.object.mode_set(mode='EDIT'); bm = bmesh.from_edit_mesh(body.data); bmesh.ops.triangulate(bm, faces=bm.faces[:]); bmesh.update_edit_mesh(body.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    for u in list(body.data.uv_layers): body.data.uv_layers.remove(u)
    body.data.uv_layers.new(name='UVMap'); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(80), island_margin=0.004); bpy.ops.object.mode_set(mode='OBJECT')
    # texture space where the camera looks closest: the face's pieces 3.5x, the head and hair 1.6x, then everything is packed
    # again (a plain layout gives every part the same density, which leaves the face about 30 pixels wide)
    from bpy_extras.bmesh_utils import bmesh_linked_uv_islands
    bm = bmesh.new(); bm.from_mesh(body.data); bm.faces.ensure_lookup_table(); uvl = bm.loops.layers.uv.active; nface = nhead = 0
    for isl in bmesh_linked_uv_islands(bm, uvl):
        c3 = sum((f.calc_center_median() for f in isl), Vector()) / len(isl)
        k = 3.5 if (fx0 - .02 < c3.x < fx1 + .02 and fz0 - .04 < c3.z < fz1 + .02 and c3.y < 0) else 1.6 if c3.z > L['neck'].z - .02 else 1.0
        if k == 1.0: continue
        nface += k == 3.5; nhead += k == 1.6
        cu = sum((l[uvl].uv for f in isl for l in f.loops), Vector((0, 0))) / sum(len(f.loops) for f in isl)
        for f in isl:
            for l in f.loops: l[uvl].uv = cu + (l[uvl].uv - cu) * k
    bm.to_mesh(body.data); bm.free()
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(rotate=True, margin=0.004); bpy.ops.object.mode_set(mode='OBJECT')
    print('FIT texture space: face islands x3.5', nface, 'head/hair islands x1.6', nhead)
    body.data.materials.clear()
    print('FIT body tris', len(body.data.polygons))

sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.cycles.device = 'CPU'
sc.render.bake.margin = 6; sc.render.bake.margin_type = 'EXTEND'
def bake(target, img, ext=.012, dist=.035):
    m = bpy.data.materials.new('bake-' + target.name); m.use_nodes = True; target.data.materials.clear(); target.data.materials.append(m)
    n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n; n.select = True
    bpy.ops.object.select_all(action='DESELECT'); high.select_set(True); target.select_set(True); VL.objects.active = target
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True, cage_extrusion=ext, max_ray_distance=dist, use_clear=True)
    return m
if KEEP:   # Meshy's own picture, on Meshy's own UVs (the body still has them)
    colour = bpy.data.images.new(ID + '-colour', base_img.size[0], base_img.size[1], alpha=True)
    colour.pixels.foreach_set(px(base_img).ravel()); colour.update()
    body.data.materials.clear(); print('FIT kept Meshy UVs and picture', base_img.size[0], 'x', base_img.size[1], 'tris', len(body.data.polygons))
else:
    colour = bpy.data.images.new(ID + '-colour', 1024, 1024, alpha=True); bake(body, colour); fill_missing(colour)
colour.filepath_raw = os.path.join(RDIR, 'colour-bake.png'); colour.file_format = 'PNG'; colour.save()
CA = px(bpy.data.images.load(os.path.join(RDIR, 'colour-bake.png'))); print('FIT colour mean', np.round(CA[..., :3].mean((0, 1)), 3))
def sample(arr, u, v):
    h, w = arr.shape[:2]; u = u if math.isfinite(u) else 0; v = v if math.isfinite(v) else 0
    return arr[min(h - 1, max(0, int(v * h))), min(w - 1, max(0, int(u * w))), :3]

# ---- (optional, joints.json "trim_back_hair") duplicate hair down the back: when the reference views disagree (braids
# in front in the front/side views, down the back in the back view) Meshy builds both. Remove hair-coloured surface
# behind the body between the neck and the waist; the back of the head and the front braids stay.
if J.get('trim_back_hair'):
    me_ = body.data; uvt = me_.uv_layers[0].data; cut = []
    for p in me_.polygons:
        pc = p.center
        if not (L['hip'].z < pc.z < L['neck'].z - .02 and pc.y > .02 and abs(pc.x) < abs(L['shoulderL'].x) + .22): continue
        col_ = np.mean([sample(CA, *uvt[li].uv) for li in p.loop_indices], axis=0)
        h_, s__, v_ = colorsys.rgb_to_hsv(*[float(x) for x in col_])
        if (h_ < .09 or h_ > .97) and s__ > .4 and v_ > .55: cut.append(p.index)   # the peach hair, not straps, cloth or skin
    bm = bmesh.new(); bm.from_mesh(me_); bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.faces[i] for i in cut], context='FACES_ONLY'); bm.to_mesh(me_); bm.free()
    print('FIT trimmed back hair triangles', len(cut))
    # small loose pieces left behind the back (shadowed ends of the braids): any part of fewer than 300 triangles there
    bm = bmesh.new(); bm.from_mesh(me_); bm.faces.ensure_lookup_table(); seen = set(); drop = []
    for f in bm.faces:
        if f.index in seen: continue
        comp = [f]; seen.add(f.index); st = [f]
        while st:
            g = st.pop()
            for e in g.edges:
                for k in e.link_faces:
                    if k.index not in seen: seen.add(k.index); comp.append(k); st.append(k)
        if len(comp) < 300:
            c_ = sum((x.calc_center_median() for x in comp), Vector()) / len(comp)
            if c_.y > 0 and L['hip'].z < c_.z < L['neck'].z + .02: drop += comp
    bmesh.ops.delete(bm, geom=drop, context='FACES_ONLY'); bm.to_mesh(me_); bm.free()
    print('FIT removed loose pieces behind the back', len(drop))
    # hair colour Meshy painted onto the cloth under the braids (backs of the sleeves, the upper back): those triangles'
    # texels are repainted from the cloth around them
    me_ = body.data; uvt = me_.uv_layers[0].data; A = px(colour); hh, ww = A.shape[:2]; miss = np.zeros((hh, ww), bool); nrep = 0
    for p in me_.polygons:
        pc = p.center
        if not (pc.y > 0 and L['hip'].z - .1 < pc.z < L['neck'].z - .01): continue
        uvs = np.array([uvt[li].uv[:] for li in p.loop_indices], np.float32)
        if not np.isfinite(uvs).all() or len(uvs) != 3: continue
        col_ = np.mean([sample(CA, *u) for u in uvs], axis=0); h_, s__, v_ = colorsys.rgb_to_hsv(*[float(x) for x in col_])
        if not ((h_ < .09 or h_ > .97) and s__ > .35 and v_ > .3): continue
        P_ = uvs * [ww, hh]; x0, y0 = np.floor(P_.min(0)).astype(int) - 1; x1, y1 = np.ceil(P_.max(0)).astype(int) + 1
        x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(ww, x1), min(hh, y1)
        gy, gx = np.mgrid[y0:y1, x0:x1] + .5; (ax, ay), (bx, by), (cx, cy) = P_
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-9: continue
        l1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / den; l2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / den
        inside = (l1 >= -.05) & (l2 >= -.05) & (1 - l1 - l2 >= -.05); miss[y0:y1, x0:x1] |= inside; nrep += 1
    A[miss, :3] = 0; colour.pixels.foreach_set(A.ravel()); colour.update(); fill_missing(colour)
    colour.save(); CA = px(colour)
    print('FIT repainted cloth triangles behind the back', nrep)

# ---- 2. the face layer: the face's front surface, lifted a little, its own front-facing picture
activate(body); bm = bmesh.new(); bm.from_mesh(body.data); bm.faces.ensure_lookup_table()
def infb(p): return fx0 <= p.x <= fx1 and fz0 <= p.z <= fz1
front = [f for f in bm.faces if infb(f.calc_center_median()) and f.normal.y < -.15 and f.calc_center_median().y < 0]
FACEF = {f.index for f in front}
dbm = bmesh.new(); vmap = {}
for f in front:
    vs = []
    for v in f.verts:
        if v.index not in vmap: vmap[v.index] = dbm.verts.new(v.co + v.normal * .003)
        vs.append(vmap[v.index])
    try: dbm.faces.new(vs)
    except ValueError: pass
dme = bpy.data.meshes.new('face'); dbm.to_mesh(dme); decal = bpy.data.objects.new('face', dme); sc.collection.objects.link(decal)
uvl = dme.uv_layers.new(name='UVMap')
for lp in dme.loops:
    p = dme.vertices[lp.vertex_index].co
    uvl.data[lp.index].uv = (min(1, max(0, (p.x - fx0) / (fx1 - fx0))), min(1, max(0, (p.z - fz0) / (fz1 - fz0))))
bm.free()
fimg = bpy.data.images.new('face-smile-src', TILE, TILE, alpha=True); bake(decal, fimg, ext=.03, dist=.06); fill_missing(fimg)
fimg.filepath_raw = os.path.join(RDIR, 'face-bake.png'); fimg.file_format = 'PNG'; fimg.save(); fimg = bpy.data.images.load(os.path.join(RDIR, 'face-bake.png'))
F = px(fimg)[::-1].copy()   # top-down rows
# the face picture straight from the front: each pixel is the original model's own colour where a ray from the camera
# side meets it (a bake through the folded eye sockets left thin streaks at the eye edges)
from mathutils.bvhtree import BVHTree as _BVH
from mathutils.geometry import barycentric_transform as _bary
_ht = _BVH.FromObject(high, bpy.context.evaluated_depsgraph_get()); _hm = high.data; _huv = _hm.uv_layers.active.data
_HI = px(base_img); _hh, _hw = _HI.shape[:2]; _Hn, _Wn = F.shape[:2]; _nr = 0
def _bil(u, v):   # bilinear sample of the original picture (smooth lash and iris edges)
    x = u % 1 * _hw - .5; y = v % 1 * _hh - .5; x0 = int(math.floor(x)); y0 = int(math.floor(y)); fx_ = x - x0; fy_ = y - y0
    x0c, x1c = min(_hw - 1, max(0, x0)), min(_hw - 1, max(0, x0 + 1)); y0c, y1c = min(_hh - 1, max(0, y0)), min(_hh - 1, max(0, y0 + 1))
    return (_HI[y0c, x0c, :3] * (1 - fx_) + _HI[y0c, x1c, :3] * fx_) * (1 - fy_) + (_HI[y1c, x0c, :3] * (1 - fx_) + _HI[y1c, x1c, :3] * fx_) * fy_
for r_ in range(_Hn):
    for c_ in range(_Wn):
        acc = np.zeros(3); n_ = 0
        for oy, ox in ((.25, .25), (.25, .75), (.75, .25), (.75, .75)):   # 4 rays per pixel
            z_ = fz1 - (r_ + oy) / _Hn * (fz1 - fz0); x_ = fx0 + (c_ + ox) / _Wn * (fx1 - fx0)
            loc, nrm, fi, _d = _ht.ray_cast(Vector((x_, -2, z_)), Vector((0, 1, 0)))
            if loc is None: continue
            p = _hm.polygons[fi]; li = list(p.loop_indices)[:3]; vi = [_hm.loops[l].vertex_index for l in li]
            a3, b3, c3 = (_hm.vertices[v].co for v in vi); ua, ub, uc = (Vector((*_huv[l].uv, 0)) for l in li)
            uvp = _bary(loc, a3, b3, c3, ua, ub, uc); acc += _bil(uvp.x, uvp.y); n_ += 1
        if n_: F[r_, c_, :3] = acc / n_; _nr += 1
print('FIT face picture projected from the front', _nr, 'of', _Hn * _Wn)
activate(decal); dd = decal.modifiers.new('dec', 'DECIMATE'); dd.ratio = min(1, 1200 / max(1, len(decal.data.polygons))); bpy.ops.object.modifier_apply(modifier='dec')
print('FIT face layer tris', len(dme.polygons))

# ---- skin colour: the face's typical light skin
def hsv(c): return colorsys.rgb_to_hsv(*[float(x) for x in c])
flat = F[..., :3].reshape(-1, 3); hs = np.array([hsv(c) for c in flat[::7]])
cand = flat[::7][(hs[:, 1] > .08) & (hs[:, 1] < .45) & (hs[:, 2] > .6) & ((hs[:, 0] < .11) | (hs[:, 0] > .95))]
REF = np.percentile(cand, 80, axis=0); print('FIT skin ref', np.round(REF, 3), 'from', len(cand))
dist = lambda arr: np.linalg.norm(arr[..., :3] - REF, axis=-1)
def skin_mask(arr):   # skin by hue and saturation (light peach to the pink of cheeks and lips), not hair (more saturated) or cream cloth
    rgb = arr[..., :3]; v = rgb.max(-1); mn = rgb.min(-1); s_ = (v - mn) / np.maximum(v, 1e-4)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.where(v == r, ((g - b) / np.maximum(v - mn, 1e-4)) % 6, np.where(v == g, (b - r) / np.maximum(v - mn, 1e-4) + 2, (r - g) / np.maximum(v - mn, 1e-4) + 4)) / 6
    return ((hue < .105) | (hue > .94)) & (s_ > .05) & (s_ < SKIN_SMAX) & (v > .38)
SKIN_SMAX = .44

# ---- 3. the moods, drawn from her own eyes and mouth
H_, W_ = F.shape[:2]; D = dist(F); V = F[..., :3].max(-1); S_ = (F[..., :3].max(-1) - F[..., :3].min(-1)) / np.maximum(V, 1e-4)
yy, xx = np.mgrid[0:H_, 0:W_]
def box_of(mask):
    ys, xs = np.nonzero(mask)
    if len(xs) < 5: return None
    return [int(np.percentile(xs, 2)), int(np.percentile(ys, 2)), int(np.percentile(xs, 98)) + 1, int(np.percentile(ys, 98)) + 1]
dark = (V < .42) & (yy > H_ * .15) & (yy < H_ * .7)
eyes = {}
for side, cols in (('R', xx < W_ / 2), ('L', xx >= W_ / 2)):
    b = box_of(dark & cols)
    if not b: continue
    w_, h_ = b[2] - b[0], b[3] - b[1]
    region = (xx >= b[0] - w_ * .35) & (xx <= b[2] + w_ * .35) & (yy >= b[1] - h_ * .3) & (yy <= b[3] + h_ * .45)
    white = region & (V > .8) & (S_ < .18)
    b2 = box_of((dark & cols & region) | white) or b
    eyes[side] = b2
mouthm = (yy > H_ * .68) & (yy < H_ * .97) & (xx > W_ * .3) & (xx < W_ * .7) & (D > .1) & (F[..., 0] > F[..., 1] + .08) & (V < REF.max() - .02)
mouth = box_of(mouthm)
print('FIT eyes', eyes, 'mouth', mouth)
lash = np.median(F[dark][:, :3], axis=0) if dark.any() else np.array([.25, .15, .1])
lip = np.median(F[mouthm][:, :3], axis=0) if mouthm.any() else np.array([.8, .45, .45])
whites = np.concatenate([F[(V > .85) & (S_ < .15) & (yy > b[1]) & (yy < b[3]) & (xx > b[0]) & (xx < b[2])][:, :3] for b in eyes.values()]) if eyes else np.zeros((0, 3))
EW = np.median(whites, axis=0) if len(whites) else np.array([.97, .96, .95])
base = F.copy(); base[..., 3] = np.where(skin_mask(F) & ~mouthm & ~dark, 0, 1).astype(np.float32)        # skin shows the game's skin tone through
# the nose and the cheeks between the eyes and the mouth are skin too, however pink: see-through unless a dark line, so
# their rosiness comes from the skin part's corner colours (times the child's tone), not a fixed pink patch
if eyes and mouth:
    ny0 = max(b[3] for b in eyes.values()); ny1 = mouth[1] - 2
    if ny1 > ny0: nz = (yy >= ny0) & (yy < ny1) & ~(V < .42); base[..., 3] = np.where(nz, 0, base[..., 3])
# soft cut edges: the see-through mask is blurred a little, so the game's alpha cut (0.5) follows a smooth line between
# texels instead of their stair-steps (no broken lash and rim lines up close)
_al = base[..., 3].copy()
for _ in range(2): _al = (_al + np.roll(_al, 1, 0) + np.roll(_al, -1, 0) + np.roll(_al, 1, 1) + np.roll(_al, -1, 1)) / 5
base[..., 3] = _al
if ORIGINAL:   # the skin is not recoloured, so the face layer covers the whole face with her own original face picture:
    base[..., 3] = 1   # nothing of the body's face shows through it (no shards where the body's eyes or seams are)
def lid(img, b, top=0., bot=1.):   # (original_skin) a closed lid painted over the eye: her own skin from round the eye
    w_, h_ = b[2] - b[0], b[3] - b[1]; y0 = b[1] + h_ * top; y1 = b[1] + h_ * bot
    ring = (xx > b[0] - w_ * .3) & (xx < b[2] + w_ * .3) & (yy > b[1] - h_ * .2) & (yy < b[3] + h_ * .5) & ~((xx > b[0]) & (xx < b[2]) & (yy > b[1]) & (yy < b[3]))
    ring &= skin_mask(F) & (V > .55)
    sk = np.median(F[ring][:, :3], axis=0) if ring.any() else REF
    cx_, cy_ = (b[0] + b[2]) / 2, (y0 + y1) / 2; rx, ry = w_ / 2 * 1.15, max(2, (y1 - y0) / 2 * 1.15)
    d = np.hypot((xx - cx_) / rx, (yy - cy_) / ry); hole = d < 1
    if top > 0: hole &= yy >= y0
    # her own skin flows in from all round the eye (a smooth fill, no disc edge): the eye pixels are repeatedly
    # replaced by the mean of their neighbours, the skin round them held fixed
    ya, yb = max(0, int(cy_ - ry) - 3), min(H_, int(cy_ + ry) + 4); xa, xb = max(0, int(cx_ - rx) - 3), min(W_, int(cx_ + rx) + 4)
    sub = img[ya:yb, xa:xb, :3].copy(); hm = hole[ya:yb, xa:xb]; sub[hm] = sk
    for _ in range(220):
        P = np.pad(sub, ((1, 1), (1, 1), (0, 0)), mode='edge')
        av = (P[:-2, 1:-1] + P[2:, 1:-1] + P[1:-1, :-2] + P[1:-1, 2:]) / 4; sub[hm] = av[hm]
    img[ya:yb, xa:xb, :3] = sub; img[ya:yb, xa:xb, 3] = np.maximum(img[ya:yb, xa:xb, 3], hm.astype(np.float32))
def shut(img, b, top=0., bot=1.):   # close an eye: a painted lid (original skin) or see-through (skin-tone mode)
    if ORIGINAL: lid(img, b, top, bot)
    else: erase(img, b, top, bot)
def grow(b):   # an eye box out to its lashes (closed eyes erase the whole painted eye)
    w_, h_ = b[2] - b[0], b[3] - b[1]; return [max(0, int(b[0] - w_ * .12)), max(0, int(b[1] - h_ * .25)), min(W_, int(b[2] + w_ * .12)), min(H_, int(b[3] + h_ * .3))]
def erase(img, b, top=0., bot=1.):
    if ORIGINAL: return lid(img, b, top, bot)   # (opaque face layer: remove a painted feature by painting her skin over it)
    y0 = int(b[1] + (b[3] - b[1]) * top); y1 = int(b[1] + (b[3] - b[1]) * bot)
    img[y0:y1, b[0]:b[2], 3] = 0
def stroke(img, pts, col, r):
    pts = np.array(pts, np.float32)
    x0, y0 = np.floor(pts.min(0) - r - 2).astype(int); x1, y1 = np.ceil(pts.max(0) + r + 2).astype(int)
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W_, x1), min(H_, y1)
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32); d = np.full(gx.shape, 1e9, np.float32)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        abx, aby = bx - ax, by - ay; t = np.clip(((gx - ax) * abx + (gy - ay) * aby) / max(abx * abx + aby * aby, 1e-6), 0, 1)
        d = np.minimum(d, np.hypot(gx - ax - abx * t, gy - ay - aby * t))
    al = np.clip(r + .5 - d, 0, 1)[..., None]
    sub = img[y0:y1, x0:x1]; sub[..., :3] = sub[..., :3] * (1 - al) + np.array(col) * al; sub[..., 3:] = np.maximum(sub[..., 3:], al)
def arc(b, yf, bend, n=24):   # across a box at height yf, bend > 0 sags down, < 0 rises
    w_, h_ = b[2] - b[0], b[3] - b[1]; out = []
    for i in range(n + 1):
        t = i / n; x = b[0] + w_ * (.08 + .84 * t); y = b[1] + h_ * yf + bend * h_ * (1 - (2 * t - 1) ** 2); out.append((x, y))
    return out
def ellipse(img, cx, cy, rx, ry, col, edge):
    d = np.hypot((xx - cx) / max(rx, 1), (yy - cy) / max(ry, 1)); al = np.clip((1 - d) * max(rx, ry), 0, 1)[..., None]
    img[..., :3] = img[..., :3] * (1 - al) + np.array(col) * al; img[..., 3:] = np.maximum(img[..., 3:], al)
    ring = np.clip(1 - abs(d - 1) * max(rx, ry) / 1.2, 0, 1)[..., None]; img[..., :3] = img[..., :3] * (1 - ring) + np.array(edge) * ring
def shift_iris(img, b, frac):
    out = img.copy(); w_ = b[2] - b[0]; dx = int(round(w_ * frac)); y0 = int(b[1] + (b[3] - b[1]) * .3); y1 = b[3]
    sub = img[y0:y1, b[0]:b[2]]; v = sub[..., :3].max(-1); sat = (v - sub[..., :3].min(-1)) / np.maximum(v, 1e-4)
    hh_, ww_ = sub.shape[:2]; ey, ex = np.mgrid[0:hh_, 0:ww_]
    inside = (((ex - ww_ / 2) / (ww_ * .42)) ** 2 + ((ey - hh_ * .45) / (hh_ * .55)) ** 2) < 1   # within the eye opening only
    eyewhite = (v > .8) & (sat < .2) & inside
    iris = ((v < .7) | (sat > .3)) & (sub[..., 3] > .5) & inside & ~eyewhite & ~skin_mask(sub)
    o = out[y0:y1, b[0]:b[2]]; o[iris, :3] = EW
    ys, xs = np.nonzero(iris); xs2 = np.clip(xs + dx, 0, w_ - 1); ok = (eyewhite[ys, xs2] | iris[ys, xs2]) & inside[ys, xs2]
    o[ys[ok], xs2[ok], :3] = sub[ys[ok], xs[ok], :3]
    return out
lw = max(1.6, H_ * .012)
M = {}
M['smile'] = base.copy()
im = base.copy()
for b in eyes.values(): shut(im, grow(b)); stroke(im, arc(b, .62, .16), lash, lw)
M['blink'] = im
im = base.copy()
for b in eyes.values(): shut(im, grow(b), 0, .55); stroke(im, arc(b, .5, -.06), lash, lw)
M['half'] = im
im = base.copy()
for b in eyes.values(): shut(im, grow(b)); stroke(im, arc(b, .7, -.32), lash, lw)
M['happy'] = im
def mouth_o(im, big):
    if not mouth: return im
    erase(im, mouth); cx, cy = (mouth[0] + mouth[2]) / 2, (mouth[1] + mouth[3]) / 2; mw = mouth[2] - mouth[0]
    ellipse(im, cx, cy + (mouth[3] - mouth[1]) * .2, mw * (.17 if not big else .24), mw * (.15 if not big else .19), np.array([.80, .42, .45]), np.clip(lip * .95, 0, 1)); return im   # (owner: no black lips) a soft rose mouth, like the game's own faces
M['surprised'] = mouth_o(base.copy(), False)
im = base.copy()
if mouth: erase(im, mouth); mb = [mouth[0] + (mouth[2] - mouth[0]) * .15, mouth[1], mouth[2] - (mouth[2] - mouth[0]) * .15, mouth[3]]; stroke(im, arc(mb, .75, -.45), lip * .8, lw * 1.1)
for b in eyes.values(): erase(im, b, 0, .18)
M['sad'] = im
im = base.copy()
for b in eyes.values(): im = shift_iris(im, b, .16)
M['lookL'] = im
im = base.copy()
for b in eyes.values(): im = shift_iris(im, b, -.16)
M['lookR'] = im
im = M['happy'].copy(); M['excited'] = mouth_o(im, True)
ORDER = ['smile', 'blink', 'half', 'happy', 'surprised', 'sad', 'lookL', 'lookR', 'excited']
for k in M: M[k][M[k][..., 3] < .02, :3] = 0
atlas = np.zeros((TILE * 3, TILE * 3, 4), np.float32)
for i, k in enumerate(ORDER):
    r, cc = divmod(i, 3); atlas[r * TILE:(r + 1) * TILE, cc * TILE:(cc + 1) * TILE] = M[k]
aimg = bpy.data.images.new(ID + '-face', TILE * 3, TILE * 3, alpha=True); aimg.pixels.foreach_set(atlas[::-1].reshape(-1)); aimg.update()
aimg.filepath_raw = os.path.join(RDIR, 'face-atlas.png'); aimg.file_format = 'PNG'; aimg.save()

# one face layer per mood, each looking at its own tile of the shared picture
fmat = {}
moods = []
for i, k in enumerate(ORDER):
    r, cc = divmod(i, 3)
    o = decal.copy(); o.data = decal.data.copy(); o.name = 'face-' + k; sc.collection.objects.link(o)
    for lp in o.data.uv_layers[0].data:
        u, v = lp.uv; lp.uv = ((cc + u) / 3, (2 - r + v) / 3)
    m = bpy.data.materials.new('face-' + k); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = aimg
    nt.links.new(t.outputs['Color'], bs.inputs['Base Color']); nt.links.new(t.outputs['Alpha'], bs.inputs['Alpha'])
    bs.inputs['Roughness'].default_value = 1
    m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    o.data.materials.clear(); o.data.materials.append(m); moods.append(o)
bpy.data.objects.remove(decal, do_unlink=True)

# Meshy sculpts the eyes as bulges in sockets: under a closed lid (blink, happy, sleep) they would show as an oval
# crease. The face surface inside the eye areas is smoothed flat, and the face layers are laid back onto it.
def wbox(b, pad):   # a box in face-picture pixels -> world x/z ranges
    xa = fx0 + (b[0] - pad) / W_ * (fx1 - fx0); xb = fx0 + (b[2] + pad) / W_ * (fx1 - fx0)
    za = fz1 - (b[3] + pad) / H_ * (fz1 - fz0); zb = fz1 - (b[1] - pad) / H_ * (fz1 - fz0); return xa, xb, za, zb
EYEBOX = [wbox(b, 8) for b in eyes.values()]
if EYEBOX:
    from mathutils.bvhtree import BVHTree
    bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
    ev = [v for v in bm.verts if v.co.y < 0 and any(xa <= v.co.x <= xb and za <= v.co.z <= zb for xa, xb, za, zb in EYEBOX)]
    for _ in range(25): bmesh.ops.smooth_vert(bm, verts=ev, factor=.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update(); bm.to_mesh(body.data); bm.free(); body.data.update()
    tree = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    for o in moods:
        for v in o.data.vertices:
            hit = tree.find_nearest(v.co)
            if hit[0] is not None: v.co = hit[0] + hit[1] * .003
    print('FIT eye sockets smoothed', len(ev), 'vertices')

# the face layers as a fine even grid laid onto the face (a copy of a coarse or remeshed face's own triangles folds over
# the eyes and shows as shards): rays from the front onto the body; the same picture coordinates as before
from mathutils.bvhtree import BVHTree
_btree = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
_otree = BVHTree.FromObject(moods[0], bpy.context.evaluated_depsgraph_get()) if moods else None   # the old layer's outline
GN = 44 if TEX else 24   # (9 moods share the size: light model small enough for phones)
gx = np.linspace(fx0, fx1, GN + 1); gz = np.linspace(fz0, fz1, GN + 1); gp = {}
EYEW = [wbox(b, 14) for b in eyes.values()]   # the eye areas: one smooth lid surface over each socket, not its folds
ineye = lambda x_, z_: any(xa <= x_ <= xb and za <= z_ <= zb for xa, xb, za, zb in EYEW)
Yg = np.full((GN + 1, GN + 1), np.nan); want = np.zeros((GN + 1, GN + 1), bool); Yhit = np.full((GN + 1, GN + 1), np.inf)
for i_, x_ in enumerate(gx):
    for j_, z_ in enumerate(gz):
        h_ = _btree.ray_cast(Vector((x_, -2, z_)), Vector((0, 1, 0)))
        if ineye(x_, z_):
            if h_[0] is not None: want[i_, j_] = True; Yhit[i_, j_] = h_[0].y   # filled from the rim below
            continue
        if h_[0] is not None and h_[1].y < -.05:
            near = _otree.find_nearest(h_[0]) if _otree else (h_[0], None, None, 0)
            if near[0] is not None and near[3] < .012: Yg[i_, j_] = h_[0].y; want[i_, j_] = True
# holes inside the face's outline (the sides of the nose and the inner eye corners face sideways, so the old layer had
# none there) are filled too: any grid point the outside cannot reach without crossing the face
_out = np.zeros_like(want); _st = [(i_, j_) for i_ in range(GN + 1) for j_ in (0, GN)] + [(i_, j_) for i_ in (0, GN) for j_ in range(GN + 1)]
while _st:
    i_, j_ = _st.pop()
    if not (0 <= i_ <= GN and 0 <= j_ <= GN) or _out[i_, j_] or want[i_, j_]: continue
    _out[i_, j_] = True; _st += [(i_ + 1, j_), (i_ - 1, j_), (i_, j_ + 1), (i_, j_ - 1)]
_holes = ~want & ~_out; want |= _holes; print('FIT face layer holes filled', int(_holes.sum()))
for _ in range(200):   # each eye's points take the mean depth of their filled neighbours, from the rim inwards
    miss = want & np.isnan(Yg)
    if not miss.any(): break
    P = np.pad(Yg, 1, constant_values=np.nan); nb = np.stack([P[:-2, 1:-1], P[2:, 1:-1], P[1:-1, :-2], P[1:-1, 2:]])
    cnt = (~np.isnan(nb)).sum(0); s_ = np.nansum(nb, 0); fill = miss & (cnt > 0); Yg[fill] = s_[fill] / cnt[fill]
if not ORIGINAL:   # (with an opaque layer the body is pushed behind it instead, so the lids stay smooth)
    Yg = np.where(np.isfinite(Yhit), np.fmin(Yg, Yhit - .002), Yg)   # never behind the body (the nose bridge, the eye rims)
# smooth cheeks: the grid follows the coarse model's flat facets, which shade as patches; its depth is softened
# (a few averaging passes; the body is then pushed behind it, so nothing crosses)
for _ in range(12):
    P = np.pad(Yg, 1, constant_values=np.nan); nb = np.stack([P[:-2, 1:-1], P[2:, 1:-1], P[1:-1, :-2], P[1:-1, 2:], P[1:-1, 1:-1]])
    cnt = (~np.isnan(nb)).sum(0); sm = np.nansum(nb, 0) / np.maximum(cnt, 1)
    Yg = np.where(np.isnan(Yg), Yg, np.where(cnt >= 4, sm, Yg))
for i_ in range(GN + 1):
    for j_ in range(GN + 1):
        if want[i_, j_] and not np.isnan(Yg[i_, j_]): gp[(i_, j_)] = (Vector((gx[i_], Yg[i_, j_] - .003, gz[j_])), None)
for k_, o in enumerate(moods):
    r_, cc_ = divmod(k_, 3); bmg = bmesh.new(); vv = {}
    for key, (co, _n) in gp.items(): vv[key] = bmg.verts.new(co)
    for i_ in range(GN):
        for j_ in range(GN):
            q = [(i_, j_), (i_ + 1, j_), (i_ + 1, j_ + 1), (i_, j_ + 1)]
            if all(x in vv for x in q) and max(abs(vv[a_].co.y - vv[b_].co.y) for a_ in q for b_ in q) < .09:   # (only real cliffs, at the face's outline, are left open)
                try: bmg.faces.new([vv[x] for x in q])
                except ValueError: pass
    uvg = bmg.loops.layers.uv.new('UVMap')
    for f in bmg.faces:
        f.smooth = True
        for l in f.loops:
            u_ = (l.vert.co.x - fx0) / (fx1 - fx0); v_ = (l.vert.co.z - fz0) / (fz1 - fz0)
            l[uvg].uv = ((cc_ + min(1, max(0, u_))) / 3, (2 - r_ + min(1, max(0, v_))) / 3)
    bmesh.ops.triangulate(bmg, faces=bmg.faces[:])
    mats_ = list(o.data.materials); bmg.to_mesh(o.data); bmg.free()
    o.data.materials.clear()
    for m_ in mats_: o.data.materials.append(m_)
print('FIT face layer rebuilt as a grid', len(gp), 'points', len(moods[0].data.polygons) if moods else 0, 'triangles')
if ORIGINAL and moods:   # (opaque face layer) any body point in front of it, or nearly, goes just behind it: no facet pokes through
    _lt = BVHTree.FromObject(moods[0], bpy.context.evaluated_depsgraph_get()); _np = 0
    for v in body.data.vertices:
        if v.co.y > .05 or not (fx0 - .01 < v.co.x < fx1 + .01 and fz0 - .01 < v.co.z < fz1 + .01): continue
        h_ = _lt.ray_cast(Vector((v.co.x, -2, v.co.z)), Vector((0, 1, 0)))
        if h_[0] is not None and v.co.y < h_[0].y + .004: v.co.y = h_[0].y + .004; _np += 1
    body.data.update(); print('FIT body points moved behind the face layer', _np)
if KEEP:
    for p in body.data.polygons: p.use_smooth = True   # (Meshy's remesh: soft shading, not flat facets)

# ---- skin: its own part, the painted shading kept in the corner colours (times the child's skin tone)
me = body.data
col = me.color_attributes.new('Color', 'BYTE_COLOR', 'CORNER'); me.color_attributes.active_color = col
uv = me.uv_layers[0].data
col = me.color_attributes['Color']
skinm = bpy.data.materials.new('skin-shade'); clothm = bpy.data.materials.new('cloth-body')
me.materials.clear(); me.materials.append(clothm); me.materials.append(skinm)
nskin = 0
for p in me.polygons:
    cs = [sample(CA, *uv[li].uv) for li in p.loop_indices]; avg = np.mean(cs, axis=0)
    infaceregion = p.index in FACEF
    pc = p.center
    hairzone = pc.z > L['neck'].z + .02 and not (abs(pc.x) < .17 and pc.z < fz1 and pc.y < .02)   # above the neck only the face, ears and neck are skin
    # below the neck the only bare skin is the neck itself, the forearms and the hands (not the pale skirt trim or the blouse)
    sd_ = 'L' if pc.x >= 0 else 'R'; hand_ = L['wrist' + sd_] + (L['wrist' + sd_] - L['elbow' + sd_]) * 1.7
    ab_ = hand_ - L['shoulder' + sd_]; t_ = max(0, min(1, (pc - L['shoulder' + sd_]).dot(ab_) / ab_.length_squared))
    armzone = abs(pc.x) > abs(L['shoulderL'].x) + .04 and (L['shoulder' + sd_] + ab_ * t_ - pc).length < .11   # close to the arm itself, not the flared skirt
    neckzone = pc.z > L['neck'].z - .06 and abs(pc.x) < .1
    zone = (pc.z > L['neck'].z + .02 and not hairzone) or armzone or neckzone
    # below the face, cream and ivory cloth (sleeves, collars) can sit in the skin hue range: skin there needs more colour
    isskin = (not ORIGINAL) and (infaceregion or (zone and bool(skin_mask(avg[None])[0]) and (pc.z > L['neck'].z + .02 or hsv(avg)[1] > .2)))
    p.material_index = 1 if isskin else 0; nskin += isskin
    for li, cv in zip(p.loop_indices, cs):
        if isskin:
            r_ = np.clip(cv / REF, 0, 1) if bool(skin_mask(cv[None])[0]) else np.ones(3)
            col.data[li].color = (*r_, 1)
        else: col.data[li].color_srgb = (*cv, 1) if TEX == 0 else (1, 1, 1, 1)   # light model: the clothes' colour in the corners, no picture
print('FIT skin faces', nskin, 'of', len(me.polygons))
SKIN_TEX = TEX > 0 and not ORIGINAL   # (original_skin: no skin part at all)
CLEAR_FACE = TEX > 0 and not ORIGINAL   # (an opaque face layer needs no clearing underneath)
# the high-detail model keeps Meshy's painted skin ("skin-tex"); the light one its corner colours
def uv_texels(polys, shape):   # texels covered by these faces' UV triangles
    hh, ww = shape; out = np.zeros((hh, ww), bool)
    for p in polys:
        uvs = np.array([uv[li].uv[:] for li in p.loop_indices], np.float32)
        if len(uvs) != 3 or not np.isfinite(uvs).all(): continue
        P_ = uvs * [ww, hh]; x0, y0 = np.floor(P_.min(0)).astype(int) - 1; x1, y1 = np.ceil(P_.max(0)).astype(int) + 1
        x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(ww, x1), min(hh, y1)
        if x1 <= x0 or y1 <= y0: continue
        gy, gx = np.mgrid[y0:y1, x0:x1] + .5; (ax, ay), (bx, by), (cx, cy) = P_
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-9: continue
        l1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / den; l2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / den
        out[y0:y1, x0:x1] |= (l1 >= -.05) & (l2 >= -.05) & (1 - l1 - l2 >= -.05)
    return out
if CLEAR_FACE:
    # under the face layer the painted skin must be plain skin: Meshy's painted eyes, lashes, brows and mouth there are
    # filled from the skin around them (otherwise they show through a blink)
    A_ = px(colour); fm = uv_texels([me.polygons[i] for i in FACEF], A_.shape[:2])
    hA, sA, Vv = hsv_np(A_[..., :3])
    # the features: dark lines (lashes, brows), lip red; and everything inside the eye and mouth boxes the face layer
    # found (iris, whites, lids), by position; the nose and blush stay painted
    paint = fm & ((Vv < .55) | (((hA < .03) | (hA > .95)) & (sA > .38) & (Vv < .82)))
    def wbox(b, pad):   # a box in face-picture pixels -> world x/z ranges
        xa = fx0 + (b[0] - pad) / W_ * (fx1 - fx0); xb = fx0 + (b[2] + pad) / W_ * (fx1 - fx0)
        za = fz1 - (b[3] + pad) / H_ * (fz1 - fz0); zb = fz1 - (b[1] - pad) / H_ * (fz1 - fz0); return xa, xb, za, zb
    boxes = [wbox(b, 11) for b in eyes.values()] + ([wbox(mouth, 5)] if mouth else [])   # wide enough for the lashes and eye rims
    inbox = [me.polygons[i] for i in FACEF if any(xa <= me.polygons[i].center.x <= xb and za <= me.polygons[i].center.z <= zb for xa, xb, za, zb in boxes)]
    _ib = uv_texels(inbox, A_.shape[:2]); paint |= _ib
    print('FIT eye/mouth texels', int(_ib.sum()), 'example uv', [tuple(round(x, 4) for x in uv[li].uv) for li in inbox[0].loop_indices] if inbox else None)
    fc =np.array([me.polygons[i].center[:] for i in FACEF]) if FACEF else np.zeros((0, 3))
    print('FIT face-layer boxes', [tuple(round(x, 3) for x in bx) for bx in boxes], 'face tris', len(FACEF), 'in boxes', len(inbox),
          'face x', fc[:, 0].min().round(3) if len(fc) else None, fc[:, 0].max().round(3) if len(fc) else None, 'z', fc[:, 2].min().round(3) if len(fc) else None, fc[:, 2].max().round(3) if len(fc) else None)
    # filled with her own face skin (the median of the face's skin texels), not from neighbours (lashes would smear in)
    skin_px = A_[fm & ~paint & skin_mask(A_)][:, :3]; med = np.median(skin_px, axis=0) if len(skin_px) else REF
    A_[paint, :3] = med; A_[paint, 3] = 1; colour.pixels.foreach_set(A_.ravel()); colour.update()
    colour.save(); print('FIT painted face features cleared under the face layer', int(paint.sum()), 'with', np.round(med, 3))
def hsvs(sel):
    cs = np.array([np.mean([sample(CA, *uv[li].uv) for li in p.loop_indices], axis=0) for p in me.polygons if sel(p)])
    return np.round(np.median(np.array([hsv(x) for x in cs]), axis=0), 3) if len(cs) else None
print('FIT hsv hair', hsvs(lambda p: p.center.z > L['top'].z - .08), 'hands', hsvs(lambda p: abs(p.center.x) > .36), 'skin-faces', hsvs(lambda p: p.material_index == 1))
for m_, img in (((clothm, colour),) if TEX else ()):
    m_.use_nodes = True; nt = m_.node_tree; bs = nt.nodes['Principled BSDF']; t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
    nt.links.new(t.outputs['Color'], bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = 1
skinm.use_nodes = True; nt = skinm.node_tree; bs = nt.nodes['Principled BSDF']
if SKIN_TEX:
    skinm.name = 'skin-tex'; skinm['skin_ref'] = '#%02x%02x%02x' % tuple(int(round(min(1, max(0, float(x))) * 255)) for x in REF)
    at = nt.nodes.new('ShaderNodeTexImage'); at.image = colour; at.name = 'skinpic'
else:
    at = nt.nodes.new('ShaderNodeVertexColor'); at.layer_name = 'Color'
tone = nt.nodes.new('ShaderNodeRGB'); tone.name = 'tone'
tone.outputs[0].default_value = (1, 1, 1, 1) if SKIN_TEX else (0.92, 0.6, 0.45, 1); mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1
nt.links.new(at.outputs['Color'], mul.inputs[6]); nt.links.new(tone.outputs[0], mul.inputs[7]); nt.links.new(mul.outputs[2], bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = 1
if TEX == 0:
    clothm.use_nodes = True; nt = clothm.node_tree; bs = nt.nodes['Principled BSDF']; vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Color'
    nt.links.new(vc.outputs['Color'], bs.inputs['Base Color']); bs.inputs['Roughness'].default_value = 1
bpy.data.objects.remove(high, do_unlink=True)

# ---- 4. the game's joints, region weights (as round 1), the face layers on the head
arm = bpy.data.armatures.new('rig'); rigo = bpy.data.objects.new('rig', arm); sc.collection.objects.link(rigo)
activate(rigo); bpy.ops.object.mode_set(mode='EDIT'); E = arm.edit_bones
def bone(n, h, t, parent=None, connect=False):
    b = E.new(n); b.head, b.tail = h, t
    if parent: b.parent = E[parent]; b.use_connect = connect
z0 = Vector((0, 0, GAME_FEET))
bone('root', z0, L['hip']); bone('torso', L['hip'], L['neck'], 'root')
bone('head', L['neck'], L['neck'] + (L['top'] - L['neck']) * HEAD_S, 'torso')
for sd in 'LR':
    bone('arm' + sd, L['shoulder' + sd], L['elbow' + sd], 'torso')
    bone('elbow' + sd, L['elbow' + sd], L['wrist' + sd] + (L['wrist' + sd] - L['elbow' + sd]) * .5, 'arm' + sd, True)
    bone('leg' + sd, L['hip' + sd], L['knee' + sd], 'root'); bone('knee' + sd, L['knee' + sd], L['ankle' + sd], 'leg' + sd, True)
bpy.ops.object.mode_set(mode='OBJECT')
def seg(p, a_, b_):
    ab = b_ - a_; t = max(0, min(1, (p - a_).dot(ab) / ab.length_squared)); return (a_ + ab * t - p).length, t
groups = {b.name: body.vertex_groups.new(name=b.name) for b in arm.bones}
neckZ, hipZ = L['neck'].z, L['hip'].z; ARM_R, LEG_R = .121, .075
nbr = [[] for _ in me.vertices]
for e in me.edges: a_, b_ = e.vertices; nbr[a_].append(b_); nbr[b_].append(a_)
LEATHER = [False] * len(me.vertices)   # brown leather (the satchel, the straps): darker, saturated orange-brown
uvb = me.uv_layers[0].data
for p in me.polygons:
    for li in p.loop_indices:
        vi = me.loops[li].vertex_index; cv = sample(CA, *uvb[li].uv); h_, s__, v_ = hsv(cv)
        if v_ < .62 and s__ > .3 and .03 < h_ < .14: LEATHER[vi] = True
        if KEEP and (h_ < .09 or h_ > .97) and s__ > .42 and v_ > .45: LEATHER[vi] = True   # (the braids hang by the arms: never part of an arm)
print('FIT leather verts', sum(LEATHER))
ARMV = {}
for sd in 'LR':
    sh, el, wr = L['shoulder' + sd], L['elbow' + sd], L['wrist' + sd]; hand = wr + (wr - el) * 1.7
    sx = 1 if sd == 'L' else -1; wall = abs(sh.x) + .03
    elbow_t = (el - sh).length / (hand - sh).length
    # the satchel on this side: the box round the leather below the elbow and inside the arm's reach (never part of the arm)
    bag = [me.vertices[i].co for i in range(len(me.vertices)) if LEATHER[i] and L['hip'].z - .15 < me.vertices[i].co.z < wr.z + .03 and .12 < sx * me.vertices[i].co.x < abs(wr.x) - .02]
    BAG = (Vector((min(v.x for v in bag), min(v.y for v in bag), min(v.z for v in bag))) - Vector((.015,) * 3),
           Vector((max(v.x for v in bag), max(v.y for v in bag), max(v.z for v in bag))) + Vector((.015,) * 3)) if len(bag) > 20 else None
    print('FIT bag', sd, len(bag), BAG and [tuple(round(x, 3) for x in BAG[0]), tuple(round(x, 3) for x in BAG[1])])
    inbag = lambda p, BAG=BAG: BAG is not None and all(BAG[0][k] <= p[k] <= BAG[1][k] for k in range(3))
    def ok(p, j, sh=sh, hand=hand, sx=sx, wall=wall, elbow_t=elbow_t, inbag=inbag):   # the whole puffed sleeve and hand, never the satchel
        d, t = seg(p, sh, hand); return sx * p.x > wall and d < .2 and not LEATHER[j] and (t < elbow_t or not inbag(p))
    seen = [i for i, v in enumerate(me.vertices) if not LEATHER[i] and (sx * v.co.x > wall + .03 and seg(v.co, sh, hand)[0] < .06) or sx * v.co.x > .37]
    got = set(seen)
    while seen:
        nxt = []
        for i in seen:
            for j in nbr[i]:
                if j not in got and ok(me.vertices[j].co, j): got.add(j); nxt.append(j)
        seen = nxt
    for i in got: ARMV[i] = sd
for v in me.vertices:
    p = v.co; side = 'L' if p.x >= 0 else 'R'
    sh, el, wr = L['shoulder' + side], L['elbow' + side], L['wrist' + side]; hand = wr + (wr - el) * 1.7; da, _ = seg(p, sh, hand); lx = L['knee' + side].x
    if p.z >= neckZ + .02: W = {'head': 1}
    elif p.z < L['knee' + side].z + .05 and abs(p.x - lx) < .13:
        W = {'knee' + side: 1} if p.z < L['knee' + side].z - .04 else {'leg' + side: .5, 'knee' + side: .5}
    elif v.index in ARMV or (not LEATHER[v.index] and abs(p.x) >= .15 and abs(p.x) <= abs(sh.x) + .03 and da < ARM_R):
        t = (p - sh).dot((hand - sh).normalized()) / (el - sh).length; k = max(0, min(1, (t - .85) / .3))
        W = {'arm' + side: 1 - k, 'elbow' + side: k}
        if t < .15: W = {'arm' + side: .7, 'torso': .3}
    elif p.z >= neckZ - .06 and abs(p.x) < .15:
        k = (p.z - (neckZ - .06)) / .08; W = {'head': k, 'torso': 1 - k}
    elif p.z < hipZ:
        dl, _ = seg(p, L['hip' + side], L['ankle' + side]); kn = L['knee' + side].z; legk = max(0, min(1, (kn + .04 - p.z) / .08))
        leg = {'leg' + side: 1 - legk, 'knee' + side: legk}
        if dl < LEG_R: W = leg
        else: f = max(0, 1 - (dl - LEG_R) / .12) * .5; W = {k_: f * w_ for k_, w_ in leg.items()}; W['root'] = 1 - f
    else: W = {'torso': 1}
    for n, w_ in W.items():
        if w_ > 0: groups[n].add([v.index], w_, 'REPLACE')
if KEEP:   # (remesh: a clean closed surface) Blender's automatic bone-heat weights, the standard way: smooth across the
    # shoulders, armpits and hips, so nothing tears when an arm lifts. The hair keeps the region weights (head and
    # torso only: braids lying by the arms must not follow them), and any point bone heat missed keeps them too.
    region = [{g.group: g.weight for g in v.groups} for v in me.vertices]
    HAIRV = [False] * len(me.vertices)
    for p in me.polygons:
        for li in p.loop_indices:
            h_, s__, v_ = hsv(sample(CA, *uvb[li].uv))
            if (h_ < .09 or h_ > .97) and s__ > .42 and v_ > .45: HAIRV[me.loops[li].vertex_index] = True
    for g in list(body.vertex_groups): g.remove(list(range(len(me.vertices))))
    bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); rigo.select_set(True); VL.objects.active = rigo
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    for m_ in [m_ for m_ in body.modifiers if m_.type == 'ARMATURE']: body.modifiers.remove(m_)
    mw_ = body.matrix_world.copy(); body.parent = None; body.matrix_world = mw_
    nmiss = 0
    for v in me.vertices:
        tot = sum(g.weight for g in v.groups)
        if HAIRV[v.index] or tot < .05:
            nmiss += not HAIRV[v.index]
            for g in body.vertex_groups: g.remove([v.index])
            for gi_, w_ in region[v.index].items(): body.vertex_groups[gi_].add([v.index], w_, 'REPLACE')
    print('FIT bone-heat weights; hair kept on region weights', sum(HAIRV), 'missed', nmiss)
    activate(body); bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
    for gname in ('armL', 'armR', 'torso', 'elbowL', 'elbowR'):
        body.vertex_groups.active_index = body.vertex_groups[gname].index
        bpy.ops.object.vertex_group_smooth(group_select_mode='ACTIVE', factor=.5, repeat=12, expand=.3)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    bpy.ops.object.mode_set(mode='OBJECT'); print('FIT shoulder weights smoothed')
# where Meshy fused a sleeve to what it touched (the satchel under the right arm), triangles join an arm point to a
# body point outside the shoulder seam: they would stretch into a sheet when the arm lifts, so they go
gi = {g.name: g.index for g in body.vertex_groups}
def armw(v, sd): return sum(g.weight for g in v.groups if g.group in (gi['arm' + sd], gi['elbow' + sd]))
cut = []
for p in me.polygons:
    vs = [me.vertices[i] for i in p.vertices]
    for sd, sx in (('L', 1), ('R', -1)):
        ws = [armw(v, sd) for v in vs]; wall = abs(L['shoulder' + sd].x) + .03
        if max(ws) > .9 and min(ws) < .1 and all(sx * v.co.x > wall for v in vs): cut.append(p.index); break
if KEEP: cut = []   # (a Meshy remesh is clean: nothing fused to cut; cutting tore the braids and sleeves)
bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.faces[i] for i in cut], context='FACES_ONLY'); bm.to_mesh(me); bm.free()
print('FIT cut fused triangles', len(cut))
# then a stretch test: pose the arms (up, forward, back) and drop any triangle that stretches to over 2.5x (a fused bridge)
tm = body.modifiers.new('test', 'ARMATURE'); tm.object = rigo
rest = [v.co.copy() for v in me.vertices]; bad = set()
for up in ((.55, -.15, .82), (.15, -.95, .2), (.15, .9, -.3), (.95, 0, .1)):
    for sd, sx in (('L', 1), ('R', -1)):
        pb = rigo.pose.bones['arm' + sd]; h = pb.bone.head_local; cur = (pb.bone.tail_local - h).normalized()
        tgt = Vector((sx * up[0], up[1], up[2])).normalized()
        pb.matrix = Matrix.Translation(h) @ cur.rotation_difference(tgt).to_matrix().to_4x4() @ Matrix.Translation(-h) @ pb.bone.matrix_local
    VL.update(); ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh(); pos = [v.co.copy() for v in ev.vertices]; body.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
    for p in me.polygons:
        vi = list(p.vertices)
        for a_, b_ in zip(vi, vi[1:] + vi[:1]):
            r0 = (rest[a_] - rest[b_]).length; r1 = (pos[a_] - pos[b_]).length
            if r1 > .025 and r1 > 2.5 * max(r0, 1e-4):
                # (remesh) the shoulder caps and sleeve backs stretch with the arm as they should; only the bridges under
                # the arm (sleeve to dress, at the front and sides below the armpit) are cut
                if KEEP: break   # (remesh: never cut; the weights are smooth instead)
                bad.add(p.index); break
for pb in rigo.pose.bones: pb.matrix_basis = Matrix()
body.modifiers.remove(tm); VL.update()
if KEEP: print('FIT stretching triangles (remesh)', len(bad))
bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.faces[i] for i in sorted(bad)], context='FACES_ONLY'); bm.to_mesh(me); bm.free()
print('FIT stretch-cut triangles', len(bad))
for o in moods:
    g = o.vertex_groups.new(name='head'); g.add(list(range(len(o.data.vertices))), 1, 'REPLACE')
# a bigger head (toward the game's style, and a face that reads at a distance)
neck = L['neck']; hg = groups['head'].index
for v in me.vertices:
    w = next((g.weight for g in v.groups if g.group == hg), 0)
    if w: v.co = neck + (v.co - neck) * (1 + (HEAD_S - 1) * w)
for o in moods:
    for v in o.data.vertices: v.co = neck + (v.co - neck) * HEAD_S
for o in [body] + moods:
    o.parent = rigo; m_ = o.modifiers.new('Armature', 'ARMATURE'); m_.object = rigo
# the arms down to the game's rest angle
activate(rigo); bpy.ops.object.mode_set(mode='POSE')
for sd, sx in ((() if ARM_DEG < 0 else (('L', 1), ('R', -1)))):   # (arm deg < 0: keep the model's own arm angle; the runtime copies turns from each rest pose)
    tgt = Vector((sx * math.sin(math.radians(ARM_DEG)), 0, -math.cos(math.radians(ARM_DEG))))
    pb = rigo.pose.bones['arm' + sd]; cur = (L['wrist' + sd] - L['shoulder' + sd]).normalized()
    R = cur.rotation_difference(tgt).to_matrix().to_4x4(); h = pb.bone.head_local
    pb.matrix = Matrix.Translation(h) @ R @ Matrix.Translation(-h) @ pb.bone.matrix_local
VL.update(); bpy.ops.object.mode_set(mode='OBJECT')
for o in [body] + moods:
    activate(o); bpy.ops.object.modifier_apply(modifier='Armature')
activate(rigo); bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
for o in [body] + moods:
    m_ = o.modifiers.new('Armature', 'ARMATURE'); m_.object = rigo

# ---- export
sc.render.image_settings.quality = 72
jp = os.path.join(RDIR, 'colour.jpg')
if os.path.exists(jp): os.remove(jp)
if TEX:
    colour.scale(TEX, TEX); colour.file_format = 'JPEG'; colour.save(filepath=jp, quality=62)
    jimg = bpy.data.images.load(jp); jimg.name = ID + '-colour'
    for m_ in (clothm, skinm):
        for n in m_.node_tree.nodes:
            if n.type == 'TEX_IMAGE': n.image = jimg
print('FIT colour jpg', os.path.exists(jp) and os.path.getsize(jp))
bpy.ops.object.select_all(action='DESELECT')
for o in [rigo, body] + moods: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_morph=False,
                          export_yup=True, export_image_format='AUTO', export_vertex_color='ACTIVE', export_extras=True)
print('FIT exported', OUT, os.path.getsize(OUT))
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + '.blend')

# ---- check renders: two skin tones, and the face in each mood
sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x, sc.render.resolution_y = 600, 900
sc.view_settings.view_transform = 'Standard'; sc.render.film_transparent = False
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.91, 0.88, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .6
for rot, en in (((math.radians(50), 0, math.radians(30)), 3.0), ((math.radians(60), 0, math.radians(200)), 1.5)):
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = en; lo_ = bpy.data.objects.new('sun', l); lo_.rotation_euler = rot; sc.collection.objects.link(lo_)
cam = bpy.data.cameras.new('cam'); cam.type = 'ORTHO'; co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
def show(mood):
    for o in moods: o.hide_render = o.name != 'face-' + mood
def shoot(name, ang, zc, scale, rx=600, ry=900):
    sc.render.resolution_x, sc.render.resolution_y = rx, ry; cam.ortho_scale = scale
    co.location = (10 * math.sin(math.radians(ang)), -10 * math.cos(math.radians(ang)), zc); co.rotation_euler = (math.radians(90), 0, math.radians(ang))
    sc.render.filepath = os.path.join(RDIR, name + '.png'); bpy.ops.render.render(write_still=True)
show('smile'); full = GAME_H * 1.12
shoot('tone-default', 0, GAME_FEET + full / 2.2, full * 1.05)
skinm.node_tree.nodes['tone'].outputs[0].default_value = (0.32, 0.17, 0.10, 1)
shoot('tone-dark', 0, GAME_FEET + full / 2.2, full * 1.05)
skinm.node_tree.nodes['tone'].outputs[0].default_value = (0.92, 0.6, 0.45, 1)
headc = neck.z + (L['top'].z - neck.z) * HEAD_S * .45
for k in ORDER:
    show(k); shoot('mood-' + k, 0, headc, .42 * HEAD_S, 400, 400)
show('smile'); shoot('mood-three-quarter', 30, headc, .42 * HEAD_S, 400, 400)
print('FIT done')








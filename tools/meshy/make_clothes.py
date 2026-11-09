# (Meshy production, 8 Nov 2026; owner: "Body + code-made clothes") Clothes made from a Meshy body's own surface.
#   blender -b -P tools/meshy/make_clothes.py -- <fitted rigged .blend from transfer_rig.py> <out.glb> [<render dir>]
# The body (ChatGPT body sheet -> Meshy -> fit_person.ps1) wears a plain grey T-shirt and shorts, bare feet. Each garment
# here is a shell over part of the body: the body's own triangles in that part (grey clothes and skin, never hair: the
# braids and leaf hair stay outside), pushed out along the surface and smoothed, keeping the body's joint weights so it
# bends with it. Skirts and the áo dài's long panels are cones hung from the waist. The shading Meshy painted on the grey
# shirt and shorts (folds, shade) is kept in each shell's corner colours (grey: 1 = as lit); the game gives each part its
# colour (js/friend-model.ts GARMENTS), so any outfit colour works. Meshes are named "lit-g-<part>" (drawn by their
# corner colours and own light, as the gallery villagers' "lit-" parts), all hidden until the game shows the parts of the
# outfit worn. The bare feet become "skin-feet" (always shown; shoes are a garment).
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
a = sys.argv[sys.argv.index('--') + 1:]
BLEND, OUT = a[0], a[1]; RDIR = a[2] if len(a) > 2 else None
LIGHT = '-light' in os.path.basename(OUT)
bpy.ops.wm.open_mainfile(filepath=BLEND)
sc = bpy.context.scene; VL = bpy.context.view_layer
rig = bpy.data.objects['rig']
body = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith('-body'))
feet = next((o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith('-shoes')), None)
J = {b.name: rig.matrix_world @ b.head_local for b in rig.data.bones}
# the joints this needs, from the game's 11: wrists and ankles continue the elbow and knee bones
for s in 'LR':
    J['wrist' + s] = J['elbow' + s] + (J['elbow' + s] - J['arm' + s]) * .95
    J['hand' + s] = J['wrist' + s] + (J['wrist' + s] - J['elbow' + s]) * .6
    J['ankle' + s] = J['knee' + s] + (J['knee' + s] - J['leg' + s]) * .92
NECK = J['head'].z - .01; WAIST = J['root'].z + .01; HIP = (J['legL'].z + J['legR'].z) / 2
print('CL joints neck', round(NECK, 3), 'waist', round(WAIST, 3), 'hip', round(HIP, 3), 'knee', round(J['kneeL'].z, 3), 'ankle', round(J['ankleL'].z, 3))

# ---- the painted picture: each body triangle's colour, and whether it is grey clothes, skin or neither (hair, eyes)
me = body.data; uvl = me.uv_layers.active.data
img = next(n.image for m in me.materials if m and m.use_nodes for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image)
W_, H_ = img.size; PX = np.array(img.pixels[:], np.float32).reshape(H_, W_, 4)[..., :3]
def sample(u, v): return PX[min(H_ - 1, max(0, int((v % 1) * H_))), min(W_ - 1, max(0, int((u % 1) * W_)))]
NP = len(me.polygons)
fcol = np.array([np.mean([sample(*uvl[l].uv) for l in p.loop_indices], axis=0) for p in me.polygons])
fV = fcol.max(1); fS = (fV - fcol.min(1)) / np.maximum(fV, 1e-4)
grey = (fS < .12) & (fV > .38) & (fV < .95)
skw = me.color_attributes.get('skinw')
skin = np.zeros(NP, bool)
if skw is not None:
    w = np.array([c.color[0] for c in skw.data], np.float32)
    skin = np.array([w[list(p.loop_indices)].mean() > .5 for p in me.polygons])
fc = np.array([p.center[:] for p in me.polygons])
print('CL faces', NP, 'grey', int(grey.sum()), 'skin', int(skin.sum()))
GREY_LUM = float(np.median(fV[grey])) if grey.any() else .7
SKIN_LUM = float(np.median(fV[skin])) if skin.any() else .8

# ---- where each triangle is on the body: arm (and how far down it: 0 shoulder, 1 elbow, 2 wrist), leg (0 hip, 1 knee,
# 2 ankle), torso, head
def along(P, a_, b_, c_):   # distance to the two-segment line a-b-c and the position along it (0..2)
    best = (1e9, 0.)
    for k, (p0, p1) in enumerate(((a_, b_), (b_, c_))):
        p0 = np.array(p0[:]); p1 = np.array(p1[:]); d = p1 - p0; t = np.clip(((P - p0) @ d) / max(d @ d, 1e-9), 0, 1)
        dist = np.linalg.norm(P - (p0 + t[:, None] * d), axis=1); best = (dist, k + t) if k == 0 else (np.minimum(best[0], dist), np.where(dist < best[0], k + t, best[1]))
    return best
side = np.where(fc[:, 0] >= 0, 'L', 'R')
armd = np.full(NP, 9.); armt = np.zeros(NP); legd = np.full(NP, 9.); legt = np.zeros(NP)
for s in 'LR':
    m = side == s
    d, t = along(fc[m], J['arm' + s], J['elbow' + s], J['hand' + s]); armd[m] = d; armt[m] = t * 1.0
    # (the second segment runs on to the fingertips: 1 elbow, 2 fingertips; the wrist is at about 1.6)
    d, t = along(fc[m], J['leg' + s], J['knee' + s], J['ankle' + s]); legd[m] = d; legt[m] = t
SH_X = (abs(J['armL'].x) + abs(J['armR'].x)) / 2
isarm = (armd < .09) & (armd < legd) & (np.abs(fc[:, 0]) > SH_X - .01) & (fc[:, 2] < NECK)   # (closer to the arm than the leg: a hand beside the thigh)
isleg = ~isarm & (fc[:, 2] < HIP + .02) & (legd < .14)
istorso = ~isarm & ~isleg & (fc[:, 2] < NECK + .02) & (fc[:, 2] > HIP - .16) & ((np.abs(fc[:, 0]) < SH_X + .02) | (fc[:, 2] > WAIST + .1))   # (the shoulder tops, where the collar sits, too; hands beside the hips are lower)   # (not a hand beside the hip)
# hair is never clothed: everything above the neck, and anything hanging in front of or behind the grey shirt (Clara's
# braids, Lumi's leaves on the shoulders): a ray from it towards the body's middle meets grey shirt more than 1 cm on
gbm = bmesh.new(); gv = {}
for i in np.nonzero(grey)[0]:
    p = me.polygons[int(i)]; vs = []
    for vi in p.vertices:
        if vi not in gv: gv[vi] = gbm.verts.new(me.vertices[vi].co)
        vs.append(gv[vi])
    try: gbm.faces.new(vs)
    except ValueError: pass
gtree = BVHTree.FromBMesh(gbm)
cyz = float(np.median(fc[istorso, 1])) if istorso.any() else 0.
infront = np.zeros(NP, bool)
for i in np.nonzero(~grey & (fS > .3) & ~((fS < .35) & (fV < .45)) & (fc[:, 2] < NECK) & (fc[:, 2] > HIP - .1) & ~isarm)[0]:   # (coloured hair only: the kit's collar ring and its dark shaded underside are not hair, Sol's)
    P = Vector(fc[i]); d = Vector((0, 1 if P.y < cyz else -1, 0)); h = gtree.ray_cast(P, d, .25)
    if h[0] is not None and h[3] > .01: infront[i] = True
gbm.free()
hair = ((fc[:, 2] >= NECK) & ~grey) | infront   # (the grey neckline is clothes)
_oh = me.attributes.get('own_hair')   # (graft_head.py: the swim body's own braids, Clara's, kept whole)
if _oh is not None:
    _ohv = np.zeros(NP, np.int32); _oh.data.foreach_get('value', _ohv); hair |= _ohv > 0
    print('CL own braids (graft)', int((_ohv > 0).sum()))
clothable = ~hair
print('CL hair in front of the shirt', int(infront.sum()))

# (owner review 8 Nov: a grey collar showed above every top) the kit is everything on the body that is neither skin
# (the skin marks from fitting) nor hair: its shaded parts fail the plain grey test. Tops reach 1.2 cm past its top edge.
# (owner 8 Nov 2026: Clara on her own Meshy head and braids) CL_OWN_BRAIDS marks the braids hanging in front as hair here,
# as graft_head.py does for a grafted head: hair-coloured by hue (the top of the head's colour) in front of and beside the
# neck down the chest, grown through coloured triangles that are neither skin nor grey kit (shaded strands, ties)
OWNB = np.zeros(NP, bool)   # (the braids marked here, CL_OWN_BRAIDS)
if os.environ.get('CL_OWN_BRAIDS') and me.attributes.get('own_hair') is None:
    _hc = np.median(fcol[fc[:, 2] > fc[:, 2].max() - .05], axis=0); _hcc = _hc / max(float(_hc.max()), 1e-4)
    _n0 = (fc[:, 2] > NECK - .04) & (fc[:, 2] < NECK) & ~hair
    _ax, _ay = (fc[_n0, 0].mean(), fc[_n0, 1].mean()) if _n0.any() else (0., 0.)
    _nr0 = float(np.median(np.hypot(fc[_n0, 0] - _ax, fc[_n0, 1] - _ay))) if _n0.any() else .05
    _bz = (fc[:, 2] < NECK) & (fc[:, 2] > NECK - .35) & ((fc[:, 1] < _ay - _nr0 * .5) | ((np.abs(fc[:, 0] - _ax) > _nr0 * 1.3) & (fc[:, 1] < _ay + _nr0 * .3)))
    _own = _bz & ~skin & ~grey & (fS > .25) & (np.linalg.norm(fcol / np.maximum(fV, 1e-4)[:, None] - _hcc, axis=1) < .12)
    _bmo = bmesh.new(); _bmo.from_mesh(me); _bmo.faces.ensure_lookup_table(); _st = list(np.nonzero(_own)[0])
    while _st:
        for e in _bmo.faces[int(_st.pop())].edges:
            for k in e.link_faces:
                j = k.index
                if not _own[j] and _bz[j] and not skin[j] and not grey[j] and fS[j] > .22: _own[j] = True; _st.append(j)
    _bmo.free(); hair |= _own; clothable = ~hair; OWNB = _own
    print('CL own braids (marked here)', int(_own.sum()))
kit = (~skin if skin.any() else grey) & ~hair & (fS < .3)
_kc = kit & (np.abs(fc[:, 0]) < SH_X * .7) & (fc[:, 2] > WAIST) & (fc[:, 2] < NECK + .04)   # (owner 8 Nov: a grey ring under the chins; Finn's kit rose 2 cm past the neck joint)
KIT_TOP = float(fc[_kc, 2].max()) if _kc.any() else NECK - .02
NECKBAND = min(KIT_TOP + .012, NECK + .05)
print('CL kit top', round(KIT_TOP, 3), 'neckband', round(NECKBAND, 3), 'neck', round(NECK, 3))
# (owner review 8 Nov: the grey collar still showed at the back) a top's selection shrank below the collar when it was
# smoothed: it now reaches 3 cm up the neck itself (the neck column: close round the neck's axis, never hair hanging
# further out), and the neckband cut gives its clean edge
_nr = (fc[:, 2] > NECK - .04) & (fc[:, 2] < NECK) & ~hair
NAX = fc[_nr, 0].mean() if _nr.any() else 0.; NAY = fc[_nr, 1].mean() if _nr.any() else 0.
_nd = np.hypot(fc[:, 0] - NAX, fc[:, 1] - NAY); NRAD = float(np.median(_nd[_nr])) if _nr.any() else .05
neckcol = (fc[:, 2] > NECK - .06) & (fc[:, 2] < NECKBAND + .03) & (_nd < NRAD * 1.3) & ~infront & ~((fV < .3) & (fS < .6)) & ~OWNB   # (never the braids: owner 9 Nov, purple strips across Clara's braid tops)
clothable = clothable | neckcol
_vf = {}
for p in me.polygons:
    for vi in p.vertices: _vf.setdefault(vi, []).append(p.index)
def dilate(faces, n=2):   # (two rings of neighbouring triangles more: no small holes at seams between parts; the hem cuts trim the edges)
    s = set(int(i) for i in faces)
    for _ in range(n):
        s |= {j for i in list(s) for vi in me.polygons[i].vertices for j in _vf[vi] if clothable[j]}
    return np.array(sorted(s))
def faces_for(top=None, sleeve=None, leg=None, under_waist=False, front_only=False, z_min=None):
    """the body triangles a garment covers: torso between z_min and the neck, sleeves to `sleeve` (0..2), legs to `leg`"""
    sel = np.zeros(NP, bool)
    if top is not None:   # (and all the kit above that line, and the neck's skin up to the neckband)
        sel |= (istorso | (kit & ~isarm & (np.abs(fc[:, 0]) < SH_X + .02))) & (fc[:, 2] > top) & ((fc[:, 2] < NECKBAND) | kit)
        sel |= neckcol
    if under_waist:   # (and all the grey shorts, wherever they are)
        sel |= istorso & (fc[:, 2] <= WAIST + .02) | (isleg & (legt <= .05)) | (grey & ~isarm & (fc[:, 2] <= WAIST + .02))
    if sleeve is not None:
        sel |= isarm & (armt <= sleeve)
    if leg is not None:
        sel |= isleg & (legt <= leg)
    sel &= clothable
    if front_only: sel &= fc[:, 1] < float(np.median(fc[istorso, 1]))
    if z_min is not None: sel &= fc[:, 2] > z_min
    out = np.nonzero(sel)[0]
    return dilate(out, 4 if top is not None else 2) if not front_only else out   # (tops: four rings, the armpit seam between sleeve and side closed)

btree = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
# the body without its hair, one surface per part (torso, each arm, each leg): shell() casts outward from a bone onto
# that part's surface only (one surface for all caught the arms beside the body and stretched shirts out to the hands)
def _tree(mask):
    bm_ = bmesh.new(); vv = {}
    for i in np.nonzero(mask)[0]:
        p = me.polygons[int(i)]; vs = []
        for vi in p.vertices:
            if vi not in vv: vv[vi] = bm_.verts.new(me.vertices[vi].co)
            vs.append(vv[vi])
        try: bm_.faces.new(vs)
        except ValueError: pass
    t = BVHTree.FromBMesh(bm_); bm_.free(); return t
RTREE = {'torso': _tree(clothable & (istorso | neckcol | (kit & ~isarm & ~isleg & (fc[:, 2] < NECK + .02))))}   # (with the kit's collar: tops wrap over it)
for s in 'LR':
    RTREE['arm' + s] = _tree(clothable & isarm & ((fc[:, 0] >= 0) == (s == 'L')))
    RTREE['leg' + s] = _tree(clothable & isleg & ((fc[:, 0] >= 0) == (s == 'L')))
def seg_point(a_, b_, c_, t):   # the point and direction at t (0..2) along a two-segment limb a-b-c
    p0, p1 = (a_, b_) if t <= 1 else (b_, c_); k = t if t <= 1 else t - 1
    return p0 + (p1 - p0) * k, (p1 - p0).normalized()
def arm_cut(s, t): p, d = seg_point(J['arm' + s], J['elbow' + s], J['hand' + s], t); return ('arm', s, p, d)
def leg_cut(s, t): p, d = seg_point(J['leg' + s], J['knee' + s], J['ankle' + s], t); return ('leg', s, p, d)
def hem_cut(z): return ('torso', None, Vector((0, 0, z)), Vector((0, 0, -1)))
def neck_cut(): return ('torso', None, Vector((0, 0, NECKBAND)), Vector((0, 0, 1)))   # (a top's neckband: straight, just past the kit's collar)
def limb_cuts(kind, t): return [(arm_cut if kind == 'arm' else leg_cut)(s, t) for s in 'LR']

# (owner 9 Nov 2026, the poses: thighs came out through shirt hems when walking and sitting, shirts folded inside out in the
# armpits when the arms went up) a garment copies the body's joint weights, which change sharply where the trunk meets a
# leg or an arm. Cloth does not: (1) a top's lowest band takes more and more of the thigh's weights towards its hem (the
# body's weights 6 cm lower, on the same side), so the hem lifts with a thigh going forward; (2) round each shoulder the
# weights are smoothed over the garment's own surface, so the cloth bends in a wide curve instead of folding.
_BKD = None
def _body_weights():
    global _BKD
    if _BKD is None:
        from mathutils.kdtree import KDTree as _K
        vs = [v for v in me.vertices if not any(body.vertex_groups[g.group].name == 'hair-v' for g in v.groups if g.group < len(body.vertex_groups))]
        kd = _K(len(vs)); W = []
        for i_, v in enumerate(vs):
            kd.insert(v.co, i_); W.append({body.vertex_groups[g.group].name: g.weight for g in v.groups if g.group < len(body.vertex_groups) and g.weight > 1e-4})
        kd.balance(); _BKD = (kd, W)
    return _BKD
def _move_with_body(bm, o, name):
    dl = bm.verts.layers.deform.active
    print('CL move', name, 'deform layer', dl is not None, 'groups', len(o.vertex_groups))
    if dl is None: return
    gi = {g.name: g.index for g in o.vertex_groups}; gn = {g.index: g.name for g in o.vertex_groups}
    def getw(v): return {gn[k]: w for k, w in v[dl].items() if k in gn and gn[k] != 'hair-v'}
    def setw(v, d):
        dv = v[dl]; dv.clear(); tot = sum(d.values()) or 1.
        for k, w in d.items():
            if w > 1e-3 and k in gi: dv[gi[k]] = w / tot
    bm.verts.ensure_lookup_table()
    if name == 'bib':   # (owner 9 Nov 2026, Lumi's overalls: the bib's lower corners took the thighs' weights and smeared into blobs when she walked; a bib is a stiff panel on the chest: the trunk carries all of it)
        for v in bm.verts: setw(v, {'torso': 1.})
        return
    if LAYER.get(name) == 1 or name in ('top-short', 'top-long', 'tunic-long', 'bodice'):   # (1) the hem follows the thighs
        # (the whole trunk, sides too: the sides at the hips are wider than the shoulder joints, and a thigh sitting up came
        # through them, Sol's; sleeves hanging by the hips are told apart by the body part under them)
        _onarm = lambda v: (lambda h_: h_[0] is not None and bool(isarm[h_[2]]))(btree.find_nearest(v.co))
        trunk = [v for v in bm.verts if not _onarm(v)]
        if trunk:
            hem = min(v.co.z for v in trunk); kd, W = _body_weights(); band = .12; tset = set(trunk)
            for v in bm.verts:
                if v not in tset or v.co.z > hem + band: continue
                t = (1 - (v.co.z - hem) / band) ** .8   # (a sitting thigh came through the shirt's sides at .65 over 8 cm, and shorts rose over the hem at .8: the hem itself lies on the thigh)
                t *= .6 + .4 * max(0., min(1., (cyz + .03 - v.co.y) / .06))   # (the back at 60%: at 0 Lumi's shorts rose over her shirt's back when walking (owner circled); at 100% a sitting thigh pulled a bodice's back out over a skirt's waistband, Clara's)
                q = Vector((v.co.x, v.co.y, v.co.z - .06)); _co, j, _d = kd.find(q)
                low = {k: w for k, w in W[j].items() if k.startswith(('leg', 'knee'))}
                if not low: continue
                own = getw(v); s_low = sum(low.values()) or 1.
                new = {k: w * (1 - t) for k, w in own.items()}
                for k, w in low.items(): new[k] = new.get(k, 0) + t * w / s_low
                setw(v, new); _nh = locals().get('_nh', 0) + 1
            print('CL move', name, 'hem band points', sum(1 for v in bm.verts if v in tset and v.co.z <= hem + band), 'hem z', round(hem, 3))
    # (1b) the trunk of a top below the armpits follows the trunk only: Meshy's rig gives the trunk's sides some arm weight,
    # and raised arms lifted the shirt's sides off the trousers and shorts (Lumi's, Clara's, in the auditor's cheer pose)
    if LAYER.get(name) in (0, 1, 2):   # (trousers and shorts too: their waistband's sides carried a little arm weight and ran up the shirt's sides when the arms went up, the auditor's cheer pose)
        arm_z = (J['armL'].z + J['armR'].z) / 2 - .05
        for v in bm.verts:
            if (LAYER.get(name) != 0 and abs(v.co.x) >= SH_X * .95) or v.co.z > arm_z: continue   # (trousers never cover an arm: every point of theirs)
            w = getw(v); arm = sum(x for k, x in w.items() if k.startswith(('arm', 'elbow')))
            if arm <= 1e-3: continue
            t = min(1., (arm_z - v.co.z) / .06)   # (fading in over 6 cm below the armpit)
            new = {k: (x * (1 - t) if k.startswith(('arm', 'elbow')) else x) for k, x in w.items()}
            new['torso'] = new.get('torso', 0) + arm * t; setw(v, new)
    # (2) smooth weights round the shoulders (and hips, for trousers and shorts): 6 passes over neighbours
    joints = [J['armL'], J['armR'], J['elbowL'], J['elbowR']] + ([J['legL'], J['legR'], J['kneeL'], J['kneeR']] if LAYER.get(name) == 0 else [])   # (elbows and knees too: the auditor found trousers and sleeves folding inside out there)
    near = [v for v in bm.verts if min((v.co - j_).length for j_ in joints) < .15]   # (the auditor: shirts folded inside out under raised arms at .11 and 6 passes; .18 and 30 made pokes worse and models bigger)
    for _ in range(14):
        cur = {v: getw(v) for v in near}
        for v in near:
            nb = [e.other_vert(v) for e in v.link_edges]
            if not nb: continue
            acc = dict(cur[v])
            for u in nb:
                for k, w in (cur.get(u) or getw(u)).items(): acc[k] = acc.get(k, 0) + w
            setw(v, acc)
    # (3) (owner 9 Nov 2026: "cái nào đẹp và chỉn chu hơn thì làm": keep the full poses, fix the cloth) corrective helper bones,
    # the standard fix for armpits and crotches: a bone at the shoulder (hip) that turns half as far as the arm (thigh). The
    # part of a point's weight shared between trunk and limb moves onto the helper, so the cloth there bends round by half
    # the angle instead of being squeezed flat between two full turns and folding inside out (js/friend-model.ts drives them)
    _helper_bones()
    for hb, limb, trunk_ in (('helpArmL', 'armL', ('torso',)), ('helpArmR', 'armR', ('torso',)), ('helpLegL', 'legL', ('root', 'torso')), ('helpLegR', 'legR', ('root', 'torso'))):
        if hb not in gi:
            g_ = o.vertex_groups.new(name=hb); gi[hb] = g_.index; gn[g_.index] = hb
        jp = J[limb]
        for v in bm.verts:
            if (v.co - jp).length > .16: continue
            w = getw(v); wl = w.get(limb, 0.); wt = sum(w.get(t_, 0.) for t_ in trunk_)
            m_ = min(wl, wt)
            if m_ < .02: continue
            new = dict(w); new[limb] = wl - m_
            for t_ in trunk_:
                if t_ in new: new[t_] = new[t_] * (1 - m_ / max(wt, 1e-6))
            new[hb] = new.get(hb, 0) + 2 * m_; setw(v, new)
def _helper_bones():
    if 'helpArmL' in rig.data.bones: return
    VL.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones; inv = rig.matrix_world.inverted()
    for hb, limb, par in (('helpArmL', 'armL', 'torso'), ('helpArmR', 'armR', 'torso'), ('helpLegL', 'legL', 'root'), ('helpLegR', 'legR', 'root')):
        src = eb.get(limb); b = eb.new(hb); b.head = src.head.copy(); b.tail = src.head + (src.tail - src.head) * .4
        b.parent = eb.get(par) or eb.get('torso'); b.use_deform = True
    bpy.ops.object.mode_set(mode='OBJECT'); print('CL helper bones added')
def shell(name, faces, thick, smooth=6, cuts=()):
    """a copy of these body triangles, pushed out `thick` metres along the surface, softened (no body detail), never
    inside the body; it keeps the body's joint weights and picture coordinates; corner colours = Meshy's painted shade.
    (owner review 8 Nov: ragged hems) each cut is a flat plane at a hem or cuff: the part is chosen a little too big and
    cut there, so hems run straight across the body instead of following its triangles. A torso hem cuts only the torso,
    a sleeve cut only that arm, a leg cut only that leg."""
    if LIGHT and name.startswith(('top', 'tunic')): thick *= 1.8   # (tops only: thicker leggings poked through skirts, Clara's; light model: its garments are reduced below, and a thin shell lets the grey kit poke through, owner review 8 Nov)
    o = body.copy(); o.data = body.data.copy(); o.name = 'g-' + name; sc.collection.objects.link(o)
    bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
    keep = set(int(i) for i in faces)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in keep], context='FACES')
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=.0004)   # (Meshy's file splits vertices at picture seams)
    bm.normal_update()
    # (owner 8 Nov 2026: a grey ring under the chins) the collar's open edge is not smoothed: smoothing pulled a top's neckline
    # 3 cm down below the kit's collar, before its neckband cut could shape it (the cuts trim the edges straight below)
    _inner = [v for v in bm.verts if not (v.is_boundary and v.co.z > NECKBAND - .06)]   # (only the collar's edge: other open edges, the hems and small gaps, smooth as before or they tore)
    for _ in range(smooth): bmesh.ops.smooth_vert(bm, verts=_inner, factor=.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    for region, s, p, d in cuts:
        def mine(f):
            c = f.calc_center_median()
            if region == 'torso': return abs(c.x) < SH_X + .03
            side_ok = (c.x >= 0) == (s == 'L')
            P = np.array([c[:]])
            da = along(P, J['arm' + s], J['elbow' + s], J['hand' + s])[0][0]; dl = along(P, J['leg' + s], J['knee' + s], J['ankle' + s])[0][0]
            if region == 'arm':   # (owner 9 Nov 2026, r62-66: the swim kit showed at the back beside the armpits, Clara's and Sol's) the cut plane across a hanging arm also crosses the trunk's side: only the arm's own surface is cut
                hb = btree.find_nearest(c)
                if hb[0] is not None and not isarm[hb[2]]: return False
            return side_ok and ((da < dl and da < .1) if region == 'arm' else (dl < da and dl < .15))   # (only the limb itself: the chest is closer to an arm than to a leg, and a sleeve cut sliced the shirt's belly off, Sol's and Clara's)
        fs = [f for f in bm.faces if mine(f)]
        if not fs: continue
        geom = list({v for f in fs for v in f.verts}) + list({e for f in fs for e in f.edges}) + fs
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=p, plane_no=d, clear_outer=True, dist=.0001)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    # the open edges (hems, cuffs, neckline) are evened out a little along themselves
    for _it in range(10):   # (the collar's edge, not smoothed with the rest, evens out longer: Lumi's zigzag, owner 8 Nov)
        new = {}
        for v in bm.verts:
            if _it >= 3 and v.co.z < NECKBAND - .06: continue
            ed = [e for e in v.link_edges if len(e.link_faces) == 1]
            if len(ed) == 2: a_, b_ = (e.other_vert(v).co for e in ed); new[v] = v.co * .4 + (a_ + b_) * .3
        for v, p in new.items(): v.co = p
    bm.normal_update()
    for v in bm.verts:
        # (owner review 8 Nov: loose shorts and shirt edges poked out) each point goes just outside the body's OUTERMOST
        # surface along the line from its bone (the arm, the leg, or the spine at its height) through it, so a garment
        # wraps over looser clothes painted underneath; hair is never in that surface, so it is never wrapped over
        # the part this point belongs to: the body part of the nearest original body triangle (arm, leg or torso)
        hit = btree.find_nearest(v.co); fi = hit[2] if hit[0] is not None else None
        if fi is None: continue
        s = 'L' if fc[fi, 0] >= 0 else 'R'
        if isarm[fi]: region, chain = 'arm' + s, (J['arm' + s], J['elbow' + s], J['hand' + s])
        elif isleg[fi]: region, chain = 'leg' + s, (J['leg' + s], J['knee' + s], J['ankle' + s])
        else: region, chain = 'torso', None
        if chain:   # (arms and legs: along the point's own surface direction, from a little inside: the knee joint sits in
            # front of the leg, so rays from the bone missed the shins)
            dvec = v.normal.normalized() if v.normal.length > .5 else hit[1].normalized(); origin = v.co - dvec * .05; reach = .11
        else:
            # (owner 8 Nov 2026: a grey ring under the chins) at collar height the rays start on the neck's own axis: the
            # trunk's middle lies in front of the neck there, and a ray from it through the front of the neck pointed
            # backwards and threw the collar's front edge to the nape, baring the kit under the chin (Clara's)
            _w = max(0., min(1., (v.co.z - (NECK - .06)) / .04))
            axis = Vector((NAX * _w, cyz + (NAY - cyz) * _w, v.co.z)); dvec = v.co - axis
            if dvec.length < 1e-5: continue
            dvec.normalize(); origin = axis.copy(); reach = .4
        last = None
        for _ in range(8):
            h = RTREE[region].ray_cast(origin, dvec, reach - (origin - (v.co - dvec * .05 if chain else axis)).length)
            if h[0] is None: break
            last = h[0]; origin = h[0] + dvec * .0005
        # (owner 8 Nov 2026: a grey ring under the chins) the collar hugs the neck: the shirt's lift tapers to almost nothing
        # over its top 5 cm, so the kit's top edge is never seen past it
        _ring = max(0., min(1., (math.hypot(v.co.x - NAX, v.co.y - NAY) - NRAD * 1.15) / (NRAD * .5)))   # (0 at the neck, 1 a little out: the shoulders keep their lift)
        _th = thick   # (the collar keeps its full lift: the grey ring was the rays' axis, now fixed; a thinner collar let the body poke through, owner 8 Nov) if region == 'torso' else thick
        if last is not None: v.co = last + dvec * _th
        else:
            hit = btree.find_nearest(v.co)
            # (owner 8 Nov 2026: a grey ring under the chins) no torso surface at collar height (the neck is not in it): the
            # nearest body point lay 3 cm lower and dragged the collar down past the kit; a point far from it lifts in place
            if hit[0] is not None and (hit[0] - v.co).length < .008: v.co = hit[0] + hit[1].normalized() * _th
            elif v.normal.length > .5: v.co = v.co + v.normal.normalized() * _th
    # (one winding, outward: copied and cut body triangles came out mixed, and the auditor read the outside as an inside;
    # Blender's own recalculation turned whole open shells inward) each face is turned to agree with the body under it
    bm.normal_update(); _flip = []
    for f in bm.faces:
        h_ = btree.find_nearest(f.calc_center_median())
        if h_[0] is not None and f.normal.dot(h_[1]) < 0: _flip.append(f)
    if _flip: bmesh.ops.reverse_faces(bm, faces=_flip)
    bm.normal_update()
    _move_with_body(bm, o, name)
    # painted shade: the body's own colour under each corner, as brightness relative to the grey clothes / the skin
    uv = bm.loops.layers.uv.active; col = bm.loops.layers.color.new('shade')
    bm.verts.ensure_lookup_table(); _vk = np.zeros(len(bm.verts)); _vn = np.zeros(len(bm.verts))
    for f in bm.faces:
        for l in f.loops:
            c = sample(*l[uv].uv); lum = float(max(c)); s_ = (lum - float(min(c))) / max(lum, 1e-4)
            k = lum / (GREY_LUM if s_ < .15 else SKIN_LUM); k = min(1.15, max(.55, k))
            _vk[l.vert.index] += k; _vn[l.vert.index] += 1
    # (owner 9 Nov 2026, r57: dark blocks on Sol's yellow shirt) the body's picture under a garment has hard-edged
    # patches (the swim kit's painted folds, skin at the armholes): the shade is smoothed over the garment's own surface
    # and kept gentle, so it reads as soft light and shadow, never as a printed patch
    _vk = _vk / np.maximum(_vn, 1)
    _nbv = [[e.other_vert(v).index for e in v.link_edges] for v in bm.verts]
    for _ in range(12): _vk = np.array([(_vk[i] + np.mean(_vk[n])) / 2 if n else _vk[i] for i, n in enumerate(_nbv)])
    _vk = np.clip(_vk, .8, 1.08)
    for f in bm.faces:
        for l in f.loops: k = float(_vk[l.vert.index]); l[col] = (k, k, k, 1)
    bm.to_mesh(o.data); bm.free()
    for nm in [ca.name for ca in o.data.color_attributes if ca.name and ca.name != 'shade']: o.data.color_attributes.remove(o.data.color_attributes[nm])
    o.data.color_attributes.active_color = o.data.color_attributes['shade']
    o.data.materials.clear(); m = bpy.data.materials.new('lit-g-' + name); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    print('CL part', name, 'triangles', len(o.data.polygons))
    return o

def _skirt_bones():
    if 'skirtF' in rig.data.bones: return
    VL.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
    eb = rig.data.edit_bones; par = eb.get('root') or eb.get('torso')
    hy = (J['legL'].y + J['legR'].y) / 2; inv = rig.matrix_world.inverted()
    for nm, dy in (('skirtF', -1), ('skirtB', 1)):
        # (the hinge on the hip's own front (back) surface, not its middle: turned about the middle, a sitting child's skirt front
        # swung up through her thighs, Clara's; about the front of the hips it lies along the top of the thighs)
        fy = hy + dy * .07
        KZ = (J['kneeL'].z + J['kneeR'].z) / 2
        b = eb.new(nm); b.head = inv @ Vector((0, fy, HIP + .02)); b.tail = inv @ Vector((0, fy + dy * .02, KZ)); b.parent = par; b.use_deform = True
        # (owner 9 Nov 2026, the auditor: a sitting child's áo dài front stood out flat like a board) a second bone from the knee
        # down: the cloth over the thighs turns with them, and below the knees hangs down again (js/friend-model.ts)
        b2 = eb.new(nm + '2'); b2.head = b.tail.copy(); b2.tail = inv @ Vector((0, fy + dy * .03, KZ - .3)); b2.parent = b; b2.use_deform = True
    bpy.ops.object.mode_set(mode='OBJECT'); print('CL skirt bones added')
def cone(name, z_top, z_bot, flare, thick, panels=False, slit=.0):
    """a skirt (or the áo dài's long panels with side slits) hung from the waist: rings round the body's own waist,
    widening to the hem; weighted to the torso at the top, more to each leg's side lower down"""
    ring = [(fc[i]) for i in np.nonzero(istorso & ~hair & (np.abs(fc[:, 2] - z_top) < .02))[0]]   # (never hair: Clara's braid tips in front of the waist pulled the skirt forward and her seat poked out behind)
    cx = float(np.mean([p[0] for p in ring])) if ring else 0.; cy = float(np.mean([p[1] for p in ring])) if ring else 0.
    rx = max(abs(p[0] - cx) for p in ring) + thick if ring else .12; ry = max(abs(p[1] - cy) for p in ring) + thick if ring else .08
    N, R = 48, 10; bm = bmesh.new(); rows = []
    for r in range(R + 1):
        t = r / R; z = z_top + (z_bot - z_top) * t; k = 1 + flare * t ** 1.4
        # (each ring reaches past the body at its height, the seat and thighs: in each direction the farthest body point
        # there, plus the thickness)
        _b = fc[~hair & ~isarm & (np.abs(fc[:, 2] - z) < .03)]
        _row = []
        for i in range(N):
            ca, sa = math.cos(2 * math.pi * i / N), math.sin(2 * math.pi * i / N); rr = 1.
            if len(_b):
                dx, dy = _b[:, 0] - cx, _b[:, 1] - cy; ang = np.arctan2(dy, dx) - math.atan2(sa, ca); ang = (ang + np.pi) % (2 * np.pi) - np.pi
                _base = math.hypot(rx * k * ca, ry * k * sa); _near = (np.abs(ang) < .25) & (np.hypot(dx, dy) < _base * 1.4)   # (the body there, never a hand hanging beside the hip)
                if _near.any():
                    need = float(np.max(dx[_near] * ca + dy[_near] * sa)) + thick
                    rr = min(1.4, max(1., need / max(_base, 1e-4)))
            _row.append(bm.verts.new((cx + ca * rx * k * rr, cy + sa * ry * k * rr, z)))
        rows.append(_row)
    for r in range(R):
        for i in range(N):
            ang = 2 * math.pi * (i + .5) / N
            if panels and abs(math.cos(ang)) > 1 - slit and r >= R * .25: continue   # (the side slits, below the hips)
            bm.faces.new((rows[r][i], rows[r][(i + 1) % N], rows[r + 1][(i + 1) % N], rows[r + 1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    col = bm.loops.layers.color.new('shade')
    for f in bm.faces:
        for l in f.loops:
            zt = (z_top - l.vert.co.z) / max(z_top - z_bot, 1e-4); k = 1.0 - .18 * zt   # (a little darker towards the hem)
            l[col] = (k, k, k, 1)
    me2 = bpy.data.meshes.new('g-' + name); bm.to_mesh(me2); bm.free()
    o = bpy.data.objects.new('g-' + name, me2); sc.collection.objects.link(o); o['cone_c'] = (cx, cy, z_top, z_bot)
    # (owner 9 Nov 2026, the poses: legs came through skirts and the áo dài's panels when walking, running and sitting) the
    # front and back of a skirt hang from two extra bones at the hips, skirtF and skirtB, which the game turns with the leg
    # swung furthest forward or back (js/friend-model.ts), the standard driven skirt bones; the sides follow their own leg
    _skirt_bones()
    for g in ('torso', 'legL', 'legR', 'skirtF', 'skirtB', 'skirtF2', 'skirtB2'): o.vertex_groups.new(name=g)
    KZ = (J['kneeL'].z + J['kneeR'].z) / 2
    _ys = [v.co.y for v in me2.vertices]; _ry = max(max(_ys) - cy, cy - min(_ys), .02)
    for v in me2.vertices:
        t = (z_top - v.co.z) / max(z_top - z_bot, 1e-4); s = 'legL' if v.co.x >= cx else 'legR'
        k = min(1., abs(v.co.y - cy) / _ry) ** .7; fb = 'skirtF' if v.co.y < cy else 'skirtB'
        if v.co.y >= cy: k = min(1., k * 2.5)   # (the back follows its skirt bone, not the thighs, except right at the sides: a sitting child's thighs pulled the back of the skirt into her, and the top came through it, the auditor's Clara sitting)   # (k: 1 at the middle of the front or back, 0 at the sides)
        sw = min(1., .35 + 2.2 * t)   # (the waistband too: tops' hems follow the thighs under it)  # (fully carried by the legs and skirt bones from a third of the way down: at .8 t the thighs came through)
        lo = max(0., min(1., (KZ + .04 - v.co.z) / .08))   # (below the knee: the lower bone, blended over 8 cm)
        o.vertex_groups['torso'].add([v.index], max(1e-3, 1 - sw), 'REPLACE'); o.vertex_groups[s].add([v.index], sw * (1 - k), 'REPLACE'); o.vertex_groups[fb].add([v.index], sw * k * (1 - lo), 'REPLACE')
        if lo > 0: o.vertex_groups[fb + '2'].add([v.index], sw * k * lo, 'REPLACE')
    m = bpy.data.materials.new('lit-g-' + name); me2.materials.append(m)
    for p in me2.polygons: p.use_smooth = True
    print('CL part', name, 'triangles', len(me2.polygons) * 2)
    return o

KNEE = (J['kneeL'].z + J['kneeR'].z) / 2; ANKLE = (J['ankleL'].z + J['ankleR'].z) / 2
if RDIR and os.environ.get('CL_CLASSES'):   # (check picture of how each body triangle was read: arm blue, leg green, torso red, hair black, none yellow)
    import shutil
    os.makedirs(RDIR, exist_ok=True)
    ca = me.color_attributes.new('cls', 'BYTE_COLOR', 'CORNER')
    for p in me.polygons:
        i = p.index; c = (0, 0, 0, 1) if hair[i] else (1, 1, 1, 1) if (kit[i] and fc[i, 2] > WAIST + .1 and not isarm[i]) else (.2, .3, 1, 1) if isarm[i] else (.2, .9, .2, 1) if isleg[i] else (1, .2, .2, 1) if istorso[i] else (1, 1, 0, 1)
        for l in p.loop_indices: ca.data[l].color = c
    dm_ = bpy.data.materials.new('dbg'); dm_.use_nodes = True
    vc = dm_.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'cls'; em_ = dm_.node_tree.nodes.new('ShaderNodeEmission'); dm_.node_tree.links.new(vc.outputs['Color'], em_.inputs['Color']); dm_.node_tree.links.new(em_.outputs[0], dm_.node_tree.nodes['Material Output'].inputs['Surface'])   # (lit by itself: no lights needed)
    for k in range(len(me.materials)): me.materials[k] = dm_
    sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x, sc.render.resolution_y = 480, 640
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = (J['head'].z + .3) * 1.05
    co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    for nm, loc, rot in (('front', (0, -5, (J['head'].z + .3) / 2), (math.radians(90), 0, 0)), ('back', (0, 5, (J['head'].z + .3) / 2), (math.radians(90), 0, math.pi))):
        co.location = loc; co.rotation_euler = rot; sc.render.filepath = os.path.join(RDIR, 'classes-' + nm + '.png'); bpy.ops.render.render(write_still=True)
    raise SystemExit(0)
parts = []
# tops (the T-shirt's grey and the skin they reach): length by the lowest point, sleeves to 0.45 (short), 1.9 (long)
# (each chosen a little too big, then cut straight at its hems; tops end below the trousers' top, so nothing shows between)
TOP_HEM = HIP - .03
# (owner review 8 Nov: grey swim kit showing between garments) all the kit on the trunk counts as trunk, wherever it is,
# and shorts reach past the kit shorts' own hem on the thighs
istorso |= kit & ~isarm & ~isleg & (fc[:, 2] > HIP - .16) & (fc[:, 2] < NECK)
_kl = kit & isleg; KIT_LEG_T = float(np.percentile(legt[_kl], 97)) + .06 if _kl.any() else .5
print('CL kit shorts reach', round(KIT_LEG_T, 2))
# (owner 9 Nov 2026: dozens of outfits to come) the shapes are rows of tools/meshy/garments.json, measured on this body
import json as _json
_bf = faces_for(top=HIP - .04, front_only=True)
BIB_TOP = WAIST + (NECK - WAIST) * .55; BIB_X = SH_X * .55
_V = dict(NECK=NECK, WAIST=WAIST, HIP=HIP, KNEE=KNEE, ANKLE=ANKLE, TOP_HEM=TOP_HEM, KIT_LEG_T=KIT_LEG_T, BIB_TOP=BIB_TOP, BIB_X=BIB_X, max=max, min=min)
def _num(x): return float(eval(x, {'__builtins__': {}}, _V)) if isinstance(x, str) else float(x)
def _cut(c):
    k, _, v = c.partition(':')
    if k == 'neck': return [neck_cut()]
    if k == 'hem': return [hem_cut(_num(v))]
    if k in ('arm', 'leg'): return limb_cuts(k, _num(v))
    if k == 'up': return [('torso', None, Vector((0, 0, _num(v))), Vector((0, 0, 1)))]
    if k == 'side': x_ = _num(v); return [('torso', None, Vector((x_, 0, 0)), Vector((1 if x_ >= 0 else -1, 0, 0)))]
    raise ValueError('garments.json: unknown cut ' + c)
def _faces(spec):
    out = None
    for f in spec:
        kw = {k: (_num(v) if k in ('top', 'sleeve', 'leg', 'z_min') else v) for k, v in f.items() if k in ('top', 'sleeve', 'leg', 'under_waist', 'front_only', 'z_min')}
        fs = faces_for(**kw)
        if 'below' in f: fs = fs[fc[fs, 2] < _num(f['below'])]
        if 'within_x' in f: fs = fs[np.abs(fc[fs, 0]) < _num(f['within_x'])]
        out = fs if out is None else np.union1d(out, fs)
    return out
SHAPES = _json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'garments.json'), encoding='utf-8'))['shapes']
LAYER = {}
for g in SHAPES:
    LAYER[g['name']] = g['layer']
    if g['kind'] == 'shell':
        cuts = [c_ for c in g.get('cuts', []) for c_ in _cut(c)]
        parts.append(shell(g['name'], _faces(g['faces']), g['thick'], smooth=g.get('smooth', 6), cuts=cuts))
    elif g['kind'] == 'cone':
        parts.append(cone(g['name'], _num(g['top']), _num(g['bottom']), g['flare'], g['thick'], panels=g.get('panels', False), slit=g.get('slit', .0)))
    else: raise ValueError('garments.json: unknown kind ' + g['kind'])
print('CL shapes from garments.json', [g['name'] for g in SHAPES])
# shoes: over the feet to just above the ankle
if feet is not None:
    fm = feet.data; feet.name = feet.name.replace('-shoes', '-feet')
    for m in fm.materials:
        if m and m.name.startswith('cloth-shoes'): m.name = 'skin-feet'
    fo = feet.copy(); fo.data = feet.data.copy(); sc.collection.objects.link(fo)
    bm = bmesh.new(); bm.from_mesh(fo.data); bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=.0004); bm.normal_update()
    ftree = BVHTree.FromObject(feet, bpy.context.evaluated_depsgraph_get())
    for _ in range(4): bmesh.ops.smooth_vert(bm, verts=bm.verts[:], factor=.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    for v in bm.verts:
        h = ftree.find_nearest(v.co)
        if h[0] is not None: v.co = h[0] + h[1].normalized() * (.012 if v.co.z > .03 else .016)
    col = bm.loops.layers.color.new('shade')
    for f in bm.faces:
        for l in f.loops: k = .8 + .25 * min(1, l.vert.co.z / .1); l[col] = (k, k, k, 1)
    bm.to_mesh(fo.data); bm.free(); fo.name = 'g-boots'
    for nm in [ca.name for ca in fo.data.color_attributes if ca.name and ca.name != 'shade']: fo.data.color_attributes.remove(fo.data.color_attributes[nm])
    fo.data.color_attributes.active_color = fo.data.color_attributes['shade']
    fo.data.materials.clear(); fo.data.materials.append(bpy.data.materials.new('lit-g-boots')); parts.append(fo)

# (light model, far away only: the garments carry half their triangles; Clara's light model passed the 500 KB limit)
_hg = body.vertex_groups.new(name='hair-v')   # (the hair's points, kept through the light model's body reduction)
_hg.add(sorted({vi for p_ in me.polygons if hair[p_.index] for vi in p_.vertices} - {vi for p_ in me.polygons if not hair[p_.index] for vi in p_.vertices}), 1.0, 'REPLACE')   # (only points wholly in the hair: where a braid touches the body the remesh joined them, and lifting a shared point pulled the kit out through Clara's top)
if LIGHT:
    for o in parts:
        if len(o.data.polygons) < 300: continue
        bpy.context.view_layer.objects.active = o; dm = o.modifiers.new('reduce', 'DECIMATE'); dm.ratio = float(os.environ.get('CL_REDUCE', '.6'))
        bpy.ops.object.modifier_apply(modifier='reduce')
    print('CL light garments reduced', sum(len(o.data.polygons) for o in parts))
    # (Clara's own Meshy head and braids, owner 8 Nov 2026: the light body passed 500 KB) CL_BODY_REDUCE thins the body
    # below the neck only; the head stays exact under its face pieces
    if os.environ.get('CL_BODY_REDUCE'):
        vg = body.vertex_groups.new(name='reduce-me')
        vg.add([v.index for v in me.vertices if v.co.z < NECK - .04], 1.0, 'REPLACE')
        bpy.context.view_layer.objects.active = body; dm = body.modifiers.new('reduce', 'DECIMATE'); dm.ratio = float(os.environ['CL_BODY_REDUCE']); dm.vertex_group = 'reduce-me'; dm.vertex_group_factor = 1.0
        n0 = len(me.polygons); bpy.ops.object.modifier_apply(modifier='reduce'); body.vertex_groups.remove(body.vertex_groups['reduce-me'])
        print('CL light body reduced', n0, '->', len(body.data.polygons))
# (owner 8 Nov 2026: a grey ring under the chins) under the collar the body's own grey kit sinks 8 mm in: looking down past
# a collar's edge shows a shadow, not the swimsuit (its shared edge with the neck's skin stays, under the collar)
# (owner 9 Nov 2026: Clara's braid ends vanished into the skirt's top) the braids' tips at the waist lift forward a
# little, so they hang over a skirt's waistband instead of inside it
if OWNB.any():
    _bv = set()
    for p_ in me.polygons:
        if OWNB[p_.index]: _bv.update(p_.vertices)
    _lift = 0
    for vi in _bv:
        v_ = me.vertices[vi]; t_ = max(0., min(1., (WAIST + .06 - v_.co.z) / .08))
        if t_ > 0: v_.co.y -= .03 * t_; _lift += 1
    print('CL braid tips lifted over the waistband', _lift)
# (owner 9 Nov 2026, r59: "bím tóc vẫn bị dính áo" - purple patches of Clara's top on her braids at the shoulders, and the
# dots in Finn's and Sol's collars) the braids lie on the shoulders closer than a top's thickness, so the top came out
# through them; small bumps of the body came out through the tops the other way. No garment is moved (pushing garments
# folded them, 9 Nov): a hair point at or inside any garment goes out to 4 mm above it, and a body point (not hair) at or
# outside a garment, right under it, sinks to 3 mm below it. Both are hidden or lie on top, so nothing shows as a cut.
_gtrees = []
for o in parts:
    bmg_ = bmesh.new(); bmg_.from_mesh(o.data); bmg_.faces.ensure_lookup_table(); bmg_.normal_update()
    _gtrees.append((BVHTree.FromBMesh(bmg_), [f.normal.copy() for f in bmg_.faces])); bmg_.free()
_hgi = body.vertex_groups['hair-v'].index; _hout = _bin = 0
for v_ in me.vertices:
    if v_.co.z > NECK + .02: continue
    ishair = any(g.group == _hgi for g in v_.groups)
    best = None
    for t_, nrm in _gtrees:
        h_ = t_.find_nearest(v_.co, .03)
        if h_[0] is None: continue
        n_ = nrm[h_[2]]
        # (a garment triangle's own direction can be flipped by the cuts: it is turned to agree with the body's outward
        # surface under it, or the body went out through Clara's top as grey patches, r62)
        b_ = btree.find_nearest(h_[0])
        if b_[0] is not None and n_.dot(b_[1]) < 0: n_ = -n_
        dep = (v_.co - h_[0]).dot(n_)
        # (only the hair moves: the body under a garment is no longer drawn in the game at all, see "covered" below)
        if ishair and -.012 < dep < .004 and (best is None or .004 - dep > best[0]): best = (.004 - dep, n_)
    if best is not None:
        v_.co = v_.co + best[1] * best[0]
        if ishair: _hout += 1
        else: _bin += 1
print('CL hair points lifted over the garments', _hout, 'body points sunk under them', _bin)
_kv = set()
for p_ in me.polygons:
    if kit[p_.index] and p_.center.z > NECKBAND - .06 and math.hypot(p_.center.x - NAX, p_.center.y - NAY) < NRAD * 3: _kv.update(p_.vertices)
_notkit = set()
for p_ in me.polygons:
    if not kit[p_.index]: _notkit.update(p_.vertices)
_sunk = 0
for vi in _kv - _notkit:
    v_ = me.vertices[vi]; v_.co = v_.co - v_.normal * .008; _sunk += 1
# (owner 8 Nov 2026, circled: specks of skin through the collar) just under the collar's edge the neck's own skin sinks
# too, a little, ramping from nothing at the edge: the smoothed shirt never dips inside it
_hv = set()
for p_ in me.polygons:
    if hair[p_.index]: _hv.update(p_.vertices)
for v_ in me.vertices:
    if v_.index in _hv or v_.index in _kv: continue
    z_ = v_.co.z
    if NECKBAND - .07 < z_ < NECKBAND and math.hypot(v_.co.x - NAX, v_.co.y - NAY) < NRAD * 3:
        v_.co = v_.co - v_.normal * (.006 * min(1., (NECKBAND - z_) / .015)); _sunk += 1
me.update(); print('CL kit sunk under the collar', _sunk)
# (owner 9 Nov 2026: "em sửa đi" - spots of the swim kit and skin through Clara's, Sol's and Finn's tops, after two rounds of
# moving the body or the garments) the body under a garment is not drawn while that garment is worn: each body point
# records which garments cover it, one bit each (js/friend-model.ts COVER_BIT), in the alpha of its skin-mark corner colour.
# A point is covered when a line along its own direction, either way (it may poke out through the garment), meets the
# garment within 8 cm, at least 6 mm in from the garment's open edges (hems, cuffs, neckline: the body round them stays,
# so no gap opens), on a garment surface facing the same way. Hair is never covered. Garment and body bend with the same
# joint weights, so what is covered at rest stays covered when the child moves.
_cov = [g['name'] for g in SHAPES if g['layer'] <= 2 and g['name'] not in ('bib', 'aodai-panels')]   # (the body under a bib or panels is under a top or trousers too)
assert len(_cov) <= 8, 'more than 8 body-covering shapes: widen the cover mark'
COVER_BIT = {n_: 1 << i for i, n_ in enumerate(_cov)}
# (9 Nov, the auditor: tops showed under a skirt's waistband) under a skirt or the áo dài's panels (cones hung from the waist)
# a point is covered when a level line from the cone's axis out through it meets the cone: inside the skirt, whatever the
# surfaces' directions; the panels' slits let the line out, so the trousers there stay drawn
def _in_cone(o, tr, co):
    cx_, cy_, zt_, zb_ = o['cone_c']
    if not (zb_ - .02 < co.z < zt_ - .004): return False
    d_ = Vector((co.x - cx_, co.y - cy_, 0))
    if d_.length < 1e-4: return True
    d_.normalize(); return tr.ray_cast(co + d_ * .0005, d_, .3)[0] is not None

_cbits = np.zeros(len(me.vertices), np.int32)
_hgi2 = body.vertex_groups['hair-v'].index
_ishair = np.array([any(g.group == _hgi2 for g in v.groups) for v in me.vertices])
for o in parts:
    nm = o.name[2:]
    if nm not in COVER_BIT: continue
    bmc = bmesh.new(); bmc.from_mesh(o.data); bmc.faces.ensure_lookup_table(); bmc.normal_update()
    tr = BVHTree.FromBMesh(bmc); fn = [f.normal.copy() for f in bmc.faces]
    edge_pts = []
    for e in bmc.edges:
        if e.is_boundary:
            a_, b_ = e.verts[0].co, e.verts[1].co; n_s = max(1, int((a_ - b_).length / .004))
            edge_pts += [a_.lerp(b_, k / n_s) for k in range(n_s + 1)]
    bmc.free()
    kd = None
    if edge_pts:
        kd = KDTree(len(edge_pts))
        for i_, p_ in enumerate(edge_pts): kd.insert(p_, i_)
        kd.balance()
    n_cov = 0
    for v_ in me.vertices:
        if _ishair[v_.index] or v_.co.z > NECK + .06: continue
        if 'cone_c' in o:
            if _in_cone(o, tr, v_.co): _cbits[v_.index] |= COVER_BIT[nm]; n_cov += 1
            continue
        n_ = v_.normal; hit = None
        for d_ in (n_, -n_):
            h_ = tr.ray_cast(v_.co - d_ * .0005, d_, .08)
            if h_[0] is not None and (hit is None or h_[3] < hit[3]): hit = h_
        if hit is None or abs(fn[hit[2]].dot(n_)) < .3: continue
        if kd is not None and kd.find(hit[0])[2] < .006: continue
        _cbits[v_.index] |= COVER_BIT[nm]; n_cov += 1
    print('CL covered by', nm, n_cov, 'body points')
_ca = me.color_attributes.get('skinw')
if _ca is not None and _ca.domain == 'CORNER':
    _al = np.array([_cbits[l.vertex_index] for l in me.loops], np.float32) / 255.
    _buf = np.zeros(len(_ca.data) * 4, np.float32); _ca.data.foreach_get('color', _buf); _buf[3::4] = _al; _ca.data.foreach_set('color', _buf)
    for m_ in me.materials:
        if m_ is not None: m_['cover_mark'] = True; m_['kit_waist'] = float(WAIST); m_['kit_neck'] = float(NECK); m_['kit_grey'] = float(GREY_LUM)   # (the game paints the swim kit in the worn clothes' colours: above the waist the top's, below the trousers')
    print('CL cover bits written on', int((_cbits > 0).sum()), 'of', len(me.vertices), 'body points')
# (owner 9 Nov 2026, the poses: trousers came out through tops, leggings and trousers through skirts and the áo dài's
# panels, the bib and shorts through Lumi's top, when the children walked, waved and sat) a garment worn under another is
# not drawn where that one covers it, the same way (bits of the outer garments, js/friend-model.ts GCOVER_BIT, in the
# alpha of the inner garment's corner colour). Covered at rest stays covered as they bend: what pokes out is hidden.
_gcov = [g['name'] for g in SHAPES if g['layer'] in (1, 2)]
assert len(_gcov) <= 8, 'more than 8 covering garments: widen the cover mark'
GCOVER_BIT = {n_: 1 << i for i, n_ in enumerate(_gcov)}
_byname = {o.name[2:]: o for o in parts}
_gtr = {}
for nm in GCOVER_BIT:
    o = _byname.get(nm)
    if o is None: continue
    bmc = bmesh.new(); bmc.from_mesh(o.data); bmc.faces.ensure_lookup_table(); bmc.normal_update()
    pts = []
    for e in bmc.edges:
        if e.is_boundary:
            a_, b_ = e.verts[0].co, e.verts[1].co; n_s = max(1, int((a_ - b_).length / .004))
            pts += [a_.lerp(b_, k / n_s) for k in range(n_s + 1)]
    kd = KDTree(max(1, len(pts)))
    for i_, p_ in enumerate(pts): kd.insert(p_, i_)
    print('CL outer', nm, 'open-edge points', len(pts), 'faces', len(bmc.faces))
    kd.balance(); _gtr[nm] = (BVHTree.FromBMesh(bmc), [f.normal.copy() for f in bmc.faces], kd if pts else None); bmc.free()
for o in parts:
    nm = o.name[2:]; ca = o.data.color_attributes.get('shade')
    if ca is None or ca.domain != 'CORNER': continue
    # (only an outer layer hides an inner one: trousers, shorts, leggings < tops < skirt, áo dài panels, bib; the bib lay "under"
    # the top as much as over it and both vanished)
    _rank = lambda n_: LAYER.get(n_, 3)
    overs = [k for k in _gtr if k != nm and _rank(k) > _rank(nm)]
    if not overs: continue
    o.data.update(); bits = np.zeros(len(o.data.vertices), np.int32); _per = {}
    for v_ in o.data.vertices:
        n_ = v_.normal
        for k in overs:
            tr, fn, kd = _gtr[k]; hit = None
            if 'cone_c' in _byname[k]:
                if _in_cone(_byname[k], tr, v_.co): bits[v_.index] |= GCOVER_BIT[k]; _per[k] = _per.get(k, 0) + 1
                continue
            # (a skirt, the áo dài's panels and the bib hang well clear of the legs and chest: out to 25 cm, outward only, or a
            # ray back through the leg met the back panel and hid a shin seen from the front)
            far_ = _rank(k) == 2
            for d_ in ((n_,) if far_ else (n_, -n_)):
                h_ = tr.ray_cast(v_.co - d_ * .0005, d_, .25 if far_ else .08)
                if h_[0] is not None and (hit is None or h_[3] < hit[3]): hit = h_
            if hit is None or abs(fn[hit[2]].dot(n_)) < .3: continue
            if kd is not None and kd.find(hit[0])[2] < (.002 if far_ else .006): continue   # (a skirt's or panels' waistband: 2 mm, or a top's hem showed over it, Lumi's)
            bits[v_.index] |= GCOVER_BIT[k]; _per[k] = _per.get(k, 0) + 1
    _buf = np.zeros(len(ca.data) * 4, np.float32); ca.data.foreach_get('color', _buf)
    _buf[3::4] = np.array([bits[l.vertex_index] for l in o.data.loops], np.float32) / 255.; ca.data.foreach_set('color', _buf)
    o.data.materials[0]['cover_mark'] = True
    print('CL garment', nm, 'points under other garments', int((bits > 0).sum()), 'of', len(bits), _per)
# every part follows the rig as the body does
for o in parts:
    o.parent = rig
    if not any(md.type == 'ARMATURE' for md in o.modifiers):
        md = o.modifiers.new('Armature', 'ARMATURE'); md.object = rig

if RDIR:   # a check picture: every part over the body in turn, in its own test colour
    os.makedirs(RDIR, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x, sc.render.resolution_y = 480, 640
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = (J['head'].z + .3) * 1.05
    co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    co.location = (0, -5, (J['head'].z + .3) / 2); co.rotation_euler = (math.radians(90), 0, 0)
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = 3.5
    for o in parts:
        m = o.data.materials[0]; m.use_nodes = True; bs = m.node_tree.nodes['Principled BSDF']
        ca = m.node_tree.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'shade'
        mix = m.node_tree.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs[0].default_value = 1
        mix.inputs[6].default_value = (.85, .3, .3, 1); m.node_tree.links.new(ca.outputs['Color'], mix.inputs[7]); m.node_tree.links.new(mix.outputs[2], bs.inputs['Base Color'])
    for show in parts:
        for o in parts: o.hide_render = o is not show
        sc.render.filepath = os.path.join(RDIR, show.name + '.png'); bpy.ops.render.render(write_still=True)
    for o in parts: o.hide_render = False
    for o in parts:   # (the check colours are not exported)
        m = o.data.materials[0]; m.use_nodes = False

for o in parts:   # (the game reads each garment's bits and layer from here: js/friend-model.ts, no table of its own)
    m_ = o.data.materials[0]; nm_ = o.name[2:]; m_['garment'] = nm_; m_['cover_bit'] = COVER_BIT.get(nm_, 0); m_['gcover_bit'] = GCOVER_BIT.get(nm_, 0); m_['layer'] = LAYER.get(nm_, 3)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:   # the rig, everything on it (body, feet, faces, clothes) and the friend's item
    if o is rig or o.parent is rig or (o.type == 'MESH' and '-item' in o.name): o.select_set(True)
VL.objects.active = rig
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_morph=False,
                          export_yup=True, export_image_format='AUTO', export_vertex_color='ACTIVE', export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + '.blend')
print('CL done', OUT, 'parts', len(parts))

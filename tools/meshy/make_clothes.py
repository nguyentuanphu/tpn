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
    bm.normal_update()
    # painted shade: the body's own colour under each corner, as brightness relative to the grey clothes / the skin
    uv = bm.loops.layers.uv.active; col = bm.loops.layers.color.new('shade')
    for f in bm.faces:
        for l in f.loops:
            c = sample(*l[uv].uv); lum = float(max(c)); s_ = (lum - float(min(c))) / max(lum, 1e-4)
            k = lum / (GREY_LUM if s_ < .15 else SKIN_LUM); k = min(1.15, max(.55, k))
            l[col] = (k, k, k, 1)
    bm.to_mesh(o.data); bm.free()
    for nm in [ca.name for ca in o.data.color_attributes if ca.name and ca.name != 'shade']: o.data.color_attributes.remove(o.data.color_attributes[nm])
    o.data.color_attributes.active_color = o.data.color_attributes['shade']
    o.data.materials.clear(); m = bpy.data.materials.new('lit-g-' + name); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    print('CL part', name, 'triangles', len(o.data.polygons))
    return o

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
    o = bpy.data.objects.new('g-' + name, me2); sc.collection.objects.link(o)
    for g in ('torso', 'legL', 'legR'): o.vertex_groups.new(name=g)
    for v in me2.vertices:
        t = (z_top - v.co.z) / max(z_top - z_bot, 1e-4); s = 'legL' if v.co.x >= cx else 'legR'
        o.vertex_groups['torso'].add([v.index], 1 - .45 * t, 'REPLACE'); o.vertex_groups[s].add([v.index], .45 * t, 'REPLACE')
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
parts.append(shell('top-short', faces_for(top=TOP_HEM - .06, sleeve=.75), .012, cuts=[neck_cut(), hem_cut(TOP_HEM)] + limb_cuts('arm', .5)))
parts.append(shell('top-long', faces_for(top=TOP_HEM - .06, sleeve=1.8), .013, cuts=[neck_cut(), hem_cut(TOP_HEM)] + limb_cuts('arm', 1.55)))
parts.append(shell('tunic-long', np.union1d(faces_for(top=HIP - .2, sleeve=1.8, under_waist=True), faces_for(leg=.8)), .015,
                   cuts=[neck_cut(), hem_cut(HIP - .12)] + limb_cuts('arm', 1.55) + limb_cuts('leg', .55)))
parts.append(shell('bodice', faces_for(top=HIP - .09, sleeve=.6), .012, cuts=[neck_cut(), hem_cut(HIP - .03)] + limb_cuts('arm', .35)))
# bottoms
parts.append(shell('shorts', faces_for(under_waist=True, leg=max(.75, KIT_LEG_T + .2)), .010, cuts=limb_cuts('leg', max(.5, KIT_LEG_T))))
parts.append(shell('trousers', faces_for(under_waist=True, leg=1.95), .011, cuts=limb_cuts('leg', 1.82)))
parts.append(shell('leggings', faces_for(under_waist=True, leg=1.95), .007, cuts=limb_cuts('leg', 1.85)))
# overalls: the bib over the chest's front, below the arms
# (owner review 8 Nov: Lumi's bib was a round blob) a straight-edged bib: the chest's front, cut flat at its top and sides
_bf = faces_for(top=HIP - .04, front_only=True)
BIB_TOP = WAIST + (NECK - WAIST) * .55; BIB_X = SH_X * .55
parts.append(shell('bib', _bf[(fc[_bf, 2] < BIB_TOP + .05) & (np.abs(fc[_bf, 0]) < BIB_X + .05)], .016, smooth=2,
                   cuts=[('torso', None, Vector((0, 0, BIB_TOP)), Vector((0, 0, 1))), ('torso', None, Vector((BIB_X, 0, 0)), Vector((1, 0, 0))),
                         ('torso', None, Vector((-BIB_X, 0, 0)), Vector((-1, 0, 0))), hem_cut(WAIST - .01)]))
# skirts and the áo dài's panels
parts.append(cone('skirt', WAIST, KNEE + .03, .55, .02))
parts.append(cone('aodai-panels', WAIST, ANKLE + .04, .5, .03, panels=True, slit=.14))
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

for o in parts: o.data.materials[0]['garment'] = o.name[2:]
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:   # the rig, everything on it (body, feet, faces, clothes) and the friend's item
    if o is rig or o.parent is rig or (o.type == 'MESH' and '-item' in o.name): o.select_set(True)
VL.objects.active = rig
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_morph=False,
                          export_yup=True, export_image_format='AUTO', export_vertex_color='ACTIVE', export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + '.blend')
print('CL done', OUT, 'parts', len(parts))

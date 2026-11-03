# One-piece sculpted bodies for lumi.py (run inside it, after the clothes are built).
# Owner, 3 Nov 2026 AEDT (pop-up): "One-piece sculpted body": the arms must grow out of the shoulders the way the legs grow out of the hips,
# smooth when moving, not "2 cái cây gắn vào". The skin is made of metaballs that melt into each other (torso, hips, neck, legs as one;
# each arm with its own shoulder), joined at the shoulders only, then smoothed. Fitted clothes (shirt, sleeves, trousers, shorts) are the
# body surface lifted a little, so they hug the body; loose clothes (áo bà ba, áo dài panels, skirts, coat, cape) stay on top.

MB_K = 1 / .575
CH_Z = lambda: (B['zW'] + B['zC']) / 2 + .04 * S; CH_SZ = lambda: (B['zS'] - B['zW']) * .64           # the chest
HP_Z = lambda: (B['zCr'] + B['zW']) / 2 + .03 * S;  HP_SZ = lambda: (B['zW'] - B['zCr']) * .55         # the belly and hips, ending above the crotch
BW = {'felt': .92, 'toy': .88}.get(LOOK, .86)   # body width for each look   # a metaball's surface sits at .575 of its radius (stiffness 2, threshold .6)

def _mb(name):
    mb = bpy.data.metaballs.new(name); mb.resolution = mb.render_resolution = .006 * S; mb.threshold = .6
    o = bpy.data.objects.new(name, mb); scene.collection.objects.link(o); return o, mb

def _ball(mb, c, rho, size=None):
    e = mb.elements.new(type='ELLIPSOID' if size else 'BALL'); e.co = c; e.radius = rho * MB_K
    if size: e.size_x, e.size_y, e.size_z = size
    return e

def _cap(mb, a, b, rho):
    a, b = Vector(a), Vector(b); e = mb.elements.new(type='CAPSULE'); e.co = (a + b) / 2; e.radius = rho * MB_K
    e.size_x = (b - a).length / 2; e.rotation = Vector((1, 0, 0)).rotation_difference((b - a).normalized()); return e

def arm_points(s):
    sh, el, wr = [Vector((s * p[0], p[1], p[2])) for p in (B['sh'], B['el'], B['wr'])]
    if s > 0: wr = wr + Vector((.012 * S, -.03 * S, .0))
    return sh, el, wr

def arm_param(p, s):
    """0 at the shoulder, 1 at the elbow, 2 at the wrist"""
    sh, el, wr = arm_points(s)
    t1 = max(0, min(1, (p - sh).dot(el - sh) / (el - sh).length_squared)); t2 = max(0, min(1, (p - el).dot(wr - el) / (wr - el).length_squared))
    d1 = (p - sh.lerp(el, t1)).length; d2 = (p - el.lerp(wr, t2)).length
    return (t1 if d1 <= d2 else 1 + t2), min(d1, d2)

def skin_body():
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']; g = G == 'f'
    o, mb = _mb('mbBody')
    _ball(mb, (0, 0, CH_Z()), 1, (wC * BW, wC * dep * .82 * BW / .86, CH_SZ()))           # chest (slim, owner 3 Nov)
    _ball(mb, (0, 0, HP_Z()), 1, (wH * BW * .98, wH * dep * .8 * BW / .86, HP_SZ()))          # belly and hips (no big tummy)
    _cap(mb, (0, 0, b['zS'] - .05 * S), (0, 0, b['zN'] + .04 * S), .05 * S)                                                    # neck: short and full (owner, 3 Nov)
    # the torso in proportion (owner, 3 Nov: "bụng, cổ và mông phải bố cục và proportionate hợp lý hơn"):
    _ball(mb, (0, 0, b['zS'] - .06 * S), 1, (wC * BW * 1.02, wC * dep * .7, .07 * S))                                         # upper chest under the collarbones
    kid = not (V and V['size'] != 'kid'); bel = (.85 if kid else .55) * (.8 if g else 1.0)
    _ball(mb, (0, -wH * dep * .2 * bel, HP_Z() + .015 * S), 1, (wH * BW * .78, wH * dep * .62 * (1 + .25 * bel), HP_SZ() * .85))   # a soft belly (rounder for children)
    for s_ in (-1, 1):   # the bottom: two rounded buttocks at the back, a little fuller for girls and women
        bk = 1.1 if g else 1.0
        _ball(mb, (s_ * wH * .4, wH * dep * .34, b['zCr'] + .055 * S), 1, (wH * .46 * bk, wH * dep * .5 * bk, (b['zW'] - b['zCr']) * .42))
        if g: _ball(mb, (s_ * wH * .55, 0, b['zCr'] + .07 * S), 1, (wH * .45, wH * dep * .55, (b['zW'] - b['zCr']) * .4))   # wider hips
    for s in (-1, 1):
        X = s * b['legX']; knee = (b['zCr'] + b['zAnk']) / 2 + .02 * S
        _cap(mb, (X, 0, b['zCr'] + .01 * S), (X, -.004, knee), b['rLeg'] * (1.2 if g else 1.13))                     # thigh
        _cap(mb, (X, -.004, knee), (X, 0, b['zAnk'] + .01 * S), b['rLeg'] * .98)                                                # shin
        _ball(mb, (X, -.004, knee + .01 * S), b['rLeg'] * 1.02)                                                                 # knee
        _ball(mb, (X, -.03 * S, b['zAnk'] - .015 * S), 1, (b['rLeg'] * .9, b['rLeg'] * 1.8, b['rLeg'] * .7))                 # foot (in the shoe)
        _cap(mb, (s * .04 * S, 0, b['zS'] - .025 * S), (s * b['sh'][0] * .9, 0, b['sh'][2] - .005 * S), b['rU'] * .82)   # the collarbone line: the shoulder runs out sideways
    parts = [o]
    for s in (-1, 1):
        ao, amb = _mb('mbArm' + ('L' if s > 0 else 'R'))
        sh, el, wr = arm_points(s); rU, rA = b['rU'], b['rA']
        _ball(amb, sh + Vector((-s * .006 * S, 0, -.012 * S)), rU * 1.04)       # the shoulder (deltoid), overlapping the body's shoulder
        _cap(amb, sh, el, rU * .95); _ball(amb, el, rA * 1.05); _cap(amb, el, wr, rA)
        hand = wr + (wr - el).normalized() * rA * 1.1
        _ball(amb, hand, 1, (rA * 1.1, rA * .9, rA * 1.3)); _ball(amb, hand + Vector((-s * rA * .6, -rA * .7, rA * .25)), rA * .42)
        parts.append(ao)
    dg = bpy.context.evaluated_depsgraph_get(); made = []
    for p in parts:
        me = bpy.data.meshes.new_from_object(p.evaluated_get(dg)); n = bpy.data.objects.new('skinPart', me); scene.collection.objects.link(n); made.append(n)
        bpy.data.objects.remove(p)
    with bpy.context.temp_override(active_object=made[0], selected_editable_objects=made, selected_objects=made): bpy.ops.object.join()
    sk = made[0]; sk.name = 'soft_skin'; sk.data.materials.append(SKIN)
    r = sk.modifiers.new('melt', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = .004 * S
    sm = sk.modifiers.new('soft', 'SMOOTH'); sm.factor = .9; sm.iterations = 10
    with bpy.context.temp_override(object=sk, active_object=sk):
        bpy.ops.object.modifier_apply(modifier='melt'); bpy.ops.object.modifier_apply(modifier='soft')
    for f in sk.data.polygons: f.use_smooth = True
    return sk

def layer(sk, keep, m, off, name):
    """a fitted garment: the body surface where keep(point) is true, lifted by off and given a little thickness"""
    bm = bmesh.new(); bm.from_mesh(sk.data); bm.normal_update()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    for v in bm.verts: v.co += v.normal * off
    o = obj_from(bm, name, m)
    for c in list(o.users_collection): c.objects.unlink(o)
    bpy.data.collections['body'].objects.link(o)
    so = o.modifiers.new('thick', 'SOLIDIFY'); so.thickness = .006 * S; so.offset = 1; so.use_rim = True
    sm = o.modifiers.new('soft', 'SMOOTH'); sm.factor = .5; sm.iterations = 3
    return o

# parts the sculpted body replaces (the old tubes and lathes); their materials and lengths tell the new clothes what to be
REPLACED_SKIN = ('arm', 'hand', 'thumb', 'leg', 'neck', 'toes')
REPLACED_TOP = ('shirt', 'tee', 'dressTop')
REPLACED_SLEEVE = ('sleeve', 'sleevePuff', 'sleeveRoll', 'shirtSleeve', 'coatSleeve', 'coatCuff', 'sleeveFrill')
REPLACED_PANTS = ('trouser', 'seat', 'shortsLeg', 'shortsCuff')
def sculpt():
    b = B; objs = [o for o in list(bpy.data.objects) if o.type == 'MESH' and o.data.materials]
    base = lambda o: o.name.split('.')[0]
    top = next((o.data.materials[0] for o in objs if base(o) in REPLACED_TOP and not o.data.materials[0].name.startswith('skin')), None)
    if top is None: top = next((o.data.materials[0] for o in objs if base(o) == 'shirt' and not o.data.materials[0].name.startswith('skin')), None)
    sleeves = []   # (material, from, to) along the arm: 0 shoulder, 1 elbow, 2 wrist
    for o in objs:
        if base(o) in REPLACED_SLEEVE:
            mw = o.matrix_world; s = 1 if (mw @ o.data.vertices[0].co).x > 0 else -1
            ts = [arm_param(mw @ v.co, s)[0] for v in o.data.vertices]
            sleeves.append((o.data.materials[0], min(ts), max(ts)))
    pants = [o for o in objs if base(o) in REPLACED_PANTS and not o.data.materials[0].name.startswith('skin')]
    pmat = pants[0].data.materials[0] if pants else None
    tights = next((o.data.materials[0] for o in objs if base(o) == 'leg' and not o.data.materials[0].name.startswith('skin')), None)
    plow = min(((o.matrix_world @ v.co).z for o in pants for v in o.data.vertices), default=None)
    for o in objs:
        if base(o) in REPLACED_SKIN + REPLACED_TOP + REPLACED_SLEEVE + REPLACED_PANTS: bpy.data.objects.remove(o)
    sk = skin_body(); col = bpy.data.collections['body']
    for c in list(sk.users_collection): c.objects.unlink(sk)
    col.objects.link(sk); subsurf(sk, 1)
    def arm_of(p):
        s = 1 if p.x > 0 else -1; t, d = arm_param(p, s)
        return (t if d < b['rU'] * 1.9 and abs(p.x) > b['wC'] * .8 else None)
    if top:
        def keep_top(p):
            t = arm_of(p)
            if t is not None:   # on the arm: covered only as far as the sleeves of this top reach
                return any(lo - .05 <= t <= hi for m, lo, hi in sleeves if m == top) or t < .12
            return b['zW'] - .05 * S < p.z < b['zN'] - .012 * S
        layer(sk, keep_top, top, .007 * S, 'soft_top')
    for m in {m for m, lo, hi in sleeves if m != top}:   # sleeves of another cloth (a coat over a shirt)
        rng = [(lo, hi) for mm, lo, hi in sleeves if mm == m]
        o = layer(sk, lambda p, rng=rng: (lambda t: t is not None and any(lo - .03 <= t <= hi + .03 for lo, hi in rng))(arm_of(p)), m, .014 * S, 'soft_sleeve')
    if pmat:
        low = plow if plow is not None else b['zAnk']
        o = layer(sk, lambda p: arm_of(p) is None and low - .005 < p.z < b['zW'] + .03 * S, pmat, .009 * S, 'soft_pants')
    if tights and tights != pmat:   # coloured tights or long trousers drawn on the legs
        layer(sk, lambda p: arm_of(p) is None and p.z < b['zCr'] + .04 * S and p.z > b['zAnk'] - .02 * S, tights, .004 * S, 'soft_tights')

LOOSE = ('bodice', 'corset', 'belt', 'buckle', 'aoBaBa', 'aoDai', 'coat', 'coatHem', 'coatStar', 'coatCollar', 'cape', 'clasp', 'tunic', 'bib', 'backPanel', 'apron',
         'skirt', 'frill', 'petalHem', 'dressTop', 'dressSkirt', 'dressBelt', 'longSkirt', 'brace', 'strap', 'button', 'bibStar', 'pocketLeaf', 'pocket', 'sun', 'dressStrap', 'collar')
def ease_loose(f=1.07):
    """the loose clothes were sized for the old body: open them a little so the fitted layer never shows through"""
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.split('.')[0] in LOOSE and o.name.split('.')[0] not in FIT and o.name.split('.')[0] not in ('petalHem', 'apron', 'pocketLeaf'):
            mw = o.matrix_world; inv = mw.inverted()
            for v in o.data.vertices:
                p = mw @ v.co
                if B['zCr'] - .12 * S < p.z < B['zN'] + .02 * S and abs(p.x) < B['wC'] * 1.8: v.co = inv @ Vector((p.x * f, p.y * f, p.z))

def body_r(z):
    """the body's radius at height z (chest and hips), as the metaballs build it"""
    r = 0.0
    for c, a, sz in ((CH_Z(), B['wC'] * BW, CH_SZ()), (HP_Z(), B['wH'] * BW * .98, HP_SZ())):
        t = (z - c) / sz
        if abs(t) < 1: r = max(r, a * math.sqrt(1 - t * t))
    return r * 1.06   # the melted surface is a little fuller than the parts

# garments that follow the body (owner, 3 Nov: a skirt must not be wider than the belly and hips): (margin, flare below the hips)
FIT = {'skirt': (.014, .3), 'dressSkirt': (.014, .3), 'longSkirt': (.014, .22), 'frill': (.02, .3), 'dressTop': (.012, 0), 'bodice': (.012, 0),
       'aoBaBa': (.022, .12), 'corset': (.016, 0), 'belt': (.016, 0), 'dressBelt': (.016, 0), 'tunic': (.02, .15), 'aoDai': (.014, .12)}
def fit_loose():
    rh = B['wH'] * BW * .98 * 1.06; dep = B['dep']; top_hip = HP_Z()
    def target(z, m, fl):
        r = body_r(z)
        if z < top_hip: r = max(r, rh)
        return r + m * S + fl * max(0, B['zCr'] + .03 * S - z)
    for o in [o for o in bpy.data.objects if o.type == 'MESH']:
        base = o.name.split('.')[0]
        if base in FIT:   # ring by ring: every point at a height goes to the body's radius there, plus a margin and the flare
            m, fl = FIT[base]; mw = o.matrix_world; inv = mw.inverted()
            for v in o.data.vertices:
                p = mw @ v.co; r = math.hypot(p.x, p.y / dep)
                if r > 1e-4: k = target(p.z, m, fl) / r; v.co = inv @ Vector((p.x * k, p.y * k, p.z))
        elif base in ('petalHem', 'apron', 'pocketLeaf'):   # pieces on a skirt move with it
            mw = o.matrix_world; c = mw @ (sum((Vector(b) for b in o.bound_box), Vector()) / 8); r = math.hypot(c.x, c.y / dep)
            if r > 1e-4 and c.z < B['zW']:
                k = (target(c.z, .03, .3) / r) if base == 'petalHem' else (target(c.z, .03, .2) / r)
                o.matrix_world = Matrix.Translation(Vector((c.x * (k - 1), c.y * (k - 1), 0))) @ mw

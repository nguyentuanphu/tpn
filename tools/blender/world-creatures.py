# (v1.08e creatures, owner 6 Nov 2026 AEDT) Every animal, pet and companion of the 3D world, remade in Blender.
# Reads tools/blender/creatures-spec.json (the game's own shapes, part by part: node tools/blender/creatures-dump.mts),
# so each model stands where the code shape stands, at its size, facing +z, on y = 0.
# The look: the big parts of each moving piece (body, head, ears, tail, legs) are melted into one soft felt shape
# (voxel remesh, smoothed, thinned), their colours carried over; eyes, noses and other small bits stay crisp.
# One skinned mesh, one material (vertex colours: js/modelkit.ts gives it the friends' toon bands), a small skeleton
# (one bone per moving piece) and the clips: idle, walk (companions: fly), one happy move (wag, hop or flap), follow, cheer.
# Run: blender -b -P tools/blender/world-creatures.py -- <out dir> [kind ...] [sheet]
#   writes <out dir>/creature-<kind>.raw.glb; tools/make-creatures.mts compresses them (gltfpack, meshopt) into models/world/
import sys, os, math, json
sys.dont_write_bytecode = True
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else os.path.join(HERE, 'out-creatures')
SHEET = 'sheet' in argv
ONLY = [a for a in argv[1:] if a != 'sheet']
SPEC = json.load(open(os.path.join(HERE, 'creatures-spec.json')))
os.makedirs(OUT, exist_ok=True)
FPS = 30
TAU = math.pi * 2

# three.js (y up, faces +z) to Blender (z up, faces -y); the glTF exporter turns it back
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
def tv(p): return Vector((p[0], -p[2], p[1]))

def lin(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(x * 2 for x in h)
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c) + (1.0,)

def three_matrix(pos, rot, scl, special=False):
    """the same matrix as js/gfx.ts P(): three's Euler order XYZ (Blender ZYX)"""
    R = Euler(rot, 'ZYX').to_matrix().to_4x4(); S = Matrix.Diagonal((*scl, 1)); T = Matrix.Translation(Vector(pos))
    return T @ S @ R if special else T @ R @ S

# ---- primitives, made in three's own frame (y up) like three's geometries, rounder ----
def grid(rows, closed_u=True):
    """faces between rings of points (rows: list of lists of vertex indexes)"""
    f = []
    for a, b in zip(rows, rows[1:]):
        n = len(a)
        for k in range(n if closed_u else n - 1):
            k2 = (k + 1) % n
            q = [a[k], a[k2], b[k2], b[k]]
            q = [v for i, v in enumerate(q) if v not in q[:i]]
            if len(q) >= 3: f.append(q)
    return f

def lathe(profile, seg):
    """profile: (radius, y) from bottom to top; a radius of 0 is a pole"""
    V, rows = [], []
    for r, y in profile:
        if r <= 1e-6: V.append((0, y, 0)); rows.append([len(V) - 1] * seg)
        else:
            row = []
            for k in range(seg):
                t = TAU * k / seg; V.append((r * math.sin(t), y, r * math.cos(t))); row.append(len(V) - 1)
            rows.append(row)
    return V, grid(rows)

def cap_ring(V, F, row, centre):
    V.append(centre); c = len(V) - 1
    for k in range(len(row)): F.append([row[k], row[(k + 1) % len(row)], c])

def prim(spec, res):
    t, p = spec['type'], spec['p']
    if t == 'SphereGeometry':
        r = p['radius']; ws = max(res, 8); hs = max(res * 2 // 3, 6)
        ps, pl, ts, tl = p.get('phiStart', 0), p.get('phiLength', TAU), p.get('thetaStart', 0), p.get('thetaLength', math.pi)
        full = pl >= TAU - 1e-4
        V, rows = [], []
        for j in range(hs + 1):
            th = ts + tl * j / hs; row = []
            for i in range(ws if full else ws + 1):
                ph = ps + pl * i / ws
                V.append((-r * math.cos(ph) * math.sin(th), r * math.cos(th), r * math.sin(ph) * math.sin(th))); row.append(len(V) - 1)
            rows.append(row)
        F = grid(rows, full)
        if ts + tl < math.pi - 1e-4:   # an open half sphere (the turtle's shell): closed underneath
            cap_ring(V, F, rows[-1][::-1], (0, r * math.cos(ts + tl), 0))
        return V, F
    if t == 'CapsuleGeometry':
        r, L = p['radius'], p['length']; n = max(res // 3, 4)
        prof = [(0, -L / 2 - r)] + [(r * math.sin(math.pi / 2 * k / n), -L / 2 - r * math.cos(math.pi / 2 * k / n)) for k in range(1, n + 1)]
        prof += [(r * math.sin(math.pi / 2 * k / n), L / 2 + r * math.cos(math.pi / 2 * k / n)) for k in range(n, 0, -1)] + [(0, L / 2 + r)]
        return lathe(prof, max(res, 8))
    if t == 'CylinderGeometry':
        h = p['height']; return lathe([(0, -h / 2), (p['radiusBottom'], -h / 2), (p['radiusTop'], h / 2), (0, h / 2)], max(res, 8))
    if t == 'ConeGeometry':
        h = p['height']; return lathe([(0, -h / 2), (p['radius'], -h / 2), (0, h / 2)], max(res, 8))
    if t == 'BoxGeometry':
        w, h, d = p['width'] / 2, p['height'] / 2, p['depth'] / 2
        V = [(x * w, y * h, z * d) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
        return V, [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]
    if t == 'TorusGeometry':
        R, tr, arc = p['radius'], p['tube'], p.get('arc', TAU); tub = max(res * 2, 16); rad = max(res // 2, 6)
        full = arc >= TAU - 1e-4; V, rows = [], []
        for i in range(tub if full else tub + 1):
            u = arc * i / tub; row = []
            for j in range(rad):
                v = TAU * j / rad; V.append(((R + tr * math.cos(v)) * math.cos(u), (R + tr * math.cos(v)) * math.sin(u), tr * math.sin(v))); row.append(len(V) - 1)
            rows.append(row)
        F = grid(rows) if not full else grid(rows + [rows[0]])
        if not full:
            for row, u in ((rows[0][::-1], 0), (rows[-1], arc)): cap_ring(V, F, row, (R * math.cos(u), R * math.sin(u), 0))
        return V, F
    if t == 'CircleGeometry':   # a firefly wing: a thin disc
        r = p['radius']; n = max(res, 12); th = r * .06
        V = [(r * math.cos(TAU * k / n), r * math.sin(TAU * k / n), z) for z in (-th, th) for k in range(n)]
        F = [list(range(n))[::-1], list(range(n, 2 * n))] + [[k, (k + 1) % n, n + (k + 1) % n, n + k] for k in range(n)]
        return V, F
    if t == 'ShapeGeometry':    # the dragon's wing (js/companion.ts dragon(): the same outline), a little thick
        pts = [(0, 0), (.32, .12), (.28, -.04), (.18, -.02), (.1, -.08)]; n = len(pts); th = .008
        V = [(x, y, z) for z in (-th, th) for x, y in pts]
        F = [list(range(n))[::-1], list(range(n, 2 * n))] + [[k, (k + 1) % n, n + (k + 1) % n, n + k] for k in range(n)]
        return V, F
    raise ValueError(t)

def extents(spec):
    """the part's size along its own three axes, after its stretch"""
    t, p = spec['type'], spec['p']; s = [abs(x) for x in spec['scl']]
    if t == 'SphereGeometry': e = [2 * p['radius']] * 3
    elif t == 'CapsuleGeometry': e = [2 * p['radius'], p['length'] + 2 * p['radius'], 2 * p['radius']]
    elif t == 'CylinderGeometry': r = max(p['radiusTop'], p['radiusBottom']); e = [2 * r, p['height'], 2 * r]
    elif t == 'ConeGeometry': e = [2 * p['radius'], p['height'], 2 * p['radius']]
    elif t == 'BoxGeometry': e = [p['width'], p['height'], p['depth']]
    elif t == 'TorusGeometry': e = [2 * (p['radius'] + p['tube']), 2 * (p['radius'] + p['tube']), 2 * p['tube']]
    else: e = [.3, .3, .01]
    return [a * b for a, b in zip(e, s)], (2 * p['tube'] * min(s) if t == 'TorusGeometry' else None)

def mesh_obj(name, parts, colour_layer=True):
    """parts: (V in Blender coords, F, linear colour)"""
    bm = bmesh.new(); col = bm.loops.layers.float_color.new('Col')
    for V, F, c in parts:
        vs = [bm.verts.new(v) for v in V]
        for f in F:
            try: face = bm.faces.new([vs[i] for i in f])
            except ValueError: continue
            for lp in face.loops: lp[col] = c
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for poly in me.polygons: poly.use_smooth = True
    return o

def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)

def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def felt_piece(name, mass, detail, voxel, target):
    """one moving piece: its big parts melted into one soft shape, the small bits kept as they are"""
    pieces = []
    if mass:
        src = mesh_obj(name + '-src', mass)
        o = src.copy(); o.data = src.data.copy(); bpy.context.collection.objects.link(o); o.name = name + '-felt'
        rm = o.modifiers.new('remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.adaptivity = 0
        sm = o.modifiers.new('soft', 'SMOOTH'); sm.factor = .5; sm.iterations = 2
        apply_mods(o)
        if tris(o) > target:
            dc = o.modifiers.new('thin', 'DECIMATE'); dc.ratio = max(.01, target / tris(o)); apply_mods(o)
        if not o.data.color_attributes.get('Col'): o.data.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        dt = o.modifiers.new('colour', 'DATA_TRANSFER'); dt.object = src; dt.use_loop_data = True
        dt.data_types_loops = {'COLOR_CORNER'}; dt.loop_mapping = 'NEAREST_POLY'
        apply_mods(o)
        for poly in o.data.polygons: poly.use_smooth = True
        bpy.data.objects.remove(src); pieces.append(o)
    if detail: pieces.append(mesh_obj(name + '-bits', detail))
    return pieces

# ---- the moves: the same moves js/animals.ts tickAnimal gives the code shapes, as looping clips ----
def clip(arm, name, length, pose):
    """pose(t) -> {bone: (rot xyz, loc xyz, scale xyz)} in three's frame (the bones are laid out so it is the same)"""
    act = bpy.data.actions.new(name); act.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = act
    n = max(2, round(length * FPS))
    for f in range(n + 1):
        t = f / FPS * (length / (n / FPS))
        for b, (r, l, s) in pose(t).items():
            pb = arm.pose.bones[b]; pb.rotation_mode = 'ZYX'
            pb.rotation_euler = r; pb.location = l; pb.scale = s
            pb.keyframe_insert('rotation_euler', frame=f + 1); pb.keyframe_insert('location', frame=f + 1); pb.keyframe_insert('scale', frame=f + 1)
    for fc in act.fcurves:
        for k in fc.keyframe_points: k.interpolation = 'LINEAR'
    arm.animation_data.action = None
    return act

Z3, O3 = (0, 0, 0), (1, 1, 1)
def rest(bones): return {b: (Z3, Z3, O3) for b in bones}
def k_of(freq, w): return max(1, round(freq / w))   # a whole number of swings in a loop, so it loops without a jump

HAPPY = {}
def animal_moves(kind, A, arm, bones):
    legs = [(f'leg{i}', l) for i, l in enumerate(A['legs'])]
    ears = [b for b in bones if b.startswith('ear')]
    has_tail = 'tail' in bones; hop_gait = A['gait'] == 'hop'; up = A['upright']
    def tail_pose(P, t, w, amt=1.0, fast=1.0):
        if not has_tail: return
        r = [0, 0, 0]
        if A['wag']: r[1] = math.sin(t * w * k_of(A['wag'] * fast, w)) * .6 * amt
        if A['sway']:
            s = math.sin(t * w * k_of(A['sway'] * fast, w)) * .3 * amt
            if A['swing']: r[2] = s; r[0] = math.sin(t * w * k_of(A['sway'] * 1.3 * fast, w)) * .1
            else: r[1] = s
        P['tail'] = (tuple(r), Z3, O3)
    def gait(P, t, w, run=1.0, lift=0.0):
        ph = w * t
        if hop_gait:
            hop = max(0, math.sin(ph)) * run
            P['body'] = (((-.25 if up else -.15) * hop * (1 if math.cos(ph) > 0 else -.6), 0, 0), (0, hop * (.32 if up else .2), 0), O3)
            for b, l in legs: P[b] = ((-hop * .9 if l['back'] else (.3 + hop * .4 if l['arm'] else -hop * .6), 0, 0), Z3, O3)
            for i, e in enumerate(ears): P[e] = ((-hop * .5, 0, 0), Z3, O3)
        else:
            for b, l in legs: P[b] = ((math.sin(ph + l['ph']) * .65 * run, 0, 0), Z3, O3)
            P['body'] = ((0, 0, math.sin(ph) * A['waddle'] * run), (0, abs(math.sin(ph)) * .03 * run, 0), O3)
            for i, e in enumerate(ears): P[e] = ((math.sin(ph * 2 + i) * .12 * run, 0, 0), Z3, O3)
        if 'head' in bones: P['head'] = ((math.sin(ph * 2) * .06 * run - lift, 0, 0), Z3, O3)
    def idle(t):
        L = 6.0; w = TAU / L; P = rest(bones)
        P['body'] = (Z3, Z3, (1, 1 + math.sin(2 * w * t) * .02, 1))
        if 'head' in bones:
            pk = max(0, math.sin(w * t)) ** 6 * .9 if A['peck'] else 0
            P['head'] = ((pk, math.sin(w * t) * .5 + math.sin(2 * w * t) * .1, 0), Z3, O3)
        for i, e in enumerate(ears): P[e] = ((math.sin(2 * w * t + i) * .05, 0, 0), Z3, O3)
        tail_pose(P, t, w, .7)
        for b, l in legs:
            if l['arm']: P[b] = ((.3, 0, 0), Z3, O3)
        return P
    walk_len = 1.0 if A['slow'] else .7
    def walk(t): P = rest(bones); gait(P, t, TAU / walk_len); tail_pose(P, t, TAU / walk_len); return P
    def follow(t): P = rest(bones); gait(P, t, TAU / (walk_len * .7), 1.0, .12); tail_pose(P, t, TAU / (walk_len * .7), 1, 1.4); return P
    move = 'wag' if (has_tail and (A['wag'] or kind in ('cow', 'bull', 'buffalo', 'calf', 'unicorn', 'elephant'))) else 'hop'
    if kind in ('chicken', 'penguin', 'emu', 'crane', 'peacock'): move = 'flap'
    if kind in ('bunny', 'joey', 'koala', 'panda', 'bear'): move = 'hop'
    HAPPY[kind] = move
    def happy(t):
        L = 1.2; w = TAU / L; P = rest(bones)
        if move == 'wag':
            P['body'] = (Z3, (0, abs(math.sin(2 * w * t)) * .05, 0), O3)
            if 'head' in bones: P['head'] = ((-.1, 0, math.sin(w * t) * .18), Z3, O3)
            tail_pose(P, t, w, 1.3, 2.5)
            if A['wag'] == 0 and has_tail: P['tail'] = ((0, math.sin(6 * w * t) * .7, 0), Z3, O3)
        elif move == 'hop':
            hop = max(0, math.sin(2 * w * t)); P['body'] = ((-.12 * hop, 0, 0), (0, hop * .16, 0), O3)
            for b, l in legs: P[b] = ((-hop * .5 if not l['arm'] else .3 + hop * .9, 0, 0), Z3, O3)
            if 'head' in bones: P['head'] = ((-.15 * hop, 0, 0), Z3, O3)
            for e in ears: P[e] = ((-hop * .4, 0, 0), Z3, O3)
            tail_pose(P, t, w, 1, 2)
        else:   # flap: little hops, the head bobbing, flippers or the fan flapping
            hop = max(0, math.sin(2 * w * t)); P['body'] = ((0, 0, math.sin(4 * w * t) * .06), (0, hop * .12, 0), O3)
            if 'head' in bones: P['head'] = ((math.sin(4 * w * t) * .25, 0, 0), Z3, O3)
            for b, l in legs:
                P[b] = ((0, 0, (1 if int(b[3:]) % 2 == 0 else -1) * -(.4 + .5 * abs(math.sin(4 * w * t)))), Z3, O3) if l['arm'] else ((-hop * .3, 0, 0), Z3, O3)
            if has_tail: P['tail'] = ((-.25 - .2 * abs(math.sin(2 * w * t)), math.sin(2 * w * t) * .25, 0), Z3, O3)
        return P
    def cheer(t):
        L = 1.4; w = TAU / L; P = rest(bones)
        jump = max(0, math.sin(2 * w * t)) ** .8
        P['body'] = ((-.2 * jump, 0, 0), (0, jump * (.35 if not up else .45), 0), (1, 1 + .06 * jump, 1))
        if 'head' in bones: P['head'] = ((-.3 * jump, math.sin(w * t) * .2, 0), Z3, O3)
        for b, l in legs: P[b] = ((.7 * jump if l['arm'] else (-.6 * jump if not l['back'] else -.9 * jump), 0, 0), Z3, O3)
        for e in ears: P[e] = ((-.5 * jump, 0, 0), Z3, O3)
        tail_pose(P, t, w, 1.4, 2.5)
        return P
    return [('idle', 6.0, idle), ('walk', walk_len, walk), (move, 1.2, happy), ('follow', walk_len * .7, follow), ('cheer', 1.4, cheer)]

def companion_moves(kind, A, arm, bones):
    flap = A['flap']; HAPPY[kind] = 'flap'
    def wings(P, t, w, f, amt=.6):
        k = k_of(f, w)
        for b in bones:
            if b.startswith('wing'): P[b] = ((0, 0, (1 if b == 'wing0' else -1) * math.sin(t * w * k) * amt), Z3, O3)
    bm = 0 if kind == 'firefly' else 1   # (the firefly's glowing tail is the game's own light: its body keeps still against it)
    def idle(t): L = 2.0; w = TAU / L; P = rest(bones); P['body'] = ((math.sin(w * t) * .06 * bm, 0, 0), (0, math.sin(w * t) * .03 * bm, 0), O3); wings(P, t, w, flap); return P
    def fly(t): L = 1.0; w = TAU / L; P = rest(bones); P['body'] = ((.15 * bm, 0, math.sin(w * t) * .06 * bm), (0, math.sin(2 * w * t) * .02 * bm, 0), O3); wings(P, t, w, flap * 1.2, .7); return P
    def happy(t): L = 1.2; w = TAU / L; P = rest(bones); P['body'] = ((0, 0, 0), (0, abs(math.sin(2 * w * t)) * .1, 0), O3); wings(P, t, w, flap * 1.6, .8); return P
    def follow(t): L = .8; w = TAU / L; P = rest(bones); P['body'] = ((.25 * bm, 0, 0), Z3, O3); wings(P, t, w, flap * 1.4, .75); return P
    def cheer(t): L = 1.6; w = TAU / L; P = rest(bones); P['body'] = ((-w * t, 0, 0), (0, math.sin(w * t / 2) * .15, 0), O3); wings(P, t, w, flap * 1.5, .8); return P   # a loop-the-loop
    return [('idle', 2.0, idle), ('fly', 1.0, fly), ('flap', 1.2, happy), ('follow', .8, follow), ('cheer', 1.6, cheer)]

# ---- one creature ----
def build(kind, A, companion=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = FPS
    mn, mx = A['box']['min'], A['box']['max']; size = max(mx[i] - mn[i] for i in range(3))
    voxel = size / (70 if companion else 95); small = size * (.12 if not companion else .09)
    piv = A['pivots']; W = []   # each pivot's matrix in the creature (three frame)
    for p in piv:
        M = three_matrix(p['pos'], p['rot'], (1, 1, 1))
        W.append(M if p['parent'] < 0 else M)   # (the dump already gives each pivot's place in the whole creature)
    bones = [p['role'] for p in piv if p['role'] != 'root']
    # how much detail each piece gets: by the area its parts cover
    def area(s):
        e, _ = extents(s); return e[0] * e[1] + e[1] * e[2] + e[0] * e[2]
    total_area = sum(area(s) for p in piv if p['role'] != 'root' for s in p['parts'] + p['extra']) or 1
    budget = 2600 if not companion else 1800
    objs = []
    for i, p in enumerate(piv):
        if p['role'] == 'root': continue
        mass, detail = [], []
        for s in p['parts'] + [e for e in p['extra'] if not (e.get('glow') and e.get('opacity', 1) >= 1)]:
            e, tube = extents(s); thin = min(e) if tube is None else tube
            res = 14 if max(e) > size * .25 else (12 if max(e) > small else 10)
            V, F = prim(s, res)
            special = s['type'] == 'ConeGeometry' and s['p'].get('radialSegments') == 4 and not s['rot'][0] and not s['rot'][2] and s['scl'][0] != s['scl'][2]
            M = C @ W[i] @ three_matrix(s['pos'], s['rot'], s['scl'], special)
            V = [(M @ Vector(v)).to_tuple() for v in V]
            if s['scl'][0] * s['scl'][1] * s['scl'][2] < 0: F = [f[::-1] for f in F]   # a mirrored part (the dragon's left wing)
            item = (V, F, lin(s['color']))
            (mass if (max(e) > small and thin >= 3 * voxel and s['type'] not in ('CircleGeometry', 'ShapeGeometry', 'BoxGeometry') or (s['type'] == 'BoxGeometry' and thin >= 3 * voxel and max(e) > small * 1.5)) else detail).append(item)
        share = sum(area(s) for s in p['parts']) / total_area
        pieces = felt_piece(p['role'], mass, detail, voxel, max(120, int(budget * share)))
        for o in pieces:
            vg = o.vertex_groups.new(name=p['role']); vg.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
        objs += pieces
    # one mesh, one material
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    body = bpy.context.active_object; body.name = 'creature-' + kind
    mat = bpy.data.materials.new('felt'); mat.use_nodes = True
    nt = mat.node_tree; ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
    nt.links.new(ca.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color']); nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = .9
    body.data.materials.clear(); body.data.materials.append(mat)
    body.data.color_attributes.active_color = body.data.color_attributes['Col']
    # the skeleton: one bone per moving piece, standing up (so its turns read like three's: x, y, z)
    ad = bpy.data.armatures.new('rig'); arm = bpy.data.objects.new('rig', ad); bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for i, p in enumerate(piv):
        if p['role'] == 'root': continue
        b = ad.edit_bones.new(p['role']); h = (C @ W[i]).to_translation(); b.head = h; b.tail = h + Vector((0, 0, size * .08)); b.roll = 0
        par = piv[p['parent']]['role'] if p['parent'] >= 0 else 'root'
        if par in eb: b.parent = eb[par]
        eb[p['role']] = b
    bpy.ops.object.mode_set(mode='OBJECT')
    body.parent = arm; md = body.modifiers.new('rig', 'ARMATURE'); md.object = arm
    moves = companion_moves(kind, A, arm, bones) if companion else animal_moves(kind, A, arm, bones)
    for name, L, pose in moves: clip(arm, name, L, pose)
    for pb in arm.pose.bones: pb.rotation_euler = Z3; pb.location = Z3; pb.scale = O3
    n = tris(body)
    raw = os.path.join(OUT, f'creature-{kind}.raw.glb')
    bpy.ops.export_scene.gltf(filepath=raw, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_lights=False,
                              export_cameras=False, export_apply=False, export_skins=True, export_morph=False, use_selection=False,
                              export_vertex_color='ACTIVE', export_force_sampling=True, export_frame_step=2)
    if SHEET: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'creature-{kind}.blend'))
    print('CREATURE', kind, 'tris', n, 'clips', ','.join(m[0] for m in moves), 'size', round(size, 3), flush=True)
    return n

stats = {}
for kind, A in SPEC['animals'].items():
    if not ONLY or kind in ONLY: stats[kind] = build(kind, A)
for kind, A in SPEC['companions'].items():
    if not ONLY or kind in ONLY: stats[kind] = build(kind, A, True)
json.dump({'tris': stats, 'happy': HAPPY}, open(os.path.join(OUT, 'creatures-built.json'), 'w'), indent=1)

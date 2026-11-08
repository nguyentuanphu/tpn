# (v1.08e creatures, owner 6 Nov 2026 AEDT) Every animal, pet and companion of the 3D world, remade in Blender.
# Reads tools/blender/creatures-spec.json (the game's own shapes, part by part: node tools/blender/creatures-dump.mts),
# so each model stands where the code shape stands, at its size, facing +z, on y = 0.
# The look (owner, 6 Nov 2026 AEDT: "better refinement ... facial expressions, movements, eye blinks"): smooth, round
# shapes with clean colour edges; shaped horns (the cattle's curve up, the buffalo's sweep back in a crescent); and a face
# on every creature: shiny eyes that blink, brows, a mouth that smiles, frowns and opens, rosy cheeks.
# One skinned mesh, one material (vertex colours: js/modelkit.ts gives it the friends' toon bands), a small skeleton
# (one bone per moving piece, and the face: eyes, brows, mouth, jaw) and the clips: idle, walk (companions: fly), one happy
# move (wag, hop or flap), follow, cheer, and the moods: sad, surprised, sleep. Every clip blinks.
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
        if res <= 5: ws, hs = 6, 4   # (v1.08g creatures: a feather's light oval)
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
    # (owner, 6 Nov 2026 AEDT: "smoother, softer") cylinders and cones with soft rounded edges and tips, boxes rounded
    if t == 'CylinderGeometry':
        h, rb, rt = p['height'], p['radiusBottom'], p['radiusTop']; e = min(h * .18, max(rb, rt) * .3)
        return lathe([(0, -h / 2), (rb * .82, -h / 2), (rb * .97, -h / 2 + e * .35), (rb, -h / 2 + e), (rt, h / 2 - e), (rt * .97, h / 2 - e * .35), (rt * .82, h / 2), (0, h / 2)], max(res, 8))
    if t == 'ConeGeometry':
        h, r = p['height'], p['radius']
        return lathe([(0, -h / 2), (r * .9, -h / 2), (r, -h / 2 + h * .05), (r * .55, h * .05), (r * .2, h / 2 - h * .08), (r * .08, h / 2 - h * .02), (0, h / 2)], max(res, 8))
    if t == 'BoxGeometry':
        w, h, d = p['width'] / 2, p['height'] / 2, p['depth'] / 2
        if min(w, h, d) < .008:   # (a whisker or a stripe: a plain thin box)
            V = [(x * w, y * h, z * d) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
            return V, [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]
        V, F = prim({'type': 'SphereGeometry', 'p': {'radius': 1}}, max(res, 12))   # a rounded box: a sphere pushed out to the corners
        q = .32
        return [(math.copysign(abs(x) ** q, x) * w, math.copysign(abs(y) ** q, y) * h, math.copysign(abs(z) ** q, z) * d) for x, y, z in V], F
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
    if t == 'Tube':   # a shaped horn: a smooth tapering tube through the points (part-local), closed at both ends
        pts, rad = p['pts'], p['radii']; seg = max(res, 10); V, rows = [], []
        for i, q in enumerate(pts):
            a = Vector(pts[max(i - 1, 0)]); b = Vector(pts[min(i + 1, len(pts) - 1)]); tg = (b - a).normalized()
            up = Vector((0, 0, 1)) if abs(tg.z) < .9 else Vector((1, 0, 0)); x = tg.cross(up).normalized(); y = tg.cross(x).normalized(); row = []
            for k in range(seg):
                an = TAU * k / seg; v = Vector(q) + (x * math.cos(an) + y * math.sin(an)) * rad[i]; V.append(v.to_tuple()); row.append(len(V) - 1)
            rows.append(row)
        F = grid(rows); cap_ring(V, F, rows[0][::-1], tuple(pts[0])); cap_ring(V, F, rows[-1], tuple(pts[-1]))
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
    if t == 'Wing':   # (v1.08g creatures) a wing of its own outline, a little thick
        pts = p['pts']; n = len(pts); th = p.get('th', .008)
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
    elif t == 'Tube': e = [.02, .02, .02]
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


# ---- plush-toy proportions and details (owner, 6 Nov 2026 AEDT: "cuter proportions", "more detail", "smoother, softer") ----
# head, body (chubbier across), legs (shorter): bigger heads, rounder bodies, short legs, like a soft toy. The whole
# creature is then sized back to the code shape's height (build), so it stands as tall as before.
PROP = {'bull': (1.15, 1.06, .86), 'kitty': (1.15, 1.1, .8), 'calf': (1.15, 1.1, .8), 'bunny': (1.12, 1.08, 1), 'joey': (1.2, 1.1, 1), 'koala': (1.15, 1.08, 1), 'penguin': (1.12, 1.05, 1), 'turtle': (1.15, 1, 1),
        'platypus': (1.25, 1.05, 1), 'emu': (1.35, 1.1, .82), 'crane': (1.35, 1.1, .82), 'peacock': (1.3, 1.05, .85), 'chicken': (1.15, 1.05, .85),
        'elephant': (1.15, 1.08, .8), 'unicorn': (1.22, 1.1, .8), 'sheep': (1.2, 1, .8), 'pig': (1.2, 1.05, .82), 'panda': (1.2, 1.08, .85), 'bear': (1.22, 1.08, .82)}
PAWS = {'puppy', 'kitty', 'bear', 'panda', 'koala'}
HOOVES = {'calf', 'cow', 'bull', 'buffalo', 'unicorn', 'pig'}
TUFTS = {'puppy', 'calf', 'cow', 'bull', 'buffalo', 'pig', 'joey'}
KNEES = {}
def kids(piv, i): return [j for j, p in enumerate(piv) if p['parent'] == i]
def subtree(piv, i):
    out = [i]
    for j in kids(piv, i): out += subtree(piv, j)
    return out
def restyle(kind, A, piv):
    KNEES.clear()
    if kind in ('firefly', 'dragon'): return
    hk, bk, lk = PROP.get(kind, (1.28, 1.12, .78))
    roles = {p['role']: i for i, p in enumerate(piv)}
    legs = [(i, A['legs'][int(p['role'][3:])]) for i, p in enumerate(piv) if p['role'].startswith('leg')]
    walkers = [i for i, l in legs if not l['arm']] if A['gait'] != 'hop' else []
    hip = sum(piv[i]['pos'][1] for i in walkers) / len(walkers) if walkers else 0
    drop = hip * (1 - lk)
    def move(i, dv):
        for j in subtree(piv, i): piv[j]['pos'] = [a + b for a, b in zip(piv[j]['pos'], dv)]
    hi = roles.get('head')
    if hi is not None:   # a bigger head, grown round its own pivot (ears and all)
        hp = Vector(piv[hi]['pos'])
        for j in subtree(piv, hi):
            if j != hi: piv[j]['pos'] = list(hp + (Vector(piv[j]['pos']) - hp) * hk)
            for s in piv[j]['parts']: s['pos'] = [v * hk for v in s['pos']]; s['scl'] = [v * hk for v in s['scl']]
    bi = roles['body']
    for s in piv[bi]['parts']: s['pre'] = Matrix.Diagonal((bk, 1, bk, 1))   # a chubbier body
    for i, p in enumerate(piv):   # what hangs on the body moves out with it
        if p['parent'] == bi: move(i, [p['pos'][0] * (bk - 1), 0, p['pos'][2] * (bk - 1)])
    for i in walkers:   # shorter, chunkier legs
        for s in piv[i]['parts']: s['pre'] = Matrix.Diagonal((1.12, lk, 1.12, 1))
    for p in piv:
        if p['role'] != 'root': p['pos'] = [p['pos'][0], p['pos'][1] - drop, p['pos'][2]]
    if kind == 'joey':   # (Release, 6 Nov 2026 AEDT: two round dots on its chest) short arms held forward, darker paws, the cream belly and its pouch
        for i, l in legs:
            if l['arm']: piv[i]['parts'] = [{'type': 'CapsuleGeometry', 'p': {'radius': .032, 'length': .13}, 'color': '#c98a5a', 'pos': [0, -.07, .09], 'rot': [-.6, 0, 0], 'scl': [1, 1, 1]},
                                            sph(.036, '#8a5634', (0, -.13, .14), (1.1, .8, 1.1))]
        piv[bi]['parts'][1]['pos'] = [0, .45, .14]; piv[bi]['parts'][1]['scl'] = [.85, 1.1, .6]
        piv[bi]['parts'].append({'type': 'TorusGeometry', 'p': {'radius': .08, 'tube': .009, 'arc': 2.3}, 'color': '#a8724a', 'pos': [0, .43, .235], 'rot': [-.1, 0, -math.pi / 2 - 1.15], 'scl': [1, 1, 1]})
    body0 = Vector(piv[bi]['pos'])
    for i in walkers:
        lp = piv[i]; top = lp['parts'][0]; e, _ = extents(top); r = min(e[0], e[2]) / 2 * 1.12
        # a soft round hip where the leg meets the body, so there is no hard seam
        piv[bi]['parts'].append(sph(r * 1.4, top['color'], list(Vector(lp['pos']) - body0), (1, .9, 1)))
        foot = min(lp['parts'], key=lambda s: s['pos'][1]); fe, _ = extents(foot); fr = max(fe[0], fe[2]) / 2 * 1.12
        fp = Vector((foot['pos'][0] * 1.12, foot['pos'][1] * lk, foot['pos'][2] * 1.12))
        if kind in PAWS:   # three little toes at the front of each paw
            for dx in (-.55, 0, .55):
                lp['parts'].append(sph(fr * .36, shade(foot['color'], .96), list(fp + Vector((dx * fr, -fe[1] * lk * .2, fr * .78)))))
        if kind in HOOVES:   # the split at the front of each hoof
            lp['parts'].append({'type': 'BoxGeometry', 'p': {'width': fr * .14, 'height': fe[1] * lk * .9, 'depth': fr * .3}, 'color': shade(foot['color'], .55),
                                'pos': list(fp + Vector((0, 0, fr * .9))), 'rot': [0, 0, 0], 'scl': [1, 1, 1]})
        if lk < 1 and kind not in ('turtle', 'platypus'):   # a knee half way down, so the legs bend as they walk
            ki = len(piv); kn = lp['pos'][1] * .5
            piv.append({'role': 'knee' + lp['role'][3:], 'parent': i, 'pos': [lp['pos'][0], kn, lp['pos'][2]], 'rot': lp['rot'], 'parts': [], 'extra': []})
            KNEES[lp['role']] = kn

# ---- the face: shiny eyes that blink, brows, a mouth, rosy cheeks (owner, 6 Nov 2026 AEDT) ----
# where the mouth sits, in the head's own frame (y up, z to the front): the height under the nose; None = no mouth (a beak,
# a bill or a trunk does the talking)
MOUTH_Y = {'puppy': -.075, 'kitty': -.068, 'bunny': -.062, 'panda': -.11, 'joey': -.072, 'calf': -.15, 'cow': -.2, 'sheep': -.085,
           'pig': -.125, 'unicorn': .275, 'bear': -.13, 'koala': -.12, 'turtle': -.012, 'bull': -.2, 'buffalo': -.215,
           'firefly': -.04, 'dragon': .055}
W_MOUTH = {'kitty', 'bunny'}                       # the little "w" mouth of a cat and a rabbit
NO_BROW = {'chicken', 'penguin', 'emu', 'crane', 'peacock', 'turtle', 'firefly'}
NO_CHEEK = {'crane', 'emu', 'peacock', 'turtle', 'platypus'}
HORN_COLS = {'#efe6cf', '#d9cfbf', '#e8dcc0'}
# shaped horns, the right one (x > 0; the left is its mirror), in the head's own frame: control points, radius at the base
# and the tip, colour at the base and the tip. The cattle's curve out and up; the buffalo's sweep out and back in a
# crescent, with rings.
HORNS = {
    'cow': ([(.075, .1, .02), (.13, .13, .02), (.17, .18, .03), (.165, .24, .045)], .03, .009, '#f3ead6', '#9a8a70', 0),
    'bull': ([(.08, .1, .02), (.15, .12, .02), (.21, .16, .04), (.23, .23, .07)], .036, .01, '#f3ead6', '#7a6a55', 0),
    'calf': ([(.07, .07, 0), (.1, .1, .0), (.115, .13, .01)], .024, .011, '#e9e0cc', '#c2b498', 0),
    'buffalo': ([(.09, .1, -.01), (.2, .13, -.04), (.32, .15, -.09), (.4, .19, -.15), (.415, .26, -.2)], .052, .012, '#efe4c8', '#8a7c62', 1),
}

def lum(h):
    c = lin(h); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def shade(h, k):
    h = h.lstrip('#'); h = ''.join(x * 2 for x in h) if len(h) == 3 else h
    return '#' + ''.join('%02x' % max(0, min(255, int(int(h[i:i + 2], 16) * k))) for i in (0, 2, 4))
def sph(r, col, pos, scl=(1, 1, 1), rot=(0, 0, 0)):
    return {'type': 'SphereGeometry', 'p': {'radius': r}, 'color': col, 'pos': list(pos), 'rot': list(rot), 'scl': list(scl)}

def spline(ctrl, n=14):
    """a smooth line through the control points (Catmull-Rom)"""
    P = [Vector(c) for c in ctrl]; P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]; out = []
    for i in range(1, len(P) - 2):
        for k in range(n):
            t = k / n; p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
            out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2]); return out

def horn_parts(kind):
    ctrl, r0, r1, c0, c1, rings = HORNS[kind]; out = []
    for s in (-1, 1):
        pts = [(s * x, y, z) for x, y, z in ctrl]; line = spline(pts); n = len(line); cut = int(n * .72)
        rad = [r0 + (r1 - r0) * (i / (n - 1)) ** 1.2 for i in range(n)]
        if rings: rad = [r * (1 - .1 * abs(math.sin(i * 1.3))) if i < n - 3 else r for i, r in enumerate(rad)]
        for a, b, col in ((0, cut + 1, c0), (cut, n, c1)):
            out.append({'type': 'Tube', 'p': {'pts': [v.to_tuple() for v in line[a:b]], 'radii': rad[a:b]}, 'color': col, 'pos': [0, 0, 0], 'rot': [0, 0, 0], 'scl': [1, 1, 1]})
    return out

def find_eyes(kind, parts):
    """the eyes the code shape draws: (centre, radius, colour, light), and which parts they were"""
    found, drop = [], set()
    for i, s in enumerate(parts):
        if s['type'] != 'SphereGeometry' or abs(s['pos'][0]) < 1e-3: continue
        r = s['p']['radius'] * max(abs(v) for v in s['scl']); col = s['color'].lower()
        nxt = parts[i + 1] if i + 1 < len(parts) else None
        hl = nxt and nxt['type'] == 'SphereGeometry' and nxt['color'].lower() in ('#ffffff', '#fff') and abs(nxt['p']['radius'] - .35 * s['p']['radius']) < .004
        if hl and r < .06: found.append((s['pos'], r, col)); drop |= {i, i + 1}
        elif kind == 'kitty' and col == '#5fbf4f': found.append((s['pos'], r, col)); drop.add(i)
        elif kind == 'panda' and col == '#ffffff' and r < .03: found.append((s['pos'], r * 1.4, '#ffffff')); drop.add(i)
        elif kind in ('firefly', 'dragon') and col == '#ffffff' and r < .04: found.append((s['pos'], r, col)); drop.add(i)
    if kind == 'kitty':   # the slit pupils
        drop |= {i for i, s in enumerate(parts) if s['type'] == 'BoxGeometry' and s['color'].lower() == '#111'}
    if kind in ('firefly', 'dragon'):   # the black pupils on the white eyes
        drop |= {i for i, s in enumerate(parts) if s['type'] == 'SphereGeometry' and s['color'].lower() == '#1a1a1a' and s['p']['radius'] < .02}
    eyes = []
    for side in (-1, 1):   # one eye a side: the biggest; a light one is the white of the eye
        g = [e for e in found if (e[0][0] > 0) == (side > 0)]
        if not g: continue
        big = max(g, key=lambda e: e[1]); light = any(lum(e[2]) > .5 for e in g)
        iris = big[2] if not light else '#1e1612'
        if lum(iris) < .05 or iris in ('#1a1a1a', '#111', '#222'): iris = '#22170f'
        eyes.append({'c': Vector(big[0]), 'r': big[1], 'iris': iris, 'white': light, 'slit': kind == 'kitty'})
    return eyes, drop

def add_face(kind, piv, size, companion):
    """takes the code shape's eyes and horns off the head and puts on the face: new pivots eye0/eye1, brow0/brow1, mouth, jaw"""
    hi = next((i for i, p in enumerate(piv) if p['role'] == 'head'), None)
    if hi is None: hi = next(i for i, p in enumerate(piv) if p['role'] == 'body')
    H = piv[hi]; Wh = three_matrix(H['pos'], H['rot'], (1, 1, 1)); M = C @ Wh; Mi = M.inverted()
    eyes, drop = find_eyes(kind, H['parts'])
    parts = [s for i, s in enumerate(H['parts']) if i not in drop]
    if kind in HORNS: parts = [s for s in parts if not (s['color'].lower() in HORN_COLS and s['type'] in ('ConeGeometry', 'TorusGeometry'))] + horn_parts(kind)
    H['parts'] = parts
    if not eyes: return {}
    # the head's surface, to put the mouth, brows and cheeks on it
    from mathutils.bvhtree import BVHTree
    tmp = []
    for s in parts:
        if s['type'] == 'Tube': continue
        V, F = prim(s, 12); Mp = M @ three_matrix(s['pos'], s['rot'], s['scl'])
        tmp.append(([(Mp @ Vector(v)).to_tuple() for v in V], F, (1, 1, 1, 1)))
    o = mesh_obj('headtmp', tmp); bvh = BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get()); bpy.data.objects.remove(o)
    def hit(frm, d):
        loc, nor, _, _ = bvh.ray_cast(M @ Vector(frm), (M.to_3x3() @ Vector(d)).normalized())
        if loc is None: return None, None
        return Mi @ loc, (Mi.to_3x3() @ nor).normalized()
    big = max(parts, key=lambda s: extents(s)[0][0] * extents(s)[0][1] * extents(s)[0][2]) if parts else None
    skin = big['color'] if big else '#888888'; centre = Vector(big['pos']) if big else Vector((0, 0, 0))
    eyes.sort(key=lambda e: e['c'].x)
    new, face = [], {'eyes': [], 'brows': [], 'mouth': None, 'jaw': None}
    def pivot(role, at, prts):
        w = Wh @ Vector(at); new.append({'role': role, 'parent': hi, 'pos': list(w), 'rot': H['rot'], 'parts': prts, 'extra': []}); return role
    eye_x, eye_y, R0 = abs(eyes[-1]['c'].x), eyes[-1]['c'].y, eyes[-1]['r']
    for i, e in enumerate(eyes):
        c, side = e['c'], (1 if e['c'].x > 0 else -1)
        d = (c - centre); d = Vector((d.x, d.y * .3, d.z)).normalized() if d.length > 1e-4 else Vector((0, 0, 1))
        sideways = Vector((0, 1, 0)).cross(d).normalized()
        # (owner, 6 Nov 2026 AEDT: "the eyes look still very scary") big, soft, glossy eyes that sit flat on the face like
        # a picture book's, not balls: a warm dark brown, a little taller than wide, a big sparkle and a small one (the same
        # side on both eyes), a soft glow at the bottom; no whites round them (a thin light rim only where the face is dark),
        # round pupils (no slits)
        # (owner, 6 Nov 2026 AEDT: "animals eyes too pop out, too scary") each eye lies ON the face: found on the head's
        # own surface (the old eye balls are gone), facing out along it, thin and set a little into it, like a painted eye
        R = e['r'] * (1.05 if companion else 1.22); flat = .3
        h, nrm = hit(c + d * .6, -d)
        if h is None: h, nrm = c, d
        dn = Vector(nrm).normalized(); ay = math.atan2(dn.x, dn.z); ax = -math.asin(max(-1, min(1, dn.y)))
        sideways = Vector((0, 1, 0)).cross(dn).normalized(); up = dn.cross(sideways).normalized()
        base = h; pr = []   # (centred on the surface: it stands out only about a third of its size, like a button)
        def disc(r, col, at, sy=1.1, depth=flat): return sph(r, col, at, (1, sy, depth), (ax, ay, 0))
        # each layer's front is just in front of the one under it: colour .30 R, pupil and glow .32, sparkles .36-.38
        iris = '#2b1b12' if (e['white'] or lum(e['iris']) < .08) else e['iris']
        if e['white'] and lum(skin) < .25: pr.append(disc(R * 1.12, '#fff8ee', -dn * R * .03, 1.1, .27))   # (a light rim only on a dark face)
        pr.append(disc(R, iris, Vector((0, 0, 0))))
        if lum(iris) > .08: pr.append(disc(R * .64, '#1c120c', dn * R * .1, 1.12, .35))   # (a round pupil)
        pr.append(disc(R * .5, '#6e4a36' if lum(iris) < .08 else shade(iris, 1.25), dn * R * .1 - up * R * .46, .5, .45))
        pr.append(disc(R * .34, '#ffffff', dn * R * .2 + up * R * .14 - sideways * R * .3, 1.0, .5))
        pr.append(disc(R * .16, '#ffffff', dn * R * .2 - up * R * .42 + sideways * R * .32, 1.0, 1.0))
        face['eyes'].append(pivot('eye%d' % i, base, pr))
        # the closed-eye arc: "^" for joy, turned over for sleep (shown by the clips, tiny otherwise)
        Rt = R * .7
        arc = {'type': 'TorusGeometry', 'p': {'radius': Rt, 'tube': R * .13, 'arc': 2.3}, 'color': '#2b1b12' if lum(skin) > .06 else '#fff3e0',   # (light on a dark face)
               'pos': list(dn * R * .2 - up * Rt * .55), 'rot': [ax, ay, math.pi / 2 - 1.15], 'scl': [1, 1, .6]}
        face.setdefault('lids', []).append(pivot('lid%d' % i, base, [arc]))
        # (owner via Release, 6 Nov 2026 AEDT: soft eyes with lids, never a staring face) an upper lid in the face's own colour
        # rests over the top of the eye and slides all the way down when it blinks or closes its eyes
        lc = min(parts, key=lambda s: (Vector(s['pos']) - h).length - max(extents(s)[0]) / 2)['color'] if parts else skin
        if lc.lower() in HORN_COLS or lum(lc) > .9 and lum(skin) < .5: lc = skin
        lid = {'type': 'SphereGeometry', 'p': {'radius': R * 1.1}, 'color': lc, 'pos': list(dn * R * .08 + up * R * 1.12),
               'rot': [ax, ay, 0], 'scl': [1, .6, .22]}   # (thin, almost flush with the eye; at rest it covers the top fifth)
        face.setdefault('ulids', []).append(pivot('ulid%d' % i, base, [lid]))
        face.setdefault('lidR', []).append(R)
        if kind not in NO_BROW:   # a soft brow above the eye, on the head
            at = c + Vector((0, e['r'] * 2.7, 0)); h, n = hit(at + d * .4, -d)   # (soft, short and well above the eye: no frown)
            if h is not None:
                bc = h + n * R * .05; tilt = side * .1
                brow = {'type': 'CapsuleGeometry', 'p': {'radius': R * .12, 'length': R * .75}, 'color': shade(skin, .72) if lum(skin) > .1 else '#5a5a5a',
                        'pos': [0, 0, 0], 'rot': [0, math.atan2(d.x, d.z), math.pi / 2 + tilt], 'scl': [1, 1, 1]}
                face['brows'].append(pivot('brow%d' % i, bc, [brow]))
        if kind not in NO_CHEEK:   # rosy cheeks
            h, n = hit(Vector((side * eye_x * 1.12, eye_y - R0 * 1.9, 1.5)), (0, 0, -1))
            if h is not None: H['parts'].append(sph(R0 * 1.05, '#ff98a8', h - n * R0 * .25, (1, .62, .4)))
    if kind in TUFTS:   # a soft tuft of fur on top of the head
        h, n = hit(centre + Vector((0, 1.5, 0)), (0, -1, 0))
        if h is not None:
            for dx, dz, k in ((0, .2, 1), (-.9, 0, .85), (.9, 0, .85)):
                H['parts'].append(sph(R0 * 1.3 * k, shade(skin, 1.07), h + Vector((dx * R0 * 1.1, -R0 * .35, dz * R0)), (1, 1.15, 1), (0, 0, -dx * .3)))
    my = MOUTH_Y.get(kind)
    if my is not None:
        h, n = hit(Vector((0, my, 1.5)), (0, 0, -1))
        if h is not None:
            W = max(.045, min(.13, eye_x * (1.0 if not companion else .9))); tube = max(.0055, W * .075); mc = h + n * tube * .4
            dark = '#3a221c'
            if kind in W_MOUTH:
                arcs = [{'type': 'TorusGeometry', 'p': {'radius': W / 4, 'tube': tube, 'arc': 2.4}, 'color': dark, 'pos': [s * W / 4, W / 4, 0], 'rot': [0, 0, -math.pi / 2 - 1.2], 'scl': [1, 1, 1]} for s in (-1, 1)]
            else:
                arcs = [{'type': 'TorusGeometry', 'p': {'radius': W / 2, 'tube': tube, 'arc': 1.9}, 'color': dark, 'pos': [0, W / 2, 0], 'rot': [0, 0, -math.pi / 2 - .95], 'scl': [1, 1, 1]}]
            face['mouth'] = pivot('mouth', mc, arcs)
            face['jaw'] = pivot('jaw', mc - n * W * .05, [sph(W * .34, '#6e2431', (0, -W * .14, 0), (1, .8, .5)), sph(W * .2, '#ff8f9e', (0, -W * .28, W * .05), (1, .6, .6))])
    piv += new
    return face

# ---- the moves: the same moves js/animals.ts tickAnimal gives the code shapes, as looping clips ----
def clip(arm, name, length, pose):
    """pose(t) -> {bone: (rot xyz, loc xyz, scale xyz)} in three's frame (the bones are laid out so it is the same)"""
    act = bpy.data.actions.new(name); act.use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = act
    n = max(2, round(length * FPS)); have = set(arm.pose.bones.keys())
    for f in range(n + 1):
        t = f / FPS * (length / (n / FPS))
        for b, (r, l, s) in pose(t).items():
            if b not in have: continue
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
def blink(t, times, dur=.16):
    """how open the eyes are (1 open, 0 shut) with quick blinks at these times"""
    o = 1.0
    for b in times: o = min(o, min(1.0, abs(t - b) / (dur / 2)))
    return o

FACE = {}
def face(P, F, eye=1.0, big=1.0, brow_y=0.0, brow_tilt=0.0, smile=1.0, frown=False, jaw=0.0, look=0.0, joy=False, shut=False):
    """the face's bones: eye = how open (1 open, .35 a happy squint, .06 shut), big = how big (surprise), brows up and
    tilted (sad: the inner ends up), the mouth's smile (wider) or frown (turned over), the jaw open (0 shut, 1 wide)"""
    closed = joy or shut
    for b in F.get('eyes', []): P[b] = ((0, look, 0), Z3, ((.01, .01, .01) if closed else (big, max(.06, big * eye), big)))
    for b in F.get('lids', []): P[b] = ((0, 0, math.pi if shut else 0), Z3, (1, 1, 1) if closed else (.02, .02, .02))
    for b, dd in zip(F.get('ulids', []), F.get('lidR', [])):   # the upper lid: resting over the top, all the way down to blink
        down = 1.0 if closed else max(0.0, min(1.0, (1 - eye) * 1.15)) if big <= 1.01 else -.12
        P[b] = (Z3, (0, -dd * 1.05 * down, 0), (1, 1 + .25 * down, 1))
    for i, b in enumerate(F.get('brows', [])):
        side = -1 if i == 0 else 1
        P[b] = ((0, 0, -side * brow_tilt), (0, brow_y, 0), O3)
    if F.get('mouth'):
        P[F['mouth']] = ((0, 0, math.pi if frown else 0), (0, -.006 if frown else 0, 0), (smile, (smile if not frown else .8), 1))
    if F.get('jaw'):
        s = .04 + .96 * jaw; P[F['jaw']] = (Z3, Z3, (max(.04, s * (1.2 if jaw > .5 else 1)), s, s))

HAPPY = {}
def animal_moves(kind, A, arm, bones, F, size):
    legs = [(f'leg{i}', l) for i, l in enumerate(A['legs'])]
    ears = [b for b in bones if b.startswith('ear')]
    has_tail = 'tail' in bones; hop_gait = A['gait'] == 'hop'; up = A['upright']
    hip = A.get('hip', .3); br = size * .02   # (a brow lift, in metres)
    def tail_pose(P, t, w, amt=1.0, fast=1.0, lift=0.0):
        if not has_tail: return
        r = [lift, 0, 0]
        if A['wag']: r[1] = math.sin(t * w * k_of(A['wag'] * fast, w)) * .6 * amt
        if A['sway']:
            s = math.sin(t * w * k_of(A['sway'] * fast, w)) * .3 * amt
            if A['swing']: r[2] = s; r[0] += math.sin(t * w * k_of(A['sway'] * 1.3 * fast, w)) * .1
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
            for b, l in legs:
                P[b] = ((math.sin(ph + l['ph']) * .65 * run, 0, 0), Z3, O3)
                P['knee' + b[3:]] = ((max(0, -math.cos(ph + l['ph'])) * .95 * run, 0, 0), Z3, O3)   # (the knee bends as the foot comes forward)
            P['body'] = ((math.sin(ph * 2) * .025 * run, 0, math.sin(ph) * A['waddle'] * run), (0, abs(math.sin(ph)) * .035 * run, 0), (1, 1 - .03 * math.cos(2 * ph) * run, 1))
            for i, e in enumerate(ears): P[e] = ((math.sin(ph * 2 + i - .9) * .16 * run, 0, math.sin(ph + i) * .05 * run), Z3, O3)   # (a beat behind the step)
        if 'head' in bones: P['head'] = ((math.sin(ph * 2 - .5) * .07 * run - lift, math.sin(ph) * .05 * run, 0), Z3, O3)
    def idle(t):
        L = 6.0; w = TAU / L; P = rest(bones)
        P['body'] = (Z3, Z3, (1, 1 + math.sin(2 * w * t) * .02, 1))
        look = math.sin(w * t) * .5 + math.sin(2 * w * t) * .1
        if 'head' in bones:
            pk = max(0, math.sin(w * t)) ** 6 * .9 if A['peck'] else 0
            P['head'] = ((pk, look, math.sin(w * t + 1) * .06), Z3, O3)
        for i, e in enumerate(ears): P[e] = ((math.sin(2 * w * t + i) * .05 + (-.25 if 1.7 < t % 3 < 1.9 else 0), 0, 0), Z3, O3)   # (an ear twitch)
        tail_pose(P, t, w, .7)
        for b, l in legs:
            if l['arm']: P[b] = ((.3, 0, 0), Z3, O3)
        face(P, F, eye=blink(t, (1.2, 3.8, 4.2), .2), brow_y=br * .3 * max(0, math.sin(w * t * 2)), smile=1.0, look=look * .35)
        return P
    stride = 1.0 if A['slow'] else .7
    walk_len = stride * 3
    def walk(t): P = rest(bones); w = TAU / stride; gait(P, t, w); tail_pose(P, t, w); face(P, F, eye=blink(t, (walk_len * .55,)), smile=1.05); return P
    flen = stride * .7 * 3
    def follow(t):
        P = rest(bones); w = TAU / (stride * .7); gait(P, t, w, 1.0, .12); tail_pose(P, t, w, 1, 1.4)
        face(P, F, eye=blink(t, (flen * .4,)) * .9, smile=1.25, jaw=.25, brow_y=br * .5); return P
    move = 'wag' if (has_tail and (A['wag'] or kind in ('cow', 'bull', 'buffalo', 'calf', 'unicorn', 'elephant'))) else 'hop'
    if kind in ('chicken', 'penguin', 'emu', 'crane', 'peacock'): move = 'flap'
    if kind in ('bunny', 'joey', 'koala', 'panda', 'bear'): move = 'hop'
    HAPPY[kind] = move
    def happy(t):
        L = 2.4; w = TAU / L; P = rest(bones)
        if move == 'wag':
            P['body'] = (Z3, (0, abs(math.sin(4 * w * t)) * .05, 0), O3)
            if 'head' in bones: P['head'] = ((-.12, 0, math.sin(2 * w * t) * .2), Z3, O3)
            tail_pose(P, t, w, 1.3, 2.5)
            if A['wag'] == 0 and has_tail: P['tail'] = ((0, math.sin(12 * w * t) * .7, 0), Z3, O3)
            for i, e in enumerate(ears): P[e] = ((-.3 + math.sin(8 * w * t + i) * .15, 0, 0), Z3, O3)
        elif move == 'hop':
            hop = max(0, math.sin(4 * w * t)); P['body'] = ((-.12 * hop, 0, 0), (0, hop * .16, 0), O3)
            for b, l in legs: P[b] = ((-hop * .5 if not l['arm'] else .3 + hop * .9, 0, 0), Z3, O3)
            if 'head' in bones: P['head'] = ((-.15 * hop, 0, math.sin(2 * w * t) * .12), Z3, O3)
            for e in ears: P[e] = ((-hop * .4, 0, 0), Z3, O3)
            tail_pose(P, t, w, 1, 2)
        else:   # flap: little hops, the head bobbing, flippers or the fan flapping
            hop = max(0, math.sin(4 * w * t)); P['body'] = ((0, 0, math.sin(8 * w * t) * .06), (0, hop * .12, 0), O3)
            if 'head' in bones: P['head'] = ((math.sin(8 * w * t) * .25, 0, 0), Z3, O3)
            for b, l in legs:
                P[b] = ((0, 0, (1 if int(b[3:]) % 2 == 0 else -1) * -(.4 + .5 * abs(math.sin(8 * w * t)))), Z3, O3) if l['arm'] else ((-hop * .3, 0, 0), Z3, O3)
            if has_tail: P['tail'] = ((-.25 - .2 * abs(math.sin(4 * w * t)), math.sin(4 * w * t) * .25, 0), Z3, O3)
        face(P, F, joy=True, smile=1.35, jaw=.55 + .3 * abs(math.sin(4 * w * t)), brow_y=br * .8)
        return P
    def cheer(t):
        L = 1.4; w = TAU / L; P = rest(bones)
        jump = max(0, math.sin(2 * w * t)) ** .8
        P['body'] = ((-.2 * jump, 0, 0), (0, jump * (.35 if not up else .45), 0), (1, 1 + .06 * jump, 1))
        if 'head' in bones: P['head'] = ((-.3 * jump, math.sin(w * t) * .2, 0), Z3, O3)
        for b, l in legs: P[b] = ((.7 * jump if l['arm'] else (-.6 * jump if not l['back'] else -.9 * jump), 0, 0), Z3, O3); P['knee' + b[3:]] = ((.9 * jump, 0, 0), Z3, O3)
        for e in ears: P[e] = ((-.5 * jump, 0, 0), Z3, O3)
        tail_pose(P, t, w, 1.4, 2.5)
        face(P, F, joy=True, smile=1.4, jaw=.6 + .4 * jump, brow_y=br * (1 + jump))
        return P
    def sad(t):   # head and ears down, the tail low, a frown, brows up in the middle, a slow sigh
        L = 4.0; w = TAU / L; P = rest(bones); sigh = math.sin(w * t)
        P['body'] = (Z3, (0, -.02, 0), (1, 1 + sigh * .025, 1))
        if 'head' in bones: P['head'] = ((.38 + sigh * .04, math.sin(w * t) * .12, 0), Z3, O3)
        for e in ears: P[e] = ((-.75, 0, 0), Z3, O3)
        tail_pose(P, t, w, .15, 1, -.7)
        for b, l in legs:
            if l['arm']: P[b] = ((.15, 0, 0), Z3, O3)
        face(P, F, eye=.62 * blink(t, (2.2,), .4), brow_tilt=.38, brow_y=br * .2, frown=True, smile=.85)
        return P
    def surprised(t):   # a jump back: eyes wide, brows up, mouth a little "o"
        L = 1.2; P = rest(bones); k = min(1, t / .12) * (1 - max(0, (t - .9) / .3)); jump = math.sin(min(1, t / .45) * math.pi) * .6
        P['body'] = ((-.12 * k, 0, 0), (0, jump * .14, -.05 * k), O3)
        if 'head' in bones: P['head'] = ((-.22 * k, 0, 0), Z3, O3)
        for e in ears: P[e] = ((.25 * k, 0, 0), Z3, O3)
        tail_pose(P, t, TAU / L, .2, 1, -.4 * k)
        for b, l in legs: P[b] = ((.3 * jump if l['arm'] else 0, 0, 0), Z3, O3)
        face(P, F, eye=1, big=1 + .18 * k, brow_y=br * 1.8 * k, smile=.45 + .55 * (1 - k), jaw=.7 * k)
        return P
    def sleep(t):   # curled down, eyes shut, breathing slowly
        L = 4.0; w = TAU / L; P = rest(bones); b = math.sin(w * t)
        drop = hip * (.45 if (hop_gait or up) else .62)
        P['body'] = (Z3, (0, -drop, 0), (1 + b * .015, 1 + b * .035, 1 + b * .015))
        if 'head' in bones: P['head'] = ((.32 + b * .03, .25, .1), (0, b * hip * .02, 0), O3)
        for e in ears: P[e] = ((-.5, 0, 0), Z3, O3)
        for bn, l in legs:
            if l['arm']: P[bn] = ((.6, 0, 0), Z3, O3)
            elif hop_gait or up: P[bn] = ((-.6 if l['back'] else -.3, 0, 0), Z3, O3)
            else: P[bn] = ((1.2 if l.get('front') else -1.2, 0, 0), Z3, O3); P['knee' + bn[3:]] = ((-1.4 if l.get('front') else 1.4, 0, 0), Z3, O3)   # (folded under)
        if has_tail: P['tail'] = ((-.4, .5, 0), Z3, O3)
        face(P, F, shut=True, smile=.8, brow_y=-br * .2)
        return P
    return [('idle', 6.0, idle), ('walk', walk_len, walk), (move, 2.4, happy), ('follow', flen, follow), ('cheer', 1.4, cheer),
            ('sad', 4.0, sad), ('surprised', 1.2, surprised), ('sleep', 4.0, sleep)]

def companion_moves(kind, A, arm, bones, F, size):
    flap = A['flap']; HAPPY[kind] = 'flap'; br = size * .02
    def wings(P, t, w, f, amt=.6):
        k = k_of(f, w)
        for b in bones:
            if b.startswith('wing'): P[b] = ((0, 0, (1 if b == 'wing0' else -1) * math.sin(t * w * k) * amt), Z3, O3)
    bm = 0 if kind == 'firefly' else 1   # (the firefly's glowing tail is the game's own light: its body keeps still against it)
    def idle(t): L = 6.0; w = TAU / L; P = rest(bones); P['body'] = ((math.sin(3 * w * t) * .06 * bm, 0, 0), (0, math.sin(3 * w * t) * .03 * bm, 0), O3); wings(P, t, w, flap); face(P, F, eye=blink(t, (1.2, 3.8, 4.2), .2), look=math.sin(w * t) * .2); return P
    def fly(t): L = 3.0; w = TAU / L; P = rest(bones); P['body'] = ((.15 * bm, 0, math.sin(3 * w * t) * .06 * bm), (0, math.sin(6 * w * t) * .02 * bm, 0), O3); wings(P, t, w, flap * 1.2, .7); face(P, F, eye=blink(t, (1.7,)), smile=1.1); return P
    def happy(t): L = 2.4; w = TAU / L; P = rest(bones); P['body'] = (Z3, (0, abs(math.sin(4 * w * t)) * .1, 0), O3); wings(P, t, w, flap * 1.6, .8); face(P, F, joy=True, smile=1.35, jaw=.6, brow_y=br); return P
    def follow(t): L = 2.4; w = TAU / L; P = rest(bones); P['body'] = ((.25 * bm, 0, 0), Z3, O3); wings(P, t, w, flap * 1.4, .75); face(P, F, eye=blink(t, (1.1,)), smile=1.2, jaw=.2); return P
    def cheer(t): L = 1.6; w = TAU / L; P = rest(bones); P['body'] = ((-w * t, 0, 0), (0, math.sin(w * t / 2) * .15, 0), O3); wings(P, t, w, flap * 1.5, .8); face(P, F, joy=True, smile=1.4, jaw=.9, brow_y=br); return P   # a loop-the-loop
    def sad(t): L = 4.0; w = TAU / L; P = rest(bones); P['body'] = ((.25 * bm, 0, 0), (0, -.03 * bm, 0), O3); wings(P, t, w, flap * .6, .3); face(P, F, eye=.6 * blink(t, (2.2,), .4), brow_tilt=.38, frown=True, smile=.85); return P
    def surprised(t): L = 1.2; w = TAU / L; P = rest(bones); k = min(1, t / .12) * (1 - max(0, (t - .9) / .3)); P['body'] = ((-.2 * k * bm, 0, 0), (0, .08 * k * bm, 0), O3); wings(P, t, w, flap * 1.5, .9); face(P, F, big=1 + .18 * k, brow_y=br * 1.8 * k, smile=.45, jaw=.7 * k); return P
    def sleep(t): L = 4.0; w = TAU / L; P = rest(bones); P['body'] = ((.2 * bm + math.sin(w * t) * .03, 0, 0), (0, math.sin(w * t) * .02 * bm, 0), O3); wings(P, t, w, flap * .3, .15); face(P, F, shut=True, smile=.8); return P
    return [('idle', 6.0, idle), ('fly', 3.0, fly), ('flap', 2.4, happy), ('follow', 2.4, follow), ('cheer', 1.6, cheer),
            ('sad', 4.0, sad), ('surprised', 1.2, surprised), ('sleep', 4.0, sleep)]


# ---- (v1.08g creatures, owner 6 Nov 2026 AEDT: "Cac con rong, con chim deu etc phai blender thiet dep") hand-drawn
# picture-book shapes for the birds, the Little Dragon and Sparkle the firefly, in place of the code shape's parts. Each
# keeps its pivots (the bones), its eye markers (a dark ball and its 0.35 sparkle, or the companions' white eyes, which the
# v1.08e face replaces with soft eyes with lids), its size and its facing; restyle() then gives the birds their plush
# proportions as before. Layered feathers are flat capsules laid along a direction; long curves are tubes.
def H_cap(r, length, col, pos, rot=(0, 0, 0), scl=(1, 1, 1)):
    return {'type': 'CapsuleGeometry', 'p': {'radius': r, 'length': length}, 'color': col, 'pos': list(pos), 'rot': list(rot), 'scl': list(scl)}
def H_cone(r, h, col, pos, rot=(0, 0, 0), scl=(1, 1, 1)):
    return {'type': 'ConeGeometry', 'p': {'radius': r, 'height': h}, 'color': col, 'pos': list(pos), 'rot': list(rot), 'scl': list(scl)}
def H_cyl(rt, rb, h, col, pos, rot=(0, 0, 0)):
    return {'type': 'CylinderGeometry', 'p': {'radiusTop': rt, 'radiusBottom': rb, 'height': h}, 'color': col, 'pos': list(pos), 'rot': list(rot), 'scl': [1, 1, 1]}
def H_tube(pts, radii, col, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    line = spline(pts, 6) if len(pts) > 2 else [Vector(p) for p in pts]; n = len(line)
    rad = [radii[0] + (radii[-1] - radii[0]) * i / max(1, n - 1) for i in range(n)] if len(radii) == 2 else radii
    return {'type': 'Tube', 'p': {'pts': [tuple(v) for v in line], 'radii': rad}, 'color': col, 'pos': list(pos), 'rot': list(rot), 'scl': list(scl)}
def H_eye(x, y, z, r):
    """the code shape's eye marker: a dark ball and its sparkle (0.35 of it); the v1.08e face puts the soft eye with lids there"""
    return [sph(r, '#1a1a1a', (x, y, z)), sph(r * .35, '#ffffff', (x + r * .3, y + r * .3, z + r * .5))]
def H_rot(d, n=(0, 1, 0)):
    """the turn that lays a part's y along d with its z (its flat side) towards n, as three's Euler (the ZYX order here)"""
    y = Vector(d).normalized(); z = Vector(n) - y * Vector(n).dot(y)
    if z.length < 1e-4: z = Vector((0, 0, 1)) - y * y.z
    z.normalize(); x = y.cross(z)
    R = Matrix((x, y, z)).transposed(); e = R.to_euler('ZYX'); return (e.x, e.y, e.z)
def H_feather(base, d, length, width, col, n=(0, 1, 0), flat=.3):
    """a soft feather: a flat capsule from base along d"""
    dd = Vector(d).normalized(); c = Vector(base) + dd * length * .5
    out = sph(.5, col, c, (width, length, width * flat), H_rot(dd, n)); out['res'] = 5; return out   # (a flattened oval: light)
def H_wing(pts, col, pos, rot, scl, th=.008):
    return {'type': 'Wing', 'p': {'pts': pts, 'th': th}, 'color': col, 'pos': list(pos), 'rot': list(rot), 'scl': list(scl)}
def H_set(piv, role, parts, extra=None):
    for p in piv:
        if p['role'] == role:
            p['parts'] = parts
            if extra is not None: p['extra'] = extra

def hand_chicken(piv):
    W, W2, W3 = '#fbf8f2', '#efe8da', '#e2d8c6'
    body = [sph(.24, W, (0, .36, 0), (1, .95, 1.2)), sph(.17, '#ffffff', (0, .37, .13), (1, 1, .9)), sph(.12, W, (0, .45, -.22), (.8, 1.1, .7), (.5, 0, 0))]
    for k in range(9):   # the tail fan, up and back
        a = (k - 4) / 4; body.append(H_feather((a * .04, .5, -.25), (a * .45, .85, -.55), .22 + .05 * (1 - abs(a)), .075, [W, W2, '#ffffff'][k % 3], n=(0, .3, -1)))
    for s in (-1, 1):    # folded wings: feathers layered from the shoulder back
        for k in range(6):
            body.append(H_feather((s * .2, .45 - k * .022, .1 - k * .015), (s * .1, -.3 - k * .05, -1), .28 - k * .025, .095, [W2, W, W3][k % 3], n=(s, 0, 0), flat=.28))
        body.append(sph(.11, W2, (s * .19, .4, .02), (.35, .75, 1.05)))
    for k in range(5): a = k * 1.256; body.append(sph(.06, '#ffffff', (math.cos(a) * .12, .19, math.sin(a) * .1 + .02), (1, .7, 1)))   # fluffy underneath
    head = [sph(.13, W, (0, 0, 0)), sph(.085, '#ffffff', (0, -.07, .02), (1.2, .8, 1)),
            H_cone(.036, .09, '#ffb52e', (0, -.005, .15), (1.57, 0, 0)), H_cone(.026, .06, '#f29a1a', (0, -.035, .13), (1.75, 0, 0)),
            sph(.045, '#e8332a', (0, .135, .0), (.55, 1, 1)), sph(.04, '#ee4a3a', (0, .14, .05), (.55, 1, 1)), sph(.034, '#e8332a', (0, .125, .095), (.55, .9, 1)), sph(.03, '#e8332a', (0, .12, -.05), (.55, .8, 1)),
            sph(.026, '#e8332a', (.012, -.09, .1), (.6, 1.25, .6)), sph(.024, '#e8332a', (-.012, -.088, .098), (.6, 1.2, .6))]
    head += H_eye(-.07, .03, .085, .022) + H_eye(.07, .03, .085, .022)
    H_set(piv, 'body', body); H_set(piv, 'head', head)
    for leg in ('leg0', 'leg1'):
        H_set(piv, leg, [H_cyl(.02, .017, .16, '#ffb52e', (0, -.08, 0))] + [H_cap(.011, .05, '#ffa21e', (dx * .03, -.155, .035), H_rot((dx * .4, 0, 1))) for dx in (-1, 0, 1)] + [H_cap(.01, .035, '#ffa21e', (0, -.155, -.025), H_rot((0, 0, -1)))])

def hand_penguin(piv):
    N, N2 = '#2f4a6e', '#263d5c'
    body = [sph(.17, N, (0, .25, 0), (1, 1.35, .95)), sph(.137, '#ffffff', (0, .23, .068), (1, 1.3, .72)), sph(.09, '#fff8ec', (0, .14, .1), (1, .9, .7)),
            H_cone(.05, .08, N2, (0, .06, -.15), (-2.3, 0, 0), (1.3, 1, .5))]
    body.append(sph(.12, N2, (0, .32, -.075), (1.1, 1.4, .55)))   # a soft darker back
    head = [sph(.115, N, (0, 0, 0)), sph(.058, '#ffffff', (-.045, .005, .07), (1, 1.15, .6)), sph(.058, '#ffffff', (.045, .005, .07), (1, 1.15, .6)),
            sph(.03, '#ffc23a', (-.085, -.035, .035), (.5, 1, 1.1)), sph(.03, '#ffc23a', (.085, -.035, .035), (.5, 1, 1.1)),
            H_cone(.024, .075, '#2a2a2e', (0, -.022, .135), (1.6, 0, 0), (1.1, 1, .8)), H_cone(.016, .05, '#ff8a3a', (0, -.033, .128), (1.75, 0, 0))]
    head += H_eye(-.048, .03, .095, .02) + H_eye(.048, .03, .095, .02)
    H_set(piv, 'body', body); H_set(piv, 'head', head)
    for leg, s in (('leg0', -1), ('leg1', 1)):   # the flippers: a soft flat paddle, white underneath
        H_set(piv, leg, [H_cap(.045, .13, N, (0, -.09, 0), (0, 0, -s * .12), (.35, 1, 1)), H_cap(.034, .1, '#ffffff', (-s * .012, -.1, 0), (0, 0, -s * .12), (.25, 1, .9))])
    for leg in ('leg2', 'leg3'):   # the feet: three plump toes and a pad
        H_set(piv, leg, [sph(.034, '#ff9a5a', (0, -.035, .02), (1, .4, 1.2))] + [H_cap(.015, .04, '#ff9a5a', (dx * .024, -.037, .055), H_rot((dx * .3, 0, 1))) for dx in (-1, 0, 1)])

def hand_emu(piv):
    B = ['#5e4f40', '#6f5e4c', '#7d6a55', '#544637']
    body = [sph(.3, '#5a4a3a', (0, .95, 0), (.85, .8, 1.25))]
    k = 0
    for ring in range(5):   # a shaggy coat: broad drooping feathers lying close over the body, in rings like shingles
        t = ring / 4; y = 1.2 - t * .32; rr = .2 + t * .07
        for j in range(12 - ring):
            a = j / (12 - ring) * TAU + ring * .45; o = Vector((math.cos(a) * rr * .85, 0, math.sin(a) * rr * 1.25))
            body.append(H_feather((o.x, y, o.z), (o.x * .9, -1, o.z * .9 - .35), .2 + .04 * t, .13, B[k % 4], n=(o.x, .25, o.z), flat=.35)); k += 1
    head = [H_tube([(0, -.02, -.02), (0, .3, .02), (0, .55, .045)], [.06, .038], '#5f86b0'), sph(.07, '#6a5a4a', (0, .05, -.01), (1.2, .9, 1.2)),
            sph(.075, '#6a5a4a', (0, .6, .05), (.9, 1, 1.1)), sph(.05, '#6f95bd', (-.045, .6, .085), (.6, 1, .8)), sph(.05, '#6f95bd', (.045, .6, .085), (.6, 1, .8)),
            H_cone(.03, .1, '#3a3a3e', (0, .585, .15), (1.57, 0, 0), (1.35, 1, .6))]
    for j in range(5): a = (j - 2) * .4; head.append(H_feather((a * .03, .66, .03), (a * .5, 1, -.4), .07, .03, B[j % 4], n=(0, .3, -1)))   # a little tuft
    head += H_eye(-.05, .62, .085, .018) + H_eye(.05, .62, .085, .018)
    tail = [sph(.11, '#5a4a3a', (0, 0, -.04))] + [H_feather((dx * .05, .02, -.05), (dx * .3, -.7, -.7), .24, .09, B[j % 4], n=(dx, .3, -1)) for j, dx in enumerate((-1.5, -.75, 0, .75, 1.5, -.4, .4))]
    H_set(piv, 'body', body); H_set(piv, 'head', head); H_set(piv, 'tail', tail)
    for leg in ('leg0', 'leg1'):
        H_set(piv, leg, [H_cyl(.04, .03, .72, '#8a7a6a', (0, -.36, 0))] + [sph(.032, '#7a6a5a', (0, -.2 - j * .12, .005), (1.1, .5, 1.1)) for j in range(4)]
              + [H_cap(.02, .09, '#7a6a5a', (dx * .045, -.715, .06), H_rot((dx * .45, 0, 1))) for dx in (-1, 0, 1)])

def hand_crane(piv):
    Wh, Bl = '#f6f3ec', '#2a2a2e'
    body = [sph(.26, Wh, (0, 1.05, 0), (.75, .72, 1.3)), sph(.17, '#ffffff', (0, 1.08, .18), (.8, .9, .9))]
    for s in (-1, 1):   # long folded wings, the flight feathers black at the tips
        for k in range(7):
            base = (s * .16, 1.16 - k * .025, .12 - k * .04)
            body.append(H_feather(base, (s * .08, -.18, -1), .36 - k * .02, .1, Wh if k < 4 else '#ebe6dc', n=(s, .4, 0)))
        for k in range(4): body.append(H_feather((s * .14, 1.06 - k * .02, -.2), (s * .1, -.35, -1), .2, .07, Bl, n=(s, .4, 0)))
    for k in range(9):   # the black bustle of the tail, drooping
        a = (k - 4) / 4; body.append(H_feather((a * .08, 1.08, -.3), (a * .35, -.5, -1), .22, .07, Bl if k % 3 else '#3a3a3e', n=(0, 1, -.3)))
    head = [H_tube([(0, 0, 0), (0, .25, .02), (0, .45, .07), (0, .58, .1)], [.045, .035], Bl), sph(.05, Wh, (0, .02, 0), (1.3, .7, 1.3)),
            sph(.07, Wh, (0, .63, .1), (.9, .95, 1.15)), sph(.034, '#e8332a', (0, .68, .085), (1.1, .5, 1.3)), sph(.042, Bl, (0, .61, .14), (1, .85, .75)),
            H_cone(.022, .22, '#c9b46a', (0, .605, .25), (1.57, 0, 0), (1, 1, .8))]
    head += H_eye(-.042, .645, .137, .016) + H_eye(.042, .645, .137, .016)
    H_set(piv, 'body', body); H_set(piv, 'head', head)
    for leg in ('leg0', 'leg1'):
        H_set(piv, leg, [H_cyl(.022, .019, .85, '#3a3a3e', (0, -.42, 0)), sph(.026, '#3a3a3e', (0, -.42, 0), (1, 1.3, 1))]
              + [H_cap(.011, .08, '#3a3a3e', (dx * .04, -.845, .05), H_rot((dx * .5, 0, 1))) for dx in (-1, 0, 1)] + [H_cap(.01, .05, '#3a3a3e', (0, -.845, -.03), H_rot((0, 0, -1)))])

def hand_peacock(piv):
    B, B2, G = '#1f5fbf', '#2a78d8', '#2f9a6a'
    body = [sph(.22, B, (0, .5, 0), (.85, 1, 1.15)), sph(.16, B2, (0, .56, .12), (1, 1.05, .9))]
    for s in (-1, 1):   # the wings: brown flight feathers under blue-green coverts
        for k in range(5): body.append(H_feather((s * .17, .58 - k * .03, .06 - k * .03), (s * .1, -.3, -1), .3 - k * .02, .09, ['#8a6a4a', '#a8865a'][k % 2], n=(s, .3, 0)))
        for k in range(4): body.append(H_feather((s * .18, .62 - k * .03, .1), (s * .1, -.4, -1), .14, .07, ['#2fae8a', '#1f8a8a'][k % 2], n=(s, .3, 0)))
    head = [H_cap(.06, .2, B, (0, .05, 0)), sph(.08, B, (0, .2, .04)), sph(.024, '#ffffff', (-.05, .2, .085), (1, .4, .5)), sph(.024, '#ffffff', (.05, .2, .085), (1, .4, .5)),
            H_cone(.02, .08, '#d9c9a0', (0, .19, .13), (1.57, 0, 0))]
    for j in range(5):   # the crest: little fans on fine stems
        a = (j - 2) * .25; tip = (a * .1, .36, .0 + (2 - abs(j - 2)) * .01)
        head += [H_tube([(a * .02, .26, .03), tip], [.004, .003], B), sph(.017, '#2fae8a', tip, (1, 1.2, .5)), sph(.008, B, (tip[0], tip[1], tip[2] + .008), (1, 1.2, .5))]
    head += H_eye(-.045, .22, .075, .015) + H_eye(.045, .22, .075, .015)
    tail = []
    for row, (n, L, eyer, cols) in enumerate([(15, .86, .066, (G, '#36a874')), (11, .62, .05, ('#2a8a5e', G))]):
        for k in range(n):   # the fan: long feathers, each with its eye spot
            a = -1.3 + 2.6 * k / (n - 1); d = Vector((math.sin(a), math.cos(a), -.08 - row * .05)); base = Vector((0, .05, row * .02))
            tail.append(H_feather(base, d, L, .085, cols[k % 2], n=(0, 0, 1), flat=.22))
            tip = base + d.normalized() * (L - .06); z = tip.z + .012
            for r_, c in ((eyer, '#ffd23f'), (eyer * .62, '#2fae8a'), (eyer * .32, '#14306f')):
                e = sph(r_, c, (tip.x, tip.y, z), (1, 1.25, .25)); e['res'] = 5; tail.append(e); z += .009
    H_set(piv, 'body', body); H_set(piv, 'head', head); H_set(piv, 'tail', tail)
    for leg in ('leg0', 'leg1'):
        H_set(piv, leg, [H_cyl(.02, .019, .3, '#c9b08a', (0, -.15, 0))] + [H_cap(.011, .06, '#c9b08a', (dx * .03, -.295, .04), H_rot((dx * .45, 0, 1))) for dx in (-1, 0, 1)])

def hand_dragon(piv):
    T, T2, C_, G_ = '#3cb8a0', '#46c8ae', '#f2e2a8', '#ffd23f'
    body = [H_cap(.13, .22, T, (0, 0, 0), (1.57, 0, 0)), sph(.1, C_, (0, -.04, .05), (1, .8, 1.4))]
    for k in range(5): z = .13 - k * .065; body.append(sph(.072, C_ if k % 2 else '#f6e8b8', (0, -.088, z), (1, .35, .62)))   # belly plates
    body += [sph(.135, T, (0, .14, .2)), H_cap(.07, .08, T2, (0, .1, .33), (1.57, 0, 0)), sph(.06, C_, (0, .068, .32), (1, .6, 1.2)),
             sph(.011, '#1a3a32', (.028, .115, .405)), sph(.011, '#1a3a32', (-.028, .115, .405)),
             sph(.035, '#ffffff', (.06, .2, .3)), sph(.035, '#ffffff', (-.06, .2, .3)), sph(.018, '#1a1a1a', (.065, .205, .325)), sph(.018, '#1a1a1a', (-.065, .205, .325))]
    for s in (-1, 1):
        body.append(H_tube([(s * .06, .25, .15), (s * .085, .32, .1), (s * .095, .37, .03)], [.024, .006], G_))   # horns
        body.append(H_cone(.035, .09, T2, (s * .12, .2, .17), (0, 0, -s * 1.1), (1, 1, .35)))                    # little fin ears
        body.append(H_tube([(s * .045, .1, .37), (s * .12, .085, .41), (s * .19, .12, .39)], [.006, .003], G_))  # whiskers
        for fz in (.06, -.08): body += [H_cap(.032, .06, T, (s * .08, -.13, fz)), H_cap(.008, .016, C_, (s * .095, -.17, fz + .03), H_rot((s * .3, -.2, 1)))]   # stubby legs with a claw
    for k in range(6): z = .1 - k * .085; y = .14 - abs(k - 1) * .012; body.append(H_cone(.03 - k * .002, .075, G_, (0, y, z), (-.3, 0, 0), (.45, 1, 1)))   # back spines
    body += [H_tube([(0, -.02, -.15), (0, -.05, -.29), (0, -.005, -.41), (0, .06, -.46)], [.07, .016], T), H_cone(.045, .08, G_, (0, .09, -.48), (-.6, 0, 0), (1.2, 1, .35))]
    H_set(piv, 'body', body)
    pts = [(0, 0), (.1, .05), (.2, .1), (.34, .15), (.31, .07), (.28, .01), (.24, .03), (.2, -.03), (.15, -.01), (.1, -.08), (.05, -.05)]
    for role, sx in (('wing0', -1), ('wing1', 1)):
        rot, scl = (-1.5708, 0, 0), (sx, 1, 1)
        parts = [H_wing(pts, '#7fe0c8', (0, 0, 0), rot, scl)]
        for tip in ((.34, .15), (.28, .01), (.2, -.03), (.1, -.08)):   # the finger bones
            parts.append(H_tube([(0, 0, 0), (tip[0] * .5, tip[1] * .5 + .01, .0), (tip[0], tip[1], 0)], [.012, .005], '#2a9a86', (0, 0, 0), rot, scl))
        parts.append(H_cone(.012, .035, G_, (sx * .35, 0, -.16), (0, 0, -sx * 1.2)))   # a claw at the wing's tip
        H_set(piv, role, parts, [])

def hand_firefly(piv):
    D, D2 = '#3a3f66', '#4a4f7a'
    body = [sph(.125, D, (0, 0, .08)), sph(.1, D2, (0, -.01, -.02), (1, .95, 1.05)),
            sph(.035, '#ffffff', (.06, .04, .18)), sph(.035, '#ffffff', (-.06, .04, .18)), sph(.017, '#1a1a1a', (.07, .04, .21)), sph(.017, '#1a1a1a', (-.07, .04, .21))]
    # (its glowing tail is the game's own glow, drawn beside this model: js/companion.ts)
    for s in (-1, 1):
        body += [H_tube([(s * .04, .1, .12), (s * .07, .19, .13), (s * .1, .23, .16)], [.008, .006], D), sph(.024, '#ffd23f', (s * .1, .235, .165))]   # antennae
        for k in range(3): body.append(H_cap(.008, .05, D, (s * .06, -.1, .04 - k * .05), H_rot((s * .5, -1, .1))))   # little legs
    H_set(piv, 'body', body)
    pts = [(0, 0), (.08, .06), (.17, .08), (.26, .06), (.31, .02), (.3, -.03), (.22, -.06), (.12, -.06), (.05, -.04)]
    for role, sx in (('wing0', -1), ('wing1', 1)):
        rot, scl = (-1.5708, 0, 0), (sx, 1, 1)
        parts = [H_wing(pts, '#dff4ff', (0, 0, 0), rot, scl, .005)] + [H_tube([(.02, 0, 0), (v[0] * .6, v[1] * .6, .002), v + (.002,)], [.004, .002], '#a8d8f0', (0, 0, 0), rot, scl) for v in ((.28, .05), (.27, -.03), (.18, .07))]
        H_set(piv, role, parts, [])

HAND = {'chicken': hand_chicken, 'penguin': hand_penguin, 'emu': hand_emu, 'crane': hand_crane, 'peacock': hand_peacock, 'dragon': hand_dragon, 'firefly': hand_firefly}

# ---- one creature ----
def build(kind, A, companion=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = FPS
    mn, mx = A['box']['min'], A['box']['max']; size = max(mx[i] - mn[i] for i in range(3))
    piv = json.loads(json.dumps(A['pivots'])); A = dict(A, legs=[dict(l) for l in A['legs']]) if not companion else A
    if kind in HAND: HAND[kind](piv)   # (v1.08g creatures: the hand-drawn shapes)
    restyle(kind, A, piv)
    F = add_face(kind, piv, size, companion)
    if not companion:   # the legs' heights (how low it lies down to sleep) and which legs are in front
        lp = [p for p in piv if p['role'].startswith('leg')]
        A['hip'] = sum(p['pos'][1] for p in lp) / max(1, len(lp))
        for i, l in enumerate(A['legs']): l['front'] = piv[next(j for j, p in enumerate(piv) if p['role'] == 'leg%d' % i)]['pos'][2] > 0
    W = [three_matrix(p['pos'], p['rot'], (1, 1, 1)) for p in piv]   # (the dump gives each pivot's place in the whole creature)
    bones = [p['role'] for p in piv if p['role'] != 'root']
    objs = []
    for i, p in enumerate(piv):
        if p['role'] == 'root': continue
        items = []
        for s in p['parts'] + [e for e in p['extra'] if not (e.get('glow') and e.get('opacity', 1) >= 1)]:
            e, _ = extents(s); m = max(e)
            res = 16 if m > size * .35 else (12 if m > size * .1 else (11 if p['role'].startswith('eye') else (8 if m > size * .05 else 6)))
            if p['role'] == 'body' and m <= size * .35: res = min(res, 10)   # (patches and puffs on the body: fewer triangles)
            if s.get('res'): res = s['res']   # (v1.08g creatures: a flat feather needs few sides)
            V, Fc = prim(s, res)
            special = s['type'] == 'ConeGeometry' and s['p'].get('radialSegments') == 4 and not s['rot'][0] and not s['rot'][2] and s['scl'][0] != s['scl'][2]
            M = C @ W[i] @ s.get('pre', Matrix.Identity(4)) @ three_matrix(s['pos'], s['rot'], s['scl'], special)
            V = [(M @ Vector(v)).to_tuple() for v in V]
            if s['scl'][0] * s['scl'][1] * s['scl'][2] < 0: Fc = [f[::-1] for f in Fc]   # a mirrored part (the dragon's left wing)
            items.append((V, Fc, lin(s['color'])))
        if not items: continue
        o = mesh_obj(p['role'], items)
        vg = o.vertex_groups.new(name=p['role']); vg.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
        kn = KNEES.get(p['role'])
        if kn is not None:   # the lower leg follows the knee, blended softly round it
            vk = o.vertex_groups.new(name='knee' + p['role'][3:]); band = max(.02, kn * .3)
            for v in o.data.vertices:
                t = max(0.0, min(1.0, (kn + band - v.co.z) / (2 * band))); vg.add([v.index], 1 - t, 'REPLACE'); vk.add([v.index], t, 'REPLACE')
        objs.append(o)
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
    # as tall as the code shape (the plush proportions changed it), so it stands where it stood and is touched the same
    low = min(v.co.z for v in body.data.vertices); lift = -low if (low < -.005 and not companion) else 0.0   # (nothing below the ground)
    if lift: body.data.transform(Matrix.Translation((0, 0, lift))); W = [Matrix.Translation((0, 0, lift)) @ Wm for Wm in W]
    want = A['box']['max'][1] - min(0, A['box']['min'][1]); got = max(v.co.z for v in body.data.vertices)
    fit = max(.8, min(1.25, want / got)) if got > 0 and not companion else 1.0
    body.data.transform(Matrix.Scale(fit, 4)); W = [Matrix.Translation(Wm.to_translation() * fit) @ Wm.to_3x3().to_4x4() for Wm in W]
    if not companion: A['hip'] = A['hip'] * fit
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
    moves = companion_moves(kind, A, arm, bones, F, size) if companion else animal_moves(kind, A, arm, bones, F, size)
    for name, L, pose in moves: clip(arm, name, L, pose)
    for pb in arm.pose.bones: pb.rotation_euler = Z3; pb.location = Z3; pb.scale = O3
    n = tris(body)
    raw = os.path.join(OUT, f'creature-{kind}.raw.glb')
    bpy.ops.export_scene.gltf(filepath=raw, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_lights=False,
                              export_cameras=False, export_apply=False, export_skins=True, export_morph=False, use_selection=False,
                              export_vertex_color='ACTIVE', export_force_sampling=True, export_frame_step=2)
    if SHEET: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'creature-{kind}.blend'))
    print('CREATURE', kind, 'tris', n, 'face', len(F.get('eyes', [])), len(F.get('brows', [])), bool(F.get('mouth')), 'clips', ','.join(m[0] for m in moves), 'size', round(size, 3), flush=True)
    return n

stats = {}
for kind, A in SPEC['animals'].items():
    if not ONLY or kind in ONLY: stats[kind] = build(kind, A)
for kind, A in SPEC['companions'].items():
    if not ONLY or kind in ONLY: stats[kind] = build(kind, A, True)
json.dump({'tris': stats, 'happy': HAPPY}, open(os.path.join(OUT, 'creatures-built.json'), 'w'), indent=1)

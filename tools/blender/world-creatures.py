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
        pr.append(disc(R * .36, '#ffffff', dn * R * .2 + up * R * .36 - sideways * R * .3, 1.0, .5))
        pr.append(disc(R * .16, '#ffffff', dn * R * .2 - up * R * .3 + sideways * R * .34, 1.0, 1.0))
        face['eyes'].append(pivot('eye%d' % i, base, pr))
        # the closed-eye arc: "^" for joy, turned over for sleep (shown by the clips, tiny otherwise)
        Rt = R * .7
        arc = {'type': 'TorusGeometry', 'p': {'radius': Rt, 'tube': R * .13, 'arc': 2.3}, 'color': '#2b1b12' if lum(skin) > .06 else '#fff3e0',   # (light on a dark face)
               'pos': list(dn * R * .2 - up * Rt * .55), 'rot': [ax, ay, math.pi / 2 - 1.15], 'scl': [1, 1, .6]}
        face.setdefault('lids', []).append(pivot('lid%d' % i, base, [arc]))
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

# ---- one creature ----
def build(kind, A, companion=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = FPS
    mn, mx = A['box']['min'], A['box']['max']; size = max(mx[i] - mn[i] for i in range(3))
    piv = json.loads(json.dumps(A['pivots'])); A = dict(A, legs=[dict(l) for l in A['legs']]) if not companion else A
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

# (v1.08e places, owner 6 Nov 2026 AEDT) Landmarks, bridges, buildings, stalls and festival props remade in Blender for
# the valley, loaded near the child (js/modelkit.ts; the code shapes stay as the fallback).
# - Every model is built in its code shape's own frame (tools/blender/places-spec.json, read from the running game by
#   tools/blender/places-dump.mts): the same place, size and facing, so walls, doors and colliders stay true.
# - The famous places are drawn by hand here (HAND below) so they look like themselves: Thap Rua and the The Huc bridge
#   on Ho Guom, Khue Van Cac at Van Mieu, the One Pillar Pagoda, Ben Thanh market, the Sydney Opera House and the
#   Harbour Bridge. Every other model is the code shape rebuilt part by part: rounder parts, soft bevelled edges.
# - Picture-book toon look: one mesh, colours in the corners (no pictures), one material; meshopt-compressed by gltfpack.
# Run: blender -b -P tools/blender/world-places.py -- tools/blender/places-spec.json models/world [name ...]
#      then each models/world/<name>.raw.glb is packed by gltfpack (tools/make-places.mts does both).
import sys, os, json, math
sys.dont_write_bytecode = True
import bpy, bmesh
from mathutils import Matrix, Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SPEC, OUT = argv[0], argv[1]
ONLY = set(argv[2:])
os.makedirs(OUT, exist_ok=True)
SPECS = json.load(open(SPEC))
TAU = math.pi * 2
REMAKE = [True]
DETAIL = [2]   # 2: tile courses and leafy clusters, 1: roofs and bands only (a heavy model), 0: none   # rebuilding a code shape: round parts get more sides; a hand model keeps the sides it asks for

# ---------- colours: the game's hex colours are sRGB; the corners hold linear values (as three.js merge() does) ----------
def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hexc(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(ch * 2 for ch in h)
    return (lin(int(h[0:2], 16)), lin(int(h[2:4], 16)), lin(int(h[4:6], 16)), 1.0)

# ---------- three.js geometry, in three.js's frame (y up, +z front) ----------
# each returns (verts, faces): verts [(x, y, z)], faces [[i, j, k, ...]] counter-clockwise seen from outside
def g_box(width=1, height=1, depth=1, **k):
    x, y, z = width / 2, height / 2, depth / 2
    v = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z), (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    f = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]]
    return v, f

def g_cyl(radiusTop=1, radiusBottom=1, height=1, radialSegments=32, heightSegments=1, openEnded=False, thetaStart=0, thetaLength=TAU, smooth=True, **k):
    n = radialSegments
    if smooth and REMAKE[0] and n >= 8: n = max(n, 20)   # round things rounder; 4-6 sides stay faceted (roofs, rocks, pillars)
    full = abs(thetaLength - TAU) < 1e-4
    cols = n if full else n + 1
    v, f = [], []
    rings = []
    for yi, (y, r) in enumerate(((height / 2, radiusTop), (-height / 2, radiusBottom))):
        ring = []
        if r < 1e-6:
            v.append((0, y, 0)); ring = [len(v) - 1] * cols
        else:
            for i in range(cols):
                t = thetaStart + i / n * thetaLength
                v.append((r * math.sin(t), y, r * math.cos(t))); ring.append(len(v) - 1)
        rings.append(ring)
    top, bot = rings
    for i in range(n):
        j = (i + 1) % cols if full else i + 1
        q = [top[i], bot[i], bot[j], top[j]]
        q2 = []
        for a in q:
            if a not in q2: q2.append(a)
        if len(q2) >= 3: f.append(q2)
    if not openEnded:
        for (y, r), ring, up in (((height / 2, radiusTop), top, True), ((-height / 2, radiusBottom), bot, False)):
            if r < 1e-6: continue
            idx = ring[:n] if full else ring
            if not full:
                v.append((0, y, 0)); c = len(v) - 1
                for i in range(len(idx) - 1):
                    f.append([c, idx[i], idx[i + 1]] if up else [c, idx[i + 1], idx[i]])
            else:
                f.append(list(idx) if up else list(reversed(idx)))
    return v, f

def g_cone(radius=1, height=1, radialSegments=32, heightSegments=1, openEnded=False, thetaStart=0, thetaLength=TAU, **k):
    return g_cyl(0, radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength, smooth=radialSegments >= 8)

def g_sphere(radius=1, widthSegments=32, heightSegments=16, phiStart=0, phiLength=TAU, thetaStart=0, thetaLength=math.pi, **k):
    ws, hs = widthSegments, heightSegments
    if REMAKE[0] and ws >= 8: ws = max(ws, 20)
    if REMAKE[0] and hs >= 6: hs = max(hs, 12)
    v, f, grid = [], [], []
    for iy in range(hs + 1):
        row = []; vv = iy / hs; th = thetaStart + vv * thetaLength
        for ix in range(ws + 1):
            ph = phiStart + ix / ws * phiLength
            v.append((-radius * math.cos(ph) * math.sin(th), radius * math.cos(th), radius * math.sin(ph) * math.sin(th))); row.append(len(v) - 1)
        grid.append(row)
    for iy in range(hs):
        for ix in range(ws):
            a, b, c, d = grid[iy][ix + 1], grid[iy][ix], grid[iy + 1][ix], grid[iy + 1][ix + 1]
            q = [a, b, c, d]
            if iy == 0 and thetaStart == 0: q = [a, c, d]
            elif iy == hs - 1 and abs(thetaStart + thetaLength - math.pi) < 1e-5: q = [a, b, c]
            f.append(q)
    return v, f

def g_torus(radius=1, tube=.4, radialSegments=12, tubularSegments=48, arc=TAU, **k):
    rs, ts = (max(radialSegments, 8), max(tubularSegments, 24)) if REMAKE[0] else (radialSegments, tubularSegments)
    full = abs(arc - TAU) < 1e-4
    v, f, grid = [], [], []
    for j in range(rs + 1):
        row = []
        for i in range(ts + 1):
            u = i / ts * arc; w = j / rs * TAU
            v.append(((radius + tube * math.cos(w)) * math.cos(u), (radius + tube * math.cos(w)) * math.sin(u), tube * math.sin(w))); row.append(len(v) - 1)
        grid.append(row)
    for j in range(1, rs + 1):
        for i in range(1, ts + 1):
            a, b, c, d = grid[j][i - 1], grid[j - 1][i - 1], grid[j - 1][i], grid[j][i]
            f.append([a, b, c, d][::-1])
    if not full:   # close the ends of an arc
        for i, flip in ((0, False), (ts, True)):
            ring = [grid[j][i] for j in range(rs)]
            f.append(ring if flip else ring[::-1])
    return v, f

PHI = (1 + 5 ** .5) / 2
POLY = {
    'IcosahedronGeometry': [(-1, PHI, 0), (1, PHI, 0), (-1, -PHI, 0), (1, -PHI, 0), (0, -1, PHI), (0, 1, PHI), (0, -1, -PHI), (0, 1, -PHI), (PHI, 0, -1), (PHI, 0, 1), (-PHI, 0, -1), (-PHI, 0, 1)],
    'DodecahedronGeometry': [(a, b, c) for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)] + [(0, s / PHI, t * PHI) for s in (-1, 1) for t in (-1, 1)] + [(s / PHI, t * PHI, 0) for s in (-1, 1) for t in (-1, 1)] + [(s * PHI, 0, t / PHI) for s in (-1, 1) for t in (-1, 1)],
    'OctahedronGeometry': [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)],
    'TetrahedronGeometry': [(1, 1, 1), (-1, -1, 1), (-1, 1, -1), (1, -1, -1)],
}
def g_poly(kind, radius=1, detail=0, **k):
    pts = [Vector(p).normalized() * radius for p in POLY[kind]]
    bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts)
    if kind == 'DodecahedronGeometry':   # the hull is triangles: join each flat pentagon back into one face
        bmesh.ops.dissolve_limit(bm, angle_limit=0.01, verts=bm.verts, edges=bm.edges)
    if detail:
        bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=detail, use_grid_fill=True)
        for vt in bm.verts: vt.co = vt.co.normalized() * radius
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    v = [tuple(vt.co) for vt in bm.verts]; idx = {vt: i for i, vt in enumerate(bm.verts)}
    f = [[idx[vt] for vt in fc.verts] for fc in bm.faces]
    bm.free(); return v, f

def g_circle(radius=1, segments=32, thetaStart=0, thetaLength=TAU, **k):
    n = max(segments, 16); v = [(0, 0, 0)]
    for i in range(n + 1):
        t = thetaStart + i / n * thetaLength; v.append((radius * math.cos(t), radius * math.sin(t), 0))
    return v, [[0, i, i + 1] for i in range(1, n + 1)]

def g_plane(width=1, height=1, **k):
    x, y = width / 2, height / 2
    return [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0)], [[0, 1, 2, 3]]

def g_capsule(radius=1, length=1, capSegments=4, radialSegments=8, **k):
    n = max(radialSegments, 12); half = length / 2; rows = []
    v, f = [], []
    steps = max(capSegments, 4)
    prof = [(0, half + radius)]
    for i in range(1, steps + 1): a = i / steps * math.pi / 2; prof.append((radius * math.sin(a), half + radius * math.cos(a)))
    for i in range(0, steps + 1): a = i / steps * math.pi / 2; prof.append((radius * math.cos(a), -half - radius * math.sin(a)))
    return g_lathe([(x, y) for x, y in prof], n)

def g_lathe(points=None, segments=12, phiStart=0, phiLength=TAU, **k):
    pts = [(p['x'], p['y']) if isinstance(p, dict) else p for p in points]
    n = max(segments, 12); v, f = [], []
    for i in range(n + 1):
        ph = phiStart + i / n * phiLength
        for (x, y) in pts: v.append((x * math.sin(ph), y, x * math.cos(ph)))
    m = len(pts)
    for i in range(n):
        for j in range(m - 1):
            a, b, c, d = i * m + j, (i + 1) * m + j, (i + 1) * m + j + 1, i * m + j + 1
            q = []
            for t in (a, d, c, b):
                if v[t] not in [v[s] for s in q]: q.append(t)
            if len(q) >= 3: f.append(q)
    return v, f

GEO = {'BoxGeometry': g_box, 'CylinderGeometry': g_cyl, 'ConeGeometry': g_cone, 'SphereGeometry': g_sphere, 'TorusGeometry': g_torus,
       'CircleGeometry': g_circle, 'PlaneGeometry': g_plane, 'CapsuleGeometry': g_capsule, 'LatheGeometry': g_lathe}

def part_matrix(pos, rot, scl, hip=False):
    """the matrix gfx.ts P() builds: T * R(XYZ) * S, or for a hip roof (a 4-sided cone turned about y and stretched) T * S * Ry"""
    T = Matrix.Translation(Vector(pos)); S = Matrix.Diagonal((scl[0], scl[1], scl[2], 1))
    if hip: return T @ S @ Matrix.Rotation(rot[1], 4, 'Y')
    return T @ Euler(rot, 'ZYX').to_matrix().to_4x4() @ S   # (three.js 'XYZ' is Rx Ry Rz: Blender calls that order 'ZYX')

# ---------- the builder: parts in three.js's frame, joined into one bmesh with colours in the corners ----------
TO_BL = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))   # three (x, y, z) -> Blender (x, -z, y); glTF export turns it back

class Model:
    def __init__(self):
        self.bm = bmesh.new(); self.col = self.bm.loops.layers.float_color.new('Col')
    def add(self, vf, color, M=Matrix.Identity(4)):
        v, f = vf; c = hexc(color) if isinstance(color, str) else color
        W = TO_BL @ M
        flip = W.to_3x3().determinant() < 0
        vs = [self.bm.verts.new(W @ Vector(p)) for p in v]
        for fc in f:
            ids = list(reversed(fc)) if flip else fc
            try: face = self.bm.faces.new([vs[i] for i in ids])
            except ValueError: continue
            for l in face.loops: l[self.col] = c
    def part(self, geo, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), hip=None, **p):
        """like gfx.ts P(): geo is a GEO name or a (verts, faces) pair"""
        sc = (scl, scl, scl) if isinstance(scl, (int, float)) else scl
        if not REMAKE[0]:   # a hand model: light defaults (three.js's own are 32 sides)
            if geo == 'SphereGeometry': p.setdefault('widthSegments', 12); p.setdefault('heightSegments', 8)
            elif geo in ('CylinderGeometry', 'ConeGeometry'): p.setdefault('radialSegments', 12)
            elif geo == 'TorusGeometry': p.setdefault('radialSegments', 4); p.setdefault('tubularSegments', 16)
        vf = geo if isinstance(geo, tuple) else (g_poly(geo, **p) if geo in POLY else GEO[geo](**p))
        if hip is None: hip = geo == 'ConeGeometry' and p.get('radialSegments') == 4 and not rot[0] and not rot[2] and sc[0] != sc[2]
        self.add(vf, color, part_matrix(pos, rot, sc, hip))

def tint(c, f):
    """a colour (hex or linear tuple) made lighter (f > 1) or darker (f < 1), in linear values"""
    r, g, b, _ = hexc(c) if isinstance(c, str) else c
    return (min(1., r * f), min(1., g * f), min(1., b * f), 1.)

def rgb(c): return hexc(c)[:3]

def roof_detail(m, v, color):
    """(refinement) a pyramid or hip roof (a 4-sided cone) dressed as a tiled roof: eaves overhang with a fascia board,
    darker ridges along the hips and tile courses across each face"""
    lo = min(p[1] for p in v); hi = max(p[1] for p in v)
    base = [Vector(p) for p in v if abs(p[1] - lo) < 1e-4]; apex = [Vector(p) for p in v if abs(p[1] - hi) < 1e-4]
    if len(base) < 4 or not apex or hi - lo < .15: return False
    c = sum(base, Vector()) / len(base); top = sum(apex, Vector()) / len(apex)
    base = sorted({(round(p.x, 4), round(p.z, 4)): p for p in base}.values(), key=lambda p: math.atan2(p.z - c.z, p.x - c.x))
    if len(base) != 4: return False
    out = [c + (p - c) * 1.07 - Vector((0, .04, 0)) for p in base]   # the eaves stand out a little
    dark, light = tint(color, .72), tint(color, 1.12)
    faces = [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]]
    if (out[1] - out[0]).cross(top - out[0]).dot(((out[0] + out[1]) / 2 + top) / 2 - c) < 0: faces = [q[::-1] for q in faces]   # (facing out)
    m.add(([tuple(p) for p in out] + [tuple(top)], faces), color)
    m.add(([tuple(p) for p in out], [[3, 2, 1, 0] if faces[0] == [0, 1, 4] else [0, 1, 2, 3]]), tint(color, .6))   # the soffit underneath
    # the fascia under the eaves
    fz = [tuple(p) for p in out] + [tuple(p - Vector((0, .12, 0))) for p in out]
    m.add((fz, [[i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i] for i in range(4)] + [[4 + (i + 1) % 4, (i + 1) % 4, i, 4 + i] for i in range(4)]), dark)
    # hip ridges and tile courses (thin raised strips)
    def strip(a, b, w, col, lift=.025):
        d = b - a; L = d.length
        if L < .05: return
        mid = (a + b) / 2 + Vector((0, lift, 0)); R = Vector((1, 0, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        m.add(g_box(L, w, w), col, Matrix.Translation(mid) @ R)
    for p in out: strip(p, top, .07, dark)
    n = max(1, int((hi - lo) / .4)) if DETAIL[0] > 1 else 1
    for i in range(4):
        a0, b0 = out[i], out[(i + 1) % 4]
        for k in range(1, n):
            t = k / n; strip(a0 + (top - a0) * t, b0 + (top - b0) * t, .035, light if k % 2 else dark, .02)
    return True

def from_spec(m, sp):
    """the code shape rebuilt part by part, with picture-book detail: tiled roofs, wall bands, window frames and sills,
    rounder foliage, and a slight hand-painted colour change from part to part"""
    import random
    rnd = random.Random(len(sp['parts']))
    for idx, p in enumerate(sp['parts']):
        t = p['type']; col = p['color']
        if p.get('tris'):   # a shape with no simple recipe (an extruded sign or roof): its triangles as the game made them
            a = p['tris']; v = [(a[i], a[i + 1], a[i + 2]) for i in range(0, len(a), 3)]
            m.add((v, [[i, i + 1, i + 2] for i in range(0, len(v), 3)]), col); continue
        if t not in GEO and t not in POLY: print('SKIP part', t, flush=True); continue
        prm = dict(p.get('p') or {}); sc = p['scl']; rot = p['rot']; hip = p.get('hip', False)
        M = part_matrix(p['pos'], rot, sc, hip)
        c = tint(col, .95 + rnd.random() * .09)   # (each part a touch different, as if painted by hand)
        r, g, b = rgb(col)
        flat_turn = abs(rot[0]) < 1e-3 and abs(rot[2]) < 1e-3
        # a 4-sided cone standing up: a roof
        if t == 'ConeGeometry' and prm.get('radialSegments') == 4 and flat_turn and not prm.get('openEnded'):
            v, f = g_cone(**prm); vv = [tuple(M @ Vector(q)) for q in v]
            if roof_detail(m, vv, c): continue
        # green round things: foliage, a soft cluster of smaller balls in the same space
        if t in ('SphereGeometry', 'IcosahedronGeometry', 'DodecahedronGeometry') and DETAIL[0] > 1 and g > r * 1.15 and g > b * 1.1 and .25 < prm.get('radius', 1) < 2.2 and prm.get('thetaLength', math.pi) > 3 and prm.get('phiLength', TAU) > 6:   # (whole balls only: a dome is not a bush)
            R0 = prm.get('radius', 1)
            for k in range(4):
                a = k / 4 * TAU + idx; off = (math.cos(a) * .42, .12 * (k % 2), math.sin(a) * .42) if k < 3 else (0, .35, 0)
                rr = R0 * (.62 if k < 3 else .58)
                m.add(g_sphere(rr, 8, 6), tint(c, .9 + .08 * k), M @ Matrix.Translation(Vector(off) * R0))
            continue
        m.part(t, c, p['pos'], rot, sc, hip=hip, **prm)
        if t != 'BoxGeometry' or not flat_turn: continue
        w, h, d = prm.get('width', 1), prm.get('height', 1), prm.get('depth', 1)
        # a wall block: a darker plinth at its foot, a lighter cornice at its top
        if h > 1.2 and w > 1 and d > 1 and p['pos'][1] - h / 2 < .6:
            ph = min(.35, h * .12)
            m.add(g_box(w + .06, ph, d + .06), tint(c, .8), M @ Matrix.Translation((0, -h / 2 + ph / 2, 0)))
            m.add(g_box(w + .1, .12, d + .1), tint(c, 1.12), M @ Matrix.Translation((0, h / 2 - .06, 0)))
            continue
        # a window or door pane (thin, glassy or dark): a light frame round it and a sill under it
        thin = min(w, d); glassy = b > r + .08 and b >= g * .95
        if thin < .16 and h > .4 and max(w, d) > .4 and (glassy or max(r, g, b) < .12):
            along_x = w >= d; W = w if along_x else d; frame = (.98, .95, .9, 1.); s = .06
            def bx(cx, cy, ww, hh, dd): m.add(g_box(ww, hh, dd) if along_x else g_box(dd, hh, ww), frame, M @ Matrix.Translation((cx, cy, 0) if along_x else (0, cy, cx)))
            bx(0, h / 2 + s / 2, W + 2 * s, s, thin + .04); bx(-W / 2 - s / 2, 0, s, h, thin + .04); bx(W / 2 + s / 2, 0, s, h, thin + .04)
            if glassy:
                bx(0, -h / 2 - .03, W + .2, .06, thin + .14)   # the sill
                bx(0, 0, .04, h, thin + .02)                  # the glazing bar

# ---------- shapes for the hand-made landmarks ----------
def B(m, w, h, d, color, pos, rot=(0, 0, 0)): m.part('BoxGeometry', color, pos, rot, width=w, height=h, depth=d)
def C(m, rt, rb, h, color, pos, rot=(0, 0, 0), seg=16): m.part('CylinderGeometry', color, pos, rot, radiusTop=rt, radiusBottom=rb, height=h, radialSegments=seg)

def viet_roof(m, w, d, h, color, pos, curl=.45, over=.5, ridge_color=None, thick=.14, rot_y=0):
    """a Vietnamese tiled roof: four sloping faces, the ridge on top, the corners curling up like a boat's prow"""
    x0, y0, z0 = pos
    W, D = w / 2 + over, d / 2 + over
    rw = max(w / 2 - d / 2, w * .12)   # half the ridge length
    nx = 6
    v, f = [], []
    # rings: edge (eaves) ring with curled corners, and the ridge line
    def eave(t):   # t in [0, 4): around the rectangle, corners at integers
        side, s = int(t) % 4, t - int(t)
        corners = [(-W, -D), (W, -D), (W, D), (-W, D)]
        a, b = corners[side], corners[(side + 1) % 4]
        x = a[0] + (b[0] - a[0]) * s; z = a[1] + (b[1] - a[1]) * s
        u = min(s, 1 - s) * 2   # 0 at a corner, 1 mid side
        y = curl * (1 - u) ** 2.2
        return (x, y, z)
    N = 4 * nx
    outer = [eave(i / nx) for i in range(N)]
    rid = []
    for i in range(N):
        x, y, z = outer[i]
        rx = max(-rw, min(rw, x * rw / W)); rid.append((rx, h, 0))
    for i in range(N): v.append(outer[i])
    for i in range(N): v.append(rid[i])
    for i in range(N):
        j = (i + 1) % N
        q = [i, j, N + j, N + i]
        f.append(q)
    # the underside (so the roof has a thickness seen from below)
    for i in range(N): x, y, z = outer[i]; v.append((x * .96, y - thick, z * .96))
    for i in range(N):
        j = (i + 1) % N; f.append([2 * N + j, 2 * N + i, i, j][::-1])
    under = list(range(2 * N, 3 * N)); f.append(under)
    M = Matrix.Translation((x0, y0, z0)) @ Matrix.Rotation(rot_y, 4, 'Y')
    # drop the degenerate ridge quads to triangles
    clean = []
    for q in f:
        u = []
        for a in q:
            if all((Vector(v[a]) - Vector(v[b])).length > 1e-5 for b in u): u.append(a)
        if len(u) >= 3: clean.append(u)
    m.add((v, clean), color, M)
    if ridge_color:
        m.part('BoxGeometry', ridge_color, (x0, y0 + h + .06, z0), (0, rot_y, 0), width=rw * 2 + .2, height=.16, depth=.22)
        for s in (-1, 1):   # the curled dragon-tail ends of the ridge
            ex, ez = s * (rw + .12) * math.cos(rot_y), -s * (rw + .12) * math.sin(rot_y)
            m.part('ConeGeometry', ridge_color, (x0 + ex, y0 + h + .28, z0 + ez), (0, 0, -s * .5), radius=.12, height=.5, radialSegments=6)

def arch_door(m, w, h, color, pos, rot_y=0, depth=.06):
    """a dark arched opening on a wall: a box with a half-round top"""
    x, y, z = pos
    M0 = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rot_y, 4, 'Y')
    m.add(g_box(w, h - w / 2, depth), color, M0 @ Matrix.Translation((0, (h - w / 2) / 2, 0)))
    m.add(g_cyl(w / 2, w / 2, depth, 12, thetaStart=math.pi / 2, thetaLength=math.pi, smooth=False), color, M0 @ Matrix.Translation((0, h - w / 2, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))   # (the upper half-disc, facing out)

def shell(m, r, ps, pl, ts, tl, thick, color, M):
    """a curved shell (an Opera House sail): a piece of a sphere with a thickness"""
    nu, nv = 10, 7; v, f = [], []
    for k, rr in enumerate((r, r - thick)):
        for j in range(nv + 1):
            for i in range(nu + 1):
                ph = ps + i / nu * pl; th = ts + j / nv * tl
                v.append((-rr * math.cos(ph) * math.sin(th), rr * math.cos(th), rr * math.sin(ph) * math.sin(th)))
    G = lambda k, j, i: k * (nu + 1) * (nv + 1) + j * (nu + 1) + i
    for j in range(nv):
        for i in range(nu):
            f.append([G(0, j, i + 1), G(0, j, i), G(0, j + 1, i), G(0, j + 1, i + 1)])
            f.append([G(1, j, i), G(1, j, i + 1), G(1, j + 1, i + 1), G(1, j + 1, i)])
    for j in range(nv):   # the two side edges
        f.append([G(0, j, 0), G(1, j, 0), G(1, j + 1, 0), G(0, j + 1, 0)][::-1])
        f.append([G(0, j, nu), G(1, j, nu), G(1, j + 1, nu), G(0, j + 1, nu)])
    for i in range(nu):   # top and bottom edges
        f.append([G(0, 0, i), G(1, 0, i), G(1, 0, i + 1), G(0, 0, i + 1)])
        f.append([G(0, nv, i), G(1, nv, i), G(1, nv, i + 1), G(0, nv, i + 1)][::-1])
    m.add((v, f), color, M)

# ---------- the famous places, drawn by hand (each fits its code shape's box; +z is the front) ----------
def hand_turtle(m, sp):
    # Thap Rua: a small three-storey tower of old plastered brick, arched openings on every side, a little crown on top;
    # it stands at the code shape's place on Ho Guom's islet, the green turtle-back rock beside it (as in the code shape)
    wall, trim, dark = '#d9cdb2', '#c2b393', '#4a3e34'
    B(m, 1.9, .3, 1.9, '#b8ab90', (0, .2, 0))
    for k, (w, h, y) in enumerate(((1.6, 1.25, .35), (1.3, 1.0, 1.6), (1.0, .85, 2.6))):
        B(m, w, h, w, wall, (0, y + h / 2, 0))
        B(m, w + .18, .1, w + .18, trim, (0, y + h, 0))
        nd = 3 if k == 0 else 2
        for side in range(4):
            a = side * math.pi / 2
            for i in range(nd):
                off = (i - (nd - 1) / 2) * w / nd
                px, pz = math.sin(a) * (w / 2 + .01) + math.cos(a) * off, math.cos(a) * (w / 2 + .01) - math.sin(a) * off
                arch_door(m, w / nd * .5, h * .62, dark, (px, y + h * .14, pz), a)
    # the crown: a small pavilion roof and the round finial
    viet_roof(m, .9, .9, .35, '#8a7a5a', (0, 3.45, 0), curl=.12, over=.12)
    C(m, .06, .1, .35, trim, (0, 3.95, 0), seg=8)
    m.part('SphereGeometry', '#c9b37a', (0, 4.15, 0), radius=.12, widthSegments=10, heightSegments=8)
    # the turtle-back rock and its moss, where the code shape had it
    m.part('SphereGeometry', '#3f7d5c', (-1.6, .3, .5), (0, 0, 0), (1.4, .4, 1), radius=.6)
    for i in range(6):
        a = i / 6 * TAU
        m.part('SphereGeometry', '#5a9a6a', (-1.6 + math.cos(a) * .55, .45, .5 + math.sin(a) * .35), radius=.16, widthSegments=8, heightSegments=6)

def hand_thehuc(m, sp):
    # Cau The Huc: the red wooden bridge arching over Ho Guom to Ngoc Son temple (its gate on the shore end, x = 8.2).
    # The deck follows the code's curve exactly (y = .5 + sin(t pi) * 1.4 from x = -7 to 7): the child walks on it.
    m.part('CylinderGeometry', '#4fa8d8', (0, .06, 0), (0, 0, 0), (1.3, 1, .8), radiusTop=7, radiusBottom=7, height=.08, radialSegments=28)
    n = 28
    pts = [(-7 + i / n * 14, .5 + math.sin(i / n * math.pi) * 1.4) for i in range(n + 1)]
    red, dark, post = '#d9302a', '#a81f1f', '#b8262a'
    for i in range(n):
        (xa, ya), (xb, yb) = pts[i], pts[i + 1]
        L = math.hypot(xb - xa, yb - ya); a = math.atan2(yb - ya, xb - xa)
        m.part('BoxGeometry', '#c8402e' if i % 2 else red, ((xa + xb) / 2, (ya + yb) / 2, 0), (0, 0, a), width=L + .02, height=.2, depth=2)
        for s in (-1, 1):
            m.part('BoxGeometry', red, ((xa + xb) / 2, (ya + yb) / 2 + .62, s * .95), (0, 0, a), width=L + .02, height=.1, depth=.12)   # the handrail
            m.part('BoxGeometry', dark, ((xa + xb) / 2, (ya + yb) / 2 + .25, s * .95), (0, 0, a), width=L + .02, height=.06, depth=.08)
    for i in range(0, n + 1, 2):
        x, y = pts[i]
        for s in (-1, 1):
            m.part('BoxGeometry', post, (x, y + .35, s * .95), width=.12, height=.7, depth=.12)   # balusters
            if i % 4 == 0: m.part('CylinderGeometry', '#7a1a1a', (x, y - .55, s * .85), radiusTop=.08, radiusBottom=.08, height=1.1, radialSegments=8)   # piles into the lake
    # Ngoc Son's gate (Dac Nguyet lau) on the shore end: plastered walls, a curled roof, a dark doorway facing the bridge
    B(m, 2.4, 2.4, 2.4, '#f2e6c8', (8.2, 1.2, 0))
    arch_door(m, .9, 1.6, '#3a2a22', (7.0, 0, 0), -math.pi / 2)
    B(m, 2.6, .14, 2.6, '#c9a24a', (8.2, 2.45, 0))
    viet_roof(m, 2.2, 2.2, .9, '#4a6a4a', (8.2, 2.5, 0), curl=.35, over=.35, ridge_color='#3a5a3a')
    m.part('SphereGeometry', '#ffd23f', (8.2, 3.55, 0), radius=.14, widthSegments=10, heightSegments=8)

def hand_vanmieu(m, sp):
    # Khue Van Cac (Van Mieu): four square brick pillars below, a red wooden pavilion above with a round sun window on each
    # side, two curled tiled roofs; on its stone terrace (7 x 5)
    B(m, 7, .4, 5, '#b9ab8e', (0, .2, 0))
    for x in (-1.9, 1.9):
        for z in (-1.3, 1.3):
            B(m, 1.0, 3.2, 1.0, '#c9b48a', (x, 2.0, z))
            B(m, 1.15, .18, 1.15, '#a8956a', (x, 3.6, z))
    B(m, 4.8, .3, 3.6, '#a8956a', (0, 3.3, 0))   # the lower floor
    viet_roof(m, 7.0, 5.0, .8, '#6a4a2a', (0, 3.45, 0), curl=.45, over=.5)   # (as wide as the code shape's lower roof)
    # the upper pavilion with its sun windows
    B(m, 3.4, 2.0, 2.6, '#c0392b', (0, 4.95, 0))
    for zz, a in ((1.31, 0), (-1.31, math.pi)):
        m.part('TorusGeometry', '#ffd23f', (0, 4.95, zz), (0, a, 0), radius=.62, tube=.12)
        for k in range(8):   # the sun's rays
            b = k / 8 * TAU
            m.part('BoxGeometry', '#ffd23f', (math.cos(b) * .32, 4.95 + math.sin(b) * .32, zz), (0, 0, b), width=.5, height=.07, depth=.04)
    for xx in (-1.71, 1.71):
        m.part('TorusGeometry', '#ffd23f', (xx, 4.95, 0), (0, math.pi / 2, 0), radius=.5, tube=.1)
    for x in (-1.6, 1.6):
        for z in (-1.2, 1.2): C(m, .1, .1, 2.0, '#7a1e1e', (x, 4.95, z), seg=8)
    viet_roof(m, 3.8, 3.0, 1.35, '#6a4a2a', (0, 5.95, 0), curl=.5, over=.45, ridge_color='#5a3a1a')
    m.part('SphereGeometry', '#ffd23f', (0, 7.45, 0), radius=.13, widthSegments=10, heightSegments=8)

def hand_onepillar(m, sp):
    # Chua Mot Cot: a small square wooden shrine on one stone pillar, like a lotus rising from the water; a curled roof with
    # two dragons on the ridge reaching for the moon (a gold pearl). The pond is the code's own (put beside it).
    C(m, .27, .32, 1.8, '#cfc3a6', (0, 1.0, 0), seg=16)
    for k in range(8):   # the lotus petals under the floor
        a = k / 8 * TAU
        m.part('BoxGeometry', '#9a6a43', (math.sin(a) * .55, 1.75, math.cos(a) * .55), (-.6 * math.cos(a), a, .6 * math.sin(a) * 0), width=.4, height=.08, depth=.7)
    B(m, 1.95, .16, 1.95, '#8a5a3b', (0, 1.95, 0))
    for x in (-.8, .8):   # the railing round the floor
        for z in (-.8, .8): C(m, .05, .05, .45, '#7a3a24', (x, 2.25, z), seg=6)
    for a in (0, math.pi / 2, math.pi, -math.pi / 2):
        m.part('BoxGeometry', '#7a3a24', (math.sin(a) * .85, 2.45, math.cos(a) * .85), (0, a, 0), width=1.7, height=.06, depth=.06)
    B(m, 1.3, .95, 1.3, '#a24e3a', (0, 2.5, 0))
    for a in (0, math.pi / 2, math.pi, -math.pi / 2):
        m.part('BoxGeometry', '#5a2a1a', (math.sin(a) * .66, 2.45, math.cos(a) * .66), (0, a, 0), width=.7, height=.65, depth=.03)   # the doors
    viet_roof(m, 1.3, 1.3, .62, '#5a4a3a', (0, 2.98, 0), curl=.45, over=.4, ridge_color='#4a3a2a')
    for s in (-1, 1):   # two dragons on the ridge, curling up towards the moon pearl between them
        for k in range(8):
            t = k / 7; m.part('SphereGeometry', '#c9a24a' if k % 2 else '#d9b44a', (s * (.62 - t * .5), 3.66 + math.sin(t * math.pi) * .14 + t * .06, 0), radius=.06 - t * .025, widthSegments=6, heightSegments=5)
        m.part('ConeGeometry', '#c9a24a', (s * .66, 3.74, 0), (0, 0, s * .7), radius=.05, height=.18, radialSegments=5)   # the tail flick
    m.part('SphereGeometry', '#ffd23f', (0, 3.82, 0), radius=.09, widthSegments=10, heightSegments=8)

def prism(m, w, h, d, color, pos, rot_y=0):
    """a gable (pediment): a triangle w wide and h high, d deep, its base at pos"""
    x, y, z = w / 2, h, d / 2
    v = [(-x, 0, -z), (x, 0, -z), (0, y, -z), (-x, 0, z), (x, 0, z), (0, y, z)]
    f = [[0, 2, 1], [3, 4, 5], [0, 3, 5, 2], [1, 2, 5, 4], [0, 1, 4, 3]]
    m.add((v, f), color, Matrix.Translation(pos) @ Matrix.Rotation(rot_y, 4, 'Y'))

def hand_benthanh(m, sp):
    # Cho Ben Thanh: the long cream market hall under its red-tiled hipped roof, pilasters and arched windows along it,
    # corner pavilions at both ends, and the south gate: a pedimented entrance of three arches under the famous clock tower
    # (the front faces -x, the street; the hall is the code shape's 3 x 10)
    cream, light, band, tile, dark = '#f2e6c2', '#fbf3dc', '#d9c9a0', '#b4523a', '#5a3a2a'
    B(m, 3.0, 4.0, 9.0, cream, (0, 2.0, 0)); B(m, 3.1, .5, 9.1, band, (0, .25, 0)); B(m, 3.2, .22, 9.2, light, (0, 4.0, 0))
    m.part('ConeGeometry', tile, (0, 4.75, 0), (0, math.pi / 4, 0), (1.75, 1.3, 4.7), radius=1.414, height=1.3, radialSegments=4, hip=True)
    for zs in (-1, 1):   # the corner pavilions, a little taller, with their own small hipped roofs
        B(m, 3.2, 4.5, 1.1, cream, (0, 2.25, zs * 4.45)); B(m, 3.35, .22, 1.25, light, (0, 4.5, zs * 4.45))
        m.part('ConeGeometry', tile, (0, 5.05, zs * 4.45), (0, math.pi / 4, 0), (1.8, .8, .75), radius=1.414, height=1.1, radialSegments=4, hip=True)
        arch_door(m, .6, 1.5, dark, (-1.61, 1.6, zs * 4.45), -math.pi / 2)
    for k in range(-6, 7):   # pilasters and arched windows along the street side and the back
        z = k * .62
        if abs(z) < 2.0 or abs(z) > 3.8: continue
        for sx in (-1, 1):
            B(m, .12, 3.4, .16, light, (sx * 1.53, 2.2, z - .31))
            arch_door(m, .32, 1.0, dark, (sx * 1.51, 2.4, z), -sx * math.pi / 2)
            arch_door(m, .32, .5, '#8a6a4a', (sx * 1.51, .9, z), -sx * math.pi / 2)
    # the south gate: a deeper block with three tall arches between columns, a pediment over it
    B(m, .7, 5.0, 3.8, cream, (-1.55, 2.5, 0)); B(m, .85, .25, 4.0, light, (-1.55, 5.0, 0))
    prism(m, 4.0, .9, .6, light, (-1.6, 5.12, 0), math.pi / 2)
    for z in (-1.25, 0, 1.25):
        arch_door(m, .9, 2.6, dark, (-1.91, .2, z), -math.pi / 2)
        m.part('TorusGeometry', '#d8b86a', (-1.92, 2.35, z), (0, math.pi / 2, 0), radius=.47, tube=.06, arc=math.pi)
    for z in (-1.85, -.62, .62, 1.85): C(m, .12, .14, 4.4, light, (-1.95, 2.4, z), seg=10)
    # the clock tower over the gate: a square stage with a clock on each face, a balcony cornice, the lantern and its roof
    B(m, 2.2, 3.2, 2.2, cream, (0, 6.6, 0)); B(m, 2.5, .25, 2.5, light, (0, 8.25, 0))
    for k in range(4):   # corner pilasters
        a = k * math.pi / 2 + math.pi / 4; B(m, .25, 3.2, .25, light, (math.cos(a) * 1.5, 6.6, math.sin(a) * 1.5))
    for a in (-math.pi / 2, math.pi / 2, 0, math.pi):
        dx, dz = math.sin(a) * 1.12, math.cos(a) * 1.12
        R = Matrix.Translation((dx, 7.0, dz)) @ Matrix.Rotation(a, 4, 'Y')
        m.add(g_cyl(.72, .72, .1, 24), '#ffffff', R @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        m.add(g_torus(.74, .07, 6, 24), '#2b2238', R @ Matrix.Translation((0, 0, .06)))
        for h in range(12):   # the hour marks
            b = h / 12 * TAU; m.add(g_box(.05, .1, .03), '#2b2238', R @ Matrix.Translation((math.sin(b) * .58, math.cos(b) * .58, .07)) @ Matrix.Rotation(-b, 4, 'Z'))
        m.add(g_box(.06, .5, .04), '#333333', R @ Matrix.Translation((0, .2, .09)))
        m.add(g_box(.36, .06, .04), '#333333', R @ Matrix.Translation((.14, 0, .09)))
    B(m, 1.5, 1.0, 1.5, cream, (0, 8.85, 0))
    for a in (-math.pi / 2, math.pi / 2, 0, math.pi): arch_door(m, .5, .75, dark, (math.sin(a) * .76, 8.45, math.cos(a) * .76), a)
    m.part('ConeGeometry', tile, (0, 9.8, 0), (0, math.pi / 4, 0), radius=1.3, height=1.0, radialSegments=4)
    C(m, .04, .04, .7, '#c9a24a', (0, 10.6, 0), seg=6)

def opera_shell(m, x0, z0, y0, W, H, L, face, white='#ffffff', under='#e2dbcc', glass='#7d8f96', lean=.16, nu=12, nt=8):
    """one Opera House shell: a pointed-arch vault (the ridge on top, the two feet on the podium) that grows from its back
    (nested inside the shell behind it) to its open mouth, the tip leaning out over a bronze glass wall.
    x0: where the mouth stands along the hall, face +1/-1: which way it opens (along x), W/H/L: mouth width, height, length."""
    def pt(t, u, inset=0.):
        a = W / 2 * (.62 + .38 * t ** .7) - inset; b = H * (.3 + .7 * t ** 1.3) - inset * 1.4   # (broad all along: the back nests in the shell behind)
        y = max(0., b) * (1 - abs(u) ** 1.45)
        ax = -L * (1 - t) + lean * H * t ** 2 * (1 - abs(u)) ** 1.6
        return (x0 + face * ax, y0 + y, z0 + a * u)
    us = [-1 + 2 * i / nu for i in range(nu + 1)]; ts = [j / nt for j in range(nt + 1)]
    for inset, col, flip in ((0., white, False), (.14, under, True)):   # the tiled outside, the ribbed inside
        v = [pt(t, u, inset) for t in ts for u in us]; f = []
        for j in range(nt):
            for i in range(nu):
                q = [j * (nu + 1) + i, j * (nu + 1) + i + 1, (j + 1) * (nu + 1) + i + 1, (j + 1) * (nu + 1) + i]
                f.append(q[::-1] if (flip != (face < 0)) else q)
        m.add((v, f), col)
    # the rims: the mouth's edge (a cream band) and the feet, joining outside and inside
    for t, col in ((1., '#efe8d8'), (0., under)):
        o = [pt(t, u) for u in us]; n = [pt(t, u, .14) for u in us]; v = o + n; f = []
        for i in range(nu): q = [i, i + 1, nu + 1 + i + 1, nu + 1 + i]; f.append(q if (t == 1.) != (face < 0) else q[::-1])
        m.add((v, f), col)
    # the glass wall in the mouth, set back a little, with bronze mullions
    gi = .97; v = [(x0 + face * -.2, y0, z0)] + [(x0 + face * -.2, y0 + H * gi * (1 - abs(u) ** 1.45), z0 + W / 2 * gi * u) for u in us]
    f = [[0, i + 1, i + 2] if face > 0 else [0, i + 2, i + 1] for i in range(nu)]
    m.add((v, f), glass); m.add((v, [q[::-1] for q in f]), glass)
    for k in range(-3, 4):
        u = k / 4; h = H * gi * .72 * (1 - abs(u) ** 1.45)
        if h > .3: m.part('BoxGeometry', '#5a4a3a', (x0 + face * -.18, y0 + h / 2, z0 + W / 2 * gi * u), width=.05, height=h, depth=.05)

def hand_opera(m, sp):
    # The Sydney Opera House, our way: on its broad granite podium, two halls side by side (the Concert Hall, the larger,
    # and the Joan Sutherland Theatre), each a row of nested white shells rising to the tallest and opening onto bronze
    # glass walls, one shell turned back over the foyer, the little Bennelong restaurant shells by the grand stairs.
    # In the code shape's frame: the podium 16 x 10 (x along the halls), its top at 1.6.
    gran, edge, dark = '#c9a88a', '#b8977a', '#9a7d66'
    B(m, 16, 1.6, 10, gran, (0, .8, 0))
    B(m, 16.2, .12, 10.2, '#d9c2a6', (0, 1.6, 0))                       # the terrace paving
    B(m, 16.05, .3, 10.05, dark, (0, .45, 0))                           # the dark band round the podium
    B(m, 16, .3, 2, '#d9c9aa', (0, .15, 6))                             # the promenade by the water
    for i in range(6):   # the grand stairs at the land end, the full width of the halls
        B(m, .42, .27 * (i + 1), 7.0, edge if i % 2 else gran, (-8.0 - .38 * (5 - i) + 1.9, .135 * (i + 1), -.6))
    for z in (-4.9, 4.9):   # the terrace edge
        B(m, 15.6, .35, .12, '#e2d4bc', (0, 1.83, z))
    y = 1.66
    # the Concert Hall (z > 0): shells opening towards +x, the tallest at the back, one turned back over the foyer
    for (x, W, H, L) in ((-1.6, 4.2, 5.8, 5.2), (1.0, 3.8, 4.8, 4.4), (3.2, 3.3, 3.8, 3.6), (5.0, 2.7, 2.8, 2.8)):
        opera_shell(m, x, 2.2, y, W, H, L, 1)
    opera_shell(m, -5.0, 2.2, y, 3.6, 4.0, 3.0, -1)
    # the Joan Sutherland Theatre (z < 0), a little smaller
    for (x, W, H, L) in ((-2.0, 3.6, 4.9, 4.6), (.4, 3.2, 4.0, 3.8), (2.5, 2.8, 3.2, 3.0), (4.2, 2.3, 2.4, 2.4)):
        opera_shell(m, x, -2.4, y, W, H, L, 1)
    opera_shell(m, -5.2, -2.4, y, 3.0, 3.4, 2.6, -1)
    # the Bennelong restaurant: two small shells back to back by the stairs
    opera_shell(m, -6.9, -.1, y, 1.6, 1.9, 1.4, -1); opera_shell(m, -5.9, -.1, y, 1.4, 1.5, 1.1, 1)
    # the foyer under the shells' backs, dark glass
    B(m, 7.0, .7, 3.0, '#7d8a8e', (-1.0, 2.0, 2.2)); B(m, 6.4, .6, 2.6, '#7d8a8e', (-1.4, 1.95, -2.4))   # (low, under the shells)

def hand_harbour(m, sp):
    # The Sydney Harbour Bridge: the road deck, the great steel through-arch (two chords with criss-crossed truss), the
    # hangers down to the deck and the four granite pylons. Same length, width and deck as the code shape (+x along).
    bx = sp['box']; L = (bx['max'][0] - 1.7) * 2   # the code shape: the pylons stand at len/2 + .6, 1.1 wide each way
    R = L / 2 - 1; steel = '#8d979c'; dark = '#6f787d'
    w = (bx['max'][2] - 1.7) * 2   # B.w (pylons stand at hw + .6 with half width 1.1 -> max z = B.w/2 + 1.7)
    hw = w / 2
    B(m, L + 2, .5, w, '#7d858a', (0, -.25, 0))
    B(m, L + 2, .06, w - 2.2, '#b4b9bc', (0, .03, 0))
    for s in (-1, 1):
        B(m, L + 2, .1, 1, '#d9d4c8', (0, .07, s * (hw - .5)))
        B(m, L + 2, .9, .12, steel, (0, .45, s * hw))
    for i in range(7): B(m, 1.6, .08, .14, '#f6f1e4', (-L / 2 + 3 + i * (L - 6) / 6, .09, 0))
    for f in (-.32, .32): C(m, .5, .7, 12, '#9a948a', (f * L, -6, 0), seg=6)
    n = 24
    def arch_y(x, top, base): return base + top * max(0, 1 - (x / R) ** 2) ** .5
    for s in (-1, 1):
        z = s * (hw - .2)
        up = [(-R + i / n * 2 * R) for i in range(n + 1)]
        for i in range(n):
            xa, xb = up[i], up[i + 1]
            for (top, base, th) in ((R * .62, -1.2, .5), (R * .62 - 1.6, -1.2, .32)):
                ya, yb = arch_y(xa, top, base), arch_y(xb, top, base)
                Ls = math.hypot(xb - xa, yb - ya)
                m.part('BoxGeometry', steel if th > .4 else dark, ((xa + xb) / 2, (ya + yb) / 2, z), (0, 0, math.atan2(yb - ya, xb - xa)), width=Ls + .05, height=th, depth=.45)
            # the truss between the two chords
            ya, yb = arch_y(xa, R * .62, -1.2), arch_y(xb, R * .62 - 1.6, -1.2)
            Ls = math.hypot(xb - xa, yb - ya)
            m.part('BoxGeometry', dark, ((xa + xb) / 2, (ya + yb) / 2, z), (0, 0, math.atan2(yb - ya, xb - xa)), width=Ls, height=.12, depth=.14)
            # hangers to the deck
            yl = arch_y(xa, R * .62 - 1.6, -1.2)
            if yl > 1.2 and i % 2 == 0: m.part('BoxGeometry', dark, (xa, yl / 2 + .4, z), width=.1, height=yl - .8, depth=.1)
        # the four pylons
        for ex in (-1, 1):
            B(m, 2.2, 7, 2.2, '#d8cdb6', (ex * (L / 2 + .6), 2.2, s * (hw + .6)))
            B(m, 2.6, .5, 2.6, '#c8bca2', (ex * (L / 2 + .6), 5.9, s * (hw + .6)))
            B(m, 1.6, .9, 1.6, '#d8cdb6', (ex * (L / 2 + .6), 6.6, s * (hw + .6)))
    for i in range(3, n - 2, 3):   # the cross-bracing over the road at the arch's top
        x = -R + i / n * 2 * R; y = arch_y(x, R * .62, -1.2)
        if y > 5: m.part('BoxGeometry', dark, (x, y - .2, 0), width=.2, height=.2, depth=w - .4)


# ---------- festival and food props (v1.08e): not code shapes in the valley but pieces merged into the festival's patches
# (js/festivals.ts); each stands on its own base at the origin, +z the front, at the size of the code piece it replaces
def S(m, r, color, pos, scl=(1, 1, 1), w=8, h=6): m.part('SphereGeometry', color, pos, (0, 0, 0), scl, radius=r, widthSegments=w, heightSegments=h)
def blossom_pot(m, flower, centre, tall):
    C(m, .34, .26, .4, '#c62828', (0, .2, 0), seg=12); C(m, .36, .36, .06, '#e8b83a', (0, .4, 0), seg=12)   # the red pot, a gold rim
    C(m, .3, .3, .02, '#5a3a24', (0, .41, 0), seg=10)
    trunk = [(0, .4, 0), (.05, .75, .02), (-.04, 1.05, 0), (.03, tall, -.02)]
    for (a, b) in zip(trunk, trunk[1:]):
        d = Vector(b) - Vector(a); L = d.length; mid = (Vector(a) + Vector(b)) / 2
        m.add(g_cyl(.035, .055, L, 6, smooth=False), '#6a4a3a', Matrix.Translation(mid) @ Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4())
    for k in range(5):   # branches with clusters of flowers
        a = k * 2.4; bx, bz = math.cos(a) * .32, math.sin(a) * .32; by = tall - .25 + (k % 3) * .14
        d = Vector((bx, by - 1.0, bz)); mid = Vector((bx / 2, (by + 1.0) / 2, bz / 2))
        m.add(g_cyl(.018, .03, d.length, 5, smooth=False), '#6a4a3a', Matrix.Translation(mid) @ Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4())
        for j in range(4):
            b = a + j * 1.6; r = .07 + (j % 2) * .05
            S(m, .085, flower if (j + k) % 3 else centre, (bx + math.cos(b) * r, by + .04 + (j % 2) * .06, bz + math.sin(b) * r), w=6, h=5)
def prop_peach(m, sp): blossom_pot(m, '#ffb3c8', '#ffffff', 1.4)        # hoa dao: pink blossom in a red pot (Tet in the north)
def prop_mai(m, sp): blossom_pot(m, '#ffd23f', '#ffe9a0', 1.0)          # hoa mai: yellow apricot blossom (Tet in the south)
def prop_banhchung(m, sp):
    # banh chung: two square rice cakes wrapped in green dong leaves, tied with bamboo string, the top one a little turned
    for k, (y, a) in enumerate(((.0, 0), (.13, .35))):
        M0 = Matrix.Translation((0, y + .065, 0)) @ Matrix.Rotation(a, 4, 'Y')
        m.add(g_box(.26, .12, .26), '#3f8a3a', M0)
        m.add(g_box(.27, .02, .02), '#d8c48a', M0 @ Matrix.Translation((0, .055, 0)))
        m.add(g_box(.02, .02, .27), '#d8c48a', M0 @ Matrix.Translation((0, .055, 0)))
        for s in (-1, 1): m.add(g_box(.272, .11, .015), '#d8c48a', M0 @ Matrix.Translation((0, 0, s * .065)))
def prop_mamnguqua(m, sp):
    # mam ngu qua: the five-fruit tray of Tet on its red-lacquer stand: a hand of green bananas, a pomelo, red dragon fruit,
    # mandarins and a bunch of grapes
    C(m, .1, .14, .12, '#a8261e', (0, .06, 0), seg=10); C(m, .3, .26, .05, '#c62828', (0, .14, 0), seg=16); m.part('TorusGeometry', '#e8b83a', (0, .165, 0), (math.pi / 2, 0, 0), radius=.29, tube=.015)
    for k in range(5):   # the bananas fanned behind
        a = -.9 + k * .45
        m.part('CapsuleGeometry', '#7fbf3a', (math.sin(a) * .12, .3 + abs(k - 2) * -.01, -.12 + math.cos(a) * .03), (.5, a, 0), radius=.035, length=.22, capSegments=2, radialSegments=6)
    S(m, .13, '#c8e06a', (0, .3, .02), (1, .95, 1), w=10, h=8)      # the pomelo in the middle
    S(m, .07, '#e83a6a', (.17, .24, .08), (1, 1.2, 1)); C(m, .0, .03, .06, '#7fbf3a', (.17, .33, .08), seg=4)   # dragon fruit
    for k in range(3): S(m, .055, '#ff9a2a', (-.18 + k * .06, .22, .14 - k * .03))
    for k in range(6): S(m, .03, '#7a3aa0', (.1 + (k % 2) * .04, .2 + (k // 2) * .03, -.02 + (k // 2) * .02), w=6, h=4)
def prop_xmastree(m, sp):
    # the Christmas tree: three soft tiers of fir, a wooden tub, red and gold baubles (its star and lights stay the code's
    # glowing parts, so they light up at night)
    C(m, .2, .16, .35, '#a8261e', (0, .17, 0), seg=10); C(m, .1, .12, .3, '#6a4a3a', (0, .45, 0), seg=6)
    for k in range(3):
        r, y = .9 - k * .25, .8 + k * .55
        m.part('ConeGeometry', '#2f7a3a', (0, y, 0), radius=r, height=.95, radialSegments=10)
        for j in range(8):   # the tier's soft scalloped edge
            a = j / 8 * TAU + k * .3
            S(m, .14 - k * .03, '#3a8a44', (math.cos(a) * r * .86, y - .4, math.sin(a) * r * .86), (1, .6, 1), w=6, h=4)
        for j in range(4): a = j * 1.7 + k; S(m, .06, '#e8433a' if j % 2 else '#ffd23f', (math.cos(a) * r * .7, y - .15, math.sin(a) * r * .7), w=6, h=5)
    for k in range(5): m.part('TorusGeometry', '#ffd23f', (0, .7 + k * .32, 0), (math.pi / 2, 0, 0), radius=.75 - k * .12, tube=.015)   # tinsel
def prop_eggs(m, sp):
    # Easter eggs in a little nest of straw: four painted eggs with stripes and dots
    for k, c in enumerate(('#ff9ab8', '#7fd6d0', '#ffd23f', '#c6a8f0')):
        x = (k - 1.5) * .35
        C(m, .17, .15, .06, '#d8b46a', (x, .03, 0), seg=10)
        S(m, .2, c, (x, .25, 0), (1, 1.35, 1), w=10, h=7)
        m.part('TorusGeometry', '#ffffff', (x, .25, 0), (math.pi / 2, 0, 0), radius=.2, tube=.02)
def prop_starlantern(m, sp):
    # the Mid-Autumn star lantern (den ong sao): a five-pointed star of bamboo and red cellophane, a gold tassel and a candle
    # glow inside; centred on its middle (the code's pole holds it up)
    pts = []
    for k in range(10):
        a = math.pi / 2 + k * math.pi / 5; r = .36 if k % 2 == 0 else .15
        pts.append((math.cos(a) * r, math.sin(a) * r))
    v = [(x, y, .07) for x, y in pts] + [(x, y, -.07) for x, y in pts] + [(0, 0, .12), (0, 0, -.12)]
    f = []
    for k in range(10):
        j = (k + 1) % 10
        f.append([20, k, j]); f.append([21, 10 + j, 10 + k]); f.append([k, 10 + k, 10 + j, j])
    m.add((v, f), '#ff4a3a')
    for k in range(5):   # the bamboo frame along each point
        a = math.pi / 2 + k * 2 * math.pi / 5
        m.part('CylinderGeometry', '#d8b46a', (math.cos(a) * .18, math.sin(a) * .18, .075), (0, 0, a - math.pi / 2), radiusTop=.01, radiusBottom=.01, height=.36, radialSegments=4)
    S(m, .07, '#ffe9a0', (0, 0, 0)); m.part('CylinderGeometry', '#ffd23f', (0, -.47, 0), radiusTop=.01, radiusBottom=.04, height=.2, radialSegments=6)
def prop_lantern(m, sp):
    # a round silk lantern (den long): red silk over ribs, gold caps top and bottom, a tassel; centred on its middle
    S(m, .3, '#ff6a3a', (0, 0, 0), (1, 1.2, 1), w=12, h=8)
    for k in range(8):
        a = k / 8 * TAU; m.part('TorusGeometry', '#c8341e', (0, 0, 0), (0, a, 0), (1, 1.2, 1), radius=.3, tube=.01, tubularSegments=16, radialSegments=3)
    C(m, .12, .12, .06, '#ffd23f', (0, .38, 0), seg=10); C(m, .1, .1, .05, '#ffd23f', (0, -.37, 0), seg=10)
    m.part('CylinderGeometry', '#ffd23f', (0, -.5, 0), radiusTop=.01, radiusBottom=.035, height=.2, radialSegments=6)
PROPS = {'pr-peach': (prop_peach, 1.9), 'pr-mai': (prop_mai, 1.4), 'pr-banhchung': (prop_banhchung, .3), 'pr-mamnguqua': (prop_mamnguqua, .6),
         'pr-xmastree': (prop_xmastree, 2.6), 'pr-eggs': (prop_eggs, 1.4), 'pr-starlantern': (prop_starlantern, .8), 'pr-lantern': (prop_lantern, .8)}
for n, (fn, size) in PROPS.items():
    if n not in SPECS: SPECS[n] = {'box': {'min': [-size / 2, 0, -size / 2], 'max': [size / 2, size, size / 2]}, 'parts': [], 'prop': True}


def hand_cathedral(m, sp):
    # Nha tho Duc Ba (Saigon's Notre-Dame): red brick nave, two square bell towers with slate spires and crosses, a rose
    # window and three arched doors on the front (+z), buttresses down the sides
    brick, trim, slate, dark = '#c0553a', '#e8d6b8', '#5d6b75', '#4a2e24'
    B(m, 6.0, 4.2, 6.6, brick, (0, 2.1, -1.2)); B(m, 6.2, .2, 6.8, trim, (0, 4.2, -1.2))
    m.part('ConeGeometry', slate, (0, 5.15, -1.2), (0, math.pi / 4, 0), (3.2, 1.9, 3.45), radius=1.414, height=1.0, radialSegments=4, hip=True)
    for z in (-3.6, -2.0, -.4, 1.2):   # buttresses and tall windows down each side
        for sx in (-1, 1):
            B(m, .35, 3.4, .45, brick, (sx * 3.1, 1.7, z)); arch_door(m, .5, 1.6, dark, (sx * 3.01, 1.6, z + .8), sx * math.pi / 2)
    for sx in (-1, 1):   # the two bell towers
        x = sx * 2.1
        B(m, 1.9, 7.2, 1.9, brick, (x, 3.6, 2.6))
        for y in (2.4, 4.6, 6.8): B(m, 2.0, .16, 2.0, trim, (x, y, 2.6))
        for y in (3.2, 5.4): arch_door(m, .5, 1.1, dark, (x, y, 3.56), 0)
        B(m, 1.6, 1.0, 1.6, trim, (x, 7.7, 2.6))
        arch_door(m, .55, .8, dark, (x, 7.3, 3.41), 0)
        C(m, .0, 1.05, 2.6, slate, (x, 9.5, 2.6), seg=8)
        for k in range(4): a = k * math.pi / 2 + math.pi / 4; C(m, 0, .12, .5, slate, (x + math.cos(a) * .85, 8.45, 2.6 + math.sin(a) * .85), seg=6)   # pinnacles
        B(m, .06, .7, .06, '#e8c03a', (x, 11.0 - .3, 2.6)); B(m, .4, .06, .06, '#e8c03a', (x, 10.85, 2.6))
    # the front between the towers: a gable, the rose window, three doors
    B(m, 2.4, 4.6, .5, brick, (0, 2.3, 3.0)); prism(m, 2.6, 1.2, .5, brick, (0, 4.6, 3.0))
    m.part('TorusGeometry', trim, (0, 3.6, 3.27), radius=.55, tube=.08); m.add(g_cyl(.5, .5, .06, 16), '#5a7a9a', Matrix.Translation((0, 3.6, 3.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for k in range(8): b = k / 8 * TAU; m.part('BoxGeometry', trim, (math.cos(b) * .25, 3.6 + math.sin(b) * .25, 3.3), (0, 0, b), width=.5, height=.04, depth=.03)
    arch_door(m, .9, 2.0, dark, (0, .1, 3.27), 0)
    for sx in (-1, 1): arch_door(m, .6, 1.5, dark, (sx * 2.1, .1, 3.56), 0)
    B(m, 6.4, .25, 7.4, '#cfc6b4', (0, .12, -.6))   # the paved forecourt step

def hand_postoffice(m, sp):
    # Saigon Central Post Office: the long yellow French hall with white pilasters and arched windows, a big round-arched
    # front with the clock, and the iron-and-glass barrel roof behind
    yel, white, dark, green = '#f2cf6a', '#f6f1e2', '#6a4a2a', '#5f8a7a'
    B(m, 8.0, 4.2, 4.0, yel, (0, 2.1, 0)); B(m, 8.2, .3, 4.2, white, (0, .15, 0)); B(m, 8.3, .25, 4.3, white, (0, 4.3, 0))
    for k in range(9):   # pilasters and arched windows
        x = -3.6 + k * .9
        B(m, .18, 3.8, .12, white, (x, 2.1, 2.04))
        if k < 8 and abs(x + .45) > .9: arch_door(m, .45, 1.5, dark, (x + .45, 1.0, 2.03), 0); arch_door(m, .35, .6, '#7fa9b8', (x + .45, 2.9, 2.03), 0)
    # the central bay: taller, with the great arch, the clock and a pediment
    B(m, 2.4, 5.4, .5, yel, (0, 2.7, 2.1)); B(m, 2.6, .25, .6, white, (0, 5.4, 2.1))
    arch_door(m, 1.4, 3.0, dark, (0, .3, 2.36), 0); m.part('TorusGeometry', white, (0, 2.6, 2.37), radius=.75, tube=.1, arc=math.pi)
    R = Matrix.Translation((0, 4.4, 2.37)); m.add(g_cyl(.5, .5, .06, 20), '#fffaf0', R @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    m.add(g_torus(.52, .05, 6, 20), '#2b2238', R); m.add(g_box(.04, .38, .03), '#333333', R @ Matrix.Translation((0, .15, .05))); m.add(g_box(.28, .04, .03), '#333333', R @ Matrix.Translation((.1, 0, .05)))
    prism(m, 2.8, .8, .5, white, (0, 5.5, 2.1))
    # the barrel roof (green iron) over the hall, with glass panes along it
    m.add(g_cyl(1.9, 1.9, 7.6, 16, thetaStart=-math.pi / 2, thetaLength=math.pi, smooth=False), green, Matrix.Translation((0, 4.4, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z'))
    for k in range(7): m.part('TorusGeometry', '#3f6a5a', (-3.3 + k * 1.1, 4.4, 0), (0, math.pi / 2, 0), radius=1.92, tube=.05, arc=math.pi)
    for sx in (-1, 1): B(m, .9, 5.0, .9, yel, (sx * 3.8, 2.5, 1.6)); m.part('ConeGeometry', green, (sx * 3.8, 5.4, 1.6), (0, math.pi / 4, 0), radius=.75, height=.8, radialSegments=4)

def hand_flinders(m, sp):
    # Flinders Street Station: the long mustard-and-cream building with its arched entrance under the green copper dome,
    # the row of clocks over the doors, and the corner clock tower
    must, cream, copper, dark = '#e8b44a', '#f4ead2', '#5fa07a', '#5a3a2a'
    B(m, 9.0, 3.8, 4.0, must, (0, 1.9, 0)); B(m, 9.2, .3, 4.2, cream, (0, 3.9, 0)); B(m, 9.1, .35, 4.1, '#c99a3a', (0, .17, 0))
    for k in range(10):   # cream bands and arched windows along the front
        x = -4.05 + k * .9
        if 1.4 < abs(x) < 3.4: arch_door(m, .45, 1.2, dark, (x, 1.9, 2.03), 0); B(m, .14, 3.6, .1, cream, (x - .45, 1.9, 2.04))
    B(m, 9.05, .14, 4.05, cream, (0, 1.5, 0))
    # the entrance: the great arch, the row of clocks above, the dome on its drum
    B(m, 3.0, 4.6, .6, must, (0, 2.3, 2.0)); arch_door(m, 2.0, 2.8, dark, (0, .2, 2.31), 0)
    m.part('TorusGeometry', cream, (0, 2.2, 2.32), radius=1.05, tube=.1, arc=math.pi)
    for k in range(5):
        R = Matrix.Translation((-1.0 + k * .5, 3.4, 2.32)); m.add(g_cyl(.19, .19, .05, 14), '#fffaf0', R @ Matrix.Rotation(math.pi / 2, 4, 'X')); m.add(g_torus(.2, .03, 4, 14), '#2b2238', R)
    C(m, 1.8, 1.8, 1.4, must, (0, 4.75, .3), seg=20); C(m, 1.9, 1.9, .15, cream, (0, 5.5, .3), seg=20)
    for k in range(8): a = k / 8 * TAU; arch_door(m, .35, .7, dark, (math.sin(a) * 1.81, 4.25, .3 + math.cos(a) * 1.81), a)
    m.part('SphereGeometry', copper, (0, 5.55, .3), radius=1.85, widthSegments=16, heightSegments=8, thetaLength=math.pi / 2)
    C(m, .25, .3, .6, copper, (0, 7.6, .3), seg=8); m.part('SphereGeometry', '#e8c03a', (0, 8.0, .3), radius=.14)
    # the clock tower at the corner, and its twin pinnacle
    for sx in (-1, 1):
        x = sx * 4.2
        B(m, 1.2, 5.6, 1.2, must, (x, 2.8, 1.4)); B(m, 1.35, .2, 1.35, cream, (x, 5.6, 1.4))
        m.part('ConeGeometry', copper, (x, 6.35, 1.4), (0, math.pi / 4, 0), radius=.95, height=1.3, radialSegments=4)
        R = Matrix.Translation((x, 4.8, 2.02)); m.add(g_cyl(.35, .35, .05, 14), '#fffaf0', R @ Matrix.Rotation(math.pi / 2, 4, 'X')); m.add(g_torus(.36, .04, 4, 14), '#2b2238', R)

def hand_hue(m, sp):
    # Ngo Mon, the Meridian Gate of Hue's citadel: a massive U-shaped stone base with three gates (the middle one for the
    # king), and on top the Five Phoenix Pavilion with its two-tiered yellow-tiled roofs over red wooden columns
    stone, stone2, red, yellow, dark = '#c9bfae', '#b3a892', '#c62828', '#e8b83a', '#3a2a22'
    B(m, 18, 1.0, 11, '#d9cdb8', (0, .5, 0))   # the plaza (the code shape's own base)
    B(m, 14, 3.2, 4.0, stone, (0, 2.6, -1.2))   # the main wall
    for sx in (-1, 1): B(m, 3.2, 3.2, 5.6, stone, (sx * 5.4, 2.6, 2.6))   # the two arms reaching forward
    B(m, 14.2, .25, 4.2, stone2, (0, 4.3, -1.2)); [B(m, 3.4, .25, 5.8, stone2, (sx * 5.4, 4.3, 2.6)) for sx in (-1, 1)]
    for k in range(14): B(m, .5, .4, .3, stone2, (-6.75 + k * 1.04, 4.6, .82))   # the battlement
    arch_door(m, 1.6, 2.5, dark, (0, 1.0, .81), 0)
    for sx in (-1, 1): arch_door(m, 1.1, 2.0, dark, (sx * 2.6, 1.0, .81), 0)
    # the Five Phoenix Pavilion: a red-columned hall, two curled roofs
    B(m, 9.0, .25, 3.2, '#8a5a3b', (0, 4.55, -1.2))
    for k in range(9):
        for z in (-2.5, .1): C(m, .12, .12, 1.4, red, (-4.0 + k, 5.35, z), seg=8)
    B(m, 8.6, 1.0, 2.4, '#a84a2a', (0, 5.3, -1.2))
    viet_roof(m, 9.4, 3.4, .9, yellow, (0, 6.05, -1.2), curl=.4, over=.5)
    B(m, 6.0, .7, 2.0, red, (0, 6.85, -1.2))
    viet_roof(m, 6.6, 2.6, 1.0, yellow, (0, 7.2, -1.2), curl=.45, over=.45, ridge_color='#c9962a')
    for sx in (-1, 1):   # the small pavilions on the arms
        B(m, 2.0, .9, 2.0, red, (sx * 5.4, 4.9, 3.6)); viet_roof(m, 2.2, 2.2, .8, yellow, (sx * 5.4, 5.35, 3.6), curl=.35, over=.35)


def hand_sydneytower(m, sp):
    # Sydney Tower Eye: a slender gold-and-grey shaft held by cables, the golden turret with its window bands and
    # observation deck, the spire on top (on a round plinth, 20.5 m like the code shape)
    grey, gold, glass = '#d9dcde', '#e8b83a', '#6f8f9e'
    C(m, 2.4, 2.6, .5, '#bfb8aa', (0, .25, 0), seg=20); C(m, 1.6, 2.0, .6, '#cfc8ba', (0, .8, 0), seg=20)
    C(m, .38, .45, 15.2, grey, (0, 8.6, 0), seg=12)
    for k in range(10):   # the cables from the plinth to the turret's foot
        a = k / 10 * TAU; d = Vector((math.cos(a) * -.95, 13.6, math.sin(a) * -.95)); mid = Vector((math.cos(a) * 1.0, 8.0, math.sin(a) * 1.0))
        m.add(g_cyl(.035, .035, d.length, 4, smooth=False), '#9aa4a8', Matrix.Translation(mid) @ Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4())
    C(m, 1.3, 1.0, .6, gold, (0, 15.0, 0), seg=20)
    for k, (r, y, col) in enumerate(((1.65, 15.65, gold), (1.7, 16.15, glass), (1.75, 16.6, gold), (1.7, 17.05, glass), (1.6, 17.5, gold))):
        C(m, r, r, .45, col, (0, y, 0), seg=24)
    C(m, 1.2, 1.6, .5, gold, (0, 17.95, 0), seg=24); C(m, .6, .9, .4, grey, (0, 18.4, 0), seg=16)
    C(m, .06, .12, 2.0, grey, (0, 19.5, 0), seg=6); m.part('SphereGeometry', '#e8433a', (0, 20.5, 0), radius=.1)

def hand_lunapark(m, sp):
    # Luna Park's smiling face entrance: the big round face with wide eyes, rosy cheeks and the open grinning mouth you walk
    # through, framed by two striped towers topped with lights
    skin, pink, red, dark = '#ffd6a5', '#ff9ab0', '#c62828', '#2b2238'
    m.part('SphereGeometry', skin, (0, 3.5, 0), (0, 0, 0), (1, 1, .45), radius=3.3, widthSegments=24, heightSegments=16)
    m.part('TorusGeometry', '#ffd23f', (0, 3.5, 0), (0, 0, 0), (1, 1, 1), radius=3.32, tube=.18, radialSegments=6, tubularSegments=40)   # the halo of lights
    for k in range(16): a = k / 16 * TAU; m.part('SphereGeometry', '#fff4c8', (math.cos(a) * 3.55, 3.5 + math.sin(a) * 3.55, .15), radius=.15)
    for sx in (-1, 1):
        m.part('SphereGeometry', '#ffffff', (sx * 1.1, 4.5, 1.25), (0, 0, 0), (1, 1.25, .4), radius=.62)
        m.part('SphereGeometry', '#3a6ab0', (sx * 1.05, 4.4, 1.48), (0, 0, 0), (1, 1, .4), radius=.32); m.part('SphereGeometry', dark, (sx * 1.03, 4.38, 1.6), (0, 0, 0), (1, 1, .4), radius=.16)
        m.part('TorusGeometry', dark, (sx * 1.1, 5.35, 1.25), (0, 0, 0), (1, .6, 1), radius=.5, tube=.08, arc=math.pi)   # brows
        m.part('SphereGeometry', pink, (sx * 1.8, 3.1, 1.15), (0, 0, 0), (1, .7, .3), radius=.5)
    m.part('SphereGeometry', '#f0b088', (0, 3.6, 1.4), (0, 0, 0), (1, 1, .6), radius=.35)   # the nose
    m.part('TorusGeometry', red, (0, 2.5, 1.35), (0, 0, math.pi), (1, .85, 1), radius=1.6, tube=.3, arc=math.pi)
    B(m, 2.4, 2.4, 1.0, dark, (0, 1.2, 1.3)); [B(m, .32, .5, .2, '#ffffff', (-.85 + k * .34, 2.25, 1.75)) for k in range(6)]   # the mouth door and teeth
    for sx in (-1, 1):
        x = sx * 4.0
        for k in range(6): C(m, .48 - k * .015, .5 - k * .015, 1.0, '#ff7eb8' if k % 2 else '#ffffff', (x, .5 + k, 0), seg=12)
        C(m, .6, .55, .25, '#ffd23f', (x, 6.1, 0), seg=12); m.part('SphereGeometry', '#ffd23f', (x, 6.55, 0), radius=.5, widthSegments=12, heightSegments=8)

def tube(m, pts, radii, colors, seg=10, cap=True, scale=(1, 1)):
    """a smooth tube through pts (three.js frame), radius per point, a colour per point (or one), rings square to the path"""
    pts = [Vector(p) for p in pts]; n = len(pts); v, f, fc = [], [], []
    a = None   # (the ring's frame is carried along the path, so rings never twist)
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        if a is None:
            ref = Vector((0, 1, 0)) if abs(t.y) < .9 else Vector((1, 0, 0)); a = (ref - t * ref.dot(t)).normalized()
        else:
            a = (a - t * a.dot(t)).normalized()
        b2 = t.cross(a)
        for k in range(seg):
            q = k / seg * TAU; v.append(tuple(p + (a * math.cos(q) * scale[0] + b2 * math.sin(q) * scale[1]) * radii[i]))
    groups = {}
    for i in range(n - 1):
        col = colors if isinstance(colors, str) else colors[i]
        for k in range(seg):
            groups.setdefault(col, []).append([i * seg + k, i * seg + (k + 1) % seg, (i + 1) * seg + (k + 1) % seg, (i + 1) * seg + k])
    for col, ff in groups.items(): m.add((v, [q[::-1] for q in ff]), col)
    if cap:
        c0 = colors if isinstance(colors, str) else colors[0]; c1 = colors if isinstance(colors, str) else colors[-1]
        m.add((v, [list(range(seg))]), c0); m.add((v, [list(range(seg * (n - 1), seg * n))[::-1]]), c1)

def hand_banana(m, sp):
    # The Big Banana (Coffs Harbour): a smoothie shop with a striped awning under a giant curved banana: a smooth, gently
    # ridged yellow body with a brown stem and tip
    B(m, 7, 3.4, 6, '#fff3c4', (0, 1.7, 0)); B(m, 7.2, .4, 6.2, '#e8c03a', (0, 3.6, 0)); B(m, 7.1, .4, 6.1, '#d9b45a', (0, .2, 0))
    for x in (-2.4, 0, 2.4): arch_door(m, 1.4, 2.0, '#7fa9b8', (x, .4, 3.01), 0)
    B(m, 7.4, .12, .95, '#e8433a', (0, 2.95, 3.4), (.25, 0, 0))
    for k in range(7): B(m, .5, .13, .97, '#ffffff', (-3.0 + k, 2.96, 3.4), (.25, 0, 0))
    n = 24; pts, rad, col = [], [], []
    for k in range(n + 1):
        a = -1.1 + k / n * 2.2; r = 6
        pts.append((math.sin(a) * r, 4.2 + math.cos(a) * r - r + 3.2, 0))
        e = abs(k - n / 2) / (n / 2); rad.append(1.45 * (1 - e ** 2.4) + .18)
        col.append('#6b5a2a' if k < 1 or k >= n - 1 else '#e0c23a' if e > .8 else '#f2d23a')
    tube(m, pts, rad, col, seg=7)   # (seven sides: the soft ridges of the skin)
    C(m, .16, .22, .7, '#6b5a2a', (math.sin(-1.22) * 6, 4.2 + math.cos(-1.22) * 6 - 2.8 + .1, 0), (0, 0, 1.2), seg=6)

def hand_lighthouse(m, sp):
    # The Vung Tau lighthouse on its hill: a white tower with a red band, the gallery with its railing, the glowing lantern
    # room under a red dome, and the keeper's house beside it with a tiled roof
    white, red = '#ffffff', '#c0392b'
    C(m, 1.3, 1.7, 8, white, (0, 4, 0), seg=16)
    C(m, 1.42, 1.48, .6, red, (0, 5.0, 0), seg=16)
    for y in (2.0, 3.6, 6.4): arch_door(m, .3, .6, '#4a4a5a', (0, y, 1.62 - y * .035), 0)
    C(m, 1.6, 1.5, .3, '#cfd6da', (0, 8.1, 0), seg=16)
    for k in range(16): a = k / 16 * TAU; C(m, .03, .03, .55, '#5a5a5a', (math.cos(a) * 1.5, 8.5, math.sin(a) * 1.5), seg=4)
    m.part('TorusGeometry', '#5a5a5a', (0, 8.78, 0), (math.pi / 2, 0, 0), radius=1.5, tube=.04)
    C(m, .9, .9, 1.4, '#ffe9a0', (0, 8.95, 0), seg=12)
    for k in range(6): a = k / 6 * TAU; C(m, .05, .05, 1.4, red, (math.cos(a) * .92, 8.95, math.sin(a) * .92), seg=4)
    m.part('SphereGeometry', red, (0, 9.65, 0), radius=1.0, widthSegments=14, heightSegments=6, thetaLength=math.pi / 2)
    C(m, .05, .1, .6, '#5a5a5a', (0, 10.85, 0), seg=6)
    B(m, 4, 1.8, 3, '#f2e6c2', (2.6, .9, 0)); viet_roof(m, 4.0, 3.0, .9, '#b4523a', (2.6, 1.8, 0), curl=.1, over=.3)
    arch_door(m, .7, 1.3, '#6a4a3a', (2.6, 0, 1.51), 0)
    for x in (1.6, 3.6): B(m, .6, .6, .05, '#9fd2ee', (x, 1.1, 1.51))

def hand_goldenbridge(m, sp):
    # Cau Vang, the Golden Bridge of Ba Na Hills: a golden walkway curving through the air, held up by two giant weathered
    # stone hands rising from below, their fingers curling up round its side, flower boxes along the rail
    stone, stone2, moss = '#8f8a80', '#7f7a70', '#6f8a5a'
    n = 28; R0 = 4.5
    def at(a, off=0., y=3.4): return (math.sin(a) * (R0 + off), y, (math.cos(a) - .45) * R0 + math.cos(a) * off)
    ang = [-1.1 + i / n * 2.2 for i in range(n + 1)]
    # the deck: one continuous strip with a thickness, gold on top
    v = [at(a, o, y) for a in ang for (o, y) in ((-.8, 3.55), (.8, 3.55), (.8, 3.25), (-.8, 3.25))]; f = []
    for i in range(n):
        A, Bq = i * 4, (i + 1) * 4
        for k in range(4): f.append([A + k, A + (k + 1) % 4, Bq + (k + 1) % 4, Bq + k][::-1])
    f.append([0, 1, 2, 3]); f.append([n * 4 + 3, n * 4 + 2, n * 4 + 1, n * 4])
    m.add((v, f), '#f2c230')
    for o in (-.8, .8):   # the rails and posts
        tube(m, [at(a, o, 4.25) for a in ang], [.05] * (n + 1), '#e8a51e', seg=5)
        for i in range(0, n + 1, 2): m.part('CylinderGeometry', '#e8a51e', at(ang[i], o, 3.9), radiusTop=.035, radiusBottom=.035, height=.7, radialSegments=4)
    for i in range(1, n, 3):   # flower boxes on the outer rail
        m.part('BoxGeometry', '#7a5a3a', at(ang[i], .9, 3.62), (0, ang[i], 0), width=.5, height=.18, depth=.22)
        for j in range(3): m.part('SphereGeometry', ('#ff7eb8', '#c060c0', '#ffd23f')[j], at(ang[i] + (j - 1) * .035, .9, 3.78), radius=.09, widthSegments=6, heightSegments=4)
    for sx in (-1, 1):   # the two stone hands
        a0 = sx * .55; base = Vector(at(a0, 0, 0)); outward = Vector((math.sin(a0), 0, math.cos(a0)))
        tube(m, [tuple(base + Vector((0, y, 0)) - outward * .3) for y in (0, .9, 1.8, 2.6)], [.9, .85, .8, .78], stone, seg=10)   # the forearm
        m.part('SphereGeometry', stone, tuple(base + Vector((0, 2.95, 0))), (0, -a0, 0), (1.25, .45, 1.15), radius=1.0, widthSegments=12, heightSegments=8)   # the palm under the deck
        for k in range(4):   # four fingers curling up the outer side
            sa = a0 + (k - 1.5) * .11
            root = Vector(at(sa, .75, 3.0)); tip = Vector(at(sa, 1.05, 3.9)); top = Vector(at(sa, .85, 4.35))
            tube(m, [root, (root + tip) / 2 + Vector((0, 0, 0)), tip, top], [.2, .2, .18, .14], stone2 if k % 2 else stone, seg=8)
        th0 = Vector(at(a0 + sx * -.32, -.7, 3.0)); tube(m, [th0, Vector(at(a0 + sx * -.3, -1.0, 3.7)), Vector(at(a0 + sx * -.28, -.85, 4.15))], [.22, .2, .15], stone, seg=8)   # the thumb, inner side
        for k in range(7): m.part('SphereGeometry', moss, tuple(base + Vector((math.cos(k * 1.3) * .8, .3 + k * .35, math.sin(k * 2.1) * .7))), radius=.2, widthSegments=6, heightSegments=4)

def hand_uluru(m, sp):
    # Uluru: the great red rock, long and rounded with steep sides, its weathered flanks in vertical gullies and caves,
    # a darker red near the ground (60 x 25 m like the code shape)
    v, f = [], []
    nu, nv = 40, 12
    for j in range(nv + 1):
        th = j / nv * math.pi / 2
        for i in range(nu):
            ph = i / nu * TAU
            gully = 1 - .06 * (math.sin(ph * 17) ** 2) * math.sin(th) ** .5
            bump = 1 + .04 * math.sin(ph * 5 + j) + .03 * math.cos(ph * 11)
            r = gully * bump
            x = math.cos(ph) * math.sin(th) ** .32 * 30 * r; z = math.sin(ph) * math.sin(th) ** .32 * 12.6 * r
            y = -.5 + math.cos(th) ** .7 * 11 * (1 - .08 * math.sin(ph * 3))
            v.append((x, y, z))
    v.append((0, 10.4, 0))
    for j in range(nv):
        for i in range(nu):
            a, b, c, d = j * nu + i, j * nu + (i + 1) % nu, (j + 1) * nu + (i + 1) % nu, (j + 1) * nu + i
            if j == 0: f.append([len(v) - 1, b, a]) if False else None
            f.append([a, b, c, d])
    top = [i for i in range(nu)]
    f.append(top[::-1])
    # colour by height: deep red at the foot, warm orange towards the top (the rows of the surface)
    rows = {}
    for q in f[:-1]: rows.setdefault(min(q) // nu, []).append(q[::-1])
    for j, ff in rows.items(): m.add((v, ff), ('#9e3a22', '#b0442a', '#bf4e2e', '#c95a32', '#d26238', '#d86a3c')[min(5, (nv - 1 - j) * 6 // nv)])
    m.add((v, [f[-1][::-1]]), '#d86a3c')
    for k in range(7):   # caves at the foot
        a = k / 7 * TAU + .3
        m.part('SphereGeometry', '#6a2a1a', (math.cos(a) * 28.6, 1.2, math.sin(a) * 12.0), (0, -a, 0), (1, .7, .35), radius=1.3, widthSegments=8, heightSegments=6)


def hand_puppetstage(m, sp):
    # the water puppet stage (thuy dinh): a little red pavilion with a curled tiled roof standing in a pond, bamboo blinds
    # across its front where the puppeteers hide, a wooden landing, lotus leaves on the water
    m.part('CylinderGeometry', '#9a9080', (0, .1, 0), radiusTop=4.75, radiusBottom=4.85, height=.3, radialSegments=32)
    m.part('CylinderGeometry', '#3d9fc9', (0, .2, 0), radiusTop=4.5, radiusBottom=4.5, height=.12, radialSegments=32)
    B(m, 4.8, .3, 3.0, '#7a4a2a', (0, .45, -1.6))
    B(m, 4.4, 1.6, 2.4, '#c0392b', (0, 1.4, -1.8))
    for k in range(9): B(m, .42, 1.1, .04, '#d8b46a' if k % 2 else '#c9a35a', (-1.7 + k * .42, 1.25, -.58))   # the bamboo blinds
    for x in (-2.0, 2.0): C(m, .14, .16, 2.4, '#8a1e1e', (x, 1.4, -.4), seg=8)
    viet_roof(m, 4.6, 2.8, 1.2, '#a0522d', (0, 2.25, -1.6), curl=.5, over=.45, ridge_color='#7a3a1e')
    m.part('SphereGeometry', '#ffd23f', (0, 3.6, -1.6), radius=.13)
    B(m, 4.4, .16, 1.6, '#8a5a3b', (0, .4, -.1))   # the stage over the water
    for k in range(7):   # lotus leaves
        a = k * 2.3; m.part('CylinderGeometry', '#4f9a4a', (math.cos(a) * 3.3, .28, 1.2 + math.sin(a) * 1.8), radiusTop=.4, radiusBottom=.4, height=.04, radialSegments=10, thetaLength=TAU - .5)
    for k in range(3): m.part('SphereGeometry', '#ff9ab8', (-2 + k * 2, .45, 2.6 - k * .4), (0, 0, 0), (1, .8, 1), radius=.16)

def hand_bnclock(m, sp):
    # Bac Ninh's clock tower at the six-way roundabout: a round fountain basin, four slender white legs rising to the clock
    # room (its faces are the game's own, carried over), a gold cornice, a pointed roof and a spire
    stone, white, gold = '#b9b2a4', '#efe6d2', '#c9a24a'
    C(m, 3.6, 3.8, .5, stone, (0, .25, 0), seg=32); C(m, 3.1, 3.1, .35, '#5fb3dc', (0, .55, 0), seg=32)
    for k in range(12): a = k / 12 * TAU; C(m, .05, .07, .5, '#d9eef6', (math.cos(a) * 2.4, .85, math.sin(a) * 2.4), seg=5)   # the jets
    C(m, 1.6, 1.8, 1.4, '#8f8a80', (0, 1.2, 0), seg=16); C(m, 1.7, 1.7, .15, white, (0, 1.95, 0), seg=16)
    for x, z in ((-.6, -.6), (.6, -.6), (-.6, .6), (.6, .6)):
        B(m, .4, 7.0, .4, white, (x, 5.4, z)); B(m, .55, .2, .55, gold, (x, 2.1, z))
    for y in (4.0, 6.4): B(m, 1.6, .15, 1.6, gold, (0, y, 0))
    B(m, 2.1, 2.1, 2.1, white, (0, 9.8, 0)); B(m, 2.3, .14, 2.3, gold, (0, 8.75, 0))
    B(m, 2.4, .3, 2.4, gold, (0, 10.95, 0))
    m.part('ConeGeometry', gold, (0, 12.0, 0), (0, math.pi / 4, 0), radius=1.2, height=1.8, radialSegments=4)
    C(m, .05, .08, 1.0, gold, (0, 13.3, 0), seg=6); m.part('SphereGeometry', gold, (0, 13.8, 0), radius=.12)

def hand_chuadau(m, sp):
    # Chua Dau (Bac Ninh): the old temple hall with its curled roof, and in front the Hoa Phong tower: three storeys of
    # weathered red brick, each with a little tiled eave and an arched niche
    B(m, 7, .4, 5, '#b9ab8e', (0, .2, -1))
    B(m, 6, 2.2, 3, '#c9a07a', (0, 1.5, -2.5))
    for x in (-2.2, -1.1, 0, 1.1, 2.2): C(m, .12, .12, 2.2, '#8a3a2a', (x, 1.5, -.95), seg=8)
    for x in (-1.6, 0, 1.6): B(m, .8, 1.5, .05, '#5a3a24', (x, 1.15, -.98))
    viet_roof(m, 6.2, 3.2, 1.2, '#7a3a2a', (0, 2.6, -2.5), curl=.45, over=.45, ridge_color='#5a2a1a')
    for k in range(3):   # the Hoa Phong brick tower
        w = 2.5 - k * .42; y = .4 + k * 1.95
        B(m, w, 1.6, w, '#b45a3a' if k % 2 else '#a85032', (0, y + .8, 1.4))
        for a in (0, math.pi / 2, math.pi, -math.pi / 2): arch_door(m, .4, .8, '#3a2a22', (math.sin(a) * (w / 2 + .01), y + .35, 1.4 + math.cos(a) * (w / 2 + .01)), a)
        viet_roof(m, w, w, .45, '#7a3a2a', (0, y + 1.6, 1.4), curl=.18, over=.22)
    m.part('SphereGeometry', '#c9a24a', (0, 6.35, 1.4), radius=.15)

def hand_butthap(m, sp):
    # But Thap's Bao Nghiem tower (Bac Ninh): an octagonal grey stone tower in five storeys narrowing upwards like a writing
    # brush, each storey with carved panels and a stone cornice, on a square terrace with a balustrade
    stone, stone2, dark = '#9a958a', '#7f7a70', '#4a4640'
    B(m, 5.4, .4, 5.4, '#a8a296', (0, .2, 0))
    for k in range(16): a = k / 16 * TAU; B(m, .18, .5, .18, stone2, (math.cos(a) * 2.5 if abs(math.cos(a)) > .7 else 2.5 * math.copysign(1, math.cos(a)) if False else math.cos(a) * 2.5, .65, math.sin(a) * 2.5))
    for k in range(5):
        r = 1.5 - k * .2; y = 1.1 + k * 1.6
        C(m, r, r + .1, 1.4, stone, (0, y, 0), seg=8)
        C(m, r + .38, r + .32, .22, stone2, (0, y + .8, 0), seg=8)
        for j in range(8):   # a carved panel on each face
            a = j / 8 * TAU + math.pi / 8; m.part('BoxGeometry', dark if j % 2 else stone2, (math.sin(a) * (r + .04), y, math.cos(a) * (r + .04)), (0, a, 0), width=r * .55, height=.8, depth=.04)
    m.part('ConeGeometry', stone2, (0, 9.4, 0), radius=.5, height=1.6, radialSegments=8)
    m.part('SphereGeometry', stone, (0, 10.1, 0), radius=.14)

def hand_dendo(m, sp):
    # the three-door gate (tam quan) of Den Do: a tall middle gate and two lower side gates, plastered pillars with
    # couplet panels, each gate under its own curled roof, the gold name board over the middle door
    wall, red, roof = '#e8dcc0', '#7a3a2a', '#8a4a2a'
    for x, w, h in ((-2.8, 1.6, 3.2), (0, 2.4, 4.2), (2.8, 1.6, 3.2)):
        B(m, w, h, 1.1, wall, (x, h / 2, 0)); B(m, w + .1, .2, 1.2, '#cfc2a4', (x, .1, 0))
        arch_door(m, w * .55, h * .62, red, (x, .1, .56), 0); arch_door(m, w * .55, h * .62, red, (x, .1, -.56), math.pi)
        for sx in (-1, 1): B(m, .14, h * .7, .05, '#c62828', (x + sx * w * .38, h * .45, .57))   # couplet boards
        viet_roof(m, w, 1.2, .75, roof, (x, h, 0), curl=.35, over=.32, ridge_color='#6a3a1e')
    B(m, 1.2, .38, .08, '#ffd23f', (0, 3.4, .58))

def hand_quanho(m, sp):
    # a Quan ho dragon boat on a little pond: a red-and-gold boat with a dragon's head and curling tail, a canopy frame
    # (the two singers are the game's own, carried over)
    m.part('CylinderGeometry', '#9a9080', (0, .1, 0), radiusTop=4.5, radiusBottom=4.6, height=.3, radialSegments=32)
    m.part('CylinderGeometry', '#3d9fc9', (0, .2, 0), radiusTop=4.3, radiusBottom=4.3, height=.12, radialSegments=32)
    pts = [(-2.4, .9, 0), (-1.6, .55, 0), (0, .5, 0), (1.6, .55, 0), (2.4, .9, 0)]
    tube(m, pts, [.35, .75, .8, .75, .35], ['#8a5a3b', '#8a5a3b', '#8a5a3b', '#8a5a3b'], seg=10, scale=(1, 1.15))
    B(m, 4.6, .12, 1.5, '#c0392b', (0, .88, 0)); B(m, 4.7, .06, 1.62, '#ffd23f', (0, .95, 0))
    tube(m, [(2.4, .9, 0), (2.75, 1.15, 0), (2.9, 1.4, 0)], [.26, .22, .18], '#2f8a4a', seg=8)   # the dragon's neck and head
    m.part('SphereGeometry', '#2f8a4a', (3.0, 1.5, 0), (0, 0, 0), (1.4, .8, .8), radius=.26)
    for sz in (-1, 1): m.part('SphereGeometry', '#ffd23f', (3.13, 1.6, sz * .13), radius=.06)
    m.part('ConeGeometry', '#ffd23f', (2.88, 1.75, 0), (0, 0, -.5), radius=.07, height=.28, radialSegments=5)
    tube(m, [(-2.4, .9, 0), (-2.75, 1.2, 0), (-2.7, 1.55, 0), (-2.45, 1.65, 0)], [.2, .16, .12, .07], '#2f8a4a', seg=8)   # the tail


def rock(m, pos, size, color, seed=0, squash=(1, 1, 1)):
    """a weathered rock: an icosphere pushed in and out a little (seeded), stretched by squash"""
    import random
    rnd = random.Random(seed); v, f = g_poly('IcosahedronGeometry', 1, 1)
    v = [tuple(c * (1 + (rnd.random() - .5) * .28) for c in p) for p in v]
    m.add((v, f), color, Matrix.Translation(pos) @ Matrix.Diagonal((size * squash[0], size * squash[1], size * squash[2], 1)))

def hand_bondi(m, sp):
    # Bondi's lifesavers' tower: a white cabin on stilts with blue trim and big windows, a ladder, a flag on top, and the
    # red-and-yellow flags marking where to swim
    for x, z in ((-1, -1), (1, -1), (-1, 1), (1, 1)): C(m, .09, .1, 3.0, '#dddddd', (x, 1.5, z), seg=6)
    for y in (1.0, 2.0): B(m, 2.1, .08, .08, '#cfcfcf', (0, y, 1)); B(m, 2.1, .08, .08, '#cfcfcf', (0, y, -1))
    B(m, 2.6, 1.5, 2.6, '#ffffff', (0, 3.75, 0)); B(m, 2.75, .3, 2.75, '#2f7ac8', (0, 4.6, 0)); B(m, 2.8, .12, 2.8, '#2f7ac8', (0, 3.0, 0))
    for a in (0, math.pi / 2, math.pi, -math.pi / 2): m.part('BoxGeometry', '#7fbfe0', (math.sin(a) * 1.31, 3.85, math.cos(a) * 1.31), (0, a, 0), width=1.9, height=.7, depth=.04)
    for k in range(6): B(m, .5, .05, .1, '#cfcfcf', (0, .4 + k * .45, 1.6), (-.35, 0, 0))   # the ladder
    for sx in (-.25, .25): B(m, .06, 2.9, .06, '#cfcfcf', (sx, 1.5, 1.7), (-.35, 0, 0))
    C(m, .03, .03, 1.2, '#888888', (0, 5.3, 0), seg=4); B(m, .6, .4, .03, '#e8433a', (.3, 5.7, 0)); B(m, .6, .2, .035, '#ffd23f', (.3, 5.6, 0))
    for x in (-6, 6):
        C(m, .03, .035, 2.4, '#888888', (x, 1.2, 4), seg=4)
        B(m, .8, .3, .04, '#e8433a', (x + .4, 2.2, 4)); B(m, .8, .3, .04, '#ffd23f', (x + .4, 1.9, 4))

def hand_wtram(m, sp):
    # a Melbourne W-class tram: green below, cream above, a red roof stripe, rows of windows, a bow collector on the roof,
    # destination boards at each end, on its own track
    B(m, 1.4, .1, 9, '#6f747a', (0, .05, 0)); [B(m, .08, .06, 9, '#9aa0a6', (sx * .55, .12, 0)) for sx in (-1, 1)]
    for k in range(12): B(m, 1.6, .05, .18, '#5a4a3a', (0, .07, -4.2 + k * .76))
    B(m, 2.2, 1.3, 7, '#2f7a4a', (0, 1.15, 0)); B(m, 2.25, .12, 7.05, '#ffd23f', (0, 1.8, 0))
    B(m, 2.2, 1.1, 7, '#f4ead2', (0, 2.4, 0)); B(m, 2.3, .25, 7.2, '#8a3a2a', (0, 3.05, 0))
    m.part('CylinderGeometry', '#7a7f84', (0, 3.25, 0), (math.pi / 2, 0, 0), radiusTop=1.0, radiusBottom=1.0, height=6.6, radialSegments=12, thetaStart=-.9 + math.pi / 2, thetaLength=1.8)
    for i in range(6):
        for sx in (-1, 1): B(m, .05, .7, .9, '#9fd3e8', (sx * 1.11, 2.45, -2.75 + i * 1.1))
    for sz in (-1, 1):
        B(m, 1.9, .7, .05, '#9fd3e8', (0, 2.45, sz * 3.51)); B(m, 1.2, .3, .05, '#2a2a2a', (0, 3.0, sz * 3.53))
        C(m, .12, .12, .05, '#fff4c8', (0, 1.0, sz * 3.53), (math.pi / 2, 0, 0), seg=10)
    B(m, .05, 1.1, .05, '#333333', (0, 3.85, 0), (.5, 0, 0)); B(m, .9, .05, .05, '#333333', (0, 4.35, .27))   # the bow collector
    for z in (-2.6, 2.6):
        for sx in (-1, 1): C(m, .35, .35, .2, '#2b2b2b', (sx * .9, .4, z), (0, 0, math.pi / 2), seg=12)

def crag(m, x, z, base_r, h, colors, seed=0, seg=7, lean=(0, 0), y0=0., taper=.78):
    """a tall weathered limestone stack or peak: a tapering tube with jittered rings, banded in layers"""
    import random
    rnd = random.Random(seed); n = 7; pts, rad, cols = [], [], []
    for i in range(n + 1):
        t = i / n
        j = 0 if i < 2 else 1   # (the first two rings straight above each other: the foot stands level)
        pts.append((x + lean[0] * t * h + j * (rnd.random() - .5) * base_r * .25, y0 + t * h, z + lean[1] * t * h + j * (rnd.random() - .5) * base_r * .25))
        rad.append(base_r * (1 - taper * t ** 1.3) * (.85 + rnd.random() * .3) + .05)
        cols.append(colors[i % len(colors)])
    tube(m, pts, rad, cols[:-1], seg=seg)

def hand_marble(m, sp):
    # Ngu Hanh Son, the Marble Mountains near Da Nang: steep pale limestone peaks in layers, trees clinging to their flanks,
    # a little red pagoda on a ledge, a dark cave mouth at the foot, stone steps climbing up
    pale = ['#d6d3c8', '#c4c1b6', '#cfccc1', '#b8b5aa']
    for k, (x, z, r, h) in enumerate(((-3, 0, 3.0, 7.0), (2, -1, 2.5, 5.6), (0, 3, 2.0, 4.6), (4.5, 2.5, 1.6, 3.6))):
        crag(m, x, z, r, h + 1.75, pale, seed=k * 5, seg=8, y0=-1.75)
        for j in range(6):   # trees on the ledges
            t = .15 + j * .12; a = j * 2.1 + k
            rr = r * (1 - .78 * t ** 1.3) + .25
            m.part('IcosahedronGeometry', '#3f7d4a' if j % 2 else '#4f8f52', (x + math.cos(a) * rr, h * t + .3, z + math.sin(a) * rr), radius=.42, detail=0)
    B(m, 1.4, 1.0, 1.2, '#c0392b', (-3.0, 4.9, 2.0)); viet_roof(m, 1.4, 1.2, .6, '#7a3a2a', (-3.0, 5.4, 2.0), curl=.3, over=.3)   # the pagoda on its ledge
    B(m, 2.2, .2, 2.0, '#b8b5aa', (-3.0, 4.35, 2.0))
    m.part('SphereGeometry', '#2a2a2e', (1.8, 1.0, 1.2), (0, 0, 0), (1, 1.3, .35), radius=.9, widthSegments=12, heightSegments=8)
    for k in range(8): B(m, 1.0, .2, .4, '#e2ded2', (-1.2 + k * .05, .1 + k * .25, 4.2 - k * .35))

def hand_hoian(m, sp):
    # Hoi An's old town: three yellow shophouses with dark wooden fronts, green shutters and tiled roofs, a street of
    # silk lanterns strung in front, potted plants by the doors
    B(m, 12, .15, 7, '#d9c9a8', (0, .07, 0))
    for x, wall in ((-4, '#f2c230'), (0, '#f6d35a'), (4, '#e9b830')):
        B(m, 3.6, 2.6, 4, wall, (x, 1.4, -1.2)); B(m, 3.7, .3, 4.1, '#d9a82a', (x, .25, -1.2))
        B(m, 3.0, 1.9, .1, '#5a3a2a', (x, 1.1, .82))
        for k in range(5): B(m, .08, 1.8, .12, '#3a2618', (x - 1.2 + k * .6, 1.1, .86))
        for sx in (-1, 1): B(m, .6, .7, .06, '#3a6a5a', (x + sx * 1.0, 2.2, .84)); B(m, .06, .7, .07, '#2a4a40', (x + sx * 1.0, 2.2, .86))
        viet_roof(m, 3.8, 4.2, 1.0, '#8a4a2a', (x, 2.7, -1.2), curl=.12, over=.35)
        C(m, .22, .16, .3, '#b8643a', (x + 1.5, .3, 1.2), seg=8); m.part('IcosahedronGeometry', '#4f9a4a', (x + 1.5, .65, 1.2), radius=.3, detail=0)
    cols = ['#e8433a', '#ffd23f', '#ff9f43', '#e8433a', '#b03ab0', '#3cc7e8']
    tube(m, [(-6, 3.5, 1.4), (-3, 3.15, 1.4), (0, 3.0, 1.4), (3, 3.15, 1.4), (6, 3.5, 1.4)], [.02] * 5, '#3a2a1a', seg=4)
    for i in range(12):
        x = -5.5 + i; y = 3.2 - math.sin(i / 11 * math.pi) * .5 - .2
        m.part('SphereGeometry', cols[i % 6], (x, y, 1.4), (0, 0, 0), (1, 1.25, 1), radius=.26, widthSegments=10, heightSegments=7)
        C(m, .12, .12, .05, '#ffd23f', (x, y + .33, 1.4), seg=8); C(m, .12, .12, .05, '#ffd23f', (x, y - .33, 1.4), seg=8)

def hand_cairang(m, sp):
    # Cai Rang floating market (Mekong): wooden boats with painted eyes on their bows, blue cabins, piles of fruit, and the
    # tall pole on each boat hanging what it sells
    m.part('CylinderGeometry', '#4fa8d8', (0, .06, 0), (0, 0, 0), (1, 1, .7), radiusTop=8, radiusBottom=8, height=.08, radialSegments=32)
    fruit = ['#ffd23f', '#5fd36a', '#e8433a', '#ff9f43']
    for k, (x, z, r) in enumerate(((-4, -1.5, .2), (0, 1.5, -.15), (4, -1, .1), (-1, -3.2, .3))):
        R = Matrix.Translation((x, .36, z)) @ Matrix.Rotation(r, 4, 'Y')
        def at(px, py, pz): return tuple(R @ Vector((px, py, pz)))
        tube(m, [at(-2.2, .7, 0), at(-1.4, .35, 0), at(0, .3, 0), at(1.4, .35, 0), at(2.2, .7, 0)], [.15, .6, .65, .6, .15], '#7a4a2a', seg=8, scale=(1, 1.1))
        B(m, 3.6, .08, 1.1, '#9a6a43', at(0, .65, 0), (0, r, 0))
        for sz in (-1, 1): m.part('SphereGeometry', '#ffffff', at(2.0, .65, sz * .3), radius=.08); m.part('SphereGeometry', '#1a1a1a', at(2.06, .65, sz * .3), radius=.045)   # the eyes
        B(m, 1.5, .85, 1.0, '#3a6ab0', at(-.9, 1.05, 0), (0, r, 0)); m.part('CylinderGeometry', '#5a8ad0', at(-.9, 1.5, 0), (math.pi / 2, r, 0) if False else (0, r, math.pi / 2), radiusTop=.55, radiusBottom=.55, height=1.6, radialSegments=10, thetaStart=0, thetaLength=math.pi)
        C(m, .03, .03, 3, '#5a3a1a', at(1.4, 1.9, 0), seg=4); m.part('SphereGeometry', fruit[k], at(1.4, 3.4, 0), radius=.3, widthSegments=8, heightSegments=6)
        for i in range(8): m.part('SphereGeometry', fruit[(i + k) % 4], at(.3 + (i % 4) * .3, .8 + (i // 4) * .2, -.25 + (i % 2) * .4), radius=.2, widthSegments=8, heightSegments=6)

def hand_apostles(m, sp):
    # the Twelve Apostles (Victoria): tall golden limestone stacks standing in the surf off a cliff of layered rock with
    # green heath on top, white foam round their feet
    m.part('CylinderGeometry', '#4fa8d8', (0, .06, 0), (0, 0, 0), (1.2, 1, .8), radiusTop=9, radiusBottom=9, height=.08, radialSegments=32)
    for k in range(4): B(m, 20, .6, 3.0 - k * .05, ('#d9a86a', '#c99a5e', '#e0b47a', '#cf9f62')[k], (0, .3 + k * .6, -6.4 - k * .02))
    B(m, 20, .25, 3.2, '#5f9a4a', (0, 2.5, -6.4))
    for k, (x, z, h) in enumerate(((-6, 1, 5.5), (-3, -1, 7), (0, 1.5, 6), (3, 0, 7.5), (6, 2, 5), (8, -1.5, 4))):
        crag(m, x, z, 1.25, h, ['#e0b07a', '#d6a26c', '#e6bc88', '#cf9a62'], seed=k * 7, seg=7)   # each stack in uneven layers
        m.part('SphereGeometry', '#5f9a4a', (x, h + .1, z), (0, 0, 0), (1, .35, 1), radius=.7, widthSegments=8, heightSegments=5)
        m.part('TorusGeometry', '#ffffff', (x, .12, z), (math.pi / 2, 0, 0), radius=1.3, tube=.12, radialSegments=4, tubularSegments=16)


def cn_roof(m, w, d, h, color, pos, ridge=None):
    """a Chinese hall roof: a hipped roof with sweeping upturned eaves (viet_roof with a stronger curl) and a ridge"""
    viet_roof(m, w, d, h, color, pos, curl=.55, over=.6, ridge_color=ridge)

def hand_forbidden(m, sp):
    # the Forbidden City (Meridian Gate side): a white marble terrace with balustrades and stairs, a red-walled hall with
    # rows of red columns, double golden-yellow roofs with upturned eaves, a red wall with a gate in front
    marble, red, gold, dark = '#f2efe6', '#b8282a', '#e8b83a', '#3a2a22'
    B(m, 18, 1.2, 12, marble, (0, .6, 0)); B(m, 17, .6, 11, '#e8e4d8', (0, 1.5, 0))
    for x in range(-8, 9): C(m, .07, .07, .5, marble, (x, 2.05, 5.4), seg=6)
    for x in (-1.2, 0, 1.2): B(m, 1.0, .1, 3.0, '#ddd8ca', (x, 1.0, 6.4), (.4, 0, 0))   # the stairs
    B(m, 12, 3.2, 6, red, (0, 3.4, -1))
    for k in range(11): C(m, .2, .2, 3.2, '#a01e20', (-5.5 + k * 1.1, 3.4, 2.1), seg=10)
    for x in (-4.4, -2.2, 0, 2.2, 4.4): B(m, 1.4, 2.4, .05, '#7a1a1a', (x, 3.0, 2.03))
    B(m, 12.6, .35, 6.6, '#2f6a5a', (0, 5.1, -1))   # the painted beams
    cn_roof(m, 13.4, 7.2, 1.0, gold, (0, 5.3, -1))
    B(m, 10, 1.0, 4.6, red, (0, 6.7, -1))
    cn_roof(m, 11.2, 5.6, 1.4, gold, (0, 7.2, -1), ridge='#c9962a')
    B(m, 18, 2.0, .9, red, (0, 1.0, 7.55)); B(m, 18.2, .3, 1.1, gold, (0, 2.1, 7.55))
    arch_door(m, 2.0, 1.8, dark, (0, 0, 8.01), 0)

def hand_heaven(m, sp):
    # the Temple of Heaven: three round white marble terraces with balustrades, the round Hall of Prayer with red columns
    # and three tiers of deep-blue conical roofs, a gold finial
    marble, red, blue, gold = '#f2efe6', '#b8282a', '#2f4f9a', '#e8b83a'
    for k, (r, y) in enumerate(((8.2, .3), (6.8, .9), (5.4, 1.5))):
        C(m, r, r + .3, .6, marble, (0, y, 0), seg=32)
        for j in range(int(r * 4)): a = j / int(r * 4) * TAU; C(m, .06, .06, .4, marble, (math.cos(a) * (r - .15), y + .5, math.sin(a) * (r - .15)), seg=4)
    for z in (-1, 1): B(m, 1.6, .1, 6.5, '#e2ded2', (0, 1.0, z * 5.0), (z * .2, 0, 0))   # the marble stairs
    C(m, 3.6, 3.6, 2.6, red, (0, 3.1, 0), seg=24)
    for k in range(12): a = k / 12 * TAU; C(m, .14, .14, 2.6, '#a01e20', (math.cos(a) * 3.65, 3.1, math.sin(a) * 3.65), seg=8)
    for k, (r, h, y) in enumerate(((4.6, 1.2, 4.4), (3.6, 1.1, 6.1), (2.6, 1.3, 7.7))):
        m.part('ConeGeometry', blue, (0, y + h / 2, 0), radius=r, height=h, radialSegments=24)
        C(m, r * .62, r * .62, .9 if k < 2 else 0.01, red, (0, y + h + .45, 0), seg=20) if k < 2 else None
        m.part('TorusGeometry', gold, (0, y + .02, 0), (math.pi / 2, 0, 0), radius=r - .05, tube=.06, radialSegments=4, tubularSegments=32)
    C(m, .15, .3, .6, gold, (0, 9.6, 0), seg=10); m.part('SphereGeometry', gold, (0, 10.1, 0), radius=.3)

def hand_potala(m, sp):
    # the Potala Palace (Lhasa): the great White Palace rising in stepped, inward-sloping walls with rows of small windows,
    # the Red Palace in the middle on top, gold roofs, on its rocky hill
    white, red, gold, dark = '#f4f1ea', '#a8352a', '#e8b83a', '#3a2a22'
    B(m, 18.2, .5, 8.0, '#8a7a62', (0, .25, 0))   # the rocky plinth
    for k, (w, d, h, y) in enumerate(((18, 8, 3, 0), (15, 6.6, 2.6, 3), (11, 5.4, 2.4, 5.6))):
        m.part('CylinderGeometry', white, (0, y + h / 2 + .4, 0), (0, 0, 0), (w / 1.414, 1, d / 1.414), radiusTop=.94, radiusBottom=1, height=h, radialSegments=4, thetaStart=math.pi / 4)   # (a square with straight sides, sloping in)
        for j in range(int(w / 1.1)):   # rows of windows
            x = -w / 2 + .8 + j * 1.1
            if abs(x) < w / 2 - .5: B(m, .35, .5, .05, dark, (x, y + h * .55, d / 2 * .97 + .01))
        B(m, w * .9, .2, d * .9, '#8a3a2a', (0, y + h - .05, 0))
    B(m, 6.0, 3.0, 4.2, red, (0, 9.1 - 1.5 + .0, 0))
    for j in range(5): B(m, .4, .6, .05, dark, (-2 + j, 8.0, 2.11))
    B(m, 6.4, .3, 4.6, '#8a3a2a', (0, 9.1, 0))
    for x in (-2.0, 0, 2.0): m.part('ConeGeometry', gold, (x, 9.4, 0), (0, math.pi / 4, 0), radius=.9, height=.5, radialSegments=4)
    for k in range(8): B(m, .9, .2, .5, '#d8d4c8', (-7 + k * .3, .4 + k * .35, 4.0 - k * .05))   # the zig-zag stairs

def hand_qutub(m, sp):
    # the Qutub Minar (Delhi): a tall tapering tower of red and buff sandstone in five storeys, each fluted with round and
    # angular ribs, each with a balcony on carved brackets, a small cupola on top
    red, buff, dark = '#b8584a', '#d8b48a', '#7a3a2a'
    y = 0
    for k in range(5):
        r0, r1, h = 2.2 - k * .32, 2.0 - k * .32, (5.0, 3.8, 3.2, 2.4, 2.0)[k]
        col = red if k < 3 else buff
        m.add(g_cyl(r1, r0, h, 24, smooth=False), col, Matrix.Translation((0, y + h / 2, 0)))
        for j in range(12):   # the flutes
            a = j / 12 * TAU; rr = (r0 + r1) / 2 + .06
            m.part('CylinderGeometry', tint(col, .88), (math.cos(a) * rr, y + h / 2, math.sin(a) * rr), radiusTop=.14, radiusBottom=.16, height=h * .96, radialSegments=6)
        for j in range(2): m.part('TorusGeometry', dark, (0, y + h * (.3 + .35 * j), 0), (math.pi / 2, 0, 0), radius=(r0 + r1) / 2 + .14, tube=.05, radialSegments=4, tubularSegments=24)
        y += h
        C(m, r1 + .5, r1 + .3, .25, buff, (0, y, 0), seg=24)   # the balcony
        for j in range(16): a = j / 16 * TAU; C(m, .03, .03, .35, buff, (math.cos(a) * (r1 + .45), y + .3, math.sin(a) * (r1 + .45)), seg=4)
    C(m, .45, .5, .8, buff, (0, y + .5, 0), seg=10); m.part('SphereGeometry', buff, (0, y + 1.0, 0), radius=.45, widthSegments=10, heightSegments=6, thetaLength=math.pi / 2)
    B(m, 5.0, .3, 5.0, '#c9b89a', (0, .15, 0))

def hand_redfort(m, sp):
    # the Red Fort (Delhi): the long red sandstone wall with battlements, the Lahori Gate in the middle (a tall arch
    # between two octagonal towers) and a row of small white-domed pavilions (chhatris) on top
    red, red2, white, dark = '#b8483a', '#a03e32', '#f4efe6', '#4a2620'
    B(m, 20, 4.5, 2.4, red, (0, 2.25, 0)); B(m, 20.2, .3, 2.6, red2, (0, 4.5, 0))
    for k in range(25): B(m, .45, .5, .3, red2, (-9.6 + k * .8, 4.9, 1.05))
    for k in range(9): arch_door(m, .6, 1.2, red2, (-9 + k * 2.25, 1.2, 1.21), 0)
    B(m, 4.6, 6.2, 2.8, red, (0, 3.1, .3))
    arch_door(m, 1.8, 3.6, dark, (0, 0, 1.71), 0); m.part('TorusGeometry', white, (0, 2.7, 1.72), radius=.95, tube=.1, arc=math.pi)
    for sx in (-1, 1):
        C(m, .9, 1.0, 7.0, red, (sx * 2.6, 3.5, 1.2), seg=8)
        C(m, 1.1, 1.1, .25, white, (sx * 2.6, 7.1, 1.2), seg=8)
        for j in range(6): a = j / 6 * TAU; C(m, .06, .06, .7, white, (sx * 2.6 + math.cos(a) * .7, 7.55, 1.2 + math.sin(a) * .7), seg=4)
        m.part('SphereGeometry', white, (sx * 2.6, 8.0, 1.2), radius=.75, widthSegments=12, heightSegments=6, thetaLength=math.pi / 2)
    for x in (-1.2, 0, 1.2):
        for j in range(4): C(m, .05, .05, .6, white, (x + (j % 2 - .5) * .5, 6.6, .3 + (j // 2 - .5) * .5), seg=4)
        m.part('SphereGeometry', white, (x, 6.95, .3), radius=.38, widthSegments=10, heightSegments=5, thetaLength=math.pi / 2)
    for x in (-7, -4.5, 4.5, 7):
        for j in range(4): C(m, .04, .04, .5, white, (x + (j % 2 - .5) * .4, 5.0, (j // 2 - .5) * .4), seg=4)
        m.part('SphereGeometry', white, (x, 5.25, 0), radius=.3, widthSegments=10, heightSegments=5, thetaLength=math.pi / 2)

def hand_sisters(m, sp):
    # the Three Sisters (Blue Mountains): three tall weathered sandstone pillars in warm ochre layers, gum trees at their
    # feet and the blue haze of the valley, a lookout platform in front
    for k, (x, h) in enumerate(((-3, 9.5), (0, 11.5), (3.2, 10.0))):
        crag(m, x, 0, 1.5 - k * .05, h, ['#c9925a', '#b8804a', '#d8a066', '#a87040'], seed=k * 11, seg=8, taper=.38)
        m.part('SphereGeometry', '#5f8a4a', (x, h + .1, 0), (0, 0, 0), (1, .35, 1), radius=.6, widthSegments=8, heightSegments=5)
    for k in range(9):   # gum trees round the feet
        x = -6 + k * 1.5; z = 2.2 + (k % 3) * .8
        C(m, .1, .14, 2.2, '#e9e1d2', (x, 1.1, z), seg=6); m.part('IcosahedronGeometry', '#6f8a5f' if k % 2 else '#7f9a6a', (x, 2.6, z), (0, 0, 0), (1.2, .7, 1.2), radius=.9, detail=0)
    B(m, 4.0, .2, 1.6, '#8a6a4a', (0, .8, 5.0)); [C(m, .06, .06, .8, '#6a4a3a', (x, .4, 5.0 + dz), seg=5) for x in (-1.9, 1.9) for dz in (-.7, .7)]
    B(m, 4.0, .08, .06, '#6a4a3a', (0, 1.6, 5.8))


def karst(m, x, z, r, h, seed, y0=0.):
    """a limestone karst tower: a grey crag with a cap and ledges of green forest"""
    crag(m, x, z, r, h, ['#9a9a92', '#8a8a84', '#a6a69c', '#7f7f78'], seed=seed, seg=8, y0=y0, taper=.55)
    m.part('IcosahedronGeometry', '#4f8a4a', (x, y0 + h - .1, z), (0, 0, 0), (1, .55, 1), radius=r * .62, detail=1)
    for j in range(4):
        a = seed + j * 1.7; t = .35 + j * .14; rr = r * (1 - .55 * t ** 1.3) + .15
        m.part('IcosahedronGeometry', '#3f7d4a' if j % 2 else '#5a9a52', (x + math.cos(a) * rr, y0 + h * t, z + math.sin(a) * rr), radius=r * .28, detail=0)

def hand_halong(m, sp):
    # Ha Long Bay: steep limestone islands with green caps rising from the sea, a junk boat with red sails between them
    for k, (x, z, h) in enumerate(((-6, 0, 7), (0, -5, 10), (6, 2, 8), (-2, 7, 6), (9, -6, 5))):
        karst(m, x, z, 1.8 + h * .12, h, k * 3, y0=-1.2)
    B(m, 2.6, .5, .9, '#7a4a2a', (2.5, 2.0, 5.0)); m.part('ConeGeometry', '#7a4a2a', (4.0, 2.05, 5.0), (0, 0, -math.pi / 2), radius=.45, height=.6, radialSegments=4)
    for k, x in enumerate((1.8, 3.0)):
        C(m, .04, .04, 2.6, '#5a3a24', (x, 3.4, 5.0), seg=4)
        m.part('BoxGeometry', '#c8402e', (x, 3.6, 5.0), width=1.0 - k * .1, height=1.8, depth=.04)
        for j in range(4): B(m, 1.02 - k * .1, .03, .05, '#8a2a1a', (x, 2.9 + j * .45, 5.0))

def hand_myson(m, sp):
    # My Son sanctuary: Cham temple towers (kalan) of old red brick, each a square body with false doors and pilasters,
    # rising in shrinking tiers to a rounded top, moss in the joints
    brick, brick2, moss = '#b45a3a', '#9a4a30', '#6f8a5a'
    B(m, 15, .25, 7.2, '#9a8a6a', (0, .12, 1.0))   # the sanctuary's ground
    for (x, z, w, d) in ((-7.2, 1, .5, 6.6), (7.2, 1, .5, 6.6), (0, 4.4, 14, .5), (-3, -2.4, 6, .5)): B(m, w, .6 + (abs(x + z) % 2) * .3, d, '#9a4a30', (x, .5, z))   # ruined walls
    for k, (x, z, h) in enumerate(((0, 0, 7.2), (-5, 2, 5.0), (5, 1.5, 5.5))):
        w = h * .36
        B(m, w + .6, .5, w + .6, brick2, (x, .1, z))
        B(m, w, h * .45, w, brick, (x, .35 + h * .225, z))
        for a in (0, math.pi / 2, math.pi, -math.pi / 2):
            px, pz = math.sin(a) * (w / 2 + .05), math.cos(a) * (w / 2 + .05)
            m.part('BoxGeometry', brick2, (x + px, .35 + h * .22, z + pz), (0, a, 0), width=w * .45, height=h * .36, depth=.15)   # the false door
            arch_door(m, w * .22, h * .26, '#5a2a1a', (x + px * 1.03, .5, z + pz * 1.03), a)
            for sx in (-1, 1): m.part('BoxGeometry', brick2, (x + px + math.cos(a) * sx * w * .4, .35 + h * .22, z + pz - math.sin(a) * sx * w * .4), (0, a, 0), width=.18, height=h * .44, depth=.1)
        y = .35 + h * .45
        for t in range(3):
            ww = w * (.86 - t * .2); hh = h * .12
            B(m, ww, hh, ww, brick if t % 2 == 0 else brick2, (x, y + hh / 2, z)); y += hh
        m.part('SphereGeometry', brick, (x, y, z), (0, 0, 0), (1, 1.2, 1), radius=w * .22, widthSegments=8, heightSegments=6)
        for j in range(5): m.part('SphereGeometry', moss, (x + math.cos(j * 2) * w * .5, .4 + j * h * .15, z + math.sin(j * 2) * w * .5), radius=.2, widthSegments=6, heightSegments=4)

def hand_trangan(m, sp):
    # Trang An (Ninh Binh): karst peaks over a green river, a cave arch at water level, a rowing boat with a woman in a
    # conical hat rowing with her feet
    m.part('CylinderGeometry', '#4f9a8a', (0, -.1, 0), (0, 0, 0), (1, 1, .85), radiusTop=7.0, radiusBottom=7.0, height=.1, radialSegments=32)
    for k, (x, z, h) in enumerate(((-5, -2, 7), (4, -3, 9), (0, -6, 6))): karst(m, x, z, 2.0, h + 1.5, k * 4 + 1, y0=-1.5)
    m.part('TorusGeometry', '#8a8a84', (-.5, -.2, -3.0), (0, 0, 0), (1.4, 1.2, 1), radius=1.3, tube=.7, arc=math.pi)
    tube(m, [(1.5, .1, 2.5), (2.5, .05, 2.5), (3.5, .1, 2.5)], [.15, .35, .15], '#7a5a3a', seg=8, scale=(1, .6))
    m.part('ConeGeometry', '#e8d8a0', (2.7, .9, 2.5), radius=.3, height=.22, radialSegments=10); C(m, .12, .15, .5, '#3a5a8a', (2.7, .55, 2.5), seg=6)

def hand_cave(m, sp):
    # Phong Nha cave: a forested limestone hill with a great dark cave mouth where the river flows out, stalactites hanging
    # in the opening, a boat at the entrance
    rock(m, (0, 0, 0), 1, '#8f8a80', seed=5, squash=(8.0, 5.1, 6.2))
    for k in range(14): a = k * 1.9; m.part('IcosahedronGeometry', '#4f8a4a' if k % 2 else '#3f7d4a', (math.cos(a) * 6.5, 3.5 + (k % 3) * .7, math.sin(a) * 4.5), radius=1.0, detail=0)
    m.part('SphereGeometry', '#1e1c22', (0, 1.0, 6.2), (0, 0, 0), (1.5, 1.2, .7), radius=2.4, widthSegments=14, heightSegments=8)
    for k in range(7): m.part('ConeGeometry', '#b8b2a4', (-2.4 + k * .8, 3.3, 6.9), (math.pi, 0, 0), radius=.14, height=.6 + (k % 3) * .3, radialSegments=5)
    m.part('CylinderGeometry', '#4f9a8a', (0, .05, 10), (0, 0, 0), (1, 1, 2.2), radiusTop=2.4, radiusBottom=2.4, height=.06, radialSegments=20)
    tube(m, [(-1.0, .2, 11.5), (0, .12, 11.5), (1.0, .2, 11.5)], [.12, .32, .12], '#7a5a3a', seg=8, scale=(1, .6))

def hand_kakadu(m, sp):
    # Kakadu (Ubirr): a long rocky escarpment of orange sandstone with dark streaks and overhangs where the old rock art is
    # painted (the painting itself is the game's own), spinifex grass at its foot
    for k in range(6):
        x = -7.5 + k * 3.0
        rock(m, (x, 2.2 + (k % 2) * .6, -1.2), 1, ('#b0643a', '#a8582e', '#c0703e')[k % 3], seed=k, squash=(2.0, 2.8 + (k % 3) * .4, 1.8))
    B(m, 17, .6, 1.2, '#8a4a2a', (0, 4.6, .5)); B(m, 17.4, .3, 1.6, '#a85a32', (0, 5.0, .4))   # the overhang
    for k in range(12): m.part('ConeGeometry', '#c8b45a', (-8 + k * 1.45, .3, 1.4 - (k % 2) * .5), radius=.35, height=.6, radialSegments=6)

def hand_reef(m, sp):
    # the Great Barrier Reef: a sandy shallow ring with branching corals, brain corals and fan corals in bright colours,
    # a few little fish
    m.part('CylinderGeometry', '#e2cf9c', (0, -.32, 0), radiusTop=5.0, radiusBottom=5.4, height=.3, radialSegments=28)
    cols = ['#ff7eb8', '#ff9f43', '#c060c0', '#ffd23f', '#5fd3c0', '#ff6a8a']
    for k in range(14):
        a = k * 2.4; r = 1.2 + (k % 4) * .95; x, z = math.cos(a) * r, math.sin(a) * r; c = cols[k % 6]
        if k % 3 == 0:   # branching coral
            for j in range(4): b = j * 1.6 + k; tube(m, [(x, -.2, z), (x + math.cos(b) * .25, .35, z + math.sin(b) * .25), (x + math.cos(b) * .4, .8 + (j % 2) * .2, z + math.sin(b) * .4)], [.1, .08, .05], c, seg=5)
        elif k % 3 == 1: m.part('SphereGeometry', c, (x, -.1, z), (0, 0, 0), (1, .65, 1), radius=.45, widthSegments=10, heightSegments=6)   # brain coral
        else: m.part('CylinderGeometry', c, (x, .35, z), (math.pi / 2, a, 0), radiusTop=.55, radiusBottom=.55, height=.05, radialSegments=10, thetaStart=-1.2, thetaLength=2.4)   # a fan
    for k in range(5): a = k * 1.3; m.part('SphereGeometry', ('#ffd23f', '#3a78c8', '#ff9f43')[k % 3], (math.cos(a) * 3, .6 + (k % 2) * .3, math.sin(a) * 2.5), (0, a, 0), (1.6, .8, .5), radius=.14, widthSegments=6, heightSegments=4)


def hand_wheelbase(m, sp):
    # the Wheel of Brisbane's stand: two white tapering legs leaning in to the hub (the turning wheel is the game's own,
    # carried over), a concrete base, the blue ticket booth with its striped awning
    B(m, 5, .5, 3, '#c9c4b8', (0, .25, 0)); B(m, 5.2, .1, 3.2, '#b3ae a2'.replace(' ', ''), (0, .52, 0))
    for sx in (-1, 1):
        tube(m, [(sx * 1.85, .5, 0), (sx * 1.2, 4.2, 0), (sx * .55, 8.3, 0)], [.28, .22, .16], '#efefef', seg=8)
        tube(m, [(sx * 1.85, .5, -1.0), (sx * .55, 8.3, 0)], [.12, .08], '#dcdcdc', seg=6)
    C(m, .45, .45, .9, '#c8ccd0', (0, 8.4, 0), (math.pi / 2, 0, 0), seg=12)
    B(m, 2.4, 1.0, 1.6, '#3a78c8', (0, .9, 1.6)); B(m, 1.4, .5, .05, '#9fd2ee', (0, 1.0, 2.41))
    B(m, 2.6, .08, .7, '#e8433a', (0, 1.55, 2.5), (.3, 0, 0))
    for k in range(4): B(m, .3, .09, .71, '#ffffff', (-.9 + k * .6, 1.56, 2.5), (.3, 0, 0))

def hand_lonepine(m, sp):
    # Lone Pine Koala Sanctuary: a grassy round with tall pale gum trees, each with a fluffy grey koala hugging the trunk,
    # a wooden fence and sign at the front
    m.part('CylinderGeometry', '#9ac06a', (0, .1, 0), radiusTop=4.0, radiusBottom=4.2, height=.2, radialSegments=28)
    for k, (x, z, h) in enumerate(((-2, -1, 5.5), (1.8, .8, 6.5), (0, -2.6, 5))):
        tube(m, [(x, 0, z), (x + .1, h * .5, z), (x - .1, h * .85, z + .1)], [.35, .27, .18], '#e8e4dc', seg=8)
        for j in range(3):
            b = j * 2.1 + k; m.part('IcosahedronGeometry', '#6f9a7a' if j % 2 else '#7faa86', (x + math.cos(b) * .8, h + .4 + (j % 2) * .4, z + math.sin(b) * .8), (0, 0, 0), (1, .7, 1), radius=1.1, detail=1)
        kx, ky, kz = x + .35, h * .62, z + .2   # the koala
        m.part('SphereGeometry', '#9a9a9e', (kx, ky, kz), (0, 0, 0), (1, 1.15, .9), radius=.42, widthSegments=10, heightSegments=8)
        m.part('SphereGeometry', '#a6a6aa', (kx, ky + .5, kz + .05), radius=.3, widthSegments=10, heightSegments=8)
        for sx in (-1, 1): m.part('SphereGeometry', '#d8d8dc', (kx + sx * .26, ky + .72, kz), (0, 0, 0), (1, 1, .5), radius=.14, widthSegments=8, heightSegments=6)
        m.part('SphereGeometry', '#3a3a3e', (kx, ky + .47, kz + .3), (0, 0, 0), (1, 1.2, .8), radius=.08, widthSegments=6, heightSegments=4)
    for k in range(11): C(m, .06, .07, 1.0, '#8a5a3b', (-4 + k * .8, .5, 3.6), seg=5)
    for y in (.4, .85): B(m, 8.2, .08, .06, '#8a5a3b', (0, y, 3.6))
    B(m, 2.4, .8, .1, '#5a7a3a', (0, 1.4, 3.65)); C(m, .05, .05, 1.2, '#6a4a3a', (-1.0, .9, 3.6), seg=4); C(m, .05, .05, 1.2, '#6a4a3a', (1.0, .9, 3.6), seg=4)

def hand_exhibition(m, sp):
    # the Royal Exhibition Building (Melbourne): a long cream hall with arched windows and pilasters, the grand entrance
    # porch with its arched portico, the octagonal drum and the great ribbed dome with a lantern on top
    cream, light, dome, glass = '#e8dcc4', '#f4ecdc', '#8fb0a0', '#86bfd0'
    B(m, 18, 5, 9, cream, (0, 2.5, 0)); B(m, 19, .6, 10, '#c9b89a', (0, 5.2, 0)); B(m, 18.2, .5, 9.2, '#d4c6a8', (0, .25, 0))
    for i in range(8):
        x = -7 + i * 2
        if abs(x) > 1.5: arch_door(m, 1.0, 2.6, glass, (x, 1.1, 4.52), 0); B(m, .3, 4.6, .15, light, (x + 1, 2.5, 4.55))
    for sx in (-1, 1):   # end pavilions with little domes
        B(m, 2.4, 6.4, 2.4, cream, (sx * 8.0, 3.2, 3.4)); m.part('SphereGeometry', dome, (sx * 8.0, 6.4, 3.4), radius=1.1, widthSegments=12, heightSegments=6, thetaLength=math.pi / 2)
    B(m, 4.4, 4.4, 2.2, cream, (0, 2.2, 5.0)); prism(m, 4.8, 1.2, 2.3, light, (0, 4.4, 5.0))
    for x in (-1.3, 0, 1.3): arch_door(m, 1.0, 2.8, '#6a5a4a', (0, .2, 6.11) if False else (x, .2, 6.11), 0)
    for x in (-1.9, -.65, .65, 1.9): C(m, .16, .18, 3.4, light, (x, 1.9, 6.15), seg=10)
    C(m, 3.6, 3.6, 2.2, cream, (0, 6.6, 0), seg=16)
    for k in range(16): a = k / 16 * TAU; arch_door(m, .55, 1.3, glass, (math.sin(a) * 3.61, 6.0, math.cos(a) * 3.61), a)
    m.part('SphereGeometry', dome, (0, 7.6, 0), radius=3.6, widthSegments=24, heightSegments=10, thetaLength=math.pi / 2)
    for k in range(12): a = k / 12 * TAU; m.part('TorusGeometry', '#7a9a8a', (0, 7.6, 0), (0, a, 0), radius=3.62, tube=.07, radialSegments=4, tubularSegments=12, arc=math.pi / 2)
    C(m, .55, .7, 1.0, light, (0, 11.6, 0), seg=10); m.part('SphereGeometry', dome, (0, 12.1, 0), radius=.55, widthSegments=10, heightSegments=6, thetaLength=math.pi / 2)
    C(m, .06, .1, .8, '#ffd23f', (0, 12.9, 0), seg=6)

def hand_terracotta(m, sp):
    # the Terracotta Army (Xi'an): an excavated pit with earth walls, rows of clay warriors standing in ranks, a few horses
    clay, clay2, earth = '#b88a5a', '#a87a4a', '#c9a26a'
    B(m, 14, .3, 10, earth, (0, -.1, 0))
    for sx in (-1, 1): B(m, 14, 1.0, .6, '#b8925a', (0, .4, sx * 5.0))
    for z in (-2.5, 0, 2.5): B(m, 13, .9, .5, '#b8925a', (0, .35, z + 1.25)) if z < 2.5 else None
    for r in range(4):
        for c2 in range(11):
            x = -5.5 + c2 * 1.1; z = -3.8 + r * 2.5; col = clay if (r + c2) % 2 else clay2
            if r == 1 and c2 in (4, 6):   # two horses in the second rank
                m.part('SphereGeometry', '#9a6a3a', (x, .75, z), (0, 0, 0), (1.6, .7, .7), radius=.4, widthSegments=8, heightSegments=6)
                tube(m, [(x + .5, .8, z), (x + .75, 1.2, z)], [.12, .1], '#9a6a3a', seg=6)
                for dx in (-.35, .35): C(m, .06, .06, .55, '#9a6a3a', (x + dx, .28, z), seg=5)
                continue
            C(m, .18, .22, .75, col, (x, .45, z), seg=8)               # the robe
            C(m, .2, .18, .35, tint(col, .9), (x, .95, z), seg=8)      # the armour
            m.part('SphereGeometry', col, (x, 1.3, z), radius=.15, widthSegments=8, heightSegments=6)
            m.part('SphereGeometry', '#7a5a3a', (x - .02, 1.43, z - .05), radius=.07, widthSegments=6, heightSegments=4)   # the topknot

def hand_konark(m, sp):
    # the Konark Sun Temple: a stone chariot for the sun god: a carved platform with twelve pairs of great stone wheels,
    # the pyramid-roofed porch in tiers, stone horses pulling it at the front stairs
    stone, stone2, dark = '#9a8070', '#8a7060', '#6a5040'
    B(m, 10, 3, 6, stone, (0, 1.5, 0))
    for k in range(5): B(m, 10.1, .12, 6.1, stone2, (0, .5 + k * .55, 0))
    for y in range(5):   # the porch roof in stepped tiers
        w = 7.2 - y * 1.2; B(m, w, .6, w * .8, stone if y % 2 else stone2, (0, 3.3 + y * .9, 0)); B(m, w + .3, .12, w * .8 + .3, dark, (0, 3.65 + y * .9, 0))
    m.part('SphereGeometry', stone2, (0, 7.8, 0), (0, 0, 0), (1, .5, 1), radius=.8, widthSegments=10, heightSegments=6)
    for sz in (-1, 1):
        for x in (-3.6, -1.8, 0, 1.8, 3.6):
            z = sz * 3.12
            m.part('TorusGeometry', dark, (x, 1.3, z), radius=.8, tube=.12, radialSegments=6, tubularSegments=20)
            m.part('CylinderGeometry', stone2, (x, 1.3, z), (math.pi / 2, 0, 0), radiusTop=.2, radiusBottom=.2, height=.3, radialSegments=8)
            for j in range(8): a = j / 8 * math.pi; m.part('BoxGeometry', dark, (x, 1.3, z), (0, 0, a), width=1.5, height=.07, depth=.08)
    for k in range(3): B(m, 2.4, .25, .5, stone2, (0, .12 + k * .25, 3.3 + .5 * (2 - k)) if False else (-2 + k * 2, .8, 4.6)) if False else None
    for i in range(3): B(m, .7, 1.6, 2, stone, (-2 + i * 2, .8, 4.6))
    for sx in (-1, 1):   # the horses
        x = sx * 3.6; m.part('SphereGeometry', stone, (x, 1.3, 4.6), (0, 0, 0), (.6, .7, 1.4), radius=.6, widthSegments=8, heightSegments=6)
        tube(m, [(x, 1.5, 5.3), (x, 2.2, 5.6)], [.2, .16], stone, seg=6); m.part('SphereGeometry', stone, (x, 2.3, 5.7), (0, 0, 0), (.6, .6, 1), radius=.25, widthSegments=6, heightSegments=4)
        for dz in (-.5, .5): C(m, .1, .1, .9, stone2, (x, .45, 4.6 + dz), seg=5)

def hand_hampi(m, sp):
    # Hampi: the Virupaksha temple's tall tiered gopuram over its gate, carved pillared mandapa, and the huge round granite
    # boulders of the Hampi landscape all around
    stone, stone2, dark, boulder = '#c9b098', '#b8a088', '#6a5a4a', '#c8a882'
    B(m, 5, .6, 6, stone2, (0, .3, 0)); B(m, 3.6, 2.6, 4.4, stone, (0, 1.9, 0))
    arch_door(m, 1.1, 1.8, dark, (0, .6, 2.21), 0)
    for k in range(6):   # the gopuram's tiers
        w = 3.4 - k * .42; d = 2.4 - k * .25; y = 3.2 + k * .55
        B(m, w, .5, d, stone if k % 2 else stone2, (0, y + .25, 0))
        for j in range(int(w / .5)): B(m, .2, .3, .05, dark, (-w / 2 + .3 + j * .5, y + .25, d / 2 + .01))
    B(m, .8, .4, .5, stone2, (0, 6.7, 0)); [m.part('ConeGeometry', '#d8b45a', (x, 7.05, 0), radius=.1, height=.3, radialSegments=6) for x in (-.25, 0, .25)]
    for sx in (-1, 1):
        for j in range(3): C(m, .15, .18, 1.6, stone2, (sx * 2.2, 1.4, -1.5 + j * 1.5), seg=8)
        B(m, 1.0, .2, 4.2, stone, (sx * 2.2, 2.3, 0))
    for k, (x, z, r) in enumerate(((-7, 2, 2.6), (7, -1, 3.2), (-5, -5, 2), (6, 5, 2.2))):
        rock(m, (x, r * .7, z), r, boulder if k % 2 else '#b89a72', seed=k + 20, squash=(1, .85, 1))
        rock(m, (x + r * .6, r * 1.4, z - r * .2), r * .5, '#c8a882', seed=k + 30)

def hand_mahabodhi(m, sp):
    # the Mahabodhi Temple (Bodh Gaya): the tall pyramidal tower carved in many tiers of niches, four small corner towers,
    # a gold finial, on its terrace, and the Bodhi tree beside it
    stone, stone2, gold, dark = '#d4ba90', '#c4a880', '#f2c230', '#8a6a4a'
    B(m, 9, 1, 9, '#c9b89a', (0, .5, 0)); B(m, 5.5, 4, 5.5, '#c9b089', (0, 3, 0))
    arch_door(m, 1.2, 2.2, dark, (0, 1.0, 2.76), 0)
    for k in range(10):   # the tower in tiers of niches
        t = k / 10; w = 3.6 - t * 2.9; y = 5.0 + k * 1.0
        m.part('CylinderGeometry', stone if k % 2 else stone2, (0, y + .5, 0), (0, math.pi / 4, 0), radiusTop=(w - .25) * .707 * 1.414 / 1.414 * 1.0, radiusBottom=w * .707 * 1.414 / 1.0 * .707, height=1.0, radialSegments=4)
        for a in (0, math.pi / 2, math.pi, -math.pi / 2):
            m.part('BoxGeometry', dark, (math.sin(a) * (w * .5 + .01) * .99, y + .5, math.cos(a) * (w * .5 + .01) * .99), (0, a, 0), width=w * .3, height=.55, depth=.04)
    C(m, .5, .6, 1.4, gold, (0, 15.6, 0), seg=10); m.part('ConeGeometry', gold, (0, 16.6, 0), radius=.3, height=.6, radialSegments=8)
    for a, b in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        m.part('CylinderGeometry', stone, (a * 3.3, 6.5, b * 3.3), (0, math.pi / 4, 0), radiusTop=.3, radiusBottom=1.0, height=4, radialSegments=4)
        m.part('SphereGeometry', gold, (a * 3.3, 8.6, b * 3.3), radius=.18)
    tube(m, [(6, 0, 3), (6.1, 1.6, 3), (5.9, 3.0, 3.1)], [.5, .4, .3], '#7a5236', seg=8)
    for j in range(5): b = j * 1.3; m.part('IcosahedronGeometry', '#4f9a4a' if j % 2 else '#5faa5a', (6 + math.cos(b) * 1.1, 4.4 + (j % 2) * .6, 3 + math.sin(b) * 1.1), radius=1.3, detail=1)


def boat(m, x, z, r, fruit, pole=True):
    """a Mekong market boat: a curved wooden hull with painted eyes, a woven cabin, fruit piled up, its cay beo pole"""
    R = Matrix.Translation((x, 0, z)) @ Matrix.Rotation(r, 4, 'Y')
    def at(px, py, pz): return tuple(R @ Vector((px, py, pz)))
    tube(m, [at(-1.8, .6, 0), at(-1.1, .3, 0), at(0, .25, 0), at(1.1, .3, 0), at(1.8, .6, 0)], [.12, .5, .55, .5, .12], '#7a4a2a', seg=8, scale=(1, 1.1))
    B(m, 2.9, .07, .9, '#9a6a43', at(0, .55, 0), (0, r, 0))
    for sz in (-1, 1): m.part('SphereGeometry', '#ffffff', at(1.65, .55, sz * .22), radius=.07); m.part('SphereGeometry', '#c62828', at(1.69, .55, sz * .22), radius=.04)
    m.part('CylinderGeometry', '#c8a060', at(-.8, .7, 0), (0, r, math.pi / 2), radiusTop=.45, radiusBottom=.45, height=1.1, radialSegments=10, thetaStart=0, thetaLength=math.pi)
    for i, c in enumerate(fruit): m.part('SphereGeometry', c, at(.3 + (i % 3) * .32, .75, -.25 + (i // 3) * .4), radius=.18, widthSegments=8, heightSegments=6)
    if pole: C(m, .04, .04, 3.4, '#6a4a32', at(1.1, 2.1, 0), seg=4); m.part('SphereGeometry', fruit[0], at(1.1, 3.85, 0), radius=.3, widthSegments=8, heightSegments=6)

def hand_s2_mekong(m, sp):
    # the Mekong delta: a canal under coconut palms, a monkey bridge (one bamboo pole to walk on and a handrail) on crossed
    # bamboo legs, and two market boats with their cay beo poles
    B(m, 10, .06, 3.2, '#5fa8b8', (0, .04, 0))
    for sz in (-1, 1): B(m, 10.4, .3, .5, '#8a7a4a', (0, .1, sz * 1.75))
    tube(m, [(-4.6, 1.1, 0), (0, 1.0, 0), (4.6, 1.1, 0)], [.09, .09, .09], '#c8a060', seg=6)
    tube(m, [(-4.6, 2.1, -.25), (0, 2.0, -.25), (4.6, 2.1, -.25)], [.05, .05, .05], '#c8a060', seg=5)
    for x in (-4.2, -1.4, 1.4, 4.2):
        for sz in (-1, 1): tube(m, [(x + sz * .35, -.1, sz * .3), (x - sz * .15, 1.3, 0)], [.07, .06], '#a87a40', seg=5)
        C(m, .05, .05, 1.1, '#a87a40', (x, 1.6, -.25), seg=5)
    boat(m, -3, -.2, .1, ['#ffd23f', '#5fd36a', '#ff9f43', '#e8433a', '#ffd23f', '#5fd36a'])
    boat(m, 3.2, .3, -.08, ['#5fd36a', '#e8433a', '#ffd23f', '#ff9f43', '#5fd36a', '#e8433a'])
    for x in (-4.8, 4.9):   # coconut palms on the banks
        tube(m, [(x, 0, -1.5), (x + .3, 1.8, -1.5), (x + .6, 3.5, -1.4)], [.14, .12, .1], '#9a7a5a', seg=6)
        for k in range(6): b = k / 6 * TAU; tube(m, [(x + .6, 3.5, -1.4), (x + .6 + math.cos(b) * .9, 3.6, -1.4 + math.sin(b) * .9), (x + .6 + math.cos(b) * 1.5, 3.1, -1.4 + math.sin(b) * 1.5)], [.12, .1, .03], '#4f9a3a', seg=4, scale=(1, .35))

def hand_s2_halong(m, sp):
    # Hon Trong Mai (Ha Long): two tall rocks face to face like a rooster and a hen, standing in the sea with green tufts
    crag(m, -1.8, 0, 1.4, 4.4, ['#a8a092', '#9a9488', '#b4ac9e'], seed=3, seg=8, taper=.5, lean=(.08, 0), y0=-1.0)
    crag(m, 1.8, .2, 1.15, 3.6, ['#9a9488', '#a8a092', '#8f897e'], seed=7, seg=8, taper=.5, lean=(-.08, 0), y0=-1.0)
    m.part('IcosahedronGeometry', '#4f8f42', (-1.6, 3.4, -.2), (0, 0, 0), (1.2, .5, 1.2), radius=.6, detail=1)
    m.part('IcosahedronGeometry', '#4f8f42', (1.6, 2.7, .1), (0, 0, 0), (1.2, .5, 1.2), radius=.5, detail=1)
    for x in (-1.8, 1.8): m.part('TorusGeometry', '#ffffff', (x, .02, 0), (math.pi / 2, 0, 0), radius=1.3, tube=.1, radialSegments=4, tubularSegments=16)

def hand_s2_sapa(m, sp):
    # Sa Pa's rice terraces: curving steps of green and flooded paddies climbing a hill, little earth walls between them, a
    # thatched hut and a peach tree in flower
    cols = ['#5fa8c8', '#7ac860', '#5fae4a', '#8fd06a', '#4f9a3a']
    for i in range(5):
        w, d, y, z = 9 - i * 1.5, 6 - i * 1.1, .25 + i * .5, -i * .4
        m.part('CylinderGeometry', cols[i], (0, y, z), (0, 0, 0), (w / 2, 1, d / 2), radiusTop=1, radiusBottom=1.02, height=.5, radialSegments=20)
        m.part('TorusGeometry', '#8a6a42', (0, y + .25, z), (math.pi / 2, 0, 0), (w / 2, d / 2, 1), radius=1, tube=.05, radialSegments=4, tubularSegments=24)
    B(m, 1.2, .8, 1.0, '#a07a4a', (-1.2, 2.9, -1.6)); viet_roof(m, 1.2, 1.0, .7, '#c8b070', (-1.2, 3.3, -1.6), curl=.05, over=.25)
    tube(m, [(4.2, 0, 2.2), (4.25, .9, 2.2), (4.1, 1.5, 2.3)], [.16, .12, .08], '#6a4a32', seg=6)
    for k in range(7): m.part('SphereGeometry', '#ff9ec4' if k % 2 else '#ffb8d4', (4.2 + math.cos(k) * .6, 1.8 + (k % 2) * .3, 2.2 + math.sin(k) * .6), radius=.38, widthSegments=8, heightSegments=6)

def hand_s2_taynguyen(m, sp):
    # the Central Highlands' nha rong: a communal house on stilts under a towering axe-blade thatched roof with patterned
    # gable ends, a log ladder, and a rack of bronze gongs beside it
    wood, thatch, dark = '#b08a5a', '#a8864a', '#6a4a32'
    for x in (-1.6, 0, 1.6):
        for z in (-1.2, 1.2): C(m, .12, .14, 1.5, dark, (x, .75, z), seg=6)
    B(m, 4.2, .15, 3.2, '#8a6a42', (0, 1.45, 0)); B(m, 4, 1.4, 3, wood, (0, 2.2, 0))
    for k in range(10): B(m, .05, 1.3, .05, '#8a6a42', (-1.8 + k * .4, 2.2, 1.52))
    # the axe-blade roof: two tall steep faces meeting in a long ridge that flares at both ends
    v = [(-2.3, 2.9, -1.9), (2.3, 2.9, -1.9), (2.3, 2.9, 1.9), (-2.3, 2.9, 1.9), (-.9, 9.0, 0), (.9, 9.0, 0)]
    f = [[0, 4, 5, 1], [2, 5, 4, 3], [0, 3, 4], [1, 5, 2]]
    m.add((v, f), thatch); m.add((v, [q[::-1] for q in f]), tint(thatch, .7))
    for sz in (-1, 1):   # the patterned gable ends
        for k in range(4): m.part('BoxGeometry', ('#c62828', '#f4ead2')[k % 2], (sz * 1.75 * 0 + 0, 4.0 + k * 1.1, 0), width=.1, height=.12, depth=.1) if False else None
    for k in range(5): m.part('BoxGeometry', ('#c62828', '#f4ead2')[k % 2], (0, 3.6 + k * 1.0, 0), (0, 0, 0), (1, 1, 1), width=4.1 - k * .7, height=.12, depth=3.82 - k * .7 if False else .02) if False else None
    tube(m, [(-.9, 9.0, 0), (-1.3, 9.5, 0)], [.12, .05], '#c62828', seg=5); tube(m, [(.9, 9.0, 0), (1.3, 9.5, 0)], [.12, .05], '#c62828', seg=5)
    m.part('ConeGeometry', '#e8433a', (0, 9.3, 0), radius=.3, height=.8, radialSegments=4)
    tube(m, [(0, 0, 2.6), (0, 1.5, 1.6)], [.18, .16], '#8a5a32', seg=6)   # the log ladder
    B(m, 2.4, .1, .1, dark, (3.6, 2.2, 0)); C(m, .05, .05, 2.2, dark, (2.5, 1.1, 0), seg=5); C(m, .05, .05, 2.2, dark, (4.7, 1.1, 0), seg=5)
    for x, r in ((3, .45), (3.7, .35), (4.3, .28)):
        m.part('CylinderGeometry', '#e8b830', (x, 2.2 - r - .1, 0), (math.pi / 2, 0, 0), radiusTop=r, radiusBottom=r, height=.08, radialSegments=16)
        m.part('SphereGeometry', '#c9962a', (x, 2.2 - r - .1, .05), (0, 0, 0), (1, 1, .4), radius=r * .3, widthSegments=8, heightSegments=6)


def hand_longbien(m, sp):
    # Long Bien bridge (Ha Noi): the old rust-red steel truss: spans with curved (camel-back) top chords, criss-cross
    # diagonals and portal frames over the road, on stone piers with rounded cutwaters (the deck where the child walks
    # stays exactly as the game's)
    d = sp['parts'][0]['p']; L = d['width'] - 2; W = d['depth']; hw = W / 2; rust, rust2, stone = '#7a4a3a', '#6a3a2e', '#9c9284'
    B(m, L + 2, .5, W, '#6d6a66', (0, -.25, 0)); B(m, L + 2, .06, W - 2.2, '#b4b9bc', (0, .03, 0))
    for sz in (-1, 1): B(m, L + 2, .1, 1, '#d9d4c8', (0, .07, sz * (hw - .5)))
    piers = [-.3 * L, 0, .3 * L]
    for x in piers:
        B(m, 1.8, 12, W - .6, stone, (x, -6, 0))
        for sz in (-1, 1): m.part('CylinderGeometry', stone, (x, -6, sz * (hw - .3)), radiusTop=.9, radiusBottom=.9, height=12, radialSegments=10)
    ends = [-L / 2 - 1] + piers + [L / 2 + 1]
    for sz in (-1, 1):
        zz = sz * (hw - .15)
        for a0, a1 in zip(ends, ends[1:]):
            n = 6; top = lambda t: 3.2 + 1.4 * math.sin(math.pi * t)
            pts = [(a0 + (a1 - a0) * i / n, top(i / n)) for i in range(n + 1)]
            for i in range(n):
                (xa, ya), (xb, yb) = pts[i], pts[i + 1]
                m.part('BoxGeometry', rust, ((xa + xb) / 2, (ya + yb) / 2, zz), (0, 0, math.atan2(yb - ya, xb - xa)), width=math.hypot(xb - xa, yb - ya) + .05, height=.3, depth=.3)
                for (x0, y0, x1, y1) in ((xa, .45, xb, yb), (xa, ya, xb, .45)):   # the X diagonals
                    m.part('BoxGeometry', rust2, ((x0 + x1) / 2, (y0 + y1) / 2, zz), (0, 0, math.atan2(y1 - y0, x1 - x0)), width=math.hypot(x1 - x0, y1 - y0), height=.13, depth=.13)
            for (x, y) in pts: m.part('BoxGeometry', rust, (x, y / 2 + .2, zz), width=.22, height=y - .3, depth=.22)
            m.part('BoxGeometry', rust, ((a0 + a1) / 2, .45, zz), width=a1 - a0, height=.3, depth=.3)
    for a0, a1 in zip(ends, ends[1:]):   # the portal frames over the road
        for t in (.2, .5, .8):
            x = a0 + (a1 - a0) * t; m.part('BoxGeometry', rust, (x, 3.2 + 1.4 * math.sin(math.pi * t) - .1, 0), width=.2, height=.2, depth=W - .3)

def hand_chuacau(m, sp):
    # Chua Cau, Hoi An's Japanese covered bridge: an arched wooden footbridge with red posts and yellow walls under a
    # tiled roof, the little temple room in the middle with its own curled roof, stone piers below
    d = sp['parts'][0]['p']; L = d['width'] - 1; W = d['depth']; hw = W / 2
    B(m, L + 1, .4, W, '#8a5a3b', (0, -.2, 0)); B(m, L + 1, .06, W - .4, '#a87a4a', (0, .03, 0))
    n = round(L / 2)
    for sz in (-1, 1):
        B(m, L + 1, .7, .12, '#e8c03a', (0, .35, sz * (hw - .06)))
        for i in range(n + 1):
            x = -L / 2 - .5 + i * (L + 1) / n
            C(m, .1, .1, 2.4, '#c0392b', (x, 1.2, sz * (hw - .1)), seg=8)
            B(m, .3, .12, .3, '#5a3a2a', (x, .05, sz * (hw - .1)))
        B(m, L + 1.2, .16, .2, '#8a3a22', (0, 2.45, sz * (hw - .1)))
    viet_roof(m, L + .6, W, 1.0, '#a24e3a', (0, 2.55, 0), curl=.35, over=.55, ridge_color='#7a3a22')
    B(m, 1.6, 1.4, 1.6, '#f2c230', (0, 3.5, 0)); viet_roof(m, 1.6, 1.6, .7, '#a24e3a', (0, 4.2, 0), curl=.4, over=.3, ridge_color='#7a3a22')
    B(m, .8, .4, .06, '#c62828', (0, 3.7, .82)); B(m, .5, .2, .07, '#ffd23f', (0, 3.7, .84))
    for i in range(2): B(m, 1.4, 6, W + .2, '#9c8a6a', ((-.3 + .6 * i) * L, -3.2, 0))

HAND = {'lm-turtle': hand_turtle, 'lm-thehuc': hand_thehuc, 'lm-vanmieu': hand_vanmieu, 'lm-onepillar': hand_onepillar,
        'lm-benthanh': hand_benthanh, 'lm-opera': hand_opera, 'br-harbour': hand_harbour}
HAND.update({n: fn for n, (fn, size) in PROPS.items()})
HAND.update({'lm-sydneytower': hand_sydneytower, 'lm-lunapark': hand_lunapark, 'lm-banana': hand_banana, 'lm-lighthouse': hand_lighthouse, 'lm-goldenbridge': hand_goldenbridge, 'lm-uluru': hand_uluru})
HAND.update({'lm-puppetstage': hand_puppetstage, 'lm-bnclock': hand_bnclock, 'lm-chuadau': hand_chuadau, 'lm-butthap': hand_butthap, 'lm-dendo': hand_dendo, 'lm-quanho': hand_quanho})
HAND.update({'lm-bondi': hand_bondi, 'lm-wtram': hand_wtram, 'lm-marble': hand_marble, 'lm-hoian': hand_hoian, 'lm-cairang': hand_cairang, 'lm-apostles': hand_apostles})
HAND.update({'lm-forbidden': hand_forbidden, 'lm-heaven': hand_heaven, 'lm-potala': hand_potala, 'lm-qutub': hand_qutub, 'lm-redfort': hand_redfort, 'lm-sisters': hand_sisters})
HAND.update({'lm-halong': hand_halong, 'lm-myson': hand_myson, 'lm-trangan': hand_trangan, 'lm-cave': hand_cave, 'lm-kakadu': hand_kakadu, 'lm-reef': hand_reef})
HAND.update({'lm-wheelbase': hand_wheelbase, 'lm-lonepine': hand_lonepine, 'lm-exhibition': hand_exhibition, 'lm-terracotta': hand_terracotta, 'lm-konark': hand_konark, 'lm-hampi': hand_hampi, 'lm-mahabodhi': hand_mahabodhi})
HAND.update({'lm-s2-mekong': hand_s2_mekong, 'lm-s2-halong': hand_s2_halong, 'lm-s2-sapa': hand_s2_sapa, 'lm-s2-taynguyen': hand_s2_taynguyen})
HAND.update({'br-longbien': hand_longbien, 'br-chuacau': hand_chuacau})
HAND.update({'lm-cathedral': hand_cathedral, 'lm-postoffice': hand_postoffice, 'lm-flinders': hand_flinders, 'lm-hue': hand_hue})
BUDGET = lambda name: 8000 if name.startswith(('lm-', 'br-')) else 900 if name.startswith('pr-') else 3000

# ---------- making and saving one model ----------
def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes): bpy.data.meshes.remove(me)

def material():
    mt = bpy.data.materials.get('places') or bpy.data.materials.new('places')
    mt.use_nodes = True
    nt = mt.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    if not any(n.type == 'VERTEX_COLOR' for n in nt.nodes):
        vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = .9
    return mt

def bake_ao(me, dist):
    """(v1.08e refinement) soft shading baked into the corner colours: creases, eaves, doorways and the joins between parts
    a little darker, as in a picture book; no texture, no extra triangles (Cycles on the processor)"""
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 32
    if not sc.world: sc.world = bpy.data.worlds.new('w')
    sc.world.light_settings.distance = dist
    ao = me.color_attributes.new('AO', 'FLOAT_COLOR', 'CORNER'); me.color_attributes.active_color = ao
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    n = len(me.loops); a = [0.] * (n * 4); c = [0.] * (n * 4)
    me.color_attributes['AO'].data.foreach_get('color', a); me.color_attributes['Col'].data.foreach_get('color', c)
    for i in range(n):
        f = .66 + .34 * min(1., a[i * 4] * 1.5)   # (open faces stay their own colour; only creases darken)
        c[i * 4] *= f; c[i * 4 + 1] *= f; c[i * 4 + 2] *= f
    me.color_attributes['Col'].data.foreach_set('color', c)
    me.color_attributes.remove(me.color_attributes['AO']); me.color_attributes.active_color = me.color_attributes['Col']

def build(name, sp):
    clear(); m = Model(); REMAKE[0] = name not in HAND
    (HAND.get(name) or (lambda m, sp: from_spec(m, sp)))(m, sp)
    DETAIL[0] = 2
    while not (name in HAND) and DETAIL[0] > 0 and len(m.bm.faces) > BUDGET(name) * .55:   # too heavy: less detail
        DETAIL[0] -= 1; m.bm.free(); m = Model(); from_spec(m, sp)
    if REMAKE[0] and len(m.bm.faces) > BUDGET(name) * .6:   # many round parts: keep the code shape's own number of sides
        m.bm.free(); m = Model(); REMAKE[0] = False; from_spec(m, sp)
    print('  detail', DETAIL[0], flush=True)
    bmesh.ops.remove_doubles(m.bm, verts=m.bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name); m.bm.to_mesh(me); m.bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    me.color_attributes.active_color = me.color_attributes['Col']
    # the picture-book softness: a small bevel on the hard edges, then smooth shading kept sharp across real corners
    size = max(sp['box']['max'][i] - sp['box']['min'][i] for i in range(3))
    base = sum(len(p.vertices) - 2 for p in me.polygons)
    seg = 2 if base * 9 < BUDGET(name) else 1 if base * 4 < BUDGET(name) else 0
    if name.startswith('pr-'): seg = 0   # (props are small and merged by the hundred: no bevel)   # (one bevel step makes about 4 times the triangles)
    if seg:
        bv = ob.modifiers.new('soft', 'BEVEL'); bv.width = min(.05, max(.012, size * .004)); bv.segments = seg; bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(40); bv.use_clamp_overlap = True; bv.harden_normals = False
        bpy.ops.object.modifier_apply(modifier='soft')
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    print('  base', base, 'bevel', seg, 'tris', tris, flush=True)
    if tris > BUDGET(name): print('  OVER BUDGET', name, tris, flush=True)   # (no thinning: it breaks small parts apart; make the model lighter)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    me.materials.append(material())
    bake_ao(me, min(1.2, max(.25, size * .09)))
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    path = os.path.join(OUT, name + '.raw.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_texcoords=False, export_normals=True, export_vertex_color='ACTIVE', export_materials='EXPORT', export_animations=False)
    print('MODEL', name, 'tris', tris, 'hand' if name in HAND else 'remade', flush=True)

for name, sp in SPECS.items():
    if ONLY and name not in ONLY: continue
    build(name, sp)

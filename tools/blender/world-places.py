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
REMAKE = [True]   # rebuilding a code shape: round parts get more sides; a hand model keeps the sides it asks for

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
            elif geo == 'TorusGeometry': p.setdefault('radialSegments', 6); p.setdefault('tubularSegments', 20)
        vf = geo if isinstance(geo, tuple) else (g_poly(geo, **p) if geo in POLY else GEO[geo](**p))
        if hip is None: hip = geo == 'ConeGeometry' and p.get('radialSegments') == 4 and not rot[0] and not rot[2] and sc[0] != sc[2]
        self.add(vf, color, part_matrix(pos, rot, sc, hip))

def from_spec(m, sp):
    """the code shape rebuilt part by part"""
    for p in sp['parts']:
        t = p['type']
        if p.get('tris'):   # a shape with no simple recipe (an extruded sign or roof): its triangles as the game made them
            a = p['tris']; v = [(a[i], a[i + 1], a[i + 2]) for i in range(0, len(a), 3)]
            m.add((v, [[i, i + 1, i + 2] for i in range(0, len(v), 3)]), p['color']); continue
        if t not in GEO and t not in POLY: print('SKIP part', t, flush=True); continue
        m.part(t, p['color'], p['pos'], p['rot'], p['scl'], hip=p.get('hip', False), **(p.get('p') or {}))

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
    for s in (-1, 1):   # two dragons on the ridge
        m.part('CylinderGeometry', '#d9b44a', (s * .3, 3.75, 0), (0, 0, s * .9), radiusTop=.03, radiusBottom=.07, height=.5, radialSegments=6)
    m.part('SphereGeometry', '#ffd23f', (0, 3.82, 0), radius=.09, widthSegments=10, heightSegments=8)

def hand_benthanh(m, sp):
    # Cho Ben Thanh: the long low market hall and its clock tower over the main door (the front faces -x, the street)
    cream, rust = '#f2e6c2', '#a24e3a'
    B(m, 3.0, 4.6, 10, cream, (0, 2.3, 0))
    B(m, 3.2, .3, 10.2, '#e2d2a8', (0, 4.7, 0))
    for zz in (-3.3, 3.3):   # the two side wings, each with its low hipped roof
        m.part('ConeGeometry', rust, (0, 5.35, zz), (0, math.pi / 4, 0), (1.6, 1, 1.6), radius=1.414, height=1.0, radialSegments=4)
    # the main front: a taller gable with three arched doors
    B(m, .4, 5.6, 4.2, cream, (-1.52, 2.8, 0))
    for z in (-1.3, 0, 1.3): arch_door(m, .95, 2.4, '#5a3a2a', (-1.73, 0, z), -math.pi / 2)
    for z in (-3.6, -2.6, 2.6, 3.6): arch_door(m, .7, 1.8, '#6a4a3a', (-1.51, .3, z), -math.pi / 2)
    for z in (-1.3, 0, 1.3): m.part('TorusGeometry', '#d8b86a', (-1.74, 2.0, z), (0, math.pi / 2, 0), radius=.5, tube=.08, arc=math.pi)
    # the clock tower
    B(m, 2.4, 3.2, 2.4, cream, (0, 7.2, 0))
    B(m, 2.7, .25, 2.7, '#e2d2a8', (0, 8.9, 0))
    for a in (-math.pi / 2, math.pi / 2, 0, math.pi):
        dx, dz = math.sin(a) * 1.22, math.cos(a) * 1.22
        Mx = Matrix.Translation((dx, 7.6, dz)) @ Matrix.Rotation(a, 4, 'Y') @ Matrix.Rotation(math.pi / 2, 4, 'X')
        m.add(g_cyl(.78, .78, .1, 24), '#ffffff', Mx)
        m.add(g_torus(.8, .07, 6, 24), '#2b2238', Matrix.Translation((dx, 7.6, dz)) @ Matrix.Rotation(a, 4, 'Y') @ Matrix.Translation((0, 0, .06)))
        m.add(g_box(.06, .55, .05), '#333333', Matrix.Translation((dx, 7.6, dz)) @ Matrix.Rotation(a, 4, 'Y') @ Matrix.Translation((0, .22, .08)))
        m.add(g_box(.4, .06, .05), '#333333', Matrix.Translation((dx, 7.6, dz)) @ Matrix.Rotation(a, 4, 'Y') @ Matrix.Translation((.16, 0, .08)))
    m.part('ConeGeometry', rust, (0, 9.7, 0), (0, math.pi / 4, 0), radius=1.8, height=1.4, radialSegments=4)
    C(m, .04, .04, .8, '#c9a24a', (0, 10.6, 0), seg=6)

def hand_opera(m, sp):
    # The Sydney Opera House: the stepped granite podium and its interlocking white shells, two rows of sails opening to
    # the harbour, in the code shape's frame (16 x 10 podium; the sails rise along x, the first ones the tallest)
    B(m, 16, 1.6, 10, '#cdb89a', (0, .8, 0))
    B(m, 16, .3, 2, '#d9c9aa', (0, .15, 6))
    for i in range(5):   # the grand stairs at the land end
        B(m, 5, .32, .5, '#d9c9aa', (-5.5, .16 + i * .32, -5.25 + i * .02))
    white, shade = '#f6f3ec', '#e4ded2'
    def sail(x, z, s, face, tilt=.2):
        # one shell pair: an outer sail and a smaller one tucked behind, opening towards face (+1: +x, -1: -x)
        Mx = Matrix.Translation((x, 1.6, z)) @ Matrix.Rotation(-math.pi / 2 * face, 4, 'Y') @ Matrix.Rotation(-tilt, 4, 'X')
        shell(m, 3.2 * s, -.95, 1.9, .05, 1.45, .12, white, Mx)
        Mx2 = Matrix.Translation((x - face * 1.2 * s, 1.6, z)) @ Matrix.Rotation(-math.pi / 2 * face, 4, 'Y') @ Matrix.Rotation(-tilt * .5, 4, 'X')
        shell(m, 2.5 * s, -.85, 1.7, .2, 1.3, .1, shade, Mx2)
    # the big hall row (z > 0) and the smaller row (z < 0), each a line of sails, a restaurant shell at the end
    for k, (x, s) in enumerate(((-3.6, 1.15), (-1.2, 1.0), (.9, .82))): sail(x, 1.6, s, 1)
    for k, (x, s) in enumerate(((-3.2, .95), (-1.1, .82), (.7, .68))): sail(x, -2.2, s, 1)
    sail(4.4, .2, .7, -1)
    # the glass walls under the sails' mouths
    for (x, z, w) in ((2.3, 1.6, 3.0), (2.0, -2.2, 2.4)):
        B(m, .1, 1.6, w, '#7fa9b8', (x, 2.4, z))

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

HAND = {'lm-turtle': hand_turtle, 'lm-thehuc': hand_thehuc, 'lm-vanmieu': hand_vanmieu, 'lm-onepillar': hand_onepillar,
        'lm-benthanh': hand_benthanh, 'lm-opera': hand_opera, 'br-harbour': hand_harbour}
BUDGET = lambda name: 8000 if name.startswith(('lm-', 'br-')) else 3000

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

def build(name, sp):
    clear(); m = Model(); REMAKE[0] = name not in HAND
    (HAND.get(name) or (lambda m, sp: from_spec(m, sp)))(m, sp)
    if REMAKE[0] and len(m.bm.faces) > BUDGET(name) * .6:   # many round parts: keep the code shape's own number of sides
        m.bm.free(); m = Model(); REMAKE[0] = False; from_spec(m, sp)
    bmesh.ops.remove_doubles(m.bm, verts=m.bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name); m.bm.to_mesh(me); m.bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    me.color_attributes.active_color = me.color_attributes['Col']
    # the picture-book softness: a small bevel on the hard edges, then smooth shading kept sharp across real corners
    size = max(sp['box']['max'][i] - sp['box']['min'][i] for i in range(3))
    base = sum(len(p.vertices) - 2 for p in me.polygons)
    seg = 2 if base * 9 < BUDGET(name) else 1 if base * 4 < BUDGET(name) else 0   # (one bevel step makes about 4 times the triangles)
    if seg:
        bv = ob.modifiers.new('soft', 'BEVEL'); bv.width = min(.05, max(.012, size * .004)); bv.segments = seg; bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(40); bv.use_clamp_overlap = True; bv.harden_normals = False
        bpy.ops.object.modifier_apply(modifier='soft')
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    print('  base', base, 'bevel', seg, 'tris', tris, flush=True)
    if tris > BUDGET(name): print('  OVER BUDGET', name, tris, flush=True)   # (no thinning: it breaks small parts apart; make the model lighter)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    me.materials.append(material())
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    path = os.path.join(OUT, name + '.raw.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_texcoords=False, export_normals=True, export_vertex_color='ACTIVE', export_materials='EXPORT', export_animations=False)
    print('MODEL', name, 'tris', tris, 'hand' if name in HAND else 'remade', flush=True)

for name, sp in SPECS.items():
    if ONLY and name not in ONLY: continue
    build(name, sp)

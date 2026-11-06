# (v1.08e vehicles, owner 6 Nov 2026 AEDT) Every vehicle a child sees or rides, modelled in Blender for js/modelkit.ts:
# models/world/veh-<id>.glb and boat-<id>.glb.
# The owner saw the first models ("they need better refinement, need to have souls and more real, at the moment they
# look like ugly toys") and chose "stylised real": real shapes and proportions, smooth curved panels, shiny paint,
# chrome, rubber tyres, see-through glass, lamps and the small parts real vehicles have, like an animated film.
# Each vehicle is modelled anew here. Only its frame comes from the game (tools/vehicle-blueprints.mts): where each wheel
# turns and its size, the seat and handle points, the moving parts' pivots and the overall box, so the riders sit where
# the code puts them and colliders stay true.
# Every part carries its colours in the corners (Col) and one material per kind, which js/vehicle-models.ts turns into
# the game's materials: paint (glossy), matte (rubber, plastic, seats, wood), chrome (metal), glass (see-through), and
# wheel (each wheel is one piece). Soft shadows (Cycles ambient occlusion) are baked into the corner colours.
#   node tools/vehicle-blueprints.mts /tmp/bp.json
#   blender -b -P tools/blender/world-vehicles.py -- /tmp/bp.json <out dir> [names...]
#   then gltfpack (tools/make-world-vehicles.mts does all of it)
import bpy, bmesh, sys, os, json, math
from mathutils import Vector, Matrix, Euler, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:]
BP, OUT = argv[0], argv[1]; ONLY = set(a for a in argv[2:] if not a.startswith('-'))
os.makedirs(OUT, exist_ok=True)
DATA = json.load(open(BP))
KINDS = ['paint', 'matte', 'chrome', 'glass', 'wheel']
PI = math.pi

# ---------------------------------------------------------------- the kit (all coordinates are the game's: x, y up, z forward)
def B(p): return Vector((p[0], -p[2], p[1]))
def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)
def lerp(a, b, t): return a + (b - a) * t

PIECES = []   # (object, part)
def make(name, bm, part, pal, sub=0, bevel=0, seg=2, smooth=True):
    """a finished piece: pal is [(colour, kind)], each face's material_index picks one"""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o['pal'] = json.dumps(pal)
    if bevel:
        m = o.modifiers.new('bv', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'ANGLE'; m.angle_limit = math.radians(30)
    if sub:
        m = o.modifiers.new('ss', 'SUBSURF'); m.levels = sub; m.render_levels = sub
    PIECES.append((o, part)); return o

def xform(p, c=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    v = Vector((p[0] * scl[0], p[1] * scl[1], p[2] * scl[2]))
    v.rotate(Euler(rot, 'XYZ')); return v + Vector(c)

def rbox(col, kind, c, size, r=.02, rot=(0, 0, 0), part='body', seg=2):
    """a box with soft rounded edges"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = B(xform(v.co, c, rot, size))
    return make('box', bm, part, [(col, kind)], bevel=min(r, min(size) * .45), seg=seg)

def ell(col, kind, c, r, rot=(0, 0, 0), part='body', seg=16, rings=10):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    for v in bm.verts: v.co = B(xform(v.co, c, rot, r))
    return make('ell', bm, part, [(col, kind)])

def basis(axis):
    a = Vector(axis).normalized(); t = Vector((0, 1, 0)) if abs(a.y) < .9 else Vector((1, 0, 0))
    u = a.cross(t).normalized(); w = a.cross(u).normalized(); return a, u, w

def lathe(col, kind, prof, c, axis=(1, 0, 0), seg=24, closed=False, part='body', arc=(0, 2 * PI), pal=None):
    """turn a profile [(radius, along)] about an axis through c; closed: the profile is a loop (a tyre)"""
    a, u, w = basis(axis); c = Vector(c); bm = bmesh.new(); rings = []
    full = abs(arc[1] - arc[0] - 2 * PI) < 1e-6; n = seg if full else seg + 1
    for r, t in prof:
        if r < 1e-5: v = bm.verts.new(B(c + a * t)); rings.append([v] * n); continue
        rings.append([bm.verts.new(B(c + a * t + (u * math.cos(arc[0] + (arc[1] - arc[0]) * k / seg) + w * math.sin(arc[0] + (arc[1] - arc[0]) * k / seg)) * r)) for k in range(n)])
    m = len(rings) if closed else len(rings) - 1
    for i in range(m):
        A, Bq = rings[i], rings[(i + 1) % len(rings)]
        for k in range(n if full else n - 1):
            k2 = (k + 1) % n; vs2 = []
            for v in (A[k], A[k2], Bq[k2], Bq[k]):
                if v not in vs2: vs2.append(v)
            if len(vs2) >= 3:
                try: bm.faces.new(vs2)
                except ValueError: pass
    return make('lathe', bm, part, pal or [(col, kind)])

def catmull(pts, k=5):
    pts = [Vector(p) for p in pts]
    if len(pts) < 3: return pts
    out = []; P = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for s in range(k):
            t = s / k; t2, t3 = t * t, t * t * t
            out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(pts[-1]); return out

def sweep(col, kind, pts, radii, seg=14, n=2.0, part='body', k=5, cap=True, side=None, sub=0):
    """a smooth body along a path: each point has a cross-section (rx across, ry up) with a squareness n (2 round,
    4 and more boxy); side: the across direction (default the game's x)"""
    src = [Vector(p) for p in pts]; P = catmull(src, k) if len(src) > 2 else src
    rad = [tuple(r) if isinstance(r, (tuple, list)) else (r, r) for r in radii]
    if len(rad) == 1: rad = rad * 2
    def rr(t):
        x = t * (len(rad) - 1); i = min(int(x), len(rad) - 2); f = x - i
        return (lerp(rad[i][0], rad[i + 1][0], f), lerp(rad[i][1], rad[i + 1][1], f))
    L = [0]
    for i in range(1, len(P)): L.append(L[-1] + (P[i] - P[i - 1]).length)
    tot = L[-1] or 1
    bm = bmesh.new(); rings = []
    S0 = Vector(side) if side else Vector((1, 0, 0))
    for i, p in enumerate(P):
        T = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized()
        S = (S0 - T * S0.dot(T)); S = S.normalized() if S.length > 1e-4 else T.orthogonal().normalized()
        U = T.cross(S).normalized()
        if U.dot(Vector((0, 1, 0))) < -1e-6 or (abs(U.y) < 1e-6 and U.z < 0): U = -U
        rx, ry = rr(L[i] / tot); ring = []
        for j in range(seg):
            a = 2 * PI * j / seg; ca, sa = math.cos(a), math.sin(a)
            ex = math.copysign(abs(ca) ** (2 / n), ca); ey = math.copysign(abs(sa) ** (2 / n), sa)
            ring.append(bm.verts.new(B(p + S * ex * rx + U * ey * ry)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for j in range(seg):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % seg], rings[i + 1][(j + 1) % seg], rings[i + 1][j]))
    if cap:
        for ring, rev in ((rings[0], True), (rings[-1], False)):
            c = bm.verts.new(sum((v.co for v in ring), Vector()) / seg)
            for j in range(seg):
                bm.faces.new((ring[j], ring[(j + 1) % seg], c) if not rev else (ring[(j + 1) % seg], ring[j], c))
    return make('sweep', bm, part, [(col, kind)], sub=sub)

def tube(col, kind, pts, r, seg=8, part='body', k=5, cap=True):
    return sweep(col, kind, pts, [r], seg=seg, part=part, k=k, cap=cap)

def arc_pts(c, rad, a0, a1, n=10, x=0):
    """points on an arc about c in the y-z plane, the angle from +z towards +y"""
    c = Vector(c); out = []
    for i in range(n + 1):
        a = math.radians(lerp(a0, a1, i / n))
        out.append(c + Vector((x, math.sin(a) * rad, math.cos(a) * rad)))
    return out

def loft(sections, pal, kind_fn, part='body', sub=1, cap=True):
    """a closed body from cross-section loops (each a list of game points, all the same count)"""
    bm = bmesh.new(); rows = [[bm.verts.new(B(p)) for p in s] for s in sections]; n = len(sections[0])
    for i in range(len(rows) - 1):
        for j in range(n):
            f = bm.faces.new((rows[i][j], rows[i][(j + 1) % n], rows[i + 1][(j + 1) % n], rows[i + 1][j]))
            ctr = (Vector(sections[i][j]) + Vector(sections[i][(j + 1) % n]) + Vector(sections[i + 1][j]) + Vector(sections[i + 1][(j + 1) % n])) / 4
            f.material_index = kind_fn(i, j, ctr)
    if cap:
        for row, rev in ((rows[0], True), (rows[-1], False)):
            c = bm.verts.new(sum((v.co for v in row), Vector()) / n)
            for j in range(n):
                f = bm.faces.new((row[(j + 1) % n], row[j], c) if rev else (row[j], row[(j + 1) % n], c)); f.material_index = 0
    return make('loft', bm, part, pal, sub=sub)

# ---------------------------------------------------------------- colours
CHROME, STEEL, ALU, BLACK, TYRE, RUBBER = '#dfe4e8', '#9aa4a8', '#b9bfc3', '#232528', '#232426', '#3a3d40'
LENS, AMBER, TAIL, GLASS, WOOD, WOOD2 = '#fff6d8', '#ffb43a', '#d8322a', '#4f6f82', '#8a6a3e', '#a57d4b'
PLATE, SEATC = '#f2f2ec', '#2b2624'

# ---------------------------------------------------------------- common parts
def lamp(c, r, axis=(0, 0, 1), depth=.06, body=CHROME, part='body'):
    """a round lamp: a chrome bowl and a glass lens, facing along axis"""
    a = Vector(axis).normalized(); c = Vector(c)
    lathe(body, 'chrome', [(0, -depth), (r * .55, -depth * .9), (r * .95, -depth * .35), (r * 1.05, 0), (r, depth * .15)], c, a, 18, part=part)
    lathe(LENS, 'glass', [(r * .98, depth * .1), (r * .7, depth * .35), (0, depth * .45)], c, a, 18, part=part)

def plate(c, col=PLATE, w=.16, h=.1, facing=1, part='body'):
    rbox(col, 'matte', c, (w, h, .012), .004, part=part)
    rbox('#4a4a4a', 'matte', (c[0], c[1], c[2] + facing * .007), (w * .7, h * .22, .004), .001, part=part)

def mirror(base, top, part='body'):
    tube(CHROME, 'chrome', [base, top], .007, 6, part=part)
    lathe(CHROME, 'chrome', [(0, -.012), (.045, -.01), (.05, .006), (0, .01)], top, (0, 0, 1), 14, part=part)
    lathe('#cfe6f0', 'chrome', [(.04, .011), (0, .012)], top, (0, 0, 1), 14, part=part)

def grip(c, side, part='body'):
    lathe(BLACK, 'matte', [(0, -.055), (.02, -.052), (.019, -.02), (.021, .02), (.024, .05), (0, .055)], c, (side, 0, 0), 12, part=part)

def handlebar(gl, gr, mid_dy=.02, mid_dz=-.03, levers=True, part='body', col=CHROME):
    gl, gr = Vector(gl), Vector(gr); m = (gl + gr) / 2 + Vector((0, mid_dy, mid_dz))
    sl, sr = (1 if gl.x > 0 else -1), (1 if gr.x > 0 else -1)
    tube(col, 'chrome', [gr + Vector((-.05 * sr, 0, 0)), (gr + m) / 2 + Vector((0, .005, -.01)), m, (gl + m) / 2 + Vector((0, .005, -.01)), gl + Vector((-.05 * sl, 0, 0))], .012, 8, part=part)
    for g, s in ((gl, sl), (gr, sr)):
        grip(g + Vector((s * .01, 0, 0)), s, part)
        if levers: tube(STEEL, 'chrome', [g + Vector((-s * .05, .01, .02)), g + Vector((s * .02, -.005, .06)), g + Vector((s * .06, -.01, .05))], .006, 6, part=part)
    return m

def spoke_wheel(hub, R, tw, spokes=32, rim=CHROME, tyre=TYRE, knobby=False, drum=.07, part='body', thin=False):
    """a spoked wheel standing in the y-z plane: round tyre, rim, hub and crossed spokes"""
    hub = Vector(hub); tr = tw / 2
    prof = [(R - tr + math.cos(a) * tr * .95, math.sin(a) * tr) for a in [2 * PI * i / 8 for i in range(8)]]
    lathe(tyre, 'wheel', prof, hub, (1, 0, 0), 28 if thin else 26, closed=True, part=part)
    if knobby:
        for i in range(26):
            a = 2 * PI * i / 26
            rbox('#1d1e20', 'wheel', hub + Vector((0, math.sin(a) * (R - .004), math.cos(a) * (R - .004))), (tw * 1.05, .022, .03), .006, rot=(-a, 0, 0), part=part, seg=1)
    rr = R - tw * .95
    lathe(rim, 'wheel', [(rr - .012, -tr * .7), (rr + .006, -tr * .75), (rr + .012, -tr * .6), (rr + .012, tr * .6), (rr + .006, tr * .75), (rr - .012, tr * .7)], hub, (1, 0, 0), 30, closed=True, part=part)
    d, f = (drum, drum * .55) if not thin else (.05, .022)
    lathe(STEEL if not thin else CHROME, 'wheel', [(0, -d), (f, -d), (f * 1.1, -d * .5), (f * .8, 0), (f * 1.1, d * .5), (f, d), (0, d)], hub, (1, 0, 0), 14, part=part)
    for i in range(spokes):
        a = 2 * PI * i / spokes; side = 1 if i % 2 else -1; lead = .18 * side
        h = hub + Vector((side * d * .8, math.sin(a + lead) * f, math.cos(a + lead) * f))
        e = hub + Vector((side * .004, math.sin(a) * (rr - .01), math.cos(a) * (rr - .01)))
        tube('#c9d0d4', 'wheel', [h, e], .0028 if thin else .0035, 3, part=part, cap=False)

def cast_wheel(hub, R, tw, side=1, rim='#c9d0d4', arms=5, tyre=TYRE, part='body', knobby=False):
    """a car or scooter wheel: a tyre with a flat tread and rounded shoulders, an alloy rim with arms and a cap"""
    hub = Vector(hub); h = tw / 2; ri = R - min(.11, R * .36)
    lathe(tyre, 'wheel', [(ri, -h + .01), (R - .03, -h - .004), (R - .006, -h + .02), (R, -h * .4), (R, h * .4), (R - .006, h - .02), (R - .03, h + .004), (ri, h - .01)], hub, (1, 0, 0), 26, closed=True, part=part)
    if knobby:
        for i in range(22):
            a = 2 * PI * i / 22
            rbox('#1d1e20', 'wheel', hub + Vector((0, math.sin(a) * R, math.cos(a) * R)), (tw * 1.02, .03, .045), .008, rot=(-a, 0, 0), part=part, seg=1)
    s = side; face = s * h * .55
    lathe(rim, 'wheel', [(ri + .004, -h * .8), (ri + .01, -h * .55), (ri - .01, -h * .45), (ri - .01, h * .45), (ri + .01, h * .55), (ri + .004, h * .8)], hub, (1, 0, 0), 26, closed=True, part=part)
    lathe(rim, 'wheel', [(0, face - s * .03), (ri * .28, face - s * .02), (ri * .32, face), (ri * .22, face + s * .012), (0, face + s * .016)], hub, (1, 0, 0), 16, part=part)
    lathe('#4a4f54', 'wheel', [(0, face - s * .05), (ri - .01, face - s * .05), (ri - .01, face - s * .04), (0, face - s * .04)], hub, (1, 0, 0), 20, part=part)
    for i in range(arms):
        a = 2 * PI * i / arms
        m = hub + Vector((face - s * .015, math.sin(a) * ri * .62, math.cos(a) * ri * .62))
        rbox(rim, 'wheel', m, (.03, ri * .72, ri * .2), .012, rot=(-a, 0, 0), part=part, seg=1)

def fender(hub, rad, a0, a1, w, col, kind='paint', th=.012, part='body', n=4.0):
    sweep(col, kind, arc_pts(hub, rad, a0, a1, 10), [(w, th)], seg=12, n=n, part=part, k=3)

def coil(a, b, r, turns=5, wire=.007, col=CHROME, part='body'):
    a, b = Vector(a), Vector(b); ax, u, w = basis(b - a); L = (b - a).length; pts = []
    for i in range(turns * 8 + 1):
        t = i / (turns * 8); ang = 2 * PI * turns * t
        pts.append(a + ax * L * t + (u * math.cos(ang) + w * math.sin(ang)) * r)
    sweep(col, 'chrome', pts, [wire], seg=5, part=part, k=1, cap=False)

def fins(c, axis, r0, r1, length, n=6, col=ALU, part='body'):
    prof = [(0, -length / 2)]
    for i in range(n):
        t0 = -length / 2 + length * i / n
        prof += [(r0, t0 + .002), (r1, t0 + length / n * .25), (r1, t0 + length / n * .55), (r0, t0 + length / n * .8)]
    prof += [(r0, length / 2), (0, length / 2)]
    lathe(col, 'chrome', prof, c, axis, 14, part=part)

# ---------------------------------------------------------------- the frame from the game
class Frame:
    def __init__(s, name):
        s.d = DATA[name]; s.pts = {k: Vector(v) for k, v in s.d['points'].items()}; s.wheels = []
        for p in s.d['parts']:
            if p['name'].startswith('wheel'):
                (mn, mx) = p['box']; s.wheels.append((p['name'], Vector(p['pos']), (mx[1] - mn[1]) / 2, mx[0] - mn[0]))
    def w(s, i): return s.wheels[i]

def wheels_spoked(F, spokes=32, **kw):
    for name, hub, R, w in F.wheels: spoke_wheel(hub, R, max(.05, w), spokes, part=name, **kw)

def wheels_cast(F, **kw):
    for name, hub, R, w in F.wheels: cast_wheel(hub, R, max(w, .18), 1 if hub.x >= 0 else -1, part=name, **kw)

# ---------------------------------------------------------------- motorbikes
def moto_front(F, head_top, head_bot, fork_r=.02, col=CHROME, gaiter=True, lamp_at=None, lamp_r=.075, fenderc=None, fender_kind='paint', mirrors=True, front_i=0, bar=True):
    _, hub, R, w = F.w(front_i)
    for s in (1, -1):
        top = Vector((s * .065, head_top[1], head_top[2])); bot = Vector((s * .065, hub.y + .01, hub.z - .01))
        tube(col, 'chrome', [top, bot], fork_r, 10)
        if gaiter:
            mid = top.lerp(bot, .55); lathe(BLACK, 'matte', [(0, -.07), (fork_r * 1.6, -.07), (fork_r * 1.9, -.035), (fork_r * 1.6, 0), (fork_r * 1.9, .035), (fork_r * 1.6, .07), (0, .07)], mid, top - bot, 12)
    tube(col, 'chrome', [Vector((.075, head_top[1] - .02, head_top[2])), Vector((-.075, head_top[1] - .02, head_top[2]))], .016, 8)
    tube(BLACK, 'matte', [Vector(head_bot), Vector((0, head_top[1], head_top[2]))], .03, 10)
    if fenderc: fender(hub, R + .045, 15, 125, .075, fenderc, fender_kind)
    if lamp_at is not None: lamp(lamp_at, lamp_r)
    gp = (F.pts['handleL'], F.pts['handleR'])
    m = handlebar(*gp) if bar else None
    if mirrors:
        for g in gp:
            s = 1 if g.x > 0 else -1; mirror(Vector(g) + Vector((-s * .07, .01, -.01)), Vector(g) + Vector((-s * .04, .21, -.04)))
    return m

def moto_rear(F, pivot, shock_top, col=BLACK, rear_i=1, chain=True):
    _, hub, R, w = F.w(rear_i)
    for s in (1, -1):
        tube(col, 'paint', [Vector((s * .07, pivot[1], pivot[2])), Vector((s * .07, hub.y, hub.z))], .018, 8)
        a, b = Vector((s * .08, hub.y + .03, hub.z + .03)), Vector((s * .085, shock_top[1], shock_top[2]))
        tube(CHROME, 'chrome', [a, b], .012, 8); coil(a.lerp(b, .15), a.lerp(b, .8), .026, 6, .005)
        lathe(BLACK, 'matte', [(0, -.03), (.022, -.03), (.022, .03), (0, .03)], b, b - a, 10)
    if chain: rbox(BLACK, 'matte', (.1, (pivot[1] + hub.y) / 2 + .05, (pivot[2] + hub.z) / 2), (.025, .08, abs(pivot[2] - hub.z) + .08), .02)

def pegs(F, col=RUBBER):
    for k in ('pedalL', 'pedalR'):
        p = F.pts.get(k)
        if p is not None:
            s = 1 if p.x > 0 else -1
            tube(STEEL, 'chrome', [Vector((s * .05, p.y, p.z)), p], .012, 8); lathe(col, 'matte', [(0, -.05), (.018, -.045), (.018, .045), (0, .05)], p + Vector((s * .02, 0, 0)), (1, 0, 0), 10)

def tail(c, w=.08, plate_at=None, pcol=PLATE):
    ell(CHROME, 'chrome', (c[0], c[1], c[2] + .01), (w * 1.1, .04, .025)); ell(TAIL, 'glass', c, (w, .035, .03))
    if plate_at: plate(plate_at, pcol, facing=-1)

def stand(p0, p1): tube(BLACK, 'matte', [p0, p1], .011, 6)

def honda67():
    F = Frame('veh-honda67'); RED = '#c8372d'
    wheels_spoked(F, 36)
    sweep(RED, 'paint', [(0, .8, .44), (0, .85, .3), (0, .86, .12), (0, .83, -.06)], [(.05, .045), (.115, .075), (.125, .075), (.07, .045)], 18, 2.2)
    for x in (1, -1):
        ell(CHROME, 'chrome', (x * .118, .8, .12), (.018, .05, .1)); ell('#f2ead6', 'paint', (x * .118, .83, .25), (.012, .03, .05))
    lathe(CHROME, 'chrome', [(0, 0), (.03, 0), (.03, .012), (.02, .02), (0, .022)], (0, .87, .08), (0, 1, 0), 14)
    sweep(SEATC, 'matte', [(0, .86, -.06), (0, .875, -.3), (0, .87, -.55), (0, .83, -.74)], [(.1, .04), (.125, .05), (.12, .05), (.07, .03)], 16, 4)
    sweep(CHROME, 'chrome', [(0, .815, -.08), (0, .82, -.4), (0, .8, -.72)], [(.12, .008)], 14, 4)
    tube(RED, 'paint', [(0, .9, .48), (0, .78, .3), (0, .74, .05), (0, .74, -.3), (0, .77, -.68)], .028, 10)
    for x in (1, -1): ell(RED, 'paint', (x * .1, .62, -.22), (.035, .12, .16))
    rbox(ALU, 'chrome', (0, .38, .0), (.2, .18, .26), .05)
    fins((0, .48, .22), (0, .3, 1), .06, .085, .2, 6)
    tube(CHROME, 'chrome', [(.05, .46, .32), (.1, .3, .22), (.13, .28, -.1), (.14, .45, -.45), (.15, .54, -.62)], .021, 10)
    sweep(CHROME, 'chrome', [(.15, .5, -.5), (.155, .56, -.66), (.16, .6, -.8)], [(.035, .035), (.042, .042), (.03, .03)], 14)
    rbox('#3a3d40', 'matte', (.18, .5, -.48), (.015, .08, .22), .01)
    moto_front(F, (0, .88, .52), (0, .74, .56), lamp_at=(0, .84, .66), fenderc=CHROME, fender_kind='chrome')
    lathe(BLACK, 'matte', [(0, 0), (.035, 0), (.04, .03), (.035, .045), (0, .045)], (0, .92, .56), (0, 1, .2), 14)
    lathe('#f6f0dc', 'glass', [(.03, .045), (0, .047)], (0, .92, .56), (0, 1, .2), 14)
    _, hub, R, w = F.w(1); fender(hub, R + .05, -30, 105, .08, CHROME, 'chrome')
    moto_rear(F, (0, .48, -.12), (0, .78, -.5))
    tail((0, .72, -.82), .05, (0, .6, -.84)); pegs(F); stand((-.09, .32, -.1), (-.16, .02, -.2))
    rbox(BLACK, 'matte', (0, .55, -.2), (.16, .14, .18), .04)
    return F

def stepthrough(F, c, shield, carrier=True, seatlen=.5, floorc=RUBBER):
    """the Cub family: a leg shield, a step-through beam and floor, a round body under the seat"""
    _, fh, fR, _ = F.w(0); s = F.pts['seat']
    sweep(shield, 'paint', [(0, .33, .2), (0, .48, .3), (0, .7, .38), (0, .9, .42)], [(.15, .035), (.19, .045), (.2, .05), (.17, .04)], 18, 3)
    tube(c, 'paint', [(0, .88, .45), (0, .7, .32), (0, .5, .14), (0, .42, -.04)], .05, 12)
    rbox(floorc, 'matte', (0, .35, .12), (.34, .03, .26), .015)
    for x in (1, -1): rbox('#2a2c2e', 'matte', (x * .1, .372, .12), (.07, .012, .22), .005)
    sweep(c, 'paint', [(0, .44, -.05), (0, .62, -.2), (0, .68, -.42), (0, .64, -.62), (0, .5, -.75)], [(.07, .07), (.15, .12), (.155, .13), (.13, .1), (.06, .05)], 20, 2.6)
    sweep(SEATC, 'matte', [(0, s.y - .02, s.z + .26), (0, s.y + .02, s.z), (0, s.y, s.z - seatlen + .26)], [(.11, .04), (.13, .05), (.1, .035)], 16, 4)
    if carrier:
        for x in (1, -1): tube(CHROME, 'chrome', [(x * .14, s.y - .02, s.z - .2), (x * .15, s.y - .01, s.z - .5), (x * .12, s.y - .02, s.z - .66)], .01, 6)
        for z in (s.z - .42, s.z - .52, s.z - .62): tube(CHROME, 'chrome', [(.15, s.y - .01, z), (-.15, s.y - .01, z)], .008, 6)
    rbox(ALU, 'chrome', (0, .28, -.03), (.2, .14, .3), .05); fins((0, .3, .16), (0, .08, 1), .05, .07, .14, 5)
    tube(CHROME, 'chrome', [(.06, .28, .2), (.1, .2, .05), (.12, .22, -.35), (.13, .3, -.55)], .02, 8)
    sweep(CHROME, 'chrome', [(.13, .29, -.45), (.135, .33, -.72)], [(.04, .04), (.034, .034)], 14)
    fender(fh, fR + .05, 15, 125, .085, c, 'paint', n=3)
    moto_rear(F, (0, .4, -.1), (0, .66, -.48), c)
    pegs(F, RUBBER); tail((0, .68, -.8), .06, (0, .6, -.82)); stand((-.08, .25, -.15), (-.14, .02, -.25))

def cub():
    F = Frame('veh-cub'); C = '#2f6fb0'
    wheels_spoked(F, 36); stepthrough(F, C, '#f2efe6')
    moto_front(F, (0, .92, .48), (0, .78, .5), gaiter=False)
    m = (F.pts['handleL'] + F.pts['handleR']) / 2
    sweep(C, 'paint', [(0, m.y - .03, m.z + .1), (0, m.y, m.z - .02), (0, m.y - .02, m.z - .12)], [(.12, .06), (.15, .07), (.1, .05)], 16, 2.6)
    lamp((0, m.y - .02, m.z + .16), .065)
    return F

def dream():
    F = Frame('veh-dream'); C = '#6b2f2a'
    wheels_spoked(F, 36); stepthrough(F, C, C, seatlen=.62)
    s = F.pts['seat']
    for x in (1, -1):
        rbox('#c9a44a', 'paint', (x * .155, .68, -.38), (.008, .03, .4), .006)
        tube(CHROME, 'chrome', [(x * .17, s.y - .03, s.z + .1), (x * .19, s.y - .02, s.z - .25), (x * .13, s.y - .02, s.z - .42)], .012, 8)
    moto_front(F, (0, .96, .48), (0, .8, .5), gaiter=False)
    m = (F.pts['handleL'] + F.pts['handleR']) / 2
    sweep(C, 'paint', [(0, m.y - .04, m.z + .1), (0, m.y - .02, m.z - .02), (0, m.y - .04, m.z - .12)], [(.16, .07), (.18, .075), (.12, .05)], 16, 4)
    rbox(CHROME, 'chrome', (0, m.y - .04, m.z + .17), (.17, .1, .03), .015); rbox(LENS, 'glass', (0, m.y - .04, m.z + .185), (.15, .08, .012), .01)
    for x in (1, -1): rbox(AMBER, 'glass', (x * .14, m.y - .04, m.z + .17), (.06, .035, .03), .012)
    return F

def scooter():
    F = Frame('veh-scooter'); C, T = '#f4f2ee', '#c8372d'
    for name, hub, R, w in F.wheels: cast_wheel(hub, R, .1, 1, rim='#3a3d40', part=name, arms=6)
    _, fh, fR, _ = F.w(0); s = F.pts['seat']
    sweep(C, 'paint', [(0, .3, .28), (0, .5, .4), (0, .78, .46), (0, .98, .5)], [(.16, .05), (.2, .06), (.21, .06), (.17, .05)], 18, 3)
    rbox(RUBBER, 'matte', (0, .3, .02), (.34, .05, .4), .02)
    sweep(C, 'paint', [(0, .4, -.1), (0, .6, -.25), (0, .7, -.48), (0, .66, -.68), (0, .52, -.8)], [(.1, .1), (.17, .15), (.18, .15), (.15, .12), (.07, .06)], 20, 2.8)
    sweep(T, 'paint', [(0, .55, -.2), (0, .62, -.45), (0, .58, -.7)], [(.183, .03)], 18, 6)
    sweep(SEATC, 'matte', [(0, s.y - .03, s.z + .24), (0, s.y + .02, s.z), (0, s.y, s.z - .3)], [(.12, .04), (.14, .05), (.12, .04)], 16, 4)
    fender(fh, fR + .04, 20, 120, .08, C, 'paint', n=3)
    moto_front(F, (0, .98, .5), (0, .82, .52), gaiter=False, col='#3a3d40')
    m = (F.pts['handleL'] + F.pts['handleR']) / 2
    sweep(T, 'paint', [(0, m.y - .03, m.z + .12), (0, m.y, m.z), (0, m.y - .03, m.z - .1)], [(.12, .06), (.16, .07), (.1, .05)], 16, 3)
    rbox(LENS, 'glass', (0, .96, .56), (.16, .05, .03), .02)
    rbox(ALU, 'chrome', (.1, .26, -.42), (.12, .12, .36), .04); sweep('#5a5f64', 'chrome', [(.18, .3, -.5), (.19, .32, -.72)], [(.04, .04)], 12)
    tail((0, .7, -.8), .09, (0, .56, -.82)); stand((-.06, .2, -.3), (-.1, .02, -.35))
    return F

def postie():
    F = Frame('veh-postie'); RED = '#d8202a'
    wheels_spoked(F, 36, knobby=True); stepthrough(F, RED, RED, carrier=False)
    moto_front(F, (0, .92, .46), (0, .78, .48), gaiter=True)
    m = (F.pts['handleL'] + F.pts['handleR']) / 2; lamp((0, m.y - .08, m.z + .14), .065)
    tube('#5a5f64', 'chrome', [(.09, .34, .1), (.14, .5, -.1), (.15, .6, -.4), (.15, .62, -.7)], .022, 8); rbox(BLACK, 'matte', (.175, .6, -.45), (.012, .12, .3), .01)
    rbox(RUBBER, 'matte', (0, .84, -.86), (.5, .03, .5), .01)
    rbox('#e8432a', 'paint', (0, 1.04, -.86), (.46, .34, .44), .03); rbox('#c62828', 'paint', (0, 1.225, -.86), (.48, .04, .46), .015)
    rbox('#ffd23f', 'paint', (0, 1.0, -.636), (.42, .04, .01), .004)
    for x in (1, -1): rbox('#e8432a', 'paint', (x * .3, .62, -.72), (.08, .3, .4), .025)
    rbox(RUBBER, 'matte', (0, .98, .74), (.36, .02, .26), .008); rbox('#e8432a', 'paint', (0, 1.1, .74), (.32, .22, .24), .025)
    plate((0, .66, -1.1), '#f2d24a', facing=-1)
    return F

def trailbike():
    F = Frame('veh-trailBike'); Y = '#f2b51e'
    wheels_spoked(F, 32, knobby=True)
    _, fh, fR, _ = F.w(0)
    sweep(Y, 'paint', [(0, .98, .3), (0, 1.02, .16), (0, .98, -.04)], [(.08, .06), (.13, .07), (.1, .05)], 16, 2.4)
    for x in (1, -1): sweep('#1d1f22', 'paint', [(x * .12, .8, .3), (x * .14, .88, .12), (x * .12, .86, -.04)], [(.012, .08)], 10, 4)
    sweep(SEATC, 'matte', [(0, 1.0, .04), (0, 1.0, -.3), (0, .98, -.66)], [(.1, .035), (.12, .04), (.09, .03)], 16, 4)
    sweep(Y, 'paint', [(0, .96, -.4), (0, .95, -.7), (0, 1.0, -.9)], [(.1, .02), (.09, .02), (.05, .015)], 14, 4)
    tube('#3a3d40', 'paint', [(0, 1.04, .46), (0, .8, .25), (0, .52, .1), (0, .44, -.2)], .03, 10)
    rbox('#5a5f64', 'chrome', (0, .52, -.06), (.2, .26, .28), .05); fins((0, .7, .05), (0, 1, .3), .05, .075, .18, 6, '#5a5f64')
    tube('#5a5f64', 'chrome', [(.06, .62, .14), (.12, .7, -.1), (.15, .86, -.5), (.15, .9, -.78)], .024, 8)
    sweep('#2b2e31', 'chrome', [(.15, .86, -.55), (.15, .92, -.85)], [(.045, .045)], 12)
    moto_front(F, (0, 1.08, .48), (0, .92, .5), mirrors=False)
    sweep(Y, 'paint', [(0, fh.y + fR + .07, fh.z - .22), (0, fh.y + fR + .1, fh.z), (0, fh.y + fR + .06, fh.z + .3)], [(.08, .012)], 12, 4)
    rbox('#f4f4ee', 'paint', (0, 1.06, .56), (.24, .22, .03), .03, rot=(-.4, 0, 0))
    moto_rear(F, (0, .48, -.2), (0, .92, -.4), '#3a3d40')
    pegs(F, RUBBER); tail((0, .95, -.92), .04)
    return F

def quadbike():
    F = Frame('veh-quadBike'); C = '#c8372d'
    for name, hub, R, w in F.wheels: cast_wheel(hub, R, max(w, .18), 1 if hub.x >= 0 else -1, rim='#3a3d40', part=name, knobby=True)
    s = F.pts['seat']; W = abs(F.w(0)[1].x)
    rbox(RUBBER, 'matte', (0, .45, 0), (.5, .16, 1.3), .05)
    sweep(C, 'paint', [(0, .62, .8), (0, .7, .4), (0, .72, 0), (0, .7, -.5), (0, .62, -.82)], [(.3, .08), (.32, .1), (.3, .12), (.32, .1), (.3, .08)], 20, 4)
    for name, hub, R, w in F.wheels:
        x = (1 if hub.x > 0 else -1) * (W - .02); fender(Vector((x, hub.y, hub.z)), R + .05, 25, 155, .13, C, 'paint', .012)
    sweep(SEATC, 'matte', [(0, s.y - .02, s.z + .26), (0, s.y + .02, s.z), (0, s.y - .02, s.z - .3)], [(.13, .04), (.15, .05), (.13, .04)], 16, 4)
    rbox('#5a5f64', 'chrome', (0, .4, 0), (.24, .26, .3), .05)
    for z, d in ((.66, .4), (-.68, .44)):
        for x in (-.34, -.12, .12, .34): tube('#3a3d40', 'chrome', [(x, .78, z - d / 2), (x, .78, z + d / 2)], .012, 6)
        for zz in (z - d / 2, z + d / 2): tube('#3a3d40', 'chrome', [(-.36, .78, zz), (.36, .78, zz)], .012, 6)
    tube('#3a3d40', 'paint', [(0, .74, .3), (0, .96, .22)], .03, 8)
    handlebar(F.pts['handleL'], F.pts['handleR'], .02, .0, col='#3a3d40')
    for x in (-.2, .2): lamp((x, .66, .82), .05)
    tail((0, .62, -.84), .06)
    return F

def bagac():
    F = Frame('veh-baGac'); C = '#2f6fb0'
    wheels_spoked(F, 32)
    s = F.pts['seat']
    moto_front(F, (0, 1.0, .78), (0, .86, .8), lamp_at=(0, .95, .9), fenderc=C)
    sweep(C, 'paint', [(0, .92, .72), (0, .76, .5), (0, .6, .32)], [(.07, .05), (.13, .08), (.1, .06)], 16, 2.6)
    sweep(SEATC, 'matte', [(0, s.y - .02, s.z + .26), (0, s.y + .02, s.z), (0, s.y - .02, s.z - .22)], [(.11, .04), (.13, .05), (.12, .04)], 16, 4)
    tube('#3a3d40', 'paint', [(0, .6, .3), (0, .52, 0), (0, .55, -.3)], .035, 10)
    rbox(ALU, 'chrome', (0, .4, 0), (.2, .2, .3), .05)
    for x in (1, -1): tube('#3a3d40', 'paint', [(0, .55, -.25), (x * .62, .55, -.8)], .03, 8)
    tube('#3a3d40', 'paint', [(.66, .28, -.8), (-.66, .28, -.8)], .03, 8)
    for i, z in enumerate([-.15 - .2 * k for k in range(8)]): rbox(WOOD if i % 2 else WOOD2, 'matte', (0, .7, z), (1.4, .05, .19), .01)
    for x in (1, -1): rbox('#7a5a34', 'matte', (x * .7, .88, -.9), (.05, .32, 1.6), .015)
    rbox('#7a5a34', 'matte', (0, .88, -1.7), (1.4, .32, .05), .015)
    for k, (x, z) in enumerate([(-.35, -.6), (.35, -.6), (-.35, -1.2), (.35, -1.2), (0, -.9)]):
        y = 1.35 if k == 4 else .95; c = '#c9a24a' if k % 2 else '#b8893a'
        rbox(c, 'matte', (x, y, z), (.58, .38, .48), .02)
        for d in (-.12, 0, .12): rbox('#8a6a3e', 'matte', (x, y + d, z + .245), (.56, .05, .01), .003)
    for name, hub, R, w in F.wheels[1:]: fender(hub, R + .05, -20, 160, .09, '#3a3d40', 'paint')
    return F

def xichlo():
    F = Frame('veh-xichlo'); FR, SEAT, HOOD = '#2d5a8a', '#c62f2f', '#2f6b3a'
    for name, hub, R, w in F.wheels: spoke_wheel(hub, R, .045, 36, part=name, thin=True)
    W = abs(F.w(0)[1].x)
    tube(FR, 'paint', [(-W - .04, .3, .34), (W + .04, .3, .34)], .022, 8)
    sweep(FR, 'paint', [(0, .44, .58), (0, .45, .3), (0, .46, 0), (0, .44, -.18)], [(.34, .07), (.37, .08), (.37, .09), (.32, .08)], 20, 4)
    sweep(SEAT, 'matte', [(0, .52, .26), (0, .54, .05), (0, .56, -.12)], [(.3, .05), (.31, .06), (.3, .05)], 18, 5)
    sweep(SEAT, 'matte', [(0, .58, -.15), (0, .8, -.2), (0, 1.0, -.24)], [(.3, .06), (.31, .07), (.29, .07)], 18, 5)
    tube(SEAT, 'matte', [(-.3, 1.03, -.24), (.3, 1.03, -.24)], .055, 12)
    for x in (1, -1):
        sweep(FR, 'paint', [(x * .34, .56, .26), (x * .35, .7, .1), (x * .34, .72, -.12)], [(.03, .03)], 10, 3)
        tube(CHROME, 'chrome', [(x * .34, .74, -.14), (x * .36, 1.0, -.34), (x * .2, 1.12, -.44), (0, 1.14, -.46)], .01, 6)
    # the hood, folded down in a roll behind the seat back, over its bows
    sweep(HOOD, 'matte', [(-.36, .9, -.36), (-.3, 1.06, -.42), (0, 1.12, -.46), (.3, 1.06, -.42), (.36, .9, -.36)], [(.05, .11), (.07, .13), (.07, .14), (.07, .13), (.05, .11)], 14, 2.4, side=(0, 0, 1))
    rbox(WOOD, 'matte', (0, .4, .52), (.62, .03, .3), .01)
    tube(CHROME, 'chrome', [(-.36, .92, -.32), (-.3, 1.08, -.38), (0, 1.12, -.42), (.3, 1.08, -.38), (.36, .92, -.32)], .016, 8)
    for g in (F.pts['handleL'], F.pts['handleR']): grip(g, 1 if g.x > 0 else -1)
    tube(FR, 'paint', [(0, .5, -.24), (0, .8, -.62), (0, 1.0, -.7)], .026, 8)
    tube(FR, 'paint', [(0, .5, -.3), (0, .42, -.66), (0, .34, -1.02)], .024, 8); tube(FR, 'paint', [(0, .98, -.7), (0, .34, -1.02)], .02, 8)
    sweep(SEATC, 'matte', [(0, 1.04, -.62), (0, 1.06, -.74), (0, 1.05, -.84)], [(.05, .025), (.1, .035), (.11, .035)], 14, 4)
    lathe(CHROME, 'chrome', [(0, -.005), (.1, -.004), (.1, .004), (0, .005)], (.06, .42, -.66), (1, 0, 0), 24)
    for k, sd in (('pedalL', 1), ('pedalR', -1)):
        p = F.pts[k]; tube(CHROME, 'chrome', [(sd * .07, .42, -.66), (p.x, p.y, p.z)], .009, 6); rbox(BLACK, 'matte', p + Vector((sd * .02, 0, 0)), (.08, .02, .05), .006)
    _, rh, rR, _ = F.w(2); fender(rh, rR + .05, -10, 120, .05, FR, 'paint')
    for name, hub, R, w in F.wheels[:2]: fender(hub, R + .05, 10, 130, .05, FR, 'paint')
    for x in (1, -1): lamp((x * (W + .02), .66, .6), .045)
    plate((0, .44, .66))
    return F

# ---------------------------------------------------------------- bicycles
def bicycle(F, frame, kind='city', step=False, rack=False, basket=False, mud=True, guard=False, kids=False, bmx=False, saddle=SEATC):
    _, fh, R, tw = F.w(0); _, bh, _, _ = F.w(1)
    for name, hub, r, w in F.wheels: spoke_wheel(hub, r, .028 if kind == 'road' else max(.03, w * .8), 36 if bmx else 32, part=name, thin=True, rim=CHROME if not bmx else '#2b2e31')
    H = fh.y; F_, B_ = fh.z, bh.z
    BB = Vector((0, H + .03, -.02)); SEAT = Vector((0, H + R * 1.55, B_ * .42)); HEAD = Vector((0, H + R * 1.5, F_ * .7)); HLO = Vector((0, H + R * 1.12, F_ * .78))
    t = .02 if kind != 'road' else .016
    if step: tube(frame, 'paint', [HEAD, (0, HLO.y - R * .5, F_ * .5), (0, BB.y + .04, BB.z + .12), BB], t, 10)
    else: tube(frame, 'paint', [SEAT + Vector((0, -.03, 0)), HEAD + Vector((0, -.02, 0))], t, 10)
    tube(frame, 'paint', [HLO, BB], t * 1.2, 10); tube(frame, 'paint', [BB, SEAT], t * 1.15, 10); tube(frame, 'paint', [HEAD + Vector((0, .04, -.01)), HLO - Vector((0, .03, -.01))], t * 1.4, 10)
    for s in (1, -1):
        tube(frame, 'paint', [BB + Vector((s * .03, 0, 0)), Vector((s * .045, bh.y, bh.z))], t * .6, 8)
        tube(frame, 'paint', [SEAT + Vector((s * .02, -.05, 0)), Vector((s * .045, bh.y, bh.z))], t * .55, 8)
        tube(CHROME, 'chrome', [HLO + Vector((s * .03, 0, 0)), Vector((s * .045, (HLO.y + fh.y) / 2, (HLO.z + fh.z) / 2 + .02)), Vector((s * .045, fh.y, fh.z + .03))], t * .7, 8)
    tube(CHROME, 'chrome', [SEAT, SEAT + Vector((0, .1, -.02))], .013, 8)
    sweep(saddle, 'matte', [SEAT + Vector((0, .12, .12)), SEAT + Vector((0, .125, 0)), SEAT + Vector((0, .12, -.1))], [(.025, .02), (.06, .03), (.09, .03)], 14, 3)
    if kind == 'city' and not kids:
        for s in (1, -1): coil(SEAT + Vector((s * .05, .06, -.08)), SEAT + Vector((s * .05, .1, -.08)), .012, 3, .004)
    stem_top = HEAD + Vector((0, .12, -.02))
    tube(CHROME, 'chrome', [HEAD, stem_top], .014, 8)
    gl, gr = F.pts.get('handleL'), F.pts.get('handleR')
    if gl is None: gl, gr = stem_top + Vector((.24, 0, -.06)), stem_top + Vector((-.24, 0, -.06))   # (the pack bike is walked: no rider's points)
    if kind == 'road':
        for s, g in ((1, gl), (-1, gr)):
            tube('#2b2e31', 'matte', [Vector((s * .2, stem_top.y, stem_top.z)), Vector((s * .2, stem_top.y, stem_top.z + .1)), Vector((s * .2, stem_top.y - .1, stem_top.z + .14)), Vector((s * .2, stem_top.y - .14, stem_top.z + .05))], .013, 8)
            ell('#2b2e31', 'matte', g, (.02, .03, .035))
        tube(CHROME, 'chrome', [(-.2, stem_top.y, stem_top.z), (.2, stem_top.y, stem_top.z)], .012, 8)
    elif bmx:
        tube(CHROME, 'chrome', [gr + Vector((-.04, 0, 0)), (-.16, stem_top.y, stem_top.z), (.16, stem_top.y, stem_top.z), gl + Vector((.04, 0, 0))], .012, 8)
        tube(CHROME, 'chrome', [(-.15, stem_top.y + .1, stem_top.z - .03), (.15, stem_top.y + .1, stem_top.z - .03)], .01, 6)
        for g in (gl, gr): grip(g, 1 if g.x > 0 else -1)
        for z in (bh.z, fh.z):
            for s in (1, -1): lathe(STEEL, 'chrome', [(0, 0), (.022, 0), (.022, .1), (0, .1)], (s * .04, H, z), (s, 0, 0), 10)
    else:
        handlebar(gl, gr, .0, -.06, levers=True)
        lathe(CHROME, 'chrome', [(0, 0), (.025, 0), (.026, .012), (.018, .022), (0, .026)], (.15, stem_top.y + .02, stem_top.z - .06), (0, 1, 0), 12)
    lathe(CHROME, 'chrome', [(0, -.006), (R * .32, -.005), (R * .34, 0), (R * .32, .005), (0, .006)], BB + Vector((.06, 0, 0)), (1, 0, 0), 28)
    lathe(CHROME, 'chrome', [(0, -.005), (.045, -.004), (.045, .004), (0, .005)], Vector((.06, bh.y, bh.z)), (1, 0, 0), 16)
    tube('#5a5a5a', 'chrome', [BB + Vector((.06, R * .33, 0)), Vector((.06, bh.y + .045, bh.z)), Vector((.06, bh.y - .045, bh.z)), BB + Vector((.06, -R * .33, 0)), BB + Vector((.06, R * .33, 0))], .005, 5, k=1)
    for k, sd in (('pedalL', 1), ('pedalR', -1)):
        p = F.pts.get(k)
        if p is None: continue
        tube(CHROME, 'chrome', [BB + Vector((sd * .07, 0, 0)), Vector((sd * .09, p.y, p.z))], .009, 6)
        rbox(BLACK, 'matte', p + Vector((sd * .02, -.01, 0)), (.09, .022, .06), .006)
    if mud:
        mc, mk = (CHROME, 'chrome') if kind == 'city' else (frame, 'paint')
        fender(fh, R + .03, 0, 130, .03, mc, mk, .008); fender(bh, R + .03, -40, 170, .035, mc, mk, .008)
    if guard: sweep(frame, 'paint', [(.07, BB.y + .05, BB.z + .1), (.07, H + .06, (BB.z + B_) / 2), (.07, H + .05, B_ + .05)], [(.004, .05)], 10, 4)
    if rack:
        rbox(CHROME, 'chrome', (0, H + R + .1, B_ + .02), (.15, .012, .34), .005)
        for s in (1, -1): tube(CHROME, 'chrome', [(s * .07, H + R + .1, B_ - .04), (s * .05, H, B_)], .008, 6)
    if basket:
        bc = HEAD + Vector((0, -.04, .2))
        lathe('#c9a24a', 'matte', [(0, -.1), (.13, -.1), (.14, -.04), (.155, .05), (.16, .1), (.15, .1), (.14, -.08), (0, -.08)], bc, (0, 1, 0), 16)
        for a in range(10): lathe('#a8823a', 'matte', [(.157 + .006 * math.cos(b), -.08 + a * .019 + .006 * math.sin(b)) for b in [2 * PI * i / 4 for i in range(4)]], bc, (0, 1, 0), 16, closed=True) if a % 3 == 0 else None
    if kind not in ('road', 'bmx'): lamp(HEAD + Vector((0, -.04, .08)), .035)
    ell('#d8322a', 'glass', (0, H + R * .72, B_ - R - .03), (.03, .02, .01))
    if kids:
        for s in (1, -1):
            spoke_wheel(Vector((s * .2, .09, B_ - .02)), .09, .022, 8, part='body', thin=True)
            tube(CHROME, 'chrome', [(s * .03, H, B_), (s * .2, .09, B_ - .02)], .01, 6)
    else: stand((-.04, H, B_ + .1), (-.12, .01, B_ + .2))
    return dict(BB=BB, SEAT=SEAT, HEAD=HEAD, H=H, R=R, F=F_, B=B_)

def roadster():
    F = Frame('veh-roadster'); bicycle(F, '#1d1f22', rack=True, guard=True, saddle='#5a3a26'); return F
def minibike():
    F = Frame('veh-miniBike'); bicycle(F, '#e88aa8', step=True, basket=True, rack=True); return F
def roadbike():
    F = Frame('veh-roadBike'); bicycle(F, '#2f8fd8', kind='road', mud=False); return F
def bmxbike():
    F = Frame('veh-bmx'); bicycle(F, '#38b54a', kind='bmx', bmx=True, mud=False); return F
def kidsbike():
    F = Frame('veh-kidsBike'); bicycle(F, '#ff7a3a', basket=True, kids=True); return F
def bamboo(a, c, r=.02, n=5):
    a, c = Vector(a), Vector(c); L = (c - a).length; prof = [(0, 0)]
    for i in range(n): prof += [(r, L * (i + .05) / n), (r * 1.15, L * (i + .08) / n), (r, L * (i + .12) / n)]
    lathe('#c9a45a', 'matte', prof + [(r, L), (0, L)], a, c - a, 8)
def packbike():
    F = Frame('veh-packBike'); b = bicycle(F, '#2b3a2e', rack=True, guard=True, saddle='#5a3a26')
    H, R, B_, SEAT, HEAD = b['H'], b['R'], b['B'], b['SEAT'], b['HEAD']
    bamboo((.27, HEAD.y + .12, HEAD.z - .06), (.42, HEAD.y + .5, HEAD.z - .7)); bamboo((.02, SEAT.y + .05, SEAT.z), (.36, SEAT.y + .62, SEAT.z - .55))
    rbox(WOOD, 'matte', (0, H + R + .12, B_), (.5, .03, .6), .01)
    for s in (1, -1):
        ell('#d9c08a', 'matte', (s * .32, H + R - .02, B_ + .02), (.14, .26, .22)); ell('#cdb27a', 'matte', (s * .3, H + R + .3, B_ - .06), (.13, .22, .2))
        lathe('#8a6a3e', 'matte', [(.12 + .008 * math.cos(q), .008 * math.sin(q)) for q in [2 * PI * i / 4 for i in range(4)]], (s * .32, H + R + .12, B_ + .02), (0, 1, 0), 12, closed=True)
    lathe('#b8893a', 'matte', [(0, -.15), (.22, -.15), (.26, .15), (.24, .15), (.2, -.13), (0, -.13)], (0, H + R + .3, B_), (0, 1, 0), 16)
    for k in range(9): ell(['#ff9a2e', '#5fbf4a', '#e8433a'][k % 3], 'paint', (math.cos(k * 2.3) * .14, H + R + .46 + (k % 3) * .03, B_ + math.sin(k * 2.3) * .14), (.07, .07, .07), seg=10, rings=7)
    sweep('#6a8a3a', 'matte', [(0, (SEAT.y + HEAD.y) / 2 - .02, SEAT.z + .05), (0, (SEAT.y + HEAD.y) / 2 + .02, (SEAT.z + HEAD.z) / 2), (0, (SEAT.y + HEAD.y) / 2, HEAD.z - .05)], [(.09, .1), (.12, .13), (.09, .1)], 12, 2)
    for s in (1, -1): lathe('#c9a24a', 'matte', [(0, -.12), (.14, -.12), (.16, .12), (.15, .12), (.13, -.1), (0, -.1)], (s * .3, HEAD.y - .1, HEAD.z + .02), (0, 1, 0), 14)
    return F

# ---------------------------------------------------------------- cars
def car(F, color, L, W, R, belt_f, belt_r, roof, wind_base, wind_top, rear_top, rear_base, hood_rise=.05, bpillar=None, glass=GLASS, under='#2a2c2e', suv=False, interior=True, tray=False):
    zs = set([-L / 2, -L / 2 + .07, -L / 2 + .2, L / 2 - .2, L / 2 - .07, L / 2, wind_base, wind_top, rear_top, rear_base, rear_top + .16, wind_top - .07])
    wz = sorted(set(round(h.z, 3) for _, h, _, _ in F.wheels))
    for z0 in wz:
        for k in (-1.15, -.85, -.5, 0, .5, .85, 1.15): zs.add(z0 + k * R)
    bp = bpillar if bpillar is not None else (rear_top + wind_top) / 2
    zs |= {bp - .05, bp + .05}
    zs = sorted(zs); fill = []
    for a, b in zip(zs, zs[1:]):
        n = int((b - a) / .3)
        for k in range(1, n + 1): fill.append(a + (b - a) * k / (n + 1))
    zs = sorted(set(round(z, 4) for z in zs + fill)); zs = [z for i, z in enumerate(zs) if i == 0 or z - zs[i - 1] > .015]
    def sec(z):
        t = (z + L / 2) / L; belt = lerp(belt_r, belt_f, t)
        d = min(z + L / 2, L / 2 - z); e = min(1, d / .45)
        w = W * (.9 + .1 * math.sqrt(e)); belt_e = belt - (1 - e) * .1
        yb = .3 + (1 - e) * .08
        for z0 in wz:
            dz = abs(z - z0)
            if dz < R * 1.2: yb = max(yb, R + math.sqrt(max(0, (R * 1.2) ** 2 - dz * dz)) * .98)
        yb = min(yb, belt_e - .2)
        if rear_top <= z <= wind_top: top = roof
        elif wind_top < z < wind_base: top = lerp(roof, belt + hood_rise, (z - wind_top) / (wind_base - wind_top))
        elif rear_base < z < rear_top: top = lerp(belt + hood_rise, roof, (z - rear_base) / (rear_top - rear_base))
        else: top = belt_e + hood_rise
        top = max(top, belt_e + hood_rise)
        cab = (top - belt_e - hood_rise) / max(.01, roof - belt - hood_rise)
        rb = max(.02, min(.1, (belt_e - .1 - yb) / 2))
        wg = w - .12; wr = lerp(w - .26, w - (.36 if not suv else .24), cab); wt = lerp(w - .2, w - (.26 if not suv else .18), cab)
        sill = belt_e + .03; wty = max(sill + .015, top - .07 * cab - .012); rey = max(wty + .01, top - .005)
        half = [(0, yb), (w / 2 - rb, yb), (w / 2, yb + rb), (w / 2, belt_e - .1), (w / 2 - .012, belt_e), (wg / 2, sill), (wt / 2, wty), (wr / 2, rey), (0, top + .035 * (cab + .3))]
        loop = half + [(-x, y) for x, y in reversed(half[1:-1])]
        return [(x, y, z) for x, y in loop]
    def kind_fn(i, j, c):
        z = c.z
        if j in (0, 15): return 2
        if j in (5, 6, 7, 8, 9, 10) and wind_top + .01 < z < wind_base - .01: return 1
        if j in (5, 6, 7, 8, 9, 10) and rear_base + .01 < z < rear_top - .01: return 1
        if j in (5, 10) and rear_top + .16 < z < wind_top - .07 and abs(z - bp) > .05: return 1
        return 0
    loft([sec(z) for z in zs], [(color, 'paint'), (glass, 'glass'), (under, 'matte')], kind_fn, sub=2)
    fy = belt_f - .12; ry = belt_r - .14
    for s in (1, -1):
        rbox(CHROME, 'chrome', (s * (W / 2 - .24), fy, L / 2 - .05), (.26, .12, .06), .04); rbox(LENS, 'glass', (s * (W / 2 - .24), fy, L / 2 - .02), (.22, .09, .03), .035)
        rbox(AMBER, 'glass', (s * (W / 2 - .1), fy - .02, L / 2 - .08), (.08, .06, .05), .02)
        rbox(TAIL, 'glass', (s * (W / 2 - .2), ry, -L / 2 + .04), (.28, .1, .05), .03)
        mz = wind_base - .1; rbox(color, 'paint', (s * (W / 2 + .04), belt_f + .1, mz), (.08, .08, .14), .03); rbox('#cfe6f0', 'chrome', (s * (W / 2 + .065), belt_f + .1, mz - .02), (.03, .065, .1), .015)
        for z in ((bp + .2, rear_top + .45) if L > 3.6 and not tray else (bp + .2,)):
            rbox(CHROME, 'chrome', (s * (W / 2 - .002), belt_f - .1, z), (.02, .025, .12), .01)
    rbox('#2b2e31', 'matte', (0, fy - .02, L / 2 - .03), (W - .7, .14, .04), .03)
    for k in range(4): rbox(CHROME, 'chrome', (0, fy - .07 + k * .035, L / 2 - .01), (W - .74, .01, .02), .004)
    for zz, y in ((L / 2 - .04, .42), (-L / 2 + .04, .44)): rbox('#3a3d40', 'matte', (0, y, zz), (W - .04, .14, .12), .06)
    plate((0, .5, L / 2 + .03)); plate((0, .56, -L / 2 - .03), facing=-1)
    for s in (1, -1): tube('#2a2c2e', 'matte', [(s * .05, belt_f + hood_rise + .03, wind_base - .1), (s * .48, belt_f + hood_rise + .07, wind_base - .18)], .008, 4)
    if interior:
        dx = abs(F.pts['seat'].x) if 'seat' in F.pts else .38; sz = F.pts['seat'].z if 'seat' in F.pts else -.1
        for sx in (dx, -dx):
            rbox('#5a4a42', 'matte', (sx, F.pts['seat'].y + .02, sz), (.46, .12, .48), .05); rbox('#5a4a42', 'matte', (sx, F.pts['seat'].y + .34, sz - .26), (.44, .56, .12), .05, rot=(-.15, 0, 0))
        if not tray:
            rbox('#5a4a42', 'matte', (0, F.pts['seat'].y + .02, sz - .9), (W - .4, .12, .46), .05); rbox('#5a4a42', 'matte', (0, F.pts['seat'].y + .32, sz - 1.14), (W - .4, .54, .12), .05)
        rbox('#2b2e31', 'matte', (0, belt_f - .04, wind_base - .5), (W - .3, .14, .3), .05)
        if 'wheelAt' in F.pts:
            wa = F.pts['wheelAt']; lathe('#2b2e31', 'matte', [(.17 + .02 * math.cos(a), .02 * math.sin(a)) for a in [2 * PI * i / 8 for i in range(8)]], wa, (0, .5, .87), 20, closed=True)
            tube('#2b2e31', 'matte', [wa, wa + Vector((0, -.2, .35))], .02, 6)
    wheels_cast(F)

def sedan(color='#c8d4dc', taxi=False):
    F = Frame('veh-taxi' if taxi else 'veh-sedan')
    car(F, color, 3.9, 1.62, .3, .8, .84, 1.62, 1.0, .3, -1.0, -1.6, bpillar=-.3)
    if taxi:
        for s in (1, -1): rbox('#2f9a4a', 'paint', (s * .8, .62, 0), (.03, .12, 3.0), .01)
        rbox('#ffd23f', 'paint', (0, 1.73, -.3), (.5, .16, .22), .05); rbox('#2f9a4a', 'paint', (0, 1.73, -.3), (.46, .06, .225), .01)
    return F

def ute(color='#f4f4ee', tam=False):
    F = Frame('veh-tamTruck' if tam else 'veh-ute')
    car(F, color, 4.6, 1.62, .34, .92, .96, 1.6, 1.35, .8, .02, -.06, bpillar=.45, tray=True)
    rbox('#3a3d40', 'matte', (0, 1.0, -1.2), (1.5, .06, 2.0), .02)
    if not tam:
        for s in (1, -1): rbox(color, 'paint', (s * .78, 1.12, -1.2), (.06, .3, 2.0), .03)
        rbox(color, 'paint', (0, 1.12, -2.22), (1.6, .3, .06), .03)
    if not tam:
        for s in (1, -1): tube(CHROME, 'chrome', [(s * .7, .98, -.25), (s * .7, 1.62, -.25), (s * .55, 1.66, -.25)], .03, 8)
        tube(CHROME, 'chrome', [(-.55, 1.66, -.25), (.55, 1.66, -.25)], .03, 8)
        lathe(CHROME, 'chrome', [(.1 + .025 * math.cos(a), .025 * math.sin(a)) for a in [2 * PI * i / 6 for i in range(6)]], (0, .6, 2.36), (0, 0, 1), 14, closed=True)
    else:
        rbox('#3a78c8', 'paint', (0, 1.62, -1.2), (1.62, 1.3, 2.2), .06); rbox('#2f63a8', 'paint', (0, 2.3, -1.2), (1.66, .08, 2.24), .03)
    return F

def suv():
    F = Frame('veh-suv'); C = '#2f5a8a'
    car(F, C, 4.4, 1.62, .36, .98, 1.0, 1.62, 1.4, .85, -1.85, -2.05, bpillar=-.3, suv=True)
    for s in (1, -1): tube(CHROME, 'chrome', [(s * .62, 1.68, .6), (s * .62, 1.72, .5), (s * .62, 1.72, -1.5), (s * .62, 1.68, -1.6)], .018, 6)
    lathe('#3a3d40', 'matte', [(0, -.1), (.28, -.1), (.3, -.05), (.3, .05), (.28, .1), (0, .1)], (0, 1.0, -2.25), (0, 0, 1), 20)
    return F

# ---------------------------------------------------------------- buses, trams, coach
def box_loop(w, yb, yt, rt=.25, rb=.08, n=5, levels=()):
    """a rounded box cross-section, from the bottom centre round; levels: heights on the straight side that get their own
    edge (window and stripe edges)"""
    pts = [(0, yb)]
    for k in range(n + 1): a = -PI / 2 + PI / 2 * k / n; pts.append((w / 2 - rb + math.cos(a) * rb, yb + rb + math.sin(a) * rb))
    for i, y in enumerate(sorted(levels)): pts.append((w / 2, min(yt - rt - .01, max(yb + rb + .01 + i * .006, y))))   # (always the same count)
    for k in range(n + 1): a = PI / 2 * k / n; pts.append((w / 2 - rt + math.cos(a) * rt, yt - rt + math.sin(a) * rt))
    pts.append((0, yt + .03))
    return pts + [(-x, y) for x, y in reversed(pts[1:-1])]

def seats(L, W, rows=None, y=.95, col='#c9473f'):
    for k in range(rows or int((L - 3) / .95)):
        z = -L / 2 + 1.2 + k * .95
        for s in (1, -1): rbox(col, 'matte', (s * (W / 2 - .55), y, z), (.8, .12, .42), .04); rbox(col, 'matte', (s * (W / 2 - .55), y + .35, z - .2), (.8, .6, .08), .04)

def big(F, L, W, c1, c2, yb, yt, win0, win1, pillars, rt=.3, stripe=None, nose=.25, doors=(), roofc=None):
    zs = set([-L / 2, -L / 2 + .06, L / 2 - .06, L / 2] + [p + d for p in pillars for d in (-.05, .05)])
    R0 = F.w(0)[2]; wz = sorted(set(round(h.z, 3) for _, h, _, _ in F.wheels))
    for z0 in wz:
        for k in (-1.2, -.8, -.4, 0, .4, .8, 1.2): zs.add(z0 + k * R0)
    zs = sorted(zs); fill = []
    for a, b in zip(zs, zs[1:]):
        n = int((b - a) / .5)
        for k in range(1, n + 1): fill.append(a + (b - a) * k / (n + 1))
    zs = sorted(set(round(z, 4) for z in zs + fill)); zs = [z for i, z in enumerate(zs) if i == 0 or z - zs[i - 1] > .02]
    def sec(z):
        d = min(z + L / 2, L / 2 - z); e = min(1, d / nose); w = W * (.94 + .06 * math.sqrt(e)); b = yb
        for z0 in wz:
            dz = abs(z - z0)
            if dz < R0 * 1.25: b = max(b, R0 + math.sqrt(max(0, (R0 * 1.25) ** 2 - dz * dz)))
        b = min(b, win0 - .4)
        lv = [win0, win1, win0 - .03, win1 + .03] + (list(stripe) if stripe else [])
        return [(x, y, z) for x, y in box_loop(w, b, yt - (1 - e) * .03, rt, .08, levels=lv)]
    pil = lambda z: any(abs(z - p) < .05 for p in pillars)
    def kind_fn(i, j, c):
        if c.y < yb + .3 and abs(c.x) < W / 2 - .15: return 3
        if win0 < c.y < win1 and abs(c.x) > W / 2 - .2 and abs(c.z) < L / 2 - .1 and not pil(c.z): return 1
        if stripe and stripe[0] < c.y < stripe[1] and abs(c.x) > W / 2 - .2: return 2
        if roofc and c.y > yt - .05 and abs(c.x) < W / 2 - .2: return 4
        return 0
    loft([sec(z) for z in zs], [(c1, 'paint'), (GLASS, 'glass'), (c2 or c1, 'paint'), ('#2a2c2e', 'matte'), (roofc or c1, 'paint')], kind_fn, sub=1)
    liner((0, (win0 + yt) / 2 - .2, 0), (W - .3, yt - win0 + .6, L - .5))
    rbox(GLASS, 'glass', (0, (win0 + win1) / 2 + .05, L / 2 - .01), (W - .26, win1 - win0 + .1, .05), .06)
    rbox(GLASS, 'glass', (0, (win0 + win1) / 2 + .1, -L / 2 + .01), (W - .5, win1 - win0 - .2, .05), .06)
    for s in (1, -1):
        rbox(CHROME, 'chrome', (s * .9, .78, L / 2 + .01), (.32, .16, .06), .04); rbox(LENS, 'glass', (s * .9, .78, L / 2 + .035), (.28, .12, .03), .04)
        rbox(TAIL, 'glass', (s * .9, .85, -L / 2 - .01), (.3, .16, .05), .04)
        tube('#2b2e31', 'matte', [(s * (W / 2 - .05), win1 - .05, L / 2 - .25), (s * (W / 2 + .25), win1 - .02, L / 2 - .05), (s * (W / 2 + .26), win1 - .3, L / 2 + .05)], .02, 6)
        rbox('#2b2e31', 'matte', (s * (W / 2 + .26), win1 - .45, L / 2 + .05), (.06, .3, .16), .03)
    rbox('#3a3d40', 'matte', (0, .48, L / 2 + .02), (W - .02, .26, .14), .06); rbox('#3a3d40', 'matte', (0, .48, -L / 2 - .02), (W - .02, .26, .14), .06)
    rbox('#1d1f22', 'matte', (0, win1 + .17, L / 2 + .02), (W * .66, .26, .05), .03); rbox('#ffb43a', 'glass', (0, win1 + .17, L / 2 + .045), (W * .55, .13, .01), .005)
    plate((0, .66, L / 2 + .06)); plate((0, .7, -L / 2 - .06), facing=-1)
    for z, w in doors:
        rbox('#2b2e31', 'matte', (W / 2 - .02, (yb + win1) / 2 + .1, z), (.05, win1 - yb, w), .03)
        for d in (-w / 4, w / 4): rbox(GLASS, 'glass', (W / 2 + .005, (yb + win1) / 2 + .2, z + d), (.03, win1 - yb - .4, w / 2 - .08), .02)
    for name, hub, R, w in F.wheels: cast_wheel(hub, R, max(w, .22), 1 if hub.x >= 0 else -1, rim='#c9d0d4', part=name, arms=8)

def liner(c, size, col='#3d4448'):
    """the inside of a cabin: a dark box with its faces turned inwards, so through the windows one sees the far wall"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = B(xform(v.co, c, (0, 0, 0), size))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.reverse_faces(bm, faces=bm.faces)
    me = bpy.data.meshes.new('liner'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('liner', me); bpy.context.scene.collection.objects.link(o); o['pal'] = json.dumps([(col, 'matte')]); PIECES.append((o, 'body'))

def bus(vn=True):
    F = Frame('veh-bus' if vn else 'veh-busAU'); L = 9.6
    c1, c2 = ('#2f9a4a', '#ffd23f') if vn else ('#f4f4ee', '#2f6fb0')
    big(F, L, 2.42, c1, c2, .35, 2.95, 1.3, 2.55, [-L / 2 + .9 + k * 1.15 for k in range(8)], stripe=(.75, 1.05), doors=((L / 2 - 1.0, .9), (.2, .9)))
    rbox('#d9dde0', 'paint', (0, 3.05, -.6), (1.6, .22, 2.2), .08)
    seats(L, 2.42)
    return F

def coach():
    F = Frame('veh-coach'); L = 10.5
    big(F, L, 2.45, '#f2ead6', '#c8322a', .4, 3.1, 1.55, 2.75, [-L / 2 + 1.0 + k * 1.2 for k in range(8)], stripe=(1.1, 1.45), doors=((L / 2 - 1.1, .95),))
    rbox('#6a6f74', 'matte', (0, 3.22, -1.5), (2.0, .08, 5.5), .03)
    for s in (1, -1): tube(STEEL, 'chrome', [(s * 1.0, 3.2, -4.25), (s * 1.0, 3.4, -4.2), (s * 1.0, 3.4, 1.2), (s * 1.0, 3.2, 1.25)], .025, 6)
    rbox('#4a7ab8', 'matte', (-.4, 3.5, -1.9), (1.0, .5, 1.2), .08); rbox('#d8a83a', 'matte', (.45, 3.48, -.9), (.8, .45, .9), .08)
    tube('#8a6a3e', 'matte', [(-.95, 3.76, -1.9), (-.4, 3.78, -1.9), (.15, 3.76, -1.9)], .015, 4)
    seats(L, 2.45, col='#5a6ab8', y=1.1)
    return F

def tram(kind='w'):
    F = Frame('veh-tram' if kind == 'w' else 'veh-tramModern'); w = kind == 'w'; L = 10 if w else 16
    c1, c2 = ('#2f6b4a', '#f2e2b8') if w else ('#f4f4ee', '#7ac143')
    big(F, L, 2.4, c1, c2, .5, 2.9, 1.55, 2.55, [-L / 2 + .7 + k * 1.2 for k in range(int(L / 1.2))], stripe=(1.1, 1.5), nose=.3 if w else 1.2,
        doors=((L / 2 - 1.5, .9), (-L / 2 + 1.5, .9)) if w else ((L / 4, 1.2), (-L / 4, 1.2), (0, 1.2)), roofc='#6a4a3a' if w else '#c9d0d4')
    if w:
        rbox('#6a4a3a', 'matte', (0, 3.08, 0), (1.4, .26, L - 1.2), .08)
        tube('#2b2e31', 'matte', [(0, 3.15, -1.5), (0, 5.4, -4.6)], .03, 6); ell('#2b2e31', 'matte', (0, 5.42, -4.62), (.06, .06, .06))
        coil((0, 3.2, -1.4), (0, 3.2, -.9), .06, 6, .01, STEEL)
    else:
        for x in (-.6, .6): tube('#2b2e31', 'matte', [(x, 3.0, -.5), (x * .2, 3.4, 0), (x, 3.7, .5)], .02, 6)
        tube('#2b2e31', 'matte', [(-.7, 3.72, .5), (.7, 3.72, .5)], .02, 6)
        rbox('#d9dde0', 'paint', (0, 3.02, -3), (1.4, .2, 2.0), .08)
        for z in (-L / 6, L / 6): rbox('#2b2e31', 'matte', (0, 1.7, z), (2.42, 2.3, .14), .04)
    for z0 in sorted(set(round(h.z, 2) for _, h, _, _ in F.wheels))[::2]: rbox('#2b2e31', 'matte', (0, .48, z0 - .35), (1.6, .3, 1.2), .06)
    seats(L, 2.4, col='#8a5a3a' if w else '#3a78c8', y=1.0)
    return F

def tourist():
    F = Frame('veh-touristCart'); L = 4.6; WH = '#f4f4ee'
    rbox(WH, 'paint', (0, .5, -.05), (1.42, .36, L - .1), .14, seg=3)
    rbox(WH, 'paint', (0, .82, L / 2 - .42), (1.38, .5, .7), .18, seg=3)
    rbox('#2b2e31', 'matte', (0, .72, L / 2 - .02), (.9, .16, .05), .03)
    rbox('#3a3d40', 'matte', (0, .34, L / 2), (1.44, .14, .12), .05); rbox('#3a3d40', 'matte', (0, .34, -L / 2 + .02), (1.44, .14, .12), .05)
    rbox('#8a8f94', 'matte', (0, .69, -.2), (1.3, .02, L - 1.2), .01)
    rbox(WH, 'paint', (0, 2.15, -.05), (1.56, .08, L - .1), .04, seg=3)
    for x, z in ((.68, L / 2 - .72), (-.68, L / 2 - .72), (.68, -L / 2 + .2), (-.68, -L / 2 + .2), (.68, -.4), (-.68, -.4)): tube('#c9d0d4', 'chrome', [(x, .68, z), (x, 2.12, z)], .028, 8)
    rbox(GLASS, 'glass', (0, 1.6, L / 2 - .72), (1.3, .9, .03), .03, rot=(-.12, 0, 0))
    for k in range(4):
        z = L / 2 - 1.4 - k * .85
        rbox('#c62f2f', 'matte', (0, .8, z), (1.2, .1, .42), .04); rbox('#c62f2f', 'matte', (0, 1.06, z - .2), (1.2, .45, .08), .04)
        for x in (-.62, .62): tube('#c9d0d4', 'chrome', [(x, .86, z - .2), (x, 1.0, z - .1), (x, 1.0, z + .15)], .015, 6)
    wa = F.pts['handleL'].lerp(F.pts['handleR'], .5)
    lathe('#2b2e31', 'matte', [(.15 + .018 * math.cos(a), .018 * math.sin(a)) for a in [2 * PI * i / 8 for i in range(8)]], wa, (0, .7, .7), 20, closed=True)
    tube('#2b2e31', 'matte', [wa, wa + Vector((0, -.3, .3))], .02, 6)
    rbox(WH, 'paint', (-.3, .78, L / 2 - 1.3), (.52, .1, .42), .04)
    for s_ in (1, -1): lamp((s_ * .5, .76, L / 2 - .06), .06)
    for s_ in (1, -1): rbox(TAIL, 'glass', (s_ * .55, .55, -L / 2 + .03), (.16, .08, .04), .02)
    for name, hub, R, w in F.wheels: cast_wheel(hub, R, max(w, .15), 1 if hub.x >= 0 else -1, part=name)
    plate((0, .5, -L / 2 - .01), facing=-1)
    return F

def dumptruck():
    F = Frame('veh-dumpTruck'); C = '#2f6fb0'
    rbox('#3a3d40', 'matte', (0, .78, -.2), (1.2, .22, 6.2), .04)
    def sec(z):
        top = 2.82 if z < 2.75 else lerp(2.82, 2.3, (z - 2.75) / .3)
        return [(x, y, z) for x, y in box_loop(2.3, .72, top, .22, .1)]
    def kf(i, j, c):
        if 1.8 < c.y < 2.6 and (c.z > 2.78 or (abs(c.x) > 1.0 and 1.55 < c.z < 2.7)): return 1
        return 0
    loft([sec(z) for z in (1.35, 1.6, 2.0, 2.4, 2.7, 2.95, 3.05)], [(C, 'paint'), (GLASS, 'glass')], kf, sub=1)
    rbox('#3a3d40', 'matte', (0, 1.0, 3.06), (2.1, .3, .12), .05)
    for s in (1, -1):
        rbox(CHROME, 'chrome', (s * .8, 1.25, 3.07), (.3, .18, .05), .04); rbox(LENS, 'glass', (s * .8, 1.25, 3.095), (.26, .14, .02), .03)
        tube('#2b2e31', 'matte', [(s * 1.15, 2.4, 2.8), (s * 1.4, 2.42, 2.9), (s * 1.4, 2.15, 2.95)], .02, 6); rbox('#2b2e31', 'matte', (s * 1.4, 2.0, 2.95), (.06, .3, .16), .03)
        lathe('#c9d0d4', 'chrome', [(0, -.5), (.24, -.5), (.25, -.45), (.25, .45), (.24, .5), (0, .5)], (s * .85, .95, .8), (0, 0, 1), 18)
        rbox('#3a3d40', 'matte', (s * .9, .95, -3.2), (.5, .5, .5), .06)
    tube(CHROME, 'chrome', [(-1.0, 1.0, 1.25), (-1.0, 3.0, 1.25)], .06, 10)
    for name, hub, R, w in F.wheels:
        cast_wheel(hub, R, max(w, .3), 1 if hub.x >= 0 else -1, rim='#d9dde0', part=name, arms=8)
        if hub.z > 0: fender(Vector((hub.x * 1.03, hub.y, hub.z)), R + .1, -20, 200, .18, '#2b2e31', 'matte')
    Y = '#c9a43a'; P = 'bed'   # the tipper bed in its own space: z = 0 is the hinge at the back
    rbox(Y, 'paint', (0, .1, 2.15), (2.3, .15, 4.3), .04, part=P)
    for s in (1, -1): rbox(Y, 'paint', (s * 1.1, .7, 2.15), (.1, 1.1, 4.3), .04, part=P)
    rbox(Y, 'paint', (0, .85, 4.3), (2.3, 1.4, .12), .05, part=P); rbox('#b8932e', 'paint', (0, .65, .02), (2.3, 1.1, .1), .04, part=P)
    for k in range(4):
        for s in (1, -1): rbox('#8a6e22', 'paint', (s * 1.17, .7, .6 + k * 1.1), (.05, 1.0, .1), .02, part=P)
    rbox(Y, 'paint', (0, 1.6, 4.0), (2.3, .08, .8), .03, part=P)
    return F

def excavator():
    F = Frame('veh-excavator'); Y, DK = '#f2b81e', '#2b2e31'
    for s in (1, -1):
        x = s * 1.0
        rbox('#3a3d40', 'matte', (x, .35, 0), (.42, .38, 3.0), .1)
        for z in (-1.4, -.7, 0, .7, 1.4): lathe('#5a5f64', 'chrome', [(0, -.2), (.22, -.2), (.25, -.15), (.25, .15), (.22, .2), (0, .2)], (x, .32, z), (1, 0, 0), 14)
        path = arc_pts((x, .37, 1.45), .33, 0, 180, 6) + arc_pts((x, .37, -1.45), .33, 180, 360, 6)
        sweep('#2a2c2e', 'matte', path + [path[0], path[1]], [(.3, .035)], 8, 6, k=3, cap=False)
        P2 = catmull(path + [path[0]], 3); L2 = [0]
        for i in range(1, len(P2)): L2.append(L2[-1] + (P2[i] - P2[i - 1]).length)
        for k in range(34):
            d = L2[-1] * k / 34; i = next(i for i in range(1, len(L2)) if L2[i] >= d); f = (d - L2[i - 1]) / max(1e-6, L2[i] - L2[i - 1]); p = P2[i - 1].lerp(P2[i], f)
            t = (P2[i] - P2[i - 1]).normalized(); rbox('#26292c', 'matte', p, (.62, .05, .12), .015, rot=(-math.atan2(t.y, t.z), 0, 0), seg=1)
    rbox('#3a3d40', 'matte', (0, .8, 0), (1.5, .3, 1.5), .08)
    T = 'turn'
    rbox(Y, 'paint', (0, .45, -.3), (2.4, .9, 2.8), .18, part=T)
    sweep(Y, 'paint', [(0, .55, -1.6), (0, .6, -1.85)], [(1.15, .42)], 18, 5, part=T)
    rbox('#3a3d40', 'matte', (-.45, .95, -.9), (1.2, .12, 1.4), .04, part=T)
    for k in range(5): rbox(DK, 'matte', (-.45, 1.0, -1.4 + k * .25), (1.1, .04, .08), .01, part=T)
    rbox(Y, 'paint', (.6, 1.6, .55), (1.0, 1.4, 1.1), .1, part=T)
    for c, sz in (((.6, 1.75, 1.11), (.86, .9, .03)), ((1.11, 1.75, .55), (.03, .9, .96)), ((.09, 1.75, .55), (.03, .9, .96))): rbox(GLASS, 'glass', c, sz, .03, part=T)
    rbox('#5a5f64', 'matte', (.6, .95, .3), (.5, .4, .45), .05, part=T)
    tube(CHROME, 'chrome', [(-.6, .9, -1.2), (-.6, 1.6, -1.2)], .06, 10, part=T)
    for z in (-1.6, .1): tube('#3a3d40', 'matte', [(1.15, .9, z), (1.25, 1.1, z), (1.25, 1.1, z + .6), (1.15, .9, z + .6)], .02, 6, part=T)
    sweep(Y, 'paint', [(0, 0, -.2), (0, .1, 1.2), (0, 0, 3.0)], [(.18, .22), (.18, .28), (.16, .2)], 14, 6, part='boom')
    tube(CHROME, 'chrome', [(0, -.35, .3), (0, -.32, 1.4)], .05, 8, part='boom'); lathe(Y, 'paint', [(0, 0), (.09, 0), (.09, .7), (0, .7)], (0, -.36, -.2), (0, .02, 1), 12, part='boom')
    sweep(Y, 'paint', [(0, 0, -.25), (0, .05, 1.0), (0, 0, 2.2)], [(.15, .2), (.15, .22), (.13, .16)], 14, 6, part='arm')
    tube(CHROME, 'chrome', [(0, .3, -.1), (0, .28, 1.2)], .04, 8, part='arm')
    lathe('#5a5f64', 'chrome', [(.5, 0), (.52, .1), (.45, .35), (.25, .5), (.1, .45), (.1, .3)], (0, -.12, 0), (1, 0, 0), 18, arc=(PI * .1, PI * 1.25), part='bucket')
    for x in (-.46, .46): rbox('#5a5f64', 'chrome', (x, -.2, 0), (.04, .5, .6), .02, part='bucket')
    for x in (-.3, -.1, .1, .3): rbox('#8e959a', 'chrome', (x, -.5, -.3), (.08, .08, .15), .02, part='bucket')
    return F

# ---------------------------------------------------------------- boats (they face +x)
def ferry():
    F = Frame('boat-ferry')
    def sec(x):
        k = max(0, (x - 2.5) / 2.45); hw = 1.6 * math.sqrt(max(.02, 1 - k * k)); keel = -.05 + k * .3
        half = [(keel, 0)]
        for a in range(1, 7): t = a / 6; half.append((keel + (1 - math.cos(t * PI / 2)) * .5, math.sin(t * PI / 2) * hw))
        half += [(1.2, hw), (1.25, hw * .98), (1.22, 0)]
        full = half + [(y, -z) for y, z in reversed(half[1:-1])]
        return [(x, y, z) for y, z in full]
    def kf(i, j, c):
        if c.y > 1.18: return 3
        if c.y < .25: return 2
        if c.y < .42: return 1
        return 0
    loft([sec(x) for x in (-3.6, -3.5, -3.0, -2, -1, 0, 1, 2, 2.8, 3.5, 4.2, 4.7, 4.95)], [('#ffffff', 'paint'), ('#2f86c0', 'paint'), ('#c8372d', 'paint'), ('#c98a4a', 'matte')], kf, sub=1)
    rbox('#e8f6ff', 'paint', (-1.8, 2.1, 0), (2.6, 1.8, 2.4), .1)
    for s in (1, -1):
        for x in (-2.55, -1.8, -1.05): rbox(GLASS, 'glass', (x, 2.3, s * 1.205), (.6, .6, .02), .04)
    rbox(GLASS, 'glass', (-.5, 2.3, 0), (.02, .6, 2.0), .04)
    rbox('#ff5a5a', 'paint', (-1.8, 3.1, 0), (3.0, .2, 2.8), .08)
    lathe('#ffd23f', 'paint', [(0, 0), (.3, 0), (.28, .8), (.25, 1.15), (0, 1.15)], (-1.8, 3.2, 0), (0, 1, 0), 16)
    lathe('#2b2238', 'matte', [(.26, 1.15), (.3, 1.15), (.3, 1.35), (0, 1.35)], (-1.8, 3.2, 0), (0, 1, 0), 16)
    for s in (1, -1):
        for i in range(8): tube('#ffffff', 'chrome', [(-.2 + i * .62, 1.2, s * 1.48), (-.2 + i * .62, 1.7, s * 1.48)], .03, 6)
        tube('#ffffff', 'chrome', [(-.3, 1.7, s * 1.48), (4.2, 1.7, s * 1.48 * .7)], .035, 6)
    lathe('#ff5a5a', 'paint', [(.32 + .1 * math.cos(a), .1 * math.sin(a)) for a in [2 * PI * i / 8 for i in range(8)]], (1, 1.6, 1.52), (0, 0, 1), 16, closed=True)
    for x in (1.4, 2.6):
        rbox('#2f86c0', 'paint', (x, 1.45, 0), (.5, .1, 2.0), .03); rbox('#2f86c0', 'paint', (x - .22, 1.7, 0), (.08, .45, 2.0), .03)
    return F

def raft():
    F = Frame('boat-raft')
    for i in range(9):
        z = -1.6 + i * .4; prof = [(0, -2.5)]
        for k in range(7):
            x = -2.5 + k * 5 / 6; prof += [(.2, x + .02), (.215, x + .06), (.2, x + .1)]
        lathe('#c9b45a' if i % 2 else '#b8a24a', 'matte', prof + [(.2, 2.5), (0, 2.5)], (0, .25, z), (1, 0, 0), 10)
    for x in (-1.8, 1.8):
        rbox('#8a6a3a', 'matte', (x, .5, 0), (.18, .14, 3.6), .04)
        for z in (-1.6, -.8, 0, .8, 1.6): lathe('#6a4a2a', 'matte', [(.24 + .03 * math.cos(a), .03 * math.sin(a)) for a in [2 * PI * i / 6 for i in range(6)]], (x, .4, z), (0, 0, 1), 10, closed=True)
    for x, z in ((-1.6, -1.3), (1.6, -1.3), (-1.6, 1.3), (1.6, 1.3)): tube('#8a6a3a', 'matte', [(x, .5, z), (x, 2.1, z)], .06, 8)
    tube('#c9b45a', 'matte', [(1.6, .6, 0), (3.0, 2.6, 0)], .05, 6)
    return F

BUILD = {'veh-honda67': honda67, 'veh-cub': cub, 'veh-dream': dream, 'veh-scooter': scooter, 'veh-xichlo': xichlo, 'veh-baGac': bagac,
         'veh-postie': postie, 'veh-trailBike': trailbike, 'veh-quadBike': quadbike, 'veh-roadster': roadster, 'veh-miniBike': minibike,
         'veh-roadBike': roadbike, 'veh-bmx': bmxbike, 'veh-kidsBike': kidsbike, 'veh-packBike': packbike,
         'veh-sedan': lambda: sedan(), 'veh-taxi': lambda: sedan('#f4f4ee', True), 'veh-ute': lambda: ute(), 'veh-suv': suv,
         'veh-bus': lambda: bus(True), 'veh-busAU': lambda: bus(False), 'veh-tram': lambda: tram('w'), 'veh-tramModern': lambda: tram('e'),
         'veh-touristCart': tourist, 'veh-tamTruck': lambda: ute('#f2f2f2', True), 'veh-coach': coach, 'veh-dumpTruck': dumptruck,
         'veh-excavator': excavator, 'boat-ferry': ferry, 'boat-raft': raft}

# ---------------------------------------------------------------- putting a vehicle together
def budget(name, part):
    if part == 'body': return 7000 if name.startswith(('veh-bus', 'veh-tram', 'veh-coach', 'boat', 'veh-dump', 'veh-exc')) else 4500
    if part.startswith('wheel'): return 800 if len([p for p in DATA[name]['parts'] if p['name'].startswith('wheel')]) <= 4 else 500
    return 1400

def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); PIECES.clear()
    s = bpy.context.scene; s.render.engine = 'CYCLES'; s.cycles.device = 'CPU'; s.cycles.samples = 24
    w = bpy.data.worlds.new('w'); s.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1)
    for k in KINDS:
        m = bpy.data.materials.new(k); m.use_nodes = True; nt = m.node_tree; ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
        nt.links.new(ca.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])

def finish_piece(o, part):
    """apply the bevels and smoothing, write the colours into the corners, one material per kind"""
    for m in list(o.modifiers):
        with bpy.context.temp_override(object=o, active_object=o): bpy.ops.object.modifier_apply(modifier=m.name)
    pal = json.loads(o['pal']); me = o.data
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    idx = [p.material_index for p in me.polygons]
    me.materials.clear()
    for k in KINDS: me.materials.append(bpy.data.materials[k])
    for p, mi in zip(me.polygons, idx):
        c, kind = pal[min(mi, len(pal) - 1)]
        if part.startswith('wheel'): kind = 'wheel'
        rgb = lin(c)
        for li in p.loop_indices: col.data[li].color = (*rgb, 1)
        p.material_index = KINDS.index(kind)
    me.color_attributes.active_color = col

def bake_ao(objs, others):
    for o in others: o.hide_render = True
    for o in objs:
        o.hide_render = False; me = o.data; ao = me.color_attributes.new('ao', 'FLOAT_COLOR', 'CORNER'); me.color_attributes.active_color = ao
    s = bpy.context.scene; s.render.bake.target = 'VERTEX_COLORS'; s.world.light_settings.distance = .5
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    try: bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    except Exception as e: print('AO bake skipped', e)
    for o in objs:
        me = o.data; col, ao = me.color_attributes['Col'], me.color_attributes['ao']
        for i in range(len(col.data)):
            a = ao.data[i].color[0]; k = .5 + .5 * a; c = col.data[i].color
            col.data[i].color = (c[0] * k, c[1] * k, c[2] * k, 1)
        me.color_attributes.remove(ao); me.color_attributes.active_color = me.color_attributes['Col']
    for o in others: o.hide_render = False

def build(name):
    reset(); F = BUILD[name]()
    parts = {}
    for o, part in PIECES: parts.setdefault(part, []).append(o)
    for part, objs in parts.items():
        for o in objs: finish_piece(o, part)
    objs_by = {}
    for part, objs in parts.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1: bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active; o.name = part; o.data.name = part
        bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.0002); bm.to_mesh(o.data); bm.free()
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
        want = budget(name, part)
        if tris(o) > want:
            # thin it, but keep every edge between two colours or kinds where it is (window edges, stripes stay crisp)
            bm = bmesh.new(); bm.from_mesh(o.data); cl = bm.loops.layers.float_color.get('Col'); edge = set()
            fc = lambda f: (f.material_index, tuple(round(x, 3) for x in f.loops[0][cl][:3]))
            for e in bm.edges:
                if len(e.link_faces) == 2 and fc(e.link_faces[0]) != fc(e.link_faces[1]): edge.update(v.index for v in e.verts)
                elif len(e.link_faces) != 2: edge.update(v.index for v in e.verts)
            bm.free()
            g = o.vertex_groups.new(name='free'); g.add([v.index for v in o.data.vertices if v.index not in edge], 1.0, 'REPLACE')
            d = o.modifiers.new('thin', 'DECIMATE'); d.decimate_type = 'COLLAPSE'; d.ratio = want / tris(o); d.use_collapse_triangulate = True
            d.vertex_group = 'free'; d.vertex_group_factor = 1.0
            with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]): bpy.ops.object.modifier_apply(modifier=d.name)
        objs_by[part] = o
    body = objs_by.get('body')
    if body is None:
        body = bpy.data.objects.new('body', None); bpy.context.scene.collection.objects.link(body)
    bp = {p['name']: p for p in F.d['parts']}
    # wheels were made round their hub in the vehicle's space; the bed, turn, boom, arm and bucket in their own space
    for part, o in objs_by.items():
        if part == 'body': continue
        p = bp[part]
        if part.startswith('wheel'):
            hub = B(p['pos']); o.data.transform(Matrix.Translation(-hub)); o.location = hub; o.parent = body
        else:
            o.parent = objs_by.get(p['parent']) or body
            o.location = B(p['pos']); qx, qy, qz, qw = p['quat']; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Quaternion((qw, qx, -qz, qy))
    for k, v in F.d['points'].items():
        e = bpy.data.objects.new(k, None); e.empty_display_size = .05; bpy.context.scene.collection.objects.link(e); e.parent = body; e.location = B(v)
    bpy.context.view_layer.update()
    meshes = [o for o in objs_by.values() if o.type == 'MESH']
    still = [o for o in meshes if not o.name.startswith('wheel')]
    if still: bake_ao(still, [o for o in meshes if o not in still])
    for o in meshes:
        if o.name.startswith('wheel'): bake_ao([o], [x for x in meshes if x is not o])
    mn = [1e9] * 3; mx = [-1e9] * 3
    for o in meshes:
        for v in o.data.vertices:
            g = o.matrix_world @ v.co; gg = (g.x, g.z, -g.y)
            mn = [min(a, b) for a, b in zip(mn, gg)]; mx = [max(a, b) for a, b in zip(mx, gg)]
    bb = F.d['box']
    print('BOX', name, 'model', [round(x, 2) for x in mn], [round(x, 2) for x in mx], 'game', bb[0], bb[1], flush=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_animations=False, export_lights=False, export_cameras=False,
                              export_vertex_color='ACTIVE', export_normals=True, export_texcoords=False, export_yup=True)
    print('MODEL', name, sum(tris(o) for o in meshes), 'tris', ' '.join(f'{o.name}:{tris(o)}' for o in meshes), flush=True)

for name in DATA:
    if ONLY and name not in ONLY: continue
    try: build(name)
    except Exception as e:
        import traceback; traceback.print_exc(); print('FAILED', name, e, flush=True)

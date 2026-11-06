# (v1.08g props, owner 6 Nov 2026 AEDT) The story chapters' props (Ha Noi and Sydney), the hawkers' shoulder poles, the
# market stalls with their food, and Uncle Robbo's sausage sizzle, remade in Blender as new picture-book designs: soft,
# rounded, chunky, in the style of the four friends and the gallery (docs/characters-v108/gallery/).
# - Each model is drawn in its code shape's own frame (three.js units: metres, y up, +z the front), with the code shape's
#   footprint, height and facing, so the colliders, tap spots, the lights on the bridge rails and the story's steps stay
#   true (tests/props-fit.mts compares every model's box with its code shape's).
# - One mesh, colours in the corners (no pictures), one material; soft shading baked into the corner colours; packed
#   with meshopt by gltfpack (tools/make-props.mts runs both).
# Run: blender -b -P tools/blender/world-props.py -- models/world [name ...]
import sys, os, math, random
sys.dont_write_bytecode = True
import bpy, bmesh
from mathutils import Matrix, Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else 'models/world'
ONLY = set(argv[1:])
os.makedirs(OUT, exist_ok=True)
TAU = math.pi * 2
H = math.pi / 2

# ---------- colours: the game's hex colours are sRGB; the corners hold linear values (as three.js merge() does) ----------
def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hexc(h):
    h = h.lstrip('#')
    return (lin(int(h[0:2], 16)), lin(int(h[2:4], 16)), lin(int(h[4:6], 16)), 1.0)

# three (x, y, z) -> Blender (x, -z, y); the glTF export (y up) turns it back
TO_BL = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))

def mat_of(pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    """three.js P(): T * R(XYZ) * S"""
    s = (scl, scl, scl) if isinstance(scl, (int, float)) else scl
    return Matrix.Translation(Vector(pos)) @ Euler(rot, 'ZYX').to_matrix().to_4x4() @ Matrix.Diagonal((s[0], s[1], s[2], 1))

def tmp_geo(make):
    """a primitive made by bmesh.ops in a scratch bmesh, read back as (verts, faces)"""
    bm = bmesh.new(); make(bm)
    v = [tuple(x.co) for x in bm.verts]; idx = {x: i for i, x in enumerate(bm.verts)}
    f = [[idx[l.vert] for l in fc.loops] for fc in bm.faces]
    bm.free(); return v, f

# ---------- primitives, in three.js's frame, centred on the origin ----------
# (bmesh makes them z-up; Z2Y turns them y-up)
Z2Y = Matrix.Rotation(-H, 4, 'X')
def g_sphere(r=1, u=12, v=8):
    return tmp_geo(lambda bm: bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r, matrix=Z2Y))
def g_cyl(rt=1, rb=1, h=1, seg=16, cap=True):
    return tmp_geo(lambda bm: bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=rb, radius2=rt, depth=h, matrix=Z2Y))
def g_rbox(w=1, h=1, d=1, r=.05, seg=2):
    """a box with rounded edges (r: the rounding)"""
    def make(bm):
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((w, d, h, 1)) @ Matrix.Identity(4))
        r2 = min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)
        if r2 > 1e-3: bmesh.ops.bevel(bm, geom=list(bm.edges) + list(bm.verts), offset=r2, segments=seg, profile=.5, affect='EDGES', clamp_overlap=True)
        bmesh.ops.transform(bm, matrix=Z2Y, verts=bm.verts)
    return tmp_geo(make)
def g_torus(R=1, r=.2, seg=24, tseg=8, arc=TAU):
    v, f = [], []
    full = arc >= TAU - 1e-6; n = seg if full else seg + 1
    for i in range(n):
        a = arc * i / seg
        for j in range(tseg):
            b = TAU * j / tseg; rr = R + r * math.cos(b)
            v.append((rr * math.cos(a), rr * math.sin(a), r * math.sin(b)))
    for i in range(seg):
        i2 = (i + 1) % n if full else i + 1
        for j in range(tseg):
            j2 = (j + 1) % tseg
            f.append([i * tseg + j, i2 * tseg + j, i2 * tseg + j2, i * tseg + j2])
    return v, f
def g_lathe(prof, seg=20, arc=TAU, a0=0):
    """prof: [(radius, y)] from the bottom up; a closed surface of revolution about y (caps where the radius is 0)"""
    v, f = [], []; full = arc >= TAU - 1e-6; n = seg if full else seg + 1
    for i in range(n):
        a = a0 + arc * i / seg
        for r, y in prof: v.append((r * math.sin(a), y, r * math.cos(a)))
    m = len(prof)
    for i in range(seg):
        i2 = (i + 1) % n if full else i + 1
        for j in range(m - 1):
            q = [i * m + j, i * m + j + 1, i2 * m + j + 1, i2 * m + j]
            f.append(q)
    return v, f
def g_star(ro=.3, ri=.13, d=.1, pts=5):
    """a flat star (a prism), in the x-y plane, depth d along z"""
    ring = []
    for i in range(pts * 2):
        r = ro if i % 2 == 0 else ri; a = i / (pts * 2) * TAU + H
        ring.append((math.cos(a) * r, math.sin(a) * r))
    v = [(x, y, d / 2) for x, y in ring] + [(x, y, -d / 2) for x, y in ring] + [(0, 0, d / 2), (0, 0, -d / 2)]
    n = len(ring); f = []
    for i in range(n):
        j = (i + 1) % n
        f.append([i, j, n + j, n + i][::-1]); f.append([2 * n, i, j]); f.append([2 * n + 1, n + j, n + i])
    return v, f

class Model:
    """parts in three.js's frame joined into one bmesh, colours in the corners"""
    def __init__(self, seed=1):
        self.bm = bmesh.new(); self.col = self.bm.loops.layers.float_color.new('Col'); self.rnd = random.Random(seed)
    def add(self, vf, color, M=Matrix.Identity(4), jitter=True):
        v, f = vf; c = hexc(color) if isinstance(color, str) else color
        if jitter:   # (each part a touch different, as if painted by hand)
            k = .96 + self.rnd.random() * .07; c = (min(1, c[0] * k), min(1, c[1] * k), min(1, c[2] * k), 1)
        W = TO_BL @ M; flip = W.to_3x3().determinant() < 0
        vs = [self.bm.verts.new(W @ Vector(p)) for p in v]
        for fc in f:
            ids = list(reversed(fc)) if flip else fc
            try: face = self.bm.faces.new([vs[i] for i in ids])
            except ValueError: continue
            for l in face.loops: l[self.col] = c
    # shorthands: position, turn (x, y, z radians), stretch
    def sph(self, r, color, pos, scl=1, rot=(0, 0, 0), u=12, v=8): self.add(g_sphere(r, u, v), color, mat_of(pos, rot, scl))
    def cyl(self, rt, rb, h, color, pos, rot=(0, 0, 0), seg=16, scl=1, cap=True): self.add(g_cyl(rt, rb, h, seg, cap), color, mat_of(pos, rot, scl))
    def box(self, w, h, d, color, pos, rot=(0, 0, 0), r=.04, seg=2): self.add(g_rbox(w, h, d, r, seg), color, mat_of(pos, rot))
    def tor(self, R, r, color, pos, rot=(0, 0, 0), seg=24, tseg=8, arc=TAU, scl=1): self.add(g_torus(R, r, seg, tseg, arc), color, mat_of(pos, rot, scl))
    def lathe(self, prof, color, pos=(0, 0, 0), rot=(0, 0, 0), seg=20, scl=1): self.add(g_lathe(prof, seg), color, mat_of(pos, rot, scl))
    def rod(self, a, b, r, color, seg=8, r2=None):
        """a round rod from point a to point b"""
        a, b = Vector(a), Vector(b); d = b - a; L = d.length
        if L < 1e-4: return
        R = Vector((0, 1, 0)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        self.add(g_cyl(r if r2 is None else r2, r, L, seg), color, Matrix.Translation((a + b) / 2) @ R)
    def bamboo(self, a, b, r, color='#c9a35a', node='#a8823e', every=.35):
        """a bamboo cane: a rod with darker rings at its nodes"""
        self.rod(a, b, r, color, 10)
        a, b = Vector(a), Vector(b); L = (b - a).length; n = max(1, int(L / every))
        R = Vector((0, 1, 0)).rotation_difference((b - a).normalized()).to_matrix().to_4x4()
        for k in range(1, n):
            p = a + (b - a) * (k / n); self.add(g_torus(r * 1.02, r * .28, 10, 4), node, Matrix.Translation(p) @ R @ Matrix.Rotation(H, 4, 'X'))
    def eye(self, pos, r, look=(0, 0, 1), white='#ffffff', pupil='#2a2238', shine=True):
        """a big friendly eye: white, a dark pupil and a shine (looking along +z unless turned)"""
        x, y, z = pos
        self.sph(r, white, (x, y, z), (1, 1.1, .55))
        self.sph(r * .62, pupil, (x, y - r * .05, z + r * .38), (1, 1.15, .5))
        if shine: self.sph(r * .2, '#ffffff', (x + r * .2, y + r * .25, z + r * .62), (1, 1, .5), u=8, v=6)
    def smile(self, pos, w, color='#7a2a2a', t=.02, rot=(0, 0, 0)):
        self.tor(w, t, color, pos, (0, 0, math.pi + rot[2]), seg=12, tseg=6, arc=math.pi)
    def weave(self, prof, a, b, pos, seg=22, bands=None):
        """a woven basket: a lathe with alternating light and dark bands"""
        bands = bands or len(prof) - 1
        for k in range(len(prof) - 1):
            self.add(g_lathe([prof[k], prof[k + 1]], seg), a if k % 2 else b, mat_of(pos))

# ================= Story, Ha Noi (js/content/chapter2props.ts) =================
def m_starlantern(m):
    """the stick and bamboo frame of the star lantern (the glowing paper star itself stays the game's, so it still lights
    up and takes its colour): a bamboo stick, the star's bamboo edges on both faces, paper tassels and a hand grip"""
    m.bamboo((0, -.08, -.237), (0, 1.17, -.005), .02, every=.3)
    m.cyl(.03, .03, .16, '#e8433a', (0, .05, -.215), (.18, 0, 0), seg=10)   # the red grip
    ring = []
    for i in range(10):
        r = .32 if i % 2 == 0 else .145; a = i / 10 * TAU + H; ring.append((math.cos(a) * r, 1.15 + math.sin(a) * r))
    for z in (-.075, .075):
        for i in range(10):
            (x0, y0), (x1, y1) = ring[i], ring[(i + 1) % 10]; m.rod((x0, y0, z), (x1, y1, z), .012, '#b98a3a', 6)
        m.sph(.03, '#ffd23f', (0, 1.47, z))
    for i in range(0, 10, 2): m.sph(.025, '#ffd23f', (ring[i][0], ring[i][1], 0))
    for s in (-1, 1):   # tassels from the two lower points
        x, y = ring[4 if s < 0 else 6]
        m.rod((x, y, 0), (x + s * .03, y - .2, .02), .012, '#ffd23f', 6, r2=.04)
        m.sph(.035, '#ff7a2a', (x + s * .035, y - .25, .02))

def m_stoneturtle(m):
    """a gentle stone turtle with a smile carrying a stele with a rounded top and a carved frame (Van Mieu)"""
    stone, dark, light, slab = '#a29e94', '#837f75', '#bdb8ac', '#c2bcae'
    m.sph(.5, stone, (0, .2, 0), (1, .5, 1.22), u=16, v=10)                 # the shell
    for i in range(6):                                                         # the shell's plates
        a = i / 6 * TAU; m.sph(.15, light, (math.sin(a) * .28, .38, math.cos(a) * .36), (1, .35, 1.1), u=10, v=6)
    m.sph(.14, light, (0, .44, 0), (1, .3, 1.1), u=10, v=6)
    m.tor(.5, .05, dark, (0, .14, 0), (H, 0, 0), seg=28, tseg=6, scl=(1, 1.22, 1))   # the shell's rim
    m.sph(.17, stone, (0, .3, .74), (1, .9, 1.1), u=12, v=8)                 # the head, friendly
    for s in (-1, 1): m.sph(.035, '#2e2a26', (s * .07, .36, .87), u=8, v=6); m.sph(.012, '#ffffff', (s * .07 + .012, .375, .9), u=6, v=4)
    m.smile((0, .26, .86), .05, '#5a554c', .012)
    for x, z in ((-1, 1), (1, 1), (-1, -1), (1, -1)): m.sph(.13, dark, (x * .4, .09, z * .44), (1.15, .6, 1), u=12, v=8)
    m.sph(.07, dark, (0, .12, -.66), (1, .7, 1.3), u=10, v=6)                 # the tail
    m.box(.66, .9, .14, slab, (0, .84, -.02), r=.04)                           # the stele
    m.add(g_lathe([(0, 0), (.33, 0), (.33, .02), (0, .02)], 24), slab, mat_of((0, 1.29, -.09), (H, 0, 0)))
    m.add(g_cyl(.33, .33, .14, 24), slab, mat_of((0, 1.29, -.02), (H, 0, 0)))  # the rounded top (a full disc, its lower half in the slab)
    m.box(.48, .62, .03, '#aaa496', (0, .82, .06), r=.01)                      # the carved panel
    for k in range(5): m.box(.36, .02, .02, '#8f897c', (0, .62 + k * .1, .08), r=.005)   # lines of carved words
    m.tor(.12, .018, '#aaa496', (0, 1.3, .06), seg=16, tseg=4)                # a carved sun on the top
    m.box(.74, .08, .2, dark, (0, .41, -.02), r=.03)                           # the foot of the stele

def m_lionhead(m):
    """the lion-dance head (mua lan): round and red, a gold forehead with a little mirror, big kind eyes, a pink nose, a
    smile, a soft horn and a fluffy mane of red, gold and white pom-poms (never scary: G8)"""
    m.sph(.42, '#e8433a', (0, 0, 0), (1.1, 1, 1), u=16, v=10)
    m.sph(.25, '#ffd23f', (0, .2, .26), (1.3, .6, .5), u=12, v=8)            # the gold forehead
    m.cyl(.07, .07, .03, '#bfe8ff', (0, .26, .42), (H, 0, 0), seg=16)         # the mirror
    m.tor(.075, .015, '#ffd23f', (0, .26, .43), seg=16, tseg=6)
    m.sph(.21, '#ffd23f', (0, -.12, .32), (1.3, .75, .85), u=12, v=8)        # the muzzle
    m.sph(.09, '#ff8ab0', (0, -.02, .5), (1.2, .9, .9), u=12, v=8)            # the nose
    m.smile((0, -.1, .52), .09, '#7a1a14', .018)
    m.sph(.045, '#ff8ab0', (0, -.17, .5), (1.4, .6, .6), u=10, v=6)           # the tongue
    for s in (-1, 1):
        m.eye((s * .18, .12, .33), .12)
        m.tor(.12, .02, '#2a2238', (s * .18, .15, .37), (0, 0, 0), seg=12, tseg=4, arc=math.pi)   # the lids, gold-lined
        m.box(.14, .03, .05, '#2a2238', (s * .19, .31, .36), (0, 0, -s * .3), r=.012)   # brows, lifted kindly in the middle
        m.sph(.05, '#ff8ab0', (s * .3, -.08, .32), (1, .7, .5), u=8, v=6)    # cheeks
        m.sph(.11, '#ffd23f', (s * .44, .02, -.02), (.6, 1, 1), u=12, v=8)  # ears
    m.add(g_cyl(.0, .06, .18, 12), '#ffd23f', mat_of((0, .48, .12), (.3, 0, 0)))   # the soft horn
    m.sph(.035, '#ff7a2a', (0, .58, .15), u=8, v=6)
    for i in range(13):                                                        # the mane
        a = -1.6 + i * (3.2 / 12); col = ('#ffd23f', '#ff7a2a', '#ffffff')[i % 3]
        m.sph(.105, col, (math.sin(a) * .47, .14 + math.cos(a) * .32, -.12), u=10, v=8)
    for s in (-1, 1):
        for k in range(3): m.sph(.08, '#ffffff', (s * (.36 - k * .1), -.33 - k * .03, .18 - k * .05), u=10, v=6)   # the beard

def m_mooncakes(m):
    """mooncakes on a blue-and-white plate: three cakes with flower tops, one cut to show its yolk, a teacup beside"""
    m.lathe([(0, 0), (.36, 0), (.37, .03), (.42, .045), (.42, .06), (.36, .05), (0, .05)], '#f6f2ea', seg=28)
    m.tor(.4, .01, '#3b6fe0', (0, .056, 0), (H, 0, 0), seg=28, tseg=4)
    m.tor(.31, .006, '#3b6fe0', (0, .052, 0), (H, 0, 0), seg=28, tseg=4)
    for i, (x, z) in enumerate(((-.16, 0), (.16, .05))):
        col = '#c98a3a'
        m.lathe([(0, 0), (.13, 0), (.14, .02), (.14, .08), (.12, .1), (0, .1)], col, (x, .06, z), seg=20)
        for k in range(8):   # the scalloped edge
            a = k / 8 * TAU; m.sph(.03, '#b8772e', (x + math.cos(a) * .135, .12, z + math.sin(a) * .135), (1, .7, 1), u=8, v=5)
        m.tor(.06, .012, '#8a5a2a', (x, .162, z), (H, 0, 0), seg=14, tseg=4)
        m.sph(.025, '#8a5a2a', (x, .162, z), (1, .4, 1), u=8, v=5)
        for k in range(4):
            a = k / 4 * TAU + .4; m.sph(.02, '#8a5a2a', (x + math.cos(a) * .09, .161, z + math.sin(a) * .09), (1, .4, 1), u=6, v=4)
    # the cut one: a half cake with a gold yolk
    m.add(g_lathe([(0, 0), (.13, 0), (.14, .02), (.14, .08), (.12, .1), (0, .1)], 14, arc=math.pi), '#e8c06a', mat_of((0, .06, -.18)))
    m.box(.26, .1, .01, '#f0d090', (0, .11, -.18), r=.003)
    m.sph(.045, '#ff9a2e', (0, .11, -.175), (1, 1, .3), u=10, v=6)
    m.lathe([(0, 0), (.05, 0), (.06, .06), (.055, .065), (0, .02)], '#ffffff', (.3, .06, -.2), seg=16)   # the teacup
    m.cyl(.045, .045, .01, '#c98a3a', (.3, .115, -.2), seg=14)

def m_thehuc(m):
    """the red The Huc bridge for the film: a smooth arch of planks, rail panels with gold posts (their tops where the game
    hangs its lights: y = bridgeY + 0.7), and red pillars"""
    by = lambda t: .5 + math.sin(t * math.pi) * 1.4
    N = 14
    for i in range(N):
        t0, t1 = i / N, (i + 1) / N; x0, x1 = -7 + t0 * 14, -7 + t1 * 14
        xm, ym = (x0 + x1) / 2, (by(t0) + by(t1)) / 2; ang = math.atan2(by(t1) - by(t0), x1 - x0)
        m.box(x1 - x0 + .03, .2, 2, '#d9302a' if i % 2 else '#c92a24', (xm, ym, 0), (0, 0, ang), r=.02, seg=1)
        for s in (-1, 1):
            m.box(x1 - x0 + .02, .08, .14, '#e8433a', (xm, ym + .66, s), (0, 0, ang), r=.03, seg=1)   # the hand rail
            m.box(x1 - x0 + .02, .06, .1, '#a8281e', (xm, ym + .18, s), (0, 0, ang), r=.02, seg=1)
    for i in range(0, 11):
        t = i / 10; x = -7 + t * 14; y = by(t)
        for s in (-1, 1):
            m.cyl(.06, .07, .62, '#e8433a', (x, y + .38, s), seg=8)
            m.sph(.08, '#ffd23f', (x, y + .72, s), u=10, v=6)
            if i < 10:   # a lattice panel between posts
                t2 = (i + .5) / 10; x2 = -7 + t2 * 14; y2 = by(t2)
                m.tor(.17, .025, '#ffd23f', (x2, y2 + .42, s), seg=10, tseg=4)
    for x in (-6, -2, 2, 6):
        y = by((x + 7) / 14)
        m.cyl(.15, .18, 1.4, '#a8281e', (x, y - .6, 0), seg=14)
        m.cyl(.22, .22, .1, '#7a1a14', (x, y - 1.28, 0), seg=14)

# ================= Story, Sydney (js/content/chapter3props.ts) =================
def m_ferry(m):
    """a little Sydney ferry, about 3 m: a round green hull with a gold stripe, a cream and gold cabin with round windows,
    a soft roof, a funnel, life rings and a flag"""
    g, gold, cream = '#2f8a3a', '#ffd23f', '#fff1c8'
    m.box(3, .6, 1.2, g, (0, .3, 0), r=.26, seg=3)
    m.box(3.04, .1, 1.24, gold, (0, .52, 0), r=.05)
    m.box(2.9, .06, 1.1, '#e8dcc0', (0, .63, 0), r=.03)                         # the deck
    m.box(2.2, .66, 1, gold, (0, .97, 0), r=.12, seg=2)                          # the cabin
    for x in (-.7, 0, .7):
        for z in (-.5, .5):
            m.cyl(.15, .15, .04, '#5fb6ff', (x, 1.02, z), (H, 0, 0), seg=14)
            m.tor(.15, .025, cream, (x, 1.02, z * 1.02), seg=14, tseg=4)
    m.box(2.36, .14, 1.12, g, (0, 1.36, 0), r=.07)                               # the roof
    m.cyl(.13, .14, .48, g, (.4, 1.6, 0), seg=14)                                 # the funnel
    m.cyl(.145, .145, .1, gold, (.4, 1.7, 0), seg=14)
    for x in (-1.45, 1.45): m.tor(.12, .04, '#ff5a3a', (x * .62, .9, .52), seg=14, tseg=6)   # life rings
    m.rod((-.9, 1.42, 0), (-.9, 1.84, 0), .012, '#ffffff', 6)
    m.box(.2, .12, .02, '#ff5a3a', (-.79, 1.77, 0), r=.01)                       # the flag
    for x in (-1.2, 1.2): m.rod((x, .66, -.55), (x, .66, .55), .02, '#ffffff', 6)

def m_gumtree(m):
    """a gum tree (s = 1): a smooth pale trunk with soft grey patches, a branch where the koala sits, and clouds of
    blue-green leaves with little gum nuts"""
    bark, patch = '#ece6da', '#c8c0b2'
    m.lathe([(0, 0), (.36, 0), (.26, .3), (.2, 1.8), (.17, 3.2), (.12, 3.8), (0, 3.8)], bark, seg=16)
    for i in range(7):
        a = i * 2.1; y = .5 + i * .45; m.sph(.08, patch, (math.sin(a) * .2, y, math.cos(a) * .2), (1, 1.8, .4), (0, a, 0), u=8, v=6)
    m.rod((0, 2.5, 0), (.5, 2.6, .5), .07, bark, 8)                               # the koala's branch
    m.rod((0, 3.2, 0), (.7, 3.7, .2), .08, bark, 8); m.rod((0, 3.3, 0), (-.6, 3.7, -.2), .08, bark, 8)
    rnd = random.Random(3)
    for cx, cy, cz, r in ((0, 4.05, 0, 1.25), (.85, 3.65, .3, .85), (-.75, 3.75, -.2, .85)):
        for k in range(6):
            a = k / 6 * TAU + rnd.random(); rr = r * (.5 + rnd.random() * .15)
            off = (math.cos(a) * r * .55, (rnd.random() - .3) * r * .4, math.sin(a) * r * .55)
            m.sph(rr, ('#7fa88a', '#8fb89a', '#6f9a7c')[k % 3], (cx + off[0], cy + off[1], cz + off[2]), (1, .78, 1), u=12, v=8)
        m.sph(r * .62, '#86ae90', (cx, cy + r * .25, cz), (1, .8, 1), u=12, v=8)
    for k in range(6):
        a = k * 1.3; m.sph(.05, '#a0703a', (math.cos(a) * .9, 3.4 + (k % 3) * .3, math.sin(a) * .9), u=6, v=4)

def m_koala(m):
    """a sleepy, smiling koala hugging the branch (about 0.6 m): fluffy ears, a big soft nose, closed happy eyes"""
    grey, light, belly = '#9a9a9e', '#c4c4c8', '#ece8e0'
    m.sph(.26, grey, (0, 0, 0), (1, 1.1, .92), u=14, v=9)
    m.sph(.15, belly, (0, -.02, .15), (1, 1.25, .5), u=12, v=8)
    m.sph(.21, grey, (0, .31, .05), u=14, v=9)
    for s in (-1, 1):
        m.sph(.12, light, (s * .18, .44, .02), (1, 1, .55), u=12, v=8)
        m.sph(.07, '#ffd6e0', (s * .18, .44, .07), (1, 1, .4), u=10, v=6)
        m.sph(.055, '#ffffff', (s * .24, .5, .02), (1, 1, .5), u=8, v=6)   # the ear fluff
        m.tor(.035, .01, '#2a2238', (s * .075, .34, .235), (0, 0, 0), seg=10, tseg=4, arc=math.pi)   # sleepy eyes
        m.sph(.035, '#ffb3c8', (s * .12, .27, .22), (1, .7, .4), u=8, v=5)   # cheeks
        m.sph(.07, grey, (s * .2, .06, .2), (1, .8, 1.3), u=10, v=8)           # arms round the branch
        m.sph(.06, grey, (s * .14, -.22, .16), (1, .8, 1.2), u=10, v=8)        # feet
        for k in (-1, 0, 1): m.sph(.012, '#3a3a42', (s * .2 + k * .02, .05, .28), u=6, v=4)   # claws
    m.sph(.07, '#3a3a42', (0, .29, .24), (1, 1.15, .8), u=12, v=8)              # the big nose
    m.sph(.018, '#8a8a92', (.02, .32, .3), u=6, v=4)
    m.smile((0, .22, .245), .03, '#5a3a3a', .008)

def m_harbourbridge(m):
    """the Harbour Bridge for the film backdrop (30 m): a grey steel arch with a lattice, a deck with a road, two stone
    pylons with little flags"""
    steel, dark, road = '#8a929c', '#6f7782', '#5a5e66'
    m.box(30, .45, 2.4, steel, (0, 3, 0), r=.06)
    m.box(29.6, .06, 1.8, road, (0, 3.25, 0), r=.02)
    for s in (-1, 1): m.box(30, .2, .08, '#c8ccd2', (0, 3.4, s * 1.15), r=.03)
    arch = lambda t: 3 + math.sin(t * math.pi) * 7
    N = 24
    for lvl, off in (('top', 0), ('bot', -1.1)):
        for i in range(N):
            t0, t1 = i / N, (i + 1) / N
            for s in (-1, 1):
                a = (-14 + t0 * 28, arch(t0) + off * math.sin(t0 * math.pi), s * .95); b = (-14 + t1 * 28, arch(t1) + off * math.sin(t1 * math.pi), s * .95)
                m.rod(a, b, .17 if lvl == 'top' else .13, steel if lvl == 'top' else dark, 8)
    for i in range(1, N):   # the lattice between the two arches and the hangers down to the deck
        t = i / N; x = -14 + t * 28; y = arch(t)
        for s in (-1, 1):
            m.rod((x, y, s * .95), (x, y - 1.1 * math.sin(t * math.pi), s * .95), .06, dark, 6)
            if i % 2 == 0 and 3.5 < y - 1.1 * math.sin(t * math.pi): m.rod((x, y - 1.1 * math.sin(t * math.pi), s * .95), (x, 3.25, s * .95), .04, '#9aa0a8', 6)
            if i < N - 1:
                t2 = (i + 1) / N; m.rod((x, y, s * .95), (-14 + t2 * 28, arch(t2) - 1.1 * math.sin(t2 * math.pi), s * .95), .045, dark, 6)
        if i % 3 == 0: m.rod((x, y, -.95), (x, y, .95), .06, dark, 6)
    for x in (-15, 15):
        m.box(2.4, 6, 3, '#d8c9aa', (x, 3, 0), r=.12, seg=2)
        m.box(2.6, .3, 3.2, '#c8b898', (x, 5.95, 0), r=.08)
        for k in range(3): m.box(2.44, .06, 3.04, '#c4b494', (x, 1.2 + k * 1.5, 0), r=.02, seg=1)
        m.cyl(.03, .03, 1.2, '#ffffff', (x, 6.7, 0), seg=6)
        m.box(.5, .3, .03, '#3b6fe0', (x + .27, 7.1, 0), r=.01, seg=1)

# ================= The hawkers' shoulder poles (js/hawkers.ts, Co Thu in js/regions.ts) =================
# The pole's frame: along x (2.4 m), baskets at x = -1.1 and 1.1 hanging to y -0.95, ropes up to the pole (y 0).
def pole_base(m, deep=False):
    m.bamboo((-1.2, 0, 0), (1.2, 0, 0), .04, every=.4)
    for x in (-1.1, 1.1):
        prof = [(0, -.95), (.24, -.95), (.28, -.9), (.31, -.84), (.33, -.77), (.34, -.7), (.34, -.63)]
        m.weave(prof, '#c99a5a', '#a87a3e', (x, 0, 0))
        m.tor(.345, .03, '#8a6a3a', (x, -.62, 0), (H, 0, 0), seg=22, tseg=6)
        for k in range(3):   # three ropes to a knot on the pole
            a = k / 3 * TAU + .5; m.rod((x + math.cos(a) * .32, -.62, math.sin(a) * .32), (x, -.02, 0), .01, '#7a5a3a', 5)
        m.sph(.04, '#7a5a3a', (x, -.03, 0), u=8, v=6)
    m.cyl(.045, .045, .12, '#e8433a', (0, 0, 0), (0, 0, H), seg=10)              # the shoulder pad

def heap(m, x, y, items, rnd):
    """goods heaped in a basket: items = [(colour, radius, stretch)]"""
    for k, (c, r, s) in enumerate(items):
        a = k * 2.4 + rnd.random(); d = .05 + (k % 3) * .09
        m.sph(r, c, (x + math.cos(a) * d, y + (k // 3) * r * .9, math.sin(a) * d), s, (0, a, 0), u=12, v=8)

def bowls(m, x, y, n=3, col='#ffffff', band='#3b6fe0'):
    for k in range(n):
        m.lathe([(0, 0), (.06, 0), (.13, .07), (.12, .075), (0, .02)], col, (x, y + k * .045, 0), seg=16)
        m.tor(.125, .006, band, (x, y + k * .045 + .06, 0), (H, 0, 0), seg=16, tseg=3)

def pot(m, x, y, col='#c8ccd2', lid='#a8acb2', r=.22, h=.26):
    m.lathe([(0, 0), (r * .9, 0), (r, .04), (r, h), (r * .92, h + .02), (0, h + .02)], col, (x, y, 0), seg=20)
    m.lathe([(0, 0), (r * .95, 0), (r * .7, .06), (.04, .08), (0, .08)], lid, (x, y + h + .02, 0), seg=20)
    m.sph(.035, '#2a2a2a', (x, y + h + .11, 0), u=8, v=6)
    for s in (-1, 1): m.tor(.04, .012, '#5a5e66', (x + s * r, y + h * .7, 0), (0, H, 0), seg=10, tseg=4)

def noodles(m, x, y, rnd):
    for k in range(5):
        a = k * 1.3; m.tor(.05, .012, '#fff6e0', (x + math.cos(a) * .1, y + .02 * (k % 2), math.sin(a) * .1), (H, a, 0), seg=10, tseg=4)

def m_pole_traicay(m):
    """Co Ba's fruit: a basket of mangoes and one of bananas, and a watermelon cut in slices"""
    pole_base(m); rnd = random.Random(1)
    heap(m, -1.1, -.62, [('#ffc23a', .1, (1, .85, 1.35))] * 6 + [('#ff9a2e', .1, (1, .85, 1.35))] * 2, rnd)
    for k in range(5): m.rod((1.1 - .12 + k * .06, -.62, -.12), (1.1 - .1 + k * .06, -.45, .12), .035, '#ffe14a', 8)   # a hand of bananas
    m.sph(.04, '#6a8a3a', (1.1, -.47, .14), u=6, v=4)
    m.add(g_cyl(.14, .14, .05, 14, True), '#5fb84a', mat_of((1.15, -.5, -.18), (0, 0, 0), (1, 1, 1)))   # a watermelon slice on top
    m.add(g_cyl(.12, .12, .052, 14, True), '#ff4a5a', mat_of((1.15, -.5, -.18)))

def m_pole_tauhu(m):
    """Ba Tu's tau hu: a big tofu pot with a lid on one side, a stack of little bowls and a ginger jar on the other"""
    pole_base(m)
    pot(m, -1.1, -.64, '#d8dde2', '#b8bec6', .24, .24)
    bowls(m, 1.0, -.62, 4)
    m.lathe([(0, 0), (.06, 0), (.07, .1), (.04, .14), (0, .14)], '#c98a3a', (1.22, -.62, .08), seg=12)   # the ginger syrup jar
    m.sph(.03, '#ffd23f', (1.22, -.47, .08), u=8, v=6)

def m_pole_bunoc(m):
    """Co Hang's bun oc: a soup pot, and a basket of snail shells and noodle nests"""
    pole_base(m); rnd = random.Random(2)
    pot(m, -1.1, -.64, '#c8ccd2', '#a8acb2', .24, .24)
    for k in range(6):
        a = k * 1.1; x, z = 1.1 + math.cos(a) * .15, math.sin(a) * .15
        m.lathe([(0, 0), (.06, 0), (.045, .05), (.02, .08), (0, .09)], '#8a6a4a', (x, -.62, z), seg=12)
        m.tor(.035, .01, '#c8a882', (x, -.57, z), (H, 0, 0), seg=10, tseg=4)
    noodles(m, 1.1, -.55, rnd)

def m_pole_bunrieu(m):
    """Chi Sau's bun rieu: a red soup pot, and a basket with two smiling crabs and noodle nests"""
    pole_base(m); rnd = random.Random(4)
    pot(m, -1.1, -.64, '#e8433a', '#c0392b', .24, .24)
    for k, (dx, dz) in enumerate(((-.1, .05), (.1, -.06))):
        x, z = 1.1 + dx, dz
        m.sph(.1, '#ff6a3a', (x, -.56, z), (1.2, .55, 1), u=14, v=8)
        for s in (-1, 1):
            m.sph(.035, '#ff6a3a', (x + s * .14, -.53, z + .05), u=8, v=6)
            m.sph(.02, '#ffffff', (x + s * .04, -.5, z + .08), u=6, v=4); m.sph(.01, '#2a2238', (x + s * .04, -.5, z + .095), u=6, v=4)
    noodles(m, 1.1, -.6, rnd)

def m_pole_banhda(m):
    """Co Ut's banh da lon: a tray of green and yellow layer cake slices, and banana-leaf parcels"""
    pole_base(m)
    m.cyl(.3, .3, .03, '#e8dcc0', (-1.1, -.63, 0), seg=20)
    for k in range(6):
        a = k / 6 * TAU; x, z = -1.1 + math.cos(a) * .17, math.sin(a) * .17
        for j in range(4): m.box(.1, .025, .1, '#5fd39a' if j % 2 else '#ffd23f', (x, -.6 + j * .026, z), (0, a, 0), r=.008, seg=1)
    for k in range(5):
        a = k * 1.25; x, z = 1.1 + math.cos(a) * .14, math.sin(a) * .14
        m.box(.13, .06, .09, '#5aa84a', (x, -.6 + (k // 3) * .06, z), (0, a, 0), r=.025)
        m.box(.015, .065, .095, '#e8dcc0', (x, -.6 + (k // 3) * .06, z), (0, a, 0), r=.005, seg=1)

def m_pole_cothu(m):
    """Co Thu's com: green rice flakes heaped in lotus leaves in both baskets"""
    pole_base(m)
    for x in (-1.1, 1.1):
        m.sph(.3, '#5aa84a', (x, -.64, 0), (1, .28, 1), u=18, v=8)               # the lotus leaf
        m.sph(.22, '#9ad860', (x, -.58, 0), (1, .45, 1), u=16, v=8)              # the com
        for k in range(8):
            a = k / 8 * TAU; m.sph(.05, '#b8e870', (x + math.cos(a) * .12, -.52, math.sin(a) * .12), u=8, v=5)
        m.rod((x, -.62, 0), (x - .1, -.45, .05), .01, '#e8dcc0', 5)

# ================= The market stalls (js/regions.ts stall(), w 2.8, d 1.6; the counter's top at 0.95) =================
# The frame: the counter along x, its front (the street) at +z; the posts at the corners; the awning slopes from the back
# (y 2.9) down to the front (y 2.4), out to z 1.6 like the code shape's.
def stall_base(m, a, b, rnd):
    w, d = 2.8, 1.6
    m.box(w - .1, .82, d - .1, '#9a6a44', (0, .43, 0), r=.08, seg=2)          # the counter
    m.box(w + .06, .08, d + .06, '#e8dcc0', (0, .9, 0), r=.03)                   # its top
    for k in range(7): m.box(.34, .7, .03, a if k % 2 == 0 else b, (-1.2 + k * .4, .45, d / 2 - .03), r=.03, seg=1)   # a cloth skirt
    for k in range(7): m.sph(.05, b if k % 2 == 0 else a, (-1.2 + k * .4, .1, d / 2), (1, 1, .4), u=8, v=5)
    for x in (-1, 1):
        for z in (-1, 1): m.bamboo((x * 1.33, 0, z * .73), (x * 1.33, 2.62 - (z + 1) * .12, z * .73), .05, every=.5)
    # the awning: a soft striped roof sloping to the front, with a scalloped edge
    n = 7; sw = (w + .3) / n
    for k in range(n):
        x = -(w + .3) / 2 + sw * (k + .5)
        m.box(sw + .01, .07, 2.5, a if k % 2 == 0 else b, (x, 2.66, .3), (.18, 0, 0), r=.03, seg=1)
        m.sph(sw * .5, a if k % 2 == 0 else b, (x, 2.43, 1.52), (1, .6, .35), u=12, v=6)
    m.rod((-1.6, 2.86, -.9), (1.6, 2.86, -.9), .05, '#7a5236', 8)

def lanterns(m, xs, y, z, cols):
    for x, c in zip(xs, cols):
        m.rod((x, y + .1, z), (x, y + .26, z), .008, '#2a2a2a', 4)
        m.sph(.11, c, (x, y, z), (1, 1.2, 1), u=12, v=8)
        m.cyl(.05, .05, .03, '#ffd23f', (x, y + .13, z), seg=10); m.cyl(.05, .05, .03, '#ffd23f', (x, y - .13, z), seg=10)
        m.rod((x, y - .14, z), (x, y - .25, z), .012, '#ffd23f', 4)

def m_stall_bahai(m):
    """Ba Hai's pho: a big pho pot, a stack of bowls, herbs and limes, chopsticks in a pot"""
    rnd = random.Random(11); stall_base(m, '#c0392b', '#f6e7c8', rnd)
    pot(m, -.6, .94, '#c8ccd2', '#a8acb2', .3, .36)
    for k in range(3):
        m.lathe([(0, 0), (.07, 0), (.15, .08), (.14, .085), (0, .02)], '#ffffff', (.35 + k * .02, .94 + k * .05, .1), seg=16)
        m.tor(.145, .007, '#c0392b', (.35 + k * .02, 1.0 + k * .05, .1), (H, 0, 0), seg=16, tseg=3)
    m.lathe([(0, 0), (.07, 0), (.15, .08), (.14, .085), (0, .02)], '#ffffff', (.9, .94, .35), seg=16)
    m.cyl(.13, .13, .02, '#fff2d0', (.9, 1.0, .35), seg=16)                     # a bowl of pho with its noodles
    for k in range(4): m.sph(.025, '#5fb84a', (.88 + k * .03, 1.02, .32 + (k % 2) * .05), (1.5, .4, 1), u=6, v=4)
    m.sph(.022, '#ff4a3a', (.95, 1.02, .4), u=6, v=4)
    m.weave([(0, 0), (.16, 0), (.2, .08), (.21, .14)], '#c99a5a', '#a87a3e', (1.0, .94, -.25))
    for k in range(6): m.sph(.07, '#4cae4a', (1.0 + math.cos(k) * .08, 1.08, -.25 + math.sin(k) * .08), (1, .6, 1), u=8, v=6)   # herbs
    for k in range(3): m.sph(.035, '#9ad840', (.6 + k * .07, .97, .45), u=8, v=6)   # limes
    m.cyl(.05, .05, .14, '#3b6fe0', (.15, 1.01, .45), seg=12)
    for k in range(5): m.rod((.13 + k * .01, 1.0, .45), (.1 + k * .015, 1.22, .45), .006, '#e8c98a', 4)   # chopsticks
    lanterns(m, (-.9, .9), 2.25, 1.25, ('#ff3a2a', '#ffd23f'))

def m_stall_olai(m):
    """O Lai's banh beo: stacks of little saucers, a tray of banh beo with shrimp, chilli bowl and a steamer"""
    rnd = random.Random(12); stall_base(m, '#7a4aa8', '#f6e7c8', rnd)
    m.cyl(.45, .45, .03, '#c99a5a', (-.4, .96, .15), seg=20)
    for k in range(9):
        x, z = -.4 + ((k % 3) - 1) * .26, .15 + (k // 3 - 1) * .26
        m.lathe([(0, 0), (.06, 0), (.1, .03), (.095, .035), (0, .01)], '#ffffff', (x, .975, z), seg=14)
        m.cyl(.07, .07, .015, '#fff6e8', (x, 1.0, z), seg=12); m.sph(.02, '#ff8a4a', (x, 1.01, z), (1.4, .6, 1), u=6, v=4)
    for k in range(6): m.lathe([(0, 0), (.06, 0), (.1, .03), (.095, .035), (0, .01)], '#ffffff', (.55, .94 + k * .03, -.2), seg=14)
    m.cyl(.2, .22, .26, '#b98a4a', (.75, 1.07, .25), seg=18)                     # a bamboo steamer
    m.cyl(.21, .21, .04, '#a87a3e', (.75, 1.21, .25), seg=18)
    m.lathe([(0, 0), (.05, 0), (.09, .05), (0, .02)], '#ffffff', (1.05, .94, .5), seg=12)
    for k in range(4): m.add(g_cyl(0, .02, .08, 8), '#e8333a', mat_of((1.03 + k * .015, .99, .48 + (k % 2) * .03), (H * .9, 0, k)))
    lanterns(m, (-.9, .9), 2.25, 1.25, ('#a66bff', '#ffd23f'))

def m_stall_chunam(m):
    """Chu Nam's Hoi An lanterns: silk lanterns in many colours hanging from the awning, more on the counter, and little
    conical hats"""
    rnd = random.Random(13); stall_base(m, '#e8a33a', '#f6e7c8', rnd)
    lanterns(m, (-1.05, -.55, -.05, .45, .95), 2.15, 1.2, ('#ff3a2a', '#ffd23f', '#3cc7e8', '#ff7eb8', '#5fd36a'))
    lanterns(m, (-.8, .2, 1.0), 2.25, .5, ('#a66bff', '#ff9f43', '#ff3a2a'))
    for k, c in enumerate(('#ff3a2a', '#ffd23f', '#3cc7e8')): m.sph(.12, c, (-.9 + k * .3, 1.06, .3), (1, 1.2, 1), u=12, v=8)
    for k in range(3):
        x = .4 + k * .3
        m.add(g_cyl(0, .17, .12, 18), '#e8d8a0', mat_of((x, .99 + k * .005, .35 - k * .05)))   # non la
        m.tor(.165, .008, '#c9a25a', (x, .94 + k * .005, .35 - k * .05), (H, 0, 0), seg=16, tseg=3)

def m_stall_chutam(m):
    """Chu Tam's banh mi: a glass case of crunchy baguettes, cucumbers, pate jar and a chilli bottle"""
    rnd = random.Random(14); stall_base(m, '#3a78c8', '#f6e7c8', rnd)
    m.box(1.0, .5, .6, '#e8f6ff', (-.55, 1.2, .0), r=.04)                        # the glass case (pale)
    m.box(1.04, .05, .64, '#3a78c8', (-.55, 1.46, 0), r=.02)
    for k in range(5): m.sph(.07, '#e8a94a', (-.85 + k * .15, 1.03, (k % 2) * .12 - .06), (2.8, .8, 1), (0, .4 * (k % 2), 0), u=12, v=8)   # baguettes
    for k in range(3): m.sph(.07, '#e8a94a', (.35 + k * .03, 1.0 + k * .07, .3), (2.8, .8, 1), (0, .3, 0), u=12, v=8)
    for k in range(3): m.sph(.04, '#4cae4a', (.85 + k * .1, .98, -.1), (2.4, 1, 1), u=10, v=6)   # cucumbers
    m.cyl(.06, .06, .1, '#c98a5a', (.95, 1.0, .35), seg=12)
    m.cyl(.035, .04, .18, '#e8333a', (1.15, 1.04, .4), seg=10); m.cyl(.015, .015, .05, '#ffffff', (1.15, 1.15, .4), seg=8)
    lanterns(m, (-.9, .9), 2.25, 1.25, ('#3a78c8', '#ffd23f'))

def m_stall_cout(m):
    """Co Ut's coconuts and che: green coconuts with straws, glasses of colourful che and a bowl of crushed ice"""
    rnd = random.Random(15); stall_base(m, '#2f9a5a', '#f6e7c8', rnd)
    for k in range(7):
        x = -.95 + (k % 4) * .24; z = .1 + (k // 4) * .26 - .13; y = 1.06 + (k // 4) * .02
        m.sph(.13, '#5fb84a', (x, y, z), (1, 1.05, 1), u=12, v=8)
        if k < 3: m.cyl(.04, .04, .01, '#ffffff', (x, y + .13, z), seg=10); m.rod((x, y + .13, z), (x + .03, y + .3, z), .01, '#ff7eb8', 5)
    for k, cols in enumerate((('#5fd36a', '#ffd23f', '#fff6e8'), ('#ff7eb8', '#ffffff', '#a66bff'), ('#ffd23f', '#5fd36a', '#ff9a2e'))):
        x = .35 + k * .25
        for j, c in enumerate(cols): m.cyl(.06, .055, .055, c, (x, .97 + j * .055, .25), seg=12)
        m.cyl(.065, .065, .02, '#e8f6ff', (x, 1.14, .25), seg=12)
        m.rod((x, 1.1, .25), (x + .03, 1.24, .25), .007, '#3cc7e8', 4)
    m.lathe([(0, 0), (.1, 0), (.2, .1), (.19, .11), (0, .03)], '#c8ccd2', (.75, .94, -.3), seg=16)
    m.sph(.15, '#f4fbff', (.75, 1.02, -.3), (1, .45, 1), u=12, v=6)
    lanterns(m, (-.9, .9), 2.25, 1.25, ('#2f9a5a', '#ffd23f'))

def m_sizzle(m):
    """Uncle Robbo's sausage sizzle: a blue gazebo with a white peak and a scalloped edge, a barbecue with snags and
    onions, bread, sauce bottles and a little flag line"""
    blue, white = '#2f7ac8', '#ffffff'
    m.box(2.4, .8, 1.2, '#4a4a52', (0, .45, 0), r=.08)                           # the barbecue cart
    m.box(2.3, .08, 1.1, '#2a2a30', (0, .9, 0), r=.03)
    for k in range(7): m.box(2.2, .02, .03, '#5a5a62', (0, .95, -.45 + k * .15), r=.008, seg=1)   # the grill
    for k, x in enumerate((-.75, -.45, -.15, .15, .45)):
        m.add(g_cyl(.06, .06, .5, 12), '#c8483a', mat_of((x, 1.0, .05), (0, 0, H)))
        m.sph(.06, '#c8483a', (x - .25, 1.0, .05), u=8, v=6); m.sph(.06, '#c8483a', (x + .25, 1.0, .05), u=8, v=6)
    for k in range(6): m.tor(.05, .015, '#ffe9b0', (.6 + (k % 3) * .14, .98, -.25 + (k // 3) * .14), (H, 0, 0), seg=10, tseg=4)   # onions
    for k in range(4): m.box(.25, .08, .12, '#f4e2b8', (-.8 + k * .05, .99 + k * .08, -.35), r=.03)   # bread
    for k, c in enumerate(('#e8333a', '#ffd23f')): m.cyl(.04, .045, .2, c, (.95 + k * .12, 1.04, .4), seg=12); m.add(g_cyl(0, .02, .05, 8), c, mat_of((.95 + k * .12, 1.17, .4)))
    m.cyl(.05, .05, .2, '#5a5a62', (-1.0, 1.04, .4), seg=10)                     # the tongs pot
    for x in (-1.6, 1.6):
        for z in (-1.4, 1.4): m.cyl(.05, .05, 2.6, '#dddddd', (x, 1.3, z), seg=10)
    m.box(3.4, .12, 3, blue, (0, 2.62, 0), r=.05)
    for k in range(8): m.add(g_lathe([(1.8, 0), (0, .75)], 1, arc=TAU / 8, a0=k * TAU / 8), white if k % 2 else '#5fa8e8', mat_of((0, 2.66, 0)))   # the striped peak
    m.sph(.1, '#ffd23f', (0, 3.45, 0), u=10, v=6)
    for s in (-1, 1):
        for k in range(8):
            m.sph(.21, blue if k % 2 else white, (-1.5 + k * .43, 2.48, s * 1.5), (1, .6, .3), u=10, v=6)
            m.sph(.19, blue if k % 2 else white, (s * 1.7, 2.48, -1.3 + k * .37), (.3, .6, 1), u=10, v=6)
    for k in range(9):   # little flags on a string along the front
        x = -1.6 + k * .4; m.add(g_cyl(0, .09, .02, 3), ('#ffd23f', '#2f8a3a', '#ffffff')[k % 3], mat_of((x, 2.3, 1.42), (H, 0, math.pi)))
    m.rod((-1.6, 2.36, 1.42), (1.6, 2.36, 1.42), .008, '#2a2a2a', 4)

MODELS = {
    'pp-starlantern': m_starlantern, 'pp-stoneturtle': m_stoneturtle, 'pp-lionhead': m_lionhead, 'pp-mooncakes': m_mooncakes,
    'pp-thehuc': m_thehuc, 'pp-ferry': m_ferry, 'pp-gumtree': m_gumtree, 'pp-koala': m_koala, 'pp-harbourbridge': m_harbourbridge,
    'pp-pole-traicay': m_pole_traicay, 'pp-pole-tauhu': m_pole_tauhu, 'pp-pole-bunoc': m_pole_bunoc, 'pp-pole-bunrieu': m_pole_bunrieu,
    'pp-pole-banhda': m_pole_banhda, 'pp-pole-cothu': m_pole_cothu,
    'pp-stall-bahai': m_stall_bahai, 'pp-stall-olai': m_stall_olai, 'pp-stall-chunam': m_stall_chunam, 'pp-stall-chutam': m_stall_chutam,
    'pp-stall-cout': m_stall_cout, 'pp-sizzle': m_sizzle,
}

# ---------- making and saving ----------
def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def material():
    mt = bpy.data.materials.new('toon'); mt.use_nodes = True
    nt = mt.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; nt.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = .9
    return mt

def bake_ao(me, dist):
    """soft shading baked into the corner colours: creases and the joins between parts a little darker, as in a picture
    book; no texture, no extra triangles (Cycles on the processor)"""
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24
    if not sc.world: sc.world = bpy.data.worlds.new('w')
    sc.world.light_settings.distance = dist
    ao = me.color_attributes.new('AO', 'FLOAT_COLOR', 'CORNER'); me.color_attributes.active_color = ao
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    n = len(me.loops); a = [0.] * (n * 4); c = [0.] * (n * 4)
    me.color_attributes['AO'].data.foreach_get('color', a); me.color_attributes['Col'].data.foreach_get('color', c)
    for i in range(n):
        f = .7 + .3 * min(1., a[i * 4] * 1.5)
        c[i * 4] *= f; c[i * 4 + 1] *= f; c[i * 4 + 2] *= f
    me.color_attributes['Col'].data.foreach_set('color', c)
    me.color_attributes.remove(me.color_attributes['AO']); me.color_attributes.active_color = me.color_attributes['Col']

def build(name, fn):
    clear(); m = Model(seed=len(name)); fn(m)
    bmesh.ops.remove_doubles(m.bm, verts=m.bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name); m.bm.to_mesh(me); m.bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    me.color_attributes.active_color = me.color_attributes['Col']
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(38))
    me.materials.append(material())
    dims = ob.dimensions; size = max(dims)
    bake_ao(me, min(1.0, max(.12, size * .07)))
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    path = os.path.join(OUT, name + '.raw.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_texcoords=False, export_normals=True, export_vertex_color='ACTIVE', export_materials='EXPORT', export_animations=False)
    print('MODEL', name, 'tris', tris, flush=True)

for name, fn in MODELS.items():
    if ONLY and name not in ONLY: continue
    build(name, fn)

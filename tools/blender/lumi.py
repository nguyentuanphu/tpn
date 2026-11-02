# Lumi, the star gardener (owner's concept sheet, 2 Nov 2026 AEDT), built by script in Blender. Our own model; nothing downloaded.
# Two builds from one script (v1.08, part A):
#   chibi  the concept's chibi Lumi (about 2 heads tall), refined;
#   tall   Lumi in Finn and Flora's proportions (about 5 heads tall, the same head and eye size as finn.py).
# The owner chose the chibi (3 Nov 2026 AEDT) and asked to try Finn and Flora in the same proportions: add `finn` or `flora`.
# Run: blender -b -P tools/blender/lumi.py -- <out dir> [lumi|finn|flora] [chibi|tall] [render] [faces] [quick]
#   render: front, side, back, three-quarter;  faces: happy, curious, surprised;  quick: few samples, small pictures.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler
from mathutils.bvhtree import BVHTree
from svkit import reset, mat, felt, softpaint, glass, pstar, hexc, sphere, tube, lathe, subsurf, obj_from

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
FLAGS = ('chibi', 'tall', 'render', 'faces', 'quick', 'lumi', 'finn', 'flora')
OUT = next((a for a in argv if a not in FLAGS), '/tmp/lumi')
TALL = 'tall' in argv; RENDER = 'render' in argv; FACES = 'faces' in argv; QUICK = 'quick' in argv
STYLE = 'tall' if TALL else 'chibi'
WHO = 'finn' if 'finn' in argv else 'flora' if 'flora' in argv else 'lumi'
os.makedirs(OUT, exist_ok=True); random.seed(7)
scene = reset()
lin = lambda a, b, n: [a + (b - a) * i / (n - 1) for i in range(n)]

# ---------- the concept's palette: sage, cream, peach, honey; felt everywhere but the skin, eyes and metal ----------
# each friend's own colours: skin, hair (main, dark, light), iris (dark, light), brows and lashes (from the owner's concepts)
PAL = {'lumi': ('#f7d2b8', '#a9c58f', '#8fae79', '#bcd5a1', '#1f4d43', '#3f8a6f', '#7f9f62', '#45302a'),
       'finn': ('#f3c6a5', '#2a355f', '#1f284b', '#3b4a80', '#3a2414', '#7a4f2e', '#2b3560', '#2a1e18'),
       'flora': ('#f8d4bc', '#f2a493', '#e38f7f', '#f8bdac', '#5a3416', '#b8783c', '#c98472', '#5a3328')}[WHO]
SKIN = mat('skin', PAL[0], .55, .1, sss=.12)
NOSE = mat('nose', '#f3c2a8', .55, .1, sss=.12)
HAIR = felt('hair', PAL[1]); HAIRD = felt('hairDark', PAL[2]); HAIRL = felt('hairLight', PAL[3])
SHIRT = felt('shirt', '#f4ead6', fibre=.08)
OVER = felt('overalls', '#8b9f6b'); OVERL = felt('overallsLight', '#9db27c'); POCKET = felt('pocket', '#a9c286')
SOCK = felt('socks', '#f3e6cb', fibre=.12)
BOOT = felt('boots', '#a9553a', .7, .1); BOOTL = felt('bootCuff', '#bb6c47', .7, .1)
SOLE = mat('sole', '#6e3a22', .7)
BAG = felt('bag', '#8d5a33', .6, .08); BAGD = felt('bagDark', '#74472a', .6, .08)
STAR = felt('star', '#f2c94f', .6, .08)
GLOW = mat('glow', '#ffe58a', .3, emit=5)
LEAFG = felt('leafGreen', '#7fae5e')
BRASS = mat('brass', '#b98a46', .35, metal=.85); BRASSD = mat('brassDark', '#8a6232', .4, metal=.8)
GLASS = glass('glass')
EYEW = mat('eyeWhite', '#fdfbf6', .3)
IRISD = mat('irisDark', PAL[4], .25); IRIS = mat('iris', PAL[5], .25)
PUPIL = mat('pupil', '#0f201b', .2)
SHINE = mat('shine', '#ffffff', .2, emit=4)
LASH = mat('lash', PAL[7], .6)
BROW = mat('brow', PAL[6], .9, .3)
MOUTH = mat('mouth', '#6f2b2b', .5); TONGUE = mat('tongue', '#ee9188', .5)
BLUSH = softpaint('blush', '#f4a08f', .75)
# Finn's and Flora's clothes
PANTS = felt('pants', '#e8dcc0'); COAT = felt('coat', '#2f6f74'); COATIN = felt('coatLining', '#e7d9b8')
BOOTF = felt('bootsBrown', '#7a4a2a', .6, .08)
DRESS = felt('dress', '#b39ad1'); DRESSL = felt('dressLight', '#c9b5e0'); TIGHTS = felt('tights', '#9aa97f')
PETAL = felt('petal', '#fbeee6'); WOOD = felt('wood', '#7a5434', .7, .05)
FLOWERG = mat('flowerGlow', '#f59ab8', .4, emit=.35); GLOWB = mat('glowBlue', '#bfe6ff', .3, emit=6)

# ---------- proportions ----------
if TALL:  # Finn and Flora: head about a fifth of the height, a narrower jaw, smaller eyes
    HC, R = Vector((0, 0, 1.12)), .128
    P = dict(eye=.2, eyeX=.33, eyeZ=-.1, jaw=.2, cheek=.03, puff=1.08)
    B = dict(legX=.06, rLeg=.037, zAnk=.05, zBoot=.14, zSock=.235, zCuff=.44, zCr=.57, zW=.69, zC=.84, zS=.915, zN=.99,
             wH=.13, wC=.124, dep=.82, sh=(.135, 0, .9), el=(.19, -.005, .72), wr=(.21, -.02, .56), rU=.036, rA=.03, boot=(.064, .095), lant=.19, S=.8, puff=1.22)
else:     # the concept: a big round head, low big eyes, full cheeks
    HC, R = Vector((0, 0, .72)), .25
    P = dict(eye=.21, eyeX=.34, eyeZ=-.13, jaw=.0, cheek=.08, puff=1.0)  # eyes smaller for a balanced face (owner, 3 Nov)
    B = dict(legX=.066, rLeg=.04, zAnk=.05, zBoot=.1, zSock=.165, zCuff=.225, zCr=.27, zW=.36, zC=.45, zS=.475, zN=.5,
             wH=.14, wC=.13, dep=.85, sh=(.12, 0, .455), el=(.162, -.005, .37), wr=(.188, -.015, .29), rU=.037, rA=.032, boot=(.066, .095), lant=.22, S=1.0, puff=1.6)
H = lambda x, y, z: HC + Vector((x, y, z)) * R
S = B['S']

def group(name, build):
    """build some parts and keep them in their own collection (one per face, so a render can switch faces)"""
    before = set(bpy.data.objects); build()
    col = bpy.data.collections.new(name); scene.collection.children.link(col)
    for o in set(bpy.data.objects) - before:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    return col

# ---------- head: a smaller forehead (eyes a little higher, the fringe low), fuller cheeks, a soft round chin ----------
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=48, radius=1)
for v in bm.verts:
    x, y, z = v.co.x * 1.03, v.co.y * .96, v.co.z * .94
    if z < .1:
        k = min(1, (.1 - z) / 1.04)
        x *= 1 + P['cheek'] * math.sin(math.pi * min(1, k * 1.5)) - P['jaw'] * k ** 1.5
        if y < 0: y *= 1 + P['cheek'] * .7 * math.sin(math.pi * min(1, k * 1.4)) - .06 * k ** 2
    v.co = H(x, y, z)
bm.verts.index_update()
bvh = BVHTree.FromPolygons([v.co.copy() for v in bm.verts], [[v.index for v in f.verts] for f in bm.faces])
obj_from(bm, 'head', SKIN)
for s in (-1, 1): sphere('ear', SKIN, H(s * 1.0, .05, -.12), (.12 * R, .08 * R, .17 * R), 20, 10)

def onf(x, z, out=0.0):
    """the point on the face in front of (x, z) in head units, pushed out along the skin"""
    loc, n, _, _ = bvh.ray_cast(H(x, -3, z), Vector((0, 1, 0)))
    if loc is None: loc, n = H(x, -.95, z), Vector((0, -1, 0))
    return loc + n * out * R, n

def decal(name, m, x, z, sx, sy, d, out=0.0, roll=0.0, shape=None, seg=32):
    """a flat oval lying on the face, bent to follow its curve"""
    p, n = onf(x, z, out)
    X = Vector((0, 0, 1)).cross(n).normalized(); Y = n.cross(X)
    rot = Matrix((X, Y, n)).transposed() @ Matrix.Rotation(roll, 3, 'Z')
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1)
    for v in bm.verts:
        if shape: shape(v.co)
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * d - ((v.co.x * sx) ** 2 + (v.co.y * sy) ** 2) / 2.1))
    bmesh.ops.transform(bm, matrix=Matrix.Translation(p) @ rot.to_4x4() @ Matrix.Diagonal((R, R, R, 1)), verts=bm.verts)
    return obj_from(bm, name, m)

def fline(name, m, pts, radii, out):
    return tube(name, m, [onf(x, z, out)[0] for x, z in pts], [r * R for r in radii], 10)

# ---------- faces ----------
def face(expr):
    E, ez = P['eye'], P['eyeZ']
    for s in (-1, 1):
        ex = s * P['eyeX']
        if expr == 'happy':  # closed, smiling eyes
            arc = [(ex + math.cos(a) * E * .9, ez - .05 + math.sin(a) * E * .62) for a in lin(.08 * math.pi, .92 * math.pi, 13)]
            fline('happyEye', LASH, arc, [.012] + [.026] * 11 + [.012], .02)
        else:
            sx, sy = (1.03, 1.08) if expr == 'surprised' else (1, 1)
            w, h = E * sx, E * 1.12 * sy
            lx, lz = (-.4, .35) if expr == 'curious' else (0, 0)
            ir = .88 if expr == 'surprised' else 1.0
            decal('eyeWhite', EYEW, ex, ez, w, h, .05)
            ix, iz = ex + lx * w * .25, ez + lz * h * .22 - .04 * h
            decal('iris', IRISD, ix, iz, w * ir * .9, h * ir * .9, .02, .03)
            decal('irisLight', IRIS, ix, iz - h * ir * .25, w * ir * .62, h * ir * .45, .01, .045)
            decal('pupil', PUPIL, ix, iz + .03 * h, w * ir * .4, h * ir * .44, .008, .052)
            decal('shine', SHINE, ix + w * .3, iz + h * .36, w * .19, w * .19, .006, .06)
            decal('shine2', SHINE, ix - w * .32, iz - h * .32, w * .085, w * .085, .005, .058)
            # a soft brown upper lid, a little heavier at the outer corner, and two small lashes
            lid = [(ex + math.cos(a) * w * 1.03, ez + math.sin(a) * h * 1.02) for a in lin(.06 * math.pi, .94 * math.pi, 15)]
            fline('lid', LASH, lid, [.016 + .014 * max(0, math.cos(a) * s) for a in lin(.06 * math.pi, .94 * math.pi, 15)], .05)
            for k in range(2):
                a0 = (.16 + .14 * k) * math.pi if s > 0 else (.84 - .14 * k) * math.pi
                p0 = (ex + math.cos(a0) * w, ez + math.sin(a0) * h); p1 = (p0[0] + s * .07, p0[1] + .07 + .02 * k)
                fline('lash', LASH, [p0, p1], [.011, .004], .05)
        # soft short brows, raised for surprise, one up for curiosity
        up = {'surprised': .12, 'happy': .05, 'curious': .1 if s < 0 else .02}.get(expr, .03)
        bz = ez + E * 1.12 + .07 + up
        fline('brow', BROW, [(ex - s * .1, bz - .015), (ex - s * .02, bz + .02), (ex + s * .09, bz + .005)], [.016, .024, .013], .02)
        decal('blush', BLUSH, s * .57, -.33, .17, .1, .012, .004)
    decal('nose', NOSE, 0, -.3, .035, .025, .025)
    flat_top = lambda c: setattr(c, 'y', c.y * .15) if c.y > 0 else None
    if expr in ('smile', 'happy'):
        mw, mh = (.17, .15) if expr == 'smile' else (.2, .17)
        decal('mouth', MOUTH, 0, -.47, mw, mh, .07, .0, shape=flat_top)
        decal('tongue', TONGUE, 0, -.47 - mh * .6, mw * .55, mh * .32, .02, .06)
    elif expr == 'curious':
        fline('mouth', MOUTH, [(-.05, -.49), (-.005, -.505), (.04, -.495)], [.012, .016, .011], .01)
    else:  # surprised: a small round "oh"
        decal('mouth', MOUTH, 0, -.5, .07, .095, .07)
        decal('tongue', TONGUE, 0, -.55, .04, .03, .03, .035)

FACE_SETS = {e: group('face-' + e, lambda e=e: face(e)) for e in ('smile', 'happy', 'curious', 'surprised')}

# ---------- leaf hair: puffy felt leaves in overlapping rows, a fringe over the forehead ----------
def leaf(name, m, L, W, curl=.25, flick=.3, hug=1.0, th=.04, bulge=.25, N=10):
    """a rounded felt leaf along +Y, its face +Z; hug bends it round a head of that radius, flick turns the tip out"""
    bm = bmesh.new(); rows = []
    for i in range(N + 1):
        t = i / N; w = W * math.sin(math.pi * min(1, .04 + t * .96)) ** .55 * (1 - .1 * t)
        y = t * L; z = -(y * y) / (2 * hug) + flick * L * t ** 3
        rows.append([bm.verts.new((u * w, y, z + bulge * w * (1 - u * u) - curl * w * u * u)) for u in (-1, -.5, 0, .5, 1)])
    for i in range(N):
        for j in range(4): bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=th)
    o = obj_from(bm, name, m); subsurf(o, 2); return o

def place(o, base, direction, normal, spin=0.0):
    yv = direction.normalized(); zv = (normal - normal.project(yv)).normalized(); xv = yv.cross(zv)
    o.matrix_world = Matrix.Translation(base) @ Matrix((xv, yv, zv)).transposed().to_4x4() @ Matrix.Rotation(spin, 4, 'Y')

def hair_leaf(az, el, L, W, flick=.25, puff=1.0, m=HAIR, hug=1.1, out=.05):
    n = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    base = HC + Vector((n.x * 1.05, n.y * 1.02, n.z)) * R * puff * P['puff']
    down = Vector((0, 0, -1)); t = (down - down.project(n)).normalized() if abs(n.z) < .98 else Vector((math.sin(az), -math.cos(az), 0))
    o = leaf('hairLeaf', m, L * R, W * R, .3, flick, hug * R * puff, .05 * R, .3)
    place(o, base, (t + n * out).normalized(), n, random.uniform(-.25, .25)); return o

def hair():
    # a sage cap under the leaves so no scalp shows between them, open at the face
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=1)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -.35 and v.co.z < .45 and abs(v.co.x) < .8) or v.co.z < -.72 or (v.co.y < .1 and v.co.z < -.3)], context='VERTS')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(H(0, .02, .03)) @ Matrix.Diagonal((1.07 * R, 1.05 * R, 1.0 * R, 1)), verts=bm.verts)
    subsurf(obj_from(bm, 'hairCap', HAIRD), 1)
    # rows from the crown down; the lower rows puff out into a round bob and flick at the tips
    rows = [(1.45, 5, .55, .36, .15, 1.08), (1.15, 10, .66, .36, .2, 1.11), (.82, 14, .7, .36, .28, 1.15), (.5, 16, .7, .35, .38, 1.19),
            (.18, 17, .66, .34, .48, 1.23), (-.15, 16, .6, .32, .6, 1.25), (-.45, 12, .5, .3, .7, 1.18)]
    for ring, (el, cnt, ln, wd, fl, pf) in enumerate(rows):
        for k in range(cnt):
            az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.08, .08)
            ax = abs(math.sin(az)) * math.cos(el)
            if math.cos(az) > 0 and el < 1.0 and ax < .8: continue   # keep the face open
            if math.cos(az) > .35 and el < -.2: continue               # and the cheeks
            hair_leaf(az, el + random.uniform(-.05, .05), ln * random.uniform(.9, 1.1), wd * random.uniform(.9, 1.1), fl, pf,
                      (HAIR, HAIRD, HAIRL)[(k + ring) % 3], 1.05 * pf, .16 + .1 * (el < .3))
    # the fringe: leaves from the crown over the forehead, the tips just above the brows
    for k, az in enumerate([-.8, -.57, -.34, -.11, .12, .35, .58, .82]):
        hair_leaf(az, .98 - .06 * abs(az), (.78, .66)[k % 2] - .08 * abs(az), .3, .1, 1.03, (HAIRL, HAIR)[k % 2], 1.08, .02)
    for k, az in enumerate([-.66, -.2, .24, .68]):  # a second layer to make it full
        hair_leaf(az, 1.12, .62, .3, .1, 1.07, HAIRD if k % 2 else HAIR, 1.1, .02)
    # side locks framing the cheeks
    for s in (-1, 1):
        hair_leaf(s * .95, .45, .7, .3, .55, 1.06, HAIR, 1.1, .05); hair_leaf(s * 1.2, .2, .68, .29, .65, 1.12, HAIRL, 1.15, .08)
    # the sprout on top: a curling stem with one big leaf and one small
    stem = [H(0, .05, .96), H(.02, .06, 1.1), H(.06, .04, 1.22)]
    tube('sproutStem', LEAFG, stem, [.03 * R, .025 * R, .02 * R], 10)
    o = leaf('sprout', LEAFG, .42 * R, .2 * R, .25, -.35, 10, .035 * R, .25); place(o, stem[-1], Vector((.55, .1, .85)), Vector((-.3, -.9, .3)))
    o = leaf('sprout', LEAFG, .24 * R, .12 * R, .25, -.3, 10, .03 * R, .25); place(o, stem[1], Vector((-.8, 0, .5)), Vector((.2, -.9, .3)))
    # the felt star clip with two little leaves, high on Lumi's left
    c = H(.62, -.6, .72); n = (c - HC).normalized()
    pstar('hairStar', STAR, c + n * .12 * R, .28 * R, .1 * R, n.to_track_quat('Z', 'Y').to_euler())
    for a in (-.6, .7):
        o = leaf('starLeaf', LEAFG, .2 * R, .1 * R, .2, .2, 10, .03 * R, .2)
        place(o, c + n * .05 * R, Vector((math.cos(a), 0, math.sin(a) - .3)), n)
# ---------- Finn and Flora's hair (the owner asked to try them as chibis too, 3 Nov 2026 AEDT) ----------
def cap(m):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=32, radius=1)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -.35 and v.co.z < .45 and abs(v.co.x) < .8) or v.co.z < -.72 or (v.co.y < .1 and v.co.z < -.3)], context='VERTS')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(H(0, .02, .03)) @ Matrix.Diagonal((1.07 * R, 1.05 * R, 1.0 * R, 1)), verts=bm.verts)
    subsurf(obj_from(bm, 'hairCap', m), 1)

def hdir(az, el):
    n = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    down = Vector((0, 0, -1)); t = (down - down.project(n)).normalized() if abs(n.z) < .97 else Vector((math.sin(az), -math.cos(az), 0))
    return n, t

def clump(az, el, L, W, out=.35, curl=.5, m=None, puff=1.04):
    """a tapered clump of hair from the scalp, falling and flicking outwards (head units)"""
    n, t = hdir(az, el); base = HC + Vector((n.x * 1.04, n.y, n.z * .98)) * R * puff
    side = n.cross(t).normalized() * random.uniform(-.4, .4)
    pts, radii, p, d = [], [], base.copy(), (t + n * out + side).normalized()
    for i in range(7):
        f = i / 6; pts.append(p.copy()); radii.append(((W * (1 - f) ** 1.2 * (1 - .35 * f) + W * .25 * (1 - f ** 4)) * R, (W * .7 * (1 - f) ** 1.2 + W * .18 * (1 - f ** 4)) * R))
        p = p + d * L * R / 6; d = (d + n * curl * f * .5 + side * .15).normalized()
    return tube('hairClump', m or HAIR, pts, radii, 10)

def lock(az, el, L, W, out=.25, wave=.12, m=None, puff=1.05):
    """a long, soft wavy lock falling to the shoulders"""
    n, t = hdir(az, el); base = HC + Vector((n.x * 1.04, n.y, n.z * .98)) * R * puff
    side = n.cross(t).normalized(); down = Vector((0, 0, -1))
    pts, radii, p, d, N = [], [], base.copy(), (t + n * out).normalized(), 12
    for i in range(N + 1):
        f = i / N
        pts.append(p + side * math.sin(f * math.pi * 2.4 + az * 3) * wave * R * f)
        radii.append(((W * (1 - .6 * f ** 1.5) + .03) * R, (W * .8 * (1 - .6 * f ** 1.5) + .03) * R))
        p = p + d * L * R / N; d = (d + down * (.35 + .5 * f)).normalized()
    return tube('hairLock', m or HAIR, pts, radii, 12)

def front_open(az, el):
    fr, ax = math.cos(az), abs(math.sin(az)) * math.cos(el)
    return (fr > 0 and el < 1.0 and ax < .8) or (fr > .35 and el < -.2)

def hair_finn():
    cap(HAIRD)
    for ring, (el, cnt, ln, wd) in enumerate([(1.35, 8, .6, .34), (1.0, 13, .72, .34), (.65, 16, .76, .33), (.3, 16, .7, .31), (-.05, 14, .58, .28), (-.4, 10, .46, .25)]):
        for k in range(cnt):
            az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.1, .1)
            if front_open(az, el): continue
            clump(az, el + random.uniform(-.06, .06), ln * random.uniform(.85, 1.15), wd, .2 + .2 * (el < .5), .5, HAIR if random.random() < .7 else HAIRL, 1.04 + .06 * (el < .5))
    for k, az in enumerate([-.8, -.55, -.3, -.05, .2, .45, .72]):  # a messy fringe swept to Finn's left
        clump(az, 1.02, .78 - .1 * (k % 2), .32, .08, .25, HAIRL if k % 2 else HAIR)
    for k in range(4): clump(random.uniform(-2, 2), 1.45, .4, .2, .8, 1.2, HAIRL)  # a few strands sticking up

def hair_flora():
    cap(HAIRD)
    for ring, (el, cnt) in enumerate([(1.35, 7), (1.0, 12)]):  # soft waves on top
        for k in range(cnt):
            az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.1, .1)
            if front_open(az, el): continue
            clump(az, el, .8, .3, .2, .35, (HAIR, HAIRL)[k % 2], 1.05)
    for ring, (el, cnt, ln) in enumerate([(.7, 12, 1.55), (.35, 13, 1.6), (0, 12, 1.4), (-.35, 9, 1.1)]):  # long wavy locks to the shoulders
        for k in range(cnt):
            az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.08, .08)
            if front_open(az, el) or math.cos(az) > .15: continue   # the locks fall behind the shoulders; the braids are in front
            lock(az, el, ln * random.uniform(.9, 1.08), .34, .12 + .04 * ring, .24, (HAIR, HAIRD, HAIRL)[(k + ring) % 3], 1.06 + .04 * ring)
    for k, az in enumerate([-.75, -.5, -.25, 0, .25, .5, .78]):  # side-swept bangs
        clump(az + .12, 1.02, .78 - .1 * (k % 2), .28, .1, .25, HAIRL if k % 2 else HAIR, 1.05)
    # two braids over the shoulders with lilac ties
    for s in (-1, 1):
        path = [H(s * .9, -.15, -.25), H(s * .98, -.32, -.8), H(s * .95, -.42, -1.35), H(s * .9, -.45, -1.75)]
        segs = 9
        for i in range(segs):
            f = i / (segs - 1); seg = int(f * 2.999); u = f * 3 - seg
            p = path[seg].lerp(path[seg + 1], u) + Vector((s * (.06 if i % 2 else -.06) * R, 0, 0))
            sphere('braid', (HAIR, HAIRL)[i % 2], p, (.19 * R * (1 - .3 * f), .16 * R * (1 - .3 * f), .2 * R), 16, 8, (0, s * (.4 if i % 2 else -.4), 0))
        sphere('braidTie', DRESSL, path[-1] + Vector((0, 0, -.05 * R)), (.12 * R, .12 * R, .07 * R), 16, 8)
        tube('braidTuft', HAIR, [path[-1] + Vector((0, 0, -.08 * R)), path[-1] + Vector((s * .05 * R, -.02 * R, -.35 * R))], [(.13 * R, .1 * R), (.02 * R, .02 * R)], 10)
    # a cream flower clip with two leaves, high on Flora's right
    c = H(-.62, -.58, .7); n = (c - HC).normalized(); q = n.to_track_quat('Z', 'Y').to_matrix()
    for i in range(5):
        a = i * 2 * math.pi / 5; p = c + q @ Vector((math.cos(a) * .13 * R, math.sin(a) * .13 * R, .06 * R))
        sphere('petal', PETAL, p, (.13 * R, .08 * R, .04 * R), 16, 8, (q @ Matrix.Rotation(a, 3, 'Z')).to_euler())
    sphere('flowerHeart', STAR, c + n * .1 * R, (.06 * R, .06 * R, .04 * R), 12, 6)
    for a in (2.4, 3.6):
        o = leaf('flowerLeaf', LEAFG, .22 * R, .1 * R, .2, .2, 10, .03 * R, .2); place(o, c + n * .03 * R, q @ Vector((math.cos(a), math.sin(a), 0)), n)

group('hair', {'lumi': hair, 'finn': lambda: hair_finn(), 'flora': lambda: hair_flora()}[WHO])

# ---------- body ----------
def fronty(r): return -r * B['dep'] - .006 * S

def body():
    b = B; x0, r = b['legX'], b['rLeg']; wH, wC, dep = b['wH'], b['wC'], b['dep']
    for s in (-1, 1):
        X = s * x0
        tube('leg', SKIN, [(X, 0, b['zCr']), (X, 0, b['zAnk'])], r, 18)
        # cream socks with a folded, ribbed top
        lathe('sock', SOCK, [(r * 1.08, b['zBoot'] - .03), (r * 1.1, b['zSock'] - .022 * S), (r * 1.24, b['zSock'] - .014 * S), (r * 1.3, b['zSock']),
                             (r * 1.22, b['zSock'] + .012 * S), (r * 1.0, b['zSock'] + .015 * S)], 28, loc=(X, 0, 0))
        for z in lin(b['zSock'] - .012 * S, b['zSock'] + .008 * S, 3):
            lathe('sockRib', SOCK, [(r * 1.27, z - .002 * S), (r * 1.33, z), (r * 1.27, z + .002 * S)], 28, loc=(X, 0, 0))
        # chunky rust boots with a lighter folded cuff, a sole and a leaf on the outside
        bw, bl = b['boot']; zb = b['zBoot']
        lathe('boot', BOOT, [(0, 0), (bw * .98, 0), (bw * 1.04, zb * .25), (bw, zb * .7), (bw * .92, zb), (bw * .8, zb + .004)], 28, loc=(X, -.005, 0), scale=(1, 1.1))
        toe = sphere('bootToe', BOOT, (X, -bl * .45, zb * .42), (bw * .98, bl * .62, zb * .45), 28, 14)
        for v in toe.data.vertices: v.co.z = max(v.co.z, .012 * S)
        subsurf(toe, 1)
        front, back = -bl * 1.07 - .006, bw * 1.12
        lathe('sole', SOLE, [(0, 0), (bw * 1.1, 0), (bw * 1.12, .015 * S), (bw * .9, .018 * S)], 28, loc=(X, (front + back) / 2, 0), scale=(1, (back - front) / 2 / (bw * 1.12)))
        lathe('bootCuff', BOOTL, [(bw * .9, zb - .01 * S), (bw * 1.02, zb - .004 * S), (bw * 1.04, zb + .01 * S), (bw * .96, zb + .018 * S), (bw * .8, zb + .02 * S)], 28, loc=(X, -.005, 0), scale=(1, 1.1))
        o = leaf('bootLeaf', LEAFG, .045 * S, .022 * S, .1, .1, 1, .006 * S, .2)
        place(o, Vector((X + s * bw * 1.03, -.01, zb * .45)), Vector((0, -.6, .8)), Vector((s, 0, 0)))
        # shorts legs with a rolled cuff
        rs = wH * .56
        tube('shortsLeg', OVER, [(s * x0 * .85, 0, b['zCr'] + .02 * S), (s * x0 * 1.08, 0, b['zCuff'] + .01 * S)], [rs, rs * 1.04], 24)
        zc = b['zCuff']
        lathe('shortsCuff', OVERL, [(rs * .98, zc - .012 * S), (rs * 1.12, zc - .008 * S), (rs * 1.16, zc + .008 * S), (rs * 1.12, zc + .022 * S), (rs * 1.0, zc + .026 * S)], 28, loc=(s * x0 * 1.08, 0, 0))
    lathe('seat', OVER, [(wH * .55, b['zCr'] - .035 * S), (wH * .92, b['zCr'] - .01 * S), (wH, b['zCr'] + .03 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.05, b['zW'] + .01 * S)], 32, scale=(1, dep))
    # the cream shirt
    lathe('shirt', SHIRT, [(wH * .95, b['zW'] - .04 * S), (wC, b['zW']), (wC * 1.03, (b['zW'] + b['zC']) / 2), (wC, b['zC']), (wC * .82, b['zS'] + .008 * S), (wC * .42, b['zN']), (wC * .32, b['zN'] + .01 * S)], 32, scale=(1, dep))
    for s in (-1, 1):
        sphere('collar', SHIRT, (s * .3 * wC, fronty(wC * .5), b['zN'] - .1 * wC), (.3 * wC, .09 * wC, .18 * wC), 16, 8, (0, s * .3, s * .5))
    tube('neck', SKIN, [(0, 0, b['zS']), (0, 0, b['zN'] + .03 * S)], .04 * S, 16)
    # the overalls: bib and back panel, straps crossing at the back, brass buttons, a felt star and leaf pockets
    rb = wC * 1.06 + .004
    lathe('bib', OVER, [(rb, b['zW'] - .005), (rb * 1.02, (b['zW'] + b['zC']) / 2), (rb * .99, b['zC'] - .008 * S)], 24, scale=(1, dep), arc=(-.62, .62))
    lathe('backPanel', OVER, [(rb, b['zW'] - .005), (rb * 1.01, b['zW'] + .05 * S)], 24, scale=(1, dep), arc=(math.pi - .55, math.pi + .55))
    st = .011 * S
    for s in (-1, 1):
        fx, fy = s * math.sin(.5) * rb, -math.cos(.5) * rb * dep - .006
        tube('strap', OVER, [(fx, fy, b['zC'] - .012 * S), (s * .07 * S, -.045 * S, b['zS'] + .01 * S), (s * .068 * S, .04 * S, b['zS'] + .006 * S),
                             (-s * .03 * S, rb * dep + .008, b['zC'] - .03 * S), (-s * .07 * S, rb * dep + .006, b['zW'] + .045 * S)], st, 10)
        sphere('button', BRASS, (fx, fy - .006 * S, b['zC'] - .016 * S), (.012 * S, .006 * S, .012 * S), 16, 8)
    pstar('bibStar', STAR, (.035 * S, fronty(rb * 1.02) - .004, (b['zW'] + b['zC']) / 2 + .012 * S), .026 * S, .012 * S, (math.pi / 2, 0, 0))
    def pocket(a, z, L, W, tilt=0.0):
        p = Vector((math.sin(a) * wH * 1.03, -math.cos(a) * wH * 1.03 * dep - .004, z)); n = Vector((math.sin(a), -math.cos(a) * .8, 0)).normalized()
        o = leaf('pocketLeaf', POCKET, L, W, .15, .05, 1, .008 * S, .35)
        place(o, p + Vector((0, 0, L * .5)), Vector((tilt, 0, -1)), n)
    for s in (-1, 1): pocket(s * .85, (b['zCr'] + b['zW']) / 2 - .005, .085 * S, .048 * S, s * .25)
    pocket(-.3, (b['zW'] + b['zC']) / 2 + .03 * S, .06 * S, .034 * S, -.2)
    # arms: puffed sleeves rolled up, short soft arms, mitten hands; Lumi's left hand holds the lantern
    for s in (-1, 1):
        sh, el, wr = [Vector((s * p[0], p[1], p[2])) for p in (b['sh'], b['el'], b['wr'])]
        if s > 0: wr = wr + Vector((.012 * S, -.03 * S, .0))
        rU, rA = b['rU'], b['rA']
        tube('arm', SKIN, [sh, el, wr], [rU * .95, rA * 1.05, rA], 16)
        d = (el - sh).normalized()
        tube('sleeve', SHIRT, [sh - d * .015 * S, sh.lerp(el, .35), sh.lerp(el, .6)], [rU * b['puff'] * .9, rU * b['puff'], rU * b['puff'] * .92], 20)
        p = sh.lerp(el, .62)
        tube('sleeveRoll', SHIRT, [p - d * .014 * S, p, p + d * .016 * S], [rU * b['puff'] * .9, rU * b['puff'] * 1.07, rU * b['puff'] * .9], 20)
        hand = wr + (wr - el).normalized() * rA * 1.1
        sphere('hand', SKIN, hand, (rA * 1.15, rA * .95, rA * 1.3), 20, 10)
        sphere('thumb', SKIN, hand + Vector((-s * rA * .55, -rA * .75, rA * .25)), (rA * .42, rA * .42, rA * .5), 12, 6)
        if s > 0: lantern(hand + Vector((0, 0, rA * .2)), b['lant'])
    # the satchel on Lumi's right hip, its strap from the left shoulder across the chest
    a = -1.0; zb = (b['zCr'] + b['zW']) / 2 - .01 * S
    M = Matrix.Translation((math.sin(a) * (wH + .03 * S), -math.cos(a) * (wH + .03 * S) * dep, zb)) @ Matrix.Rotation(a, 4, 'Z')
    L = lambda x, y, z: M @ Vector((x * S, y * S, z * S))
    o = sphere('bag', BAG, (0, 0, 0), (.075 * S, .03 * S, .058 * S), 28, 14)
    for v in o.data.vertices:  # a rounder box
        v.co = Vector((math.copysign(abs(v.co.x / (.075 * S)) ** .7, v.co.x) * .075 * S, v.co.y, math.copysign(abs(v.co.z / (.058 * S)) ** .7, v.co.z) * .058 * S))
    o.matrix_world = M; subsurf(o, 1)
    sphere('bagFlap', BAGD, L(0, -.02, .02), (.076 * S, .012 * S, .04 * S), 24, 12, (0, 0, a))
    pstar('bagStar', STAR, L(0, -.034, .022), .022 * S, .01 * S, (math.pi / 2, 0, a))
    for k, x in enumerate((-.045, .045)):
        o = leaf('bagLeaf', LEAFG, .03 * S, .015 * S, .1, .1, 1, .005 * S, .2)
        place(o, L(x, -.03, -.02), Vector((math.cos(a) * (1 if k else -1), math.sin(a) * (1 if k else -1), -.6)), M.to_3x3() @ Vector((0, -1, 0)))
    pts = [L(.07, 0, .04), Vector((-.07 * S, fronty(rb * 1.02) - .006, b['zW'] + .03 * S)), Vector((.03 * S, fronty(rb) - .012, b['zC'] - .01 * S)),
           Vector((.085 * S, -.03 * S, b['zS'] + .016 * S)), Vector((.08 * S, .05 * S, b['zS'] + .004 * S)), Vector((-.02 * S, rb * dep + .016, b['zC'] - .02 * S)),
           Vector((-wH * .9, wH * .5, zb + .05 * S)), L(-.07, 0, .04)]
    tube('bagStrap', BAG, pts, st * .9, 10, False)

def lantern(top, h):
    """the star lantern: a brass ring and cap, a glass jar, a glowing felt star over a little sprout"""
    T = Vector(top); Q = lambda x, y, z: T + Vector((x, y, z)) * h
    ring = [Q(math.sin(t) * .13, 0, -.13 + math.cos(t) * .13) for t in lin(0, 2 * math.pi, 25)]
    tube('lanternRing', BRASSD, ring, .022 * h, 10, False)
    lathe('lanternCap', BRASS, [(0, -.24 * h), (.1 * h, -.25 * h), (.26 * h, -.31 * h), (.34 * h, -.36 * h), (.34 * h, -.39 * h), (.27 * h, -.4 * h)], 32, loc=T)
    jar = lathe('lanternGlass', GLASS, [(.27 * h, -.39 * h), (.35 * h, -.48 * h), (.39 * h, -.62 * h), (.37 * h, -.76 * h), (.3 * h, -.86 * h)], 32, loc=T)
    jar.visible_shadow = False
    lathe('lanternBase', BRASS, [(.29 * h, -.85 * h), (.37 * h, -.87 * h), (.39 * h, -.92 * h), (.34 * h, -.96 * h), (0, -.965 * h)], 32, loc=T)
    for a in lin(0, 2 * math.pi * .75, 4):  # four thin brass ribs
        tube('lanternRib', BRASSD, [Q(math.sin(a) * .3, -math.cos(a) * .3, -.39), Q(math.sin(a) * .39, -math.cos(a) * .39, -.62), Q(math.sin(a) * .31, -math.cos(a) * .31, -.86)], .012 * h, 6)
    pstar('lanternStar', GLOW, Q(0, 0, -.58), .16 * h, .07 * h, (math.pi / 2, 0, 0))
    tube('lanternSprout', LEAFG, [Q(0, 0, -.86), Q(0, 0, -.74)], .015 * h, 8)
    for s in (-1, 1):
        o = leaf('lanternSproutLeaf', LEAFG, .1 * h, .05 * h, .2, .1, 10, .01 * h, .2); place(o, Q(0, 0, -.76), Vector((s, 0, .6)), Vector((0, -1, .2)))
        o = leaf('lanternLeaf', LEAFG, .2 * h, .09 * h, .2, .2, 10, .012 * h, .2); place(o, Q(s * .12, 0, -.31), Vector((s, -.2, -.25)), Vector((0, -.5, 1)))
    d = bpy.data.lights.new('lanternLight', 'POINT'); d.energy = .7 * (h / .17) ** 2; d.color = hexc('#ffd77a')[:3]; d.shadow_soft_size = .1 * h
    lo = bpy.data.objects.new('lanternLight', d); scene.collection.objects.link(lo); lo.location = Q(0, -.25, -.6)
# ---------- Finn and Flora's bodies: the same chibi body, their own clothes and props ----------
def legs(m):
    for s in (-1, 1): tube('leg', m, [(s * B['legX'], 0, B['zCr']), (s * B['legX'], 0, B['zAnk'])], B['rLeg'], 18)

def boots(m, mc, zb, straps=(), eyelets=False):
    bw, bl = B['boot']
    for s in (-1, 1):
        X = s * B['legX']
        lathe('boot', m, [(0, 0), (bw * .98, 0), (bw * 1.04, .025 * S), (bw, zb * .5), (bw * .95, zb), (bw * .85, zb + .004)], 28, loc=(X, -.005, 0), scale=(1, 1.1))
        toe = sphere('bootToe', m, (X, -bl * .45, .042 * S), (bw * .98, bl * .62, .045 * S), 28, 14)
        for v in toe.data.vertices: v.co.z = max(v.co.z, .012 * S)
        subsurf(toe, 1)
        front, back = -bl * 1.07 - .006, bw * 1.12
        lathe('sole', SOLE, [(0, 0), (bw * 1.1, 0), (bw * 1.12, .015 * S), (bw * .9, .018 * S)], 28, loc=(X, (front + back) / 2, 0), scale=(1, (back - front) / 2 / (bw * 1.12)))
        lathe('bootCuff', mc, [(bw * .9, zb - .01 * S), (bw * 1.04, zb - .004 * S), (bw * 1.07, zb + .012 * S), (bw * .98, zb + .02 * S), (bw * .8, zb + .022 * S)], 28, loc=(X, -.005, 0), scale=(1, 1.1))
        for z in straps:
            lathe('bootStrap', BAGD, [(bw * 1.01, z), (bw * 1.03, z + .006 * S), (bw * 1.01, z + .014 * S)], 28, loc=(X, -.005, 0), scale=(1, 1.12))
            sphere('bootBuckle', BRASS, (X + s * bw * .95, -.03 * S, z + .007 * S), (.008 * S, .006 * S, .01 * S), 12, 6)
        if eyelets:
            for z in lin(zb * .35, zb * .9, 4): tube('lace', SHIRT, [(X - .018 * S, -bw * 1.1, z), (X + .018 * S, -bw * 1.1, z + .012 * S)], .004 * S, 6)

def arm_pair(sleeves, hand_mat=None):
    """sleeves(s, sh, el, wr) dresses one arm; returns each hand's centre"""
    hands = {}
    for s in (-1, 1):
        sh, el, wr = [Vector((s * p[0], p[1], p[2])) for p in (B['sh'], B['el'], B['wr'])]
        if s > 0: wr = wr + Vector((.012 * S, -.03 * S, .0))
        tube('arm', SKIN, [sh, el, wr], [B['rU'] * .95, B['rA'] * 1.05, B['rA']], 16)
        sleeves(s, sh, el, wr)
        rA = B['rA']; hand = wr + (wr - el).normalized() * rA * 1.1
        sphere('hand', SKIN, hand, (rA * 1.15, rA * .95, rA * 1.3), 20, 10)
        sphere('thumb', SKIN, hand + Vector((-s * rA * .55, -rA * .75, rA * .25)), (rA * .42, rA * .42, rA * .5), 12, 6)
        hands[s] = hand
    return hands

def torso(m):
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']
    lathe('shirt', m, [(wH * .95, b['zW'] - .04 * S), (wC, b['zW']), (wC * 1.03, (b['zW'] + b['zC']) / 2), (wC, b['zC']), (wC * .82, b['zS'] + .008 * S), (wC * .42, b['zN']), (wC * .32, b['zN'] + .01 * S)], 32, scale=(1, dep))
    for s in (-1, 1):
        sphere('collar', SHIRT, (s * .3 * wC, fronty(wC * .5), b['zN'] - .1 * wC), (.3 * wC, .09 * wC, .18 * wC), 16, 8, (0, s * .3, s * .5))
    tube('neck', SKIN, [(0, 0, b['zS']), (0, 0, b['zN'] + .03 * S)], .04 * S, 16)

def satchel(a, m, md, deco, across=True):
    b = B; wH, rb = b['wH'], b['wC'] * 1.06 + .004; zb = (b['zCr'] + b['zW']) / 2 - .01 * S
    M = Matrix.Translation((math.sin(a) * (wH + .03 * S), -math.cos(a) * (wH + .03 * S) * b['dep'], zb)) @ Matrix.Rotation(a, 4, 'Z')
    L = lambda x, y, z: M @ Vector((x * S, y * S, z * S))
    o = sphere('bag', m, (0, 0, 0), (.065 * S, .028 * S, .052 * S), 28, 14); o.matrix_world = M; subsurf(o, 1)
    sphere('bagFlap', md, L(0, -.018, .018), (.066 * S, .011 * S, .036 * S), 24, 12, (0, 0, a))
    deco(L(0, -.031, .02), a)
    if across:
        pts = [L(.06, 0, .035), Vector((-.07 * S * math.copysign(1, -a), fronty(rb * 1.02) - .006, b['zW'] + .03 * S)), Vector((.03 * S, fronty(rb) - .012, b['zC'] - .01 * S)),
               Vector((.085 * S, -.03 * S, b['zS'] + .016 * S)), Vector((.08 * S, .05 * S, b['zS'] + .004 * S)), Vector((-.02 * S, rb * b['dep'] + .016, b['zC'] - .02 * S)),
               Vector((-wH * .9, wH * .5, zb + .05 * S)), L(-.06, 0, .035)]
        tube('bagStrap', m, pts, .01 * S, 10, False)

def glow_light(p, energy, col):
    d = bpy.data.lights.new('propLight', 'POINT'); d.energy = energy; d.color = hexc(col)[:3]; d.shadow_soft_size = .02
    lo = bpy.data.objects.new('propLight', d); scene.collection.objects.link(lo); lo.location = p

def body_finn():
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']
    legs(PANTS)
    boots(BOOTF, BAG, b['zSock'] + .02 * S, straps=(.055 * S, .105 * S))
    for s in (-1, 1):  # baggy cream trousers tucked into the boots
        tube('trouser', PANTS, [(s * b['legX'] * .85, 0, b['zCr'] + .02 * S), (s * b['legX'] * 1.05, -.004, (b['zCr'] + b['zSock']) / 2), (s * b['legX'], 0, b['zSock'] + .03 * S)], [wH * .58, wH * .64, wH * .5], 24)
    lathe('seat', PANTS, [(wH * .55, b['zCr'] - .035 * S), (wH * .95, b['zCr'] - .005 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
    torso(SHIRT)
    lathe('belt', BAG, [(wC * 1.06, b['zW'] - .012 * S), (wC * 1.08, b['zW'] + .012 * S)], 32, scale=(1, dep))
    sphere('buckle', BRASS, (0, fronty(wC * 1.08) - .004, b['zW']), (.022 * S, .006 * S, .016 * S), 16, 8)
    # the teal coat, open at the front, gold at the hem, a gold star on the back
    coat = [(wH * 1.32, b['zCr'] - .06 * S), (wH * 1.18, b['zCr'] + .02 * S), (wC * 1.12, b['zW'] + .02 * S), (wC * 1.12, b['zC']), (wC * .9, b['zS'] + .012 * S), (wC * .55, b['zN'])]
    lathe('coat', COAT, coat, 40, scale=(1, dep), arc=(.6, 2 * math.pi - .6))
    lathe('coatHem', BRASS, [(wH * 1.34, b['zCr'] - .065 * S), (wH * 1.33, b['zCr'] - .05 * S)], 40, scale=(1.005, dep * 1.005), arc=(.6, 2 * math.pi - .6))
    pstar('coatStar', BRASS, (0, wC * 1.12 * dep + .01, (b['zCr'] + b['zW']) / 2), .03 * S, .008 * S, (-math.pi / 2, 0, 0))
    tube('coatCollar', COAT, [(-.07 * S, fronty(wC * .55), b['zN'] - .02 * S), (-.06 * S, -.01, b['zN'] + .005), (0, .045 * S, b['zN'] + .01 * S), (.06 * S, -.01, b['zN'] + .005), (.07 * S, fronty(wC * .55), b['zN'] - .02 * S)], .018 * S, 12, False)
    def sleeves(s, sh, el, wr):
        rU = B['rU']; d = (el - sh).normalized()
        tube('coatSleeve', COAT, [sh - d * .015 * S, sh.lerp(el, .5), el], [rU * 1.45, rU * 1.5, rU * 1.42], 20)
        tube('coatCuff', COATIN, [el - d * .01 * S, el + d * .016 * S], rU * 1.52, 20)
        tube('shirtSleeve', SHIRT, [el, el.lerp(wr, .4)], [rU * 1.2, rU * 1.1], 16)
        tube('glove', BAGD, [wr - (wr - el).normalized() * .018 * S, wr + (wr - el).normalized() * .006 * S], B['rA'] * 1.2, 14)
    hands = arm_pair(sleeves)
    satchel(-1.0, BAG, BAGD, lambda p, a: sphere('bagBuckle', BRASS, p, (.012 * S, .006 * S, .014 * S), 12, 6, (0, 0, a)))
    tube('spyglass', BRASS, [(wH * .95, -.06 * S, b['zW'] - .01 * S), (wH * 1.05, -.07 * S, b['zCr'] - .02 * S)], [.016 * S, .02 * S], 14)
    # the glowing compass star floating over Finn's left hand
    c = hands[1] + Vector((.03 * S, -.05 * S, .07 * S))
    pstar('compass', GLOWB, c, .035 * S, .014 * S, (math.pi / 2, 0, 0))
    ring = [c + Vector((math.cos(t) * .05 * S, 0, math.sin(t) * .05 * S)) for t in lin(0, 2 * math.pi, 25)]
    tube('compassRing', BRASS, ring, .004 * S, 8, False)
    glow_light(c + Vector((0, -.04 * S, 0)), .5, '#bfe6ff')

def body_flora():
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']
    legs(TIGHTS)
    boots(BOOTF, BAG, b['zSock'], eyelets=True)
    torso(SHIRT)
    # the lilac dress: a bodice, a flared skirt with a petal hem and a cream frill, a brown corset belt with braces
    lathe('bodice', DRESS, [(wC * 1.05, b['zW'] - .01 * S), (wC * 1.08, (b['zW'] + b['zC']) / 2), (wC * 1.04, b['zC'] - .005 * S)], 32, scale=(1, dep))
    skirt = [(wC * 1.07, b['zW'] + .01 * S), (wH * 1.12, b['zW'] - .03 * S), (wH * 1.4, b['zCr']), (wH * 1.65, b['zCuff'] + .02 * S), (wH * 1.66, b['zCuff'] + .008 * S)]
    lathe('skirt', DRESS, skirt, 40, scale=(1, dep * 1.05))
    lathe('frill', SHIRT, [(wH * 1.45, b['zCuff'] + .025 * S), (wH * 1.6, b['zCuff'] - .005 * S), (wH * 1.55, b['zCuff'] - .015 * S)], 40, scale=(1, dep * 1.05))
    for k in range(11):
        a = 2 * math.pi * k / 11; n = Vector((math.sin(a), -math.cos(a) * dep, -.35)).normalized()
        p = Vector((math.sin(a) * wH * 1.5, -math.cos(a) * wH * 1.5 * dep * 1.05, b['zCr'] - .01 * S))
        o = leaf('petalHem', DRESSL if k % 2 else DRESS, .085 * S, .05 * S, .15, -.1, 1, .006 * S, .3); place(o, p, Vector((math.sin(a) * .35, -math.cos(a) * .35, -1)), n)
    lathe('corset', BAG, [(wC * 1.07, b['zW'] - .02 * S), (wC * 1.1, b['zW'] + .005 * S), (wC * 1.08, b['zW'] + .03 * S)], 32, scale=(1, dep))
    sphere('buckle', BRASS, (0, fronty(wC * 1.1) - .004, b['zW'] + .005 * S), (.018 * S, .006 * S, .014 * S), 16, 8)
    for s in (-1, 1):
        tube('brace', BAG, [(s * .045 * S, fronty(wC * 1.08), b['zW'] + .03 * S), (s * .06 * S, fronty(wC * 1.0), b['zC']), (s * .07 * S, -.02 * S, b['zS'] + .012 * S), (s * .06 * S, .05 * S, b['zS'])], .008 * S, 8, False)
    def sleeves(s, sh, el, wr):
        rU, rA = B['rU'], B['rA']; d = (el - sh).normalized(); e = (wr - el).normalized()
        tube('sleevePuff', SHIRT, [sh - d * .015 * S, sh.lerp(el, .45), el], [rU * 1.5, rU * 1.7, rU * 1.3], 20)
        tube('sleeve', SHIRT, [el, el.lerp(wr, .8)], [rA * 1.35, rA * 1.3], 16)
        tube('sleeveFrill', SHIRT, [wr - e * .02 * S, wr - e * .008 * S, wr + e * .004 * S], [rA * 1.3, rA * 1.6, rA * 1.3], 18)
    hands = arm_pair(sleeves)
    satchel(-1.0, BAG, BAGD, lambda p, a: [sphere('bagPetal', PETAL, p + Vector((math.cos(t) * .012 * S, -.002, math.sin(t) * .012 * S)), (.01 * S, .004 * S, .007 * S), 10, 5) for t in lin(0, 2 * math.pi * .8, 5)], across=False)
    # the flower staff in Flora's left hand: a wooden stick with a vine and a glowing pink flower
    h = hands[1]; bot, top = h + Vector((-.01 * S, .0, -.24 * S)), h + Vector((.07 * S, -.03 * S, .3 * S))
    tube('staff', WOOD, [bot, h, top], [.009 * S, .01 * S, .009 * S], 10)
    for k, f in enumerate(lin(.2, .85, 5)):
        p = bot.lerp(top, f); o = leaf('vineLeaf', LEAFG, .035 * S, .018 * S, .1, .1, 1, .004 * S, .2)
        place(o, p, Vector(((-1) ** k, -.3, .4)), Vector((0, -1, .2)))
    for i in range(6):
        a = i * math.pi / 3
        sphere('staffPetal', FLOWERG, top + Vector((math.cos(a) * .028 * S, -.012 * S, math.sin(a) * .028 * S)), (.026 * S, .01 * S, .016 * S), 16, 8, (0, -a, 0))
    sphere('staffHeart', GLOW, top + Vector((0, -.02 * S, 0)), (.012 * S, .008 * S, .012 * S), 12, 6)
    glow_light(top + Vector((0, -.05 * S, 0)), .15, '#ffc7d6')

group('body', {'lumi': body, 'finn': lambda: body_finn(), 'flora': lambda: body_flora()}[WHO])

# ---------- studio: cream backdrop, soft warm light, a soft glow on the lantern ----------
BG = '#f3ead7'
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = hexc('#fff6e6'); world.node_tree.nodes['Background'].inputs[1].default_value = .45
def light(loc, energy, col, size):
    d = bpy.data.lights.new('L', 'AREA'); d.energy = energy; d.color = hexc(col)[:3]; d.size = size
    o = bpy.data.objects.new('L', d); scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, HC.z * .6)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
k = (HC.z + R) / 1.0
light((-1.5 * k, -2.2 * k, 2.3 * k), 105 * k * k, '#fff4e4', 2.5 * k); light((1.9 * k, -1.5 * k, 1.2 * k), 38 * k * k, '#ffe9d2', 1.8 * k); light((0, 2.1 * k, 2.0 * k), 85 * k * k, '#fff8e8', 2 * k)
me = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(me)
g = bpy.data.objects.new('ground', me); scene.collection.objects.link(g); g.data.materials.append(mat('groundM', BG, .9)); g.is_shadow_catcher = True
cd = bpy.data.cameras.new('cam'); cd.lens = 85; cam = bpy.data.objects.new('cam', cd); scene.collection.objects.link(cam); scene.camera = cam
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 16 if QUICK else 96; scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'; scene.view_settings.exposure = 0
scene.use_nodes = True; nt = scene.node_tree; nt.nodes.clear()
rl = nt.nodes.new('CompositorNodeRLayers'); gl = nt.nodes.new('CompositorNodeGlare'); gl.glare_type = 'FOG_GLOW'; gl.threshold = 1.6; gl.size = 7; gl.mix = -.4
ao = nt.nodes.new('CompositorNodeAlphaOver'); ao.inputs[1].default_value = hexc(BG); cp = nt.nodes.new('CompositorNodeComposite')
nt.links.new(rl.outputs['Image'], gl.inputs['Image']); nt.links.new(gl.outputs['Image'], ao.inputs[2]); nt.links.new(ao.outputs['Image'], cp.inputs['Image'])

def show_face(expr):
    for e, col in FACE_SETS.items(): col.hide_render = col.hide_viewport = (e != expr)

def shoot(name, az, height, dist, look, res):
    q = .5 if QUICK else 1
    scene.render.resolution_x, scene.render.resolution_y = int(res[0] * q), int(res[1] * q)
    cam.location = (math.sin(az) * dist, -math.cos(az) * dist, height)
    cam.rotation_euler = (Vector((0, 0, look)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUT, f'{WHO}-{STYLE}-{name}.png'); bpy.ops.render.render(write_still=True)

show_face('smile')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f'{WHO}-{STYLE}.blend'))
top = HC.z + R * 1.3; mid = top * .5; dist = top * .5 / math.tan(math.radians(12)) * 1.15
if RENDER:
    for name, az in (('front', 0), ('side', math.pi / 2), ('back', math.pi), ('three-quarter', .6)):
        shoot(name, az, mid + top * .12, dist, mid, (600, 780))
if FACES:
    for e in ('happy', 'curious', 'surprised'):
        show_face(e); shoot('face-' + e, .22, HC.z + .1 * R, R * 8.2, HC.z - .02 * R, (640, 640))
    show_face('smile')

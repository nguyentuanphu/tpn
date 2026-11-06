# (v1.08e faces, part 3: owner 6 Nov 2026 AEDT, pop-ups "Animated-film 3D" and "Friends, villagers and crowds")
# A sculpted head and a face made of real shapes, in the style of a family animated film, still cute and child-friendly:
#   sculpt_head(x, y, z)  the head sphere (head units, the face toward -y) shaped into a head: a brow ridge, eye sockets,
#                         a small nose with a bridge, round cheeks (apples), a soft muzzle and chin, narrower temples;
#                         grandparents get softer cheeks and smile lines, children rounder cheeks
#   ear(s)                a cupped ear, tilted back
#   face3d()              one mesh, "face3d": two eyeballs (white, an iris in two shades, a pupil, two sparkles) set in the
#                         sockets, upper and lower lids (skin, a dark lash line on the upper one) that close over them,
#                         brows, rosy cheeks and a mouth with lips; each mood is a shape key of it (smile is the rest shape):
#                         blink, half, happy, curious, surprised, sad, shy, excited, lookL, lookR, open (talking), sleep
# exec'd by lumi.py (the game models; `flatface` keeps the old painted shapes); the game sets one key at a time
# (js/friend-model.ts), as it showed one face mesh at a time before.
import math
from mathutils import Vector

AGE = (V['size'] if V else 'kid')
MOODS3D = ('smile', 'blink', 'half', 'happy', 'curious', 'surprised', 'sad', 'shy', 'excited', 'lookL', 'lookR', 'open', 'sleep')

def _g(dx, dz, sx, sz): return math.exp(-(dx * dx) / (sx * sx) - (dz * dz) / (sz * sz))

def sculpt_head(x, y, z):
    """a point of the (already oval) head moved out or in along its own direction, by the face's shapes"""
    # (v1.08e, owner 6 Nov 2026 AEDT, via Release: "the heads still read as round balls with a face painted on") a real head
    # shape that reads from the front at phone size: first the skull, a little taller and narrower at the temples, the face
    # plane flatter; then the features, about twice as strong as before
    E, ex, ez = P['eye'], P['eyeX'], P['eyeZ']; nz, mz = P.get('noseZ', -.3), P.get('mouthZ', -.47)
    if z > -.1: x *= 1 - .07 * min(1, (z + .1) / .8); z *= 1 + .05 * max(0, z)   # taller, narrower above the eyes
    l0 = math.sqrt(x * x + y * y + z * z) or 1; fr0 = max(0, min(1, (-y / l0 - .25) / .5))
    if abs(z) < .75: y *= 1 - .07 * fr0 * (1 - (z / .75) ** 2)                    # the face plane a little flatter
    l = math.sqrt(x * x + y * y + z * z) or 1; fr = max(0, min(1, (-y / l - .05) / .55)); fr = fr * fr * (3 - 2 * fr)
    d = .06 * _g(x, z - (ez + E * 1.6), .62, .085) * fr                         # the brow ridge, a soft shelf over the eyes
    d -= .03 * _g(x, z - (ez + E * 2.6), .7, .2) * fr                           # a gentle slope of the forehead above it
    for s in (-1, 1):
        d -= .06 * _g(x - s * ex, z - ez, E * 1.35, E * 1.25) * fr               # the eye sockets
        ck = {'kid': .1, 'adult': .065, 'elder': .05}[AGE]
        d += ck * _g(x - s * (ex + .1), z - (ez - E * 1.9), .19, .14) * fr       # round cheeks (the apples), full
        d += ck * .6 * _g(x - s * (ex + .32), z - (mz + .1), .14, .14)           # and bulging out past the jaw line
        d -= .05 * _g(x - s * .82, z - (ez + .22), .16, .22)                     # narrower temples
        d -= .035 * _g(x - s * .55, z - (mz - .17), .16, .1) * fr               # the jaw under the cheeks, toward the chin
        if AGE == 'elder':   # smile lines from the nose to the mouth's corners, and softer, lower cheeks
            for t in (0, .5, 1):
                d -= .02 * _g(x - s * (.13 + .1 * t), z - (nz - .02 + (mz - nz - .02) * t), .035, .06) * fr
            d += .025 * _g(x - s * (ex + .1), z - (mz + .05), .14, .1) * fr
    d += .15 * _g(x, z - nz, .065, .07) * fr                                      # a small round nose that catches the light
    d += .06 * _g(x, z - (nz + .13), .05, .12) * fr                               # its bridge
    for s in (-1, 1): d += .04 * _g(x - s * .07, z - (nz - .025), .045, .04) * fr   # the nostril wings
    d -= .035 * _g(x, z - (nz - .1), .07, .04) * fr                               # a soft hollow under it (its shadow)
    d += .035 * _g(x, z - (mz + .02), .2, .1) * fr                                # a soft muzzle round the mouth
    d += .07 * _g(x, z - (mz - .21), .12, .075) * fr                              # a defined chin
    k = 1 + d / l
    return x * k, y * k, z * k

def ear(s):
    """a cupped ear on side s (+1 the person's left), its hollow facing forward and out; it shows past the cheeks"""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1)
    for v in bm.verts:
        lx, ly, lz = v.co
        if lx > 0: lx -= 1.25 * lx * math.exp(-(ly * ly + lz * lz) / .35)   # the hollow
        lz += .12 * ly   # a little rounder at the back
        v.co = Vector((lx * .085, ly * .13, lz * .21))
    M = Matrix.Translation(H(s * .93, .06, -.12)) @ Matrix.Rotation(s * .55, 4, 'Z') @ Matrix.Rotation(-.18, 4, 'X') @ Matrix.Diagonal((s * R, R, R, 1))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    if s < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return obj_from(bm, 'ear', SKIN)

class _Mesh:
    def __init__(self): self.v, self.f = [], []
    def vert(self, p): self.v.append(Vector(p)); return len(self.v) - 1
    def face(self, idx, m, ref=None): self.f.append((tuple(idx), m, ref))
    def grid(self, rows, m_of, close=False, ref=None):
        """rows of vertex indices, the same length; a quad between each two rows and two neighbours"""
        for r in range(len(rows) - 1):
            n = len(rows[r])
            for c in range(n if close else n - 1):
                c2 = (c + 1) % n; self.face((rows[r][c], rows[r][c2], rows[r + 1][c2], rows[r + 1][c]), m_of(r, c), ref(r) if callable(ref) else ref)

def _tube(M, pts, radii, nrm, m, seg=6):
    """a small tube through points (world), pinched at both ends (brows, lashes)"""
    rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized(); a = nrm.cross(t).normalized(); b = t.cross(a)
        rings.append([M.vert(p + (a * math.cos(2 * math.pi * k / seg) * radii[i] + b * math.sin(2 * math.pi * k / seg) * radii[i] * .7)) for k in range(seg)])
    M.grid(rings, lambda r, c: m, close=True, ref=lambda r: (pts[r] + pts[r + 1]) / 2)
    for ring, ref in ((rings[0], pts[1]), (rings[-1], pts[-2])):
        c = M.vert(sum((M.v[i] for i in ring), Vector()) / len(ring))
        for k in range(seg): M.face((c, ring[k], ring[(k + 1) % seg]), m, ref)

def _disc(M, x, z, sx, sz, out, m, n=12):
    """a soft oval lying on the face (the rosy cheeks)"""
    c = M.vert(onf(x, z, out)[0]); ring = [M.vert(onf(x + sx * math.cos(2 * math.pi * k / n), z + sz * math.sin(2 * math.pi * k / n), out * .6)[0]) for k in range(n)]
    for k in range(n): M.face((c, ring[k], ring[(k + 1) % n]), m, HC)

# per mood: the upper lid's middle, the lower lid's middle, the corners (degrees up from the eye's middle), the sad droop of
# the outer corner, where the eyes look (degrees to the person's left, up), the iris size
EYE3D = {
    'smile': (30, -46, -6, 0, 0, 0, 1), 'open': (30, -46, -6, 0, 0, 0, 1), 'half': (-4, -42, -10, 0, 0, 0, 1),
    'blink': (-28, -24, -16, 0, 0, 0, 1), 'sleep': (-28, -24, -16, 0, 0, -4, 1), 'happy': (6, 8, -14, 0, 0, 0, 1),
    'excited': (40, -50, -6, 0, 0, 2, 1.04), 'surprised': (46, -54, -4, 0, 0, 0, .84), 'curious': (35, -44, -5, 0, -12, 6, 1),
    'sad': (19, -42, -10, 14, 0, -9, 1), 'shy': (21, -38, -8, 0, -14, -12, 1), 'lookL': (30, -46, -6, 0, 22, 0, 1), 'lookR': (30, -46, -6, 0, -22, 0, 1),
}
BROW3D = {'surprised': .1, 'happy': .045, 'sad': .04, 'excited': .085, 'shy': .05, 'curious': .07, 'blink': .015, 'sleep': .0}
RINGS = [0, 7, 13, 18, 24, 30, 35, 39, 47, 62, 82, 110, 140, 180]   # the eyeball's rings, degrees from where it looks

def face3d_points(expr):
    """the face's vertices and faces for one mood (the same count and order for every mood)"""
    M = _Mesh(); E, ex, ez, Mo = P['eye'], P['eyeX'], P['eyeZ'], P.get('mouth', 1.0)
    e0, b0, c0, droop, laz, lel, isc = EYE3D[expr]
    rE = E * 1.45 * R; A = math.degrees(math.asin(min(.95, E * 1.04 * R / rE))); AW = A + 34
    for s in (-1, 1):
        F = Vector((s * .1, -1, -.04)).normalized(); X = Vector((0, 0, 1)).cross(F).normalized(); U = F.cross(X).normalized()
        # (X points to the person's left, +x, for both eyes)
        p, _ = onf(s * ex, ez, 0); C = p - F * (.69 * rE)
        D = lambda az, el, F=F, X=X, U=U: (F * (math.cos(math.radians(az)) * math.cos(math.radians(el))) + X * (math.sin(math.radians(az)) * math.cos(math.radians(el))) + U * math.sin(math.radians(el)))
        # the eyeball, in rings round the way it looks: the pupil, the iris (darker above, lighter below), the white
        L = D(laz, lel); LX = Vector((0, 0, 1)).cross(L).normalized(); LU = L.cross(LX).normalized(); seg = 24
        ang = [a * isc if a <= 39 else a for a in RINGS]
        tip = M.vert(C + L * rE); rows = [[tip] * seg]
        for a in ang[1:-1]:
            rows.append([M.vert(C + (L * math.cos(math.radians(a)) + (LX * math.cos(2 * math.pi * k / seg) + LU * math.sin(2 * math.pi * k / seg)) * math.sin(math.radians(a))) * rE) for k in range(seg)])
        back = M.vert(C - L * rE); rows.append([back] * seg)
        def eyem(r, c, seg=seg):
            a = RINGS[r + 1]; low = math.sin(2 * math.pi * (c + .5) / seg) < -.15
            return PUPIL if a <= 13 else (IRIS if low and a <= 30 else IRISD) if a <= 39 else EYEW
        for r in range(len(rows) - 1):
            for k in range(seg):
                k2 = (k + 1) % seg; m = eyem(r, k)
                if r == 0: M.face((rows[0][0], rows[1][k], rows[1][k2]), m, C)
                elif r == len(rows) - 2: M.face((rows[r][k], rows[r + 1][0], rows[r][k2]), m, C)
                else: M.face((rows[r][k], rows[r + 1][k], rows[r + 1][k2], rows[r][k2]), m, C)
        # two sparkles, the light's reflection: they stay still while the eye turns (the lids hide them when closed)
        for az, el, rad in ((10, 15, 6.5 if expr != 'excited' else 8), (-15, -20, 3)):
            cc = M.vert(C + D(az, el) * (rE * 1.012)); ring = []
            for k in range(8):
                q = 2 * math.pi * k / 8; ring.append(M.vert(C + D(az + rad * math.cos(q), el + rad * math.sin(q)) * (rE * 1.01)))
            for k in range(8): M.face((cc, ring[k], ring[(k + 1) % 8]), SHINE, C)
        # the lids: shells round the eyeball from their edge back into the head; the upper one in front where they meet
        def edge(mid, az):
            k = max(0, 1 - (az / A) ** 2); e = c0 + (mid - c0) * k
            return e
        azs = lin(-AW, AW, 17)
        for upper in (True, False):
            mid = e0 if upper else b0; sgn = 1 if upper else -1
            # (rows close enough that, closed, no flat panel between two of them dips into the eyeball)
            ts = (0, .035, .1, .2, .31, .43, .56, .7, .85, 1)
            rr = (1.006, 1.055, 1.055, 1.052, 1.05, 1.048, 1.045, 1.04, 1.035, 1.03) if upper else (1.005, 1.04, 1.04, 1.038, 1.036, 1.034, 1.032, 1.03, 1.025, 1.02)
            rows = []
            for t, rad in zip(ts, rr):
                row = []
                for az in azs:
                    e = edge(mid, az)
                    if upper and droop and az * s > 0: e -= droop * min(1, az * s / A) ** 1.5   # sad: the outer corner droops
                    if upper and expr in ('blink', 'sleep', 'happy'): e = min(e, edge(b0, az) - 2)   # closed: the upper lid over the lower one
                    end = 105 * sgn; el = e + (end - e) * t   # (the back rows stay outside the eyeball: it never shows through a closed lid)
                    row.append(M.vert(C + D(az, el) * (rE * rad)))
                rows.append(row)
            if not upper: rows = [list(reversed(r)) for r in rows]
            M.grid(rows, lambda r, c, upper=upper: LASH if upper and r <= 1 else SKIN, ref=C)
            if upper:   # lashes at the outer corner: three soft curls for girls, one small flick for boys
                for k in range(3 if G == 'f' else 1):
                    az = s * (A * (.98 - .14 * k)); e = edge(mid, az)
                    if droop and az * s > 0: e -= droop * min(1, az * s / A) ** 1.5
                    if expr in ('blink', 'sleep', 'happy'): e = min(e, edge(b0, az) - 2)
                    base = C + D(az, e + 2) * (rE * 1.07); out_ = (D(az + s * 25, e + 30) - D(az, e)).normalized()
                    Ll = (.05 - .008 * k) * R * E / .185
                    _tube(M, [base, base + out_ * Ll * .6 + U * Ll * .2, base + out_ * Ll + U * Ll * .45], [.008 * R, .005 * R, .0015 * R], F, LASH, 5)
        # the brow: on the brow ridge, raised and tilted by the mood
        up = BROW3D.get(expr, .025) + (.03 if expr == 'curious' and s < 0 else 0); tilt = {'sad': .05, 'shy': .03}.get(expr, 0)
        bz = ez + E * 1.62 + .03 + up
        pts = [(s * ex - s * .11, bz + tilt - .01), (s * ex - s * .01, bz + .018), (s * ex + s * .11, bz + .002 - tilt)]
        rad = [.018, .028, .016] if G != 'f' else [.012, .02, .01]
        _tube(M, [onf(x_, z_, .035)[0] for x_, z_ in pts], [r_ * R for r_ in rad], Vector((0, -1, 0)), BROW, 6)
        # rosy cheeks, lifted and fuller when happy, shy or excited
        bl = 1.3 if expr in ('shy', 'excited', 'happy') else 1.0; lift = .035 if expr in ('happy', 'excited') else 0
        _disc(M, s * P.get('blushX', .53), P.get('blushZ', -.37) + lift, .15 * Mo * bl, .085 * Mo * bl, .014, BLUSH)
    # the mouth: a grid between its top and bottom lines (dark inside, the tongue low), soft lips round it in the skin colour
    mz = P.get('mouthZ', -.5); s_ = lambda u: math.sqrt(max(0, 1 - u * u))
    if expr in ('smile', 'half', 'lookL', 'lookR', 'happy', 'excited'):
        w, h = {'happy': (.2, .17), 'excited': (.22, .2)}.get(expr, (.17, .15)); w *= Mo; h *= Mo
        top = lambda u: mz + h * (.08 + .24 * u * u); bot = lambda u: mz + h * (.08 + .24 * u * u) - h * 1.02 * s_(u) ** .8; x0 = 0
    elif expr == 'open':
        w, h = .12 * Mo, .15 * Mo; top = lambda u: mz + h * .32 * s_(u); bot = lambda u: mz - h * .68 * s_(u); x0 = 0
    elif expr == 'surprised':
        w, h = .075 * Mo, .1 * Mo; top = lambda u: mz - .03 + h * .5 * s_(u); bot = lambda u: mz - .03 - h * .5 * s_(u); x0 = 0
    else:
        mid = {'blink': (lambda u: mz - .02 * Mo + .025 * Mo * u * u, .07), 'sleep': (lambda u: mz - .01 * Mo + .008 * Mo * u * u, .05),
               'sad': (lambda u: mz - .015 - .028 * Mo * u * u, .07), 'shy': (lambda u: mz - .03 * Mo + .025 * Mo * u * u, .058),
               'curious': (lambda u: mz - .03 + .012 * u, .05)}[expr]
        w = mid[1] * Mo; th = lambda u: .011 * (.35 + .65 * s_(u)); top = lambda u, f=mid[0]: f(u) + th(u); bot = lambda u, f=mid[0]: f(u) - th(u); x0 = -.008 if expr == 'shy' else 0
    us = lin(-1, 1, 13); vs = (1.0, .5, 0, -.5, -1.0)
    rows = [[M.vert(onf(x0 + w * u * 1.06, top(u) + .016, .006)[0]) for u in us]]   # the upper lip
    for v in vs: rows.append([M.vert(onf(x0 + w * u, (top(u) + bot(u)) / 2 + v * (top(u) - bot(u)) / 2, .012 - .004 * (1 - abs(v)))[0]) for u in us])
    rows.append([M.vert(onf(x0 + w * u * 1.06, bot(u) - .018, .006)[0]) for u in us])   # the lower lip
    M.grid(rows, lambda r, c: SKIN if r in (0, len(rows) - 2) else TONGUE if (r >= 3 and 3 <= c <= 8) else MOUTH, ref=HC)
    return M

def face3d():
    """the face mesh with a shape key for each mood, in its own collection "face3d" (bound to the head bone)"""
    col = bpy.data.collections.new('face3d'); scene.collection.children.link(col)
    meshes = {e: face3d_points(e) for e in MOODS3D}; base = meshes['smile']
    mats = []
    faces = []
    for f, m, ref in base.f:   # each face turned away from its reference point (the eye's middle, the head's, a tube's line)
        if m not in mats: mats.append(m)
        if ref is not None:
            a, b, c = (base.v[i] for i in f[:3]); n = (b - a).cross(c - a); mid = sum((base.v[i] for i in f), Vector()) / len(f)
            if n.dot(mid - ref) < 0: f = tuple(reversed(f))
        faces.append((f, m))
    me = bpy.data.meshes.new('face3d'); me.from_pydata([tuple(v) for v in base.v], [], [f for f, _ in faces])
    for m in mats: me.materials.append(m)
    for p, (_, m) in zip(me.polygons, faces): p.material_index = mats.index(m); p.use_smooth = True
    o = bpy.data.objects.new('face3d', me); col.objects.link(o)
    o.shape_key_add(name='smile', from_mix=False)
    for e in MOODS3D[1:]:
        assert len(meshes[e].v) == len(base.v), (e, len(meshes[e].v), len(base.v))
        k = o.shape_key_add(name=e, from_mix=False)
        for i, v in enumerate(meshes[e].v): k.data[i].co = v
    print('face3d:', len(base.v), 'vertices,', sum(len(f) - 2 for f, _ in faces), 'triangles,', len(MOODS3D), 'moods')
    return o

def show_face3d(expr):
    o = bpy.data.objects.get('face3d')
    if not o or not o.data.shape_keys: return
    for k in o.data.shape_keys.key_blocks[1:]: k.value = 1.0 if k.name == expr else 0.0

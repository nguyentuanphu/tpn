# Hair as big soft sculpted locks (owner, 3 Nov 2026 AEDT, pop-up: "Big soft sculpted locks"), run inside lumi.py after lumi-more.py.
# A thin base gives the hairline; large, thick, tapering locks lie on it and flow in one direction: away from a parting, down with gravity,
# or towards a bun, a ponytail or pigtails. Vietnamese hair: straight and black (neat side parts, long straight hair, low buns, straight bangs);
# Australian hair: waves, tousled short hair, ponytails, curls, afro puffs.

def slock(m, L, W, th=None, wave=0.0, curl=.25, flick=.15, hug=1.0, taper=.85, N=12):
    """one sculpted lock along +Y (its face +Z): wide at the root, tapering to a soft tip; wave makes an S-curve, flick turns the tip out"""
    th = th or W * .45
    bm = bmesh.new(); rows = []
    for i in range(N + 1):
        t = i / N; w = W * (1 - t) ** taper * (.85 + .15 * math.sin(math.pi * t)) + W * .08
        y = t * L; z = -(y * y) / (2 * hug) + flick * L * t ** 3; xo = wave * W * math.sin(t * math.pi * 2)
        rows.append([bm.verts.new((xo + u * w, y, z + .35 * w * (1 - u * u) - curl * w * u * u)) for u in (-1, -.5, 0, .5, 1)])
    for i in range(N):
        for j in range(4): bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=th)
    o = obj_from(bm, 'hairLock', m); subsurf(o, 2); return o

def on_head(az, el, lift=1.04):
    hx, hy, hz = P.get('head', (1.03, .96, .94))
    n = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    return HC + Vector((n.x * hx, n.y * hy, n.z * hz)) * R * lift, n

def lock_at(m, az, el, L, W, toward=None, away=None, gravity=.6, spin=.15, lift=None, out=None, **kw):
    """a lock rooted on the head at (az, el), flowing towards a point, away from a point, or simply down"""
    # volume (owner, 3 Nov: "the hair looks too flat"): locks stand off the head, more on the crown, and lean outwards
    TOY = LOOK == 'toy'   # the soft-toy look: big locks lying close to the head, tips tucked in
    lift = lift or ((1.04 + .04 * max(0, math.sin(el))) if TOY else (1.07 + .1 * max(0, math.sin(el)))); out = (0.0 if TOY else .1 * max(0, math.sin(el)) + .02) if out is None else out
    if TOY: kw['flick'] = min(kw.get('flick', .2), .06); kw['wave'] = kw.get('wave', 0) * .5; spin = min(spin, .06)
    base, n = on_head(az, el, lift)
    down = Vector((0, 0, -1)); g = (down - down.project(n))
    if toward is not None: d = (toward - base); d = d - d.project(n)
    elif away is not None: d = (base - away); d = d - d.project(n)
    else: d = g.copy()
    if d.length < 1e-4: d = g
    d = (d.normalized() * (1 - gravity) + (g.normalized() if g.length > 1e-4 else d.normalized()) * gravity + n * out).normalized()
    kw.setdefault('flick', .2); o = slock(m, L * R * (1.0 if TOY else 1.1), W * R * (1.35 if TOY else 1.15), hug=kw.pop('hug', 1.05) * R * lift * 1.15, **kw)
    place(o, base, d, n, random.uniform(-spin, spin)); return o

def hair_base(m, hairline=.3, sides=-.4, back=-.66):
    """a thin base that shapes the hairline round the face (the locks give the volume)"""
    hx, hy, hz = P.get('head', (1.03, .96, .94))
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=1)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -.18 and v.co.z < hairline + .3 * v.co.x ** 2) or (v.co.z < sides and v.co.y < .3) or v.co.z < back], context='VERTS')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(HC + Vector((0, .02 * R, .04 * R))) @ Matrix.Diagonal((hx * 1.1 * R, hy * 1.09 * R, hz * 1.08 * R, 1)), verts=bm.verts)
    o = obj_from(bm, 'hairCap', m); so = o.modifiers.new('thick', 'SOLIDIFY'); so.thickness = .05 * R; so.offset = -1; subsurf(o, 2); return o

def ring(el, count, fn, skip_face=True, phase=0.0):
    for k in range(count):
        az = 2 * math.pi * (k + phase) / count + random.uniform(-.06, .06)
        if skip_face and front_open(az, el): continue
        fn(az, el, k)

def style(name, A=None, Bm=None, side=1):
    """build one hairstyle from sculpted locks; A main colour, Bm a lighter one"""
    A = A or HAIR; Bm = Bm or HAIRL; C = lambda k: (A, Bm)[k % 2]
    top = HC + Vector((0, 0, R * 1.1))
    if name == 'sidepart':   # neat and short, parted on one side, swept across (Vietnamese men, Finn)
        hair_base(A, .4, -.32, -.6); part = HC + Vector((side * .4 * R, -.3 * R, R * 1.0))
        ring(1.25, 8, lambda az, el, k: lock_at(C(k), az, el, .75, .5, away=part, gravity=.25), False)
        ring(.85, 13, lambda az, el, k: lock_at(C(k), az, el, .6, .45, away=part, gravity=.55), True, .5)
        ring(.4, 14, lambda az, el, k: lock_at(C(k), az, el, .5, .42, gravity=.9), True)
        ring(0, 12, lambda az, el, k: lock_at(C(k), az, el, .38, .4, gravity=1), True, .5)
        for k, az in enumerate((-.55, -.25, .05)): lock_at(C(k), side * az * -1, 1.05, .7, .5, toward=HC + Vector((-side * 1.2 * R, -1.0 * R, .2 * R)), gravity=.2, flick=.25)
    elif name in ('bangs', 'messy'):   # a short cut with a fringe (Vietnamese boys), or tousled (Australian boys and dads)
        hair_base(A, .22, -.36, -.6); crown = HC + Vector((0, .5 * R, R * .95))
        mess = name == 'messy'
        ring(1.3, 7, lambda az, el, k: lock_at(C(k), az, el, .7, .52, away=crown, gravity=.3, flick=.35 if mess else .15, spin=.25 if mess else .1), False)
        ring(.9, 13, lambda az, el, k: lock_at(C(k), az, el, .62, .46, away=crown, gravity=.5, flick=.3 if mess else .15, spin=.2 if mess else .08), False, .5)
        ring(.45, 14, lambda az, el, k: lock_at(C(k), az, el, .5, .42, gravity=.9, flick=.3 if mess else .1), True)
        ring(.05, 12, lambda az, el, k: lock_at(C(k), az, el, .38, .4, gravity=1), True, .5)
    elif name == 'long':   # long straight hair with a middle parting, down to the waist (Vietnamese women)
        hair_base(A, .3, -.2, -.55); part = HC + Vector((0, -.35 * R, R * 1.05))
        ring(1.2, 10, lambda az, el, k: None if math.cos(az) > .8 else lock_at(C(k), az, el, 1.0, .55, away=part, gravity=.5, flick=0), False)
        ring(.7, 14, lambda az, el, k: lock_at(C(k), az, el, 2.6 if math.cos(az) < .2 else 1.6, .5, gravity=.95, flick=0, curl=.15), True)
        ring(.25, 12, lambda az, el, k: lock_at(C(k), az, el, 2.4, .5, gravity=1, flick=0, curl=.15), True, .5)
    elif name == 'lowbun':   # combed back to a low bun at the nape (it sits under a hat)
        hair_base(A, .36, -.36, -.62); bun = HC + Vector((0, .95 * R, -.3 * R))
        ring(1.25, 9, lambda az, el, k: lock_at(C(k), az, el, .9, .5, toward=bun, gravity=.1, flick=0), False)
        ring(.75, 14, lambda az, el, k: lock_at(C(k), az, el, .85, .48, toward=bun, gravity=.1, flick=0), True, .5)
        ring(.3, 12, lambda az, el, k: lock_at(C(k), az, el, .6, .45, toward=bun, gravity=.2, flick=0), True)
        sphere('bun', A, bun + Vector((0, .1 * R, 0)), (.38 * R, .32 * R, .34 * R), 24, 12)
        for k in range(5):
            a = k * 2 * math.pi / 5; o = slock(C(k), .7 * R, .3 * R, curl=.5, flick=0, hug=.4 * R)
            place(o, bun + Vector((math.cos(a) * .3 * R, .1 * R, math.sin(a) * .3 * R)), Vector((-math.sin(a), 0, math.cos(a))), Vector((math.cos(a), .3, math.sin(a))))
    elif name == 'ponytail':   # pulled back to a high ponytail with a soft wave (Australian mums)
        hair_base(A, .32, -.36, -.62); base = HC + Vector((0, .82 * R, .55 * R))
        ring(1.25, 9, lambda az, el, k: lock_at(C(k), az, el, .9, .5, toward=base, gravity=.05, flick=0), False)
        ring(.75, 14, lambda az, el, k: lock_at(C(k), az, el, .9, .48, toward=base, gravity=.05, flick=0), True, .5)
        ring(.3, 12, lambda az, el, k: lock_at(C(k), az, el, .7, .45, toward=base + Vector((0, 0, -.2 * R)), gravity=.1, flick=0), True)
        sphere('ponyTie', felt('tie', '#e2574c'), base, (.17 * R, .13 * R, .17 * R), 16, 8)
        for k in range(6):
            a = k * 2 * math.pi / 6; o = slock(C(k), 1.5 * R, .34 * R, wave=.35, flick=.15, hug=3 * R)
            place(o, base + Vector((math.cos(a) * .08 * R, .05 * R, math.sin(a) * .08 * R)), Vector((math.cos(a) * .15, .35, -1)), Vector((math.cos(a), .6, math.sin(a))))
    elif name == 'pigtails':   # straight bangs and two pigtails (Vietnamese schoolgirls)
        hair_base(A, .18, -.36, -.62)
        ring(1.25, 9, lambda az, el, k: lock_at(C(k), az, el, .8, .5, toward=HC + Vector((math.copysign(1.1, math.sin(az) or 1) * R, .2 * R, 0)), gravity=.2, flick=0), False)
        ring(.75, 14, lambda az, el, k: lock_at(C(k), az, el, .7, .46, toward=HC + Vector((math.copysign(1.1, math.sin(az) or 1) * R, .2 * R, 0)), gravity=.3, flick=0), True, .5)
        for k, az in enumerate((-.5, -.25, 0, .25, .5)): lock_at(C(k), az, 1.0, .72, .45, gravity=1, flick=0, curl=.1)   # straight bangs
        for s in (-1, 1):
            tie = HC + Vector((s * 1.05 * R, .2 * R, 0)); sphere('pigTie', felt('tie', '#e2574c'), tie, (.14 * R, .14 * R, .12 * R), 16, 8)
            for k in range(3):
                o = slock(C(k), 1.0 * R, .32 * R, flick=.1, hug=3 * R); place(o, tie + Vector((s * .05 * R, (k - 1) * .06 * R, 0)), Vector((s * .25, 0, -1)), Vector((s, (k - 1) * .4, .1)))
    elif name == 'puffs':   # two round afro puffs (Australian girl)
        hair_base(A, .3, -.38, -.62)
        for s in (-1, 1):
            c = HC + Vector((s * .8 * R, .15 * R, .8 * R)); sphere('hairPuff', A, c, (.44 * R, .42 * R, .42 * R), 24, 12)
            for k in range(26):
                a = random.uniform(0, 2 * math.pi); e = random.uniform(-1.2, 1.4); n = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
                sphere('hairCurl', C(k), c + n * .42 * R, (.14 * R,) * 3, 10, 5)
            sphere('puffTie', felt('tie', '#f2c14e'), c + Vector((-s * .25 * R, -.05 * R, -.25 * R)), (.15 * R, .15 * R, .1 * R), 12, 6)
        ring(.9, 12, lambda az, el, k: lock_at(C(k), az, el, .5, .45, gravity=.4, curl=.5, flick=.4), True)
    elif name == 'curls':   # short soft curls (Australian grandma, Sol)
        hair_base(A, .34, -.38, -.62)
        for k in range(150):   # dense soft curls
            az = random.uniform(-math.pi, math.pi); el = random.uniform(-.15, 1.57)
            if front_open(az, el) and el < .95: continue
            p, n = on_head(az, el, random.uniform(1.08, 1.2)); sphere('hairCurl', C(k), p, (.2 * R, .2 * R, .17 * R), 12, 6)
    elif name == 'waves':   # wavy hair to the shoulders, middle parting (Clara)
        hair_base(A, .3, -.3, -.6); part = HC + Vector((0, -.35 * R, R * 1.05))
        ring(1.2, 10, lambda az, el, k: None if math.cos(az) > .8 else lock_at(C(k), az, el, .95, .58, away=part, gravity=.55, flick=.05, wave=.12), False)
        ring(.7, 14, lambda az, el, k: lock_at(C(k), az, el, 1.7, .55, gravity=1, flick=.12, wave=.18, out=.0), True, .5)
        ring(.25, 12, lambda az, el, k: lock_at(C(k), az, el, 1.5, .52, gravity=1, flick=.15, wave=.18, out=.0), True)
    else:   # tuft: bald on top, short hair round the back and sides (grandpas)
        for k in range(14):
            az = math.pi * .35 + k * math.pi * 1.3 / 13; lock_at(C(k), az, .1, .35, .4, gravity=1, flick=.2)

# the friends' hair in sculpted locks (Lumi keeps her leaves)
def hair_finn():
    style('messy', HAIR, HAIRL)
    for k, az in enumerate((-.6, -.3, 0.0, .3)): lock_at((HAIR, HAIRL)[k % 2], az, 1.05, .75, .48, toward=HC + Vector((1.3 * R, -1.0 * R, .2 * R)), gravity=.25, flick=.3)   # a fringe swept to the side

def hair_clara():
    style('waves', HAIR, HAIRL)
    _clara_braids_and_flower()

def hair_sol():
    style('curls', HAIR, HAIRL)

VSTYLE = {'sidepart': 'sidepart', 'boybangs': 'bangs', 'messy': 'messy', 'long': 'long', 'lowbun': 'lowbun', 'ponytail': 'ponytail',
          'bangspigtails': 'pigtails', 'puffs': 'puffs', 'curls': 'curls', 'tuft': 'tuft'}
def hair_villager():
    HS = mat('hairShell', PAL[1], .5, .45); HL = mat('hairShellL', PAL[3], .5, .45)
    style(VSTYLE.get(VHAIR.get(ROLE, 'sidepart'), 'sidepart'), HS, HL)

def _clara_braids_and_flower():
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
    # a cream flower clip with two leaves, high on Clara's right
    c = H(-.62, -.58, .7); n = (c - HC).normalized(); q = n.to_track_quat('Z', 'Y').to_matrix()
    for i in range(5):
        a = i * 2 * math.pi / 5; p = c + q @ Vector((math.cos(a) * .13 * R, math.sin(a) * .13 * R, .06 * R))
        sphere('petal', PETAL, p, (.13 * R, .08 * R, .04 * R), 16, 8, (q @ Matrix.Rotation(a, 3, 'Z')).to_euler())
    sphere('flowerHeart', STAR, c + n * .1 * R, (.06 * R, .06 * R, .04 * R), 12, 6)
    for a in (2.4, 3.6):
        o = leaf('flowerLeaf', LEAFG, .22 * R, .1 * R, .2, .2, 10, .03 * R, .2); place(o, c + n * .03 * R, q @ Vector((math.cos(a), math.sin(a), 0)), n)

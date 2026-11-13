# (Meshy pets, 10 Nov 2026) A Meshy animal made ready for the game: our own four-legged rig on Meshy's model.
# Meshy's auto-rigging is humanoid only, so the skeleton is the game's own creature skeleton (the same bone names as
# tools/blender/world-creatures.py: body, head, ear0/1, tail, leg0-3, knee0-3, the face bones), placed on the Meshy
# mesh from its shape (with tools/meshy/animal_joints/<kind>.json to correct a joint by hand), weighted part by part,
# and given the same clips (idle, walk, the happy move, follow, cheer, sad, surprised, sleep) by world-creatures.py's
# own animal_moves(). The face: Meshy's painted eyes are kept; shut eyes are a small piece of the head's own surface
# over each eye, painted with the fur round the eye and a lash line (shown by the clips' blinks and sleep), and an
# open mouth piece for the happy moves.
#   blender -b -P tools/meshy/fit_animal.py -- <kind> <near.glb> <far.glb> <out dir> [debug]
# writes <out dir>/creature-<kind>-hd.glb (near) and creature-<kind>.glb (far), raw (pack them with gltfpack -cc -kn -km -ke),
# and <out dir>/<kind>-joints.png (the joints drawn on the model) when debug is given.
import sys, os, math, json, importlib.util
sys.dont_write_bytecode = True
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
KIND, NEAR, FAR, OUT = argv[:4]
DEBUG = 'debug' in argv[4:]
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))

# world-creatures.py as a module (its own run is kept for `blender -P`; given an empty out dir it builds nothing here)
_argv = sys.argv; sys.argv = [sys.argv[0], '--', os.path.join(OUT, '_wc')]
spec = importlib.util.spec_from_file_location('wc', os.path.join(ROOT, 'tools', 'blender', 'world-creatures.py'))
wc = importlib.util.module_from_spec(spec); spec.loader.exec_module(wc); sys.argv = _argv
SPEC = json.load(open(os.path.join(ROOT, 'tools', 'blender', 'creatures-spec.json')))
# (11 Nov 2026) the companions (the little dragon, Sparkle the firefly) fly: centred in the air on the code shape's
# middle, a body, a head (for the hat), two wings and a tail, and world-creatures.py's companion moves (fly, flap ...)
COMP = KIND in SPEC['companions']
A = SPEC['companions'][KIND] if COMP else SPEC['animals'][KIND]
if not COMP: A = dict(A, legs=[dict(l) for l in A['legs']])
JOINTS = os.path.join(HERE, 'animal_joints', KIND + '.json')
FIX = json.load(open(JOINTS)) if os.path.exists(JOINTS) else {}

def load(path):
    """the Meshy model, one mesh, turned to face -y (three's +z), standing on z 0, as tall as the game's animal"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = wc.FPS   # (the clips' frames are 30 a second, as world-creatures.py makes them)
    bpy.ops.import_scene.gltf(filepath=path)
    ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in ms: o.data.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4); o.parent = None
    for o in list(bpy.context.scene.objects):
        if o.type != 'MESH': bpy.data.objects.remove(o)
    o = ms[0]
    if len(ms) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for m in ms: m.select_set(True)
        bpy.context.view_layer.objects.active = o; bpy.ops.object.join()
    V = np.array([v.co[:] for v in o.data.vertices])
    H = V[:, 2].max() - V[:, 2].min()
    # the head is the top: it faces -y
    top = V[V[:, 2] > V[:, 2].min() + H * .75]
    if top[:, 1].mean() > (V[:, 1].min() + V[:, 1].max()) / 2: o.data.transform(Matrix.Rotation(math.pi, 4, 'Z'))
    if FIX.get('flip'): o.data.transform(Matrix.Rotation(math.pi, 4, 'Z'))   # (the guess is wrong when the top leans back: Sparkle's antennae)
    if FIX.get('cut_x'):   # (Sparkle's wings: Meshy makes them solid; the game keeps its own see-through wings)
        import bmesh as _bm
        bm = _bm.new(); bm.from_mesh(o.data); cx = FIX['cut_x']; zx = FIX.get('cut_keep_below', -1e9)
        V0 = np.array([v.co[:] for v in bm.verts]); wx = (V0[:, 0].max() - V0[:, 0].min()) / 2; mx = (V0[:, 0].max() + V0[:, 0].min()) / 2
        z0, z1 = V0[:, 2].min(), V0[:, 2].max()
        gone = [f for f in bm.faces if abs(f.calc_center_median().x - mx) > wx * cx and f.calc_center_median().z > z0 + (z1 - z0) * zx]
        if FIX.get('cut_pale'):   # (and the wings' roots by their colour: pale and grey-white, beside the body, above the tail)
            im, px = tex_of(o); uvl = bm.loops.layers.uv.active; px0, px1 = FIX['cut_pale']
            for f in bm.faces:
                cm = f.calc_center_median(); fx = abs(cm.x - mx) / wx; fz = (cm.z - z0) / (z1 - z0)
                if fx < px0 or not (px1 < fz < FIX.get('cut_top', .8)): continue   # (cut_top: below the head, so the pale face and the eyes' whites stay)
                uv = np.mean([l[uvl].uv[:] for l in f.loops], 0); c = sample(px, uv); L = c @ np.array([.3, .59, .11]); sat = c.max() - c.min()
                if L > FIX.get('cut_light', .55) and sat < FIX.get('cut_sat', .14): gone.append(f)   # (cut_light, cut_sat: the pale strands of the wings' roots)
        _bm.ops.delete(bm, geom=list(set(gone)), context='FACES'); bm.to_mesh(o.data); bm.free()
    V = np.array([v.co[:] for v in o.data.vertices])
    want = FIX.get('height', A['box']['max'][1] - (A['box']['min'][1] if COMP else 0))
    k = want / (V[:, 2].max() - V[:, 2].min())
    c = Vector(((V[:, 0].min() + V[:, 0].max()) / 2, (V[:, 1].min() + V[:, 1].max()) / 2, V[:, 2].min()))
    # (where the game's animal stands: the middle of the code shape's box, three's z is blender's -y)
    bx = A['box']; at = Vector(((bx['min'][0] + bx['max'][0]) / 2, -(bx['min'][2] + bx['max'][2]) / 2, 0))
    if COMP:   # (a companion flies: its middle on the code shape's middle)
        c.z = (V[:, 2].min() + V[:, 2].max()) / 2; at.z = (bx['min'][1] + bx['max'][1]) / 2 + FIX.get('lift', 0)
    o.data.transform(Matrix.Translation(at) @ Matrix.Scale(k, 4) @ Matrix.Translation(-c))
    if FIX.get('shift'): o.data.transform(Matrix.Translation(Vector(FIX['shift'])))   # (the box's middle is not the body's: the joey's tail curls off to one side)
    o.name = 'creature-' + KIND
    return o

def bvh_of(o): return BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get())

def joints(o):
    """the joints from the shape (blender frame: x right, -y forward, z up)"""
    if FIX.get('upright'): return upright_joints(o)
    V = np.array([v.co[:] for v in o.data.vertices]); bvh = bvh_of(o)
    H = V[:, 2].max(); y0, y1 = V[:, 1].min(), V[:, 1].max()
    J = {}
    # the belly: the lowest underside along the middle, between the legs
    under = []
    for t in np.linspace(.25, .75, 11):
        y = y0 + (y1 - y0) * t; loc, _, _, _ = bvh.ray_cast(Vector((0, y, -.5)), Vector((0, 0, 1)))
        if loc is not None and loc.z < H * .7: under.append(loc.z)
    belly = float(np.median(under)) if under else H * .3
    # the legs: everything below the belly, in four corners
    L = V[V[:, 2] < belly * .85]
    ymid = float(np.median(L[:, 1]))
    legs = {}
    for i, (sx, front) in enumerate(((1, True), (-1, True), (1, False), (-1, False))):   # (leg0 right front ... as the game's: x>0 front first)
        # three's x is blender's x; three's +z (front) is blender's -y
        sel = L[(np.sign(L[:, 0]) == sx) & ((L[:, 1] < ymid) == front)]
        foot = sel[sel[:, 2] < belly * .3]
        cx, cy = float(np.median(foot[:, 0])), float(np.median(foot[:, 1]))
        legs[i] = dict(x=cx, y=cy, front=front)
    fy = min(l['y'] for l in legs.values()); by = max(l['y'] for l in legs.values())
    # the back's top: over the back half (a big head overhangs the front half), the lowest of a few
    tops = []
    for t in np.linspace(.35, .9, 6):
        loc, _, _, _ = bvh.ray_cast(Vector((0, fy + (by - fy) * t, H * 2)), Vector((0, 0, -1)))
        if loc is not None: tops.append(loc.z)
    back = float(min(tops)) if tops else H * .55
    hip = belly + (back - belly) * .35
    for i, l in legs.items():
        J['leg%d' % i] = (l['x'], l['y'], hip)
        J['knee%d' % i] = (l['x'], l['y'], belly * .45)
    J['body'] = (0, 0, 0)
    # the neck: over the front legs, a little above the back's line
    J['head'] = (0, fy, back + (H - back) * .08)
    # the tail's root: the rearmost point above the hips, on the middle
    R = V[(V[:, 2] > hip) & (np.abs(V[:, 0]) < (V[:, 0].max() * .5))]
    r = R[R[:, 1] > R[:, 1].max() - (y1 - y0) * .06]
    J['tail'] = (0, float(r[:, 1].min()) - (y1 - y0) * .03, float(np.median(r[:, 2])))
    # the ears: the widest parts of the head, on each side, at the top of what hangs there
    Hd = V[(V[:, 2] > J['head'][2] - H * .1) & (V[:, 1] < J['head'][1] + (by - fy) * .3)]
    for i, sx in enumerate((-1, 1)):   # (ear0 left, ear1 right, as the game's)
        side = Hd[np.sign(Hd[:, 0]) == sx]
        out = side[np.abs(side[:, 0]) > np.abs(side[:, 0]).max() * .78]
        J['ear%d' % i] = (float(np.median(out[:, 0])) * .8, float(np.median(out[:, 1])), float(out[:, 2].max()) - H * .03)
    J.update({k: tuple(v) for k, v in FIX.get('joints', {}).items()})
    return J, dict(belly=belly, back=back, hip=hip, H=H, fy=fy, by=by)

def upright_joints(o):
    """an animal standing up on its hind feet (the joey): every joint set by hand in animal_joints/<kind>.json, read from
    ortho renders with a 10 cm grid (the four-leg finder looks for four leg columns and put the joints in the air); leg0/1
    are the arms (shoulder, knee = elbow), leg2/3 the hind legs (hip, knee = the hock, where the long foot starts)"""
    V = np.array([v.co[:] for v in o.data.vertices])
    J = {k: tuple(v) for k, v in FIX['joints'].items()}; J['body'] = (0, 0, 0)
    hip = J['leg2'][2]
    return J, dict(belly=FIX.get('belly', hip * .6), back=J['head'][2], hip=hip, H=float(V[:, 2].max()), fy=float(V[:, 1].min()), by=float(V[:, 1].max()))

def upright_W(V, J, M, names, ix):
    """an upright animal's weights: the head over its neck's plane, ears up from their roots, the tail behind and below its
    root (and its tip along the ground), the arms by their distance to the line from the shoulder to the paw (the forearm
    from the elbow down), the hind legs below the hips on each side of the middle (the foot below the hock); body the rest"""
    n = len(V); W = np.zeros((n, len(names))); X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
    hp = np.array(J['head']); nrm = np.array((0, -FIX.get('neck_tilt', .55), 1.0)); nrm /= np.linalg.norm(nrm)
    ns = FIX.get('neck_soft', .04); head = smooth01(((V - hp) @ nrm + ns * .375) / ns)
    head *= smooth01((hp[1] + (M['by'] - M['fy']) * FIX.get('head_back', .25) - Y) / .03)
    ear = np.zeros(n); ear_side = np.zeros(n, int)
    for i in (0, 1):
        ex, ey, ez = J['ear%d' % i]; side = np.sign(ex)
        e = smooth01((Z - ez) / .015) * smooth01((X * side - FIX.get('ear_mid', .04)) / .015) * (np.sign(X) == side)
        ear = np.maximum(ear, e); ear_side[e > 0] = i
    ear *= head > .5
    tx, ty, tz = J['tail']; tw = FIX.get('tail_w', .06)
    tail = smooth01((Y - ty + .01) / .03) * smooth01((tz + .03 - Z) / .04) * np.maximum(smooth01((tw - np.abs(X - tx)) / .02),
           smooth01((.08 - Z) / .02) * smooth01((Y - ty - .01) / .02))   # (near the middle, or its tip lying along the ground behind)
    w_head = head * (1 - ear); w_ear = head * ear; w_tail = tail * (1 - head)
    free = (1 - head) * (1 - w_tail); taken = w_head + w_ear + w_tail
    ar = FIX.get('arm_r', .035)
    for i in (0, 1):   # (the arms)
        s0 = np.array(J['leg%d' % i]); el = np.array(J['knee%d' % i]); paw = np.array(FIX['paw%d' % i])
        d = paw - s0; L2 = d @ d; t = np.clip(((V - s0) @ d) / L2, 0, 1); dist = np.linalg.norm(V - (s0 + t[:, None] * d), axis=1)
        a = smooth01((ar - dist) / .015 + .5) * free; te = ((el - s0) @ d) / L2; lo = smooth01((t - te) / .12 + .5)
        W[:, ix['leg%d' % i]] += a * (1 - lo); W[:, ix['knee%d' % i]] += a * lo; taken = taken + a; free = free * (1 - a)
    for i in (2, 3):   # (the hind legs)
        hx, hy, hz = J['leg%d' % i]; side = np.sign(hx); kz = J['knee%d' % i][2]
        h = smooth01((hz + .02 - Z) / FIX.get('hip_soft', .1)) * smooth01((X * side - FIX.get('leg_mid', .02)) / .03) * free
        lo = smooth01((kz + .04 - Z) / .06)
        W[:, ix['leg%d' % i]] += h * (1 - lo); W[:, ix['knee%d' % i]] += h * lo; taken = taken + h
    W[:, ix['head']] += w_head; W[:, ix['tail']] += w_tail
    for i in (0, 1): W[:, ix['ear%d' % i]] += w_ear * (ear_side == i)
    W[:, ix['body']] += np.clip(1 - taken, 0, 1)
    return W

def comp_joints(o):
    """a companion's joints (blender frame): the body at the middle, the head (the top or the front, as the animal is
    made), the wings and the tail from boxes in animal_joints/<kind>.json (fractions of the model's own box)"""
    V = np.array([v.co[:] for v in o.data.vertices]); lo, hi = V.min(0), V.max(0); sz = hi - lo
    at = lambda f: tuple(lo + sz * np.array(f))
    J = {'body': (0, 0, (lo[2] + hi[2]) / 2 * 0)}
    J['body'] = (0, 0, 0)
    J['head'] = at(FIX.get('head_at', (.5, .3, .62)))
    for i, k in enumerate(('wing0', 'wing1')):
        if 'wing_box' in FIX: b = FIX['wing_box']; x = (b[0][0] + b[1][0]) / 2; J[k] = at((x if i else 1 - x, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2)); J[k] = (J[k][0] * .6, J[k][1], J[k][2])
    if 'tail_at' in FIX: J['tail'] = at(FIX['tail_at'])
    M = dict(H=sz[2], belly=lo[2], hip=lo[2], back=hi[2], fy=lo[1], by=hi[1], lo=lo, hi=hi)
    return J, M

def comp_weights(o, J, M):
    """the head (above or in front of the neck), the wings and the tail (boxes, softly), the body the rest; welded at the
    picture's seams and smoothed as the animals' are"""
    V = np.array([v.co[:] for v in o.data.vertices]); n = len(V); lo, hi = M['lo'], M['hi']; sz = hi - lo
    U = (V - lo) / sz
    names = [b for b in ('body', 'head', 'wing0', 'wing1', 'tail') if b in J]; ix = {b: i for i, b in enumerate(names)}
    W = np.zeros((n, len(names)))
    def soft_box(b, w=.04):
        (x0, y0, z0), (x1, y1, z1) = b
        return smooth01((U[:, 0] - x0) / w + .5) * smooth01((x1 - U[:, 0]) / w + .5) * smooth01((U[:, 1] - y0) / w + .5) * smooth01((y1 - U[:, 1]) / w + .5) * smooth01((U[:, 2] - z0) / w + .5) * smooth01((z1 - U[:, 2]) / w + .5)
    head = soft_box(FIX.get('head_box', ((0, 0, .55), (1, .7, 1))))
    wing = np.zeros(n); side = np.zeros(n, int)
    if 'wing_box' in FIX:
        (x0, y0, z0), (x1, y1, z1) = FIX['wing_box']
        wr = soft_box(((x0, y0, z0), (x1, y1, z1))); wl = soft_box(((1 - x1, y0, z0), (1 - x0, y1, z1))); wing = np.maximum(wr, wl); side[wr >= wl] = 1   # (wing1 on +x)
    tail = soft_box(FIX['tail_box']) if 'tail_box' in FIX else np.zeros(n)
    w_wing = wing * (1 - head); w_tail = tail * (1 - head) * (1 - w_wing)
    W[:, ix['head']] = head; W[:, ix['body']] = np.clip(1 - head - w_wing - w_tail, 0, 1)
    for i, k in enumerate(('wing0', 'wing1')):
        if k in ix: W[:, ix[k]] = w_wing * (side == i)
    if 'tail' in ix: W[:, ix['tail']] = w_tail
    _, grp = np.unique(np.round(V / .0003).astype(np.int64), axis=0, return_inverse=True); grp = grp.ravel(); ng = grp.max() + 1
    S = np.zeros((ng, W.shape[1])); np.add.at(S, grp, W); cnt = np.bincount(grp, minlength=ng)[:, None]; Wg = S / np.maximum(1, cnt)
    adj = [set() for _ in range(ng)]
    for e in o.data.edges:
        a, b = grp[e.vertices[0]], grp[e.vertices[1]]
        if a != b: adj[a].add(b); adj[b].add(a)
    nb = [np.array(sorted(a), dtype=int) for a in adj]
    for _ in range(FIX.get('smooth', 3)): Wg = np.array([(Wg[i] + Wg[nb[i]].mean(0)) / 2 if len(nb[i]) else Wg[i] for i in range(ng)])
    W = Wg[grp]; W /= np.maximum(1e-6, W.sum(1, keepdims=True))
    for b in names:
        g = o.vertex_groups.new(name=b); col = W[:, ix[b]]
        for i in np.nonzero(col > .002)[0]: g.add([int(i)], float(col[i]), 'REPLACE')
    return names

def tail_sway(pose, name):
    """the companion's tail swings as it flies (world-creatures.py's companion moves have no tail)"""
    amp = {'fly': .35, 'follow': .45, 'flap': .6, 'cheer': .5, 'idle': .2, 'sad': .1, 'surprised': .3, 'sleep': .08}.get(name, .2)
    def f(t):
        P = pose(t)
        if 'tail' in P: P['tail'] = ((-.1, math.sin(t * math.pi * 2 / .9) * amp, 0), (0, 0, 0), (1, 1, 1))
        return P
    return f

def debug_picture(o, J, path):
    sc = bpy.context.scene
    for k, p in J.items():
        bpy.ops.mesh.primitive_uv_sphere_add(radius=.018, location=p); s = bpy.context.active_object; s.name = 'j-' + k; s.show_in_front = True
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'FLAT'; sc.display.shading.color_type = 'TEXTURE'
    sc.render.resolution_x = sc.render.resolution_y = 512; sc.render.film_transparent = False
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.4
    shots = []
    for nm, pos, rot in (('side', (2, 0, .45), (math.pi / 2, 0, math.pi / 2)), ('front', (0, -2, .45), (math.pi / 2, 0, 0)), ('top', (0, 0, 3), (0, 0, 0))):
        cam.location = pos; cam.rotation_euler = rot; f = path.replace('.png', f'-{nm}.png'); sc.render.filepath = f
        # spheres in red over the model (xray for the joints only)
        for s in [x for x in sc.objects if x.name.startswith('j-')]: s.color = (1, 0, 0, 1)
        bpy.ops.render.render(write_still=True); shots.append(f)
    for s in [x for x in sc.objects if x.name.startswith('j-')]: bpy.data.objects.remove(s)
    print('DEBUG', shots)

PARENT = {'body': None, 'head': 'body', 'wing0': 'body', 'wing1': 'body', 'ear0': 'head', 'ear1': 'head', 'tail': 'body', 'leg0': 'body', 'leg1': 'body', 'leg2': 'body', 'leg3': 'body',
          'knee0': 'leg0', 'knee1': 'leg1', 'knee2': 'leg2', 'knee3': 'leg3'}

def smooth01(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

def weights(o, J, M):
    """each point's bone weights, part by part: legs below the belly (the knee below its band), the tail behind, the
    head over the neck's plane, the ears beside the head; the body between, with soft blends at every border"""
    V = np.array([v.co[:] for v in o.data.vertices]); n = len(V)
    names = [b for b in PARENT if b in J]; ix = {b: i for i, b in enumerate(names)}
    W = np.zeros((n, len(names)))
    belly, hip, H = M['belly'], M['hip'], M['H']
    # the head: in front of and above the neck's plane (tilted forward), softly over 3 cm
    hp = np.array(J['head']); nrm = np.array((0, -FIX.get('neck_tilt', .55), 1.0)); nrm /= np.linalg.norm(nrm)   # (neck_tilt: how far the neck's plane leans forward; a panda's big round head sits on its body, its neck line rises only a little to the back: 0.31)
    ns = FIX.get('neck_soft', .04); head = smooth01(((V - hp) @ nrm + ns * .375) / ns)   # (neck_soft: how wide the head blends into the body; a panda's big head needs a wider neck, or the neck ring stretched when it turned)
    # (and not far behind the neck: a kitty's tall tail reaches above the neck's plane at the back, and its tip moved with the head)
    head *= smooth01((hp[1] + (M['by'] - M['fy']) * FIX.get('head_back', .25) - V[:, 1]) / .03)
    # the ears: on the head, out beyond the cheeks, below the ear's root
    ear = np.zeros(n); ear_side = np.zeros(n, int)
    for i in (0, 1):
        k = 'ear%d' % i
        if k not in J: continue
        ex, ey, ez = J[k]; side = np.sign(ex)
        if FIX.get('ear_up'):   # (ears that stand up (kitty, bunny, calf): above their root and off the middle; the hanging-ear rule took a kitty's wide cheeks as ears, and they stretched when the ears moved)
            e = smooth01((V[:, 2] - ez) / .015) * smooth01((V[:, 0] * side - FIX.get('ear_mid', .04)) / .015) * (np.sign(V[:, 0]) == side)
        else: e = smooth01((V[:, 0] * side - abs(ex) * FIX.get('ear_in', .98)) / .02) * smooth01((ez + .02 - V[:, 2]) / .03) * (np.sign(V[:, 0]) == side)
        ear = np.maximum(ear, e); ear_side[e > 0] = i
    ear *= head > .5
    # the tail: behind its root, above the hips
    tail = np.zeros(n)
    if 'tail' in J:
        # (behind its root, above it and near the middle: not the whole rump, which wagged with it)
        tx, ty, tz = J['tail']; tw = FIX.get('tail_w', .06)
        tail = smooth01((V[:, 1] - ty + .01) / .03) * smooth01((V[:, 2] - (tz - .02)) / .03) * smooth01((tw - np.abs(V[:, 0])) / .02)
        if FIX.get('tail_drop'):   # (a tail that hangs down (the calf's): also below its root, a little clear of the rump behind it)
            tail = np.maximum(tail, smooth01((V[:, 1] - ty - FIX.get('tail_gap', .02)) / .02) * smooth01((V[:, 2] - (tz - FIX['tail_drop'])) / .03) * smooth01((tw - np.abs(V[:, 0])) / .02))
    # the legs: below the belly fully, blended into the body up to the hips; each point to its nearest leg (seen from above)
    lx = np.array([[J['leg%d' % i][0], J['leg%d' % i][1]] for i in range(4)])
    d2 = ((V[:, None, :2] - lx[None]) ** 2).sum(-1); near = np.argmin(d2, 1); dist = np.sqrt(d2[np.arange(n), near])
    # how thick each leg is (its points below the belly, seen from above): the belly's fur between the legs is body
    rl = np.array([np.percentile(dist[(near == i) & (V[:, 2] < belly * .6)], 85) * 1.15 if ((near == i) & (V[:, 2] < belly * .6)).any() else .05 for i in range(4)])   # (an upright joey's arms have nothing below the belly: its own weights replace these)
    lt = FIX.get('leg_top', 1.0)   # (how high the leg's own weight reaches, as a fraction of the way from the belly to the hip)
    leg = (1 - smooth01((V[:, 2] - belly * .9) / max(.02, (belly * .1 + (hip - belly) * lt)))) * smooth01((rl[near] - dist) / .025 + .5)
    knee_z = np.array([J['knee%d' % i][2] for i in range(4)])[near]; band = np.maximum(.02, knee_z * .35)
    lower = smooth01((knee_z + band - V[:, 2]) / (2 * band))
    rest = 1.0
    w_tail = tail * (1 - head); w_head = head * (1 - ear); w_ear = head * ear
    w_leg = leg * (1 - head) * (1 - w_tail)
    w_body = np.clip(1 - w_tail - w_head - w_ear - w_leg, 0, 1)
    W[:, ix['body']] += w_body; W[:, ix['head']] += w_head
    if 'tail' in ix: W[:, ix['tail']] += w_tail
    for i in (0, 1):
        if 'ear%d' % i in ix: W[:, ix['ear%d' % i]] += w_ear * (ear_side == i)
    for i in range(4):
        m = near == i; W[m, ix['leg%d' % i]] += (w_leg * (1 - lower))[m]; W[m, ix['knee%d' % i]] += (w_leg * lower)[m]
    if FIX.get('upright'): W = upright_W(V, J, M, names, ix)
    # round the legs' tops, smooth in space too: Meshy's fur is many loose cards, and two cards side by side with different
    # weights pull apart when a leg turns far (the elbow's fur torn into strands while lying down)
    sr = FIX.get('spatial_r', 0)
    if sr:
        from mathutils.kdtree import KDTree
        kd = KDTree(n)
        for i, p in enumerate(V): kd.insert(p, i)
        kd.balance(); band = np.nonzero((V[:, 2] < hip + .04) & (V[:, 2] > belly * .5))[0]; W2 = W.copy()
        for i in band:
            nb_ = [j for _, j, _ in kd.find_range(V[i], sr)]
            if len(nb_) > 1: W2[i] = W[nb_].mean(0)
        W = W2
    # smooth over the surface a little (neighbours only: an ear lying on a cheek is not joined to it)
    # (the glTF import splits the surface at every seam of Meshy's picture, 6430 pieces on the puppy: points at the same
    # place are one point here, so a seam never opens when a leg or the head turns)
    _, grp = np.unique(np.round(V / .0003).astype(np.int64), axis=0, return_inverse=True); grp = grp.ravel(); ng = grp.max() + 1
    def weld(Wv):
        S = np.zeros((ng, Wv.shape[1])); np.add.at(S, grp, Wv); c = np.bincount(grp, minlength=ng)[:, None]
        return (S / np.maximum(1, c))[grp]
    W = weld(W)
    adj = [set() for _ in range(ng)]
    for e in o.data.edges:
        a, b = grp[e.vertices[0]], grp[e.vertices[1]]
        if a != b: adj[a].add(b); adj[b].add(a)
    nb = [np.array(sorted(a), dtype=int) for a in adj]
    Wg = weld(W)[np.unique(grp, return_index=True)[1]]   # (one row per welded point)
    for _ in range(FIX.get('smooth', 3)):
        Wg = np.array([(Wg[i] + Wg[nb[i]].mean(0)) / 2 if len(nb[i]) else Wg[i] for i in range(ng)])
    W = Wg[grp]
    W /= np.maximum(1e-6, W.sum(1, keepdims=True))
    for b in names:
        g = o.vertex_groups.new(name=b); col = W[:, ix[b]]
        for i in np.nonzero(col > .002)[0]: g.add([int(i)], float(col[i]), 'REPLACE')
    return names

def rig(o, J, M, names):
    size = max(o.dimensions)
    ad = bpy.data.armatures.new('rig'); arm = bpy.data.objects.new('rig', ad); bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for b in names + [k for k in J if k not in PARENT]:
        e = ad.edit_bones.new(b); h = Vector(J[b]); e.head = h; e.tail = h + Vector((0, 0, size * .08)); e.roll = 0; eb[b] = e
    for b, e in eb.items():
        p = PARENT.get(b, 'head')
        if p and p in eb: e.parent = eb[p]
    bpy.ops.object.mode_set(mode='OBJECT')
    o.parent = arm; md = o.modifiers.new('rig', 'ARMATURE'); md.object = arm
    return arm, size

def material(o, tex_px):
    """Meshy's painted picture only (no normal or roughness pictures: the game draws it by its own light), made smaller"""
    for m in o.data.materials:
        m.name = 'meshy-' + KIND
        nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
        for inp in ('Metallic', 'Roughness', 'Normal'):
            for l in list(bsdf.inputs[inp].links): nt.links.remove(l)
        for n in list(nt.nodes):
            if n.type == 'TEX_IMAGE' and n.image and not n.outputs['Color'].links or (n.type == 'TEX_IMAGE' and n.image and 'metallic' in n.image.name) or n.type == 'NORMAL_MAP': nt.nodes.remove(n)
        if FIX.get('repack', 0): repack(o, m, tex_px); continue
        for n in nt.nodes:
            if n.type == 'TEX_IMAGE' and n.image and n.image.size[0] > tex_px: n.image.scale(tex_px, tex_px)
        bsdf.inputs['Metallic'].default_value = 0; bsdf.inputs['Roughness'].default_value = 1
    if FIX.get('seam_inset', 0): seam_inset(o, FIX['seam_inset'] / tex_px)

def seam_inset(o, d):
    """(13 Nov 2026, owner: "sao nhiều vết trắng" on the panda's black fur) Meshy packs its picture's pieces edge to edge, a
    black piece touching a white one; the picture made smaller, and the game's own blending, mix the next piece's colour
    into the texels along every seam, and those showed as thin white lines. Each corner on a seam reads its colour a
    little inside its own piece (d, in picture units: about a texel and a half), towards its triangle's middle. The
    picture and the pieces stay as they are (a repack and bake broke the eyes into scattered bits)"""
    me = o.data; uv = me.uv_layers.active.data; co = [v.co for v in me.vertices]
    key = lambda vi: tuple(round(c, 5) for c in co[vi])
    edges = {}
    for p in me.polygons:
        n = len(p.loop_indices)
        for k in range(n):
            a, b = p.loop_indices[k], p.loop_indices[(k + 1) % n]; va, vb = me.loops[a].vertex_index, me.loops[b].vertex_index
            ka, kb = key(va), key(vb); e = (ka, kb) if ka < kb else (kb, ka)
            ua, ub = tuple(round(x, 6) for x in uv[a].uv), tuple(round(x, 6) for x in uv[b].uv)
            edges.setdefault(e, []).append((p.index, a, b, frozenset([(ka, ua), (kb, ub)])))
    seam = set()
    for e, L in edges.items():
        if len(L) != 2 or L[0][3] != L[1][3]: seam.update(x for f in L for x in (f[1], f[2]))
    # (corners at one place with one colour are one point of the packed model: they move together, the same way (towards
    # the middle of their triangles together), or each would become a point of its own and the model grew past 800 KB)
    grp = {}
    for p in me.polygons:
        ls = list(p.loop_indices); c = sum((uv[l].uv for l in ls), Vector((0, 0))) / len(ls)
        for l in ls:
            if l in seam: grp.setdefault((key(me.loops[l].vertex_index), tuple(round(x, 6) for x in uv[l].uv)), []).append((l, c - uv[l].uv))
    moved = 0
    for g, L_ in grp.items():
        v = sum((x[1] for x in L_), Vector((0, 0))) / len(L_); n_ = v.length
        if n_ < 1e-9: continue
        step = v * (min(d, min(x[1].length for x in L_) * .35) / n_)
        for l, _ in L_: uv[l].uv = uv[l].uv + step; moved += 1
    print('SEAM_INSET', KIND, len(seam), 'corners moved', moved, flush=True)

def repack(o, m, tex_px):
    """(13 Nov 2026, owner: "sao nhiều vết trắng" on the panda's black fur) Meshy packs its picture's pieces edge to edge,
    a black piece touching a white one with no gap, so when the game blurs or shrinks the picture (mipmaps, far away) the
    white of the next piece bleeds into the black one's edges: thin white lines along every seam. The pieces are packed
    again with a gap round each (the same pieces, same shapes) and the picture painted again onto them (a Cycles bake from
    the full-size picture), the colour spread past each piece's edge into the gap (bake margin)"""
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    src = next(n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.image and n.outputs['Color'].links)
    me = o.data; old = me.uv_layers.active.name
    new = me.uv_layers.new(name='packed'); me.uv_layers.active = new
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    # (the import leaves every triangle's points apart, so each triangle was its own piece: points at one place AND one
    # place in the picture are welded, so a piece is the picture's own island again. Not by place alone: Meshy's eyes are
    # layers lying on each other (the white, the iris), and a weld by place merged them and lost a layer: the eyes broke)
    import bmesh as _bm
    bm = _bm.from_edit_mesh(me); ul = bm.loops.layers.uv.active; seen = {}; tm = {}
    for v in bm.verts:
        if not v.link_loops: continue
        k = (round(v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5), round(v.link_loops[0][ul].uv.x, 6), round(v.link_loops[0][ul].uv.y, 6))
        if k in seen: tm[v] = seen[k]
        else: seen[k] = v
    _bm.ops.weld_verts(bm, targetmap=tm); _bm.update_edit_mesh(me)
    print('WELD', KIND, len(tm), flush=True)
    bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.seams_from_islands()
    bpy.ops.uv.pack_islands(rotate=False, margin=FIX.get('repack', .006)); bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new('meshy-%s-packed' % KIND, tex_px, tex_px, alpha=True); img.pixels[:] = np.tile(np.array((1., 0., 1., 0.), np.float32), tex_px * tex_px)   # (magenta, see-through: what the bake leaves untouched)
    uvo = nt.nodes.new('ShaderNodeUVMap'); uvo.uv_map = old; nt.links.new(uvo.outputs['UV'], src.inputs['Vector'])
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(src.outputs['Color'], em.inputs['Color'])
    outn = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); was = outn.inputs['Surface'].links[0].from_socket
    nt.links.new(em.outputs['Emission'], outn.inputs['Surface'])
    tgt = nt.nodes.new('ShaderNodeTexImage'); tgt.image = img
    for n in nt.nodes: n.select = False
    tgt.select = True; nt.nodes.active = tgt
    sc = bpy.context.scene; eng = sc.render.engine; sc.render.engine = 'CYCLES'; sc.cycles.samples = 1; sc.cycles.device = 'CPU'
    mods = [(md, md.show_viewport) for md in o.modifiers]
    for md, _ in mods: md.show_viewport = False   # (the rest shape: the rig's modifier off while baking)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.bake(type='EMIT', margin=FIX.get('repack_margin', 8), margin_type='EXTEND', use_clear=False)
    for md, v in mods: md.show_viewport = v
    sc.render.engine = eng
    # the material again: the new picture on the new pieces, the old ones gone
    nt.links.new(was, outn.inputs['Surface']); nt.nodes.remove(em); nt.nodes.remove(uvo)
    tgt.select = False; nt.links.new(tgt.outputs['Color'], bsdf.inputs['Base Color']); nt.nodes.remove(src)
    me.uv_layers.remove(me.uv_layers[old]); me.uv_layers.active = me.uv_layers['packed']; me.uv_layers['packed'].active_render = True
    # (the bake left the gaps black (its margin did not reach): each piece's edge colour spread out into the gaps here, so a
    # blurred or shrunk picture never mixes black into a white piece's edge or white into a black one)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(tex_px, tex_px, 4); have = ~((px[..., 0] > .99) & (px[..., 1] < .01) & (px[..., 2] > .99)); col = px[..., :3] * have[..., None]
    for _ in range(FIX.get('repack_grow', 24)):
        if have.all(): break
        s_ = np.zeros_like(col); c_ = np.zeros(have.shape, np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            s_ += np.roll(col, (dy, dx), (0, 1)); c_ += np.roll(have, (dy, dx), (0, 1))
        new = (~have) & (c_ > 0); col[new] = s_[new] / c_[new][:, None]; have = have | new
    px[..., :3] = col; px[..., 3] = 1; img.pixels[:] = px.ravel(); img.update()
    img.pack()
    bsdf.inputs['Metallic'].default_value = 0; bsdf.inputs['Roughness'].default_value = 1
    print('REPACK', KIND, tex_px, flush=True)

FARLOD = False
def make(path, J, M, out, tex_px):
    o = load(path)
    if COMP: return make_comp(o, J, M, out, tex_px)
    names = weights(o, J, M)
    arm, size = rig(o, J, M, names)
    A['hip'] = M['hip']
    for i, l in enumerate(A['legs']): l['front'] = J['leg%d' % i][1] < 0
    face_pieces(o, arm, J, Fc)
    material(o, tex_px)
    moves = wc.animal_moves(KIND, A, arm, names + FACE_BONES, F, size)
    moves = [(n_, L_, lie_down(p_, J, M) if n_ == 'sleep' and not FIX.get('upright') else p_) for n_, L_, p_ in moves]
    extra = (upright_moves if FIX.get('upright') else extra_moves)(J, M, names + FACE_BONES)   # (made for Meshy's own legs: not damped)
    own = {e[0] for e in extra}; moves = [m for m in moves if m[0] not in own]   # (an animal's own move of the same name replaces the code shape's: the joey's sleep)
    for name, L, pose in moves: ground(o, arm, wc.clip(arm, name, L, damp(pose)))
    for name, L, pose in extra: ground(o, arm, wc.clip(arm, name, L, pose))
    moves = moves + extra
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_lights=False,
                              export_cameras=False, export_apply=False, export_skins=True, export_morph=False, use_selection=False,
                              export_image_format='JPEG', export_jpeg_quality=FIX.get('jpeg', 80), export_force_sampling=True, export_frame_step=2)
    print('MADE', out, 'tris', sum(len(p.vertices) - 2 for p in o.data.polygons), 'bones', len(arm.data.bones), 'clips', ','.join(m[0] for m in moves), flush=True)
    return o, arm

def make_comp(o, J, M, out, tex_px):
    names = comp_weights(o, J, M)
    arm, size = rig(o, J, M, names)
    face_pieces(o, arm, J, Fc)
    material(o, tex_px)
    moves = wc.companion_moves(KIND, A, arm, names + FACE_BONES, F, size)
    for name, L, pose in moves: wc.clip(arm, name, L, tail_sway(pose, name))
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_lights=False,
                              export_cameras=False, export_apply=False, export_skins=True, export_morph=False, use_selection=False,
                              export_image_format='JPEG', export_jpeg_quality=FIX.get('jpeg', 80), export_force_sampling=True, export_frame_step=2)
    print('MADE', out, 'tris', sum(len(p.vertices) - 2 for p in o.data.polygons), 'bones', len(arm.data.bones), 'clips', ','.join(m[0] for m in moves), flush=True)
    return o, arm

def ground(o, arm, act):
    """no clip goes through the ground: at every frame where the model's lowest point is under it, the body is lifted just
    enough (the code shapes' moves were made for thin legs; Meshy's thick legs and long fur hang lower)"""
    fc = next((f for f in act.fcurves if f.data_path == 'pose.bones["body"].location' and f.array_index == 1), None)
    if fc is None: return act
    arm.animation_data.action = act; sc = bpy.context.scene; lifted = 0
    n = len(o.data.vertices); co = np.empty(n * 3, dtype=np.float32)
    for k in fc.keyframe_points:
        sc.frame_set(int(round(k.co[0]))); dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); m = oe.to_mesh()
        m.vertices.foreach_get('co', co); z = float((np.array(o.matrix_world) @ np.c_[co.reshape(-1, 3), np.ones(n)].T)[2].min()); oe.to_mesh_clear()
        if z < -.003: k.co[1] += -z + .002; k.handle_left[1] += -z + .002; k.handle_right[1] += -z + .002; lifted += 1
    arm.animation_data.action = None
    if lifted: print('GROUND', act.name, 'lifted', lifted, 'of', len(fc.keyframe_points), flush=True)
    return act

def damp(pose):
    """Meshy's legs are thick and its ears hang soft: the code shapes' swings, smaller (animal_joints: leg_amp, ear_amp)"""
    la, ea = FIX.get('leg_amp', .6), FIX.get('ear_amp', .45)
    def f(t):
        P = pose(t)
        for b, (r, l, s) in list(P.items()):
            k = la if b.startswith(('leg', 'knee')) else ea if b.startswith('ear') else 1
            if k != 1: P[b] = (tuple(x * k for x in r), l, s)
        return P
    return f

def lie_down(pose, J, M):
    """sleep for a Meshy animal: lying on its belly like a sphinx (the belly on the ground, the front legs stretched
    forward, the back legs tucked forward under it), not the code shapes' folded sticks, which went through the ground"""
    la = FIX.get('leg_amp', .6)
    def f(t):
        P = pose(t); r, l, s = P['body']
        P['body'] = (r, (0, -M['belly'] * FIX.get('lie_drop', .92), 0), s)
        for i in range(4):
            front = J['leg%d' % i][1] < 0
            P['leg%d' % i] = ((FIX.get('lie_front', -1.45) / la if front else FIX.get('lie_back', -1.3) / la, 0, 0), (0, 0, 0), (1, 1, 1))   # (divided by leg_amp: damp() scales it back)
            P['knee%d' % i] = ((FIX.get('lie_front_knee', 0) / la if front else FIX.get('lie_back_knee', .25) / la, 0, 0), (0, 0, 0), (1, 1, 1))
        return P
    return f

def extra_moves(J, M, bones):
    """the puppy's own moves (owner, 10 Nov 2026: run fast, jump and bounce, sit and beg, roll over and scratch, swim; dig
    and carry for its skills), in three's frame as world-creatures.py's: body x turn negative = nose up, head x positive =
    head down, a leg's x turn negative = forward, a knee's positive = the lower leg back, the tail's x negative = down;
    the body's place (x, up, forward). Each loops; ground() keeps it out of the ground"""
    TAU = math.pi * 2; H = M['H']; Z3 = (0, 0, 0); O3 = (1, 1, 1)
    front = [i for i in range(4) if J['leg%d' % i][1] < 0]; back = [i for i in range(4) if i not in front]
    ears = [b for b in bones if b.startswith('ear')] if FIX.get('ear_amp', 1) else []   # (ears kept still (the panda's, ear_amp 0) in these moves too: its ears' weights reach down the cheeks, which stretched when the ears swung in run and swim)
    def R(): return {b: (Z3, Z3, O3) for b in bones}
    def put(P, b, rx=0., ry=0., rz=0., loc=Z3):
        if b in P: P[b] = ((rx, ry, rz), loc, O3)
    def legs(P, i, a, k=0., cap=None, bp=0., level=None):
        if level is not None:   # (13 Nov 2026, owner: feet pointed or flattened into slabs when sitting, begging, digging: the lower leg laid flat on the ground (hock to toe), as a sitting cat or calf does, whatever the thigh and the body's tilt)
            k = max(-1.5, min(1.5, -(a + level) + k))
        elif cap is not None:   # (13 Nov 2026, owner: the feet turned pointed in run and jump. Looked at 2x: a front leg reaching forward with the knee straight pointed its hoof forward like a spike, a hind leg pushing back laid its hoof flat like a long slipper. The knee now turns against the hip, so the hoof stays near level under the leg, and folds less)
            k = k * .45 - (a + bp) * FIX.get('foot_level', 1.0); k = max(-cap, min(cap, k))   # (bp: the body's own pitch, so a hoof stays level when the body tips up or down in the jump)
        put(P, 'leg%d' % i, a); put(P, 'knee%d' % i, k)
    KC = FIX.get('knee_max', .95)   # (the most a knee turns in run, jump and the standing hop)
    def blink(t, times): return wc.blink(t, times)
    def run(t, carry=False):
        # (13 Nov 2026, owner: the neck and legs looked stiff in the run) the head bobs a beat behind the body instead of
        # staying level, the body stretches and gathers, each leg folds as it swings forward; ears and tail follow late
        L = .42; ph = TAU * t / L; P = R(); jl = FIX.get('jump_legs', 1.0)
        st = math.sin(ph)
        P['body'] = ((st * .15, 0, 0), (0, abs(math.sin(ph)) * .06 * H, 0), (1, 1 - .025 * math.cos(2 * ph), 1 + .03 * math.cos(2 * ph)))
        for n, i in enumerate(front): a = ph + n * .35; legs(P, i, math.sin(a) * .72 * jl, max(0, -math.cos(a)) * 1.45 * FIX.get('jump_knee', 1.0), cap=KC, bp=st * .15)
        for n, i in enumerate(back): a = ph + math.pi + n * .35; legs(P, i, math.sin(a) * .66 * jl, max(0, math.cos(a - math.pi)) * 1.05 * FIX.get('jump_knee', 1.0), cap=KC, bp=st * .15)
        put(P, 'head', -math.sin(ph - .7) * .14 + .04 * math.sin(2 * ph - 1) - (.18 if carry else 0), 0, math.sin(ph * .5) * .04)
        for k, e in enumerate(ears): put(P, e, -.5 + math.sin(2 * ph - 1.2 + k) * .3)
        put(P, 'tail', .35 + .15 * math.sin(ph - 1.4), math.sin(2 * ph - .8) * .3)
        face(P, None, eye=blink(t, (.9,)), smile=1.25, jaw=.25 if carry else .4)
        return P
    # (13 Nov 2026, owner after the films: "tất cả con vật khi nhảy đều nhìn quá cứng") the jump as poses one after another,
    # joined by a smooth curve through them: a crouch to gather, the push off with the body stretched and the nose up, the
    # back arched in the air with the hind legs tucked, the nose down as it comes in, the front legs reaching for the ground,
    # a squash on landing and a little settle; head, ears and tail come a beat behind the body (they were held still, and
    # the legs snapped from pose to pose, so it looked stiff)
    JK = [  # u,   up/H,  pitch,  front leg, front knee, back leg, back knee, head, tail, ears, squash
        (0.,   0.,    0.,    0.,   .05,   0.,   .05,  0.,   .05, 0.,   1.),
        (.2,  -.075,  .14,   .18,  .85,  -.3,   .95,  .08, -.05, .12,  .92),
        (.33,  .14,  -.22,  -.5,   .1,    .4,   .05,  .18,  .1, -.35, 1.06),   # (13 Nov: legs reach and push less: at full stretch the hooves turned to spikes and slippers)
        (.5,   .45,  -.04,  -.4,   .5,    .28,  .6,   .06,  .45, -.4,  1.),
        (.66,  .22,   .2,   -.32,  .05,   .15,  .25, -.12,  .4,  .05, 1.02),
        (.77, -.06,   .1,    .12,  .7,   -.22,  .75,  .12,  .15, .3,   .91),
        (.88,  .01,  -.03,   .02,  .15,   0.,   .2,  -.04,  .02, .08, 1.01),
        (1.,   0.,    0.,    0.,   .05,   0.,   .05,  0.,   .05, 0.,   1.)]
    def jump_at(u):
        k = max(0, min(len(JK) - 2, next((n for n in range(len(JK) - 1) if JK[n + 1][0] >= u), len(JK) - 2)))
        a = (u - JK[k][0]) / max(1e-6, JK[k + 1][0] - JK[k][0]); a = max(0., min(1., a))
        p0, p1, p2, p3 = JK[max(0, k - 1)], JK[k], JK[k + 1], JK[min(len(JK) - 1, k + 2)]
        return [.5 * (2 * p1[c] + (-p0[c] + p2[c]) * a + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * a * a + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * a ** 3) for c in range(1, 11)]   # (Catmull-Rom through the poses)
    def jump(t):
        L = 1.2; u = t / L; P = R()
        up, pitch, fl, fk, bl, bk, hd, tl, er, sq = jump_at(u)
        sp = FIX.get('jump_spring', 0.)   # (13 Nov 2026, owner: the bunny "khi nhảy bằng 4 chân nhìn hơi cứng": a springier leap for soft round-footed animals: the body stretches long in the air and squashes round on landing, the back arches more, the legs reach further, the ears stream behind)
        lag = jump_at(max(0., u - .06 - .05 * sp))   # (head, ears and tail a beat behind)
        air = max(0., up / .45); pitch *= 1 + .6 * sp; sq = 1 - (1 - sq) * (1 + 1.2 * sp)
        P['body'] = ((pitch, 0, 0), (0, up * H * (1 + .25 * sp), .08 * H * (1 + sp) * (1 - math.cos(math.pi * min(1, max(0, (u - .2) / .57)))) / 2),
                     (1 + (1 - sq) * .4 - .05 * sp * air, sq - .04 * sp * air, (1 + (1 - sq) * .4) * (1 + .16 * sp * air)))
        jl, jk = FIX.get('jump_legs', 1.0) * (1 + .7 * sp), FIX.get('jump_knee', 1.0)   # (a kitty's long thin legs: reaching out and folding less in the air, or its paws stretched)
        for i in front: legs(P, i, fl * jl, fk * jk, cap=KC, bp=pitch)
        for i in back: legs(P, i, bl * jl, bk * jk, cap=KC, bp=pitch)
        put(P, 'head', -lag[1] * .55 + hd); put(P, 'tail', .3 + lag[7], math.sin(TAU * t * 2) * .2)
        for e in ears: put(P, e, lag[8] * (1 + 1.2 * sp))
        air = .25 < u < .74
        face(P, None, big=1.1 if air else 1., smile=1.3, jaw=.6 if air else .15)   # (eyes wide in the air: a lid growing mid-leap showed the eye under it)
        return P
    def bounce(t):
        # (13 Nov 2026, owner: "bước nhảy đứng" still stiff) two happy hops in place, each the jump's own poses made smaller:
        # a crouch, the spring up, legs tucked in the air, a squash on landing; head, ears and tail a beat behind
        # (13 Nov 2026, owner again: "Bê mèo thỏ nhảy tại chỗ còn cứng quá") springier: higher, a deep crouch and a big
        # squash, the body stretched tall in the air, turning a little left then right hop by hop, the head, ears and tail
        # lagging further and overshooting (hop_spring, 1 by default)
        hs = FIX.get('hop_spring', 1.0)
        L = 1.6; p = (t % (L / 2)) / (L / 2); side = 1 if (t % L) < L / 2 else -1; P = R(); hop = max(0., jump_at(p)[0]) / .45
        up, pitch, fl, fk, bl, bk, hd, tl, er, sq = jump_at(p); lag = jump_at(max(0., p - .08 - .07 * hs))
        sq = 1 - (1 - sq) * (1 + 1.6 * hs); bp_ = pitch * (.45 + .45 * hs)
        jl, jk = FIX.get('jump_legs', 1.0) * (.8 + .3 * hs), FIX.get('jump_knee', 1.0)
        P['body'] = ((bp_, side * .14 * hs * hop, -side * .05 * hs * hop), (0, up * (.5 + .4 * hs) * H, 0),
                     (1 + (1 - sq) * .4 - .04 * hs * hop, sq + .07 * hs * hop, 1 + (1 - sq) * .4 - .04 * hs * hop))
        for i in front: legs(P, i, fl * jl * .7, fk * jk, cap=KC, bp=bp_)
        for i in back: legs(P, i, bl * jl * .7, bk * jk, cap=KC, bp=bp_)
        put(P, 'head', -lag[1] * (.4 + .3 * hs) + hd * .8, -side * .1 * hs * hop, math.sin(TAU * t / L) * .15)
        for e in ears: put(P, e, lag[8] * (1.2 + 1.3 * hs))
        put(P, 'tail', min(.45, .3 + lag[7] * (.6 + .3 * hs)), math.sin(TAU * t / L * 6) * .55)   # (a kitty's tall tail lifted further swung forward over its back)
        face(P, None, joy=True, smile=1.35, jaw=.5 + .3 * hop)
        return P
    def sitting(P, pitch=-.55):
        sf = FIX.get('sit_fold', 1.0)   # (13 Nov 2026, owner: the panda's hind feet looked dented when it sat up and begged: its short thick hind legs folded as far as the puppy's opened a jagged gap at the foot)
        bp_ = pitch * (.5 + .5 * sf); put(P, 'body', bp_, loc=(0, 0, -.06 * H))
        for i in back: legs(P, i, -1.1 * sf, 0., level=bp_)
        for i in front: legs(P, i, -pitch, 0)
        put(P, 'tail', -.45)
    def lying(P):   # (14 Nov 2026, a calf does not sit like a dog: it lies with all four legs folded under it (sit_lie), the head up)
        put(P, 'body', 0, loc=(0, -M['belly'] * FIX.get('lie_drop', .92), 0))
        for i in front: legs(P, i, FIX.get('lie_front', -1.45), FIX.get('lie_front_knee', 0))
        for i in back: legs(P, i, FIX.get('lie_back', -1.3), FIX.get('lie_back_knee', .25))
        put(P, 'tail', -.2)
    def sit(t):
        L = 6.; w = TAU / L; P = R()
        if FIX.get('sit_lie'):
            lying(P); put(P, 'head', -.1 + math.sin(2 * w * t) * .03, math.sin(w * t) * .4)
            for k, e in enumerate(ears): put(P, e, math.sin(2 * w * t + k) * .05)
            face(P, None, eye=blink(t, (1.4, 4.1)), smile=1.05, look=math.sin(w * t) * .15)
            return P
        sitting(P)
        put(P, 'head', .5 + math.sin(2 * w * t) * .03, math.sin(w * t) * .4)
        P['tail'] = ((-.45, math.sin(3 * w * t) * .25, 0), Z3, O3)
        for k, e in enumerate(ears): put(P, e, math.sin(2 * w * t + k) * .05)
        face(P, None, eye=blink(t, (1.4, 4.1)), smile=1.05, look=math.sin(w * t) * .15)
        return P
    def beg(t):
        bpt = FIX.get('beg_pitch', -1.0); L = 2.4; w = TAU / L; P = R()
        if FIX.get('beg_stand'): put(P, 'body', -.08)   # (14 Nov 2026: the calf begs standing, head up and nodding, its legs as they stand: sat back, its hooves showed flattened and long)
        else: sitting(P, bpt)   # (13 Nov 2026, owner circled the kitty's neck and hind legs begging: sat bolt upright its rump took the ground and its short hind legs hung in the air, the head bent down hard at the nape: beg_pitch, a lower sit)
        if FIX.get('beg_paws_down'):   # (13 Nov 2026: the calf's raised front hooves hung down as points; it begs sitting with its front hooves on the ground, the head up and nodding)
            put(P, 'head', -.6 * bpt - .35 + math.sin(2 * w * t) * .08, 0, math.sin(w * t) * .2)
            P['tail'] = ((-.4, math.sin(4 * w * t) * .4, 0), Z3, O3)
            for e in ears: put(P, e, .15 + math.sin(2 * w * t) * .1)
            face(P, None, eye=blink(t, (1.6,)), big=1.08, smile=1.2, jaw=.15)
            return P
        for n, i in enumerate(front): legs(P, i, .1 + math.sin(2 * w * t + n * math.pi) * .18, 1.35 * FIX.get('sit_fold', 1.0))   # (the raised front paws curl less on thin-legged animals: the calf's hooves hung down as points)
        put(P, 'head', -.6 * bpt + math.sin(w * t) * .05, 0, math.sin(w * t) * .18)
        P['tail'] = ((-.4, math.sin(4 * w * t) * .4, 0), Z3, O3)
        for e in ears: put(P, e, .15)
        face(P, None, eye=blink(t, (1.6,)), big=1.08, smile=1.2, jaw=.15)
        return P
    def roll(t):
        L = 3.; w = TAU / L; P = R(); wig = math.sin(2 * w * t)
        put(P, 'body', 0, 0, math.pi * .68 + wig * .12, loc=(0, -.1 * H, 0))   # (on its side and back, not upside down)
        for n, i in enumerate(front + back): legs(P, i, -.5 + math.sin(3 * w * t + n) * .2, .8 + math.sin(3 * w * t + n) * .2)
        hk = FIX.get('head_turn', 1.0); put(P, 'head', -.15 * hk, 0, (-1.0 + wig * .1) * hk); put(P, 'tail', 0, math.sin(4 * w * t) * .5)   # (the face turned up to the child; head_turn: less for a big head on a short neck (the panda's), whose neck stretched)
        for e in ears: put(P, e, .4)
        face(P, None, joy=True, smile=1.4, jaw=.55)
        return P
    def scratch(t):
        L = 2.; w = TAU / L; P = R(); sitting(P, -.5)
        sc = back[0] if back else 2
        if FIX.get('nuzzle_scratch'):   # (13 Nov 2026, owner: 'chân bị nhọn khi gãi': a calf does not scratch its ear with a hind hoof; lifted, its long thin shin showed as a dark stick or a point. It turns its head back and rubs its flank instead, the tail swishing)
            rub = math.sin(TAU * t * 2); put(P, 'body', -.25, -.12, .04)
            hk = FIX.get('head_turn', 1.0); put(P, 'head', .35 * hk, -1.0 * hk + rub * .1, .25 * hk + rub * .06)
            put(P, 'tail', -.2, math.sin(TAU * t * 3) * .6)
            for k, e in enumerate(ears): put(P, e, -.2 + rub * .1)
            face(P, None, eye=.35, smile=1.15, jaw=.1)
            return P
        sf = .5 + .5 * FIX.get('sit_fold', 1.0); legs(P, sc, -1.45 * sf + math.sin(TAU * t * 6) * .12, FIX.get('scratch_knee', 1.55 * sf) + math.sin(TAU * t * 6) * .2)   # (sit_fold: a thin-legged animal lifts and folds the leg less)
        hk = FIX.get('head_turn', 1.0); put(P, 'head', .35 * hk, -.12 * hk, .3 * hk + math.sin(TAU * t * 3) * .03)   # (and the head turned less far: it looked twisted round)
        face(P, None, eye=.35, smile=1.15, jaw=.1)
        return P
    def swim(t):
        L = 1.1; ph = TAU * t / L; P = R()
        put(P, 'body', math.sin(ph * 2) * .03)
        for n, i in enumerate(front): legs(P, i, -.45 + math.sin(ph + n * math.pi) * .55, max(0, math.cos(ph + n * math.pi)) * 1.0)
        for n, i in enumerate(back): legs(P, i, .2 + math.sin(ph + n * math.pi + 1) * .35, .3)
        put(P, 'head', -.3 + math.sin(ph * 2) * .04)
        for e in ears: put(P, e, -.35)
        put(P, 'tail', .05, math.sin(ph) * .2)
        face(P, None, eye=blink(t, (.6,)), smile=1.1)
        return P
    def dig(t):
        L = 1.2; ph = TAU * t / L * 2; P = R()
        put(P, 'body', .22, loc=(0, -.02 * H, .03 * H))
        for n, i in enumerate(front): legs(P, i, -.2 + math.sin(ph + n * math.pi) * .6, .4 + max(0, math.sin(ph + n * math.pi)) * .6)
        for i in back: legs(P, i, -.15, 0., level=.22)   # (the hind feet flat: the kitty's was dragged out behind)
        put(P, 'head', .35 + math.sin(ph) * .05)
        for e in ears: put(P, e, -.25)
        put(P, 'tail', .5, math.sin(ph * 1.5) * .5)
        face(P, None, eye=blink(t, (.5,)) * .8, smile=1.2, jaw=.2)
        return P
    return [('run', 1.26, run), ('carry', 1.26, lambda t: run(t, True)), ('jump', 1.2, jump), ('bounce', 1.6, bounce), ('sit', 6., sit),
            ('beg', 2.4, beg), ('roll', 3., roll), ('scratch', 2., scratch), ('swim', 1.1, swim), ('dig', 1.2, dig)]

def upright_moves(J, M, bones):
    """the pets' own moves for an animal standing on its hind feet (the joey): it hops on both feet with the arms tucked
    and the tail out behind, sits back on its tail, begs with its paws up, rolls on its side, scratches its ear with a paw,
    swims lying forward and digs bent over. Same names as extra_moves (the game asks for these clips); same frame"""
    TAU = math.pi * 2; H = M['H']; Z3 = (0, 0, 0); O3 = (1, 1, 1)
    arms, hind = (0, 1), (2, 3); ears = [b for b in bones if b.startswith('ear')]
    def R(): return {b: (Z3, Z3, O3) for b in bones}
    def put(P, b, rx=0., ry=0., rz=0., loc=Z3):
        if b in P: P[b] = ((rx, ry, rz), loc, O3)
    def legs(P, i, a, k=0.): put(P, 'leg%d' % i, a); put(P, 'knee%d' % i, k)
    def blink(t, times): return wc.blink(t, times)
    def hop(P, u, big=1.0, lean=.3):   # u 0..1 through one hop: crouch, push off, fly, land
        air = max(0, math.sin(u * TAU)); crouch = max(0, -math.sin(u * TAU))
        put(P, 'body', lean + .1 * air - .1 * crouch, loc=(0, air * .1 * H * big - crouch * .02 * H, 0))
        for i in hind: legs(P, i, .45 * air - .35 * crouch, -.2 * air + .5 * crouch)
        for i in arms: legs(P, i, -.5, -.5)
        put(P, 'tail', .15 + .25 * air, 0, 0)
        put(P, 'head', -lean * .7 - .05 * air)
        return air
    def run(t, carry=False):
        L = .45; P = R(); air = hop(P, (t / L) % 1, 1.0, .45)
        if carry: put(P, 'head', -.15)
        for k, e in enumerate(ears): put(P, e, -.35 - .2 * air)
        face(P, None, eye=blink(t, (.9,)), smile=1.25, jaw=.25 if carry else .4)
        return P
    def jump(t):
        L = 1.2; P = R(); u = t / L
        if u < .25: k = math.sin(u / .25 * math.pi / 2); up = -.03 * H * k; pitch = .2 * k; lg = -.4 * k; kn = .6 * k; ar = -.3
        elif u < .75: a = (u - .25) / .5; up = .3 * H * math.sin(a * math.pi); pitch = .15 - .3 * a; lg = .5; kn = -.2; ar = -1.0
        elif u < .9: k = 1 - (u - .75) / .15; up = -.03 * H * k; pitch = .15 * k; lg = -.35 * k; kn = .5 * k; ar = -.3
        else: up = pitch = lg = kn = 0; ar = -.3
        put(P, 'body', pitch, loc=(0, up, .06 * H * min(1, max(0, (u - .25) / .5))))
        for i in hind: legs(P, i, lg, kn)
        for i in arms: legs(P, i, ar, -.3)
        put(P, 'head', -pitch * .6); put(P, 'tail', .3 if .25 < u < .75 else .05)
        for e in ears: put(P, e, -.4 if .25 < u < .75 else 0)
        face(P, None, big=1.1 if .25 < u < .75 else 1., smile=1.3, jaw=.6 if .25 < u < .75 else .15)
        return P
    def bounce(t):
        L = 1.6; P = R(); hp_ = abs(math.sin(TAU * t / L * 2))
        put(P, 'body', -.05 * hp_, loc=(0, hp_ * .07 * H, 0))
        for i in hind: legs(P, i, .2 * hp_, -.1 * hp_)
        for i in arms: legs(P, i, -.6 - .5 * hp_, -.4)
        put(P, 'head', -.1 * hp_, 0, math.sin(TAU * t / L) * .15)
        for e in ears: put(P, e, -.3 * hp_)
        put(P, 'tail', .1 + .15 * hp_)
        face(P, None, joy=True, smile=1.35, jaw=.5 + .3 * hp_)
        return P
    def sitting(P, pitch=-.12):   # back on its tail: the body lower and leaning back, the hind legs folded forward, the tail flat behind
        put(P, 'body', pitch, loc=(0, -.07 * H, .02 * H))
        for i in hind: legs(P, i, -.55, .75)
        for i in arms: legs(P, i, -.25, -.35)
        put(P, 'tail', -.1)
    def sit(t):
        L = 6.; w = TAU / L; P = R(); sitting(P)
        put(P, 'head', .1 + math.sin(2 * w * t) * .03, math.sin(w * t) * .45)
        for k, e in enumerate(ears): put(P, e, math.sin(2 * w * t + k) * .08)
        face(P, None, eye=blink(t, (1.4, 4.1)), smile=1.05, look=math.sin(w * t) * .15)
        return P
    def beg(t):
        L = 2.4; w = TAU / L; P = R(); put(P, 'body', -.08, loc=(0, .01 * H, 0))
        for n, i in enumerate(arms): legs(P, i, -1.2 + math.sin(2 * w * t + n * math.pi) * .2, -.5)
        put(P, 'head', -.25 + math.sin(w * t) * .05, 0, math.sin(w * t) * .15)
        put(P, 'tail', 0, math.sin(2 * w * t) * .2)
        for e in ears: put(P, e, .1)
        face(P, None, eye=blink(t, (1.6,)), big=1.08, smile=1.2, jaw=.15)
        return P
    def roll(t):
        L = 3.; w = TAU / L; P = R(); wig = math.sin(2 * w * t)
        put(P, 'body', 0, 0, math.pi * .5 + wig * .1)   # (on its side; ground() lifts it out of the ground)
        for n, i in enumerate(hind): legs(P, i, -.5 + math.sin(3 * w * t + n) * .35, .4 + math.sin(3 * w * t + n) * .2)
        for n, i in enumerate(arms): legs(P, i, -.8 + math.sin(3 * w * t + n + 1) * .3, -.4)
        put(P, 'head', -.1, 0, -.6 + wig * .1); put(P, 'tail', 0, math.sin(4 * w * t) * .3)   # (the face turned up to the child)
        for e in ears: put(P, e, .3)
        face(P, None, joy=True, smile=1.4, jaw=.55)
        return P
    def scratch(t):
        L = 2.; P = R(); sitting(P)
        legs(P, 0, -1.5 + math.sin(TAU * t * 6) * .12, -1.3)   # (a paw up to its cheek; raised higher, the arm's fur stretched to the chin)
        put(P, 'head', .15, .15, -.35)
        face(P, None, eye=.35, smile=1.15, jaw=.1)
        return P
    def swim(t):
        L = 1.1; ph = TAU * t / L; P = R()
        put(P, 'body', .55 + math.sin(ph * 2) * .03)   # (leaning forward in the water, the head up: lying flat it looked like flying)
        for n, i in enumerate(hind): legs(P, i, .3 + math.sin(ph + n * math.pi) * .45, .2)
        for n, i in enumerate(arms): legs(P, i, -.9 + math.sin(ph + n * math.pi + 1) * .4, -.3)
        put(P, 'head', -.45 + math.sin(ph * 2) * .04)
        for e in ears: put(P, e, -.3)
        put(P, 'tail', -.3, math.sin(ph) * .25)
        face(P, None, eye=blink(t, (.6,)), smile=1.1)
        return P
    def dig(t):
        L = 1.2; ph = TAU * t / L * 2; P = R()
        put(P, 'body', .55, loc=(0, -.02 * H, 0))
        for n, i in enumerate(arms): legs(P, i, -.6 + math.sin(ph + n * math.pi) * .45, -.3 - max(0, math.sin(ph + n * math.pi)) * .5)
        for i in hind: legs(P, i, -.3, .35)
        put(P, 'head', .1 + math.sin(ph) * .05)
        for e in ears: put(P, e, -.25)
        put(P, 'tail', .3, math.sin(ph * 1.5) * .3)
        face(P, None, eye=blink(t, (.5,)) * .8, smile=1.2, jaw=.2)
        return P
    def sleep(t):   # lying on its side, curled a little, breathing slowly
        L = 4.; w = TAU / L; P = R(); b = math.sin(w * t)
        put(P, 'body', 0, 0, math.pi * .5, loc=(0, 0, 0)); P['body'] = (P['body'][0], Z3, (1 + b * .015, 1 + b * .03, 1 + b * .015))
        for i in hind: legs(P, i, -.6, .5)
        for i in arms: legs(P, i, -.5, -.6)
        put(P, 'head', .25, 0, -.35 + b * .02); put(P, 'tail', 0, .4)
        for e in ears: put(P, e, .45)
        face(P, None, shut=True, smile=.8)
        return P
    return [('sleep', 4., sleep), ('run', 1.35, run), ('carry', 1.35, lambda t: run(t, True)), ('jump', 1.2, jump), ('bounce', 1.6, bounce), ('sit', 6., sit),
            ('beg', 2.4, beg), ('roll', 3., roll), ('scratch', 2., scratch), ('swim', 1.1, swim), ('dig', 1.2, dig)]

# ---------- the face ----------
FACE_BONES = ['shut0', 'shut1', 'joy0', 'joy1', 'jaw']
def face(P, F_, eye=1.0, big=1.0, brow_y=0.0, brow_tilt=0.0, smile=1.0, frown=False, jaw=0.0, look=0.0, joy=False, shut=False):
    """world-creatures.py's face() for a painted face: shut eyes (sleep, blinks, a squint) show the "◡" lids, happy eyes
    the "^" lids, both hidden (shrunk into the eye) otherwise; the open mouth grows with the jaw"""
    tiny = (.001, .001, .001); one = (1, 1, 1)
    happy = joy and not shut; closed = shut or (not joy and eye < .45)
    for i in (0, 1):
        P['shut%d' % i] = ((0, 0, 0), (0, 0, 0), one if closed else tiny)
        P['joy%d' % i] = ((0, 0, 0), (0, 0, 0), one if happy else tiny)
    s = max(.001, jaw); P['jaw'] = ((0, 0, 0), (0, 0, 0), (s, s, s) if jaw > .05 else tiny)
wc.face = face   # (animal_moves calls the module's face)

def tex_of(o):
    m = o.data.materials[0]; n = next(n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE' and n.outputs['Color'].links)
    im = n.image; w, h = im.size; px = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, :, :3]
    return im, px   # (rows from the bottom, as Blender keeps them)

def sample(px, uv):
    h, w = px.shape[:2]; x = np.clip((uv[..., 0] % 1) * w, 0, w - 1).astype(int); y = np.clip((uv[..., 1] % 1) * h, 0, h - 1).astype(int)
    return px[y, x]

def find_face(o, J, M):
    """the painted eyes and nose, seen from the front: the dark round patches on the head (rays from the front)"""
    bvh = bvh_of(o); im, px = tex_of(o); uvl = o.data.uv_layers.active.data; me = o.data
    H = M['H']; hz = J['head'][2]; X = np.linspace(-.25, .25, 120); Z = np.linspace(hz - .05, H, 120)
    G = np.zeros((len(Z), len(X), 3)); P3 = np.full((len(Z), len(X), 3), np.nan)
    for a, z in enumerate(Z):
        for b, x in enumerate(X):
            loc, nor, fi, _ = bvh.ray_cast(Vector((x, -2, z)), Vector((0, 1, 0)))
            if loc is None or nor.y > -.15: continue
            poly = me.polygons[fi]; vs = [me.vertices[i].co for i in poly.vertices[:3]]
            from mathutils.geometry import barycentric_transform
            uvs = [uvl[li].uv for li in poly.loop_indices[:3]]
            u = barycentric_transform(loc, vs[0], vs[1], vs[2], Vector((*uvs[0], 0)), Vector((*uvs[1], 0)), Vector((*uvs[2], 0)))
            G[a, b] = sample(px, np.array([u.x, u.y])); P3[a, b] = loc[:]
    lum = G @ np.array([.3, .59, .11]); dark = (lum < FIX.get('eye_dark', .2)) & ~np.isnan(P3[..., 0])
    if DEBUG:   # (what the rays saw, and the dark parts in red)
        dbg = np.concatenate([G, np.ones(G.shape[:2] + (1,))], 2); dbg[dark] = (1, 0, 0, 1)
        di = bpy.data.images.new('facegrid', G.shape[1], G.shape[0]); di.pixels[:] = dbg.astype(np.float32).ravel()
        di.filepath_raw = os.path.join(OUT, KIND + '-facegrid.png'); di.file_format = 'PNG'; di.save()
        print('FACELUM', np.percentile(lum[~np.isnan(P3[..., 0])], [1, 5, 25, 50]).round(3).tolist(), flush=True)
    # the dark patches, joined (4-neighbours)
    lab = np.zeros(dark.shape, int); k = 0; comps = []
    for a in range(dark.shape[0]):
        for b in range(dark.shape[1]):
            if dark[a, b] and not lab[a, b]:
                k += 1; st = [(a, b)]; lab[a, b] = k; cells = []
                while st:
                    p, q = st.pop(); cells.append((p, q))
                    for dp, dq in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        u, v = p + dp, q + dq
                        if 0 <= u < dark.shape[0] and 0 <= v < dark.shape[1] and dark[u, v] and not lab[u, v]: lab[u, v] = k; st.append((u, v))
                pts = np.array([P3[p, q] for p, q in cells]); comps.append(dict(n=len(cells), c=pts.mean(0), pts=pts))
    comps = [c for c in comps if c['n'] >= 6]
    mids = [c for c in comps if abs(c['c'][0]) < .03]
    nose = min(mids, key=lambda c: c['c'][1]) if mids else None   # (the middle one farthest forward; the dragon has none)
    eyes = sorted((c for c in comps if .03 <= abs(c['c'][0]) <= FIX.get('eye_xmax', 1.0) and (nose is None or c['c'][2] > nose['c'][2])), key=lambda c: -c['n'])[:2]   # (eye_xmax: not the panda's black ears, which are bigger dark patches than its eye patches)
    eyes.sort(key=lambda c: c['c'][0])
    if nose is None:   # (no dark nose: a point on the face's middle below the eyes, a nose-sized one)
        ed = float(np.linalg.norm(eyes[0]['c'] - eyes[1]['c'])); mid = (eyes[0]['c'] + eyes[1]['c']) / 2
        loc, _, _, _ = bvh.ray_cast(Vector((mid[0], -2, mid[2] - ed * FIX.get('nose_drop', .45))), Vector((0, 1, 0)))
        nc = np.array(loc[:]) if loc is not None else mid - np.array((0, 0, ed * .45))
        nose = dict(c=nc, pts=np.array([nc + np.array((ed * .12, 0, 0)), nc - np.array((ed * .12, 0, 0))]))
    out = {'nose': nose['c'], 'nose_r': float(np.linalg.norm(nose['pts'] - nose['c'], axis=1).max())}
    for i, e in enumerate(eyes):
        out['eye%d' % i] = e['c']; out['eye%d_r' % i] = float(np.percentile(np.linalg.norm(e['pts'] - e['c'], axis=1), 95)) * FIX.get('eye_grow', 1.3)
    # the mouth: on the face under the nose, where the painted smile is
    loc, nor, _, _ = bvh.ray_cast(Vector((nose['c'][0], -2, nose['c'][2] - out['nose_r'] * FIX.get('mouth_drop', 2.0))), Vector((0, 1, 0)))
    if loc is not None: out['mouth'] = np.array(loc[:]); out['mouth_n'] = np.array(nor[:])
    return out

def face_pieces(o, arm, J, Fc):
    """the lids: the head's own surface over each eye (a little in front of it), with its own small picture: the
    painted fur round the eye filled in over the eye, and a lash line ("◡" shut, "^" happy); the open mouth: a soft
    dark oval with a tongue, just under the nose, sunk into the face while shut"""
    me = o.data; im, px = tex_of(o); uvl = me.uv_layers.active.data
    me.calc_loop_triangles()
    V = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices])
    bvh = bvh_of(o); TP = FIX.get('lid_px', 128)
    for i in (0, 1):
        c = np.array(Fc['eye%d' % i]); r = Fc['eye%d_r' % i]; R = r * FIX.get('lid_size', 2.4); Rx = R * FIX.get('lid_wide', 1.0)   # (lid_wide: an oval lid, wider than tall, over lashes that flick outwards)
        P = R * FIX.get('lid_pic', 1.0)   # (the picture's half size: bigger when the lid goes on the painted eye's own middle, lid_on_eye)
        tris = [t for t in me.loop_triangles if np.linalg.norm(V[list(t.vertices)].mean(0) - c) < R]
        if not tris: continue
        # the eye's own frame: out of the face (the patch's mean normal), sideways and up
        vi_all = sorted({vi for t in tris for vi in t.vertices}); nrm = N[vi_all].mean(0); nrm /= np.linalg.norm(nrm)
        side = np.cross((0, 0, 1.0), nrm); side /= np.linalg.norm(side); up = np.cross(nrm, side)
        # the picture: the face seen straight on over the eye (rays along -normal), TP x TP texels over 2P x 2P
        img0 = np.zeros((TP, TP, 3)); Pp = np.full((TP, TP, 3), np.nan)
        for a in range(TP):
            for b in range(TP):
                x = (b + .5) / TP * 2 * P - P; y = (a + .5) / TP * 2 * P - P
                frm = c + side * x + up * y + nrm * R
                loc, nor, fi, _ = bvh.ray_cast(Vector(frm), Vector(-nrm))
                if loc is None: continue
                poly = me.polygons[fi]; vs = [me.vertices[k].co for k in poly.vertices[:3]]; uvs3 = [uvl[li].uv for li in poly.loop_indices[:3]]
                from mathutils.geometry import barycentric_transform
                u = barycentric_transform(loc, vs[0], vs[1], vs[2], Vector((*uvs3[0], 0)), Vector((*uvs3[1], 0)), Vector((*uvs3[2], 0)))
                img0[a, b] = sample(px, np.array([u.x, u.y])); Pp[a, b] = loc[:]
        yy, xx = (np.mgrid[0:TP, 0:TP] + .5) / TP * 2 * P - P
        # the whole painted eye (white, outline, iris, lashes): joined to its middle through texels unlike the fur round it
        rr = np.hypot(xx, yy); hit = ~np.isnan(Pp[..., 0])
        ring = (rr > r * 1.5) & (rr < r * 2.1) & hit   # (the colour just round the eye: Sparkle's face is a peach mask on a navy head)
        fur = np.median(img0[ring if ring.sum() > 20 else ((rr > P * .8) & (rr < P) & hit)], 0)
        odd = (np.linalg.norm(img0 - fur, axis=2) > FIX.get('eye_odd', .16)) & hit & (rr < R * FIX.get('eye_reach', .9))   # (the painted eye is looked for this far from its found middle)
        eye = np.zeros((TP, TP), bool); st = [(a, b) for a in range(TP) for b in range(TP) if rr[a, b] < r * .5 and hit[a, b]]
        for a, b in st: eye[a, b] = True
        while st:
            a, b = st.pop()
            for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                u, v = a + da, b + db
                if 0 <= u < TP and 0 <= v < TP and odd[u, v] and not eye[u, v]: eye[u, v] = True; st.append((u, v))
        for _ in range(3): eye = eye | np.roll(eye, 1, 0) | np.roll(eye, -1, 0) | np.roll(eye, 1, 1) | np.roll(eye, -1, 1)   # (a little wider)
        inside = eye | (rr < r * 1.05); known = ~inside & hit
        ys, xs = np.nonzero(eye); ew = (xx[eye].max() - xx[eye].min()) / 2 if eye.any() else r; ecx = xx[eye].mean() if eye.any() else 0; ecy = yy[eye].mean() if eye.any() else 0
        print('EYE', i, 'width', round(float(ew), 4), 'centre off', round(float(ecx), 4), round(float(ecy), 4), flush=True)
        gx, gy = (float(ecx), float(ecy)) if FIX.get('lid_on_eye') else (0., 0.)   # (the lid's middle)
        gy += r * FIX.get('lid_up', 0)   # (raised over lashes that flick upwards)
        if FIX.get('lid_out') and abs(gx) > 1e-6: gx += math.copysign(r * FIX['lid_out'], gx)   # (moved further out, over lashes that flick outwards: the painted eye's middle lies outwards of the eye found)
        if FIX.get('lash_dark'):   # (painted lashes apart from the eye, under the lid: anything darker than this is filled as fur too)
            Lm = img0 @ np.array([.3, .59, .11]); dark = (Lm < FIX['lash_dark']) & hit & ((((xx - gx) / Rx) ** 2 + ((yy - gy) / R) ** 2) < 1.15)
            if FIX.get('lash_spot'):   # (lash tips: small warm specks a little darker than the face round them (a 7x7 mean), not the navy hair (bluer), not a smooth blush; they run along the hair's edge where the picture is squeezed to a texel or two)
                mL = sum(np.roll(Lm, (d0, d1), (0, 1)) for d0 in range(-3, 4) for d1 in range(-3, 4)) / 49
                dark |= (Lm < mL - FIX['lash_spot']) & (img0[..., 2] - img0[..., 0] < .02) & hit & ((((xx - gx) / Rx) ** 2 + ((yy - gy) / R) ** 2) < 1.15)
            for _ in range(2): dark = dark | np.roll(dark, 1, 0) | np.roll(dark, -1, 0) | np.roll(dark, 1, 1) | np.roll(dark, -1, 1)
            inside = inside | dark; known = ~inside & hit
        fill = img0.copy(); fill[~known] = img0[known].mean(0) if known.any() else .5
        if DEBUG:   # (what the lid covers: the painted face, the eye found (red) and the lid's own edge (green))
            dbg = img0.copy(); dbg[eye] = dbg[eye] * .5 + np.array((.5, 0, 0)); el = np.abs(np.hypot((xx - gx) / Rx, (yy - gy) / R) - 1) < 2 * P / TP / R; dbg[el] = (0, 1, 0)
            dim = bpy.data.images.new(f'src{i}', TP, TP); dim.pixels[:] = np.concatenate([dbg, np.ones((TP, TP, 1))], 2).astype(np.float32).ravel(); dim.filepath_raw = os.path.join(OUT, f'{KIND}-lidsrc{i}.png'); dim.file_format = 'PNG'; dim.save()
        # (fill_near: only the fur like the colour round the eye feeds the fill, so a peach face under navy hair shuts
        # with a peach lid, not a grey one mixed from both; the hair itself is kept as painted)
        src = known & (np.linalg.norm(img0 - fur, axis=2) < FIX['fill_near']) if FIX.get('fill_near') else known
        if FIX.get('fill_near'): fill[~src] = fur
        if DEBUG: dbg[inside & hit] = dbg[inside & hit] * .6 + np.array((0, 0, .4)); dim.pixels[:] = np.concatenate([dbg, np.ones((TP, TP, 1))], 2).astype(np.float32).ravel(); dim.save()   # (blue: what is filled)
        for _ in range(TP * 2):   # (fill the eye from the fur round it: neighbours' average, the fur kept)
            avg = (np.roll(fill, 1, 0) + np.roll(fill, -1, 0) + np.roll(fill, 1, 1) + np.roll(fill, -1, 1)) / 4
            fill = np.where(src[..., None], img0, avg)
        fill = np.where(known[..., None], img0, fill)
        if FIX.get('socket_lift', 0):   # (14 Nov 2026, owner's gate: "mặt, mắt, hốc mắt": Meshy paints a darker socket round the eye; open, the eye fills it, shut it showed as a dark bruise with a hard edge. Inside the lid, fur darker than the fur at the lid's rim is brought up towards it, fading out at the rim; lighter fur (the calf's cream blaze) is kept)
            ell = np.hypot((xx - gx) / Rx, (yy - gy) / R); Lf = fill @ np.array([.3, .59, .11])
            rim = hit & (ell > .85) & (ell < 1.0); Lt = float(np.median(Lf[rim])) if rim.any() else float(Lf.mean())
            k = 3; Lb = sum(np.roll(Lf, (d0, d1), (0, 1)) for d0 in range(-k, k + 1) for d1 in range(-k, k + 1)) / (2 * k + 1) ** 2
            tt = np.clip((1.02 - ell) / FIX.get('socket_fade', .5), 0, 1); tt = tt * tt * (3 - 2 * tt) * FIX['socket_lift']
            gain = np.where((Lb < Lt) | (FIX.get('socket_both', False) & (Lb < Lt * FIX.get('socket_both_max', 1.12))), 1 + tt * (Lt / np.maximum(Lb, 1e-3) - 1), 1.0)   # (socket_both: a lid lighter than the fur round it (the kitty's) brought down too; much lighter fur (a cream blaze) kept)
            fill = np.clip(fill * gain[..., None], 0, 1)
            # (and the edge of the eye's fill, a smooth disc in textured fur, softened: a few passes of a 3x3 blur on a band round it)
            band = (np.abs(ell - .75) < .12) & hit
            for _ in range(FIX.get('socket_soften', 3)):
                bl = sum(np.roll(fill, (d0, d1), (0, 1)) for d0 in (-1, 0, 1) for d1 in (-1, 0, 1)) / 9; fill = np.where(band[..., None], bl, fill)
        if FIX.get('socket_dark', 0):   # (14 Nov 2026, second reviewer: the panda's shut lid a brown-grey disc inside its black eye patch. Inside the lid, fur already darker than socket_dark is brought to the patch's own black (the darkest quarter of the dark fur at the lid's rim), fading out to the rim; the white face is left alone)
            ell = np.hypot((xx - gx) / Rx, (yy - gy) / R); Lf = fill @ np.array([.3, .59, .11])
            rimd = hit & (ell > .8) & (ell < 1.05) & (Lf < FIX['socket_dark'])
            if rimd.any():
                tgt = np.median(fill[rimd & (Lf <= np.percentile(Lf[rimd], 50))], 0)
                tt = np.clip((1.02 - ell) / .35, 0, 1); tt = tt * tt * (3 - 2 * tt) * smooth01((FIX['socket_dark'] - Lf) / .08)
                fill = fill * (1 - tt[..., None]) + tgt * tt[..., None]
        lash = np.array(FIX.get('lash', (.22, .14, .1)))
        for kind, curve in (('shut', lambda u: -.1 * r + .3 * r * (u / ew) ** 2), ('joy', lambda u: .1 * r - .45 * r * (u / ew) ** 2)):
            img = fill.copy()
            if os.environ.get("LID_DEBUG"): img[:] = (1, 0, 1)   # (debug: the lid painted magenta, to see what it covers in the game)
            px_ = 2 * P / TP; dl = np.abs((yy - ecy) - curve(xx - ecx)); de = np.abs(xx - ecx) - ew * .85
            a_ = np.clip((r * .09 - dl) / px_ + .5, 0, 1) * np.clip(-de / px_ + .5, 0, 1)   # (across the whole eye, at its middle; soft edges a texel wide, not stair steps)
            img = img * (1 - a_[..., None]) + lash * a_[..., None]
            name = f'meshy-{KIND}-{kind}{i}'
            pim = bpy.data.images.new(name, TP, TP); pim.pixels[:] = np.concatenate([img, np.ones((TP, TP, 1))], 2).astype(np.float32).ravel()
            pim.pack()
            if DEBUG: pim.filepath_raw = os.path.join(OUT, name + '.png'); pim.file_format = 'PNG'; pim.save()
            # the piece: a fine grid laid on the head's surface over the eye (rays along -normal), a little in front, its
            # picture straight on; no gaps (the head's own triangles, copied, showed the eye through cracks at their edges)
            bm = bmesh.new(); uvL = bm.loops.layers.uv.new('UVMap'); GN = FIX.get('lid_grid', 28) if not FARLOD else FIX.get('lid_grid_far', 20); grid = {}
            lift = FIX.get('lid_lift', .003); hits = {}; gnor = []
            for a in range(GN + 1):
                for b in range(GN + 1):
                    x = gx + (b / GN * 2 - 1) * Rx; y = gy + (a / GN * 2 - 1) * R
                    if math.hypot((x - gx) / Rx, (y - gy) / R) > 1.02: continue
                    loc, nor, _, dist = bvh.ray_cast(Vector(c + side * x + up * y + nrm * R), Vector(-nrm))
                    if loc is not None: hits[a, b] = (x, y, loc, nor, dist)
            if FIX.get('lid_spike'):   # (a point much nearer than the face round it lies on something sticking out (an antenna): left out, so the lid does not ride on it)
                for (a, b), h in list(hits.items()):
                    nb = [hits[a + i, b + j][4] for i in range(-3, 4) for j in range(-3, 4) if (a + i, b + j) in hits]
                    if h[4] < float(np.median(nb)) - FIX['lid_spike']: del hits[a, b]
            for (a, b), (x, y, loc, nor, _) in hits.items():
                if True:
                    k = 1 - smooth01((math.hypot((x - gx) / Rx, (y - gy) / R) - .82) / .18)   # (down to the surface at its rim)
                    off = (Vector(nrm) * (lift * k + .0004)) if not FIX.get("lid_rim") else (Vector(nrm) * lift * k + nor.normalized() * FIX["lid_rim"])   # (lid_rim: the rim held off the surface along the surface's own normal: where the head turns away the lid's flat squares dipped under it and its painted lashes showed through)
                    grid[a, b] = bm.verts.new(loc + off); gnor.append(nor.normalized())
            for a in range(GN):
                for b in range(GN):
                    q = [(a, b), (a, b + 1), (a + 1, b + 1), (a + 1, b)]
                    if not all(k in grid for k in q): continue
                    f = bm.faces.new([grid[k] for k in q])
                    for lp, (ga, gb) in zip(f.loops, q): lp[uvL].uv = ((gx + (gb / GN * 2 - 1) * Rx + P) / (2 * P), (gy + (ga / GN * 2 - 1) * R + P) / (2 * P))
            pm = bpy.data.meshes.new(name); bm.to_mesh(pm); bm.free()
            # (14 Nov 2026, the owner's gate boards at 1024 px: every shut lid showed as a darker patch with a hard edge, on
            # the calf across its cream blaze, on the puppy too: the piece was lit by its own flat grid's normals and a
            # rougher-shiny default material. It takes the head's surface normal at each point (smooth) and the body's
            # matte material, so it is lit as the face under it)
            if FIX.get('lid_head_normals', True):
                for poly in pm.polygons: poly.use_smooth = True
                try: pm.normals_split_custom_set_from_vertices([tuple(n_) for n_ in gnor])
                except Exception as e_: print('LIDNORMALS', e_, flush=True)
            po = bpy.data.objects.new(name, pm); bpy.context.collection.objects.link(po)
            mat = bpy.data.materials.new(name); mat.use_nodes = True; nt = mat.node_tree; tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = pim
            nt.links.new(tn.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color']); pm.materials.append(mat)
            nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = 1; nt.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0
            g = po.vertex_groups.new(name=f'{kind}{i}'); g.add(list(range(len(pm.vertices))), 1.0, 'REPLACE')
            po.parent = arm; md = po.modifiers.new('rig', 'ARMATURE'); md.object = arm
    # the open mouth (owner, 11 Nov 2026: "có thử khi há miệng chưa"): a piece laid on the muzzle's own surface, as the
    # lids are, with its own picture: the fur there as painted and an open mouth (dark red, a pink tongue below) in it.
    # Grown from its middle by the jaw bone. (A round piece set into the face stuck out of both cheeks from below.)
    nr = Fc['nose_r']
    if 'mouth' in Fc:
        c = np.array(Fc['mouth']); nrm = np.array(Fc['mouth_n']); nrm = nrm / np.linalg.norm(nrm)
        side = np.cross((0, 0, 1.0), nrm); side /= np.linalg.norm(side); up = np.cross(nrm, side)
        Wm = nr * FIX.get('mouth_w', 1.1); R = Wm * FIX.get('mouth_patch', 1.2); TP = FIX.get('mouth_px', 96); GN = FIX.get('mouth_grid', 18) if not FARLOD else 12   # (a small piece: a wide one reached where the face turns away and showed as a pale square; its own picture size and grid, not the lids')
        img = np.zeros((TP, TP, 3)); hit = np.zeros((TP, TP), bool)
        from mathutils.geometry import barycentric_transform
        for a in range(TP):
            for b in range(TP):
                x = (b + .5) / TP * 2 * R - R; y = (a + .5) / TP * 2 * R - R
                loc, nor_, fi, _ = bvh.ray_cast(Vector(c + side * x + up * y + nrm * R), Vector(-nrm))
                if loc is None: continue
                poly = me.polygons[fi]; vs = [me.vertices[k].co for k in poly.vertices[:3]]; uvs3 = [uvl[li].uv for li in poly.loop_indices[:3]]
                u = barycentric_transform(loc, vs[0], vs[1], vs[2], Vector((*uvs3[0], 0)), Vector((*uvs3[1], 0)), Vector((*uvs3[2], 0)))
                img[a, b] = sample(px, np.array([u.x, u.y])); hit[a, b] = True
        if hit.any(): img[~hit] = img[hit].mean(0)
        yy, xx = (np.mgrid[0:TP, 0:TP] + .5) / TP * 2 * R - R
        rx, ry = Wm * .85, Wm * .55; e = (xx / rx) ** 2 + (yy / ry) ** 2
        inside = np.clip((1 - e) / .12, 0, 1)[..., None]   # (a soft edge, two or three texels)
        mouth = np.where(((yy < -ry * .15) & ((xx / (rx * .7)) ** 2 + ((yy + ry * .55) / (ry * .55)) ** 2 < 1))[..., None], np.array((.95, .45, .5)), np.array((.22, .05, .07)))
        img = img * (1 - inside) + mouth * inside
        name = f'meshy-{KIND}-mouth'
        pim = bpy.data.images.new(name, TP, TP); pim.pixels[:] = np.concatenate([img, np.ones((TP, TP, 1))], 2).astype(np.float32).ravel(); pim.pack()
        if DEBUG: pim.filepath_raw = os.path.join(OUT, name + '.png'); pim.file_format = 'PNG'; pim.save()
        bm = bmesh.new(); uvL = bm.loops.layers.uv.new('UVMap'); grid = {}; lift = FIX.get('mouth_lift', .0025)
        for a in range(GN + 1):
            for b in range(GN + 1):
                x = b / GN * 2 * R - R; y = a / GN * 2 * R - R
                if math.hypot(x, y) > R * 1.02: continue
                loc, nor_, _, _ = bvh.ray_cast(Vector(c + side * x + up * y + nrm * R), Vector(-nrm))
                if loc is None: continue
                k = 1 - smooth01((math.hypot(x, y) / R - .82) / .18)
                grid[a, b] = bm.verts.new(loc + Vector(nrm) * (lift * k + .0004))
        for a in range(GN):
            for b in range(GN):
                q = [(a, b), (a, b + 1), (a + 1, b + 1), (a + 1, b)]
                if not all(k in grid for k in q): continue
                f = bm.faces.new([grid[k] for k in q])
                for lp, (ga, gb) in zip(f.loops, q): lp[uvL].uv = (gb / GN, ga / GN)
        pm = bpy.data.meshes.new(name); bm.to_mesh(pm); bm.free()
        po = bpy.data.objects.new(name, pm); bpy.context.collection.objects.link(po)
        mat = bpy.data.materials.new(name); mat.use_nodes = True; nt = mat.node_tree; tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = pim
        nt.links.new(tn.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color']); pm.materials.append(mat)
        g = po.vertex_groups.new(name='jaw'); g.add(list(range(len(pm.vertices))), 1.0, 'REPLACE')
        po.parent = arm; md = po.modifiers.new('rig', 'ARMATURE'); md.object = arm

F = {}
o = load(NEAR)
J, M = comp_joints(o) if COMP else joints(o)
Fc = find_face(o, J, M)
print('FACE', json.dumps({k: (np.round(v, 3).tolist() if hasattr(v, '__len__') else round(v, 4)) for k, v in Fc.items()}), flush=True)
for i in (0, 1):
    J['shut%d' % i] = J['joy%d' % i] = tuple(Fc['eye%d' % i])
if 'mouth' in Fc: J['jaw'] = tuple(Fc['mouth'])
print('JOINTS', json.dumps({k: [round(x, 3) for x in v] for k, v in J.items()}), json.dumps({k: (np.round(v, 3).tolist() if hasattr(v, '__len__') else round(float(v), 3)) for k, v in M.items()}), flush=True)
if DEBUG: debug_picture(o, J, os.path.join(OUT, KIND + '-joints.png'))
make(NEAR, J, M, os.path.join(OUT, f'creature-{KIND}-hd.glb'), FIX.get('tex_near', 1024))
if DEBUG: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, KIND + '-hd.blend'))
FARLOD = True   # (the far model: coarser lid pieces)
make(FAR, J, M, os.path.join(OUT, f'creature-{KIND}.glb'), FIX.get('tex_far', 512))

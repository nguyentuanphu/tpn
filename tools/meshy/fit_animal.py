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
A = SPEC['animals'][KIND]; A = dict(A, legs=[dict(l) for l in A['legs']])
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
    V = np.array([v.co[:] for v in o.data.vertices])
    want = FIX.get('height', A['box']['max'][1])
    k = want / (V[:, 2].max() - V[:, 2].min())
    c = Vector(((V[:, 0].min() + V[:, 0].max()) / 2, (V[:, 1].min() + V[:, 1].max()) / 2, V[:, 2].min()))
    # (where the game's animal stands: the middle of the code shape's box, three's z is blender's -y)
    bx = A['box']; at = Vector(((bx['min'][0] + bx['max'][0]) / 2, -(bx['min'][2] + bx['max'][2]) / 2, 0))
    o.data.transform(Matrix.Translation(at) @ Matrix.Scale(k, 4) @ Matrix.Translation(-c))
    o.name = 'creature-' + KIND
    return o

def bvh_of(o): return BVHTree.FromObject(o, bpy.context.evaluated_depsgraph_get())

def joints(o):
    """the joints from the shape (blender frame: x right, -y forward, z up)"""
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

PARENT = {'body': None, 'head': 'body', 'ear0': 'head', 'ear1': 'head', 'tail': 'body', 'leg0': 'body', 'leg1': 'body', 'leg2': 'body', 'leg3': 'body',
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
    hp = np.array(J['head']); nrm = np.array((0, -.55, 1.0)); nrm /= np.linalg.norm(nrm)
    head = smooth01(((V - hp) @ nrm + .015) / .04)
    # the ears: on the head, out beyond the cheeks, below the ear's root
    ear = np.zeros(n); ear_side = np.zeros(n, int)
    for i in (0, 1):
        k = 'ear%d' % i
        if k not in J: continue
        ex, ey, ez = J[k]; side = np.sign(ex)
        e = smooth01((V[:, 0] * side - abs(ex) * FIX.get('ear_in', .98)) / .02) * smooth01((ez + .02 - V[:, 2]) / .03) * (np.sign(V[:, 0]) == side)
        ear = np.maximum(ear, e); ear_side[e > 0] = i
    ear *= head > .5
    # the tail: behind its root, above the hips
    tail = np.zeros(n)
    if 'tail' in J:
        tx, ty, tz = J['tail']; tail = smooth01((V[:, 1] - ty + .01) / .03) * smooth01((V[:, 2] - (tz - .07)) / .03)
    # the legs: below the belly fully, blended into the body up to the hips; each point to its nearest leg (seen from above)
    lx = np.array([[J['leg%d' % i][0], J['leg%d' % i][1]] for i in range(4)])
    d2 = ((V[:, None, :2] - lx[None]) ** 2).sum(-1); near = np.argmin(d2, 1); dist = np.sqrt(d2[np.arange(n), near])
    # how thick each leg is (its points below the belly, seen from above): the belly's fur between the legs is body
    rl = np.array([np.percentile(dist[(near == i) & (V[:, 2] < belly * .6)], 85) * 1.15 for i in range(4)])
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
        for n in nt.nodes:
            if n.type == 'TEX_IMAGE' and n.image and n.image.size[0] > tex_px: n.image.scale(tex_px, tex_px)
        bsdf.inputs['Metallic'].default_value = 0; bsdf.inputs['Roughness'].default_value = 1

def make(path, J, M, out, tex_px):
    o = load(path)
    names = weights(o, J, M)
    arm, size = rig(o, J, M, names)
    A['hip'] = M['hip']
    for i, l in enumerate(A['legs']): l['front'] = J['leg%d' % i][1] < 0
    face_pieces(o, arm, J, Fc)
    material(o, tex_px)
    moves = wc.animal_moves(KIND, A, arm, names + FACE_BONES, F, size)
    moves = [(n_, L_, lie_down(p_, J, M) if n_ == 'sleep' else p_) for n_, L_, p_ in moves]
    for name, L, pose in moves: ground(o, arm, wc.clip(arm, name, L, damp(pose)))
    for pb in arm.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_lights=False,
                              export_cameras=False, export_apply=False, export_skins=True, export_morph=False, use_selection=False,
                              export_image_format='JPEG', export_jpeg_quality=88, export_force_sampling=True, export_frame_step=2)
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
    nose = min((c for c in comps if abs(c['c'][0]) < .03), key=lambda c: c['c'][1])   # (the middle one farthest forward)
    eyes = sorted((c for c in comps if abs(c['c'][0]) >= .03 and c['c'][2] > nose['c'][2]), key=lambda c: -c['n'])[:2]
    eyes.sort(key=lambda c: c['c'][0])
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
        c = np.array(Fc['eye%d' % i]); r = Fc['eye%d_r' % i]; R = r * FIX.get('lid_size', 2.4)
        tris = [t for t in me.loop_triangles if np.linalg.norm(V[list(t.vertices)].mean(0) - c) < R]
        if not tris: continue
        # the eye's own frame: out of the face (the patch's mean normal), sideways and up
        vi_all = sorted({vi for t in tris for vi in t.vertices}); nrm = N[vi_all].mean(0); nrm /= np.linalg.norm(nrm)
        side = np.cross((0, 0, 1.0), nrm); side /= np.linalg.norm(side); up = np.cross(nrm, side)
        # the picture: the face seen straight on over the eye (rays along -normal), TP x TP texels over 2R x 2R
        img0 = np.zeros((TP, TP, 3)); Pp = np.full((TP, TP, 3), np.nan)
        for a in range(TP):
            for b in range(TP):
                x = (b + .5) / TP * 2 * R - R; y = (a + .5) / TP * 2 * R - R
                frm = c + side * x + up * y + nrm * R
                loc, nor, fi, _ = bvh.ray_cast(Vector(frm), Vector(-nrm))
                if loc is None: continue
                poly = me.polygons[fi]; vs = [me.vertices[k].co for k in poly.vertices[:3]]; uvs3 = [uvl[li].uv for li in poly.loop_indices[:3]]
                from mathutils.geometry import barycentric_transform
                u = barycentric_transform(loc, vs[0], vs[1], vs[2], Vector((*uvs3[0], 0)), Vector((*uvs3[1], 0)), Vector((*uvs3[2], 0)))
                img0[a, b] = sample(px, np.array([u.x, u.y])); Pp[a, b] = loc[:]
        yy, xx = (np.mgrid[0:TP, 0:TP] + .5) / TP * 2 * R - R
        # the whole painted eye (white, outline, iris, lashes): joined to its middle through texels unlike the fur round it
        rr = np.hypot(xx, yy); hit = ~np.isnan(Pp[..., 0])
        fur = np.median(img0[(rr > R * .8) & (rr < R) & hit], 0)
        odd = (np.linalg.norm(img0 - fur, axis=2) > FIX.get('eye_odd', .16)) & hit & (rr < R * .9)
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
        fill = img0.copy(); fill[~known] = img0[known].mean(0) if known.any() else .5
        for _ in range(TP * 2):   # (fill the eye from the fur round it: neighbours' average, the fur kept)
            avg = (np.roll(fill, 1, 0) + np.roll(fill, -1, 0) + np.roll(fill, 1, 1) + np.roll(fill, -1, 1)) / 4
            fill = np.where(known[..., None], img0, avg)
        lash = np.array(FIX.get('lash', (.22, .14, .1)))
        for kind, curve in (('shut', lambda u: -.1 * r + .3 * r * (u / ew) ** 2), ('joy', lambda u: .1 * r - .45 * r * (u / ew) ** 2)):
            img = fill.copy()
            line = (np.abs((yy - ecy) - curve(xx - ecx)) < r * .09) & (np.abs(xx - ecx) < ew * .85)   # (across the whole eye, at its middle)
            img[line] = lash
            name = f'meshy-{KIND}-{kind}{i}'
            pim = bpy.data.images.new(name, TP, TP); pim.pixels[:] = np.concatenate([img, np.ones((TP, TP, 1))], 2).astype(np.float32).ravel()
            pim.pack()
            if DEBUG: pim.filepath_raw = os.path.join(OUT, name + '.png'); pim.file_format = 'PNG'; pim.save()
            # the piece: a fine grid laid on the head's surface over the eye (rays along -normal), a little in front, its
            # picture straight on; no gaps (the head's own triangles, copied, showed the eye through cracks at their edges)
            bm = bmesh.new(); uvL = bm.loops.layers.uv.new('UVMap'); GN = FIX.get('lid_grid', 28); grid = {}
            lift = FIX.get('lid_lift', .003)
            for a in range(GN + 1):
                for b in range(GN + 1):
                    x = b / GN * 2 * R - R; y = a / GN * 2 * R - R
                    if math.hypot(x, y) > R * 1.02: continue
                    loc, nor, _, _ = bvh.ray_cast(Vector(c + side * x + up * y + nrm * R), Vector(-nrm))
                    if loc is None: continue
                    k = 1 - smooth01((math.hypot(x, y) / R - .82) / .18)   # (down to the surface at its rim)
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
            g = po.vertex_groups.new(name=f'{kind}{i}'); g.add(list(range(len(pm.vertices))), 1.0, 'REPLACE')
            po.parent = arm; md = po.modifiers.new('rig', 'ARMATURE'); md.object = arm
    # the open mouth: under the nose, where the painted smile is
    nr = Fc['nose_r']
    if 'mouth' in Fc:
        loc, nor = Vector(Fc['mouth']), Vector(Fc['mouth_n'])
        Wm = nr * FIX.get('mouth_w', 1.1)
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=1)
        col = bm.loops.layers.color.new('Col')
        for f in bm.faces:
            for lp in f.loops:
                p = lp.vert.co; lp[col] = (.95, .45, .5, 1) if (p.z < -.35 and p.y < -.2) else (.22, .05, .07, 1)
        bmesh.ops.scale(bm, vec=(Wm, Wm * .5, Wm * .75), verts=bm.verts)
        bmesh.ops.translate(bm, vec=loc + nor * -.002, verts=bm.verts)   # (its middle a little inside: only the front shows)
        pm = bpy.data.meshes.new('mouth'); bm.to_mesh(pm); bm.free()
        po = bpy.data.objects.new('mouth', pm); bpy.context.collection.objects.link(po)
        mat = bpy.data.materials.new('felt'); mat.use_nodes = True; nt = mat.node_tree; ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
        nt.links.new(ca.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color']); pm.materials.append(mat)
        pm.color_attributes.active_color = pm.color_attributes['Col']
        g = po.vertex_groups.new(name='jaw'); g.add(list(range(len(pm.vertices))), 1.0, 'REPLACE')
        po.parent = arm; md = po.modifiers.new('rig', 'ARMATURE'); md.object = arm

F = {}
o = load(NEAR)
J, M = joints(o)
Fc = find_face(o, J, M)
print('FACE', json.dumps({k: (np.round(v, 3).tolist() if hasattr(v, '__len__') else round(v, 4)) for k, v in Fc.items()}), flush=True)
for i in (0, 1):
    J['shut%d' % i] = J['joy%d' % i] = tuple(Fc['eye%d' % i])
if 'mouth' in Fc: J['jaw'] = tuple(Fc['mouth'])
print('JOINTS', json.dumps({k: [round(x, 3) for x in v] for k, v in J.items()}), json.dumps({k: round(v, 3) for k, v in M.items()}), flush=True)
if DEBUG: debug_picture(o, J, os.path.join(OUT, KIND + '-joints.png'))
make(NEAR, J, M, os.path.join(OUT, f'creature-{KIND}-hd.glb'), FIX.get('tex_near', 1024))
if DEBUG: bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, KIND + '-hd.blend'))
make(FAR, J, M, os.path.join(OUT, f'creature-{KIND}.glb'), FIX.get('tex_far', 512))

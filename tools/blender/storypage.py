# Draw one story page (or a film's frames) in Blender from an exported in-game film scene (round v1.08c, blender helper).
#   blender -b -P tools/blender/storypage.py -- <scene.json> <out.png | out dir for frames> kit=<dir of costume .blend files> [res=960x540] [samples=24] [engine=cycles|eevee] [frames]
# frames: every frame of a page exported with scene-export.mts fps=12, for an animated film; each actor is its own copy
# with its skeleton (the .blend files made with lumi.py ... rig), moving and changing face as in the game's film.
# (owner, 5 Nov 2026 AEDT: the animated films are rendered later on a machine with a graphics card, engine=eevee)
# The sets, props and animals are the game film's own shapes (vertex colours, re-lit here with soft felt light); the people
# are the costume kit's characters (tools/blender/costumes.py, saved as villager-kit-<id>-<size>.blend by lumi.py).
# The camera, the sky and the time of day are the game film's. Our own art; nothing downloaded.
import sys; sys.dont_write_bytecode = True
import os, json, math, base64, array
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler
from svkit import reset, hexc

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
opt = dict(a.split('=', 1) for a in argv[2:] if '=' in a)
KITDIR = opt.get('kit', '/tmp/kitblend'); W, Hh = map(int, opt.get('res', '960x540').split('x')); SAMPLES = int(opt.get('samples', 24))
FRAMES = 'frames' in argv; ENGINE = opt.get('engine', 'cycles')
D = json.load(open(SRC))
scene = reset()
Y2Z = Matrix.Rotation(math.pi / 2, 4, 'X')   # three.js is y-up, Blender z-up
def m4(e): return Y2Z @ Matrix([[e[0], e[4], e[8], e[12]], [e[1], e[5], e[9], e[13]], [e[2], e[6], e[10], e[14]], [e[3], e[7], e[11], e[15]]])
def v3(p): return Y2Z @ Vector(p)
def f32(s): a = array.array('f'); a.frombytes(base64.b64decode(s)); return a
def u32(s): a = array.array('I'); a.frombytes(base64.b64decode(s)); return a

# ---------- materials: soft felt light on the game's colours ----------
def felt_vc(emit=False, alpha=1.0):
    m = bpy.data.materials.new('vc' + ('E' if emit else '') + str(alpha)); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    at = nt.nodes.new('ShaderNodeVertexColor'); at.layer_name = 'Col'; nt.links.new(at.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = .78; b.inputs['Sheen Weight'].default_value = .6; b.inputs['Sheen Roughness'].default_value = .45
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 90; nz.inputs['Detail'].default_value = 4
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .08; nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    if emit: nt.links.new(at.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 2.5
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    return m
MATS = {}
def vcmat(emit, alpha):
    k = (emit, round(alpha, 2))
    if k not in MATS: MATS[k] = felt_vc(emit, k[1])
    return MATS[k]

OBJS = []
for i, ms in enumerate(D['meshes']):
    pos = f32(ms['pos']); n = len(pos) // 3
    idx = u32(ms['idx']) if ms.get('idx') else None
    me = bpy.data.meshes.new('m%d' % i); verts = [(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]) for j in range(n)]
    faces = [(idx[j], idx[j + 1], idx[j + 2]) for j in range(0, len(idx) - 2, 3)] if idx else [(j, j + 1, j + 2) for j in range(0, n - 2, 3)]
    me.from_pydata(verts, [], faces); me.update()
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    if ms.get('col'):
        c = f32(ms['col']); sz = ms['size'] or 3
        for j in range(n): ca.data[j].color = (c[j * sz], c[j * sz + 1], c[j * sz + 2], 1)
    else:
        cc = hexc(ms['color'])
        for j in range(n): ca.data[j].color = cc
    o = bpy.data.objects.new('m%d' % i, me); scene.collection.objects.link(o); o.data.materials.append(vcmat(ms['emit'], ms.get('opacity', 1)))
    o.matrix_world = m4(ms['m'][0]); OBJS.append(o)
    if ms['emit']: o.visible_shadow = False

# ---------- the people: the costume kit's characters, one master copy each, placed by collection instances ----------
KIT_H = {'kid': 1.6, 'adult': 2.0, 'elder': 1.8}
FRIENDS = ('finn', 'clara', 'sol', 'lumi')
def kit_master(kit):
    name = 'KIT-' + kit
    if name in bpy.data.collections: return bpy.data.collections[name]
    pre = f'{kit}-game' if kit in FRIENDS else f'villager-kit-{kit}-'   # the four friends (lumi.py <who> game) or a costume of the kit
    path = next((os.path.join(KITDIR, f) for f in sorted(os.listdir(KITDIR)) if f.startswith(pre) and f.endswith('.blend')), None) if os.path.isdir(KITDIR) else None
    if not path: return None
    # (the head and ears sit outside the character's collections, at the top of its scene)
    # (faces with feeling) every face of the character comes too: each actor shows the face of its moment (kit_face)
    with bpy.data.libraries.load(path, link=False) as (src, dst): dst.collections = list(src.collections); dst.objects = [o for o in src.objects if o.split('.')[0] in ('head', 'ear')]
    # a character in a page is small in the picture: its smoothing steps are kept low, so a page with many people fits in memory
    for c in dst.collections:
        for o in (c.all_objects if c else []):
            for md in o.modifiers:
                if md.type == 'SUBSURF': md.levels = 0; md.render_levels = min(md.render_levels, int(opt.get('smooth', 0)))
    master = bpy.data.collections.new(name)
    for o in dst.objects:
        if o is not None and not o.users_collection: master.objects.link(o)
    FACES[name] = {}
    for c in dst.collections:
        if c is None or c.name.startswith('hands-grip'): continue
        if c.name.split('.')[0].startswith('face-'): FACES[name][c.name.split('.')[0][5:]] = c; continue
        if any(c.name in [x.name for x in o.children] for o in dst.collections if o is not None and o is not c): continue   # (a child of another loaded collection)
        master.children.link(c)
    head = next((o for o in dst.objects if o is not None and o.name.split('.')[0] == 'head'), None)
    if head:   # where the head is (for the tears): its box in the character's own space
        bb = [head.matrix_world @ Vector(c) for c in head.bound_box]; HEADS[name] = (Vector([min(v[i] for v in bb) for i in range(3)]), Vector([max(v[i] for v in bb) for i in range(3)]))
    return master
FACES, HEADS = {}, {}
def kit_face(kit, want):
    """the character with one face: its body (the master) and the face collection of that mood, as one collection to instance"""
    master = kit_master(kit)
    if master is None: return None
    fs = FACES.get(master.name, {}); want = want if want in fs else 'smile' if 'smile' in fs else next(iter(fs), None)
    name = f'{master.name}-{want}'
    if name in bpy.data.collections: return bpy.data.collections[name]
    c = bpy.data.collections.new(name); c.children.link(master)
    if want: fs[want].hide_render = False; fs[want].hide_viewport = False; c.children.link(fs[want])
    return c
HOLD = bpy.data.collections.new('kit-masters'); scene.collection.children.link(HOLD)
lc = bpy.context.view_layer.layer_collection.children['kit-masters']; lc.exclude = False; HOLD.hide_render = True; HOLD.hide_viewport = True
def kit_copy(kit):
    """(frames) a whole copy of a character for one actor: its own skeleton and all its faces, so each actor moves on its own"""
    pre = f'{kit}-game' if kit in FRIENDS else f'villager-kit-{kit}-'
    path = next((os.path.join(KITDIR, f) for f in sorted(os.listdir(KITDIR)) if f.startswith(pre) and f.endswith('.blend')), None) if os.path.isdir(KITDIR) else None
    if not path: return None
    with bpy.data.libraries.load(path, link=False) as (src, dst): dst.collections = [c for c in src.collections if not c.startswith('hands-grip')]; dst.objects = [o for o in src.objects if o == 'rig' or o.split('.')[0] in ('head', 'ear')]
    e = bpy.data.objects.new('actor-' + kit, None); scene.collection.objects.link(e); faces = {}
    # many people on a page (rongtien's children: 8 on screen) fill an 8 GB graphics card with full copies, and it swaps
    # (17 s a frame instead of 1): with more than crowd=<n> people (5) each copy is drawn with smooth=<k> smoothing steps (0)
    if sum(1 for a in D['actors'] if a.get('kit')) > int(opt.get('crowd', 5)):
        for c in dst.collections:
            for o in (c.all_objects if c else []):
                for md in o.modifiers:
                    if md.type == 'SUBSURF': md.levels = 0; md.render_levels = min(md.render_levels, int(opt.get('smooth', 0)))
    for c in dst.collections:
        if c is None: continue
        scene.collection.children.link(c)
        if c.name.split('.')[0].startswith('face-'): faces[c.name.split('.')[0][5:]] = c
        for o in c.objects:
            if o.parent is None: o.parent = e
    for o in dst.objects:
        if o is not None and o.name != 'rig' and not o.name.startswith('rig.'):
            if not o.users_collection: scene.collection.objects.link(o)
            if o.parent is None: o.parent = e
    rig = next((o for o in dst.objects if o is not None and o.name.split('.')[0] == 'rig'), None)
    if rig:
        if not rig.users_collection: scene.collection.objects.link(rig)
        if rig.parent is None: rig.parent = e
    # (hiding an actor) a parent's hide_render does not hide its children in Blender: the actor's own collections and loose
    # objects are hidden instead (an actor who is not on stage yet, e.g. the children inside rongtien's egg, was drawn anyway)
    own = [c for c in dst.collections if c is not None and not c.name.split('.')[0].startswith('face-')]
    loose = [o for o in dst.objects if o is not None and not o.name.startswith('rig')]
    return e, faces, rig, own, loose
# the game film's moods to the character's faces (the v1.08e faces: smile, blink, happy, curious, surprised, sad, shy,
# excited, half, lookL, lookR); crying is the sad face with tears, sly the curious one
FACE_OF = {'smile': 'smile', 'happy': 'happy', 'sad': 'sad', 'o': 'surprised', 'sleep': 'blink', 'surprised': 'surprised', 'curious': 'curious', 'shy': 'shy',
           'excited': 'excited', 'cry': 'sad', 'sly': 'curious', 'blink': 'blink', 'half': 'half', 'lookL': 'lookL', 'lookR': 'lookR'}
def face_of(a, k=0):
    """the face of an actor in a picture: its mood's face; quiet and smiling, its eyes go to the speaker"""
    mood = a.get('mood'); mood = (mood[k] if k < len(mood) else mood[-1]) if isinstance(mood, list) else (mood or 'smile')
    if mood == 'smile' and a.get('eyes'): return a['eyes']
    return FACE_OF.get(mood, 'smile')
TEAR = None
def tears(e, kit):
    """two small tears on the cheeks of a crying actor (a child of the actor, in the character's own space)"""
    global TEAR
    hb = HEADS.get('KIT-' + kit)
    if not hb: return
    if TEAR is None:
        TEAR = bpy.data.materials.new('tear'); TEAR.use_nodes = True; b = TEAR.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (.55, .8, 1, 1); b.inputs['Roughness'].default_value = .05; b.inputs['Emission Color'].default_value = (.5, .75, 1, 1); b.inputs['Emission Strength'].default_value = .4
    lo, hi = hb; c = (lo + hi) / 2; r = (hi.x - lo.x) / 2
    for sx in (-1, 1):
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1)
        for v in bm.verts: v.co.z *= 1.5 if v.co.z < 0 else 1.0   # a drop: rounder on top, longer below
        me = bpy.data.meshes.new('tear'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('tear', me); me.materials.append(TEAR)
        o.location = (c.x + sx * .36 * r, lo.y + .1 * r, c.z - .28 * r); o.scale = (.06 * r, .05 * r, .09 * r); o.parent = e; scene.collection.objects.link(o)
FPS = max(1, D.get('fps', 12))
# (frames) a soft blink every 2 to 6 s for each actor, at their own moments, when the game's film gave none (its blink needs
# the v1.08e soft faces, js/film.ts SOFT); not with the eyes already closed
import random
def blink_frames(i, a):
    moods = a.get('mood') if isinstance(a.get('mood'), list) else []
    if any(m in ('blink', 'half') for m in moods): return set()
    rnd = random.Random(7919 * (i + 1)); s = set(); t = rnd.uniform(.6, 3.0); n = len(a['m'])
    while t * FPS < n: f = int(t * FPS); s.update((f, f + 1)); t += rnd.uniform(2, 6)
    return s
BLINKS = [blink_frames(i, a) for i, a in enumerate(D['actors'])] if FRAMES else []
OPEN_EYES = ('smile', 'surprised', 'sad', 'curious', 'excited', 'shy', 'lookL', 'lookR')
# (frames) the moves are read from the character's actions and set on its bones by hand each frame (no frame_set), so the
# whole page renders as one animation and Eevee keeps the scene loaded between frames (about 0.3 s a frame instead of 20)
ACT_KEYS = {}
def act_keys(act):
    if act.name not in ACT_KEYS:
        ks = []
        for fc in act.fcurves:
            if '.' not in fc.data_path: continue
            own, attr = fc.data_path.rsplit('.', 1); ks.append((own, attr, fc.array_index, fc))
        ACT_KEYS[act.name] = ks
    return ACT_KEYS[act.name]
def pose_at(rig, act, f):
    for own, attr, j, fc in act_keys(act):
        try: o = rig.path_resolve(own)
        except Exception: continue
        v = fc.evaluate(f); cur = getattr(o, attr)
        try: cur[j] = v
        except TypeError: setattr(o, attr, v)
LOOK = {}
def at_k(arr, k, dflt):
    return arr[min(k, len(arr) - 1)] if isinstance(arr, list) and arr else dflt
def look_pass(k):
    """(frames) each actor turns its head (up to about 40 degrees) towards whoever is speaking now, easing in and out"""
    A = D['actors']
    spk = next((j for j, a in enumerate(A) if ACTORS[j] is not None and at_k(a.get('talk'), k, 0) and at_k(a.get('state'), k, 'idle') != 'hidden'), None)
    for i, a in enumerate(A):
        if ACTORS[i] is None: continue
        cp = COPIES[len([x for x in ACTORS[:i] if x is not None])]
        if not cp or not cp[2]: continue
        rig = cp[2]; hb = rig.pose.bones.get('head')
        if hb is None: continue
        want = 0.0
        if spk is not None and spk != i:
            m, s = a['m'][min(k, len(a['m']) - 1)], A[spk]['m'][min(k, len(A[spk]['m']) - 1)]
            yaw = math.atan2(m[8], m[10]); to = math.atan2(s[12] - m[12], s[14] - m[14])
            rel = (to - yaw + math.pi) % (2 * math.pi) - math.pi
            want = max(-.7, min(.7, rel)) if abs(rel) < 2.4 else 0.0   # someone right behind: no owl turns
        LOOK[i] = LOOK.get(i, 0.0) + (want - LOOK.get(i, 0.0)) * .3
        if not POSED.get(i): hb.rotation_euler = (0, 0, 0)
        r = list(hb.rotation_euler); r[HEAD_AXIS] += LOOK[i] * HEAD_SIGN; hb.rotation_euler = r
HEAD_AXIS, HEAD_SIGN = int(opt.get('headaxis', 1)), float(opt.get('headsign', 1))
ACT_OF = {'walk': 'walk', 'wave': 'wave', 'cheer': 'cheer', 'dance': 'cheer', 'sit': 'sit', 'ride': 'ride', 'sitground': 'sit'}
COPIES = []
ACTORS = []
for a in D['actors']:
    kit = a.get('kit'); col = kit_master(kit) if kit else None
    if col is None: ACTORS.append(None); continue
    if col.name not in [c.name for c in HOLD.children]: HOLD.children.link(col)
    size = 'kid' if kit in ('vn-yem', 'vn-boy') + FRIENDS else 'adult'
    if FRAMES and (cp := kit_copy(kit)): e = cp[0]; COPIES.append(cp)
    else:
        e = bpy.data.objects.new('actor-' + kit, None); e.instance_type = 'COLLECTION'; e.instance_collection = kit_face(kit, face_of(a)) or col; scene.collection.objects.link(e); COPIES.append(None)
        if (a.get('mood') if isinstance(a.get('mood'), str) else '') == 'cry': tears(e, kit)
    ACTORS.append((e, 1.6 / KIT_H[size]))
def place_actor(i, k):
    if ACTORS[i] is None: return
    e, ks = ACTORS[i]; k = min(k, len(D['actors'][i]['m']) - 1); M = m4(D['actors'][i]['m'][k]); loc, rot, sc = M.decompose()
    e3 = D['actors'][i]['m'][k]; yaw = math.atan2(e3[8], e3[10]); st = D['actors'][i]['state'][k] if D['actors'][i]['state'] else 'idle'
    if not FRAMES and D.get('cams'):
        # (faces with feeling) a story picture shows faces: someone with their back to the camera turns to three-quarter
        # (at most 55 degrees from the camera), so their feeling can be seen; the films (frames) keep the game's turns
        cp = v3(D['cams'][0][0]); tx, ty = cp.x - loc.x, cp.y - loc.y; fx, fy = math.sin(yaw), -math.cos(yaw)
        a = math.atan2(fx * ty - fy * tx, fx * tx + fy * ty); lim = math.radians(55)
        if abs(a) > lim: yaw += math.copysign(abs(a) - lim, a)
    e.location = loc; e.rotation_euler = (0, 0, yaw); e.scale = (sc.x * ks,) * 3
    e.hide_render = st == 'hidden'
    cp = COPIES[len([x for x in ACTORS[:i] if x is not None])] if FRAMES and i < len(ACTORS) and ACTORS[i] is not None else None
    if cp:   # (frames) the face and the move of this frame
        faces, rig = cp[1], cp[2]; want = face_of(D['actors'][i], k); gone = st == 'hidden'
        if HID.get(i) != gone:
            HID[i] = gone
            for c in cp[3]: c.hide_render = gone
            for o in cp[4]: o.hide_render = gone
        # the kit has no half-closed or sideways-eyes faces (lumi.py): a half blink shows closed, so a blink caught at 12 frames a
        # second is seen; the eyes' turn to the speaker is the head's turn (look_pass)
        if want not in faces: want = 'blink' if want == 'half' and 'blink' in faces else 'smile' if 'smile' in faces else want
        if want in OPEN_EYES and k in BLINKS[i] and 'blink' in faces: want = 'blink'
        for n, c in faces.items():
            h = gone or n != want
            if c.hide_render != h: c.hide_render = h
        POSED[i] = False
        if rig:
            if rig.animation_data and rig.animation_data.action: rig.animation_data.action = None   # posed by hand below
            act = bpy.data.actions.get(ACT_OF.get(st, 'idle')) or bpy.data.actions.get('idle')
            if act: pose_at(rig, act, int(k * 24 / FPS) % int(act.frame_range[1]) + 1); POSED[i] = True
    if st == 'lie': e.rotation_euler = (-math.pi / 2, 0, yaw); e.location.z += .15
    elif st in ('sitground', 'situp', 'kneel', 'dig', 'plant', 'pick'): e.location.z -= .35 * sc.x
POSED = {}
HID = {}
for i in range(len(ACTORS)): place_actor(i, 0)
if FRAMES: look_pass(0)

# ---------- sky, light and distance by the story's time of day ----------
top, bottom = D['sky']; T, Bc = hexc(top), hexc(bottom)
lum = .3 * T[0] + .59 * T[1] + .11 * T[2]; night = lum < .05; warm = max(0, min(1, (Bc[0] - Bc[2]) * 3))
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True; nt = world.node_tree; bgn = nt.nodes['Background']
tc = nt.nodes.new('ShaderNodeTexCoord'); sx = nt.nodes.new('ShaderNodeSeparateXYZ'); mr = nt.nodes.new('ShaderNodeMapRange'); mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
mr.inputs['From Min'].default_value = -.05; mr.inputs['From Max'].default_value = .55
nt.links.new(tc.outputs['Generated'], sx.inputs[0]); nt.links.new(sx.outputs['Z'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], mix.inputs['Factor'])
mix.inputs['A'].default_value = Bc; mix.inputs['B'].default_value = T; nt.links.new(mix.outputs['Result'], bgn.inputs['Color'])
LIGHT = float(opt.get('light', .82))   # (6 Nov 2026 AEDT, owner: "looks quite bright": the sky and the lights a little lower, so whites keep their colour)
bgn.inputs['Strength'].default_value = (.35 if night else 1.0) * LIGHT
sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = (.6 if night else 3.2) * LIGHT; sd.angle = math.radians(8)
sd.color = (.7, .78, 1.0) if night else tuple(hexc('#fff3e2')[i] * (1 - warm * .5) + hexc('#ffc184')[i] * warm * .5 for i in range(3))
so = bpy.data.objects.new('sun', sd); scene.collection.objects.link(so); so.rotation_euler = (Vector((0, 0, 0)) - v3((30, 50, 25))).to_track_quat('-Z', 'Y').to_euler()
fd = bpy.data.lights.new('fill', 'SUN'); fd.energy = (.25 if night else .9) * LIGHT; fd.color = hexc('#fff6e4')[:3]; fd.angle = math.radians(30)
fo = bpy.data.objects.new('fill', fd); scene.collection.objects.link(fo); fo.rotation_euler = (Vector((0, 0, 0)) - v3((-12, 16, 25))).to_track_quat('-Z', 'Y').to_euler()

# a soft light from the camera, with no shadow, so faces under big hair and hats stay bright (as in the studio pictures)
kd = bpy.data.lights.new('camfill', 'SUN'); kd.energy = (.35 if night else 1.3) * LIGHT; kd.use_shadow = False; kd.color = hexc('#fff4e6')[:3]
ko = bpy.data.objects.new('camfill', kd); scene.collection.objects.link(ko)
cd = bpy.data.cameras.new('cam'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(D.get('fov', 42)); cd.clip_start = .1; cd.clip_end = 600
cam = bpy.data.objects.new('cam', cd); scene.collection.objects.link(cam); scene.camera = cam
def place_cam(k):
    p, l = D['cams'][k]; cam.location = v3(p); cam.rotation_euler = (v3(l) - v3(p)).to_track_quat('-Z', 'Y').to_euler()
    ko.rotation_euler = (v3(l) - v3(p)).to_track_quat('-Z', 'Y').to_euler()
    cd.dof.use_dof = True; cd.dof.focus_distance = (v3(l) - v3(p)).length; cd.dof.aperture_fstop = 5.6
place_cam(0)

scene.render.resolution_x, scene.render.resolution_y = W, Hh
if ENGINE == 'eevee':
    scene.render.engine = 'BLENDER_EEVEE_NEXT'; scene.eevee.taa_render_samples = SAMPLES; scene.eevee.use_shadows = True
else:
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True; scene.cycles.max_bounces = 4
scene.view_settings.view_transform = opt.get('view', 'Standard'); scene.view_settings.look = opt.get('look', 'None').replace('_', ' '); scene.view_settings.exposure = float(opt.get('exposure', 0))
# distance: the far land fades into the sky's bottom colour (the game's fog)
bpy.context.view_layer.use_pass_mist = True; scene.world.mist_settings.start = 40; scene.world.mist_settings.depth = 220
scene.use_nodes = True; ct = scene.node_tree; ct.nodes.clear()
rl = ct.nodes.new('CompositorNodeRLayers'); mx = ct.nodes.new('CompositorNodeMixRGB'); mx.inputs[2].default_value = Bc
gl = ct.nodes.new('CompositorNodeGlare'); gl.glare_type = 'FOG_GLOW'; gl.threshold = .95; gl.size = 6; gl.mix = -.6
cp = ct.nodes.new('CompositorNodeComposite')
ct.links.new(rl.outputs['Mist'], mx.inputs[0]); ct.links.new(rl.outputs['Image'], mx.inputs[1]); ct.links.new(mx.outputs['Image'], gl.inputs['Image']); ct.links.new(gl.outputs['Image'], cp.inputs['Image'])

if not FRAMES:
    scene.render.filepath = OUT; bpy.ops.render.render(write_still=True)
else:
    os.makedirs(OUT, exist_ok=True)
    # range=a-b: only those frames (a quick look before a long render)
    ra = [int(x) for x in opt['range'].split('-')] if 'range' in opt else [0, len(D['cams']) - 1]
    def set_frame(k):
        for i, o in enumerate(OBJS):
            ms = D['meshes'][i]; r = k - ms.get('from', 0)
            o.hide_render = r < 0 or r >= len(ms['m']) or (ms.get('vis') and not ms['vis'][min(r, len(ms['vis']) - 1)])
            if 0 <= r < len(ms['m']): o.matrix_world = m4(ms['m'][r])
        for i in range(len(ACTORS)): place_actor(i, k)
        look_pass(k)
        place_cam(k)
    for k in range(ra[0]): set_frame(k)   # (so the head turns ease in from the page's start)
    def on_frame(sc, *_): set_frame(sc.frame_current)
    bpy.app.handlers.frame_change_pre.append(on_frame)
    scene.frame_start, scene.frame_end = ra[0], ra[1]; scene.render.fps = int(FPS)
    scene.render.image_settings.file_format = 'PNG'; scene.render.filepath = os.path.join(OUT, 'f#####')
    bpy.ops.render.render(animation=True)

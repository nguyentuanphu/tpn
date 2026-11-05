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
    with bpy.data.libraries.load(path, link=False) as (src, dst): dst.collections = [c for c in src.collections if not c.startswith('face-') or c == 'face-smile']; dst.objects = [o for o in src.objects if o.split('.')[0] in ('head', 'ear')]
    # a character in a page is small in the picture: its smoothing steps are kept low, so a page with many people fits in memory
    for c in dst.collections:
        for o in (c.all_objects if c else []):
            for md in o.modifiers:
                if md.type == 'SUBSURF': md.levels = 0; md.render_levels = min(md.render_levels, int(opt.get('smooth', 0)))
    master = bpy.data.collections.new(name)
    for o in dst.objects:
        if o is not None and not o.users_collection: master.objects.link(o)
    for c in dst.collections:
        if c is None or c.name.startswith('hands-grip'): continue
        master.children.link(c)
    return master
HOLD = bpy.data.collections.new('kit-masters'); scene.collection.children.link(HOLD)
lc = bpy.context.view_layer.layer_collection.children['kit-masters']; lc.exclude = False; HOLD.hide_render = True; HOLD.hide_viewport = True
def kit_copy(kit):
    """(frames) a whole copy of a character for one actor: its own skeleton and all its faces, so each actor moves on its own"""
    pre = f'{kit}-game' if kit in FRIENDS else f'villager-kit-{kit}-'
    path = next((os.path.join(KITDIR, f) for f in sorted(os.listdir(KITDIR)) if f.startswith(pre) and f.endswith('.blend')), None) if os.path.isdir(KITDIR) else None
    if not path: return None
    with bpy.data.libraries.load(path, link=False) as (src, dst): dst.collections = [c for c in src.collections if not c.startswith('hands-grip')]; dst.objects = [o for o in src.objects if o == 'rig' or o.split('.')[0] in ('head', 'ear')]
    e = bpy.data.objects.new('actor-' + kit, None); scene.collection.objects.link(e); faces = {}
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
    return e, faces, rig
FACE_OF = {'smile': 'smile', 'happy': 'happy', 'sad': 'sad', 'o': 'surprised', 'sleep': 'blink', 'surprised': 'surprised'}
ACT_OF = {'walk': 'walk', 'wave': 'wave', 'cheer': 'cheer', 'dance': 'cheer', 'sit': 'sit', 'ride': 'ride', 'sitground': 'sit'}
COPIES = []
ACTORS = []
for a in D['actors']:
    kit = a.get('kit'); col = kit_master(kit) if kit else None
    if col is None: ACTORS.append(None); continue
    if col.name not in [c.name for c in HOLD.children]: HOLD.children.link(col)
    size = 'kid' if kit in ('vn-yem', 'vn-boy') + FRIENDS else 'adult'
    if FRAMES and (cp := kit_copy(kit)): e = cp[0]; COPIES.append(cp)
    else: e = bpy.data.objects.new('actor-' + kit, None); e.instance_type = 'COLLECTION'; e.instance_collection = col; scene.collection.objects.link(e); COPIES.append(None)
    ACTORS.append((e, 1.6 / KIT_H[size]))
def place_actor(i, k):
    if ACTORS[i] is None: return
    e, ks = ACTORS[i]; k = min(k, len(D['actors'][i]['m']) - 1); M = m4(D['actors'][i]['m'][k]); loc, rot, sc = M.decompose()
    e3 = D['actors'][i]['m'][k]; yaw = math.atan2(e3[8], e3[10]); st = D['actors'][i]['state'][k] if D['actors'][i]['state'] else 'idle'
    e.location = loc; e.rotation_euler = (0, 0, yaw); e.scale = (sc.x * ks,) * 3
    e.hide_render = st == 'hidden'
    cp = COPIES[len([x for x in ACTORS[:i] if x is not None])] if FRAMES and i < len(ACTORS) and ACTORS[i] is not None else None
    if cp:   # (frames) the face and the move of this frame
        _, faces, rig = cp; mood = (D['actors'][i].get('mood') or ['smile'])[k] if isinstance(D['actors'][i].get('mood'), list) else 'smile'
        want = FACE_OF.get(mood, 'smile')
        for n, c in faces.items(): c.hide_render = (n != want)
        if rig and rig.animation_data:
            act = bpy.data.actions.get(ACT_OF.get(st, 'idle')) or bpy.data.actions.get('idle')
            if act: rig.animation_data.action = act; scene.frame_set(int(k * 24 / max(1, D.get('fps', 12))) % int(act.frame_range[1]) + 1)
    if st == 'lie': e.rotation_euler = (-math.pi / 2, 0, yaw); e.location.z += .15
    elif st in ('sitground', 'situp', 'kneel', 'dig', 'plant', 'pick'): e.location.z -= .35 * sc.x
for i in range(len(ACTORS)): place_actor(i, 0)

# ---------- sky, light and distance by the story's time of day ----------
top, bottom = D['sky']; T, Bc = hexc(top), hexc(bottom)
lum = .3 * T[0] + .59 * T[1] + .11 * T[2]; night = lum < .05; warm = max(0, min(1, (Bc[0] - Bc[2]) * 3))
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True; nt = world.node_tree; bgn = nt.nodes['Background']
tc = nt.nodes.new('ShaderNodeTexCoord'); sx = nt.nodes.new('ShaderNodeSeparateXYZ'); mr = nt.nodes.new('ShaderNodeMapRange'); mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
mr.inputs['From Min'].default_value = -.05; mr.inputs['From Max'].default_value = .55
nt.links.new(tc.outputs['Generated'], sx.inputs[0]); nt.links.new(sx.outputs['Z'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], mix.inputs['Factor'])
mix.inputs['A'].default_value = Bc; mix.inputs['B'].default_value = T; nt.links.new(mix.outputs['Result'], bgn.inputs['Color'])
bgn.inputs['Strength'].default_value = .35 if night else 1.0
sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = .6 if night else 3.2; sd.angle = math.radians(8)
sd.color = (.7, .78, 1.0) if night else tuple(hexc('#fff3e2')[i] * (1 - warm * .5) + hexc('#ffc184')[i] * warm * .5 for i in range(3))
so = bpy.data.objects.new('sun', sd); scene.collection.objects.link(so); so.rotation_euler = (Vector((0, 0, 0)) - v3((30, 50, 25))).to_track_quat('-Z', 'Y').to_euler()
fd = bpy.data.lights.new('fill', 'SUN'); fd.energy = .25 if night else .9; fd.color = hexc('#fff6e4')[:3]; fd.angle = math.radians(30)
fo = bpy.data.objects.new('fill', fd); scene.collection.objects.link(fo); fo.rotation_euler = (Vector((0, 0, 0)) - v3((-12, 16, 25))).to_track_quat('-Z', 'Y').to_euler()

# a soft light from the camera, with no shadow, so faces under big hair and hats stay bright (as in the studio pictures)
kd = bpy.data.lights.new('camfill', 'SUN'); kd.energy = .35 if night else 1.3; kd.use_shadow = False; kd.color = hexc('#fff4e6')[:3]
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
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
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
    for k in range(len(D['cams'])):
        for i, o in enumerate(OBJS):
            ms = D['meshes'][i]; r = k - ms.get('from', 0)
            o.hide_render = r < 0 or r >= len(ms['m']) or (ms.get('vis') and not ms['vis'][min(r, len(ms['vis']) - 1)])
            if 0 <= r < len(ms['m']): o.matrix_world = m4(ms['m'][r])
        for i in range(len(ACTORS)): place_actor(i, k)
        place_cam(k)
        scene.render.filepath = os.path.join(OUT, f'f{k:05d}.png'); bpy.ops.render.render(write_still=True)

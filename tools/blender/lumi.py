# Lumi, the star gardener (owner's concept sheet, 2 Nov 2026 AEDT): a chibi child with leaf hair, built in Blender.
# Run: blender -b -P tools/blender/lumi.py -- <out dir> [render]
# Our own model, made from the owner's design; nothing downloaded.
import bpy, bmesh, math, sys, os, random
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/lumi'
RENDER = 'render' in argv
os.makedirs(OUT, exist_ok=True)
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def hexc(h, a=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [a]

MATS = {}
def mat(name, col, rough=.75, sheen=.0, emit=0.0, sss=0.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexc(col); b.inputs['Roughness'].default_value = rough
    b.inputs['Sheen Weight'].default_value = sheen; b.inputs['Sheen Tint'].default_value = hexc('#ffffff')
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (.4, .2, .15)
    if emit: b.inputs['Emission Color'].default_value = hexc(col); b.inputs['Emission Strength'].default_value = emit
    if sheen >= .5:
        nt = m.node_tree; nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900; nz.inputs['Detail'].default_value = 4
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .25; bp.inputs['Distance'].default_value = .002
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    m.diffuse_color = hexc(col)
    MATS[name] = m; return m

SKIN = mat('skin', '#f8d3b8', .5, .15, sss=.25)
HAIR = mat('hair', '#b2d39b', .95, .9)
HAIRD = mat('hairDark', '#98bf84', .95, .9)
SHIRT = mat('shirt', '#f4ecdc', .9, .5)
OVER = mat('overalls', '#8aa56c', .95, .9)
OVERD = mat('overallsDark', '#6b8552', .9, .7)
BOOT = mat('boots', '#b5643c', .6, .3)
SOCK = mat('socks', '#f1e6cf', .95, .6)
BAG = mat('bag', '#8a5530', .55, .2)
STAR = mat('star', '#ffd75a', .4, .0, emit=.6)
EYEW = mat('eyeWhite', '#fbfaf6', .3)
IRIS = mat('iris', '#2f6b54', .25)
PUPIL = mat('pupil', '#14231c', .2)
SHINE = mat('shine', '#ffffff', .2, emit=4)
LASH = mat('lash', '#2a1d16', .6)
BROW = mat('brow', '#5f8a4f', .9)
MOUTH = mat('mouth', '#9c3b3b', .5)
TONGUE = mat('tongue', '#ef8f8a', .5)
BLUSH = mat('blush', '#f5a497', .7)
BRASS = mat('brass', '#c89a4a', .35)
LEAFG = mat('leafGreen', '#8fbf6a', .7, .3)

def obj_from(bm, name, m, parent=None, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o

def sphere(name, m, loc, scale, seg=32, ring=16, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1)
    bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale)), verts=bm.verts)
    return obj_from(bm, name, m)

def capsule(name, m, a, b, r, seg=20):
    a, b = Vector(a), Vector(b); d = b - a; L = d.length
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=12, radius=r)
    for v in bm.verts:
        if v.co.z > 0: v.co.z += L
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bmesh.ops.transform(bm, matrix=Matrix.Translation(a) @ q.to_matrix().to_4x4(), verts=bm.verts)
    return obj_from(bm, name, m)

def cyl(name, m, loc, r1, r2, h, seg=32, rot=(0, 0, 0), cap=True):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=cap, segments=seg, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(Vector(loc), Euler(rot), Vector((1, 1, 1))), verts=bm.verts)
    return obj_from(bm, name, m)

def subsurf(o, lv=2):
    md = o.modifiers.new('s', 'SUBSURF'); md.levels = lv; md.render_levels = lv; return o

# ---------- proportions: about 2.2 heads tall, 1.0 high ----------
HEAD_C = Vector((0, 0, .66)); HR = .3

# head: a soft round head, a little wider than tall, a fuller lower face
head = sphere('head', SKIN, HEAD_C, (1.04 * HR, .98 * HR, .95 * HR), 48, 32)
for v in head.data.vertices:
    p = v.co - HEAD_C
    if p.z < 0: v.co.y += -.02 * (-p.z / HR) * max(0, -p.y / HR)  # cheeks a little forward
for s in (-1, 1): sphere('ear', SKIN, (s * .305, .0, .64), (.04, .025, .055))

# face: big eyes low on the head, small nose, open smile, blush
FACE_Y = lambda x, z: -math.sqrt(max(0, 1 - (x / (1.04 * HR)) ** 2 - ((z - HEAD_C.z) / (.95 * HR)) ** 2)) * .98 * HR
def on_face(x, z, out=0.0): return Vector((x, FACE_Y(x, z) - out, z))
for s in (-1, 1):
    ex, ez = s * .105, .6
    c = on_face(ex, ez, .002)
    tilt = (math.radians(90), 0, -s * .25)
    sphere('eyeWhite', EYEW, c, (.074, .07, .02), 32, 16, (math.radians(90) - .05, 0, -s * .3))
    sphere('iris', IRIS, on_face(ex, ez - .004, .012), (.063, .066, .014), 32, 16, (math.radians(90) - .05, 0, -s * .3))
    sphere('pupil', PUPIL, on_face(ex, ez - .006, .02), (.033, .036, .01), 24, 12, (math.radians(90) - .05, 0, -s * .3))
    sphere('shine', SHINE, on_face(ex + s * .018, ez + .022, .028), (.016, .016, .006), 16, 8)
    sphere('shine2', SHINE, on_face(ex - s * .022, ez - .026, .026), (.008, .008, .004), 12, 6)
    # upper lid line with a flick at the outer corner
    bm = bmesh.new(); pts = []
    for i in range(13):
        a = math.pi * (.05 + .9 * i / 12); x = ex - math.cos(a) * .077 * s; z = ez + math.sin(a) * .073
        pts.append(on_face(x, z, .02))
    pts.append(on_face(ex + s * .095, ez + .05, .02))
    for i in range(len(pts) - 1):
        o = capsule('lash', LASH, pts[i], pts[i + 1], .011 if 2 < i < 11 else .008, 8)
    # brow: a soft short stroke
    [capsule('brow', BROW, on_face(ex + s * (-.035 + .035 * i), .7 + .006 * math.sin(math.pi * i / 2), .01), on_face(ex + s * (-.035 + .035 * (i + 1)), .7 + .006 * math.sin(math.pi * (i + 1) / 2), .01), .01, 8) for i in range(2)]
    sphere('blush', BLUSH, on_face(s * .175, .55, .004), (.055, .01, .032), 24, 12, (math.radians(-10), 0, s * .5))
sphere('nose', SKIN, on_face(0, .565, .004), (.012, .01, .009))
# open smile: a dark half-ellipse with a tongue
mouth = sphere('mouth', MOUTH, on_face(0, .505, .0), (.05, .014, .04), 32, 16)
for v in mouth.data.vertices:
    if v.co.z > .505: v.co.z = .505 + (v.co.z - .505) * .25
sphere('tongue', TONGUE, on_face(0, .484, .008), (.03, .009, .014))

# ---------- leaf hair ----------
def leaf(name, m, length, width, curl=.25, bend=.35, hug=0.0):
    bm = bmesh.new(); rows = []
    N = 7
    for i in range(N + 1):
        t = i / N; w = math.sin(math.pi * min(t * 1.05, 1)) ** .7 * width * (1 - .25 * t)
        y = t * length; z = -(y * y) / (2 * .34) * hug + .05 * length * math.sin(math.pi * t) + bend * length * t ** 4
        rows.append([bm.verts.new((-w, y, z + curl * w)), bm.verts.new((0, y, z)), bm.verts.new((w, y, z + curl * w))])
    for i in range(N):
        for j in range(2): bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.012)
    o = obj_from(bm, name, m); subsurf(o, 1); return o

def place(o, base, direction, normal, spin=0.0):
    # leaf length along +Y, its face normal +Z: turn it so Y follows direction and Z follows normal
    yv = direction.normalized(); zv = (normal - normal.project(yv)).normalized(); xv = yv.cross(zv)
    M = Matrix((xv, yv, zv)).transposed().to_4x4()
    o.matrix_world = Matrix.Translation(base) @ M @ Matrix.Rotation(spin, 4, 'Y')

hair_r = HR * 1.06
# a green cap under the leaves (open at the face) so no scalp shows between them
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=1)
bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(HEAD_C + Vector((0, .012, .02)), Euler((0, 0, 0)), Vector((1.07 * HR, 1.04 * HR, 1.0 * HR))), verts=bm.verts)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -.12 and v.co.z < HEAD_C.z + .1) or v.co.z < HEAD_C.z - .26 or (v.co.y < .05 and v.co.z < HEAD_C.z - .1)], context='VERTS')
subsurf(obj_from(bm, 'hairCap', HAIRD), 1)
def hair_leaf(az, el, length, width, flick=.25, puff=1.0, m=HAIR, hug=None):
    hug = (1.0 if el > .3 else .6) if hug is None else hug
    n = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    base = HEAD_C + Vector((n.x * 1.07, n.y * 1.04, n.z)) * hair_r * puff
    down = Vector((0, 0, -1)); tangent = (down - down.project(n)).normalized() if abs(n.z) < .98 else Vector((math.sin(az), -math.cos(az), 0))
    d = (tangent + n * .05 * puff).normalized()
    o = leaf('hairLeaf', m, length, width, .35, flick, hug)
    place(o, base, d, n, random.uniform(-.2, .2)); return o
# rows from the crown down: each row starts higher and covers the row under it; the lower rows puff out like a bob
rows = [(1.4, 6, .2, .12, .1, 1.0), (1.12, 11, .24, .12, .15, 1.0), (.82, 15, .26, .12, .22, 1.03), (.5, 17, .26, .115, .32, 1.07), (.18, 18, .24, .11, .45, 1.12), (-.12, 14, .2, .1, .55, 1.12)]
for ring, (el, cnt, ln, wd, fl, pf) in enumerate(rows):
    for k in range(cnt):
        az = 2 * math.pi * (k + .5 * ring) / cnt
        front = math.cos(az)
        if el < 1.0 and front > .62: continue  # keep the face open
        if el < .5 and front > .25: continue
        hair_leaf(az, el + random.uniform(-.05, .05), ln * random.uniform(.9, 1.1), wd * random.uniform(.9, 1.1), fl, pf, HAIR if (k + ring) % 3 else HAIRD)
# fringe: leaves from the crown over the forehead, ending just above the brows
for k, az in enumerate([-.9, -.65, -.4, -.15, .1, .35, .6, .85]):
    hair_leaf(az, .92 - .05 * abs(az), .2 + .04 * abs(az), .105, .25, 1.04, HAIR if k % 2 else HAIRD, .8)
# side locks framing the cheeks, flicking out at the tips
for s_ in (-1, 1):
    hair_leaf(s_ * 1.0, .62, .3, .11, .6, 1.08, HAIR); hair_leaf(s_ * 1.3, .45, .3, .11, .7, 1.12, HAIRD)
# the sprout on top
cyl('sproutStem', LEAFG, (0, .01, .95), .008, .006, .06)
for s in (-1, 1):
    o = leaf('sprout', LEAFG, .09, .045, .2, .1)
    place(o, Vector((0, .01, .975)), Vector((s * .8, 0, .7)), Vector((0, -1, .2)))

# star clip on the right side of the hair
def star(name, m, c, r, depth, rot):
    bm = bmesh.new(); vs = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * .5
        vs.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, 0)))
    f = bm.faces.new(vs); ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, 0, depth), verts=[e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=depth * .45, segments=2, affect='EDGES')
    bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(Vector(c), Euler(rot), Vector((1, 1, 1))), verts=bm.verts)
    return obj_from(bm, name, m)
star('hairStar', STAR, (.2, -.2, .85), .05, .025, (math.radians(70), 0, .5))

# ---------- body ----------
NECK = .4
capsule('neck', SKIN, (0, 0, .34), (0, 0, .4), .045)
# shirt: a soft rounded torso with puffed short sleeves rolled up
torso = sphere('shirt', SHIRT, (0, 0, .29), (.13, .105, .12), 32, 16)
# overalls: bib and rounded shorts
sphere('overallsBody', OVER, (0, 0, .21), (.135, .112, .1), 32, 16)
bib = cyl('bib', OVER, (0, -.085, .3), .075, .065, .11, 4, (math.radians(90), math.radians(45), 0))
bib.scale = (1.0, 1, .35); bpy.context.view_layer.update()
for s in (-1, 1):
    capsule('strap', OVER, (s * .055, -.1, .34), (s * .08, -.02, .4), .013)
    capsule('strapBack', OVER, (s * .08, .02, .4), (s * .05, .1, .26), .013)
    sphere('button', BRASS, (s * .055, -.115, .335), (.012, .006, .012))
    # shorts legs with a rolled cuff
    cyl('shortsLeg', OVER, (s * .062, 0, .12), .07, .066, .1, 24)
    cyl('cuff', OVERD, (s * .062, 0, .07), .074, .074, .025, 24)
    # legs, socks and chunky boots
    capsule('leg', SKIN, (s * .062, 0, .07), (s * .062, 0, .02), .042)
    cyl('sock', SOCK, (s * .062, 0, .055), .047, .047, .04, 20)
    boot = sphere('boot', BOOT, (s * .062, -.02, .02), (.06, .085, .045), 32, 16)
    for v in boot.data.vertices:
        if v.co.z < .0: v.co.z = .0
    cyl('bootTop', BOOT, (s * .062, 0, .045), .052, .05, .04, 20)
    # arms: sleeve, short arm, mitten hand with a thumb
    sphere('sleeve', SHIRT, (s * .135, 0, .335), (.055, .05, .05))
    capsule('arm', SKIN, (s * .15, 0, .31), (s * .17, -.01, .21), .033)
    sphere('hand', SKIN, (s * .175, -.012, .19), (.036, .028, .038))
    sphere('thumb', SKIN, (s * .16, -.035, .2), (.012, .012, .018))
    # leaf pockets on the shorts
    lf = leaf('pocketLeaf', OVERD, .06, .03, .1, .0)
    place(lf, Vector((s * .09, -.105, .2)), Vector((0, 0, -1)), Vector((0, -1, 0)))
# the satchel on the left hip with its strap across the chest
sphere('bag', BAG, (-.16, -.04, .19), (.065, .035, .05), 24, 12)
sphere('bagFlap', BAG, (-.16, -.065, .21), (.064, .015, .033), 24, 12)
star('bagStar', STAR, (-.16, -.083, .205), .018, .008, (math.radians(90), 0, 0))
pts = [Vector((-.15, -.05, .23)), Vector((-.05, -.115, .3)), Vector((.08, -.1, .38)), Vector((.12, 0, .4)), Vector((.05, .1, .34)), Vector((-.13, .05, .24))]
for i in range(len(pts) - 1): capsule('bagStrap', BAG, pts[i], pts[i + 1], .009, 8)

# join everything into one mesh per material (fewer draws in the game) and soften the round parts
for o in list(scene.objects):
    if o.type == 'MESH' and not o.modifiers and o.name.split('.')[0] in ('head', 'shirt', 'overallsBody', 'boot', 'hand', 'bag', 'bagFlap', 'sleeve'):
        subsurf(o, 1)

# ---------- light, camera, renders ----------
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = hexc('#f6efe0'); world.node_tree.nodes['Background'].inputs[1].default_value = .8
def light(kind, loc, energy, col, size=1.0):
    d = bpy.data.lights.new(kind, kind); d.energy = energy; d.color = hexc(col)[:3]
    if kind == 'AREA': d.size = size
    o = bpy.data.objects.new(kind, d); scene.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, .5)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o
light('AREA', (-1.2, -2, 1.8), 220, '#fff3df', 2.5)
light('AREA', (1.6, -1.2, 1.0), 90, '#ffe7c8', 1.5)
light('AREA', (0, 1.8, 1.6), 140, '#fff8e8', 2)   # rim from behind
ground = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=4); bm.to_mesh(ground)
g = bpy.data.objects.new('ground', ground); scene.collection.objects.link(g); g.data.materials.append(mat('groundM', '#efe6d2', .9))

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 85; cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam); scene.camera = cam
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 48; scene.cycles.use_denoising = True
scene.render.resolution_x = 640; scene.render.resolution_y = 720; scene.render.film_transparent = False
scene.view_settings.view_transform = 'Standard'; scene.view_settings.exposure = -1.1

def shoot(name, az, height=.5, dist=3.4, look=.5, res=(640, 720)):
    scene.render.resolution_x, scene.render.resolution_y = res
    cam.location = (math.sin(az) * dist, -math.cos(az) * dist, height + .25)
    cam.rotation_euler = (Vector((0, 0, look)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'lumi.blend'))
if RENDER:
    shoot('front', 0); shoot('side', math.pi / 2); shoot('back', math.pi); shoot('three-quarter', -.55)
    cam_d.lens = 85; shoot('face', -.25, .7, 1.6, .64, (640, 560))

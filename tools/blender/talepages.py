# (v1.08b story) The story pages redrawn from the Blender characters and settings (docs/cores/tasks/v108b/story-brief.md
# parts 3 and 4): each page of a tale as an illustration, its people from the costume kit (tools/blender/costumes.py, in
# period dress), simple sets and props made here, warm soft light. The same pages make the tale's Blender film
# (tools/tale-films.mts adds the camera moves, the fades and the English and Vietnamese voices).
#   blender -b -P tools/blender/talepages.py -- <kit dir with the roles' .blend files> <out dir> <tale> [quick]
# Writes <out>/<tale>-<page>.png (1280 x 720). Tales: banhchung, chucuoi, tamcam, thanhgiong, rainbowserpent.
import sys, os, math, random, glob
sys.dont_write_bytecode = True
import bpy, bmesh
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from svkit import reset, mat, felt, hexc, sphere, tube, lathe, subsurf
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
KIT, OUT, TALE = argv[0], argv[1], argv[2]; QUICK = 'quick' in argv
os.makedirs(OUT, exist_ok=True)

# ---------- props (simple, soft, our own) ----------
def box(name, m, loc, size, rot=0):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=(0, 0, rot)); o = bpy.context.object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); o.data.materials.append(m)
    b = o.modifiers.new('bv', 'BEVEL'); b.width = min(size) * .08; b.segments = 3; return o
def cone(name, m, loc, r, h, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, depth=h, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o
def house(x, y, s=1.0, rot=0):
    wall = felt('wallMud', '#d8b68a'); roof = felt('roofThatch', '#b88b4f')
    box('house', wall, (x, y, .7 * s), (2.4 * s, 1.8 * s, 1.4 * s), rot)
    r = cone('roof', roof, (x, y, 1.9 * s), 1.95 * s, 1.1 * s, (0, 0, math.pi / 4 + rot), 4); r.scale = (1.25, .95, 1)
    box('door', felt('door', '#6a4a30'), (x + math.sin(rot) * 0, y - .91 * s, .45 * s), (.5 * s, .05, .9 * s), rot)
def palace(x, y, s=1.0):
    red = felt('palaceRed', '#c0392b'); gold = mat('gold', '#e8b62a', .35, metal=.7); tile = felt('palaceTile', '#2f6a5a')
    for i in range(6): tube('column', red, [(x - 2.5 * s + i * s, y, 0), (x - 2.5 * s + i * s, y, 2.2 * s)], .12 * s, 12)
    r = cone('palaceRoof', tile, (x, y, 2.9 * s), 3.6 * s, 1.4 * s, (0, 0, math.pi / 4), 4); r.scale = (1.4, .55, 1)
    box('palaceBase', felt('stone', '#d9cdb8'), (x, y, .1 * s), (6.4 * s, 2.4 * s, .2 * s))
    sphere('palaceTop', gold, (x, y, 3.65 * s), (.25 * s, .25 * s, .25 * s))
def tree(x, y, s=1.0, col='#5f9e4f', banyan=False):
    tube('trunk', felt('bark', '#7a5434'), [(x, y, 0), (x, y, 1.6 * s)], .18 * s * (1.8 if banyan else 1), 12)
    for k in range(7 if banyan else 4):
        a = k * 2.4; sphere('leaves', felt('leaf' + col, col), (x + math.cos(a) * .7 * s * (1.5 if banyan else 1), y + math.sin(a) * .5 * s, 1.9 * s + (k % 3) * .35 * s), (.9 * s, .8 * s, .7 * s), 20, 10)
    if banyan:
        for k in range(6): a = k * 1.05; tube('root', felt('bark', '#7a5434'), [(x + math.cos(a) * .9 * s, y + math.sin(a) * .6 * s, 1.9 * s), (x + math.cos(a) * 1.1 * s, y + math.sin(a) * .8 * s, 0)], .03 * s, 6)
def bamboo(x, y, s=1.0, col='#8ab84f'):
    for k in range(5): xx = x + (k - 2) * .25 * s; tube('bamboo', felt('bamboo' + col, col), [(xx, y + (k % 2) * .2, 0), (xx + .1, y, 3.2 * s)], .06 * s, 10)
def mountain(x, y, s, col='#7aa86a'):
    o = cone('mountain', felt('mt' + col, col), (x, y, 2 * s), 3 * s, 4 * s, verts=7); return o
def rock_red(x, y, s):   # a great red rock, its top rounded (not Uluru itself: a red rock of the outback)
    o = sphere('redRock', felt('redRock', '#c8643a', .9), (x, y, .9 * s), (4.2 * s, 2.0 * s, 1.3 * s), 32, 16)
    for v in o.data.vertices: v.co.z = max(v.co.z, .0)
    return o
def moon(x, y, z, s=1.6, col='#fff2b0'): return sphere('moon', mat('moonGlow', col, .5, emit=2.5), (x, y, z), (s, s * .3, s), 32, 16)
def cake(x, y, square=True):
    if square:
        box('banhChung', felt('lacLeaf', '#3f7a3a'), (x, y, .18), (.5, .5, .36)); box('tie', felt('tie', '#d8c08a'), (x, y, .18), (.52, .04, .38)); box('tie', felt('tie', '#d8c08a'), (x, y, .18), (.04, .52, .38))
    else: sphere('banhGiay', felt('giay', '#f8f4ea'), (x, y, .12), (.3, .3, .12), 24, 12)
def bowls(x, y, n=3):
    for i in range(n):
        lathe('bowl', felt('bowl', '#e8e4dc'), [(.0, .0), (.16, .0), (.26, .16), (.27, .18)], 24, loc=(x + (i % 3) * .5, y + (i // 3) * .5, 0))
        sphere('rice', felt('riceWhite', '#fbfaf5'), (x + (i % 3) * .5, y + (i // 3) * .5, .16), (.24, .24, .12), 16, 8)
def animal(kind, x, y, s=1.0, rot=0):
    C = {'tiger': '#e8862e', 'horse': '#6a6a70', 'fish': '#f2a43a', 'bird': '#f5d36a', 'frog': '#6fbf5a', 'kangaroo': '#b5784a', 'elephant': '#9a9aa6', 'emu': '#6a5a4a'}[kind]
    M = felt('an' + kind, C) if kind != 'horse' else mat('iron', C, .35, metal=.7)
    g = bpy.data.objects.new(kind, None); bpy.context.collection.objects.link(g); g.location = (x, y, 0); g.rotation_euler = (0, 0, rot); g.scale = (s, s, s)
    parts = []
    if kind in ('tiger', 'horse', 'elephant'):
        h = {'tiger': .55, 'horse': 1.0, 'elephant': 1.0}[kind]; L = {'tiger': .9, 'horse': 1.1, 'elephant': 1.2}[kind]
        parts.append(sphere('body', M, (0, 0, h), (L * .6, .38 * L, .36 * L), 24, 12))
        for sx in (-1, 1):
            for sy in (-1, 1): parts.append(tube('leg', M, [(sx * L * .4, sy * .2 * L, h - .1), (sx * L * .4, sy * .2 * L, 0)], .08 * L, 10))
        parts.append(sphere('head', M, (L * .7, 0, h + .3 * L), (.28 * L, .24 * L, .26 * L), 20, 10))
        if kind == 'elephant': parts.append(tube('trunk', M, [(L * .9, 0, h + .3), (L * 1.05, 0, h - .1), (L * 1.1, 0, .2)], .07 * L, 10))
        if kind == 'horse':
            parts.append(tube('neck', M, [(L * .45, 0, h + .1), (L * .65, 0, h + .45)], .16 * L, 10))
            for k in range(6): parts.append(sphere('flame', mat('fire', '#ff7a2e', .4, emit=6), (L * .55 - k * .12, 0, h + .55 + (k % 2) * .1), (.12, .08, .14), 10, 5))
        if kind == 'tiger':
            for k in range(4): parts.append(sphere('stripe', felt('tigerStripe', '#3a2a20'), (-.2 + k * .15, 0, h + .3), (.03, .4, .2), 8, 4))
    elif kind in ('bird', 'fish', 'frog'):
        parts.append(sphere('body', M, (0, 0, .2), (.25, .16, .16), 16, 8))
        parts.append(sphere('eye', felt('eyeBlack', '#1a1a1a'), (.18, -.08, .26), (.03, .03, .03), 8, 4))
        if kind == 'bird': parts.append(cone('beak', felt('beak', '#e8862e'), (.3, 0, .24), .05, .12, (0, math.pi / 2, 0), 8))
        if kind == 'fish': parts.append(cone('tail', M, (-.28, 0, .2), .14, .2, (0, -math.pi / 2, 0), 8))
    elif kind in ('kangaroo', 'emu'):
        parts.append(sphere('body', M, (0, 0, .8), (.35, .28, .5), 20, 10)); parts.append(sphere('head', M, (.15, 0, 1.45), (.14, .12, .16), 16, 8))
        if kind == 'kangaroo': parts.append(tube('tail', M, [(-.2, 0, .5), (-.8, 0, .05)], .09, 10))
        else: parts.append(tube('neck', M, [(.1, 0, 1.0), (.15, 0, 1.4)], .06, 8))
        for sy in (-1, 1): parts.append(tube('leg', M, [(0, sy * .12, .5), (.05, sy * .12, 0)], .06, 8))
    for o in parts: o.parent = g
    return g
def serpent(pts, s=1.0):   # the Rainbow Serpent: a long body in bands of colour
    cols = ['#e85a5a', '#f2a43a', '#f2d24a', '#6fbf5a', '#4a9ad8', '#8a6ad8']
    n = len(pts) - 1
    for i in range(n):
        tube('serpent', felt('rb' + str(i % 6), cols[i % 6], .6), [pts[i], pts[i + 1]], .28 * s, 16)
    sphere('serpentHead', felt('rb0', cols[0], .6), pts[-1], (.45 * s, .32 * s, .3 * s), 20, 10)
def water(x, y, sx, sy, col='#5ab0d8'):
    bpy.ops.mesh.primitive_plane_add(location=(x, y, .02)); o = bpy.context.object; o.scale = (sx, sy, 1); o.data.materials.append(mat('water' + col, col, .1, sss=0)); return o
def rice_field(x, y, sx, sy):
    water(x, y, sx, sy, '#8fc0a0')
    for i in range(int(sx * 4)):
        for j in range(int(sy * 3)): cone('rice', felt('riceGreen', '#7fbf4f'), (x - sx + i * .5 + .25, y - sy + j * .66 + .3, .2), .08, .4, verts=6)

# ---------- people from the costume kit ----------
CACHE = {}
def person(role, x, y, rot=0.0, s=1.0):
    path = (glob.glob(os.path.join(KIT, f'villager-{role}-*.blend')) or [None])[0]
    if not path: print('no kit file for', role); return None
    with bpy.data.libraries.load(path, link=False) as (src, dst): dst.objects = [n for n in src.objects]
    g = bpy.data.objects.new(role, None); bpy.context.collection.objects.link(g); g.location = (x, y, 0); g.rotation_euler = (0, 0, rot); g.scale = (s, s, s)
    for o in dst.objects:
        if o is None or o.type not in ('MESH', 'CURVE') or o.name.startswith('ground'): continue
        bpy.context.collection.objects.link(o)
        if o.parent is None: o.parent = g
    return g

# ---------- each tale's pages: the set, the people, the props, the light ----------
FACE = math.pi   # people face the camera (the camera looks along +y)
def page_set(sky, ground, sun=(-.6, -.4), warm='#fff1d8', night=False):
    sc = bpy.context.scene; w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = hexc(sky); bg.inputs[1].default_value = .35 if night else 1.0
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 10, 0)); g = bpy.context.object; g.data.materials.append(felt('ground' + ground, ground, .95))
    d = bpy.data.lights.new('sun', 'SUN'); d.energy = .6 if night else 3.2; d.color = hexc('#c8d4ff' if night else warm)[:3]; d.angle = .35
    o = bpy.data.objects.new('sun', d); sc.collection.objects.link(o); o.rotation_euler = (sun[0] + .9, 0, sun[1])
    a = bpy.data.lights.new('fill', 'AREA'); a.energy = 600 if not night else 250; a.size = 8; a.color = hexc('#ffe9cf' if not night else '#ffd27a')[:3]
    f = bpy.data.objects.new('fill', a); sc.collection.objects.link(f); f.location = (3, -6, 5); f.rotation_euler = (math.radians(55), 0, math.radians(25))
def camera(pos, look, lens=35):
    sc = bpy.context.scene; cd = bpy.data.cameras.new('cam'); cd.lens = lens; cd.dof.use_dof = True; cd.dof.aperture_fstop = 4.5
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam; cam.location = pos
    cam.rotation_euler = (Vector(look) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler(); cd.dof.focus_distance = (Vector(look) - Vector(pos)).length

def P_banhchung(k):
    page_set('#bfe3f5', '#9ccf6e')
    if k == 0: palace(0, 6); person('tale-vn-king', 0, 2.5, FACE, 1.0); [person('tale-vn-prince', x, 0.2, FACE + .3 * (x > 0) - .3 * (x < 0), .9) for x in (-2.2, -.9, 1.1)]; camera((0, -9, 2.4), (0, 2, 1.3))
    elif k == 1: mountain(-5, 12, 1.6); mountain(1, 14, 2, '#6a9a5a'); water(4, 4, 4, 3); person('tale-vn-prince', -1.5, 0, FACE + .4); person('tale-vn-prince', 1.2, .6, FACE - .3); animal('fish', 3.5, 2, 1.6); camera((0, -8, 2.2), (0, 2, 1.0))
    elif k == 2: house(-3, 4); rice_field(2.5, 4, 3, 2); person('tale-vn-farmer', 0, 0, FACE + .2); [cake(-1 + i * .3, -1.2, False) for i in range(0)]; tree(-6, 6, 1.1); camera((0, -7.5, 2.0), (0, 2, 1.0))
    elif k == 3: house(-3.5, 5); person('tale-vn-farmer', -1.2, 0, FACE + .3); cake(.6, -.6, True); cake(1.4, -.6, False); box('table', felt('wood', '#8a5a36'), (1.0, -.6, -.02), (2.2, 1.0, .04)); camera((0, -5.5, 1.8), (.4, 0, .6), 40)
    else: palace(0, 6); person('tale-vn-king', -.6, 1.5, FACE + .2); person('tale-vn-farmer', 1.2, .8, FACE - .4); cake(.2, -.4, True); cake(.8, -.4, False); camera((0, -7, 2.0), (.2, 1, 1.0))
def P_chucuoi(k):
    night = k >= 4
    page_set('#18204a' if night else '#cfe8f2', '#8fcf6a', night=night)
    if k == 0: tree(2.5, 3, 1.3, banyan=True); animal('tiger', 1.2, 1.5, 1.2, FACE + .8); animal('tiger', 2.4, .9, .6, FACE + 1.1); person('tale-vn-farmer', -2, 0, FACE - .4); camera((0, -8, 2.2), (.5, 1.5, 1.0))
    elif k == 1: house(2.5, 4); tree(-1.5, 3, 1.1, banyan=True); person('tale-vn-farmer', .4, .5, FACE); person('tale-vn-woman', 2, 1, FACE - .3); camera((0, -8, 2.2), (.5, 2, 1.0))
    elif k == 2: house(-2.5, 4); tree(1.2, 2.5, 1.1, banyan=True); person('tale-vn-woman', -.3, .5, FACE + .3); lathe('bucket', felt('bucket', '#7a5434'), [(0, 0), (.2, 0), (.24, .3)], 16, loc=(.4, .2, 0)); camera((0, -7, 2.0), (.3, 1.5, 1.0))
    elif k == 3: tree(0, 2, 1.1, banyan=True); [o.location.__setitem__(2, o.location.z + 1.8) for o in bpy.data.objects if o.name.startswith(('trunk', 'leaves', 'root'))]; g = person('tale-vn-farmer', .1, 1.9, FACE); g.location.z = .9 if g else 0; camera((0, -8, 2.6), (0, 2, 2.4))
    elif k == 4: moon(0, 14, 7, 3.0); tree(0, 12, .9, banyan=True); [o.location.__setitem__(2, o.location.z + 4.5) for o in bpy.data.objects if o.name.startswith(('trunk', 'leaves', 'root'))]; camera((0, -6, 2.5), (0, 12, 6))
    else: moon(0, 16, 8, 3.2); house(-4, 6); person('tale-vn-girl', -1, 0, FACE + .3, .9); person('tale-vn-boy', .8, .2, FACE - .3, .9); [box('lantern', mat('lan', '#ff5a3a', .5, emit=3), (x, -.2, 1.4), (.25, .25, .3)) for x in (-1.6, 1.5)]; camera((0, -7, 2.2), (0, 6, 3.0))
def P_tamcam(k):
    page_set('#cfe8f2', '#9ccf6e')
    if k == 0: house(0, 5); person('tale-vn-girl', 1.5, .5, FACE - .2); person('tale-vn-woman', -1.8, 1.5, FACE + .3); person('tale-vn-girl', -.8, 2, FACE + .2, .95); camera((0, -8, 2.2), (0, 2, 1.0))
    elif k == 1: water(0, 2.5, 2.2, 1.6); animal('fish', .3, 2, 1.8); person('tale-vn-girl', -1.8, .3, FACE + .5); person('tale-vn-but', 1.8, .6, FACE - .5); camera((0, -7, 2.2), (0, 1.5, 1.0))
    elif k == 2: [animal('bird', -1 + i * .5, .4 + (i % 2) * .3, 1.2, FACE) for i in range(5)]; box('riceMat', felt('mat', '#d8b68a'), (0, .6, .01), (3, 1.4, .02)); person('tale-vn-girl', -2.2, 1, FACE + .4); camera((0, -6.5, 2.4), (0, 1, .6))
    elif k == 3: animal('elephant', 1.5, 2.5, 1.4, FACE + 1.2); person('tale-vn-prince', .4, 1.2, FACE - .2); box('slipper', felt('slipper', '#e8332a'), (-.8, -.2, .05), (.3, .14, .1)); camera((0, -8, 2.4), (.5, 2, 1.0))
    elif k == 4: palace(0, 6); person('tale-vn-prince', -1.2, 1, FACE + .3); person('tale-vn-girl', .8, .6, FACE - .3); camera((0, -7, 2.0), (0, 2, 1.0))
    else: house(-3, 5); tree(1.5, 3, 1.0, '#7aae4a'); sphere('thi', felt('thi', '#f2c03a'), (1.5, 2.6, 2.3), (.25, .25, .25), 16, 8); person('tale-vn-woman', -.5, .8, FACE + .2); person('tale-vn-girl', .6, .3, FACE - .2); camera((0, -7, 2.2), (.4, 2, 1.2))
def P_thanhgiong(k):
    page_set('#cfe8f2', '#9ccf6e')
    if k == 0: house(1.5, 4); person('tale-vn-woman', -.5, .8, FACE + .2); person('tale-vn-boy', .4, .2, FACE - .2, .7); camera((0, -7, 2.0), (0, 1.5, 1.0))
    elif k == 1: house(-3, 5); person('tale-vn-soldier', 1.8, 1, FACE - .4); person('tale-vn-boy', -.4, .3, FACE + .3, .75); person('tale-vn-woman', -1.6, 1, FACE + .3); camera((0, -8, 2.2), (0, 1.5, 1.0))
    elif k == 2: house(0, 5.5); bowls(-2, -.4, 6); person('tale-vn-boy', 0, 1.5, FACE, 1.6); person('tale-vn-woman', 2, .8, FACE - .4); person('tale-vn-farmer', -2.6, 1.2, FACE + .4); camera((0, -9, 2.6), (0, 1.5, 1.4))
    elif k == 3: mountain(-4, 14, 2); mountain(3, 16, 2.4, '#6a9a5a'); animal('horse', 0, 2, 1.6, FACE + 1.3); g = person('tale-vn-soldier', 0, 2, FACE, 1.3); g and setattr(g.location, 'z', 1.4); camera((0, -9, 2.4), (0, 2, 1.8))
    elif k == 4: mountain(0, 10, 2.4); bamboo(-3, 3, 1.1); animal('horse', 1, 6, 1.2, FACE + 1.3); camera((0, -9, 3.2), (0, 6, 3.0))
    else: bamboo(-1.5, 2, 1.2, '#e8c84a'); bamboo(1.2, 3, 1.1, '#e8c84a'); bamboo(3.5, 4, 1.0, '#d8b83a'); camera((0, -7, 2.2), (0, 3, 1.6))
def P_rainbowserpent(k):
    sky = '#f2c890' if k == 0 else '#bfe3f5'; page_set(sky, '#d89a5a' if k < 3 else '#a8b860', warm='#ffe0b8')
    if k == 0: rock_red(2, 14, 2.0); [cone('spinifex', felt('spin', '#a8a05a'), (random.uniform(-6, 6), random.uniform(2, 10), .2), .3, .4, verts=8) for _ in range(20)]; camera((0, -7, 1.8), (0, 8, 1.0))
    elif k == 1: serpent([(-6, 6, .3), (-3, 4, .5), (0, 6, .4), (3, 4, .6), (5, 5.5, 1.2)], 1.2); rock_red(3, 16, 1.6); camera((0, -8, 3.0), (0, 5, .6))
    elif k == 2: mountain(-4, 12, 1.4, '#c88a5a'); mountain(3, 14, 1.8, '#b8784a'); serpent([(-5, 4, .3), (-2, 6, .4), (1, 4, .3), (4, 6, .5)], 1.0); camera((0, -9, 3.5), (0, 6, .8))
    elif k == 3: water(0, 5, 6, 2.5); serpent([(-4, 2, .3), (-1, 1, .3), (2, 2, .3), (4, 1.4, .8)], 1.0); [sphere('cloud', felt('cloud', '#e8eef5'), (x, 14, 6), (2, 1, .8), 20, 10) for x in (-4, 2)]; camera((0, -8, 3.0), (0, 5, 1.2))
    elif k == 4: water(0, 4, 4, 2); animal('frog', -1, 1.5, 1.5, FACE); animal('kangaroo', 2, 2.5, 1.2, FACE + .6); animal('bird', -2.5, 3, 1.4, FACE); animal('fish', .5, 4, 1.5, FACE + .5); tree(4, 6, 1.0, '#7aa860'); camera((0, -7, 2.2), (0, 3, .8))
    else: water(0, 4, 5, 2.2); serpent([(-6, 12, 2), (-3, 13, 5), (0, 14, 6.5), (3, 13, 5), (6, 12, 2)], 1.5); tree(-4, 5, 1.0, '#7aa860'); camera((0, -7, 2.4), (0, 8, 3.2))

PAGES = {'banhchung': (P_banhchung, 5), 'chucuoi': (P_chucuoi, 6), 'tamcam': (P_tamcam, 6), 'thanhgiong': (P_thanhgiong, 6), 'rainbowserpent': (P_rainbowserpent, 6)}
fn, n = PAGES[TALE]
for k in ([int(a[5:]) for a in argv if a.startswith('page=')] or range(n)):
    reset(); random.seed(k + 11); sc = bpy.context.scene
    fn(k)
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 12 if QUICK else 48; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = (640, 360) if QUICK else (1280, 720)
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.render.filepath = os.path.join(OUT, f'{TALE}-{k + 1}.png'); bpy.ops.render.render(write_still=True)

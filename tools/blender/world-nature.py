# (v1.08e nature, 6 Nov 2026 AEDT) Trees, flowers, plants, farm crops, farm props and My House decorations for
# Sparkle Valley, made by script in Blender (our own models; no downloads).
#   python3 tools/blender/world-nature.py [name ...]     (pip install bpy; or blender -b -P this-file -- [name ...])
# writes models/world/<name>.glb (plain glTF; tools/make-world-nature.mts then compresses each with gltfpack, meshopt).
# - Picture-book look: soft lumpy leaf balls, every face its own slightly different shade, tops lighter (the sun),
#   colours in the corners (vertex colours, one material), so the game's toon material and InstancedMesh draw it in
#   one draw per kind.
# - Sizes and the ground point match the code shapes they replace (js/world.ts, js/roads.ts, js/town.ts, js/reeds.ts,
#   js/farm.ts, js/home-decor-models.ts), so colliders, hit areas and shadows stay true. The ground is y = 0.
# - Coordinates below are the game's (three.js: y up, +z the front); they are turned into Blender's at the end.
import bpy, bmesh, math, os, random, sys
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'models', 'world', 'raw')

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c]

def euler3(rx, ry, rz):  # three.js Euler 'XYZ': M = Rx * Ry * Rz
    return Matrix.Rotation(rx, 4, 'X') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rz, 4, 'Z')

class Model:
    """one mesh, colours per face corner; parts placed in game coordinates"""
    def __init__(self, name, seed=1):
        self.name = name; self.bm = bmesh.new(); self.col = self.bm.loops.layers.float_color.new('Col'); self.rnd = random.Random(seed)

    def _add(self, make, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), jitter=0.0, shade=.10, top=.12):
        tmp = bmesh.new(); make(tmp)
        if jitter:
            for v in tmp.verts:
                d = v.co.length or 1; v.co *= 1 + (self.rnd.random() - .5) * 2 * jitter / max(d, .2)
        M = Matrix.Translation(Vector(pos)) @ euler3(*rot) @ Matrix.Diagonal(Vector((*scl, 1)))
        bmesh.ops.transform(tmp, matrix=M, verts=tmp.verts)
        tmp.normal_update()
        base = lin(color) if isinstance(color, str) else color
        me = bpy.data.meshes.new('t'); tmp.to_mesh(me); tmp.free()
        n0 = len(self.bm.faces); self.bm.from_mesh(me); bpy.data.meshes.remove(me)
        self.bm.faces.ensure_lookup_table(); self.bm.normal_update()
        for f in self.bm.faces[n0:]:
            k = 1 + (self.rnd.random() - .5) * 2 * shade + max(0, f.normal.y) * top - max(0, -f.normal.y) * top
            c = [min(1, x * k) for x in base] + [1]
            for l in f.loops: l[self.col] = c
        return self

    # three.js-style primitives (centred like three's: cylinder and cone along y, cone tip up)
    def cyl(self, rt, rb, h, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=7, **k):
        def mk(b):
            bmesh.ops.create_cone(b, cap_ends=True, cap_tris=False, segments=seg, radius1=rb, radius2=rt, depth=h)
            bmesh.ops.rotate(b, verts=b.verts, matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
        return self._add(mk, color, pos, rot, scl, **k)
    def cone(self, r, h, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=8, **k):
        return self.cyl(0.001, r, h, color, pos, rot, scl, seg, **k)
    def ball(self, r, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), sub=2, jitter=0.0, **k):
        return self._add(lambda b: bmesh.ops.create_icosphere(b, subdivisions=sub + 1, radius=r), color, pos, rot, scl, jitter=jitter, **k)
    def uv(self, r, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=10, ring=7, **k):
        return self._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=seg, v_segments=ring, radius=r), color, pos, rot, scl, **k)
    def box(self, w, h, d, color, pos=(0, 0, 0), rot=(0, 0, 0), **k):
        return self._add(lambda b: bmesh.ops.create_cube(b, size=1), color, pos, rot, (w, h, d), **k)
    def leaf(self, length, width, color, pos, yaw, droop=.5, bend=.35, **k):
        """a long leaf (palm, banana): a bent strip from its root at pos outwards along yaw"""
        def mk(b):
            n = 6; vs = []
            for i in range(n + 1):
                t = i / n; x = t * length; y = -(t * t) * length * bend; w = width * math.sin(math.pi * min(1, t * 1.1 + .05)) * .5
                th = .012 + width * .02  # a thin sheet: both sides are seen
                vs.append([b.verts.new((x, y + o, -w)) for o in (0, -th)] + [b.verts.new((x, y + w * .25 + o, 0)) for o in (0, -th)] + [b.verts.new((x, y + o, w)) for o in (0, -th)])
            for i in range(n):
                a, c = vs[i], vs[i + 1]
                b.faces.new((a[0], c[0], c[2], a[2])); b.faces.new((a[2], c[2], c[4], a[4]))
                b.faces.new((a[3], c[3], c[1], a[1])); b.faces.new((a[5], c[5], c[3], a[3]))
        return self._add(mk, color, pos, (0, yaw, droop), **k)
    def petals(self, n, r, color, pos, size=.12, tilt=.5, sub=0, **k):
        for i in range(n):
            a = i * 2 * math.pi / n
            self.ball(size, color, (pos[0] + math.cos(a) * r, pos[1], pos[2] + math.sin(a) * r), (0, -a, tilt), (1.3, .35, .8), sub=sub, **k)
        return self

    def tris(self):
        return sum(len(f.verts) - 2 for f in self.bm.faces)

    def save(self):
        # game (x, y, z) -> Blender (x, -z, y); the glTF exporter turns it back
        bmesh.ops.transform(self.bm, matrix=Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1))), verts=self.bm.verts)
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.0)
        bmesh.ops.triangulate(self.bm, faces=self.bm.faces)
        me = bpy.data.meshes.new(self.name); self.bm.to_mesh(me); self.bm.free()
        ob = bpy.data.objects.new(self.name, me); bpy.context.collection.objects.link(ob)
        m = bpy.data.materials.get('vc') or bpy.data.materials.new('vc'); me.materials.append(m)
        me.color_attributes.active_color = me.color_attributes['Col']; me.color_attributes.render_color_index = 0
        for o in bpy.context.scene.objects: o.select_set(o is ob)
        bpy.context.view_layer.objects.active = ob
        os.makedirs(OUT, exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, self.name + '.glb'), export_format='GLB', use_selection=True,
                                  export_vertex_color='NAME', export_vertex_color_name='Col', export_all_vertex_colors=False, export_texcoords=False, export_normals=True, export_materials='EXPORT',
                                  export_animations=False, export_apply=True)
        n = len(me.polygons); bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
        return n

M = {}
def model(fn):
    M[fn.__name__.replace('_', '-')] = fn; return fn

BARK, BARK2 = '#7a5a3e', '#8a5a3b'

def canopy(m, blobs, cols, jitter=.18, sub=2):
    for i, (x, y, z, r) in enumerate(blobs):
        m.ball(r, cols[i % len(cols)], (x, y, z), sub=sub, jitter=jitter * r)

# ---------- trees and plants of the valley (js/world.ts) ----------
@model
def tree_round():
    m = Model('tree-round', 11)
    m.cyl(.24, .4, 3.4, BARK, (0, 1.7, 0), seg=8)
    m.cyl(.1, .17, 1.8, BARK, (.6, 3, 0), (0, 0, -.6)); m.cyl(.1, .16, 1.6, BARK, (-.5, 2.9, .2), (.2, 0, .6))
    canopy(m, [(0, 4.5, 0, 2.2), (1.5, 4.1, .6, 1.7), (-1.4, 4.2, -.4, 1.6), (.3, 5.9, .3, 1.4), (-.5, 4.6, 1.3, 1.2), (.6, 4.8, -1.3, 1.2)],
           ['#2f7f5f', '#3a8d68', '#276f55', '#46a077', '#358a62', '#2c7a58'])
    return m
@model
def tree_apple():
    m = Model('tree-apple', 12)
    m.cyl(.3, .44, 2.6, BARK2, (0, 1.3, 0), seg=8); m.cyl(.1, .15, 1.2, BARK2, (.4, 2.5, .2), (.3, 0, -.7))
    canopy(m, [(0, 3.9, 0, 2.2), (1.1, 3.5, .5, 1.3), (-1, 3.6, -.4, 1.3), (.1, 4.9, .1, 1.3)], ['#348a63', '#3f9a6c', '#2f7f5a', '#46a077'])
    for i, p in enumerate([(1.6, 4, .8), (-1.4, 3.6, 1), (.4, 4.4, -1.8), (-.6, 5.4, .9), (1.1, 3.1, -1.3), (-1.7, 4.3, -.6), (.9, 5.2, 1)]):
        m.uv(.3, '#e8433a', p, seg=8, ring=6, shade=.05); m.cyl(.02, .02, .18, '#5a3a22', (p[0], p[1] + .32, p[2]), seg=4)
    return m
@model
def tree_pine():
    m = Model('tree-pine', 13)
    m.cyl(.25, .36, 2, '#6e4a32', (0, 1, 0), seg=7)
    for i, (r, h, y, c) in enumerate([(2, 2.6, 2.9, '#25664f'), (1.65, 2.3, 4.1, '#2c7558'), (1.25, 2, 5.2, '#307d5c'), (.85, 1.7, 6.3, '#348462')]):
        m.cone(r, h, c, (0, y, 0), (0, i * .4, 0), seg=12, jitter=.05)
        for k in range(9): a = k * .698 + i * .35; m.cone(.32 * r, .7, c, (math.cos(a) * r * .8, y - h / 2 + .25, math.sin(a) * r * .8), (math.sin(a) * .9, 0, -math.cos(a) * .9), seg=5)
    return m
@model
def tree_snowpine():
    m = Model('tree-snowpine', 14)
    m.cyl(.25, .36, 2, '#6e4a32', (0, 1, 0), seg=7)
    for i, (r, h, y, c) in enumerate([(2, 2.6, 2.9, '#2f6a4f'), (1.65, 2.3, 4.1, '#356f53'), (1.25, 2, 5.2, '#e9f2ff'), (.85, 1.7, 6.3, '#ffffff')]):
        m.cone(r, h, c, (0, y, 0), (0, i * .4, 0), seg=12, jitter=.05)
        for k in range(9): a = k * .698 + i * .35; m.cone(.32 * r, .7, c, (math.cos(a) * r * .8, y - h / 2 + .25, math.sin(a) * r * .8), (math.sin(a) * .9, 0, -math.cos(a) * .9), seg=5)
    for i, (r, y) in enumerate([(2.02, 3.35), (1.67, 4.45)]):  # snow on the lower tiers' shoulders
        m.cone(r * .55, .5, '#f4f8ff', (0, y + .55, 0), (0, i, 0), seg=9)
    return m
@model
def tree_bamboo():
    m = Model('tree-bamboo', 15)
    for i, (x, z) in enumerate([(0, 0), (.7, .3), (-.5, .6), (.2, -.7), (-.7, -.3), (.55, -.45)]):
        h = 7 + (i % 3) * 1.6; lean = (x * .04, 0, -z * .04)
        m.cyl(.12, .15, h, '#8cc65a' if i % 2 else '#7fbb50', (x, h / 2, z), lean, seg=6)
        for k in range(1, 5): m.cyl(.16, .16, .08, '#6a9a3a', (x, h * k / 5, z), lean, seg=6)
        for k in range(4):
            a = k * 1.6 + i
            m.leaf(1.1, .28, '#5fae4a' if k % 2 else '#4f9a42', (x, h - .3 - k * .5, z), a, droop=.25, bend=.5)
    return m
@model
def tree_palm():
    m = Model('tree-palm', 16)
    pts = [(0, 0), (.08, 1.1), (.18, 2.2), (.3, 3.3), (.45, 4.4), (.6, 5.3)]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]; r = .32 - i * .025
        m.cyl(r - .02, r, y1 - y0 + .05, '#a07848' if i % 2 else '#8f6a3e', ((x0 + x1) / 2, (y0 + y1) / 2, 0), (0, 0, -math.atan2(x1 - x0, y1 - y0)), seg=7)
    for i in range(8):
        m.leaf(3.2, .8, '#4fae4a' if i % 2 else '#3d9a42', (.6, 5.3, 0), i * math.pi / 4 + .2, droop=.15 + (i % 3) * .1, bend=.45)
    for p in [(.75, 5.1, .25), (.45, 5.05, -.25), (.8, 5.0, -.15)]: m.uv(.24, '#7a5a2a', p, seg=7, ring=5)
    return m
@model
def bush():
    m = Model('bush', 17)
    for i, (x, y, z, r) in enumerate([(0, .72, 0, 1.0), (.85, .6, .3, .74), (-.7, .56, -.3, .68), (.1, .6, -.8, .62), (-.2, 1.1, .3, .56)]):
        m.ball(r, ['#24654f', '#30785c', '#2a6d55', '#358062'][i % 4], (x, y, z), (0, 0, 0), (1.15, .8, 1), sub=1, jitter=.2 * r)
    return m
@model
def flower_meadow():
    """white petals and a yellow middle: the game tints each flower (setColorAt), as before"""
    m = Model('flower-meadow', 18)
    m.cyl(.025, .03, .6, '#4f9e45', (0, .3, 0), seg=4)
    m.leaf(.25, .1, '#5fb04a', (0, .15, 0), .5, droop=.6, bend=.3); m.leaf(.22, .09, '#5fb04a', (0, .22, 0), 3.6, droop=.6, bend=.3)
    m.petals(6, .14, '#ffffff', (0, .62, 0), size=.12, tilt=.35, shade=.04)
    m.uv(.085, '#ffd23f', (0, .65, 0), seg=7, ring=5)
    return m

# ---------- along the roads (js/roads.ts) ----------
@model
def flower_roadside():
    """the stem, leaf and yellow middle of a roadside flower (its tinted petals stay their own disc)"""
    m = Model('flower-roadside', 19)
    m.cyl(.012, .017, .36, '#4f9a3c', (0, .18, 0), seg=4)
    m.cyl(.045, .045, .03, '#ffd23f', (0, .375, 0), seg=6)
    m.leaf(.09, .05, '#5fb04a', (0, .08, 0), 0, droop=.7, bend=.3); m.leaf(.08, .045, '#5fb04a', (0, .12, 0), 3, droop=.7, bend=.3)
    return m
@model
def bush_bougainvillea():
    m = Model('bush-bougainvillea', 20)
    canopy(m, [(0, .55, 0, .66), (.35, .75, .2, .4), (-.35, .7, -.2, .42)], ['#4f8f3e', '#5a9a46', '#47843a'], sub=1, jitter=.2)
    for i in range(14):
        a = i * 2.4; r = .35 + (i % 3) * .12; y = .6 + (i % 4) * .14
        m.ball(.13 + (i % 2) * .04, '#e0328c' if i % 3 else '#f05aa6', (math.cos(a) * r, y, math.sin(a) * r), sub=1, jitter=.03)
    return m
@model
def tree_gum():
    m = Model('tree-gum', 21)
    m.cyl(.17, .3, 5.6, '#e9e1d2', (0, 2.8, 0), seg=8); m.cyl(.09, .14, 2.3, '#e3d9c6', (.65, 4.8, 0), (0, 0, -.6)); m.cyl(.08, .12, 1.8, '#e3d9c6', (-.5, 4.6, .2), (.2, 0, .6))
    for k in range(5): m.box(.08, .5, .02, '#c9bba5', (math.cos(k * 1.3) * .24, 1 + k * .8, math.sin(k * 1.3) * .24), (0, -k * 1.3, 0))  # peeling bark
    canopy(m, [(0, 6.3, 0, 1.5), (1.3, 5.7, .4, 1.1), (-1, 5.9, -.5, 1.2), (.3, 5.4, -1, .9)], ['#7a9a6a', '#86a676', '#6f8f60'], jitter=.22)
    return m

# ---------- the towns' trees (js/town.ts; the Sa Pa peach tree in js/s2vn.ts) ----------
@model
def tree_jacaranda():
    m = Model('tree-jacaranda', 22)
    m.cyl(.25, .42, 3.4, '#6b5040', (0, 1.7, 0), seg=8); m.cyl(.1, .16, 1.6, '#6b5040', (.7, 3.3, .2), (.2, 0, -.7)); m.cyl(.1, .16, 1.5, '#6b5040', (-.7, 3.3, -.1), (0, 0, .7))
    canopy(m, [(0, 4.6, 0, 2.1), (1.6, 4.2, .5, 1.5), (-1.5, 4.3, -.3, 1.6), (.2, 5.8, .2, 1.3), (-.4, 4.4, 1.4, 1.1)], ['#9c7fd6', '#b39ce6', '#8a6cc8', '#c3b0ee'])
    for i in range(10): a = i * 2.5; m.ball(.18, '#b39ce6', (math.cos(a) * 1.6, .05, math.sin(a) * 1.6), (0, 0, 0), (1, .2, 1), sub=1)  # fallen flowers
    return m
@model
def tree_banana():
    m = Model('tree-banana', 23)
    m.cyl(.15, .23, 2.6, '#9aa65a', (0, 1.3, 0), seg=7); m.cyl(.1, .14, 1.6, '#a3ae62', (.4, .8, .2), (.2, 0, -.2), seg=6)
    for k in range(7): m.leaf(2.3, .7, '#5fa860' if k % 2 else '#4e9a52', (0, 2.55, 0), k * .9, droop=.1, bend=.5)
    m.cyl(.03, .03, .6, '#7a8a3a', (.25, 2.2, .1), (0, 0, .5), seg=4)
    for k in range(6): m.cyl(.05, .06, .3, '#e8d24a', (.42 + (k % 2) * .08, 1.95 - k * .07, .1 + (k % 3 - 1) * .08), (0, 0, .4), seg=5)
    m.uv(.12, '#8a2a4a', (.48, 1.55, .1), (0, 0, 0), (1, 1.6, 1), seg=7, ring=5)
    return m
@model
def tree_frangipani():
    m = Model('tree-frangipani', 24)
    m.cyl(.14, .22, 1.8, '#8a7a6a', (0, .9, 0), seg=7)
    for k in range(3): a = k * 2.1; m.cyl(.07, .11, 1.1, '#8a7a6a', (math.cos(a) * .3, 1.95, math.sin(a) * .3), (math.sin(a) * .5, 0, -math.cos(a) * .5), seg=6)
    canopy(m, [(0, 2.45, 0, .95), (.7, 2.25, .3, .7), (-.6, 2.3, -.3, .65)], ['#4f9a62', '#5aa86c', '#478f58'], sub=1, jitter=.2)
    for k in range(9):
        a = k * 2.3; x, y, z = math.cos(a) * .72, 2.85 + (k % 3) * .12, math.sin(a) * .72
        m.petals(5, .07, '#fff6dc', (x, y, z), size=.06, tilt=.3, shade=.02); m.uv(.03, '#ffd23f', (x, y + .02, z), seg=5, ring=4)
    return m
@model
def tree_peach():
    m = Model('tree-peach', 25)
    m.cyl(.12, .17, 1.6, '#6a4a32', (0, .8, 0), seg=7)
    for k in range(4): a = k * 1.7; m.cyl(.04, .07, .9, '#6a4a32', (math.cos(a) * .25, 1.75, math.sin(a) * .25), (math.sin(a) * .7, 0, -math.cos(a) * .7), seg=5)
    for k in range(26):
        a = k * 2.4; r = .3 + (k % 5) * .13; m.ball(.11 + (k % 3) * .03, '#ff9ec4' if k % 3 else '#ffc2da', (math.cos(a) * r, 1.9 + (k % 4) * .16, math.sin(a) * r), sub=1, jitter=.02)
    return m

# ---------- by the water (js/reeds.ts) ----------
@model
def reeds():
    m = Model('reeds', 26)
    for i, (x, z, h, c) in enumerate([(0, 0, 1.25, '#6f9a4a'), (.18, .08, 1.05, '#7fae52'), (-.15, .1, .95, '#5f8c40'), (.06, -.17, 1.15, '#88b45c'), (-.1, -.12, .85, '#6f9a4a'), (.22, -.1, .7, '#7fae52')]):
        m.cone(.05, h, c, (x, h / 2, z), ((z * .6), 0, -(x * .6)), seg=4)
    m.cyl(.05, .05, .22, '#7a4e2c', (.02, 1.08, .02), seg=6); m.cyl(.045, .045, .2, '#6e4426', (-.12, .92, .1), seg=6)
    return m
@model
def hyacinth():
    m = Model('hyacinth', 27)
    m.cyl(.42, .42, .03, '#4f9a52', (0, 0, 0), seg=10); m.cyl(.3, .3, .03, '#5fae5c', (.45, 0, .2), seg=9); m.cyl(.22, .22, .03, '#56a456', (-.3, 0, .35), seg=8)
    for k in range(5): m.uv(.08, '#b07ad8' if k % 2 else '#c99ae8', (.05 + math.cos(k) * .07, .12 + k * .03, math.sin(k) * .07), seg=6, ring=4)
    return m

# ---------- the farm (js/farm.ts): crops in three stages and the small props ----------
def sprout(m, n, h, c='#4fae4a'):
    for k in range(n): a = k * 2 * math.pi / n; m.leaf(h, h * .45, c, (math.cos(a) * .05, .02, math.sin(a) * .05), a, droop=1.0, bend=.35)
def stage1(name, seed):
    m = Model(name, seed); m.ball(.18, '#5a3a22', (0, 0, 0), (0, 0, 0), (1, .35, 1), sub=1); sprout(m, 3, .3); return m

@model
def carrot_1(): return stage1('carrot-1', 31)
@model
def carrot_2():
    m = Model('carrot-2', 32); m.ball(.2, '#5a3a22', (0, 0, 0), (0, 0, 0), (1, .35, 1), sub=1)
    for k in range(7): a = k * .9; m.cone(.05, .55, '#4fae4a', (math.cos(a) * .08, .28, math.sin(a) * .08), (math.sin(a) * .3, 0, -math.cos(a) * .3), seg=4)
    m.cone(.07, .2, '#ff8a2a', (0, .02, 0), (math.pi, 0, 0), seg=7); return m
@model
def carrot_3():
    m = Model('carrot-3', 33)
    for j, (x, z) in enumerate([(0, 0), (.35, .2), (-.3, .25)]):
        m.cone(.13, .45, '#ff8a2a', (x, .05, z), (math.pi, 0, 0), seg=8); m.cyl(.13, .13, .05, '#ff9a3a', (x, .27, z), seg=8)
        for k in range(6): a = k * 1.05 + j; m.cone(.04, .55, '#4fae4a', (x + math.cos(a) * .05, .55, z + math.sin(a) * .05), (math.sin(a) * .35, 0, -math.cos(a) * .35), seg=4)
    return m
@model
def strawberry_1(): return stage1('strawberry-1', 34)
@model
def strawberry_2():
    m = Model('strawberry-2', 35); sprout(m, 5, .4, '#3f9a45')
    for k in range(3): a = k * 2.1; m.petals(5, .05, '#ffffff', (math.cos(a) * .22, .32, math.sin(a) * .22), size=.05, tilt=.2, shade=.02)
    return m
@model
def strawberry_3():
    m = Model('strawberry-3', 36); sprout(m, 7, .45, '#3f9a45')
    for k in range(5):
        a = k * 1.25; x, z = math.cos(a) * .32, math.sin(a) * .32
        m.cone(.12, .22, '#e8333a', (x, .18, z), (math.pi, 0, 0), seg=8, jitter=.01); m.cone(.08, .05, '#3f9a45', (x, .31, z), seg=5)
        for s in range(4): m.uv(.012, '#ffe27a', (x + math.cos(s * 1.6) * .08, .2, z + math.sin(s * 1.6) * .08), seg=4, ring=3)
    return m
@model
def tomato_1(): return stage1('tomato-1', 37)
@model
def tomato_2():
    m = Model('tomato-2', 38); m.cyl(.015, .015, .9, '#c9a05a', (.15, .45, 0), seg=4); m.cyl(.03, .035, .7, '#3f8f3a', (0, .35, 0), seg=5)
    for k in range(6): m.leaf(.25, .14, '#4fae4a', (0, .2 + k * .09, 0), k * 2.3, droop=.3, bend=.2)
    for k in range(2): m.petals(5, .04, '#ffd23f', (math.cos(k * 3) * .12, .62, math.sin(k * 3) * .12), size=.035, tilt=.2, shade=.02)
    return m
@model
def tomato_3():
    m = Model('tomato-3', 39); m.cyl(.015, .015, 1.1, '#c9a05a', (.18, .55, 0), seg=4); m.cyl(.035, .04, .95, '#3f8f3a', (0, .47, 0), seg=5)
    for k in range(8): m.leaf(.3, .16, '#4fae4a', (0, .2 + k * .1, 0), k * 2.3, droop=.3, bend=.2)
    for k, (x, y, z) in enumerate([(.16, .55, .12), (-.14, .7, .1), (.05, .85, -.16), (-.12, .45, -.12), (.14, .9, .08)]):
        m.uv(.11, '#e8433a', (x, y, z), seg=9, ring=6); m.cone(.06, .04, '#3f8f3a', (x, y + .11, z), seg=5)
    return m
@model
def corn_1(): return stage1('corn-1', 40)
@model
def corn_2():
    m = Model('corn-2', 41); m.cyl(.04, .055, .8, '#6fae4a', (0, .4, 0), seg=6)
    for k in range(6): m.leaf(.5, .12, '#5fae4a' if k % 2 else '#4f9e45', (0, .15 + k * .1, 0), k * 2.6, droop=.1, bend=.6)
    return m
@model
def corn_3():
    m = Model('corn-3', 42)
    for j, (x, z) in enumerate([(0, 0), (.32, .18), (-.28, .2)]):
        h = 1.2 - j * .1; m.cyl(.04, .06, h, '#6fae4a', (x, h / 2, z), seg=6)
        for k in range(6): m.leaf(.55, .13, '#5fae4a' if k % 2 else '#4f9e45', (x, .15 + k * .14, z), k * 2.6 + j, droop=.1, bend=.6)
        m.uv(.08, '#ffd23f', (x + .09, h * .6, z), (0, 0, -.3), (1, 2.3, 1), seg=8, ring=6); m.leaf(.22, .12, '#9ac85a', (x + .05, h * .45, z), 0, droop=-1.1, bend=.1)
        m.cone(.04, .25, '#d9b07a', (x, h + .1, z), seg=4)
    return m
@model
def sunflower_1(): return stage1('sunflower-1', 43)
@model
def sunflower_2():
    m = Model('sunflower-2', 44); m.cyl(.035, .05, .7, '#5f9e3a', (0, .35, 0), seg=6)
    for k in range(4): m.leaf(.3, .2, '#4fae4a', (0, .2 + k * .12, 0), k * 1.7, droop=.2, bend=.3)
    m.ball(.1, '#6fae4a', (0, .74, 0), sub=1); return m
@model
def sunflower_3():
    m = Model('sunflower-3', 45); m.cyl(.04, .06, 1.1, '#5f9e3a', (0, .55, 0), seg=6)
    for k in range(5): m.leaf(.34, .22, '#4fae4a', (0, .2 + k * .14, 0), k * 1.7, droop=.2, bend=.3)
    # the head looks to the front (+z), a little up
    head = (0, 1.15, .05); m.cyl(.16, .16, .07, '#7a4a22', head, (math.pi / 2 - .3, 0, 0), seg=12)
    for k in range(12):
        a = k * math.pi / 6; m.ball(.09, '#ffc21a' if k % 2 else '#ffd23f', (math.cos(a) * .24, 1.15 + math.sin(a) * .24 * .95, .05 + math.sin(a) * .07), (0, 0, a), (1.5, .6, .35), sub=1, shade=.03)
    return m
@model
def pumpkin_1(): return stage1('pumpkin-1', 46)
@model
def pumpkin_2():
    m = Model('pumpkin-2', 47)
    for k in range(5): m.leaf(.4, .3, '#4fae4a', (0, .03, 0), k * 1.25, droop=.12, bend=.15)
    m.cyl(.015, .015, .5, '#5f9e3a', (.2, .05, 0), (0, 0, 1.4), seg=4); m.uv(.1, '#9ac85a', (.4, .1, 0), seg=8, ring=6); return m
@model
def pumpkin_3():
    m = Model('pumpkin-3', 48)
    for k in range(5): m.leaf(.45, .32, '#4fae4a', (0, .03, 0), k * 1.25, droop=.12, bend=.15)
    for k in range(8):
        a = k * math.pi / 4; m.uv(.22, '#ff7a1a' if k % 2 else '#ff8a2a', (math.cos(a) * .14, .26, math.sin(a) * .14), (0, -a, 0), (.7, 1, 1.15), seg=8, ring=7, shade=.04)
    m.cyl(.035, .05, .16, '#6a8a3a', (0, .52, 0), (0, 0, .25), seg=5)
    return m

@model
def farm_hay():
    m = Model('farm-hay', 49)
    m.box(1.6, .8, 1.1, '#8a5a3b', (0, .4, 0))
    for k in range(4): m.box(1.62, .06, .06, '#6e4426', (0, .2 + k * .18, .56))
    for k in range(9): m.ball(.32, '#f2d16b' if k % 2 else '#e8c25a', (-.6 + (k % 5) * .3, .9 + (k // 5) * .06, -.2 + (k // 5) * .35), (0, 0, 0), (1.1, .5, 1), sub=1, jitter=.05)
    return m
@model
def farm_crate():
    m = Model('farm-crate', 50)
    m.box(1.2, .7, 1, '#a9764a', (0, .35, 0))
    for y in (.15, .55): m.box(1.22, .08, 1.02, '#8a5a34', (0, y, 0))
    for k in range(6): m.uv(.1, '#fff6e6' if k % 2 else '#f2dcc0', (-.35 + (k % 3) * .35, .74, -.15 + (k // 3) * .3), (0, 0, 0), (1, 1.3, 1), seg=8, ring=6)
    return m
@model
def farm_wardrobe():
    m = Model('farm-wardrobe', 51)
    m.box(1.4, 2.1, .7, '#b07a4a', (0, 1.1, 0)); m.box(1.5, .12, .78, '#8a5a34', (0, 2.2, 0)); m.box(1.46, .1, .74, '#8a5a34', (0, .05, 0))
    for s in (-1, 1): m.box(.6, 1.7, .03, '#c08a58', (s * .33, 1.15, .36)); m.uv(.06, '#ffd23f', (s * .12, 1.2, .39), seg=6, ring=4)
    m.box(.05, 1.8, .03, '#6a4026', (0, 1.15, .37))
    return m
@model
def farm_easel():
    m = Model('farm-easel', 52)
    m.box(1.4, 1.1, .06, '#ffffff', (0, 1.6, 0), (-.15, 0, 0))
    for x, c in [(-.35, '#ff7eb8'), (0, '#7fd8ff'), (.3, '#ffd23f')]: m.ball(.16, c, (x, 1.65, .05), (0, 0, 0), (1, 1, .15), sub=1)
    m.cyl(.05, .05, 2, '#8a5a3b', (-.5, 1, -.2), (.1, 0, .15), seg=5); m.cyl(.05, .05, 2, '#8a5a3b', (.5, 1, -.2), (.1, 0, -.15), seg=5); m.cyl(.05, .05, 2, '#8a5a3b', (0, 1, .45), (-.3, 0, 0), seg=5)
    m.box(1.3, .06, .14, '#8a5a3b', (0, 1.02, .1))
    return m

# ---------- My House decorations (js/home-decor-models.ts) ----------
@model
def decor_teddy():
    m = Model('decor-teddy', 61)
    m.uv(.34, '#c18a5e', (0, .4, 0), seg=12, ring=9); m.uv(.29, '#dca679', (0, .91, 0), seg=12, ring=9); m.uv(.2, '#f5d7ab', (0, .4, .2), (0, 0, 0), (1, 1.1, .5), seg=10, ring=7)
    for s in (-1, 1):
        m.uv(.12, '#b67c54', (s * .23, 1.12, 0), seg=8, ring=6); m.uv(.06, '#f0c8a0', (s * .23, 1.12, .07), seg=6, ring=4)
        m.uv(.14, '#c18a5e', (s * .32, .52, .05), (0, 0, 0), (1, 1.2, 1), seg=8, ring=6); m.uv(.17, '#b67c54', (s * .2, .15, .1), seg=8, ring=6)
        m.uv(.035, '#382644', (s * .09, .95, .26), seg=6, ring=4)
    m.uv(.12, '#f5d7ab', (0, .84, .23), seg=8, ring=6); m.uv(.035, '#382644', (0, .87, .35), seg=6, ring=4)
    m.box(.3, .08, .06, '#e8433a', (0, .67, .2)); m.ball(.06, '#e8433a', (0, .67, .25), sub=1)
    return m
@model
def decor_clock():
    m = Model('decor-clock', 62)
    m.box(.8, .18, .55, '#885840', (0, .09, 0)); m.box(.55, 1.2, .4, '#bb875c', (0, .7, 0)); m.box(.4, .8, .02, '#2e2030', (0, .7, .2))
    m.cyl(.06, .06, .5, '#e7b953', (0, .55, .21), seg=5); m.cyl(.1, .1, .03, '#e7b953', (0, .3, .22), (math.pi / 2, 0, 0), seg=10)
    m.cyl(.42, .42, .13, '#f1c76c', (0, 1.6, 0), (math.pi / 2, 0, 0), seg=16); m.cyl(.34, .34, .02, '#fff7de', (0, 1.6, .07), (math.pi / 2, 0, 0), seg=16)
    m.box(.035, .22, .025, '#4a344c', (0, 1.7, .09)); m.box(.2, .035, .025, '#4a344c', (.08, 1.6, .09))
    for k in range(12): a = k * math.pi / 6; m.box(.03, .03, .01, '#4a344c', (math.cos(a) * .28, 1.6 + math.sin(a) * .28, .085))
    return m
@model
def decor_vase():
    m = Model('decor-vase', 63)
    m.cyl(.16, .25, .15, '#8e66ae', (0, .075, 0), seg=12); m.cyl(.32, .22, .65, '#ad8bd0', (0, .45, 0), seg=12); m.cyl(.17, .3, .25, '#8e66ae', (0, .9, 0), seg=12)
    m.cyl(.33, .33, .06, '#ffd23f', (0, .55, 0), seg=12)
    for k in range(3): a = k * 2.1; m.cyl(.015, .015, .5, '#5b935e', (math.cos(a) * .08, 1.2, math.sin(a) * .08), (math.sin(a) * .2, 0, -math.cos(a) * .2), seg=4); m.petals(5, .06, '#ff9ec4', (math.cos(a) * .13, 1.45, math.sin(a) * .13), size=.06, tilt=.3)
    return m
@model
def decor_lamp():
    m = Model('decor-lamp', 64)
    m.cyl(.3, .36, .12, '#bd8a5e', (0, .06, 0), seg=14); m.cyl(.045, .045, .9, '#d2a860', (0, .55, 0), seg=6); m.cyl(.24, .42, .5, '#ffe6a5', (0, 1.2, 0), seg=14)
    m.cyl(.43, .43, .04, '#e8b84a', (0, .96, 0), seg=14); m.uv(.09, '#f5b75a', (0, 1.51, 0), seg=8, ring=6)
    return m
def potted_flower(name, seed, petal, middle):
    m = Model(name, seed)
    m.cyl(.3, .22, .4, '#c98268', (0, .2, 0), seg=12); m.cyl(.32, .32, .06, '#b56f58', (0, .4, 0), seg=12); m.cyl(.27, .27, .02, '#5a3a22', (0, .41, 0), seg=12)
    m.cyl(.035, .035, .65, '#5b935e', (0, .72, 0), seg=5); m.leaf(.3, .16, '#5b935e', (0, .6, 0), .4, droop=.1, bend=.2); m.leaf(.28, .15, '#5b935e', (0, .7, 0), 3.5, droop=.1, bend=.2)
    for i in range(8): a = i * math.pi / 4; m.ball(.14, petal, (math.cos(a) * .23, 1 + math.sin(a) * .23, 0), (0, 0, a), (1.3, .7, .35), sub=1, shade=.04)
    m.cyl(.16, .16, .1, middle, (0, 1, .04), (math.pi / 2, 0, 0), seg=12)
    return m
@model
def decor_sunflower(): return potted_flower('decor-sunflower', 65, '#ffd35f', '#8e6642')
@model
def decor_lotus():
    m = Model('decor-lotus', 66)
    m.cyl(.3, .22, .4, '#c98268', (0, .2, 0), seg=12); m.cyl(.32, .32, .06, '#b56f58', (0, .4, 0), seg=12); m.cyl(.28, .28, .02, '#7cc3d6', (0, .41, 0), seg=12)
    m.cyl(.03, .03, .55, '#5b935e', (0, .68, 0), seg=5); m.cyl(.2, .2, .015, '#4f9a52', (.12, .43, .05), seg=10)
    for ring, (n, r, tilt, c) in enumerate([(8, .14, .9, '#f59bc7'), (6, .08, .5, '#f8b4d4')]):
        for i in range(n): a = i * 2 * math.pi / n + ring * .3; m.ball(.12, c, (math.cos(a) * r, .98 + ring * .05, math.sin(a) * r), (0, -a, tilt), (1.1, .4, .6), sub=1, shade=.03)
    m.uv(.07, '#ffdc74', (0, 1.02, 0), seg=7, ring=5)
    return m
@model
def decor_balloons():
    m = Model('decor-balloons', 67)
    m.cyl(.28, .34, .12, '#b98b64', (0, .06, 0), seg=12)
    for i, c in enumerate(['#ff99c5', '#81d9ed', '#ffd46b']):
        x = (i - 1) * .3; y = 1.35 + (.2 if i == 1 else 0)
        m.cyl(.008, .008, y - .3, '#d9c7aa', (x * .5, (y - .25) / 2 + .1, 0), (0, 0, -x * .25), seg=3)
        m.uv(.25, c, (x, y, 0), (0, 0, 0), (1, 1.15, 1), seg=12, ring=9, shade=.03); m.cone(.04, .07, c, (x, y - .3, 0), (math.pi, 0, 0), seg=5)
    return m

def main():
    want = [a for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]) if not a.startswith('-')]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for name, fn in M.items():
        if want and name not in want: continue
        m = fn(); t = m.tris(); m.save(); print(f'{name}: {t} triangles')

if __name__ == '__main__':
    main()

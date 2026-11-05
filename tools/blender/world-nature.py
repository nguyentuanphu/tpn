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
from mathutils import Vector, Matrix, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'models', 'world', 'raw')

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c]

def euler3(rx, ry, rz):  # three.js Euler 'XYZ': M = Rx * Ry * Rz
    return Matrix.Rotation(rx, 4, 'X') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rz, 4, 'Z')

class Model:
    """one mesh, colours per corner; parts placed in game coordinates.
    Refined look (owner, 6 Nov 2026 AEDT: "still very scratchy"): smooth shading with hard edges only on real corners,
    soft painted light (lighter where the sun reaches, darker low and inside) with one tone per part, never a random
    shade per triangle, and smooth lumps (noise) instead of random spikes."""
    def __init__(self, name, seed=1):
        self.name = name; self.bm = bmesh.new(); self.col = self.bm.loops.layers.float_color.new('Col'); self.rnd = random.Random(seed)

    def _add(self, make, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), jitter=0.0, shade=.06, top=.14, warp=None, lumps=1.6):
        tmp = bmesh.new(); make(tmp)
        if warp:
            for v in tmp.verts: v.co = Vector(warp(v.co))
        if jitter:  # smooth lumps: a soft noise pushes the surface in and out (no spikes)
            r = max((v.co.length for v in tmp.verts), default=1) or 1
            off = Vector((self.rnd.random() * 50, self.rnd.random() * 50, self.rnd.random() * 50))
            for v in tmp.verts:
                n = v.co.normalized() if v.co.length > 1e-6 else Vector((0, 1, 0))
                v.co += n * jitter * noise.noise(v.co / r * lumps + off) * 1.6
        M = Matrix.Translation(Vector(pos)) @ euler3(*rot) @ Matrix.Diagonal(Vector((*scl, 1)))
        bmesh.ops.transform(tmp, matrix=M, verts=tmp.verts)
        tmp.normal_update()
        base = lin(color) if isinstance(color, str) else color
        me = bpy.data.meshes.new('t'); tmp.to_mesh(me); tmp.free()
        n0 = len(self.bm.faces); self.bm.from_mesh(me); bpy.data.meshes.remove(me)
        self.bm.faces.ensure_lookup_table(); self.bm.normal_update()
        tone = 1 + (self.rnd.random() - .5) * 2 * shade  # one tone for the whole part
        for f in self.bm.faces[n0:]:
            for l in f.loops:
                ny = l.vert.normal.y
                k = tone * (1 + max(0, ny) * top - max(0, -ny) * top * 1.2)
                l[self.col] = [min(1, x * k) for x in base] + [1]
        return self

    # three.js-style primitives (centred like three's: cylinder and cone along y, cone tip up)
    def cyl(self, rt, rb, h, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=10, **k):
        def mk(b):
            bmesh.ops.create_cone(b, cap_ends=True, cap_tris=False, segments=seg, radius1=rb, radius2=rt, depth=h)
            bmesh.ops.rotate(b, verts=b.verts, matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
        return self._add(mk, color, pos, rot, scl, **k)
    def cone(self, r, h, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=10, **k):
        return self.cyl(0.001, r, h, color, pos, rot, scl, seg, **k)
    def ball(self, r, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), sub=2, jitter=0.0, **k):
        return self._add(lambda b: bmesh.ops.create_icosphere(b, subdivisions=sub + 1, radius=r), color, pos, rot, scl, jitter=jitter, **k)
    def uv(self, r, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=12, ring=8, **k):
        return self._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=seg, v_segments=ring, radius=r), color, pos, rot, scl, **k)
    def box(self, w, h, d, color, pos=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, **k):
        def mk(b):
            bmesh.ops.create_cube(b, size=1)
            if bevel: bmesh.ops.bevel(b, geom=list(b.edges), offset=bevel / max(.05, min(w, h, d)), segments=1, affect='EDGES')
        return self._add(mk, color, pos, rot, (w, h, d), **k)
    def trunk(self, pts, r0, r1, color, seg=9, flare=1.6, **k):
        """a tapering trunk or branch along points, with a root flare at its foot"""
        n = len(pts); rad = [r0 + (r1 - r0) * (i / (n - 1)) for i in range(n)]
        if flare > 1: rad[0] *= flare
        def mk(b):
            P = [Vector(p) for p in pts]; rings = []
            for i, p in enumerate(P):
                t = (P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized(); up = Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0))
                x = t.cross(up).normalized(); y = t.cross(x).normalized()
                rings.append([b.verts.new(p + (x * math.cos(a) + y * math.sin(a)) * rad[i]) for a in [2 * math.pi * s / seg for s in range(seg)]])
            for i in range(n - 1):
                for s in range(seg): b.faces.new((rings[i][s], rings[i + 1][s], rings[i + 1][(s + 1) % seg], rings[i][(s + 1) % seg]))
            b.faces.new(rings[-1]); b.faces.new(list(reversed(rings[0])))
        return self._add(mk, color, **k)
    def leaf(self, length, width, color, pos, yaw, droop=.5, bend=.35, n=7, fold=.25, **k):
        """a leaf: a bent strip with a folded midrib from its root at pos outwards along yaw (both sides seen)"""
        def mk(b):
            vs = []
            th = .008 + width * .015
            for i in range(n + 1):
                t = i / n; x = t * length; y = -(t * t) * length * bend; w = width * math.sin(math.pi * min(1, t * .95 + .05)) ** .8 * .5
                vs.append([b.verts.new((x, y + o, -w)) for o in (0, -th)] + [b.verts.new((x, y + w * fold + o, 0)) for o in (0, -th)] + [b.verts.new((x, y + o, w)) for o in (0, -th)])
            for i in range(n):
                a, c = vs[i], vs[i + 1]
                b.faces.new((a[0], c[0], c[2], a[2])); b.faces.new((a[2], c[2], c[4], a[4]))
                b.faces.new((a[3], c[3], c[1], a[1])); b.faces.new((a[5], c[5], c[3], a[3]))
        return self._add(mk, color, pos, (0, yaw, droop), top=.08, **k)
    def frond(self, length, color, pos, yaw, droop=.3, bend=.5, pairs=7, leaflet=.8, **k):
        """a palm frond: a curved stem with pairs of narrow leaflets along it"""
        for i in range(pairs):
            t = (i + 1) / (pairs + 1); x = t * length; y = -(t * t) * length * bend
            ca, sa = math.cos(droop), math.sin(droop)
            px, py = x * ca - y * sa, x * sa + y * ca  # the point on the stem, tilted by droop
            for side in (-1, 1):
                L = leaflet * (1 - abs(t - .45) * .9)
                self.leaf(L, .14, color, (pos[0] + px * math.cos(yaw), pos[1] + py, pos[2] - px * math.sin(yaw)), yaw + side * 1.15, droop=droop - .5 - t * .6, bend=.4, n=2, fold=.1, **k)
        self.leaf(length, .07, color, pos, yaw, droop=droop, bend=bend, n=6, fold=.0, **k)
        return self
    def petals(self, n, r, color, pos, size=.12, tilt=.5, sub=1, **k):
        for i in range(n):
            a = i * 2 * math.pi / n
            self.ball(size, color, (pos[0] + math.cos(a) * r, pos[1], pos[2] + math.sin(a) * r), (0, -a, tilt), (1.3, .35, .8), sub=sub, top=.06, **k)
        return self
    def puffs(self, centre, radii, n, size, cols, sub=1, skip=-.35, core=True, jitter=.22, seed=0, seg=14):
        """a picture-book canopy: a soft core and puffs spread over it like a cloud (fewer underneath)"""
        cx, cy, cz = centre; rx, ry, rz = radii
        if core: self._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=16, v_segments=10, radius=1), cols[0], centre, (0, 0, 0), (rx * .92, ry * .92, rz * .92), jitter=.08, shade=.03)
        ga = math.pi * (3 - math.sqrt(5))
        for i in range(n):
            yy = 1 - 2 * (i + .5) / n
            if yy < skip: continue
            rr = math.sqrt(1 - yy * yy); a = i * ga + seed
            s = size * (.8 + .4 * ((i * 7 + seed * 3) % 5) / 4)
            self._add(lambda b, s=s: bmesh.ops.create_uvsphere(b, u_segments=seg, v_segments=max(5, seg * 4 // 7), radius=s), cols[(i + 1) % len(cols)],
                      (cx + math.cos(a) * rr * rx, cy + yy * ry, cz + math.sin(a) * rr * rz), (self.rnd.random(), self.rnd.random() * 6, 0), jitter=jitter * s * .22, top=.18)
        return self

    def tris(self):
        return sum(len(f.verts) - 2 for f in self.bm.faces)

    def save(self):
        # soft shade from the ground up (a little darker low down), then game (x, y, z) -> Blender (x, -z, y)
        ys = [v.co.y for v in self.bm.verts]; y0, y1 = min(ys), max(ys); H = max(.01, y1 - y0)
        for f in self.bm.faces:
            for l in f.loops:
                t = (l.vert.co.y - y0) / H; k = .84 + .2 * min(1, t * 1.4); c = l[self.col]; l[self.col] = [min(1, c[0] * k), min(1, c[1] * k), min(1, c[2] * k), 1]
        bmesh.ops.transform(self.bm, matrix=Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1))), verts=self.bm.verts)
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.0)
        bmesh.ops.triangulate(self.bm, faces=self.bm.faces)
        # smooth shading; hard edges only where faces meet at a real corner (boxes, caps, leaf rims)
        for f in self.bm.faces: f.smooth = True
        for e in self.bm.edges:
            e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(66))
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

LEAF = ['#2f7f5f', '#3a8d68', '#2a7656', '#46a077', '#358a62']

def tier(m, r, h, y, color, scallops=9, droop=.28, turn=0.0, seg=36):
    """one tier of a pine: a cone whose rim hangs down in soft scallops (the picture-book fir)"""
    def mk(b):
        tip = b.verts.new((0, h * .5, 0)); rings = []
        for k, (rr, yy) in enumerate([(.45, h * .05), (1.0, -h * .5)]):
            ring = []
            for s in range(seg):
                a = 2 * math.pi * s / seg + turn; w = .5 + .5 * math.cos(a * scallops)
                R = r * rr * (1 + (.08 * w if k else 0)); Y = yy - (droop * r * w if k else 0)
                ring.append(b.verts.new((math.cos(a) * R, Y, math.sin(a) * R)))
            rings.append(ring)
        for s in range(seg): b.faces.new((tip, rings[0][(s + 1) % seg], rings[0][s]))
        for s in range(seg): b.faces.new((rings[0][s], rings[0][(s + 1) % seg], rings[1][(s + 1) % seg], rings[1][s]))
        ctr = b.verts.new((0, -h * .5 + r * .15, 0))
        for s in range(seg): b.faces.new((rings[1][s], rings[1][(s + 1) % seg], ctr))
    m._add(mk, color, (0, y, 0), top=.2)

# ---------- trees and plants of the valley (js/world.ts) ----------
@model
def tree_round():
    m = Model('tree-round', 11)
    m.trunk([(0, 0, 0), (0, 1.4, 0), (.05, 2.8, 0), (.1, 3.6, 0)], .36, .2, BARK)
    m.trunk([(0, 2.6, 0), (.6, 3.3, .1), (1.1, 3.9, .2)], .14, .07, BARK, seg=6, flare=1)
    m.trunk([(0, 2.5, 0), (-.5, 3.2, .2), (-.9, 3.8, .3)], .13, .07, BARK, seg=6, flare=1)
    m.puffs((0, 4.9, 0), (2.4, 1.7, 2.3), 11, 1.2, LEAF, seed=1)
    return m
@model
def tree_apple():
    m = Model('tree-apple', 12)
    m.trunk([(0, 0, 0), (0, 1.2, 0), (.08, 2.6, .05)], .4, .26, BARK2)
    m.trunk([(0, 2.1, 0), (.6, 2.8, .3), (.9, 3.2, .4)], .12, .07, BARK2, seg=6, flare=1)
    m.puffs((0, 4.0, 0), (2.1, 1.6, 2.1), 9, 1.15, ['#348a63', '#3f9a6c', '#2f7f5a', '#46a077'], seed=2)
    for i, p in enumerate([(x * 1.42, 4.0 + (y - 4.0) * 1.3, z * 1.42) for x, y, z in [(1.7, 4.1, .8), (-1.5, 3.6, 1.1), (.4, 4.5, -1.9), (-.6, 5.3, 1.1), (1.2, 3.2, -1.3), (-1.8, 4.3, -.6), (1, 5.2, 1.1), (.2, 3.0, 1.9)]]):
        m.uv(.28, '#e8433a', p, scl=(1, .92, 1), seg=10, ring=7, top=.25); m.leaf(.22, .1, '#3f9a45', (p[0], p[1] + .24, p[2]), i * 1.3, droop=.5, bend=.2, n=3)
    return m
def pine(name, seed, cols, snow=False):
    m = Model(name, seed)
    m.trunk([(0, 0, 0), (0, 1.4, 0), (0, 2.4, 0)], .34, .22, '#6e4a32')
    for i, (r, h, y) in enumerate([(2.1, 2.4, 2.75), (1.75, 2.1, 3.95), (1.35, 1.9, 5.05), (.9, 1.7, 6.2)]):
        tier(m, r, h, y, cols[i], turn=i * .35)
        if snow and i < 2: tier(m, r * .6, .5, y + h * .32, '#f4f8ff', scallops=7, droop=.18, turn=i)
    return m
@model
def tree_pine(): return pine('tree-pine', 13, ['#25664f', '#2c7558', '#307d5c', '#348462'])
@model
def tree_snowpine(): return pine('tree-snowpine', 14, ['#2f6a4f', '#356f53', '#e9f2ff', '#ffffff'], snow=True)
@model
def tree_bamboo():
    m = Model('tree-bamboo', 15)
    for i, (x, z) in enumerate([(0, 0), (.7, .3), (-.5, .6), (.2, -.7), (-.7, -.3), (.55, -.45)]):
        h = 7 + (i % 3) * 1.6; tip = (x * 1.08 + .1 * math.sin(i), h, z * 1.08)
        pts = [(x, 0, z), (x + (tip[0] - x) * .4, h * .4, z + (tip[2] - z) * .4), tip]
        m.trunk(pts, .15, .11, '#8cc65a' if i % 2 else '#7fbb50', seg=7, flare=1)
        for k in range(1, 6): t = k / 6; m.cyl(.155, .155, .07, '#6a9a3a', (x + (tip[0] - x) * t, h * t, z + (tip[2] - z) * t), seg=7, top=.05)
        for k in range(5):
            a = k * 1.4 + i; m.leaf(1.2, .26, '#5fae4a' if k % 2 else '#4f9a42', (tip[0], h - .4 - k * .45, tip[2]), a, droop=.35, bend=.6, n=4)
    return m
@model
def tree_palm():
    m = Model('tree-palm', 16)
    pts = [(0, 0, 0), (.08, 1.1, 0), (.18, 2.2, 0), (.3, 3.3, 0), (.45, 4.4, 0), (.6, 5.3, 0)]
    m.trunk(pts, .34, .2, '#a07848', seg=9, flare=1.3)
    for i in range(1, 5): p = pts[i]; m.cyl(.3 - i * .025, .34 - i * .025, .12, '#8f6a3e', p, (0, 0, -.1), seg=9, top=.05)  # the rings of old leaves
    for i in range(8):
        m.frond(3.0, '#4fae4a' if i % 2 else '#3d9a42', (.6, 5.35, 0), i * math.pi / 4 + .2, droop=.35 + (i % 3) * .1, bend=.5)
    for p in [(.75, 5.1, .25), (.45, 5.05, -.25), (.8, 5.0, -.15)]: m.uv(.22, '#7a5a2a', p, seg=9, ring=6)
    return m
@model
def bush():
    m = Model('bush', 17)
    m.puffs((0, .75, 0), (1.25, .65, 1.15), 8, .68, ['#24654f', '#30785c', '#2a6d55', '#358062'], skip=-.1, seed=9, seg=12)
    return m
@model
def flower_meadow():
    """white petals and a yellow middle: the game tints each flower (setColorAt), as before"""
    m = Model('flower-meadow', 18)
    m.trunk([(0, 0, 0), (.02, .3, 0), (0, .6, 0)], .03, .022, '#4f9e45', seg=5, flare=1)
    m.leaf(.25, .1, '#5fb04a', (0, .15, 0), .5, droop=.6, bend=.3, n=4); m.leaf(.22, .09, '#5fb04a', (0, .22, 0), 3.6, droop=.6, bend=.3, n=4)
    m.petals(6, .14, '#ffffff', (0, .62, 0), size=.12, tilt=.3, sub=0)
    m.uv(.075, '#ffd23f', (0, .645, 0), scl=(1, .6, 1), seg=8, ring=5)
    return m

# ---------- along the roads (js/roads.ts) ----------
@model
def flower_roadside():
    """the stem, leaf and yellow middle of a roadside flower (its tinted petals stay their own disc)"""
    m = Model('flower-roadside', 19)
    m.trunk([(0, 0, 0), (.01, .18, 0), (0, .36, 0)], .016, .012, '#4f9a3c', seg=5, flare=1)
    m.uv(.048, '#ffd23f', (0, .375, 0), scl=(1, .45, 1), seg=8, ring=5)
    m.leaf(.09, .05, '#5fb04a', (0, .08, 0), 0, droop=.7, bend=.3, n=3); m.leaf(.08, .045, '#5fb04a', (0, .12, 0), 3, droop=.7, bend=.3, n=3)
    return m
@model
def bush_bougainvillea():
    m = Model('bush-bougainvillea', 20)
    m.puffs((0, .62, 0), (.68, .5, .62), 8, .34, ['#4f8f3e', '#5a9a46', '#47843a'], skip=-.2, seed=4, seg=10)
    for i in range(16):  # the paper-pink flower clusters over the leaves
        a = i * 2.4; yy = .2 + .75 * ((i * 5) % 16) / 16; rr = math.sqrt(max(0, 1 - (yy - .45) ** 2 * 2)) * .68
        m.uv(.11 + (i % 3) * .025, '#e0328c' if i % 3 else '#f05aa6', (math.cos(a) * rr, .3 + yy * .9, math.sin(a) * rr), seg=9, ring=6, top=.2)
    return m
@model
def tree_gum():
    m = Model('tree-gum', 21)
    m.trunk([(0, 0, 0), (.05, 2.4, 0), (-.05, 4.2, 0), (.05, 5.6, 0)], .3, .16, '#e9e1d2', flare=1.4)
    m.trunk([(0, 3.8, 0), (.7, 4.8, .1), (1.2, 5.6, .3)], .12, .07, '#e3d9c6', seg=6, flare=1)
    m.trunk([(0, 3.6, 0), (-.6, 4.5, .2), (-1, 5.3, -.2)], .11, .06, '#e3d9c6', seg=6, flare=1)
    for k in range(6): m.box(.09, .55, .02, '#c9bba5', (math.cos(k * 1.3) * .25, .9 + k * .75, math.sin(k * 1.3) * .25), (0, -k * 1.3, 0))  # peeling bark
    # the gum's open, drooping crown: separate clumps of grey-green leaves, sky between them
    for j, (c, rad) in enumerate([((.1, 6.3, 0), (1.1, .6, 1.0)), ((1.4, 5.7, .4), (.9, .5, .8)), ((-1.1, 5.6, -.4), (.95, .5, .85)), ((.2, 5.2, -1.1), (.7, .4, .7))]):
        m.puffs(c, rad, 6, .5, ['#7a9a6a', '#86a676', '#6f8f60'], skip=-.3, core=False, seed=j + 5, seg=10)
    return m

# ---------- the towns' trees (js/town.ts; the Sa Pa peach tree in js/s2vn.ts) ----------
@model
def tree_jacaranda():
    m = Model('tree-jacaranda', 22)
    m.trunk([(0, 0, 0), (.05, 1.6, 0), (0, 3.0, 0)], .42, .24, '#6b5040')
    m.trunk([(0, 2.6, 0), (.8, 3.3, .2), (1.4, 3.8, .4)], .15, .08, '#6b5040', seg=6, flare=1)
    m.trunk([(0, 2.5, 0), (-.8, 3.2, -.1), (-1.4, 3.7, -.2)], .15, .08, '#6b5040', seg=6, flare=1)
    m.puffs((0, 4.7, 0), (2.5, 1.5, 2.3), 11, 1.15, ['#9c7fd6', '#b39ce6', '#8a6cc8', '#c3b0ee'], seed=6)
    for i in range(12): a = i * 2.5; r = 1.2 + (i % 4) * .3; m.ball(.16, '#b39ce6', (math.cos(a) * r, .03, math.sin(a) * r), (0, a, 0), (1, .18, 1), sub=0, top=0)  # fallen flowers
    return m
@model
def tree_banana():
    m = Model('tree-banana', 23)
    m.trunk([(0, 0, 0), (.02, 1.3, 0), (0, 2.6, 0)], .24, .15, '#9aa65a', flare=1.2)
    m.trunk([(.4, 0, .2), (.42, .8, .22), (.4, 1.5, .2)], .15, .1, '#a3ae62', seg=7, flare=1.2)  # a young shoot beside it
    for k in range(7): m.leaf(2.3, .75, '#5fa860' if k % 2 else '#4e9a52', (0, 2.55, 0), k * .9, droop=.55, bend=.6, n=9, fold=.3)
    m.trunk([(0, 2.4, 0), (.25, 2.3, .1), (.45, 2.0, .1)], .03, .025, '#7a8a3a', seg=5, flare=1)
    for k in range(7): m.uv(.055, '#e8d24a', (.4 + (k % 2) * .09, 1.98 - k * .065, .1 + (k % 3 - 1) * .08), (0, 0, .4), (1, 3.2, 1), seg=7, ring=5)
    m.uv(.12, '#8a2a4a', (.5, 1.5, .1), (0, 0, 0), (1, 1.6, 1), seg=9, ring=6)
    return m
@model
def tree_frangipani():
    m = Model('tree-frangipani', 24)
    m.trunk([(0, 0, 0), (0, 1.0, 0), (0, 1.7, 0)], .22, .15, '#8a7a6a', flare=1.3)
    for k in range(4):
        a = k * 1.57 + .3; ex, ez = math.cos(a) * .85, math.sin(a) * .85
        m.trunk([(0, 1.6, 0), (ex * .5, 2.1, ez * .5), (ex, 2.5, ez)], .09, .06, '#8a7a6a', seg=6, flare=1)
        for j in range(5): m.leaf(.6, .22, '#4f9a62' if j % 2 else '#5aa86c', (ex, 2.5, ez), j * 1.05 + a, droop=.45, bend=.4, n=4)  # a rosette of leaves at the tip
        for f in range(3):  # its cream flowers with yellow hearts
            fa = f * 2.1 + a; fx, fz = ex + math.cos(fa) * .12, ez + math.sin(fa) * .12
            m.petals(5, .06, '#fff6dc', (fx, 2.72 + f * .04, fz), size=.06, tilt=.3, sub=0); m.uv(.03, '#ffd23f', (fx, 2.74 + f * .04, fz), seg=6, ring=4)
    return m
@model
def tree_peach():
    m = Model('tree-peach', 25)
    m.trunk([(0, 0, 0), (.05, .8, 0), (0, 1.6, 0)], .17, .11, '#6a4a32', flare=1.3)
    for k in range(4):
        a = k * 1.7; ex, ez = math.cos(a) * .6, math.sin(a) * .6
        m.trunk([(0, 1.5, 0), (ex * .5, 1.9, ez * .5), (ex, 2.2, ez)], .06, .035, '#6a4a32', seg=5, flare=1)
    m.puffs((0, 2.1, 0), (.75, .45, .75), 20, .18, ['#ff9ec4', '#ffc2da', '#ff8ab8'], skip=-.4, core=False, seed=7, seg=9)
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
    m.cyl(.42, .42, .03, '#4f9a52', (0, 0, 0), seg=16); m.cyl(.3, .3, .03, '#5fae5c', (.45, 0, .2), seg=14); m.cyl(.22, .22, .03, '#56a456', (-.3, 0, .35), seg=12)
    for k in range(4): m.leaf(.22, .14, '#5fae5c', (0, .02, 0), k * 1.6, droop=1.0, bend=.4, n=4)
    for k in range(5): m.uv(.08, '#b07ad8' if k % 2 else '#c99ae8', (.05 + math.cos(k) * .07, .12 + k * .03, math.sin(k) * .07), seg=6, ring=4)
    return m

# ---------- the farm (js/farm.ts): crops in three stages and the small props ----------
SOIL = '#5a3a22'
def mound(m, r=.2): m.ball(r, SOIL, (0, 0, 0), (0, 0, 0), (1, .32, 1), sub=1, jitter=.02, top=.05)
def sprout(m, n, h, c='#4fae4a', w=.45, droop=1.0):
    for k in range(n): a = k * 2 * math.pi / n + .3; m.leaf(h, h * w, c, (math.cos(a) * .04, .03, math.sin(a) * .04), a, droop=droop, bend=.4, n=5)
def stem(m, h, c='#4f9e45', r=.02, lean=.0): m.trunk([(0, 0, 0), (lean * .5, h * .5, 0), (lean, h, 0)], r, r * .7, c, seg=5, flare=1)
def round_leaf(m, r, c, pos, yaw, tilt=.35): m.ball(r, c, pos, (0, -yaw, tilt), (1.25, .18, 1), sub=1, top=.12)
def berry(r, taper=.55):  # a strawberry: round on top, pointed underneath
    return lambda v: (v.x * (1 + min(0, v.y) / r * taper), v.y * (1.15 if v.y < 0 else .9), v.z * (1 + min(0, v.y) / r * taper))

@model
def carrot_1():  # feathery first leaves
    m = Model('carrot-1', 31); mound(m)
    for k in range(4): a = k * 1.6; m.leaf(.28, .07, '#5fb04a', (0, .03, 0), a, droop=1.15, bend=.35, n=5)
    return m
@model
def carrot_2():
    m = Model('carrot-2', 32); mound(m, .22)
    for k in range(7): a = k * .9; m.leaf(.5, .09, '#4fae4a' if k % 2 else '#5fb04a', (math.cos(a) * .03, .03, math.sin(a) * .03), a, droop=1.2, bend=.45, n=6)
    m.cone(.07, .2, '#ff8a2a', (0, .02, 0), (math.pi, 0, 0), seg=10); return m
@model
def carrot_3():
    m = Model('carrot-3', 33)
    for j, (x, z) in enumerate([(0, 0), (.35, .2), (-.3, .25)]):
        m.cone(.13, .45, '#ff8a2a', (x, .05, z), (math.pi, 0, 0), seg=12); m.uv(.13, '#ff9a3a', (x, .27, z), scl=(1, .35, 1), seg=12, ring=6)
        for k in range(6): a = k * 1.05 + j; m.leaf(.55, .1, '#4fae4a' if k % 2 else '#5fb04a', (x, .3, z), a, droop=1.15, bend=.4, n=6)
    return m
@model
def strawberry_1():  # three round leaves on little stalks
    m = Model('strawberry-1', 34); mound(m)
    for k in range(3): a = k * 2.1; round_leaf(m, .08, '#3f9a45', (math.cos(a) * .1, .17, math.sin(a) * .1), a); m.leaf(.12, .02, '#4f9e45', (0, .03, 0), a, droop=1.1, bend=.2, n=3)
    return m
@model
def strawberry_2():
    m = Model('strawberry-2', 35)
    for k in range(6): a = k * 1.05; round_leaf(m, .11, '#3f9a45' if k % 2 else '#4aa64c', (math.cos(a) * .2, .2 + (k % 2) * .05, math.sin(a) * .2), a); m.leaf(.22, .025, '#4f9e45', (0, .02, 0), a, droop=.9, bend=.2, n=3)
    for k in range(3): a = k * 2.1 + .5; m.petals(5, .045, '#ffffff', (math.cos(a) * .2, .34, math.sin(a) * .2), size=.045, tilt=.2, sub=0); m.uv(.022, '#ffd23f', (math.cos(a) * .2, .35, math.sin(a) * .2), seg=6, ring=4)
    return m
@model
def strawberry_3():
    m = Model('strawberry-3', 36)
    for k in range(7): a = k * .9; round_leaf(m, .12, '#3f9a45' if k % 2 else '#4aa64c', (math.cos(a) * .22, .26 + (k % 2) * .05, math.sin(a) * .22), a); m.leaf(.26, .025, '#4f9e45', (0, .02, 0), a, droop=.9, bend=.2, n=3)
    for k in range(5):
        a = k * 1.25 + .4; x, z = math.cos(a) * .34, math.sin(a) * .34
        m._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=12, v_segments=8, radius=.1), '#e8333a', (x, .13, z), warp=berry(.1), top=.25)
        for s in range(5): m.leaf(.07, .04, '#3f9a45', (x, .22, z), s * 1.26, droop=-.2, bend=.2, n=2)
        for s in range(6): m.uv(.011, '#ffe27a', (x + math.cos(s * 1.05) * .085, .12 + (s % 2) * .04, z + math.sin(s * 1.05) * .085), seg=4, ring=3)
    return m
@model
def tomato_1():  # two seed leaves and a first jagged leaf
    m = Model('tomato-1', 37); mound(m); stem(m, .16, '#3f8f3a', .018)
    for s in (-1, 1): m.leaf(.14, .06, '#4fae4a', (0, .16, 0), s * 1.57, droop=.4, bend=.2, n=4)
    m.leaf(.12, .08, '#45a046', (0, .15, 0), 0, droop=.9, bend=.3, n=4)
    return m
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
def corn_1():  # grass-like blades
    m = Model('corn-1', 40); mound(m)
    for k in range(3): m.leaf(.32, .06, '#6fbf4f', (0, .03, 0), k * 2.2, droop=1.25, bend=.5, n=5)
    return m
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
def sunflower_1():  # two round seed leaves on a short stem
    m = Model('sunflower-1', 43); mound(m); stem(m, .22, '#5f9e3a', .022)
    for s_ in (-1, 1): round_leaf(m, .08, '#5fb04a', (s_ * .08, .23, 0), 0, tilt=s_ * -.3)
    return m
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
def pumpkin_1():  # two seed leaves and one broad round leaf
    m = Model('pumpkin-1', 46); mound(m); stem(m, .14, '#5f9e3a', .022)
    for s_ in (-1, 1): round_leaf(m, .07, '#5fb04a', (s_ * .07, .15, 0), 0, tilt=s_ * -.3)
    round_leaf(m, .11, '#4fae4a', (0, .19, .07), 1.57, tilt=-.4)
    return m
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

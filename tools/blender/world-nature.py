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

HD = False
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
        self.hd = HD  # (owner, 6 Nov 2026 AEDT: "Detailed up close") the close-up version: rounder, more leaves and petals
    def S(self, n, f=1.6): return int(round(n * f)) if self.hd else n

    def _add(self, make, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), jitter=0.0, shade=.06, top=.14, warp=None, lumps=1.6, ao=None):
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
                if ao:  # inside a canopy: darker towards its heart, so the puffs read as a full crown with depth
                    (cx, cy, cz), (rx, ry, rz), st = ao; v = l.vert.co
                    d = math.sqrt(((v.x - cx) / rx) ** 2 + ((v.y - cy) / ry) ** 2 + ((v.z - cz) / rz) ** 2)
                    k *= max(1 - st, min(1.06, 1 - st + st * d))
                l[self.col] = [min(1, x * k) for x in base] + [1]
        return self

    # three.js-style primitives (centred like three's: cylinder and cone along y, cone tip up)
    def cyl(self, rt, rb, h, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=10, **k):
        seg = self.S(seg)
        def mk(b):
            bmesh.ops.create_cone(b, cap_ends=True, cap_tris=False, segments=seg, radius1=rb, radius2=rt, depth=h)
            bmesh.ops.rotate(b, verts=b.verts, matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
        return self._add(mk, color, pos, rot, scl, **k)
    def cone(self, r, h, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=10, **k):
        return self.cyl(0.001, r, h, color, pos, rot, scl, seg, **k)
    def ball(self, r, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), sub=2, jitter=0.0, **k):
        if self.hd and sub <= 1: sub += 1
        return self._add(lambda b: bmesh.ops.create_icosphere(b, subdivisions=sub + 1, radius=r), color, pos, rot, scl, jitter=jitter, **k)
    def uv(self, r, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=12, ring=8, **k):
        seg, ring = self.S(seg, 1.5), self.S(ring, 1.5)
        return self._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=seg, v_segments=ring, radius=r), color, pos, rot, scl, **k)
    def box(self, w, h, d, color, pos=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, seg=2, **k):
        """a box; bevel (metres) rounds its edges like a wooden toy"""
        def mk(b):
            bmesh.ops.create_cube(b, size=1)
            bmesh.ops.scale(b, vec=(w, h, d), verts=b.verts)
            if bevel: bmesh.ops.bevel(b, geom=list(b.edges), offset=min(bevel, min(w, h, d) * .45), segments=seg, affect='EDGES', profile=.5)
        return self._add(mk, color, pos, rot, (1, 1, 1), **k)
    def lathe(self, prof, color, pos=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1), seg=20, ribs=0, rib=0.0, **k):
        """a turned shape: the profile [(radius, height), ...] from the bottom up, spun round (ribs: a pumpkin's grooves)"""
        seg = self.S(seg, 1.5)
        def mk(b):
            rings = []
            for (rr, yy) in prof:
                ring = []
                for s_ in range(seg):
                    a = 2 * math.pi * s_ / seg; R = rr * (1 - rib * (1 - abs(math.cos(a * ribs / 2))) if ribs else 1)
                    ring.append(b.verts.new((math.cos(a) * R, yy, math.sin(a) * R)))
                rings.append(ring)
            for i in range(len(rings) - 1):
                for s_ in range(seg): b.faces.new((rings[i][s_], rings[i + 1][s_], rings[i + 1][(s_ + 1) % seg], rings[i][(s_ + 1) % seg]))
            if prof[0][0] > 1e-4: b.faces.new(list(reversed(rings[0])))
            if prof[-1][0] > 1e-4: b.faces.new(rings[-1])
            bmesh.ops.remove_doubles(b, verts=b.verts, dist=1e-6); bmesh.ops.recalc_face_normals(b, faces=b.faces)
        return self._add(mk, color, pos, rot, scl, **k)
    def trunk(self, pts, r0, r1, color, seg=9, flare=1.6, **k):
        """a tapering trunk or branch along points, with a root flare at its foot"""
        seg = self.S(seg, 1.5)
        if self.hd and len(pts) < 6:  # more rings along a trunk up close: a smoother bend
            P0 = [Vector(p) for p in pts]; pts = [tuple(P0[0].lerp(P0[1], 0))]
            for i in range(len(P0) - 1): pts += [tuple(P0[i].lerp(P0[i + 1], t)) for t in (.5, 1)]
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
        n = self.S(n, 1.5)
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
        k.setdefault('top', .08); return self._add(mk, color, pos, (0, yaw, droop), **k)
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
    def puffs(self, centre, radii, n, size, cols, sub=1, skip=-.35, core=True, jitter=.22, seed=0, seg=14, leafy=40):
        """a picture-book canopy: a soft core and puffs spread over it like a cloud (fewer underneath)"""
        cx, cy, cz = centre; rx, ry, rz = radii
        ao = (centre, (rx * 1.15, ry * 1.15, rz * 1.15), .42)
        if core: self._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=16, v_segments=10, radius=1), cols[0], centre, (0, 0, 0), (rx * .92, ry * .92, rz * .92), jitter=.08, shade=.03, ao=ao)
        ga = math.pi * (3 - math.sqrt(5))
        for i in range(n):
            yy = 1 - 2 * (i + .5) / n
            if yy < skip: continue
            rr = math.sqrt(1 - yy * yy); a = i * ga + seed
            s = size * (.8 + .4 * ((i * 7 + seed * 3) % 5) / 4)
            P = (cx + math.cos(a) * rr * rx, cy + yy * ry, cz + math.sin(a) * rr * rz); col = cols[(i + 1) % len(cols)]
            if not (self.hd and leafy):
                self._add(lambda b, s=s: bmesh.ops.create_uvsphere(b, u_segments=seg, v_segments=max(5, seg * 4 // 7), radius=s), col,
                          P, (self.rnd.random(), self.rnd.random() * 6, 0), jitter=jitter * s * .22, top=.18, ao=ao)
                continue
            # up close: a smaller dark heart covered with broad overlapping leaves whose tips reach past it, so the puff's
            # edge is soft and leafy instead of a smooth ball
            dark = [x * .78 for x in lin(col)]
            self._add(lambda b, s=s: bmesh.ops.create_uvsphere(b, u_segments=10, v_segments=6, radius=s * .78), dark, P, (0, self.rnd.random() * 6, 0), top=.1, ao=ao)
            g2 = math.pi * (3 - math.sqrt(5)); base = lin(col)
            for q in range(leafy):
                qy = 1 - 2 * (q + .5) / leafy
                if qy < -.45: continue
                qr = math.sqrt(1 - qy * qy); qa = q * g2 + i * .7
                d = Vector((math.cos(qa) * qr, qy, math.sin(qa) * qr)); at = Vector(P) + d * s * .62
                tint = [min(1, x * (.92 + .16 * self.rnd.random())) for x in base]
                L = s * (.5 + .1 * self.rnd.random())
                n0 = self.hd; self.hd = False  # (two segments per leaf whatever the detail: there are many)
                self.leaf(L, L * .78, tint, tuple(at), math.atan2(-d.z, d.x) + (self.rnd.random() - .5) * .6, droop=math.asin(max(-1, min(1, d.y))) * .6 - .5, bend=.5, n=2, fold=.3, ao=ao, shade=.0, top=.22)
                self.hd = n0
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
    if m.hd and scallops == 9: scallops = 11
    seg = m.S(seg, 1.6)
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
        if m.hd:  # up close: a second, finer skirt just above each tier, turned a little, for a layered, fluffy fir
            tier(m, r * .86, h * .8, y + h * .12, cols[i], scallops=13, droop=.22, turn=i * .35 + .24)
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
    m.puffs((0, .55, 0), (1.25, .65, 1.15), 8, .68, ['#24654f', '#30785c', '#2a6d55', '#358062'], skip=-.1, seed=9, seg=12)
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
    if not m.hd:  # (many hundreds along the roads: as light as the old stem; the detail is in the close-up model)
        m.trunk([(0, 0, 0), (0, .36, 0)], .016, .012, '#4f9a3c', seg=3, flare=1); m.cyl(.048, .048, .03, '#ffd23f', (0, .375, 0), seg=5); return m
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
        m.puffs(c, rad, 6, .5, ['#7a9a6a', '#86a676', '#6f8f60'], skip=-.3, core=False, seed=j + 5, seg=10, leafy=9)
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
    for k in range(7): m.leaf(1.85, .7, '#5fa860' if k % 2 else '#4e9a52', (0, 2.55, 0), k * .9, droop=.6, bend=.6, n=9, fold=.3)
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
    m.puffs((0, 2.1, 0), (.75, .45, .75), 20, .18, ['#ff9ec4', '#ffc2da', '#ff8ab8'], skip=-.4, core=False, seed=7, seg=9, leafy=7)
    return m

# ---------- by the water (js/reeds.ts) ----------
@model
def reeds():
    m = Model('reeds', 26)
    if not m.hd:  # (light: five blades and two cattails, about the old shape's weight)
        for i, (x, z, h, c) in enumerate([(0, 0, 1.25, '#6f9a4a'), (.18, .08, 1.05, '#7fae52'), (-.15, .1, .95, '#5f8c40'), (.06, -.17, 1.15, '#88b45c'), (.22, -.1, .7, '#7fae52')]):
            m.cone(.05, h, c, (x, h / 2, z), (z * .6, 0, -x * .6), seg=3)
        for (x, z, h) in [(.02, .02, 1.2), (-.12, .1, 1.02)]: m.lathe([(0, 0), (.05, .03), (.05, .17), (0, .21)], '#7a4e2c', (x, h - .14, z), seg=5)
        return m
    for i, (x, z, h, c) in enumerate([(0, 0, 1.25, '#6f9a4a'), (.18, .08, 1.05, '#7fae52'), (-.15, .1, .95, '#5f8c40'), (.06, -.17, 1.15, '#88b45c'), (-.1, -.12, .85, '#6f9a4a'), (.22, -.1, .7, '#7fae52')]):
        m.leaf(h, .08, c, (x, 0, z), i * 1.1, droop=1.35, bend=.12, n=4, fold=.3)  # a tall curved blade
    for (x, z, h) in [(.02, .02, 1.2), (-.12, .1, 1.02)]:
        m.trunk([(x, 0, z), (x + .01, h * .5, z), (x, h - .12, z)], .014, .012, '#7a8a4a', seg=5, flare=1)
        m.lathe([(0, 0), (.04, .02), (.05, .06), (.05, .16), (.04, .2), (0, .22)], '#7a4e2c', (x, h - .14, z), seg=10, top=.15)  # the cattail
        m.trunk([(x, h + .08, z), (x, h + .16, z)], .006, .003, '#7a8a4a', seg=3, flare=1)
    return m
@model
def hyacinth():
    m = Model('hyacinth', 27)
    if not m.hd:  # (light: three pads and a few flowers, about the old shape's weight)
        for (x, z, r_, c) in [(0, 0, .42, '#4f9a52'), (.45, .2, .3, '#5fae5c'), (-.3, .35, .22, '#56a456')]: m.lathe([(0, 0), (r_, .0), (r_ * .95, .025), (0, .03)], c, (x, 0, z), seg=7, top=.12)
        for k in range(3): m.uv(.07, '#b07ad8' if k % 2 else '#c99ae8', (.04 + math.cos(k * 2) * .05, .14 + k * .04, math.sin(k * 2) * .05), seg=5, ring=3)
        return m
    for (x, z, r, c) in [(0, 0, .42, '#4f9a52'), (.45, .2, .3, '#5fae5c'), (-.3, .35, .22, '#56a456')]:
        m.lathe([(0, 0), (r * .9, -.005), (r, .01), (r * .95, .025), (0, .03)], c, (x, 0, z), seg=20, top=.12)  # a glossy pad
    for k in range(4): m.leaf(.22, .14, '#5fae5c', (0, .02, 0), k * 1.6, droop=1.0, bend=.4, n=4)
    m.trunk([(0, 0, 0), (.02, .1, 0), (.04, .2, 0)], .015, .012, '#5f9e3a', seg=5, flare=1)
    for k in range(7): a = k * 2.4; m.petals(5, .035, '#b07ad8' if k % 2 else '#c99ae8', (.04 + math.cos(a) * .05, .14 + k * .022, math.sin(a) * .05), size=.035, tilt=.4, sub=0)
    return m

# ---------- the farm (js/farm.ts): crops in three stages and the small props ----------
SOIL = '#5a3a22'
def mound(m, r=.2): m.lathe([(0, -.02), (r, -.02), (r * .85, .015), (r * .5, .045), (0, .055)], SOIL, (0, 0, 0), seg=18, top=.08, jitter=.006)  # a soft little heap of soil
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
def corn_1():  # grass-like blades
    m = Model('corn-1', 40); mound(m)
    for k in range(3): m.leaf(.32, .06, '#6fbf4f', (0, .03, 0), k * 2.2, droop=1.25, bend=.5, n=5)
    return m
@model
def sunflower_1():  # two round seed leaves on a short stem
    m = Model('sunflower-1', 43); mound(m); stem(m, .22, '#5f9e3a', .022)
    for s_ in (-1, 1): round_leaf(m, .08, '#5fb04a', (s_ * .08, .23, 0), 0, tilt=s_ * -.3)
    return m
@model
def pumpkin_1():  # two seed leaves and one broad round leaf
    m = Model('pumpkin-1', 46); mound(m); stem(m, .14, '#5f9e3a', .022)
    for s_ in (-1, 1): round_leaf(m, .07, '#5fb04a', (s_ * .07, .15, 0), 0, tilt=s_ * -.3)
    round_leaf(m, .11, '#4fae4a', (0, .19, .07), 1.57, tilt=-.4)
    return m
def tomato_plant(m, h, leaves, fruit):
    m.trunk([(.2, 0, -.05), (.2, h * .5, -.05), (.2, h + .1, -.05)], .018, .014, '#c9a05a', seg=5, flare=1)  # the cane
    m.box(.06, .04, .1, '#d9c9a0', (.17, h * .62, -.03), top=0)  # its tie
    m.trunk([(0, 0, 0), (.04, h * .35, .02), (.1, h * .7, -.02), (.12, h, 0)], .035, .02, '#3f8f3a', seg=6, flare=1.2)
    for k in range(leaves):  # leaflets in threes along the stem
        t = .15 + .8 * k / leaves; a = k * 2.4; base = (.1 * t, h * t, 0)
        for j in (-1, 0, 1): m.leaf(.2 if j == 0 else .15, .1, '#4fae4a' if k % 2 else '#45a046', base, a + j * .55, droop=.35, bend=.3, n=4)
    for k, (x, y, z, r) in enumerate(fruit):
        m.uv(r, '#e8433a' if r > .07 else '#f0a43a', (x, y, z), scl=(1, .88, 1), seg=12, ring=8, top=.25)
        for s_ in range(5): m.leaf(.06, .03, '#3f8f3a', (x, y + r * .85, z), s_ * 1.26, droop=-.3, bend=.2, n=2)

@model
def tomato_2():
    m = Model('tomato-2', 38); tomato_plant(m, .75, 6, [])
    for k in range(3): x, z = math.cos(k * 2.1) * .14, math.sin(k * 2.1) * .14; m.petals(5, .035, '#ffd23f', (x, .6 + k * .04, z), size=.032, tilt=.3, sub=0); m.uv(.015, '#e8a01a', (x, .61 + k * .04, z), seg=5, ring=3)
    return m
@model
def tomato_3():
    m = Model('tomato-3', 39)
    tomato_plant(m, 1.0, 8, [(.16, .55, .12, .1), (-.14, .7, .1, .095), (.05, .85, -.16, .09), (-.12, .45, -.12, .1), (.14, .9, .08, .085), (.0, .62, .17, .06)])
    return m
def corn_stalk(m, x, z, h, j, cob=True):
    m.trunk([(x, 0, z), (x + .01, h * .5, z), (x, h, z)], .055, .03, '#6fae4a', seg=7, flare=1.3)
    for k in range(7): m.leaf(.55 - k * .03, .12, '#5fae4a' if k % 2 else '#4f9e45', (x, .12 + k * h * .12, z), k * 2.6 + j, droop=.5, bend=.9, n=6, fold=.35)
    if cob:
        m.lathe([(0, 0), (.06, .04), (.075, .12), (.07, .22), (.045, .3), (0, .33)], '#ffd23f', (x + .07, h * .5, z), (0, 0, -.35), seg=10)
        for s_ in (-1, 1): m.leaf(.3, .11, '#9ac85a', (x + .05, h * .48, z), s_ * .5, droop=1.2, bend=-.1, n=4, fold=.4)  # its husk
        m.leaf(.12, .03, '#c98a4a', (x + .12, h * .5 + .3, z), 0, droop=.6, bend=.4, n=3)  # the silk
    m.trunk([(x, h, z), (x, h + .22, z)], .02, .005, '#d9b07a', seg=4, flare=1)  # the tassel
    for k in range(4): m.leaf(.14, .02, '#d9b07a', (x, h + .12, z), k * 1.57, droop=-.5, bend=.3, n=2)
@model
def corn_2():
    m = Model('corn-2', 41); corn_stalk(m, 0, 0, .8, 0, cob=False); return m
@model
def corn_3():
    m = Model('corn-3', 42)
    for j, (x, z) in enumerate([(0, 0), (.32, .18), (-.28, .2)]): corn_stalk(m, x, z, 1.15 - j * .1, j)
    return m
@model
def sunflower_2():
    m = Model('sunflower-2', 44); m.trunk([(0, 0, 0), (.02, .35, 0), (0, .7, 0)], .045, .03, '#5f9e3a', seg=7, flare=1.2)
    for k in range(4): m.leaf(.32, .22, '#4fae4a', (0, .2 + k * .12, 0), k * 1.7, droop=.35, bend=.35, n=5)
    m.lathe([(.0, 0), (.08, .03), (.1, .1), (.06, .16), (0, .18)], '#6fae4a', (0, .68, 0), seg=10)  # the closed bud
    for k in range(6): m.leaf(.1, .05, '#5f9e3a', (0, .76, 0), k * 1.05, droop=1.0, bend=.2, n=2)
    return m
@model
def sunflower_3():
    m = Model('sunflower-3', 45); m.trunk([(0, 0, 0), (.02, .6, 0), (0, 1.1, .04)], .055, .035, '#5f9e3a', seg=7, flare=1.2)
    for k in range(5): m.leaf(.36, .24, '#4fae4a', (0, .2 + k * .14, 0), k * 1.7, droop=.35, bend=.35, n=5)
    # the head looks to the front (+z), a little up: a dark seed dome in rings, two layers of petals
    tilt = (math.pi / 2 - .3, 0, 0)
    m.lathe([(0, -.05), (.17, -.04), (.18, 0), (.15, .03), (0, .05)], '#5a3418', (0, 1.15, .06), tilt, seg=18, top=.0)
    m.lathe([(.12, .03), (.125, .035), (.1, .04)], '#7a4a22', (0, 1.15, .06), tilt, seg=18, top=.0)
    for layer, (n, r, c) in enumerate([(14, .25, '#ffc21a'), (14, .22, '#ffd23f')]):
        for k in range(n):
            a = (k + layer * .5) * 2 * math.pi / n; ca, sa = math.cos(a), math.sin(a)
            m.ball(.09, c, (ca * r, 1.15 + sa * r * .95, .06 + sa * .07 - layer * .02), (.3 - layer * .1, 0, a), (1.5, .55, .22), sub=0, top=.05)
    return m
@model
def pumpkin_2():
    m = Model('pumpkin-2', 47)
    for k in range(5): m.leaf(.4, .3, '#4fae4a', (0, .03, 0), k * 1.25, droop=.12, bend=.15, n=5)
    m.trunk([(0, .04, 0), (.2, .08, .05), (.38, .08, 0)], .016, .014, '#5f9e3a', seg=5, flare=1)
    m.lathe([(0, 0), (.08, .02), (.11, .08), (.1, .14), (.05, .18), (0, .19)], '#9ac85a', (.42, .02, 0), seg=14, ribs=8, rib=.08)
    return m
@model
def pumpkin_3():
    m = Model('pumpkin-3', 48)
    for k in range(5): m.leaf(.45, .32, '#4fae4a', (0, .03, 0), k * 1.25, droop=.12, bend=.15, n=5)
    m.lathe([(0, 0), (.16, .02), (.27, .09), (.31, .2), (.29, .33), (.2, .43), (.08, .47), (0, .45)], '#ff8a2a', (0, 0, 0), seg=32, ribs=10, rib=.1, top=.2)
    m.trunk([(0, .44, 0), (.02, .52, 0), (.07, .58, .02)], .04, .03, '#6a8a3a', seg=6, flare=1)
    m.trunk([(.03, .5, 0), (.15, .55, .08), (.22, .5, .14)], .01, .008, '#5f9e3a', seg=4, flare=1)  # a curly tendril
    return m

@model
def farm_hay():
    m = Model('farm-hay', 49)
    m.box(1.6, .8, 1.1, '#8a5a3b', (0, .4, 0), bevel=.04)
    for k in range(4): m.box(1.62, .1, .05, '#6e4426', (0, .14 + k * .19, .55), bevel=.02)
    m.lathe([(0, 0), (.7, 0), (.66, .12), (.4, .2), (0, .22)], '#f2d16b', (0, .78, 0), scl=(1, 1, .7), seg=16)  # the heap of hay on top
    for k in range(26):  # loose straws sticking out
        a = k * 2.4; r = .3 + (k % 5) * .08
        m.trunk([(math.cos(a) * r, .86 + (k % 3) * .04, math.sin(a) * r * .7), (math.cos(a) * (r + .18), .98 + (k % 4) * .03, math.sin(a) * (r + .18) * .7)], .012, .008, '#e8c25a' if k % 2 else '#f6dc80', seg=3, flare=1)
    return m
@model
def farm_crate():
    m = Model('farm-crate', 50)
    for y in (.1, .32, .54): m.box(1.2, .16, .04, '#a9764a', (0, y, .48), bevel=.015); m.box(1.2, .16, .04, '#a9764a', (0, y, -.48), bevel=.015)
    for y in (.1, .32, .54): m.box(.04, .16, 1.0, '#9d6c42', (.58, y, 0), bevel=.015); m.box(.04, .16, 1.0, '#9d6c42', (-.58, y, 0), bevel=.015)
    for x in (-.58, .58):
        for z in (-.48, .48): m.box(.08, .66, .08, '#8a5a34', (x, .33, z), bevel=.02)
    m.box(1.14, .04, .94, '#c9a06a', (0, .5, 0), top=.0)
    m.lathe([(.55, 0), (.55, .06), (.5, .08), (0, .08)], '#e8d29a', (0, .52, 0), scl=(1, 1, .82), seg=16, top=.0)  # straw bed
    egg = [(0, 0), (.06, .015), (.085, .06), (.08, .11), (.055, .155), (0, .17)]
    for k in range(6): m.lathe(egg, '#fff6e6' if k % 2 else '#f2dcc0', (-.35 + (k % 3) * .35, .6, -.15 + (k // 3) * .3), (.15 * (k % 2), 0, .2 * (k % 3 - 1)), seg=12, top=.2)
    return m
@model
def farm_wardrobe():
    m = Model('farm-wardrobe', 51)
    for x in (-.62, .62):
        for z in (-.28, .28): m.lathe([(.05, 0), (.06, .06), (.04, .14), (.06, .18)], '#6a4026', (x, 0, z), seg=10)  # turned feet
    m.box(1.4, 1.95, .7, '#b07a4a', (0, 1.15, 0), bevel=.03)
    m.box(1.5, .14, .8, '#8a5a34', (0, 2.18, 0), bevel=.04); m.box(1.2, .1, .1, '#8a5a34', (0, 2.29, -.3), bevel=.03)  # the cornice
    m.box(1.46, .1, .76, '#8a5a34', (0, .2, 0), bevel=.03)
    for s in (-1, 1):
        m.box(.62, 1.65, .04, '#c08a58', (s * .33, 1.2, .36), bevel=.02)  # the doors, each with a raised panel
        m.box(.42, .7, .03, '#b07a4a', (s * .33, 1.55, .385), bevel=.02); m.box(.42, .5, .03, '#b07a4a', (s * .33, .78, .385), bevel=.02)
        m.uv(.04, '#ffd23f', (s * .07, 1.2, .4), seg=8, ring=5, top=.3)
    return m
@model
def farm_easel():
    m = Model('farm-easel', 52)
    m.box(1.4, 1.1, .05, '#ffffff', (0, 1.6, 0), (-.15, 0, 0), bevel=.01)
    for x, y, c, r in [(-.35, 1.7, '#ff7eb8', .17), (0, 1.55, '#7fd8ff', .15), (.32, 1.72, '#ffd23f', .14), (.1, 1.85, '#5fd39a', .1)]: m.ball(r, c, (x, y, .04 - (y - 1.6) * .15), (-.15, 0, 0), (1, 1, .12), sub=2, top=0)
    for (p0, p1) in [((-.55, 0, -.1), (-.08, 2.15, -.3)), ((.55, 0, -.1), (.08, 2.15, -.3)), ((0, 0, .55), (0, 2.0, -.25))]:
        m.trunk([p0, ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2), p1], .045, .035, '#8a5a3b', seg=7, flare=1)
    m.box(1.3, .06, .14, '#8a5a3b', (0, 1.02, .1), bevel=.02)
    for k, c in enumerate(['#ff7eb8', '#7fd8ff', '#ffd23f']): m.trunk([(-.3 + k * .12, 1.06, .12), (-.3 + k * .12 + .05, 1.06, .2)], .012, .012, c, seg=5, flare=1)  # crayons on the ledge
    return m

# ---------- My House decorations (js/home-decor-models.ts) ----------
@model
def decor_teddy():
    m = Model('decor-teddy', 61); fur, dark, light = '#c18a5e', '#b67c54', '#f5d7ab'
    m.uv(.34, fur, (0, .42, 0), scl=(1, 1.08, .92), seg=14, ring=10); m.uv(.2, light, (0, .4, .18), scl=(1, 1.15, .5), seg=14, ring=10)  # tummy
    m.uv(.29, '#dca679', (0, .93, 0), scl=(1.05, .95, .95), seg=14, ring=10)
    for s in (-1, 1):
        m.uv(.12, dark, (s * .23, 1.14, -.02), scl=(1, 1, .6), seg=12, ring=8); m.uv(.07, '#f0c8a0', (s * .23, 1.13, .03), scl=(1, 1, .4), seg=10, ring=6)
        m.uv(.13, fur, (s * .33, .55, .06), (0, 0, s * .5), (.85, 1.35, .85), seg=12, ring=8)  # arms
        m.uv(.16, dark, (s * .19, .16, .12), (0, 0, 0), (.9, .8, 1.25), seg=12, ring=8); m.uv(.09, light, (s * .19, .14, .3), scl=(1, 1, .3), seg=10, ring=6)  # feet, paw pads
        m.uv(.038, '#2a1c30', (s * .1, .97, .25), seg=8, ring=6, top=.4)
    m.uv(.13, light, (0, .85, .22), scl=(1.1, .85, .8), seg=12, ring=8); m.uv(.04, '#2a1c30', (0, .89, .33), scl=(1.3, 1, 1), seg=8, ring=6, top=.4)
    m.lathe([(.07, 0), (.08, .02), (.07, .04)], '#e8433a', (0, .66, .2), (math.pi / 2, 0, 0), seg=10)
    for s in (-1, 1): m.uv(.08, '#e8433a', (s * .09, .67, .22), (0, 0, s * .4), (1.3, .7, .5), seg=10, ring=6)  # the bow
    return m
@model
def decor_clock():
    m = Model('decor-clock', 62); wood, darkw = '#bb875c', '#885840'
    m.box(.8, .18, .55, darkw, (0, .09, 0), bevel=.04); m.box(.58, 1.15, .42, wood, (0, .74, 0), bevel=.03)
    m.box(.42, .8, .03, '#2e2030', (0, .72, .21), bevel=.01, top=0)
    m.trunk([(0, 1.05, .23), (0, .42, .23)], .012, .012, '#e7b953', seg=5, flare=1); m.lathe([(0, 0), (.09, .005), (.1, .02), (0, .03)], '#e7b953', (0, .35, .22), (math.pi / 2, 0, 0), seg=14)
    m.lathe([(.42, -.07), (.44, -.04), (.44, .04), (.4, .07), (.36, .07)], '#f1c76c', (0, 1.6, 0), (math.pi / 2, 0, 0), seg=28)
    m.lathe([(0, .055), (.36, .055)], '#fff7de', (0, 1.6, 0), (math.pi / 2, 0, 0), seg=28, top=0)
    m.box(.035, .22, .02, '#4a344c', (0, 1.7, .08), bevel=.008); m.box(.18, .035, .02, '#4a344c', (.08, 1.6, .08), bevel=.008)
    for k in range(12): a = k * math.pi / 6; m.uv(.02 if k % 3 else .03, '#4a344c', (math.cos(a) * .29, 1.6 + math.sin(a) * .29, .07), seg=6, ring=4)
    m.uv(.06, '#e7b953', (0, 2.06, 0), seg=10, ring=6)
    return m
@model
def decor_vase():
    m = Model('decor-vase', 63)
    m.lathe([(0, 0), (.2, 0), (.24, .05), (.32, .3), (.31, .5), (.2, .75), (.15, .88), (.2, 1.0), (.17, 1.02), (.13, .9), (0, .9)], '#ad8bd0', seg=24, top=.2)
    m.lathe([(.322, .5), (.33, .53), (.322, .56)], '#ffd23f', seg=24)
    for k in range(3):
        a = k * 2.1; tip = (math.cos(a) * .14, 1.42, math.sin(a) * .14)
        m.trunk([(0, .9, 0), (tip[0] * .5, 1.2, tip[2] * .5), tip], .014, .012, '#5b935e', seg=5, flare=1)
        m.petals(5, .06, '#ff9ec4', tip, size=.06, tilt=.3); m.uv(.03, '#ffd23f', (tip[0], tip[1] + .02, tip[2]), seg=6, ring=4)
    return m
@model
def decor_lamp():
    m = Model('decor-lamp', 64)
    m.lathe([(0, 0), (.36, 0), (.36, .04), (.3, .1), (.12, .14), (.06, .2), (0, .2)], '#bd8a5e', seg=24)
    m.trunk([(0, .18, 0), (0, .55, 0), (0, .98, 0)], .04, .035, '#d2a860', seg=8, flare=1)
    m.lathe([(.43, .95), (.43, .99), (.24, 1.45), (.24, 1.47)], '#ffe6a5', seg=28, top=.1)
    m.lathe([(.44, .94), (.45, .97), (.44, 1.0)], '#e8b84a', seg=28); m.lathe([(.25, 1.44), (.26, 1.46), (.25, 1.48)], '#e8b84a', seg=24)
    m.uv(.08, '#f5b75a', (0, 1.53, 0), seg=10, ring=6)
    return m
POT = [(0, 0), (.2, 0), (.22, .02), (.29, .34), (.33, .36), (.33, .44), (.27, .44), (.26, .4), (0, .4)]
def potted_flower(name, seed, petal, middle):
    m = Model(name, seed)
    m.lathe(POT, '#c98268', seg=22); m.lathe([(0, .4), (.26, .4)], '#5a3a22', seg=22, top=0)
    m.trunk([(0, .4, 0), (.02, .7, 0), (0, 1.0, 0)], .03, .025, '#5b935e', seg=6, flare=1)
    m.leaf(.3, .16, '#5b935e', (0, .62, 0), .4, droop=.3, bend=.3, n=5); m.leaf(.28, .15, '#5b935e', (0, .74, 0), 3.5, droop=.3, bend=.3, n=5)
    for layer in range(2):
        for i in range(10): a = (i + layer * .5) * math.pi / 5; m.ball(.13, petal, (math.cos(a) * .23, 1 + math.sin(a) * .23, -layer * .02), (0, 0, a), (1.4, .6, .25), sub=1, top=.05)
    m.lathe([(0, -.05), (.15, -.04), (.16, 0), (.12, .03), (0, .05)], middle, (0, 1, .04), (math.pi / 2, 0, 0), seg=16)
    return m
@model
def decor_sunflower(): return potted_flower('decor-sunflower', 65, '#ffd35f', '#8e6642')
@model
def decor_lotus():
    m = Model('decor-lotus', 66)
    m.lathe(POT, '#c98268', seg=22); m.lathe([(0, .41), (.26, .41)], '#7cc3d6', seg=22, top=0)
    m.trunk([(0, .4, 0), (.02, .7, 0), (0, .95, 0)], .025, .02, '#5b935e', seg=6, flare=1)
    m.lathe([(0, 0), (.2, .0), (.2, .01), (0, .01)], '#4f9a52', (.1, .42, .05), seg=16)  # a lily pad
    for ring, (n, r, tilt, c) in enumerate([(8, .13, 1.0, '#f59bc7'), (7, .08, .65, '#f8b4d4'), (5, .04, .3, '#fbd0e2')]):
        for i in range(n): a = i * 2 * math.pi / n + ring * .3; m.lathe([(0, 0), (.04, .03), (.05, .09), (.03, .15), (0, .18)], c, (math.cos(a) * r, .96 + ring * .03, math.sin(a) * r), (0, -a, tilt), (1, 1, .45), seg=8)
    m.uv(.05, '#ffdc74', (0, 1.03, 0), scl=(1, .6, 1), seg=10, ring=6)
    return m
@model
def decor_balloons():
    m = Model('decor-balloons', 67)
    m.lathe([(0, 0), (.34, 0), (.33, .08), (.26, .13), (0, .13)], '#b98b64', seg=20)
    for i, c in enumerate(['#ff99c5', '#81d9ed', '#ffd46b']):
        x = (i - 1) * .3; y = 1.35 + (.2 if i == 1 else 0)
        m.trunk([(0, .12, 0), (x * .5, (y - .3) * .5, 0), (x, y - .3, 0)], .006, .006, '#d9c7aa', seg=3, flare=1)
        m.lathe([(0, -.28), (.06, -.25), (.2, -.12), (.25, .05), (.2, .2), (.1, .27), (0, .29)], c, (x, y, 0), seg=18, top=.3)
        m.cone(.035, .05, c, (x, y - .3, 0), (math.pi, 0, 0), seg=6)
        m.uv(.04, '#ffffff', (x - .09, y + .1, .17), scl=(1, 1.5, .5), seg=6, ring=4, top=0)  # a shine
    return m

# ---------- rocks, grass and the garden plots (js/world.ts, js/plots.ts) ----------
@model
def rock():
    """a smooth boulder with a smaller stone at its side and a little moss; the game tints each copy"""
    m = Model('rock', 70)
    m._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=m.S(18, 1.8), v_segments=m.S(11, 1.8), radius=1), '#e6dcc6', (0, .42, 0), (0, .5, 0), (1.42, .82, 1.08), jitter=.14, lumps=1.2, top=.16)
    m._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=12, v_segments=8, radius=1), '#d9cfb8', (1.1, .12, .7), (0, 1.1, 0), (.42, .3, .36), jitter=.05, top=.16)
    m._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=12, v_segments=6, radius=1), '#9fb07a', (-.25, 1.12, -.1), (0, .3, .1), (.55, .12, .4), jitter=.03, top=.1)  # moss on top
    return m
@model
def grass():
    """a tuft of three curved blades, about as light as the code shape (18 triangles); white so the game tints it"""
    m = Model('grass', 71)
    def blade(b, yaw, h, lean, w=.07):
        ca, sa = math.cos(yaw), math.sin(yaw)
        def P(t, side):  # along the blade (t 0..1), side -1..1, bent outwards as it rises
            x = lean * t * t; y = h * t; ww = w * (1 - t) * side
            return (ca * x - sa * ww, y, sa * x + ca * ww)
        for th in (0, .006):  # front and back, a hair apart
            v = [b.verts.new(Vector(P(0, -1)) + Vector((0, 0, th))), b.verts.new(Vector(P(0, 1)) + Vector((0, 0, th))),
                 b.verts.new(Vector(P(.55, -1)) + Vector((0, 0, th))), b.verts.new(Vector(P(.55, 1)) + Vector((0, 0, th))), b.verts.new(Vector(P(1, 0)) + Vector((0, 0, th)))]
            fs = [(v[0], v[1], v[3]), (v[0], v[3], v[2]), (v[2], v[3], v[4])]
            for f in fs: b.faces.new(f if th == 0 else tuple(reversed(f)))
    tuft = [(0, .88, .26), (2.1, .76, .3), (4.2, .82, .22)]
    if m.hd: tuft += [(1.0, .7, .34), (3.1, .64, .3), (5.2, .74, .28), (.5, .5, .2)]  # up close: a fuller tuft
    m._add(lambda b: [blade(b, a, h, l) for a, h, l in tuft], '#f2f2f2', (0, -.05, 0), top=.0)
    return m
@model
def garden_plot():
    """an empty plot's little garden, 6 x 7 m, its front (+z) to the lane: a striped lawn, low rounded hedges round the
    back and sides, a stepping-stone path from the front and two flower beds; nothing taller than 30 cm (check plots)"""
    m = Model('garden-plot', 72); W, D = 6, 7
    for k in range(6):  # the lawn in soft mown stripes
        m.box((W - .1) / 6, .06, D - .1, '#8fcf7a' if k % 2 else '#86c672', (-W / 2 + .05 + (k + .5) * (W - .1) / 6, .03, 0), top=.0)
    # low rounded hedges: one soft lumpy roll along the back and one down each side
    m._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=12, v_segments=5, radius=1), '#4f9a52', (0, .15, -D / 2 + .27), (0, 0, 0), ((W - .3) / 2, .15, .24), jitter=.03, lumps=3.5, top=.2)
    for s_ in (-1, 1):
        m._add(lambda b: bmesh.ops.create_uvsphere(b, u_segments=12, v_segments=5, radius=1), '#56a356', (s_ * (W / 2 - .27), .15, -.15), (0, math.pi / 2, 0), ((D - .7) / 2, .15, .24), jitter=.03, lumps=3.5, top=.2)
    for i in range(5): m.cyl(.3, .32, .06, '#e3cf9c' if i % 2 else '#d9c48e', ((i % 2 - .5) * .18, .07, D / 2 - .45 - i * .7), seg=9, top=.05)  # stepping stones
    flowers = ['#ff7eb8', '#ffd23f', '#ffffff', '#c86bff', '#ff8a3d']
    for s_ in (-1, 1):
        m.box(1.3, .08, 2.6, '#7a5236', (s_ * 1.6, .06, -.4), top=.0)  # the bed's soil
        for k in range(8):
            x, z = s_ * (1.6 + ((k % 2) - .5) * .7), -1.45 + (k // 2) * .7
            if m.hd:
                m.uv(.13, '#4f8f45', (x, .15, z), scl=(1, .5, 1), seg=6, ring=4, top=.15)
                for q in range(5): qa = q * 1.2566; m.uv(.045, flowers[(k + (s_ > 0)) % len(flowers)], (x + math.cos(qa) * .045, .25, z + math.sin(qa) * .045), (0, -qa, .25), (1.3, .35, .8), seg=4, ring=3, top=.05)
                m.uv(.025, '#ffd23f', (x, .26, z), seg=5, ring=3)
            else:
                m.cone(.1, .2, '#4f8f45', (x, .17, z), seg=3, top=.1); m.uv(.07, flowers[(k + (s_ > 0)) % len(flowers)], (x, .24, z), scl=(1, .6, 1), seg=4, ring=3, top=.2)
    return m

# ---------- My House: the wall picture frames and the keepsake stands (js/home-decor-models.ts) ----------
@model
def decor_frame():
    """a moulded wooden frame on the wall, its middle the height of the old one (the picture is drawn in front of it)"""
    m = Model('decor-frame', 73)
    m.box(1.08, .88, .05, '#fff9e9', (0, 0, 0), top=.0)  # the mat behind the picture (front at z 0.025, under the picture)
    for (w, h, x, y) in [(1.25, .1, 0, .475), (1.25, .1, 0, -.475), (.1, .85, -.575, 0), (.1, .85, .575, 0)]:
        m.box(w, h, .07, '#b77952', (x, y, .005), bevel=.025, top=.05)
    for (w, h, x, y) in [(1.06, .03, 0, .43), (1.06, .03, 0, -.43), (.03, .86, -.53, 0), (.03, .86, .53, 0)]:
        m.box(w, h, .05, '#e0b062', (x, y, .015), top=.0)  # a thin gold line inside
    return m
@model
def decor_keepsake():
    """a little wooden display stand for a keepsake (its picture is drawn in front of the board)"""
    m = Model('decor-keepsake', 74)
    m.box(.9, .12, .55, '#b7885e', (0, .06, 0), bevel=.03)
    m.trunk([(0, .1, -.05), (0, .4, -.07), (0, .7, -.09)], .05, .04, '#a5794f', seg=8, flare=1.2)
    m.box(1.0, .85, .08, '#a5794f', (0, 1.05, -.03), bevel=.03)
    m.box(.88, .73, .04, '#f6dfb4', (0, 1.05, .01), top=.0)
    m.box(.5, .05, .1, '#8a5a34', (0, .62, .04), bevel=.015)  # the little ledge
    return m

# (owner, 6 Nov 2026 AEDT: "Detailed up close") the many-copy kinds get a light model and a close-up "-hd" one (within
# about 25 m of the child); the few ones (crops, farm props, My House) are made only in the detailed version
ONE_DETAILED = ('carrot', 'strawberry', 'tomato', 'corn', 'sunflower', 'pumpkin', 'farm-', 'decor-')
def main():
    global HD
    want = [a for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]) if not a.startswith('-')]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for name, fn in M.items():
        one = name.startswith(ONE_DETAILED)
        for hd in ((True,) if one else (False, True)):
            out = name + ('-hd' if hd and not one else '')
            if want and out not in want and name not in want: continue
            HD = hd; m = fn(); m.name = out; t = m.tris(); m.save(); print(f'{out}: {t} triangles')
    HD = False

if __name__ == '__main__':
    main()

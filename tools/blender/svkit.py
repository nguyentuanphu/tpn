# Shared Blender helpers for Sparkle Valley's characters (our own models, made by script).
import bpy, bmesh, math, os
from mathutils import Vector, Matrix, Euler

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()
    return bpy.context.scene

def hexc(h, a=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4) for x in c] + [a]

MATS = {}
def mat(name, col, rough=.75, sheen=.0, emit=0.0, sss=0.0, metal=0.0, fuzz=0.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexc(col); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    b.inputs['Sheen Weight'].default_value = sheen
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (.4, .2, .15)
    if emit: b.inputs['Emission Color'].default_value = hexc(col); b.inputs['Emission Strength'].default_value = emit
    if fuzz:  # fine cloth weave
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 700; nz.inputs['Detail'].default_value = 3
        bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = fuzz; bp.inputs['Distance'].default_value = .002
        nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    m.diffuse_color = hexc(col)
    MATS[name] = m; return m

def obj_from(bm, name, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    return o

def subsurf(o, lv=1):
    md = o.modifiers.new('s', 'SUBSURF'); md.levels = lv; md.render_levels = lv; return o

def sphere(name, m, loc, scale, seg=32, ring=16, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1)
    bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale)), verts=bm.verts)
    return obj_from(bm, name, m)

def tube(name, m, pts, radii, seg=16, cap=True):
    """a smooth tube through the points, its radius at each point (or one radius); radii may be (rx, ry) for an oval"""
    pts = [Vector(p) for p in pts]; n = len(pts)
    if not isinstance(radii, list): radii = [radii] * n  # a list: one per point; a number or an (rx, ry) tuple: the same all along
    bm = bmesh.new(); rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        up = Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0))
        x = t.cross(up).normalized(); y = t.cross(x).normalized()
        r = radii[i]; rx, ry = (r, r) if not isinstance(r, (list, tuple)) else r
        rings.append([bm.verts.new(p + x * math.cos(a) * rx + y * math.sin(a) * ry) for a in [2 * math.pi * k / seg for k in range(seg)]])
    for i in range(n - 1):
        for k in range(seg): bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]))
    if cap:
        for r, p in ((rings[0], pts[0]), (rings[-1], pts[-1])):
            c = bm.verts.new(p)
            for k in range(seg): bm.faces.new((r[k], r[(k + 1) % seg], c) if r is rings[-1] else (r[(k + 1) % seg], r[k], c))
    return obj_from(bm, name, m)

def capsule(name, m, a, b, r, seg=16):
    a, b = Vector(a), Vector(b)
    o = tube(name, m, [a + (a - b).normalized() * r * .0, a, b], [r * .2, r, r], seg)
    sphere(name + 'End', m, b, (r, r, r), seg, max(6, seg // 2)); sphere(name + 'Start', m, a, (r, r, r), seg, max(6, seg // 2))
    return o

def lathe(name, m, profile, seg=32, loc=(0, 0, 0), scale=(1, 1, 1), arc=None):
    """profile: [(radius, z)] from bottom to top; arc: (start, end) angles to leave an opening (a coat open at the front)"""
    bm = bmesh.new(); rings = []
    a0, a1 = arc if arc else (0, 2 * math.pi); closed = arc is None
    cnt = seg if closed else seg + 1
    for r, z in profile:
        rings.append([bm.verts.new((loc[0] + math.sin(a0 + (a1 - a0) * k / seg) * r * scale[0], loc[1] - math.cos(a0 + (a1 - a0) * k / seg) * r * scale[1], loc[2] + z)) for k in range(cnt)])
    for i in range(len(rings) - 1):
        for k in range(cnt if closed else cnt - 1): bm.faces.new((rings[i][k], rings[i][(k + 1) % cnt], rings[i + 1][(k + 1) % cnt], rings[i + 1][k]))
    o = obj_from(bm, name, m)
    if not closed: md = o.modifiers.new('t', 'SOLIDIFY'); md.thickness = .006
    return o

def star(name, m, c, r, depth, rot):
    bm = bmesh.new(); vs = []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * .45
        vs.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, 0)))
    f = bm.faces.new(vs); ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, 0, depth), verts=[e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(Vector(c), Euler(rot), Vector((1, 1, 1))), verts=bm.verts)
    return obj_from(bm, name, m, False)

def studio(scene, bg='#f6efe0', exposure=-1.0):
    world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = hexc(bg); world.node_tree.nodes['Background'].inputs[1].default_value = .8
    def light(loc, energy, col, size):
        d = bpy.data.lights.new('L', 'AREA'); d.energy = energy; d.color = hexc(col)[:3]; d.size = size
        o = bpy.data.objects.new('L', d); scene.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector((0, 0, .6)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    light((-1.4, -2.2, 2.2), 260, '#fff3df', 2.5); light((1.8, -1.4, 1.2), 110, '#ffe7c8', 1.5); light((0, 2, 1.9), 170, '#fff8e8', 2)
    me = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=5); bm.to_mesh(me)
    g = bpy.data.objects.new('ground', me); scene.collection.objects.link(g); g.data.materials.append(mat('groundM', bg, .9))
    cd = bpy.data.cameras.new('cam'); cd.lens = 85; cam = bpy.data.objects.new('cam', cd); scene.collection.objects.link(cam); scene.camera = cam
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 40; scene.cycles.use_denoising = True
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.exposure = exposure
    return cam

def shoot(scene, cam, out, name, az, height, dist, look, res=(560, 760)):
    scene.render.resolution_x, scene.render.resolution_y = res
    cam.location = (math.sin(az) * dist, -math.cos(az) * dist, height)
    cam.rotation_euler = (Vector((0, 0, look)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(out, name + '.png'); bpy.ops.render.render(write_still=True)

# ---------- felt, glass and soft paint (Lumi, v1.08) ----------
def felt(name, col, rough=.85, fibre=.12, mottle=.06, scale=900):
    """felt or wool: a soft sheen, fine fibres in the bump and a gentle mottle in the colour (world position, so every size matches)"""
    if name in MATS: return MATS[name]
    m = mat(name, col, rough, sheen=1.0)
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Sheen Roughness'].default_value = .4; b.inputs['Sheen Tint'].default_value = hexc('#fffaf0')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 8; nz.inputs['Roughness'].default_value = .7
    nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = fibre; bp.inputs['Distance'].default_value = .0015
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    mo = nt.nodes.new('ShaderNodeTexNoise'); mo.inputs['Scale'].default_value = 14; mo.inputs['Detail'].default_value = 1
    nt.links.new(geo.outputs['Position'], mo.inputs['Vector'])
    k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = mottle * 2
    nt.links.new(mo.outputs['Fac'], k.inputs[0])
    mix = nt.nodes.new('ShaderNodeMixRGB'); mix.inputs['Color1'].default_value = hexc(col)
    mix.inputs['Color2'].default_value = [c * .8 for c in hexc(col)[:3]] + [1]
    nt.links.new(k.outputs[0], mix.inputs['Fac']); nt.links.new(mix.outputs['Color'], b.inputs['Base Color'])
    return m

def softpaint(name, col, alpha=.8):
    """a painted spot (blush) that fades out at its edge"""
    if name in MATS: return MATS[name]
    m = mat(name, col, .8); nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sub = nt.nodes.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'; sub.inputs[1].default_value = (.5, .5, .5)
    mul = nt.nodes.new('ShaderNodeVectorMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = (1, 0, 1)
    ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0; mr.inputs['From Max'].default_value = .5
    mr.inputs['To Min'].default_value = alpha; mr.inputs['To Max'].default_value = 0
    nt.links.new(tc.outputs['Generated'], sub.inputs[0]); nt.links.new(sub.outputs[0], mul.inputs[0])
    nt.links.new(mul.outputs[0], ln.inputs[0]); nt.links.new(ln.outputs['Value'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], b.inputs['Alpha'])
    return m

def glass(name, col='#fff8e6'):
    if name in MATS: return MATS[name]
    m = mat(name, col, .04); b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['IOR'].default_value = 1.45
    return m

def pstar(name, m, c, r, depth, rot, inner=.52, lv=2):
    """a puffy, rounded star (felt or glowing), its face along +Z before the turn"""
    bm = bmesh.new(); top, bot = [], []
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5; rr = r if i % 2 == 0 else r * inner
        top.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, depth / 2)))
        bot.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, -depth / 2)))
    ct = bm.verts.new((0, 0, depth * 1.1)); cb = bm.verts.new((0, 0, -depth * .8))
    for i in range(10):
        j = (i + 1) % 10
        bm.faces.new((top[i], top[j], ct)); bm.faces.new((bot[j], bot[i], cb)); bm.faces.new((top[j], top[i], bot[i], bot[j]))
    bmesh.ops.transform(bm, matrix=Matrix.LocRotScale(Vector(c), Euler(rot), Vector((1, 1, 1))), verts=bm.verts)
    o = obj_from(bm, name, m); subsurf(o, lv); return o

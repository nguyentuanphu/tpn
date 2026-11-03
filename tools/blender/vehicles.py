# The friends and villagers on vehicles and public transport (owner, 3 Nov 2026 AEDT: "Mấy nhân vật và villages nhìn ntn khi đi phương tiện xe, xe công cộng?").
# Loads characters saved by lumi.py (built with `rig`), poses them sitting or riding, builds felt vehicles and renders three pictures:
#   a Vietnamese motorbike (a dad riding, his daughter behind), a bicycle (an Australian boy), a city bus with passengers at the windows.
# Run: blender -b -P tools/blender/vehicles.py -- <dir with the characters' .blend files> <out dir> [quick]
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.dont_write_bytecode = True
import bpy, bmesh
from mathutils import Vector, Matrix, Euler
from svkit import reset, mat, felt, hexc, sphere, tube, lathe, subsurf, obj_from

argv = sys.argv[sys.argv.index('--') + 1:]
CROWD = False
SRC, OUT = argv[0], argv[1]; QUICK = 'quick' in argv
os.makedirs(OUT, exist_ok=True)

def load(name, loc, rot_z=0.0, pose='sit', frame=10, face='smile'):
    """bring one character in, pose it, and stand its hips at loc (x, y, hip height) facing -y turned by rot_z"""
    path = os.path.join(SRC, name + '.blend')
    with bpy.data.libraries.load(path) as (src, dst):
        dst.collections = [c for c in src.collections]
        dst.objects = [n for n in src.objects if n == 'rig' or n.startswith(('lanternLight', 'propLight'))]
    rig = next(o for o in dst.objects if o and o.type == 'ARMATURE')
    for c in dst.collections:
        if c is None: continue
        bpy.context.scene.collection.children.link(c)
        if c.name.startswith('face-'): c.hide_render = not c.name.startswith('face-' + face)
    for o in dst.objects:
        if o is not None and o.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(o)
    for c in dst.collections:   # lighter smoothing in a crowd scene (memory); invisible at this distance
        for o in (c.all_objects if c else []):
            for m in o.modifiers:
                if m.type == 'SUBSURF': m.levels = 0; m.render_levels = 0 if CROWD else min(m.render_levels, 1)
    for c in [c for c in dst.collections if c and c.name.startswith('face-') and not c.name.startswith('face-' + face)]:   # faces not shown: drop them
        for o in list(c.all_objects): bpy.data.objects.remove(o)
    act = next((t.strips[0].action for t in rig.animation_data.nla_tracks if t.name == pose), None)
    rig.animation_data.action = act; bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    hip = (rig.matrix_world @ rig.pose.bones['legL'].head)
    rig.rotation_euler = (0, 0, rot_z); rig.location = Vector(loc) - Vector((0, 0, hip.z)) + Vector((0, 0, 0))
    return rig

def box(name, m, c, size, bevel=.06, seg=3):
    """a soft rounded box"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((*size, 1)), verts=bm.verts)
    o = obj_from(bm, name, m, False); bv = o.modifiers.new('round', 'BEVEL'); bv.width = bevel; bv.segments = seg; bv.limit_method = 'NONE'
    for p in o.data.polygons: p.use_smooth = True
    return o

def wheel(c, r, w, axis='x', tyre='#2b2b2e', rim='#d9d6cf'):
    T = felt('tyre', tyre, .8, .05); M = mat('rim', rim, .35, metal=.6)
    rot = (0, math.pi / 2, 0) if axis == 'x' else (math.pi / 2, 0, 0)
    q = Euler(rot).to_matrix()
    ring = [Vector(c) + q @ Vector((math.cos(t) * r, math.sin(t) * r, 0)) for t in [2 * math.pi * k / 40 for k in range(41)]]
    tube('tyre', T, ring, w, 12, False)
    sphere('hub', M, c, (r * .3, r * .3, w * .9) if axis == 'z' else (w * .9, r * .3, r * .3), 16, 8)
    for k in range(8):
        a = k * math.pi / 4; tube('spoke', M, [Vector(c), Vector(c) + q @ Vector((math.cos(a) * r * .9, math.sin(a) * r * .9, 0))], .006, 6)

def studio(bg='#f3ead7', target=(0, 0, .8), k=1.0, face_light=None):
    scene = bpy.context.scene
    world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = hexc('#fff6e6'); world.node_tree.nodes['Background'].inputs[1].default_value = .45
    for loc, e, col, size in (((-3, -4.5, 4.5), 420, '#fff4e4', 5), ((4, -3, 2.5), 150, '#ffe9d2', 3.5), ((0, 4.5, 4), 260, '#fff8e8', 4)):
        d = bpy.data.lights.new('L', 'AREA'); d.energy = e * k * k; d.color = hexc(col)[:3]; d.size = size * k
        o = bpy.data.objects.new('L', d); scene.collection.objects.link(o); o.location = Vector(loc) * k
        o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    if face_light:   # a soft light from the camera's side, so faces are lit
        d = bpy.data.lights.new('F', 'AREA'); d.energy = 160 * k * k; d.size = 2.5 * k; d.color = hexc('#fff4e4')[:3]
        o = bpy.data.objects.new('F', d); scene.collection.objects.link(o); o.location = face_light
        o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    me = bpy.data.meshes.new('g'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30); bm.to_mesh(me)
    g = bpy.data.objects.new('ground', me); scene.collection.objects.link(g); g.data.materials.append(mat('groundM', bg, .9)); g.is_shadow_catcher = True
    cd = bpy.data.cameras.new('cam'); cd.lens = 50; cam = bpy.data.objects.new('cam', cd); scene.collection.objects.link(cam); scene.camera = cam
    scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 16 if QUICK else 80; scene.cycles.use_denoising = True
    scene.render.film_transparent = True; scene.view_settings.view_transform = 'Standard'
    scene.use_nodes = True; nt = scene.node_tree; nt.nodes.clear()
    rl = nt.nodes.new('CompositorNodeRLayers'); ao = nt.nodes.new('CompositorNodeAlphaOver'); ao.inputs[1].default_value = hexc(bg); cp = nt.nodes.new('CompositorNodeComposite')
    nt.links.new(rl.outputs['Image'], ao.inputs[2]); nt.links.new(ao.outputs['Image'], cp.inputs['Image'])
    return cam

def shoot(cam, name, loc, target, res=(1200, 800)):
    scene = bpy.context.scene; q = .5 if QUICK else 1
    scene.render.resolution_x, scene.render.resolution_y = int(res[0] * q), int(res[1] * q)
    cam.location = loc; cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)

# ---------- 1. a Vietnamese motorbike: dad riding with his helmet on, his daughter behind ----------
def motorbike():
    reset(); RED = felt('bikeRed', '#c9473f', .45, .03); CREAM = felt('bikeCream', '#efe6d2', .5, .03); DARK = felt('bikeDark', '#3a3a3f', .6, .03)
    SEAT = felt('bikeSeat', '#4a3a32', .7, .05); CHROME = mat('chrome', '#d9d6cf', .25, metal=.8); LAMP = mat('lamp', '#fff3c4', .2, emit=2)
    # the scooter faces -y: front wheel at y -.65, back wheel at y +.55
    # the riders first, then the scooter is fitted to them: grips in the hands, the floorboard under the feet
    dad = load('villager-vn-dad-adult', (0, .1, .87), 0, 'ride', 1)
    load('villager-vn-schoolgirl-game', (0, .62, .87), 0, 'passenger', 1, 'happy')
    hands, feet = hands_feet(dad); fz = min(f.z for f in feet) - .05
    wheel((0, -.68, .24), .24, .07, 'x'); wheel((0, .58, .24), .24, .07, 'x')
    box('floor', DARK, (0, -.05, fz), (.34, .7, .06), .03)
    box('shield', RED, (0, -.5, .62), (.4, .14, .62), .07)
    box('frontMud', RED, (0, -.68, .42), (.22, .3, .12), .06)
    box('rearBody', RED, (0, .42, .58), (.42, .72, .38), .14)
    box('seat', SEAT, (0, .36, .82), (.36, .9, .1), .05)
    box('stripe', CREAM, (0, .42, .5), (.43, .7, .05), .025)
    hm = (hands[0] + hands[1]) / 2
    tube('steer', CHROME, [(0, -.56, .9), (0, hm.y - .06, hm.z - .02)], .03, 10)
    tube('handlebar', CHROME, [hands[1] + Vector((.03, .01, 0)), Vector((0, hm.y - .06, hm.z + .01)), hands[0] + Vector((-.03, .01, 0))], .022, 10)
    for k, s in enumerate((1, -1)):
        h = hands[k]; tube('grip', DARK, [h + Vector((-s * .05, 0, 0)), h + Vector((s * .05, 0, 0))], .03, 10)
        tube('mirror', CHROME, [h + Vector((-s * .06, -.02, .01)), h + Vector((-s * .02, -.05, .2))], .01, 6); sphere('mirrorGlass', CHROME, h + Vector((-s * .015, -.05, .22)), (.06, .015, .04), 12, 6)
    sphere('headlight', LAMP, (0, -.62, hm.z - .1), (.09, .05, .07), 16, 8)
    sphere('taillight', mat('tail', '#ff5a4a', .3, emit=1.5), (0, .8, .7), (.08, .03, .04), 12, 6)
    box('plate', CREAM, (0, .82, .5), (.2, .02, .1), .01)
    cam = studio(target=(0, 0, .9), face_light=(-1.6, -3.5, 1.8))
    shoot(cam, 'vehicle-motorbike', (-2.7, -4.6, 1.9), (0, .1, 1.15))

def hands_feet(rig):
    """where the rider's hands and feet are once posed (left first)"""
    bpy.context.view_layer.update(); mw = rig.matrix_world; pb = rig.pose.bones
    hands = [mw @ pb[n].tail for n in ('elbowL', 'elbowR')]
    feet = [mw @ pb[n].tail + Vector((0, -.04, -.04)) for n in ('kneeL', 'kneeR')]
    return hands, feet

# ---------- 2. a bicycle: an Australian boy in his bucket hat and thongs, hands on the grips, feet on the pedals ----------
def bicycle():
    reset(); FR = felt('frame', '#2f8fd1', .4, .03); DARK = felt('bikeDark', '#3a3a3f', .6, .03); CHROME = mat('chrome', '#d9d6cf', .25, metal=.8)
    boy = load('villager-au-boy-game', (0, .14, .9), 0, 'ride', 7, 'excited')
    hands, feet = hands_feet(boy)
    crank = Vector((0, (feet[0].y + feet[1].y) / 2, (feet[0].z + feet[1].z) / 2))
    wheel((0, -.55, .3), .3, .03, 'x'); wheel((0, .55, .3), .3, .03, 'x')
    head = Vector((0, -.42, .82)); seat = Vector((0, .12, .78))
    for a, b in (((0, .55, .3), crank), (crank, seat), ((0, .55, .3), seat), (seat, head), (crank, head), (head, (0, -.55, .3))):
        tube('frameTube', FR, [a, b], .025, 10)
    for f, s in zip(feet, (1, -1)):   # crank arms and pedals under the feet
        arm_end = Vector((s * .07, f.y, f.z - .02)); tube('crankArm', CHROME, [crank + Vector((s * .05, 0, 0)), arm_end], .012, 8)
        box('pedal', DARK, arm_end + Vector((s * .03, 0, 0)), (.08, .1, .02), .01)
    sphere('chainring', CHROME, crank, (.02, .09, .09), 20, 10)
    tube('seatPost', CHROME, [seat, seat + Vector((0, .02, .08))], .015, 8); box('saddle', DARK, seat + Vector((0, .02, .1)), (.1, .22, .04), .02)
    hm = (hands[0] + hands[1]) / 2
    tube('stem', CHROME, [head, Vector((0, hm.y - .05, hm.z - .03))], .018, 8)
    tube('handlebar', CHROME, [hands[1] + Vector((.03, .02, 0)), Vector((0, hm.y - .05, hm.z - .02)), hands[0] + Vector((-.03, .02, 0))], .015, 8)
    for k, s in enumerate((1, -1)): tube('grip', DARK, [hands[k] + Vector((-s * .045, 0, 0)), hands[k] + Vector((s * .045, 0, 0))], .022, 8)
    sphere('bell', CHROME, Vector((.1, hm.y - .05, hm.z)), (.025, .025, .02), 10, 5)
    cam = studio(target=(0, 0, .7), face_light=(-1.2, -3, 1.6))
    shoot(cam, 'vehicle-bicycle', (-2.3, -3.9, 1.55), (0, .0, .95))

# ---------- 3. the city bus: a driver at the wheel, the four friends and neighbours riding, faces to the windows ----------
def bus():
    global CROWD; CROWD = True
    reset(); BODY = felt('busBody', '#f2c14e', .45, .03); TRIM = felt('busTrim', '#2f8fd1', .45, .03); DARK = felt('busDark', '#3a3a3f', .6, .03)
    SEATM = felt('busSeat', '#c9473f', .7, .05); GL = mat('busGlass', '#cfe8f2', .05); GL.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = .85
    L, W, floor = 7.0, 2.5, .55
    for x in (-1, 1):
        for y in (-2.6, 2.4): wheel((x * (W / 2 - .05), y, .45), .45, .12, 'x')
    box('busFloor', DARK, (0, 0, floor - .05), (W, L, .1), .04)
    box('busLower', BODY, (W / 2 - .05, 0, .95), (.1, L, .8), .04); box('busLowerL', BODY, (-W / 2 + .05, 0, .95), (.1, L, .8), .04)
    box('busRoof', BODY, (0, 0, 3.05), (W, L, .2), .1)
    box('busBack', BODY, (0, L / 2, 1.8), (W, .12, 2.5), .05); box('busFront', BODY, (0, -L / 2, 1.05), (W, .12, 1.0), .05)
    box('windscreen', GL, (0, -L / 2, 2.25), (W - .2, .05, 1.35), .03)
    for side in (-1, 1):
        x = side * (W / 2 - .05)
        for k in range(5):   # window pillars (the windows are open so we can see in)
            y = -L / 2 + .1 + k * (L - .2) / 4; box('pillar', BODY, (x, y, 2.2), (.1, .1, 1.5), .03)
        box('stripeBlue', TRIM, (x * 1.01, 0, 1.25), (.03, L, .1), .02)
    box('busSign', DARK, (0, -L / 2 - .02, 2.8), (1.4, .04, .3), .03)
    for side in (-1, 1):
        for k in range(5):   # rows of seats facing forward
            y = -1.7 + k * .95; box('seat', SEATM, (side * .7, y, floor + .45), (.8, .45, .1), .04); box('seatBack', SEATM, (side * .7, y + .22, floor + .8), (.8, .08, .65), .04)
    hip = floor + .5
    # the driver at the front, the steering wheel in his hands
    box('driverSeat', DARK, (-.7, -2.7, floor + .45), (.6, .45, .1), .04); box('driverBack', DARK, (-.7, -2.48, floor + .8), (.6, .08, .65), .04)
    if os.path.exists(os.path.join(SRC, 'driver.blend')):
        drv = load('driver', (-.7, -2.75, hip), 0, 'ride', 1, 'smile'); hands, feet = hands_feet(drv); hm = (hands[0] + hands[1]) / 2
        ring = [hm + Vector((math.cos(t) * .2, math.sin(t) * .2 * .5, math.sin(t) * .2 * .87)) for t in [2 * math.pi * k / 32 for k in range(33)]]
        tube('steeringWheel', DARK, ring, .022, 10, False); tube('steeringColumn', DARK, [hm, hm + Vector((0, -.35, -.5))], .03, 8)
    who = [('lumi-game', 1, 0, 'happy'), ('finn-game', 1, 1, 'smile'), ('flora-game', -1, 1, 'excited'), ('sol-game', -1, 0, 'happy'),
           ('villager-vn-grandma-elder', 1, 3, 'smile'), ('villager-au-mum-adult', -1, 3, 'curious'), ('villager-vn-aodai-adult', 1, 4, 'smile')]
    for name, side, row, face in who:   # passengers turn a little towards the window to look out
        print('LOAD', name, flush=True)
        if os.path.exists(os.path.join(SRC, name + '.blend')): load(name, (side * .7, -1.7 + row * .95 - .05, hip), -.55, 'sit', 10 + row * 7, face)
    print('LOADED', flush=True); cam = studio(target=(0, 0, 1.6), k=1.6, face_light=(-4.5, -7, 2.6))
    shoot(cam, 'vehicle-bus', (-8.8, -10.2, 3.3), (0, -.6, 1.5), (1400, 800))

for fn in [f for f in (motorbike, bicycle, bus) if not [a for a in argv if a in ('motorbike', 'bicycle', 'bus')] or f.__name__ in argv]: fn()

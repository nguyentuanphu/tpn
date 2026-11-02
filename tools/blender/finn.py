# Finn, the sky explorer (owner's concept sheet "New character concepts", 2 Nov 2026 AEDT), built by script.
# Run: blender -b -P tools/blender/finn.py -- <out dir> [render]
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler
from svkit import reset, mat, sphere, tube, capsule, lathe, star, subsurf, studio, shoot, obj_from

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/finn'; RENDER = 'render' in argv
os.makedirs(OUT, exist_ok=True); random.seed(3)
scene = reset()

SKIN = mat('skin', '#f3c7a6', .5, .1, sss=.25)
HAIR = mat('hair', '#26315c', .55, .3)
HAIRL = mat('hairLight', '#36457a', .55, .3)
SHIRT = mat('shirt', '#f2e8d4', .9, .6, fuzz=.15)
PANTS = mat('pants', '#e8dcc0', .9, .6, fuzz=.15)
COAT = mat('coat', '#2f6f74', .85, .5, fuzz=.2)
COATIN = mat('coatLining', '#e7d9b8', .9, .4)
GOLD = mat('gold', '#d4a548', .35, metal=.8)
LEATHER = mat('leather', '#7a4a2a', .5, .2)
LEATHERD = mat('leatherDark', '#5a351f', .5, .2)
BOOT = mat('boot', '#6a4127', .45, .2)
SOLE = mat('sole', '#3a2516', .7)
EYEW = mat('eyeWhite', '#fbfaf6', .3)
IRIS = mat('iris', '#5a3a22', .25)
PUPIL = mat('pupil', '#1a110b', .2)
SHINE = mat('shine', '#ffffff', .2, emit=4)
LASH = mat('lash', '#23190f', .6)
BROW = mat('brow', '#26315c', .8)
LIP = mat('lip', '#a24b46', .5)
BLUSH = mat('blush', '#f0a090', .7)
GLOW = mat('glow', '#bfe6ff', .2, emit=6)

# ---------- head (about one fifth of the height) ----------
HC = Vector((0, 0, 1.13)); R = .13
head = sphere('head', SKIN, HC, (R * .98, R * .96, R * 1.07), 48, 32)
for v in head.data.vertices:  # a softer, narrower jaw and full cheeks
    p = v.co - HC
    if p.z < 0:
        k = min(1, -p.z / (R * 1.07)); v.co.x = HC.x + p.x * (1 - .22 * k ** 1.5); v.co.y = HC.y + p.y * (1 - .1 * k ** 1.5)
subsurf(head)
for s in (-1, 1): sphere('ear', SKIN, (s * .128, .005, 1.11), (.018, .012, .028))
FACE = lambda x, z: HC.y - math.sqrt(max(0, 1 - (x / (R * .98)) ** 2 - ((z - HC.z) / (R * 1.07)) ** 2)) * R * .96
onf = lambda x, z, out=0.0: Vector((x, FACE(x, z) - out, z))
for s in (-1, 1):
    ex, ez = s * .047, 1.115
    rot = (math.radians(90) - .1, 0, -s * .38)
    sphere('eyeWhite', EYEW, onf(ex, ez, .001), (.029, .026, .008), 24, 12, rot)
    sphere('iris', IRIS, onf(ex + s * .002, ez - .002, .005), (.021, .024, .006), 24, 12, rot)
    sphere('pupil', PUPIL, onf(ex + s * .002, ez - .003, .008), (.011, .013, .004), 16, 8, rot)
    sphere('shine', SHINE, onf(ex + s * .009, ez + .009, .011), (.006, .006, .002), 12, 6)
    lash = [onf(ex - s * .03, ez - .002, .008)] + [onf(ex + s * (-.03 + .06 * i / 6), ez + .021 * math.sin(math.pi * i / 6) + .004 * i / 6, .009) for i in range(1, 7)] + [onf(ex + s * .036, ez + .012, .008)]
    tube('lash', LASH, lash, [.0025] + [.0045] * 6 + [.002], 8)
    tube('brow', BROW, [onf(ex - s * .022, ez + .038, .006), onf(ex, ez + .045, .007), onf(ex + s * .024, ez + .04, .006)], [.0035, .005, .003], 8)
    sphere('blush', BLUSH, onf(s * .072, 1.085, .002), (.022, .006, .013), 16, 8, (0, 0, s * .6))
sphere('nose', SKIN, onf(0, 1.09, .003), (.007, .006, .006))
tube('smile', LIP, [onf(-.022, 1.064, .002), onf(-.01, 1.057, .003), onf(0, 1.055, .003), onf(.012, 1.058, .003), onf(.024, 1.066, .002)], [.002, .003, .003, .003, .002], 8)

# ---------- messy navy hair: tapered clumps from the crown, falling and flicking outwards ----------
cap = sphere('hairCap', HAIR, HC + Vector((0, .008, .022)), (R * 1.03, R * 1.02, R * 1.03), 40, 24)
bpy.context.view_layer.objects.active = cap
bm = bmesh.new(); bm.from_mesh(cap.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < HC.y - .06 and v.co.z < HC.z + .05) or v.co.z < HC.z - .07 or (v.co.y < HC.y and v.co.z < HC.z - .01)], context='VERTS')
bm.to_mesh(cap.data); bm.free(); subsurf(cap)
def clump(az, el, length, width, out=.35, curl=.5, m=HAIR):
    n = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    base = HC + Vector((n.x, n.y, n.z * 1.05)) * R * 1.0
    down = Vector((0, 0, -1)); t = (down - down.project(n)).normalized() if abs(n.z) < .97 else Vector((math.sin(az), -math.cos(az), 0))
    side = n.cross(t).normalized() * random.uniform(-.4, .4)
    pts, radii, p, d = [], [], base.copy(), (t + n * out + side).normalized()
    for i in range(7):
        f = i / 6; pts.append(p.copy()); radii.append((width * (1 - f) ** .8 + .0015, width * .55 * (1 - f) ** .8 + .001))
        p += d * length / 6; d = (d + n * curl * f * .5 + side * .15).normalized()
    return tube('hairClump', m, pts, radii, 10)
for ring, (el, cnt, ln, wd) in enumerate([(1.35, 7, .1, .03), (1.0, 12, .12, .032), (.65, 15, .13, .03), (.3, 15, .12, .028), (-.05, 12, .1, .024)]):
    for k in range(cnt):
        az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.1, .1); fr = math.cos(az)
        if el < .9 and fr > .6: continue
        if el < .4 and fr > .3: continue
        clump(az, el + random.uniform(-.06, .06), ln * random.uniform(.85, 1.2), wd, .3 + .2 * (el < .5), .6, HAIR if random.random() < .7 else HAIRL)
for k, az in enumerate([-.8, -.5, -.22, .08, .38, .65]):  # a swept fringe falling to the right
    clump(az, 1.05, .1 + .02 * (k % 2), .028, .15, .35, HAIRL if k % 2 else HAIR)
for k in range(4):  # a few loose strands sticking up on top
    clump(random.uniform(-2, 2), 1.45, .07, .018, .9, 1.4, HAIRL)

# ---------- body ----------
tube('neck', SKIN, [(0, 0, .95), (0, 0, 1.03)], .032, 16)
# shirt: torso with an open collar, sleeves rolled up below the coat's
lathe('shirt', SHIRT, [(.11, .62), (.12, .7), (.128, .8), (.135, .9), (.11, .955), (.04, .975)], 32, scale=(1, .78))
for s in (-1, 1):
    sphere('collar', SHIRT, (s * .035, -.06, .965), (.035, .012, .022), 16, 8, (0, 0, s * .5))
# baggy trousers tucked into the boots, a belt with a gold buckle
for s in (-1, 1):
    tube('trouser', PANTS, [(s * .06, 0, .66), (s * .07, -.005, .52), (s * .078, -.01, .38), (s * .074, 0, .24), (s * .062, .005, .17)], [.075, .082, .088, .082, .06], 20)
lathe('hips', PANTS, [(.0, .58), (.12, .6), (.125, .66), (.113, .69)], 28, scale=(1, .8))
lathe('belt', LEATHER, [(.116, .655), (.118, .69)], 28, scale=(1.02, .82))
sphere('buckle', GOLD, (0, -.1, .672), (.022, .006, .016))
# boots: chunky, folded cuff, two straps with gold buckles
for s in (-1, 1):
    lathe('boot', BOOT, [(.0, .0), (.06, .0), (.064, .03), (.058, .1), (.06, .16), (.068, .2)], 24, loc=(s * .062, -.005, 0), scale=(1, 1.15))
    sphere('toe', BOOT, (s * .062, -.06, .035), (.055, .06, .04), 20, 10)
    lathe('sole', SOLE, [(.0, -.005), (.068, -.005), (.068, .012)], 24, loc=(s * .062, -.02, 0), scale=(1, 1.45))
    lathe('cuff', LEATHER, [(.07, .17), (.074, .215), (.06, .22)], 24, loc=(s * .062, -.005, 0))
    for z in (.07, .125):
        lathe('strap', LEATHERD, [(.062, z), (.063, z + .016)], 24, loc=(s * .062, -.005, 0), scale=(1.02, 1.17))
        sphere('bootBuckle', GOLD, (s * .062 + s * .05, -.035, z + .008), (.008, .006, .01))
# the teal coat: open at the front, flaring a little, gold trim at the hem and a star on the back
coat = lathe('coat', COAT, [(.165, .52), (.15, .6), (.14, .7), (.142, .8), (.148, .9), (.12, .955), (.07, .975)], 40, scale=(1, .8), arc=(.55, 2 * math.pi - .55))
lathe('hem', GOLD, [(.168, .515), (.166, .528)], 40, scale=(1.005, .805), arc=(.55, 2 * math.pi - .55))
star('coatStar', GOLD, (0, .125, .62), .025, .004, (math.radians(-90), 0, 0))
tube('coatCollar', COAT, [(-.075, -.065, .96), (-.06, -.02, .99), (0, .045, 1.0), (.06, -.02, .99), (.075, -.065, .96)], .02, 12, False)
# arms: coat sleeves to the elbow, rolled shirt sleeve, forearm, fingerless glove
for s in (-1, 1):
    sh, el, wr = Vector((s * .15, 0, .92)), Vector((s * .2, -.005, .76)), Vector((s * .215, -.02, .6))
    tube('sleeve', COAT, [sh, sh.lerp(el, .5), el], [.05, .052, .05], 18)
    tube('cuffRoll', COATIN, [el + (el - sh).normalized() * -.01, el + (el - sh).normalized() * .02], .054, 18)
    tube('shirtSleeve', SHIRT, [el, el.lerp(wr, .35)], [.042, .04], 16)
    tube('forearm', SKIN, [el.lerp(wr, .3), wr], [.031, .027], 14)
    tube('glove', LEATHERD, [wr + Vector((0, 0, .03)), wr - Vector((0, 0, .02))], [.03, .031], 14)
    sphere('hand', SKIN, wr - Vector((0, .002, .05)), (.028, .02, .035))
    sphere('thumb', SKIN, wr - Vector((-s * -.02, .02, .035)), (.01, .01, .016))
# straps across the chest, a satchel, a spyglass at the hip and a backpack
tube('chestStrap', LEATHER, [(-.12, -.08, .92), (-.04, -.112, .82), (.06, -.112, .72), (.12, -.08, .66)], (.012, .004), 8, False)
tube('chestStrap2', LEATHER, [(.12, -.08, .92), (.06, -.112, .84)], (.012, .004), 8, False)
sphere('satchel', LEATHER, (.15, -.03, .6), (.045, .03, .05), 20, 10)
sphere('satchelFlap', LEATHERD, (.15, -.058, .62), (.044, .008, .03), 20, 10)
tube('spyglass', GOLD, [(-.15, -.06, .66), (-.16, -.07, .54)], [.016, .02], 14)
tube('spyglassGrip', LEATHER, [(-.152, -.062, .63), (-.156, -.066, .58)], .019, 14)
sphere('backpack', LEATHER, (0, .13, .82), (.1, .05, .11), 24, 12)
sphere('backpackFlap', LEATHERD, (0, .16, .87), (.095, .03, .06), 24, 12)
for s in (-1, 1): tube('packStrap', LEATHERD, [(s * .08, .1, .93), (s * .1, -.02, .955), (s * .1, -.06, .9)], (.011, .004), 8, False)
# the glowing compass star floating over the left hand
star('compass', GLOW, (.23, -.08, .5), .03, .006, (math.radians(90), 0, 0))

cam = studio(scene)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'finn.blend'))
if RENDER:
    for name, az in (('front', 0), ('side', math.pi / 2), ('back', math.pi), ('three-quarter', -.6)):
        shoot(scene, cam, OUT, name, az, .9, 4.4, .68)
    shoot(scene, cam, OUT, 'face', -.3, 1.15, 1.3, 1.12, (600, 520))

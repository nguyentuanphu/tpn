# (v1.08g creatures, owner 6 Nov 2026 AEDT: "Cac con rong, con chim deu etc phai blender thiet dep"; pop-up: butterflies
# stay butterflies, add little birds) The valley's little flocks made in Blender, in place of their 2D pictures: hens and a
# rooster, ducks, black swans, pond fish, butterflies and a new flock of little birds. Each is one small shape (one
# InstancedMesh per kind in js/flocks.ts); the butterflies' and birds' wings are their own model, turned to flap.
#   python3 tools/blender/world-flocks.py [name ...]   (pip install bpy), then tools/make-world-flocks.mts packs them
# The toolkit is tools/blender/world-nature.py's. Each model faces +z; a walker's feet and a swimmer's waterline are y = 0,
# a flyer's middle is at the origin, a wing hinges at x = 0 and spreads along +x (the game mirrors it for the other side).
import importlib.util, math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('world_nature', os.path.join(HERE, 'world-nature.py'))
WN = importlib.util.module_from_spec(spec); spec.loader.exec_module(WN)
Model, bpy = WN.Model, WN.bpy
WN.OUT = os.path.join(WN.ROOT, 'models', 'world', 'raw-flocks')
M = {}
def model(fn): M[fn.__name__.replace('_', '-')] = fn; return fn

def eyes(m, x, y, z, r):
    for s in (-1, 1):
        m.uv(r, '#2a1c14', (s * x, y, z), scl=(1, 1.1, .8), seg=10, ring=6, top=0); m.uv(r * .38, '#ffffff', (s * x + s * r * .2, y + r * .35, z + r * .45), seg=6, ring=4, top=0)
def hen(m, body, breast, wing, tail, comb, size=1.0, rooster=False):
    k = size
    m.uv(.17 * k, body, (0, .22 * k, 0), scl=(1, .92, 1.2), seg=16, ring=10)
    m.uv(.12 * k, breast, (0, .22 * k, .1 * k), scl=(1, 1.05, .9), seg=14, ring=8)
    m.uv(.1 * k, body, (0, .4 * k, .12 * k), seg=14, ring=10)   # head
    m.cone(.026 * k, .07 * k, '#ffb52e', (0, .39 * k, .23 * k), (1.57, 0, 0), seg=8)
    for j, (dz, r) in enumerate([(-.02, .028), (.02, .034), (.06, .028)]): m.uv(r * k * (1.4 if rooster else 1), comb, (0, .5 * k + (r * .5 if rooster else 0), .12 * k + dz * k), scl=(.5, 1, 1), seg=8, ring=6)
    m.uv(.02 * k * (1.4 if rooster else 1), comb, (0, .33 * k, .2 * k), scl=(.6, 1.3, .6), seg=8, ring=5)
    eyes(m, .055 * k, .42 * k, .19 * k, .016 * k)
    for s in (-1, 1):
        for j in range(4): m.leaf(.16 * k - j * .015 * k, .09 * k, wing, (s * .14 * k, .27 * k - j * .02 * k, .06 * k - j * .02 * k), math.atan2(-1, s * .15), droop=-.2, bend=.15, n=3)
        m.trunk([(s * .05 * k, .1 * k, 0), (s * .05 * k, .05 * k, .01 * k), (s * .05 * k, 0, .02 * k)], .012 * k, .01 * k, '#ffa21e', seg=6, flare=1)
        for dx in (-1, 0, 1): m.leaf(.045 * k, .014 * k, '#ffa21e', (s * .05 * k, .005, .02 * k), math.atan2(dx * .4, 1) - math.pi / 2, droop=0, bend=0, n=1)
    for j in range(7 if rooster else 5):
        a = (j - (3 if rooster else 2)) * .28; L = (.3 if rooster else .16) * k
        m.leaf(L, .07 * k, tail[j % len(tail)], (a * .03 * k, .3 * k, -.17 * k), math.pi / 2 + a * .7, droop=1.1 if not rooster else 1.25, bend=.9 if rooster else .2, n=6 if rooster else 4)   # (a rooster's long tail arches back and down)
@model
def flock_hen(): m = Model('flock-hen', 201); hen(m, '#c8783a', '#e8a868', '#a85e2a', ['#8a4a20', '#a85e2a'], '#e8332a'); return m
@model
def flock_rooster(): m = Model('flock-rooster', 202); hen(m, '#c0562a', '#f0a040', '#8a3a1a', ['#1f4a3a', '#2a6a4a', '#14302a', '#3a7a5a'], '#e8332a', 1.12, True); return m
@model
def flock_duck():
    """a mallard on the water (y = 0 the waterline): green head, white collar, brown breast, grey body"""
    m = Model('flock-duck', 203)
    m.uv(.15, '#a8a49a', (0, .03, -.02), scl=(1, .75, 1.45), seg=16, ring=10); m.uv(.1, '#8a5a3a', (0, .07, .12), scl=(1, 1, .9), seg=14, ring=8)
    m.trunk([(0, .09, .14), (0, .16, .16), (0, .22, .15)], .045, .04, '#2a7a4a', seg=10, flare=1); m.lathe([(.038, -.008), (.048, 0), (.038, .008)], '#ffffff', (0, .14, .155), seg=12)
    m.uv(.075, '#2a7a4a', (0, .25, .16), scl=(.9, .9, 1.1), seg=14, ring=10)
    m.uv(.03, '#f0b02a', (0, .235, .24), scl=(1.2, .45, 1.6), seg=10, ring=6)
    eyes(m, .045, .27, .2, .013)
    for s in (-1, 1):
        for j in range(4): m.leaf(.18 - j * .02, .08, ['#7a7a74', '#5a5a56', '#3a5aa8', '#ffffff'][j], (s * .12, .1 - j * .01, .04 - j * .03), math.atan2(-1, s * .1), droop=.05, bend=.15, n=3)
    for j in range(3): m.leaf(.08, .05, '#2a2a2a', ((j - 1) * .03, .07, -.2), math.pi / 2 + (j - 1) * .3, droop=.6, bend=-.4, n=2)
    return m
@model
def flock_swan():
    """a black swan (y = 0 the waterline): curled neck, red beak with a white tip, ruffled wing feathers"""
    m = Model('flock-swan', 204)
    m.uv(.2, '#1e1e24', (0, .06, -.04), scl=(1, .7, 1.5), seg=16, ring=10)
    m.trunk([(0, .1, .16), (0, .3, .22), (0, .48, .18), (0, .55, .22)], .05, .035, '#25252c', seg=10, flare=1)
    m.uv(.06, '#25252c', (0, .56, .25), scl=(.9, .85, 1.2), seg=12, ring=8)
    m.cone(.03, .12, '#d8202a', (0, .545, .34), (1.57, 0, 0), scl=(1.2, 1, .6), seg=10); m.uv(.012, '#ffffff', (0, .54, .4), seg=6, ring=4)
    eyes(m, .04, .575, .28, .012)
    for s in (-1, 1):
        for j in range(6): m.leaf(.2 - j * .015, .09, '#2e2e36' if j % 2 else '#1a1a20', (s * .14, .16 - j * .02, .02 - j * .05), math.atan2(-1, s * .2), droop=-.5 + j * .05, bend=-.3, n=3)
    return m
def fish(m, body, fin, stripes=None):
    m.lathe([(0, -.17), (.035, -.13), (.06, -.04), (.065, .03), (.05, .1), (.025, .15), (0, .17)], body, (0, 0, 0), (math.pi / 2, 0, 0), scl=(.75, 1, 1), seg=16)
    if stripes:
        for z in stripes: m.lathe([(.067 * (1 - abs(z) * 2.2), -.012), (.07 * (1 - abs(z) * 2.2), 0), (.067 * (1 - abs(z) * 2.2), .012)], '#ffffff', (0, 0, z), (math.pi / 2, 0, 0), scl=(.78, 1, 1), seg=16)
    m.leaf(.12, .12, fin, (0, 0, -.15), math.pi / 2, droop=0, bend=-.1, n=3, fold=0)   # the tail
    m.leaf(.07, .05, fin, (0, .05, .0), math.pi / 2, droop=.5, bend=.1, n=2, fold=0)    # the back fin
    for s in (-1, 1): m.leaf(.05, .03, fin, (s * .04, -.02, .05), math.atan2(-.5, s), droop=-.3, bend=0, n=2, fold=0)
    eyes(m, .036, .015, .1, .011)
@model
def flock_fish(): m = Model('flock-fish', 205); fish(m, '#ff8a2a', '#ffb05a'); return m
@model
def flock_clownfish(): m = Model('flock-clownfish', 206); fish(m, '#ff7a1a', '#ff9a3a', (.07, -.05)); return m
@model
def flock_butterfly():
    """a butterfly's body (its wings are flock-butterfly-wing): soft round head and body, curled antennae"""
    m = Model('flock-butterfly', 207)
    m.lathe([(0, -.1), (.018, -.07), (.022, 0), (.02, .04), (0, .05)], '#3a2a3a', (0, 0, 0), (math.pi / 2, 0, 0), seg=10)
    m.uv(.026, '#3a2a3a', (0, .005, .065), seg=10, ring=7); eyes(m, .016, .01, .085, .007)
    for s in (-1, 1): m.trunk([(s * .01, .02, .08), (s * .025, .06, .1), (s * .04, .08, .095)], .003, .003, '#3a2a3a', seg=4, flare=1); m.uv(.008, '#3a2a3a', (s * .04, .08, .095), seg=6, ring=4)
    return m
@model
def flock_butterfly_wing():
    """one butterfly wing (the game mirrors it and tints it): a big round fore wing and a smaller hind wing with spots"""
    m = Model('flock-butterfly-wing', 208)
    def wing(b, pts, th=.004):
        n = len(pts); vs = [[b.verts.new((x, o, z)) for x, z in pts] for o in (0, -th)]
        b.faces.new(vs[0]); b.faces.new(list(reversed(vs[1])))
        for k in range(n): b.faces.new([vs[0][k], vs[0][(k + 1) % n], vs[1][(k + 1) % n], vs[1][k]])
    fore = [(.0, .0)] + [(.02 + .17 * math.sin(t) * (1 - .25 * t), .02 + .14 * math.sin(t * .9) * math.cos(t * .55)) for t in [i * math.pi / 12 for i in range(1, 12)]]
    hind = [(.0, -.005)] + [(.015 + .11 * math.sin(t), -.02 - .1 * math.sin(t * .8) * (1 - .3 * t)) for t in [i * math.pi / 12 for i in range(1, 12)]]
    m._add(lambda b: wing(b, fore), '#ffffff', top=.05); m._add(lambda b: wing(b, hind), '#f2f2f2', top=.05)
    for (x, z, r) in [(.12, .07, .022), (.15, .03, .014), (.08, -.06, .016)]: m.cyl(r, r, .006, '#3a2a3a', (x, 0, z), seg=10, top=0); m.cyl(r * .45, r * .45, .008, '#fff8e0', (x, 0, z), seg=8, top=0)
    m.trunk([(.01, 0, .01), (.1, 0, .09), (.17, 0, .1)], .003, .002, '#3a2a3a', seg=4, flare=1)
    return m
@model
def flock_bird():
    """a little bird (a sparrow): round brown body, cream belly, a short beak (its wings are flock-bird-wing)"""
    m = Model('flock-bird', 209)
    m.uv(.06, '#9a6a42', (0, 0, 0), scl=(1, .9, 1.3), seg=14, ring=10); m.uv(.045, '#f2e2c4', (0, -.015, .025), scl=(1, .9, 1.1), seg=12, ring=8)
    m.uv(.042, '#8a5a36', (0, .03, .07), seg=12, ring=8); m.cone(.012, .03, '#3a2a1a', (0, .025, .115), (1.57, 0, 0), seg=6)
    eyes(m, .024, .04, .095, .008)
    for j in range(3): m.leaf(.07, .035, '#6a4a2a', ((j - 1) * .012, .005, -.07), math.pi / 2 + (j - 1) * .25, droop=-.1, bend=-.2, n=2)
    return m
@model
def flock_bird_wing():
    m = Model('flock-bird-wing', 210)
    for j in range(4): m.leaf(.11 - j * .015, .045, ['#7a5232', '#6a4a2a', '#5a3a22', '#8a6a4a'][j], (.0, 0, .02 - j * .02), -.15 * j, droop=0, bend=.1, n=3, fold=.1)
    return m

def main():
    want = [a for a in sys.argv[1:] if not a.startswith('-')]
    bpy.ops.wm.read_factory_settings(use_empty=True); WN.HD = False
    for name, fn in M.items():
        if want and name not in want: continue
        mm = fn(); t = mm.tris(); mm.save(); print(f'{name}: {t} triangles')

if __name__ == '__main__':
    main()

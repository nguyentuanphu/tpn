# (v1.08g festivals, owner 6 Nov 2026 AEDT: "Go, but richer") The festivals' own decorations, the four pieces they all
# share, the lantern quest's lantern, the hoi lang pole and flag, the folk show's sign post and stage, and the kite, made
# by script in Blender in the soft picture-book style (our own models; no downloads).
#   python3 tools/blender/world-festivals.py [name ...]    (pip install bpy), then tools/make-world-festivals.mts packs them
# - The toolkit (smooth shading, painted light, turned shapes, rounded boxes, leaves) is tools/blender/world-nature.py's.
# - Each model stands on y = 0 and faces +z, in its code shape's size (js/festivals.ts own() and shared(), js/dinh.ts
#   buildLantern, js/hoilang.ts, js/folkshow.ts, js/kite.ts), so the festival patches, colliders and taps stay true.
# - "-glow" models are the parts lit at night (lantern glass, diya flames, pumpkin faces): the game draws them with the
#   festival's glow material, as it does the code glows.
# - Colour slots: parts painted pure red, blue or green (SLOT_A, SLOT_B, SLOT_C) are repainted by the game with the
#   festival's own colours (js/festivals.ts prop(..., pal)), so one shared piece serves every festival.
import importlib.util, math, os, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('world_nature', os.path.join(HERE, 'world-nature.py'))
WN = importlib.util.module_from_spec(spec); spec.loader.exec_module(WN)
Model, bpy = WN.Model, WN.bpy
WN.OUT = os.path.join(WN.ROOT, 'models', 'world', 'raw-fest')
SLOT_A, SLOT_B, SLOT_C = '#ff0000', '#0000ff', '#00ff00'
WOOD, DARKWOOD, GOLD, PAPER = '#8a5a3b', '#6a4a3a', '#e8b62a', '#fff3c4'
M = {}
def model(fn): M[fn.__name__.replace('_', '-')] = fn; return fn
def pole(m, h, r=.035, col=WOOD, foot=True):
    m.trunk([(0, 0, 0), (0, h * .5, 0), (0, h, 0)], r * 1.15, r, col, seg=8, flare=1)
    m.lathe([(0, 0), (.14, 0), (.15, .03), (.11, .07), (0, .08)], '#7a6a5a', seg=14) if foot else None
    m.uv(r * 1.6, GOLD, (0, h + r, 0), seg=10, ring=6, top=.3)

# ---------- Tet ----------
@model
def fe_caudoi():
    """a red cau doi banner on a pole: a gold border, rolled wooden ends and a tassel (its gold middle glows at night)"""
    m = Model('fe-caudoi', 101); pole(m, 1.85)
    m.box(.62, .92, .04, '#c62828', (0, 1.2, .06), bevel=.01)
    for y in (1.69, .71): m.lathe([(0, -.36), (.03, -.36), (.035, -.33), (.035, .33), (.03, .36), (0, .36)], DARKWOOD, (0, y, .06), (0, 0, math.pi / 2), seg=10); m.uv(.035, GOLD, (.38, y, .06), seg=8, ring=5); m.uv(.035, GOLD, (-.38, y, .06), seg=8, ring=5)
    for (w, h, x, y) in [(.58, .025, 0, 1.635), (.58, .025, 0, .765), (.025, .85, -.29, 1.2), (.025, .85, .29, 1.2)]: m.box(w, h, .01, GOLD, (x, y, .085), top=0)
    m.trunk([(0, .7, .06), (0, .58, .06)], .008, .008, GOLD, seg=4, flare=1); m.lathe([(0, 0), (.04, .02), (.035, .12), (0, .14)], '#e8433a', (0, .44, .06), seg=10)
    return m
@model
def fe_caudoi_glow():
    m = Model('fe-caudoi-glow', 102)
    m.box(.36, .5, .015, '#ffd23f', (0, 1.2, .088), bevel=.004, top=0)
    for k in range(3): m.box(.06, .06, .01, '#c62828', (0, 1.36 - k * .16, .098), (0, 0, math.pi / 4), top=0)  # three red diamond characters
    return m

# ---------- Halloween (friendly: round faces, big eyes, smiles) ----------
def pumpkin(m, pos, s, face=True):
    x, y, z = pos
    m.lathe([(0, 0), (.16, .02), (.27, .09), (.31, .2), (.29, .33), (.2, .43), (.08, .47), (0, .45)], '#f08a24', (x, y, z), scl=(s, s, s), seg=28, ribs=8, rib=.1, top=.2)
    m.trunk([(x, y + .44 * s, z), (x + .02 * s, y + .52 * s, z), (x + .07 * s, y + .58 * s, z + .02 * s)], .04 * s, .03 * s, '#4f7a2a', seg=6, flare=1)
    m.leaf(.16 * s, .1 * s, '#5f9a3a', (x, y + .48 * s, z), 2.4, droop=.3, bend=.3, n=3)
def pumpkin_face(m, pos, s):
    x, y, z = pos; f = .3 * s
    for e in (-1, 1): m.uv(.055 * s, '#ffd23f', (x + e * .1 * s, y + .3 * s, z + f), scl=(1, 1.15, .4), seg=10, ring=6, top=0)
    for k in range(7): a = math.pi * (.15 + .7 * k / 6); m.uv(.03 * s, '#ffd23f', (x + math.cos(a) * .11 * s, y + .19 * s - math.sin(a) * .05 * s, z + f - .005), scl=(1, 1, .4), seg=8, ring=5, top=0)
@model
def fe_pumpkins():
    m = Model('fe-pumpkins', 110); pumpkin(m, (0, 0, 0), 1.4); pumpkin(m, (.55, 0, .42), .6); return m
@model
def fe_pumpkins_glow():
    m = Model('fe-pumpkins-glow', 111); pumpkin_face(m, (0, 0, 0), 1.4); pumpkin_face(m, (.55, 0, .42), .6); return m
@model
def fe_skeleton():
    """a friendly waving skeleton: round smiling skull, rounded bones"""
    m = Model('fe-skeleton', 112); B = '#f6f2e6'
    m.uv(.24, B, (0, 1.56, 0), scl=(1, .95, .95), seg=16, ring=12, top=.2)
    for e in (-1, 1): m.uv(.055, '#2a2a3a', (e * .08, 1.6, .2), scl=(1, 1.2, .5), seg=10, ring=6, top=0)
    m.trunk([(-.07, 1.47, .2), (0, 1.44, .22), (.07, 1.47, .2)], .012, .012, '#2a2a3a', seg=5, flare=1)
    m.trunk([(0, .72, 0), (0, 1.05, 0), (0, 1.36, 0)], .035, .035, B, seg=8, flare=1)
    for j in range(4): m.lathe([(0, -.03), (.17 - j * .02, -.02), (.18 - j * .02, 0), (.17 - j * .02, .02), (0, .03)], B, (0, 1.24 - j * .1, 0), scl=(1, 1, .55), seg=14)
    m.lathe([(0, -.05), (.15, -.04), (.16, 0), (.12, .05), (0, .06)], B, (0, .74, 0), scl=(1, 1, .7), seg=14)
    for s in (-1, 1):  # arms: one waving
        up = s < 0
        m.trunk([(s * .17, 1.3, 0), (s * .3, 1.42 if up else 1.12, .02), (s * .36, 1.62 if up else .95, .05)], .028, .025, B, seg=6, flare=1)
        m.uv(.05, B, (s * .37, 1.67 if up else .9, .05), seg=8, ring=6)
        m.trunk([(s * .09, .72, 0), (s * .1, .4, .02), (s * .1, .06, .02)], .035, .03, B, seg=6, flare=1); m.uv(.06, B, (s * .1, .04, .07), scl=(1, .6, 1.5), seg=8, ring=6)
    return m
@model
def fe_web():
    """a round spider web between two posts with a little purple spider with big eyes"""
    m = Model('fe-web', 113); W = '#e8e8f0'
    for s in (-1, 1): m.trunk([(s * .6, 0, 0), (s * .6, .9, 0), (s * .6, 1.8, 0)], .045, .035, DARKWOOD, seg=8, flare=1.2); m.uv(.05, GOLD, (s * .6, 1.82, 0), seg=8, ring=5)
    for j in range(10): a = j / 10 * math.tau; m.trunk([(0, 1.25, 0), (math.cos(a) * .55, 1.25 + math.sin(a) * .5, 0)], .007, .007, W, seg=4, flare=1)
    for r in (.18, .34, .5):
        pts = [(math.cos(j / 10 * math.tau) * r, 1.25 + math.sin(j / 10 * math.tau) * r * .92, 0) for j in range(11)]
        for j in range(10):
            (x0, y0, z0), (x1, y1, z1) = pts[j], pts[j + 1]; mid = ((x0 + x1) / 2 * .93, 1.25 + ((y0 + y1) / 2 - 1.25) * .93, 0)
            m.trunk([pts[j], mid, pts[j + 1]], .006, .006, W, seg=4, flare=1)
    m.uv(.09, '#7a4aa0', (.14, 1.17, .04), seg=12, ring=8); m.uv(.06, '#8a5ab0', (.14, 1.27, .04), seg=10, ring=6)
    for e in (-1, 1): m.uv(.028, '#ffffff', (.14 + e * .03, 1.29, .09), seg=8, ring=5, top=0); m.uv(.013, '#2a2a3a', (.14 + e * .03, 1.29, .11), seg=6, ring=4, top=0)
    for j in range(4):
        for s in (-1, 1): m.trunk([(.14 + s * .06, 1.17 + (j - 1.5) * .035, .04), (.14 + s * .14, 1.2 + (j - 1.5) * .06, .04), (.14 + s * .19, 1.12 + (j - 1.5) * .07, .04)], .01, .008, '#4a3a6a', seg=4, flare=1)
    return m
@model
def fe_ghost():
    """a smiling ghost: a soft white sheet with a wavy hem, floating a little, big dark eyes and an 'oo' mouth"""
    m = Model('fe-ghost', 114)
    prof = [(0, 1.62), (.2, 1.58), (.3, 1.45), (.33, 1.25), (.35, 1.0), (.38, .75), (.42, .55)]
    m.lathe(prof, '#ffffff', seg=24, top=.2, warp=lambda v: (v.x, v.y + (.05 * math.sin(math.atan2(v.z, v.x) * 7) if v.y < .6 else 0), v.z))
    for s in (-1, 1): m.trunk([(s * .3, 1.15, .05), (s * .45, 1.1, .12), (s * .5, 1.2, .2)], .07, .05, '#ffffff', seg=8, flare=1)  # little arms
    for e in (-1, 1): m.uv(.06, '#2a2a3a', (e * .1, 1.34, .27), scl=(1, 1.35, .5), seg=10, ring=6, top=0); m.uv(.018, '#ffffff', (e * .1 + .02, 1.37, .3), seg=6, ring=4, top=0)
    m.uv(.045, '#2a2a3a', (0, 1.17, .3), scl=(1, 1.1, .5), seg=10, ring=6, top=0)
    for e in (-1, 1): m.uv(.04, '#ffb3c8', (e * .18, 1.24, .27), scl=(1, .6, .3), seg=8, ring=5, top=0)
    return m
@model
def fe_cat():
    """a black cat sitting with its tail curled up, big yellow eyes and a pink nose"""
    m = Model('fe-cat', 115); C = '#2a2a34'
    m.uv(.2, C, (0, .22, 0), scl=(1, 1.15, .9), seg=16, ring=10); m.uv(.15, C, (0, .55, .05), seg=16, ring=10)
    for s in (-1, 1):
        m.cone(.055, .12, C, (s * .085, .7, .05), (0, 0, -s * .25), seg=8); m.cone(.03, .07, '#ff9ab8', (s * .085, .69, .07), (0, 0, -s * .25), seg=6)
        m.uv(.04, '#ffd23f', (s * .055, .57, .17), scl=(1, 1.2, .5), seg=10, ring=6, top=0); m.uv(.015, '#1a1a20', (s * .055, .57, .19), scl=(.5, 1.2, .5), seg=6, ring=4, top=0)
        m.uv(.05, C, (s * .09, .04, .12), scl=(1, .7, 1.3), seg=8, ring=6)
    m.uv(.015, '#ff9ab8', (0, .53, .2), seg=6, ring=4, top=0)
    m.trunk([(-.15, .1, -.12), (-.3, .3, -.15), (-.25, .55, -.12), (-.15, .65, -.1)], .03, .02, C, seg=7, flare=1)
    return m
@model
def fe_cauldron():
    m = Model('fe-cauldron', 116)
    m.lathe([(0, .12), (.2, .13), (.31, .25), (.33, .4), (.28, .52), (.26, .52), (.27, .49)], '#2a2a34', seg=24, top=.25)
    m.lathe([(.26, .5), (.29, .52), (.26, .54)], '#3a3a44', seg=24)
    for j in range(3): a = j / 3 * math.tau; m.trunk([(math.cos(a) * .18, .14, math.sin(a) * .18), (math.cos(a) * .24, 0, math.sin(a) * .24)], .03, .025, '#3a3a44', seg=6, flare=1)
    for s in (-1, 1): m.lathe([(0, -.04), (.04, -.03), (.05, 0), (.04, .03), (0, .04)], '#3a3a44', (s * .33, .45, 0), (0, 0, math.pi / 2), seg=10)
    return m
@model
def fe_cauldron_glow():
    m = Model('fe-cauldron-glow', 117)
    m.lathe([(0, .5), (.26, .5), (.25, .515), (0, .53)], '#5fd36a', seg=24, top=0)
    for j, (x, z, r) in enumerate([(-.1, .02, .06), (.06, -.06, .08), (.1, .08, .05), (-.02, .1, .045)]): m.uv(r, '#8af07a', (x, .55 + j * .04, z), seg=10, ring=6, top=.1)
    return m
@model
def fe_scarecrow():
    m = Model('fe-scarecrow', 118)
    m.trunk([(0, 0, 0), (0, .85, 0), (0, 1.7, 0)], .045, .04, DARKWOOD, seg=8, flare=1.2)
    m.trunk([(-.55, 1.25, 0), (0, 1.27, 0), (.55, 1.25, 0)], .03, .03, DARKWOOD, seg=6, flare=1)
    m.box(.44, .52, .22, '#5a7ad0', (0, 1.15, 0), bevel=.05); m.box(.12, .12, .01, '#e8433a', (.1, 1.05, .115), (0, 0, .3), top=0)  # a patch
    for s in (-1, 1): m.box(.18, .14, .16, '#5a7ad0', (s * .3, 1.25, 0), bevel=.04); [m.leaf(.12, .03, '#e8c25a', (s * .4, 1.25, 0), (1.57 if s > 0 else -1.57) + q * .5, droop=-.4, bend=.2, n=2) for q in (-1, 0, 1)]
    pumpkin(m, (0, 1.42, 0), .55)
    m.lathe([(0, 1.77), (.32, 1.77), (.33, 1.79), (.3, 1.8), (.16, 1.81), (.15, 1.95), (.1, 1.98), (0, 1.98)], '#d8b45a', seg=22)
    m.lathe([(.155, 1.81), (.16, 1.84), (.15, 1.86)], '#c62828', seg=22)
    return m
@model
def fe_witchhat():
    """a purple witch's hat on a pole and a bowl of sweets beside it"""
    m = Model('fe-witchhat', 119); pole(m, 1.3)
    m.lathe([(0, 1.3), (.3, 1.3), (.31, 1.32), (.17, 1.34), (.15, 1.5), (.08, 1.68), (0, 1.76)], '#5a3a8a', seg=24, warp=lambda v: (v.x + max(0, v.y - 1.5) * .3, v.y, v.z))
    m.lathe([(.165, 1.34), (.17, 1.39), (.16, 1.42)], '#ff8a1a', seg=24); m.box(.06, .06, .02, '#ffd23f', (0, 1.37, .17), top=0)
    m.lathe([(0, 0), (.12, 0), (.2, .1), (.21, .22), (.19, .23), (0, .2)], '#7a4aa0', (.5, 0, 0), seg=20)
    for j, c in enumerate(['#ff7a2a', '#ffd23f', '#ffffff', '#ff4f9a', '#5fd36a']): m.uv(.05, c, (.5 + (j - 2) * .07, .25 + (j % 2) * .03, (j % 3 - 1) * .05), scl=(1.3, 1, 1), seg=8, ring=5)
    return m

# ---------- Christmas, hearts, Diwali, Holi, Anzac, NAIDOC, harmony and kids' days, Clean Up, Ong Tao, Doan Ngo, teachers, flags ----------
@model
def fe_presents():
    m = Model('fe-presents', 120)
    for k, c in enumerate(['#e8433a', '#3a78c8', '#ffd23f']):
        w = .36 - k * .06; h = .3 - k * .04; x = (k - 1) * .4; rib = '#ffffff' if k != 2 else '#e8433a'
        m.box(w, h, w, c, (x, h / 2, 0), (0, k * .3, 0), bevel=.025)
        m.box(w + .01, h + .01, .05, rib, (x, h / 2, 0), (0, k * .3, 0), top=0); m.box(.05, h + .01, w + .01, rib, (x, h / 2, 0), (0, k * .3, 0), top=0)
        for s in (-1, 1): m.uv(.06, rib, (x + s * .05, h + .03, 0), (0, k * .3, s * .5), (1.2, .6, .5), seg=8, ring=5)
    return m
@model
def fe_heartpole():
    m = Model('fe-heartpole', 121); pole(m, 1.55)
    # a puffy heart: two rounded lobes and a soft point
    for s in (-1, 1): m.uv(.2, '#ff4f6a', (s * .13, 1.76, 0), scl=(1, 1, .55), seg=16, ring=10, top=.25)
    m.cone(.29, .38, '#ff4f6a', (0, 1.53, 0), (math.pi, 0, 0), scl=(1, 1, .5), seg=16, top=.25)
    m.uv(.05, '#ffffff', (-.15, 1.85, .1), scl=(1, .6, .3), seg=8, ring=5, top=0)
    for k in range(3): m.trunk([(0, 1.36, 0), ((k - 1) * .1, 1.2, .04), ((k - 1) * .14, 1.05, .05)], .012, .01, ['#ff9ab8', '#ffffff', '#ff4f6a'][k], seg=4, flare=1)
    return m
@model
def fe_pot():
    """a flower pot: its middle flower SLOT_A, the others SLOT_B and SLOT_C (repainted per festival)"""
    m = Model('fe-pot', 122)
    m.lathe([(0, 0), (.24, 0), (.26, .03), (.31, .38), (.34, .4), (.34, .46), (.29, .46), (.28, .42), (0, .42)], '#b8643a', seg=22)
    m.lathe([(0, .42), (.28, .42)], '#5a3a22', seg=22, top=0)
    for k in range(5): a = k * 1.2566; m.leaf(.22, .12, '#4f9a4a', (0, .45, 0), a, droop=.5, bend=.4, n=3)
    m.uv(.24, SLOT_A, (0, .6, 0), scl=(1, .9, 1), seg=16, ring=10, top=.2)
    for k in range(6): a = k * 1.047; m.uv(.12, SLOT_B if k % 2 else SLOT_C, (math.cos(a) * .22, .62 + (k % 2) * .1, math.sin(a) * .22), seg=10, ring=6, top=.2)
    return m
@model
def fe_diyas():
    """four clay diya lamps on a rangoli of petals (their flames glow)"""
    m = Model('fe-diyas', 123)
    for ring, (r, n, c) in enumerate([(.6, 16, '#ff9a2e'), (.45, 12, '#e8433a'), (.3, 8, '#ffd23f')]):
        for k in range(n): a = k / n * math.tau; m.uv(.08, c, (math.cos(a) * r, .015, .6 + math.sin(a) * r), (0, -a, 0), (1.5, .15, .7), seg=6, ring=3, top=0)
    m.uv(.1, '#3cc7e8', (0, .02, .6), scl=(1, .15, 1), seg=10, ring=4, top=0)
    for k in range(4):
        dx = (k - 1.5) * .45
        m.lathe([(0, 0), (.06, 0), (.13, .05), (.15, .1), (.12, .1), (.06, .07), (0, .07)], '#b8643a', (dx, 0, 0), seg=16, warp=lambda v: (v.x * (1.25 if v.x > 0 else 1), v.y, v.z))
        m.lathe([(.145, .095), (.15, .1), (.14, .105)], '#ffd23f', (dx, 0, 0), seg=16)
    return m
@model
def fe_diyas_glow():
    m = Model('fe-diyas-glow', 124)
    for k in range(4): dx = (k - 1.5) * .45; m.lathe([(0, 0), (.035, .02), (.03, .07), (0, .14)], '#ffb43a', (dx, .08, 0), seg=10, top=0)
    return m
@model
def fe_colours():
    """little hills of Holi colour powder in bowls"""
    m = Model('fe-colours', 125)
    for k, c in enumerate(['#ff4f9a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff9f43', '#9a6af0']):
        a = k / 6 * math.tau; x, z = math.cos(a) * .5, math.sin(a) * .5
        m.lathe([(0, 0), (.16, 0), (.22, .06), (.23, .1), (.2, .1), (0, .06)], '#e8dcc8', (x, 0, z), seg=16)
        m.lathe([(0, .06), (.2, .08), (.12, .17), (.03, .22), (0, .22)], c, (x, 0, z), seg=16, top=.25, jitter=.004)
    return m
@model
def fe_poppy():
    """a poppy wreath on a post (Anzac Day)"""
    m = Model('fe-poppy', 126); pole(m, 1.15, foot=True)
    for k in range(18): a = k / 18 * math.tau; m.leaf(.16, .08, '#3a6a2a', (math.cos(a) * .3, 1.22 + math.sin(a) * .3, 0), 0, droop=a + 1.57, bend=.2, n=2)
    for k in range(7):
        a = k / 7 * math.tau + .2; x, y = math.cos(a) * .31, 1.22 + math.sin(a) * .31
        m.petals(4, .045, '#d8202a', (x, y, .04), size=.08, tilt=1.4, sub=0); m.uv(.035, '#1a1a1a', (x, y, .07), seg=8, ring=5, top=0)
    m.box(.14, .14, .02, '#d8202a', (0, .98, .04), (0, 0, math.pi / 4), top=0)
    return m
@model
def fe_ochre():
    """a dot painting on a board (NAIDOC week): rings of dots in ochre, white and gold"""
    m = Model('fe-ochre', 127); pole(m, .9)
    m.box(1.0, 1.0, .06, '#8a3a1a', (0, .9, .03), bevel=.02)
    for ring, n in enumerate([1, 8, 14, 20]):
        r = ring * .12
        for k in range(n): a = k / n * math.tau; m.cyl(.028, .028, .012, ['#ffd23f', '#ffffff', '#e8a04a', '#1d1d1d'][ring], (math.cos(a) * r, .9 + math.sin(a) * r, .065), (math.pi / 2, 0, 0), seg=7, top=0)
    for c in [(-.36, 1.28), (.36, 1.28), (-.36, .52), (.36, .52)]:
        for k in range(6): a = k / 6 * math.tau; m.cyl(.022, .022, .012, '#ffffff', (c[0] + math.cos(a) * .06, c[1] + math.sin(a) * .06, .065), (math.pi / 2, 0, 0), seg=6, top=0)
    return m
@model
def fe_balloons():
    """a bunch of balloons on ribbons from a weighted bag: colours SLOT_A, SLOT_B, SLOT_C (repainted per festival)"""
    m = Model('fe-balloons', 128)
    m.lathe([(0, 0), (.1, 0), (.12, .06), (.08, .14), (.03, .16), (0, .16)], '#c9a05a', seg=14)
    for k, c in enumerate([SLOT_A, SLOT_B, SLOT_C, SLOT_A]):
        a = k * 2.1; bx, bz = math.cos(a) * .25, math.sin(a) * .25; h = 1.9 + (k % 3) * .25
        m.trunk([(0, .15, 0), (bx * .5, h * .5, bz * .5), (bx, h, bz)], .006, .006, '#ffffff', seg=3, flare=1)
        m.lathe([(0, -.24), (.05, -.22), (.17, -.1), (.21, .05), (.17, .19), (.08, .25), (0, .26)], c, (bx, h + .24, bz), seg=18, top=.3)
        m.cone(.03, .05, c, (bx, h - .01, bz), (math.pi, 0, 0), seg=6)
        m.uv(.035, '#ffffff', (bx - .07, h + .34, bz + .14), scl=(1, 1.5, .5), seg=6, ring=4, top=0)
    return m
@model
def fe_bins():
    m = Model('fe-bins', 129)
    for k, (body, lid) in enumerate([('#3a3d40', '#ffd23f'), ('#3a3d40', '#e8433a')]):
        x = k * .65
        m.box(.5, .78, .5, '#2f8a4a' if k == 0 else '#3a3d40', (x, .39, 0), bevel=.05)
        m.box(.56, .08, .56, lid, (x, .82, 0), bevel=.03); m.box(.2, .04, .06, '#2a2a2a', (x, .87, -.15), bevel=.015)
        for s in (-1, 1): m.lathe([(0, -.04), (.06, -.03), (.07, 0), (.06, .03), (0, .04)], '#1a1a1a', (x + s * .2, .06, -.27), (0, 0, math.pi / 2), seg=12)
        if k == 0:  # the recycling arrows
            for j in range(3): a = j / 3 * math.tau; m.box(.12, .03, .01, '#ffffff', (x + math.cos(a) * .08, .45 + math.sin(a) * .08, .255), (0, 0, a + 1.57), top=0)
    return m
@model
def fe_carpbasin():
    """a basin of water with a golden carp for Ong Tao (the carp glows)"""
    m = Model('fe-carpbasin', 130)
    m.lathe([(0, 0), (.36, 0), (.43, .05), (.47, .22), (.5, .26), (.46, .27), (.42, .23)], '#c9a05a', seg=28)
    m.lathe([(0, .22), (.42, .22)], '#5aaee0', seg=28, top=0)
    for k in range(3): a = k * 2.1; m.lathe([(0, 0), (.12, .0), (.12, .01), (0, .01)], '#4f9a52', (math.cos(a) * .25, .225, math.sin(a) * .25), seg=12)
    return m
@model
def fe_carpbasin_glow():
    m = Model('fe-carpbasin-glow', 131)
    m.uv(.12, '#ffb43a', (0, .26, 0), (0, .6, 0), (1, .55, 2.2), seg=14, ring=8, top=.2)
    m.cone(.09, .12, '#ffcf3a', (0, .26, -.3), (math.pi / 2, .6, 0), scl=(1, .4, 1), seg=8)
    return m
@model
def fe_dragonboat():
    m = Model('fe-dragonboat', 132)
    m.lathe([(0, -1.2), (.18, -1.0), (.25, -.5), (.26, 0), (.25, .5), (.18, 1.0), (0, 1.2)], '#c62828', (0, .14, 0), (math.pi / 2, 0, 0), (1, 1, .55), seg=16, top=.2)
    m.box(.42, .03, 2.0, '#8a5a3b', (0, .2, 0), top=0)
    for k in range(6): m.box(.4, .03, .1, '#ffd23f', (0, .21, -.8 + k * .32), top=0)
    head = (0, .42, 1.3)
    m.uv(.17, '#2f9a4a', head, scl=(1, .9, 1.3), seg=14, ring=10); m.trunk([(0, .14, 1.1), (0, .3, 1.22), head], .1, .1, '#2f9a4a', seg=10, flare=1)
    for s in (-1, 1): m.uv(.04, '#ffffff', (s * .09, .5, 1.42), seg=8, ring=5, top=0); m.uv(.02, '#1a1a1a', (s * .09, .5, 1.45), seg=6, ring=4, top=0); m.cone(.03, .12, '#ffd23f', (s * .08, .6, 1.25), (-.5, 0, -s * .3), seg=6)
    m.uv(.03, '#ff4f6a', (0, .38, 1.5), seg=6, ring=4)
    m.trunk([(0, .3, -1.1), (0, .42, -1.3), (0, .55, -1.35)], .06, .02, '#2f9a4a', seg=8, flare=1)
    return m
@model
def fe_teacher():
    """a thank-you card for Teachers' Day on a little easel stand"""
    m = Model('fe-teacher', 133); pole(m, .8)
    m.box(.72, .52, .04, '#fff3c4', (0, .92, .02), bevel=.012)
    m.box(.66, .06, .045, '#ff9ab8', (0, 1.1, .022), top=0)
    for s in (-1, 1): m.uv(.06, '#ff4f6a', (s * .06, .92, .05), scl=(1, 1, .3), seg=10, ring=6, top=0)
    m.cone(.08, .1, '#ff4f6a', (0, .86, .05), (math.pi, 0, 0), scl=(1, 1, .3), seg=10)
    for k in range(4): m.box(.18, .012, .01, '#8a6a4a', (-.18 + (k % 2) * .36, .78 - (k // 2) * .05, .045), top=0)
    return m
def flag(m, vn):
    m.trunk([(0, 0, 0), (0, 1.1, 0), (0, 2.25, 0)], .03, .025, '#c9d0d4', seg=8, flare=1); m.uv(.05, GOLD, (0, 2.28, 0), seg=10, ring=6, top=.3)
    m.lathe([(0, 0), (.14, 0), (.15, .03), (.11, .07), (0, .08)], '#7a6a5a', seg=14)
    def cloth(b):  # a flag waving softly in the wind: a rippled sheet, both sides seen
        import bmesh; nx, ny = 10, 5; th = .015; vs = {}
        for side, o in ((0, 0), (1, -th)):
            for i in range(nx + 1):
                for j in range(ny + 1):
                    u, v = i / nx, j / ny; vs[side, i, j] = b.verts.new((o + .05 * math.sin(u * 5) * u, .45 * (v - .5), .7 * u))
        for i in range(nx):
            for j in range(ny):
                q = [vs[0, i, j], vs[0, i + 1, j], vs[0, i + 1, j + 1], vs[0, i, j + 1]]; b.faces.new(q)
                b.faces.new([vs[1, i, j + 1], vs[1, i + 1, j + 1], vs[1, i + 1, j], vs[1, i, j]])
    m._add(cloth, '#d8202a' if vn else '#2f8a3a', (0, 1.95, .03), top=.08)
    if not vn: m._add(lambda b: cloth_strip(b), '#ffd23f', (0, 1.95, .03), top=.08)
def cloth_strip(b):
    import bmesh; nx = 10; th = .015; v0 = []
    for side, o in ((0, -.004), (1, .019 - th)):
        row = []
        for i in range(nx + 1):
            u = i / nx; row.append((b.verts.new((o + .05 * math.sin(u * 5) * u - .002, -.075, .7 * u)), b.verts.new((o + .05 * math.sin(u * 5) * u - .002, .075, .7 * u))))
        v0.append(row)
    for i in range(nx):
        a, c = v0[0][i], v0[0][i + 1]; b.faces.new([a[0], c[0], c[1], a[1]])
        a, c = v0[1][i], v0[1][i + 1]; b.faces.new([a[1], c[1], c[0], a[0]])
@model
def fe_flag_vn():
    m = Model('fe-flag-vn', 134); flag(m, True); return m
@model
def fe_flag_vn_glow():
    """the gold star of the Vietnam flag (glows at night)"""
    m = Model('fe-flag-vn-glow', 135)
    def star(b):
        pts = []
        for k in range(10): a = math.pi / 2 + k * math.pi / 5; r = .11 if k % 2 == 0 else .045; pts.append(b.verts.new((0, math.sin(a) * r, math.cos(a) * r)))
        c = b.verts.new((0, 0, 0)); [b.faces.new((c, pts[k], pts[(k + 1) % 10])) for k in range(10)]
        c2 = b.verts.new((-.022, 0, 0)); pts2 = [b.verts.new((-.022, p.co.y, p.co.z)) for p in pts]; [b.faces.new((c2, pts2[(k + 1) % 10], pts2[k])) for k in range(10)]
    m._add(star, '#ffd23f', (.01 + .05 * math.sin(2.5) * .5, 1.95, .38), top=0)
    return m
@model
def fe_flag_au():
    m = Model('fe-flag-au', 136); flag(m, False); return m

# ---------- the four pieces every festival shares (colours repainted per festival) ----------
@model
def fe_lanternpost():
    """a little wooden lantern post with a cross arm (the two paper lanterns are its glow)"""
    m = Model('fe-lanternpost', 140); pole(m, 2.1, .045)
    m.box(.74, .06, .06, DARKWOOD, (0, 2.05, 0), bevel=.02)
    for s in (-1, 1):
        m.trunk([(s * .3, 2.02, 0), (s * .3, 1.98, 0)], .008, .008, '#3a2a20', seg=4, flare=1)
        for y in (1.95, 1.6): m.lathe([(0, -.025), (.09, -.025), (.1, 0), (.09, .025), (0, .025)], GOLD, (s * .3, y, 0), seg=14)
        m.lathe([(0, 0), (.025, -.06), (.02, -.16), (0, -.18)], SLOT_B, (s * .3, 1.56, 0), seg=8)  # its tassel
    return m
@model
def fe_lanternpost_glow():
    m = Model('fe-lanternpost-glow', 141)
    for s in (-1, 1): m.lathe([(0, -.19), (.08, -.17), (.15, -.1), (.17, 0), (.15, .1), (.08, .17), (0, .19)], SLOT_A if s > 0 else SLOT_C, (s * .3, 1.78, 0), seg=18, ribs=10, rib=.05, top=.1)
    return m
@model
def fe_pennantpole():
    """a tall pole with three pennants streaming in the wind"""
    m = Model('fe-pennantpole', 142); pole(m, 2.4, .03, '#c9d0d4')
    for j, c in enumerate([SLOT_A, SLOT_B, SLOT_C]):
        def pen(b):
            th = .012; L, H = .55, .32; n = 6
            for side, o in ((0, 0), (1, -th)):
                vs = []
                for i in range(n + 1):
                    u = i / n; h = H * (1 - u) * .5; w = .03 * math.sin(u * 6 + j)
                    vs.append((b.verts.new((o + w, -h, L * u)), b.verts.new((o + w, h, L * u))))
                for i in range(n):
                    a, cc = vs[i], vs[i + 1]; f = [a[0], cc[0], cc[1], a[1]]
                    b.faces.new(f if side == 0 else list(reversed(f)))
        m._add(pen, c, (0, 2.15 - j * .42, .03), (0, 1.57, 0), top=.08)
    return m
@model
def fe_flowertub():
    """a wooden planter of round flowers (SLOT_A, B, C) with leaves"""
    m = Model('fe-flowertub', 143)
    m.box(.72, .34, .42, '#8a5a3a', (0, .17, 0), bevel=.04)
    for y in (.08, .26): m.box(.74, .04, .44, '#6a4a2a', (0, y, 0), bevel=.015)
    m.box(.64, .03, .34, '#5a3a22', (0, .34, 0), top=0)
    for j in range(9): m.leaf(.2, .11, '#4f9a4a', ((j - 4) * .07, .35, (j % 2 - .5) * .12), j * 1.9, droop=.55, bend=.4, n=3)
    for j in range(7): m.uv(.11, [SLOT_A, SLOT_B, SLOT_C][j % 3], ((j - 3) * .1, .46 + (j % 2) * .08, (j % 3 - 1) * .07), seg=10, ring=6, top=.2)
    return m
@model
def fe_arch():
    """a garland arch: two posts and a leafy hoop (its little lights are its glow)"""
    m = Model('fe-arch', 144)
    for s in (-1, 1): m.trunk([(s * .6, 0, 0), (s * .6, .95, 0), (s * .6, 1.9, 0)], .045, .035, '#6a4a3a', seg=8, flare=1.3)
    pts = [(math.cos(t / 12 * math.pi) * .6, 1.9 + math.sin(t / 12 * math.pi) * .35, 0) for t in range(13)]
    m.trunk(pts, .05, .05, '#3f8a4a', seg=8, flare=1)
    for k in range(14): t = k / 13 * math.pi; m.leaf(.14, .08, '#4fae4a' if k % 2 else '#3f9a45', (math.cos(t) * .6, 1.9 + math.sin(t) * .35, 0), k * 1.3, droop=.4, bend=.3, n=2)
    return m
@model
def fe_arch_glow():
    m = Model('fe-arch-glow', 145)
    for j in range(7): t = j / 6 * math.pi; m.uv(.085, [SLOT_A, SLOT_B, SLOT_C][j % 3], (math.cos(t) * .6, 1.9 + math.sin(t) * .35, .04), seg=12, ring=8, top=.1)
    return m

# ---------- the lantern quest, the hoi lang, the folk show and the kite ----------
@model
def fe_questlantern_body():
    """the lantern's ribbed paper body (js/dinh.ts buildLantern: the game draws it lit or not, in its own colour)"""
    m = Model('fe-questlantern-body', 150)
    m.lathe([(0, -.36), (.14, -.34), (.27, -.22), (.32, 0), (.27, .22), (.14, .34), (0, .36)], '#ffffff', seg=24, ribs=12, rib=.06, top=0)
    return m
@model
def fe_questlantern_trim():
    """its gold caps, ribs, string and tassel"""
    m = Model('fe-questlantern-trim', 151)
    for y in (.36, -.36): m.lathe([(0, -.045), (.15, -.045), (.17, -.02), (.17, .02), (.15, .045), (0, .045)], '#e8b62a', (0, y, 0), seg=18)
    for k in range(12):
        a = k / 12 * math.tau
        pts = [(math.cos(a) * r * 1.005, y, math.sin(a) * r * 1.005) for (r, y) in [(.14, -.34), (.27, -.22), (.32, 0), (.27, .22), (.14, .34)]]
        m.trunk(pts, .007, .007, '#c8902a', seg=4, flare=1)
    m.trunk([(0, .4, 0), (0, .6, 0), (0, .78, 0)], .01, .01, '#e8b62a', seg=5, flare=1)
    m.uv(.04, '#e8b62a', (0, -.44, 0), seg=10, ring=6)
    for k in range(8): a = k / 8 * math.tau; m.trunk([(0, -.46, 0), (math.cos(a) * .03, -.65, math.sin(a) * .03), (math.cos(a) * .05, -.8, math.sin(a) * .05)], .008, .006, '#e8433a', seg=4, flare=1)
    return m
@model
def fe_hoilang_pole():
    """the hoi lang's tall bamboo pole (cay neu style) with five festival flags and a gold ball"""
    m = Model('fe-hoilang-pole', 152)
    m.lathe([(0, 0), (.5, 0), (.48, .12), (.38, .25), (0, .25)], '#8a6a4a', seg=20)
    m.trunk([(0, 0, 0), (0, 3, 0), (0, 6, 0)], .11, .08, '#c9a24a', seg=10, flare=1)
    for k in range(1, 9): m.lathe([(.1 - k * .003, -.02), (.115 - k * .003, 0), (.1 - k * .003, .02)], '#a8823a', (0, k * .66, 0), seg=10)
    for k, c in enumerate(['#e8433a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff7eb8']):
        def fl(b, c=c, k=k):
            th = .015; nx, ny = 8, 3; vs = {}
            for side, o in ((0, 0), (1, -th)):
                for i in range(nx + 1):
                    for j in range(ny + 1):
                        u, v = i / nx, j / ny; vs[side, i, j] = b.verts.new((.9 * u, .55 * (v - .5) - .06 * u, o + .04 * math.sin(u * 5 + k)))
            for i in range(nx):
                for j in range(ny):
                    b.faces.new([vs[0, i, j], vs[0, i + 1, j], vs[0, i + 1, j + 1], vs[0, i, j + 1]]); b.faces.new([vs[1, i, j + 1], vs[1, i + 1, j + 1], vs[1, i + 1, j], vs[1, i, j]])
        m._add(fl, c, (.08, 5.5 - k * .62, 0), top=.08)
    m.uv(.16, '#ffd23f', (0, 6.1, 0), seg=14, ring=10, top=.3)
    for k in range(6): a = k / 6 * math.tau; m.leaf(.3, .1, '#4fae4a', (0, 6.0, 0), a, droop=.2, bend=.6, n=3)
    return m
@model
def fe_hoilang_flag():
    """the flag the first walker of the parade carries (in the walker's hand frame, as the code shape)"""
    m = Model('fe-hoilang-flag', 153)
    m.trunk([(.35, 0, .1), (.35, 1.2, .1), (.35, 2.4, .1)], .03, .025, WOOD, seg=8, flare=1); m.uv(.055, '#ffd23f', (.35, 2.43, .1), seg=10, ring=6)
    def fl(b):
        th = .015; nx, ny = 8, 3; vs = {}
        for side, o in ((0, 0), (1, -th)):
            for i in range(nx + 1):
                for j in range(ny + 1):
                    u, v = i / nx, j / ny; vs[side, i, j] = b.verts.new((.7 * u, .45 * (v - .5), o + .04 * math.sin(u * 5)))
        for i in range(nx):
            for j in range(ny):
                b.faces.new([vs[0, i, j], vs[0, i + 1, j], vs[0, i + 1, j + 1], vs[0, i, j + 1]]); b.faces.new([vs[1, i, j + 1], vs[1, i + 1, j + 1], vs[1, i + 1, j], vs[1, i, j]])
    m._add(fl, '#e8433a', (.38, 2.15, .1), top=.08)
    for k in range(3): m.trunk([(.37, 1.92, .1), (.37 + (k - 1) * .05, 1.8, .12), (.37 + (k - 1) * .08, 1.7, .12)], .008, .008, '#ffd23f', seg=4, flare=1)
    return m
@model
def fe_folk_post():
    """the folk show's sign post (the board itself stays the game's picture above it)"""
    m = Model('fe-folk-post', 154)
    m.lathe([(0, 0), (.45, 0), (.43, .12), (.34, .25), (0, .25)], '#8a6a4a', seg=20)
    m.trunk([(0, 0, 0), (0, 1.7, 0), (0, 3.4, 0)], .11, .09, '#7a5236', seg=10, flare=1)
    for y in (1.0, 2.2): m.lathe([(.1, -.03), (.12, 0), (.1, .03)], '#c9a24a', (0, y, 0), seg=10)
    m.lathe([(0, 0), (.13, 0), (.14, .05), (.1, .1), (0, .12)], '#c9a24a', (0, 3.4, 0), seg=12)
    for k in range(5): m.leaf(.4, .14, ['#e8433a', '#ffd23f', '#3cc7e8', '#5fd36a', '#ff7eb8'][k], (0, 3.3, 0), k * 1.256, droop=-.9, bend=.1, n=3)  # ribbons
    return m
@model
def fe_folk_stage():
    """the singer's little round stage with a gold rim, steps and a microphone on a stand"""
    m = Model('fe-folk-stage', 155)
    m.lathe([(0, 0), (1.6, 0), (1.6, .04), (1.55, .28), (1.5, .3), (0, .3)], '#7a3a8a', seg=40)
    m.lathe([(1.42, .3), (1.46, .31), (1.42, .34), (0, .34)], '#ffd23f', seg=40, top=.05)
    for k in range(16): a = k / 16 * math.tau; m.uv(.05, '#ffd23f', (math.cos(a) * 1.57, .16, math.sin(a) * 1.57), seg=8, ring=5, top=.1)
    m.box(.9, .15, .4, '#6a2a7a', (0, .075, 1.75), bevel=.03)
    m.lathe([(0, 0), (.25, 0), (.25, .03), (.05, .06), (0, .06)], '#444444', (.5, .3, .5), seg=16)
    m.trunk([(.5, .33, .5), (.5, .95, .5), (.5, 1.55, .5)], .018, .018, '#444444', seg=6, flare=1)
    m.lathe([(0, -.05), (.04, -.04), (.05, 0), (.06, .06), (.07, .1), (.05, .14), (0, .15)], '#222222', (.5, 1.55, .5), seg=12)
    return m
@model
def fe_kite():
    """a butterfly kite with a bamboo flute (sao) across the top; its sail red and gold (the tail of bows stays the game's)"""
    m = Model('fe-kite', 156)
    def sail(b, side):
        import bmesh; n = 6; vs = []
        top, bot, wing = (0, 1.4, 0), (0, -1.6, 0), (side * 1.0, 0, 0)
        for i in range(n + 1):
            u = i / n; row = []
            for j in range(n + 1 - i):
                v = j / n; w = 1 - u - v
                x = top[0] * w + bot[0] * u + wing[0] * v; y = top[1] * w + bot[1] * u + wing[1] * v
                row.append(b.verts.new((x, y, -.08 * u * v * 4 * (1 - abs(side) * 0) + .05 * math.sin(v * 3))))
            vs.append(row)
        for i in range(n):
            for j in range(n - i):
                f = [vs[i][j], vs[i + 1][j], vs[i][j + 1]]; b.faces.new(f if side > 0 else list(reversed(f)))
                if j < n - i - 1: f = [vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]]; b.faces.new(f if side > 0 else list(reversed(f)))
        bmesh.ops.solidify(b, geom=list(b.faces), thickness=.02)
    m._add(lambda b: sail(b, -1), '#e8433a', top=.1); m._add(lambda b: sail(b, 1), '#ffd23f', top=.1)
    for (x, y) in [(-.5, .3), (.5, .3)]: m.uv(.16, '#ffffff', (x, y, .03), scl=(1, 1, .2), seg=12, ring=6, top=0); m.uv(.08, '#3cc7e8', (x, y, .05), scl=(1, 1, .2), seg=10, ring=5, top=0)
    m.trunk([(0, -1.5, -.03), (0, 0, -.03), (0, 1.5, -.03)], .03, .03, WOOD, seg=6, flare=1)
    m.trunk([(-1, 0, -.03), (0, .08, -.06), (1, 0, -.03)], .03, .03, WOOD, seg=6, flare=1)
    m.lathe([(0, -.55), (.09, -.55), (.09, .55), (0, .55)], '#c9a24a', (0, .85, -.12), (0, 0, math.pi / 2), seg=12)
    for x in (-.32, 0, .32): m.lathe([(.09, -.03), (.11, -.025), (.11, .025), (.09, .03)], '#7a4a2a', (x, .85, -.12), (0, 0, math.pi / 2), seg=12)
    return m

def main():
    want = [a for a in sys.argv[1:] if not a.startswith('-')]
    bpy.ops.wm.read_factory_settings(use_empty=True); WN.HD = False  # (the shapes here are drawn detailed already: about 300-1,500 triangles, owner "Go, but richer")
    for name, fn in M.items():
        if want and name not in want: continue
        mm = fn(); t = mm.tris(); mm.save(); print(f'{name}: {t} triangles')

if __name__ == '__main__':
    main()

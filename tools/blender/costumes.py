# (v1.08b story) The costume kit: period outfits and hairstyles, made once and used by every folk-tale page and film
# (docs/cores/tasks/v108b/story-brief.md part 1). Inside the 39 tale films only the tale's people appear, in period dress;
# the four friends are only the storytellers, in their own clothes.
#   blender -b -P tools/blender/costumes.py -- <out dir> role=<tale role> [render] [quick] [glb]
#   blender -b -P tools/blender/costumes.py -- <out dir> sheet [quick] [blendonly]   every role (blendonly: only the .blend files the pages use)
# It runs the shared person builder (tools/blender/lumi.py, the villagers) with the roles and garments below added, so a
# tale's people have the game's own proportions, faces and felt look. lumi.py itself is not changed (the friends helper
# owns it): this file adds its parts when it runs.
#
# Vietnamese: áo tứ thân with yếm and váy đụp, khăn mỏ quạ, khăn vấn, a low bun; áo the and áo nâu, khố, khăn xếp, khăn
# đầu rìu, a topknot; armour with a crested helmet; a royal robe and crown. Colonial Australian (The Magic Pudding): a
# waistcoat, long-sleeved shirt, trousers and an akubra, a long dress and a bonnet. Chinese: hanfu with a crossed collar
# and wide sleeves, a hair pin. Indian: sari and dhoti with kurta and a turban.
import sys, os, math
import bpy
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []

# role: palette (skin, hair main, hair dark, hair light, iris dark, iris light, brows, lashes), hair, top (garment, colour),
# bottom colour, bottom kind, hat (headwear), shoes, size and gender, extras
def _pal(skin, hair='#1c1715'): return (skin, hair, '#120f0d', '#2c2420', '#2a1a0e', '#5a3a22', '#120f0d', '#1f1712')
ROLES = {
    # Vietnam, village (Tấm, Cám's mother, Chú Cuội, farmers, Lang Liêu)
    'tale-vn-girl':    {'g': 'f', 'size': 'kid',   'pal': _pal('#f2c8a4'), 'hair': 'lowbun', 'top': ('tuthan', '#8a5a3c'), 'yem': '#d64b4b', 'bottom': '#2a2422', 'kind': 'longskirt', 'hat': 'khanmoqua', 'shoes': 'sandals/8a5a36', 'extra': []},
    'tale-vn-woman':   {'g': 'f', 'size': 'adult', 'pal': _pal('#ecc0a0'), 'hair': 'lowbun', 'top': ('tuthan', '#6a4a8a'), 'yem': '#f2c14e', 'bottom': '#231e22', 'kind': 'longskirt', 'hat': 'khanvan', 'shoes': 'sandals/6a4a30', 'extra': []},
    'tale-vn-farmer':  {'g': 'm', 'size': 'adult', 'pal': _pal('#d29a72'), 'hair': 'lowbun', 'top': ('aonau', '#7a5236'), 'bottom': '#3e3226', 'kind': 'pants', 'hat': 'khandaurieu', 'shoes': 'sandals/6a4a30', 'extra': []},
    'tale-vn-scholar': {'g': 'm', 'size': 'adult', 'pal': _pal('#e7b48f'), 'hair': 'lowbun', 'top': ('aothe', '#22232e'), 'bottom': '#f2ead8', 'kind': 'wide', 'hat': 'khanxep', 'shoes': 'sandals/2a2a2a', 'extra': []},
    'tale-vn-boy':     {'g': 'm', 'size': 'kid',   'pal': _pal('#e0a67c'), 'hair': 'tuft', 'top': ('bare', '#e0a67c'), 'bottom': '#8a5a3c', 'kind': 'kho', 'hat': 'topknot', 'shoes': 'barefoot', 'extra': []},
    'tale-vn-soldier': {'g': 'm', 'size': 'adult', 'pal': _pal('#d9a17a'), 'hair': 'lowbun', 'top': ('armour', '#8a2a24'), 'bottom': '#3a2a20', 'kind': 'pants', 'hat': 'crest', 'shoes': 'boots/3a2a20', 'extra': []},
    'tale-vn-king':    {'g': 'm', 'size': 'elder', 'pal': _pal('#e3b28d', '#dedbd4'), 'hair': 'lowbun', 'top': ('royal', '#e8b62a'), 'bottom': '#c0392b', 'kind': 'wide', 'hat': 'crownvn', 'shoes': 'boots/8a2a24', 'extra': []},
    'tale-vn-but':     {'g': 'm', 'size': 'elder', 'pal': _pal('#ecc8a8', '#f4f4f4'), 'hair': 'lowbun', 'top': ('aothe', '#f4f0e8'), 'bottom': '#f4f0e8', 'kind': 'wide', 'hat': 'topknot', 'shoes': 'sandals/c9a87a', 'extra': []},
    'tale-vn-prince':  {'g': 'm', 'size': 'adult', 'pal': _pal('#ecc0a0'), 'hair': 'lowbun', 'top': ('royal', '#3b6fb0'), 'bottom': '#f2ead8', 'kind': 'wide', 'hat': 'crownvn', 'shoes': 'boots/2a3a5a', 'extra': []},
    # colonial Australia (The Magic Pudding, Dot and the Kangaroo)
    'tale-au-man':     {'g': 'm', 'size': 'adult', 'pal': _pal('#f1c9b1', '#6f4c35'), 'hair': 'sidepart', 'top': ('waistcoat', '#5a4a3a'), 'shirt': '#efe6d2', 'bottom': '#4a4038', 'kind': 'pants', 'hat': 'akubra', 'shoes': 'boots', 'extra': []},
    'tale-au-woman':   {'g': 'f', 'size': 'adult', 'pal': _pal('#f6d3bd', '#a8432a'), 'hair': 'lowbun', 'top': ('longdress', '#6f8fae'), 'bottom': '#6f8fae', 'kind': 'longskirt', 'hat': 'bonnet', 'shoes': 'boots/3a2a20', 'extra': ['apron']},
    # China (Chang'e, the weaver girl, Ma Liang)
    'tale-cn-man':     {'g': 'm', 'size': 'adult', 'pal': _pal('#efc49c'), 'hair': 'lowbun', 'top': ('hanfu', '#4a7a9a'), 'sash': '#2a3a4a', 'bottom': '#4a7a9a', 'kind': 'longskirt', 'hat': 'hairpin', 'shoes': 'boots/2a2a2a', 'extra': []},
    'tale-cn-woman':   {'g': 'f', 'size': 'adult', 'pal': _pal('#f4cfae'), 'hair': 'lowbun', 'top': ('hanfu', '#e88aa8'), 'sash': '#f2e2b8', 'bottom': '#e88aa8', 'kind': 'longskirt', 'hat': 'hairpin', 'shoes': 'sandals/c9776e', 'extra': []},
    # India (the monkey and the crocodile, Ganesha's friends)
    'tale-in-woman':   {'g': 'f', 'size': 'adult', 'pal': _pal('#c98e66'), 'hair': 'lowbun', 'top': ('sari', '#e2574c'), 'pallu': '#f2c14e', 'bottom': '#e2574c', 'kind': 'longskirt', 'hat': '', 'shoes': 'sandals/c99a5a', 'extra': []},
    'tale-in-man':     {'g': 'm', 'size': 'adult', 'pal': _pal('#b97a52'), 'hair': 'lowbun', 'top': ('kurta', '#f2ead8'), 'bottom': '#fbf7ee', 'kind': 'dhoti', 'hat': 'turban', 'shoes': 'sandals/8a5a36', 'extra': []},
}
COSTUME_TOPS = {'tuthan', 'aonau', 'aothe', 'bare', 'armour', 'royal', 'waistcoat', 'longdress', 'hanfu', 'sari', 'kurta'}
COSTUME_HATS = {'khanmoqua', 'khanvan', 'khanxep', 'khandaurieu', 'topknot', 'crest', 'crownvn', 'bonnet', 'hairpin', 'turban'}

# the code added into lumi.py when it runs (it sees lumi.py's own helpers: B, S, R, HC, lathe, tube, sphere, felt, ...)
ADD_ROLES = """
VILL.update(COSTUME_ROLES)
for _r in COSTUME_ROLES: VHAIR_EXTRA[_r] = COSTUME_ROLES[_r]['hair']
"""
ADD_BUILD = r"""
VHAIR.update(VHAIR_EXTRA)
_body_villager, _hat, _shoes, _settle = body_villager, hat, shoes, settle_hat
_wear = wear
def wear():   # a scarf or turban is wrapped round the hair: the hair stays under it (no hair is cut away, nothing is lifted)
    hk = WEAR.get('hat', '').split('/')[0]
    if hk not in COSTUME_HATS: return _wear()
    h = WEAR.pop('hat'); _wear(); WEAR['hat'] = h
    group('hat', lambda: hat(hk, None))
def settle_hat(gap=None):
    if WEAR.get('hat', '').split('/')[0] in COSTUME_HATS: return
    return _settle(gap)
def shoes(kind, col=None):
    if kind == 'barefoot': return
    return _shoes(kind, col)
def hat(kind, col=None):
    if kind not in COSTUME_HATS: return _hat(kind, col)
    k = R * 1.14; top = HC + Vector((0, .02 * R, .67 * R)); BLACK = felt('khanBlack', '#26201e', .8, .08)
    if kind == 'khanmoqua':   # the crow's-beak scarf: a dark scarf over the head, a point over the forehead, tied under the chin
        d = sphere('khanMoQua', BLACK, top + Vector((0, .05 * k, -.2 * k)), (1.04 * k, 1.06 * k, .82 * k), 32, 16)
        for v in d.data.vertices: v.co.z = max(v.co.z, HC.z - .1 * R)
        sphere('khanBeak', BLACK, HC + Vector((0, -.98 * R, .62 * R)), (.18 * R, .2 * R, .12 * R), 16, 8, (-.6, 0, 0))
        for s in (-1, 1): tube('khanTie', BLACK, [HC + Vector((s * .95 * R, -.1 * R, -.1 * R)), HC + Vector((s * .5 * R, -.5 * R, -.9 * R)), HC + Vector((0, -.6 * R, -1.02 * R))], .07 * R, 10, False)
    elif kind in ('khanvan', 'khanxep'):   # a wrapped turban ring (khăn vấn for women, black; the men's ready-made khăn xếp with its folds)
        n = 3 if kind == 'khanvan' else 5
        for i in range(n): lathe('khanRing', BLACK, [(.86 * k, (i * .09 - .02) * k), (.98 * k, (i * .09 + .03) * k), (.86 * k, (i * .09 + .08) * k)], 40, loc=HC + Vector((0, .05 * R, .45 * R)), scale=(1, 1.04))
        if kind == 'khanxep': sphere('khanTop', BLACK, HC + Vector((0, .05 * R, .78 * R)), (.82 * R, .84 * R, .3 * R), 28, 12)
    elif kind == 'khandaurieu':   # the farmer's axe-head knot: a band round the head, knotted over the forehead
        R_ = felt('khanBrown', '#3a2a20', .85, .08)
        lathe('khanBand', R_, [(.9 * k, -.02 * k), (.97 * k, .05 * k), (.9 * k, .12 * k)], 36, loc=HC + Vector((0, .02 * R, .38 * R)))
        for s in (-1, 1): sphere('khanKnot', R_, HC + Vector((s * .16 * R, -1.0 * R, .58 * R)), (.18 * R, .1 * R, .14 * R), 14, 7, (0, s * .5, 0))
    elif kind == 'topknot':   # a little boy's topknot (chỏm)
        sphere('topKnot', HAIRD, HC + Vector((0, -.1 * R, 1.02 * R)), (.22 * R, .22 * R, .2 * R), 16, 8)
    elif kind == 'crest':   # a soldier's helmet with a red crest
        d = sphere('helmetOld', BRASS, top + Vector((0, 0, -.18 * k)), (1.0 * k, 1.02 * k, .8 * k), 32, 16)
        for v in d.data.vertices: v.co.z = max(v.co.z, HC.z + .05 * R)
        tube('crest', felt('crestRed', '#c0392b'), [HC + Vector((0, -.6 * R, 1.2 * R)), HC + Vector((0, 0, 1.45 * R)), HC + Vector((0, .7 * R, 1.15 * R))], .12 * R, 12, True)
    elif kind == 'crownvn':   # a king's crown: a gold band with flame points and a jewel
        G_ = mat('gold', '#e8b62a', .35, metal=.8)
        lathe('crownBand', G_, [(.84 * k, 0), (.9 * k, .02 * k), (.9 * k, .28 * k), (.84 * k, .3 * k)], 40, loc=HC + Vector((0, 0, .55 * R)))
        for i in range(7):
            t = -math.pi / 2 + (i - 3) * .42; c = HC + Vector((math.cos(t) * .9 * k, math.sin(t) * .9 * k, .55 * R + .42 * k))
            sphere('crownPoint', G_, c, (.07 * k, .05 * k, .14 * k), 12, 6)
        sphere('crownJewel', mat('ruby', '#c0392b', .2, emit=.3), HC + Vector((0, -.92 * k, .55 * R + .15 * k)), (.08 * k, .04 * k, .08 * k), 12, 6)
    elif kind == 'bonnet':   # a colonial sun bonnet tied under the chin
        M = felt('bonnet', '#efe6d2'); d = sphere('bonnet', M, top + Vector((0, .15 * k, -.15 * k)), (1.06 * k, 1.1 * k, .86 * k), 32, 16)
        for v in d.data.vertices: v.co.y = max(v.co.y, HC.y - .55 * R)
        lathe('bonnetBrim', M, [(.95 * k, 0), (1.15 * k, .05 * k), (1.1 * k, .1 * k)], 40, loc=HC + Vector((0, -.45 * R, .3 * R)), scale=(1, .6))
    elif kind == 'hairpin':   # a bun on top held by a long pin (hanfu)
        sphere('topBun', HAIRD, HC + Vector((0, .1 * R, 1.0 * R)), (.32 * R, .3 * R, .26 * R), 18, 9)
        tube('hairPin', mat('jade', '#5fae8a', .3), [HC + Vector((-.55 * R, .1 * R, 1.02 * R)), HC + Vector((.55 * R, .1 * R, 1.06 * R))], .03 * R, 8)
    elif kind == 'turban':   # a wrapped turban (pagri)
        M = felt('turban', '#f29a2e')
        for i in range(4): lathe('turbanRing', M, [(.88 * k, (i * .1) * k), (1.0 * k, (i * .1 + .05) * k), (.86 * k, (i * .1 + .1) * k)], 40, loc=HC + Vector((0, .05 * R, .4 * R)))
        sphere('turbanTop', M, HC + Vector((0, .05 * R, .85 * R)), (.85 * R, .88 * R, .35 * R), 28, 12)

def body_villager():
    tk = V['top'][0]
    if tk not in COSTUME_TOPS: return _body_villager()
    b = B; wH, wC, dep, kind = b['wH'], b['wC'], b['dep'], V['kind']
    TOP = felt('top', V['top'][1]); BOT = felt('bottom', V['bottom'])
    # the legs, then what is worn below the waist
    legs(SKIN if kind in ('kho', 'longskirt', 'dhoti') else BOT)
    if kind in ('pants', 'wide'):
        r = wH * (.68 if kind == 'wide' else .56)
        for s in (-1, 1): tube('trouser', BOT, [(s * b['legX'] * .85, 0, b['zCr'] + .02 * S), (s * b['legX'] * 1.05, 0, b['zAnk'] + .05 * S)], [r, r * (1.06 if kind == 'wide' else .98)], 24)
        lathe('seat', BOT, [(wH * .55, b['zCr'] - .035 * S), (wH * .95, b['zCr'] - .005 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
    elif kind == 'longskirt':   # váy đụp, a sari's skirt or a long dress: to the ankle
        lathe('longSkirt', BOT, [(wC * 1.05, b['zW'] + .01 * S), (wH * 1.15, b['zCr']), (wH * 1.45, b['zAnk'] + .06 * S), (wH * 1.48, b['zAnk'] + .03 * S)], 36, scale=(1, dep * 1.05))
    elif kind == 'kho':   # khố: a loincloth
        lathe('kho', BOT, [(wH * 1.02, b['zCr'] - .06 * S), (wH * 1.05, b['zCr']), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
        tube('khoFlap', BOT, [(0, fronty(wH * 1.02), b['zW']), (0, fronty(wH * 1.06), b['zCr'] - .12 * S)], (.05 * S, .01 * S), 8)
    elif kind == 'dhoti':   # a dhoti: white cloth wrapped into loose trouser legs to the shin
        for s in (-1, 1): tube('dhoti', BOT, [(s * b['legX'] * .8, 0, b['zCr'] + .02 * S), (s * b['legX'] * 1.1, 0, b['zCuff'] - .12 * S)], [wH * .7, wH * .6], 24)
        lathe('seat', BOT, [(wH * .6, b['zCr'] - .06 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
    # the body and what is worn on it
    torso(SKIN if tk in ('bare',) else TOP)
    long_to = {'tuthan': b['zCuff'] - .04 * S, 'aothe': b['zAnk'] + .2 * S, 'royal': b['zAnk'] + .06 * S, 'hanfu': b['zAnk'] + .1 * S, 'longdress': b['zAnk'] + .06 * S, 'kurta': b['zCuff'] - .02 * S}.get(tk)
    if long_to is not None:   # a long garment from the chest down (open at the front for áo tứ thân, crossed for hanfu)
        arc = (-math.pi / 2 + .32, 3 * math.pi / 2 - .32) if tk == 'tuthan' else None
        lathe('robe', TOP, [(wC * 1.06, b['zC']), (wC * 1.06, b['zW']), (wH * 1.12, b['zCr']), (wH * (1.35 if tk in ('royal', 'hanfu') else 1.22), long_to)], 36, scale=(1, dep * 1.04), arc=arc)
    if tk == 'tuthan':   # the yếm under the open áo tứ thân, and a sash at the waist
        lathe('yem', felt('yem', V['yem']), [(wC * 1.0, b['zW'] - .02 * S), (wC * 1.07, b['zC']), (wC * .7, b['zS'])], 24, scale=(1, dep * 1.02), arc=(-math.pi / 2 - .34, -math.pi / 2 + .34))
        lathe('sash', felt('sash', '#5fae5a'), [(wC * 1.1, b['zW'] - .015 * S), (wC * 1.11, b['zW'] + .02 * S)], 32, scale=(1, dep * 1.04))
    if tk in ('aonau', 'kurta'):   # a loose shirt to the hips (áo nâu) or the knee (kurta), with cloth buttons
        hem = b['zCr'] - .05 * S
        lathe('aoNau', TOP, [(wH * 1.12, hem), (wH * 1.06, hem + .05 * S), (wC * 1.06, b['zW'] + .02 * S), (wC * 1.05, b['zC'] - .01 * S)], 36, scale=(1, dep))
        for z in lin(hem + .04 * S, b['zC'] + .02 * S, 4): sphere('button', felt('buttonCloth', '#3a2a20'), (0, fronty(wC * 1.08) - .004, z), (.008 * S, .004 * S, .008 * S), 10, 5)
    if tk == 'aothe':   # áo the: a mandarin collar
        tube('aoTheCollar', TOP, [Vector((math.cos(t) * wC * .5, math.sin(t) * wC * .45, b['zN'] + .005)) for t in lin(0, 2 * math.pi, 21)], .016 * S, 8, False)
    if tk == 'hanfu':   # the crossed collar and a wide sash
        tube('hanfuCollar', felt('hanfuCollar', '#f6f1e6'), [(-wC * .55, fronty(wC * .5), b['zN']), (wC * .25, fronty(wC * 1.0), b['zC']), (wC * .7, fronty(wC * .95), b['zW'] + .02 * S)], .018 * S, 8, False)
        lathe('hanfuSash', felt('hanfuSash', V['sash']), [(wC * 1.1, b['zW'] - .03 * S), (wC * 1.12, b['zW'] + .04 * S)], 32, scale=(1, dep * 1.05))
    if tk == 'royal':   # a wide gold belt and a red dragon panel
        lathe('royalBelt', mat('gold', '#e8b62a', .35, metal=.8), [(wC * 1.12, b['zW'] - .02 * S), (wC * 1.14, b['zW'] + .03 * S)], 32, scale=(1, dep * 1.05))
        sphere('royalPanel', felt('royalPanel', '#c0392b'), (0, fronty(wC * 1.1), (b['zW'] + b['zC']) / 2), (wC * .45, .01 * S, wC * .5), 16, 8)
    if tk == 'armour':   # rows of plates over a tunic, round shoulder guards
        for i, z in enumerate(lin(b['zW'] - .02 * S, b['zC'] + .02 * S, 4)):
            lathe('plate', BRASS if i % 2 else felt('plateDark', '#6a4a2a'), [(wC * 1.07, z), (wC * 1.1, z + .02 * S), (wC * 1.06, z + .045 * S)], 32, scale=(1, dep * 1.05))
        lathe('armourSkirt', TOP, [(wC * 1.06, b['zW']), (wH * 1.25, b['zCuff'] + .02 * S)], 32, scale=(1, dep * 1.05))
        for s in (-1, 1): sphere('shoulderGuard', BRASS, (s * b['sh'][0], 0, b['sh'][2] + .01 * S), (.06 * S, .06 * S, .04 * S), 16, 8)
    if tk == 'waistcoat':   # a colonial waistcoat over a long-sleeved shirt
        lathe('vest', TOP, [(wH * 1.08, b['zW'] - .04 * S), (wC * 1.08, b['zW']), (wC * 1.07, b['zC']), (wC * .85, b['zS'])], 32, scale=(1, dep * 1.04), arc=(-math.pi / 2 + .2, 3 * math.pi / 2 - .2))
    if tk == 'sari':   # the pallu over the left shoulder
        tube('pallu', felt('pallu', V['pallu']), [(-wC * .2, fronty(wC * 1.1), b['zW'] - .02 * S), (wC * .6, fronty(wC * .9), b['zC']), (b['sh'][0] * 1.1, 0, b['sh'][2] + .02 * S), (wC * .6, wC * dep, b['zW'])], (.06 * S, .012 * S), 10, False)
    if 'apron' in V['extra']:
        lathe('apron', felt('apronWhite', '#f6f1e6'), [(wH * 1.5, b['zCuff'] - .1 * S), (wH * 1.12, b['zCr']), (wC * 1.1, b['zW'] + .03 * S)], 24, scale=(1, dep * 1.06), arc=(-.75 - math.pi / 2 + math.pi / 2, .75))
    SL = felt('shirtSleeve', V.get('shirt', V['top'][1]))
    def sleeves(s, sh, el, wr):
        rU, rA = B['rU'], B['rA']
        if tk == 'bare': return
        if tk in ('hanfu', 'royal'): tube('sleeve', TOP, [sh, el, wr], [rU * 1.4, rA * 2.0, rA * 2.6], 18)   # wide flowing sleeves
        elif tk == 'sari': tube('sleeve', TOP, [sh, sh.lerp(el, .4)], [rU * 1.3, rU * 1.25], 18)
        else: tube('sleeve', SL if tk == 'waistcoat' else TOP, [sh, el, wr - (wr - el).normalized() * .03 * S], [rU * 1.3, rA * 1.35, rA * 1.3], 18)
    arm_pair(sleeves)
    sk, _, sc = V['shoes'].partition('/'); shoes(sk, ('#' + sc) if sc else None)
"""

# load lumi.py with the costume parts added, and run it
src = open(os.path.join(HERE, 'lumi.py')).read()
anchor1 = "V = VILL.get(ROLE) if WHO == 'villager' else None"
anchor2 = "if GAME and not (LOOK == 'felt' and WHO != 'villager'):"
if anchor1 not in src or anchor2 not in src: raise SystemExit('costumes.py: lumi.py changed, the costume kit no longer fits it')
src = src.replace(anchor1, ADD_ROLES + anchor1, 1).replace(anchor2, ADD_BUILD + anchor2, 1)

def run(extra):
    sys.argv = [sys.argv[0], '--'] + extra
    g = {'__file__': os.path.join(HERE, 'lumi.py'), '__name__': '__main__', 'COSTUME_ROLES': ROLES, 'VHAIR_EXTRA': {}, 'COSTUME_TOPS': COSTUME_TOPS, 'COSTUME_HATS': COSTUME_HATS}
    sys.path.insert(0, HERE)
    exec(compile(src, os.path.join(HERE, 'lumi.py'), 'exec'), g)

if 'sheet' in argv:   # every role in its own Blender run (lumi.py builds one person a run)
    out = next(a for a in argv if a not in ('sheet', 'quick', 'blendonly'))
    import subprocess
    for r in ROLES:
        subprocess.run([bpy.app.binary_path, '-b', '-P', os.path.abspath(__file__), '--', out, 'role=' + r] + ([] if 'blendonly' in argv else ['render']) + (['quick'] if 'quick' in argv else []), check=False)
else:
    run(['villager'] + argv)

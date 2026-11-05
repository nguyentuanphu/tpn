# The costume kit (round v1.08c, blender helper; plan docs/plans/games-one-home-and-films.md part B): the period outfits and
# hairstyles of the old tales, made once and reused by every tale that needs them. Our own models, made by script; nothing downloaded.
#
# Two ways in:
#   blender -b -P tools/blender/costumes.py -- <out dir> [all|<id> ...] [quick]
#       renders each costume (front and three-quarter) through lumi.py and copies the pictures to <out dir> as <id>-front.jpg and
#       <id>-three-quarter.jpg; docs/characters-v108/costumes/ is the owner's copy.
#   blender -b -P tools/blender/lumi.py -- <dir> villager role=kit-<id> render
#       one costume on the game's villager body (lumi.py runs this file to learn the kit).
#
# The same ids are used in the game: js/film-costume.ts dresses a film actor with LOOK({ kit: '<id>' }) in the same colours and shapes.
import sys, os

# ---------- the kit: who wears it, the colours, the hair, the headwear and the shoes ----------
# pal: skin, hair (main, dark, light), iris (dark, light), brows, lashes
VN_F = ('#f1c6a3', '#1c1715', '#120f0d', '#2c2420', '#2a1a0e', '#5a3a22', '#120f0d', '#1f1712')
VN_M = ('#dfa47c', '#1f1a18', '#151210', '#2e2622', '#2a1a0e', '#5a3a22', '#151210', '#1f1712')
VN_KID = ('#f0c09b', '#1f1a18', '#151210', '#2e2622', '#2a1a0e', '#5a3a22', '#151210', '#1f1712')
AU_M = ('#efc3a6', '#6a4a32', '#4e3524', '#8a6448', '#2e5b8a', '#6f9cc9', '#4e3524', '#4a3a2c')
AU_F = ('#f6d3bd', '#b5743e', '#965c2e', '#d08f55', '#3d6b3a', '#7aa86a', '#965c2e', '#5a4632')
CN = ('#f2cba8', '#18130f', '#0f0c0a', '#2a221c', '#2a1a0e', '#4a3020', '#0f0c0a', '#1a1410')
IN_F = ('#c68a5e', '#15100c', '#0d0a08', '#2a1f18', '#24140a', '#4a2c18', '#15100c', '#1a120c')
IN_M = ('#b97f55', '#15100c', '#0d0a08', '#2a1f18', '#24140a', '#4a2c18', '#15100c', '#1a120c')

# c: the costume's colours by part; body: the garment builder below; hat: the headwear (or ''); feet: bare, sandals, cloth or boots
KIT = {
    # Vietnamese women
    'vn-tuthan': dict(name='Áo tứ thân, yếm, váy đụp, khăn mỏ quạ, nón quai thao', who='a village woman (Tấm, the mother, the wife)', g='f', size='adult', pal=VN_F, hair='lowbun', body='tuthan',
                      c=dict(coat='#8a5a3c', yem='#e0603a', skirt='#2b2422', sash='#e8b84a', trim='#5e3a26'), hat='quaithao/3e302a', feet='bare'),
    'vn-khanvan': dict(name='Áo tứ thân, khăn vấn, búi tóc', who='a mother or a grandmother', g='f', size='adult', pal=VN_F, hair='lowbun', body='tuthan',
                       c=dict(coat='#5e4636', yem='#f0d9a8', skirt='#2b2422', sash='#7fae5e', trim='#3e2c22'), hat='khanvan/3a2a22', feet='sandals'),
    'vn-yem': dict(name='Yếm, váy đụp, tóc búi', who='a young girl (Tấm, Cám, the youngest)', g='f', size='kid', pal=VN_KID, hair='lowbun', body='yem',
                   c=dict(yem='#e86a6a', skirt='#3a2e2a', sash='#7fae5e'), hat='', feet='bare'),
    # Vietnamese men
    'vn-aothe': dict(name='Áo the, khăn xếp, quần trắng', who='a scholar, a mandarin, a father on a feast day (Lang Liêu)', g='m', size='adult', pal=VN_M, hair='topknot', body='aothe',
                     c=dict(coat='#22202a', pants='#f2ede0', trim='#3a3646'), hat='khanxep/22202a', feet='cloth'),
    'vn-aonau': dict(name='Áo nâu, khăn đầu rìu', who='a farmer, a woodcutter (Chú Cuội), a fisherman', g='m', size='adult', pal=VN_M, hair='topknot', body='aonau',
                     c=dict(coat='#7a5034', pants='#4e3a2c', sash='#b8463a'), hat='khandaurriu/3a2a22', feet='bare'),
    'vn-kho': dict(name='Khố, búi tó', who='the Hùng kings\' time: a hunter, a fisherman, a boatman', g='m', size='adult', pal=VN_M, hair='topknot', body='kho',
                   c=dict(kho='#8a5a36', band='#c9a36a'), hat='', feet='bare'),
    'vn-boy': dict(name='Áo cánh, quần lửng, tóc chỏm', who='a village boy (Thánh Gióng as a boy, the youngest son)', g='m', size='kid', pal=VN_KID, hair='topknot', body='aonau',
                   c=dict(coat='#d8b47a', pants='#5e4636', sash='#b8463a'), hat='', feet='bare'),
    # kings, queens and generals
    'vn-armour': dict(name='Giáp trụ, nón dấu chóp đỏ', who='a soldier or a general (Thánh Gióng grown, Sơn Tinh, Lê Lợi\'s soldiers)', g='m', size='adult', pal=VN_M, hair='topknot', body='armour',
                      c=dict(plate='#6a7480', gold='#d4a23a', under='#b8332a', pants='#3a2a22', cape='#b8332a'), hat='nondau/e8d8a8', feet='boots'),
    'vn-king': dict(name='Hoàng bào, mũ xung thiên', who='a king (Hùng Vương, the kings of the tales)', g='m', size='adult', pal=VN_M, hair='topknot', body='royal',
                    c=dict(robe='#e8b62a', trim='#b8332a', belt='#3f8a6f', gold='#f2d16b'), hat='xungthien/d4a23a', feet='boots'),
    'vn-prince': dict(name='Áo bào hoàng tử, kim quan', who='a prince (Tấm\'s prince, Lang Liêu\'s brothers)', g='m', size='adult', pal=VN_M, hair='topknot', body='royal',
                      c=dict(robe='#2f6fb0', trim='#f2d16b', belt='#f2d16b', gold='#f2d16b'), hat='kimquan/d4a23a', feet='boots'),
    'vn-queen': dict(name='Áo phượng, mũ phượng', who='a queen or a princess (Mỵ Nương, Tấm as queen)', g='f', size='adult', pal=VN_F, hair='lowbun', body='royal',
                     c=dict(robe='#c0392b', trim='#f2d16b', belt='#f2d16b', gold='#f2d16b'), hat='phoenix/f2d16b', feet='cloth'),
    # colonial Australia (The Magic Pudding)
    'au-colonial-m': dict(name='Colonial bushman: shirt, waistcoat, neckerchief, akubra', who='Bill Barnacle, the bush travellers', g='m', size='adult', pal=AU_M, hair='sidepart', body='colonial',
                          c=dict(shirt='#efe6d2', vest='#5a4632', pants='#6a5a48', scarf='#c0392b'), hat='akubra/7a5634', feet='boots'),
    'au-colonial-f': dict(name='Colonial dress, apron and bonnet', who='a settler woman in the bush', g='f', size='adult', pal=AU_F, hair='lowbun', body='colonialf',
                          c=dict(dress='#6f8fb0', apron='#f4efe2', collar='#f4efe2'), hat='bonnet/f4efe2', feet='boots'),
    # China and India
    'cn-hanfu-f': dict(name='Hanfu (ruqun) with a hairpin', who='Chang\'e, the weaver girl, a village girl', g='f', size='adult', pal=CN, hair='highbun', body='hanfu',
                       c=dict(top='#f6d6d0', skirt='#c94a5a', trim='#f4efe2', sash='#f2d16b', sleeve='#f6d6d0'), hat='', feet='cloth'),
    'cn-hanfu-m': dict(name='Hanfu robe with a topknot cap', who='Hou Yi, the cowherd, Ma Liang\'s village', g='m', size='adult', pal=CN, hair='topknot', body='hanfum',
                       c=dict(robe='#5a7fa8', trim='#f4efe2', sash='#2b2422', sleeve='#5a7fa8'), hat='guan/2b2422', feet='cloth'),
    'in-sari': dict(name='Sari and choli, a long braid', who='a village woman in the Indian tales', g='f', size='adult', pal=IN_F, hair='braid', body='sari',
                    c=dict(choli='#f2b51c', sari='#d63a6a', border='#f2d16b'), hat='', feet='sandals'),
    'in-dhoti': dict(name='Dhoti, kurta and pagri', who='a farmer or a holy man in the Indian tales', g='m', size='adult', pal=IN_M, hair='sidepart', body='dhoti',
                     c=dict(kurta='#f2ede0', dhoti='#f6f1e6', scarf='#e8a33a'), hat='pagri/e8a33a', feet='sandals'),
}

if 'VILL' not in globals():
    # ---------- run as the main script: render every costume through lumi.py ----------
    import subprocess, shutil
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = next((a for a in argv if a not in KIT and a not in ('all', 'quick')), 'docs/characters-v108/costumes')
    ids = [a for a in argv if a in KIT] or list(KIT)
    here = os.path.dirname(os.path.abspath(__file__)); tmp = os.path.join(out, '_tmp'); os.makedirs(tmp, exist_ok=True)
    for i in ids:
        import bpy; cmd = [bpy.app.binary_path, '-b', '-P', os.path.join(here, 'lumi.py'), '--', tmp, 'villager', 'role=kit-' + i, 'render', 'views=front,three-quarter'] + (['quick'] if 'quick' in argv else [])
        print('costume', i, flush=True); subprocess.run(cmd, stdout=subprocess.DEVNULL, check=True)
        size = KIT[i]['size'] if KIT[i]['size'] != 'kid' else 'game'
        for v in ('front', 'three-quarter'):
            src = os.path.join(tmp, f'villager-kit-{i}-{size}-{v}.png')
            subprocess.run(['convert', src, '-quality', '86', os.path.join(out, f'{i}-{v}.jpg')], check=True)
    shutil.rmtree(tmp)
    sys.exit(0)

# ---------- run inside lumi.py (role=kit-<id>): the kit's people join the villagers ----------
for _id, _k in KIT.items():
    VILL['kit-' + _id] = {'g': _k['g'], 'size': _k['size'], 'pal': _k['pal'], 'hair': _k['hair'], 'top': (_k['body'], '#ffffff'), 'bottom': '#000000',
                         'kind': 'kit', 'hat': _k['hat'], 'shoes': _k['feet'], 'extra': (), 'kit': _k}
# headwear the kit adds; the open ones leave the hair on top of the head
KIT_HATS = ('quaithao', 'nondau', 'xungthien', 'kimquan', 'khanmoquat', 'khanvan', 'khanxep', 'khandaurriu', 'warhelm', 'mien', 'phoenix', 'bonnet', 'guan', 'pagri')
KIT_OPEN = ('khanvan', 'phoenix', 'guan', 'kimquan')
KIT_FIT = {'kitPanel': (.034, .34), 'kitVest': (.03, 0)}   # coat panels over a long skirt: a wider margin and flare than the skirt's (.014, .22)

def kc(part, d='#888888'):
    """the costume's felt for one part (a costume colour, or d)"""
    col = V['kit']['c'].get(part, d); return felt('kit' + part + col, col)

def kit_hair(name, A, Bm):
    """the kit's hair: a low bun (women), a topknot (men in the old tales), a high bun with a pin (hanfu), a long braid (sari); else lumi-hair's style"""
    C = lambda k: (A, Bm)[k % 2]
    if name == 'topknot':   # búi tó: all the hair combed up to a knot on the crown (it goes under a khăn or a helmet)
        hair_base(A, .36, -.36, -.62); knot = HC + Vector((0, .15 * R, 1.12 * R))
        ring(1.0, 12, lambda az, el, k: lock_at(C(k), az, el, .8, .48, toward=knot, gravity=.0, flick=0), False)
        ring(.5, 14, lambda az, el, k: lock_at(C(k), az, el, .75, .46, toward=knot, gravity=.0, flick=0), True, .5)
        ring(.1, 12, lambda az, el, k: lock_at(C(k), az, el, .55, .44, toward=knot, gravity=.1, flick=0), True)
        sphere('hairLock', A, knot, (.3 * R, .28 * R, .24 * R), 24, 12)
        sphere('hairLock', felt('knotTie', '#b8463a'), knot + Vector((0, 0, -.16 * R)), (.22 * R, .2 * R, .06 * R), 16, 8)
    elif name == 'highbun':   # a bun high at the back with a gold hairpin and a flower (hanfu)
        hair_base(A, .32, -.36, -.62); bun = HC + Vector((0, .55 * R, .95 * R))
        ring(1.2, 10, lambda az, el, k: lock_at(C(k), az, el, .8, .5, toward=bun, gravity=.0, flick=0), False)
        ring(.7, 14, lambda az, el, k: lock_at(C(k), az, el, .85, .48, toward=bun, gravity=.05, flick=0), True, .5)
        ring(.25, 12, lambda az, el, k: lock_at(C(k), az, el, .65, .45, toward=bun, gravity=.1, flick=0), True)
        sphere('bun', A, bun, (.4 * R, .36 * R, .34 * R), 24, 12)
        GOLD = mat('pinGold', '#d4a23a', .35, metal=.8)
        tube('hairpin', GOLD, [bun + Vector((-.7 * R, .05 * R, -.1 * R)), bun + Vector((.75 * R, .05 * R, .12 * R))], .025 * R, 8)
        for i in range(5):
            a = i * 2 * math.pi / 5; sphere('pinFlower', felt('pinPetal', '#f6a5b6'), bun + Vector((.72 * R + math.cos(a) * .08 * R, -.02 * R, .14 * R + math.sin(a) * .08 * R)), (.07 * R, .04 * R, .07 * R), 10, 5)
        sphere('pinFlower', GOLD, bun + Vector((.72 * R, -.05 * R, .14 * R)), (.04 * R,) * 3, 8, 4)
    elif name == 'braid':   # combed back to one long braid down the back, with a tassel (sari)
        hair_base(A, .32, -.36, -.62); nape = HC + Vector((0, .95 * R, -.45 * R))
        ring(1.2, 10, lambda az, el, k: lock_at(C(k), az, el, .85, .5, toward=nape, gravity=.15, flick=0), False)
        ring(.7, 14, lambda az, el, k: lock_at(C(k), az, el, .85, .48, toward=nape, gravity=.2, flick=0), True, .5)
        ring(.25, 12, lambda az, el, k: lock_at(C(k), az, el, .6, .45, toward=nape, gravity=.3, flick=0), True)
        n = 11
        for i in range(n):
            f = i / (n - 1); p = nape + Vector(((.05 if i % 2 else -.05) * R, .08 * R + .12 * R * f, -f * 2.4 * R))
            sphere('braid', C(i), p, (.22 * R * (1 - .35 * f), .18 * R * (1 - .3 * f), .2 * R), 16, 8, (0, .4 if i % 2 else -.4, 0))
        sphere('braidTie', felt('braidTie', '#d63a6a'), nape + Vector((0, .2 * R, -2.55 * R)), (.12 * R, .12 * R, .08 * R), 12, 6)
        tube('braidTuft', A, [nape + Vector((0, .2 * R, -2.6 * R)), nape + Vector((0, .2 * R, -2.95 * R))], [(.12 * R, .1 * R), (.03 * R, .03 * R)], 10)
    else:
        style(VSTYLE.get(name, name), A, Bm)

WING = [(-.07, 0), (.07, 0), (.3, .5), (.27, .66), (.14, .76), (0, .7), (-.14, .76), (-.27, .66), (-.3, .5)]   # a crown wing's outline, base at 0

def kit_plate(name, m, rim, jewel, base, tilt, thick=.03):
    """a crown wing: the WING outline (head units) as a flat plate facing the front, tilted out by tilt (radians, about the
    view axis) at base, with a rim tube and a jewel in the middle"""
    rot = Matrix.Rotation(tilt, 3, 'Y'); P3 = lambda x, z, y=0.0: base + rot @ (Vector((x, y, z)) * R)
    bm = bmesh.new(); f = [bm.verts.new(P3(x, z, -thick)) for x, z in WING]; b = [bm.verts.new(P3(x, z, thick)) for x, z in WING]
    bm.faces.new(f); bm.faces.new(b[::-1]); n = len(WING)
    for k in range(n): bm.faces.new((f[k], f[(k + 1) % n], b[(k + 1) % n], b[k]))
    obj_from(bm, name, m, False)
    tube(name, rim, [P3(x * 1.0, z, -thick * 1.4) for x, z in WING + WING[:1]], .035 * R, 8, False)
    sphere(name, jewel, P3(0, .42, -thick * 2.2), (.07 * R, .03 * R, .09 * R), 12, 6)

def kit_hat(kind, col=None):
    """the kit's headwear, in head units (H): the front of the face is -y. Wraps are named hatBand so they keep their place (no settling)."""
    M = felt('kithat' + kind + (col or ''), col or '#2b2422', .85, .08)
    ring_ = lambda z, rx, ry, tilt=0.0: [H(math.sin(t) * rx, -math.cos(t) * ry, z + tilt * math.cos(t)) for t in lin(0, 2 * math.pi, 33)]
    if kind in ('khanmoquat', 'quaithao'):   # khăn mỏ quạ: a dark square cloth folded in a triangle over the head, framing the face, its front edge pinched to a crow's-beak point over the forehead
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=1)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -.12 and v.co.z < .5 - .35 * v.co.x * v.co.x) or v.co.z < -.9 or (v.co.y < .2 and v.co.z < -.62)], context='VERTS')
        bmesh.ops.transform(bm, matrix=Matrix.Translation(H(0, .05, .04)) @ Matrix.Diagonal((1.16 * R, 1.14 * R, 1.13 * R, 1)), verts=bm.verts)
        o = obj_from(bm, 'hatBand', M); so = o.modifiers.new('thick', 'SOLIDIFY'); so.thickness = .07 * R; subsurf(o, 1)
        beak = sphere('hatBand', M, H(0, -.95, .66), (.3 * R, .3 * R, .07 * R), 24, 12, (.25, 0, 0))   # the beak: a pointed flap over the forehead
        for v in beak.data.vertices:
            if v.co.y < 0: v.co.y *= 1.0 + .9 * (1 - min(1, abs(v.co.x) / .3 / R * 1.4))
        # (owner, 6 Nov 2026 AEDT: the ends tied under the chin looked like a black beard) the ends are tucked in at the back
    if kind == 'quaithao':   # nón quai thao (Quan họ, Kinh Bắc): a wide flat palm-leaf hat over the khăn mỏ quạ, a low ring under it, and the long
        # black silk straps (quai thao) hanging from its sides down past the shoulders to the chest, where their gold tassels meet (owner, 6 Nov 2026 AEDT)
        LEAF = felt('quaithaoLeaf', '#e6d3a0', .8, .06); LACQ = mat('quaithaoUnder', '#3a2a1c', .45); SILK = mat('quaithaoSilk', '#1f1a1c', .35, sheen=.6); TAS = felt('quaithaoTassel', '#e8b84a')
        top = HC + Vector((0, .05 * R, 1.12 * R))
        lathe('hatBand', LEAF, [(0, .12 * R), (1.4 * R, .1 * R), (2.25 * R, .02 * R), (2.32 * R, -.02 * R)], 64, loc=top)        # the flat top
        lathe('hatBand', LACQ, [(2.3 * R, -.03 * R), (1.4 * R, .06 * R), (0, .08 * R)], 64, loc=top)                             # its lacquered underside
        lathe('hatBand', LEAF, [(1.02 * R, -.42 * R), (1.04 * R, .04 * R)], 40, loc=top)                                          # the ring (thành nón)
        for r_ in (.8, 1.4, 1.9): tube('hatBand', felt('quaithaoRib', '#cdb47e'), [top + Vector((math.cos(t) * r_ * R, math.sin(t) * r_ * R, (.12 - .05 * r_) * R)) for t in lin(0, 2 * math.pi, 49)], .02 * R, 6, False)
        for s in (-1, 1):   # the straps: from the ring's sides, outside the cheeks, down over the shoulders onto the chest, each with its gold tassel
            pts = [top + Vector((s * 1.02 * R, -.1 * R, -.3 * R)), HC + Vector((s * 1.3 * R, -.35 * R, -.45 * R)), HC + Vector((s * 1.15 * R, -.85 * R, -1.9 * R)), HC + Vector((s * .85 * R, -1.15 * R, -2.75 * R))]
            tube('hatBand', SILK, pts, [(.13 * R, .035 * R)] * len(pts), 8)
            end = pts[-1]; sphere('hatBand', TAS, end, (.1 * R, .07 * R, .09 * R), 12, 6)
            for k in range(5): tube('hatBand', TAS, [end + Vector(((k - 2) * .03 * R, 0, -.02 * R)), end + Vector(((k - 2) * .045 * R, -.02 * R, -.5 * R))], .02 * R, 6)
    elif kind == 'nondau':   # nón dấu: the old soldiers' small conical hat of palm leaf, lacquered, with a red top (owner, 6 Nov 2026 AEDT)
        LEAF = felt('nondauLeaf', col or '#e8d8a8', .7, .05); RED = felt('nondauRed', '#c62f2f', .6, .05); BAND = felt('nondauBand', '#b8332a')
        top = HC + Vector((0, .02 * R, .62 * R))
        lathe('hatCrown', LEAF, [(0, .72 * R), (.35 * R, .5 * R), (1.45 * R, .02 * R), (1.48 * R, -.04 * R), (1.3 * R, -.02 * R), (0, .5 * R)], 48, loc=top)
        lathe('hatBand', RED, [(0, 1.02 * R), (.16 * R, .86 * R), (.3 * R, .62 * R), (.34 * R, .56 * R), (0, .6 * R)], 24, loc=top)   # the red top
        tube('hatBand', BAND, [top + Vector((math.cos(t) * .6 * R, math.sin(t) * .6 * R, .3 * R)) for t in lin(0, 2 * math.pi, 33)], .035 * R, 8, False)
        for s in (-1, 1): tube('hatBand', BAND, [top + Vector((s * .95 * R, 0, -.12 * R)), HC + Vector((s * .6 * R, -.25 * R, -.75 * R)), HC + Vector((0, -.5 * R, -1.0 * R))], .02 * R, 8, False)
    elif kind == 'xungthien':   # mũ xung thiên (the king of the old tales, as in the Vietnamese fairy-tale films): a gold cap, a high crown at the back,
        # two gold wings standing up behind it, a sun and a pearl in front, dragons along the band (owner, 6 Nov 2026 AEDT)
        GOLD = mat('kitGold', '#d4a23a', .3, metal=.85); GOLDL = mat('kitGoldL', '#f2d16b', .25, metal=.9); RED = mat('kitRuby', '#c62f2f', .2); PEARL = mat('kitPearl', '#f6f1ea', .2)
        lathe('hatCrown', GOLD, [(1.1 * R, .15 * R), (1.12 * R, .45 * R), (1.02 * R, .78 * R), (.6 * R, .95 * R), (0, .98 * R)], 40, loc=HC)
        tube('hatBand', GOLDL, ring_(.2, 1.12, 1.1), .06 * R, 8, False)
        c = lathe('hatBand', GOLD, [(.0, .6 * R), (.7 * R, .62 * R), (.75 * R, 1.1 * R), (.55 * R, 1.42 * R), (0, 1.5 * R)], 32, loc=HC + Vector((0, .35 * R, 0)))   # the high back crown
        for s in (-1, 1):   # the two wings standing up behind ("xung thiên", toward the sky)
            # (owner, 6 Nov 2026 AEDT: rounded wings read as rabbit ears) flat fan-shaped gold plates, narrow where they meet behind
            # the crown and wide at the top, a light gold rim and a ruby, their face to the front, the pair opening in a V
            kit_plate('hatBand', GOLD, GOLDL, RED, H(s * .16, .72, 1.38), s * .42)
        sphere('hatBand', GOLDL, H(0, -1.1, .5), (.32 * R, .06 * R, .3 * R), 20, 10)   # the sun plate in front
        sphere('hatBand', PEARL, H(0, -1.16, .52), (.1 * R,) * 3, 12, 6)
        for k in range(8): a = k * math.pi / 4; sphere('hatBand', RED, H(math.cos(a) * .22, -1.15, .52 + math.sin(a) * .22), (.04 * R,) * 3, 8, 4)
        for s in (-1, 1):   # a dragon along each side of the band: a curling gold body with a red eye
            tube('hatBand', GOLDL, [H(s * .3, -1.06, .3), H(s * .7, -.85, .42), H(s * 1.0, -.45, .3), H(s * 1.12, .05, .45), H(s * 1.02, .45, .3)], [.06 * R, .07 * R, .06 * R, .05 * R, .03 * R], 10)
            sphere('hatBand', RED, H(s * .35, -1.08, .36), (.04 * R,) * 3, 8, 4)
    elif kind == 'kimquan':   # kim quan (a prince): a small gold crown over the topknot, shaped like a flame, a gold pin through it and a red jewel
        GOLD = mat('kitGold', '#d4a23a', .3, metal=.85); RED = mat('kitRuby', '#c62f2f', .2)
        knot = HC + Vector((0, .15 * R, 1.12 * R))
        lathe('hatBand', GOLD, [(.0, -.12 * R), (.38 * R, -.12 * R), (.42 * R, .12 * R), (.3 * R, .4 * R), (.12 * R, .56 * R), (0, .62 * R)], 32, loc=knot)
        tube('hatBand', GOLD, [knot + Vector((-.75 * R, 0, .1 * R)), knot + Vector((.75 * R, 0, .1 * R))], .03 * R, 8)
        sphere('hatBand', RED, knot + Vector((0, -.4 * R, .08 * R)), (.08 * R, .05 * R, .1 * R), 12, 6)
        tube('hatBand', GOLD, [knot + Vector((math.cos(t) * .42 * R, math.sin(t) * .42 * R, -.1 * R)) for t in lin(0, 2 * math.pi, 25)], .03 * R, 6, False)
    elif kind == 'khanvan':    # khăn vấn: a long cloth wound into a soft ring round the head (the hair inside)
        for j, (z, r, t) in enumerate(((.38, 1.12, .06), (.5, 1.1, .08), (.62, 1.06, .1))):
            tube('hatBand', felt('kitvan' + str(j % 2), col if j % 2 == 0 else '#4a3a2e'), ring_(z, r, r * .97, t), .13 * R, 12, False)
    elif kind == 'khanxep':    # khăn xếp: a ready-folded black turban: neat stacked folds and a closed top
        for j, z in enumerate(lin(.32, .74, 5)):
            tube('hatBand', M, ring_(z, 1.12 - j * .02, 1.08 - j * .02, .05 * (j % 2)), .085 * R, 12, False)
        lathe('hatBand', M, [(0, .86 * R), (.75 * R, .84 * R), (1.02 * R, .76 * R)], 32, loc=HC)
        for k in range(5):   # the diagonal folds across the front
            z = .38 + k * .09; tube('hatBand', felt('kitxepfold', '#3a3646'), [H(-.6, -.95, z), H(.6, -.95, z + .1)], .02 * R, 6)
    elif kind == 'khandaurriu':   # khăn đầu rìu: a cloth wound round the head with the knot standing up over the forehead like an axe head
        for j, z in enumerate((.36, .52)): tube('hatBand', M, ring_(z, 1.12, 1.08, .05), .11 * R, 12, False)
        d = sphere('hatBand', M, H(0, .1, .62), (1.02 * R, 1.0 * R, .5 * R), 24, 12)
        for v in d.data.vertices: v.co.z = max(v.co.z, 0)
        sphere('hatBand', M, H(0, -1.02, .82), (.34 * R, .1 * R, .26 * R), 20, 10, (-.3, 0, 0))   # the axe head
        sphere('hatBand', M, H(0, -1.05, .55), (.12 * R, .1 * R, .12 * R), 12, 6)
    elif kind == 'warhelm':   # a general's helmet: an iron dome with a gold rim, cheek guards, a spike and a red plume
        IRON = mat('kitIron', col or '#6a7480', .35, metal=.7); GOLD = mat('kitGold', '#d4a23a', .3, metal=.85)
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < (.35 if v.co.y < -.3 else -.25)], context='VERTS')   # open over the face, down to the nape at the back
        bmesh.ops.transform(bm, matrix=Matrix.Translation(H(0, .02, .08)) @ Matrix.Diagonal((1.2 * R, 1.18 * R, 1.12 * R, 1)), verts=bm.verts)
        d = obj_from(bm, 'hatBand', IRON); so = d.modifiers.new('thick', 'SOLIDIFY'); so.thickness = .06 * R
        tube('hatBand', GOLD, ring_(.42, 1.2, 1.18, -.1), .05 * R, 8, False)
        for s in (-1, 1): sphere('hatBand', IRON, H(s * 1.04, -.15, -.25), (.12 * R, .4 * R, .45 * R), 16, 8, (0, 0, s * .15))
        tube('hatBand', GOLD, [H(0, 0, 1.25), H(0, 0, 1.6)], [.06 * R, .02 * R], 8)
        tube('hatBand', felt('plume', '#c62f2f'), [H(0, 0, 1.55), H(0, .3, 1.75), H(0, .75, 1.6), H(0, 1.0, 1.25)], [.12 * R, .16 * R, .12 * R, .04 * R], 12)
    elif kind == 'mien':   # mũ miện: a black cap with gold trim, a flat board on top with hanging strings of beads
        GOLD = mat('kitGold', '#d4a23a', .3, metal=.85)
        lathe('hatCrown', M, [(1.05 * R, .2 * R), (1.08 * R, .55 * R), (1.0 * R, .95 * R), (0, .98 * R)], 32, loc=HC)
        tube('hatBand', GOLD, ring_(.25, 1.07, 1.05), .05 * R, 8, False); tube('hatBand', GOLD, ring_(.85, 1.02, 1.0), .04 * R, 8, False)
        sphere('hatBand', M, H(0, -.05, 1.08), (1.45 * R, 1.0 * R, .06 * R), 24, 8, (-.06, 0, 0))
        for x in lin(-1.25, 1.25, 7):
            for y in (-1.0, .92):
                for k in range(4): sphere('hatBand', mat('bead' + str(k % 2), ('#f2d16b', '#c62f2f')[k % 2], .3), H(x, y, 1.0 - k * .16), (.05 * R,) * 3, 8, 4)
        sphere('hatBand', GOLD, H(0, -1.06, .55), (.16 * R, .06 * R, .16 * R), 16, 8)
    elif kind == 'phoenix':   # mũ phượng: a gold band with upright points, a phoenix in front and two wings at the sides
        GOLD = mat('kitGold', '#d4a23a', .3, metal=.85)
        tube('hatBand', GOLD, ring_(.55, 1.12, 1.08, .05), .07 * R, 10, False)
        for i in range(9):
            t = -1.2 + i * .3; tube('hatBand', GOLD, [H(math.sin(t) * 1.1, -math.cos(t) * 1.06, .58), H(math.sin(t) * 1.06, -math.cos(t) * 1.02, .9 + .12 * math.cos(t))], [.05 * R, .015 * R], 6)
            sphere('hatBand', mat('kitRuby', '#c62f2f', .2), H(math.sin(t) * 1.06, -math.cos(t) * 1.02, .92 + .12 * math.cos(t)), (.045 * R,) * 3, 8, 4)
        sphere('hatBand', GOLD, H(0, -1.1, .82), (.2 * R, .08 * R, .26 * R), 16, 8)
        for s in (-1, 1): sphere('hatBand', GOLD, H(s * 1.15, -.1, .78), (.08 * R, .45 * R, .22 * R), 16, 8, (.4, 0, s * .2))
    elif kind == 'bonnet':   # a settler's sun bonnet: a soft hood round the back of the head, a stiff brim framing the face, a ribbon under the chin
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=1)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -.35 or v.co.z < -.55], context='VERTS')
        bmesh.ops.transform(bm, matrix=Matrix.Translation(H(0, .1, .1)) @ Matrix.Diagonal((1.2 * R, 1.2 * R, 1.18 * R, 1)), verts=bm.verts)
        o = obj_from(bm, 'hatBand', M); so = o.modifiers.new('thick', 'SOLIDIFY'); so.thickness = .06 * R; subsurf(o, 1)
        brim = [H(math.cos(t) * 1.35, -.62 - .25 * math.sin(t), -.35 + math.sin(t) * 1.75) for t in lin(0, math.pi, 21)]
        tube('hatBand', M, brim, (.08 * R, .3 * R), 12, False)
        RB = felt('bonnetRibbon', '#6f8fb0')
        for s in (-1, 1): tube('hatBand', RB, [H(s * 1.1, -.5, -.4), H(s * .5, -.6, -1.0), H(0, -.62, -1.1)], .05 * R, 8)
        sphere('hatBand', RB, H(0, -.65, -1.12), (.14 * R, .08 * R, .1 * R), 12, 6)
    elif kind == 'guan':   # a small cap over the topknot with a pin through it
        knot = H(0, .15, 1.12)
        lathe('hatBand', M, [(.0, -.05 * R), (.3 * R, -.05 * R), (.32 * R, .2 * R), (.22 * R, .36 * R), (0, .38 * R)], 24, loc=knot)
        tube('hatBand', mat('kitGold', '#d4a23a', .3, metal=.85), [knot + Vector((-.5 * R, 0, .15 * R)), knot + Vector((.5 * R, 0, .15 * R))], .03 * R, 8)
    elif kind == 'pagri':   # a pagri: a cloth wound in wide rings with a jewel in front
        for j, z in enumerate(lin(.3, .9, 5)):
            tube('hatBand', M, ring_(z, 1.2 - j * .06, 1.16 - j * .06, .06 * ((-1) ** j)), .15 * R, 12, False)
        sphere('hatBand', M, H(0, 0, .85), (.95 * R, .92 * R, .45 * R), 24, 12)
        sphere('hatBand', mat('kitJewel', '#3cc7e8', .15, metal=.3), H(0, -1.2, .62), (.1 * R, .06 * R, .13 * R), 12, 6)
        sphere('hatBand', felt('kitFeather', '#f4efe2'), H(0, -1.12, .95), (.07 * R, .05 * R, .25 * R), 10, 5, (-.3, 0, 0))

def body_kit():
    """the period garments, on the game's villager body (the sculpt fits the named parts: shirt, sleeve, trouser and seat become fitted
    layers; aoDai, tunic, aoBaBa, longSkirt and belt are fitted ring by ring; the rest keeps its shape)"""
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']; k = V['kit']; c = k['c']; body_ = k['body']
    zK = b['zCuff']; zA = b['zAnk']; zMid = (zK + zA) / 2
    def sleeves_to(m, upto=1.0, cuff=None, wide=0.0):
        def f(s, sh, el, wr):
            rU, rA = B['rU'], B['rA']
            if upto <= 0: return
            if upto < .5: tube('sleeve', m, [sh, sh.lerp(el, upto * 2)], [rU * 1.35, rU * 1.3], 18); return
            e = (wr - el).normalized(); end = wr - e * .03 * S
            tube('sleeve', m, [sh, el, end], [rU * 1.3, rA * 1.35, rA * 1.3], 18)
            if wide:   # a wide hanging sleeve (hanfu, royal robes): it opens out from the elbow and hangs below the wrist
                tube('wideSleeve', m, [el.lerp(wr, .15), wr + e * .02 * S, wr + e * .05 * S + Vector((0, 0, -.06 * S))], [rA * 1.6, rA * wide, rA * wide * 1.05], 20)
            if cuff: tube('cuffTrim', cuff, [end - e * .012 * S, end + e * .006 * S], rA * (wide * 1.06 if wide else 1.42), 16)
        return f
    def long_panels(m, z_low, flare=1.18, split=True, name='kitPanel', four=False):
        if split:   # front and back panels, open at the sides (áo the); four: the front in two panels that hang open (áo tứ thân)
            for a0, a1 in (((-1.1, -.14), (.14, 1.1)) if four else ((-1.05, 1.05),)) + ((math.pi - 1.05, math.pi + 1.05),):
                lathe(name, m, [(wC * 1.05, b['zW']), (wH * 1.1, b['zCr']), (wH * flare, z_low + .02 * S), (wH * flare * 1.01, z_low)], 28, scale=(1, dep * 1.05), arc=(a0, a1))
        else:
            lathe(name, m, [(wC * 1.05, b['zW']), (wH * 1.1, b['zCr']), (wH * flare, z_low + .02 * S), (wH * flare * 1.01, z_low)], 40, scale=(1, dep * 1.05))
        if not four: lathe(name, m, [(wC * 1.04, b['zW'] - .02 * S), (wC * 1.06, b['zC']), (wC * .85, b['zS'] + .01 * S)], 32, scale=(1, dep))
    def sash(m, z=None, ends=True, tilt=0.0):
        z = b['zW'] if z is None else z
        lathe('belt', m, [(wC * 1.1, z - .016 * S), (wC * 1.13, z + .014 * S)], 32, scale=(1, dep))
        if ends:   # the tied ends hang at the front, a little to one side
            for dx in (-.025, .02):
                tube('sashEnd', m, [Vector((dx * S + .03 * S, fronty(wC * 1.16) - .004, z)), Vector((dx * S * 1.4 + .035 * S, fronty(wC * 1.2) - .008, z - .1 * S)), Vector((dx * S * 1.6 + .04 * S, fronty(wC * 1.22) - .01, z - .2 * S))], [(.018 * S, .006 * S), (.022 * S, .006 * S), (.02 * S, .005 * S)], 10)
    def collar_ring(m, r=.5, h=.016):
        tube('coatCollar', m, [Vector((math.cos(t) * wC * r, math.sin(t) * wC * r * .9, b['zN'] + .005)) for t in lin(0, 2 * math.pi, 21)], h * S, 8, False)
    def trousers(m, low, r=.56):
        for s in (-1, 1): tube('trouser', m, [(s * b['legX'] * .85, 0, b['zCr'] + .02 * S), (s * b['legX'] * 1.05, 0, low)], [wH * r, wH * r * 1.02], 24)
        lathe('seat', m, [(wH * .55, b['zCr'] - .035 * S), (wH * .95, b['zCr'] - .005 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
    def long_skirt(m, top=None, low=None, name='longSkirt'):
        top = b['zW'] if top is None else top; low = zA + .03 * S if low is None else low
        lathe(name, m, [(wC * 1.05, top + .01 * S), (wH * 1.12, b['zCr']), (wH * 1.32, low + .03 * S), (wH * 1.33, low)], 40, scale=(1, dep * 1.05))
    def torso(m, collar=False):
        before = set(bpy.data.objects); globals()['torso'](m)
        if not collar:
            for o in set(bpy.data.objects) - before:
                if o.name.split('.')[0] == 'collar': bpy.data.objects.remove(o)
    def buttons(z0, z1, n, m, x=0.0):
        for z in lin(z0, z1, n): sphere('button', m, (x, fronty(wC * 1.08) - .004, z), (.008 * S, .004 * S, .008 * S), 10, 5)

    if body_ == 'tuthan':   # áo tứ thân: a long coat of four panels over a yếm, the front panels left open and the sash tied at the waist, váy đụp to the ankle
        legs(SKIN); long_skirt(kc('skirt'))
        torso(kc('coat')); long_panels(kc('coat'), zK - .08 * S, 1.22, four=True)
        lathe('bib', kc('yem'), [(wC * 1.1, b['zW'] - .01 * S), (wC * 1.12, (b['zW'] + b['zC']) / 2), (wC * 1.0, b['zC'] + .03 * S), (wC * .7, b['zS'] - .005 * S)], 16, scale=(1, dep), arc=(-.5, .5))
        for s in (-1, 1): tube('coatCollar', kc('trim'), [Vector((s * wC * .3, fronty(wC * .55) - .006, b['zN'] - .005)), Vector((s * wC * .55, fronty(wC * 1.05) - .008, b['zC'])), Vector((s * wC * .5, fronty(wC * 1.12) - .008, b['zW']))], .012 * S, 8, False)
        sash(kc('sash'))
        hands = arm_pair(sleeves_to(kc('coat'), 1.0, kc('trim')))
    elif body_ == 'yem':   # yếm and váy đụp: bare shoulders and arms, the yếm tied round the neck, a sash
        legs(SKIN); long_skirt(kc('skirt'))
        torso(SKIN)
        lathe('bib', kc('yem'), [(wC * 1.08, b['zW'] - .02 * S), (wC * 1.1, (b['zW'] + b['zC']) / 2), (wC * 1.0, b['zC'] + .03 * S), (wC * .6, b['zS'] + .005 * S)], 18, scale=(1, dep), arc=(-.95, .95))
        for s in (-1, 1): tube('strap', kc('yem'), [Vector((s * wC * .35, fronty(wC * .65) - .004, b['zS'])), Vector((s * wC * .45, 0, b['zN'] - .01 * S)), Vector((0, wC * dep * .55, b['zN'] - .02 * S))], .007 * S, 8, False)
        sash(kc('sash'))
        hands = arm_pair(sleeves_to(None, 0))
    elif body_ == 'aothe':   # áo the: a long dark gauze tunic to the shins, a high collar, side splits, white trousers
        legs(kc('pants')); trousers(kc('pants'), zA + .04 * S, .62)
        torso(kc('coat')); long_panels(kc('coat'), zMid, 1.2); collar_ring(kc('trim'), .52, .02)
        buttons(b['zC'] - .02 * S, b['zN'] - .03 * S, 3, felt('kitbutton', '#d4a23a'), .04 * S)
        hands = arm_pair(sleeves_to(kc('coat'), 1.0, kc('trim')))
    elif body_ == 'aonau':   # áo nâu (áo cánh): a short brown jacket to the hips with cloth buttons, trousers rolled to the calf, a sash
        legs(SKIN); trousers(kc('pants'), zMid + (.0 if V['size'] == 'kid' else .03 * S))
        torso(kc('coat')); hem = b['zCr'] - .04 * S
        lathe('aoBaBa', kc('coat'), [(wH * 1.12, hem), (wH * 1.06, hem + .05 * S), (wC * 1.06, b['zW'] + .02 * S), (wC * 1.05, b['zC'] - .01 * S)], 36, scale=(1, dep))
        buttons(hem + .05 * S, b['zC'] + .02 * S, 4, felt('kitbutton', '#4e3a2c'))
        sash(kc('sash'), b['zW'] - .02 * S, ends=True)
        hands = arm_pair(sleeves_to(kc('coat'), 1.0 if V['size'] != 'kid' else .45))
    elif body_ == 'kho':   # khố: a loincloth wound round the hips with a front and a back flap; bare chest; a woven band on the arm
        legs(SKIN); torso(SKIN)
        lathe('belt', kc('kho'), [(wH * 1.02, b['zCr'] - .01 * S), (wH * 1.06, b['zCr'] + .04 * S), (wC * 1.06, b['zW'] - .03 * S)], 32, scale=(1, dep))
        for a0 in (0.0, math.pi):
            lathe('khoFlap', kc('kho'), [(wH * 1.08, b['zCr'] + .02 * S), (wH * 1.12, b['zCr'] - .08 * S), (wH * 1.14, b['zCr'] - .2 * S)], 12, scale=(1, dep * 1.05), arc=(a0 - .42, a0 + .42))
        tube('khoBand', kc('band'), [Vector((math.cos(t) * wH * 1.08, math.sin(t) * wH * 1.08 * dep, b['zW'] - .035 * S)) for t in lin(0, 2 * math.pi, 25)], .01 * S, 8, False)
        hands = arm_pair(sleeves_to(None, 0))
        for s in (-1, 1):
            sh, el = Vector((s * b['sh'][0], b['sh'][1], b['sh'][2])), Vector((s * b['el'][0], b['el'][1], b['el'][2]))
            p = sh.lerp(el, .55); tube('armBand', kc('band'), [p - (el - sh).normalized() * .008 * S, p + (el - sh).normalized() * .008 * S], b['rU'] * 1.25, 16)
    elif body_ == 'armour':   # giáp: a red under-robe, an iron breastplate with gold studs, shoulder guards, a skirt of plates, a red cape
        IRON = mat('kitIron', c['plate'], .35, metal=.7); GOLD = mat('kitGold', c['gold'], .3, metal=.85)
        legs(kc('pants')); trousers(kc('pants'), zA + .1 * S)
        torso(kc('under')); long_panels(kc('under'), zK - .02 * S, 1.2)
        lathe('tunic', IRON, [(wC * 1.12, b['zW'] - .03 * S), (wC * 1.15, (b['zW'] + b['zC']) / 2), (wC * 1.1, b['zC'] + .02 * S), (wC * .8, b['zS'] + .01 * S)], 36, scale=(1, dep))
        for z in lin(b['zW'] + .02 * S, b['zC'], 3):
            for x in (-.05, 0, .05): sphere('stud', GOLD, (x * S, fronty(wC * 1.18) - .006, z), (.008 * S,) * 3, 8, 4)
        sphere('mirror', GOLD, (0, fronty(wC * 1.2) - .01, (b['zW'] + b['zC']) / 2 + .02 * S), (.04 * S, .008 * S, .04 * S), 20, 10)   # the round chest mirror (hộ tâm kính)
        for i in range(10):   # the plates hanging from the belt
            a = 2 * math.pi * i / 10
            lathe('plate', IRON if i % 2 else GOLD, [(wH * 1.2, b['zW'] - .02 * S), (wH * 1.3, b['zCr'] - .02 * S), (wH * 1.36, b['zCr'] - .14 * S)], 6, scale=(1, dep * 1.05), arc=(a - .3, a + .3))
        lathe('belt', GOLD, [(wC * 1.16, b['zW'] - .03 * S), (wC * 1.18, b['zW'] + .0 * S)], 32, scale=(1, dep))
        lathe('cape', kc('cape'), [(wC * 1.7, zK - .05 * S), (wC * 1.42, b['zC'] - .08 * S), (wC * 1.2, b['zS'] - .02 * S), (wC * .86, b['zS'] + .025 * S), (wC * .55, b['zN'])], 40, scale=(1, dep * 1.05), arc=(1.0, 2 * math.pi - 1.0))
        hands = arm_pair(sleeves_to(kc('under'), 1.0, GOLD))
        for s in (-1, 1):
            sh = Vector((s * b['sh'][0], b['sh'][1], b['sh'][2]))
            d = sphere('pauldron', IRON, sh + Vector((s * .01 * S, 0, .005 * S)), (b['rU'] * 2.0, b['rU'] * 1.9, b['rU'] * 1.3), 20, 10, (0, s * .35, 0))
            sphere('pauldron', GOLD, sh + Vector((s * .03 * S, 0, -.035 * S)), (b['rU'] * 2.05, b['rU'] * 1.95, b['rU'] * .25), 20, 6, (0, s * .35, 0))
        tube('spear', WOOD, [hands[1] + Vector((0, 0, -.55 * S)), hands[1] + Vector((0, 0, .9 * S))], .012 * S, 10)   # the spear (a blunt shaft with a tassel)
        tube('spearTip', IRON, [hands[1] + Vector((0, 0, .9 * S)), hands[1] + Vector((0, 0, 1.08 * S))], [.024 * S, .004 * S], 8)
        sphere('tassel', felt('tassel', '#c62f2f'), hands[1] + Vector((0, 0, .86 * S)), (.03 * S, .03 * S, .05 * S), 12, 6)
    elif body_ == 'royal':   # hoàng bào: a long robe to the feet with wide sleeves, a round gold dragon (or phoenix) on the chest, a jade belt hung low
        GOLD = mat('kitGold', c['gold'], .3, metal=.85)
        legs(kc('robe')); torso(kc('robe')); long_panels(kc('robe'), zA + .02 * S, 1.42, split=False); collar_ring(kc('trim'), .55, .02)
        lathe('hem', kc('trim'), [(wH * 1.43, zA + .02 * S), (wH * 1.44, zA + .07 * S)], 40, scale=(1, dep * 1.05))
        sphere('emblem', GOLD, (0, fronty(wC * 1.16) - .008, (b['zW'] + b['zC']) / 2 + .02 * S), (.055 * S, .008 * S, .055 * S), 24, 10)
        for i in range(6):   # the dragon's coil drawn as gold scales round the emblem
            a = i * math.pi / 3; sphere('emblem', kc('trim'), (math.cos(a) * .035 * S, fronty(wC * 1.17) - .014, (b['zW'] + b['zC']) / 2 + .02 * S + math.sin(a) * .035 * S), (.01 * S, .004 * S, .01 * S), 10, 5)
        tube('jadeBelt', kc('belt'), [Vector((math.cos(t) * wC * 1.28, math.sin(t) * wC * 1.28 * dep, b['zW'] - .02 * S - .05 * S * max(0, -math.sin(t)))) for t in lin(0, 2 * math.pi, 33)], .016 * S, 10, False)
        hands = arm_pair(sleeves_to(kc('robe'), 1.0, kc('trim'), wide=3.0))
    elif body_ == 'colonial':   # colonial bushman: a cream shirt with rolled sleeves, a brown waistcoat, a red neckerchief, moleskin trousers, boots
        legs(kc('pants')); trousers(kc('pants'), zA + .05 * S, .6)
        torso(kc('shirt'), True)
        lathe('kitVest', kc('vest'), [(wC * 1.06, b['zW'] - .05 * S), (wC * 1.08, (b['zW'] + b['zC']) / 2), (wC * 1.04, b['zC'] + .01 * S)], 32, scale=(1, dep), arc=(.22, 2 * math.pi - .22))
        buttons(b['zW'] - .03 * S, b['zC'], 4, mat('kitBrass', '#b98a46', .35, metal=.85), .03 * S)
        scarf(c['scarf'])
        hands = arm_pair(sleeves_to(kc('shirt'), .9))
        for s in (-1, 1):   # the rolled cuffs below the elbow
            el, wr = Vector((s * b['el'][0], b['el'][1], b['el'][2])), Vector((s * b['wr'][0], b['wr'][1], b['wr'][2]))
            p = el.lerp(wr, .3); tube('sleeveRoll', kc('shirt'), [p - (wr - el).normalized() * .012 * S, p + (wr - el).normalized() * .012 * S], b['rA'] * 1.55, 16)
    elif body_ == 'colonialf':   # colonial dress: a long blue dress with long sleeves, a white collar, a long apron, boots
        legs(kc('dress')); long_skirt(kc('dress'), low=zA + .02 * S)
        torso(kc('dress')); lathe('bodice', kc('dress'), [(wC * 1.05, b['zW'] - .02 * S), (wC * 1.07, b['zC']), (wC * .95, b['zS'] - .005 * S)], 32, scale=(1, dep))
        for s in (-1, 1): sphere('collar', kc('collar'), (s * .32 * wC, fronty(wC * .55) - .002, b['zN'] - .07 * wC), (.36 * wC, .1 * wC, .2 * wC), 16, 8, (0, s * .3, s * .5))
        lathe('apron', kc('apron'), [(wH * 1.36, zA + .1 * S), (wH * 1.14, b['zCr']), (wC * 1.1, b['zW'] + .03 * S)], 24, scale=(1, dep * 1.03), arc=(-.85, .85))
        lathe('belt', kc('apron'), [(wC * 1.08, b['zW'] - .01 * S), (wC * 1.1, b['zW'] + .014 * S)], 32, scale=(1, dep))
        buttons(b['zW'] + .03 * S, b['zN'] - .03 * S, 4, felt('kitbutton', '#f4efe2'))
        hands = arm_pair(sleeves_to(kc('dress'), 1.0, kc('collar')))
    elif body_ == 'hanfu':   # hanfu (ruqun): a cross-collared top, a long skirt tied high, a sash, wide hanging sleeves
        legs(kc('skirt')); torso(kc('top'))
        long_skirt(kc('skirt'), top=b['zC'] - .04 * S, low=zA + .01 * S)
        sash(kc('sash'), b['zC'] - .035 * S)
        tube('coatCollar', kc('trim'), [Vector((-wC * .45, fronty(wC * .5), b['zN'])), Vector((0, fronty(wC * .85) - .008, b['zC'] + .01 * S)), Vector((wC * .7, fronty(wC * 1.02) - .008, b['zC'] - .04 * S))], .016 * S, 8, False)
        tube('coatCollar', kc('trim'), [Vector((wC * .45, fronty(wC * .5), b['zN'])), Vector((wC * .3, fronty(wC * .78) - .006, b['zC'] + .03 * S))], .016 * S, 8, False)
        hands = arm_pair(sleeves_to(kc('sleeve'), 1.0, kc('trim'), wide=3.2))
        tube('ribbon', kc('sash'), [Vector((.04 * S, fronty(wC * 1.15) - .006, b['zC'] - .04 * S)), Vector((.05 * S, fronty(wC * 1.5) - .01, b['zCr'])), Vector((.06 * S, fronty(wH * 1.4) - .01, zK))], [(.012 * S, .004 * S)] * 3, 8)
    elif body_ == 'hanfum':   # a man's hanfu: a long robe to the feet, crossed at the front, a dark sash, wide sleeves
        legs(kc('robe')); torso(kc('robe')); long_panels(kc('robe'), zA + .03 * S, 1.38, split=False)
        tube('coatCollar', kc('trim'), [Vector((-wC * .45, fronty(wC * .5), b['zN'])), Vector((0, fronty(wC * .85) - .008, b['zC'])), Vector((wC * .7, fronty(wC * 1.06) - .008, b['zW'] + .02 * S))], .018 * S, 8, False)
        tube('coatCollar', kc('trim'), [Vector((wC * .45, fronty(wC * .5), b['zN'])), Vector((wC * .3, fronty(wC * .78) - .006, b['zC'] + .02 * S))], .018 * S, 8, False)
        lathe('hem', kc('trim'), [(wH * 1.39, zA + .03 * S), (wH * 1.4, zA + .07 * S)], 40, scale=(1, dep * 1.05))
        sash(kc('sash'))
        hands = arm_pair(sleeves_to(kc('sleeve'), 1.0, kc('trim'), wide=3.0))
    elif body_ == 'sari':   # sari: a short choli, the sari wound as a long skirt with pleats in front and its end (pallu) over the left shoulder, a gold border
        legs(SKIN); torso(kc('choli')); long_skirt(kc('sari'), low=zA + .01 * S)
        GOLDB = felt('kitborder' + c['border'], c['border'])
        lathe('hem', GOLDB, [(wH * 1.34, zA + .01 * S), (wH * 1.35, zA + .05 * S)], 40, scale=(1, dep * 1.05))
        for x in lin(-.05, .05, 5): tube('pleat', kc('sari'), [Vector((x * S, fronty(wH * 1.18) - .006, b['zW'] - .02 * S)), Vector((x * S * 1.3, fronty(wH * 1.36) - .008, zA + .04 * S))], .009 * S, 8)
        pallu = [Vector((wH * .9, fronty(wH * 1.15) - .006, b['zCr'] + .02 * S)), Vector((.0, fronty(wC * 1.14) - .008, b['zW'] + .04 * S)), Vector((-wC * .5, fronty(wC * 1.1) - .01, b['zC'] + .03 * S)),
                 Vector((-b['sh'][0] * .75, -.005 * S, b['zS'] + .025 * S)), Vector((-b['sh'][0] * .8, wC * dep * 1.05, b['zC'])), Vector((-b['sh'][0] * .7, wC * dep * 1.15, b['zCr'] - .02 * S)), Vector((-b['sh'][0] * .65, wC * dep * 1.2, zK - .02 * S))]
        tube('pallu', kc('sari'), pallu, [(.075 * S, .01 * S)] * len(pallu), 12)
        tube('palluBorder', GOLDB, [p + Vector((.0, -.003, -.07 * S if i < 3 else 0)) for i, p in enumerate(pallu)], .008 * S, 6)
        decal('bindi', mat('bindi', '#c62f2f', .4), 0, .14, .055, .055, .015, .012)
        hands = arm_pair(sleeves_to(kc('choli'), .3))
        for s in (-1, 1):   # gold bangles
            wr = Vector((s * b['wr'][0], b['wr'][1], b['wr'][2])); tube('bangle', GOLDB, [wr + Vector((0, 0, .012 * S)), wr + Vector((0, 0, -.002))], b['rA'] * 1.25, 14)
    elif body_ == 'dhoti':   # dhoti and kurta: a long cream shirt to the knees, the dhoti wrapped loose round the legs, a saffron scarf over the shoulders
        legs(SKIN); trousers(kc('dhoti'), zMid, .7)
        torso(kc('kurta'))
        lathe('tunic', kc('kurta'), [(wH * 1.24, zK + .02 * S), (wH * 1.16, b['zCr']), (wC * 1.08, b['zW'] + .02 * S), (wC * 1.07, b['zC'] - .01 * S)], 36, scale=(1, dep))
        buttons(b['zC'] - .01 * S, b['zN'] - .03 * S, 3, felt('kitbutton', '#d4a23a'))
        for s in (-1, 1): tube('scarfDrape', kc('scarf'), [Vector((s * wC * .3, fronty(wC * .9) - .01, b['zCr'] + .02 * S)), Vector((s * wC * .5, fronty(wC * 1.0) - .01, b['zC'])), Vector((s * b['sh'][0] * .55, -.01 * S, b['zS'] + .03 * S)), Vector((0, wC * dep * .95, b['zS'] - .02 * S))], [(.04 * S, .009 * S)] * 4, 10)
        hands = arm_pair(sleeves_to(kc('kurta'), 1.0))
    feet = V['shoes'].split('/')[0]
    if feet == 'bare':   # bare feet: soft toes in front of the foot
        for s in (-1, 1): sphere('footBare', SKIN, (s * b['legX'], -b['boot'][1] * .4, .03 * S), (b['boot'][0] * .8, b['boot'][1] * .85, .032 * S), 24, 12)
    elif feet == 'cloth':   # cloth shoes with a turned-up toe
        CL = felt('kitClothShoe', '#2b2422')
        for s in (-1, 1):
            X = s * b['legX']; bw, bl = b['boot']
            lathe('clothShoe', CL, [(0, 0), (bw * .95, 0), (bw, .02 * S), (bw * .85, .05 * S)], 24, loc=(X, -.005, 0), scale=(1, 1.15))
            toe = sphere('clothShoe', CL, (X, -bl * .5, .03 * S), (bw * .9, bl * .62, .032 * S), 24, 12)
            for v in toe.data.vertices: v.co.z = max(v.co.z, .005 * S) + max(0, -(v.co.y + bl * .9)) * .6
    else:
        shoes(feet, None)

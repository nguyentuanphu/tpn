# More friends for lumi.py (run inside it): Sol (the fourth friend, so there are two boys and two girls), the villagers and the wardrobe.
# Owner, 3 Nov 2026 AEDT: "Làm thêm 1 bạn nam để đủ 2 cặp nam nữ, nhớ thiết kế thêm các phụ kiện liên quan như quần áo mũ nón giày dép etc các kiểu,
# và cho tôi biết dân làng sẽ nhìn như thế nào?"

# ---------- Sol, the sun keeper (owner's concept "Twilight", concept-sol.png): copper curls, a honey cape, a glowing sun crystal ----------
def hair_sol():
    cap(HAIRD)
    for ring, (el, cnt, ln, wd) in enumerate([(1.35, 8, .5, .34), (1.0, 13, .55, .34), (.65, 15, .55, .33), (.3, 15, .5, .31), (-.05, 12, .42, .28)]):
        for k in range(cnt):
            az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.1, .1)
            if front_open(az, el): continue
            clump(az, el + random.uniform(-.06, .06), ln * random.uniform(.85, 1.15), wd, .45, 1.7, (HAIR, HAIRL, HAIRD)[(k + ring) % 3], 1.06)
    for k, az in enumerate([-.72, -.42, -.12, .18, .48, .76]):  # curls over the forehead
        clump(az, 1.05, .55, .3, .25, 1.6, HAIRL if k % 2 else HAIR, 1.05)

def sun(c, r, normal_rot, m):
    c = Vector(c)
    """a felt sun: a round middle and eight short rays"""
    sphere('sun', m, c, (r * .55, r * .55, r * .18), 20, 10, normal_rot)
    q = Euler(normal_rot).to_matrix()
    for i in range(8):
        a = i * math.pi / 4; d = q @ Vector((math.cos(a), math.sin(a), 0))
        sphere('sun', m, c + d * r * .85, (r * .2, r * .2, r * .12), 10, 5, normal_rot)

def body_sol():
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']
    PANTSD = felt('pantsDark', '#5e4434'); TUNIC = felt('tunic', '#f1e4c8'); CAPE = felt('cape', '#d9a441'); GOLDF = felt('sunGold', '#e8b54a', .6, .08)
    legs(PANTSD)
    boots(BOOTF, BAG, b['zSock'] + .03 * S, straps=(.06 * S, .11 * S))
    for s in (-1, 1):  # baggy dark trousers gathered into the boots
        tube('trouser', PANTSD, [(s * b['legX'] * .85, 0, b['zCr'] + .02 * S), (s * b['legX'] * 1.06, -.004, (b['zCr'] + b['zSock']) / 2), (s * b['legX'], 0, b['zSock'] + .035 * S)], [wH * .6, wH * .7, wH * .5], 24)
    lathe('seat', PANTSD, [(wH * .55, b['zCr'] - .035 * S), (wH * .95, b['zCr'] - .005 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
    torso(SHIRT)
    lathe('tunic', TUNIC, [(wH * 1.22, b['zCr'] - .06 * S), (wH * 1.12, b['zCr'] + .02 * S), (wC * 1.09, b['zW'] + .02 * S), (wC * 1.07, b['zC'] - .01 * S)], 36, scale=(1, dep))
    sun((0, fronty(wC * 1.12) - .006, (b['zCr'] + b['zW']) / 2 + .01 * S), .045 * S, (math.pi / 2, 0, 0), GOLDF)
    lathe('belt', BAG, [(wC * 1.1, b['zW'] - .014 * S), (wC * 1.12, b['zW'] + .012 * S)], 32, scale=(1, dep))
    sphere('buckle', BRASS, (0, fronty(wC * 1.12) - .004, b['zW']), (.022 * S, .006 * S, .016 * S), 16, 8)
    # the honey cape over the shoulders, open at the front, a brass clasp and a sun on the back
    lathe('cape', CAPE, [(wC * 1.6, b['zC'] - .18 * S), (wC * 1.42, b['zC'] - .08 * S), (wC * 1.2, b['zS'] - .02 * S), (wC * .86, b['zS'] + .025 * S), (wC * .55, b['zN'])], 40, scale=(1, dep * 1.05), arc=(.42, 2 * math.pi - .42))
    sphere('clasp', BRASS, (0, fronty(wC * .62) - .01, b['zN'] - .03 * S), (.018 * S, .008 * S, .018 * S), 16, 8)
    sun((0, wC * 1.5 * dep + .02, b['zC'] - .09 * S), .05 * S, (-math.pi / 2 - .35, 0, 0), GOLDF)
    def sleeves(s, sh, el, wr):
        rU, rA = B['rU'], B['rA']; e = (wr - el).normalized()
        tube('sleevePuff', SHIRT, [sh, sh.lerp(el, .5), el], [rU * 1.3, rU * 1.35, rU * 1.2], 18)
        tube('sleeve', SHIRT, [el, wr - e * .02 * S], [rA * 1.3, rA * 1.25], 16)
        tube('glove', BAGD, [wr - e * .06 * S, wr + e * .004 * S], [rA * 1.35, rA * 1.3], 14)
    hands = arm_pair(sleeves)
    satchel(-1.0, BAG, BAGD, lambda p, a: sphere('bagBuckle', BRASS, p, (.012 * S, .006 * S, .014 * S), 12, 6, (0, 0, a)), across=False)
    # the glowing sun crystal floating over Sol's left hand, in a ring of rays
    GLOWS = mat('glowSun', '#ffcf6a', .3, emit=6)
    c = hands[1] + Vector((.03 * S, -.05 * S, .085 * S))
    sphere('sunCrystal', GLOWS, c, (.024 * S, .024 * S, .05 * S), 4, 2)
    ring = [c + Vector((math.cos(t) * .06 * S, 0, math.sin(t) * .06 * S)) for t in lin(0, 2 * math.pi, 25)]
    tube('sunRay', BRASS, ring, .003 * S, 8, False)
    for i in range(8):
        a = i * math.pi / 4; d = Vector((math.cos(a), 0, math.sin(a)))
        tube('sunRay', BRASS, [c + d * .065 * S, c + d * .085 * S], [.004 * S, .001 * S], 6)
    glow_light(c + Vector((0, -.04 * S, 0)), .45, '#ffd27a')

# ---------- villagers: Vietnamese and Australian neighbours in everyday clothes, three sizes (owner, 3 Nov) ----------
def sleek(rows=((1.3, 8), (.95, 13), (.55, 14), (.15, 12)), m=None):
    """hair combed back smoothly (the base for buns, ponytails and pigtails)"""
    for ring, (el, cnt) in enumerate(rows):
        for k in range(cnt):
            az = 2 * math.pi * (k + .5 * ring) / cnt
            if front_open(az, el) and el < .9: continue
            clump(az, el, .55, .36, .02, .05, (HAIR, HAIRL)[k % 2], 1.0)

def hair_villager():
    st = V['hair']
    if st != 'tuft': cap(HAIRD)
    if st == 'short':
        for ring, (el, cnt, ln, wd) in enumerate([(1.35, 7, .4, .34), (1.0, 12, .45, .34), (.65, 14, .45, .32), (.3, 14, .4, .3), (-.05, 11, .35, .27)]):
            for k in range(cnt):
                az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.1, .1)
                if front_open(az, el): continue
                clump(az, el + random.uniform(-.05, .05), ln, wd, .2, .5, (HAIR, HAIRL)[k % 2], 1.03)
        for az in (-.6, -.3, 0, .3, .6): clump(az, 1.1, .45, .3, .1, .4, HAIRL, 1.03)
    elif st == 'curly':  # short soft curls
        for ring, (el, cnt) in enumerate([(1.35, 8), (1.0, 13), (.65, 15), (.3, 15), (-.05, 12)]):
            for k in range(cnt):
                az = 2 * math.pi * (k + .5 * ring) / cnt + random.uniform(-.1, .1)
                if front_open(az, el): continue
                clump(az, el, .4, .34, .5, 1.8, (HAIR, HAIRL, HAIRD)[(k + ring) % 3], 1.05)
        for az in (-.6, -.3, 0, .3, .6): clump(az, 1.1, .4, .3, .3, 1.7, HAIRL, 1.04)
    elif st == 'bun':
        sleek()
        sphere('bun', HAIR, H(0, .62, .72), (.36 * R, .32 * R, .32 * R), 24, 12); sphere('bunTie', DRESS, H(0, .42, .72), (.2 * R, .1 * R, .2 * R), 16, 8)
    elif st == 'ponytail':
        sleek()
        sphere('ponyTie', felt('tie', '#e2574c'), H(0, .78, .55), (.16 * R, .12 * R, .16 * R), 16, 8)
        lock(math.pi, .5, 1.5, .42, .5, .1, HAIR, 1.25)
    elif st == 'pigtails':
        sleek()
        for s in (-1, 1):
            sphere('pigTie', felt('tie', '#e2574c'), H(s * .95, .25, .15), (.14 * R, .14 * R, .12 * R), 16, 8)
            lock(s * 1.85, .15, 1.0, .36, .8, .15, HAIR, 1.12)
    elif st == 'long':  # long straight hair to the shoulder blades, a soft fringe
        for ring, (el, cnt) in enumerate([(1.35, 7), (1.0, 12)]):
            for k in range(cnt):
                az = 2 * math.pi * (k + .5 * ring) / cnt
                if front_open(az, el): continue
                clump(az, el, .7, .34, .05, .1, (HAIR, HAIRL)[k % 2], 1.03)
        for ring, (el, cnt, ln) in enumerate([(.7, 12, 2.1), (.35, 13, 2.2), (0, 12, 2.0)]):
            for k in range(cnt):
                az = 2 * math.pi * (k + .5 * ring) / cnt
                if front_open(az, el) or math.cos(az) > .15: continue   # long hair falls behind the shoulders
                lock(az, el, ln, .34, .14, .02, (HAIR, HAIRD, HAIRL)[(k + ring) % 3], 1.05)
        for k, az in enumerate([-.5, -.25, 0, .25, .5]): clump(az, 1.1, .6, .3, .05, .1, (HAIR, HAIRL)[k % 2], 1.03)
    elif st == 'bob':
        for ring, (el, cnt, ln) in enumerate([(.8, 13, .95), (.4, 14, 1.0), (0, 12, .85)]):
            for k in range(cnt):
                az = 2 * math.pi * (k + .5 * ring) / cnt
                if front_open(az, el): continue
                lock(az, el, ln, .34, .12, .05, (HAIR, HAIRD, HAIRL)[(k + ring) % 3], 1.05)
        for k, az in enumerate([-.6, -.3, 0, .3, .6]): clump(az, 1.1, .6, .32, .08, .2, (HAIR, HAIRL)[k % 2], 1.04)
    else:  # tuft: a bald crown with hair round the back and sides
        for k in range(14):
            az = math.pi * .35 + k * math.pi * 1.3 / 13
            clump(az, .05, .3, .3, .3, .6, (HAIR, HAIRL)[k % 2], 1.0)

def body_villager():
    b = B; wH, wC, dep = b['wH'], b['wC'], b['dep']; kind, tk = V['kind'], V['top'][0]
    TOP = felt('top', V['top'][1]); BOT = felt('bottom', V['bottom'])
    legs(SKIN if kind in ('shorts', 'skirt') or tk == 'dress' else BOT)
    if kind in ('pants', 'shorts', 'wide'):
        low = b['zAnk'] + .05 * S if kind != 'shorts' else b['zCuff'] + (.0 if V['size'] == 'kid' else -.03) * S
        r = wH * (.66 if kind == 'wide' else .56)
        for s in (-1, 1):  # trousers (wide and flowing under an áo dài) or shorts
            tube('trouser', BOT, [(s * b['legX'] * .85, 0, b['zCr'] + .02 * S), (s * b['legX'] * 1.05, 0, low)], [r, r * (1.06 if kind == 'wide' else .98)], 24)
        lathe('seat', BOT, [(wH * .55, b['zCr'] - .035 * S), (wH * .95, b['zCr'] - .005 * S), (wH * 1.02, (b['zCr'] + b['zW']) / 2), (wC * 1.03, b['zW'] + .01 * S)], 32, scale=(1, dep))
    elif kind == 'skirt' and tk != 'dress':
        lathe('skirt', BOT, [(wC * 1.05, b['zW'] + .01 * S), (wH * 1.15, b['zCr']), (wH * 1.4, b['zCuff'] + .02 * S), (wH * 1.42, b['zCuff'] + .005 * S)], 36, scale=(1, dep * 1.05))
    torso(TOP)
    if tk in ('aobaba', 'cardigan'):  # a loose top to the hips with buttons down the front
        hem = b['zCr'] - .05 * S
        lathe('aoBaBa', TOP, [(wH * 1.12, hem), (wH * 1.06, hem + .05 * S), (wC * 1.06, b['zW'] + .02 * S), (wC * 1.05, b['zC'] - .01 * S)], 36, scale=(1, dep))
        for z in lin(hem + .04 * S, b['zC'] + .02 * S, 4): sphere('button', felt('buttonCloth', '#f2ead8'), (0, fronty(wC * 1.08) - .004, z), (.008 * S, .004 * S, .008 * S), 10, 5)
    elif tk == 'aodai':  # áo dài: a fitted top with a mandarin collar, long front and back panels split at the sides
        lathe('aoDai', TOP, [(wC * 1.04, b['zW'] - .02 * S), (wC * 1.06, b['zC']), (wC * .85, b['zS'] + .01 * S)], 32, scale=(1, dep))
        for a0, a1 in ((-.95, .95), (math.pi - .95, math.pi + .95)):
            lathe('aoDai', TOP, [(wC * 1.05, b['zW']), (wH * 1.08, b['zCr']), (wH * 1.2, b['zCuff'] - .1 * S), (wH * 1.24, b['zCuff'] - .13 * S)], 28, scale=(1, dep * 1.05), arc=(a0, a1))
        tube('aoDai', TOP, [Vector((math.cos(t) * wC * .5, math.sin(t) * wC * .45, b['zN'] + .005)) for t in lin(0, 2 * math.pi, 21)], .016 * S, 8, False)
    elif tk == 'dress':  # a sundress or a school dress: a bodice and a flared skirt to the knee, a white collar for school
        lathe('dressTop', TOP, [(wC * 1.05, b['zW'] - .02 * S), (wC * 1.07, b['zC']), (wC * .9, b['zS'])], 32, scale=(1, dep))
        lathe('dressSkirt', TOP, [(wC * 1.06, b['zW'] + .01 * S), (wH * 1.15, b['zW'] - .03 * S), (wH * 1.5, b['zCuff'] + .03 * S), (wH * 1.52, b['zCuff'] + .015 * S)], 36, scale=(1, dep * 1.05))
        lathe('dressBelt', felt('dressBelt', V['bottom']), [(wC * 1.07, b['zW'] - .01 * S), (wC * 1.08, b['zW'] + .012 * S)], 32, scale=(1, dep))
    else:  # T-shirt, rash vest, polo or a short-sleeved shirt, worn over the waistband
        lathe('tee', TOP, [(wH * 1.06, b['zW'] - .03 * S), (wC * 1.06, b['zW'] + .02 * S), (wC * 1.05, b['zC'] - .01 * S)], 32, scale=(1, dep))
        if tk in ('polo', 'shirt'):
            for s in (-1, 1): sphere('collar', TOP, (s * .3 * wC, fronty(wC * .55) - .002, b['zN'] - .09 * wC), (.32 * wC, .1 * wC, .2 * wC), 16, 8, (0, s * .3, s * .5))
            for z in (lin(b['zW'] + .03 * S, b['zC'] + .03 * S, 4) if tk == 'shirt' else lin(b['zC'] - .01 * S, b['zC'] + .04 * S, 2)):
                sphere('button', felt('buttonCloth', '#f2ead8'), (0, fronty(wC * 1.08) - .004, z), (.007 * S, .004 * S, .007 * S), 10, 5)
            if tk == 'shirt': sphere('pocket', TOP, (.05 * S, fronty(wC * 1.07) - .004, b['zC'] - .01 * S), (.022 * S, .005 * S, .025 * S), 12, 6)
    if 'apron' in V['extra']:
        AP = felt('apronWhite', '#f6f1e6')
        lathe('apron', AP, [(wH * 1.16, b['zCuff'] - .04 * S), (wH * 1.12, b['zCr']), (wC * 1.1, b['zW'] + .03 * S)], 24, scale=(1, dep * 1.02), arc=(-.75, .75))
        lathe('apron', AP, [(wC * 1.1, b['zW'] - .01 * S), (wC * 1.11, b['zW'] + .012 * S)], 32, scale=(1, dep * 1.02))
    long_sleeves = tk in ('aobaba', 'cardigan', 'aodai')
    def sleeves(s, sh, el, wr):
        rU, rA = B['rU'], B['rA']
        if tk == 'dress' and V['size'] != 'kid': return   # a sundress: bare arms
        if long_sleeves: tube('sleeve', TOP, [sh, el, wr - (wr - el).normalized() * .03 * S], [rU * 1.3, rA * 1.35, rA * 1.3], 18)
        else: tube('sleeve', TOP, [sh, sh.lerp(el, .55)], [rU * 1.35, rU * 1.3], 18)
    hands = arm_pair(sleeves)
    sk, _, sc = V['shoes'].partition('/'); shoes(sk, ('#' + sc) if sc else None)
    if 'basket' in V['extra']:  # a woven basket of greens in the left hand
        h = hands[1]; BK = felt('basket', '#b88b4f')
        lathe('basket', BK, [(.0, -.17 * S), (.07 * S, -.17 * S), (.095 * S, -.1 * S), (.1 * S, -.06 * S)], 24, loc=h)
        tube('basket', BK, [h + Vector((math.sin(t) * .09 * S, 0, -.06 * S + math.cos(t) * .065 * S)) for t in lin(-math.pi / 2, math.pi / 2, 9)], .006 * S, 8, False)
        for k in range(5): sphere('basketGreens', LEAFG, h + Vector((random.uniform(-.05, .05) * S, random.uniform(-.04, .04) * S, -.07 * S)), (.035 * S, .03 * S, .02 * S), 10, 5)
    if 'cane' in V['extra']:
        h = hands[-1]; tube('cane', WOOD, [h + Vector((0, -.01, .03 * S)), h + Vector((-.02 * S, -.06 * S, -h.z + .01))], .011 * S, 10)
        tube('cane', WOOD, [h + Vector((0, -.01, .03 * S)), h + Vector((.03 * S, -.015, .05 * S)), h + Vector((.06 * S, -.01, .03 * S))], .011 * S, 10, False)

# ---------- the wardrobe: shoes, hats, a scarf and accessories, for any friend or villager ----------
SHOE_COL = {'sandals': '#8a5a36', 'sneakers': '#e9edf2', 'rainboots': '#f2c230', 'thongs': '#2f8fd1', 'boots': '#7a4a2a'}
def shoes(kind, col=None):
    bw, bl = B['boot']; M = felt('shoe' + kind + (col or ''), col or SHOE_COL.get(kind, '#8a5a36'), .3 if kind == 'rainboots' else .8, .05)
    WHITE = felt('shoeSole', '#f4f1ea', .7, .03)
    for s in (-1, 1):
        X = s * B['legX']
        if kind in ('sandals', 'thongs'):
            sphere('toes', SKIN, (X, -bl * .38, .035 * S), (bw * .78, bl * .78, .032 * S), 24, 12)
            lathe('sandal', M, [(0, 0), (bw * 1.0, 0), (bw * 1.02, .014 * S), (0, .014 * S)], 24, loc=(X, -bl * .32, 0), scale=(.95, 1.6))
            if kind == 'sandals':
                for y in (-bl * .75, -bl * .25):
                    tube('strapS', M, [(X - bw * .85, y, .016 * S), (X, y, .06 * S), (X + bw * .85, y, .016 * S)], .009 * S, 8, False)
                lathe('strapS', M, [(B['rLeg'] * 1.05, B['zAnk'] - .01), (B['rLeg'] * 1.08, B['zAnk'] + .005)], 20, loc=(X, 0, 0))
            else:  # thongs (flip-flops): a Y strap from between the toes
                tube('thong', WHITE, [(X - bw * .8, -bl * .2, .016 * S), (X, -bl * .85, .055 * S), (X + bw * .8, -bl * .2, .016 * S)], .008 * S, 8, False)
                tube('thong', WHITE, [(X, -bl * .85, .055 * S), (X, -bl * 1.05, .016 * S)], .007 * S, 8, False)
        elif kind == 'sneakers':
            lathe('sneaker', M, [(0, 0), (bw * .95, 0), (bw, .02 * S), (bw * .92, .06 * S), (bw * .7, .075 * S)], 24, loc=(X, -.005, 0), scale=(1, 1.15))
            toe = sphere('sneaker', M, (X, -bl * .45, .035 * S), (bw * .95, bl * .62, .038 * S), 24, 12)
            for v in toe.data.vertices: v.co.z = max(v.co.z, .01 * S)
            front, back = -bl * 1.07 - .006, bw * 1.12
            lathe('sole', WHITE, [(0, 0), (bw * 1.08, 0), (bw * 1.1, .02 * S), (bw * .9, .022 * S)], 24, loc=(X, (front + back) / 2, 0), scale=(1, (back - front) / 2 / (bw * 1.1)))
            sphere('sneakerStripe', felt('stripe', '#e2574c'), (X + s * bw * .96, -.01, .04 * S), (.006 * S, .04 * S, .012 * S), 12, 6)
            for k in range(3): tube('lace', WHITE, [(X - .018 * S, -bw * .8 - k * .012 * S, .07 * S - k * .008 * S), (X + .018 * S, -bw * .8 - k * .012 * S, .07 * S - k * .008 * S)], .004 * S, 6)
        else:  # tall boots: glossy rain boots or leather work boots
            top = B['zSock'] + (.05 if kind == 'rainboots' else -.03) * S
            lathe('rainboot', M, [(0, 0), (bw * .98, 0), (bw * 1.04, .025 * S), (bw * .98, top * .5), (bw * 1.02, top), (bw * .9, top + .004)], 28, loc=(X, -.005, 0), scale=(1, 1.1))
            toe = sphere('rainboot', M, (X, -bl * .45, .042 * S), (bw * .98, bl * .62, .045 * S), 24, 12)
            for v in toe.data.vertices: v.co.z = max(v.co.z, .012 * S)
            front, back = -bl * 1.07 - .006, bw * 1.12
            lathe('sole', SOLE, [(0, 0), (bw * 1.1, 0), (bw * 1.12, .015 * S), (bw * .9, .018 * S)], 24, loc=(X, (front + back) / 2, 0), scale=(1, (back - front) / 2 / (bw * 1.12)))

HAT_COL = {'straw': '#e3c37c', 'nonla': '#eadbb0', 'cap': '#e2574c', 'beanie': '#6f9fd8', 'crown': '#7fae5e', 'akubra': '#8a6142', 'bucket': '#f2c14e', 'helmet': '#d64b4b'}
def hat(kind, col=None):
    k = R * {'lumi': 1.2, 'flora': 1.12, 'sol': 1.08, 'finn': 1.2}.get(WHO, 1.04)   # bigger hair needs a bigger hat
    top = HC + Vector((0, .02 * R, (.55 + {'lumi': .32, 'flora': .12, 'sol': .1, 'finn': .32}.get(WHO, 0)) * R)); M = felt('hat' + kind + (col or ''), col or HAT_COL[kind], .85, .1)
    BAND = felt('hatRibbon', '#c75b4a')
    if kind == 'straw':  # a sun hat with a ribbon (also the broad-brimmed school hat, in navy)
        lathe('hatCrown', M, [(.0, .62 * k), (.42 * k, .6 * k), (.66 * k, .4 * k), (.74 * k, .05 * k)], 32, loc=top)
        lathe('hatBrim', M, [(.7 * k, .06 * k), (1.5 * k, -.1 * k), (1.56 * k, -.14 * k), (1.48 * k, -.12 * k), (.7 * k, .0)], 40, loc=top)
        lathe('hatBand', BAND, [(.745 * k, .06 * k), (.725 * k, .2 * k)], 32, loc=top)
    elif kind == 'akubra':  # the Australian bush hat: a pinched crown and a brim turned up at the sides
        c = lathe('hatCrown', M, [(.0, .7 * k), (.4 * k, .66 * k), (.62 * k, .5 * k), (.72 * k, .06 * k)], 32, loc=top)
        for v in c.data.vertices:
            if v.co.z > top.z + .45 * k: v.co.z -= .14 * k * max(0, 1 - abs(v.co.x - top.x) / (.3 * k))   # the crease along the top
        b_ = lathe('hatBrim', M, [(.7 * k, .07 * k), (1.45 * k, .02 * k), (1.5 * k, .0), (1.42 * k, -.01 * k), (.7 * k, .02 * k)], 40, loc=top)
        for v in b_.data.vertices: v.co.z += .22 * k * (abs(v.co.x - top.x) / (1.5 * k)) ** 2   # sides curl up
        lathe('hatBand', felt('akubraBand', '#3a2a1c'), [(.73 * k, .07 * k), (.71 * k, .17 * k)], 32, loc=top)
    elif kind == 'bucket':  # a soft bucket hat
        lathe('hatCrown', M, [(.0, .55 * k), (.55 * k, .52 * k), (.72 * k, .3 * k), (.78 * k, .02 * k)], 32, loc=top)
        lathe('hatBrim', M, [(.76 * k, .04 * k), (1.12 * k, -.22 * k), (1.15 * k, -.26 * k), (1.08 * k, -.24 * k), (.75 * k, .0)], 40, loc=top)
    elif kind == 'helmet':  # a motorbike half-helmet with a strap (Vietnam)
        top = top + Vector((0, 0, .22 * k))
        d = sphere('helmet', felt('helmet' + (col or ''), col or HAT_COL['helmet'], .3, .02), top + Vector((0, 0, -.15 * k)), (1.0 * k, 1.04 * k, .72 * k), 32, 16)
        for v in d.data.vertices: v.co.z = max(v.co.z, top.z - .3 * k)
        sphere('helmetPeak', felt('helmetPeak', '#2a2a2a', .4, .02), top + Vector((0, -.98 * k, -.22 * k)), (.6 * k, .3 * k, .05 * k), 20, 10, (-.2, 0, 0))
        for s in (-1, 1): tube('helmetStrap', felt('strapBlack', '#2a2a2a'), [top + Vector((s * .92 * k, 0, -.3 * k)), HC + Vector((s * .55 * R, -.3 * R, -.8 * R)), HC + Vector((0, -.5 * R, -1.0 * R))], .022 * R, 8, False)
    elif kind == 'nonla':  # the conical leaf hat, with a chin strap
        lathe('nonLa', M, [(0, .95 * k), (.3 * k, .72 * k), (1.75 * k, -.02 * k), (1.73 * k, -.06 * k), (0, .62 * k)], 48, loc=top + Vector((0, 0, -.05 * R)))
        for s in (-1, 1): tube('nonLaStrap', BAND, [top + Vector((s * .95 * R, 0, -.15 * R)), HC + Vector((s * .6 * R, -.25 * R, -.75 * R)), HC + Vector((0, -.5 * R, -1.0 * R))], .025 * R, 8, False)
    elif kind == 'cap':  # a soft cap with a peak and a felt star
        top = top + Vector((0, 0, .22 * k))
        d = sphere('capDome', M, top + Vector((0, 0, -.12 * k)), (1.0 * k, 1.0 * k, .62 * k), 32, 16)
        for v in d.data.vertices: v.co.z = max(v.co.z, top.z - .14 * k)
        sphere('capPeak', M, top + Vector((0, -.95 * k, -.18 * k)), (.7 * k, .55 * k, .07 * k), 24, 12, (-.15, 0, 0))
        sphere('capButton', M, top + Vector((0, 0, .5 * k)), (.1 * k, .1 * k, .06 * k), 12, 6)
        pstar('capStar', STAR, top + Vector((0, -.86 * k, .1 * k)), .2 * k, .06 * k, (math.pi / 2 - .5, 0, 0))
    elif kind == 'beanie':  # a knitted beanie with a folded cuff and a pompom
        top = top + Vector((0, 0, .15 * k))
        d = sphere('beanie', M, top + Vector((0, 0, -.1 * k)), (.98 * k, .98 * k, .78 * k), 32, 16)
        for v in d.data.vertices: v.co.z = max(v.co.z, top.z - .3 * k)
        lathe('beanieCuff', M, [(.98 * k, -.34 * k), (1.04 * k, -.25 * k), (1.03 * k, -.08 * k), (.96 * k, -.04 * k)], 36, loc=top)
        sphere('pompom', felt('pompom', '#f4efe4'), top + Vector((0, 0, .72 * k)), (.26 * k, .26 * k, .24 * k), 16, 8)
    else:  # crown: a ring of little flowers on a vine
        ring = [top + Vector((math.cos(t) * .88 * k, math.sin(t) * .86 * k, -.1 * k)) for t in lin(0, 2 * math.pi, 33)]
        tube('crownVine', LEAFG, ring, .04 * k, 8, False)
        cols = ['#f6a5b6', '#fbeee6', '#f2c94f', '#c9b5e0']
        for i in range(9):
            t = i * 2 * math.pi / 9; c = top + Vector((math.cos(t) * .9 * k, math.sin(t) * .88 * k, -.04 * k))
            for j in range(5):
                a = j * 2 * math.pi / 5; sphere('crownPetal', felt('crownPetal' + str(i % 4), cols[i % 4]), c + Vector((math.cos(a) * .09 * k, math.sin(a) * .09 * k, .02 * k)), (.08 * k, .08 * k, .04 * k), 10, 5)
            sphere('crownHeart', STAR, c + Vector((0, 0, .05 * k)), (.04 * k, .04 * k, .03 * k), 8, 4)

def scarf(col):
    M = felt('scarf' + (col or ''), col or '#d8644a'); b = B
    ring = [Vector((math.cos(t) * b['wC'] * .62, math.sin(t) * b['wC'] * .55, b['zN'] - .025 * S)) for t in lin(0, 2 * math.pi, 25)]
    tube('scarf', M, ring, .03 * S, 12, False)
    tube('scarf', M, [Vector((.05 * S, fronty(b['wC'] * .6), b['zN'] - .04 * S)), Vector((.07 * S, fronty(b['wC'] * 1.05), b['zC'] - .02 * S)), Vector((.075 * S, fronty(b['wC'] * 1.1), b['zC'] - .1 * S))], [(.028 * S, .012 * S)] * 3, 10)

# accessories: girls (bow, headband, earrings, necklace, pearls, bracelet), boys (bowtie, watch, backpack works for all), anyone (sunglasses, glasses, red scarf, freckles, moustache, long socks, flower clip)
HEAD_ACC = ('bow', 'headband', 'earrings', 'sunglasses', 'glasses', 'freckles', 'moustache', 'flowerclip', 'stubble')
def acc(name, col=None):
    b = B; C = lambda d: felt('acc' + name + (col or d), col or d)
    puff = {'lumi': .32, 'flora': .12, 'sol': .1, 'finn': .2}.get(WHO, 0)
    if name == 'bow':  # a big felt bow high on the left of the hair
        c = HC + Vector((.62, -.48, .62)).normalized() * R * (1.22 + puff); M = C('#ef6f8e')
        for s in (-1, 1): sphere('bow', M, c + Vector((s * .25 * R, -.02 * R, .03 * R)), (.26 * R, .11 * R, .19 * R), 16, 8, (0, s * .35, 0))
        sphere('bowKnot', M, c + Vector((0, -.03 * R, 0)), (.08 * R, .08 * R, .09 * R), 12, 6)
    elif name == 'headband':
        M = C('#ef6f8e'); k = 1.06 + puff
        tube('headband', M, [HC + Vector((math.cos(t) * k * R, -math.sin(t) * .25 * R - .2 * R, math.sin(t) * k * R * .95 + .1 * R)) for t in lin(.05 * math.pi, .95 * math.pi, 17)], .045 * R, 10)
    elif name == 'earrings':
        for s in (-1, 1):
            p = H(s * .99, -.04, -.35); tube('earring', GLOW if col == 'glow' else BRASS, [p + Vector((0, 0, .04 * R)), p], .015 * R, 6)
            pstar('earring', STAR, p - Vector((0, .01 * R, .07 * R)), .08 * R, .03 * R, (math.pi / 2, 0, 0), lv=1)
    elif name in ('glasses', 'sunglasses'):
        GL = mat('glassesRim' + name, '#6b4a36' if name == 'glasses' else '#2a2a2a', .4, metal=.3)
        for s in (-1, 1):
            ex, ez, w = s * P['eyeX'], P['eyeZ'], P['eye'] * 1.35
            if name == 'sunglasses': decal('lens', mat('lensDark', '#2b2f3a', .15), ex, ez, w * 1.02, w * .85, .02, .085)
            fline('glasses', GL, [(ex + math.cos(a) * w, ez + math.sin(a) * w * .85) for a in lin(0, 2 * math.pi, 25)], [.014] * 25, .1)
        fline('glasses', GL, [(-P['eyeX'] + P['eye'] * 1.35, P['eyeZ']), (P['eyeX'] - P['eye'] * 1.35, P['eyeZ'])], [.014, .014], .12)
    elif name == 'freckles':
        F = softpaint('freckle', '#c98a62', .8)
        for s in (-1, 1):
            for (x, z) in ((.38, -.3), (.46, -.27), (.42, -.37), (.52, -.33), (.33, -.36)): decal('freckle', F, s * x, z, .025, .025, .006, .006)
    elif name == 'stubble':
        decal('stubble', softpaint('stubble', '#6b5a50', .3), 0, -.68, .55, .3, .01, .006)
    elif name == 'moustache':
        for s in (-1, 1): fline('moustache', HAIRL, [(s * .02, -.4), (s * .12, -.43), (s * .2, -.48)], [.04, .045, .02], .04)
    elif name == 'flowerclip':
        c = H(-.55, -.62, .62 + puff * .5)
        for i in range(5):
            a = i * 2 * math.pi / 5; sphere('petal', C('#f6a5b6'), c + Vector((math.cos(a) * .1 * R, -.05 * R, math.sin(a) * .1 * R)), (.09 * R, .05 * R, .09 * R), 12, 6)
        sphere('flowerHeart', STAR, c + Vector((0, -.08 * R, 0)), (.05 * R, .04 * R, .05 * R), 10, 5)
    elif name in ('necklace', 'pearls'):
        M = mat('pearl', '#f6f1ea', .25) if name == 'pearls' else C('#ef6f8e')
        for t in lin(0, 2 * math.pi, 19)[:-1]:
            sphere('necklace', M, (math.sin(t) * b['wC'] * .66, -math.cos(t) * b['wC'] * .58 - .004, b['zN'] - .03 * S - .03 * S * max(0, math.cos(t))), (.011 * S,) * 3, 8, 4)
    elif name == 'bowtie':
        M = C('#e2574c'); c = Vector((0, fronty(b['wC'] * .55) - .006, b['zN'] - .02 * S))
        for s in (-1, 1): sphere('bowtie', M, c + Vector((s * .022 * S, 0, 0)), (.024 * S, .008 * S, .016 * S), 12, 6, (0, s * .3, 0))
        sphere('bowtie', M, c + Vector((0, -.004, 0)), (.009 * S, .008 * S, .01 * S), 8, 4)
    elif name == 'redscarf':  # khăn quàng đỏ, the Young Pioneers' red scarf of Vietnamese school children
        M = C('#d9382f'); ring = [Vector((math.cos(t) * b['wC'] * .6, math.sin(t) * b['wC'] * .52, b['zN'] - .02 * S)) for t in lin(0, 2 * math.pi, 25)]
        tube('redScarf', M, ring, .016 * S, 8, False)
        kn = Vector((0, fronty(b['wC'] * .62) - .008, b['zN'] - .035 * S)); sphere('redScarf', M, kn, (.016 * S, .012 * S, .016 * S), 10, 5)
        for s in (-1, 1): tube('redScarf', M, [kn, kn + Vector((s * .03 * S, -.004, -.06 * S))], [(.016 * S, .005 * S), (.006 * S, .003 * S)], 8)
    elif name == 'backpack':
        M = C('#4f86c6'); c = Vector((0, b['wC'] * b['dep'] + .045 * S, (b['zW'] + b['zC']) / 2 + .02 * S))
        o = sphere('backpack', M, c, (.1 * S, .05 * S, .12 * S), 24, 12)
        sphere('backpack', felt('packPocket', '#f2c14e'), c + Vector((0, .045 * S, -.04 * S)), (.07 * S, .02 * S, .05 * S), 16, 8)
        for s in (-1, 1): tube('backpack', felt('packStrap', '#2c3a5a'), [c + Vector((s * .06 * S, -.03 * S, .1 * S)), Vector((s * .07 * S, -.02 * S, b['zS'] + .012 * S)), Vector((s * .08 * S, fronty(b['wC']) - .006, b['zC'] - .02 * S)), Vector((s * .1 * S, -.01 * S, b['zW']))], .009 * S, 8, False)
    elif name == 'watch':
        wr = Vector(B['wr']); el = Vector(B['el']); e = (wr - el).normalized(); c = wr - e * .035 * S
        tube('watch', felt('watchBand', col or '#2c3a5a'), [c - e * .008 * S, c + e * .008 * S], B['rA'] * 1.12, 16)
        sphere('watchFace', mat('watchFace', '#f4f1ea', .3), c + Vector((.0, -B['rA'] * 1.05, 0)), (.014 * S, .005 * S, .014 * S), 12, 6)
    elif name == 'bracelet':
        wr = Vector((-B['wr'][0], B['wr'][1], B['wr'][2])); el = Vector((-B['el'][0], B['el'][1], B['el'][2])); e = (wr - el).normalized(); c = wr - e * .03 * S
        for t in lin(0, 2 * math.pi, 11)[:-1]:
            x = Vector((1, 0, 0)).cross(e).normalized(); y = e.cross(x)
            sphere('bracelet', C(['#ef6f8e', '#f2c94f', '#6f9fd8'][int(t * 3) % 3]), c + (x * math.cos(t) + y * math.sin(t)) * B['rA'] * 1.1, (.008 * S,) * 3, 8, 4)
    elif name == 'longsocks':  # knee-high socks (an Aussie grandpa classic)
        for s in (-1, 1): tube('longSock', C('#f4f1ea'), [(s * B['legX'], 0, B['zAnk']), (s * B['legX'], 0, B['zCuff'] - .1 * S)], B['rLeg'] * 1.08, 16)

BOOT_PARTS = ('boot', 'bootToe', 'sole', 'bootCuff', 'bootLeaf', 'bootStrap', 'bootBuckle', 'lace', 'sock', 'sockRib')
def wear():
    if WEAR.get('shoes') and WHO != 'villager':
        for o in [o for o in bpy.data.objects if o.type == 'MESH' and o.name.split('.')[0] in BOOT_PARTS]: bpy.data.objects.remove(o)
        sk, _, sc = WEAR['shoes'].partition('/'); group('shoes', lambda: shoes(sk, ('#' + sc) if sc else None))
    if WEAR.get('hat'):
        hk, _, hc = WEAR['hat'].partition('/'); group('hat', lambda: hat(hk, ('#' + hc) if hc else None))
    if 'scarf' in WEAR: group('scarf', lambda: scarf(('#' + WEAR['scarf']) if len(WEAR['scarf']) == 6 else None))
    names = [n for n in WEAR if n not in ('shoes', 'hat', 'scarf')] + [n for n in (V['extra'] if V else ()) if n not in ('basket', 'cane', 'apron')]
    for n in names:
        nm, _, c = n.partition('/'); c = c or (WEAR.get(n) if WEAR.get(n) and len(WEAR.get(n)) == 6 else '')
        group('hat' if nm in HEAD_ACC else 'acc', lambda nm=nm, c=c: acc(nm, ('#' + c) if c else None))

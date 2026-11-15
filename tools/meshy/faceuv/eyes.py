# Steps 2 and 3 of the face-UV face: the eye-free skin (made once) and the mood faces drawn on the baked face picture.
#   python eyes.py <bakedir> [model.json]   (reads face-bake.png, face-mask.png, face-mark.png, band.npz, cfg.json;
#   writes face-noeyes.png, face-underskin.png, mood-<k>.png, eye-*.png, eyes.json with what was found and the warnings)
# Nothing here is a model's own number: the eyes are looked for inside the model's eye_boxes, every colour test is
# relative to the model's own skin beside the eyes, hair is the skin mark's hair, and pixel sizes follow the picture's
# width (K = W / 1024; bake.py lays every model's face out alike). A model that needs a number gets it in models.json
# ("eyes": {...}, with the reason).
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__)); from img import *
D = sys.argv[1]; F = load(os.path.join(D, 'face-bake.png'))[..., :3]; ISL = load(os.path.join(D, 'face-mask.png'))[..., 0] > .5
MRK = load(os.path.join(D, 'face-mark.png'))[..., :3]; CFG = json.load(open(os.path.join(D, 'cfg.json'))); Z = np.load(os.path.join(D, 'band.npz')); XM = Z['xm']
PRM = dict(white_s=.5, white_v=.75, dark_v=.45, feat_d=.10, feat_v=.72, lash=[.20, .11, .07])
if len(sys.argv) > 2 and os.path.exists(sys.argv[2]): PRM.update(json.load(open(sys.argv[2])).get('eyes', {}))
H, W = F.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]; K = W / 1024.; WARN = []
def px(n): return max(1, int(round(n * K)))          # a length given in the 1024-wide picture's pixels
def bl(a, n): return blur(a, max(1, int(round(n * K * K))))   # n blur passes at 1024 (the spread grows with the root of the passes)
def flood(seed, through):
    prev = -1
    while True:
        seed = seed | (dilate(seed, 1) & through); s_ = int(seed.sum())
        if s_ == prev: return seed
        prev = s_
S, V = hsv(F)
YM = CFG['Y1'] - (yy + .5) / H * (CFG['Y1'] - CFG['Y0']); EB = CFG['eye_boxes']
# hair: the skin mark's hair (red 0); in the mark's mixed border triangles, whatever is nearer the hair's colour than the skin's
_hm = ISL & (MRK[..., 0] < .5); HAIRC = np.median(F[_hm], 0) if _hm.sum() > 50 else None
# 1. the eyes. Each is looked for inside its eye_box (model metres, from the fit: the painted eye plus a margin, out to
# the face's middle): the skin is the median colour beside it; "not skin" is measured against that skin; the eye is the
# not-skin patch in the box with the most eye white (or, with almost no white, the largest dark one that is not at the
# box's top: a brow), with everything not skin joined to it (white, iris, pupil, lashes, outline).
EYE = np.zeros((H, W), bool); RAW = np.zeros((H, W), bool); INNER = np.zeros((H, W), bool); white = np.zeros((H, W), bool); HAIR = np.zeros((H, W), bool); COMP = np.zeros((H, W), bool)
INFO = []   # per eye: None, or dict(c, box, skin, Vs, Ss, white_px, hair_px)
band = ISL & (yy > H * .2) & (yy < H * .72) & (xx > W * .06) & (xx < W * .94)
for e in (0, 4):
    n_ = e // 4; reg = ISL & (XM >= EB[e]) & (XM <= EB[e + 1]) & (YM >= EB[e + 2]) & (YM <= EB[e + 3])
    if reg.sum() < 400 * K * K: WARN.append('eye %d: its eye_box is not on the face picture' % n_); INFO.append(None); continue
    near = dilate(reg, px(24)) & ISL & (MRK[..., 0] > .95)
    skin = np.median(F[near], 0); skin = np.median(F[near & (np.abs(F - skin).max(-1) < .12)], 0); Vs = float(skin.max()); Ss = float(hsv(skin[None])[0][0])
    hair = _hm.copy()
    if HAIRC is not None: hair |= ISL & (MRK[..., 0] < .95) & (np.abs(F - HAIRC).max(-1) < np.abs(F - skin).max(-1))
    d = np.abs(F - skin).max(-1) / Vs; feat = band & ~hair & ((d > PRM['feat_d']) | (V < PRM['feat_v'] * Vs))
    wh = feat & (S < PRM['white_s'] * Ss) & (V > PRM['white_v'] * Vs); dk = feat & (V < PRM['dark_v'] * Vs)
    ry = np.nonzero(reg)[0]; by0, by1 = ry.min(), ry.max()
    cand = flood(reg & (wh | dk), feat & dilate(reg, px(30))); best = None; left = cand.copy()
    while left.any():
        y_, x_ = np.argwhere(left)[0]; one = np.zeros_like(left); one[y_, x_] = True; one = flood(one, cand); left &= ~one
        a_ = int(one.sum())
        if a_ < 300 * K * K: continue
        cy_ = np.nonzero(one)[0].mean(); w_ = int((one & wh).sum()); top = (cy_ - by0) / max(by1 - by0, 1) < .22
        sc = a_ * (1 + 4. * w_ / a_) * (.2 if top and w_ < 100 * K * K else 1)
        if best is None or sc > best[0]: best = (sc, one, w_)
    if best is None: WARN.append('eye %d: eye not found in its eye_box' % n_); INFO.append(None); continue
    # (Finn) a lock of the fringe painted on the face, as dark as the lashes and touching them, is skin in the mark (the
    # fit keeps every dark triangle in an eye area as eye): the eye ran up the lock. Hair is also whatever has the hair's
    # colour (nearer it than the skin's) and hangs together with the mark's hair or comes down from above the eye_box, above the eye's middle and not within 16 px of the box round the
    # eye's white (the lash line there is the eye's own).
    if HAIRC is not None:
        core = best[1] & wh; cyc = by1   # the eye's white and what lies between its ends: the box round the white
        if core.any():   # (its large patches only: a lock's pale highlight is white too)
            ws_ = []; left = core.copy()
            while left.any():
                y_, x_ = np.argwhere(left)[0]; one = np.zeros_like(left); one[y_, x_] = True; one = flood(one, left); left &= ~one; ws_.append(one)
            big = max(int(w.sum()) for w in ws_); core = np.zeros_like(core)
            for w in ws_:
                if w.sum() >= .15 * big: core |= w
        if core.any(): wy_, wx_ = np.nonzero(core); ex_ = .6 * (wy_.max() - wy_.min()); core = (xx >= wx_.min() - ex_) & (xx <= wx_.max() + ex_) & (yy >= wy_.min()) & (yy <= wy_.max()); cyc = (wy_.min() + wy_.max()) / 2.   # (.6 of its height wider at each end: an iris at the eye's corner has no white beyond it)
        zone = ~dilate(core, px(16)) & (yy < cyc); ns = ~hair & ((d > PRM['feat_d']) | (V < PRM['feat_v'] * Vs) | ~ISL) & zone; hc = ns & ((np.abs(F - HAIRC).max(-1) < np.abs(F - skin).max(-1)) | ~ISL)   # (gaps in the island, where a lock folds over itself, do not part it)
        grown = flood((dilate(_hm, 2) | (yy <= by0 + px(2))) & hc, hc)   # (it comes from the mark's hair, or from above the eye_box)
        for _ in range(3): grown = flood(grown | (dilate(grown, px(6)) & ns), hc | grown)   # (and the lock's pale highlights, and strands they part from the rest)
        hair |= grown; feat &= ~hair
        if os.environ.get('FACEUV_DEBUG'): save(os.path.join(D, 'dbg-hair-%d.png' % n_), np.stack([core | dilate(_hm, 2) & hc, ns, grown], -1).astype(np.float32))   # red: the eye's core (and seeds), green: not skin, blue: found hair
    comp = flood(best[1] & wh & ~hair, feat & dilate(reg, px(6)))   # (never beyond its eye_box: a brow touching the lashes would join it)
    if best[2] < 150 * K * K: WARN.append('eye %d: almost no eye white (%d px): glances and the half lid may be poor' % (n_, best[2]))
    ys, xs = np.nonzero(comp); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max(); cx, cy = float(np.median(xs)), float(np.median(ys))
    if (x1 - x0) > 330 * K or (y1 - y0) > 230 * K: WARN.append('eye %d: the eye patch is very large (%d x %d px at 1024): it may have run into a brow, blush or hair' % (n_, (x1 - x0) / K, (y1 - y0) / K))
    # holes inside it (highlights) are eye too: flood the outside of its box
    roi = (xx >= x0 - 2) & (xx <= x1 + 2) & (yy >= y0 - 2) & (yy <= y1 + 2)
    reach = flood(~roi, ~comp)
    INNER |= ~reach   # the eye itself, inside its painted outline's outer edge
    m = dilate(~reach, px(6))
    # the pale halo painted round the outline (lighter, less saturated than the skin) is part of the eye too
    halo = dilate(m, px(14)) & ~m & band & ((V > Vs + .03) | (S < Ss - .06))
    # stray lash flicks and outline ends near the eye, not joined to it (never above its top: the brows)
    flick = dilate(m, px(20)) & band & (((V < .8 * Vs) & (d > .14) & (yy >= y0 - px(4))) | ((V < .95 * Vs) & (d > .06) & (yy >= y0 - px(22))))   # (and the faint lid crease painted above it: half faded it left a smudge)
    m = dilate(m | halo | flick, px(4))
    # hair in or over the eye stays hair: it is never part of the hole (a fringe would be wiped to skin)
    hov = int((m & hair).sum())
    if hov > .02 * m.sum(): WARN.append('eye %d: hair over eye (%d%% of the eye area is hair and stays as painted)' % (n_, round(100. * hov / m.sum())))
    COMP |= comp; RAW |= m; EYE |= m & ~hair; HAIR |= hair & dilate(m, px(40)); white |= wh & comp
    INFO.append(dict(c=[cx, cy], box=[int(x0), int(y0), int(x1), int(y1)], skin=[float(x) for x in skin], Vs=Vs, Ss=Ss, white_px=best[2], hair_px=hov, mask_px=int(m.sum())))
    print('eye', n_, 'at', cx, cy, 'box', INFO[-1]['box'], 'mask px', int(m.sum()), 'white px', best[2], 'hair px', hov, 'skin', skin.round(3))
# 2. the eye-free skin: one smooth rounded hole per eye (the eye, its outline and pale halo, rounded off: a ragged
# hole edge showed as a ragged pale shape), filled smoothly (Laplace, coarse to fine) from the skin round it, plus the
# skin's own fine grain; the fill fades into the painted skin over the outer part of the hole, no edge.
# Hair is never in the hole and never a source of the fill.
hole = (bl(RAW.astype(np.float32), 12) > .08) & ~HAIR
hole = flood(hole & COMP, hole)   # (only the eye's own hole: not the specks of skin showing between the strands of a lock beside it)
core = (bl(RAW.astype(np.float32), 4) > .5) & hole
full = bl(RAW.astype(np.float32), 12) > .08; full = flood(full & COMP, full)   # the eye's whole hole, the part under hair too (build.py: the surface under a lock)
save(os.path.join(D, 'eye-hole-full.png'), full.astype(np.float32)); save(os.path.join(D, 'eye-hole.png'), hole.astype(np.float32)); save(os.path.join(D, 'eye-hair.png'), HAIR.astype(np.float32))
# the skin as it would be with neither the eye nor the hair there: the fill, and the colour of the surface under a fringe
DARK = np.zeros((H, W), bool)   # (Mai: hair beside the eye that the mark calls skin gave the lid a dark smear) nothing dark beside the hole is a source either
for info in INFO:
    if info is not None: DARK |= (V < PRM['feat_v'] * info['Vs'])
under = harmonic(F.copy(), dilate(hole | ((HAIR | DARK | ~ISL) & dilate(hole, px(30))), 2))
save(os.path.join(D, 'face-underskin.png'), under); fill = under.copy()
ringm = dilate(hole, px(16)) & ~dilate(hole, px(3)) & ISL & ~HAIR
hp = F - bl(F, 6); g_std = hp[ringm].std(0) if ringm.sum() > 50 else np.zeros(3)
rng = np.random.default_rng(7); nz = rng.standard_normal(F.shape).astype(np.float32); nz = nz - bl(nz, 6)
if hole.any(): nz = nz / (nz[hole].std(0) + 1e-6) * g_std; fill[hole] += nz[hole]
# alpha: 1 on the eye and its halo, falling to 0 at the hole's rim
a_ = core.astype(np.float32)
for _ in range(px(10)): a_ = np.maximum(a_, (np.roll(a_, 1, 0) + np.roll(a_, -1, 0) + np.roll(a_, 1, 1) + np.roll(a_, -1, 1)) / 4 * .93)
a_ = np.clip(a_ * hole, 0, 1); a_ = bl(a_, 2) * hole
soft = a_[..., None]
NO = F * (1 - soft) + fill * soft
EYE = core
save(os.path.join(D, 'face-noeyes.png'), NO); save(os.path.join(D, 'eye-mask.png'), EYE.astype(np.float32))
print('grain std', g_std)
# 3. the moods, drawn on the baked face picture itself (the head's real surface colour, so every view matches)
LASH = np.array(PRM['lash'])
LW = 4.1 * 2.13 * K   # the old pieces' lash: 4.1 mm half-width on Sol (fit_people.py lw at 1.49 px/mm), in this picture's px
def arc(b, yf, bend, n=32, x0=.08, x1=.92):
    w_, h_ = b[2] - b[0], b[3] - b[1]
    return [(b[0] + w_ * (x0 + (x1 - x0) * t), b[1] + h_ * yf + bend * h_ * (1 - (2 * t - 1) ** 2)) for t in np.linspace(0, 1, n)]
M = {}
for k in ('smile', 'sad', 'surprised'): M[k] = F.copy()   # open eyes: the eyes as painted
# eye geometry from the white: the opening box (white and iris), the iris disc
ew = np.median(F[white], 0) if white.any() else np.ones(3); OPEN = []
for i, info in enumerate(INFO):
    if info is None: OPEN.append(None); continue
    side = (xx < W / 2) if i == 0 else (xx >= W / 2); Vs, Ss = info['Vs'], info['Ss']; inner = INNER & side
    wm = white & side & EYE
    iy, ix = np.nonzero(inner); fb = [int(ix.min()) + px(10), int(iy.min()) + px(12), int(ix.max()) - px(10), int(iy.max()) - px(8)]   # (without a white: the outline's box, a little in)
    if wm.sum() < 150 * K * K:   # no usable white: the shut moods use the outline's box; glances and half stay as painted
        OPEN.append(dict(box=fb, opening=None)); continue
    wy = np.nonzero(wm)[0]; wy0, wy1 = np.percentile(wy, 2), np.percentile(wy, 98)
    cand = EYE & side & ~dilate(white, 1) & (V < .85 * Vs) & (S > .25) & (yy > wy0 + px(4)) & (yy < wy1 - px(4))
    if cand.sum() < 200 * K * K: cand = EYE & side & ~dilate(white, 1) & (V < .5 * Vs) & (yy > wy0 + px(4)) & (yy < wy1 - px(4))   # (an iris with no colour: the dark disc)
    if cand.sum() < 50 * K * K: WARN.append('eye %d: iris not found: glances and the half lid stay as painted' % i); OPEN.append(dict(box=fb, opening=None)); continue
    ys, xs = np.nonzero(cand); icx, icy = np.median(xs), np.median(ys)
    for _ in range(3):   # re-centre on the pixels within the disc (no lash ends at the sides)
        r_ = np.sqrt(((np.hypot(xs - icx, ys - icy) < 70 * K)).sum() / np.pi); sel = np.hypot(xs - icx, ys - icy) < r_ * 1.05; icx, icy = xs[sel].mean(), ys[sel].mean()
    # the opening: the white and the iris inside the painted outline, filled row by row and column by column (no
    # notches). The outline's thickness is measured where the white meets it (beside the iris), above and below, and
    # taken off the eye in every column: where the iris touches the lash line, the lash stays lash (it turned white when
    # the iris moved away). The soft pale rim of white at an open corner (no outline there) is white too, or it stayed
    # behind as a smear beside the new even white.
    pure = wm & (S < .25 * Ss) & (V > .88 * Vs)   # (the pale pink halo is not the white)
    cols = np.nonzero(inner.any(0))[0]; it = np.full(W, 1e9); ib = np.full(W, -1e9)
    for x in cols: ys_ = np.nonzero(inner[:, x])[0]; it[x], ib[x] = ys_.min(), ys_.max()
    wc = [x for x in cols if pure[:, x].sum() > 3 and abs(x - icx) > r_ * 1.1]
    tt = float(np.median([np.nonzero(pure[:, x])[0].min() - it[x] for x in wc])) if wc else 8 * K; tb = float(np.median([ib[x] - np.nonzero(pure[:, x])[0].max() for x in wc])) if wc else 5 * K
    tt, tb = min(max(tt, 4 * K), 14 * K), min(max(tb, 2 * K), 10 * K)
    er = inner & (yy >= it[None, :] + tt) & (yy <= ib[None, :] - tb)
    for _ in range(px(3)): er = er & np.roll(er, 1, 1) & np.roll(er, -1, 1)
    rimw = dilate(pure, px(10)) & (S < .64 * Ss) & (V > .8 * Vs) & inner
    seed = (pure | rimw | (np.hypot(xx - icx, yy - icy) < r_)) & er; opening = np.zeros_like(seed)
    for y in np.nonzero(seed.any(1))[0]: xs_ = np.nonzero(seed[y])[0]; opening[y, xs_.min():xs_.max() + 1] = True
    o2 = np.zeros_like(seed)
    for x in np.nonzero(opening.any(0))[0]: ys_ = np.nonzero(opening[:, x])[0]; o2[ys_.min():ys_.max() + 1, x] = True
    opening = o2 & er
    if opening.sum() < 400 * K * K: WARN.append('eye %d: the eye opening is too small to draw glances' % i); OPEN.append(dict(box=fb, opening=None)); continue
    print('outline thickness top', tt, 'bottom', tb)
    wrow = np.array([np.median(F[y][wm[y]], 0) if wm[y].sum() > 2 else ew for y in range(H)])   # the white's own shade per row
    r_ *= 1.12
    ox = np.nonzero(opening)[1]; oy = np.nonzero(opening)[0]
    OPEN.append(dict(icx=float(icx), icy=float(icy), r=float(r_), box=[int(ox.min()), int(oy.min()), int(ox.max()), int(oy.max())], opening=opening, wrow=wrow))
    print('iris', i, round(icx), round(icy), 'r', round(r_), 'opening box', OPEN[-1]['box'])
def look(dxf):
    im = F.copy()
    for o in OPEN:
        if o is None or o['opening'] is None: continue
        b = o['box']; dx = int(round((b[2] - b[0]) * dxf)); op = o['opening']
        sx = np.clip(xx - dx, 0, W - 1); d_ = np.hypot(xx - dx - o['icx'], yy - o['icy'])
        a = np.clip(o['r'] - d_ + .5, 0, 1)[..., None]   # the moved iris, soft edged
        new = o['wrow'][yy] * (1 - a) + F[yy, sx] * a
        e = bl(op.astype(np.float32), 2)[..., None]   # soft against the lash line and the skin
        im = im * (1 - e) + new * e
    return im
M['lookL'] = look(.16); M['lookR'] = look(-.16)
def shut_eyes(bend, yf):
    im = NO.copy()
    for o in OPEN:
        if o is None: continue
        stroke(im, arc(o['box'], yf, bend), LASH, LW)
    im[HAIR] = F[HAIR]   # (a lash stroke never over hair)
    return im
M['blink'] = shut_eyes(.16, .62)
M['happy'] = shut_eyes(-.32, .70)
M['excited'] = M['happy'].copy()
# half: the upper lid down to the middle of the opening, its edge a lash line from one corner of the eye to the other;
# below it the eye as painted. Inside the eye the lid ends sharply under the lash line; beside the eye (its pale halo)
# it fades out over 20 px (a straight cut edge showed there, beyond both corners)
im = F.copy()
for i, o in enumerate(OPEN):
    if o is None or o['opening'] is None: continue
    b = o['box']; h_ = b[3] - b[1]; w_ = b[2] - b[0]; side = (xx < W / 2) if i == 0 else (xx >= W / 2); inner = INNER & side
    t = np.clip((xx - b[0]) / max(w_, 1), 0, 1); edge = b[1] + h_ * .5 + .06 * h_ * (1 - (2 * t - 1) ** 2)
    ins = dilate(inner, px(2)); sharp = np.clip(edge + 1 - yy, 0, 1); fade = np.clip((edge + px(4) - yy) / (20 * K), 0, 1)
    wgt = bl(ins.astype(np.float32), 3)   # 1 in the eye, 0 beside it
    a = (sharp * wgt + fade * (1 - wgt))[..., None] * soft * side[..., None]
    im = im * (1 - a) + NO * a
    row = int(round(b[1] + h_ * .5 + .03 * h_)); xs_ = np.nonzero(inner[row])[0]
    if len(xs_) < px(40): continue
    xl, xr = xs_.min() + px(12), xs_.max() - px(12)
    stroke(im, [(xl + (xr - xl) * q, b[1] + h_ * .5 + .06 * h_ * (1 - (2 * np.clip((xl + (xr - xl) * q - b[0]) / max(w_, 1), 0, 1) - 1) ** 2)) for q in np.linspace(0, 1, 32)], LASH, LW * .8)
im[HAIR] = F[HAIR]
M['half'] = im
for k, v in M.items(): save(os.path.join(D, 'mood-%s.png' % k), v)
r0, r1, c0, c1 = int(H * .28), int(H * .64), int(W * .1), int(W * .9)
sheet = np.concatenate([np.concatenate([M[k][r0:r1, c0:c1] for k in row], 1) for row in (('smile', 'blink', 'half'), ('happy', 'lookL', 'lookR'), ('sad', 'surprised', 'excited'))], 0)
save(os.path.join(D, 'moods-sheet.png'), sheet)
json.dump({'eyes': [None if x is None else dict(x, opening=(None if OPEN[i] is None or OPEN[i]['opening'] is None else OPEN[i]['box']), iris=(None if OPEN[i] is None or OPEN[i]['opening'] is None else [OPEN[i]['icx'], OPEN[i]['icy'], OPEN[i]['r']])) for i, x in enumerate(INFO)],
           'found': [x is not None for x in INFO], 'hole_px': int(hole.sum()), 'hair_colour': None if HAIRC is None else [float(x) for x in HAIRC], 'warnings': WARN, 'params': PRM}, open(os.path.join(D, 'eyes.json'), 'w'), indent=1)
for w_ in WARN: print('WARNING', w_)

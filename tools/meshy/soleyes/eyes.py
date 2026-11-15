# Steps 2 and 3 of the sol-eyes face: the eye-free skin (made once) and the mood faces drawn on the baked face picture.
#   python eyes.py <bakedir>   (reads face-bake.png, face-mask.png; writes face-noeyes.png, mood-<k>.png, eye-*.png)
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__)); from img import *
D = sys.argv[1]; F = load(os.path.join(D, 'face-bake.png'))[..., :3]; ISL = load(os.path.join(D, 'face-mask.png'))[..., 0] > .5
H, W = F.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
S, V = hsv(F)
# 1. the eyes: the bright, colourless eye white, in the middle band of the face, one blob each side
white = (V > .82) & (S < .22) & ISL & (yy > H * .3) & (yy < H * .62)
eyes = []
for side in (xx < W / 2, xx >= W / 2):
    m = white & side; ys, xs = np.nonzero(m); cx, cy = np.median(xs), np.median(ys)
    eyes.append([cx, cy])
# each eye's feature mask: inside a generous oval round the white, everything that is not skin: white, iris, pupil,
# lashes, the dark outline. Skin = close to the skin colour sampled on the cheeks and the brow ridge round the oval.
EYE = np.zeros((H, W), bool); BOX = []; INNER = np.zeros((H, W), bool)
band = ISL & (yy > H * .28) & (yy < H * .66) & (xx > W * .1) & (xx < W * .9)
for cx, cy in eyes:
    # skin colour: the median of the band round the eye, far from it
    near = band & (np.hypot((xx - cx) / 170, (yy - cy) / 110) < 1)
    skin = np.median(F[near & ~white & (V > .7)], 0)
    d = np.abs(F - skin).max(-1); feat = band & ((d > .10) | (V < .72))
    # the eye: everything not skin connected to its white (white, iris, pupil, lashes, outline)
    comp = white & (np.hypot((xx - cx) / 90, (yy - cy) / 60) < 1); prev = 0
    while True:
        comp = comp | (dilate(comp, 1) & feat); s_ = comp.sum()
        if s_ == prev: break
        prev = s_
    ys, xs = np.nonzero(comp); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    # holes inside it (highlights) are eye too: flood the outside of its box
    roi = (xx >= x0 - 2) & (xx <= x1 + 2) & (yy >= y0 - 2) & (yy <= y1 + 2)
    reach = ~roi; prev = 0
    while True:
        reach = reach | (dilate(reach, 1) & ~comp); s_ = reach.sum()
        if s_ == prev: break
        prev = s_
    INNER |= ~reach   # the eye itself, inside its painted outline's outer edge
    m = dilate(~reach, 6)
    # the pale halo painted round the outline (lighter, less saturated than the skin) is part of the eye too
    halo = dilate(m, 14) & ~m & band & ((V > np.max(skin) + .0) | (S < hsv(skin[None])[0][0] - .06))
    # stray lash flicks and outline ends near the eye, not joined to it (never above its top: the brows)
    flick = dilate(m, 20) & band & (((V < .8) & (d > .14) & (yy >= y0 - 4)) | ((V < np.max(skin) - .05) & (d > .06) & (yy >= y0 - 22)))   # (and the faint lid crease painted above it: half faded it left a smudge)
    m = dilate(m | halo | flick, 4)
    EYE |= m; BOX.append([int(x0), int(y0), int(x1), int(y1)])
    print('eye at', cx, cy, 'box', BOX[-1], 'mask px', m.sum(), 'skin', skin)
# 2. the eye-free skin: one smooth rounded hole per eye (the eye, its outline and pale halo, rounded off: a ragged
# hole edge showed as a ragged pale shape), filled smoothly (Laplace, coarse to fine) from the skin round it, plus the
# skin's own fine grain; the fill fades into the painted skin over the outer part of the hole, no edge
hole = blur(EYE.astype(np.float32), 12) > .08
core = blur(EYE.astype(np.float32), 4) > .5
fill = harmonic(F.copy(), hole)
ringm = dilate(hole, 16) & ~dilate(hole, 3) & ISL
hp = F - blur(F, 6); g_std = hp[ringm].std(0)
rng = np.random.default_rng(7); nz = rng.standard_normal(F.shape).astype(np.float32); nz = nz - blur(nz, 6); nz = nz / (nz[hole].std(0) + 1e-6) * g_std
fill[hole] += nz[hole]
soft = np.clip(blur((core | ~hole & False).astype(np.float32), 0) * 0 + blur(np.where(hole, 1.0, 0.0).astype(np.float32), 0), 0, 1)
# alpha: 1 on the eye and its halo, falling to 0 at the hole's rim
dist = np.where(hole, 1.0, 0.0).astype(np.float32); a_ = core.astype(np.float32)
for _ in range(10): a_ = np.maximum(a_, (np.roll(a_, 1, 0) + np.roll(a_, -1, 0) + np.roll(a_, 1, 1) + np.roll(a_, -1, 1)) / 4 * .93)
a_ = np.clip(a_ * hole, 0, 1); a_ = blur(a_, 2) * hole
soft = a_[..., None]
NO = F * (1 - soft) + fill * soft
EYE = core
save(os.path.join(D, 'face-noeyes.png'), NO); save(os.path.join(D, 'eye-mask.png'), EYE.astype(np.float32))
json.dump({'eyes': eyes, 'box': BOX}, open(os.path.join(D, 'eyes.json'), 'w'))
print('grain std', g_std)
# 3. the moods, drawn on the baked face picture itself (the head's real surface colour, so every view matches)
LASH = np.array([.20, .11, .07]); PXMM = W / (2 * json.loads(open(os.path.join(D, 'cfg.json')).read())['span_m']) if os.path.exists(os.path.join(D, 'cfg.json')) else 2.13
LW = 4.1 * 2.13   # the old pieces' lash: 4.1 mm half-width (fit_people.py lw at 1.49 px/mm), here in this picture's px
def arc(b, yf, bend, n=32, x0=.08, x1=.92):
    w_, h_ = b[2] - b[0], b[3] - b[1]
    return [(b[0] + w_ * (x0 + (x1 - x0) * t), b[1] + h_ * yf + bend * h_ * (1 - (2 * t - 1) ** 2)) for t in np.linspace(0, 1, n)]
M = {}
for k in ('smile', 'sad', 'surprised'): M[k] = F.copy()   # open eyes: the eyes as painted
# eye geometry from the white: the opening box (white and iris), the iris disc
ew = np.median(F[white], 0); OPEN = []
for i, (cx, cy) in enumerate(eyes):
    side = (xx < W / 2) if i == 0 else (xx >= W / 2)
    wm = white & side & EYE; wy = np.nonzero(wm)[0]; wy0, wy1 = np.percentile(wy, 2), np.percentile(wy, 98)
    cand = EYE & side & ~dilate(white, 1) & (V < .85) & (S > .25) & (yy > wy0 + 4) & (yy < wy1 - 4)
    ys, xs = np.nonzero(cand); icx, icy = np.median(xs), np.median(ys)
    for _ in range(3):   # re-centre on the pixels within the disc (no lash ends at the sides)
        r_ = np.sqrt(((np.hypot(xs - icx, ys - icy) < 70)).sum() / np.pi); sel = np.hypot(xs - icx, ys - icy) < r_ * 1.05; icx, icy = xs[sel].mean(), ys[sel].mean()
    # the opening: the white and the iris inside the painted outline (the eye less 6 px), filled row by row and column
    # by column (no notches)
    er = INNER & side
    for _ in range(6): er = er & np.roll(er, 1, 0) & np.roll(er, -1, 0) & np.roll(er, 1, 1) & np.roll(er, -1, 1)
    pure = wm & (S < .12) & (V > .88)   # (the pale pink halo outside the outline is not the white)
    seed = (pure | (np.hypot(xx - icx, yy - icy) < r_)) & er; opening = np.zeros_like(seed)
    for y in np.nonzero(seed.any(1))[0]: xs_ = np.nonzero(seed[y])[0]; opening[y, xs_.min():xs_.max() + 1] = True
    o2 = np.zeros_like(seed)
    for x in np.nonzero(opening.any(0))[0]: ys_ = np.nonzero(opening[:, x])[0]; o2[ys_.min():ys_.max() + 1, x] = True
    opening = o2 & er
    pt = pb = None
    wrow = np.array([np.median(F[y][wm[y]], 0) if wm[y].sum() > 2 else ew for y in range(H)])   # the white's own shade per row
    r_ *= 1.12
    ox = np.nonzero(opening)[1]; oy = np.nonzero(opening)[0]
    OPEN.append(dict(icx=float(icx), icy=float(icy), r=float(r_), box=[int(ox.min()), int(oy.min()), int(ox.max()), int(oy.max())], opening=opening, wrow=wrow, top=pt, bot=pb))
    print('iris', i, round(icx), round(icy), 'r', round(r_), 'opening box', OPEN[-1]['box'])
def look(dxf):
    im = F.copy()
    for o in OPEN:
        b = o['box']; dx = int(round((b[2] - b[0]) * dxf)); op = o['opening']
        sx = np.clip(xx - dx, 0, W - 1); d_ = np.hypot(xx - dx - o['icx'], yy - o['icy'])
        a = np.clip(o['r'] - d_ + .5, 0, 1)[..., None]   # the moved iris, soft edged
        new = o['wrow'][yy] * (1 - a) + F[yy, sx] * a
        e = blur(op.astype(np.float32), 1)[..., None] * op[..., None]   # soft against the lash line
        im = im * (1 - e) + new * e
    return im
M['lookL'] = look(.16); M['lookR'] = look(-.16)
def shut_eyes(bend, yf):
    im = NO.copy()
    for o in OPEN:
        b = o['box']; stroke(im, arc(b, yf, bend), LASH, LW)
    return im
M['blink'] = shut_eyes(.16, .62)
M['happy'] = shut_eyes(-.32, .70)
M['excited'] = M['happy'].copy()
# half: the upper lid down to the middle of the opening, its edge a lash line; below it the eye as painted
im = F.copy()
for o in OPEN:
    b = o['box']; h_ = b[3] - b[1]; w_ = b[2] - b[0]
    t = np.clip((xx - b[0]) / max(w_, 1), 0, 1); edge = b[1] + h_ * .5 + .06 * h_ * (1 - (2 * t - 1) ** 2)
    lid = EYE & (yy < edge + 1) & (xx >= b[0] - 30) & (xx <= b[2] + 30)
    a = np.clip(edge + 1 - yy, 0, 1)[..., None] * blur(EYE.astype(np.float32), 1)[..., None] * lid[..., None]
    im = im * (1 - a) + NO * a
    stroke(im, arc(b, .5, .06, x0=.1, x1=.9), LASH, LW * .8)
M['half'] = im
for k, v in M.items(): save(os.path.join(D, 'mood-%s.png' % k), v)
sheet = np.concatenate([np.concatenate([M[k][250:500, 150:880] for k in row], 1) for row in (('smile', 'blink', 'half'), ('happy', 'lookL', 'lookR'), ('sad', 'surprised', 'excited'))], 0)
save(os.path.join(D, 'moods-sheet.png'), sheet)

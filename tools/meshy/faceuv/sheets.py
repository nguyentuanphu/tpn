# before/after sheets: old Sol (the floating face pieces) beside new Sol (face UV), same moods and views
#   python sheets.py <old shots> <new shots> <out dir>
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(__file__)); from img import *
O, N, OUT = sys.argv[1:4]; os.makedirs(OUT, exist_ok=True)
MOODS = ['smile', 'blink', 'half', 'happy', 'o', 'sad', 'lookL', 'lookR', 'excited']
def ld(p, s=None):
    if not os.path.exists(p): return np.full((s or 64, s or 64, 3), .5, np.float32)
    a = load(p)[..., :3]; return resize(a, s, s) if s else a
def gap(a, n=6, axis=1): sh = list(a.shape); sh[axis] = n; return np.concatenate([a, np.ones(sh, np.float32)], axis)
# close-ups: one sheet per mood, rows old/new, columns yaw -1.2 .. 1.2, each 384 px
YC = ['-1.2', '-0.7', '-0.4', '0', '0.4', '0.7', '1.2']
for m in MOODS:
    rows = [np.concatenate([gap(ld(f'{d}/close-{m}-y{y}.png', 384)) for y in YC], 1) for d in (O, N)]
    save(f'{OUT}/close-{m}.png', np.concatenate([gap(r, 10, 0) for r in rows], 0))
# all moods at a glance: rows mood (old, new), columns yaw, 256 px
big = []
for m in MOODS:
    for d in (O, N): big.append(gap(np.concatenate([gap(ld(f'{d}/close-{m}-y{y}.png', 224)) for y in YC], 1), 4, 0))
    big.append(np.ones((10, big[-1].shape[1], 3), np.float32) * .2)
save(f'{OUT}/close-all.jpg', np.concatenate(big, 0))
# in-game distance: per device, rows mood (old | new), columns yaw; each head crop at its real pixels, enlarged 4x
YD = ['-0.7', '0', '0.7']
for dev in ('phone', 'tablet', 'computer'):
    rows = []
    for m in MOODS:
        cells = []
        for d in (O, N):
            ims = [ld(f'{d}/{dev}-{m}-y{y}.png') for y in YD]; s = 192   # (each head crop, about 40 to 50 px on screen, enlarged to 192)
            cells.append(np.concatenate([gap(resize(a, s, s), 4) for a in ims], 1))
        rows.append(gap(np.concatenate([gap(cells[0], 24), cells[1]], 1), 6, 0))
    save(f'{OUT}/game-{dev}.png', np.concatenate(rows, 0))
print('sheets in', OUT)

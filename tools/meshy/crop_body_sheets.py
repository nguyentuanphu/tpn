"""(8 Nov 2026) Cut each four-view body sheet (docs/friends-body-sheets-20261108/body-<id>.png) into its views, square
on the same grey, and record them with hashes in that folder's MANIFEST.json ("viewCrops"). Never calls Meshy.
Each separate shape on the sheet (a child, or a hand that touches nothing) belongs to the view whose big shape is
nearest; touching views (Finn's hand reaches the next child) are split at the emptiest column between their centres.
Each view is centred on its own child; nothing of a neighbour is copied.
   python tools/meshy/crop_body_sheets.py [--check]       (needs numpy, scipy, Pillow)"""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = Path(__file__).resolve().parents[2]; DIR = ROOT / 'docs/friends-body-sheets-20261108'
VIEWS = ['front', 'left-side', 'back', 'three-quarter-front']
check = '--check' in sys.argv
man = json.loads((DIR / 'MANIFEST.json').read_text(encoding='utf-8')); out = {}
for a in man['assets']:
    im = Image.open(DIR / a['image']).convert('RGB'); A = np.asarray(im).astype(np.float32); H, W = A.shape[:2]
    bg = np.median(np.concatenate([A[:8].reshape(-1, 3), A[-8:].reshape(-1, 3), A[:, :8].reshape(-1, 3), A[:, -8:].reshape(-1, 3)]), axis=0)
    fg = ndimage.binary_opening(np.abs(A - bg).max(-1) > 22, iterations=1)
    # the four view centres: the emptiest columns near the quarter lines split the sheet; each part's foreground centre
    cs = fg.sum(0); cuts = [0]
    for q in (1, 2, 3):
        lo, hi = int(W * (q / 4 - .08)), int(W * (q / 4 + .08)); cuts.append(lo + int(np.argmin(cs[lo:hi])))
    cuts.append(W)
    centres = [x0 + float(np.average(np.arange(x1 - x0), weights=cs[x0:x1] + 1e-6)) for x0, x1 in zip(cuts[:-1], cuts[1:])]
    # shapes are labelled on a thinned mask (a fingertip touching the next child no longer joins them); the thin parts
    # removed by thinning take the label of the nearest labelled pixel
    core = ndimage.binary_opening(fg, iterations=4); lab, n = ndimage.label(core)
    _, (iy, ix) = ndimage.distance_transform_edt(lab == 0, return_indices=True)
    lab = np.where(fg, lab[iy, ix], 0); owner = np.zeros(n + 1, int)
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        xs = np.nonzero(lab[sl] == k)[1] + sl[1].start
        if sum(xs.min() <= c <= xs.max() for c in centres) <= 1: owner[k] = int(np.argmin([abs(xs.mean() - c) for c in centres]))   # one child (an A-pose is wide), or a stray piece
        else: owner[k] = -1   # (two children joined: split by the cut columns below)
    # small pieces (a hand cut off by the thinning) belong to whichever big shape's pixels are nearest, not the nearest centre
    sizes = ndimage.sum(np.ones_like(lab), lab, index=np.arange(n + 1)); big = sizes > sizes[1:].max() * .05; big[0] = False
    bigs = [k for k in np.nonzero(big)[0]]; dist = {k: ndimage.distance_transform_edt(lab != k) for k in bigs}
    for k in np.nonzero(~big)[0]:
        if k == 0: continue
        m_ = lab == k
        if m_.any(): owner[k] = owner[min(bigs, key=lambda b: float(dist[b][m_].min()))]
    view_of = np.full((H, W), -1)
    m = lab > 0; view_of[m] = owner[lab[m]]
    j = (lab > 0) & (view_of == -1)
    if j.any():
        xx = np.broadcast_to(np.arange(W), (H, W)); view_of[j] = np.searchsorted(cuts[1:-1], xx[j], side='right')
    crops = []
    for vi, v in enumerate(VIEWS):
        mine = view_of == vi; ys, xs = np.nonzero(mine)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        side = int(max(x1 - x0, y1 - y0) * 1.1); cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        canvas = np.empty((side, side, 3), np.uint8); canvas[:] = bg.astype(np.uint8)
        src = np.asarray(im)
        ox, oy = cx - side // 2, cy - side // 2
        X0, X1, Y0, Y1 = max(0, ox), min(W, ox + side), max(0, oy), min(H, oy + side)
        # only this child (its shapes, widened a little for the soft edge); everything else becomes the plain grey, so no
        # faint outline of a neighbour remains
        own = ndimage.binary_dilation(mine[Y0:Y1, X0:X1], iterations=6) & ~((view_of[Y0:Y1, X0:X1] >= 0) & (view_of[Y0:Y1, X0:X1] != vi))
        patch = src[Y0:Y1, X0:X1].copy(); patch[~own] = bg.astype(np.uint8)
        canvas[Y0 - oy:Y1 - oy, X0 - ox:X1 - ox] = patch
        rel = f"crops/{a['id']}-{v}.png"; p = DIR / rel
        if not check: p.parent.mkdir(exist_ok=True); Image.fromarray(canvas).save(p, optimize=True)
        crops.append({'view': v, 'path': rel, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None, 'box': [int(x0), int(y0), int(x1), int(y1)]})
    a['viewCrops'] = crops; out[a['id']] = [c['box'] for c in crops]
if not check: (DIR / 'MANIFEST.json').write_text(json.dumps(man, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'check': check, 'boxes': out, 'paidCalls': 0}))

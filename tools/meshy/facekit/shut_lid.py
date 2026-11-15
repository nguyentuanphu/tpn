# (15 Nov 2026) The shared face kit: one rule set for a shut eye painted over Meshy's own face, for every person model.
# Step 1 (js/friend-model.ts): the body under a shut eye shows the shut piece's own picture, not a flat skin oval.
# Step 2 (here): the filled lid keeps the skin's grain. A smooth fill (repeated neighbour averaging) is right in its broad
# shading but has none of the painted skin's fine grain, so a closed lid reads as a flat, slightly different patch on the
# grainy face round it. grain() adds the skin's own fine detail back: the high-pass part of the skin right round the hole,
# copied in small tiles from random places on that skin (texture synthesis by tiles), faded in from the hole's edge.
# Used by tools/meshy/fit_people.py lid() when FIT_FACEKIT=1.
import numpy as np

def _blur(a, r):
    # a box blur of radius r on an (h, w, c) array, edges repeated
    k = 2 * r + 1
    p = np.pad(a, ((r, r), (r, r), (0, 0)), mode='edge')
    c = np.cumsum(np.cumsum(p, 0), 1)
    c = np.pad(c, ((1, 0), (1, 0), (0, 0)))
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)

def grow_hole(V, S, skin, hair, box, reach=.08):
    """The shut lid's hole by distance, not by colour thresholds alone (15 Nov 2026: Sol's grey tick at the inner corner, the open
    eye's outline, was neither dark enough nor white enough to be closed). Seeds: the eye's white and its dark iris and lash
    inside the eye box. From them the hole grows, one pixel a step, through every pixel that is not plain skin (grey, dark,
    pale and colourless, or far from bright coloured skin), up to `reach` of the eye's width away from the seeds; hair outside
    the box never. V, S: value and saturation; skin: plain-skin mask; hair: hair mask; box: x0 y0 x1 y1."""
    h, w = V.shape; x0, y0, x1, y1 = [int(round(v)) for v in box]; bw = max(4, x1 - x0)
    yy, xx = np.mgrid[0:h, 0:w]
    inb = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
    seed = inb & (((V > .78) & (S < .22)) | (V < .45))
    # (first trial on Sol: grown through anything not plain skin, up to .3 of the eye's width, inside a box .6 wider: it reached the
    # temples' shading and stopped at the box's sides, a filled block with straight edges at the outer corner) only grey or dark
    # pixels (the outline), a short way (.08 of the eye's width) and close to the eye (.15)
    plain = skin & (V > .6) & (S > .2)
    can = ~plain & ((V < .72) | (S < .22)) & ~(hair & ~inb)
    near = (xx >= x0 - bw * .15) & (xx < x1 + bw * .15) & (yy >= y0 - bw * .1) & (yy < y1 + bw * .15)
    can &= near
    out = seed.copy()
    for _ in range(max(2, int(bw * reach))):
        n = out | (can & (np.roll(out, 1, 0) | np.roll(out, -1, 0) | np.roll(out, 1, 1) | np.roll(out, -1, 1) |
                          np.roll(np.roll(out, 1, 0), 1, 1) | np.roll(np.roll(out, 1, 0), -1, 1) | np.roll(np.roll(out, -1, 0), 1, 1) | np.roll(np.roll(out, -1, 0), -1, 1)))
        if (n == out).all(): break
        out = n
    o2 = out | np.roll(out, 1, 0) | np.roll(out, -1, 0) | np.roll(out, 1, 1) | np.roll(out, -1, 1)   # its soft edge
    return o2 & near

def eye_disc(V, S, box, grow=.1):
    """(15 Nov 2026, the shared face kit: a pale grey bit of Sol's lower eye rim stayed inside the filled lid, neither grey nor dark
    enough for any colour test) the whole painted eye by shape: the ellipse over its white's extent (the white surrounds the iris,
    so its extent is the eye's), grown by `grow` of the eye's width. Colour does not decide its edge. (A first try joined the
    dark parts to the white and filled the gaps: Sol's amber iris is not dark, and the fill leaked through it.)"""
    h, w = V.shape; x0, y0, x1, y1 = [int(round(v)) for v in box]
    x0, x1 = max(0, x0), min(w, x1); y0, y1 = max(0, y0), min(h, y1)
    white = np.zeros((h, w), bool); white[y0:y1, x0:x1] = ((V > .78) & (S < .22))[y0:y1, x0:x1]
    if white.sum() < 6: return np.zeros((h, w), bool)
    ys, xs = np.nonzero(white)
    wx0, wx1 = np.percentile(xs, 1), np.percentile(xs, 99); wy0, wy1 = np.percentile(ys, 1), np.percentile(ys, 99)
    # (Sol: the white lies on one side of the iris only, so its extent missed the other side) with the eye's dark outline and iris
    # beside the white, in its rows and a little past them, never the brow above
    eh = wy1 - wy0; dk = np.zeros((h, w), bool); r0 = int(max(y0, wy0 - eh * .25)); r1 = int(min(y1, wy1 + eh * .3))
    dk[r0:r1, x0:x1] = (V < .45)[r0:r1, x0:x1]
    dk &= (np.abs(np.arange(w)[None, :] - (wx0 + wx1) / 2) < (wx1 - wx0) * 1.2)
    if dk.sum() > 6:
        dy, dx = np.nonzero(dk | white)
        wx0, wx1 = min(wx0, np.percentile(dx, 1)), max(wx1, np.percentile(dx, 99)); wy0, wy1 = min(wy0, np.percentile(dy, 1)), max(wy1, np.percentile(dy, 99))
    cx, cy = (wx0 + wx1) / 2, (wy0 + wy1) / 2; g = (wx1 - wx0) * grow
    rx, ry = (wx1 - wx0) / 2 + g, (wy1 - wy0) / 2 + g
    yy, xx = np.mgrid[0:h, 0:w]
    return np.hypot((xx - cx) / max(rx, 1), (yy - cy) / max(ry, 1)) < 1

def upper_lid(V, S, hair, box):
    """(15 Nov 2026, the shared face kit, seen with the piece hidden: the open eye's upper lash and lid crease stayed as grey arcs
    above Sol's shut eyes, as the hole stopped a fifth of the way down the eye box, which reaches up over the brows) everything
    between the eye's white and the brow, column by column: from the white's top upwards past the lash and the skin under the
    brow; the brow (the next dark run) and 2 px under it stay. Columns past the white's ends take the nearest end's height."""
    h, w = V.shape; x0, y0, x1, y1 = [int(round(v)) for v in box]
    x0, x1 = max(0, x0), min(w, x1); y0, y1 = max(0, y0), min(h, y1)
    wh = np.zeros((h, w), bool); wh[y0:y1, x0:x1] = ((V > .78) & (S < .22))[y0:y1, x0:x1]
    cols = np.nonzero(wh.any(0))[0]
    out = np.zeros((h, w), bool)
    if len(cols) < 3: return out
    dk = (V < .42) | hair   # (the brow; a grey crease, V .45 to .55, is not)
    top = {}
    for x in cols:
        wt = int(np.nonzero(wh[:, x])[0].min()); y = wt; st = 0; cut = max(y0, wt - (y1 - y0))
        while y > max(0, wt - (y1 - y0)):
            d = bool(dk[y, x])
            if st == 0 and d: st = 1
            elif st == 1 and not d: st = 2
            elif st == 2 and d: cut = y + 3; break
            y -= 1
        top[x] = (cut, wt)
    xs = np.array(sorted(top)); cut = np.array([top[x][0] for x in xs], float); wt = np.array([top[x][1] for x in xs], float)
    k = max(1, len(xs) // 8); cut = np.array([np.median(cut[max(0, i - k):i + k + 1]) for i in range(len(xs))])   # (a lash flick taken for the brow in one column)
    span = xs[-1] - xs[0]; xa, xb = int(xs[0] - span * .12), int(xs[-1] + span * .12)
    for x in range(max(0, xa), min(w, xb + 1)):
        c = np.interp(x, xs, cut); t = np.interp(x, xs, wt)
        out[int(np.ceil(c)):int(t) + 2, x] = True
    return out

def body_offset(F, G, valid, r):
    """F: (h, w, 3) the front picture the mood pieces are cut from; G: the same front view of the body's own texture (the one
    the game draws), NaN where not cast; valid: where both are plain skin. Returns the broad colour difference G - F, blurred
    over r px and spread over the whole picture (zero far from any valid pixel). Added to the pieces, their colours match the
    body under them (15 Nov 2026: the front picture is paler and softer than the body's texture, so every piece showed as a
    paler soft box round the shut eyes)."""
    d = np.where(valid[..., None], np.nan_to_num(G - F), 0).astype(np.float32)
    wgt = valid.astype(np.float32)[..., None]
    num = _blur(d, r); den = _blur(wgt, r)
    out = num / np.maximum(den, 1e-4)
    return out * np.clip(den / .05, 0, 1)        # fades to nothing where no skin was measured

def grain(sub, hole, src, tile=4, r=3, amount=1.0, seed=7):
    """sub: (h, w, 3) floats, the hole already filled smoothly; hole: (h, w) bool; src: (h, w) bool, the skin to copy from.
    Returns sub with the skin's fine grain added inside the hole (never outside it)."""
    h, w = hole.shape
    if hole.sum() < 4 or src.sum() < tile * tile * 4: return sub
    hp = sub - _blur(sub, r)                       # the fine detail of everything (only the source part is used)
    # source tiles: tile x tile windows lying wholly on the skin
    s = src.astype(np.int32); cs = np.pad(np.cumsum(np.cumsum(s, 0), 1), ((1, 0), (1, 0)))
    full = (cs[tile:, tile:] - cs[:-tile, tile:] - cs[tile:, :-tile] + cs[:-tile, :-tile]) == tile * tile
    ys, xs = np.nonzero(full)
    if len(ys) < 4: return sub
    rng = np.random.default_rng(seed)
    add = np.zeros_like(sub)
    for ty in range(0, h, tile):
        for tx in range(0, w, tile):
            hh, ww = min(tile, h - ty), min(tile, w - tx)
            if not hole[ty:ty + hh, tx:tx + ww].any(): continue
            k = rng.integers(len(ys)); sy, sx = ys[k], xs[k]
            add[ty:ty + hh, tx:tx + ww] = hp[sy:sy + hh, sx:sx + ww]
    # fade in from the hole's edge over r px, so the seam between copied and real grain does not show
    d = hole.astype(np.float32)
    for _ in range(r):
        d = np.minimum(d, np.minimum.reduce([np.roll(d, 1, 0), np.roll(d, -1, 0), np.roll(d, 1, 1), np.roll(d, -1, 1)]) + 1 / r)
    wgt = np.clip(d, 0, 1)[..., None] * amount
    out = sub.copy()
    out[hole] = np.clip(sub[hole] + (add * wgt)[hole], 0, 1)
    return out

def _dil(m, n):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m

def dome_field(F, pieces, boxes, ring=.025, iters=600, hair=None):
    """(15 Nov 2026, the UV-space shut eye) The lid tone over each whole eye dome, in the front picture's pixels, for painting the
    dome's own texels in the body texture (tools/meshy/fit_people.py, the shut copy): the front projection squeezes the dome's
    sides into a few pixels, and they are painted a paler skin round the open eye (Sol's light crescent at three-quarters).
    The hole is where the shut pieces (blink, happy: RGBA, alpha the piece) change the face; round it a ring `ring` of the
    picture's width; the ring and the lash strokes in the hole are filled smoothly (repeated neighbour averaging) from the lid
    and from the face beyond the ring, so the pale rim goes. Dark pixels (brows, hair) outside the hole are never filled.
    Returns (L, w): the colour (h, w, 3) and its soft weight (h, w), 0 outside the ring."""
    h, w_ = F.shape[:2]; yy, xx = np.mgrid[0:h, 0:w_]
    near = np.zeros((h, w_), bool)
    for b in boxes:
        cx, cy, rx, ry = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2, (b[2] - b[0]) / 2, (b[3] - b[1]) / 2
        near |= np.hypot((xx - cx) / max(rx * 1.7, 1), (yy - cy) / max(ry * 2.0, 1)) < 1
    hole = np.zeros((h, w_), bool)
    for P in pieces:
        if P is None: continue
        hole |= (P[..., 3] > .5) & (np.abs(P[..., :3] - F[..., :3]).max(-1) > .03)
    hole &= near
    hole = ~_dil(~_dil(hole, 2), 2) & near   # (closed: no pinholes where a piece happens to match the face)
    L = F[..., :3].copy().astype(np.float32)
    base = pieces[0]
    L[hole] = base[..., :3][hole]
    V = F[..., :3].max(-1); Vb = L.max(-1)
    k = max(3, int(round(w_ * ring)))
    R2 = _dil(hole, k) & near
    # (hair hanging over the eye from the front, Sol's lock, and the brows: never painted onto the skin under them, and never a source)
    keep = ((V < .45) | (hair if hair is not None else False)) & ~hole
    R = R2 & ~keep
    unk = (R2 & ~hole) | (hole & _dil(Vb < .6, 2))   # (the lash strokes come from the piece itself in the game)
    if unk.any():
        kn = _dil(R2, 1) & ~unk & ~keep
        L[unk] = np.median(L[kn], axis=0) if kn.any() else L[unk].mean(0)
        for _ in range(iters):
            P_ = np.pad(L, ((1, 1), (1, 1), (0, 0)), mode='edge')
            av = (P_[:-2, 1:-1] + P_[2:, 1:-1] + P_[1:-1, :-2] + P_[1:-1, 2:]) / 4
            L[unk] = av[unk]
    wt = R.astype(np.float32)
    for _ in range(3): wt = (wt + np.roll(wt, 1, 0) + np.roll(wt, -1, 0) + np.roll(wt, 1, 1) + np.roll(wt, -1, 1)) / 5
    wt = np.where(_dil(hole, max(1, k - 3)), 1., np.clip(wt * 1.5, 0, 1)).astype(np.float32) * R
    return L, wt, hole

def pack_rects(mask, margin=6, block=8, maxn=16, gap=2):
    """(15 Nov 2026) Meshy's UV islands are small and scattered: an eye dome's texels lie in many places over the whole texture,
    so one crop round them is nearly the whole picture. The changed texels are grouped (blocks of `block` px, joined when they
    touch), each group's box grown by `margin` (unchanged texels round it, so filtering at its edge brings nothing new), at most
    `maxn` boxes (the nearest merged), and the boxes are shelf-packed into one small atlas.
    Returns (boxes [(x0, y0, x1, y1)], places [(ax, ay)], (aw, ah)) in pixels of mask's own row order."""
    h, w = mask.shape; gh, gw = -(-h // block), -(-w // block)
    pad = np.zeros((gh * block, gw * block), bool); pad[:h, :w] = mask
    g = pad.reshape(gh, block, gw, block).any(axis=(1, 3))
    g = g | np.roll(g, 1, 0) | np.roll(g, -1, 0) | np.roll(g, 1, 1) | np.roll(g, -1, 1)
    lab = -np.ones((gh, gw), int); boxes = []
    for sy, sx in zip(*np.nonzero(g)):
        if lab[sy, sx] >= 0: continue
        n = len(boxes); st = [(sy, sx)]; lab[sy, sx] = n; y0, y1, x0, x1 = sy, sy, sx, sx
        while st:
            y, x = st.pop(); y0, y1, x0, x1 = min(y0, y), max(y1, y), min(x0, x), max(x1, x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < gh and 0 <= xx < gw and g[yy, xx] and lab[yy, xx] < 0: lab[yy, xx] = n; st.append((yy, xx))
        boxes.append([x0 * block, y0 * block, (x1 + 1) * block, (y1 + 1) * block])
    boxes = [[max(0, b[0] - margin), max(0, b[1] - margin), min(w, b[2] + margin), min(h, b[3] + margin)] for b in boxes]
    def ov(a, b): return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])
    def un(a, b): return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
    def area(a): return (a[2] - a[0]) * (a[3] - a[1])
    ch = True
    while ch:
        ch = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                if ov(boxes[i], boxes[j]): boxes[i] = un(boxes[i], boxes.pop(j)); ch = True; break
            if ch: break
        if not ch and len(boxes) > maxn:   # (the pair whose union adds least)
            best = None
            for i in range(len(boxes)):
                for j in range(i + 1, len(boxes)):
                    c = area(un(boxes[i], boxes[j])) - area(boxes[i]) - area(boxes[j])
                    if best is None or c < best[0]: best = (c, i, j)
            _, i, j = best; boxes[i] = un(boxes[i], boxes.pop(j)); ch = True
    order = sorted(range(len(boxes)), key=lambda i: -(boxes[i][3] - boxes[i][1]))
    tot = sum(area(b) for b in boxes); aw = max(max((b[2] - b[0]) for b in boxes) + gap, int((tot ** .5) * 1.25)) if boxes else 1
    places = [None] * len(boxes); x = y = rh = 0
    for i in order:
        bw, bh = boxes[i][2] - boxes[i][0], boxes[i][3] - boxes[i][1]
        if x + bw > aw: x = 0; y += rh + gap; rh = 0
        places[i] = (x, y); x += bw + gap; rh = max(rh, bh)
    ah = y + rh
    return [tuple(b) for b in boxes], places, (aw, max(1, ah))

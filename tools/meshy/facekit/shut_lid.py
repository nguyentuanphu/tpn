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

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

# small image helpers (Blender's Python: numpy + OpenImageIO)
import numpy as np, OpenImageIO as oiio
def load(p):
    a = oiio.ImageBuf(p).get_pixels(oiio.FLOAT); return a
def save(p, a, fmt=oiio.UINT8):
    a = np.ascontiguousarray(np.clip(a, 0, 1).astype(np.float32))
    if a.ndim == 2: a = a[..., None]
    b = oiio.ImageBuf(oiio.ImageSpec(a.shape[1], a.shape[0], a.shape[2], oiio.FLOAT)); b.set_pixels(oiio.ROI(), a)
    if p.lower().endswith(('.jpg', '.jpeg')): b.specmod().attribute('Compression', 'jpeg:94')
    b.write(p, fmt)
def resize(a, w, h):
    a = np.ascontiguousarray(a.astype(np.float32)); s = oiio.ImageBuf(oiio.ImageSpec(a.shape[1], a.shape[0], a.shape[2], oiio.FLOAT)); s.set_pixels(oiio.ROI(), a)
    d = oiio.ImageBufAlgo.resize(s, roi=oiio.ROI(0, w, 0, h, 0, 1, 0, a.shape[2])); return d.get_pixels(oiio.FLOAT)
def blur(a, n):   # n passes of a 5-point box: a cheap gaussian
    for _ in range(n): a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
    return a
def dilate(m, n):
    for _ in range(n): m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m
def hsv(rgb):
    v = rgb.max(-1); mn = rgb.min(-1); s = (v - mn) / np.maximum(v, 1e-4); return s, v
def harmonic(img, hole, iters=400):
    """fill img[hole] smoothly from its edge (Laplace), coarse to fine so large holes converge"""
    H, W = hole.shape
    if min(H, W) > 24 and hole.sum() > 64:
        h2 = (H + 1) // 2 * 2; w2 = (W + 1) // 2 * 2
        ip = np.pad(img, ((0, h2 - H), (0, w2 - W), (0, 0)), mode='edge'); hp = np.pad(hole, ((0, h2 - H), (0, w2 - W)), mode='edge')
        known = (~hp).astype(np.float32)
        s = (ip * known[..., None]).reshape(h2 // 2, 2, w2 // 2, 2, -1).sum((1, 3)); n = known.reshape(h2 // 2, 2, w2 // 2, 2).sum((1, 3))
        ch = n < 2; small = np.where(n[..., None] > 0, s / np.maximum(n, 1)[..., None], 0)
        small = harmonic(small, ch | (n == 0), iters)
        up = np.repeat(np.repeat(small, 2, 0), 2, 1)[:H, :W]; img = img.copy(); img[hole] = up[hole]; iters = max(40, iters // 4)
    else: img = img.copy(); img[hole] = img[~hole].mean(0) if (~hole).any() else 0
    for _ in range(iters):
        P = np.pad(img, ((1, 1), (1, 1), (0, 0)), mode='edge'); av = (P[:-2, 1:-1] + P[2:, 1:-1] + P[1:-1, :-2] + P[1:-1, 2:]) / 4; img[hole] = av[hole]
    return img
def stroke(img, pts, col, r):
    H_, W_ = img.shape[:2]; pts = np.array(pts, np.float32)
    x0, y0 = np.floor(pts.min(0) - r - 2).astype(int); x1, y1 = np.ceil(pts.max(0) + r + 2).astype(int)
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W_, x1), min(H_, y1)
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5; d = np.full(gx.shape, 1e9, np.float32)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        abx, aby = bx - ax, by - ay; t = np.clip(((gx - ax) * abx + (gy - ay) * aby) / max(abx * abx + aby * aby, 1e-6), 0, 1)
        d = np.minimum(d, np.hypot(gx - ax - abx * t, gy - ay - aby * t))
    al = np.clip(r + .5 - d, 0, 1)[..., None]; sub = img[y0:y1, x0:x1]; sub[..., :3] = sub[..., :3] * (1 - al) + np.array(col) * al
def load_ua(p):   # RGBA as stored (not premultiplied): the colour of see-through texels is kept
    cfg = oiio.ImageSpec(); cfg.attribute('oiio:UnassociatedAlpha', 1); return oiio.ImageBuf(p, 0, 0, cfg).get_pixels(oiio.FLOAT)
def save_ua(p, a):
    a = np.ascontiguousarray(np.clip(a, 0, 1).astype(np.float32)); sp = oiio.ImageSpec(a.shape[1], a.shape[0], a.shape[2], oiio.FLOAT); sp.attribute('oiio:UnassociatedAlpha', 1)
    b = oiio.ImageBuf(sp); b.set_pixels(oiio.ROI(), a); b.write(p, oiio.UINT8)

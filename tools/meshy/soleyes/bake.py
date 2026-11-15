# Step 1 of the sol-eyes face: a clean face UV, baked once.
# The head's front (the face out to near the ears, chin to hairline) of Sol's skin mesh gets one contiguous island in a
# cylindrical projection about the head's vertical axis; the original colour (Meshy's fragmented 2048 atlas) is copied onto
# it texel by texel through each triangle's own barycentric coordinates (exact, no ray casting, no misses).
# Only the outermost surface is taken (a z-buffer on the radius), so hair over the face or anything behind stays as it is.
# Run with Blender's Python (numpy + OpenImageIO):  python bake.py <dressed-hd.glb> <outdir>
import sys, os, json, numpy as np, OpenImageIO as oiio
sys.path.insert(0, os.path.dirname(__file__)); import glb
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
CFG = dict(R=.2, TH=1.2, Y0=1.14, Y1=1.52, W=1024, ZC=0.0)
if len(sys.argv) > 3: CFG.update(json.loads(sys.argv[3]))
R, TH, Y0, Y1, W, ZC = CFG['R'], CFG['TH'], CFG['Y0'], CFG['Y1'], CFG['W'], CFG['ZC']
H = int(round(W * (Y1 - Y0) / (2 * TH * R)))
def proj(P):   # metres -> face-image pixels (x right = model +x, y down)
    th = np.arctan2(P[..., 0], P[..., 2] - ZC)
    return np.stack([(th + TH) / (2 * TH) * W, (Y1 - P[..., 1]) / (Y1 - Y0) * H], -1)
J, B = glb.read(SRC)

# the body's colour picture: the image the skin primitives use
prims = []
for mi, me in enumerate(J['meshes']):
    for pi, p in enumerate(me['primitives']):
        m = J['materials'][p['material']]; t = m.get('pbrMetallicRoughness', {}).get('baseColorTexture')
        if t is None or not m['name'].startswith(('cloth-body', 'skin-tex')): continue
        prims.append((mi, pi, p, J['textures'][t['index']]['source']))
src_img = prims[0][3]; assert all(x[3] == src_img for x in prims)
tmp = os.path.join(OUT, 'atlas-src.jpg'); open(tmp, 'wb').write(glb.view_bytes(J, B, J['images'][src_img]['bufferView']))
TEX = oiio.ImageBuf(tmp).get_pixels(oiio.FLOAT)[..., :3]; TH_, TW_ = TEX.shape[:2]
def bil(u, v):   # glTF uv (v down) -> colour, bilinear, wrap clamp
    x = np.clip(u * TW_ - .5, 0, TW_ - 1.001); y = np.clip(v * TH_ - .5, 0, TH_ - 1.001); x0 = x.astype(int); y0 = y.astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    return (TEX[y0, x0] * (1 - fx) * (1 - fy) + TEX[y0, x0 + 1] * fx * (1 - fy) + TEX[y0 + 1, x0] * (1 - fx) * fy + TEX[y0 + 1, x0 + 1] * fx * fy)
# candidates: triangles in the domain, facing outward
tris = []   # (prim k, tri index, P(3,3), UV(3,2), S(3,2))
for k, (mi, pi, p, _) in enumerate(prims):
    P = glb.acc(J, B, p['attributes']['POSITION']).astype(np.float64); UV = glb.acc(J, B, p['attributes']['TEXCOORD_0']).astype(np.float64)
    I = glb.acc(J, B, p['indices']).reshape(-1, 3); T = P[I]; c = T.mean(1)
    n = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]); rad = np.c_[c[:, 0], np.zeros(len(c)), c[:, 2] - ZC]
    th = np.arctan2(c[:, 0], c[:, 2] - ZC)
    ok = (abs(th) < TH * .985) & (c[:, 1] > Y0 + .004) & (c[:, 1] < Y1 - .004) & (c[:, 2] > ZC); out_ = (n * rad).sum(1) > 0
    S = proj(T)
    ok &= (S[..., 0].min(1) > 3) & (S[..., 0].max(1) < W - 3) & (S[..., 1].min(1) > 3) & (S[..., 1].max(1) < H - 3)   # (every corner inside the picture: a corner outside would look into the next mood tile)
    for t in np.nonzero(ok)[0]: tris.append((k, int(t), T[t], UV[I[t]], S[t], bool(out_[t])))
print('candidates', len(tris), 'image', W, H)
def raster(S):   # texel centres inside the (slightly grown) triangle: xs, ys, barycentrics
    x0, y0 = np.floor(S.min(0) - 1).astype(int); x1, y1 = np.ceil(S.max(0) + 1).astype(int)
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W - 1), min(y1, H - 1)
    if x1 < x0 or y1 < y0: return None
    gy, gx = np.mgrid[y0:y1 + 1, x0:x1 + 1]; px = gx + .5; py = gy + .5
    (ax, ay), (bx, by), (cx, cy) = S; d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if abs(d) < 1e-9: return None
    l0 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d; l1 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d; l2 = 1 - l0 - l1
    e = -.02 / max(1e-6, 1)   # a hair's width of growth so shared edges leave no gaps
    ins = (l0 >= e) & (l1 >= e) & (l2 >= e)
    return gx[ins], gy[ins], np.stack([l0[ins], l1[ins], l2[ins]], -1)
ZB = np.full((H, W), -1.0); RS = []
for i, (k, t, T, UV, S, out_) in enumerate(tris):
    r_ = raster(S) if out_ else None; RS.append(r_)
    if r_ is None: continue
    xs, ys, l = r_; Pp = l @ T; rr = np.hypot(Pp[:, 0], Pp[:, 2] - ZC); np.maximum.at(ZB, (ys, xs), rr)
keep = []; COL = np.zeros((H, W, 3)); OWN = np.full((H, W), -1, np.int32)
for i, (k, t, T, UV, S, out_) in enumerate(tris):
    r_ = RS[i]
    if not out_: continue   # (facing inward: never the face's surface; kept in 'under' for the eye region)
    if r_ is None:
        c = T.mean(0); s = proj(c[None])[0].astype(int); s = np.clip(s, 0, [W - 1, H - 1])
        if np.hypot(c[0], c[2] - ZC) >= ZB[s[1], s[0]] - .004: keep.append(i)
        continue
    xs, ys, l = r_
    if len(xs) == 0:
        c = T.mean(0); s = np.clip(proj(c[None])[0].astype(int), 0, [W - 1, H - 1])
        if np.hypot(c[0], c[2] - ZC) >= ZB[s[1], s[0]] - .004: keep.append(i)
        continue
    Pp = l @ T; rr = np.hypot(Pp[:, 0], Pp[:, 2] - ZC); top = rr >= ZB[ys, xs] - .004
    if top.mean() >= .5: keep.append(i); uv = l @ UV; COL[ys, xs] = bil(uv[:, 0], uv[:, 1]); OWN[ys, xs] = i
print('kept', len(keep))
MASK = OWN >= 0
# texels just outside the island take their nearest neighbour's colour (mip and bilinear bleed)
C = COL.copy(); M = MASK.copy()
for _ in range(8):
    acc = np.zeros_like(C); n = np.zeros((H, W))
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        acc += np.roll(np.roll(C * M[..., None], dy, 0), dx, 1); n += np.roll(np.roll(M, dy, 0), dx, 1)
    grow_ = ~M & (n > 0); C[grow_] = acc[grow_] / n[grow_, None]; M = M | grow_
def save(path, a):
    a = np.ascontiguousarray(np.clip(a, 0, 1).astype(np.float32)); b = oiio.ImageBuf(oiio.ImageSpec(a.shape[1], a.shape[0], a.shape[2] if a.ndim == 3 else 1, oiio.FLOAT)); b.set_pixels(oiio.ROI(), a); b.write(path, oiio.UINT8)
save(os.path.join(OUT, 'face-bake.png'), C); save(os.path.join(OUT, 'face-mask.png'), MASK.astype(np.float32)[..., None])
ks = set(keep); under = np.array([(tris[i][0], tris[i][1], *proj(tris[i][2].mean(0)[None])[0]) for i in range(len(tris)) if i not in ks], np.float64).reshape(-1, 4)
np.savez_compressed(os.path.join(OUT, 'band.npz'), under=under, keep=np.array([(tris[i][0], tris[i][1]) for i in keep], np.int32), own=OWN, cfg=json.dumps(dict(CFG, H=H)),
                    prims=np.array([(mi, pi) for mi, pi, _, _ in prims], np.int32))
print('wrote', OUT)

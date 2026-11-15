# Step 1 of the face-UV face: a clean face UV, baked once, for any Meshy person (friend, villager, regional villager).
# The head's front (the face out to near the ears, chin to hairline) of the skin mesh gets one contiguous island in a
# cylindrical projection about the head's vertical axis; the original colour (Meshy's fragmented atlas) is copied onto
# it texel by texel through each triangle's own barycentric coordinates (exact, no ray casting, no misses).
# Only the outermost surface is taken (a z-buffer on the radius), so hair over the face or anything behind stays as it is.
# Beside the colour, the same copy bakes the skin mark (COLOR_0: red = skin, blue 0 = hair) and each texel's model x.
# Run with Blender's Python (numpy + OpenImageIO):  python bake.py <dressed.glb> <outdir> [model.json]
import sys, os, json, numpy as np, OpenImageIO as oiio
sys.path.insert(0, os.path.dirname(__file__)); import glb
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
J, B = glb.read(SRC)
# The picture's frame comes from the model itself (no per-model numbers): the head bone gives the vertical axis (XC, ZC);
# the body materials' eye_boxes (model metres, x0 x1 y0 y1 per eye) give the eye height; the head's size is the median
# radius RM of the outward surface at eye height. With s = RM / .15 (Sol's): R = .2 s, y from the eyes' middle - .21 s
# (never below the head bone: the neck) to + .17 s. Sol: R .2, Y0 1.14, Y1 1.52. Every model's picture is so laid out
# alike (eyes and mouth at about the same pixels), and the pixel sizes in eyes.py hold for all, times W / 1024.
# (The eye box's height is not a good size: Lumi's is 1.7 x Sol's, Mai's .8 x.)
# A model that needs another number gets it in models.json ("cfg": {...}, with the reason).
EB = next((m['extras']['eye_boxes'] for m in J['materials'] if 'eye_boxes' in m.get('extras', {})), None)
if EB is None: raise SystemExit('bake: no eye_boxes on the body materials (already a face-UV model?)')
_Wm = glb.world(J); _hb = next(i for i, n in enumerate(J['nodes']) if n.get('name') == 'head'); HB = _Wm[_hb][:3, 3]
XC, ZC = float(HB[0]), float(HB[2]); EYM = (EB[2] + EB[3]) / 2; EYH = EB[3] - EB[2]; TH = 1.2
SKIN = ('cloth-body', 'skin-tex')
def _rm():
    P = []; N = []
    for me in J['meshes']:
        for q in me['primitives']:
            if J['materials'][q['material']]['name'].startswith(SKIN):
                V = glb.acc(J, B, q['attributes']['POSITION']).astype(np.float64); I = glb.acc(J, B, q['indices']).reshape(-1, 3); T = V[I]; P.append(T.mean(1)); N.append(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]))
    P = np.concatenate(P); N = np.concatenate(N); rad = np.c_[P[:, 0] - XC, np.zeros(len(P)), P[:, 2] - ZC]
    sel = (abs(P[:, 1] - EYM) < EYH / 2) & ((N * rad).sum(1) > 0) & (abs(np.arctan2(rad[:, 0], rad[:, 2])) < TH)
    return float(np.median(np.hypot(rad[sel, 0], rad[sel, 2])))
RM = _rm(); SC = RM / .15
CFG = dict(R=.2 * SC, TH=TH, Y0=max(EYM - .21 * SC, float(HB[1])), Y1=EYM + .17 * SC, W=0, ZC=ZC, XC=XC)
if len(sys.argv) > 3 and sys.argv[3]: CFG.update(json.loads(open(sys.argv[3]).read()).get('cfg', {}))   # (the model's row, written by model.py)
R, TH, Y0, Y1, W, ZC, XC = CFG['R'], CFG['TH'], CFG['Y0'], CFG['Y1'], CFG['W'], CFG['ZC'], CFG['XC']
def save(path, a):
    a = np.ascontiguousarray(np.clip(a, 0, 1).astype(np.float32)); b = oiio.ImageBuf(oiio.ImageSpec(a.shape[1], a.shape[0], a.shape[2] if a.ndim == 3 else 1, oiio.FLOAT)); b.set_pixels(oiio.ROI(), a); b.write(path, oiio.UINT8)

# the body's colour picture: the image the skin primitives use
prims = []
for mi, me in enumerate(J['meshes']):
    for pi, p in enumerate(me['primitives']):
        m = J['materials'][p['material']]; t = m.get('pbrMetallicRoughness', {}).get('baseColorTexture')
        if t is None or not m['name'].startswith(SKIN): continue
        prims.append((mi, pi, p, glb.tex_image(J, t['index'])))
src_img = prims[0][3]; assert all(x[3] == src_img for x in prims)
_ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[J['images'][src_img]['mimeType']]
tmp = os.path.join(OUT, 'atlas-src.' + _ext); open(tmp, 'wb').write(glb.view_bytes(J, B, J['images'][src_img]['bufferView']))
TEX = oiio.ImageBuf(tmp).get_pixels(oiio.FLOAT)[..., :3]; TH_, TW_ = TEX.shape[:2]
if _ext != 'png': save(os.path.join(OUT, 'atlas-src.png'), TEX)   # (build.py reads this one)
# the face picture's width follows the model's own picture: 1024 for a 2048 atlas, 512 for 1024, 256 below
if not W: W = CFG['W'] = 1024 if TW_ >= 2048 else 512 if TW_ >= 1024 else 256
H = int(round(W * (Y1 - Y0) / (2 * TH * R)))
def proj(P):   # metres -> face-image pixels (x right = model +x, y down)
    th = np.arctan2(P[..., 0] - XC, P[..., 2] - ZC)
    return np.stack([(th + TH) / (2 * TH) * W, (Y1 - P[..., 1]) / (Y1 - Y0) * H], -1)
print('frame: head bone', HB.round(3), 'eye y', round(EYM, 3), 'median radius', round(RM, 3), 'scale', round(SC, 3), 'cfg', {k: round(v, 4) for k, v in CFG.items()}, 'atlas', TW_, TH_)
def bil(u, v):   # glTF uv (v down) -> colour, bilinear, wrap clamp
    x = np.clip(u * TW_ - .5, 0, TW_ - 1.001); y = np.clip(v * TH_ - .5, 0, TH_ - 1.001); x0 = x.astype(int); y0 = y.astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    return (TEX[y0, x0] * (1 - fx) * (1 - fy) + TEX[y0, x0 + 1] * fx * (1 - fy) + TEX[y0 + 1, x0] * (1 - fx) * fy + TEX[y0 + 1, x0 + 1] * fx * fy)
# candidates: triangles in the domain, facing outward
tris = []   # (prim k, tri index, P(3,3), UV(3,2), S(3,2), outward, mark(3,3))
for k, (mi, pi, p, _) in enumerate(prims):
    P = glb.acc(J, B, p['attributes']['POSITION']).astype(np.float64); UV = glb.acc(J, B, p['attributes']['TEXCOORD_0']).astype(np.float64)
    MK = glb.acc(J, B, p['attributes']['COLOR_0']).astype(np.float64)[:, :3] if 'COLOR_0' in p['attributes'] else np.ones((len(P), 3))
    I = glb.acc(J, B, p['indices']).reshape(-1, 3); T = P[I]; c = T.mean(1)
    n = np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]); rad = np.c_[c[:, 0] - XC, np.zeros(len(c)), c[:, 2] - ZC]
    th = np.arctan2(c[:, 0] - XC, c[:, 2] - ZC)
    ok = (abs(th) < TH * .985) & (c[:, 1] > Y0 + .004) & (c[:, 1] < Y1 - .004) & (c[:, 2] > ZC); out_ = (n * rad).sum(1) > 0
    S = proj(T)
    ok &= (S[..., 0].min(1) > 3) & (S[..., 0].max(1) < W - 3) & (S[..., 1].min(1) > 3) & (S[..., 1].max(1) < H - 3)   # (every corner inside the picture: a corner outside would look into the next mood tile)
    for t in np.nonzero(ok)[0]: tris.append((k, int(t), T[t], UV[I[t]], S[t], bool(out_[t]), MK[I[t]]))
print('candidates', len(tris), 'image', W, H)
def raster(S):   # texel centres inside the (slightly grown) triangle: xs, ys, barycentrics
    x0, y0 = np.floor(S.min(0) - 1).astype(int); x1, y1 = np.ceil(S.max(0) + 1).astype(int)
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W - 1), min(y1, H - 1)
    if x1 < x0 or y1 < y0: return None
    gy, gx = np.mgrid[y0:y1 + 1, x0:x1 + 1]; px = gx + .5; py = gy + .5
    (ax, ay), (bx, by), (cx, cy) = S; d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if abs(d) < 1e-9: return None
    l0 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d; l1 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d; l2 = 1 - l0 - l1
    e = -.02   # a hair's width of growth so shared edges leave no gaps
    ins = (l0 >= e) & (l1 >= e) & (l2 >= e)
    return gx[ins], gy[ins], np.stack([l0[ins], l1[ins], l2[ins]], -1)
ZB = np.full((H, W), -1.0); RS = []
for i, (k, t, T, UV, S, out_, MK) in enumerate(tris):
    r_ = raster(S) if out_ else None; RS.append(r_)
    if r_ is None: continue
    xs, ys, l = r_; Pp = l @ T; rr = np.hypot(Pp[:, 0] - XC, Pp[:, 2] - ZC); np.maximum.at(ZB, (ys, xs), rr)
keep = []; COL = np.zeros((H, W, 3)); MRK = np.zeros((H, W, 3)); XM = np.zeros((H, W), np.float32); OWN = np.full((H, W), -1, np.int32)
for i, (k, t, T, UV, S, out_, MK) in enumerate(tris):
    r_ = RS[i]
    if not out_: continue   # (facing inward: never the face's surface; kept in 'under' for the eye region)
    if r_ is None or len(r_[0]) == 0:
        c = T.mean(0); s = np.clip(proj(c[None])[0].astype(int), 0, [W - 1, H - 1])
        if np.hypot(c[0] - XC, c[2] - ZC) >= ZB[s[1], s[0]] - .004: keep.append(i)
        continue
    xs, ys, l = r_
    Pp = l @ T; rr = np.hypot(Pp[:, 0] - XC, Pp[:, 2] - ZC); top = rr >= ZB[ys, xs] - .004
    if top.mean() >= .5: keep.append(i); uv = l @ UV; COL[ys, xs] = bil(uv[:, 0], uv[:, 1]); MRK[ys, xs] = l @ MK; XM[ys, xs] = Pp[:, 0]; OWN[ys, xs] = i
print('kept', len(keep))
MASK = OWN >= 0
# texels just outside the island take their nearest neighbour's colour (mip and bilinear bleed)
C = COL.copy(); M = MASK.copy()
for _ in range(8):
    acc = np.zeros_like(C); n = np.zeros((H, W))
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        acc += np.roll(np.roll(C * M[..., None], dy, 0), dx, 1); n += np.roll(np.roll(M, dy, 0), dx, 1)
    grow_ = ~M & (n > 0); C[grow_] = acc[grow_] / n[grow_, None]; M = M | grow_
save(os.path.join(OUT, 'face-bake.png'), C); save(os.path.join(OUT, 'face-mask.png'), MASK.astype(np.float32)[..., None]); save(os.path.join(OUT, 'face-mark.png'), MRK)
ks = set(keep); under = np.array([(tris[i][0], tris[i][1], *proj(tris[i][2].mean(0)[None])[0]) for i in range(len(tris)) if i not in ks], np.float64).reshape(-1, 4)
np.savez_compressed(os.path.join(OUT, 'band.npz'), under=under, keep=np.array([(tris[i][0], tris[i][1]) for i in keep], np.int32), own=OWN, xm=XM, cfg=json.dumps(dict(CFG, H=H)),
                    prims=np.array([(mi, pi) for mi, pi, _, _ in prims], np.int32))
json.dump(dict(CFG, H=H, eye_boxes=[float(x) for x in EB[:8]], head_bone=[float(x) for x in HB], radius=RM, scale=SC, atlas=[TW_, TH_], src=SRC,
               px_per_mm=[W / (2 * TH * RM) / 1000, H / (Y1 - Y0) / 1000], face_tris=len(keep), under_tris=len(under)), open(os.path.join(OUT, 'cfg.json'), 'w'), indent=1)
print('wrote', OUT)

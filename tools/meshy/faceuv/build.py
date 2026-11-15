# Step 3b of the face-UV face: the game model, for any Meshy person. The baked face triangles leave the body and become one mesh per mood
# ("face-<mood>", shown by js/friend-model.ts like the old pieces), all sharing the same corners and each looking at its
# own tile of one mood atlas: the head's real surface, so every view matches. The old floating eye pieces go; the old
# pieces stay for the mouths only (their eye part made see-through); the body loses its eye_boxes (the old eye repaint
# in the shader is then off for this model only: the flag is the model's own data, other models are unchanged).
#   python build.py <dressed.glb> <bakedir> <out.glb> <id>
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__)); import glb; from img import *
SRC, D, OUT, ID = sys.argv[1:5]
J, B = glb.read(SRC); Z = np.load(os.path.join(D, 'band.npz')); CFG = json.loads(str(Z['cfg']))
R, TH, Y0, Y1, W, H, ZC, XC = CFG['R'], CFG['TH'], CFG['Y0'], CFG['Y1'], CFG['W'], CFG['H'], CFG['ZC'], CFG['XC']
ORDER = ['smile', 'blink', 'half', 'happy', 'surprised', 'sad', 'lookL', 'lookR', 'excited']
KS = W / 1024.; AT = int(os.environ.get('FACEUV_ATLAS', 2 * W)); N_ = 3; T_ = AT // N_; G_ = max(3, int(round(8 * AT / 2048.)))   # atlas (2048 for a 1024 face picture), tiles per row, tile, gutter
ISL = load(os.path.join(D, 'face-mask.png'))[..., 0] > .5
def proj(P):
    th = np.arctan2(P[..., 0] - XC, P[..., 2] - ZC); return np.stack([(th + TH) / (2 * TH) * W, (Y1 - P[..., 1]) / (Y1 - Y0) * H], -1)
prims = [tuple(x) for x in Z['prims']]; keep = Z['keep']
# (first game shots: dark ticks, pale flecks and arcs beside the closed eyes at turned views) Meshy's surface is doubled
# and folded round the eyes: body triangles under or beside the face's own surface there (not its outermost layer in the
# projection, or facing inward) still carried the painted open eye and showed past it. Dropping them left holes (a dark
# ring round the open eye at three-quarters). So every such triangle whose middle lies in an eye hole (grown 24 px) joins
# the face meshes with a small cell of its own in a strip under the face picture: its own original colour, replaced by the
# mood picture's colour at its projected place wherever the mood changed that place (so: skin on shut eyes, as painted
# on open ones).
EYEM = dilate(load(os.path.join(D, 'eye-hole-full.png'))[..., 0] > .5, max(2, int(round(24 * KS)))); U = Z['under']
uin = EYEM[np.clip(U[:, 3].astype(int), 0, H - 1), np.clip(U[:, 2].astype(int), 0, W - 1)] if len(U) else np.zeros(0, bool)
extra = U[uin][:, :2].astype(int); CELL = max(12, int(round(32 * KS))); MG = max(2, int(round(5 * KS))); PER = W // CELL; SH = CELL * max(1, -(-len(extra) // PER)); HT = H + SH
print('under-layer triangles round the eyes given cells', len(extra), 'of', len(U), 'strip', SH, 'px')
TEX = load(os.path.join(D, 'atlas-src.png'))[..., :3]; TH_, TW_ = TEX.shape[:2]
def bil(A, x, y):   # pixel-centre coordinates -> colour
    hh, ww = A.shape[:2]; x = np.clip(x - .5, 0, ww - 1.001); y = np.clip(y - .5, 0, hh - 1.001); x0 = x.astype(int); y0 = y.astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    return A[y0, x0] * (1 - fx) * (1 - fy) + A[y0, x0 + 1] * fx * (1 - fy) + A[y0 + 1, x0] * (1 - fx) * fy + A[y0 + 1, x0 + 1] * fx * fy
F0 = load(os.path.join(D, 'face-bake.png'))[..., :3]
HOLE = blur(dilate(load(os.path.join(D, 'eye-hole-full.png'))[..., 0] > .5, max(1, int(round(6 * KS)))).astype(np.float32), 2)   # (the eye's whole hole, the part under hair too)
HAIRM = load(os.path.join(D, 'eye-hair.png'))[..., 0] > .5; USK = load(os.path.join(D, 'face-underskin.png'))[..., :3]   # under a lock over the eye, the surface below takes the skin as it would be without the lock
cells = []   # per extra triangle: (cell origin, old-atlas colour, projected px) for every texel of its cell
CORN = np.array([[MG, MG], [CELL - MG - 1., MG], [MG, CELL - MG - 1.]], np.float64)
gy, gx = np.mgrid[0:CELL, 0:CELL]; cx_ = gx + .5; cy_ = gy + .5
l1 = (cx_ - MG) / (CELL - 2 * MG - 1); l2 = (cy_ - MG) / (CELL - 2 * MG - 1); l0 = 1 - l1 - l2; Lc = np.clip(np.stack([l0, l1, l2], -1), 0, None); Lc = Lc / Lc.sum(-1, keepdims=True)
PA = {}; UA = {}; IA = {}
for k, (mi, pi) in enumerate(prims):
    p = J['meshes'][mi]['primitives'][pi]; PA[k] = glb.acc(J, B, p['attributes']['POSITION']).astype(np.float64); UA[k] = glb.acc(J, B, p['attributes']['TEXCOORD_0']).astype(np.float64); IA[k] = glb.acc(J, B, p['indices']).reshape(-1, 3)
for j, (k, t) in enumerate(extra):
    vi = IA[k][t]; uv = Lc @ UA[k][vi]; sp = Lc @ proj(PA[k][vi])
    cells.append(((j % PER) * CELL, H + (j // PER) * CELL, bil(TEX, uv[..., 0] * TW_, uv[..., 1] * TH_), sp))
atlas = np.zeros((AT, AT, 3), np.float32)
for i, k in enumerate(ORDER):
    m = load(os.path.join(D, 'mood-%s.png' % k))[..., :3]
    full = np.zeros((HT, W, 3), np.float32)
    full[:H] = harmonic(m, ~dilate(ISL, 6), 60)   # the whole tile filled smoothly beyond the island (no black at low mip levels)
    full[H:] = full[H - 1:H]
    for (ox, oy, orig, sp) in cells:
        mc = bil(m, sp[..., 0], sp[..., 1]); fc = bil(F0, sp[..., 0], sp[..., 1]); al = np.clip(np.abs(mc - fc).max(-1) * 12, 0, 1)[..., None]
        if k in ('blink', 'happy', 'excited'):
            iy_ = np.clip(sp[..., 1].astype(int), 0, H - 1); ix_ = np.clip(sp[..., 0].astype(int), 0, W - 1); al = np.maximum(al, HOLE[iy_, ix_][..., None]); mc = np.where(HAIRM[iy_, ix_][..., None], bil(USK, sp[..., 0], sp[..., 1]), mc)   # (pale slivers beside shut eyes: a cell under the hole's faded rim kept part of its eye white; on fully shut eyes the whole hole is the mood picture's skin)
        full[oy:oy + CELL, ox:ox + CELL] = orig * (1 - al) + mc * al
    t = resize(full, T_ - 2 * G_, T_ - 2 * G_); t = np.pad(t, ((G_, G_), (G_, G_), (0, 0)), mode='edge')
    r, c = divmod(i, N_); atlas[r * T_:(r + 1) * T_, c * T_:(c + 1) * T_] = t
    if k == 'blink': save(os.path.join(D, 'tile-blink.png'), full)
WEBP = any(im.get('mimeType') == 'image/webp' for im in J['images']); AEXT = 'webp' if WEBP else 'jpg'   # (a model whose pictures are WebP, the villagers, gets WebP: Mai's atlas 93 KB against 239 as JPEG)
ATLAS = os.path.join(D, 'mood-atlas.' + AEXT); save(ATLAS, atlas)
# corners of the band triangles, gathered from the two body primitives
attrs = {'POSITION': [], 'NORMAL': [], 'COLOR_0': [], 'JOINTS_0': [], 'WEIGHTS_0': []}; idx = []; base = 0
body_node = None
for k, (mi, pi) in enumerate(prims):
    p = J['meshes'][mi]['primitives'][pi]; I = glb.acc(J, B, p['indices']).reshape(-1, 3)
    tk = keep[keep[:, 0] == k, 1]; band = np.zeros(len(I), bool); band[tk] = True; gone_ = np.zeros(len(I), bool); gone_[extra[extra[:, 0] == k, 1]] = True
    used = np.unique(I[band]); remap = -np.ones(int(I.max()) + 1, np.int64); remap[used] = np.arange(len(used)) + base
    for a in attrs: attrs[a].append(glb.acc(J, B, p['attributes'][a])[used])
    idx.append(remap[I[band]]); base += len(used)
    rest = I[~band & ~gone_].reshape(-1); ct = J['accessors'][p['indices']]['componentType']
    p['indices'] = glb.add_acc(J, B, rest, ct, 'SCALAR', 34963)
    print('prim', mi, pi, 'tris', len(I), '-> body', (~band).sum(), 'face', band.sum())
    for ni, n in enumerate(J['nodes']):
        if n.get('mesh') == mi: body_node = ni
# the extra triangles: three corners of their own each (their cells are separate islands)
nband = base; xs_px = []; ACACHE = {}
for j, (k, t) in enumerate(extra):
    p = J['meshes'][prims[k][0]]['primitives'][prims[k][1]]; vi = IA[k][t]
    for a in attrs: attrs[a].append(ACACHE.setdefault((k, a), glb.acc(J, B, p['attributes'][a]))[vi])
    idx.append(np.arange(3)[None] + base); base += 3; ox, oy = cells[j][0], cells[j][1]; xs_px.append(CORN + [ox, oy])
for a in attrs: attrs[a] = np.concatenate(attrs[a])
idx = np.concatenate(idx).reshape(-1)
src_types = {a: J['accessors'][J['meshes'][prims[0][0]]['primitives'][prims[0][1]]['attributes'][a]]['componentType'] for a in attrs}
shared = {'POSITION': glb.add_acc(J, B, attrs['POSITION'], 5126, 'VEC3', 34962, minmax=True), 'NORMAL': glb.add_acc(J, B, attrs['NORMAL'], 5126, 'VEC3', 34962),
          'COLOR_0': glb.add_acc(J, B, attrs['COLOR_0'], 5126, 'VEC4', 34962), 'JOINTS_0': glb.add_acc(J, B, attrs['JOINTS_0'], src_types['JOINTS_0'], 'VEC4', 34962),
          'WEIGHTS_0': glb.add_acc(J, B, attrs['WEIGHTS_0'], 5126, 'VEC4', 34962)}
ia = glb.add_acc(J, B, idx, 5125 if base > 65535 else 5123, 'SCALAR', 34963)
S = proj(attrs['POSITION'].astype(np.float64))
if len(extra): S[nband:] = np.concatenate(xs_px)
print('face corners', base, 'tris', len(idx) // 3, 'proj range', S.min(0), S.max(0))
# the atlas image, its texture, one material per mood
iv = glb.add_view(J, B, open(ATLAS, 'rb').read()); J['images'].append({'name': ID + '-face-moods', 'mimeType': 'image/webp' if WEBP else 'image/jpeg', 'bufferView': iv})
J['textures'].append({'sampler': 0, 'extensions': {'EXT_texture_webp': {'source': len(J['images']) - 1}}} if WEBP else {'sampler': 0, 'source': len(J['images']) - 1}); tex = len(J['textures']) - 1
skin_m = next(m for m in J['materials'] if m['name'].startswith('skin-tex'))
for m in J['materials']:
    ex = m.get('extras', {})
    if 'eye_boxes' in ex:   # (the old eye repaint off for this model; the regional villagers' eye_ovals and lid_ numbers go with it)
        for k_ in [k_ for k_ in ex if k_.startswith(('eye_', 'lid_'))]: del ex[k_]
        ex['face_uv'] = 'faceuv'
bn = J['nodes'][body_node]; parent = next((i for i, n in enumerate(J['nodes']) if body_node in n.get('children', [])), None)
new_nodes = []
for i, k in enumerate(ORDER):
    r, c = divmod(i, N_)
    uv = np.stack([(c * T_ + G_ + S[:, 0] / W * (T_ - 2 * G_)) / AT, (r * T_ + G_ + S[:, 1] / HT * (T_ - 2 * G_)) / AT], -1)
    ua = glb.add_acc(J, B, uv, 5126, 'VEC2', 34962)
    J['materials'].append({'name': 'face-' + k, 'pbrMetallicRoughness': {'baseColorTexture': {'index': tex}, 'metallicFactor': 0, 'roughnessFactor': 1},
                           'doubleSided': skin_m.get('doubleSided', False),
                           'extras': {'skin_mark': True, 'skin_paint': skin_m['extras'].get('skin_paint'), 'face_uv': 'faceuv'}})
    J['meshes'].append({'name': ID + '-face-' + k, 'primitives': [{'attributes': dict(shared, TEXCOORD_0=ua), 'indices': ia, 'material': len(J['materials']) - 1}]})
    n = {'name': ID + '-face-' + k, 'mesh': len(J['meshes']) - 1, 'skin': bn['skin']}
    for t in ('translation', 'rotation', 'scale', 'matrix'):
        if t in bn: n[t] = bn[t]
    J['nodes'].append(n); new_nodes.append(len(J['nodes']) - 1)
if parent is None:
    for sc in J['scenes']:
        if body_node in sc['nodes']: sc['nodes'] += new_nodes
else: J['nodes'][parent]['children'] += new_nodes
# the old pieces: eye-only moods removed, the rest keep their mouths only
EYE_ONLY = {'smile', 'blink', 'half', 'happy', 'lookL', 'lookR'}
gone = [i for i, n in enumerate(J['nodes']) if 'mesh' in n and J['meshes'][n['mesh']]['primitives'][0].get('material') is not None
        and J['materials'][J['meshes'][n['mesh']]['primitives'][0]['material']].get('extras', {}).get('own_face') and J['nodes'][i]['name'][5:] in EYE_ONLY]
for n in J['nodes']:
    if 'children' in n: n['children'] = [c for c in n['children'] if c not in gone]
for sc in J['scenes']: sc['nodes'] = [c for c in sc['nodes'] if c not in gone]
print('old eye pieces removed', [J['nodes'][i]['name'] for i in gone])
# what is left of the old pieces (surprised, sad, excited) keeps its mouth only: each piece's texels above the eye_box's
# lower edge (found through the piece's own corners: its picture's v is linear in the model's height) are made see-through
EB = json.load(open(os.path.join(D, 'cfg.json')))['eye_boxes']; YCUT = EB[2] - .005
oldm = [m for m in J['materials'] if m.get('extras', {}).get('own_face')]
if oldm:
    ot = oldm[0]['pbrMetallicRoughness']['baseColorTexture']['index']; oi = glb.tex_image(J, ot); ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[J['images'][oi]['mimeType']]
    p0 = os.path.join(D, 'old-pieces.' + ext); open(p0, 'wb').write(glb.view_bytes(J, B, J['images'][oi]['bufferView']))
    a = load_ua(p0); ah, aw = a.shape[:2]; cut = 0   # (as stored: read premultiplied, the see-through texels' skin colour became black and the mouths had a grey patch round them far away)
    for n in J['nodes']:
        if 'mesh' not in n: continue
        q = J['meshes'][n['mesh']]['primitives'][0]
        if q.get('material') is None or not J['materials'][q['material']].get('extras', {}).get('own_face') or n['name'][5:] in EYE_ONLY: continue
        P = glb.acc(J, B, q['attributes']['POSITION']).astype(np.float64); UV = glb.acc(J, B, q['attributes']['TEXCOORD_0']).astype(np.float64)
        ca, cb = np.polyfit(P[:, 1], UV[:, 1], 1); vc = ca * YCUT + cb; v0, v1 = UV[:, 1].min(), UV[:, 1].max(); u0, u1 = UV[:, 0].min(), UV[:, 0].max()
        r0, r1 = (int(np.floor(v0 * ah)) - 1, int(np.ceil(vc * ah))) if ca < 0 else (int(np.floor(vc * ah)), int(np.ceil(v1 * ah)) + 1)   # (v grows downward as the height falls: the eyes are the rows above the cut)
        a[max(r0, 0):min(r1, ah), max(int(u0 * aw) - 1, 0):min(int(np.ceil(u1 * aw)) + 1, aw), 3] = 0; cut += 1
        print('old piece', n['name'], 'eye rows made see-through', max(r0, 0), min(r1, ah), 'of its rows', int(v0 * ah), int(v1 * ah))
    pm = os.path.join(D, 'old-pieces-mouth.' + ('webp' if ext == 'webp' else 'png')); save_ua(pm, a)   # (kept in the picture format it had)
    J['images'][oi] = {'name': J['images'][oi].get('name', 'face'), 'mimeType': 'image/webp' if ext == 'webp' else 'image/png', 'bufferView': glb.add_view(J, B, open(pm, 'rb').read())}
json.dump({'face_corners': int(base), 'face_tris': int(len(idx) // 3), 'under_cells': int(len(extra)), 'atlas': AT, 'tile': T_, 'face_picture': [W, H], 'strip': SH, 'atlas_kb': os.path.getsize(ATLAS) // 1024, 'atlas_format': AEXT, 'old_eye_pieces_removed': len(gone)}, open(os.path.join(D, 'build.json'), 'w'), indent=1)
glb.write(OUT, J, B); print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')

# Step 3b of the sol-eyes face: the game model. The baked face triangles leave the body and become one mesh per mood
# ("face-<mood>", shown by js/friend-model.ts like the old pieces), all sharing the same corners and each looking at its
# own tile of one mood atlas: the head's real surface, so every view matches. The old floating eye pieces go; the old
# pieces stay for the mouths only (their eye part made see-through); the body loses its eye_boxes (the old eye repaint
# in the shader is then off for this model only: the flag is the model's own data, other models are unchanged).
#   python build.py <dressed-hd.glb> <bakedir> <out.glb>
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__)); import glb; from img import *
SRC, D, OUT = sys.argv[1:4]
J, B = glb.read(SRC); Z = np.load(os.path.join(D, 'band.npz')); CFG = json.loads(str(Z['cfg']))
R, TH, Y0, Y1, W, H, ZC = CFG['R'], CFG['TH'], CFG['Y0'], CFG['Y1'], CFG['W'], CFG['H'], CFG['ZC']
ORDER = ['smile', 'blink', 'half', 'happy', 'surprised', 'sad', 'lookL', 'lookR', 'excited']
T_, G_, N_ = 682, 8, 3; AT = T_ * N_ + 2   # tile, gutter, tiles per row; atlas 2048
ISL = load(os.path.join(D, 'face-mask.png'))[..., 0] > .5
atlas = np.zeros((AT, AT, 3), np.float32)
for i, k in enumerate(ORDER):
    m = load(os.path.join(D, 'mood-%s.png' % k))[..., :3]
    m = harmonic(m, ~dilate(ISL, 6), 60)   # the whole tile filled smoothly beyond the island (no black at low mip levels)
    t = resize(m, T_ - 2 * G_, T_ - 2 * G_); t = np.pad(t, ((G_, G_), (G_, G_), (0, 0)), mode='edge')
    r, c = divmod(i, N_); atlas[r * T_:(r + 1) * T_, c * T_:(c + 1) * T_] = t
save(os.path.join(D, 'mood-atlas.jpg'), atlas)
def proj(P):
    th = np.arctan2(P[..., 0], P[..., 2] - ZC); return np.stack([(th + TH) / (2 * TH) * W, (Y1 - P[..., 1]) / (Y1 - Y0) * H], -1)
prims = [tuple(x) for x in Z['prims']]; keep = Z['keep']
# corners of the band triangles, gathered from the two body primitives
attrs = {'POSITION': [], 'NORMAL': [], 'COLOR_0': [], 'JOINTS_0': [], 'WEIGHTS_0': []}; idx = []; base = 0
body_node = None
for k, (mi, pi) in enumerate(prims):
    p = J['meshes'][mi]['primitives'][pi]; I = glb.acc(J, B, p['indices']).reshape(-1, 3)
    tk = keep[keep[:, 0] == k, 1]; band = np.zeros(len(I), bool); band[tk] = True
    used = np.unique(I[band]); remap = -np.ones(int(I.max()) + 1, np.int64); remap[used] = np.arange(len(used)) + base
    for a in attrs: attrs[a].append(glb.acc(J, B, p['attributes'][a])[used])
    idx.append(remap[I[band]]); base += len(used)
    rest = I[~band].reshape(-1); ct = J['accessors'][p['indices']]['componentType']
    p['indices'] = glb.add_acc(J, B, rest, ct, 'SCALAR', 34963)
    print('prim', mi, pi, 'tris', len(I), '-> body', (~band).sum(), 'face', band.sum())
    for ni, n in enumerate(J['nodes']):
        if n.get('mesh') == mi: body_node = ni
for a in attrs: attrs[a] = np.concatenate(attrs[a])
idx = np.concatenate(idx).reshape(-1)
src_types = {a: J['accessors'][J['meshes'][prims[0][0]]['primitives'][prims[0][1]]['attributes'][a]]['componentType'] for a in attrs}
shared = {'POSITION': glb.add_acc(J, B, attrs['POSITION'], 5126, 'VEC3', 34962, minmax=True), 'NORMAL': glb.add_acc(J, B, attrs['NORMAL'], 5126, 'VEC3', 34962),
          'COLOR_0': glb.add_acc(J, B, attrs['COLOR_0'], 5126, 'VEC4', 34962), 'JOINTS_0': glb.add_acc(J, B, attrs['JOINTS_0'], src_types['JOINTS_0'], 'VEC4', 34962),
          'WEIGHTS_0': glb.add_acc(J, B, attrs['WEIGHTS_0'], 5126, 'VEC4', 34962)}
ia = glb.add_acc(J, B, idx, 5125 if base > 65535 else 5123, 'SCALAR', 34963)
S = proj(attrs['POSITION'].astype(np.float64)); print('face corners', base, 'tris', len(idx) // 3, 'proj range', S.min(0), S.max(0))
# the atlas image, its texture, one material per mood
open(os.path.join(D, 'mood-atlas.jpg'), 'rb').read()
iv = glb.add_view(J, B, open(os.path.join(D, 'mood-atlas.jpg'), 'rb').read()); J['images'].append({'name': 'sol-face-moods', 'mimeType': 'image/jpeg', 'bufferView': iv})
J['textures'].append({'sampler': 0, 'source': len(J['images']) - 1}); tex = len(J['textures']) - 1
skin_m = next(m for m in J['materials'] if m['name'].startswith('skin-tex'))
for m in J['materials']:
    ex = m.get('extras', {})
    if 'eye_boxes' in ex: del ex['eye_boxes']; ex['face_uv'] = 'soleyes'   # (the old eye repaint off for this model)
bn = J['nodes'][body_node]; parent = next((i for i, n in enumerate(J['nodes']) if body_node in n.get('children', [])), None)
new_nodes = []
for i, k in enumerate(ORDER):
    r, c = divmod(i, N_)
    uv = np.stack([(c * T_ + G_ + S[:, 0] / W * (T_ - 2 * G_)) / AT, (r * T_ + G_ + S[:, 1] / H * (T_ - 2 * G_)) / AT], -1)
    ua = glb.add_acc(J, B, uv, 5126, 'VEC2', 34962)
    J['materials'].append({'name': 'face-' + k, 'pbrMetallicRoughness': {'baseColorTexture': {'index': tex}, 'metallicFactor': 0, 'roughnessFactor': 1},
                           'doubleSided': skin_m.get('doubleSided', False),
                           'extras': {'skin_mark': True, 'skin_paint': skin_m['extras'].get('skin_paint'), 'face_uv': 'soleyes'}})
    J['meshes'].append({'name': 'sol-face-' + k, 'primitives': [{'attributes': dict(shared, TEXCOORD_0=ua), 'indices': ia, 'material': len(J['materials']) - 1}]})
    n = {'name': 'sol-face-' + k, 'mesh': len(J['meshes']) - 1, 'skin': bn['skin']}
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
old = next(m for m in J['materials'] if m.get('extras', {}).get('own_face'))['pbrMetallicRoughness']['baseColorTexture']['index']
oi = J['textures'][old]['source']; p0 = os.path.join(D, 'old-pieces.png'); open(p0, 'wb').write(glb.view_bytes(J, B, J['images'][oi]['bufferView']))
a = load(p0); tt = a.shape[0] // 3
for r in range(3): a[r * tt:r * tt + int(tt * .635), :, 3] = 0   # (each tile's eye rows; the mouths are below .66 of a tile)
save(os.path.join(D, 'old-pieces-mouth.png'), a)
J['images'][oi] = {'name': J['images'][oi].get('name', 'face'), 'mimeType': 'image/png', 'bufferView': glb.add_view(J, B, open(os.path.join(D, 'old-pieces-mouth.png'), 'rb').read())}
glb.write(OUT, J, B); print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')

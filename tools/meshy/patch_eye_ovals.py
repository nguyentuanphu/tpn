# (13 Nov 2026) Adds eye_ovals and eye_skin (what fit_people.py now writes) to an already fitted villager glb, without a refit:
#   python -I tools/meshy/patch_eye_ovals.py models/villager-<id>.glb <fitted/<id>/F.png> "<hair r,g,b>" <the person's FIT_ flags as for face_moods_preview.py>
import sys, os, math, colorsys, json, struct, numpy as np
from PIL import Image
glb, fp, hc = sys.argv[1:4]
for kv in sys.argv[4:]: k, v = kv.split('=', 1); os.environ[k] = v
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fit_people.py'), encoding='utf-8').read()
a = src.index("SKIN_SMAX = float(os.environ.get('FIT_SKIN_SMAX') or .44)   # (set again"); b = src.index('\natlas = np.zeros', a)
code = src[a:b]
hs0 = src.index('def hsv_np'); code = src[hs0:src.index('def back_hair', hs0)] + code
h0 = code.index('    _hc = []'); h1 = code.index('    _c = _nc or _c\n') + len('    _c = _nc or _c\n')
code = code[:h0] + '    _c = [np.array([' + hc + '])]\n' + code[h1:]
F = np.asarray(Image.open(fp).convert('RGBA'), np.float32) / 255; F = F.copy()
g = dict(np=np, os=os, math=math, colorsys=colorsys, F=F, ORIGINAL=True, OWN=True, SHIFT=False, SKIN_REF=None, TILE=F.shape[0])
exec(code, g)
eyes = list(g['eyes'].values())[:2]; W_, H_ = g['W_'], g['H_']
d = bytearray(open(glb, 'rb').read()); n = struct.unpack('<I', d[12:16])[0]; j = json.loads(d[20:20 + n])
eb = next(m['extras']['eye_boxes'] for m in j['materials'] if 'eye_boxes' in m.get('extras', {}))
# solve x = fx0 + px * k from each eye's outer edge, z = fz1 - py * m from the boxes' heights
P, X = [], []
for i, bb in enumerate(eyes):
    B = eb[i * 4:i * 4 + 4]
    if B[1] == 0: P.append(bb[0] - 18); X.append(B[0])
    else: P.append(bb[2] + 18); X.append(B[1])
k = (X[1] - X[0]) / (P[1] - P[0]); fx0 = X[0] - P[0] * k
B = eb[0:4]; bb = eyes[0]; m = (B[3] - B[2]) / ((bb[3] + 10) - (bb[1] - 10)); fz1 = B[3] + (bb[1] - 10) * m
eo = []
for bb in eyes:
    w, h = bb[2] - bb[0], bb[3] - bb[1]; x0, x1, y0, y1 = bb[0] - w * .14, bb[2] + w * .14, bb[1] - h * .22, bb[3] + h * .28
    eo += [fx0 + (x0 + x1) / 2 * k, fz1 - (y0 + y1) / 2 * m, (x1 - x0) / 2 * abs(k), (y1 - y0) / 2 * abs(m)]
print('eyes', eyes, 'ovals', eo)
xx, yy, Fm = g['xx'], g['yy'], g['F']
rk = np.zeros(Fm.shape[:2], bool)
for bb in eyes:
    w, h = bb[2] - bb[0], bb[3] - bb[1]; dd = np.hypot((xx - (bb[0] + bb[2]) / 2) / (w * .64 + 1), (yy - (bb[1] + bb[3]) / 2) / (h * .75 + 1)); rk |= (dd > 1) & (dd < 1.35)
rk &= g['skin_mask'](Fm) & ~g['HAIRISH']
es = [float(x) for x in np.median(Fm[rk][:, :3], axis=0)]; print('eye skin', es, int(rk.sum()))
for mm in j['materials']:
    if 'eye_boxes' in mm.get('extras', {}): mm['extras']['eye_ovals'] = eo; mm['extras']['eye_skin'] = es
js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4)
rest = d[20 + n:]
out = d[:12] + struct.pack('<I', len(js)) + d[16:20] + js + rest
out[8:12] = struct.pack('<I', len(out))
open(glb, 'wb').write(out); print('patched', glb)

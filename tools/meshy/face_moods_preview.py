# (12 Nov 2026, regional pilot, owner: "mắt nặng nhất") Preview a person's nine mood faces in seconds, without Blender:
# runs fit_people.py's mood section (from the skin colour to the face atlas) on the face picture the fit saved, and
# composites each mood piece over it, so an eye or mouth fix can be looked at before a 20-minute fit.
#   python -I tools/meshy/face_moods_preview.py <fitted/<id>/F.png> "<hair r,g,b from the FIT hair colour line>" <out.png> \
#       FIT_LID_MATCH=1 FIT_MOUTH_FIND=1 FIT_LOOK_SOLID=1 FIT_LID_SOFT=1 [FIT_EYE_DARK=1] [FIT_SKIN_SMAX=.65] [ZOOM=3] [ALPHA=blink]
# F.png is written by a fit run with FIT_SAVE_F=<path> (fit_people.py: the face picture projected from the front); the
# fit's mid/face-bake.png is close but not the same picture. ALPHA=<mood> also writes that piece's alpha, its colour
# change and the eye and hair masks. Order of the grid: smile, blink, half / happy, surprised, sad / lookL, lookR, excited.
# Not a check: the game is still the judge (game_shots.mts with SHOT_SIZE=1024 SHOT_DIST=.45 SHOT_UP=.06).
import sys, os, math, colorsys, numpy as np
from PIL import Image
fp, hc, outp = sys.argv[1:4]
for kv in sys.argv[4:]: k, v = kv.split('=', 1); os.environ[k] = v
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fit_people.py'), encoding='utf-8').read()
a = src.index("SKIN_SMAX = float(os.environ.get('FIT_SKIN_SMAX') or .44)   # (set again"); b = src.index('\natlas = np.zeros', a)
code = src[a:b]
hs0 = src.index('def hsv_np'); code = src[hs0:src.index('def back_hair', hs0)] + code
# the hair colour comes from rays over the model's head in Blender: given here instead
h0 = code.index('    _hc = []'); h1 = code.index('    _c = _nc or _c\n') + len('    _c = _nc or _c\n')
code = code[:h0] + '    _c = [np.array([' + hc + '])]\n' + code[h1:]
F = np.asarray(Image.open(fp).convert('RGBA'), np.float32) / 255; F = F.copy()
g = dict(np=np, os=os, math=math, colorsys=colorsys, F=F, ORIGINAL=True, OWN=True, SHIFT=False, SKIN_REF=None, TILE=F.shape[0])
exec(code, g)
M = g['M']; ORDER = g['ORDER']; T = F.shape[0]; Z = int(os.environ.get('ZOOM') or 3)
S = Image.new('RGB', (T * Z * 3, T * Z * 3))
for i, k in enumerate(ORDER):
    base = Image.fromarray((np.clip(F, 0, 1) * 255).astype(np.uint8)).convert('RGBA'); base.putalpha(255)
    base.alpha_composite(Image.fromarray((np.clip(M[k], 0, 1) * 255).astype(np.uint8), 'RGBA'))
    r, c = divmod(i, 3); S.paste(base.convert('RGB').resize((T * Z, T * Z), Image.BILINEAR), (c * T * Z, r * T * Z))
S.save(outp); print('preview', outp)
if os.environ.get('ALPHA'):
    k = os.environ['ALPHA']; up = lambda x: Image.fromarray(np.clip(x * 255, 0, 255).astype(np.uint8)).resize((x.shape[1] * Z, x.shape[0] * Z), Image.NEAREST)
    up(M[k][..., 3]).save(outp.replace('.png', '-alpha.png'))
    up(np.abs(M[k][..., :3] - F[..., :3]).max(-1) * M[k][..., 3] * 4).save(outp.replace('.png', '-change.png'))
    up(np.concatenate([np.clip(g['EYE_A'], 0, 1), np.clip(g['NOHAIR'], 0, 1)], 1)).save(outp.replace('.png', '-masks.png'))

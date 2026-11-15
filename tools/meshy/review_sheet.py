import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
poses = ['walk', 'run', 'sit', 'jump', 'cheer']; kinds = ['everyday', 'aodai', 'festival', 'rain']
os.makedirs(out, exist_ok=True)
for id_ in ['clara', 'sol', 'finn', 'lumi']:
    for tag, views in (('toan-than', ['tq', 'back']), ('chan-giay', ['feet', 'feetback'])):
        W, H = 360, 480; sh = Image.new('RGB', (W * len(poses) * len(views), H * len(kinds)), 'white'); g = ImageDraw.Draw(sh)
        for r, k in enumerate(kinds):
            for c, (p, v) in enumerate([(p, v) for p in poses for v in views]):
                f = f'{d}/{id_}/{id_}-{k}-{p}-{v}-look.png'
                if os.path.exists(f): sh.paste(Image.open(f).convert('RGB'), (c * W, r * H))
                g.rectangle((c * W, r * H, c * W + 150, r * H + 14), fill='white'); g.text((c * W + 3, r * H + 2), f'{k} {p} {v}', fill='black')
        sh.convert('RGB').save(f'{out}/{id_}-{tag}.jpg', quality=88)
print('ok')

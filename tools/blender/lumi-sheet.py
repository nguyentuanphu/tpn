# One page for the owner: the concept, then the chibi Lumi and the tall Lumi from four sides and with three faces.
#   python3 tools/blender/lumi-sheet.py <dir with lumi-*.png> <out.png>
import os, sys
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, Hh = 300, 390; views = ['front', 'three-quarter', 'side', 'back']; faces = ['face-happy', 'face-curious', 'face-surprised']
sheet = Image.new('RGB', (W * 4, 520 + 2 * (Hh + W + 70)), '#f3ead7'); dr = ImageDraw.Draw(sheet)
c = Image.open(os.path.join(root, 'docs', 'characters-v108', 'lumi', 'owner-concept.png')).convert('RGB'); c.thumbnail((W * 4 - 20, 480))
sheet.paste(c, ((W * 4 - c.width) // 2, 30)); dr.text((10, 8), "OWNER'S CONCEPT", fill='#3a2a1a')
y = 520
for style in ('chibi', 'tall'):
    dr.text((10, y + 8), f'LUMI {style.upper()}  (front, three-quarter, side, back; happy, curious, surprised)', fill='#3a2a1a')
    for i, v in enumerate(views):
        p = os.path.join(d, f'lumi-{style}-{v}.png')
        if os.path.exists(p): im = Image.open(p).convert('RGB'); im.thumbnail((W, Hh)); sheet.paste(im, (W * i + (W - im.width) // 2, y + 30))
    for i, v in enumerate(faces):
        p = os.path.join(d, f'lumi-{style}-{v}.png')
        if os.path.exists(p): im = Image.open(p).convert('RGB'); im.thumbnail((W * 4 // 3, W)); sheet.paste(im, (W * 4 // 3 * i + (W * 4 // 3 - im.width) // 2, y + 40 + Hh))
    y += Hh + W + 70
sheet.save(out)

# One page with every friend from four sides (and the concept beside each), for the owner to choose from.
#   python3 tools/blender/sheet.py <dir> [names...]   -> <dir>/sheet.png
import os, sys
from PIL import Image, ImageDraw
d = sys.argv[1]; names = sys.argv[2:] or sorted({f.split('-')[0] for f in os.listdir(d) if f.endswith('-front.png')})
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 240, 340; views = ['front', 'three-quarter', 'side', 'back']
sheet = Image.new('RGB', (W * 5, (H + 30) * len(names)), '#f6efe0'); dr = ImageDraw.Draw(sheet)
for r, n in enumerate(names):
    y = r * (H + 30)
    c = os.path.join(root, 'docs', 'characters-v108', f'concept-{n}.png')
    if os.path.exists(c): im = Image.open(c).convert('RGB'); im.thumbnail((W, H)); sheet.paste(im, ((W - im.width) // 2, y + 30))
    dr.text((8, y + 8), n.upper() + '  (concept | model)', fill='#3a2a1a')
    for i, v in enumerate(views):
        p = os.path.join(d, f'{n}-{v}.png')
        if os.path.exists(p): im = Image.open(p).convert('RGB'); im.thumbnail((W, H)); sheet.paste(im, (W * (i + 1) + (W - im.width) // 2, y + 30))
sheet.save(os.path.join(d, 'sheet.png')); print(os.path.join(d, 'sheet.png'))

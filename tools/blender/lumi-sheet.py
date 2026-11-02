# One page for the owner: the concepts, then each chibi friend from four sides and with three faces.
#   python3 tools/blender/lumi-sheet.py <dir with <who>-chibi-*.png> <out.png> [lumi finn flora] [--style chibi|tall]
import os, sys
from PIL import Image, ImageDraw
args = [a for a in sys.argv[1:]]
style = 'chibi'
if '--style' in args: i = args.index('--style'); style = args[i + 1]; del args[i:i + 2]
d, out, who = args[0], args[1], args[2:] or ['lumi', 'finn', 'flora']
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
concept = {'lumi': 'lumi/owner-concept.png', 'finn': 'concept-finn.png', 'flora': 'concept-flora.png'}
W, Hh = 300, 390; views = ['front', 'three-quarter', 'side', 'back']; faces = ['face-happy', 'face-curious', 'face-surprised']
row = Hh + W + 70
sheet = Image.new('RGB', (W * 5, row * len(who)), '#f3ead7'); dr = ImageDraw.Draw(sheet)
for r, n in enumerate(who):
    y = r * row
    dr.text((10, y + 8), f'{n.upper()} {style.upper()}  (concept; front, three-quarter, side, back; happy, curious, surprised)', fill='#3a2a1a')
    c = os.path.join(root, 'docs', 'characters-v108', concept[n])
    if os.path.exists(c): im = Image.open(c).convert('RGB'); im.thumbnail((W, Hh + W)); sheet.paste(im, ((W - im.width) // 2, y + 30))
    for i, v in enumerate(views):
        p = os.path.join(d, f'{n}-{style}-{v}.png')
        if os.path.exists(p): im = Image.open(p).convert('RGB'); im.thumbnail((W, Hh)); sheet.paste(im, (W * (i + 1) + (W - im.width) // 2, y + 30))
    for i, v in enumerate(faces):
        p = os.path.join(d, f'{n}-{style}-{v}.png')
        if os.path.exists(p): im = Image.open(p).convert('RGB'); im.thumbnail((W * 4 // 3, W)); sheet.paste(im, (W + W * 4 // 3 * i + (W * 4 // 3 - im.width) // 2, y + 40 + Hh))
sheet.save(out)

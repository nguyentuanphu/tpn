# (Meshy production, 9 Nov 2026) Review sheets from game_shots.mts pictures, the ones the owner reviews.
#   D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe tools/meshy/review_sheets.py <kind> <shots dir> <ids> <out.jpg>
# kinds:
#   eyes    : per friend one row: smile, blink, happy, half (front), happy from the left, blink from the right (faces mode)
#   chins   : per friend one column: side, three-quarter, front, cropped to chin and collar (faces mode)
#   tones   : per friend one row: the four skin tones (tones mode)
#   outfits : per friend two columns (front, back), the four outfits as rows (outfits mode)
# Always look at every sheet at full size before telling the owner anything is done (SKILL.md, "Review in the game").
import sys
from PIL import Image

kind, d, ids, out = sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4]

def crop(path, box, size):
    im = Image.open(path).convert('RGB'); W, H = im.size
    return im.crop((int(W * box[0]), int(H * box[1]), int(W * box[2]), int(H * box[3]))).resize(size)

if kind == 'eyes':
    fs = ['smile-front', 'blink-front', 'happy-front', 'half-front', 'happy-sideL', 'blink-sideR']
    sheet = Image.new('RGB', (400 * len(fs), 300 * len(ids)))
    for r, i in enumerate(ids):
        for c, f in enumerate(fs):
            sheet.paste(crop(rf'{d}\{i}-hd-{f}.png', (.12, .18, .88, .75), (400, 300)), (c * 400, r * 300))
elif kind == 'chins':
    vs = ['sideL', 'tq', 'front']
    sheet = Image.new('RGB', (480 * len(ids), 480 * len(vs)))
    for c, i in enumerate(ids):
        for r, v in enumerate(vs):
            sheet.paste(crop(rf'{d}\{i}-hd-smile-{v}.png', (.2, .35, .8, .95), (480, 480)), (c * 480, r * 480))
elif kind == 'tones':
    sheet = Image.new('RGB', (400 * 4, 400 * len(ids)))
    for r, i in enumerate(ids):
        for c in range(4):
            sheet.paste(crop(rf'{d}\{i}-tone-{c}.png', (.2, .12, .8, .85), (400, 400)), (c * 400, r * 400))
elif kind == 'outfits':
    ks = ['everyday', 'aodai', 'festival', 'rain']
    sheet = Image.new('RGB', (360 * 2 * len(ids), 480 * len(ks)))
    for c, i in enumerate(ids):
        for r, k in enumerate(ks):
            for j, v in enumerate(('front', 'back')):
                sheet.paste(Image.open(rf'{d}\{i}-{k}-{v}.png').convert('RGB').resize((360, 480)), ((c * 2 + j) * 360, r * 480))
else:
    raise SystemExit('kind: eyes, chins, tones or outfits')
sheet.save(out, quality=90)
print('sheet', kind, out, sheet.size)

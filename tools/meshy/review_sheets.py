# (Meshy production, 9 Nov 2026) Review sheets from game_shots.mts pictures, the ones the owner reviews.
#   D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe tools/meshy/review_sheets.py <kind> <shots dir> <ids> <out.jpg>
# kinds:
#   village-eyes: per villager one row of the eyes close up (shut front, three-quarters, sides; open; glance)
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

if kind == 'village':   # (10 Nov 2026) per villager one row (village mode, v-<id>-*): moods front, blink and look from the side, back, whole front and back
    fs = ['smile-front', 'blink-front', 'happy-front', 'sad-front', 'excited-front', 'smile-tq', 'blink-tq', 'blink-sideL', 'lookL-sideR', 'neck-back-3.1']
    full = ['full-front', 'full-tq', 'full-back']
    sheet = Image.new('RGB', (300 * len(fs) + 180 * len(full), 300 * len(ids)), (40, 40, 40))
    for r, i in enumerate(ids):
        for c, f in enumerate(fs):
            sheet.paste(crop(rf'{d}\v-{i}-{f}.png', (.1, .1, .9, .9), (300, 300)), (c * 300, r * 300))
        for c, f in enumerate(full):
            sheet.paste(crop(rf'{d}\v-{i}-{f}.png', (.1, .05, .9, .95), (180, 300)), (300 * len(fs) + c * 180, r * 300))
elif kind == 'village-eyes':   # (12 Nov 2026, owner circled the far shut eye by the nose, round after round) per villager one row of the eyes close up: shut and smiling from the front, three-quarters both ways and the sides, open from three-quarters, and a glance from the side
    fs = ['blink-front', 'blink-tq', 'happy-tq', 'blink-sideL', 'blink-sideR', 'smile-tq', 'lookL-sideR', 'sad-front']
    sheet = Image.new('RGB', (420 * len(fs), 300 * len(ids)), (40, 40, 40))
    for r, i in enumerate(ids):
        for c, f in enumerate(fs):
            sheet.paste(crop(rf'{d}\v-{i}-{f}.png', (.12, .08, .88, .62), (420, 300)), (c * 420, r * 300))
elif kind in ('village-gate-a', 'village-gate-b'):   # (13 Nov 2026, owner's approval gate) one villager per sheet (ids: one id), 1024 px shots cropped to the head: a = every mood front, ±.4, ±.7; b = sides, above and below, neck and nape, whole body
    i = ids[0]; T = 380; F = (.14, .06, .86, .78)
    if kind == 'village-gate-a':
        rows = [[f'{m}-{v}' for v in ('tqn', 'q4n', 'front', 'q4', 'tq')] for m in ('smile', 'blink', 'happy', 'half', 'sad', 'o', 'excited', 'lookL', 'lookR')]
    else:
        rows = [[f'{m}-side{s}' for m in ('smile', 'blink', 'happy') for s in 'LR'], [f'{m}-side{s}' for m in ('sad', 'lookL', 'lookR') for s in 'LR'],
                ['smile-above', 'smile-above-tq', 'blink-above', 'blink-above-tq', 'smile-below', 'smile-below-tq'], ['blink-below', 'blink-below-tq', 'neck-front', 'neck-tq', 'neck-side', 'neck-sideR'],
                ['neck-back-3.1', 'neck-back-2.2', 'neck-back--2.2', 'full-front', 'full-tq', 'full-back']]
    sheet = Image.new('RGB', (T * max(len(r) for r in rows), T * len(rows)), (40, 40, 40))
    for r, row in enumerate(rows):
        for c, f in enumerate(row):
            p = rf'{d}\v-{i}-{f}.png'
            try: sheet.paste(crop(p, F if not f.startswith(('full', 'feet')) else (0, 0, 1, 1), (T, T)) if not f.startswith('full') else crop(p, (.1, .05, .9, .95), (int(T * .75), T)), (c * T, r * T))
            except FileNotFoundError: pass
elif kind == 'eyes':
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

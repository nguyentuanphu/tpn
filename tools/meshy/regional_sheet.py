# (10 Nov 2026, regional pilot) One review sheet per regional villager for the owner: the ChatGPT front view beside the
# in-game pictures of game_shots.mts village mode (v-<id>-*): whole person front, three-quarter, back and the back of the
# head; every mood front and three-quarter; smile, blink and look from both sides.
#   python3 tools/meshy/regional_sheet.py <shots dir> <id> <ChatGPT front.png> <out.jpg> [title]
import sys
from PIL import Image, ImageDraw, ImageFont

d, i, ref, out = sys.argv[1:5]; title = sys.argv[5] if len(sys.argv) > 5 else i
MOODS = ['smile', 'blink', 'half', 'happy', 'o', 'sad', 'lookL', 'lookR', 'excited']
T = 240
def pic(n, box=(.08, .05, .92, .89), size=(T, T)):
    im = Image.open(f'{d}/v-{i}-{n}.png').convert('RGB'); W, H = im.size
    return im.crop((int(W * box[0]), int(H * box[1]), int(W * box[2]), int(H * box[3]))).resize(size)
font = None
for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'C:/Windows/Fonts/arial.ttf'):   # (11 Nov 2026) Linux cloud, owner's PC
    try: font = ImageFont.truetype(f, 20); break
    except OSError: pass
if font is None: font = ImageFont.load_default()
r = Image.open(ref).convert('RGB'); r = r.resize((int(r.width * 480 / r.height), 480))
cols = 9; S = Image.new('RGB', (cols * T, 40 + 480 + 3 * (T + 26)), (236, 236, 232)); g = ImageDraw.Draw(S)
g.text((8, 8), title, fill=(20, 20, 20), font=font)
x = 0; S.paste(r, (x, 40)); x += r.width + 8
for n in ('full-front', 'full-tq', 'full-back'):
    S.paste(Image.open(f'{d}/v-{i}-{n}.png').convert('RGB').resize((360, 480)), (x, 40)); x += 362
for k, n in enumerate(('neck-back-3.1', 'neck-back-2.2', 'neck-back--2.2')):
    S.paste(pic(n, size=(156, 156)), (x, 40 + k * 160))
y = 40 + 480
for row, (lab, names) in enumerate((('moods, front', [m + '-front' for m in MOODS]), ('moods, three-quarter', [m + '-tq' for m in MOODS]),
                                     ('from the sides', [f'{m}-side{s}' for m in ('smile', 'blink', 'lookL') for s in 'LR']))):
    g.text((8, y + 2), lab + ': ' + ', '.join(n.replace('-front', '').replace('-tq', '') for n in names), fill=(40, 40, 40), font=font)
    for c, n in enumerate(names): S.paste(pic(n), (c * T, y + 26))
    y += T + 26
S.save(out, quality=88); print('sheet', out, S.size)

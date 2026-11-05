# Put one Blender film together (round v1.08c, blender helper): the pictures drawn in Blender for each page of the story
# (tools/blender/storypage.py, two moments a page) become a 720p video, about a minute long, with the same pages as the
# game's own film: each page holds its first picture with a slow camera move, then melts into its second; the four
# friends tell the story at the start (the title) and wave goodbye at the end. No voice in the video: the story's words
# are read in the child's language by the game (js/blenderfilm.ts), so one video serves English and Vietnamese.
#   python3 tools/blender/make-film.py <id> <pictures dir> <scenes dir> <out.mp4> "<title en>" "<title vi>"
# Prints the film's pages (start, end, help moment) as JSON for js/content/blenderfilms.ts.
import sys, os, json, subprocess, math, unicodedata
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ID, PICS, SCN, OUT, TEN, TVI = sys.argv[1:7]
FPS, W, H = 24, 1280, 720
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
LAT = ImageFont.truetype(os.path.join(ROOT, 'fonts/Baloo2-latin-600.woff2'), 64); VIE = ImageFont.truetype(os.path.join(ROOT, 'fonts/Baloo2-vietnamese-600.woff2'), 64)
LAT2 = ImageFont.truetype(os.path.join(ROOT, 'fonts/Baloo2-latin-600.woff2'), 40); VIE2 = ImageFont.truetype(os.path.join(ROOT, 'fonts/Baloo2-vietnamese-600.woff2'), 40)
VN = lambda ch: 0x102 <= ord(ch) <= 0x1b0 and ord(ch) not in range(0x104, 0x110) or 0x1ea0 <= ord(ch) <= 0x1ef9

def text(img, s, y, big=True):
    """centred words with a soft dark edge; each letter from the Baloo 2 part (Latin or Vietnamese) that has it"""
    s = unicodedata.normalize('NFC', s); d = ImageDraw.Draw(img)
    fl, fv = (LAT, VIE) if big else (LAT2, VIE2)
    parts = [(ch, fv if VN(ch) else fl) for ch in s]; w = sum(f.getlength(ch) for ch, f in parts); x = (W - w) / 2
    for ch, f in parts:
        d.text((x, y), ch, font=f, fill='#fffaf0', stroke_width=6 if big else 4, stroke_fill='#3b2a4f'); x += f.getlength(ch)

def still(path):
    im = Image.open(path).convert('RGB')
    return im.resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS)   # a little room for the slow camera move

def view(im, z, cx=.5, cy=.5):
    """the part of a picture seen through a camera zoomed by z, centred at (cx, cy)"""
    iw, ih = im.size
    vw, vh = iw / z, ih / z; x0 = (iw - vw) * cx; y0 = (ih - vh) * cy
    return im.transform((W, H), Image.EXTENT, (x0, y0, x0 + vw, y0 + vh), Image.BICUBIC)

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', OUT], stdin=subprocess.PIPE)
n = 0
def put(img):
    global n; ff.stdin.write(img.tobytes()); n += 1

pages, k = [], 0
while os.path.exists(os.path.join(SCN, f'{ID}-p{k}-0.json')): k += 1
NP = k
intro = still(os.path.join(PICS, f'{ID}-intro.png')); outro = still(os.path.join(PICS, f'{ID}-outro.png'))
# the friends open the story with its title (3.5 s), then the first page's first picture comes in
for i in range(int(3.5 * FPS)):
    f = i / (3.5 * FPS); im = view(intro, 1.0 + .04 * f)
    if f > .12: text(im, TEN, 470); text(im, TVI, 548)
    put(im)
for k in range(NP):
    S = json.load(open(os.path.join(SCN, f'{ID}-p{k}-0.json')))
    L = max(6.0, min(16.0, S['len'] + .6)); A = still(os.path.join(PICS, f'{ID}-p{k}-0.png')); B = still(os.path.join(PICS, f'{ID}-p{k}-1.png'))
    cs = n / FPS; start = cs if k else 0.0
    cA = ((.5 + .04 * ((k % 3) - 1)), .5); N = int(L * FPS)
    for i in range(N):
        f = i / N
        za = 1.0 + .06 * min(1, f / .6); a = view(A, za, *cA)
        if f < .52: im = a
        else:
            g = min(1, (f - .52) / .14); b = view(B, 1.06 - .05 * (f - .52) / .48, .5, .5)
            im = Image.blend(a, b, g) if g < 1 else b
        if k == 0 and i < 10: im = Image.blend(view(intro, 1.04), im, i / 10)
        put(im)
    help = S.get('help')
    h = None
    if help:   # the video stops here and shows the tap ring (in % of the picture): at the same part of the page as in the game
        ht = cs + (n / FPS - cs) * min(.9, max(.1, help['t'] / max(1, S['len'])))
        h = dict(t=round(ht, 2), x=help['x'], y=help['y'], en=help['en'], vi=help['vi'])
    pages.append(dict(s=round(start, 2), e=round(n / FPS, 2), **({'help': h} if h else {})))
# the friends wave goodbye: the end
last = view(B, 1.01)
for i in range(int(3.5 * FPS)):
    f = i / (3.5 * FPS); im = Image.blend(last, view(outro, 1.0 + .03 * f), min(1, f * 4))
    if f > .2: text(im, 'The end', 470); text(im, 'Hết', 548)
    put(im)
pages[-1]['e'] = round(n / FPS, 2)
ff.stdin.close(); ff.wait()
print(json.dumps({'pages': pages, 'seconds': round(n / FPS, 1), 'bytes': os.path.getsize(OUT)}, ensure_ascii=False))

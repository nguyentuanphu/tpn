# Pack the story pages drawn in Blender for the game (round v1.08c, blender helper): each page's picture (storypage.py,
# 1280 x 720 PNG) becomes videos/storypages/<id>-<v>-p<k>.webp at 960 x 540, its quality chosen so it weighs about
# 60-100 KB, and js/content/storypics.ts lists the tales that have all their pages.
#   python3 tools/blender/storypics-pack.py <pictures dir> [v1]
# A tale's page picture is <id>-p<k>.png, or <id>-p<k>-1.png (the second moment of a Blender film's page).
import sys, os, io, re
from PIL import Image
SRC = sys.argv[1]; V = sys.argv[2] if len(sys.argv) > 2 else 'v1'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'videos/storypages'); os.makedirs(OUT, exist_ok=True)
TALES = ['duahau', 'thanhgiong', 'banhchung', 'caykhe', 'hoguom', 'rongtien', 'caytre', 'tamcam', 'sodua', 'thachsanh', 'chucuoi', 'cockien', 'vusua', 'baluoiriu', 'quabau', 'thayboi', 'nhacmeo', 'ongtao', 'cachep', 'sontinh']
done = {}
for t in TALES:
    k, pics = 0, []
    while True:
        p = next((os.path.join(SRC, f) for f in (f'{t}-p{k}.png', f'{t}-p{k}-1.png') if os.path.exists(os.path.join(SRC, f))), None)
        if not p: break
        pics.append(p); k += 1
    if not pics: continue
    sizes = []
    for k, p in enumerate(pics):
        im = Image.open(p).convert('RGB').resize((960, 540), Image.LANCZOS)
        lo, hi, best = 30, 92, None
        while lo <= hi:   # the best quality that stays under 100 KB
            q = (lo + hi) // 2; b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
            if b.tell() <= 100_000: best, lo = b.getvalue(), q + 1
            else: hi = q - 1
        best = best or b.getvalue()
        open(os.path.join(OUT, f'{t}-{V}-p{k}.webp'), 'wb').write(best); sizes.append(len(best) // 1000)
    done[t] = len(pics); print(t, len(pics), 'pages', sizes, 'KB')
ts = os.path.join(ROOT, 'js/content/storypics.ts'); s = open(ts).read()
body = ''.join(f"\n  {t}: {{ v: '{V}', n: {n} }}," for t, n in done.items())
s = s[:s.index('export const STORY_PICS')] + 'export const STORY_PICS: Record<string, { v: string, n: number }> = {' + body + '\n};\n'
open(ts, 'w').write(s)
print(len(done), 'tales listed in js/content/storypics.ts')

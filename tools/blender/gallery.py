# Builds the character gallery page (owner, 3 Nov 2026 AEDT: "cho tôi full render của mỗi nhân vật rồi cho vào artifacts").
#   python3 tools/blender/gallery.py <FIN dir with friends/ vill/ wear/ veh/> <out dir>
# Writes <out>/index.html and <out>/img/*.jpg (the page and its pictures, also kept in the repo under docs/characters-v108/gallery/).
import os, sys, glob, html, subprocess
SRC, OUT = sys.argv[1], sys.argv[2]
IMG = os.path.join(OUT, 'img'); os.makedirs(IMG, exist_ok=True)

def jpg(src, name, width=900):
    dst = os.path.join(IMG, name + '.jpg')
    subprocess.run(['convert', src, '-resize', f'{width}x>', '-quality', '86', dst], check=True)
    return 'img/' + name + '.jpg'

FRIENDS = [('lumi', 'Lumi', 'girl · bạn gái', 'The star gardener: leaf hair, sage overalls, a glowing star lantern.'),
           ('flora', 'Flora', 'girl · bạn gái', 'Pink waves and braids, a lilac dress with a petal hem, a flower staff.'),
           ('finn', 'Finn', 'boy · bạn trai', 'Navy hair, a teal explorer coat, a satchel and a glowing compass star.'),
           ('sol', 'Sol', 'boy · bạn trai', 'Copper curls, a honey cape with a sun on the back, a sun crystal.')]
VIEWS = [('front', 'Front'), ('three-quarter', 'Three-quarter'), ('side', 'Side'), ('back', 'Back')]
MOODS = [('happy', 'Happy · vui'), ('excited', 'Excited · hào hứng'), ('curious', 'Curious · tò mò'), ('surprised', 'Surprised · ngạc nhiên'),
         ('shy', 'Shy · ngại'), ('sad', 'Sad · buồn'), ('blink', 'Blink · chớp mắt')]
VILL = [('vn-aodai', 'Woman in áo dài', 'Áo dài, nón lá, sandals'), ('vn-dad', 'Dad', 'Polo shirt, motorbike helmet'),
        ('vn-farmer', 'Farmer', 'Áo bà ba, nón lá, a basket'), ('vn-vendor', 'Market vendor', 'Áo bà ba, apron, a low bun'),
        ('vn-grandma', 'Grandma · bà', 'Áo bà ba, glasses'), ('vn-grandpa', 'Grandpa · ông', 'Straw hat, moustache, a cane'),
        ('vn-schoolboy', 'Schoolboy', 'Red scarf, backpack'), ('vn-schoolgirl', 'Schoolgirl', 'Red scarf, pigtails, a bow'),
        ('au-mum', 'Mum', 'Sundress, sun hat, ponytail'), ('au-dad', 'Dad', 'Akubra, work shirt, boots'),
        ('au-grandma', 'Grandma', 'Cardigan, pearls, curls'), ('au-grandpa', 'Grandpa', 'Bucket hat, long socks'),
        ('au-boy', 'Boy', 'Bucket hat, rash vest, thongs'), ('au-girl', 'Schoolgirl', 'School dress and hat, afro puffs')]
WEAR = [('lumi-hatstraw-shoesrainboots-headband', 'Lumi', 'Straw hat, rain boots, headband'), ('lumi-hatnonla-shoessandals-scarf6f9fd8', 'Lumi', 'Nón lá, sandals, scarf'),
        ('flora-hatcrown-shoessandals-earrings-necklace', 'Flora', 'Flower crown, sandals, earrings, necklace'), ('flora-bow-bracelet-shoesthongs', 'Flora', 'Bow, bracelet, thongs'),
        ('finn-hatbeanie-shoessneakers-scarfd8644a', 'Finn', 'Beanie, sneakers, scarf'), ('finn-hatbucket-bowtie-watch', 'Finn', 'Bucket hat, bow tie, watch'),
        ('sol-hatcap-shoessneakers-backpack', 'Sol', 'Cap, sneakers, backpack'), ('sol-hatakubra-sunglasses-shoesboots', 'Sol', 'Akubra, sunglasses, boots')]
VEH = [('motorbike', 'Motorbike · xe máy', 'A Vietnamese dad rides, his daughter behind.'), ('bicycle', 'Bicycle · xe đạp', 'An Australian boy on his bike, hands on the grips.'),
       ('bus', 'City bus · xe buýt', 'The four friends and neighbours, a driver at the wheel.')]

def fig(src, cap, cls=''):
    return f'<figure class="{cls}"><button class="zoom" data-src="{src}" aria-label="Enlarge {html.escape(cap)}"><img src="{src}" alt="{html.escape(cap)}" loading="lazy"></button><figcaption>{cap}</figcaption></figure>'

parts = []
# the four friends
fr = []
for key, name, g, about in FRIENDS:
    d = os.path.join(SRC, 'friends'); views = []
    for v, lab in VIEWS:
        p = os.path.join(d, f'{key}-game-{v}.png')
        if os.path.exists(p): views.append(fig(jpg(p, f'{key}-{v}'), lab))
    moods = []
    for m, lab in MOODS:
        p = os.path.join(d, f'{key}-game-face-{m}.png')
        if os.path.exists(p): moods.append(fig(jpg(p, f'{key}-face-{m}', 520), lab, 'mood'))
    fr.append(f'''<article class="friend" id="{key}">
  <header><h3>{name}</h3><span class="chip {'f' if 'girl' in g else 'm'}">{g}</span></header>
  <p class="about">{about}</p>
  <div class="views">{''.join(views)}</div>
  <h4>Moods · cảm xúc</h4>
  <div class="moods">{''.join(moods)}</div>
</article>''')
parts.append(f'<section id="friends"><h2>The four friends</h2><p class="lede">Two pairs: Finn and Flora, Sol and Lumi. Smile is the everyday face, shown in the views.</p>{"".join(fr)}</section>')

def grid(items, sid, title, lede):
    return f'<section id="{sid}"><h2>{title}</h2><p class="lede">{lede}</p><div class="cards">{"".join(items)}</div></section>'

for pre, sid, title, lede in (('vn', 'vietnam', 'Vietnamese neighbours', 'Everyday clothes of a Vietnamese village and town.'),
                              ('au', 'australia', 'Australian neighbours', 'Everyday Australian clothes, a mix of backgrounds.')):
    cards = []
    for role, name, what in [v for v in VILL if v[0].startswith(pre)]:
        port = glob.glob(os.path.join(SRC, 'vill', f'villager-{role}-*-portrait.png')); full = glob.glob(os.path.join(SRC, 'vill', f'villager-{role}-*-lineup.png'))
        if not port or not full: continue
        a = jpg(full[0], f'{role}-full', 600); b = jpg(port[0], f'{role}-face', 600)
        cards.append(f'<article class="card"><div class="pair">{fig(a, "Full")}{fig(b, "Close-up")}</div><h3>{name}</h3><p>{what}</p></article>')
    parts.append(grid(cards, sid, title, lede))

cards = []
for f, who, what in WEAR:
    p = os.path.join(SRC, 'wear', f'{f}-game-lineup.png')
    if os.path.exists(p): cards.append(f'<article class="card slim">{fig(jpg(p, "wear-" + f[:40], 600), who)}<p>{what}</p></article>')
parts.append(grid(cards, 'wardrobe', 'Wardrobe', 'Hats, shoes and accessories any friend or neighbour can wear. Hats rest on the hair.'))

cards = []
for v, name, what in VEH:
    p = os.path.join(SRC, 'veh', f'vehicle-{v}.png')
    if os.path.exists(p): cards.append(f'<article class="card wide">{fig(jpg(p, "vehicle-" + v, 1400), name)}<p>{what}</p></article>')
parts.append(grid(cards, 'vehicles', 'On the road', 'Riders hold the handlebars palm down; passengers turn to look at us.'))

NAV = ''.join(f'<a href="#{i}">{t}</a>' for i, t in (('friends', 'Friends'), ('vietnam', 'Vietnam'), ('australia', 'Australia'), ('wardrobe', 'Wardrobe'), ('vehicles', 'Vehicles')))
PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gallery-template.html'), encoding='utf-8').read()
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(PAGE.replace('{{NAV}}', NAV).replace('{{BODY}}', '\n'.join(parts)))
print('pictures:', len(os.listdir(IMG)))

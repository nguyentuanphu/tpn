# The approval page of one model: D:\WorkSpace\meshy\fitted\gate\<id>\index.html, plain HTML with relative pictures,
# readable on a phone. Old (the model in the game today) against new (face UV) for every mood: first at the game's own
# distance on a phone, a tablet and a computer, then close up at yaw 0, +-.4, +-.7, +-1.2; then the auditor's face
# numbers (friends) and the report's warnings.
#   python gate.py <id> [gate root]      (reads fitted\faceuv-<id>: shots-old, shots-new, report.json, audit-old, audit-new)
import sys, os, json, html
sys.path.insert(0, os.path.dirname(__file__)); from img import *
ID = sys.argv[1]; F = 'D:/WorkSpace/meshy/fitted'; O = f'{F}/faceuv-{ID}'; G = (sys.argv[2] if len(sys.argv) > 2 else f'{F}/gate') + '/' + ID; os.makedirs(G + '/img', exist_ok=True)
MOODS = [('smile', 'smile (eyes open, as painted)'), ('blink', 'blink (eyes shut)'), ('half', 'half (lid half down)'), ('happy', 'happy (eyes shut, arched)'), ('o', 'surprised (o)'), ('sad', 'sad'), ('lookL', 'look left'), ('lookR', 'look right'), ('excited', 'excited (eyes shut, mouth open)')]
YC = ['0', '0.4', '-0.4', '0.7', '-0.7', '1.2', '-1.2']; YD = ['-0.7', '0', '0.7']; DEV = [('phone', 'Phone 390 x 844'), ('tablet', 'Tablet 820 x 1180'), ('computer', 'Computer 1280 x 800')]
rep = json.load(open(O + '/report.json')) if os.path.exists(O + '/report.json') else {}
def ld(p, s):
    if not os.path.exists(p): return np.full((s, s, 3), .5, np.float32)
    return resize(load(p)[..., :3], s, s)
def near(p, s):   # a small head crop enlarged without smoothing: the game's own pixels
    if not os.path.exists(p): return np.full((s, s, 3), .5, np.float32)
    a = load(p)[..., :3]; k = max(1, s // a.shape[0]); a = np.repeat(np.repeat(a, k, 0), k, 1); return resize(a, s, s)
def bar(a, col, n=8): b = np.ones((n, a.shape[1], 3), np.float32) * np.array(col, np.float32); return np.concatenate([b, a], 0)
OLD, NEW = [.55, .55, .55], [.15, .6, .3]
missing = 0
for m, _ in MOODS:
    for dev, _ in DEV:   # game distance: old row over new row, five turns
        rows = []
        for d, c in (('old', OLD), ('new', NEW)):
            rows.append(bar(np.concatenate([np.pad(near(f'{O}/shots-{d}/{dev}-{m}-y{y}.png', 192), ((0, 0), (2, 2), (0, 0)), constant_values=1) for y in YD], 1), c))
            missing += sum(not os.path.exists(f'{O}/shots-{d}/{dev}-{m}-y{y}.png') for y in YD)
        save(f'{G}/img/{m}-{dev}.png', np.concatenate(rows, 0))
    for y in YC:   # close up: old left, new right, 640 px each
        pair = np.concatenate([bar(ld(f'{O}/shots-old/close-{m}-y{y}.png', 640), OLD, 10), np.ones((650, 8, 3), np.float32), bar(ld(f'{O}/shots-new/close-{m}-y{y}.png', 640), NEW, 10)], 1)
        missing += sum(not os.path.exists(f'{O}/shots-{d}/close-{m}-y{y}.png') for d in ('old', 'new'))
        save(f'{G}/img/{m}-close-y{y}.jpg', pair)
# the auditor's face numbers (friends): per mood, the worst count over the views, old against new
CH = [('eyes', 6, 'eye white left on a shut eye'), ('lid', 8, 'pale rim or lighter lid on a shut eye'), ('patch', 16, 'flat lighter patch with an edge'), ('vlid', 6, 'dark upright stroke on a shut eye from the side'), ('stray', 12, 'change away from the eyes and mouth'), ('mouth', 12, 'mouth shape'), ('face', 20, 'old painting showing through')]
def cases(d):
    p = f'{O}/audit-{d}/cases.json'
    return [c for c in json.load(open(p)) if c.get('kind') == 'face'] if os.path.exists(p) else None
AO, AN = cases('old'), cases('new'); audit = ''
if AN is not None:
    def worst(cs, m, k): v = [(c.get(k, 0), c['view']) for c in cs if c['pose'] == m]; return max(v) if v else (0, '')
    audit = '<h2 id="audit">Auditor: face numbers</h2><p>Worst count in pixels over nine views (front, &plusmn;.4, &plusmn;.7, &plusmn;1.2, from above, from below) of a 900 x 700 head close-up; <b>old &rarr; new</b>, the view of the new worst in brackets. Red is over the limit.</p><div class="scroll"><table><tr><th>mood</th>' + ''.join(f'<th title="{html.escape(t)}">{k}<br><small>limit {l}</small></th>' for k, l, t in CH) + '</tr>'
    tot = {k: [0, 0] for k, _, _ in CH}
    for m, _ in MOODS:
        audit += f'<tr><td>{m}</td>'
        for k, l, _ in CH:
            o = worst(AO, m, k) if AO is not None else ('-', ''); n = worst(AN, m, k)
            if AO is not None: tot[k][0] += sum(1 for c in AO if c['pose'] == m and c.get(k, 0) > l)
            tot[k][1] += sum(1 for c in AN if c['pose'] == m and c.get(k, 0) > l)
            audit += f'<td class="{"bad" if n[0] > l else "ok"}">{o[0]} &rarr; <b>{n[0]}</b>' + (f' <small>({n[1]})</small>' if n[0] > l else '') + '</td>'
        audit += '</tr>'
    audit += '<tr><td><b>cases over</b></td>' + ''.join(f'<td>{tot[k][0] if AO is not None else "-"} &rarr; <b>{tot[k][1]}</b></td>' for k, _, _ in CH) + '</tr></table></div>'
    audit += '<p class="note">How to read them on a face-UV model: <b>eyes, lid, patch, vlid</b> judge the shut eyes and mean what they say. <b>face</b> is always 0 (the face is the head\'s own surface, nothing can show through it). <b>mouth</b> and <b>stray</b> on sad, surprised and excited judge the mouth, which is still the old floating piece on both models. The patch count swings 50 to 200 px between two runs of one model: only large differences count.</p>'
    audit += '<ul>' + ''.join(f'<li><b>{k}</b>: {html.escape(t)}</li>' for k, _, t in CH) + '</ul>'
else: audit = '<h2 id="audit">Auditor: face numbers</h2><p>The auditor draws friends only (it builds each friend with outfits and tones); it has no villager pass yet, so there are no numbers for this model. Judge by the pictures.</p>'
W = rep.get('warnings', []); sz = rep.get('size_kb', {}); fr = rep.get('frame', {}); ef = rep.get('eyes_found') or []
def esc(x): return html.escape(str(x))
h = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">', f'<title>Face UV gate: {esc(ID)}</title>',
     '<style>body{font:16px/1.45 system-ui,sans-serif;margin:0;padding:12px;background:#f6f4ef;color:#222;max-width:1320px;margin:auto}h1{font-size:22px;margin:6px 0}h2{font-size:19px;margin:22px 0 6px;padding-top:8px;border-top:2px solid #ccc}h3{font-size:16px;margin:14px 0 4px}img{max-width:100%;height:auto;display:block;border:1px solid #bbb;background:#888;image-rendering:auto}.px img{image-rendering:pixelated}.key span{display:inline-block;padding:2px 8px;color:#fff;border-radius:3px;margin-right:6px}.o{background:#8c8c8c}.n{background:#26994d}nav a{display:inline-block;margin:2px 8px 2px 0}table{border-collapse:collapse;font-size:14px}td,th{border:1px solid #bbb;padding:3px 6px;text-align:center}td.bad{background:#f7c5c0}td.ok{background:#fff}.scroll{overflow-x:auto}.warn{background:#fff3c4;border:1px solid #d9b84a;padding:6px 10px;margin:6px 0}.note{color:#555;font-size:14px}figure{margin:6px 0 12px}figcaption{font-size:13px;color:#555}small{color:#666}</style></head><body>',
     f'<h1>Face UV gate: {esc(ID)} <small>({esc(rep.get("kind", ""))}, models/{esc(rep.get("model", ""))}.glb)</small></h1>',
     '<p class="key"><span class="o">old</span> the model in the game today (floating eye pieces) <span class="n">new</span> the face-UV model (eyes drawn on the head\'s own surface). In the game-distance strips the old row is on top (grey bar), the new row below (green bar); in the close-ups old is left, new right. Tap a picture to see it at full size.</p>',
     '<nav>' + ''.join(f'<a href="#{m}">{m}</a>' for m, _ in MOODS) + '<a href="#audit">auditor</a><a href="#report">report</a></nav>']
if W: h.append('<div class="warn"><b>Warnings from make.ps1</b><ul>' + ''.join(f'<li>{esc(w)}</li>' for w in W) + '</ul></div>')
if missing: h.append(f'<div class="warn">{missing} pictures are missing (grey squares): the shots did not finish.</div>')
for m, title in MOODS:
    h.append(f'<h2 id="{m}">{esc(title)}</h2><h3>At the game\'s distance (the head at its real pixels, enlarged; turned -.7, 0, .7)</h3>')
    for dev, dn in DEV: h.append(f'<figure class="px"><figcaption>{dn}</figcaption><a href="img/{m}-{dev}.png"><img loading="lazy" src="img/{m}-{dev}.png" alt="{m} {dev}: old above, new below"></a></figure>')
    h.append('<h3>Close up (old left, new right)</h3>')
    for y in YC: h.append(f'<figure><figcaption>turned {y}</figcaption><a href="img/{m}-close-y{y}.jpg"><img loading="lazy" src="img/{m}-close-y{y}.jpg" alt="{m} close up, turned {y}: old left, new right"></a></figure>')
h.append(audit)
h.append('<h2 id="report">Report</h2><div class="scroll"><table>' + ''.join(f'<tr><th>{esc(k)}</th><td style="text-align:left">{esc(v)}</td></tr>' for k, v in [
    ('model size', f'{sz.get("old")} KB today, {sz.get("new")} KB with the face UV (+{sz.get("added")} KB; mood atlas {sz.get("mood_atlas")} KB {sz.get("atlas_format")})'),
    ('eyes found', ', '.join('yes' if x else 'NO' for x in ef)), ('face picture', f'{fr.get("W")} x {fr.get("H")} px, mood atlas {rep.get("face", {}).get("atlas")} px, {rep.get("face", {}).get("triangles")} triangles, {rep.get("face", {}).get("under_cells")} under-layer cells'),
    ('frame from the model', f'head radius {round(fr.get("radius") or 0, 3)} m (scale {round(fr.get("scale") or 0, 2)} of Sol), height {round(fr.get("Y0") or 0, 3)} to {round(fr.get("Y1") or 0, 3)} m, axis x {round(fr.get("XC") or 0, 3)} z {round(fr.get("ZC") or 0, 3)}'),
    ('per-model numbers', json.dumps(rep.get('per_model_numbers', {}))), ('drawn by', rep.get('server')), ('source', rep.get('src'))]) + '</table></div>')
h.append('<p class="note">Made by tools/meshy/faceuv/gate.ps1 (branch meshy-sol-eyes). Single pictures: fitted/faceuv-' + esc(ID) + '/shots-old and shots-new (1024 px close-ups).</p></body></html>')
open(G + '/index.html', 'w', encoding='utf-8').write('\n'.join(h))
print('gate page', G + '/index.html', 'missing pictures', missing)

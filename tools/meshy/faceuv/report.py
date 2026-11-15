# report.json for one model: sizes, the frame, the eyes found, the warnings.   python report.py <id> <faceuv dir>
import sys, os, json, glob
ID, O = sys.argv[1:3]; D = os.path.join(O, 'bake')
def jl(p): return json.load(open(p)) if os.path.exists(p) else {}
row = jl(os.path.join(O, 'model.json')); cfg = jl(os.path.join(D, 'cfg.json')); ey = jl(os.path.join(D, 'eyes.json')); bd = jl(os.path.join(D, 'build.json'))
kb = lambda p: os.path.getsize(p) // 1024 if p and os.path.exists(p) else None
new = os.path.join(O, row.get('model', ID) + '-faceuv-packed.glb'); warn = list(ey.get('warnings', []))
old_kb, new_kb = kb(row.get('old')), kb(new)
for i, f in enumerate(ey.get('found', [])):
    if not f and not any(w.startswith('eye %d' % i) for w in warn): warn.append('eye %d: eye not found' % i)
if row.get('kind') == 'villager' and new_kb and new_kb > 500: warn.append('size: %d KB, over the 500 KB a villager model is kept under (was %s KB)' % (new_kb, old_kb))
shots = {w: len(glob.glob(os.path.join(O, 'shots-' + w, '*.png'))) for w in ('old', 'new')}
for w, n in shots.items():
    if n and n < 201: warn.append('shots %s: %d of 201 pictures' % (w, n))
rep = {'id': ID, 'kind': row.get('kind'), 'model': row.get('model'), 'src': row.get('src'), 'old': row.get('old'), 'new': new, 'server': row.get('server'),
       'size_kb': {'old': old_kb, 'new': new_kb, 'added': (new_kb - old_kb) if old_kb and new_kb else None, 'mood_atlas': bd.get('atlas_kb'), 'atlas_format': bd.get('atlas_format')},
       'frame': {k: cfg.get(k) for k in ('R', 'TH', 'Y0', 'Y1', 'XC', 'ZC', 'W', 'H', 'radius', 'scale', 'head_bone', 'eye_boxes', 'px_per_mm', 'atlas')},
       'face': {'triangles': bd.get('face_tris'), 'corners': bd.get('face_corners'), 'under_cells': bd.get('under_cells'), 'atlas': bd.get('atlas'), 'tile': bd.get('tile'), 'old_eye_pieces_removed': bd.get('old_eye_pieces_removed')},
       'eyes_found': ey.get('found'), 'eyes': ey.get('eyes'), 'hole_px': ey.get('hole_px'), 'per_model_numbers': {'cfg': row.get('cfg'), 'eyes': row.get('eyes'), 'why': row.get('why')},
       'shots': shots, 'warnings': warn}
json.dump(rep, open(os.path.join(O, 'report.json'), 'w'), indent=1)
print('report', os.path.join(O, 'report.json'), 'warnings', len(warn))
for w in warn: print('WARNING', w)

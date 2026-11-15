# one model's row (models.json, or the default places) as JSON on stdout:  python model.py <id>
import sys, os, json
i = sys.argv[1]; F = 'D:/WorkSpace/meshy/fitted'; M = json.load(open(os.path.join(os.path.dirname(__file__), 'models.json'), encoding='utf-8'))
r = M.get(i)
if r is None:
    if os.path.exists(f'{F}/{i}-own/{i}-dressed-hd.glb'): r = {'kind': 'friend', 'src': f'{F}/{i}-own/{i}-dressed-hd.glb', 'old': f'{F}/{i}-own/{i}-dressed-hd-packed.glb', 'model': i + '-hd'}
    else: r = {'kind': 'villager', 'src': f'{F}/{i}/{i}-mid.glb', 'old': f'{F}/{i}/{i}-mid-packed.glb', 'model': 'villager-' + i}
r.setdefault('cfg', {}); r.setdefault('eyes', {}); r.setdefault('server', 'http://localhost:8797/')
# villagers are packed with gltfpack 0.24.0 (it keeps WebP pictures), friends with 0.20.0, as fit_person.ps1 does
r.setdefault('pack', '0.24.0' if r['kind'] == 'villager' else '0.20.0')
if len(sys.argv) > 2: json.dump(r, open(sys.argv[2], 'w'), indent=1)
print(json.dumps(r))

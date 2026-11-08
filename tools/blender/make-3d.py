# Make the five friends' 3D models from the owner's concept pictures, all at once (owner, 2 Nov 2026 AEDT:
# "Dựng tất cả cùng lúc rồi anh sẽ chọn hướng đi"), with Meshy's image-to-3D (the owner's account and key).
#   MESHY_API_KEY=... python3 tools/blender/make-3d.py <out dir> [finn flora sol luna lumi]
# The key is read from the environment and never printed. For each friend it saves <name>.glb and <name>.json
# (the task), then render-sheet.py makes the pictures to choose from.
import base64, json, os, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CONCEPTS = os.path.join(ROOT, 'docs', 'characters-v108')
API = 'https://api.meshy.ai/openapi/v1/image-to-3d'
KEY = os.environ.get('MESHY_API_KEY', '')
if not KEY: sys.exit('MESHY_API_KEY is not set (add it in the environment settings, then start a new session)')
out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sv-3d'; os.makedirs(out, exist_ok=True)
names = sys.argv[2:] or ['finn', 'flora', 'sol', 'luna', 'lumi']

def call(method, url, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {url.split("/openapi")[-1]}: HTTP {e.code} {e.read()[:300]!r}') from None

def make(name):
    with open(os.path.join(CONCEPTS, f'concept-{name}.png'), 'rb') as f:
        uri = 'data:image/png;base64,' + base64.b64encode(f.read()).decode()
    task = call('POST', API, {'image_url': uri, 'ai_model': 'latest', 'should_texture': True, 'enable_pbr': False,
                              'should_remesh': True, 'topology': 'triangle', 'target_polycount': 30000})
    tid = task.get('result'); print(name, 'started'); t0 = time.time()
    while True:
        time.sleep(15); st = call('GET', f'{API}/{tid}')
        if st.get('status') in ('SUCCEEDED', 'FAILED', 'CANCELED') or time.time() - t0 > 1800: break
        print(name, st.get('status'), st.get('progress'))
    json.dump(st, open(os.path.join(out, f'{name}.json'), 'w'), indent=1)
    if st.get('status') != 'SUCCEEDED': return f'{name}: {st.get("status")} {st.get("task_error")}'
    urllib.request.urlretrieve(st['model_urls']['glb'], os.path.join(out, f'{name}.glb'))
    return f'{name}: done in {int(time.time() - t0)} s'

with ThreadPoolExecutor(len(names)) as ex:
    for line in ex.map(make, names): print(line)

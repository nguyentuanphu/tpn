"""Meshy Remesh of one finished task, with the batch runner's guarantees (7 Nov 2026, owner-approved).

One POST per source task, reserved in the durable journal before sending, never retried; poll and download separately.
  python tools/meshy/remesh_once.py submit   --source-asset clara-r2 --polycount 30000 --journal J --approved
  python tools/meshy/remesh_once.py poll     --source-asset clara-r2 --journal J
  python tools/meshy/remesh_once.py download --source-asset clara-r2 --journal J --raw-root R
Remesh costs 5 credits (docs.meshy.ai/en/api/pricing, checked 7 Nov 2026). The journal and raw files live outside the
repository. MESHY_API_KEY comes from the environment only.
"""
import run_batch as batch
import argparse, hashlib, json, os, re, sqlite3, struct, uuid
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parents[2]
ENDPOINT = 'https://api.meshy.ai/openapi/v1/remesh'

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *a):
        raise RuntimeError('API redirect refused')

def api(method, suffix='', payload=None):
    key = os.environ.get('MESHY_API_KEY')
    if not key: raise ValueError('Bind MESHY_API_KEY securely in environment settings')
    assert not suffix or re.fullmatch(r'/[A-Za-z0-9-]+', suffix)
    req = Request(ENDPOINT + suffix, data=None if payload is None else json.dumps(payload).encode(), method=method,
                  headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    with build_opener(NoRedirect).open(req, timeout=60) as r: return json.load(r)

def open_journal(path):
    path = Path(path).resolve()
    if path.is_relative_to(ROOT): raise ValueError('Keep the live journal outside the repository')
    db = sqlite3.connect(path, timeout=10); db.execute('PRAGMA synchronous=FULL')
    db.execute('CREATE TABLE IF NOT EXISTS remesh (source TEXT PRIMARY KEY, source_task TEXT NOT NULL, cost INTEGER NOT NULL, params TEXT NOT NULL, state TEXT NOT NULL, task_id TEXT UNIQUE, result TEXT)')
    db.commit(); return db

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('command', choices=['submit', 'poll', 'download'])
    ap.add_argument('--source-asset', required=True); ap.add_argument('--journal', required=True, type=Path)
    ap.add_argument('--polycount', type=int, default=30000); ap.add_argument('--approved', action='store_true')
    ap.add_argument('--raw-root', type=Path)
    ap.add_argument('--account', type=Path, help='Private metadata required for farm trial')
    a = ap.parse_args(); db = open_journal(a.journal)
    try:
        if a.command == 'submit':
            if not os.environ.get('MESHY_API_KEY'):
                raise ValueError('MESHY_API_KEY is not bound; no job was reserved or submitted')
            if not a.approved: raise ValueError('Remesh needs the owner approval flag')
            if not 100 <= a.polycount <= 300000: raise ValueError('polycount outside 100-300000')
            # (a second remesh of the same model is keyed "<asset>@<polycount>", e.g. clara-r2@9000)
            farm = a.source_asset.split('@')[0] in batch.FARM_ASSETS
            account = None
            if farm:
                if not a.account or a.account.resolve().is_relative_to(ROOT):
                    raise ValueError('Farm remesh requires private --account metadata')
                account = json.loads(a.account.read_text())
                batch.check_account(account, batch.spec_for(a.source_asset.split('@')[0]))
                if (a.polycount, a.source_asset) not in ((30000, a.source_asset.split('@')[0]), (9000, a.source_asset.split('@')[0]+'@9000')):
                    raise ValueError('Farm permits only original to 30k, then 30k to 9k')
            src = db.execute("SELECT task_id, state FROM jobs WHERE asset=?", (a.source_asset.split('@')[0],)).fetchone()
            if not src or src[1] != 'SUCCEEDED' or not src[0]: raise ValueError('Source asset has no succeeded task in this journal')
            if farm and a.polycount == 9000:
                src = db.execute('SELECT task_id, state FROM remesh WHERE source=?', (a.source_asset.split('@')[0],)).fetchone()
                if not src or src[1] != 'SUCCEEDED' or not src[0]:
                    raise ValueError('Farm 9k requires succeeded 30k remesh as source')
            params = {'input_task_id': src[0], 'target_formats': ['glb'], 'topology': 'triangle', 'target_polycount': a.polycount}
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT 1 FROM remesh WHERE source=?', (a.source_asset,)).fetchone():
                db.rollback(); raise ValueError('This source was already remeshed or reserved; reconcile, never repeat POST')
            if farm:
                total = batch.reserved_cost(db)
                if total + 5 > account['creditCap'] or total + 5 > account['batchStartingAPIBalance'] - 10:
                    raise ValueError('Farm total credit cap or balance reserve exceeded')
            db.execute('INSERT INTO remesh VALUES (?,?,?,?,?,NULL,NULL)', (a.source_asset, src[0], 5, json.dumps(params), 'ambiguous')); db.commit()
            res = api('POST', '', params); task = res.get('result')   # any failure leaves the reservation ambiguous
            if not isinstance(task, str) or not re.fullmatch(r'[A-Za-z0-9-]+', task): raise ValueError('Unrecognized response; reconcile in the dashboard')
            with db: db.execute("UPDATE remesh SET state='submitted', task_id=? WHERE source=?", (task, a.source_asset))
            print(json.dumps({'source': a.source_asset, 'taskId': task, 'state': 'submitted'}))
        elif a.command == 'poll':
            row = db.execute('SELECT task_id FROM remesh WHERE source=?', (a.source_asset,)).fetchone()
            if not row or not row[0]: raise ValueError('No remesh task recorded for this source')
            r = api('GET', '/' + row[0])
            if r.get('id') != row[0]: raise ValueError('Unrecognized task response')
            with db: db.execute('UPDATE remesh SET state=?, result=? WHERE source=?', (r.get('status'), json.dumps(r), a.source_asset))
            print(json.dumps({'source': a.source_asset, 'taskId': row[0], 'state': r.get('status'), 'progress': r.get('progress')}))
        else:
            if not a.raw_root or a.raw_root.resolve().is_relative_to(ROOT): raise ValueError('--raw-root outside the repository is required')
            row = db.execute('SELECT state, result FROM remesh WHERE source=?', (a.source_asset,)).fetchone()
            if not row or row[0] != 'SUCCEEDED': raise ValueError('Poll a successful remesh first')
            url = json.loads(row[1])['model_urls']['glb']; u = urlparse(url)
            if u.scheme != 'https' or u.hostname != 'assets.meshy.ai': raise ValueError('Unrecognized asset host')
            target = a.raw_root.resolve() / 'remesh' / (a.source_asset.replace('@', '-') + '.glb'); target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists(): raise ValueError('Raw download exists; preserve it')
            tmp = target.with_suffix('.' + uuid.uuid4().hex + '.partial'); size = 0
            try:
                with build_opener(NoRedirect).open(url, timeout=120) as r, tmp.open('xb') as f:
                    while chunk := r.read(1 << 20):
                        size += len(chunk); f.write(chunk)
                with tmp.open('rb') as f: head = f.read(12)
                if struct.unpack('<4sII', head) != (b'glTF', 2, size): raise ValueError('Not a complete GLB v2')
                os.link(tmp, target)
            finally: tmp.unlink(missing_ok=True)
            print(json.dumps({'source': a.source_asset, 'rawPath': str(target), 'bytes': size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}))
    except Exception as e:
        print(json.dumps({'errorType': type(e).__name__, 'message': str(e) if isinstance(e, ValueError) else 'Operation failed; reconcile the journal. No POST retry was attempted.'}))
        raise SystemExit(1)
    finally:
        db.close()

if __name__ == '__main__':
    main()

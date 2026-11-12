"""Meshy batch submission with a durable no-duplicate journal. Never retries POST.

Defaults to an offline summary. Paid submission requires an explicit subcommand,
a secure MESHY_API_KEY binding and recent account verification metadata.
Journal and account files belong outside the repository. See BATCH-RUNNER.md.
"""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import struct
import uuid
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'docs/meshy-production-20261107'
ENDPOINT = 'https://api.meshy.ai/openapi/v1/multi-image-to-3d'

FARM_ASSETS = ('cow', 'sheep', 'chicken')

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('API redirect refused')

def api(method, suffix, payload=None):
    key = os.environ.get('MESHY_API_KEY')
    if not key:
        raise ValueError('Bind MESHY_API_KEY securely in environment settings')
    assert not suffix or re.fullmatch(r'/[A-Za-z0-9-]+', suffix)
    data = None if payload is None else json.dumps(payload).encode()
    request = Request(ENDPOINT+suffix, data=data, method=method,
        headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
    with build_opener(NoRedirect).open(request, timeout=60) as response:
        return json.load(response)

BODY = ROOT/'docs/friends-body-sheets-20261108'
BODY_PARAMETERS = {'ai_model':'meshy-7.1','geometry_resolution':'standard','should_texture':True,'texture_resolution':'2k',
    'enable_pbr':False,'pose_mode':'','target_formats':['glb'],'image_enhancement':False}

def body_spec(spec):
    """(8 Nov 2026, owner: friends as a Meshy body + clothes made in the game) a body job (assetId '<friend>-body') sends
    views cut from that friend's body sheet (tools/meshy/crop_body_sheets.py), checked against their recorded hashes:
    an ordered subset of the sheet's views starting with the front, the reviewed model tier, 30 credits."""
    # (the T-shirt pack's views are in its MANIFEST; a later pack's chosen colour in its own SELECTION.json, e.g. the grey
    # swim kit: <friend>-swim, docs/friends-swim-sheets-20261108)
    pack = spec.get('bodyPack', 'docs/friends-body-sheets-20261108')
    if pack not in ('docs/friends-body-sheets-20261108', 'docs/friends-swim-sheets-20261108'):
        raise ValueError('Unknown body-sheet pack')
    suffix = '-body' if pack.endswith('body-sheets-20261108') else '-swim'
    man = json.loads(((ROOT/pack)/('MANIFEST.json' if suffix == '-body' else 'SELECTION.json')).read_text(encoding='utf-8'))
    friend = spec['bodyOf']; a = next((x for x in man['assets'] if x['id']==friend), None)
    if a is None or spec['assetId'] != friend+suffix:
        raise ValueError('A body job must be <friend>-body or <friend>-swim for a friend in its pack')
    if suffix == '-swim' and hashlib.sha256((ROOT/pack/a['image']).read_bytes()).hexdigest() != a['imageSHA256']:
        raise ValueError('The chosen swim sheet changed since it was selected')
    reviewed = [(pack+'/'+c['path'], c['sha256']) for c in a.get('viewCrops', [])]
    inputs = [(i['localPath'], i['sha256']) for i in spec['inputImages']]
    if not reviewed or len(inputs) < 2 or not all(x in reviewed for x in inputs) or inputs != [r for r in reviewed if r in inputs] or inputs[0] != reviewed[0]:
        raise ValueError('Body job inputs differ from the recorded body-sheet views')
    if spec['parameters'] != BODY_PARAMETERS or spec['plannedCredits'] != 30 or not spec.get('bodyReason'):
        raise ValueError('Body job parameters, budget or reason differ from the reviewed plan')
    return spec

def spec_for(asset):
    paths = list((OUT/'job-specifications').glob(f'*-{asset}.json'))
    if len(paths) != 1:
        raise ValueError('Unknown or ambiguous asset')
    spec = json.loads(paths[0].read_text())
    if spec.get('bodyOf'):
        return body_spec(spec)
    manifest = json.loads((OUT/'ASSET-MANIFEST.json').read_text())
    if len(manifest['assets'])!=43 or not all(a['reviewStatus']=='technical_pass' and len(a.get('viewCrops',[]))==len(a['views']) for a in manifest['assets']):
        raise ValueError('Finish technical review and cropping for all 43 original assets first')
    # (7 Nov 2026) an owner-approved revision of a reviewed asset (its own asset ID, e.g. clara-r2): the same reviewed
    # views, a subset of them in their reviewed order, e.g. leaving out a view that disagrees with the others
    base_id = spec.get('revisionOf') or asset
    if spec.get('revisionOf') and not spec.get('revisionReason'):
        raise ValueError('A revision must record its reason')
    expected = next(a for a in manifest['assets'] if a['id']==base_id)
    parameters = {'ai_model':'meshy-7.1' if expected['group'] in 'ABCD' else 'meshy-6-lite',
        'geometry_resolution':'standard','should_texture':True,'texture_resolution':'2k',
        'enable_pbr':False,'pose_mode':'','target_formats':['glb']}
    # Owner, 13 Nov 2026 AEDT: three farm trials, 120 credits including two remeshes each.
    override = spec.get('tierOverride')
    credits = expected['plannedCredits']
    if override is not None:
        if asset not in FARM_ASSETS or expected['group'] != 'E' or override != 'meshy-7.1' or not spec.get('approval'):
            raise ValueError('Unapproved tier override scope or missing approval reason')
        parameters['ai_model'] = override
        credits = 30
    if parameters['ai_model']=='meshy-7.1':
        parameters['image_enhancement']=False
    if spec['assetId']!=asset or spec['parameters']!=parameters or spec['plannedCredits']!=credits or spec['group']!=expected['group']:
        raise ValueError('Job parameters differ from reviewed model tier and budget')
    inputs = [(i['localPath'],i['sha256']) for i in spec['inputImages']]
    reviewed = [(i['path'],i['sha256']) for i in expected['viewCrops']]
    if spec.get('revisionOf'):
        same = len(inputs)>=2 and all(x in reviewed for x in inputs) and inputs==[r for r in reviewed if r in inputs] and inputs[0]==reviewed[0]
    else:
        same = inputs==reviewed
    if expected['reviewStatus']!='technical_pass' or not same:
        raise ValueError('Job inputs differ from reviewed views')
    return spec

def payload_for(spec):
    payload = dict(spec['parameters'])
    urls = []
    base = (ROOT/spec.get('bodyPack', 'docs/friends-body-sheets-20261108')) if spec.get('bodyOf') else OUT   # (a body job's views are repository paths in its pack)
    for image in spec['inputImages']:
        path = ((ROOT if spec.get('bodyOf') else OUT)/image['localPath']).resolve()
        if not path.is_relative_to(base) or not path.is_file():
            raise ValueError('Invalid local image')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != image['sha256']:
            raise ValueError('Input image changed since review')
        urls.append('data:image/png;base64,'+base64.b64encode(data).decode())
    if len(urls) not in (2,3):
        raise ValueError('Unexpected view count')
    payload['image_urls'] = urls
    return payload

def journal(path):
    path = Path(path).resolve()
    if path.is_relative_to(ROOT):
        raise ValueError('Keep the live journal outside the repository')
    db = sqlite3.connect(path, timeout=10)
    db.execute('PRAGMA synchronous=FULL')
    db.execute('CREATE TABLE IF NOT EXISTS jobs (asset TEXT PRIMARY KEY, cost INTEGER NOT NULL, payload_hash TEXT NOT NULL, state TEXT NOT NULL, task_id TEXT UNIQUE, result TEXT)')
    db.commit()
    return db

def reserved_cost(db):
    total = 0
    for table in ('jobs', 'remesh'):
        if db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone():
            total += db.execute('SELECT COALESCE(SUM(cost),0) FROM '+table).fetchone()[0]
            if db.execute("SELECT 1 FROM "+table+" WHERE state IN ('ambiguous','FAILED','CANCELED','CANCELLED')").fetchone():
                raise ValueError('Stop and reconcile ambiguous or failed jobs before continuing')
    return total

def reserve(db, asset, cost, digest, balance, cap=990):
    if cost not in (15,30):
        raise ValueError('Unexpected job cost')
    try:
        db.execute('BEGIN IMMEDIATE')
        if db.execute('SELECT 1 FROM jobs WHERE asset=?',(asset,)).fetchone():
            raise ValueError('Asset already reserved/submitted; reconcile it, never repeat POST')
        if db.execute("SELECT 1 FROM jobs WHERE state='ambiguous'").fetchone():
            raise ValueError('Reconcile every ambiguous submission before continuing')
        total = reserved_cost(db)
        if total+cost > cap or total+cost > balance-10:
            raise ValueError('Credit budget or 10-credit reserve would be exceeded')
        db.execute('INSERT INTO jobs VALUES (?,?,?,?,NULL,NULL)',(asset,cost,digest,'ambiguous'))
        db.commit()  # Persist BEFORE the network request, including crash/lost-response cases.
    except Exception:
        db.rollback()
        raise

def check_account(account, spec):
    stamp = datetime.fromisoformat(account['verifiedAt'].replace('Z','+00:00'))
    age = (datetime.now(timezone.utc)-stamp).total_seconds()
    if age < 0 or age > 86400:
        raise ValueError('Account verification must be within the last 24 hours')
    if spec.get('tierOverride'):
        # This owner-approved trial uses the live balance GET and its own cap,
        # without claiming old web-account/private-settings checks were performed.
        if spec['assetId'] not in FARM_ASSETS or spec['assetId'] not in account.get('approvedTierOverrides', []):
            raise ValueError('Owner tier override missing from private account metadata')
        if account.get('apiCreditBalanceConfirmed') is not True or account.get('creditCap') != 120 or account.get('batchStartingAPIBalance', 0) < 130:
            raise ValueError('Farm trial requires verified balance, cap 120 and 10-credit reserve')
        return
    for key in ('sameAccountAsKey','privateAssetsConfirmed','apiCreditBalanceConfirmed','pricingConfirmed'):
        if account.get(key) is not True:
            raise ValueError('Missing verified account setting: '+key)
    if account.get('batchStartingAPIBalance',0) < 1000:
        raise ValueError('This batch needs at least 1000 verified API credits')
    if spec.get('revisionOf') and spec['assetId'] not in (account.get('approvedRevisions') or []):
        raise ValueError('The owner has not approved this revision in the account record')
    if spec.get('bodyOf') and spec['assetId'] not in (account.get('approvedBodies') or []):
        raise ValueError('The owner has not approved this body job in the account record')
    if spec['assetId'] != 'clara' and spec.get('revisionOf') != 'clara' and account.get('claraPilotAccepted') is not True:
        raise ValueError('Inspect the Clara pilot before continuing A to G')

def submit(db, spec, account, transport=api):
    check_account(account,spec)
    payload = payload_for(spec)
    digest = hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
    reserve(db,spec['assetId'],spec['plannedCredits'],digest,account['batchStartingAPIBalance'],120 if spec.get('tierOverride') else 990)
    # Any transport/parse failure deliberately leaves the row ambiguous and reserved.
    result = transport('POST','',payload)
    task = result.get('result')
    if not isinstance(task,str) or not re.fullmatch(r'[A-Za-z0-9-]+',task):
        raise ValueError('Unrecognized response; reconcile account tasks before proceeding')
    with db:
        db.execute('UPDATE jobs SET state=?,task_id=? WHERE asset=?',('submitted',task,spec['assetId']))
    return {'asset':spec['assetId'],'taskId':task,'state':'submitted'}

def download(db, asset, raw_root):
    destination = Path(raw_root).resolve()
    if destination.is_relative_to(ROOT):
        raise ValueError('Keep raw Meshy models outside the game repository')
    row = db.execute('SELECT state,result FROM jobs WHERE asset=?',(asset,)).fetchone()
    if not row or row[0] != 'SUCCEEDED':
        raise ValueError('Poll a successful task before downloading')
    url = json.loads(row[1])['model_urls']['glb']
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname != 'assets.meshy.ai' or parsed.port not in (None,443) or parsed.username:
        raise ValueError('Unrecognized asset host; verify official download host first')
    spec = spec_for(asset)
    target = destination/spec['group']/(asset+'.glb')
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        raise ValueError('Raw download exists; preserve it and inspect before replacing')
    temporary = target.with_suffix('.'+uuid.uuid4().hex+'.partial')
    try:
        # No Authorization header is sent to the asset download host.
        with build_opener(NoRedirect).open(url,timeout=60) as response, temporary.open('xb') as stream:
            size = 0
            while chunk := response.read(1024*1024):
                size += len(chunk)
                if size > 256*1024*1024:
                    raise ValueError('Raw model exceeds 256 MB download limit')
                stream.write(chunk)
        with temporary.open('rb') as stream:
            header = stream.read(12)
        if len(header)!=12 or struct.unpack('<4sII',header)!=(b'glTF',2,size):
            raise ValueError('Downloaded file is not a complete GLB v2')
        os.link(temporary,target)  # Atomic publish, refusing to overwrite an existing raw asset.
    finally:
        temporary.unlink(missing_ok=True)
    return {'asset':asset,'rawPath':str(target),'bytes':size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',nargs='?',default='plan',choices=['plan','check','submit','poll','attach','download'])
    parser.add_argument('--asset')
    parser.add_argument('--journal',type=Path)
    parser.add_argument('--account',type=Path)
    parser.add_argument('--task-id')
    parser.add_argument('--raw-root',type=Path)
    parser.add_argument('--confirmed-task-matches',action='store_true')
    args = parser.parse_args()
    if args.command == 'plan':
        print(json.dumps({'assets':43,'plannedCredits':990,'reserveCredits':10,'networkCalls':0,'next':'Clara pilot after verified account connection'}))
        return
    if args.command == 'check':   # (offline: the job's views and payload as they would be sent; no key, no journal, no network)
        spec = spec_for(args.asset); payload = payload_for(spec)
        print(json.dumps({'asset':spec['assetId'],'views':[i['view'] for i in spec['inputImages']],'plannedCredits':spec['plannedCredits'],
            'payloadSHA256':hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest(),'networkCalls':0}))
        return
    if not args.journal or not args.asset:
        parser.error('--journal outside the repository and --asset are required')
    if args.command != 'download' and not os.environ.get('MESHY_API_KEY'):
        raise ValueError('MESHY_API_KEY is not bound; no job was reserved or submitted')
    db = journal(args.journal)
    try:
        if args.command == 'submit':
            if not args.account or args.account.resolve().is_relative_to(ROOT):
                parser.error('--account metadata file outside the repository is required')
            print(json.dumps(submit(db,spec_for(args.asset),json.loads(args.account.read_text()))))
        elif args.command == 'download':
            if not args.raw_root:
                parser.error('--raw-root outside the repository is required')
            print(json.dumps(download(db,args.asset,args.raw_root)))
        else:
            row = db.execute('SELECT state,task_id FROM jobs WHERE asset=?',(args.asset,)).fetchone()
            if row is None:
                raise ValueError('No reserved job for this asset')
            task = row[1]
            if args.command == 'attach':
                if row[0]!='ambiguous' or task or not args.confirmed_task_matches:
                    raise ValueError('Attach only after matching the ambiguous job to its dashboard request')
                task = args.task_id
            if not task or not re.fullmatch(r'[A-Za-z0-9-]+',task):
                raise ValueError('Missing task ID; reconcile in dashboard, never resubmit')
            result = api('GET','/'+task)
            if result.get('id') != task or result.get('status') not in ('PENDING','IN_PROGRESS','SUCCEEDED','FAILED','CANCELED','CANCELLED'):
                raise ValueError('Unrecognized task response')
            with db:
                db.execute('UPDATE jobs SET state=?,task_id=?,result=? WHERE asset=?',
                    (result['status'],task,json.dumps(result),args.asset))
            print(json.dumps({'asset':args.asset,'taskId':task,'state':result['status']}))
    finally:
        db.close()

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print provider response bodies, request headers, keys or signed URLs.
        print(json.dumps({'errorType':type(error).__name__,'message':str(error) if isinstance(error,ValueError) else 'Operation failed; inspect/reconcile the durable journal. No POST retry was attempted.'}))
        raise SystemExit(1)

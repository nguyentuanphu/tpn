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

def spec_for(asset):
    paths = list((OUT/'job-specifications').glob(f'*-{asset}.json'))
    if len(paths) != 1:
        raise ValueError('Unknown or ambiguous asset')
    spec = json.loads(paths[0].read_text())
    manifest = json.loads((OUT/'ASSET-MANIFEST.json').read_text())
    if len(manifest['assets'])!=43 or not all(a['reviewStatus']=='technical_pass' and len(a.get('viewCrops',[]))==len(a['views']) for a in manifest['assets']):
        raise ValueError('Finish technical review and cropping for all 43 original assets first')
    expected = next(a for a in manifest['assets'] if a['id']==asset)
    parameters = {'ai_model':'meshy-7.1' if expected['group'] in 'ABCD' else 'meshy-6-lite',
        'geometry_resolution':'standard','should_texture':True,'texture_resolution':'2k',
        'enable_pbr':False,'pose_mode':'','target_formats':['glb']}
    if parameters['ai_model']=='meshy-7.1':
        parameters['image_enhancement']=False
    if spec['assetId']!=asset or spec['parameters']!=parameters or spec['plannedCredits']!=expected['plannedCredits'] or spec['group']!=expected['group']:
        raise ValueError('Job parameters differ from reviewed model tier and budget')
    inputs = [(i['localPath'],i['sha256']) for i in spec['inputImages']]
    reviewed = [(i['path'],i['sha256']) for i in expected['viewCrops']]
    if expected['reviewStatus']!='technical_pass' or inputs!=reviewed:
        raise ValueError('Job inputs differ from reviewed views')
    return spec

def payload_for(spec):
    payload = dict(spec['parameters'])
    urls = []
    for image in spec['inputImages']:
        path = (OUT/image['localPath']).resolve()
        if not path.is_relative_to(OUT) or not path.is_file():
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

def reserve(db, asset, cost, digest, balance):
    if cost not in (15,30):
        raise ValueError('Unexpected job cost')
    try:
        db.execute('BEGIN IMMEDIATE')
        if db.execute('SELECT 1 FROM jobs WHERE asset=?',(asset,)).fetchone():
            raise ValueError('Asset already reserved/submitted; reconcile it, never repeat POST')
        if db.execute("SELECT 1 FROM jobs WHERE state='ambiguous'").fetchone():
            raise ValueError('Reconcile every ambiguous submission before continuing')
        total = db.execute('SELECT COALESCE(SUM(cost),0) FROM jobs').fetchone()[0]
        if total+cost > 990 or total+cost > balance-10:
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
    for key in ('sameAccountAsKey','privateAssetsConfirmed','apiCreditBalanceConfirmed','pricingConfirmed'):
        if account.get(key) is not True:
            raise ValueError('Missing verified account setting: '+key)
    if account.get('batchStartingAPIBalance',0) < 1000:
        raise ValueError('This batch needs at least 1000 verified API credits')
    if spec['assetId'] != 'clara' and account.get('claraPilotAccepted') is not True:
        raise ValueError('Inspect the Clara pilot before continuing A to G')

def submit(db, spec, account, transport=api):
    check_account(account,spec)
    payload = payload_for(spec)
    digest = hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
    reserve(db,spec['assetId'],spec['plannedCredits'],digest,account['batchStartingAPIBalance'])
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
    parser.add_argument('command',nargs='?',default='plan',choices=['plan','submit','poll','attach','download'])
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

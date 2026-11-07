# (Meshy production, 8 Nov 2026) CREDIT-LEDGER.json brought up to date from the private job journal (outside the
# repository): each model job's task and state on its roster entry, the remesh / rigging jobs and owner-approved
# revisions listed under "extras", and the total charged. Succeeded or in-progress jobs count as charged (Meshy takes
# the credits when the task is accepted); failed ones are listed with 0. Never calls Meshy.
#   python tools/meshy/ledger_sync.py [journal.sqlite3] [ledger.json]
import json, sqlite3, sys, os
DB = sys.argv[1] if len(sys.argv) > 1 else r'D:\WorkSpace\meshy\private\meshy-jobs.sqlite3'
LED = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'meshy-production-20261107', 'CREDIT-LEDGER.json')
L = json.load(open(LED, encoding='utf-8')); c = sqlite3.connect(DB)
paid = lambda s: s in ('SUCCEEDED', 'IN_PROGRESS', 'PENDING', 'submitted', 'SUBMITTED')
by = {e['assetId']: e for e in L['entries']}; extras = []
for asset, cost, state, task in c.execute('select asset, cost, state, task_id from jobs'):
    ch = int(cost) if paid(state) else 0
    if asset in by:
        e = by[asset]; e.update(reservedCredits=int(cost), chargedCredits=ch, taskId=task, state=state + ('_raw_downloaded' if state == 'SUCCEEDED' else ''))
    else: extras.append({'kind': 'model-revision', 'source': asset, 'chargedCredits': ch, 'taskId': task, 'state': state})
for kind, table in (('remesh', 'remesh'), ('rigging', 'rigging')):
    for src, cost, state, task in c.execute(f'select source, cost, state, task_id from {table}'):
        extras.append({'kind': kind, 'source': src, 'chargedCredits': int(cost) if paid(state) else 0, 'taskId': task, 'state': state})
L['extras'] = extras
L['charged'] = sum(e.get('chargedCredits', 0) for e in L['entries']) + sum(x['chargedCredits'] for x in extras)
L['syncedFrom'] = 'tools/meshy/ledger_sync.py (private job journal)'
json.dump(L, open(LED, 'w', encoding='utf-8', newline='\n'), indent=2, ensure_ascii=False); open(LED, 'a', encoding='utf-8').write('\n')
print('charged', L['charged'], 'models', sum(1 for e in L['entries'] if e.get('chargedCredits')), 'extras', len(extras))

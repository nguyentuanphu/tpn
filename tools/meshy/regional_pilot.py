"""(10 Nov 2026, owner: regional villagers, pilot of 6, at most 270 credits) One paid Meshy step for one pilot person, through
the batch tools' durable journal (run_batch.py, remesh_once.py, rig_once.py: reserve, then one POST, never retried), with
the pilot's own cap on top. The owner is asked before every paid step (pop-up in the chat); this tool never chains steps.
  python tools/meshy/regional_pilot.py status
  python tools/meshy/regional_pilot.py submit r045 make|remesh30k|remesh9k|rig     (paid: 30, 5, 5, 5 credits)
  python tools/meshy/regional_pilot.py wait   r045 make|remesh30k|remesh9k|rig     (polls every 20 s, up to 30 min, then downloads)
Journal: $SV_MESHY_ROOT/private/meshy-jobs-cloud.sqlite3 (outside the repository, never committed); account record:
$SV_MESHY_ROOT/private/meshy-account.json; raw files: $SV_MESHY_ROOT/raw-models/{B,remesh,rigged}. MESHY_API_KEY from the
environment only. Since GitHub refuses releases from the cloud session (10 Nov), the journal and raw files are sent to the
owner in the chat after every paid step (owner's choice).
"""
import json, os, subprocess, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import run_batch, remesh_once, rig_once

ROOT = Path(__file__).resolve().parents[2]
PILOT = run_batch.REGIONAL_PILOT
CAP = 270
STEPS = {'make': (30, 'run_batch.py'), 'remesh30k': (5, 'remesh_once.py'), 'remesh9k': (5, 'remesh_once.py'), 'rig': (5, 'rig_once.py')}
MROOT = Path(os.environ.get('SV_MESHY_ROOT', r'D:\WorkSpace\meshy'))
JOURNAL = MROOT/'private'/'meshy-jobs-cloud.sqlite3'
ACCOUNT = MROOT/'private'/'meshy-account.json'
RAW = MROOT/'raw-models'

def open_all():
    JOURNAL.parent.mkdir(parents=True, exist_ok=True)
    for f in (run_batch.journal, remesh_once.open_journal, rig_once.open_journal): f(JOURNAL).close()   # (the same tables as overnight.ps1)
    return run_batch.journal(JOURNAL)

def rows(db):
    out = []
    for asset, cost, state, task in db.execute('select asset, cost, state, task_id from jobs'): out.append(('make', asset, cost, state, task))
    for t, k in (('remesh', 'remesh'), ('rigging', 'rig')):
        for src, cost, state, task in db.execute(f'select source, cost, state, task_id from {t}'):
            out.append((('remesh9k' if src.endswith('@9000') else 'remesh30k') if k == 'remesh' else 'rig', src, cost, state, task))
    return out

def tool(script, *args):
    r = subprocess.run([sys.executable, str(ROOT/'tools'/'meshy'/script), *args], capture_output=True, text=True, cwd=ROOT)
    out = (r.stdout + r.stderr).strip()
    print(out)
    if r.returncode or 'errorType' in out: raise SystemExit(1)
    return out

def args_for(cmd, asset, step):
    j = ['--journal', str(JOURNAL)]
    if step == 'make':
        return [cmd, '--asset', asset] + j + (['--account', str(ACCOUNT)] if cmd == 'submit' else []) + (['--raw-root', str(RAW)] if cmd == 'download' else [])
    src = asset + ('@9000' if step == 'remesh9k' else '')
    a = [cmd, '--source-asset', src] + j
    if cmd == 'submit': a += ['--approved'] + (['--polycount', '9000' if step == 'remesh9k' else '30000'] if step != 'rig' else ['--height', '1.25'])
    if cmd == 'download': a += ['--raw-root', str(RAW)]
    return a

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'
    db = open_all()
    try:
        if cmd == 'status':
            rs = rows(db); spent = sum(r[2] for r in rs)
            for r in rs: print('%-9s %-10s %3d %-10s %s' % r)
            print(json.dumps({'reservedCredits': spent, 'cap': CAP, 'left': CAP - spent})); return
        asset, step = sys.argv[2], sys.argv[3]
        if asset not in PILOT or step not in STEPS: raise ValueError('pilot person r045/r050/r057/r064/r074/r084 and step make/remesh30k/remesh9k/rig')
        cost, script = STEPS[step]
        if cmd == 'submit':
            if not os.environ.get('MESHY_API_KEY'): raise ValueError('MESHY_API_KEY is not set: no job was reserved')
            spent = sum(r[2] for r in rows(db))   # (every reservation counts, failed or not: nothing is ever retried)
            if spent + cost > CAP: raise ValueError(f'pilot cap: {spent} reserved, this step {cost} would pass {CAP}')
            db.close(); db = None
            tool(script, *args_for('submit', asset, step))
        elif cmd == 'wait':
            db.close(); db = None
            for _ in range(90):
                o = tool(script, *args_for('poll', asset, step))
                if 'SUCCEEDED' in o: break
                if 'FAILED' in o or 'CANCEL' in o: raise ValueError(f'{asset} {step} failed')
                time.sleep(20)
            else: raise ValueError(f'{asset} {step} did not finish in 30 min')
            tool(script, *args_for('download', asset, step))
        else: raise ValueError('status, submit or wait')
    finally:
        if db: db.close()

if __name__ == '__main__':
    try: main()
    except ValueError as e:
        print(json.dumps({'errorType': 'ValueError', 'message': str(e)})); raise SystemExit(1)

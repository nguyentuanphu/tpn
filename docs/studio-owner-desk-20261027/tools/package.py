"""Package all cumulative committed review changes; do not include secrets or nested archives."""
from pathlib import Path
import argparse,hashlib,json,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[1];REPO=ROOT.parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--base',default='b241286a');parser.add_argument('--output',required=True);parser.add_argument('--tested-sha',required=True);parser.add_argument('--run-url',required=True);args=parser.parse_args()
def git(*values):return subprocess.check_output(['git',*values],cwd=REPO)
head=git('rev-parse','HEAD').decode().strip();base=git('rev-parse',args.base).decode().strip()
later=git('diff','--name-only',args.tested_sha,head).decode().splitlines()
assert all(p.startswith('docs/') or p in ['tests/check-map.json','tests/check-times.json'] for p in later),'Runtime changed after the named test target; update provenance before packaging'
output=Path(args.output);assert not output.exists(),'Refusing to overwrite a source checkpoint archive'
changed=git('diff','--name-only','--diff-filter=ACMR',base,head).decode().splitlines()
deleted=git('diff','--name-only','--diff-filter=D',base,head).decode().splitlines()
# All source and documentation changes, including older rounds, are retained.
# Already-published downloadable ZIPs are separate repository artifacts, not nested copies.
paths=[name for name in changed if not name.endswith('.zip')]
files={'source/'+name:git('show',head+':'+name) for name in paths}
readme=f'''# Sparkle Valley Studio cumulative source checkpoint

Source snapshot: {head}
Base: released v1.02 {base}
Comprehensive run target: {args.tested_sha}
Run: {args.run_url}

This is every committed added/changed source and documentation file since the base, excluding nested ZIP downloads. It is a source overlay for an isolated checkout of that base, not a standalone game, Windows executable, Netlify deployment ZIP or proof the full suite passed. The validation/handoff documents record the actual state of the run and remaining work. Artwork/media that did not change are inherited from the base repository, not duplicated here.

Preferred resumption: fetch branch review/studio-finance-20261027 from https://github.com/nguyentuanphu/tpn and read docs/studio-owner-desk-20261027/NEXT-CHAT.md. For offline source review, copy source/ into a clean isolated checkout at the base and review the deletion list before applying it. Do not overlay family saves or uncommitted user work.

Generate ignored JavaScript using node tools/build.mts after locked dependency installation. Use the existing Netlify Database and server-side NETLIFY_DB_URL; no connection string is included. No production activation, main merge, version bump, payment or deployment occurred.

Deleted paths: {json.dumps(deleted)}
'''
files['REVIEW-README.md']=readme.encode()
files['REVIEW-PROVENANCE.json']=json.dumps({'base':base,'sourceSnapshot':head,'testedCommit':args.tested_sha,'runUrl':args.run_url,'deleted':deleted,'nestedArchivesExcluded':True,'scope':'Cumulative source overlay; validation result must be read from the handoff, never inferred from packaging'},indent=2).encode()
manifest=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(files.items()))
modes={}
for row in git('ls-tree','-r',head).decode().splitlines():
 meta,name=row.split('\t',1);modes['source/'+name]=int(meta.split()[0],8)
with zipfile.ZipFile(output,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
 for name,data in files.items():
  mode=modes.get(name,0o100644);assert mode&0o170000==0o100000,('Nonregular source',name)
  item=zipfile.ZipInfo(name);item.create_system=3;item.external_attr=mode<<16;item.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(item,data)
 archive.writestr('REVIEW-MANIFEST.sha256',manifest)
with zipfile.ZipFile(output) as archive:
 assert archive.testzip() is None
 for line in manifest.splitlines():
  digest,name=line.split('  ',1);assert hashlib.sha256(archive.read(name)).hexdigest()==digest,name
print(json.dumps({'file':str(output),'bytes':output.stat().st_size,'files':len(files)+1,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceSnapshot':head,'testedCommit':args.tested_sha}))

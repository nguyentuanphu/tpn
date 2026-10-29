"""Portable review documents/pictures; the Git branch remains the full-source handoff."""
from pathlib import Path
import hashlib,json,zipfile,subprocess
root=Path(__file__).resolve().parents[3];out=root/'docs/studio-combined-handoff-20261029'
files={p for p in out.rglob('*') if p.is_file() and p.suffix not in ['.zip'] and p.name not in ['PACKAGE.json','PUBLIC-DELIVERY.json']}
plans=json.loads((out/'PLAN-CATALOGUE.json').read_text())['documents'];files.update(root/p['path']for p in plans)
for folder,patterns in [('docs/studio-connected-concept-20261027',['*.json','images/*']),('docs/studio-management-foundation',['*.json','schemas/*','diagrams/*']),('docs/studio-revamp-master-20261027',['concept.json','images/*']),('docs/studio-functions-20261029',['FIELD-CONTRACTS.json','FUNCTION-REGISTRY.json']),('docs/studio-control-recovery-20261029',['RECOVERY-STATES.json']),('docs/studio-content-website-20261029',['art-audit.json','voice-audit.json','screenshots/*'])]:
 for pattern in patterns:files.update(p for p in (root/folder).glob(pattern)if p.is_file())
files.update(root/p for p in ['STUDIO-START-HERE.md','CLAUDE.md','HANDOFF.md','docs/ARCHITECTURE.md','docs/SO-TAY-THIET-KE.md','docs/cores/BOARD.md','docs/cores/release.md'])
archive=out/'Studio-combined-review.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in sorted(files):z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(archive)as z:assert z.testzip()is None
record={'scope':'Review documents, machine-readable registers/evidence and pictures; not a deployable game/website or full media/source distribution. Clone the combined branch for all code/assets.','sourceHeadAtPackaging':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'archive':archive.name,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'entries':len(files),'zipCRC':'passed','files':[p.relative_to(root).as_posix()for p in sorted(files)],'deploymentPerformed':False}
(out/'PACKAGE.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({k:v for k,v in record.items()if k!='files'}))

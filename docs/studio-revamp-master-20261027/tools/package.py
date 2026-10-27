"""Validate/package the documentation; deliberately excludes nested archives."""
from pathlib import Path
import json,re,hashlib,zipfile,datetime
from zoneinfo import ZoneInfo
P=Path(__file__).resolve().parents[1]
errors=[];links=0
for f in P.glob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',f.read_text()):
  if target.startswith(('http:','https:','#')):continue
  target=target.split('#')[0]
  if not (f.parent/target).exists():errors.append(f'{f.name}: {target}')
  links+=1
assert not errors,errors
model=json.loads((P/'concept.json').read_text())
assert len(model['domains'])==13
assert len(model['conceptPages'])==7
validation=json.loads((P/'VALIDATION.json').read_text())
assert len(validation['checks'])==21 and not validation['errors']
ci=json.loads((P/'evidence/ci-observation.json').read_text())
assert ci['checksAvailable']==253 and ci['passedAvailable']==253
assert len(ci['artifactsAvailable'])==9 and ci['conclusion']=='success'
assert any(j['name']=='collect' and j['conclusion']=='success' for j in ci['jobs'])
validation['rootMarkdownLinksChecked']=links
validation['referenceSnapshotLinkPolicy']='Original cross-handbook relative links retain original context; references/README.md explains online originals.'
(P/'VALIDATION.json').write_text(json.dumps(validation,indent=2)+'\n')
files=sorted(f for f in P.rglob('*') if f.is_file() and f.suffix!='.zip' and f.name not in ['PACKAGE.json','MANIFEST.sha256'] and '__pycache__' not in f.parts)
digest=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
(P/'MANIFEST.sha256').write_text(''.join(digest(f)+'  '+str(f.relative_to(P))+'\n' for f in files))
archive=P/'Studio-revamp-complete-handoff.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in files+[P/'MANIFEST.sha256']:z.write(f,Path(P.name)/f.relative_to(P))
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
result={'createdAtSydney':datetime.datetime.now(ZoneInfo('Australia/Sydney')).isoformat(),'archive':archive.name,'bytes':archive.stat().st_size,'sha256':digest(archive),'filesInArchive':len(files)+1,'purpose':'Complete consolidated design/handoff with reference docs, static offline concept and images; not runtime source or a deployable Netlify ZIP','runtimeSourceCommit':'35bcb63c0c9682bb9d32885063c8b7dc7b3c86df','rootMarkdownLinksChecked':links,'imageViews':21,'allConceptDataFictional':True}
(P/'PACKAGE.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

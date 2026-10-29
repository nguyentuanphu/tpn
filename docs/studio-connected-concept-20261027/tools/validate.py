"""Validate documentation links, registry cross-references and offline packaging."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
r=json.loads((ROOT/'registry.json').read_text())
checks=0
def check(ok,context):
 global checks
 assert ok,context
 checks+=1
groups={key:{p['id'] for p in r[key]} for key in ['data_points','graphs','controls','connections']}
for key,ids in groups.items():check(len(ids)==len(r[key]),key+' unique IDs')
for p in r['data_points']:
 for key in ['graphs','controls','connections']:check(set(p[key])<=groups[key],(p['id'],key))
 for key in ['source','transport','storage','access','join_rule','privacy','retention','null_rule','mapping_precision']:check(bool(p[key]),(p['id'],key))
for g in r['graphs']:
 check(set(g['data_ids']+g['refined_data_ids'])<=groups['data_points'],g['id']+' inputs')
 check(set(g['connections'])<=groups['connections'],g['id']+' connections')
for c in r['controls']:check(set(c['connections'])<=groups['connections'],c['id'])
for doc in ROOT.glob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',doc.read_text()):
  if target.startswith(('https:','http:','#')):continue
  check((doc.parent/target.split('#')[0]).exists(),(doc.name,target))
html=(ROOT/'review.html').read_text()
embedded=re.search(r'<script type="application/json" id="registry">(.*?)</script>',html,re.S)
check(bool(embedded),'embedded register')
check(json.loads(embedded.group(1))==r,'embedded register matches JSON')
check('__REGISTRY__' not in html,'no unresolved embed token')
check('fetch(' not in html and 'XMLHttpRequest' not in html,'no application request code')
for target in re.findall(r'(?:src|href)="([^"]+)"',html):
 if not target.startswith(('#','http','data:')):check((ROOT/target).is_file(),target)
for row in json.loads((ROOT/'source-evidence.json').read_text()):
 original=subprocess.check_output(['git','show',row['source_commit']+':'+row['path']],cwd=REPO)
 check(hashlib.sha256(original).hexdigest()==row['sha256'],row['path']+' pinned source hash')
b=json.loads((ROOT/'browser-validation.json').read_text())
for name,expected in b['sourceHashes'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,name+' browser evidence freshness')
check(b['passed'] and not b['errors'] and not b['externalRequests'],'browser review success')
check(len(b['results'])==15,'15 browser concept views')
for row in b['results']:check((ROOT/row['screenshot']).is_file(),row['screenshot'])
report={'passed':True,'checks':checks,'scope':'Concept documentation, cross-references, existing pinned source bytes, embedded registry and offline browser evidence. Not runtime/full-suite/live database validation.','counts':{k:len(r[k]) for k in ['data_points','graphs','controls','connections','metrics']}}
(ROOT/'document-validation.json').write_text(json.dumps(report,indent=2)+'\n')
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.name!='MANIFEST.sha256' and p.suffix!='.zip' and '__pycache__' not in p.parts)
(ROOT/'MANIFEST.sha256').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(ROOT))+'\n' for p in files))
print(json.dumps(report))

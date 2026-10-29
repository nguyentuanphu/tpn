"""Index preserved plans and current implementation without turning proposals into completed work."""
from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parents[3]
out=root/'docs/studio-combined-handoff-20261029'
folders=[p for p in (root/'docs').iterdir() if p.is_dir() and (p.name.startswith('studio-') or p.name=='website-review-20261023')]
rows=[]
for folder in sorted(folders):
 if folder==out:continue
 for p in sorted(folder.rglob('*.md')):
  text=p.read_text();title=next((l.lstrip('# ').strip()for l in text.splitlines()if l.startswith('#')),p.stem)
  rows.append({'path':str(p.relative_to(root)),'title':title,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'authority':'original_contract_or_historical_record; current status is STATUS.md and WORK-REGISTER.json'})
for name in ['docs/owner-repair-20261014/STUDIO-LIVE-TAKEOVER-PROMPT.md','docs/owner-repair-20261014/STUDIO-LIVE-CHAT-PROMPT.md','docs/cores/tasks/studio-review.md','docs/cores/tasks/studio-r65.md','docs/cores/studio.md']:
 p=root/name
 rows.append({'path':name,'title':next((l.lstrip('# ').strip()for l in p.read_text().splitlines()if l.startswith('#')),p.stem),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'authority':'historical_core_or_takeover_record; current status is STATUS.md'})
(out/'PLAN-CATALOGUE.json').write_text(json.dumps({'schemaVersion':1,'scope':'All preserved Markdown under Studio and website handbooks, including historical copies. Counts are files, not implemented features.','currentStatus':'docs/studio-combined-handoff-20261029/STATUS.md','documents':rows},indent=2,ensure_ascii=False)+'\n')
registry=json.loads((root/'docs/studio-connected-concept-20261027/registry.json').read_text())
sourcefiles=['studio/ui/owner-desk.ts','studio/ui/management.ts','studio/ui/finance.ts']
implemented={g for f in sourcefiles for g in re.findall(r"(?:id:\s*|chart\(\s*)['\"](G\d+)['\"]",(root/f).read_text())}
graphs=[{**g,'currentStatus':'implemented_view_with_source_limits'if g['id']in implemented else 'pending_concept','currentSourceFiles':[f for f in sourcefiles if re.search(r"(?:id:\s*|chart\(\s*)['\"]"+g['id']+"['\"]",(root/f).read_text())]}for g in registry['graphs']]
(out/'GRAPH-STATUS.json').write_text(json.dumps({'schemaVersion':1,'scope':'Original 26 graph contracts; view references do not prove live data, provider coverage or physical-device behaviour.','graphs':graphs},indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'planDocuments':len(rows),'graphContracts':len(graphs),'implementedViewIDs':sorted(implemented)}))

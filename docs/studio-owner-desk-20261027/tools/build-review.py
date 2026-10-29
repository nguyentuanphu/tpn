"""Build the native GitHub screenshot gallery and verify checkpoint evidence."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
report=json.loads((ROOT/'browser-validation.json').read_text())
assert report['passed'] and not report['errors']
for name,digest in report['sourceHashes'].items():
 assert hashlib.sha256((REPO/name).read_bytes()).hexdigest()==digest,('Stale browser evidence',name)
captures=report['captures'];assert len(captures)==36
titles={'today':'Today','people':'People','device':'Device and linked evidence','game':'Game & website','work':'Work','money':'Money'}
text='''# Studio Owner’s Desk screenshot review

Actual runtime Studio, not the earlier concept mockups. **All people, devices, reports and invoice entries shown are synthetic.** English/Vietnamese at phone390, tablet820 and desktop1440. Browser emulation does not establish physical-device or live Netlify validation.

The phone previews below use viewport screenshots so the fixed bottom navigation appears at the bottom of the visible screen. Full-page links provide longer content; fixed navigation can appear partway through those tall screenshots.

'''
for key,title in titles.items():
 text+='## '+title+'\n\n'
 for lang in ['en','vi']:
  matches=[r for r in captures if r['key']==key and r['lang']==lang]
  text+=('English' if lang=='en' else 'Vietnamese')+' · '
  text+=' · '.join(f"[{r['width']}px viewport](screenshots/{r['viewportFile']}) / [full page](screenshots/{r['file']})" for r in matches)+'\n\n'
 for width in [1440,390]:
  row=next(r for r in captures if r['key']==key and r['lang']=='en' and r['width']==width)
  text+=f"![{title}, English, {width}px](screenshots/{row['viewportFile']})\n\n"
(ROOT/'GALLERY.md').write_text(text.rstrip()+'\n')
app=(REPO/'studio/ui/app.ts').read_text();about=app.split('const ABOUT = {',1)[1].split('\n};',1)[0]
names=re.findall(r'^  ([a-z]+): \[',about,re.M)
text='# Route and capability disposition\n\nThis inventory is generated from the actual routing definition. Old deep-link page names stay valid; old section prefixes are accepted. The former `family` menu opens People, and former `players/...` management links resolve their retained page within its new area. No existing page name is silently removed. New landing pages are People, Game & website, Work and Money.\n\n| Page key | New area | Interface status |\n|---|---|---|\n'
sections=app.split('const SECTIONS = [',1)[1].split('\n];',1)[0]
groups={}
for match in re.finditer(r"k: '([^']+)'.*?pages: \[([^\]]+)\]",sections):
 for page in re.findall(r"'([^']+)'",match.group(2)):groups[page]=match.group(1)
for page in names:
 assert page in groups,page
 status='Connected landing' if page in ['home','people','game','work'] else 'Existing finance service with new Money entry and graph' if page=='money' else 'Retained specialist view; not a complete contextual-editor migration'
 text+=f'| `{page}` | {groups[page]} | {status} |\n'
(ROOT/'ROUTE-MAP.md').write_text(text)
checks=0
for doc in ROOT.glob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',doc.read_text()):
  if target.startswith(('http:','https:','#')):continue
  assert (doc.parent/target.split('#')[0]).exists(),(doc.name,target)
  checks+=1
for r in captures:
 for field in ['file','viewportFile']:assert (ROOT/'screenshots'/r[field]).is_file()
summary={'passed':True,'scope':'Checkpoint document links, actual route inventory and screenshot-source hashes; not a full-suite or deployment result','routes':len(names),'browserViews':len(captures),'screenshots':len(captures)*2,'localLinksChecked':checks,'runtimeCodeCommit':subprocess.check_output(['git','log','-1','--format=%H','--','studio/ui','netlify/lib/management','tests/owner-desk-browser.mjs'],cwd=REPO,text=True).strip(),'documentGenerationCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()}
(ROOT/'review-validation.json').write_text(json.dumps(summary,indent=2)+'\n')
files=sorted(p for p in ROOT.rglob('*') if p.is_file() and p.name!='MANIFEST.sha256' and p.suffix!='.zip' and '__pycache__' not in p.parts)
(ROOT/'MANIFEST.sha256').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(ROOT))+'\n' for p in files))
print(json.dumps(summary))

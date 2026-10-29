"""Observe a full-suite run and actual available artifacts; never infer missing passes."""
from pathlib import Path
import argparse,datetime,json,re,subprocess
from zoneinfo import ZoneInfo
parser=argparse.ArgumentParser();parser.add_argument('--run',required=True);parser.add_argument('--output',required=True);args=parser.parse_args()
def gh(*values):return subprocess.check_output(['gh',*values],text=True)
state=json.loads(gh('run','view',args.run,'--json','databaseId,status,conclusion,headSha,url,jobs'))
artifacts=json.loads(gh('api',f'repos/nguyentuanphu/tpn/actions/runs/{args.run}/artifacts?per_page=100'))['artifacts']
root=Path(args.output);root.mkdir(parents=True,exist_ok=True);checks={};available=[]
for artifact in artifacts:
 name=artifact['name']
 if not re.fullmatch(r'share-(?:postgres|[1-8])',name) or artifact['expired']:continue
 target=root/(name+'-'+str(int(artifact['id'])))
 if not target.exists():target.mkdir();gh('run','download',args.run,'--name',name,'--dir',str(target))
 candidates=list(target.rglob('suite-result.json'))
 if candidates:
  checks.update(json.loads(candidates[0].read_text()));available.append(name)
failed=[];passed=[];retried=[];samples=[];skipped=[]
for name,row in checks.items():
 success=row.get('ok') is True or isinstance(row.get('alone'),dict) and row['alone'].get('ok') is True
 (passed if success else failed).append(name)
 if row.get('alone'):retried.append(name)
 if 'SAMPLE' in str(row.get('note','')):samples.append(name)
 if str(row.get('note','')).lower().startswith('skipped'):skipped.append(name)
report={'observedAtSydney':datetime.datetime.now(ZoneInfo('Australia/Sydney')).isoformat(),'run':args.run,'headSha':state['headSha'],'url':state['url'],'status':state['status'],'conclusion':state['conclusion'],'artifactsAvailable':available,'checksAvailable':len(checks),'passedAvailable':len(passed),'failedAvailable':failed,'retriedAvailable':retried,'sampleMarkers':samples,'suiteLevelSkips':skipped,'jobs':[{'name':j['name'],'status':j['status'],'conclusion':j['conclusion']} for j in state['jobs']],'limitation':'Only downloaded available result artifacts are counted. Missing/running shares are unknown. Full suite requires collector success and review of actual results.'}
(root/'observation.json').write_text(json.dumps(report,indent=2,ensure_ascii=True)+'\n');print(json.dumps(report,ensure_ascii=True))

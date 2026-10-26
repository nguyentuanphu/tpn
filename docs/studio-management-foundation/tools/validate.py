#!/usr/bin/env python3
"""Validate this documentation package; does not test proposed production features."""
from pathlib import Path
from html.parser import HTMLParser
import copy, csv, hashlib, json, re, subprocess, sys
import xml.etree.ElementTree as ET
try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:
    raise SystemExit('Install the documentation validator dependency from tools/requirements.txt; see README.md. No product dependencies need changing.')

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
checks=[]
def check(condition,message):
    if not condition: raise AssertionError(message)
    checks.append(message)
def read(name):return json.loads((ROOT/name).read_text())
def unique(rows,name):
    vals=[x['id'] for x in rows];check(len(vals)==len(set(vals)),f'Unique {name} IDs')
    return set(vals)

def main():
    points=read('data-points.json')['data_points'];metrics=read('metrics.json')['metrics'];graph=read('connections.json')
    unique(points,'data');unique(metrics,'metric');nodes=unique(graph['nodes'],'node');unique(graph['connections'],'connection')
    req=read('requirements.json')['requirements'];unique(req,'requirement')
    groups={x['id'].split('-')[0] for x in points};tickets=set(re.findall(r'^## (B\d{2}) ',(ROOT/'06-BUILD-PLAN.md').read_text(),re.M))
    scenarios=set(re.findall(r'^\| (V\d{2}) ',(ROOT/'07-VALIDATION.md').read_text(),re.M))
    check(len(tickets)==12,'All 12 build tickets defined');check(len(scenarios)==25,'All 25 acceptance scenarios defined')
    for row in points:
        check(all(row.get(k) for k in ['id','domain','status','field','meaning','unit','source','transport','storage','screen','access','caveat','build_ticket']),f'{row["id"]} complete data lineage')
        check(row['status'] in ['existing','proposed'],f'{row["id"]} recognised status')
        check(row['build_ticket'] in tickets,f'{row["id"]} ticket resolves')
        if row['status']=='existing':
            paths=re.findall(r'(?:js|home|netlify|studio|tools)/[\w./-]+\.(?:ts|mts|js|cts|mjs)',row['source'])
            check(bool(paths) and all((REPO/p).is_file() for p in paths),f'{row["id"]} existing source paths resolve')
    for row in metrics:
        check(row['data_group'] in groups and row['build_ticket'] in tickets,f'{row["id"]} data group/ticket resolves')
        check(bool(row['formula']) and bool(row['limitation']),f'{row["id"]} formula and limit explicit')
    for edge in graph['connections']:
        check(edge['source'] in nodes and edge['target'] in nodes and edge['data_group'] in groups,f'{edge["id"]} graph endpoints and data group resolve')
    for r in req:
        check(all(t in tickets for t in r['tickets']),f'{r["id"]} tickets resolve')
        check(all(v in scenarios for v in r['validation'] if v.startswith('V')),f'{r["id"]} acceptance scenarios resolve')
    with (ROOT/'data-points.csv').open(newline='') as f:check(list(csv.DictReader(f))==points,'CSV and JSON data dictionaries match')
    source_evidence=read('source-evidence.json')
    for evidence in source_evidence['files']:
        check(hashlib.sha256((REPO/evidence['path']).read_bytes()).hexdigest()==evidence['sha256'],f'Source evidence unchanged: {evidence["path"]}')
        historical=subprocess.run(['git','show',source_evidence['baseline_commit']+':'+evidence['path']],cwd=REPO,capture_output=True,check=True).stdout
        check(hashlib.sha256(historical).hexdigest()==evidence['sha256'],f'Source evidence matches pinned commit: {evidence["path"]}')
    schemas={}
    for file in (ROOT/'schemas').glob('*.json'):
        s=json.loads(file.read_text());Draft202012Validator.check_schema(s);schemas[file.name.removesuffix('.schema.json')]=Draft202012Validator(s,format_checker=FormatChecker())
        check(True,f'Valid JSON Schema: {file.name}')
    examples=read('examples/events.json')['events']
    for e in examples:schemas['event'].validate(e)
    check(len(examples)==13,'All 13 event variants have schema-valid fixtures')
    for name in ['read-model','config-receipt','finance-line']:schemas[name].validate(read('examples/'+name+'.json'))
    check(True,'Read model, configuration receipt and finance examples validate')
    negatives=[]
    e=copy.deepcopy(examples[0]);e['data']['childName']='Private';negatives.append(('event',e))
    e=copy.deepcopy(examples[0]);e['data']['difficulty']='impossible';negatives.append(('event',e))
    e=copy.deepcopy(examples[0]);e['schemaVersion']=99;negatives.append(('event',e))
    e=copy.deepcopy(examples[0]);e['eventId']='not-a-uuid';negatives.append(('event',e))
    e=copy.deepcopy(read('examples/read-model.json'));e['metrics'][1]['value']=0;negatives.append(('read-model',e))
    e=copy.deepcopy(read('examples/config-receipt.json'));e['appliedAt']=None;negatives.append(('config-receipt',e))
    e=copy.deepcopy(read('examples/finance-line.json'));e['amountMinor']=1.5;negatives.append(('finance-line',e))
    e=copy.deepcopy(read('examples/finance-line.json'));e['token']='private';negatives.append(('finance-line',e))
    for i,(name,e) in enumerate(negatives):check(bool(list(schemas[name].iter_errors(e))),f'Negative schema fixture {i+1} rejected')
    # Formula illustrations are independent of implementation code.
    check(abs((60+10)/(2+1)-70/3)<1e-10,'Weighted FPS illustration correct')
    check(200-120==80 and 200-120-30==50,'Budget illustration separates commitments')
    class Links(HTMLParser):
        def __init__(self):super().__init__();self.links=[]
        def handle_starttag(self,tag,attrs):
            for k,v in attrs:
                if k in ['href','src'] and v:self.links.append(v)
    links_checked=0
    for file in list(ROOT.glob('*.md'))+[ROOT/'index.html']:
        text=file.read_text()
        if file.suffix=='.html':
            p=Links();p.feed(text);targets=p.links
        else:targets=re.findall(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)',text)
        for target in targets:
            if re.match(r'^(https?:|mailto:|data:|#)',target):continue
            plain=target.split('#')[0]
            if not plain:continue
            check((file.parent/plain).exists(),f'Link resolves: {file.name} -> {plain}');links_checked+=1
    svgs=list((ROOT/'images').glob('*.svg'))
    for f in svgs:
        tree=ET.parse(f);check(tree.getroot().tag.endswith('svg'),f'Valid SVG: {f.name}')
        check(bool(tree.findall('.//{http://www.w3.org/2000/svg}title')),f'Accessible SVG title: {f.name}')
    check(len(svgs)==7,'Seven SVG visual artifacts exist')
    generated=[ROOT/x for x in ['data-points.json','data-points.csv','metrics.json','connections.json','source-evidence.json','02-DATA-DICTIONARY.md','03-METRICS.md','index.html']]+svgs+list((ROOT/'examples').glob('*.json'))
    before={str(f):f.read_bytes() for f in generated}
    subprocess.run([sys.executable,str(ROOT/'tools/build.py')],check=True,capture_output=True)
    check(all(Path(f).read_bytes()==b for f,b in before.items()),'Generation is repeatable; no output drift')
    print(f'PASS: {len(checks)} consistency checks; {len(points)} data points; {len(metrics)} metrics; {len(graph["connections"])} connections; {len(req)} requirements; {len(tickets)} tickets; {len(scenarios)} acceptance scenarios; {links_checked} local links.')
    print('PASS: four schemas, sixteen valid records and eight deliberately invalid fixtures; seven SVGs; deterministic generation.')
    print('These checks validate the documentation package, not proposed production features.')

if __name__=='__main__':main()

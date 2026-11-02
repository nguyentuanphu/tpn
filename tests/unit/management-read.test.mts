import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagementReadService } from '../../netlify/lib/management/read.mts';
import { parseManagementQuery } from '../../netlify/lib/management/quality.mts';

const NOW=Date.parse('2026-10-26T12:00:00Z'),DATE='2026-10-25', ID='demo12345678';
function mem(entries={},pageSize=17){
  const m=new Map(Object.entries(entries));
  return {data:m,get:async(k)=>m.get(k)??null,list:async({prefix='',cursor})=>{const all=[...m.keys()].filter(k=>k.startsWith(prefix)).sort(),start=cursor?Number(cursor):0;return {blobs:all.slice(start,start+pageSize).map(key=>({key})),...(start+pageSize<all.length?{cursor:String(start+pageSize)}:{})};}};
}
const record=(extra={})=>({mins:10,tales:1,games:{oanquan:1},build:'v1.01',builds:{'v1.01':true},kind:'phone',fps:[0,0,0],children:{},...extra});
const info=(extra={})=>({first:DATE,last:DATE,build:'v1.01',kind:'phone',os:'iOS',br:'Safari',...extra});
const entries=(id=ID,r=record(),i=info())=>({['d/'+DATE+'/'+id]:r,['info/'+id]:i});
const service=(store,extra={})=>createManagementReadService({playersStore:store,now:()=>NOW,...extra});
const period={from:DATE,to:DATE};
const getMetric=(r,id)=>r.metrics.find(m=>m.id===id);
const catalogue=[{id:'oanquan',kind:'game',name:{en:'Mandarin Square Capturing',vi:'Ô Ăn Quan'},area:'vietnam',sourceCommit:'a'.repeat(40),guide:{status:'reviewed'},coverage:{status:'unavailable'}}];

test('game and story IDs are distinct and legacy story totals do not become per-story usage',async()=>{
  const read=service(mem(entries()),{catalogue:[{...catalogue[0],id:'banhchung'},{...catalogue[0],id:'banhchung',kind:'story'}]});
  await assert.rejects(read.activity('banhchung',period),e=>e.code==='ambiguous_activity');
  assert.equal((await read.activity('game:banhchung',period)).activity.kind,'game');
  const story=await read.activity('story:banhchung',period);
  assert.equal(story.usage.starts,null);assert.equal(story.usage.completed,null);assert.equal(story.usage.status,'unavailable');
});

test('management query rejects invalid dates, unknown inputs, unsafe periods and filters',()=>{
  for(const q of [{to:'banana'},{from:'2026-02-30'},{from:'2026-10-26',to:'2026-10-25'},{to:'2026-10-27'},{limit:'101'},{limit:'2.5'},{traffic:'everyone'},{build:'latest'},{unexpected:'x'},{search:'<private>'}])
    assert.throws(()=>parseManagementQuery(q,NOW),e=>e.status===400);
  assert.throws(()=>parseManagementQuery(new URLSearchParams('build=v1.01&build=v1.02'),NOW),e=>e.code==='invalid_query');
  assert.equal(parseManagementQuery(period,NOW).limit,25);
});

test('weighted FPS and battery unavailability retain measurement denominators',async()=>{
  const store=mem({...entries(ID,record({fps:[60,2,0]})),...entries('demo12345679',record({fps:[10,1,1]}))});
  const result=await service(store).overview(period);
  assert.equal(getMetric(result,'M08').value,70/3);assert.equal(getMetric(result,'M08').sampleCount,3);
  assert.equal(getMetric(result,'M09').value,1/3);
  assert.equal(getMetric(result,'M12').value,null);assert.equal(getMetric(result,'M12').status,'unavailable');
  assert.equal(getMetric(result,'M19').value,null);assert.equal(getMetric(result,'M21').value,null);
  assert.equal(result.sourceAsOf,null);assert.ok(result.quality.includes('legacy-source-watermark-unavailable'));
});

test('measured zero battery loss is different from no measurement',async()=>{
  const a=record({bat:[10,1000,500,200,1000,0,10,0,0,60]});
  const result=await service(mem(entries(ID,a))).overview(period);
  assert.equal(getMetric(result,'M12').value,0);assert.equal(getMetric(result,'M12').status,'observed');
});

test('build-specific reads use originating daily build, exclude mixed days and retain latest sender separately',async()=>{
  const store=mem({...entries(ID,record({mins:12}),info({build:'v1.02'})),...entries('demo12345679',record({mins:99,build:'v1.02',builds:{'v1.01':true,'v1.02':true}}))});
  const read=service(store),summary=await read.overview({...period,build:'v1.01'});
  assert.equal(summary.totals.mins,12);assert.ok(summary.quality.includes('mixed-build-buckets-excluded'));
  const device=await read.device(ID,{...period,build:'v1.01'});
  assert.equal(device.device.build,'v1.02');assert.deepEqual(device.device.usageBuilds,['v1.01']);
  assert.equal((await read.overview(period)).totals.mins,111);
});

test('125 installations paginate without capped totals or duplicate rows on tied timestamps',async()=>{
  const rows={};for(let i=0;i<125;i++){const id='d'+String(i).padStart(11,'0');Object.assign(rows,entries(id));}
  const read=service(mem(rows)), seen=[];let cursor='';
  do{const page=await read.devices({...period,limit:'25',...(cursor?{cursor}:{})});assert.equal(page.total,125);seen.push(...page.devices.map(d=>d.id));cursor=page.nextCursor||'';}while(cursor);
  assert.equal(seen.length,125);assert.equal(new Set(seen).size,125);
  const first=await read.devices({...period,limit:'25'});
  await assert.rejects(read.devices({...period,cursor:first.nextCursor,deviceClass:'phone'}),e=>e.code==='invalid_cursor');
  await assert.rejects(read.devices({...period,cursor:'notjson'}),e=>e.code==='invalid_cursor');
});

test('child identity stays paired with installation and names require restricted-context option',async()=>{
  const r=record({children:{kid:{n:'Na',a:'little',m:10,sm:5,t:1,g:{oanquan:[1,1,0]},p:{village:2}}}});
  const read=service(mem({...entries(ID,r),...entries('demo12345679',r)}));
  const list=await read.devices(period);assert.equal('children' in list.devices[0],false);
  assert.equal(JSON.stringify(await read.overview(period)).includes('"Na"'),false);
  await assert.rejects(read.children(period),e=>e.status===403);
  await assert.rejects(read.devices({...period,child:'Na'}),e=>e.status===403);
  const named=await read.children({...period,child:'na'},{includeProfileContext:true});
  assert.equal(named.total,2);assert.equal(new Set(named.children.map(c=>c.id)).size,2);
  assert.equal(named.children[0].name,'Na');assert.ok(named.children[0].deviceId);
  const detail=await read.device(ID,period,{includeProfileContext:true});
  assert.equal(detail.device.children[0].profileId,'kid');assert.equal(detail.device.children[0].games[0].completed,1);
});

test('latest blank reported name does not resurrect an older name',async()=>{
  const store=mem({...entries(ID,record({children:{kid:{n:'',a:'little',m:1}}})),['d/2026-10-24/'+ID]:record({children:{kid:{n:'Na',a:'little',m:1}}})});
  const result=await service(store).children({from:'2026-10-24',to:DATE},{includeProfileContext:true});
  assert.equal(result.children[0].name,'');
});

test('activity usage labels profile participations and never invents attempts',async()=>{
  const r=record({games:{oanquan:1},children:{a:{g:{oanquan:[1,1,0]}},b:{g:{oanquan:[1,1,0]}}}});
  const read=service(mem(entries(ID,r)),{catalogue}),result=await read.activity('oanquan',period);
  assert.equal(result.usage.starts,1);assert.equal(result.usage.profileStarts,2);assert.equal(result.usage.completed,2);assert.equal(result.usage.participationCompletionRatio,1);
  assert.ok(result.quality.includes('profile-participations-not-attempts'));
  await assert.rejects(read.activity('unknown',period),e=>e.status===404);
  await assert.rejects(read.activity('oanquan',{...period,child:'Na'}),e=>e.status===403);
});

test('website Play-click counter is not presented as game-start conversion',async()=>{
  const read=service(mem(entries()),{parentAnalyticsStore:mem({['sum/'+DATE]:{pageViews:{'/':7},playConversions:3,activeTimeTotalSec:90}})});
  const result=await read.overview(period),click=getMetric(result,'M14');
  assert.equal(click.value,3);assert.match(click.limitation,/not a confirmed/);
  assert.equal(getMetric(await read.overview({...period,build:'v1.01'}),'M14').status,'unavailable');
});

test('test traffic uses a separately supplied store and missing classification is explicit',async()=>{
  const read=service(mem(entries(ID,record({mins:1}))),{botStore:mem(entries(ID,record({mins:999})))});
  assert.equal((await read.overview(period)).totals.mins,1);
  assert.equal((await read.overview({...period,traffic:'synthetic_bot'})).totals.mins,999);
  await assert.rejects(read.overview({...period,traffic:'authorised_test'}),e=>e.code==='classification_unavailable');
});

test('fixed tester report is fixed in code, with deployment and verification explicitly unconfirmed',async()=>{
  const tester=mem({'p/1234567890abcdef':{k:'1234567890abcdef',kind:'auto',auto:'freeze',title:'Freeze in activity',where:{game:'oanquan'},n:3,devices:[ID],builds:['v1.01'],firstAt:NOW-20000,lastAt:NOW-10000,status:'fixed',fixedIn:'v1.02'}});
  const read=service(mem(entries()),{testerStore:tester}),result=await read.attention({from:DATE,to:'2026-10-26'});
  assert.equal(result.items[0].status,'fixed_in_code');assert.equal(result.items[0].affectedDevices,1);
  assert.ok(result.items[0].quality.includes('deployment-and-device-verification-unconfirmed'));
  const release=await read.release('v1.01',period);assert.equal(release.release.deploymentStatus,'unavailable');
});

test('management reads do not write source records or mutate injected objects',async()=>{
  const store=mem(entries());const before=JSON.stringify([...store.data]);await service(store).overview(period);await service(store).devices(period);assert.equal(JSON.stringify([...store.data]),before);
});

test('daily chart series separates missing days, observed inactivity and unique active installations',async()=>{
  const previous=new Date(Date.parse(DATE)-864e5).toISOString().slice(0,10),missing=new Date(Date.parse(DATE)-2*864e5).toISOString().slice(0,10);
  const store=mem({...entries(),['d/'+DATE+'/demo12345679']:record({mins:20}),['info/demo12345679']:info(),['d/'+previous+'/'+ID]:record({mins:0,tales:0,games:{}})});
  const result=await service(store).overview({from:missing,to:DATE});
  assert.deepEqual(result.dailySeries.map(d=>[d.date,d.activeDevices,d.mins]),[[missing,null,null],[previous,0,0],[DATE,2,30]]);
  assert.equal(result.dailySeries[2].reportingBuckets,2);
  const filtered=await service(store).overview({from:missing,to:DATE,build:'v1.02'});assert.ok(filtered.dailySeries.every(d=>d.activeDevices===null));
});

test('private device history and problem associations do not include a different installation',async()=>{
  const other='demo12345679',tester=mem({
    'p/1234567890abcdef':{k:'1234567890abcdef',title:'Matching synthetic problem',devices:[ID],firstAt:Date.parse(DATE+'T10:00:00Z'),lastAt:Date.parse(DATE+'T11:00:00Z')},
    'p/1234567890abcdea':{k:'1234567890abcdea',title:'Other device private problem',devices:[other],firstAt:Date.parse(DATE+'T10:00:00Z'),lastAt:Date.parse(DATE+'T11:00:00Z')}});
  const store=mem({...entries(),...entries(other,record({mins:99}))}),read=service(store,{testerStore:tester});
  const result=await read.device(ID,period,{includeProfileContext:true});assert.equal(result.dailySeries[0].mins,10);
  assert.deepEqual(result.relatedIssues.map(i=>i.title),['Matching synthetic problem']);
  const noTester=await service(store).device(ID,period,{includeProfileContext:true});assert.deepEqual(noTester.relatedIssues,[]);assert.ok(noTester.quality.includes('tester-source-unavailable'));
});

// (owner, 30 Oct 2026 AEDT) Studio's first page reads devices, play time, favourite games, places and versions in one answer
test('overview today summary: devices, minutes, favourite and left-early games, places by town, versions',async()=>{
  const B='demo87654321',C='demo11112222';
  const store=mem({...entries(ID,record({mins:30,games:{oanquan:4,maze:3},quits:{maze:2},hours:{'16':20,'17':10}}),info({loc:{city:'Sydney',region:'NSW',country:'AU'},build:'v1.03'})),
    ...entries(B,record({mins:12,games:{oanquan:1},hours:{'9':5}}),info({first:DATE,loc:{city:'Ba Ria',region:'',country:'VN'},build:'v1.02'})),
    ...entries(C,record({mins:0,games:{}}),info({first:'2026-10-01',build:'v1.03'}))});
  const t=(await service(store,{catalogue}).overview(period)).today;
  assert.equal(t.devicesInPeriod,2);assert.equal(t.minsInPeriod,42);assert.equal(t.busiestHour,16);
  assert.deepEqual(t.topGames.map(g=>[g.id,g.starts]),[['oanquan',5],['maze',3]]);assert.equal(t.topGames[0].name.vi,'Ô Ăn Quan');
  assert.deepEqual(t.leftEarly.map(g=>g.id),['maze']);
  assert.deepEqual(t.places.map(p=>[p.city,p.country,p.devices]),[['Sydney','AU',1],['Ba Ria','VN',1]]);
  assert.deepEqual(t.versions,{newest:'v1.03',onNewest:1,older:1});
  for(const p of t.places)assert.deepEqual(Object.keys(p).sort(),['city','country','devices','region']);
});

test('device lists put the most-played devices first (owner, 30 Oct 2026 AEDT)',async()=>{
  const read=service(mem({...entries('lite12345678',record({mins:5})),...entries('busy12345678',record({mins:90})),...entries('mid123456789',record({mins:30}))}));
  assert.deepEqual((await read.devices(period)).devices.map(d=>d.id),['busy12345678','mid123456789','lite12345678']);
});

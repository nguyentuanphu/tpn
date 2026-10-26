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

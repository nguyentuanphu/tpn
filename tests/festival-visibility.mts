import test from 'node:test';
import assert from 'node:assert/strict';
import {festivalVisible,festivalVisibleIn,projectPublicFestivals,festivalScheduled,sydneyFestivalDate} from '../js/content/festival-visibility.ts';
test('festival off and release off both override selection or preview',()=>{
 assert.equal(festivalVisible(),true);
 for(const on of[true,false,undefined]){
  assert.equal(festivalVisible({on:false},{on}),false);
  assert.equal(festivalVisible({on},{on:false}),false);
 }
});
test('public festival visibility respects release windows',()=>{
 const rule={start:'2026-10-26',days:2};
 assert.equal(festivalVisible({},rule,new Date('2026-10-25T12:00:00')),false);
 assert.equal(festivalVisible({},rule,new Date('2026-10-26T12:00:00')),true);
 assert.equal(festivalVisible({},rule,new Date('2026-10-28T00:00:00')),false);
});
test('live festival rules take precedence over the same bundled rule',()=>{
 const base={festivals:{tet:{on:false}}};
 assert.equal(festivalVisibleIn('tet',{},base),false);
 assert.equal(festivalVisibleIn('tet',{festivals:{tet:{on:true}}},base),true);
 assert.equal(festivalVisibleIn('tet',{festivals:{tet:{on:true}},releases:{fest_tet:{on:false}}},base),false);
});

test('published festival release dates use Sydney midnight on server and client',()=>{
 const r={start:'2026-10-26',days:2};
 assert.equal(festivalVisible({},r,new Date('2026-10-25T12:59:00Z')),false);
 assert.equal(festivalVisible({},r,new Date('2026-10-25T13:01:00Z')),true);
 assert.equal(festivalVisible({},r,new Date('2026-10-27T13:01:00Z')),false);
});

test('boot and public endpoint share the same allowed-only festival projection',()=>{
 const live={festivals:{tet:{date:'02-17',buildup:2},halloween:{on:false}},releases:{fest_midautumn:{on:false}},at:'reviewed-time',content:{quiz:['private family question'],faces:{child:'private photo'}}};
 const result=projectPublicFestivals(['tet','halloween','midautumn'],live,{},new Date('2026-10-26T00:00:00Z'));
 assert.deepEqual(result,{schema:1,enabled:['tet'],festivals:{tet:{date:'02-17',buildup:2}},at:'reviewed-time'});
 assert.equal(JSON.stringify(result).includes('private'),false);
 const malformed=JSON.parse('{"festivals":{"tet":{"date":{"quiz":"private"},"buildup":{"profile":"private"}}},"at":{"name":"private"}}');
 assert.deepEqual(projectPublicFestivals(['tet'],malformed),{schema:1,enabled:['tet'],festivals:{tet:{}},at:null});
});

test('scheduled game festivals and public visibility agree across Sydney midnight',()=>{
 const r={on:true,start:'2026-10-27',days:1};
 for(const [time,on]of [['2026-10-26T12:59:00Z',false],['2026-10-26T13:01:00Z',true],['2026-10-27T12:59:00Z',true],['2026-10-27T13:01:00Z',false]]as const){
  const now=new Date(time);assert.equal(festivalScheduled(r,1,now),on);assert.equal(festivalVisible({},r,now),on);
 }
 assert.equal(sydneyFestivalDate(new Date('2026-10-26T17:00:00Z')),'2026-10-27');
 assert.equal(festivalScheduled({start:'garbage'},1),false);
 assert.equal(festivalScheduled({start:r.start,on:false},1,new Date('2026-10-26T17:00:00Z')),false);
});

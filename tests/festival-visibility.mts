import test from 'node:test';
import assert from 'node:assert/strict';
import {festivalVisible,festivalVisibleIn} from '../js/content/festival-visibility.ts';
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

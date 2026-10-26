import test from 'node:test';
import assert from 'node:assert/strict';
import {makeFestivalStatus} from '../../netlify/functions/festival-status.mts';
test('public festival endpoint excludes disabled festivals and all private fields',async()=>{
 const raw={festivals:{tet:{on:false}},releases:{fest_halloween:{on:false},tester:{devices:['PRIVATE']}},content:{quiz:['PRIVATE']},by:'PRIVATE',at:'2026-10-26T00:00:00Z'};
 const handler=makeFestivalStatus({liveStore:async()=>({get:async key=>{assert.equal(key,'live');return raw;}}),base:{},now:()=>new Date('2026-10-26T12:00:00')});
 const response=await handler(),body=await response.json();assert.equal(response.status,200);assert.ok(body.enabled.length>0);assert.ok(!body.enabled.includes('tet'));assert.ok(!body.enabled.includes('halloween'));assert.ok(!JSON.stringify(body).includes('PRIVATE'));assert.deepEqual(Object.keys(body).sort(),['at','enabled','festivals','schema']);
});
test('festival endpoint returns unavailable instead of silently re-enabling on a store failure',async()=>{
 const response=await makeFestivalStatus({liveStore:async()=>{throw Error('offline');}})();assert.equal(response.status,503);
});

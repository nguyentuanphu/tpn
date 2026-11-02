import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createManagementService } from '../../netlify/lib/management/transactional/service.mts';
import { MemoryManagementTestDatabase } from '../../netlify/lib/management/storage/memory-test.mts';
const NOW=Date.parse('2026-10-27T00:00:00Z');
const service=()=>createManagementService({database:new MemoryManagementTestDatabase(),now:()=>NOW,catalogue:{activityIds:new Set(['oanquan','caro']),storyIds:new Set(['banhchung','tale-two'])}});
const event=(eventName,data,attemptId=randomUUID(),ago=1000)=>({schemaVersion:1,eventId:randomUUID(),attemptId,deviceId:'demo12345678',sessionId:'demo123456789012',eventName,data,
  occurredAt:new Date(NOW-ago).toISOString(),deviceDay:new Date(NOW-ago).toISOString().slice(0,10),offsetMinutes:0,build:'v1.01',sourceCommit:null,environment:'production',traffic:'ordinary',profiles:[{id:'demo-profile',name:'DemoPrivate',age:'little'}]});
const period={from:'2026-10-24T00:00:00Z',to:'2026-10-28T00:00:00Z'};

test('outcome summaries keep boot failures, missing results, voice unknowns and initiated downloads distinct',async()=>{
  const s=service(),ready=randomUUID(),failed=randomUUID(),missing=randomUUID(),story=randomUUID(),direct=randomUUID(),relay=randomUUID();
  const events=[event('boot.started',{stage:'boot'},ready),event('boot.ready',{stage:'first_playable',elapsedMs:500},ready,500),
    event('boot.started',{stage:'boot'},failed),event('boot.failed',{stage:'resources',reasonCode:'resource_missing'},failed,500),event('boot.started',{stage:'boot'},missing,2*86400000),
    event('story.opened',{storyId:'banhchung'},story),event('story.completed',{storyId:'banhchung'},story,500),event('story.opened',{storyId:'tale-two'}),
    event('connection.attempt',{transport:'direct'},direct),event('connection.result',{transport:'direct',outcome:'timeout',elapsedMs:500},direct,500),
    event('connection.attempt',{transport:'relay'},relay),event('connection.result',{transport:'relay',outcome:'success',elapsedMs:500},relay,500),
    ...['success','failed','cancelled','unknown'].map(outcome=>event('voice.result',{source:'recorded',outcome,language:'vi'})),
    event('backup.result',{operation:'export',outcome:'initiated',reasonCode:'none'}),event('backup.result',{operation:'restore',outcome:'success',reasonCode:'none'}),
    event('update.result',{outcome:'success',reasonCode:'none'})];
  await s.ingestEvents({schemaVersion:1,events});
  const result=await s.eventSummary(period);
  assert.equal(result.boot.started,3);assert.equal(result.boot.succeeded,1);assert.equal(result.boot.failed,1);assert.equal(result.boot.outcomeUnknown,1);assert.equal(result.boot.phaseP95Ms,500);assert.equal(result.boot.successRate,1/3);
  assert.equal(result.stories.started,2);assert.equal(result.stories.succeeded,1);assert.equal(result.stories.pending,1);
  assert.equal(result.connections.successRate,.5);assert.equal(result.voice.recorded.confirmedSuccessRate,.5);assert.equal(result.voice.recorded.unknown,1);assert.equal(result.voice.recorded.cancelled,1);
  assert.equal(result.backups.export.initiated,1);assert.equal(result.backups.export.success,0);assert.equal(result.backups.export.confirmedSuccessRate,null);assert.equal(result.backups.restore.success,1);
  assert.equal(JSON.stringify(result).includes('DemoPrivate'),false);assert.equal(JSON.stringify(result).includes('demo12345678'),false);
  const specific=await s.eventSummary(period,'banhchung');assert.equal(specific.stories.started,1);assert.equal(specific.stories.succeeded,1);
});

test('per-story and per-activity summaries retain conflicting matched terminals instead of hiding them',async()=>{
  const s=service(),story=randomUUID(),game=randomUUID();
  await s.ingestEvents({schemaVersion:1,events:[event('story.opened',{storyId:'banhchung'},story),event('story.completed',{storyId:'tale-two'},story,500),
    event('activity.started',{activityId:'oanquan',difficulty:'easy',mode:'solo'},game),event('activity.completed',{activityId:'caro'},game,500)]});
  const result=await s.eventSummary(period,'banhchung');assert.equal(result.stories.inconsistent,1);assert.equal(result.stories.successRate,null);
  const attempts=await s.attemptSummary(period,'oanquan');assert.equal(attempts.counts.inconsistent,1);assert.equal(attempts.completionRate,null);
});

test('synthetic traffic is isolated and invalid source/result claims are rejected before persistence',async()=>{
  const s=service();
  const start=event('boot.started',{stage:'boot'});start.traffic='synthetic_bot';await s.ingestEvents({schemaVersion:1,events:[start]});
  assert.equal((await s.eventSummary(period)).boot.started,0);assert.equal((await s.eventSummary({...period,traffic:'synthetic_bot'})).boot.started,1);
  for(const bad of [event('voice.result',{source:'recorded',outcome:'played_probably',language:'en'}),event('backup.result',{operation:'download_finished',outcome:'success',reasonCode:'none'}),event('update.result',{outcome:'initiated',reasonCode:'none'})])
    await assert.rejects(s.ingestEvents({schemaVersion:1,events:[bad]}),e=>e.status===422);
});

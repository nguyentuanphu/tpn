import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createManagementEvidence, cleanManagementEvidence } from '../../js/core/events.ts';
function fixture(){let time=1000000,calls=0;const events=[];const bridge=createManagementEvidence({now:()=>time,uuid:()=>{calls++;return randomUUID();}});return {bridge,events,advance:ms=>time+=ms,calls:()=>calls,listen:()=>bridge.subscribe(e=>events.push(e))};}
test('disabled evidence performs no ID work; consent revocation discards buffered and in-flight observations',()=>{
 const f=fixture();assert.equal(f.bridge.emit('boot.started',{stage:'boot'}),null);f.bridge.begin('voice.result',{source:'recorded',language:'en'})({outcome:'success'});assert.equal(f.calls(),0);
 f.bridge.setEnabled(true);f.bridge.emit('boot.started',{stage:'boot'});const finish=f.bridge.begin('voice.result',{source:'recorded',language:'en'});
 f.bridge.setEnabled(false);f.bridge.setEnabled(true);assert.equal(finish({outcome:'success'}),null);f.listen();assert.equal(f.events.length,0);
});
test('lazy observer preserves occurrence time and boot identity across module loading',()=>{
 const f=fixture();f.bridge.setEnabled(true);const id=f.bridge.emit('boot.started',{stage:'boot'});f.advance(500);f.bridge.emit('boot.ready',{stage:'first_playable',elapsedMs:500});f.listen();
 assert.deepEqual(f.events.map(e=>e.attemptId),[id,id]);assert.deepEqual(f.events.map(e=>e.occurredAt),[1000000,1000500]);assert.equal(f.bridge.emit('boot.failed',{stage:'boot',reasonCode:'exception'}),null);
});
test('connection outcomes are one-shot and retain transport, elapsed time and attempt identity',()=>{
 const f=fixture();f.bridge.setEnabled(true);f.listen();const direct=f.bridge.connection('direct'),relay=f.bridge.connection('relay');f.advance(700);relay('success');direct('timeout');direct('success');
 assert.equal(f.events.length,4);assert.equal(f.events[2].attemptId,f.events[1].attemptId);assert.equal(f.events[3].attemptId,f.events[0].attemptId);assert.equal(f.events[2].data.elapsedMs,700);assert.equal(f.events[3].data.outcome,'timeout');
});
test('bounded bridge cannot accumulate unlimited records or emit after opt-out during buffer drain',()=>{
 const f=fixture();f.bridge.setEnabled(true);for(let n=0;n<100;n++)f.bridge.emit('voice.result',{source:'device',language:'vi',outcome:'success'});f.listen();assert.equal(f.events.length,64);
 const g=fixture();g.bridge.setEnabled(true);for(let n=0;n<5;n++)g.bridge.emit('voice.result',{source:'device',language:'vi',outcome:'success'});let count=0;g.bridge.subscribe(()=>{count++;g.bridge.setEnabled(false);});assert.equal(count,1);
});
test('only bounded evidence fields are accepted; unknown voice and initiated exports remain distinct',()=>{
 assert.deepEqual(cleanManagementEvidence('voice.result',{source:'recorded',language:'en',outcome:'unknown'}),{source:'recorded',outcome:'unknown',language:'en'});
 assert.equal(cleanManagementEvidence('connection.attempt',{transport:'direct',roomCode:'private'}),null);
 assert.equal(cleanManagementEvidence('backup.result',{operation:'export',outcome:'initiated',reasonCode:'none'}).outcome,'initiated');
 assert.equal(cleanManagementEvidence('backup.result',{operation:'cloud-confirmed',outcome:'success',reasonCode:'none'}),null);
 const f=fixture();f.bridge.setEnabled(true);assert.equal(f.bridge.emit('boot.started',{stage:'boot'},undefined,0),null);
});

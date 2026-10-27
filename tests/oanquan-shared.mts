import test from 'node:test';
import assert from 'node:assert/strict';
import {oaqStart,oaqCommand,oaqChoose,oaqRange} from '../js/games/oanquan-core.js';
import {sharedRoom,flushRoom} from './shared-board-room.mjs';
const total=(s:{seeds:number[];big:boolean[];score:number[]})=>s.seeds.reduce((a,b)=>a+b,0)+10*s.big.filter(Boolean).length+s.score[0]+s.score[1];
test('shared Ô Ăn Quan preserves all70 seeds through sowing, borrowing and final repayment',()=>{
 for(const gentle of[true,false]){
  let s=oaqStart(gentle,2,'match'),moves=0;
  while(!s.complete&&moves++<4997){const before=JSON.stringify(s),value=oaqChoose(s)!;assert.notEqual(value,null);const next=oaqCommand(s,value)!;assert.equal(JSON.stringify(s),before);assert.equal(total(next),70);assert.ok(next.seeds.every(n=>n>=0));assert.ok(next.score.every(n=>n>=0));assert.ok(next.moves>s.moves);s=next;}
  assert.ok(s.complete,'a whole game must finish through legal sow/refill turns');assert.equal(s.score[0]+s.score[1],70);assert.deepEqual(s.owe,[0,0]);assert.equal(oaqCommand(s,2),null);
 }
});
test('Ô Ăn Quan rejects opponent/mandarin/empty/fractional choices without advancing a turn',()=>{
 const s=oaqStart(false,2,'bounds');for(const value of[-1,0,1,12,13,14,23,24,2.5,NaN])assert.equal(oaqCommand(s,value),null);
 const empty={...s,seeds:[...s.seeds]};empty.seeds[2]=0;assert.equal(oaqCommand(empty,4),null);
 for(const seat of[0,1])for(const pit of oaqRange(seat))for(const direction of[0,1])assert.ok(oaqCommand({...s,turn:seat},pit*2+direction));assert.throws(()=>oaqStart(false,3,'invalid'));
});
test('real invited Ô Ăn Quan seats finish one shared game; invalid, future and forged commits change nothing',async()=>{
 const r=await sharedRoom('oanquan',oaqStart,oaqCommand,2);try{
  const before=JSON.stringify(r.sessions[0].state);r.channels[1].move(4000,14);r.channels[1].move(5000,14);await flushRoom();assert.equal(JSON.stringify(r.sessions[0].state),before);assert.equal(JSON.stringify(r.sessions[1].state),before);
  let moves=0;while(!r.sessions[0].state!.complete&&moves++<4997){const s=r.sessions[0].state!,value=oaqChoose(s)!;assert.equal(r.sessions[1-s.turn].submit(value),false);assert.equal(r.sessions[s.turn].submit(value),true);await flushRoom();assert.deepEqual(r.sessions[0].state,r.sessions[1].state);assert.equal(total(r.sessions[0].state!),70);}
  assert.ok(r.sessions[0].state!.complete);assert.ok(r.sessions.every(s=>s.core!.index===moves));
 }finally{r.close();}
});
test('Ô Ăn Quan recovers a lost capture/sow commit without sowing twice',async()=>{
 const r=await sharedRoom('oanquan',oaqStart,oaqCommand,2,[false,true]);try{
  assert.ok(r.sessions.every(s=>s.state!.gentle));r.setDrop((from,to,n)=>from==='seat0'&&to==='seat1'&&n===5000);r.sessions[0].submit(oaqChoose(r.sessions[0].state!)!);await flushRoom();assert.equal(r.sessions[1].core!.index,0);
  r.setDrop(()=>false);r.sessions[1].poll();await flushRoom();assert.deepEqual(r.sessions[0].state,r.sessions[1].state);assert.equal(r.sessions[1].core!.index,1);r.sessions[1].poll();await flushRoom();assert.equal(r.sessions[1].core!.index,1);
 }finally{r.close();}
});

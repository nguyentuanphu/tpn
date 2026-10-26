import test from 'node:test';
import assert from 'node:assert/strict';
import {snakesStart,snakesCommand,LADDERS,SNAKES} from '../js/games/snakes-core.js';
import {sharedRoom,flushRoom} from './shared-board-room.mjs';
test('Snakes uses advancing seeded rolls and immutable legal destinations for all four seats',()=>{
 for(const gentle of[true,false])for(let seed=0;seed<25;seed++){
  let s=snakesStart(gentle,4,String(seed)),steps=0;const rolls=new Set<number>();
  while(!s.complete&&steps++<4997){const before=JSON.stringify(s),seat=s.turn,next=snakesCommand(s,0)!;assert.equal(JSON.stringify(s),before);assert.ok(next.die>=1&&next.die<=(gentle?3:6));rolls.add(next.die);const landed=Math.min(25,s.positions[seat]+next.die);assert.equal(next.positions[seat],LADDERS[landed]||(!gentle&&SNAKES[landed])||landed);for(let i=0;i<4;i++)if(i!==seat)assert.equal(next.positions[i],s.positions[i]);s=next;}
  assert.ok(s.complete);assert.ok(rolls.size>1);assert.equal(snakesCommand(s,0),null);if(gentle)assert.deepEqual(s.positions,[25,25,25,25]);
 }
 const s=snakesStart(false,2,'invalid');for(const move of[-1,1,6,NaN,Infinity,1.5])assert.equal(snakesCommand(s,move),null);assert.throws(()=>snakesStart(false,5,'invalid'));
});
test('four real invited Snakes seats share one complete board and reject client-selected dice/future turns',async()=>{
 const r=await sharedRoom('snakes',snakesStart,snakesCommand);try{
  let count=0;while(!r.sessions[0].state!.complete&&count++<4997){const seat=r.sessions[0].state!.turn;assert.equal(r.sessions[(seat+1)%4].submit(0),false);assert.equal(r.sessions[seat].submit(6),false);assert.equal(r.sessions[seat].submit(0),true);await flushRoom();for(const s of r.sessions)assert.deepEqual(s.state,r.sessions[0].state);}
  assert.ok(r.sessions[0].state!.complete);assert.ok(r.sessions.every(s=>s.core!.index===count));
 }finally{r.close();}
});
test('Snakes agrees on gentle rules for any younger seat and finishes every piece',async()=>{
 const r=await sharedRoom('snakes',snakesStart,snakesCommand,4,[false,false,true,false]);try{
  assert.ok(r.sessions.every(s=>s.state!.gentle));let steps=0;while(!r.sessions[0].state!.complete&&steps++<1000){const seat=r.sessions[0].state!.turn;assert.equal(r.sessions[seat].submit(0),true);await flushRoom();}
  assert.ok(r.sessions.every(s=>s.state!.positions.every(p=>p===25)));
 }finally{r.close();}
});
test('lost Snakes commit recovers without replaying a roll; reconnects cannot inject future steps',async()=>{
 const r=await sharedRoom('snakes',snakesStart,snakesCommand,2);try{
  r.setDrop((from,to,n)=>from==='seat0'&&to==='seat1'&&n===5000);r.sessions[0].submit(0);await flushRoom();assert.equal(r.sessions[1].core!.index,0);
  r.setDrop(()=>false);r.sessions[1].poll();await flushRoom();assert.equal(r.sessions[1].core!.index,1);assert.deepEqual(r.sessions[0].state,r.sessions[1].state);
  const before=JSON.stringify(r.sessions[0].state);r.channels[1].move(4000,0);r.channels[1].move(5001,0);r.sessions[1].poll();await flushRoom();assert.equal(JSON.stringify(r.sessions[0].state),before);assert.equal(r.sessions[1].core!.index,1);
 }finally{r.close();}
});

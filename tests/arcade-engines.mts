import test from 'node:test';
import assert from 'node:assert/strict';
import { orchardStart, orchardStop } from '../js/games/parade-engine.ts';
import { barStart, barApply, barResult, BAR_SYMBOLS } from '../js/games/fruitbar-engine.ts';
import { ArcadeSession } from '../js/games/arcade-session.ts';
import type { ArcadeOnline } from '../js/games/arcade-session.ts';
import { testerArcadeAllowed } from '../js/content/tester-arcades.ts';

test('Orchard is deterministic, every required picture exists and 1–4 seats can complete',()=>{
 for(let seats=1;seats<=4;seats++)for(let tier=0;tier<4;tier++){
  let s=orchardStart('orchard',seats,tier);assert.deepEqual(s,orchardStart('orchard',seats,tier));assert.ok(s.mission.every(id=>s.board.includes(id)));
  while(!s.complete){const target=s.mission.find((_,i)=>!s.found[i])!;s=orchardStop(s,s.board.indexOf(target))!;assert.ok(s.moves<=5);assert.ok(s.turn<seats);}
  assert.equal(orchardStop(s,0),null);
 }
});
test('Orchard validates inputs and assists after repeated misses without fake rare combos',()=>{
 let s=orchardStart('assist',2,3);s={...s,mission:['key'],found:[false],board:Array(16).fill('apple')};
 for(const v of[-1,16,NaN,2.5,9999])assert.equal(orchardStop(s,v),null);
 for(let i=0;i<4;i++)s=orchardStop(s,0)!;
 assert.equal(s.complete,true);assert.equal(s.combo,null);assert.equal(s.last,'key');
});
test('tester mode can never publish to a non-tester and master/mode off win',()=>{
 for(const tester of[false,true])for(const master of[false,true])for(const mode of[false,true])assert.equal(testerArcadeAllowed(tester,master,mode),tester&&master&&mode);
});
test('Fruit Bar locks separate allocations, shares result and debits each stake once',()=>{
 for(let seats=1;seats<=4;seats++){
  let s=barStart('adult',seats);for(let seat=0;seat<seats;seat++){for(let symbol=0;symbol<8;symbol++)s=barApply(s,symbol*101+seat+1)!;s=barApply(s,900)!;}
  assert.equal(s.phase,'result');assert.equal(s.result,barResult('adult',0,false));
  s.balances.forEach((b,i)=>assert.equal(b,100000-8*(i+1)+(i+1)*BAR_SYMBOLS[s.result!].mult));
  assert.equal(barApply(s,900),null);assert.equal(barApply(s,0),null);
  const next=barApply(s,901)!;assert.equal(next.phase,'allocate');assert.ok(next.bets.flat().every(n=>n===0));assert.equal(next.previous[0][0],1);
 }
});
test('Fruit Bar bounds inputs, rejects empty/over-budget rounds and finishes exactly at its limit',()=>{
 let s=barStart('bounds',1,false,2);for(const v of[-1,808,899,NaN,1.2,9999,900,901,902])assert.equal(barApply(s,v),null);
 s={...s,balances:[2]};assert.equal(barApply(s,3),null);s=barApply(s,902)!;assert.equal(s.balances[0],100000);
 for(let round=0;round<2;round++){s=barApply(s,10)!;s=barApply(s,900)!;s=barApply(s,901)!;}
 assert.equal(s.phase,'complete');assert.equal(s.round,2);assert.equal(barApply(s,10),null);
 assert.equal(BAR_SYMBOLS.reduce((n,s)=>n+s.weight,0),100);
 for(let i=0;i<100;i++){assert.ok(barResult('freq',i,false)>=0&&barResult('freq',i,false)<8);assert.ok(barResult('freq',i,true)>=0&&barResult('freq',i,true)<8);}
});
test('ordered host commands reject forged turns, recover lost/reordered commits and unsubscribe',()=>{
 type Packet={from:number;n:number;value:number};const queue:Packet[]=[];const listeners=new Map<number,(seat:number,n:number,v:number)=>void>();
 const channel=(mine:number):ArcadeOnline=>({mine,names:['Host','Guest'],move:(n,value)=>queue.push({from:mine,n,value}),onMove:fn=>{listeners.set(mine,fn);return()=>{listeners.delete(mine);};},connected:()=>true});
 const sessions=[0,1].map(mine=>new ArcadeSession(orchardStart('shared',2,0),channel(mine),orchardStop,()=>{}));
 const drain=(reverse=false)=>{let batches=0;while(queue.length){if(++batches>50)throw Error('protocol loop');const q=queue.splice(0);if(reverse)q.reverse();for(const p of q)for(const [seat,fn]of listeners)if(seat!==p.from)fn(p.from,p.n,p.value);}};
 assert.equal(sessions[1].submit(0),false);
 const target=sessions[0].state.mission[0];assert.ok(sessions[0].submit(sessions[0].state.board.indexOf(target)));
 queue.length=0;sessions[1].poll();drain();assert.deepEqual(sessions[1].state,sessions[0].state);
 const guest=sessions[1];assert.equal(guest.submit(9999),false);const needed=guest.state.mission.find((_,i)=>!guest.state.found[i])!;assert.ok(guest.submit(guest.state.board.indexOf(needed)));drain(true);assert.deepEqual(guest.state,sessions[0].state);
 const old=guest.state;listeners.get(1)!(1,2002,0);listeners.get(0)!(1,1800,0);assert.equal(guest.state,old);
 sessions.forEach(s=>s.close());assert.equal(listeners.size,0);
});

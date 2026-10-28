import test from 'node:test';
import {createNetGames} from '../js/netgames.js';
import assert from 'node:assert/strict';
import { orchardStart, orchardStop, orchardSessionTier } from '../js/games/parade-engine.ts';
import { barStart, barApply, barResult, BAR_SYMBOLS } from '../js/games/fruitbar-engine.ts';
import { ArcadeSession, controlsArcadeTurn } from '../js/games/arcade-session.ts';
import type { ArcadeOnline } from '../js/games/arcade-session.ts';
import { testerArcadeAllowed, familyArcadeAllowed, testerArcadeAvailable } from '../js/content/tester-arcades.ts';
import { CUSTOM } from '../js/custom.js';

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
// Owner report (29 Oct AEDT): Studio enabled all three previews, but Orchard alone was
// hidden because it incorrectly required a second mode switch. Preview is an alternative
// route for accepted testers, as with Fruit Parade and Fruit Bar; it never publishes Orchard.
test('Orchard preview or requested mode admits accepted testers only; both off hides it',()=>{
 for(const tester of[false,true])for(const preview of[false,true])for(const mode of[false,true])assert.equal(testerArcadeAllowed(tester,preview,mode),tester&&(preview||mode));
 assert.equal(testerArcadeAllowed(true,true,false),true,'preview alone opens the invited tester game');
 assert.equal(testerArcadeAllowed(true,false,true),true,'requested tester mode can run without preview');
 assert.equal(testerArcadeAllowed(true,false,false),false,'all Orchard controls off hides it');
 assert.equal(testerArcadeAllowed(false,true,true),false,'both switches on never grant non-testers access');
});
test('Orchard actual preview gate requires consent, global tester permission and selected-device eligibility',()=>{
 const before=CUSTOM.releases,storage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 let consent={at:1,stopped:0};
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>key==='sv2_playerid'?'orchardfixture01':key==='sv2_tester'?JSON.stringify(consent):null}});
 try{
  CUSTOM.releases={tester:{on:true},sparkleorchard_tester:{on:true},sparkleorchard_single:{on:false},sparkleorchard_multi:{on:false}};
  assert.equal(testerArcadeAvailable('sparkleorchard','single'),true);
  assert.equal(testerArcadeAvailable('sparkleorchard','multi'),true);
  consent={at:0,stopped:0};assert.equal(testerArcadeAvailable('sparkleorchard','single'),false,'no agreement');
  consent={at:1,stopped:1};assert.equal(testerArcadeAvailable('sparkleorchard','single'),false,'stopped testing');
  consent={at:1,stopped:0};CUSTOM.releases.tester={on:false};assert.equal(testerArcadeAvailable('sparkleorchard','single'),false,'global tester switch off');
  CUSTOM.releases.tester={on:true,devices:['anotherdevice']};assert.equal(testerArcadeAvailable('sparkleorchard','single'),false,'different invited device');
  CUSTOM.releases.tester={on:true,devices:['orchardfixture01']};CUSTOM.releases.sparkleorchard_tester={on:false};CUSTOM.releases.sparkleorchard_single={on:true};
  assert.equal(testerArcadeAvailable('sparkleorchard','single'),true);assert.equal(testerArcadeAvailable('sparkleorchard','multi'),false,'the other mode stays off when preview is off');
  CUSTOM.releases.sparkleorchard_single={on:false};assert.equal(testerArcadeAvailable('sparkleorchard','single'),false,'all Orchard switches off');
 }finally{CUSTOM.releases=before;if(storage)Object.defineProperty(globalThis,'localStorage',storage);else delete globalThis.localStorage;}
});
test('Family Fruit Bar public modes allow non-testers; preview alone requires accepted testers',()=>{
 for(const published of[false,true])for(const preview of[false,true])for(const tester of[false,true])assert.equal(familyArcadeAllowed(published,preview,tester),published||preview&&tester);
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
 guest.poll();assert.equal(queue.length,1);const request=queue.shift()!;listeners.get(0)!(request.from,request.n,request.value);assert.equal(queue.length,0,'synchronized peers do not resend the whole history');
 const old=guest.state;listeners.get(1)!(1,2002,0);listeners.get(0)!(1,1800,0);assert.equal(guest.state,old);
 sessions.forEach(s=>s.close());assert.equal(listeners.size,0);
});

test('a disconnected guest finishes a four-seat mission with helpers taking the other seats',()=>{
 let left=0;const channel:ArcadeOnline={mine:2,names:['A','B','C','D'],move:()=>{},connected:()=>false,leave:()=>{left++;}};
 const session=new ArcadeSession(orchardStart('guest-fallback',4,3),channel,orchardStop,()=>{});
 assert.equal(session.waiting,true);session.continueLocally();assert.equal(left,1);assert.equal(session.waiting,false);
 const human:number[]=[],helpers=new Set<number>();
 while(!session.state.complete){
  const state=session.state,target=state.mission.find((_,i)=>!state.found[i])!;
  if(controlsArcadeTurn(state.turn,session.mine,!!session.online,true))human.push(state.turn);else helpers.add(state.turn);
  assert.ok(session.submit(state.board.indexOf(target)));assert.ok(session.index<=5);
 }
 assert.deepEqual(human,[2]);assert.deepEqual([...helpers].sort(),[0,1,3]);assert.equal(session.state.found.filter(Boolean).length,5);session.close();
});

test('mixed-age devices derive and complete the same invitation mission at every shared level',()=>{
 for(let level=1;level<=5;level++){
  let younger=orchardStart('mixed-age',2,orchardSessionTier(0,level));let older=orchardStart('mixed-age',2,orchardSessionTier(3,level));
  assert.deepEqual(younger,older);
  while(!younger.complete){const target=younger.mission.find((_,i)=>!younger.found[i])!;const position=younger.board.indexOf(target);younger=orchardStop(younger,position)!;older=orchardStop(older,position)!;assert.deepEqual(younger,older);}
 }
 assert.equal(orchardStart('solo',1,orchardSessionTier(0)).mission.length,3);assert.equal(orchardStart('solo',1,orchardSessionTier(3)).mission.length,5);
});

test('actual game transport recovers a late renderer and repeated replay requests after packet loss',()=>{
 const packets:{from:string;t:string;gid:string;n?:number;mv?:number;[key:string]:unknown}[]=[];
 let hostNet:ReturnType<typeof createNetGames>,guestNet:ReturnType<typeof createNetGames>,host:ArcadeSession<ReturnType<typeof orchardStart>>;
 const channel=(game:ReturnType<typeof createNetGames>):ArcadeOnline=>({mine:game.session.mine,names:['A','B'],move:(n,v)=>game.move(n,v),onMove:f=>game.onMove(f),peek:(n,seat)=>game.session?.moves.get(n)?.get(seat)});
 hostNet=createNetGames({net:{ids:()=>['B'],send:d=>packets.push({...d,from:'A'})},me:()=> 'A',onStart:()=>{host=new ArcadeSession(orchardStart(hostNet.session.gid,2,0),channel(hostNet),orchardStop,()=>{});}});
 guestNet=createNetGames({net:{ids:()=>['A'],send:d=>packets.push({...d,from:'B'})},me:()=> 'B',onAsk:d=>guestNet.answer(d,true),onStart:()=>{}});
 const drain=(drop?:number)=>{let guard=0;while(packets.length){if(++guard>200)throw Error('replay loop');const p=packets.shift()!;if(p.from==='A'&&p.t==='gmove'&&p.n===drop)continue;(p.from==='A'?guestNet:hostNet).receive(p);}};
 hostNet.invite('sparkleorchard',1,'B');drain();
 const choose=(s:typeof host)=>{const target=s.state.mission.find((_,i)=>!s.state.found[i])!;assert.ok(s.submit(s.state.board.indexOf(target)));};
 choose(host!);drain();assert.ok(guestNet.session.moves.has(2000),'transport cached a commit before UI subscribed');
 const guest=new ArcadeSession(orchardStart(guestNet.session.gid,2,0),channel(guestNet),orchardStop,()=>{});assert.deepEqual(guest.state,host!.state,'late UI reads cached commits without waiting forever');
 choose(guest);drain(2001);assert.equal(guest.index,1);assert.equal(host!.index,2);guest.poll();drain();assert.deepEqual(guest.state,host!.state);
 choose(host!);drain(2002);assert.equal(guest.state.complete,false);hostNet.receive({t:'gmove',from:'B',gid:hostNet.session.gid,n:8000,mv:guest.index});drain();
 assert.equal(guest.state.complete,true,'a replay request ID already used earlier still recovers the final commit');assert.deepEqual(guest.state,host!.state);
 host!.close();guest.close();hostNet.leave();guestNet.leave();
});

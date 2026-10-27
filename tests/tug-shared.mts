import test from 'node:test';
import assert from 'node:assert/strict';
import{createNetGames}from '../js/netgames.js';
import{checkMsg,resetRates}from '../js/netmsg.js';
import{tugStart,tugPull,tugBatch}from '../js/games/tug-core.js';
import{TugSession}from '../js/games/tug-session.js';
const flush=async()=>{for(let i=0;i<8;i++)await new Promise<void>(r=>setImmediate(r));};
async function party(modes=[true,true,true,true,true,true],initialDrop:(from:string,to:string,n:number)=>boolean=()=>false){
 const realNow=Date.now;let time=0,drop=initialDrop;Date.now=()=>time;resetRates();
 const ids=modes.map((_,i)=>'seat'+i),games=new Map<string,ReturnType<typeof createNetGames>>(),present=new Set(ids);let filtered=0;
 for(const id of ids){let g:ReturnType<typeof createNetGames>;g=createNetGames({net:{ids:()=>ids.filter(x=>x!==id),send:(message:Record<string,unknown>)=>{for(const to of ids)if(to!==id&&(!message.to||message.to===to)&&!drop(id,to,Number(message.n))){const packet=checkMsg({...message,from:id},id+'_'+to);if(packet)queueMicrotask(()=>games.get(to)!.receive(packet));else filtered++;}}},me:()=>id,onAsk:d=>g.answer(d,true),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
 games.get(ids[0])!.invite('tug',2,undefined);await flush();
 const channels=ids.map(id=>{const g=games.get(id)!,s=g.session!;assert.equal(s.seats.length,ids.length);return{mine:s.mine,names:ids,move:(n:number,v:number)=>g.move(n,v),onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),connected:()=>true,present:(seat:number)=>present.has(ids[seat]),leave:()=>g.leave()};});
 const sessions=channels.map((online,seat)=>new TugSession({online,gentle:modes[seat],now:()=>time,changed:()=>{}}));await flush();
 const step=async(ms=250)=>{time+=ms;for(const s of sessions)s.poll();await flush();};await step();await step();
 return{sessions,channels,games,ids,step,filtered:()=>filtered,setDrop:(fn:typeof drop)=>{drop=fn;},setPresent:(seat:number,on:boolean)=>{if(on)present.add(ids[seat]);else present.delete(ids[seat]);},close:()=>{sessions.forEach(s=>s.close());games.forEach(g=>g.leave());Date.now=realNow;resetRates();}};
}
test('team strength is fair with odd seats; gentle tug requires every friend and24 pulls',()=>{
 let odd=tugStart(false,3);for(const seat of[0,2,1])odd=tugPull(odd,seat)!;assert.equal(odd.balance,0);const batch=tugBatch(tugStart(false,6),63)!;assert.ok(Math.abs(batch.balance)<1e-8);assert.deepEqual(batch.pulls,[1,1,1,1,1,1]);assert.equal(batch.commands,6);assert.equal(tugBatch(batch,64),null);
 let gentle=tugStart(true,6);for(let n=0;n<24;n++)gentle=tugPull(gentle,n%6)!;assert.equal(gentle.complete,true);assert.equal(gentle.winner,null);assert.deepEqual(gentle.pulls,[4,4,4,4,4,4]);
 let missed=tugStart(true,3);for(let n=0;n<40;n++)missed=tugPull(missed,n%2)!;assert.equal(missed.complete,false,'an absent friend is never silently replaced');
 let tie=tugStart(false,6);for(let n=0;n<240;n++)tie=tugPull(tie,n%6)!;assert.equal(tie.complete,true);assert.equal(tie.winner,null);assert.equal(tugPull(tie,0),null);
 const s=tugStart(false,2);for(const seat of[-1,2,1.5,NaN])assert.equal(tugPull(s,seat),null);
});
test('six actual accepted seats complete cooperative Tug with simultaneous pulls inside unchanged message limits',async()=>{
 const r=await party();try{
  assert.ok(r.sessions.every(s=>!s.waiting));
  for(let round=0;round<4;round++){
   for(const s of r.sessions){assert.equal(s.submit(),true);assert.equal(s.submit(),false,'only one uncommitted request per seat');}
   await flush();for(let tick=0;tick<8;tick++)await r.step();
   for(const s of r.sessions)assert.deepEqual(s.state,r.sessions[0].state);
  }
  assert.equal(r.sessions[0].state!.complete,true);assert.deepEqual(r.sessions[0].state!.pulls,[4,4,4,4,4,4]);assert.ok(r.sessions.every(s=>s.index===4));assert.equal(r.filtered(),0,'real checkMsg rate/schema must accept the entire session');
 }finally{r.close();}
});
test('six-seat classic Tug shares the winning team without letting a client move another player',async()=>{
 const r=await party(Array(6).fill(false));try{
  let pulls=0;while(!r.sessions[0].state!.complete&&pulls<60){const seat=[0,2,4][pulls%3];while(r.sessions[seat].busy)await r.step();assert.equal(r.sessions[seat].submit((seat+1)%6),false);assert.equal(r.sessions[seat].submit(),true);await r.step();pulls++;}
  while(!r.sessions[0].state!.complete)await r.step();assert.equal(r.sessions[0].state!.winner,0);assert.ok(r.sessions[0].state!.commands>=36&&r.sessions[0].state!.commands<=38,'three-seat team needs36 pulls; the final simultaneous batch may include up to two extra accepted pulls');assert.equal(r.sessions[0].state!.balance,-12);for(const s of r.sessions)assert.deepEqual(s.state,r.sessions[0].state);assert.equal(r.filtered(),0);
 }finally{r.close();}
});
test('lost Tug commit and duplicate request recover without counting a pull twice',async()=>{
 const r=await party([false,false]);try{
  r.setDrop((from,to,n)=>from==='seat0'&&to==='seat1'&&n===5000);r.sessions[0].submit();await r.step();assert.equal(r.sessions[0].index,1);assert.equal(r.sessions[1].index,0);
  r.setDrop(()=>false);await r.step(1000);for(let i=0;i<4;i++)await r.step();assert.deepEqual(r.sessions[1].state,r.sessions[0].state);assert.equal(r.sessions[1].index,1);
  assert.equal(r.sessions[1].submit(),true);r.channels[1].move(0,1);await r.step();for(let i=0;i<4;i++)await r.step();assert.deepEqual(r.sessions[0].state!.pulls,[1,1]);assert.ok(r.sessions.every(s=>s.index===2));assert.equal(r.filtered(),0);
 }finally{r.close();}
});
test('missing mode confirmation holds the rope; replayed config agrees on the youngest friend',async()=>{
 const r=await party([false,true,false],(from,to,n)=>from==='seat0'&&to==='seat1'&&n===9997);try{
  assert.equal(r.sessions[0].waiting,true);assert.equal(r.sessions[0].submit(),false);assert.equal(r.sessions[0].index,0);
  r.setDrop(()=>false);for(let i=0;i<10;i++)await r.step();assert.ok(r.sessions.every(s=>!s.waiting&&s.state!.gentle));assert.equal(r.filtered(),0);
 }finally{r.close();}
});
test('disconnect pauses commits; explicit local continuation retains progress and allows all seats',async()=>{
 const r=await party([true,true]);try{
  r.setPresent(1,false);assert.equal(r.sessions[0].submit(),false);await r.step(2000);assert.equal(r.sessions[0].index,0);r.setPresent(1,true);
  r.sessions[0].submit();await r.step();assert.equal(r.sessions[0].state!.commands,1);r.sessions[0].continueLocally();assert.equal(r.sessions[0].state!.commands,1);
  for(let n=0;n<30&&!r.sessions[0].state!.complete;n++)assert.equal(r.sessions[0].submit(n%2),true);assert.equal(r.sessions[0].state!.complete,true);
 }finally{r.close();}
});
test('future, forged and outsider Tug commands cannot change the accepted shared rope',async()=>{
 const r=await party([false,false]);try{
  const before=JSON.stringify(r.sessions[0].state);r.channels[1].move(4000,1);r.channels[1].move(5000,1);for(const g of r.games.values())g.receive({t:'gmove',gid:g.session!.gid,from:'outsider',n:0,mv:1});await r.step();assert.equal(JSON.stringify(r.sessions[0].state),before);assert.equal(JSON.stringify(r.sessions[1].state),before);
 }finally{r.close();}
});

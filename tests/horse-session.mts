import test from 'node:test';
import assert from 'node:assert/strict';
import {createNetGames} from '../js/netgames.js';
import {HorseSession} from '../js/games/horse-session.js';
import {npcChooseMove,serialize} from '../js/games/cacuangua-core.js';
const flush=async()=>{for(let i=0;i<5;i++)await new Promise<void>(r=>setImmediate(r));};
async function room(count=4,modes:('full'|'beginner')[]=Array(count).fill('full')){
 const ids=Array.from({length:count},(_,i)=>'seat'+i),games=new Map<string,ReturnType<typeof createNetGames>>();let drop:(from:string,to:string,n:number)=>boolean=()=>false;
 for(const id of ids){const net={ids:()=>ids.filter(x=>x!==id),send:(message:Record<string,unknown>)=>{for(const to of ids)if(to!==id&&(!message.to||message.to===to)&&!drop(id,to,Number(message.n)))queueMicrotask(()=>games.get(to)!.receive({...message,from:id}));}};let g:ReturnType<typeof createNetGames>;g=createNetGames({net,me:()=>id,onAsk:d=>g.answer(d,true),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
 games.get(ids[0])!.invite('cacuangua',2,undefined);await flush();
 const channels=ids.map(id=>{const g=games.get(id)!,s=g.session!;assert.equal(s.seats.length,count);return{mine:s.mine,names:ids,seed:'proof-1',move:(n:number,v:number)=>g.move(n,v),onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),connected:()=>true,present:()=>true,leave:()=>g.leave()};});
 const sessions=channels.map((online,seat)=>new HorseSession({online,mode:modes[seat],seats:count,seed:online.seed,changed:()=>{}}));await flush();
 return{sessions,channels,games,ids,setDrop:(fn:typeof drop)=>{drop=fn;},close:()=>{sessions.forEach(s=>s.close());games.forEach(g=>g.leave());}};
}
test('real invited four-seat transport completes one shared classic horse match',async()=>{
 const r=await room();try{
  assert.ok(r.sessions.every(s=>s.state?.mode==='full'));let commands=0;
  while(!r.sessions[0].state!.winner&&commands++<4997){const state=r.sessions[0].state!,seat=state.turn,command=state.pendingMove?npcChooseMove(state,'standard').horse+1:0;
   assert.equal(r.sessions[(seat+1)%4].submit(command),false,'other seats cannot play this turn');assert.equal(r.sessions[seat].submit(command),true);await flush();
   const expected=serialize(r.sessions[0].state!);for(const s of r.sessions)assert.equal(serialize(s.state!),expected);
  }
  assert.ok(r.sessions[0].state!.winner);assert.ok(commands<4997);assert.ok(r.sessions.every(s=>s.core!.index===commands));
 }finally{r.close();}
});
test('youngest accepted player sets gentle rules and cannot be upgraded by a later offer',async()=>{
 const r=await room(4,['full','full','beginner','full']);try{
  assert.ok(r.sessions.every(s=>s.state?.mode==='beginner'));r.channels[2].move(9998,1);await flush();assert.ok(r.sessions.every(s=>s.state?.mode==='beginner'));
 }finally{r.close();}
});
test('missing horse commit recovers through real transport replay without duplicate turns',async()=>{
 const r=await room(2);try{
  r.setDrop((from,to,n)=>from==='seat0'&&to==='seat1'&&n===5000);assert.equal(r.sessions[0].submit(0),true);await flush();assert.equal(r.sessions[0].core!.index,1);assert.equal(r.sessions[1].core!.index,0);
  r.setDrop(()=>false);r.sessions[1].poll();await flush();assert.equal(r.sessions[1].core!.index,1);assert.equal(serialize(r.sessions[0].state!),serialize(r.sessions[1].state!));
  for(let i=0;i<3;i++){r.sessions[1].poll();await flush();}assert.equal(r.sessions[0].core!.index,1);assert.equal(r.sessions[1].core!.index,1);
  const before=serialize(r.sessions[0].state!);r.channels[1].move(4000,0);r.channels[1].move(5001,4);await flush();assert.equal(serialize(r.sessions[0].state!),before);assert.equal(serialize(r.sessions[1].state!),before);
 }finally{r.close();}
});

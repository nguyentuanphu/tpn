import assert from 'node:assert/strict';
import {createNetGames} from '../js/netgames.js';
import {SharedBoardSession} from '../js/games/shared-board-session.js';
export const flushRoom=async()=>{for(let i=0;i<5;i++)await new Promise<void>(r=>setImmediate(r));};
export async function sharedRoom<S extends{turn:number}>(game:string,initial:(gentle:boolean,seats:number,seed:string)=>S,reduce:(s:S,value:number)=>S|null,count=4,modes:boolean[]=Array(count).fill(false)){
 const ids=Array.from({length:count},(_,i)=>'seat'+i),games=new Map<string,ReturnType<typeof createNetGames>>();let drop:(from:string,to:string,n:number)=>boolean=()=>false;
 for(const id of ids){const net={ids:()=>ids.filter(x=>x!==id),send:(message:Record<string,unknown>)=>{for(const to of ids)if(to!==id&&(!message.to||message.to===to)&&!drop(id,to,Number(message.n)))queueMicrotask(()=>games.get(to)!.receive({...message,from:id}));}};let g:ReturnType<typeof createNetGames>;g=createNetGames({net,me:()=>id,onAsk:d=>g.answer(d,true),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
 games.get(ids[0])!.invite(game,2,undefined);await flushRoom();
 const channels=ids.map(id=>{const g=games.get(id)!,s=g.session!;assert.equal(s.seats.length,count);return{mine:s.mine,names:ids,seed:'board-proof-2',move:(n:number,v:number)=>g.move(n,v),onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),connected:()=>true,present:()=>true,leave:()=>g.leave()};});
 const sessions=channels.map((online,seat)=>new SharedBoardSession({online,gentle:modes[seat],seats:count,seed:online.seed,initial,reduce,changed:()=>{}}));await flushRoom();
 return{sessions,channels,games,ids,setDrop:(fn:typeof drop)=>{drop=fn;},close:()=>{sessions.forEach(s=>s.close());games.forEach(g=>g.leave());}};
}

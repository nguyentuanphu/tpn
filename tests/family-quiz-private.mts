import test from 'node:test';
import assert from 'node:assert/strict';
import{cleanFamilyQuiz,type FamilyQuestion}from '../js/content/family-quiz.js';
import{quizStart,quizCommand}from '../js/games/familyquiz-core.js';
import{SharedBoardSession}from '../js/games/shared-board-session.js';
import{createNetGames}from '../js/netgames.js';
import{checkMsg,resetRates}from '../js/netmsg.js';
const QUESTIONS:FamilyQuestion[]=[{q:['Which colour is our kite?','Diều nhà mình màu gì?'],pic:'🪁',answers:[['Pink','Hồng'],['Blue','Xanh dương']],right:0},{q:['What do we do together?','Nhà mình cùng làm gì?'],pic:'💛',answers:[['Read','Đọc sách'],['Sing','Hát']],right:1}];
const flush=async()=>{for(let i=0;i<8;i++)await new Promise<void>(r=>setImmediate(r));};
async function privateRoom(count=3,decline:string|null=null,hold=false){
 const ids=Array.from({length:count},(_,i)=>'seat'+i),games=new Map<string,ReturnType<typeof createNetGames>>(),normal:Record<string,unknown>[]=[],privateTo:string[]=[],held:Record<string,unknown>[]=[];
 for(const id of ids){let g:ReturnType<typeof createNetGames>;g=createNetGames({net:{ids:()=>ids.filter(x=>x!==id),send:(d:Record<string,unknown>)=>{normal.push({...d,from:id});for(const to of ids)if(to!==id&&(!d.to||d.to===to)){const packet={...d,from:id,to};if(hold&&d.t==='gstart')held.push(packet);else queueMicrotask(()=>games.get(to)!.receive(packet));}},sendQuiz:async(to:string,gid:string,questions:unknown)=>{privateTo.push(to);queueMicrotask(()=>games.get(to)!.receive({t:'gquiz',gid,from:id,questions:structuredClone(questions)}));return true;}},me:()=>id,onAsk:d=>g.answer(d,id!==decline),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
 const gid=games.get(ids[0])!.invite('familyquiz',1,undefined)!;await flush();
 return{games,ids,gid,normal,privateTo,release:async()=>{hold=false;for(const d of held.splice(0))games.get(String(d.to))!.receive(d);await flush();},close:()=>games.forEach(g=>g.leave())};
}
test('private questions are bounded bilingual data, copied safely and never markup or extra fields',()=>{
 const q=cleanFamilyQuiz(QUESTIONS)!;assert.deepEqual(q,QUESTIONS);assert.notEqual(q[0].q,QUESTIONS[0].q);
 assert.deepEqual(cleanFamilyQuiz([{...QUESTIONS[0],q:['','Câu hỏi riêng'],secret:'discarded'}])![0].q,['Câu hỏi riêng','Câu hỏi riêng']);assert.equal('secret'in cleanFamilyQuiz([{...QUESTIONS[0],secret:'discarded'}])![0],false);
 for(const value of[{},Array(7).fill(QUESTIONS[0]),[{...QUESTIONS[0],right:2}],[{...QUESTIONS[0],answers:[['a','b']]}],[{...QUESTIONS[0],q:['x'.repeat(301),'text']}],[{...QUESTIONS[0],answers:Array(7).fill(['a','b'])}],[{...QUESTIONS[0],q:['bad\u0000text','x']}]])assert.equal(cleanFamilyQuiz(value),null);
});
test('local/gentle quizzes retry misses; classic turns score every seat and the host advances a reveal',()=>{
 let gentle=quizStart(QUESTIONS,true,1);assert.equal(quizCommand(gentle,1),null);gentle=quizCommand(gentle,0)!;assert.equal(gentle.phase,'reveal');assert.equal(quizCommand(gentle,0),null);gentle=quizCommand(gentle,6)!;gentle=quizCommand(gentle,1)!;gentle=quizCommand(gentle,6)!;assert.equal(gentle.complete,true);assert.deepEqual(gentle.scores,[2]);
 let classic=quizStart(QUESTIONS,false,2);classic=quizCommand(classic,1)!;classic=quizCommand(classic,0)!;assert.deepEqual(classic.scores,[0,1]);assert.equal(classic.phase,'reveal');assert.equal(classic.turn,0);classic=quizCommand(classic,6)!;assert.equal(classic.round,1);assert.equal(quizCommand(classic,9),null);
 const original=structuredClone(QUESTIONS),snapshot=quizStart(original,false,2);original[0].q[0]='Changed later';assert.equal(snapshot.questions[0].q[0],QUESTIONS[0].q[0]);
});
test('only the accepted inviter can share; declined players never receive questions and normal moves contain no text',async()=>{
 const r=await privateRoom(3,'seat2');try{
  const host=r.games.get('seat0')!,guest=r.games.get('seat1')!,declined=r.games.get('seat2')!;assert.equal(guest.shareFamilyQuiz(QUESTIONS),false);assert.equal(host.shareFamilyQuiz(QUESTIONS),true);await flush();
  assert.deepEqual(r.privateTo,['seat1']);assert.deepEqual(guest.familyQuiz(),QUESTIONS);assert.equal(declined.familyQuiz(),null);assert.equal(JSON.stringify(r.normal).includes(QUESTIONS[0].q[0]),false);
  const before=structuredClone(guest.familyQuiz());guest.receive({t:'gquiz',gid:r.gid,from:'outsider',questions:[QUESTIONS[1]]});assert.deepEqual(guest.familyQuiz(),before);
  guest.leave();await flush();const count=r.privateTo.length;host.receive({t:'gquizreq',gid:r.gid,from:'seat1'});assert.equal(r.privateTo.length,count,'departed seats do not receive another private snapshot');assert.equal(guest.familyQuiz(),null);
 }finally{r.close();}
});
test('a private snapshot received before start survives only an accepted matching invitation',async()=>{
 const r=await privateRoom(2,null,true);try{assert.equal(r.games.get('seat1')!.session,null);r.games.get('seat0')!.shareFamilyQuiz(QUESTIONS);await flush();await r.release();assert.deepEqual(r.games.get('seat1')!.familyQuiz(),QUESTIONS);}finally{r.close();}
});
test('six invited seats with no guest copy finish the same immutable private quiz through legal shared turns',async()=>{
 const r=await privateRoom(6),sessions:SharedBoardSession<ReturnType<typeof quizStart>>[]=[];try{
  assert.equal(r.games.get('seat0')!.shareFamilyQuiz(QUESTIONS),true);await flush();
  for(const id of r.ids){const g=r.games.get(id)!,s=g.session!,questions=g.familyQuiz();assert.deepEqual(questions,QUESTIONS);const online={mine:s.mine,names:r.ids,move:(n:number,v:number)=>g.move(n,v),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),connected:()=>true,present:()=>true,leave:()=>g.leave()};sessions.push(new SharedBoardSession({online,gentle:s.mine===4,seats:6,seed:r.gid,initial:(gentle,seats)=>quizStart(questions,gentle,seats),reduce:quizCommand,changed:()=>{}}));}
  await flush();assert.ok(sessions.every(s=>s.state?.gentle));let moves=0;
  while(!sessions[0].state!.complete&&moves++<100){const s=sessions[0].state!,value=s.phase==='reveal'?6:s.questions[s.round].right;assert.equal(sessions[(s.turn+1)%6].submit(value),false);assert.equal(sessions[s.turn].submit(value),true);await flush();for(const peer of sessions)assert.deepEqual(peer.state,sessions[0].state);}
  assert.ok(sessions[0].state!.complete);assert.deepEqual(sessions[0].state!.scores,[2,2,2,2,2,2]);assert.equal(moves,14);assert.equal(JSON.stringify(r.normal).includes(QUESTIONS[0].q[0]),false);
 }finally{sessions.forEach(s=>s.close());r.close();}
});
test('family question wire messages accept sealed envelopes, never plaintext content',()=>{
 resetRates();assert.equal(checkMsg({t:'gquiz',gid:'quiz1',questions:QUESTIONS},'host'),null);
 const cleaned=checkMsg({t:'gquiz',to:'guest',gid:'quiz1',iv:'abcdefghijklmnop',ct:'ciphertext',questions:QUESTIONS},'host')!;assert.ok(cleaned);assert.equal('questions'in cleaned,false);
 assert.equal(checkMsg({t:'gquiz',to:'guest',gid:'quiz1',iv:'iv',ct:'x'.repeat(100001)},'host'),null);assert.equal(checkMsg({t:'gquiz',gid:'not a game',iv:'iv',ct:'x'},'host'),null);resetRates();
});

import assert from 'node:assert/strict';
import type{Browser,Page}from 'playwright';
import type{Msg}from '../types/net.js';
import type{FamilyQuestion}from '../js/content/family-quiz.js';
const QUESTIONS:FamilyQuestion[]=[{q:['Which colour is our family kite?','Diều của nhà mình màu gì?'],pic:'🪁',answers:[['Pink','Hồng'],['Blue','Xanh dương']],right:0}];
declare global{interface Window{__quizPackets?:Msg[];__quizReceived?:FamilyQuestion[][];}}
export async function familyQuizCryptoCheck(browser:Browser){
 const contexts:Awaited<ReturnType<Browser['newContext']>>[]=[],pages:Page[]=[];
 try{
  for(let n=0;n<3;n++){
   const ctx=await browser.newContext();contexts.push(ctx);const page=await ctx.newPage();await page.route('**/__family-crypto',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Private quiz check</title></head><body></body></html>'}));await page.goto('http://localhost:8765/__family-crypto');pages.push(page);
  }
  const pubs:string[]=[];for(const page of pages)pubs.push(await page.evaluate(async()=>(await import(String('/js/net.js'))).myPub()));
  await pages[0].evaluate(async({guest})=>{const{Net}=await import(String('/js/net.js'))as typeof import('../js/net.js');Net.role='host';Net.me='host';Net.code='QUIZROOM';Net.knocking=false;Net.remotes={guest:{id:'guest',pub:guest}};window.__quizPackets=[];Net.send=(packet:Msg)=>{window.__quizPackets!.push({...packet,from:'host'});};},{guest:pubs[1]});
  for(let n=1;n<3;n++)await pages[n].evaluate(async({host,me})=>{const{Net}=await import(String('/js/net.js'))as typeof import('../js/net.js');Net.role='guest';Net.me=me;Net.code='QUIZROOM';Net.knocking=false;Net.remotes={host:{id:'host',pub:host}};window.__quizReceived=[];Net.on('gquiz',(d:Msg)=>{window.__quizReceived!.push(d.questions);});},{host:pubs[0],me:n===1?'guest':'outsider'});
  const sent=await pages[0].evaluate(async questions=>(await import(String('/js/net.js'))).Net.sendFamilyQuiz('guest','quizround1',questions,()=>true),QUESTIONS);assert.equal(sent,true);
  const packet=await pages[0].evaluate(()=>window.__quizPackets![0]);assert.equal(packet.to,'guest');assert.equal('questions'in packet,false);assert.ok(typeof packet.ct==='string'&&packet.ct.length>20);assert.equal(JSON.stringify(packet).includes(QUESTIONS[0].q[0]),false);
  await pages[1].evaluate(async packet=>{const M=await import(String('/js/net.js')),S=await import(String('/js/netmsg.js'));const cleaned=S.checkMsg(packet,'host');if(cleaned)await M.Net._openFamilyQuiz(cleaned,'host');},packet);assert.deepEqual(await pages[1].evaluate(()=>window.__quizReceived),[QUESTIONS]);
  await pages[2].evaluate(async packet=>(await import(String('/js/net.js'))).Net._openFamilyQuiz({...packet,to:'outsider'},'host'),packet);assert.deepEqual(await pages[2].evaluate(()=>window.__quizReceived),[],'a room member without the recipient key cannot decrypt the round');
  for(const altered of[{...packet,gid:'otherround'},{...packet,ct:(String(packet.ct)[0]==='A'?'B':'A')+String(packet.ct).slice(1)},{...packet,to:'outsider'}])await pages[1].evaluate(async packet=>(await import(String('/js/net.js'))).Net._openFamilyQuiz(packet,'host'),altered);
  assert.equal(await pages[1].evaluate(()=>window.__quizReceived!.length),1,'wrong round, tampered ciphertext and wrong recipient are rejected');
  const revoked=await pages[0].evaluate(async questions=>{const{Net}=await import(String('/js/net.js'));let active=true;const sent=Net.sendFamilyQuiz('guest','quizround1',questions,()=>active);active=false;return await sent;},QUESTIONS);assert.equal(revoked,false);
  const rotated=await pages[0].evaluate(async({questions,replacement})=>{const{Net}=await import(String('/js/net.js'));const sent=Net.sendFamilyQuiz('guest','quizround1',questions,()=>true);Net.remotes.guest.pub=replacement;return await sent;},{questions:QUESTIONS,replacement:pubs[2]});assert.equal(rotated,false,'key replacement during encryption must stop publication');assert.equal(await pages[0].evaluate(()=>window.__quizPackets!.length),1);
  await pages[1].evaluate(async packet=>{const{Net}=await import(String('/js/net.js'));const opened=Net._openFamilyQuiz(packet,'host');Net._roomGeneration++;await opened;},packet);assert.equal(await pages[1].evaluate(()=>window.__quizReceived!.length),1,'late decrypt cannot enter a replaced room');
  return 'Actual Net ECDH/AES-GCM round works only for the intended separate browser identity; no plaintext question packet, outsider/wrong round/tamper/recipient rejected, active-game/key/room changes stop late publication';
 }finally{for(const ctx of contexts)await ctx.close();}
}

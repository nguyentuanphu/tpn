import test from 'node:test';
import assert from 'node:assert/strict';
import {throwResult,initialChase,passGate,flagRunner,initialRowing,rowStroke,sawAction} from '../js/games/folk-court-rules.js';
test('a cloth còn must fit through its hoop; a disc only needs to touch the coin',()=>{
 const target={x:200,y:60,radius:22};assert.equal(throwResult('con',200,4,target)!.hit,true);assert.equal(throwResult('con',210,4,target)!.hit,false);assert.equal(throwResult('con',200,3,target)!.hit,false);
 assert.equal(throwResult('disc',225,4,target)!.hit,true);assert.equal(throwResult('disc',250,4,target)!.hit,false);
 for(const[aim,power]of[[0,4],[400,2],[100,0],[100,5],[NaN,2]])assert.equal(throwResult('disc',aim,power,target),null);
});
test('the mouse uses the raised gate and the cat follows its route',()=>{
 let s=initialChase();assert.equal(passGate(s,5,true),null);assert.equal(passGate(s,1,true)!.passed,0);assert.equal(passGate(s,1,true)!.cat,0);
 for(let n=0;n<4;n++){const old=s;s=passGate(s,s.open,true)!;assert.equal(s.passed,n+1);assert.equal(s.cat,old.mouse);assert.ok(s.mouse>s.cat);}assert.equal(s.done,true);assert.equal(passGate(s,0,true),null);
});
test('flag runners match called numbers, not flag colour or transformed icon text',()=>{
 for(let called=1;called<=3;called++)for(let chosen=1;chosen<=3;chosen++)assert.equal(flagRunner(called,chosen),called===chosen);assert.equal(flagRunner(4,4),false);assert.equal(flagRunner(1,NaN),false);
});
test('a rowing crew alternates sides and older crews follow the beat',()=>{
 let s=initialRowing();assert.equal(rowStroke(s,'right',true,true),s);assert.equal(rowStroke(s,'left',false,false)!.distance,0);
 for(let n=0;n<12;n++){const next=rowStroke(s,s.next,true,false)!;assert.equal(next.distance,s.distance+10);assert.notEqual(next.next,s.next);s=next;}
 assert.equal(s.distance,120);assert.equal(s.strokes,12);assert.equal(rowStroke(s,'left',true,false),null);
 const gentle=rowStroke(initialRowing(),'left',false,true)!;assert.equal(gentle.distance,10,'little ones need no timer window');
});
test('the hand-holding rhyme alternates pull/push for five four-beat verses',()=>{
 assert.deepEqual(Array.from({length:20},(_,i)=>sawAction(i)),Array.from({length:10},()=>['pull','push']).flat());assert.equal(sawAction(20),null);assert.equal(sawAction(-1),null);
});

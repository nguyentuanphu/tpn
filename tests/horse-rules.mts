import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMove,applyRoll,initialState,isGameOver,legalMoves,npcChooseMove,rollDice,serialize,deserialize,horseCommand} from '../js/games/cacuangua-core.js';
test('horse setup is deterministic, stable by seat and supports every advertised seat',()=>{
 for(const seats of[2,3,4]){assert.deepEqual(initialState('beginner',seats,'x'),initialState('beginner',seats,'x'));assert.equal(initialState('full',seats).players.length,seats);}
 assert.equal(initialState('beginner').players[0].horses.length,2);assert.equal(initialState('full').players[0].horses.length,4);
 assert.throws(()=>initialState('full',5));
});
test('one-die rolls do not mutate the board and advance a non-stalling shared stream',()=>{
 const s=initialState('full',2,'dice'),before=serialize(s);assert.deepEqual(rollDice(s,[4]),[4]);assert.equal(serialize(s),before);assert.throws(()=>rollDice(s,[3,6]));assert.throws(()=>rollDice(s,[0]));
 let state=s;const results=new Set<number>();
 for(let i=0;i<100;i++){state=applyRoll(state);results.add(state.lastRoll);if(state.pendingMove)state=applyMove(state,npcChooseMove(state,'standard').horse,0);}
 assert.equal(results.size,6);assert.equal(state.rolls,100);
});
test('gentle launch consumes a die and advances the turn without captures',()=>{
 const state={...initialState('beginner'),dice:[4],pendingMove:true},next=applyMove(state,0,0);assert.equal(next.players[0].horses[0].pos,0);assert.equal(next.turn,1);assert.equal(state.players[0].horses[0].pos,-1);
});
test('classic launches use only 1 or 6, validated in the reducer itself',()=>{
 for(const die of[2,3,4,5]){const state={...initialState('full'),dice:[die],pendingMove:true};assert.equal(legalMoves(state).length,0);assert.throws(()=>applyMove(state,0,0));}
 for(const die of[1,6]){const state={...initialState('full'),dice:[die],pendingMove:true};assert.equal(legalMoves(state).length,4);assert.equal(applyMove(state,0,0).players[0].horses[0].pos,0);}
});
test('classic exact landings capture; intermediate pieces block a jump',()=>{
 const s={...initialState('full'),dice:[1],pendingMove:true};s.players[0].horses[0].pos=14;s.players[1].horses[0].pos=1;
 const next=applyMove(s,0,0);assert.equal(next.players[1].horses[0].pos,-1);assert.equal(s.players[1].horses[0].pos,1);
 const blocked={...s,dice:[2]};assert.ok(!legalMoves(blocked).some(m=>m.horse===0));assert.throws(()=>applyMove(blocked,0,0));
});
test('classic home lanes finish in numbered slots 6,5,4,3',()=>{
 let s=initialState('full');
 for(let horse=0;horse<4;horse++){s.players[0].horses[horse].pos=55;s={...s,turn:0,dice:[6-horse],pendingMove:true};s=applyMove(s,horse,0);assert.equal(s.players[0].horses[horse].pos,61-horse);}
 assert.equal(s.winner,'red');assert.equal(s.players[0].finishedCount,4);assert.equal(isGameOver(s),true);
});
test('home entry cannot jump another horse and each home climb needs the next number',()=>{
 let s={...initialState('full'),dice:[2],pendingMove:true};s.players[0].horses[0].pos=55;s=applyMove(s,0,0);assert.equal(s.players[0].horses[0].pos,57);
 s={...s,turn:0,dice:[4],pendingMove:true};assert.throws(()=>applyMove(s,0,0));s.dice=[3];s=applyMove(s,0,0);assert.equal(s.players[0].horses[0].pos,58);
 s={...s,turn:0,dice:[6],pendingMove:true};s.players[0].horses[1].pos=55;assert.ok(!legalMoves(s).some(m=>m.horse===1));
});
test('all beginner horses finish at their separate home goals',()=>{
 let s=initialState('beginner');s.players[0].horses[0].pos=20;s.players[0].horses[1].pos=19;s={...s,dice:[1],pendingMove:true};s=applyMove(s,0,0);s={...s,turn:0,dice:[1],pendingMove:true};s=applyMove(s,1,0);assert.equal(s.winner,'red');assert.deepEqual(s.players[0].horses.map(h=>h.pos),[21,20]);
});
test('helper choices are deterministic, legal, and complete both rule variants',()=>{
 for(const mode of['beginner','full']as const){let s=initialState(mode,4,'proof-1'),commands=0;
  while(!s.winner&&commands++<4997){if(!s.pendingMove)s=applyRoll(s);else{
   for(const difficulty of['easy','standard','hard']as const){const m=npcChooseMove(s,difficulty);assert.ok(legalMoves(s).some(c=>c.horse===m.horse));assert.deepEqual(m,npcChooseMove(s,difficulty));}
   s=applyMove(s,npcChooseMove(s,'standard').horse,0);
  }}assert.ok(s.winner,mode+' did not finish');assert.ok(commands<4997);assert.deepEqual(deserialize(serialize(s)),s);
 }
});
test('horse commands reject malformed, stale and impossible input without mutating state',()=>{
 const s=initialState('full'),before=serialize(s);for(const command of[-1,5,9999,1.5,NaN,1,2,3,4])assert.equal(horseCommand(s,command),null);assert.equal(serialize(s),before);
 const rolled=horseCommand(s,0)!;if(rolled.pendingMove)assert.equal(horseCommand(rolled,0),null);
 assert.throws(()=>deserialize('{}'));assert.throws(()=>deserialize(serialize({...s,turn:99})));assert.throws(()=>deserialize(serialize({...s,dice:[7],pendingMove:true})));
});

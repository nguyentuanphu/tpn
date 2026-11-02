import test from 'node:test';
import assert from 'node:assert/strict';
import {card,rulesFor,setNorth} from '../../js/games/tienlenrules.js';
const north=rulesFor(true),south=rulesFor(false),cards=(rank,suits)=>suits.map(s=>card(rank,s));
test('Northern pairs require matching colours except twos; Southern pairs keep mixed colours',()=>{
 for(let rank=0;rank<13;rank++)for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){
  const p=cards(rank,[a,b]);assert.ok(south.classify(p));
  assert.equal(!!north.classify(p),rank===12||(a<2)===(b<2));
 }
});
test('Northern singles and pairs of twos compare correctly across suits and colours',()=>{
 for(let a=0;a<4;a++)for(let b=0;b<4;b++)assert.equal(north.beats(north.classify(cards(12,[a])),north.classify(cards(12,[b]))),a>b);
 assert.ok(north.beats(north.classify(cards(12,[0,1])),north.classify(cards(11,[2,3]))));
 assert.ok(north.beats(north.classify(cards(12,[1,3])),north.classify(cards(12,[0,2]))));
 assert.equal(north.beats(north.classify(cards(11,[2,3])),north.classify(cards(12,[0,1]))),false);
});
test('Northern triples need the same three suits; runs match suit and count, never include two',()=>{
 const triple=north.classify(cards(2,[0,1,3]));
 assert.ok(north.beats(north.classify(cards(3,[0,1,3])),triple));
 assert.equal(north.beats(north.classify(cards(3,[0,2,3])),triple),false);
 const run=(r,s,n=3)=>Array.from({length:n},(_,i)=>card(r+i,s));
 assert.ok(north.beats(north.classify(run(3,0)),north.classify(run(2,0))));
 assert.equal(north.beats(north.classify(run(3,1)),north.classify(run(2,0))),false);
 assert.equal(north.classify([card(0,0),card(1,1),card(2,0)]),null);
 assert.equal(north.classify(run(10,0)),null);
});
test('Northern quad cuts single or paired twos, never an ordinary pair',()=>{
 const quad=north.classify(cards(0,[0,1,2,3]));
 assert.ok(north.beats(quad,north.classify(cards(12,[3]))));assert.ok(north.beats(quad,north.classify(cards(12,[0,3]))));
 assert.equal(north.beats(quad,north.classify(cards(5,[0,1]))),false);
 assert.equal(north.classify([0,1,2].flatMap(r=>cards(r,[0,1]))),null);
 assert.ok(south.classify([0,1,2].flatMap(r=>cards(r,[0,1]))));
});
test('Per-table rules and legal bot choices stay isolated from global legacy mode',()=>{
 const table=north.classify(cards(0,[0]));const hand=[card(1,1),card(2,0)];
 setNorth(false);assert.deepEqual(north.choose(hand,table,{strong:true}),[card(2,0)]);
 setNorth(true);assert.deepEqual(south.choose(hand,table,{strong:true}),[card(1,1)]);
 assert.equal(north.classify(cards(1,[0,2])),null);assert.ok(south.classify(cards(1,[0,2])));setNorth(false);
});

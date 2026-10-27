import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate} from '../../js/games/oanquan-core.js';
const state = () => ({ seeds: Array(12).fill(0), big: Array(12).fill(false), score: [0, 0] });
const total = s => s.seeds.reduce((a,b) => a+b,0) + s.big.filter(Boolean).length*10 + s.score[0]+s.score[1];

test('an empty mandarin pit permits a capture beyond it in either direction', () => {
  for (const [from,dir,target] of [[4,1,7],[2,-1,11]]) {
    const s=state();s.seeds[from]=1;s.seeds[target]=4;
    const r=simulate(s,from,dir);
    assert.equal(r.s.score[0],4);assert.equal(r.s.seeds[target],0);
    assert.equal(total(r.s),total(s));assert.equal(s.seeds[from],1,'simulation leaves its input alone');
  }
});

test('a chained capture cannot skip over a mandarin stone', () => {
  const s=state();s.seeds[1]=2;s.seeds[5]=3;s.big[6]=true;s.seeds[7]=4;
  const r=simulate(s,1,1);
  assert.equal(r.s.score[0],3);assert.equal(r.s.seeds[7],4);assert.equal(r.s.big[6],true);
  assert.equal(total(r.s),total(s));
});

test('a full mandarin pit stops relay sowing; a mandarin beyond an empty pit can be captured', () => {
  const s=state();s.seeds[4]=1;s.big[6]=true;s.seeds[7]=4;
  assert.equal(simulate(s,4,1).s.score[0],0);
  const t=state();t.seeds[2]=1;t.big[5]=false;t.big[6]=true;t.seeds[4]=0;t.seeds[5]=0;
  // End in 4, skip empty 5, capture the mandarin in 6.
  t.seeds[2]=2;
  const r=simulate(t,2,1);assert.equal(r.s.score[0],10);assert.equal(r.s.big[6],false);
});

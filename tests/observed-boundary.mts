import test from 'node:test';
import assert from 'node:assert/strict';
import { waitObserved } from './wait-observed.mts';

test('report arriving in the final permitted tick is observed without a longer deadline',async()=>{
  const rows:{id:number}[]=[];let waited=0;
  const result=await waitObserved(rows,r=>r.id===2,async ms=>{waited+=ms;rows.push({id:2});},250);
  assert.equal(result?.id,2);assert.equal(waited,250);
});
test('absent report fails within the original wait budget',async()=>{
  let waited=0;assert.equal(await waitObserved([],()=>true,async ms=>{waited+=ms;},6000),null);assert.equal(waited,6000);
});
test('already observed report needs no polling delay',async()=>{
  const result=await waitObserved([{id:3}],r=>r.id===3,async()=>{throw Error('unnecessary wait');},6000);assert.equal(result?.id,3);
});

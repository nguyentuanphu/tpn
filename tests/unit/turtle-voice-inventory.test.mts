import test from 'node:test';
import assert from 'node:assert/strict';
import {collectLines} from '../../tools/voice-lines.mts';
test('the exact five turtle-counting utterances are present in the maintained voice inventory',()=>{
 const inventory=collectLines();
 for(const[en,vi]of[['One!','Một!'],['Two!','Hai!'],['Three!','Ba!'],['Four!','Bốn!'],['Five!','Năm!']]){
  assert.ok(inventory.some(l=>l.en===en&&l.vi===vi&&l.from.split(',').includes('js/content/chapter2text.js')),`${en} / ${vi}`);
 }
});

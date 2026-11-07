import test from 'node:test';
import assert from 'node:assert/strict';
import {collectLines} from '../../tools/voice-lines.mts';
test('the exact five turtle-counting utterances are present in the maintained voice inventory',()=>{
 const inventory=collectLines();
 for(const[en,vi]of[['One!','Một!'],['Two!','Hai!'],['Three!','Ba!'],['Four!','Bốn!'],['Five!','Năm!']]){
  assert.ok(inventory.some(l=>l.en===en&&l.vi===vi&&l.from.split(',').includes('js/content/chapter2text.js')),`${en} / ${vi}`);
 }
});
test('a picture alone, written with its variation selector or joiner, is never a spoken line (v1.08 fix: an empty recording of a chess piece)',()=>{
 const picture=s=>/^[\p{Emoji}\p{Emoji_Component}\s✓✕+−=]+$/u.test(s);
 const bad=collectLines().filter(l=>picture(l.en)||picture(l.vi));
 assert.deepEqual(bad.map(l=>l.en+' / '+l.vi),[]);
 assert.ok(collectLines().some(l=>l.en==='Little Chess'&&l.vi==='Cờ Vua Nhỏ'),'Little Chess / Cờ Vua Nhỏ is still a line');
});

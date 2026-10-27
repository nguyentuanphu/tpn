import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const farm=fs.readFileSync(new URL('../../js/farm.ts',import.meta.url),'utf8');
const handler=farm.slice(farm.indexOf('function petAnimal('),farm.indexOf('export function petPet('));

test('petting each farm animal plays its real sound and captions it without spoken imitation',()=>{
 const captions=[],sounds=[],jobs=[];
 const ANIMALS={sheep:{snd:'baa'},pig:{snd:'oink'},cow:{snd:'moo'},chicken:{snd:'cluck'},horse:{snd:'neigh'}};
 const SFX=Object.fromEntries(Object.values(ANIMALS).map(a=>[a.snd,()=>sounds.push(a.snd)]));
 const pet=new Function('ANIMALS','SFX','captionOnly','say',`${handler};return petAnimal;`)(ANIMALS,SFX,(en,vi)=>captions.push([en,vi]),()=>assert.fail('A real animal call must not trigger speech'));
 for(const kind of Object.keys(ANIMALS)){
  const A={a:{kind},obj:{position:{x:0,y:0,z:0,distanceTo:()=>0}},hop:0};
  pet({farm:{animals:[A]},fx(){},job:n=>jobs.push(n)},{pos:{}});
  assert.equal(A.hop,.6);
 }
 assert.deepEqual(sounds,['baa','oink','moo','cluck','neigh']);
 assert.equal(captions.length,5);assert.deepEqual(captions[0],['Baa baa!','Be be!']);
 assert.deepEqual(jobs,['pet','pet','pet','pet','pet']);
});

test('captionOnly uses current-language captions even with speech enabled and isolates broken listeners',()=>{
 const script=`
 globalThis.window=globalThis;globalThis.addEventListener=()=>{};
 globalThis.document={hidden:false,documentElement:{lang:'en'},addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];}};
 globalThis.localStorage={getItem(){return null;},setItem(){},removeItem(){}};
 let speech=0;globalThis.speechSynthesis={getVoices:()=>[],addEventListener(){},resume(){},cancel(){},speak(){speech++;}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 const {settings}=await import('./js/state.js');settings.voice=true;
 const {spoken,captionOnly}=await import('./js/voice.js');const seen=[];
 spoken.push(()=>{throw Error('broken caption listener')},text=>seen.push(text));
 settings.lang='en';captionOnly('Baa baa!','Be be!');settings.lang='vi';captionOnly('Baa baa!','Be be!');
 process.stdout.write(JSON.stringify({speech,seen}));process.exit(0);`;
 const result=spawnSync(process.execPath,['--input-type=module','--eval',script],{cwd:new URL('../..',import.meta.url),encoding:'utf8',timeout:5000});
 assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),{speech:0,seen:['Baa baa!','Be be!']});
});

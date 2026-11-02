import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {validateReviewedVoiceDelta} from '../../tools/reviewed-voice-delta.mts';
import {installedFptLine,missingFptLines} from '../../tools/record-public-voice-delta.mts';
import {lineHash} from '../../js/packhash.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
const source='js/games/goat.ts',bytes='fixed source',pair={en:'Hello, friend.',vi:'Chào bạn.',from:'js/games/goat.js'};
const fixture=()=>({schema:1,status:'reviewed-public',sourceHashes:{[source]:hash(bytes)},lines:[{id:lineHash('vi',pair.vi),lang:'vi',text:pair.vi,area:'games',part:false,source:[source]}]});
test('Public delta requires source hash and exact currently extracted fixed speech',()=>{
 assert.equal(validateReviewedVoiceDelta(fixture(),()=>bytes,[pair]).lines.length,1);
 assert.throws(()=>validateReviewedVoiceDelta(fixture(),()=>bytes+'edited',[pair]),/changed after review/);
 assert.throws(()=>validateReviewedVoiceDelta(fixture(),()=>bytes,[]),/not a fixed line/);
});
test('Private, templated, duplicated and non-game sources cannot enter provider queue',()=>{
 for(const text of ['Hello Na','Hello ${name}','Hello {name}']){const d=fixture();d.lines[0].text=text;d.lines[0].id=lineHash('vi',text);assert.throws(()=>validateReviewedVoiceDelta(d,()=>bytes,[{...pair,vi:text}]),/Invalid or private/);}
 const duplicated=fixture();duplicated.lines.push({...duplicated.lines[0]});assert.throws(()=>validateReviewedVoiceDelta(duplicated,()=>bytes,[pair]),/Invalid or private/);
 const privateSource=fixture();privateSource.sourceHashes={'js/family-quiz-store.ts':hash(bytes)};assert.throws(()=>validateReviewedVoiceDelta(privateSource,()=>bytes,[pair]),/Only fixed public/);
});
test('Installed FPT clips are reusable only when both byte size and digest match',async()=>{
 const line=fixture().lines[0],audio=Buffer.from('fixture-audio');const manifest={lines:{[line.id]:{bytes:audio.length,sha256:hash(audio)}}};
 assert.ok(await installedFptLine(line,manifest,async()=>audio));
 assert.equal(await installedFptLine(line,manifest,async()=>Buffer.from('wrong')),false);
 assert.equal(await installedFptLine(line,manifest,async()=>{throw Error('missing')}),false);
 assert.equal(await installedFptLine(line,{lines:{}},async()=>audio),false);
});

test('Missing-only recording preflight rejects corruption instead of spending to replace it',async()=>{
 const line=fixture().lines[0],audio=Buffer.from('valid');const manifest={lines:{[line.id]:{bytes:audio.length,sha256:hash(audio)}}};
 assert.deepEqual(await missingFptLines([line],manifest,async()=>audio),[]);
 assert.deepEqual(await missingFptLines([line],{lines:{}},async()=>audio),[line]);
 await assert.rejects(()=>missingFptLines([line],manifest,async()=>Buffer.from('bad')),/repair before recording/);
});

test('Only exact public English mixed fragments with a source proof may be recorded',()=>{
 const d=fixture(),line=d.lines[0];Object.assign(line,{lang:'en',text:pair.en,id:lineHash('en',pair.en),part:true,mixedFragment:'mixed-static-v1'});
 const fragment={...line,source:['js/games/goat.js']};
 assert.equal(validateReviewedVoiceDelta(d,()=>bytes,[],()=>[fragment]).lines.length,1);
 assert.throws(()=>validateReviewedVoiceDelta(d,()=>bytes,[],()=>[]),/not a fixed line/);
 assert.throws(()=>validateReviewedVoiceDelta(d,()=>bytes,[],()=>[{...fragment,source:['js/games/other.js']}]),/not a fixed line/);
 line.lang='vi';line.id=lineHash('vi',line.text);assert.throws(()=>validateReviewedVoiceDelta(d,()=>bytes,[],()=>[fragment]),/Invalid or private/);
});

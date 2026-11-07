import test from 'node:test';
import assert from 'node:assert/strict';
import {speechRoutes,FPT_VOICE,AZURE_VOICES,AZURE_VOICES_ALL,ASIDE_VOICES_ON,VOICE_DELIVERY}from'../tools/voice-providers.mts';
// (owner's decision, 3 Nov 2026 AEDT, v1.08 voices-aside: female voices only; not a weakened check) the male English and
// Vietnamese voices and Lê Minh are put aside (voices-aside/README.md): by default the tools route only the female
// voices; SV_ASIDE_VOICES=1 brings the full cast and the Lê Minh route back, and that cast is still kept here.
test('public Vietnamese uses the female Azure voice only, Lê Minh put aside',()=>{
 if(ASIDE_VOICES_ON)return;
 const r=speechRoutes('vi');assert.deepEqual(r.map(x=>[x.provider,x.slot,x.voice]),[['azure','f','vi-VN-HoaiMyNeural']]);
 assert.equal(r[0].deliveryDirectory,'voices/vi/f');
 assert.equal(FPT_VOICE.model,'FPT.AI-VITs');assert.equal(VOICE_DELIVERY.bitrate,32000);
});
test('the put-aside cast is kept for later: male Azure voices and the exact Le Minh provider',()=>{
 assert.deepEqual(AZURE_VOICES_ALL.vi,{f:'vi-VN-HoaiMyNeural',m:'vi-VN-NamMinhNeural'});
 assert.deepEqual(AZURE_VOICES_ALL.en,{f:'en-AU-NatashaNeural',m:'en-AU-WilliamNeural'});
 assert.equal(FPT_VOICE.voice,'leminh');
 if(ASIDE_VOICES_ON)assert.deepEqual(speechRoutes('vi').map(x=>[x.provider,x.slot,x.voice]),[['azure','f','vi-VN-HoaiMyNeural'],['azure','m','vi-VN-NamMinhNeural'],['fpt','leminh','leminh']]);
});
test('English and existing additional languages stay with their approved Azure voices',()=>{
 assert.deepEqual(speechRoutes('en').map(x=>x.voice),ASIDE_VOICES_ON?['en-AU-NatashaNeural','en-AU-WilliamNeural']:['en-AU-NatashaNeural']);
 for(const lang of Object.keys(AZURE_VOICES))assert.ok(speechRoutes(lang).every(r=>r.language===lang));
 assert.equal(speechRoutes('zh')[0].voice,'zh-CN-YunxiNeural');assert.equal(speechRoutes('hi')[0].voice,'hi-IN-MadhurNeural');
 assert.throws(()=>speechRoutes('unknown'),/No approved/);
});
test('private family text never receives a cloud recording route',()=>{
 for(const lang of ['en','vi','zh','hi','unknown'])assert.deepEqual(speechRoutes(lang,true),[]);
});

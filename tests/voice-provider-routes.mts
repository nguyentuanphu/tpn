import test from 'node:test';
import assert from 'node:assert/strict';
import {speechRoutes,FPT_VOICE,AZURE_VOICES,VOICE_DELIVERY}from'../tools/voice-providers.mts';
test('public Vietnamese requires Azure defaults and the optional exact Le Minh provider',()=>{
 const r=speechRoutes('vi');assert.deepEqual(r.map(x=>[x.provider,x.slot,x.voice]),[['azure','f','vi-VN-HoaiMyNeural'],['azure','m','vi-VN-NamMinhNeural'],['fpt','leminh','leminh']]);
 assert.equal(new Set(r.map(x=>x.deliveryDirectory)).size,3);
 assert.equal(FPT_VOICE.model,'FPT.AI-VITs');assert.equal(VOICE_DELIVERY.bitrate,32000);
});
test('English and existing additional languages stay with their approved Azure voices',()=>{
 assert.deepEqual(speechRoutes('en').map(x=>x.voice),['en-AU-NatashaNeural','en-AU-WilliamNeural']);
 for(const lang of Object.keys(AZURE_VOICES))assert.ok(speechRoutes(lang).every(r=>r.language===lang));
 assert.equal(speechRoutes('zh')[0].voice,'zh-CN-YunxiNeural');assert.equal(speechRoutes('hi')[0].voice,'hi-IN-MadhurNeural');
 assert.throws(()=>speechRoutes('unknown'),/No approved/);
});
test('private family text never receives a cloud recording route',()=>{
 for(const lang of ['en','vi','zh','hi','unknown'])assert.deepEqual(speechRoutes(lang,true),[]);
});

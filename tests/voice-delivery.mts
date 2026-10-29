import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeVoiceDelivery}from'../tools/voice-delivery.mts';
function wave(){
 const rate=16000,frames=8000,b=Buffer.alloc(44+frames*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*2,40);
 for(let n=0;n<frames;n++)b.writeInt16LE(Math.round(Math.sin(n/rate*440*Math.PI*2)*6000),44+n*2);return b;
}
test('delivery encoder verifies32kbps mono output without modifying its input',async()=>{
 const input=wave(),copy=Buffer.from(input),r=await encodeVoiceDelivery(input,.5);assert.deepEqual(input,copy);assert.ok(r.bytes.length>0&&r.bytes.length<input.length);assert.ok(Math.abs(r.duration-.5)<=.20);
});
test('delivery encoder rejects unreadable source and mismatched duration',async()=>{
 await assert.rejects(()=>encodeVoiceDelivery(Buffer.from('not an MP3 or WAV recording'),1));
 await assert.rejects(()=>encodeVoiceDelivery(wave(),5),/format or duration mismatch/);
 await assert.rejects(()=>encodeVoiceDelivery(wave(),Infinity),/Invalid master/);
});

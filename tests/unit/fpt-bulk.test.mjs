import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { selectLines, identity, reusable } from '../../tools/fpt-recorder.mts';
import { recordFpt } from '../../tools/fpt-voice-test.mts';

const line = (id, text='Một câu tiếng Việt.') => ({ id, lang: 'vi', text, area: 'games', part: false });
test('four shards cover every Vietnamese line and part exactly once', () => {
  const all = [line('00000001'), { ...line('00000002'), part: true }, line('00000003'), line('00000004'), line('00000005'), { ...line('00000006'), lang: 'en' }];
  const combined = Array.from({length:4},(_,i)=>selectLines(all,i,4)).flat();
  assert.equal(combined.length,5); assert.equal(new Set(combined.map(l=>l.id)).size,5);
  assert.ok(combined.some(l=>l.part));
});
test('invalid, repeated or oversized inventory entries fail before recording', () => {
  assert.throws(()=>selectLines([line('../bad')],0,4));
  assert.throws(()=>selectLines([line('00000001'),line('00000001')],0,4));
  assert.throws(()=>selectLines([line('00000001','x'.repeat(5001))],0,4));
  assert.throws(()=>selectLines([],4,4));
});
test('resume requires matching text/provider identity and actual audio checksum', async () => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'fpt-cache-'));
  try {
    const file=path.join(dir,'clip.mp3'), bytes=Buffer.from('previously decoded fixture'); await fs.writeFile(file,bytes);
    const l=line('00000001');const row={identity:identity(l),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,duration:2};
    assert.equal(await reusable(file,l,row),true);
    assert.equal(await reusable(file,{...l,text:'Câu đã thay đổi.'},row),false);
    assert.equal(await reusable(file,l,{...row,identity:'another-provider'}),false);
    await fs.writeFile(file,'damaged'); assert.equal(await reusable(file,l,row),false);
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});
test('bulk synthesis sends the selected line, leminh and explicit MP3', async () => {
  const bytes=new Uint8Array(512);bytes.set([0x49,0x44,0x33]);
  await recordFpt('Con đếm được ba quả táo.','fixture-key',async (_,init)=>{
    const body=JSON.parse(init.body);assert.equal(body.input,'Con đếm được ba quả táo.');assert.equal(body.voice,'leminh');assert.equal(body.response_format,'mp3');
    return new Response(bytes);
  });
});
test('empty or oversized paid requests are rejected locally', async () => {
  const forbidden=()=>{throw new Error('must not call');};
  await assert.rejects(recordFpt('','fixture-key',forbidden),/1 to 5000/);
  await assert.rejects(recordFpt('x'.repeat(5001),'fixture-key',forbidden),/1 to 5000/);
});

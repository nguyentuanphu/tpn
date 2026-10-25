import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {verifyPack} from '../../tools/verify-fpt-pack.mts';
import {identity, VOICE} from '../../tools/fpt-recorder.mts';

test('pack readiness requires every shard, matching provenance and intact files', async () => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'fpt-pack-audit-'));
  try {
    const out=path.join(root,'temp/fpt-recordings'), inventoryDir=path.join(root,'docs/fpt-leminh-full-20261025');
    await fs.mkdir(out,{recursive:true});await fs.mkdir(inventoryDir,{recursive:true});
    const lines=Array.from({length:4},(_,i)=>({id:`0000000${i}`,lang:'vi',text:`Câu ${i}`,area:'test',part:false}));
    const inventory={source:'test',lines}, hash=x=>createHash('sha256').update(x).digest('hex');
    await fs.writeFile(path.join(inventoryDir,'inventory.json'),JSON.stringify(inventory));
    const audio=Buffer.alloc(512);audio.write('ID3');
    const manifests=lines.map(l=>({inventory:hash(JSON.stringify(inventory)),voice:VOICE,total:1,done:{[l.id]:{identity:identity(l),sha256:hash(audio),bytes:audio.length,duration:1}},failed:{},status:'complete'}));
    for(let i=0;i<4;i++)await fs.writeFile(path.join(out,`${lines[i].id}.mp3`),audio);
    await fs.writeFile(path.join(out,'manifest-0.json'),JSON.stringify(manifests[0]));
    let result=await verifyPack(root);assert.equal(result.complete,false);assert.equal(result.verified,1);assert.deepEqual(result.absentShards,[1,2,3]);
    for(let i=1;i<4;i++)await fs.writeFile(path.join(out,`manifest-${i}.json`),JSON.stringify(manifests[i]));
    result=await verifyPack(root);assert.equal(result.complete,true);assert.equal(result.verified,4);assert.equal(result.decoded,0);
    manifests[0].status='running';await fs.writeFile(path.join(out,'manifest-0.json'),JSON.stringify(manifests[0]));
    assert.equal((await verifyPack(root)).complete,false);
    manifests[0].status='complete';manifests[0].voice={...VOICE,voice:'banmai'};
    await fs.writeFile(path.join(out,'manifest-0.json'),JSON.stringify(manifests[0]));
    assert.match((await verifyPack(root)).errors.join(' '),/provider mismatch/);
    manifests[0].voice=VOICE;await fs.writeFile(path.join(out,'manifest-0.json'),JSON.stringify(manifests[0]));
    await fs.writeFile(path.join(out,`${lines[2].id}.mp3`),'damaged');
    result=await verifyPack(root);assert.equal(result.complete,false);assert.equal(result.verified,3);assert.match(result.errors.join(' '),/damaged/);
  } finally {await fs.rm(root,{recursive:true,force:true});}
});

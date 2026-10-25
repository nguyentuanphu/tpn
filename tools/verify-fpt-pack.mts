// Read-only, unpaid audit of the staged Lê Minh pack. Never changes game defaults or assets.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { identity, selectLines, VOICE } from './fpt-recorder.mts';
import type { Line } from './fpt-recorder.mts';

type Clip = { identity: string; sha256: string; bytes: number; duration: number };
type Manifest = { inventory: string; voice: typeof VOICE; total: number; done: Record<string, Clip>; failed: Record<string, string>; status: string };
const sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');

export async function verifyPack(root = '.', decode = false) {
  const inventory: { source: string; lines: Line[] } = JSON.parse(await fs.readFile(path.join(root, 'docs/fpt-leminh-full-20261025/inventory.json'), 'utf8'));
  const fingerprint = sha(JSON.stringify(inventory));
  const expected = selectLines(inventory.lines, 0, 1);
  const errors: string[] = [], absentShards: number[] = [], pendingShards: number[] = [];
  const folder = path.join(root, 'temp/fpt-recordings');
  let verified = 0, bytes = 0, decoded = 0;
  for (let shard = 0; shard < 4; shard++) {
    let manifest: Manifest;
    try { manifest = JSON.parse(await fs.readFile(path.join(folder, `manifest-${shard}.json`), 'utf8')); }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') absentShards.push(shard);
      else errors.push(`Shard ${shard}: unreadable manifest`);
      continue;
    }
    const wanted = selectLines(inventory.lines, shard, 4);
    const byId = new Map(wanted.map(line => [line.id, line]));
    if (manifest.inventory !== fingerprint || JSON.stringify(manifest.voice) !== JSON.stringify(VOICE) || manifest.total !== wanted.length) {
      errors.push(`Shard ${shard}: inventory or provider mismatch`); continue;
    }
    if (!manifest.done || !manifest.failed || typeof manifest.status !== 'string') { errors.push(`Shard ${shard}: invalid manifest`); continue; }
    if (manifest.status !== 'complete') pendingShards.push(shard);
    for (const id of Object.keys(manifest.failed)) errors.push(`Shard ${shard}: recording failed for ${id}`);
    if (manifest.status.startsWith('stopped')) errors.push(`Shard ${shard}: ${manifest.status}`);
    if (manifest.status === 'complete' && Object.keys(manifest.done).length !== wanted.length) errors.push(`Shard ${shard}: incomplete shard marked complete`);
    for (const [id, clip] of Object.entries(manifest.done)) {
      const line = byId.get(id);
      if (!line || clip.identity !== identity(line)) { errors.push(`Shard ${shard}: unexpected or stale clip ${id}`); continue; }
      try {
        const file = path.join(folder, `${id}.mp3`), audio = await fs.readFile(file);
        const mp3 = audio.subarray(0, 3).toString() === 'ID3' || (audio[0] === 255 && (audio[1] & 224) === 224);
        if (!mp3 || audio.length !== clip.bytes || sha(audio) !== clip.sha256 || !(clip.duration > 0)) throw new Error('invalid audio');
        if (decode) { execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-'], { stdio: 'pipe', timeout: 30000 }); decoded++; }
        verified++; bytes += audio.length;
      } catch { errors.push(`Shard ${shard}: missing, damaged or undecodable clip ${id}`); }
    }
  }
  return { source: inventory.source, inventory: fingerprint, voice: VOICE, expected: expected.length, verified, missing: expected.length - verified, bytes, decoded, absentShards, pendingShards, errors, complete: errors.length === 0 && absentShards.length === 0 && pendingShards.length === 0 && verified === expected.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  verifyPack('.', process.argv.includes('--decode')).then(result => {
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length || (!result.complete && !process.argv.includes('--allow-partial'))) process.exitCode = 1;
  }).catch(() => { console.error('Pack audit failed: inventory or manifest could not be read.'); process.exitCode = 1; });
}

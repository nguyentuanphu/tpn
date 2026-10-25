// Full Lê Minh recordings staged for review, never installed into the live voice pack here.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { recordFpt, FptVoiceTestError } from './fpt-voice-test.mts';

export type Line = { id: string; lang: string; text: string; area: string; part: boolean };
export const VOICE = { provider: 'FPT Neo', model: 'FPT.AI-VITs', voice: 'leminh', speed: 1, response_format: 'mp3' };
const digest = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
export const identity = (line: Line) => digest(JSON.stringify({ ...VOICE, id: line.id, text: line.text }));
export const selectLines = (lines: Line[], shard: number, total: number) => {
  if (!Number.isInteger(shard) || !Number.isInteger(total) || total < 1 || shard < 0 || shard >= total) throw new Error('Invalid recording shard.');
  const seen = new Set<string>();
  return lines.filter(line => {
    if (line.lang !== 'vi') return false;
    if (!/^[a-f0-9-]{8,40}$/.test(line.id) || !line.text.trim() || line.text.length > 5000 || seen.has(line.id)) throw new Error('Invalid or duplicate voice inventory entry.');
    seen.add(line.id);
    return true;
  }).sort((a, b) => a.id.localeCompare(b.id)).filter((_, i) => i % total === shard);
};
type Done = { identity: string; sha256: string; bytes: number; duration: number };
type Report = { inventory: string; voice: typeof VOICE; total: number; done: Record<string, Done>; failed: Record<string, string>; status: string; updated: string };

function duration(file: string) {
  const n = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8', timeout: 30000 }).trim());
  if (!(n > 0)) throw new Error('Audio decode failed.');
  return n;
}
export async function reusable(file: string, line: Line, done?: Done) {
  if (!done || done.identity !== identity(line) || !(done.duration > 0)) return false;
  try { const bytes = await fs.readFile(file); return bytes.length === done.bytes && digest(bytes) === done.sha256; } catch { return false; }
}
async function checkpoint(folder: string, report: Report, shard: number, commit: boolean) {
  report.updated = new Date().toISOString();
  await fs.writeFile(path.join(folder, `manifest-${shard}.json`), JSON.stringify(report, null, 2) + '\n');
  if (!commit) return;
  // The output folder is fixed, not a command or a user-supplied path. No credentials enter these files.
  execFileSync('git', ['add', '-f', '--', folder], { stdio: 'pipe' });
  try { execFileSync('git', ['diff', '--cached', '--quiet']); return; } catch { /* New audio/report. */ }
  execFileSync('git', ['commit', '-qm', `Checkpoint FPT Le Minh shard ${shard}: ${Object.keys(report.done).length}/${report.total} [skip netlify]`], { stdio: 'pipe' });
  execFileSync('git', ['pull', '--no-rebase', 'origin', 'work/fpt-leminh-full-20261025'], { stdio: 'pipe', timeout: 180000 });
  execFileSync('git', ['push', 'origin', 'HEAD:work/fpt-leminh-full-20261025'], { stdio: 'pipe', timeout: 180000 });
}
export async function main() {
  const folder = 'temp/fpt-recordings';
  const shard = Number(process.env.FPT_SHARD || 0), total = Number(process.env.FPT_SHARDS || 4);
  const commit = process.argv.includes('--checkpoint');
  const all: { source: string; lines: Line[] } = JSON.parse(await fs.readFile('docs/fpt-leminh-full-20261025/inventory.json', 'utf8'));
  const lines = selectLines(all.lines, shard, total), inventory = digest(JSON.stringify(all));
  await fs.mkdir(folder, { recursive: true });
  let report: Report = { inventory, voice: VOICE, total: lines.length, done: {}, failed: {}, status: 'running', updated: '' };
  try {
    const old: Report = JSON.parse(await fs.readFile(path.join(folder, `manifest-${shard}.json`), 'utf8'));
    if (old.inventory === inventory) report = { ...old, status: 'running', failed: {} };
  } catch { /* First run. */ }
  if (process.argv.includes('--dry-run')) { console.log(JSON.stringify({ source: all.source, shard, total, lines: lines.length, characters: lines.reduce((n, l) => n + l.text.length, 0), voice: VOICE })); return; }
  const key = process.env.FPT_API_KEY || '';
  if (!key.trim()) throw new FptVoiceTestError('Repository Actions secret FPT_API_KEY is required.');
  duration('docs/voice-review-20261025/leminh-test.mp3'); // Decoder must work before any paid request.
  let made = 0;
  try { for (const line of lines) {
    const file = path.join(folder, `${line.id}.mp3`);
    if (await reusable(file, line, report.done[line.id])) continue;
    let bytes: Uint8Array | undefined;
    let failure = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try { bytes = await recordFpt(line.text, key); break; }
      catch (error) {
        failure = error instanceof FptVoiceTestError ? error.message : 'Recording transport failed.';
        if (/HTTP (401|402|403)/.test(failure)) {
          report.status = 'stopped-access-or-quota'; report.failed[line.id] = failure;
          await checkpoint(folder, report, shard, commit); throw new FptVoiceTestError(failure);
        }
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 15000 * (attempt + 1)));
      }
    }
    if (!bytes) {
      report.failed[line.id] = failure; report.status = 'stopped-provider-error';
      await checkpoint(folder, report, shard, commit); throw new FptVoiceTestError('Provider error persisted; progress saved.');
    }
    await fs.writeFile(file + '.part', bytes);
    await fs.rename(file + '.part', file);
    report.done[line.id] = { identity: identity(line), sha256: digest(bytes), bytes: bytes.length, duration: duration(file) };
    delete report.failed[line.id]; made++;
    if (made % 50 === 0) { console.log(`Shard ${shard}: ${Object.keys(report.done).length}/${lines.length} verified clips`); await checkpoint(folder, report, shard, commit); }
    await new Promise(resolve => setTimeout(resolve, 1500));
  } } catch (error) {
    if (report.status === 'running') report.status = 'stopped-recording-or-decode';
    await checkpoint(folder, report, shard, commit);
    throw error;
  }
  report.status = 'complete'; await checkpoint(folder, report, shard, commit);
  console.log(`Shard ${shard}: complete, ${Object.keys(report.done).length} verified MP3 files.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error instanceof FptVoiceTestError ? error.message : 'Bulk recording stopped; inspect the saved checkpoint and workflow step.'); process.exitCode = 1; });
}

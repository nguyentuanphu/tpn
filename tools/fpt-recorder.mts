import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { collectLines } from './voice-lines.mts';

const RECORD = process.argv.includes('--record');
const OUTPUT_DIR = path.resolve(process.env.FPT_RECORDING_DIR || 'temp/fpt-recordings');
const API_ENDPOINT = 'https://token-api.fpt.ai/v1/audio/speech';
const API_KEY = process.env.FPT_API_KEY || '';
const MAX_LINES = Number.isInteger(Number(process.env.FPT_MAX_LINES)) ? Number(process.env.FPT_MAX_LINES) : 0;
const hash = (text: string) => crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
const isAudio = (bytes: Buffer, contentType: string) => contentType.includes('audio/') || bytes.subarray(0, 3).toString('ascii') === 'ID3' || bytes.subarray(0, 4).toString('ascii') === 'RIFF';

const lines = [...new Map(collectLines().map(line => [line.vi, line])).values()]
  .sort((a, b) => a.vi.localeCompare(b.vi, 'vi'))
  .slice(0, MAX_LINES > 0 ? MAX_LINES : undefined);

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const reportPath = path.join(OUTPUT_DIR, 'manifest.json');
let recorded = 0, skipped = 0, failed = 0;
const failures: Array<{ text: string; status?: number; error: string }> = [];

console.log(`Lê Minh inventory: ${lines.length} unique Vietnamese lines`);
if (!RECORD) {
  for (const line of lines) console.log(`[dry-run] ${hash(line.vi)} ${line.vi}`);
} else {
  if (!API_KEY) throw new Error('FPT_API_KEY environment variable required for recording.');
  for (const line of lines) {
    const filename = path.join(OUTPUT_DIR, `${hash(line.vi)}.mp3`);
    try {
      const existing = await fs.stat(filename);
      if (existing.size > 0) { skipped++; continue; }
    } catch { /* file does not exist */ }
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'FPT.AI-VITs', input: line.vi, voice: 'leminh', speed: 1 })
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !isAudio(bytes, contentType)) {
        failed++; failures.push({ text: line.vi, status: response.status, error: !response.ok ? `HTTP ${response.status}` : 'response was not audio' });
        continue;
      }
      await fs.writeFile(filename, bytes);
      recorded++;
      console.log(`recorded ${recorded}/${lines.length}: ${filename}`);
    } catch (error) {
      failed++; failures.push({ text: line.vi, error: error instanceof Error ? error.message : String(error) });
    }
  }
}
const report = { generatedAt: new Date().toISOString(), voice: 'leminh', totalLines: lines.length, recorded, skipped, failed, dryRun: !RECORD, failures };
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ totalLines: lines.length, recorded, skipped, failed, dryRun: !RECORD }));
if (failed > 0) process.exitCode = 1;

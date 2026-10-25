import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_ENDPOINT = 'https://token-api.fpt.ai/v1/audio/speech';
const API_KEY = process.env.FPT_API_KEY || '';
const OUTPUT_DIR = path.resolve(process.env.FPT_OUTPUT_DIR || 'temp/fpt-samples');
const recording = process.argv.includes('--record') || process.env.FPT_RECORD === 'true';
const samples = [
  { id: 'greeting', text: 'Xin chào! Mình là Lê Minh. Rất vui được chơi cùng bạn.' },
  { id: 'instruction', text: 'Hãy chọn một mức độ khó, rồi chạm vào nút dừng khi thấy biểu tượng đúng nhé.' },
  { id: 'story', text: 'Ngày xửa ngày xưa, trong một thung lũng lấp lánh, các bạn nhỏ cùng nhau tìm những trái cây kỳ diệu.' }
];
const MAX_CHARS = 500;

if (samples.reduce((n, item) => n + item.text.length, 0) > MAX_CHARS) throw new Error('Sample text exceeds the safety character cap.');
await mkdir(OUTPUT_DIR, { recursive: true });
if (!recording) {
  console.log('Dry run only. Samples:', samples.map(item => item.id).join(', '));
  console.log('Use --record only in an approved GitHub Actions run to call FPT Neo.');
  process.exit(0);
}
if (!API_KEY) throw new Error('FPT_API_KEY is required for recording.');
for (const sample of samples) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'FPT.AI-VITs', input: sample.text, voice: 'leminh', speed: 1 })
  });
  if (!response.ok) throw new Error('FPT request failed for ' + sample.id + ': HTTP ' + response.status);
  const type = response.headers.get('content-type') || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || (!type.includes('audio') && bytes.subarray(0, 3).toString() !== 'ID3')) throw new Error('FPT response was not an audio file for ' + sample.id);
  await writeFile(path.join(OUTPUT_DIR, sample.id + '.mp3'), bytes);
  console.log('Recorded sample:', sample.id);
}

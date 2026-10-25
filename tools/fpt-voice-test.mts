// One owner-requested FPT Neo smoke test. Never edits the live voice pack.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const FPT_TEST_REQUEST = {
  model: 'FPT.AI-VITs',
  input: 'Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.',
  voice: 'leminh',
  speed: 1,
  response_format: 'mp3'
};
export const FPT_ENDPOINT = 'https://token-api.fpt.ai/v1/audio/speech';
export class FptVoiceTestError extends Error {}

export async function recordTest(key: string, fetcher: typeof fetch = fetch): Promise<Uint8Array> {
  if (!key?.trim()) throw new FptVoiceTestError('Add the repository Actions secret FPT_API_KEY before running the test.');
  let response: Response;
  try {
    response = await fetcher(FPT_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(FPT_TEST_REQUEST),
      redirect: 'error',
      signal: AbortSignal.timeout(60000)
    });
  } catch {
    // Never include provider/transport errors: they can contain request credentials.
    throw new FptVoiceTestError('FPT Neo request failed: network, redirect or timeout. No automatic retry was made.');
  }
  if (!response.ok) throw new FptVoiceTestError(`FPT Neo returned HTTP ${response.status}. Check key access and account quota. No retry was made.`);
  let bytes = new Uint8Array(await response.arrayBuffer());
  let formatNote = response.headers.get('content-type') || 'unspecified content type';
  // Neo can return the same signed storage link shown in Voice Studio rather than audio bytes.
  // Only the owner's observed FPT storage host is accepted; never forward the API key to it.
  try {
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const urls = new Set<string>();
    const visit = (value: unknown, depth = 0) => {
      if (depth > 6) return;
      if (typeof value === 'string') {
        try {
          const url = new URL(value);
          if (url.protocol === 'https:' && url.hostname === 's3-han02.fptcloud.com' && !url.port && !url.username && !url.password) urls.add(value);
        } catch { /* Not a URL. */ }
      } else if (value && typeof value === 'object') {
        for (const child of Object.values(value)) visit(child, depth + 1);
      }
    };
    visit(payload);
    if (payload && typeof payload === 'object') formatNote += '; JSON fields: ' + Object.keys(payload).slice(0, 12).join(', ');
    if (urls.size === 1) {
      let audio: Response;
      try {
        audio = await fetcher([...urls][0], { redirect: 'error', signal: AbortSignal.timeout(60000) });
      } catch { throw new FptVoiceTestError('FPT returned a storage link, but the MP3 download failed. No retry was made.'); }
      if (!audio.ok) throw new FptVoiceTestError(`FPT storage returned HTTP ${audio.status}. No retry was made.`);
      bytes = new Uint8Array(await audio.arrayBuffer());
      formatNote = audio.headers.get('content-type') || 'unspecified storage content type';
    }
  } catch (error) {
    if (error instanceof FptVoiceTestError) throw error;
    // Binary audio is expected and is not JSON.
  }
  const mp3 = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (!mp3 || bytes.length < 512 || bytes.length > 10 * 1024 * 1024) {
    const safeNote = formatNote.replaceAll(key, '[redacted]');
    throw new FptVoiceTestError(`FPT Neo did not return the expected MP3 (${safeNote}). No audio was saved.`);
  }
  return bytes;
}

export async function main() {
  const bytes = await recordTest(process.env.FPT_API_KEY || '');
  const folder = path.resolve('docs/voice-review-20261025');
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, 'leminh-test.mp3'), bytes);
  const result = {
    provider: 'FPT Neo', endpoint: FPT_ENDPOINT, ...FPT_TEST_REQUEST,
    made: new Date().toISOString(), bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    audio: 'leminh-test.mp3', apiCalls: 1
  };
  await fs.writeFile(path.join(folder, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`FPT Neo accepted the Lê Minh request; saved ${bytes.length} MP3 bytes. One API call, no full-pack generation.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    process.exitCode = 1;
    console.error(error instanceof FptVoiceTestError ? error.message : 'FPT voice test failed while receiving or saving audio.');
  });
}

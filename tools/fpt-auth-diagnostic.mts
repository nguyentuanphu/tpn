// One owner-authorized diagnostic clip. Never logs credentials or a raw provider response.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { recordFpt, FPT_ENDPOINT } from './fpt-voice-test.mts';

export function safeFptError(status: number, payload: unknown, key: string) {
  const clean = (value: unknown) => typeof value === 'string' ? value.replaceAll(key, '[redacted]').replace(/\b(?:sk[-_]|gh[pousr]_)[^\s"'<>]+/g, '[redacted]').replace(/https?:\/\/\S+/g, '[URL withheld]').replace(/\b[A-Za-z0-9+/_=-]{48,}\b/g, '[opaque value withheld]').replace(/[\r\n\t]/g, ' ').slice(0, 240) : undefined;
  let reason: string | undefined, code: string | number | undefined;
  if (payload && typeof payload === 'object') {
    if ('message' in payload) reason = clean(payload.message);
    if (!reason && 'detail' in payload) reason = clean(payload.detail);
    if ('code' in payload && (typeof payload.code === 'string' || typeof payload.code === 'number')) code = typeof payload.code === 'string' ? clean(payload.code) : payload.code;
    if ('error' in payload) {
      if (!reason) reason = clean(payload.error);
      if (payload.error && typeof payload.error === 'object') {
        if (!reason && 'message' in payload.error) reason = clean(payload.error.message);
        if (!code && 'code' in payload.error && (typeof payload.error.code === 'string' || typeof payload.error.code === 'number')) code = typeof payload.error.code === 'string' ? clean(payload.error.code) : payload.error.code;
      }
    }
  }
  return { status, code, reason: reason || 'No safe structured error message was returned.' };
}
export async function main() {
  const key = process.env.FPT_API_KEY || '';
  if (!key.trim()) throw new Error('FPT_API_KEY is not configured for this job.');
  const folder = 'temp/fpt-diagnostic';await fs.mkdir(folder, { recursive: true });
  let failure: ReturnType<typeof safeFptError> | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok && input === FPT_ENDPOINT) failure = safeFptError(response.status, await response.clone().json().catch(() => null), key);
    return response;
  };
  const result: { voice: string; model: string; input: string; success: boolean; bytes?: number; error?: ReturnType<typeof safeFptError>; made: string } = { voice: 'leminh', model: 'FPT.AI-VITs', input: 'Xin chào.', success: false, made: new Date().toISOString() };
  try {
    const audio = await recordFpt(result.input, key, fetcher);await fs.writeFile(path.join(folder, 'clip.mp3'), audio);
    result.success = true;result.bytes = audio.length;
  } catch { result.error = failure || { status: 0, code: undefined, reason: 'Transport or audio format failure; raw response withheld.' }; }
  await fs.writeFile(path.join(folder, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));if (!result.success) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(() => { console.error('Diagnostic stopped; no credentials or raw provider response logged.');process.exitCode = 1; });

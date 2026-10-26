import {createHash} from 'node:crypto';
import {lineHash} from '../js/packhash.js';
import {identity, type Line} from './fpt-recorder.mts';

export const MIXED_FRAGMENT_SOURCE = 'mixed-static-v1';
export type ReviewedMixedFragment = Line & {lang: 'vi'; part: true; source: string[]; mixedFragment: typeof MIXED_FRAGMENT_SOURCE};
const digest = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Only frozen public source entries may extend the ordinary Vietnamese manifest. */
export async function reviewedMixedFragments(value: unknown, sourceHashes: unknown, held: ReadonlySet<string>, readSource: (file: string) => Promise<string | Uint8Array>) {
  const extra = new Map<string, ReviewedMixedFragment>();
  if (value === undefined) return extra; // Existing reviewed inventories remain readable.
  if (!Array.isArray(value) || !object(sourceHashes)) throw Error('Invalid reviewed mixed fragment inventory.');
  const checked = new Set<string>();
  const check = async (file: string) => {
    if (checked.has(file)) return;
    const expected = Object.prototype.hasOwnProperty.call(sourceHashes, file) ? sourceHashes[file] : null;
    if (typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected) || digest(await readSource(file)) !== expected)
      throw Error('Mixed fragment source changed after review: ' + file);
    checked.add(file);
  };
  for (const file of ['tools/mixed-voice-inventory.mts', 'tools/hanoi-pack-policy.mts', 'js/voice-fragments.ts', 'js/viwords.ts', 'js/packhash.ts', 'js/i18n.js']) await check(file);
  for (const line of value) {
    if (!object(line) || line.mixedFragment !== MIXED_FRAGMENT_SOURCE || line.lang !== 'vi' || line.part !== true || typeof line.text !== 'string' || !line.text.trim() || line.text.length > 5000 || /\b(?:Na|Bin|Kiwi)\b|\$\{|\{[^}]*\}|[\u0000-\u0008\u000b-\u001f]/.test(line.text) || typeof line.id !== 'string' || line.id !== lineHash('vi', line.text) || held.has(line.id) || extra.has(line.id) || !Array.isArray(line.source) || !line.source.length)
      throw Error('Unreviewed optional Vietnamese fragment.');
    for (const source of line.source) {
      if (typeof source !== 'string' || !/^js\/(?:[\w-]+\/)*[\w-]+\.(?:js|ts)$/.test(source)) throw Error('Invalid mixed fragment source path.');
      const typed = source.replace(/\.js$/, '.ts');
      await check(Object.prototype.hasOwnProperty.call(sourceHashes, typed) ? typed : source);
    }
    extra.set(line.id, line as unknown as ReviewedMixedFragment);
  }
  return extra;
}

/** The receipt must match both the reviewed text identity and the exact staged bytes. */
export function assertHanoiReceipt(line: Line, receipt: {identity: string; bytes: number; sha256: string; duration: number}, bytes: Uint8Array) {
  if (receipt.identity !== identity(line)) throw Error('Unreviewed text identity: ' + line.id);
  if (bytes.length !== receipt.bytes || digest(bytes) !== receipt.sha256 || !(receipt.duration > 0) || !Number.isFinite(receipt.duration)) throw Error('Unverified recording: ' + line.id);
}

export const missingHanoiUnits = (allowed: ReadonlySet<string>, installed: ReadonlySet<string>, held: ReadonlySet<string>) => [...allowed].filter(id => !installed.has(id) && !held.has(id));

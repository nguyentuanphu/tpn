// (owner, 30 Oct 2026 AEDT: "it loads too long"; chose "Welcome first + remember") numbers worked out from the world at
// start, kept on the device: the same build and the same family map always give the same numbers, so they are worked out
// once, saved in the "sv-world" cache under this build's signature (as js/worldcache.js keeps the map picture) and read
// back at the next start instead of being worked out again. A new build or a new family map works them out again.
// Without the cache (an old browser, private mode) everything is simply worked out, as before.
import { BUILD } from './build.js';
import { CUSTOM } from './custom.js';
import { MAP_VERSION } from './content/map.js';

const CACHE = 'sv-world';
const SIG = (() => { let h = 0; const t = JSON.stringify(CUSTOM || {}); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return BUILD + '_' + MAP_VERSION + '_' + (h >>> 0).toString(36); })();
const urlOf = (name: string) => `./__sv-world/${SIG}/${name}.json`;
const has = () => typeof caches !== 'undefined';

/** the saved numbers for `name` on this build, or null (never saved, another build, no cache) */
export async function recall(name: string): Promise<unknown> {
  if (!has()) return null;
  try { const r = await (await caches.open(CACHE)).match(urlOf(name)); return r ? await r.json() : null; } catch (e) { return null; }
}
/** keeps the numbers for `name` for the next start (in the background; a failure only means working them out again) */
export function remember(name: string, data: unknown): void {
  if (!has()) return;
  let body = ''; try { body = JSON.stringify(data); } catch (e) { return; }
  caches.open(CACHE).then(k => k.put(urlOf(name), new Response(body, { headers: { 'Content-Type': 'application/json' } }))).catch(() => { });
}

// Ground heights are long lists of numbers: kept as raw 32-bit numbers (a few hundred kB) rather than words. Everything
// this build kept is read once at the very start (preload), so the valley's builder can ask for it without waiting.
const loaded = new Map<string, unknown>();
const furl = (name: string) => `./__sv-world/${SIG}/${name}.f32`;
export async function preload(): Promise<void> {
  if (!has()) return;
  try {
    const k = await caches.open(CACHE), mine = (await k.keys()).filter(r => r.url.includes(`/__sv-world/${SIG}/`) && r.url.endsWith('.f32'));
    await Promise.all(mine.map(async r => { const res = await k.match(r); if (!res) return; const name = decodeURIComponent(r.url.slice(r.url.lastIndexOf('/') + 1, -4)); loaded.set(name, new Float32Array(await res.arrayBuffer())); }));
  } catch (e) { /* worked out again */ }
}
/** the kept numbers for `name` if they were read at the start and have `count` entries, else null */
export function keptFloats(name: string, count: number): Float32Array | null {
  const a = loaded.get(name); return a instanceof Float32Array && a.length === count ? a : null;
}
export function rememberFloats(name: string, data: Float32Array): void {
  if (!has()) return;
  const copy = data.slice();
  caches.open(CACHE).then(k => k.put(furl(name), new Response(copy.buffer, { headers: { 'Content-Type': 'application/octet-stream' } }))).catch(() => { });
}

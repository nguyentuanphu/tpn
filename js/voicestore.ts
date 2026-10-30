// The recorded voices kept on the device, as a few big files instead of thousands of small ones (owner, 31 Oct 2026
// AEDT: the installed app stayed white for about 30 s on an iPhone; a store of 14,000 to 21,000 single recordings is
// slow for the phone to open when the app starts). Each store keeps, under its own folder (`dir`):
//   <dir>index.json   which bundle holds each recording, where it starts and how long it is
//   <dir>b<n>.bin     a bundle: recordings back to back, about 3 MB each
// The voice pack 'sv-voices' keeps them under voices/__store/, the Lê Minh voice under voices/fpt-leminh-v1/__store/.
// The page writes them (js/voicepack.ts, js/hanoi-pack.ts); the offline helper (sw.ts) reads a recording by cutting it
// out of its bundle. Recordings kept the old way (one file each) still play, and are moved into bundles a few at a
// time (migrate), each single file deleted only once its bundle is saved. Nothing here touches the children's saves.
export const STORE_DIR = 'voices/__store/';
const LIMIT = 3 * 1048576, SMALL = 512 * 1024, LATER = 4000;
type StoreIndex = { v: 1, next: number, files: Record<string, [number, number, number]> };
type Pending = { key: string, data: ArrayBuffer, legacy: string | null };
type StoreCache = { match(u: string): Promise<Response | undefined>, put(u: string, r: Response): Promise<void>, delete(u: string): Promise<boolean>, keys(): Promise<readonly { url: string }[]> };
type StoreOptions = { open?: (name: string) => Promise<StoreCache>, base?: () => string, dir?: string, notify?: (name: string) => void, later?: number };
// the same name for a recording on the page and in the offline helper: its path from the site's root, with any ?v=
export const storeKey = (u: string, base = location.href) => { const x = new URL(u, base); return x.pathname.replace(/^\//, '') + x.search; };
const stores = new Map<string, VoiceStore>();
// the game's own store of this name (one per page)
export function voiceStore(name: string, dir = STORE_DIR) { let s = stores.get(name); if (!s) { s = createVoiceStore(name, { dir }); stores.set(name, s); } return s; }
export type VoiceStore = ReturnType<typeof createVoiceStore>;

export function createVoiceStore(name: string, { open = n => caches.open(n), base = () => location.href, dir = STORE_DIR, later = LATER,
  notify = n => { try { navigator.serviceWorker?.controller?.postMessage({ type: 'SV_VOICE_STORE', name: n }); } catch (e) { } } }: StoreOptions = {}) {
  let index: StoreIndex | null = null, loading: Promise<StoreIndex> | null = null, pending: Pending[] = [], pendingBytes = 0, legacy: Set<string> | null = null;
  let chain: Promise<unknown> = Promise.resolve(), timer: ReturnType<typeof setTimeout> | 0 = 0;
  const lock = <T>(fn: () => Promise<T>): Promise<T> => { const run = chain.then(fn, fn); chain = run.catch(() => { }); return run; };
  const abs = (u: string) => new URL(u, base()).href, key = (u: string) => storeKey(u, base());
  const INDEX = dir + 'index.json', bundle = (n: number) => dir + 'b' + n + '.bin';
  const load = () => index ? Promise.resolve(index) : loading || (loading = (async () => {
    let j: StoreIndex | null = null; try { const r = await (await open(name)).match(abs(INDEX)); if (r) j = await r.json(); } catch (e) { }
    index = j && j.v === 1 && j.files ? j : { v: 1, next: 0, files: {} }; return index;
  })().finally(() => { loading = null; }));
  // the single recordings still kept the old way (listed once; kept up to date as they move)
  const legacyKeys = async () => { if (!legacy) { legacy = new Set(); try { for (const r of await (await open(name)).keys()) if (/\.mp3(\?|$)/.test(r.url) && !r.url.includes('/__store/')) legacy.add(key(r.url)); } catch (e) { } } return legacy; };
  const writeIndex = async (c: StoreCache, ix: StoreIndex) => { await c.put(abs(INDEX), new Response(JSON.stringify(ix), { headers: { 'Content-Type': 'application/json' } })); notify(name); };
  const flushNow = async () => {
    if (timer) { clearTimeout(timer); timer = 0; }
    if (!pending.length) return;
    const ix = await load(), c = await open(name), batch = pending, n = ix.next; pending = []; pendingBytes = 0;
    let at = 0; const map: [string, number, number][] = []; for (const p of batch) { map.push([p.key, at, p.data.byteLength]); at += p.data.byteLength; }
    try { await c.put(abs(bundle(n)), new Response(new Blob(batch.map(p => p.data)), { headers: { 'Content-Type': 'application/octet-stream' } })); }
    catch (e) { pending = batch.concat(pending); pendingBytes = pending.reduce((a, p) => a + p.data.byteLength, 0); throw e; } // (a full device: nothing is lost or reported saved)
    ix.next = n + 1; for (const [k, o, l] of map) ix.files[k] = [n, o, l];
    await writeIndex(c, ix);
    // the single files these came from, now safely in the bundle
    for (const p of batch) if (p.legacy) { try { await c.delete(abs(p.legacy)); } catch (e) { } legacy?.delete(p.key); }
  };
  // bundles no recording points at any more (lines replaced, or merged into a bigger bundle) are deleted
  const tidy = async () => { const ix = await load(), used = new Set(Object.values(ix.files).map(f => f[0])), c = await open(name), re = /\/__store\/b(\d+)\.bin$/;
    for (const r of await c.keys()) { const m = re.exec(r.url); if (m && r.url.includes('/' + dir) && !used.has(+m[1])) await c.delete(r.url); } };
  // small bundles (a few lines played at a time) are merged into big ones once there are more than a few
  const compact = async () => { const ix = await load(), size = new Map<number, number>(); for (const f of Object.values(ix.files)) size.set(f[0], (size.get(f[0]) || 0) + f[2]);
    const small = [...size].filter(([, b]) => b < SMALL).map(([n]) => n); if (small.length < 8) return;
    const c = await open(name);
    for (const n of small) { const r = await c.match(abs(bundle(n))); if (!r) continue; const blob = await r.blob();
      for (const [k, f] of Object.entries(ix.files)) if (f[0] === n) { pending.push({ key: k, data: await blob.slice(f[1], f[1] + f[2]).arrayBuffer(), legacy: null }); pendingBytes += f[2]; }
      if (pendingBytes >= LIMIT) await flushNow(); }
    await flushNow(); await tidy(); };
  const store = {
    load,
    // whether a recording is kept (in a bundle, waiting to be written, or still the old way)
    async has(u: string) { const k = key(u), ix = await load(); return !!ix.files[k] || pending.some(p => p.key === k) || (await legacyKeys()).has(k); },
    // every recording kept, by name (storeKey)
    async keys() { const ix = await load(), out = new Set(Object.keys(ix.files)); for (const p of pending) out.add(p.key); for (const k of await legacyKeys()) out.add(k); return out; },
    async count() { return (await store.keys()).size; },
    // a recording as a response, or null when it is not kept
    async get(u: string): Promise<Response | null> {
      const k = key(u), wait = pending.find(p => p.key === k); if (wait) return new Response(wait.data.slice(0), { headers: { 'Content-Type': 'audio/mpeg' } });
      const ix = await load(), f = ix.files[k], c = await open(name);
      if (f) { const b = await c.match(abs(bundle(f[0]))); if (b) return new Response((await b.blob()).slice(f[1], f[1] + f[2], 'audio/mpeg'), { headers: { 'Content-Type': 'audio/mpeg' } }); }
      return (await c.match(abs(u))) || null;
    },
    // keep a recording: written with the next bundle, when 3 MB are waiting or a few seconds after the last one
    add(u: string, data: ArrayBuffer) { return lock(async () => { pending = pending.filter(p => p.key !== key(u)); pending.push({ key: key(u), data, legacy: null }); pendingBytes += data.byteLength;
      if (pendingBytes >= LIMIT) await flushNow(); else if (!timer && later > 0) timer = setTimeout(() => { timer = 0; store.flush().catch(() => { }); }, later); }); },
    flush() { return lock(flushNow); },
    // forget a recording (a newer one replaces it)
    forget(u: string) { return lock(async () => { const ix = await load(), k = key(u), c = await open(name); pending = pending.filter(p => p.key !== k);
      if (ix.files[k]) { delete ix.files[k]; await writeIndex(c, ix); }
      try { await c.delete(abs(u)); } catch (e) { } legacy?.delete(k); }); },
    // move the recordings kept the old way into bundles, a few at a time with rests (it runs in the background)
    async migrate(rest = (ms: number) => new Promise<void>(r => setTimeout(r, ms))) {
      const keys = [...await legacyKeys()]; let moved = 0;
      for (let i = 0; i < keys.length; i += 40) {
        await lock(async () => { const c = await open(name);
          for (const k of keys.slice(i, i + 40)) { const r = await c.match(abs(k)); if (!r) { legacy?.delete(k); continue; } const data = await r.arrayBuffer(); pending.push({ key: k, data, legacy: k }); pendingBytes += data.byteLength; moved++; }
          if (pendingBytes >= LIMIT || i + 40 >= keys.length) await flushNow(); });
        await rest(60);
      }
      await lock(compact); await lock(tidy); return moved;
    },
    tidy() { return lock(tidy); }
  };
  return store;
}

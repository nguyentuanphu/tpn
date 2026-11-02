import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
for (const language of ['en', null]) test(`voice cache serves saved ${language || 'legacy'} list immediately and isolates refresh messages`, async () => {
  const url = `https://valley.test/voices/manifest${language ? '-' + language : ''}.json`;
  const old = { ...(language ? { language } : {}), lines: { old: 'fm' } };
  const fresh = { ...old, lines: { old: 'fm', newer: 'f' } };
  const handlers = {}, messages = [], waits = [], cache = new Map([[url, new Response(JSON.stringify(old))]]);
  const context = vm.createContext({
    self: { addEventListener: (k, f) => { handlers[k] = f; }, clients: { matchAll: async () => [{ postMessage: m => messages.push(m) }] } },
    location: { origin: 'https://valley.test' }, URL, Response, Request,
    caches: { open: async () => ({ match: async req => cache.get(req.url)?.clone(), put: async (req, res) => cache.set(req.url, res) }) },
    fetch: async () => new Response(JSON.stringify(fresh)), setTimeout, clearTimeout
  });
  vm.runInContext(code, context);
  let response;
  handlers.fetch({ request: new Request(url), respondWith: p => { response = p; }, waitUntil: p => waits.push(p) });
  assert.deepEqual(await (await response).json(), old);
  await Promise.all(waits);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, language ? 'SV_VOICE_LANGUAGE_MANIFEST' : 'SV_VOICE_MANIFEST');
  assert.deepEqual(JSON.parse(JSON.stringify(messages[0].manifest)), fresh);
  assert.deepEqual(await cache.get(url).json(), fresh);
});

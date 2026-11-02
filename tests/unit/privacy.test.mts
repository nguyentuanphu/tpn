// Privacy (round R privacy, 9 Oct): two-step sign-in (TOTP), 12-character passwords, lockout after 10 wrong tries,
// the access log, Sign everyone out, the exe's key, family photos behind the family code, the hello rate limit and
// the missing-lines caps, /api/live without the admin's name. Everything on in-memory stores, no browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import * as admins from '../../netlify/lib/admins.mts';
import * as family from '../../netlify/lib/family.mts';
import { makeStudio } from '../../netlify/functions/studio.mts';
import { makeFamily } from '../../netlify/functions/family.mts';
import { makeHello, HELLO_LIMIT } from '../../netlify/functions/hello.mts';
import { makeLive } from '../../netlify/functions/live.mts';
import { inbox, LINES } from '../../netlify/lib/players.mts';

const mem = () => { const m = new Map(); return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, set: async (k, v) => { m.set(k, String(v)); }, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }), _m: m }; };
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('photo')]);

test('TOTP matches RFC 6238 (SHA-1) and takes one step either side', () => {
  const sec = admins.b32(Buffer.from('12345678901234567890'));
  assert.equal(sec, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.equal(admins.unb32(sec).toString(), '12345678901234567890');
  assert.equal(admins.totpAt(sec, Math.floor(59 / 30)), '287082'); // RFC 6238 59 s → 94287082 (last 6 digits)
  assert.equal(admins.totpAt(sec, Math.floor(1111111109 / 30)), '081804');
  const now = 1_700_000_000_000, code = admins.totpNow(sec, now);
  assert.ok(admins.totpStep(sec, code, now + 30e3) >= 0 && admins.totpStep(sec, code, now - 30e3) >= 0);
  assert.equal(admins.totpStep(sec, code, now + 95e3), -1);
  assert.equal(admins.totpStep(sec, 'abcdef', now), -1);
});

test('Studio sign-in: the owner by password, admins in two steps, short passwords, lockout, log, sign everyone out, exe key, family photos', async () => {
  process.env.STUDIO_PASSWORD = 'short-pw'; process.env.GITHUB_TOKEN = '';
  let clock = 1_800_000_000_000;
  const A = mem(), G = mem(), L = mem(), F = mem(), P = mem();
  const studio = makeStudio({ playersStore: async () => P, adminStore: async () => A, guardStore: async () => G, logStore: async () => L, familyStore: async () => F, heldStore: async () => mem(), liveStore: async () => mem(), now: () => clock });
  const ctx = { geo: { city: 'Brisbane', country: { code: 'AU' } }, ip: '203.0.113.9' };
  const call = async (p, { body, cookie, headers = {} } = {}) => { const r = await studio(new Request('https://x' + p, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined }), ctx); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { } return { status: r.status, j, cookie: (r.headers.get('set-cookie') || '').split(';')[0] }; };
  // a short STUDIO_PASSWORD is refused, with the reason
  let r = await call('/studio/api/login', { body: { password: 'short-pw' } }); assert.equal(r.status, 503); assert.match(r.j.error, /12 characters/);
  const PW = process.env.STUDIO_PASSWORD = 'a-long-owner-password-1';
  // (owner, 11 Oct) the owner signs in with the password only; two-step is for admins
  r = await call('/studio/api/login', { body: { password: PW } }); assert.equal(r.status, 200); const C = r.cookie; assert.match(C, /^sv_studio=/);
  assert.equal((await call('/studio/api/whoami', { cookie: C })).j.role, 'owner');
  assert.equal((await call('/studio/api/login', { body: { password: 'not-the-owner-password' } })).status, 401);
  // admins: 12+ characters
  const X = { 'X-Studio': '1' };
  assert.equal((await call('/studio/api/admins/save', { body: { name: 'ba.nam', password: 'eleven-char', role: 'viewer' }, cookie: C, headers: X })).status, 400);
  assert.equal((await call('/studio/api/admins/save', { body: { name: 'ba.nam', password: 'twelve-chars', role: 'viewer' }, cookie: C, headers: X })).status, 200);
  // an admin's first sign-in: the secret to set up, finished with its first code
  r = await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars' } }); assert.equal(r.j.step, 'setup'); assert.match(r.j.otpauth, /^otpauth:\/\/totp\//);
  const sec = r.j.secret;
  r = await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars', code: '000000' === admins.totpNow(sec, clock) ? '111111' : '000000' } }); assert.equal(r.status, 401);
  r = await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars', code: admins.totpNow(sec, clock) } }); assert.equal(r.status, 200); const V = r.cookie;
  // the same code is never taken twice; without a code the password alone is not enough
  assert.equal((await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars', code: admins.totpNow(sec, clock) } })).status, 401);
  r = await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars' } }); assert.equal(r.status, 401); assert.equal(r.j.step, 'code');
  clock += 30e3; assert.equal((await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars', code: admins.totpNow(sec, clock) } })).status, 200);
  assert.equal((await call('/studio/api/players', { cookie: V })).status, 200);
  assert.equal((await call('/studio/api/log', { cookie: V })).status, 403);
  // lockout: ten wrong passwords lock the account (and the connection) for 15 minutes, even with the right password
  for (let i = 0; i < 10; i++) await call('/studio/api/login', { body: { name: 'ba.nam', password: 'wrong-wrong-wrong' } });
  r = await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars' } }); assert.equal(r.status, 429);
  clock += 16 * 60e3; r = await call('/studio/api/login', { body: { name: 'ba.nam', password: 'twelve-chars' } }); assert.equal(r.j.step, 'code');
  assert.ok(![...G._m.keys(), ...G._m.values()].some(v => v.includes('203.0.113.9')), 'an address was kept');
  // the access log: sign-ins, the analytics, the town and country, never the address
  const log = (await call('/studio/api/log', { cookie: C })).j.entries;
  assert.ok(log.some(e => e.what === 'signin' && e.who === 'owner' && e.where === 'Brisbane, AU'));
  assert.ok(log.some(e => e.what === 'analytics' && e.who === 'ba.nam') && log.some(e => e.what === 'locked'));
  assert.ok(!JSON.stringify([...L._m.values()]).includes('203.0.113'));
  // the exe's key: the players report and the family photos only
  const key = (await call('/studio/api/keys/make', { body: { label: 'Family PC' }, cookie: C, headers: X })).j.key; assert.match(key, /^svk\./);
  const K = { 'X-Studio-Key': key };
  assert.equal((await call('/studio/api/players', { headers: K })).status, 200);
  assert.equal((await call('/studio/api/admins/list', { headers: K })).status, 403);
  assert.equal((await call('/studio/api/players', { headers: { 'X-Studio-Key': key.slice(0, -2) + 'xx' } })).status, 401);
  assert.equal((await call('/studio/api/players', { headers: { 'X-Studio-Password': PW } })).status, 401, 'the password alone still opened the report');
  // family photos: uploaded by the exe, served only with the family code
  const name = family.newName(); assert.ok(family.NAME.test(name) && name.length >= 24);
  assert.equal((await call('/studio/api/family/upload', { body: { name, data: Buffer.from('not a jpeg').toString('base64') }, headers: { ...K, ...X } })).status, 400);
  assert.equal((await call('/studio/api/family/upload', { body: { name, data: JPEG.toString('base64') }, headers: { ...K, ...X } })).status, 200);
  const code = (await call('/studio/api/family/code', { cookie: C })).j.code; assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  const fam = makeFamily({ familyStore: async () => F, guardStore: async () => G, now: () => clock });
  const get = (n, c, ip = '198.51.100.7') => fam(new Request('https://x/api/family/' + n, { headers: c ? { 'x-family-code': c } : {} }), { ip });
  assert.equal((await get(name)).status, 401);
  assert.equal((await get(name, 'WRONG-CODE-1234')).status, 401);
  const ok = await get(name, code.toLowerCase()); assert.equal(ok.status, 200); assert.match(ok.headers.get('cache-control'), /private/); assert.deepEqual(Buffer.from(await ok.arrayBuffer()), JPEG);
  assert.equal((await get('x'.repeat(24), code)).status, 404);
  for (let i = 0; i < 10; i++) await get(name, 'NOPE-NOPE-NOPE', '198.51.100.8');
  assert.equal((await get(name, code, '198.51.100.8')).status, 429, 'ten wrong codes did not lock the connection');
  const newer = (await call('/studio/api/family/code/new', { body: {}, cookie: C, headers: X })).j.code; assert.notEqual(newer, code);
  assert.equal((await get(name, code)).status, 401); assert.equal((await get(name, newer)).status, 200);
  // Sign everyone out: every cookie and key so far stops working
  assert.equal((await call('/studio/api/security/signout-all', { body: {}, cookie: C, headers: X })).status, 200);
  assert.equal((await call('/studio/api/whoami', { cookie: C })).status, 401);
  assert.equal((await call('/studio/api/whoami', { cookie: V })).status, 401);
  assert.equal((await call('/studio/api/players', { headers: K })).status, 401);
});

test('hello: rate limit per connection, missing-line caps; /api/live without the admin', async () => {
  const P = mem(), G = mem(), hello = makeHello({ playersStore: async () => P, guardStore: async () => G });
  const send = (b, ip = '192.0.2.1') => hello(new Request('https://x/api/hello', { method: 'POST', body: JSON.stringify(b) }), { ip }).then(r => r.status);
  const lines = n => Array.from({ length: n }, (_, i) => ['en', `Line ${Math.random().toString(36).slice(2)} ${i}`]);
  assert.equal(await send({ id: 'aaaaaaaaaaaa', m: 1, v: lines(25) }), 204);
  assert.equal((await inbox(P)).length, LINES.hello, 'more lines than a hello may bring were kept');
  for (let i = 0; i < 4; i++) await send({ id: 'aaaaaaaaaaaa', m: 1, v: lines(10) });
  assert.equal((await inbox(P)).length, LINES.device, 'one device brought more than its lines a day');
  for (let i = 0; i < 8; i++) await send({ id: 'bbbbbbbbbb' + String(i).padStart(2, '0'), m: 1, v: lines(10) });
  assert.equal((await inbox(P)).length, LINES.ip, 'one connection brought more than its lines a day');
  let last = 0; for (let i = 0; i < HELLO_LIMIT; i++) last = await send({ id: 'cccccccccccc', m: 1 }, '192.0.2.2');
  assert.equal(last, 204); assert.equal(await send({ id: 'cccccccccccc', m: 1 }, '192.0.2.2'), 429);
  const live = { get: async () => ({ releases: { a: { on: true } }, festivals: {}, at: '2026-10-09T00:00:00Z', by: 'ba.nam' }) };
  const j = await (await makeLive({ liveStore: async () => live })(new Request('https://x/api/live'))).json();
  assert.equal(j.by, undefined); assert.deepEqual(j.releases, { a: { on: true } });
});

test('hello: the device gets back the name it was given in Studio, and only its own', async () => {
  const P = mem(), G = mem(), hello = makeHello({ playersStore: async () => P, guardStore: async () => G });
  await P.set('label/dddddddddddd', 'Bà’s phone'); await P.set('label/eeeeeeeeeeee', 'Other');
  const send = b => hello(new Request('https://x/api/hello', { method: 'POST', body: JSON.stringify(b) }), { ip: '192.0.2.9' });
  const named = await send({ id: 'dddddddddddd', m: 1 });
  assert.equal(named.status, 204); assert.equal(decodeURIComponent(named.headers.get('X-SV-Device-Name')), 'Bà’s phone');
  assert.equal((await send({ id: 'ffffffffffff', m: 1 })).headers.get('X-SV-Device-Name'), null);
});

test('the service worker never keeps family photos', () => {
  const sw = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
  const fetchAt = sw.indexOf("addEventListener('fetch'"), bypass = sw.indexOf("url.pathname.includes('/api/')) return;");
  assert.ok(bypass > fetchAt && bypass < sw.indexOf('caches.open', fetchAt), 'api/ is not passed straight to the network first');
  assert.match(sw, /k !== 'sv-family'/);
});

test('Studio engine: photos go to the family store, the move to private storage, a photo taken off is deleted', async () => {
  const os = await import('os'), path = await import('path'), { createRequire } = await import('module');
  const core = createRequire(import.meta.url)('../../studio/core.cts');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-priv-')); fs.mkdirSync(path.join(dir, 'js')); fs.writeFileSync(path.join(dir, 'index.html'), ''); fs.writeFileSync(path.join(dir, 'js/main.js'), '');
  fs.mkdirSync(path.join(dir, 'content/faces'), { recursive: true }); fs.mkdirSync(path.join(dir, 'content/album'));
  fs.writeFileSync(path.join(dir, 'content/faces/ba-nam.jpg'), JPEG); fs.writeFileSync(path.join(dir, 'content/album/f1.jpg'), JPEG);
  fs.writeFileSync(path.join(dir, 'content/custom.json'), JSON.stringify({ faces: { 'Bà Năm': { photo: 'content/faces/ba-nam.jpg' } }, album: [{ id: 'f1', photo: 'content/album/f1.jpg', place: 'home' }] }));
  const kept = new Map(), fam = { where: 'site', put: async (n, b) => { kept.set(n, b); }, get: async n => kept.get(n) || null, remove: async n => { kept.delete(n); }, code: async () => ({ code: 'X' }), newCode: async () => ({ code: 'Y' }) };
  const S = core.createStudio({ store: core.folderStore(dir), conf: {}, family: fam });
  const post = (api, b) => S.handle(api, 'POST', Buffer.from(JSON.stringify(b)));
  let r = await post('face', { id: 'Ông Cú', dataUrl: 'data:image/jpeg;base64,' + JPEG.toString('base64') });
  assert.match(r.body.photo, /^family:[\w-]{24,}$/); assert.ok(!fs.existsSync(path.join(dir, 'content/faces/ong-cu.jpg')));
  assert.equal((await post('albumphoto', { id: 'x', dataUrl: 'data:image/jpeg;base64,' + Buffer.from('nope').toString('base64') })).code, 400);
  const chk = (await S.handle('check', 'GET')).body; assert.ok(chk.some(x => !x.ok && /still public/.test(x.en)));
  r = await post('family/migrate', {}); assert.equal(r.body.moved, 2); assert.equal(r.body.removed, 2);
  const c = JSON.parse(fs.readFileSync(path.join(dir, 'content/custom.json'), 'utf8'));
  assert.match(c.faces['Bà Năm'].photo, /^family:/); assert.match(c.album[0].photo, /^family:/);
  assert.ok(!fs.readdirSync(path.join(dir, 'content/faces')).length && !fs.readdirSync(path.join(dir, 'content/album')).length);
  assert.equal(kept.size, 3);
  const n = c.album[0].photo.slice(7); c.album = []; await post('content', c);
  assert.ok(!kept.has(n) && kept.size === 2, 'a postcard taken off kept its photo');
  assert.equal((await S.handle('familyphoto/' + c.faces['Bà Năm'].photo.slice(7), 'GET')).code, 200);
  fs.rmSync(dir, { recursive: true, force: true });
});

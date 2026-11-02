// Push notifications for grown-ups (v1.08 notifications): the rules (js/content/notify.js) and the server
// (netlify/lib/push.mts, netlify/lib/webpush.mts, netlify/functions/push.mts) without a browser, with a fake push
// service. The browser check `pushnotify` (tests/run.mts) does Grown-ups, the service worker and the taps.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { KINDS, cleanPrefs, isQuiet, plan, messagesIn, localOf, compose, payloadOf, vnFestivals, auEvents, wordOfWeek, TEXTS, openURL, studioSwitch } from '../../js/content/notify.js';
import { RELEASES } from '../../js/content/releases.js';
import { encrypt, decrypt, vapidFromEnv, vapidHeader, goodEndpoint } from '../../netlify/lib/webpush.mts';
import * as push from '../../netlify/lib/push.mts';
import { makePush } from '../../netlify/functions/push.mts';

const SYD = 'Australia/Sydney';
const at = (iso: string) => Date.parse(iso);   // e.g. '2026-11-07T09:30:00+11:00'
export const memStore = () => { const m = new Map<string, string>(); return { m,
  get: async (k: string, o?: { type: 'json' }) => { const v = m.get(k); return v == null ? null : o && o.type === 'json' ? JSON.parse(v) : v; },
  set: async (k: string, v: string) => { m.set(k, String(v)); }, setJSON: async (k: string, v: unknown) => { m.set(k, JSON.stringify(v)); }, delete: async (k: string) => { m.delete(k); },
  list: async ({ prefix }: { prefix: string }) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }) }; };
const deviceKeys = () => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); const auth = crypto.randomBytes(16); return { e, auth, keys: { p256dh: e.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } }; };
const vapidKeys = () => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); return vapidFromEnv(k => ({ VAPID_PUBLIC_KEY: e.getPublicKey().toString('base64url'), VAPID_PRIVATE_KEY: e.getPrivateKey().toString('base64url'), VAPID_SUBJECT: 'mailto:test@example.com' })[k] || ''); };

test('the 12 kinds of the owner\'s plan, with its defaults (3, 4, 5, 6 on; 7 to 10 off; 12 only for testers)', () => {
  assert.equal(KINDS.length, 12); assert.deepEqual(KINDS.map(k => k.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const d = cleanPrefs({});
  for (const k of ['festival', 'event', 'new', 'gotw', 'weekly', 'balance', 'invite']) assert.equal(d.kinds[k], true, k);
  for (const k of ['achieve', 'word', 'bedtime', 'life', 'tester']) assert.equal(d.kinds[k], false, k);
  assert.equal(cleanPrefs({ tester: 'abcdefabcdef' }).kinds.tester, true);
  for (const k of KINDS) { assert.ok(k.en && k.vi && k.hintEn && k.hintVi, 'both languages: ' + k.id); assert.ok(RELEASES.some(r => r.id === studioSwitch(k.id) && r.group === 'notify'), 'a Studio switch: ' + k.id); }
  for (const t of Object.values(TEXTS)) assert.ok(t.en && t.vi && t.en !== t.vi);
});

test('the choices are checked again: unknown kinds, bad hours and time zones, more than 2 bedtime days', () => {
  const p = cleanPrefs({ kinds: { nope: true, word: true } as never, quiet: { from: 9999, to: -1, school: 'x' } as never, bedDays: [1, 2, 3, 9], tz: 'Mars/Base', lang: 'xx' as never, tester: 'BAD' });
  assert.equal(p.kinds.word, true); assert.equal((p.kinds as Record<string, boolean>).nope, undefined);
  assert.deepEqual(p.quiet, { from: 1200, to: 480, school: true }); assert.deepEqual(p.bedDays, [1, 2]); assert.equal(p.tz, SYD); assert.equal(p.lang, 'en'); assert.equal(p.tester, undefined);
});

test('quiet hours: 20:00 to 8:00 and school hours on weekdays; a grown-up can change them', () => {
  const q = cleanPrefs({}).quiet;
  assert.equal(isQuiet({ wd: 6, min: 9 * 60 + 30 }, q), false, 'Saturday 9:30');
  assert.equal(isQuiet({ wd: 6, min: 20 * 60 }, q), true, '20:00'); assert.equal(isQuiet({ wd: 0, min: 7 * 60 + 59 }, q), true, '7:59');
  assert.equal(isQuiet({ wd: 2, min: 10 * 60 }, q), true, 'Tuesday 10:00 school'); assert.equal(isQuiet({ wd: 2, min: 15 * 60 }, q), false, 'Tuesday 15:00');
  assert.equal(isQuiet({ wd: 2, min: 10 * 60 }, { ...q, school: false }), false);
  assert.equal(isQuiet({ wd: 6, min: 21 * 60 }, { from: 22 * 60, to: 7 * 60, school: true }), false);
});

test('bundling: with the defaults a family gets 2 messages a week (Saturday 9:30, Sunday 18:00), in its own time zone', () => {
  const p = cleanPrefs({ tz: SYD }), all = messagesIn(p, at('2026-11-02T00:00:00+11:00'), 4);
  assert.equal(all.length, 8, all.map(m => m.key).join(' '));
  for (const m of all) {
    const l = localOf(Date.parse(m.key.slice(4) + 'T12:00:00Z'), 'UTC');
    if (m.slot === 'sat') { assert.equal(l.wd, 6); assert.deepEqual(m.kinds, ['gotw']); } else { assert.equal(m.slot, 'sun'); assert.equal(l.wd, 0); assert.deepEqual(m.kinds, ['weekly', 'balance']); }
  }
  // the Saturday message goes out at 9:30 Saturday in Sydney and in Hà Nội, each family's own clock
  for (const tz of [SYD, 'Asia/Ho_Chi_Minh']) {
    const sent: Record<string, number> = {}, pr = cleanPrefs({ tz }); let first = 0;
    for (let t = at('2026-11-06T00:00:00Z'); t < at('2026-11-08T00:00:00Z') && !first; t += 30 * 60e3) if (plan({ now: t, prefs: pr, sent }).some(m => m.slot === 'sat')) first = t;
    const l = localOf(first, tz); assert.equal(l.wd, 6, tz); assert.equal(l.min, 9 * 60 + 30, tz);
  }
  // with new content from Studio, 3 and 4 still go together
  const news = { en: 'Three new maths games', vi: 'Ba trò toán mới' };
  const sat = plan({ now: at('2026-11-07T09:30:00+11:00'), prefs: p, sent: {}, news });
  assert.equal(sat.length, 1); assert.deepEqual(sat[0].kinds, ['new', 'gotw']);
  // each message once
  const sent = { [sat[0].key]: 1 }; assert.equal(plan({ now: at('2026-11-07T10:00:00+11:00'), prefs: p, sent, news }).length, 0);
});

test('the switches: a grown-up\'s switch, and Studio turning a kind off for everyone', () => {
  const now = at('2026-11-08T18:00:00+11:00');
  assert.deepEqual(plan({ now, prefs: cleanPrefs({ kinds: { balance: false } }), sent: {} })[0].kinds, ['weekly']);
  assert.equal(plan({ now, prefs: cleanPrefs({ kinds: { weekly: false, balance: false } }), sent: {} }).length, 0);
  assert.deepEqual(plan({ now, prefs: cleanPrefs({ kinds: { achieve: true } }), sent: {} })[0].kinds, ['weekly', 'balance', 'achieve']);
  const off = push.studioOffOf({ releases: { push_weekly: { on: false } } }, now);
  assert.deepEqual(plan({ now, prefs: cleanPrefs({}), sent: {}, studioOff: off })[0].kinds, ['balance']);
  const later = push.studioOffOf({ releases: { push_balance: { start: '2026-12-01' } } }, now);
  assert.equal(later('balance'), true); assert.equal(later('weekly'), false);
  // quiet hours: a Sunday 18:00 slot with quiet hours from 17:00 waits, and is dropped that week
  assert.equal(plan({ now, prefs: cleanPrefs({ quiet: { from: 17 * 60, to: 8 * 60, school: true } }), sent: {} }).length, 0);
  // the off kinds as proposed: word (Monday 7:30 waits for 8:00), bedtime on picked days only, life twice a month
  const word = cleanPrefs({ kinds: { word: true } });
  assert.equal(plan({ now: at('2026-11-09T07:30:00+11:00'), prefs: word, sent: {} }).length, 0, 'quiet until 8:00');
  assert.deepEqual(plan({ now: at('2026-11-09T08:00:00+11:00'), prefs: word, sent: {} }).map(m => m.kinds[0]), ['word']);
  const bed = cleanPrefs({ kinds: { bedtime: true }, bedDays: [3] });
  assert.equal(plan({ now: at('2026-11-11T19:00:00+11:00'), prefs: bed, sent: {} })[0].kinds[0], 'bedtime');
  assert.equal(plan({ now: at('2026-11-12T19:00:00+11:00'), prefs: bed, sent: {} }).length, 0);
  const life = cleanPrefs({ kinds: { life: true } }), lifeSats = messagesIn(life, at('2026-11-01T00:00:00+11:00'), 5).filter(m => m.kinds.includes('life') && m.key.includes('2026-11-'));
  assert.equal(lifeSats.length, 2, 'twice in November');
});

test('festivals: the morning before at 9:30; a festival in the coming week leads the Saturday message instead of a third one', () => {
  const tet = vnFestivals(2027).find(f => f.id === 'tet'); assert.equal(tet.date, '2027-02-06');
  assert.ok(auEvents(2027).some(e => e.id === 'mothersday' && e.date === '2027-05-09')); assert.ok(auEvents(2027).some(e => e.id === 'fathersday' && e.date === '2027-09-05'));
  const p = cleanPrefs({}), weeks = messagesIn(p, at('2027-01-25T00:00:00+11:00'), 4);
  const sat = weeks.find(m => m.key === 'sat:2027-01-30'); assert.ok(sat && sat.kinds[0] === 'festival' && /Tết/.test(sat.lead.en) && /Tết/.test(sat.lead.vi), JSON.stringify(sat));
  assert.ok(!weeks.some(m => m.slot === 'fest' && m.key.includes('tet')), 'no extra Tết message');
  // over a whole year: never more than 2 messages a week with the defaults
  const year = messagesIn(p, at('2027-01-04T00:00:00+11:00'), 52), byWeek: Record<number, number> = {};
  for (const m of year) { const d = Date.parse((m.key.split(':').pop()) + 'T00:00:00Z'); const w = Math.floor((d / 864e5 + 3) / 7); byWeek[w] = (byWeek[w] || 0) + 1; }
  assert.ok(Math.max(...Object.values(byWeek)) <= 2, JSON.stringify(byWeek));
  // a family with Saturday's kinds off still hears about the festival the morning before
  const only = cleanPrefs({ kinds: { new: false, gotw: false } }), f = messagesIn(only, at('2027-01-25T00:00:00+11:00'), 3).find(m => m.kinds[0] === 'festival');
  assert.ok(f, 'a festival message');
});

test('what the device shows: the lead, the device\'s own lines, the payload\'s, a fallback; a tap opens the right place', () => {
  const p = cleanPrefs({ kinds: { word: true } });
  const sun = plan({ now: at('2026-11-08T18:00:00+11:00'), prefs: p, sent: {} })[0];
  const local = { weekly: { en: 'This week: 40 minutes', vi: 'Tuần này: 40 phút' } };
  const en = compose(payloadOf(sun, 'en'), local), vi = compose(payloadOf(sun, 'vi'), local);
  assert.equal(en.title, TEXTS.sunTitle.en); assert.match(en.body, /40 minutes/); assert.match(en.body, new RegExp(TEXTS.balance.en.slice(0, 20)));
  assert.equal(vi.title, TEXTS.sunTitle.vi); assert.match(vi.body, /40 phút/);
  assert.equal(en.open, 'weekly');
  const mon = plan({ now: at('2026-11-09T08:00:00+11:00'), prefs: p, sent: {} })[0], w = wordOfWeek('2026-11-09');
  assert.match(compose(payloadOf(mon, 'vi'), null).body, new RegExp(w[1]));
  assert.equal(openURL('gotw', 'https://sparklevalley.au/', 'bunny'), 'https://sparklevalley.au/?open=gotw&game=bunny');
  assert.equal(openURL('nope', 'https://sparklevalley.au/'), 'https://sparklevalley.au/?open=home');
  // no child's name can be in a server text: they are the same for every family
  for (const m of messagesIn(cleanPrefs({ kinds: { word: true, bedtime: true, life: true, achieve: true } }), at('2027-01-01T00:00:00+11:00'), 8)) assert.ok(JSON.stringify(payloadOf(m, 'en')).length < 3000);
});

test('Web Push encryption is RFC 8291 (its own test vector), VAPID is a valid ES256 token, endpoints are checked', () => {
  const as = crypto.createECDH('prime256v1'); as.setPrivateKey(Buffer.from('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', 'base64url'));
  const out = encrypt({ endpoint: 'x', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } },
    'When I grow up, I want to be a watermelon', { salt: Buffer.from('DGv6ra1nlYgDCS1FRnbzlw', 'base64url'), ecdh: as });
  assert.equal(out.toString('base64url'), 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
  const d = deviceKeys(); assert.equal(decrypt(encrypt({ endpoint: 'x', keys: d.keys }, 'Tết vui vẻ'), d.e, d.auth), 'Tết vui vẻ');
  const v = vapidKeys(); assert.ok(v);
  const [jwt, k] = vapidHeader(v, 'https://fcm.googleapis.com/fcm/send/abc', 1_800_000_000).slice(8).split(', k='); assert.equal(k, v.publicKey);
  const [h, b, s] = jwt.split('.'), pub = Buffer.from(v.publicKey, 'base64url');
  const key = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') } });
  assert.ok(crypto.verify('sha256', Buffer.from(h + '.' + b), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')));
  assert.deepEqual(JSON.parse(Buffer.from(b, 'base64url').toString()), { aud: 'https://fcm.googleapis.com', exp: 1_800_000_000 + 43200, sub: 'mailto:test@example.com' });
  assert.equal(vapidFromEnv(() => ''), null, 'no keys: off'); assert.equal(vapidFromEnv(k2 => k2 === 'VAPID_PUBLIC_KEY' ? 'abc' : 'def'), null);
  assert.ok(goodEndpoint('https://fcm.googleapis.com/fcm/send/x')); assert.ok(goodEndpoint('https://web.push.apple.com/abc'));
  assert.ok(!goodEndpoint('https://evil.example/x')); assert.ok(!goodEndpoint('http://fcm.googleapis.com/x')); assert.ok(goodEndpoint('http://127.0.0.1:9/x', '127.0.0.1:9'));
});

test('the server with a fake push service: subscribe, the weekly run, quiet hours, gone devices, opened counts, invites, keys missing', async () => {
  const S = memStore(), v = vapidKeys(), dev = deviceKeys(), got: { url: string, body: string, headers: Record<string, string> }[] = [];
  let status = 201;
  const fetchFn = (async (url: string, o: { body: Uint8Array, headers: Record<string, string> }) => { got.push({ url, headers: o.headers, body: decrypt(Buffer.from(o.body), dev.e, dev.auth) }); return new Response(null, { status }); }) as unknown as typeof fetch;
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/dev1', keys: dev.keys };
  // nothing is kept about a child: only the address, the kinds, quiet hours, bedtime days, time zone and language
  const r = await push.subscribe(S, { sub, prefs: { lang: 'vi', tz: SYD, name: 'Bé An', kinds: { word: true } } as never }, at('2026-11-05T12:00:00+11:00'));
  assert.ok(r.ok); const rec = JSON.parse(S.m.get('s/' + r.id));
  assert.deepEqual(Object.keys(rec).sort(), ['at', 'endpoint', 'keys', 'prefs', 'seen', 'sent']); assert.deepEqual(Object.keys(rec.prefs).sort(), ['bedDays', 'kinds', 'lang', 'quiet', 'tz']);
  assert.ok(!S.m.get('s/' + r.id).includes('Bé An'));
  assert.equal((await push.subscribe(S, { sub: { endpoint: 'https://evil.example/x', keys: dev.keys } }, 0)).ok, false);
  // keys missing: nothing sent
  assert.deepEqual(await push.run(S, { vapid: null, now: at('2026-11-07T09:30:00+11:00'), fetchFn }), { devices: 0, sent: 0, gone: 0, failed: 0, off: true });
  // in quiet hours nothing; at 9:30 Saturday the Saturday message, in Vietnamese, encrypted, with VAPID; then not again
  assert.equal((await push.run(S, { vapid: v, now: at('2026-11-07T07:30:00+11:00'), fetchFn })).sent, 0);
  assert.equal((await push.run(S, { vapid: v, now: at('2026-11-07T09:30:00+11:00'), fetchFn })).sent, 1);
  const p1 = JSON.parse(got[0].body); assert.equal(p1.title, TEXTS.satTitle.vi); assert.deepEqual(p1.kinds, ['gotw']); assert.equal(p1.lang, 'vi');
  assert.match(got[0].headers.Authorization, /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/); assert.equal(got[0].headers['Content-Encoding'], 'aes128gcm');
  assert.equal((await push.run(S, { vapid: v, now: at('2026-11-07T10:00:00+11:00'), fetchFn })).sent, 0);
  // Studio's text for new content
  await push.saveConfig(S, { news: { en: 'Three new maths games', vi: 'Ba trò toán mới' } }, at('2026-11-09T10:00:00+11:00'));
  await push.run(S, { vapid: v, now: at('2026-11-14T09:30:00+11:00'), fetchFn });
  assert.equal(JSON.parse(got.at(-1).body).parts.new, 'Ba trò toán mới');
  // opened counts and Studio's view
  assert.ok(await push.opened(S, 'gotw', at('2026-11-14T10:00:00+11:00'))); assert.ok(!await push.opened(S, 'evil', 0));
  const st = await push.stats(S, at('2026-11-14T12:00:00+11:00')); assert.equal(st.devices, 1); assert.equal(st.weeks[0].opened.gotw, 1); assert.ok(st.weeks[0].sent.gotw >= 1);
  // an invite: held in quiet hours, sent otherwise, at most every 10 minutes
  assert.deepEqual(await push.invite(S, r.id, { vapid: v, now: at('2026-11-14T22:00:00+11:00'), fetchFn }), { ok: true, held: true });
  assert.equal((await push.invite(S, r.id, { vapid: v, now: at('2026-11-14T16:00:00+11:00'), fetchFn })).ok, true); assert.equal(JSON.parse(got.at(-1).body).open, 'invite');
  assert.deepEqual(await push.invite(S, r.id, { vapid: v, now: at('2026-11-14T16:05:00+11:00'), fetchFn }), { ok: true, held: true });
  // a device that left (410) is removed
  status = 410; assert.equal((await push.run(S, { vapid: v, now: at('2026-11-15T18:00:00+11:00'), fetchFn })).gone, 1); assert.equal(S.m.get('s/' + r.id), undefined);
});

test('/api/push: off without keys, the public key with them, bad input refused, stop', async () => {
  const S = memStore(), G = memStore(), L = memStore(), dev = deviceKeys();
  const off = makePush({ pushStore: async () => S, guardStore: async () => G, liveStore: async () => L, vapid: () => null } as never);
  assert.deepEqual(await (await off(new Request('https://x/api/push'))).json(), { on: false });
  assert.equal((await off(new Request('https://x/api/push', { method: 'POST', body: '{}' }))).status, 503);
  const v = vapidKeys(), h = makePush({ pushStore: async () => S, guardStore: async () => G, liveStore: async () => L, vapid: () => v } as never);
  assert.deepEqual(await (await h(new Request('https://x/api/push'))).json(), { on: true, key: v.publicKey });
  assert.equal((await h(new Request('https://x/api/push', { method: 'POST', body: 'nope' }))).status, 400);
  assert.equal((await h(new Request('https://x/api/push', { method: 'POST', body: JSON.stringify({ sub: { endpoint: 'https://evil.example/', keys: dev.keys } }) }))).status, 400);
  const ok = await h(new Request('https://x/api/push', { method: 'POST', body: JSON.stringify({ sub: { endpoint: 'https://fcm.googleapis.com/fcm/send/z', keys: dev.keys }, prefs: {} }) }));
  assert.equal(ok.status, 200); assert.equal([...S.m.keys()].filter(k => k.startsWith('s/')).length, 1);
  assert.equal((await h(new Request('https://x/api/push', { method: 'POST', body: JSON.stringify({ stop: 'https://fcm.googleapis.com/fcm/send/z' }) }))).status, 204);
  assert.equal([...S.m.keys()].filter(k => k.startsWith('s/')).length, 0);
});

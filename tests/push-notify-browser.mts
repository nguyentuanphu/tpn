// Check `pushnotify` (v1.08 notifications): push notifications for grown-ups in the real game, with a fake push service.
// The game is served from its own little server on 127.0.0.2 (the game skips its service worker on localhost) that also
// answers /api/push with the real function (netlify/functions/push.mts, in memory) and plays the push service. The
// browser's own push service cannot be used here, so the page's PushManager hands out a subscription whose keys this
// check holds: everything the website sends is decrypted again, then delivered to the service worker through the
// browser's DevTools (ServiceWorker.deliverPushMessage), exactly as a real push arrives.
//   1. Grown-ups → Notifications on a phone, a tablet and a computer, in English and Vietnamese: every kind has its
//      switch, touch targets are 44 px or more, nothing runs off the screen; with no keys on the website it says so and
//      cannot be turned on.
//   2. Turn on: the subscription and the choices reach the website (and nothing about a child); a switch, quiet hours
//      and bedtime days change the website's copy.
//   3. The scheduled run at Saturday 9:30 and Sunday 18:00 (the family's time zone) sends one bundled message each;
//      nothing in quiet hours; the service worker shows it with the device's own lines (game of the week, the weekly
//      summary), the same text as js/content/notify.ts compose().
//   4. A tap: the notification carries where to open; ?open= opens the game of the week, the festival calendar and the
//      play report.
import fs from 'fs';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import { open, start, clear } from './harness.mts';

const TY: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mts': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm' };
const memStore = () => { const m = new Map<string, string>(); return { m,
  get: async (k: string, o?: { type: 'json' }) => { const v = m.get(k); return v == null ? null : o && o.type === 'json' ? JSON.parse(v) : v; },
  set: async (k: string, v: string) => { m.set(k, String(v)); }, setJSON: async (k: string, v: unknown) => { m.set(k, JSON.stringify(v)); }, delete: async (k: string) => { m.delete(k); },
  list: async ({ prefix }: { prefix: string }) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }) }; };
const at = (iso: string) => Date.parse(iso);

export async function pushNotifyCheck(b) {
  const { makePush } = await import('../netlify/functions/push.mts');
  const push = await import('../netlify/lib/push.mts');
  const { decrypt, vapidFromEnv } = await import('../netlify/lib/webpush.mts');
  const N = await import('../js/content/notify.js');
  const out: string[] = [], shots: string[] = [];
  const S = memStore(), G = memStore(), L = memStore(), inbox: Buffer[] = [];
  const vk = crypto.createECDH('prime256v1'); vk.generateKeys();
  const vapid = vapidFromEnv(k => ({ VAPID_PUBLIC_KEY: vk.getPublicKey().toString('base64url'), VAPID_PRIVATE_KEY: vk.getPrivateKey().toString('base64url'), VAPID_SUBJECT: 'mailto:check@example.com' })[k] || '');
  let keysOn = true, host = '';
  const dev = crypto.createECDH('prime256v1'); dev.generateKeys(); const auth = crypto.randomBytes(16);
  const handler = () => makePush({ pushStore: async () => S, guardStore: async () => G, liveStore: async () => L, vapid: () => keysOn ? vapid : null, extraHost: host } as never);
  const root = path.resolve(process.env.SV_ROOT || '..');
  const srv = http.createServer(async (q, r) => {
    const u = q.url || '/';
    if (u.startsWith('/fake-push/')) { const ch: Buffer[] = []; for await (const c of q) ch.push(c as Buffer); inbox.push(Buffer.concat(ch)); r.writeHead(201); return r.end(); }
    if (u.startsWith('/api/push')) {
      const ch: Buffer[] = []; for await (const c of q) ch.push(c as Buffer);
      const res = await handler()(new Request('http://' + host + u, { method: q.method, headers: { 'content-type': 'application/json' }, body: q.method === 'POST' ? Buffer.concat(ch) : undefined }), { ip: '127.0.0.2' });
      r.writeHead(res.status, { 'Content-Type': res.headers.get('content-type') || 'text/plain' }); return r.end(Buffer.from(await res.arrayBuffer()));
    }
    let f = decodeURIComponent(u.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; f = path.join(root, f);
    if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); fs.createReadStream(f).pipe(r);
  });
  await new Promise<void>(res => srv.listen(0, '127.0.0.2', () => res()));
  host = `127.0.0.2:${(srv.address() as { port: number }).port}`;
  const url = `http://${host}/`, endpoint = `http://${host}/fake-push/device1`;
  // the page's PushManager: a subscription with this check's keys (the browser's real push service cannot be reached)
  const fakePush = `(() => { const sub = { endpoint: ${JSON.stringify(endpoint)}, keys: { p256dh: ${JSON.stringify(dev.getPublicKey().toString('base64url'))}, auth: ${JSON.stringify(auth.toString('base64url'))} } };
    let have = localStorage.getItem('svCheckSub') === '1';
    const obj = () => ({ endpoint: sub.endpoint, toJSON: () => sub, unsubscribe: async () => { have = false; localStorage.removeItem('svCheckSub'); return true; } });
    if (self.PushManager) { PushManager.prototype.subscribe = async function (o) { window.__svSubKey = o && o.applicationServerKey; have = true; localStorage.setItem('svCheckSub', '1'); return obj(); }; PushManager.prototype.getSubscription = async function () { return have ? obj() : null; }; } })();`;
  try {
    // ---- 1. Grown-ups → Notifications on three screens, both languages; keys missing ----
    const sizes = [['phone', 390, 760, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]] as const;
    for (const [name, w, h, touch] of sizes) for (const lang of ['en', 'vi']) {
      const P = await open(b, { w, h, touch, url, lang, pre: fakePush }); await P.ctx.grantPermissions(['notifications'], { origin: url.slice(0, -1) });
      await clear(P.page);
      await P.page.evaluate(() => import(String('/js/ui.js')).then(m => m.openGrownups()));
      await P.page.waitForSelector('.modal.grownups .pushsec', { timeout: 20000 });
      await P.page.evaluate(() => { const d = document.querySelector('.pushsec') as HTMLDetailsElement; d.open = true; d.scrollIntoView(); });
      await P.page.waitForTimeout(800);
      const r = await P.page.evaluate(() => {
        const sec = document.querySelector('.pushsec'), box = (e: Element) => e.getBoundingClientRect();
        const small = [...sec.querySelectorAll('button, select, label.tog')].map(e => ({ t: (e.textContent || '').trim().slice(0, 30), h: Math.round(box(e).height), w: Math.round(box(e).width) })).filter(x => x.h && (x.h < 44 || x.w < 44));
        return { text: sec.textContent, kinds: sec.querySelectorAll('[data-pk]').length, small, over: document.documentElement.scrollWidth > innerWidth + 1 || [...sec.querySelectorAll('*')].some(e => box(e).right > innerWidth + 1), pic: !!sec.querySelector('summary .art'), disabled: (document.querySelector('#gPushOn') as HTMLButtonElement).disabled, state: (document.querySelector('#gPushState') as HTMLElement).innerText };
      });
      const want = lang === 'vi' ? /Thông báo cho phụ huynh[\s\S]*Tóm tắt tuần[\s\S]*Giờ yên lặng/ : /Notifications for grown-ups[\s\S]*Weekly summary[\s\S]*Quiet hours/;
      if (!want.test(r.text)) out.push(`${name} ${lang}: the words are not all there: ${r.text.slice(0, 160)}`);
      if (r.kinds !== 11) out.push(`${name} ${lang}: ${r.kinds} switches (11 kinds; the testers' one only on tester devices)`);
      if (r.small.length) out.push(`${name} ${lang}: smaller than 44 px: ${JSON.stringify(r.small.slice(0, 3))}`);
      if (r.over) out.push(`${name} ${lang}: something runs off the screen`);
      if (!r.pic) out.push(`${name} ${lang}: the bell is not our drawing`);
      if (r.disabled) out.push(`${name} ${lang}: Turn on is disabled while the website has keys`);
      const file = `out/pushnotify-${name}-${lang}.png`; await P.page.screenshot({ path: file }); shots.push(file);
      const errs = P.errors.filter(e => !/api\/push|404/.test(e)); if (errs.length) out.push(`${name} ${lang}: ${errs.slice(0, 2).join(' | ')}`);
      await P.ctx.close();
    }

    // no keys on the website: it says so and Turn on cannot be pressed
    { keysOn = false; const K = await open(b, { w: 390, h: 760, touch: true, url, pre: fakePush }); await clear(K.page);
      await K.page.evaluate(() => import(String('/js/ui.js')).then(m => m.openGrownups())); await K.page.waitForSelector('.pushsec', { timeout: 20000 });
      await K.page.evaluate(() => { (document.querySelector('.pushsec') as HTMLDetailsElement).open = true; });
      const k = await K.page.waitForFunction(() => { const bt = document.querySelector('#gPushOn') as HTMLButtonElement; return bt && bt.disabled ? (document.querySelector('#gPushState') as HTMLElement).innerText : null; }, null, { timeout: 10000 }).then(h => h.jsonValue()).catch(() => null);
      if (!k || !/not switched on/.test(String(k))) out.push('no keys: Turn on is not switched off or it does not say why: ' + k);
      await K.ctx.close(); keysOn = true; }
    // ---- 2. turn on, with the service worker; the switches reach the website ----
    const P = await open(b, { w: 1024, h: 768, url, pre: fakePush, play: false }); await P.ctx.grantPermissions(['notifications'], { origin: url.slice(0, -1) });
    await P.page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 120000 });
    await start(P.page); await clear(P.page);
    await P.page.evaluate(() => import(String('/js/ui.js')).then(m => m.openGrownups())); await P.page.waitForSelector('.pushsec', { timeout: 20000 });
    await P.page.evaluate(() => { (document.querySelector('.pushsec') as HTMLDetailsElement).open = true; });
    await P.page.click('#gPushOn'); await P.page.waitForFunction(() => /off|tắt/i.test(document.querySelector('#gPushOn')?.textContent || ''), null, { timeout: 15000 }).catch(() => { });
    const recKey = () => [...S.m.keys()].find(k => k.startsWith('s/')), rec = () => recKey() && JSON.parse(S.m.get(recKey()));
    let r1 = rec();
    if (!r1) out.push('turning on did not reach the website');
    else {
      if (r1.endpoint !== endpoint) out.push('the website kept another address: ' + r1.endpoint);
      const keyOk = await P.page.evaluate(() => { const k = (window as unknown as { __svSubKey?: Uint8Array }).__svSubKey; return k ? btoa(String.fromCharCode(...k)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : ''; });
      if (keyOk !== vapid.publicKey) out.push('the device did not subscribe with the website\'s public key');
      if (/Bé Na|Bé Bin|kna|kbin/.test(S.m.get(recKey()))) out.push('something about a child reached the website: ' + S.m.get(recKey()).slice(0, 200));
      if (!r1.prefs.kinds.weekly || r1.prefs.kinds.word) out.push('the defaults did not reach the website: ' + JSON.stringify(r1.prefs.kinds));
    }
    // a switch, quiet hours and the bedtime days
    await P.page.evaluate(() => { const i = document.querySelector('.pushsec [data-pk="word"]') as HTMLInputElement; i.click(); });
    await P.page.selectOption('#gPushFrom', String(21 * 60));
    await P.page.click('.pushsec [data-pd="3"]');
    await P.page.waitForTimeout(1500); r1 = rec();
    if (!r1 || !r1.prefs.kinds.word || r1.prefs.quiet.from !== 21 * 60 || !r1.prefs.bedDays.includes(3)) out.push('a change in Grown-ups did not reach the website: ' + JSON.stringify(r1 && r1.prefs));
    // the device's own lines are in its cache (the game of the week, the summary), never with a name
    await P.page.evaluate(async () => { (await import(String('/js/notify.js'))).writeLocalLines(); });
    await P.page.waitForTimeout(500);
    const local = await P.page.evaluate(async () => { const c = await caches.open('sv-notify'), m = await c.match(new URL('__sv-notify.json', document.baseURI).href); return m ? m.json() : null; });
    if (!local || !local.weekly || !local.gotw || !local.gotwId) out.push('the device did not keep its own lines: ' + JSON.stringify(local));
    if (local && /Bé Na|Bé Bin/.test(JSON.stringify(local))) out.push('a child\'s name is in the notification lines');

    // ---- 3. the scheduled run: Saturday and Sunday, bundled, not in quiet hours; the service worker shows it ----
    const fetchFn = fetch;
    // the times are the family's own (the browser's time zone, kept with its choices)
    const tz = rec().prefs.tz, when = (wd: number, min: number) => { for (let t = at('2026-11-05T00:00:00Z'); ; t += 30 * 60e3) { const l = N.localOf(t, tz); if (l.wd === wd && l.min === min) return t; } };
    const q = await push.run(S, { vapid, now: when(6, 7 * 60), fetchFn }); if (q.sent) out.push('a message went out in quiet hours');
    const sat = await push.run(S, { vapid, now: when(6, 9 * 60 + 30), fetchFn }), again = await push.run(S, { vapid, now: when(6, 11 * 60), fetchFn });
    const sun = await push.run(S, { vapid, now: when(0, 18 * 60), fetchFn });
    if (sat.sent !== 1 || again.sent !== 0 || sun.sent !== 1) out.push('not one message on Saturday and one on Sunday: ' + JSON.stringify({ sat, again, sun }));
    const payloads = inbox.map(x => JSON.parse(decrypt(x, dev, auth)));
    const cdp = await P.ctx.newCDPSession(P.page); let regId = '';
    cdp.on('ServiceWorker.workerRegistrationUpdated', (e: { registrations: { registrationId: string, scopeURL: string }[] }) => { for (const x of e.registrations) if (x.scopeURL === url) regId = x.registrationId; });
    await cdp.send('ServiceWorker.enable'); for (let i = 0; i < 20 && !regId; i++) await P.page.waitForTimeout(250);
    if (!regId) out.push('no service worker registration to deliver to');
    const shown = [];
    for (const p of payloads) {
      await cdp.send('ServiceWorker.deliverPushMessage', { origin: url.slice(0, -1), registrationId: regId, data: JSON.stringify(p) });
      const n = await P.page.waitForFunction(async tag => { const reg = await navigator.serviceWorker.getRegistration(); const l = await reg.getNotifications({ tag }); return l.length ? { title: l[0].title, body: l[0].body, data: l[0].data } : null; }, p.tag, { timeout: 10000 }).then(h => h.jsonValue()).catch(() => null);
      const want = N.compose(p, local);
      if (!n) out.push('the service worker showed nothing for ' + p.tag);
      else { shown.push(n); if (n.title !== want.title || n.body !== want.body || n.data.open !== want.open) out.push('the service worker\'s text is not compose(): ' + JSON.stringify({ n, want })); }
    }
    const satN = shown.find(n => n.data.open === 'gotw'), sunN = shown.find(n => n.data.open === 'weekly');
    if (!satN || !satN.body.includes(local.gotw.en) || satN.data.game !== local.gotwId) out.push('Saturday: not the device\'s game of the week: ' + JSON.stringify(satN));
    if (!sunN || !sunN.body.includes(local.weekly.en)) out.push('Sunday: not the device\'s summary: ' + JSON.stringify(sunN));
    // Vietnamese: the same message for a family that chose Tiếng Việt
    const vi = N.payloadOf(N.plan({ now: at('2026-11-08T18:00:00+11:00'), prefs: N.cleanPrefs({ lang: 'vi' }), sent: {} })[0], 'vi');
    await cdp.send('ServiceWorker.deliverPushMessage', { origin: url.slice(0, -1), registrationId: regId, data: JSON.stringify({ ...vi, tag: 'sv-vi' }) });
    const nvi = await P.page.waitForFunction(async () => { const reg = await navigator.serviceWorker.getRegistration(); const l = await reg.getNotifications({ tag: 'sv-vi' }); return l.length ? { title: l[0].title, body: l[0].body } : null; }, null, { timeout: 10000 }).then(h => h.jsonValue()).catch(() => null);
    if (!nvi || nvi.title !== N.TEXTS.sunTitle.vi || !nvi.body.includes(local.weekly.vi)) out.push('Vietnamese: ' + JSON.stringify(nvi));
    // opened counts (the game tells the website only the kind)
    // ---- 4. a tap: ?open= opens the right place ----
    const tap = async (q2: string, test: string) => {
      await P.page.goto(url + q2, { timeout: 60000 }); await start(P.page).catch(() => { });
      const got = await P.page.waitForFunction(t => { const o = (window as unknown as { __svNotifyOpened?: string[] }).__svNotifyOpened; return o && o.length && eval(t) ? o.join() : null; }, test, { timeout: 30000 }).then(h => h.jsonValue()).catch(() => null);
      if (!got) out.push(`a tap on ${q2} did not open its place`); return got;
    };
    await tap(`?open=gotw&game=${local.gotwId}`, `!!document.querySelector('.gl-head')`);
    await tap('?open=festival', `!!document.querySelector('.pad .pad-tabs [data-t="cal"].on')`);
    await tap('?open=weekly', `!!document.querySelector('.modal')`);
    const st = await push.stats(S, Date.now());
    if (!Object.values(st.weeks).some(w => (w.opened || {}).gotw)) out.push('a tap was not counted for Studio');
    const errs = P.errors.filter(e => !/404|api\/push/.test(e)); if (errs.length) out.push(errs.slice(0, 2).join(' | '));
    await P.ctx.close();
    if (out.length) throw new Error(out.join(' | '));
    return `Grown-ups → Notifications on phone, tablet and computer in English and Vietnamese (11 switches, 44 px, nothing off screen; off with no keys); turning on and every change reach the website with nothing about a child; one Saturday and one Sunday message, none in quiet hours, decrypted and shown by the service worker with the device's own lines (= compose()), in Vietnamese too; ?open= opens the game of the week, the festival calendar and the play report; taps counted. Screenshots: ${shots.join(', ')}`;
  } finally { srv.close(); }
}

// Sparkle Studio online: the same dashboard as SparkleStudio.exe (studio/ui, served at /studio/) and the same
// engine (studio/core.cts), on the game's own website, behind the grown-ups' password.
// The family's files are kept in GitHub: saves go to the "studio-draft" branch, Publish puts them live (main).
// Set these in Netlify → Site configuration → Environment variables (never in the code):
//   STUDIO_PASSWORD   the grown-ups' password (12 characters or more, not used anywhere else)  required
//   GITHUB_TOKEN      fine-grained token: this repository only, Contents read/write and Actions write for bot dispatch
//   GITHUB_REPO       e.g. nguyentuanphu/tpn (the default)                    optional
//   AZURE_KEY, AZURE_REGION                            to make voices online             optional
//   NETLIFY_TOKEN                                      the Website page                  optional
//   FAMILY_CODE                                        the family code (else Studio makes one)  optional
// (round R privacy, 9 Oct) Signing in takes two steps for everyone, the owner too: the password, then the 6-digit
// code of an authenticator app (netlify/lib/admins.mts). Ten wrong tries from one connection or on one account lock
// it for 15 minutes (netlify/lib/guard.mts). Every sign-in and every look at the players report goes into the access
// log (netlify/lib/accesslog.mts). "Sign everyone out" counts a generation up, and every cookie and exe key is
// signed with it. Family photos live in the private store (netlify/lib/family.mts), never in GitHub.
import crypto from 'crypto';
import core from '../../studio/core.cts';
import type { Store } from '../lib/family-devices.mts';
import { report, inbox, setLabel } from '../lib/players.mts';
import * as admins from '../lib/admins.mts';
import * as family from '../lib/family.mts';
import * as accessLog from '../lib/accesslog.mts';
import { ipOf, ipKey, locked, failed, cleared, tidy } from '../lib/guard.mts';
import { readLive, saveLive, readContent as readLiveContent, saveContent as saveLiveContent, LiveError } from '../lib/live.mts';
import * as tester from '../lib/tester.mts';
import { cleanBotConfig } from '../lib/child-bots.mts';
// (TypeScript sees nothing of a CommonJS file's module.exports: the engine is checked once here and then has its own type)
const isEngine = (m: unknown): m is StudioEngine => typeof m === 'object' && m !== null && 'createStudio' in m && 'githubStore' in m;
if (!isEngine(core)) throw new Error('studio/core.cts: the Studio engine did not load');
const { createStudio, githubStore, makeToken, checkToken, samePassword } = core;

const env = k => ((globalThis.Netlify && globalThis.Netlify.env.get(k)) || process.env[k] || '').trim();
// (a header given as a list is sent once per value: two cookies at once)
const json = (o, status = 200, headers = {}) => { const h = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); for (const [k, v] of Object.entries(headers)) for (const x of [].concat(v)) h.append(k, x); return new Response(JSON.stringify(o), { status, headers: h }); };
const cookieOf = (req, name) => { const m = new RegExp('(?:^|;\\s*)' + name + '=([^;]+)').exec(req.headers.get('cookie') || ''); return m ? decodeURIComponent(m[1]) : ''; };
const COOKIE = 'sv_studio';
const setCookie = (v, days = 30) => ({ 'Set-Cookie': `${COOKIE}=${v}; Path=/studio; Max-Age=${v ? days * 86400 : 0}; HttpOnly; Secure; SameSite=Strict` });
// (owner, 13 Oct AEDT: "for admin and owner give them an option to auto login for trusted browsers") "Trust this browser"
// at sign-in: the sign-in lasts a year and is renewed as it is used (a fresh year at most once a day). Each trusted
// browser has a record (trust/<id>: who, what browser, where, when) and a second cookie with its id: a year-long sign-in
// works only while its record is there, so Forget (Security) ends it at once; Sign everyone out ends them all as before.
const TRUST = 'sv_trust', TRUST_DAYS = 365;
const trustCookie = id => `${TRUST}=${id || ''}; Path=/studio; Max-Age=${id ? 400 * 86400 : 0}; HttpOnly; Secure; SameSite=Strict`;
const uaShort = ua => { ua = String(ua || ''); const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  const br = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''; return [os, br].filter(Boolean).join(' · ') || 'a browser'; };
const tokenExp = ck => { const parts = String(ck || '').split('.'); return +(ck.startsWith('a.') ? parts[parts.length - 2] : parts[0]) || 0; };

// Netlify Blobs on the website (tests hand in their own)
const store = name => () => import('@netlify/blobs').then(m => m.getStore({ name, consistency: 'strong' }));
const LIVE_PART = { message: 'Message', missions: 'Missions', quiz: 'Quiz', tales: 'Our stories', names: 'Villagers', plots: 'Memory Villages', looks: 'Story characters', ads: 'Ads', album: 'Family album' };
const blobs = store('players'), adminBlobs = store('studio-admins'), liveBlobs = store('live'), heldBlobs = store('studio-pending');
const familyBlobs = store('family-photos'), guardBlobs = store('guard'), logBlobs = store('studio-log'), testerBlobs = store('testers');
const parentAnalyticsBlobs = store('parent-analytics');
// (round R privacy) what signs a cookie: the owner's with the password, the sign-out generation and part of the two-step
// secret; an admin's with the password and the generation (plus their own hash and secret, admins.mts)
const ownerKey = (pw, gen, t, off) => `${pw}\u0000${gen}\u0000${t && t.secret ? String(t.secret).slice(0, 8) : ''}${off ? '\u0000p' : ''}`;
const adminKey = (pw, gen) => `${pw}\u0000${gen}`;
// the owner's two-step belongs to this STUDIO_PASSWORD: a new password (set in Netlify) means setting it up again
const ownerTag = pw => crypto.createHash('sha256').update('sv-owner-2step:' + pw).digest('hex').slice(0, 16);

// the saved changes waiting for Publish (round P), kept in Netlify Blobs: "index" lists them (path → size, or null for
// a removed file) and "f/<path>" holds each file (base64)
export const heldOn = S => ({
  index: async () => (await S.get('index', { type: 'json' })) || {},
  get: async rel => { const b = await S.get('f/' + rel); return b == null ? null : Buffer.from(String(b), 'base64'); },
  put: async changes => { const ix = (await S.get('index', { type: 'json' })) || {};
    for (const [rel, buf] of changes) { if (buf) { await S.set('f/' + rel, Buffer.from(buf).toString('base64')); ix[rel] = buf.length; } else { await S.delete('f/' + rel); ix[rel] = null; } }
    await S.setJSON('index', ix); },
  clear: async () => { const ix = (await S.get('index', { type: 'json' })) || {}; for (const rel of Object.keys(ix)) await S.delete('f/' + rel); await S.setJSON('index', {}); },
  // (owner, 12 Oct) the ones a Publish step has sent to GitHub
  drop: async rels => { const ix = (await S.get('index', { type: 'json' })) || {}; for (const rel of rels) { await S.delete('f/' + rel); delete ix[rel]; } await S.setJSON('index', ix); }
});
// the family photos for the engine (core.cts): the private store on the website
export const familyOn = F => ({ where: 'site', put: (n, b) => family.put(F, n, b), get: n => family.get(F, n), remove: n => family.remove(F, n), code: () => family.code(F), newCode: () => family.newCode(F) });
const isJpeg = b => b && b.length > 3 && b[0] === 0xff && b[1] === 0xd8;

export const makeStudio = ({ playersStore = blobs, adminStore = adminBlobs, heldStore = heldBlobs, liveStore = liveBlobs, familyStore = familyBlobs, guardStore = guardBlobs, logStore = logBlobs, testerStore = testerBlobs, parentAnalyticsStore = parentAnalyticsBlobs, now = () => Date.now() } = {}) => { const handle = async (req, ctx, out) => {
  const url = new URL(req.url), p = url.pathname, pw = env('STUDIO_PASSWORD'), post = req.method === 'POST';
  if (!pw) return json({ error: 'The online Studio is not set up yet: add STUDIO_PASSWORD in Netlify (Site configuration → Environment variables), then deploy again.', setup: true }, 503);
  const A: Store & { set(key: string, value: string): Promise<unknown> } = await adminStore(), gen = +(await A.get('gen').catch(() => 0)) || 0, t = now();
  const log = async (who, role, what, note?: string) => accessLog.add(await logStore(), { who, role, what, ctx, note }, t);
  // (owner, 11 Oct) the owner signs in with the password only; two-step is for the admins (was a choice in Setup → Admins)
  const ownerOff = async () => true;
  const ownerSig = async () => ownerKey(pw, gen, await A.get('totp/owner', { type: 'json' }).catch(() => null), await ownerOff());
  // ---------- signing in: the password, then the code (round R privacy) ----------
  if (p === '/studio/api/login' && post) {
    if (pw.length < admins.MIN_PW) return json({ error: `STUDIO_PASSWORD is too short: it needs ${admins.MIN_PW} characters or more. Change it in Netlify (Site configuration → Environment variables), deploy again, then sign in.`, setup: true }, 503);
    const b = await req.json().catch(() => ({})), name = admins.cleanName(b.name), owner = !name || name === 'owner', who = owner ? 'owner' : name;
    const G = await guardStore(), ipk = 'ip/' + await ipKey(G, ipOf(req, ctx)), acct = 'acct/' + (owner ? 'owner' : admins.NAME.test(name) ? name : '?');
    const mins = await locked(G, [ipk, acct], t);
    if (mins) { await log(who, '', 'locked'); return json({ error: `Too many wrong tries: signing in is locked for ${mins} more minute${mins === 1 ? '' : 's'}.`, locked: mins }, 429); }
    const wrong = async (error, what = 'signin-failed') => { await failed(G, [ipk, acct], t); await log(who, '', what); await new Promise(r => setTimeout(r, 800)); return json({ error }, 401); };
    // 1. the password
    let acc = null;
    if (owner) { if (!samePassword(pw, b.password)) return wrong('That is not the password.'); }
    else {
      acc = await admins.check(A, name, b.password); if (!acc) return wrong('That name and password don’t match.');
      if (String(b.password).length < admins.MIN_PW) return json({ error: `Your password is shorter than ${admins.MIN_PW} characters now: ask the owner for a new one (Setup → Admins → New password).` }, 403);
    }
    // 2. the code from the authenticator app (the first time: set it up, finished with its first code), unless the owner
    // chose the password only for this account
    const twoStep = owner ? !await ownerOff() : !acc.noTwoStep;
    const tag = ownerTag(pw), T0 = owner ? await A.get('totp/owner', { type: 'json' }).catch(() => null) : null, ot = T0 && T0.tag === tag ? T0 : null;
    const sec = owner ? ot && ot.secret : acc.totp, last = owner ? ot && ot.last : acc.totpLast;
    if (!twoStep) { /* the password only */ }
    else if (!sec) {
      const pk = 'setup/' + who; let pend = await A.get(pk, { type: 'json' }).catch(() => null);
      if (!pend || !(pend.exp > t)) { pend = { secret: admins.newSecret(), exp: t + 15 * 60e3 }; await A.setJSON(pk, pend); }
      if (!b.code) return json({ step: 'setup', name: who, secret: pend.secret, otpauth: admins.otpauth(who, pend.secret) });
      const st = admins.totpStep(pend.secret, b.code, t); if (st < 0) return wrong('That code is not right: type the 6 numbers the app shows now.', 'code-failed');
      if (owner) await A.setJSON('totp/owner', { secret: pend.secret, tag, last: st, at: new Date(t).toISOString() }); else await admins.setTotp(A, name, pend.secret, st);
      await A.delete(pk); await log(who, owner ? 'owner' : acc.role, 'two-step-set');
    } else {
      if (!b.code) return json({ step: 'code', error: 'Type the 6-digit code from your authenticator app.' }, 401); // (not a wrong try)
      const st = admins.totpStep(sec, b.code, t); if (st < 0 || st <= (last == null ? -1 : last)) return wrong('That code is not right (or was used already): type the 6 numbers the app shows now.', 'code-failed');
      if (owner) await A.setJSON('totp/owner', { ...ot, last: st }); else await admins.usedTotp(A, acc, st);
    }
    await cleared(G, [acct]);
    const days = b.trust ? TRUST_DAYS : 30, role0 = owner ? 'owner' : (await admins.get(A, name)).role;
    let trusted = [];
    if (b.trust) { const id = crypto.randomBytes(12).toString('base64url'), iso = new Date(t).toISOString();
      await A.setJSON('trust/' + id, { who, role: role0, browser: uaShort(req.headers.get('user-agent')), where: [ctx && ctx.geo && ctx.geo.city, ctx && ctx.geo && ctx.geo.country && ctx.geo.country.code].filter(Boolean).join(', '), at: iso, last: iso });
      trusted = [trustCookie(id)]; }
    if (owner) { await log('owner', 'owner', b.trust ? 'signin-trusted' : 'signin'); return json({ ok: true, role: 'owner' }, 200, { 'Set-Cookie': [setCookie(makeToken(await ownerSig(), days), days)['Set-Cookie'], ...trusted] }); }
    const fresh = await admins.get(A, name); await log(name, fresh.role, b.trust ? 'signin-trusted' : 'signin');
    return json({ ok: true, role: fresh.role }, 200, { 'Set-Cookie': [setCookie(admins.makeCookie(adminKey(pw, gen), fresh, days), days)['Set-Cookie'], ...trusted] });
  }
  if (p === '/studio/api/logout') { const tid = cookieOf(req, TRUST); if (/^[\w-]{8,40}$/.test(tid)) await A.delete('trust/' + tid).catch(() => { }); return json({ ok: true }, 200, { 'Set-Cookie': [setCookie('')['Set-Cookie'], trustCookie('')] }); }
  // ---------- who is asking: the cookie (the dashboard), or SparkleStudio.exe's key ----------
  const ck = cookieOf(req, COOKIE); let me = null;
  if (ck && !ck.startsWith('a.') && checkToken(await ownerSig(), ck)) me = { name: 'owner', role: 'owner', perms: admins.PRESETS.owner };
  if (!me && ck.startsWith('a.')) { const a = await admins.fromCookie(A, adminKey(pw, gen), ck).catch(() => null); if (a && (a.totp || a.noTwoStep)) me = { name: a.name, role: a.role, perms: admins.permsOf(a) }; }
  // a year-long sign-in needs its trusted-browser record; while it is used it gets a fresh year (at most once a day)
  const tid = cookieOf(req, TRUST), trustOk = /^[\w-]{8,40}$/.test(tid) ? await A.get('trust/' + tid, { type: 'json' }).catch(() => null) : null;
  if (me && tokenExp(ck) - t > 31 * 864e5) {
    if (!trustOk || trustOk.who !== me.name) me = null;
    else if (Date.parse(trustOk.last || 0) < t - 864e5) {
      await A.setJSON('trust/' + tid, { ...trustOk, last: new Date(t).toISOString() });
      const fresh = me.role === 'owner' ? makeToken(await ownerSig(), TRUST_DAYS) : admins.makeCookie(adminKey(pw, gen), await admins.get(A, me.name), TRUST_DAYS);
      out.renew = setCookie(fresh, TRUST_DAYS)['Set-Cookie'];
    }
  }
  const xk = req.headers.get('x-studio-key');
  if (!me && xk) {
    const G = await guardStore(), ipk = 'ip/' + await ipKey(G, ipOf(req, ctx));
    if (await locked(G, [ipk], t)) return json({ error: 'Too many wrong tries: wait 15 minutes.' }, 429);
    const k = await admins.fromKey(A, xk, gen); if (k) me = { name: 'exe:' + k.label, role: 'exe' };
    else { await failed(G, [ipk], t); return json({ error: 'That Studio key is not right, or was removed: make a new one online (Setup → Security) and put it in Settings.', signin: true }, 401); }
  }
  if (!me) return json({ error: 'Please sign in.', signin: true }, 401);
  if (post && req.headers.get('x-studio') !== '1') return json({ error: 'no' }, 403); // only the dashboard itself sends changes
  // trusted browsers: everyone sees and forgets their own; the owner sees and forgets everyone's
  if (p === '/studio/api/trusted' || p === '/studio/api/trusted/forget') {
    const list = []; let cursor; do { const r = await A.list({ prefix: 'trust/', ...(cursor ? { cursor } : {}) }); for (const b of r.blobs) { const v = await A.get(b.key, { type: 'json' }).catch(() => null); if (v) list.push({ id: b.key.slice(6), ...v, here: b.key.slice(6) === tid }); } cursor = r.cursor; } while (cursor);
    const mine = list.filter(x => me.role === 'owner' || x.who === me.name);
    if (p === '/studio/api/trusted') return json({ trusted: mine.sort((a, b) => String(b.last).localeCompare(String(a.last))) });
    if (!post) return json({ error: 'no' }, 405);
    const b = await req.json().catch(() => ({})), x = mine.find(y => y.id === b.id); if (!x) return json({ error: 'That browser is not trusted (any more).' }, 404);
    await A.delete('trust/' + x.id); await log(me.name, me.role, 'trust-forget', x.who + ' · ' + x.browser);
    return json({ ok: true }, 200, x.here ? { 'Set-Cookie': [setCookie('')['Set-Cookie'], trustCookie('')] } : {});
  }
  // what this admin may do (round O; owner, 14 Oct AEDT: one permission at a time, admins/PERMS): only an owner manages the admins
  const route = p.startsWith('/studio/content/') ? 'file' : decodeURIComponent(p.slice('/studio/api/'.length)), asked = route.startsWith('file/') && !post ? 'info' : route;
  if (!admins.allowed(me, asked, post)) { const need = admins.needs(asked, post), P = admins.PERMS[need];
    return json({ error: P ? `Your account may not do that. Ask the owner for “${P[1]}” (Setup → Admins).` : 'Only an owner can do that.', need }, 403); }
  const body = async () => post ? await req.json().catch(() => ({})) : {};
  if (p === '/studio/api/whoami') return json(me);
  if (p.startsWith('/studio/api/admins/')) {
    const b = await body();
    if (p === '/studio/api/admins/list') return json({ admins: await admins.list(A), me, perms: admins.PERMS });
    // (owner, 9 Oct) two-step or the password only, for one admin (the owner always signs in with the password only, 11 Oct)
    if (p === '/studio/api/admins/twostep' && post) {
      const n = admins.cleanName(b.name), on = b.on !== false;
      if (n === 'owner') return json({ error: 'The owner signs in with the password only: two-step is for admins.' }, 400);
      const ok = await admins.setTwoStep(A, n, on); if (ok) await log(me.name, me.role, on ? 'two-step-on' : 'two-step-off', n); return json({ ok });
    }
    if (p === '/studio/api/admins/save' && post) { if (admins.cleanName(b.name) === 'owner') return json({ error: '“owner” is kept for the STUDIO_PASSWORD.' }, 400); const r = await admins.put(A, b, me.name); return json(r, r.error ? 400 : 200); }
    if (p === '/studio/api/admins/remove' && post) return json(await admins.remove(A, b.name));
    // (round R privacy) a new phone: the owner clears someone's two-step, and they set it up again at their next sign-in
    if (p === '/studio/api/admins/reset2fa' && post) { if (admins.cleanName(b.name) === 'owner') return json({ error: 'The owner signs in with the password only: two-step is for admins.' }, 400); const ok = await admins.resetTotp(A, b.name); if (ok) await log(me.name, me.role, 'two-step-reset', admins.cleanName(b.name)); return json({ ok }); }
    // anyone changes their own password (the owner's is STUDIO_PASSWORD, changed in Netlify)
    if (p === '/studio/api/admins/me' && post) {
      if (me.name === 'owner') return json({ error: 'The owner’s password is STUDIO_PASSWORD: change it in Netlify (Site configuration → Environment variables).' }, 400);
      if (!await admins.check(A, me.name, b.old)) return json({ error: 'The old password is not right.' }, 401);
      const r = await admins.put(A, { name: me.name, password: b.password, role: me.role }, me.name); return json(r, r.error ? 400 : 200);
    }
    return json({ error: 'no' }, 404);
  }
  // (round R privacy) Sign everyone out: every cookie and every exe key made so far stops working
  if (p === '/studio/api/security/signout-all' && post) { await A.set('gen', String(gen + 1)); await log(me.name, me.role, 'signout-all'); return json({ ok: true }, 200, setCookie('')); }
  if (p === '/studio/api/keys/list') return json({ keys: await admins.listKeys(A) });
  if (p === '/studio/api/keys/make' && post) { const b = await body(), k = await admins.makeKey(A, b.label, me.name, gen); await log(me.name, me.role, 'key-made', String(b.label || '')); return json({ key: k }); }
  if (p === '/studio/api/keys/remove' && post) { const b = await body(); await log(me.name, me.role, 'key-removed'); return json(await admins.removeKey(A, b.id)); }
  if (p === '/studio/api/log') { tidy(await guardStore(), t).catch(() => { }); return json({ entries: await accessLog.list(await logStore()) }); }
  // (round R privacy) the family photos and the family code: the private store, never GitHub
  if (p === '/studio/api/family/code') return json(await family.code(await familyStore()));
  if (p === '/studio/api/family/code/new' && post) { const r = await family.newCode(await familyStore()); if (!r.error) await log(me.name, me.role, 'family-code'); return json(r, r.error ? 400 : 200); }
  if (p === '/studio/api/family/upload' && post) { // from SparkleStudio.exe
    const b = await body(), buf = Buffer.from(String(b.data || ''), 'base64');
    if (!family.NAME.test(b.name || '') || !isJpeg(buf) || buf.length > 600 * 1024) return json({ error: 'Send a JPEG photo (under 600 KB) with a good name.' }, 400);
    await family.put(await familyStore(), b.name, buf); return json({ ok: true });
  }
  if (p === '/studio/api/family/remove' && post) { const b = await body(); await family.remove(await familyStore(), b.name); return json({ ok: true }); }
  if (p.startsWith('/studio/api/familyphoto/')) { const b = await family.get(await familyStore(), p.slice('/studio/api/familyphoto/'.length)); return b ? new Response(b, { status: 200, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } }) : json({ error: 'not found' }, 404); }
  // (round R) Releases and Festivals: saved straight to the website, so they reach the devices at once, no Publish
  // (r81, owner 17 Oct AEDT) the content pages (Message, Missions, Quiz, Stories, Villagers, Defaults…): live at once too,
  // only the sections sent change; needs "Change pages" (admins.needs), and SparkleStudio.exe's key may send them
  if (p === '/studio/api/live/content') {
    if (!post) return json(await readLiveContent(await liveStore()));
    try { const v = await saveLiveContent(await liveStore(), await body(), me.name); return json({ ok: true, at: v.at, content: v.content }); }
    catch (e) { if (!(e instanceof LiveError)) throw e;
      return json({ error: e.why === 'big' ? `Too much to go live at once (${e.n} KB; 200 KB at most): make the stories or the quiz shorter, then Save again.` : `Some words are too long to go live (${LIVE_PART[e.where] || e.where}: ${e.n} letters at most): make them shorter, then Save again.` }, 400); }
  }
  if (p === '/studio/api/live') {
    const S = await liveStore();
    if (!post) {
      const v = await readLive(S);
      return json(admins.allowed(me, 'bot/run', true)
        ? { ...v, releases: { ...v.releases, nightlyBots: await S.get('bot-schedule', { type: 'json' }).catch(() => null) || undefined } }
        : v);
    }
    const b = await body();
    if (Object.prototype.hasOwnProperty.call(b.releases || {}, 'nightlyBots')) {
      if (!admins.allowed(me, 'bot/run', true)) return json({ error: 'Website permission required to change the bot schedule.' }, 403);
      const schedule = cleanBotConfig(b.releases.nightlyBots);
      if (!schedule) return json({ error: 'Invalid bot configuration.' }, 400);
      await S.setJSON('bot-schedule', schedule);
    }
    return json(await saveLive(S, b, me.name));
  }
  const players = async () => report(await playersStore());
  if (p === '/studio/api/players') { await log(me.name, me.role, 'analytics'); return json(await players()); }
  if (p === '/studio/api/inbox') return json(await inbox(await playersStore()));
  // (owner, 12 Oct) tester reports (netlify/lib/tester.mts): the problems, the testers and the day's summary; one problem
  // with its reports; a report's screenshot; setting a problem's status (fixed in rNN, not a bug, the same as another)
  if (p === '/studio/api/testers') return json(await tester.overview(await testerStore(), now()));
  if (p.startsWith('/studio/api/testers/problem/')) { const r = await tester.problem(await testerStore(), p.split('/').pop()); return r ? json(r) : json({ error: 'No such problem.' }, 404); }
  if (p.startsWith('/studio/api/testers/shot/')) return json({ shot: (await tester.shotOf(await testerStore(), p.split('/').pop())) || '' });
  if (p === '/studio/api/testers/set' && post) { const b = await body(); const r = await tester.setProblem(await testerStore(), b.k, b, now()); return r ? json(r) : json({ error: 'No such problem.' }, 404); }
  // a name for a device in the play report ("Na's iPad"), round L
  if (p === '/studio/api/players/label' && post) { const b = await body(); return json({ ok: await setLabel(await playersStore(), b.id, b.label) }); }
    // Parent website analytics (privacy-first, consent-gated, no PII)
    if (p === '/studio/api/parent-analytics') {
      if (!admins.allowed(me, 'analytics', false)) return json({ error: 'Analytics permission required.' }, 403);
      const S = await parentAnalyticsStore();
      const days = 30;
      const out: any = { days: [], totals: { totalEvents: 0, pageViews: {}, actionClicks: {}, linkClicks: 0, scrollMilestones: {}, activeTimeTotalSec: 0, playConversions: 0, languages: {}, devices: {} } };
      for (let i = 0; i < days; i++) {
        const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
        const sum = await S.get(`sum/${d}`, { type: 'json' }).catch(() => null);
        if (sum) {
          out.days.push(sum);
          out.totals.totalEvents += sum.totalEvents || 0;
          for (const [k, v] of Object.entries(sum.pageViews || {})) out.totals.pageViews[k] = (out.totals.pageViews[k] || 0) + (v as number);
          for (const [k, v] of Object.entries(sum.actionClicks || {})) out.totals.actionClicks[k] = (out.totals.actionClicks[k] || 0) + (v as number);
          out.totals.linkClicks += sum.linkClicks || 0;
          for (const [k, v] of Object.entries(sum.scrollMilestones || {})) out.totals.scrollMilestones[k] = (out.totals.scrollMilestones[k] || 0) + (v as number);
          out.totals.activeTimeTotalSec += sum.activeTimeTotalSec || 0;
          out.totals.playConversions += sum.playConversions || 0;
          for (const [k, v] of Object.entries(sum.languages || {})) out.totals.languages[k] = (out.totals.languages[k] || 0) + (v as number);
          for (const [k, v] of Object.entries(sum.devices || {})) out.totals.devices[k] = (out.totals.devices[k] || 0) + (v as number);
        }
      }
      out.days.reverse();
      return json(out);
    }
    const conf = { azureKey: env('AZURE_KEY'), azureRegion: env('AZURE_REGION'), githubToken: env('GITHUB_TOKEN'), githubRepo: env('GITHUB_REPO') || 'nguyentuanphu/tpn', githubBranch: env('GITHUB_BRANCH') || 'main',
      netlifyToken: env('NETLIFY_TOKEN'), netlifySite: env('NETLIFY_SITE') || env('SITE_ID'), siteUrl: env('URL') };
  if (!conf.githubToken) return json({ error: 'Add GITHUB_TOKEN in Netlify (Site configuration → Environment variables) so the online Studio can read and save the family’s files.', setup: true }, 503);
  const gstore = githubStore({ token: conf.githubToken, repo: conf.githubRepo, branch: conf.githubBranch, held: heldOn(await heldStore()) });
  // the changes waiting for Publish, and dropping them (round P)
  if (p === '/studio/api/pending') return json({ files: await gstore.waiting() });
  if (p === '/studio/api/pending/discard' && post) return json(await gstore.discard());
  const studio = createStudio({ store: gstore, conf, online: true, family: familyOn(await familyStore()), local: { players, inbox: async () => inbox(await playersStore()) } });
  // the game's modules on the Map and Voices pages fetch content/custom.json from the page's own address
  const api = p.startsWith('/studio/content/') ? 'file/' + p.slice(8) : decodeURIComponent(p.slice('/studio/api/'.length));
  try {
    const raw = post ? Buffer.from(await req.arrayBuffer()) : null;
    if (raw && raw.length > 5.5e6) return json({ error: 'That is too big to send online (over 5 MB).' }, 413);
    const r = await studio.handle(api, req.method, raw);
    if (api === 'info' && r.body && typeof r.body === 'object') { r.body.me = me; r.body.perms = admins.PERMS; r.body.waiting = (await gstore.waiting()).length; } // who is signed in, and what they may do
    if (post && r.code < 400) await gstore.flush('Sparkle Studio online: ' + api);
    if (r.raw) return new Response(r.raw, { status: r.code, headers: { 'Content-Type': r.type, 'Cache-Control': 'no-store' } });
    if (api === 'file/content/custom.json' && r.code === 404) return json({});
    return json(r.body, r.code);
  } catch (e) { return json({ error: String(e && e.message || e) }, 500); }
};
  // (a trusted browser's fresh year rides on whatever answer it gets)
  return async (req, ctx) => { const out: { renew?: string } = {}, res = await handle(req, ctx, out); if (out.renew) try { res.headers.append('Set-Cookie', out.renew); } catch (e) { } return res; }; };
export default makeStudio();
export const config = { path: ['/studio/api/*', '/studio/content/*'] };

// Tester reports (owner, 12 Oct 2026 AEDT; PRIV-014, PRIV-016): only devices the Releases switch `tester` covers are
// heard; reports are checked and grouped into problems; limits a device and a connection a day; the status a device
// gets (its problems, the open ones, the retest); Studio sets a problem fixed, which counts as help for the badges and
// the weekly star; a device confirms a fix or says it came back. In-memory stores, no browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../netlify/lib/tester.mts';
import { makeTester } from '../../netlify/functions/tester.mts';
import { cleanLive } from '../../netlify/lib/live.mts';
import { testerLevel, keyOf, badgeFor, nextBadge, peeksOf } from '../../js/content/tester.js';

const mem = () => { const m = new Map(); return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, set: async (k, v) => { m.set(k, String(v)); }, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }), _m: m }; };
const A = 'aaaaaaaaaaaa', B = 'bbbbbbbbbbbb', X = 'xxxxxxxxxxxx';
const LIVE = { releases: { tester: { on: true, devices: [A, B], levels: { B: 'auto' } } } };
const rep = (id, o = {}) => ({ id, b: 'r66', kind: 'auto', auto: 'error', detail: 'x is not defined @ ui.js:12', where: { area: 'village', game: 'memory', window: '', x: 1, z: 2 }, errors: ['x is not defined @ ui.js:12'], log: [[-3, 'tap', 'Play']], dev: { os: 'iOS', br: 'Safari', sc: '390x844', lang: 'vi', fps: 50 }, players: [{ name: 'Bé Na', age: 'little' }], shot: 'data:image/jpeg;base64,AAAA', ...o });

test('the game decides who is a tester and at which level', () => {
  assert.equal(testerLevel(false, LIVE.releases.tester, A), '');
  assert.equal(testerLevel(true, LIVE.releases.tester, X), '', 'a device not ticked is not a tester');
  assert.equal(testerLevel(true, { devices: [A], levels: { [A]: 'auto' } }, A), 'auto');
  assert.equal(testerLevel(true, { devices: [A] }, A), 'ladybird', 'the ladybird by default');
  assert.equal(testerLevel(true, {}, X), 'ladybird', 'no list: every device');
  assert.deepEqual(peeksOf({ peeks: ['readingTrial', '<b>'] }), ['readingTrial']);
  assert.equal(keyOf('error', 'a', 'b'), 'error|a|b');
  assert.equal(badgeFor(0), null); assert.equal(badgeFor(1).id, 'lb1'); assert.equal(badgeFor(24).id, 'lb2'); assert.equal(badgeFor(50).id, 'lb4');
  assert.equal(nextBadge(10).id, 'lb3');
});

test('Studio keeps each tester device\'s level and the sneak peeks, and nothing odd', () => {
  const c = cleanLive({ releases: { tester: { on: true, devices: [A, 'bad'], levels: { [A]: 'auto', [B]: 'all', zz: 'auto' }, peeks: ['readingTrial', 'x y'] } } });
  assert.deepEqual(c.releases.tester, { on: true, devices: [A], levels: { [A]: 'auto' }, peeks: ['readingTrial'] });
});

test('only tester devices are heard; reports are checked and grouped into problems', async () => {
  const S = mem();
  assert.equal((await T.addReport(S, LIVE, rep(X))).status, 403, 'not a tester');
  assert.equal((await T.addReport(S, { releases: {} }, rep(A))).status, 403, 'the switch is off');
  assert.equal((await T.addReport(S, LIVE, { ...rep(A), kind: 'nope' })).status, 400);
  const a = await T.addReport(S, LIVE, rep(A)), b = await T.addReport(S, LIVE, rep(B, { detail: 'x is not defined @ ui.js:12' }));
  assert.ok(a.ok && b.ok); assert.equal(a.k, b.k, 'the same error in the same game is one problem');
  const n = await T.addReport(S, LIVE, rep(A, { kind: 'looks', auto: undefined, note: 'The bridge is floating', spoken: true }));
  assert.notEqual(n.k, a.k, 'a tester\'s note is its own problem');
  const j = await T.addReport(S, LIVE, rep(B, { kind: 'broken', auto: undefined, note: 'Same', join: a.k }));
  assert.equal(j.k, a.k, '"Already reported → add to it" joins the open problem');
  const all = await T.problems(S), p = all.find(x => x.k === a.k);
  assert.equal(p.n, 3); assert.equal(p.devices, 2); assert.deepEqual(p.builds, ['r66']); assert.equal(p.status, 'new');
  const d = await T.problem(S, a.k); assert.equal(d.reports.length, 3); assert.equal(d.reports[0].players[0].name, 'Bé Na', 'a tester\'s report keeps the names (PRIV-016)');
  assert.ok((await T.shotOf(S, d.reports[0].rid)).startsWith('data:image/jpeg'));
  const big = rep(A, { note: 'x'.repeat(5000), errors: Array(99).fill('e'), log: Array(999).fill([1, 'tap', 'x']) }), c = T.cleanReport(big).r;
  assert.ok(c.note.length <= T.TLIMITS.note && c.errors.length <= T.TLIMITS.errors && c.log.length <= T.TLIMITS.log, 'sizes are capped');
});

test('reporter attribution: auto detector, signed-in player, family shared device', async () => {
  const S = mem();
  // auto detector report
  const rAuto = await T.addReport(S, LIVE, rep(A, { kind: 'auto', reporter: { type: 'auto' } }));
  assert.ok(rAuto.ok);
  const dAuto = await T.problem(S, rAuto.k);
  assert.equal(dAuto.reports[0].reporter.type, 'auto');

  // player report with explicit active player name
  const rPlayer = await T.addReport(S, LIVE, rep(A, { kind: 'looks', auto: undefined, note: 'Color looks pale', reporter: { type: 'player', name: 'Bé Na' } }));
  assert.ok(rPlayer.ok);
  const dPlayer = await T.problem(S, rPlayer.k);
  assert.deepEqual(dPlayer.reports[0].reporter, { type: 'player', name: 'Bé Na' });

  // shared family device without confirmed reporter
  const rFamily = await T.addReport(S, LIVE, rep(B, { kind: 'broken', auto: undefined, note: 'Game froze', reporter: { type: 'unknown' } }));
  assert.ok(rFamily.ok);
  const dFamily = await T.problem(S, rFamily.k);
  assert.equal(dFamily.reports[0].reporter.type, 'unknown');

  // mark fixed with version tag r88 retains history and report details
  await T.setProblem(S, rPlayer.k, { status: 'fixed', fixedIn: 'r88' });
  const dFixed = await T.problem(S, rPlayer.k);
  assert.equal(dFixed.status, 'fixed');
  assert.equal(dFixed.fixedIn, 'r88');
  assert.equal(dFixed.reports.length, 1);
  assert.equal(dFixed.reports[0].note, 'Color looks pale');
});

test('a device may send 60 reports a day, a connection 150 (PRIV-014)', async () => {
  const S = mem(); let last;
  for (let i = 0; i < T.TLIMITS.device + 1; i++) last = await T.addReport(S, LIVE, rep(A, { detail: 'e' + i }), Date.now(), 'ip1');
  assert.equal(last.status, 429);
});

test('fixed in a version: the device sees it, replays it, confirms it; help counts for badges and the star', async () => {
  const S = mem(), a = await T.addReport(S, LIVE, rep(A)), n = await T.addReport(S, LIVE, rep(B, { kind: 'idea', auto: undefined, note: 'More boats' }));
  let st = await T.deviceStatus(S, LIVE, A, 'r66'); assert.equal(st.mine[0].status, 'new'); assert.equal(st.open.length, 2); assert.equal(st.helped, 0);
  assert.equal(await T.deviceStatus(S, LIVE, X, 'r66'), null, 'not a tester: nothing');
  await T.setProblem(S, a.k, { fixedIn: 'r67' });
  st = await T.deviceStatus(S, LIVE, A, 'r66'); assert.equal(st.mine[0].status, 'fixed'); assert.equal(st.retest.length, 0, 'not on the fixed version yet');
  st = await T.deviceStatus(S, LIVE, A, 'r67'); assert.equal(st.retest.length, 1, 'on the fixed version: replay it'); assert.equal(st.helped, 1); assert.ok(st.star, 'the week\'s star');
  assert.ok(await T.deviceSays(S, LIVE, { id: A, k: a.k, fixed: true })); assert.equal((await T.problems(S)).find(p => p.k === a.k).status, 'confirmed');
  // the same error again on the fixed version: it came back
  await T.addReport(S, LIVE, { ...rep(A), b: 'r67' }); assert.equal((await T.problems(S)).find(p => p.k === a.k).status, 'back');
  await T.setProblem(S, n.k, { dupOf: a.k }); assert.equal((await T.problems(S)).find(p => p.k === n.k).status, 'dup');
  const ov = await T.overview(S); assert.equal(ov.testers.length, 2); assert.ok(ov.summary.open >= 1);
  assert.ok(await T.deviceSays(S, LIVE, { id: A, accepted: true })); assert.ok((await T.testers(S)).find(t => t.id === A).accepted > 0);
});

test('/api/tester: reports in, status out, refused for others', async () => {
  const S = mem(), L = mem(), G = mem(); await L.setJSON('live', LIVE);
  const h = makeTester({ testerStore: async () => S, liveStore: async () => L, guardStore: async () => G });
  const post = b => h(new Request('https://x/api/tester', { method: 'POST', body: JSON.stringify(b) }), { ip: '1.2.3.4' });
  assert.equal((await post(rep(A))).status, 200);
  assert.equal((await post(rep(X))).status, 403);
  assert.equal((await h(new Request('https://x/api/tester', { method: 'POST', body: 'x'.repeat(T.TLIMITS.size + 1) }), { ip: '1.2.3.4' })).status, 413);
  const g = await h(new Request(`https://x/api/tester?id=${A}&b=r66`), { ip: '1.2.3.4' }); assert.equal(g.status, 200); assert.equal((await g.json()).mine.length, 1);
  assert.equal((await h(new Request(`https://x/api/tester?id=${X}&b=r66`), { ip: '1.2.3.4' })).status, 403);
});

test('each problem goes to the core it most likely belongs to (tools/tester-issues.mts)', async () => {
  const { coreOf } = await import('../../tools/tester-issues.mts');
  assert.equal(coreOf({ title: 'error', where: { game: 'memory' } }, null), 'play');
  assert.equal(coreOf({ title: 'x', where: {} }, { reports: [{ errors: ['boom @ roads.js:3'] }] }), 'world');
  assert.equal(coreOf({ title: 'x', where: {}, auto: 'slow', kind: 'auto' }, null), 'analytics-infra');
  assert.equal(coreOf({ title: 'button off the screen', where: { window: 'modal pad' } }, null), 'kid-ui');
});
test('a new issue only for a problem seen on the live build or the one before it (owner, 17 Oct AEDT)', async () => {
  const { recentEnough } = await import('../../tools/tester-issues.mts');
  assert.equal(recentEnough(['r69', 'r74'], 83), false, 'a device left on r69 to r74 files nothing new');
  assert.equal(recentEnough(['r74', 'r82'], 83), true); assert.equal(recentEnough(['r83'], 83), true);
  assert.equal(recentEnough([], 83), false); assert.equal(recentEnough(['?'], 83), false);
  assert.equal(recentEnough(['r40'], 0), true, 'no live build known: every problem as before');
});
test('issue text never mentions a GitHub account (#472: "tap: Send @45,375" pinged the user 45)', async () => {
  const { noMention } = await import('../../tools/tester-issues.mts');
  const out = noMention('- -0.1 s tap: Send @45,375\nnote from @someone, mail a@b.com');
  assert.equal(/(^|[^\w/.])@[A-Za-z0-9]/m.test(out), false, out);
  assert.equal(out.replace(/​/g, ''), '- -0.1 s tap: Send @45,375\nnote from @someone, mail a@b.com', 'the visible text is unchanged');
});


test('a report retry with its client ID returns the receipt without counting another report', async () => {
  const S = mem(), body = rep(A, { clientId: 'a'.repeat(32) });
  const first = await T.addReport(S, LIVE, body, 1000, 'ip');
  const again = await T.addReport(S, LIVE, body, 2000, 'ip');
  assert.equal(again.rid, first.rid); assert.equal(again.k, first.k);
  const state = await T.deviceStatus(S, LIVE, A, 'r66', 3000); assert.equal(state.reports, 1);
});
test('Studio retains per-device progress, speed and autoplay choices and rejects invalid values', () => {
  const c = cleanLive({ releases: { tester: { on: true, policies: { [A]: { revert: 'keep', speed: 'x5', autoplay: false }, bad: { revert: 'keep' }, [B]: { revert: 'invalid', speed: 'x99', autoplay: 'yes' } } } } });
  assert.deepEqual(c.releases.tester.policies, { [A]: { revert: 'keep', speed: 'x5', autoplay: false } });
});


test('tester summary uses the Sydney day across the UTC date boundary', () => {
 const now = Date.parse('2026-10-13T22:30:00Z');
 const result = T.summary([{ firstAt:Date.parse('2026-10-13T22:00:00Z'), lastAt:now, devices:1, n:1, status:'new', title:'x' }], now);
 assert.equal(result.day,'2026-10-14'); assert.equal(result.new,1); assert.equal(result.open,1);
});

test('the problem list reads the store many at a time (r89: the robot got 504 from one-by-one reads)', async () => {
  const S = mem(); let busy = 0, most = 0;
  for (let i = 0; i < 60; i++) await S.setJSON(`p/${String(i).padStart(16, '0')}`, { k: String(i).padStart(16, '0'), kind: 'auto', title: 't' + i, where: {}, n: 1, devices: [], builds: [], reports: [], status: 'new', kinds: {}, lastAt: i });
  const get = S.get; S.get = async (k, o) => { busy++; most = Math.max(most, busy); await new Promise(r => setTimeout(r, 5)); busy--; return get(k, o); };
  const list = await T.problems(S);
  assert.equal(list.length, 60); assert.equal(list[0].title, 't59', 'newest first as before');
  assert.ok(most >= 8, `at most ${most} reads at once`);
});

test('a GitHub issue closed with "Fixed in rNN" sets the Studio problem (r89 two-way sync)', async () => {
  const { statusFromIssue } = await import('../../tools/tester-issues.mts');
  assert.equal(statusFromIssue({ state: 'open' }, [{ body: 'Fixed in r89' }]), null, 'an open issue sets nothing');
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'duplicate' }, []), { status: 'dup' }, 'closed as a duplicate is a duplicate in Studio');
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'Fixed in v1.03 (live 30 Oct 2026, 6:16 am AEDT): ...' }]), { fixedIn: 'v1.03' }, 'a v number names the fix');
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'looked at it' }, { body: 'Fixed in R89 (autoplay plans).' }]), { fixedIn: 'r89' });
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'not_planned' }, []), { status: 'notbug' });
  assert.equal(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'no version' }]), null, 'no version named: nothing set');
  assert.equal(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'Fixed in r88' }, { body: 'It came back on r89.' }]), null, 'came back after the fix: still open');
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'It came back on r89.' }, { body: 'Fixed in r90' }]), { fixedIn: 'r90' });
});

test('a point release (r89.1, owner 23 Oct AEDT) is a build like any other and sits between r89 and r90', async () => {
  const S = mem(), a = await T.addReport(S, LIVE, { ...rep(A), b: 'r89.1' });
  assert.ok(a.ok); assert.deepEqual((await T.problem(S, a.k)).builds, ['r89.1']);
  await T.setProblem(S, a.k, { fixedIn: 'r89.1' }); assert.equal((await T.problem(S, a.k)).fixedIn, 'r89.1');
  assert.equal((await T.deviceStatus(S, LIVE, A, 'r89')).retest.length, 0, 'r89 is older than the fix');
  assert.equal((await T.deviceStatus(S, LIVE, A, 'r89.1')).retest.length, 1, 'on the fixed version: replay it');
  assert.equal((await T.deviceStatus(S, LIVE, A, 'r90')).retest.length, 1, 'newer than the fix');
  await T.addReport(S, LIVE, { ...rep(A), b: 'r90' }); assert.equal((await T.problems(S)).find(p => p.k === a.k).status, 'back');
  const { statusFromIssue } = await import('../../tools/tester-issues.mts');
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'Fixed in r89.1.' }]), { fixedIn: 'r89.1' });
});

test('v numbers from r91 on (owner, 24 Oct 2026 AEDT): v1.01, v1.02 ... v2.00, newer than every r build', async () => {
  const B = await import('../../netlify/lib/build-number.mts');
  for (const ok of ['r67', 'r89.1', 'r90', 'v1.01', 'v1.99', 'v2.00']) assert.ok(B.isBuild(ok), ok);
  for (const bad of ['v1', 'v1.1', 'v1.001', '1.01', 'r', 'v1.01x', '']) assert.ok(!B.isBuild(bad), bad);
  const order = ['r83', 'r89', 'r89.1', 'r90', 'v1.01', 'v1.09', 'v1.10', 'v1.99', 'v2.00'];
  assert.deepEqual([...order].sort(() => Math.random() - .5).sort((a, b) => B.buildRank(a) - B.buildRank(b)), order);
  assert.equal(B.rankBefore(B.buildRank('v1.02')), B.buildRank('v1.01'));
  assert.equal(B.rankBefore(B.buildRank('v1.01')), B.buildRank('r90'), 'the build before v1.01 is r90 (shown as v1)');
  const { recentEnough } = await import('../../tools/tester-issues.mts');
  assert.equal(recentEnough(['r90'], B.buildRank('v1.01')), true); assert.equal(recentEnough(['r89.1'], B.buildRank('v1.01')), false);
  // a problem fixed in v1.01 that a device reports again on v1.02 comes back; one from r90 does not
  const S = mem(), a = await T.addReport(S, LIVE, { ...rep(A), b: 'r90' });
  await T.setProblem(S, a.k, { fixedIn: 'v1.01' });
  await T.addReport(S, LIVE, { ...rep(A), b: 'r90' }); assert.equal((await T.problem(S, a.k)).status, 'fixed');
  await T.addReport(S, LIVE, { ...rep(A), b: 'v1.02' }); assert.equal((await T.problem(S, a.k)).status, 'back');
});

test('an issue closed with "Fixed in v1.01." is fixed in v1.01', async () => {
  const { statusFromIssue } = await import('../../tools/tester-issues.mts');
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'Fixed in v1.01.' }]), { fixedIn: 'v1.01' });
  assert.deepEqual(statusFromIssue({ state: 'closed', state_reason: 'completed' }, [{ body: 'Fixed in v2.00, thanks' }]), { fixedIn: 'v2.00' });
});

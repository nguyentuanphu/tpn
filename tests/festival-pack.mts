// Check `festivalpack` (v1.08c voices, brief part 3): festival packs download ahead and go away after.
// A made-up voice pack holds one festival's lines (its name and what its host says), in English and Vietnamese:
//   1. a month before its decorations nothing of it downloads;
//   2. a few days before the decorations, on mobile data it waits; on Wi-Fi every line downloads and is kept;
//   3. on Light the pack stays while it is due (Light frees everything else), and is removed after the festival;
//   4. on Full it is kept after the festival.
import { open, clear } from './harness.mts';
import { FESTCAL } from '../js/content/festcal.js';
import { lineHash } from '../js/packhash.js';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };
const DAY = 864e5;

export async function festivalPackCheck(b) {
  // every festival's lines in the made-up pack (the check picks one that is not due today, so the game's own run at start
  // leaves it alone)
  const lines: Record<string, Record<string, string>> = { en: {}, vi: {} }, owner = new Map<string, string>();
  for (const F of FESTCAL as any[]) for (const [en, vi] of [[F.en, F.vi], ...(F.lines || [])]) { for (const [L, t] of [['en', en], ['vi', vi]]) { if (!t) continue; const h = lineHash(L, t); lines[L][h] = 'f'; owner.set(L + '/' + h, F.id); } }
  const requests: string[] = [];
  const P = await open(b, { w: 390, h: 844, touch: true, settings: { autoPack: false, lang: 'en', bilingual: true, voice: false }, pre: () => {
    const c = new EventTarget() as any; c.type = 'cellular'; c.saveData = false; Object.defineProperty(navigator, 'connection', { get: () => c, configurable: true });
    (window as any).__setNet = (t: string) => { c.type = t; };
  }, route: async ctx => {
    await ctx.route('**/voices/areas.json', r => r.fulfill({ json: { made: 'festival-pack', groups: { core: '' }, size: { core: { en: 1, vi: 1 } } } }));
    await ctx.route('**/voices/manifest-*.json', r => { const L = /manifest-(\w+)/.exec(r.request().url())[1];
      return r.fulfill({ json: { version: 2, language: L, made: 'festival-pack', signature: 'festival-pack-' + L, formats: ['mp3'], areas: 1, lines: lines[L] || {}, other: L === 'en' ? {} : { [L]: Object.keys(lines[L] || {}).join(' ') }, tpl: {}, cast: {}, voices: {} } }); });
    await ctx.route('**/voices/manifest.json', r => r.fulfill({ status: 404, body: '' }));
    await ctx.route(/\/voices\/(en|vi)\/f\/[\w-]+\.(mp3|opus)$/, r => { requests.push(r.request().url()); return r.fulfill({ contentType: 'audio/mpeg', body: Buffer.alloc(3000, 1) }); });
  } });
  try {
    await clear(P.page);
    const pick = await P.page.evaluate(async () => {
      (window as any).__sv.paused = true;
      const V = await import(String('/js/voice.js')); for (let i = 0; i < 80 && !(V.voicePack()?.signatures?.en && V.voicePack()?.signatures?.vi); i++) await new Promise(r => setTimeout(r, 250));
      if (!V.voicePack()) { await V.resumePackDownload().catch(() => { }); }
      const Fm = await import(String('/js/festivals.js')), VP = await import(String('/js/voicepack.js'));
      const n = Fm.upcoming(new Date()).find(x => x.F.lines && x.F.lines.length >= 2 && x.daysTo > Fm.buildupOf(x.F) + VP.FEST_AHEAD + 2);
      return n ? { id: n.F.id, start: +n.start, end: +n.end, buildup: Fm.buildupOf(n.F), ahead: VP.FEST_AHEAD, pack: !!V.voicePack() } : null;
    });
    ok(pick && pick.pack, 'no festival to try, or the voice pack did not load: ' + JSON.stringify(pick));
    const mine = (u: string) => { const m = /\/voices\/(en|vi)\/f\/([\w-]+)\./.exec(u); return !!m && owner.get(m[1] + '/' + m[2]) === pick.id; };
    const run = (at: number) => P.page.evaluate(async at => { const V = await import(String('/js/voice.js')), VP = await import(String('/js/voicepack.js')); return VP.festivalPacks(V.voicePack(), new Date(at)); }, at);
    const keptMine = async () => (await P.page.evaluate(async () => [...await (await import(String('/js/voicestore.js'))).voiceStore('sv-voices').keys()])).filter(k => mine('/' + k)).length;
    const record = () => P.page.evaluate(async id => (await import(String('/js/state.js'))).settings.festPacks?.[id] || null, pick.id);
    const decorFrom = pick.start - pick.buildup * DAY;
    // 1. a month before the decorations
    const r1 = await run(decorFrom - 30 * DAY);
    ok(!r1.due.includes(pick.id) && !requests.some(mine), `a month ahead the ${pick.id} pack was due or downloaded: ${JSON.stringify(r1)}`);
    // 2. two days before the decorations: on mobile data it waits, on Wi-Fi it downloads
    const r2 = await run(decorFrom - 2 * DAY);
    ok(r2.due.includes(pick.id) && !requests.some(mine) && !(await record()), `on mobile data the ${pick.id} pack downloaded: ${JSON.stringify(r2)}`);
    await P.page.evaluate(() => (window as any).__setNet('wifi'));
    const r3 = await run(decorFrom - 2 * DAY), want = (await record())?.files?.length || 0, got = await keptMine();
    ok(r3.due.includes(pick.id) && want >= 4 && got === want && requests.filter(mine).length === want, `on Wi-Fi the ${pick.id} pack: ${JSON.stringify({ r3, want, got, asked: requests.filter(mine).length })}`);
    // 3. Light keeps it while it is due, and removes it after the festival
    await P.page.evaluate(async () => (await import(String('/js/voicepack.js'))).setOfflineLevel('light'));
    ok(await keptMine() === want, 'Light removed a festival pack that is due');
    const r4 = await run(pick.end + DAY);
    ok(r4.freed > 0 && await keptMine() === 0 && !(await record()), `after the festival on Light: ${JSON.stringify({ r4, kept: await keptMine() })}`);
    // 4. Full keeps it after the festival
    await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); S.settings.offlineLevel = 'full'; S.settings.autoPack = true; });
    await run(decorFrom - 2 * DAY);
    const r5 = await run(pick.end + DAY);
    ok(await keptMine() === want && r5.freed === 0, `after the festival on Full: ${JSON.stringify({ r5, kept: await keptMine(), want })}`);
    ok(!P.errors.length, P.errors.join(' | '));
    return `${pick.id}: nothing a month ahead; ${pick.ahead} days before its decorations it waits on mobile data and downloads its ${want} recordings on Wi-Fi; Light keeps it while due and removes it after; Full keeps it`;
  } finally { await P.ctx.close(); }
}

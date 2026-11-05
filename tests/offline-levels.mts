// Check `offlinelevels` (v1.08c voices, brief part 2): the three offline levels in Grown-ups → Sound and voices.
// The game runs with a small made-up voice pack (four areas, tiny recordings) so every download finishes in seconds:
//   1. A device on MP3 that keeps every recording (as Full did before): Grown-ups shows Light, Automatic and Full with the
//      space each takes and what the device keeps now, in English and Vietnamese, on a phone (portrait and landscape), a
//      tablet and a computer: buttons 64 px or more, text 16 px or more, nothing off the screen.
//   2. Light: the device moves to Opus, every MP3 and every recording outside the core and the child's area is removed at
//      once (the space comes back), then only the core and that area download; moving to a big new area makes room by
//      dropping the old one.
//   3. Full: everything downloads; Automatic from Full frees the game lines and keeps the core and the places visited.
import { open, clear } from './harness.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };
// the made-up pack: line ids by area; sizes are MP3 bytes as in voices/areas.json (lake and village are big, so both do
// not fit in Light together)
const AREAS = { core: 12, lake: 6, village: 6, games: 30 };
const ids = Object.fromEntries(Object.entries(AREAS).map(([g, n]) => [g, Array.from({ length: n }, (_, i) => `ol${g}${i}`)]));
const groupOf = new Map<string, string>(); for (const [g, hs] of Object.entries(ids)) for (const h of hs) groupOf.set(h, g);
const MB = 1048576, SIZE = { core: { en: 8 * MB }, lake: { en: 60 * MB }, village: { en: 60 * MB }, games: { en: 140 * MB } };
const all = Object.values(ids).flat();

async function openPack(b, view: { w: number, h: number, touch: boolean }, lang: 'en' | 'vi') {
  const requests: string[] = [];
  const P = await open(b, { ...view, lang, settings: { autoPack: false, lang, bilingual: false, voice: false }, pre: () => {
    const c = new EventTarget() as any; c.type = 'wifi'; c.saveData = false; Object.defineProperty(navigator, 'connection', { get: () => c, configurable: true });
  }, route: async ctx => {
    await ctx.route('**/voices/areas.json', r => r.fulfill({ json: { made: 'offline-levels', groups: Object.fromEntries(Object.entries(ids).map(([g, hs]) => [g, hs.join(' ')])), size: SIZE } }));
    await ctx.route('**/voices/manifest-*.json', r => { const L = /manifest-(\w+)/.exec(r.request().url())[1];
      return r.fulfill({ json: { version: 2, language: L, made: 'offline-levels', signature: 'offline-levels-' + L, formats: ['mp3', 'opus'], areas: 1, lines: L === 'en' ? Object.fromEntries(all.map(h => [h, 'f'])) : {}, other: {}, tpl: {}, cast: {}, voices: {} } }); });
    await ctx.route('**/voices/manifest.json', r => r.fulfill({ status: 404, body: '' }));
    await ctx.route(/\/voices\/en\/f\/ol\w+\.(mp3|opus)$/, r => { requests.push(r.request().url()); return r.fulfill({ contentType: 'audio/ogg', body: Buffer.alloc(2000, 1) }); });
  } });
  await clear(P.page);
  await P.page.evaluate(async () => { (window as any).__sv.paused = true; const V = await import(String('/js/voice.js')); for (let i = 0; i < 80 && !V.voicePack()?.signatures?.en; i++) await new Promise(r => setTimeout(r, 250)); });
  return { P, requests };
}
const kept = P => P.page.evaluate(async () => { const s = (await import(String('/js/voicestore.js'))).voiceStore('sv-voices'); await s.flush(); return { keys: [...await s.keys()].filter(k => /\/ol\w+\./.test(k)), bytes: await s.bytes() }; });
const name = (k: string) => { const m = /\/(ol\w+)\.(mp3|opus)/.exec(k); return m ? { h: m[1], g: groupOf.get(m[1]), ext: m[2] } : null; };
const openSound = async P => {
  await P.page.evaluate(async () => (await import(String('/js/ui.js'))).openGrownups());
  await P.page.waitForSelector('.grownups .offlvl', { state: 'attached' });
  await P.page.evaluate(() => { let d = document.querySelector('.grownups .offlvl')?.closest('details'); while (d) { (d as HTMLDetailsElement).open = true; d = d.parentElement?.closest('details'); } document.querySelector('.grownups .offlvl')?.scrollIntoView({ block: 'center' }); });
  await P.page.waitForSelector('.grownups .offlvl');
  await P.page.waitForFunction(() => /MB/.test(document.querySelector('#xLvlInfo')?.textContent || '') && !/…/.test(document.querySelector('[data-sz="light"]')?.textContent || ''), null, { timeout: 20000 });
};
const waitKeys = async (P, test: (ks: ReturnType<typeof name>[]) => boolean, ms = 60000) => { let last = null; for (let t = 0; t < ms / 500; t++) { last = (await kept(P)).keys.map(name); if (test(last)) return last; await P.page.waitForTimeout(500); } return last; };
const enter = (P, place: string) => P.page.evaluate(async place => { const { events } = await import(String('/js/core/events.js')); events.emit('PlayerEnteredVillage', { playerId: 'player:test', villageId: 'place:' + place }); }, place);

export async function offlineLevelsCheck(b) {
  const notes: string[] = [];
  // 1. the screen on every device, both languages
  const views = [['phone', { w: 390, h: 844, touch: true }, 'en'], ['phone-landscape', { w: 844, h: 390, touch: true }, 'vi'], ['tablet', { w: 820, h: 1180, touch: true }, 'vi'], ['computer', { w: 1366, h: 800, touch: false }, 'en']] as const;
  for (const [tag, view, lang] of views) {
    const { P } = await openPack(b, view, lang);
    try {
      await openSound(P);
      const m = await P.page.evaluate(() => { const bs = [...document.querySelectorAll('.offlvl-b')] as HTMLElement[], W = innerWidth;
        return { n: bs.length, on: bs.filter(x => x.classList.contains('on')).map(x => x.dataset.lvl), minH: Math.min(...bs.map(x => x.getBoundingClientRect().height)), minW: Math.min(...bs.map(x => x.getBoundingClientRect().width)),
          out: bs.filter(x => { const r = x.getBoundingClientRect(); return r.left < -1 || r.right > W + 1; }).length,
          font: Math.min(...bs.flatMap(x => [...x.querySelectorAll('b, span')].map(e => parseFloat(getComputedStyle(e).fontSize)))),
          text: bs.map(x => x.textContent).join(' | '), info: document.querySelector('#xLvlInfo').textContent }; });
      await P.page.screenshot({ path: `out/offlinelevels-${tag}.png` });
      const words = lang === 'vi' ? /Nhẹ.*Tự động.*Đầy đủ/ : /Light.*Automatic.*Full/;
      ok(m.n === 3 && m.on.join() === 'auto' && m.minH >= 64 && m.minW >= 44 && !m.out && m.font >= 16 && words.test(m.text) && /MB/.test(m.text), `${tag}: the levels ${JSON.stringify(m)}`);
      ok(!P.errors.length, `${tag}: ` + P.errors.join(' | '));
    } finally { await P.ctx.close(); }
  }
  notes.push('the three levels fit on a phone (portrait and landscape), a tablet and a computer, in English and Vietnamese');

  // 2. a device on MP3 that keeps everything moves to Light
  const { P, requests } = await openPack(b, { w: 390, h: 844, touch: true }, 'en');
  try {
    await P.page.evaluate(async all => { const s = (await import(String('/js/voicestore.js'))).voiceStore('sv-voices'); for (const h of all) await s.add(`voices/en/f/${h}.mp3`, new Uint8Array(4000).buffer); await s.flush(); }, all);
    const before = await kept(P);
    ok(before.keys.length === all.length, 'the made-up MP3 recordings were not kept: ' + before.keys.length);
    await enter(P, 'lake');
    await openSound(P);
    const sizes = await P.page.evaluate(() => ({ light: document.querySelector('[data-sz="light"]').textContent, full: document.querySelector('[data-sz="full"]').textContent, info: document.querySelector('#xLvlInfo').textContent }));
    // (Light on Opus: core 8 MB + lake 60 MB, at 45% = about 31 MB; Full: 268 MB at 45%, as this MP3 device may move)
    ok(/About 31 MB/.test(sizes.light) && /About (121|268) MB/.test(sizes.full) && /0\.\d MB|\d MB/.test(sizes.info), 'the sizes shown: ' + JSON.stringify(sizes));
    await P.page.click('.offlvl-b[data-lvl="light"]');
    await P.page.waitForFunction(() => /Freed/.test(document.querySelector('#xLvlInfo')?.textContent || ''), null, { timeout: 30000 });
    const freedText = await P.page.$eval('#xLvlInfo', e => e.textContent);
    const after = await kept(P), fmt = await P.page.evaluate(() => localStorage.getItem('sv2_voiceFmt'));
    ok(fmt === 'opus' && after.keys.every(k => !k.endsWith('.mp3')) && after.bytes < before.bytes, `Light did not move to Opus or free the MP3s: ${fmt}, ${after.keys.length} kept, ${before.bytes} -> ${after.bytes} bytes`);
    await P.page.click('.grownups #gDone');
    const light = await waitKeys(P, ks => ks.length === AREAS.core + AREAS.lake);
    const lightGroups = [...new Set(light.map(k => k.g))].sort().join();
    ok(lightGroups === 'core,lake' && light.every(k => k.ext === 'opus') && requests.every(u => /\.opus$/.test(u) && ['core', 'lake'].includes(name(u).g)), `Light kept or fetched more than the core and the child's area: ${lightGroups}, ${light.length} files; asked for ${JSON.stringify(requests.map(u => name(u)).filter(x => !['core', 'lake'].includes(x.g)).slice(0, 4))}`);
    const s1 = await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); return { level: S.settings.offlineLevel, saved: S.settings.packSaved || null, recent: S.settings.packRecent }; });
    ok(s1.level === 'light' && !s1.saved && s1.recent[0] === 'lake', 'the settings after Light: ' + JSON.stringify(s1));
    notes.push(`Light: an MP3 device moved to Opus and freed space at once ("${freedText}"), then kept only the core and the child's area (${light.length} files)`);
    // the child walks to a big new area: it downloads, the old big area makes room
    const n0 = requests.length;
    await enter(P, 'village');
    const moved = await waitKeys(P, ks => ks.some(k => k.g === 'village') && ks.filter(k => k.g === 'village').length === AREAS.village && !ks.some(k => k.g === 'lake'));
    ok([...new Set(moved.map(k => k.g))].sort().join() === 'core,village' && requests.slice(n0).every(u => name(u).g === 'village'), 'moving to the village on Light: ' + JSON.stringify([...new Set(moved.map(k => k.g))]) + ' asked ' + JSON.stringify(requests.slice(n0).map(u => name(u).g)));
    notes.push('a new area on Light downloads when the child goes there, and the old one makes room');

    // 3. Full: everything; then Automatic frees the game lines and keeps the core and the places visited
    await openSound(P);
    await P.page.click('#xPackSave');
    const full = await waitKeys(P, ks => ks.length === all.length);
    const s2 = await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); return { level: S.settings.offlineLevel, auto: S.settings.autoPack, on: document.querySelector('.offlvl-b.on')?.getAttribute('data-lvl') }; });
    ok(full.length === all.length && full.every(k => k.ext === 'opus') && s2.level === 'full' && s2.auto === true && s2.on === 'full', 'Full: ' + JSON.stringify({ kept: full.length, of: all.length, ...s2 }));
    notes.push(`Full: all ${all.length} recordings`);
    await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); S.profiles[0].visited = { ...(S.profiles[0].visited || {}), lake: 1 }; });
    const bFull = (await kept(P)).bytes;
    await P.page.click('.offlvl-b[data-lvl="auto"]');
    await P.page.waitForFunction(() => /Freed/.test(document.querySelector('#xLvlInfo')?.textContent || ''), null, { timeout: 30000 });
    const auto = await kept(P), groups = [...new Set(auto.keys.map(k => name(k).g))].sort().join();
    const s3 = await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); return { level: S.settings.offlineLevel, auto: S.settings.autoPack }; });
    ok(groups === 'core,lake,village' && auto.bytes < bFull && s3.level === 'auto' && s3.auto === false, `Automatic from Full kept ${groups} (${bFull} -> ${auto.bytes} bytes), settings ${JSON.stringify(s3)}`);
    await P.page.waitForTimeout(8000);
    const still = await kept(P);
    ok(still.keys.length === auto.keys.length, `Automatic downloaded everything again: ${auto.keys.length} -> ${still.keys.length}`);
    notes.push('Automatic from Full freed the game lines and kept the core and the places visited, and did not download them again');
    ok(!P.errors.length, P.errors.join(' | '));
  } finally { await P.ctx.close(); }
  return notes.join('; ');
}

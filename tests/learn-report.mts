// (v1.08c parents) checks `learningreport` and `subjectlevel` (js/content/subjects.ts, js/learnreport.ts, js/report.ts).
//   learningreport: real games counted per subject; Grown-ups → Learning on a phone (portrait and landscape), a tablet
//     and a computer, in English and Vietnamese: the five subjects, what went well and a suggested game that is open for
//     the child; touch targets 44 px, text 16 px, our own pictures, nothing off screen; the picture is a PNG made on the
//     device with no request leaving it.
//   subjectlevel: the subject of each kind of game; good wins in Maths make Maths harder while quits make English
//     easier for the same child; a real game starts at that level; the grown-up's own level wins (and forgets the
//     child's earlier pick); under-5s stay where they are.
import { open, clear } from './harness.mts';

const ok = (c: unknown, m: string) => { if (!c) throw new Error(m); };
const BIG = `(() => { try { const p = JSON.parse(localStorage.getItem('sv2_profiles') || '[]'); if (p[0] && !p[0].lrSeeded) { p[0].age = 'big'; p[0].difficulty = 'medium'; p[0].lrSeeded = 1; localStorage.setItem('sv2_profiles', JSON.stringify(p)); } } catch (e) { } })();`;

// play real games through the event bus the way js/main.ts reports them
const playAs = (page, list: [string, boolean, number][]) => page.evaluate(async list => {
  const E = await import(String('/js/core/events.js')), I = await import(String('/js/core/ids.js'));
  const pid = I.id('player', window.__sv.heroes[0].profile.id);
  let n = 0;
  for (const [id, won, stars] of list) {
    const act = I.id('act', id, 'lr' + (++n));
    E.events.emit('ActivityStarted', { activityId: act, kind: 'game', defId: I.id('game', id), players: [pid], source: 'hub' });
    if (won) E.events.emit('ActivityCompleted', { activityId: act, defId: I.id('game', id), players: [pid], result: { won: true, stars, level: 2 } });
    else E.events.emit('ActivityAbandoned', { activityId: act, reason: 'left' });
  }
}, list);

export async function learningReportCheck(b) {
  const sizes = [['phone', 390, 760, true], ['phone-land', 760, 390, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]] as const;
  const shots: string[] = [], out: string[] = [];
  for (const [name, w, h, touch] of sizes) for (const lang of ['en', 'vi']) {
    const P = await open(b, { w, h, touch, lang, pre: BIG }); await clear(P.page);
    const away: string[] = []; P.page.on('request', r => { if (!/^(http:\/\/(localhost|127\.0\.0\.\d)|data:|blob:)/.test(r.url())) away.push(r.url()); });
    if (name === 'phone' && lang === 'en') {
      await playAs(P.page, [['counting', true, 3], ['counting', true, 3], ['sums', true, 2], ['vi_tones', true, 3], ['en_words', false, 0], ['goat', true, 3]]);
      const d = await P.page.evaluate(async () => { const R = await import(String('/js/report.js')); const p = window.__sv.heroes[0].profile; return p.stats.days[R.dayKey()]; });
      ok(d && d.sub && d.sub.math && d.sub.math[0] === 3 && d.sub.math[1] === 3 && d.sub.vi[1] === 1 && d.sub.en[0] === 1 && d.sub.en[1] === 0 && !d.sub.vietnam, 'games were not counted per subject: ' + JSON.stringify(d && d.sub));
      ok(d.gp.counting[0] === 2 && d.gp.counting[2] === 3, 'the games of the day were not counted: ' + JSON.stringify(d.gp));
    } else await playAs(P.page, [['counting', true, 3], ['counting', true, 3], ['vi_tones', true, 2]]);
    await P.page.evaluate(() => import(String('/js/ui.js')).then(m => m.openGrownups()));
    await P.page.waitForSelector('.modal.grownups .gsec.learn', { timeout: 20000 });
    await P.page.evaluate(() => { const d = document.querySelector('.gsec.learn') as HTMLDetailsElement; d.open = true; d.scrollIntoView(); });
    await P.page.waitForTimeout(300);
    const g = await P.page.evaluate(() => { const sec = document.querySelector('.gsec.learn'), box = (e: Element) => e.getBoundingClientRect();
      return { text: sec.textContent, selects: sec.querySelectorAll('select[data-subj]').length,
        small: [...sec.querySelectorAll('button, select')].map(e => ({ t: (e.textContent || '').trim().slice(0, 20), h: box(e).height, w: box(e).width })).filter(x => x.h && (x.h < 44 || x.w < 44)),
        over: [...sec.querySelectorAll('*')].some(e => box(e).width && box(e).right > innerWidth + 1) }; });
    ok(g.selects === 5, `${name} ${lang}: the levels by subject are missing for the big child (${g.selects} of 5)`);
    ok(lang === 'vi' ? /Học tập: báo cáo và cấp độ theo môn[\s\S]*Theo bé/.test(g.text) : /Learning: report and levels by subject[\s\S]*Follow the child/.test(g.text), `${name} ${lang}: the Grown-ups part is not in the language shown`);
    ok(!g.small.length, `${name} ${lang}: touch targets under 44 px in Grown-ups → Learning: ${JSON.stringify(g.small)}`);
    ok(!g.over, `${name} ${lang}: Grown-ups → Learning runs off the screen`);
    await P.page.click('.gsec.learn [data-lrep]');
    await P.page.waitForSelector('.modal.learnrep', { timeout: 10000 }); await P.page.waitForTimeout(400);
    const r = await P.page.evaluate(() => { const m = document.querySelector('.modal.learnrep'), card = m.querySelector('.card'), box = (e: Element) => e.getBoundingClientRect();
      const texts = [...card.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.textContent || '')) && box(e).width && !e.closest('svg'));
      return { rows: [...m.querySelectorAll('.lr-row')].map(e => [...e.querySelectorAll('b, small, .lr-lv')].map(x => x.textContent).join(' ').replace(/\s+/g, ' ').trim()), well: m.querySelectorAll('.lr-well li').length, sug: (m.querySelector('.lr-sug') as HTMLElement)?.dataset.g || '',
        emo: m.querySelectorAll('.emo').length, arts: m.querySelectorAll('.lr-ic .art').length,
        small: [...card.querySelectorAll('button')].map(e => ({ t: (e.textContent || '').trim().slice(0, 20), h: box(e).height, w: box(e).width })).filter(x => x.h && (x.h < 44 || x.w < 44)),
        tiny: texts.map(e => ({ t: (e.textContent || '').trim().slice(0, 20), px: parseFloat(getComputedStyle(e).fontSize) })).filter(x => x.px < 16 && x.t !== '✕'),
        over: document.documentElement.scrollWidth > innerWidth + 1 || [...card.querySelectorAll('*')].some(e => box(e).width && box(e).right > innerWidth + 1) }; });
    const names = lang === 'vi' ? ['Tiếng Việt', 'Tiếng Anh', 'Toán', 'Khoa học', 'Tiền'] : ['Vietnamese', 'English', 'Maths', 'Science', 'Money'];
    ok(r.rows.length === 5 && names.every((n, i) => r.rows[i].startsWith(n)), `${name} ${lang}: the five subjects are not listed: ${JSON.stringify(r.rows)}`);
    ok(/[23] (games|trò)/.test(r.rows[2]), `${name} ${lang}: Maths does not show this week's games: ${r.rows[2]}`);
    ok(r.well >= 1, `${name} ${lang}: nothing under What went well`);
    ok(r.sug, `${name} ${lang}: no game suggested for next week`);
    ok(!r.emo && r.arts >= 6, `${name} ${lang}: a picture that is not our own drawing (${r.emo} emoji, ${r.arts} drawings)`);
    ok(!r.small.length, `${name} ${lang}: touch targets under 44 px in the report: ${JSON.stringify(r.small)}`);
    ok(!r.tiny.length, `${name} ${lang}: text under 16 px in the report: ${JSON.stringify(r.tiny.slice(0, 4))}`);
    ok(!r.over, `${name} ${lang}: the report runs off the screen`);
    const sug = await P.page.evaluate(async id => { const S = await import(String('/js/content/subjects.js')), F = await import(String('/js/games/frame.js')); const p = window.__sv.heroes[0].profile; return { s: S.subjectOf(id), open: F.canStartGame(id, [p]) }; }, r.sug);
    ok(sug.s && sug.s !== 'math' && sug.open, `${name} ${lang}: the suggestion ${r.sug} is not a game of a quiet subject that is open (${JSON.stringify(sug)})`);
    const file = `out/learningreport-${name}-${lang}.png`; await P.page.screenshot({ path: file }); shots.push(file);
    if (name === 'computer') {
      const [dl] = await Promise.all([P.page.waitForEvent('download', { timeout: 15000 }), P.page.click('.learnrep [data-share]')]);
      const path = `out/learningreport-picture-${lang}.png`; await dl.saveAs(path);
      const fs = await import('fs'), head = fs.readFileSync(path).subarray(0, 8).toString('hex');
      ok(head === '89504e470d0a1a0a', `${lang}: the shared picture is not a PNG`); shots.push(path);
      ok(!away.length, `${lang}: a request left the device while making the report: ${away.slice(0, 3).join(', ')}`);
    }
    if (P.errors.length) out.push(`${name} ${lang}: ${P.errors.slice(0, 2).join(' | ')}`);
    await P.ctx.close();
  }
  ok(!out.length, 'page errors: ' + out.join('; '));
  return `games counted per subject (Maths 3, Vietnamese 1, English 1 left, a Vietnamese folk game in none); Grown-ups → Learning and the report on phone (portrait and landscape), tablet and computer in English and Vietnamese: five subjects, what went well, an open game of a quiet subject suggested, 44 px targets, 16 px text, our own pictures, nothing off screen; the picture is a PNG made with nothing sent. Screenshots: ${shots.join(', ')}`;
}

export async function subjectLevelCheck(b) {
  const P = await open(b, { w: 1024, h: 768, pre: BIG }); await clear(P.page);
  try {
    const u = await P.page.evaluate(async () => { const S = await import(String('/js/content/subjects.js'));
      return Object.fromEntries(['vi_tones', 'letters', 'en_words', 'rd_blend', 'phonics', 'counting', 'mx_bonds', 'solids', 'sci_float', 'heodat', 'shoppay', 'goat', 'bunny'].map(id => [id, S.subjectOf(id)])); });
    const want = { vi_tones: 'vi', letters: 'vi', en_words: 'en', rd_blend: 'en', phonics: 'en', counting: 'math', mx_bonds: 'math', solids: 'math', sci_float: 'sci', heodat: 'money', shoppay: 'money', goat: null, bunny: null };
    ok(JSON.stringify(u) === JSON.stringify(want), 'subjects of games: ' + JSON.stringify(u));
    // strong in Maths, new to English: six good Maths wins, three English games left
    await playAs(P.page, [...Array(6)].map(() => ['counting', true, 3] as [string, boolean, number]).concat([['en_words', false, 0], ['en_words', false, 0], ['en_listen', true, 1]]));
    const lv = await P.page.evaluate(async () => { const S = await import(String('/js/content/subjects.js')); const p = window.__sv.heroes[0].profile;
      return { math: S.levelFor(p, 'counting'), en: S.levelFor(p, 'en_words'), vi: S.levelFor(p, 'vi_tones'), other: S.levelFor(p, 'goat'), auto: JSON.stringify(p.subjAuto) }; });
    ok(lv.math === 'hard' && lv.en === 'easy' && lv.vi === 'medium' && lv.other === 'medium', 'the level does not follow the child per subject: ' + JSON.stringify(lv));
    // a real game starts at the subject's level (Hard: tier 3)
    const tierOf = async (id: string) => { await P.page.evaluate(id => { window.__sv.playGame(0, id, 'hub'); }, id);
      await P.page.waitForSelector(`.gl[data-game-id="${id}"]`, { timeout: 20000 }); const t = await P.page.evaluate(() => (document.querySelector('.gl') as HTMLElement).dataset.tier);
      await P.page.evaluate(async () => { const F = await import(String('/js/games/frame.js')); F.closeGame ? F.closeGame() : (document.querySelector('.gl .gl-x, .gl [data-close], .gl .x') as HTMLElement)?.click(); });
      await P.page.waitForFunction(() => !document.querySelector('.gl'), null, { timeout: 10000 }).catch(() => { }); await clear(P.page); return t; };
    const t1 = await tierOf('counting');
    ok(t1 === '3', 'a Maths game did not start at Hard for a child strong in Maths: tier ' + t1);
    // the grown-up's own level wins, in Grown-ups, and forgets the child's own earlier pick in that subject
    await P.page.evaluate(() => { const p = window.__sv.heroes[0].profile; p.gameDiff = { counting: 'talent', vi_tones: 'hard' }; });
    await P.page.evaluate(() => import(String('/js/ui.js')).then(m => m.openGrownups()));
    await P.page.waitForSelector('.modal.grownups .gsec.learn', { timeout: 20000 });
    await P.page.evaluate(() => { (document.querySelector('.gsec.learn') as HTMLDetailsElement).open = true; });
    const id0 = await P.page.evaluate(() => window.__sv.heroes[0].profile.id);
    await P.page.selectOption(`select[data-subj="${id0}|math"]`, 'easy');
    const pin = await P.page.evaluate(async () => { const S = await import(String('/js/content/subjects.js')); const p = window.__sv.heroes[0].profile;
      return { pin: JSON.stringify(p.subjPin), math: S.levelFor(p, 'counting'), gd: JSON.stringify(p.gameDiff), saved: JSON.parse(localStorage.getItem('sv2_profiles') || '[]')[0].subjPin }; });
    ok(pin.math === 'easy' && pin.gd === '{"vi_tones":"hard"}' && pin.saved && pin.saved.math === 'easy', "the grown-up's level does not win: " + JSON.stringify(pin));
    await P.page.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
    await clear(P.page);
    const t2 = await tierOf('counting');
    ok(t2 === '1', "a Maths game did not start at the grown-up's Easy: tier " + t2);
    // more good wins never move past the grown-up's level; "Follow the child" again gives the automatic level back
    await playAs(P.page, [...Array(6)].map(() => ['sums', true, 3] as [string, boolean, number]));
    const back = await P.page.evaluate(async () => { const S = await import(String('/js/content/subjects.js')); const p = window.__sv.heroes[0].profile; const a = S.levelFor(p, 'sums'); S.setPin(p, 'math', ''); return [a, S.levelFor(p, 'sums')]; });
    ok(back[0] === 'easy' && back[1] === 'hard', 'pin and follow: ' + JSON.stringify(back));
    // under-5s stay where they are
    const little = await P.page.evaluate(async () => { const S = await import(String('/js/content/subjects.js')); const p = { age: 'little', difficulty: 'easy' }; for (let k = 0; k < 6; k++) S.noteResult(p, 'counting', 3); return [S.levelFor(p, 'counting'), JSON.stringify(p.subjAuto || null)]; });
    ok(little[0] === 'easy' && little[1] === 'null', 'an under-5 was moved: ' + JSON.stringify(little));
    // Talent is never reached by itself
    const top = await P.page.evaluate(async () => { const S = await import(String('/js/content/subjects.js')); const p = { age: 'big', difficulty: 'hard' }; for (let k = 0; k < 30; k++) S.noteResult(p, 'counting', 3); return S.levelFor(p, 'counting'); });
    ok(top === 'hard', 'the automatic level went past Hard: ' + top);
    ok(!P.errors.length, 'page errors: ' + P.errors.slice(0, 3).join(' | '));
    return `subjects of 13 games right; six 3-star Maths wins: Maths Hard, three poor English games: English Easy, others Medium; a real Maths game started at tier 3; the grown-up's Easy in Grown-ups won (tier 1, saved, the child's Maths pick forgotten, the Vietnamese one kept) and held after more wins; Follow the child gave Hard back; under-5s unchanged; never Talent by itself`;
  } finally { await P.ctx.close(); }
}

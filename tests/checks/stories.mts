// Sparkle Valley checks: Stories, tales, films and guides.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { open, clear, start, pairKeys, sampled, only, want, pause, check, ok, b } from './shared.mts';

await check('storyposes', async () => (await import('../story-pose-check.mts')).storyPoseCheck(b));

await check('tales', async () => {
  // HANDOFF rule 13: every page of every tale shows drawn pictures and cartoon actors, never a phone emoji
  // (all 38 tales, every page; the first page again in Vietnamese); the tale shelf too
  const P = await open(b, { w: 900, h: 640 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { openTheatre } = await import('/js/tales.js'), S = await import('/js/state.js'), G = __sv, bad = [], RAW = /\p{Extended_Pictographic}/u, OK = new Set(['◀', '▶', '✕', '⏯', '✦']);
    const rawIn = node => { const out = []; const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) for (const ch of t.data) if (RAW.test(ch) && !OK.has(ch)) out.push(ch); return out; };
    let pages = 0;
    for (const lang of ['en', 'vi']) { S.settings.lang = lang;
      for (const tale of G.TALES) {
        // (r82) a tale's words load when it opens, so its theatre appears a moment later
        const done = openTheatre(tale, {}); let m = null; for (let w = 0; w < 60 && !(m = document.querySelector('.theatre')); w++) await new Promise(r => setTimeout(r, 50));
        if (!m) { bad.push(`${tale.id}: the theatre did not open`); continue; }
        for (let k = 0; k < (lang === 'en' ? tale.pages.length : 1); k++) { // (the pictures are the same in both languages)
          await new Promise(r => setTimeout(r, 120)); pages++;
          const where = m.querySelector('.th-stage'), raw = rawIn(where).concat(rawIn(m.querySelector('.th-bar'))), fall = where.querySelectorAll('.emo').length;
          if (raw.length || fall) bad.push(`${tale.id} p${k + 1}: ${raw.join('')} ${fall ? fall + ' undrawn' : ''}`);
          if (k < tale.pages.length - 1 && lang === 'en') m.querySelector('.th-next').click();
        }
        m.querySelector('.th-x').click(); await Promise.race([done, new Promise(r => setTimeout(r, 1500))]); document.querySelectorAll('.theatre').forEach(x => x.remove());
      }
    }
    // the tale shelf
    const shelf = document.createElement('div'); shelf.innerHTML = G.taleShelfHTML(G.heroes[0].profile); const shelfRaw = rawIn(shelf).filter(ch => !/[\u{1F1E6}-\u{1F1FF}]/u.test(ch));
    return { pages, tales: G.TALES.length, bad: bad.slice(0, 15), nbad: bad.length, shelfRaw: shelfRaw.join('') };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.tales >= 38 && !r.nbad && !r.shelfRaw && !errs.length, JSON.stringify(Object.assign(r, { errs })));
  return `${r.tales} tales, ${r.pages} pages: every picture drawn, no phone emoji (the tale shelf too)`;
});

await check('guides', async () => {
  // (owner, 29 Oct 2026 AEDT: "the guide film on each game doesn't do anything") every game's How to play has real steps
  // in both languages (not the lone "Tap and try!" card), each step's pictures are our drawings, and a guide opens
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { GAMES } = await import('/js/games/registry.js'), { HOWTO } = await import('/js/howto-registry.js'); await import('/js/howto-data.js');
    const C = await import('/js/content/films.js'), { hasArt } = await import('/js/art.js'), bad = [];
    for (const id of Object.keys(GAMES)) {
      if (C.GUIDES[id]) continue;
      const h = HOWTO[id], steps = (h && h.steps) || [];
      if (steps.length < 2) { bad.push(id + ': ' + steps.length + ' step(s)'); continue; }
      for (const st of [...steps, h.origin, h.real].filter(Boolean)) {
        if (!st.en || !st.vi || st.en === st.vi) bad.push(id + ': a step not in both languages');
        // (as the player shows them: a word of pictures is drawn whole, or picture by picture; letters and digits stay text)
        const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        for (const e of String(st.pic || '').split(/\s+/).filter(Boolean)) if (!hasArt(e)) for (const { segment: q } of seg.segment(e)) if (/\p{Extended_Pictographic}/u.test(q) && !hasArt(q)) bad.push(id + ': ' + q + ' not drawn');
      }
    }
    const { openHowTo } = await import('/js/howto.js'); await openHowTo('numline', {}); await new Promise(res => setTimeout(res, 2500));
    const m = document.querySelector('.howto'), cap = m && m.querySelector('.ht-cap');
    return { bad, games: Object.keys(GAMES).length, cap: cap ? cap.textContent.trim() : '' };
  });
  await P.ctx.close();
  ok(!r.bad.length, 'guides: ' + r.bad.slice(0, 12).join(' | '));
  ok(r.cap && !/Tap and try/i.test(r.cap), 'the Number Line guide shows its own step, not "Tap and try": ' + r.cap);
  return `${r.games} games, each with a How to play of two or more steps in both languages, pictures drawn`;
});

await check('films', async () => {
  // (round R, owner: "the animations should be detailed and comprehensive, not drawings standing for the scenes")
  // every page of the pilot story and guide films plays to its end, the child's turn waits for a tap, and closing frees it
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const F = await import('/js/film.js'), C = await import('/js/content/films.js'), { MORE_TALES: more } = await import('/js/talesdata.js'), { TALES } = await import('/js/learn.js');
    const MORE_TALES = [...TALES, ...more]; // (Bánh chưng is one of the first tales, in js/learn.js)
    const { openTheatre } = await import('/js/tales.js'), { openHowTo } = await import('/js/howto.js');
    const frame = () => new Promise(r => requestAnimationFrame(r)), out = { films: {}, bad: [] };
    const run = async (id, n) => {
      const f = F.filmNow(); if (!f) { out.bad.push(id + ': no film'); return; }
      let helps = 0;
      for (let k = 0; k < n; k++) {
        const done = f.page(k); let ended = false; done.then(() => { ended = true; });
        const p = f.now; if (!p.root.children.length) out.bad.push(`${id} p${k + 1}: empty set`);
        // before the narrator finishes, the child's turn must not start
        for (let i = 0; i < 400 && !p.waiting && p.t < p.len + 1; i++) { if (p.hold) out.bad.push(`${id} p${k + 1}: asked before the words were read`); p.t += .2; await frame(); }
        if (ended && p.ev.some(e => e.help)) out.bad.push(`${id} p${k + 1}: ended without the child's turn`);
        f.narrated();
        for (let i = 0; i < 600 && !ended; i++) { if (p.hold) { helps++; p.release(true); } p.t += .2; await frame(); }
        if (!ended) out.bad.push(`${id} p${k + 1}: did not end`);
        if (!(p.actors.length || p.root.children.length > 3)) out.bad.push(`${id} p${k + 1}: nobody in it`);
      }
      out.films[id] = { pages: n, helps };
    };
    // (sample: about a third of the films and guides, different ones each run; all when film files change)
    const pickF = (list) => !window.__filmSample ? list : list.filter((id, i) => i % 3 === window.__filmSample % 3);
    for (const id of pickF(Object.keys(C.FILMS))) {
      // (the story's own films come from js/content/chapters.js, the fairy tales from js/talesdata.js)
      const { STORY_TALES } = await import('/js/content/chapters.js'), st = STORY_TALES[id];
      openTheatre(MORE_TALES.find(t => t.id === id) || (st && { ...st, title: () => st.title[0], ctx: { name: 'Na', companion: 'firefly' } }), { name: 'Na' }); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100)); // (loaded when the story opens)
      document.querySelector('.th-pause').click();
      if (!document.querySelector('.theatre.film canvas.th-film')) out.bad.push(id + ': no 3D stage');
      await run(id, C.FILMS[id].pages.length);
      document.querySelector('.th-x').click(); await new Promise(r => setTimeout(r, 400));
      if (F.filmNow() || document.querySelector('canvas.th-film')) out.bad.push(id + ': not freed');
    }
    const gAll = Object.keys(C.GUIDES), gSome = pickF(gAll);   // (guides with a real game playing by itself always run)
    for (const id of gAll.filter(id => C.GUIDES[id].demo || gSome.includes(id))) {
      openHowTo(id, {}); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100)); document.querySelector('.ht-pp').click();
      await run(id, C.GUIDES[id].pages.length);
      // (Kid UI films, 10 Oct) the real game plays its first moves by itself with the glowing hand, then waits for the child
      if (C.GUIDES[id].demo) {
        const m = document.querySelector('.howto'), sleep = ms => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < 12 && !m.querySelector('.ht-demo'); i++) { m.querySelector('.ht-next').click(); await sleep(300); }
        const D = m.__demo; if (!D) { out.bad.push(id + ': the real game does not play by itself'); }
        else {
          if (!m.querySelector('canvas.th-film').hidden) out.bad.push(id + ': the film still shows under the real game');
          for (let i = 0; i < 400 && !D.turn; i++) await sleep(150);
          const hand = m.querySelector('.ht-hand');
          out.demo = out.demo || {}; out.demo[id] = { moves: D.moves, turn: D.turn, pairs: m.querySelectorAll('.ht-demo .mem.got').length, hand: !!hand };
          if (!D.turn) out.bad.push(id + ': the demo did not reach the child\'s turn'); if (D.moves < 2) out.bad.push(id + ': the hand made ' + D.moves + ' moves');
          if (id === 'memory' && !m.querySelector('.ht-demo .mem.got')) out.bad.push('memory: the demo found no pair');
          // the child has a go: two cards, or one shot
          const ev = (e, type, x, y) => e.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 3, bubbles: true }));
          if (id === 'memory') for (const c of [...m.querySelectorAll('.ht-demo .mem:not(.flip)')].slice(0, 2)) { const r = c.getBoundingClientRect(); ev(c, 'pointerup', r.left + 5, r.top + 5); c.click(); await sleep(200); }
          else { const c = m.querySelector('.ht-demo canvas'), r = c.getBoundingClientRect(); ev(c, 'pointerdown', r.left + r.width / 2, r.top + r.height * .86); ev(c, 'pointermove', r.left + r.width / 2, r.top + r.height * .98); ev(c, 'pointerup', r.left + r.width / 2, r.top + r.height * .98); }
          for (let i = 0; i < 200 && m.querySelector('.ht-demo'); i++) await sleep(150);
          if (m.querySelector('.ht-demo')) out.bad.push(id + ': the guide did not go on after the child\'s turn');
          else if (m.querySelector('canvas.th-film').hidden) out.bad.push(id + ': the film did not come back after the real game');
          out.demo[id].taps = D.taps;
        }
      }
      document.querySelector('.ht-x').click(); await new Promise(r => setTimeout(r, 300));
      if (F.filmNow()) out.bad.push(id + ': not freed');
    }
    return out;
  });
  const fails = [...r.bad];
  for (const id of ['duahau', 'thanhgiong', 'banhchung', 'caykhe']) if (r.films[id] ? r.films[id].helps < 2 : !sampled('films')) fails.push(`${id}: the child should help at least twice`);   // (in a sample: the ones that played)
  for (const id of ['marbles', 'memory']) if (!r.demo || !r.demo[id]) fails.push(`${id}: no real game playing by itself`);
  if (P.errors.length) fails.push(...P.errors.slice(0, 3));
  await P.ctx.close();
  if (fails.length) throw new Error(JSON.stringify({ fails, films: r.films }));
  return (sampled('films') ? 'SAMPLE (a third of the films and guides, different each run; all when film files change): ' : '') + Object.entries(r.films).map(([id, f]) => `${id} ${f.pages} pages`).join(', ') + '; the child helps at least twice in each story; the real game plays by itself (' + Object.entries(r.demo).map(([id, d]) => `${id}: ${d.moves} moves with the hand, the child's go`).join(', ') + ')';
});

await check('filmtails', async () => {
  // (owner, 13 Oct: "the narration does not cover the whole scene") no film page goes on in silence after its narrator.
  // Every page of every story film is built and its timeline worked out with the recorded voices (the pack's files are
  // 32 kbit/s, so a file's size gives its length), in English and in Vietnamese, as the theatre plays it (js/tales.js,
  // js/film.js): the page's words start .35 s in; a narration line (S.say) and the child's question (S.help) start at
  // their time, or when the narrator is free; the film stands still while the child is asked (the check taps as soon
  // as the question is said); the page is over .4 s after the film's last move. Silence before a line or at the end may
  // be at most 1.5 s; right after the child's tap (the film's answer to it, with its chime) 3 s.
  const P = await open(b, { w: 1000, h: 700, play: false });
  const r = await P.page.evaluate(async ([est, only]) => {
    const F = await import('/js/film.js'), C = await import('/js/content/films.js'), L = await import('/js/content/talefilms.js');
    await import('/js/content/chapter2films.js'); await import('/js/content/chapter3films.js');
    const { MORE_TALES } = await import('/js/talesdata.js'), { TALES } = await import('/js/learn.js'), { STORY_TALES } = await import('/js/content/chapters.js');
    const { lineHash, packHash } = await import('/js/packhash.js'), { swapNames } = await import('/js/i18n.js');
    const man = await (await fetch('/voices/manifest.json')).json();
    const dur = async (lang, text) => {
      // (the same file the game plays: js/voice.js packKey, the newer name first, then the older one)
      text = swapNames(text, lang); let h = lineHash(lang, text); if (!man.lines[h]) h = packHash(lang, text); const slots = man.lines[h]; if (!slots) return null;
      let best = null; for (const s of slots) { const res = await fetch(`/voices/${lang}/${s}/${h}.mp3`, { method: 'HEAD' }); const n = +res.headers.get('content-length'); if (n) best = best == null ? n / 4000 : Math.min(best, n / 4000); }
      return best;
    };
    const stage = document.createElement('div'); stage.style.cssText = 'position:fixed;left:0;top:0;width:640px;height:360px'; document.body.appendChild(stage);
    const out = { pages: [], missing: [] };
    const ids = [...Object.keys(C.FILMS), ...Object.keys(L.TALE_FILMS)].filter(id => !only.length || only.includes(id));
    for (const id of ids) {
      const script = C.FILMS[id] || await L.taleFilm(id);
      let tale = [...TALES, ...MORE_TALES].find(t => t.id === id) || STORY_TALES[id]; if (!tale) { out.missing.push(id + ': no words'); continue; }
      if (tale.load) tale = await tale.load(); // (r82) a tale's words load when it opens, as in the game
      if (tale.pages.length !== script.pages.length) out.missing.push(`${id}: ${script.pages.length} film pages for ${tale.pages.length} pages of words`);
      const f = F.createFilm(stage, script, { name: 'Na', companion: 'firefly', look: {} });
      for (let k = 0; k < script.pages.length; k++) {
        f.page(k); const p = f.now, [, en, vi] = tale.pages[k] || [];
        // the child's answers are part of the film too: each tap's answer is put into the timeline as the film does it
        // (js/film.js release: what the tap starts begins at the help's time, and everything later waits dur seconds)
        for (let n = 0; n < 9; n++) {
          const h = p.ev.filter(e => e.help && !e.played).sort((x, y) => x.t - y.t)[0]; if (!h) break; h.played = true;
          const n0 = p.ev.length, len0 = p.len; try { if (h.help.act) h.help.act(h.t); } catch (e) { out.missing.push(`${id} p${k + 1}: the tap's answer failed (${e.message})`); }
          if (h.help.dur) { for (let i = 0; i < n0; i++) if (p.ev[i] !== h && p.ev[i].t > h.t) p.ev[i].t += h.help.dur; p.len = Math.max(p.len, len0 + h.help.dur); }
        }
        const lines = p.ev.filter(e => e.help || e.say).sort((x, y) => x.t - y.t).map(e => ({ t: e.t, help: !!e.help, en: (e.help || e.say).en, vi: (e.help || e.say).vi }));
        const v = {};
        for (const lang of ['en', 'vi']) {
          v[lang] = await dur(lang, lang === 'en' ? en : vi); if (v[lang] == null) out.missing.push(`${id} p${k + 1} ${lang}: page words`);
          // (FILMTAILS_EST=1, while writing a film: a line not recorded yet is guessed from its length)
          for (const l of lines) { l[lang + 'd'] = await dur(lang, l[lang]); if (l[lang + 'd'] == null) { if (est) l[lang + 'd'] = .4 + l[lang].length * (lang === 'en' ? .055 : .068); else out.missing.push(`${id} p${k + 1} ${lang}: "${l[lang]}"`); } }
        }
        out.pages.push({ id, k: k + 1, len: p.len, lines, v });
      }
      f.close();
    }
    stage.remove();
    return out;
  }, [!!process.env.FILMTAILS_EST, (process.env.FILMTAILS_ONLY || '').split(',').filter(Boolean)]);
  await P.ctx.close();
  const bad = [], rows = [];
  for (const p of r.pages) for (const lang of ['en', 'vi']) {
    const V = p.v[lang]; if (V == null) continue;
    let shift = 0, speechEnd = .35 + V, afterTap = false; const log = [`words ${V.toFixed(1)}`];
    for (const l of p.lines) {
      const reach = l.t + shift, gap = reach - speechEnd, allow = afterTap ? 3 : 1.5;
      if (gap > allow) bad.push(`${p.id} p${p.k} ${lang}: ${gap.toFixed(1)} s of silence before "${l[lang].slice(0, 40)}"`);
      const start = Math.max(reach, speechEnd), d = l[lang + 'd'] || 0; shift += start - reach; speechEnd = start + d;
      if (l.help) { shift += d; afterTap = true; } else afterTap = false; // (the film waits while the question is asked; the tap comes as it ends)
      log.push(`${l.help ? 'asks' : 'says'} at ${start.toFixed(1)} (${d.toFixed(1)})`);
    }
    const end = p.len + shift + .4, tail = end - speechEnd, allow = afterTap ? 3 : 1.5;
    rows.push(`${p.id} p${p.k} ${lang}: ${log.join(', ')}; film ends ${end.toFixed(1)}, tail ${tail.toFixed(1)}`);
    if (tail > allow) bad.push(`${p.id} p${p.k} ${lang}: ${tail.toFixed(1)} s of film after the narrator stops`);
  }
  if (process.env.FILMTAILS_LOG) console.log(rows.join('\n'));
  const fails = [...new Set(bad)];
  if (r.missing.length) fails.push('not recorded or not matching: ' + r.missing.join(', '));
  if (fails.length) throw new Error(fails.length + ' problems: ' + fails.join('; '));
  return `${r.pages.length} film pages in ${new Set(r.pages.map(p => p.id)).size} films: no silence over 1.5 s before a line or after the narrator (3 s right after the child's tap), English and Vietnamese recordings`;
});

await check('filmstart', async () => {
  // (owner, 13 Oct: "some films do not start by themselves") every story film is opened as a child opens it and left
  // alone: no tap at all. It must start (its first page plays), go through every page by itself (the child's questions
  // carry on by themselves) and close at the end. Played 6 times faster on a computer screen (window.__svFilmRate); the
  // first page is also started on a phone and a tablet screen.
  const out = [];
  const run = async (w, h, touch, full) => {
    const P = await open(b, { w, h, touch, play: false, pre: () => { window.__svFilmRate = 6; } });
    const r = await P.page.evaluate(async full => {
      const F = await import('/js/film.js'), C = await import('/js/content/films.js'), L = await import('/js/content/talefilms.js');
      await import('/js/content/chapter2films.js'); await import('/js/content/chapter3films.js');
      const { MORE_TALES } = await import('/js/talesdata.js'), { TALES } = await import('/js/learn.js'), { STORY_TALES } = await import('/js/content/chapters.js');
      const { openTheatre } = await import('/js/tales.js');
      const sleep = ms => new Promise(r => setTimeout(r, ms)), res = { bad: [], films: 0, pages: 0 };
      for (const id of [...Object.keys(C.FILMS), ...Object.keys(L.TALE_FILMS)]) {
        const st = STORY_TALES[id], tale = [...TALES, ...MORE_TALES].find(t => t.id === id) || (st && { ...st, title: () => st.title[0], ctx: { name: 'Na', companion: 'firefly' } });
        let closed = false; openTheatre(tale, { name: 'Na' }).then(() => { closed = true; });
        let started = false; for (let i = 0; i < 80 && !started; i++) { await sleep(100); const f = F.filmNow(); started = !!(f && f.now && f.now.t > .3); }
        if (!started) { res.bad.push(id + ': did not start by itself'); document.querySelector('.th-x') && document.querySelector('.th-x').click(); await sleep(300); continue; }
        res.films++;
        if (full) {
          const seen = new Set(), n = tale.pages.length, t0 = Date.now();
          while (!closed && Date.now() - t0 < 120000) { const on = [...document.querySelectorAll('.th-dots i')].findIndex(i => i.classList.contains('on')); if (on >= 0) seen.add(on); await sleep(100); }
          if (!closed) res.bad.push(`${id}: stuck on page ${Math.max(...seen) + 1} of ${n}`);
          else if (seen.size < n) res.bad.push(`${id}: pages seen ${[...seen].map(x => x + 1).join(',')} of ${n}`);
          res.pages += seen.size;
        } else { document.querySelector('.th-x').click(); await sleep(300); }
        if (F.filmNow()) res.bad.push(id + ': not freed');
      }
      return res;
    }, full);
    if (P.errors.length) r.bad.push(...P.errors.slice(0, 3));
    await P.ctx.close();
    return r;
  };
  const comp = await run(1280, 800, false, true), phone = await run(390, 844, true, false), tab = await run(820, 1180, true, false);
  const fails = [...comp.bad, ...phone.bad.map(x => 'phone: ' + x), ...tab.bad.map(x => 'tablet: ' + x)];
  if (fails.length) throw new Error(fails.join('; '));
  return `${comp.films} films started and played all ${comp.pages} pages to the end with no tap (computer, 6x speed); the first page started by itself on a phone (${phone.films}) and a tablet (${tab.films})`;
});

await check('filmmusic', async () => {
  // (owner, 13 Oct: "soft background music during films") the story plays its quiet music bed, lowered while the
  // narrator speaks; the music before comes back when the story closes; with the music switched off, none plays
  const P = await open(b, { w: 1000, h: 700, play: false, settings: { music: true, voice: true } });
  const r = await P.page.evaluate(async () => {
    const { Music } = await import('/js/audio.js'), { MORE_TALES } = await import('/js/talesdata.js'), { openTheatre } = await import('/js/tales.js'), { settings } = await import('/js/state.js');
    const sleep = ms => new Promise(r => setTimeout(r, ms)), o = {};
    Music.play('village'); o.before = Music.key;
    openTheatre(MORE_TALES.find(t => t.id === 'duahau'), { name: 'Na' });
    await sleep(300); o.inFilm = Music.key; o.playing = !!Music.timer;
    let low = false; for (let i = 0; i < 60 && !low; i++) { await sleep(100); low = Music.low; } o.lowWhileSpeaking = low;
    document.querySelector('.th-pause').click(); await sleep(400); o.lowAfterPause = Music.low;
    document.querySelector('.th-x').click(); await sleep(400); o.after = Music.key; o.lowAfter = Music.low;
    settings.music = false; Music.stop();
    openTheatre(MORE_TALES.find(t => t.id === 'duahau'), { name: 'Na' }); await sleep(300); o.offPlaying = !!Music.timer;
    document.querySelector('.th-x').click(); await sleep(300);
    return o;
  });
  await P.ctx.close();
  const f = [];
  if (r.inFilm !== 'story' || !r.playing) f.push('no music bed in the film: ' + JSON.stringify(r));
  if (!r.lowWhileSpeaking) f.push('the music was not lowered while the narrator spoke');
  if (r.lowAfterPause) f.push('the music stayed low after the narrator stopped');
  if (r.after !== r.before || r.lowAfter) f.push(`the music before did not come back (${r.before} → ${r.after})`);
  if (r.offPlaying) f.push('music played with the music switched off');
  if (f.length) throw new Error(f.join('; '));
  return 'the story bed plays under the film, lowered while the narrator speaks, the valley\'s music back after; none with the music off';
});

await check('halves', async () => {
  // (round R, owner) two players: a window opens in its own child's half and pauses only that child; the other keeps playing
  const out = [];
  for (const [w, h, touch, tag] of [[1180, 760, false, 'side'], [820, 1180, true, 'face']]) {
    const P = await open(b, { w, h, touch, mode: 'split' }); await clear(P.page);
    const r = await P.page.evaluate(async () => {
      const G = __sv, w = t => new Promise(r => setTimeout(r, t)), hold = () => document.querySelectorAll('.halfwrap');
      G.openPad(1); await w(600);
      const inHalf1 = !!(hold()[1] && hold()[1].querySelector('.modal')), busy = [G.halfBusy(0), G.halfBusy(1)];
      const h0 = G.heroes[0], x0 = h0.pos.x, z0 = h0.pos.z; h0.goal = { x: x0 + 6, z: z0 + 2 };
      const h1 = G.heroes[1], x1 = h1.pos.x, z1 = h1.pos.z; h1.goal = { x: x1 + 6, z: z1 }; await w(1500);
      const moved0 = Math.hypot(h0.pos.x - x0, h0.pos.z - z0), moved1 = Math.hypot(h1.pos.x - x1, h1.pos.z - z1);
      G.lastPlayer = 0; G.openPad(0); await w(600);
      const both = [!!hold()[0].querySelector('.modal'), !!hold()[1].querySelector('.modal')], far = hold()[1].classList.contains('facewrap');
      return { inHalf1, busy, moved0, moved1, both, far };
    });
    if (!r.inHalf1) out.push(tag + ': the window did not open in its child\'s half');
    if (r.busy[0] || !r.busy[1]) out.push(tag + ': wrong child paused ' + JSON.stringify(r.busy));
    if (!(r.moved0 > .3) || r.moved1 > .05) out.push(tag + ': the other child could not keep playing ' + JSON.stringify(r));
    if (!r.both[0] || !r.both[1]) out.push(tag + ': both children could not have a window open');
    if ((tag === 'face') !== r.far) out.push(tag + ': far half not turned to face its child');
    if (P.errors.length) out.push(...P.errors.slice(0, 2));
    await P.ctx.close();
  }
  if (out.length) throw new Error(out.join('; '));
  return 'side by side and face to face: each window opens in its own child\'s half and pauses only that child; both can have one open';
});

await check('story', async () => {
  // (round R, owner approved "Đèn Lồng Thung Lũng") the prologue and chapter 1 can be played from start to end: Ông Cú's
  // film, choosing a companion, each step of Làng Sen in turn, finding and hanging the lantern; the đình wakes up, the
  // keepsake goes home, and the old adventures follow. The đình stands in an open yard, not between houses.
  const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
  const pg = P.page, w = ms => pg.waitForTimeout(ms), seen = [];
  const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
  const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
  const act = id => pg.evaluate(id => { const it = __sv.interactables.find(i => i.id === id); it.act(__sv.heroes[0], __sv); }, id);
  seen.push(await q());
  // (v1.08) wait for the theatre up to 10 s (the game's own wait for a film) instead of looking once after 2.5 s: on
  // v1.07 itself it takes 1.8 to 3.1 s on the Release machine, so the single look passed or failed by the machine's speed
  await pg.evaluate(() => { if (!document.querySelector('.theatre')) __sv.lanterns.owl(__sv.heroes[0]); });
  let film = false; for (let i = 0; i < 40 && !film; i++) { await w(250); film = await pg.evaluate(() => !!document.querySelector('.theatre')); }
  await w(1000);
  await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(800);
  await pg.evaluate(() => { const c = document.querySelectorAll('.dialog .dchoices button'); c[1] && c[1].click(); }); await w(800);
  await calm(); await w(2500); await calm(); seen.push(await q());
  await pg.evaluate(() => { const L = __sv.lanterns; __sv.heroes[0].place(L.dinh.front[0], L.dinh.front[1] + 6); }); await w(2500); await calm();
  // (switch storyActions) being in the village is not enough: catch the wind ribbons
  const ribbonsWaited = await q() === 'L_c1_village';
  for (let k = 0; k < 3; k++) { await pg.evaluate(k => { const it = __sv.interactables.find(i => i.id === 'story_ribbon' + k); const h = __sv.heroes[0]; if (it && it.visible(h)) it.act(h); }, k); await w(300); }
  await calm(); seen.push(await q());
  await act('story_c1_nam'); await w(600);
  for (let i = 0; i < 5; i++) { await pg.evaluate(() => document.querySelector('.dialog')?.click()); await w(400); }
  await calm(); await w(2500); await calm(); seen.push(await q());
  await act('lv_well'); await w(1800); await calm(); await w(2500); await calm(); seen.push(await q());
  await pg.evaluate(async () => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:oanquan', players: [], result: { won: true } }); });
  await w(400); await calm(); await w(2500); await calm(); seen.push(await q());
  await pg.evaluate(() => __sv.lanterns._finish(__sv.heroes[0], 'c1_tale')); await w(300); await calm(); await w(2500); await calm(); seen.push(await q());
  // lift lotus leaves until the lantern shows, then pick it up
  const lifted = await pg.evaluate(() => { const h = __sv.heroes[0]; let n = 0; for (let k = 0; k < 5; k++) { const it = __sv.interactables.find(i => i.id === 'story_leaf' + k); if (it && it.visible(h)) { it.act(h); n++; } if (h.profile.lanterns.act && h.profile.lanterns.act.found) break; } return n; });
  await act('story_c1_find'); await w(600); await calm(); await w(2500); await calm();
  const carrying = await pg.evaluate(() => __sv.heroes[0].profile.lanterns.carrying); seen.push(await q());
  pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c1_hang'); it.act(__sv.heroes[0]); }); await w(1500);
  // (r90, testers #425 #432 #442: the rope panel covered the game) a game opened while the panel waits hides it; closing
  // the game brings it back, still waiting
  const padGame = await pg.evaluate(async () => { const d = document.querySelector('.handpad'); if (!d) return null; const F = await import('/js/games/frame.js');
    F.openGame('colors', { players: [__sv.heroes[0].profile] }); await new Promise(r => setTimeout(r, 500)); const hidden = getComputedStyle(d).display === 'none';
    document.querySelector('.gl .gl-x')?.click(); await new Promise(r => setTimeout(r, 900)); return { hidden, back: d.isConnected && getComputedStyle(d).display !== 'none' && !F.gameOpen() }; });
  // pull the rope (drag the handle down)
  const roped = await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return false; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y }));
    ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); return true; }); await w(2500);
  await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(1200);
  await pg.evaluate(() => document.querySelectorAll('.reward,.modal').forEach(e => e.click())); await w(800); await calm(); await w(1500);
  seen.push(await q());
  // (Play core, chapter 2; owner 12 Oct AEDT: on unless Studio switches it off) by default chapter 2 follows chapter 1;
  // switched off in Studio, the old adventures follow as before
  const dflt = seen[8];
  const noCh2 = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM; C.features = { ...(C.features || {}), story_ch2: false }; const c = __sv.currentQuest(__sv.heroes[0].profile); delete C.features.story_ch2; return c && c.id; });
  seen[8] = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM; C.features = { ...(C.features || {}), story_ch2: true }; await __sv.lanterns.loadCh('ch2'); const c = __sv.currentQuest(__sv.heroes[0].profile); delete C.features.story_ch2; return c && c.id; });
  const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, D = G.lanterns.dinh;
    const house = Math.min(...G.world.colliders.filter(c => c.r > 2 && c.top == null).map(c => Math.hypot(c.x - D.x, c.z - D.z) - c.r));
    return { companion: p.lanterns.companion, ch1: !!p.lanterns.chapters.ch1, keep: (p.keepsakes || []).includes('lantern_ch1'), carrying: p.lanterns.carrying, house }; });
  const want = ['L_p_owl', 'L_c1_village', 'L_c1_nam', 'L_c1_well', 'L_c1_teo', 'L_c1_tale', 'L_c1_find', 'L_c1_hang'], out = [];
  want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
  if (seen[8] !== 'L_c2_fly') out.push('after chapter 1 the goal was ' + seen[8] + ', not chapter 2');
  if (dflt !== 'L_c2_fly') out.push('with no Studio setting (chapter 2 on by default), the goal after chapter 1 was ' + dflt + ', not chapter 2');
  if (!noCh2 || /^L_/.test(noCh2)) out.push('with chapter 2 switched off in Studio, the goal after chapter 1 was ' + noCh2 + ', not an old adventure');
  if (!film) out.push('Ông Cú\'s film did not play');
  if (end.companion !== 'dragon') out.push('the companion was not chosen');
  if (carrying !== 'ch1' || end.carrying) out.push('the lantern was not carried and then hung');
  if (!end.ch1 || !end.keep) out.push('chapter 1 not finished ' + JSON.stringify(end));
  if (!ribbonsWaited) out.push('walking into the village finished the step before the ribbons were caught');
  if (!(lifted >= 1)) out.push('no lotus leaves to lift');
  if (!roped) out.push('hanging did not ask to pull the rope');
  if (!padGame || !padGame.hidden || !padGame.back) out.push('a game opened over the rope panel: ' + JSON.stringify(padGame));
  if (!(end.house > 5)) out.push(`a building stands ${end.house.toFixed(1)} m from the đình`);
  if (P.errors.length) out.push(...P.errors.slice(0, 2));
  await P.ctx.close();
  if (out.length) throw new Error(out.join('; '));
  return `prologue and chapter 1 played through (${want.length} steps; ribbons caught, ${lifted} lotus leaves lifted, rope pulled); đình lit, keepsake home, then "${noCh2}" (chapter 2 switched on: "${seen[8]}"); nearest building ${end.house.toFixed(1)} m away`;
});

await check('chapter2', async () => {
  // (Play core, owner's go 10 Oct) chapter 2 of the lantern story, Hà Nội, played from the start to the Trung Thu parade,
  // once as an under-5 and once as a big kid: lantern lights to Hà Nội, Cô Tam (big kids), Tèo's challenge (Ô ăn quan for
  // a big kid, Oẳn tù tì for an under-5: another game does not count), Bà Lan's bún chả by hand (big kids), counting the
  // stone turtles at Văn Miếu (a big kid answers how many and is asked again after a wrong answer), Bà Năm's story, the
  // clues by Hồ Gươm (the under-5's companion lights the way), the rope, the festival film (both pages played through),
  // Cầu Thê Húc lit, the parade, the keepsake, the new trick, and the big kids' golden turtle. Nothing stands on a road,
  // a city street or in the water.
  const shots = process.env.SV_SHOTS;
  const play = async age => {
    const P = await open(b, { w: 1000, h: 700, fast: !shots }); await clear(P.page);
    const pg = P.page, w = ms => pg.waitForTimeout(ms), seen = [], out = [];
    const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
    const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
    const act = id => pg.evaluate(id => { const it = __sv.interactables.find(i => i.id === id), h = __sv.heroes[0]; if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, id);
    const tapDialog = (n = 6) => pg.evaluate(async n => { for (let i = 0; i < n; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d || d.querySelector('.dch')) break; d.click(); await new Promise(r => setTimeout(r, 250)); } }, n);
    const choose = k => pg.evaluate(k => { const c = document.querySelectorAll('.dialog:not(.out) .dch'); if (!c[k]) return false; c[k].click(); return true; }, k);
    const step = async () => { await w(400); await calm(); await w(2200); await calm(); seen.push(await q()); };
    // (off by default: an admin switches it on in Studio)
    const offFirst = await pg.evaluate(async () => { const C = (await import('/js/custom.js')).CUSTOM, h = __sv.heroes[0], p = h.profile; p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: { ch1: true } };
      for (const s of ['c1_village', 'c1_nam', 'c1_well', 'c1_teo', 'c1_tale', 'c1_find', 'c1_hang']) p.lanterns.done[s] = true;
      const q = __sv.currentQuest(p); C.features = { ...(C.features || {}), story_ch2: true }; return !/^L_c2/.test(q && q.id || ''); });
    await pg.evaluate(age => { const G = __sv, h = G.heroes[0], p = h.profile; p.age = age;
      p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: { ch1: true } };
      for (const s of ['c1_village', 'c1_nam', 'c1_well', 'c1_teo', 'c1_tale', 'c1_find', 'c1_hang']) p.lanterns.done[s] = true;
      G.lanterns.companions.sync(); }, age);
    // (chapter 2's places load once a child has finished chapter 1, not at start-up)
    const lazy = await pg.evaluate(() => !__sv.lanterns.hanoi); await pg.evaluate(() => __sv.lanterns.loadHanoi()); await w(300);
    seen.push(await q());
    // walking into Hà Nội is not enough: follow the lantern lights
    await pg.evaluate(() => __sv.heroes[0].place(4, -60)); await w(2500); await calm();
    const lightsWaited = await q() === 'L_c2_fly';
    for (let k = 0; k < 3; k++) { await act('story_light' + k); await w(300); }
    await step();
    if (age === 'big') { if (!await act('story_c2_tam')) out.push('no Cô Tam button'); await w(500); await tapDialog(); await step(); }
    // Tèo's challenge: his line with Play, How to play and Later
    const teoBtn = await act('story_c2_teo'); await w(600);
    const teoChoices = await pg.evaluate(() => document.querySelectorAll('.dialog:not(.out) .dch').length); await calm();
    const emit = gid => pg.evaluate(async gid => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:' + gid, players: [], result: { won: true } }); }, gid);
    await emit(age === 'big' ? 'oantuti' : 'oanquan'); await w(400);
    const otherGame = await q();
    await emit(age === 'big' ? 'oanquan' : 'oantuti'); await step();
    let fanned = false, bowls = 0;
    if (age === 'big') {
      await act('story_c2_job'); await w(800);
      fanned = await pg.evaluate(async () => { const b = document.querySelector('.handpad [data-hp=fan]'); if (!b) return false; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); for (let i = 0; i < 100 && !document.querySelector('.handpad [data-hp=bowl]'); i++) await new Promise(r => setTimeout(r, 200)); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; });
      await w(600);
      bowls = await pg.evaluate(async () => { let n = 0; for (let i = 0; i < 3; i++) { const b = document.querySelector('.handpad [data-hp=bowl]'); if (!b) break; b.click(); n++; await new Promise(r => setTimeout(r, 200)); } return n; });
      await step();
    }
    // Cô Tam's lesson: count the stone turtles
    await act('story_c2_vanmieu'); await w(600); await tapDialog(); await w(500);
    const n = age === 'big' ? 5 : 3; let counted = 0;
    for (let k = 0; k < 5; k++) { if (await act('story_turtle' + k)) counted++; await w(300); }
    await w(600);
    let askedAgain = false;
    if (age === 'big') { await choose(0); await w(500); await tapDialog(1); await w(500); askedAgain = await choose(1); await w(500); }
    await tapDialog(); await step();
    // Bà Năm's story (Sự tích Hồ Gươm): the button opens her words (the theatre is checked by 'tales')
    const namBtn = await act('story_c2_tale'); await w(600); await calm(); await pg.evaluate(() => document.querySelector('.th-x')?.click());
    await pg.evaluate(() => __sv.lanterns._finish(__sv.heroes[0], 'c2_tale')); await step();
    // the clues by the lake: an under-5's companion flies over the right one
    await pg.evaluate(() => { const H = __sv.lanterns.hanoi; __sv.heroes[0].place(H.front[0], H.front[1] + 1); }); await w(2500); await calm();
    const lead = await pg.evaluate(() => { const c = __sv.lanterns.companions.of(__sv.heroes[0]); return !!(c && c.lead); });
    const target = await pg.evaluate(() => { const t = __sv.currentQuest(__sv.heroes[0].profile).target(), L = __sv.lanterns.hanoi.lanternAt; return Math.hypot(t.x - L[0], t.z - L[1]); });
    const pickEarly = await pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c2_find'); return it.visible(__sv.heroes[0]); });
    await act('story_clue1'); await w(300);
    const wrongFound = await pg.evaluate(() => !!__sv.heroes[0].profile.lanterns.act.clue);
    await act('story_clue0'); await w(300);
    await act('story_c2_find'); await step();
    const carrying = await pg.evaluate(() => __sv.heroes[0].profile.lanterns.carrying);
    // hang it on the bridge: pull the rope, the festival film, the reward, the new trick
    pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c2_hang'); it.act(__sv.heroes[0]); }); await w(1500);
    const roped = await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return false; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y }));
      ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); return true; });
    let film = false; for (let i = 0; i < 30 && !film; i++) { await w(300); film = await pg.evaluate(async () => !!document.querySelector('.theatre.film canvas.th-film')); }
    if (shots) { await w(2500); await pg.screenshot({ path: `${shots}/ch2_film_${age}.png` }); }
    await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(1200);
    await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(800); await tapDialog(); await w(400); await calm(); await w(1500);
    const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, H = G.lanterns.hanoi;
      return { ch2: !!p.lanterns.chapters.ch2, keep: (p.keepsakes || []).includes('lantern_ch2'), carrying: p.lanterns.carrying, tricks: p.lanterns.tricks || [], lit: H.lit(), parade: H.paradeOn(),
        secret: (it => it.visible(G.heroes[0]))(G.interactables.find(i => i.id === 'story_c2_secret')), after: (q => q && q.id)(G.currentQuest(p)) }; });
    if (shots) { await pg.evaluate(() => { const H = __sv.lanterns.hanoi; __sv.heroes[0].place(H.front[0], H.front[1] + 3); }); await w(4000); await calm(); await pg.screenshot({ path: `${shots}/ch2_parade_${age}.png` }); }
    let sticker = false;
    if (age === 'big' && end.secret) { await act('story_c2_secret'); await w(400); await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(400); sticker = await pg.evaluate(() => __sv.heroes[0].profile.stickers.includes('🐢') && !__sv.interactables.find(i => i.id === 'story_c2_secret').visible(__sv.heroes[0])); }
    // nothing of the chapter on a road, a city street or in the water
    const placed = await pg.evaluate(async () => { const W = await import('/js/world.js'), H = __sv.lanterns.hanoi, bad = [];
      const pts = [['front', H.front[0], H.front[1]], ...H.clues.map(c => ['clue' + c.k, c.x, c.z]), ...H.people.map(c => [c.id, c.x, c.z]), ...H.turtles.map(t => ['turtle' + t.k, t.x, t.z]),
        ...__sv.interactables.filter(i => /^story_light/.test(i.id)).map(i => [i.id, i.x, i.z])];
      for (const [id, x, z] of pts) { const d = W.roadDist(x, z); if (d.road && d.d < d.road.w / 2 + .5) bad.push(id + ' on a road');
        for (const c of W.CITIES) if (c.layout && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6) bad.push(id + ' on ' + c.id + "'s street");
        if (W.heightAt(x, z) < W.WATER + .3) bad.push(id + ' in the water'); }
      return bad; });
    // the festival film: both pages play to their end
    const filmRun = await pg.evaluate(async () => {
      const F = await import('/js/film.js'), C = await import('/js/content/films.js'); await import('/js/content/chapter2films.js');
      const { STORY_TALES } = await import('/js/content/chapters.js'), { openTheatre } = await import('/js/tales.js'), st = STORY_TALES.lantern_ch2, bad = [];
      openTheatre({ ...st, story: true, title: () => st.title[0], ctx: { name: 'Na', companion: 'dragon' } }, { name: 'Na' }); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100));
      document.querySelector('.th-pause')?.click(); const f = F.filmNow(); if (!f) return ['no film'];
      const frame = () => new Promise(r => requestAnimationFrame(r));
      for (let k = 0; k < C.FILMS.lantern_ch2.pages.length; k++) { const done = f.page(k); let ended = false; done.then(() => { ended = true; }); const p = f.now; f.narrated();
        for (let i = 0; i < 600 && !ended; i++) { if (p.hold) p.release(true); p.t += .2; await frame(); }
        if (!ended) bad.push('page ' + (k + 1) + ' did not end'); if (!p.actors.length) bad.push('page ' + (k + 1) + ': nobody in it'); }
      document.querySelector('.th-x')?.click(); await new Promise(r => setTimeout(r, 400)); if (F.filmNow()) bad.push('not freed');
      return bad; });
    const want = age === 'big' ? ['L_c2_fly', 'L_c2_tam', 'L_c2_teo', 'L_c2_job', 'L_c2_vanmieu', 'L_c2_tale', 'L_c2_find', 'L_c2_hang'] : ['L_c2_fly', 'L_c2_teo', 'L_c2_vanmieu', 'L_c2_tale', 'L_c2_find', 'L_c2_hang'];
    want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
    if (!offFirst) out.push('chapter 2 started before an admin switched it on');
    if (!lazy) out.push('chapter 2 was loaded at start-up');
    if (!lightsWaited) out.push('walking into Hà Nội finished the step before the lights were followed');
    if (!teoBtn || teoChoices !== 3) out.push(`Tèo's challenge did not offer Play, How to play and Later (${teoChoices})`);
    if (otherGame !== 'L_c2_teo') out.push('the other age group\'s game finished Tèo\'s challenge');
    if (age === 'big' && (!fanned || bowls !== 3)) out.push(`the bún chả job was not done by hand (fan ${fanned}, bowls ${bowls})`);
    if (counted !== n) out.push(`${counted} stone turtles to count, expected ${n}`);
    if (age === 'big' && !askedAgain) out.push('a wrong count was not asked again');
    if (!namBtn) out.push('no button for Bà Năm\'s story');
    if (age !== 'big' && (!lead || target > .5)) out.push(`the companion did not light the way (lead ${lead}, arrow ${target.toFixed(1)} m from the lantern)`);
    if (age === 'big' && lead) out.push('the companion led a big kid');
    if (pickEarly || wrongFound) out.push('the lantern showed before the right spot was found');
    if (carrying !== 'ch2' || end.carrying) out.push('the lantern was not carried and then hung');
    if (!roped) out.push('hanging did not ask to pull the rope');
    if (!film) out.push('the festival film did not open');
    if (!end.ch2 || !end.keep) out.push('chapter 2 not finished ' + JSON.stringify(end));
    if (!end.lit) out.push('Cầu Thê Húc did not light up');
    if (!end.parade) out.push('no Trung Thu parade');
    if (!end.tricks.includes('light')) out.push('the companion did not learn its trick');
    if (!end.after || /^L_c2/.test(end.after)) out.push('after chapter 2 the goal was ' + end.after);
    if (age === 'big' && (!end.secret || !sticker)) out.push('no golden turtle secret for a big kid');
    if (age !== 'big' && end.secret) out.push('the golden turtle showed for an under-5');
    out.push(...placed, ...filmRun.map(x => 'film: ' + x));
    if (P.errors.length) out.push(...P.errors.slice(0, 2));
    await P.ctx.close();
    return { out, steps: want.length, counted, after: end.after };
  };
  const little = await play('little'), big = await play('big');
  const bad = [...little.out.map(x => 'under-5: ' + x), ...big.out.map(x => 'big kid: ' + x)];
  // (owner, 10 Oct: "Chi's look can be changed in Studio") Studio's looks change Chi, Jack and Ruby; a bad value keeps the
  // chapter's own look, and Bà Năm keeps hers
  { const P = await open(b, { w: 800, h: 600 }); const L = await P.page.evaluate(async () => { const { lookOf } = await import('/js/content/chapter3sydney.js');
      return { chi: lookOf('chi'), set: lookOf('chi', { chi: { color: '#ff0000', style: 'dress', hairStyle: 'nope', hair: 'red' } }), nam: lookOf('nam', { nam: { color: '#ff0000' } }), bad: lookOf('jack', 'x') }; });
    await P.ctx.close();
    if (L.chi.hairStyle !== 'ponytail' || L.chi.color !== '#ffd23f') bad.push('Chi\'s own look changed: ' + JSON.stringify(L.chi));
    if (L.set.color !== '#ff0000' || L.set.style !== 'dress' || L.set.hairStyle !== 'ponytail' || L.set.hair !== L.chi.hair) bad.push('Studio\'s look for Chi was not used safely: ' + JSON.stringify(L.set));
    if (L.nam.color === '#ff0000' || L.bad.color !== '#3b6fe0') bad.push('Bà Năm or a bad pack changed a look'); }
  if (bad.length) throw new Error(bad.join('; '));
  return `under-5: ${little.steps} steps (${little.counted} turtles, the companion lit the way); big kid: ${big.steps} steps (Ô ăn quan, bún chả by hand, ${big.counted} turtles and a question, clues); rope, film (2 pages), Cầu Thê Húc lit, parade, keepsake, new trick, golden turtle for the big kid; then "${big.after}"`;
});

await check('chapter3', async () => {
  // (Play core, owner's go 10 Oct) chapter 3 of the lantern story, Sydney, played from the start to the fireworks, once as
  // an under-5 and once as a big kid: off until an admin switches it on; lantern lights to Sydney, Chi (big kids), Chi's
  // Aussie words (pictures for an under-5, meanings for a big kid; a wrong answer is never punished), Captain Molly's
  // ferries (big kids), Jack and Ruby's challenge (cricket for a big kid, tug of war for an under-5: the other game does not
  // count), Bà Năm's Magic Pudding, the clues by the harbour (the under-5's companion flies high and leads), the rope, the
  // festival film (both pages played through), the Opera House lit, fireworks, the keepsake, the new trick (flying higher)
  // and the big kids' koala. Nothing stands on a road, a city street or in the water.
  const play = async age => {
    const P = await open(b, { w: 1000, h: 700 }); await clear(P.page);
    const pg = P.page, w = ms => pg.waitForTimeout(ms), seen = [], out = [];
    const q = () => pg.evaluate(() => { const c = __sv.currentQuest(__sv.heroes[0].profile); return c && c.id; });
    const calm = () => pg.evaluate(() => { document.querySelectorAll('.storybook,.dialog,.reward').forEach(e => e.remove()); __sv.paused = false; });
    const act = id => pg.evaluate(id => { const it = __sv.interactables.find(i => i.id === id), h = __sv.heroes[0]; if (!it || (it.visible && !it.visible(h))) return false; it.act(h, __sv); return true; }, id);
    const tapDialog = (n = 6) => pg.evaluate(async n => { for (let i = 0; i < n; i++) { const d = document.querySelector('.dialog:not(.out)'); if (!d || d.querySelector('.dch')) break; d.click(); await new Promise(r => setTimeout(r, 250)); } }, n);
    const step = async () => { await w(400); await calm(); await w(2200); await calm(); seen.push(await q()); };
    const emit = gid => pg.evaluate(async gid => { const E = await import('/js/core/events.js'); E.events.emit('ActivityCompleted', { activityId: 'x', defId: 'game:' + gid, players: [], result: { won: true } }); }, gid);
    // chapter 2 done; chapter 3 is off until an admin switches it on
    // (chapter 2's steps come with its file, which the game loads once chapter 1's lantern is found)
    const offFirst = await pg.evaluate(async age => { const G = __sv, p = G.heroes[0].profile, C = (await import('/js/custom.js')).CUSTOM, { CHAPTERS } = await import('/js/content/chapters.js');
      C.features = { ...(C.features || {}), story_ch2: true }; await G.lanterns.loadCh('ch2');
      p.age = age; p.lanterns = { companion: 'firefly', done: { p_owl: true }, chapters: { ch1: true, ch2: true } };
      for (const c of CHAPTERS.slice(1, 3)) for (const s of c.steps) p.lanterns.done[s.id] = true;
      C.features = { ...(C.features || {}), story_ch2: true }; const before = G.currentQuest(p);
      C.features.story_ch3 = true; G.lanterns.companions.sync(); return !/^L_c3/.test(before && before.id || ''); }, age);
    await pg.evaluate(() => __sv.lanterns.loadCh('ch3')); await w(300);
    seen.push(await q());
    await pg.evaluate(() => __sv.heroes[0].place(-36, 52)); await w(2500); await calm();
    const lightsWaited = await q() === 'L_c3_fly';
    for (let k = 0; k < 3; k++) { await act('story_light_c3_fly_' + k); await w(300); }
    await step();
    if (age === 'big') { await act('story_c3_chi'); await w(500); await tapDialog(); await step(); }
    // Chi's words: tap the buttons until each word is right (a wrong one just hides)
    await act('story_c3_words'); await w(800);
    // (a big kid's answers are words that can be read; an under-5's are pictures)
    const wordBtn = await pg.evaluate(() => { const b = document.querySelector('.handpad [data-hp=w0]'); if (!b) return null; const cs = getComputedStyle(b); return { text: b.textContent.trim(), size: parseFloat(cs.fontSize), pic: !!b.querySelector('.art, .emo, svg, img'), h: b.getBoundingClientRect().height }; });
    let rounds = 0, wrongs = 0;
    for (let i = 0; i < 20; i++) {
      const r = await pg.evaluate(() => { const bs = [...document.querySelectorAll('.handpad [data-hp^=w]')], b = bs.find(x => x.style.visibility !== 'hidden'); if (!b) return null; const word = document.querySelector('.handpad p b').textContent, hidden = bs.filter(x => x.style.visibility === 'hidden').length; b.click(); return { word, hidden }; });
      if (r == null) break;
      // (right: the next word comes, or the game ends; wrong: that button hides)
      const res = await pg.evaluate(async r => { for (let k = 0; k < 40; k++) { await new Promise(x => setTimeout(x, 150)); const b = document.querySelector('.handpad p b'), bs = [...document.querySelectorAll('.handpad [data-hp^=w]')];
        if (!b || b.textContent !== r.word) return 'right'; if (bs.filter(x => x.style.visibility === 'hidden').length > r.hidden) return 'wrong'; } return 'none'; }, r);
      if (res === 'right') rounds++; else if (res === 'wrong') wrongs++; else break; }
    await step();
    if (age === 'big') { await emit('ferries'); await step(); }
    const jackBtn = await act('story_c3_jack'); await w(600);
    const jackChoices = await pg.evaluate(() => document.querySelectorAll('.dialog:not(.out) .dch').length); await calm();
    await emit(age === 'big' ? 'tug' : 'cricket'); await w(400); const otherGame = await q();
    await emit(age === 'big' ? 'cricket' : 'tug'); await step();
    const namBtn = await act('story_c3_tale'); await w(600); await calm(); await pg.evaluate(() => document.querySelector('.th-x')?.click());
    await pg.evaluate(() => __sv.lanterns._finish(__sv.heroes[0], 'c3_tale')); await step();
    // the clues by the harbour
    await pg.evaluate(() => { const S = __sv.lanterns.sydney; __sv.heroes[0].place(S.front[0], S.front[1] + 1); }); await w(2500); await calm();
    const lead = await pg.evaluate(() => { const c = __sv.lanterns.companions.of(__sv.heroes[0]); return c && c.lead ? !!c.lead.high : false; });
    // (#735) where the quest light shines: on a place a child can tap ("Look here" before the clue, the lantern after)
    const aim = () => pg.evaluate(() => { const G = __sv, h = G.heroes[0], t = G.currentQuest(h.profile).target(), S = G.lanterns.sydney;
      const near = G.interactables.filter(i => i.visible && i.visible(h) && i.act && Number.isFinite(i.x)).map(i => ({ id: i.id, d: Math.hypot(i.x - t.x, i.z - t.z) })).sort((a, b) => a.d - b.d)[0];
      return { tap: near && near.d < 2.5 ? near.id : null, lantern: Math.hypot(t.x - S.lanternAt[0], t.z - S.lanternAt[1]) }; });
    const aimBefore = await aim();
    await act('story_clue3_1'); await w(300);
    const wrongFound = await pg.evaluate(() => !!(__sv.heroes[0].profile.lanterns.act || {}).clue3);
    await act('story_clue3_0'); await w(300); const aimAfter = await aim(); await act('story_c3_find'); await step();
    if (!/^story_clue3_/.test(aimBefore.tap || '') && !(age !== 'big' && aimBefore.lantern < 1)) out.push('the quest light did not shine on a place to look: ' + JSON.stringify(aimBefore));
    if (aimAfter.lantern > 1 || aimAfter.tap !== 'story_c3_find') out.push('after the clue the quest light did not shine on Pick up the lantern: ' + JSON.stringify(aimAfter));
    const carrying = await pg.evaluate(() => __sv.heroes[0].profile.lanterns.carrying);
    pg.evaluate(() => { const it = __sv.interactables.find(i => i.id === 'story_c3_hang'); it.act(__sv.heroes[0]); }); await w(1500);
    const roped = await pg.evaluate(() => { const el = document.querySelector('.handpad [data-hp=rope]'); if (!el) return false; const r = el.getBoundingClientRect(), ev = (t, y) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: r.left + 20, clientY: r.top + r.height * y }));
      ev('pointerdown', 0); ev('pointermove', 1); ev('pointerup', 1); return true; });
    let film = false; for (let i = 0; i < 30 && !film; i++) { await w(300); film = await pg.evaluate(() => !!document.querySelector('.theatre.film canvas.th-film')); }
    await pg.evaluate(() => document.querySelector('.th-x')?.click()); await w(1200);
    await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(800); await tapDialog(); await w(400); await calm(); await w(1500);
    const end = await pg.evaluate(() => { const G = __sv, p = G.heroes[0].profile, S = G.lanterns.sydney;
      return { ch3: !!p.lanterns.chapters.ch3, keep: (p.keepsakes || []).includes('lantern_ch3'), carrying: p.lanterns.carrying, tricks: p.lanterns.tricks || [], lit: S.lit(), show: S.showOn(),
        secret: G.interactables.find(i => i.id === 'story_c3_secret').visible(G.heroes[0]), after: (q => q && q.id)(G.currentQuest(p)) }; });
    let sticker = false;
    if (age === 'big' && end.secret) { await act('story_c3_secret'); await w(400); await pg.evaluate(() => document.querySelectorAll('.reward').forEach(e => e.click())); await w(400); sticker = await pg.evaluate(() => __sv.heroes[0].profile.stickers.includes('🐨')); }
    const placed = await pg.evaluate(async () => { const W = await import('/js/world.js'), S = __sv.lanterns.sydney, bad = [];
      const pts = [['front', S.front[0], S.front[1]], ...S.clues.map(c => ['clue' + c.k, c.x, c.z]), ...S.people.map(c => [c.id, c.x, c.z]), ['koala', S.koala.x, S.koala.z],
        ...__sv.interactables.filter(i => /^story_light_c3/.test(i.id)).map(i => [i.id, i.x, i.z])];
      for (const [id, x, z] of pts) { const d = W.roadDist(x, z); if (d.road && d.d < d.road.w / 2 + .5) bad.push(id + ' on a road');
        for (const c of W.CITIES) if (c.layout && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6) bad.push(id + ' on ' + c.id + "'s street");
        if (W.heightAt(x, z) < W.WATER + .3) bad.push(id + ' in the water'); }
      return bad; });
    const filmRun = await pg.evaluate(async () => {
      const F = await import('/js/film.js'), C = await import('/js/content/films.js'); await import('/js/content/chapter3films.js');
      const { STORY_TALES } = await import('/js/content/chapters.js'), { openTheatre } = await import('/js/tales.js'), st = STORY_TALES.lantern_ch3, bad = [];
      openTheatre({ ...st, story: true, title: () => st.title[0], ctx: { name: 'Na', companion: 'dragon' } }, { name: 'Na' }); for (let i = 0; i < 50 && !F.filmNow(); i++) await new Promise(r => setTimeout(r, 100));
      document.querySelector('.th-pause')?.click(); const f = F.filmNow(); if (!f) return ['no film'];
      const frame = () => new Promise(r => requestAnimationFrame(r)); let helps = 0;
      for (let k = 0; k < C.FILMS.lantern_ch3.pages.length; k++) { const done = f.page(k); let ended = false; done.then(() => { ended = true; }); const p = f.now; f.narrated();
        for (let i = 0; i < 600 && !ended; i++) { if (p.hold) { helps++; p.release(true); } p.t += .2; await frame(); }
        if (!ended) bad.push('page ' + (k + 1) + ' did not end'); if (!p.actors.length) bad.push('page ' + (k + 1) + ': nobody in it'); }
      if (!helps) bad.push('the child never helped');
      document.querySelector('.th-x')?.click(); await new Promise(r => setTimeout(r, 400)); if (F.filmNow()) bad.push('not freed');
      return bad; });
    const want = age === 'big' ? ['L_c3_fly', 'L_c3_chi', 'L_c3_words', 'L_c3_ferry', 'L_c3_jack', 'L_c3_tale', 'L_c3_find', 'L_c3_hang'] : ['L_c3_fly', 'L_c3_words', 'L_c3_jack', 'L_c3_tale', 'L_c3_find', 'L_c3_hang'];
    want.forEach((id, i) => { if (seen[i] !== id) out.push(`step ${i + 1} was ${seen[i]}, expected ${id}`); });
    if (!offFirst) out.push('chapter 3 started before an admin switched it on');
    if (!lightsWaited) out.push('walking into Sydney finished the step before the lights were followed');
    if (!wordBtn) out.push('no word buttons');
    else if (age === 'big' ? !(wordBtn.text && wordBtn.size >= 16) : !wordBtn.pic) out.push('word buttons: ' + JSON.stringify(wordBtn));
    else if (wordBtn.h < (age === 'big' ? 44 : 64)) out.push('word buttons too small: ' + wordBtn.h);
    if (rounds !== (age === 'big' ? 4 : 2)) out.push(`${rounds} words with Chi, expected ${age === 'big' ? 4 : 2}`);
    if (!jackBtn || jackChoices !== 3) out.push(`Jack and Ruby's challenge did not offer Play, How to play and Later (${jackChoices})`);
    if (otherGame !== 'L_c3_jack') out.push('the other age group\'s game finished Jack and Ruby\'s challenge');
    if (!namBtn) out.push('no button for Bà Năm\'s story');
    if (age !== 'big' && !lead) out.push('the companion did not fly high to lead the way');
    if (age === 'big' && lead) out.push('the companion led a big kid');
    if (wrongFound) out.push('the lantern showed at the wrong spot');
    if (carrying !== 'ch3' || end.carrying) out.push('the lantern was not carried and then hung');
    if (!roped) out.push('hanging did not ask to pull the rope');
    if (!film) out.push('the festival film did not open');
    if (!end.ch3 || !end.keep) out.push('chapter 3 not finished ' + JSON.stringify(end));
    if (!end.lit) out.push('the Opera House did not light up');
    if (!end.show) out.push('no fireworks');
    if (!end.tricks.includes('higher')) out.push('the companion did not learn its trick');
    if (!end.after || /^L_c3/.test(end.after)) out.push('after chapter 3 the goal was ' + end.after);
    if (age === 'big' && (!end.secret || !sticker)) out.push('no koala secret for a big kid');
    if (age !== 'big' && end.secret) out.push('the koala showed for an under-5');
    out.push(...placed, ...filmRun.map(x => 'film: ' + x));
    if (P.errors.length) out.push(...P.errors.slice(0, 2));
    await P.ctx.close();
    return { out, steps: want.length, rounds, wrongs, after: end.after };
  };
  const little = await play('little'), big = await play('big');
  const bad = [...little.out.map(x => 'under-5: ' + x), ...big.out.map(x => 'big kid: ' + x)];
  // (owner, 10 Oct: "Chi's look can be changed in Studio") Studio's looks change Chi, Jack and Ruby; a bad value keeps the
  // chapter's own look, and Bà Năm keeps hers
  { const P = await open(b, { w: 800, h: 600 }); const L = await P.page.evaluate(async () => { const { lookOf } = await import('/js/content/chapter3sydney.js');
      return { chi: lookOf('chi'), set: lookOf('chi', { chi: { color: '#ff0000', style: 'dress', hairStyle: 'nope', hair: 'red' } }), nam: lookOf('nam', { nam: { color: '#ff0000' } }), bad: lookOf('jack', 'x') }; });
    await P.ctx.close();
    if (L.chi.hairStyle !== 'ponytail' || L.chi.color !== '#ffd23f') bad.push('Chi\'s own look changed: ' + JSON.stringify(L.chi));
    if (L.set.color !== '#ff0000' || L.set.style !== 'dress' || L.set.hairStyle !== 'ponytail' || L.set.hair !== L.chi.hair) bad.push('Studio\'s look for Chi was not used safely: ' + JSON.stringify(L.set));
    if (L.nam.color === '#ff0000' || L.bad.color !== '#3b6fe0') bad.push('Bà Năm or a bad pack changed a look'); }
  if (bad.length) throw new Error(bad.join('; '));
  return `under-5: ${little.steps} steps (${little.rounds} picture words, the companion flew high to lead); big kid: ${big.steps} steps (${big.rounds} Aussie words, ferries, cricket, clues); rope, film (2 pages, the child starts the fireworks), Opera House lit, fireworks, keepsake, new trick, koala for the big kid; Studio can change Chi, Jack and Ruby's looks; then "${big.after}"`;
});

await check('ownerstoryinitial', async () => {
  const up = await new Promise(r => { const ws = new WebSocket('ws://127.0.0.1:9001/', 'mqtt'); const t = setTimeout(() => r(false), 2000); ws.onopen = () => { clearTimeout(t); ws.close(); r(true); }; ws.onerror = () => { clearTimeout(t); r(false); }; });
  if (!up) return 'skipped (no local MQTT broker on 127.0.0.1:9001)';
  const pre = () => { window.SV_PEER = { host: '127.0.0.1', port: 9099, path: '/nope', secure: false }; window.SV_MQTT = ['ws://127.0.0.1:9001/']; };
  const A = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'SRCA22', friendsOn: true, autoMeet: false, friends: [{ code: 'SRCB33', name: 'Bin' }] } });
  const B = await open(b, { pre, w: 900, h: 700, lang: 'en', settings: { friendCode: 'SRCB33', friendsOn: true, autoMeet: false, friends: [{ code: 'SRCA22', name: 'Na' }] } });
  await pairKeys(A, B);
  for (const P of [A, B]) { await clear(P.page); await P.page.evaluate(async () => { window.__Net = (await import('/js/net.js')).Net; }); }
  await A.page.evaluate(async () => __Net.host(__sv.sendHello())); await A.page.evaluate(() => __sv.shareStatus());
  await B.page.waitForFunction(() => { const s = __Net.friends.status.SRCA22; return s && s.online && s.room; }, null, { timeout: 30000 });
  await B.page.evaluate(() => { __sv.openPad(0, 'friend'); }); await B.page.waitForSelector('[data-joinf]'); await B.page.evaluate(() => document.querySelector('[data-joinf]').click());
  await B.page.waitForFunction(() => Object.keys(__sv.partners).length > 0, null, { timeout: 45000 });
  await A.page.waitForFunction(() => Object.values(__sv.partners).some(P => P.pos.y > -40), null, { timeout: 30000 });
  const clean = async () => { for (const P of [A, B]) await P.page.evaluate(() => { document.querySelectorAll('.modal, .dialog, .gl, .theatre').forEach(m => m.remove()); __sv.paused = false; __sv.netGames.leave(); }); await A.page.waitForTimeout(600); };
  await clean();
  const accept = async () => { await B.page.waitForSelector('.dialog .dch', { timeout: 20000 }); await B.page.evaluate(() => document.querySelector('.dialog .dch').click()); };
  // Delay the guest's initial page-zero broadcast until after the host's two real Next taps.
  await B.page.evaluate(()=>{const send=__Net.send.bind(__Net);window.__releaseInitialPage=()=>{if(window.__heldInitialPage)send(window.__heldInitialPage);};__Net.send=d=>{if(d.t==='gmove'&&d.n===0&&d.mv===0){window.__heldInitialPage=d;return;}send(d);};});
  await A.page.evaluate(()=>__sv.inviteGame('tale-banhchung',null,1));await accept();
  for(const P of [A,B])await P.page.waitForFunction(()=>!!document.querySelector('.th-text')?.textContent.trim());
  await A.page.evaluate(()=>document.querySelector('.th-pause').click());
  await A.page.evaluate(()=>document.querySelector('.th-next').click());await A.page.waitForTimeout(400);await A.page.evaluate(()=>document.querySelector('.th-next').click());
  const expected=await A.page.evaluate(()=>__sv.TALES.find(t=>t.id==='banhchung').pages[2][1]);
  await B.page.waitForFunction(expected=>document.querySelector('.th-text p')?.textContent===expected,expected);
  await B.page.evaluate(()=>window.__releaseInitialPage());await A.page.waitForTimeout(1500);
  const states=[];for(const P of [A,B])states.push(await P.page.evaluate(()=>document.querySelector('.th-text p')?.textContent));
  // A real first Back from the guest must still travel, including returning to page zero.
  for(let turn=1;turn>=0;turn--){await B.page.evaluate(()=>document.querySelector('.th-prev').click());for(const P of [A,B])await P.page.waitForFunction(turn=>document.querySelector('.th-dots .on')&&[...document.querySelectorAll('.th-dots i')].indexOf(document.querySelector('.th-dots .on'))===turn,turn);}
  const held=await B.page.evaluate(()=>!!window.__heldInitialPage),errs=[...A.errors,...B.errors];await A.ctx.close();await B.ctx.close();
  ok(!held&&states.every(s=>s===expected)&&!errs.length,JSON.stringify({held,expected,states,errs}));
  return 'Initial rendering sends no stale page-zero reset; two host Next taps survive delayed guest startup and the guest’s first real Back taps still synchronize';
});

await check('ownertalesync', async () => {
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { CUSTOM } = await import('/js/custom.js'), { openTheatre } = await import('/js/tales.js');
    const previous = CUSTOM.features; CUSTOM.features = { ...(previous || {}), storyFilms: false };
    const sent = [], wait = ms => new Promise(resolve => setTimeout(resolve, ms)); let receive;
    const tale = { id: 'sync-regression', flag: '', title: () => 'Shared story', pages: [['', 'First page.', 'Trang đầu.'], ['', 'Second page.', 'Trang thứ hai.'], ['', 'Third page.', 'Trang thứ ba.']] };
    const done = openTheatre(tale, { sync: { send: page => sent.push(page), listen: fn => { receive = fn; } } });
    await wait(100); document.querySelector('.th-pause').click(); const initial = sent.slice();
    receive(1); await wait(100); const remote = { sent: sent.slice(), text: document.querySelector('.th-text p').textContent };
    receive(0); receive(1); await wait(100); const rapid = sent.slice();
    document.querySelector('.th-next').click(); await wait(100); const local = { sent: sent.slice(), text: document.querySelector('.th-text p').textContent };
    document.querySelector('.th-x').click(); await done; CUSTOM.features = previous;
    return { initial, remote, rapid, local };
  });
  const errors = P.errors; await P.ctx.close();
  // (repair16, 15 Oct AEDT) opening a shared story no longer broadcasts its first page: a delayed page-0 message rolled the
  // other device back to the start (ownerstoryinitial). Only a child's own Back/Next/Read is sent.
  ok(JSON.stringify(r.initial) === '[]' && JSON.stringify(r.remote.sent) === '[]' && r.remote.text === 'Second page.' && JSON.stringify(r.rapid) === '[]' && JSON.stringify(r.local.sent) === '[2]' && r.local.text === 'Third page.' && !errors.length, JSON.stringify({ ...r, errors }));
  return 'Opening sends nothing; received page changes survive the asynchronous draw without being rebroadcast; rapid remote changes settle, local Next broadcasts once';
});

await check('storyquestflow', async () => (await import('../story-quest-flow.mts')).storyQuestFlowCheck(b));

await check('storyhelp', async () => {
  // (owner, 18 Oct AEDT: "read story then ask kid to resolve puzzle or work on something … then move on, read and then
  // more interactive", for 5 to 8 and 2 to 5) Story Helpers: every story plays through, page by page (read, then help in
  // the picture: put, find, order), for a 5 to 8 year old in English on a phone and an under-5 in Vietnamese on a tablet;
  // a wrong place is refused and the right one taken; buttons are 44 px or more (64 px for under-5s); one task is done
  // by dragging; nothing errs
  const C = await import('../../js/content/storyhelp.js');
  const solve = async (page, si, pg) => page.evaluate(async ([si, pg]) => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), C = await import('/js/content/storyhelp.js'), P = C.STORIES[si].pages[pg];
    const little = !!document.querySelector('.gl.little'), task = !little && P.older ? P.older : P.task, small = [];
    const min = little ? 64 : 44; document.querySelectorAll('.sh-thing, .sh-ear, .sh-text button').forEach(b => { const r = b.getBoundingClientRect(); if (r.width && Math.min(r.width, r.height) < min) small.push(b.className + ' ' + Math.round(Math.min(r.width, r.height))); });
    let refused = null;
    if (task.kind === 'order') { for (let i = 0; i < task.steps.length; i++) { const btn = [...document.querySelectorAll('.sh-thing:not(.gone)')].find(b => task.steps[i].word.includes(b.getAttribute('aria-label'))); btn.click(); await wait(250); } }
    else if (task.kind === 'find') { const no = [...document.querySelectorAll('.sh-spot')].find(s => s.dataset.id !== task.at); no.click(); await wait(200); refused = !no.querySelector('.sh-hide'); document.querySelector(`.sh-spot[data-id="${task.at}"]`).click(); }
    else { const list = little ? task.things.slice(0, 1) : [...task.things, ...(task.more || [])];
      for (let k = 0; k < list.length; k++) { const btn = document.querySelectorAll('.sh-thing')[k]; btn.click(); await wait(150);
        if (k === 0) { const no = [...document.querySelectorAll('.sh-spot')].find(s => s.dataset.id !== list[k].to); no.click(); await wait(200); refused = !btn.classList.contains('gone'); btn.click(); await wait(150); }
        document.querySelector(`.sh-spot[data-id="${list[k].to}"]`).click(); await wait(300); } }
    return { kind: task.kind, small, refused };
  }, [si, pg]);
  const runs = [];
  for (const [age, lang, w, h, stories] of [['big', 'en', 390, 844, [0, 1, 2]], ['little', 'vi', 820, 1180, [3, 4, 5]]]) for (const si of stories) {
    const P = await open(b, { w, h, touch: true, lang, settings: { voice: false } }); await clear(P.page);
    await P.page.evaluate(async age => { await import('/js/games/readingmenu.js'); __sv.heroes[0].profile.age = age; __sv.playGame(0, 'rd_storyhelp', 'replay'); }, age);
    await P.page.waitForSelector('.sh-book', { timeout: 60000 }); await P.page.locator('.sh-book').nth(si).click();
    const pages = [];
    for (let pg = 0; pg < C.STORIES[si].pages.length; pg++) {
      const want = C.STORIES[si].pages[pg].text[lang === 'vi' ? 1 : 0].replace(/\s+/g, '');
      await P.page.waitForFunction(w => (document.querySelector('.sh-text')?.textContent || '').replace(/\s+/g, '') === w && (document.querySelector('.sh-thing:not(.gone)') || document.querySelector('.sh-slots') || document.querySelector('.sh-spot')), want, { timeout: 90000 })
        .catch(e => { throw new Error(`${age} ${C.STORIES[si].id} page ${pg + 1}: ${e.message.slice(0, 60)}`); });
      await P.page.waitForTimeout(400);
      // the very first task: done by dragging the thing onto its place, as a child would
      if (si === stories[0] && pg === 0) {
        const T0 = C.STORIES[si].pages[0].task, to = T0.things[0].to, from = await P.page.locator('.sh-thing').first().boundingBox(), at = await P.page.locator(`.sh-spot[data-id="${to}"]`).boundingBox();
        await P.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await P.page.mouse.down(); await P.page.mouse.move(at.x + at.width / 2, at.y + at.height / 2, { steps: 8 }); await P.page.mouse.up(); await P.page.waitForTimeout(400);
        const dragged = await P.page.evaluate(() => document.querySelector('.sh-thing').classList.contains('gone'));
        pages.push({ dragged }); if (age === 'little') { continue; }
        // (the rest of the page's things for an older child)
        const rest = await P.page.evaluate(async ([si]) => { const C = await import('/js/content/storyhelp.js'), t = C.STORIES[si].pages[0].task, list = [...t.things, ...(t.more || [])], wait = ms => new Promise(r => setTimeout(r, ms));
          for (let k = 1; k < list.length; k++) { document.querySelectorAll('.sh-thing')[k].click(); await wait(150); document.querySelector(`.sh-spot[data-id="${list[k].to}"]`).click(); await wait(300); } return list.length; }, [si]);
        pages.push({ rest }); continue;
      }
      pages.push(await solve(P.page, si, pg));
    }
    await P.page.waitForTimeout(2500);
    const won = await P.page.evaluate(() => !!document.querySelector('.gl .win, .gl-win, .winbox, .reward, .gl.won'));
    runs.push({ age, lang, story: C.STORIES[si].id, pages, won, errs: P.errors.slice(0, 3) }); await P.ctx.close();
  }
  const bad = runs.filter(r => !r.won || r.errs.length || r.pages.some(p => (p.small && p.small.length) || p.refused === false || p.dragged === false));
  ok(!bad.length, JSON.stringify(bad).slice(0, 1500));
  return `${runs.length} stories played through (3 by a 5 to 8 year old in English on a phone, 3 by an under-5 in Vietnamese on a tablet): every page read, then put, find or order done; wrong places refused; a drag works; buttons 44 px (64 px for under-5s) or more`;
});

// (Play reading trial) plays a reading game to its win in the test browser, the way a child would: taps (and traces) until
// the right answer, so nothing here knows the answers; returns how it ended
export const solveReading = async (page, id, opts) => page.evaluate(async ([id, opts]) => {
  const wait = ms => new Promise(r => setTimeout(r, ms)), G = window.__sv, F = await import('/js/games/frame.js');
  const done = F.openGame(id, { players: [G.heroes[0].profile], level: opts.level, little: opts.little, style: 'shrine' });
  let res = null; done.then(r => { res = r; });
  let tried = new WeakSet(), mark = '', steps = 0, beats = 0;
  const R = await import('/js/content/reading.js'), lang = (await import('/js/state.js')).settings.lang === 'vi' ? 'vi' : 'en';
  const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const tap = e => { e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })); e.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })); e.click(); };
  const t0 = Date.now();
  for (;;) {
    if (res) break;
    if (Date.now() - t0 > opts.timeout) return { ok: false, why: 'timeout', html: document.querySelector('.gl-stage')?.innerHTML.slice(0, 300) };
    const win = document.querySelector('.gl-win.ask .gl-nx.again');
    if (win) { const box = document.querySelector('.gl-win'); box.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(300); continue; }
    if (document.querySelector('.gl-win')) { await wait(150); continue; }
    const st = document.querySelector('.gl-stage'); if (!st) { await wait(100); continue; }
    // a new screen (or a step done): every answer may be tried again
    const key = st.innerHTML.length + ':' + st.querySelectorAll('.used,.full,.on,.pop,.in').length;
    if (key !== mark) { mark = key; tried = new WeakSet(); }
    const lan = st.querySelector('.rd-lantern:not(.lit)');
    if (lan) {
      const dots = [...lan.querySelectorAll('.rd-dot')]; const b = lan.getBoundingClientRect();
      lan.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 3, clientX: b.left + 1, clientY: b.top + 1 }));
      for (const d of dots) { const r = d.getBoundingClientRect(); lan.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 3, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); }
      lan.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 3 })); await wait(400); continue;
    }
    const book = st.querySelector('.rd-book'); if (book) { book.click(); await wait(300); continue; }
    const next = st.querySelector('.rd-next'); if (next) { next.click(); await wait(250); continue; }
    const drum = st.querySelector('.rd-drum');
    if (drum && !st.querySelector('.rd-parts')) {
      const w = st.querySelector('.rd-word')?.textContent || '', item = R.READ[lang].syl.find(x => x[1] === w), n = item ? item[2].length : 1 + (beats++ % 4);
      for (let k = 0; k < n; k++) { drum.click(); await wait(60); }
      await wait(2200); continue;
    }
    const cands = [...st.querySelectorAll('.rd-tile:not(.used), .rd-row .rd-car:not(.used), .rd-balloon:not(.pop), .gl-stage .choice')].filter(vis);
    const c = cands.find(e => !tried.has(e));
    if (c) { tried.add(c); if (c.classList.contains('rd-tile')) tap(c); else c.click(); steps++; await wait(220); continue; }
    if (cands.length) tried = new WeakSet();
    await wait(200);
  }
  return { ok: true, won: res.won, stars: res.stars, steps };
}, [id, { level: 1, little: false, timeout: 120000, ...opts }]);

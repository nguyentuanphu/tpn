// (Play reading trial, owner 11 Oct 2026 AEDT; brief docs/cores/tasks/play-reading.md) Ten reading games of our own, in
// the spirit of early-reading activities (tracing, letter sounds, blending, rhyme, sight words, tones, syllables, word and
// picture, sentences, read-along). The language setting picks what a child learns to read: Australian English or
// Vietnamese, each with its own words (js/content/reading.js), never a translation of the other. Words, sounds and
// sentences are said in the language being read; what to do is said like in every game (both languages when a
// grown-up chose that). Under-5s (api.little): voice first, pictures, no reading needed, nobody loses, no timers.
// Loaded only when a reading game opens (js/games/readingmenu.js registers them while Studio's readingTrial is on).
import { T } from '../i18n.js';
import { untilRight, choiceButtons, HINT_AFTER } from './frame.js';
import { settings } from '../state.js';
import { sayAsync, hush, spoken } from '../voice.js';
import { pic } from '../art.js';
import { shuffle, pick, el, wait, esc } from '../util.js';
// (30 Oct 2026 AEDT) on a big screen the game's stage may be zoomed to fill it (js/games/frame.ts): a dragged tile
// follows the finger in the stage's own units
const stageZoom = (e: Element) => parseFloat(e.closest<HTMLElement>('.gl-stage')?.style.zoom || '') || 1;
import { READ, nameOf, soundOf, wordsOf, bare, picWords, VI_MARKS } from '../content/reading.js';

const lang = () => settings.lang === 'vi' ? 'vi' : 'en';
// 0: an under-5's version; 1 Easy, 2 Medium, 3 Hard (api.level: the child's level in this game moved by Easy·Medium·Hard)
const tier = api => api.little ? 0 : Math.min(3, Math.max(1, api.level | 0));
const calm = () => document.body.classList.contains('calm') || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
// one game's helpers: say what to do (shown, said, waited for), read a word or sound in the language being read
function ctx(api) {
  api.onCleanup(hush);
  return {
    // (r67) told to the caption listeners like every other game's say(), so an instruction has its caption (A11Y)
    async say(en, vi) { if (api.closed) return; api.show(en, vi); const t = settings.lang === 'vi' ? (vi ?? en) : en; spoken.forEach(f => { try { f(t); } catch (e) { } }); await sayAsync(en, vi); },
    read: text => api.closed ? Promise.resolve() : sayAsync(text, text),
    later(f, ms) { const t = setTimeout(f, ms); api.onCleanup(() => clearTimeout(t)); return t; }
  };
}
// an ear button that says it again
const ear = (api, again) => { const b = el('button', 'rd-ear', pic('👂')); b.setAttribute('aria-label', 'Listen again / Nghe lại'); b.onclick = () => { api.sfx.tap(); again(); }; return b; };

// the reading games' own look, added once (no shared stylesheet changes)
let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.rd-row { display: flex; flex-wrap: wrap; gap: clamp(8px, 2vw, 16px); justify-content: center; align-items: center; max-width: 96vw; }
.rd-ear { border: 0; border-radius: 50%; width: 56px; height: 56px; background: rgba(255, 255, 255, .9); box-shadow: 0 4px 0 rgba(0, 0, 0, .2); display: inline-flex; align-items: center; justify-content: center; font-size: 34px; padding: 6px; cursor: pointer; }
.gl.little .rd-ear { width: 72px; height: 72px; }
.rd-ear .art, .rd-pic .art, .rd-drum .art, .rd-engine .art { width: 100%; height: 100%; }
.rd-pic { display: inline-flex; width: clamp(80px, 22vw, 130px); height: clamp(80px, 22vw, 130px); }
.rd-pic.sm { width: clamp(48px, 12vw, 72px); height: clamp(48px, 12vw, 72px); }
.rd-card { display: flex; flex-direction: column; align-items: center; gap: 6px; background: rgba(255, 255, 255, .92); color: #2a2a3a; border-radius: 24px; padding: 10px 18px; box-shadow: 0 6px 0 rgba(0, 0, 0, .18); }
.rd-word { font-size: clamp(30px, 7vw, 54px); font-weight: 800; letter-spacing: .02em; color: #3b2a4f; line-height: 1.1; }
.rd-big { font-size: clamp(56px, 14vw, 96px); font-weight: 800; color: #3b2a4f; line-height: 1; }
.choice.rd-opt { width: auto; min-width: clamp(96px, 22vw, 150px); height: auto; min-height: clamp(96px, 22vw, 150px); flex-direction: column; gap: 4px; padding: 8px; font-size: clamp(26px, 6vw, 42px); font-weight: 800; }
.choice.rd-opt small { font-size: clamp(18px, 4.4vw, 26px); font-weight: 800; }
.choice.rd-opt.txt { min-height: clamp(70px, 14vw, 100px); padding: 8px 16px; }
.gl.little .choice.rd-opt { min-width: 120px; min-height: 120px; }
/* Lantern Letters */
.rd-lantern { position: relative; width: var(--s); height: var(--s); border-radius: 30%; background: radial-gradient(circle at 50% 40%, #fff3c4, #ffc65a 60%, #e8433a); box-shadow: 0 0 0 6px #b0261d, 0 8px 0 10px rgba(0, 0, 0, .15); touch-action: none; user-select: none; transition: box-shadow .4s; }
.rd-lantern.lit { box-shadow: 0 0 0 6px #b0261d, 0 0 60px 30px #ffd23f; }
.rd-lantern .rd-glyph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 800 calc(var(--s) * .72) / 1 var(--rd-font); color: rgba(255, 255, 255, .55); -webkit-text-stroke: 3px rgba(176, 38, 29, .45); pointer-events: none; }
.rd-dot { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: #fff; box-shadow: 0 0 6px #fff; opacity: .85; pointer-events: none; transition: background .2s, transform .2s; }
.rd-dot.on { background: #ffd23f; box-shadow: 0 0 10px #ffd23f; transform: scale(1.4); }
.rd-lantern.hint .rd-dot:not(.on) { animation: rdPulse 1s ease-in-out infinite; }
@keyframes rdPulse { 50% { transform: scale(1.8); background: #ffd23f; } }
/* Sound Pond */
.rd-pond { display: flex; flex-wrap: wrap; justify-content: center; gap: clamp(10px, 3vw, 24px); padding: 18px; border-radius: 40px; background: radial-gradient(ellipse at 50% 40%, #9fe0ff, #3cb4e8); box-shadow: inset 0 0 30px rgba(0, 60, 120, .35); max-width: 96vw; }
.choice.rd-fish { position: relative; width: clamp(96px, 22vw, 140px); height: clamp(96px, 22vw, 120px); background: rgba(255, 255, 255, .35); border-color: rgba(255, 255, 255, .7); }
.rd-fish .rd-pic { width: 70%; height: 70%; }
.rd-fish b { position: absolute; right: 6px; top: 4px; background: #fff; color: #3b2a4f; border-radius: 14px; padding: 0 10px; font-size: clamp(30px, 7vw, 44px); line-height: 1.2; box-shadow: 0 3px 0 rgba(0, 0, 0, .2); }
.rd-swim .rd-fish { animation: rdSwim 3.2s ease-in-out infinite alternate; } .rd-swim .rd-fish:nth-child(2n) { animation-duration: 4s; animation-delay: -1s; }
@keyframes rdSwim { from { transform: translate(-10px, 4px); } to { transform: translate(10px, -6px); } }
/* Word Builder and Sentence Train */
.rd-slots { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; min-height: 76px; }
.rd-slot { min-width: 64px; height: 72px; border: 3px dashed rgba(90, 60, 130, .45); border-radius: 16px; background: rgba(255, 255, 255, .5); display: inline-flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; color: #3b2a4f; padding: 0 8px; }
.rd-slot.full { border-style: solid; border-color: #5fd36a; background: #fff; }
.rd-tile { border: 0; min-width: 64px; min-height: 72px; padding: 0 12px; border-radius: 16px; background: #fff6b0; color: #3b2a4f; font-size: 40px; font-weight: 800; box-shadow: 0 5px 0 rgba(90, 60, 130, .25); cursor: pointer; touch-action: none; }
.gl.little .rd-tile { min-width: 80px; min-height: 80px; }
.rd-tile.used { visibility: hidden; } .rd-tile.hint, .rd-car.hint { animation: hintWiggle 1.2s ease-in-out infinite; outline: 5px solid #ffd23f; outline-offset: 3px; }
.rd-tile.drag { position: relative; z-index: 5; box-shadow: 0 12px 18px rgba(0, 0, 0, .25); }
.rd-train { display: flex; align-items: flex-end; gap: 6px; flex-wrap: wrap; justify-content: center; max-width: 96vw; }
.rd-train .rd-engine { display: inline-flex; width: 72px; height: 72px; }
.rd-car { border: 0; min-height: 64px; min-width: 64px; padding: 6px 14px; border-radius: 12px 12px 6px 6px; background: #5fb6ff; color: #fff; font-size: clamp(24px, 5.6vw, 34px); font-weight: 800; box-shadow: 0 5px 0 #2f6db0; cursor: pointer; }
.rd-car.in { background: #ff7eb8; box-shadow: 0 5px 0 #c04a83; } .rd-car.used { visibility: hidden; }
.rd-car.empty { background: rgba(255, 255, 255, .45); box-shadow: none; border: 3px dashed rgba(90, 60, 130, .4); color: transparent; }
.gl.little .rd-car { min-height: 72px; } .gl.little .rd-text button { min-width: 64px; min-height: 64px; }
/* Word Balloons */
.rd-sky { position: relative; width: min(94vw, 720px); height: min(52vh, 420px); border-radius: 30px; background: linear-gradient(#bfe9ff, #eaf8ff); overflow: hidden; }
.rd-balloon { position: absolute; bottom: -10px; left: calc(var(--f) * (100% - clamp(96px, 22vw, 130px))); width: clamp(96px, 22vw, 130px); height: clamp(110px, 26vw, 150px); border: 0; border-radius: 50% 50% 48% 48%; background: var(--bc); color: #fff; font-size: clamp(24px, 6vw, 36px); font-weight: 800; text-shadow: 0 2px 2px rgba(0, 0, 0, .3); box-shadow: inset -10px -12px 0 rgba(0, 0, 0, .12); cursor: pointer; animation: rdRise var(--t) linear infinite; animation-delay: var(--d); }
.rd-balloon::after { content: ''; position: absolute; left: 50%; bottom: -26px; width: 2px; height: 26px; background: #6a5a7a; }
.rd-balloon.pop { animation: rdPop .35s forwards; } .rd-balloon.hint { outline: 5px solid #ffd23f; }
.rd-calm .rd-balloon { animation: none; bottom: 30%; }
@keyframes rdRise { from { transform: translateY(0); } to { transform: translateY(calc(-1 * min(52vh, 420px) - 40px)); } }
@keyframes rdPop { to { transform: scale(1.6); opacity: 0; } }
/* Syllable Drum */
.rd-drum { border: 0; background: transparent; width: clamp(120px, 30vw, 170px); height: clamp(120px, 30vw, 170px); padding: 0; cursor: pointer; transition: transform .08s; }
.rd-drum:active, .rd-drum.hit { transform: scale(.92); }
.rd-beats { display: flex; gap: 10px; min-height: 40px; font-size: 32px; } .rd-beats i { width: 30px; height: 30px; border-radius: 50%; background: #ffd23f; box-shadow: 0 3px 0 rgba(0, 0, 0, .2); }
.rd-parts { display: flex; gap: 8px; } .rd-parts span { padding: 4px 12px; border-radius: 12px; background: #fff; color: #3b2a4f; font-size: clamp(24px, 5.6vw, 36px); font-weight: 800; }
.rd-parts span.on { background: #ffd23f; }
/* Read With Me */
.rd-page { display: flex; flex-direction: column; align-items: center; gap: 12px; background: #fffaf0; color: #3b2a4f; border-radius: 26px; padding: 14px 18px; box-shadow: 0 8px 0 rgba(0, 0, 0, .15); max-width: min(94vw, 760px); }
.rd-page .rd-pics { display: flex; gap: 10px; } .rd-page .rd-pics .rd-pic { width: clamp(90px, 24vw, 150px); height: clamp(90px, 24vw, 150px); }
.rd-text { display: flex; flex-wrap: wrap; gap: 4px 10px; justify-content: center; font-size: clamp(26px, 6vw, 40px); font-weight: 700; line-height: 1.3; }
.rd-text button { border: 0; background: transparent; color: inherit; font: inherit; padding: 2px 4px; min-height: 48px; min-width: 48px; border-radius: 10px; cursor: pointer; }
.rd-text button.on { background: #ffd23f; }
.rd-nav { display: flex; gap: 14px; }
.rd-nav button { border: 0; min-width: 72px; min-height: 72px; border-radius: 24px; background: #5fd36a; color: #fff; font-size: 22px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; box-shadow: 0 5px 0 rgba(0, 0, 0, .2); cursor: pointer; }
.rd-nav button .art { width: 40px; height: 40px; } .rd-nav .rd-again { background: #9a8cff; }
.choice.rd-book { width: auto; min-width: clamp(120px, 28vw, 180px); height: auto; min-height: clamp(120px, 28vw, 170px); flex-direction: column; gap: 6px; padding: 10px; font-size: 18px; font-weight: 800; }
.rd-mark { font-size: clamp(34px, 8vw, 54px); }
`));
}

// ---------- 1. Lantern Letters: trace the letter along glowing dots; the lantern lights and says it ----------
async function trace(api, c) {
  const L = lang(), t = tier(api), letters = READ[L].letters, pool = letters.slice(0, [6, 8, 14, letters.length][t]);
  const rounds = t === 0 ? 3 : 4, list = shuffle(pool).slice(0, rounds);
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const [ch, word, wp] = list[r], big = t === 3 && r % 2 === 1, glyph = big ? ch.toUpperCase() : ch;
    const s = Math.round(Math.max(200, Math.min(320, innerWidth * .72, innerHeight * .44)));
    const lan = el('div', 'rd-lantern'); lan.style.setProperty('--s', s + 'px');
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif'; lan.style.setProperty('--rd-font', font);
    lan.innerHTML = `<div class="rd-glyph">${esc(glyph)}</div>`;
    const keyEl = el('div', 'rd-row');
    api.stage.append(lan, keyEl);
    // the dots: points inside the letter's shape, from the letter drawn on a hidden canvas
    const cv = document.createElement('canvas'); cv.width = cv.height = s; const g = cv.getContext('2d');
    g.font = `800 ${Math.round(s * .72)}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const m = g.measureText(glyph), asc = m.actualBoundingBoxAscent || s * .36, desc = m.actualBoundingBoxDescent || 0;
    g.fillText(glyph, s / 2, s / 2 + (asc - desc) / 2);
    const px = g.getImageData(0, 0, s, s).data, step = Math.max(10, Math.round(s / 15)), pts = [];
    const inside = (x, y) => x >= 0 && y >= 0 && x < s && y < s && px[(y * s + x) * 4 + 3] > 140;
    for (let y = step / 2; y < s; y += step) for (let x = step / 2; x < s; x += step) { const X = Math.round(x), Y = Math.round(y); if (inside(X, Y)) pts.push({ x: X, y: Y }); }
    if (!pts.length) pts.push({ x: s / 2, y: s / 2 });
    for (const p of pts) { p.el = el('i', 'rd-dot'); p.el.style.left = p.x + 'px'; p.el.style.top = p.y + 'px'; lan.appendChild(p.el); }
    const need = Math.ceil(pts.length * [.55, .75, .8, .85][t]), brush = s * [.16, .11, .1, .09][t];
    const say = () => c.say('Trace the letter with your finger. Follow the glowing dots!', 'Dùng ngón tay tô theo chữ cái. Đi theo các chấm sáng nhé!').then(() => c.read(nameOf(L, ch)));
    keyEl.appendChild(ear(api, () => c.read(nameOf(L, ch))));
    say();
    let hintT = 0; const arm = () => { clearTimeout(hintT); lan.classList.remove('hint'); hintT = c.later(() => lan.classList.add('hint'), HINT_AFTER); };
    arm();
    // (r89) auto play traces like a child: one stroke through the dots still dark, in reading order
    api.plan(() => {
      const left = pts.filter(p => !p.on); if (!left.length || !lan.isConnected) return null;
      const b = lan.getBoundingClientRect(), at = p => ({ x: b.left + p.x * b.width / s, y: b.top + p.y * b.height / s }), path = left.map(at);
      return { el: lan, x: path[0].x, y: path[0].y, ms: Math.min(2400, 60 * path.length), path: path.slice(1) };
    }, { maxActions: rounds * 4 });
    const done = await new Promise(res => {
      let down = false, got = 0, fin = false;
      api.onCleanup(() => { if (!fin) { fin = true; res(false); } });
      const touch = e => {
        const b = lan.getBoundingClientRect(), x = (e.clientX - b.left) * s / b.width, y = (e.clientY - b.top) * s / b.height;
        for (const p of pts) if (!p.on && Math.hypot(p.x - x, p.y - y) < brush) { p.on = true; p.el.classList.add('on'); got++; }
        if (got >= need && !fin) { fin = true; res(true); }
      };
      lan.addEventListener('pointerdown', e => { down = true; try { lan.setPointerCapture(e.pointerId); } catch (x) { } arm(); touch(e); });
      lan.addEventListener('pointermove', e => { if (down) touch(e); });
      const up = () => { down = false; }; lan.addEventListener('pointerup', up); lan.addEventListener('pointercancel', up);
    });
    clearTimeout(hintT); lan.classList.remove('hint');
    if (!done || api.closed) return;
    pts.forEach(p => p.el.classList.add('on')); lan.classList.add('lit'); api.right(lan);
    keyEl.innerHTML = `<div class="rd-card"><span class="rd-pic">${pic(wp)}</span><b class="rd-word">${esc(word)}</b></div>`;
    await c.read(nameOf(L, ch)); if (L === 'en') await c.read(soundOf(L, ch)); await c.read(word);
    await wait(600); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 2. Sound Pond: hear a sound, catch the fish with its letter ----------
async function sounds(api, c) {
  const L = lang(), t = tier(api), letters = READ[L].letters, pool = letters.slice(0, [6, 6, 12, letters.length][t]);
  const rounds = t === 0 ? 3 : 4, n = [2, 3, 4, 5][t], list = shuffle(pool).slice(0, rounds);
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const target = list[r], opts = shuffle([target, ...shuffle(pool.filter(x => x !== target)).slice(0, n - 1)]);
    const top = el('div', 'rd-row'); api.stage.appendChild(top);
    const pond = el('div', 'rd-pond' + (t > 0 && !calm() ? ' rd-swim' : '')); api.stage.appendChild(pond);
    const fish = opts.map(o => { const b = el('button', 'choice rd-fish', `<span class="rd-pic">${pic('🐟')}</span><b>${esc(o[0])}</b>`); b._v = o; b.setAttribute('aria-label', o[0]); pond.appendChild(b); return b; });
    const sound = () => c.read(soundOf(L, target[0]));
    top.appendChild(ear(api, sound));
    if (r === 0) await c.say('Listen to the sound, then catch the fish with that letter.', 'Nghe âm, rồi bắt chú cá mang chữ cái đó.');
    else await c.say('Which fish has this sound?', 'Chú cá nào mang âm này?');
    await sound(); if (api.closed) return;
    const b = await untilRight<Element & { _v: any }>(api, fish, e => e._v === target); if (!b) return;
    top.innerHTML = `<div class="rd-card"><span class="rd-pic">${pic(target[2])}</span><b class="rd-word">${esc(target[0])} · ${esc(target[1])}</b></div>`;
    await sound(); await c.read(target[1]); await wait(500); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 3. Word Builder: put the letter tiles on the picture to make its word ----------
// a tile can be tapped, or dragged and let go over the word's boxes
function dragTap(tile, slotsEl, onPlace) {
  let sx = 0, sy = 0, moved = false, id = null;
  tile.addEventListener('pointerdown', e => { id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false; try { tile.setPointerCapture(id); } catch (x) { } });
  tile.addEventListener('pointermove', e => { if (id !== e.pointerId) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!moved && Math.hypot(dx, dy) > 12) { moved = true; tile.classList.add('drag'); } if (moved) tile.style.transform = `translate(${dx / stageZoom(tile)}px, ${dy / stageZoom(tile)}px)`; });
  const end = e => {
    if (id !== e.pointerId) return; id = null;
    if (moved) { tile.classList.remove('drag'); tile.style.transform = ''; const b = slotsEl.getBoundingClientRect(); if (e.clientX > b.left - 30 && e.clientX < b.right + 30 && e.clientY > b.top - 60 && e.clientY < b.bottom + 60) onPlace(tile); }
  };
  tile.addEventListener('pointerup', end); tile.addEventListener('pointercancel', e => { if (id === e.pointerId) { id = null; tile.classList.remove('drag'); tile.style.transform = ''; } });
  tile.addEventListener('click', () => { if (!moved) onPlace(tile); moved = false; });
}
async function build(api, c) {
  const L = lang(), t = tier(api), lists = READ[L].build, pool = lists[[0, 0, 1, 2][t]], extra = [0, 0, 1, 2][t];
  const rounds = t === 0 ? 3 : 4, list = shuffle(pool).slice(0, rounds);
  const allTiles = [...new Set(lists.flat().flatMap(w => w[2]))], starts = [...new Set(lists.flat().map(w => w[2][0]))], ends = [...new Set(lists.flat().map(w => w[2][w[2].length - 1]))];
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const [word, wp, tiles, spell] = list[r];
    const card = el('div', 'rd-card', `<span class="rd-pic">${pic(wp)}</span>`), slotsEl = el('div', 'rd-slots'), row = el('div', 'rd-row');
    const slots = tiles.map(() => { const s = el('span', 'rd-slot'); slotsEl.appendChild(s); return s; });
    card.appendChild(slotsEl); api.stage.append(card, row);
    // under-5s: the tiles already in order, tap each one; big kids: mixed up, with a spare letter or two at Medium and Hard
    // spare tiles: other letters (Vietnamese: other first sounds and other vần, one of each kind)
    const spare = L === 'vi' ? [shuffle(starts.filter(x => x !== tiles[0]))[0], shuffle(ends.filter(x => x !== tiles[1]))[0]].slice(0, extra) : shuffle(allTiles.filter(x => !tiles.includes(x))).slice(0, extra);
    const shown = t === 0 ? tiles.map((x, i) => [x, i]) : shuffle([...tiles.map((x, i) => [x, i]), ...spare.map(x => [x, -1])]);
    const tileEls = shown.map(([x, i]) => { const b = el('button', 'rd-tile', esc(x)); b._v = x; b._i = i; row.appendChild(b); return b; });
    if (t === 0) await c.say('Tap each letter, one after another.', 'Chạm vào từng chữ, lần lượt nhé.');
    else if (r === 0) await c.say('Put the letters on the picture to make the word.', 'Đặt các chữ lên tranh để ghép thành tiếng.');
    else await c.say('Make the word for this picture.', 'Ghép tiếng cho bức tranh này.');
    if (t === 0) await c.read(word);
    if (api.closed) return;
    const ok = await new Promise(res => {
      let k = 0, misses = 0, ht = 0, fin = false;
      const finish = v => { if (!fin) { fin = true; clearTimeout(ht); res(v); } };
      api.onCleanup(() => finish(false));
      const next = () => tileEls.find(b => !b.classList.contains('used') && b._v === tiles[k]);
      const arm = () => { clearTimeout(ht); tileEls.forEach(b => b.classList.remove('hint')); if (api.little) ht = c.later(() => { const n = next(); if (n && !fin) n.classList.add('hint'); }, misses >= 2 ? 0 : HINT_AFTER); };
      const place = b => {
        if (fin || b.classList.contains('used')) return;
        if (b._v !== tiles[k]) { misses++; api.wrong(b, 'Not that one. Listen to the word again.', 'Chưa đúng chữ đó. Nghe lại tiếng nhé.'); c.later(() => c.read(word), 900); arm(); return; }
        b.classList.add('used'); slots[k].textContent = b._v; slots[k].classList.add('full'); api.sfx.tap(); c.read(soundOf(L, b._v)); k++;
        if (k === tiles.length) { api.right(card); finish(true); } else arm();
      };
      tileEls.forEach(b => dragTap(b, slotsEl, place)); arm();
    });
    if (!ok || api.closed) return;
    await wait(600);
    if (L === 'vi') await c.read(spell); else for (const x of tiles) { await c.read(soundOf(L, x)); if (api.closed) return; }
    await c.read(word); await wait(500); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 4. Rhyme Time: do they rhyme? (big kids: which one rhymes?) ----------
async function rhyme(api, c) {
  const L = lang(), t = tier(api), all = READ[L].rhyme, rounds = t === 0 ? 4 : 5;
  const word = (fam, k) => k ? [fam[3], fam[4]] : [fam[1], fam[2]];
  const card = ([w, p], showWord) => `<span class="rd-pic">${pic(p)}</span>${showWord ? `<small>${esc(w)}</small>` : ''}`;
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const fam = pick(all);
    if (t <= 1) {
      // two words: rhyming (same family) or not (another family)
      const yes = Math.random() < .5, a = word(fam, 0), other = pick(all.filter(f => f[0] !== fam[0])), b = yes ? word(fam, 1) : word(other, Math.random() < .5 ? 1 : 0);
      const row = el('div', 'rd-row', [a, b].map(([w, p]) => `<div class="rd-card"><span class="rd-pic">${pic(p)}</span>${t > 0 ? `<b class="rd-word">${esc(w)}</b>` : ''}</div>`).join(''));
      api.stage.appendChild(row);
      const hear = async () => { await c.read(a[0]); await c.read(b[0]); };
      row.appendChild(ear(api, hear));
      await c.say('Listen. Do these two words rhyme?', 'Nghe nhé. Hai tiếng này có cùng vần không?'); await hear(); if (api.closed) return;
      const btns = choiceButtons(api, [[true, '👍', 'Yes', 'Có'], [false, '❌', 'No', 'Không']], ([, p, en, vi]) => `<span class="rd-pic sm">${pic(p)}</span><small>${esc(api.T(en, vi))}</small>`, 'choice rd-opt');
      const got = await untilRight(api, btns, e => e._v[0] === yes); if (!got) return;
      if (yes) await c.say('Yes! They rhyme.', 'Đúng rồi! Cùng vần.'); else await c.say('No, they do not rhyme.', 'Không, không cùng vần.');
      await hear();
    } else {
      // which one rhymes with this word? Medium: pictures and words; Hard: words only
      const a = word(fam, 0), right = word(fam, 1), others = shuffle(all.filter(f => f[0] !== fam[0])).slice(0, t === 2 ? 2 : 3).map(f => word(f, Math.random() < .5 ? 1 : 0));
      const top = el('div', 'rd-row', `<div class="rd-card"><span class="rd-pic">${pic(a[1])}</span><b class="rd-word">${esc(a[0])}</b></div>`); api.stage.appendChild(top);
      top.appendChild(ear(api, () => c.read(a[0])));
      await c.say('Which one rhymes?', 'Tiếng nào cùng vần?'); await c.read(a[0]); if (api.closed) return;
      const btns = choiceButtons<[string, string]>(api, shuffle([right, ...others]) as [string, string][], w => t === 3 ? `<span class="rd-word">${esc(w[0])}</span>` : card(w, true), 'choice rd-opt' + (t === 3 ? ' txt' : ''));
      const got = await untilRight(api, btns, e => e._v === right); if (!got) return;
      await c.read(a[0]); await c.read(right[0]);
    }
    await wait(400); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 5. Word Balloons: hear a common word, pop its balloon (5 to 8) ----------
const BCOL = ['#ff5f7a', '#5fb6ff', '#5fd36a', '#ffb52e', '#9a6bff', '#ff7eb8'];
async function sight(api, c) {
  const L = lang(), t = tier(api), lists = READ[L].sight, pool = lists[Math.max(0, t - 1)], n = [2, 3, 4, 5][t], rounds = 5, list = shuffle(pool).slice(0, rounds);
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const w = list[r], same = pool.filter(x => x !== w && x[0].toLowerCase() === w[0].toLowerCase()), opts = shuffle([w, ...shuffle([...shuffle(same).slice(0, t === 3 ? 2 : 0), ...shuffle(pool.filter(x => x !== w))]).filter((x, i, a) => a.indexOf(x) === i).slice(0, n - 1)]);
    const top = el('div', 'rd-row'); top.appendChild(ear(api, () => c.read(w)));
    const sky = el('div', 'rd-sky' + (calm() ? ' rd-calm' : '')); api.stage.append(top, sky);
    const btns = opts.map((o, i) => {
      const b = el('button', 'rd-balloon', esc(o)); b._v = o;
      b.style.setProperty('--f', opts.length > 1 ? i / (opts.length - 1) : .5);
      b.style.setProperty('--bc', BCOL[(i + r) % BCOL.length]); b.style.setProperty('--t', (11 + (i % 3) * 2) + 's'); b.style.setProperty('--d', `-${(i * 3.7 + r * 1.3) % 9}s`);
      sky.appendChild(b); return b;
    });
    if (r === 0) await c.say('Listen, then pop the balloon with that word.', 'Nghe, rồi bấm vỡ quả bóng có chữ đó.');
    await c.read(w); if (api.closed) return;
    const b = await untilRight<Element & { _v: any }>(api, btns, e => e._v === w); if (!b) return;
    b.classList.add('pop'); api.sfx.pop && api.sfx.pop();
    await c.read(w); await wait(500); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 6. Tone Marks (Vietnamese) / short and long vowels (English) ----------
const withMark = (base, mark) => { if (!mark) return base; const i = base.search(/[aăâeêioôơuưy]/i); return (base.slice(0, i + 1) + mark + base.slice(i + 1)).normalize('NFC'); };
async function tones(api, c) {
  const L = lang(), t = tier(api), R = READ[L], rounds = t === 0 ? 4 : 5;
  let told = false;
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    if (t === 0) {
      // under-5s: hear a word, tap its picture (words that differ only by their tone, or by the magic e)
      const set = pick(L === 'vi' ? R.tonePics : R.vowelPics), target = pick(set);
      const top = el('div', 'rd-row'); top.appendChild(ear(api, () => c.read(target[0]))); api.stage.appendChild(top);
      await c.say('Listen, then tap the picture.', 'Nghe, rồi chạm vào tranh.'); await c.read(target[0]); if (api.closed) return;
      const btns = choiceButtons(api, shuffle(set), ([, p]) => `<span class="rd-pic">${pic(p)}</span>`, 'choice rd-opt');
      if (!await untilRight(api, btns, e => e._v === target)) return;
      await c.read(target[0]);
    } else if (L === 'vi' && t === 3) {
      // Hard: the syllable without its mark: which mark does it need?
      const set = pick(R.tones), k = Math.floor(Math.random() * 6), target = set[k], base = set[0];
      const show = el('div', 'rd-card', `<b class="rd-big">${esc(base)}</b>`); api.stage.appendChild(show); show.appendChild(ear(api, () => c.read(target)));
      await c.say('Which mark does it need?', 'Tiếng này cần dấu gì?'); await c.read(target); if (api.closed) return;
      const btns = choiceButtons(api, VI_MARKS.map((m, i) => [i, ...m]), ([i, m, name]) => `<span class="rd-mark">${esc(i ? '◌' + m : base)}</span><small>${esc(name)}</small>`, 'choice rd-opt');
      if (!await untilRight(api, btns, e => e._v[0] === k)) return;
      show.querySelector('.rd-big').textContent = withMark(base, VI_MARKS[k][0]);
      await c.read(target); await c.read(VI_MARKS[k][1]);
    } else {
      // hear a word and tap it: Vietnamese, words with different marks; English, a short and a long vowel (kit, kite)
      let opts, target;
      if (L === 'vi') { const set = pick(R.tones); opts = shuffle(set).slice(0, t === 1 ? 3 : 4); target = pick(opts); }
      else { const p = pick(R.vowels), q = shuffle(R.vowels.filter(x => x !== p)); opts = shuffle(t === 1 ? [...p] : t === 2 ? [...p, pick(q[0])] : [...p, ...q[0]]); target = pick(p); }
      const top = el('div', 'rd-row'); top.appendChild(ear(api, () => c.read(target))); api.stage.appendChild(top);
      await c.say('Listen, then tap the word you hear.', 'Nghe, rồi chạm vào chữ con nghe thấy.'); await c.read(target); if (api.closed) return;
      const btns = choiceButtons(api, opts, o => `<span class="rd-word">${esc(o)}</span>`, 'choice rd-opt txt');
      if (!await untilRight(api, btns, e => e._v === target)) return;
      await c.read(target);
      if (L === 'en' && /e$/.test(target) && !told) { told = true; await c.say('The magic e makes the vowel say its name!', 'Chữ e thần kỳ làm nguyên âm đọc đúng tên của nó!'); }
    }
    await wait(400); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 7. Syllable Drum: beat once for each syllable (tiếng) ----------
async function syllable(api, c) {
  const L = lang(), t = tier(api), all = READ[L].syl, max = [2, 2, 3, 4][t], pool = all.filter(x => x[2].length <= max), rounds = 4;
  const list = shuffle(pool).slice(0, rounds);
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const [wp, word, parts] = list[r];
    const card = el('div', 'rd-card', `<span class="rd-pic">${pic(wp)}</span>${t > 0 ? `<b class="rd-word">${esc(word)}</b>` : ''}`);
    const beats = el('div', 'rd-beats'), drum = el('button', 'rd-drum', pic('🥁')); drum.setAttribute('aria-label', 'Drum / Trống');
    card.appendChild(ear(api, () => c.read(word))); api.stage.append(card, beats, drum);
    if (r === 0) await c.say('Beat the drum once for each part of the word.', 'Gõ trống một lần cho mỗi tiếng.');
    await c.read(word); if (api.closed) return;
    // the child beats; a short rest after the last beat counts them (nothing is timed: it waits as long as needed)
    let ok = false, hits = 0, listening = false;
    // (r89) auto play beats once for each part of the word, then lets the drum rest so the beats are counted
    api.plan(() => drum.isConnected && listening && hits < parts.length ? drum : null, { maxActions: rounds * (max + 2) * 2 });
    for (let tries = 0; !ok; tries++) {
      beats.innerHTML = ''; hits = 0; listening = true;
      const n = await new Promise<number>(res => {
        let k = 0, rest = 0, fin = false;
        api.onCleanup(() => { if (!fin) { fin = true; res(-1); } });
        drum.onclick = () => { if (fin) return; k++; hits = k; api.sfx.tap(); beats.appendChild(el('i')); drum.classList.add('hit'); setTimeout(() => drum.classList.remove('hit'), 90); clearTimeout(rest); rest = c.later(() => { fin = true; drum.onclick = null; res(k); }, 1600); };
      });
      listening = false; if (n < 0 || api.closed) return;
      if (t === 0 || n === parts.length) { ok = true; if (n === parts.length || t > 0) api.right(card); else api.praise(); }
      else { api.wrong(drum, 'Listen and count again.', 'Nghe và đếm lại nhé.'); await wait(900); await c.read(word); if (api.closed) return; }
    }
    // show the parts and beat them together
    const show = el('div', 'rd-parts', parts.map(p => `<span>${esc(p)}</span>`).join('')); api.stage.insertBefore(show, beats);
    const spans = [...show.children];
    for (const s of spans) { s.classList.add('on'); api.sfx.tap(); drum.classList.add('hit'); await wait(260); drum.classList.remove('hit'); await wait(220); if (api.closed) return; }
    await c.say(`${parts.length} ${parts.length === 1 ? 'beat' : 'beats'}!`, `${parts.length} tiếng!`);
    await c.read(word); await wait(400); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 8. Word and Picture: read a word and tap its picture (Hard: the other way round) (5 to 8) ----------
async function match(api, c) {
  const L = lang(), t = tier(api), all = picWords(L), rounds = 5, n = [2, 3, 4, 4][t], list = shuffle(all).slice(0, rounds);
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const target = list[r], others = shuffle(all.filter(x => x !== target && x[1] !== target[1])), near = others.filter(x => x[0][0] === target[0][0] || x[0].length === target[0].length);
    const opts = shuffle([target, ...[...near.slice(0, t === 3 ? 2 : 0), ...others].filter((x, i, a) => a.indexOf(x) === i).slice(0, n - 1)]);
    if (t === 3) {
      const top = el('div', 'rd-card', `<span class="rd-pic">${pic(target[1])}</span>`); api.stage.appendChild(top);
      await c.say('Which word goes with the picture?', 'Chữ nào đúng với tranh?'); if (api.closed) return;
      const btns = choiceButtons(api, opts, o => `<span class="rd-word">${esc(o[0])}</span>`, 'choice rd-opt txt');
      if (!await untilRight(api, btns, e => e._v === target)) return;
    } else {
      const top = el('div', 'rd-card', `<b class="rd-big">${esc(target[0])}</b>`); api.stage.appendChild(top);
      // reading is the game: the word is said only when the ear is tapped (or always for an under-5)
      top.appendChild(ear(api, () => c.read(target[0])));
      await c.say('Read the word, then tap its picture.', 'Đọc chữ, rồi chạm vào tranh đúng.'); if (t === 0) await c.read(target[0]); if (api.closed) return;
      const btns = choiceButtons(api, opts, o => `<span class="rd-pic">${pic(o[1])}</span>`, 'choice rd-opt');
      if (!await untilRight(api, btns, e => e._v === target)) return;
    }
    await c.read(target[0]); await wait(400); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

// ---------- 9. Sentence Train: put the word carriages in order, then hear the sentence (5 to 8) ----------
async function lightRead(api, c, btns, text) {
  // the sentence is read while each word lights up in turn
  const speech = c.read(text);
  for (const b of btns) { if (api.closed) return; btns.forEach(x => x.classList.remove('on')); b.classList.add('on'); await wait(300 + b.textContent.length * 55); }
  await speech; btns.forEach(x => x.classList.remove('on'));
}
async function sentence(api, c) {
  const L = lang(), t = tier(api), pool = READ[L].sent[Math.max(0, t - 1)], rounds = 3, list = shuffle(pool).slice(0, rounds);
  for (let r = 0; r < rounds; r++) {
    api.dots(rounds, r); api.stage.innerHTML = '';
    const [sp, text] = list[r], words = wordsOf(text);
    const card = el('div', 'rd-card', `<span class="rd-pic">${pic(sp)}</span>`), train = el('div', 'rd-train', `<span class="rd-engine">${pic('🚂')}</span>`), row = el('div', 'rd-row');
    const cars = words.map(() => { const s = el('span', 'rd-car empty', '·'); train.appendChild(s); return s; });
    api.stage.append(card, train, row);
    const order = t === 0 ? words.map((w, i) => [w, i]) : shuffle(words.map((w, i) => [w, i]));
    const btns = order.map(([w]) => { const b = el('button', 'rd-car', esc(w)); b._v = w; row.appendChild(b); return b; });
    if (r === 0) await c.say('Put the carriages in order to make a sentence.', 'Xếp các toa tàu theo thứ tự để thành câu.');
    else await c.say('Make the next sentence.', 'Xếp câu tiếp theo.');
    if (t === 0) await c.read(text);
    if (api.closed) return;
    const ok = await new Promise(res => {
      let k = 0, misses = 0, ht = 0, fin = false;
      const finish = v => { if (!fin) { fin = true; clearTimeout(ht); res(v); } };
      api.onCleanup(() => finish(false));
      const arm = () => { clearTimeout(ht); btns.forEach(b => b.classList.remove('hint')); if (api.little) ht = c.later(() => { const n = btns.find(b => !b.classList.contains('used') && b._v === words[k]); if (n && !fin) n.classList.add('hint'); }, misses >= 2 ? 0 : HINT_AFTER); };
      btns.forEach(b => b.onclick = () => {
        if (fin || b.classList.contains('used')) return;
        if (b._v !== words[k]) { misses++; api.wrong(b, 'Not yet. Which word comes next?', 'Chưa đúng. Chữ nào đứng tiếp theo?'); arm(); return; }
        b.classList.add('used'); cars[k].textContent = b._v; cars[k].className = 'rd-car in'; api.sfx.tap(); c.read(bare(b._v)); k++;
        if (k === words.length) { api.right(train); finish(true); } else arm();
      });
      arm();
    });
    if (!ok || api.closed) return;
    await wait(500); await lightRead(api, c, cars, text); await wait(400); if (api.closed) return;
  }
  api.dots(rounds, rounds); return api.win();
}

type Book = { icon: string; title: string; pages: [string, string][]; q: string; answers: [string, string][] };

// ---------- 10. Read With Me: a little book read aloud, each word lighting up; then one question ----------
async function readalong(api, c) {
  const L = lang(), t = tier(api), books = READ[L].books as Book[];
  api.stage.innerHTML = '';
  // choose a book (its cover: a picture and its name, which is read when tapped)
  await c.say('Let’s read together! Choose a book.', 'Cùng đọc nhé! Chọn một quyển truyện.'); if (api.closed) return;
  const covers = choiceButtons<Book>(api, books, B => `<span class="rd-pic">${pic(B.icon)}</span><span>${esc(B.title)}</span>`, 'choice rd-book');
  const B = await new Promise<Book | null>(res => { covers.forEach(b => b.onclick = () => { api.sfx.tap(); res(b._v); }); api.onCleanup(() => res(null)); });
  if (!B || api.closed) return;
  const steps = B.pages.length + 1;
  await c.read(B.title);
  for (let p = 0; p < B.pages.length; p++) {
    api.dots(steps, p); api.stage.innerHTML = '';
    const [pics, text] = B.pages[p];
    const page = el('div', 'rd-page', `<div class="rd-pics">${pics.split(' ').map(x => `<span class="rd-pic">${pic(x)}</span>`).join('')}</div>`);
    const line = el('div', 'rd-text'), words = wordsOf(text).map(w => { const b = el('button', '', esc(w)); b.onclick = () => { api.sfx.tap(); b.classList.add('on'); c.read(bare(w)).then(() => b.classList.remove('on')); }; line.appendChild(b); return b; });
    page.appendChild(line); api.stage.appendChild(page);
    if (p === 0) await c.say('Tap any word to hear it again.', 'Chạm vào chữ nào để nghe lại chữ đó.');
    await lightRead(api, c, words, text); if (api.closed) return;
    const nav = el('div', 'rd-nav'), again = el('button', 'rd-again', pic('🔁')), next = el('button', 'rd-next', `${pic('▶️')}`);
    again.setAttribute('aria-label', 'Read again / Đọc lại'); next.setAttribute('aria-label', 'Next page / Trang sau');
    nav.append(again, next); api.stage.appendChild(nav);
    again.onclick = () => { api.sfx.tap(); lightRead(api, c, words, text); };
    const go = await new Promise(res => { next.onclick = () => { api.sfx.tap(); res(true); }; api.onCleanup(() => res(false)); });
    if (!go || api.closed) return;
  }
  // the question, answered with a picture
  api.dots(steps, B.pages.length); api.stage.innerHTML = '';
  const q = el('div', 'rd-card', `<b class="rd-word">${esc(B.q)}</b>`); q.appendChild(ear(api, () => c.read(B.q))); api.stage.appendChild(q);
  await c.read(B.q); if (api.closed) return;
  const btns = choiceButtons(api, shuffle(B.answers), ([p, w]) => `<span class="rd-pic">${pic(p)}</span>${t > 0 ? `<small>${esc(w)}</small>` : ''}`, 'choice rd-opt');
  if (!await untilRight(api, btns, e => e._v === B.answers[0])) return;
  await c.read(B.answers[0][1]);
  api.dots(steps, steps); return api.win();
}

// Guided listening: each round introduces a spoken word, then the child finds its picture.
async function listenTouch(api, c) {
  const pool = picWords(lang()), rounds = 4;
  for (let r = 0; r < rounds; r++) {
    if (api.closed) return; api.dots(rounds, r); api.stage.innerHTML = '';
    const options = shuffle(pool).slice(0, api.little ? 2 : Math.min(4, tier(api) + 1)), target = options[0];
    const prompt = el('div', 'rd-card'); prompt.appendChild(ear(api, () => c.read(target[0]))); api.stage.appendChild(prompt);
    await c.say('Listen, then touch the matching picture. Tap the ear to hear it again.', 'Nghe rồi chạm vào tranh phù hợp. Chạm tai để nghe lại.'); await c.read(target[0]); if (api.closed) return;
    const buttons = choiceButtons(api, shuffle(options), p => pic(p[1]) + (api.little ? '' : `<small>${esc(p[0])}</small>`), 'choice rd-option');
    await untilRight(api, buttons, b => b._v[0] === target[0]); if (api.closed) return; await c.read(target[0]); api.praise();
  }
  return api.win();
}
const STORY_CHOICES = [
  ['The cat is hungry. What can we give it?', 'Mèo đang đói. Mình cho mèo món gì?', '🐟', ['🐟','👟','🪁']],
  ['It is raining. What will keep us dry?', 'Trời đang mưa. Vật gì giúp mình không bị ướt?', '☂️', ['☂️','🍎','🥁']],
  ['We want to read a story. What should we open?', 'Mình muốn đọc truyện. Nên mở vật gì?', '📖', ['📖','🍌','👒']],
  ['Our plant is thirsty. What does it need?', 'Cây đang khát. Cây cần gì?', '💧', ['💧','👟','🎩']]
];
async function storyChoice(api, c) {
  const stories = shuffle(STORY_CHOICES);
  for (let r = 0; r < stories.length; r++) { if (api.closed) return; api.dots(stories.length, r); api.stage.innerHTML = ''; const [en,vi,right,options] = stories[r];
    const listen = ear(api, () => c.say(en, vi)); api.stage.appendChild(listen); await c.say(en, vi); if (api.closed) return;
    const buttons = choiceButtons(api, shuffle(options.slice(0, api.little ? 2 : 3)), p => pic(p), 'choice rd-option'); await untilRight(api, buttons, b => b._v === right); if (api.closed) return; api.praise();
  } return api.win();
}
const RUN = { rd_listentouch: listenTouch, rd_storychoice: storyChoice, rd_trace: trace, rd_sounds: sounds, rd_build: build, rd_rhyme: rhyme, rd_sight: sight, rd_tones: tones, rd_syllable: syllable, rd_match: match, rd_sentence: sentence, rd_readalong: readalong };
export function play(id, api) { style(); const f = RUN[id]; return f ? f(api, ctx(api)) : api.win(); }

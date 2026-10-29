import { heldTale } from './content/secondset.js';
import { loadTale } from './tale-loader.js';
// The tale theatre: a fairy tale read aloud page by page (in the language chosen in settings), over a
// living picture (tales with a film are acted in 3D instead: js/film.js, js/content/films.js). Each page's pictures become little actors on a painted stage: birds fly, frogs hop,
// fish swim, rain falls, trees sway, the moon glows. The stage (sky, sea, forest, palace, night…) is
// picked from the words on the page. Tap ◀ ▶ to turn pages, 🔊 to hear it again, ⏯ to read by itself.
import { T } from './i18n.js';
import { sayAsync, hush, onSpeaking } from './voice.js';
import { SFX, Music } from './audio.js';
import { el, esc, wait, flip } from './util.js';
import { CAST, SCENES } from './cartoon.js';
import { pic, hasArt } from './art.js';
import { featureOn, itemEnabled } from './custom.js';
import { managementEvidence } from './core/events.js';

const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = (s:string):string[] => seg ? [...seg.segment(s)].map(x => x.segment).filter(x => x.trim()) : Array.from(s).filter(x => x.trim() && !/[‍️]/.test(x));

// how each picture moves
const MOVES: Array<[RegExp,string]> = [
  [/🐦|🕊|🦅|🐝|🦋|🪁|☁|🦚|🐦‍⬛|🧚|🦉|🐉|✨|⭐|🌟/u, 'fly'],
  [/🐟|🐠|🐊|🐢|🐍|🦈|🐬|🚣|⛵|🛶/u, 'swim'],
  [/🐸|🐇|🦘|🐒|🐭|🐿|🐐|🐓/u, 'hop'],
  [/🌧|💧|💦/u, 'drip'], [/🌊/u, 'wave'], [/☀|🌕|🌙|🌞|🌈|💡|👑/u, 'glow'],
  [/🔥|🧨|🎉|🧧|🏮/u, 'flick'], [/🌳|🎋|🌾|🌱|🌿|🌸|🍃|🌵/u, 'sway'],
  [/❤|💖|💚|💞|💕/u, 'beat'], [/🏃|💨|🐴|🦤|🏁/u, 'run'], [/🥚|🎁|🍉|🥭|🍈|🍏|🎃|🥥/u, 'wobble'],
  [/👦|👧|👩|👨|🧑|👵|👴|👶|👸|🤴|🧙|🐘|🐂|🦁|🐯|🐱|🐺|🐼|🐨|🧒/u, 'talk']
];
const moveOf = e => MOVES.find(([re]) => re.test(e))?.[1] || 'float';
// which painted stage suits the words of this page
const STAGES: Array<[RegExp,string]> = [
  [/night|moon|star|dark|milky|lantern|howl/i, 'night'], [/sea|river|lake|water|flood|island|swim|boat|well|rain/i, 'sea'],
  [/mountain|hill|sky|cloud|fly|flew|heaven|clouds/i, 'sky'], [/forest|bush|tree|bamboo|jungle|wood/i, 'forest'],
  [/king|palace|prince|princess|emperor|queen|festival/i, 'palace'], [/rice|field|farm|garden|village|plant|seed/i, 'field'],
  [/desert|hot|dry|thirsty/i, 'desert']
];
export const stageOf = en => STAGES.find(([re]) => re.test(en))?.[1] || 'meadow';

// sync (round H, reading together online): { send(page), listen(fn) } — a page turned here turns for every friend reading
export async function openTheatre(tale, { name = '', onDone = undefined, startPage = 0, sync = null }: {name?: string;onDone?: (...args: any[])=>void;startPage?:number;sync?:any} = {}) {
  if (!itemEnabled('story', tale.id) || heldTale(tale.id)) return null;
  try { ({ tale, sync, startPage } = await loadTale(tale, sync, startPage)); }
  catch (e) { window.svModuleGone?.(e); return null; }
  const storyId = typeof tale.id === 'string' && !tale.id.startsWith('my_') ? tale.id : '';
  const storyAttempt = storyId ? managementEvidence.emit('story.opened',{storyId}) : null;
  return new Promise(resolve => {
    let k = startPage, auto = true, alive = true, token = 0;
    let displayed = false;
    // Both friends already start on page zero. Publishing a late initial render can undo real Next taps.
    const publish = fromFriend => { const initial = !displayed; displayed = true; if (sync && !fromFriend && (!initial || k !== startPage)) sync.send(k); };
    // (owner, 13 Oct) a soft music bed under the story, lowered while the narrator speaks; the music before comes back on
    // close. Music.play follows the music switch, and the music's loudness calm mode.
    const prev = Music.key; Music.play('story'); const offTalk = onSpeaking(n => Music.under(n > 0));
    const m = el('div', 'theatre', `
      <div class="th-top"><span class="th-flag">${tale.flag}</span><b class="th-title">${esc(tale.title())}</b>${tale.story && featureOn('shortTalk', true) ? `<button class="th-skip">${pic('⏩')} ${T('Skip', 'Bỏ qua')}</button>` : ''}<button class="th-x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
      <div class="th-stage"><div class="th-bg"></div><div class="th-actors"></div><div class="th-fx"></div></div>
      <div class="th-text"></div>
      <div class="th-bar"><button class="th-prev" aria-label="${T('Back', 'Trang trước')}">◀<small>${T('Back', 'Trước')}</small></button><button class="th-next" aria-label="${T('Next', 'Trang sau')}">▶<small>${T('Next', 'Sau')}</small></button><div class="th-dots"></div><button class="th-pause" aria-label="${T('Pause', 'Dừng')}">${pic('⏸')}<small>${T('Pause', 'Dừng')}</small></button><button class="th-auto on" aria-label="${T('Read by itself', 'Tự đọc')}">${pic('📖')}<small>${T('Read', 'Tự đọc')}</small></button></div>`);
    document.body.appendChild(m);
    const stage = m.querySelector('.th-stage'), bg = m.querySelector('.th-bg'), actors = m.querySelector('.th-actors'), fx = m.querySelector('.th-fx'), text = m.querySelector('.th-text'), dots = m.querySelector('.th-dots');
    // (round R) tales that have a film are acted in 3D instead of the picture stage (js/film.js)
    // (loaded only when a story opens, so starting the game stays small)
    // (films batch, 13 Oct) the first films live in js/content/films.js; every other tale's film is its own small file
    // (js/content/talefilms.js), so a story loads only its own. A film that has not come after 10 s (a slow phone
    // network) is not waited for: the story is read over the picture stage instead (owner: films that did not start).
    let film = null, gaveUp = false;
    const loadFilm = async () => { const C = await import('./content/films.js'); return C.FILMS[tale.id] || (await import('./content/talefilms.js')).taleFilm(tale.id); };
    const ready = featureOn('storyFilms', true) ? loadFilm().then(async script => {
      if (!script || !alive || gaveUp) return; const F = await import('./film.js'); if (!alive || gaveUp) return;
      film = F.createFilm(stage, script, tale.ctx); if (!film) return; m.classList.add('film');
      // a narration line inside the film shows under the page's words, and is spoken only while the story reads itself
      film.onSay = (en, vi, kind) => { if (kind !== 'help') { text.querySelectorAll('.th-more').forEach(e => e.remove()); text.appendChild(el('p', 'th-more', esc(T(en, vi).replace(/\{name\}/g, name)))); } return auto ? sayAsync(en, vi) : Promise.resolve(); };
    }).catch(e => { console.warn('film', e); window.svModuleGone?.(e); }) : Promise.resolve();
    const readyOr = Promise.race([ready, wait(10000).then(() => { gaveUp = true; })]);
    const rate = () => window.__svFilmRate || 1; // (checks only: films played faster)
    const draw = async (fromFriend = false) => {
      const my = ++token; await readyOr; if (!alive || my !== token) return;
      const [pics, en, vi] = tale.pages[k], st = stageOf(en);
      if (film) return drawFilm(my, en, vi, fromFriend);
      stage.className = 'th-stage st-' + st; bg.innerHTML = SCENES[st] ? `<svg class="sc" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${SCENES[st]()}</svg>` : STAGE_ART[st] || '';
      // actors: spread across the stage, each entering from its side, then moving its own way
      // on a narrow (phone) stage fewer, smaller actors, spread over the whole width, so nobody overlaps
      const narrow = stage.clientWidth < 560, list = graphemes(pics).slice(0, narrow ? 4 : 7);
      actors.innerHTML = list.map((e, i) => {
        const n = list.length, x = n === 1 ? 50 : (narrow ? 12 : 14) + i * ((narrow ? 76 : 72) / (n - 1)), y = 38 + ((i * 37) % 3) * 9 - (moveOf(e) === 'fly' ? 24 : 0);
        const size = n <= 2 ? 22 : n <= 4 ? 17 : 13;
        // people are drawn cartoon characters who walk in; animals and things are the game's drawn pictures
        const base = e.replace(/\u200d.*$|[\u{1F3FB}-\u{1F3FF}\uFE0F]/gu, ''), fairy = base === '🧚';
        if (CAST[base]) { const gy = fairy ? 42 : 80 + (i % 2) * 7, sc = (fairy ? .8 : .9 + (gy - 80) / 50) * (narrow ? (n >= 3 ? .62 : .8) : 1); return `<span class="th-a th-c${fairy ? ' flying' : ' walking'} in-${i % 2 ? 'r' : 'l'}" style="left:${x}%;top:${gy}%;--sc:${sc.toFixed(2)};--d:${(i * .25).toFixed(2)}s;z-index:${gy}">${CAST[base]()}</span>`; }
        return `<span class="th-a mv-${moveOf(e)} in-${i % 2 ? 'r' : 'l'}" style="left:${x}%;top:${y}%;font-size:min(${size}vw, ${size * 1.25}vh);--d:${(i * .18).toFixed(2)}s">${hasArt(e) ? pic(e) : e}</span>`;
      }).join('');
      // weather and sparkles that fit the page
      fx.innerHTML = '';
      if (/🌧|rain|mưa/i.test(pics + en)) for (let i = 0; i < 26; i++) fx.appendChild(el('i', 'th-rain', '')).style.cssText = `left:${(i * 37) % 100}%;animation-delay:${(i % 9) * .13}s`;
      if (st === 'night') for (let i = 0; i < 18; i++) fx.appendChild(el('i', 'th-star', '✦')).style.cssText = `left:${(i * 53) % 100}%;top:${(i * 29) % 45}%;animation-delay:${(i % 5) * .4}s`;
      if (/✨|magic|thần|fairy|Bụt/i.test(pics + en)) for (let i = 0; i < 10; i++) fx.appendChild(el('i', 'th-spark', pic('✨'))).style.cssText = `left:${10 + (i * 41) % 80}%;top:${10 + (i * 23) % 60}%;animation-delay:${(i % 6) * .3}s`;
      text.innerHTML = `<p>${esc(T(en, vi).replace(/\{name\}/g, name))}</p>`;
      dots.innerHTML = tale.pages.map((_, i) => `<i class="${i === k ? 'on' : i < k ? 'done' : ''}"></i>`).join('');
      publish(fromFriend);
      m.querySelector('.th-prev').disabled = k === 0;
      m.querySelector('.th-next').innerHTML = (k === tale.pages.length - 1 ? pic('🏁') : '▶') + `<small>${k === tale.pages.length - 1 ? T('End', 'Hết') : T('Next', 'Sau')}</small>`;
      const pageSound=(SFX as typeof SFX & {page?:()=>void}).page; pageSound ? pageSound() : SFX.tap();
      await wait(450); if (!alive || my !== token) return;
      // characters stop walking once they are in place, and talk while the page is read
      setTimeout(() => actors.querySelectorAll('.th-c').forEach(a => a.classList.remove('walking')), 1900);
      const t0 = performance.now(); stage.classList.add('speaking'); await sayAsync(en, vi); stage.classList.remove('speaking');
      // with the voice off (or very fast), leave time to look at the picture and read the words
      const need = Math.min(9000, 1500 + T(en, vi).length * 55) - (performance.now() - t0); if (need > 0) await wait(need);
      if (!alive || my !== token || !auto) return;
      await wait(1100); if (!alive || my !== token || !auto) return;
      next();
    };
    // a page of a film: the film and the narrator start together; the page is over when both have finished
    const drawFilm = async (my, en, vi, fromFriend) => {
      text.innerHTML = `<p>${esc(T(en, vi).replace(/\{name\}/g, name))}</p>`;
      dots.innerHTML = tale.pages.map((_, i) => `<i class="${i === k ? 'on' : i < k ? 'done' : ''}"></i>`).join('');
      publish(fromFriend);
      m.querySelector('.th-prev').disabled = k === 0;
      m.querySelector('.th-next').innerHTML = (k === tale.pages.length - 1 ? pic('🏁') : '▶') + `<small>${k === tale.pages.length - 1 ? T('End', 'Hết') : T('Next', 'Sau')}</small>`;
      const pageSound=(SFX as typeof SFX & {page?:()=>void}).page; pageSound ? pageSound() : SFX.tap();
      const played = film.page(k);
      await wait(350 / rate()); if (!alive || my !== token) return;
      // (owner, 13 Oct: films that did not start by themselves) the words are never waited for longer than they could
      // take (both languages, slowly), so a voice the phone never finishes cannot stop the story
      await Promise.race([sayAsync(en, vi), wait(4000 + (en.length + vi.length) * 100)]); if (!alive || my !== token) return;
      film.narrated();
      await played; if (!alive || my !== token || !auto) return;
      await wait(900 / rate()); if (!alive || my !== token || !auto) return;
      next();
    };
    const finish = done => { if (!alive) return; alive = false; if(done && storyAttempt) managementEvidence.emit('story.completed',{storyId},storyAttempt); hush(); offTalk(); Music.under(false); if (film) film.close(); m.classList.add('out'); setTimeout(() => m.remove(), 300); Music.play(prev || 'field'); resolve(done); onDone && onDone(done); };
    const next = () => { if (k < tale.pages.length - 1) { k++; draw(); } else { SFX.chime && SFX.chime(); finish(true); } };
    // a friend turned the page
    if (sync) sync.listen(p => { if (!alive || p === k || p < 0 || p >= tale.pages.length) return; k = p; draw(true); });
    m.querySelector('.th-next').onclick = () => { SFX.tap(); next(); };
    m.querySelector('.th-prev').onclick = () => { if (k > 0) { SFX.tap(); k--; draw(); } };
    // (tester's notes, 12 Oct) four clear buttons: back, next, pause (stops the voice and the page turning) and the green
    // "read by itself", which reads this page again and goes on by itself
    const setAuto = on => { auto = on; m.querySelector('.th-auto').classList.toggle('on', on); m.querySelector('.th-pause').classList.toggle('on', !on); };
    m.querySelector('.th-pause').onclick = () => { SFX.tap(); token++; hush(); stage.classList.remove('speaking'); setAuto(false); };
    m.querySelector('.th-auto').onclick = () => { SFX.tap(); setAuto(true); draw(); };
    m.querySelector('.th-x').onclick = () => finish(false);
    // (Studio switch shortTalk) the story's own films can be skipped with one big button
    const sk = m.querySelector('.th-skip'); if (sk) sk.onclick = () => finish(false);
    // swipe left / right to turn the page
    let sx = null; stage.addEventListener('pointerdown', e => { sx = e.clientX; }); stage.addEventListener('pointerup', e => { if (sx == null) return; const d = (e.clientX - sx) * flip(stage); sx = null; if (d < -50) next(); else if (d > 50 && k > 0) { k--; draw(); } });
    const onKey = e => { if (!alive) return removeEventListener('keydown', onKey, true); if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); e.stopImmediatePropagation(); next(); } else if (e.code === 'ArrowLeft' && k > 0) { e.preventDefault(); e.stopImmediatePropagation(); k--; draw(); } else if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(false); } };
    addEventListener('keydown', onKey, true);
    draw();
  });
}

// painted stage backdrops (simple shapes, coloured by CSS)
const STAGE_ART = {
  sea: '<i class="sun"></i><i class="hill h1"></i><i class="waves w1"></i><i class="waves w2"></i>',
  night: '<i class="moon"></i><i class="hill h1"></i><i class="hill h2"></i>',
  sky: '<i class="sun"></i><i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i><i class="mount m1"></i><i class="mount m2"></i>',
  forest: '<i class="sun"></i><i class="tree t1"></i><i class="tree t2"></i><i class="tree t3"></i><i class="tree t4"></i><i class="ground"></i>',
  palace: '<i class="sun"></i><i class="palace"></i><i class="ground"></i><i class="cloud c1"></i>',
  field: '<i class="sun"></i><i class="cloud c2"></i><i class="paddy"></i><i class="ground"></i>',
  desert: '<i class="sun big"></i><i class="dune d1"></i><i class="dune d2"></i>',
  meadow: '<i class="sun"></i><i class="cloud c1"></i><i class="cloud c3"></i><i class="hill h1"></i><i class="hill h2"></i>'
};

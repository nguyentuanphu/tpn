// 🎵 Songs (round N, owner: "a music section, and hát ru for mums to put the children to sleep"): every song by group;
// tap one to hear it. Lullabies show their words and turn the page into a quiet night, with a sleep timer that fades
// the music out. While the page is open the valley leaves the music alone (Music.pinned).
import { T, both } from './i18n.js';
import { el, esc } from './util.js';
import { SFX, Music } from './audio.js';
import { say } from './voice.js';
import { pic } from './art.js';
import { SONG_GROUPS, SONG_LIST, familySongs } from './content/songs.js';

let open = null;
export function openSongs(G, start) {
  if (open) return open;
  const fam = familySongs(); for (const f of fam) Music.files[f.key] = f.file;
  const all = SONG_LIST.filter(s => Music.has(s.key)).concat(fam), groups = SONG_GROUPS.filter(g => all.some(s => s.group === g.key));
  const idOf = s => s.alt || s.key;
  let group = start && groups.some(g => g.key === start) ? start : groups[0].key, playing = null, timer = null, timerMins = 0;
  const wasPaused = G.paused, prev = Music.key; G.paused = true; Music.pinned = true;
  const m = el('div', 'songs'); document.body.appendChild(m); document.body.classList.add('songs-on');
  function draw() {
    const night = group === 'lullaby', now = all.find(s => idOf(s) === playing);
    m.classList.toggle('night', night);
    m.innerHTML = `<div class="sg-top"><h2>${pic('🎵')} ${T('Songs', 'Bài hát')}</h2><button class="sg-x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
      <nav class="sg-groups">${groups.map(g => `<button data-g="${g.key}" class="${g.key === group ? 'on' : ''}"><span>${pic(g.icon)}</span><small>${esc(g.name())}</small></button>`).join('')}</nav>
      <div class="sg-list">${all.filter(s => s.group === group).map(s => `<button class="sg-song${idOf(s) === playing ? ' on' : ''}" data-s="${idOf(s)}"><span>${pic(s.icon)}</span><b>${esc(s.name())}</b><i>${idOf(s) === playing ? '⏸' : '▶'}</i></button>`).join('')}</div>
      ${night ? `<div class="sg-sleep"><span>${pic('😴')} ${T('Sleep timer', 'Hẹn giờ ngủ')}</span>${[0, 15, 30].map(n => `<button data-t="${n}" class="${timerMins === n ? 'on' : ''}">${n ? n + ' ' + T('min', 'phút') : T('Off', 'Tắt')}</button>`).join('')}</div>` : ''}
      ${now && now.words ? `<div class="sg-words">${now.words.map(([vi, en]) => `<p><b>${esc(vi)}</b>${T(`<small>${esc(en)}</small>`, '')}</p>`).join('')}</div>` : ''}
      ${night ? '<div class="sg-moon" aria-hidden="true"></div>' : ''}`;
    m.querySelector('.sg-x').onclick = close;
    m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { SFX.tap(); group = b.dataset.g; draw(); const g = groups.find(x => x.key === group); say(...both(g.name)); });
    m.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      SFX.tap(); const s = all.find(x => idOf(x) === b.dataset.s);
      if (playing === idOf(s)) { playing = null; Music.stop(); } else { playing = idOf(s); Music.stop(); Music.play(s.key, true); }
      draw();
    });
    m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { SFX.tap(); timerMins = +b.dataset.t; clearTimeout(timer); if (timerMins) timer = setTimeout(() => { Music.fadeOut(8); playing = null; draw(); }, timerMins * 60e3); draw(); });
  }
  function close() {
    clearTimeout(timer); m.remove(); document.body.classList.remove('songs-on'); open = null; Music.pinned = false; Music.stop(); G.paused = wasPaused;
    if (prev && prev !== Music.key) Music.play(prev);
  }
  draw(); say('Tap a song to listen.', 'Chạm vào một bài để nghe nhé.');
  open = { close, el: m, get playing() { return playing; } };
  return open;
}

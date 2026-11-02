// Music Corner: play instruments from the four cultures, the đàn bầu (Vietnam), the didgeridoo
// (Australia), the guzheng (China) and the tabla (India). Tap the pads to play, record a little tune
// and play it back. There is no wrong answer here: it's free play.
import { register } from './frame.js';
import { T } from '../i18n.js';
import { tone, noise } from '../audio.js';
import { el, wait } from '../util.js';

const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76];
export const INSTRUMENTS: Record<string, { flag: string; icon: string; name: () => string; about: [string, string]; play: (n: number) => void }> = {
  danbau: { flag: '🇻🇳', icon: '🎸', name: () => T('Đàn bầu', 'Đàn bầu'), about: ['The đàn bầu has just one string. The player bends a flexible stick to make the note slide up and down, like singing!', 'Đàn bầu chỉ có một dây. Người chơi uốn cần đàn để nốt nhạc trượt lên xuống, như đang hát vậy!'],
    play: n => tone(midi(PENTA[n] + 12), 1.4, { type: 'sine', vol: .2, bend: [.18, n % 2 ? 1.06 : .95, .5], vib: 5, vibRate: 5.5, attack: .01 }) },
  didgeridoo: { flag: '🇦🇺', icon: '🪵', name: () => T('Didgeridoo', 'Kèn didgeridoo'), about: ['The didgeridoo is a long wooden tube played by Aboriginal people in northern Australia for thousands of years. It makes a deep, buzzing drone.', 'Didgeridoo là ống gỗ dài, người Thổ dân miền bắc nước Úc đã thổi từ hàng nghìn năm nay. Nó tạo ra tiếng ù trầm và rung.'],
    play: n => { const f = midi(36 + [0, 0, 2, 3, 5, 7, 7, 10][n]); tone(f, 1.3, { type: 'sawtooth', vol: .16, filter: 'lowpass', ff: 380 + n * 60, q: 6, vib: 2, vibRate: 7 }); tone(f * 2, 1.3, { type: 'triangle', vol: .05, filter: 'lowpass', ff: 700 }); } },
  guzheng: { flag: '🇨🇳', icon: '🎼', name: () => T('Guzheng', 'Đàn tranh (guzheng)'), about: ['The guzheng is a long Chinese zither with many strings. Players pluck it with little picks on their fingers. Vietnam has a cousin called the đàn tranh!', 'Guzheng là đàn tranh dài của Trung Quốc với nhiều dây. Người chơi gảy bằng móng gảy đeo ở ngón tay. Việt Nam cũng có đàn tranh!'],
    play: n => { const f = midi(PENTA[n] + 12); tone(f, 1.6, { type: 'triangle', vol: .2, attack: .003 }); tone(f * 2, .5, { type: 'sine', vol: .06, attack: .002 }); tone(f * 3.01, .25, { type: 'sine', vol: .03, attack: .002 }); } },
  tabla: { flag: '🇮🇳', icon: '🥁', name: () => T('Tabla', 'Trống tabla'), about: ['The tabla is a pair of hand drums from India: a small one that rings and a big one that goes boom and can change its pitch.', 'Tabla là cặp trống tay của Ấn Độ: trống nhỏ kêu vang, trống lớn kêu bùm và có thể đổi cao độ.'],
    play: n => {
      if (n < 4) { const f = 300 + n * 70; tone(f, .5, { type: 'sine', vol: .25, attack: .002 }); tone(f * 2.7, .12, { type: 'sine', vol: .06 }); noise(.04, { freq: 3000, vol: .08 }); }
      else { const f = 70 + (n - 4) * 12; tone(f * 1.6, .6, { type: 'sine', vol: .32, to: f, attack: .002 }); noise(.06, { freq: 500, vol: .12, type: 'lowpass' }); }
    } }
};
const PAD_COLORS = ['#ff5f7e', '#ff9f43', '#ffd23f', '#5fd36a', '#3cc7e8', '#5f8bff', '#a66bff', '#ff7eb8'];

register({
  id: 'music', icon: '🎶', origin: 'both', name: () => T('Music Corner', 'Góc Âm Nhạc'),
  async run(api) {
    type Note = [number, number, string];
    let inst = 'danbau', rec: (Note[] & { t0: number }) | null = null, tune: Note[] = [];
    let playback = 0, playingTune = false;
    api.onCleanup(() => { playback++; playingTune = false; });
    const refreshPlayback = () => { const b = api.stage.querySelector('.mc-row button:nth-child(2)'); if (b) b.disabled = !tune.length || playingTune; };
    api.dots(0, 0);
    // (v1.07 levels) a free music pad with nothing to get right: one setting at every level (8 pads, record up to 40 notes)
    api.stage.dataset.lv = '8,40,free';
    const draw = () => {
      const I = INSTRUMENTS[inst];
      api.stage.innerHTML = '';
      const tabs = el('div', 'mc-tabs'); Object.entries(INSTRUMENTS).forEach(([k, v]) => { const b = el('button', 'mc-tab' + (k === inst ? ' on' : ''), `<span>${v.flag}${v.icon}</span><small>${v.name()}</small>`); b.onclick = () => { inst = k; draw(); api.say(...v.about); }; tabs.appendChild(b); });
      api.stage.appendChild(tabs);
      const pads = el('div', 'mc-pads' + (inst === 'tabla' ? ' drums' : ''));
      for (let n = 0; n < 8; n++) {
        const b = el('button', 'mc-pad', inst === 'tabla' ? (n < 4 ? '🔔' : '💥') : '♪'); b.style.setProperty('--c', PAD_COLORS[n]);
        b.onpointerdown = e => { e.preventDefault(); I.play(n); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); if (rec) { rec.push([performance.now() - rec.t0, n, inst]); recInfo.textContent = '⏺️ ' + rec.length; } };
        pads.appendChild(b);
      }
      api.stage.appendChild(pads);
      const row = el('div', 'mc-row');
      const recB = el('button', 'btn big' + (rec ? ' danger' : ''), rec ? '⏹️ ' + T('Stop', 'Dừng') : '⏺️ ' + T('Record', 'Thu âm'));
      const playB = el('button', 'btn big primary', '▶️ ' + T('Play my tune', 'Nghe giai điệu của con')); playB.disabled = !tune.length || playingTune;
      const doneB = el('button', 'btn big', '🌟 ' + T('Finish', 'Xong'));
      const recInfo = el('span', 'mc-info', rec ? '⏺️ ' + rec.length : tune.length ? `🎵 ${tune.length}` : '');
      recB.onclick = () => {
        playback++; playingTune = false;
        if (rec) { tune = rec.slice(0, 40); rec.t0 = 0; rec = null; api.say(tune.length ? 'Recorded! Tap play to hear your tune.' : 'Nothing recorded. Try again!', tune.length ? 'Đã thu xong! Bấm nghe để nghe giai điệu của con.' : 'Chưa thu được gì. Thử lại nhé!'); }
        else { const notes: Note[] = []; rec = Object.assign(notes, { t0: performance.now() }); api.say('Recording! Play your tune now.', 'Đang thu âm! Con chơi giai điệu đi.'); }
        draw();
      };
      playB.onclick = async () => {
        if (playingTune || api.closed) return;
        const token = ++playback, notes = tune.slice(), start = performance.now(); playingTune = true; refreshPlayback();
        try {
          for (const [t, n, k] of notes) {
            const w = t - (performance.now() - start); if (w > 0) await wait(w);
            if (api.closed || token !== playback) return;
            INSTRUMENTS[k].play(n); const b = api.stage.querySelectorAll('.mc-pad')[n];
            if (b && k === inst) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
          }
          await wait(1650); // let the longest plucked note finish before replaying the tune
        } finally { if (token === playback) { playingTune = false; refreshPlayback(); } }
      };
      doneB.onclick = () => api.win({ title: T('What beautiful music!', 'Âm nhạc hay quá!') });
      row.append(recB, playB, recInfo, doneB); api.stage.appendChild(row);
    };
    draw();
    api.say('Welcome to the Music Corner! Choose an instrument and tap the coloured pads.', 'Chào mừng đến Góc Âm Nhạc! Chọn một nhạc cụ rồi chạm vào các phím màu nhé.');
    await new Promise<void>(res => api.onCleanup(res));
  }
});

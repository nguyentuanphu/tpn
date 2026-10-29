// Vietnamese festive and community games (owner, 23 Oct 2026 AEDT):
// Bánh Chưng, star lantern, lion dance drummer, and Tết pole decorator.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { saveProfiles } from '../state.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.v2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.v2-stage { position: relative; width: min(360px, 86vw); height: min(320px, 48vh); background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.v2-cake { width: 180px; height: 180px; background: #5fa860; border-radius: 18px; border: 4px solid #2f6932; position: relative; box-shadow: inset 0 0 0 6px #7fd07a, 0 6px 14px rgba(0,0,0,.15); transition: all .3s; }
.v2-layer { position: absolute; inset: 10px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 48px; opacity: 0; transform: scale(.6); transition: all .35s cubic-bezier(.34, 1.56, .64, 1); }
.v2-layer.on { opacity: 1; transform: scale(1); }
.v2-string { position: absolute; background: #ffd96b; opacity: 0; transition: opacity .3s; }
.v2-cake.tied .v2-string { opacity: 1; }
.v2-cake.tied { box-shadow: 0 0 0 4px #ffd96b, 0 8px 20px rgba(47, 105, 50, .4); }
.v2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.v2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.v2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.v2-btn.go { background: #3cba54; color: #fff; border-color: #267735; }
.v2-btn[disabled] { opacity: .45; cursor: not-allowed; transform: none; }
.v2-star { width: min(280px, 75vw); height: min(280px, 75vw); position: relative; display: flex; align-items: center; justify-content: center; }
.v2-star svg { width: 100%; height: 100%; filter: drop-shadow(0 4px 10px rgba(0,0,0,.2)); }
.v2-glow { position: absolute; inset: 10%; border-radius: 50%; background: radial-gradient(circle, #ffde00 0%, rgba(255,222,0,0) 70%); opacity: 0; transition: opacity .6s; pointer-events: none; }
.v2-glow.lit { opacity: .85; animation: v2-pulse 1.2s infinite alternate ease-in-out; }
@keyframes v2-pulse { 0% { transform: scale(.95); opacity: .7; } 100% { transform: scale(1.08); opacity: 1; } }
.v2-drum { width: min(240px, 65vw); height: min(240px, 65vw); border-radius: 50%; background: #da251d; border: 8px solid #ffde00; box-shadow: 0 8px 24px rgba(218, 37, 29, .35); display: flex; align-items: center; justify-content: center; cursor: pointer; touch-action: manipulation; position: relative; }
.v2-drum:active { transform: scale(.94); }
.v2-beat { font: 900 22px var(--font, sans-serif); color: #b9a8cc; display: flex; gap: 10px; }
.v2-beat .now { color: #da251d; transform: scale(1.25); }
.v2-stage .v2-beat + * { margin-top: 0; }
.v2-pole { width: 14px; height: min(280px, 45vh); background: #c9a05a; border-radius: 7px; position: relative; box-shadow: 2px 2px 6px rgba(0,0,0,.15); }
.v2-deco { position: absolute; transition: all .4s cubic-bezier(.34, 1.56, .64, 1); transform: scale(0); opacity: 0; font-size: 32px; }
.v2-deco.on { transform: scale(1); opacity: 1; }
`));
}

function keep(api, png: string) {
  for (const p of api.players || []) {
    if (!p || !Array.isArray(p.album)) continue;
    p.album.push(png);
    if (p.album.length > 12) p.album.shift();
  }
  saveProfiles();
}

// 1. Wrap Bánh Chưng for Tết
register({
  id: 'banhchung', icon: '🍃',
  name: () => T('Wrap Bánh Chưng for Tết', 'Làm Bánh Chưng Ngày Tết'),
  async run(api) {
    style();
    api.say('Lay dong leaves, sticky rice, mung beans, pork, and tie the string!',
      'Xếp lá dong, gạo nếp, đỗ xanh, thịt lợn rồi buộc lạt nhé!');
    api.dots(5, 0);
    const wrap = el('div', 'v2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'v2-stage'); wrap.appendChild(stage);
    const cake = el('div', 'v2-cake'); stage.appendChild(cake);
    const layers = [
      { id: 'leaf', icon: '🍃', name: ['dong leaves', 'lá dong'] },
      { id: 'rice', icon: '🌾', name: ['sticky rice', 'gạo nếp'] },
      { id: 'bean', icon: '🫘', name: ['mung beans', 'đỗ xanh'] },
      { id: 'pork', icon: '🥢', name: ['pork', 'thịt lợn'] }
    ];
    layers.forEach((l, idx) => {
      const lay = el('div', 'v2-layer', pic(l.icon));
      lay.dataset.layer = l.id;
      cake.appendChild(lay);
    });
    const s1 = el('div', 'v2-string'); s1.style.cssText = 'top:0;bottom:0;left:45%;width:10%;'; cake.appendChild(s1);
    const s2 = el('div', 'v2-string'); s2.style.cssText = 'left:0;right:0;top:45%;height:10%;'; cake.appendChild(s2);

    const controls = el('div', 'v2-controls'); wrap.appendChild(controls);
    const buttons = layers.map((l, idx) => {
      const b = el('button', 'v2-btn', `${pic(l.icon)} <span>${T(l.name[0], l.name[1])}</span>`);
      b.dataset.step = String(idx);
      controls.appendChild(b);
      return b;
    });
    const tieBtn = el('button', 'v2-btn go', `${pic('🎋')} <span>${T('Tie string', 'Buộc lạt')}</span>`);
    tieBtn.dataset.step = '4';
    tieBtn.style.display = 'none';
    controls.appendChild(tieBtn);
    buttons.push(tieBtn);
    // (owner, 29 Oct 2026 AEDT audit) the buttons stood in the wrapping order already: they are mixed now, and the order
    // is the real one the grown-ups use (leaves, rice, beans, pork, then tie)
    buttons.slice(0, 4).sort(() => Math.random() - .5).forEach(b => controls.insertBefore(b, tieBtn));

    let step = 0;
    while (step < 5) {
      api.plan(() => buttons[step] || null, { maxActions: 6 });
      const target = buttons[step];
      const clicked = await untilRight(api, buttons, e => e === target);
      if (!clicked || api.closed) return;
      if (step < 4) {
        cake.querySelectorAll('.v2-layer')[step].classList.add('on');
        api.sfx.pop(step);
      } else {
        cake.classList.add('tied');
        api.sfx.ding();
      }
      step++;
      api.dots(5, step);
      if (step === 4) {
        buttons.slice(0, 4).forEach(b => b.style.display = 'none');
        tieBtn.style.display = 'inline-flex';
        api.say('Tie the bamboo string nice and tight!', 'Buộc lạt giang thật chặt tay nào!');
      }
      await wait(300);
    }
    api.say('A square, fragrant Bánh Chưng for Tết!', 'Bánh Chưng xanh vuông vắn cho ngày Tết!');
    await wait(1200);
    return api.win({ title: T('Bánh Chưng is wrapped!', 'Bánh Chưng đã gói xong!') });
  }
});

// 2. Make a Star Lantern
register({
  id: 'denongsao', icon: '⭐',
  name: () => T('Make a Star Lantern', 'Làm Đèn Ông Sao'),
  async run(api) {
    style();
    api.say('Assemble the bamboo frame, paste the red paper, and light the candle!',
      'Gắn khung tre, dán giấy bóng kính đỏ rồi thắp nến lên nhé!');
    api.dots(4, 0);
    const wrap = el('div', 'v2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'v2-stage'); wrap.appendChild(stage);
    const starBox = el('div', 'v2-star'); stage.appendChild(starBox);
    const glow = el('div', 'v2-glow'); starBox.appendChild(glow);

    starBox.innerHTML += `
      <svg viewBox="0 0 100 100">
        <polygon class="v2-poly" points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36" fill="#fffdf6" stroke="#c9a05a" stroke-width="4"/>
        <circle class="v2-ring" cx="50" cy="50" r="28" fill="none" stroke="#c9a05a" stroke-width="3" opacity="0"/>
        <circle class="v2-hub" cx="50" cy="50" r="8" fill="#c9a05a" opacity="0"/>
      </svg>`;
    const poly = starBox.querySelector('.v2-poly') as SVGPolygonElement;
    const ring = starBox.querySelector('.v2-ring') as SVGCircleElement;
    const hub = starBox.querySelector('.v2-hub') as SVGCircleElement;

    const controls = el('div', 'v2-controls'); wrap.appendChild(controls);
    const steps = [
      { icon: '🎋', name: ['Bamboo ring', 'Vòng tre'], fn: () => { ring.setAttribute('opacity', '1'); hub.setAttribute('opacity', '1'); api.sfx.tap(); } },
      { icon: '🏮', name: ['Red cellophane', 'Giấy bóng đỏ'], fn: () => { poly.setAttribute('fill', '#da251d'); poly.setAttribute('opacity', '.85'); api.sfx.pop(2); } },
      { icon: '⭐', name: ['Gold trim', 'Viền vàng'], fn: () => { poly.setAttribute('stroke', '#ffde00'); ring.setAttribute('stroke', '#ffde00'); api.sfx.pop(4); } },
      { icon: '🕯️', name: ['Light candle', 'Thắp nến'], fn: () => { glow.classList.add('lit'); api.sfx.chime(); } }
    ];
    const btns = steps.map((s, idx) => {
      const b = el('button', 'v2-btn', `${pic(s.icon)} <span>${T(s.name[0], s.name[1])}</span>`);
      b.dataset.step = String(idx);
      return b;
    });
    // (owner, 29 Oct 2026 AEDT audit) the buttons stood in order: they are mixed now. The frame goes first and the candle
    // last, as for a real lantern; the red paper and the gold trim go in either order
    [...btns].sort(() => Math.random() - .5).forEach(b => controls.appendChild(b));
    const allowed = (b: HTMLElement) => { const k = Number(b.dataset.step); return !b.hasAttribute('disabled') && (currentStep === 0 ? k === 0 : currentStep === 3 ? k === 3 : k === 1 || k === 2); };

    let currentStep = 0;
    while (currentStep < 4) {
      api.plan(() => btns.find(allowed) || null, { maxActions: 5 });
      const clicked = await untilRight(api, btns, allowed);
      if (!clicked || api.closed) return;
      clicked.setAttribute('disabled', '');
      steps[Number(clicked.dataset.step)].fn();
      if (currentStep === 0) api.say('Now the red paper and the gold trim!', 'Giờ dán giấy đỏ và viền vàng nào!');
      if (currentStep === 2) api.say('Last, light the candle!', 'Cuối cùng, thắp nến nhé!');
      currentStep++;
      api.dots(4, currentStep);
      await wait(350);
    }
    api.say('The star lantern shines bright for the festival!', 'Đèn ông sao sáng rực rỡ đón hội trăng rằm!');
    await wait(1200);
    return api.win({ title: T('Bright Star Lantern!', 'Đèn Ông Sao Sáng Rực!') });
  }
});

// 3. Lion Dance Drummer
register({
  id: 'mualan', icon: '🦁',
  name: () => T('Lion Dance Drummer', 'Múa Lân Rộn Ràng'),
  async run(api) {
    style();
    api.say('Play the lion dance beat: tùng, tùng, cắc, tùng! Follow the bright word.',
      'Đánh nhịp múa lân: tùng, tùng, cắc, tùng! Theo chữ đang sáng nhé.');
    const targetBeats = api.little ? 6 : 10;
    api.dots(targetBeats, 0);
    const wrap = el('div', 'v2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'v2-stage'); wrap.appendChild(stage);
    // (owner, 29 Oct 2026 AEDT audit) a real lion-dance beat: "tùng" on the drum skin and "cắc" on the rim, in the pattern
    // the card shows (it counted any taps on the drum, with no beat at all)
    stage.style.flexDirection = 'column'; stage.style.gap = '18px';
    const lion = el('div', '', pic('🦁')); lion.style.fontSize = '84px'; stage.appendChild(lion);
    const card = el('div', 'v2-beat'); stage.appendChild(card);
    const controls = el('div', 'v2-controls'); wrap.appendChild(controls);
    const tung = el('button', 'v2-btn', `${pic('🥁')} <span>${T('Tùng (drum)', 'Tùng (mặt trống)')}</span>`);
    const cac = el('button', 'v2-btn', `${pic('drum:sticks')} <span>${T('Cắc (rim)', 'Cắc (tang trống)')}</span>`);
    controls.append(tung, cac);
    const pattern = ['tung', 'tung', 'cac', 'tung'];
    let beats = 0;
    const show = () => { card.innerHTML = pattern.map((p, i) => `<span class="${i === beats % 4 ? 'now' : ''}">${p === 'tung' ? 'Tùng' : 'Cắc'}</span>`).join(' '); };
    show();
    while (beats < targetBeats) {
      const want = pattern[beats % 4] === 'tung' ? tung : cac;
      api.plan(() => want, { maxActions: 4 });
      const clicked = await untilRight(api, [tung, cac], e => e === want);
      if (!clicked || api.closed) return;
      beats++;
      api.dots(targetBeats, beats);
      if (want === tung) api.sfx.pop(beats % 4); else api.sfx.tap();
      lion.style.transform = `scale(${1 + (beats % 2 ? .2 : -.1)}) rotate(${beats % 2 ? 15 : -15}deg)`;
      setTimeout(() => { lion.style.transform = 'scale(1) rotate(0)'; }, 180);
      show();
    }
    api.say('The lion leaps and dances with your drum!', 'Chú lân nhảy múa theo tiếng trống của con thật hay!');
    await wait(1200);
    return api.win({ title: T('Joyful Lion Dance!', 'Múa Lân Rộn Ràng!') });
  }
});

// 4. Tết Pole Decorator
register({
  id: 'cayneu', icon: '🎋',
  name: () => T('Tết Pole Decorator', 'Trồng Cây Nêu Ngày Tết'),
  async run(api) {
    style();
    api.say('Decorate the bamboo pole with a carp, wind chimes, and a red flag!',
      'Treo cá chép, chuông gió và cờ đỏ lên ngọn cây nêu nhé!');
    api.dots(4, 0);
    const wrap = el('div', 'v2-board'); api.stage.appendChild(wrap);
    const stage = el('div', 'v2-stage'); wrap.appendChild(stage);
    const pole = el('div', 'v2-pole'); stage.appendChild(pole);

    const items = [
      { id: 'top', icon: '🌿', name: ['Bamboo leaves', 'Lá tre'], top: '5%', left: '-20px' },
      { id: 'carp', icon: '🎏', name: ['Carp charm', 'Cá chép'], top: '22%', left: '18px' },
      { id: 'chime', icon: '🔔', name: ['Wind chimes', 'Chuông gió'], top: '42%', left: '-26px' },
      { id: 'flag', icon: '🚩', name: ['Red flag', 'Cờ đỏ'], top: '65%', left: '16px' }
    ];
    const decos = items.map(it => {
      const d = el('div', 'v2-deco', pic(it.icon));
      d.style.top = it.top; d.style.left = it.left;
      pole.appendChild(d);
      return d;
    });

    const controls = el('div', 'v2-controls'); wrap.appendChild(controls);
    const btns = items.map((it, idx) => {
      const b = el('button', 'v2-btn', `${pic(it.icon)} <span>${T(it.name[0], it.name[1])}</span>`);
      b.dataset.step = String(idx);
      controls.appendChild(b);
      return b;
    });

    // (owner, 29 Oct 2026 AEDT audit) any order: each charm has its own place on the pole (it wanted one order nobody was told)
    let currentStep = 0;
    while (currentStep < 4) {
      api.plan(() => btns.find(b => !b.hasAttribute('disabled')) || null, { maxActions: 5 });
      const clicked = await untilRight(api, btns, e => !e.hasAttribute('disabled'));
      if (!clicked || api.closed) return;
      clicked.setAttribute('disabled', '');
      decos[Number(clicked.dataset.step)].classList.add('on');
      api.sfx.ding();
      currentStep++;
      api.dots(4, currentStep);
      await wait(350);
    }
    api.say('The Tết pole stands tall to welcome the new year!', 'Cây nêu ngày Tết đã dựng cao đón năm mới bình an!');
    await wait(1200);
    return api.win({ title: T('Tết Pole is Standing!', 'Cây Nêu Đã Dựng Xong!') });
  }
});
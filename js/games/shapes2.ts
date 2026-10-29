// Shapes additions (owner, 23 Oct 2026 AEDT): 3D solids, shape hunt, tiles, rotation, trains, lines and folding.
// (owner, 29 Oct 2026 AEDT audit) rebuilt: the right answer stood in a fixed place, the shapes were text symbols, Tile
// the Floor took one fixed order, Turn It Round won after three taps whatever the arrow showed, and Fold the Box wanted
// the sides in one order nobody was told. Now the shapes are drawn, answers are mixed, tiles and sides go in any order,
// and the arrow has to point at the star.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.s2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.s2-stage { width: min(360px, 86vw); min-height: 190px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 12px; }
.s2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 380px; }
.s2-btn { min-width: 64px; min-height: 64px; padding: 8px 16px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; touch-action: manipulation; }
.s2-btn svg { width: 40px; height: 40px; flex: none; }
.s2-picture { font-size: 84px; line-height: 1.1; text-align: center; }
.s2-picture svg { width: 150px; height: 110px; }
.s2-grid { display: grid; grid-template-columns: repeat(3, 72px); gap: 6px; }
.s2-tile { width: 72px; height: 72px; border: 2px dashed #b9a8cc; border-radius: 8px; background: #fff; cursor: pointer; padding: 0; touch-action: manipulation; }
.s2-tile.blue { border: 2px solid #3b2a4f; background: #3b6fe0; }
.s2-tile.gold { border: 2px solid #3b2a4f; background: #ffd23f radial-gradient(circle, #3b6fe0 0 22%, transparent 23%); }
.s2-turn { position: relative; width: 210px; height: 210px; }
.s2-turn .s2-arrow { position: absolute; left: 55px; top: 55px; width: 100px; height: 100px; transition: transform .35s; }
.s2-turn .s2-star { position: absolute; width: 48px; height: 48px; font-size: 48px; line-height: 1; display: flex; align-items: center; justify-content: center; }
.s2-turn .s2-star .art { width: 52px; height: 52px; }
.s2-train { display: flex; align-items: flex-end; gap: 6px; }
.s2-train .s2-engine { font-size: 70px; line-height: 1; }
.s2-wagon { width: 110px; height: 90px; border: 4px solid #3b2a4f; border-radius: 10px; background: #ff9f43; display: flex; align-items: center; justify-content: center; }
.s2-wagon svg { width: 64px; height: 64px; }
.s2-net { display: grid; grid-template: repeat(3, 72px) / repeat(3, 72px); gap: 3px; }
.s2-net .s2-base { grid-area: 2 / 2; background: #e6b673; border: 3px solid #3b2a4f; border-radius: 4px; }
.s2-flap { border: 3px dashed #3b2a4f; border-radius: 6px; background: #f6d9a8; cursor: pointer; font: 800 15px var(--font, sans-serif); color: #3b2a4f; touch-action: manipulation; transition: transform .35s, background .35s; }
.s2-flap.up { background: #c98f48; border-style: solid; }
.s2-flap.top.up { transform: perspective(200px) rotateX(-60deg); transform-origin: bottom; }
.s2-flap.bottom.up { transform: perspective(200px) rotateX(60deg); transform-origin: top; }
.s2-flap.left.up { transform: perspective(200px) rotateY(60deg); transform-origin: right; }
.s2-flap.right.up { transform: perspective(200px) rotateY(-60deg); transform-origin: left; }
`));
}

const mix = <V,>(list: V[]): V[] => [...list].sort(() => Math.random() - .5);
const INK = 'stroke="#3b2a4f" stroke-width="4" stroke-linejoin="round"';
// a flat shape drawn in a 64 by 64 box
const SHAPES = {
  circle: (c: string) => `<circle cx="32" cy="32" r="26" fill="${c}" ${INK}/>`,
  square: (c: string) => `<rect x="7" y="7" width="50" height="50" rx="3" fill="${c}" ${INK}/>`,
  triangle: (c: string) => `<path d="M32 6L59 56H5Z" fill="${c}" ${INK}/>`,
  rectangle: (c: string) => `<rect x="4" y="16" width="56" height="32" rx="3" fill="${c}" ${INK}/>`,
};
type Flat = keyof typeof SHAPES;
const NAMES: Record<Flat, [string, string]> = { circle: ['Circle', 'Hình tròn'], square: ['Square', 'Hình vuông'], triangle: ['Triangle', 'Hình tam giác'], rectangle: ['Rectangle', 'Hình chữ nhật'] };
const svg = (inner: string, box = '0 0 64 64') => `<svg viewBox="${box}" aria-hidden="true">${inner}</svg>`;
// a solid drawn in a 64 by 64 box
const SOLIDS = {
  sphere: svg(`<circle cx="32" cy="32" r="26" fill="#ff8a65" ${INK}/><ellipse cx="32" cy="32" rx="26" ry="8" fill="none" stroke="#3b2a4f" stroke-width="2" stroke-dasharray="4 3"/><circle cx="23" cy="22" r="5" fill="#fff" opacity=".6"/>`),
  cube: svg(`<path d="M10 22L32 12L54 22V44L32 54L10 44Z" fill="#6fa8ff" ${INK}/><path d="M10 22L32 32L54 22M32 32V54" fill="none" ${INK}/>`),
  cylinder: svg(`<path d="M12 14V50A20 7 0 0 0 52 50V14" fill="#7ed957" ${INK}/><ellipse cx="32" cy="14" rx="20" ry="7" fill="#a6ec85" ${INK}/>`),
};
type Solid = keyof typeof SOLIDS;
const SOLID_NAMES: Record<Solid, [string, string]> = { sphere: ['Sphere', 'Khối cầu'], cube: ['Cube', 'Khối lập phương'], cylinder: ['Cylinder', 'Khối trụ'] };

type Round = { show: string; ask: [string, string]; answer: string; choices: { key: string; html: string }[] };
async function rounds(api, intro: [string, string], list: Round[], done: [string, string]) {
  style();
  api.say(intro[0], intro[1]);
  api.dots(list.length, 0);
  const wrap = el('div', 's2-board'), stage = el('div', 's2-stage'), controls = el('div', 's2-controls');
  api.stage.appendChild(wrap); wrap.append(stage, controls);
  await wait(1000);
  for (let k = 0; k < list.length; k++) {
    const q = list[k];
    stage.innerHTML = '';
    stage.append(el('div', 's2-picture', q.show));
    api.say(q.ask[0], q.ask[1]);
    controls.innerHTML = '';
    const btns = mix(q.choices).map(c => { const b = el('button', 's2-btn', c.html); b.dataset.key = c.key; controls.appendChild(b); return b; });
    const target = btns.find(b => b.dataset.key === q.answer);
    api.plan(() => target, { maxActions: 5 });
    const clicked = await untilRight(api, btns, e => e === target);
    if (!clicked || api.closed) return;
    api.sfx.ding();
    api.dots(list.length, k + 1);
    await wait(600);
  }
  api.say(done[0], done[1]); await wait(900);
  return api.win({ title: T(done[0], done[1]) });
}
const shapeChoice = (k: Flat) => ({ key: k, html: svg(SHAPES[k]('#ffd23f')) + `<span>${T(NAMES[k][0], NAMES[k][1])}</span>` });

register({
  id: 'solids', icon: '⚽', name: () => T('Ball, Box, Can', 'Khối Cầu, Hộp, Trụ'),
  run: api => {
    const things: [string, Solid, [string, string]][] = [['⚽', 'sphere', ['a ball', 'quả bóng']], ['🍊', 'sphere', ['an orange', 'quả cam']], ['📦', 'cube', ['a box', 'cái hộp']], ['🎲', 'cube', ['a dice', 'con xúc xắc']], ['🥫', 'cylinder', ['a can', 'cái lon']], ['🥁', 'cylinder', ['a drum', 'cái trống']]];
    const pickOne = (s: Solid) => mix(things.filter(t => t[1] === s))[0];
    return rounds(api, ['Match each thing to its solid shape!', 'Ghép đồ vật với khối của nó nhé!'],
      mix(['sphere', 'cube', 'cylinder'] as Solid[]).map(s => {
        const [icon, , name] = pickOne(s);
        return { show: pic(icon), ask: ['Which solid is ' + name[0] + '?', name[1][0].toUpperCase() + name[1].slice(1) + ' là khối gì?'], answer: s,
          choices: (Object.keys(SOLIDS) as Solid[]).map(k => ({ key: k, html: SOLIDS[k] + `<span>${T(SOLID_NAMES[k][0], SOLID_NAMES[k][1])}</span>` })) };
      }), ['All the solids are sorted!', 'Bé phân loại khối thật chuẩn!']);
  }
});

register({
  id: 'townshapes', icon: '🏘️', name: () => T('Shape Hunt in Town', 'Tìm Hình Trong Phố'),
  run: api => {
    const finds: [string, Flat, [string, string]][] = [['🏠', 'triangle', ['the roof', 'mái nhà']], ['🍕', 'triangle', ['the pizza slice', 'miếng bánh pizza']], ['🛞', 'circle', ['the wheel', 'bánh xe']], ['🕒', 'circle', ['the clock', 'đồng hồ']], ['🚪', 'rectangle', ['the door', 'cánh cửa']], ['🪟', 'square', ['the window', 'ô cửa sổ']]];
    return rounds(api, ['Find the shapes hiding around town!', 'Tìm các hình đang ẩn trong phố nhé!'],
      mix(finds).slice(0, api.little ? 3 : 4).map(([icon, shape, name]) => ({
        show: pic(icon), ask: ['What shape is ' + name[0] + '?', name[1][0].toUpperCase() + name[1].slice(1) + ' có hình gì?'], answer: shape,
        choices: [shape, ...mix((Object.keys(SHAPES) as Flat[]).filter(k => k !== shape)).slice(0, 2)].map(shapeChoice),
      })), ['You found every town shape!', 'Bé tìm thấy mọi hình trong phố!']);
  }
});

register({
  id: 'tiles', icon: '🟦', name: () => T('Tile the Floor', 'Lát Sàn'),
  async run(api) {
    style();
    api.say('Tap every empty square to finish the blue and gold floor!', 'Chạm vào từng ô trống để lát sàn xanh vàng nhé!');
    api.dots(9, 0);
    const wrap = el('div', 's2-board'), stage = el('div', 's2-stage'), grid = el('div', 's2-grid');
    api.stage.appendChild(wrap); wrap.appendChild(stage); stage.appendChild(grid);
    const tiles = Array.from({ length: 9 }, (_, i) => { const b = el('button', 's2-tile', ''); b.dataset.colour = i % 2 ? 'gold' : 'blue'; grid.appendChild(b); return b; });
    for (let done = 0; done < 9; done++) {
      api.plan(() => tiles.find(t => !t.disabled) || null, { maxActions: 11 });
      const clicked = await untilRight(api, tiles, e => !e.disabled);
      if (!clicked || api.closed) return;
      clicked.disabled = true; clicked.classList.add(clicked.dataset.colour);
      api.dots(9, done + 1); api.sfx.pop(done % 4);
    }
    await wait(700);
    return api.win({ title: T('Beautiful tiled floor!', 'Sàn hoa văn đẹp quá!') });
  }
});

register({
  id: 'turnit', icon: '🔄', name: () => T('Turn It Round', 'Xoay Hình'),
  async run(api) {
    style();
    api.say('Turn the arrow until it points at the star!', 'Xoay mũi tên đến khi chỉ vào ngôi sao nhé!');
    const rounds = 3;
    api.dots(rounds, 0);
    const wrap = el('div', 's2-board'), stage = el('div', 's2-stage'), controls = el('div', 's2-controls');
    api.stage.appendChild(wrap); wrap.append(stage, controls);
    const box = el('div', 's2-turn'); stage.appendChild(box);
    const arrow = el('div', 's2-arrow', svg(`<path d="M50 6L84 46H62V94H38V46H16Z" fill="#3b6fe0" ${INK}/>`, '0 0 100 100'));
    const star = el('div', 's2-star', pic('⭐'));
    box.append(arrow, star);
    const turn = el('button', 's2-btn', `${pic('🔄')}<span>${T('Turn', 'Xoay')}</span>`); controls.appendChild(turn);
    // 0 up, 1 right, 2 down, 3 left; the star sits on that side of the box
    const spots = [{ left: '81px', top: '0' }, { left: '162px', top: '81px' }, { left: '81px', top: '162px' }, { left: '0', top: '81px' }];
    let facing = Math.floor(Math.random() * 4);
    for (let r = 0; r < rounds; r++) {
      const goal = (facing + 1 + Math.floor(Math.random() * 3)) % 4;
      Object.assign(star.style, spots[goal]);
      arrow.style.transform = `rotate(${facing * 90}deg)`;
      api.plan(() => facing !== goal ? turn : null, { maxActions: 5 });
      while (facing !== goal) {
        const clicked = await untilRight(api, [turn], () => true);
        if (!clicked || api.closed) return;
        facing = (facing + 1) % 4;
        arrow.style.transform = `rotate(${facing * 90}deg)`;
        api.sfx.pop(facing);
      }
      api.sfx.ding(); api.dots(rounds, r + 1);
      await wait(700);
    }
    return api.win({ title: T('You turned it just right!', 'Bé xoay thật đúng hướng!') });
  }
});

register({
  id: 'shapetrain', icon: '🚂', name: () => T('Shape Train', 'Tàu Hình Khối'),
  run: api => rounds(api, ['Load the matching shape into each train wagon!', 'Xếp đúng hình vào từng toa tàu!'],
    mix(Object.keys(SHAPES) as Flat[]).slice(0, api.little ? 3 : 4).map(shape => ({
      show: `<div class="s2-train"><span class="s2-engine">${pic('🚂')}</span><span class="s2-wagon">${svg(SHAPES[shape]('#fff').replace(INK, 'stroke="#3b2a4f" stroke-width="4" stroke-dasharray="6 4"'))}</span></div>`,
      ask: ['Which shape fits in the wagon?', 'Hình nào vừa với toa tàu?'], answer: shape,
      choices: [shape, ...mix((Object.keys(SHAPES) as Flat[]).filter(k => k !== shape)).slice(0, 2)].map(shapeChoice),
    })), ['The shape train is ready!', 'Đoàn tàu hình khối đã đầy!'])
});

register({
  id: 'linescurves', icon: '〰️', name: () => T('Lines and Curves', 'Nét Thẳng Nét Cong'),
  run: api => {
    const marks: [string, 'straight' | 'curve'][] = [
      ['M10 55H140', 'straight'], ['M20 10V100M75 10V100M130 10V100', 'straight'], ['M15 95L135 15', 'straight'], ['M15 90L45 20L75 90L105 20L135 90', 'straight'],
      ['M10 55Q45 10 75 55T140 55', 'curve'], ['M40 90A40 40 0 1 1 110 90', 'curve'], ['M75 100C10 80 10 20 75 10', 'curve'], ['M20 30Q75 110 130 30', 'curve'],
    ];
    const chosen = mix([mix(marks.filter(m => m[1] === 'straight'))[0], mix(marks.filter(m => m[1] === 'curve'))[0], mix(marks)[0]]);
    const line = svg(`<path d="M8 32H56" stroke="#3b2a4f" stroke-width="6" stroke-linecap="round"/>`), curve = svg(`<path d="M6 40Q20 6 32 32T58 26" fill="none" stroke="#3b2a4f" stroke-width="6" stroke-linecap="round"/>`);
    return rounds(api, ['Is the mark a straight line or a curve?', 'Đây là nét thẳng hay nét cong?'],
      chosen.map(([d, kind]) => ({
        show: svg(`<path d="${d}" fill="none" stroke="#e2483d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`, '0 0 150 110'),
        ask: ['Straight or curved?', 'Thẳng hay cong?'], answer: kind,
        choices: [{ key: 'straight', html: line + `<span>${T('Straight', 'Nét thẳng')}</span>` }, { key: 'curve', html: curve + `<span>${T('Curve', 'Nét cong')}</span>` }],
      })), ['Lines and curves are easy now!', 'Bé phân biệt nét thẳng nét cong rồi!']);
  }
});

register({
  id: 'foldbox', icon: '📦', name: () => T('Fold the Box', 'Gấp Hộp'),
  async run(api) {
    style();
    api.say('Tap each side to fold it up and make a box!', 'Chạm từng cạnh để gấp lên thành chiếc hộp nhé!');
    api.dots(4, 0);
    const wrap = el('div', 's2-board'), stage = el('div', 's2-stage'), net = el('div', 's2-net');
    api.stage.appendChild(wrap); wrap.appendChild(stage); stage.appendChild(net);
    const place = { top: '1 / 2', left: '2 / 1', right: '2 / 3', bottom: '3 / 2' };
    net.appendChild(el('div', 's2-base'));
    const flaps = (Object.keys(place) as (keyof typeof place)[]).map(side => {
      const b = el('button', 's2-flap ' + side, ''); b.style.gridArea = place[side]; net.appendChild(b); return b;
    });
    for (let k = 0; k < 4; k++) {
      api.plan(() => flaps.find(f => !f.disabled) || null, { maxActions: 6 });
      const clicked = await untilRight(api, flaps, e => !e.disabled);
      if (!clicked || api.closed) return;
      clicked.disabled = true; clicked.classList.add('up');
      api.sfx.pop(k); api.dots(4, k + 1);
      await wait(350);
    }
    stage.appendChild(el('div', 's2-picture', pic('📦')));
    await wait(900);
    return api.win({ title: T('The box is folded!', 'Chiếc hộp đã gấp xong!') });
  }
});

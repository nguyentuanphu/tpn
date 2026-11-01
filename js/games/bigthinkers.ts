// Original guided reasoning activities; no timers or lost progress for wrong answers.
// (owner repair round, points 46-48, 16 Oct AEDT) Each one now changes with the level: under-5s get few, very
// different choices; Easy, Medium and Hard add choices, longer rules and look-alike distractors. A wrong tap says why
// in both languages, and the spoken guidance never names the answer.
import { register, choiceButtons, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, shuffle, wait } from '../util.js';
import { instructions } from './learning-meta.js';
// 0 under-5, 1 Easy, 2 Medium, 3 Hard (the level already includes the child's progress, as in the other new games)
// (r79 learning, I1) the frame's tier follows the child inside the game (api.tier); simple test frames fall back to the level
const tier = api => api.tier ? api.tier() : api.little ? 0 : api.level >= 3 ? 3 : api.level >= 2 ? 2 : 1;
const nextRound = api => api.nextRound ? api.nextRound() : tier(api);
// a "Hear again" button: the guidance is spoken, so a child who cannot read can always ask for it again
function repeat(api, line) {
  const button = el('button', 'btn bt-repeat', pic('🔁') + T('Hear again', 'Nghe lại'));
  button.style.minHeight = '64px'; button.onclick = () => api.say(...line()); api.stage.appendChild(button); return button;
}
// untilRight, but a wrong tap explains itself (spoken and shown) instead of only "Try again!"
async function untilRightWhy(api, els, check, why) {
  const wrong = api.wrong;
  api.wrong = e => { const [en, vi] = why(e); wrong(e, en, vi); api.show(en, vi); };
  try { return await untilRight(api, els, check); } finally { api.wrong = wrong; }
}
const pick = (list, n) => shuffle(list).slice(0, n);

// ---------- Find the Rule ----------
// Each rule: what is said after a right and a wrong tap (whole lines, so each has its own recording), the pictures
// that follow it, and look-alikes that are close but do not.
// also: pictures that follow the rule too, so they are never offered as a wrong choice; only: wrong choices come only
// from the hand-picked near list (colours and flying, where pictures from other groups could match by chance)
const CREATURES = ['🐟', '🐠', '🐙', '🐳', '🦀', '🦋', '🐝', '🐦', '🦉', '🐌', '🐢', '🐸', '🦁', '🐵', '🐘'];
const RULES = [
  { id: 'fruit', right: ['Yes! They are all fruit.', 'Đúng rồi! Tất cả đều là trái cây.'], miss: ['Not that one. Look again: they are all fruit.', 'Chưa đúng. Nhìn lại nhé: tất cả đều là trái cây.'], yes: ['🍎', '🍌', '🍉', '🍇', '🍓', '🍊', '🍐', '🥭'], near: ['🥕', '🌽'], also: ['🍅', '🍋', '🫐'] },
  { id: 'animals', right: ['Yes! They are all animals.', 'Đúng rồi! Tất cả đều là con vật.'], miss: ['Not that one. Look again: they are all animals.', 'Chưa đúng. Nhìn lại nhé: tất cả đều là con vật.'], yes: ['🐶', '🐱', '🐰', '🐮', '🐷', '🐔', '🦆', '🐴'], near: ['🧸'], also: CREATURES },
  { id: 'clothes', right: ['Yes! They are all things to wear.', 'Đúng rồi! Tất cả đều là đồ để mặc.'], miss: ['Not that one. Look again: they are all things to wear.', 'Chưa đúng. Nhìn lại nhé: tất cả đều là đồ để mặc.'], yes: ['👕', '👟', '👒', '🧦', '🧢'], near: ['🧺'] },
  { id: 'vehicles', right: ['Yes! They all take us places.', 'Đúng rồi! Tất cả đều chở mình đi.'], miss: ['Not that one. Look again: they all take us places.', 'Chưa đúng. Nhìn lại nhé: tất cả đều chở mình đi.'], yes: ['🚗', '🚌', '🚲', '⛵', '🚂', '✈️'], near: ['🏠'] },
  { id: 'flowers', right: ['Yes! They are all flowers.', 'Đúng rồi! Tất cả đều là hoa.'], miss: ['Not that one. Look again: they are all flowers.', 'Chưa đúng. Nhìn lại nhé: tất cả đều là hoa.'], yes: ['🌸', '🌻', '🌷', '🪷', '🌺'], near: ['🌳', '🌱'], from: 2 },  // (r79) five flowers, so Medium and Hard can show three examples and an answer
  { id: 'water', right: ['Yes! They all live in the water.', 'Đúng rồi! Tất cả đều sống dưới nước.'], miss: ['Not that one. Look again: they all live in the water.', 'Chưa đúng. Nhìn lại nhé: tất cả đều sống dưới nước.'], yes: ['🐟', '🐠', '🐙', '🐳', '🦀'], near: ['🐶', '🐱', '🐔'], also: ['🦆', '🐢', '🐸', '⛵'], from: 2 },
  { id: 'fly', right: ['Yes! They can all fly.', 'Đúng rồi! Tất cả đều biết bay.'], miss: ['Not that one. Look again: they can all fly.', 'Chưa đúng. Nhìn lại nhé: tất cả đều biết bay.'], yes: ['🦋', '🐝', '🐦', '🦉', '✈️', '🎈'], near: ['🐌', '🐢', '🐟', '🐶'], only: true, from: 3 },
  { id: 'red', right: ['Yes! They are all red.', 'Đúng rồi! Tất cả đều màu đỏ.'], miss: ['Not that one. Look again: they are all red.', 'Chưa đúng. Nhìn lại nhé: tất cả đều màu đỏ.'], yes: ['🍎', '🍓', '🍅', '🟥', '🔴'], near: ['🍌', '🍋', '🟦', '🟨', '🫐'], only: true, from: 3 },
  { id: 'yellow', right: ['Yes! They are all yellow.', 'Đúng rồi! Tất cả đều màu vàng.'], miss: ['Not that one. Look again: they are all yellow.', 'Chưa đúng. Nhìn lại nhé: tất cả đều màu vàng.'], yes: ['🍌', '🍋', '🌻', '🟨', '🟡'], near: ['🍎', '🍓', '🟥', '🔵', '🫐'], only: true, from: 3 }
];
register({ id: 'rulefinder', icon: '🧩', learn: true, name: () => T('Find the Rule', 'Tìm Quy Luật'), async run(api) {
  const start = tier(api), rounds = start === 0 ? 3 : api.talent ? 5 : 4;   // (levels) Talent: five rules, more pictures and more look-alikes
  // Hard keeps one colour or "can fly" rule in every game, so it really is harder than Medium
  // (r79 learning, I2) the rule this child missed most comes first
  const hardOne = start === 3 ? pick(RULES.filter(r => r.from === 3), 1)[0] : null;
  const order = api.favour ? api.favour(shuffle(RULES), r => r.id) : shuffle(RULES), used = new Set<(typeof RULES)[number]>();
  for (let round = 0; round < rounds; round++) {
    if (api.closed) return; api.dots(rounds, round); api.stage.innerHTML = '';
    // (r79 learning, I1) examples shown, choices offered and the rules that may appear follow the level now
    const level = round ? nextRound(api) : tier(api), examples = [2, 2, 3, 3][level] + (api.talent ? 1 : 0), choices = [2, 3, 3, 4][level] + (api.talent ? 1 : 0);
    const fitsLevel = r => (r.from || 0) <= Math.max(1, level) && !used.has(r);
    const rule = (round === rounds - 1 && hardOne && !used.has(hardOne) && ![...used].some(r => r.from === 3) ? hardOne : order.find(fitsLevel)) || order.find(r => !used.has(r)) || order[0];
    used.add(rule);
    const shown = pick(rule.yes, examples + 1), right = shown.pop();
    // wrong choices: under-5 and Easy get pictures from other groups; Medium mixes in one near picture; Hard mostly near
    const fits = v => rule.yes.includes(v) || (rule.also || []).includes(v);
    const others = rule.only ? [] : RULES.flatMap(r => r.yes).filter(v => !fits(v));
    const nNear = rule.only ? choices - 1 : level >= 3 ? choices - 2 : level === 2 ? 1 : 0;
    const wrongs = pick(rule.near, nNear); for (const v of shuffle(others)) { if (wrongs.length >= choices - 1) break; if (!wrongs.includes(v)) wrongs.push(v); }
    api.stage.appendChild(el('div', 'seq', shown.map(value => `<span class="seq-item">${pic(value)}</span>`).join('') + '<span class="seq-item q">?</span>'));
    const line = () => ['These belong together. Find another picture that follows the same rule.', 'Các hình này cùng một nhóm. Tìm thêm hình theo cùng quy luật.'];
    api.say(...line());
    const buttons = choiceButtons(api, shuffle([right, ...wrongs]), value => pic(value));
    repeat(api, line);
    // a wrong tap names the rule, so the child learns it rather than guessing again
    let missedIt = false;
    if (!await untilRightWhy(api, buttons, b => b._v === right, () => { if (!missedIt && api.missed) api.missed(rule.id); missedIt = true; return rule.miss; })) return;
    if (!missedIt && api.got) api.got(rule.id);
    api.say(...rule.right); api.praise(); await wait(500);
  }
  return api.win();
} });

// ---------- Garden Steps ----------
// Little stories in four steps, with pictures that cannot be mixed up (no two chicks, bowls or clouds).
// The guidance asks "what happens first / next" and never names the answer; the step's
// words are said after the child chooses it.
const STORIES = [
  [['🌱', 'Plant the seed.', 'Gieo hạt.'], ['💧', 'Water it.', 'Tưới nước.'], ['🌳', 'The tree grows.', 'Cây lớn lên.'], ['🍎', 'Pick the fruit.', 'Hái quả.']],
  [['❄️', 'Snow falls.', 'Tuyết rơi.'], ['⛄', 'Build a snowman.', 'Đắp người tuyết.'], ['☀️', 'The sun comes out.', 'Mặt trời ló ra.'], ['💧', 'The snowman melts.', 'Người tuyết tan chảy.']],
  [['☁️', 'Clouds come.', 'Mây kéo đến.'], ['💧', 'It rains.', 'Trời mưa.'], ['☀️', 'The sun comes out.', 'Mặt trời ló ra.'], ['🌈', 'A rainbow!', 'Cầu vồng!']],
  [['🌾', 'The rice grows.', 'Lúa lớn lên.'], ['🧺', 'Harvest the rice.', 'Gặt lúa.'], ['🍚', 'Cook the rice.', 'Nấu cơm.'], ['🥢', 'Eat together.', 'Cùng nhau ăn cơm.']],
  [['🌱', 'A little shoot.', 'Một mầm nhỏ.'], ['💧', 'Water it.', 'Tưới nước.'], ['🌷', 'A flower opens.', 'Hoa nở.'], ['🐝', 'A bee visits.', 'Ong đến thăm.']]
];
register({ id: 'gardenorder', icon: '🌱', learn: true, name: () => T('Garden Steps', 'Các Bước Làm Vườn'), async run(api) {
  const start = tier(api), rounds = start === 0 ? 1 : api.talent ? 4 : start === 3 ? 3 : 2;   // (levels) Talent: four stories with three stray pictures
  // (r79 learning, I2) the story this child missed most comes first (stories are known by their first step's words)
  const stories = api.favour ? api.favour(pick(STORIES, STORIES.length), s => s[0][1]).slice(0, rounds) : pick(STORIES, rounds);
  for (let round = 0; round < rounds; round++) {
    if (api.closed) return; api.stage.innerHTML = '';
    // under-5s order three steps; bigger children four. Pictures that do not belong join the choices from Medium.
    // (r79 learning, I1) the number of stray pictures follows the level now
    const level = round ? nextRound(api) : tier(api), steps = level === 0 ? 3 : 4, extra = [1, 1, 2, 2][level] + (api.talent ? 1 : 0);
    let missedIt = false;
    const story = stories[round].slice(0, steps), mine = story.map(s => s[0]);
    // the extra pictures come from other stories and never look like a step of this one
    const strays = pick(STORIES.filter(s => s !== stories[round]).flat().map(s => s[0]).filter(v => !mine.includes(v)), extra).map(v => [v, '', '']);
    const done = el('div', 'seq', story.map(() => '<span class="seq-item q">?</span>').join('')); api.stage.appendChild(done);
    const controls = el('div'); api.stage.appendChild(controls);
    const line = i => i === 0 ? ['What happens first?', 'Việc gì xảy ra trước tiên?'] : ['What happens next?', 'Tiếp theo là gì?'];
    let at = 0; const again = repeat(api, () => line(at));
    for (let i = 0; i < story.length; i++) {
      if (api.closed) return; at = i; api.dots(story.length, i); controls.innerHTML = '';
      // the steps not chosen yet, plus the strays: there are always at least two choices, also for the last step
      const choices = shuffle([...story.slice(i), ...strays]);
      api.say(...line(i));
      const old = api.stage; api.stage = controls; const buttons = choiceButtons(api, choices, value => pic(value[0])); api.stage = old;
      const why = b => { if (!missedIt && api.missed) api.missed(story[0][1]); missedIt = true; return !mine.includes(b._v[0]) ? ['That picture is not part of this story.', 'Hình đó không thuộc câu chuyện này.']
        : ['That comes later. What has to happen before it?', 'Việc đó xảy ra sau. Trước đó phải có gì?']; };
      if (!await untilRightWhy(api, buttons, b => b._v[0] === story[i][0], why)) return;
      done.children[i].classList.remove('q'); done.children[i].innerHTML = pic(story[i][0]);
      api.say(story[i][1], story[i][2]); await wait(700);
    }
    again.remove(); if (!missedIt && api.got) api.got(story[0][1]); api.praise(); await wait(500);
  }
  return api.win();
} });

// ---------- Flower Path ----------
// A new path every game. The path never touches itself (so there is only one way along it); from Medium, short flower
// branches lead off it and stop at puddles, so the child must look ahead to the flag.
function makePath(size) {
  const n = size * size, goal = n - 1, nb = i => [i - size, i + size, i % size ? i - 1 : -1, (i + 1) % size ? i + 1 : -1].filter(j => j >= 0 && j < n);
  const route = [0], used = new Set(route);
  // a random walk that backs up when stuck; going round the edge always works, so it always finds the flag
  const grow = () => {
    const at = route.at(-1); if (at === goal) return true;
    // a step may only touch the cell it came from, so the path has no short cuts
    for (const j of shuffle(nb(at))) {
      if (used.has(j) || nb(j).some(k => used.has(k) && k !== at)) continue;
      route.push(j); used.add(j); if (grow()) return true; route.pop(); used.delete(j);
    }
    return false;
  };
  grow(); return { route, nb };
}
// dead-end branches: flower cells next to exactly one path cell (and no other flower), so they never make a short cut
function branches(size, route, nb, want) {
  const flowers = new Set(route), out = [];
  for (const i of shuffle(route.slice(1, -2))) {
    if (out.length >= want) break;
    const j = shuffle(nb(i)).find(c => !flowers.has(c) && nb(c).filter(k => flowers.has(k)).length === 1);
    if (j !== undefined) { flowers.add(j); out.push(j); }
  }
  return out;
}
register({ id: 'steppingpath', icon: '🗺️', learn: true, name: () => T('Flower Path', 'Đường Hoa'), async run(api) {
  const level = tier(api), size = api.talent ? 5 : [3, 4, 4, 5][level], want = api.talent ? 5 : [0, 0, 2, 3][level];   // (levels) Talent: the 5 x 5 field with more dead ends
  // some winding paths leave no room for a dead end: draw another until Medium and Hard have at least one
  let route, nb, decoys;
  for (let k = 0; k < 60; k++) { ({ route, nb } = makePath(size)); decoys = branches(size, route, nb, want); if (decoys.length >= Math.min(want, 2)) break; }
  const grid = el('div', 'think-path'); grid.style.cssText = `display:grid;grid-template-columns:repeat(${size},minmax(64px,1fr));gap:8px;max-width:${size > 4 ? 400 : 460}px;margin:auto`;
  api.stage.appendChild(grid); const cells = [];
  const flower = i => route.includes(i) || decoys.includes(i);
  // (owner, 16 Oct) a fixed picture size: the shared choice size drew 80 px pictures in 74 px squares on tablets and computers
  for (let i = 0; i < size * size; i++) { const b = el('button', 'choice', pic(i === route.at(-1) ? '🏁' : flower(i) ? '🌸' : '💧')); b.style.cssText = 'width:100%;height:auto;aspect-ratio:1;min-width:0;min-height:64px;font-size:46px;overflow:hidden'; b.dataset.cell = i; b.setAttribute('aria-label', i === route.at(-1) ? T('Flag', 'Lá cờ') : flower(i) ? T('Flower stepping stone', 'Bước qua hoa') : T('Puddle', 'Vũng nước')); grid.appendChild(b); cells.push(b); }
  cells[0].classList.add('right'); api.say(...instructions.steppingpath[0]);
  repeat(api, () => decoys.length ? ['Some flowers stop at a puddle. Find the flowers that go all the way to the flag.', 'Có hoa dẫn đến vũng nước. Tìm đường hoa đi đến tận lá cờ.'] : instructions.steppingpath[0]);
  if (decoys.length) api.show('Some flowers stop at a puddle. Find the flowers that go all the way to the flag.', 'Có hoa dẫn đến vũng nước. Tìm đường hoa đi đến tận lá cờ.');
  for (let step = 1; step < route.length; step++) {
    if (api.closed) return; api.dots(route.length - 1, step - 1); const current = route[step - 1];
    // every cell next to the child is a choice (also the one they came from), so there are always two or more
    const neighbours = cells.filter((b, i) => nb(current).includes(i));
    cells.forEach(b => { b.disabled = !neighbours.includes(b); });
    const why = b => b.classList.contains('right') ? ['You have been there already. Go on towards the flag.', 'Con đi qua đó rồi. Đi tiếp về phía lá cờ nhé.'] : decoys.includes(+b.dataset.cell) ? ['Those flowers stop at a puddle. Find the way to the flag.', 'Đường hoa đó dừng ở vũng nước. Tìm đường đến lá cờ nhé.'] : ['That is a puddle. Step on a flower.', 'Đó là vũng nước. Bước lên hoa nhé.'];
    if (!await untilRightWhy(api, neighbours, b => +b.dataset.cell === route[step], why)) return;
    cells[route[step]].classList.add('right'); api.praise();
  }
  return api.win();
} });

import { register, tapOne } from './frame.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';

const prompt = (api, en: string, vi: string) => { api.show(en, vi); api.say(en, vi); };
const buttons = (api, values: string[]) => {
  const row = el('div', 'choices');
  const controls = values.map(value => { const b = el('button', 'pill big', value); b.type = 'button'; row.appendChild(b); return b; });
  api.stage.appendChild(row);
  return controls;
};

async function runCatMouse(api) {
  prompt(api, 'Tap the mouse when the cat appears!', 'Chạm vào chú chuột khi mèo xuất hiện nhé!');
  const board = el('div', 'folk-card', '<div class="folk-big">🐭</div>'); api.stage.appendChild(board);
  await wait(Math.max(350, 1100 - api.level * 130));
  board.querySelector('.folk-big').textContent = '🐱';
  const hit = await tapOne([board]); if (!hit || api.closed) return;
  api.right(hit); return api.win({ title: T('You escaped the cat!', 'Bạn chuột chạy thoát rồi!') });
}

async function runFlag(api) {
  prompt(api, 'Choose the flag called out!', 'Chọn đúng lá cờ được gọi tên nhé!');
  const values = ['🔴', '🔵', '🟡']; const target = values[(api.level + 1) % values.length];
  api.show(T(`Take the ${target} flag!`, `Lấy lá cờ ${target} nhé!`), T(`Lấy lá cờ ${target} nhé!`, `Lấy lá cờ ${target} nhé!`));
  const controls = buttons(api, values); const chosen = await tapOne(controls); if (!chosen || api.closed) return;
  if (chosen.textContent === target) { api.right(chosen); return api.win({ title: T('Flag captured!', 'Cướp được cờ rồi!') }); }
  api.wrong(chosen); await wait(450); return runFlag(api);
}

async function runPullSaw(api) {
  prompt(api, 'Copy the rhythm: pull, saw, pull!', 'Bắt chước nhịp kéo, cưa, kéo nhé!');
  const sequence = ['🪚', '🪵', '🪚']; const controls = buttons(api, ['🪚', '🪵']);
  for (const expected of sequence) {
    const chosen = await tapOne(controls); if (!chosen || api.closed) return;
    if (chosen.textContent !== expected) { api.wrong(chosen); await wait(450); return runPullSaw(api); }
    api.sfx.tap();
  }
  api.right(controls[0]); return api.win({ title: T('Great rhythm!', 'Nhịp kéo cưa thật giỏi!') });
}

async function runAim(api, id: string, title: [string, string], target: string) {
  prompt(api, title[0], title[1]);
  const controls = buttons(api, ['⬅️', '🎯', '➡️']);
  const chosen = await tapOne(controls); if (!chosen || api.closed) return;
  if (chosen.textContent === target) { api.right(chosen); return api.win({ title: T('Perfect aim!', 'Ném trúng rồi!') }); }
  api.wrong(chosen); await wait(450); return runAim(api, id, title, target);
}

async function runPlant(api) {
  prompt(api, 'Remember the planting order!', 'Nhớ thứ tự trồng cây nhé!');
  const sequence = ['🌱', '💧', '☀️']; const display = el('div', 'folk-big', sequence.join(' ')); api.stage.appendChild(display); await wait(1000);
  display.textContent = ''; const controls = buttons(api, ['🌱', '💧', '☀️']);
  for (const expected of sequence) { const chosen = await tapOne(controls); if (!chosen || api.closed) return; if (chosen.textContent !== expected) { api.wrong(chosen); await wait(450); return runPlant(api); } }
  api.right(controls[0]); return api.win({ title: T('The plant is growing!', 'Cây đang lớn lên rồi!') });
}

async function runBoat(api) {
  prompt(api, 'Row with the rhythm to reach the finish!', 'Chèo theo nhịp để về đích nhé!');
  const controls = buttons(api, ['🚣', '⏸️']); let strokes = 0;
  while (strokes < 4) { const chosen = await tapOne(controls); if (!chosen || api.closed) return; if (chosen.textContent === '🚣') { strokes++; api.sfx.tap(); } else { api.wrong(chosen); } }
  api.right(controls[0]); return api.win({ title: T('Boat race complete!', 'Đua thuyền về đích rồi!') });
}

// Explicit registrations keep lazy-loader metadata checkable in both languages.
register({ id: 'meochuot', icon: '🐱', origin: 'vn', name: () => T('Cat and Mouse', 'Mèo Đuổi Chuột'), run: runCatMouse });
register({ id: 'cuopco', icon: '🚩', origin: 'vn', name: () => T('Flag Relay', 'Cướp Cờ'), run: runFlag });
register({ id: 'keocua', icon: '🪚', origin: 'vn', name: () => T('Pull Saw Song', 'Kéo Cưa Lừa Xẻ'), run: runPullSaw });
register({ id: 'danhdao', icon: '🪵', origin: 'vn', name: () => T('Đánh Đáo', 'Đánh Đáo'), run: api => runAim(api, 'danhdao', ['Tap the centre to strike the wooden peg!', 'Chạm vào giữa để đánh trúng cọc nhé!'], '🎯') });
register({ id: 'nemcon', icon: '🎯', origin: 'vn', name: () => T('Throw the Còn', 'Ném Còn'), run: api => runAim(api, 'nemcon', ['Aim the còn at the target!', 'Ngắm ném còn vào vòng nhé!'], '🎯') });
register({ id: 'trongnu', icon: '🌱', origin: 'vn', name: () => T('Plant the Seed', 'Trồng Nụ'), run: runPlant });
register({ id: 'duathuyen', icon: '🚣', origin: 'vn', name: () => T('Boat Race', 'Đua Thuyền'), run: runBoat });

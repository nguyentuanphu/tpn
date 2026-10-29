// Four small, gentle reasoning games for children five and up.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';
import { pic } from '../art.js';

type ChessPuzzle = { piece: string; pieceEn: string; pieceVi: string; from: number; target: number; blocked: number[]; screen?: boolean };
type SeatPuzzle = { person: string; personEn: string; personVi: string; seat: number; clueEn: string; clueVi: string };
type PipeCell = { kind: string; turns: number; want: number };

let styled = false;
function style() {
  if (styled) return;
  styled = true;
  document.head.appendChild(el('style', '', `
.tk2-wrap { display: grid; justify-items: center; gap: 14px; max-width: 720px; margin: 0 auto; padding: 10px; color: #382b45; }
.tk2-title { margin: 0; font: 900 clamp(21px, 4vw, 30px)/1.2 var(--font, sans-serif); text-align: center; }
.tk2-prompt { min-height: 44px; margin: 0; padding: 9px 14px; border-radius: 16px; background: #fffdf7; box-shadow: 0 3px 0 rgba(56,43,69,.14); font: 800 clamp(17px, 3vw, 21px)/1.28 var(--font, sans-serif); text-align: center; }
.tk2-round { font: 800 15px/1 var(--font, sans-serif); color: #725d80; }
.tk2-board { display: grid; grid-template-columns: repeat(4, minmax(64px, 84px)); gap: 4px; padding: 8px; border-radius: 18px; background: #6f4b35; box-shadow: 0 5px 0 rgba(65,39,27,.22); }
.tk2-square { position: relative; min-width: 64px; min-height: 64px; border: 0; border-radius: 8px; background: #f4d7a0; color: #37233a; cursor: pointer; font: 900 clamp(22px, 5vw, 38px)/1 var(--font, sans-serif); }
.tk2-square:nth-child(odd), .tk2-square:nth-child(6), .tk2-square:nth-child(8), .tk2-square:nth-child(9), .tk2-square:nth-child(11), .tk2-square:nth-child(14), .tk2-square:nth-child(16) { background: #bf855e; }
.tk2-square.friend { color: #24659b; } .tk2-square.enemy { color: #b84444; }
.tk2-square.selected { outline: 5px solid #ffd53f; outline-offset: -4px; }
.tk2-square.target { box-shadow: inset 0 0 0 5px #83c66e; }
.tk2-square.hint, .tk2-card.hint, .tk2-pipe.hint { outline: 5px solid #ffd53f; outline-offset: 2px; }
.tk2-status { min-height: 32px; font: 800 17px/1.2 var(--font, sans-serif); text-align: center; }
.tk2-choices { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.tk2-card { min-width: 132px; min-height: 64px; padding: 8px 12px; border: 3px solid #795b42; border-radius: 16px; background: #fffdf7; box-shadow: 0 4px 0 #d7b27f; color: #382b45; cursor: pointer; font: 800 17px/1.15 var(--font, sans-serif); }
.tk2-card:disabled { opacity: .45; box-shadow: none; cursor: default; }
.tk2-seats { display: grid; grid-template-columns: repeat(3, minmax(84px, 130px)); gap: 10px; width: min(96vw, 430px); }
.tk2-seat { min-width: 84px; min-height: 96px; padding: 7px; border: 3px solid #795b42; border-radius: 18px; background: #fff5d3; color: #382b45; cursor: pointer; font: 900 16px/1.1 var(--font, sans-serif); }
.tk2-seat small { display: block; margin-top: 5px; color: #725d80; font: 800 13px/1.1 var(--font, sans-serif); }
.tk2-seat.placed { background: #ccecbf; }
.tk2-pipes { display: grid; grid-template-columns: repeat(3, 78px); gap: 6px; padding: 10px; border-radius: 20px; background: #d8eff8; box-shadow: 0 5px 0 rgba(35,106,135,.18); }
.tk2-pipe { position: relative; width: 78px; height: 78px; min-width: 64px; min-height: 64px; border: 2px solid #5897b4; border-radius: 14px; background: #f7fcff; cursor: pointer; }
.tk2-pipe i { position: absolute; inset: 11px; display: block; transform-origin: 50% 50%; }
.tk2-pipe.elbow i { border-top: 14px solid #4b9ec4; border-right: 14px solid #4b9ec4; border-radius: 0 24px 0 0; }
.tk2-pipe.straight i { left: 28px; right: 28px; top: 5px; bottom: 5px; border-left: 14px solid #4b9ec4; }
.tk2-pipe.end i { left: 28px; right: 28px; top: 28px; bottom: 0; border-left: 14px solid #4b9ec4; }
.tk2-pipe.source::after, .tk2-pipe.goal::after { position: absolute; top: 5px; right: 6px; font: 900 12px/1 var(--font, sans-serif); color: #266b8a; }
.tk2-pipe .tk2-mark { position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; } /* (audit: drawings, not the English IN and OUT) */
.tk2-pipe.flow { background: #c8f1ff; box-shadow: inset 0 0 0 5px #78cbe8; }
.gl.little .tk2-square, .gl.little .tk2-card, .gl.little .tk2-seat, .gl.little .tk2-pipe { min-width: 64px; min-height: 64px; }
`));
}

function roundLabel(round: number, total: number) {
  return T(`Puzzle ${round} of ${total}`, `Câu đố ${round} / ${total}`);
}

function makeBoard() {
  const board = el('div', 'tk2-board');
  const cells: HTMLButtonElement[] = [];
  for (let i = 0; i < 16; i++) {
    const cell: HTMLButtonElement = el('button', 'tk2-square');
    cell.type = 'button';
    board.appendChild(cell);
    cells.push(cell);
  }
  return { board, cells };
}

async function runMiniChess(api) {
  style();
  const puzzles: ChessPuzzle[] = [
    { piece: 'R', pieceEn: 'Rook', pieceVi: 'Xe', from: 0, target: 3, blocked: [5, 10] },
    { piece: 'B', pieceEn: 'Bishop', pieceVi: 'Tượng', from: 12, target: 3, blocked: [1, 7] }, // (audit: 6 sat on its diagonal)
    { piece: 'N', pieceEn: 'Knight', pieceVi: 'Mã', from: 1, target: 8, blocked: [4, 15] }
  ];
  const wrap = el('div', 'tk2-wrap');
  const title = el('h2', 'tk2-title', T('Little Chess', 'Cờ Vua Nhỏ'));
  const round = el('div', 'tk2-round');
  const prompt = el('p', 'tk2-prompt');
  const status = el('div', 'tk2-status');
  const { board, cells } = makeBoard();
  wrap.append(title, round, prompt, board, status);
  api.stage.appendChild(wrap);
  api.say('Choose the blue piece, then capture the red piece.', 'Chọn quân xanh, rồi bắt quân đỏ nhé.');

  let target: HTMLButtonElement | null = null;
  api.plan(() => target && target.isConnected ? target : null, { maxActions: puzzles.length * 2 + 4 });

  for (let index = 0; index < puzzles.length; index++) {
    const puzzle = puzzles[index];
    round.textContent = roundLabel(index + 1, puzzles.length);
    prompt.textContent = T(`Find the ${puzzle.pieceEn}. It can take the red token.`, `Tìm quân ${puzzle.pieceVi}. Quân này bắt được quân đỏ.`);
    status.textContent = '';
    cells.forEach(cell => { cell.className = 'tk2-square'; cell.textContent = ''; cell.disabled = false; cell.setAttribute('aria-label', T('Empty square', 'Ô trống')); });
    cells[puzzle.from].classList.add('friend');
    cells[puzzle.from].textContent = puzzle.piece;
    cells[puzzle.from].setAttribute('aria-label', T(`${puzzle.pieceEn}, blue`, `Quân ${puzzle.pieceVi} màu xanh`));
    cells[puzzle.target].classList.add('enemy', 'target');
    cells[puzzle.target].textContent = '●';
    cells[puzzle.target].setAttribute('aria-label', T('Red token', 'Quân đỏ'));
    for (const blocked of puzzle.blocked) {
      cells[blocked].textContent = '×';
      cells[blocked].disabled = true;
      cells[blocked].setAttribute('aria-label', T('Blocked square', 'Ô bị chặn'));
    }

    target = cells[puzzle.from];
    const selected = await untilRight(api, cells.filter(cell => !cell.disabled), cell => cell === cells[puzzle.from]);
    if (!selected || api.closed) return;
    selected.classList.add('selected');
    status.textContent = T('Now capture the red token!', 'Bây giờ bắt quân đỏ nhé!');
    target = cells[puzzle.target];
    const captured = await untilRight(api, cells.filter(cell => !cell.disabled), cell => cell === cells[puzzle.target]);
    if (!captured || api.closed) return;
    selected.textContent = '';
    captured.className = 'tk2-square friend selected';
    captured.textContent = puzzle.piece;
    api.sfx.chime();
    api.praise();
    await wait(650);
  }
  api.dots(puzzles.length, puzzles.length);
  return api.win({ title: T('You planned every chess move!', 'Con đã tính được mọi nước cờ!') });
}

async function runCoTuong(api) {
  style();
  const puzzles: ChessPuzzle[] = [
    { piece: '車', pieceEn: 'Chariot', pieceVi: 'Xe', from: 4, target: 7, blocked: [0, 12] },
    { piece: '馬', pieceEn: 'Horse', pieceVi: 'Mã', from: 14, target: 5, blocked: [2, 11] },
    { piece: '炮', pieceEn: 'Cannon', pieceVi: 'Pháo', from: 13, target: 1, blocked: [9, 6], screen: true } // (audit: a cannon takes only by jumping one piece)
  ];
  const wrap = el('div', 'tk2-wrap');
  const title = el('h2', 'tk2-title', T('Chinese Chess Puzzles', 'Cờ Tướng Nhỏ'));
  const round = el('div', 'tk2-round');
  const prompt = el('p', 'tk2-prompt');
  const status = el('div', 'tk2-status');
  const { board, cells } = makeBoard();
  wrap.append(title, round, prompt, board, status);
  api.stage.appendChild(wrap);
  api.say('Find the Chinese chess piece, then take the red general.', 'Tìm quân cờ tướng, rồi bắt tướng đỏ nhé.');

  let target: HTMLButtonElement | null = null;
  api.plan(() => target && target.isConnected ? target : null, { maxActions: puzzles.length * 2 + 4 });

  for (let index = 0; index < puzzles.length; index++) {
    const puzzle = puzzles[index];
    round.textContent = roundLabel(index + 1, puzzles.length);
    prompt.textContent = puzzle.screen ? T(`Choose the ${puzzle.pieceEn}. A cannon jumps over exactly one piece to take.`, `Chọn quân ${puzzle.pieceVi}. Pháo phải nhảy qua đúng một quân mới ăn được.`) : T(`Choose the ${puzzle.pieceEn}.`, `Chọn quân ${puzzle.pieceVi}.`);
    status.textContent = '';
    cells.forEach(cell => { cell.className = 'tk2-square'; cell.textContent = ''; cell.disabled = false; cell.setAttribute('aria-label', T('Empty square', 'Ô trống')); });
    cells[puzzle.from].classList.add('friend');
    cells[puzzle.from].textContent = puzzle.piece;
    cells[puzzle.from].setAttribute('aria-label', T(`${puzzle.pieceEn}, blue`, `Quân ${puzzle.pieceVi} màu xanh`));
    cells[puzzle.target].classList.add('enemy', 'target');
    cells[puzzle.target].textContent = '將';
    cells[puzzle.target].setAttribute('aria-label', T('Red general', 'Tướng đỏ'));
    for (const blocked of puzzle.blocked) {
      cells[blocked].textContent = '卒';
      cells[blocked].disabled = true;
      cells[blocked].setAttribute('aria-label', T('Other piece', 'Quân khác'));
    }

    target = cells[puzzle.from];
    const selected = await untilRight(api, cells.filter(cell => !cell.disabled), cell => cell === cells[puzzle.from]);
    if (!selected || api.closed) return;
    selected.classList.add('selected');
    prompt.textContent = T('Now take the red general!', 'Bây giờ bắt tướng đỏ nhé!');
    target = cells[puzzle.target];
    const captured = await untilRight(api, cells.filter(cell => !cell.disabled), cell => cell === cells[puzzle.target]);
    if (!captured || api.closed) return;
    selected.textContent = '';
    captured.className = 'tk2-square friend selected';
    captured.textContent = puzzle.piece;
    api.sfx.chime();
    api.praise();
    await wait(650);
  }
  api.dots(puzzles.length, puzzles.length);
  return api.win({ title: T('Wonderful Chinese chess thinking!', 'Con suy nghĩ cờ tướng thật giỏi!') });
}

async function runWhoSits(api) {
  style();
  const puzzles: SeatPuzzle[] = [
    { person: 'T', personEn: 'Teddy', personVi: 'Gấu bông', seat: 0, clueEn: 'Teddy sits by the window.', clueVi: 'Gấu bông ngồi cạnh cửa sổ.' },
    { person: 'R', personEn: 'Rabbit', personVi: 'Thỏ', seat: 1, clueEn: 'Rabbit sits at the little table.', clueVi: 'Thỏ ngồi ở bàn nhỏ.' },
    { person: 'C', personEn: 'Cat', personVi: 'Mèo', seat: 2, clueEn: 'Cat sits by the plant.', clueVi: 'Mèo ngồi cạnh chậu cây.' }
  ];
  const wrap = el('div', 'tk2-wrap');
  const title = el('h2', 'tk2-title', T('Who Sits Where?', 'Ai Ngồi Đâu?'));
  const round = el('div', 'tk2-round');
  const prompt = el('p', 'tk2-prompt');
  const status = el('div', 'tk2-status');
  const cards = el('div', 'tk2-choices');
  const seats = el('div', 'tk2-seats');
  wrap.append(title, round, prompt, cards, seats, status);
  api.stage.appendChild(wrap);
  api.say('Read the picture clue. Pick a friend, then choose their chair.', 'Nhìn gợi ý bằng hình. Chọn bạn, rồi chọn ghế của bạn ấy nhé.');

  // (owner, 29 Oct 2026 AEDT audit) pictures, not the letters T, R and C; and the chairs stand in a new order each game
  // (the answer was always chair 1, 2, 3 in turn)
  const people = [
    { key: 'T', icon: '🧸', en: 'Teddy', vi: 'Gấu bông' },
    { key: 'R', icon: '🐰', en: 'Rabbit', vi: 'Thỏ' },
    { key: 'C', icon: '🐱', en: 'Cat', vi: 'Mèo' }
  ];
  const cardButtons = people.map(person => {
    const button: HTMLButtonElement = el('button', 'tk2-card', `${pic(person.icon)} ${T(person.en, person.vi)}`);
    button.type = 'button';
    button.dataset.person = person.key;
    cards.appendChild(button);
    return button;
  });
  const seatHints = [
    { icon: '🪟', en: 'Window', vi: 'Cửa sổ' },
    { icon: '🪑', en: 'Table', vi: 'Bàn nhỏ' },
    { icon: '🪴', en: 'Plant', vi: 'Chậu cây' }
  ];
  const seatButtons = seatHints.map((hint, index) => {
    const button: HTMLButtonElement = el('button', 'tk2-seat', `<b>${pic(hint.icon)}</b><small>${T(hint.en, hint.vi)}</small>`);
    button.type = 'button';
    button.dataset.seat = String(index);
    return button;
  });
  [...seatButtons].sort(() => Math.random() - .5).forEach(button => seats.appendChild(button));

  let target: HTMLButtonElement | null = null;
  api.plan(() => target && target.isConnected ? target : null, { maxActions: puzzles.length * 2 + 4 });

  for (let index = 0; index < puzzles.length; index++) {
    const puzzle = puzzles[index];
    round.textContent = roundLabel(index + 1, puzzles.length);
    prompt.textContent = T(puzzle.clueEn, puzzle.clueVi);
    status.textContent = '';
    target = cardButtons.find(button => button.dataset.person === puzzle.person) || null;
    const picked = await untilRight(api, cardButtons.filter(button => !button.disabled), button => button.dataset.person === puzzle.person);
    if (!picked || api.closed) return;
    picked.classList.add('selected');
    status.textContent = T('Now choose the right chair.', 'Bây giờ chọn đúng chiếc ghế nhé.');
    target = seatButtons[puzzle.seat];
    const seated = await untilRight(api, seatButtons.filter(button => !button.disabled), button => button === seatButtons[puzzle.seat]);
    if (!seated || api.closed) return;
    seated.classList.add('placed');
    seated.innerHTML = `<b>${pic(people.find(p => p.key === puzzle.person)!.icon)}</b><small>${T(puzzle.personEn, puzzle.personVi)}</small>`;
    picked.disabled = true;
    api.sfx.chime();
    api.praise();
    await wait(600);
  }
  api.dots(puzzles.length, puzzles.length);
  return api.win({ title: T('Everyone found the right chair!', 'Ai cũng tìm được đúng ghế rồi!') });
}

function pipeShape(cell: PipeCell) {
  const rotation = cell.turns * 90;
  return `<i style="transform:rotate(${rotation}deg)"></i>`;
}

async function runPipes(api) {
  style();
  const rounds: PipeCell[][] = [
    [
      { kind: 'end', turns: 0, want: 3 }, { kind: 'straight', turns: 0, want: 1 }, { kind: 'elbow', turns: 0, want: 2 },
      { kind: 'straight', turns: 3, want: 0 }, { kind: 'elbow', turns: 2, want: 0 }, { kind: 'straight', turns: 1, want: 0 },
      { kind: 'end', turns: 0, want: 0 }, { kind: 'straight', turns: 1, want: 1 }, { kind: 'end', turns: 0, want: 2 }
    ],
    [
      { kind: 'end', turns: 1, want: 3 }, { kind: 'straight', turns: 2, want: 1 }, { kind: 'elbow', turns: 1, want: 2 },
      { kind: 'straight', turns: 1, want: 0 }, { kind: 'elbow', turns: 3, want: 0 }, { kind: 'straight', turns: 3, want: 0 },
      { kind: 'end', turns: 1, want: 0 }, { kind: 'straight', turns: 0, want: 1 }, { kind: 'end', turns: 3, want: 2 }
    ]
  ];
  // (owner, 29 Oct 2026 AEDT audit) turns are clockwise quarter turns: an elbow at 0 joins up and right, a straight at 0
  // up and down, an end at 0 points down. Water enters at 0 (end pointing right), runs along the top, down the right
  // side into 8 (end pointing up). Before, the start leaked downwards and the end pointed away from its pipe.
  const path = [0, 1, 2, 5, 8];
  const wrap = el('div', 'tk2-wrap');
  const title = el('h2', 'tk2-title', T('Water Pipes', 'Nối Ống Nước'));
  const round = el('div', 'tk2-round');
  const prompt = el('p', 'tk2-prompt');
  const status = el('div', 'tk2-status');
  const grid = el('div', 'tk2-pipes');
  wrap.append(title, round, prompt, grid, status);
  api.stage.appendChild(wrap);
  api.say('Turn the pipes until water can reach the end.', 'Xoay các ống nước để nước chảy đến cuối đường nhé.');

  let target: HTMLButtonElement | null = null;
  api.plan(() => target && target.isConnected ? target : null, { maxActions: 30 });

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const cells = rounds[roundIndex].map(cell => ({ ...cell }));
    round.textContent = roundLabel(roundIndex + 1, rounds.length);
    prompt.textContent = T('Tap a pipe to turn it. Make one water path.', 'Chạm vào ống để xoay. Hãy tạo một đường nước liền nhé.');
    status.textContent = '';
    grid.replaceChildren();
    const buttons = cells.map((cell, index) => {
      const button: HTMLButtonElement = el('button', `tk2-pipe ${cell.kind}`);
      button.type = 'button';
      if (index === path[0]) button.classList.add('source');
      if (index === path[path.length - 1]) button.classList.add('goal');
      button.innerHTML = pipeShape(cell);
      button.setAttribute('aria-label', T(`Pipe ${index + 1}`, `Ống ${index + 1}`));
      grid.appendChild(button);
      return button;
    });
    const mark = (index: number) => index === path[0] ? `<span class="tk2-mark">${pic('💧')}</span>` : index === path[path.length - 1] ? `<span class="tk2-mark">${pic('🌱')}</span>` : '';
    buttons.forEach((button, index) => { button.innerHTML = pipeShape(cells[index]) + mark(index); });
    const draw = (index: number) => { buttons[index].innerHTML = pipeShape(cells[index]) + mark(index); };
    const done = () => path.every(index => cells[index].turns === cells[index].want);
    const next = () => path.find(index => cells[index].turns !== cells[index].want);

    while (!done()) {
      const needed = next();
      if (needed == null) break;
      target = buttons[needed];
      const turned = await untilRight(api, buttons, () => true); // (audit: any pipe turns, in any order)
      if (!turned || api.closed) return;
      const at = buttons.indexOf(turned);
      cells[at].turns = (cells[at].turns + 1) % 4;
      draw(at);
      api.sfx.tap();
    }
    target = null;
    path.forEach(index => buttons[index].classList.add('flow'));
    status.textContent = T('Splash! The water flows all the way through.', 'Tõm! Nước đã chảy suốt đường ống rồi.');
    api.sfx.splash();
    api.praise();
    await wait(900);
  }
  api.dots(rounds.length, rounds.length);
  return api.win({ title: T('You connected every water pipe!', 'Con đã nối xong mọi ống nước!') });
}

register({ id: 'minichess', icon: '♟️', name: () => T('Little Chess', 'Cờ Vua Nhỏ'), run: runMiniChess });
register({ id: 'cotuong', icon: '🀄', name: () => T('Chinese Chess Puzzles', 'Cờ Tướng Nhỏ'), run: runCoTuong });
register({ id: 'whosits', icon: '🪑', name: () => T('Who Sits Where?', 'Ai Ngồi Đâu?'), run: runWhoSits });
register({ id: 'pipes', icon: '🚰', name: () => T('Water Pipes', 'Nối Ống Nước'), run: runPipes });
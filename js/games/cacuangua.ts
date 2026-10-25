import { register } from './frame.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';
import { applyMove, initialState, isGameOver, legalMoves, npcChooseMove, rollDice, type GameState, type Mode, type NPCDifficulty } from './cacuangua-core.js';

const COLORS = { red: '#df5b63', blue: '#4e9bd6', green: '#4caf78', yellow: '#e3a83b' };

function renderBoard(board: HTMLElement, state: GameState) {
  board.replaceChildren();
  state.players.forEach((player) => {
    const card = el('section', 'ccn-player');
    card.style.borderColor = COLORS[player.color];
    card.innerHTML = `<h3>${player.color.toUpperCase()} <small>${player.finishedCount}/${player.horses.length}</small></h3><div class="ccn-horses"></div>`;
    const horses = card.querySelector('.ccn-horses')!;
    player.horses.forEach((horse) => {
      const piece = el('span', 'ccn-horse', horse.finished ? '🏁' : horse.pos < 0 ? '🏠' : '🐴');
      piece.title = `${player.color} ${horse.id + 1}`;
      horses.appendChild(piece);
    });
    board.appendChild(card);
  });
}

async function run(api) {
  let mode: Mode = api.level <= 1 ? 'beginner' : 'full';
  let npc: NPCDifficulty = api.strong ? 'hard' : api.level >= 3 ? 'standard' : 'easy';
  let state = initialState(mode, 2, 'cacuangua-local');
  const root = el('div', 'ccn-root');
  const controls = el('div', 'ccn-controls');
  const online = api.online;
  const board = el('div', 'ccn-board');
  const status = el('p', 'ccn-status');
  const dice = el('div', 'ccn-dice');
  const moves = el('div', 'ccn-moves');
  controls.innerHTML = `<button type="button" data-mode="beginner">${T('Beginner', 'Cơ bản')}</button><button type="button" data-mode="full">${T('Full rules', 'Đầy đủ')}</button><label><input type="checkbox" data-npc checked> ${T('Play with a local helper', 'Chơi cùng bạn máy')}</label><select data-difficulty aria-label="${T('NPC difficulty', 'Độ khó bạn máy')}"><option value="easy">${T('Easy', 'Dễ')}</option><option value="standard">${T('Standard', 'Vừa')}</option><option value="hard">${T('Hard', 'Khó')}</option></select>`;
  const roll = el('button', 'ccn-roll', T('Roll dice', 'Tung xúc xắc')) as HTMLButtonElement;
  roll.type = 'button';
  root.append(controls, board, status, dice, moves, roll);
  api.stage.appendChild(root);
  api.say('Move the horses home!', 'Đưa các chú ngựa về chuồng nhé!');

  const npcBox = controls.querySelector('[data-npc]') as HTMLInputElement;
  const difficulty = controls.querySelector('[data-difficulty]') as HTMLSelectElement;
  const reset = () => { state = initialState(mode, 2, 'cacuangua-local'); renderBoard(board, state); dice.textContent = ''; moves.replaceChildren(); roll.disabled = false; status.textContent = T('Red starts. Roll the dice!', 'Đỏ đi trước. Tung xúc xắc nhé!'); };
  (controls.querySelectorAll('[data-mode]') as NodeListOf<HTMLButtonElement>).forEach(button => button.onclick = () => { mode = button.dataset.mode as Mode; reset(); });
  if (online) { npcBox.checked = false; npcBox.disabled = true; difficulty.disabled = true; }
  npcBox.onchange = () => { difficulty.disabled = !npcBox.checked; };
  difficulty.onchange = () => { npc = difficulty.value as NPCDifficulty; };

  const chooseMove = (move: { horse: number; dieIndex: number }) => { state = applyMove(state, move.horse, move.dieIndex); renderBoard(board, state); if (online) online.move(moveNo++, move.horse * 8 + move.dieIndex); };
  let moveNo = 0;
  if (online) online.onMove((seat, n, value) => { if (seat !== online.mine && n >= moveNo) { moveNo = n + 1; const horse = Math.floor(Number(value) / 8); const dieIndex = Number(value) % 8; chooseMove({ horse, dieIndex }); } });
  const npcTurn = async () => {
    if (!npcBox.checked || state.turn !== 1 || isGameOver(state)) return;
    await wait(450);
    state = { ...state, dice: rollDice(state), pendingMove: true };
    const legal = legalMoves(state);
    if (legal.length) { chooseMove(npcChooseMove(state, npc)); if (state.turn === 1 && state.pendingMove) { state = { ...state, dice: [], pendingMove: false, turn: 0 }; } }
    if (!isGameOver(state)) { status.textContent = T('Your turn!', 'Đến lượt bạn!'); roll.disabled = false; }
  };
  const showMoves = () => {
    moves.replaceChildren();
    legalMoves(state).forEach(move => {
      const button = el('button', 'ccn-move', `${T('Horse', 'Ngựa')} ${move.horse + 1} · ${move.steps}`) as HTMLButtonElement;
      button.type = 'button';
      button.onclick = () => { api.sfx.tap(); chooseMove(move); if (isGameOver(state)) return; if (state.turn === 1) void npcTurn(); else if (state.pendingMove) showMoves(); else { status.textContent = T('Roll again!', 'Tung lại nhé!'); roll.disabled = false; } };
      moves.appendChild(button);
    });
  };
  roll.onclick = async () => {
    if ((online && state.turn !== online.mine) || (state.turn === 1 && npcBox.checked)) return;
    const values = rollDice(state);
    state = { ...state, dice: values, pendingMove: true };
    dice.textContent = values.map(value => `🎲 ${value}`).join('  ');
    moves.replaceChildren();
    const legal = legalMoves(state);
    if (!legal.length) { status.textContent = T('No move this turn.', 'Lượt này chưa đi được.'); state = { ...state, dice: [], pendingMove: false, turn: (state.turn + 1) % state.players.length }; roll.disabled = true; void npcTurn(); return; }
    roll.disabled = true;
    status.textContent = T('Choose a horse to move.', 'Chọn một chú ngựa để đi.');
    showMoves();
  };
  renderBoard(board, state); reset();
  api.onCleanup(() => { roll.onclick = null; controls.querySelectorAll('button').forEach(button => { button.onclick = null; }); });
  while (!api.closed && !isGameOver(state)) await wait(250);
  if (api.closed) return;
  const winner = state.winner === state.players[0].color ? T('You win!', 'Bạn thắng rồi!') : T('The helper wins!', 'Bạn máy thắng rồi!');
  return api.win({ title: winner });
}

register({ id: 'cacuangua', icon: '🐴', origin: 'vn', name: () => T('Horse Racing Chess', 'Cờ Cá Ngựa'), run });

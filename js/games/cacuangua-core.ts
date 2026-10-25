// Pure Cờ Cá Ngựa (Horse Racing Chess) rules — deterministic, side-effect free for unit tests.
// Beginner mode: 2 horses per player, 1 die, first to finish wins (no captures, no stacking).
// Full mode: 4 horses, 2 dice, captures send opponent home, safe squares, stacking allowed.

export type Mode = 'beginner' | 'full';
export type Color = 'red' | 'blue' | 'green' | 'yellow';
export type SquareType = 'normal' | 'safe' | 'home' | 'finish';

export interface Horse {
  id: number;           // 0..horsesPerPlayer-1
  pos: number;          // -1 = in stable, 0..pathLen-1 on track, pathLen = in finish
  finished: boolean;
}

export interface PlayerState {
  color: Color;
  horses: Horse[];
  finishedCount: number;
}

export interface GameState {
  mode: Mode;
  players: PlayerState[];
  turn: number;                 // index into players
  dice: number[];               // last rolled values
  winner: Color | null;
  pendingMove: boolean;         // waiting for horse selection after roll
}

// Board geometry (shared by both modes)
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const START_INDEX: Record<Color, number> = { red: 0, blue: 13, green: 26, yellow: 39 };
const HOME_STRETCH_START = 52;              // index where home stretch begins (shared ring)
const HOME_STRETCH_LEN = 6;
const FINISH_INDEX = HOME_STRETCH_START + HOME_STRETCH_LEN;
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]); // global safe squares

function mod52(n: number) { return ((n % 52) + 52) % 52; }

export function initialState(mode: Mode, playerCount = 2, seed = 'game'): GameState {
  const horsesPerPlayer = mode === 'beginner' ? 2 : 4;
  const colors = COLORS.slice(0, playerCount);
  const players: PlayerState[] = colors.map((color, i) => ({
    color,
    horses: Array.from({ length: horsesPerPlayer }, (_, id) => ({ id, pos: -1, finished: false })),
    finishedCount: 0,
  }));
  // deterministic shuffle of turn order from seed
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => { h = (h + 0x6D2B79F5) >>> 0; return h / 0x100000000; };
  const order = players.map((_, i) => i).sort(() => rnd() - 0.5);
  const reordered = order.map(i => players[i]);
  return { mode, players: reordered, turn: 0, dice: [], winner: null, pendingMove: false };
}

export function rollDice(state: GameState, fixed?: number[]): number[] {
  const next = cloneState(state);
  const diceCount = state.mode === 'beginner' ? 1 : 2;
  if (fixed && fixed.length === diceCount) {
    next.dice = fixed.slice();
  } else {
    // deterministic pseudo-random from turn + previous dice
    let seed = next.turn * 1000 + (next.dice[0] || 0);
    let n = 2166136261;
    for (let i = 0; i < String(seed).length; i++) n = Math.imul(n ^ String(seed).charCodeAt(i), 16777619);
    n = (n + 0x6D2B79F5) >>> 0;
    next.dice = Array.from({ length: diceCount }, () => (n = (n + 0x6D2B79F5) >>> 0, (n % 6) + 1));
  }
  next.pendingMove = true;
  return next.dice.slice();
}

function globalPos(player: PlayerState, horse: Horse): number {
  if (horse.pos < 0) return -1;
  if (horse.pos >= FINISH_INDEX) return FINISH_INDEX;
  if (horse.pos >= HOME_STRETCH_START) return horse.pos; // already on home stretch or finished
  const start = START_INDEX[player.color];
  return mod52(start + horse.pos);
}

function isSafeSquare(gpos: number): boolean {
  return SAFE_SQUARES.has(gpos);
}

export function legalMoves(state: GameState): Array<{ player: number; horse: number; dieIndex: number; steps: number }> {
  const moves: Array<{ player: number; horse: number; dieIndex: number; steps: number }> = [];
  const player = state.players[state.turn];
  const horsesPerPlayer = state.mode === 'beginner' ? 2 : 4;
  for (let dieIdx = 0; dieIdx < state.dice.length; dieIdx++) {
    const steps = state.dice[dieIdx];
    for (let h = 0; h < horsesPerPlayer; h++) {
      const horse = player.horses[h];
      if (horse.finished) continue;
      if (horse.pos === -1) {
        // can exit stable on a 6 (full) or any roll (beginner simplified)
        const canExit = state.mode === 'beginner' || steps === 6;
        if (canExit) moves.push({ player: state.turn, horse: h, dieIndex: dieIdx, steps });
      } else {
        const newPos = horse.pos + steps;
        if (newPos <= FINISH_INDEX) moves.push({ player: state.turn, horse: h, dieIndex: dieIdx, steps });
      }
    }
  }
  return moves;
}

export function applyMove(state: GameState, horseIndex: number, dieIndex: number): GameState {
  const next = cloneState(state);
  if (dieIndex < 0 || dieIndex >= next.dice.length) throw new Error('bad dieIndex');
  const steps = next.dice[dieIndex];
  const player = next.players[next.turn];
  const horse = player.horses[horseIndex];
  if (horse.finished) throw new Error('horse finished');

  if (horse.pos === -1) {
    // exit stable
    horse.pos = 0;
    const gpos = globalPos(player, horse);
    // capture on start square (full mode only)
    if (next.mode === 'full' && !isSafeSquare(gpos)) captureAt(next, gpos, next.turn);
  } else {
    const newPos = horse.pos + steps;
    if (newPos > FINISH_INDEX) throw new Error('overshoot');
    horse.pos = newPos;
    const newGpos = globalPos(player, horse);
    // capture on landing square (full mode only)
    if (next.mode === 'full' && newPos < HOME_STRETCH_START && !isSafeSquare(newGpos)) {
      captureAt(next, newGpos, next.turn);
    }
    if (newPos === FINISH_INDEX) {
      horse.finished = true;
      player.finishedCount++;
      if (player.finishedCount === (next.mode === 'beginner' ? 2 : 4)) {
        next.winner = player.color;
      }
    }
  }

  // consume die
  next.dice.splice(dieIndex, 1);
  next.pendingMove = next.dice.length > 0 && legalMoves(next).length > 0;

  // next turn if no dice left or no legal moves
  if (!next.pendingMove) {
    next.turn = (next.turn + 1) % next.players.length;
  }
  return next;
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function captureAt(state: GameState, gpos: number, byPlayer: number) {
  for (let pi = 0; pi < state.players.length; pi++) {
    if (pi === byPlayer) continue;
    for (const horse of state.players[pi].horses) {
      if (horse.pos >= 0 && horse.pos < HOME_STRETCH_START && globalPos(state.players[pi], horse) === gpos) {
        horse.pos = -1;
        horse.finished = false;
      }
    }
  }
}

// NPC difficulty: Easy = random legal, Standard = prefers finish/capture/exit, Hard = minimax 1-ply
export type NPCDifficulty = 'easy' | 'standard' | 'hard';

export function npcChooseMove(state: GameState, diff: NPCDifficulty): { horse: number; dieIndex: number } {
  const moves = legalMoves(state);
  if (!moves.length) throw new Error('no legal moves');
  if (diff === 'easy') {
    const seed = hashText(serialize(state) + ':easy');
    return moves[seed % moves.length];
  }

  // score each move
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    let score = 0;
    const player = state.players[m.player];
    const horse = player.horses[m.horse];
    const steps = state.dice[m.dieIndex];
    if (horse.pos === -1) score += 10;                    // exiting stable is good
    const newPos = horse.pos + steps;
    if (newPos === FINISH_INDEX) score += 100;            // finishing
    if (state.mode === 'full' && newPos < HOME_STRETCH_START) {
      const gpos = mod52(START_INDEX[player.color] + newPos);
      // capture potential
      for (let pi = 0; pi < state.players.length; pi++) {
        if (pi === m.player) continue;
        for (const oh of state.players[pi].horses) {
          if (oh.pos >= 0 && oh.pos < HOME_STRETCH_START && globalPos(state.players[pi], oh) === gpos) {
            score += 50; break;
          }
        }
      }
      // avoid landing on unsafe if opponent can capture next
      if (!isSafeSquare(gpos)) score -= 5;
    }
    // beginner: just advance
    if (state.mode === 'beginner') score += steps * 2;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return { horse: best.horse, dieIndex: best.dieIndex };
}

function hashText(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function isGameOver(state: GameState): boolean {
  return state.winner !== null;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(s: string): GameState {
  return JSON.parse(s);
}

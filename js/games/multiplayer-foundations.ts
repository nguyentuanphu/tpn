import type { } from './registry.js';

export type FoundationMode = 'turn' | 'round';
export type MoveKind = 'pit' | 'roll' | 'pull' | 'answer' | 'horse';
export type MultiplayerCapabilities = {
  online: true;
  npc: boolean;
  local: true;
  maxPlayers: number;
  turnBased: boolean;
  teamBased: boolean;
  difficultyLevels: number[];
  adultConsent: false;
};
export type MultiplayerFoundation = MultiplayerCapabilities & { id: string; all: boolean; mode: FoundationMode; move: MoveKind; max: number };

const caps = (maxPlayers: number, mode: FoundationMode, teamBased = false): MultiplayerCapabilities => ({
  online: true, npc: false, local: true, maxPlayers, turnBased: mode === 'turn', teamBased, difficultyLevels: [1, 2, 3, 4, 5], adultConsent: false
});

export const MULTIPLAYER_FOUNDATIONS: Record<string, MultiplayerFoundation> = {
  oanquan: { id: 'oanquan', all: false, mode: 'turn', move: 'pit', max: 2, ...caps(2, 'turn') },
  snakes: { id: 'snakes', all: false, mode: 'turn', move: 'roll', max: 4, ...caps(4, 'turn') },
  tug: { id: 'tug', all: true, mode: 'round', move: 'pull', max: 6, ...caps(6, 'round', true) },
  familyquiz: { id: 'familyquiz', all: true, mode: 'round', move: 'answer', max: 6, ...caps(6, 'round', true) },
  cacuangua: { id: 'cacuangua', all: true, mode: 'turn', move: 'horse', max: 4, ...caps(4, 'turn'), npc: true }
};

export function foundationFor(id: string): MultiplayerFoundation | null { return MULTIPLAYER_FOUNDATIONS[id] || null; }

export function validMove(id: string, value: number): boolean {
  if (!Number.isInteger(value)) return false;
  if (id === 'oanquan') return value >= 0 && value < 24;
  if (id === 'snakes') return value >= 1 && value <= 6;
  if (id === 'tug') return value === 0 || value === 1;
  if (id === 'familyquiz') return value >= 0 && value <= 3;
  // Horse board reducer: 0 rolls, 1..4 choose a horse. No client-supplied die result.
  if (id === 'cacuangua') return value >= 0 && value <= 4;
  return false;
}

export type AuthoritativeMoveState = {
  game: string;
  seats: number;
  turn: number;
  rounds: Map<number, Set<number>>;
  moves: Map<number, Map<number, number>>;
};

export function createAuthoritativeState(id: string, seats: number): AuthoritativeMoveState | null {
  const def = foundationFor(id);
  // The horse session validates actual board state, bonus turns and ordered host commits.
  if(id==='cacuangua')return null;
  if (!def || !Number.isInteger(seats) || seats < 2 || seats > def.maxPlayers) return null;
  return { game: id, seats, turn: 0, rounds: new Map(), moves: new Map() };
}

export function applyAuthoritativeMove(state: AuthoritativeMoveState, seat: number, n: number, value: number): boolean {
  const def = foundationFor(state.game);
  if (!def || !Number.isInteger(seat) || seat < 0 || seat >= state.seats || !Number.isInteger(n) || n < 0 || n > 9999 || !validMove(state.game, value)) return false;
  if (def.mode === 'turn' && seat !== state.turn) return false;
  const round = state.rounds.get(n) || new Set<number>();
  if (round.has(seat)) return false;
  round.add(seat); state.rounds.set(n, round);
  if (!state.moves.has(n)) state.moves.set(n, new Map());
  state.moves.get(n)!.set(seat, value);
  if (def.mode === 'turn') state.turn = nextTurn(state.turn, state.seats);
  return true;
}

export function nextTurn(current: number, players: number): number {
  if (!Number.isInteger(players) || players <= 0) return 0;
  return ((current + 1) % players + players) % players;
}

export function applySnakesRoll(position: number, roll: number, board = 25, jumps: Record<number, number> = {}): number {
  if (!validMove('snakes', roll) || !Number.isInteger(position) || position < 1 || position > board) return position;
  const landed = Math.min(board, position + roll);
  return Number.isInteger(jumps[landed]) ? jumps[landed] : landed;
}

export function resolveTugRound(pulls: number[], target = 5): number {
  const balance = pulls.reduce((sum, value) => sum + (value === 0 ? -1 : value === 1 ? 1 : 0), 0);
  if (balance <= -target) return 0;
  if (balance >= target) return 1;
  return -1;
}

export function scoreFamilyQuiz(answers: Array<number | null>, correct: number): number[] {
  return answers.map(answer => answer === correct ? 1 : 0);
}

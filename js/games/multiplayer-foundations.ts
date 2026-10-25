import type { } from './registry.js';

export type FoundationMode = 'turn' | 'round';
export type MoveKind = 'pit' | 'roll' | 'pull' | 'answer';
export type MultiplayerFoundation = { id: string; max: number; all: boolean; mode: FoundationMode; move: MoveKind };

export const MULTIPLAYER_FOUNDATIONS: Record<string, MultiplayerFoundation> = {
  oanquan: { id: 'oanquan', max: 2, all: false, mode: 'turn', move: 'pit' },
  snakes: { id: 'snakes', max: 4, all: false, mode: 'turn', move: 'roll' },
  tug: { id: 'tug', max: 6, all: true, mode: 'round', move: 'pull' },
  familyquiz: { id: 'familyquiz', max: 6, all: true, mode: 'round', move: 'answer' }
};

export function foundationFor(id: string): MultiplayerFoundation | null { return MULTIPLAYER_FOUNDATIONS[id] || null; }

export function validMove(id: string, value: number): boolean {
  if (!Number.isInteger(value)) return false;
  if (id === 'oanquan') return value >= 0 && value < 24;
  if (id === 'snakes') return value >= 1 && value <= 6;
  if (id === 'tug') return value === 0 || value === 1;
  if (id === 'familyquiz') return value >= 0 && value <= 3;
  return false;
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

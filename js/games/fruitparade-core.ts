export type FruitRound = { items: string[], target: string[] };

import { SYMBOL_DEFS } from './fruitparade-engine.js';
export const SYMBOLS = SYMBOL_DEFS.map(symbol => symbol.art);

const hash = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rng = (seed: string) => {
  let n = hash(seed);
  return () => {
    n += 0x6D2B79F5;
    let t = n;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export function createRound(seed: string, level = 1): FruitRound {
  const random = rng(String(seed) + ':' + level);
  const shuffle = (source: string[]) => {
    const copy = source.slice();
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  };
  const items = shuffle(SYMBOLS).slice(0, 3);
  const target = shuffle(items);
  return { items, target };
}

export function isCorrectOrder(order: string[], target: string[]) {
  return order.length === target.length && order.every((symbol, i) => symbol === target[i]);
}

export function scoreRound({ correct, attempts, level }: { correct: boolean, attempts: number, level: number }) {
  if (!correct) return 0;
  return Math.max(1, Math.min(5, (level || 1) + 2 - Math.max(0, attempts - 1)));
}

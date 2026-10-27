// Pure rules for the screen-only arcade: no DOM, clocks, transport, saves or rewards.
export type SymbolId = 'apple' | 'strawberry' | 'banana' | 'flower' | 'ladybug' | 'star' | 'rainbow' | 'dragon' | 'key';
export type AdventureId = 'ladybug' | 'dragon' | 'treasure';
export type SymbolDef = { id: SymbolId; art: string; en: string; vi: string; wildcard?: boolean; substitutable?: boolean };
export const SYMBOL_DEFS: readonly SymbolDef[] = [
  { id: 'apple', art: '🍎', substitutable: true, en: 'Apple', vi: 'Táo' },
  { id: 'strawberry', art: '🍓', substitutable: true, en: 'Strawberry', vi: 'Dâu tây' },
  { id: 'banana', art: '🍌', substitutable: true, en: 'Banana', vi: 'Chuối' },
  { id: 'flower', art: '🌻', substitutable: true, en: 'Flower', vi: 'Hoa' },
  { id: 'ladybug', art: '🐞', en: 'Ladybird', vi: 'Bọ rùa' },
  { id: 'star', art: '⭐', en: 'Sparkle star', vi: 'Ngôi sao' },
  { id: 'rainbow', art: '🌈', en: 'Rainbow', vi: 'Cầu vồng', wildcard: true },
  { id: 'dragon', art: '🐉', en: 'Dragon', vi: 'Rồng' },
  { id: 'key', art: '🗝️', en: 'Magic key', vi: 'Chìa khóa' }
];
export const symbolDef = (id: SymbolId) => SYMBOL_DEFS.find(item => item.id === id)!;
export type ParadeConfig = { tier: number; interval: number; quota: number; rounds: number; pool: readonly SymbolId[]; assist: boolean };
export function paradeConfig(tier: number): ParadeConfig {
  const value = Number.isFinite(tier) ? Math.max(0, Math.min(3, Math.floor(tier))) : 0;
  const common: SymbolId[] = ['apple', 'strawberry', 'banana'];
  return { tier: value, interval: [1400, 1100, 850, 650][value], quota: value === 0 ? 1 : value === 1 ? 2 : 3,
    rounds: value < 2 ? 2 : 3, assist: value === 0,
    pool: value === 0 ? [...common, 'rainbow'] : value === 1 ? [...common, 'flower', 'ladybug', 'rainbow'] : SYMBOL_DEFS.map(item => item.id) };
}
export function randomStream(seed: string) {
  let n = 2166136261;
  for (const c of seed) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ n >>> 15, n | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function shuffled<T>(source: readonly T[], random: () => number): T[] {
  const copy = source.slice();
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export type ParadeRound = { seed: string; round: number; attempt: number; seats: number; baseTier: number; streak: number; config: ParadeConfig; goals: SymbolId[][]; cycles: SymbolId[][][] };
export function makeParadeRound(seed: string, tier: number, seats: number, round = 0, attempt = 0, adaptation: { baseTier?: number; streak?: number } = {}): ParadeRound {
  if (!Number.isInteger(seats) || seats < 1 || seats > 4 || !Number.isInteger(round) || round < 0 || round > 2 || !Number.isInteger(attempt) || attempt < 0 || attempt > 7) throw new Error('Invalid parade round');
  const config = paradeConfig(tier), random = randomStream(`${seed}:${round}:${attempt}:${config.tier}`);
  const baseTier = adaptation.baseTier ?? config.tier;
  config.rounds = paradeConfig(baseTier).rounds;
  const wanted = config.pool.filter(id => !symbolDef(id).wildcard);
  const goals = Array.from({ length: seats }, () => Array.from({ length: config.quota }, () => wanted[Math.floor(random() * wanted.length)]));
  const cycles = Array.from({ length: seats }, () => Array.from({ length: 3 }, () => shuffled(config.pool, random)));
  return { seed, round, attempt, seats, baseTier, streak: adaptation.streak || 0, config, goals, cycles };
}
export function laneSymbol(round: ParadeRound, seat: number, lane: number, tick: number): SymbolId {
  const cycle = round.cycles[seat][lane];
  return cycle[((tick % cycle.length) + cycle.length) % cycle.length];
}
export type Stop = { seat: number; lane: number; symbol: SymbolId; assisted: boolean };
export type Outcome = { matched: number; needed: number; success: boolean; effects: AdventureId[]; star: boolean };
export const ADVENTURES: readonly { id: AdventureId; needs: readonly SymbolId[] }[] = [
  { id: 'ladybug', needs: ['ladybug', 'ladybug', 'ladybug'] },
  { id: 'dragon', needs: ['dragon', 'star', 'star'] },
  { id: 'treasure', needs: ['key', 'star'] }
];
export function evaluateMission(round: ParadeRound, stops: readonly Stop[]): Outcome {
  const available = new Map<SymbolId, number>();
  for (const stop of stops) available.set(stop.symbol, (available.get(stop.symbol) || 0) + 1);
  const raw = new Map(available);
  let matched = 0;
  // Exact matches first: a rainbow must not steal a later exact match.
  const unmet: SymbolId[] = [];
  for (const target of round.goals.flat()) {
    if (available.get(target)) { available.set(target, available.get(target)! - 1); matched++; } else unmet.push(target);
  }
  let wild = SYMBOL_DEFS.filter(item => item.wildcard).reduce((n, item) => n + (available.get(item.id) || 0), 0);
  for (const target of unmet) if (wild > 0 && symbolDef(target).substitutable) { wild--; matched++; }
  const effects = ADVENTURES.filter(rule => {
    const counts = new Map(raw);
    return rule.needs.every(id => { const n = counts.get(id) || 0; counts.set(id, n - 1); return n > 0; });
  }).map(rule => rule.id);
  const needed = round.goals.flat().length;
  return { matched, needed, success: matched === needed, effects, star: (raw.get('star') || 0) > 0 };
}
export type StopAction = { round: number; attempt: number; seat: number; lane: number; tick: number };
export type ParadeState = { round: ParadeRound; stops: Stop[]; outcome: Outcome | null };
export const initialParadeState = (round: ParadeRound): ParadeState => ({ round, stops: [], outcome: null });
export function applyParadeStop(state: ParadeState, action: StopAction): ParadeState | null {
  const r = state.round;
  if (state.outcome || action.round !== r.round || action.attempt !== r.attempt || !Number.isInteger(action.seat) || action.seat < 0 || action.seat >= r.seats || !Number.isInteger(action.lane) || action.lane < 0 || action.lane > 2 || !Number.isInteger(action.tick) || action.tick < 0 || action.tick > 1800 || state.stops.some(s => s.seat === action.seat && s.lane === action.lane)) return null;
  let symbol = laneSymbol(r, action.seat, action.lane, action.tick), assisted = false;
  const goal = r.goals[action.seat][action.lane];
  if (r.config.assist && goal && symbol !== goal && !symbolDef(symbol).wildcard && [-1, 1].some(delta => laneSymbol(r, action.seat, action.lane, action.tick + delta) === goal)) { symbol = goal; assisted = true; }
  const stops = [...state.stops, { seat: action.seat, lane: action.lane, symbol, assisted }];
  return { round: r, stops, outcome: stops.length === r.seats * 3 ? evaluateMission(r, stops) : null };
}
export function nextParadeRound(state: ParadeState): ParadeRound | null {
  if (!state.outcome) return state.round;
  const retry = !state.outcome.success && state.round.attempt < 1;
  const round = state.round.round + (retry ? 0 : 1);
  const streak = state.outcome.success ? state.round.streak + 1 : 0, base = state.round.baseTier;
  const shift = !state.outcome.success ? -1 : streak >= 2 ? 1 : 0;
  const tier = base === 0 ? 0 : Math.max(1, base - 1, Math.min(3, base + 1, state.round.config.tier + shift));
  return round >= state.round.config.rounds ? null : makeParadeRound(state.round.seed, tier, state.round.seats, round, retry ? state.round.attempt + 1 : 0, { baseTier: base, streak });
}

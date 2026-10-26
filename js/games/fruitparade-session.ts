// Session-host authority over Sparkle Valley's existing encrypted numeric move transport.
// Guests send bounded lane steps; only seat zero commits symbols/progress/results.
import { SYMBOL_DEFS, applyParadeStop, evaluateMission, initialParadeState, makeParadeRound, nextParadeRound, paradeConfig } from './fruitparade-engine.js';
import type { AdventureId, Outcome, ParadeState, StopAction } from './fruitparade-engine.js';

export type ParadeChannel = {
  mine: number; seats: number; seed: string;
  send(n: number, value: number): void;
  listen(fn: (seat: number, n: number, value: number) => void): (() => void) | void;
  read?(n: number, seat: number): Promise<unknown>;
  connected?(): boolean; present?(seat: number): boolean; leave?(): void;
};
export type ParadeView = { state: ParadeState | null; progress: Outcome | null; finished: boolean };
const effectIds: AdventureId[] = ['ladybug', 'dragon', 'treasure'];
const slot = (round: number, attempt: number, seat: number, lane: number) => round * 1000 + attempt * 100 + seat * 10 + lane;
const resultSlot = (round: number, attempt: number) => round * 100 + attempt;
const decodeSlot = (n: number) => ({ round: Math.floor(n / 1000), attempt: Math.floor(n % 1000 / 100), seat: Math.floor(n % 100 / 10), lane: n % 10 });

export class ParadeSession {
  readonly mine: number;
  readonly seats: number;
  readonly seed: string;
  private channel?: ParadeChannel;
  private off?: () => void;
  private dead = false;
  private local: boolean;
  private tiers = new Map<number, number>();
  private tier: number | null = null;
  private tape = new Map<number, number>();
  private pending = new Map<number, number>();
  private greetTimer?: ReturnType<typeof setTimeout>;
  private syncNo = 0;
  private changed: () => void;
  view: ParadeView = { state: null, progress: null, finished: false };

  constructor(options: { seed: string; tier: number; seats: number; channel?: ParadeChannel; changed: () => void }) {
    this.mine = options.channel?.mine || 0; this.seats = options.seats; this.seed = options.seed;
    this.local = !options.channel; this.channel = options.channel; this.changed = options.changed;
    if (this.local) { this.begin(paradeConfig(options.tier).tier); return; }
    const off = this.channel!.listen((seat, n, value) => this.receive(seat, n, value));
    if (typeof off === 'function') this.off = off;
    this.tiers.set(this.mine, paradeConfig(options.tier).tier);
    // Existing transport retains messages that arrived before the renderer installed listeners.
    if (this.mine === 0) {
      for (let seat = 1; seat < this.seats; seat++) void this.channel!.read?.(9690, seat).then(value => {
        if (typeof value === 'number') this.receive(seat, 9690, value);
      });
      this.greetTimer = setTimeout(() => { if (!this.dead && this.tier === null) this.begin(0); }, 8000);
    } else void this.channel!.read?.(9600, 0).then(value => { if (typeof value === 'number') this.receive(0, 9600, value); });
    this.channel!.send(9690, paradeConfig(options.tier).tier);
    this.resync();
  }

  get online() { return !this.local; }
  get authority() { return this.local || this.mine === 0; }
  get waiting() {
    return !this.local && (!!this.channel?.connected && !this.channel.connected() || Array.from({ length: this.seats }, (_, s) => s).some(s => s !== this.mine && this.channel?.present && !this.channel.present(s)));
  }
  private notify() { if (!this.dead) this.changed(); }
  private begin(tier: number) {
    if (this.dead || this.tier !== null) return;
    clearTimeout(this.greetTimer); this.tier = tier;
    this.view = { state: initialParadeState(makeParadeRound(this.seed, tier, this.seats)), progress: null, finished: false };
    if (!this.local && this.mine === 0) this.publish(9600, tier);
    this.notify();
  }
  private publish(n: number, value: number) {
    this.tape.set(n, value);
    if (!this.local) this.channel?.send(n, value);
  }
  submit(seat: number, lane: number, tick: number): boolean {
    const state = this.view.state;
    if (this.dead || !state || this.view.finished || (!this.local && seat !== this.mine)) return false;
    const action = { round: state.round.round, attempt: state.round.attempt, seat, lane, tick };
    if (!this.authority) {
      if (!Number.isInteger(tick) || tick < 0 || tick > 1800 || !Number.isInteger(lane) || lane < 0 || lane > 2 || state.stops.some(s => s.seat === seat && s.lane === lane)) return false;
      const key = slot(action.round, action.attempt, seat, lane);
      this.pending.set(key, tick); this.channel?.send(key, tick); return true;
    }
    return this.accept(action);
  }
  private accept(action: StopAction): boolean {
    const state = this.view.state;
    if (!state) return false;
    const next = applyParadeStop(state, action); if (!next) return false;
    this.view.state = next; this.view.progress = evaluateMission(next.round, next.stops);
    const stop = next.stops[next.stops.length - 1], key = slot(action.round, action.attempt, action.seat, action.lane);
    this.publish(3000 + key, SYMBOL_DEFS.findIndex(item => item.id === stop.symbol) + (stop.assisted ? 50 : 0));
    this.publish(6000 + key, this.view.progress.matched);
    if (next.outcome) {
      const bits = next.outcome.effects.reduce((n, id) => n | 1 << effectIds.indexOf(id), 0);
      this.publish(9000 + resultSlot(action.round, action.attempt), next.outcome.matched + (next.outcome.success ? 100 : 0) + bits * 1000);
    }
    this.notify(); return true;
  }
  advance(): boolean {
    const state = this.view.state;
    if (this.dead || !this.authority || !state?.outcome || this.view.finished) return false;
    const next = nextParadeRound(state), key = 9300 + resultSlot(state.round.round, state.round.attempt);
    if (next) this.view = { state: initialParadeState(next), progress: null, finished: false };
    else this.view.finished = true;
    this.publish(key, next ? next.round * 10 + next.attempt : 99);
    this.notify(); return true;
  }
  receive(seat: number, n: number, value: number) {
    if (this.dead || this.local || !Number.isInteger(seat) || seat < 0 || seat >= this.seats || !Number.isInteger(n) || n < 0 || n > 9999 || !Number.isInteger(value) || value < 0 || value > 9999) return;
    if (this.mine === 0) {
      if (n === 9690 && value <= 3 && this.tier === null) {
        this.tiers.set(seat, value);
        if (this.tiers.size === this.seats) this.begin(Math.min(...this.tiers.values()));
      } else if (seat !== 0 && n >= 9700) this.replay();
      else if (seat !== 0 && n < 3000) {
        const action = decodeSlot(n);
        if (action.seat === seat) this.accept({ ...action, tick: value });
      }
      return;
    }
    // A guest cannot publish a symbol, result or transition for another child.
    if (seat !== 0) return;
    if (n >= 3000 && n < 6000) this.pending.delete(n - 3000);
    if (n === 9600 && value <= 3) {
      if (this.tier !== null && this.tier !== value) return;
      this.tier = value;
    } else if (n < 3000 || n >= 9600) return;
    if (!this.tape.has(n)) this.tape.set(n, value);
    this.rebuild();
  }
  private rebuild() {
    if (this.tier === null) return;
    let state = initialParadeState(makeParadeRound(this.seed, this.tier, this.seats));
    let progress: Outcome | null = null;
    // Reconstruct from host commits, including out-of-order replay after reconnect.
    for (let step = 0; step < 8; step++) {
      const r = state.round;
      let matched = 0;
      for (let seat = 0; seat < this.seats; seat++) for (let lane = 0; lane < 3; lane++) {
        const key = slot(r.round, r.attempt, seat, lane), value = this.tape.get(3000 + key);
        if (value !== undefined && (value < SYMBOL_DEFS.length || value >= 50 && value < 50 + SYMBOL_DEFS.length)) state.stops.push({ seat, lane, symbol: SYMBOL_DEFS[value % 50].id, assisted: value >= 50 });
        const count = this.tape.get(6000 + key); if (count !== undefined && count <= r.goals.flat().length) matched = Math.max(matched, count);
      }
      const needed = r.goals.flat().length;
      progress = { matched, needed, success: false, effects: [], star: state.stops.some(s => s.symbol === 'star') };
      const result = this.tape.get(9000 + resultSlot(r.round, r.attempt));
      if (result !== undefined && state.stops.length === this.seats * 3 && result % 100 <= needed && Math.floor(result / 100) % 10 <= 1 && Math.floor(result / 1000) <= 7) {
        const success = Math.floor(result / 100) % 10 === 1;
        if (success && result % 100 !== needed) break;
        state.outcome = { matched: result % 100, needed, success, effects: effectIds.filter((_, i) => Math.floor(result / 1000) & 1 << i), star: progress.star };
        progress = state.outcome;
      }
      const transition = this.tape.get(9300 + resultSlot(r.round, r.attempt));
      if (transition === undefined || !state.outcome) { this.view = { state, progress, finished: false }; this.notify(); return; }
      const next = nextParadeRound(state);
      if (!next && transition === 99) { this.view = { state, progress, finished: true }; this.notify(); return; }
      if (!next || transition !== next.round * 10 + next.attempt) break;
      state = initialParadeState(next);
    }
  }
  private replay() { for (const [n, value] of this.tape) this.channel?.send(n, value); }
  resync() {
    if (this.dead || this.local) return;
    if (this.mine === 0) this.replay();
    else if (this.syncNo < 299) {
      for (const [n, value] of this.pending) this.channel?.send(n, value);
      this.channel?.send(9700 + this.syncNo++, 1);
    }
  }
  continueLocally() {
    if (this.dead) return;
    this.off?.(); this.off = undefined; this.local = true;
    this.channel?.leave?.(); this.channel = undefined;
    if (this.tier === null) this.begin(0);
    this.notify();
  }
  dispose() { this.dead = true; clearTimeout(this.greetTimer); this.off?.(); }
}

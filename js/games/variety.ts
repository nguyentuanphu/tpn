// (v1.08 variety, owner 3 Nov 2026 AEDT: "in many games the rounds are all the same, with nothing different from one
// round to the next") small helpers the games use so each round of one game differs from the others: a deck that deals
// every item once before any comes back, a maker that asks again until it has something not seen in this game, and a
// shuffle that moves the right answer to a new place each round. Checked by `roundvariety` (tests/round-variety.mts).
import { shuffle } from '../util.js';

/** deal items one at a time: every item once (in a shuffled order) before any comes again, and never the same twice in a row */
export function deck<V>(items: readonly V[]): () => V {
  let left: V[] = [], last: V | undefined;
  return () => {
    if (!left.length) { left = shuffle(items.slice()); if (left.length > 1 && left[left.length - 1] === last) left.unshift(left.pop() as V); }
    last = left.pop() as V; return last;
  };
}

/** make(): asked again (up to `tries` times) until what it makes has a key not seen before in this game */
export function fresh<V>(make: () => V, key: (v: V) => string, tries = 40): () => V {
  const seen = new Set<string>();
  return () => {
    let v = make(), k = key(v);
    for (let t = 0; t < tries && seen.has(k); t++) { v = make(); k = key(v); }
    seen.add(k); return v;
  };
}

/** a shuffle for the answers of each round: the right one never lands where it was the round before (with only two
 * answers: never three times in a row in one place, so the child cannot just tap the other one each time) */
export function mover() {
  let lastAt = -1, before = -2;
  return <V>(opts: readonly V[], isRight: (v: V) => boolean): V[] => {
    const avoid = opts.length <= 2 ? (lastAt === before ? lastAt : -1) : lastAt;
    let order = shuffle(opts.slice());
    if (order.findIndex(isRight) < 0) return order;   // no right one among them: a plain shuffle
    for (let t = 0; t < 8 && order.length > 1 && order.findIndex(isRight) === avoid; t++) order = shuffle(opts.slice());
    if (order.length > 1 && order.findIndex(isRight) === avoid) { const i = order.findIndex(isRight), j = (i + 1) % order.length; [order[i], order[j]] = [order[j], order[i]]; }
    before = lastAt; lastAt = order.findIndex(isRight); return order;
  };
}

// (r89) Draw a Shape recognises a circle, a triangle and a square, also drawn by a shaky little hand
import test from 'node:test';
import assert from 'node:assert/strict';
import { cornersOf } from '../../js/games/drawshape.ts';

const edges = P => { const out = []; P.forEach((a, i) => { const b = P[(i + 1) % P.length]; for (let k = 0; k < 30; k++) out.push({ x: a.x + (b.x - a.x) * k / 30, y: a.y + (b.y - a.y) * k / 30 }); }); out.push(P[0]); return out; };
const cx = 150, cy = 120, r = 70;
const SHAPES = {
  0: Array.from({ length: 121 }, (_, i) => ({ x: cx + Math.cos(i / 120 * Math.PI * 2) * r, y: cy + Math.sin(i / 120 * Math.PI * 2) * r })),
  3: edges([{ x: cx, y: cy - r }, { x: cx + r, y: cy + r * .8 }, { x: cx - r, y: cy + r * .8 }]),
  4: edges([{ x: cx - r, y: cy - r }, { x: cx + r, y: cy - r }, { x: cx + r, y: cy + r }, { x: cx - r, y: cy + r }])
};
// a fixed shaky hand (the same every run)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const shake = (P, j) => { let dx = 0, dy = 0; return P.map(p => { dx = dx * .8 + (rnd() - .5) * j; dy = dy * .8 + (rnd() - .5) * j; return { x: p.x + dx, y: p.y + dy }; }); };

test('neat shapes: a circle has no corners, a triangle 3, a square 4', () => {
  for (const [n, P] of Object.entries(SHAPES)) assert.equal(cornersOf(P), +n);
});
test('shaky shapes are still recognised at least 9 times in 10', () => {
  for (const [n, P] of Object.entries(SHAPES)) { let ok = 0; for (let t = 0; t < 100; t++) if (cornersOf(shake(P, 10)) === +n) ok++; assert.ok(ok >= 90, `${n} corners: ${ok}/100`); }
});
test('an open or tiny stroke is not a shape', () => {
  assert.equal(cornersOf(SHAPES[4].slice(0, 70)), -1, 'not closed');
  assert.equal(cornersOf(SHAPES[0].map(p => ({ x: p.x / 10, y: p.y / 10 }))), -1, 'too small');
});

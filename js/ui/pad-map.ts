// The Sparkle Pad's map picture (split from js/ui.ts, v1.07): the valley drawn once from the map data.
import { $ } from '../util.js';
import { SIZE, HALF, WATER, heightAt, RIVERS, PONDS, ROADS } from '../world.js';
import { ROAD_TONES } from '../content/map.js';
// (round T4b, finding your way) the Pad map's picture, drawn once from the map data: the land shaded by its height
// (sea, sand, grass, hills, snow), every river in its own colour, the lakes and ponds, and every road in its
// region's colour (red Vietnam, orange Australia, purple to the mountains, blue along the coast, grey at home)
let VALLEY_PIC = null;
export function valleyPicture(S) {
  if (VALLEY_PIC && VALLEY_PIC.width === S) return VALLEY_PIC;
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), k = S / SIZE, N = 160, cell = S / N;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  const SEA = [92, 176, 226], SAND = [238, 220, 170], GRASS = [150, 206, 120], HILL = [118, 168, 98], ROCK = [176, 160, 140], SNOW = [244, 244, 248];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const wx = (i + .5) / N * SIZE - HALF, wz = (j + .5) / N * SIZE - HALF, h = heightAt(wx, wz) - WATER;
    const col = h < .1 ? mix([60, 140, 210], SEA, 1 + h / 4) : h < 1.2 ? SAND : h < 8 ? mix(GRASS, HILL, (h - 1.2) / 6.8) : h < 22 ? mix(HILL, ROCK, (h - 8) / 14) : mix(ROCK, SNOW, (h - 22) / 10);
    g.fillStyle = `rgb(${col})`; g.fillRect(i * cell, j * cell, cell + .6, cell + .6);
  }
  const P = ([wx, wz]) => [(wx + HALF) * k, (wz + HALF) * k];
  const line = (pts, width, colour) => { g.strokeStyle = colour; g.lineWidth = width; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, n) => { const [a, b] = P(q); n ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); };
  for (const R of RIVERS) line(R.pts, Math.max(3, 9 * R.w * k), R.tone ? R.tone : '#4aa8e0');
  for (const D of PONDS) { const [a, b] = P([D.x, D.z]); g.fillStyle = '#4aa8e0'; g.beginPath(); g.arc(a, b, D.r * k, 0, Math.PI * 2); g.fill(); }
  for (const R of ROADS) { if (R.kind === 'footpath') continue; const pts = R.loop ? [...R.pts, R.pts[0]] : R.pts;
    line(pts, (R.kind === 'asphalt' ? 5 : 3.5) + 2, 'rgba(255,255,255,.85)'); line(pts, R.kind === 'asphalt' ? 5 : 3.5, ROAD_TONES[R.tone] || (R.kind === 'dirt' ? '#c49a62' : '#8d8f96')); }
  return (VALLEY_PIC = c);
}

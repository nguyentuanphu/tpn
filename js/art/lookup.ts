// Finding a picture (split from js/art.ts, v1.07): pic(), hasArt(), labelArt(), artSVG(), ART_COUNT().
import { ART } from './kit.js';
// (an emoji with or without its invisible "picture style" mark finds the same drawing)
const keyOf = e => e == null ? null : ART[e] ? e : ART[e + '\uFE0F'] ? e + '\uFE0F' : ART[String(e).replace(/\uFE0F/g, '')] ? String(e).replace(/\uFE0F/g, '') : null;
export const hasArt = e => !!keyOf(e);
// words that start with an emoji ("👋 Bye"): the drawn picture instead, or just the words when there is none
const LEAD = /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#]\uFE0F?\u20E3|[▶◀⏮⏭⏸⏯])\s*/u;
export function labelArt(text, esc = s => s) {
  const m = LEAD.exec(text); if (!m) return esc(text);
  const e = m[1], key = ART[e] ? e : ART[e + '\uFE0F'] ? e + '\uFE0F' : ART[e.replace(/\uFE0F/g, '')] ? e.replace(/\uFE0F/g, '') : null;
  const rest = esc(text.slice(m[0].length));
  return key ? `<span class="lbl-art">${ART[key]}</span>${rest}` : rest;
}
// a picture for this emoji (or the emoji itself, in the same box size, when there is no picture)
export const pic = (e, cls = '') => { const k = keyOf(e); return k ? ART[k].replace('class="art ', `class="art ${cls} `) : `<span class="emo ${cls}">${e}</span>`; };
// the raw SVG text, for drawing onto a canvas (3D bubbles)
export const artSVG = e => { const k = keyOf(e); return k ? ART[k].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" ') : null; };
export const ART_COUNT = () => Object.keys(ART).length;


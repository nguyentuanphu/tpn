// (owner, 30 Oct 2026 AEDT: "all games' actions should show, e.g. dice throws and rolls and show a face") a chance moment
// is seen happening before its result: a die tumbles through faces and lands, hands shake before they open. Calm mode
// (Settings or the device's reduced motion) keeps it short and still.
import { reduceMotion } from '../state.js';

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** shows random faces in `el` for a moment, then the final one; resolves when it has landed */
export async function tumble(el: HTMLElement, face: (n: number) => string, final: number, sides = 6): Promise<void> {
  const calm = reduceMotion(), ms = calm ? 300 : 750, step = calm ? 150 : 75;
  el.classList.add(calm ? 'sv-tumble-calm' : 'sv-tumble');
  let last = final;
  for (let t = 0; t < ms; t += step) {
    let n = 1 + Math.floor(Math.random() * sides); if (n === last) n = n % sides + 1; last = n;
    el.innerHTML = face(n); await wait(step);
  }
  el.innerHTML = face(final);
  el.classList.remove('sv-tumble', 'sv-tumble-calm'); el.classList.add('sv-landed');
  setTimeout(() => el.classList.remove('sv-landed'), 400);
}

/** shakes `el` in time with a count (oẳn... tù... tì!) and resolves on the last beat */
export async function shake(el: HTMLElement, beats = 3): Promise<void> {
  const calm = reduceMotion(), beat = calm ? 200 : 330;
  el.classList.add(calm ? 'sv-shake-calm' : 'sv-shake'); el.style.setProperty('--sv-beat', beat + 'ms');
  await wait(beat * beats);
  el.classList.remove('sv-shake', 'sv-shake-calm');
}

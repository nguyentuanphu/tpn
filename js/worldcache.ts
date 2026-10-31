// @ts-check
// Pictures worked out from the world at start, kept on the device (owner, round 30: "store the generated world on the
// device"). The world is the same for everyone on the same build, so a picture is painted once, saved in the
// "sv-world" cache under the build number, and read back on the next start instead of being painted again.
// Today: the map picture (js/world.js paintMap), the slowest step at start (3 of 9 s in the test browser).
// A new build paints it again (old builds' pictures are deleted here; the service worker leaves this cache alone, since
// clearing it on the first install could wipe a picture saved moments before).
// Without the cache (an old browser, private mode) the picture is simply painted, as before.
//   const pic = cachedCanvas('map', 256, paintMap)  →  pic.canvas (filled once ready), pic.now() (paint now if needed)
import { BUILD } from './build.js';
import { CUSTOM } from './custom.js';
import { MAP_VERSION } from './content/map.js';

const CACHE = 'sv-world';
// (audit, 9 Oct) the family's land and buildings from Studio change the map too, so they are part of the name
const SIG = (() => { let h = 0; const t = JSON.stringify(CUSTOM || {}); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return BUILD + '_' + MAP_VERSION + '_' + (h >>> 0).toString(36); })(); // (round T: and the layout of the valley)
const urlOf = name => `./__sv-world/${SIG}/${name}.png`;

// rows (31 Oct AEDT, #36): the same picture a few rows at a time; painted in slices between frames when nothing waits for
// it, so the first start does not freeze for seconds as the child walks in (now() still paints at once when asked first)
export function cachedCanvas(name: string, size: number, paint: (size: number) => HTMLCanvasElement, after: Promise<unknown> | null = null, rows: ((size: number) => Generator<unknown, HTMLCanvasElement>) | null = null) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  let slicing = false;
  const st = {
    canvas: c, ready: false, from: null as null | 'cache' | 'painted', ms: 0, onReady: null as null | (() => void),
    // the picture now: painted here and then if it is not ready yet (while it is being painted in slices, as far as it got)
    now() { if (!st.ready && !slicing) { const t0 = performance.now(); fill(paint(size)); st.from = 'painted'; st.ms = Math.round(performance.now() - t0); keep(); } return c; }
  };
  const has = () => typeof caches !== 'undefined';
  const fill = (src: CanvasImageSource) => { c.getContext('2d')?.drawImage(src, 0, 0, size, size); st.ready = true; if (st.onReady) st.onReady(); };
  const keep = () => {
    if (!has()) return;
    c.toBlob(b => {
      if (!b) return;
      caches.open(CACHE).then(k => {
        k.keys().then(ks => ks.forEach(r => { if (!r.url.includes(`/${SIG}/`)) k.delete(r); }));
        return k.put(urlOf(name), new Response(b, { headers: { 'Content-Type': 'image/png' } }));
      }).catch(() => { });
    }, 'image/png');
  };
  // paint after the title screen is up, not before it (and, with `after`, once the valley is built: round R, faster launch)
  const sliced = (make: (size: number) => Generator<unknown, HTMLCanvasElement>) => {
    const g = make(size); let ms = 0; slicing = true;
    const tick = () => { if (st.ready) { slicing = false; return; } const t0 = performance.now(); let r = g.next(); while (!r.done && performance.now() - t0 < 10) r = g.next(); ms += performance.now() - t0;
      if (!r.done) { setTimeout(tick, 0); return; } slicing = false; fill(r.value); st.from = 'painted'; st.ms = Math.round(ms); keep(); };
    tick();
  };
  const later = () => (after || Promise.resolve()).then(() => setTimeout(() => { if (st.ready) return; if (rows) sliced(rows); else st.now(); }, 0));
  if (!has()) later();
  else caches.open(CACHE).then(k => k.match(urlOf(name))).then(r => r ? r.blob() : null).then(b => b ? createImageBitmap(b) : null)
    .then(bm => { if (st.ready) return; if (bm) { fill(bm); st.from = 'cache'; } else later(); }).catch(later);
  return st;
}

// Round T4b (finding your way): name tags over the places nearby. When a child comes within about 40 m of a place
// (a city, a village, a landmark, a Memory Village), its name floats above it: at most 4 at once, the nearest
// first, fading in and out over half a second, never covering each other on screen (the farther one moves up, or
// hides when there is still no room). Hidden in calm mode, in films and storybooks, and whenever the valley is
// not being drawn. They are page elements over the 3D view, so they cost no draws.
import { THREE } from './gfx.js';
import { settings } from './state.js';
import { heightAt } from './world.js';
import { withSitePlaces } from './content/activities.js';

const NEAR = 40, MAX = 4, LIFT = 4.5;
// the view's edges the HUD uses: the goal bar, minimap and clock along the top (deeper on a tall phone screen), the
// zoom and camera buttons down the right
const topBand = q => q.h > q.w ? 230 : 120, RIGHT = 90;

export function createNameTags(G) {
  const layer = document.createElement('div'); layer.className = 'nametags'; layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer);
  const views = [], v = new THREE.Vector3();
  const things = () => [...(withSitePlaces(G.PLACES) || []), ...(G.LANDMARKS || [])].filter(p => p.name && isFinite(p.x) && isFinite(p.z));
  let list = null, listAt = 0;
  const hidden = () => settings.calm || G.paused || !!document.querySelector('.theatre.film, .storybook, .gl, .modal');
  // one tag element per place and view, made when first needed; its size is measured once per text
  const tagOf = (V, p) => {
    let t = V.tags.get(p); if (t) return t;
    const el = document.createElement('div'); el.className = 'nametag'; layer.appendChild(el);
    t = { el, text: '', w: 0, h: 0 }; V.tags.set(p, t); return t;
  };
  // (i: which player's view; h: that player; q: the view's rectangle on the page)
  function update(i, h, q) {
    const V = views[i] || (views[i] = { tags: new Map(), seen: 0 }); V.seen = performance.now();
    if (!list || V.seen - listAt > 5000) { list = things(); listAt = V.seen; }   // (cities and Memory Villages join once built)
    const want = new Set();
    if (!hidden() && h && h.cam) {
      const near = list.map(p => ({ p, d: Math.hypot(p.x - h.pos.x, p.z - h.pos.z) })).filter(o => o.d < NEAR).sort((a, b) => a.d - b.d);
      const placed = [];
      for (const { p } of near) {
        if (placed.length >= MAX) break;
        v.set(p.x, heightAt(p.x, p.z) + LIFT, p.z).project(h.cam); if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) continue;
        const t = tagOf(V, p), text = p.name();
        if (t.text !== text) { t.text = text; t.el.textContent = text; t.w = t.el.offsetWidth || text.length * 9 + 24; t.h = t.el.offsetHeight || 30; }
        const x = q.x + (v.x + 1) / 2 * q.w, y = q.y + (1 - v.y) / 2 * q.h;
        const TOP = topBand(q), left = q.x + 8, right = q.x + q.w - RIGHT;
        if (t.w > right - left) continue;
        let r = { x: Math.max(left, Math.min(right - t.w, x - t.w / 2)), y: Math.max(q.y + TOP, y - t.h), w: t.w, h: t.h };
        const hits = a => placed.some(o => a.x < o.x + o.w + 4 && o.x < a.x + a.w + 4 && a.y < o.y + o.h + 4 && o.y < a.y + a.h + 4);
        if (hits(r)) { const top = Math.min(...placed.map(o => o.y)) - t.h - 6, down = Math.max(...placed.map(o => o.y + o.h)) + 6, up = { ...r, y: top }, dn = { ...r, y: down };
          if (top >= q.y + TOP && !hits(up)) r = up; else if (down + t.h < q.y + q.h - 120 && !hits(dn)) r = dn; else continue; }
        if (r.x < q.x + 8 || r.x + r.w > q.x + q.w - RIGHT || r.y < q.y) continue;
        placed.push(r); want.add(t);
        t.el.style.transform = `translate(${Math.round(r.x)}px, ${Math.round(r.y)}px)`;
      }
      V.placed = placed;
    } else V.placed = [];
    for (const t of V.tags.values()) t.el.classList.toggle('on', want.has(t));
  }
  // a view no longer drawn (the valley hidden behind a game, one player left) fades its tags out
  const sweep = () => { const now = performance.now(), off = hidden(); views.forEach((V, i) => { if (V && (off || now - V.seen > 1500) && V.placed && V.placed.length) { V.placed = []; for (const t of V.tags.values()) t.el.classList.remove('on'); } }); requestAnimationFrame(sweep); };
  requestAnimationFrame(sweep);
  return { update, views, shown: () => views.map(V => V ? V.placed || [] : []) };
}

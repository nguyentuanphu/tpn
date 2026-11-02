// (v1.07 split, pure move from js/main.ts) layout: the window's size, two halves for two children, the camera's
// views, a tap in the valley (ray), and walking up to something to use it (goAndDo). js/main.ts calls installLayout
// where this part stood.
import { THREE } from '../gfx.js';
import { settings, saveSettings } from '../state.js';
import { T } from '../i18n.js';
import { SFX } from '../audio.js';
import { ICONS } from '../icons.js';
import { $, dist2, pick, clamp } from '../util.js';
import { initInput } from '../input.js';
import { dialog, reward, modal } from '../ui.js';
import { pic } from '../art.js';
import { events } from '../core/events.js';
import type { SvMain } from '../main.js';

export function installLayout(G: SvMain, D: { twoHalves: () => boolean, renderer: any, titleCam: any, world: any, startAct: (it: any, h: any) => any }) {
  const { twoHalves, renderer, titleCam, world, startAct } = D;
// (Round V, owner's iPhone notes 13 Oct: a black strip at the bottom) on an iPhone in Safari the window's height stops
// above the browser's bottom bar, so the page's dark background showed under the game: the game fills the large
// screen height (100lvh) instead, measured by a hidden probe; the same as the window's height everywhere else
const lvhProbe = (() => { try { if (!CSS.supports('height', '100lvh')) return null; const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none'; document.body.appendChild(d); return d; } catch (e) { return null; } })();
// (owner, 13 Oct AEDT, iOS 27 Home Screen app on r70: still a blur band at the top and the dock cut at the bottom) a
// Home Screen app has no browser bar to float over, and there the large screen height is taller than the space iOS
// gives the page: the dock went under the bottom edge and the page could scroll a little (iOS then draws its blur under
// the status bar). In a Home Screen app the game takes the space it is given and the page cannot scroll. Grown-ups →
// Screen and world → "Fit the screen" can choose by hand (settings.screenFit: 'auto', 'fill' or 'fit').
const homeApp = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
const fitView = () => settings.screenFit === 'fill' ? false : settings.screenFit === 'fit' ? true : homeApp();
const givenH = () => Math.round(Math.min(innerHeight, document.documentElement.clientHeight || innerHeight, window.visualViewport ? visualViewport.height + visualViewport.offsetTop : innerHeight));
let fitWas = null;
const vh = () => {
  const fit = fitView(), h = fit ? givenH() : Math.max(innerHeight, lvhProbe ? lvhProbe.offsetHeight : 0), key = fit + ':' + h;
  if (key !== fitWas) { fitWas = key; const r = document.documentElement; r.classList.toggle('fitview', fit); r.style.setProperty('--appH', h + 'px'); }
  return h;
};
// what the screen says about itself (Grown-ups → Screen and world, for finding out what an iPhone does)
G.screenFacts = () => ({ app: homeApp(), fit: fitView(), inner: innerHeight, client: document.documentElement.clientHeight, visual: window.visualViewport ? Math.round(visualViewport.height) : 0, large: lvhProbe ? lvhProbe.offsetHeight : 0, screen: screen.height, used: vh() });
// Two players face to face (owner, round R: a tablet lying on the table with a child at each end): the screen is cut
// across the middle; player 1 has the near half, player 2 the far half turned half a turn (rot 180) so it faces them.
// On a computer or TV both halves face the same way, side by side ('side'). Grown-ups can pick either (settings.twoView).
const faceToFace = () => settings.twoView === 'face' || (settings.twoView !== 'side' && document.body.classList.contains('touch'));
function rects() {
  const W = innerWidth, H = vh();
  if (G.heroes.length < 2) return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  if (faceToFace()) return [{ x: 0, y: H / 2, w: W, h: H / 2, rot: 0 }, { x: 0, y: 0, w: W, h: H / 2, rot: 180 }];
  return W >= H ? [{ x: 0, y: 0, w: W / 2, h: H, rot: 0 }, { x: W / 2, y: 0, w: W / 2, h: H, rot: 0 }] : [{ x: 0, y: 0, w: W, h: H / 2, rot: 0 }, { x: 0, y: H / 2, w: W, h: H / 2, rot: 0 }];
}
G.rects = rects; G.faceToFace = () => G.heroes.length > 1 && faceToFace();
// Windows (the Pad, games, stories, dialogs, rewards) are added to the page. With two players each one is moved into a
// holder over the half of the child who opened it (G.lastPlayer = whoever touched or pressed last); face to face the far
// child's holder is turned half a turn, so their windows face them (round R, owner: "the other child can keep playing").
G.lastPlayer = 0;
const holders = [0, 1].map(() => { const w = document.createElement('div'); w.className = 'halfwrap'; return w; });
G.halfBusy = i => !!holders[i] && holders[i].isConnected && [...holders[i].children].some(c => !c.classList.contains('out') && !c.classList.contains('confetti') && /(^|\s)(modal|gl|storybook|vc-pop|dialog|reward|chatwin|handpad)(\s|$)/.test(c.className));
const NOT_A_WINDOW = /(^|\s)(hud|stick|facewrap|halfwrap|caption|title|confetti|fade|apfinger|testertoast|packbar|tester-floating|tpanel|tp-picture|ctxlost)(\s|$)/;
function placeHolders() {
  const r = rects(), two = twoHalves();
  holders.forEach((w, i) => {
    if (!two) { [...w.children].forEach(c => document.body.appendChild(c)); w.remove(); return; }
    const q = r[i]; Object.assign(w.style, { left: q.x + 'px', top: q.y + 'px', width: q.w + 'px', height: q.h + 'px' });
    w.classList.toggle('facewrap', q.rot === 180);
  });
}
document.addEventListener('pointerdown', e => {
  if (!twoHalves()) return;
  const t = e.target instanceof Element ? e.target : null, w = t && t.closest('.halfwrap');
  if (w) { G.lastPlayer = holders.findIndex(x => x === w); return; }
  if (t && t.closest('.hud')) { const k = G.huds.findIndex(h => h.root.contains(t)); if (k >= 0) { G.lastPlayer = k; return; } }
  const k = rects().findIndex(q => e.clientX >= q.x && e.clientX < q.x + q.w && e.clientY >= q.y && e.clientY < q.y + q.h); if (k >= 0) G.lastPlayer = k;
}, true);
new MutationObserver(list => {
  if (!twoHalves()) { placeHolders(); return; }
  for (const m of list) for (const n of m.addedNodes) {
    if (!(n instanceof HTMLElement) || n.parentNode !== document.body || n.tagName === 'CANVAS' || n.tagName === 'SCRIPT' || n.id === 'split' || NOT_A_WINDOW.test(n.className)) continue;
    const w = holders[G.lastPlayer] || holders[0];
    if (!w.isConnected) { document.body.appendChild(w); placeHolders(); }
    w.appendChild(n);
  }
}).observe(document.body, { childList: true });
// a turned-round half: its picture is turned in the camera itself, so taps and the 3D view stay matched
const _rotZ = new THREE.Matrix4().makeRotationZ(Math.PI);
function aimCam(h, q) {
  h.cam.aspect = q.w / q.h; h.cam.updateProjectionMatrix();
  if (q.rot === 180) { h.cam.projectionMatrix.premultiply(_rotZ); h.cam.projectionMatrixInverse.copy(h.cam.projectionMatrix).invert(); }
}
function resize() {
  renderer.setSize(innerWidth, vh());
  const r = rects();
  G.heroes.forEach((h, i) => { h.cam.aspect = r[i].w / r[i].h; h.cam.updateProjectionMatrix(); G.huds[i] && G.huds[i].layout(r[i], G.heroes.length > 1); });
  titleCam.aspect = innerWidth / vh(); titleCam.updateProjectionMatrix(); placeHolders();
  const sp = $('#split'); sp.hidden = G.heroes.length < 2;
  // a small round switch in the middle of the line: face to face ⇄ side by side, any time (round R, owner)
  let sw = sp.querySelector('.viewsw');
  if (!sw) { sw = document.createElement('button'); sw.className = 'viewsw'; sw.onpointerdown = e => { e.stopPropagation(); }; sw.onclick = e => { e.stopPropagation(); settings.twoView = faceToFace() ? 'side' : 'face'; saveSettings(); SFX.tap(); resize(); }; sp.appendChild(sw); }
  sw.innerHTML = faceToFace() ? ICONS.sideView : ICONS.faceView; sw.setAttribute('aria-label', faceToFace() ? T('Sit side by side', 'Ngồi cạnh nhau') : T('Sit face to face', 'Ngồi đối diện nhau'));
  if (G.heroes.length > 1) { const v = innerWidth >= vh() && !faceToFace(); Object.assign(sp.style, v ? { left: innerWidth / 2 - 2 + 'px', top: 0, width: '4px', height: '100%' } : { top: vh() / 2 - 2 + 'px', left: 0, height: '4px', width: '100%' }); }
}
addEventListener('resize', resize);
// Phones (especially iPhone home-screen apps) sometimes report the wrong size after rotating or after the
// keyboard closes, leaving part of the screen empty. Check often and fix the size whenever it drifts.
addEventListener('orientationchange', () => setTimeout(resize, 300));
if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(resize, 100));
addEventListener('focusout', () => setTimeout(() => { window.scrollTo(0, 0); resize(); }, 150));
setInterval(() => { const c = renderer.domElement; if (Math.abs(c.clientWidth - innerWidth) > 2 || Math.abs(c.clientHeight - vh()) > 2) resize(); }, 700);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function onTap(i, x, y) {
  const h = G.heroes[i]; if (!h || G.paused) return;
  if (h._dancing) { G.places.note(h); return; }
  const r = rects()[i]; ndc.set((x - r.x) / r.w * 2 - 1, -((y - r.y) / r.h) * 2 + 1);
  aimCam(h, r); ray.setFromCamera(ndc, h.cam);
  // tapping a bubble, a water drop or a ripe crop walks there and does it
  const hitB = ray.intersectObjects([...(G.bubbleIcons || []), ...(G.tapTargets || [])], false).find(x => x.object.visible);
  if (hitB) { goAndDo(h, hitB.object.userData.it); return; }
  // (tester's notes, 12 Oct) inside a house the floor is the room's, not the valley's ground: a tap on (or right by)
  // someone or something in the room walks up to it and does it, a tap on the floor walks there
  if (G.homes && G.homes.isInside(h)) {
    const v = new THREE.Vector3(), px = (q, dy) => { v.set(q.x, (q.y ?? h.pos.y) + dy, q.z).project(h.cam); return Math.hypot((v.x - ndc.x) * r.w / 2, (v.y - ndc.y) * r.h / 2); };
    let it = null, bd = 70;
    for (const q of G.interactables) { if (q.y == null || Math.abs(q.y - h.pos.y) > 5 || dist2(h.pos.x, h.pos.z, q.x, q.z) > 16 || (q.visible && !q.visible(h))) continue; const d = Math.min(px(q, .3), px(q, 1.2)); if (d < bd) { bd = d; it = q; } }
    if (it) { goAndDo(h, it); return; }
    const pt = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -h.pos.y), v);
    if (pt && dist2(h.pos.x, h.pos.z, pt.x, pt.z) < 16) { h.goal = { x: pt.x, z: pt.z }; G.fx(pt.x, h.pos.y + .3, pt.z, '✨'); }
    return;
  }
  // tap a person, animal, tree or critter and it reacts (js/fun.js)
  if (G.tapReact && G.tapReact(h, ray)) return;
  const hit = ray.intersectObject(world.terrain, false)[0];
  if (hit) { h.goal = { x: hit.point.x, z: hit.point.z }; G.fx(hit.point.x, hit.point.y + .3, hit.point.z, '✨'); }
}
function goAndDo(h, it) {
  if (!it) return;
  if (dist2(h.pos.x, h.pos.z, it.x, it.z) < (it.plot ? 7 : it.r)) { SFX.tap(); if (twoHalves()) G.lastPlayer = Math.max(0, G.heroes.indexOf(h)); startAct(it, h); return; }
  h.goal = approach(h, it); h.goalAct = it;
}
G.goAndDo = goAndDo;
// stop just in front of an activity rather than inside it
function approach(h, it) { const dx = h.pos.x - it.x, dz = h.pos.z - it.z, d = Math.hypot(dx, dz) || 1, k = Math.max(.5, Math.min(it.r * .6, 2.5)); return { x: it.x + dx / d * k, z: it.z + dz / d * k }; }
const poll = initInput(renderer.domElement, rects, () => G.paused || !G.heroes.length, onTap);
// the mouse wheel zooms the screen under the pointer (split screen has two)
renderer.domElement.addEventListener('wheel', e => { const r = rects(), k = Math.max(0, r.findIndex(q => e.clientX >= q.x && e.clientX < q.x + q.w && e.clientY >= q.y && e.clientY < q.y + q.h)); G.zoomBy(k, e.deltaY > 0 ? 1.1 : .9, true); }, { passive: true });
// zooming out also lifts the camera up, so rooftops no longer pull it back in (it used to look as if zoom did nothing)
// camera views: behind (normal) → high up → street level (to see house fronts) → my face (close-up when standing still)
const VIEWS = [['follow', '🎥', 'Behind me', 'Sau lưng'], ['high', '🦅', 'High up', 'Trên cao'], ['street', '🏘️', 'Street view', 'Ngang phố'], ['face', '😊', 'My face', 'Mặt của con']];
G.VIEWS = VIEWS;
G.getViews = i => { const h = G.heroes[i], riding = h && (h.riding || (h.carry && h.state === 'sit')) && settings.ridePov !== false; return riding ? VIEWS.map(v => v[0] === 'follow' ? ['follow', v[1], 'Rider’s eyes', 'Qua mắt người cưỡi'] : v) : VIEWS; };
G.setView = (i, id, quiet) => { const h = G.heroes[i]; if (!h) return; h.view = id; h.manualCamT = 0; const views = G.getViews(i), v = views.find(v => v[0] === id) || views[0]; !quiet && G.huds[i] && G.huds[i].toast(v[1] + ' ' + T(v[2], v[3])); const b = G.huds[i] && G.huds[i].q('.z-view'); if (b) { const k = b.querySelector('kbd'); b.innerHTML = pic(v[1]); if (k) b.append(k); } }; // (the button shows our drawing of the view: writing the emoji as text left it blank)
G.cycleView = i => { const h = G.heroes[i]; if (!h) return; SFX.tap(); const k = VIEWS.findIndex(v => v[0] === (h.view || 'follow')); G.setView(i, VIEWS[(k + 1) % VIEWS.length][0]); };
G.zoomBy = (i, f, quiet) => {
  const h = G.heroes[i]; if (!h) return;
  const z = clamp((h.zoom || 1) * f, .35, 2.2);
  if (Math.abs(z - (h.zoom || 1)) < .001) { if (!quiet) { SFX.no && SFX.no(); G.huds[i] && G.huds[i].toast(f < 1 ? T('That is as close as it goes!', 'Gần nhất rồi!') : T('That is as far as it goes!', 'Xa nhất rồi!')); } return; }
  h.zoom = z; h.manualCamT = 0; if (!quiet) SFX.tap();
};
  return { goAndDo, ray, faceToFace, vh, rects, aimCam, resize, poll, VIEWS };
}

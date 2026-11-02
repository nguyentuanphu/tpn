// In-game ads, made by the family in Sparkle Studio (content pack "ads"). OFF unless the Studio switched them on:
// with no "ads" in the content pack, or enabled not true, this file shows nothing at all.
// When on, an ad is small and inside the valley, never in front of play:
//   · boards: a few painted signboards beside the roads near the towns, each with the word "Ad" / "Quảng cáo"
//   · gameend: a small card under the win screen of a mini-game, at most a few times a day
// Nothing is tracked or sent anywhere (no cookies, no ad network, no counting); the pictures come with the game.
// A link only opens after a grown-up answers a sum, and opens outside the game.
import { THREE, P, merge, toonVC } from './gfx.js';
import { T } from './i18n.js';
import { CUSTOM } from './custom.js';
import { el, esc } from './util.js';
import { heightAt, roadDist, WATER, CITIES } from './world.js';
import { SFX } from './audio.js';

const str = (v, n = 120) => typeof v === 'string' ? v.slice(0, n) : '';
const okImg = v => typeof v === 'string' && /^content\/ads\/[\w.-]+\.(jpg|jpeg|png)$/.test(v);
const okLink = v => typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/.test(v);
export const ADS = (() => {
  const a = CUSTOM.ads; if (!a || a.enabled !== true) return null;
  const items = (Array.isArray(a.items) ? a.items : []).filter(x => x && x.active !== false && okImg(x.image)).slice(0, 30).map(x => ({
    image: x.image, by: str(x.by, 60), en: str(x.en) || str(x.vi), vi: str(x.vi) || str(x.en), link: okLink(x.link) ? x.link : '',
    where: Array.isArray(x.where) && x.where.length ? x.where.filter(w => w === 'boards' || w === 'gameend') : ['boards', 'gameend']
  }));
  if (!items.length) return null;
  return { items, perDay: Math.max(0, Math.min(10, a.perDay | 0 || 3)) };
})();
const pick = where => { const L = ADS ? ADS.items.filter(x => x.where.includes(where)) : []; return L.length ? L[Math.floor(Math.random() * L.length)] : null; };

// a grown-up check: a sum a young child can't easily do, typed in
export function grownupGate(onPass) {
  const a = 12 + Math.floor(Math.random() * 30), b = 7 + Math.floor(Math.random() * 20);
  const m = el('div', 'modal adgate', `<div class="card"><h3>${T('Ask a grown-up', 'Nhờ người lớn nhé')}</h3><p>${T('This opens a website outside the game. Grown-ups: what is', 'Mở một trang web bên ngoài trò chơi. Người lớn: ')} <b>${a} + ${b}</b>${T('?', ' bằng bao nhiêu?')}</p>
    <input type="number" inputmode="numeric" class="adg-in" aria-label="${T('Answer', 'Kết quả')}"><div class="actions"><button class="btn adg-no">${T('Cancel', 'Thôi')}</button><button class="btn primary adg-ok">${T('Open', 'Mở')}</button></div></div>`);
  document.body.appendChild(m);
  const close = () => m.remove();
  m.querySelector('.adg-no').onclick = close;
  m.querySelector('.adg-ok').onclick = () => { if (+m.querySelector('.adg-in').value === a + b) { close(); onPass(); } else { SFX.no && SFX.no(); close(); } };
}
const openAd = ad => { if (!ad.link) return; grownupGate(() => { try { window.open(ad.link, '_blank', 'noopener,noreferrer'); } catch (e) { } }); };

// the small card under a mini-game's win screen (or '' when there is nothing to show today)
const DAY = 'sv2_adday';
export function gameEndAd() {
  if (!ADS) return null;
  let d = {}; try { d = JSON.parse(localStorage.getItem(DAY) || '{}'); } catch (e) { }
  const today = new Date().toDateString(); if (d.day !== today) d = { day: today, n: 0 };
  if (d.n >= ADS.perDay) return null;
  const ad = pick('gameend'); if (!ad) return null;
  d.n++; try { localStorage.setItem(DAY, JSON.stringify(d)); } catch (e) { }
  const c = el('div', 'gl-ad', `<small>${T('Ad', 'Quảng cáo')}${ad.by ? ' · ' + esc(ad.by) : ''}</small><img src="${esc(ad.image)}" alt=""><span>${esc(T(ad.en, ad.vi))}</span>`);
  if (ad.link) c.onclick = e => { e.stopPropagation(); openAd(ad); };
  c.querySelector('img').onerror = () => c.remove(); // (r81) a picture not published yet
  return c;
}

// signboards beside the roads near the towns
export function createAds(G) {
  if (!ADS) return;
  const { scene, world } = G, loader = new THREE.TextureLoader();
  CITIES.slice(0, 7).forEach((c, k) => {
    const ad = pick('boards'); if (!ad || k % 2) return; // a few, not one at every town
    const [gx, gz] = c.gates[0]; let at = null;
    for (let r = 10; r < 26 && !at; r += 2) for (let s = 0; s < 12 && !at; s++) { const a = s / 12 * Math.PI * 2, x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r, rd = roadDist(x, z);
      if (rd.d > rd.road.w / 2 + 2.5 && rd.d < rd.road.w / 2 + 6 && heightAt(x, z) > WATER + .8 && !world.colliders.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 2) && !world.boxes.some(b => x > b.x0 - 2 && x < b.x1 + 2 && z > b.z0 - 2 && z < b.z1 + 2)) at = [x, z]; }
    if (!at) return;
    const [x, z] = at, y = heightAt(x, z), face = Math.atan2(gx - x, gz - z);
    const frame = new THREE.Mesh(merge([P(new THREE.BoxGeometry(.18, 3.2, .18), '#7a5236', [-1.6, 1.6, 0]), P(new THREE.BoxGeometry(.18, 3.2, .18), '#7a5236', [1.6, 1.6, 0]), P(new THREE.BoxGeometry(3.6, 2.2, .14), '#fff8e8', [0, 2.6, -.04])]), toonVC());
    // (r81) the ad's words can come live from Studio before its new picture is published: no picture, no signboard
    const col = { x, z, r: 1.8 }, gone = () => { scene.remove(frame); const ci = world.colliders.indexOf(col); if (ci >= 0) world.colliders.splice(ci, 1); const i = G.interactables.findIndex(o => o.id === 'ad' + k); if (i >= 0) G.interactables.splice(i, 1); };
    frame.position.set(x, y, z); frame.rotation.y = face; scene.add(frame); world.colliders.push(col);
    const img = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.9), new THREE.MeshBasicMaterial({ map: loader.load(ad.image, undefined, undefined, gone) })); img.position.set(0, 2.6, .05); frame.add(img); const back = img.clone(); back.position.z = -.13; back.rotation.y = Math.PI; frame.add(back); // (seen from both sides)
    const lab = document.createElement('canvas'); lab.width = 128; lab.height = 40; const g = lab.getContext('2d'); g.fillStyle = '#3b2a4f'; g.fillRect(0, 0, 128, 40); g.fillStyle = '#fff'; g.font = 'bold 24px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T('Ad', 'Quảng cáo'), 64, 21);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(.8, .25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lab) })); tag.position.set(1.15, 3.55, .06); frame.add(tag); const tb = tag.clone(); tb.position.set(-1.15, 3.55, -.14); tb.rotation.y = Math.PI; frame.add(tb);
    if (ad.link) G.interactables.push({ id: 'ad' + k, x: x + Math.sin(face) * 2, z: z + Math.cos(face) * 2, r: 2.4, icon: 'ℹ️', label: () => T('About this sign', 'Về tấm biển này'), act: () => openAd(ad) });
  });
}

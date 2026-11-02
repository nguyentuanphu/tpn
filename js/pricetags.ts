// (Round U, owner 11 Oct: price pictures) A little price sign over every food stall and kiosk: one gold coin picture for
// each coin it costs (so a child who cannot read numbers yet can count them) and the price in the money of the chosen
// language. Built after the title (js/main.js) from the stalls registry (world.stalls) and the sellers (VENDORS).
import { THREE } from './gfx.js';
import { onLang } from './i18n.js';
import { VENDORS } from './vendors.js';
import { fmt } from './money.js';

export function createPriceTags(G) {
  const { scene, world } = G; world.priceTags = [];
  for (const s of world.stalls || []) {
    const v = s.tap && s.tap.startsWith('v_') && VENDORS.find(x => x.id === s.tap.slice(2));
    if (!v || !v.food || !Number.isFinite(v.food[3])) continue;
    const price = v.food[3], c = document.createElement('canvas'); c.width = 320; c.height = 160; const g = c.getContext('2d');
    const draw = () => {
      g.clearRect(0, 0, 320, 160); g.fillStyle = '#fff8e6'; g.strokeStyle = '#8a5a3b'; g.lineWidth = 8;
      g.beginPath(); g.roundRect ? g.roundRect(6, 6, 308, 148, 22) : g.rect(6, 6, 308, 148); g.fill(); g.stroke();
      // the coins: up to 5 in a row, two rows (prices are 10 or less)
      const n = Math.min(price, 10), rows = n > 5 ? 2 : 1;
      for (let i = 0; i < n; i++) { const r = i < 5 ? 0 : 1, k = r ? i - 5 : i, inRow = r ? n - 5 : Math.min(n, 5), x = 160 + (k - (inRow - 1) / 2) * 48, y = rows === 2 ? 34 + r * 42 : 52;
        g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fillStyle = '#f0c548'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#b8862a'; g.stroke();
        g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = '#d9a63a'; g.stroke(); }
      g.fillStyle = '#5a3a20'; g.font = 'bold 44px Fredoka, "Baloo 2", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fmt(price), 160, rows === 2 ? 128 : 116);
    };
    draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); sp.scale.set(1.3, .65, 1);
    // on the counter's front corner, beside the seller (not over their name)
    const fx = Math.sin(s.face || 0), fz = Math.cos(s.face || 0), side = Math.max(.95, s.w / 2 - .65), px = s.x + fx * (s.d / 2 + .3) + fz * side, pz = s.z + fz * (s.d / 2 + .3) - fx * side;
    const y = world.groundAt ? world.groundAt(px, pz) : 0; sp.position.set(px, y + 1.55, pz); scene.add(sp);
    world.priceTags.push({ id: v.id, price, x: s.x, z: s.z, sp, draw: () => c.toDataURL().length });
  }
  // (batch rollout) Studio switch 'priceTags': off or not started yet, hidden unless a child playing bought with them on
  world.updaters && world.updaters.push(() => { const on = !G.keep || G.keep('priceTags'); if (world.priceTags.length && world.priceTags[0].sp.visible !== on) world.priceTags.forEach(t => { t.sp.visible = on; }); });
  return world.priceTags;
}
